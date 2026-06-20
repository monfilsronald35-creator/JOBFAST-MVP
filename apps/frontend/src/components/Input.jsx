import React from "react";

export default function Input({
  type = "text",
  placeholder = "",
  value = "",
  onChange,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={[
        "w-full rounded-xl border border-slate-800 bg-navy-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all duration-200 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      ].join(" ")}
      {...props}
    />
  );
}