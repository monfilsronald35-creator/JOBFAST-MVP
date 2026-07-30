/**
 * JOBFAST — Spacing, Grid & Radius System
 * 4px base unit. Every layout decision derives from this file.
 */

export const BASE_UNIT = 4;

export const space = {
  0:    '0px',
  0.5:  '2px',
  1:    '4px',
  1.5:  '6px',
  2:    '8px',
  2.5:  '10px',
  3:    '12px',
  3.5:  '14px',
  4:    '16px',
  5:    '20px',
  6:    '24px',
  7:    '28px',
  8:    '32px',
  9:    '36px',
  10:   '40px',
  11:   '44px',
  12:   '48px',
  14:   '56px',
  16:   '64px',
  18:   '72px',
  20:   '80px',
  24:   '96px',
  28:   '112px',
  32:   '128px',
  40:   '160px',
  48:   '192px',
  56:   '224px',
  64:   '256px',
} as const;

export const radius = {
  none:  '0px',
  xs:    '4px',
  sm:    '8px',
  md:    '12px',
  lg:    '16px',
  xl:    '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
  pill:  '9999px',

  // Semantic aliases
  button:     '12px',
  input:      '12px',
  card:       '20px',
  modal:      '28px',
  sheet:      '28px',
  icon:       '10px',
  appIcon:    '22.5%',
  chip:       '9999px',
  badge:      '9999px',
} as const;

export const grid = {
  columns: { mobile: 4, tablet: 8, desktop: 12 } as const,
  gutter:  { mobile: '16px', tablet: '24px', desktop: '32px' } as const,
  margin:  { mobile: '16px', tablet: '32px', desktop: '64px' } as const,
  maxWidth: '1440px',
  breakpoints: {
    xs:    375,
    sm:    640,
    md:    768,
    lg:   1024,
    xl:   1280,
    '2xl': 1440,
    '3xl': 1920,
  } as const,
} as const;

export const layout = {
  navHeight:     '56px',
  tabBarHeight:  '80px',
  headerHeight:  '64px',
  sidebarWidth:  '280px',
  touchTarget:   '44px',
  maxContent:    '720px',
  maxPage:       '1440px',
  safeAreaTop:    'env(safe-area-inset-top)',
  safeAreaBottom: 'env(safe-area-inset-bottom)',
} as const;

export const zIndex = {
  base:    1,
  raised:  10,
  overlay: 100,
  modal:   200,
  toast:   300,
  tooltip: 400,
  sheet:   150,
  shell:   9999,
} as const;

export const spacing = { BASE_UNIT, space, radius, grid, layout, zIndex } as const;

export default spacing;