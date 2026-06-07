import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Plus, Bell, User } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Akèy", icon: Home, exact: true },
  { path: "/search", label: "Chèche", icon: Search },
  { path: "/create-post", label: "Poste", icon: Plus, isCenterButton: true },
  { path: "/notifications", label: "Notifikasyon", icon: Bell, hasBadge: true },
  { path: "/profile", label: "Pwofil", icon: User },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 select-none border-t border-slate-800/60 bg-navy-900/95 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-sm items-center justify-between px-6">
        {NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          
          const isActive = item.exact 
            ? currentPath === item.path 
            : currentPath.startsWith(item.path);

          if (item.isCenterButton) {
            return (
              <div key={item.path} className="relative flex flex-col items-center justify-center -top-3">
                <button
                  onClick={() => navigate(item.path)}
                  aria-label={item.label}
                  className="flex h-12 w-12 active:scale-90 items-center justify-center rounded-2xl bg-gold-400 text-navy-950 shadow-lg shadow-gold-400/20 transition-all hover:bg-gold-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20"
                >
                  <IconComponent className="h-6 w-6" strokeWidth={3} />
                </button>
                <span className={`mt-1 text-[9px] font-black uppercase tracking-wider ${
                  isActive ? "text-gold-400" : "text-slate-500"
                }`}>
                  {item.label}
                </span>
              </div>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              className="flex flex-col items-center justify-center gap-1 w-14 h-full active:scale-95 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20"
            >
              <div className="relative flex items-center justify-center">
                <IconComponent
                  className={`h-5 w-5 transition-colors duration-200 ${
                    isActive ? "text-gold-400" : "text-slate-400 hover:text-white"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                {item.hasBadge && (
                  <span className="animate-pulse absolute -right-0.5 -top-0.5 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-navy-900" />
                )}
              </div>
              
              <span
                className={`text-[9px] font-black uppercase tracking-wider transition-colors duration-200 ${
                  isActive ? "text-gold-400" : "text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
