/**
 * JOBFAST — Typography System
 * Every type decision, from display to micro.
 */

export const fontFamily = {
  display: ["'Inter'", 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  body:    ["'Inter'", 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  mono:    ["'JetBrains Mono'", "'Fira Code'", "'Cascadia Code'", 'Consolas', 'monospace'],
  sora:    ["'Sora'", 'sans-serif'],
  numeric: ["'Inter'", 'system-ui', 'sans-serif'],
} as const;

export type ScaleKey =
  | 'display-2xl' | 'display-xl' | 'display-lg' | 'display-md'
  | 'headline' | 'title-lg' | 'title-md' | 'title-sm'
  | 'body-lg' | 'body-md' | 'body-sm'
  | 'label-lg' | 'label-md' | 'label-sm'
  | 'caption' | 'overline' | 'micro'
  | 'button-lg' | 'button-md' | 'button-sm'
  | 'currency' | 'stat' | 'dashboard';

export interface TypeSpec {
  size: string;
  lineHeight: string;
  letterSpacing: string;
  weight: 400 | 500 | 600 | 700 | 800 | 900;
  numeric?: boolean;
  transform?: 'uppercase' | 'none';
}

export const scale: Record<ScaleKey, TypeSpec> = {
  'display-2xl': { size: 'clamp(3.5rem, 8vw, 6rem)',    lineHeight: '1.00', letterSpacing: '-0.04em',  weight: 900 },
  'display-xl':  { size: 'clamp(2.5rem, 6vw, 4rem)',    lineHeight: '1.05', letterSpacing: '-0.03em',  weight: 800 },
  'display-lg':  { size: 'clamp(2rem, 4vw, 3rem)',      lineHeight: '1.10', letterSpacing: '-0.03em',  weight: 700 },
  'display-md':  { size: 'clamp(1.75rem, 3vw, 2.25rem)',lineHeight: '1.15', letterSpacing: '-0.02em',  weight: 700 },
  'headline':    { size: 'clamp(1.25rem, 2vw, 1.75rem)',lineHeight: '1.25', letterSpacing: '-0.02em',  weight: 600 },
  'title-lg':    { size: '1.25rem',    lineHeight: '1.40', letterSpacing: '-0.01em', weight: 600 },
  'title-md':    { size: '1.125rem',   lineHeight: '1.40', letterSpacing: '-0.01em', weight: 600 },
  'title-sm':    { size: '1rem',       lineHeight: '1.40', letterSpacing: '0',        weight: 600 },
  'body-lg':     { size: '1.125rem',   lineHeight: '1.65', letterSpacing: '0',        weight: 400 },
  'body-md':     { size: '1rem',       lineHeight: '1.60', letterSpacing: '0',        weight: 400 },
  'body-sm':     { size: '0.875rem',   lineHeight: '1.55', letterSpacing: '0',        weight: 400 },
  'label-lg':    { size: '0.875rem',   lineHeight: '1.40', letterSpacing: '0.01em',   weight: 600 },
  'label-md':    { size: '0.8125rem',  lineHeight: '1.40', letterSpacing: '0.01em',   weight: 500 },
  'label-sm':    { size: '0.75rem',    lineHeight: '1.30', letterSpacing: '0.02em',   weight: 600 },
  'caption':     { size: '0.75rem',    lineHeight: '1.45', letterSpacing: '0.01em',   weight: 400 },
  'overline':    { size: '0.6875rem',  lineHeight: '1.30', letterSpacing: '0.12em',   weight: 700, transform: 'uppercase' },
  'micro':       { size: '0.625rem',   lineHeight: '1.30', letterSpacing: '0.08em',   weight: 500 },
  'button-lg':   { size: '1rem',       lineHeight: '1.00', letterSpacing: '0',        weight: 700 },
  'button-md':   { size: '0.9375rem',  lineHeight: '1.00', letterSpacing: '0',        weight: 600 },
  'button-sm':   { size: '0.8125rem',  lineHeight: '1.00', letterSpacing: '0.01em',   weight: 600 },
  'currency':    { size: '1rem',       lineHeight: '1.20', letterSpacing: '-0.01em',  weight: 700, numeric: true },
  'stat':        { size: '2.25rem',    lineHeight: '1.00', letterSpacing: '-0.035em', weight: 800, numeric: true },
  'dashboard':   { size: '1.5rem',     lineHeight: '1.10', letterSpacing: '-0.02em',  weight: 700, numeric: true },
} as const;

export const fontWeight = {
  regular:   400,
  medium:    500,
  semibold:  600,
  bold:      700,
  extrabold: 800,
  black:     900,
} as const;

export const lineHeight = {
  none:    '1',
  tight:   '1.15',
  snug:    '1.30',
  normal:  '1.50',
  relaxed: '1.65',
  loose:   '1.80',
} as const;

export const letterSpacing = {
  tighter: '-0.04em',
  tight:   '-0.02em',
  snug:    '-0.01em',
  normal:  '0',
  wide:    '0.02em',
  wider:   '0.06em',
  widest:  '0.12em',
} as const;

export const typography = {
  fontFamily,
  scale,
  fontWeight,
  lineHeight,
  letterSpacing,
} as const;

export default typography;