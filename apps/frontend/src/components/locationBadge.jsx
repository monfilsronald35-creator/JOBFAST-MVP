import React from "react";
import { MapPin, Navigation, Activity } from "lucide-react";
import { formatLocation } from "../utils/location";

const STATUS_CONFIG = Object.freeze({
  available: { color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", dot: "bg-emerald-500 ring-emerald-500/20" },
  busy: { color: "text-amber-400 border-amber-500/30 bg-amber-500/10", dot: "bg-amber-500 ring-amber-500/20" },
  working: { color: "text-blue-400 border-blue-500/30 bg-blue-500/10", dot: "bg-blue-500 ring-blue-500/20" },
  offline: { color: "text-rose-400 border-rose-500/30 bg-rose-500/10", dot: "bg-rose-500 ring-rose-500/20" },
});

function LocationBadge({
  location = null,
  distanceKm = null,
  availability = "available",
  role = "",
  businessType = "",
  serviceType = "",
  compact = false
}) {
  const formatted = formatLocation(location);
  const locationText = (typeof formatted === "string" ? formatted.trim() : "") || "Kote ki enkoni";

  const category = (role || businessType || serviceType || "jeneral").trim();

  const normalizedStatus = (availability || "available").toLowerCase();
  const statusConfig = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.available;

  const safeDistance = (typeof distanceKm === "number" && Number.isFinite(distanceKm) && distanceKm >= 0)
    ? distanceKm.toFixed(1)
    : null;

  return (
    <div 
      className={`select-none w-full flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-navy-800/20 p-4 transition-all duration-200 ${
        compact ? "p-3 gap-2" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3 w-full">
        <span className="truncate text-[10px] font-black uppercase tracking-widest text-white">
          {category}
        </span>

        <span
          aria-label={`Status: ${normalizedStatus}`}
          title={normalizedStatus}
          className={`h-2.5 w-2.5 rounded-full ring-4 ${statusConfig.dot}`}
        />
      </div>

      <div 
        className="flex items-start gap-1.5 text-xs font-bold text-slate-300 w-full"
        title={locationText}
      >
        <MapPin className="h-4 w-4 shrink-0 text-gold-400" strokeWidth={2.5} />
        <span className="break-words leading-snug">{locationText}</span>
      </div>

      {safeDistance && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
          <Navigation className="h-3.5 w-3.5 shrink-0 text-slate-600" strokeWidth={2.5} />
          <span>{safeDistance} km toupre w</span>
        </div>
      )}

      <div className="mt-1 flex items-center gap-1.5 w-full">
        <div className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${statusConfig.color}`}>
          <Activity className="h-3 w-3" strokeWidth={2.5} />
          <span>{normalizedStatus}</span>
        </div>
      </div>

    </div>
  );
}

export default LocationBadge;
