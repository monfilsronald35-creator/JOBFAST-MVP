import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllJobs } from '../../services/jobs';
import {
  Search, SlidersHorizontal, X, ChevronRight, MapPin,
  Bookmark, Share2, MessageSquare, Phone, Building2,
  WifiOff, RefreshCcw, CheckCircle, Flag, Users,
  Calendar, Globe, Zap, Gem,
} from 'lucide-react';

const BG = '#050B18'; const CARD = '#111827'; const BORDER = '#1F2937'; const GOLD = '#FACC15';

// ── 13 tabs ─────────────────────────────────────────────────────
const JOB_TABS = [
  { id: 'search',       icon: '🔍', label: 'Search'       },
  { id: 'saved',        icon: '🔖', label: 'Saved'        },
  { id: 'applied',      icon: '✅', label: 'Applied'      },
  { id: 'interviews',   icon: '🗓', label: 'Interviews'   },
  { id: 'offers',       icon: '📄', label: 'Offers'       },
  { id: 'contracts',    icon: '📋', label: 'Contracts'    },
  { id: 'certificates', icon: '🏆', label: 'Certificates' },
  { id: 'history',      icon: '📅', label: 'History'      },
  { id: 'ai',           icon: '✨', label: 'AI Picks'     },
  { id: 'nearby',       icon: '📍', label: 'Nearby'       },
  { id: 'remote',       icon: '🌐', label: 'Remote'       },
  { id: 'urgent',       icon: '⚡', label: 'Urgent'       },
  { id: 'premium',      icon: '💎', label: 'Premium'      },
];

const FILTER_CHIPS = [
  { id: 'fulltime', label: 'Tan Plen'    },
  { id: 'parttime', label: 'Tan Pasyèl' },
  { id: 'remote',   label: '🌐 Remote'  },
  { id: 'urgent',   label: '⚡ Ijan'    },
  { id: 'premium',  label: '💎 Premium' },
  { id: 'verified', label: '✓ Verifye'  },
  { id: 'ai',       label: '✨ AI Match'},
];

const SORT_OPTIONS = [
  { id: 'recent', label: 'Pi Resan'    },
  { id: 'salary', label: 'Salè ↑'     },
  { id: 'match',  label: 'Match %'    },
  { id: 'slots',  label: 'Plas lib'   },
];

const DETAIL_TABS = ['Description', 'Requirements', 'Benefits', 'Schedule'];

// ── Mock data ────────────────────────────────────────────────────
const BASE_JOBS = [
  {
    id: 'j1', title: 'Elektrisyen Senior', company: 'ABC Construction',
    city: 'Punta Cana', country: 'DR', salary: '$900/sem', type: 'Tan Plen',
    urgent: true, premium: false, remote: false, verified: true, match: 92,
    posted: '2h', applicants: 12, slots: 25, distance: '2.1 km',
    description: 'Nou ap chèche yon Elektrisyen Senior eksperyanse pou travay sou sit konstriksyon nou yo nan Punta Cana. Pòs sa a ofri yon bon salè ak avantaj ekselan pou kandida ki kwalifye.',
    requirements: ['5+ ane eksperyans elektrik', 'Lisans Elektrisyen nasyonal', 'Kapasite travay solo', 'Disponib imedyatman', 'Motosiklèt oswa vwati'],
    benefits: ['Asirans sante konplè', 'Transpò gratis soti lakay', '2 semèn vakans peye/an', 'Bonis pèfòmans trimestriyèl', 'Fòmasyon kontinyèl'],
    schedule: 'Lendi–Samdi · 7h AM–5h PM · 48h/sem',
    languages: ['Kreyòl Ayisyen', 'Espayòl'],
  },
  {
    id: 'j2', title: 'Chef Kuyinye Entènasyonal', company: 'Hotel Barceló',
    city: 'Bávaro', country: 'DR', salary: '$1,200/sem', type: 'Tan Plen',
    urgent: false, premium: true, remote: false, verified: true, match: 88,
    posted: '5h', applicants: 8, slots: 3, distance: '8.4 km',
    description: 'Hotel Barceló Bávaro 5 etwal ap rekrite Chef Kuyinye Entènasyonal pou mennen ekip gastronomie 30 moun. Pòs prensipal nan yon hotel mondyal.',
    requirements: ['3+ ane chef ekspèryans', 'Diplòm Gastronomie rekonèt', 'Konn kwizin: Fransè, Italyèn, Karibeyen', 'Lide inovatif', 'Lidèchip'],
    benefits: ['Repas gratis sou sit', 'Lojman disponib (opsyonèl)', 'Bonis anyèl 15%', 'Fòmasyon entènasyonal', 'Asirans sante fanmi'],
    schedule: 'Woulman 3 ekip · 8h/woulman · 5j/sem',
    languages: ['Kreyòl', 'Fransè', 'Espayòl'],
  },
  {
    id: 'j3', title: 'Chofè Pwofesyonèl', company: 'Universal Transport',
    city: 'Santo Domingo', country: 'DR', salary: '$750/sem', type: 'Tan Plen',
    urgent: true, premium: false, remote: false, verified: true, match: 85,
    posted: '1j', applicants: 22, slots: 10, distance: '45 km',
    description: 'Nou bezwen chofè pwofesyonèl pou transpò touris VIP ak kliyan kòporatif nan Santo Domingo ak Punta Cana.',
    requirements: ['Lisans chofè valide', '3+ ane eksperyans', 'Rekò konduit pwòp', 'Konn wout kapital', 'Bon esteti'],
    benefits: ['Vwati konpayi fourni', 'Asirans aksidan', 'Bwason gratis', 'Kòmisyon pourbwa'],
    schedule: 'Flexible 6h–18h · 6j/sem',
    languages: ['Kreyòl', 'Espayòl'],
  },
  {
    id: 'j4', title: 'Devlopè Web Full Stack', company: 'TechCaribe Solutions',
    city: 'Remote', country: 'Global', salary: '$2,500/mwa', type: 'Tan Plen',
    urgent: false, premium: true, remote: true, verified: true, match: 79,
    posted: '3j', applicants: 45, slots: 5, distance: null,
    description: 'TechCaribe ap chèche Devlopè Full Stack pou bati aplikasyon pou dyaspora Ayisyen ak karibeyen. Travay 100% remote, salè USD.',
    requirements: ['React + Node.js (3+ ane)', 'PostgreSQL / MongoDB', 'Portfolio solid sou GitHub', 'Anglè ak Fransè ekri'],
    benefits: ['Salè USD transfe direk', '100% Remote', 'Ekipman laptop fourni', 'Vakans ilimite', 'Stock options'],
    schedule: '9h–17h EST · Flexible · 5j/sem',
    languages: ['Kreyòl', 'Anglè', 'Fransè'],
  },
  {
    id: 'j5', title: 'Enfimyè Dijans', company: 'Clinique St-Luc',
    city: 'Pòtoprens', country: 'Haiti', salary: '$600/sem', type: 'Tan Plen',
    urgent: true, premium: false, remote: false, verified: false, match: 74,
    posted: '12h', applicants: 31, slots: 15, distance: '1.3 km',
    description: 'Clinique St-Luc bezwen Enfimyè pou seksyon ijans ak konsiltasyon. Pozisyon ki vital pou sante kominote a.',
    requirements: ['Diplòm Enfimyè rekonèt', 'Anrejistreman OIIH', 'Min. 2 ane klinik', 'Kontwòl emosyon nan presyon', 'Diponib woulman'],
    benefits: ['Asirans sante', 'Inifòm fourni', 'Fòmasyon kontinyèl', 'Avanse karyè'],
    schedule: 'Woulman 8h · 3 ekip · 24/7',
    languages: ['Kreyòl', 'Fransè'],
  },
  {
    id: 'j6', title: 'Manadjè Otèl 5 Etwal', company: 'Hotel Montana',
    city: 'Pòtoprens', country: 'Haiti', salary: '$1,800/mwa', type: 'Tan Plen',
    urgent: false, premium: true, remote: false, verified: true, match: 71,
    posted: '4j', applicants: 7, slots: 1, distance: '3.8 km',
    description: 'Hotel Montana ap rekrite yon Manadjè Jeneral eksperyanse pou dirije operasyon tout jounen.',
    requirements: ['Diplòm Administrasyon Otèl', '5+ ane manadjman otèl', 'Revenue Management', 'Trileng FR/EN/HT', 'Lidèchip pwovèt'],
    benefits: ['Lojman sou sit', 'Manje gratis', 'Bonis 15% pèfòmans', 'Vwati sèvis', 'Vakans peye lèt'],
    schedule: 'Lendi–Vandredi + Disponib pou ijans',
    languages: ['Kreyòl', 'Fransè', 'Anglè'],
  },
];

function getTabJobs(tab, all) {
  switch (tab) {
    case 'search':       return all;
    case 'saved':        return all.slice(0, 3);
    case 'applied':      return all.slice(0, 3);
    case 'interviews':   return all.slice(3, 4);
    case 'offers':       return all.slice(1, 2);
    case 'contracts':    return all.slice(0, 2);
    case 'certificates': return [];
    case 'history':      return all.slice(4, 6);
    case 'ai':           return [...all].sort((a, b) => b.match - a.match);
    case 'nearby':       return all.filter(j => j.distance && !j.remote);
    case 'remote':       return all.filter(j => j.remote);
    case 'urgent':       return all.filter(j => j.urgent);
    case 'premium':      return all.filter(j => j.premium);
    default:             return all;
  }
}

const TAB_EMPTY = {
  search:       { icon: '🔍', title: 'Pa gen rezilta',        body: 'Chanje filtè ou yo oswa eseye mo kle diferan.' },
  saved:        { icon: '🔖', title: 'Pa gen djòb sove',      body: 'Peze ikon bookmark pou sove djòb ou renmen yo.' },
  applied:      { icon: '✅', title: 'Ou pa aplike ankò',     body: 'Aplike sou yon djòb pou wè estati ou isit.' },
  interviews:   { icon: '🗓', title: 'Pa gen entèvyou',       body: 'Lè konpayi yo envite ou, ou pral wè yo isit.' },
  offers:       { icon: '📄', title: 'Pa gen ofè',            body: 'Ofè djòb ou yo pral parèt isit.' },
  contracts:    { icon: '📋', title: 'Pa gen kontra',         body: 'Kontra aktif ou yo pral wè isit.' },
  certificates: { icon: '🏆', title: 'Pa gen sètifika',       body: 'Ranpli tès ak fòmasyon pou genyen sètifika.' },
  history:      { icon: '📅', title: 'Pa gen istwa',          body: 'Djòb ou te fini yo pral parèt isit.' },
  ai:           { icon: '✨', title: 'AI ap analize...',      body: 'Ranpli profil ou pou jwenn rekòmandasyon.'  },
  nearby:       { icon: '📍', title: 'Pa gen djòb toupre',    body: 'Aktive lokalizasyon pou wè djòb toupre ou.' },
  remote:       { icon: '🌐', title: 'Pa gen djòb remote',    body: 'Djòb 100% a distans yo pral parèt isit.' },
  urgent:       { icon: '⚡', title: 'Pa gen djòb ijan',      body: 'Konpayi k ap chèche kandida imedyatman.' },
  premium:      { icon: '💎', title: 'Pa gen djòb premium',   body: 'Djòb elit ak salè elve pral wè isit.' },
};

// ── Skeleton card ────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse px-4 py-4 flex items-center gap-3">
      <div className="w-12 h-12 rounded-[14px] shrink-0" style={{ background: BORDER }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 rounded-full w-3/4" style={{ background: BORDER }} />
        <div className="h-2 rounded-full w-1/2" style={{ background: BORDER }} />
        <div className="flex gap-1.5 mt-1">
          <div className="h-4 w-14 rounded-full" style={{ background: BORDER }} />
          <div className="h-4 w-16 rounded-full" style={{ background: BORDER }} />
        </div>
      </div>
      <div className="w-14 h-8 rounded-xl shrink-0" style={{ background: BORDER }} />
    </div>
  );
}

// ── Status badge for Applied tab ─────────────────────────────────
const STATUS_META = {
  'Application Sent':      { color: '#6366f1', label: 'Voye'         },
  'Under Review':          { color: '#f59e0b', label: 'An Revizyon'  },
  'Shortlisted':           { color: '#10b981', label: 'Choisi'       },
  'Interview Scheduled':   { color: '#06b6d4', label: 'Entèvyou'    },
  'Offer Received':        { color: GOLD,      label: 'Ofè Resevwa' },
  'Rejected':              { color: '#ef4444', label: 'Refize'       },
  'Hired':                 { color: '#10b981', label: 'Anplwaye'     },
};

const APPLIED_STATUS = ['Application Sent', 'Under Review', 'Interview Scheduled'];

// ── Compact job row ──────────────────────────────────────────────
function JobRow({ job, tab, onOpen, saved, onToggleSave }) {
  const statusMeta = tab === 'applied' ? STATUS_META[APPLIED_STATUS[BASE_JOBS.indexOf(job) % 3]] : null;
  const photo = job.company
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(job.company)}&backgroundColor=1e293b`
    : `https://api.dicebear.com/7.x/initials/svg?seed=J&backgroundColor=1e293b`;

  return (
    <div onClick={() => onOpen(job)}
      className="flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors hover:bg-white/[0.015] active:bg-white/[0.025]"
      style={{ WebkitTapHighlightColor: 'transparent' }}>

      <div className="relative shrink-0">
        <img src={photo} alt={job.company}
          className="w-12 h-12 rounded-[14px] object-cover border"
          style={{ borderColor: BORDER, background: CARD }}
          onError={e => { e.currentTarget.src = 'https://api.dicebear.com/7.x/initials/svg?seed=J'; }} />
        {job.verified && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2"
            style={{ background: '#10b981', borderColor: CARD }}>
            <CheckCircle className="w-2.5 h-2.5 text-white" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="text-[13px] font-black text-white truncate leading-tight">{job.title}</p>
          {tab === 'ai' && (
            <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}30` }}>
              {job.match}%
            </span>
          )}
          {tab === 'urgent' && <Zap className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
          {tab === 'premium' && <Gem className="w-3.5 h-3.5 shrink-0" style={{ color: GOLD }} />}
          {tab === 'remote' && <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
        </div>
        <p className="text-[11px] text-slate-400 truncate mt-0.5">
          {job.company}{job.city ? ` · ${job.city}` : ''}
          {tab === 'nearby' && job.distance ? ` · ${job.distance}` : ''}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="text-[9px] rounded-lg px-1.5 py-0.5 font-medium"
            style={{ background: BORDER, color: '#94a3b8' }}>{job.type}</span>
          {job.salary && <span className="text-[9px] font-black" style={{ color: GOLD }}>{job.salary}</span>}
          {statusMeta && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: `${statusMeta.color}20`, color: statusMeta.color }}>
              {statusMeta.label}
            </span>
          )}
          {tab === 'contracts' && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-emerald-400"
              style={{ background: '#10b98120' }}>Actif</span>
          )}
          {tab === 'history' && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-slate-500"
              style={{ background: BORDER }}>Konplete</span>
          )}
          {tab === 'offers' && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: `${GOLD}20`, color: GOLD }}>Nou ofè: {job.salary}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <button type="button" onClick={e => { e.stopPropagation(); onToggleSave(job.id); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all"
          style={saved
            ? { background: `${GOLD}20`, borderColor: `${GOLD}50`, color: GOLD }
            : { background: 'transparent', borderColor: BORDER, color: '#475569' }}>
          <Bookmark className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} />
        </button>
        {tab === 'interviews' ? (
          <span className="text-[9px] font-black text-cyan-400 text-right">Vandredi 18 Jiyè</span>
        ) : tab === 'offers' ? (
          <button type="button" onClick={e => { e.stopPropagation(); onOpen(job); }}
            className="text-[9px] font-black px-2 py-1 rounded-lg transition-all active:scale-95"
            style={{ background: `${GOLD}`, color: BG }}>
            Aksepte
          </button>
        ) : (
          <button type="button" onClick={e => { e.stopPropagation(); onOpen(job); }}
            className="text-[10px] font-black px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
            style={{ background: GOLD, color: BG }}>
            Wè
          </button>
        )}
      </div>
    </div>
  );
}

// ── Certificate card ─────────────────────────────────────────────
function CertCard({ cert }) {
  return (
    <div className="px-4 py-4 flex items-center gap-3">
      <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl shrink-0"
        style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30` }}>
        {cert.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-black text-white">{cert.name}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{cert.issuer} · {cert.date}</p>
      </div>
      <span className="text-[9px] font-black px-2 py-1 rounded-full"
        style={{ background: '#10b98120', color: '#10b981' }}>Valide</span>
    </div>
  );
}

const MOCK_CERTS = [
  { id: 'c1', icon: '⚡', name: 'Sètifika Elektrisyen Nivo 2', issuer: 'INFP Haiti', date: 'Jen 2025' },
  { id: 'c2', icon: '🔧', name: 'Plombri & Sanitasyon', issuer: 'OFATMA', date: 'Jan 2025' },
  { id: 'c3', icon: '🏗',  name: 'Sekirite Konstriksyon', issuer: 'MTPTC', date: 'Nov 2024' },
];

// ── Job Detail bottom sheet ──────────────────────────────────────
function JobDetailSheet({ job, onClose, navigate, saved, onToggleSave }) {
  const [detailTab, setDetailTab] = useState('Description');
  const [applied, setApplied]     = useState(false);
  const sheetRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!job) return null;

  const photo = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(job.company || 'J')}&backgroundColor=1e293b`;
  const pct = Math.round((job.applicants / job.slots) * 100);

  const ACTION_BTNS = [
    { icon: '💬', label: 'Message', action: () => navigate('/chat')    },
    { icon: '📞', label: 'Appèl',   action: () => navigate('/chat')    },
    { icon: '🏢', label: 'Konpayi', action: () => navigate('/search')  },
    { icon: '🔗', label: 'Pataje',  action: () => navigator.share?.({ title: job.title, text: job.company, url: window.location.href }).catch(() => {}) },
    { icon: '🔍', label: 'Similè',  action: () => { onClose(); navigate('/jobs'); } },
    { icon: '🚩', label: 'Rapòte',  action: () => {}                   },
  ];

  const tabContent = {
    Description:  <p className="text-[13px] text-slate-300 leading-relaxed">{job.description}</p>,
    Requirements: (
      <ul className="space-y-2">
        {job.requirements.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] text-slate-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />{r}
          </li>
        ))}
      </ul>
    ),
    Benefits: (
      <ul className="space-y-2">
        {job.benefits.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] text-slate-300">
            <span className="text-base shrink-0">✅</span>{b}
          </li>
        ))}
      </ul>
    ),
    Schedule: (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-[14px]" style={{ background: BORDER }}>
          <span className="text-xl">🕐</span>
          <div>
            <p className="text-[12px] font-black text-white">Orè</p>
            <p className="text-[12px] text-slate-400">{job.schedule}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-[14px]" style={{ background: BORDER }}>
          <span className="text-xl">🌐</span>
          <div>
            <p className="text-[12px] font-black text-white">Lang</p>
            <p className="text-[12px] text-slate-400">{job.languages.join(' · ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-[14px]" style={{ background: BORDER }}>
          <span className="text-xl">👥</span>
          <div>
            <p className="text-[12px] font-black text-white">Plas</p>
            <p className="text-[12px] text-slate-400">{job.applicants} kandida / {job.slots} plas total</p>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div ref={sheetRef}
        className="w-full max-h-[90vh] overflow-y-auto rounded-t-[28px] pb-8"
        style={{ background: CARD, boxShadow: '0 -20px 60px rgba(0,0,0,0.5)' }}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: BORDER }} />
        </div>

        {/* Close */}
        <div className="flex items-center justify-between px-4 pb-3">
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: BORDER, color: '#94a3b8' }}>
            <X className="w-4 h-4" />
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={() => onToggleSave(job.id)}
              className="w-8 h-8 rounded-full flex items-center justify-center border transition-all"
              style={saved
                ? { background: `${GOLD}20`, borderColor: `${GOLD}40`, color: GOLD }
                : { background: 'transparent', borderColor: BORDER, color: '#64748b' }}>
              <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button type="button"
              onClick={() => navigator.share?.({ title: job.title, text: `${job.company} · ${job.salary}`, url: window.location.href }).catch(() => {})}
              className="w-8 h-8 rounded-full flex items-center justify-center border"
              style={{ borderColor: BORDER, color: '#64748b' }}>
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="px-4 pb-4 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-start gap-3">
            <img src={photo} alt={job.company}
              className="w-14 h-14 rounded-[16px] object-cover border shrink-0"
              style={{ borderColor: BORDER, background: BG }}
              onError={e => { e.currentTarget.src = 'https://api.dicebear.com/7.x/initials/svg?seed=J'; }} />
            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] font-black text-white leading-tight">{job.title}</h2>
              <p className="text-[13px] text-slate-400 mt-0.5">
                {job.company}
                {job.verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 inline ml-1" />}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <MapPin className="w-3 h-3 text-amber-400" />{job.city}, {job.country}
                </span>
                <span className="text-[10px] font-black" style={{ color: GOLD }}>{job.salary}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-lg font-medium"
                  style={{ background: BORDER, color: '#94a3b8' }}>{job.type}</span>
                {job.urgent && <span className="text-[9px] font-black text-orange-400 flex items-center gap-0.5"><Zap className="w-3 h-3" />Ijan</span>}
                {job.premium && <span className="text-[9px] font-black flex items-center gap-0.5" style={{ color: GOLD }}><Gem className="w-3 h-3" />Premium</span>}
                {job.remote && <span className="text-[9px] font-black text-blue-400 flex items-center gap-0.5"><Globe className="w-3 h-3" />Remote</span>}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>{job.applicants} kandida aplike</span>
              <span>{job.slots - job.applicants} plas lib</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BORDER }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(pct, 100)}%`, background: pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#10b981' }} />
            </div>
            <p className="text-[9px] text-slate-600 mt-1">{job.posted} · Plis {job.slots} plas disponsib</p>
          </div>
        </div>

        {/* Quick action row */}
        <div className="grid grid-cols-6 gap-0 border-b" style={{ borderColor: BORDER }}>
          {ACTION_BTNS.map(btn => (
            <button key={btn.label} type="button" onClick={btn.action}
              className="flex flex-col items-center gap-1 py-3 hover:bg-white/5 transition-colors active:scale-95">
              <span className="text-base">{btn.icon}</span>
              <span className="text-[8px] text-slate-500 font-bold">{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Detail tabs */}
        <div className="flex border-b" style={{ borderColor: BORDER }}>
          {DETAIL_TABS.map(tab => (
            <button key={tab} type="button" onClick={() => setDetailTab(tab)}
              className="flex-1 py-3 text-[11px] font-black transition-colors border-b-2"
              style={{
                color: detailTab === tab ? GOLD : '#64748b',
                borderColor: detailTab === tab ? GOLD : 'transparent',
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-4 py-4">
          {tabContent[detailTab]}
        </div>

        {/* Primary CTA */}
        <div className="px-4 pt-2 space-y-2">
          <button type="button"
            onClick={() => setApplied(a => !a)}
            className="w-full py-4 rounded-[20px] text-[15px] font-black transition-all active:scale-[0.98]"
            style={applied
              ? { background: '#10b981', color: '#fff' }
              : { background: GOLD, color: BG }}>
            {applied ? '✓ Ou Aplike — View Status' : `Apply Kounye a · ${job.slots - job.applicants} plas lib`}
          </button>
          <button type="button" onClick={() => navigate('/chat')}
            className="w-full py-3 rounded-[20px] text-[13px] font-black border transition-all active:scale-[0.98]"
            style={{ borderColor: BORDER, color: '#94a3b8', background: 'transparent' }}>
            💬 Kontakte Anplwayè
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────
function EmptyState({ tab, navigate }) {
  const meta = TAB_EMPTY[tab] || TAB_EMPTY.search;
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-20 h-20 rounded-[24px] flex items-center justify-center text-4xl mb-4"
        style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}20` }}>
        {meta.icon}
      </div>
      <p className="text-white font-black text-base mb-2">{meta.title}</p>
      <p className="text-slate-500 text-sm leading-relaxed mb-5">{meta.body}</p>
      <button type="button" onClick={() => navigate('/search')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-black transition-all active:scale-95"
        style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30`, color: GOLD }}>
        🔍 Chèche Djòb
      </button>
    </div>
  );
}

// ── Error state ──────────────────────────────────────────────────
function ErrorState({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-20 h-20 rounded-[24px] flex items-center justify-center text-4xl mb-4"
        style={{ background: '#ef444410', border: '1px solid #ef444430' }}>
        ⚠️
      </div>
      <p className="text-white font-black text-base mb-2">Erè Koneksyon</p>
      <p className="text-slate-500 text-sm mb-5">Pa kapab chaje djòb yo. Konekte internet ou epi eseye ankò.</p>
      <button type="button" onClick={onRetry}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-black transition-all active:scale-95"
        style={{ background: '#ef444420', border: '1px solid #ef444440', color: '#ef4444' }}>
        <RefreshCcw className="w-4 h-4" /> Eseye Ankò
      </button>
    </div>
  );
}

// ── Offline banner ───────────────────────────────────────────────
function OfflineBanner() {
  return (
    <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl"
      style={{ background: '#ef444415', border: '1px solid #ef444430' }}>
      <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
      <p className="text-[11px] text-red-400 font-bold">Ou pa konekte. Données yo ka pa ajou.</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN JOBS HUB
// ════════════════════════════════════════════════════════════════
export default function Jobs() {
  const navigate = useNavigate();

  const [activeTab,   setActiveTab]   = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter,setActiveFilter]= useState(null);
  const [sortBy,      setSortBy]      = useState('recent');
  const [showSort,    setShowSort]    = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [savedIds,    setSavedIds]    = useState(new Set(['j1', 'j3']));
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(false);
  const [isOnline,    setIsOnline]    = useState(navigator.onLine);
  const [allJobs,     setAllJobs]     = useState(BASE_JOBS);

  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    getAllJobs()
      .then(r => {
        const payload = r?.data;
        const jobs = payload?.jobs || payload?.data;
        if (Array.isArray(jobs) && jobs.length) setAllJobs(jobs);
      })
      .catch(() => {});
  }, []);

  // Simulate loading on tab change
  const handleTabChange = useCallback((id) => {
    setActiveTab(id);
    setSearchQuery('');
    setActiveFilter(null);
    setSelectedJob(null);
    if (id !== 'search') {
      setLoading(true);
      setTimeout(() => setLoading(false), 600);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setError(false);
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }, []);

  const handleToggleSave = useCallback((id) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  let tabJobs = getTabJobs(activeTab, allJobs);

  // Client-side filtering
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    tabJobs = tabJobs.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.city.toLowerCase().includes(q)
    );
  }
  if (activeFilter === 'fulltime') tabJobs = tabJobs.filter(j => j.type === 'Tan Plen');
  if (activeFilter === 'parttime') tabJobs = tabJobs.filter(j => j.type === 'Tan Pasyèl');
  if (activeFilter === 'remote')   tabJobs = tabJobs.filter(j => j.remote);
  if (activeFilter === 'urgent')   tabJobs = tabJobs.filter(j => j.urgent);
  if (activeFilter === 'premium')  tabJobs = tabJobs.filter(j => j.premium);
  if (activeFilter === 'verified') tabJobs = tabJobs.filter(j => j.verified);

  if (sortBy === 'salary') tabJobs = [...tabJobs].sort((a, b) => (b.salary || '').localeCompare(a.salary || ''));
  if (sortBy === 'match')  tabJobs = [...tabJobs].sort((a, b) => b.match - a.match);

  const isCertTab = activeTab === 'certificates';

  return (
    <div className="min-h-screen pb-28 text-white" style={{ background: BG }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="sticky top-14 z-30 border-b" style={{ background: `${BG}F0`, backdropFilter: 'blur(20px)', borderColor: BORDER }}>

        {/* Title + sort */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h1 className="text-xl font-black text-white tracking-tight">💼 Jobs</h1>
          <div className="relative">
            <button type="button" onClick={() => setShowSort(s => !s)}
              className="flex items-center gap-1.5 text-[11px] font-bold border px-3 py-1.5 rounded-full transition-all"
              style={{ borderColor: BORDER, color: '#94a3b8', background: CARD }}>
              <SlidersHorizontal className="w-3 h-3" />
              {SORT_OPTIONS.find(s => s.id === sortBy)?.label}
            </button>
            {showSort && (
              <div className="absolute right-0 top-9 z-10 w-36 rounded-2xl border overflow-hidden shadow-xl"
                style={{ background: CARD, borderColor: BORDER }}>
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.id} type="button"
                    onClick={() => { setSortBy(opt.id); setShowSort(false); }}
                    className="w-full text-left px-4 py-2.5 text-[12px] font-bold transition-colors hover:bg-white/5"
                    style={{ color: sortBy === opt.id ? GOLD : '#94a3b8' }}>
                    {sortBy === opt.id && '✓ '}{opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search bar (only for search tab) */}
        {activeTab === 'search' && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5 border focus-within:border-amber-500/50 transition-all"
              style={{ background: BORDER, borderColor: BORDER }}>
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Chèche djòb, konpayi, vil..."
                className="flex-1 bg-transparent text-[13px] text-white placeholder-slate-600 outline-none" />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')}>
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 13 tab bar */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3" style={{ scrollbarWidth: 'none' }}>
          {JOB_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => handleTabChange(tab.id)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-150 active:scale-95"
                style={isActive
                  ? { background: GOLD, color: BG, borderColor: GOLD, boxShadow: `0 4px 14px ${GOLD}30` }
                  : { background: CARD, color: '#94a3b8', borderColor: BORDER }}>
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3" style={{ scrollbarWidth: 'none' }}>
          {FILTER_CHIPS.map(chip => (
            <button key={chip.id} type="button"
              onClick={() => setActiveFilter(f => f === chip.id ? null : chip.id)}
              className="shrink-0 px-3 py-1 rounded-full text-[10px] font-black border transition-all active:scale-95"
              style={activeFilter === chip.id
                ? { background: `${GOLD}20`, borderColor: `${GOLD}50`, color: GOLD }
                : { background: 'transparent', borderColor: BORDER, color: '#64748b' }}>
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── OFFLINE BANNER ─────────────────────────────────────── */}
      {!isOnline && <OfflineBanner />}

      {/* ── CONTENT ────────────────────────────────────────────── */}
      {error ? (
        <ErrorState onRetry={handleRetry} />
      ) : isCertTab ? (
        /* Certificates */
        <div className="mt-2 mx-4 rounded-[20px] overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          {MOCK_CERTS.length === 0 ? (
            <EmptyState tab="certificates" navigate={navigate} />
          ) : MOCK_CERTS.map((cert, idx, arr) => (
            <React.Fragment key={cert.id}>
              <CertCard cert={cert} />
              {idx < arr.length - 1 && <div className="h-px mx-4" style={{ background: BORDER }} />}
            </React.Fragment>
          ))}
        </div>
      ) : loading ? (
        /* Skeleton loading */
        <div className="mt-2 mx-4 rounded-[20px] overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          {[1, 2, 3].map((i, idx) => (
            <React.Fragment key={i}>
              <SkeletonCard />
              {idx < 2 && <div className="h-px mx-4" style={{ background: BORDER }} />}
            </React.Fragment>
          ))}
        </div>
      ) : tabJobs.length === 0 ? (
        <EmptyState tab={activeTab} navigate={navigate} />
      ) : (
        /* Job list */
        <div className="mt-2 mx-4 rounded-[20px] overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          {/* Tab context label */}
          {activeTab !== 'search' && (
            <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {JOB_TABS.find(t => t.id === activeTab)?.icon} {JOB_TABS.find(t => t.id === activeTab)?.label} — {tabJobs.length} djòb
              </span>
              {activeTab === 'applied' && (
                <span className="text-[9px] text-emerald-400 font-bold">Estati an tan reyèl</span>
              )}
            </div>
          )}

          {tabJobs.map((job, idx, arr) => (
            <React.Fragment key={job.id}>
              <JobRow
                job={job}
                tab={activeTab}
                onOpen={setSelectedJob}
                saved={savedIds.has(job.id)}
                onToggleSave={handleToggleSave} />
              {idx < arr.length - 1 && <div className="h-px mx-4" style={{ background: BORDER }} />}
            </React.Fragment>
          ))}

          {/* Load more — for now shows same list; will hook to real API pagination */}
          <button type="button" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 600); }}
            className="w-full py-3 text-[11px] font-bold transition-colors"
            style={{ color: GOLD, borderTop: `1px solid ${BORDER}` }}>
            Chaje plis djòb ↓
          </button>
        </div>
      )}

      {/* ── JOB DETAIL SHEET ───────────────────────────────────── */}
      {selectedJob && (
        <JobDetailSheet
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          navigate={navigate}
          saved={savedIds.has(selectedJob.id)}
          onToggleSave={handleToggleSave} />
      )}

      {/* Sort overlay backdrop */}
      {showSort && <div className="fixed inset-0 z-0" onClick={() => setShowSort(false)} />}
    </div>
  );
}
