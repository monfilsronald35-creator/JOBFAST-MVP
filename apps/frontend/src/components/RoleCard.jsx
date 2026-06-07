import React from "react";

const RoleCard = ({
  title,
  icon: IconComponent,
  selected = false,
  disabled = false,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`
        group flex flex-col items-center gap-2.5 bg-transparent border-none outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-400/20 transition-opacity
        ${disabled ? "cursor-not-allowed opacity-30" : "cursor-pointer"}
      `}
    >
      <div
        className={`
          flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200
          ${selected
            ? "border-gold-400 bg-navy-800 text-gold-400 scale-105 shadow-lg shadow-gold-400/5"
            : "border-slate-800/60 bg-navy-800/20 text-slate-400 group-hover:border-slate-700 group-hover:text-white group-hover:-translate-y-0.5"}
        `}
      >
        {IconComponent && <IconComponent className="h-5 w-5" strokeWidth={selected ? 2.5 : 2} />}
      </div>

      <span
        className={`
          w-full truncate text-[10px] font-black uppercase tracking-widest text-center transition-colors duration-200
          ${selected ? "text-gold-400" : "text-slate-500 group-hover:text-slate-300"}
        `}
      >
        {title}
      </span>
    </button>
  );
};

export default RoleCard;
