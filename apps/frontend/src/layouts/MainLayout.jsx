import React, { memo } from "react";
import PropTypes from "prop-types";
import { MapPin, Navigation, Cpu } from "lucide-react";

import Navbar from "./Navbar";
import BottomNavigation from "./BottomNavigation";

const CURRENT_YEAR = new Date().getFullYear();

const Footer = memo(function Footer() {
  return (
    <footer
      aria-label="Footer information"
      className="
        mt-auto
        w-full
        select-none
        border-t
        border-slate-800/40
        bg-navy-950/40
        backdrop-blur-sm
      "
    >
      <div className="mx-auto max-w-5xl px-6 py-6 text-center">
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
              className="h-3 w-3 text-gold-400/80"
              strokeWidth={2.5}
            />
            <span>GPS Network</span>
          </div>

          <span className="hidden sm:inline text-slate-700">•</span>

          <div className="flex items-center gap-1">
            <Navigation
              className="h-3 w-3 text-gold-400/80"
              strokeWidth={2.5}
            />
            <span>Toupre w</span>
          </div>

          <span className="hidden sm:inline text-slate-700">•</span>

          <div className="flex items-center gap-1">
            <Cpu
              className="h-3 w-3 text-gold-400/80"
              strokeWidth={2.5}
            />
            <span>Sèvis sou demand</span>
          </div>
        </div>

        <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          © {CURRENT_YEAR} JOBFAST.RD — Tout dwa rezève.
        </p>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

function MainLayout({ children }) {
  return (
    <div
      className="
        flex
        min-h-[100dvh]
        flex-col
        overflow-x-hidden
        bg-gradient-to-b
        from-navy-950
        to-navy-900
        font-sans
        text-white
        antialiased
      "
    >
      <Navbar />

      <main
        role="main"
        className="
          w-full
          flex-1
          px-4
          py-6
          pb-28
          md:px-6
          md:pb-12
        "
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-5xl
            flex-1
            flex-col
          "
        >
          {children}
        </div>
      </main>

      <Footer />

      <div className="lg:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
}

MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

MainLayout.displayName = "MainLayout";

export default memo(MainLayout);