import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";

// Layouts & UI Components
import MainLayout from "@/components/MainLayout.jsx";
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

// Admin Pages (Lazy Loaded for better performance)
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard.jsx"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers.jsx"));
const AdminJobs = lazy(() => import("@/pages/admin/AdminJobs.jsx"));
const AdminSupport = lazy(() => import("@/pages/admin/AdminSupport.jsx"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings.jsx"));

// Security Gates
const AuthGate = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader text="Loading session..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <MainLayout>{children}</MainLayout>;
};

const GuestGate = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader text="Loading application..." />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <PublicLayout>{children}</PublicLayout>;
};

const AdminGate = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <Loader text="Loading admin panel..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Verify user role
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <MainLayout>{children}</MainLayout>;
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader text="Loading application..." />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><SplashScreen /></PublicLayout>} />
          <Route path="/onboarding" element={<PublicLayout><Onboarding /></PublicLayout>} />

          {/* Auth Routes */}
          <Route path="/register" element={<GuestGate><RegisterScreen /></GuestGate>} />
          <Route path="/login" element={<GuestGate><LoginScreen /></GuestGate>} />
          <Route path="/forgot-password" element={<GuestGate><div className="p-8 text-center"><h2 className="text-2xl font-bold mb-4">Forgot Password</h2><p className="text-slate-400">Feature coming soon</p></div></GuestGate>} />

          {/* Protected User Routes */}
          <Route path="/dashboard" element={<AuthGate><Dashboard /></AuthGate>} />
          <Route path="/post-job" element={<AuthGate><PostJobScreen /></AuthGate>} />
          <Route path="/status" element={<AuthGate><AvailabilityStatus /></AuthGate>} />
          <Route path="/profile" element={<AuthGate><ProfileScreen /></AuthGate>} />
          <Route path="/search" element={<AuthGate><SearchScreen /></AuthGate>} />
          
          {/* Additional Protected Routes (Placeholders) */}
          <Route path="/edit-profile" element={<AuthGate><ProfileScreen /></AuthGate>} />
          <Route path="/settings" element={<AuthGate><ProfileScreen /></AuthGate>} />
          <Route path="/job-history" element={<AuthGate><Dashboard /></AuthGate>} />
          <Route path="/notifications" element={<AuthGate><NotificationsCenter /></AuthGate>} />
          <Route path="/chat/:id" element={<AuthGate><Dashboard /></AuthGate>} />
          <Route path="/rating/:id" element={<AuthGate><Dashboard /></AuthGate>} />
          <Route path="/booking/:id" element={<AuthGate><Dashboard /></AuthGate>} />
          <Route path="/map" element={<AuthGate><SearchScreen /></AuthGate>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminGate><AdminDashboard /></AdminGate>} />
          <Route path="/admin/users" element={<AdminGate><AdminUsers /></AdminGate>} />
          <Route path="/admin/jobs" element={<AdminGate><AdminJobs /></AdminGate>} />
          <Route path="/admin/support" element={<AdminGate><AdminSupport /></AdminGate>} />
          <Route path="/admin/settings" element={<AdminGate><AdminSettings /></AdminGate>} />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRoutes;
