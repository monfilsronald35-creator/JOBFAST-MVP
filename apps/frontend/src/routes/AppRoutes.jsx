import React, { memo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Enpòtasyon paj yo ak estansyon .jsx fiks pou Vercel Linux
import SplashScreen from "../pages/SplashScreen.jsx";
import RegisterScreen from "../pages/RegisterScreen.jsx";
import LoginScreen from "../pages/LoginScreen.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import CreatePost from "../pages/CreatePost.jsx";
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
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/login" element={<LoginScreen />} />

        {/* Paj Prive (Obligatwa pou konekte) */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/create-post" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
        <Route path="/status" element={<PrivateRoute><AvailabilityStatus /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfileScreen /></PrivateRoute>} />
        <Route path="/search" element={<PrivateRoute><SearchScreen /></PrivateRoute>} />

        {/* Catch-all route: redireksyon si itilizatè a ale sou yon paj ki pa egziste */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default memo(AppRoutes);
