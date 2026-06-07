import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Briefcase, 
  MessageSquare, 
  Star, 
  Clock, 
  ChevronRight, 
  Trash2, 
  ArrowLeft,
  Home,
  Search,
  Plus,
  User
} from 'lucide-react';

const TRANSLATIONS = {
  ht: {
    title: "Notifikasyon",
    newBadge: "Nouvo",
    emptyState: "Ou pa gen okenn notifikasyon.",
    clearAll: "Tout efase",
    confirmClear: "Èske ou sèten ou vle efase tout notifikasyon yo?",
    navHome: "Akeyi",
    navSearch: "Rechèch",
    navPost: "Poste",
    navNotif: "Notifikasyon",
    navProfile: "Profil",
    timeJustNow: "Kounye a",
    timeMinutes: "minit de sa",
    timeHours: "èdtan de sa",
    timeDays: "jou de sa",
    timeYesterday: "Yè"
  }
};

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'job_nearby',
    title: 'Nouvo travay disponib toupre ou',
    description: 'Mason - 2.5 km de ou',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    unread: true,
    category: 'Construction'
  },
  {
    id: 'notif-2',
    type: 'response',
    title: 'Ronald Monfils te reponn ou',
    description: 'Sou travay ou te poste a',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    unread: true,
    category: 'Communication'
  },
  {
    id: 'notif-3',
    type: 'service_nearby',
    title: 'Nouvo sèvis disponib',
    description: 'Plonbye disponib nan zòn ou',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    unread: false,
    category: 'Services'
  },
  {
    id: 'notif-4',
    type: 'job_completed',
    title: 'Travay fini',
    description: 'Travay "Mason" a fini avèk siksè',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    unread: false,
    category: 'System'
  }
];

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const t = TRANSLATIONS.ht;

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, unread: false } : notif)
    );
  };

  const clearAll = () => {
    if (window.confirm(t.confirmClear)) {
      setNotifications([]);
    }
  };

  const formatTimeAgo = (isoString) => {
    const diffInMs = new Date() - new Date(isoString);
    const minutes = Math.floor(diffInMs / 60000);
    
    if (minutes < 1) return t.timeJustNow;
    if (minutes < 60) return `${minutes} ${t.timeMinutes}`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${t.timeHours}`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return t.timeYesterday;
    if (days < 7) return `${days} ${t.timeDays}`;
    
    return new Date(isoString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'job_nearby':
        return <Briefcase className="h-4 w-4 text-gold-400" />;
      case 'response':
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case 'service_nearby':
        return <Bell className="h-4 w-4 text-indigo-400" />;
      case 'job_completed':
        return <Star className="h-4 w-4 text-emerald-400" />;
      default:
        return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col animate-fade-in select-none bg-navy-900 pb-24 font-sans text-white">
      
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 pb-4 pt-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Retounen"
            className="rounded-xl border border-navy-800 bg-navy-800/60 p-2.5 text-slate-400 transition-all active:scale-95 hover:text-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-base font-extrabold tracking-wide text-white">{t.title}</h1>
        </div>
        
        <div className="relative rounded-xl border border-navy-800 bg-navy-800/40 p-2.5">
          <Bell className="h-4 w-4 text-gold-400" />
          {notifications.some(n => n.unread) && (
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
          )}
        </div>
      </header>

      <main className="mx-auto flex-1 w-full max-w-md overflow-y-auto px-5 space-y-3">
        {notifications.length > 0 ? (
          <>
            {notifications.map((notif) => (
              <button
                key={notif.id}
                type="button"
                onClick={() => markAsRead(notif.id)}
                aria-label={notif.title}
                className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10
                  ${notif.unread 
                    ? 'bg-navy-800/40 border-gold-400/20 shadow-md' 
                    : 'bg-navy-800/10 border-slate-800/40 hover:bg-navy-800/30' 
                  }`}
              >
                <div className="flex-shrink-0 rounded-xl border border-navy-800 bg-navy-900 p-2.5 shadow-inner">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h3 className={`truncate text-sm tracking-wide ${notif.unread ? 'font-black text-white' : 'font-bold text-slate-300'}`}>
                      {notif.title}
                    </h3>
                    {notif.unread && (
                      <span className="shrink-0 rounded-full border border-gold-400/30 bg-gold-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-gold-400">
                        {t.newBadge}
                      </span>
                    )}
                  </div>
                  <p className="mb-2 text-xs font-medium leading-relaxed text-slate-400">
                    {notif.description}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(notif.createdAt)}</span>
                  </div>
                </div>

                <div className="self-center pl-1 text-slate-600">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </button>
            ))}

            <div className="pb-6 pt-2">
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-slate-800 bg-transparent py-3 text-xs font-bold uppercase tracking-widest text-slate-500 active:scale-95 transition-all hover:border-rose-500/40 hover:bg-rose-500/5 hover:text-rose-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
              >
                <Trash2 className="h-4 w-4" />
                {t.clearAll}
              </button>
            </div>
          </>
        ) : (
          <div className="animate-fade-in flex flex-col items-center justify-center py-32 space-y-4 text-slate-500">
            <div className="rounded-2xl border border-navy-800 bg-navy-800/20 p-5">
              <Bell className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.emptyState}</p>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-md items-center justify-between border-t border-slate-900 bg-navy-950/95 px-6 py-2 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          aria-label={t.navHome}
          className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <Home className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">{t.navHome}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/search")}
          aria-label={t.navSearch}
          className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <Search className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">{t.navSearch}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/post-job")}
          aria-label={t.navPost}
          className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <div className="relative -mt-4 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-navy-800 text-gold-400 shadow-lg">
            <Plus className="h-5 w-5" strokeWidth={3} />
          </div>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider">{t.navPost}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/notifications")}
          aria-label={t.navNotif}
          className="flex flex-col items-center gap-1 text-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <Bell className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">{t.navNotif}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/profile")}
          aria-label={t.navProfile}
          className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <User className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">{t.navProfile}</span>
        </button>
      </nav>
    </div>
  );
}
