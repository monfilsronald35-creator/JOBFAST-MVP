

import React, { useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Construction", key: "construction", path: "/search?cat=construction" },
  { label: "Business", key: "business", path: "/search?cat=business" },
  { label: "Services", key: "services", path: "/search?cat=services" },
  { label: "Toupre w", key: "nearby", path: "/search?nearby=true" },
];

/* ================= NAV ITEM ================= */
const NavItem = React.memo(function NavItem({ item, active }) {
  return (
    <Link
      to={item.path}
      aria-current={active ? "page" : undefined}
      className={[
        "rounded-xl px-3.5 py-2 text-xs font-black uppercase tracking-wider",
        "transition-all duration-200 ease-out transform-gpu",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-400/20",
        active
          ? "bg-navy-800 text-gold-400 shadow-md scale-[1.04]"
          : "text-slate-400 hover:text-white hover:bg-navy-800/40 hover:scale-[1.01]",
      ].join(" ")}
    >
      {item.label}
    </Link>
  );
});

/* ================= AUTH BUTTON ================= */
const AuthLink = React.memo(function AuthLink({ label, to, primary }) {
  return (
    <Link
      to={to}
      className={[
        "rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest",
        "transition-all duration-200 ease-out active:scale-95 transform-gpu",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-400/20",
        primary
          ? "bg-gold-400 text-navy-950 hover:bg-gold-500 shadow-md"
          : "border border-slate-800 bg-navy-800/10 text-slate-200 hover:border-slate-700 hover:bg-navy-800/30",
      ].join(" ")}
    >
      {label}
    </Link>
  );
});

/* ================= NAVBAR ================= */
export default function Navbar() {
  const { search } = useLocation();

  /* 🔥 safer + stable parsing */
  const params = useMemo(() => new URLSearchParams(search || ""), [search]);

  const cat = params.get("cat");
  const nearby = params.get("nearby");

  /* ⚡ stable callback (avoids re-creation per render in children) */
  const isActive = useCallback(
    (key) => {
      if (key === "nearby") return nearby === "true";
      return cat === key;
    },
    [cat, nearby]
  );

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-slate-800/60 
                 bg-navy-900/80 backdrop-blur-md select-none"
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">

        {/* LOGO */}
        <Link
          to="/"
          className="text-xl font-black tracking-tighter text-white hover:opacity-90 transition"
          aria-label="Go to homepage"
        >
          JOB<span className="text-gold-400">FAST</span>
          <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
            .RD
          </span>
        </Link>

        {/* NAV */}
        <div className="hidden items-center gap-1.5 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              active={isActive(item.key)}
            />
          ))}
        </div>

        {/* AUTH */}
        <div className="flex items-center gap-2.5">
          <AuthLink label="Konekte" to="/login" />
          <AuthLink label="Enskri" to="/register" primary />
        </div>

      </div>
    </nav>
  );
}