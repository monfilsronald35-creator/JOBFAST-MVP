/**
 * JOBFAST — Motion & Animation System
 * Every transition and animation follows these rules.
 * Inspired by Apple HIG, Material Motion, and Framer Motion specs.
 */

export const duration = {
  instant:    '0ms',
  micro:      '50ms',
  fast:       '120ms',
  normal:     '220ms',
  moderate:   '350ms',
  slow:       '500ms',
  deliberate: '700ms',
  cinematic:  '1000ms',
} as const;

export const easing = {
  standard:   'cubic-bezier(0.20, 0.00, 0.00, 1.00)',  // general purpose
  decelerate: 'cubic-bezier(0.00, 0.00, 0.20, 1.00)',  // entering elements
  accelerate: 'cubic-bezier(0.30, 0.00, 1.00, 1.00)',  // exiting elements
  spring:     'cubic-bezier(0.16, 1.00, 0.30, 1.00)',  // premium bouncy feel
  overshoot:  'cubic-bezier(0.34, 1.56, 0.64, 1.00)',  // playful pop
  sharp:      'cubic-bezier(0.12, 0.00, 0.39, 0.00)',  // precise, snappy
  linear:     'linear',
} as const;

export type MotionPreset = {
  duration: string;
  easing: string;
  delay?: string;
};

export const preset: Record<string, MotionPreset> = {
  pageEnter:      { duration: '350ms', easing: 'cubic-bezier(0.00, 0.00, 0.20, 1.00)' },
  pageLeave:      { duration: '220ms', easing: 'cubic-bezier(0.30, 0.00, 1.00, 1.00)' },
  modalEnter:     { duration: '300ms', easing: 'cubic-bezier(0.16, 1.00, 0.30, 1.00)' },
  modalLeave:     { duration: '180ms', easing: 'cubic-bezier(0.30, 0.00, 1.00, 1.00)' },
  sheetEnter:     { duration: '380ms', easing: 'cubic-bezier(0.16, 1.00, 0.30, 1.00)' },
  sheetLeave:     { duration: '280ms', easing: 'cubic-bezier(0.30, 0.00, 1.00, 1.00)' },
  toastEnter:     { duration: '220ms', easing: 'cubic-bezier(0.00, 0.00, 0.20, 1.00)' },
  toastLeave:     { duration: '150ms', easing: 'cubic-bezier(0.30, 0.00, 1.00, 1.00)' },
  buttonPress:    { duration: '120ms', easing: 'cubic-bezier(0.20, 0.00, 0.00, 1.00)' },
  cardHover:      { duration: '220ms', easing: 'cubic-bezier(0.20, 0.00, 0.00, 1.00)' },
  tabSwitch:      { duration: '180ms', easing: 'cubic-bezier(0.20, 0.00, 0.00, 1.00)' },
  fabPress:       { duration: '120ms', easing: 'cubic-bezier(0.34, 1.56, 0.64, 1.00)' },
  splashExit:     { duration: '500ms', easing: 'cubic-bezier(0.30, 0.00, 1.00, 1.00)' },
  paymentSuccess: { duration: '600ms', easing: 'cubic-bezier(0.16, 1.00, 0.30, 1.00)' },
  notification:   { duration: '350ms', easing: 'cubic-bezier(0.16, 1.00, 0.30, 1.00)' },
  inputFocus:     { duration: '150ms', easing: 'cubic-bezier(0.20, 0.00, 0.00, 1.00)' },
  skeleton:       { duration: '1800ms', easing: 'ease-in-out' },
} as const;

export const stagger = {
  fast:   40,   // ms per item
  normal: 60,
  slow:   80,
  max:    500,  // max total stagger duration
} as const;

export const spring = {
  gentle:   { stiffness: 100, damping: 14, mass: 1 },
  standard: { stiffness: 180, damping: 18, mass: 1 },
  snappy:   { stiffness: 280, damping: 22, mass: 1 },
  bouncy:   { stiffness: 380, damping: 20, mass: 1 },
  stiff:    { stiffness: 600, damping: 28, mass: 1 },
} as const;

export const framerPreset = {
  pageIn:    { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.35, ease: [0, 0, 0.2, 1] } },
  modalIn:   { initial: { opacity: 0, scale: 0.93, y: 12 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.96, y: 8 }, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  sheetIn:   { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
  fadeIn:    { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.22, ease: [0.2, 0, 0, 1] } },
  scaleIn:   { initial: { opacity: 0, scale: 0.85 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  slideLeft: { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -16 }, transition: { duration: 0.32, ease: [0.2, 0, 0, 1] } },
  card:      { whileHover: { y: -2, scale: 1.01 }, whileTap: { scale: 0.98 }, transition: { duration: 0.22, ease: [0.2, 0, 0, 1] } },
  button:    { whileTap: { scale: 0.96 }, transition: { duration: 0.12, ease: [0.34, 1.56, 0.64, 1] } },
  fab:       { whileHover: { scale: 1.06 }, whileTap: { scale: 0.92 }, transition: { duration: 0.18, ease: [0.34, 1.56, 0.64, 1] } },
} as const;

export const motion = { duration, easing, preset, stagger, spring, framerPreset } as const;

export default motion;