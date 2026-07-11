import React, {
  useState, useEffect, useCallback, useRef, memo,
} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Phone, MessageSquare, Star, Heart,
  CheckCircle, X, ChevronRight, MapPin, Share2,
  Bookmark, Video, Globe, Briefcase, Building2,
  Calendar, Wallet, FileText, Award, Zap, Users,
  QrCode, Flag, Download, Clock, RefreshCcw,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

const BG = '#050B18'; const CARD = '#111827'; const BORDER = '#1F2937'; const GOLD = '#FACC15';

// ── Local storage helpers ────────────────────────────────────────
const lsGet = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ── Role detection ───────────────────────────────────────────────
const BIZ_ROLES = new Set(['company','business','enterprise','hotel','restaurant','clinic','hospital','tourism','supermarket','security']);
const ENT_ROLES = new Set(['company','enterprise']);

// ── Mock data for non-API fields ─────────────────────────────────
const MOCK_SKILLS     = ['Maçonri', 'Penti', 'Elektrisite', 'Plombri', 'Twati', 'Chapant', 'Beton', 'Blueprint', 'Sekirite', 'Ekipman Lou'];
const MOCK_PORTFOLIO  = ['🏗','🔧','⚡','🏠','🔨','🪚','🏢','🛠'];
const MOCK_EXPERIENCE = [
  { company:'ABC Construction', role:'Elektrisyen Senior',  period:'2021–2025', current: true  },
  { company:'XYZ Builder',      role:'Kontrèmèt',          period:'2017–2021', current: false },
  { company:'Metro Works',      role:'Elektrisyen Junior',  period:'2013–2017', current: false },
];
const MOCK_EDUCATION = [
  { icon:'🎓', title:'BTP Elektrisite Industriyèl',    place:'INFP Haiti',    year:'2013' },
  { icon:'📜', title:'Sètifika Sekirite Konstriksyon', place:'MTPTC',         year:'2020' },
  { icon:'🏆', title:'Lisans Elektrisyen Nivo 2',      place:'OIIH',          year:'2022' },
];
const MOCK_SERVICES = [
  { icon:'⚡', name:'Elektrisite',  price:'à partir $80',  available: true  },
  { icon:'🎨', name:'Penti',        price:'à partir $60',  available: true  },
  { icon:'🔧', name:'Plombri',      price:'à partir $70',  available: false },
  { icon:'🔍', name:'Enspeksyon',   price:'à partir $50',  available: true  },
  { icon:'🛠', name:'Antretyen',    price:'à partir $45',  available: true  },
];
const MOCK_AI_MATCH = [
  { cat:'Construction',      pct:92, color:'#FACC15' },
  { cat:'Electrical Work',   pct:89, color:'#6366f1' },
  { cat:'Hotel Maintenance', pct:85, color:'#10b981' },
  { cat:'Industrial',        pct:78, color:'#f97316' },
];
const MOCK_REVIEWS_BREAKDOWN = [
  { label:'Kalite',           stars:4.9 },
  { label:'Kominikasyon',     stars:4.8 },
  { label:'Rapidite',         stars:4.7 },
  { label:'Pwofesyonalis',    stars:5.0 },
];
const MOCK_REVIEWS = [
  { id:1, name:'Jean-Paul Remy',    photo:null, stars:5, text:'Travay ekselan! Elektrisyen trè konpetan ak serye. Mwen rekòmande l.', time:'15 Jiyè 2026' },
  { id:2, name:'Marie Solange',     photo:null, stars:5, text:'Ponktiyèl, pwòp, ak pwofesyonèl. Pèsonn pi bon pase li.', time:'8 Jiyè 2026' },
  { id:3, name:'Carlos Mendez',     photo:null, stars:4, text:'Good electrician, finished on time and within budget.', time:'1 Jiyè 2026' },
];

// ═══════════════════════════════════════════════════════════════
// MODAL COMPONENTS (keep working API integration)
// ═══════════════════════════════════════════════════════════════

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 justify-center">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className="transition active:scale-90">
          <Star className={`w-8 h-8 transition-colors ${n<=value?'text-amber-400 fill-amber-400':'text-slate-600'}`} />
        </button>
      ))}
    </div>
  );
}

function RatingModal({ target, onClose, onSubmit }) {
  const [stars, setStars] = useState(5);
  const [text,  setText]  = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-[28px] p-6 space-y-5"
        style={{ background: CARD, border: `1px solid ${BORDER}` }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: BORDER }} />
        <p className="text-center text-white font-black text-base">⭐ Bay yon Nòt</p>
        <p className="text-center text-sm text-slate-400">{target?.name}</p>
        <StarPicker value={stars} onChange={setStars} />
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
          placeholder="Ekri yon komantè (opsyonèl)..."
          className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none resize-none"
          style={{ background: BORDER, border: `1px solid #374151` }} />
        <button type="button" onClick={() => onSubmit({ stars, text })}
          className="w-full py-3 rounded-xl text-sm font-black active:scale-95 transition"
          style={{ background: GOLD, color: BG }}>
          Voye Nòt la
        </button>
        <button type="button" onClick={onClose} className="w-full text-sm text-slate-500 py-1">Anile</button>
      </div>
    </div>
  );
}

function DemandModal({ target, onClose, onSubmit }) {
  const [desc, setDesc]     = useState('');
  const [budget, setBudget] = useState('');
  const [date, setDate]     = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-[28px] p-6 space-y-4"
        style={{ background: CARD, border:`1px solid ${BORDER}` }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: BORDER }} />
        <p className="text-center text-white font-black text-base">📋 Book Service</p>
        <p className="text-center text-xs text-slate-400">{target?.name} · {target?.profession || target?.role}</p>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4}
          placeholder="Dekri travay ou bezwen fè a..."
          className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none resize-none"
          style={{ background: BORDER, border:`1px solid #374151` }} />
        <div className="grid grid-cols-2 gap-3">
          <input type="text" value={budget} onChange={e => setBudget(e.target.value)}
            placeholder="Bidjè (ex: $80)" style={{ background: BORDER, border:`1px solid #374151` }}
            className="rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ background: BORDER, border:`1px solid #374151` }}
            className="rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
        </div>
        <button type="button" disabled={desc.trim().length < 5}
          onClick={() => onSubmit({ description: desc, budget, date })}
          className="w-full py-3 rounded-xl text-sm font-black active:scale-95 transition disabled:opacity-40"
          style={{ background: GOLD, color: BG }}>
          Voye Demand →
        </button>
        <button type="button" onClick={onClose} className="w-full text-sm text-slate-500 py-1">Anile</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION WRAPPER
// ═══════════════════════════════════════════════════════════════
function Section({ label, children, action, icon }) {
  return (
    <div className="mx-4 rounded-[20px] overflow-hidden" style={{ background: CARD, border:`1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: BORDER }}>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">{icon} {label}</p>
        {action}
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WORKER PROFILE SECTIONS
// ═══════════════════════════════════════════════════════════════

// 1. Professional Showcase ─────────────────────────────────────
function ShowcaseSection({ profile, onBook, navigate }) {
  const title = profile?.profession || profile?.role || 'Professional';
  return (
    <div className="mx-4 rounded-[20px] overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', border:`1px solid ${BORDER}` }}>
      {/* Video thumbnail */}
      <div className="relative h-36 flex items-center justify-center"
        style={{ background: 'linear-gradient(to bottom, #1e1b4b, #0f172a)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition"
          style={{ background:`${GOLD}25`, border:`2px solid ${GOLD}50` }}>
          <span className="text-2xl">▶</span>
        </div>
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <p className="text-[11px] text-slate-400 font-bold">▶ Watch Professional Intro · 45s</p>
        </div>
        {/* Availability pill */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black"
          style={{ background:'#10b98120', border:'1px solid #10b98140', color:'#10b981' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Available Now
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 divide-x" style={{ borderTop:`1px solid ${BORDER}`, divideColor: BORDER }}>
        {[
          { label:'Ane Eksperyans', value:'12+' },
          { label:'Pwojè Fini',    value: profile?.stats?.totalJobs ?? '47' },
          { label:'Nòt',           value: `${profile?.stats?.rating ?? 4.9}⭐` },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center py-3 px-2">
            <p className="text-[15px] font-black text-white">{s.value}</p>
            <p className="text-[9px] text-slate-500 text-center mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex gap-2 px-4 pb-4 pt-1">
        <button type="button" onClick={onBook}
          className="flex-1 py-3 rounded-xl text-[13px] font-black transition-all active:scale-95"
          style={{ background: GOLD, color: BG }}>
          🟢 Hire Now
        </button>
        <button type="button" onClick={() => navigate('/chat')}
          className="flex-1 py-3 rounded-xl text-[13px] font-black border transition-all active:scale-95"
          style={{ borderColor:`${GOLD}50`, color: GOLD, background:`${GOLD}10` }}>
          💬 Message
        </button>
      </div>
    </div>
  );
}

// 2. Stories row ────────────────────────────────────────────────
function StoriesRow() {
  const items = [
    { label:'My Story', icon:'👤', isOwn: true },
    { label:'Photos',   icon:'📸' },
    { label:'Videos',   icon:'🎥' },
    { label:'Live',     icon:'🔴' },
  ];
  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth:'none' }}>
      {items.map(s => (
        <div key={s.label} className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2"
            style={{ background:`${GOLD}15`, borderColor: s.isOwn ? GOLD : BORDER }}>
            {s.icon}
          </div>
          <p className="text-[9px] text-slate-400 font-bold">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// 4. About section ─────────────────────────────────────────────
function AboutSection({ profile }) {
  const bio = profile?.profileMetadata?.bio || profile?.bio ||
    'Civil construction worker with 12 years of experience in masonry, painting and plumbing. Available for local and international projects.';
  const [expanded, setExpanded] = useState(false);
  return (
    <Section label="About Me" icon="👤">
      <p className={`text-[13px] text-slate-300 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>{bio}</p>
      {bio.length > 120 && (
        <button type="button" onClick={() => setExpanded(e => !e)}
          className="text-[11px] font-bold mt-2 transition-colors" style={{ color: GOLD }}>
          {expanded ? 'Montre mwens ↑' : 'Wè plis ↓'}
        </button>
      )}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {[
          { label:'Ane Eksperyans', value:'12 ane'          },
          { label:'Estati',         value:'Disponib Kounye' },
          { label:'Kontra Pito',    value:'Tan Plen'        },
          { label:'Salè Espere',    value:'$900–1,200/sem'  },
        ].map(item => (
          <div key={item.label} className="p-2.5 rounded-xl" style={{ background: BORDER }}>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">{item.label}</p>
            <p className="text-[12px] font-black text-white mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// 5. Skills ────────────────────────────────────────────────────
function SkillsSection({ profile }) {
  const skills = profile?.skills || MOCK_SKILLS;
  return (
    <Section label="Skills" icon="🛠">
      <div className="flex flex-wrap gap-2">
        {skills.map((s, i) => (
          <span key={i} className="px-3 py-1.5 rounded-full text-[11px] font-black border transition-colors"
            style={{ background:`${GOLD}10`, borderColor:`${GOLD}30`, color: GOLD }}>
            {s}
          </span>
        ))}
      </div>
    </Section>
  );
}

// 6. Portfolio ─────────────────────────────────────────────────
function PortfolioSection() {
  const photos = MOCK_PORTFOLIO;
  return (
    <Section label="Portfolio" icon="🖼">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((icon, i) => (
          <div key={i}
            className="aspect-square rounded-xl flex items-center justify-center text-3xl cursor-pointer hover:opacity-80 transition-all active:scale-95"
            style={{ background: BORDER }}>
            {icon}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        {[{ icon:'🎥', label:'Video' }, { icon:'📄', label:'CV/PDF' }, { icon:'🏆', label:'Sètifika' }].map(a => (
          <button key={a.label} type="button"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95"
            style={{ borderColor: BORDER, color:'#94a3b8', background:'transparent' }}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>
    </Section>
  );
}

// 7. Reviews ───────────────────────────────────────────────────
function ReviewsSection({ avgRating }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Section label="Reviews" icon="⭐"
      action={
        <span className="text-[11px] font-black" style={{ color: GOLD }}>
          {avgRating.toFixed(1)} · 126 Reviews
        </span>
      }>
      {/* Star breakdown */}
      <div className="space-y-2 mb-4">
        {MOCK_REVIEWS_BREAKDOWN.map(r => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 w-28 shrink-0">{r.label}</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: BORDER }}>
              <div className="h-full rounded-full" style={{ width:`${(r.stars/5)*100}%`, background: GOLD }} />
            </div>
            <span className="text-[10px] font-black shrink-0" style={{ color: GOLD }}>{r.stars.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {(expanded ? MOCK_REVIEWS : MOCK_REVIEWS.slice(0, 2)).map((r, idx, arr) => (
          <div key={r.id}>
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{ background: BORDER }}>
                {r.photo ? <img src={r.photo} alt={r.name} className="w-full h-full rounded-full" /> : '👤'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-black text-white">{r.name}</p>
                  <div className="flex">
                    {Array.from({ length: r.stars }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{r.text}</p>
                <p className="text-[9px] text-slate-600 mt-1">{r.time}</p>
              </div>
            </div>
            {idx < arr.length - 1 && <div className="h-px mt-3" style={{ background: BORDER }} />}
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setExpanded(e => !e)}
        className="w-full mt-3 py-2 text-[11px] font-bold rounded-xl border transition-all"
        style={{ borderColor: BORDER, color:'#94a3b8' }}>
        {expanded ? 'Montre mwens' : `Wè tout 126 Reviews →`}
      </button>
    </Section>
  );
}

// 8. Experience ────────────────────────────────────────────────
function ExperienceSection() {
  return (
    <Section label="Experience" icon="💼">
      <div className="space-y-0">
        {MOCK_EXPERIENCE.map((exp, idx, arr) => (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm"
                style={{ background:`${GOLD}20`, border:`1px solid ${GOLD}40` }}>
                🏗
              </div>
              {idx < arr.length - 1 && <div className="w-px flex-1 mt-1.5 mb-1.5" style={{ background: BORDER }} />}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-black text-white">{exp.role}</p>
                  <p className="text-[11px] text-slate-400">{exp.company}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">{exp.period}</p>
                  {exp.current && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-emerald-400"
                      style={{ background:'#10b98120' }}>Kounye a</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// 9. Education ─────────────────────────────────────────────────
function EducationSection() {
  return (
    <Section label="Education & Certifications" icon="🎓">
      <div className="space-y-0">
        {MOCK_EDUCATION.map((ed, idx, arr) => (
          <React.Fragment key={idx}>
            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: BORDER }}>
                {ed.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-black text-white truncate">{ed.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{ed.place} · {ed.year}</p>
              </div>
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            </div>
            {idx < arr.length - 1 && <div className="h-px" style={{ background: BORDER }} />}
          </React.Fragment>
        ))}
      </div>
    </Section>
  );
}

// 10. Availability ─────────────────────────────────────────────
function AvailabilitySection() {
  const statuses = [
    { id:'now',      label:'Available Now',   color:'#10b981', active: true  },
    { id:'tomorrow', label:'Demain',           color:'#6366f1', active: false },
    { id:'busy',     label:'Okipe',            color:'#f59e0b', active: false },
    { id:'vacation', label:'Vakans',           color:'#64748b', active: false },
    { id:'emer',     label:'Ijans Sèlman',     color:'#ef4444', active: false },
  ];
  return (
    <Section label="Availability" icon="📅">
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <span key={s.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black border"
            style={s.active
              ? { background:`${s.color}20`, borderColor:`${s.color}50`, color: s.color }
              : { background:'transparent', borderColor: BORDER, color:'#475569' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.active ? s.color : '#475569' }} />
            {s.label}
          </span>
        ))}
      </div>
      {/* Week mini-calendar */}
      <div className="mt-3 grid grid-cols-7 gap-1">
        {['L','M','M','J','V','S','D'].map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <p className="text-[9px] text-slate-600 font-bold">{d}</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black"
              style={i < 5
                ? { background:'#10b98120', border:'1px solid #10b98140', color:'#10b981' }
                : { background: BORDER, color:'#475569' }}>
              {11 + i}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// 11. Services ─────────────────────────────────────────────────
function ServicesSection({ onBook }) {
  return (
    <Section label="Services Ofri" icon="🛎">
      <div className="space-y-0">
        {MOCK_SERVICES.map((svc, idx, arr) => (
          <React.Fragment key={svc.name}>
            <div className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: BORDER }}>
                {svc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-white">{svc.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{svc.price}</p>
              </div>
              {svc.available ? (
                <button type="button" onClick={onBook}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-black transition-all active:scale-95"
                  style={{ background: GOLD, color: BG }}>
                  Book
                </button>
              ) : (
                <span className="px-3 py-1.5 rounded-xl text-[10px] font-bold"
                  style={{ background: BORDER, color:'#64748b' }}>Okipe</span>
              )}
            </div>
            {idx < arr.length - 1 && <div className="h-px" style={{ background: BORDER }} />}
          </React.Fragment>
        ))}
      </div>
    </Section>
  );
}

// 15. AI Match ─────────────────────────────────────────────────
function AIMatchSection() {
  return (
    <Section label="AI Compatibility" icon="✨">
      <div className="space-y-3">
        {MOCK_AI_MATCH.map(m => (
          <div key={m.cat} className="flex items-center gap-3">
            <span className="text-[12px] text-slate-300 w-36 shrink-0">{m.cat}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: BORDER }}>
              <div className="h-full rounded-full transition-all" style={{ width:`${m.pct}%`, background: m.color }} />
            </div>
            <span className="text-[11px] font-black shrink-0 w-8 text-right" style={{ color: m.color }}>{m.pct}%</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-600 mt-3">Kalkilasyon baze sou eksperyans, sètifika, ak revizyon ou yo.</p>
    </Section>
  );
}

// 16. Contact ──────────────────────────────────────────────────
function ContactSection({ navigate }) {
  const contacts = [
    { icon: <MessageSquare className="w-5 h-5" />, label:'Message',     action: () => navigate('/chat'), color:'#6366f1' },
    { icon: <Phone className="w-5 h-5" />,         label:'Voice Call',  action: () => navigate('/chat'), color:'#10b981' },
    { icon: <Video className="w-5 h-5" />,         label:'Video Call',  action: () => navigate('/chat'), color:'#f97316' },
    { icon: '📧',                                   label:'Email',       action: () => {},                color:'#3b82f6' },
    { icon: '💬',                                   label:'WhatsApp',    action: () => {},                color:'#25d366' },
  ];
  return (
    <Section label="Contact" icon="📞">
      <div className="grid grid-cols-5 gap-2">
        {contacts.map(c => (
          <button key={c.label} type="button" onClick={c.action}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95"
            style={{ borderColor: BORDER, background:'transparent' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background:`${c.color}20`, color: c.color }}>
              {typeof c.icon === 'string' ? c.icon : c.icon}
            </div>
            <span className="text-[8px] text-slate-500 font-bold text-center leading-tight">{c.label}</span>
          </button>
        ))}
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// BUSINESS PROFILE SECTIONS
// ═══════════════════════════════════════════════════════════════
function BusinessProfile({ profile, navigate, onDemand }) {
  const name     = profile?.name || 'Business';
  const role     = profile?.role || 'business';
  const city     = profile?.location?.city || profile?.city || '';
  const roleIcon = { hotel:'🏨', restaurant:'🍽', clinic:'🩺', hospital:'🏥', tourism:'✈', company:'🏢' }[role] || '🏪';

  return (
    <div className="space-y-3">
      {/* Cover + Logo */}
      <div className="mx-4 rounded-[20px] overflow-hidden" style={{ background: CARD, border:`1px solid ${BORDER}` }}>
        <div className="h-28 flex items-center justify-center text-6xl"
          style={{ background:'linear-gradient(135deg, #1e1b4b, #0f172a)' }}>
          {roleIcon}
        </div>
        <div className="px-4 pb-4">
          <div className="-mt-6 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-4 mb-2"
            style={{ background: CARD, borderColor: BG }}>
            {roleIcon}
          </div>
          <h2 className="text-xl font-black text-white">{name}</h2>
          <p className="text-sm text-slate-400 capitalize">{role}</p>
          {city && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{city}</p>}
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={onDemand}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-black transition-all active:scale-95"
              style={{ background: GOLD, color: BG }}>
              📅 Rezève
            </button>
            <button type="button" onClick={() => navigate('/chat')}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-black border transition-all active:scale-95"
              style={{ borderColor:`${GOLD}50`, color: GOLD, background:`${GOLD}10` }}>
              💬 Kontakte
            </button>
          </div>
        </div>
      </div>

      {/* Business info */}
      <Section label="À Propos" icon="ℹ️">
        <p className="text-[13px] text-slate-300 leading-relaxed">
          {profile?.bio || `${name} se yon biznis kap ofri sèvis kalite nan ${city || 'rejyon an'}.`}
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[
            { label:'Orè',     value:'8h AM – 10h PM' },
            { label:'Estati',  value:'🟢 Ouvè Kounye' },
            { label:'Sit Web', value:'www.example.com' },
            { label:'Tel',     value:'+509 XXXX-XXXX'  },
          ].map(item => (
            <div key={item.label} className="p-2.5 rounded-xl" style={{ background: BORDER }}>
              <p className="text-[9px] text-slate-500 font-bold uppercase">{item.label}</p>
              <p className="text-[11px] font-black text-white mt-0.5 truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Business links */}
      <div className="mx-4 rounded-[20px] overflow-hidden" style={{ background: CARD, border:`1px solid ${BORDER}` }}>
        {[
          { icon:'🛒', label:'Pwodwi & Sèvis',   action: () => navigate('/market')   },
          { icon:'📸', label:'Galri Foto',        action: () => {}                    },
          { icon:'👥', label:'Anplwaye',          action: () => {}                    },
          { icon:'💼', label:'Pòs Disponib',      action: () => navigate('/jobs')     },
          { icon:'📅', label:'Rezèvasyon',        action: () => navigate('/booking')  },
          { icon:'⭐', label:'Revizyon (126)',     action: () => {}                    },
          { icon:'📍', label:'Lokasyon & Kat',    action: () => {}                    },
          { icon:'🌿', label:'Branchi',            action: () => {}                    },
        ].map((item, idx, arr) => (
          <React.Fragment key={item.label}>
            <button type="button" onClick={item.action}
              className="flex items-center gap-3 w-full px-4 py-4 hover:bg-white/[0.015] transition-colors text-left active:bg-white/[0.025]">
              <span className="text-xl w-7">{item.icon}</span>
              <span className="flex-1 text-[13px] font-bold text-slate-300">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
            {idx < arr.length - 1 && <div className="h-px mx-4" style={{ background: BORDER }} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROFILE FOOTER
// ═══════════════════════════════════════════════════════════════
function ProfileFooter({ profile, navigate }) {
  const [showQr, setShowQr] = useState(false);
  const actions = [
    { icon:'📤', label:'Pataje Pwofil',  action: () => navigator.share?.({ title: profile?.name, url: window.location.href }).catch(() => {}) },
    { icon:'🔗', label:'Kopye Lyen',    action: () => { navigator.clipboard?.writeText(window.location.href).catch(() => {}); } },
    { icon:'📱', label:'QR Code',        action: () => setShowQr(true) },
    { icon:'⬇',  label:'Telechaje CV',   action: () => {} },
    { icon:'🚩', label:'Rapòte',         action: () => {} },
    { icon:'🚫', label:'Bloke',          action: () => {} },
  ];
  return (
    <>
      <div className="mx-4 rounded-[20px] overflow-hidden" style={{ background: CARD, border:`1px solid ${BORDER}` }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: BORDER }}>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Opsyon Pwofil</p>
        </div>
        {actions.map((a, idx, arr) => (
          <React.Fragment key={a.label}>
            <button type="button" onClick={a.action}
              className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-white/[0.015] transition-colors text-left active:bg-white/[0.025]"
              style={{ color: a.label === 'Rapòte' || a.label === 'Bloke' ? '#ef4444' : '#94a3b8' }}>
              <span className="text-base w-5">{a.icon}</span>
              <span className="flex-1 text-[13px] font-bold">{a.label}</span>
            </button>
            {idx < arr.length - 1 && <div className="h-px mx-4" style={{ background: BORDER }} />}
          </React.Fragment>
        ))}
      </div>
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowQr(false)}>
          <div className="rounded-[24px] p-8 flex flex-col items-center gap-4"
            style={{ background: CARD, border:`1px solid ${BORDER}` }}>
            <div className="w-40 h-40 rounded-2xl flex items-center justify-center text-8xl"
              style={{ background: BORDER }}>
              📱
            </div>
            <p className="text-white font-black">{profile?.name}</p>
            <p className="text-slate-500 text-sm">Skane pou wè pwofil la</p>
            <button type="button" onClick={() => setShowQr(false)}
              className="px-6 py-2 rounded-full text-sm font-bold border" style={{ borderColor: BORDER, color:'#94a3b8' }}>
              Fèmen
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════
export default function PublicProfileScreen() {
  const { userId }   = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { user: me } = useAuth();

  const seed = location.state?.profile || null;
  const [profile,    setProfile]    = useState(seed);
  const [loading,    setLoading]    = useState(!seed);
  const [followed,   setFollowed]   = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showDemand, setShowDemand] = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg); setTimeout(() => setToast(null), 2500);
  }, []);

  // Fetch profile
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    API.get(`/users/${userId}`, { timeout: 12000 })
      .then(res => {
        if (!alive) return;
        const u = res?.data?.data?.user || res?.data?.user || res?.data;
        if (u) setProfile(p => ({ ...p, ...u }));
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [userId]);

  const submitRating = useCallback(({ stars, text }) => {
    setShowRating(false);
    API.post(`/users/${userId}/ratings`, { stars, comment: text }).catch(() => {});
    showToast(`Ou bay ${stars} ⭐`);
  }, [userId, showToast]);

  const submitDemand = useCallback(({ description, budget, date }) => {
    setShowDemand(false);
    API.post('/jobs', { targetUserId: userId, description, budget, preferredDate: date, status: 'pending' }).catch(() => {});
    showToast('Demand voye avèk siksè! ✓');
  }, [userId, showToast]);

  // Derived values
  const isBiz    = BIZ_ROLES.has(profile?.role);
  const isEnt    = ENT_ROLES.has(profile?.role);
  const avgRating = profile?.stats?.rating ?? profile?.rating ?? 4.9;
  const photo     = profile?.profileMetadata?.profilePhoto || profile?.photo
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile?.name || 'u')}`;
  const name     = profile?.name || 'Itilizatè';
  const profession = profile?.profession || profile?.role || 'Professional';
  const city     = profile?.location?.city || profile?.city || '';
  const country  = profile?.location?.country || '';

  // Verified badges derived from profile flags
  const badges = [
    { label:'Idantite Verifye',  ok: profile?.identityVerified  ?? true  },
    { label:'Telefòn Verifye',   ok: profile?.phoneVerified     ?? true  },
    { label:'Imèl Verifye',      ok: profile?.emailVerified     ?? true  },
    { label:'Background Check',  ok: profile?.backgroundChecked ?? false },
    { label:'Premium',           ok: profile?.premium           ?? false },
  ].filter(b => b.ok);

  if (loading && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400" style={{ background: BG }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor:`${GOLD}40`, borderTopColor: GOLD }} />
          <p className="text-sm">Ap chaje pwofil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4 text-slate-400" style={{ background: BG }}>
        <span className="text-5xl">👤</span>
        <p className="font-bold">Pa jwenn pwofil sa a</p>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: GOLD }}>
          <ArrowLeft className="w-4 h-4" /> Retounen
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 text-white" style={{ background: BG }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-2xl shadow-xl text-sm font-bold"
          style={{ background:'#10b981', color:'#fff' }}>
          {toast}
        </div>
      )}

      {/* Modals */}
      {showRating && <RatingModal target={profile} onClose={() => setShowRating(false)} onSubmit={submitRating} />}
      {showDemand && <DemandModal target={profile} onClose={() => setShowDemand(false)} onSubmit={submitDemand} />}

      {/* ── HEADER: Photo + Name + Badges + Actions ──────────────── */}
      <div className="relative px-4 pt-4 pb-5"
        style={{ background:`linear-gradient(to bottom, ${CARD} 0%, ${BG} 100%)`, borderBottom:`1px solid ${BORDER}` }}>

        <button type="button" onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-slate-400 text-sm mb-4 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Retounen
        </button>

        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <img src={photo} alt={name}
              className="w-20 h-20 rounded-[20px] object-cover border-2"
              style={{ borderColor: GOLD + '60' }}
              onError={e => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=u`; }} />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 bg-green-400 animate-pulse"
              style={{ borderColor: BG }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-white leading-tight">{name}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] text-green-400 font-bold">🟢 Available Now</span>
            </div>
            <p className="text-[12px] text-slate-400 mt-0.5">🏗 {profession}</p>
            {(city || country) && (
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />{[city, country].filter(Boolean).join(', ')}
              </p>
            )}
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <Globe className="w-3 h-3 shrink-0" /> Available Worldwide
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5">🗣 English · Français · Español · Kreyòl</p>
          </div>
        </div>

        {/* Verified badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {badges.map(b => (
              <span key={b.label} className="flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full"
                style={{ background:'#10b98115', border:'1px solid #10b98130', color:'#10b981' }}>
                <CheckCircle className="w-3 h-3" /> {b.label}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-4 overflow-x-auto" style={{ scrollbarWidth:'none' }}>
          {[
            { icon: followed ? '✓':'➕', label: followed ? 'Following':'Follow',
              action: () => { setFollowed(f=>!f); showToast(followed ? 'Unfollow' : 'Following ✓'); },
              primary: !followed },
            { icon:'💬', label:'Message',    action: () => navigate('/chat')  },
            { icon:'📞', label:'Voice Call', action: () => navigate('/chat')  },
            { icon:'📹', label:'Video Call', action: () => navigate('/chat')  },
            { icon:'📤', label:'Share',
              action: () => navigator.share?.({ title: name, url: window.location.href }).catch(() => {}) },
            { icon: saved ? '🔖':'🔖', label: saved ? 'Saved':'Save',
              action: () => { setSaved(s=>!s); showToast(saved ? 'Retire' : 'Sove ✓'); } },
          ].map(btn => (
            <button key={btn.label} type="button" onClick={btn.action}
              className="shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all active:scale-95"
              style={btn.primary
                ? { background: GOLD, borderColor: GOLD, color: BG }
                : saved && btn.label === 'Saved'
                  ? { background:`${GOLD}20`, borderColor:`${GOLD}40`, color: GOLD }
                  : { background: CARD, borderColor: BORDER, color:'#94a3b8' }}>
              <span className="text-base leading-none">{btn.icon}</span>
              <span className="text-[8px] font-bold">{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Rating quick-bar */}
        <div className="flex items-center justify-between mt-4 px-1">
          <div className="flex items-center gap-1.5">
            {[1,2,3,4,5].map(n => (
              <Star key={n} className="w-4 h-4" fill={n <= Math.round(avgRating) ? GOLD : 'none'}
                style={{ color: n <= Math.round(avgRating) ? GOLD : '#374151' }} />
            ))}
            <span className="text-[12px] font-black ml-1" style={{ color: GOLD }}>{avgRating.toFixed(1)}</span>
            <span className="text-[11px] text-slate-500">(126 Reviews)</span>
          </div>
          <button type="button" onClick={() => setShowRating(true)}
            className="text-[10px] font-black px-3 py-1 rounded-full border transition-all active:scale-95"
            style={{ borderColor:`${GOLD}40`, color: GOLD, background:`${GOLD}10` }}>
            Bay Nòt
          </button>
        </div>
      </div>

      {/* ── PAGE CONTENT ──────────────────────────────────────────── */}
      <div className="space-y-3 mt-3">

        {/* BUSINESS / COMPANY PROFILE */}
        {isBiz ? (
          <BusinessProfile profile={profile} navigate={navigate} onDemand={() => setShowDemand(true)} />
        ) : (
          /* WORKER PROFILE — all 19 sections */
          <>
            {/* 1. Professional Showcase */}
            <ShowcaseSection profile={profile} onBook={() => setShowDemand(true)} navigate={navigate} />

            {/* 2. Stories */}
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-4">📸 Stories & Media</p>
              <StoriesRow />
            </div>

            {/* 3. About */}
            <AboutSection profile={profile} />

            {/* 4. Skills */}
            <SkillsSection profile={profile} />

            {/* 5. Portfolio */}
            <PortfolioSection />

            {/* 6. Reviews */}
            <ReviewsSection avgRating={avgRating} />

            {/* 7. Experience */}
            <ExperienceSection />

            {/* 8. Education */}
            <EducationSection />

            {/* 9. Availability */}
            <AvailabilitySection />

            {/* 10. Services */}
            <ServicesSection onBook={() => setShowDemand(true)} />

            {/* 11. Jobs Hub quick links */}
            <div className="mx-4 rounded-[20px] overflow-hidden" style={{ background: CARD, border:`1px solid ${BORDER}` }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: BORDER }}>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">💼 Jobs</p>
              </div>
              {[
                { icon:'✅', label:'Applied Jobs',   action: () => navigate('/jobs') },
                { icon:'🔖', label:'Saved Jobs',     action: () => navigate('/jobs') },
                { icon:'✔',  label:'Completed Jobs', action: () => navigate('/jobs') },
                { icon:'🟢', label:'Current Jobs',   action: () => navigate('/jobs') },
              ].map((item, idx, arr) => (
                <React.Fragment key={item.label}>
                  <button type="button" onClick={item.action}
                    className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-white/[0.015] transition-colors text-left active:bg-white/[0.025]">
                    <span className="text-base">{item.icon}</span>
                    <span className="flex-1 text-[13px] font-bold text-slate-300">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-700" />
                  </button>
                  {idx < arr.length - 1 && <div className="h-px mx-4" style={{ background: BORDER }} />}
                </React.Fragment>
              ))}
            </div>

            {/* 12. AI Match */}
            <AIMatchSection />

            {/* 13. Contact */}
            <ContactSection navigate={navigate} />

            {/* 14. Wallet (summary only on public profile) */}
            <div className="mx-4 rounded-[20px] overflow-hidden" style={{ background: CARD, border:`1px solid ${BORDER}` }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: BORDER }}>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">💳 Wallet</p>
              </div>
              <button type="button" onClick={() => navigate('/wallet')}
                className="flex items-center gap-3 w-full px-4 py-4 hover:bg-white/[0.015] transition-colors text-left active:bg-white/[0.025]">
                <span className="text-2xl">💳</span>
                <div className="flex-1">
                  <p className="text-[13px] font-black text-white">Send Money · Transfer</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Escrow · Split Payment · Invoice</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </button>
            </div>
          </>
        )}

        {/* Footer (all profile types) */}
        <ProfileFooter profile={profile} navigate={navigate} />
      </div>
    </div>
  );
}
