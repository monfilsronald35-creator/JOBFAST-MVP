import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { marketplaceAPI } from '../../services/marketplace';

// ── Design tokens ─────────────────────────────────────────────
const BG     = '#050B18';
const CARD   = '#111827';
const BORDER = '#1F2937';
const GOLD   = '#FACC15';

// ── 18 categories ─────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',           icon: '🌐', label: 'Tout'             },
  { id: 'products',      icon: '📦', label: 'Products'         },
  { id: 'services',      icon: '🛎', label: 'Services'         },
  { id: 'vehicles',      icon: '🚗', label: 'Vehicles'         },
  { id: 'construction',  icon: '🏗', label: 'Construction'     },
  { id: 'medical',       icon: '🏥', label: 'Medical'          },
  { id: 'hotels',        icon: '🏨', label: 'Hotels'           },
  { id: 'restaurant_eq', icon: '🍳', label: 'Restaurant Equip' },
  { id: 'rental',        icon: '🔑', label: 'Rental'           },
  { id: 'wholesale',     icon: '🏭', label: 'Wholesale'        },
  { id: 'auction',       icon: '🔨', label: 'Auction'          },
  { id: 'real_estate',   icon: '🏠', label: 'Real Estate'      },
  { id: 'electronics',   icon: '📱', label: 'Electronics'      },
  { id: 'fashion',       icon: '👗', label: 'Fashion'          },
  { id: 'furniture',     icon: '🪑', label: 'Furniture'        },
  { id: 'agriculture',   icon: '🌾', label: 'Agriculture'      },
  { id: 'machinery',     icon: '⚙️', label: 'Machinery'        },
  { id: 'luxury',        icon: '💎', label: 'Luxury'           },
  { id: 'digital',       icon: '💾', label: 'Digital'          },
];

// ── Mock listings ──────────────────────────────────────────────
const MOCK = [
  { _id:'m1', title:'iPhone 16 Pro Max 256GB', category:'electronics', price:1099,  currency:'USD', city:'Punta Cana',     image:'📱', seller:'TechShop DR',   sellerType:'Seller',   rating:4.9, postedAt:'2h', verified:true  },
  { _id:'m2', title:'Toyota Hilux 2023 4×4',   category:'vehicles',    price:32000, currency:'USD', city:'Santo Domingo',  image:'🚗', seller:'AutoDeal DR',   sellerType:'Dealer',   rating:4.7, postedAt:'1j', verified:true  },
  { _id:'m3', title:'Concrete Mixer 350L',      category:'construction',price:1200,  currency:'USD', city:'Port-au-Prince', image:'🏗', seller:'MATCO Supply',  sellerType:'Supplier', rating:4.8, postedAt:'3h', verified:true  },
  { _id:'m4', title:'MacBook Pro M3 14"',        category:'electronics', price:2499,  currency:'USD', city:'Pétionville',   image:'💻', seller:'iCenter HT',    sellerType:'Seller',   rating:4.6, postedAt:'5h', verified:true  },
  { _id:'m5', title:'Appartement T3 Centre-Ville', category:'real_estate', price:95000, currency:'USD', city:'Delmas',     image:'🏠', seller:'ImmoHaiti',     sellerType:'Agent',    rating:4.5, postedAt:'2j', verified:true  },
  { _id:'m6', title:'Groupe électrogène 5KW',   category:'equipment',   price:3500,  currency:'USD', city:'Cap-Haïtien',   image:'⚡', seller:'PowerDR SA',    sellerType:'Supplier', rating:4.4, postedAt:'4h', verified:false },
  { _id:'m7', title:'Plomberie résidentielle',  category:'services',    price:150,   currency:'USD', city:'Punta Cana',    image:'🔧', seller:'Jean Fils',     sellerType:'Provider', rating:4.8, postedAt:'1h', verified:true  },
  { _id:'m8', title:'Lit king-size + Matelas',  category:'furniture',   price:800,   currency:'USD', city:'Jacmel',        image:'🛏', seller:'Meubles Haiti', sellerType:'Seller',   rating:4.3, postedAt:'1j', verified:false },
];

// ── Seller stories ─────────────────────────────────────────────
const SELLER_STORIES = [
  { id:'s0', label:'My Story',    icon:'➕', mine:true  },
  { id:'s1', label:'ABC Hotel',   icon:'🏨'             },
  { id:'s2', label:'Konstriksyon',icon:'🏗'             },
  { id:'s3', label:'Restaurant',  icon:'🍽'             },
  { id:'s4', label:'Lopital',     icon:'🏥'             },
  { id:'s5', label:'Touris',      icon:'✈'              },
  { id:'s6', label:'Marketplace', icon:'🛒'             },
];

// ── Helpers ────────────────────────────────────────────────────
function fmt(price, currency) {
  const n = Number(price).toLocaleString();
  if (currency === 'USD') return `$${n}`;
  if (currency === 'EUR') return `€${n}`;
  return `${currency} ${n}`;
}

// ── Verified shield (gold, inline SVG) ────────────────────────
function Shield() {
  return (
    <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill={GOLD}>
      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
    </svg>
  );
}

// ── Star row ──────────────────────────────────────────────────
function Stars({ rating }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-0.5 mt-1">
      {[1,2,3,4,5].map(n => (
        <svg key={n} className={`w-2.5 h-2.5 ${n <= full ? 'fill-[#FACC15]' : 'fill-[#1F2937]'}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-[9px] text-slate-500 ml-1 font-medium">{Number(rating).toFixed(1)}</span>
    </div>
  );
}

// ── List-style card (LinkedIn / Amazon list view) ─────────────
function ListingCard({ item, favorites, onFavorite, onOpen, isLast }) {
  const isFav = favorites.has(item._id);
  return (
    <>
      <div
        role="button" tabIndex={0}
        onClick={() => onOpen(item)}
        onKeyDown={e => e.key === 'Enter' && onOpen(item)}
        className="flex items-center gap-4 px-4 py-4 cursor-pointer transition-colors hover:bg-white/[0.015] active:bg-white/[0.025]"
        style={{ WebkitTapHighlightColor:'transparent' }}
      >
        {/* Thumbnail */}
        <div className="w-[64px] h-[64px] rounded-[16px] flex items-center justify-center text-[30px] shrink-0 overflow-hidden border"
          style={{ background:'#1F2937', borderColor:'#1F2937' }}>
          {item.imageUrl
            ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
            : <span role="img" aria-label={item.title}>{item.image || '📦'}</span>}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-white leading-snug truncate">{item.title}</p>

          {/* Verified badge */}
          <div className="flex items-center gap-1 mt-0.5">
            {item.verified && <Shield />}
            <span className="text-[11px] text-slate-400 font-medium">
              Verified {item.sellerType || 'Seller'}
            </span>
          </div>

          <Stars rating={item.rating} />

          <p className="text-[13px] font-black mt-1.5 leading-none" style={{ color: GOLD }}>
            {fmt(item.price, item.currency)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <button type="button" aria-label={isFav ? 'Retire favori' : 'Ajoute favori'}
            onClick={e => { e.stopPropagation(); onFavorite(item._id); }}
            className="w-7 h-7 flex items-center justify-center text-[16px] leading-none">
            {isFav ? '❤️' : '🤍'}
          </button>
          <button type="button" aria-label={`View ${item.title}`}
            onClick={e => { e.stopPropagation(); onOpen(item); }}
            className="px-4 py-2 rounded-[12px] text-[12px] font-black transition-all duration-150 active:scale-95"
            style={{ background: GOLD, color: BG, boxShadow:'0 4px 12px rgba(250,204,21,0.18)' }}>
            View
          </button>
        </div>
      </div>
      {!isLast && <div className="h-px mx-4" style={{ background: BORDER }} />}
    </>
  );
}

// ── Detail sheet ───────────────────────────────────────────────
function DetailModal({ item, onClose, onContact }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto" style={{ background: BG }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: BORDER }}>
        <button type="button" onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-[14px] font-bold text-slate-300 transition-colors hover:text-white"
          style={{ background: CARD, border:`1px solid ${BORDER}` }}>
          ←
        </button>
        <h2 className="font-black text-white flex-1 truncate text-[15px]">{item.title}</h2>
      </div>

      {/* Image */}
      <div className="h-52 flex items-center justify-center text-8xl border-b"
        style={{ background: CARD, borderColor: BORDER }}>
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          : <span role="img">{item.image || '📦'}</span>}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4 pb-28">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-black" style={{ color: GOLD }}>{fmt(item.price, item.currency)}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">{item.category}</p>
          </div>
          <span className="text-xs text-slate-400 px-3 py-1.5 rounded-full font-medium"
            style={{ background: CARD, border:`1px solid ${BORDER}` }}>Négociable</span>
        </div>

        {/* Seller card */}
        <div className="flex items-center gap-3 p-4 rounded-[20px]" style={{ background: CARD, border:`1px solid ${BORDER}` }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm shrink-0"
            style={{ background:`linear-gradient(135deg,${GOLD},#f59e0b)`, color: BG }}>
            {(item.seller || 'U')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              {item.verified && <Shield />}
              <p className="text-sm font-black text-white truncate">{item.seller || 'Unknown'}</p>
            </div>
            <Stars rating={item.rating} />
            <p className="text-xs text-slate-500 mt-0.5">📍 {item.city}</p>
          </div>
          <span className="text-xs font-black text-green-400">● Online</span>
        </div>

        {/* Description */}
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Deskripsyon</p>
          <p className="text-sm text-slate-300 leading-relaxed">
            {item.description || `${item.title} — Pwodui kalite. Kontakte vandè a pou plis enfòmasyon.`}
          </p>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label:'Lokasyon',  value: item.city     || '—' },
            { label:'Kondisyon', value: item.condition || 'Nèf' },
            { label:'Dat poste', value: item.postedAt  || '—' },
            { label:'Vwayaj',    value: item.views     ?? '—' },
          ].map(m => (
            <div key={m.label} className="p-3 rounded-[16px]" style={{ background: CARD, border:`1px solid ${BORDER}` }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{m.label}</p>
              <p className="text-sm font-bold text-white mt-0.5">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 flex gap-3 border-t"
        style={{ background:`${BG}F8`, backdropFilter:'blur(16px)', borderColor: BORDER }}>
        <button type="button" onClick={() => onContact(item)}
          className="flex-1 py-4 rounded-[16px] font-black text-sm transition-all duration-150 active:scale-[0.98] shadow-xl"
          style={{ background: GOLD, color: BG, boxShadow:'0 8px 24px rgba(250,204,21,0.22)' }}>
          💬 Kontakte Vandè
        </button>
        <button type="button"
          className="w-12 h-12 rounded-[16px] flex items-center justify-center text-lg transition-colors hover:text-white"
          style={{ background: CARD, border:`1px solid ${BORDER}` }}>
          ↗️
        </button>
      </div>
    </div>
  );
}

// ── Create listing modal ───────────────────────────────────────
function CreateModal({ onClose, onSubmit }) {
  const [form, setForm]  = useState({ title:'', category:'products', price:'', currency:'USD', city:'', description:'' });
  const [busy, setBusy]  = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) return;
    setBusy(true);
    await onSubmit(form);
    setBusy(false);
  };

  const inputCls = `w-full px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none rounded-[16px] transition-all focus:border-[#FACC15]/40`;
  const style    = { background: CARD, border:`1px solid ${BORDER}` };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: BG }}>
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: BORDER }}>
        <button type="button" onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-[14px] text-slate-300 font-bold text-lg"
          style={style}>✕</button>
        <h2 className="font-black text-white flex-1 text-[15px]">Nouvo Lis</h2>
      </div>

      <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-4 pb-28">
        {/* Photo uploader */}
        <div className="h-36 rounded-[20px] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
          style={{ background:`${CARD}80`, border:`2px dashed ${BORDER}` }}>
          <span className="text-3xl">📷</span>
          <p className="text-sm text-slate-400">Ajoute foto (maks 5)</p>
        </div>

        {/* Title */}
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Tit</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Ex: iPhone 16 Pro 256GB" required className={inputCls} style={style} />
        </div>

        {/* Category */}
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Kategori</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls} style={style}>
            {CATEGORIES.filter(c => c.id !== 'all').map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
        </div>

        {/* Price + currency */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Pri</label>
            <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
              placeholder="0" min="0" required className={inputCls} style={style} />
          </div>
          <div className="w-24">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Deviz</label>
            <select value={form.currency} onChange={e => set('currency', e.target.value)} className={inputCls} style={style}>
              <option>USD</option><option>HTG</option><option>EUR</option>
            </select>
          </div>
        </div>

        {/* City */}
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Vil</label>
          <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
            placeholder="Punta Cana" className={inputCls} style={style} />
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Deskripsyon</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            rows={4} placeholder="Dekri pwodui ou a…" className={`${inputCls} resize-none`} style={style} />
        </div>
      </form>

      <div className="p-4 border-t" style={{ background: BG, borderColor: BORDER }}>
        <button type="button" onClick={submit} disabled={busy || !form.title || !form.price}
          className="w-full py-4 rounded-[16px] font-black text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-xl"
          style={{ background: GOLD, color: BG, boxShadow:'0 8px 24px rgba(250,204,21,0.22)' }}>
          {busy ? '⏳ …' : '📤 Pibliye Lis'}
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function MarketPage() {
  const navigate        = useNavigate();
  const { user }        = useAuth();

  const [activeCategory, setActiveCategory] = useState('all');
  const [query,          setQuery]          = useState('');
  const [listings,       setListings]       = useState(MOCK);
  const [loading,        setLoading]        = useState(false);
  const [favorites,      setFavorites]      = useState(new Set());
  const [detailItem,     setDetailItem]     = useState(null);
  const [showCreate,     setShowCreate]     = useState(false);

  // API fetch (keep mock on error)
  useEffect(() => {
    setLoading(true);
    marketplaceAPI.getListings({ category: activeCategory !== 'all' ? activeCategory : undefined })
      .then(res => {
        const data = res?.data?.data || res?.data;
        if (Array.isArray(data) && data.length) setListings(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const handleFavorite = useCallback((id) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    marketplaceAPI.toggleFavorite(id).catch(() => {});
  }, []);

  const handleContact = useCallback((item) => {
    navigate(`/chat?sellerId=${item.sellerId || item._id}`);
  }, [navigate]);

  const handleCreate = useCallback(async (data) => {
    try {
      const res     = await marketplaceAPI.createListing({ ...data, sellerId: user?._id });
      const created = res?.data?.data || res?.data;
      setListings(p => [created || { _id: Date.now(), ...data, seller: user?.name, postedAt: 'jis kounye a', image: '📦', verified: false }, ...p]);
    } catch {
      setListings(p => [{ _id: Date.now(), ...data, seller: user?.name, postedAt: 'jis kounye a', image: '📦', verified: false }, ...p]);
    }
    setShowCreate(false);
  }, [user]);

  const displayed = listings.filter(item => {
    const catOk = activeCategory === 'all' || item.category === activeCategory;
    const q     = query.trim().toLowerCase();
    return catOk && (!q || item.title?.toLowerCase().includes(q) || item.seller?.toLowerCase().includes(q));
  });

  return (
    <div className="flex flex-col min-h-screen pb-24 text-white" style={{ background: BG }}>

      {/* ── STICKY TOP ────────────────────────────────────────── */}
      <div className="sticky top-14 z-30 border-b" style={{ background:`${BG}FC`, backdropFilter:'blur(20px)', borderColor: BORDER }}>

        {/* Title + Sell */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h1 className="text-xl font-black text-white tracking-tight">Marketplace</h1>
          <button type="button" onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-black rounded-[14px] transition-all duration-150 active:scale-95 shadow-lg"
            style={{ background: GOLD, color: BG, boxShadow:'0 4px 16px rgba(250,204,21,0.22)' }}>
            + Vann
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-[16px] transition-all"
            style={{ background: CARD, border:`1px solid ${BORDER}` }}>
            <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35"/>
            </svg>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none" />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3" style={{ scrollbarWidth:'none' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} type="button" onClick={() => setActiveCategory(cat.id)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-[14px] text-[12px] font-bold border transition-all duration-150 active:scale-95"
              style={activeCategory === cat.id
                ? { background: GOLD, color: BG, borderColor: GOLD, boxShadow:'0 4px 14px rgba(250,204,21,0.18)' }
                : { background: CARD, color:'#94a3b8', borderColor: BORDER }}>
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SELLER STORIES ────────────────────────────────────── */}
      <div className="flex gap-3.5 overflow-x-auto px-4 pt-4 pb-2" style={{ scrollbarWidth:'none' }}>
        {SELLER_STORIES.map(s => (
          <button key={s.id} type="button"
            className="flex flex-col items-center gap-1.5 shrink-0 transition-all active:scale-95">
            <div className="w-[56px] h-[56px] rounded-full flex items-center justify-center text-[22px] border-2 transition-all"
              style={s.mine
                ? { background: CARD, borderColor:`${GOLD}50`, borderStyle:'dashed' }
                : { background:`linear-gradient(135deg,${CARD},#1a2340)`, borderColor:`${GOLD}80` }}>
              {s.mine
                ? <span className="text-xl font-black" style={{ color: GOLD }}>+</span>
                : <span>{s.icon}</span>}
            </div>
            <span className="text-[9px] text-slate-400 font-medium text-center w-14 truncate">{s.label}</span>
          </button>
        ))}
      </div>

      {/* ── FEATURED PRODUCTS ─────────────────────────────────── */}
      <div className="flex-1 px-4 pb-4">

        {/* Section header */}
        <div className="flex items-center justify-between mb-3 mt-2">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Featured Products</p>
          <button type="button" className="flex items-center gap-1 text-[11px] font-bold hover:opacity-80 transition-opacity"
            style={{ color: GOLD }}>
            Wè tout
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>

        {/* Cards container */}
        <div className="rounded-[20px] overflow-hidden shadow-2xl shadow-black/40"
          style={{ background: CARD, border:`1px solid ${BORDER}` }}>

          {loading
            ? [1,2,3].map((n,i,a) => (
                <div key={n}>
                  <div className="flex items-center gap-4 px-4 py-4 animate-pulse">
                    <div className="w-16 h-16 rounded-[16px] shrink-0" style={{ background: BORDER }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 rounded-full w-3/4"    style={{ background: BORDER }} />
                      <div className="h-2 rounded-full w-1/2"    style={{ background: BORDER }} />
                      <div className="h-2 rounded-full w-[30%]" style={{ background: BORDER }} />
                    </div>
                    <div className="w-14 h-8 rounded-[12px]" style={{ background: BORDER }} />
                  </div>
                  {i < a.length - 1 && <div className="h-px mx-4" style={{ background: BORDER }} />}
                </div>
              ))

            : displayed.length === 0
              ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="text-5xl">📭</span>
                  <p className="text-slate-500 text-sm">Pa gen lis kounye a</p>
                  <button type="button" onClick={() => setShowCreate(true)}
                    className="mt-2 px-5 py-2.5 rounded-[14px] font-black text-sm shadow-lg"
                    style={{ background: GOLD, color: BG, boxShadow:'0 4px 16px rgba(250,204,21,0.22)' }}>
                    + Kreye premye lis ou
                  </button>
                </div>
              )
              : displayed.map((item, idx) => (
                  <ListingCard
                    key={item._id}
                    item={item}
                    favorites={favorites}
                    onFavorite={handleFavorite}
                    onOpen={setDetailItem}
                    isLast={idx === displayed.length - 1}
                  />
                ))
          }
        </div>
      </div>

      {/* ── MODALS ────────────────────────────────────────────── */}
      {detailItem && (
        <DetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onContact={handleContact}
        />
      )}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
