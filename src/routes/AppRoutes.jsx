//////////////////////////////////////////////////////
// 🚀 APP ROUTER (ENTERPRISE FINAL CLEAN VERSION)
//////////////////////////////////////////////////////

import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

// ======================================================
// 🧠 CORE UI
// ======================================================
import MainLayout from "../components/MainLayout.jsx";
import Loader from "../components/Loader.jsx";

// ======================================================
// 📱 PUBLIC PAGES
// ======================================================
import SplashScreen from "../pages/SplashScreen.jsx";
import Onboarding from "../pages/Onboarding.jsx";
import RegisterScreen from "../pages/Register.jsx";
import LoginScreen from "../pages/Login.jsx";

// ======================================================
// 📊 USER PAGES
// ======================================================
import Dashboard from "../pages/Dashboard.jsx";
import PostJobScreen from "../pages/PostJobScreen.jsx";
import AvailabilityStatus from "../pages/AvailabilityStatus.jsx";
import ProfileScreen from "../pages/ProfileScreen.jsx";
import SearchScreen from "../pages/SearchScreen.jsx";

// ======================================================
// 👑 ADMIN PAGES (LAZY LOADED)
// ======================================================
const AdminDashboard = lazy(() =>
  import("../pages/admin/AdminDashboard.jsx")
);

const AdminUsers = lazy(() =>
  import("../pages/admin/AdminUsers.jsx")
);

const AdminJobs = lazy(() =>
  import("../pages/admin/AdminJobs.jsx")
);

const AdminSupport = lazy(() =>
  import("../pages/admin/AdminSupport.jsx")
);

const AdminSettings = lazy(() =>
  import("../pages/admin/AdminSettings.jsx")
);

/* ======================================================
   🔐 ROUTE GUARDS
====================================================== */

const AuthGate = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loader text="Loading session..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <MainLayout>{children}</MainLayout>;
};

const GuestGate = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return children;
};

const AdminGate = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <Loader text="Loading admin panel..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin")
    return <Navigate to="/dashboard" replace />;

  return <MainLayout>{children}</MainLayout>;
};

/* ======================================================
   🚀 ROUTER
====================================================== */

function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader text="Loading application..." />}>
        <Routes>

          {/* 🌍 PUBLIC ROUTES */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/onboarding" element={<Onboarding />} />

          <Route
            path="/register"
            element={
              <GuestGate>
                <RegisterScreen />
              </GuestGate>
            }
          />

          <Route
            path="/login"
            element={
              <GuestGate>
                <LoginScreen />
              </GuestGate>
            }
          />

          {/* 🔐 USER ROUTES */}
          <Route
            path="/dashboard"
            element={
              <AuthGate>
                <Dashboard />
              </AuthGate>
            }
          />

          <Route
            path="/post-job"
            element={
              <AuthGate>
                <PostJobScreen />
              </AuthGate>
            }
          />

          <Route
            path="/status"
            element={
              <AuthGate>
                <AvailabilityStatus />
              </AuthGate>
            }
          />

          <Route
            path="/profile"
            element={
              <AuthGate>
                <ProfileScreen />
              </AuthGate>
            }
          />

          <Route
            path="/search"
            element={
              <AuthGate>
                <SearchScreen />
              </AuthGate>
            }
          />

          {/* 👑 ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <AdminGate>
                <AdminDashboard />
              </AdminGate>
            }
          />

          <Route
            path="/admin/users"
            element={
              <AdminGate>
                <AdminUsers />
              </AdminGate>
            }
          />

          <Route
            path="/admin/jobs"
            element={
              <AdminGate>
                <AdminJobs />
              </AdminGate>
            }
          />

          <Route
            path="/admin/support"
            element={
              <AdminGate>
                <AdminSupport />
              </AdminGate>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <AdminGate>
                <AdminSettings />
              </AdminGate>
            }
          />

          {/* ❌ FALLBACK */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRoutes;