import React, { useState, useEffect } from 'react';
import API from '@/api/axios';

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800/40 last:border-none">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-semibold text-white">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors duration-200
          ${checked ? 'bg-amber-500 border-amber-500' : 'bg-slate-700 border-slate-600'}`}>
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  const cls = type === 'error'
    ? 'bg-red-500/10 border-red-500/30 text-red-400'
    : 'bg-green-500/10 border-green-500/30 text-green-400';
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 border rounded-xl text-sm font-bold shadow-xl ${cls}`}>
      {type === 'error' ? '✕' : '✓'} {msg}
    </div>
  );
}

export default function AdminSettings() {
  const [settings,     setSettings]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [maintenance,  setMaintenance]  = useState(false);
  const [regOpen,      setRegOpen]      = useState(true);
  const [gpsEnabled,   setGpsEnabled]   = useState(true);
  const [maxSearch,    setMaxSearch]    = useState(50);
  const [toast,        setToast]        = useState({ msg: '', type: 'success' });

  // Global notification
  const [notifTitle,   setNotifTitle]   = useState('');
  const [notifMsg,     setNotifMsg]     = useState('');
  const [sending,      setSending]      = useState(false);

  useEffect(() => {
    API.get('/admin/settings')
      .then(res => {
        const d = res.data?.data || res.data;
        setSettings(d);
        setMaintenance(d?.maintenance ?? false);
        setRegOpen(d?.registrationOpen ?? true);
        setGpsEnabled(d?.gpsEnabled ?? true);
        setMaxSearch(d?.maxUsersPerSearch ?? 50);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await API.put('/admin/settings', {
        maintenance, registrationOpen: regOpen, gpsEnabled, maxUsersPerSearch: maxSearch,
      });
      setToast({ msg: 'Settings saved successfully', type: 'success' });
    } catch {
      setToast({ msg: 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleMaintenance = async () => {
    const next = !maintenance;
    try {
      await API.patch('/admin/maintenance', { enabled: next });
      setMaintenance(next);
      setToast({ msg: `Maintenance mode ${next ? 'enabled' : 'disabled'}`, type: 'success' });
    } catch {
      setToast({ msg: 'Failed to toggle maintenance', type: 'error' });
    }
  };

  const sendGlobalNotif = async () => {
    if (!notifMsg.trim()) return;
    setSending(true);
    try {
      const res = await API.post('/admin/notifications/global', { title: notifTitle, message: notifMsg });
      const sent = res.data?.data?.sent || 0;
      setToast({ msg: `Notification sent to ${sent} users`, type: 'success' });
      setNotifTitle(''); setNotifMsg('');
    } catch {
      setToast({ msg: 'Failed to send notification', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const clearCache = async () => {
    try {
      await API.delete('/admin/cache');
      setToast({ msg: 'Cache cleared', type: 'success' });
    } catch {
      setToast({ msg: 'Failed to clear cache', type: 'error' });
    }
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black">System Settings</h1>
        <p className="text-slate-500 text-sm">Configure the JOBFAST platform</p>
      </div>

      {/* ── Platform Toggles ─────────────────────────────────── */}
      <div className="bg-[#0d1526] border border-slate-800/60 rounded-2xl p-5">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">⚙️ Platform Settings</p>

        {loading
          ? <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-800 rounded-xl animate-pulse" />)}</div>
          : <>
              <Toggle
                checked={maintenance}  onChange={toggleMaintenance}
                label="Maintenance Mode"
                description="When ON, the app shows a maintenance page to all users"
              />
              <Toggle
                checked={regOpen}      onChange={setRegOpen}
                label="Open Registration"
                description="Allow new users to create accounts"
              />
              <Toggle
                checked={gpsEnabled}   onChange={setGpsEnabled}
                label="GPS / Location"
                description="Enable GPS-based features and job matching"
              />

              <div className="py-3 border-b border-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Max Results per Search</p>
                  <span className="text-sm font-black text-amber-400">{maxSearch}</span>
                </div>
                <input type="range" min={10} max={200} step={10} value={maxSearch} onChange={e => setMaxSearch(+e.target.value)}
                  className="w-full accent-amber-400" />
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>10</span><span>200</span>
                </div>
              </div>

              <div className="pt-3">
                <button onClick={saveSettings} disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-black text-sm transition">
                  {saving ? 'Saving…' : '💾 Save Settings'}
                </button>
              </div>
            </>
        }
      </div>

      {/* ── Global Notification ─────────────────────────────── */}
      <div className="bg-[#0d1526] border border-slate-800/60 rounded-2xl p-5">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">📢 Send Global Notification</p>
        <div className="space-y-3">
          <label className="block">
            <p className="text-[10px] text-slate-500 mb-1.5">Title</p>
            <input value={notifTitle} onChange={e => setNotifTitle(e.target.value)}
              placeholder="e.g. Platform maintenance tonight"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/60" />
          </label>
          <label className="block">
            <p className="text-[10px] text-slate-500 mb-1.5">Message</p>
            <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)} rows={3}
              placeholder="Write your message to all users…"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/60 resize-none" />
          </label>
          <button disabled={!notifMsg.trim() || sending} onClick={sendGlobalNotif}
            className="px-6 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-400 disabled:opacity-30 font-black text-sm transition">
            {sending ? 'Sending…' : '📢 Send to All Users'}
          </button>
        </div>
      </div>

      {/* ── System Tools ────────────────────────────────────── */}
      <div className="bg-[#0d1526] border border-slate-800/60 rounded-2xl p-5">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">🔧 System Tools</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon:'🗑', label:'Clear Cache',    fn: clearCache,    cls:'text-yellow-400 border-yellow-500/20 bg-yellow-500/10 hover:bg-yellow-500/20' },
            { icon:'📊', label:'Export Data',    fn: () => window.open('/api/v1/admin/export?type=users'), cls:'text-blue-400 border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20' },
            { icon:'📋', label:'Audit Logs',     fn: () => {}, cls:'text-purple-400 border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20' },
            { icon:'🏥', label:'Health Check',   fn: () => window.open('/api/v1/admin/health'), cls:'text-green-400 border-green-500/20 bg-green-500/10 hover:bg-green-500/20' },
          ].map(({ icon, label, fn, cls }) => (
            <button key={label} onClick={fn}
              className={`flex items-center gap-3 p-4 rounded-xl border font-bold text-sm transition ${cls}`}>
              <span className="text-xl">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'success' })} />
    </div>
  );
}
