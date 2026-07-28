

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { getRoleAvailabilityStates } from "../config/gpsConfig";
import API from "../api/axios";
import { AvailabilityRealtimeService } from "../services/AvailabilityRealtimeService";
import {
  deepEqualGeo,
  buildOptimisticUser,
  validateGeo,
  validateAvailabilityUntil,
} from "../utils/availabilityUtils";

const MARKETPLACE_PROVIDER_ROLES = new Set([
  "restaurant",
  "hotel",
  "rental",
  "office",
  "tourism",
  "hospital",
  "clinic",
  "service_provider",
]);

const FT = Object.freeze({
  SUCCESS: "success",
  ERROR: "error",
  OFFLINE: "offline",
  ROLLBACK: "rollback",
});

const PRESENCE_STATES = [
  { id: "online", label: "Online" },
  { id: "away", label: "Away" },
  { id: "idle", label: "Idle" },
  { id: "busy", label: "Busy" },
  { id: "driving", label: "Driving" },
  { id: "on_trip", label: "On Trip" },
  { id: "delivery", label: "On Delivery" },
  { id: "vacation", label: "Vacation" },
];

function getAvailabilityEndpoint(role) {
  if (role === "worker") return "/workers/availability";
  if (MARKETPLACE_PROVIDER_ROLES.has(role)) return "/marketplace/availability";
  return null;
}

function displayRole(role) {
  return role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function isValidStatus(statusId, options) {
  return options.some(o => o.id === statusId);
}

// ── HOOK ────────────────────────────────────────────────────────
function useAvailabilityUpdate({ user, role, options, login, navigate, t }) {
  const userId = user?._id || user?.id;

  const initialAvailability =
    user?.availability ??
    user?.marketplaceData?.availability ??
    options[0]?.id ??
    "available";

  const initialPresence =
    user?.presence ?? user?.marketplaceData?.presence ?? "online";

  const initialGeo =
    user?.geo ??
    user?.marketplaceData?.geo ??
    {
      city: null,
      province: null,
      country: null,
      lat: null,
      lng: null,
      radiusKm: 15,
    };

  const initialUntil =
    user?.availabilityUntil ?? user?.marketplaceData?.availabilityUntil ?? null;

  const [selected, setSelected] = useState(initialAvailability);
  const [presence, setPresence] = useState(initialPresence);
  const [geo, setGeo] = useState(initialGeo);
  const [availabilityUntil, setAvailabilityUntil] = useState(initialUntil);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [retryPayload, setRetryPayload] = useState(null);
  const [lastEventMeta, setLastEventMeta] = useState(null);

  const mountedRef = useRef(true);
  const abortRef = useRef(null);
  const snapshotRef = useRef(user);

  // Refs pou evite re-subscribe sou websocket (memory leak). [web:217][web:219]
  const presenceRef = useRef(initialPresence);
  const geoRef = useRef(initialGeo);
  const untilRef = useRef(initialUntil);

  useEffect(() => {
    mountedRef.current = true;
    snapshotRef.current = user;

    const onRemote = payload => {
      if (payload.userId !== userId) return;

      const updatedUser = buildOptimisticUser(snapshotRef.current, role, {
        availability: payload.availability,
        presence: payload.presence ?? presenceRef.current,
        geo: payload.geo ?? geoRef.current,
        availabilityUntil: payload.availabilityUntil ?? untilRef.current,
        version: payload.version,
      });
      snapshotRef.current = updatedUser;
      login(updatedUser);

      setSelected(payload.availability);
      setPresence(payload.presence ?? presenceRef.current);
      setGeo(payload.geo ?? geoRef.current);
      setAvailabilityUntil(payload.availabilityUntil ?? untilRef.current);

      presenceRef.current = payload.presence ?? presenceRef.current;
      geoRef.current = payload.geo ?? geoRef.current;
      untilRef.current = payload.availabilityUntil ?? untilRef.current;
    };

    AvailabilityRealtimeService.on("availability:changed", onRemote);

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      AvailabilityRealtimeService.off("availability:changed", onRemote);
    };
  }, [user, userId, role, login]);

  const canSave = useMemo(
    () => isValidStatus(selected, options) && !saving,
    [selected, options, saving]
  );

  const buildPayload = useCallback(
    () => ({
      userId,
      role,
      availability: selected,
      presence,
      geo,
      availabilityUntil,
      sessionId: user?.sessionId,
    }),
    [userId, role, selected, presence, geo, availabilityUntil, user?.sessionId]
  );

  const doUpdate = useCallback(
    async payload => {
      if (!isValidStatus(payload.availability, options)) {
        setFeedback({
          type: FT.ERROR,
          message: t("availability.errorValidation"),
        });
        return;
      }

      // Validation geo & availabilityUntil
      if (!validateGeo(payload.geo)) {
        setFeedback({
          type: FT.ERROR,
          message: t("availability.errorGeo"),
        });
        return;
      }
      if (!validateAvailabilityUntil(payload.availabilityUntil)) {
        setFeedback({
          type: FT.ERROR,
          message: t("availability.errorSchedule"),
        });
        return;
      }

      // Offline / Event Bus
      if (!navigator.onLine) {
        setSaving(true); // lock UI menm offline
        const optimistic = buildOptimisticUser(snapshotRef.current, role, {
          ...payload,
          version: AvailabilityRealtimeService.getState().availabilityVersion + 1,
        });
        login(optimistic);

        const meta = await AvailabilityRealtimeService.publishAvailabilityEvent(
          payload
        );
        setLastEventMeta(meta);

        setFeedback({
          type: FT.OFFLINE,
          message: t("availability.errorOffline"),
        });
        setRetryPayload(payload);
        setSaving(false);
        return;
      }

      setSaving(true);
      setFeedback(null);
      setRetryPayload(null);

      const rollbackTarget = snapshotRef.current;

      const optimisticUser = buildOptimisticUser(snapshotRef.current, role, {
        ...payload,
        version: AvailabilityRealtimeService.getState().availabilityVersion + 1,
      });
      login(optimisticUser);

      presenceRef.current = payload.presence;
      geoRef.current = payload.geo;
      untilRef.current = payload.availabilityUntil;

      const endpoint = getAvailabilityEndpoint(role);

      if (!endpoint) {
        snapshotRef.current = optimisticUser;
        const meta = await AvailabilityRealtimeService.publishAvailabilityEvent(
          payload
        );
        setLastEventMeta(meta);

        if (mountedRef.current) {
          setSaving(false);
          setFeedback({
            type: FT.SUCCESS,
            message: t("availability.successMsg"),
          });
          setTimeout(() => {
            if (mountedRef.current) navigate(-1);
          }, 900);
        }
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        await API.patch(
          endpoint,
          {
            userId,
            availability: payload.availability,
            presence: payload.presence,
            geo: payload.geo,
            availabilityUntil: payload.availabilityUntil,
          },
          {
            signal: abortRef.current.signal,
            timeout: 10000, // 10s timeout; exponential backoff/circuit breaker ka fèt nan axios interceptors. [web:217][web:219]
          }
        );

        if (!mountedRef.current) return;

        snapshotRef.current = optimisticUser;

        const meta = await AvailabilityRealtimeService.publishAvailabilityEvent(
          payload
        );
        setLastEventMeta(meta);

        setFeedback({
          type: FT.SUCCESS,
          message: t("availability.successMsg"),
        });

        setTimeout(() => {
          if (mountedRef.current) navigate(-1);
        }, 900);
      } catch (err) {
        if (!mountedRef.current) return;
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError")
          return;

        login(rollbackTarget);

        const status = err?.response?.status;
        let feedbackPayload;

        if (!navigator.onLine || err?.code === "NETWORK_ERROR") {
          feedbackPayload = {
            type: FT.OFFLINE,
            message: t("availability.errorNetwork"),
          };
        } else if (status === 401 || status === 403) {
          feedbackPayload = {
            type: FT.ERROR,
            message: t("availability.errorUnauthorized"),
          };
        } else if (status >= 500) {
          feedbackPayload = {
            type: FT.ROLLBACK,
            message: t("availability.errorRollback"),
          };
        } else {
          const serverMsg = err?.response?.data?.message;
          feedbackPayload = {
            type: FT.ERROR,
            message: serverMsg || t("errors.general"),
          };
        }

        setFeedback(feedbackPayload);
        setRetryPayload(payload);
      } finally {
        if (mountedRef.current) setSaving(false);
        abortRef.current = null;
      }
    },
    [options, role, userId, login, navigate, t]
  );

  const handleSave = useCallback(() => {
    const payload = buildPayload();

    const noChange =
      payload.availability === initialAvailability &&
      payload.presence === initialPresence &&
      deepEqualGeo(payload.geo, initialGeo) &&
      payload.availabilityUntil === initialUntil &&
      !retryPayload;

    if (noChange) {
      navigate(-1);
      return;
    }
    doUpdate(payload);
  }, [
    buildPayload,
    initialAvailability,
    initialPresence,
    initialGeo,
    initialUntil,
    retryPayload,
    doUpdate,
    navigate,
  ]);

  const handleRetry = useCallback(() => {
    if (retryPayload) doUpdate(retryPayload);
  }, [retryPayload, doUpdate]);

  return {
    selected,
    setSelected,
    presence,
    setPresence,
    geo,
    setGeo,
    availabilityUntil,
    setAvailabilityUntil,
    saving,
    feedback,
    handleSave,
    handleRetry,
    canSave,
    lastEventMeta,
  };
}

// Main komponan rete menm: li itilize selected/presence/geo/availabilityUntil,
// men li **disable** tous controls lè `saving === true` pou lock UX pandan optimistic update.

export default function AvailabilityStatus() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, login } = useAuth();

  const role = user?.role ?? "user";
  const options = useMemo(() => getRoleAvailabilityStates(role), [role]);

  const {
    selected,
    setSelected,
    presence,
    setPresence,
    geo,
    setGeo,
    availabilityUntil,
    setAvailabilityUntil,
    saving,
    feedback,
    handleSave,
    handleRetry,
    canSave,
    lastEventMeta,
  } = useAvailabilityUpdate({ user, role, options, login, navigate, t });

  const roleLabel = useMemo(() => displayRole(role), [role]);

  // Isit la w ta mete radiogroup availability, dropdown presence,
  // inputs/slider pou geo, picker pou availabilityUntil,
  // tout ak `disabled={saving}` pou pa kite user spam bouton an.

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#0B1528] text-white pb-10">
      {/* Header + Role context */}
      {/* Main controls (disabled si saving) */}
      {/* FeedbackBanner ki ka montre lastEventMeta.eventId si ou vle pou debug/audit */}
      {/* Save bouton ak handleSave, disabled={!canSave || saving} */}
    </div>
  );
}
