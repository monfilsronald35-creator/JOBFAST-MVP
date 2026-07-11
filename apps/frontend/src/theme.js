/**
 * JOBFAST Design System — single source of truth for all tokens.
 * Import this in any component instead of hard-coding colors/radii/etc.
 *
 * Usage:
 *   import { tokens } from '@/theme';
 *   // or named:
 *   import { colors, radius, shadow, animation } from '@/theme';
 */

// ─────────────────────────────────────────────────────────────
// COLOR PALETTE
// ─────────────────────────────────────────────────────────────

export const colors = {
  // Brand
  primary:   { DEFAULT: '#f59e0b', hover: '#fbbf24', active: '#d97706', foreground: '#020617', ring: 'rgba(245,158,11,0.40)' },
  secondary: { DEFAULT: '#1e293b', hover: '#334155', active: '#0f172a', foreground: '#f1f5f9', ring: 'rgba(30,41,59,0.60)'   },

  // Semantic
  success:   { DEFAULT: '#10b981', hover: '#34d399', active: '#059669', foreground: '#ffffff', ring: 'rgba(16,185,129,0.35)'  },
  danger:    { DEFAULT: '#ef4444', hover: '#f87171', active: '#dc2626', foreground: '#ffffff', ring: 'rgba(239,68,68,0.35)'   },
  warning:   { DEFAULT: '#f97316', hover: '#fb923c', active: '#ea580c', foreground: '#ffffff', ring: 'rgba(249,115,22,0.35)'  },
  info:      { DEFAULT: '#6366f1', hover: '#818cf8', active: '#4f46e5', foreground: '#ffffff', ring: 'rgba(99,102,241,0.35)'  },

  // Neutral backgrounds
  bg: {
    base:    '#020617',   // deepest — page bg
    surface: '#0d1526',   // cards, sheets
    raised:  '#0b1120',   // header, drawers
    overlay: '#131f35',   // modals, popovers
    muted:   '#1e2d45',   // disabled surfaces
  },

  // Borders
  border: {
    faint:   'rgba(148,163,184,0.08)',
    subtle:  'rgba(148,163,184,0.15)',
    DEFAULT: 'rgba(148,163,184,0.25)',
    strong:  'rgba(148,163,184,0.45)',
  },

  // Text
  text: {
    primary:   '#f8fafc',
    secondary: '#94a3b8',
    muted:     '#475569',
    disabled:  '#334155',
    inverse:   '#020617',
  },

  // Speciality
  gold:    '#f59e0b',
  navy:    '#020617',
  online:  '#22c55e',
  offline: '#ef4444',
};

// ─────────────────────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────────────────────

export const radius = {
  xs:   '6px',
  sm:   '8px',
  md:   '12px',
  lg:   '16px',
  xl:   '20px',
  '2xl':'24px',
  '3xl':'28px',
  full: '9999px',
};

// ─────────────────────────────────────────────────────────────
// SPACING SCALE (px)
// ─────────────────────────────────────────────────────────────

export const spacing = {
  0:   '0px',
  1:   '4px',
  2:   '8px',
  3:   '12px',
  4:   '16px',
  5:   '20px',
  6:   '24px',
  8:   '32px',
  10:  '40px',
  12:  '48px',
  16:  '64px',
};

// ─────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    sans:  "'Inter', system-ui, sans-serif",
    sora:  "'Sora', sans-serif",
    mono:  "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.04em' }],
    xs:    ['12px', { lineHeight: '16px' }],
    sm:    ['14px', { lineHeight: '20px' }],
    base:  ['16px', { lineHeight: '24px' }],
    lg:    ['18px', { lineHeight: '28px' }],
    xl:    ['20px', { lineHeight: '28px', letterSpacing: '-0.015em' }],
    '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em'  }],
    '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.025em' }],
  },
  fontWeight: {
    normal:    '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
    extrabold: '800',
    black:     '900',
  },
};

// ─────────────────────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────────────────────

export const shadow = {
  sm:      '0 1px 3px rgba(0,0,0,0.40)',
  DEFAULT: '0 4px 12px rgba(0,0,0,0.50)',
  md:      '0 8px 24px rgba(0,0,0,0.55)',
  lg:      '0 16px 40px rgba(0,0,0,0.60)',
  xl:      '0 24px 60px rgba(0,0,0,0.65)',

  // Colored glow shadows
  primary: '0 8px 24px rgba(245,158,11,0.35)',
  success: '0 8px 24px rgba(16,185,129,0.30)',
  danger:  '0 8px 24px rgba(239,68,68,0.30)',
  info:    '0 8px 24px rgba(99,102,241,0.30)',

  // Inner
  inner:   'inset 0 2px 6px rgba(0,0,0,0.30)',
};

// ─────────────────────────────────────────────────────────────
// ANIMATION
// ─────────────────────────────────────────────────────────────

export const animation = {
  duration: {
    instant: '80ms',
    fast:    '150ms',
    normal:  '250ms',
    slow:    '400ms',
    xslow:   '600ms',
  },
  easing: {
    DEFAULT:  'cubic-bezier(0.4, 0, 0.2, 1)',
    in:       'cubic-bezier(0.4, 0, 1, 1)',
    out:      'cubic-bezier(0, 0, 0.2, 1)',
    bounce:   'cubic-bezier(0.34, 1.56, 0.64, 1)',
    spring:   'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
};

// ─────────────────────────────────────────────────────────────
// BREAKPOINTS
// ─────────────────────────────────────────────────────────────

export const breakpoints = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl': '1536px',
};

// ─────────────────────────────────────────────────────────────
// COMPOSED TOKEN OBJECT (for spread imports)
// ─────────────────────────────────────────────────────────────

export const tokens = { colors, radius, spacing, typography, shadow, animation, breakpoints };

export default tokens;
