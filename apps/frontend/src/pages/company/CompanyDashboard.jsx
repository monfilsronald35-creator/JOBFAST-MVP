/**
 * CompanyDashboard.jsx
 *
 * Company-specific dashboard sections rendered inside Dashboard.jsx
 * for the 'company' (and legacy 'business') role.  This is a
 * component, NOT a page — it has no route of its own.
 *
 * Tabs:
 *   overview   → handled by Dashboard.jsx (CompanyOverviewSupplement + RoleDashboard)
 *   employees  → employee list, status management
 *   hiring     → job posting, applicants, accept/reject, payment confirm
 *   projects   → active / upcoming / completed projects
 *   branches   → branch management + GPS nearby-worker alert
 *   analytics  → stats, revenue estimate, trust score, reputation
 */

import React, {
  useState, useCallback, useMemo, memo,
} from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

// ── Pure computations ────────────────────────────────────────

export function computeCompanyTrustScore(user) {
  const completedJobs = user?.stats?.totalJobs ?? 0;
  const rating        = user?.stats?.rating    ?? 0;
  const verified      = !!user?.verified;
  const completeness  = user?.profileCompleteness ?? 0;
  const cd            = user?.companyData || {};
  const payConf       = cd.paymentConfirmations ?? 0;
  const complaints    = cd.complaints           ?? 0;

  const complaintPenalty = complaints === 0
    ? 10
    : Math.max(0, 10 - complaints * 2);

  return Math.min(100, Math.round(
    30
    + Math.min(completedJobs, 20) * 1.0
    + (rating / 5) * 15
    + Math.min(payConf, 10) * 0.5
    + (completeness / 100) * 10
    + (verified ? 10 : 0)
    + complaintPenalty,
  ));
}

export function computeCompanyCompleteness(user) {
  const meta = user?.profileMetadata || {};
  const cd   = user?.companyData    || {};

  const checks = [
    { done: !!user?.name,                                        tip: 'Ajoute non konpayi an' },
    { done: !!user?.email,                                        tip: 'Imèl verifye' },
    { done: !!(meta?.phone || user?.phone),                       tip: 'Ajoute nimewo telefòn konpayi' },
    { done: !!meta?.bio,                                          tip: 'Ekri deskripsyon konpayi an' },
    { done: !!user?.profession,                                   tip: 'Chwazi sektè aktivite' },
    { done: !!(user?.location?.city),                             tip: 'Ajoute lokasyon prensipal' },
    { done: !!(meta?.logo || (meta?.photos?.length ?? 0) > 0),   tip: 'Ajoute logo oswa foto' },
    { done: !!meta?.website,                                      tip: 'Ajoute sit wèb' },
    { done: (cd?.branches?.length ?? 0) > 0 || !!user?.location, tip: 'Ajoute yon branch' },
  ];

  const done = checks.filter(c => c.done).length;
  return {
    pct:     Math.round((done / checks.length) * 100),
    missing: checks.filter(c => !c.done).map(c => c.tip),
  };
}

// ── GPS hook (for worker alert) ──────────────────────────────
function useCompanyGPS() {
  const [acquiring, setAcquiring] = useState(false);
  const [gpsError,  setGpsError]  = useState(null);

  const acquire = useCallback((onSuccess, onFallback) => {
    if (!navigator.geolocation) {
      setGpsError('GPS pa disponib sou aparèy sa a');
      onFallback?.();
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
        onFallback?.();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  return { acquiring, gpsError, acquire };
}

// ── Constants ────────────────────────────────────────────────

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

const JOB_TYPES = [
  { id: 'fixed',     label: 'Dire Fiks'  },
  { id: 'permanent', label: 'Pèmanan'    },
  { id: 'ongoing',   label: 'Kontinyèl'  },
];

const PROJECT_STATUSES = [
  { id: 'active',    label: 'Aktif',    color: 'text-green-400',  bg: 'bg-green-500/10'  },
  { id: 'upcoming',  label: 'Pwochèn',  color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  { id: 'completed', label: 'Konplete', color: 'text-slate-400',  bg: 'bg-slate-700/50'  },
];

const WORKFLOW_STEPS = ['posted','applied','accepted','hired','active','completed','paid','closed'];

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

const MiniStat = memo(function MiniStat({ value, label, color = 'blue' }) {
  const colors = {
    blue:   'text-blue-400',
    amber:  'text-amber-500',
    green:  'text-emerald-400',
    rose:   'text-rose-400',
    purple: 'text-purple-400',
  };
  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3 text-center">
      <div className={`text-xl font-bold ${colors[color] || colors.blue}`}>{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
    </div>
  );
});

function StatusBadge({ status }) {
  const s = JOB_STATUSES.find(j => j.id === status) || { label: status, color: 'text-slate-400', bg: 'bg-slate-700/50' };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color} ${s.bg}`}>
      {s.label}
    </span>
  );
}

// ── OVERVIEW supplement ───────────────────────────────────────
export const CompanyOverviewSupplement = memo(function CompanyOverviewSupplement({ user }) {
  const trustScore = useMemo(() => computeCompanyTrustScore(user), [user]);
  const { pct }    = useMemo(() => computeCompanyCompleteness(user), [user]);
  const cd = user?.companyData || {};

  const activeEmployees = (cd.employees || []).filter(e => e.status === 'active').length;
  const openJobs        = (cd.jobs || []).filter(j => ['posted','applied','hired','active'].includes(j.status)).length;
  const completedJobs   = user?.stats?.totalJobs ?? (cd.jobs || []).filter(j => ['completed','paid','closed'].includes(j.status)).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        <MiniStat value={openJobs}        label="Travay Ouvè" color="blue"   />
        <MiniStat value={activeEmployees} label="Anplwaye"    color="green"  />
        <MiniStat value={completedJobs}   label="Konplete"    color="amber"  />
        <MiniStat value={`${pct}%`}       label="Pwofil"      color="purple" />
      </div>

      <div className="flex gap-3">
        <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400">🛡️ Konfyans Konpayi</span>
            <span className="text-[10px] font-bold text-blue-400">{trustScore}/100</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all"
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
    </div>
  );
});

// ── Shared save helper hook ───────────────────────────────────
function useSaveCompany(user) {
  const { login } = useAuth();
  const userId = user?._id || user?.id;

  return useCallback(async (updatedCd) => {
    login({ ...user, companyData: updatedCd });
    try {
      await API.patch('/company/profile', { userId, companyData: updatedCd });
    } catch { /* keep optimistic for MVP */ }
  }, [user, userId, login]);
}

// ─────────────────────────────────────────────────────────────
// EMPLOYEES TAB
// ─────────────────────────────────────────────────────────────
function EmployeesTab({ user }) {
  const cd        = user?.companyData || {};
  const employees = cd.employees || [];
  const saveCD    = useSaveCompany(user);

  const [filter, setFilter] = useState('active');

  const updateStatus = useCallback(async (workerId, newStatus) => {
    const updated = employees.map(e => e.workerId === workerId ? { ...e, status: newStatus } : e);
    await saveCD({ ...cd, employees: updated });
  }, [employees, cd, saveCD]);

  const FILTERS = [
    { id: 'active',  label: 'Aktif',    count: employees.filter(e => e.status === 'active').length },
    { id: 'pending', label: 'Annatant', count: employees.filter(e => e.status === 'pending').length },
    { id: 'former',  label: 'Ansyen',   count: employees.filter(e => e.status === 'former').length },
  ];

  const filtered = employees.filter(e => e.status === filter);

  return (
    <div className="space-y-4">
      <Section icon="👥" title="Jere Anplwaye">
        {/* Filter row */}
        <div className="flex gap-2 mb-4">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === f.id
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            <p className="text-3xl mb-2">👥</p>
            <p>Pa gen anplwaye {filter === 'active' ? 'aktif' : filter === 'pending' ? 'annatant' : 'ansyen'}</p>
            <p className="text-[10px] mt-1 text-slate-600">Angaje travayè via Rekritman pou yo parèt isit</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(emp => (
              <div key={emp.workerId} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-base">👤</div>
                  <div>
                    <p className="text-xs font-bold text-white">{emp.name || 'Anplwaye'}</p>
                    <p className="text-[10px] text-slate-400">{emp.role || emp.profession || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={emp.status} />
                  {emp.status === 'active'  && (
                    <button onClick={() => updateStatus(emp.workerId, 'former')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 transition">Kite</button>
                  )}
                  {emp.status === 'pending' && (
                    <button onClick={() => updateStatus(emp.workerId, 'active')}
                      className="text-[10px] text-emerald-400 font-bold">✓ Aksepte</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Summary */}
      <Section icon="📊" title="Rezime Anplwaye">
        <dl className="space-y-2">
          {[
            ['Anplwaye Aktif',  employees.filter(e => e.status === 'active').length],
            ['Annatant',        employees.filter(e => e.status === 'pending').length],
            ['Ansyen',          employees.filter(e => e.status === 'former').length],
            ['Total',           employees.length],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-xs text-slate-400">{label}</dt>
              <dd className="text-xs font-bold text-white">{val}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HIRING TAB
// ─────────────────────────────────────────────────────────────
const BLANK_JOB = { title: '', description: '', type: 'fixed', budget: '', skills: '' };

function HiringTab({ user }) {
  const userId    = user?._id || user?.id;
  const cd        = user?.companyData || {};
  const jobs      = cd.jobs || [];
  const saveCD    = useSaveCompany(user);

  const [form, setForm]             = useState(BLANK_JOB);
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [confirmingJobId, setConfirmingJobId] = useState(null);

  const postJob = useCallback(async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const newJob = {
      id:         `j_${Date.now()}`,
      title:      form.title.trim(),
      description:form.description.trim(),
      type:       form.type,
      budget:     form.budget,
      skills:     form.skills.split(',').map(s => s.trim()).filter(Boolean),
      status:     'posted',
      applicants: [],
      createdAt:  new Date().toISOString(),
    };
    await saveCD({ ...cd, jobs: [newJob, ...jobs] });
    setForm(BLANK_JOB);
    setShowForm(false);
    setSaving(false);
  }, [form, cd, jobs, saveCD]);

  const setJobStatus = useCallback(async (jobId, newStatus) => {
    const updated = jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j);
    await saveCD({ ...cd, jobs: updated });
  }, [jobs, cd, saveCD]);

  const acceptApplicant = useCallback(async (jobId, workerId) => {
    const updated = jobs.map(j => {
      if (j.id !== jobId) return j;
      return {
        ...j,
        status: 'hired',
        applicants: (j.applicants || []).map(a =>
          a.workerId === workerId
            ? { ...a, hireStatus: 'accepted' }
            : { ...a, hireStatus: 'rejected' }
        ),
      };
    });
    await saveCD({ ...cd, jobs: updated });
  }, [jobs, cd, saveCD]);

  const rejectApplicant = useCallback(async (jobId, workerId) => {
    const updated = jobs.map(j => {
      if (j.id !== jobId) return j;
      return {
        ...j,
        applicants: (j.applicants || []).map(a =>
          a.workerId === workerId ? { ...a, hireStatus: 'rejected' } : a
        ),
      };
    });
    await saveCD({ ...cd, jobs: updated });
  }, [jobs, cd, saveCD]);

  const confirmPayment = useCallback(async (jobId) => {
    const updated  = jobs.map(j => j.id === jobId ? { ...j, status: 'confirmed' } : j);
    const newPayConf = (cd.paymentConfirmations ?? 0) + 1;
    await saveCD({ ...cd, jobs: updated, paymentConfirmations: newPayConf });
    try {
      await API.post('/company/confirm', { companyId: userId, jobId });
    } catch { /* notification is best-effort for MVP */ }
    setConfirmingJobId(null);
  }, [jobs, cd, userId, saveCD]);

  const openJobs = jobs.filter(j => ['posted','applied','accepted','hired','active'].includes(j.status));
  const doneJobs = jobs.filter(j => ['completed','confirmed','paid','closed','paused'].includes(j.status));

  return (
    <div className="space-y-4">

      {/* Active jobs */}
      <Section icon="💼" title="Travay Aktif"
        action={
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 text-[10px] text-blue-400 font-bold">
            <Plus className="w-3 h-3" /> Nouvo
          </button>
        }
      >
        {/* Post job form */}
        {showForm && (
          <div className="mb-4 p-4 bg-slate-800/60 rounded-xl space-y-3">
            <input value={form.title} onChange={e => setForm(v => ({ ...v, title: e.target.value }))}
              placeholder="Tit travay la"
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500/40" />
            <textarea value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))}
              placeholder="Deskripsyon travay la" rows={3}
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none resize-none" />
            <input value={form.skills} onChange={e => setForm(v => ({ ...v, skills: e.target.value }))}
              placeholder="Konpetans (virgil: chef, chapo, elektrisyen...)"
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />
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
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold disabled:opacity-40 transition">
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
            <p>Pa gen travay ouvè pou kounye a</p>
          </div>
        )}

        <div className="space-y-3">
          {openJobs.map(job => (
            <div key={job.id} className="bg-slate-800/50 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{job.title}</p>
                  <p className="text-[10px] text-slate-400">
                    {JOB_TYPES.find(t => t.id === job.type)?.label || job.type}
                    {job.budget ? ` • $${job.budget}` : ''}
                  </p>
                </div>
                <StatusBadge status={job.status} />
              </div>

              {/* Applicants */}
              {(job.applicants || []).length > 0 && (
                <button onClick={() => setSelectedJob(prev => prev?.id === job.id ? null : job)}
                  className="text-[10px] text-blue-400 mb-2">
                  {(job.applicants || []).length} aplikasyon → Wè yo
                </button>
              )}

              {selectedJob?.id === job.id && (
                <div className="p-2 bg-slate-900/60 rounded-lg mb-2 space-y-1.5">
                  {(job.applicants || []).map(app => (
                    <div key={app.workerId} className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-300 truncate">{app.name}</p>
                      {app.hireStatus ? (
                        <StatusBadge status={app.hireStatus === 'accepted' ? 'hired' : 'closed'} />
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => acceptApplicant(job.id, app.workerId)}
                            className="text-[10px] text-emerald-400 font-bold">✓ Aksepte</button>
                          <button onClick={() => rejectApplicant(job.id, app.workerId)}
                            className="text-[10px] text-rose-400">✗ Rejte</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {(job.applicants || []).length === 0 && (
                    <p className="text-[10px] text-slate-500 text-center py-1">Pa gen aplikasyon pou kounye a</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-1 text-[10px]">
                {job.status === 'active' && (
                  <button onClick={() => { setJobStatus(job.id, 'completed'); setConfirmingJobId(job.id); }}
                    className="text-purple-400">✓ Mak Fini</button>
                )}
                {job.status !== 'paused' && job.status !== 'closed' && (
                  <button onClick={() => setJobStatus(job.id, 'paused')}
                    className="text-amber-400">⏸ Poz</button>
                )}
                {job.status === 'paused' && (
                  <button onClick={() => setJobStatus(job.id, 'posted')}
                    className="text-blue-400">▶ Rakte</button>
                )}
                <button onClick={() => setJobStatus(job.id, 'closed')}
                  className="text-rose-400">✗ Fèmen</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Payment confirmation */}
      {confirmingJobId && (
        <Section icon="💳" title="Konfirmasyon Pèman">
          <p className="text-xs text-slate-300 mb-3">
            Travay la fini? Konfime pou notifye travayè yo.
          </p>
          <div className="flex gap-2">
            <button onClick={() => confirmPayment(confirmingJobId)}
              className="flex-1 py-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold">
              ✓ Wi, Travay la Fini
            </button>
            <button onClick={() => setConfirmingJobId(null)}
              className="flex-1 py-2.5 bg-slate-700 text-slate-300 rounded-xl text-xs">
              Anile
            </button>
          </div>
        </Section>
      )}

      {/* Hiring workflow visualization */}
      <Section icon="🔄" title="Pwosesis Rekritman">
        <div className="flex items-center gap-1 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {WORKFLOW_STEPS.map((s, i) => {
            const stage = JOB_STATUSES.find(j => j.id === s);
            return (
              <React.Fragment key={s}>
                <div className={`shrink-0 px-2 py-1 rounded-lg ${stage?.bg || 'bg-slate-800/50'}`}>
                  <p className={`text-[9px] font-bold ${stage?.color || 'text-slate-400'}`}>{stage?.label}</p>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <span className="text-slate-600 shrink-0 text-[10px]">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Section>

      {/* History */}
      {doneJobs.length > 0 && (
        <Section icon="📋" title="Istwa Travay">
          <div className="space-y-2">
            {doneJobs.slice(0, 5).map(job => (
              <div key={job.id} className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-xl">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{job.title}</p>
                  <p className="text-[10px] text-slate-400">{new Date(job.createdAt).toLocaleDateString('fr-HT')}</p>
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
// PROJECTS TAB
// ─────────────────────────────────────────────────────────────
const BLANK_PROJECT = { name: '', description: '', status: 'upcoming', start: '', end: '' };

function ProjectsTab({ user }) {
  const cd       = user?.companyData || {};
  const projects = cd.projects || [];
  const saveCD   = useSaveCompany(user);

  const [filterStatus, setFilterStatus] = useState('active');
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState(BLANK_PROJECT);
  const [saving, setSaving]             = useState(false);

  const createProject = useCallback(async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const newProject = {
      id:        `p_${Date.now()}`,
      ...form,
      workers:   [],
      createdAt: new Date().toISOString(),
    };
    await saveCD({ ...cd, projects: [newProject, ...projects] });
    setForm(BLANK_PROJECT);
    setShowForm(false);
    setSaving(false);
  }, [form, cd, projects, saveCD]);

  const setProjectStatus = useCallback(async (projId, newStatus) => {
    const updated = projects.map(p => p.id === projId ? { ...p, status: newStatus } : p);
    await saveCD({ ...cd, projects: updated });
  }, [projects, cd, saveCD]);

  const filtered = projects.filter(p => p.status === filterStatus);

  return (
    <div className="space-y-4">
      <Section icon="📁" title="Pwojè"
        action={
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 text-[10px] text-blue-400 font-bold">
            <Plus className="w-3 h-3" /> Nouvo
          </button>
        }
      >
        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {PROJECT_STATUSES.map(s => (
            <button key={s.id} onClick={() => setFilterStatus(s.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStatus === s.id
                  ? `${s.color} ${s.bg} border border-current/30`
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {s.label} ({projects.filter(p => p.status === s.id).length})
            </button>
          ))}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="mb-4 p-4 bg-slate-800/60 rounded-xl space-y-3">
            <input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
              placeholder="Non pwojè a"
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500/40" />
            <textarea value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))}
              placeholder="Deskripsyon pwojè a" rows={2}
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none resize-none" />
            <div className="flex gap-2">
              <input type="date" value={form.start} onChange={e => setForm(v => ({ ...v, start: e.target.value }))}
                className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white outline-none" />
              <input type="date" value={form.end} onChange={e => setForm(v => ({ ...v, end: e.target.value }))}
                className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white outline-none" />
            </div>
            <select value={form.status} onChange={e => setForm(v => ({ ...v, status: e.target.value }))}
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white outline-none">
              {PROJECT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={createProject} disabled={saving || !form.name.trim()}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold disabled:opacity-40">
                {saving ? 'Ap sove...' : 'Kreye Pwojè'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs">Anile</button>
            </div>
          </div>
        )}

        {filtered.length === 0 && !showForm && (
          <div className="text-center py-6 text-slate-500 text-xs">
            <p className="text-3xl mb-2">📁</p>
            <p>Pa gen pwojè {filterStatus === 'active' ? 'aktif' : filterStatus === 'upcoming' ? 'pwochèn' : 'konplete'}</p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map(proj => {
            const ps = PROJECT_STATUSES.find(s => s.id === proj.status);
            return (
              <div key={proj.id} className={`rounded-xl border border-slate-700 p-3 ${ps?.bg || ''}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-bold text-white">{proj.name}</p>
                  <span className={`text-[10px] font-bold ${ps?.color}`}>{ps?.label}</span>
                </div>
                {proj.description && (
                  <p className="text-[10px] text-slate-400 mb-1.5 line-clamp-2">{proj.description}</p>
                )}
                {(proj.start || proj.end) && (
                  <p className="text-[10px] text-slate-500 mb-1">
                    {proj.start && `Kòmanse: ${proj.start}`}
                    {proj.start && proj.end && ' → '}
                    {proj.end && `Fini: ${proj.end}`}
                  </p>
                )}
                <p className="text-[10px] text-slate-500 mb-1">{(proj.workers || []).length} travayè asiye</p>
                <div className="flex gap-3 text-[10px]">
                  {proj.status === 'upcoming'  && (
                    <button onClick={() => setProjectStatus(proj.id, 'active')} className="text-green-400">▶ Kòmanse</button>
                  )}
                  {proj.status === 'active'    && (
                    <button onClick={() => setProjectStatus(proj.id, 'completed')} className="text-purple-400">✓ Mak Konplete</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BRANCHES TAB
// ─────────────────────────────────────────────────────────────
const BLANK_BRANCH = { name: '', city: '', country: '', address: '' };

function BranchesTab({ user }) {
  const cd       = user?.companyData || {};
  const branches = cd.branches || [];
  const saveCD   = useSaveCompany(user);
  const userId   = user?._id || user?.id;
  const { acquiring, gpsError, acquire } = useCompanyGPS();

  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(BLANK_BRANCH);
  const [saving, setSaving]           = useState(false);
  const [alertActive, setAlertActive] = useState(false);
  const [alertWorkers, setAlertWorkers] = useState([]);
  const [alertMsg, setAlertMsg]       = useState(null);
  const [skillFilter, setSkillFilter] = useState('');

  const addBranch = useCallback(async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const newBranch = {
      id:             `b_${Date.now()}`,
      ...form,
      employees:      [],
      activeProjects: [],
      createdAt:      new Date().toISOString(),
    };
    await saveCD({ ...cd, branches: [newBranch, ...branches] });
    setForm(BLANK_BRANCH);
    setShowForm(false);
    setSaving(false);
  }, [form, cd, branches, saveCD]);

  const doAlert = useCallback(async ({ lat, lng } = {}) => {
    setAlertMsg(null);
    const payload = {
      companyId:   userId,
      companyName: user?.name,
      skills:      skillFilter || undefined,
      city:        user?.location?.city,
      country:     user?.location?.country,
      ...(lat != null ? { lat, lng, radius: 25 } : {}),
    };
    try {
      const res = await API.post('/company/alert', payload);
      const workers = res?.data?.data?.workers || [];
      setAlertWorkers(workers);
      setAlertActive(true);
      setAlertMsg(workers.length > 0
        ? `✓ ${workers.length} travayè notifye`
        : 'Alèt voye — pa jwenn travayè ki koresponn nan zòn nan');
    } catch {
      setAlertActive(true);
      setAlertMsg('Alèt voye — pa gen koneksyon disponib kounye a');
    }
  }, [userId, user, skillFilter]);

  const sendAlert = useCallback(() => {
    acquire(
      ({ lat, lng }) => doAlert({ lat, lng }),
      () => doAlert(),   // GPS denied — fall back to city/country in payload
    );
  }, [acquire, doAlert]);

  return (
    <div className="space-y-4">

      {/* Branch list */}
      <Section icon="🏢" title="Branch yo"
        action={
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 text-[10px] text-blue-400 font-bold">
            <Plus className="w-3 h-3" /> Ajoute
          </button>
        }
      >
        {showForm && (
          <div className="mb-4 p-4 bg-slate-800/60 rounded-xl space-y-3">
            <input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
              placeholder="Non branch lan (e.g. Biwo Sid)"
              className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500/40" />
            <div className="flex gap-2">
              <input value={form.city} onChange={e => setForm(v => ({ ...v, city: e.target.value }))}
                placeholder="Vil" className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />
              <input value={form.country} onChange={e => setForm(v => ({ ...v, country: e.target.value }))}
                placeholder="Peyi" className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />
            </div>
            <input value={form.address} onChange={e => setForm(v => ({ ...v, address: e.target.value }))}
              placeholder="Adrès (opsyonèl)" className="w-full px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />
            <div className="flex gap-2">
              <button onClick={addBranch} disabled={saving || !form.name.trim()}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold disabled:opacity-40">
                {saving ? 'Ap sove...' : 'Ajoute Branch'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs">Anile</button>
            </div>
          </div>
        )}

        {branches.length === 0 && !showForm && (
          <div className="text-center py-6 text-slate-500 text-xs">
            <p className="text-3xl mb-2">🏢</p>
            <p>Pa gen branch pou kounye a</p>
          </div>
        )}

        <div className="space-y-2">
          {branches.map(branch => (
            <div key={branch.id} className="bg-slate-800/50 rounded-xl p-3 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-white">{branch.name}</p>
                <p className="text-[10px] text-slate-400">
                  {[branch.city, branch.country].filter(Boolean).join(', ')}
                </p>
                {branch.address && <p className="text-[10px] text-slate-500">{branch.address}</p>}
              </div>
              <div className="text-right text-[10px] text-slate-400">
                <p>{(branch.employees || []).length} anplwaye</p>
                <p>{(branch.activeProjects || []).length} pwojè</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* GPS Worker Alert */}
      <Section icon="📡" title="Chèche Travayè Pre w">
        <p className="text-[10px] text-slate-400 mb-3">
          Aktive alèt la pou travayè disponib ki pre konpayi an jwenn notifikasyon.
          GPS oswa vil/peyi ou ap sèvi kòm lokasyon.
        </p>

        <input value={skillFilter} onChange={e => setSkillFilter(e.target.value)}
          placeholder="Filtre pa konpetans (opsyonèl: chef, plonbye...)"
          className="w-full px-3 py-1.5 mb-3 bg-slate-800 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500/40" />

        {gpsError && (
          <p className="text-[10px] text-amber-400 mb-2">⚠ {gpsError} — ap itilize vil/peyi ou</p>
        )}

        <button onClick={sendAlert} disabled={acquiring}
          className={`w-full py-3 rounded-xl text-sm font-bold transition ${
            alertActive
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
              : 'bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-40'
          }`}
        >
          {acquiring ? '📡 Ap chèche GPS...' : alertActive ? '✓ Alèt Aktif' : '🔍 Chèche Travayè Pre w'}
        </button>

        {alertMsg && <p className="text-[10px] text-slate-300 mt-2 text-center">{alertMsg}</p>}

        {alertWorkers.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Travayè jwenn:</p>
            {alertWorkers.slice(0, 6).map((w, i) => (
              <div key={w._id || w.id || i} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                <span className="text-base">👷</span>
                <div>
                  <p className="text-xs font-bold text-white">{w.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {w.profession}{w.distanceKm != null ? ` • ${w.distanceKm}km` : w.location?.city ? ` • ${w.location.city}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {alertActive && (
          <button onClick={() => { setAlertActive(false); setAlertWorkers([]); setAlertMsg(null); }}
            className="w-full mt-2 text-[10px] text-slate-400 hover:text-rose-400 transition">
            Dezaktive Alèt
          </button>
        )}
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ANALYTICS TAB
// ─────────────────────────────────────────────────────────────
function AnalyticsTab({ user }) {
  const trustScore       = useMemo(() => computeCompanyTrustScore(user), [user]);
  const { pct, missing } = useMemo(() => computeCompanyCompleteness(user), [user]);

  const cd         = user?.companyData || {};
  const jobs       = cd.jobs       || [];
  const employees  = cd.employees  || [];
  const projects   = cd.projects   || [];

  const totalJobs      = jobs.length;
  const completedJobs  = jobs.filter(j => ['completed','confirmed','paid','closed'].includes(j.status)).length;
  const hiringRate     = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
  const activeWorkers  = employees.filter(e => e.status === 'active').length;
  const activeProjects = projects.filter(p => p.status === 'active').length;

  const RATE       = 500; // USD per completed job — MVP estimate
  const totalRev   = completedJobs * RATE;
  const monthRev   = Math.round(totalRev * 0.2);

  const rating     = user?.stats?.rating ?? 0;
  const complaints = cd.complaints       ?? 0;

  const scoreColor =
    trustScore >= 80 ? '#6366f1' :
    trustScore >= 50 ? '#3b82f6' :
                       '#ef4444';
  const textColorClass =
    trustScore >= 80 ? 'text-indigo-400' :
    trustScore >= 50 ? 'text-blue-400' :
                       'text-rose-400';

  const breakdowns = [
    { label: 'Travay Konplete', pts: Math.min(completedJobs, 20),                         max: 20, icon: '✅' },
    { label: 'Rating',          pts: Math.round((rating / 5) * 15),                       max: 15, icon: '⭐' },
    { label: 'Pwofil Konplè',   pts: Math.round((pct / 100) * 10),                        max: 10, icon: '📊' },
    { label: 'Verifikasyon',    pts: user?.verified ? 10 : 0,                              max: 10, icon: '✓'  },
    { label: 'Apa Reklamasyon', pts: complaints === 0 ? 10 : Math.max(0, 10 - complaints * 2), max: 10, icon: '🛡️' },
    { label: 'Pwen Baz',        pts: 30,                                                   max: 30, icon: '🏗️' },
  ];

  return (
    <div className="space-y-4">

      {/* Overview stats */}
      <Section icon="📊" title="Aperçi">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <MiniStat value={totalJobs}       label="Travay Afiche" color="blue"   />
          <MiniStat value={completedJobs}   label="Konplete"      color="green"  />
          <MiniStat value={`${hiringRate}%`}label="To Siksè"      color="purple" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MiniStat value={activeWorkers}   label="Anplwaye Aktif" color="amber" />
          <MiniStat value={activeProjects}  label="Pwojè Aktif"    color="blue"  />
          <MiniStat value={`${pct}%`}       label="Pwofil"         color="green" />
        </div>
      </Section>

      {/* Revenue estimate */}
      <Section icon="💰" title="Estimasyon Revni">
        <p className="text-[10px] text-slate-500 mb-3">
          ✱ Estimasyon MVP — pral mete ajou ak done pèman reyèl yo.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <MiniStat value={`$${totalRev.toLocaleString()}`} label="Total Estimasyon" color="amber" />
          <MiniStat value={`$${monthRev.toLocaleString()}`} label="Mwa Sa"           color="green" />
        </div>
        {/* Mini bar chart */}
        <div className="p-3 bg-slate-800/50 rounded-xl">
          <p className="text-[10px] text-slate-400 mb-2">Tren Revni (6 mwa)</p>
          <div className="h-10 flex items-end gap-1">
            {[0.2, 0.35, 0.3, 0.55, 0.5, 0.75, 1].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm"
                style={{ height: `${h * 100}%`, background: 'rgba(99,102,241,0.5)' }}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* Trust gauge */}
      <Section>
        <div className="flex flex-col items-center py-4">
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="12" />
              <circle cx="50" cy="50" r="40" fill="none"
                stroke={scoreColor} strokeWidth="12"
                strokeDasharray={`${trustScore * 2.51} 251`}
                strokeLinecap="round" className="transition-all"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black ${textColorClass}`}>{trustScore}</span>
              <span className="text-[10px] text-slate-400">/100</span>
            </div>
          </div>
          <h3 className="text-sm font-bold text-white mt-3">🛡️ Konfyans Konpayi</h3>
          <p className="text-[10px] text-slate-400 mt-1">
            {trustScore >= 80 ? 'Ekselan — Konpayi ou trè fyab!'
              : trustScore >= 50 ? 'Bon — Kontinye amelyore'
              : 'Bati reputasyon konpayi an'}
          </p>
        </div>
      </Section>

      {/* Breakdown */}
      <Section icon="📈" title="Detay Pwen yo">
        <div className="space-y-3">
          {breakdowns.map(b => (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300">{b.icon} {b.label}</span>
                <span className="text-xs font-bold text-blue-400">{b.pts}/{b.max}</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(b.pts / b.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Reputation */}
      <Section icon="🏆" title="Reputasyon Konpayi">
        <dl className="space-y-2.5">
          {[
            ['Nivo Konfyans',      `${trustScore}/100`],
            ['Verifikasyon',       user?.verified ? '✓ Verifye' : '— Annatant'],
            ['Rating Mwayen',      `⭐ ${rating.toFixed(1)}`],
            ['Travay Konplete',    String(completedJobs)],
            ['Reklamasyon',        String(complaints)],
            ['To Siksè Rekritman', `${hiringRate}%`],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between items-center">
              <dt className="text-xs text-slate-400">{label}</dt>
              <dd className="text-xs font-bold text-white">{val}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Completeness tips */}
      {missing.length > 0 && (
        <Section icon="💡" title="Amelyore Pwofil ou">
          <div className="space-y-1.5">
            {missing.slice(0, 4).map(tip => (
              <div key={tip} className="flex items-center gap-2 text-xs text-slate-300">
                <span className="text-blue-400 shrink-0">→</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Tab definitions (exported for Dashboard.jsx tab bar) ──────

export const COMPANY_TABS = [
  { id: 'overview',   label: 'Akeyi',      icon: '🏢' },
  { id: 'employees',  label: 'Anplwaye',   icon: '👥' },
  { id: 'hiring',     label: 'Rekritman',  icon: '💼' },
  { id: 'projects',   label: 'Pwojè',      icon: '📁' },
  { id: 'branches',   label: 'Branch',     icon: '🗺️' },
  { id: 'analytics',  label: 'Estatistik', icon: '📊' },
];

// ── Default export: tab content router ────────────────────────
// Dashboard.jsx renders 'overview' itself (CompanyOverviewSupplement + RoleDashboard).
// This component handles all other tabs.

export default function CompanyContent({ tab, user }) {
  switch (tab) {
    case 'employees': return <EmployeesTab user={user} />;
    case 'hiring':    return <HiringTab    user={user} />;
    case 'projects':  return <ProjectsTab  user={user} />;
    case 'branches':  return <BranchesTab  user={user} />;
    case 'analytics': return <AnalyticsTab user={user} />;
    default:          return null;
  }
}