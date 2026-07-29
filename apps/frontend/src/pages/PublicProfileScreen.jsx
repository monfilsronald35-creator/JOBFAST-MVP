import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  memo,
  lazy,
  Suspense,
  startTransition,
} from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Share2,
  Bookmark,
  Play,
  CheckCircle,
  Phone,
  Video,
  MessageCircle,
  MapPin,
  Globe,
  Shield,
  ChevronRight,
  Zap,
  BadgeCheck,
  Sparkles,
  Camera,
  Film,
  Award,
  FileText,
  Clock3,
  Users,
  Eye,
  Heart,
  BriefcaseBusiness,
  Layers3,
  BarChart3,
  Activity,
  LineChart,
  TrendingUp,
  ShieldCheck,
  Languages,
  MapPinned,
  Gauge,
  Route,
  CircleDot,
  Wifi,
  WifiOff,
  UserRoundCheck,
  UserRoundX,
  TimerReset,
  CalendarDays,
  Flame,
  Trophy,
  Medal,
  Diamond,
  Rocket,
  Globe2,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { followUser, unfollowUser, isFollowing, saveUser, unsaveUser, isSaved } from '../services/social';

const StatsSection = lazy(() => import('./sections/StatsSection'));
const TimelineSection = lazy(() => import('./sections/TimelineSection'));
const ReviewsSection = lazy(() => import('./sections/ReviewsSection'));
const TrustCenterSection = lazy(() => import('./sections/TrustCenterSection'));
const AICareerSection = lazy(() => import('./sections/AICareerSection'));
const PortfolioSection = lazy(() => import('./sections/PortfolioSection'));

const BG = '#050B18';
const CARD = 'rgba(11, 18, 34, 0.62)';
const BORDER = 'rgba(255,255,255,0.10)';
const GOLD = '#FACC15';

const cls = (...p) => p.filter(Boolean).join(' ');
const fmtNum = n => {
  const v = Number(n || 0);
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
};
const stars = n => '★★★★★☆☆☆☆☆'.slice(5 - Math.max(0, Math.min(5, Math.round(n))), 10 - Math.max(0, Math.min(5, Math.round(n))));

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function useInView(ref, rootMargin = '220px') {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setInView(true), { rootMargin, threshold: 0.01 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

function useDeferredSection(delay = 0) {
  const ref = useRef(null);
  const visible = useInView(ref);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [visible, delay]);
  return { ref, ready };
}

function useHeroMotion() {
  const { scrollY } = useScroll();
  return {
    coverY: useTransform(scrollY, [0, 360], [0, -80]),
    avatarScale: useTransform(scrollY, [0, 360], [1, 0.72]),
    avatarY: useTransform(scrollY, [0, 360], [0, 16]),
    nameY: useTransform(scrollY, [0, 360], [0, -18]),
    navOpacity: useTransform(scrollY, [0, 240], [0, 1]),
    blur: useTransform(scrollY, [0, 360], [6, 20]),
  };
}

const GlassCard = memo(({ children, className = '', glow = false }) => (
  <div
    className={cls(
      'relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_18px_80px_rgba(0,0,0,.32)] transform-gpu will-change-transform',
      glow && 'shadow-[0_0_50px_rgba(250,204,21,.10)]',
      className
    )}
    style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))' }}
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_34%)]" />
    <div className="relative">{children}</div>
  </div>
));

const SkeletonBlock = ({ className = '' }) => <div className={cls('animate-pulse rounded-2xl bg-white/8', className)} />;

const SectionTitle = memo(({ children, right }) => (
  <div className="mb-3 flex items-center justify-between px-1">
    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{children}</p>
    {right}
  </div>
));

const Pill = memo(({ children, tone = 'slate' }) => {
  const map = {
    slate: 'border-white/10 bg-white/5 text-slate-200',
    emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    amber: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
    sky: 'border-sky-400/20 bg-sky-400/10 text-sky-300',
    rose: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
    violet: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
  };
  return (
    <span className={cls('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold backdrop-blur-xl', map[tone] || map.slate)}>
      {children}
    </span>
  );
});

const StatBox = memo(({ value, label, icon: Icon }) => (
  <div className="flex flex-col items-center gap-1 rounded-[1.2rem] border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-xl">
    {Icon ? <Icon className="h-4 w-4 text-slate-300" /> : null}
    <p className="text-lg font-black text-white">{fmtNum(Number(value) || 0)}</p>
    <p className="text-[9px] font-semibold text-center text-slate-400">{label}</p>
  </div>
));

function buildSkeletonItems(n) {
  return Array.from({ length: n }, (_, i) => i);
}

function buildProfile(seed = {}) {
  return {
    id: seed.id || 'u1',
    name: seed.name || 'Ronald Monfils',
    profession: seed.profession || seed.role || 'Construction Specialist',
    role: seed.role || 'worker',
    category: seed.category || 'construction',
    coverPhoto: seed.coverPhoto || 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=3200&q=80',
    coverPhotoAvif: seed.coverPhotoAvif || null,
    profilePhoto: seed.profilePhoto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1600&q=80',
    introVideo: seed.introVideo || 'https://cdn.example.com/jobfast/intro.mp4',
    introPoster: seed.introPoster || 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80',
    bio: seed.bio || 'Spesyalis konstriksyon ak 8+ ane eksperyans. Travay sou pwojè rezidansyèl ak komèsyal nan Karayib la ak entènasyonalman.',
    location: { city: seed.location?.city || 'Punta Cana', country: seed.location?.country || 'Dominican Republic' },
    distanceKm: seed.distanceKm ?? 2.1,
    liveStatus: seed.liveStatus || 'available',
    lastSeen: seed.lastSeen || '2 min ago',
    typing: seed.typing || false,
    busy: seed.busy || false,
    away: seed.away || false,
    availabilityCalendar: seed.availabilityCalendar || {
      Monday: true,
      Tuesday: false,
      Wednesday: true,
      Thursday: true,
      Friday: false,
      Saturday: true,
      Sunday: false,
    },
    yearsExp: 8,
    languages: [
      { name: 'English', level: 5 },
      { name: 'French', level: 4 },
      { name: 'Spanish', level: 5 },
      { name: 'Kreyòl', level: 5 },
    ],
    salary: '$900/semèn',
    contract: 'Full-time / Contract',
    travelAvail: true,
    rating: {
      overall: 4.9,
      quality: 4.9,
      communication: 4.8,
      speed: 4.7,
      professionalism: 5.0,
      cleanliness: 4.9,
      respect: 5.0,
      safety: 4.8,
    },
    totalReviews: 127,
    stats: {
      visitorsToday: 182,
      visitorsWeek: 1240,
      visitorsMonth: 5490,
      searchAppearances: 23890,
      clicks: 3920,
      messages: 860,
      bookings: 248,
      hires: 64,
      jobs: 245,
      projects: 38,
      clients: 112,
      followers: 1840,
      following: 203,
      views: 9200,
      responseRate: 98,
      responseTime: '3 min',
      repeatClients: 87,
      hiringSuccess: 94,
    },
    verified: {
      passport: true,
      nationalId: true,
      driverLicense: true,
      policeRecord: true,
      companyLicense: false,
      taxNumber: true,
      identity: true,
      face: true,
      phone: true,
      email: true,
      address: true,
      company: false,
      background: true,
      payment: true,
      contracts: true,
      noDisputes: true,
    },
    paymentTrust: {
      escrow: true,
      stripe: true,
      paypal: true,
      bank: true,
    },
    trustScore: 92,
    memberSince: '2026',
    joinedAt: 'Joined JOBFAST 2026',
    badges: ['Identity Verified', 'Phone Verified', 'Email Verified', 'Background Checked', 'Premium Member'],
    achievements: [
      { id: 'a1', label: 'Top Worker', icon: Trophy, tone: 'amber' },
      { id: 'a2', label: 'Elite', icon: Medal, tone: 'sky' },
      { id: 'a3', label: 'Diamond', icon: Diamond, tone: 'violet' },
      { id: 'a4', label: 'Fast Response', icon: Rocket, tone: 'emerald' },
      { id: 'a5', label: 'Best Rated', icon: Star, tone: 'amber' },
      { id: 'a6', label: 'International', icon: Globe2, tone: 'sky' },
    ],
    skills: [
      { name: 'Electrical', level: 98 },
      { name: 'Painting', level: 94 },
      { name: 'Leadership', level: 89 },
      { name: 'Plumbing', level: 91 },
      { name: 'Safety', level: 97 },
      { name: 'Blueprint', level: 88 },
    ],
    experience: [
      { company: 'ABC Construction', role: 'Foreman', period: '2022–2026', current: true },
      { company: 'XYZ Builder', role: 'Electrician', period: '2018–2022', current: false },
      { company: 'Hotel Barceló', role: 'Maintenance', period: '2016–2018', current: false },
    ],
    education: [
      { school: 'INFOTEP Trade School', degree: 'Electrical Certificate', year: '2018' },
      { school: 'Haiti Univ.', degree: 'Construction Management', year: '2016' },
    ],
    services: [
      { name: 'Electrical Work', price: '$80/h', icon: '⚡' },
      { name: 'Painting', price: '$60/h', icon: '🖌' },
      { name: 'Installation', price: '$70/h', icon: '🔧' },
      { name: 'Inspection', price: '$50/h', icon: '🔍' },
      { name: 'Maintenance', price: '$65/h', icon: '⚙️' },
      { name: 'Consultation', price: '$40/h', icon: '💬' },
    ],
    portfolio: [
      { id: 'p1', type: 'photo', src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=2400&q=80', label: 'Hotel Project', alt: 'Hotel project' },
      { id: 'p2', type: 'video', src: 'https://cdn.example.com/video/roof-install.mp4', poster: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80', label: 'Roof Install', alt: 'Roof installation video' },
      { id: 'p3', type: 'beforeAfter', before: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80', after: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80', label: 'Before / After', alt: 'Before and after renovation' },
      { id: 'p4', type: 'photo', src: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=2400&q=80', label: 'Residence', alt: 'Residential project' },
      { id: 'p5', type: 'cert', src: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1800&q=80', label: 'Certificate', alt: 'Certificate image' },
      { id: 'p6', type: 'pdf', label: 'Blueprint' },
    ],
    reviews: [
      { id: 'r1', author: 'Marie Jean', rating: 5, text: 'Excellent travay, pwofesyonèl anpil. Mwen rekòmande l 100%.', date: 'Jul 2026' },
      { id: 'r2', author: 'ABC Hotel', rating: 5, text: 'Livraison rapid ak bon kalite. Nou ap travay ak li ankò.', date: 'Jun 2026' },
      { id: 'r3', author: 'Paul Dupont', rating: 4, text: 'Bon travay, te rive yon ti kras ta men rezilta ekselan.', date: 'May 2026' },
    ],
    timeline: [
      { id: 't1', year: '2026', title: 'Joined JOBFAST', detail: 'Became an active verified professional.' },
      { id: 't2', year: '2026', title: 'Completed 100 Jobs', detail: 'Crossed triple digit completed work.' },
      { id: 't3', year: '2026', title: 'Reached 5★', detail: 'Earned top rating from clients.' },
      { id: 't4', year: '2026', title: 'Verified', detail: 'Passed global verification checks.' },
      { id: 't5', year: '2026', title: 'Top Seller', detail: 'Became a top converting profile.' },
      { id: 't6', year: '2026', title: 'International Worker', detail: 'Expanded to multiple regions.' },
    ],
    heatMap: ['Punta Cana', 'Bávaro', 'Santo Domingo', 'Higüey'],
    aiMatch: {
      score: 95,
      reasons: ['Experience', 'Distance', 'Verified', 'Languages', 'Rating', 'Availability'],
    },
    aiRecs: ['Foreman', 'Project Manager', 'Safety Officer', 'Construction Consultant'],
  };
}

function getStatusTone(status) {
  if (status === 'available') return 'emerald';
  if (status === 'busy') return 'rose';
  if (status === 'away') return 'amber';
  return 'sky';
}

function StarRow({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cls('h-3.5 w-3.5', i < value ? 'fill-amber-400 text-amber-400' : 'text-slate-600')} />
      ))}
    </div>
  );
}

function ProgressBar({ value, className = 'bg-amber-400' }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className={cls('h-full rounded-full', className)} style={{ width: `${clamp(value, 0, 100)}%` }} />
    </div>
  );
}

function HeroSection({ profile, followed, saved, onFollow, onSave, navigate, onMessage }) {
  const reduced = useReducedMotion();
  const { coverY, avatarScale, avatarY, nameY, navOpacity } = useHeroMotion();
  const statusTone = getStatusTone(profile.liveStatus);

  return (
    <div className="relative">
      <motion.div style={{ y: coverY }} className="relative h-[380px] overflow-hidden rounded-[2rem] md:h-[460px]">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={profile.introPoster}
        >
          <source src={profile.introVideo} type="video/mp4" />
        </video>
        <img
          src={profile.coverPhoto}
          alt={`${profile.name} cover`}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,.12),transparent_24%),linear-gradient(180deg,rgba(2,6,23,.10),rgba(2,6,23,.92))]" />
        <motion.div
          animate={reduced ? undefined : { opacity: [0.45, 0.8, 0.45] }}
          transition={{ repeat: Infinity, duration: 4.5 }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(34,197,94,.20),transparent_22%),radial-gradient(circle_at_20%_30%,rgba(250,204,21,.16),transparent_18%)]"
        />

        <div className="absolute left-4 top-4 right-4 z-20 flex items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} className="glass-btn">
            <ArrowLeft className="h-4 w-4" />
          </button>

          <motion.div style={{ opacity: navOpacity }} className="glass-pill">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-[11px] font-bold">Premium Profile</span>
          </motion.div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onSave} className="glass-btn">
              <Bookmark className={cls('h-4 w-4', saved ? 'fill-amber-400 text-amber-400' : 'text-white')} />
            </button>
            <button type="button" className="glass-btn">
              <Share2 className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 p-4 md:p-6">
          <div className="max-w-6xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                <motion.div style={{ scale: avatarScale, y: avatarY }} className="relative shrink-0">
                  <div className="absolute -inset-2 rounded-[1.5rem] bg-amber-400/20 blur-2xl" />
                  <div className="relative h-24 w-24 overflow-hidden rounded-[1.5rem] border border-white/20 bg-slate-900 md:h-28 md:w-28">
                    <img
                      src={profile.profilePhoto}
                      alt={profile.name}
                      className="h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                      onError={e => { e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'; }}
                    />
                  </div>
                  <motion.div animate={reduced ? undefined : { scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }} className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border border-black/30 bg-emerald-400 shadow-[0_0_20px_rgba(34,197,94,.55)]">
                    <div className="h-2.5 w-2.5 rounded-full bg-white" />
                  </motion.div>
                </motion.div>

                <motion.div style={{ y: nameY }} className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">{profile.name}</h1>
                    <motion.span animate={reduced ? undefined : { rotate: [0, 2, -2, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-black text-emerald-300">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </motion.span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-amber-300 md:text-base">{profile.profession}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                    <Pill tone={statusTone}>
                      {profile.liveStatus === 'available' ? <Wifi className="h-3.5 w-3.5" /> : profile.liveStatus === 'busy' ? <TimerReset className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                      {profile.liveStatus}
                    </Pill>
                    <Pill><MapPin className="h-3.5 w-3.5" /> {profile.location.city}, {profile.location.country}</Pill>
                    <Pill><Route className="h-3.5 w-3.5 text-sky-400" /> {profile.distanceKm.toFixed(1)} km away</Pill>
                    <Pill><Clock3 className="h-3.5 w-3.5" /> last seen {profile.lastSeen}</Pill>
                    {profile.typing && <Pill tone="violet"><Sparkles className="h-3.5 w-3.5" /> typing...</Pill>}
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-4 gap-2 md:w-[520px]">
                <StatBox value={profile.stats.jobs} label="Jobs" icon={BriefcaseBusiness} />
                <StatBox value={profile.stats.followers} label="Followers" icon={Users} />
                <StatBox value={profile.stats.views} label="Views" icon={Eye} />
                <StatBox value={profile.trustScore} label="Trust" icon={Shield} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(profile.badges || []).slice(0, 5).map(b => (
                <Pill key={b}><Sparkles className="h-3.5 w-3.5 text-amber-300" /> {b}</Pill>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={onMessage} className="glass-action-primary"><MessageCircle className="h-4 w-4" /> Message</button>
              <button onClick={onFollow} className="glass-action"><Heart className={cls('h-4 w-4', followed ? 'fill-rose-400 text-rose-400' : '')} /> {followed ? 'Following' : 'Follow'}</button>
              <button onClick={() => window.open(`tel:+18095550100`)} className="glass-action"><Phone className="h-4 w-4" /> Call</button>
              <button onClick={() => window.open(`/booking/${profile.id}`, '_blank')} className="glass-action"><Play className="h-4 w-4" /> Book</button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <GlassCard glow>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">AI Match</p>
                  <div className="mt-2 flex items-end gap-3">
                    <div className="text-4xl font-black text-amber-300">{profile.aiMatch.score}%</div>
                    <div className="mb-1 text-sm text-slate-400">Reason-based fit</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.aiMatch.reasons.map(r => <Pill key={r} tone="slate">{r}</Pill>)}
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Live Availability Calendar</p>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-[11px]">
                    {Object.entries(profile.availabilityCalendar).map(([day, ok]) => (
                      <div key={day} className="rounded-2xl border border-white/10 bg-white/5 p-2 text-center">
                        <div className="font-bold text-white">{day.slice(0, 3)}</div>
                        <div className={cls('mt-1 text-lg', ok ? 'text-emerald-300' : 'text-rose-300')}>{ok ? '✔' : '✖'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Success Meter</p>
                  <div className="mt-2 flex items-center gap-3">
                    <LineChart className="h-6 w-6 text-emerald-400" />
                    <div className="text-2xl font-black text-white">{profile.stats.hiringSuccess}%</div>
                  </div>
                  <div className="mt-3 text-xs text-slate-400">Profile conversion rate</div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function LivePresenceCard({ profile }) {
  return (
    <GlassCard>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Live Status</p>
            <p className="mt-1 text-lg font-black text-white">Presence from backend</p>
          </div>
          <div className="flex items-center gap-2">
            {profile.liveStatus === 'available' && <Pill tone="emerald"><Wifi className="h-3.5 w-3.5" /> Available</Pill>}
            {profile.liveStatus === 'busy' && <Pill tone="rose"><UserRoundX className="h-3.5 w-3.5" /> Busy</Pill>}
            {profile.liveStatus === 'away' && <Pill tone="amber"><Clock3 className="h-3.5 w-3.5" /> Away</Pill>}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-[10px] text-slate-400">Online</div>
            <div className="mt-1 text-xl font-black text-emerald-300">Yes</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-[10px] text-slate-400">Typing</div>
            <div className="mt-1 text-xl font-black text-violet-300">{profile.typing ? 'Yes' : 'No'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-[10px] text-slate-400">Away</div>
            <div className="mt-1 text-xl font-black text-amber-300">{profile.away ? 'Yes' : 'No'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-[10px] text-slate-400">Last Seen</div>
            <div className="mt-1 text-xl font-black text-white">{profile.lastSeen}
             </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function DistanceCard({ profile }) {
  return (
    <GlassCard>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-sky-300" />
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">GPS Distance</p>
        </div>
        <div className="mt-2 text-3xl font-black text-white">{profile.distanceKm.toFixed(1)} km away</div>
        <div className="mt-2 text-sm text-slate-400">{profile.location.city}, {profile.location.country}</div>
      </div>
    </GlassCard>
  );
}

function AIResumeActions() {
  const actions = [
    ['Generate Resume', FileText, 'emerald'],
    ['Generate Portfolio', Layers3, 'sky'],
    ['Generate CV', BadgeCheck, 'amber'],
    ['Generate Proposal', Sparkles, 'violet'],
  ];
  return (
    <GlassCard>
      <div className="p-4">
        <SectionTitle>AI Resume Tools</SectionTitle>
        <div className="grid gap-2 md:grid-cols-4">
          {actions.map(([label, Icon, tone]) => (
            <button key={label} className={cls('glass-action justify-center', tone === 'emerald' && 'border-emerald-400/20', tone === 'sky' && 'border-sky-400/20', tone === 'amber' && 'border-amber-400/20', tone === 'violet' && 'border-violet-400/20')}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function ReputationEngine({ profile }) {
  const metrics = [
    ['No disputes', profile.verified.noDisputes, 'emerald'],
    ['Late arrivals', false, 'rose'],
    ['Cancellation rate', '2%', 'amber'],
    ['Refund rate', '0.4%', 'emerald'],
    ['Acceptance rate', '96%', 'sky'],
    ['Response time', profile.stats.responseTime, 'violet'],
  ];
  return (
    <GlassCard>
      <div className="p-4">
        <SectionTitle>Reputation Engine</SectionTitle>
        <div className="grid gap-2 md:grid-cols-3">
          {metrics.map(([label, value, tone]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] text-slate-400">{label}</div>
              <div className={cls('mt-1 text-lg font-black', tone === 'emerald' ? 'text-emerald-300' : tone === 'rose' ? 'text-rose-300' : tone === 'amber' ? 'text-amber-300' : tone === 'sky' ? 'text-sky-300' : 'text-violet-300')}>
                {typeof value === 'boolean' ? (value ? '✔' : '✖') : value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function GlobalVerification({ profile }) {
  const items = [
    ['Passport', profile.verified.passport],
    ['National ID', profile.verified.nationalId],
    ['Driver License', profile.verified.driverLicense],
    ['Police Record', profile.verified.policeRecord],
    ['Company License', profile.verified.companyLicense],
    ['Tax Number', profile.verified.taxNumber],
  ];
  return (
    <GlassCard>
      <div className="p-4">
        <SectionTitle>Global Verification</SectionTitle>
        <div className="grid gap-2 md:grid-cols-3">
          {items.map(([label, ok]) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
              <span className="text-sm text-slate-300">{label}</span>
              <span className={cls('text-sm font-black', ok ? 'text-emerald-300' : 'text-slate-500')}>{ok ? '✔' : '✖'}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function PaymentTrust({ profile }) {
  const items = [
    ['Escrow Enabled', profile.paymentTrust.escrow],
    ['Stripe Verified', profile.paymentTrust.stripe],
    ['PayPal Verified', profile.paymentTrust.paypal],
    ['Bank Verified', profile.paymentTrust.bank],
  ];
  return (
    <GlassCard>
      <div className="p-4">
        <SectionTitle>Payment Trust</SectionTitle>
        <div className="grid gap-2 md:grid-cols-2">
          {items.map(([label, ok]) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
              <span className="text-sm text-slate-300">{label}</span>
              <span className={cls('text-sm font-black', ok ? 'text-emerald-300' : 'text-slate-500')}>{ok ? '✔' : '✖'}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function LanguagesSection({ profile }) {
  return (
    <GlassCard>
      <div className="p-4">
        <SectionTitle>Languages</SectionTitle>
        <div className="space-y-3">
          {profile.languages.map(lang => (
            <div key={lang.name} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{lang.name}</span>
                <span className="text-xs text-slate-400">{'★★★★★'.slice(0, lang.level)}{'☆☆☆☆☆'.slice(0, 5 - lang.level)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function SkillsSection({ profile }) {
  return (
    <GlassCard>
      <div className="p-4">
        <SectionTitle>Skills</SectionTitle>
        <div className="space-y-3">
          {profile.skills.map(skill => (
            <div key={skill.name} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{skill.name}</span>
                <span className="text-xs font-black text-amber-300">{skill.level}%</span>
              </div>
              <div className="mt-2"><ProgressBar value={skill.level} className="bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400" /></div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PublicProfileScreen — main default export
// ─────────────────────────────────────────────────────────────────────────────
export default function PublicProfileScreen() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const motion_ = useHeroMotion();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followed, setFollowed] = useState(false);
  const [saved, setSaved] = useState(false);

  const { ref: statsRef, ready: statsReady } = useDeferredSection(0);
  const { ref: timelineRef, ready: timelineReady } = useDeferredSection(80);
  const { ref: reviewsRef, ready: reviewsReady } = useDeferredSection(160);
  const { ref: trustRef, ready: trustReady } = useDeferredSection(240);
  const { ref: aiRef, ready: aiReady } = useDeferredSection(300);
  const { ref: portfolioRef, ready: portfolioReady } = useDeferredSection(360);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    API.get(`/profiles/${userId}/public`)
      .then(res => {
        if (cancelled) return;
        setProfile(res.data);
        setFollowed(isFollowing(userId));
        setSaved(isSaved(userId));
      })
      .catch(err => {
        if (cancelled) return;
        setError(err?.response?.data?.message ?? 'Profile not found');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const handleFollow = useCallback(() => {
    if (!authUser) { navigate('/login'); return; }
    if (followed) { unfollowUser(userId); setFollowed(false); }
    else { followUser(userId); setFollowed(true); }
  }, [followed, userId, authUser, navigate]);

  const handleSave = useCallback(() => {
    if (!authUser) { navigate('/login'); return; }
    if (saved) { unsaveUser(userId); setSaved(false); }
    else { saveUser(userId); setSaved(true); }
  }, [saved, userId, authUser, navigate]);

  const handleMessage = useCallback(() => {
    if (!authUser) { navigate('/login'); return; }
    navigate(`/chat?with=${userId}`);
  }, [userId, authUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: BG }}>
        <div className="p-4 space-y-4">
          <SkeletonBlock className="h-64 w-full" />
          <SkeletonBlock className="h-32 w-full" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center p-8">
          <p className="text-lg font-bold text-white mb-2">{error ?? 'Profile unavailable'}</p>
          <button onClick={() => navigate(-1)} className="text-sm text-amber-400 underline">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: BG }}>
      <HeroSection
        profile={profile}
        followed={followed}
        saved={saved}
        onFollow={handleFollow}
        onSave={handleSave}
        navigate={navigate}
        onMessage={handleMessage}
      />

      <div className="px-4 max-w-2xl mx-auto space-y-4 mt-4">
        <LivePresenceCard profile={profile} />
        <DistanceCard profile={profile} />

        {profile.skills?.length > 0 && <SkillsSection profile={profile} />}
        {profile.languages?.length > 0 && <LanguagesSection profile={profile} />}

        <ReputationEngine profile={profile} />
        <GlobalVerification profile={profile} />
        <PaymentTrust profile={profile} />
        <AIResumeActions />

        <div ref={statsRef}>
          {statsReady && (
            <Suspense fallback={<SkeletonBlock className="h-40 w-full" />}>
              <StatsSection profile={profile} />
            </Suspense>
          )}
        </div>

        <div ref={timelineRef}>
          {timelineReady && (
            <Suspense fallback={<SkeletonBlock className="h-40 w-full" />}>
              <TimelineSection profile={profile} />
            </Suspense>
          )}
        </div>

        <div ref={reviewsRef}>
          {reviewsReady && (
            <Suspense fallback={<SkeletonBlock className="h-40 w-full" />}>
              <ReviewsSection profile={profile} />
            </Suspense>
          )}
        </div>

        <div ref={trustRef}>
          {trustReady && (
            <Suspense fallback={<SkeletonBlock className="h-40 w-full" />}>
              <TrustCenterSection profile={profile} />
            </Suspense>
          )}
        </div>

        <div ref={aiRef}>
          {aiReady && (
            <Suspense fallback={<SkeletonBlock className="h-40 w-full" />}>
              <AICareerSection profile={profile} />
            </Suspense>
          )}
        </div>

        <div ref={portfolioRef}>
          {portfolioReady && (
            <Suspense fallback={<SkeletonBlock className="h-40 w-full" />}>
              <PortfolioSection profile={profile} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
 