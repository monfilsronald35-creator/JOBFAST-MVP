import React, { useMemo, useCallback } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  PlusSquare,
  Bell,
  User,
  MapPin,
  LogOut,
  ChevronDown,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Akeyi", path: "/dashboard", icon: Home, end: true },
  { label: "Rechèch", path: "/search", icon: Search },
  { label: "Paste", path: "/post-job", icon: PlusSquare, badge: 3 },
  { label: "Notifikasyon", path: "/notifications", icon: Bell, badge: 3 },
  { label: "Profil", path: "/profile", icon: User },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const navItems = useMemo(() => NAV_ITEMS, []);
  const userLocation = "Bavaro, Punta Cana";

  const handleLogout = useCallback(() => {
    localStorage.removeItem("jobfast_user");
    navigate("/login");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans antialiased pb-20 md:pb-0 md:pl-64">
      <header className="fixed top-0 left-0 right-0 md:left-64 h-16 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
          <MapPin className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">Kote w ye</span>
            <span className="text-xs font-semibold flex items-center gap-1">
              {userLocation} <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            className="p-2 text-slate-400 hover:text-rose-400 bg-slate-900/60 rounded-xl border border-slate-800 transition"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <aside className="hidden md:flex fixed top-0 bottom-0 left-0 w-64 bg-[#0f172a] border-r border-slate-800 flex-col z-50">
        <div className="h-20 flex items-center px-6 border-b border-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-black text-slate-950">
              ⚡
            </div>
            <span className="text-lg font-black">
              JOB<span className="text-amber-500">FAST</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2" aria-label="Sidebar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3.5 rounded-xl transition ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-950/50"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && !isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-center text-[10px] text-slate-500">
          v5.0 © JobFast
        </div>
      </aside>

      <main className="flex-1 mt-16 p-4 md:p-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

      <nav
        aria-label="Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0f172a]/95 border-t border-slate-800 flex items-center justify-around z-50 pb-[env(safe-area-inset-bottom)]"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 relative ${
                  isActive ? "text-amber-500" : "text-slate-400"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 ${isActive ? "scale-110" : ""}`}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-[9px] ${
                      isActive ? "text-amber-400 font-bold" : "text-slate-500"
                    }`}
                  >
                    {item.label}
                  </span>

                  {item.badge && (
                    <span className="absolute top-1 right-4 w-4 h-4 text-[9px] bg-amber-500 text-black rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
