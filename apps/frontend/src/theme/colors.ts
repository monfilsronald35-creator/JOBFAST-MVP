/**
 * Backward-compat shim — keeps `import COLORS from '@/theme/colors'` working.
 * New code: import { colors } from '@/design/tokens';
 */

const COLORS = Object.freeze({
  // Brand
  primary:     '#F0B429',
  primaryDark: '#D4961A',
  primaryLight: '#F5C842',
  accent:      '#34D399',
  accentDark:  '#10B981',

  // Backgrounds
  bg:          '#050F1E',
  bgCard:      '#0A1628',
  bgCardAlt:   '#0F1E35',

  // Text
  textPrimary: '#F8FAFC',
  textSecond:  '#CBD5E1',
  textMuted:   '#64748B',
  textDisabled:'#334155',

  // Borders
  border:      'rgba(255,255,255,0.08)',
  borderFocus: '#F0B429',

  // Semantic
  success:     '#10B981',
  warning:     '#F59E0B',
  error:       '#EF4444',
  info:        '#3B82F6',

  // Stepper (used by RegistrationProgress)
  stepActive:  '#F0B429',
  stepDone:    '#10B981',
  stepIdle:    '#0F1E35',
  stepLine:    'rgba(255,255,255,0.10)',

  // Surfaces
  surface:     '#0A1628',
  surfaceAlt:  '#0F1E35',

  // Glass
  glass:       'rgba(255,255,255,0.055)',
  glassBorder: 'rgba(255,255,255,0.08)',
  blur:        '20px',

  // Glows / shadows
  primaryGlow: 'rgba(240,180,41,0.25)',

  // Finance
  financeGreen: '#059669',
  financeBlue:  '#0284C7',
  gold:         '#D4AF37',
  navy:         '#030C19',

  // Status
  online:  '#22C55E',
  offline: '#EF4444',
});

export default COLORS;