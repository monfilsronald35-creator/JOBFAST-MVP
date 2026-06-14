import React, { useState, useMemo, useEffect, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NavButton = memo(function NavButton({ onClick, active, label, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center gap-1 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10 ${
        active ? "text-gold-400" : "text-slate-500 hover:text-gold-400"
      }`}
    >
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
});

export default function ServicesOnDemand() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadServices = async () => {
      setIsLoading(true);
      try {
        const data = [
          { id: "chef", label: "Chef lakay", desc: "Manje ak kwit nan kay", icon: "🍳" },
          { id: "plumber", label: "Plonbye", desc: "Reparasyon tiyo ak plonbri", icon: "🔧" },
          { id: "doctor", label: "Doktè", desc: "Konsiltasyon ak swen medikal", icon: "🩺" },
          { id: "nurse", label: "Enfimyè", desc: "Swen enfimyè lakay", icon: "👩‍⚕️" },
          { id: "taxi", label: "Taksi", desc: "Transpò prive ak kous", icon: "🚖" },
          { id: "delivery", label: "Livrezon", desc: "Livrezon pakè ak komisyon", icon: "📦" },
          { id: "cleaning", label: "Netwayaj", desc: "Netwayaj kay ak biwo", icon: "🧹" },
          { id: "videographer", label: "Videyast", desc: "Kaptire videyo ak evènman", icon: "🎥" },
          { id: "designer", label: "Disajner", desc: "Grafik ak konsepsyon vizyèl", icon: "🎨" },
        ];

        if (mounted) setServices(data);
      } catch (err) {
        if (mounted) setServices([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadServices();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return services;

    return services.filter(
      (service) =>
        service?.label?.toLowerCase?.().includes(q) ||
        service?.desc?.toLowerCase?.().includes(q)
    );
  }, [searchQuery, services]);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-900 pb-24 font-sans text-white select-none animate-fade-in">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 pb-4 pt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Retounen"
          className="rounded-xl border border-slate-800 bg-slate-800/60 p-2.5 text-slate-400 transition-all active:scale-95 hover:text-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Sèvis sou Demann</h2>
        <div className="h-9 w-9" />
      </div>

      <div className="mx-auto mb-5 w-full max-w-md px-5">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            placeholder="Chache yon sèvis..."
            aria-label="Chache yon sèvis"
            className="w-full rounded-xl border border-slate-800 bg-slate-800/40 py-3.5 pl-11 pr-4 text-sm font-semibold text-white placeholder-slate-500 transition-all focus:border-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
          />
          <div className="pointer-events-none absolute left-4 flex items-center">
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 overflow-y-auto px-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-800/20 px-4 py-14 text-center">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-gold-400" />
            <h3 className="text-sm font-bold text-white">Ap chaje sèvis yo...</h3>
            <p className="mt-2 max-w-xs text-xs leading-5 text-slate-400">
              Tanpri tann pandan nou ap prepare lis sèvis yo.
            </p>
          </div>
        ) : filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => navigate(`/services/${service.id}`)}
              className="group flex min-h-16 w-full items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-800/30 p-4 transition-all active:scale-[0.99] hover:border-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 shadow-inner transition-colors group-hover:border-gold-400/30">
                  <span role="img" aria-label={service.label} className="text-lg">
                    {service.icon}
                  </span>
                </div>

                <div className="flex min-w-0 flex-col text-left">
                  <span className="truncate text-sm font-bold tracking-wide text-white transition-colors group-hover:text-gold-400">
                    {service?.label}
                  </span>
                  <span className="mt-0.5 line-clamp-2 text-[11px] font-medium text-slate-400">
                    {service?.desc}
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-slate-500 transition-all group-hover:translate-x-0.5 group-hover:text-gold-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-800/20 px-4 py-14 text-center animate-fade-in">
            <div className="mb-4 text-4xl" aria-hidden="true">
              🔍
            </div>
            <h3 className="text-sm font-bold text-white">Nou pa jwenn sèvis sa a</h3>
            <p className="mt-2 max-w-xs text-xs leading-5 text-slate-400">
              Eseye chèche yon lòt mo kle oswa chwazi yon lòt kategori.
            </p>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-md items-center justify-between border-t border-slate-900 bg-slate-950/95 px-6 py-2 backdrop-blur-md">
        <NavButton
          label="Akey"
          active={isActive("/dashboard")}
          onClick={() => navigate("/dashboard")}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
        />

        <NavButton
          label="Rechèch"
          active={isActive("/search")}
          onClick={() => navigate("/search")}
          icon={
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
            </svg>
          }
        />

        <NavButton
          label="Poste"
          active={isActive("/post-job")}
          onClick={() => navigate("/post-job")}
          icon={
            <div className={`relative -mt-4 flex h-8 w-8 items-center justify-center rounded-xl border shadow-lg ${
              isActive("/post-job") ? "border-gold-400 bg-slate-800 text-gold-400" : "border-slate-800 bg-slate-800 text-gold-400"
            }`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          }
        />

        <NavButton
          label="Notifikasyon"
          active={isActive("/notifications")}
          onClick={() => navigate("/notifications")}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />

        <NavButton
          label="Profil"
          active={isActive("/profile")}
          onClick={() => navigate("/profile")}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
      </nav>
    </div>
  );
}