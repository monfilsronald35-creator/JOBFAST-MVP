import React, {
  useState, useCallback, useMemo, memo, Suspense, lazy,
  useDeferredValue, startTransition,
} from 'react';
import { motion } from 'framer-motion';
import {
  Bell, Shield, Globe2, Layers, UserCircle, BarChart3,
  FileText, DollarSign, Users, Database,
} from 'lucide-react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import API from '../../api/axios';

// ─── Lazy tabs ────────────────────────────────────────────────
const AnalyticsTabLazy     = lazy(() => import('./AnalyticsTab'));
const MapsTabLazy          = lazy(() => import('./EnterpriseMapsTab'));
const FinanceTabLazy       = lazy(() => import('./FinanceModuleTab'));
const HRTabLazy            = lazy(() => import('./HRModuleTab'));
const CRMTabLazy           = lazy(() => import('./CRMModuleTab'));
const DocumentsTabLazy     = lazy(() => import('./DocumentCenterTab'));
const AuditTabLazy         = lazy(() => import('./AuditTrailTab'));
const NotificationsTabLazy = lazy(() => import('./NotificationsTab'));
const WorkflowTabLazy      = lazy(() => import('./WorkflowTab'));
const ReportsTabLazy       = lazy(() => import('./ReportsTab'));
const AITabLazy            = lazy(() => import('./AISuiteTab'));

// ─── Types ────────────────────────────────────────────────────
interface UserProp {
  role?: string;
  countryId?: string;
  branchId?: string;
  tenantId?: string;
  enterpriseTenantId?: string;
  departments?: string[];
  totalUsers?: number;
  revenueMTD?: number | string;
  activeProjects?: number;
  countriesCount?: number;
  [key: string]: unknown;
}

interface TenantScope {
  tenantId?: string;
  countryId?: string;
  branchId?: string;
}

interface PermissionContextValue {
  role: string;
  attrs: { countryId?: string; branchId?: string; tenantId?: string; departments: string[] };
  can: (resource: string, context?: { branchId?: string }) => boolean;
}

interface KPIItem { key: string; label: string; value: number; unit: string; color: string; }
interface NotificationItem { text?: string; unread?: boolean; priority?: string; department?: string; }

// ─── Permission Engine ────────────────────────────────────────
const PermissionContext = React.createContext<PermissionContextValue | null>(null);

const ROLE_MATRIX: Record<string, Record<string, boolean>> = {
  CEO:       { finance: true,  hiring: true,  hr: true,  crm: true,  audit: true,  map: true  },
  HR:        { finance: false, hiring: true,  hr: true,  crm: false, audit: true,  map: true  },
  Finance:   { finance: true,  hiring: false, hr: true,  crm: false, audit: true,  map: false },
  Manager:   { finance: false, hiring: true,  hr: true,  crm: true,  audit: true,  map: true  },
  Recruiter: { finance: false, hiring: true,  hr: false, crm: false, audit: false, map: false },
};

function PermissionProvider({ user, children }: { user?: UserProp; children: React.ReactNode }) {
  const role  = user?.role ?? 'Manager';
  const attrs = {
    countryId:   user?.countryId,
    branchId:    user?.branchId,
    tenantId:    user?.tenantId ?? user?.enterpriseTenantId,
    departments: (user?.departments as string[]) ?? [],
  };

  const can = useCallback((resource: string, context?: { branchId?: string }) => {
    const matrix  = ROLE_MATRIX[role] ?? {};
    const allowed = !!matrix[resource];
    if (!allowed) return false;
    if (context?.branchId && attrs.branchId && context.branchId !== attrs.branchId) return false;
    return true;
  }, [role, attrs]);

  const value = useMemo<PermissionContextValue>(() => ({ role, attrs, can }), [role, attrs, can]);
  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

function usePermission(): PermissionContextValue {
  const ctx = React.useContext(PermissionContext);
  if (!ctx) throw new Error('usePermission must be used within PermissionProvider');
  return ctx;
}

// ─── Multi-tenant helpers ──────────────────────────────────────
function useTenantScope(user?: UserProp): TenantScope {
  return {
    tenantId:  user?.tenantId ?? user?.enterpriseTenantId,
    countryId: user?.countryId,
    branchId:  user?.branchId,
  };
}

function tenantQuery(path: string, scope: TenantScope) {
  return API.get(path, { params: { tenant_id: scope.tenantId, country_id: scope.countryId, branch_id: scope.branchId } });
}

// ─── KPI Engine ───────────────────────────────────────────────
function useKPIEngine(scope: TenantScope) {
  const { data } = useQuery({
    queryKey: ['kpi-engine', scope],
    queryFn: async () => {
      const res = await tenantQuery('/enterprise/kpi-grid', scope);
      return res.data as { layout?: string; items?: KPIItem[] };
    },
    staleTime: 60_000,
  });
  return data ?? { layout: 'CEO', items: [] as KPIItem[] };
}

const KPIGrid = memo(function KPIGrid({ tenantId, layout, scope }: { tenantId?: string; layout?: string; scope?: TenantScope }) {
  const engineScope = scope ?? { tenantId };
  const kpiData = useKPIEngine(engineScope);

  const items: KPIItem[] = (kpiData.items?.length ? kpiData.items : [
    { key: 'revenue',   label: 'Revenue',       value: 0, unit: '$', color: 'purple' },
    { key: 'margin',    label: 'Margin',         value: 0, unit: '%', color: 'green'  },
    { key: 'profit',    label: 'Profit',         value: 0, unit: '$', color: 'indigo' },
    { key: 'payroll',   label: 'Payroll',        value: 0, unit: '$', color: 'amber'  },
    { key: 'growth',    label: 'Growth',         value: 0, unit: '%', color: 'blue'   },
    { key: 'retention', label: 'Retention',      value: 0, unit: '%', color: 'green'  },
    { key: 'customer',  label: 'Customer Sat.',  value: 0, unit: '%', color: 'blue'   },
    { key: 'projects',  label: 'Projects',       value: 0, unit: '',  color: 'purple' },
    { key: 'inventory', label: 'Inventory',      value: 0, unit: '',  color: 'amber'  },
    { key: 'risk',      label: 'Risk Index',     value: 0, unit: '',  color: 'rose'   },
    { key: 'aiScore',   label: 'AI Score',       value: 0, unit: '%', color: 'indigo' },
  ]);

  return (
    <Section icon={<Globe2 className="w-4 h-4" />} title={`Global KPIs — Layout: ${layout ?? kpiData.layout ?? 'CEO'}`}>
      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => (
          <MiniStat key={it.key}
            value={`${it.unit === '$' ? '$' : ''}${it.value}${it.unit === '%' ? '%' : ''}`}
            label={it.label} color={it.color} />
        ))}
      </div>
    </Section>
  );
});

// ─── AI Copilot ───────────────────────────────────────────────
interface ChatMessage { role: 'system' | 'user' | 'assistant'; text: string; }

const AICopilot = memo(function AICopilot({ user }: { user?: UserProp }) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', text: 'AI Enterprise Copilot: executive analytics, board report, RCA, predictive & recommendations.' },
  ]);
  const scope = useTenantScope(user);
  const deferredPrompt = useDeferredValue(prompt);

  const sendPrompt = async () => {
    if (!prompt.trim()) return;
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: prompt }];
    setMessages(newMessages);
    setPrompt('');
    startTransition(async () => {
      try {
        const res = await API.post('/enterprise/ai-query', { prompt: deferredPrompt, scope });
        const reply = (res.data as Record<string, string>)?.answer ?? 'AI response from backend.';
        setMessages([...newMessages, { role: 'assistant', text: reply }]);
      } catch {
        setMessages([...newMessages, { role: 'assistant', text: 'AI stub: backend ap dwe reponn ak executive summary, board report, RCA, predictive analytics, recommendations.' }]);
      }
    });
  };

  return (
    <Section icon={<UserCircle className="w-4 h-4" />} title="AI Executive Copilot">
      <div className="h-40 bg-slate-900/80 rounded-xl border border-slate-800/70 mb-3 p-2 overflow-y-auto text-[10px] text-slate-200">
        {messages.map((m, idx) => (
          <p key={idx} className={`mb-1 ${m.role === 'user' ? 'text-indigo-300' : m.role === 'assistant' ? 'text-emerald-300' : 'text-slate-400'}`}>
            {m.role === 'user' ? 'CEO: ' : m.role === 'assistant' ? 'AI: ' : ''}{m.text}
          </p>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void sendPrompt(); }}
          placeholder={`"Why revenue dropped?" / "Generate board report." / "Predict next month hiring."`}
          className="flex-1 px-3 py-1.5 bg-slate-900 rounded-lg text-xs text-white placeholder-slate-500 outline-none" />
        <button onClick={() => void sendPrompt()} className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-bold">Ask AI</button>
      </div>
    </Section>
  );
});

// ─── Atoms ────────────────────────────────────────────────────
const Shimmer = memo(function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-800/70 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-pulse opacity-70" />
    </div>
  );
});

const Section = memo(function Section({ icon, title, action, children }: { icon?: React.ReactNode; title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.section className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.95)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 20 }}>
      {(title ?? action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">{icon && <span aria-hidden="true">{icon}</span>}{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </motion.section>
  );
});

const COLOR_MAP: Record<string, string> = {
  indigo: 'text-indigo-400', amber: 'text-amber-400', green: 'text-emerald-400',
  rose:   'text-rose-400',   blue:  'text-sky-400',   purple: 'text-purple-400',
};

const MiniStat = memo(function MiniStat({ value, label, color = 'indigo' }: { value: string | number; label: string; color?: string }) {
  return (
    <motion.div className="bg-[#0b1220] rounded-xl border border-slate-800 px-3 py-3 text-center shadow-[0_18px_50px_rgba(15,23,42,0.9)]" whileHover={{ y: -2 }}>
      <div className={`text-xl font-bold ${COLOR_MAP[color] ?? COLOR_MAP['indigo']!}`}>{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
    </motion.div>
  );
});

// ─── Notification Center ──────────────────────────────────────
const GlobalNotificationCenter = memo(function GlobalNotificationCenter({ scope }: { scope: TenantScope }) {
  const { data } = useQuery({
    queryKey: ['notifications', scope],
    queryFn: async () => {
      const res = await tenantQuery('/enterprise/notifications', scope);
      return res.data as { items?: NotificationItem[]; unreadCount?: number };
    },
    refetchInterval: 5_000,
  });

  const items: NotificationItem[] = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? items.filter((i) => i.unread).length;

  return (
    <Section icon={<Bell className="w-4 h-4" />} title="Global Notification Center">
      <div className="flex items-center justify-between mb-2 text-[10px] text-slate-300">
        <span>Unread: {unreadCount}</span>
        <div className="flex gap-2">
          {['Filter', 'Archive', 'Pin'].map((label) => (
            <button key={label} type="button" className="px-2 py-0.5 bg-slate-800 rounded text-slate-200">{label}</button>
          ))}
        </div>
      </div>
      <ul className="h-32 overflow-y-auto space-y-1">
        {items.map((n, i) => (
          <li key={i} className="flex justify-between items-center px-2 py-1">
            <span className={`text-[10px] ${n.unread ? 'text-slate-50' : 'text-slate-400'}`}>{n.text}</span>
            <span className="text-[9px] text-slate-500 uppercase">{n.priority} · {n.department ?? 'Global'}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
});

// ─── Workflow Engine ──────────────────────────────────────────
const WorkflowEngine = memo(function WorkflowEngine({ scope }: { scope: TenantScope }) {
  const { data } = useQuery({
    queryKey: ['workflow', scope],
    queryFn: async () => {
      const res = await tenantQuery('/enterprise/workflow', scope);
      return res.data as { steps?: string[] };
    },
  });

  const steps: string[] = data?.steps ?? ['CEO', 'Finance', 'Legal', 'HR', 'Completed'];

  return (
    <Section icon={<Layers className="w-4 h-4" />} title="Approval Workflow Engine">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700">
              <p className="text-[10px] font-bold text-slate-200">{s}</p>
            </div>
            {i < steps.length - 1 && <span className="text-slate-600 text-[10px]">↓</span>}
          </React.Fragment>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 mt-2">Conditions, approvers, reject, comment, history, escalation, timeout, reminder, digital signature.</p>
    </Section>
  );
});

// ─── Module stubs ──────────────────────────────────────────────
const HROverview       = memo(function HROverview({ scope: _scope }: { scope: TenantScope }) {
  return <Section icon={<Users className="w-4 h-4" />} title="HR Module"><p className="text-[10px] text-slate-300 mb-2">Attendance, leave, payroll, performance, org chart.</p><Shimmer className="h-28" /></Section>;
});
const FinanceOverview  = memo(function FinanceOverview({ scope: _scope }: { scope: TenantScope }) {
  return <Section icon={<DollarSign className="w-4 h-4" />} title="Finance Module"><p className="text-[10px] text-slate-300 mb-2">Invoices, budget, forecast, multi-currency, cashflow.</p><Shimmer className="h-28" /></Section>;
});
const CRMOverview      = memo(function CRMOverview({ scope: _scope }: { scope: TenantScope }) {
  return <Section icon={<Users className="w-4 h-4" />} title="CRM Module"><p className="text-[10px] text-slate-300 mb-2">Leads, clients, pipeline, deals, marketing campaigns.</p><Shimmer className="h-28" /></Section>;
});
const DocumentCenterOverview = memo(function DocumentCenterOverview({ scope: _scope }: { scope: TenantScope }) {
  return <Section icon={<FileText className="w-4 h-4" />} title="Document Center"><p className="text-[10px] text-slate-300 mb-2">Contracts, invoices, versioning, OCR, digital signature.</p><Shimmer className="h-28" /></Section>;
});

// ─── Activity / Audit stubs ────────────────────────────────────
const ActivityFeed = memo(function ActivityFeed() {
  return <Section icon={<BarChart3 className="w-4 h-4" />} title="Activity Feed"><Shimmer className="h-32" /></Section>;
});
const AuditTrailPreview = memo(function AuditTrailPreview() {
  return <Section icon={<Shield className="w-4 h-4" />} title="Audit Trail"><Shimmer className="h-32" /></Section>;
});

// ─── Dashboard layout hook ─────────────────────────────────────
function useDashboardLayout(_user?: UserProp) {
  const [layout, setLayout]   = useState('CEO');
  const [widgets, setWidgets] = useState(['kpi-grid','ai-copilot','activity','notifications','workflow','hr','finance','crm','documents']);
  return { layout, widgets, setLayout, setWidgets };
}

// ─── QueryClient ──────────────────────────────────────────────
const queryClient = new QueryClient();

// ─── Main component ───────────────────────────────────────────
export default function EnterpriseDashboard({ user }: { user?: UserProp }) {
  const scope = useTenantScope(user);
  const { can } = usePermission();
  const { layout } = useDashboardLayout(user);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview',       label: 'Overview',       icon: <Globe2 className="w-3 h-3" /> },
    { id: 'analytics',      label: 'Analytics',      icon: <BarChart3 className="w-3 h-3" /> },
    { id: 'reports',        label: 'Reports',        icon: <FileText className="w-3 h-3" /> },
    { id: 'maps',           label: 'Maps',           icon: <Globe2 className="w-3 h-3" /> },
    { id: 'ai',             label: 'AI Suite',       icon: <Database className="w-3 h-3" /> },
    { id: 'finance',        label: 'Finance',        icon: <DollarSign className="w-3 h-3" /> },
    { id: 'hr',             label: 'HR',             icon: <Users className="w-3 h-3" /> },
    { id: 'crm',            label: 'CRM',            icon: <Users className="w-3 h-3" /> },
    { id: 'documents',      label: 'Documents',      icon: <FileText className="w-3 h-3" /> },
    { id: 'audit',          label: 'Audit',          icon: <Shield className="w-3 h-3" /> },
    { id: 'notifications',  label: 'Notifications',  icon: <Bell className="w-3 h-3" /> },
    { id: 'workflow',       label: 'Workflow',       icon: <Layers className="w-3 h-3" /> },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <PermissionProvider user={user}>
        <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-300">Enterprise Dashboard — {layout} Layout</span>
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold ${activeTab === t.id ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-400'}`}>
                {t.icon}<span>{t.label}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-4">
              <KPIGrid tenantId={scope.tenantId} layout={layout} scope={scope} />
              <AICopilot user={user} />
            </div>
            <div className="space-y-4">
              <Suspense fallback={<Shimmer className="h-40" />}>
                {activeTab === 'overview'       && <><ActivityFeed /><AuditTrailPreview /></>}
                {activeTab === 'analytics'      && <AnalyticsTabLazy user={user} />}
                {activeTab === 'reports'        && <ReportsTabLazy user={user} />}
                {activeTab === 'maps'           && can('map')     && <MapsTabLazy user={user} />}
                {activeTab === 'ai'             && <AITabLazy user={user} />}
                {activeTab === 'finance'        && can('finance') && <FinanceTabLazy user={user} />}
                {activeTab === 'hr'             && <HRTabLazy user={user} />}
                {activeTab === 'crm'            && <CRMTabLazy user={user} />}
                {activeTab === 'documents'      && <DocumentsTabLazy user={user} />}
                {activeTab === 'audit'          && <AuditTabLazy user={user} />}
                {activeTab === 'notifications'  && <NotificationsTabLazy user={user} />}
                {activeTab === 'workflow'       && <WorkflowTabLazy user={user} />}
              </Suspense>
            </div>
            <div className="space-y-4">
              <GlobalNotificationCenter scope={scope} />
              <WorkflowEngine scope={scope} />
              <HROverview scope={scope} />
              <FinanceOverview scope={scope} />
              <CRMOverview scope={scope} />
              <DocumentCenterOverview scope={scope} />
            </div>
          </div>
        </div>
      </PermissionProvider>
    </QueryClientProvider>
  );
}

// ─── Named exports ────────────────────────────────────────────
export const ENTERPRISE_TABS = [
  { id: 'overview',      icon: '🏠', label: 'Overview' },
  { id: 'analytics',     icon: '📊', label: 'Analytics' },
  { id: 'reports',       icon: '📄', label: 'Reports' },
  { id: 'maps',          icon: '🗺️', label: 'Maps' },
  { id: 'ai',            icon: '🤖', label: 'AI Suite' },
  { id: 'finance',       icon: '💰', label: 'Finance' },
  { id: 'hr',            icon: '👥', label: 'HR' },
  { id: 'crm',           icon: '🤝', label: 'CRM' },
  { id: 'documents',     icon: '📁', label: 'Documents' },
  { id: 'audit',         icon: '🔍', label: 'Audit' },
  { id: 'notifications', icon: '🔔', label: 'Notif.' },
  { id: 'workflow',      icon: '⚡', label: 'Workflow' },
];

export function EnterpriseOverviewSupplement({ user }: { user?: UserProp }) {
  const kpis = [
    { label: 'Total Users',     value: user?.totalUsers ?? 0 },
    { label: 'Revenue MTD',     value: user?.revenueMTD != null ? String(user.revenueMTD) : '—' },
    { label: 'Active Projects', value: user?.activeProjects ?? 0 },
    { label: 'Countries',       value: user?.countriesCount ?? 0 },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {kpis.map(({ label, value }) => (
        <div key={label} className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-lg font-black text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}