import React, { useState, useCallback, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Home, Search, Bell, User, Menu, X, Settings, LogOut,
  ChevronLeft, Zap, MessageSquare, MapPin, Wallet, Globe, CalendarDays, Lock,
  Briefcase, Wrench, Building2, WifiOff, Mic, QrCode, Sparkles,
  ShieldAlert, Plus, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

// type: 'sos' | 'link' | 'fab'
const BOTTOM_NAV = [
  { type: 'sos',  labelKey: 'nav.sos'                                          },
  { type: 'link', path: "/dashboard",  labelKey: "nav.home",     icon: Home          },
  { type: 'link', path: "/market",     labelKey: "nav.market",   icon: Globe         },
  { type: 'fab',  labelKey: 'nav.create'                                       },
  { type: 'link', path: "/chat",       labelKey: "nav.messages", icon: MessageSquare },
  { type: 'link', path: "/search",     labelKey: "nav.search",   icon: Search        },
  { type: 'link', path: "/settings",   labelKey: "nav.profile",  icon: User          },
];

const MENU_NAV = [
  { path: "/dashboard",           labelKey: "nav.home",         icon: Home       },
  { path: "/market",              labelKey: "nav.market",       icon: Globe      },
  { path: "/wallet",              labelKey: "nav.wallet",       icon: Wallet     },
  { path: "/booking",             labelKey: "nav.booking",      icon: CalendarDays},
  { path: "/escrow",              labelKey: "nav.escrow",       icon: Lock       },
  { path: "/worker-profile",      labelKey: "nav.workerProfile",icon: Briefcase  },
  { path: "/provider-dashboard",  labelKey: "nav.providerDash", icon: Wrench     },
  { path: "/enterprise-dashboard",labelKey: "nav.enterprise",   icon: Building2  },
  { path: "/search",              labelKey: "nav.search",       icon: Search     },
  { path: "/chat",                labelKey: "nav.messages",     icon: MessageSquare},
  { path: "/notifications",       labelKey: "nav.notifications",icon: Bell       },
  { path: "/settings",            labelKey: "nav.profile",      icon: User       },
];

const FAB_ACTIONS = [
  { icon: '💼', labelKey: 'fab.createJob',         path: '/post-job'               },
  { icon: '📖', labelKey: 'fab.createStory',       path: '/stories'                },
  { icon: '🛠',  labelKey: 'fab.createService',     path: '/provider-dashboard'     },
  { icon: '📅', labelKey: 'fab.createReservation', path: '/booking'                },
  { icon: '🎉', labelKey: 'fab.createEvent',       path: '/market'                 },
  { icon: '🛒', labelKey: 'fab.createProduct',     path: '/market'                 },
  { icon: '🏢', labelKey: 'fab.createCompany',     path: '/settings'               },
  { icon: '🌿', labelKey: 'fab.createBranch',      path: '/enterprise-dashboard'   },
  { icon: '🧾', labelKey: 'fab.createInvoice',     path: '/wallet'                 },
];

const CURRENCIES = [
  { code:'HTG', symbol:'G',   flag:'🇭🇹' },
  { code:'USD', symbol:'$',   flag:'🇺🇸' },
  { code:'EUR', symbol:'€',   flag:'🇪🇺' },
  { code:'DOP', symbol:'RD$', flag:'🇩🇴' },
  { code:'MXN', symbol:'M$',  flag:'🇲🇽' },
  { code:'CAD', symbol:'C$',  flag:'🇨🇦' },
  { code:'GBP', symbol:'£',   flag:'🇬🇧' },
];

const LANGS = [
  { code: "ht", flag: "🇭🇹", label: "Kreyòl"   },
  { code: "fr", flag: "🇫🇷", label: "Français"  },
  { code: "en", flag: "🇺🇸", label: "English"   },
  { code: "es", flag: "🇩🇴", label: "Español"   },
];

const LANG_FLAGS = { ht:"🇭🇹", fr:"🇫🇷", en:"🇺🇸", es:"🇩🇴" };
const LANG_CODES = { ht:"HT",  fr:"FR", en:"EN", es:"ES"  };

// ─────────────────────────────────────────────────────────────
// SEARCH MODAL
// ─────────────────────────────────────────────────────────────

function GlobalSearchModal({ onClose }) {
  const [query, setQuery]       = useState('');
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const QUICK_LINKS = [
    { icon:'⚡', label:'Elektrisyen',     path:'/search?q=elektrisyen'    },
    { icon:'🔧', label:'Plombye',         path:'/search?q=plombye'        },
    { icon:'🚗', label:'Chofè',           path:'/search?q=chofè'          },
    { icon:'👨‍⚕️', label:'Enfimyè',         path:'/search?q=enfimyè'        },
    { icon:'👨‍🍳', label:'Kuyinye',         path:'/search?q=kuyinye'        },
    { icon:'🏗',  label:'Mason',           path:'/search?q=mason'          },
  ];

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'fr-HT';
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => { setQuery(e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend   = () => setListening(false);
    rec.start();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full bg-[#0b1120] shadow-2xl z-10">
        <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 pt-14 pb-3">
          <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-2xl px-4 h-12 focus-within:border-amber-500/60 transition-colors">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Chèche djòb, travayè, sèvis…"
              className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            )}
            <button type="button" onClick={handleVoice} aria-label="Rechèch vwa"
              className={`text-slate-400 hover:text-amber-400 transition-colors ${listening ? 'text-red-400 animate-pulse' : ''}`}>
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-sm font-bold shrink-0">
            Anile
          </button>
        </form>

        {!query && (
          <div className="px-4 pb-6">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Rechèch Rapid</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_LINKS.map(l => (
                <button key={l.path} type="button"
                  onClick={() => { navigate(l.path); onClose(); }}
                  className="flex items-center gap-2 p-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl hover:border-amber-500/40 transition-all">
                  <span className="text-base">{l.icon}</span>
                  <span className="text-xs font-bold text-slate-300">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// QR SCANNER MODAL (stub)
// ─────────────────────────────────────────────────────────────

function QRScannerModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/85" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xs mx-4 bg-[#0d1526] border border-slate-700 rounded-3xl overflow-hidden">
        <div className="p-5">
          <h3 className="text-base font-black text-white mb-1">📷 Scanner QR</h3>
          <p className="text-xs text-slate-400 mb-4">Pointe kamera ou sou kòd QR yon travayè oswa antrepriz</p>
          {/* Camera viewfinder placeholder */}
          <div className="aspect-square bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-700 relative overflow-hidden">
            <div className="absolute inset-4 border-2 border-amber-400/60 rounded-2xl" />
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-400 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-400 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-400 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-400 rounded-br-lg" />
            {/* Scan line animation */}
            <div className="absolute left-8 right-8 h-0.5 bg-amber-400/70 shadow-[0_0_8px_rgba(245,158,11,0.7)]"
              style={{ animation:'scanLine 2s ease-in-out infinite', top:'30%' }} />
            <QrCode className="w-16 h-16 text-slate-600" />
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-3">Kamera dezaktive nan mòd demo</p>
        </div>
        <div className="border-t border-slate-800 p-4">
          <button type="button" onClick={onClose}
            className="w-full py-3 rounded-2xl border border-slate-700 text-slate-400 font-bold text-sm hover:bg-slate-800 transition">
            Fèmen
          </button>
        </div>
      </div>
      <style>{`
        @keyframes scanLine {
          0%,100%{ top:25%; } 50%{ top:70%; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EMERGENCY MODAL
// ─────────────────────────────────────────────────────────────

function EmergencyModal({ onClose }) {
  const EMERGENCY_ACTIONS = [
    { icon:'🚨', label:'Rapòte Ijan',   sublabel:'Djòb / Travayè',    color:'bg-red-500'    },
    { icon:'🏥', label:'Ijans Medikal', sublabel:'Rele sekou medikal', color:'bg-red-600'    },
    { icon:'👮', label:'Sekirite',      sublabel:'Rele lapolis',       color:'bg-blue-600'   },
    { icon:'🔥', label:'Kontakte Support',sublabel:'24/7 JOBFAST',    color:'bg-amber-500'  },
  ];
  return (
    <div className="fixed inset-0 z-[200] flex items-end">
      <div className="absolute inset-0 bg-black/85" onClick={onClose} />
      <div className="relative w-full bg-[#0d1526] rounded-t-3xl z-10 p-5 pb-12">
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
        <h3 className="text-base font-black text-white mb-1">🚨 Bouton Ijans</h3>
        <p className="text-xs text-slate-400 mb-4">Chwazi aksyon ijan an</p>
        <div className="grid grid-cols-2 gap-3">
          {EMERGENCY_ACTIONS.map(a => (
            <button key={a.label} type="button" onClick={onClose}
              className={`${a.color} flex flex-col items-center gap-2 p-4 rounded-2xl text-white active:scale-95 transition-all shadow-lg`}>
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-black text-center">{a.label}</span>
              <span className="text-[9px] opacity-80 text-center">{a.sublabel}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FAB SPEED DIAL
// ─────────────────────────────────────────────────────────────

function SpeedDial({ open, onClose, actions, t }) {
  const navigate = useNavigate();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {/* Action stack above center FAB */}
      <div className="absolute bottom-20 left-0 right-0 flex flex-col items-center gap-2 pb-2 px-4">
        {actions.map((action, i) => (
          <div key={action.labelKey}
            className="flex items-center gap-3"
            style={{
              transform:    `translateY(0)`,
              opacity:      1,
              animation:    `slideUp 200ms cubic-bezier(0.34,1.56,0.64,1) ${i * 35}ms both`,
            }}>
            <span className="bg-[#0d1526] border border-slate-700/70 text-slate-100 text-xs font-bold px-3 py-2 rounded-xl shadow-lg whitespace-nowrap">
              {t(action.labelKey, { defaultValue: action.labelKey.split('.').pop() })}
            </span>
            <button type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(action.path);
                onClose();
              }}
              aria-label={t(action.labelKey)}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#0d1526] border border-slate-700/50 text-lg shadow-xl hover:border-amber-500/50 hover:text-amber-400 transition-all active:scale-90">
              {action.icon}
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateY(20px) scale(0.85); }
          to   { opacity:1; transform:translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN LAYOUT
// ─────────────────────────────────────────────────────────────

export default function MainLayout({ children }) {
  const navigate          = useNavigate();
  const location          = useLocation();
  const { user, logout }  = useAuth();
  const { t, i18n }       = useTranslation();

  // UI state
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [langOpen,     setLangOpen]     = useState(false);
  const [currOpen,     setCurrOpen]     = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [qrOpen,       setQrOpen]       = useState(false);
  const [fabOpen,      setFabOpen]      = useState(false);
  const [emergencyOpen,setEmergencyOpen]= useState(false);
  const [aiOpen,       setAiOpen]       = useState(false);

  // Network status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineBanner, setOfflineBanner] = useState(false);

  // Selected currency (display only for now)
  const [activeCurrency, setActiveCurrency] = useState('HTG');

  useEffect(() => {
    const handleOnline  = () => { setIsOnline(true);  setOfflineBanner(false); };
    const handleOffline = () => { setIsOnline(false); setOfflineBanner(true);  };
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close FAB on navigation
  useEffect(() => { setFabOpen(false); }, [location.pathname]);

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
  const curData      = CURRENCIES.find(c => c.code === activeCurrency) || CURRENCIES[0];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans antialiased">

      {/* ── Offline banner ──────────────────────────────────────── */}
      {offlineBanner && (
        <div className="fixed top-0 left-0 right-0 z-[999] flex items-center justify-between px-4 py-2 bg-red-900/95 backdrop-blur border-b border-red-700">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-red-300 shrink-0" />
            <span className="text-xs font-bold text-red-100">Pa gen koneksyon entènèt. JOBFAST travay offline.</span>
          </div>
          <button type="button" onClick={() => window.location.reload()} className="text-red-300 hover:text-white">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Premium Header ───────────────────────────────────────── */}
      <header className={`fixed left-0 right-0 z-50 flex flex-col bg-[#0b1120]/97 backdrop-blur-xl border-b border-slate-800/50 shadow-2xl shadow-black/40 ${offlineBanner ? 'top-8' : 'top-0'}`}>

        {/* Row 1 — main navigation row */}
        <div className="h-14 flex items-center px-3 gap-1.5">

          {/* Left: hamburger / back */}
          {!isHome ? (
            <button type="button" onClick={() => navigate(-1)} aria-label={t("nav.back", { defaultValue:"Retounen" })}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/70 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <button type="button" onClick={() => setMenuOpen(true)} aria-label={t("nav.openMenu", { defaultValue:"Ouvri meni" })}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/70 transition-all">
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Center: logo + global search trigger */}
          <div className="flex-1 flex items-center gap-2 justify-center">
            <button type="button" onClick={() => navigate("/dashboard")} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/40">
                <Zap className="w-4 h-4 text-slate-950" fill="currentColor" />
              </div>
              <span className="text-[17px] font-black tracking-tight">JOB<span className="text-amber-400">FAST</span></span>
            </button>
          </div>

          {/* Right: action cluster */}
          <div className="flex items-center gap-1">
            {/* Global Search */}
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Chèche"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/70 transition-all">
              <Search className="w-[18px] h-[18px]" />
            </button>

            {/* QR Scanner */}
            <button type="button" onClick={() => setQrOpen(true)} aria-label="Scanner QR"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/70 transition-all">
              <QrCode className="w-[17px] h-[17px]" />
            </button>

            {/* Notifications with badge */}
            <NavLink to="/notifications" aria-label="Notifikasyon"
              className={({ isActive }) => `relative w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                isActive ? "text-amber-400 bg-amber-500/10" : "text-slate-400 hover:text-amber-400 hover:bg-slate-800/70"
              }`}>
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-[#0b1120]" aria-label="Nouvo notifikasyon" />
            </NavLink>

            {isHome && (
              /* Avatar (home only) */
              <button type="button" onClick={() => navigate("/settings")} aria-label="Profil"
                className="relative w-8 h-8 rounded-xl overflow-hidden border-2 border-amber-500/40 hover:border-amber-400 transition-all shadow-lg shadow-amber-500/10 ml-0.5 shrink-0">
                <img src={avatarSrc} alt={user?.name || "user"} className="w-full h-full object-cover" />
                <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[#0b1120] ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`} />
              </button>
            )}
          </div>
        </div>

        {/* Row 2 — context bar (home only) */}
        {isHome && (
          <div className="h-9 flex items-center px-4 border-t border-slate-800/40 bg-[#070e1c]/60 gap-3">

            {/* Location */}
            <button type="button" onClick={() => navigate("/map")}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400/90 hover:text-amber-400 transition-colors shrink-0">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[90px]">{userCity || "—"}</span>
            </button>

            <div className="w-px h-3 bg-slate-700/60 shrink-0" />

            {/* Wallet balance */}
            <NavLink to="/wallet"
              className="flex items-center gap-1.5 text-[11px] font-semibold text-green-400/80 hover:text-green-400 transition-colors shrink-0">
              <Wallet className="w-3 h-3 shrink-0" />
              <span>HTG 0.00</span>
            </NavLink>

            <div className="flex-1" />

            {/* Currency switcher */}
            <div className="relative">
              <button type="button" onClick={() => { setCurrOpen(v => !v); setLangOpen(false); }}
                className="flex items-center gap-1 h-6 px-2 rounded-lg bg-slate-800/70 border border-slate-700/50 hover:border-amber-500/40 transition-all">
                <span className="text-sm leading-none">{curData.flag}</span>
                <span className="text-[9px] font-bold text-slate-400">{curData.code}</span>
              </button>
              {currOpen && (
                <>
                  <div className="fixed inset-0 z-[150]" onClick={() => setCurrOpen(false)} />
                  <div className="absolute right-0 top-8 z-[200] w-36 bg-[#0d1526] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
                    {CURRENCIES.map(c => (
                      <button key={c.code} type="button" onClick={() => { setActiveCurrency(c.code); setCurrOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-bold transition hover:bg-slate-800/80 ${
                          activeCurrency === c.code ? "text-amber-400 bg-amber-500/10" : "text-slate-300"
                        }`}>
                        <span className="text-sm">{c.flag}</span>
                        <span className="flex-1 text-left">{c.code}</span>
                        <span className="text-slate-500">{c.symbol}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Language switcher */}
            <div className="relative">
              <button type="button" onClick={() => { setLangOpen(v => !v); setCurrOpen(false); }}
                className="flex items-center gap-1 h-6 px-2 rounded-lg bg-slate-800/70 border border-slate-700/50 hover:border-amber-500/40 transition-all">
                <span className="text-sm leading-none">{currentFlag}</span>
                <span className="text-[9px] font-bold text-slate-400">{currentCode}</span>
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-[150]" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 top-8 z-[200] w-36 bg-[#0d1526] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
                    {LANGS.map(l => (
                      <button key={l.code} type="button" onClick={() => handleLangChange(l.code)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-bold transition hover:bg-slate-800/80 ${
                          currentLang === l.code ? "text-amber-400 bg-amber-500/10" : "text-slate-300"
                        }`}>
                        <span className="text-sm">{l.flag}</span>
                        <span className="flex-1 text-left">{l.label}</span>
                        {currentLang === l.code && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Network status dot */}
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[9px] font-medium text-slate-500">{isOnline ? 'Online' : 'Offline'}</span>
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
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
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
              <div className="mx-3 mt-3 p-3 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 flex items-center gap-3 shrink-0">
                <img src={avatarSrc} alt={user.name || "user"}
                  className="w-11 h-11 rounded-xl border-2 border-amber-500/30 object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 truncate">
                    {user.profession || user.role}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                    <span className="text-[9px] text-slate-400">{isOnline ? t("nav.available", { defaultValue:"Disponib" }) : 'Offline'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto" style={{ scrollbarWidth:'none' }}>
              {MENU_NAV.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.path} to={item.path} onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl transition text-sm font-medium ${
                        isActive
                          ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {t(item.labelKey, { defaultValue: item.labelKey })}
                  </NavLink>
                );
              })}
            </nav>

            {/* Quick actions in drawer */}
            <div className="mx-3 mb-3 p-3 bg-slate-800/40 rounded-2xl border border-slate-700/50 shrink-0">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-2">Aksyon Rapid</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon:<Sparkles className="w-4 h-4" />, label:'AI',    action:() => { setMenuOpen(false); setAiOpen(true);      } },
                  { icon:<QrCode className="w-4 h-4" />,   label:'QR',    action:() => { setMenuOpen(false); setQrOpen(true);       } },
                  { icon:<ShieldAlert className="w-4 h-4" />,label:'SOS', action:() => { setMenuOpen(false); setEmergencyOpen(true);} },
                ].map(qa => (
                  <button key={qa.label} type="button" onClick={qa.action}
                    className="flex flex-col items-center gap-1 p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all text-slate-300 hover:text-white">
                    {qa.icon}
                    <span className="text-[10px] font-bold">{qa.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-3 pb-6 space-y-0.5 border-t border-slate-800/50 pt-3 shrink-0">
              <NavLink to="/settings" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition font-medium">
                <Settings className="w-4 h-4 shrink-0" />
                {t("nav.settings", { defaultValue:"Paramèt" })}
              </NavLink>
              <button type="button" onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition font-medium">
                <LogOut className="w-4 h-4 shrink-0" />
                {t("nav.logout", { defaultValue:"Dekonekte" })}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className={`flex-1 ${isHome ? (offlineBanner ? "mt-[124px]" : "mt-[92px]") : (offlineBanner ? "mt-[90px]" : "mt-14")} pb-24`}>
        {children}
      </main>

      {/* ── Bottom Navigation ─────────────────────────────────────── */}
      <nav
        aria-label="Navigasyon prensipal"
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#0b1120]/98 backdrop-blur-xl border-t border-slate-800/50 shadow-2xl shadow-black/50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-end justify-around h-16 px-0.5 relative">
          {BOTTOM_NAV.map((item, idx) => {

            /* ── SOS ─────────────────────────────────────── */
            if (item.type === 'sos') return (
              <button key="sos" type="button"
                onClick={() => setEmergencyOpen(true)}
                aria-label="SOS Ijans"
                className="relative flex flex-col items-center justify-center flex-1 gap-0.5 py-2 text-red-500 hover:text-red-400 transition-all active:scale-90">
                <div className="relative">
                  <ShieldAlert className="w-[18px] h-[18px]" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-[#0b1120] animate-pulse" />
                </div>
                <span className="text-[8px] font-black leading-none tracking-tight">SOS</span>
              </button>
            );

            /* ── FAB ─────────────────────────────────────── */
            if (item.type === 'fab') return (
              <div key="fab" className="flex flex-col items-center justify-center flex-1">
                <button
                  type="button"
                  onClick={() => setFabOpen(v => !v)}
                  aria-label="Kreye"
                  aria-expanded={fabOpen}
                  className="relative w-11 h-11 -mt-5"
                >
                  <div className="absolute inset-[-3px] rounded-[16px] bg-amber-500/20 animate-ping" style={{ animationDuration:"2.5s" }} />
                  <div className={`relative w-11 h-11 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/40 transition-transform duration-200 ${fabOpen ? 'rotate-45 scale-110' : 'active:scale-95'}`}>
                    <Plus className="w-5 h-5 text-slate-950" />
                  </div>
                </button>
                <span className="text-[8px] font-bold text-slate-600 mt-1">Kreye</span>
              </div>
            );

            /* ── NavLink ─────────────────────────────────── */
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                aria-label={t(item.labelKey, { defaultValue: item.labelKey })}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center flex-1 gap-0.5 py-2 transition-all ${
                    isActive ? "text-amber-400" : "text-slate-600 hover:text-slate-400"
                  }`}
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      {isActive && <span className="absolute inset-0 -m-1.5 rounded-xl bg-amber-500/8" />}
                      <Icon className={`w-[18px] h-[18px] transition-all duration-200 relative ${isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" : ""}`} />
                    </div>
                    <span className={`text-[8px] font-bold leading-none transition-all ${isActive ? "text-amber-400" : "text-slate-600"}`}>
                      {t(item.labelKey, { defaultValue: item.labelKey })}
                    </span>
                    {isActive && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-amber-400/60" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* ── Speed dial overlay ───────────────────────────────────── */}
      <SpeedDial open={fabOpen} onClose={() => setFabOpen(false)} actions={FAB_ACTIONS} t={t} />

      {/* AI Assistant modal — triggered from drawer Quick Actions */}
      {aiOpen && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/75" onClick={() => setAiOpen(false)} />
          <div className="relative w-full bg-[#0d1526] rounded-t-3xl z-10 p-5 pb-10">
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">AI Asistan JOBFAST</h3>
                <p className="text-[10px] text-slate-400">Toujou disponib pou ede ou</p>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-4 mb-4">
              <p className="text-sm text-slate-300">Bonjou! Mwen kapab ede ou:</p>
              <ul className="mt-2 space-y-1">
                {['Jwenn pi bon djòb pou ou', 'Prepare CV ou', 'Prepare pou entèvyou', 'Eksplike règ kontra', 'Kalkile salè'].map(tip => (
                  <li key={tip} className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="text-indigo-400">✦</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
            <button type="button" onClick={() => { navigate('/chat'); setAiOpen(false); }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black text-sm shadow-lg">
              💬 Kòmanse Chat avèk AI
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────── */}
      {searchOpen    && <GlobalSearchModal onClose={() => setSearchOpen(false)} />}
      {qrOpen        && <QRScannerModal    onClose={() => setQrOpen(false)} />}
      {emergencyOpen && <EmergencyModal    onClose={() => setEmergencyOpen(false)} />}
    </div>
  );
}
