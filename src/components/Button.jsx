import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Plus, Bell, User } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Akèy", icon: Home, end: true },
  { path: "/search", label: "Chèche", icon: Search },
  { path: "/create-post", label: "Poste", icon: Plus, center: true },
  { path: "/notifications", label: "Notifikasyon", icon: Bell },
  { path: "/profile", label: "Pwofil", icon: User },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const itemRefs = useRef([]);
  const indicatorRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);

  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(10);
  };

  /* ================= ACTIVE DETECTION ================= */
  useEffect(() => {
    const index = NAV_ITEMS.findIndex((item) =>
      item.end
        ? location.pathname === item.path
        : location.pathname.startsWith(item.path)
    );

    if (index !== -1) setActiveIndex(index);
  }, [location.pathname]);

  /* ================= PIXEL-PERFECT INDICATOR ================= */
  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    const indicator = indicatorRef.current;

    if (!el || !indicator) return;

    const { offsetLeft, offsetWidth } = el;

    indicator.style.transform = `translateX(${offsetLeft}px)`;
    indicator.style.width = `${offsetWidth}px`;
  }, [activeIndex]);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/40 border-t border-white/10 pb-[env(safe-area-inset-bottom)]"
    >
      {/* 🔥 DYNAMIC INDICATOR */}
      <div className="absolute top-0 left-0 h-[3px] w-full">
        <div
          ref={indicatorRef}
          className="h-[3px] bg-gradient-to-r from-gold-400 to-yellow-500 transition-all duration-300 ease-out rounded-full"
        />
      </div>

      <div className="flex h-16 items-center justify-around relative">
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;

          const isActive = index === activeIndex;

          /* ================= CENTER BUTTON ================= */
          if (item.center) {
            return (
              <button
                key={item.path}
                onClick={() => {
                  vibrate();
                  navigate(item.path);
                }}
                className="relative -top-5 h-14 w-14 rounded-2xl bg-gold-400 text-black shadow-xl active:scale-90 transition"
              >
                <Icon className="h-6 w-6 mx-auto" />
              </button>
            );
          }

          return (
            <button
              key={item.path}
              ref={(el) => (itemRefs.current[index] = el)}
              onClick={() => {
                vibrate();
                navigate(item.path);
              }}
              className={`flex flex-col items-center justify-center w-full transition ${
                isActive ? "text-gold-400 scale-105" : "text-gray-400"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}