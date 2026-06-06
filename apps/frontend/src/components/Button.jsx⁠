import React, { memo } from "react";

const Button = memo(
  ({
    children,
    variant = "primary",
    loading = false,
    className = "",
    type = "button",
    ...props
  }) => {
    const baseStyles =
      "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[15px] font-semibold tracking-[-0.01em] transition-all duration-200 ease-smooth active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

    const variants = {
      primary:
        "bg-gold-500 text-navy-900 shadow-soft hover:bg-gold-400 hover:shadow-card focus:ring-4 focus:ring-gold-100",
      outline:
        "border border-border bg-transparent text-text-primary hover:border-brand-300 hover:bg-brand-50 focus:ring-4 focus:ring-brand-100",
      navy:
        "bg-navy-800 text-white shadow-soft hover:bg-navy-700 focus:ring-4 focus:ring-navy-100",
    };

    const currentVariant = variants[variant] || variants.primary;

    return (
      <button
        type={type}
        {...props}
        disabled={loading || props.disabled}
        aria-busy={loading}
        className={`${baseStyles} ${currentVariant} ${className}`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            <span>Ap trete...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
