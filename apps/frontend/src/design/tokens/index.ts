export { colors, brand, neutral, semantic, finance, status, glass, overlay, gradient } from './colors';
export { typography, fontFamily, scale, fontWeight, lineHeight, letterSpacing } from './typography';
export { spacing, space, radius, grid, layout, zIndex, BASE_UNIT } from './spacing';
export { motion, duration, easing, preset, stagger, spring, framerPreset } from './motion';
export { shadows, elevation, colored, inset, glow, card } from './shadows';

export type { ScaleKey, TypeSpec } from './typography';
export type { MotionPreset } from './motion';

import { colors }     from './colors';
import { typography } from './typography';
import { spacing }    from './spacing';
import { motion }     from './motion';
import { shadows }    from './shadows';

export const tokens = { colors, typography, spacing, motion, shadows } as const;
export default tokens;