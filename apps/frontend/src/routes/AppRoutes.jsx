import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import MainLayout from "../components/MainLayout";
import Loader from "../components/Loader";

import SplashScreen from "../pages/SplashScreen.jsx";
import Onboarding from "../pages/Onboarding.jsx";
import RegisterScreen from "../pages/Register.jsx"; 
import LoginScreen from "../pages/Login.jsx";       
import Dashboard from "../pages/Dashboard.jsx";
import PostJobScreen from "../pages/PostJobScreen.jsx";
import AvailabilityStatus from "../pages/AvailabilityStatus.jsx";
import ProfileScreen from "../pages/ProfileScreen.jsx";
import SearchScreen from "../pages/SearchScreen.jsx";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader text="Ap tcheke sesyon w..." showProgress={false} />;
  }

  return isAuthenticated ? (
    <MainLayout>{children}</MainLayout>
  ) : (
    <Navigate to="/login" replace />
  );
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/onboarding" element={<Onboarding />} />
        
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterScreen />
            </PublicRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginScreen />
            </PublicRoute>
          } 
        />

        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/post-job" element={<PrivateRoute><PostJobScreen /></PrivateRoute>} />
        <Route path="/status" element={<PrivateRoute><AvailabilityStatus /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfileScreen /></PrivateRoute>} />
        <Route path="/search" element={<PrivateRoute><SearchScreen /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
