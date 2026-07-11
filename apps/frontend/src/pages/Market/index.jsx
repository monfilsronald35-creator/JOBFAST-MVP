import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { marketplaceAPI } from '../../services/marketplace';

// ── Category definitions ──────────────────────────────────────
const CATEGORIES = [
  { id: 'all',        icon: '🌐', key: 'all'         },
  { id: 'products',   icon: '📦', key: 'products'    },
  { id: 'services',   icon: '🛎',  key: 'services'   },
  { id: 'equipment',  icon: '⚙️',  key: 'equipment'  },
  { id: 'vehicles',   icon: '🚗', key: 'vehicles'    },
  { id: 'materials',  icon: '🧱', key: 'materials'   },
  { id: 'medical',    icon: '🏥', key: 'medical'     },
  { id: 'electronics',icon: '📱', key: 'electronics' },
  { id: 'furniture',  icon: '🪑', key: 'furniture'   },
  { id: 'clothes',    icon: '👗', key: 'clothes'     },
  { id: 'real_estate',icon: '🏠', key: 'real_estate' },
];

// ── Placeholder listing cards (shown while API loads / offline) ─
const MOCK = [
  { _id:'m1', title:'Groupe électrogène 5KW',  category:'equipment',   price:45000,  currency:'HTG', city:'Port-au-Prince', image:'⚙️',  seller:'Jean P.',  postedAt:'2h' },
  { _id:'m2', title:'iPhone 14 Pro 256GB',      category:'electronics', price:85000,  currency:'HTG', city:'Pétionville',    image:'📱',  seller:'Marie C.', postedAt:'5h' },
  { _id:'m3', title:'Appartement 3 chambres',   category:'real_estate', price:150000, currency:'HTG', city:'Delmas',         image:'🏠',  seller:'Pierre M.',postedAt:'1j' },
  { _id:'m4', title:'Toyota Hilux 2019',         category:'vehicles',    price:850000, currency:'HTG', city:'Cap-Haïtien',    image:'🚗',  seller:'Alex D.',  postedAt:'3j' },
  { _id:'m5', title:'Ciment Portland 50 sacs',   category:'materials',   price:12000,  currency:'HTG', city:'Gonaïves',       image:'🧱',  seller:'MATCO SA', postedAt:'4h' },
  { _id:'m6', title:'Laptop HP 15" Core i7',     category:'electronics', price:55000,  currency:'HTG', city:'Port-au-Prince', image:'💻',  seller:'Tech HT',  postedAt:'2j' },
  { _id:'m7', title:'Plomberie résidentielle',   category:'services',    price:5000,   currency:'HTG', city:'Pétionville',    image:'🔧',  seller:'Jean Fils',postedAt:'6h' },
  { _id:'m8', title:'Lit king-size avec matelas',category:'furniture',   price:35000,  currency:'HTG', city:'Jacmel',         image:'🛏',  seller:'Meubles HT',postedAt:'1j'},
];

// ── Condition badge ───────────────────────────────────────────
function formatPrice(price, currency = 'HTG') {
  return `${currency} ${price.toLocaleString()}`;
}

function ListingCard({ item, onFavorite, favorites, onOpen }) {
  const isFav = favorites.has(item._id);
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group relative flex flex-col bg-[#0d1526] rounded-2xl border border-slate-800 hover:border-slate-600 overflow-hidden transition text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
    >
      {/* Image area */}
      <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-5xl relative">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <span role="img">{item.image || '📦'}</span>
        )}
        {/* Favorite */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFavorite(item._id); }}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition hover:scale-110"
        >
          <span className="text-base leading-none">{isFav ? '❤️' : '🤍'}</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{item.category}</p>
        <p className="text-sm font-bold text-white line-clamp-2 leading-snug">{item.title}</p>
        <p className="text-amber-400 font-black text-sm mt-auto">{formatPrice(item.price, item.currency)}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-slate-500 truncate">📍 {item.city}</span>
          <span className="text-xs text-slate-600">{item.postedAt}</span>
        </div>
      </div>
    </button>
  );
}

// ── Detail modal ──────────────────────────────────────────────
function ListingDetailModal({ item, onClose, onContact }) {
  const { t } = useTranslation();
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#020617]/95 backdrop-blur-sm overflow-y-auto">
      {/* header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
        <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700">
          ←
        </button>
        <h2 className="font-bold text-white flex-1 truncate">{item.title}</h2>
      </div>

      {/* image */}
      <div className="h-56 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-8xl">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <span role="img">{item.image || '📦'}</span>
        )}
      </div>

      {/* body */}
      <div className="p-5 space-y-4 pb-28">
        {/* price + category */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-black text-amber-400">{formatPrice(item.price, item.currency)}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">{item.category}</p>
          </div>
          <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full">{t('market.negotiable', { defaultValue: 'Négociable' })}</span>
        </div>

        {/* seller */}
        <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-2xl border border-slate-700">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-black text-sm shrink-0">
            {(item.seller || 'U')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{item.seller || 'Unknown'}</p>
            <p className="text-xs text-slate-500">📍 {item.city}</p>
          </div>
          <span className="text-xs text-green-400 font-bold">● Online</span>
        </div>

        {/* description */}
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{t('market.description', { defaultValue: 'Deskripsyon' })}</p>
          <p className="text-sm text-slate-300 leading-relaxed">
            {item.description || `${item.title} — Pwodui kalite. Kontakte vandè a pou plis enfòmasyon.`}
          </p>
        </div>

        {/* details grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: t('market.location', { defaultValue: 'Lokasyon' }),  value: item.city || '—'    },
            { label: t('market.condition', { defaultValue: 'Kondisyon' }), value: item.condition || t('market.new', { defaultValue: 'Nèf' }) },
            { label: t('market.posted', { defaultValue: 'Poste' }),       value: item.postedAt || '—' },
            { label: t('market.views', { defaultValue: 'Vwayaj' }),       value: item.views ?? '—'   },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-sm font-bold text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* action bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#020617]/95 backdrop-blur-sm border-t border-slate-800 flex gap-3">
        <button
          type="button"
          onClick={() => onContact(item)}
          className="flex-1 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-sm transition"
        >
          💬 {t('market.contact', { defaultValue: 'Kontakte Vandè' })}
        </button>
        <button
          type="button"
          className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg"
        >
          ↗️
        </button>
      </div>
    </div>
  );
}

// ── Create listing modal ──────────────────────────────────────
function CreateListingModal({ onClose, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ title:'', category:'products', price:'', currency:'HTG', city:'', description:'' });
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) return;
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#020617]">
      {/* header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
        <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300">
          ✕
        </button>
        <h2 className="font-bold text-white flex-1">{t('market.createListing', { defaultValue: 'Nouvo Lis' })}</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 pb-28">
        {/* photo placeholder */}
        <div className="h-36 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 bg-slate-800/30 cursor-pointer hover:border-amber-500/50 transition">
          <span className="text-3xl">📷</span>
          <p className="text-sm text-slate-400">{t('market.addPhotos', { defaultValue: 'Ajoute foto (maks 5)' })}</p>
        </div>

        {/* title */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide">{t('market.title', { defaultValue: 'Tit' })}</label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Ex: iPhone 14 Pro 256GB"
            className="mt-1 w-full px-4 py-3 bg-[#0d1526] border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            required
          />
        </div>

        {/* category */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide">{t('market.category', { defaultValue: 'Kategori' })}</label>
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className="mt-1 w-full px-4 py-3 bg-[#0d1526] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50"
          >
            {CATEGORIES.filter(c => c.id !== 'all').map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.key}</option>
            ))}
          </select>
        </div>

        {/* price + currency */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-slate-400 uppercase tracking-wide">{t('market.price', { defaultValue: 'Pri' })}</label>
            <input
              type="number"
              value={form.price}
              onChange={e => set('price', e.target.value)}
              placeholder="0"
              className="mt-1 w-full px-4 py-3 bg-[#0d1526] border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              required min="0"
            />
          </div>
          <div className="w-28">
            <label className="text-xs text-slate-400 uppercase tracking-wide">{t('market.currency', { defaultValue: 'Deviz' })}</label>
            <select
              value={form.currency}
              onChange={e => set('currency', e.target.value)}
              className="mt-1 w-full px-4 py-3 bg-[#0d1526] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50"
            >
              <option>HTG</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </div>
        </div>

        {/* city */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide">{t('market.city', { defaultValue: 'Vil' })}</label>
          <input
            type="text"
            value={form.city}
            onChange={e => set('city', e.target.value)}
            placeholder="Port-au-Prince"
            className="mt-1 w-full px-4 py-3 bg-[#0d1526] border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* description */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide">{t('market.description', { defaultValue: 'Deskripsyon' })}</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={4}
            placeholder={t('market.descriptionPlaceholder', { defaultValue: 'Dekri pwodui ou a…' })}
            className="mt-1 w-full px-4 py-3 bg-[#0d1526] border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
          />
        </div>
      </form>

      {/* submit bar */}
      <div className="p-4 border-t border-slate-800 bg-[#020617]">
        <button
          type="submit"
          form="create-form"
          disabled={submitting || !form.title || !form.price}
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-black text-sm transition"
        >
          {submitting ? '⏳ …' : `📤 ${t('market.publishListing', { defaultValue: 'Pibliye Lis' })}`}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
export default function MarketPage() {
  const { t }       = useTranslation();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const [activeCategory, setActiveCategory] = useState('all');
  const [tab,            setTab]            = useState('browse');  // 'browse' | 'mine'
  const [query,          setQuery]          = useState('');
  const [listings,       setListings]       = useState(MOCK);
  const [loading,        setLoading]        = useState(false);
  const [favorites,      setFavorites]      = useState(new Set());
  const [detailItem,     setDetailItem]     = useState(null);
  const [showCreate,     setShowCreate]     = useState(false);

  const catRef = useRef(null);

  // Fetch listings from API
  useEffect(() => {
    const params = { category: activeCategory !== 'all' ? activeCategory : undefined, tab };
    setLoading(true);
    marketplaceAPI.getListings(params)
      .then(res => {
        const data = res?.data?.data || res?.data;
        if (Array.isArray(data) && data.length) setListings(data);
      })
      .catch(() => {/* keep mock data */})
      .finally(() => setLoading(false));
  }, [activeCategory, tab]);

  const handleFavorite = useCallback((id) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    marketplaceAPI.toggleFavorite(id).catch(() => {});
  }, []);

  const handleContact = useCallback((item) => {
    navigate(`/chat?sellerId=${item.sellerId || item._id}`);
  }, [navigate]);

  const handleCreate = useCallback(async (data) => {
    try {
      const res = await marketplaceAPI.createListing({ ...data, sellerId: user?._id });
      const created = res?.data?.data || res?.data;
      if (created) setListings(prev => [created, ...prev]);
      else setListings(prev => [{ _id: Date.now(), ...data, seller: user?.name, postedAt: 'jis kounye a', image: '📦' }, ...prev]);
    } catch {
      setListings(prev => [{ _id: Date.now(), ...data, seller: user?.name, postedAt: 'jis kounye a', image: '📦' }, ...prev]);
    }
    setShowCreate(false);
  }, [user]);

  // Filter display
  const displayed = listings.filter(item => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory;
    const q = query.trim().toLowerCase();
    const matchQ  = !q || item.title?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
    const matchTab = tab === 'browse' || item.sellerId === user?._id;
    return matchCat && matchQ && matchTab;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white pb-24">

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="sticky top-14 z-30 bg-[#020617]/97 backdrop-blur-xl border-b border-slate-800/60 px-4 pt-3 pb-2 space-y-2">

        {/* Title + create */}
        <div className="flex items-center justify-between">
          <h1 className="text-base font-black">🛒 {t('market.title', { defaultValue: 'Marketplace' })}</h1>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs rounded-xl transition"
          >
            + {t('market.sell', { defaultValue: 'Vann' })}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('market.search', { defaultValue: 'Chèche nan marketplace…' })}
            className="w-full pl-8 pr-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Category pills */}
        <div ref={catRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                activeCategory === cat.id
                  ? 'bg-amber-500 border-amber-400 text-slate-900'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-500'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{t(`market.cat.${cat.key}`, { defaultValue: cat.key })}</span>
            </button>
          ))}
        </div>

        {/* Browse / My listings tab */}
        <div className="flex rounded-xl bg-slate-800/60 p-0.5">
          {[
            { id: 'browse', label: t('market.browse',     { defaultValue: 'Navige'      }) },
            { id: 'mine',   label: t('market.myListings', { defaultValue: 'Lis Mwen Yo' }) },
          ].map(tb => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                tab === tb.id ? 'bg-[#0d1526] text-white shadow' : 'text-slate-400'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Listing grid ─────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-4">
        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 bg-slate-800/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-5xl">📭</span>
            <p className="text-slate-400 text-sm">{t('market.empty', { defaultValue: 'Pa gen lis kounye a' })}</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-2 px-5 py-2.5 bg-amber-500 text-slate-900 font-bold text-sm rounded-xl"
            >
              + {t('market.createFirst', { defaultValue: 'Kreye premye lis ou' })}
            </button>
          </div>
        )}

        {!loading && displayed.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {displayed.map(item => (
              <ListingCard
                key={item._id}
                item={item}
                favorites={favorites}
                onFavorite={handleFavorite}
                onOpen={setDetailItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────── */}
      {detailItem && (
        <ListingDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onContact={handleContact}
        />
      )}

      {showCreate && (
        <CreateListingModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
