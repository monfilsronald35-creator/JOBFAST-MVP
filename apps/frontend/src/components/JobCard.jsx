import React from "react";
import { 
  Briefcase, 
  Building2, 
  Zap, 
  Terminal, 
  MapPin, 
  DollarSign 
} from "lucide-react";

const CATEGORY_ICONS = {
  construction: Briefcase,
  services: Zap,
  businesses: Building2,
  jobs: Terminal,
  default: Briefcase
};

function JobCard({ 
  title, 
  location = "Bávaro, Punta Cana", 
  distance = "0.0", 
  price, 
  period = "jou", 
  status = "disponib",
  category = "default",
  onClick 
}) {
  const getStatusClasses = (currentStatus) => {
    switch (currentStatus?.toLowerCase()) {
      case "disponib":
        return "bg-emerald-500 ring-emerald-500/20";
      case "okipe":
        return "bg-amber-500 ring-amber-500/20";
      case "sou chantier":
      case "chantier":
        return "bg-blue-500 ring-blue-500/20";
      case "pa disponib":
        return "bg-rose-500 ring-rose-500/20";
      default:
        return "bg-emerald-500 ring-emerald-500/20";
    }
  };

  const IconComponent = CATEGORY_ICONS[category.toLowerCase()] || CATEGORY_ICONS.default;

  return (
    <div 
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`${title} nan distans ${distance} kilomèt`}
      className="select-none w-full bg-navy-800/20 border border-slate-800/60 hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all duration-200 group shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-400/20"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        
        <div className="relative flex-shrink-0 w-12 h-12 bg-navy-900 rounded-xl border border-navy-800 flex items-center justify-center text-gold-400 shadow-inner group-hover:scale-105 transition-transform duration-200">
          <IconComponent className="h-5 w-5" strokeWidth={2.5} />
          <span 
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-navy-900 ring-4 ${getStatusClasses(status)}`}
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0 flex flex-col gap-1">
          <h3 className="text-xs font-black tracking-wide text-white truncate group-hover:text-gold-400 transition-colors duration-200">
            {title}
          </h3>
          
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-gold-400/80" strokeWidth={2.5} />
            <span className="truncate">{location}</span>
          </div>
        </div>

      </div>

      <div className="flex flex-col items-end justify-between h-12 flex-shrink-0 pl-2">
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-navy-900/60 border border-slate-800 px-2 py-0.5 rounded-lg">
          {distance} km
        </span>
        
        <div className="text-right flex items-baseline">
          <span className="text-xs font-black text-gold-400 tracking-tight">
            USD {price}
          </span>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider ml-1">
            / {period}
          </span>
        </div>
      </div>

    </div>
  );
}

export default JobCard;
