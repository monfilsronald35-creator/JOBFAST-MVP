import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = Object.freeze([
  { label: "Construction", key: "construction", path: "/search?cat=construction" },
  { label: "Business", key: "business", path: "/search?cat=business" },
  { label: "Services", key: "services", path: "/search?cat=services" },
  { label: "Toupre w", key: "nearby", path: "/search?nearby=true" },
]);

function NavItem({ item, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-400/20 ${
        isActive 
          ? "bg-navy-800 text-gold-400" 
          : "text-slate-400 hover:text-white"
      }`}
    >
      {item.label}
    </button>
  );
}

function AuthButton({ label, onClick, primary }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`active:scale-95 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-400/20 ${
        primary
          ? "bg-gold-400 text-navy-950 shadow-md shadow-gold-400/5 hover:bg-gold-500"
          : "border border-slate-800 bg-navy-800/10 text-slate-200 hover:border-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentQuery = location.search + location.pathname;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-navy-900/80 py-3.5 backdrop-blur-md select-none">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-5 px-6">
        
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/")}
          onKeyDown={(e) => e.key === "Enter" && navigate("/")}
          className="cursor-pointer text-xl font-black tracking-tighter text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-400/20"
        >
          JOB<span className="text-gold-400">FAST</span>
          <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500">.RD</span>
        </div>

        <div className="hidden items-center gap-1.5 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = currentQuery.includes(item.key) || (item.key === "nearby" && currentQuery.includes("nearby"));
            return (
              <NavItem
                key={item.key}
                item={item}
                isActive={isActive}
                onClick={() => navigate(item.path)}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <AuthButton
            label="Konekte"
            onClick={() => navigate("/login")}
          />

          <AuthButton
            label="Enskri"
            primary
            onClick={() => navigate("/register")}
          />
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
