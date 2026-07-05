import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Flag, Globe, Lock, FileText, AlertTriangle,
  Scale, Heart, CheckCircle, XCircle, Clock, Search,
  Download, RefreshCw, ChevronDown, ChevronUp, Eye, EyeOff,
  ToggleLeft, ToggleRight, Users, Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  GOVERNANCE_TABS, AUDIT_TYPE_LABELS, AUDIT_TYPE_COLORS,
  MODERATION_TYPES, MODERATION_ACTIONS,
  PERMISSION_LABELS, ROLES_WITH_PERMISSIONS,
  CONSENT_TYPE_LABELS, COUNTRY_FLAGS, COUNTRY_LABELS,
  COMPLAINT_STATUS_CONFIG, FLAG_ICONS,
} from '../../config/governanceConfig.js';

const API = '/api/v1/admin/governance';

function useGovAPI(path, deps = []) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      if (j.success) setData(j.data);
      else setError(j.message || 'Erè');
    } catch {
      setError('Koneksyon rate');
    } finally {
      setLoading(false);
    }
  }, [path, token]);

  useEffect(() => { load(); }, deps);

  return { data, loading, error, reload: load };
}

async function govPost(path, body, token, method = 'POST') {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return r.json();
}

// ── Shared UI pieces ──────────────────────────────────────────

function Badge({ color, bg, children }) {
  return (
    <span style={{ color, background: bg }} className="px-2 py-0.5 rounded-full text-xs font-medium">
      {children}
    </span>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {children}
    </div>
  );
}

function Stat({ label, value, icon: Icon, color = '#3b82f6' }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
      <div className="p-2 rounded-lg" style={{ background: color + '22' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

// ── AUDIT LOGS ────────────────────────────────────────────────

function AuditLogs() {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ type: '', search: '', page: 1 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: filters.page,
      limit: 50,
      ...(filters.type && { type: filters.type }),
      ...(filters.search && { search: filters.search }),
    });
    try {
      const r = await fetch(`${API}/audit-logs?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      if (j.success) setData(j.data);
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    const r = await fetch(`${API}/audit-logs/export`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit-logs-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
            <input
              placeholder="Rechèch..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
              className="pl-7 pr-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <select
            value={filters.type}
            onChange={e => setFilters(f => ({ ...f, type: e.target.value, page: 1 }))}
            className="text-sm border rounded-lg px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Tout tip</option>
            {Object.entries(AUDIT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-white">
            <RefreshCw size={14} /> Rafraîchi
          </button>
          <button onClick={handleExport} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={14} /> Ekspòte CSV
          </button>
        </div>
      </div>

      {loading && <p className="text-center text-gray-500 py-4">Chajman...</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
              <th className="pb-2 pr-4">Tip</th>
              <th className="pb-2 pr-4">Aksyon</th>
              <th className="pb-2 pr-4">Aktè</th>
              <th className="pb-2 pr-4">Sib</th>
              <th className="pb-2">Dat</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {(data?.entries || []).map(e => (
              <tr key={e.id} className="text-gray-700 dark:text-gray-300">
                <td className="py-2 pr-4">
                  <Badge color={AUDIT_TYPE_COLORS[e.type] || '#6b7280'} bg={(AUDIT_TYPE_COLORS[e.type] || '#6b7280') + '22'}>
                    {AUDIT_TYPE_LABELS[e.type] || e.type}
                  </Badge>
                </td>
                <td className="py-2 pr-4 font-mono text-xs">{e.action || '—'}</td>
                <td className="py-2 pr-4 text-xs">{e.actorId ? e.actorId.slice(0, 8) + '…' : '—'}</td>
                <td className="py-2 pr-4 text-xs">{e.targetId ? e.targetId.slice(0, 8) + '…' : '—'}</td>
                <td className="py-2 text-xs text-gray-400">{e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
            {!loading && !(data?.entries?.length) && (
              <tr><td colSpan={5} className="py-6 text-center text-gray-400">Pa gen anregistreman</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Total: {data.total} anregistreman</span>
          <div className="flex gap-2">
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              className="px-3 py-1 border rounded disabled:opacity-40 dark:border-gray-600 dark:text-white"
            >Prev</button>
            <span className="px-2 py-1">P{filters.page}</span>
            <button
              disabled={!data.hasMore}
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              className="px-3 py-1 border rounded disabled:opacity-40 dark:border-gray-600 dark:text-white"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MODERATION CENTER ─────────────────────────────────────────

function ModerationCenter() {
  const { token } = useAuth();
  const [typeFilter, setTypeFilter] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/moderation?type=${typeFilter}`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      if (j.success) setData(j.data);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, token]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (item, action) => {
    const reason = prompt(`Rezon pou "${action}" (opsyonèl):`);
    setActing(item.id);
    const type = item.itemType;
    const id = type === 'user' ? item.userId : item.id.replace(/^(rev_|cmp_|usr_|ver_\w+_)/, '');
    const actualId = item.id.replace(/^(rev_|cmp_|usr_)/, '');
    try {
      await govPost(`/moderation/${type}/${actualId}`, { action, reason }, token);
      await load();
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {MODERATION_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setTypeFilter(t.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              typeFilter === t.id
                ? 'bg-blue-600 text-white'
                : 'border dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
        <button onClick={load} className="ml-auto flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading && <p className="text-center text-gray-500 py-4">Chajman...</p>}

      <div className="space-y-2">
        {(data?.items || []).map(item => {
          const actions = MODERATION_ACTIONS[item.itemType] || [];
          return (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      color={COMPLAINT_STATUS_CONFIG[item.status]?.color || '#6b7280'}
                      bg={(COMPLAINT_STATUS_CONFIG[item.status]?.color || '#6b7280') + '22'}
                    >
                      {item.itemType}
                    </Badge>
                    <Badge color={COMPLAINT_STATUS_CONFIG[item.status]?.color || '#6b7280'} bg={COMPLAINT_STATUS_CONFIG[item.status]?.bg || '#f3f4f6'}>
                      {COMPLAINT_STATUS_CONFIG[item.status]?.label || item.status}
                    </Badge>
                    {item.flagScore != null && (
                      <Badge color="#ef4444" bg="#fee2e2">Score: {item.flagScore}</Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.userName || item.userId}
                    {item.userRole && <span className="text-gray-400 ml-1">({item.userRole})</span>}
                  </p>
                  {item.comment && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.comment}</p>
                  )}
                  {item.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                  )}
                  {item.category && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Kategori: {item.category}</p>
                  )}
                  {item.verificationType && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tip: {item.verificationType}</p>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {actions.map(a => (
                    <button
                      key={a.id}
                      onClick={() => handleAction(item, a.id)}
                      disabled={acting === item.id}
                      style={{ background: a.color }}
                      className="px-2.5 py-1 text-xs text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
        {!loading && !(data?.items?.length) && (
          <p className="text-center text-gray-400 py-8">Pa gen atik pou modere</p>
        )}
      </div>

      {data && (
        <p className="text-sm text-gray-500 text-right">{data.total} atik total</p>
      )}
    </div>
  );
}

// ── FRAUD DETECTION ───────────────────────────────────────────

function FraudDetection() {
  const { token } = useAuth();
  const { data, loading, reload } = useGovAPI('/fraud', []);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const runScan = async () => {
    setScanning(true);
    const j = await govPost('/fraud/scan', {}, token);
    if (j.success) setScanResult(j.data);
    setScanning(false);
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">Deteksyon Fwòd</h3>
        <button
          onClick={runScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          <Activity size={16} />
          {scanning ? 'Analizé...' : 'Eskane Sistèm'}
        </button>
      </div>

      {scanResult && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300">
            Eskane fini: {scanResult.scanned} itilizatè analize, {scanResult.flagged} make.
          </p>
        </Card>
      )}

      {loading && <p className="text-center text-gray-500 py-4">Chajman...</p>}

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total Itilizatè" value={data.summary.totalUsers} icon={Users} color="#3b82f6" />
          <Stat label="Siyalman Fwòd" value={data.summary.totalFraudFlags} icon={AlertTriangle} color="#f97316" />
          <Stat label="Siyalman Spam" value={data.summary.totalSpamFlags} icon={Flag} color="#f59e0b" />
          <Stat label="Risk Wo" value={data.summary.highRiskCount} icon={Shield} color="#ef4444" />
        </div>
      )}

      <div className="space-y-2">
        {(data?.flagged || []).map(u => (
          <Card key={u.userId}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email} · {u.role}</p>
                {u.fraudSignals?.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {u.fraudSignals.map(s => (
                      <Badge key={s} color="#ef4444" bg="#fee2e2">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-red-600">Fwòd: {u.fraudScore}</p>
                <p className="text-xs text-orange-500">Spam: {u.spamScore}</p>
                <Badge
                  color={u.accountStatus === 'active' ? '#22c55e' : '#ef4444'}
                  bg={u.accountStatus === 'active' ? '#dcfce7' : '#fee2e2'}
                >
                  {u.accountStatus}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
        {!loading && !(data?.flagged?.length) && (
          <p className="text-center text-gray-400 py-8">Pa gen itilizatè risk wo</p>
        )}
      </div>
    </div>
  );
}

// ── DISPUTE RESOLUTION ────────────────────────────────────────

function DisputeResolution() {
  const { token } = useAuth();
  const { data, loading, reload } = useGovAPI('/disputes', []);
  const [acting, setActing] = useState(null);

  const update = async (id, status, resolution) => {
    setActing(id);
    await govPost(`/disputes/${id}`, { status, resolution }, token, 'PATCH');
    setActing(null);
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">File Dispute</h3>
        <button onClick={reload} className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading && <p className="text-center text-gray-500 py-4">Chajman...</p>}

      <div className="space-y-2">
        {(data?.disputes || []).map(d => (
          <Card key={d.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    color={COMPLAINT_STATUS_CONFIG[d.status]?.color || '#6b7280'}
                    bg={COMPLAINT_STATUS_CONFIG[d.status]?.bg || '#f3f4f6'}
                  >
                    {COMPLAINT_STATUS_CONFIG[d.status]?.label || d.status}
                  </Badge>
                  <span className="text-xs text-gray-400">{d.category}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{d.description}</p>
                <p className="text-xs text-gray-400 mt-1">Sib: {d.targetUserName} ({d.targetUserRole})</p>
                {d.adminNotes && <p className="text-xs text-blue-500 mt-1">Notes: {d.adminNotes}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => update(d.id, 'resolved', 'in_favor')}
                  disabled={acting === d.id}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Rezoud
                </button>
                <button
                  onClick={() => update(d.id, 'rejected', null)}
                  disabled={acting === d.id}
                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                >
                  Rejete
                </button>
              </div>
            </div>
          </Card>
        ))}
        {!loading && !(data?.disputes?.length) && (
          <p className="text-center text-gray-400 py-8">Pa gen dispute aktif</p>
        )}
      </div>
    </div>
  );
}

// ── FEATURE FLAGS ─────────────────────────────────────────────

function FeatureFlags() {
  const { token } = useAuth();
  const { data, loading, reload } = useGovAPI('/feature-flags', []);
  const [editing, setEditing] = useState(null);

  const toggle = async (flag) => {
    await govPost(`/feature-flags/${flag.id}`, { enabled: !flag.enabled }, token);
    reload();
  };

  const emergencyOff = async (flag) => {
    await govPost(`/feature-flags/${flag.id}`, { emergencyDisabled: !flag.emergencyDisabled }, token);
    reload();
  };

  const updateRollout = async (flag, pct) => {
    await govPost(`/feature-flags/${flag.id}`, { rolloutPct: parseInt(pct, 10) }, token);
    setEditing(null);
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">Fonksyon Disponiblite</h3>
        <button onClick={reload} className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading && <p className="text-center text-gray-500 py-4">Chajman...</p>}

      <div className="space-y-2">
        {(data?.flags || []).map(flag => (
          <Card key={flag.id}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{FLAG_ICONS[flag.id] || '🚩'}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{flag.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{flag.description}</p>
                  </div>
                  {flag.isBeta && <Badge color="#f97316" bg="#ffedd5">Beta</Badge>}
                  {flag.emergencyDisabled && <Badge color="#ef4444" bg="#fee2e2">IJANS KOUPE</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {editing === flag.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="range" min={0} max={100} defaultValue={flag.rolloutPct}
                        className="w-24"
                        onMouseUp={e => updateRollout(flag, e.target.value)}
                      />
                      <span className="text-xs text-gray-500">{flag.rolloutPct}%</span>
                      <button onClick={() => setEditing(null)} className="text-xs text-gray-400">Anile</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditing(flag.id)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      Deployaj: {flag.rolloutPct}%
                    </button>
                  )}
                  {flag.roles?.length > 0 && (
                    <span className="text-xs text-gray-400">Wòl: {flag.roles.join(', ')}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => emergencyOff(flag)}
                  title="Koupe ijans"
                  className={`text-xs px-2 py-1 rounded ${flag.emergencyDisabled ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}
                >
                  {flag.emergencyDisabled ? '🚨 ON' : '🚨 OFF'}
                </button>
                <button onClick={() => toggle(flag)} className="focus:outline-none">
                  {flag.enabled && !flag.emergencyDisabled
                    ? <ToggleRight size={28} className="text-blue-600" />
                    : <ToggleLeft size={28} className="text-gray-400" />}
                </button>
              </div>
            </div>
          </Card>
        ))}
        {!loading && !(data?.flags?.length) && (
          <p className="text-center text-gray-400 py-8">Pa gen fonksyon</p>
        )}
      </div>
    </div>
  );
}

// ── COUNTRY CONFIG ────────────────────────────────────────────

function CountryConfiguration() {
  const { token } = useAuth();
  const { data, loading, reload } = useGovAPI('/countries', []);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState(false);

  const country = data?.countries?.find(c => c.code === selected);

  const save = async () => {
    setSaving(true);
    await govPost(`/countries/${selected}`, editing, token, 'PATCH');
    setSaving(false);
    setEditing({});
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(data?.countries || []).map(c => (
          <button
            key={c.code}
            onClick={() => { setSelected(c.code); setEditing({}); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              selected === c.code
                ? 'bg-blue-600 text-white'
                : 'border dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {COUNTRY_FLAGS[c.code] || '🌍'} {COUNTRY_LABELS[c.code] || c.name}
            {!c.active && <Badge color="#6b7280" bg="#f3f4f6">Inactif</Badge>}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-gray-500 py-4">Chajman...</p>}

      {country && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Enfòmasyon Jeneral</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Kòd:</span>
                <span className="font-mono text-gray-900 dark:text-white">{country.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lajan:</span>
                <span className="text-gray-900 dark:text-white">{country.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Timezone:</span>
                <span className="text-gray-900 dark:text-white text-xs">{country.timezone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Aktif:</span>
                <button
                  onClick={() => { setEditing(e => ({ ...e, active: !country.active })); }}
                  className="focus:outline-none"
                >
                  {(editing.active !== undefined ? editing.active : country.active)
                    ? <ToggleRight size={22} className="text-blue-600" />
                    : <ToggleLeft size={22} className="text-gray-400" />}
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Règ Travay</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Laj min:</span>
                <span className="text-gray-900 dark:text-white">{country.laborRules.minAge} an</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Salè min/jou:</span>
                <span className="text-gray-900 dark:text-white">{country.laborRules.minWagePerDay} {country.laborRules.minWageCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Max hr/semèn:</span>
                <span className="text-gray-900 dark:text-white">{country.laborRules.maxHoursPerWeek}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ekstra-tan:</span>
                <span className="text-gray-900 dark:text-white">×{country.laborRules.overtimeMultiplier}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Règ Peman</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Metòd:</span>
                <span className="text-gray-900 dark:text-white text-xs">{country.paymentRules.methods.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Defòlt:</span>
                <span className="text-gray-900 dark:text-white">{country.paymentRules.defaultMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rembourseman:</span>
                <span className="text-gray-900 dark:text-white">{country.paymentRules.refundWindowDays} jou</span>
              </div>
            </div>
          </Card>

          <Card>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Règ Fiskal</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">TVA:</span>
                <span className="text-gray-900 dark:text-white">{(country.taxRules.vatRate * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Taks Sèvis:</span>
                <span className="text-gray-900 dark:text-white">{(country.taxRules.servicesTaxRate * 100).toFixed(0)}%</span>
              </div>
            </div>
          </Card>

          {Object.keys(editing).length > 0 && (
            <div className="md:col-span-2 flex gap-2">
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Sòvgade...' : 'Sove Chanjman'}
              </button>
              <button onClick={() => setEditing({})} className="px-4 py-2 border rounded-lg dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                Anile
              </button>
            </div>
          )}
        </div>
      )}

      {!selected && !loading && (
        <p className="text-center text-gray-400 py-8">Chwazi yon peyi pou wè konfigirasyon</p>
      )}
    </div>
  );
}

// ── PERMISSION MATRIX ─────────────────────────────────────────

function PermissionMatrix() {
  const { token } = useAuth();
  const { data, loading, reload } = useGovAPI('/permissions', []);
  const [saving, setSaving] = useState(null);
  const [local, setLocal] = useState({});

  const matrix = local.matrix || data?.matrix || {};

  const toggle = (role, perm) => {
    setLocal(prev => ({
      matrix: {
        ...(prev.matrix || data?.matrix || {}),
        [role]: {
          ...(prev.matrix?.[role] || data?.matrix?.[role] || {}),
          [perm]: !(prev.matrix?.[role]?.[perm] ?? data?.matrix?.[role]?.[perm] ?? false),
        },
      },
    }));
  };

  const save = async (role) => {
    setSaving(role);
    const patch = local.matrix?.[role] || {};
    await govPost(`/permissions/${role}`, patch, token, 'PATCH');
    setSaving(null);
    reload();
    setLocal({});
  };

  const permissions = Object.keys(PERMISSION_LABELS);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">Matris Pèmisyon</h3>
        <button onClick={reload} className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading && <p className="text-center text-gray-500 py-4">Chajman...</p>}

      <div className="overflow-x-auto">
        <table className="text-xs w-full">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">Wòl</th>
              {permissions.map(p => (
                <th key={p} className="py-2 px-1 text-gray-500 dark:text-gray-400 font-medium" title={PERMISSION_LABELS[p]}>
                  <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', height: 80 }}>
                    {PERMISSION_LABELS[p]}
                  </div>
                </th>
              ))}
              <th className="py-2 px-2 text-gray-500 dark:text-gray-400"></th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {ROLES_WITH_PERMISSIONS.map(role => (
              <tr key={role} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-2 pr-4 font-medium text-gray-900 dark:text-white">{role}</td>
                {permissions.map(perm => {
                  const val = local.matrix?.[role]?.[perm] ?? matrix[role]?.[perm] ?? false;
                  return (
                    <td key={perm} className="py-2 px-1 text-center">
                      <button
                        onClick={() => toggle(role, perm)}
                        className="focus:outline-none"
                        title={`${PERMISSION_LABELS[perm]}: ${val ? 'Aktif' : 'Inaktif'}`}
                      >
                        {val
                          ? <CheckCircle size={14} className="text-green-500 mx-auto" />
                          : <XCircle size={14} className="text-gray-300 dark:text-gray-600 mx-auto" />}
                      </button>
                    </td>
                  );
                })}
                <td className="py-2 px-2">
                  {local.matrix?.[role] && (
                    <button
                      onClick={() => save(role)}
                      disabled={saving === role}
                      className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving === role ? '…' : 'Sove'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── CONSENT & PRIVACY ─────────────────────────────────────────

function ConsentTracking() {
  const { token } = useAuth();
  const [userId, setUserId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const params = userId ? `?userId=${userId}&limit=100` : '?limit=50';
      const r = await fetch(`${API}/consent${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      if (j.success) setData(j.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { search(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
          <input
            placeholder="Filtè pa userId..."
            value={userId}
            onChange={e => setUserId(e.target.value)}
            className="pl-7 pr-3 py-1.5 text-sm border rounded-lg w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <button onClick={search} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          Chèche
        </button>
      </div>

      {loading && <p className="text-center text-gray-500 py-4">Chajman...</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
              <th className="pb-2 pr-4">Itilizatè</th>
              <th className="pb-2 pr-4">Tip Konsantman</th>
              <th className="pb-2 pr-4">Desizyon</th>
              <th className="pb-2 pr-4">IP</th>
              <th className="pb-2">Dat</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {(data?.logs || []).map(l => (
              <tr key={l.id} className="text-gray-700 dark:text-gray-300">
                <td className="py-2 pr-4 text-xs font-mono">{l.userId?.slice(0, 12)}…</td>
                <td className="py-2 pr-4">{CONSENT_TYPE_LABELS[l.type] || l.type}</td>
                <td className="py-2 pr-4">
                  <Badge color={l.granted ? '#22c55e' : '#ef4444'} bg={l.granted ? '#dcfce7' : '#fee2e2'}>
                    {l.granted ? 'Aksepte' : 'Refize'}
                  </Badge>
                </td>
                <td className="py-2 pr-4 text-xs text-gray-400">{l.ip || '—'}</td>
                <td className="py-2 text-xs text-gray-400">{l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
            {!loading && !(data?.logs?.length) && (
              <tr><td colSpan={5} className="py-6 text-center text-gray-400">Pa gen anregistreman</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <p className="text-sm text-right text-gray-500">Total: {data.total}</p>}
    </div>
  );
}

// ── SYSTEM HEALTH ─────────────────────────────────────────────

function SystemHealth() {
  const { data, loading, reload } = useGovAPI('/health', []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">Sante Sistèm</h3>
        <button onClick={reload} className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading && <p className="text-center text-gray-500 py-4">Chajman...</p>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Heart size={16} className="text-red-500" /> Itilizatè
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Total" value={data.users?.total ?? 0} icon={Users} color="#3b82f6" />
              <Stat label="Aktif" value={data.users?.active ?? 0} icon={CheckCircle} color="#22c55e" />
              <Stat label="Sispann" value={data.users?.suspended ?? 0} icon={Clock} color="#f97316" />
              <Stat label="Bloke" value={data.users?.banned ?? 0} icon={XCircle} color="#ef4444" />
            </div>
          </Card>

          <Card>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Activity size={16} className="text-blue-500" /> Sistèm
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Uptime:</span>
                <span className="text-gray-900 dark:text-white">{Math.floor((data.uptime || 0) / 60)} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">RAM Itilize:</span>
                <span className="text-gray-900 dark:text-white">{data.memory?.heapUsedMb ?? 0} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">RAM Total:</span>
                <span className="text-gray-900 dark:text-white">{data.memory?.heapTotalMb ?? 0} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">RSS:</span>
                <span className="text-gray-900 dark:text-white">{data.memory?.rssMb ?? 0} MB</span>
              </div>
            </div>
          </Card>

          <Card>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Flag size={16} className="text-purple-500" /> Fonksyon
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Total Flags" value={data.featureFlags?.total ?? 0} icon={Flag} color="#8b5cf6" />
              <Stat label="Aktive" value={data.featureFlags?.enabled ?? 0} icon={ToggleRight} color="#22c55e" />
            </div>
          </Card>

          <Card>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText size={16} className="text-yellow-500" /> Konsantman
            </h4>
            <Stat label="Anregistreman Konsantman" value={data.consentLogs ?? 0} icon={FileText} color="#f59e0b" />
          </Card>
        </div>
      )}

      <p className="text-xs text-gray-400 text-right">
        {data?.timestamp ? `Dènye mise à jour: ${new Date(data.timestamp).toLocaleString()}` : ''}
      </p>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────

const TAB_COMPONENTS = {
  audit:       AuditLogs,
  moderation:  ModerationCenter,
  fraud:       FraudDetection,
  disputes:    DisputeResolution,
  flags:       FeatureFlags,
  countries:   CountryConfiguration,
  permissions: PermissionMatrix,
  consent:     ConsentTracking,
  health:      SystemHealth,
};

export default function AdminGovernance() {
  const [activeTab, setActiveTab] = useState('audit');
  const ActiveComponent = TAB_COMPONENTS[activeTab] || AuditLogs;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gouvènans & Konpliyas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Administrasyon Sistèm JOBFAST</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap bg-white dark:bg-gray-800 rounded-xl p-1.5 border border-gray-200 dark:border-gray-700">
          {GOVERNANCE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <Card>
          <ActiveComponent />
        </Card>
      </div>
    </div>
  );
}