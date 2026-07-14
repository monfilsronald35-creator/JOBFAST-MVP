import React, {
  useState, useCallback, useMemo, useEffect, memo, useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const BUSINESS_TYPES = [
  { id:'hotel',        icon:'🏨', label:'Hôtel'            },
  { id:'restaurant',   icon:'🍽', label:'Restaurant'       },
  { id:'hospital',     icon:'🏥', label:'Hôpital'          },
  { id:'clinic',       icon:'🩺', label:'Clinique'         },
  { id:'construction', icon:'🏗', label:'Construction'     },
  { id:'supermarket',  icon:'🛒', label:'Supermarché'      },
  { id:'enterprise',   icon:'🏢', label:'Entreprise'       },
  { id:'bank',         icon:'🏦', label:'Banque'           },
  { id:'ngo',          icon:'🤝', label:'ONG'              },
  { id:'government',   icon:'🏛', label:'Gouvernement'     },
  { id:'factory',      icon:'🏭', label:'Usine / Fabrik'   },
];

const CURRENCIES = [
  { code:'USD', symbol:'$',    flag:'🇺🇸', name:'US Dollar'   },
  { code:'EUR', symbol:'€',    flag:'🇪🇺', name:'Euro'         },
  { code:'HTG', symbol:'G',    flag:'🇭🇹', name:'Gourde'       },
  { code:'DOP', symbol:'RD$',  flag:'🇩🇴', name:'Peso Dom.'    },
  { code:'MXN', symbol:'M$',   flag:'🇲🇽', name:'Peso Mex.'    },
  { code:'CAD', symbol:'CA$',  flag:'🇨🇦', name:'Dollar Can.'  },
  { code:'GBP', symbol:'£',    flag:'🇬🇧', name:'Sterling'     },
  { code:'USDT',symbol:'₮',   flag:'₮',   name:'Tether USDT' },
];

const COUNTRIES_LIST = [
  'Haiti','Dominican Republic','USA','Canada','France','Mexico','Brazil',
  'Jamaica','Cuba','Colombia','UK','Germany','Spain','Italy','Belgium',
];

const INVENTORY_CATS = [
  { id:'food',        icon:'🍲', label:'Aliman'           },
  { id:'medicine',    icon:'💊', label:'Medikaman'        },
  { id:'construction',icon:'🧱', label:'Mat. Konstriksyon'},
  { id:'equipment',   icon:'⚙️', label:'Ekipman'          },
  { id:'uniforms',    icon:'👕', label:'Inifòm'           },
  { id:'furniture',   icon:'🛋', label:'Mèb'              },
  { id:'cleaning',    icon:'🧴', label:'Pwodwi Netwayaj'  },
];

const RESERVATION_STATUSES = [
  { id:'upcoming',  label:"Jodia",     color:'text-blue-400',   bg:'bg-blue-500/10'  },
  { id:'thisweek',  label:"Semèn sa",  color:'text-amber-400',  bg:'bg-amber-500/10' },
  { id:'future',    label:"Pwochen",   color:'text-green-400',  bg:'bg-green-500/10' },
  { id:'completed', label:"Fini",      color:'text-slate-400',  bg:'bg-slate-700'    },
  { id:'cancelled', label:"Anile",     color:'text-red-400',    bg:'bg-red-500/10'   },
];

const BRANCH_PERMISSIONS = [
  { key:'canHire',     label:'Kapab rekrite'              },
  { key:'canReceivePay',label:'Kapab resevwa peman'       },
  { key:'canViewFinance',label:'Kapab wè finans'          },
  { key:'canManageInventory',label:'Kapab jere envantè'   },
  { key:'canCreateJob',label:'Kapab kreye nouvo djòb'     },
  { key:'canManageCustomers',label:'Kapab jere kliyan'    },
];

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────

const MOCK_BRANCHES = [
  { id:'b1', name:'Punta Cana', city:'Punta Cana', country:'Dominican Republic', flag:'🇩🇴',
    employees:156, status:'active', online:42, working:98, vacation:8, offline:8,
    permissions:{ canHire:true, canReceivePay:true, canViewFinance:true, canManageInventory:true, canCreateJob:true, canManageCustomers:true },
    manager:'Jean-Pierre M.' },
  { id:'b2', name:'Santo Domingo', city:'Santo Domingo', country:'Dominican Republic', flag:'🇩🇴',
    employees:89, status:'active', online:20, working:55, vacation:5, offline:9,
    permissions:{ canHire:true, canReceivePay:true, canViewFinance:false, canManageInventory:true, canCreateJob:false, canManageCustomers:true },
    manager:'María González' },
  { id:'b3', name:'Cap Haïtien', city:'Cap-Haïtien', country:'Haiti', flag:'🇭🇹',
    employees:54, status:'active', online:12, working:35, vacation:3, offline:4,
    permissions:{ canHire:false, canReceivePay:true, canViewFinance:false, canManageInventory:false, canCreateJob:false, canManageCustomers:true },
    manager:'Claudette M.' },
  { id:'b4', name:'Miami', city:'Miami, FL', country:'USA', flag:'🇺🇸',
    employees:210, status:'active', online:65, working:130, vacation:10, offline:5,
    permissions:{ canHire:true, canReceivePay:true, canViewFinance:true, canManageInventory:true, canCreateJob:true, canManageCustomers:true },
    manager:'Robert Smith' },
  { id:'b5', name:'Paris', city:'Paris', country:'France', flag:'🇫🇷',
    employees:34, status:'active', online:8, working:22, vacation:2, offline:2,
    permissions:{ canHire:true, canReceivePay:false, canViewFinance:false, canManageInventory:false, canCreateJob:false, canManageCustomers:false },
    manager:'Sophie Martin' },
];

const MOCK_JOB_SLOTS = [
  { id:'js1', profession:'Elektrisyen',  total:20, filled:12, icon:'⚡', salary:'HTG 35,000', city:'Punta Cana', urgent:false },
  { id:'js2', profession:'Plombye',      total:4,  filled:3,  icon:'🔧', salary:'HTG 22,000', city:'Santo Domingo', urgent:false },
  { id:'js3', profession:'Chofè',        total:10, filled:10, icon:'🚗', salary:'HTG 18,000', city:'Cap-Haïtien', urgent:false },
  { id:'js4', profession:'Meson / Mason',total:25, filled:0,  icon:'🧱', salary:'HTG 28,000', city:'Miami', urgent:true },
  { id:'js5', profession:'Kuyinye',      total:8,  filled:6,  icon:'👨‍🍳', salary:'HTG 25,000', city:'Paris', urgent:false },
];

const MOCK_EMPLOYEES_ALL = [
  { id:'e1', name:'Jean-Robert P.', role:'Elektrisyen', branch:'Punta Cana', status:'working',  online:true  },
  { id:'e2', name:'Marie Dupont',   role:'Receptionist', branch:'Punta Cana', status:'working', online:true  },
  { id:'e3', name:'Claudette M.',   role:'Manager',      branch:'Cap-Haïtien',status:'online',  online:true  },
  { id:'e4', name:'Pablo R.',       role:'Chef',         branch:'Miami',      status:'vacation', online:false },
  { id:'e5', name:'Anselme T.',     role:'Plombye',      branch:'Paris',      status:'offline',  online:false },
  { id:'e6', name:'Délira C.',      role:'Mason',        branch:'Santo Domingo',status:'working',online:true  },
];

const MOCK_RESERVATIONS = [
  { id:'r1', client:'Jean B.', service:'Chambre Deluxe',  date:'2026-07-11', time:'14:00', guests:2, amount:8500,  status:'upcoming'  },
  { id:'r2', client:'Sophie L.', service:'Table × 4',     date:'2026-07-11', time:'20:00', guests:4, amount:3200,  status:'upcoming'  },
  { id:'r3', client:'Marc D.',   service:'Soin médical',  date:'2026-07-12', time:'09:30', guests:1, amount:1500,  status:'thisweek'  },
  { id:'r4', client:'Anna R.',   service:'Tour Citadelle',date:'2026-07-15', time:'08:00', guests:6, amount:12000, status:'future'    },
  { id:'r5', client:'Paul M.',   service:'Chambre Standard',date:'2026-07-08',time:'12:00',guests:2, amount:5000,  status:'completed' },
];

const MOCK_INVENTORY = [
  { id:'i1', cat:'food',        name:'Riz (sak 50kg)',  qty:45,  unit:'sak',   min:20, price:2500  },
  { id:'i2', cat:'food',        name:'Poul (sò)',       qty:120, unit:'lib',   min:50, price:180   },
  { id:'i3', cat:'medicine',    name:'Paracetamol 500', qty:350, unit:'bwat',  min:100,price:150   },
  { id:'i4', cat:'cleaning',    name:'Dézinfektan',     qty:15,  unit:'galon', min:10, price:800   },
  { id:'i5', cat:'uniforms',    name:'Chemiz Hotel',    qty:80,  unit:'pyès',  min:30, price:1200  },
  { id:'i6', cat:'equipment',   name:'Vantilaton',      qty:8,   unit:'unit',  min:5,  price:15000 },
];

const MOCK_WALLET_BALANCES = [
  { code:'USD', balance:12450.00 },
  { code:'EUR', balance:8320.50  },
  { code:'HTG', balance:1850000  },
  { code:'DOP', balance:95000    },
  { code:'MXN', balance:0        },
  { code:'CAD', balance:2100     },
  { code:'GBP', balance:0        },
  { code:'USDT',balance:5000     },
];

const MOCK_TRANSACTIONS = [
  { id:'t1', type:'received', from:'Client Hôtel', amount:8500,  currency:'HTG', date:'2026-07-11' },
  { id:'t2', type:'salary',   to:'Jean-Robert P.', amount:35000, currency:'HTG', date:'2026-07-10' },
  { id:'t3', type:'received', from:'Réservation',  amount:3200,  currency:'HTG', date:'2026-07-10' },
  { id:'t4', type:'sent',     to:'Fournisseur',    amount:125000,currency:'HTG', date:'2026-07-09' },
  { id:'t5', type:'received', from:'Escrow JOBFAST',amount:45000,currency:'HTG', date:'2026-07-09' },
];

const ANALYTICS_DATA = {
  months:   ['Jan','Fev','Mas','Avr','Me','Jen','Jiy'],
  revenue:  [250,  380,  310,  490,  520,  680, 750],
  expenses: [180,  250,  220,  310,  350,  420, 480],
  hires:    [5,    8,    6,    12,   10,   15,  18],
};

// ─────────────────────────────────────────────────────────────
// UI ATOMS
// ─────────────────────────────────────────────────────────────

function Chip({ label, active, onClick, color = 'amber' }) {
  const colors = {
    amber: 'bg-amber-500 text-slate-950',
    blue:  'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
  };
  return (
    <button type="button" onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
        active ? `${colors[color]} border-transparent` : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
      }`}>
      {label}
    </button>
  );
}

function StatCard({ icon, value, label, sub, color = 'text-white' }) {
  return (
    <div className="p-4 bg-[#0d1526] border border-slate-800 rounded-2xl">
      <span className="text-xl">{icon}</span>
      <p className={`text-xl font-black mt-1.5 ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">{label}</p>
      {sub && <p className="text-[9px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// Simple SVG bar chart
function BarChart({ data, labels, color = '#f59e0b', height = 60 }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-sm transition-all" style={{ height: `${(v / max) * (height - 16)}px`, background: color + '80' }} />
          <span className="text-[8px] text-slate-500">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

// Job slot indicator
function SlotIndicator({ filled, total, size = 'sm' }) {
  const pct = total > 0 ? filled / total : 0;
  const color = pct >= 1 ? 'bg-green-500' : pct >= 0.7 ? 'bg-amber-500' : 'bg-blue-500';
  if (size === 'xs') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
        </div>
        <span className="text-[9px] font-bold text-slate-400">{filled}/{total}</span>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400">{filled}/{total} {pct >= 1 ? '✅ Plen' : 'aksepte'}</span>
        <span className={`text-[10px] font-bold ${pct >= 1 ? 'text-green-400' : 'text-amber-400'}`}>{Math.round(pct * 100)}%</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HIRE WORKERS MODAL
// ─────────────────────────────────────────────────────────────

function HireWorkersModal({ onClose, onPublish }) {
  const [form, setForm] = useState({
    profession:'', needed:1, salary:'', city:'', country:'Haiti',
    startDate:'', endDate:'', workingHours:'8h/jou', overtime:false,
    accommodation:false, transportation:false, food:false,
    requirements:'', languages:'Kreyòl', certificates:'', contract:'',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]:v }));

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full bg-[#0d1526] rounded-t-3xl z-10 max-h-[90vh] flex flex-col">
        <div className="px-5 pt-4 pb-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="w-10 h-1 bg-slate-600 rounded-full absolute top-3 left-1/2 -translate-x-1/2" />
          <h3 className="text-base font-black text-white">👷 Rekrite Travayè</h3>
          <button type="button" onClick={onClose} className="text-slate-400">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Pwofesyon</label>
              <input value={form.profession} onChange={e => set('profession', e.target.value)}
                placeholder="Elektrisyen, Mason, Chofè…"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
            </div>
            <div className="w-24">
              <label className="text-xs text-slate-400 block mb-1">Kantite</label>
              <input value={form.needed} onChange={e => set('needed', Number(e.target.value))} type="number" min="1"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50" />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Salè</label>
              <input value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="HTG 35,000"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Vil</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Port-au-Prince"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Dat Kòmanse</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Dat Fini</label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Kontra / Dirasyon</label>
            <input value={form.contract} onChange={e => set('contract', e.target.value)} placeholder="1 mwa, 3 mwa, pèmanan…"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none" />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { key:'overtime',      label:'Siplemantè (Overtime)' },
              { key:'accommodation', label:'Lojman Fourni'         },
              { key:'transportation',label:'Transpò Fourni'        },
              { key:'food',          label:'Manje Fourni'          },
            ].map(item => (
              <label key={item.key} className="flex items-center gap-2 p-2.5 bg-slate-800/60 rounded-xl cursor-pointer">
                <input type="checkbox" checked={form[item.key]} onChange={e => set(item.key, e.target.checked)}
                  className="w-4 h-4 accent-amber-500" />
                <span className="text-xs text-slate-300">{item.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Lang obligatwa</label>
            <input value={form.languages} onChange={e => set('languages', e.target.value)} placeholder="Kreyòl, Français, English…"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none" />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Ekzijans espesyal</label>
            <textarea value={form.requirements} onChange={e => set('requirements', e.target.value)} rows={2} placeholder="Eksperyans, sètifika, kondisyon fizik…"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none resize-none" />
          </div>

          {/* Slot preview */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
            <p className="text-xs font-bold text-amber-400 mb-2">👁 Apèsi Slot Tracker</p>
            <p className="text-sm font-black text-white">{form.profession || 'Pwofesyon'}</p>
            <p className="text-xs text-slate-400 mb-2">{form.needed} Pòs • {form.city || '—'}</p>
            <SlotIndicator filled={0} total={form.needed} />
          </div>
        </div>

        <div className="px-5 pb-10 pt-3 border-t border-slate-800 shrink-0">
          <button type="button" onClick={() => { onPublish(form); onClose(); }}
            disabled={!form.profession.trim() || !form.needed}
            className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-sm">
            📋 Pibliye Rekritman
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BRANCH DETAIL VIEW
// ─────────────────────────────────────────────────────────────

function BranchDetail({ branch, onBack, onSave }) {
  const [tab, setTab]       = useState('overview');
  const [perms, setPerms]   = useState({ ...branch.permissions });
  const [editing, setEditing] = useState(false);

  const BRANCH_TABS = ['overview','employees','jobs','reservations','customers','inventory','finance','settings'];

  const handleSavePerm = () => { onSave({ ...branch, permissions: perms }); setEditing(false); };

  const empStats = {
    total:    branch.employees,
    online:   branch.online,
    working:  branch.working,
    vacation: branch.vacation,
    offline:  branch.offline,
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Branch header */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3 border-b border-slate-800">
        <button type="button" onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 shrink-0">←</button>
        <div className="min-w-0">
          <h2 className="text-base font-black text-white">{branch.flag} {branch.name}</h2>
          <p className="text-xs text-slate-400">{branch.city}, {branch.country} · {branch.employees} anplwaye</p>
        </div>
        <span className="ml-auto text-[10px] bg-green-500/10 border border-green-500/40 text-green-400 px-2 py-0.5 rounded-full font-bold">Aktif</span>
      </div>

      {/* Branch sub-tabs */}
      <div className="px-4 py-2 overflow-x-auto" style={{ scrollbarWidth:'none' }}>
        <div className="flex gap-1">
          {BRANCH_TABS.map(bt => (
            <Chip key={bt} label={bt.charAt(0).toUpperCase() + bt.slice(1)} active={tab === bt} onClick={() => setTab(bt)} />
          ))}
        </div>
      </div>

      <div className="px-4 flex-1 space-y-4 py-3">
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon="👥" value={empStats.total}    label="Total Anplwaye"    color="text-white"       />
              <StatCard icon="🟢" value={empStats.online}   label="Anliy Kounye a"   color="text-green-400"   />
              <StatCard icon="⚡" value={empStats.working}  label="Ap Travay"        color="text-amber-400"   />
              <StatCard icon="🏖" value={empStats.vacation} label="Vakans"           color="text-blue-400"    />
            </div>
            <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
              <p className="text-xs text-slate-400 mb-1">Manager</p>
              <p className="text-sm font-bold text-white">{branch.manager || '—'}</p>
            </div>
          </>
        )}

        {tab === 'employees' && (
          <div>
            {/* Status breakdown */}
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {[
                { label:'Total',    val:empStats.total,    color:'text-white'      },
                { label:'Anliy',    val:empStats.online,   color:'text-green-400'  },
                { label:'Travay',   val:empStats.working,  color:'text-amber-400'  },
                { label:'Vakans',   val:empStats.vacation, color:'text-blue-400'   },
                { label:'Offline',  val:empStats.offline,  color:'text-slate-400'  },
              ].map(s => (
                <div key={s.label} className="bg-slate-800/60 rounded-xl p-2 text-center">
                  <p className={`text-sm font-black ${s.color}`}>{s.val}</p>
                  <p className="text-[8px] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 text-center">Klike sou Dashboard Global pou wè lis konplè anplwaye yo</p>
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">Pèmisyon Branch</p>
              {editing ? (
                <div className="flex gap-2">
                  <button type="button" onClick={handleSavePerm} className="text-xs text-green-400 font-bold">✓ Sove</button>
                  <button type="button" onClick={() => { setPerms({ ...branch.permissions }); setEditing(false); }} className="text-xs text-slate-400">Anile</button>
                </div>
              ) : (
                <button type="button" onClick={() => setEditing(true)} className="text-xs text-amber-400 font-bold">✏️ Modifye</button>
              )}
            </div>
            {BRANCH_PERMISSIONS.map(p => (
              <div key={p.key} className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-700 rounded-xl">
                <span className="text-sm text-slate-300">{p.label}</span>
                <button type="button" onClick={() => editing && setPerms(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                  className={`relative w-11 h-6 rounded-full transition ${perms[p.key] ? 'bg-amber-500' : 'bg-slate-700'} ${!editing && 'opacity-60'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${perms[p.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
            <p className="text-[10px] text-slate-500 text-center">Sèlman Pwopriyetè ak Administratè ki kapab chanje pèmisyon yo.</p>
          </div>
        )}

        {(tab === 'jobs' || tab === 'reservations' || tab === 'customers' || tab === 'inventory' || tab === 'finance') && (
          <div className="flex flex-col items-center py-10 gap-3">
            <span className="text-4xl">🔗</span>
            <p className="text-sm text-slate-400 text-center">
              Tablo {tab} branch <strong className="text-white">{branch.name}</strong> disponib nan Dashboard Global
            </p>
            <p className="text-xs text-slate-500 text-center">Filtre pa branch nan chak seksyon pou wè done branch sa a sèlman</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GLOBAL CONTROL CENTER
// ─────────────────────────────────────────────────────────────

function GlobalControlCenter({ branches }) {
  const totalEmployees   = branches.reduce((s, b) => s + b.employees, 0);
  const totalOnline      = branches.reduce((s, b) => s + b.online, 0);
  const countries        = [...new Set(branches.map(b => b.country))];

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-900 p-5 border border-indigo-700/40">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-indigo-500/5" />
        <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mb-3">🌐 JOBFAST Enterprise — Global Control Center</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon:'🌍', label:'Peyi',          value:countries.length    },
            { icon:'🏢', label:'Branch',         value:branches.length     },
            { icon:'👥', label:'Anplwaye Total', value:totalEmployees.toLocaleString() },
            { icon:'🟢', label:'Anliy',          value:totalOnline         },
            { icon:'💼', label:'Pòs Ouvè',       value:MOCK_JOB_SLOTS.filter(j => j.filled < j.total).reduce((s, j) => s + (j.total - j.filled), 0) },
            { icon:'💰', label:'Rev. Jodia (est.)', value:'$2,431K'        },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-2xl p-3 text-center">
              <span className="text-xl">{s.icon}</span>
              <p className="text-base font-black text-white mt-1">{s.value}</p>
              <p className="text-[9px] text-indigo-300 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Countries breakdown */}
      <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
        <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-3">Peyi Aktif</p>
        {countries.map(c => {
          const brs = branches.filter(b => b.country === c);
          const total = brs.reduce((s, b) => s + b.employees, 0);
          const flag = brs[0]?.flag || '🌍';
          return (
            <div key={c} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
              <span className="text-xl">{flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{c}</p>
                <p className="text-xs text-slate-400">{brs.length} branch</p>
              </div>
              <p className="text-sm font-black text-amber-400">{total} anplwaye</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN TABS CONTENT
// ─────────────────────────────────────────────────────────────

function DashboardTab({ company, branches, jobSlots, businessType }) {
  const bt = BUSINESS_TYPES.find(b => b.id === businessType) || BUSINESS_TYPES[6];
  const totalEmp = branches.reduce((s, b) => s + b.employees, 0);
  const openSlots = jobSlots.reduce((s, j) => s + Math.max(0, j.total - j.filled), 0);

  return (
    <div className="space-y-4">
      {/* Company identity card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-800 via-indigo-800 to-slate-900 p-5 shadow-2xl">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <span className="text-4xl">{bt.icon}</span>
          <div>
            <h1 className="text-lg font-black text-white">{company?.name || 'Enterprise'}</h1>
            <p className="text-blue-200 text-xs">{bt.label} · {branches.length} Branch</p>
          </div>
          {company?.verified && <span className="ml-auto text-[10px] bg-green-500/20 border border-green-500/40 text-green-400 px-2 py-0.5 rounded-full font-bold">✓ Verifye</span>}
        </div>
        <div className="grid grid-cols-4 gap-2 relative z-10">
          {[
            { icon:'🏢', label:'Branch',  value:branches.length     },
            { icon:'👥', label:'Anplwaye',value:totalEmp            },
            { icon:'💼', label:'Pòs lib', value:openSlots           },
            { icon:'📅', label:"Rezèvas", value:MOCK_RESERVATIONS.filter(r => r.status === 'upcoming').length },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-2xl p-2.5 text-center">
              <span className="text-base">{s.icon}</span>
              <p className="text-base font-black text-white mt-0.5">{s.value}</p>
              <p className="text-[9px] text-blue-200">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick slot overview */}
      <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
        <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-3">📋 Pòs Rekritman</p>
        {jobSlots.slice(0, 3).map(j => (
          <div key={j.id} className="mb-3 last:mb-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-white">{j.icon} {j.profession}</span>
              {j.filled >= j.total
                ? <span className="text-[10px] bg-green-500/10 border border-green-500/40 text-green-400 px-2 py-0.5 rounded-full font-bold">✅ Plen</span>
                : j.urgent && <span className="text-[10px] bg-red-500/10 border border-red-500/40 text-red-400 px-2 py-0.5 rounded-full font-bold">🔥 Ijan</span>
              }
            </div>
            <SlotIndicator filled={j.filled} total={j.total} size="xs" />
          </div>
        ))}
      </div>

      {/* Today's reservations */}
      {MOCK_RESERVATIONS.filter(r => r.status === 'upcoming').length > 0 && (
        <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-3">📅 Rezèvas Jodia</p>
          {MOCK_RESERVATIONS.filter(r => r.status === 'upcoming').map(r => (
            <div key={r.id} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xs font-black text-blue-400 shrink-0">
                {r.time.slice(0,5)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{r.client}</p>
                <p className="text-xs text-slate-400 truncate">{r.service}</p>
              </div>
              <p className="text-sm font-black text-amber-400 shrink-0">HTG {r.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Global CC (enterprise-level) */}
      {branches.length >= 3 && <GlobalControlCenter branches={branches} />}
    </div>
  );
}

function BranchesTab({ branches, setBranches, countryFilter, setCountryFilter }) {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newBranch, setNewBranch] = useState({ name:'', city:'', country:'Haiti', manager:'' });

  const allCountries = [...new Set(branches.map(b => b.country))];
  const filtered = countryFilter === 'all' ? branches : branches.filter(b => b.country === countryFilter);

  const handleSaveBranch = (updated) => {
    setBranches(p => p.map(b => b.id === updated.id ? updated : b));
    setSelectedBranch(updated);
  };

  const handleCreateBranch = () => {
    if (!newBranch.name.trim()) return;
    const created = { ...newBranch, id:`b${Date.now()}`, employees:0, online:0, working:0, vacation:0, offline:0,
      flag: COUNTRIES_LIST.includes(newBranch.country) ? '🌍' : '🌍', status:'active',
      permissions:{ canHire:false, canReceivePay:false, canViewFinance:false, canManageInventory:false, canCreateJob:false, canManageCustomers:false } };
    setBranches(p => [...p, created]);
    setNewBranch({ name:'', city:'', country:'Haiti', manager:'' });
    setShowCreate(false);
  };

  if (selectedBranch) {
    return <BranchDetail branch={selectedBranch} onBack={() => setSelectedBranch(null)} onSave={handleSaveBranch} />;
  }

  return (
    <div className="space-y-4">
      {/* Country filter */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
        <Chip label="Tout Peyi" active={countryFilter === 'all'} onClick={() => setCountryFilter('all')} />
        {allCountries.map(c => (
          <Chip key={c} label={c} active={countryFilter === c} onClick={() => setCountryFilter(c)} />
        ))}
      </div>

      {/* Create branch button */}
      <button type="button" onClick={() => setShowCreate(v => !v)}
        className="w-full py-3 rounded-2xl border border-dashed border-amber-500/40 text-amber-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-500/5 transition">
        + Kreye Branch
      </button>

      {showCreate && (
        <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl space-y-3">
          <input value={newBranch.name} onChange={e => setNewBranch(p => ({ ...p, name:e.target.value }))} placeholder="Non branch lan"
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none" />
          <div className="flex gap-2">
            <input value={newBranch.city} onChange={e => setNewBranch(p => ({ ...p, city:e.target.value }))} placeholder="Vil"
              className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none" />
            <select value={newBranch.country} onChange={e => setNewBranch(p => ({ ...p, country:e.target.value }))}
              className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
              {COUNTRIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input value={newBranch.manager} onChange={e => setNewBranch(p => ({ ...p, manager:e.target.value }))} placeholder="Branch Manager (opsyonèl)"
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none" />
          <div className="flex gap-2">
            <button type="button" onClick={handleCreateBranch} className="flex-1 py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-sm">✅ Kreye</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-3 rounded-xl border border-slate-700 text-slate-400 text-sm">Anile</button>
          </div>
        </div>
      )}

      {/* Branch list */}
      {filtered.map(branch => (
        <button key={branch.id} type="button" onClick={() => setSelectedBranch(branch)}
          className="w-full text-left bg-[#0d1526] border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition">
          <div className="flex items-center gap-3 p-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-2xl shrink-0">
              {branch.flag}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white">{branch.name}</p>
              <p className="text-xs text-slate-400">{branch.city} · {branch.country}</p>
              {branch.manager && <p className="text-[10px] text-slate-500 mt-0.5">Manager: {branch.manager}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-base font-black text-white">{branch.employees}</p>
              <p className="text-[10px] text-slate-400">Anplwaye</p>
              <span className="text-[9px] text-green-400 font-bold">● Aktif</span>
            </div>
          </div>
          {/* Employee breakdown bar */}
          <div className="px-4 pb-3 flex gap-1">
            {[
              { label:'Travay', val:branch.working,  color:'bg-amber-400' },
              { label:'Anliy',  val:branch.online,   color:'bg-green-400' },
              { label:'Vakans', val:branch.vacation, color:'bg-blue-400'  },
              { label:'Offline',val:branch.offline,  color:'bg-slate-600' },
            ].map(s => (
              <div key={s.label} className="flex-1 flex flex-col items-center gap-0.5">
                <div className={`w-full h-1.5 rounded-full ${s.color} opacity-70`} style={{ opacity: branch.employees > 0 ? (s.val / branch.employees) * 0.8 + 0.2 : 0.2 }} />
                <span className="text-[8px] text-slate-500">{s.val} {s.label}</span>
              </div>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

function EmployeesTab({ branches }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');

  const totalStats = {
    total:    branches.reduce((s, b) => s + b.employees, 0),
    online:   branches.reduce((s, b) => s + b.online, 0),
    working:  branches.reduce((s, b) => s + b.working, 0),
    vacation: branches.reduce((s, b) => s + b.vacation, 0),
    offline:  branches.reduce((s, b) => s + b.offline, 0),
  };

  const filtered = MOCK_EMPLOYEES_ALL
    .filter(e => statusFilter === 'all' || e.status === statusFilter)
    .filter(e => branchFilter === 'all' || e.branch === branchFilter);

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label:'Total',   val:totalStats.total,    color:'text-white'       },
          { label:'Anliy',   val:totalStats.online,   color:'text-green-400'   },
          { label:'Travay',  val:totalStats.working,  color:'text-amber-400'   },
          { label:'Vakans',  val:totalStats.vacation, color:'text-blue-400'    },
          { label:'Offline', val:totalStats.offline,  color:'text-slate-400'   },
        ].map(s => (
          <div key={s.label} className="p-3 bg-[#0d1526] border border-slate-800 rounded-2xl text-center">
            <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth:'none' }}>
        {['all','working','online','vacation','offline'].map(s => (
          <Chip key={s} label={s === 'all' ? 'Tout' : s.charAt(0).toUpperCase() + s.slice(1)} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth:'none' }}>
        <Chip label="Tout Branch" active={branchFilter === 'all'} onClick={() => setBranchFilter('all')} />
        {branches.map(b => (
          <Chip key={b.id} label={b.name} active={branchFilter === b.name} onClick={() => setBranchFilter(b.name)} />
        ))}
      </div>

      {/* Employee list */}
      <div className="space-y-2">
        {filtered.map(emp => (
          <div key={emp.id} className="flex items-center gap-3 p-3 bg-[#0d1526] border border-slate-800 rounded-xl">
            <div className="relative w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-sm font-black text-slate-300 shrink-0">
              {emp.name.charAt(0)}
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d1526] ${emp.online ? 'bg-green-500' : 'bg-slate-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{emp.name}</p>
              <p className="text-xs text-slate-400 truncate">{emp.role} · {emp.branch}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              emp.status === 'working' ? 'text-amber-400 bg-amber-500/10' :
              emp.status === 'online'  ? 'text-green-400 bg-green-500/10' :
              emp.status === 'vacation'? 'text-blue-400 bg-blue-500/10'   :
                                         'text-slate-400 bg-slate-700'
            }`}>{emp.status}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <span className="text-4xl">👥</span>
            <p className="text-slate-400 text-sm mt-2">Pa gen anplwaye nan filtre sa a</p>
          </div>
        )}
      </div>
    </div>
  );
}

function JobsTab({ jobSlots, setJobSlots, onPublish }) {
  const [showHire, setShowHire] = useState(false);

  const simulateFill = (jobId) => {
    setJobSlots(p => p.map(j => {
      if (j.id !== jobId) return j;
      const newFilled = Math.min(j.filled + 1, j.total);
      return { ...j, filled:newFilled };
    }));
  };

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setShowHire(true)}
        className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2">
        👷 Rekrite Travayè
      </button>

      {jobSlots.map(j => {
        const isFull = j.filled >= j.total;
        const open   = j.total - j.filled;
        return (
          <div key={j.id} className={`p-4 bg-[#0d1526] border rounded-2xl ${isFull ? 'border-green-700/60' : 'border-slate-800'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{j.icon}</span>
                  <p className="text-sm font-black text-white">{j.profession}</p>
                  {j.urgent && !isFull && <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded-full font-bold">🔥 Ijan</span>}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{j.salary} · 📍 {j.city}</p>
              </div>
              {isFull ? (
                <span className="text-[10px] bg-green-500/10 border border-green-500/40 text-green-400 px-2 py-0.5 rounded-full font-bold">✅ Rekritman Fini</span>
              ) : (
                <span className="text-[10px] bg-blue-500/10 border border-blue-500/40 text-blue-400 px-2 py-0.5 rounded-full font-bold">{open} Pòs Lib</span>
              )}
            </div>

            {/* Slot details grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center p-2 bg-slate-800/60 rounded-xl">
                <p className="text-base font-black text-white">{j.total}</p>
                <p className="text-[9px] text-slate-400">Pòs Total</p>
              </div>
              <div className="text-center p-2 bg-slate-800/60 rounded-xl">
                <p className="text-base font-black text-green-400">{j.filled}</p>
                <p className="text-[9px] text-slate-400">Aksepte</p>
              </div>
              <div className="text-center p-2 bg-slate-800/60 rounded-xl">
                <p className={`text-base font-black ${open > 0 ? 'text-amber-400' : 'text-slate-500'}`}>{open}</p>
                <p className="text-[9px] text-slate-400">Reste</p>
              </div>
            </div>

            <SlotIndicator filled={j.filled} total={j.total} />

            {isFull && (
              <div className="mt-3 p-3 bg-green-900/20 border border-green-700/40 rounded-xl">
                <p className="text-xs text-green-400 font-bold text-center">🎉 {j.total}/{j.total} Aksepte — Rekritman Fèmen Otomatikman</p>
                <p className="text-[10px] text-slate-400 text-center mt-0.5">Tout lòt aplikasyon te resevwa notifikasyon "Rekritman fèmen"</p>
              </div>
            )}

            {!isFull && (
              <button type="button" onClick={() => simulateFill(j.id)}
                className="mt-3 w-full py-2 rounded-xl border border-slate-700 text-slate-400 text-xs font-bold hover:border-amber-500/40 hover:text-amber-400 transition">
                + Simulé Akseptasyon (démo)
              </button>
            )}
          </div>
        );
      })}

      {showHire && <HireWorkersModal onClose={() => setShowHire(false)} onPublish={onPublish} />}
    </div>
  );
}

function FinanceTab({ walletData, walletLoading }) {
  const [activeCurrency, setActiveCurrency] = useState('HTG');
  const [showSend, setShowSend] = useState(false);

  const cur = CURRENCIES.find(c => c.code === activeCurrency) || CURRENCIES[2];

  const getBalance = (code) => {
    if (walletData?.balances) {
      const b = walletData.balances.find(b => b.currency === code);
      return b ? (b.available || 0) / 100 : 0;
    }
    return MOCK_WALLET_BALANCES.find(b => b.code === code)?.balance || 0;
  };

  const bal = getBalance(activeCurrency);
  const displayTransactions = (walletData?.transactions && walletData.transactions.length > 0)
    ? walletData.transactions
    : MOCK_TRANSACTIONS;

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-800 p-5 shadow-2xl shadow-indigo-900/50">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
        <p className="text-indigo-200 text-xs uppercase tracking-widest mb-1">{cur.flag} {cur.code} — Balans Kounye a</p>
        {walletLoading
          ? <p className="text-3xl font-black text-white/40 animate-pulse">···</p>
          : <p className="text-3xl font-black text-white">{cur.symbol}{bal.toLocaleString()}</p>
        }
        <p className="text-indigo-200 text-xs mt-1">Wallet Entènasyonal JOBFAST</p>
      </div>

      {/* Currency selector */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
        {CURRENCIES.map(c => {
          const b = getBalance(c.code);
          return (
            <button key={c.code} type="button" onClick={() => setActiveCurrency(c.code)}
              className={`shrink-0 flex flex-col items-center p-2.5 rounded-2xl border text-center min-w-[64px] transition ${
                activeCurrency === c.code ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-slate-800/60 border-slate-700'
              }`}>
              <span className="text-xl leading-none">{c.flag}</span>
              <span className="text-[10px] font-black text-white mt-1">{c.code}</span>
              <span className={`text-[8px] ${b ? 'text-green-400' : 'text-slate-500'}`}>{b ? c.symbol + (b >= 1000 ? (b / 1000).toFixed(1) + 'k' : b) : '—'}</span>
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon:'📤', label:'Voye', action:() => setShowSend(true) },
          { icon:'📥', label:'Resevwa', action:() => {} },
          { icon:'💳', label:'Depo', action:() => {} },
          { icon:'🏦', label:'Retir', action:() => {} },
        ].map(a => (
          <button key={a.label} type="button" onClick={a.action}
            className="flex flex-col items-center gap-1.5 p-3 bg-[#0d1526] border border-slate-700 rounded-2xl hover:border-amber-500/40 transition">
            <span className="text-2xl">{a.icon}</span>
            <span className="text-xs font-bold text-slate-300">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Transactions */}
      <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
        <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-3">Dènye Tranzaksyon</p>
        {displayTransactions.map(tx => (
          <div key={tx.id} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
              tx.type === 'received' ? 'bg-green-500/10' : tx.type === 'salary' ? 'bg-amber-500/10' : 'bg-red-500/10'
            }`}>
              {tx.type === 'received' ? '📥' : tx.type === 'salary' ? '💰' : '📤'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{tx.from || tx.to}</p>
              <p className="text-xs text-slate-400">{tx.date}</p>
            </div>
            <p className={`text-sm font-black shrink-0 ${tx.type === 'received' ? 'text-green-400' : 'text-red-400'}`}>
              {tx.type === 'received' ? '+' : '-'}{tx.currency} {tx.amount.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Salary payment button */}
      <button type="button" onClick={() => setShowSend(true)}
        className="w-full py-4 rounded-2xl bg-green-500/10 border border-green-500/40 text-green-400 font-black text-sm flex items-center justify-center gap-2">
        💰 Peye Salè Anplwaye yo
      </button>

      {/* Send money modal */}
      {showSend && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/75" onClick={() => setShowSend(false)} />
          <div className="relative w-full bg-[#0d1526] rounded-t-3xl p-5 pb-10 z-10">
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-black text-white mb-4">📤 Voye Lajan</h3>
            <div className="space-y-3">
              <input placeholder="Destinatè (non oswa nimewo)" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none" />
              <div className="flex gap-2">
                <input placeholder="Montan" type="number" className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none" />
                <select defaultValue="HTG" className="w-24 px-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
              </div>
              <input placeholder="Nòt (opsyonèl)" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none" />
              <button type="button" onClick={() => setShowSend(false)} className="w-full py-4 rounded-2xl bg-violet-500 hover:bg-violet-400 text-white font-black text-sm">
                📤 Voye
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReservationsTab({ reservations, setReservations, user }) {
  const [statusTab, setStatusTab] = useState('upcoming');
  const [showNew, setShowNew] = useState(false);
  const [newRes, setNewRes] = useState({ client:'', service:'', date:'', time:'', amount:0, guests:1 });

  const confirmRes = async (id) => {
    setReservations(p => p.map(r => r.id === id ? { ...r, status:'thisweek' } : r));
    try { await API.patch(`/bookings/${id}/status`, { status: 'confirmed' }); } catch {}
  };
  const cancelRes = async (id) => {
    setReservations(p => p.map(r => r.id === id ? { ...r, status:'cancelled' } : r));
    try { await API.patch(`/bookings/${id}/status`, { status: 'cancelled' }); } catch {}
  };

  const handleCreate = async () => {
    if (!newRes.client || !newRes.date) return;
    const uid = user?._id || user?.id;
    const optimistic = { id: `r${Date.now()}`, ...newRes, status:'upcoming' };
    setReservations(p => [optimistic, ...p]);
    setShowNew(false);
    try {
      const res = await API.post('/bookings', {
        title: newRes.service || 'Rezèvas',
        serviceType: 'enterprise',
        providerId: uid,
        clientId: newRes.client,
        date: newRes.date,
        time: newRes.time,
        price: Number(newRes.amount),
      });
      if (res?.data?.success) {
        setReservations(p => p.map(r => r.id === optimistic.id ? { ...optimistic, id: res.data.data.id } : r));
      }
    } catch {}
  };

  const filtered = reservations.filter(r => r.status === statusTab);
  const cfg = RESERVATION_STATUSES.find(s => s.id === statusTab) || RESERVATION_STATUSES[0];

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setShowNew(v => !v)}
        className="w-full py-3 rounded-2xl border border-dashed border-amber-500/40 text-amber-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-500/5 transition">
        + Nouvo Rezèvas
      </button>

      {showNew && (
        <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Kliyan</label>
              <input value={newRes.client} onChange={e => setNewRes(p => ({ ...p, client:e.target.value }))} placeholder="Non kliyan"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Sèvis</label>
              <input value={newRes.service} onChange={e => setNewRes(p => ({ ...p, service:e.target.value }))} placeholder="Chambre, Table…"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Dat</label>
              <input type="date" value={newRes.date} onChange={e => setNewRes(p => ({ ...p, date:e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">Lè</label>
              <input type="time" value={newRes.time} onChange={e => setNewRes(p => ({ ...p, time:e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none" />
            </div>
            <div className="w-24">
              <label className="text-xs text-slate-400 block mb-1">Montan</label>
              <input type="number" value={newRes.amount} onChange={e => setNewRes(p => ({ ...p, amount:e.target.value }))} placeholder="0"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleCreate} className="flex-1 py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-sm">✅ Kreye</button>
            <button type="button" onClick={() => setShowNew(false)} className="px-4 py-3 rounded-xl border border-slate-700 text-slate-400 text-sm">Anile</button>
          </div>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth:'none' }}>
        {RESERVATION_STATUSES.map(s => (
          <button key={s.id} type="button" onClick={() => setStatusTab(s.id)}
            className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition ${statusTab === s.id ? `${s.bg} ${s.color}` : 'bg-slate-800 text-slate-400'}`}>
            {s.label} ({reservations.filter(r => r.status === s.id).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-2">
          <span className="text-4xl">📅</span>
          <p className="text-sm text-slate-400">Pa gen rezèvas {cfg.label.toLowerCase()}</p>
        </div>
      ) : filtered.map(r => (
        <div key={r.id} className="p-4 bg-[#0d1526] border border-slate-800 rounded-2xl">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-black text-white">{r.client}</p>
              <p className="text-xs text-slate-400">{r.service}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-400">📅 {r.date} {r.time}</span>
            <span className="text-xs text-slate-400">👥 {r.guests}</span>
            <span className="text-sm font-black text-amber-400 ml-auto">HTG {r.amount.toLocaleString()}</span>
          </div>
          {r.status === 'upcoming' && (
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => confirmRes(r.id)} className="flex-1 py-2 rounded-xl bg-green-500/10 border border-green-500/40 text-green-400 text-xs font-bold">✓ Konfime</button>
              <button type="button" onClick={() => cancelRes(r.id)}  className="flex-1 py-2 rounded-xl border border-red-500/30 text-red-400 text-xs font-bold">✕ Anile</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function InventoryTab({ inventory, setInventory }) {
  const [catFilter, setCatFilter] = useState('all');

  const filtered = catFilter === 'all' ? inventory : inventory.filter(i => i.cat === catFilter);
  const lowStock = inventory.filter(i => i.qty <= i.min);

  return (
    <div className="space-y-4">
      {lowStock.length > 0 && (
        <div className="p-4 bg-red-900/20 border border-red-700/40 rounded-2xl">
          <p className="text-xs font-bold text-red-400 mb-2">⚠️ {lowStock.length} atik bese (stòk ba)</p>
          {lowStock.map(i => (
            <p key={i.id} className="text-xs text-slate-300">• {i.name}: {i.qty} {i.unit} (min {i.min})</p>
          ))}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth:'none' }}>
        <Chip label="Tout" active={catFilter === 'all'} onClick={() => setCatFilter('all')} />
        {INVENTORY_CATS.map(c => <Chip key={c.id} label={c.icon + ' ' + c.label} active={catFilter === c.id} onClick={() => setCatFilter(c.id)} />)}
      </div>

      <div className="space-y-2">
        {filtered.map(item => {
          const cat = INVENTORY_CATS.find(c => c.id === item.cat);
          const isLow = item.qty <= item.min;
          return (
            <div key={item.id} className={`p-4 bg-[#0d1526] border rounded-2xl ${isLow ? 'border-red-700/50' : 'border-slate-800'}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl shrink-0">{cat?.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-black ${isLow ? 'text-red-400' : 'text-amber-400'}`}>{item.qty} {item.unit}</span>
                    {isLow && <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 rounded-full font-bold">Stòk Ba</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">HTG {item.price.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-500">pa {item.unit}</p>
                </div>
              </div>
              <div className="mt-2">
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-green-500'}`} style={{ width:`${Math.min(item.qty / (item.min * 3) * 100, 100)}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => setInventory(p => p.map(i => i.id === item.id ? {...i, qty: Math.max(0, i.qty-1)} : i))}
                  className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-black flex items-center justify-center">−</button>
                <span className="text-sm font-black text-white w-8 text-center">{item.qty}</span>
                <button onClick={() => setInventory(p => p.map(i => i.id === item.id ? {...i, qty: i.qty+1} : i))}
                  className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-black flex items-center justify-center">+</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportsTab() {
  return (
    <div className="space-y-4">
      {/* Revenue chart */}
      <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">💰 Revni vs Depans (USD)</p>
          <select className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none">
            <option>6 dènye mwa</option>
            <option>12 mwa</option>
          </select>
        </div>
        <BarChart data={ANALYTICS_DATA.revenue} labels={ANALYTICS_DATA.months} color="#f59e0b" height={80} />
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-400" /><span className="text-[10px] text-slate-400">Revni ($k)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-400" /><span className="text-[10px] text-slate-400">Depans ($k)</span></div>
        </div>
      </div>

      {/* Hiring chart */}
      <div className="p-4 bg-[#0d1526] border border-slate-700 rounded-2xl">
        <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-3">👷 Rekritman pa Mwa</p>
        <BarChart data={ANALYTICS_DATA.hires} labels={ANALYTICS_DATA.months} color="#6366f1" height={60} />
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon:'💰', label:'Revni Total (est.)',   value:'$4.38M', color:'text-amber-400' },
          { icon:'📉', label:'Depans Total (est.)',   value:'$2.21M', color:'text-red-400'   },
          { icon:'📈', label:'Marge Benefis',          value:'49.5%',  color:'text-green-400' },
          { icon:'👥', label:'Nouvo Anplwaye (mwa)',   value:'+18',    color:'text-blue-400'  },
          { icon:'📅', label:'Rezèvas (mwa)',           value:'284',    color:'text-indigo-400'},
          { icon:'⭐', label:'Satisfaksyon Kliyan',     value:'4.8/5',  color:'text-amber-400' },
        ].map(k => (
          <div key={k.label} className="p-4 bg-[#0d1526] border border-slate-800 rounded-2xl">
            <span className="text-xl">{k.icon}</span>
            <p className={`text-xl font-black mt-1.5 ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

const MAIN_TABS = [
  { id:'dashboard',    icon:'🏠', label:'Dashboard'   },
  { id:'branches',     icon:'🏢', label:'Branch yo'   },
  { id:'employees',    icon:'👥', label:'Anplwaye'    },
  { id:'jobs',         icon:'💼', label:'Travay'      },
  { id:'finance',      icon:'💰', label:'Finans'      },
  { id:'reservations', icon:'📅', label:'Rezèvas'     },
  { id:'inventory',    icon:'📦', label:'Envantè'     },
  { id:'reports',      icon:'📊', label:'Rapò'        },
];

export default function EnterpriseDashboard() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const { t }       = useTranslation();

  const [tab, setTab]               = useState('dashboard');
  const [businessType, setBusinessType] = useState(user?.companyData?.businessType || 'enterprise');
  const [branches, setBranches]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('jf_ent_branches') || 'null') || MOCK_BRANCHES; } catch { return MOCK_BRANCHES; }
  });
  const [jobSlots, setJobSlots]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('jf_ent_jobs') || 'null') || MOCK_JOB_SLOTS; } catch { return MOCK_JOB_SLOTS; }
  });
  const [walletData,    setWalletData]    = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [reservations,  setReservations]  = useState(MOCK_RESERVATIONS);
  const [inventory,     setInventory]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('jf_ent_inventory') || 'null') || MOCK_INVENTORY; } catch { return MOCK_INVENTORY; }
  });
  const [countryFilter, setCountryFilter] = useState('all');
  const [showTypeSelect, setShowTypeSelect] = useState(false);

  // Persist branches to localStorage
  useEffect(() => { try { localStorage.setItem('jf_ent_branches', JSON.stringify(branches)); } catch {} }, [branches]);
  // Persist jobSlots to localStorage
  useEffect(() => { try { localStorage.setItem('jf_ent_jobs', JSON.stringify(jobSlots)); } catch {} }, [jobSlots]);
  // Persist inventory to localStorage
  useEffect(() => { try { localStorage.setItem('jf_ent_inventory', JSON.stringify(inventory)); } catch {} }, [inventory]);

  // Fetch wallet + reservations on mount
  useEffect(() => {
    API.get('/wallet')
      .then(res => { if (res?.data?.success) setWalletData(res.data.data?.wallet); })
      .catch(() => {})
      .finally(() => setWalletLoading(false));

    const uid = user?._id || user?.id;
    if (uid) {
      API.get('/bookings', { params: { userId: uid } })
        .then(res => {
          if (res?.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
            const statusMap = { pending:'upcoming', confirmed:'upcoming', in_progress:'thisweek', completed:'completed', cancelled:'cancelled' };
            setReservations(res.data.data.map(b => ({
              id: b.id,
              client: b.clientId || 'Kliyan',
              service: b.title || b.serviceType || 'Sèvis',
              date: b.date ? b.date.slice(0,10) : '',
              time: b.time || '09:00',
              guests: 1,
              amount: b.price || 0,
              status: statusMap[b.status] || 'upcoming',
            })));
          }
        })
        .catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePublishJob = (form) => {
    setJobSlots(p => [{
      id: `js${Date.now()}`, profession: form.profession,
      total: Number(form.needed), filled: 0, icon: '💼',
      salary: form.salary, city: form.city, urgent: false,
    }, ...p]);

    const uid = user?._id || user?.id;
    API.post('/jobs/create', {
      title: `${form.profession} — ${form.city || 'Haiti'}`,
      description: [form.requirements, form.languages ? 'Lang: ' + form.languages : '', form.contract ? 'Kontra: ' + form.contract : ''].filter(Boolean).join('\n'),
      type: 'recruitment',
      category: 'enterprise',
      location: { city: form.city, country: form.country || 'Haiti' },
      budget: parseInt((form.salary || '0').replace(/\D/g, '')) || 0,
      createdBy: uid,
    }).catch(() => {});

    if (uid) {
      API.post('/enterprise/alert', {
        enterpriseId: uid,
        enterpriseName: user?.name || 'Enterprise',
        skills: form.profession,
        city: form.city,
        country: form.country || 'Haiti',
      }).catch(() => {});
    }
  };

  const bt = BUSINESS_TYPES.find(b => b.id === businessType) || BUSINESS_TYPES[6];

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white pb-24">

      {/* ── Compact header ───────────────────────────────────── */}
      <div className="sticky top-14 z-30 bg-[#020617]/95 backdrop-blur-sm">
        {/* Business type bar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-800/50">
          <button type="button" onClick={() => setShowTypeSelect(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700 hover:border-amber-500/40 transition">
            <span className="text-base">{bt.icon}</span>
            <span className="text-xs font-bold text-white">{bt.label}</span>
            <span className="text-slate-400 text-[10px]">▼</span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white truncate">{user?.name || 'Enterprise'}</p>
            <p className="text-[10px] text-slate-400">{branches.length} Branch · {branches.reduce((s, b) => s + b.employees, 0)} Anplwaye</p>
          </div>
        </div>

        {/* Business type selector */}
        {showTypeSelect && (
          <div className="px-4 py-3 border-b border-slate-800 bg-[#0d1526]">
            <div className="grid grid-cols-4 gap-2">
              {BUSINESS_TYPES.map(bt => (
                <button key={bt.id} type="button"
                  onClick={() => { setBusinessType(bt.id); setShowTypeSelect(false); }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition ${
                    businessType === bt.id ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-800 border-slate-700'
                  }`}>
                  <span className="text-lg">{bt.icon}</span>
                  <span className="text-[9px] text-slate-300 leading-tight">{bt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex overflow-x-auto gap-1 px-2 py-1.5" style={{ scrollbarWidth:'none' }}>
          {MAIN_TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                tab === t.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
              }`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <div className="px-4 mt-4 flex-1">
        {tab === 'dashboard'    && <DashboardTab company={user} branches={branches} jobSlots={jobSlots} businessType={businessType} />}
        {tab === 'branches'     && <BranchesTab branches={branches} setBranches={setBranches} countryFilter={countryFilter} setCountryFilter={setCountryFilter} />}
        {tab === 'employees'    && <EmployeesTab branches={branches} />}
        {tab === 'jobs'         && <JobsTab jobSlots={jobSlots} setJobSlots={setJobSlots} onPublish={handlePublishJob} />}
        {tab === 'finance'      && <FinanceTab walletData={walletData} walletLoading={walletLoading} />}
        {tab === 'reservations' && <ReservationsTab reservations={reservations} setReservations={setReservations} user={user} />}
        {tab === 'inventory'    && <InventoryTab inventory={inventory} setInventory={setInventory} />}
        {tab === 'reports'      && <ReportsTab />}
      </div>
    </div>
  );
}
