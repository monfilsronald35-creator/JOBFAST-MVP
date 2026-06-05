import React, { useState } from 'react';
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
  PlusSquare,
  User
} from 'lucide-react';

// 1. Diksyonè Tradiksyon (Ou ka deplase sa nan yon fichye separe pita tankou locales.js)
const TRANSLATIONS = {
  ht: {
    title: "Notifikasyon",
    newBadge: "Nouvo",
    emptyState: "Ou pa gen okenn notifikasyon.",
    clearAll: "Tout efase",
    confirmClear: "Èske ou sèten ou vle efase tout notifikasyon yo?",
    navHome: "Akeyi",
    navSearch: "Rechèch",
    navPost: "Paste",
    navNotif: "Notifikasyon",
    navProfile: "Profil",
    timeJustNow: "Kounye a",
    timeMinutes: "minit de sa",
    timeHours: "èdtan de sa",
    timeDays: "jou de sa",
    timeYesterday: "Yè"
  },
  en: {
    title: "Notifications",
    newBadge: "New",
    emptyState: "You have no notifications.",
    clearAll: "Clear All",
    confirmClear: "Are you sure you want to delete all notifications?",
    navHome: "Home",
    navSearch: "Search",
    navPost: "Post",
    navNotif: "Notifications",
    navProfile: "Profile",
    timeJustNow: "Just now",
    timeMinutes: "minutes ago",
    timeHours: "hours ago",
    timeDays: "days ago",
    timeYesterday: "Yesterday"
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

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  // Ou ka kontwole lang nan depi nan anviwònman app a ('ht' oswa 'en')
  const [lang] = useState('ht'); 
  const t = TRANSLATIONS[lang];

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
    
    return new Date(isoString).toLocaleDateString(lang === 'ht' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'job_nearby':
        return <Briefcase className="w-5 h-5 text-amber-500" />;
      case 'response':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'service_nearby':
        return <Bell className="w-5 h-5 text-indigo-400" />;
      case 'job_completed':
        return <Star className="w-5 h-5 text-green-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="h-screen bg-[#0B1528] text-white flex flex-col max-w-md mx-auto shadow-2xl font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="px-4 pt-6 pb-4 bg-[#0F1E36] border-b border-gray-800/60 flex items-center justify-between shrink-0 z-50 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center gap-3">
          <button className="p-1.5 hover:bg-gray-800 active:scale-95 rounded-full transition-all">
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <h1 className="text-xl font-bold tracking-wide">{t.title}</h1>
        </div>
        <div className="relative p-2 bg-[#132644] rounded-xl border border-gray-800">
          <Bell className="w-5 h-5 text-amber-500" />
          {notifications.some(n => n.unread) && (
            <span className="absolute top-2 right-2 bg-red-500 w-2 h-2 rounded-full animate-pulse" />
          )}
        </div>
      </header>

      {/* NOTIFICATIONS LIST */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
        {notifications.length > 0 ? (
          <>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex items-start gap-4 transform active:scale-[0.99]
                  ${notif.unread 
                    ? 'bg-[#132644] border-amber-500/20 shadow-md' 
                    : 'bg-[#0F1E36]/40 border-gray-800/40 hover:bg-[#0F1E36]/80'
                  }`}
              >
                <div className="p-2.5 rounded-xl flex-shrink-0 bg-[#0B1528] border border-gray-800 shadow-inner">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`text-sm font-semibold truncate ${notif.unread ? 'text-white font-bold' : 'text-gray-300 font-medium'}`}>
                      {notif.title}
                    </h3>
                    {notif.unread && (
                      <span className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                        {t.newBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-normal mb-2 leading-relaxed">
                    {notif.description}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(notif.createdAt)}</span>
                  </div>
                </div>

                <div className="self-center text-gray-600 pl-1">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}

            <div className="pt-2 pb-6">
              <button
                onClick={clearAll}
                className="w-full py-3 bg-transparent border border-dashed border-gray-800 hover:border-red-500/40 hover:bg-red-500/5 rounded-xl text-xs font-semibold text-gray-500 hover:text-red-400 transition-all flex items-center justify-center gap-2 uppercase tracking-widest active:scale-98"
              >
                <Trash2 className="w-4 h-4" />
                {t.clearAll}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-gray-500 space-y-4">
            <div className="p-5 bg-[#0F1E36] rounded-full border border-gray-800">
              <Bell className="w-10 h-10 text-gray-650" />
            </div>
            <p className="text-sm font-medium text-gray-400">{t.emptyState}</p>
          </div>
        )}
      </main>

      {/* BOTTOM NAV BAR */}
      <nav className="shrink-0 bg-[#0F1E36] border-t border-gray-800 px-6 py-3 flex items-center justify-between text-gray-400 z-50">
        <button className="flex flex-col items-center gap-1 active:scale-90 transition-all">
          <Home className="w-5 h-5" />
          <span className="text-[10px]">{t.navHome}</span>
        </button>
        <button className="flex flex-col items-center gap-1 active:scale-90 transition-all">
          <Search className="w-5 h-5" />
          <span className="text-[10px]">{t.navSearch}</span>
        </button>
        <button className="flex flex-col items-center gap-1 active:scale-90 transition-all">
          <PlusSquare className="w-5 h-5" />
          <span className="text-[10px]">{t.navPost}</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-amber-500 active:scale-90 transition-all">
          <Bell className="w-5 h-5" />
          <span className="text-[10px] font-bold">{t.navNotif}</span>
        </button>
        <button className="flex flex-col items-center gap-1 active:scale-90 transition-all">
          <User className="w-5 h-5" />
          <span className="text-[10px]">{t.navProfile}</span>
        </button>
      </nav>

    </div>
  );
};

export default NotificationsScreen;
