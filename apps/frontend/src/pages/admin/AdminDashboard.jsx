import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '@/api/axios';

const fmtNum  = n => Number.isFinite(+n) ? (+n).toLocaleString() : '0';
const fmtPct  = n => `${Number.isFinite(+n) ? (+n).toFixed(1) : '0'}%`;

function KpiCard({ icon, label, value, sub, color = 'text-amber-400', loading }) {
  return (
    <div className="bg-[#0d1526] border border-slate-800/60 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl">{icon}</span>
        <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{label}</span>
      </div>
      {loading
        ? <div className="h-8 w-24 rounded-lg bg-slate-800 animate-pulse" />
        : <p className={`text-3xl font-black ${color}`}>{value}</p>
      }
      {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function RoleBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold text-white w-8 text-right">{count}</span>
    </div>
  );
}

const ROLE_COLORS = {
  worker: '#3b82f6', boss: '#f59e0b', admin: '#ef4444', super_admin: '#8b5cf6',
  restaurant: '#22c55e', hotel: '#06b6d4', hospital: '#ec4899', user: '#94a3b8',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats,    setStats]    = useState(null);
  const [health,   setHealth]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sRes, hRes] = await Promise.allSettled([
          API.get('/admin/dashboard'),
          API.get('/admin/health'),
        ]);
        if (sRes.status === 'fulfilled') setStats(sRes.value.data?.data || sRes.value.data);
        if (hRes.status === 'fulfilled') setHealth(hRes.value.data?.data || hRes.value.data);
      } catch (e) {
        setError('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const roles  = stats?.roles || {};
  const total  = stats?.totalUsers || 0;
  const active = stats?.activeUsers || 0;
  const verified = stats?.verifiedUsers || 0;

  const QUICK_LINKS = [
    { icon:'👥', label:'Manage Users',   path:'/admin/users'      },
    { icon:'💼', label:'Review Jobs',    path:'/admin/jobs'       },
    { icon:'🎫', label:'Support Queue',  path:'/admin/support'    },
    { icon:'⚙️', label:'System Settings',path:'/admin/settings'   },
    { icon:'🛡', label:'Governance',     path:'/admin/governance' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm">Platform overview · {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</p>
        </div>
        <button onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:text-white hover:border-amber-500/40 transition">
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="👥" label="Total Users"    value={fmtNum(total)}   sub="All registered" loading={loading} />
        <KpiCard icon="🟢" label="Active Users"   value={fmtNum(active)}  sub="Not suspended"  loading={loading} color="text-green-400" />
        <KpiCard icon="✅" label="Verified"       value={fmtNum(verified)} sub="Identity confirmed" loading={loading} color="text-blue-400" />
        <KpiCard icon="📈" label="Verify Rate"    value={fmtPct(total > 0 ? (verified/total)*100 : 0)} sub="of all users" loading={loading} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* User breakdown by role */}
        <div className="bg-[#0d1526] border border-slate-800/60 rounded-2xl p-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">👤 Users by Role</p>
          {loading
            ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-4 bg-slate-800 rounded animate-pulse" />)}</div>
            : Object.entries(roles).length > 0
              ? <div className="space-y-3">
                  {Object.entries(roles).sort((a,b) => b[1]-a[1]).map(([role, count]) => (
                    <RoleBar key={role} label={role} count={count} total={total} color={ROLE_COLORS[role] || '#64748b'} />
                  ))}
                </div>
              : <p className="text-slate-600 text-sm text-center py-6">No users yet</p>
          }
        </div>

        {/* System health */}
        <div className="bg-[#0d1526] border border-slate-800/60 rounded-2xl p-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">🔧 System Health</p>
          {loading
            ? <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-4 bg-slate-800 rounded animate-pulse" />)}</div>
            : health
              ? <div className="space-y-3">
                  {[
                    ['Status',   health.status === 'healthy' ? '🟢 Healthy' : '🔴 Degraded'],
                    ['Uptime',   `${Math.floor((health.uptime||0)/3600)}h ${Math.floor(((health.uptime||0)%3600)/60)}m`],
                    ['Heap',     `${health.memory?.heapUsedMb || 0} MB`],
                    ['RSS',      `${health.memory?.rssMb || 0} MB`],
                    ['DB Users', `${health.users || 0} in memory`],
                  ].map(([k,v]) => (
                    <div key={k} className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">{k}</span>
                      <span className="text-xs font-bold text-white">{v}</span>
                    </div>
                  ))}
                </div>
              : <p className="text-slate-600 text-sm text-center py-6">Health check unavailable</p>
          }
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-[#0d1526] border border-slate-800/60 rounded-2xl p-5">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">⚡ Quick Actions</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {QUICK_LINKS.map(({ icon, label, path }) => (
            <button key={path} onClick={() => navigate(path)}
              className="flex flex-col items-center gap-2 py-4 bg-slate-800/50 border border-slate-700/60 hover:border-amber-500/50 hover:bg-amber-500/5 rounded-2xl transition active:scale-95">
              <span className="text-2xl">{icon}</span>
              <span className="text-[11px] font-semibold text-slate-300">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <p className="text-center text-[10px] text-slate-700">
        JOBFAST Admin Panel · {stats?.generatedAt ? new Date(stats.generatedAt).toLocaleTimeString() : 'Live'}
      </p>
    </div>
  );
}
