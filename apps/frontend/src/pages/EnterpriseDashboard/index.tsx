import React, { useEffect, useMemo, useState, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const TOKENS = {
  radius: {
    sm: 'rounded-xl',
    md: 'rounded-2xl',
    lg: 'rounded-3xl',
    xl: 'rounded-[2rem]',
    pill: 'rounded-full',
  },
  panel: 'border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_24px_120px_rgba(0,0,0,.35)]',
  panelStrong: 'border border-white/15 bg-slate-950/55 backdrop-blur-2xl shadow-[0_30px_140px_rgba(0,0,0,.45)]',
  spacing: {
    page: 'px-4 py-4 md:px-6 lg:px-8',
    panel: 'p-4 md:p-5',
  },
} as const;

interface BranchPermissions {
  canHire: boolean;
  canReceivePay: boolean;
  canViewFinance: boolean;
  canManageInventory: boolean;
  canCreateJob: boolean;
  canManageCustomers: boolean;
}

interface Branch {
  id: string;
  name: string;
  city: string;
  country: string;
  flag: string;
  employees: number;
  status: string;
  online: number;
  working: number;
  vacation: number;
  offline: number;
  permissions: BranchPermissions;
  manager?: string;
}

interface JobSlot {
  id: string;
  profession: string;
  total: number;
  filled: number;
  icon: string;
  salary: string;
  city: string;
  urgent: boolean;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  branch: string;
  status: string;
  online: boolean;
}

interface Customer {
  id: string;
  name: string;
  segment: string;
  satisfaction: number;
  branch: string;
}

interface Reservation {
  id: string;
  client: string;
  service: string;
  date: string;
  time: string;
  guests: number;
  amount: number;
  status: string;
}

interface InventoryItem {
  id: string;
  cat: string;
  name: string;
  qty: number;
  unit: string;
  min: number;
  price: number;
}

interface WalletBalance {
  code: string;
  balance: number;
}

interface Transaction {
  id: string;
  type: string;
  from?: string;
  to?: string;
  amount: number;
  currency: string;
  date: string;
}

interface AIInsight {
  id: string;
  title: string;
  value: string;
  tone: string;
}

interface LiveNotification {
  id: string;
  title: string;
  detail: string;
  level: string;
}

interface MarketItem {
  id: string;
  title: string;
  vendor: string;
  price: string;
}

interface HireForm {
  profession: string;
  needed: number;
  salary: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  workingHours: string;
  overtime: boolean;
  accommodation: boolean;
  transportation: boolean;
  food: boolean;
  requirements: string;
  languages: string;
  certificates: string;
  contract: string;
}

interface NewBranch {
  name: string;
  city: string;
  country: string;
  manager: string;
}

const BUSINESS_TYPES = [
  { id: 'hotel', icon: '🏨', label: 'Hôtel' },
  { id: 'restaurant', icon: '🍽', label: 'Restaurant' },
  { id: 'hospital', icon: '🏥', label: 'Hôpital' },
  { id: 'clinic', icon: '🩺', label: 'Clinique' },
  { id: 'construction', icon: '🏗', label: 'Construction' },
  { id: 'supermarket', icon: '🛒', label: 'Supermarché' },
  { id: 'enterprise', icon: '🏢', label: 'Entreprise' },
  { id: 'bank', icon: '🏦', label: 'Banque' },
  { id: 'ngo', icon: '🤝', label: 'ONG' },
  { id: 'government', icon: '🏛', label: 'Gouvernement' },
  { id: 'factory', icon: '🏭', label: 'Usine / Fabrik' },
] as const;

const COUNTRIES_LIST = [
  'Haiti', 'Dominican Republic', 'USA', 'Canada', 'France',
  'Mexico', 'Brazil', 'Jamaica', 'Cuba', 'Colombia',
  'UK', 'Germany', 'Spain', 'Italy', 'Belgium',
] as const;

const BRANCH_PERMISSIONS: Array<{ key: keyof BranchPermissions; label: string }> = [
  { key: 'canHire',             label: 'Kapab rekrite' },
  { key: 'canReceivePay',       label: 'Kapab resevwa peman' },
  { key: 'canViewFinance',      label: 'Kapab wè finans' },
  { key: 'canManageInventory',  label: 'Kapab jere envantè' },
  { key: 'canCreateJob',        label: 'Kapab kreye nouvo djòb' },
  { key: 'canManageCustomers',  label: 'Kapab jere kliyan' },
];

const SECTIONS = [
  { id: 'executive',   label: 'Executive Dashboard' },
  { id: 'analytics',  label: 'Global Analytics' },
  { id: 'operations', label: 'World Operations' },
  { id: 'regions',    label: 'Regional Offices' },
  { id: 'departments',label: 'Departments' },
  { id: 'employees',  label: 'Employees' },
  { id: 'customers',  label: 'Customers' },
  { id: 'reservations', label: 'Reservations' },
  { id: 'inventory',  label: 'Inventory' },
  { id: 'finance',    label: 'Finance' },
  { id: 'payroll',    label: 'Payroll' },
  { id: 'recruitment',label: 'Recruitment' },
  { id: 'marketplace',label: 'Marketplace' },
  { id: 'security',   label: 'Security' },
  { id: 'ai',         label: 'AI' },
  { id: 'settings',   label: 'Settings' },
];

const HERO_MEDIA = {
  image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2400&q=80',
  overlay: 'radial-gradient(circle at 20% 20%, rgba(56,189,248,.18), transparent 26%), radial-gradient(circle at 80% 12%, rgba(245,158,11,.16), transparent 25%), radial-gradient(circle at 60% 72%, rgba(34,197,94,.10), transparent 24%), linear-gradient(180deg, rgba(2,6,23,.20), rgba(2,6,23,.78))',
};

const MOCK_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Punta Cana', city: 'Punta Cana', country: 'Dominican Republic', flag: '🇩🇴', employees: 156, status: 'active', online: 42, working: 98, vacation: 8, offline: 8, permissions: { canHire: true, canReceivePay: true, canViewFinance: true, canManageInventory: true, canCreateJob: true, canManageCustomers: true }, manager: 'Jean-Pierre M.' },
  { id: 'b2', name: 'Santo Domingo', city: 'Santo Domingo', country: 'Dominican Republic', flag: '🇩🇴', employees: 89, status: 'active', online: 20, working: 55, vacation: 5, offline: 9, permissions: { canHire: true, canReceivePay: true, canViewFinance: false, canManageInventory: true, canCreateJob: false, canManageCustomers: true }, manager: 'María González' },
  { id: 'b3', name: 'Cap Haïtien', city: 'Cap-Haïtien', country: 'Haiti', flag: '🇭🇹', employees: 54, status: 'active', online: 12, working: 35, vacation: 3, offline: 4, permissions: { canHire: false, canReceivePay: true, canViewFinance: false, canManageInventory: false, canCreateJob: false, canManageCustomers: true }, manager: 'Claudette M.' },
  { id: 'b4', name: 'Miami', city: 'Miami, FL', country: 'USA', flag: '🇺🇸', employees: 210, status: 'active', online: 65, working: 130, vacation: 10, offline: 5, permissions: { canHire: true, canReceivePay: true, canViewFinance: true, canManageInventory: true, canCreateJob: true, canManageCustomers: true }, manager: 'Robert Smith' },
  { id: 'b5', name: 'Paris', city: 'Paris', country: 'France', flag: '🇫🇷', employees: 34, status: 'active', online: 8, working: 22, vacation: 2, offline: 2, permissions: { canHire: true, canReceivePay: false, canViewFinance: false, canManageInventory: false, canCreateJob: false, canManageCustomers: false }, manager: 'Sophie Martin' },
  { id: 'b6', name: 'Toronto', city: 'Toronto', country: 'Canada', flag: '🇨🇦', employees: 18, status: 'active', online: 5, working: 11, vacation: 1, offline: 1, permissions: { canHire: true, canReceivePay: true, canViewFinance: true, canManageInventory: false, canCreateJob: true, canManageCustomers: true }, manager: 'Alicia Brown' },
];

const MOCK_JOB_SLOTS: JobSlot[] = [
  { id: 'js1', profession: 'Elektrisyen', total: 20, filled: 12, icon: '⚡', salary: 'HTG 35,000', city: 'Punta Cana', urgent: false },
  { id: 'js2', profession: 'Plombye',     total: 4,  filled: 3,  icon: '🔧', salary: 'HTG 22,000', city: 'Santo Domingo', urgent: false },
  { id: 'js3', profession: 'Chofè',       total: 10, filled: 10, icon: '🚗', salary: 'HTG 18,000', city: 'Cap-Haïtien', urgent: false },
  { id: 'js4', profession: 'Mason',       total: 25, filled: 0,  icon: '🧱', salary: 'HTG 28,000', city: 'Miami', urgent: true },
  { id: 'js5', profession: 'Kuyinye',     total: 8,  filled: 6,  icon: '👨‍🍳', salary: 'HTG 25,000', city: 'Paris', urgent: false },
];

const MOCK_EMPLOYEES_ALL: Employee[] = [
  { id: 'e1', name: 'Jean-Robert P.', role: 'Elektrisyen',  branch: 'Punta Cana',  status: 'working', online: true },
  { id: 'e2', name: 'Marie Dupont',   role: 'Receptionist', branch: 'Punta Cana',  status: 'working', online: true },
  { id: 'e3', name: 'Claudette M.',   role: 'Manager',      branch: 'Cap-Haïtien', status: 'online',  online: true },
  { id: 'e4', name: 'Pablo R.',       role: 'Chef',         branch: 'Miami',       status: 'vacation',online: false },
  { id: 'e5', name: 'Anselme T.',     role: 'Plombye',      branch: 'Paris',       status: 'offline', online: false },
  { id: 'e6', name: 'Délira C.',      role: 'Mason',        branch: 'Santo Domingo', status: 'working', online: true },
  { id: 'e7', name: 'Alicia M.',      role: 'Accountant',   branch: 'Toronto',     status: 'working', online: true },
];

const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Jean B.',   segment: 'Premium', satisfaction: 97, branch: 'Punta Cana' },
  { id: 'c2', name: 'Sophie L.', segment: 'VIP',     satisfaction: 94, branch: 'Paris' },
  { id: 'c3', name: 'Marc D.',   segment: 'Medical', satisfaction: 91, branch: 'Cap-Haïtien' },
  { id: 'c4', name: 'Anna R.',   segment: 'Travel',  satisfaction: 89, branch: 'Miami' },
];

const MOCK_RESERVATIONS: Reservation[] = [
  { id: 'r1', client: 'Jean B.',   service: 'Chambre Deluxe', date: '2026-07-11', time: '14:00', guests: 2, amount: 8500,  status: 'upcoming' },
  { id: 'r2', client: 'Sophie L.', service: 'Table × 4',      date: '2026-07-11', time: '20:00', guests: 4, amount: 3200,  status: 'upcoming' },
  { id: 'r3', client: 'Marc D.',   service: 'Soin médical',    date: '2026-07-12', time: '09:30', guests: 1, amount: 1500,  status: 'thisweek' },
  { id: 'r4', client: 'Anna R.',   service: 'Tour Citadelle',  date: '2026-07-15', time: '08:00', guests: 6, amount: 12000, status: 'future' },
  { id: 'r5', client: 'Paul M.',   service: 'Chambre Standard',date: '2026-07-08', time: '12:00', guests: 2, amount: 5000,  status: 'completed' },
];

const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'i1', cat: 'food',      name: 'Riz (sak 50kg)',    qty: 45,  unit: 'sak',   min: 20,  price: 2500  },
  { id: 'i2', cat: 'food',      name: 'Poul (sò)',         qty: 120, unit: 'lib',   min: 50,  price: 180   },
  { id: 'i3', cat: 'medicine',  name: 'Paracetamol 500',   qty: 350, unit: 'bwat',  min: 100, price: 150   },
  { id: 'i4', cat: 'cleaning',  name: 'Dézinfektan',       qty: 15,  unit: 'galon', min: 10,  price: 800   },
  { id: 'i5', cat: 'uniforms',  name: 'Chemiz Hotel',      qty: 80,  unit: 'pyès',  min: 30,  price: 1200  },
  { id: 'i6', cat: 'equipment', name: 'Vantilaton',        qty: 8,   unit: 'unit',  min: 5,   price: 15000 },
];

const MOCK_WALLET_BALANCES: WalletBalance[] = [
  { code: 'USD',  balance: 12450.0  },
  { code: 'EUR',  balance: 8320.5   },
  { code: 'HTG',  balance: 1850000  },
  { code: 'DOP',  balance: 95000    },
  { code: 'CAD',  balance: 2100     },
  { code: 'USDT', balance: 5000     },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'received', from: 'Client Hôtel',    amount: 8500,   currency: 'HTG', date: '2026-07-11' },
  { id: 't2', type: 'salary',   to:   'Jean-Robert P.',  amount: 35000,  currency: 'HTG', date: '2026-07-10' },
  { id: 't3', type: 'received', from: 'Réservation',     amount: 3200,   currency: 'HTG', date: '2026-07-10' },
  { id: 't4', type: 'sent',     to:   'Fournisseur',     amount: 125000, currency: 'HTG', date: '2026-07-09' },
  { id: 't5', type: 'received', from: 'Escrow JOBFAST',  amount: 45000,  currency: 'HTG', date: '2026-07-09' },
];

const MOCK_AI_INSIGHTS: AIInsight[] = [
  { id: 'ai1', title: 'Revenue Prediction',  value: '+14.8% this week',          tone: 'good' },
  { id: 'ai2', title: 'Risk Detection',       value: 'Low fraud probability',     tone: 'good' },
  { id: 'ai3', title: 'Hiring Recommendation',value: '3 new electricians needed', tone: 'warn' },
  { id: 'ai4', title: 'Inventory Forecast',   value: 'Rice stock drops in 8 days',tone: 'warn' },
  { id: 'ai5', title: 'Customer Satisfaction',value: '94.2% avg score',           tone: 'good' },
  { id: 'ai6', title: 'Server Status',        value: '99.98% uptime',             tone: 'good' },
];

const MOCK_NOTIFICATIONS: LiveNotification[] = [
  { id: 'n1', title: 'Live Revenue spike',  detail: '+8.2% in last 12 min',         level: 'good' },
  { id: 'n2', title: 'Branch health',       detail: 'Miami branch has 2 open issues',level: 'warn' },
  { id: 'n3', title: 'Fraud detection',     detail: 'No abnormal payment pattern',   level: 'good' },
  { id: 'n4', title: 'Incoming orders',     detail: '5 new reservations just arrived',level: 'blue' },
];

const MOCK_MARKET_ITEMS: MarketItem[] = [
  { id: 'm1', title: 'Premium CRM Pack',    vendor: 'JOBFAST Labs',   price: '$49/mo' },
  { id: 'm2', title: 'AI Forecast Module',  vendor: 'Enterprise AI',  price: '$79/mo' },
  { id: 'm3', title: 'Security Suite',      vendor: 'SecureOps',      price: '$29/mo' },
];

const cn = (...x: (string | false | null | undefined)[]): string => x.filter(Boolean).join(' ');
const money = (v: number | string, c = 'HTG'): string => `${c} ${Number(v || 0).toLocaleString()}`;
const fmt   = (v: number | string): string => Number(v || 0).toLocaleString();
const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

function useLivePulse(seed: number, max = 100, step = 3, interval = 1200): number {
  const [value, setValue] = useState(seed);
  useEffect(() => {
    const id = setInterval(() => {
      setValue(v => clamp(v + (Math.random() * step * 2 - step), 0, max));
    }, interval);
    return () => clearInterval(id);
  }, [max, step, interval]);
  return value;
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#040816] text-white">
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(59,130,246,.20),transparent_32%),radial-gradient(circle_at_right,rgba(245,158,11,.12),transparent_30%),radial-gradient(circle_at_left,rgba(34,197,94,.08),transparent_25%),linear-gradient(180deg,#040816_0%,#07101d_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:72px_72px]" />
      {children}
    </div>
  );
}

function SectionNav({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {SECTIONS.map(s => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={cn(
            'shrink-0 rounded-full px-4 py-2 text-xs font-bold transition border',
            active === s.id
              ? 'border-amber-400/30 bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
              : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  sub?: string;
  color?: string;
}

const StatCard = memo(function StatCard({ icon, value, label, sub, color = 'text-white' }: StatCardProps) {
  return (
    <motion.div layout className={cn('relative overflow-hidden rounded-[1.6rem] p-4', TOKENS.panel)}>
      <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.12),transparent_36%)]" />
      <div className="relative">
        <div className="text-xl">{icon}</div>
        <div className={cn('mt-2 text-2xl font-black tracking-tight', color)}>{value}</div>
        <div className="text-[11px] uppercase tracking-[.22em] text-slate-400">{label}</div>
        {sub ? <div className="mt-1 text-[11px] text-slate-500">{sub}</div> : null}
      </div>
    </motion.div>
  );
});

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition border',
        active
          ? 'border-transparent bg-white text-slate-950 shadow-lg'
          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
      )}
    >
      {label}
    </button>
  );
}

interface SectionFrameProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function SectionFrame({ title, subtitle, action, children }: SectionFrameProps) {
  return (
    <motion.section layout className={cn('relative overflow-hidden', TOKENS.radius.xl, TOKENS.panelStrong)}>
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.14),transparent_25%),radial-gradient(circle_at_80%_10%,rgba(245,158,11,.12),transparent_28%)]" />
      <div className="relative p-4 md:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.24em] text-slate-400">{subtitle}</p>
            <h2 className="mt-1 text-lg font-black tracking-tight">{title}</h2>
          </div>
          {action}
        </div>
        {children}
      </div>
    </motion.section>
  );
}

function MetricBar({ label, value, total, tone = 'bg-amber-400' }: { label: string; value: number; total: number; tone?: string }) {
  const pct = total > 0 ? clamp((value / total) * 100, 0, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

interface HeroCinematicProps {
  company: { name?: string; verified?: boolean } | null;
  branches: Branch[];
  businessType: string;
  onOpenActions: () => void;
}

function HeroCinematic({ company, branches, businessType, onOpenActions }: HeroCinematicProps) {
  const bt = BUSINESS_TYPES.find(b => b.id === businessType) ?? BUSINESS_TYPES[6]!;
  const totalEmployees = branches.reduce((s, b) => s + b.employees, 0);
  const online = branches.reduce((s, b) => s + b.online, 0);
  const openJobs = MOCK_JOB_SLOTS.reduce((s, j) => s + Math.max(0, j.total - j.filled), 0);
  const liveRevenue = useLivePulse(2416, 4000, 35, 900);
  const liveAlerts  = useLivePulse(7, 30, 2, 1600);
  const liveUsers   = useLivePulse(128, 400, 8, 1100);

  return (
    <motion.section
      layoutId="hero-shell"
      className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_34px_160px_rgba(0,0,0,.5)]"
    >
      <div className="absolute inset-0">
        <img src={HERO_MEDIA.image} alt="" className="h-full w-full object-cover scale-[1.03]" />
        <div className="absolute inset-0" style={{ backgroundImage: HERO_MEDIA.overlay }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,.10),transparent_22%),linear-gradient(180deg,rgba(2,6,23,.08),rgba(2,6,23,.78))]" />
      </div>
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative grid gap-5 p-5 md:p-6 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-300">LIVE OPERATIONS</span>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold text-slate-200">{bt.icon} {bt.label}</span>
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-bold text-sky-200">120 FPS motion ready</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black leading-none tracking-tight md:text-5xl">{company?.name ?? 'Enterprise Global OS'}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200/90 md:text-base">
              Mission Control Center for global branches, AI insights, live revenue, security, reservations, finance, and world operations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onOpenActions} className="group rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02]">
              <span className="inline-flex items-center gap-2">Open Command Center <span className="transition group-hover:translate-x-1">→</span></span>
            </button>
            <button onClick={onOpenActions} className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-xl">
              Launch AI Assistant
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard icon="🏢" value={branches.length}      label="Branches"      sub="global presence" />
            <StatCard icon="👥" value={fmt(totalEmployees)}  label="Employees"     sub="worldwide" />
            <StatCard icon="🟢" value={fmt(online)}          label="Live Employees" sub="currently online" color="text-emerald-300" />
            <StatCard icon="💼" value={fmt(openJobs)}        label="Open Jobs"     sub="recruitment pipeline" color="text-amber-300" />
          </div>
        </div>

        <div className="space-y-3">
          <div className={cn('relative overflow-hidden rounded-[1.8rem] p-4', TOKENS.panelStrong)}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,.14),transparent_26%)]" />
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-[.24em] text-slate-400">Live Pulse</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3"><div className="text-xs text-slate-400">Revenue</div><div className="mt-1 text-2xl font-black text-emerald-300">${liveRevenue.toFixed(0)}K</div></div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3"><div className="text-xs text-slate-400">Active Users</div><div className="mt-1 text-2xl font-black text-sky-300">{Math.round(liveUsers)}</div></div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3"><div className="text-xs text-slate-400">Alerts</div><div className="mt-1 text-2xl font-black text-amber-300">{Math.round(liveAlerts)}</div></div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3"><div className="text-xs text-slate-400">Server</div><div className="mt-1 text-2xl font-black text-white">99.98%</div></div>
              </div>
            </div>
          </div>
          <div className={cn('rounded-[1.8rem] p-4', TOKENS.panel)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.24em] text-slate-400">Dynamic Weather / Time</p>
                <div className="mt-1 text-lg font-black">Global branch clock</div>
              </div>
              <div className="text-right text-sm text-slate-300">
                <div>🌤 New York • 08:06</div>
                <div>🌙 Paris • 02:06</div>
                <div>☀️ Haiti • 20:06</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function WorldMapPanel({ branches }: { branches: Branch[] }) {
  const total = branches.reduce((s, b) => s + b.employees, 0);
  return (
    <SectionFrame title="Interactive World Map" subtitle="World operations">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950/45 min-h-[420px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,.14),transparent_30%),linear-gradient(180deg,rgba(2,6,23,.2),rgba(2,6,23,.8))]" />
          <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle,rgba(255,255,255,.10)_1px,transparent_1px)] [background-size:26px_26px]" />
          <div className="relative flex h-full min-h-[420px] items-center justify-center p-6">
            <div className="relative h-72 w-72 rounded-full border border-sky-400/20 bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,.30),rgba(15,23,42,.85)_62%)] shadow-[0_0_100px_rgba(56,189,248,.18)]">
              <div className="absolute inset-0 rounded-full border border-white/10 animate-pulse" />
              <div className="absolute inset-7 rounded-full border border-white/8" />
              <div className="absolute left-[18%] top-[30%] h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,.8)]" />
              <div className="absolute left-[43%] top-[20%] h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,.8)]" />
              <div className="absolute left-[68%] top-[33%] h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_20px_rgba(56,189,248,.8)]" />
              <div className="absolute left-[38%] top-[58%] h-3 w-3 rounded-full bg-red-400 shadow-[0_0_20px_rgba(248,113,113,.8)]" />
              <div className="absolute left-[58%] top-[70%] h-3 w-3 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,.8)]" />
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
                <path d="M20 30 C 35 24, 48 20, 68 34" stroke="rgba(255,255,255,.35)" strokeWidth="0.7" fill="none" />
                <path d="M24 58 C 38 49, 52 43, 72 39" stroke="rgba(255,255,255,.25)" strokeWidth="0.7" fill="none" />
                <path d="M33 67 C 50 61, 61 55, 80 48" stroke="rgba(255,255,255,.22)" strokeWidth="0.7" fill="none" />
              </svg>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { code: 'USA',    workers: 245, flag: '🇺🇸' },
            { code: 'France', workers: 33,  flag: '🇫🇷' },
            { code: 'DR',     workers: 842, flag: '🇩🇴' },
            { code: 'Haiti',  workers: 102, flag: '🇭🇹' },
            { code: 'Canada', workers: 18,  flag: '🇨🇦' },
          ].map(x => (
            <div key={x.code} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <div className="text-3xl">{x.flag}</div>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{x.code}</div>
                <div className="text-xs text-slate-400">{x.workers} workers</div>
              </div>
              <div className="text-sm font-black text-amber-300">{total > 0 ? Math.round((x.workers / total) * 100) : 0}%</div>
            </div>
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}

function AIExecutivePanel() {
  return (
    <SectionFrame
      title="AI Executive Assistant"
      subtitle="Executive intelligence"
      action={<span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-300">Live AI</span>}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {MOCK_AI_INSIGHTS.map(item => (
          <div key={item.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
            <div className="text-xs uppercase tracking-[.22em] text-slate-500">{item.title}</div>
            <div className={cn('mt-2 text-lg font-black', item.tone === 'good' ? 'text-emerald-300' : item.tone === 'warn' ? 'text-amber-300' : 'text-sky-300')}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-bold text-white">Today's Insights</div>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          AI recommends opening 3 electricians in Punta Cana, replenishing rice inventory within 8 days, and keeping current fraud exposure low.
        </p>
      </div>
    </SectionFrame>
  );
}

function NotificationsPanel() {
  return (
    <SectionFrame title="Live Notifications" subtitle="Real-time signal stream">
      <div className="space-y-2">
        {MOCK_NOTIFICATIONS.map(n => (
          <div key={n.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div>
              <div className="font-bold">{n.title}</div>
              <div className="text-xs text-slate-400">{n.detail}</div>
            </div>
            <div className={cn('text-[11px] font-bold uppercase tracking-[.18em]', n.level === 'good' ? 'text-emerald-300' : n.level === 'warn' ? 'text-amber-300' : 'text-sky-300')}>
              {n.level}
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

function FinancePanel() {
  return (
    <SectionFrame title="Finance" subtitle="Cash flow / wallets">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {MOCK_WALLET_BALANCES.map(w => (
          <div key={w.code} className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
            <div className="text-xs text-slate-400">{w.code}</div>
            <div className="mt-1 text-xl font-black">{Number(w.balance).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {MOCK_TRANSACTIONS.map(t => (
          <div key={t.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
            <div>
              <div className="font-bold">{t.type}</div>
              <div className="text-xs text-slate-400">{t.date}</div>
            </div>
            <div className="font-black text-emerald-300">{money(t.amount, t.currency)}</div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

function RecruitmentPanel({ onHire }: { onHire: () => void }) {
  return (
    <SectionFrame
      title="Recruitment"
      subtitle="Jobs / talent pipeline"
      action={<button onClick={onHire} className="rounded-full bg-amber-400 px-3 py-1.5 text-[11px] font-black text-slate-950">Hire</button>}
    >
      <div className="space-y-3">
        {MOCK_JOB_SLOTS.map(j => {
          const pct = Math.round((j.filled / j.total) * 100);
          return (
            <div key={j.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between">
                <div className="font-bold">{j.icon} {j.profession}</div>
                <div className={cn('text-[11px] font-bold', j.urgent ? 'text-red-300' : j.filled >= j.total ? 'text-emerald-300' : 'text-amber-300')}>
                  {j.urgent ? 'Ijan' : j.filled >= j.total ? 'Plen' : 'Open'}
                </div>
              </div>
              <div className="mt-1 text-xs text-slate-400">{j.city} · {j.salary}</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={cn('h-full rounded-full', j.filled >= j.total ? 'bg-emerald-500' : j.urgent ? 'bg-red-500' : 'bg-amber-400')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </SectionFrame>
  );
}

function WorldOperationsPanel({ branches }: { branches: Branch[] }) {
  return (
    <SectionFrame title="World Operations" subtitle="Regional health / live status">
      <div className="grid gap-3 md:grid-cols-2">
        {branches.map(b => (
          <div key={b.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{b.flag}</div>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{b.name}</div>
                <div className="text-xs text-slate-400">{b.city} · {b.country}</div>
              </div>
              <div className="text-[11px] font-bold text-emerald-300">{b.status}</div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-xl bg-white/5 p-2"><div className="font-black">{b.online}</div><div className="text-[9px] text-slate-500">Live</div></div>
              <div className="rounded-xl bg-white/5 p-2"><div className="font-black">{b.working}</div><div className="text-[9px] text-slate-500">Work</div></div>
              <div className="rounded-xl bg-white/5 p-2"><div className="font-black">{b.vacation}</div><div className="text-[9px] text-slate-500">Vac</div></div>
              <div className="rounded-xl bg-white/5 p-2"><div className="font-black">{b.offline}</div><div className="text-[9px] text-slate-500">Off</div></div>
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

function DepartmentsPanel() {
  const deps = ['Operations', 'Finance', 'Recruitment', 'Security', 'AI', 'Customer Care', 'Inventory', 'Marketplace'];
  return (
    <SectionFrame title="Departments" subtitle="Company structure">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {deps.map(dep => (
          <div key={dep} className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
            <div className="font-bold">{dep}</div>
            <div className="mt-2 text-xs text-slate-400">Connected to global OS</div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

function EmployeesPanel({ branches }: { branches: Branch[] }) {
  const total   = branches.reduce((s, b) => s + b.employees, 0);
  const online  = branches.reduce((s, b) => s + b.online, 0);
  const working = branches.reduce((s, b) => s + b.working, 0);
  const vac     = branches.reduce((s, b) => s + b.vacation, 0);
  return (
    <SectionFrame title="Employees" subtitle="Live workforce">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard icon="👥" value={fmt(total)}   label="Total" />
        <StatCard icon="🟢" value={fmt(online)}  label="Live Employees" color="text-emerald-300" />
        <StatCard icon="⚡" value={fmt(working)} label="Working"        color="text-amber-300" />
        <StatCard icon="🏖" value={fmt(vac)}     label="Vacation"       color="text-sky-300" />
      </div>
      <div className="mt-4 space-y-2">
        {MOCK_EMPLOYEES_ALL.map(e => (
          <div key={e.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div>
              <div className="font-bold">{e.name}</div>
              <div className="text-xs text-slate-400">{e.role} · {e.branch}</div>
            </div>
            <div className={cn('text-xs font-bold', e.online ? 'text-emerald-300' : 'text-slate-400')}>{e.status}</div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

function CustomersPanel() {
  return (
    <SectionFrame title="Customers" subtitle="Satisfaction / loyalty">
      <div className="space-y-2">
        {MOCK_CUSTOMERS.map(c => (
          <div key={c.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">{c.name}</div>
                <div className="text-xs text-slate-400">{c.segment} · {c.branch}</div>
              </div>
              <div className="font-black text-emerald-300">{c.satisfaction}%</div>
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

function InventoryPanel() {
  return (
    <SectionFrame title="Inventory" subtitle="Stock / supply chain">
      <div className="space-y-2">
        {MOCK_INVENTORY.map(i => (
          <div key={i.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div>
              <div className="font-bold">{i.name}</div>
              <div className="text-xs text-slate-400">Qty {i.qty} · Min {i.min} · {i.unit}</div>
            </div>
            <div className="font-black text-sky-300">{money(i.price)}</div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

function PayrollPanel() {
  return (
    <SectionFrame title="Payroll" subtitle="Compensation engine">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
          <div className="text-xs text-slate-400">Next payroll</div>
          <div className="mt-1 text-2xl font-black">HTG 3.8M</div>
          <div className="mt-2 text-xs text-slate-500">Due in 2 days</div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
          <div className="text-xs text-slate-400">Approved salaries</div>
          <div className="mt-1 text-2xl font-black">96%</div>
          <div className="mt-2 text-xs text-slate-500">All branches synced</div>
        </div>
      </div>
    </SectionFrame>
  );
}

function MarketplacePanel() {
  return (
    <SectionFrame title="Marketplace" subtitle="Apps / modules">
      <div className="grid gap-3 md:grid-cols-3">
        {MOCK_MARKET_ITEMS.map(x => (
          <div key={x.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
            <div className="font-bold">{x.title}</div>
            <div className="mt-1 text-xs text-slate-400">{x.vendor}</div>
            <div className="mt-3 font-black text-amber-300">{x.price}</div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

function SecurityPanel() {
  return (
    <SectionFrame title="Security" subtitle="Threat / fraud / access">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
          <div className="text-xs text-slate-400">Fraud Detection</div>
          <div className="mt-1 text-xl font-black text-emerald-300">No suspicious activity</div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
          <div className="text-xs text-slate-400">Access Control</div>
          <div className="mt-1 text-xl font-black text-sky-300">Branch permissions enforced</div>
        </div>
      </div>
    </SectionFrame>
  );
}

function OverviewGrid({ branches, onHire }: { branches: Branch[]; onHire: () => void }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_.9fr]">
      <div className="space-y-4">
        <HeroCinematic company={{ name: 'JOBFAST Enterprise', verified: true }} branches={branches} businessType="enterprise" onOpenActions={onHire} />
        <WorldMapPanel branches={branches} />
      </div>
      <div className="space-y-4">
        <AIExecutivePanel />
        <NotificationsPanel />
        <RecruitmentPanel onHire={onHire} />
      </div>
    </div>
  );
}

interface BranchDetailProps {
  branch: Branch;
  onBack: () => void;
  onSave: (updated: Branch) => void;
}

function BranchDetail({ branch, onBack, onSave }: BranchDetailProps) {
  const [tab, setTab]         = useState('overview');
  const [perms, setPerms]     = useState<BranchPermissions>({ ...branch.permissions });
  const [editing, setEditing] = useState(false);

  const save = () => {
    onSave({ ...branch, permissions: perms });
    setEditing(false);
  };

  const branchTabs = ['overview', 'employees', 'jobs', 'reservations', 'customers', 'inventory', 'finance', 'settings'];

  return (
    <motion.section layout className="space-y-4">
      <div className={cn('flex items-center gap-3 p-4', TOKENS.panelStrong, TOKENS.radius.xl)}>
        <button onClick={onBack} className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-slate-950/60">←</button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-black">{branch.flag} {branch.name}</div>
          <div className="text-xs text-slate-400">{branch.city}, {branch.country} · {branch.employees} anplwaye</div>
        </div>
        <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300">Aktif</div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {branchTabs.map(bt => (
          <Pill key={bt} label={bt[0]!.toUpperCase() + bt.slice(1)} active={tab === bt} onClick={() => setTab(bt)} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid gap-3 md:grid-cols-2">
            <StatCard icon="👥" value={branch.employees} label="Total anplwaye" />
            <StatCard icon="🟢" value={branch.online}    label="Anliy kounye a"  color="text-emerald-300" />
            <StatCard icon="⚡" value={branch.working}   label="Ap travay"       color="text-amber-300" />
            <StatCard icon="🏖" value={branch.vacation}  label="Vakans"          color="text-sky-300" />
            <div className="md:col-span-2 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[.22em] text-slate-400">Manager</div>
              <div className="mt-1 font-bold">{branch.manager ?? '—'}</div>
            </div>
          </motion.div>
        )}

        {tab === 'employees' && (
          <motion.div key="employees" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {MOCK_EMPLOYEES_ALL.filter(e => e.branch === branch.name).map(e => (
              <div key={e.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div>
                  <div className="font-bold">{e.name}</div>
                  <div className="text-xs text-slate-400">{e.role}</div>
                </div>
                <div className={cn('text-xs font-bold', e.online ? 'text-emerald-300' : 'text-slate-400')}>{e.status}</div>
              </div>
            ))}
          </motion.div>
        )}

        {tab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[.22em] text-slate-400">Pèmisyon branch</div>
                <div className="text-sm text-slate-500">Kontwòl akses yo</div>
              </div>
              {editing ? (
                <div className="flex gap-3 text-xs">
                  <button onClick={save} className="font-bold text-emerald-300">Sove</button>
                  <button onClick={() => { setPerms({ ...branch.permissions }); setEditing(false); }} className="text-slate-400">Anile</button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)} className="text-xs font-bold text-amber-300">Modifye</button>
              )}
            </div>
            {BRANCH_PERMISSIONS.map(p => (
              <div key={p.key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                <div className="text-sm text-slate-300">{p.label}</div>
                <button
                  type="button"
                  onClick={() => editing && setPerms(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                  className={cn('relative h-6 w-11 rounded-full transition', perms[p.key] ? 'bg-amber-400' : 'bg-slate-700', !editing && 'opacity-60')}
                >
                  <span className={cn('absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', perms[p.key] ? 'translate-x-5' : 'translate-x-0')} />
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {['jobs', 'reservations', 'customers', 'inventory', 'finance'].includes(tab) && (
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
            {tab} disponib nan Dashboard Global pou branch <span className="font-bold text-white">{branch.name}</span>.
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

interface BranchesTabProps {
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  countryFilter: string;
  setCountryFilter: (c: string) => void;
}

function BranchesTab({ branches, setBranches, countryFilter, setCountryFilter }: BranchesTabProps) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showCreate, setShowCreate]         = useState(false);
  const [newBranch, setNewBranch]           = useState<NewBranch>({ name: '', city: '', country: 'Haiti', manager: '' });

  const allCountries = [...new Set(branches.map(b => b.country))];
  const filtered     = countryFilter === 'all' ? branches : branches.filter(b => b.country === countryFilter);

  const saveBranch = (updated: Branch) => {
    setBranches(prev => prev.map(b => (b.id === updated.id ? updated : b)));
    setSelectedBranch(updated);
  };

  const createBranch = () => {
    if (!newBranch.name.trim()) return;
    const created: Branch = {
      ...newBranch,
      id: `b${Date.now()}`,
      flag: '🌍',
      employees: 0,
      online: 0,
      working: 0,
      vacation: 0,
      offline: 0,
      status: 'active',
      permissions: { canHire: false, canReceivePay: false, canViewFinance: false, canManageInventory: false, canCreateJob: false, canManageCustomers: false },
    };
    setBranches(prev => [...prev, created]);
    setNewBranch({ name: '', city: '', country: 'Haiti', manager: '' });
    setShowCreate(false);
  };

  if (selectedBranch) {
    return <BranchDetail branch={selectedBranch} onBack={() => setSelectedBranch(null)} onSave={saveBranch} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Pill label="Tout Peyi" active={countryFilter === 'all'} onClick={() => setCountryFilter('all')} />
        {allCountries.map(c => (
          <Pill key={c} label={c} active={countryFilter === c} onClick={() => setCountryFilter(c)} />
        ))}
      </div>

      <button type="button" onClick={() => setShowCreate(v => !v)} className="w-full rounded-2xl border border-dashed border-amber-400/30 bg-amber-400/5 py-3 text-sm font-bold text-amber-300">
        + Kreye Branch
      </button>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
            <input value={newBranch.name} onChange={e => setNewBranch(p => ({ ...p, name: e.target.value }))} placeholder="Non branch lan" className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none" />
            <div className="grid gap-2 md:grid-cols-2">
              <input value={newBranch.city} onChange={e => setNewBranch(p => ({ ...p, city: e.target.value }))} placeholder="Vil" className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none" />
              <select value={newBranch.country} onChange={e => setNewBranch(p => ({ ...p, country: e.target.value }))} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none">
                {COUNTRIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <input value={newBranch.manager} onChange={e => setNewBranch(p => ({ ...p, manager: e.target.value }))} placeholder="Branch Manager (opsyonèl)" className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none" />
            <div className="flex gap-2">
              <button onClick={createBranch} className="flex-1 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950">Kreye</button>
              <button onClick={() => setShowCreate(false)} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300">Anile</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {filtered.map(branch => (
          <button key={branch.id} type="button" onClick={() => setSelectedBranch(branch)} className="w-full rounded-[1.6rem] border border-white/10 bg-white/5 p-4 text-left backdrop-blur-xl transition hover:bg-white/10">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-sky-400/10 text-2xl">{branch.flag}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black">{branch.name}</div>
                <div className="truncate text-xs text-slate-400">{branch.city} · {branch.country}</div>
                <div className="mt-1 text-[10px] text-slate-500">Manager: {branch.manager ?? '—'}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black">{branch.employees}</div>
                <div className="text-[10px] text-slate-400">Anplwaye</div>
                <div className="text-[10px] font-bold text-emerald-300">Aktif</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmployeesTab({ branches }: { branches: Branch[] }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');

  const totalStats = {
    total:   branches.reduce((s, b) => s + b.employees, 0),
    online:  branches.reduce((s, b) => s + b.online, 0),
    working: branches.reduce((s, b) => s + b.working, 0),
    vacation:branches.reduce((s, b) => s + b.vacation, 0),
    offline: branches.reduce((s, b) => s + b.offline, 0),
  };

  const filtered = MOCK_EMPLOYEES_ALL
    .filter(e => statusFilter === 'all' || e.status === statusFilter)
    .filter(e => branchFilter === 'all' || e.branch === branchFilter);

  const statRows = [
    { label: 'Total',   val: totalStats.total },
    { label: 'Anliy',   val: totalStats.online },
    { label: 'Travay',  val: totalStats.working },
    { label: 'Vakans',  val: totalStats.vacation },
    { label: 'Offline', val: totalStats.offline },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {statRows.map(s => (
          <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <div className="text-lg font-black">{s.val}</div>
            <div className="text-[9px] text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'working', 'online', 'vacation', 'offline'].map(s => (
          <Pill key={s} label={s === 'all' ? 'Tout' : s[0]!.toUpperCase() + s.slice(1)} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Pill label="Tout branch" active={branchFilter === 'all'} onClick={() => setBranchFilter('all')} />
        {branches.map(b => (
          <Pill key={b.id} label={b.name} active={branchFilter === b.name} onClick={() => setBranchFilter(b.name)} />
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(e => (
          <div key={e.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">{e.name}</div>
                <div className="text-xs text-slate-400">{e.role} · {e.branch}</div>
              </div>
              <div className={cn('text-xs font-bold', e.online ? 'text-emerald-300' : 'text-slate-400')}>{e.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReservationsTab() {
  return (
    <div className="space-y-2">
      {MOCK_RESERVATIONS.map(r => (
        <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold">{r.client}</div>
              <div className="text-xs text-slate-400">{r.service} · {r.date} · {r.time}</div>
            </div>
            <div className="font-black text-amber-300">{money(r.amount)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function InventoryTab() {
  return (
    <div className="space-y-2">
      {MOCK_INVENTORY.map(i => (
        <div key={i.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold">{i.name}</div>
              <div className="text-xs text-slate-400">Qty {i.qty} · Min {i.min} · {i.unit}</div>
            </div>
            <div className="font-black text-sky-300">{money(i.price)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FinanceTab() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {MOCK_WALLET_BALANCES.map(w => (
          <div key={w.code} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-slate-400">{w.code}</div>
            <div className="mt-1 text-lg font-black">{Number(w.balance).toLocaleString()}</div>
          </div>
        ))}
      </div>
      {MOCK_TRANSACTIONS.map(t => (
        <div key={t.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold">{t.type}</div>
              <div className="text-xs text-slate-400">{t.date}</div>
            </div>
            <div className="font-black text-emerald-300">{money(t.amount, t.currency)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  onHire: () => void;
  onNavigate: (section: string) => void;
}

function ActionSheet({ open, onClose, onHire, onNavigate }: ActionSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 rounded-t-[2rem] border-t border-white/10 bg-[#08101d] p-4 shadow-2xl backdrop-blur-2xl"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20" />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={onHire} className="rounded-2xl bg-amber-400 px-4 py-4 text-left font-black text-slate-950">Hire workers</button>
              <button onClick={() => onNavigate('regions')} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left font-bold text-white">Manage branches</button>
              <button onClick={() => onNavigate('employees')} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left font-bold text-white">Employees</button>
              <button onClick={() => onNavigate('finance')} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left font-bold text-white">Finance</button>
            </div>
            <button onClick={onClose} className="mt-3 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300">Close</button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

interface HireWorkersModalProps {
  open: boolean;
  onClose: () => void;
  onPublish?: (form: HireForm) => void;
}

function HireWorkersModal({ open, onClose, onPublish }: HireWorkersModalProps) {
  const [form, setForm] = useState<HireForm>({
    profession: '', needed: 1, salary: '', city: '', country: 'Haiti',
    startDate: '', endDate: '', workingHours: '8h/jou',
    overtime: false, accommodation: false, transportation: false, food: false,
    requirements: '', languages: 'Kreyòl', certificates: '', contract: '',
  });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const set = <K extends keyof HireForm>(k: K, v: HireForm[K]) => setForm(p => ({ ...p, [k]: v }));

  return (
    <AnimatePresence>
      {open ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/75" onClick={onClose} />
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-hidden rounded-t-[2rem] border-t border-white/10 bg-[#08101d] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="font-black">👷 Rekrite Travayè</div>
              <button onClick={onClose} className="text-slate-400">✕</button>
            </div>
            <div className="max-h-[calc(92vh-140px)] space-y-3 overflow-y-auto p-5">
              <input value={form.profession} onChange={e => set('profession', e.target.value)} placeholder="Elektrisyen, Mason, Chofè…" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
              <div className="grid gap-3 md:grid-cols-2">
                <input value={form.needed} type="number" min="1" onChange={e => set('needed', Number(e.target.value))} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
                <input value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="HTG 35,000" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Port-au-Prince" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
                <select value={form.country} onChange={e => set('country', e.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none">
                  {COUNTRIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
                <input type="date" value={form.endDate}   onChange={e => set('endDate',   e.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
              </div>
              <textarea value={form.requirements} onChange={e => set('requirements', e.target.value)} placeholder="Kondisyon, eksperyans, kalifikasyon..." className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
              <div className="grid gap-3 md:grid-cols-2">
                <input value={form.languages}    onChange={e => set('languages',    e.target.value)} placeholder="Lang"      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
                <input value={form.certificates} onChange={e => set('certificates', e.target.value)} placeholder="Sètifika"  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
              </div>
              <div className="grid gap-2">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.overtime}       onChange={e => set('overtime',       e.target.checked)} /> Overtime</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.accommodation} onChange={e => set('accommodation',  e.target.checked)} /> Accommodation</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.transportation}onChange={e => set('transportation', e.target.checked)} /> Transportation</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.food}          onChange={e => set('food',          e.target.checked)} /> Food</label>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <button onClick={() => { onPublish?.(form); onClose(); }} className="rounded-2xl bg-amber-400 px-4 py-3 font-black text-slate-950">Pibliye</button>
                <button onClick={onClose} className="rounded-2xl border border-white/10 px-4 py-3 text-slate-300">Anile</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function EnterpriseDashboard({ company }: { company?: { name: string; verified?: boolean } | null }) {
  const [branches, setBranches]           = useState<Branch[]>(MOCK_BRANCHES);
  const [activeSection, setActiveSection] = useState('executive');
  const [countryFilter, setCountryFilter] = useState('all');
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [hireOpen, setHireOpen]           = useState(false);

  const sectionRefs = useMemo<Record<string, React.RefObject<HTMLDivElement>>>(
    () => SECTIONS.reduce<Record<string, React.RefObject<HTMLDivElement>>>((acc, s) => {
      acc[s.id] = React.createRef<HTMLDivElement>();
      return acc;
    }, {}),
    []
  );

  useEffect(() => {
    const el = sectionRefs[activeSection]?.current;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeSection, sectionRefs]);

  return (
    <AppShell>
      <div className={cn('mx-auto max-w-[1600px]', TOKENS.spacing.page)}>
        <div className="space-y-4">
          <HeroCinematic
            company={company ?? { name: 'JOBFAST Enterprise', verified: true }}
            branches={branches}
            businessType="enterprise"
            onOpenActions={() => setActionSheetOpen(true)}
          />
          <SectionNav active={activeSection} onChange={setActiveSection} />

          <div className="grid gap-4 xl:grid-cols-[1.4fr_.9fr]">
            <div className="space-y-4">
              <div ref={sectionRefs['executive']}><OverviewGrid branches={branches} onHire={() => setHireOpen(true)} /></div>
              <div ref={sectionRefs['analytics']}>
                <SectionFrame title="Global Analytics" subtitle="Executive analytics">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon="📈" value="+18.4%" label="Growth"     sub="this month"       color="text-emerald-300" />
                    <StatCard icon="⚡" value="99.98%" label="Uptime"     sub="service stability" color="text-sky-300" />
                    <StatCard icon="🧠" value="AI"     label="Automation" sub="decision support"  color="text-amber-300" />
                    <StatCard icon="🌍" value={branches.length} label="Regions" sub="active branches" />
                  </div>
                  <div className="mt-4 space-y-3">
                    <MetricBar label="Revenue health"      value={86} total={100} tone="bg-emerald-400" />
                    <MetricBar label="Employee activity"   value={74} total={100} tone="bg-sky-400" />
                    <MetricBar label="Inventory readiness" value={62} total={100} tone="bg-amber-400" />
                  </div>
                </SectionFrame>
              </div>
              <div ref={sectionRefs['operations']}><WorldOperationsPanel branches={branches} /></div>
              <div ref={sectionRefs['regions']}><BranchesTab branches={branches} setBranches={setBranches} countryFilter={countryFilter} setCountryFilter={setCountryFilter} /></div>
              <div ref={sectionRefs['departments']}><DepartmentsPanel /></div>
              <div ref={sectionRefs['employees']}><EmployeesTab branches={branches} /></div>
              <div ref={sectionRefs['customers']}><CustomersPanel /></div>
              <div ref={sectionRefs['reservations']}><SectionFrame title="Reservations" subtitle="Bookings / schedule"><ReservationsTab /></SectionFrame></div>
              <div ref={sectionRefs['inventory']}><SectionFrame title="Inventory" subtitle="Stock / supply"><InventoryTab /></SectionFrame></div>
              <div ref={sectionRefs['finance']}><FinanceTab /></div>
              <div ref={sectionRefs['payroll']}><PayrollPanel /></div>
              <div ref={sectionRefs['recruitment']}><RecruitmentPanel onHire={() => setHireOpen(true)} /></div>
              <div ref={sectionRefs['marketplace']}><MarketplacePanel /></div>
              <div ref={sectionRefs['security']}><SecurityPanel /></div>
              <div ref={sectionRefs['ai']}><AIExecutivePanel /></div>
              <div ref={sectionRefs['settings']}>
                <SectionFrame title="Settings" subtitle="System preferences">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="font-bold">Design tokens</div>
                      <div className="text-sm text-slate-400">Centralized spacing, radius, colors, motion, elevation.</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="font-bold">Theme / i18n</div>
                      <div className="text-sm text-slate-400">Ready for multilingual scaling and route-level settings.</div>
                    </div>
                  </div>
                </SectionFrame>
              </div>
            </div>
            <div className="space-y-4">
              <AIExecutivePanel />
              <NotificationsPanel />
              <RecruitmentPanel onHire={() => setHireOpen(true)} />
            </div>
          </div>
        </div>
      </div>

      <ActionSheet
        open={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        onHire={() => { setActionSheetOpen(false); setHireOpen(true); }}
        onNavigate={setActiveSection}
      />

      <HireWorkersModal open={hireOpen} onClose={() => setHireOpen(false)} onPublish={() => {}} />
    </AppShell>
  );
}