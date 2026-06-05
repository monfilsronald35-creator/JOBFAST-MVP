import React, { memo } from "react";
import PropTypes from "prop-types";

// ======================================================
// 📦 IKON SVG YO (Liy Fin, Lejè, Style Mondyal)
// ======================================================
const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

// Map Ikon Emoji oswa Ikon Custom selon Kategori yo (Menm jan ak makèt la)
const CATEGORY_ICONS = {
  construction: "🤠",
  services: "👷‍♂️",
  businesses: "👨‍💼",
  jobs: "🧑‍💻",
  default: "💼"
};

// ======================================================
// 🚀 MAIN JOB CARD COMPONENT
// ======================================================
function JobCard({ 
  title, 
  location, 
  distance, 
  price, 
  period = "jou", 
  status = "disponib", // disponib, okipe, chantier, pa_disponib
  category = "default",
  onClick 
}) {

  // Jere Estati a ak koulè pwen yo (Kòrèk selon MVP Flow la)
  const getStatusColor = (currentStatus) => {
    switch (currentStatus?.toLowerCase()) {
      case "disponib":
        return "bg-success-500"; // Vèt
      case "okipe":
        return "bg-warning-500"; // Jòn / Oranj
      case "sou chantier":
      case "chantier":
        return "bg-brand-500"; // Ble
      case "pa disponib":
      case "pa_disponib":
        return "bg-danger-500"; // Wouj
      default:
        return "bg-success-500";
    }
  };

  const iconPlaceholder = CATEGORY_ICONS[category.toLowerCase()] || CATEGORY_ICONS.default;

  return (
    <div 
      onClick={onClick}
      className="w-full bg-navy-850 border border-navy-800 hover:border-navy-700 rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all duration-200 group shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-glow"
    >
      {/* 🟢 PATI GÒCH: AVATAR / IKON + ENFÒMASYON */}
      <div className="flex items-center gap-3.5 min-w-0">
        
        {/* Kontenè Ikon Pwofesyonèl ak Pwen Estati Sou Li */}
        <div className="relative flex-shrink-0 w-12 h-12 bg-navy-800 rounded-xl border border-navy-700 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
          <span>{iconPlaceholder}</span>
          
          {/* Ti Pwen Estati a nan kwen an anba */}
          <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-navy-850 ${getStatusColor(status)} shadow-sm`}></span>
        </div>

        {/* Detay Tèks yo (Tit, Kote, ak Ti Badj Estati a) */}
        <div className="min-w-0 flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold tracking-wide text-text-inverse truncate group-hover:text-gold-400 transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <LocationIcon />
            <span className="truncate">{location}</span>
          </div>
        </div>

      </div>

      {/* 🟡 PATI DWA: DISTANS AK PRI (LÒ) */}
      <div className="flex flex-col items-end justify-between h-12 flex-shrink-0 pl-2">
        {/* Distans nan nivo KM */}
        <span className="text-xs font-semibold text-text-muted bg-navy-800/60 px-2 py-0.5 rounded-md border border-navy-700/50">
          {distance} km
        </span>
        
        {/* Pri a an jòn lò */}
        <div className="text-right">
          <span className="text-sm font-bold text-gold-400 tracking-tight">
            USD {price}
          </span>
          <span className="text-[10px] text-text-muted font-medium ml-0.5">
            / {period}
          </span>
        </div>
      </div>

    </div>
  );
}

// ======================================================
// 🛡️ PROP TYPES VALIDATION
// ======================================================
JobCard.propTypes = {
  title: PropTypes.string.isRequired,
  location: PropTypes.string.isRequired,
  distance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  period: PropTypes.string,
  status: PropTypes.string,
  category: PropTypes.string,
  onClick: PropTypes.func
};

export default memo(JobCard);
