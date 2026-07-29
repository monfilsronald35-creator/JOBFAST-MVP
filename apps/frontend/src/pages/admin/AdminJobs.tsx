import { useState, useEffect, useCallback } from 'react';
import API from '@/api/axios';

interface Job {
  _id?: string; id?: string; title: string; status: string;
  type?: string; category?: string; budget?: number;
  description?: string; createdAt?: string; createdBy?: string;
  location?: { city?: string };
}

interface JobStats { total?: number; active?: number; filled?: number; }

const STATUS_STYLE: Record<string, { cls: string }> = {
  open:        { cls: 'bg-green-500/10 text-green-400 border-green-500/20'    },
  assigned:    { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20'       },
  in_progress: { cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  completed:   { cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20'    },
  cancelled:   { cls: 'bg-red-500/10 text-red-400 border-red-500/20'          },
};
const FALLBACK_STYLE = STATUS_STYLE['open']!;

interface ToastProps { msg: string; onClose: () => void; }
function Toast({ msg, onClose }: ToastProps) {
  useEffect(() => {
    if (msg) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msg]);
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm font-bold shadow-xl">
      ✓ {msg}
    </div>
  );
}

interface JobModalProps { job: Job; onClose: () => void; onUpdateStatus: (id: string, status: string) => Promise<void>; }
function JobModal({ job, onClose, onUpdateStatus }: JobModalProps) {
  const [loading, setLoading] = useState(false);
  const STATUSES = ['open', 'assigned', 'in_progress', 'completed', 'cancelled'];

  const update = async (status: string) => {
    setLoading(true);
    await onUpdateStatus(job._id ?? job.id ?? '', status);
    setLoading(false);
    onClose();
  };

  const rows: [string, string][] = [
    ['Status',   job.status],
    ['Type',     job.type ?? '—'],
    ['Category', job.category ?? '—'],
    ['Budget',   `$${job.budget ?? 0}`],
    ['City',     job.location?.city ?? '—'],
    ['Created',  job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'],
    ['Posted by',job.createdBy ?? '—'],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-lg bg-[#0d1526] border border-slate-700 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg">{job.title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-4 bg-slate-800/40 rounded-xl space-y-2 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-slate-500">{k}</span>
              <span className="font-semibold text-white">{v}</span>
            </div>
          ))}
        </div>

        {job.description && (
          <p className="text-xs text-slate-400 bg-slate-800/40 rounded-xl p-3">{job.description}</p>
        )}

        <div>
          <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Change Status</p>
          <div className="grid grid-cols-3 gap-2">
            {STATUSES.map(s => {
              const st = STATUS_STYLE[s] ?? FALLBACK_STYLE;
              return (
                <button key={s} disabled={loading || job.status === s} onClick={() => update(s)}
                  className={`py-2 rounded-xl text-[10px] font-black border capitalize transition
                    ${job.status === s ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80'} ${st.cls}`}>
                  {s.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminJobs() {
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [stats,   setStats]   = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState('');
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState<Job | null>(null);
  const [toast,   setToast]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (status) params['status']   = status;
      if (search) params['category'] = search;
      const [jRes, sRes] = await Promise.allSettled([
        API.get<unknown>('/jobs', { params }),
        API.get<{ data?: JobStats } | JobStats>('/admin/jobs/stats'),
      ]);
      if (jRes.status === 'fulfilled') {
        const raw = jRes.value.data as Job[] | { data?: Job[] };
        setJobs(Array.isArray(raw) ? raw : (raw as { data?: Job[] }).data ?? []);
      } else {
        setJobs([]);
      }
      if (sRes.status === 'fulfilled') {
        const d = sRes.value.data as { data?: JobStats } & JobStats;
        setStats(d?.data ?? d);
      }
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => { load(); }, [load]);

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    try {
      await API.patch(`/jobs/status/${jobId}`, { status: newStatus });
      setToast(`Job status updated to ${newStatus}`);
      load();
    } catch {
      setToast('Failed to update status');
    }
  };

  const filtered = jobs.filter(j =>
    !search || j.title?.toLowerCase().includes(search.toLowerCase())
  );

  const statRows: [string, number, string][] = [
    ['💼 Total', stats?.total ?? 0,  'text-amber-400'],
    ['🟢 Active', stats?.active ?? 0, 'text-green-400'],
    ['✅ Filled', stats?.filled ?? 0, 'text-blue-400'],
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Jobs Management</h1>
          <p className="text-slate-500 text-sm">{jobs.length} total jobs</p>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:text-white transition self-start">
          🔄 Refresh
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {statRows.map(([label, val, color]) => (
            <div key={label} className="bg-[#0d1526] border border-slate-800/60 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1">{label}</p>
              <p className={`text-3xl font-black ${color}`}>{val}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search jobs by title or category…"
          className="flex-1 min-w-48 px-4 py-2.5 bg-[#0d1526] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/60" />
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2.5 bg-[#0d1526] border border-slate-700 rounded-xl text-sm text-slate-300 outline-none">
          {(['', 'open', 'assigned', 'in_progress', 'completed', 'cancelled'] as const).map(s => (
            <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All Status'}</option>
          ))}
        </select>
      </div>

      <div className="bg-[#0d1526] border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                {['Title', 'Type', 'Budget', 'Location', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/40">
                      {[1,2,3,4,5,6,7].map(j => (
                        <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : filtered.length === 0
                  ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-600">
                      No jobs found — they'll appear here once users post jobs
                    </td></tr>
                  : filtered.map(job => {
                      const st = STATUS_STYLE[job.status] ?? FALLBACK_STYLE;
                      return (
                        <tr key={job._id ?? job.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-white">{job.title}</p>
                            <p className="text-[11px] text-slate-500">{job.category ?? '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 capitalize">{job.type ?? '—'}</td>
                          <td className="px-4 py-3 text-xs font-bold text-amber-400">${job.budget ?? 0}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">{job.location?.city ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${st.cls}`}>
                              {(job.status ?? 'open').replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => setModal(job)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition">
                              Manage →
                            </button>
                          </td>
                        </tr>
                      );
                    })
              }
            </tbody>
          </table>
        </div>
      </div>

      {modal && <JobModal job={modal} onClose={() => setModal(null)} onUpdateStatus={handleUpdateStatus} />}
      <Toast msg={toast} onClose={() => setToast('')} />
    </div>
  );
}