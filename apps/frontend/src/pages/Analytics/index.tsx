import React, { useState, useEffect } from 'react';
import API from '@/api/axios';

// ─── Types ────────────────────────────────────────────────────────────────────
interface KPI { label: string; value: string; change?: string; positive?: boolean }
interface ChartBar { label: string; value: number; max: number }

const TABS = [
  'business','marketplace','financial','ai',
  'revenue','growth','engagement','fraud','performance','health',
] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  business: 'Biznis', marketplace: 'Mache', financial: 'Finans', ai: 'AI',
  revenue: 'Revni', growth: 'Kwasans', engagement: 'Angajman',
  fraud: 'Fwòd', performance: 'Pèfòmans', health: 'Sante Sistèm',
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ kpi }: { kpi: KPI }) {
  return (
    <div style={{
      background: '#0F172A', borderRadius: 12, padding: '16px 20px',
      border: '1px solid #1E293B', minWidth: 160,
    }}>
      <p style={{ color: '#64748B', fontSize: 12, margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</p>
      <p style={{ color: '#F1F5F9', fontSize: 24, fontWeight: 800, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</p>
      {kpi.change && (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: kpi.positive ? '#4ADE80' : '#F87171' }}>
          {kpi.positive ? '↑' : '↓'} {kpi.change}
        </p>
      )}
    </div>
  );
}

// ─── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, title }: { data: ChartBar[]; title: string }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ background: '#0F172A', borderRadius: 12, padding: '20px', border: '1px solid #1E293B' }}>
      <p style={{ color: '#94A3B8', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((bar, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#64748B', fontSize: 12, minWidth: 80, textAlign: 'right' }}>{bar.label}</span>
            <div style={{ flex: 1, background: '#1E293B', borderRadius: 4, height: 20, overflow: 'hidden' }}>
              <div style={{
                width: `${(bar.value / maxVal) * 100}%`,
                height: '100%', background: '#FACC15', borderRadius: 4,
                transition: 'width .6s ease',
              }} />
            </div>
            <span style={{ color: '#F1F5F9', fontSize: 12, minWidth: 40, fontVariantNumeric: 'tabular-nums' }}>{bar.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Panes ────────────────────────────────────────────────────────────────────

function useAnalytics(endpoint: string) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  useEffect(() => {
    setLoading(true); setError(false);
    API.get(endpoint)
      .then(r => setData(r.data as Record<string, unknown>))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [endpoint]);

  return { data, loading, error };
}

function LoadState({ loading, error }: { loading: boolean; error: boolean }) {
  if (loading) return <p style={{ color: '#64748B', padding: 24 }}>Chajman done...</p>;
  if (error)   return <p style={{ color: '#F87171', padding: 24 }}>Echèk chajman done. Verifye koneksyon ou.</p>;
  return null;
}

function BusinessPane() {
  const { data, loading, error } = useAnalytics('/analytics/business/summary');
  const kpis: KPI[] = data ? [
    { label: 'Travay Aktif',    value: String((data['active_jobs'] as number) ?? 0),      positive: true,  change: '12%' },
    { label: 'Kandida',         value: String((data['applications'] as number) ?? 0),     positive: true,  change: '8%' },
    { label: 'Kontra Siyen',    value: String((data['contracts'] as number) ?? 0),        positive: true,  change: '5%' },
    { label: 'Konpayi Aktif',   value: String((data['companies'] as number) ?? 0),        positive: false, change: '1%' },
  ] : [
    { label: 'Travay Aktif',  value: '—' }, { label: 'Kandida',      value: '—' },
    { label: 'Kontra Siyen',  value: '—' }, { label: 'Konpayi Aktif', value: '—' },
  ];
  return (
    <div>
      {(loading || error) ? <LoadState loading={loading} error={error} /> : null}
      <div style={kpiGrid}>{kpis.map((k, i) => <KPICard key={i} kpi={k} />)}</div>
      <BarChart title="Travay pa Kategori" data={[
        { label: 'Konstrtiksyon', value: 342, max: 500 },
        { label: 'Restoran',      value: 278, max: 500 },
        { label: 'Transpò',       value: 195, max: 500 },
        { label: 'Swen Sante',    value: 156, max: 500 },
        { label: 'Teknoloji',     value: 89,  max: 500 },
      ]} />
    </div>
  );
}

function MarketplacePane() {
  const kpis: KPI[] = [
    { label: 'Pwodwi Aktif',  value: '1,247', positive: true,  change: '15%' },
    { label: 'Sèvis Aktif',   value: '892',   positive: true,  change: '22%' },
    { label: 'Kòmand Jodi',   value: '138',   positive: true,  change: '7%'  },
    { label: 'Valè Mwayen',   value: '4,200 HTG', positive: false, change: '3%' },
  ];
  return (
    <div>
      <div style={kpiGrid}>{kpis.map((k, i) => <KPICard key={i} kpi={k} />)}</div>
      <BarChart title="Vant pa Kategori" data={[
        { label: 'Manje',      value: 480, max: 600 },
        { label: 'Elektronik', value: 320, max: 600 },
        { label: 'Vètman',     value: 215, max: 600 },
        { label: 'Sèvis Pro',  value: 180, max: 600 },
        { label: 'Imobilye',   value: 95,  max: 600 },
      ]} />
    </div>
  );
}

function FinancialPane() {
  const { data, loading, error } = useAnalytics('/monetization/revenue/dashboard');
  const d = (data?.['dashboard'] as Record<string, unknown>) ?? {};
  const kpis: KPI[] = [
    { label: 'Revni Total',   value: d['totalRevenue']  ? `${Number(d['totalRevenue']) / 100} HTG` : '—', positive: true, change: '18%' },
    { label: 'Tranzaksyon',   value: String(d['transactionCount'] ?? '—') },
    { label: 'MRR',           value: d['mrr']           ? `${Number(d['mrr']) / 100} HTG` : '—', positive: true, change: '12%' },
    { label: 'ARR Prediksyon', value: d['arr']          ? `${Number(d['arr']) / 100} HTG` : '—', positive: true },
  ];
  return (
    <div>
      {(loading || error) ? <LoadState loading={loading} error={error} /> : null}
      <div style={kpiGrid}>{kpis.map((k, i) => <KPICard key={i} kpi={k} />)}</div>
      <BarChart title="Revni pa Mwa (HTG)" data={[
        { label: 'Jan', value: 125_000, max: 300_000 }, { label: 'Fev', value: 148_000, max: 300_000 },
        { label: 'Mas', value: 192_000, max: 300_000 }, { label: 'Avr', value: 168_000, max: 300_000 },
        { label: 'Me',  value: 215_000, max: 300_000 }, { label: 'Jen', value: 243_000, max: 300_000 },
      ]} />
    </div>
  );
}

function AIAnalyticsPane() {
  const kpis: KPI[] = [
    { label: 'Demann AI',     value: '8,432',  positive: true, change: '34%' },
    { label: 'Match Précis',  value: '94.2%',  positive: true, change: '2.1%' },
    { label: 'Tps Mwayen',    value: '1.4s',   positive: true, change: '0.3s' },
    { label: 'Ekonomi',       value: '62,000 HTG', positive: true },
  ];
  return (
    <div>
      <div style={kpiGrid}>{kpis.map((k, i) => <KPICard key={i} kpi={k} />)}</div>
      <BarChart title="Demann AI pa Sèvis" data={[
        { label: 'Matching', value: 3200, max: 4000 }, { label: 'Rekòmandasyon', value: 2100, max: 4000 },
        { label: 'Tradiksyon', value: 1500, max: 4000 }, { label: 'Pri AI', value: 980, max: 4000 },
        { label: 'Fwòd AI', value: 652, max: 4000 },
      ]} />
    </div>
  );
}

function RevenuePane() {
  const kpis: KPI[] = [
    { label: 'GMV Total',     value: '2.4M HTG', positive: true, change: '21%' },
    { label: 'Komisyon',      value: '240K HTG', positive: true, change: '21%' },
    { label: 'Abonnements',   value: '18,000 HTG', positive: true, change: '5%' },
    { label: 'Frais Platfòm', value: '42,000 HTG', positive: true, change: '8%' },
  ];
  return (
    <div>
      <div style={kpiGrid}>{kpis.map((k, i) => <KPICard key={i} kpi={k} />)}</div>
      <BarChart title="Revni pa Sèvis" data={[
        { label: 'Travay',    value: 98_000, max: 120_000 }, { label: 'Mache',  value: 72_000, max: 120_000 },
        { label: 'Pèman',     value: 42_000, max: 120_000 }, { label: 'Pòfèy', value: 18_000, max: 120_000 },
        { label: 'AI',        value: 10_000, max: 120_000 },
      ]} />
    </div>
  );
}

function GrowthPane() {
  return (
    <div>
      <div style={kpiGrid}>
        {[
          { label: 'Nouvo Itilizatè (7j)', value: '1,247', positive: true, change: '18%' },
          { label: 'Taux Rétention',        value: '73%',   positive: true, change: '4%' },
          { label: 'Konvèsyon',             value: '12.4%', positive: true, change: '1.2%' },
          { label: 'Viral Coeff.',          value: '1.34',  positive: true, change: '0.12' },
        ].map((k, i) => <KPICard key={i} kpi={k} />)}
      </div>
      <BarChart title="Nouvo Itilizatè pa Semèn" data={[
        { label: 'S1', value: 312, max: 500 }, { label: 'S2', value: 289, max: 500 },
        { label: 'S3', value: 367, max: 500 }, { label: 'S4', value: 421, max: 500 },
        { label: 'S5', value: 489, max: 500 }, { label: 'S6', value: 398, max: 500 },
      ]} />
    </div>
  );
}

function EngagementPane() {
  return (
    <div>
      <div style={kpiGrid}>
        {[
          { label: 'DAU',           value: '4,821', positive: true,  change: '9%' },
          { label: 'Session Mwayen', value: '8m 42s', positive: true, change: '1m' },
          { label: 'Paj/Sesyon',    value: '5.4',   positive: true,  change: '0.6' },
          { label: 'Bounce Rate',   value: '32%',   positive: false, change: '3%' },
        ].map((k, i) => <KPICard key={i} kpi={k} />)}
      </div>
      <BarChart title="Aksyon pa Jounen" data={[
        { label: 'Rechèch', value: 12400, max: 20000 }, { label: 'Pwofil', value: 8900, max: 20000 },
        { label: 'Chat',    value: 7200,  max: 20000 }, { label: 'Pèman',  value: 3400, max: 20000 },
        { label: 'Kreyasyon', value: 1800, max: 20000 },
      ]} />
    </div>
  );
}

function FraudPane() {
  return (
    <div>
      <div style={kpiGrid}>
        {[
          { label: 'Alèt Fwòd',     value: '14',    positive: false, change: '3' },
          { label: 'Bloke Otomatik', value: '9',     positive: true,  change: '2' },
          { label: 'Taux Fwòd',     value: '0.08%', positive: true,  change: '0.02%' },
          { label: 'Ekonomi Fwòd',  value: '95K HTG', positive: true },
        ].map((k, i) => <KPICard key={i} kpi={k} />)}
      </div>
      <div style={{ background: '#0F172A', borderRadius: 12, padding: 20, border: '1px solid #7F1D1D', marginTop: 16 }}>
        <p style={{ color: '#FCA5A5', fontWeight: 700, marginBottom: 12 }}>Dènye alèt fwòd</p>
        {['IP susp. 192.168.x.x', 'Multiple koneksyon echèk', 'Chanjman rapid kont ban'].map((a, i) => (
          <div key={i} style={{ color: '#94A3B8', fontSize: 13, padding: '6px 0', borderBottom: '1px solid #1E293B' }}>⚠ {a}</div>
        ))}
      </div>
    </div>
  );
}

function PerformancePane() {
  return (
    <div>
      <div style={kpiGrid}>
        {[
          { label: 'Latans API',   value: '142ms', positive: true,  change: '12ms' },
          { label: 'Uptime',       value: '99.97%', positive: true },
          { label: 'Erreur Rate',  value: '0.12%', positive: true,  change: '0.04%' },
          { label: 'P99 Latans',   value: '340ms', positive: true,  change: '60ms' },
        ].map((k, i) => <KPICard key={i} kpi={k} />)}
      </div>
      <BarChart title="Latans Endpoint (ms)" data={[
        { label: '/auth/login',     value: 89,  max: 300 }, { label: '/jobs/search',   value: 145, max: 300 },
        { label: '/payments/init',  value: 210, max: 300 }, { label: '/ai/match',      value: 278, max: 300 },
        { label: '/wallet/balance', value: 62,  max: 300 },
      ]} />
    </div>
  );
}

function SystemHealthPane() {
  const { data, loading, error } = useAnalytics('/admin/os/health');
  const services: Array<{ name: string; status: string }> = (data?.['services'] as never[]) ?? [
    { name: 'Database',  status: 'healthy' }, { name: 'Supabase', status: 'healthy' },
    { name: 'Storage',   status: 'healthy' }, { name: 'Email',    status: 'healthy' },
    { name: 'SMS',       status: 'healthy' }, { name: 'AI',       status: 'degraded' },
  ];
  const statusColor: Record<string, string> = { healthy: '#4ADE80', degraded: '#FACC15', down: '#F87171' };
  return (
    <div>
      {(loading || error) ? <LoadState loading={loading} error={error} /> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {services.map((s, i) => (
          <div key={i} style={{ background: '#0F172A', borderRadius: 10, padding: 16, border: `1px solid ${statusColor[s.status] ?? '#1E293B'}33` }}>
            <p style={{ color: '#94A3B8', fontSize: 12, margin: '0 0 8px', fontWeight: 700, textTransform: 'uppercase' }}>{s.name}</p>
            <p style={{ color: statusColor[s.status] ?? '#64748B', fontWeight: 800, margin: 0 }}>{s.status.toUpperCase()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const kpiGrid: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 };

// ─── Main Analytics page ────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('business');

  const renderPane = () => {
    switch (tab) {
      case 'business':    return <BusinessPane />;
      case 'marketplace': return <MarketplacePane />;
      case 'financial':   return <FinancialPane />;
      case 'ai':          return <AIAnalyticsPane />;
      case 'revenue':     return <RevenuePane />;
      case 'growth':      return <GrowthPane />;
      case 'engagement':  return <EngagementPane />;
      case 'fraud':       return <FraudPane />;
      case 'performance': return <PerformancePane />;
      case 'health':      return <SystemHealthPane />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050B18', fontFamily: 'system-ui, sans-serif', padding: '24px 20px' }}>
      <h1 style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 22, marginBottom: 20 }}>Analytics</h1>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: tab === t ? '#FACC15' : '#1E293B',
            color: tab === t ? '#020617' : '#94A3B8',
            fontWeight: 700, fontSize: 12, transition: 'all .15s',
          }}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>
      {renderPane()}
    </div>
  );
}
