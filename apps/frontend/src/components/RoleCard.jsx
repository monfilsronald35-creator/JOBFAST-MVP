import React from "react";

const RoleCard = ({
  title, // Sa a ap pran 'Boss', 'Worker', elatriye.
  icon,  // Emoji a
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
        group flex flex-col items-center gap-2 bg-transparent border-none outline-none focus:outline-none
        ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
      `}
    >
      {/* Ti wonn Icon lan nan grid la */}
      <div
        className={`
          flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl border-2
          transition-all duration-200 ease-smooth
          ${selected
            ? "border-gold-500 bg-navy-800 shadow-glow scale-105"
            : "border-navy-700 bg-navy-800 group-hover:border-navy-500 group-hover:-translate-y-0.5"}
        `}
      >
        {icon}
      </div>

      {/* Non wòl la anba ti wonn nan */}
      <span
        className={`
          truncate text-xs font-medium tracking-wide transition-colors duration-200
          ${selected ? "text-gold-400 font-bold" : "text-text-muted group-hover:text-text-inverse"}
        `}
      >
        {title}
      </span>
    </button>
  );
};

export default React.memo(RoleCard);
