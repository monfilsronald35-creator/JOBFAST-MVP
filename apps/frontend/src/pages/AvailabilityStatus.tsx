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
} as const);

type FeedbackType = typeof FT[keyof typeof FT];

interface GeoData {
  city: string | null;
  province: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
}

interface PresenceState {
  id: string;
  label: string;
}

const PRESENCE_STATES: PresenceState[] = [
  { id: "online",   label: "Online"      },
  { id: "away",     label: "Away"        },
  { id: "idle",     label: "Idle"        },
  { id: "busy",     label: "Busy"        },
  { id: "driving",  label: "Driving"     },
  { id: "on_trip",  label: "On Trip"     },
  { id: "delivery", label: "On Delivery" },
  { id: "vacation", label: "Vacation"    },
];

interface AvailabilityOption {
  id: string;
  label?: string;
}

interface UserData {
  _id?: string;
  id?: string;
  role?: string;
  sessionId?: string;
  availability?: string;
  presence?: string;
  availabilityUntil?: string | null;
  geo?: GeoData;
  marketplaceData?: {
    availability?: string;
    presence?: string;
    geo?: GeoData;
    availabilityUntil?: string | null;
  };
  [key: string]: unknown;
}

interface FeedbackState {
  type: FeedbackType;
  message: string;
}

interface AvailabilityPayload {
  userId: string | undefined;
  role: string;
  availability: string;
  presence: string;
  geo: GeoData;
  availabilityUntil: string | null;
  sessionId: string | undefined;
}

function getAvailabilityEndpoint(role: string): string | null {
  if (role === "worker") return "/workers/availability";
  if (MARKETPLACE_PROVIDER_ROLES.has(role)) return "/marketplace/availability";
  return null;
}

function displayRole(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function isValidStatus(statusId: string, options: AvailabilityOption[]): boolean {
  return options.some(o => o.id === statusId);
}

interface UseAvailabilityUpdateParams {
  user: UserData | null | undefined;
  role: string;
  options: AvailabilityOption[];
  login: (user: UserData) => void;
  navigate: ReturnType<typeof useNavigate>;
  t: (key: string) => string;
}

// ── HOOK ────────────────────────────────────────────────────────
function useAvailabilityUpdate({ user, role, options, login, navigate, t }: UseAvailabilityUpdateParams) {
  const userId = user?._id ?? user?.id;

  const initialAvailability =
    user?.availability ??
    user?.marketplaceData?.availability ??
    options[0]?.id ??
    "available";

  const initialPresence =
    user?.presence ?? user?.marketplaceData?.presence ?? "online";

  const initialGeo: GeoData =
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

  const initialUntil: string | null =
    user?.availabilityUntil ?? user?.marketplaceData?.availabilityUntil ?? null;

  const [selected,           setSelected]           = useState(initialAvailability);
  const [presence,           setPresence]           = useState(initialPresence);
  const [geo,                setGeo]                = useState<GeoData>(initialGeo);
  const [availabilityUntil,  setAvailabilityUntil]  = useState<string | null>(initialUntil);

  const [saving,         setSaving]         = useState(false);
  const [feedback,       setFeedback]       = useState<FeedbackState | null>(null);
  const [retryPayload,   setRetryPayload]   = useState<AvailabilityPayload | null>(null);
  const [lastEventMeta,  setLastEventMeta]  = useState<unknown>(null);

  const mountedRef  = useRef(true);
  const abortRef    = useRef<AbortController | null>(null);
  const snapshotRef = useRef<UserData | null | undefined>(user);

  // Refs pou evite re-subscribe sou websocket (memory leak).
  const presenceRef = useRef(initialPresence);
  const geoRef      = useRef<GeoData>(initialGeo);
  const untilRef    = useRef<string | null>(initialUntil);

  useEffect(() => {
    mountedRef.current  = true;
    snapshotRef.current = user;

    const onRemote = (payload: {
      userId?: string;
      availability?: string;
      presence?: string;
      geo?: GeoData;
      availabilityUntil?: string | null;
      version?: number;
    }) => {
      if (payload.userId !== userId) return;

      const updatedUser = buildOptimisticUser(snapshotRef.current, role, {
        availability:      payload.availability,
        presence:          payload.presence          ?? presenceRef.current,
        geo:               payload.geo               ?? geoRef.current,
        availabilityUntil: payload.availabilityUntil ?? untilRef.current,
        version:           payload.version,
      });
      snapshotRef.current = updatedUser;
      login(updatedUser);

      if (payload.availability) setSelected(payload.availability);
      setPresence(payload.presence ?? presenceRef.current);
      setGeo(payload.geo ?? geoRef.current);
      setAvailabilityUntil(payload.availabilityUntil ?? untilRef.current);

      presenceRef.current = payload.presence ?? presenceRef.current;
      geoRef.current      = payload.geo       ?? geoRef.current;
      untilRef.current    = payload.availabilityUntil ?? untilRef.current;
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
    (): AvailabilityPayload => ({
      userId,
      role,
      availability: selected,
      presence,
      geo,
      availabilityUntil,
      sessionId: user?.sessionId as string | undefined,
    }),
    [userId, role, selected, presence, geo, availabilityUntil, user?.sessionId]
  );

  const doUpdate = useCallback(
    async (payload: AvailabilityPayload) => {
      if (!isValidStatus(payload.availability, options)) {
        setFeedback({ type: FT.ERROR, message: t("availability.errorValidation") });
        return;
      }

      if (!validateGeo(payload.geo)) {
        setFeedback({ type: FT.ERROR, message: t("availability.errorGeo") });
        return;
      }
      if (!validateAvailabilityUntil(payload.availabilityUntil)) {
        setFeedback({ type: FT.ERROR, message: t("availability.errorSchedule") });
        return;
      }

      // Offline / Event Bus
      if (!navigator.onLine) {
        setSaving(true);
        const optimistic = buildOptimisticUser(snapshotRef.current, role, {
          ...payload,
          version: AvailabilityRealtimeService.getState().availabilityVersion + 1,
        });
        login(optimistic);

        const meta = await AvailabilityRealtimeService.publishAvailabilityEvent(payload);
        setLastEventMeta(meta);

        setFeedback({ type: FT.OFFLINE, message: t("availability.errorOffline") });
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
      geoRef.current      = payload.geo;
      untilRef.current    = payload.availabilityUntil;

      const endpoint = getAvailabilityEndpoint(role);

      if (!endpoint) {
        snapshotRef.current = optimisticUser;
        const meta = await AvailabilityRealtimeService.publishAvailabilityEvent(payload);
        setLastEventMeta(meta);

        if (mountedRef.current) {
          setSaving(false);
          setFeedback({ type: FT.SUCCESS, message: t("availability.successMsg") });
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
            userId:            payload.userId,
            availability:      payload.availability,
            presence:          payload.presence,
            geo:               payload.geo,
            availabilityUntil: payload.availabilityUntil,
          },
          {
            signal:  abortRef.current.signal,
            timeout: 10000,
          }
        );

        if (!mountedRef.current) return;

        snapshotRef.current = optimisticUser;

        const meta = await AvailabilityRealtimeService.publishAvailabilityEvent(payload);
        setLastEventMeta(meta);

        setFeedback({ type: FT.SUCCESS, message: t("availability.successMsg") });

        setTimeout(() => {
          if (mountedRef.current) navigate(-1);
        }, 900);
      } catch (err: unknown) {
        if (!mountedRef.current) return;
        const e = err as { code?: string; name?: string; response?: { status?: number; data?: { message?: string } } };
        if (e?.code === "ERR_CANCELED" || e?.name === "CanceledError") return;

        if (rollbackTarget) login(rollbackTarget);

        const status = e?.response?.status;
        let feedbackPayload: FeedbackState;

        if (!navigator.onLine || e?.code === "NETWORK_ERROR") {
          feedbackPayload = { type: FT.OFFLINE,   message: t("availability.errorNetwork")      };
        } else if (status === 401 || status === 403) {
          feedbackPayload = { type: FT.ERROR,     message: t("availability.errorUnauthorized") };
        } else if (status !== undefined && status >= 500) {
          feedbackPayload = { type: FT.ROLLBACK,  message: t("availability.errorRollback")     };
        } else {
          const serverMsg = e?.response?.data?.message;
          feedbackPayload = { type: FT.ERROR,     message: serverMsg ?? t("errors.general")    };
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
      payload.presence     === initialPresence     &&
      deepEqualGeo(payload.geo, initialGeo)        &&
      payload.availabilityUntil === initialUntil   &&
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

export default function AvailabilityStatus() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, login } = useAuth();

  const role    = (user as UserData | null)?.role ?? "user";
  const options = useMemo(() => getRoleAvailabilityStates(role) as AvailabilityOption[], [role]);

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
  } = useAvailabilityUpdate({ user: user as UserData | null, role, options, login, navigate, t });

  const roleLabel = useMemo(() => displayRole(role), [role]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#0B1528] text-white pb-10">
      {/* Header + Role context */}
      {/* Main controls (disabled si saving) */}
      {/* FeedbackBanner ki ka montre lastEventMeta.eventId si ou vle pou debug/audit */}
      {/* Save bouton ak handleSave, disabled={!canSave || saving} */}
    </div>
  );
}