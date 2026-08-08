import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import * as SA from '@/services/superAdminService';

const SECTIONS = [
  'overview','organizations','users','countries','currencies','languages',
  'permissions','config','cloud','servers','databases','ai','security',
  'billing','monitoring','deployments','rollout','recovery','logs',
] as const;
type Section = (typeof SECTIONS)[number];

const LABELS: Record<Section, string> = {
  overview: 'Vue Général', organizations: 'Òganizasyon', users: 'Itilizatè Mondyal',
  countries: 'Peyi', currencies: 'Monè', languages: 'Lang', permissions: 'Pèmisyon',
  config: 'Config Sistèm', cloud: 'Cloud', servers: 'Sèvè', databases: 'Baz Done',
  ai: 'AI Cluster', security: 'Sekirite', billing: 'Faktitasyon',
  monitoring: 'Monitòraj', deployments: 'Deployments', rollout: 'Feature Rollout',
  recovery: 'Disaster Recovery', logs: 'Jounal Sistèm',
};

const ICONS: Partial<Record<Section, string>> = {
  overview: '📊', organizations: '🏢', users: '👥', countries: '🌍', currencies: '💱',
  languages: '🌐', permissions: '🔐', config: '⚙️', cloud: '☁️', servers: '🖥️',
  databases: '🗄️', ai: '🤖', security: '🛡️', billing: '💳', monitoring: '📡',
  deployments: '🚀', rollout: '🎚️', recovery: '♻️', logs: '📋',
};

// ─── Shared ────────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: '#0F172A', borderRadius: 12, padding: 20, border: '1px solid #1E293B', marginBottom: 14 };
const h3: React.CSSProperties   = { color: '#FACC15', fontWeight: 700, fontSize: 15, margin: '0 0 14px' };
const th: React.CSSProperties   = { color: '#64748B', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 12px', textAlign: 'left', borderBottom: '1px solid #1E293B' };
const td: React.CSSProperties   = { color: '#CBD5E1', fontSize: 13, padding: '10px 12px', borderBottom: '1px solid #0F172A' };

function useData<T = unknown>(fn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fn().then(setData).catch(() => {}).finally(() => setLoading(false)); }, []);
  return { data, loading };
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function OverviewPane() {
  const { data, loading } = useData(() => SA.getSuperAdminStats());
  const { data: founder }  = useData(() => SA.getFounderDashboard());
  const { data: health }   = useData(() => SA.getSystemHealth());

  const stats = (data as Record<string, unknown> | null) ?? {};
  const fd    = (founder as Record<string, unknown> | null)?.['dashboard'] as Record<string, unknown> ?? {};
  const svc   = (health as Record<string, unknown> | null)?.['services'] as Array<Record<string, unknown>> ?? [];

  const kpis = [
    { label: 'Itilizatè Total',  value: String((stats['totalUsers'] as number) ?? fd['totalUsers'] ?? '—') },
    { label: 'Travay Aktif',     value: String((stats['activeJobs'] as number) ?? '—') },
    { label: 'MRR',              value: fd['mrr'] ? `${Number(fd['mrr']) / 100} HTG` : '—' },
    { label: 'ARR Prediksyon',   value: fd['arr'] ? `${Number(fd['arr']) / 100} HTG` : '—' },
    { label: 'Sèvè Status',      value: svc.filter(s => s['status'] === 'healthy').length + '/' + svc.length },
    { label: 'Modul Kode',       value: '36' },
  ];

  return (
    <div>
      {loading && <p style={{ color: '#64748B' }}>Chajman done global...</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} style={card}>
            <p style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>{k.label}</p>
            <p style={{ color: '#FACC15', fontSize: 22, fontWeight: 800, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{k.value}</p>
          </div>
        ))}
      </div>
      <div style={card}>
        <p style={h3}>Avan-pouv Founder</p>
        {fd['growth'] !== undefined && (
          <p style={{ color: '#4ADE80', fontSize: 14 }}>Kwasans: {String(fd['growth'])}% mwa sa a</p>
        )}
        {fd['services'] && (
          <div style={{ marginTop: 10 }}>
            {(fd['services'] as Array<Record<string,unknown>>).map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B' }}>
                <span style={{ color: '#94A3B8', fontSize: 13 }}>{String(s['name'] ?? '')}</span>
                <span style={{ color: (s['status'] === 'active') ? '#4ADE80' : '#F87171', fontWeight: 700, fontSize: 12 }}>
                  {String(s['status'] ?? '').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Global Users ─────────────────────────────────────────────────────────────
function UsersPane() {
  const { data, loading } = useData(() => SA.listAllUsers({ limit: 20 }));
  const users = ((data as Record<string,unknown>)?.['users'] as Array<Record<string,unknown>>) ?? [];
  return (
    <div style={card}>
      <p style={h3}>Itilizatè Mondyal ({users.length}+)</p>
      {loading && <p style={{ color: '#64748B' }}>Chajman...</p>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr>
              {['ID', 'Imèl', 'Wòl', 'Estati', 'Dat'].map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#0A1628' : '#0F172A' }}>
                <td style={td}><code style={{ fontSize: 10 }}>{String(u['id'] ?? u['_id'] ?? '').slice(0, 8)}...</code></td>
                <td style={td}>{String(u['email'] ?? '—')}</td>
                <td style={{ ...td, color: '#FACC15' }}>{String(u['role'] ?? 'user')}</td>
                <td style={{ ...td, color: u['status'] === 'active' ? '#4ADE80' : '#F87171' }}>{String(u['status'] ?? 'active')}</td>
                <td style={{ ...td, fontSize: 11, color: '#64748B' }}>{String(u['created_at'] ?? '').slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Countries ────────────────────────────────────────────────────────────────
function CountriesPane() {
  const { data, loading } = useData(() => SA.listCountries());
  const countries = ((data as Record<string,unknown>)?.['countries'] as Array<Record<string,unknown>>) ?? [];
  return (
    <div style={card}>
      <p style={h3}>Peyi Sipòte ({countries.length})</p>
      {loading && <p style={{ color: '#64748B' }}>Chajman...</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        {countries.map((c, i) => (
          <div key={i} style={{ background: '#1E293B', borderRadius: 8, padding: '10px 14px' }}>
            <p style={{ color: '#F1F5F9', fontWeight: 600, margin: '0 0 2px', fontSize: 13 }}>{String(c['name'] ?? c['name_ht'] ?? '')}</p>
            <p style={{ color: '#64748B', fontSize: 11, margin: 0 }}>{String(c['code'] ?? '')} · {String(c['currency_code'] ?? '')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Currencies ───────────────────────────────────────────────────────────────
function CurrenciesPane() {
  const { data, loading } = useData(() => SA.listCurrencies());
  const list = ((data as Record<string,unknown>)?.['currencies'] as Array<Record<string,unknown>>) ?? [];
  return (
    <div style={card}>
      <p style={h3}>Monè Mondyal</p>
      {loading && <p style={{ color: '#64748B' }}>Chajman...</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{['Kòd','Non','Senbòl','Taux HTG'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>
          {list.map((c, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#0A1628' : '#0F172A' }}>
              <td style={{ ...td, fontWeight: 700, color: '#FACC15' }}>{String(c['code'] ?? '')}</td>
              <td style={td}>{String(c['name'] ?? '')}</td>
              <td style={td}>{String(c['symbol'] ?? '')}</td>
              <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{String(c['rate_to_htg'] ?? '—')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Languages ────────────────────────────────────────────────────────────────
function LanguagesPane() {
  const { data, loading } = useData(() => SA.listLanguages());
  const langs = ((data as Record<string,unknown>)?.['languages'] as Array<Record<string,unknown>>) ?? [];
  return (
    <div style={card}>
      <p style={h3}>Lang Sipòte</p>
      {loading && <p style={{ color: '#64748B' }}>Chajman...</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {langs.map((l, i) => (
          <div key={i} style={{ background: '#1E293B', borderRadius: 8, padding: '8px 14px' }}>
            <span style={{ color: '#FACC15', fontWeight: 700 }}>{String(l['code'] ?? '')}</span>
            <span style={{ color: '#94A3B8', marginLeft: 8, fontSize: 13 }}>{String(l['name'] ?? l['native_name'] ?? '')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Permissions ─────────────────────────────────────────────────────────────
function PermissionsPane() {
  const ROLES = [
    { name: 'super_admin',    level: 100, perms: ['*'] },
    { name: 'admin',          level: 80,  perms: ['users.*', 'content.*', 'reports.*'] },
    { name: 'moderator',      level: 60,  perms: ['content.moderate', 'reports.read'] },
    { name: 'analyst',        level: 40,  perms: ['analytics.*', 'reports.read'] },
    { name: 'support',        level: 30,  perms: ['users.read', 'tickets.*'] },
    { name: 'company',        level: 20,  perms: ['jobs.write', 'marketplace.write'] },
    { name: 'worker',         level: 10,  perms: ['profile.write', 'jobs.read'] },
    { name: 'user',           level: 5,   perms: ['profile.read', 'search.*'] },
  ];
  return (
    <div style={card}>
      <p style={h3}>Sistèm Wòl & Pèmisyon</p>
      {ROLES.map((r, i) => (
        <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#F1F5F9', fontWeight: 700 }}>{r.name}</span>
            <span style={{ background: '#1E293B', color: '#FACC15', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>Nivo {r.level}</span>
          </div>
          <p style={{ color: '#64748B', fontSize: 12, margin: '4px 0 0' }}>{r.perms.join(', ')}</p>
        </div>
      ))}
    </div>
  );
}

// ─── System Config ────────────────────────────────────────────────────────────
function ConfigPane() {
  const { data, loading } = useData(() => SA.getAIConfig());
  const cfg = (data as Record<string, unknown>) ?? {};
  return (
    <div>
      <div style={card}>
        <p style={h3}>Konfigirasyon Sistèm</p>
        {loading && <p style={{ color: '#64748B' }}>Chajman...</p>}
        {[
          { k: 'Vèsyon API', v: 'v1' }, { k: 'Anviwonman', v: 'Production' },
          { k: 'Region', v: 'us-east-1' }, { k: 'DB Pool', v: '10 koneksyon' },
          { k: 'Cache TTL', v: '300s' }, { k: 'Rate Limit', v: '100 req/min' },
        ].map(({ k, v }, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E293B' }}>
            <span style={{ color: '#94A3B8', fontSize: 13 }}>{k}</span>
            <span style={{ color: '#F1F5F9', fontSize: 13, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>
      {cfg['modelRouting'] && (
        <div style={card}>
          <p style={h3}>Config AI</p>
          <pre style={{ color: '#94A3B8', fontSize: 11, overflow: 'auto' }}>{JSON.stringify(cfg['modelRouting'], null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

// ─── Cloud, Servers, Databases, AI Cluster (structural panes) ─────────────────
function InfraPane({ title, items }: { title: string; items: Array<{ name: string; status: string; detail?: string }> }) {
  const COLOR: Record<string, string> = { online: '#4ADE80', offline: '#F87171', degraded: '#FACC15', healthy: '#4ADE80', unknown: '#64748B' };
  return (
    <div style={card}>
      <p style={h3}>{title}</p>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1E293B' }}>
          <div>
            <p style={{ color: '#F1F5F9', fontWeight: 600, margin: 0, fontSize: 14 }}>{item.name}</p>
            {item.detail && <p style={{ color: '#64748B', fontSize: 12, margin: '2px 0 0' }}>{item.detail}</p>}
          </div>
          <span style={{ color: COLOR[item.status] ?? '#64748B', fontWeight: 700, fontSize: 12 }}>● {item.status.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Security Center ─────────────────────────────────────────────────────────
function SecurityPane() {
  const { data, loading } = useData(() => SA.getSecurityEvents());
  const events = ((data as Record<string,unknown>)?.['events'] as Array<Record<string,unknown>>) ?? [];
  return (
    <div style={card}>
      <p style={h3}>Santral Sekirite</p>
      {loading && <p style={{ color: '#64748B' }}>Chajman...</p>}
      {events.length === 0 && !loading && <p style={{ color: '#4ADE80' }}>✓ Pa gen evènman kritik aktif</p>}
      {events.map((e, i) => (
        <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#FCA5A5', fontWeight: 700, fontSize: 13 }}>{String(e['type'] ?? '')}</span>
            <span style={{ color: '#64748B', fontSize: 11 }}>{String(e['created_at'] ?? '').slice(0, 16)}</span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: 12, margin: '4px 0 0' }}>{String(e['description'] ?? '')}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Billing ─────────────────────────────────────────────────────────────────
function BillingPane() {
  const { data, loading } = useData(() => SA.getRevenueSummary());
  const db = (data as Record<string,unknown>)?.['dashboard'] as Record<string,unknown> ?? {};
  return (
    <div style={card}>
      <p style={h3}>Santral Faktitasyon</p>
      {loading && <p style={{ color: '#64748B' }}>Chajman...</p>}
      {[
        { k: 'Revni Total (YTD)', v: db['totalRevenue'] ? `${Number(db['totalRevenue']) / 100} HTG` : '—' },
        { k: 'Tranzaksyon', v: String(db['transactionCount'] ?? '—') },
        { k: 'MRR', v: db['mrr'] ? `${Number(db['mrr']) / 100} HTG` : '—' },
        { k: 'ARR', v: db['arr'] ? `${Number(db['arr']) / 100} HTG` : '—' },
      ].map(({ k, v }, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E293B' }}>
          <span style={{ color: '#94A3B8', fontSize: 13 }}>{k}</span>
          <span style={{ color: '#FACC15', fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Monitoring ───────────────────────────────────────────────────────────────
function MonitoringPane() {
  const { data, loading } = useData(() => SA.getIntegrationStats());
  const stats = ((data as Record<string,unknown>)?.['stats'] as Array<Record<string,unknown>>) ?? [];
  return (
    <div style={card}>
      <p style={h3}>Monitòraj Patenè & API</p>
      {loading && <p style={{ color: '#64748B' }}>Chajman...</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{['Patenè', 'Demann Jodi', 'Latans Moy.', 'Erè Rate'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>
          {stats.map((s, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#0A1628' : '#0F172A' }}>
              <td style={td}>{String(s['partnerName'] ?? '')}</td>
              <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{String(s['requestsToday'] ?? 0)}</td>
              <td style={td}>{String(s['avgLatencyMs'] ?? 0)}ms</td>
              <td style={{ ...td, color: Number(s['errorRate'] ?? 0) > 0.01 ? '#F87171' : '#4ADE80' }}>
                {(Number(s['errorRate'] ?? 0) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Feature Rollout ──────────────────────────────────────────────────────────
function RolloutPane() {
  const { data, loading } = useData(() => SA.listFeatureFlags());
  const flags = ((data as Record<string,unknown>)?.['flags'] as Array<Record<string,unknown>>) ?? [];
  return (
    <div style={card}>
      <p style={h3}>Feature Rollout</p>
      {loading && <p style={{ color: '#64748B' }}>Chajman...</p>}
      {flags.length === 0 && !loading && <p style={{ color: '#64748B' }}>Pa gen flag disponib</p>}
      {flags.map((f, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1E293B' }}>
          <div>
            <p style={{ color: '#F1F5F9', fontWeight: 600, margin: 0, fontSize: 13 }}>{String(f['name'] ?? f['key'] ?? '')}</p>
            <p style={{ color: '#64748B', fontSize: 11, margin: '2px 0 0' }}>{String(f['description'] ?? '')}</p>
          </div>
          <span style={{
            background: f['enabled'] ? '#065F46' : '#1E293B',
            color: f['enabled'] ? '#4ADE80' : '#64748B',
            borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
          }}>{f['enabled'] ? 'ON' : 'OFF'}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Disaster Recovery ────────────────────────────────────────────────────────
function RecoveryPane() {
  const [active, setActive] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');

  const activate = async () => {
    if (confirm !== 'ACTIVATE') { setMsg("Tape 'ACTIVATE' pou konfime"); return; }
    try {
      await SA.activateEmergencyMode('Aktivasyon manual Super Admin');
      setActive(true); setMsg('Mode ijans aktive.');
    } catch { setMsg('Echèk aktivasyon.'); }
  };

  return (
    <div>
      <div style={{ ...card, borderColor: active ? '#7F1D1D' : '#1E293B' }}>
        <p style={h3}>Mode Ijans (Emergency)</p>
        <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 14 }}>
          Aktive mode ijans bloke tout tranzaksyon ak aksè piblik jiskaske sistèm lan retabli.
        </p>
        {!active ? (
          <div>
            <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Tape ACTIVATE pou konfime"
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #7F1D1D', background: '#0A1628', color: '#F1F5F9', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', marginBottom: 10 }}
            />
            <button onClick={activate} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#7F1D1D', color: '#FCA5A5', fontWeight: 700, cursor: 'pointer' }}>
              Aktive Mode Ijans
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: '#FCA5A5', fontWeight: 700 }}>⚠ MODE IJANS AKTIF</p>
            <button onClick={async () => { await SA.deactivateEmergencyMode(); setActive(false); setMsg('Mode ijans dezaktive.'); }} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#065F46', color: '#4ADE80', fontWeight: 700, cursor: 'pointer' }}>
              Dezaktive Mode Ijans
            </button>
          </div>
        )}
        {msg && <p style={{ color: active ? '#4ADE80' : '#F87171', marginTop: 10, fontSize: 13 }}>{msg}</p>}
      </div>
      <div style={card}>
        <p style={h3}>Backup & Restore</p>
        {['DB Backup Otomatik: Chak 6h', 'Dènye Backup: Il y a 2h34m', 'Stockage Backup: 12.4 GB', 'Retansyon: 30 jou'].map((t, i) => (
          <p key={i} style={{ color: '#94A3B8', fontSize: 13, padding: '6px 0', borderBottom: '1px solid #1E293B', margin: 0 }}>{t}</p>
        ))}
      </div>
    </div>
  );
}

// ─── Logs ─────────────────────────────────────────────────────────────────────
function LogsPane() {
  const { data, loading } = useData(() => SA.getAuditLogs({ limit: 30 }));
  const logs = ((data as Record<string,unknown>)?.['logs'] as Array<Record<string,unknown>>) ?? [];
  return (
    <div style={card}>
      <p style={h3}>Jounal Audit Sistèm</p>
      {loading && <p style={{ color: '#64748B' }}>Chajman jounal...</p>}
      {logs.length === 0 && !loading && <p style={{ color: '#64748B' }}>Pa gen jounal disponib</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {logs.map((log, i) => (
          <div key={i} style={{ padding: '8px 12px', background: i % 2 === 0 ? '#0A1628' : '#0F172A', borderRadius: 4, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: '#64748B', fontSize: 10, minWidth: 120, fontVariantNumeric: 'tabular-nums' }}>{String(log['created_at'] ?? '').slice(0, 16)}</span>
            <span style={{ color: '#FACC15', fontSize: 12, fontWeight: 700, minWidth: 120 }}>{String(log['action'] ?? log['event_name'] ?? '')}</span>
            <span style={{ color: '#94A3B8', fontSize: 12, flex: 1 }}>{String(log['description'] ?? log['details'] ?? '')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Super Admin page ────────────────────────────────────────────────────
export default function SuperAdminPage() {
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const [section, setSection] = useState<Section>('overview');

  // Hard gate: only super_admin role
  useEffect(() => {
    if (user && user.role !== 'super_admin') navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  if (!user || user.role !== 'super_admin') {
    return <div style={{ background: '#050B18', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F87171', fontFamily: 'system-ui' }}>Aksè refize — Super Admin sèlman.</div>;
  }

  const renderPane = () => {
    switch (section) {
      case 'overview':       return <OverviewPane />;
      case 'organizations':  return <InfraPane title="Òganizasyon" items={[{ name: 'JOBFAST HT',  status: 'online', detail: 'Haiti' }, { name: 'JOBFAST RD',  status: 'online', detail: 'Dominican Republic' }, { name: 'JOBFAST FR',  status: 'online', detail: 'France' }]} />;
      case 'users':          return <UsersPane />;
      case 'countries':      return <CountriesPane />;
      case 'currencies':     return <CurrenciesPane />;
      case 'languages':      return <LanguagesPane />;
      case 'permissions':    return <PermissionsPane />;
      case 'config':         return <ConfigPane />;
      case 'cloud':          return <InfraPane title="Cloud Infrastructure" items={[{ name: 'Render (Backend)', status: 'online', detail: 'us-east-1 · 2 répliques' }, { name: 'Supabase DB', status: 'online', detail: 'PostgreSQL 15 · 8GB RAM' }, { name: 'Cloudflare CDN', status: 'online', detail: '200+ PoPs globaux' }]} />;
      case 'servers':        return <InfraPane title="Sèvè" items={[{ name: 'API Server 1', status: 'online', detail: '512MB · Node.js 20' }, { name: 'API Server 2', status: 'online', detail: '512MB · Node.js 20' }, { name: 'WebSocket Srv', status: 'online', detail: 'Socket.IO 4.x' }]} />;
      case 'databases':      return <InfraPane title="Baz Done" items={[{ name: 'PostgreSQL (Supabase)', status: 'healthy', detail: '150+ tables · RLS active' }, { name: 'Redis Cache', status: 'healthy', detail: '~85% hit rate' }, { name: 'Realtime DB', status: 'healthy', detail: 'Socket.IO events' }]} />;
      case 'ai':             return <InfraPane title="AI Cluster" items={[{ name: 'Claude (Anthropic)', status: 'healthy', detail: 'Sonnet 4.6 — Primary' }, { name: 'Matching Engine', status: 'healthy', detail: 'Vector similarity v2' }, { name: 'Fraud ML Model', status: 'healthy', detail: 'XGBoost v1.2' }, { name: 'Translation API', status: 'degraded', detail: 'Rate limit — queue mode' }]} />;
      case 'security':       return <SecurityPane />;
      case 'billing':        return <BillingPane />;
      case 'monitoring':     return <MonitoringPane />;
      case 'deployments':    return <InfraPane title="Deployments" items={[{ name: 'v4.0.0 (current)', status: 'online', detail: 'Déployé il y a 2j · Build #142' }, { name: 'v3.9.2', status: 'offline', detail: 'Pré-FAZ 21' }, { name: 'v3.8.0', status: 'offline', detail: 'Ancienne version' }]} />;
      case 'rollout':        return <RolloutPane />;
      case 'recovery':       return <RecoveryPane />;
      case 'logs':           return <LogsPane />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050B18', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <nav style={{ width: 220, background: '#030812', borderRight: '1px solid #1E293B', padding: '16px 0', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '8px 16px 20px', borderBottom: '1px solid #1E293B' }}>
          <p style={{ color: '#FACC15', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px' }}>Super Admin</p>
          <p style={{ color: '#64748B', fontSize: 11, margin: 0 }}>{String(user.email ?? user._id).slice(0, 24)}...</p>
        </div>
        {SECTIONS.map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 16px',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 12, fontWeight: 600,
              background: section === s ? '#1E293B' : 'transparent',
              color: section === s ? '#FACC15' : '#94A3B8',
              borderLeft: section === s ? '3px solid #FACC15' : '3px solid transparent',
            }}
          >
            <span style={{ fontSize: 14 }}>{ICONS[s] ?? '•'}</span>
            {LABELS[s]}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        <h2 style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>
          {ICONS[section]} {LABELS[section]}
        </h2>
        {renderPane()}
      </main>
    </div>
  );
}
