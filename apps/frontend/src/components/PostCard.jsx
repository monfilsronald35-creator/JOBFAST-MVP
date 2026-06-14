import React from "react";
import {
  Briefcase,
  Building2,
  Zap,
  Folder,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  OPEN: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  BUSY: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  DEFAULT: "bg-rose-500/10 border-rose-500/30 text-rose-400",
};

const TYPE_CONFIG = {
  construction: { label: "Construction", icon: Briefcase },
  business: { label: "Business", icon: Building2 },
  service: { label: "Service", icon: Zap },
  default: { label: "General", icon: Folder },
};

function PostCard({ post, onClick }) {
  if (!post?.id || !post?.title) return null;

  const {
    id,
    title,
    role,
    type,
    status,
    location,
    distance,
    name,
    bio,
    available,
  } = post;

  const normalizedType = (type || "default").toLowerCase();
  const normalizedStatus = (status || "default").toUpperCase();

  const statusClass = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.DEFAULT;
  const typeInfo = TYPE_CONFIG[normalizedType] || TYPE_CONFIG.default;
  const TypeIcon = typeInfo.icon;

  return (
    <button
      type="button"
      onClick={() => onClick?.(id)}
      className="group select-none w-full rounded-2xl border border-slate-800/60 bg-navy-800/20 p-5 text-left transition-all duration-200 active:scale-[0.99] hover:border-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-400/20"
      aria-label={`Ouvri pòs ${title}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gold-400">
          <TypeIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          <span>{typeInfo.label}</span>
        </div>

        <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${statusClass}`}>
          {status || "UNKNOWN"}
        </span>
      </div>

      <h3 className="text-sm font-black tracking-wide text-white group-hover:text-gold-400 transition-colors">
        {title}
      </h3>

      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
        {role || "General"}
      </p>

      <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-slate-400">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-gold-400/80" strokeWidth={2.5} aria-hidden="true" />
        <span className="truncate">
          {location || "Unknown"} {distance ? `• ${distance}` : ""}
        </span>
      </div>

      {name && (
        <div className="mt-4 border-t border-slate-800/40 pt-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-navy-800 bg-navy-900 text-slate-400">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <span className="text-xs font-bold text-slate-300">{name}</span>
          </div>

          {bio && (
            <p className="mt-1.5 pl-8 text-xs font-medium italic text-slate-500">
              {bio}
            </p>
          )}
        </div>
      )}

      {normalizedType === "construction" && (
        <div className="mt-4 flex items-center gap-2 border-t border-slate-800/40 pt-3 text-[11px] font-black uppercase tracking-wider">
          {available === false ? (
            <>
              <XCircle className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
              <span className="text-rose-400">Okipe (Pa disponib)</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span className="text-emerald-400">Disponib pou travay</span>
            </>
          )}
        </div>
      )}
    </button>
  );
}

export default React.memo(PostCard);
