import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";
import { getRoleDefaultPath } from "@/config/roleConfig";

// Layouts & UI Components
import MainLayout from "@/components/MainLayout.jsx";
import AdminLayout from "@/components/AdminLayout.jsx";
import PublicLayout from "@/components/PublicLayout.jsx";
import Loader from "@/components/Loader.jsx";

// Auth & Public Pages
import SplashScreen from "@/pages/SplashScreen.jsx";
import Onboarding from "@/pages/Onboarding.jsx";
import RegisterScreen from "@/pages/Register/index.jsx";
import LoginScreen from "@/pages/Login.jsx";

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

// ── Error Boundary ─────────────────────────────────────────────────────────────
// Prevents any render crash or failed lazy-chunk from showing a blank page.
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050B18', color: '#f8fafc', gap: '16px', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>Yon erè te rive</p>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Tanpri refrechi paj la pou kontinye</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '12px 28px', background: '#FACC15', color: '#020617', fontWeight: 900, borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Refrechi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy import with one automatic retry on network failure (fixes blank page on bad iPad connections)
const lazyWithRetry = (importFn) =>
  lazy(() => importFn().catch(() => importFn()));

// Admin Pages (Lazy Loaded for better performance — with auto-retry on network failure)
const AdminDashboard  = lazyWithRetry(() => import("@/pages/admin/AdminDashboard.jsx"));
const AdminUsers      = lazyWithRetry(() => import("@/pages/admin/AdminUsers.jsx"));
const AdminJobs       = lazyWithRetry(() => import("@/pages/admin/AdminJobs.jsx"));
const AdminSupport    = lazyWithRetry(() => import("@/pages/admin/AdminSupport.jsx"));
const AdminSettings   = lazyWithRetry(() => import("@/pages/admin/AdminSettings.jsx"));
const AdminGovernance = lazyWithRetry(() => import("@/pages/admin/AdminGovernance.jsx"));

// ── Security Gates ────────────────────────────────────────────────────────
// AuthGate: any authenticated user; admin/super_admin are redirected to /admin
const AuthGate = ({ children }) => {
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
const GuestGate = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <Loader text="Loading application..." />;
  if (isAuthenticated) {
    return <Navigate to={getRoleDefaultPath(user?.role)} replace />;
  }
  return <>{children}</>;
};

// AdminGate: admin AND super_admin only
const AdminGate = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <Loader text="Loading admin panel..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const isAdminRole = user?.role === "admin" || user?.role === "super_admin";
  if (!isAdminRole) return <Navigate to="/dashboard" replace />;
  return <AdminLayout>{children}</AdminLayout>;
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <Suspense fallback={<Loader text="Loading application..." />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<SplashScreen />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/home" element={<PublicLayout><HomeMarketplace /></PublicLayout>} />

            {/* Auth Routes */}
            <Route path="/register" element={<GuestGate><RegisterScreen /></GuestGate>} />
            <Route path="/login" element={<GuestGate><LoginScreen /></GuestGate>} />
            <Route path="/forgot-password" element={<GuestGate><div className="p-8 text-center"><h2 className="text-2xl font-bold mb-4">Forgot Password</h2><p className="text-slate-400">Feature coming soon</p></div></GuestGate>} />

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
            <Route path="/notifications" element={<AuthGate><NotificationsCenter /></AuthGate>} />
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
