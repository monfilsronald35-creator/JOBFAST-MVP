// =========================================================================
// 🌍 src/components/MainLayout.jsx
// 🚀 JOBFAST GLOBAL APP LAYER (v4.4 - PREMIUM DESIGN SYSTEM)
// =========================================================================

import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  Search, 
  PlusSquare, 
  Bell, 
  User, 
  MapPin, 
  LogOut, 
  ChevronDown 
} from "lucide-react";

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("/dashboard");
  const [userLocation, setUserLocation] = useState("Bavaro, Punta Cana");

  // Mete tab la aktif selon URL la otomatikman
  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("jobfast_user");
    navigate("/login");
  };

  // Navigasyon anba a (Mobile/Tablet Navigation Stack)
  const navItems = [
    { label: "Akeyi", path: "/dashboard", icon: Home },
    { label: "Rechèch", path: "/search", icon: Search },
    { label: "Paste", path: "/post-job", icon: PlusSquare },
    { label: "Notifikasyon", path: "/notifications", icon: Bell, badge: 3 },
    { label: "Profil", path: "/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans antialiased pb-20 md:pb-0 md:pl-64">
      
      {/* ==========================================
         Header Fiks (Top Bar) — Ekselan pou GPS ak Profil
         ========================================== */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between px-4 z-40 md:left-64 transition-all">
        {/* GPS Location Component */}
        <div className="flex items-center gap-2 cursor-pointer bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 hover:border-amber-500/50 transition-all">
          <MapPin className="w-4 h-4 text-amber-500 fill-amber-500/10" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-slate-400 font-medium leading-none">Kote w ye</span>
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
              {userLocation} <ChevronDown className="w-3 h-3 text-slate-400" />
            </span>
          </div>
        </div>

        {/* Brand & Logout */}
        <div className="flex items-center gap-4">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" title="Sèvè a an liy" />
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-400 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-rose-950 transition-all"
            title="Dekonekte"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ==========================================
         Sidebar pou gwo ekran (Prenta / Desktòp)
         ========================================== */}
      <aside className="hidden md:flex fixed top-0 bottom-0 left-0 w-64 bg-[#0f172a] border-r border-slate-800/80 flex-col z-50">
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-amber-500/20">
              ⚡
            </div>
            <span className="text-lg font-black tracking-wider text-slate-100">
              JOB<span className="text-amber-500">FAST</span>
            </span>
          </div>
        </div>

        {/* Meni Navigasyon */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all group ${
                  isSelected 
                    ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10" 
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-950/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isSelected ? "text-slate-950" : "text-slate-400 group-hover:text-amber-500"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && !isSelected && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800/40 text-center text-[10px] text-slate-500">
          v4.4 © JobFast Global
        </div>
      </aside>

      {/* ==========================================
         Zòn kontni dinamik (Zòn kote tout ekran yo ap monte)
         ========================================== */}
      <main className="flex-1 mt-16 p-4 md:p-8 max-w-7xl w-full mx-auto">
        {/* Tout sub-routes (Dashboard, Profile, PostJob) ap parèt la a */}
        <Outlet />
      </main>

      {/* ==========================================
         Mobile Bottom Navigation (Fidèl ak Ekran Mockup la)
         ========================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0f172a]/95 backdrop-blur-lg border-t border-slate-800/80 flex items-center justify-around z-50 px-2 safe-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-2 transition-all"
            >
              <div className={`p-1.5 rounded-xl transition-all ${isSelected ? "text-amber-500 scale-110" : "text-slate-400"}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[9px] font-medium tracking-wide transition-all ${isSelected ? "text-amber-400 font-bold" : "text-slate-500"}`}>
                {item.label}
              </span>
              
              {/* Ti Badge pou Notifikasyon */}
              {item.badge && (
                <span className="absolute top-2 right-4 bg-amber-500 text-slate-950 text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-[#0f172a]">
                  {item.badge}
                </span>
              )}

              {/* Endikatè ba ki anba bouton aktif la */}
              {isSelected && (
                <div className="absolute bottom-1 w-5 h-0.5 bg-amber-500 rounded-full shadow-lg shadow-amber-500" />
              )}
            </Link>
          );
        })}
      </div>

    </div>
  );
};

export default MainLayout;
