/**
 * EnterpriseDashboard.jsx
 *
 * Enterprise-specific dashboard sections rendered inside Dashboard.jsx
 * for the 'enterprise' role.  This is a component, NOT a page.
 *
 * Extends the Company module with:
 *   - Multi-country, multi-region, multi-branch hierarchy
 *   - Configuration-driven country settings (language, currency, timezone)
 *   - Enterprise analytics at global / country / branch levels
 *   - Executive reporting
 *   - Scale-aware trust score
 *
 * Tabs:
 *   overview    → handled by Dashboard.jsx (EnterpriseOverviewSupplement + RoleDashboard)
 *   branches    → multi-branch management grouped by country / region
 *   countries   → configuration-driven country management
 *   recruitment → multi-country job posting (reuses company hiring pattern)
 *   analytics   → global → country → branch drill-down
 *   reports     → executive reporting (global, country, branch, revenue, employee)
 */

import React, {
  useState, useCallback, useMemo, memo,
} from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

// ── Pure computations ────────────────────────────────────────

export function computeEnterpriseTrustScore(user) {
  const completedJobs = user?.stats?.totalJobs ?? 0;
  const rating        = user?.stats?.rating    ?? 0;
  const verified      = !!user?.verified;
  const completeness  = user?.profileCompleteness ?? 0;
  const ed            = user?.enterpriseData || {};
  const payConf       = ed.paymentConfirmations ?? 0;
  const complaints    = ed.complaints           ?? 0;
  const branchCount   = (ed.branches   || []).length;
  const countryCount  = (ed.countries  || []).length;

  const complaintPenalty = complaints === 0 ? 10 : Math.max(0, 10 - complaints * 2);
  const scaleBonus       = Math.min(5, branchCount * 0.5) + Math.min(5, countryCount * 1);

  return Math.min(100, Math.round(
    25
    + Math.min(completedJobs, 20) * 1.0
    + (rating / 5) * 15
    + (completeness / 100) * 10
    + (verified ? 10 : 0)
    + complaintPenalty
    + scaleBonus,
  ));
}

export function computeEnterpriseCompleteness(user) {
  const meta    = user?.profileMetadata || {};
  const ed      = user?.enterpriseData  || {};
  const profile = ed.profile            || {};

  const checks = [
    { done: !!user?.name,                                      tip: 'Ajoute non antrepriz la' },
    { done: !!user?.email,                                      tip: 'Imèl verifye' },
    { done: !!(meta?.phone || user?.phone),                    tip: 'Ajoute nimewo telefòn global' },
    { done: !!profile.description,                             tip: 'Ekri deskripsyon antrepriz la' },
    { done: (profile.industries || []).length > 0,             tip: 'Chwazi sektè aktivite' },
    { done: (profile.countriesServed || []).length > 0,        tip: 'Ajoute peyi w opere' },
    { done: (ed.branches  || []).length > 0,                   tip: 'Ajoute premye branch ou' },
    { done: (ed.countries || []).length > 0,                   tip: 'Configure yon peyi' },
    { done: !!profile.website,                                  tip: 'Ajoute sit wèb' },
    { done: (profile.certifications || []).length > 0,         tip: 'Ajoute sètifika antrepriz' },
  ];

  const done = checks.filter(c => c.done).length;
  return {
    pct:     Math.round((done / checks.length) * 100),
    missing: checks.filter(c => !c.done).map(c => c.tip),
  };
}

// ── GPS hook ─────────────────────────────────────────────────
function useEnterpriseGPS() {
  const [acquiring, setAcquiring] = useState(false);
  const [gpsError,  setGpsError]  = useState(null);

  const acquire = useCallback((onSuccess) => {
    if (!navigator.geolocation) {
      setGpsError('GPS pa disponib sou aparèy sa a');
      return;
    }
    setAcquiring(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAcquiring(false);
        onSuccess({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setAcquiring(false);
        setGpsError('Pa ka jwenn lokasyon — ap itilize vil/peyi');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  return { acquiring, gpsError, acquire };
}

// ── Country presets (configuration-driven, not hardcoded behavior) ──
// Users pick from these presets then customise each setting.
export const COUNTRY_PRESETS = [
  { code: 'HT', name: 'Haiti',           language: 'HT', currency: 'HTG', timezone: 'America/Port-au-Prince', serviceZones: ['Nord','Sud','Ouest','Centre','Est'] },
  { code: 'DO', name: 'Repiblik Dominikèn', language: 'ES', currency: 'DOP', timezone: 'America/Santo_Domingo', serviceZones: [] },
  { code: 'US', name: 'Etazini',          language: 'EN', currency: 'USD', timezone: 'America/New_York',        serviceZones: [] },
  { code: 'FR', name: 'Lafrans',           language: 'FR', currency: 'EUR', timezone: 'Europe/Paris',            serviceZones: [] },
  { code: 'CA', name: 'Kanada',            language: 'FR', currency: 'CAD', timezone: 'America/Toronto',         serviceZones: [] },
  { code: 'MX', name: 'Meksik',            language: 'ES', currency: 'MXN', timezone: 'America/Mexico_City',    serviceZones: [] },
  { code: 'GB', name: 'Wayòm Ini',         language: 'EN', currency: 'GBP', timezone: 'Europe/London',          serviceZones: [] },
  { code: 'JM', name: 'Jamayik',           language: 'EN', currency: 'JMD', timezone: 'America/Jamaica',        serviceZones: [] },
  { code: 'BR', name: 'Brezil',            language: 'PT', currency: 'BRL', timezone: 'America/Sao_Paulo',      serviceZones: [] },
  { code: 'DE', name: 'Almay',             language: 'DE', currency: 'EUR', timezone: 'Europe/Berlin',          serviceZones: [] },
];

const JOB_STATUSES = [
  { id: 'posted',    label: 'Afiche',    color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
  { id: 'applied',   label: 'Aplikasyon',color: 'text-yellow-400',  bg: 'bg-yellow-500/10'  },
  { id: 'accepted',  label: 'Aksepte',   color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  { id: 'hired',     label: 'Angaje',    color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'active',    label: 'Aktif',     color: 'text-green-400',   bg: 'bg-green-500/10'   },
  { id: 'completed', label: 'Fini',      color: 'text-purple-400',  bg: 'bg-purple-500/10'  },
  { id: 'confirmed', label: 'Konfime',   color: 'text-indigo-400',  bg: 'bg-indigo-500/10'  },
  { id: 'paid',      label: 'Peye',      color: 'text-teal-400',    bg: 'bg-teal-500/10'    },
  { id: 'closed',    label: 'Fèmen',     color: 'text-slate-400',   bg: 'bg-slate-700/50'   },
  { id: 'paused',    label: 'Poz',       color: 'text-rose-400',    bg: 'bg-rose-500/10'    },
];

const BRANCH_STATUSES = [
  { id: 'active',   label: 'Aktif',    color: 'text-green-400',  bg: 'bg-green-500/10'  },
  { id: 'inactive', label: 'Inaktif',  color: 'text-slate-400',  bg: 'bg-slate-700/50'  },
  { id: 'opening',  label: 'K ap Ouvri', color: 'text-blue-400', bg: 'bg-blue-500/10'   },
];

const SCOPE_LABELS = {
  global:  '🌐 Global',
  country: '🌍 Peyi',
  branch:  '🏢 Branch',
};

// ── Reusable UI atoms ─────────────────────────────────────────

const Section = memo(function Section({ icon, title, action, children }) {
  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              {icon && <span>{icon}</span>}
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
});

const MiniStat = memo(function MiniStat({ value, label, color = 'indigo' }) {
  const colors = {
    indigo: 'text-indigo-400',
    amber:  'text-amber-500',
    green:  'text-emerald-400',
    rose:   'text-rose-400',
    blue:   'text-blue-400',
    purple: 'text-purple-400',
  };
  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3 text-center">
      <div className={`text-xl font-bold ${colors[color] || colors.indigo}`}>{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
    </div>
  );
});

function StatusBadge({ status, statusList = JOB_STATUSES }) {
  const s = statusList.find(j => j.id === status) || { label: status, color: 'text-slate-400', bg: 'bg-slate-700/50' };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color} ${s.bg}`}>
      {s.label}
    </span>
  );
}

// ── Shared save helper ────────────────────────────────────────
function useSaveEnterprise(user) {
  const { login } = useAuth();
  const userId = user?._id || user?.id;

  return useCallback(async (updatedED) => {
    login({ ...user, enterpriseData: updatedED });
    try {
      await API.patch('/enterprise/profile', { userId, enterpriseData: updatedED });
    } catch { /* keep optimistic for MVP */ }
  }, [user, userId, login]);
}

// ── OVERVIEW supplement ───────────────────────────────────────
export const EnterpriseOverviewSupplement = memo(function EnterpriseOverviewSupplement({ user }) {
  const trustScore = useMemo(() => computeEnterpriseTrustScore(user), [user]);
  const { pct }    = useMemo(() => computeEnterpriseCompleteness(user), [user]);
  const ed = user?.enterpriseData || {};

  const branchCount   = (ed.branches   || []).filter(b => b.status === 'active').length;
  const countryCount  = (ed.countries  || []).length;
  const employeeCount = (ed.employees  || []).filter(e => e.status === 'active').length;
  const openJobs      = (ed.jobs       || []).filter(j => ['posted','applied','hired','active'].includes(j.status)).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        <MiniStat value={countryCount}  label="Peyi"        color="indigo" />
        <MiniStat value={branchCount}   label="Branch Aktif" color="blue"   />
        <MiniStat value={employeeCount} label="Anplwaye"    color="green"  />
        <MiniStat value={openJobs}      label="Travay Ouvè" color="amber"  />
      </div>

      <div className="flex gap-3">
        <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400">🛡️ Konfyans Antrepriz</span>
            <span className="text-[10px] font-bold text-indigo-400">{trustScore}/100</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400 transition-all"
              style={{ width: `${trustScore}%` }}
            />
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 px-3 py-2 flex items-center gap-2 shrink-0">
          <span className="text-lg">{user?.verified ? '✅' : '⏳'}</span>
          <span className="text-xs font-medium text-slate-200">
            {user?.verified ? 'Verifye' : 'Annatant'}
          </span>
        </div>
      </div>

      {/* Profile completeness bar */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-3">
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] font-bold text-slate-400">📊 Konplè Pwofil</span>
          <span className="text-[10px] font-bold text-purple-400">{pct}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: pct >= 80 ? '#10b981' : pct >= 50 ? '#6366f1' : '#ef4444',
            }}
          />
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// BRANCHES TAB
// Branches grouped by country and region
// ─────────────────────────────────────────────────────────────
const BLANK_BRANCH = { name: '', countryCode: '', city: '', address: '', managerId: '', status: 'active' };

function BranchesTab({ user }) {
  const ed      = user?.enterpriseData || {};
  const branches = ed.branches || [];
  const countries = ed.countries || [];
  const saveED  = useSaveEnterprise(user);

  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState(BLANK_BRANCH);
  const [saving, setSaving]             = useState(false);
  const [expandedCountry, setExpanded]  = useState(null);

  const addBranch = useCallback(async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const newBranch = {
      id:             `b_${Date.now()}`,
      ...form,
      employees:      [],
      activeProjects: [],
      revenue:        0,
      createdAt:      new Date().toISOString(),
    };
    await saveED({ ...ed, branches: [newBranch, ...branches] });
    setForm(BLANK_BRANCH);
    setShowForm(false);
    setSaving(false);
  }, [form, ed, branches, saveED]);

  const setBranchStatus = useCallback(async (branchId, newStatus) => {
    const updated = branches.map(b => b.id === branchId ? { ...b, status: newStatus } : b);
    await saveED({ ...ed, branches: updated });
  }, [branches, ed, saveED]);

  // Group branches by country
  const byCountry = useMemo(() => {
    const groups = {};
    for (const b of branches) {
      const cc = b.countryCode || 'OTHER';
      if (!groups[cc]) groups[cc] = [];
      groups[cc].push(b);
    }
    return groups;
  }, [branches]);

  const getCountryName = (code) => {
    const c = countries.find(c => c.code === code);
    if (c) return c.name;
    const preset = COUNTRY_PRESETS.find(p => p.code === code);
    return preset?.name || code;
  };

  const totalActive   = branches.filter(b => b.status === 'active').length;
  const totalInactive = branches.filter(b => b.status !== 'active').length;

  return (
    <div className="space-y-4">

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <MiniStat value={branches.length} label="Total Branch"  color="indigo" />
        <MiniStat value={totalActive}     label="Aktif"          color="green"  />
        <MiniStat value={Object.keys(byCountry).length} label="Peyi" color="blue" />
      </div>

      {/* Branch list grouped by country */}
      <Section icon="🏢" title="Branch pa Peyi"
        action={
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold">
            <Plus className="w-3 h-3" /> Ajoute
          </button>
        }
      >
        {/* Add branch form */}
        {showForm && (
          <div className="mb-4 p-4 bg-slate-800/60 rounded-xl space-y-3">
            <input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
              placeholder="Non branch lan"
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/40" />

            <select value={form.countryCode} onChange={e => setForm(v => ({ ...v, countryCode: e.target.value }))}
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white outline-none">
              <option value="">— Chwazi Peyi —</option>
              {countries.length > 0
                ? countries.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)
                : COUNTRY_PRESETS.map(p => <option key={p.code} value={p.code}>{p.name} ({p.code})</option>)
              }
            </select>

            <div className="flex gap-2">
              <input value={form.city} onChange={e => setForm(v => ({ ...v, city: e.target.value }))}
                placeholder="Vil"
                className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />
              <select value={form.status} onChange={e => setForm(v => ({ ...v, status: e.target.value }))}
                className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white outline-none">
                {BRANCH_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            <input value={form.address} onChange={e => setForm(v => ({ ...v, address: e.target.value }))}
              placeholder="Adrès (opsyonèl)"
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />

            <div className="flex gap-2">
              <button onClick={addBranch} disabled={saving || !form.name.trim()}
                className="flex-1 py-2 bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-40">
                {saving ? 'Ap sove...' : 'Ajoute Branch'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs">Anile</button>
            </div>
          </div>
        )}

        {branches.length === 0 && !showForm && (
          <div className="text-center py-8 text-slate-500 text-xs">
            <p className="text-3xl mb-2">🏢</p>
            <p>Pa gen branch konfigire pou kounye a</p>
            <p className="text-[10px] mt-1 text-slate-600">Ajoute branch yo pou jere operasyon pa peyi</p>
          </div>
        )}

        {/* Grouped view */}
        <div className="space-y-3">
          {Object.entries(byCountry).map(([cc, cBranches]) => (
            <div key={cc} className="border border-slate-700/50 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(prev => prev === cc ? null : cc)}
                className="w-full flex items-center justify-between p-3 bg-slate-800/40 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🌍</span>
                  <span className="text-xs font-bold text-slate-200">{getCountryName(cc)}</span>
                  <span className="text-[10px] text-slate-500">({cBranches.length} branch)</span>
                </div>
                {expandedCountry === cc
                  ? <ChevronDown className="w-3 h-3 text-slate-400" />
                  : <ChevronRight className="w-3 h-3 text-slate-400" />}
              </button>

              {expandedCountry === cc && (
                <div className="p-2 space-y-2">
                  {cBranches.map(branch => {
                    const bs = BRANCH_STATUSES.find(s => s.id === branch.status) || BRANCH_STATUSES[0];
                    return (
                      <div key={branch.id} className="flex items-start justify-between p-2.5 bg-slate-800/50 rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-white">{branch.name}</p>
                          <p className="text-[10px] text-slate-400">{branch.city || '—'}</p>
                          <p className="text-[10px] text-slate-500">{(branch.employees || []).length} anplwaye</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bs.color} ${bs.bg}`}>
                            {bs.label}
                          </span>
                          {branch.status === 'active' && (
                            <button onClick={() => setBranchStatus(branch.id, 'inactive')}
                              className="text-[9px] text-rose-400">Dezaktive</button>
                          )}
                          {branch.status === 'inactive' && (
                            <button onClick={() => setBranchStatus(branch.id, 'active')}
                              className="text-[9px] text-green-400">Aktive</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Branch performance summary */}
      {branches.length > 0 && (
        <Section icon="📊" title="Pèfòmans Branch">
          <dl className="space-y-2.5">
            {[
              ['Total Branch',     branches.length],
              ['Branch Aktif',     totalActive],
              ['Branch Inaktif',   totalInactive],
              ['Peyi Kouvri',      Object.keys(byCountry).length],
              ['Anplwaye Total',   branches.reduce((s, b) => s + (b.employees || []).length, 0)],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-xs text-slate-400">{label}</dt>
                <dd className="text-xs font-bold text-white">{val}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COUNTRIES TAB
// Configuration-driven — all settings are customisable
// ─────────────────────────────────────────────────────────────
const BLANK_COUNTRY = { code: '', name: '', language: 'EN', currency: 'USD', timezone: '', taxRate: 0, minWage: 0, serviceZones: [] };

function CountriesTab({ user }) {
  const ed        = user?.enterpriseData || {};
  const countries = ed.countries || [];
  const saveED    = useSaveEnterprise(user);

  const [showForm, setShowForm]     = useState(false);
  const [selectedPreset, setPreset] = useState('');
  const [form, setForm]             = useState(BLANK_COUNTRY);
  const [saving, setSaving]         = useState(false);
  const [editingId, setEditingId]   = useState(null);

  // When a preset is selected, populate form with preset values
  const applyPreset = useCallback((code) => {
    const p = COUNTRY_PRESETS.find(p => p.code === code);
    if (p) setForm({
      code:         p.code,
      name:         p.name,
      language:     p.language,
      currency:     p.currency,
      timezone:     p.timezone,
      taxRate:      0,
      minWage:      0,
      serviceZones: p.serviceZones.join(', '),
    });
    setPreset(code);
  }, []);

  const addCountry = useCallback(async () => {
    if (!form.code.trim()) return;
    if (countries.some(c => c.code === form.code)) {
      alert(`Peyi ${form.code} deja konfigire`);
      return;
    }
    setSaving(true);
    const newCountry = {
      id:           `c_${Date.now()}`,
      ...form,
      serviceZones: typeof form.serviceZones === 'string'
        ? form.serviceZones.split(',').map(s => s.trim()).filter(Boolean)
        : (form.serviceZones || []),
      taxRate:      parseFloat(form.taxRate) || 0,
      minWage:      parseFloat(form.minWage) || 0,
      status:       'active',
      createdAt:    new Date().toISOString(),
    };
    await saveED({ ...ed, countries: [...countries, newCountry] });
    setForm(BLANK_COUNTRY);
    setPreset('');
    setShowForm(false);
    setSaving(false);
  }, [form, ed, countries, saveED]);

  const removeCountry = useCallback(async (countryId) => {
    const updated = countries.filter(c => c.id !== countryId);
    await saveED({ ...ed, countries: updated });
  }, [countries, ed, saveED]);

  return (
    <div className="space-y-4">

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <MiniStat value={countries.length}                                           label="Peyi Konfigire" color="indigo" />
        <MiniStat value={[...new Set(countries.map(c => c.language))].length}       label="Lang"           color="blue"   />
        <MiniStat value={[...new Set(countries.map(c => c.currency))].length}       label="Monnay"         color="amber"  />
      </div>

      <Section icon="🌍" title="Peyi Konfigire"
        action={
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold">
            <Plus className="w-3 h-3" /> Ajoute
          </button>
        }
      >
        {/* Add country form */}
        {showForm && (
          <div className="mb-4 p-4 bg-slate-800/60 rounded-xl space-y-3">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Chwazi yon Preset oswa konfigire manyèlman</p>
            <select value={selectedPreset} onChange={e => applyPreset(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white outline-none">
              <option value="">— Chwazi preset peyi —</option>
              {COUNTRY_PRESETS.map(p => <option key={p.code} value={p.code}>{p.name} ({p.code})</option>)}
            </select>

            <div className="flex gap-2">
              <input value={form.code} onChange={e => setForm(v => ({ ...v, code: e.target.value.toUpperCase() }))}
                placeholder="Kòd Peyi (HT, US...)" maxLength={3}
                className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />
              <input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
                placeholder="Non Peyi a"
                className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />
            </div>

            <div className="flex gap-2">
              <input value={form.language} onChange={e => setForm(v => ({ ...v, language: e.target.value }))}
                placeholder="Lang (HT, FR, EN...)"
                className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />
              <input value={form.currency} onChange={e => setForm(v => ({ ...v, currency: e.target.value }))}
                placeholder="Monnay (USD, HTG...)"
                className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />
            </div>

            <input value={form.timezone} onChange={e => setForm(v => ({ ...v, timezone: e.target.value }))}
              placeholder="Timezone (America/Port-au-Prince)"
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />

            <div className="flex gap-2">
              <input value={form.taxRate} onChange={e => setForm(v => ({ ...v, taxRate: e.target.value }))}
                placeholder="Taks %" type="number" min="0" max="100" step="0.1"
                className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />
              <input value={form.minWage} onChange={e => setForm(v => ({ ...v, minWage: e.target.value }))}
                placeholder="Salè minimum" type="number" min="0"
                className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />
            </div>

            <input value={typeof form.serviceZones === 'string' ? form.serviceZones : (form.serviceZones || []).join(', ')}
              onChange={e => setForm(v => ({ ...v, serviceZones: e.target.value }))}
              placeholder="Zòn sèvis (virgil: Nord, Sud, Est...)"
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />

            <div className="flex gap-2">
              <button onClick={addCountry} disabled={saving || !form.code.trim()}
                className="flex-1 py-2 bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-40">
                {saving ? 'Ap sove...' : 'Ajoute Peyi'}
              </button>
              <button onClick={() => { setShowForm(false); setPreset(''); setForm(BLANK_COUNTRY); }}
                className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs">Anile</button>
            </div>
          </div>
        )}

        {countries.length === 0 && !showForm && (
          <div className="text-center py-8 text-slate-500 text-xs">
            <p className="text-3xl mb-2">🌍</p>
            <p>Pa gen peyi konfigire pou kounye a</p>
            <p className="text-[10px] mt-1 text-slate-600">Ajoute peyi pou defini règ ak paramèt lokal yo</p>
          </div>
        )}

        {/* Country list */}
        <div className="space-y-3">
          {countries.map(country => (
            <div key={country.id} className="bg-slate-800/50 rounded-xl p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-bold text-white">🌍 {country.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{country.code}</p>
                </div>
                <button onClick={() => removeCountry(country.id)}
                  className="text-[10px] text-rose-400 hover:text-rose-300">✕</button>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  ['Lang',      country.language],
                  ['Monnay',    country.currency],
                  ['Timezone',  country.timezone?.split('/').pop() || '—'],
                  ['Taks',      `${country.taxRate || 0}%`],
                  ['Salè Min',  country.minWage ? `${country.currency} ${country.minWage}` : '—'],
                  ['Zòn',       (country.serviceZones || []).length > 0
                    ? `${(country.serviceZones || []).length} zòn`
                    : '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex gap-1">
                    <dt className="text-[10px] text-slate-500">{label}:</dt>
                    <dd className="text-[10px] font-bold text-slate-300">{val}</dd>
                  </div>
                ))}
              </dl>
              {(country.serviceZones || []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {country.serviceZones.map(z => (
                    <span key={z} className="text-[9px] px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 rounded">{z}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RECRUITMENT TAB
// Multi-country / multi-scope job posting
// Reuses the same hiring workflow as CompanyDashboard
// ─────────────────────────────────────────────────────────────
const BLANK_JOB = { title: '', description: '', skills: '', budget: '', scope: 'global', countryCode: '', type: 'fixed' };
const JOB_TYPES = [
  { id: 'fixed',     label: 'Dire Fiks'  },
  { id: 'permanent', label: 'Pèmanan'    },
  { id: 'ongoing',   label: 'Kontinyèl'  },
];
const WORKFLOW_STEPS = ['posted','applied','accepted','hired','active','completed','paid','closed'];

function RecruitmentTab({ user }) {
  const userId     = user?._id || user?.id;
  const ed         = user?.enterpriseData || {};
  const jobs       = ed.jobs       || [];
  const countries  = ed.countries  || [];
  const saveED     = useSaveEnterprise(user);

  const [form, setForm]               = useState(BLANK_JOB);
  const [showForm, setShowForm]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [confirmingJobId, setConfirmingJobId] = useState(null);

  const postJob = useCallback(async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const newJob = {
      id:         `j_${Date.now()}`,
      title:      form.title.trim(),
      description:form.description.trim(),
      skills:     form.skills.split(',').map(s => s.trim()).filter(Boolean),
      budget:     form.budget,
      type:       form.type,
      scope:      form.scope,
      countryCode:form.countryCode || null,
      status:     'posted',
      applicants: [],
      createdAt:  new Date().toISOString(),
    };
    await saveED({ ...ed, jobs: [newJob, ...jobs] });
    setForm(BLANK_JOB);
    setShowForm(false);
    setSaving(false);
  }, [form, ed, jobs, saveED]);

  const setJobStatus = useCallback(async (jobId, status) => {
    const updated = jobs.map(j => j.id === jobId ? { ...j, status } : j);
    await saveED({ ...ed, jobs: updated });
  }, [jobs, ed, saveED]);

  const acceptApplicant = useCallback(async (jobId, workerId) => {
    const updated = jobs.map(j => {
      if (j.id !== jobId) return j;
      return { ...j, status: 'hired', applicants: (j.applicants||[]).map(a =>
        a.workerId === workerId ? { ...a, hireStatus: 'accepted' } : { ...a, hireStatus: 'rejected' }) };
    });
    await saveED({ ...ed, jobs: updated });
  }, [jobs, ed, saveED]);

  const confirmPayment = useCallback(async (jobId) => {
    const updated = jobs.map(j => j.id === jobId ? { ...j, status: 'confirmed' } : j);
    await saveED({ ...ed, jobs: updated, paymentConfirmations: (ed.paymentConfirmations ?? 0) + 1 });
    try { await API.post('/enterprise/confirm', { enterpriseId: userId, jobId }); } catch {}
    setConfirmingJobId(null);
  }, [jobs, ed, userId, saveED]);

  const openJobs = jobs.filter(j => ['posted','applied','accepted','hired','active'].includes(j.status));
  const doneJobs = jobs.filter(j => ['completed','confirmed','paid','closed'].includes(j.status));

  const getScopeLabel = (job) => {
    if (job.scope === 'country' && job.countryCode) {
      const c = countries.find(c => c.code === job.countryCode);
      return `🌍 ${c?.name || job.countryCode}`;
    }
    return SCOPE_LABELS[job.scope] || '🌐 Global';
  };

  return (
    <div className="space-y-4">
      <Section icon="💼" title="Rekritman Global"
        action={
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold">
            <Plus className="w-3 h-3" /> Nouvo
          </button>
        }
      >
        {/* Post job form */}
        {showForm && (
          <div className="mb-4 p-4 bg-slate-800/60 rounded-xl space-y-3">
            <input value={form.title} onChange={e => setForm(v => ({ ...v, title: e.target.value }))}
              placeholder="Tit travay la"
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/40" />
            <textarea value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))}
              placeholder="Deskripsyon" rows={2}
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none resize-none" />
            <input value={form.skills} onChange={e => setForm(v => ({ ...v, skills: e.target.value }))}
              placeholder="Konpetans (virgil: java, entrepôt...)"
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />

            {/* Scope selector */}
            <div>
              <p className="text-[10px] text-slate-400 mb-1.5 font-bold">Pòte Rekritman:</p>
              <div className="flex gap-2">
                {Object.entries(SCOPE_LABELS).map(([id, label]) => (
                  <button key={id} onClick={() => setForm(v => ({ ...v, scope: id }))}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition ${
                      form.scope === id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {form.scope === 'country' && (
              <select value={form.countryCode} onChange={e => setForm(v => ({ ...v, countryCode: e.target.value }))}
                className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white outline-none">
                <option value="">— Chwazi Peyi —</option>
                {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            )}

            <div className="flex gap-2">
              <select value={form.type} onChange={e => setForm(v => ({ ...v, type: e.target.value }))}
                className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white outline-none">
                {JOB_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <input value={form.budget} onChange={e => setForm(v => ({ ...v, budget: e.target.value }))}
                placeholder="Bidjè USD"
                className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />
            </div>

            <div className="flex gap-2">
              <button onClick={postJob} disabled={saving || !form.title.trim()}
                className="flex-1 py-2 bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-40">
                {saving ? 'Ap sove...' : 'Afiche Travay'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs">Anile</button>
            </div>
          </div>
        )}

        {openJobs.length === 0 && !showForm && (
          <div className="text-center py-6 text-slate-500 text-xs">
            <p className="text-3xl mb-2">💼</p>
            <p>Pa gen rekritman aktif pou kounye a</p>
          </div>
        )}

        <div className="space-y-3">
          {openJobs.map(job => (
            <div key={job.id} className="bg-slate-800/50 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{job.title}</p>
                  <p className="text-[10px] text-slate-400">{getScopeLabel(job)} • {JOB_TYPES.find(t => t.id === job.type)?.label || job.type}</p>
                </div>
                <StatusBadge status={job.status} />
              </div>
              {(job.applicants||[]).length > 0 && (
                <button onClick={() => setSelectedJob(prev => prev?.id === job.id ? null : job)}
                  className="text-[10px] text-indigo-400 mb-1.5">
                  {(job.applicants||[]).length} aplikasyon
                </button>
              )}
              {selectedJob?.id === job.id && (
                <div className="p-2 bg-slate-900/60 rounded-lg mb-2 space-y-1.5">
                  {(job.applicants||[]).map(app => (
                    <div key={app.workerId} className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-300">{app.name}</p>
                      {app.hireStatus ? (
                        <StatusBadge status={app.hireStatus === 'accepted' ? 'hired' : 'closed'} />
                      ) : (
                        <button onClick={() => acceptApplicant(job.id, app.workerId)}
                          className="text-[10px] text-emerald-400 font-bold">✓ Aksepte</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 text-[10px]">
                {job.status === 'active' && (
                  <button onClick={() => { setJobStatus(job.id, 'completed'); setConfirmingJobId(job.id); }}
                    className="text-purple-400">✓ Fini</button>
                )}
                {job.status !== 'paused' && job.status !== 'closed' && (
                  <button onClick={() => setJobStatus(job.id, 'paused')} className="text-amber-400">⏸ Poz</button>
                )}
                {job.status === 'paused' && (
                  <button onClick={() => setJobStatus(job.id, 'posted')} className="text-indigo-400">▶ Rakte</button>
                )}
                <button onClick={() => setJobStatus(job.id, 'closed')} className="text-rose-400">✗ Fèmen</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Payment confirm */}
      {confirmingJobId && (
        <Section icon="💳" title="Konfirmasyon Pèman">
          <p className="text-xs text-slate-300 mb-3">Konfime pou notifye travayè yo ak demann pèman.</p>
          <div className="flex gap-2">
            <button onClick={() => confirmPayment(confirmingJobId)}
              className="flex-1 py-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold">
              ✓ Wi, Konfime
            </button>
            <button onClick={() => setConfirmingJobId(null)}
              className="flex-1 py-2.5 bg-slate-700 text-slate-300 rounded-xl text-xs">Anile</button>
          </div>
        </Section>
      )}

      {/* Workflow steps */}
      <Section icon="🔄" title="Pwosesis Rekritman">
        <div className="flex items-center gap-1 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {WORKFLOW_STEPS.map((s, i) => {
            const stage = JOB_STATUSES.find(j => j.id === s);
            return (
              <React.Fragment key={s}>
                <div className={`shrink-0 px-2 py-1 rounded-lg ${stage?.bg || 'bg-slate-800/50'}`}>
                  <p className={`text-[9px] font-bold ${stage?.color || 'text-slate-400'}`}>{stage?.label}</p>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && <span className="text-slate-600 shrink-0 text-[10px]">→</span>}
              </React.Fragment>
            );
          })}
        </div>
      </Section>

      {/* History */}
      {doneJobs.length > 0 && (
        <Section icon="✅" title="Istwa Rekritman">
          <div className="space-y-2">
            {doneJobs.slice(0, 5).map(job => (
              <div key={job.id} className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-xl">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{job.title}</p>
                  <p className="text-[10px] text-slate-400">{getScopeLabel(job)} • {new Date(job.createdAt).toLocaleDateString('fr-HT')}</p>
                </div>
                <StatusBadge status={job.status} />
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ANALYTICS TAB
// Global → Country → Branch drill-down
// ─────────────────────────────────────────────────────────────
function AnalyticsTab({ user }) {
  const trustScore       = useMemo(() => computeEnterpriseTrustScore(user), [user]);
  const { pct, missing } = useMemo(() => computeEnterpriseCompleteness(user), [user]);

  const ed        = user?.enterpriseData || {};
  const jobs      = ed.jobs       || [];
  const employees = ed.employees  || [];
  const branches  = ed.branches   || [];
  const countries = ed.countries  || [];

  const totalJobs      = jobs.length;
  const completedJobs  = jobs.filter(j => ['completed','confirmed','paid','closed'].includes(j.status)).length;
  const openJobs       = jobs.filter(j => ['posted','applied','hired','active'].includes(j.status)).length;
  const hiringRate     = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
  const activeWorkers  = employees.filter(e => e.status === 'active').length;
  const activeBranches = branches.filter(b => b.status === 'active').length;

  // Revenue: enterprise contracts avg $2000
  const RATE       = 2000;
  const totalRev   = completedJobs * RATE;
  const monthRev   = Math.round(totalRev * 0.15);
  const yearRev    = totalRev;

  const rating     = user?.stats?.rating ?? 0;
  const complaints = ed.complaints       ?? 0;

  const scoreColor =
    trustScore >= 80 ? '#6366f1' :
    trustScore >= 50 ? '#8b5cf6' :
                       '#ef4444';
  const textColorClass =
    trustScore >= 80 ? 'text-indigo-400' :
    trustScore >= 50 ? 'text-purple-400'  :
                       'text-rose-400';

  // Per-country breakdown
  const countryBreakdown = countries.map(c => ({
    ...c,
    branchCount:   branches.filter(b => b.countryCode === c.code).length,
    jobCount:      jobs.filter(j => j.countryCode === c.code || j.scope === 'global').length,
    employeeCount: branches.filter(b => b.countryCode === c.code)
                     .reduce((s, b) => s + (b.employees || []).length, 0),
  }));

  const breakdowns = [
    { label: 'Travay Konplete', pts: Math.min(completedJobs, 20),                         max: 20, icon: '✅' },
    { label: 'Rating',          pts: Math.round((rating / 5) * 15),                       max: 15, icon: '⭐' },
    { label: 'Pwofil Konplè',   pts: Math.round((pct / 100) * 10),                        max: 10, icon: '📊' },
    { label: 'Verifikasyon',    pts: user?.verified ? 10 : 0,                              max: 10, icon: '✓'  },
    { label: 'Apa Reklamasyon', pts: complaints === 0 ? 10 : Math.max(0, 10-complaints*2), max: 10, icon: '🛡️' },
    { label: 'Peyi & Branch',   pts: Math.min(10, countries.length + Math.floor(activeBranches/2)), max: 10, icon: '🌍' },
    { label: 'Pwen Baz',        pts: 25,                                                   max: 25, icon: '🏗️' },
  ];

  const [analyticsLevel, setAnalyticsLevel] = useState('global');

  return (
    <div className="space-y-4">

      {/* Level selector */}
      <div className="flex gap-2">
        {['global','country','branch'].map(lvl => (
          <button key={lvl} onClick={() => setAnalyticsLevel(lvl)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition ${
              analyticsLevel === lvl ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {lvl === 'global' ? '🌐 Global' : lvl === 'country' ? '🌍 Peyi' : '🏢 Branch'}
          </button>
        ))}
      </div>

      {/* GLOBAL level */}
      {analyticsLevel === 'global' && (
        <>
          <Section icon="📊" title="Estatistik Global">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <MiniStat value={totalJobs}        label="Travay Afiche" color="indigo" />
              <MiniStat value={completedJobs}    label="Konplete"      color="green"  />
              <MiniStat value={`${hiringRate}%`} label="To Siksè"      color="purple" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MiniStat value={activeWorkers}    label="Anplwaye"      color="amber"  />
              <MiniStat value={activeBranches}   label="Branch Aktif"  color="blue"   />
              <MiniStat value={countries.length} label="Peyi"          color="indigo" />
            </div>
          </Section>

          <Section icon="💰" title="Estimasyon Revni Global">
            <p className="text-[10px] text-slate-500 mb-3">✱ Estimasyon MVP — pral mete ajou ak done reyèl yo.</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <MiniStat value={`$${yearRev.toLocaleString()}`}  label="Anyèl"     color="amber"  />
              <MiniStat value={`$${monthRev.toLocaleString()}`} label="Mansyèl"   color="green"  />
              <MiniStat value={`$${RATE.toLocaleString()}`}     label="Moy/Kontra"color="blue"   />
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <p className="text-[10px] text-slate-400 mb-2">Tren Kwasans (6 mwa)</p>
              <div className="h-10 flex items-end gap-1">
                {[0.3,0.45,0.4,0.65,0.6,0.8,1].map((h,i) => (
                  <div key={i} className="flex-1 rounded-sm"
                    style={{ height: `${h*100}%`, background: 'rgba(99,102,241,0.5)' }} />
                ))}
              </div>
            </div>
          </Section>
        </>
      )}

      {/* COUNTRY level */}
      {analyticsLevel === 'country' && (
        <Section icon="🌍" title="Estatistik pa Peyi">
          {countryBreakdown.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Pa gen peyi konfigire — ajoute nan onglet Peyi a</p>
          ) : (
            <div className="space-y-3">
              {countryBreakdown.map(c => (
                <div key={c.id} className="bg-slate-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">🌍</span>
                    <p className="text-xs font-bold text-white">{c.name}</p>
                    <span className="text-[10px] text-slate-500 font-mono">{c.code} • {c.currency}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-sm font-bold text-indigo-400">{c.branchCount}</p>
                      <p className="text-[10px] text-slate-400">Branch</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-green-400">{c.employeeCount}</p>
                      <p className="text-[10px] text-slate-400">Anplwaye</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-amber-400">{c.jobCount}</p>
                      <p className="text-[10px] text-slate-400">Travay</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* BRANCH level */}
      {analyticsLevel === 'branch' && (
        <Section icon="🏢" title="Pèfòmans Branch">
          {branches.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Pa gen branch konfigire — ajoute nan onglet Branch la</p>
          ) : (
            <div className="space-y-2">
              {branches.slice(0, 10).map(b => {
                const empCount = (b.employees || []).length;
                const projCount = (b.activeProjects || []).length;
                return (
                  <div key={b.id} className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-white">{b.name}</p>
                      <p className="text-[10px] text-slate-400">{b.city || '—'} • {b.countryCode || '—'}</p>
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      <p className="text-indigo-400 font-bold">{empCount} anplwaye</p>
                      <p>{projCount} pwojè</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* Trust score gauge — always visible */}
      <Section>
        <div className="flex flex-col items-center py-4">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="12" />
              <circle cx="50" cy="50" r="40" fill="none"
                stroke={scoreColor} strokeWidth="12"
                strokeDasharray={`${trustScore * 2.51} 251`}
                strokeLinecap="round" className="transition-all" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-black ${textColorClass}`}>{trustScore}</span>
              <span className="text-[10px] text-slate-400">/100</span>
            </div>
          </div>
          <h3 className="text-sm font-bold text-white mt-3">🛡️ Konfyans Antrepriz</h3>
          <p className="text-[10px] text-slate-400 mt-1">
            {trustScore >= 80 ? 'Ekselan — Antrepriz ou gen gwo reputasyon'
              : trustScore >= 50 ? 'Bon — Kontinye amelyore estriktirèlman'
              : 'Bati reputasyon antrepriz la'}
          </p>
        </div>
      </Section>

      {/* Score breakdown */}
      <Section icon="📈" title="Detay Pwen yo">
        <div className="space-y-3">
          {breakdowns.map(b => (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300">{b.icon} {b.label}</span>
                <span className="text-xs font-bold text-indigo-400">{b.pts}/{b.max}</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${(b.pts / b.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {missing.length > 0 && (
        <Section icon="💡" title="Amelyore Pwofil ou">
          {missing.slice(0, 4).map(tip => (
            <div key={tip} className="flex items-center gap-2 text-xs text-slate-300 mb-1.5">
              <span className="text-indigo-400 shrink-0">→</span>
              <span>{tip}</span>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REPORTS TAB
// Executive reporting — global, country, branch, revenue, employee
// ─────────────────────────────────────────────────────────────
function ReportsTab({ user }) {
  const ed        = user?.enterpriseData || {};
  const jobs      = ed.jobs       || [];
  const employees = ed.employees  || [];
  const branches  = ed.branches   || [];
  const countries = ed.countries  || [];

  const [activeReport, setActiveReport] = useState('global');

  const totalJobs     = jobs.length;
  const completedJobs = jobs.filter(j => ['completed','confirmed','paid','closed'].includes(j.status)).length;
  const openJobs      = jobs.filter(j => ['posted','applied','hired','active'].includes(j.status)).length;
  const hiringRate    = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
  const RATE          = 2000;
  const totalRevEst   = completedJobs * RATE;
  const rating        = user?.stats?.rating ?? 0;
  const complaints    = ed.complaints ?? 0;
  const trustScore    = computeEnterpriseTrustScore(user);

  const REPORTS = [
    { id: 'global',    label: '🌐 Global'    },
    { id: 'country',   label: '🌍 Peyi'      },
    { id: 'branch',    label: '🏢 Branch'    },
    { id: 'revenue',   label: '💰 Revni'     },
    { id: 'employee',  label: '👥 Anplwaye'  },
    { id: 'hiring',    label: '💼 Rekritman' },
    { id: 'performance',label: '📈 Pèfòmans' },
  ];

  return (
    <div className="space-y-4">

      {/* Report selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {REPORTS.map(r => (
          <button key={r.id} onClick={() => setActiveReport(r.id)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold transition ${
              activeReport === r.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* GLOBAL report */}
      {activeReport === 'global' && (
        <Section icon="🌐" title="Rapò Egzekitif Global">
          <p className="text-[10px] text-slate-500 mb-4">Rezime global antrepriz la — {new Date().toLocaleDateString('fr-HT')}</p>
          <dl className="space-y-2.5">
            {[
              ['Peyi Opere',       countries.length],
              ['Branch Total',      branches.length],
              ['Branch Aktif',      branches.filter(b => b.status === 'active').length],
              ['Anplwaye Total',    employees.filter(e => e.status === 'active').length],
              ['Travay Afiche',     totalJobs],
              ['Travay Konplete',   completedJobs],
              ['Travay Ouvè',       openJobs],
              ['To Siksè Rekritman', `${hiringRate}%`],
              ['Revni Estimasyon',  `$${totalRevEst.toLocaleString()}`],
              ['Konfyans Score',    `${trustScore}/100`],
              ['Rating Mwayen',     `⭐ ${rating.toFixed(1)}`],
              ['Reklamasyon',       complaints],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between border-b border-slate-800 pb-1.5">
                <dt className="text-xs text-slate-400">{label}</dt>
                <dd className="text-xs font-bold text-white">{val}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {/* COUNTRY report */}
      {activeReport === 'country' && (
        <Section icon="🌍" title="Rapò pa Peyi">
          {countries.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Ajoute peyi yo premye nan onglet Peyi a</p>
          ) : (
            <div className="space-y-4">
              {countries.map(c => {
                const cBranches  = branches.filter(b => b.countryCode === c.code);
                const cJobs      = jobs.filter(j => j.countryCode === c.code || j.scope === 'global');
                const cCompleted = cJobs.filter(j => ['completed','confirmed','paid','closed'].includes(j.status)).length;
                const cEmp       = cBranches.reduce((s, b) => s + (b.employees || []).length, 0);
                const cRevEst    = cCompleted * RATE;
                return (
                  <div key={c.id} className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-xs font-bold text-white mb-2">🌍 {c.name} ({c.code})</p>
                    <dl className="grid grid-cols-2 gap-y-1.5">
                      {[
                        ['Branch',      cBranches.length],
                        ['Anplwaye',    cEmp],
                        ['Travay',      cJobs.length],
                        ['Konplete',    cCompleted],
                        ['Monnay',      c.currency],
                        ['Revni Est',   `$${cRevEst.toLocaleString()}`],
                      ].map(([lbl, val]) => (
                        <div key={lbl} className="flex gap-1">
                          <dt className="text-[10px] text-slate-500">{lbl}:</dt>
                          <dd className="text-[10px] font-bold text-slate-200">{val}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* BRANCH report */}
      {activeReport === 'branch' && (
        <Section icon="🏢" title="Rapò Branch">
          {branches.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Ajoute branch yo premye</p>
          ) : (
            <div className="space-y-2">
              {branches.map(b => {
                const bs = BRANCH_STATUSES.find(s => s.id === b.status) || BRANCH_STATUSES[0];
                const cName = countries.find(c => c.code === b.countryCode)?.name || b.countryCode || '—';
                return (
                  <div key={b.id} className="bg-slate-800/50 rounded-xl p-3">
                    <div className="flex justify-between items-start mb-1.5">
                      <p className="text-xs font-bold text-white">{b.name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${bs.color} ${bs.bg}`}>{bs.label}</span>
                    </div>
                    <dl className="grid grid-cols-2 gap-y-0.5">
                      {[
                        ['Peyi',      cName],
                        ['Vil',       b.city || '—'],
                        ['Anplwaye',  (b.employees || []).length],
                        ['Pwojè',     (b.activeProjects || []).length],
                      ].map(([lbl, val]) => (
                        <div key={lbl} className="flex gap-1">
                          <dt className="text-[10px] text-slate-500">{lbl}:</dt>
                          <dd className="text-[10px] text-slate-300">{val}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* REVENUE report */}
      {activeReport === 'revenue' && (
        <Section icon="💰" title="Rapò Revni">
          <p className="text-[10px] text-slate-500 mb-3">✱ Estimasyon MVP — pral mete ajou ak done pèman reyèl yo.</p>
          <dl className="space-y-2.5 mb-4">
            {[
              ['Revni Total Est',   `$${totalRevEst.toLocaleString()}`],
              ['Revni Mansyèl Est', `$${Math.round(totalRevEst*0.15).toLocaleString()}`],
              ['Moy pa Kontra',     `$${RATE.toLocaleString()}`],
              ['Kontra Konplete',   completedJobs],
              ['Kontra Ouvè',       openJobs],
              ['To Konvèsyon',      `${hiringRate}%`],
            ].map(([lbl, val]) => (
              <div key={lbl} className="flex justify-between border-b border-slate-800 pb-1.5">
                <dt className="text-xs text-slate-400">{lbl}</dt>
                <dd className="text-xs font-bold text-white">{val}</dd>
              </div>
            ))}
          </dl>
          <div className="p-3 bg-slate-800/50 rounded-xl">
            <p className="text-[10px] text-slate-400 mb-2">Tren Revni Anyèl</p>
            <div className="h-12 flex items-end gap-1">
              {[0.25,0.4,0.35,0.6,0.55,0.75,0.7,0.9,0.85,1,0.95,1].map((h,i) => (
                <div key={i} className="flex-1 rounded-sm"
                  style={{ height: `${h*100}%`, background: 'rgba(99,102,241,0.5)' }} />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 mt-1">
              <span>Jan</span><span>Jiy</span><span>Des</span>
            </div>
          </div>
        </Section>
      )}

      {/* EMPLOYEE report */}
      {activeReport === 'employee' && (
        <Section icon="👥" title="Rapò Anplwaye">
          <dl className="space-y-2.5 mb-4">
            {[
              ['Total Anplwaye',   employees.length],
              ['Aktif',           employees.filter(e => e.status === 'active').length],
              ['Annatant',        employees.filter(e => e.status === 'pending').length],
              ['Ansyen',          employees.filter(e => e.status === 'former').length],
              ['Distribisyon Peyi',`${countries.length} peyi`],
              ['Branch Aktif',    branches.filter(b => b.status === 'active').length],
            ].map(([lbl, val]) => (
              <div key={lbl} className="flex justify-between border-b border-slate-800 pb-1.5">
                <dt className="text-xs text-slate-400">{lbl}</dt>
                <dd className="text-xs font-bold text-white">{val}</dd>
              </div>
            ))}
          </dl>
          {countries.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Pa Peyi</p>
              {countries.map(c => {
                const cEmp = branches.filter(b => b.countryCode === c.code)
                  .reduce((s, b) => s + (b.employees || []).length, 0);
                return (
                  <div key={c.id} className="flex justify-between text-xs">
                    <span className="text-slate-400">🌍 {c.name}</span>
                    <span className="font-bold text-white">{cEmp} anplwaye</span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* HIRING report */}
      {activeReport === 'hiring' && (
        <Section icon="💼" title="Rapò Rekritman">
          <dl className="space-y-2.5">
            {[
              ['Total Travay Afiche', totalJobs],
              ['Travay Konplete',     completedJobs],
              ['Travay Ouvè',         openJobs],
              ['To Siksè',            `${hiringRate}%`],
              ['Pèman Konfime',        ed.paymentConfirmations ?? 0],
              ['Reklamasyon',          complaints],
              ['Rekritman Global',    jobs.filter(j => j.scope === 'global').length],
              ['Rekritman pa Peyi',   jobs.filter(j => j.scope === 'country').length],
            ].map(([lbl, val]) => (
              <div key={lbl} className="flex justify-between border-b border-slate-800 pb-1.5">
                <dt className="text-xs text-slate-400">{lbl}</dt>
                <dd className="text-xs font-bold text-white">{val}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {/* PERFORMANCE report */}
      {activeReport === 'performance' && (
        <Section icon="📈" title="Rapò Pèfòmans">
          <dl className="space-y-2.5">
            {[
              ['Konfyans Score',    `${trustScore}/100`],
              ['Verifikasyon',      user?.verified ? '✓ Verifye' : '— Annatant'],
              ['Rating Mwayen',     `⭐ ${rating.toFixed(1)}`],
              ['To Siksè Rekritman',`${hiringRate}%`],
              ['Reklamasyon',       complaints],
              ['Peyi Opere',        countries.length],
              ['Branch Aktif',      branches.filter(b => b.status === 'active').length],
              ['Kwasans Estimasyon', completedJobs > 0 ? '+12% (MVP)' : '— pa gen done'],
            ].map(([lbl, val]) => (
              <div key={lbl} className="flex justify-between border-b border-slate-800 pb-1.5">
                <dt className="text-xs text-slate-400">{lbl}</dt>
                <dd className="text-xs font-bold text-white">{val}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
    </div>
  );
}

// ── Tab definitions (exported for Dashboard.jsx tab bar) ──────

export const ENTERPRISE_TABS = [
  { id: 'overview',    label: 'Akeyi',     icon: '🏛️' },
  { id: 'branches',    label: 'Branch',    icon: '🏢' },
  { id: 'countries',   label: 'Peyi',      icon: '🌍' },
  { id: 'recruitment', label: 'Rekritman', icon: '💼' },
  { id: 'analytics',   label: 'Analitik',  icon: '📊' },
  { id: 'reports',     label: 'Rapò',      icon: '📋' },
];

// ── Default export: tab content router ────────────────────────
// Dashboard.jsx renders 'overview' (EnterpriseOverviewSupplement + RoleDashboard).
// This component handles all other tabs.

export default function EnterpriseContent({ tab, user }) {
  switch (tab) {
    case 'branches':    return <BranchesTab    user={user} />;
    case 'countries':   return <CountriesTab   user={user} />;
    case 'recruitment': return <RecruitmentTab user={user} />;
    case 'analytics':   return <AnalyticsTab   user={user} />;
    case 'reports':     return <ReportsTab     user={user} />;
    default:            return null;
  }
}