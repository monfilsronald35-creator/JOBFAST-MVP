/**
 * MarketplaceCore.jsx
 *
 * Shared marketplace engine for JOBFAST.
 * All role-specific behavior is driven by marketplaceConfig.js —
 * no role conditions live in this file.
 *
 * Exports:
 *   AvailabilityBadge      — shows availability state chip
 *   ReputationBar          — trust/reputation score bar
 *   MarketplaceListingCard — role-adapted result card
 *   BookingModal           — role-adapted booking form
 *   ReviewModal            — role-adapted review form
 *   ContactPanel           — contact options panel
 *   useMarketplaceListings — data-fetching hook (backend aware)
 *   default MarketplaceCore — full browse experience for a role
 *
 * Usage:
 *   import MarketplaceCore, { BookingModal } from '../../components/marketplace/MarketplaceCore';
 *   <MarketplaceCore role="restaurant" />
 */

import React, {
  useState, useCallback, useEffect, useRef, useMemo, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import {
  getMarketplaceConfig,
  AVAILABILITY_STATES,
  BOOKING_STATUSES,
  computeMarketplaceReputation,
} from '../../config/marketplaceConfig';

// ─────────────────────────────────────────────────────────────
// AVAILABILITY BADGE — shared, adapts from AVAILABILITY_STATES
// ─────────────────────────────────────────────────────────────
export const AvailabilityBadge = memo(function AvailabilityBadge({ state }) {
  const cfg = AVAILABILITY_STATES[state] || AVAILABILITY_STATES.available;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}>
      {cfg.dot} {cfg.label}
    </span>
  );
});

// ─────────────────────────────────────────────────────────────
// REPUTATION BAR — shared, computed from computeMarketplaceReputation
// ─────────────────────────────────────────────────────────────
export const ReputationBar = memo(function ReputationBar({ score }) {
  const color =
    score >= 80 ? '#10b981' :
    score >= 50 ? '#6366f1' :
                  '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-bold text-slate-400 shrink-0">{score}</span>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// GALLERY VIEWER — shared image gallery, type label only
// ─────────────────────────────────────────────────────────────
const GalleryViewer = memo(function GalleryViewer({ images = [], type }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="h-32 bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-500 text-sm">
        Pa gen foto
      </div>
    );
  }

  return (
    <div>
      <div className="h-40 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center">
        <img
          src={images[active]}
          alt={type}
          className="w-full h-full object-cover"
          onError={e => { e.target.style.display='none'; }}
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-1.5 mt-2">
          {images.slice(0, 5).map((src, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                i === active ? 'border-indigo-500' : 'border-transparent'
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover"
                onError={e => { e.target.style.display='none'; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// CONTACT PANEL — shared, adapts from config.contactOptions
// ─────────────────────────────────────────────────────────────
export const ContactPanel = memo(function ContactPanel({ listing, config, onClose, onBook }) {
  const navigate = useNavigate();
  const phone = listing.phone || listing.profileMetadata?.phone;

  const actions = {
    call:       () => phone && (window.location.href = `tel:${phone}`),
    chat:       () => navigate(`/chat/${listing.id || listing._id}`),
    directions: () => {
      const lat = listing.location?.coordinates?.latitude;
      const lng = listing.location?.coordinates?.longitude;
      if (lat && lng) navigate(`/map?lat=${lat}&lng=${lng}`);
    },
    book:       () => { onClose?.(); onBook?.(listing); },
    emergency:  () => phone && (window.location.href = `tel:${phone}`),
  };

  const OPTION_LABELS = {
    call:       { icon: '📞', label: 'Rele',      color: 'bg-green-500 text-black'   },
    chat:       { icon: '💬', label: 'Chat',      color: 'bg-blue-500 text-white'    },
    book:       { icon: '📅', label: config.booking.label, color: 'bg-indigo-500 text-white' },
    directions: { icon: '🗺️', label: 'Direksyon', color: 'bg-slate-700 text-white'   },
    emergency:  { icon: '🚨', label: 'Dijans',    color: 'bg-red-600 text-white'     },
  };

  return (
    <div className="space-y-2">
      {(config.contactOptions || []).map(opt => {
        const o = OPTION_LABELS[opt];
        if (!o) return null;
        return (
          <button key={opt} onClick={actions[opt]}
            className={`w-full py-2.5 rounded-xl text-sm font-bold ${o.color}`}>
            {o.icon} {o.label}
          </button>
        );
      })}
      <button onClick={onClose}
        className="w-full py-2 rounded-xl text-xs text-slate-400 bg-slate-800/50">
        Fèmen
      </button>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// BOOKING MODAL — shared form, adapts from config.booking
// ─────────────────────────────────────────────────────────────
export const BookingModal = memo(function BookingModal({ listing, config, onClose, onSubmit }) {
  const { user } = useAuth();
  const bc = config.booking;

  const [form, setForm] = useState({
    date:      '',
    time:      '',
    partySize: 1,
    duration:  1,
    notes:     '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = useCallback(async () => {
    if (!form.date && bc.requiresDate) return;
    setSubmitting(true);
    try {
      await API.post('/marketplace/book', {
        customerId:   user?._id || user?.id,
        customerName: user?.name,
        targetId:     listing._id || listing.id,
        targetName:   listing.name,
        bookingType:  bc.type,
        ...form,
      });
      setSuccess(true);
      onSubmit?.();
    } catch {
      // keep modal open on error
    } finally {
      setSubmitting(false);
    }
  }, [form, listing, user, bc, onSubmit]);

  if (success) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-3xl">✅</p>
        <p className="text-white font-bold">Demann Anvwaye!</p>
        <p className="text-xs text-slate-400">Ou pral resevwa yon konfirmasyon tou dousman.</p>
        <button onClick={onClose}
          className="w-full py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold">
          Fèmen
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <h3 className="text-sm font-bold text-white">
        📅 {bc.label} — {listing.name}
      </h3>

      {bc.requiresDate && (
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Dat</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500/40" />
        </div>
      )}

      {bc.requiresTime && (
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Lè</label>
          <input type="time" value={form.time} onChange={e => set('time', e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500/40" />
        </div>
      )}

      {bc.requiresPartySize && (
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">
            {bc.partySizeLabel || 'Kantite Moun'}
          </label>
          <div className="flex items-center gap-3">
            <button onClick={() => set('partySize', Math.max(1, form.partySize - 1))}
              className="w-8 h-8 bg-slate-800 rounded-lg text-white font-bold">−</button>
            <span className="text-white font-bold text-sm w-6 text-center">{form.partySize}</span>
            <button onClick={() => set('partySize', Math.min(50, form.partySize + 1))}
              className="w-8 h-8 bg-slate-800 rounded-lg text-white font-bold">+</button>
          </div>
        </div>
      )}

      {bc.requiresDuration && (
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">
            {bc.durationLabel || 'Dire'}
          </label>
          <div className="flex items-center gap-3">
            <button onClick={() => set('duration', Math.max(1, form.duration - 1))}
              className="w-8 h-8 bg-slate-800 rounded-lg text-white font-bold">−</button>
            <span className="text-white font-bold text-sm w-6 text-center">{form.duration}</span>
            <button onClick={() => set('duration', form.duration + 1)}
              className="w-8 h-8 bg-slate-800 rounded-lg text-white font-bold">+</button>
          </div>
        </div>
      )}

      {bc.requiresNotes && (
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">
            {bc.notesLabel || 'Nòt'}
          </label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            rows={2} placeholder="Ekri nòt ou..."
            className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none resize-none" />
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button onClick={handleSubmit}
          disabled={submitting || (bc.requiresDate && !form.date)}
          className="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold disabled:opacity-40">
          {submitting ? 'Ap anvwaye...' : bc.label}
        </button>
        <button onClick={onClose}
          className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm">
          Anile
        </button>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// REVIEW MODAL — shared form, adapts from config.reviewCriteria
// ─────────────────────────────────────────────────────────────
export const ReviewModal = memo(function ReviewModal({ listing, config, onClose, onSubmit }) {
  const { user } = useAuth();
  const [overallRating, setOverallRating] = useState(0);
  const [criteria, setCriteria] = useState(
    Object.fromEntries((config.reviewCriteria || []).map(c => [c, 0])),
  );
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const setCriterion = (key, val) => setCriteria(prev => ({ ...prev, [key]: val }));

  const StarPicker = ({ value, onChange }) => (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} onClick={() => onChange(s)}
          className={`text-lg transition ${s <= value ? 'text-amber-400' : 'text-slate-600'}`}>
          ★
        </button>
      ))}
    </div>
  );

  const handleSubmit = useCallback(async () => {
    if (overallRating === 0) return;
    setSubmitting(true);
    try {
      await API.post('/marketplace/reviews', {
        targetId:     listing._id || listing.id,
        reviewerId:   user?._id || user?.id,
        reviewerName: user?.name,
        rating:       overallRating,
        criteria,
        comment,
      });
      setSuccess(true);
      onSubmit?.();
    } catch {
      // keep open
    } finally {
      setSubmitting(false);
    }
  }, [overallRating, criteria, comment, listing, user, onSubmit]);

  if (success) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-3xl">⭐</p>
        <p className="text-white font-bold">Mèsi pou Evalyasyon Ou!</p>
        <button onClick={onClose}
          className="w-full py-2.5 bg-amber-500 text-black rounded-xl text-sm font-bold">
          Fèmen
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <h3 className="text-sm font-bold text-white">⭐ Evalye — {listing.name}</h3>

      <div>
        <label className="text-[10px] text-slate-400 block mb-2">Rating Global</label>
        <StarPicker value={overallRating} onChange={setOverallRating} />
      </div>

      {(config.reviewCriteria || []).length > 0 && (
        <div className="space-y-2.5">
          <label className="text-[10px] text-slate-400 block">Detay</label>
          {config.reviewCriteria.map(criterion => (
            <div key={criterion} className="flex items-center justify-between">
              <span className="text-xs text-slate-300 capitalize">{criterion}</span>
              <StarPicker value={criteria[criterion] || 0} onChange={v => setCriterion(criterion, v)} />
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="text-[10px] text-slate-400 block mb-1">Kòmantè</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          rows={3} placeholder="Pata eksperyans ou..."
          className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none resize-none" />
      </div>

      <div className="flex gap-2">
        <button onClick={handleSubmit}
          disabled={submitting || overallRating === 0}
          className="flex-1 py-2.5 bg-amber-500 text-black rounded-xl text-sm font-bold disabled:opacity-40">
          {submitting ? 'Ap anvwaye...' : 'Soumèt Evalyasyon'}
        </button>
        <button onClick={onClose}
          className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm">
          Anile
        </button>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// MARKETPLACE LISTING CARD — shared, adapts from config.cardFields
// ─────────────────────────────────────────────────────────────

// Field renderers: each returns a displayable string or null
const CARD_FIELD_RENDERERS = {
  cuisine:         (item) => item.profileMetadata?.cuisine ? `🍽️ ${item.profileMetadata.cuisine}` : null,
  room_type:       (item) => item.profileMetadata?.roomType ? `🛏️ ${item.profileMetadata.roomType}` : null,
  property_type:   (item) => item.profileMetadata?.propertyType ? `🏠 ${item.profileMetadata.propertyType}` : null,
  workspace_type:  (item) => item.profileMetadata?.workspaceType ? `💼 ${item.profileMetadata.workspaceType}` : null,
  tour_type:       (item) => item.profileMetadata?.tourType ? `🗺️ ${item.profileMetadata.tourType}` : null,
  specialty:       (item) => item.profession ? `⚕️ ${item.profession}` : null,
  service_type:    (item) => item.profession ? `🔧 ${item.profession}` : null,
  amenities:       (item) => (item.profileMetadata?.amenities || []).slice(0, 2).join(' • ') || null,
  rating:          (item) => {
    const r = item.stats?.rating ?? item.rating;
    return r != null ? `⭐ ${Number(r).toFixed(1)}` : null;
  },
  trust_score:     (item) => item.trust_score != null ? `🛡️ ${item.trust_score}` : null,
  distance:        (item) => item.distanceKm != null ? `📍 ${Number(item.distanceKm).toFixed(1)} km` : null,
  experience:      (item) => item.experience ? `🎓 ${item.experience} ans` : null,
  language:        (item) => item.language ? `🌐 ${item.language}` : null,
  verified:        (item) => item.verified ? '✅ Verifye' : null,
  availability:    (item) => null,  // rendered separately as AvailabilityBadge
};

export const MarketplaceListingCard = memo(function MarketplaceListingCard({
  item, config, onBook, onContact, onReview, onFavorite, isFavorited,
}) {
  const city = item.location?.city || item.location?.state || '';

  const fields = (config.cardFields || [])
    .filter(f => f !== 'availability')
    .map(f => ({ key: f, text: CARD_FIELD_RENDERERS[f]?.(item) }))
    .filter(f => f.text);

  const reputationScore = useMemo(
    () => computeMarketplaceReputation(item, item.marketplaceData),
    [item],
  );

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 transition">

      {/* Header */}
      <div className="relative p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-lg">{config.icon}</span>
              <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
            </div>
            {city && <p className="text-[10px] text-slate-400">📍 {city}</p>}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <AvailabilityBadge state={item.availability || 'available'} />
            <button onClick={() => onFavorite?.(item)}
              className={`text-lg transition ${isFavorited ? 'text-rose-400' : 'text-slate-600 hover:text-rose-300'}`}>
              {isFavorited ? '❤️' : '🤍'}
            </button>
          </div>
        </div>

        {/* Reputation */}
        <div className="mt-2">
          <ReputationBar score={reputationScore} />
        </div>
      </div>

      {/* Fields */}
      {fields.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-x-3 gap-y-1">
          {fields.map(f => (
            <span key={f.key} className="text-[10px] text-slate-300">{f.text}</span>
          ))}
        </div>
      )}

      {/* Bio snippet */}
      {item.profileMetadata?.bio && (
        <p className="px-4 pb-2 text-[10px] text-slate-400 line-clamp-2">
          {item.profileMetadata.bio}
        </p>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 grid grid-cols-3 gap-2">
        <button onClick={() => onBook?.(item)}
          className="py-2 rounded-xl bg-indigo-500 text-white text-[10px] font-bold">
          {config.booking.label}
        </button>
        <button onClick={() => onContact?.(item)}
          className="py-2 rounded-xl bg-slate-800 text-slate-200 text-[10px]">
          📞 Kontakte
        </button>
        <button onClick={() => onReview?.(item)}
          className="py-2 rounded-xl bg-slate-800 text-amber-400 text-[10px]">
          ⭐ Evalye
        </button>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// LISTING DETAIL PANEL — modal overlay with booking/review/contact
// ─────────────────────────────────────────────────────────────
function ListingDetailPanel({ listing, config, onClose, favorites, onToggleFavorite }) {
  const [panel, setPanel] = useState('detail'); // 'detail' | 'book' | 'review' | 'contact'
  const isFav = favorites?.has(listing._id || listing.id);

  const panels = {
    detail: (
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white">{listing.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {listing.location?.city || ''} • {config.label}
            </p>
          </div>
          <button onClick={() => onToggleFavorite?.(listing)}
            className={`text-2xl ${isFav ? 'text-rose-400' : 'text-slate-600'}`}>
            {isFav ? '❤️' : '🤍'}
          </button>
        </div>

        <AvailabilityBadge state={listing.availability || 'available'} />

        <GalleryViewer
          images={listing.profileMetadata?.photos || []}
          type={config.galleryType}
        />

        {listing.profileMetadata?.bio && (
          <p className="text-xs text-slate-300">{listing.profileMetadata.bio}</p>
        )}

        <div>
          <p className="text-[10px] font-bold text-slate-500 mb-1.5">Reputasyon</p>
          <ReputationBar score={computeMarketplaceReputation(listing, listing.marketplaceData)} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setPanel('book')}
            className="py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-bold">
            📅 {config.booking.label}
          </button>
          <button onClick={() => setPanel('contact')}
            className="py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs">
            📞 Kontakte
          </button>
          <button onClick={() => setPanel('review')}
            className="py-2.5 rounded-xl bg-slate-800 text-amber-400 text-xs">
            ⭐ Evalye
          </button>
        </div>
      </div>
    ),

    book:    <BookingModal    listing={listing} config={config} onClose={() => setPanel('detail')} onSubmit={() => setPanel('detail')} />,
    review:  <ReviewModal     listing={listing} config={config} onClose={() => setPanel('detail')} onSubmit={() => setPanel('detail')} />,
    contact: <ContactPanel    listing={listing} config={config} onClose={() => setPanel('detail')} onBook={() => setPanel('book')} />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-[#0f172a] rounded-t-2xl border border-slate-800 max-h-[85vh] overflow-y-auto">
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mt-3 mb-1" />
        {panels[panel]}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GPS HOOK — same 3-level fallback used by SearchScreen
// (duplicated here to avoid cross-import; stays in sync with SearchScreen)
// ─────────────────────────────────────────────────────────────
function useGPS() {
  const [coords, setCoords]   = useState(null);
  const [gpsState, setGPS]    = useState('acquiring');

  useEffect(() => {
    if (!navigator.geolocation) { setGPS('unavailable'); return; }
    let settled = false;
    const timer = setTimeout(() => { if (!settled) { settled = true; setGPS('unavailable'); } }, 15000);
    const ok = (pos) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setGPS('ready');
    };
    const tryLow = () => {
      if (settled) return;
      navigator.geolocation.getCurrentPosition(ok, () => {
        if (!settled) { settled = true; clearTimeout(timer); setGPS('denied'); }
      }, { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 });
    };
    navigator.geolocation.getCurrentPosition(ok, tryLow, { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 });
    return () => clearTimeout(timer);
  }, []);

  return { coords, gpsState };
}

// ─────────────────────────────────────────────────────────────
// DATA HOOK — fetches listings from backend marketplace endpoint
// ─────────────────────────────────────────────────────────────
export function useMarketplaceListings({ role, query = '', tab = 'all', coords, enabled = true }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [hasMore, setHasMore]   = useState(false);
  const abortRef  = useRef(null);
  const pageRef   = useRef(1);

  const fetch = useCallback(async (page = 1, append = false) => {
    if (!enabled) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    try {
      const params = { role, q: query, tab, page, limit: 20 };
      if (coords) { params.lat = coords.lat; params.lng = coords.lng; }

      const res = await API.get('/marketplace/listings', { params, signal: ctrl.signal });
      const { items = [], hasMore: more = false } = res.data?.data || {};

      setListings(prev => (append ? [...prev, ...items] : items));
      setHasMore(!!more);
      pageRef.current = page;
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
      setError('Erè rezo. Eseye ankò.');
    } finally {
      setLoading(false);
    }
  }, [role, query, tab, coords, enabled]);

  const loadMore = useCallback(() => fetch(pageRef.current + 1, true), [fetch]);

  useEffect(() => {
    pageRef.current = 1;
    fetch(1, false);
  }, [fetch]);

  return { listings, loading, error, hasMore, loadMore, refetch: () => fetch(1, false) };
}

// ─────────────────────────────────────────────────────────────
// FAVORITES HOOK — shared favorites state via backend
// ─────────────────────────────────────────────────────────────
function useFavorites(userId) {
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    if (!userId) return;
    API.get('/marketplace/favorites', { params: { userId } })
      .then(res => {
        const ids = res.data?.data?.favorites || [];
        setFavorites(new Set(ids));
      })
      .catch(() => {});
  }, [userId]);

  const toggle = useCallback(async (listing) => {
    const id = listing._id || listing.id;
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id); else next.add(id);
    setFavorites(next);
    try {
      await API.post('/marketplace/favorites/toggle', { userId, targetId: id });
    } catch { setFavorites(favorites); }
  }, [favorites, userId]);

  return { favorites, toggleFavorite: toggle };
}

// ─────────────────────────────────────────────────────────────
// MARKETPLACE CORE — the full browse experience for one role
// ─────────────────────────────────────────────────────────────
export default function MarketplaceCore({ role, initialQuery = '' }) {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const config = useMemo(() => getMarketplaceConfig(role), [role]);
  const { coords, gpsState } = useGPS();

  const [query, setQuery]               = useState(initialQuery);
  const [activeTab, setActiveTab]       = useState('all');
  const [detailListing, setDetail]      = useState(null);
  const [bookingListing, setBooking]    = useState(null);
  const [reviewListing, setReview]      = useState(null);
  const sentinelRef                     = useRef(null);

  const { listings, loading, error, hasMore, loadMore } = useMarketplaceListings({
    role, query, tab: activeTab, coords,
  });

  const { favorites, toggleFavorite } = useFavorites(userId);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '150px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  // Tab counts badge (shows total from current listing array)
  const tabCounts = useMemo(() => {
    const counts = { all: listings.length };
    return counts;
  }, [listings]);

  return (
    <div className="min-h-screen bg-[#0B1528] text-white pb-28">

      {/* Header */}
      <div className="px-5 pt-6 pb-3">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h1 className="text-sm font-bold text-white">{config.browseTitle}</h1>
            {gpsState === 'ready' && (
              <p className="text-[10px] text-green-400">📡 {config.gpsLabel}</p>
            )}
            {gpsState === 'acquiring' && (
              <p className="text-[10px] text-slate-400">📡 Ap jwenn lokasyon...</p>
            )}
            {(gpsState === 'denied' || gpsState === 'unavailable') && (
              <p className="text-[10px] text-amber-400">📍 Chèche san distans</p>
            )}
          </div>
        </div>

        {/* Search bar */}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={config.browsePlaceholder}
          className="w-full px-4 py-3 bg-[#162238] rounded-xl text-sm text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-indigo-400/40"
        />
      </div>

      {/* Tab bar */}
      <div className="px-5 pb-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {config.tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold transition ${
                activeTab === tab.id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-[#1e2d45] text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
              {tab.id === 'all' && tabCounts.all > 0 && (
                <span className="ml-1 text-[9px] text-indigo-300">({tabCounts.all})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-5 space-y-3">
        {error && (
          <p className="text-center text-red-400 text-xs mt-4">{error}</p>
        )}

        {loading && listings.length === 0 && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-40 bg-slate-800/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-3xl mb-2">{config.icon}</p>
            <p className="text-sm">Pa gen rezilta</p>
            <p className="text-xs mt-1">Eseye yon lòt mo oswa onglet</p>
          </div>
        )}

        {listings.map(item => (
          <div key={item.id || item._id} onClick={() => setDetail(item)}>
            <MarketplaceListingCard
              item={item}
              config={config}
              isFavorited={favorites.has(item._id || item.id)}
              onBook={(l) => { setBooking(l); }}
              onContact={(l) => setDetail(l)}
              onReview={(l) => { setReview(l); }}
              onFavorite={toggleFavorite}
            />
          </div>
        ))}

        {hasMore && (
          <div ref={sentinelRef} className="py-6 text-center">
            {loading && <p className="text-slate-400 text-xs animate-pulse">Chaje plis...</p>}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {detailListing && (
        <ListingDetailPanel
          listing={detailListing}
          config={config}
          onClose={() => setDetail(null)}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* Standalone booking modal */}
      {bookingListing && !detailListing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setBooking(null)}>
          <div className="w-full max-w-md bg-[#0f172a] rounded-t-2xl border border-slate-800">
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mt-3 mb-1" />
            <BookingModal listing={bookingListing} config={config}
              onClose={() => setBooking(null)} onSubmit={() => setBooking(null)} />
          </div>
        </div>
      )}

      {/* Standalone review modal */}
      {reviewListing && !detailListing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setReview(null)}>
          <div className="w-full max-w-md bg-[#0f172a] rounded-t-2xl border border-slate-800">
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mt-3 mb-1" />
            <ReviewModal listing={reviewListing} config={config}
              onClose={() => setReview(null)} onSubmit={() => setReview(null)} />
          </div>
        </div>
      )}
    </div>
  );
}