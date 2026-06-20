import React, { memo } from "react";
import clsx from "clsx";

const variants = {
  primary:
    "bg-gold-500 text-navy-900 shadow-md hover:bg-gold-400 focus-visible:ring-gold-300",
  outline:
    "border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-300",
  navy:
    "bg-navy-800 text-white shadow-md hover:bg-navy-700 focus-visible:ring-navy-400",
};

const Button = memo(function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  type = "button",
  disabled = false,
  loadingText = "Ap trete...",
  ...props
}) {
  const isDisabled = loading || disabled;

  return (
    <button
      type={type}
      {...props}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled}
      className={clsx(
        "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[15px] font-semibold tracking-[-0.01em] transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white/10 dark:focus-visible:ring-offset-navy-900",
        variants[variant] || variants.primary,
        className
      )}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
            aria-hidden="true"
          />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = "Button";

export default Button;