import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../../api/axios';

// ── Design tokens ─────────────────────────────────────────────
const BG     = '#050B18';
const CARD   = '#111827';
const BORDER = '#1F2937';
const GOLD   = '#FACC15';

// ── 16 entity types ───────────────────────────────────────────
const ENTITY_TYPES = [
  { id: 'all',          icon: '🌐', label: 'Tout'         },
  { id: 'job',          icon: '💼', label: 'Jobs'         },
  { id: 'worker',       icon: '👷', label: 'Workers'      },
  { id: 'company',      icon: '🏢', label: 'Companies'    },
  { id: 'hotel',        icon: '🏨', label: 'Hotels'       },
  { id: 'restaurant',   icon: '🍽', label: 'Restaurants'  },
  { id: 'product',      icon: '📦', label: 'Products'     },
  { id: 'vehicle',      icon: '🚗', label: 'Vehicles'     },
  { id: 'house',        icon: '🏠', label: 'Real Estate'  },
  { id: 'hospital',     icon: '🏥', label: 'Hospitals'    },
  { id: 'clinic',       icon: '🩺', label: 'Clinics'      },
  { id: 'story',        icon: '📖', label: 'Stories'      },
  { id: 'user',         icon: '👤', label: 'Users'        },
  { id: 'reservation',  icon: '📅', label: 'Reservations' },
  { id: 'country',      icon: '🌍', label: 'Countries'    },
  { id: 'city',         icon: '🏙', label: 'Cities'       },
];

// ── Mock results ──────────────────────────────────────────────
const MOCK = {
  job: [
    { id:'j1', title:'Electricien Senior',    sub:'ABC Construction · Punta Cana',   meta:'$900/sem · Full Time',    icon:'💼', badge:'Urgent' },
    { id:'j2', title:'Chef Cuisinier',        sub:'Hotel Playa · Cap-Haïtien',       meta:'$750/sem · Full Time',    icon:'👨‍🍳', badge:null   },
    { id:'j3', title:'Chauffeur Privé',       sub:'VIP Transport · Santo Domingo',   meta:'$600/sem · Permanent',    icon:'🚗', badge:'New'    },
    { id:'j4', title:'Infirmière Certifiée',  sub:'Hôpital Général · Port-au-Prince',meta:'$800/sem · Nuit',         icon:'👩‍⚕️', badge:null  },
  ],
  worker: [
    { id:'w1', title:'Jean-Pierre M.',   sub:'Électricien · 8 ans expérience',  meta:'★ 4.9 · Disponib',  icon:'⚡', badge:'Top'    },
    { id:'w2', title:'Marie Celeste R.', sub:'Infirmière · 5 ans',              meta:'★ 4.8 · Disponib',  icon:'👩‍⚕️', badge:null  },
    { id:'w3', title:'Carlos Mendez',    sub:'Chef / Kuyinye · 12 ans',         meta:'★ 5.0 · Disponib',  icon:'👨‍🍳', badge:'Pro'  },
  ],
  company: [
    { id:'c1', title:'MATCO Construction', sub:'413 branches · 29,481 employees', meta:'Verified · Enterprise', icon:'🏗', badge:'Top'  },
    { id:'c2', title:'Hotel Oloffson',     sub:'35 employees · Port-au-Prince',   meta:'Verified · Hotel',      icon:'🏨', badge:null   },
    { id:'c3', title:'ABC Medical Group',  sub:'12 clinics · Haiti & DR',         meta:'Verified · Medical',    icon:'🏥', badge:null   },
  ],
  hotel: [
    { id:'h1', title:'Hotel Montana',       sub:'Port-au-Prince · 4★ · 85 chambres', meta:'$120/nuit · Disponib',  icon:'🏨', badge:'Best'  },
    { id:'h2', title:'Royal Decameron DR',  sub:'Montrouis · 5★ · 352 chambres',     meta:'$280/nuit · Disponib',  icon:'🏨', badge:null    },
    { id:'h3', title:'Karibe Convention',   sub:'Port-au-Prince · 4★',               meta:'$150/nuit · Disponib',  icon:'🏨', badge:null    },
  ],
  restaurant: [
    { id:'r1', title:'Chez Marie',        sub:'Pétionville · Cuisine Créole', meta:'★ 4.8 · Open',     icon:'🍽', badge:'Hot'  },
    { id:'r2', title:'La Souvenance',     sub:'Port-au-Prince · Haïtienne',   meta:'★ 4.6 · Open',     icon:'🥘', badge:null   },
  ],
  product: [
    { id:'p1', title:'iPhone 16 Pro Max',  sub:'TechShop DR · Punta Cana',     meta:'$1,099 · Verified',  icon:'📱', badge:'Hot'  },
    { id:'p2', title:'Toyota Hilux 2023',  sub:'AutoDeal · Santo Domingo',      meta:'$32,000 · Dealer',   icon:'🚗', badge:null   },
    { id:'p3', title:'MacBook Pro M3',     sub:'iCenter HT · Pétionville',      meta:'$2,499 · New',       icon:'💻', badge:null   },
  ],
  house: [
    { id:'re1', title:'Villa 4 Chambres — Pétion-Ville', sub:'ImmoHaïti · 450m² · Piscine', meta:'$850,000 · Vann',    icon:'🏠', badge:null   },
    { id:'re2', title:'Apt T3 Centre Commercial',         sub:'Delmas 33 · 120m² · Balcon',  meta:'$1,200/mois · Loye', icon:'🏢', badge:'New'  },
  ],
  user: [
    { id:'u1', title:'Ronald Monfils', sub:'Elektrisyen · Punta Cana',    meta:'★ 4.9 · 127 travay',  icon:'👤', badge:'Pro'  },
    { id:'u2', title:'Marie Solange',  sub:'Enfimyè · Port-au-Prince',   meta:'★ 4.8 · 89 travay',   icon:'👤', badge:null   },
  ],
  city: [
    { id:'ct1', title:'Port-au-Prince', sub:'Haiti · 1.2M habitans',       meta:'2,381 djòb aktif',     icon:'🏙', badge:null   },
    { id:'ct2', title:'Punta Cana',     sub:'Dominican Republic · Tourism', meta:'1,847 djòb aktif',     icon:'🏖', badge:'Hot'  },
    { id:'ct3', title:'Cap-Haïtien',    sub:'Haiti · 2nd pi gwo vil',       meta:'987 djòb aktif',       icon:'🏙', badge:null   },
  ],
};

const TRENDING = [
  'Électricien', 'Chef Cuisinier', 'iPhone 16', 'Hotel Punta Cana',
  'Toyota Hilux', 'Appartement Delmas', 'Infirmière', 'Chauffeur',
  'Construction Haiti', 'MacBook Pro',
];

const RECENT = [
  'electricien cap-haïtien',
  'hotel port-au-prince 4 etoile',
  'macbook pro m3',
];

// ── Chevron SVG ───────────────────────────────────────────────
function Chevron() {
  return (
    <svg className="w-4 h-4 text-slate-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6"/>
    </svg>
  );
}

// ── Search input box ──────────────────────────────────────────
function SearchInput({ value, onChange, inputRef }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-[16px] transition-all"
      style={{ background: CARD, border:`1px solid ${BORDER}` }}>
      <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35"/>
      </svg>
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search everything..."
        autoComplete="off"
        className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="text-slate-500 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/>
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Result card inside a grouped section ──────────────────────
function ResultItem({ item, isLast }) {
  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-white/[0.015] active:bg-white/[0.025]">
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-xl shrink-0"
          style={{ background: BORDER }}>
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-[13px] font-bold text-white truncate">{item.title}</p>
            {item.badge && (
              <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background:`${GOLD}20`, color: GOLD, border:`1px solid ${GOLD}35` }}>
                {item.badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate">{item.sub}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">{item.meta}</p>
        </div>
        <Chevron />
      </div>
      {!isLast && <div className="h-px mx-4" style={{ background: BORDER }} />}
    </>
  );
}

// ── Grouped section ───────────────────────────────────────────
function ResultSection({ typeId, items }) {
  const info = ENTITY_TYPES.find(e => e.id === typeId);
  if (!info || !items?.length) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{info.icon}</span>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">{info.label}</p>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-slate-600"
            style={{ background: BORDER }}>{items.length}</span>
        </div>
        <button type="button" className="text-[11px] font-bold hover:opacity-80 transition-opacity"
          style={{ color: GOLD }}>
          Wè tout
        </button>
      </div>
      <div className="rounded-[20px] overflow-hidden shadow-xl shadow-black/30"
        style={{ background: CARD, border:`1px solid ${BORDER}` }}>
        {items.map((item, idx) => (
          <ResultItem key={item.id} item={item} isLast={idx === items.length - 1} />
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function UniversalSearch() {
  const navigate          = useNavigate();
  const [params]          = useSearchParams();
  const inputRef          = useRef(null);

  const [query,       setQuery]       = useState(params.get('q') || '');
  const [activeType,  setActiveType]  = useState('all');
  const [results,     setResults]     = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [hasSearched, setHasSearched] = useState(!!params.get('q'));

  // Focus on mount
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  // Debounced search — tries real API then merges with mock fallback
  useEffect(() => {
    if (!query.trim()) { setResults(null); setHasSearched(false); return; }
    setHasSearched(true);
    setLoading(true);
    const timer = setTimeout(async () => {
      const q = query.toLowerCase();

      // Filter mock data
      const filtered = {};
      Object.entries(MOCK).forEach(([type, items]) => {
        const matched = items.filter(it =>
          it.title.toLowerCase().includes(q) ||
          it.sub.toLowerCase().includes(q)   ||
          it.meta.toLowerCase().includes(q)
        );
        if (matched.length) filtered[type] = matched;
      });

      // Try real jobs API — merge real results on top of mock jobs
      try {
        const res = await API.get('/jobs', { params: { category: query }, timeout: 5000 });
        const apiJobs = Array.isArray(res?.data) ? res.data : [];
        if (apiJobs.length > 0) {
          const mapped = apiJobs.map(j => ({
            id: j.id || j._id,
            title: j.title,
            sub: `${j.createdBy || 'JOBFAST'} · ${j.location?.city || ''}`,
            meta: `$${j.budget || 0} · ${j.type || 'Full Time'}`,
            icon: '💼',
            badge: j.status === 'open' ? 'Open' : null,
          }));
          filtered.job = [...mapped, ...(filtered.job || [])];
        }
      } catch (_) { /* keep mock jobs */ }

      // Try real users search
      try {
        const res = await API.get('/users', { params: { q: query }, timeout: 5000 });
        const apiUsers = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
        if (apiUsers.length > 0) {
          const mapped = apiUsers.map(u => ({
            id: u._id || u.id,
            title: u.name,
            sub: `${u.profession || u.role || 'Worker'} · ${u.location?.city || ''}`,
            meta: `★ ${u.stats?.rating || '5.0'} · ${u.stats?.totalJobs || 0} jobs`,
            icon: '👤',
            badge: u.availability === 'available' ? 'Available' : null,
          }));
          filtered.user = [...mapped, ...(filtered.user || [])];
        }
      } catch (_) { /* keep mock users */ }

      setResults(Object.keys(filtered).length ? filtered : {});
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Displayed results based on active type filter
  const displayed = results
    ? (activeType === 'all' ? results : { [activeType]: results[activeType] || [] })
    : {};

  const hasResults = Object.values(displayed).some(a => a?.length);

  return (
    <div className="min-h-screen pb-24 text-white" style={{ background: BG }}>

      {/* ── STICKY HEADER ─────────────────────────────────────── */}
      <div className="sticky top-14 z-30 px-4 pt-3.5 pb-3.5 border-b"
        style={{ background:`${BG}FC`, backdropFilter:'blur(20px)', borderColor: BORDER }}>
        <SearchInput value={query} onChange={setQuery} inputRef={inputRef} />
      </div>

      {/* ── TYPE FILTER CHIPS (only when results exist) ───────── */}
      {hasSearched && results && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-2" style={{ scrollbarWidth:'none' }}>
          {ENTITY_TYPES.map(et => {
            const count = results[et.id]?.length || 0;
            const show  = et.id === 'all' || count > 0;
            if (!show) return null;
            return (
              <button key={et.id} type="button" onClick={() => setActiveType(et.id)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-150 active:scale-95"
                style={activeType === et.id
                  ? { background: GOLD, color: BG, borderColor: GOLD, boxShadow:'0 4px 14px rgba(250,204,21,0.18)' }
                  : { background: CARD, color:'#94a3b8', borderColor: BORDER }}>
                <span>{et.icon}</span> {et.label}
                {et.id !== 'all' && count > 0 && (
                  <span className="px-1 rounded-full text-[9px] font-black"
                    style={activeType === et.id
                      ? { background:'rgba(0,0,0,0.2)', color: BG }
                      : { background: BORDER, color:'#64748b' }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── LOADING ───────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col gap-3 px-4 pt-5">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-[62px] rounded-[16px] animate-pulse" style={{ background: CARD }} />
          ))}
        </div>
      )}

      {/* ── RESULTS ───────────────────────────────────────────── */}
      {!loading && hasSearched && (
        <div className="px-4 pt-4 space-y-5">
          {hasResults
            ? Object.entries(displayed).map(([type, items]) => (
                <ResultSection key={type} typeId={type} items={items} />
              ))
            : (
              <div className="flex flex-col items-center justify-center pt-20 gap-3">
                <span className="text-5xl">🔍</span>
                <p className="text-slate-400 text-sm font-bold">Okenn rezilta pou "{query}"</p>
                <p className="text-slate-600 text-xs">Eseye mo kle diferan</p>
              </div>
            )
          }
        </div>
      )}

      {/* ── PRE-SEARCH STATE ──────────────────────────────────── */}
      {!hasSearched && !loading && (
        <div className="px-4 pt-5 space-y-7">

          {/* Recent searches */}
          {RECENT.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Rechèch Resan</p>
                <button type="button" className="text-[11px] font-bold text-slate-600 hover:text-slate-400 transition-colors">
                  Efase tout
                </button>
              </div>
              <div className="space-y-1">
                {RECENT.map(r => (
                  <button key={r} type="button" onClick={() => setQuery(r)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[12px] text-sm text-slate-300 hover:text-white hover:bg-white/[0.03] transition-all text-left">
                    <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                    </svg>
                    {r}
                    <Chevron />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">🔥 Trending</p>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map(t => (
                <button key={t} type="button" onClick={() => setQuery(t)}
                  className="px-3 py-2 rounded-full text-[12px] font-bold border transition-all duration-150 active:scale-95 text-slate-300 hover:text-white"
                  style={{ background: CARD, borderColor: BORDER }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Search by category grid */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">Chèche pa Kategori</p>
            <div className="grid grid-cols-4 gap-2">
              {ENTITY_TYPES.filter(e => e.id !== 'all').map(e => (
                <button key={e.id} type="button" onClick={() => { setQuery(e.label); setActiveType(e.id); }}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-[16px] border transition-all duration-150 active:scale-95"
                  style={{ background: CARD, borderColor: BORDER }}>
                  <span className="text-xl leading-none">{e.icon}</span>
                  <span className="text-[8px] font-bold text-slate-400 leading-tight text-center px-1">{e.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
