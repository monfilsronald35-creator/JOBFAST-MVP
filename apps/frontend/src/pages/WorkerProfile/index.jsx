import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import ReputationBadge from '../../components/ReputationBadge';
import API from '../../api/axios';

const MOCK_SAVED_JOBS = [
  { _id:'s1', title:'Elektrisyen – Batiman 5 etaj', company:'Konstriksyon HAÏTI SA', salary:'HTG 35,000', city:'Port-au-Prince' },
  { _id:'s2', title:'Plombye Senior', company:'Résidences Elite', salary:'HTG 28,000', city:'Pétion-Ville' },
];

const AVAILABILITY_OPTIONS = ['available', 'busy', 'looking', 'not_available'];
const AVAIL_CFG = {
  available:     { color:'text-green-400',  bg:'bg-green-500/10',  label:'Disponib' },
  busy:          { color:'text-amber-400',  bg:'bg-amber-500/10',  label:'Okipe' },
  looking:       { color:'text-blue-400',   bg:'bg-blue-500/10',   label:'Kap chèche' },
  not_available: { color:'text-slate-400',  bg:'bg-slate-700',     label:'Pa disponib' },
};

const TABS_DEF = [
  { id:'profile',      label:'Pwofil'     },
  { id:'portfolio',    label:'Portfolio'  },
  { id:'experience',   label:'Eksperyans' },
  { id:'documents',    label:'Dokiman'    },
  { id:'saved',        label:'Sove'       },
];

export default function WorkerProfilePage() {
  const { t }    = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab,  setTab]  = useState('profile');
  const [avail, setAvail] = useState(user?.availability || 'available');
  const [saved, setSaved] = useState(MOCK_SAVED_JOBS);

  const completedJobs = user?.stats?.totalJobs ?? 0;
  const rating        = user?.stats?.rating    ?? 0;
  const reviewCount   = user?.stats?.reviews   ?? 0;

  const avatarSrc = user?.profileMetadata?.profilePhoto
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'user')}`;

  const handleAvailabilityChange = async (a) => {
    setAvail(a);
    try { await API.put('/users/availability', { availability: a }); } catch {}
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white pb-28">

      {/* ── Profile hero ─────────────────────────────────────── */}
      <div className="relative">
        <div className="h-28 bg-gradient-to-r from-amber-600/30 via-slate-800 to-slate-900" />
        <div className="px-4 pb-4">
          <div className="flex items-end gap-3 -mt-10">
            <div className="relative">
              <img src={avatarSrc} alt={user?.name}
                className="w-20 h-20 rounded-2xl border-4 border-[#020617] object-cover shadow-2xl" />
              <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${AVAIL_CFG[avail]?.color} ${AVAIL_CFG[avail]?.bg}`}>
                ● {AVAIL_CFG[avail]?.label}
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-12">
              <h1 className="text-base font-black text-white truncate">{user?.name || 'Travayè'}</h1>
              <p className="text-xs text-amber-400 font-bold truncate">{user?.profession || '—'}</p>
            </div>
            <button type="button" onClick={() => navigate('/edit-profile')}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 shrink-0">
              ✏️ {t('worker.editProfile', { defaultValue:'Modifye' })}
            </button>
          </div>

          {/* Reputation + stats */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <ReputationBadge completedJobs={completedJobs} rating={rating} reviewCount={reviewCount} size="sm" />
            {user?.verified && (
              <span className="text-[10px] bg-blue-500/10 border border-blue-500/40 text-blue-400 px-2 py-0.5 rounded-full font-bold">✓ Verifye</span>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { icon:'✅', value:completedJobs, label:t('worker.jobsDone', { defaultValue:'Travay' }) },
              { icon:'⭐', value:rating > 0 ? Number(rating).toFixed(1) : '—', label:t('worker.rating', { defaultValue:'Nòt' }) },
              { icon:'👁', value:user?.stats?.views ?? 0, label:t('worker.views', { defaultValue:'Vizit' }) },
            ].map(s => (
              <div key={s.label} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-2.5 text-center">
                <span className="text-base">{s.icon}</span>
                <p className="text-sm font-black text-white">{s.value}</p>
                <p className="text-[9px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Availability selector */}
          <div className="mt-3">
            <p className="text-xs text-slate-400 mb-1.5">{t('worker.availability', { defaultValue:'Disponibilite' })}</p>
            <div className="flex gap-1.5">
              {AVAILABILITY_OPTIONS.map(a => (
                <button key={a} type="button" onClick={() => handleAvailabilityChange(a)}
                  className={`flex-1 py-1.5 rounded-xl text-[9px] font-bold border transition ${
                    avail === a ? `${AVAIL_CFG[a]?.color} ${AVAIL_CFG[a]?.bg} border-current` : 'text-slate-500 bg-slate-800 border-slate-700'
                  }`}>
                  {AVAIL_CFG[a]?.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="sticky top-14 z-20 bg-[#020617] px-4 pb-2 pt-1">
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth:'none' }}>
          {TABS_DEF.map(tb => (
            <button key={tb.id} type="button" onClick={() => setTab(tb.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition ${tab === tb.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              {t(`worker.tab.${tb.id}`, { defaultValue: tb.label })}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 flex-1 space-y-4 mt-2">

        {/* Profile tab */}
        {tab === 'profile' && (
          <>
            {/* Bio */}
            <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
              <p className="text-xs text-slate-400 mb-1">{t('worker.bio', { defaultValue:'Bio' })}</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {user?.profileMetadata?.bio || t('worker.noBio', { defaultValue:'Pa gen bio. Klike ✏️ pou ajoute youn.' })}
              </p>
            </div>

            {/* Skills */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">{t('worker.skills', { defaultValue:'Konpetans' })}</p>
              <div className="flex flex-wrap gap-2">
                {(user?.skills || []).length === 0 ? (
                  <p className="text-xs text-slate-500">{t('worker.noSkills', { defaultValue:'Pa gen konpetans ajoute' })}</p>
                ) : (user?.skills || []).map(s => (
                  <span key={s} className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs text-amber-300">{s}</span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">{t('worker.languages', { defaultValue:'Lang' })}</p>
              <div className="flex gap-2 flex-wrap">
                {(user?.languages || ['Kreyòl']).map(l => (
                  <span key={l} className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-300">🗣 {l}</span>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 p-3 bg-slate-800/40 border border-slate-700 rounded-xl">
              <span className="text-base">📍</span>
              <span className="text-sm text-slate-300">{user?.location?.city || user?.location?.country || t('worker.noLocation', { defaultValue:'Lokasyon pa disponib' })}</span>
            </div>

            {/* Reviews section */}
            {reviewCount > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">{t('worker.reviews', { defaultValue:'Evalyasyon' })}</p>
                <ReputationBadge completedJobs={completedJobs} rating={rating} reviewCount={reviewCount} satisfactionPct={Math.round(rating / 5 * 100)} size="card" />
              </div>
            )}
          </>
        )}

        {/* Portfolio tab */}
        {tab === 'portfolio' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">{t('worker.portfolio', { defaultValue:'Portfolio' })}</p>
              <button type="button" onClick={() => navigate('/create-post')} className="text-xs text-amber-400 font-bold">+ {t('worker.addPhoto', { defaultValue:'Ajoute Foto' })}</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(user?.portfolio || []).length === 0 ? (
                <div className="col-span-3 flex flex-col items-center py-12 gap-2">
                  <span className="text-4xl">🖼️</span>
                  <p className="text-xs text-slate-500">{t('worker.noPortfolio', { defaultValue:'Pa gen foto. Ajoute travay ou fè.' })}</p>
                </div>
              ) : (user?.portfolio || []).map((img, i) => (
                <div key={i} className="aspect-square bg-slate-800 rounded-xl overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience tab */}
        {tab === 'experience' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">{t('worker.experience', { defaultValue:'Eksperyans' })}</p>
              <button type="button" onClick={() => navigate('/edit-profile')} className="text-xs text-amber-400 font-bold">+ {t('worker.add', { defaultValue:'Ajoute' })}</button>
            </div>
            {(user?.experience || []).length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <span className="text-4xl">💼</span>
                <p className="text-xs text-slate-500">{t('worker.noExperience', { defaultValue:'Pa gen eksperyans. Ajoute istwa travay ou.' })}</p>
                <button type="button" onClick={() => navigate('/edit-profile')} className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-black rounded-xl mt-1">
                  + {t('worker.addExperience', { defaultValue:'Ajoute Eksperyans' })}
                </button>
              </div>
            ) : (user?.experience || []).map((exp, i) => (
              <div key={i} className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl mb-3">
                <p className="font-bold text-white text-sm">{exp.title}</p>
                <p className="text-xs text-amber-400">{exp.company}</p>
                <p className="text-xs text-slate-400">{exp.startDate} – {exp.endDate || 'Kounye a'}</p>
                {exp.description && <p className="text-xs text-slate-400 mt-1">{exp.description}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Documents tab */}
        {tab === 'documents' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">{t('worker.documents', { defaultValue:'Dokiman' })}</p>
              <button type="button" onClick={() => navigate('/edit-profile')} className="text-xs text-amber-400 font-bold">+ {t('worker.upload', { defaultValue:'Telechaje' })}</button>
            </div>
            {[
              { icon:'📄', label:t('worker.resume', { defaultValue:'CV / Rezime' }), status:'missing' },
              { icon:'🎓', label:t('worker.certificate', { defaultValue:'Sètifika' }), status:'missing' },
              { icon:'🪪', label:t('worker.id', { defaultValue:'Pyès Idantite' }), status:'missing' },
            ].map(d => (
              <div key={d.label} className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700 rounded-xl mb-2">
                <span className="text-xl">{d.icon}</span>
                <span className="text-sm text-slate-300 flex-1">{d.label}</span>
                {d.status === 'missing' ? (
                  <button type="button" onClick={() => navigate('/edit-profile')} className="text-xs text-amber-400 font-bold border border-amber-500/40 px-2 py-1 rounded-lg">
                    + {t('worker.add', { defaultValue:'Ajoute' })}
                  </button>
                ) : (
                  <span className="text-xs text-green-400 font-bold">✓ {t('worker.uploaded', { defaultValue:'Telechaje' })}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Saved jobs tab */}
        {tab === 'saved' && (
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-3">{t('worker.savedJobs', { defaultValue:'Travay Sove' })}</p>
            {saved.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <span className="text-4xl">🔖</span>
                <p className="text-xs text-slate-500">{t('worker.noSaved', { defaultValue:'Pa gen travay sove' })}</p>
              </div>
            ) : saved.map(job => (
              <div key={job._id} className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl mb-3">
                <p className="font-bold text-white text-sm">{job.title}</p>
                <p className="text-xs text-slate-400">{job.company}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-green-400 font-bold">{job.salary}</span>
                  <span className="text-xs text-slate-500">📍 {job.city}</span>
                  <button type="button" onClick={() => setSaved(p => p.filter(j => j._id !== job._id))}
                    className="ml-auto text-xs text-red-400 font-bold">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
