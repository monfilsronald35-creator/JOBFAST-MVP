import React, { useState, useEffect, useCallback } from 'react';
import API from '@/api/axios';

const STATUS_STYLE = {
  active:    { cls: 'bg-green-500/10 text-green-400 border-green-500/20',  label: 'Active'    },
  suspended: { cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',label: 'Suspended' },
  banned:    { cls: 'bg-red-500/10 text-red-400 border-red-500/20',        label: 'Banned'    },
  verified:  { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',     label: 'Verified'  },
};

const statusOf = u =>
  u.accountStatus === 'banned'    ? 'banned'    :
  u.accountStatus === 'suspended' ? 'suspended' :
  u.verified ? 'verified' : 'active';

function Toast({ msg, onClose }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm font-bold shadow-xl">
      ✓ {msg}
    </div>
  );
}

function UserModal({ user, onClose, onAction }) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const act = async (type) => {
    setLoading(true);
    await onAction(type, user._id || user.id, reason);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-md bg-[#0d1526] border border-slate-700 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg">{user.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="space-y-2 text-sm">
          {[['Email', user.email], ['Role', user.role], ['Category', user.category || '—'], ['City', user.location?.city || '—'],
            ['Status', statusOf(user)], ['Joined', user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—']].map(([k,v]) => (
            <div key={k} className="flex justify-between items-center">
              <span className="text-slate-500">{k}</span>
              <span className="font-semibold text-white">{v}</span>
            </div>
          ))}
        </div>

        <label className="block">
          <p className="text-[10px] text-slate-500 mb-1">Reason (optional)</p>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Violation of terms"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-amber-500/60" />
        </label>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <button disabled={loading} onClick={() => act('verify')}
            className="py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-500/25 disabled:opacity-40 transition">
            ✅ Verify
          </button>
          <button disabled={loading} onClick={() => act('suspend')}
            className="py-2.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-bold hover:bg-yellow-500/25 disabled:opacity-40 transition">
            ⏸ Suspend
          </button>
          <button disabled={loading} onClick={() => act('ban')}
            className="py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/25 disabled:opacity-40 transition">
            🚫 Ban
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [role,    setRole]    = useState('');
  const [status,  setStatus]  = useState('');
  const [modal,   setModal]   = useState(null);
  const [toast,   setToast]   = useState('');
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (role)   params.role   = role;
      if (status) params.status = status;
      const res = await API.get('/admin/users', { params });
      const d = res.data?.data || res.data;
      setUsers(d?.items || d || []);
      setTotal(d?.total || 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => { load(); }, [load]);

  // debounce search: only reset page — the load() fires automatically via [load] effect above
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleAction = async (type, userId, reason) => {
    try {
      if (type === 'verify')  await API.patch(`/admin/users/${userId}/verify`,  { reason });
      if (type === 'suspend') await API.patch(`/admin/users/${userId}/suspend`, { reason });
      if (type === 'ban')     await API.patch(`/admin/users/${userId}/ban`,     { reason });
      setToast(`User ${type}d successfully`);
      load();
    } catch {
      setToast('Action failed — try again');
    }
  };

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  const ROLES   = ['', 'worker', 'boss', 'admin', 'restaurant', 'hotel', 'hospital', 'user'];
  const STATUSES = ['', 'active', 'suspended', 'banned'];

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Users Management</h1>
          <p className="text-slate-500 text-sm">{total.toLocaleString()} total users</p>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:text-white transition self-start">
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 min-w-48 px-4 py-2.5 bg-[#0d1526] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/60" />
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-[#0d1526] border border-slate-700 rounded-xl text-sm text-slate-300 outline-none">
          {ROLES.map(r => <option key={r} value={r}>{r || 'All Roles'}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-[#0d1526] border border-slate-700 rounded-xl text-sm text-slate-300 outline-none">
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Status'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0d1526] border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">User</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Role</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Location</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Joined</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/40">
                      {[1,2,3,4,5,6].map(j => (
                        <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : users.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-600">No users found</td></tr>
                  : users.map(u => {
                      const st = statusOf(u);
                      const style = STATUS_STYLE[st] || STATUS_STYLE.active;
                      return (
                        <tr key={u._id || u.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-black shrink-0">
                                {(u.name || '?')[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{u.name || 'Unknown'}</p>
                                <p className="text-[11px] text-slate-500">{u.email || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold text-slate-300">{u.role || 'user'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${style.cls}`}>{style.label}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">{u.location?.city || '—'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => setModal(u)}
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

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/40">
            <p className="text-xs text-slate-500">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 hover:bg-slate-700 transition">
                ← Prev
              </button>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 hover:bg-slate-700 transition">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && <UserModal user={modal} onClose={() => setModal(null)} onAction={handleAction} />}
      <Toast msg={toast} onClose={() => setToast('')} />
    </div>
  );
}
