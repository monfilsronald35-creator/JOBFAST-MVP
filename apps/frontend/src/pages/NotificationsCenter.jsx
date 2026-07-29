import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

// ── Constants ─────────────────────────────────────────────────────────────
const BG     = "#050B18";
const GOLD   = "#FACC15";
const CARD   = "rgba(15, 23, 42, 0.7)";
const BORDER = "rgba(255,255,255,0.08)";

// ── Helpers ───────────────────────────────────────────────────────────────
function getIcon(type) {
  const icons = {
    message: "💬", job: "💼", payment: "💰", booking: "📋",
    alert: "🔔", system: "⚙️", achievement: "🏆", reminder: "⏰",
    promotion: "🎉", emergency: "🚨", social: "👥", review: "⭐",
  };
  return icons[type] || "🔔";
}

function getNotificationTabs(role) {
  const base = [
    { key: "all",     icon: "🔔", label: "Tout"       },
    { key: "unread",  icon: "●",  label: "Pa li"      },
    { key: "message", icon: "💬", label: "Mesaj"      },
    { key: "payment", icon: "💰", label: "Peman"      },
    { key: "booking", icon: "📋", label: "Rezèvasyon" },
    { key: "alert",   icon: "🚨", label: "Alèt"       },
  ];
  if (role === "admin") {
    base.push({ key: "system", icon: "⚙️", label: "Sistèm" });
  }
  return base;
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.frequency.value = 880;
    amp.gain.setValueAtTime(0.3, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (_) {}
}

// ── Stub services (replace with real impl) ────────────────────────────────
const NotificationAIEngine = {
  personalizeList: ({ notifications }) => notifications,
  formatLiveNotification: ({ notification }) => ({ ...notification, showToast: true, soundEnabled: true }),
  buildToastFromNotification: (n) => n,
};
const DevicePushRegistration = { registerDevice: async () => {} };
class LiveNotificationSocket {
  constructor() { this._listeners = {}; }
  on(event, cb) { this._listeners[event] = cb; }
  connect() {}
  disconnect() {}
}
const RealtimeBadgeService = { broadcastUnreadCount: () => {} };

// ── Sub-components ────────────────────────────────────────────────────────
function PriorityBadge({ score }) {
  const color = score >= 8 ? "#ef4444" : score >= 5 ? "#f59e0b" : "#64748b";
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
      style={{ background: `${color}20`, color }}
    >
      P{score}
    </span>
  );
}

function ChannelBadge({ channel }) {
  const labels = { push: "📱", email: "📧", sms: "📲", in_app: "🔔" };
  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-slate-900 text-slate-400">
      {labels[channel] || channel}
    </span>
  );
}

// ── NotifCard ─────────────────────────────────────────────────────────────
function NotifCard({ n, onRead, onDelete, onClick }) {
  return (
    <div
      onClick={() => onClick(n)}
      className="flex items-start gap-3 rounded-2xl px-3 py-3 cursor-pointer transition"
      style={{
        background: n.isRead ? "transparent" : `${GOLD}06`,
        border: `1px solid ${n.isRead ? BORDER : `${GOLD}20`}`,
      }}
    >
      <div
        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg"
        style={{ background: CARD }}
      >
        {getIcon(n.type)}
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

// ── Live toast ────────────────────────────────────────────────────────────
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

// ── Main page ─────────────────────────────────────────────────────────────
function NotificationsCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || "worker";
  const tabs = getNotificationTabs(role);

  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [activeTab,     setActiveTab]     = useState("all");
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [liveToast,     setLiveToast]     = useState(null);

  const mountedRef = useRef(true);
  const abortRef   = useRef(null);
  const socketRef  = useRef(null);

  useEffect(() => () => {
    mountedRef.current = false;
    abortRef.current?.abort();
    socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (!user) return;
    DevicePushRegistration.registerDevice(user).catch((err) =>
      console.warn("push registration failed", err)
    );
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const socket = new LiveNotificationSocket(user);
    socketRef.current = socket;

    socket.on("notification:new", (payload) => {
      const personalized = NotificationAIEngine.formatLiveNotification({
        user, role, notification: payload,
      });
      setNotifications((prev) => [personalized, ...prev]);
      if (!personalized.isRead) {
        setUnreadCount((prev) => prev + 1);
        RealtimeBadgeService.broadcastUnreadCount((prev) => prev + 1);
      }
      if (personalized.showToast) {
        const toastPayload = NotificationAIEngine.buildToastFromNotification(personalized);
        setLiveToast(toastPayload);
        if (personalized.soundEnabled) playNotificationSound();
      }
    });

    socket.on("badge:update", (count) => {
      setUnreadCount(count);
      RealtimeBadgeService.broadcastUnreadCount(() => count);
    });

    socket.connect();
    return () => { socket.disconnect(); };
  }, [user, role]);

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
      const res = await API.get("/notifications", {
        params,
        signal: abortRef.current.signal,
      });
      if (!mountedRef.current) return;
      const list = res.data?.data?.notifications || [];
      const personalized = NotificationAIEngine.personalizeList({ user, role, notifications: list });
      const filtered = personalized.filter((n) => (n.priorityScore || 0) >= (n.minPriority || 1.0));
      setNotifications(filtered);
      setUnreadCount(res.data?.data?.stats?.unreadCount || 0);
      RealtimeBadgeService.broadcastUnreadCount(() => res.data?.data?.stats?.unreadCount || 0);
    } catch (err) {
      if (err?.code !== "ERR_CANCELED") console.error(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, activeTab, role]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkAsRead = useCallback(async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      if (mountedRef.current) {
        setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
        RealtimeBadgeService.broadcastUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) { console.error(err); }
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
    } catch (err) { console.error(err); }
  }, []);

  const handleClick = useCallback((n) => {
    if (!n.isRead) handleMarkAsRead(n._id);
    if (n.actionUrl) navigate(n.actionUrl);
  }, [handleMarkAsRead, navigate]);

  return (
    <div className="min-h-screen text-white pb-28" style={{ background: BG }}>
      <LiveToast toast={liveToast} onClose={() => setLiveToast(null)} />

      <div
        className="sticky top-0 z-20 backdrop-blur-md border-b px-4 pt-5 pb-3"
        style={{ background: `${BG}ee`, borderColor: BORDER }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-black text-white">🔔 Notifikasyon</h1>
            {unreadCount > 0 && (
              <p className="text-[11px] text-amber-400 mt-0.5">{unreadCount} nouvo</p>
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

      <div
        className="sticky top-[60px] z-10 backdrop-blur-md border-b px-4 py-2.5 overflow-x-auto"
        style={{ background: `${BG}dd`, borderColor: BORDER, scrollbarWidth: "none" }}
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
                  : { background: CARD, color: "#94a3b8", border: `1px solid ${BORDER}` }
              }
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-2">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: CARD }} />
            ))}
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm font-bold text-slate-400">Pa gen notifikasyon</p>
            <p className="text-[11px] text-slate-600 mt-1">Ou pral wè aktivite ou yo isit la</p>
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
