import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import ReputationBadge from '../../components/ReputationBadge';
import API from '../../api/axios';

const MOCK_PROFESSIONS = {
  electrician: {
    id: 'electrician', icon: '⚡',
    category: 'Construction', subcategory: 'Electrical',
    avgSalaryMin: 15000, avgSalaryMax: 60000, currency: 'HTG',
    description: 'Elektrisyen yo enstalè, repare ak antretni sistèm elektrik nan kay, biwo ak faktori. Yo travay ak fil, bwat elektrik, entèruptè ak sistèm solar.',
    skills: ['Enstalasyon fil', 'Bwat elektrik', 'Sistèm solar', 'Koreksyon pann', 'Kòd NFPA', 'Electricité 3 phase', 'Éclairage LED'],
    certificates: ['Licence Électricien (MTTLS)', 'Certification NFPA 70', 'Sécurité Électrique'],
    countriesHiring: [
      { flag: '🇭🇹', name: 'Haiti', jobs: 342 },
      { flag: '🇩🇴', name: 'Rep. Dom.', jobs: 89 },
      { flag: '🇺🇸', name: 'USA', jobs: 1240 },
      { flag: '🇨🇦', name: 'Canada', jobs: 456 },
      { flag: '🇫🇷', name: 'France', jobs: 234 },
    ],
    openJobs: [
      { id:'j1', company:'Konstriksyon HAÏTI SA', title:'Elektrisyen – Batiman 5 etaj', salary:'HTG 35,000/mwa', city:'Port-au-Prince', urgent:true },
      { id:'j2', company:'Solar Haïti', title:'Teknicyen Panneaux Solaires', salary:'HTG 28,000/mwa', city:'Cap-Haïtien', urgent:false },
      { id:'j3', company:'BNC Bank', title:'Elektrisyen de Maintenance', salary:'HTG 42,000/mwa', city:'Pétion-Ville', urgent:false },
    ],
    companiesHiring: [
      { name:'Konstriksyon HAÏTI SA', logo:'🏗️', jobs:12 },
      { name:'Solar Haïti', logo:'☀️', jobs:8 },
      { name:'BNC Bank', logo:'🏦', jobs:4 },
      { name:'Résidences Elite', logo:'🏠', jobs:7 },
      { name:'Hôtel Montana', logo:'🏨', jobs:3 },
    ],
    services: [
      { name:'Enstalasyon kay', price:'HTG 5,000+' },
      { name:'Koreksyon pann', price:'HTG 2,000+' },
      { name:'Enstalasyon solar', price:'HTG 25,000+' },
    ],
    training: [
      { name:'Kò Elektrisyen Nivo 1', duration:'3 mwa', provider:'INFP Haiti', cost:'Gratis' },
      { name:'Sistèm Solar Photovoltaïque', duration:'6 semèn', provider:'Solar Academy', cost:'HTG 15,000' },
    ],
    workerCount: 1842,
    satisfactionPct: 94,
  },
  plumber: {
    id: 'plumber', icon: '🔧',
    category: 'Construction', subcategory: 'Plumbing',
    avgSalaryMin: 12000, avgSalaryMax: 45000, currency: 'HTG',
    description: 'Plombye yo enstalè ak repare sistèm dlo ak egou nan kay ak bilding. Yo travay ak tuyò, robiné, ballon dlo ak sistèm chanfaj.',
    skills: ['Tuyò PVC', 'Tuyò galvanize', 'Enstalasyon saldeben', 'Chauffe-eau solaire', 'Détection fuites'],
    certificates: ['Licence Plombier (MTTLS)', 'Certification Sécurité Eau'],
    countriesHiring: [
      { flag: '🇭🇹', name: 'Haiti', jobs: 215 },
      { flag: '🇩🇴', name: 'Rep. Dom.', jobs: 67 },
      { flag: '🇺🇸', name: 'USA', jobs: 890 },
    ],
    openJobs: [
      { id:'p1', company:'Résidences Belle Vue', title:'Plombye – Rézidans Nèf', salary:'HTG 22,000/mwa', city:'Bourdon', urgent:false },
    ],
    companiesHiring: [
      { name:'Résidences Belle Vue', logo:'🏠', jobs:5 },
    ],
    services: [{ name:'Koreksyon tuyò', price:'HTG 3,000+' }],
    training: [{ name:'Plomberie Moderne', duration:'2 mwa', provider:'INFP Haiti', cost:'Gratis' }],
    workerCount: 987,
    satisfactionPct: 91,
  },
};

const DEFAULT_PROF = {
  id: 'unknown', icon: '💼',
  category: 'Général', subcategory: '',
  avgSalaryMin: 10000, avgSalaryMax: 50000, currency: 'HTG',
  description: 'Pwofesyon sa a ap bientôt gen plis enfòmasyon.',
  skills: [], certificates: [],
  countriesHiring: [{ flag: '🇭🇹', name: 'Haiti', jobs: 50 }],
  openJobs: [], companiesHiring: [], services: [], training: [],
  workerCount: 0, satisfactionPct: 0,
};

export default function ProfessionDetailPage() {
  const { professionId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [data,   setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const roleType = user?.roleType || (user?.role === 'worker' ? 'worker' : user?.role === 'service_provider' ? 'service_provider' : 'employer');

  useEffect(() => {
    setLoading(true);
    API.get(`/professions/${professionId}`)
      .then(res => setData(res?.data?.data || res?.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));

    const mock = MOCK_PROFESSIONS[professionId] || { ...DEFAULT_PROF, id: professionId };
    setTimeout(() => {
      setData(prev => prev || mock);
      setLoading(false);
    }, 600);
  }, [professionId]);

  const prof = data || DEFAULT_PROF;

  const TABS = [
    { id:'overview', label:t('profession.overview', { defaultValue:'Apèsi' }) },
    { id:'jobs',     label:t('profession.jobs',     { defaultValue:'Travay' }) },
    { id:'services', label:t('profession.services', { defaultValue:'Sèvis' }) },
    { id:'training', label:t('profession.training', { defaultValue:'Fòmasyon' }) },
  ];

  const primaryAction = () => {
    if (roleType === 'worker') navigate('/search', { state: { profession: professionId } });
    else if (roleType === 'service_provider') navigate('/provider-dashboard', { state: { tab:'create-service', profession: professionId } });
    else navigate('/post-job', { state: { profession: professionId } });
  };

  const primaryActionLabel =
    roleType === 'worker'           ? `✏️ ${t('profession.apply',         { defaultValue:'Aplike' })}`   :
    roleType === 'service_provider' ? `➕ ${t('profession.createService',  { defaultValue:'Kreye Sèvis' })}`  :
                                     `📋 ${t('profession.createJob',      { defaultValue:'Kreye Travay' })}`;

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white pb-28">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative h-44 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[100px] opacity-10 select-none">{prof.icon}</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-3xl shadow-2xl shadow-amber-500/40 shrink-0">
            {prof.icon}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-white truncate">
              {t(`registration.professions.${professionId}`, { defaultValue: professionId?.replace(/_/g, ' ') })}
            </h1>
            <p className="text-xs text-amber-400 font-bold">
              {prof.category} {prof.subcategory ? `› ${prof.subcategory}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick stats ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        {[
          { icon:'👷', value:prof.workerCount.toLocaleString(), label:t('profession.workers', { defaultValue:'Travayè' }) },
          { icon:'💼', value:prof.openJobs.length.toString(), label:t('profession.openJobs', { defaultValue:'Pòs Disponib' }) },
          { icon:'😊', value:`${prof.satisfactionPct}%`, label:t('profession.satisfaction', { defaultValue:'Satisfaksyon' }) },
        ].map(s => (
          <div key={s.label} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center">
            <span className="text-lg">{s.icon}</span>
            <p className="text-lg font-black text-white mt-0.5">{s.value}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Salary range ───────────────────────────────────────── */}
      <div className="mx-4 mb-4 p-4 bg-green-900/20 border border-green-700/40 rounded-2xl">
        <p className="text-xs text-green-400 font-bold uppercase tracking-wide mb-1">
          💰 {t('profession.avgSalary', { defaultValue:'Salè Mwayen' })}
        </p>
        <p className="text-lg font-black text-white">
          {prof.currency} {prof.avgSalaryMin.toLocaleString()} – {prof.avgSalaryMax.toLocaleString()}
          <span className="text-xs text-slate-400 font-normal"> / mwa</span>
        </p>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="sticky top-14 z-20 px-4 pb-2">
        <div className="flex gap-1 bg-slate-800/60 p-0.5 rounded-xl">
          {TABS.map(tb => (
            <button key={tb.id} type="button" onClick={() => setTab(tb.id)}
              className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition ${tab === tb.id ? 'bg-[#0d1526] text-white' : 'text-slate-400'}`}>
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────── */}
      <div className="px-4 space-y-4 flex-1">

        {/* Overview */}
        {tab === 'overview' && (
          <>
            {/* Description */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">{t('profession.description', { defaultValue:'Deskripsyon' })}</p>
              <p className="text-sm text-slate-300 leading-relaxed">{prof.description}</p>
            </div>

            {/* Skills */}
            {prof.skills.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">{t('profession.skills', { defaultValue:'Konpetans' })}</p>
                <div className="flex flex-wrap gap-2">
                  {prof.skills.map(s => (
                    <span key={s} className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs text-amber-300 font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Certificates */}
            {prof.certificates.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">{t('profession.certificates', { defaultValue:'Sètifika' })}</p>
                <div className="space-y-2">
                  {prof.certificates.map(c => (
                    <div key={c} className="flex items-center gap-2 p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/40">
                      <span className="text-base">🎓</span>
                      <span className="text-xs text-slate-300">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Countries hiring */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">{t('profession.countriesHiring', { defaultValue:'Peyi k ap Rekrite' })}</p>
              <div className="space-y-2">
                {prof.countriesHiring.map(c => (
                  <div key={c.name} className="flex items-center gap-3 p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/40">
                    <span className="text-xl shrink-0">{c.flag}</span>
                    <span className="text-sm text-white flex-1">{c.name}</span>
                    <span className="text-xs font-bold text-amber-400">{c.jobs} travay</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Companies hiring */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">{t('profession.companiesHiring', { defaultValue:'Konpayi k ap Rekrite' })}</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {prof.companiesHiring.map(c => (
                  <div key={c.name} className="shrink-0 flex flex-col items-center gap-1.5 p-3 bg-slate-800/60 rounded-xl border border-slate-700/40 min-w-[80px]">
                    <span className="text-2xl">{c.logo}</span>
                    <span className="text-[9px] text-slate-300 text-center leading-tight max-w-[70px] truncate">{c.name}</span>
                    <span className="text-[9px] font-bold text-amber-400">{c.jobs} pòs</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Jobs */}
        {tab === 'jobs' && (
          <>
            {prof.openJobs.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <span className="text-4xl">💼</span>
                <p className="text-slate-400 text-sm">{t('profession.noJobs', { defaultValue:'Pa gen travay disponib kounye a' })}</p>
              </div>
            ) : prof.openJobs.map(job => (
              <div key={job.id} className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-white">{job.title}</p>
                    <p className="text-xs text-slate-400">{job.company}</p>
                  </div>
                  {job.urgent && <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full font-bold">🔥 Ijan</span>}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs text-green-400 font-bold">{job.salary}</span>
                  <span className="text-xs text-slate-500">📍 {job.city}</span>
                </div>
                {roleType === 'worker' && (
                  <button type="button" onClick={() => navigate('/search', { state: { jobId: job.id } })}
                    className="mt-3 w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black">
                    ✏️ {t('profession.apply', { defaultValue:'Aplike' })}
                  </button>
                )}
              </div>
            ))}
          </>
        )}

        {/* Services */}
        {tab === 'services' && (
          <>
            {prof.services.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <span className="text-4xl">🤝</span>
                <p className="text-slate-400 text-sm">{t('profession.noServices', { defaultValue:'Pa gen sèvis disponib' })}</p>
              </div>
            ) : prof.services.map(s => (
              <div key={s.name} className="flex items-center justify-between p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-white">{s.name}</p>
                  <p className="text-xs text-green-400 font-bold">{s.price}</p>
                </div>
                {roleType !== 'service_provider' && (
                  <button type="button" onClick={() => navigate('/booking', { state: { service: s.name, profession: professionId } })}
                    className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-black rounded-xl">
                    {t('profession.book', { defaultValue:'Rezève' })}
                  </button>
                )}
              </div>
            ))}
          </>
        )}

        {/* Training */}
        {tab === 'training' && (
          <>
            {prof.training.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <span className="text-4xl">🎓</span>
                <p className="text-slate-400 text-sm">{t('profession.noTraining', { defaultValue:'Pa gen fòmasyon disponib' })}</p>
              </div>
            ) : prof.training.map(tr => (
              <div key={tr.name} className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
                <p className="text-sm font-bold text-white mb-1">{tr.name}</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { icon:'⏱', val:tr.duration },
                    { icon:'🏫', val:tr.provider },
                    { icon:'💰', val:tr.cost },
                  ].map(d => (
                    <div key={d.icon} className="text-center p-2 bg-slate-800/60 rounded-xl">
                      <span className="text-sm">{d.icon}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{d.val}</p>
                    </div>
                  ))}
                </div>
                <button type="button" className="mt-3 w-full py-2 rounded-xl border border-amber-500/40 text-amber-400 text-xs font-bold">
                  {t('profession.learnMore', { defaultValue:'Aprann Plis' })}
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── Sticky CTA ──────────────────────────────────────────── */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-[#020617] to-transparent pt-8">
        <button type="button" onClick={primaryAction}
          className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-2xl shadow-amber-500/30">
          {primaryActionLabel}
        </button>
      </div>
    </div>
  );
}
