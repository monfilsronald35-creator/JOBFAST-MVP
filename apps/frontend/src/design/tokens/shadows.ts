/**
 * JOBFAST — Shadow & Elevation System
 * Dark-theme optimized. Higher elevation = stronger shadow.
 */

export const elevation = {
  none:  'none',
  xs:    '0 1px 2px rgba(0,0,0,0.50)',
  sm:    '0 2px 4px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.30)',
  md:    '0 4px 12px rgba(0,0,0,0.50), 0 2px 4px rgba(0,0,0,0.35)',
  lg:    '0 8px 24px rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.40)',
  xl:    '0 16px 40px rgba(0,0,0,0.60), 0 8px 16px rgba(0,0,0,0.45)',
  '2xl': '0 24px 60px rgba(0,0,0,0.65), 0 12px 24px rgba(0,0,0,0.50)',
  '3xl': '0 40px 80px rgba(0,0,0,0.70), 0 20px 40px rgba(0,0,0,0.55)',
} as const;

export const colored = {
  brand:   '0 4px 20px rgba(240,180,41,0.30), 0 0 0 1px rgba(240,180,41,0.15)',
  success: '0 4px 20px rgba(16,185,129,0.25), 0 0 0 1px rgba(16,185,129,0.12)',
  error:   '0 4px 20px rgba(239,68,68,0.25),  0 0 0 1px rgba(239,68,68,0.12)',
  info:    '0 4px 20px rgba(59,130,246,0.25),  0 0 0 1px rgba(59,130,246,0.12)',
  warning: '0 4px 20px rgba(245,158,11,0.25),  0 0 0 1px rgba(245,158,11,0.12)',
  premium: '0 8px 32px rgba(212,175,55,0.30),  0 0 0 1px rgba(212,175,55,0.18)',
} as const;

export const inset = {
  sm:    'inset 0 1px 2px rgba(0,0,0,0.25)',
  DEFAULT:'inset 0 2px 4px rgba(0,0,0,0.30)',
  brand: 'inset 0 1px 3px rgba(240,180,41,0.20)',
  focus: 'inset 0 0 0 2px rgba(240,180,41,0.40)',
} as const;

export const glow = {
  brand:   '0 0 32px rgba(240,180,41,0.22), 0 0 12px rgba(240,180,41,0.10)',
  success: '0 0 32px rgba(16,185,129,0.20)',
  error:   '0 0 32px rgba(239,68,68,0.20)',
  info:    '0 0 32px rgba(59,130,246,0.20)',
  premium: '0 0 40px rgba(212,175,55,0.22), 0 0 16px rgba(212,175,55,0.10)',
} as const;

export const card = {
  rest:    '0 2px 8px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.06)',
  hover:   '0 8px 24px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.10)',
  active:  '0 1px 4px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,255,255,0.08)',
  glass:   '0 4px 24px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.10)',
  premium: '0 8px 32px rgba(0,0,0,0.50), 0 0 0 1px rgba(240,180,41,0.20), inset 0 1px 0 rgba(240,180,41,0.08)',
} as const;

export const shadows = { elevation, colored, inset, glow, card } as const;

export default shadows;