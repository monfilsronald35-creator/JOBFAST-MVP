import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import ReputationBadge from '../../components/ReputationBadge';
import API from '../../api/axios';

const MOCK_SERVICES = [
  { _id:'sv1', name:'Enstalasyon Elektrik Kay', category:'Elektrisite', price:5000, unit:'pa travay', active:true, bookings:24, rating:4.8 },
  { _id:'sv2', name:'Koreksyon Pann Elektrik', category:'Elektrisite', price:2000, unit:'pa vizit', active:true, bookings:51, rating:4.9 },
  { _id:'sv3', name:'Enstalasyon Panneaux Solaires', category:'Elektrisite', price:35000, unit:'konplè', active:false, bookings:8, rating:4.7 },
];

const MOCK_BOOKINGS = [
  { _id:'b1', client:'Marie Dupont', service:'Enstalasyon Elektrik Kay', date:'2026-07-15', time:'09:00', status:'confirmed', amount:5000 },
  { _id:'b2', client:'Jean-Robert P.', service:'Koreksyon Pann Elektrik', date:'2026-07-12', time:'14:00', status:'pending', amount:2000 },
  { _id:'b3', client:'Claudette M.', service:'Koreksyon Pann Elektrik', date:'2026-07-10', time:'10:00', status:'completed', amount:2000 },
];

const MOCK_REVIEWS = [
  { _id:'r1', client:'Marie D.', rating:5, comment:'Travay parfè! Pwòp ak rapid.', date:'2026-07-09' },
  { _id:'r2', client:'Jean-Robert P.', rating:4, comment:'Bon travay, te fini nan tan.', date:'2026-07-05' },
];

const STATUS_CFG = {
  pending:   { color:'text-amber-400',  bg:'bg-amber-500/10',  label:'Kap tann' },
  confirmed: { color:'text-blue-400',   bg:'bg-blue-500/10',   label:'Konfime'  },
  completed: { color:'text-green-400',  bg:'bg-green-500/10',  label:'Fini'     },
  cancelled: { color:'text-red-400',    bg:'bg-red-500/10',    label:'Anile'    },
};

const TABS = [
  { id:'overview',  label:'Apèsi'   },
  { id:'services',  label:'Sèvis'   },
  { id:'bookings',  label:'Rezèvas' },
  { id:'customers', label:'Kliyan'  },
  { id:'ratings',   label:'Nòt'     },
  { id:'media',     label:'Medya'   },
];

// ── CreateServiceModal ────────────────────────────────────────
function CreateServiceModal({ onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name:'', category:'', price:'', unit:'pa travay', description:'', active:true });
  const set = (k, v) => setForm(p => ({ ...p, [k]:v }));

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div className="relative w-full bg-[#0d1526] rounded-t-3xl p-5 pb-10 z-10 max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
        <h3 className="text-base font-black text-white mb-4">
          ➕ {t('provider.createService', { defaultValue:'Kreye Sèvis' })}
        </h3>
        <div className="space-y-3">
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={t('provider.serviceName', { defaultValue:'Non sèvis la…' })}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
          <input value={form.category} onChange={e => set('category', e.target.value)} placeholder={t('provider.category', { defaultValue:'Kategori…' })}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
          <div className="flex gap-2">
            <input value={form.price} onChange={e => set('price', e.target.value)} placeholder="Prix" type="number"
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
            <select value={form.unit} onChange={e => set('unit', e.target.value)}
              className="flex-1 px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
              <option value="pa travay">pa travay</option>
              <option value="pa èdtan">pa èdtan</option>
              <option value="pa jou">pa jou</option>
              <option value="konplè">konplè</option>
              <option value="pa vizit">pa vizit</option>
            </select>
          </div>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            placeholder={t('provider.description', { defaultValue:'Deskripsyon sèvis la…' })}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none" />
          <button type="button" onClick={() => { onSave(form); onClose(); }}
            className="w-full py-4 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm">
            ✅ {t('provider.publishService', { defaultValue:'Pibliye Sèvis' })}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ServiceProviderDashboard() {
  const { t }    = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab]       = useState('overview');
  const [services, setServices] = useState(MOCK_SERVICES);
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [showCreate, setShowCreate] = useState(false);

  const completedJobs = user?.stats?.totalJobs ?? 0;
  const rating        = user?.stats?.rating    ?? 0;
  const reviewCount   = user?.stats?.reviews   ?? 0;

  const totalEarnings = bookings
    .filter(b => b.status === 'completed')
    .reduce((s, b) => s + b.amount, 0);

  const avatarSrc = user?.profileMetadata?.profilePhoto
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'sp')}`;

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white pb-28">

      {/* ── Header card ──────────────────────────────────────── */}
      <div className="p-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-800 p-5 shadow-2xl">
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
          <div className="flex items-center gap-3 relative z-10">
            <img src={avatarSrc} alt={user?.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-xl" />
            <div className="min-w-0">
              <p className="font-black text-white text-base truncate">{user?.name || 'Provider'}</p>
              <p className="text-blue-200 text-xs truncate">{user?.profession || 'Prestatè Sèvis'}</p>
              <ReputationBadge completedJobs={completedJobs} rating={rating} reviewCount={reviewCount} size="xs" />
            </div>
            <button type="button" onClick={() => navigate('/edit-profile')}
              className="ml-auto text-white/70 text-xs">✏️</button>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 relative z-10">
            {[
              { icon:'🛠', value:services.filter(s => s.active).length, label:t('provider.activeServices', { defaultValue:'Sèvis Aktif' }) },
              { icon:'📅', value:bookings.filter(b => b.status === 'pending').length, label:t('provider.pendingBookings', { defaultValue:'Rezèvas' }) },
              { icon:'💰', value:`HTG ${totalEarnings.toLocaleString()}`, label:t('provider.earned', { defaultValue:'Gagnen' }) },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-2xl p-2.5 text-center">
                <span className="text-lg">{s.icon}</span>
                <p className="text-sm font-black text-white mt-0.5">{s.value}</p>
                <p className="text-[9px] text-blue-200 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="sticky top-14 z-20 px-4 pb-2">
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth:'none' }}>
          {TABS.map(tb => (
            <button key={tb.id} type="button" onClick={() => setTab(tb.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition ${tab === tb.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              {t(`provider.tab.${tb.id}`, { defaultValue:tb.label })}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 flex-1 space-y-4 mt-2">

        {/* Overview */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon:'📊', label:t('provider.totalBookings', { defaultValue:'Total Rezèvas' }), value:bookings.length },
                { icon:'⭐', label:t('provider.avgRating', { defaultValue:'Nòt Mwayen' }), value:rating > 0 ? Number(rating).toFixed(1) : '—' },
                { icon:'✅', label:t('provider.completed', { defaultValue:'Fini' }), value:bookings.filter(b => b.status === 'completed').length },
                { icon:'🔄', label:t('provider.repeatClients', { defaultValue:'Kliyan Fidèl' }), value:'12%' },
              ].map(s => (
                <div key={s.label} className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
                  <span className="text-2xl">{s.icon}</span>
                  <p className="text-xl font-black text-white mt-2">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">{t('provider.recentBookings', { defaultValue:'Rezèvas Resan' })}</p>
              {bookings.slice(0,3).map(b => {
                const cfg = STATUS_CFG[b.status] || STATUS_CFG.pending;
                return (
                  <div key={b._id} className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700 rounded-xl mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{b.client}</p>
                      <p className="text-xs text-slate-400 truncate">{b.service}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-white">HTG {b.amount.toLocaleString()}</p>
                      <p className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Services */}
        {tab === 'services' && (
          <>
            <button type="button" onClick={() => setShowCreate(true)}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2">
              ➕ {t('provider.createService', { defaultValue:'Kreye Nouvo Sèvis' })}
            </button>
            {services.map(sv => (
              <div key={sv._id} className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{sv.name}</p>
                    <p className="text-xs text-slate-400">{sv.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sv.active ? 'text-green-400 bg-green-500/10 border-green-500/40' : 'text-slate-400 bg-slate-700 border-slate-600'}`}>
                      {sv.active ? 'Aktif' : 'Inaktif'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center p-2 bg-slate-800/60 rounded-xl">
                    <p className="text-sm font-black text-amber-400">HTG {sv.price.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-500">{sv.unit}</p>
                  </div>
                  <div className="text-center p-2 bg-slate-800/60 rounded-xl">
                    <p className="text-sm font-black text-white">{sv.bookings}</p>
                    <p className="text-[9px] text-slate-500">Rezèvas</p>
                  </div>
                  <div className="text-center p-2 bg-slate-800/60 rounded-xl">
                    <p className="text-sm font-black text-white">⭐{sv.rating}</p>
                    <p className="text-[9px] text-slate-500">Nòt</p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Bookings */}
        {tab === 'bookings' && (
          <>
            {bookings.map(b => {
              const cfg = STATUS_CFG[b.status] || STATUS_CFG.pending;
              return (
                <div key={b._id} className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-white">{b.client}</p>
                      <p className="text-xs text-slate-400">{b.service}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">📅 {b.date} {b.time}</span>
                    <span className="text-xs font-bold text-white ml-auto">HTG {b.amount.toLocaleString()}</span>
                  </div>
                  {b.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button type="button" onClick={() => setBookings(p => p.map(x => x._id === b._id ? { ...x, status:'confirmed' } : x))}
                        className="flex-1 py-2 rounded-xl bg-green-500 text-white text-xs font-bold">✅ Konfime</button>
                      <button type="button" onClick={() => setBookings(p => p.map(x => x._id === b._id ? { ...x, status:'cancelled' } : x))}
                        className="flex-1 py-2 rounded-xl border border-red-500/40 text-red-400 text-xs font-bold">✕ Refize</button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Customers */}
        {tab === 'customers' && (
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">{t('provider.customers', { defaultValue:'Kliyan' })}</p>
            {[...new Map(bookings.map(b => [b.client, b])).values()].map(b => (
              <div key={b.client} className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700 rounded-xl mb-2">
                <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-sm font-black text-slate-300 shrink-0">
                  {b.client.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{b.client}</p>
                  <p className="text-xs text-slate-400">{bookings.filter(x => x.client === b.client).length} rezèvasyon</p>
                </div>
                <button type="button" onClick={() => navigate('/chat')}
                  className="text-xs text-amber-400 font-bold border border-amber-500/40 px-2 py-1 rounded-lg">💬</button>
              </div>
            ))}
          </div>
        )}

        {/* Ratings */}
        {tab === 'ratings' && (
          <>
            <ReputationBadge completedJobs={completedJobs} rating={rating} reviewCount={reviewCount} satisfactionPct={Math.round(rating / 5 * 100)} size="card" />
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">{t('provider.recentReviews', { defaultValue:'Dènye Evalyasyon' })}</p>
              {MOCK_REVIEWS.map(r => (
                <div key={r._id} className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-white">{r.client}</span>
                    <span className="ml-auto text-xs text-amber-400 font-bold">{'⭐'.repeat(r.rating)}</span>
                  </div>
                  <p className="text-sm text-slate-300 italic">"{r.comment}"</p>
                  <p className="text-xs text-slate-500 mt-1">{r.date}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Media */}
        {tab === 'media' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">{t('provider.photos', { defaultValue:'Foto & Videyo' })}</p>
              <button type="button" onClick={() => navigate('/create-post')} className="text-xs text-amber-400 font-bold">+ {t('provider.addMedia', { defaultValue:'Ajoute' })}</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(user?.portfolio || []).length === 0 ? (
                <div className="col-span-3 flex flex-col items-center py-10 gap-2">
                  <span className="text-4xl">📸</span>
                  <p className="text-xs text-slate-500">{t('provider.noMedia', { defaultValue:'Ajoute foto travay ou fè' })}</p>
                </div>
              ) : (user?.portfolio || []).map((img, i) => (
                <div key={i} className="aspect-square bg-slate-800 rounded-xl overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateServiceModal
          onClose={() => setShowCreate(false)}
          onSave={svc => setServices(p => [{ _id:`sv${Date.now()}`, ...svc, price:Number(svc.price), bookings:0, rating:0 }, ...p])}
        />
      )}
    </div>
  );
}
