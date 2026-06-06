import React, { memo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ✅ ENPÒTASYON PWÒP SAN KONFLI
import SplashScreen from "../pages/SplashScreen.jsx";
import Onboarding from "../pages/Onboarding.jsx";
import RegisterScreen from "../pages/Register.jsx"; 
import LoginScreen from "../pages/Login.jsx";       
import Dashboard from "../pages/Dashboard.jsx";
import PostJobScreen from "../pages/PostJobScreen.jsx"; // Ranplase createPost nèt
import AvailabilityStatus from "../pages/AvailabilityStatus.jsx";
import ProfileScreen from "../pages/ProfileScreen.jsx";
import SearchScreen from "../pages/SearchScreen.jsx";

// Tcheke si itilizatè a konekte (Senp otantifikasyon)
const isAuthenticated = () => !!localStorage.getItem("token");

// Konpozan pou pwoteje paj prive yo
const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Paj Piblik */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/login" element={<LoginScreen />} />

        {/* Paj Prive (Obligatwa pou konekte) */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/post-job" element={<PrivateRoute><PostJobScreen /></PrivateRoute>} />
        <Route path="/status" element={<PrivateRoute><AvailabilityStatus /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfileScreen /></PrivateRoute>} />
        <Route path="/search" element={<PrivateRoute><SearchScreen /></PrivateRoute>} />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default memo(AppRoutes);
