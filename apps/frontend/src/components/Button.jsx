/**
 * JOBFAST Unified Button System
 * Single file — all button variants, sizes, and compound components.
 *
 * Exports:
 *   default  Button       — primary building block (10 variants)
 *   named    IconButton   — icon-only button
 *   named    FAB          — expandable floating action button
 *   named    ButtonGroup  — horizontal group of buttons
 */

import React, { useState, useRef, useEffect, memo, forwardRef } from 'react';

// ─────────────────────────────────────────────────────────────
// VARIANT & SIZE MAPS
// ─────────────────────────────────────────────────────────────

const VARIANT_CLASSES = {
  primary:
    'bg-amber-500 text-slate-950 shadow-[0_4px_16px_rgba(245,158,11,0.35)] ' +
    'hover:bg-amber-400 active:bg-amber-600 ' +
    'focus-visible:ring-amber-400/50',

  secondary:
    'bg-slate-700 text-slate-100 shadow-sm ' +
    'hover:bg-slate-600 active:bg-slate-800 ' +
    'focus-visible:ring-slate-500/50',

  success:
    'bg-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.30)] ' +
    'hover:bg-emerald-400 active:bg-emerald-600 ' +
    'focus-visible:ring-emerald-400/50',

  danger:
    'bg-red-500 text-white shadow-[0_4px_16px_rgba(239,68,68,0.30)] ' +
    'hover:bg-red-400 active:bg-red-600 ' +
    'focus-visible:ring-red-400/50',

  warning:
    'bg-orange-500 text-white shadow-[0_4px_16px_rgba(249,115,22,0.30)] ' +
    'hover:bg-orange-400 active:bg-orange-600 ' +
    'focus-visible:ring-orange-400/50',

  outline:
    'bg-transparent border border-slate-600 text-slate-200 ' +
    'hover:border-amber-500/60 hover:text-amber-400 hover:bg-amber-500/5 ' +
    'active:bg-amber-500/10 ' +
    'focus-visible:ring-amber-400/40',

  ghost:
    'bg-transparent text-slate-400 ' +
    'hover:text-slate-100 hover:bg-slate-800/70 ' +
    'active:bg-slate-800 ' +
    'focus-visible:ring-slate-500/40',

  link:
    'bg-transparent text-amber-400 underline-offset-4 shadow-none ' +
    'hover:underline hover:text-amber-300 ' +
    'active:text-amber-500 ' +
    'focus-visible:ring-amber-400/40',

  // fab & icon handled by dedicated components
  fab:
    'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ' +
    'shadow-[0_8px_24px_rgba(245,158,11,0.50)] ' +
    'hover:shadow-[0_12px_32px_rgba(245,158,11,0.60)] ' +
    'active:scale-95 ' +
    'focus-visible:ring-amber-400/60',

  icon:
    'bg-transparent text-slate-400 ' +
    'hover:text-slate-100 hover:bg-slate-800/70 ' +
    'focus-visible:ring-slate-500/40',
};

const SIZE_CLASSES = {
  xs:  'h-7  px-2.5 text-[11px] gap-1   rounded-lg',
  sm:  'h-9  px-3.5 text-xs    gap-1.5  rounded-xl',
  md:  'h-11 px-4   text-sm    gap-2    rounded-xl',
  lg:  'h-12 px-5   text-[15px] gap-2   rounded-2xl',
  xl:  'h-14 px-6   text-base  gap-2.5  rounded-2xl',
};

const ICON_SIZE_CLASSES = {
  xs: 'w-7  h-7  rounded-lg',
  sm: 'w-9  h-9  rounded-xl',
  md: 'w-11 h-11 rounded-xl',
  lg: 'w-12 h-12 rounded-2xl',
  xl: 'w-14 h-14 rounded-2xl',
};

const SPINNER_SIZES = { xs:'w-3 h-3', sm:'w-3.5 h-3.5', md:'w-4 h-4', lg:'w-4 h-4', xl:'w-5 h-5' };

// ─────────────────────────────────────────────────────────────
// TOOLTIP WRAPPER
// ─────────────────────────────────────────────────────────────

function TooltipWrap({ tooltip, children }) {
  if (!tooltip) return children;
  return (
    <span className="relative group/tip inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          whitespace-nowrap rounded-lg bg-slate-950 border border-slate-700/60
          px-2.5 py-1 text-[11px] font-semibold text-slate-200 shadow-xl
          opacity-0 group-hover/tip:opacity-100
          scale-95 group-hover/tip:scale-100
          transition-all duration-150 z-[300]">
        {tooltip}
        <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
          border-l-4 border-r-4 border-t-4
          border-l-transparent border-r-transparent border-t-slate-950" />
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN BUTTON COMPONENT
// ─────────────────────────────────────────────────────────────

const Button = forwardRef(function Button(
  {
    children,
    variant      = 'primary',
    size         = 'md',
    leftIcon     = null,
    rightIcon    = null,
    loading      = false,
    loadingText  = 'Ap trete…',
    disabled     = false,
    fullWidth    = false,
    rounded      = false,
    tooltip      = '',
    badge        = null,
    notificationCount = null,
    href         = null,
    type         = 'button',
    className    = '',
    onClick,
    ...rest
  },
  ref
) {
  const isDisabled = loading || disabled;
  const spinnerClass = SPINNER_SIZES[size] || SPINNER_SIZES.md;

  const base = [
    'relative inline-flex items-center justify-center font-bold select-none transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]',
    'active:scale-[0.97]',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none',
    SIZE_CLASSES[size]     || SIZE_CLASSES.md,
    VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
    fullWidth  ? 'w-full' : '',
    rounded    ? '!rounded-full' : '',
    className,
  ].filter(Boolean).join(' ');

  const inner = loading ? (
    <>
      <span className={`${spinnerClass} animate-spin rounded-full border-2 border-current border-r-transparent shrink-0`} aria-hidden="true" />
      {loadingText && <span>{loadingText}</span>}
    </>
  ) : (
    <>
      {leftIcon  && <span className="shrink-0 leading-none"  aria-hidden="true">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="shrink-0 leading-none"  aria-hidden="true">{rightIcon}</span>}
      {/* Badge (text/number) */}
      {badge != null && (
        <span className="ml-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-white/20 px-1 text-[9px] font-black">
          {badge}
        </span>
      )}
    </>
  );

  const el = href ? (
    <a href={href} ref={ref} className={base} aria-disabled={isDisabled} {...rest}>
      {inner}
      {notificationCount != null && notificationCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 border-2 border-[#020617] text-[9px] font-black text-white px-0.5 shadow-lg">
          {notificationCount > 99 ? '99+' : notificationCount}
        </span>
      )}
    </a>
  ) : (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled}
      onClick={onClick}
      className={base}
      {...rest}
    >
      {inner}
      {notificationCount != null && notificationCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 border-2 border-[#020617] text-[9px] font-black text-white px-0.5 shadow-lg">
          {notificationCount > 99 ? '99+' : notificationCount}
        </span>
      )}
    </button>
  );

  return <TooltipWrap tooltip={tooltip}>{el}</TooltipWrap>;
});

Button.displayName = 'Button';

export default Button;

// ─────────────────────────────────────────────────────────────
// ICON BUTTON
// Compact, square — icon only. Pass `label` for screen reader.
// ─────────────────────────────────────────────────────────────

export const IconButton = forwardRef(function IconButton(
  {
    icon,
    label,
    size         = 'md',
    variant      = 'icon',
    tooltip      = '',
    notificationCount = null,
    loading      = false,
    disabled     = false,
    rounded      = false,
    className    = '',
    ...rest
  },
  ref
) {
  const isDisabled = loading || disabled;
  const spinnerClass = SPINNER_SIZES[size] || SPINNER_SIZES.md;

  const base = [
    'relative inline-flex items-center justify-center font-bold select-none transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]',
    'active:scale-[0.95]',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none',
    ICON_SIZE_CLASSES[size]  || ICON_SIZE_CLASSES.md,
    VARIANT_CLASSES[variant] || VARIANT_CLASSES.icon,
    rounded ? '!rounded-full' : '',
    className,
  ].filter(Boolean).join(' ');

  const el = (
    <button
      ref={ref}
      type="button"
      disabled={isDisabled}
      aria-label={label}
      aria-busy={loading || undefined}
      className={base}
      {...rest}
    >
      {loading
        ? <span className={`${spinnerClass} animate-spin rounded-full border-2 border-current border-r-transparent`} aria-hidden="true" />
        : <span aria-hidden="true">{icon}</span>
      }
      {notificationCount != null && notificationCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 border-2 border-[#020617] text-[9px] font-black text-white px-0.5 shadow-lg">
          {notificationCount > 99 ? '99+' : notificationCount}
        </span>
      )}
    </button>
  );

  return <TooltipWrap tooltip={tooltip}>{el}</TooltipWrap>;
});

IconButton.displayName = 'IconButton';

// ─────────────────────────────────────────────────────────────
// BUTTON GROUP
// Wraps children into a seamless horizontal cluster.
// ─────────────────────────────────────────────────────────────

export const ButtonGroup = memo(function ButtonGroup({ children, className = '', fullWidth = false }) {
  return (
    <div
      role="group"
      className={[
        'inline-flex items-center',
        '[&>*]:rounded-none',
        '[&>*:first-child]:rounded-l-xl',
        '[&>*:last-child]:rounded-r-xl',
        '[&>*:not(:last-child)]:border-r-0',
        fullWidth ? 'w-full [&>*]:flex-1' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
});

ButtonGroup.displayName = 'ButtonGroup';

// ─────────────────────────────────────────────────────────────
// FAB — Floating Action Button with Speed Dial
//
// Usage:
//   <FAB actions={[
//     { icon: '💼', label: 'Kreye Djòb',      onClick: () => navigate('/post-job')          },
//     { icon: '📖', label: 'Kreye Istwa',     onClick: () => navigate('/stories/create')    },
//     { icon: '🛠',  label: 'Kreye Sèvis',     onClick: () => navigate('/provider-dashboard')},
//     { icon: '📅', label: 'Kreye Rezèvasyon',onClick: () => navigate('/booking')            },
//   ]} />
// ─────────────────────────────────────────────────────────────

export const FAB = memo(function FAB({
  actions       = [],
  mainIcon      = '+',
  mainLabel     = 'Kreye',
  position      = 'bottom-right',      // 'bottom-right' | 'bottom-center' | 'bottom-left'
  className     = '',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const posClass = {
    'bottom-right':  'fixed bottom-20 right-4 z-[60]',
    'bottom-center': 'fixed bottom-20 left-1/2 -translate-x-1/2 z-[60]',
    'bottom-left':   'fixed bottom-20 left-4 z-[60]',
  }[position] || 'fixed bottom-20 right-4 z-[60]';

  return (
    <div ref={ref} className={`${posClass} flex flex-col-reverse items-end gap-2 ${className}`}>
      {/* Speed dial actions */}
      {actions.map((action, i) => (
        <div
          key={action.label}
          className="flex items-center gap-2"
          style={{
            transform:   open ? 'translateY(0) scale(1)' : `translateY(${(actions.length - i) * 16}px) scale(0.85)`,
            opacity:     open ? 1 : 0,
            pointerEvents: open ? 'auto' : 'none',
            transition:  `transform 200ms cubic-bezier(0.34,1.56,0.64,1) ${i * 40}ms, opacity 160ms ease ${i * 30}ms`,
          }}
        >
          {/* Label chip */}
          <span className="bg-[#0d1526] border border-slate-700/70 text-slate-100 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap">
            {action.label}
          </span>
          {/* Action icon button */}
          <button
            type="button"
            onClick={() => { action.onClick?.(); setOpen(false); }}
            aria-label={action.label}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#0d1526] border border-slate-700/50 text-slate-100 text-lg shadow-xl hover:border-amber-500/50 hover:text-amber-400 transition-all active:scale-90"
          >
            {action.icon}
          </button>
        </div>
      ))}

      {/* Main FAB button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Fèmen meni' : mainLabel}
        aria-expanded={open}
        aria-haspopup="true"
        className={[
          'relative w-14 h-14 rounded-2xl',
          'bg-gradient-to-br from-amber-400 to-amber-600',
          'text-slate-950 text-2xl font-black',
          'shadow-[0_8px_28px_rgba(245,158,11,0.55)]',
          'hover:shadow-[0_12px_36px_rgba(245,158,11,0.65)]',
          'transition-all duration-200 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]',
        ].join(' ')}
      >
        {/* Pulse ring */}
        {!open && (
          <span className="absolute inset-[-4px] rounded-[20px] border-2 border-amber-400/30 animate-ping"
            style={{ animationDuration:'2s' }} aria-hidden="true" />
        )}
        <span
          aria-hidden="true"
          className="block transition-transform duration-200"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          {open ? '✕' : mainIcon}
        </span>
      </button>
    </div>
  );
});

FAB.displayName = 'FAB';
