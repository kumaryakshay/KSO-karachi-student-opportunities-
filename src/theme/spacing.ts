/**
 * KSO Spacing Scale
 * Consistent padding, margins, and gaps throughout the app.
 * Based on a 4px base unit.
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  xxxxl: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export const iconSize = {
  sm: 16,
  md: 20,
  base: 24,
  lg: 28,
  xl: 32,
  xxl: 40,
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
