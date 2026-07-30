/**
 * Backward-compat shim — new code imports from '@/design' or '@/design/tokens'.
 * This file keeps `import { tokens } from '@/theme'` compiling.
 */

export {
  colors,
  typography,
  spacing,
  radius,
  motion,
  shadows,
  tokens,
} from './design/tokens';

export { tokens as default } from './design/tokens';

// Legacy name aliases for callers that used the old `shadow` / `animation` / `breakpoints` exports.
export { shadows as shadow } from './design/tokens';
export { motion  as animation } from './design/tokens';

export const breakpoints = {
  xs:    '375px',
  sm:    '640px',
  md:    '768px',
  lg:    '1024px',
  xl:    '1280px',
  '2xl': '1440px',
  '3xl': '1920px',
} as const;
