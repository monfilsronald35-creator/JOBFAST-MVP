import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Star, CheckCircle, ChevronRight, MapPin, Globe,
  Phone, MessageSquare, Video, Share2,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

const BG = '#050B18'; const CARD = '#111827'; const BORDER = '#1F2937'; const GOLD = '#FACC15';

const lsGet = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ── Role detection ─────────────────────────────────────────────
const BIZ_ROLES  = new Set(['shop','business','hotel','restaurant','clinic','hospital','tourism','supermarket','security']);
const ENT_ROLES  = new Set(['company','enterprise']);

// ── Tab sets per role ──────────────────────────────────────────
const WORKER_TABS = [
  { id:'showcase',   icon:'🎬', label:'Showcase'    },
  { id:'stories',    icon:'📸', label:'Stories'     },
  { id:'about',      icon:'👤', label:'About'       },
  { id:'skills',     icon:'🛠',  label:'Skills'      },
  { id:'portfolio',  icon:'🖼',  label:'Portfolio'   },
  { id:'reviews',    icon:'⭐',  label:'Reviews'     },
  { id:'experience', icon:'💼',  label:'Experience'  },
  { id:'services',   icon:'🛎',  label:'Services'    },
  { id:'jobs',       icon:'📋',  label:'Jobs'        },
  { id:'calendar',   icon:'📅',  label:'Calendar'    },
  { id:'wallet',     icon:'💳',  label:'Wallet'      },
  { id:'documents',  icon:'📄',  label:'Documents'   },
  { id:'ai',         icon:'✨',  label:'AI Career'   },
  { id:'stats',      icon:'📊',  label:'Stats'       },
  { id:'trust',      icon:'🛡',  label:'Trust'       },
  { id:'contact',    icon:'📞',  label:'Contact'     },
];
const SHOP_TABS = [
  { id:'store',    icon:'🏪', label:'Store'    }, { id:'products', icon:'🛒', label:'Products' },
  { id:'gallery',  icon:'📸', label:'Gallery'  }, { id:'reviews',  icon:'⭐', label:'Reviews'  },
  { id:'about',    icon:'ℹ️', label:'About'    }, { id:'contact',  icon:'📞', label:'Contact'  },
];
const REST_TABS = [
  { id:'menu',         icon:'🍽', label:'Menu'         }, { id:'reservations', icon:'📅', label:'Reservations' },
  { id:'gallery',      icon:'📸', label:'Gallery'      }, { id:'reviews',      icon:'⭐', label:'Reviews'      },
  { id:'about',        icon:'ℹ️', label:'About'        }, { id:'contact',      icon:'📞', label:'Contact'      },
];
const HOTEL_TABS = [
  { id:'rooms',   icon:'🛏', label:'Rooms'    }, { id:'gallery',  icon:'📸', label:'Gallery'  },
  { id:'services',icon:'🛎', label:'Services' }, { id:'events',   icon:'🎉', label:'Events'   },
  { id:'reviews', icon:'⭐', label:'Reviews'  }, { id:'about',    icon:'ℹ️', label:'About'    },
  { id:'contact', icon:'📞', label:'Contact'  },
];
const HOSP_TABS = [
  { id:'doctors',      icon:'👨‍⚕️', label:'Doctors'  }, { id:'appointments', icon:'📅', label:'Schedule' },
  { id:'departments',  icon:'🏥',  label:'Depts'    }, { id:'reviews',      icon:'⭐', label:'Reviews'  },
  { id:'about',        icon:'ℹ️',  label:'About'    }, { id:'contact',      icon:'📞', label:'Contact'  },
];
const COMPANY_TABS = [
  { id:'overview',    icon:'🏢', label:'Overview' }, { id:'jobs',       icon:'💼', label:'Jobs'     },
  { id:'team',        icon:'👥', label:'Team'     }, { id:'branches',   icon:'🌿', label:'Branches' },
  { id:'marketplace', icon:'🛒', label:'Market'   }, { id:'news',       icon:'📰', label:'News'     },
  { id:'reviews',     icon:'⭐', label:'Reviews'  }, { id:'contact',    icon:'📞', label:'Contact'  },
];
const ENT_TABS = [
  { id:'dashboard',   icon:'📊', label:'Dashboard' }, { id:'global',     icon:'🌍', label:'Global'   },
  { id:'employees',   icon:'👥', label:'Employees' }, { id:'analytics',  icon:'📈', label:'Analytics'},
  { id:'reports',     icon:'📋', label:'Reports'   }, { id:'marketplace',icon:'🛒', label:'Market'   },
  { id:'investors',   icon:'💼', label:'Investors' }, { id:'contact',    icon:'📞', label:'Contact'  },
];

function getTabsForRole(role) {
  if (role === 'restaurant')                    return REST_TABS;
  if (role === 'hotel')                         return HOTEL_TABS;
  if (role === 'hospital' || role === 'clinic') return HOSP_TABS;
  if (role === 'enterprise')                    return ENT_TABS;
  if (role === 'company')                       return COMPANY_TABS;
  if (BIZ_ROLES.has(role))                     return SHOP_TABS;
  return WORKER_TABS;
}

// ── Mock data ──────────────────────────────────────────────────
const MOCK_SKILLS = [
  { name:'Masonry',         level:'Master'      },
  { name:'Electrical',      level:'Expert'      },
  { name:'Safety',          level:'Expert'      },
  { name:'Leadership',      level:'Expert'      },
  { name:'Concrete',        level:'Expert'      },
  { name:'Painting',        level:'Professional'},
  { name:'Plumbing',        level:'Professional'},
  { name:'Heavy Equipment', level:'Professional'},
  { name:'Blueprint',       level:'Intermediate'},
  { name:'Roofing',         level:'Intermediate'},
];
const SKILL_LEVEL_COLOR = {
  Master:       { bg:'#FACC1520', border:'#FACC1540', text: GOLD     },
  Expert:       { bg:'#6366f120', border:'#6366f140', text:'#818cf8' },
  Professional: { bg:'#10b98120', border:'#10b98140', text:'#34d399' },
  Intermediate: { bg:'#f9731620', border:'#f9731640', text:'#fb923c' },
  Beginner:     { bg:'#64748b20', border:'#64748b40', text:'#94a3b8' },
};
const MOCK_EXPERIENCE = [
  { company:'ABC Construction', role:'Foreman',     period:'2022–2026', current:true,  icon:'🏗' },
  { company:'XYZ Builder',      role:'Electrician', period:'2018–2022', current:false, icon:'⚡' },
  { company:'Hotel Barceló',    role:'Maintenance', period:'2016–2018', current:false, icon:'🏨' },
];
const MOCK_EDUCATION = [
  { icon:'🎓', title:'BTP Elektrisite Industriyèl',    place:'INFP Haiti', year:'2016' },
  { icon:'📜', title:'Sètifika Sekirite Konstriksyon', place:'MTPTC',      year:'2020' },
  { icon:'🏆', title:'Lisans Elektrisyen Nivo 2',      place:'OIIH',       year:'2022' },
];
const MOCK_REVIEWS_CATS = [
  { label:'Quality',         stars:4.9 }, { label:'Communication', stars:4.8 },
  { label:'Speed',           stars:4.7 }, { label:'Professionalism',stars:5.0 },
  { label:'Cleanliness',     stars:4.9 }, { label:'Respect',        stars:5.0 },
  { label:'Safety',          stars:4.8 },
];
const MOCK_COMMENTS = [
  { id:1, name:'Jean-Paul Remy', stars:5, text:'Travay ekselan! Elektrisyen trè konpetan ak serye.', date:'15 Jiyè 2026' },
  { id:2, name:'Marie Solange',  stars:5, text:'Ponktiyèl, pwòp, ak pwofesyonèl. Mwen rekòmande l.', date:'8 Jiyè 2026' },
  { id:3, name:'Carlos Mendez',  stars:4, text:'Good electrician, finished on time and within budget.', date:'1 Jiyè 2026' },
  { id:4, name:'Lucie Bernard',  stars:5, text:'Sèvis trè rapid. Li ranje pwoblèm nan mwens pase 2 èdtan.', date:'25 Jen 2026' },
];
const MOCK_SERVICES = [
  { icon:'⚡', name:'Electrical',   price:'from $80/hr',   available:true  },
  { icon:'🎨', name:'Painting',     price:'from $60/hr',   available:true  },
  { icon:'🔧', name:'Plumbing',     price:'from $70/hr',   available:false },
  { icon:'🔍', name:'Inspection',   price:'from $50/visit',available:true  },
  { icon:'🛠', name:'Maintenance',  price:'from $45/hr',   available:true  },
  { icon:'💡', name:'Consultation', price:'from $30/hr',   available:true  },
];
const MOCK_TRUST = [
  { label:'Identity Verified',   ok:true  }, { label:'Face Verified',      ok:true  },
  { label:'Phone Verified',      ok:true  }, { label:'Email Verified',     ok:true  },
  { label:'Address Verified',    ok:true  }, { label:'Company Verified',   ok:false },
  { label:'Background Checked',  ok:true  }, { label:'Payment Verified',   ok:true  },
  { label:'Contracts Completed', ok:true  }, { label:'No Active Disputes', ok:true  },
];
const MOCK_AI_MATCH = [
  { cat:'Construction',      pct:92, color:'#FACC15' },
  { cat:'Electrical Work',   pct:89, color:'#6366f1' },
  { cat:'Hotel Maintenance', pct:85, color:'#10b981' },
  { cat:'Industrial Safety', pct:78, color:'#f97316' },
];
const MOCK_STATS = [
  { label:'Projects Done',    value:'245' }, { label:'Clients',        value:'180' },
  { label:'Followers',        value:'1.2K'}, { label:'Following',      value:'340' },
  { label:'Profile Views',    value:'8.4K'}, { label:'Response Rate',  value:'98%' },
  { label:'Response Time',    value:'3 min'},{ label:'Repeat Clients', value:'87%' },
  { label:'Countries Worked', value:'8'   }, { label:'Hiring Success', value:'94%' },
];

// ═══════════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════════
function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 justify-center">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className="transition active:scale-90">
          <Star className={`w-8 h-8 ${n<=value?'text-amber-400 fill-amber-400':'text-slate-600'}`} />
        </button>
      ))}
    </div>
  );
}
function RatingModal({ target, onClose, onSubmit }) {
  const [stars, setStars] = useState(5); const [text, setText] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-[28px] p-6 space-y-5" style={{ background:CARD, border:`1px solid ${BORDER}` }} onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background:BORDER }} />
        <p className="text-center text-white font-black text-base">⭐ Bay yon Nòt</p>
        <StarPicker value={stars} onChange={setStars} />
        <textarea value={text} onChange={e=>setText(e.target.value)} rows={3} placeholder="Komantè (opsyonèl)..."
          className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none resize-none" style={{ background:BORDER }} />
        <button type="button" onClick={()=>onSubmit({stars,text})} className="w-full py-3 rounded-xl text-sm font-black active:scale-95 transition" style={{ background:GOLD, color:BG }}>Voye Nòt</button>
        <button type="button" onClick={onClose} className="w-full text-sm text-slate-500 py-1">Anile</button>
      </div>
    </div>
  );
}
function DemandModal({ target, onClose, onSubmit }) {
  const [desc,setDesc]=useState(''); const [budget,setBudget]=useState(''); const [date,setDate]=useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-[28px] p-6 space-y-4" style={{ background:CARD, border:`1px solid ${BORDER}` }} onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background:BORDER }} />
        <p className="text-center text-white font-black text-base">📋 Book Service</p>
        <p className="text-center text-xs text-slate-400">{target?.name}</p>
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4} placeholder="Dekri travay ou bezwen fè a..."
          className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none resize-none" style={{ background:BORDER }} />
        <div className="grid grid-cols-2 gap-3">
          <input type="text" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Bidjè (ex: $80)" style={{ background:BORDER }} className="rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none" />
          <input type="date" value={date}   onChange={e=>setDate(e.target.value)}   style={{ background:BORDER }} className="rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
        </div>
        <button type="button" disabled={desc.trim().length<5} onClick={()=>onSubmit({description:desc,budget,date})} className="w-full py-3 rounded-xl text-sm font-black active:scale-95 transition disabled:opacity-40" style={{ background:GOLD, color:BG }}>Voye Demand →</button>
        <button type="button" onClick={onClose} className="w-full text-sm text-slate-500 py-1">Anile</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════
function Divider() { return <div className="h-px" style={{ background:BORDER }} />; }
function SectionTitle({ children }) {
  return <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">{children}</p>;
}
function EmptyTab({ icon, title, body }) {
  return (
    <div className="flex flex-col items-center justify-center pt-16 pb-8 px-6 text-center gap-3">
      <div className="w-16 h-16 rounded-[20px] flex items-center justify-center text-3xl" style={{ background:`${GOLD}10`, border:`1px solid ${GOLD}20` }}>{icon}</div>
      <p className="text-white font-black">{title}</p>
      <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WORKER TAB CONTENT
// ═══════════════════════════════════════════════════════════════

// 1 ─ Showcase ─────────────────────────────────────────────────
function ShowcaseTab({ profile, onBook, navigate }) {
  const rating = profile?.stats?.rating ?? 4.9;
  const jobs   = profile?.stats?.totalJobs ?? '47';
  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>▶ Intro Video</SectionTitle>
        <div className="rounded-[20px] overflow-hidden relative h-44 flex items-center justify-center cursor-pointer" style={{ background:'linear-gradient(135deg,#1e1b4b,#0f172a)', border:`1px solid ${BORDER}` }}>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background:`${GOLD}25`, border:`2px solid ${GOLD}60` }}>
              <span className="text-3xl">▶</span>
            </div>
            <p className="text-xs text-slate-400 font-bold">Professional Intro · 60 sec</p>
          </div>
          <div className="absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full" style={{ background:'#10b98120', border:'1px solid #10b98140', color:'#10b981' }}>🟢 Available Now</div>
        </div>
      </div>

      <div>
        <SectionTitle>📸 10 Best Photos</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {['🏗','⚡','🔧','🎨','🏠','🛠','🔨','🪚','🏢','💡'].map((e,i)=>(
            <div key={i} className="aspect-square rounded-xl flex items-center justify-center text-3xl cursor-pointer active:scale-95 transition-all" style={{ background:BORDER }}>{e}</div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[16px] p-3" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
          <SectionTitle>🏆 Awards</SectionTitle>
          {['Best Worker 2025','Safety Award','Top Rated'].map(a=>(
            <p key={a} className="text-[12px] text-slate-300 flex items-center gap-1.5 py-0.5"><span style={{ color:GOLD }}>★</span>{a}</p>
          ))}
        </div>
        <div className="rounded-[16px] p-3" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
          <SectionTitle>📜 Certificates</SectionTitle>
          {['BTP Electrical','OSHA Safety','OIIH Level 2'].map(c=>(
            <p key={c} className="text-[12px] text-slate-300 flex items-center gap-1.5 py-0.5"><CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />{c}</p>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>💼 Latest Projects</SectionTitle>
        <div className="rounded-[20px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
          {[
            { name:'Hotel Barceló Renovation',  type:'Electrical', date:'Jun 2026', icon:'🏨' },
            { name:'Residential Complex Wiring', type:'Electrical + Safety', date:'May 2026', icon:'🏠' },
            { name:'Office Building Inspection', type:'Inspection', date:'Apr 2026', icon:'🏢' },
          ].map((p, idx, arr)=>(
            <React.Fragment key={p.name}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background:BORDER }}>{p.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-white truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{p.type} · {p.date}</p>
                </div>
              </div>
              {idx < arr.length-1 && <Divider />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>⭐ Best Reviews</SectionTitle>
        <div className="rounded-[20px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
          {MOCK_COMMENTS.slice(0,2).map((r,idx)=>(
            <React.Fragment key={r.id}>
              <div className="px-4 py-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-black text-[12px]">{r.name}</span>
                  <div className="flex">{Array.from({length:r.stars}).map((_,i)=><Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}</div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{r.text}</p>
              </div>
              {idx < 1 && <Divider />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>📍 Service Area</SectionTitle>
        <div className="rounded-[20px] h-28 flex items-center justify-center" style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)', border:`1px solid ${BORDER}` }}>
          <div className="text-center"><p className="text-2xl">🗺</p><p className="text-xs text-slate-400 mt-1">Punta Cana · Dominican Republic · Worldwide</p></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[{l:'Ane Eksperyans',v:'10+'},{l:'Pwojè Fini',v:jobs},{l:'Nòt',v:`${rating}⭐`}].map(s=>(
          <div key={s.l} className="rounded-[14px] py-4 text-center" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
            <p className="text-xl font-black text-white">{s.v}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onBook} className="flex-1 py-3.5 rounded-xl font-black text-[13px] active:scale-95 transition" style={{ background:GOLD, color:BG }}>🟢 Hire Now</button>
        <button type="button" onClick={()=>navigate('/chat')} className="flex-1 py-3.5 rounded-xl font-black text-[13px] border active:scale-95 transition" style={{ borderColor:`${GOLD}50`, color:GOLD, background:`${GOLD}10` }}>📋 Book Service</button>
      </div>
    </div>
  );
}

// 2 ─ Stories ──────────────────────────────────────────────────
function StoriesTab() {
  const cats = [
    {icon:'👤',label:'My Story',expires:true},{icon:'🏗',label:'Projects'},{icon:'🔧',label:'Work'},
    {icon:'😊',label:'Clients'},{icon:'✈',label:'Travel'},{icon:'🎯',label:'Promotion',expires:true},
    {icon:'🔴',label:'Live'},{icon:'🔄',label:'Before/After'},{icon:'🏢',label:'Construction'},
    {icon:'🛒',label:'Products'},{icon:'🎉',label:'Events'},
  ];
  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-500">Stories yo disparèt apre 24 èdtan. Foto, video, live, oswa promo.</p>
      <div className="grid grid-cols-3 gap-3">
        {cats.map(c=>(
          <div key={c.label} className="flex flex-col items-center gap-2 p-3 rounded-[16px] cursor-pointer active:scale-95 transition" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl" style={{ border:`2px solid ${c.expires?GOLD:BORDER}` }}>{c.icon}</div>
            <p className="text-[10px] text-slate-300 font-bold text-center leading-tight">{c.label}</p>
            {c.expires && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ background:`${GOLD}20`, color:GOLD }}>24h</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// 3 ─ About ────────────────────────────────────────────────────
function AboutTab({ profile }) {
  const bio = profile?.bio || 'Civil construction worker with 10+ years of experience in electrical, painting, and plumbing. Available for local and international projects.';
  const [expanded, setExpanded] = useState(false);
  const details = [
    {l:'Years Experience',    v:'10+ Years'               },
    {l:'Languages',           v:'EN · Kreyòl · Français'  },
    {l:'Expected Salary',     v:'$900–1,200/week'         },
    {l:'Preferred Contract',  v:'Full-time'               },
    {l:'Travel Availability', v:'Yes — Worldwide'         },
    {l:'Work Permit',         v:'USA · Canada · EU'       },
    {l:'Passport',            v:'✔ Valid (2031)'          },
    {l:'Visa',                v:'Schengen + US B1/B2'     },
    {l:'Driving License',     v:'✔ Class B + Forklift'   },
  ];
  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Professional Summary</SectionTitle>
        <p className={`text-[13px] text-slate-300 leading-relaxed ${!expanded?'line-clamp-4':''}`}>{bio}</p>
        {bio.length>150 && <button type="button" onClick={()=>setExpanded(e=>!e)} className="text-[11px] font-bold mt-1.5" style={{ color:GOLD }}>{expanded?'Montre mwens ↑':'Wè plis ↓'}</button>}
      </div>
      <div>
        <SectionTitle>Key Details</SectionTitle>
        <div className="rounded-[20px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
          {details.map((d,idx,arr)=>(
            <React.Fragment key={d.l}>
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-[11px] text-slate-500">{d.l}</p>
                <p className="text-[12px] font-black text-white text-right max-w-[55%]">{d.v}</p>
              </div>
              {idx<arr.length-1 && <Divider />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// 4 ─ Skills ───────────────────────────────────────────────────
function SkillsTab() {
  const levels = ['Master','Expert','Professional','Intermediate','Beginner'];
  return (
    <div className="space-y-5">
      {levels.map(level=>{
        const group = MOCK_SKILLS.filter(s=>s.level===level);
        if (!group.length) return null;
        const col = SKILL_LEVEL_COLOR[level];
        return (
          <div key={level}>
            <SectionTitle>{level}</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {group.map(s=>(
                <span key={s.name} className="px-3 py-1.5 rounded-full text-[11px] font-black border" style={{ background:col.bg, borderColor:col.border, color:col.text }}>{s.name}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 5 ─ Portfolio ────────────────────────────────────────────────
function PortfolioTab() {
  const [sub, setSub] = useState('photos');
  const grid = ['🏗','⚡','🔧','🎨','🏠','🛠','🔨','🪚','🏢','💡','🔌','🪜'];
  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
        {['photos','videos','before/after','projects','certificates','pdf'].map(t=>(
          <button key={t} type="button" onClick={()=>setSub(t)} className="shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black border capitalize transition-all"
            style={sub===t?{background:GOLD,borderColor:GOLD,color:BG}:{background:'transparent',borderColor:BORDER,color:'#64748b'}}>{t}</button>
        ))}
      </div>
      {sub==='photos' && <div className="grid grid-cols-3 gap-2">{grid.map((e,i)=><div key={i} className="aspect-square rounded-xl flex items-center justify-center text-3xl cursor-pointer active:scale-95 transition" style={{ background:BORDER }}>{e}</div>)}</div>}
      {sub==='videos' && <div className="grid grid-cols-2 gap-2">{['🏗','🔧','⚡','🎨'].map((e,i)=><div key={i} className="aspect-video rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer" style={{ background:BORDER }}><span className="text-3xl">{e}</span><span className="text-[9px] text-slate-500">▶ {2+i}:30</span></div>)}</div>}
      {sub==='before/after' && (
        <div className="space-y-3">
          {[{b:'🏚',a:'🏠',label:'Residential Wiring'},{b:'🔌',a:'⚡',label:'Panel Upgrade'}].map(p=>(
            <div key={p.label} className="rounded-[16px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
              <div className="grid grid-cols-2" style={{ borderBottom:`1px solid ${BORDER}` }}>
                <div className="flex flex-col items-center py-6 gap-1"><span className="text-4xl">{p.b}</span><span className="text-[9px] text-slate-600">BEFORE</span></div>
                <div className="flex flex-col items-center py-6 gap-1 border-l" style={{ borderColor:BORDER }}><span className="text-4xl">{p.a}</span><span className="text-[9px] text-emerald-500">AFTER</span></div>
              </div>
              <p className="text-center text-[11px] font-bold text-slate-400 py-2">{p.label}</p>
            </div>
          ))}
        </div>
      )}
      {(sub==='projects'||sub==='certificates'||sub==='pdf') && <EmptyTab icon={sub==='pdf'?'📄':'💼'} title={`Pa gen ${sub} yo`} body="Seksyon sa a pral disponib byento." />}
    </div>
  );
}

// 6 ─ Reviews ──────────────────────────────────────────────────
function ReviewsTab({ avgRating=4.9, total=126 }) {
  const [showAll, setShowAll] = useState(false);
  return (
    <div className="space-y-5">
      <div className="rounded-[20px] p-4 flex items-center gap-4" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
        <div className="text-center shrink-0">
          <p className="text-4xl font-black" style={{ color:GOLD }}>{avgRating.toFixed(1)}</p>
          <div className="flex mt-1">{[1,2,3,4,5].map(n=><Star key={n} className="w-3.5 h-3.5" fill={n<=Math.round(avgRating)?GOLD:'none'} style={{ color:n<=Math.round(avgRating)?GOLD:'#374151' }} />)}</div>
          <p className="text-[10px] text-slate-500 mt-1">{total} Reviews</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {MOCK_REVIEWS_CATS.map(r=>(
            <div key={r.label} className="flex items-center gap-2">
              <span className="text-[9px] text-slate-500 w-24 shrink-0">{r.label}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:BORDER }}>
                <div className="h-full rounded-full" style={{ width:`${(r.stars/5)*100}%`, background:GOLD }} />
              </div>
              <span className="text-[9px] font-black shrink-0 w-6" style={{ color:GOLD }}>{r.stars}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionTitle>Tout Kòmantè</SectionTitle>
        <div className="rounded-[20px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
          {(showAll?MOCK_COMMENTS:MOCK_COMMENTS.slice(0,2)).map((r,idx,arr)=>(
            <React.Fragment key={r.id}>
              <div className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background:BORDER }}>👤</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[12px] font-black text-white">{r.name}</p>
                      <div className="flex">{Array.from({length:r.stars}).map((_,i)=><Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}</div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{r.text}</p>
                    <p className="text-[9px] text-slate-600 mt-1.5">{r.date}</p>
                  </div>
                </div>
              </div>
              {idx<arr.length-1 && <Divider />}
            </React.Fragment>
          ))}
        </div>
        <button type="button" onClick={()=>setShowAll(v=>!v)} className="w-full mt-2 py-2.5 text-[11px] font-bold rounded-xl border transition-all" style={{ borderColor:BORDER, color:'#64748b' }}>
          {showAll?'Montre mwens':`Wè tout ${total} Reviews →`}
        </button>
      </div>
    </div>
  );
}

// 7 ─ Experience + Education ───────────────────────────────────
function ExperienceTab() {
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>💼 Work Experience</SectionTitle>
        <div className="space-y-0">
          {MOCK_EXPERIENCE.map((exp,idx,arr)=>(
            <div key={idx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background:`${GOLD}20`, border:`1px solid ${GOLD}40` }}>{exp.icon}</div>
                {idx<arr.length-1 && <div className="w-px flex-1 mt-1.5 mb-1.5" style={{ background:BORDER }} />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div><p className="text-[13px] font-black text-white">{exp.role}</p><p className="text-[11px] text-slate-400">{exp.company}</p></div>
                  <div className="text-right"><p className="text-[10px] text-slate-500">{exp.period}</p>{exp.current && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-emerald-400" style={{ background:'#10b98120' }}>Kounye a</span>}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionTitle>🎓 Education & Certifications</SectionTitle>
        <div className="rounded-[20px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
          {MOCK_EDUCATION.map((ed,idx,arr)=>(
            <React.Fragment key={idx}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background:BORDER }}>{ed.icon}</div>
                <div className="flex-1 min-w-0"><p className="text-[12px] font-black text-white truncate">{ed.title}</p><p className="text-[10px] text-slate-500 mt-0.5">{ed.place} · {ed.year}</p></div>
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              </div>
              {idx<arr.length-1 && <Divider />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// 8 ─ Services ─────────────────────────────────────────────────
function ServicesTab({ onBook }) {
  return (
    <div className="rounded-[20px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
      {MOCK_SERVICES.map((s,idx,arr)=>(
        <React.Fragment key={s.name}>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background:BORDER }}>{s.icon}</div>
            <div className="flex-1 min-w-0"><p className="text-[13px] font-black text-white">{s.name}</p><p className="text-[11px] text-slate-500 mt-0.5">{s.price}</p></div>
            {s.available
              ? <button type="button" onClick={onBook} className="px-3 py-1.5 rounded-xl text-[10px] font-black active:scale-95 transition" style={{ background:GOLD, color:BG }}>Book</button>
              : <span className="px-3 py-1.5 rounded-xl text-[10px] font-bold" style={{ background:BORDER, color:'#64748b' }}>Busy</span>
            }
          </div>
          {idx<arr.length-1 && <Divider />}
        </React.Fragment>
      ))}
    </div>
  );
}

// 9 ─ Jobs ─────────────────────────────────────────────────────
function JobsTab({ navigate }) {
  const [sub, setSub] = useState('applied');
  const subs = ['applied','current','completed','saved','rejected','invitations'];
  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
        {subs.map(t=>(
          <button key={t} type="button" onClick={()=>setSub(t)} className="shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black border capitalize transition-all"
            style={sub===t?{background:GOLD,borderColor:GOLD,color:BG}:{background:'transparent',borderColor:BORDER,color:'#64748b'}}>{t}</button>
        ))}
      </div>
      <button type="button" onClick={()=>navigate('/jobs')} className="w-full py-3 rounded-xl text-[12px] font-black border active:scale-95 transition flex items-center justify-center gap-2"
        style={{ borderColor:`${GOLD}40`, color:GOLD, background:`${GOLD}08` }}>
        💼 Wè tout Jobs → Jobs Hub
      </button>
      <EmptyTab icon={['✅','🟢','✔','🔖','❌','📬'][subs.indexOf(sub)]} title={`Pa gen jobs ${sub}`} body="Ale nan Jobs Hub pou jwenn ak aplike pou jobs." />
    </div>
  );
}

// 10 ─ Calendar ────────────────────────────────────────────────
function CalendarTab() {
  const [view, setView] = useState('week');
  const statuses = [
    {l:'Available Now',color:'#10b981',on:true},{l:'Busy',color:'#f59e0b',on:false},
    {l:'Vacation',color:'#64748b',on:false},{l:'Emergency',color:'#ef4444',on:false},
    {l:'Weekend OK',color:'#6366f1',on:false},{l:'Night Shift',color:'#8b5cf6',on:false},
    {l:'Remote',color:'#3b82f6',on:false},{l:'On Site',color:'#10b981',on:false},
  ];
  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Estati Disponibilite</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {statuses.map(s=>(
            <span key={s.l} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border"
              style={s.on?{background:`${s.color}20`,borderColor:`${s.color}40`,color:s.color}:{background:'transparent',borderColor:BORDER,color:'#475569'}}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background:s.on?s.color:'#475569' }} />{s.l}
            </span>
          ))}
        </div>
      </div>
      <div>
        <div className="flex gap-1.5 mb-3">
          {['today','tomorrow','week','month'].map(v=>(
            <button key={v} type="button" onClick={()=>setView(v)} className="px-3 py-1.5 rounded-full text-[10px] font-black border capitalize transition-all"
              style={view===v?{background:GOLD,borderColor:GOLD,color:BG}:{background:'transparent',borderColor:BORDER,color:'#64748b'}}>{v}</button>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['L','M','M','J','V','S','D'].map((d,i)=>(
            <div key={i} className="flex flex-col items-center gap-1">
              <p className="text-[9px] text-slate-600 font-bold">{d}</p>
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[11px] font-black"
                style={i<5?{background:'#10b98118',border:'1px solid #10b98130',color:'#10b981'}:{background:BORDER,color:'#475569'}}>{11+i}</div>
            </div>
          ))}
        </div>
      </div>
      <EmptyTab icon="📅" title="Appointments & Reservations" body="Kliyan ka Book yon sèvis pou wè yon randevou." />
    </div>
  );
}

// 11 ─ Wallet ──────────────────────────────────────────────────
function WalletTab({ navigate }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[20px] p-5" style={{ background:'linear-gradient(135deg,#1e1b4b,#312e81)', border:`1px solid #4338ca50` }}>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Balance Total</p>
        <p className="text-4xl font-black text-white mt-1">$2,450.00</p>
        <div className="flex gap-2 mt-4">
          {['💰 Deposit','📤 Withdraw','🔄 Transfer'].map(a=>(
            <button key={a} type="button" className="flex-1 py-2 rounded-xl text-[10px] font-black border transition-all active:scale-95" style={{ background:'rgba(255,255,255,0.08)',borderColor:'rgba(255,255,255,0.12)',color:'#e2e8f0' }}>{a}</button>
          ))}
        </div>
      </div>
      <div className="rounded-[20px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
        {[
          {icon:'💳',l:'Cards',s:'2 cards linked'},{icon:'🔒',l:'Escrow',s:'3 active escrows'},
          {icon:'📋',l:'Invoices',s:'12 this month'},{icon:'📊',l:'Transactions',s:'See all history'},
          {icon:'💼',l:'Subscriptions',s:'1 active plan'},
        ].map((item,idx,arr)=>(
          <React.Fragment key={item.l}>
            <button type="button" onClick={()=>navigate('/wallet')} className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-white/[0.015] text-left transition-colors">
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1"><p className="text-[13px] font-bold text-white">{item.l}</p><p className="text-[10px] text-slate-500 mt-0.5">{item.s}</p></div>
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
            {idx<arr.length-1 && <Divider />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// 12 ─ Documents ───────────────────────────────────────────────
function DocumentsTab() {
  const docs = [
    {icon:'📄',name:'Curriculum Vitae',    privacy:'Public',   size:'248 KB'},
    {icon:'🪪',name:'National ID',         privacy:'Employers',size:'1.2 MB'},
    {icon:'📘',name:'Passport',            privacy:'Private',  size:'2.1 MB'},
    {icon:'🏆',name:'OSHA Certificate',    privacy:'Public',   size:'512 KB'},
    {icon:'🏅',name:'Electrician License', privacy:'Employers',size:'420 KB'},
    {icon:'🛡',name:'Liability Insurance', privacy:'Employers',size:'1.8 MB'},
    {icon:'📋',name:'Tax Documents',       privacy:'Private',  size:'340 KB'},
  ];
  const pc = {Public:'#10b981',Employers:'#6366f1',Friends:'#f59e0b',Private:'#64748b'};
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-500">Chak dokiman gen yon nivo aksè: Public · Employers · Friends · Private.</p>
      <div className="rounded-[20px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
        {docs.map((d,idx,arr)=>(
          <React.Fragment key={d.name}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background:BORDER }}>{d.icon}</div>
              <div className="flex-1 min-w-0"><p className="text-[12px] font-black text-white truncate">{d.name}</p><p className="text-[10px] text-slate-600 mt-0.5">{d.size}</p></div>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background:`${pc[d.privacy]}20`, color:pc[d.privacy] }}>{d.privacy}</span>
            </div>
            {idx<arr.length-1 && <Divider />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// 13 ─ AI Career ───────────────────────────────────────────────
function AICareerTab() {
  return (
    <div className="space-y-5">
      <div className="rounded-[20px] p-5 text-center" style={{ background:'linear-gradient(135deg,#1e1b4b,#312e81)', border:`1px solid #4338ca40` }}>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">AI Career Score</p>
        <p className="text-6xl font-black mt-2" style={{ color:GOLD }}>92</p>
        <p className="text-slate-400 text-xs mt-1">/ 100 — Excellent Profile</p>
        <div className="w-full h-2 rounded-full mt-3 overflow-hidden" style={{ background:'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full" style={{ width:'92%', background:`linear-gradient(to right,${GOLD},#f97316)` }} />
        </div>
      </div>
      <div>
        <SectionTitle>Field Compatibility</SectionTitle>
        <div className="space-y-2.5">
          {MOCK_AI_MATCH.map(m=>(
            <div key={m.cat} className="flex items-center gap-3">
              <p className="text-[12px] text-slate-300 w-36 shrink-0">{m.cat}</p>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:BORDER }}><div className="h-full rounded-full" style={{ width:`${m.pct}%`, background:m.color }} /></div>
              <span className="text-[11px] font-black w-8 text-right" style={{ color:m.color }}>{m.pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionTitle>Recommendations</SectionTitle>
        <div className="rounded-[20px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
          {[
            {icon:'💼',l:'Recommended Jobs',   s:'14 matching your profile'},
            {icon:'🛠',l:'Recommended Skills', s:'Add Blueprint Reading'   },
            {icon:'📚',l:'Courses',            s:'3 certifications pending'},
            {icon:'💰',l:'Salary Estimate',    s:'$1,100–1,400/week'       },
            {icon:'📈',l:'Career Growth',      s:'+35% in 2 years'         },
          ].map((item,idx,arr)=>(
            <React.Fragment key={item.l}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1"><p className="text-[12px] font-black text-white">{item.l}</p><p className="text-[10px] text-slate-500 mt-0.5">{item.s}</p></div>
              </div>
              {idx<arr.length-1 && <Divider />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// 14 ─ Stats ───────────────────────────────────────────────────
function StatsTab() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {MOCK_STATS.map(s=>(
        <div key={s.label} className="rounded-[16px] py-4 px-3 text-center" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
          <p className="text-2xl font-black text-white">{s.value}</p>
          <p className="text-[10px] text-slate-500 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// 15 ─ Trust Center ────────────────────────────────────────────
function TrustCenterTab() {
  const passed = MOCK_TRUST.filter(t=>t.ok).length;
  return (
    <div className="space-y-4">
      <div className="rounded-[20px] p-5" style={{ background:'linear-gradient(135deg,#064e3b,#065f46)', border:'1px solid #10b98130' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Professional Trust Score</p>
          <span className="text-2xl font-black text-emerald-400">{passed*10}/100</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background:'rgba(0,0,0,0.3)' }}>
          <div className="h-full rounded-full" style={{ width:`${passed*10}%`, background:'linear-gradient(to right,#10b981,#34d399)' }} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[{l:'Member Since',v:'Jan 2026'},{l:'Last Active',v:'2 min ago'},{l:'Response Time',v:'3 min'},{l:'Response Rate',v:'98%'},{l:'Repeat Clients',v:'87%'},{l:'Projects Done',v:'245'}].map(s=>(
            <div key={s.l} className="text-center">
              <p className="text-sm font-black text-white">{s.v}</p>
              <p className="text-[8px] text-emerald-400/70 mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionTitle>Verification Checklist</SectionTitle>
        <div className="rounded-[20px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
          {MOCK_TRUST.map((t,idx,arr)=>(
            <React.Fragment key={t.label}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={t.ok?{background:'#10b98120'}:{background:'#ef444420'}}>
                  <span className="text-[10px]">{t.ok?'✔':'✖'}</span>
                </div>
                <p className="flex-1 text-[12px] font-bold" style={{ color:t.ok?'#d1fae5':'#64748b' }}>{t.label}</p>
                {t.ok && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
              </div>
              {idx<arr.length-1 && <Divider />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// 16 ─ Contact ─────────────────────────────────────────────────
function ContactTab({ navigate }) {
  const methods = [
    {icon:<MessageSquare className="w-5 h-5" />,l:'Message',    s:'Reply in ~3 min',          a:()=>navigate('/chat'), c:'#6366f1'},
    {icon:<Phone className="w-5 h-5" />,        l:'Voice Call', s:'Available now',            a:()=>navigate('/chat'), c:'#10b981'},
    {icon:<Video className="w-5 h-5" />,         l:'Video Call', s:'Schedule or now',         a:()=>navigate('/chat'), c:'#f97316'},
    {icon:'📧',l:'Email',    s:'ronald@email.com',     a:()=>{}, c:'#3b82f6'},
    {icon:'📍',l:'Location', s:'Punta Cana, DR',        a:()=>{}, c:'#ef4444'},
    {icon:'🌐',l:'Website',  s:'www.portfolio.com',     a:()=>{}, c:'#8b5cf6'},
    {icon:'💬',l:'WhatsApp', s:'Optional',              a:()=>{}, c:'#25d366'},
    {icon:'✈', l:'Telegram', s:'Optional',              a:()=>{}, c:'#0088cc'},
  ];
  return (
    <div className="rounded-[20px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
      {methods.map((m,idx,arr)=>(
        <React.Fragment key={m.l}>
          <button type="button" onClick={m.a} className="flex items-center gap-3 w-full px-4 py-4 hover:bg-white/[0.015] text-left transition-colors">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl" style={{ background:`${m.c}20`, color:m.c }}>{typeof m.icon==='string'?m.icon:m.icon}</div>
            <div className="flex-1"><p className="text-[13px] font-black text-white">{m.l}</p><p className="text-[10px] text-slate-500 mt-0.5">{m.s}</p></div>
            <ChevronRight className="w-4 h-4 text-slate-700" />
          </button>
          {idx<arr.length-1 && <Divider />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BUSINESS TAB CONTENT
// ═══════════════════════════════════════════════════════════════
function BizStoreTab({ profile }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[20px] p-4" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
        <p className="text-[13px] text-slate-300 leading-relaxed">{profile?.bio||`${profile?.name||'Business'} ofri sèvis kalite nan rejyon an.`}</p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[{l:'Orè',v:'8AM–10PM'},{l:'Estati',v:'🟢 Ouvè'},{l:'Tel',v:'+509 XXXX-XXXX'},{l:'Sit Web',v:'www.example.com'}].map(item=>(
            <div key={item.l} className="p-2.5 rounded-xl" style={{ background:BORDER }}>
              <p className="text-[9px] text-slate-500 font-bold uppercase">{item.l}</p>
              <p className="text-[11px] font-black text-white mt-0.5">{item.v}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="h-32 rounded-[20px] flex items-center justify-center" style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)', border:`1px solid ${BORDER}` }}>
        <div className="text-center"><p className="text-3xl">🗺</p><p className="text-xs text-slate-400 mt-1">Location Map</p></div>
      </div>
    </div>
  );
}
function BizProductsTab() {
  const items = [{e:'🍕',n:'Pizza'},{e:'🥗',n:'Salad'},{e:'🍗',n:'Chicken'},{e:'🥤',n:'Drinks'},{e:'🍰',n:'Desserts'},{e:'🍣',n:'Sushi'}];
  return (
    <div className="space-y-2">
      {items.map((p,i)=>(
        <div key={i} className="flex items-center gap-3 p-3 rounded-[16px]" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0" style={{ background:BORDER }}>{p.e}</div>
          <div className="flex-1"><p className="text-[13px] font-black text-white">{p.n}</p><p className="text-[11px] text-slate-500 mt-0.5">from $12.00</p></div>
          <button type="button" className="px-3 py-1.5 rounded-xl text-[10px] font-black active:scale-95 transition" style={{ background:GOLD, color:BG }}>Add</button>
        </div>
      ))}
    </div>
  );
}
function BizGalleryTab() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {['🍽','🏨','🌊','🌴','🎉','🍷','🛏','🛁','🏊'].map((e,i)=>(
        <div key={i} className="aspect-square rounded-xl flex items-center justify-center text-3xl cursor-pointer active:scale-95 transition" style={{ background:BORDER }}>{e}</div>
      ))}
    </div>
  );
}
function BizTabContent({ tabId, profile, navigate }) {
  if (tabId==='store'||tabId==='overview'||tabId==='dashboard')   return <BizStoreTab profile={profile} />;
  if (tabId==='products'||tabId==='menu'||tabId==='rooms')        return <BizProductsTab />;
  if (tabId==='gallery')                                          return <BizGalleryTab />;
  if (tabId==='reviews')                                          return <ReviewsTab avgRating={4.7} total={89} />;
  if (tabId==='about')                                            return <BizStoreTab profile={profile} />;
  if (tabId==='contact')                                          return <ContactTab navigate={navigate} />;
  return <EmptyTab icon="🔜" title="Pwochen" body="Seksyon sa a ap disponib byento." />;
}

// ═══════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════
function ProfileFooter({ profile, navigate }) {
  const [showQr, setShowQr] = useState(false);
  const actions = [
    {icon:'📤',l:'Share Profile',    a:()=>navigator.share?.({title:profile?.name,url:window.location.href}).catch(()=>{}),danger:false},
    {icon:'🔗',l:'Copy Link',        a:()=>navigator.clipboard?.writeText(window.location.href).catch(()=>{}),danger:false},
    {icon:'📱',l:'QR Code',          a:()=>setShowQr(true),danger:false},
    {icon:'⬇', l:'Download CV',     a:()=>{},danger:false},
    {icon:'🔒',l:'Privacy Settings', a:()=>{},danger:false},
    {icon:'🚩',l:'Report Profile',   a:()=>{},danger:true},
    {icon:'🚫',l:'Block User',       a:()=>{},danger:true},
  ];
  return (
    <>
      <div className="rounded-[20px] overflow-hidden" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
        {actions.map((a,idx,arr)=>(
          <React.Fragment key={a.l}>
            <button type="button" onClick={a.a} className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-white/[0.015] text-left transition-colors">
              <span className="text-base w-5">{a.icon}</span>
              <span className="flex-1 text-[12px] font-bold" style={{ color:a.danger?'#ef4444':'#94a3b8' }}>{a.l}</span>
            </button>
            {idx<arr.length-1 && <Divider />}
          </React.Fragment>
        ))}
      </div>
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={()=>setShowQr(false)}>
          <div className="rounded-[24px] p-8 flex flex-col items-center gap-4" style={{ background:CARD, border:`1px solid ${BORDER}` }}>
            <div className="w-40 h-40 rounded-2xl flex items-center justify-center text-8xl" style={{ background:BORDER }}>📱</div>
            <p className="text-white font-black">{profile?.name}</p>
            <p className="text-slate-500 text-sm">Skane pou wè pwofil la</p>
            <button type="button" onClick={()=>setShowQr(false)} className="px-6 py-2 rounded-full text-sm font-bold border" style={{ borderColor:BORDER, color:'#94a3b8' }}>Fèmen</button>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function PublicProfileScreen() {
  const { userId }   = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { user: me } = useAuth();
  const tabBarRef    = useRef(null);

  const seed = location.state?.profile || null;
  const [profile,    setProfile]    = useState(seed);
  const [loading,    setLoading]    = useState(!seed);
  const [activeTab,  setActiveTab]  = useState(null);
  const [followed,   setFollowed]   = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showDemand, setShowDemand] = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = useCallback(msg => { setToast(msg); setTimeout(()=>setToast(null), 2500); }, []);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    API.get(`/users/${userId}`, { timeout:12000 })
      .then(res => { if (!alive) return; const u=res?.data?.data?.user||res?.data?.user||res?.data; if (u) setProfile(p=>({...p,...u})); })
      .catch(()=>{})
      .finally(()=>{ if (alive) setLoading(false); });
    return ()=>{ alive=false; };
  }, [userId]);

  const submitRating = useCallback(({stars,text})=>{
    setShowRating(false);
    API.post(`/users/${userId}/ratings`,{stars,comment:text}).catch(()=>{});
    showToast(`Ou bay ${stars} ⭐`);
  }, [userId, showToast]);

  const submitDemand = useCallback(({description,budget,date})=>{
    setShowDemand(false);
    API.post('/jobs',{targetUserId:userId,description,budget,preferredDate:date,status:'pending'}).catch(()=>{});
    showToast('Demand voye! ✓');
  }, [userId, showToast]);

  const tabs = getTabsForRole(profile?.role);
  useEffect(()=>{ if (tabs.length && !activeTab) setActiveTab(tabs[0].id); }, [tabs]);

  const isBiz     = BIZ_ROLES.has(profile?.role) || ENT_ROLES.has(profile?.role);
  const avgRating = profile?.stats?.rating ?? profile?.rating ?? 4.9;
  const photo     = profile?.profileMetadata?.profilePhoto || profile?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile?.name||'u')}`;
  const name      = profile?.name     || 'Itilizatè';
  const prof      = profile?.profession || profile?.role || 'Professional';
  const city      = profile?.location?.city    || profile?.city    || '';
  const country   = profile?.location?.country || '';

  const verifiedBadges = [
    {l:'Identity',   ok:profile?.identityVerified  ??true },
    {l:'Phone',      ok:profile?.phoneVerified     ??true },
    {l:'Email',      ok:profile?.emailVerified     ??true },
    {l:'Background', ok:profile?.backgroundChecked ??true },
    {l:'Premium',    ok:profile?.premium           ??false},
  ].filter(b=>b.ok);

  function handleTabChange(id) {
    setActiveTab(id);
    if (!tabBarRef.current) return;
    const btn = tabBarRef.current.querySelector(`[data-tab="${id}"]`);
    if (btn) btn.scrollIntoView({inline:'center',behavior:'smooth',block:'nearest'});
  }

  function renderWorkerTab(id) {
    switch(id) {
      case 'showcase':   return <ShowcaseTab profile={profile} onBook={()=>setShowDemand(true)} navigate={navigate} />;
      case 'stories':    return <StoriesTab />;
      case 'about':      return <AboutTab profile={profile} />;
      case 'skills':     return <SkillsTab />;
      case 'portfolio':  return <PortfolioTab />;
      case 'reviews':    return <ReviewsTab avgRating={avgRating} />;
      case 'experience': return <ExperienceTab />;
      case 'services':   return <ServicesTab onBook={()=>setShowDemand(true)} />;
      case 'jobs':       return <JobsTab navigate={navigate} />;
      case 'calendar':   return <CalendarTab />;
      case 'wallet':     return <WalletTab navigate={navigate} />;
      case 'documents':  return <DocumentsTab />;
      case 'ai':         return <AICareerTab />;
      case 'stats':      return <StatsTab />;
      case 'trust':      return <TrustCenterTab />;
      case 'contact':    return <ContactTab navigate={navigate} />;
      default:           return null;
    }
  }

  if (loading && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background:BG }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor:`${GOLD}40`, borderTopColor:GOLD }} />
          <p className="text-sm text-slate-400">Ap chaje pwofil...</p>
        </div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4" style={{ background:BG }}>
        <span className="text-5xl">👤</span>
        <p className="text-white font-bold">Pa jwenn pwofil sa a</p>
        <button onClick={()=>navigate(-1)} className="text-sm" style={{ color:GOLD }}>← Retounen</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background:BG }}>
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-2xl shadow-xl text-sm font-bold text-white" style={{ background:'#10b981' }}>{toast}</div>
      )}
      {showRating && <RatingModal target={profile} onClose={()=>setShowRating(false)} onSubmit={submitRating} />}
      {showDemand && <DemandModal target={profile} onClose={()=>setShowDemand(false)} onSubmit={submitDemand} />}

      {/* ── COVER + HERO ─────────────────────────────────────── */}
      <div className="relative h-44" style={{ background:'linear-gradient(135deg,#1e1b4b 0%,#0f172a 50%,#1e293b 100%)' }}>
        <button type="button" onClick={()=>navigate(-1)} className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-slate-400 text-sm hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Retounen
        </button>
        <button type="button" onClick={()=>navigator.share?.({title:name,url:window.location.href}).catch(()=>{})}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center z-10" style={{ background:'rgba(0,0,0,0.5)' }}>
          <Share2 className="w-4 h-4 text-white" />
        </button>
        {/* Avatar overlapping cover */}
        <div className="absolute -bottom-10 left-4 w-24 h-24 rounded-[22px] border-4 overflow-hidden" style={{ borderColor:BG }}>
          <img src={photo} alt={name} className="w-full h-full object-cover" style={{ background:CARD }}
            onError={e=>{ e.currentTarget.src=`https://api.dicebear.com/7.x/avataaars/svg?seed=u`; }} />
        </div>
        <div className="absolute left-[88px] -bottom-[30px] w-5 h-5 rounded-full bg-green-400 border-[3px]" style={{ borderColor:BG }} />
      </div>

      {/* ── INFO STRIP ───────────────────────────────────────── */}
      <div className="pt-12 px-4 pb-4" style={{ borderBottom:`1px solid ${BORDER}` }}>
        <h1 className="text-xl font-black text-white">{name}</h1>
        <p className="text-[12px] text-slate-400 mt-0.5">🏗 {prof}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
          {(city||country) && <span className="flex items-center gap-1 text-[11px] text-slate-500"><MapPin className="w-3 h-3 shrink-0" />{[city,country].filter(Boolean).join(', ')}</span>}
          <span className="flex items-center gap-1 text-[11px] text-slate-500"><Globe className="w-3 h-3 shrink-0" />Available Worldwide</span>
          <span className="text-[11px] text-slate-500">🗣 EN · FR · HT · ES</span>
        </div>

        {verifiedBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {verifiedBadges.map(b=>(
              <span key={b.l} className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background:'#10b98115', border:'1px solid #10b98130', color:'#10b981' }}>
                <CheckCircle className="w-2.5 h-2.5" /> {b.l} Verified
              </span>
            ))}
          </div>
        )}

        {/* Rating row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5">
            {[1,2,3,4,5].map(n=><Star key={n} className="w-4 h-4" fill={n<=Math.round(avgRating)?GOLD:'none'} style={{ color:n<=Math.round(avgRating)?GOLD:'#374151' }} />)}
            <span className="text-[12px] font-black ml-1" style={{ color:GOLD }}>{avgRating.toFixed(1)}</span>
            <span className="text-[10px] text-slate-500">(126)</span>
          </div>
          <button type="button" onClick={()=>setShowRating(true)} className="text-[10px] font-black px-3 py-1 rounded-full border active:scale-95 transition" style={{ borderColor:`${GOLD}40`, color:GOLD, background:`${GOLD}10` }}>
            Bay Nòt
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
          {[
            {icon:followed?'✓':'➕', l:followed?'Following':'Follow', primary:!followed, a:()=>{setFollowed(f=>!f);showToast(followed?'Unfollow':'Following ✓');}},
            {icon:'💬', l:'Message',    a:()=>navigate('/chat')},
            {icon:'📞', l:'Voice Call', a:()=>navigate('/chat')},
            {icon:'📹', l:'Video Call', a:()=>navigate('/chat')},
            {icon:'🟢', l:'Hire Now',   a:()=>setShowDemand(true), gold:true},
            {icon:'📋', l:'Book',       a:()=>setShowDemand(true)},
            {icon:'🔖', l:saved?'Saved':'Save', a:()=>{setSaved(s=>!s);showToast(saved?'Retire':'Sove ✓');}, saved},
          ].map(btn=>(
            <button key={btn.l} type="button" onClick={btn.a}
              className="shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all active:scale-95"
              style={btn.gold
                ?{background:GOLD,borderColor:GOLD,color:BG}
                :btn.primary
                  ?{background:`${GOLD}20`,borderColor:`${GOLD}40`,color:GOLD}
                  :btn.saved
                    ?{background:`${GOLD}15`,borderColor:`${GOLD}30`,color:GOLD}
                    :{background:CARD,borderColor:BORDER,color:'#94a3b8'}}>
              <span className="text-base leading-none">{btn.icon}</span>
              <span className="text-[8px] font-bold whitespace-nowrap">{btn.l}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── STICKY TAB BAR ───────────────────────────────────── */}
      <div ref={tabBarRef} className="sticky top-0 z-30 flex overflow-x-auto border-b" style={{ background:BG, borderColor:BORDER, scrollbarWidth:'none' }}>
        {tabs.map(t=>(
          <button key={t.id} data-tab={t.id} type="button" onClick={()=>handleTabChange(t.id)}
            className="shrink-0 flex flex-col items-center gap-0.5 px-4 py-3 transition-all relative"
            style={{ color:activeTab===t.id?GOLD:'#64748b' }}>
            <span className="text-lg leading-none">{t.icon}</span>
            <span className="text-[9px] font-black tracking-wide whitespace-nowrap">{t.label}</span>
            {activeTab===t.id && <div className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full" style={{ background:GOLD }} />}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ─────────────────────────────────────── */}
      <div className="px-4 py-5">
        {isBiz
          ? <BizTabContent tabId={activeTab||tabs[0]?.id} profile={profile} navigate={navigate} />
          : renderWorkerTab(activeTab||'showcase')
        }
      </div>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <div className="px-4 mt-2">
        <ProfileFooter profile={profile} navigate={navigate} />
      </div>
    </div>
  );
}
