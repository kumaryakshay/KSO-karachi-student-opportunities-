/**
 * KSO Color Palette
 * Centralized colors — never hardcode colors in components.
 * Prepared for future dark mode support.
 */

export const colors = {
  // Brand
  primary: '#A9927D',
  primaryLight: '#C4B3A3',
  primaryDark: '#8A7562',

  // Backgrounds
  background: '#F2F4F3',
  surface: '#FFFFFF',
  surfaceAlt: '#E8EBE9',

  // Text
  text: '#1A1A1A',
  textSecondary: '#5C5C5C',
  textTertiary: '#8A8A8A',
  textInverse: '#FFFFFF',

  // Accent / Semantic
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // UI
  border: '#E0E0E0',
  divider: '#EEEEEE',
  disabled: '#BDBDBD',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Bottom Tab Bar
  tabActive: '#A9927D',
  tabInactive: '#9E9E9E',
  tabBackground: '#FFFFFF',
} as const;

// Future: export const darkColors = { ... }
export type AppColors = typeof colors;
