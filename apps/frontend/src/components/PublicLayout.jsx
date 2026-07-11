import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Zap, ChevronDown, Download, Globe } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// NAV LINKS
// ─────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Akèy",         path: "/home"            },
  { label: "Djòb",         path: "/home#jobs"        },
  { label: "Sèvis",        path: "/home#services"    },
  { label: "Antrepriz",    path: "/home#companies"   },
  { label: "Pri",          path: "/home#pricing"     },
];

const MORE_LINKS = [
  { label: "Sant Èd",      path: "/help"             },
  { label: "Konsènan nou", path: "/about"            },
  { label: "Kontakte nou", path: "/contact"          },
  { label: "Konfidansyalite", path: "/privacy"       },
  { label: "Kondisyon",    path: "/terms"            },
];

const STORE_LINKS = [
  { icon: "🍎", label: "App Store",    href: "#" },
  { icon: "🤖", label: "Google Play",  href: "#" },
];

// ─────────────────────────────────────────────────────────────
// PUBLIC LAYOUT
// ─────────────────────────────────────────────────────────────

export default function PublicLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen,       setMoreOpen]       = useState(false);
  const [scrolled,       setScrolled]       = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans antialiased flex flex-col">

      {/* ── Public Header ─────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0b1120]/98 backdrop-blur-xl border-b border-slate-800/60 shadow-2xl shadow-black/50"
          : "bg-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">

          {/* Logo */}
          <button type="button" onClick={() => navigate("/home")} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/40">
              <Zap className="w-4 h-4 text-slate-950" fill="currentColor" />
            </div>
            <span className="text-[17px] font-black tracking-tight hidden sm:block">
              JOB<span className="text-amber-400">FAST</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_LINKS.map(l => (
              <a key={l.path} href={l.path}
                className="px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all">
                {l.label}
              </a>
            ))}

            {/* More dropdown */}
            <div className="relative">
              <button type="button" onClick={() => setMoreOpen(v => !v)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all">
                Plis
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setMoreOpen(false)} />
                  <div className="absolute left-0 top-10 z-[110] w-48 bg-[#0d1526] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
                    {MORE_LINKS.map(l => (
                      <a key={l.path} href={l.path} onClick={() => setMoreOpen(false)}
                        className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors font-medium">
                        {l.label}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          </nav>

          <div className="flex-1 md:flex-none" />

          {/* Download App button (desktop) */}
          <button type="button" onClick={() => navigate("/home#download")}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 rounded-xl border border-slate-700/50 hover:border-amber-500/40 transition-all">
            <Download className="w-3.5 h-3.5" />
            Telechaje App
          </button>

          {/* Language selector (public — minimal) */}
          <button type="button"
            className="hidden md:flex items-center gap-1 w-9 h-9 justify-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all">
            <Globe className="w-4 h-4" />
          </button>

          {/* Auth CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/login"
              className="px-4 py-2 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all">
              Konekte
            </NavLink>
            <NavLink to="/register"
              className="px-4 py-2 text-sm font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-lg shadow-amber-500/30 transition-all active:scale-95">
              Enskri Gratis
            </NavLink>
          </div>

          {/* Mobile hamburger */}
          <button type="button" onClick={() => setMobileMenuOpen(v => !v)} aria-label="Menu"
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 transition-all">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* ── Mobile Menu ──────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/60 bg-[#0b1120]/98 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map(l => (
                <a key={l.path} href={l.path}
                  className="flex items-center h-11 px-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all">
                  {l.label}
                </a>
              ))}
              <div className="h-px bg-slate-800 my-2" />
              {MORE_LINKS.map(l => (
                <a key={l.path} href={l.path}
                  className="flex items-center h-11 px-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
                  {l.label}
                </a>
              ))}
            </div>

            {/* Download badges */}
            <div className="px-4 pb-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-2">Telechaje App</p>
              <div className="flex gap-2">
                {STORE_LINKS.map(s => (
                  <a key={s.label} href={s.href}
                    className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-slate-800 border border-slate-700/60 rounded-xl hover:border-amber-500/40 transition-all">
                    <span className="text-lg">{s.icon}</span>
                    <span className="text-xs font-bold text-slate-300">{s.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Auth */}
            <div className="px-4 pb-6 flex gap-3">
              <NavLink to="/login"
                className="flex-1 py-3 text-center text-sm font-bold border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 rounded-xl transition-all">
                Konekte
              </NavLink>
              <NavLink to="/register"
                className="flex-1 py-3 text-center text-sm font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 transition-all">
                Enskri Gratis
              </NavLink>
            </div>
          </div>
        )}
      </header>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4">
        {children}
      </main>

      {/* ── Public Footer ─────────────────────────────────────── */}
      <footer className="border-t border-slate-800/50 bg-[#0b1120]/60 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-slate-950" fill="currentColor" />
              </div>
              <span className="text-sm font-black">JOB<span className="text-amber-400">FAST</span></span>
            </div>

            {/* Footer links */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {[...MORE_LINKS].map(l => (
                <a key={l.path} href={l.path} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  {l.label}
                </a>
              ))}
            </div>

            {/* Download badges */}
            <div className="flex gap-2 shrink-0">
              {STORE_LINKS.map(s => (
                <a key={s.label} href={s.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700/60 rounded-xl text-[10px] font-bold text-slate-300 hover:border-amber-500/40 transition-all">
                  <span>{s.icon}</span>
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-600 mt-6">
            © {new Date().getFullYear()} JOBFAST — Platfòm Travay #1 Ayiti ak Karayib. Tout dwa rezève.
          </p>
        </div>
      </footer>
    </div>
  );
}
