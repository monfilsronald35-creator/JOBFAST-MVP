import React, { memo } from "react";
import {
  Briefcase, Building2, Zap, Terminal,
  MapPin, DollarSign, Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  construction: Briefcase,
  services:     Zap,
  businesses:   Building2,
  jobs:         Terminal,
  default:      Briefcase,
};

const CATEGORY_LABELS: Record<string, string> = {
  construction: "Construction",
  services:     "Services",
  businesses:   "Business",
  jobs:         "Job",
  default:      "General",
};

interface StatusEntry { color: string; label: string; }
const STATUS_CONFIG: Record<string, StatusEntry> = {
  disponib:         { color: "bg-emerald-500 ring-emerald-500/20", label: "Disponib"     },
  okipe:            { color: "bg-amber-500 ring-amber-500/20",     label: "Okipe"        },
  chantier:         { color: "bg-blue-500 ring-blue-500/20",       label: "Sou Chantier" },
  "sou chantier":   { color: "bg-blue-500 ring-blue-500/20",       label: "Sou Chantier" },
  "pa disponib":    { color: "bg-rose-500 ring-rose-500/20",       label: "Pa Disponib"  },
};

interface JobCardProps {
  title:        string;
  location?:    string;
  distance?:    number | string;
  price?:       number | string;
  period?:      string;
  status?:      string;
  category?:    string;
  description?: string;
  featured?:    boolean;
  verified?:    boolean;
  onClick?:     () => void;
}

function JobCard({
  title,
  location    = "Bávaro, Punta Cana",
  distance    = 0,
  price       = 0,
  period      = "jou",
  status      = "disponib",
  category    = "default",
  description = "",
  featured    = false,
  verified    = false,
  onClick,
}: JobCardProps) {
  const normalizedStatus   = String(status).toLowerCase();
  const normalizedCategory = String(category).toLowerCase();

  const statusInfo    = STATUS_CONFIG[normalizedStatus] ?? STATUS_CONFIG['disponib']!;
  const IconComponent = CATEGORY_ICONS[normalizedCategory] ?? CATEGORY_ICONS['default']!;
  const categoryLabel = CATEGORY_LABELS[normalizedCategory] ?? CATEGORY_LABELS['default']!;

  const formattedPrice    = Number(price    || 0).toLocaleString("en-US");
  const formattedDistance = Number(distance || 0).toFixed(1);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${title} nan ${location}`}
      className={`
        group relative w-full select-none rounded-2xl border p-4 text-left shadow-md
        cursor-pointer transition-all duration-300 active:scale-[0.99]
        focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-400/20
        ${featured ? "border-gold-400/30 bg-gold-400/[0.03]" : "border-slate-800/60 bg-navy-800/20"}
        hover:border-gold-400/20 hover:bg-navy-800/30
      `}
    >
      {featured && (
        <span className="absolute right-3 top-3 rounded-full bg-gold-400 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-navy-950">
          Featured
        </span>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-navy-800 bg-navy-900 text-gold-400 shadow-inner transition-transform duration-200 group-hover:scale-105">
            <IconComponent className="h-5 w-5" strokeWidth={2.5} />
            <span
              aria-hidden="true"
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-navy-900 ring-4 ${statusInfo.color}`}
            />
          </div>

          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-black text-white group-hover:text-gold-400">
                {title}
              </h3>
              {verified && (
                <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[8px] font-black uppercase text-blue-400">
                  Verified
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gold-400/80" strokeWidth={2.5} />
              <span className="truncate">{location}</span>
            </div>
            {description && (
              <p className="mt-1 line-clamp-2 text-[11px] text-slate-400">{description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="rounded-lg border border-slate-800 bg-navy-900/60 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
            {formattedDistance} km
          </span>
          <span className="rounded-lg border border-gold-400/20 bg-gold-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-gold-400">
            {categoryLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-800/40 pt-3">
        <div className="flex items-center gap-1 text-emerald-400">
          <DollarSign className="h-3.5 w-3.5" />
          <span className="text-sm font-black">USD {formattedPrice}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase">/ {period}</span>
          </div>
          <span className="rounded-full border border-slate-800 bg-navy-900 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white">
            {statusInfo.label}
          </span>
        </div>
      </div>
    </button>
  );
}

export default memo(JobCard);