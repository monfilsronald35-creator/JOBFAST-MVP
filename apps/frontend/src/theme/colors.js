/**
 * JOBFAST Design System — Color Tokens
 * Enterprise palette aligned with 4K/8K premium UI.
 */
const COLORS = Object.freeze({
  // Brand
  primary:     '#FBBF24', // amber-400
  primaryDark: '#F59E0B', // amber-500
  accent:      '#34D399', // emerald-400
  accentDark:  '#10B981', // emerald-500

  // Backgrounds
  bg:          '#020617', // slate-950
  bgCard:      '#0F172A', // slate-900
  bgCardAlt:   '#1E293B', // slate-800

  // Text
  textPrimary: '#FFFFFF',
  textSecond:  '#CBD5E1', // slate-300
  textMuted:   '#64748B', // slate-500
  textDisabled:'#334155', // slate-700

  // Borders
  border:      'rgba(255,255,255,0.10)',
  borderFocus: '#FBBF24',

  // Semantic
  success:     '#34D399',
  warning:     '#FCD34D',
  error:       '#F87171',
  info:        '#60A5FA',

  // Steps (registration progress)
  stepActive:  '#FBBF24',
  stepDone:    '#34D399',
  stepIdle:    '#1E293B',
  stepLine:    'rgba(255,255,255,0.12)',

  // Glass
  glass:       'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.10)',
  blur:        '20px',
});

export default COLORS;