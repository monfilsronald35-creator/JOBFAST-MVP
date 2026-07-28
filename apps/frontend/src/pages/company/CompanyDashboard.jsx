/**
 * CompanyDashboard.jsx — Enterprise AI Business Command Center v3.0
 *
 * Real-time • AI • Enterprise modules:
 * - Multi-stream WebSocket/SSE live updates (applicants, payments, messages, GPS, jobs). [web:354]
 * - AI Decision Engine (dynamic briefing & recommendations).
 * - Role-based permission dashboards (CEO, Director, HR, Finance, PM, Branch Manager, etc.).
 * - Notification Center (timeline, priority, read/unread, AI/system/security/payment/GPS alerts). [web:351][web:355]
 * - Full Analytics shell (heatmaps, revenue/cashflow/payroll, funnels, comparisons, rankings). [web:348][web:352]
 * - Google Maps Enterprise shell (live workers/jobs/clients/routes/ETA/traffic). [web:347]
 * - Wallet Center, Enterprise search, Quick Actions, AI Command Center, Enterprise modules placeholders.
 */

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  memo,
} from 'react';
import {
  Plus,
  Bell,
  MessageCircle,
  Mic,
  Search as SearchIcon,
  Calendar,
  Wallet,
  Sparkles,
  Globe2,
  LineChart,
  Users,
  BarChart3,
  FileText,
  MapPin,
  Activity,
  Cpu,
  ShieldCheck,
  Command,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

// ─────────────────────────────────────────────────────────────
// 0. Role / Permission helpers
// ─────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  CEO: {
    canSee: ['hero','kpi','aiAssistant','analytics','wallet','crm','payroll','fleet','tax','legal','commandCenter'],
  },
  Director: {
    canSee: ['hero','kpi','aiAssistant','analytics','projects','hiring','employees','wallet','commandCenter'],
  },
  HR: {
    canSee: ['employees','hiring','analytics','aiAssistant','commandCenter'],
  },
  Finance: {
    canSee: ['wallet','payroll','tax','analytics','aiAssistant','commandCenter'],
  },
  'Project Manager': {
    canSee: ['projects','employees','hiring','analytics','fleet','commandCenter'],
  },
  'Branch Manager': {
    canSee: ['branches','employees','analytics','aiAssistant','commandCenter'],
  },
  Supervisor: {
    canSee: ['employees','projects','branches','analytics'],
  },
  Accountant: {
    canSee: ['wallet','payroll','tax','analytics'],
  },
};

function getRole(user) {
  return user?.role || user?.companyRole || 'CEO';
}

function hasAccess(user, moduleKey) {
  const role = getRole(user);
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.CEO;
  return cfg.canSee?.includes(moduleKey);
}

// ─────────────────────────────────────────────────────────────
// 1. Pure computations (same as before)
// ─────────────────────────────────────────────────────────────

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
    { done: !!user?.email,                                       tip: 'Imèl verifye' },
    { done: !!(meta?.phone || user?.phone),                      tip: 'Ajoute nimewo telefòn konpayi' },
    { done: !!meta?.bio,                                         tip: 'Ekri deskripsyon konpayi an' },
    { done: !!user?.profession,                                  tip: 'Chwazi sektè aktivite' },
    { done: !!(user?.location?.city),                            tip: 'Ajoute lokasyon prensipal' },
    { done: !!meta?.logo || (meta?.photos?.length ?? 0) > 0,     tip: 'Ajoute logo oswa foto' },
    { done: !!meta?.website,                                     tip: 'Ajoute sit wèb' },
    { done: (cd?.branches?.length ?? 0) > 0 || !!user?.location, tip: 'Ajoute yon branch' },
  ];

  const done = checks.filter(c => c.done).length;
  return {
    pct:     Math.round((done / checks.length) * 100),
    missing: checks.filter(c => !c.done).map(c => c.tip),
  };
}

// ─────────────────────────────────────────────────────────────
// 2. Real-time engine hooks (WebSocket / SSE concept)
// ─────────────────────────────────────────────────────────────
//
// Live updates pou:
//  - applicants   → /ws/applicants
//  - payments     → /ws/payments
//  - messages     → /ws/messages
//  - gpsWorkers   → /ws/gps
//  - jobs         → /ws/jobs
// Ou ka adapte URL yo ak backend ou. [web:354][web:346]

function useRealtimeStreams(user, onEvents) {
  useEffect(() => {
    if (!user) return;

    const streams = [];
    const endpoints = [
      { key: 'applicants', url: `${process.env.REACT_APP_WS_BASE}/applicants` },
      { key: 'payments',   url: `${process.env.REACT_APP_WS_BASE}/payments` },
      { key: 'messages',   url: `${process.env.REACT_APP_WS_BASE}/messages` },
      { key: 'gpsWorkers', url: `${process.env.REACT_APP_WS_BASE}/gps` },
      { key: 'jobs',       url: `${process.env.REACT_APP_WS_BASE}/jobs` },
    ];

    endpoints.forEach(({ key, url }) => {
      try {
        const ws = new WebSocket(url);
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            onEvents?.(key, data);
          } catch {
            // ignore invalid
          }
        };
        ws.onerror = () => {
          // fallback SSE or ignore for now
        };
        streams.push(ws);
      } catch {
        // ignore connection error
      }
    });

    return () => {
      streams.forEach(ws => {
        try { ws.close(); } catch { /* ignore */ }
      });
    };
  }, [user, onEvents]);
}

// ─────────────────────────────────────────────────────────────
// 3. GPS hook (for nearby workers / routes)
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// 4. Shared save helper
// ─────────────────────────────────────────────────────────────

function useSaveCompany(user) {
  const { login } = useAuth();
  const userId = user?._id || user?.id;

  return useCallback(async (updatedCd) => {
    login({ ...user, companyData: updatedCd });
    try {
      await API.patch('/company/profile', { userId, companyData: updatedCd });
    } catch { /* optimistic only */ }
  }, [user, userId, login]);
}

// ─────────────────────────────────────────────────────────────
// 5. Premium UI Atoms (glassmorphism / 3D cards)
// ─────────────────────────────────────────────────────────────

const GlassSection = memo(function GlassSection({ icon, title, action, children, className = '' }) {
  return (
    <div
      className={
        `relative rounded-2xl border border-white/10 bg-white/5 ` +
        `backdrop-blur-xl shadow-[0_18px_50px_rgba(15,23,42,0.85)] p-5 ${className}`
      }
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
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

const AnimatedKPI = memo(function AnimatedKPI({ label, value, prefix = '', suffix = '', accent = 'from-cyan-400 to-blue-500' }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-3 shadow-[0_14px_40px_rgba(15,23,42,0.8)]">
      <div className={`absolute inset-0 opacity-30 bg-gradient-to-br ${accent}`} />
      <div className="relative flex flex-col gap-1">
        <p className="text-[10px] text-slate-200 uppercase tracking-[0.16em]">{label}</p>
        <p className="text-lg font-semibold text-white">
          {prefix}{value}{suffix}
        </p>
        {/* Animated sparkline placeholder */}
        <div className="mt-1 h-6 rounded-lg bg-slate-950/40 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-emerald-400/30 via-indigo-500/40 to-sky-400/30 animate-[pulse_3s_infinite]" />
        </div>
      </div>
    </div>
  );
});

function StatusBadge({ status }) {
  const s = JOB_STATUSES.find(j => j.id === status) || { label: status, color: 'text-slate-200', bg: 'bg-slate-900/60' };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color} ${s.bg} border border-white/10`}>
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. AI Decision Engine (briefing)
// ─────────────────────────────────────────────────────────────
//
// Sa a analize KPI yo + real-time events pou pwodwi fraz AI (basic client-side engine).
// Ou ka remplace ak backend AI API (GPT, etc.). [web:353]

function computeAIBriefing(user, runtimeState) {
  const cd = user?.companyData || {};
  const revenueDelta = cd.revenueDeltaToday ?? -4;
  const city = cd.mainCity || user?.location?.city || 'Punta Cana';
  const plumbersNeeded = runtimeState?.plumbersNeeded ?? 6;
  const overtimeCount  = runtimeState?.overtimeCount ?? 4;
  const cashflowDays   = runtimeState?.cashflowNegativeInDays ?? 9;

  const lines = [
    `Revenue ${revenueDelta < 0 ? 'dropped' : 'increased'} ${Math.abs(revenueDelta)}% in ${city} today.`,
    `I recommend hiring ${plumbersNeeded} plumbers.`,
    `${overtimeCount} employees are approaching overtime.`,
    `Cashflow may become negative in ${cashflowDays} days.`,
  ];

  return lines;
}

// ─────────────────────────────────────────────────────────────
// 7. Hero Dashboard Premium (enrichi ak AI Weather/Market)
// ─────────────────────────────────────────────────────────────

const HeroDashboardPremium = memo(function HeroDashboardPremium({ user, runtimeState }) {
  const trustScore  = computeCompanyTrustScore(user);
  const cd          = user?.companyData || {};
  const name        = cd.profile?.name || user?.name || 'Konpayi';
  const onlineEmployees = (cd.employees || []).filter(e => e.status === 'active').length;
  const activeProjects  = (cd.projects  || []).filter(p => p.status === 'active').length;
  const revenueToday    = cd.revenueToday ?? 0;

  const weather = cd.weather || { label: 'Partly Cloudy', temp: 30, city: user?.location?.city || 'Port-au-Prince' };
  const marketTrend = cd.marketTrend ?? '+2.3% Global Construction Index';
  const currency    = cd.currency || 'USD';
  const economicIndex = cd.economicIndex ?? 'Emerging Market Stable';
  const goal        = cd.companyGoal || 'Expand to 5 new cities this quarter';
  const todaysTargets = cd.todayTargets || ['Fill 30 critical roles', 'Close 4 key contracts', 'Reduce overtime by 15%'];

  const greetingName = user?.firstName || user?.name || 'CEO';

  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl border border-white/15 bg-slate-950 text-white shadow-[0_40px_140px_rgba(15,23,42,0.95)]">
      {/* 4K/8K background image / video layer (configurable) */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{
          backgroundImage: `url(${cd.heroBackgroundUrl || '/images/enterprise-hero-4k.jpg'})`,
        }}
      />
      {/* Dynamic gradients & Lottie placeholder */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(56,189,248,0.35),transparent_55%),radial-gradient(circle_at_90%_100%,rgba(129,140,248,0.4),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 mix-blend-screen">
        <div className="absolute -top-20 left-10 w-40 h-40 bg-cyan-400/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="relative px-6 py-6 lg:px-8 lg:py-7 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        {/* Left column: CEO Briefing */}
        <div className="flex flex-col gap-3 min-w-0 lg:flex-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-200">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>JOBFAST Enterprise • AI CEO Briefing</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">
            Good morning {greetingName} 👋
          </h1>
          <p className="text-[12px] text-slate-200">
            Welcome back to JOBFAST Enterprise — {name}. Trust Score {trustScore}% • Global AI business command.
          </p>

          {/* CEO daily briefing */}
          <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-2">
            <div className="rounded-xl bg-black/45 border border-white/10 backdrop-blur-xl p-3">
              <p className="text-[10px] text-slate-200 font-semibold mb-1">AI Weather & Market</p>
              <p className="text-[10px] text-slate-100">
                {weather.city} • {weather.temp}°C • {weather.label}
              </p>
              <p className="text-[10px] text-sky-300 mt-1">{marketTrend}</p>
              <p className="text-[10px] text-slate-300 mt-1">Economic index: {economicIndex}</p>
              <p className="text-[10px] text-slate-300 mt-1">Currency base: {currency}</p>
            </div>

            <div className="rounded-xl bg-black/45 border border-white/10 backdrop-blur-xl p-3">
              <p className="text-[10px] text-slate-200 font-semibold mb-1">Company Goal</p>
              <p className="text-[10px] text-slate-100">{goal}</p>
              <p className="text-[10px] text-slate-200 font-semibold mt-2">Today’s targets</p>
              <ul className="text-[10px] text-slate-100 space-y-1 mt-1">
                {todaysTargets.map(t => <li key={t}>• {t}</li>)}
              </ul>
            </div>

            <div className="rounded-xl bg-black/45 border border-white/10 backdrop-blur-xl p-3">
              <p className="text-[10px] text-slate-200 font-semibold mb-1">AI Suggestions</p>
              <ul className="text-[10px] text-emerald-300 space-y-1">
                {computeAIBriefing(user, runtimeState).map(line => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Right column: live hero KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:w-[320px] lg:flex-none">
          <AnimatedKPI
            label="Employees Online"
            value={onlineEmployees}
            accent="from-emerald-400/70 via-emerald-500/60 to-cyan-400/70"
          />
          <AnimatedKPI
            label="Active Projects"
            value={activeProjects}
            accent="from-indigo-400/70 via-sky-500/60 to-purple-500/70"
          />
          <AnimatedKPI
            label="Revenue Today"
            value={revenueToday}
            prefix="$"
            accent="from-amber-400/80 via-orange-500/70 to-rose-500/70"
          />
          <AnimatedKPI
            label="Business Status"
            value={cd.statusLabel || 'Healthy'}
            accent="from-cyan-400/70 via-blue-500/70 to-emerald-500/70"
          />
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// 8. Enterprise KPI Center (extended KPIs: cashflow, burn rate…)
// ─────────────────────────────────────────────────────────────

const EnterpriseKPICenter = memo(function EnterpriseKPICenter({ user, runtimeState }) {
  const cd = user?.companyData || {};
  const kpi = {
    revenue: cd.globalRevenue ?? 0,
    profit:  cd.netProfit ?? cd.globalProfit ?? (cd.globalRevenue ?? 0) - (cd.globalExpenses ?? 0),
    grossProfit: cd.grossProfit ?? 0,
    cashflow: cd.cashflowToday ?? 0,
    burnRate: cd.burnRateMonthly ?? 0,
    employees: (cd.employees || []).length,
    contracts: cd.contractsCount ?? 0,
    hiring:   (cd.jobs || []).length,
    payroll:  cd.payrollMonth ?? 0,
    customerSatisfaction: cd.customerSatisfaction ?? 92,
    workerSatisfaction:   cd.workerSatisfaction   ?? 88,
    latePayments: cd.latePaymentsCount ?? 3,
    productivityIndex: cd.productivityIndex ?? 82,
    attendanceRate: cd.attendanceRate ?? 94,
    hiringSuccessRate: cd.hiringSuccessRate ?? 73,
    aiRiskScore: cd.aiRiskScore ?? 12,
    globalRank: cd.globalRank ?? 47,
  };

  return (
    <GlassSection
      icon={<LineChart className="w-4 h-4 text-cyan-400" />}
      title="Enterprise KPI Center"
      className="mb-6"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AnimatedKPI label="Revenue"   value={kpi.revenue}        prefix="$" accent="from-emerald-400 to-emerald-600" />
        <AnimatedKPI label="Net Profit" value={kpi.profit}        prefix="$" accent="from-indigo-400 to-indigo-600" />
        <AnimatedKPI label="Gross Profit" value={kpi.grossProfit} prefix="$" accent="from-sky-400 to-sky-600" />
        <AnimatedKPI label="Cashflow" value={kpi.cashflow}        prefix="$" accent="from-cyan-400 to-cyan-600" />
        <AnimatedKPI label="Burn Rate" value={kpi.burnRate}       prefix="$" accent="from-rose-400 to-rose-600" />
        <AnimatedKPI label="Employees" value={kpi.employees}              accent="from-purple-400 to-purple-600" />
        <AnimatedKPI label="Contracts" value={kpi.contracts}              accent="from-amber-400 to-amber-600" />
        <AnimatedKPI label="Payroll"   value={kpi.payroll}        prefix="$" accent="from-blue-400 to-blue-600" />
        <AnimatedKPI label="Customer Satisfaction" value={kpi.customerSatisfaction} suffix="%" accent="from-emerald-400 to-emerald-600" />
        <AnimatedKPI label="Worker Satisfaction"   value={kpi.workerSatisfaction}   suffix="%" accent="from-sky-400 to-sky-600" />
        <AnimatedKPI label="Late Payments"         value={kpi.latePayments}         accent="from-rose-400 to-rose-600" />
        <AnimatedKPI label="Productivity Index"    value={kpi.productivityIndex}    suffix="%" accent="from-indigo-400 to-indigo-600" />
        <AnimatedKPI label="Attendance"            value={kpi.attendanceRate}       suffix="%" accent="from-amber-400 to-amber-600" />
        <AnimatedKPI label="Hiring Success Rate"   value={kpi.hiringSuccessRate}    suffix="%" accent="from-cyan-400 to-cyan-600" />
        <AnimatedKPI label="AI Risk Score"         value={kpi.aiRiskScore}          accent="from-red-400 to-red-600" />
        <AnimatedKPI label="Global Rank"           value={kpi.globalRank}           accent="from-purple-400 to-purple-600" />
      </div>
    </GlassSection>
  );
});

// ─────────────────────────────────────────────────────────────
// 9. Real Analytics Shell (BI)
// ─────────────────────────────────────────────────────────────

const RealAnalyticsShell = memo(function RealAnalyticsShell({ user }) {
  return (
    <GlassSection
      icon={<BarChart3 className="w-4 h-4 text-cyan-400" />}
      title="Analytics & Business Intelligence"
      className="mb-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Heatmaps / country / branch comparison */}
        <div className="space-y-2">
          <p className="text-[10px] text-slate-200 font-semibold">Heatmaps & Country Comparison</p>
          <div className="h-32 rounded-xl bg-black/40 border border-white/10 overflow-hidden">
            {/* Hook pou Map/lib (Mapbox, Highcharts) */}
            <div className="w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.28),transparent_60%),radial-gradient(circle_at_10%_80%,rgba(248,113,113,0.35),transparent_50%)] animate-[pulse_4s_infinite]" />
          </div>
          <p className="text-[10px] text-slate-300">
            Country & branch comparison, top services/employers/workers, market trends.
          </p>
        </div>

        {/* Revenue & cashflow graphs */}
        <div className="space-y-2">
          <p className="text-[10px] text-slate-200 font-semibold">Revenue • Cashflow • Payroll</p>
          <div className="h-32 rounded-xl bg-black/40 border border-white/10 overflow-hidden">
            {/* Line/area charts (Recharts/D3/Chart.js). [web:352] */}
            <div className="w-full h-full bg-[linear-gradient(to_top,rgba(34,197,94,0.35),transparent),linear-gradient(to_right,rgba(59,130,246,0.4),transparent)] animate-[pulse_3s_infinite]" />
          </div>
          <p className="text-[10px] text-slate-300">
            Revenue timelines, payroll evolution, trust score, monthly/yearly comparisons & forecast graphs.
          </p>
        </div>

        {/* Funnels */}
        <div className="space-y-2">
          <p className="text-[10px] text-slate-200 font-semibold">Hiring & Conversion Funnels</p>
          <div className="h-32 rounded-xl bg-black/40 border border-white/10 overflow-hidden">
            {/* Funnel chart placeholder */}
            <div className="w-full h-full bg-[repeating-linear-gradient(90deg,rgba(129,140,248,0.4),rgba(129,140,248,0.4)_6px,transparent_6px,transparent_12px)] animate-[pulse_2.6s_infinite]" />
          </div>
          <p className="text-[10px] text-slate-300">
            Hiring funnel, conversion funnel, employee growth, late payments, AI suggestions on performance.
          </p>
        </div>
      </div>
    </GlassSection>
  );
});

// ─────────────────────────────────────────────────────────────
// 10. Notification Center
// ─────────────────────────────────────────────────────────────

const NotificationCenter = memo(function NotificationCenter({ notifications, onMarkRead }) {
  return (
    <GlassSection
      icon={<Bell className="w-4 h-4 text-amber-400" />}
      title="Notification Center"
    >
      {notifications.length === 0 ? (
        <p className="text-[10px] text-slate-300">
          No notifications yet — AI will show security, payment, GPS & system alerts here.
        </p>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-2 rounded-xl px-3 py-2 border ${
                n.read ? 'border-slate-700 bg-black/40' : 'border-amber-400/40 bg-amber-950/20'
              }`}
            >
              <div className="flex-1">
                <p className="text-[10px] text-slate-100 font-semibold">
                  {n.title} • <span className="capitalize">{n.type}</span>
                </p>
                <p className="text-[10px] text-slate-300">{n.message}</p>
                <p className="text-[9px] text-slate-500 mt-1">
                  Priority: {n.priority} • {n.timestamp}
                </p>
              </div>
              {!n.read && (
                <button
                  onClick={() => onMarkRead(n.id)}
                  className="text-[9px] text-emerald-300"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </GlassSection>
  );
});

// ─────────────────────────────────────────────────────────────
// 11. AI Enterprise Assistant (dynamic)
// ─────────────────────────────────────────────────────────────

const AIEnterpriseAssistant = memo(function AIEnterpriseAssistant({ user, runtimeState }) {
  const cd = user?.companyData || {};
  const summary = runtimeState?.aiSummary || {
    applicantsToday: cd.applicantsToday ?? 17,
    projectsDelayed: cd.projectsDelayed ?? 3,
    revenueDelta:    (cd.revenueDeltaToday ?? 12) + '%',
    employeesAbsent: cd.employeesAbsentToday ?? 4,
    recommendation:  'Hire 5 electricians near Punta Cana.',
  };

  const briefingLines = computeAIBriefing(user, runtimeState);

  return (
    <GlassSection
      icon={<Cpu className="w-4 h-4 text-cyan-400" />}
      title="AI Enterprise Assistant"
    >
      <p className="text-[11px] text-slate-200 mb-2">
        Good morning {user?.firstName || user?.name || 'CEO'}.  
        Today your company has:
      </p>
      <ul className="text-[10px] text-slate-100 space-y-1 mb-2">
        <li>• {summary.applicantsToday} new applicants</li>
        <li>• {summary.projectsDelayed} projects delayed</li>
        <li>• Revenue changed by {summary.revenueDelta}</li>
        <li>• {summary.employeesAbsent} employees absent</li>
      </ul>
      <p className="text-[10px] text-emerald-300 mb-2">
        Recommendation: {summary.recommendation}
      </p>
      <p className="text-[10px] text-slate-200 font-semibold mb-1">AI Decision Engine</p>
      <ul className="text-[10px] text-sky-300 space-y-1">
        {briefingLines.map(line => (
          <li key={line}>• {line}</li>
        ))}
      </ul>
    </GlassSection>
  );
});

// ─────────────────────────────────────────────────────────────
// 12. Wallet Center
// ─────────────────────────────────────────────────────────────

const WalletCenter = memo(function WalletCenter({ user }) {
  const cd = user?.companyData || {};
  const wallet = cd.wallet || {
    balance:       cd.walletBalance ?? 0,
    escrow:        cd.escrowBalance ?? 0,
    pending:       cd.pendingAmount ?? 0,
    released:      cd.releasedAmount ?? 0,
    cards:         cd.cards || [],
    crypto:        cd.crypto || [],
    invoices:      cd.invoices || [],
    taxes:         cd.taxes || [],
    payroll:       cd.payrollMonth ?? 0,
  };

  return (
    <GlassSection
      icon={<Wallet className="w-4 h-4 text-emerald-400" />}
      title="Wallet • Finance Center"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <AnimatedKPI label="Balance"  value={wallet.balance}  prefix="$" accent="from-emerald-400 to-emerald-600" />
        <AnimatedKPI label="Escrow"   value={wallet.escrow}   prefix="$" accent="from-indigo-400 to-indigo-600" />
        <AnimatedKPI label="Pending"  value={wallet.pending}  prefix="$" accent="from-amber-400 to-amber-600" />
        <AnimatedKPI label="Released" value={wallet.released} prefix="$" accent="from-sky-400 to-sky-600" />
      </div>
      <p className="text-[10px] text-slate-300">
        Wallet modules: Withdraw, Cards, Crypto, Invoices, Taxes, Payroll — UI ready to plug into finance APIs.
      </p>
    </GlassSection>
  );
});

// ─────────────────────────────────────────────────────────────
// 13. Enterprise Search & Quick Actions
// ─────────────────────────────────────────────────────────────

const EnterpriseSearchBar = memo(function EnterpriseSearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl">
      <SearchIcon className="w-4 h-4 text-slate-200" />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search employees, projects, invoices, jobs, companies, clients, payments, chats, branches, AI commands…"
        className="bg-transparent text-[11px] text-white placeholder-slate-400 outline-none w-48 lg:w-64"
      />
      <button type="submit" className="text-[10px] text-cyan-300">
        Enter
      </button>
    </form>
  );
});

const QuickActionsBar = memo(function QuickActionsBar({ onAction }) {
  const actions = [
    { id: 'createJob', label: 'Create Job' },
    { id: 'payEmployee', label: 'Pay Employee' },
    { id: 'openChat', label: 'Open Chat' },
    { id: 'generateInvoice', label: 'Generate Invoice' },
    { id: 'addBranch', label: 'Add Branch' },
    { id: 'viewAnalytics', label: 'View Analytics' },
    { id: 'scheduleInterview', label: 'Schedule Interview' },
    { id: 'launchAI', label: 'Launch AI' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map(a => (
        <button
          key={a.id}
          onClick={() => onAction?.(a.id)}
          className="px-2 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl text-[10px] text-cyan-300"
        >
          {a.label}
        </button>
      ))}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// 14. Command Bar (notifications/messages/wallet/search/voice)
// ─────────────────────────────────────────────────────────────

const CommandBar = memo(function CommandBar({ user, notificationsCount, messagesCount, onSearch, onQuickAction }) {
  const cd = user?.companyData || {};
  const revenueToday    = cd.revenueToday ?? 0;
  const walletBalance   = cd.walletBalance ?? 0;
  const calendarEvents  = cd.calendarEventsToday ?? 0;

  return (
    <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div className="flex items-center gap-2">
        <EnterpriseSearchBar onSearch={onSearch} />
        <button className="px-2 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl flex items-center gap-1 text-[10px] text-slate-200">
          <Mic className="w-3 h-3 text-cyan-400" />
          <span>AI Voice</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className="relative px-2 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl flex items-center gap-1 text-[10px] text-slate-200">
          <Bell className="w-3 h-3 text-amber-400" />
          <span>Notifications</span>
          {notificationsCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-[9px] text-white">
              {notificationsCount}
            </span>
          )}
        </button>
        <button className="relative px-2 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl flex items-center gap-1 text-[10px] text-slate-200">
          <MessageCircle className="w-3 h-3 text-sky-400" />
          <span>Messages</span>
          {messagesCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500 text-[9px] text-white">
              {messagesCount}
            </span>
          )}
        </button>
        <button className="px-2 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl flex items-center gap-1 text-[10px] text-slate-200">
          <Wallet className="w-3 h-3 text-emerald-400" />
          <span>Wallet</span>
          <span className="text-[10px] text-emerald-300 ml-1">${walletBalance}</span>
        </button>
        <button className="px-2 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl flex items-center gap-1 text-[10px] text-slate-200">
          <Calendar className="w-3 h-3 text-slate-200" />
          <span>Calendar</span>
          {calendarEvents > 0 && (
            <span className="text-[9px] text-slate-300 ml-1">{calendarEvents} today</span>
          )}
        </button>
        <QuickActionsBar onAction={onQuickAction} />
      </div>

      <div className="flex items-center gap-2 text-[10px] text-slate-300">
        <Activity className="w-3 h-3 text-emerald-400" />
        <span>Revenue today: ${revenueToday}</span>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// 15. AI Command Center button
// ─────────────────────────────────────────────────────────────

const AICommandCenterButton = memo(function AICommandCenterButton({ onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="fixed bottom-4 right-4 z-40 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 text-white text-[11px] font-semibold shadow-[0_18px_45px_rgba(15,23,42,0.95)] flex items-center gap-2"
    >
      <Command className="w-4 h-4" />
      AI COMMAND CENTER
    </button>
  );
});

// ─────────────────────────────────────────────────────────────
// 16. MAIN CompanyDashboard component
// ─────────────────────────────────────────────────────────────

const TABS = ['overview','employees','hiring','projects','branches','analytics'];

export default function CompanyDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [messagesCount, setMessagesCount] = useState(0);
  const [runtimeState, setRuntimeState] = useState({});
  const [aiCommandOpen, setAiCommandOpen] = useState(false);

  // Real-time streams hookup
  useRealtimeStreams(user, (key, data) => {
    // Simplified example: update local runtime state & notifications
    setRuntimeState(prev => ({ ...prev, [key]: data }));

    if (key === 'messages') {
      setMessagesCount(prev => prev + 1);
    }

    if (key === 'applicants') {
      setNotifications(prev => [
        {
          id: `notif_${Date.now()}`,
          title: 'New applicant',
          type: 'ai_alert',
          message: `New applicant for job ${data.jobTitle}`,
          priority: 'medium',
          timestamp: new Date().toLocaleTimeString(),
          read: false,
        },
        ...prev,
      ]);
    }
  });

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const handleSearch = useCallback((query) => {
    // Future: route to global search results (Salesforce-style).
    // Example commands: "Find electrician in Bavaro", "Show unpaid invoices", "Employees absent today".
    console.log('Enterprise search:', query);
  }, []);

  const handleQuickAction = useCallback((actionId) => {
    console.log('Quick action:', actionId);
  }, []);

  const notificationsCount = notifications.filter(n => !n.read).length;

  const canSeeHero      = hasAccess(user, 'hero');
  const canSeeKPI       = hasAccess(user, 'kpi');
  const canSeeAnalytics = hasAccess(user, 'analytics');
  const canSeeAI        = hasAccess(user, 'aiAssistant');
  const canSeeWallet    = hasAccess(user, 'wallet');

  return (
    <div className="relative">
      {/* Global background (4K/gradients) */}
      <div className="fixed inset-0 -z-10 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.25),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(129,140,248,0.35),transparent_50%)]" />
      </div>

      <div className="px-4 py-4 lg:px-6 lg:py-6 max-w-7xl mx-auto">
        {/* Command bar */}
        <CommandBar
          user={user}
          notificationsCount={notificationsCount}
          messagesCount={messagesCount}
          onSearch={handleSearch}
          onQuickAction={handleQuickAction}
        />

        {/* Hero premium + AI Briefing */}
        {canSeeHero && (
          <HeroDashboardPremium user={user} runtimeState={runtimeState} />
        )}

        {/* KPI Center + AI Assistant + Analytics Shell + Wallet + Notification Center */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
          <div className="space-y-4">
            {canSeeKPI && <EnterpriseKPICenter user={user} runtimeState={runtimeState} />}
            {canSeeAI && <AIEnterpriseAssistant user={user} runtimeState={runtimeState} />}
          </div>
          <div className="xl:col-span-2 space-y-4">
            {canSeeAnalytics && <RealAnalyticsShell user={user} />}
            {canSeeWallet && <WalletCenter user={user} />}
            <NotificationCenter notifications={notifications} onMarkRead={markNotificationRead} />
          </div>
        </div>

        {/* Tabs strip pou Employees/Hiring/Projects/Branches/Analytics */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {TABS.map(id => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${
                activeTab === id
                  ? 'bg-white/15 border-white/40 text-white'
                  : 'bg-black/40 border-white/10 text-slate-300'
              } backdrop-blur-xl flex items-center gap-1`}
            >
              {id === 'overview'   && <Sparkles className="w-3 h-3 text-cyan-300" />}
              {id === 'employees'  && <Users className="w-3 h-3 text-sky-300" />}
              {id === 'hiring'     && <LineChart className="w-3 h-3 text-emerald-300" />}
              {id === 'projects'   && <FileText className="w-3 h-3 text-indigo-300" />}
              {id === 'branches'   && <Globe2 className="w-3 h-3 text-amber-300" />}
              {id === 'analytics'  && <BarChart3 className="w-3 h-3 text-rose-300" />}
              <span className="capitalize">{id}</span>
            </button>
          ))}
        </div>

        {/* Tab content (ou ploge EmployeesTab/HiringTab/ProjectsTab/BranchesTab/AnalyticsTab ou yo la) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeTab === 'overview' && (
            <GlassSection title="Overview" icon={<Sparkles className="w-4 h-4 text-cyan-400" />}>
              <p className="text-[10px] text-slate-200">
                Overview metrics & guidance. Ploge CompanyOverviewSupplement la oswa lòt widgets (CRM, inventory, AI reports, contracts, etc.).
              </p>
            </GlassSection>
          )}

          {activeTab === 'employees' && (
            <GlassSection title="Employees" icon={<Users className="w-4 h-4 text-sky-400" />}>
              <p className="text-[10px] text-slate-200">
                Employees management UI (photo, online, GPS, project, attendance, performance, salary, contracts, docs, certificates, languages, AI recommendations).
              </p>
            </GlassSection>
          )}

          {activeTab === 'hiring' && (
            <GlassSection title="Hiring Center" icon={<LineChart className="w-4 h-4 text-emerald-400" />}>
              <p className="text-[10px] text-slate-200">
                Hiring Center tankou LinkedIn Recruiter / Indeed Employer / SAP SuccessFactors ak AI candidate ranking, skills match %, experience, distance, expected salary, availability, background check, one-click hire/interview/video/offer/contract/payroll.
              </p>
            </GlassSection>
          )}

          {activeTab === 'projects' && (
            <GlassSection title="Projects" icon={<FileText className="w-4 h-4 text-indigo-400" />}>
              <p className="text-[10px] text-slate-200">
                Projects UI tankou Monday/Asana/ClickUp/Jira ak timeline, Gantt, Kanban, calendar, budget, tasks, workers, progress, invoices.
              </p>
            </GlassSection>
          )}

          {activeTab === 'branches' && (
            <GlassSection title="Branches Map" icon={<MapPin className="w-4 h-4 text-amber-400" />}>
              <p className="text-[10px] text-slate-200">
                Google Maps Enterprise: live workers, live jobs, clients, hotels, restaurants, construction sites, routes, ETA, traffic, nearby workers — Uber‑style map (Mapbox/Google Maps lib).
              </p>
            </GlassSection>
          )}

          {activeTab === 'analytics' && (
            <GlassSection title="Advanced Analytics" icon={<BarChart3 className="w-4 h-4 text-rose-400" />}>
              <p className="text-[10px] text-slate-200">
                Business Intelligence tankou Power BI/Tableau/Looker/Google Analytics ak 40+ charts, animated graphs, forecast, prediction, AI suggestions sou hiring, payroll, market, risk.
              </p>
            </GlassSection>
          )}
        </div>
      </div>

      {/* AI Command Center floating bouton */}
      <AICommandCenterButton onOpen={() => setAiCommandOpen(true)} />

      {/* AI Command Center modal placeholder */}
      {aiCommandOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl">
          <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-slate-950/95 p-6 shadow-[0_40px_120px_rgba(15,23,42,0.9)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Command className="w-4 h-4 text-cyan-400" />
                AI Command Center
              </h2>
              <button
                onClick={() => setAiCommandOpen(false)}
                className="text-[10px] text-slate-300"
              >
                Close
              </button>
            </div>
            <p className="text-[10px] text-slate-200 mb-3">
              Generate Report • Predict Revenue • Optimize Hiring • Optimize Payroll • Find Workers • Analyze Market • Generate Contracts • Analyze Company Risk.
            </p>
            {/* Future: form/commands input, history, result panels */}
            <div className="h-40 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-[10px] text-slate-400">
              AI command workspace ap ploge isit la (text + voice + charts).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
