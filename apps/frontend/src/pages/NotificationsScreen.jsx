import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Briefcase, Wallet, Settings, ArrowLeft, Home, Search, Plus, User } from "lucide-react";

const ROUTES = {
  DASHBOARD: "/dashboard",
  SEARCH: "/search",
  POST_JOB: "/post-job",
  PROFILE: "/profile",
  NOTIFICATIONS: "/notifications",
  LOGIN: "/login",
};

const FILTERS = [
  { id: "all", label: "Tout" },
  { id: "unread", label: "Li pa li" },
  { id: "jobs", label: "Travay" },
  { id: "payments", label: "Peman" },
  { id: "system", label: "Sistèm" },
];

const DEFAULT_NOTIFICATIONS = [
  {
    id: "1",
    type: "jobs",
    title: "Nouvo demann travay",
    message: 'Yon kliyan mande sèvis pou "Fondasyon Kay".',
    time: "2 min ago",
    unread: true,
    priority: "high",
  },
  {
    id: "2",
    type: "payments",
    title: "Peman resevwa",
    message: "Ou resevwa $250 pou travay la fini.",
    time: "35 min ago",
    unread: true,
    priority: "normal",
  },
  {
    id: "3",
    type: "system",
    title: "Profil verifye",
    message: "Kont ou verifye avèk siksè.",
    time: "1 day ago",
    unread: false,
    priority: "low",
  },
];

function NotificationsScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const controller = new AbortController();

    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/notifications", {
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Failed to load notifications");
        const data = await res.json();

        const sorted = Array.isArray(data)
          ? [...data].sort((a, b) => Number(b.unread) - Number(a.unread))
          : DEFAULT_NOTIFICATIONS;

        setNotifications(sorted);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError("Erè pandan chajman notifikasyon yo");
        setNotifications(DEFAULT_NOTIFICATIONS);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadNotifications();
    return () => controller.abort();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications;
    if (activeFilter === "unread") return notifications.filter((n) => n.unread);
    return notifications.filter((n) => n.type === activeFilter);
  }, [activeFilter, notifications]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to mark notification as read");

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to mark all notifications as read");

      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    } catch (error) {
      console.error(error);
    }
  };

  const iconByType = (type) => {
    switch (type) {
      case "jobs":
        return <Briefcase className="h-5 w-5" />;
      case "payments":
        return <Wallet className="h-5 w-5" />;
      case "system":
        return <Settings className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-navy-900 pb-24 font-sans text-text-inverse select-none">
      <header className="border-b border-navy-800/60 bg-navy-800/40 px-5 pb-5 pt-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Retounen"
            className="rounded-xl bg-navy-800 p-2.5 text-slate-300 transition-all hover:text-gold-400 active:scale-95 focus:outline-none focus:ring-4 focus:ring-gold-100/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h1 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
              Notifikasyon
            </h1>
            <p className="mt-1 text-xs text-slate-500" aria-live="polite">
              {unreadCount} nouvo
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            className="rounded-xl border border-slate-800 bg-navy-800 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-300 transition-all hover:text-gold-400 active:scale-95 focus:outline-none focus:ring-4 focus:ring-gold-100/10"
          >
            Tout li
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${
                activeFilter === filter.id
                  ? "bg-gold-400 text-navy-900"
                  : "border border-slate-800 bg-navy-800/40 text-slate-400"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {error ? (
        <div className="mx-5 mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <main className="flex-1 px-5 py-5">
        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  notification.unread
                    ? "border-gold-400/20 bg-gold-400/5"
                    : "border-navy-800/60 bg-navy-800/30"
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy-800 text-slate-200">
                    {iconByType(notification.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-bold text-white">
                          {notification.title}
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-slate-300">
                          {notification.message}
                        </p>
                      </div>

                      {notification.unread ? (
                        <span
                          className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-gold-400"
                          aria-label="Nouvo notifikasyon"
                        />
                      ) : null}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold text-slate-500">
                        {notification.time}
                      </p>

                      <div className="flex items-center gap-2">
                        {notification.unread ? (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="rounded-full border border-slate-700 bg-navy-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all hover:border-gold-400/30 hover:text-gold-400"
                          >
                            Make li
                          </button>
                        ) : (
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                            Li
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-navy-800 text-3xl">
              <Bell className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-black text-white">Pa gen notifikasyon</h2>
            <p className="mt-2 max-w-xs text-sm text-slate-400">
              Lè gen nouvèl, demand travay, oswa peman, y ap parèt isit la.
            </p>
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="mt-5 rounded-xl bg-gold-400 px-5 py-3 text-sm font-black uppercase tracking-wider text-navy-900 transition-all active:scale-95"
            >
              Ale akèy
            </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-md items-center justify-between border-t border-slate-900 bg-navy-950/95 px-6 py-2 backdrop-blur-md">
        <button onClick={() => navigate(ROUTES.DASHBOARD)} className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400" type="button" aria-label="Akey">
          <Home className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Akey</span>
        </button>

        <button onClick={() => navigate(ROUTES.SEARCH)} className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400" type="button" aria-label="Rechèch">
          <Search className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Rechèch</span>
        </button>

        <button onClick={() => navigate(ROUTES.POST_JOB)} className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400" type="button" aria-label="Paste">
          <div className="relative -mt-4 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-navy-800 text-gold-400 shadow-lg">
            <Plus className="h-5 w-5" />
          </div>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider">Paste</span>
        </button>

        <button onClick={() => navigate(ROUTES.NOTIFICATIONS)} className="flex flex-col items-center gap-1 text-gold-400" type="button" aria-label={`Notifikasyon, ${unreadCount} pa li`}>
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider">Notifikasyon</span>
        </button>

        <button onClick={() => navigate(ROUTES.PROFILE)} className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400" type="button" aria-label="Profil">
          <User className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Profil</span>
        </button>
      </nav>
    </div>
  );
}

export default React.memo(NotificationsScreen);
