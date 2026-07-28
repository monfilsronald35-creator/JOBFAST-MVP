// NotificationsCenter.jsx — JOBFAST Ultra Orchestrated AI Notifications v5.0
//
// Frontend inbox vizyèl pou:
//  - Notification Orchestrator (Push + Email + SMS + In-App) [web:205][web:209][web:213]
//  - Ultra Push Engine (FCM/APNs backend, device registration devann) [web:184][web:185][web:193]
//  - AI Notification / Engagement / Prediction / Campaign / Anti-Spam / Behaviour / Geo / Priority Queue
//  - Smart Trigger Engine (live WebSocket events job/customer/cart/reservation/randevou)
//  - Global Timezone Scheduler (Bonjou nan lè lokal chak peyi)
//  - Cross-Device Sync + Realtime Badge Service + Analytics
//
// REMAK: Komponan sa a pa voye notifikasyon li menm; li sèvi kòm Inbox + Live UI.
//        Tout desizyon "kiyès, kilè, sou ki chanèl, ki priyorite" fèt nan Notification Orchestrator backend lan. [web:205][web:209]

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import { LiveNotificationSocket } from "../services/LiveNotificationSocket";
import { NotificationAIEngine } from "../services/NotificationAIEngine";
import { DevicePushRegistration } from "../services/DevicePushRegistration";
import { playNotificationSound } from "../services/SoundService";
import { RealtimeBadgeService } from "../services/RealtimeBadgeService"; // pou mete badge global (tab, header, lòt ekran)

// Design tokens
const BG     = "#050B18";
const CARD   = "#0d1526";
const GOLD   = "#FACC15";
const BORDER = "#1F2937";

// Role tabs (Inbox filtre pa tip / chanèl / AI kampay)
const ROLE_NOTIFICATION_TABS = {
  worker: [
    { key: "all",        label: "Tout",          icon: "📢" },
    { key: "unread",     label: "Pa Li",         icon: "🔵" },
    { key: "morning",    label: "Bonjou",        icon: "🌅" },
    { key: "jobs",       label: "Travay",        icon: "💼" },
    { key: "summary",    label: "Aswè",          icon: "🌙" },
    { key: "campaign",   label: "AI Kampay",     icon: "🎯" },
  ],
  company: [
    { key: "all",           label: "Tout",        icon: "📢" },
    { key: "unread",        label: "Pa Li",       icon: "🔵" },
    { key: "jobs",          label: "Travay",      icon: "💼" },
    { key: "new_applicant", label: "Aplikasyon",  icon: "📋" },
    { key: "ai_campaign",   label: "AI Kampay",   icon: "🎯" },
  ],
  hotel: [
    { key: "all",         label: "Tout",         icon: "📢" },
    { key: "unread",      label: "Pa Li",        icon: "🔵" },
    { key: "reservation", label: "Rezèvasyon",   icon: "🛏️" },
    { key: "nearby",      label: "Toupre ou",    icon: "📍" },
    { key: "summary",     label: "Aswè",         icon: "🌙" },
  ],
  restaurant: [
    { key: "all",      label: "Tout",           icon: "📢" },
    { key: "unread",   label: "Pa Li",          icon: "🔵" },
    { key: "order",    label: "Kòmand",         icon: "🛒" },
    { key: "delivery", label: "Livrezon",       icon: "🚀" },
    { key: "nearby",   label: "Toupre ou",      icon: "📍" },
  ],
  hospital: [
    { key: "all",         label: "Tout",        icon: "📢" },
    { key: "unread",      label: "Pa Li",       icon: "🔵" },
    { key: "appointment", label: "Randevou",    icon: "📅" },
    { key: "emergency",   label: "Dijans",      icon: "🚨" },
    { key: "summary",     label: "Aswè",        icon: "🌙" },
  ],
  driver: [
    { key: "all",       label: "Tout",          icon: "📢" },
    { key: "unread",    label: "Pa Li",         icon: "🔵" },
    { key: "nearby",    label: "Toupre ou",     icon: "📍" },
    { key: "jobs",      label: "Kòmand",        icon: "🛒" },
    { key: "hot_offer", label: "Of espesyal",   icon: "🔥" },
  ],
};

const DEFAULT_TABS = [
  { key: "all",     label: "Tout",     icon: "📢" },
  { key: "unread",  label: "Pa Li",    icon: "🔵" },
  { key: "jobs",    label: "Travay",   icon: "💼" },
  { key: "nearby",  label: "Toupre",   icon: "📍" },
  { key: "summary", label: "Aswè",     icon: "🌙" },
];

function getNotificationTabs(role) {
  return ROLE_NOTIFICATION_TABS[role] || DEFAULT_TABS;
}

// Icons pa tip
function getIcon(type) {
  const map = {
    morning:        "🌅",
    evening:        "🌙",
    jobs:           "💼",
    job_match:      "💼",
    prediction:     "🔮",
    new_opportunity:"⭐",
    new_applicant:  "📋",
    worker_accepted:"🤝",
    payroll:        "💰",
    payment:        "💰",
    order:          "🛒",
    delivery:       "🚀",
    reservation:    "🛏️",
    room_ready:     "🧹",
    appointment:    "📅",
    emergency:      "🚨",
    booking:        "✈️",
    contract:       "📄",
    review:         "⭐",
    task:           "✅",
    message:        "💬",
    inquiry:        "💬",
    alert:          "⚠️",
    system:         "⚙️",
    report:         "🚩",
    recommendation: "🎯",
    important:      "🚨",
    nearby:         "📍",
    hot_offer:      "🔥",
    new_client:     "👥",
    ai_campaign:    "🎯",
    birthday:       "🎂",
    weekend:        "🎉",
    digest:         "📄",
    geofence:       "🗺️",
    behaviour:      "🧠",
  };
  return map[type] || "📢";
}

// Priority badge (AI Priority Score)
function PriorityBadge({ score }) {
  if (!score && score !== 0) return null;
  let label = "";
  let color = "";
  if (score >= 4.5) {
    label = "★★★★★";
    color = GOLD;
  } else if (score >= 3.5) {
    label = "★★★★☆";
    color = "#22c55e";
  } else if (score >= 2.5) {
    label = "★★★☆☆";
    color = "#3b82f6";
  } else if (score >= 1.5) {
    label = "★★☆☆☆";
    color = "#64748b";
  } else {
    label = "★☆☆☆☆";
    color = "#4b5563";
  }
  return (
    <span
      className="text-[9px] px-2 py-0.5 rounded-full font-bold"
      style={{ background: "#020617", color }}
    >
      {label}
    </span>
  );
}

// Chanèl badge (Push / Email / SMS / In-App)
function ChannelBadge({ channel }) {
  if (!channel) return null;
  const map = {
    push:   { label: "Push",   color: "#22c55e" },
    email:  { label: "Email",  color: "#3b82f6" },
    sms:    { label: "SMS",    color: "#f97316" },
    in_app: { label: "In-App", color: "#e5e7eb" },
  };
  const cfg = map[channel] || { label: channel, color: "#94a3b8" };
  return (
    <span
      className="text-[9px] px-2 py-0.5 rounded-full font-bold"
      style={{ background: "#020617", color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// Notification card
function NotifCard({ n, onRead, onDelete, onClick }) {
  const important = (n.priorityScore || 0) >= 4.5;
  const aggregated = n.isAggregatedDigest; // AI Anti-Spam: “Jodi a: 4 travay, 2 mesaj, 1 konpayi…”

  return (
    <div
      onClick={() => onClick(n)}
      className="flex items-start gap-3 p-4 rounded-2xl border transition cursor-pointer active:scale-[0.99]"
      style={{
        background: n.isRead ? CARD : `${CARD}ee`,
        borderColor: n.isRead ? BORDER : important ? `${GOLD}` : `${GOLD}55`,
        boxShadow: n.isRead ? "none" : `0 0 0 1px ${GOLD}22`,
      }}
    >
      <div className="text-2xl shrink-0 w-8 text-center leading-none mt-0.5">
        {getIcon(aggregated ? "digest" : n.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-[13px] text-white leading-tight">
            {n.title}
          </p>
          {!n.isRead && (
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-3">
          {n.message}
        </p>
        {Array.isArray(n.digestItems) && n.digestItems.length > 0 && (
          <ul className="mt-1.5 text-[10px] text-slate-500 space-y-0.5">
            {n.digestItems.slice(0, 4).map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[10px] text-slate-600">
            {new Date(n.createdAt).toLocaleString("fr", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
            })}
          </span>
          {n.category && (
            <span
              className="text-[9px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: "#1a2336", color: "#94a3b8" }}
            >
              {n.category}
            </span>
          )}
          {typeof n.priorityScore === "number" && (
            <PriorityBadge score={n.priorityScore} />
          )}
          {n.channel && <ChannelBadge channel={n.channel} />}
          {n.geo && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-slate-900 text-slate-300">
              📍 {n.geo.city || n.geo.label}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(n._id);
        }}
        className="text-slate-600 hover:text-red-400 transition shrink-0 text-base leading-none p-1"
      >
        ✕
      </button>
    </div>
  );
}

// Live toast
function LiveToast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-xs border rounded-2xl px-3 py-2 shadow-lg"
      style={{ background: CARD, borderColor: GOLD }}
    >
      <div className="flex items-start gap-2">
        <div className="text-xl">{getIcon(toast.type)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-white">{toast.title}</p>
          <p className="text-[10px] text-slate-400 line-clamp-3">
            {toast.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 text-xs"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// MAIN PAGE — Orchestrated Inbox
function NotificationsCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || "worker";
  const tabs = getNotificationTabs(role);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [liveToast, setLiveToast] = useState(null);

  const mountedRef = useRef(true);
  const abortRef = useRef(null);
  const socketRef = useRef(null);

  // Cleanup
  useEffect(
    () => () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      socketRef.current?.disconnect();
    },
    []
  );

  // Ultra Push Engine registration (FCM/APNs) + Global Timezone
  useEffect(() => {
    if (!user) return;
    // Enskri device & timezone pou Notification Orchestrator: [web:208][web:209]
    DevicePushRegistration.registerDevice(user).catch((err) =>
      console.warn("push registration failed", err)
    );
  }, [user]);

  // Smart Trigger + Behaviour + Geo + Prediction live events
  useEffect(() => {
    if (!user) return;

    const socket = new LiveNotificationSocket(user);
    socketRef.current = socket;

    socket.on("notification:new", (payload) => {
      // Notification Orchestrator deja deside chanèl (push/email/sms/in-app),
      // Anti-Spam Engine deja ka konbine an digest, Behaviour/Geo/Prediction deja aplike.
      const personalized = NotificationAIEngine.formatLiveNotification({
        user,
        role,
        notification: payload,
      });

      setNotifications((prev) => [personalized, ...prev]);

      if (!personalized.isRead) {
        setUnreadCount((prev) => prev + 1);
        // Realtime badge nan tout app la
        RealtimeBadgeService.broadcastUnreadCount(prev => prev + 1);
      }

      // Toast + son sèlman si Orchestrator di li “toastable”
      if (personalized.showToast) {
        const toastPayload =
          NotificationAIEngine.buildToastFromNotification(personalized);
        setLiveToast(toastPayload);
        if (personalized.soundEnabled) playNotificationSound();
      }
    });

    // Badge global soti backend (Cross-Device Sync / Offline Queue)
    socket.on("badge:update", (count) => {
      setUnreadCount(count);
      RealtimeBadgeService.broadcastUnreadCount(() => count);
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [user, role]);

  // Fetch historique + AI Notification + Anti-Spam Digest + Geo
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const params = { limit: 100, skip: 0 };
      if (activeTab === "unread") {
        params.isRead = "false";
      } else if (activeTab !== "all") {
        params.type = activeTab;
      }

      // /notifications deja serv kòm “Inbox orkestra”: sms/email/push/in-app + offline queue. [web:210][web:213]
      const res = await API.get("/notifications", {
        params,
        signal: abortRef.current.signal,
      });
      if (!mountedRef.current) return;

      const list = res.data?.data?.notifications || [];

      const personalized = NotificationAIEngine.personalizeList({
        user,
        role,
        notifications: list,
      });

      // Anti-Spam Engine backend ka deja tonbe nan digest; devan respekte priority/minPriority
      const filtered = personalized.filter(
        (n) => (n.priorityScore || 0) >= (n.minPriority || 1.0)
      );

      setNotifications(filtered);
      setUnreadCount(res.data?.data?.stats?.unreadCount || 0);

      // Mete RealtimeBadgeService a okouran (pou lòt ekran yo)
      RealtimeBadgeService.broadcastUnreadCount(
        () => res.data?.data?.stats?.unreadCount || 0
      );
    } catch (err) {
      if (err?.code !== "ERR_CANCELED") console.error(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, activeTab, role]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark as read / delete
  const handleMarkAsRead = useCallback(async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      if (mountedRef.current) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        RealtimeBadgeService.broadcastUnreadCount((prev) =>
          Math.max(0, prev - 1)
        );
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await API.patch("/notifications/read-all");
    } catch (err) {
      console.error(err);
    } finally {
      if (mountedRef.current) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        RealtimeBadgeService.broadcastUnreadCount(() => 0);
      }
    }
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      if (mountedRef.current)
        setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleClick = useCallback(
    (n) => {
      if (!n.isRead) handleMarkAsRead(n._id);
      if (n.actionUrl) navigate(n.actionUrl);
    },
    [handleMarkAsRead, navigate]
  );

  // Render
  return (
    <div className="min-h-screen text-white pb-28" style={{ background: BG }}>
      {/* Live toast */}
      <LiveToast toast={liveToast} onClose={() => setLiveToast(null)} />

      {/* Header */}
      <div
        className="sticky top-0 z-20 backdrop-blur-md border-b px-4 pt-5 pb-3"
        style={{ background: `${BG}ee`, borderColor: BORDER }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-black text-white">
              🔔 Notifikasyon
            </h1>
            {unreadCount > 0 && (
              <p className="text-[11px] text-amber-400 mt-0.5">
                {unreadCount} nouvo
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl transition"
              style={{ background: `${GOLD}18`, color: GOLD }}
            >
              Make tout li
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        className="sticky top-[60px] z-10 backdrop-blur-md border-b px-4 py-2.5 overflow-x-auto"
        style={{
          background: `${BG}dd`,
          borderColor: BORDER,
          scrollbarWidth: "none",
        }}
      >
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition"
              style={
                activeTab === tab.key
                  ? { background: GOLD, color: "#0a0f1e" }
                  : {
                      background: CARD,
                      color: "#94a3b8",
                      border: `1px solid ${BORDER}`,
                    }
              }
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-2">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl animate-pulse"
                style={{ background: CARD }}
              />
            ))}
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm font-bold text-slate-400">
              Pa gen notifikasyon
            </p>
            <p className="text-[11px] text-slate-600 mt-1">
              Ou pral wè aktivite ou yo isit la
            </p>
          </div>
        )}

        {!loading &&
          notifications.map((n) => (
            <NotifCard
              key={n._id}
              n={n}
              onRead={handleMarkAsRead}
              onDelete={handleDelete}
              onClick={handleClick}
            />
          ))}
      </div>
    </div>
  );
}

export default NotificationsCenter;
