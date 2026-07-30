import React, {
  useState,
  useEffect,
  useMemo,
  lazy,
  Suspense,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  ShieldCheck,
  Globe2,
  QrCode,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ReputationBadge from '../../components/ReputationBadge';
import API from '../../api/axios';

const PortfolioSection = lazy(() => import('./sections/PortfolioSection'));
const ExperienceSection = lazy(() => import('./sections/ExperienceSection'));
const WalletSection     = lazy(() => import('./sections/WalletSection'));
const CalendarSection   = lazy(() => import('./sections/CalendarSection'));
const MessagesSection   = lazy(() => import('./sections/MessagesSection'));
const MapSection        = lazy(() => import('./sections/MapSection'));
const ReviewsSection    = lazy(() => import('./sections/ReviewsSection'));
const SkillsSection     = lazy(() => import('./sections/SkillsSection'));

const AVAILABILITY_OPTIONS = [
  'available', 'busy', 'vacation', 'on_mission', 'emergency',
  'offline', 'remote_only', 'travel_ready', 'night_shift', 'weekend', 'instant_hire',
] as const;

type AvailOption = typeof AVAILABILITY_OPTIONS[number];

interface AvailConfig { color: string; bg: string; label: string }
const AVAIL_CFG: Record<AvailOption, AvailConfig> = {
  available:    { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Disponib' },
  busy:         { color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'Okipe' },
  vacation:     { color: 'text-sky-400',     bg: 'bg-sky-500/10',     label: 'Vakans' },
  on_mission:   { color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  label: 'Sou Misyon' },
  emergency:    { color: 'text-rose-400',    bg: 'bg-rose-500/10',    label: 'Ijans' },
  offline:      { color: 'text-slate-400',   bg: 'bg-slate-700/60',   label: 'Offline' },
  remote_only:  { color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    label: 'Remote Only' },
  travel_ready: { color: 'text-lime-400',    bg: 'bg-lime-500/10',    label: 'Pare pou Vwayaj' },
  night_shift:  { color: 'text-purple-400',  bg: 'bg-purple-500/10',  label: 'Night Shift' },
  weekend:      { color: 'text-orange-400',  bg: 'bg-orange-500/10',  label: 'Weekend' },
  instant_hire: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Instant Hire' },
};

const TABS_DEF = [
  { id: 'passport',   label: 'Digital Passport' },
  { id: 'career',     label: 'AI Career Engine' },
  { id: 'analytics',  label: 'Live Analytics' },
  { id: 'skills',     label: 'Skills Center' },
  { id: 'portfolio',  label: 'Portfolio' },
  { id: 'experience', label: 'Experience' },
  { id: 'documents',  label: 'Vault' },
  { id: 'wallet',     label: 'Wallet' },
  { id: 'calendar',   label: 'Calendar' },
  { id: 'messages',   label: 'Messaging' },
  { id: 'map',        label: 'Map' },
  { id: 'reviews',    label: 'Reviews' },
  { id: 'saved',      label: 'Saved Jobs' },
] as const;

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-800/60 rounded-xl ${className ?? ''}`} />
);

interface TBProps { tabId: string; children: React.ReactNode }
interface TBState { hasError: boolean }
class TabErrorBoundary extends React.Component<TBProps, TBState> {
  state: TBState = { hasError: false };
  static getDerivedStateFromError(): TBState { return { hasError: true }; }
  componentDidCatch(_error: Error, _info: React.ErrorInfo): void {}
  handleRetry = (): void => { this.setState({ hasError: false }); };
  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-rose-950/60 border border-rose-500/40 rounded-2xl">
          <p className="text-xs text-rose-200 font-semibold mb-2">
            Yon erè fèt nan seksyon sa a.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-3 py-1.5 rounded-lg bg-rose-500 text-xs font-bold text-white"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MemoSuspense = React.memo(function MemoSuspense({
  fallback,
  children,
}: {
  fallback: React.ReactNode;
  children: React.ReactNode;
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
});

interface PassportData {
  blockchainWalletStatus?: string;
  didStatus?: string;
  nftCertificatesStatus?: string;
  verifiedSkillsCount?: number;
  verifiedDiplomaCount?: number;
  backgroundStatus?: string;
  aiCriminalCheckStatus?: string;
  financialTrustScore?: number;
  payrollHistorySummary?: string;
  taxHistorySummary?: string;
  employmentTimelineSummary?: string;
  globalEmploymentNumber?: string;
  aiIdentityStatus?: string;
}

interface CareerData {
  promotionScore?: number;
  futureSalary?: number;
}

interface AnalyticsData {
  aiDashboard?: Record<string, unknown>;
  liveWeather?: string;
  liveTraffic?: string;
  liveMission?: string;
  driverModeStatus?: string;
  eta?: string;
  lifetimeRevenue?: string | number;
  revenueByCountrySummary?: string;
  revenueByClientSummary?: string;
  averageHour?: string;
  activeHours?: string;
  idleHours?: string;
  productivityScore?: string;
  heatmapStatus?: string;
  carbonFootprint?: string;
  taxesSummary?: string;
  expensesSummary?: string;
  equipmentSummary?: string;
  aiScore?: string;
  reviewsTrend?: string;
  globalRanking?: string;
  countryRanking?: string;
  companyRanking?: string;
  cityRanking?: string;
  completionRate?: string | number;
  acceptanceRate?: string | number;
  cancelRate?: string | number;
  travelDistance?: string | number;
  fuelConsumed?: string;
  roi?: string;
}

interface SavedJob {
  _id: string;
  title?: string;
  company?: string;
  salary?: string;
  city?: string;
}

interface Notification {
  type: string;
  [key: string]: unknown;
}

export default function WorkerProfilePage() {
  const { t }    = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth() as { user: unknown };
  const u = user as Record<string, unknown> | null;

  const [tab,   setTab]   = useState<string>('passport');
  const [avail, setAvail] = useState<string>(
    (u?.['availability'] as string | undefined) ?? 'available'
  );

  const [passportData,  setPassportData]  = useState<PassportData | null>(null);
  const [careerData,    setCareerData]    = useState<CareerData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [reviewsData,   setReviewsData]   = useState<unknown>(null);
  const [walletData,    setWalletData]    = useState<unknown>(null);
  const [savedJobs,     setSavedJobs]     = useState<SavedJob[]>([]);
  const [mapData,       setMapData]       = useState<unknown>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messagingData, setMessagingData] = useState<unknown>(null);
  const [portfolioData, setPortfolioData] = useState<unknown>(null);

  const [loading, setLoading] = useState(true);

  const stats       = (u?.['stats'] as Record<string, number> | undefined) ?? {};
  const completedJobs = stats['totalJobs'] ?? 0;
  const rating        = stats['rating']    ?? 0;
  const reviewCount   = stats['reviews']   ?? 0;

  const profileMeta  = (u?.['profileMetadata'] as Record<string, unknown> | undefined) ?? {};
  const avatarSrc    = (profileMeta['profilePhoto'] as string | undefined)
    ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent((u?.['name'] as string | undefined) ?? 'user')}`;

  useEffect(() => {
    let isMounted = true;

    async function fetchAll() {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          API.get('/api/ai/career'),
          API.get('/api/profile/passport'),
          API.get('/api/analytics'),
          API.get('/api/reviews'),
          API.get('/api/wallet'),
          API.get('/api/jobs/saved'),
          API.get('/api/map/worker'),
          API.get('/api/notifications'),
          API.get('/api/messaging/summary'),
          API.get('/api/portfolio'),
        ]);

        if (!isMounted) return;

        const [
          careerRes, passportRes, analyticsRes, reviewsRes, walletRes,
          savedRes,  mapRes,      notifRes,     messagingRes, portfolioRes,
        ] = results;

        if (careerRes.status    === 'fulfilled') setCareerData(careerRes.value.data as CareerData);
        if (passportRes.status  === 'fulfilled') setPassportData(passportRes.value.data as PassportData);
        if (analyticsRes.status === 'fulfilled') setAnalyticsData(analyticsRes.value.data as AnalyticsData);
        if (reviewsRes.status   === 'fulfilled') setReviewsData(reviewsRes.value.data);
        if (walletRes.status    === 'fulfilled') setWalletData(walletRes.value.data);
        if (savedRes.status     === 'fulfilled') setSavedJobs((savedRes.value.data as SavedJob[] | null) ?? []);
        if (mapRes.status       === 'fulfilled') setMapData(mapRes.value.data);
        if (notifRes.status     === 'fulfilled') setNotifications((notifRes.value.data as Notification[] | null) ?? []);
        if (messagingRes.status === 'fulfilled') setMessagingData(messagingRes.value.data);
        if (portfolioRes.status === 'fulfilled') setPortfolioData(portfolioRes.value.data);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void fetchAll();
    return () => { isMounted = false; };
  }, []);

  const handleAvailabilityChange = useCallback(async (a: string): Promise<void> => {
    setAvail(a);
    try { await API.put('/users/availability', { availability: a }); } catch { }
  }, []);

  const now        = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString();

  const aiDashboard = useMemo(() => {
    const d = (analyticsData?.aiDashboard ?? {}) as Record<string, unknown>;
    return {
      missionsToday:          (d['missionsToday']          as number  | undefined) ?? 0,
      recommendedJobs:        (d['recommendedJobs']        as number  | undefined) ?? 0,
      companiesInterested:    (d['companiesInterested']    as number  | undefined) ?? 0,
      contracts:              (d['contracts']              as number  | undefined) ?? 0,
      payments:               (d['payments']               as number  | undefined) ?? 0,
      promotionSignal:        (d['promotionSignal']        as string  | undefined) ?? '—',
      riskSignal:             (d['riskSignal']             as string  | undefined) ?? '—',
      marketSignal:           (d['marketSignal']           as string  | undefined) ?? '—',
      salarySignal:           (d['salarySignal']           as string  | undefined) ?? '—',
      learningSignal:         (d['learningSignal']         as string  | undefined) ?? '—',
      burnoutScore:           (d['burnoutScore']           as string  | undefined) ?? '--',
      healthScore:            (d['healthScore']            as string  | undefined) ?? '--',
      careerPrediction:       (d['careerPrediction']       as string  | undefined) ?? '—',
      futureSalary:           (d['futureSalary']           as string  | undefined) ?? '--',
      retirementProjection:   (d['retirementProjection']   as string  | undefined) ?? '—',
      fraudDetection:         (d['fraudDetection']         as string  | undefined) ?? '—',
      employmentStability:    (d['employmentStability']    as string  | undefined) ?? '—',
      countryRecommendation:  (d['countryRecommendation']  as string  | undefined) ?? '—',
      visaPrediction:         (d['visaPrediction']         as string  | undefined) ?? '—',
      immigrationEligibility: (d['immigrationEligibility'] as string  | undefined) ?? '—',
      globalDemand:           (d['globalDemand']           as string  | undefined) ?? '—',
      marketForecast:         (d['marketForecast']         as string  | undefined) ?? '—',
      jobReplacementRisk:     (d['jobReplacementRisk']     as string  | undefined) ?? '—',
      skillsForecast:         (d['skillsForecast']         as string  | undefined) ?? '—',
      hiringProbability:      (d['hiringProbability']      as string  | undefined) ?? '—',
    };
  }, [analyticsData]);

  const heroVariant = {
    hidden:  { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };
  const pulseVariant = {
    animate: {
      scale:   [1, 1.05, 1],
      opacity: [0.6, 1, 0.6],
      transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
    },
  };

  const notificationGroups = useMemo(() => {
    const list = notifications ?? [];
    return {
      promotion:      list.filter(n => n.type === 'promotion'),
      salary:         list.filter(n => n.type === 'salary'),
      jobs:           list.filter(n => n.type === 'job'),
      reviews:        list.filter(n => n.type === 'review'),
      messages:       list.filter(n => n.type === 'message'),
      contracts:      list.filter(n => n.type === 'contract'),
      visa:           list.filter(n => n.type === 'visa'),
      recommendation: list.filter(n => n.type === 'ai_recommendation'),
    };
  }, [notifications]);

  const loc = (u?.['location'] as Record<string, string> | undefined) ?? {};

  const renderTabContent = (): React.ReactNode => {
    if (loading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-32" />
        </div>
      );
    }

    switch (tab) {
      case 'passport':
        return (
          <TabErrorBoundary tabId="passport">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="p-4 bg-black/50 border border-white/10 rounded-2xl backdrop-blur-xl">
                <p className="text-xs text-cyan-300 mb-1">JOBFAST GLOBAL DIGITAL PASSPORT</p>
                <p className="text-[11px] text-slate-200 mb-2">
                  NFT Worker Identity • Blockchain Wallet • Decentralized DID • NFT Certificates • Verified Skills • Verified Diploma • Background Check • AI Criminal Check • AI Financial Trust • Payroll History • Tax History • Employment Timeline • Global Employment Number.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-100">
                  <span>Blockchain Wallet: {passportData?.blockchainWalletStatus ?? '—'}</span>
                  <span>Digital Identity (DID): {passportData?.didStatus ?? '—'}</span>
                  <span>NFT Certificates: {passportData?.nftCertificatesStatus ?? '—'}</span>
                  <span>Verified Skills: {passportData?.verifiedSkillsCount ?? 0}</span>
                  <span>Verified Diploma: {passportData?.verifiedDiplomaCount ?? 0}</span>
                  <span>Background Check: {passportData?.backgroundStatus ?? '—'}</span>
                  <span>AI Criminal Check: {passportData?.aiCriminalCheckStatus ?? '—'}</span>
                  <span>AI Financial Trust: {passportData?.financialTrustScore ?? '--'}%</span>
                  <span>Payroll History: {passportData?.payrollHistorySummary ?? '—'}</span>
                  <span>Tax History: {passportData?.taxHistorySummary ?? '—'}</span>
                  <span>Employment Timeline: {passportData?.employmentTimelineSummary ?? '—'}</span>
                  <span>Global Employment Number: {passportData?.globalEmploymentNumber ?? '—'}</span>
                </div>
              </div>
              <div className="p-4 bg-black/60 border border-white/15 rounded-2xl backdrop-blur-xl flex flex-col justify-center items-center">
                <QrCode className="w-16 h-16 text-slate-100" />
                <p className="mt-2 text-[11px] text-slate-200">
                  Scan this QR code to access your Digital Passport in HR, payroll, compliance, immigration and government systems.
                </p>
              </div>
            </div>
          </TabErrorBoundary>
        );

      case 'career':
        return (
          <TabErrorBoundary tabId="career">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="p-4 bg-black/50 border border-white/10 rounded-2xl">
                <p className="text-xs text-slate-300 mb-2">AI Career Engine</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-100">
                  <span>Promotion Score: {careerData?.promotionScore ?? '--'}%</span>
                  <span>Future Salary: ${careerData?.futureSalary ?? '--'}</span>
                  <span>AI Career Prediction: {aiDashboard.careerPrediction}</span>
                  <span>AI Retirement Projection: {aiDashboard.retirementProjection}</span>
                  <span>AI Employment Stability: {aiDashboard.employmentStability}</span>
                  <span>AI Country Recommendation: {aiDashboard.countryRecommendation}</span>
                  <span>AI Visa Prediction: {aiDashboard.visaPrediction}</span>
                  <span>AI Immigration Eligibility: {aiDashboard.immigrationEligibility}</span>
                  <span>AI Global Demand: {aiDashboard.globalDemand}</span>
                  <span>AI Market Forecast: {aiDashboard.marketForecast}</span>
                  <span>AI Job Replacement Risk: {aiDashboard.jobReplacementRisk}</span>
                  <span>AI Skills Forecast: {aiDashboard.skillsForecast}</span>
                  <span>AI Hiring Probability: {aiDashboard.hiringProbability}</span>
                </div>
              </div>
              <div className="p-4 bg-black/50 border border-white/10 rounded-2xl">
                <p className="text-xs text-slate-300 mb-2">AI Health &amp; Fraud</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-100">
                  <span>AI Burnout Score: {aiDashboard.burnoutScore}</span>
                  <span>AI Health Score: {aiDashboard.healthScore}</span>
                  <span>AI Fraud Detection: {aiDashboard.fraudDetection}</span>
                  <span>AI Financial Trust: {passportData?.financialTrustScore ?? '--'}%</span>
                </div>
              </div>
            </div>
          </TabErrorBoundary>
        );

      case 'analytics':
        return (
          <TabErrorBoundary tabId="analytics">
            <div className="p-4 bg-black/50 border border-white/10 rounded-2xl">
              <p className="text-xs text-slate-300 mb-2">Live Analytics</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] text-slate-100">
                <span>Lifetime Revenue: ${analyticsData?.lifetimeRevenue}</span>
                <span>Revenue by Country: {analyticsData?.revenueByCountrySummary}</span>
                <span>Revenue by Client: {analyticsData?.revenueByClientSummary}</span>
                <span>Average Hour: {analyticsData?.averageHour}</span>
                <span>Active Hours: {analyticsData?.activeHours}</span>
                <span>Idle Hours: {analyticsData?.idleHours}</span>
                <span>Productivity: {analyticsData?.productivityScore}</span>
                <span>Heatmap: {analyticsData?.heatmapStatus}</span>
                <span>Carbon Footprint: {analyticsData?.carbonFootprint}</span>
                <span>Taxes: {analyticsData?.taxesSummary}</span>
                <span>Expenses: {analyticsData?.expensesSummary}</span>
                <span>Equipment Cost: {analyticsData?.equipmentSummary}</span>
                <span>AI Score: {analyticsData?.aiScore}</span>
                <span>Reviews Trend: {analyticsData?.reviewsTrend}</span>
                <span>Global Ranking: {analyticsData?.globalRanking}</span>
                <span>Country Ranking: {analyticsData?.countryRanking}</span>
                <span>Company Ranking: {analyticsData?.companyRanking}</span>
                <span>City Ranking: {analyticsData?.cityRanking}</span>
                <span>Completion Rate: {analyticsData?.completionRate}%</span>
                <span>Acceptance Rate: {analyticsData?.acceptanceRate}%</span>
                <span>Cancel Rate: {analyticsData?.cancelRate}%</span>
                <span>Travel Distance: {analyticsData?.travelDistance} km</span>
                <span>Fuel Consumed: {analyticsData?.fuelConsumed}</span>
                <span>ROI: {analyticsData?.roi}</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-300">
                Virtualized lists, Intersection Observer, Image CDN, compression, Service Worker, offline cache, IndexedDB, background sync ap sipòte charts yo pou super app mondyal la.
              </p>
            </div>
          </TabErrorBoundary>
        );

      case 'skills':
        return (
          <TabErrorBoundary tabId="skills">
            <MemoSuspense fallback={<Skeleton className="h-32" />}>
              <SkillsSection analyticsData={analyticsData} careerData={careerData} />
            </MemoSuspense>
          </TabErrorBoundary>
        );

      case 'portfolio':
        return (
          <TabErrorBoundary tabId="portfolio">
            <MemoSuspense fallback={<Skeleton className="h-32" />}>
              <PortfolioSection data={portfolioData} navigate={navigate} />
            </MemoSuspense>
          </TabErrorBoundary>
        );

      case 'experience':
        return (
          <TabErrorBoundary tabId="experience">
            <MemoSuspense fallback={<Skeleton className="h-32" />}>
              <ExperienceSection user={user} navigate={navigate} />
            </MemoSuspense>
          </TabErrorBoundary>
        );

      case 'documents':
        return (
          <TabErrorBoundary tabId="documents">
            <div className="p-4 bg-black/50 border border-white/10 rounded-2xl">
              <p className="text-xs text-slate-300 mb-2">Documents Vault &amp; Security</p>
              <p className="text-[11px] text-slate-200 mb-2">
                Biometric Login (Face ID, Fingerprint) • Device Trust • Zero Trust • Session Manager • AI Fraud • JWT Rotation • Refresh Token • Audit Logs • Encryption • Secure Vault ak multi‑tenant, white‑label, HR/Payroll/Compliance dashboards.
              </p>
            </div>
          </TabErrorBoundary>
        );

      case 'wallet':
        return (
          <TabErrorBoundary tabId="wallet">
            <MemoSuspense fallback={<Skeleton className="h-32" />}>
              <WalletSection walletData={walletData} />
            </MemoSuspense>
          </TabErrorBoundary>
        );

      case 'calendar':
        return (
          <TabErrorBoundary tabId="calendar">
            <MemoSuspense fallback={<Skeleton className="h-32" />}>
              <CalendarSection analyticsData={analyticsData} />
            </MemoSuspense>
          </TabErrorBoundary>
        );

      case 'messages':
        return (
          <TabErrorBoundary tabId="messages">
            <MemoSuspense fallback={<Skeleton className="h-32" />}>
              <MessagesSection messagingData={messagingData} />
            </MemoSuspense>
          </TabErrorBoundary>
        );

      case 'map':
        return (
          <TabErrorBoundary tabId="map">
            <MemoSuspense fallback={<Skeleton className="h-40" />}>
              <MapSection data={mapData} />
            </MemoSuspense>
          </TabErrorBoundary>
        );

      case 'reviews':
        return (
          <TabErrorBoundary tabId="reviews">
            <MemoSuspense fallback={<Skeleton className="h-32" />}>
              <ReviewsSection reviewsData={reviewsData} />
            </MemoSuspense>
          </TabErrorBoundary>
        );

      case 'saved':
        return (
          <TabErrorBoundary tabId="saved">
            <div>
              <p className="text-xs text-slate-300 uppercase tracking-wide font-bold mb-3">
                Saved Jobs
              </p>
              {savedJobs.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <span className="text-4xl">🔖</span>
                  <p className="text-xs text-slate-500">
                    Pa gen travay sove.
                  </p>
                </div>
              ) : savedJobs.map(job => (
                <div key={job._id} className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl mb-3">
                  <p className="font-bold text-white text-sm">{job.title}</p>
                  <p className="text-xs text-slate-400">{job.company}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px]">
                    <span className="text-emerald-300 font-bold">{job.salary}</span>
                    <span className="text-slate-400">📍 {job.city}</span>
                    <button
                      type="button"
                      onClick={() => setSavedJobs(p => p.filter(j => j._id !== job._id))}
                      className="ml-auto text-xs text-rose-400 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabErrorBoundary>
        );

      default:
        return null;
    }
  };

  const heroBackgroundUrl = (profileMeta['heroBackgroundUrl'] as string | undefined) ?? '/images/worker-hero-8k.jpg';

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white pb-28">
      <div className="fixed inset-0 -z-10 bg-slate-950">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{ backgroundImage: `url(${heroBackgroundUrl})` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.25),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(129,140,248,0.35),transparent_50%)] mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.4),rgba(15,23,42,0.9))]" />
      </div>

      <div className="relative">
        <motion.div
          variants={pulseVariant}
          animate="animate"
          className="absolute inset-x-4 top-4 h-32 rounded-3xl bg-gradient-to-r from-cyan-500/25 via-slate-900/80 to-indigo-600/25 blur-3xl"
        />

        <motion.div
          variants={heroVariant}
          initial="hidden"
          animate="visible"
          className="px-4 pb-4 pt-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] text-cyan-300 font-semibold">
                JOBFAST GLOBAL DIGITAL PASSPORT
              </p>
              <h1 className="text-lg font-black text-white">
                {(u?.['name'] as string | undefined) ?? 'Global Worker'}
              </h1>
              <p className="text-xs text-emerald-300 font-bold">
                {(u?.['profession'] as string | undefined) ?? '—'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="relative p-2 rounded-2xl bg-black/50 border border-white/20 backdrop-blur-xl"
                onClick={() => setTab('analytics')}
              >
                <Bell className="w-4 h-4 text-slate-100" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-[9px] px-1 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </button>
              <div className="p-2 rounded-2xl bg-black/50 border border-white/20 backdrop-blur-xl flex flex-col items-center">
                <QrCode className="w-6 h-6 text-slate-100" />
                <p className="text-[9px] text-slate-300 mt-1">
                  Global QR Code
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="relative">
              <motion.div
                className="relative w-26 h-26 rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl shadow-[0_20px_60px_rgba(15,23,42,0.95)] overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
              >
                <img
                  src={avatarSrc}
                  alt={(u?.['name'] as string | undefined) ?? 'avatar'}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />

                <motion.div
                  className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/60 backdrop-blur-xl"
                  variants={pulseVariant}
                  animate="animate"
                >
                  <span className={AVAIL_CFG[avail as AvailOption]?.color ?? 'text-slate-400'}>
                    ● {AVAIL_CFG[avail as AvailOption]?.label ?? avail}
                  </span>
                  <span className="text-sky-300">GPS Live</span>
                </motion.div>
              </motion.div>

              <div className="mt-2 space-y-1 text-[9px]">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="text-slate-200">
                    AI Identity • {passportData?.aiIdentityStatus ?? 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] text-slate-200">
                    <MapPin className="w-3 h-3 text-sky-400" />
                    <span>{loc['city'] ?? loc['country'] ?? t('worker.noLocation', { defaultValue: 'Lokasyon pa disponib' })}</span>
                    <Globe2 className="w-3 h-3 text-cyan-400" />
                    <span>Global Network</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-200">
                    <Clock className="w-3 h-3 text-amber-300" />
                    <span>{timeString} • {dateString}</span>
                    <span>• Weather: {analyticsData?.liveWeather ?? '—'}</span>
                    <span>• Traffic: {analyticsData?.liveTraffic ?? '—'}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-emerald-300">
                    Live mission: {analyticsData?.liveMission ?? 'No active mission'}
                  </div>
                  <div className="mt-1 text-[10px] text-sky-300">
                    Uber Driver Mode: {analyticsData?.driverModeStatus ?? 'Off'} • Live Route • ETA: {analyticsData?.eta ?? '—'} • Nearby Jobs/Companies/Hotels/Construction/Restaurants/Emergency/Hospitals ap vin sou Map tab la.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/edit-profile')}
                  className="px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-[11px] font-bold text-slate-200 shrink-0 backdrop-blur-xl"
                >
                  ✏️ {t('worker.editProfile', { defaultValue: 'Modifye' })}
                </button>
              </div>

              <div className="mt-2 rounded-2xl bg-black/40 border border-white/15 backdrop-blur-xl p-3 text-[10px] text-slate-100">
                <p className="font-semibold mb-1">
                  Good morning {(u?.['firstName'] as string | undefined) ?? (u?.['name'] as string | undefined) ?? 'Worker'}.
                </p>
                <p className="mb-1">
                  Today's Missions: {aiDashboard.missionsToday} • Recommended Jobs: {aiDashboard.recommendedJobs} • Companies Interested: {aiDashboard.companiesInterested}.
                </p>
                <p className="mb-1">
                  Contracts: {aiDashboard.contracts} • Payments: {aiDashboard.payments}.
                </p>
                <p className="text-emerald-300">
                  Promotion: {aiDashboard.promotionSignal} • Risk: {aiDashboard.riskSignal} • Market: {aiDashboard.marketSignal} • Salary: {aiDashboard.salarySignal} • Learning: {aiDashboard.learningSignal}.
                </p>
                <p className="mt-1 text-[10px] text-rose-300">
                  Burnout: {aiDashboard.burnoutScore} • Health: {aiDashboard.healthScore} • Fraud: {aiDashboard.fraudDetection} • Hiring Probability: {aiDashboard.hiringProbability}.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <ReputationBadge
              completedJobs={completedJobs}
              rating={rating}
              reviewCount={reviewCount}
              size="sm"
            />
          </div>

          <div className="mt-3">
            <p className="text-xs text-slate-300 mb-1.5">
              {t('worker.availability', { defaultValue: 'Disponibilite' })}
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {AVAILABILITY_OPTIONS.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => { void handleAvailabilityChange(a); }}
                  className={`px-2 py-1.5 rounded-xl text-[9px] font-bold border transition shrink-0 ${
                    avail === a
                      ? `${AVAIL_CFG[a].color} ${AVAIL_CFG[a].bg} border-current`
                      : 'text-slate-500 bg-slate-900/70 border-slate-700'
                  }`}
                >
                  {AVAIL_CFG[a].label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="sticky top-14 z-20 bg-slate-950/95 px-4 pb-2 pt-1 backdrop-blur-xl">
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS_DEF.map(tb => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition ${
                tab === tb.id ? 'bg-amber-500 text-slate-950' : 'bg-black/40 text-slate-300 border border-white/10'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 flex-1 space-y-4 mt-2">
        {renderTabContent()}
      </div>
    </div>
  );
}