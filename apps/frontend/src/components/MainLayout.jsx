import React, { useState, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Home, Search, Plus, Bell, User, Menu, X, Settings, LogOut, ChevronLeft, Zap, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

const BOTTOM_NAV = [
  { path: "/dashboard",     label: "Akeyi",    icon: Home  },
  { path: "/search",        label: "Rechèche", icon: Search },
  { path: "/post-job",      label: "Post",     icon: Plus, center: true },
  { path: "/notifications", label: "Notif",    icon: Bell },
  { path: "/settings",      label: "Profil",   icon: User  },
];

const MENU_NAV = [
  { path: "/dashboard",     label: "Akeyi",        icon: Home           },
  { path: "/search",        label: "Rechèche",      icon: Search         },
  { path: "/chat",          label: "Mesaj",         icon: MessageSquare  },
  { path: "/notifications", label: "Notifikasyon", icon: Bell           },
  { path: "/settings",      label: "Pwofil",        icon: User           },
];

export default function MainLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = useCallback(() => {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const avatarSrc = user?.profileMetadata?.profilePhoto
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || "user")}`;

  const isHome = location.pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans antialiased">

      {/* ── Top bar ──────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800/50 flex items-center px-3 z-50 gap-2">

        {/* Left: back arrow OR hamburger */}
        {!isHome ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Tounen"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvri menu"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Center: JOBFAST logo */}
        <div className="flex-1 flex justify-center">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5"
          >
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4 text-slate-950" fill="currentColor" />
            </div>
            <span className="text-[15px] font-black tracking-tight">
              JOB<span className="text-amber-400">FAST</span>
            </span>
          </button>
        </div>

        {/* Right: notification bell */}
        <NavLink
          to="/notifications"
          aria-label="Notifikasyon"
          className={({ isActive }) =>
            `w-9 h-9 flex items-center justify-center rounded-xl transition ${
              isActive ? "text-amber-400 bg-amber-500/10" : "text-slate-400 hover:text-amber-400 hover:bg-slate-800"
            }`
          }
        >
          <Bell className="w-5 h-5" />
        </NavLink>
      </header>

      {/* ── Slide-in drawer (from left) ──────────────────────── */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-[90]"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer panel */}
          <aside className="fixed top-0 left-0 bottom-0 w-72 bg-[#0f172a] border-r border-slate-800 flex flex-col z-[100] shadow-2xl">

            {/* Drawer header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-slate-950" fill="currentColor" />
                </div>
                <span className="text-base font-black">JOB<span className="text-amber-400">FAST</span></span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User card */}
            {user && (
              <div className="mx-3 mt-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
                <img
                  src={avatarSrc}
                  alt={user.name}
                  className="w-11 h-11 rounded-xl border-2 border-amber-500/30 object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 truncate">
                    {user.profession || user.role}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[9px] text-slate-400">Disponib</span>
                  </div>
                </div>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {MENU_NAV.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl transition text-sm font-medium ${
                        isActive
                          ? "bg-amber-500 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            {/* Footer actions */}
            <div className="px-3 pb-6 space-y-1 border-t border-slate-800 pt-3">
              <NavLink
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition font-medium"
              >
                <Settings className="w-4 h-4 shrink-0" />
                Paramèt
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition font-medium"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Dekonekte
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 mt-14 pb-20">
        {children}
      </main>

      {/* ── Bottom navigation ────────────────────────────────── */}
      <nav
        aria-label="Navigasyon prensipal"
        className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/97 border-t border-slate-800/80 z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-end justify-around h-16 px-1">
          {BOTTOM_NAV.map(item => {
            const Icon = item.icon;
            if (item.center) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  aria-label={item.label}
                  className="flex flex-col items-center justify-center flex-1"
                >
                  <div className="w-12 h-12 -mt-5 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 active:scale-95 transition-transform">
                    <Icon className="w-6 h-6 text-slate-950" />
                  </div>
                </NavLink>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                aria-label={item.label}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 gap-0.5 py-2 transition-colors ${
                    isActive ? "text-amber-400" : "text-slate-500 hover:text-slate-300"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                    <span className={`text-[9px] font-semibold ${isActive ? "text-amber-400" : "text-slate-500"}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
