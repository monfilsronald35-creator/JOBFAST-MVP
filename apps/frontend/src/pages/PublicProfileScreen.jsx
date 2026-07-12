import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Share2, Bookmark, Play, CheckCircle, Phone, Video, MessageCircle, MapPin, Globe, Shield } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { followUser, unfollowUser, isFollowing, saveUser, unsaveUser, isSaved } from '../services/social';

// ── Design tokens ─────────────────────────────────────────────────
const BG = '#050B18'; const CARD = '#0d1526'; const BORDER = '#1F2937'; const GOLD = '#FACC15';

// ── Helpers ───────────────────────────────────────────────────────
const cls = (...p) => p.filter(Boolean).join(' ');
const fmtNum = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);

// ── Mock data (shown before API loads) ───────────────────────────
const SKILL_LEVELS = { Beginner: 1, Intermediate: 2, Professional: 3, Expert: 4, Master: 5 };
const SKILL_COLORS = { Beginner: '#64748b', Intermediate: '#3b82f6', Professional: '#8b5cf6', Expert: '#f59e0b', Master: '#ef4444' };

function buildMockProfile(seed = {}) {
  return {
    name: seed.name || 'Ronald Monfils',
    profession: seed.profession || seed.role || 'Construction Specialist',
    role: seed.role || 'worker',
    category: seed.category || 'construction',
    coverPhoto: null,
    profilePhoto: seed.profileMetadata?.profilePhoto || null,
    bio: 'Spesyalis konstriksyon ak 8+ ane eksperyans. Travay sou pwojè rezidansyèl ak komèsyal nan Ayiti, Dominikani ak plizyè peyi Karayib yo.',
    location: { city: seed.location?.city || 'Punta Cana', country: 'Dominican Republic' },
    availability: seed.availability || 'available',
    yearsExp: 8, languages: ['Kreyòl', 'Espagnol', 'English'],
    salary: '$900/semèn', contract: 'Full-time / Contract', travelAvail: true,
    rating: { overall: 4.9, quality: 4.9, communication: 4.8, speed: 4.7, professionalism: 5.0, cleanliness: 4.9, respect: 5.0, safety: 4.8 },
    totalReviews: 127,
    stats: { jobs: seed.stats?.totalJobs || 245, projects: 38, clients: 112, followers: 1840, following: 203, views: 9200, responseRate: 98, responseTime: '3 min', repeatClients: 87, hiringSucess: 94 },
    verified: { identity: true, face: true, phone: true, email: true, address: true, company: false, background: true, payment: true, contracts: true, noDisputes: true },
    trustScore: 92, memberSince: '2026', lastActive: '2 min ago',
    badges: ['Identity Verified', 'Phone Verified', 'Email Verified', 'Background Checked', 'Premium Member'],
    skills: [
      { name: 'Electrical',      level: 'Expert'        },
      { name: 'Painting',        level: 'Master'        },
      { name: 'Plumbing',        level: 'Professional'  },
      { name: 'Roofing',         level: 'Expert'        },
      { name: 'Concrete',        level: 'Master'        },
      { name: 'Masonry',         level: 'Expert'        },
      { name: 'Blueprint',       level: 'Professional'  },
      { name: 'Safety',          level: 'Master'        },
      { name: 'Heavy Equipment', level: 'Expert'        },
      { name: 'Leadership',      level: 'Professional'  },
    ],
    experience: [
      { company: 'ABC Construction', role: 'Foreman',     period: '2022–2026', current: true  },
      { company: 'XYZ Builder',      role: 'Electrician', period: '2018–2022', current: false },
      { company: 'Hotel Barceló',    role: 'Maintenance', period: '2016–2018', current: false },
    ],
    education: [
      { school: 'INFOTEP Trade School', degree: 'Electrical Certificate', year: '2018' },
      { school: 'Haiti Univ.',          degree: 'Construction Management',  year: '2016' },
    ],
    services: [
      { name: 'Electrical Work',  price: '$80/h', icon: '⚡' },
      { name: 'Painting',         price: '$60/h', icon: '🖌' },
      { name: 'Installation',     price: '$70/h', icon: '🔧' },
      { name: 'Inspection',       price: '$50/h', icon: '🔍' },
      { name: 'Maintenance',      price: '$65/h', icon: '⚙️' },
      { name: 'Consultation',     price: '$40/h', icon: '💬' },
    ],
    portfolio: [
      { id: 'p1', type: 'photo',  thumb: null, label: 'Hotel Project'   },
      { id: 'p2', type: 'video',  thumb: null, label: 'Roof Install'    },
      { id: 'p3', type: 'before', thumb: null, label: 'Before / After'  },
      { id: 'p4', type: 'photo',  thumb: null, label: 'Residence'       },
      { id: 'p5', type: 'cert',   thumb: null, label: 'Certificate'     },
      { id: 'p6', type: 'pdf',    thumb: null, label: 'Blueprint'       },
    ],
    reviews: [
      { id: 'r1', author: 'Marie Jean',    rating: 5, text: 'Excellent travay, pwofesyonèl anpil. Mwen rekòmande l 100%.', date: 'Jul 2026' },
      { id: 'r2', author: 'ABC Hotel',     rating: 5, text: 'Livraison rapid ak bon kalite. Nou ap travay ak li ankò.', date: 'Jun 2026'  },
      { id: 'r3', author: 'Paul Dupont',   rating: 4, text: 'Bon travay, te rive yon ti kras ta men rezilta ekselan.', date: 'May 2026'  },
    ],
    highlights: [
      { label: 'Projects', emoji: '🏗'  },
      { label: 'Work',     emoji: '💼'  },
      { label: 'Clients',  emoji: '🤝'  },
      { label: 'Travel',   emoji: '✈️'  },
      { label: 'Promo',    emoji: '📢'  },
      { label: 'Live',     emoji: '🔴'  },
      { label: 'Before/After', emoji: '🔄' },
      { label: 'Products', emoji: '📦'  },
    ],
    jobs: {
      applied: 12, current: 3, completed: 245, saved: 8, rejected: 2, invitations: 5,
    },
    contact: { email: true, whatsapp: true, telegram: false, website: false },
    availabilityStatus: ['Available Now', 'Weekend', 'Night Shift', 'On Site', 'Remote'],
    aiScore: 92,
    aiRecs: ['Foreman', 'Project Manager', 'Safety Officer', 'Construction Consultant'],
  };
}

// ════════════════════════════════════════════════════════════════
// SMALL SHARED COMPONENTS
// ════════════════════════════════════════════════════════════════

const Divider = () => <div className="h-px mx-4 my-4" style={{ background: BORDER }} />;

const SectionTitle = memo(({ children, right }) => (
  <div className="flex items-center justify-between px-4 mb-3">
    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">{children}</p>
    {right}
  </div>
));

const StatBox = memo(({ value, label }) => (
  <div className="flex flex-col items-center gap-0.5">
    <p className="text-lg font-black text-white">{fmtNum(Number(value) || 0)}</p>
    <p className="text-[9px] text-slate-500 font-semibold text-center">{label}</p>
  </div>
));

const Badge = memo(({ label, color = '#FACC15' }) => (
  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
    style={{ color, borderColor: `${color}40`, background: `${color}10` }}>
    ✔ {label}
  </span>
));

const SkillBadge = memo(({ name, level }) => {
  const color = SKILL_COLORS[level] || GOLD;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
      style={{ background: `${color}10`, borderColor: `${color}30` }}>
      <span className="text-[11px] font-black" style={{ color }}>{name}</span>
      <span className="text-[9px] text-slate-500 font-semibold">{level}</span>
    </div>
  );
});

const ActionBtn = memo(({ icon, label, primary, onClick }) => (
  <button type="button" onClick={onClick}
    className={cls('flex flex-col items-center gap-1 py-2 px-2 rounded-2xl border transition-all active:scale-95 min-w-[52px]',
      primary ? 'border-amber-500/60 text-slate-950' : 'border-slate-700/60 text-slate-300 hover:border-amber-500/30')}
    style={primary ? { background: GOLD } : { background: CARD }}>
    <span className="text-lg leading-none">{icon}</span>
    <span className="text-[9px] font-black whitespace-nowrap">{label}</span>
  </button>
));

const RatingBar = memo(({ label, value, max = 5 }) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] text-slate-400 w-24 shrink-0">{label}</span>
    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
      <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${(value / max) * 100}%` }} />
    </div>
    <span className="text-[10px] font-black text-amber-400 w-6 text-right shrink-0">{value}</span>
  </div>
));

// ════════════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ════════════════════════════════════════════════════════════════

// 2. Professional Showcase
function ShowcaseSection({ profile, navigate }) {
  const items = [
    { icon: '▶', label: 'Intro Video 60s', path: null   },
    { icon: '📸', label: '10 Best Photos', path: null   },
    { icon: '🏆', label: 'Awards',          path: null   },
    { icon: '📜', label: 'Certificates',    path: null   },
    { icon: '💼', label: 'Latest Projects', path: null   },
    { icon: '⭐', label: 'Best Reviews',    path: null   },
    { icon: '📍', label: 'Service Area',    path: null   },
    { icon: '🗓', label: 'Availability',    path: null   },
  ];
  return (
    <div className="px-4 space-y-3">
      {/* Intro video placeholder */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-800/60 border"
        style={{ borderColor: BORDER, height: 180 }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center">
            <Play className="w-6 h-6 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-sm font-black text-white">Intro Video · 60 sec</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.slice(1).map(item => (
          <button key={item.label} type="button"
            className="flex items-center gap-2.5 px-3 py-3 rounded-2xl border text-left transition-all active:scale-95 hover:border-amber-500/30"
            style={{ background: CARD, borderColor: BORDER }}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-[11px] font-bold text-slate-300">{item.label}</span>
          </button>
        ))}
      </div>

      <button type="button"
        className="w-full py-3.5 rounded-2xl font-black text-slate-950 text-sm active:scale-95 transition"
        style={{ background: GOLD }}>
        💼 Hire Now
      </button>
    </div>
  );
}

// 4. About
function AboutSection({ profile }) {
  const rows = [
    ['💼', 'Experience', `${profile.yearsExp}+ years`],
    ['🌍', 'Languages', profile.languages?.join(', ')],
    ['💰', 'Expected Salary', profile.salary],
    ['📋', 'Contract Type', profile.contract],
    ['✈️', 'Travel Available', profile.travelAvail ? 'Yes' : 'No'],
    ['📄', 'Work Permit', 'Valid'],
    ['🛂', 'Passport', 'Valid'],
    ['🚗', 'Driving License', 'Yes'],
  ];
  return (
    <div className="px-4 space-y-4">
      {profile.bio && (
        <div className="p-4 rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
          <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Professional Summary</p>
          <p className="text-sm text-slate-300 leading-relaxed">{profile.bio}</p>
        </div>
      )}
      <div className="rounded-2xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
        {rows.map(([icon, label, val], i) => (
          <div key={label}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
            <span className="text-base w-7 text-center">{icon}</span>
            <span className="text-[11px] text-slate-500 w-28 shrink-0">{label}</span>
            <span className="text-[11px] font-bold text-white flex-1">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. Skills
function SkillsSection({ profile }) {
  const [filter, setFilter] = useState('All');
  const levels = ['All', 'Beginner', 'Intermediate', 'Professional', 'Expert', 'Master'];
  const skills = profile.skills || [];
  const shown = filter === 'All' ? skills : skills.filter(s => s.level === filter);
  return (
    <div className="px-4 space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {levels.map(l => (
          <button key={l} type="button" onClick={() => setFilter(l)}
            className={cls('shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-black border transition',
              filter === l ? 'bg-amber-500 border-amber-400 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-400')}>
            {l}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {shown.map(s => <SkillBadge key={s.name} name={s.name} level={s.level} />)}
      </div>
      {shown.length === 0 && <p className="text-center text-slate-500 text-sm py-6">Pa gen rezilta pou nivo sa a</p>}
    </div>
  );
}

// 6. Portfolio
function PortfolioSection({ profile }) {
  const [cat, setCat] = useState('All');
  const cats = ['All', 'Photos', 'Videos', 'Before/After', 'Projects', 'Certificates', 'PDF'];
  const icons = { photo:'📷', video:'🎥', before:'🔄', cert:'📜', pdf:'📄', project:'🏗' };
  const items = profile.portfolio || [];
  const shown = cat === 'All' ? items : items.filter(p => p.type.startsWith(cat.toLowerCase().replace('/','').substring(0, 3)));
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 px-4" style={{ scrollbarWidth: 'none' }}>
        {cats.map(c => (
          <button key={c} type="button" onClick={() => setCat(c)}
            className={cls('shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-black border transition',
              cat === c ? 'bg-amber-500 border-amber-400 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-400')}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-px px-4">
        {shown.map(item => (
          <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden"
            style={{ background: CARD }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="text-3xl">{icons[item.type] || '📷'}</span>
              <span className="text-[9px] text-slate-500 font-bold px-1 text-center">{item.label}</span>
            </div>
            {item.type === 'video' && (
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                <Play className="w-2.5 h-2.5 text-white fill-white" />
              </div>
            )}
          </div>
        ))}
        {shown.length === 0 && (
          <div className="col-span-3 py-10 text-center text-slate-500 text-sm">Pa gen atik pou kategori sa a</div>
        )}
      </div>
    </div>
  );
}

// 7. Experience + 8. Education
function ExperienceSection({ profile }) {
  return (
    <div className="px-4 space-y-4">
      <SectionTitle>💼 Work Experience</SectionTitle>
      <div className="space-y-3">
        {(profile.experience || []).map((e, i) => (
          <div key={i} className="flex gap-3 p-4 rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-lg shrink-0">🏢</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-white truncate">{e.company}</p>
                {e.current && <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full shrink-0">Current</span>}
              </div>
              <p className="text-[11px] text-amber-400 font-bold mt-0.5">{e.role}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{e.period}</p>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle>🎓 Education</SectionTitle>
      <div className="space-y-3">
        {(profile.education || []).map((e, i) => (
          <div key={i} className="flex gap-3 p-4 rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
            <div className="w-10 h-10 rounded-xl bg-purple-600/40 flex items-center justify-center text-lg shrink-0">🏫</div>
            <div className="flex-1">
              <p className="text-sm font-black text-white">{e.school}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{e.degree}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{e.year}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 9. Reviews
function ReviewsSection({ profile }) {
  const r = profile.rating || {};
  const dims = [
    ['Quality',          r.quality],
    ['Communication',    r.communication],
    ['Speed',            r.speed],
    ['Professionalism',  r.professionalism],
    ['Cleanliness',      r.cleanliness],
    ['Respect',          r.respect],
    ['Safety',           r.safety],
  ];
  return (
    <div className="px-4 space-y-4">
      {/* Overall rating */}
      <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
        <div className="flex flex-col items-center gap-1 shrink-0">
          <p className="text-4xl font-black text-amber-400">{r.overall || 4.9}</p>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
          </div>
          <p className="text-[10px] text-slate-500">{profile.totalReviews} reviews</p>
        </div>
        <div className="flex-1 space-y-2">
          {dims.map(([label, val]) => <RatingBar key={label} label={label} value={val ?? 4.9} />)}
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-3">
        {(profile.reviews || []).map(rv => (
          <div key={rv.id} className="p-4 rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-black">{rv.author[0]}</div>
                <p className="text-xs font-black text-white">{rv.author}</p>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(rv.rating)].map((_, i) => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                <span className="text-[10px] text-slate-500 ml-1">{rv.date}</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{rv.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 10 + 11. Availability + Services
function ServicesSection({ profile, navigate }) {
  const statusColors = { 'Available Now': '#22c55e', 'Busy': '#ef4444', 'Vacation': '#f59e0b', 'Emergency': '#ef4444', 'Weekend': '#8b5cf6', 'Night Shift': '#3b82f6', 'Remote': '#06b6d4', 'On Site': '#f59e0b' };
  return (
    <div className="px-4 space-y-4">
      <SectionTitle>🟢 Availability</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {(profile.availabilityStatus || ['Available Now']).map(s => (
          <span key={s} className="text-[11px] font-bold px-3 py-1.5 rounded-full border"
            style={{ color: statusColors[s] || GOLD, borderColor: `${statusColors[s] || GOLD}30`, background: `${statusColors[s] || GOLD}10` }}>
            ● {s}
          </span>
        ))}
      </div>

      <SectionTitle>🔧 Services Offered</SectionTitle>
      <div className="space-y-2">
        {(profile.services || []).map(s => (
          <div key={s.name} className="flex items-center gap-3 p-3.5 rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
            <span className="text-xl w-8 text-center">{s.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-black text-white">{s.name}</p>
              <p className="text-[10px] text-amber-400 font-bold">{s.price}</p>
            </div>
            <button type="button" onClick={() => navigate('/booking')}
              className="px-3 py-1.5 rounded-xl text-[11px] font-black text-slate-950 active:scale-95 transition"
              style={{ background: GOLD }}>
              Book
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// 12. Jobs
function JobsSection({ profile }) {
  const [tab, setTab] = useState('Applied');
  const tabs = ['Applied','Current','Completed','Saved','Rejected','Invitations'];
  const counts = { Applied: profile.jobs?.applied || 12, Current: profile.jobs?.current || 3, Completed: profile.jobs?.completed || 245, Saved: profile.jobs?.saved || 8, Rejected: profile.jobs?.rejected || 2, Invitations: profile.jobs?.invitations || 5 };
  const periods = ['Today','Tomorrow','Week','Month'];
  const [period, setPeriod] = useState('Week');
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 px-4" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={cls('shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-black border transition',
              tab === t ? 'bg-amber-500 border-amber-400 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-400')}>
            {t} <span className="opacity-60">({counts[t]})</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 px-4">
        {periods.map(p => (
          <button key={p} type="button" onClick={() => setPeriod(p)}
            className={cls('flex-1 py-1.5 rounded-xl text-[10px] font-black border transition',
              period === p ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500')}>
            {p}
          </button>
        ))}
      </div>

      <div className="px-4 text-center py-8 rounded-2xl mx-4 border" style={{ background: CARD, borderColor: BORDER }}>
        <p className="text-3xl mb-2">📋</p>
        <p className="text-sm font-bold text-white">{counts[tab]} {tab} Jobs</p>
        <p className="text-[11px] text-slate-500 mt-1">This {period}</p>
      </div>
    </div>
  );
}

// 15. Documents
function DocumentsSection() {
  const docs = [
    { icon: '📄', name: 'CV / Resume',       privacy: 'Employers' },
    { icon: '🛂', name: 'Passport',          privacy: 'Private'   },
    { icon: '🪪', name: 'National ID',       privacy: 'Private'   },
    { icon: '📜', name: 'Certificates',      privacy: 'Public'    },
    { icon: '📋', name: 'License',           privacy: 'Employers' },
    { icon: '🛡', name: 'Insurance',         privacy: 'Employers' },
    { icon: '🧾', name: 'Tax Documents',     privacy: 'Private'   },
  ];
  const privacyColor = { Private:'#ef4444', Friends:'#8b5cf6', Employers:'#f59e0b', Public:'#22c55e' };
  return (
    <div className="px-4 space-y-2">
      {docs.map(d => (
        <div key={d.name} className="flex items-center gap-3 p-3.5 rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
          <span className="text-xl w-8 text-center">{d.icon}</span>
          <p className="flex-1 text-sm font-bold text-white">{d.name}</p>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ color: privacyColor[d.privacy], background: `${privacyColor[d.privacy]}10` }}>
            🔒 {d.privacy}
          </span>
        </div>
      ))}
    </div>
  );
}

// 16. AI Career
function AICareerSection({ profile }) {
  const score = profile.aiScore || 92;
  return (
    <div className="px-4 space-y-4">
      {/* AI Score ring */}
      <div className="p-4 rounded-2xl border text-center" style={{ background: CARD, borderColor: BORDER }}>
        <p className="text-[10px] font-black uppercase text-slate-500 mb-3">🤖 AI Career Score</p>
        <div className="relative w-24 h-24 mx-auto mb-3">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3.8" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={GOLD} strokeWidth="3.8"
              strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-amber-400">{score}%</span>
          </div>
        </div>
        <p className="text-sm font-black text-white">Excellent Profile</p>
      </div>

      {[
        { title: '🎯 Recommended Jobs',   items: profile.aiRecs || ['Foreman','Project Manager','Safety Officer'] },
        { title: '📚 Recommended Skills', items: ['AutoCAD', 'Project Scheduling', 'BIM Modeling'] },
        { title: '🎓 Courses',            items: ['OSHA Safety 30h', 'Project Management', 'Estimating'] },
      ].map(sec => (
        <div key={sec.title}>
          <p className="text-[11px] font-black text-slate-400 mb-2">{sec.title}</p>
          <div className="flex flex-wrap gap-2">
            {sec.items.map(item => (
              <span key={item} className="text-[11px] font-bold px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800 text-slate-300">{item}</span>
            ))}
          </div>
        </div>
      ))}

      <div className="p-4 rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
        <p className="text-[10px] font-black uppercase text-slate-500 mb-2">💰 Salary Estimate</p>
        <p className="text-2xl font-black text-amber-400">$900 – $1,400 <span className="text-sm text-slate-500">/wk</span></p>
        <p className="text-[10px] text-slate-500 mt-1">Based on skills, location & experience</p>
      </div>
    </div>
  );
}

// 17. Contact
function ContactSection({ profile, navigate }) {
  const methods = [
    { icon: '💬', label: 'Message',   action: () => navigate('/chat'),  active: true   },
    { icon: '📞', label: 'Voice Call', action: () => {},                active: true   },
    { icon: '🎥', label: 'Video Call', action: () => {},                active: true   },
    { icon: '📧', label: 'Email',      action: () => {},                active: !!profile.contact?.email     },
    { icon: '📍', label: 'Location',   action: () => {},                active: true   },
    { icon: '🌐', label: 'Website',    action: () => {},                active: !!profile.contact?.website   },
    { icon: '📱', label: 'WhatsApp',   action: () => {},                active: !!profile.contact?.whatsapp  },
    { icon: '✈️', label: 'Telegram',   action: () => {},                active: !!profile.contact?.telegram  },
  ].filter(m => m.active);
  return (
    <div className="px-4 grid grid-cols-4 gap-2">
      {methods.map(m => (
        <button key={m.label} type="button" onClick={m.action}
          className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all active:scale-95 hover:border-amber-500/30"
          style={{ background: CARD, borderColor: BORDER }}>
          <span className="text-2xl">{m.icon}</span>
          <span className="text-[10px] font-bold text-slate-400">{m.label}</span>
        </button>
      ))}
    </div>
  );
}

// 18. Statistics
function StatsSection({ profile }) {
  const s = profile.stats || {};
  const metrics = [
    ['💼', 'Completed Jobs',   s.jobs],
    ['🏗',  'Projects',         s.projects],
    ['🤝', 'Clients',          s.clients],
    ['👥', 'Followers',        s.followers],
    ['➡️', 'Following',        s.following],
    ['👀', 'Profile Views',    s.views],
    ['⚡', 'Response Rate',   `${s.responseRate}%`],
    ['⏱',  'Response Time',    s.responseTime],
    ['🎯', 'Hiring Success',  `${s.hiringSucess}%`],
    ['🔁', 'Repeat Clients',  `${s.repeatClients}%`],
  ];
  return (
    <div className="px-4 grid grid-cols-2 gap-2">
      {metrics.map(([icon, label, val]) => (
        <div key={label} className="p-3 rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
          <p className="text-base">{icon}</p>
          <p className="text-lg font-black text-amber-400 mt-1">{fmtNum(Number(val) || 0)}{typeof val === 'string' && val.includes('%') ? '' : ''}{typeof val === 'string' && !isNaN(val) ? '' : (typeof val === 'string' ? ' ' + val.replace(/\d+/g,'').trim() : '')}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// 26. Trust Center
function TrustCenterSection({ profile }) {
  const v = profile.verified || {};
  const checks = [
    { key: 'identity',   label: 'Identity Verified'    },
    { key: 'face',       label: 'Face Verified'        },
    { key: 'phone',      label: 'Phone Verified'       },
    { key: 'email',      label: 'Email Verified'       },
    { key: 'address',    label: 'Address Verified'     },
    { key: 'company',    label: 'Company Verified'     },
    { key: 'background', label: 'Background Checked'   },
    { key: 'payment',    label: 'Payment Verified'     },
    { key: 'contracts',  label: 'Contracts Completed'  },
    { key: 'noDisputes', label: 'No Active Disputes'   },
  ];
  const score = profile.trustScore || 92;
  return (
    <div className="px-4 space-y-4">
      {/* Score */}
      <div className="p-4 rounded-2xl border flex items-center gap-4" style={{ background: CARD, borderColor: BORDER }}>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase text-slate-500 mb-1">🛡 Trust Score</p>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-black" style={{ color: score >= 90 ? '#22c55e' : score >= 70 ? GOLD : '#ef4444' }}>{score}</p>
            <p className="text-slate-500 text-sm mb-1">/100</p>
          </div>
          <div className="h-2 rounded-full bg-slate-800 mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${score}%` }} />
          </div>
        </div>
        <Shield className="w-12 h-12 text-green-400/40" />
      </div>

      {/* Verification checks */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
        {checks.map((c, i) => (
          <div key={c.key} className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: i < checks.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
            <span className={cls('text-base', v[c.key] ? 'text-green-400' : 'text-slate-700')}>
              {v[c.key] ? '✔' : '○'}
            </span>
            <span className={cls('text-xs font-semibold', v[c.key] ? 'text-white' : 'text-slate-600')}>{c.label}</span>
            {v[c.key] && <CheckCircle className="w-4 h-4 text-green-400 ml-auto shrink-0" />}
          </div>
        ))}
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-2">
        {[
          ['Member Since', profile.memberSince || '2026'],
          ['Last Active',  profile.lastActive  || 'Today'],
          ['Avg Response', profile.stats?.responseTime || '3 min'],
          ['Response Rate',`${profile.stats?.responseRate || 98}%`],
        ].map(([k, v]) => (
          <div key={k} className="p-3 rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
            <p className="text-[9px] text-slate-500 font-semibold">{k}</p>
            <p className="text-sm font-black text-amber-400 mt-0.5">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// HERO SECTION (always visible)
// ════════════════════════════════════════════════════════════════
function HeroSection({ profile, isOwnProfile, followed, saved, onFollow, onSave, navigate }) {
  const photo = profile.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.name || 'user')}`;
  const avColor = { available: '#22c55e', busy: '#ef4444', vacation: '#f59e0b' }[profile.availability] || '#94a3b8';

  return (
    <div>
      {/* Cover */}
      <div className="relative" style={{ height: 160 }}>
        {profile.coverPhoto
          ? <img src={profile.coverPhoto} alt="cover" className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#1e3a5f 0%,#1e1b4b 50%,#3b0764 100%)' }} />
        }
        {/* Back + Menu */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button type="button" onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onSave}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center active:scale-90 transition">
              <Bookmark className={cls('w-4 h-4', saved ? 'text-amber-400 fill-amber-400' : 'text-white')} />
            </button>
            <button type="button"
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Avatar */}
        <div className="absolute left-4" style={{ bottom: -40 }}>
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl border-3 overflow-hidden shadow-xl"
              style={{ borderColor: BG, borderWidth: 3 }}>
              <img src={photo} alt={profile.name} className="w-full h-full object-cover"
                onError={e => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=user`; }} />
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{ background: avColor, borderColor: BG }} />
          </div>
        </div>
      </div>

      {/* Name + quick stats */}
      <div className="pt-12 px-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xl font-black text-white leading-tight">{profile.name}</p>
            <p className="text-[13px] text-amber-400 font-bold mt-0.5">🏗 {profile.profession}</p>
            <p className="text-[11px] text-green-400 font-bold mt-0.5">
              ● {profile.availability === 'available' ? 'Available Now' : profile.availability === 'busy' ? 'Busy' : 'Available'}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              {profile.location?.city && (
                <span className="text-[10px] text-slate-500">📍 {profile.location.city}</span>
              )}
              <span className="text-slate-700 text-[10px]">·</span>
              <span className="text-[10px] text-slate-500">🌍 Available Worldwide</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
              <span className="text-[11px] font-black text-amber-400 ml-0.5">{profile.rating?.overall ?? 4.9}</span>
            </div>
          </div>
          {/* Quick stats */}
          <div className="flex gap-3 shrink-0">
            <StatBox value={profile.stats?.jobs || 245}       label="Jobs" />
            <StatBox value={profile.stats?.followers || 1840} label="Followers" />
          </div>
        </div>

        {/* Verification badges */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(profile.badges || ['Identity Verified']).slice(0, 3).map(b => (
            <Badge key={b} label={b.replace(' Verified','').replace(' Checked','').replace(' Member','')} />
          ))}
        </div>

        {/* Action buttons */}
        {isOwnProfile ? (
          <button type="button" onClick={() => navigate('/settings')}
            className="w-full mt-3 py-2.5 rounded-xl border border-slate-600 text-sm font-black text-white transition active:scale-95">
            ✏️ Edit Profile
          </button>
        ) : (
          <div className="mt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
              <ActionBtn icon={followed ? '✅' : '➕'} label={followed ? 'Following' : 'Follow'} primary={!followed} onClick={onFollow} />
              <ActionBtn icon="💬" label="Message"   onClick={() => navigate('/chat')} />
              <ActionBtn icon="📞" label="Voice"     onClick={() => {}} />
              <ActionBtn icon="🎥" label="Video"     onClick={() => {}} />
              <ActionBtn icon="💼" label="Hire Now"  primary onClick={() => {}} />
              <ActionBtn icon="📅" label="Book"      onClick={() => navigate('/booking')} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PROFILE FOOTER
// ════════════════════════════════════════════════════════════════
function ProfileFooter({ profile, navigate }) {
  return (
    <div className="px-4 py-4 border-t" style={{ borderColor: BORDER }}>
      <p className="text-[10px] font-black uppercase text-slate-600 mb-3 text-center">More Options</p>
      <div className="grid grid-cols-3 gap-2">
        {[['📤','Share'],['🔗','Copy Link'],['📲','QR Code'],['⬇','Download CV'],['🚩','Report'],['🚫','Block']].map(([icon, label]) => (
          <button key={label} type="button"
            className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-slate-500 transition-all active:scale-95 hover:text-slate-300 hover:border-slate-600"
            style={{ background: CARD, borderColor: BORDER }}>
            <span className="text-lg">{icon}</span>
            <span className="text-[9px] font-bold">{label}</span>
          </button>
        ))}
      </div>
      <button type="button" className="w-full mt-3 py-2 text-[10px] text-slate-600">
        🔒 Privacy Settings
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'showcase',    icon: '🎯', label: 'Showcase'    },
  { id: 'about',       icon: '👤', label: 'About'       },
  { id: 'skills',      icon: '⚡', label: 'Skills'      },
  { id: 'portfolio',   icon: '📸', label: 'Portfolio'   },
  { id: 'experience',  icon: '💼', label: 'Experience'  },
  { id: 'reviews',     icon: '⭐', label: 'Reviews'     },
  { id: 'services',    icon: '🔧', label: 'Services'    },
  { id: 'jobs',        icon: '📋', label: 'Jobs'        },
  { id: 'documents',   icon: '📁', label: 'Docs'        },
  { id: 'ai',          icon: '🤖', label: 'AI Career'   },
  { id: 'contact',     icon: '📞', label: 'Contact'     },
  { id: 'stats',       icon: '📊', label: 'Stats'       },
  { id: 'trust',       icon: '🛡', label: 'Trust'       },
];

export default function PublicProfileScreen() {
  const { userId }   = useParams();
  const location     = useLocation();
  const navigate     = useNavigate();
  const { user: me } = useAuth();
  const myId = String(me?._id || me?.id || '');

  const [profile,  setProfile]  = useState(() => buildMockProfile(location.state?.profile || {}));
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setTab]     = useState('showcase');
  const [followed, setFollowed] = useState(() => isFollowing(myId, userId));
  const [saved,    setSaved]    = useState(() => isSaved(myId, userId));

  const isOwnProfile = myId && (myId === userId || myId === String(profile._id));

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    API.get(`/users/${userId}`)
      .then(res => {
        const data = res?.data?.data?.user || res?.data?.user || res?.data;
        if (data?.name) setProfile(buildMockProfile(data));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleFollow = useCallback(() => {
    if (followed) { unfollowUser(myId, userId); setFollowed(false); }
    else          { followUser(myId, userId);   setFollowed(true);  }
  }, [followed, myId, userId]);

  const handleSave = useCallback(() => {
    if (saved) { unsaveUser(myId, userId); setSaved(false); }
    else       { saveUser(myId, userId);   setSaved(true);  }
  }, [saved, myId, userId]);

  return (
    <div className="min-h-screen pb-24 text-white" style={{ background: BG }}>

      {/* 1. Hero */}
      <HeroSection
        profile={profile} isOwnProfile={isOwnProfile}
        followed={followed} saved={saved}
        onFollow={handleFollow} onSave={handleSave}
        navigate={navigate}
      />

      {/* 3. Stories (highlights) */}
      <div className="mt-3 mb-2">
        <div className="flex gap-4 px-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          <button type="button" className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition">
            <div className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center text-2xl"
              style={{ borderColor: BORDER, background: CARD }}>
              ➕
            </div>
            <span className="text-[10px] text-slate-500 font-bold">My Story</span>
          </button>
          {(profile.highlights || []).map(h => (
            <button key={h.label} type="button" className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition">
              <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl"
                style={{ borderColor: GOLD, background: `${GOLD}15` }}>
                {h.emoji}
              </div>
              <span className="text-[10px] text-slate-300 font-bold max-w-[56px] truncate">{h.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section tabs */}
      <div className="sticky top-0 z-30 border-b" style={{ background: BG, borderColor: BORDER }}>
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setTab(tab.id)}
              className={cls('shrink-0 flex flex-col items-center gap-0.5 px-3.5 py-2.5 transition border-b-2',
                activeTab === tab.id ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-600 hover:text-slate-400')}>
              <span className="text-base">{tab.icon}</span>
              <span className="text-[9px] font-black whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section content */}
      <div className="pt-4">
        {activeTab === 'showcase'   && <ShowcaseSection    profile={profile} navigate={navigate} />}
        {activeTab === 'about'      && <AboutSection       profile={profile} />}
        {activeTab === 'skills'     && <SkillsSection      profile={profile} />}
        {activeTab === 'portfolio'  && <PortfolioSection   profile={profile} />}
        {activeTab === 'experience' && <ExperienceSection  profile={profile} />}
        {activeTab === 'reviews'    && <ReviewsSection     profile={profile} />}
        {activeTab === 'services'   && <ServicesSection    profile={profile} navigate={navigate} />}
        {activeTab === 'jobs'       && <JobsSection        profile={profile} />}
        {activeTab === 'documents'  && <DocumentsSection />}
        {activeTab === 'ai'         && <AICareerSection    profile={profile} />}
        {activeTab === 'contact'    && <ContactSection     profile={profile} navigate={navigate} />}
        {activeTab === 'stats'      && <StatsSection       profile={profile} />}
        {activeTab === 'trust'      && <TrustCenterSection profile={profile} />}
      </div>

      {/* 25. Footer */}
      <ProfileFooter profile={profile} navigate={navigate} />
    </div>
  );
}
