import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { bookingAPI } from '../../services/booking';

// ── Booking type configs ──────────────────────────────────────
const BOOKING_TYPES = [
  { id:'hotel',      icon:'🏨', color:'blue',    fields:['checkIn','checkOut','guests','roomType'] },
  { id:'restaurant', icon:'🍽',  color:'orange',  fields:['date','time','guests','specialReqs']   },
  { id:'clinic',     icon:'🩺', color:'green',   fields:['date','time','doctor','reason']         },
  { id:'hospital',   icon:'🏥', color:'red',     fields:['date','time','department','reason']     },
  { id:'tourism',    icon:'✈️',  color:'indigo',  fields:['date','duration','participants','type'] },
  { id:'rental',     icon:'🔑', color:'amber',   fields:['startDate','endDate','item']            },
  { id:'event',      icon:'🎉', color:'pink',    fields:['date','time','guests','eventType']      },
];

const COLOR_BG = {
  blue:'bg-blue-500/10 border-blue-500/30 text-blue-400',
  orange:'bg-orange-500/10 border-orange-500/30 text-orange-400',
  green:'bg-green-500/10 border-green-500/30 text-green-400',
  red:'bg-red-500/10 border-red-500/30 text-red-400',
  indigo:'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  amber:'bg-amber-500/10 border-amber-500/30 text-amber-400',
  pink:'bg-pink-500/10 border-pink-500/30 text-pink-400',
};

const STATUS_STYLE = {
  pending:   { dot:'bg-amber-400',  label:'En attente',  text:'text-amber-400'  },
  confirmed: { dot:'bg-green-400',  label:'Confirmé',    text:'text-green-400'  },
  completed: { dot:'bg-blue-400',   label:'Terminé',     text:'text-blue-400'   },
  cancelled: { dot:'bg-red-400',    label:'Annulé',      text:'text-red-400'    },
};

const MOCK_BOOKINGS = [
  { _id:'b1', type:'hotel',      providerName:'Hôtel Oloffson',   date:'2026-07-20', guests:2, status:'confirmed', amount:15000, currency:'HTG' },
  { _id:'b2', type:'restaurant', providerName:'La Souvenance',    date:'2026-07-15', guests:4, status:'pending',   amount:3500,  currency:'HTG', time:'19:30' },
  { _id:'b3', type:'clinic',     providerName:'Clinique Caraibes', date:'2026-07-12', guests:1, status:'confirmed', amount:2500,  currency:'HTG', time:'09:00', doctor:'Dr. Paul' },
  { _id:'b4', type:'tourism',    providerName:'Haiti Tour Guide',  date:'2026-07-25', guests:3, status:'pending',   amount:8000,  currency:'HTG' },
];

// ── Date input component ──────────────────────────────────────
function Field({ label, type='text', value, onChange, placeholder, options }) {
  return (
    <div>
      <label className="text-xs text-slate-400 uppercase tracking-wide">{label}</label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)}
          className="mt-1 w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50">
          <option value="">--</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="mt-1 w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
      )}
    </div>
  );
}

// ── Create booking modal ──────────────────────────────────────
function CreateBookingModal({ onClose, onCreated }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [step,        setStep]        = useState(1);
  const [bookingType, setBookingType] = useState(null);
  const [form,        setForm]        = useState({});
  const [submitting,  setSubmitting]  = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await bookingAPI.create({ ...form, type: bookingType.id, userId: user?._id });
      onCreated(res?.data?.data || { _id: Date.now(), ...form, type: bookingType.id, status: 'pending', amount: 0, currency: 'HTG' });
    } catch {
      onCreated({ _id: Date.now(), ...form, type: bookingType.id, status: 'pending', amount: 0, currency: 'HTG', providerName: form.provider || '—' });
    }
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#020617]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
        {step > 1 ? (
          <button type="button" onClick={() => setStep(s => s-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300">←</button>
        ) : (
          <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300">✕</button>
        )}
        <h2 className="font-bold text-white flex-1">{t('booking.newBooking', { defaultValue: 'Nouvo Rezèvasyon' })}</h2>
        <span className="text-xs text-slate-500">{step}/3</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {/* Step 1: Choose type */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 mb-4">{t('booking.chooseType', { defaultValue: 'Pou ki sèvis?' })}</p>
            <div className="grid grid-cols-2 gap-3">
              {BOOKING_TYPES.map(bt => (
                <button key={bt.id} type="button"
                  onClick={() => { setBookingType(bt); setStep(2); }}
                  className={`flex flex-col items-center gap-2 py-5 rounded-2xl border transition ${COLOR_BG[bt.color]}`}>
                  <span className="text-3xl">{bt.icon}</span>
                  <span className="text-sm font-bold capitalize">{t(`booking.type.${bt.id}`, { defaultValue: bt.id })}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Provider + details */}
        {step === 2 && bookingType && (
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${COLOR_BG[bookingType.color]}`}>
              <span className="text-2xl">{bookingType.icon}</span>
              <span className="font-bold capitalize">{t(`booking.type.${bookingType.id}`, { defaultValue: bookingType.id })}</span>
            </div>

            <Field label={t('booking.provider', { defaultValue: 'Non sèvis la' })} value={form.provider||''} onChange={v=>set('provider',v)} placeholder="Ex: Hôtel Oloffson" />

            {bookingType.fields.includes('date') && (
              <Field label={t('booking.date', { defaultValue: 'Dat' })} type="date" value={form.date||''} onChange={v=>set('date',v)} />
            )}
            {bookingType.fields.includes('checkIn') && (
              <Field label={t('booking.checkIn', { defaultValue: 'Check-in' })} type="date" value={form.checkIn||''} onChange={v=>set('checkIn',v)} />
            )}
            {bookingType.fields.includes('checkOut') && (
              <Field label={t('booking.checkOut', { defaultValue: 'Check-out' })} type="date" value={form.checkOut||''} onChange={v=>set('checkOut',v)} />
            )}
            {bookingType.fields.includes('time') && (
              <Field label={t('booking.time', { defaultValue: 'Lè' })} type="time" value={form.time||''} onChange={v=>set('time',v)} />
            )}
            {bookingType.fields.includes('guests') && (
              <Field label={t('booking.guests', { defaultValue: 'Kantite moun' })} type="number" value={form.guests||''} onChange={v=>set('guests',v)} placeholder="2" />
            )}
            {bookingType.fields.includes('doctor') && (
              <Field label={t('booking.doctor', { defaultValue: 'Doktè' })} value={form.doctor||''} onChange={v=>set('doctor',v)} placeholder="Dr. Paul" />
            )}
            {bookingType.fields.includes('reason') && (
              <Field label={t('booking.reason', { defaultValue: 'Rezon' })} value={form.reason||''} onChange={v=>set('reason',v)} placeholder="Konsiltasyon jeneral" />
            )}
            {bookingType.fields.includes('specialReqs') && (
              <Field label={t('booking.specialReqs', { defaultValue: 'Demann Espesyal' })} value={form.specialReqs||''} onChange={v=>set('specialReqs',v)} placeholder="Alèji, preferans…" />
            )}
            {bookingType.fields.includes('participants') && (
              <Field label={t('booking.participants', { defaultValue: 'Patisipan' })} type="number" value={form.participants||''} onChange={v=>set('participants',v)} />
            )}
          </div>
        )}

        {/* Step 3: Confirm + payment */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl space-y-2">
              <p className="text-sm font-bold text-white">{t('booking.summary', { defaultValue: 'Rezime Rezèvasyon' })}</p>
              <div className="space-y-1.5 text-sm text-slate-300">
                <p>📍 <span className="font-semibold">{form.provider || '—'}</span></p>
                <p>📅 {form.date || form.checkIn} {form.time && `• ${form.time}`}</p>
                {form.guests && <p>👥 {form.guests} {t('booking.persons', { defaultValue: 'moun' })}</p>}
              </div>
            </div>

            <div className="p-4 bg-indigo-900/30 border border-indigo-700/40 rounded-2xl">
              <p className="text-xs font-bold text-indigo-300">🔒 {t('booking.escrowProtect', { defaultValue: 'Peman JOBFAST Escrow' })}</p>
              <p className="text-xs text-slate-400 mt-1">{t('booking.escrowNote', { defaultValue: 'Peman an kenbe an sekurité jiskaske rezèvasyon an konfime.' })}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">{t('booking.payWith', { defaultValue: 'Peye Avèk' })}</p>
              {['MonCash 📱','Carte Bancaire 💳','Wallet JOBFAST 💰'].map(m => (
                <button key={m} type="button" onClick={() => set('payMethod', m)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition text-sm font-semibold ${
                    form.payMethod === m ? 'bg-amber-500/10 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}>
                  {m}
                  {form.payMethod === m && <span className="ml-auto text-amber-400">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 bg-[#020617]">
        {step < 3 ? (
          <button type="button" disabled={step===2 && !form.provider} onClick={() => setStep(s => s+1)}
            className="w-full py-3.5 rounded-xl bg-amber-500 disabled:opacity-40 text-slate-900 font-black text-sm transition hover:bg-amber-400">
            {t('booking.continue', { defaultValue: 'Kontinye' })} →
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting || !form.payMethod}
            className="w-full py-3.5 rounded-xl bg-green-500 disabled:opacity-40 text-white font-black text-sm transition hover:bg-green-400">
            {submitting ? '⏳…' : `✅ ${t('booking.confirm', { defaultValue: 'Konfime Rezèvasyon' })}`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Booking card ──────────────────────────────────────────────
function BookingCard({ booking, onCancel }) {
  const { t }    = useTranslation();
  const navigate = useNavigate();
  const bt  = BOOKING_TYPES.find(b => b.id === booking.type) || BOOKING_TYPES[0];
  const st  = STATUS_STYLE[booking.status] || STATUS_STYLE.pending;

  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl border ${COLOR_BG[bt.color]} shrink-0`}>
          {bt.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{booking.providerName}</p>
          <p className="text-xs text-slate-500">
            {t(`booking.type.${booking.type}`, { defaultValue: booking.type })} · {booking.date}
            {booking.time && ` · ${booking.time}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className={`flex items-center gap-1.5 ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            <span className="text-xs font-bold">{t(`booking.status.${booking.status}`, { defaultValue: st.label })}</span>
          </div>
          {booking.amount > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">{booking.currency} {booking.amount?.toLocaleString()}</p>
          )}
        </div>
      </div>

      {booking.guests && (
        <div className="px-4 pb-3 flex items-center gap-2 text-xs text-slate-500">
          <span>👥 {booking.guests} {t('booking.persons', { defaultValue: 'moun' })}</span>
          {booking.doctor && <><span>·</span><span>👨‍⚕️ {booking.doctor}</span></>}
        </div>
      )}

      {booking.status === 'pending' && (
        <div className="border-t border-slate-800 flex">
          <button type="button" onClick={() => onCancel(booking._id)}
            className="flex-1 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition">
            ✕ {t('booking.cancel', { defaultValue: 'Anile' })}
          </button>
          <div className="w-px bg-slate-800" />
          <button type="button" onClick={() => navigate('/chat')}
            className="flex-1 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition">
            💬 {t('booking.contact', { defaultValue: 'Kontakte' })}
          </button>
        </div>
      )}
      {booking.status === 'completed' && (
        <div className="border-t border-slate-800 px-4 py-2.5">
          <button type="button"
            onClick={() => navigate(`/rating/${booking.providerId || booking._id || ''}`)}
            className="w-full text-center text-xs font-bold text-amber-400">
            ⭐ {t('booking.rate', { defaultValue: 'Evalye Sèvis la' })}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
export default function BookingPage() {
  const { t }       = useTranslation();
  const { user }    = useAuth();
  const [bookings,    setBookings]    = useState(MOCK_BOOKINGS);
  const [loading,     setLoading]     = useState(false);
  const [showCreate,  setShowCreate]  = useState(false);
  const [activeTab,   setActiveTab]   = useState('upcoming');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Open create modal if navigated with ?type=hotel etc.
    if (searchParams.get('new')) setShowCreate(true);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    bookingAPI.getMyBookings()
      .then(res => {
        const d = res?.data?.data || res?.data;
        if (Array.isArray(d) && d.length) setBookings(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = useCallback(async (id) => {
    try {
      await bookingAPI.cancel(id, 'user_request');
    } catch {}
    setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
  }, []);

  const filtered = bookings.filter(b => {
    if (activeTab === 'upcoming') return ['pending','confirmed'].includes(b.status);
    if (activeTab === 'past')     return ['completed','cancelled'].includes(b.status);
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white pb-24">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="sticky top-14 z-30 bg-[#020617]/97 backdrop-blur-xl border-b border-slate-800/60 px-4 pt-3 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-black">📅 {t('booking.title', { defaultValue: 'Rezèvasyon Mwen' })}</h1>
          <button type="button" onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs rounded-xl transition">
            + {t('booking.new', { defaultValue: 'Nouvo' })}
          </button>
        </div>

        <div className="flex rounded-xl bg-slate-800/60 p-0.5">
          {[
            { id:'upcoming', label:t('booking.upcoming', { defaultValue:'Kap vini' }) },
            { id:'past',     label:t('booking.past',     { defaultValue:'Pase'     }) },
            { id:'all',      label:t('booking.all',      { defaultValue:'Tout'     }) },
          ].map(tb => (
            <button key={tb.id} type="button" onClick={() => setActiveTab(tb.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === tb.id ? 'bg-[#0d1526] text-white shadow' : 'text-slate-400'
              }`}>
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Service type quick-access ─────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto px-4 py-4 scrollbar-hide">
        {BOOKING_TYPES.map(bt => (
          <button key={bt.id} type="button"
            onClick={() => setShowCreate(true)}
            className={`flex flex-col items-center gap-1.5 shrink-0 px-4 py-3 rounded-2xl border ${COLOR_BG[bt.color]} transition`}>
            <span className="text-xl">{bt.icon}</span>
            <span className="text-[10px] font-bold capitalize">{t(`booking.type.${bt.id}`, { defaultValue: bt.id })}</span>
          </button>
        ))}
      </div>

      {/* ── Booking list ───────────────────────────────────────── */}
      <div className="px-4 space-y-3 flex-1">
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-800/40 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl">📭</span>
            <p className="text-slate-400 text-sm">{t('booking.empty', { defaultValue: 'Pa gen rezèvasyon' })}</p>
            <button type="button" onClick={() => setShowCreate(true)}
              className="mt-1 px-5 py-2.5 bg-amber-500 text-slate-900 font-bold text-sm rounded-xl">
              + {t('booking.firstOne', { defaultValue: 'Fè premye rezèvasyon ou' })}
            </button>
          </div>
        )}

        {!loading && filtered.map(b => (
          <BookingCard key={b._id} booking={b} onCancel={handleCancel} />
        ))}
      </div>

      {showCreate && (
        <CreateBookingModal
          onClose={() => setShowCreate(false)}
          onCreated={(b) => { setBookings(prev => [b, ...prev]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}
