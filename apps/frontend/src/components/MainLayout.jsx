import React, { useState, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Home, Search, Plus, Bell, User, Menu, X, Settings, LogOut,
  ChevronLeft, Zap, MessageSquare, MapPin, Wallet, Globe,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";

const BOTTOM_NAV = [
  { path: "/dashboard",     labelKey: "nav.home",     icon: Home          },
  { path: "/market",        labelKey: "nav.market",   icon: Globe         },
  { path: "/post-job",      labelKey: "nav.post",     icon: Plus, center: true },
  { path: "/chat",          labelKey: "nav.messages", icon: MessageSquare },
  { path: "/search",        labelKey: "nav.search",   icon: Search        },
];

const MENU_NAV = [
  { path: "/dashboard",     labelKey: "nav.home",          icon: Home          },
  { path: "/market",        labelKey: "nav.market",        icon: Globe         },
  { path: "/wallet",        labelKey: "nav.wallet",        icon: Wallet        },
  { path: "/search",        labelKey: "nav.search",        icon: Search        },
  { path: "/chat",          labelKey: "nav.messages",      icon: MessageSquare },
  { path: "/notifications", labelKey: "nav.notifications", icon: Bell          },
  { path: "/settings",      labelKey: "nav.profile",       icon: User          },
];

const LANG_FLAGS  = { ht: "🇭🇹", fr: "🇫🇷", en: "🇺🇸", es: "🇩🇴" };
const LANG_CODES  = { ht: "HT",   fr: "FR",  en: "EN",  es: "ES"  };

const LANGS = [
  { code: "ht", flag: "🇭🇹", label: "Kreyòl" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "en", flag: "🇺🇸", label: "English" },
  { code: "es", flag: "🇩🇴", label: "Español" },
];

export default function MainLayout({ children }) {
  const navigate           = useNavigate();
  const location           = useLocation();
  const { user, logout }   = useAuth();
  const { t, i18n }        = useTranslation();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [langOpen, setLangOpen]   = useState(false);

  const handleLangChange = useCallback((lang) => {
    changeLanguage(lang);
    setLangOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const avatarSrc = user?.profileMetadata?.profilePhoto
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || "user")}`;

  const isHome       = location.pathname === "/dashboard";
  const userCity     = user?.location?.city || "";
  const currentLang  = i18n.language || "ht";
  const currentFlag  = LANG_FLAGS[currentLang] || "🌍";
  const currentCode  = LANG_CODES[currentLang]  || currentLang.toUpperCase();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans antialiased">

      {/* ── Premium Header ───────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-[#0b1120]/97 backdrop-blur-xl border-b border-slate-800/50 shadow-2xl shadow-black/40">

        {/* Row 1 — main navigation row */}
        <div className="h-14 flex items-center px-3 gap-1.5">

          {/* Left: back / hamburger */}
          {!isHome ? (
            <button type="button" onClick={() => navigate(-1)} aria-label={t("nav.back")}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/70 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <button type="button" onClick={() => setMenuOpen(true)} aria-label={t("nav.openMenu")}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/70 transition-all">
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Center: logo */}
          <div className="flex-1 flex justify-center">
            <button type="button" onClick={() => navigate("/dashboard")} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/40">
                <Zap className="w-4 h-4 text-slate-950" fill="currentColor" />
              </div>
              <span className="text-[17px] font-black tracking-tight">
                JOB<span className="text-amber-400">FAST</span>
              </span>
            </button>
          </div>

          {/* Right: home cluster / other-page bell */}
          {isHome ? (
            <div className="flex items-center gap-1">
              {/* Language dropdown */}
              <div className="relative">
                <button type="button" onClick={() => setLangOpen(v => !v)}
                  className="flex items-center gap-1 h-8 px-2 rounded-xl bg-slate-800/70 border border-slate-700/50 hover:border-amber-500/40 transition-all">
                  <span className="text-sm leading-none">{currentFlag}</span>
                  <span className="text-[9px] font-bold text-slate-400">{currentCode}</span>
                </button>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-[150]" onClick={() => setLangOpen(false)} />
                    <div className="absolute right-0 top-10 z-[200] w-38 min-w-[148px] bg-[#0d1526] border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
                      {LANGS.map(l => (
                        <button key={l.code} type="button" onClick={() => handleLangChange(l.code)}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-bold transition-all hover:bg-slate-800/80 ${
                            currentLang === l.code ? "text-amber-400 bg-amber-500/10" : "text-slate-300"
                          }`}>
                          <span className="text-base leading-none">{l.flag}</span>
                          <span className="flex-1 text-left">{l.label}</span>
                          {currentLang === l.code && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {/* Messages */}
              <NavLink to="/chat" aria-label="Mesaj"
                className={({ isActive }) => `w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                  isActive ? "text-amber-400 bg-amber-500/10" : "text-slate-400 hover:text-amber-400 hover:bg-slate-800/70"
                }`}>
                <MessageSquare className="w-[18px] h-[18px]" />
              </NavLink>
              {/* Bell with notification indicator */}
              <NavLink to="/notifications" aria-label="Notifikasyon"
                className={({ isActive }) => `relative w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                  isActive ? "text-amber-400 bg-amber-500/10" : "text-slate-400 hover:text-amber-400 hover:bg-slate-800/70"
                }`}>
                <Bell className="w-[18px] h-[18px]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-[#0b1120] shadow-sm" />
              </NavLink>
              {/* Avatar with online ring */}
              <button type="button" onClick={() => navigate("/settings")}
                className="relative w-8 h-8 rounded-xl overflow-hidden border-2 border-amber-500/40 hover:border-amber-400 transition-all shadow-lg shadow-amber-500/10 ml-0.5 shrink-0">
                <img src={avatarSrc} alt={user?.name || "user"} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-[#0b1120]" />
              </button>
            </div>
          ) : (
            <NavLink to="/notifications" aria-label="Notifikasyon"
              className={({ isActive }) => `relative w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                isActive ? "text-amber-400 bg-amber-500/10" : "text-slate-400 hover:text-amber-400 hover:bg-slate-800/70"
              }`}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-[#0b1120] shadow-sm" />
            </NavLink>
          )}
        </div>

        {/* Row 2 — context info bar (home only) */}
        {isHome && (
          <div className="h-9 flex items-center px-4 border-t border-slate-800/40 bg-[#070e1c]/60">
            <button type="button" onClick={() => navigate("/map")}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400/90 hover:text-amber-400 transition-colors">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[90px]">{userCity || "—"}</span>
            </button>
            <div className="w-px h-3 bg-slate-700/60 mx-3 shrink-0" />
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-green-400/80">
              <Wallet className="w-3 h-3 shrink-0" />
              <span>$0.00</span>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              {t("nav.online")}
            </div>
          </div>
        )}
      </header>

      {/* ── Slide-in drawer ──────────────────────────────────────── */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" onClick={() => setMenuOpen(false)} />
          <aside className="fixed top-0 left-0 bottom-0 w-72 bg-[#0b1120] border-r border-slate-800/50 flex flex-col z-[100] shadow-2xl shadow-black/60">

            {/* Drawer header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Zap className="w-4 h-4 text-slate-950" fill="currentColor" />
                </div>
                <span className="text-base font-black">JOB<span className="text-amber-400">FAST</span></span>
              </div>
              <button type="button" onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User card */}
            {user && (
              <div className="mx-3 mt-3 p-3 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 flex items-center gap-3">
                <img src={avatarSrc} alt={user.name}
                  className="w-11 h-11 rounded-xl border-2 border-amber-500/30 object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 truncate">
                    {user.profession || user.role}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] text-slate-400">{t("nav.available")}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {MENU_NAV.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.path} to={item.path} onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl transition text-sm font-medium ${
                        isActive
                          ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`
                    }>
                    <Icon className="w-4 h-4 shrink-0" />
                    {t(item.labelKey)}
                  </NavLink>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-3 pb-6 space-y-1 border-t border-slate-800/50 pt-3">
              <NavLink to="/settings" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition font-medium">
                <Settings className="w-4 h-4 shrink-0" />
                {t("nav.settings")}
              </NavLink>
              <button type="button" onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition font-medium">
                <LogOut className="w-4 h-4 shrink-0" />
                {t("nav.logout")}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className={`flex-1 ${isHome ? "mt-[92px]" : "mt-14"} pb-20`}>
        {children}
      </main>

      {/* ── Premium Bottom Navigation ─────────────────────────────── */}
      <nav
        aria-label="Navigasyon prensipal"
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#0b1120]/98 backdrop-blur-xl border-t border-slate-800/50 shadow-2xl shadow-black/50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-end justify-around h-16 px-0.5">
          {BOTTOM_NAV.map(item => {
            const Icon = item.icon;

            if (item.center) {
              return (
                <NavLink key={item.path} to={item.path} aria-label={t(item.labelKey)}
                  className="flex flex-col items-center justify-center flex-1">
                  <div className="relative w-12 h-12 -mt-5">
                    {/* Glow ring */}
                    <div className="absolute inset-[-3px] rounded-[18px] bg-amber-500/25 animate-ping"
                      style={{ animationDuration: "2.5s" }} />
                    {/* FAB */}
                    <div className="relative w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/40 active:scale-95 transition-transform">
                      <Icon className="w-6 h-6 text-slate-950" />
                    </div>
                  </div>
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                aria-label={t(item.labelKey)}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center flex-1 gap-0.5 py-2 transition-all ${
                    isActive ? "text-amber-400" : "text-slate-600 hover:text-slate-400"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      {isActive && (
                        <span className="absolute inset-0 -m-1.5 rounded-xl bg-amber-500/8 shadow-lg shadow-amber-500/5" />
                      )}
                      <Icon className={`w-5 h-5 transition-all duration-200 relative ${isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" : ""}`} />
                      {isActive && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/60" />
                      )}
                    </div>
                    <span className={`text-[9px] font-bold leading-none transition-all ${isActive ? "text-amber-400" : "text-slate-600"}`}>
                      {t(item.labelKey)}
                    </span>
                    {isActive && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-amber-400/60" />
                    )}
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
