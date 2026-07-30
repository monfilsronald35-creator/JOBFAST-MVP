/**
 * JOBFAST — Master Color Token System
 * Single source of truth. Every color in the product derives from here.
 */

export const brand = {
  gold: {
    200: '#FEE6A0',
    300: '#FDD86A',
    400: '#F5C842',
    500: '#F0B429', // PRIMARY — brand gold
    600: '#D4961A',
    700: '#B07A13',
    800: '#8A5F10',
    900: '#6B4A0E',
  },
  navy: {
    950: '#020810',
    900: '#030C19', // OLED midnight
    800: '#050F1E', // primary background
    700: '#0A1628', // surface-1
    600: '#0F1E35', // surface-2
    500: '#162540', // surface-3
    400: '#1C2E4A', // surface-4
    300: '#243858',
  },
} as const;

export const neutral = {
  0:   '#FFFFFF',
  50:  '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
  950: '#020617',
} as const;

export const semantic = {
  success: {
    bg:     'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.25)',
    400:    '#34D399',
    500:    '#10B981',
    600:    '#059669',
  },
  warning: {
    bg:     'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.25)',
    400:    '#FBBF24',
    500:    '#F59E0B',
    600:    '#D97706',
  },
  error: {
    bg:     'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.25)',
    400:    '#F87171',
    500:    '#EF4444',
    600:    '#DC2626',
  },
  info: {
    bg:     'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.25)',
    400:    '#60A5FA',
    500:    '#3B82F6',
    600:    '#2563EB',
  },
} as const;

export const finance = {
  premiumGold:  '#D4AF37',
  luxuryGold:   '#C9A227',
  platinum:     '#E8EDF3',
  financeGreen: '#059669',
  financeBlue:  '#0284C7',
  creditCard:   '#6366F1',
  crypto:       '#F7931A',
} as const;

export const status = {
  available:   '#10B981',
  busy:        '#F59E0B',
  working:     '#3B82F6',
  unavailable: '#EF4444',
  offline:     '#64748B',
} as const;

export const glass = {
  light:        'rgba(255,255,255,0.05)',
  medium:       'rgba(255,255,255,0.09)',
  strong:       'rgba(255,255,255,0.13)',
  border:       'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.18)',
} as const;

export const overlay = {
  subtle: 'rgba(0,0,0,0.20)',
  medium: 'rgba(0,0,0,0.40)',
  heavy:  'rgba(0,0,0,0.70)',
  scrim:  'rgba(3,12,25,0.88)',
  brand:  'rgba(240,180,41,0.15)',
} as const;

export const gradient = {
  brand:        'linear-gradient(135deg, #D4961A 0%, #F0B429 50%, #F5C842 100%)',
  brandH:       'linear-gradient(90deg,  #D4961A 0%, #F5C842 100%)',
  brandRadial:  'radial-gradient(ellipse at center, #F5C842 0%, #D4961A 100%)',
  premium:      'linear-gradient(135deg, #C9A227 0%, #D4AF37 50%, #F5C842 100%)',
  dark:         'linear-gradient(180deg, #0A1628 0%, #050F1E 100%)',
  surface:      'linear-gradient(180deg, #0F1E35 0%, #0A1628 100%)',
  glass:        'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
  goldGlow:     'radial-gradient(ellipse at center, rgba(240,180,41,0.18) 0%, transparent 65%)',
  hero:         'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(240,180,41,0.12) 0%, transparent 70%), linear-gradient(180deg, #050F1E 0%, #030C19 100%)',
  shimmer:      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
  walletCard:   'linear-gradient(135deg, #162540 0%, #0F1E35 100%)',
  premiumCard:  'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.04) 100%)',
} as const;

export const colors = {
  brand,
  neutral,
  semantic,
  finance,
  status,
  glass,
  overlay,
  gradient,
} as const;

export default colors;