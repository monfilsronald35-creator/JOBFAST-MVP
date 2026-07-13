import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

// ── Design tokens ────────────────────────────────────────────────
const BG   = '#050B18';
const CARD = '#0d1526';
const GOLD = '#FACC15';
const BORDER = '#1F2937';

// ── Role-specific notification filter tabs ───────────────────────
// key = API filter value sent as params.type (or 'all'/'unread')
// label = display text in Haitian Creole
// icon = emoji prefix
const ROLE_NOTIFICATION_TABS = {
  worker: [
    { key: 'all',       label: 'Tout',          icon: '📢' },
    { key: 'unread',    label: 'Pa Li',          icon: '🔵' },
    { key: 'job_match', label: 'Nouvo Travay',   icon: '💼' },
    { key: 'payment',   label: 'Pèman',          icon: '💰' },
    { key: 'message',   label: 'Mesaj',          icon: '💬' },
  ],
  user: [
    { key: 'all',       label: 'Tout',          icon: '📢' },
    { key: 'unread',    label: 'Pa Li',          icon: '🔵' },
    { key: 'job_match', label: 'Nouvo Travay',   icon: '💼' },
    { key: 'payment',   label: 'Pèman',          icon: '💰' },
    { key: 'message',   label: 'Mesaj',          icon: '💬' },
  ],
  service_provider: [
    { key: 'all',         label: 'Tout',          icon: '📢' },
    { key: 'unread',      label: 'Pa Li',          icon: '🔵' },
    { key: 'new_booking', label: 'Nouvo Kliyan',  icon: '🤝' },
    { key: 'payment',     label: 'Pèman',          icon: '💰' },
    { key: 'review',      label: 'Evalyasyon',     icon: '⭐' },
  ],
  company: [
    { key: 'all',           label: 'Tout',          icon: '📢' },
    { key: 'unread',        label: 'Pa Li',          icon: '🔵' },
    { key: 'new_applicant', label: 'Aplikasyon',    icon: '📋' },
    { key: 'payroll',       label: 'Salè',          icon: '💰' },
    { key: 'alert',         label: 'Alèt',          icon: '⚠️' },
  ],
  business: [
    { key: 'all',           label: 'Tout',          icon: '📢' },
    { key: 'unread',        label: 'Pa Li',          icon: '🔵' },
    { key: 'new_applicant', label: 'Aplikasyon',    icon: '📋' },
    { key: 'payroll',       label: 'Salè',          icon: '💰' },
    { key: 'alert',         label: 'Alèt',          icon: '⚠️' },
  ],
  enterprise: [
    { key: 'all',           label: 'Tout',          icon: '📢' },
    { key: 'unread',        label: 'Pa Li',          icon: '🔵' },
    { key: 'new_applicant', label: 'Aplikasyon',    icon: '📋' },
    { key: 'contract',      label: 'Kontra',        icon: '📄' },
    { key: 'alert',         label: 'Alèt',          icon: '⚠️' },
  ],
  hotel: [
    { key: 'all',         label: 'Tout',          icon: '📢' },
    { key: 'unread',      label: 'Pa Li',          icon: '🔵' },
    { key: 'reservation', label: 'Rezèvasyon',    icon: '🛏️' },
    { key: 'room_ready',  label: 'Chanm Prè',     icon: '🧹' },
    { key: 'message',     label: 'Mesaj',          icon: '💬' },
  ],
  restaurant: [
    { key: 'all',      label: 'Tout',          icon: '📢' },
    { key: 'unread',   label: 'Pa Li',          icon: '🔵' },
    { key: 'order',    label: 'Nouvo Kòmand',  icon: '🛒' },
    { key: 'delivery', label: 'Livrezon',       icon: '🚀' },
    { key: 'alert',    label: 'Alèt',           icon: '⚠️' },
  ],
  hospital: [
    { key: 'all',         label: 'Tout',          icon: '📢' },
    { key: 'unread',      label: 'Pa Li',          icon: '🔵' },
    { key: 'appointment', label: 'Randevou',      icon: '📅' },
    { key: 'emergency',   label: 'Dijans',        icon: '🚨' },
    { key: 'alert',       label: 'Alèt',          icon: '⚠️' },
  ],
  clinic: [
    { key: 'all',         label: 'Tout',          icon: '📢' },
    { key: 'unread',      label: 'Pa Li',          icon: '🔵' },
    { key: 'appointment', label: 'Randevou',      icon: '📅' },
    { key: 'review',      label: 'Evalyasyon',    icon: '⭐' },
    { key: 'message',     label: 'Mesaj',          icon: '💬' },
  ],
  tourism: [
    { key: 'all',     label: 'Tout',          icon: '📢' },
    { key: 'unread',  label: 'Pa Li',          icon: '🔵' },
    { key: 'booking', label: 'Rezèvasyon',    icon: '✈️' },
    { key: 'review',  label: 'Evalyasyon',    icon: '⭐' },
    { key: 'message', label: 'Mesaj',          icon: '💬' },
  ],
  rental: [
    { key: 'all',      label: 'Tout',          icon: '📢' },
    { key: 'unread',   label: 'Pa Li',          icon: '🔵' },
    { key: 'booking',  label: 'Rezèvasyon',    icon: '🏠' },
    { key: 'contract', label: 'Kontra',        icon: '📄' },
    { key: 'payment',  label: 'Pèman',          icon: '💰' },
  ],
  office: [
    { key: 'all',     label: 'Tout',          icon: '📢' },
    { key: 'unread',  label: 'Pa Li',          icon: '🔵' },
    { key: 'task',    label: 'Tach',          icon: '✅' },
    { key: 'message', label: 'Mesaj',          icon: '💬' },
    { key: 'alert',   label: 'Alèt',          icon: '⚠️' },
  ],
  marketplace: [
    { key: 'all',      label: 'Tout',         icon: '📢' },
    { key: 'unread',   label: 'Pa Li',         icon: '🔵' },
    { key: 'order',    label: 'Kòmand',       icon: '🛒' },
    { key: 'payment',  label: 'Pèman',         icon: '💰' },
    { key: 'review',   label: 'Evalyasyon',   icon: '⭐' },
  ],
  admin: [
    { key: 'all',     label: 'Tout',          icon: '📢' },
    { key: 'unread',  label: 'Pa Li',          icon: '🔵' },
    { key: 'alert',   label: 'Alèt',          icon: '⚠️' },
    { key: 'system',  label: 'Sistèm',        icon: '⚙️' },
    { key: 'report',  label: 'Rapò',          icon: '🚩' },
  ],
};

// Fallback for any role not in the map
const DEFAULT_TABS = [
  { key: 'all',       label: 'Tout',       icon: '📢' },
  { key: 'unread',    label: 'Pa Li',      icon: '🔵' },
  { key: 'job_match', label: 'Travay',     icon: '💼' },
  { key: 'alert',     label: 'Alèt',      icon: '⚠️' },
  { key: 'system',    label: 'Sistèm',    icon: '⚙️' },
];

function getNotificationTabs(role) {
  return ROLE_NOTIFICATION_TABS[role] || DEFAULT_TABS;
}

// ── Notification type → emoji icon ──────────────────────────────
function getIcon(type) {
  const map = {
    job_match:     '💼',
    new_opportunity:'⭐',
    new_applicant:  '📋',
    worker_accepted:'🤝',
    payroll:        '💰',
    payment:        '💰',
    order:          '🛒',
    delivery:       '🚀',
    reservation:    '🛏️',
    room_ready:     '🧹',
    appointment:    '📅',
    emergency:      '🚨',
    booking:        '✈️',
    contract:       '📄',
    review:         '⭐',
    task:           '✅',
    message:        '💬',
    inquiry:        '💬',
    alert:          '⚠️',
    system:         '⚙️',
    report:         '🚩',
    new_booking:    '🤝',
  };
  return map[type] || '📢';
}

// ── Single notification card ─────────────────────────────────────
function NotifCard({ n, onRead, onDelete, onClick }) {
  return (
    <div
      onClick={() => onClick(n)}
      className="flex items-start gap-3 p-4 rounded-2xl border transition cursor-pointer active:scale-[0.99]"
      style={{
        background:   n.isRead ? CARD : `${CARD}ee`,
        borderColor:  n.isRead ? BORDER : `${GOLD}55`,
        boxShadow:    n.isRead ? 'none' : `0 0 0 1px ${GOLD}22`,
      }}
    >
      <div className="text-2xl shrink-0 w-8 text-center leading-none mt-0.5">
        {getIcon(n.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-[13px] text-white leading-tight">{n.title}</p>
          {!n.isRead && (
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-slate-600">
            {new Date(n.createdAt).toLocaleDateString('fr')}
          </span>
          {n.category && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: '#1a2336', color: '#94a3b8' }}>
              {n.category}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(n._id); }}
        className="text-slate-600 hover:text-red-400 transition shrink-0 text-base leading-none p-1"
      >
        ✕
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
function NotificationsCenter() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const role       = user?.role || 'worker';
  const tabs       = getNotificationTabs(role);

  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [activeTab,     setActiveTab]     = useState('all');
  const [unreadCount,   setUnreadCount]   = useState(0);

  const mountedRef = useRef(true);
  const abortRef   = useRef(null);

  useEffect(() => () => {
    mountedRef.current = false;
    abortRef.current?.abort();
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const params = { limit: 50, skip: 0 };
      if (activeTab === 'unread') {
        params.isRead = 'false';
      } else if (activeTab !== 'all') {
        params.type = activeTab;
      }

      const res = await API.get('/notifications', {
        params,
        signal: abortRef.current.signal,
      });
      if (!mountedRef.current) return;

      setNotifications(res.data?.data?.notifications || []);
      setUnreadCount(res.data?.data?.stats?.unreadCount || 0);
    } catch (err) {
      if (err?.code !== 'ERR_CANCELED') console.error(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkAsRead = useCallback(async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      if (mountedRef.current) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {}
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await API.patch('/notifications/read-all');
      if (mountedRef.current) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch {}
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      if (mountedRef.current) setNotifications(prev => prev.filter(n => n._id !== id));
    } catch {}
  }, []);

  const handleClick = useCallback((n) => {
    if (!n.isRead) handleMarkAsRead(n._id);
    if (n.actionUrl) navigate(n.actionUrl);
  }, [handleMarkAsRead, navigate]);

  return (
    <div className="min-h-screen text-white pb-28" style={{ background: BG }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 backdrop-blur-md border-b px-4 pt-5 pb-3"
        style={{ background: `${BG}ee`, borderColor: BORDER }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-black text-white">🔔 Notifikasyon</h1>
            {unreadCount > 0 && (
              <p className="text-[11px] text-amber-400 mt-0.5">{unreadCount} nouvo</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl transition"
              style={{ background: `${GOLD}18`, color: GOLD }}>
              Make tout li
            </button>
          )}
        </div>
      </div>

      {/* ── Role-aware filter tabs ─────────────────────────────── */}
      <div className="sticky top-[60px] z-10 backdrop-blur-md border-b px-4 py-2.5 overflow-x-auto"
        style={{ background: `${BG}dd`, borderColor: BORDER, scrollbarWidth: 'none' }}>
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button key={tab.key} type="button"
              onClick={() => setActiveTab(tab.key)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition"
              style={
                activeTab === tab.key
                  ? { background: GOLD, color: '#0a0f1e' }
                  : { background: CARD, color: '#94a3b8', border: `1px solid ${BORDER}` }
              }>
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="px-4 pt-4 space-y-2">

        {loading && (
          <div className="space-y-2">
            {[1,2,3].map(i => (
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

        {!loading && notifications.map(n => (
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