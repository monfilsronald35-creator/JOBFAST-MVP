import React, { memo } from "react";
import PropTypes from "prop-types";
import { MapPin, Navigation, Cpu } from "lucide-react";

import Navbar from "./Navbar";
import BottomNav from "./BottomNav";

const CURRENT_YEAR = new Date().getFullYear();

/* =====================================================
   FOOTER
===================================================== */

const Footer = memo(function Footer() {
  return (
    <footer
      role="contentinfo"
      aria-label="Footer information"
      className="
        w-full
        select-none
        border-t
        border-white/5
        bg-[#0b1329]/40
        backdrop-blur-sm
      "
    >
      <div
        className="
          mx-auto
          max-w-5xl
          px-6
          py-6
          pb-[max(env(safe-area-inset-bottom),24px)]
          text-center
        "
      >
        <div
          className="
            flex
            flex-wrap
            items-center
            justify-center
            gap-x-4
            gap-y-2
            text-[10px]
            font-black
            uppercase
            tracking-widest
            text-slate-500
          "
        >
          <div className="flex items-center gap-1">
            <MapPin
              className="h-3 w-3 text-amber-500/80"
              strokeWidth={2.5}
            />
            <span>GPS Network</span>
          </div>

          <span className="hidden sm:inline text-slate-700">
            •
          </span>

          <div className="flex items-center gap-1">
            <Navigation
              className="h-3 w-3 text-amber-500/80"
              strokeWidth={2.5}
            />
            <span>Toupre w</span>
          </div>

          <span className="hidden sm:inline text-slate-700">
            •
          </span>

          <div className="flex items-center gap-1">
            <Cpu
              className="h-3 w-3 text-amber-500/80"
              strokeWidth={2.5}
            />
            <span>Sèvis sou demand</span>
          </div>
        </div>

        <p
          className="
            mt-3
            text-[10px]
            font-bold
            uppercase
            tracking-wider
            text-slate-600
          "
        >
          © {CURRENT_YEAR} JOBFAST.RD — Tout dwa rezève.
        </p>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

/* =====================================================
   MAIN LAYOUT
===================================================== */

function MainLayout({ children }) {
  return (
    <div
      className="
        flex
        min-h-[100dvh]
        flex-col
        bg-[#050B18]
        font-sans
        text-slate-100
        antialiased
      "
    >
      {/* TOP NAVBAR */}
      <Navbar />

      {/* PAGE CONTENT */}
      <main
        role="main"
        aria-label="Page content"
        className="
          flex-1
          w-full
          px-4
          py-6
          pb-[calc(64px+max(env(safe-area-inset-bottom),16px))]
          md:px-6
          lg:pb-10
        "
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-5xl
            flex-col
          "
        >
          {children}
        </div>
      </main>

      {/* DESKTOP FOOTER */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

MainLayout.displayName = "MainLayout";

export default memo(MainLayout);