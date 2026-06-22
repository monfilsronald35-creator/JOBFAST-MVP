import React, { useCallback } from "react";
import { MapPin, User, Briefcase, Star, Phone } from "lucide-react";

const STATUS_CONFIG = Object.freeze({
  ACTIVE: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  BUSY: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  OFFLINE: "bg-rose-500/10 border-rose-500/30 text-rose-400",
  DEFAULT: "bg-slate-500/10 border-slate-500/30 text-slate-400",
});

function UserCard({ user, onClick }) {
  if (!user?.id || !user?.name) return null;

  const {
    id,
    name,
    role,
    profession,
    location,
    distance,
    status,
    rating,
    phone,
    bio,
  } = user;

  const normalizedStatus = (status || "DEFAULT").toUpperCase().trim();
  const statusClass = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.DEFAULT;
  const displayRole = role || profession || "General";
  const safeRating = rating ?? "0.0";

  const handleClick = useCallback(() => {
    onClick?.(id);
  }, [onClick, id]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group w-full select-none rounded-2xl border border-slate-800/60 bg-navy-800/20 p-5 text-left transition-all duration-200 hover:border-slate-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-400/20"
      aria-label={`View user ${name}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gold-400">
          <User className="h-3.5 w-3.5" aria-hidden="true" />
          <span>User Profile</span>
        </div>

        <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${statusClass}`}>
          {normalizedStatus}
        </span>
      </div>

      <h3 className="text-sm font-black text-white group-hover:text-gold-400 transition-colors">
        {name}
      </h3>

      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
        <Briefcase className="mr-1 inline h-3 w-3" aria-hidden="true" />
        {displayRole}
      </p>

      <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-slate-400">
        <MapPin className="h-3.5 w-3.5 text-gold-400/80" aria-hidden="true" />
        <span className="truncate">
          {location || "Unknown"} {distance ? `• ${distance}` : ""}
        </span>
      </div>

      {bio && (
        <p className="mt-3 text-xs italic leading-relaxed text-slate-500">
          {bio}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-800/40 pt-3">
        <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
          <span>{safeRating}</span>
        </div>

        {phone && (
          <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{phone}</span>
          </div>
        )}
      </div>
    </button>
  );
}

export default React.memo(UserCard);
