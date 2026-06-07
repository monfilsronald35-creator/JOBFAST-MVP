import React from "react";
import { MapPin, Navigation, Cpu } from "lucide-react";
import Navbar from "./Navbar";

const CURRENT_YEAR = new Date().getFullYear();

function Footer() {
  return (
    <footer className="select-none w-full border-t border-slate-800/40 bg-navy-950/40 mt-auto" aria-label="Footer information">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-2 py-6 text-center px-6">
        
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-gold-400/80" strokeWidth={2.5} />
            <span>GPS Network</span>
          </div>
          <span className="hidden sm:inline text-slate-700">•</span>
          <div className="flex items-center gap-1">
            <Navigation className="h-3 w-3 text-gold-400/80" strokeWidth={2.5} />
            <span>Toupre w</span>
          </div>
          <span className="hidden sm:inline text-slate-700">•</span>
          <div className="flex items-center gap-1">
            <Cpu className="h-3 w-3 text-gold-400/80" strokeWidth={2.5} />
            <span>Sèvis sou demand</span>
          </div>
        </div>

        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          &copy; {CURRENT_YEAR} JOBFAST.RD — Tout dwa rezève.
        </p>

      </div>
    </footer>
  );
}

function MainLayout({ children }) {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-gradient-to-b from-navy-950 to-navy-900 antialiased font-sans text-white">
      <Navbar />

      <main className="flex flex-1 flex-col w-full px-4 py-6 md:px-6 pb-24 md:pb-12" role="main">
        <div className="mx-auto w-full max-w-5xl flex-1 flex flex-col">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default MainLayout;
