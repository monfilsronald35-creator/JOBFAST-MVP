import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getRoleDefaultPath } from "@/config/roleConfig";

// Layouts & UI Components
import MainLayout from "@/components/MainLayout";
import AdminLayout from "@/components/AdminLayout";
import PublicLayout from "@/components/PublicLayout";
import Loader from "@/components/Loader";

// Auth & Public Pages
import SplashScreen    from "@/pages/SplashScreen.jsx";
import Onboarding      from "@/pages/Onboarding.jsx";
import RegisterScreen  from "@/pages/Register/index.jsx";
import LoginScreen     from "@/pages/Login.jsx";
import ForgotPassword  from "@/pages/ForgotPassword/index.jsx";
import VerifyLogin     from "@/pages/VerifyLogin/index.jsx";
import TwoFA           from "@/pages/TwoFA/index.jsx";

// Protected Pages
import Dashboard from "@/pages/Dashboard.jsx";
import PostJobScreen from "@/pages/PostJobScreen.jsx";
import AvailabilityStatus from "@/pages/AvailabilityStatus.jsx";
import ProfileScreen from "@/pages/ProfileScreen.jsx";
import SearchScreen from "@/pages/SearchScreen.jsx";
import NotificationsCenter from "@/pages/NotificationsCenter.jsx";
import HomeMarketplace from "@/pages/HomeMarketplace.jsx";
import CategoryMarketplace from "@/pages/CategoryMarketplace.jsx";
import UserProfileDisplay from "@/pages/UserProfileDisplay.jsx";
import ChatScreen from "@/pages/ChatScreen.jsx";
import MapNavigationScreen from "@/pages/MapNavigationScreen.jsx";
import PublicProfileScreen from "@/pages/PublicProfileScreen.jsx";
import MarketPage               from "@/pages/Market/index.jsx";
import WalletPage               from "@/pages/Wallet/index.jsx";
import UniversalSearch          from "@/pages/UniversalSearch/index.jsx";
import SmartNotifications       from "@/pages/SmartNotifications/index.jsx";
import JobsHub                  from "@/pages/Jobs/index.jsx";
import BookingPage              from "@/pages/Booking/index.jsx";
import EscrowPage               from "@/pages/Escrow/index.jsx";
import ProfessionDetailPage     from "@/pages/Profession/index.jsx";
import WorkerProfilePage        from "@/pages/WorkerProfile/index.jsx";
import ServiceProviderDashboard from "@/pages/ServiceProviderDashboard/index.jsx";
import EnterpriseDashboard      from "@/pages/EnterpriseDashboard/index.jsx";
import CreatePostScreen         from "@/pages/CreatePost/index.jsx";

// Business Verticals
import Hotels          from "@/pages/Hotels/index.jsx";
import Restaurants     from "@/pages/Restaurants/index.jsx";
import Transport       from "@/pages/Transport/index.jsx";
import Hospitals       from "@/pages/Hospitals/index.jsx";
import Tourism         from "@/pages/Tourism/index.jsx";
import Education       from "@/pages/Education/index.jsx";
import Events          from "@/pages/Events/index.jsx";
import Insurance       from "@/pages/Insurance/index.jsx";
import Banking         from "@/pages/Banking/index.jsx";
import AIAssistant     from "@/pages/AIAssistant/index.jsx";
import Stories         from "@/pages/Stories/index.jsx";

// Role Dashboards (sub-components — need user/tab from context)
import WorkerContent    from "@/pages/worker/WorkerDashboard.jsx";
import CompanyDashboard from "@/pages/company/CompanyDashboard.jsx";

// ── Error Boundary ─────────────────────────────────────────────────────────────

interface AppErrorBoundaryProps  { children: React.ReactNode; }
interface AppErrorBoundaryState  { hasError: boolean; errorMsg: string; }

class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return { hasError: true, errorMsg: error?.message || '' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Log to console so dev tools on iOS (via Mac Safari remote debug) can see it
    try { console.error('[JOBFAST ERROR]', error?.message, info?.componentStack?.slice(0, 300)); } catch (_e) {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#050B18', color: '#f8fafc',
          gap: '16px', padding: '24px', textAlign: 'center',
          zIndex: 99999,
        }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>Yon erè te rive</p>
          <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: 280 }}>
            Tanpri refrechi paj la pou kontinye
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{ padding: '14px 32px', background: '#FACC15', color: '#020617', fontWeight: 900, borderRadius: '14px', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          >
            Refrechi
          </button>
          <button
            onClick={() => { window.history.back(); this.setState({ hasError: false }); }}
            style={{ padding: '10px 24px', background: 'transparent', color: '#64748b', fontWeight: 700, borderRadius: '12px', border: '1px solid #1F2937', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            ← Retounen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy import with one automatic retry on network failure (fixes blank page on bad iPad connections)
const lazyWithRetry = (importFn: () => Promise<{ default: React.ComponentType }>) =>
  lazy(() => importFn().catch(() => importFn()));

// Admin Pages (Lazy Loaded for better performance — with auto-retry on network failure)
const AdminDashboard  = lazyWithRetry(() => import("@/pages/admin/AdminDashboard.jsx"));
const AdminUsers      = lazyWithRetry(() => import("@/pages/admin/AdminUsers.jsx"));
const AdminJobs       = lazyWithRetry(() => import("@/pages/admin/AdminJobs.jsx"));
const AdminSupport    = lazyWithRetry(() => import("@/pages/admin/AdminSupport.jsx"));
const AdminSettings   = lazyWithRetry(() => import("@/pages/admin/AdminSettings.jsx"));
const AdminGovernance = lazyWithRetry(() => import("@/pages/admin/AdminGovernance.jsx"));

// ── Security Gates ────────────────────────────────────────────────────────

interface GateProps { children: React.ReactNode; }

// AuthGate: any authenticated user; admin/super_admin are redirected to /admin
const AuthGate = ({ children }: GateProps) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <Loader text="Loading session..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = user?.role;
  if (role === "admin" || role === "super_admin") {
    return <Navigate to="/admin" replace />;
  }
  return <MainLayout>{children}</MainLayout>;
};

// GuestGate: unauthenticated only; redirects to role-specific default path on login
const GuestGate = ({ children }: GateProps) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <Loader text="Loading application..." />;
  if (isAuthenticated) {
    return <Navigate to={getRoleDefaultPath(user?.role ?? 'worker')} replace />;
  }
  return <>{children}</>;
};

// AdminGate: admin AND super_admin only
const AdminGate = ({ children }: GateProps) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <Loader text="Loading admin panel..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const isAdminRole = user?.role === "admin" || user?.role === "super_admin";
  if (!isAdminRole) return <Navigate to="/dashboard" replace />;
  return <AdminLayout>{children}</AdminLayout>;
};

// SmartRoot: authenticated users go straight to their dashboard; others see Splash
const SmartRoot = () => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div style={{ background: '#050B18', minHeight: '100vh' }} />;
  if (isAuthenticated) return <Navigate to={getRoleDefaultPath(user?.role ?? 'worker')} replace />;
  return <SplashScreen />;
};

// Standalone wrappers for role-specific dashboard components that expect props
const WorkerDashboardPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = React.useState('profile');
  return <WorkerContent tab={tab} user={user} jobs={[]} />;
};

const CompanyDashboardPage = () => {
  const { user } = useAuth();
  return <CompanyDashboard user={user} />;
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <Suspense fallback={<Loader text="Loading application..." />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<SmartRoot />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/home" element={<PublicLayout><HomeMarketplace /></PublicLayout>} />

            {/* Auth Routes */}
            <Route path="/register" element={<GuestGate><RegisterScreen /></GuestGate>} />
            <Route path="/login" element={<GuestGate><LoginScreen /></GuestGate>} />
            <Route path="/forgot-password" element={<GuestGate><ForgotPassword /></GuestGate>} />
            <Route path="/verify-login"   element={<VerifyLogin />} />
            <Route path="/2fa"            element={<TwoFA />} />

            {/* Protected User Routes */}
            <Route path="/dashboard" element={<AuthGate><Dashboard /></AuthGate>} />
            <Route path="/marketplace" element={<AuthGate><HomeMarketplace /></AuthGate>} />
            <Route path="/marketplace/:categoryId" element={<AuthGate><CategoryMarketplace /></AuthGate>} />
            <Route path="/post-job" element={<AuthGate><PostJobScreen /></AuthGate>} />
            <Route path="/status" element={<AuthGate><AvailabilityStatus /></AuthGate>} />
            <Route path="/profile" element={<AuthGate><UserProfileDisplay /></AuthGate>} />
            <Route path="/search" element={<AuthGate><UniversalSearch /></AuthGate>} />
            <Route path="/jobs"   element={<AuthGate><JobsHub /></AuthGate>} />

            {/* Additional Protected Routes */}
            <Route path="/edit-profile" element={<AuthGate><ProfileScreen /></AuthGate>} />
            <Route path="/settings" element={<AuthGate><ProfileScreen /></AuthGate>} />
            <Route path="/job-history" element={<AuthGate><Dashboard /></AuthGate>} />
            <Route path="/notifications"       element={<AuthGate><SmartNotifications  /></AuthGate>} />
            <Route path="/smart-notifications" element={<AuthGate><SmartNotifications  /></AuthGate>} />
            <Route path="/chat" element={<AuthGate><ChatScreen /></AuthGate>} />
            <Route path="/chat/:id" element={<AuthGate><ChatScreen /></AuthGate>} />
            <Route path="/u/:userId" element={<AuthGate><PublicProfileScreen /></AuthGate>} />
            <Route path="/rating/:id" element={<AuthGate><PublicProfileScreen /></AuthGate>} />
            <Route path="/booking/:id" element={<AuthGate><BookingPage /></AuthGate>} />
            <Route path="/map"    element={<AuthGate><MapNavigationScreen /></AuthGate>} />
            <Route path="/market"            element={<AuthGate><MarketPage               /></AuthGate>} />
            <Route path="/wallet"            element={<AuthGate><WalletPage               /></AuthGate>} />
            <Route path="/booking"           element={<AuthGate><BookingPage              /></AuthGate>} />
            <Route path="/escrow"            element={<AuthGate><EscrowPage               /></AuthGate>} />
            <Route path="/profession/:professionId" element={<AuthGate><ProfessionDetailPage /></AuthGate>} />
            <Route path="/worker-profile"    element={<AuthGate><WorkerProfilePage        /></AuthGate>} />
            <Route path="/provider-dashboard"   element={<AuthGate><ServiceProviderDashboard /></AuthGate>} />
            <Route path="/enterprise-dashboard" element={<AuthGate><EnterpriseDashboard      /></AuthGate>} />
            <Route path="/create-post"          element={<AuthGate><CreatePostScreen         /></AuthGate>} />

            {/* Business Verticals */}
            <Route path="/hotels"          element={<AuthGate><Hotels      /></AuthGate>} />
            <Route path="/restaurants"     element={<AuthGate><Restaurants /></AuthGate>} />
            <Route path="/transport"       element={<AuthGate><Transport   /></AuthGate>} />
            <Route path="/hospitals"       element={<AuthGate><Hospitals   /></AuthGate>} />
            <Route path="/tourism"         element={<AuthGate><Tourism     /></AuthGate>} />
            <Route path="/education"       element={<AuthGate><Education   /></AuthGate>} />
            <Route path="/events"          element={<AuthGate><Events      /></AuthGate>} />
            <Route path="/insurance"       element={<AuthGate><Insurance   /></AuthGate>} />
            <Route path="/banking"           element={<AuthGate><Banking          /></AuthGate>} />
            <Route path="/ai-assistant"    element={<AuthGate><AIAssistant      /></AuthGate>} />
            <Route path="/stories"         element={<AuthGate><Stories          /></AuthGate>} />
            <Route path="/worker-dashboard"  element={<AuthGate><WorkerDashboardPage  /></AuthGate>} />
            <Route path="/company-dashboard" element={<AuthGate><CompanyDashboardPage /></AuthGate>} />

            {/* Admin Routes */}
            <Route path="/admin"            element={<AdminGate><AdminDashboard  /></AdminGate>} />
            <Route path="/admin/users"      element={<AdminGate><AdminUsers      /></AdminGate>} />
            <Route path="/admin/jobs"       element={<AdminGate><AdminJobs       /></AdminGate>} />
            <Route path="/admin/support"    element={<AdminGate><AdminSupport    /></AdminGate>} />
            <Route path="/admin/settings"   element={<AdminGate><AdminSettings   /></AdminGate>} />
            <Route path="/admin/governance" element={<AdminGate><AdminGovernance /></AdminGate>} />

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}

export default AppRoutes;