import React, { memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// ======================================================
// 📦 Ikon SVG Pwofesyonèl (Liy Fin ak Konpòtman Dinamik)
// ======================================================
const HomeIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 transition-all">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const SearchIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2} stroke="currentColor" className="w-5 h-5 transition-all">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const PostIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-navy-900">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const NotificationIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 transition-all">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5" />
  </svg>
);

const ProfileIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 transition-all">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// ======================================================
// 🚀 MAIN BOTTOM NAV COMPONENT
// ======================================================
function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Akèy", icon: (active) => <HomeIcon active={active} /> },
    { path: "/search", label: "Rechèch", icon: (active) => <SearchIcon active={active} /> },
    { path: "/post", label: "Poste", icon: () => <PostIcon />, isCenterButton: true },
    { path: "/notifications", label: "Notifikasyon", icon: (active) => <NotificationIcon active={active} />, badge: true },
    { path: "/profile", label: "Profil", icon: (active) => <ProfileIcon active={active} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-navy-900/90 border-t border-navy-800/80 backdrop-blur-xl pb-safe shadow-[0_-10px_30px_rgba(2,6,23,0.3)]">
      <div className="max-w-md mx-auto px-4 h-18 flex items-center justify-between relative">
        
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;

          if (item.isCenterButton) {
            return (
              <div key={index} className="relative -top-4 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400 hover:bg-gold-300 text-navy-900 shadow-card hover:scale-105 active:scale-95 border-4 border-navy-900 transition-all duration-200"
                  aria-label="Poste yon travay"
                >
                  {item.icon()}
                </button>
                <span className="text-[10px] font-medium tracking-wide text-text-muted mt-1">
                  {item.label}
                </span>
              </div>
            );
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => navigate(item.path)}
              className="flex flex-1 flex-col items-center justify-center gap-1 h-full py-2 active:scale-95 transition-all duration-150 relative"
            >
              <div className={`transition-colors duration-200 ${isActive ? "text-gold-400 scale-105" : "text-text-muted hover:text-text-inverse"}`}>
                {item.icon(isActive)}
              </div>

              <span className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${isActive ? "text-gold-400 font-bold" : "text-text-muted"}`}>
                {item.label}
              </span>

              {item.badge && (
                <span className="absolute top-2 right-1/4 h-2 w-2 rounded-full bg-danger-500 animate-pulse-soft"></span>
              )}
            </button>
          );
        })}

      </div>
    </nav>
  );
}

export default memo(BottomNav);
