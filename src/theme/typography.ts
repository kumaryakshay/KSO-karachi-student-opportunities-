/**
 * KSO Typography Scale
 * Consistent font sizes and weights across the app.
 */

import { Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';

export const fontFamily = {
  regular: isIOS ? 'System' : 'Roboto',
  medium: isIOS ? 'System' : 'Roboto-Medium',
  bold: isIOS ? 'System' : 'Roboto-Bold',
} as const;

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export type FontSize = typeof fontSize;
export type FontFamily = typeof fontFamily;
