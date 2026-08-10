/**
 * MarketplaceCore.tsx
 *
 * Shared marketplace engine for JOBFAST.
 * All role-specific behavior is driven by marketplaceConfig.js —
 * no role conditions live in this file.
 */

import React, {
  useState, useCallback, useEffect, useRef, useMemo, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import {
  getMarketplaceConfig,
  AVAILABILITY_STATES,
  computeMarketplaceReputation,
} from '../../config/marketplaceConfig';
import useGPS, { GPS_STATES } from '../../hooks/useGPS';

interface ListingLocation {
  city?: string;
  state?: string;
  coordinates?: { latitude?: number; longitude?: number };
}

interface ListingItem {
  id?: string;
  _id?: string;
  name: string;
  availability?: string;
  location?: ListingLocation;
  phone?: string;
  profileMetadata?: {
    bio?: string;
    photos?: string[];
    amenities?: string[];
    cuisine?: string;
    roomType?: string;
    propertyType?: string;
    workspaceType?: string;
    tourType?: string;
    phone?: string;
  };
  profession?: string;
  experience?: string;
  language?: string;
  verified?: boolean;
  trust_score?: number;
  distanceKm?: number;
  stats?: { rating?: number };
  rating?: number;
  marketplaceData?: unknown;
}

type ConfigShape = Record<string, unknown> & {
  icon?: string;
  label?: string;
  browseTitle?: string;
  gpsLabel?: string;
  browsePlaceholder?: string;
  galleryType?: string;
  cardFields?: string[];
  contactOptions?: string[];
  tabs?: { id: string; icon?: string; label: string }[];
  reviewCriteria?: string[];
  booking: {
    label: string;
    type?: string;
    requiresDate?: boolean;
    requiresTime?: boolean;
    requiresPartySize?: boolean;
    requiresDuration?: boolean;
    requiresNotes?: boolean;
    partySizeLabel?: string;
    durationLabel?: string;
    notesLabel?: string;
  };
};

// Unified modal state — eliminates booking/detail conflict
type ActiveListingAction =
  | { type: 'detail';  listing: ListingItem }
  | { type: 'book';    listing: ListingItem }
  | { type: 'review';  listing: ListingItem }
  | { type: 'contact'; listing: ListingItem }
  | null;

interface AvailabilityState { color: string; bg: string; dot: string; label: string; }

// Normalize availability to a canonical key that exists in AVAILABILITY_STATES
const CANONICAL_AVAILABILITY = new Set(Object.keys(AVAILABILITY_STATES as Record<string, unknown>));
function normalizeAvailability(state?: string): string {
  return state && CANONICAL_AVAILABILITY.has(state) ? state : 'available';
}

// API response contract
interface MarketplaceListingsResponse {
  items: ListingItem[];
  pagination: {
    total: number;
    hasMore: boolean;
    page: number;
  };
}

// ─────────────────────────────────────────────────────────────
// AVAILABILITY BADGE
// ─────────────────────────────────────────────────────────────
export const AvailabilityBadge = memo(function AvailabilityBadge({ state }: { state?: string | undefined }) {
  const states = AVAILABILITY_STATES as Record<string, AvailabilityState>;
  const key = normalizeAvailability(state);
  const cfg: AvailabilityState = states[key] ?? states['available']!;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}>
      {cfg.dot} {cfg.label}
    </span>
  );
});

// ─────────────────────────────────────────────────────────────
// REPUTATION BAR
// ─────────────────────────────────────────────────────────────
export const ReputationBar = memo(function ReputationBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const color =
    clamped >= 80 ? '#10b981' :
    clamped >= 50 ? '#6366f1' :
                   '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${clamped}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold text-slate-400 shrink-0">{clamped}</span>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// GALLERY VIEWER
// ─────────────────────────────────────────────────────────────
const GalleryViewer = memo(function GalleryViewer({ images = [], type }: { images?: string[] | undefined; type?: string | undefined }) {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="h-32 bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-500 text-sm">
        {t('marketplace.no_photos', 'Pa gen foto')}
      </div>
    );
  }

  return (
    <div>
      <div className="h-40 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center">
        <img src={images[active]} alt={type} className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </div>
      {images.length > 1 && (
        <div className="flex gap-1.5 mt-2">
          {images.slice(0, 5).map((src, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${i === active ? 'border-indigo-500' : 'border-transparent'}`}>
              <img src={src} alt="" className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// CONTACT PANEL
// ─────────────────────────────────────────────────────────────
interface ContactPanelProps {
  listing: ListingItem;
  config: ConfigShape;
  onClose?: () => void;
  onBook?: (listing: ListingItem) => void;
}

export const ContactPanel = memo(function ContactPanel({ listing, config, onClose, onBook }: ContactPanelProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Phone can live on top-level or inside profileMetadata
  const phone = listing.phone ?? listing.profileMetadata?.phone;

  const actions: Record<string, () => void> = {
    call:       () => phone && (window.location.href = `tel:${phone}`),
    chat:       () => navigate(`/chat/${listing.id ?? listing._id}`),
    directions: () => {
      const lat = listing.location?.coordinates?.latitude;
      const lng = listing.location?.coordinates?.longitude;
      // Use typeof check — coordinates could be 0 which is falsy but valid
      if (typeof lat === 'number' && typeof lng === 'number') {
        navigate(`/map?lat=${lat}&lng=${lng}`);
      }
    },
    book:       () => { onClose?.(); onBook?.(listing); },
    emergency:  () => phone && (window.location.href = `tel:${phone}`),
  };

  const OPTION_LABELS: Record<string, { icon: string; label: string; color: string }> = {
    call:       { icon: '📞', label: t('marketplace.call', 'Rele'),            color: 'bg-green-500 text-black'   },
    chat:       { icon: '💬', label: t('marketplace.chat', 'Chat'),            color: 'bg-blue-500 text-white'    },
    book:       { icon: '📅', label: config.booking.label,                     color: 'bg-indigo-500 text-white'  },
    directions: { icon: '🗺️', label: t('marketplace.directions', 'Direksyon'), color: 'bg-slate-700 text-white'   },
    emergency:  { icon: '🚨', label: t('marketplace.emergency', 'Dijans'),     color: 'bg-red-600 text-white'     },
  };

  return (
    <div className="space-y-2">
      {(config.contactOptions ?? []).map(opt => {
        const o = OPTION_LABELS[opt];
        if (!o) return null;
        return (
          <button key={opt} onClick={actions[opt]}
            className={`w-full py-2.5 rounded-xl text-sm font-bold ${o.color}`}>
            {o.icon} {o.label}
          </button>
        );
      })}
      <button onClick={onClose} className="w-full py-2 rounded-xl text-xs text-slate-400 bg-slate-800/50">
        {t('marketplace.close', 'Fèmen')}
      </button>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// BOOKING MODAL
// ─────────────────────────────────────────────────────────────
interface BookingModalProps {
  listing: ListingItem;
  config: ConfigShape;
  onClose?: () => void;
  onSubmit?: () => void;
}

export const BookingModal = memo(function BookingModal({ listing, config, onClose, onSubmit }: BookingModalProps) {
  const { t } = useTranslation();
  const bc = config.booking;

  const [form, setForm] = useState({ date: '', time: '', partySize: 1, duration: 1, notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  // Central booking validator
  const formInvalid =
    (bc.requiresDate === true && !form.date) ||
    (bc.requiresTime === true && !form.time) ||
    (bc.requiresPartySize === true && form.partySize < 1) ||
    (bc.requiresDuration === true && form.duration < 1);

  const handleSubmit = useCallback(async () => {
    if (bc.requiresDate === true && !form.date) return;
    if (bc.requiresTime === true && !form.time) return;
    if (bc.requiresPartySize === true && form.partySize < 1) return;
    if (bc.requiresDuration === true && form.duration < 1) return;
    setSubmitting(true);
    setApiError(null);
    try {
      // Backend derives customer identity from JWT — never send customerId/customerName from frontend
      await API.post('/marketplace/book', {
        targetId:    listing._id ?? listing.id,
        targetName:  listing.name,
        bookingType: bc.type,
        ...form,
      });
      setSuccess(true);
      onSubmit?.();
    } catch {
      setApiError('Rezèvasyon an echwe. Eseye ankò.');
    } finally {
      setSubmitting(false);
    }
  }, [form, listing, bc, onSubmit]);

  if (success) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-3xl">✅</p>
        <p className="text-white font-bold">{t('marketplace.booking_sent', 'Demann Anvwaye!')}</p>
        <p className="text-xs text-slate-400">{t('marketplace.booking_sent_hint', 'Ou pral resevwa yon konfirmasyon tou dousman.')}</p>
        <button onClick={onClose} className="w-full py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold">{t('marketplace.close', 'Fèmen')}</button>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <h3 className="text-sm font-bold text-white">📅 {bc.label} — {listing.name}</h3>
      {bc.requiresDate && (
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">{t('marketplace.date_label', 'Dat')}</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500/40" />
        </div>
      )}
      {bc.requiresTime && (
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">{t('marketplace.time_label', 'Lè')}</label>
          <input type="time" value={form.time} onChange={e => set('time', e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500/40" />
        </div>
      )}
      {bc.requiresPartySize && (
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">{bc.partySizeLabel ?? t('marketplace.party_size_label', 'Kantite Moun')}</label>
          <div className="flex items-center gap-3">
            <button onClick={() => set('partySize', Math.max(1, form.partySize - 1))} className="w-8 h-8 bg-slate-800 rounded-lg text-white font-bold">−</button>
            <span className="text-white font-bold text-sm w-6 text-center">{form.partySize}</span>
            <button onClick={() => set('partySize', Math.min(50, form.partySize + 1))} className="w-8 h-8 bg-slate-800 rounded-lg text-white font-bold">+</button>
          </div>
        </div>
      )}
      {bc.requiresDuration && (
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">{bc.durationLabel ?? t('marketplace.duration_label', 'Dire')}</label>
          <div className="flex items-center gap-3">
            <button onClick={() => set('duration', Math.max(1, form.duration - 1))} className="w-8 h-8 bg-slate-800 rounded-lg text-white font-bold">−</button>
            <span className="text-white font-bold text-sm w-6 text-center">{form.duration}</span>
            <button onClick={() => set('duration', form.duration + 1)} className="w-8 h-8 bg-slate-800 rounded-lg text-white font-bold">+</button>
          </div>
        </div>
      )}
      {bc.requiresNotes && (
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">{bc.notesLabel ?? t('marketplace.notes_label', 'Nòt')}</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            rows={2} placeholder={t('marketplace.notes_placeholder', 'Ekri nòt ou...')}
            className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none resize-none" />
        </div>
      )}
      {apiError && <p className="text-xs text-red-400">{t('marketplace.booking_failed', apiError)}</p>}
      <div className="flex gap-2 pt-2">
        <button onClick={handleSubmit}
          disabled={submitting || formInvalid}
          className="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold disabled:opacity-40">
          {submitting ? t('marketplace.sending', 'Ap anvwaye...') : bc.label}
        </button>
        <button onClick={onClose} className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm">{t('marketplace.cancel', 'Anile')}</button>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// REVIEW MODAL
// ─────────────────────────────────────────────────────────────
interface ReviewModalProps {
  listing: ListingItem;
  config: ConfigShape;
  onClose?: () => void;
  onSubmit?: () => void;
}

export const ReviewModal = memo(function ReviewModal({ listing, config, onClose, onSubmit }: ReviewModalProps) {
  const { t } = useTranslation();
  const [overallRating, setOverallRating] = useState(0);
  const [criteria, setCriteria] = useState<Record<string, number>>(
    Object.fromEntries((config.reviewCriteria ?? []).map(c => [c, 0])),
  );
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const setCriterion = (key: string, val: number) => setCriteria(prev => ({ ...prev, [key]: val }));

  const StarPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} onClick={() => onChange(s)}
          className={`text-lg transition ${s <= value ? 'text-amber-400' : 'text-slate-600'}`}>★</button>
      ))}
    </div>
  );

  const handleSubmit = useCallback(async () => {
    if (overallRating === 0) return;
    setSubmitting(true);
    try {
      // Backend derives reviewer identity from JWT — never send reviewerId from frontend
      await API.post('/marketplace/reviews', {
        targetId: listing._id ?? listing.id,
        rating:   overallRating,
        criteria,
        comment,
      });
      setSuccess(true);
      onSubmit?.();
    } catch {
      // keep open on error
    } finally {
      setSubmitting(false);
    }
  }, [overallRating, criteria, comment, listing, onSubmit]);

  if (success) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-3xl">⭐</p>
        <p className="text-white font-bold">{t('marketplace.review_thanks', 'Mèsi pou Evalyasyon Ou!')}</p>
        <button onClick={onClose} className="w-full py-2.5 bg-amber-500 text-black rounded-xl text-sm font-bold">{t('marketplace.close', 'Fèmen')}</button>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <h3 className="text-sm font-bold text-white">⭐ {t('marketplace.review_action', 'Evalye')} — {listing.name}</h3>
      <div>
        <label className="text-[10px] text-slate-400 block mb-2">{t('marketplace.rating_global', 'Rating Global')}</label>
        <StarPicker value={overallRating} onChange={setOverallRating} />
      </div>
      {(config.reviewCriteria ?? []).length > 0 && (
        <div className="space-y-2.5">
          <label className="text-[10px] text-slate-400 block">{t('marketplace.rating_detail', 'Detay')}</label>
          {config.reviewCriteria!.map(criterion => (
            <div key={criterion} className="flex items-center justify-between">
              <span className="text-xs text-slate-300 capitalize">{criterion}</span>
              <StarPicker value={criteria[criterion] ?? 0} onChange={v => setCriterion(criterion, v)} />
            </div>
          ))}
        </div>
      )}
      <div>
        <label className="text-[10px] text-slate-400 block mb-1">{t('marketplace.comment_label', 'Kòmantè')}</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          rows={3} placeholder={t('marketplace.comment_placeholder', 'Pata eksperyans ou...')}
          className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none resize-none" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSubmit}
          disabled={submitting || overallRating === 0}
          className="flex-1 py-2.5 bg-amber-500 text-black rounded-xl text-sm font-bold disabled:opacity-40">
          {submitting ? t('marketplace.sending', 'Ap anvwaye...') : t('marketplace.submit_review', 'Soumèt Evalyasyon')}
        </button>
        <button onClick={onClose} className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm">{t('marketplace.cancel', 'Anile')}</button>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// MARKETPLACE LISTING CARD
// ─────────────────────────────────────────────────────────────
const CARD_FIELD_RENDERERS: Record<string, (item: ListingItem) => string | null> = {
  cuisine:        (item) => item.profileMetadata?.cuisine ? `🍽️ ${item.profileMetadata.cuisine}` : null,
  room_type:      (item) => item.profileMetadata?.roomType ? `🛏️ ${item.profileMetadata.roomType}` : null,
  property_type:  (item) => item.profileMetadata?.propertyType ? `🏠 ${item.profileMetadata.propertyType}` : null,
  workspace_type: (item) => item.profileMetadata?.workspaceType ? `💼 ${item.profileMetadata.workspaceType}` : null,
  tour_type:      (item) => item.profileMetadata?.tourType ? `🗺️ ${item.profileMetadata.tourType}` : null,
  specialty:      (item) => item.profession ? `⚕️ ${item.profession}` : null,
  service_type:   (item) => item.profession ? `🔧 ${item.profession}` : null,
  amenities:      (item) => (item.profileMetadata?.amenities ?? []).slice(0, 2).join(' • ') || null,
  rating:         (item) => { const r = item.stats?.rating ?? item.rating; return r != null ? `⭐ ${Number(r).toFixed(1)}` : null; },
  trust_score:    (item) => item.trust_score != null ? `🛡️ ${item.trust_score}` : null,
  distance:       (item) => item.distanceKm != null ? `📍 ${Number(item.distanceKm).toFixed(1)} km` : null,
  experience:     (item) => item.experience ? `🎓 ${item.experience} ans` : null,
  language:       (item) => item.language ? `🌐 ${item.language}` : null,
  verified:       () => null, // rendered via t() in card body
  availability:   () => null,
};

interface MarketplaceListingCardProps {
  item: ListingItem;
  config: ConfigShape;
  onBook?: (item: ListingItem) => void;
  onContact?: (item: ListingItem) => void;
  onReview?: (item: ListingItem) => void;
  onFavorite?: (item: ListingItem) => void;
  isFavorited?: boolean;
}

export const MarketplaceListingCard = memo(function MarketplaceListingCard({
  item, config, onBook, onContact, onReview, onFavorite, isFavorited,
}: MarketplaceListingCardProps) {
  const { t } = useTranslation();
  const city = item.location?.city ?? item.location?.state ?? '';

  const fields = (config.cardFields ?? [])
    .filter(f => f !== 'availability' && f !== 'verified')
    .map(f => ({ key: f, text: CARD_FIELD_RENDERERS[f]?.(item) ?? null }))
    .filter(f => f.text);

  const reputationScore = useMemo(
    () => Math.max(0, Math.min(100, Math.round(Number((computeMarketplaceReputation as (u: unknown, d: unknown) => number)(item, item.marketplaceData)) || 0))),
    [item],
  );

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 transition">
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
            <AvailabilityBadge state={item.availability} />
            {/* stopPropagation prevents card onClick from firing when favoriting */}
            <button
              onClick={e => { e.stopPropagation(); onFavorite?.(item); }}
              className={`text-lg transition ${isFavorited ? 'text-rose-400' : 'text-slate-600 hover:text-rose-300'}`}>
              {isFavorited ? '❤️' : '🤍'}
            </button>
          </div>
        </div>
        <div className="mt-2"><ReputationBar score={reputationScore} /></div>
      </div>

      {fields.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-x-3 gap-y-1">
          {fields.map(f => (
            <span key={f.key} className="text-[10px] text-slate-300">{f.text}</span>
          ))}
        </div>
      )}

      {item.verified && (
        <p className="px-4 pb-1 text-[10px] text-green-400 font-bold">✅ {t('marketplace.verified', 'Verifye')}</p>
      )}

      {item.profileMetadata?.bio && (
        <p className="px-4 pb-2 text-[10px] text-slate-400 line-clamp-2">{item.profileMetadata.bio}</p>
      )}

      <div className="px-4 pb-4 grid grid-cols-3 gap-2">
        {/* stopPropagation on all action buttons — prevents detail panel from opening simultaneously */}
        <button
          onClick={e => { e.stopPropagation(); onBook?.(item); }}
          className="py-2 rounded-xl bg-indigo-500 text-white text-[10px] font-bold">
          {config.booking.label}
        </button>
        <button
          onClick={e => { e.stopPropagation(); onContact?.(item); }}
          className="py-2 rounded-xl bg-slate-800 text-slate-200 text-[10px]">
          📞 {t('marketplace.contact', 'Kontakte')}
        </button>
        <button
          onClick={e => { e.stopPropagation(); onReview?.(item); }}
          className="py-2 rounded-xl bg-slate-800 text-amber-400 text-[10px]">
          ⭐ {t('marketplace.review_action', 'Evalye')}
        </button>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// LISTING DETAIL PANEL
// ─────────────────────────────────────────────────────────────
type PanelMode = 'detail' | 'book' | 'review' | 'contact';

interface ListingDetailPanelProps {
  listing: ListingItem;
  config: ConfigShape;
  onClose: () => void;
  favorites?: Set<string>;
  onToggleFavorite?: (listing: ListingItem) => void;
}

function ListingDetailPanel({ listing, config, onClose, favorites, onToggleFavorite }: ListingDetailPanelProps) {
  const { t } = useTranslation();
  const [panel, setPanel] = useState<PanelMode>('detail');
  const isFav = favorites?.has(listing._id ?? listing.id ?? '');

  const reputationScore = Math.max(
    0, Math.min(100, Math.round(Number((computeMarketplaceReputation as (u: unknown, d: unknown) => number)(listing, listing.marketplaceData)) || 0)),
  );

  const panels: Record<PanelMode, React.ReactNode> = {
    detail: (
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white">{listing.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {listing.location?.city ?? ''} • {config.label}
            </p>
          </div>
          <button onClick={() => onToggleFavorite?.(listing)} className={`text-2xl ${isFav ? 'text-rose-400' : 'text-slate-600'}`}>
            {isFav ? '❤️' : '🤍'}
          </button>
        </div>

        <AvailabilityBadge state={listing.availability} />

        <GalleryViewer images={listing.profileMetadata?.photos ?? []} type={config.galleryType} />

        {listing.profileMetadata?.bio && (
          <p className="text-xs text-slate-300">{listing.profileMetadata.bio}</p>
        )}

        <div>
          <p className="text-[10px] font-bold text-slate-500 mb-1.5">{t('marketplace.reputation', 'Reputasyon')}</p>
          <ReputationBar score={reputationScore} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setPanel('book')} className="py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-bold">
            📅 {config.booking.label}
          </button>
          <button onClick={() => setPanel('contact')} className="py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs">
            📞 {t('marketplace.contact', 'Kontakte')}
          </button>
          <button onClick={() => setPanel('review')} className="py-2.5 rounded-xl bg-slate-800 text-amber-400 text-xs">
            ⭐ {t('marketplace.review_action', 'Evalye')}
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
// DATA HOOK
// ─────────────────────────────────────────────────────────────
interface UseMarketplaceListingsOptions {
  role?: string | undefined;
  query?: string;
  tab?: string;
  coords?: { lat: number; lng: number } | null;
  enabled?: boolean;
}

export function useMarketplaceListings({ role, query = '', tab = 'all', coords, enabled = true }: UseMarketplaceListingsOptions) {
  const [listings, setListings]   = useState<ListingItem[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [hasMore, setHasMore]     = useState(false);
  const [totalCount, setTotal]    = useState(0);
  const abortRef                  = useRef<AbortController | null>(null);
  const pageRef                   = useRef(1);
  const loadingMoreRef            = useRef(false);

  const fetchListings = useCallback(async (page = 1, append = false) => {
    if (!enabled) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { role, q: query, tab, page, limit: 20 };
      if (coords) { params['lat'] = coords.lat; params['lng'] = coords.lng; }

      const res = await API.get('/marketplace/listings', { params, signal: ctrl.signal });
      const data = res.data?.data as MarketplaceListingsResponse | undefined;
      const items = data?.items ?? [];
      // Fallback pagination for backends that haven't adopted the new contract yet
      const pagination = data?.pagination ?? { total: items.length, hasMore: false, page };

      setListings(prev => (append ? [...prev, ...items] : items));
      setHasMore(pagination.hasMore);
      setTotal(pagination.total);
      pageRef.current = page;
    } catch (err: unknown) {
      const e = err as { code?: string; name?: string };
      if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') return;
      setError('Erè rezo. Eseye ankò.');
    } finally {
      setLoading(false);
    }
  }, [role, query, tab, coords, enabled]);

  // Guard against concurrent loadMore calls firing from IntersectionObserver
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    try {
      await fetchListings(pageRef.current + 1, true);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [fetchListings]);

  useEffect(() => {
    pageRef.current = 1;
    fetchListings(1, false);
  }, [fetchListings]);

  return { listings, loading, error, hasMore, totalCount, loadMore, refetch: () => fetchListings(1, false) };
}

// ─────────────────────────────────────────────────────────────
// FAVORITES HOOK
// ─────────────────────────────────────────────────────────────
function useFavorites(userId: string | undefined) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    API.get('/marketplace/favorites', { params: { userId } })
      .then(res => {
        const ids: string[] = (res.data?.data as { favorites?: string[] })?.favorites ?? [];
        setFavorites(new Set(ids));
      })
      .catch(() => {});
  }, [userId]);

  const toggle = useCallback(async (listing: ListingItem) => {
    const id = listing._id ?? listing.id ?? '';
    // Optimistic update — functional form avoids stale-closure race conditions
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    try {
      await API.post('/marketplace/favorites/toggle', { targetId: id });
    } catch {
      // Rollback on API error
      setFavorites(prev => {
        const rollback = new Set(prev);
        if (rollback.has(id)) rollback.delete(id); else rollback.add(id);
        return rollback;
      });
    }
  }, [userId]);

  return { favorites, toggleFavorite: toggle };
}

// ─────────────────────────────────────────────────────────────
// MARKETPLACE CORE
// ─────────────────────────────────────────────────────────────
interface MarketplaceCoreProps { role?: string; initialQuery?: string; }

export default function MarketplaceCore({ role, initialQuery = '' }: MarketplaceCoreProps) {
  const { t } = useTranslation();
  const { user } = useAuth() as { user: Record<string, unknown> | null };
  const userId = (user?.['_id'] ?? user?.['id']) as string | undefined;
  const config = useMemo(() => getMarketplaceConfig(role ?? '') as unknown as ConfigShape, [role]);
  const { coords, gpsState, acquire } = useGPS() as {
    coords: { lat: number; lng: number } | null;
    gpsState: string;
    acquire: () => void;
  };

  // GPS acquisition — never blocks the marketplace, coords passed for geo-ranking when available
  useEffect(() => { acquire(); }, [acquire]);

  // Separate input state (immediate) from query state (debounced 350ms)
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [query, setQuery]             = useState(initialQuery);
  const [activeTab, setActiveTab]     = useState('all');
  const [activeAction, setActiveAction] = useState<ActiveListingAction>(null);
  const sentinelRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { listings, loading, error, hasMore, loadMore, totalCount } = useMarketplaceListings({
    role, query, tab: activeTab, coords,
  });

  const { favorites, toggleFavorite } = useFavorites(userId);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0]?.isIntersecting) loadMore(); },
      { rootMargin: '150px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  // Tab counts come from backend pagination.total, not local array length
  const tabCounts = useMemo(() => ({ all: totalCount }), [totalCount]);

  // Unified action helpers
  const openDetail  = useCallback((listing: ListingItem) => setActiveAction({ type: 'detail',  listing }), []);
  const openBook    = useCallback((listing: ListingItem) => setActiveAction({ type: 'book',    listing }), []);
  const openReview  = useCallback((listing: ListingItem) => setActiveAction({ type: 'review',  listing }), []);
  const openContact = useCallback((listing: ListingItem) => setActiveAction({ type: 'contact', listing }), []);
  const closeAction = useCallback(() => setActiveAction(null), []);

  const gpsAcquiring = gpsState === (GPS_STATES as Record<string, string>)['acquiring'] || gpsState === (GPS_STATES as Record<string, string>)['idle'];
  const gpsBlocked   = gpsState === (GPS_STATES as Record<string, string>)['denied']
    || gpsState === (GPS_STATES as Record<string, string>)['unavailable']
    || gpsState === (GPS_STATES as Record<string, string>)['disabled']
    || gpsState === (GPS_STATES as Record<string, string>)['blocked'];

  return (
    <div className="min-h-screen bg-[#0B1528] text-white pb-28">
      <div className="px-5 pt-6 pb-3">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h1 className="text-sm font-bold text-white">{config.browseTitle}</h1>
            {coords !== null && <p className="text-[10px] text-green-400">📡 {config.gpsLabel}</p>}
            {gpsAcquiring && <p className="text-[10px] text-slate-400">📡 {t('marketplace.gps_searching', 'Ap jwenn lokasyon...')}</p>}
            {gpsBlocked   && <p className="text-[10px] text-amber-400">📍 {t('marketplace.gps_no_distance', 'Chèche san distans')}</p>}
          </div>
        </div>

        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder={config.browsePlaceholder}
          className="w-full px-4 py-3 bg-[#162238] rounded-xl text-sm text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-indigo-400/40"
        />
      </div>

      <div className="px-5 pb-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {(config.tabs ?? []).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold transition ${
                activeTab === tab.id ? 'bg-indigo-500 text-white' : 'bg-[#1e2d45] text-slate-400 hover:text-white'
              }`}>
              {tab.icon} {tab.label}
              {tab.id === 'all' && tabCounts.all > 0 && (
                <span className="ml-1 text-[9px] text-indigo-300">({tabCounts.all})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-3">
        {error && <p className="text-center text-red-400 text-xs mt-4">{t('marketplace.network_error', error)}</p>}

        {loading && listings.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-slate-800/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-3xl mb-2">{config.icon}</p>
            <p className="text-sm">{t('marketplace.no_results', 'Pa gen rezilta')}</p>
            <p className="text-xs mt-1">{t('marketplace.no_results_hint', 'Eseye yon lòt mo oswa onglet')}</p>
          </div>
        )}

        {listings.map(item => (
          <div key={item.id ?? item._id} onClick={() => openDetail(item)}>
            <MarketplaceListingCard
              item={item}
              config={config}
              isFavorited={favorites.has(item._id ?? item.id ?? '')}
              onBook={openBook}
              onContact={openContact}
              onReview={openReview}
              onFavorite={toggleFavorite}
            />
          </div>
        ))}

        {hasMore && (
          <div ref={sentinelRef} className="py-6 text-center">
            {loading && <p className="text-slate-400 text-xs animate-pulse">{t('marketplace.loading_more', 'Chaje plis...')}</p>}
          </div>
        )}
      </div>

      {/* Unified modal rendering — only one action active at a time */}
      {activeAction?.type === 'detail' && (
        <ListingDetailPanel
          listing={activeAction.listing}
          config={config}
          onClose={closeAction}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {activeAction?.type === 'book' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && closeAction()}>
          <div className="w-full max-w-md bg-[#0f172a] rounded-t-2xl border border-slate-800">
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mt-3 mb-1" />
            <BookingModal listing={activeAction.listing} config={config}
              onClose={closeAction} onSubmit={closeAction} />
          </div>
        </div>
      )}

      {activeAction?.type === 'review' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && closeAction()}>
          <div className="w-full max-w-md bg-[#0f172a] rounded-t-2xl border border-slate-800">
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mt-3 mb-1" />
            <ReviewModal listing={activeAction.listing} config={config}
              onClose={closeAction} onSubmit={closeAction} />
          </div>
        </div>
      )}

      {activeAction?.type === 'contact' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && closeAction()}>
          <div className="w-full max-w-md bg-[#0f172a] rounded-t-2xl border border-slate-800 p-5">
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mt-3 mb-5" />
            <ContactPanel listing={activeAction.listing} config={config}
              onClose={closeAction} onBook={openBook} />
          </div>
        </div>
      )}
    </div>
  );
}
