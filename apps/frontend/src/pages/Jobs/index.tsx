import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Search, Mic, Sparkles, SlidersHorizontal, X, ChevronRight,
  MapPin, Bookmark, Share2, MessageSquare, Phone, Building2,
  WifiOff, RefreshCcw, CheckCircle, Flag, Users, Calendar, Zap,
  Gem, Star, ShieldCheck, Play, Volume2, Brain, Clock3, Briefcase,
  GraduationCap, Wallet, Rocket, Image as ImageIcon, History, Eye, Loader2,
} from 'lucide-react';

type LucideIcon = React.ComponentType<{ className?: string }>;

const cn = (...v: (string | false | null | undefined)[]): string => v.filter(Boolean).join(' ');

const BRAND = {
  bg:          '#050816',
  panel:       'rgba(17, 24, 39, 0.56)',
  panelStrong: 'rgba(8, 12, 24, 0.72)',
  border:      'rgba(255,255,255,0.10)',
  gold:        '#FACC15',
  sky:         '#38BDF8',
  emerald:     '#34D399',
  red:         '#F87171',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Job {
  id: string;
  title: string;
  company: string;
  logo: string;
  banner: string;
  office: string;
  city: string;
  country: string;
  flag: string;
  salary: string;
  match: number;
  rating: number;
  reviews: number;
  distance: number | null;
  recruiter: string;
  teamSize: number;
  hiringSpeed: string;
  benefits: string[];
  visa: boolean;
  relocation: boolean;
  premium: boolean;
  urgent: boolean;
  verified: boolean;
  remote: boolean;
  liveStatus: string;
  category: string;
  description: string;
  skills: string[];
  aiScore: number;
  viewedAt: number;
  saved: boolean;
}

interface Category { id: string; label: string; icon: string }
interface Filter    { id: string; label: string }
interface SortOpt   { id: string; label: string }

const JOB_TABS = [
  { id: 'search',  icon: '🔍', label: 'Search'  },
  { id: 'saved',   icon: '🔖', label: 'Saved'   },
  { id: 'applied', icon: '✅', label: 'Applied'  },
  { id: 'ai',      icon: '✨', label: 'AI'       },
  { id: 'nearby',  icon: '📍', label: 'Nearby'  },
  { id: 'remote',  icon: '🌐', label: 'Remote'  },
  { id: 'urgent',  icon: '⚡', label: 'Urgent'  },
  { id: 'premium', icon: '💎', label: 'Premium' },
];

const FILTERS: Filter[] = [
  { id: 'fulltime', label: 'Full-time' }, { id: 'parttime', label: 'Part-time' },
  { id: 'remote',   label: 'Remote'   }, { id: 'visa',     label: 'Visa'      },
  { id: 'urgent',   label: 'Urgent'   }, { id: 'premium',  label: 'Premium'   },
  { id: 'verified', label: 'Verified' }, { id: 'ai',       label: 'AI Match'  },
];

const SORT_OPTIONS: SortOpt[] = [
  { id: 'recent',   label: 'Most recent' },
  { id: 'salary',   label: 'Salary'      },
  { id: 'match',    label: 'AI match'    },
  { id: 'distance', label: 'Distance'    },
];

const CATEGORIES: Category[] = [
  { id: 'government',   label: 'Government',    icon: '🏛'  },
  { id: 'ngo',          label: 'NGO',           icon: '🤝'  },
  { id: 'hotel',        label: 'Hotels',        icon: '🏨'  },
  { id: 'hospital',     label: 'Hospitals',     icon: '🏥'  },
  { id: 'construction', label: 'Construction',  icon: '🏗'  },
  { id: 'technology',   label: 'Technology',    icon: '💻'  },
  { id: 'finance',      label: 'Finance',       icon: '🏦'  },
  { id: 'education',    label: 'Education',     icon: '🎓'  },
  { id: 'transport',    label: 'Transportation',icon: '🚚'  },
  { id: 'healthcare',   label: 'Healthcare',    icon: '🩺'  },
  { id: 'restaurants',  label: 'Restaurants',   icon: '🍽'  },
  { id: 'airlines',     label: 'Airlines',      icon: '✈️'  },
  { id: 'cruises',      label: 'Cruise Ships',  icon: '🛳'  },
];

const VIDEO_SOURCES = {
  poster: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=2400&q=80',
  mp4:    '/videos/jobs-hero-loop.mp4',
};

const PREMIUM_BG = {
  desktop: 'radial-gradient(circle at 20% 20%, rgba(56,189,248,.18), transparent 22%), radial-gradient(circle at 80% 10%, rgba(250,204,21,.14), transparent 20%), radial-gradient(circle at 55% 72%, rgba(52,211,153,.10), transparent 18%), linear-gradient(180deg, rgba(5,8,24,.10), rgba(5,8,24,.82))',
};

const mockJobs: Job[] = [
  {
    id: 'j1', title: 'Senior Electrician', company: 'ABC Construction',
    logo: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
    office: 'https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=1200&q=80',
    city: 'Punta Cana', country: 'Dominican Republic', flag: '🇩🇴', salary: '$900/week',
    match: 92, rating: 4.9, reviews: 184, distance: 2.1, recruiter: 'María G.', teamSize: 42,
    hiringSpeed: '48h', benefits: ['Health', 'Transport', 'Bonus'], visa: true, relocation: true,
    premium: true, urgent: true, verified: true, remote: false, liveStatus: 'Hiring now',
    category: 'construction', description: 'Work on premium construction projects with strong benefits and fast recruitment.',
    skills: ['Electrical', 'Maintenance', 'Safety'], aiScore: 96, viewedAt: Date.now() - 120000, saved: true,
  },
  {
    id: 'j2', title: 'Full Stack Developer', company: 'TechCaribe Solutions',
    logo: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80',
    office: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    city: 'Global', country: 'Worldwide', flag: '🌍', salary: '$2,500/month',
    match: 88, rating: 4.8, reviews: 92, distance: null, recruiter: 'James R.', teamSize: 18,
    hiringSpeed: '72h', benefits: ['Remote', 'Equity', 'Laptop'], visa: false, relocation: false,
    premium: true, urgent: false, verified: true, remote: true, liveStatus: 'Remote worldwide',
    category: 'technology', description: 'Build global career products for diaspora users with modern tech stack.',
    skills: ['React', 'Node', 'Cloud'], aiScore: 93, viewedAt: Date.now() - 240000, saved: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function imageCdn(url: string, w = 1200): string {
  if (!url) return '';
  if (url.startsWith('http')) return `${url}${url.includes('?') ? '&' : '?'}auto=format&fit=crop&w=${w}&q=80`;
  return url;
}

function useLiveValue(seed: number, max: number, step: number, interval: number): number {
  const [v, setV] = useState(seed);
  useEffect(() => {
    const id = setInterval(() => setV(x => Math.max(0, Math.min(max, x + (Math.random() * step * 2 - step)))), interval);
    return () => clearInterval(id);
  }, [max, step, interval]);
  return v;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

interface PremiumImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

const PremiumImage = memo(function PremiumImage({ src, alt, className, sizes = '100vw', priority = false }: PremiumImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/5" />}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        className={cn('h-full w-full object-cover transition duration-700', loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]')}
      />
    </div>
  );
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-white" style={{ background: BRAND.bg }}>
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(56,189,248,.16),transparent_26%),radial-gradient(circle_at_right,rgba(250,204,21,.10),transparent_24%),radial-gradient(circle_at_left,rgba(52,211,153,.10),transparent_20%),linear-gradient(180deg,#050816_0%,#07101d_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:84px_84px]" />
      {children}
    </div>
  );
}

interface SectionProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, subtitle, action, children }: SectionProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border" style={{ background: BRAND.panelStrong, borderColor: BRAND.border }}>
      <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.12),transparent_24%),radial-gradient(circle_at_80%_20%,rgba(250,204,21,.10),transparent_26%)]" />
      <div className="relative p-4 md:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{subtitle}</p>
            <h2 className="mt-1 text-lg font-black tracking-tight md:text-xl">{title}</h2>
          </div>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 px-4 py-4 animate-pulse">
      <div className="h-14 w-14 rounded-[18px] bg-white/5" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded-full bg-white/5" />
        <div className="h-3 w-1/2 rounded-full bg-white/5" />
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-white/5" />
          <div className="h-5 w-14 rounded-full bg-white/5" />
        </div>
      </div>
      <div className="h-9 w-9 rounded-full bg-white/5" />
    </div>
  );
}

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

function LiquidButton({ children, className = '', ...props }: LiquidButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'relative overflow-hidden rounded-full px-4 py-3 text-sm font-semibold transition-transform duration-300 active:scale-[0.98]',
        'bg-white text-slate-950 shadow-[0_18px_60px_rgba(255,255,255,.10)] hover:translate-y-[-1px]',
        className
      )}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,.55),transparent)] translate-x-[-120%] animate-[shine_2.6s_infinite]" />
    </button>
  );
}

// ─── Video hero ───────────────────────────────────────────────────────────────

function VideoHero() {
  const { scrollY } = useScroll();
  const y       = useTransform(scrollY, [0, 600], [0, 120]);
  const revenue = useLiveValue(128, 400, 6, 1200);
  const talent  = useLiveValue(92,  250, 4, 1100);
  const alert   = useLiveValue(7,   30,  1, 1500);

  const statItems: Array<{ icon: LucideIcon; value: string; label: string }> = [
    { icon: Briefcase,  value: '12.8K', label: 'Open jobs'  },
    { icon: Users,      value: '1.2K',  label: 'Companies'  },
    { icon: Sparkles,   value: '96%',   label: 'AI match'   },
    { icon: ShieldCheck,value: '99.98%',label: 'Trust score'},
  ];

  const pulseItems: Array<{ label: string; value: string | number; icon: LucideIcon; color: string }> = [
    { label: 'Revenue', value: `$${revenue}K`, icon: Wallet,      color: 'text-emerald-300' },
    { label: 'Talent',  value: talent,         icon: Users,       color: 'text-sky-300'     },
    { label: 'Alerts',  value: alert,          icon: Flag,        color: 'text-amber-300'   },
    { label: 'Uptime',  value: '99.98%',       icon: ShieldCheck, color: 'text-white'       },
  ];

  return (
    <motion.div
      style={{ y, borderColor: BRAND.border, background: BRAND.panel }}
      className="relative overflow-hidden rounded-[2.25rem] border shadow-[0_40px_180px_rgba(0,0,0,.55)]"
    >
      <div className="absolute inset-0">
        <video className="h-full w-full object-cover opacity-75" autoPlay muted loop playsInline poster={VIDEO_SOURCES.poster}>
          <source src={VIDEO_SOURCES.mp4} type="video/mp4" />
        </video>
        <div className="absolute inset-0" style={{ backgroundImage: PREMIUM_BG.desktop }} />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,.12),transparent_20%),linear-gradient(180deg,rgba(5,8,24,.10),rgba(5,8,24,.82))]" />

      <div className="relative grid gap-5 p-5 md:p-6 xl:grid-cols-[1.12fr_.88fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-300">LIVE MARKETPLACE</span>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold text-slate-200">Global Career Marketplace</span>
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-bold text-sky-200">4K / 8K adaptive background</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200">
              <Brain className="h-3.5 w-3.5 text-amber-300" /> AI greeting: "Bonjou, ann jwenn pi bon opòtinite ou yo."
            </div>
            <h1 className="mt-4 text-4xl font-black leading-[0.94] tracking-tight md:text-6xl xl:text-7xl">
              Search the world.
              <span className="block text-transparent bg-clip-text bg-[linear-gradient(90deg,#fff,#7dd3fc,#facc15,#34d399)]">
                Find the right career.
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200/90 md:text-base">
              JOBFAST Global becomes a premium career marketplace with AI personalization, immersive job cards, instant search, remote opportunities, and enterprise-grade browsing.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statItems.map((item) => (
              <motion.div whileHover={{ y: -3 }} key={item.label} className="rounded-[1.4rem] border border-white/10 bg-slate-950/35 p-4 backdrop-blur-xl">
                <item.icon className="h-5 w-5 text-amber-300" />
                <div className="mt-2 text-2xl font-black">{item.value}</div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <LiquidButton>Search Everywhere</LiquidButton>
            <button className="rounded-full border border-white/12 bg-white/8 px-4 py-3 text-sm font-semibold text-white backdrop-blur-xl">
              <span className="inline-flex items-center gap-2"><Mic className="h-4 w-4" /> Voice Search</span>
            </button>
            <button className="rounded-full border border-white/12 bg-white/8 px-4 py-3 text-sm font-semibold text-white backdrop-blur-xl">
              <span className="inline-flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Image Search</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/35 p-4 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Live pulse</p>
                <div className="mt-1 text-lg font-black">Enterprise dashboard</div>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-300">Online</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {pulseItems.map((item) => (
                <div key={item.label} className="rounded-[1.2rem] border border-white/10 bg-white/5 p-3">
                  <item.icon className={cn('h-4 w-4', item.color)} />
                  <div className={cn('mt-1 text-xl font-black', item.color)}>{item.value}</div>
                  <div className="text-[11px] text-slate-400">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-4 backdrop-blur-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Clock3 className="h-4 w-4 text-amber-300" /> Global time zones
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <div className="flex justify-between rounded-2xl bg-black/20 px-3 py-2">New York <span>08:06</span></div>
              <div className="flex justify-between rounded-2xl bg-black/20 px-3 py-2">Paris <span>02:06</span></div>
              <div className="flex justify-between rounded-2xl bg-black/20 px-3 py-2">Haiti <span>20:06</span></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Search bar ───────────────────────────────────────────────────────────────

function SearchBar({ query, setQuery }: { query: string; setQuery: (q: string) => void }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-3 backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search jobs, companies, countries, recruiters, skills, salary..."
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />
        <button className="rounded-full border border-white/10 bg-white/5 p-2">
          <Mic className="h-4 w-4 text-slate-300" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {['Trending: Remote React', 'Visa Sponsorship', 'Healthcare', 'Punta Cana', 'Salary $2k+'].map((x) => (
          <button key={x} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-300">{x}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Categories carousel ──────────────────────────────────────────────────────

function CategoriesCarousel() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {CATEGORIES.map((c) => (
        <div key={c.id} className="min-w-[140px] rounded-[1.35rem] border border-white/10 bg-white/5 p-4 backdrop-blur-2xl">
          <div className="text-2xl">{c.icon}</div>
          <div className="mt-3 text-sm font-bold">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Job card ─────────────────────────────────────────────────────────────────

interface JobCardProps { job: Job; onOpen: (j: Job) => void; onSave: (id: string) => void }

function JobCard({ job, onOpen, onSave }: JobCardProps) {
  return (
    <motion.article whileHover={{ y: -4 }} className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-slate-950/45 backdrop-blur-2xl">
      <div className="relative h-44">
        <PremiumImage src={imageCdn(job.banner, 1600)} alt={`${job.company} banner`} className="h-full w-full" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,24,0.05),rgba(5,8,24,0.78))]" />
        <div className="absolute left-4 top-4 flex gap-2">
          {job.premium && <span className="rounded-full bg-black/45 px-3 py-1 text-[10px] font-black text-amber-300 backdrop-blur-xl">PREMIUM</span>}
          {job.urgent  && <span className="rounded-full bg-black/45 px-3 py-1 text-[10px] font-black text-orange-300 backdrop-blur-xl">URGENT</span>}
        </div>
        <button onClick={() => onSave(job.id)} className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/35 p-2 backdrop-blur-xl">
          <Bookmark className={cn('h-4 w-4', job.saved ? 'fill-amber-300 text-amber-300' : 'text-white')} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <PremiumImage src={imageCdn(job.logo, 300)} alt={job.company} className="h-14 w-14 rounded-[18px] border border-white/10" sizes="72px" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-[16px] font-black">{job.title}</h3>
              {job.verified && <CheckCircle className="h-4 w-4 text-emerald-400" />}
            </div>
            <p className="truncate text-sm text-slate-400">{job.company}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-300" /> {job.rating} ({job.reviews})</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-sky-300" /> {job.city}</span>
              {job.distance != null && <span>{job.distance} km</span>}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-[11px] text-slate-400">Salary</div>
            <div className="font-black text-amber-300">{job.salary}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-[11px] text-slate-400">AI Match</div>
            <div className="font-black text-sky-300">{job.match}%</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-[11px] text-slate-400">Recruiter</div>
            <div className="font-black text-white">{job.recruiter}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-[11px] text-slate-400">Team</div>
            <div className="font-black text-white">{job.teamSize}</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {job.benefits.slice(0, 3).map((b) => (
            <span key={b} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">{b}</span>
          ))}
          {job.visa      && <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[10px] text-sky-200">Visa</span>}
          {job.relocation && <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-200">Relocation</span>}
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={() => onOpen(job)} className="flex-1 rounded-full bg-white px-4 py-3 text-sm font-black text-slate-950">Open</button>
          <button className="rounded-full border border-white/10 bg-white/5 p-3">
            <Share2 className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function JobSkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-slate-950/45">
          <div className="h-44 animate-pulse bg-white/5" />
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}

// ─── AI coach ─────────────────────────────────────────────────────────────────

function AiCoach() {
  const items: Array<{ title: string; value: string; icon: LucideIcon }> = [
    { title: 'Resume Analyzer',  value: '92/100',       icon: Brain        },
    { title: 'Salary Prediction',value: '$1,480 avg',   icon: Wallet       },
    { title: 'Skill Gap',        value: '3 missing skills', icon: GraduationCap },
    { title: 'Interview Mode',   value: 'Ready now',    icon: Rocket       },
  ];

  return (
    <Section title="AI Career Coach" subtitle="Personalized guidance">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <item.icon className="h-5 w-5 text-amber-300" />
            <div className="mt-2 text-lg font-black">{item.value}</div>
            <div className="text-xs text-slate-400">{item.title}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function JobsFooter() {
  return (
    <footer className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-black">JOBFAST Global</div>
          <p className="mt-1 text-sm text-slate-400">A premium career marketplace experience for global talent and enterprises.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-300">
          {['Offline mode', 'Prefetch', 'Cache', 'Background sync'].map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 px-3 py-1">{tag}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── Job detail sheet ─────────────────────────────────────────────────────────

interface JobDetailSheetProps {
  job: Job;
  onClose: () => void;
  saved: boolean;
  onToggleSave: (id: string) => void;
}

function JobDetailSheet({ job, onClose, saved, onToggleSave }: JobDetailSheetProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState('Description');
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-t-[2rem] border border-white/10 bg-[#050816] p-6 pb-10" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.22em] text-slate-400">{job.company}</p>
            <h2 className="mt-1 text-xl font-black">{job.title}</h2>
            <p className="text-sm text-slate-400">{job.city}, {job.country} {job.flag}</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {(['Description', 'Benefits', 'Company'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-xs font-bold transition',
                tab === t ? 'bg-white text-slate-950' : 'border border-white/10 bg-white/5 text-slate-300'
              )}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === 'Description' && <p className="text-sm leading-relaxed text-slate-300">{job.description}</p>}
        {tab === 'Benefits' && (
          <div className="flex flex-wrap gap-2">
            {job.benefits.map((b) => (
              <span key={b} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">{b}</span>
            ))}
            {job.visa      && <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sm text-sky-200">Visa Sponsorship</span>}
            {job.relocation && <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">Relocation</span>}
          </div>
        )}
        {tab === 'Company' && (
          <div className="space-y-3 text-sm">
            {[
              { label: 'Team size',     value: job.teamSize    },
              { label: 'Hiring speed',  value: job.hiringSpeed },
              { label: 'Recruiter',     value: job.recruiter   },
            ].map((row) => (
              <div key={row.label} className="flex justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-slate-400">{row.label}</span>
                <span className="font-bold">{row.value}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <button className="flex-1 rounded-full bg-white py-3 text-sm font-black text-slate-950">Apply Now</button>
          <button
            onClick={() => onToggleSave(job.id)}
            className={cn(
              'rounded-full border px-4 py-3 text-sm font-bold',
              saved ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-white/10 bg-white/5 text-slate-300'
            )}
          >
            {saved ? t('common.saved', { defaultValue: 'Saved ✓' }) : t('common.save', { defaultValue: 'Sove' })}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Token system + section nav (defined but not used in main layout) ─────────

const TOKENS = {
  panel:       'rounded-[2rem] border border-white/10 bg-slate-950/35 backdrop-blur-2xl',
  panelStrong: 'rounded-[2rem] border border-white/10 bg-[rgba(8,12,24,0.72)] backdrop-blur-2xl',
  radius:      { xl: 'rounded-[2rem]' },
};

const NAV_SECTIONS = [
  { id: 'search',     label: 'Search'     },
  { id: 'ai',         label: 'AI Match'   },
  { id: 'categories', label: 'Categories' },
  { id: 'saved',      label: 'Saved'      },
];

function SectionNav({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {NAV_SECTIONS.map((s) => (
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

interface StatCardProps { icon: string; value: string | number; label: string; sub?: string; color?: string }

const StatCard = memo(function StatCard({ icon, value, label, sub, color = 'text-white' }: StatCardProps) {
  return (
    <motion.div layout className={cn('relative overflow-hidden rounded-[1.6rem] p-4', TOKENS.panel)}>
      <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.12),transparent_36%)]" />
      <div className="relative">
        <div className="text-xl">{icon}</div>
        <div className={cn('mt-2 text-2xl font-black tracking-tight', color)}>{value}</div>
        <div className="text-[11px] uppercase tracking-[.22em] text-slate-400">{label}</div>
        {sub && <div className="mt-1 text-[11px] text-slate-500">{sub}</div>}
      </div>
    </motion.div>
  );
});

interface PillProps { label: string; active: boolean; onClick: () => void }

function Pill({ label, active, onClick }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition border',
        active ? 'border-transparent bg-white text-slate-950 shadow-lg' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
      )}
    >
      {label}
    </button>
  );
}

interface SectionFrameProps { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }

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

// ─── Main JobsHub page ────────────────────────────────────────────────────────

export default function JobsHub() {
  const [query,        setQuery]        = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortBy,       setSortBy]       = useState('recent');
  const [jobs,         setJobs]         = useState<Job[]>(mockJobs);
  const [openJob,      setOpenJob]      = useState<Job | null>(null);
  const [loading]                       = useState(false);

  const handleSave = useCallback((id: string) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, saved: !j.saved } : j)));
  }, []);

  const filtered = useMemo(() => {
    let list = jobs;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((j) => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q));
    }
    if (activeFilter) list = list.filter((j) => (j as Record<string, unknown>)[activeFilter] === true);
    if (sortBy === 'salary') list = [...list].sort((a, b) => parseInt(b.salary) - parseInt(a.salary));
    if (sortBy === 'match')  list = [...list].sort((a, b) => b.match - a.match);
    return list;
  }, [jobs, query, activeFilter, sortBy]);

  return (
    <Shell>
      <div className="mx-auto max-w-[1600px] px-4 py-6 space-y-6">
        <VideoHero />
        <SearchBar query={query} setQuery={setQuery} />

        <div className="flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((f) => (
            <Pill
              key={f.id}
              label={f.label}
              active={activeFilter === f.id}
              onClick={() => setActiveFilter(activeFilter === f.id ? null : f.id)}
            />
          ))}
        </div>

        <Section title="Job Categories" subtitle="Browse by sector">
          <CategoriesCarousel />
        </Section>

        <Section
          title="Jobs"
          subtitle={`${filtered.length} opportunite`}
          action={
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id} style={{ background: '#050816' }}>{o.label}</option>
              ))}
            </select>
          }
        >
          {loading ? (
            <JobSkeletonGrid />
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <WifiOff className="mx-auto h-8 w-8 text-slate-500 mb-3" />
              <p className="text-sm text-slate-400">Pa gen rezilta pou "{query}"</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((job) => (
                <JobCard key={job.id} job={job} onOpen={setOpenJob} onSave={handleSave} />
              ))}
            </div>
          )}
        </Section>

        <AiCoach />
        <JobsFooter />
      </div>

      <AnimatePresence>
        {openJob && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          >
            <JobDetailSheet
              job={openJob}
              onClose={() => setOpenJob(null)}
              saved={openJob.saved}
              onToggleSave={handleSave}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Shell>
  );
}