import React, { useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────────────────────
// FILTER SCHEMA
// ─────────────────────────────────────────────────────────────

export const DEFAULT_ADV_FILTERS = {
  // Location
  country: '', state: '', province: '', city: '', district: '', radius: 0,
  // Job
  category: '', subcategory: '', profession: '', experience: '', skills: [], salary_min: '', salary_max: '', currency: 'HTG',
  // Contract
  contract_types: [],   // full_time | part_time | contract | temporary | internship | freelance | remote | hybrid | on_site
  // Worker
  languages: [], education: '', certifications: [], driving_license: false, vehicle: false, passport: false, visa: false,
  // Company
  verified_only: false, premium_only: false, hiring_now: false, urgent_only: false,
  // Date
  date_range: '',  // today | this_week | this_month
  // Payment
  payment_type: '',  // hourly | daily | weekly | monthly | fixed
};

const COUNTRIES = [
  { code:'HT', name:'Haiti', flag:'🇭🇹' },
  { code:'DO', name:'Rép. Dominicaine', flag:'🇩🇴' },
  { code:'US', name:'États-Unis', flag:'🇺🇸' },
  { code:'CA', name:'Canada', flag:'🇨🇦' },
  { code:'FR', name:'France', flag:'🇫🇷' },
  { code:'BR', name:'Brésil', flag:'🇧🇷' },
  { code:'MX', name:'Mexique', flag:'🇲🇽' },
  { code:'JM', name:'Jamaïque', flag:'🇯🇲' },
  { code:'CU', name:'Cuba', flag:'🇨🇺' },
  { code:'CO', name:'Colombie', flag:'🇨🇴' },
  { code:'GB', name:'Royaume-Uni', flag:'🇬🇧' },
  { code:'DE', name:'Allemagne', flag:'🇩🇪' },
];

const RADIUS_OPTIONS = [0, 5, 10, 25, 50, 100];

const JOB_CATEGORIES = [
  'BTP / Konstriksyon', 'Teknoloji', 'Sante', 'Edikasyon', 'Otèl / Touris',
  'Transpò', 'Sekrete / Admin', 'Agrikilti', 'Finans', 'Komès',
];

const EXPERIENCE_OPTIONS = [
  { val:'entry',  label:'Debutant (0-1 an)' },
  { val:'junior', label:'Junior (1-3 an)'   },
  { val:'mid',    label:'Mwayen (3-5 an)'   },
  { val:'senior', label:'Senyò (5-10 an)'   },
  { val:'expert', label:'Ekspè (10+ an)'    },
];

const SKILLS_COMMON = [
  'Microsoft Office', 'Excel', 'Driving License', 'First Aid',
  'Customer Service', 'Team Work', 'Leadership', 'Project Management',
];

const CURRENCIES = ['HTG', 'USD', 'EUR', 'DOP', 'MXN', 'CAD', 'GBP'];

const CONTRACT_TYPES = [
  { val:'full_time',   label:'Tan plen',        icon:'💼' },
  { val:'part_time',   label:'Mi-tan',           icon:'⏰' },
  { val:'contract',    label:'Kontra',           icon:'📋' },
  { val:'temporary',   label:'Tanporè',          icon:'📅' },
  { val:'internship',  label:'Stage',            icon:'🎓' },
  { val:'freelance',   label:'Frilans',          icon:'🔧' },
  { val:'remote',      label:'À distans',        icon:'🌐' },
  { val:'hybrid',      label:'Ibrid',            icon:'🔄' },
  { val:'on_site',     label:'Sou sit',          icon:'🏢' },
];

const LANGUAGES_LIST = [
  'Kreyòl', 'Français', 'English', 'Español', 'Português', 'Deutsch', 'Italiano',
];

const EDUCATION_LEVELS = [
  { val:'none',    label:'San diplòm'         },
  { val:'primary', label:'Primè'              },
  { val:'secondary',label:'Segondè'           },
  { val:'vocational',label:'Vokasyonèl / CPC' },
  { val:'bachelor',label:'Lisans'             },
  { val:'master',  label:'Maîtrise'           },
  { val:'phd',     label:'Doktora'            },
];

const CERTS_COMMON = ['CCNA', 'PMP', 'CPA', 'ACCA', 'RN License', 'Pastry CAP', 'WSET', 'ISO 45001'];

const DATE_RANGES = [
  { val:'today',      label:'Jodia' },
  { val:'this_week',  label:'Semèn sa' },
  { val:'this_month', label:'Mwa sa' },
];

const PAYMENT_TYPES = [
  { val:'hourly',  label:'Pa èdtan',   icon:'⏱' },
  { val:'daily',   label:'Pa jou',     icon:'📆' },
  { val:'weekly',  label:'Pa semèn',   icon:'🗓' },
  { val:'monthly', label:'Pa mwa',     icon:'📊' },
  { val:'fixed',   label:'Pri fiks',   icon:'💰' },
];

// ─────────────────────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────────────────────

const Pill = memo(function Pill({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
        active
          ? 'bg-amber-500 border-amber-500 text-slate-950'
          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
      }`}>
      {label}
    </button>
  );
});

const Toggle = memo(function Toggle({ label, sublabel, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0">
      <div>
        <span className="text-sm text-slate-200 font-medium">{label}</span>
        {sublabel && <p className="text-[10px] text-slate-500 mt-0.5">{sublabel}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${value ? 'bg-amber-500' : 'bg-slate-700'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
});

function SectionHead({ icon, label, count }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-5 first:mt-2">
      {icon && <span className="text-base">{icon}</span>}
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex-1">{label}</p>
      {count != null && count > 0 && (
        <span className="text-[9px] bg-amber-500 text-slate-950 rounded-full px-1.5 py-0.5 font-black">{count}</span>
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION COMPONENTS
// ─────────────────────────────────────────────────────────────

function LocationSection({ local, set }) {
  const activeCount = [local.country, local.city, local.state, local.province, local.district].filter(Boolean).length
    + (local.radius > 0 ? 1 : 0);

  return (
    <>
      <SectionHead icon="📍" label="Lokasyon" count={activeCount} />

      {/* Country */}
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-bold">Peyi</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {COUNTRIES.map(c => (
          <Pill key={c.code}
            label={`${c.flag} ${c.name}`}
            active={local.country === c.code}
            onClick={() => set('country', local.country === c.code ? '' : c.code)} />
        ))}
      </div>

      {/* State / Province / City / District */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wide">Eta / Depatman</p>
          <TextInput value={local.state} onChange={v => set('state', v)} placeholder="Ex: Ouest…" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wide">Vil</p>
          <TextInput value={local.city} onChange={v => set('city', v)} placeholder="Port-au-Prince…" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wide">Pwovens</p>
          <TextInput value={local.province} onChange={v => set('province', v)} placeholder="Nord…" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wide">Distrik</p>
          <TextInput value={local.district} onChange={v => set('district', v)} placeholder="Delmas…" />
        </div>
      </div>

      {/* Radius */}
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-bold">Reyon (km)</p>
      <div className="flex flex-wrap gap-1.5">
        {RADIUS_OPTIONS.map(r => (
          <Pill key={r} label={r === 0 ? 'Nenpòt' : `${r} km`} active={local.radius === r} onClick={() => set('radius', r)} />
        ))}
      </div>
    </>
  );
}

function JobSection({ local, set, toggleArr }) {
  const activeCount = [local.category, local.profession, local.experience].filter(Boolean).length
    + local.skills.length
    + (local.salary_min || local.salary_max ? 1 : 0);

  return (
    <>
      <SectionHead icon="💼" label="Travay / Pwofesyon" count={activeCount} />

      {/* Category */}
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-bold">Kategori</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {JOB_CATEGORIES.map(c => (
          <Pill key={c} label={c} active={local.category === c} onClick={() => set('category', local.category === c ? '' : c)} />
        ))}
      </div>

      {/* Profession free text */}
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-bold">Pwofesyon</p>
      <div className="mb-3">
        <TextInput value={local.profession} onChange={v => set('profession', v)} placeholder="Elektrisyen, Enfimyè, Dev…" />
      </div>

      {/* Experience */}
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-bold">Eksperyans</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {EXPERIENCE_OPTIONS.map(e => (
          <Pill key={e.val} label={e.label} active={local.experience === e.val}
            onClick={() => set('experience', local.experience === e.val ? '' : e.val)} />
        ))}
      </div>

      {/* Skills */}
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-bold">Konpetans</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {SKILLS_COMMON.map(s => (
          <Pill key={s} label={s} active={local.skills.includes(s)} onClick={() => toggleArr('skills', s)} />
        ))}
      </div>

      {/* Salary */}
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-bold">Salè</p>
      <div className="flex gap-2 items-center mb-1">
        <select value={local.currency} onChange={e => set('currency', e.target.value)}
          className="px-2 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none">
          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={local.salary_min} onChange={e => set('salary_min', e.target.value)} placeholder="Min" type="number"
          className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60" />
        <span className="text-slate-600 text-sm shrink-0">—</span>
        <input value={local.salary_max} onChange={e => set('salary_max', e.target.value)} placeholder="Max" type="number"
          className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60" />
      </div>
    </>
  );
}

function ContractSection({ local, toggleArr }) {
  return (
    <>
      <SectionHead icon="📋" label="Tip Kontra" count={local.contract_types.length} />
      <div className="grid grid-cols-3 gap-2">
        {CONTRACT_TYPES.map(ct => {
          const active = local.contract_types.includes(ct.val);
          return (
            <button key={ct.val} type="button" onClick={() => toggleArr('contract_types', ct.val)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all active:scale-95 ${
                active ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}>
              <span className="text-xl">{ct.icon}</span>
              <span className="text-[10px] font-bold leading-tight">{ct.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function WorkerSection({ local, set, toggleArr }) {
  const activeCount = local.languages.length + local.certifications.length
    + [local.education].filter(Boolean).length
    + (local.driving_license ? 1 : 0)
    + (local.vehicle ? 1 : 0)
    + (local.passport ? 1 : 0)
    + (local.visa ? 1 : 0);

  return (
    <>
      <SectionHead icon="👷" label="Travayè" count={activeCount} />

      {/* Languages */}
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-bold">Lang</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {LANGUAGES_LIST.map(l => (
          <Pill key={l} label={l} active={local.languages.includes(l)} onClick={() => toggleArr('languages', l)} />
        ))}
      </div>

      {/* Education */}
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-bold">Nivo Edikasyon</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {EDUCATION_LEVELS.map(e => (
          <Pill key={e.val} label={e.label} active={local.education === e.val}
            onClick={() => set('education', local.education === e.val ? '' : e.val)} />
        ))}
      </div>

      {/* Certifications */}
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-bold">Sètifika</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {CERTS_COMMON.map(c => (
          <Pill key={c} label={c} active={local.certifications.includes(c)} onClick={() => toggleArr('certifications', c)} />
        ))}
      </div>

      {/* Document toggles */}
      <div className="bg-slate-800/40 rounded-2xl px-4">
        <Toggle label="Lisans Kondwi" sublabel="Driving License" value={local.driving_license} onChange={v => set('driving_license', v)} />
        <Toggle label="Veyikil Pèsonèl" sublabel="Pwòp machin / moto" value={local.vehicle} onChange={v => set('vehicle', v)} />
        <Toggle label="Paspò Valid" sublabel="Passeport en règle" value={local.passport} onChange={v => set('passport', v)} />
        <Toggle label="Viza" sublabel="Visa de travail" value={local.visa} onChange={v => set('visa', v)} />
      </div>
    </>
  );
}

function CompanySection({ local, set }) {
  const activeCount = [local.verified_only, local.premium_only, local.hiring_now, local.urgent_only].filter(Boolean).length;

  return (
    <>
      <SectionHead icon="🏢" label="Antrepriz" count={activeCount} />
      <div className="bg-slate-800/40 rounded-2xl px-4">
        <Toggle label="✅ Verifye sèlman" sublabel="Entreprises certifiées" value={local.verified_only} onChange={v => set('verified_only', v)} />
        <Toggle label="⭐ Premium sèlman" sublabel="Abonnement actif" value={local.premium_only} onChange={v => set('premium_only', v)} />
        <Toggle label="🟢 K ap Rekrite Kounye a" sublabel="Hiring Now" value={local.hiring_now} onChange={v => set('hiring_now', v)} />
        <Toggle label="🔥 Ijan sèlman" sublabel="Besoin urgent" value={local.urgent_only} onChange={v => set('urgent_only', v)} />
      </div>
    </>
  );
}

function DateSection({ local, set }) {
  return (
    <>
      <SectionHead icon="📅" label="Dat Piblikasyon" count={local.date_range ? 1 : 0} />
      <div className="flex gap-2">
        {DATE_RANGES.map(d => (
          <button key={d.val} type="button" onClick={() => set('date_range', local.date_range === d.val ? '' : d.val)}
            className={`flex-1 py-3 rounded-2xl border text-xs font-bold transition-all active:scale-95 ${
              local.date_range === d.val
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}>
            {d.label}
          </button>
        ))}
      </div>
    </>
  );
}

function PaymentSection({ local, set }) {
  return (
    <>
      <SectionHead icon="💰" label="Tip Peman" count={local.payment_type ? 1 : 0} />
      <div className="grid grid-cols-5 gap-2">
        {PAYMENT_TYPES.map(p => {
          const active = local.payment_type === p.val;
          return (
            <button key={p.val} type="button" onClick={() => set('payment_type', active ? '' : p.val)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all active:scale-95 ${
                active ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}>
              <span className="text-xl">{p.icon}</span>
              <span className="text-[9px] font-bold leading-tight">{p.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION TABS
// ─────────────────────────────────────────────────────────────

const SECTIONS = [
  { id:'location', label:'📍', title:'Lokasyon'   },
  { id:'job',      label:'💼', title:'Travay'     },
  { id:'contract', label:'📋', title:'Kontra'     },
  { id:'worker',   label:'👷', title:'Travayè'    },
  { id:'company',  label:'🏢', title:'Antrepriz'  },
  { id:'date',     label:'📅', title:'Dat'        },
  { id:'payment',  label:'💰', title:'Peman'      },
];

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function AdvancedFiltersSheet({ filters = DEFAULT_ADV_FILTERS, onApply, onClose }) {
  const { t } = useTranslation();
  const [local, setLocal] = useState({ ...DEFAULT_ADV_FILTERS, ...filters });
  const [activeSection, setActiveSection] = useState('location');

  const set = useCallback((key, val) => setLocal(prev => ({ ...prev, [key]: val })), []);

  const toggleArr = useCallback((key, val) => {
    setLocal(prev => {
      const arr = prev[key] || [];
      return { ...prev, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  }, []);

  const handleApply = () => { onApply?.(local); onClose?.(); };
  const handleReset = () => setLocal({ ...DEFAULT_ADV_FILTERS });

  // Count active filters per section
  const sectionCounts = {
    location: [local.country, local.city, local.state, local.province, local.district].filter(Boolean).length + (local.radius > 0 ? 1 : 0),
    job:      [local.category, local.profession, local.experience].filter(Boolean).length + local.skills.length + (local.salary_min || local.salary_max ? 1 : 0),
    contract: local.contract_types.length,
    worker:   local.languages.length + local.certifications.length + [local.education].filter(Boolean).length + (local.driving_license ? 1 : 0) + (local.vehicle ? 1 : 0) + (local.passport ? 1 : 0) + (local.visa ? 1 : 0),
    company:  [local.verified_only, local.premium_only, local.hiring_now, local.urgent_only].filter(Boolean).length,
    date:     local.date_range ? 1 : 0,
    payment:  local.payment_type ? 1 : 0,
  };

  const totalActive = Object.values(sectionCounts).reduce((s, n) => s + n, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full bg-[#0d1526] rounded-t-3xl z-10 flex flex-col max-h-[92vh]">

        {/* ── Handle + global header ─────────────────── */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-800 shrink-0">
          <div className="w-10 h-1 bg-slate-600 rounded-full absolute top-3 left-1/2 -translate-x-1/2" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">
                {t('filters.title', { defaultValue: 'Filtè Avanse' })}
              </h3>
              {totalActive > 0 && (
                <span className="text-xs bg-amber-500 text-slate-950 rounded-full px-2 py-0.5 font-black">{totalActive}</span>
              )}
            </div>
            <button type="button" onClick={handleReset} className="text-xs text-slate-400 hover:text-amber-400 font-bold transition-colors">
              🔄 {t('filters.reset', { defaultValue: 'Efase tout' })}
            </button>
          </div>
        </div>

        {/* ── Section tab bar ────────────────────────── */}
        <div className="flex overflow-x-auto gap-1 px-4 py-2 border-b border-slate-800/50 shrink-0" style={{ scrollbarWidth:'none' }}>
          {SECTIONS.map(s => {
            const count = sectionCounts[s.id] || 0;
            const active = activeSection === s.id;
            return (
              <button key={s.id} type="button" onClick={() => setActiveSection(s.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  active ? 'bg-amber-500 text-slate-950' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                }`}>
                <span>{s.label}</span>
                <span>{s.title}</span>
                {count > 0 && (
                  <span className={`min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-black px-0.5 ${
                    active ? 'bg-slate-950/30 text-slate-950' : 'bg-amber-500 text-slate-950'
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Section content ────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-2" style={{ scrollbarWidth:'thin' }}>
          {activeSection === 'location' && <LocationSection local={local} set={set} />}
          {activeSection === 'job'      && <JobSection      local={local} set={set} toggleArr={toggleArr} />}
          {activeSection === 'contract' && <ContractSection local={local} toggleArr={toggleArr} />}
          {activeSection === 'worker'   && <WorkerSection   local={local} set={set} toggleArr={toggleArr} />}
          {activeSection === 'company'  && <CompanySection  local={local} set={set} />}
          {activeSection === 'date'     && <DateSection     local={local} set={set} />}
          {activeSection === 'payment'  && <PaymentSection  local={local} set={set} />}

          {/* Spacer */}
          <div className="h-4" />
        </div>

        {/* ── Apply ─────────────────────────────────── */}
        <div className="px-5 pb-10 pt-3 border-t border-slate-800 shrink-0">
          <button type="button" onClick={handleApply}
            className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-sm transition-all shadow-xl shadow-amber-500/20 active:scale-[0.99]">
            ✅ {t('filters.apply', { defaultValue: 'Aplike Filtè' })}
            {totalActive > 0 && ` (${totalActive} filtre)`}
          </button>
        </div>
      </div>
    </div>
  );
}
