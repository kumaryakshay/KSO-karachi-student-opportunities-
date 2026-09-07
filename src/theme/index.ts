/**
 * KSO Theme — single import point for all design tokens.
 * Usage: import { colors, fontSize, spacing } from '@/theme';
 */

export { colors } from './colors';
export type { AppColors } from './colors';

export { fontFamily, fontSize, fontWeight, lineHeight } from './typography';
export type { FontSize, FontFamily } from './typography';

export { spacing, borderRadius, iconSize } from './spacing';
export type { Spacing, BorderRadius } from './spacing';
