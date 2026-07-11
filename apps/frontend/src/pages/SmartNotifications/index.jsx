import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────
const BG     = '#050B18';
const CARD   = '#111827';
const BORDER = '#1F2937';
const GOLD   = '#FACC15';

// ── 14 notification categories ────────────────────────────────
const CATEGORIES = [
  { id: 'all',         icon: '🔔', label: 'Tout'          },
  { id: 'jobs',        icon: '💼', label: 'Jobs'           },
  { id: 'messages',    icon: '💬', label: 'Messages'       },
  { id: 'calls',       icon: '📞', label: 'Calls'          },
  { id: 'payments',    icon: '💳', label: 'Payments'       },
  { id: 'reservations',icon: '📅', label: 'Reservations'  },
  { id: 'marketplace', icon: '🛒', label: 'Marketplace'   },
  { id: 'stories',     icon: '📖', label: 'Stories'        },
  { id: 'followers',   icon: '👥', label: 'Followers'      },
  { id: 'reviews',     icon: '⭐', label: 'Reviews'        },
  { id: 'companies',   icon: '🏢', label: 'Companies'      },
  { id: 'security',    icon: '🔒', label: 'Security'       },
  { id: 'promotions',  icon: '🎯', label: 'Promotions'    },
  { id: 'ai',          icon: '✨', label: 'AI'             },
];

// ── Category color map ─────────────────────────────────────────
const CAT_COLOR = {
  jobs:         { dot:'#3b82f6', bg:'rgba(59,130,246,0.12)'   },
  messages:     { dot:'#f59e0b', bg:'rgba(245,158,11,0.12)'   },
  calls:        { dot:'#10b981', bg:'rgba(16,185,129,0.12)'   },
  payments:     { dot:'#10b981', bg:'rgba(16,185,129,0.12)'   },
  reservations: { dot:'#6366f1', bg:'rgba(99,102,241,0.12)'   },
  marketplace:  { dot:'#f97316', bg:'rgba(249,115,22,0.12)'   },
  stories:      { dot:'#a855f7', bg:'rgba(168,85,247,0.12)'   },
  followers:    { dot:'#06b6d4', bg:'rgba(6,182,212,0.12)'    },
  reviews:      { dot:'#f59e0b', bg:'rgba(245,158,11,0.12)'   },
  companies:    { dot:'#06b6d4', bg:'rgba(6,182,212,0.12)'    },
  security:     { dot:'#ef4444', bg:'rgba(239,68,68,0.12)'    },
  promotions:   { dot:'#f97316', bg:'rgba(249,115,22,0.10)'   },
  ai:           { dot: GOLD,     bg:'rgba(250,204,21,0.10)'   },
};

// ── Mock notifications ────────────────────────────────────────
const MOCK_NOTIFS = [
  { id:'n1',  cat:'jobs',         icon:'💼', title:'Nouvo djòb pou ou',          body:'Electricien Senior — ABC Construction · Punta Cana · $900/sem',         time:'5m',  read:false, gold:true  },
  { id:'n2',  cat:'messages',     icon:'💬', title:'Jean-Pierre voye mesaj',      body:'Bonjou, èske ou disponib pou demen maten?',                              time:'12m', read:false, gold:false },
  { id:'n3',  cat:'payments',     icon:'💳', title:'Peman konfime',               body:'$245.00 kreditye nan wallet — Escrow #2891 kloti',                       time:'1h',  read:false, gold:true  },
  { id:'n4',  cat:'ai',           icon:'✨', title:'AI rekòmande 3 djòb',         body:'Electricien 92% · Chef 88% · Chofè 85% — Mach profil ou',               time:'2h',  read:false, gold:true  },
  { id:'n5',  cat:'reservations', icon:'📅', title:'Rezèvasyon konfime ✓',        body:'Hotel Montana · 15 Jiyè 2026 · 2 nuits · $240 — Nimewo BK#8821',        time:'3h',  read:true,  gold:false },
  { id:'n6',  cat:'jobs',         icon:'💼', title:'Konpayi wè profil ou',        body:'ABC Construction ouvri dosye ou — Chef Kuyinye (Ref: JB-441)',           time:'4h',  read:true,  gold:false },
  { id:'n7',  cat:'marketplace',  icon:'🛒', title:'Yon moun vle achte pwodui ou',body:'iPhone 16 Pro Max — Ofè: $950 (ou mande $1,099)',                        time:'5h',  read:true,  gold:false },
  { id:'n8',  cat:'stories',      icon:'📖', title:'ABC Hotel poste istwa',       body:'Promo Vandredi: 50% rabè sou tout chanm pou wikenn 18–20 Jiyè',         time:'6h',  read:true,  gold:false },
  { id:'n9',  cat:'jobs',         icon:'💼', title:'Entèvyou planifye',           body:'MATCO Construction — Elektriche Senior — Vandredi 18 Jiyè 10h AM',      time:'7h',  read:true,  gold:false },
  { id:'n10', cat:'ai',           icon:'✨', title:'Konsèy pou amelyore profil',  body:'Ajoute 2 sètifika → +35% vizibilite. Profil aktif: 68%',               time:'8h',  read:true,  gold:false },
  { id:'n11', cat:'payments',     icon:'💳', title:'Ranbousman trete',            body:'Escrow #2756 · $180 ap retounen nan wallet ou nan 24h',                  time:'1j',  read:true,  gold:false },
  { id:'n12', cat:'reservations', icon:'📅', title:'Rapèl: rezèvasyon demen',     body:'Clinique St-Luc · 16 Jiyè 9h00 · Doktè Marcelin · Sal 4',              time:'1j',  read:true,  gold:false },
  { id:'n13', cat:'companies',    icon:'🏢', title:'Konpayi ap swiv ou',          body:'MATCO Construction (413 branches) kòmanse swiv profil ou',              time:'1j',  read:true,  gold:false },
  { id:'n14', cat:'security',     icon:'🔒', title:'Nouvo koneksyon detekte',     body:'Koneksyon nan Chrome / Windows — Punta Cana, DR — Si se pa ou, bloke',  time:'2j',  read:true,  gold:false },
  { id:'n15', cat:'system',       icon:'⚙️', title:'JOBFAST v2.4.1 disponib',     body:'Nouvo fonksyon: AI Smart Feed · Marketplace 18 seksyon · Wallet Crypto', time:'2j',  read:true,  gold:false },
  { id:'n16', cat:'marketplace',  icon:'🛒', title:'Pwodui ou vann!',             body:'Toyota Hilux 2023 · Vann pou $31,500 · Transfere nan wallet ou',         time:'3j',  read:true,  gold:true  },
  { id:'n17', cat:'messages',     icon:'💬', title:'Marie Solange voye yon foto', body:'[Foto] — Swiv konvèsasyon an pou wè atachman an',                        time:'3j',  read:true,  gold:false },
  { id:'n18', cat:'ai',           icon:'✨', title:'Rapò Semèn AI',               body:'Semèn sa a: 47 pwofil wè ou · 12 kontakte · 3 ofè resevwa',             time:'4j',  read:true,  gold:false },
];

// ── Destination page per category ─────────────────────────────
const CAT_ROUTE = {
  jobs:         '/jobs',
  messages:     '/chat',
  calls:        '/chat',
  payments:     '/wallet',
  reservations: '/booking',
  marketplace:  '/market',
  stories:      '/market',
  followers:    '/search',
  reviews:      '/settings',
  companies:    '/search',
  security:     '/settings',
  promotions:   '/market',
  ai:           '/jobs',
};

// ── Quick action chips per category ───────────────────────────
// route → navigate there; toggle → local optimistic toggle only
const CAT_ACTIONS = {
  jobs: [
    { label: 'Apply',   icon: '✅', route: '/search'  },
    { label: 'Save',    icon: '🔖', toggle: true       },
    { label: 'Message', icon: '💬', route: '/chat'     },
  ],
  payments: [
    { label: 'Details',  icon: '📄', route: '/wallet'  },
    { label: 'Receipt',  icon: '🧾', route: '/wallet'  },
    { label: 'Support',  icon: '🎧', route: '/chat'    },
  ],
  reservations: [
    { label: 'Details',  icon: '📅', route: '/booking' },
    { label: 'Pay',      icon: '💳', route: '/wallet'  },
    { label: 'Cancel',   icon: '❌', route: '/booking' },
  ],
  messages: [
    { label: 'Reply',    icon: '💬', route: '/chat'    },
    { label: 'Call',     icon: '📞', route: '/chat'    },
    { label: 'Video',    icon: '📹', route: '/chat'    },
  ],
  calls: [
    { label: 'Rappèl',   icon: '📞', route: '/chat'    },
    { label: 'Message',  icon: '💬', route: '/chat'    },
    { label: 'Video',    icon: '📹', route: '/chat'    },
  ],
  followers: [
    { label: 'Profile',  icon: '👤', route: '/search'  },
    { label: 'Follow',   icon: '➕', toggle: true       },
    { label: 'Message',  icon: '💬', route: '/chat'     },
  ],
  reviews: [
    { label: 'Wè',       icon: '⭐', route: '/settings'},
    { label: 'Reponn',   icon: '💬', route: '/settings'},
  ],
  promotions: [
    { label: 'Wè Ofè',  icon: '🎯', route: '/market'  },
    { label: 'Sove',     icon: '🔖', toggle: true       },
  ],
  stories: [
    { label: 'View',     icon: '👁',  route: '/market'  },
    { label: 'Like',     icon: '❤️',  toggle: true       },
    { label: 'Share',    icon: '↗',  toggle: true       },
  ],
  marketplace: [
    { label: 'View',     icon: '🛒', route: '/market'  },
    { label: 'Buy',      icon: '💳', route: '/market'  },
    { label: 'Offer',    icon: '💰', route: '/market'  },
  ],
  companies: [
    { label: 'Profile',  icon: '🏢', route: '/search'  },
    { label: 'Jobs',     icon: '💼', route: '/search'  },
    { label: 'Contact',  icon: '📩', route: '/chat'    },
  ],
  system: [
    { label: 'Updates',  icon: '🔄', route: '/settings'},
    { label: 'Privacy',  icon: '🔏', route: '/settings'},
    { label: 'Help',     icon: '❓', route: '/settings'},
  ],
  security: [
    { label: 'Review',   icon: '🔒', route: '/settings'},
    { label: 'Block',    icon: '🚫', toggle: true       },
  ],
  ai: [
    { label: 'View Jobs',icon: '✨', route: '/search'  },
    { label: 'Apply',    icon: '✅', route: '/search'  },
  ],
};

// ── Count per category ────────────────────────────────────────
function getCounts(notifs) {
  const unread = notifs.filter(n => !n.read);
  const counts = { all: unread.length };
  CATEGORIES.forEach(c => {
    if (c.id !== 'all') counts[c.id] = unread.filter(n => n.cat === c.id).length;
  });
  return counts;
}

// ── Single notification row ───────────────────────────────────
function NotifRow({ notif, onRead, navigate }) {
  const [toggled, setToggled] = useState({});
  const [pressing, setPressing] = useState(false);

  const col     = CAT_COLOR[notif.cat] || { dot:'#64748b', bg:'rgba(100,116,139,0.1)' };
  const actions = CAT_ACTIONS[notif.cat] || [];
  const destRoute = CAT_ROUTE[notif.cat] || '/notifications';

  function handleRowClick() {
    onRead(notif.id);
    setPressing(true);
    setTimeout(() => { setPressing(false); navigate(destRoute); }, 120);
  }

  function handleAction(e, action) {
    e.stopPropagation();
    if (action.toggle) {
      setToggled(prev => ({ ...prev, [action.label]: !prev[action.label] }));
    } else {
      onRead(notif.id);
      navigate(action.route);
    }
  }

  return (
    <div
      onClick={handleRowClick}
      className="px-4 pt-4 pb-3 cursor-pointer transition-colors select-none"
      style={{
        background: !notif.read ? col.bg : 'transparent',
        transform: pressing ? 'scale(0.985)' : 'scale(1)',
        transition: 'transform 0.12s ease, background 0.15s ease',
        WebkitTapHighlightColor: 'transparent',
      }}>

      <div className="flex gap-3">
        {/* Icon bubble */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-[14px] flex items-center justify-center text-xl"
            style={{ background: col.bg, border:`1px solid ${col.dot}30` }}>
            {notif.icon}
          </div>
          {!notif.read && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: col.dot, borderColor: BG }} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-[13px] leading-snug ${notif.read ? 'font-medium text-slate-300' : 'font-black text-white'}`}>
              {notif.title}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-slate-600">{notif.time}</span>
              <ChevronRight className="w-3 h-3 text-slate-700" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{notif.body}</p>
        </div>
      </div>

      {/* Action chips */}
      {actions.length > 0 && (
        <div className="flex gap-1.5 mt-2.5 ml-13 flex-wrap" onClick={e => e.stopPropagation()}
          style={{ paddingLeft: '52px' }}>
          {actions.map(action => (
            <button key={action.label} type="button"
              onClick={e => handleAction(e, action)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-black border transition-all duration-150 active:scale-95"
              style={toggled[action.label]
                ? { background:`${GOLD}20`, borderColor:`${GOLD}50`, color: GOLD }
                : { background:'rgba(255,255,255,0.04)', borderColor:'#1F2937', color:'#94a3b8' }}>
              <span className="text-[11px] leading-none">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function SmartNotifications() {
  const navigate = useNavigate();

  const [notifs,     setNotifs]     = useState(MOCK_NOTIFS);
  const [activeTab,  setActiveTab]  = useState('all');

  const counts = getCounts(notifs);

  const handleRead = useCallback((id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const handleReadAll = useCallback(() => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const filtered = notifs.filter(n => activeTab === 'all' || n.cat === activeTab);

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="min-h-screen pb-24 text-white" style={{ background: BG }}>

      {/* ── HEADER ────────────────────────────────────────────── */}
      <div className="sticky top-14 z-30 border-b" style={{ background:`${BG}FC`, backdropFilter:'blur(20px)', borderColor: BORDER }}>

        {/* Title row */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background:`${GOLD}20`, color: GOLD, border:`1px solid ${GOLD}30` }}>
                {unreadCount} nouvo
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button type="button" onClick={handleReadAll}
              className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors">
              Mak tout li ✓
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3" style={{ scrollbarWidth:'none' }}>
          {CATEGORIES.map(cat => {
            const cnt = counts[cat.id] || 0;
            return (
              <button key={cat.id} type="button" onClick={() => setActiveTab(cat.id)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-150 active:scale-95"
                style={activeTab === cat.id
                  ? { background: GOLD, color: BG, borderColor: GOLD, boxShadow:'0 4px 14px rgba(250,204,21,0.18)' }
                  : { background: CARD, color:'#94a3b8', borderColor: BORDER }}>
                <span>{cat.icon}</span>
                {cat.label}
                {cnt > 0 && (
                  <span className="px-1.5 rounded-full text-[9px] font-black"
                    style={activeTab === cat.id
                      ? { background:'rgba(0,0,0,0.2)', color: BG }
                      : { background:`${GOLD}25`, color: GOLD }}>
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── NOTIFICATION LIST ─────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 gap-3 px-6 text-center">
          <div className="w-20 h-20 rounded-[24px] flex items-center justify-center text-4xl"
            style={{ background:`${GOLD}10`, border:`1px solid ${GOLD}20` }}>
            {CATEGORIES.find(c => c.id === activeTab)?.icon || '🔔'}
          </div>
          <p className="text-white font-black text-base">Pa gen notifikasyon</p>
          <p className="text-slate-500 text-sm leading-relaxed">
            {activeTab === 'all'
              ? 'Ou pral wè tout notifikasyon ou yo isit.'
              : `Pa gen notifikasyon ${CATEGORIES.find(c=>c.id===activeTab)?.label || ''} pou kounye a.`}
          </p>
          <button type="button" onClick={() => navigate(CAT_ROUTE[activeTab] || '/dashboard')}
            className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-black border transition-all active:scale-95"
            style={{ background:`${GOLD}15`, borderColor:`${GOLD}30`, color: GOLD }}>
            {CATEGORIES.find(c=>c.id===activeTab)?.icon} Ale nan{' '}
            {CATEGORIES.find(c=>c.id===activeTab)?.label || 'Home'}
          </button>
        </div>
      ) : (
        <div className="mt-2">
          {/* Group: unread */}
          {filtered.some(n => !n.read) && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-4 py-2">Nouvo</p>
              <div className="rounded-[0px] overflow-hidden">
                {filtered.filter(n => !n.read).map((n, idx, arr) => (
                  <React.Fragment key={n.id}>
                    <NotifRow notif={n} onRead={handleRead} navigate={navigate} />
                    {idx < arr.length - 1 && <div className="h-px mx-4" style={{ background: BORDER }} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Divider between unread/read */}
          {filtered.some(n => !n.read) && filtered.some(n => n.read) && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 h-px" style={{ background: BORDER }} />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Plus tò</span>
              <div className="flex-1 h-px" style={{ background: BORDER }} />
            </div>
          )}

          {/* Group: read */}
          {filtered.some(n => n.read) && (
            <div>
              {!filtered.some(n => !n.read) && (
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-4 py-2">Tout notifikasyon</p>
              )}
              <div>
                {filtered.filter(n => n.read).map((n, idx, arr) => (
                  <React.Fragment key={n.id}>
                    <NotifRow notif={n} onRead={handleRead} navigate={navigate} />
                    {idx < arr.length - 1 && <div className="h-px mx-4" style={{ background: BORDER }} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
