import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Design tokens ─────────────────────────────────────────────
const BG     = '#050B18';
const CARD   = '#111827';
const BORDER = '#1F2937';
const GOLD   = '#FACC15';

// ── 10 notification categories ────────────────────────────────
const CATEGORIES = [
  { id: 'all',         icon: '🔔', label: 'Tout'        },
  { id: 'jobs',        icon: '💼', label: 'Jobs'         },
  { id: 'payments',    icon: '💳', label: 'Payments'     },
  { id: 'reservations',icon: '📅', label: 'Reservations' },
  { id: 'messages',    icon: '💬', label: 'Messages'     },
  { id: 'stories',     icon: '📖', label: 'Stories'      },
  { id: 'marketplace', icon: '🛒', label: 'Marketplace'  },
  { id: 'companies',   icon: '🏢', label: 'Companies'    },
  { id: 'system',      icon: '⚙️', label: 'System'       },
  { id: 'security',    icon: '🔒', label: 'Security'     },
  { id: 'ai',          icon: '✨', label: 'AI'           },
];

// ── Category color map ─────────────────────────────────────────
const CAT_COLOR = {
  jobs:         { dot:'#3b82f6', bg:'rgba(59,130,246,0.12)'   },
  payments:     { dot:'#10b981', bg:'rgba(16,185,129,0.12)'   },
  reservations: { dot:'#6366f1', bg:'rgba(99,102,241,0.12)'   },
  messages:     { dot:'#f59e0b', bg:'rgba(245,158,11,0.12)'   },
  stories:      { dot:'#a855f7', bg:'rgba(168,85,247,0.12)'   },
  marketplace:  { dot:'#f97316', bg:'rgba(249,115,22,0.12)'   },
  companies:    { dot:'#06b6d4', bg:'rgba(6,182,212,0.12)'    },
  system:       { dot:'#64748b', bg:'rgba(100,116,139,0.12)'  },
  security:     { dot:'#ef4444', bg:'rgba(239,68,68,0.12)'    },
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
function NotifRow({ notif, onRead, onDelete }) {
  const col  = CAT_COLOR[notif.cat] || { dot:'#64748b', bg:'rgba(100,116,139,0.1)' };
  const catInfo = CATEGORIES.find(c => c.id === notif.cat);

  return (
    <div className={`flex gap-3 px-4 py-4 cursor-pointer transition-colors ${notif.read ? '' : ''}`}
      style={!notif.read ? { background: col.bg } : {}}
      onClick={() => onRead(notif.id)}>

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
          <span className="text-[10px] text-slate-600 shrink-0 mt-0.5">{notif.time}</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{notif.body}</p>
        {/* Category tag */}
        <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full"
          style={{ background: col.bg, color: col.dot }}>
          {catInfo?.icon} {catInfo?.label}
        </span>
      </div>
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
        <div className="flex flex-col items-center justify-center pt-24 gap-3">
          <span className="text-5xl">🔔</span>
          <p className="text-slate-400 text-sm font-bold">Pa gen notifikasyon</p>
          <p className="text-slate-600 text-xs">Ou pral wè notifikasyon yo isit</p>
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
                    <NotifRow notif={n} onRead={handleRead} onDelete={() => {}} />
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
                    <NotifRow notif={n} onRead={handleRead} onDelete={() => {}} />
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
