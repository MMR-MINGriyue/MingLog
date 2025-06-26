/**
 * Theme System Entry Point
 * Exports all theme-related functionality
 */

// Types
export type {
  Theme,
  ThemeMode,
  ThemeColors,
  ThemeConfig,
  ThemeContextValue,
  UserThemePreferences,
  ColorPalette,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Transitions,
  ComponentTheme,
  ThemeComponents,
  ThemeValue,
  ResponsiveValue,
  ColorValue,
} from './types';

// Theme Provider and Hooks
export {
  ThemeProvider,
  useTheme,
  useThemeStyles,
  useResponsiveValue,
} from './ThemeProvider';

// Theme Toggle Hooks
export {
  useThemeToggle,
  useThemeTransition,
  useThemeConditional,
  useThemeClasses,
  useThemePersistence,
} from './useThemeToggle';

// Font Size Hook
export {
  useFontSize,
  FONT_SIZE_PRESETS,
  type FontSizeConfig,
  type FontSizePreset,
  type UseFontSizeOptions,
  type UseFontSizeReturn,
} from '../hooks/useFontSize';

// Theme Definitions
export {
  lightTheme,
  darkTheme,
  defaultThemeConfig,
  getThemeColors,
  getContrastColor,
  generateCSSVariables,
  validateTheme,
  mergeThemes,
} from './themes';

// Design Tokens
export {
  colorPalette,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  gradients,
  zIndex,
  breakpoints,
  keyframes,
  componentVariants,
} from './tokens';

// Font Size Utilities
export {
  fontSizeClasses,
  generateFontSizeCSS,
  getRecommendedLineHeight,
  validateFontSize,
  fontSizeConverters,
  checkReadability,
  checkAccessibility,
  generateFontSizePresets,
  fontSizeUtils,
} from './fontSizeUtils';

// Layout System
export * from '../layout';

// Preference System
export * from '../types/preferences';
export {
  PreferenceStorage,
  LocalStorageBackend,
  ElectronStoreBackend,
  preferenceStorage,
  createPreferenceStorage,
} from '../services/PreferenceStorage';

// Utility functions
export const createTheme = (overrides: Partial<Theme>): Theme => {
  const { mergeThemes, lightTheme } = require('./themes');
  return mergeThemes(lightTheme, overrides);
};

export const createCustomTheme = (
  baseTheme: Theme,
  customColors: Partial<ThemeColors>
): Theme => {
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...customColors,
    },
  };
};

// CSS-in-JS helpers
export const css = (styles: Record<string, any>) => styles;

export const styled = (component: string) => (styles: Record<string, any>) => ({
  component,
  styles,
});

// Theme utilities for CSS classes
export const themeClasses = {
  // Background classes
  bg: {
    primary: 'bg-white dark:bg-gray-900',
    secondary: 'bg-gray-50 dark:bg-gray-800',
    tertiary: 'bg-gray-100 dark:bg-gray-700',
    elevated: 'bg-white dark:bg-gray-800',
  },
  
  // Text classes
  text: {
    primary: 'text-gray-900 dark:text-white',
    secondary: 'text-gray-600 dark:text-gray-300',
    tertiary: 'text-gray-500 dark:text-gray-400',
    disabled: 'text-gray-400 dark:text-gray-500',
    inverse: 'text-white dark:text-gray-900',
  },
  
  // Border classes
  border: {
    primary: 'border-gray-200 dark:border-gray-700',
    secondary: 'border-gray-300 dark:border-gray-600',
    focus: 'border-blue-500 dark:border-blue-400',
    error: 'border-red-500 dark:border-red-400',
  },
  
  // Interactive classes
  interactive: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    ghost: 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20',
  },
  
  // Status classes
  status: {
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
  },
};

// Responsive breakpoint utilities
export const breakpointUtils = {
  up: (breakpoint: keyof typeof breakpoints) => `@media (min-width: ${breakpoints[breakpoint]})`,
  down: (breakpoint: keyof typeof breakpoints) => {
    const breakpointValues = Object.values(breakpoints);
    const currentIndex = Object.keys(breakpoints).indexOf(breakpoint);
    const prevValue = breakpointValues[currentIndex - 1];
    return prevValue ? `@media (max-width: ${prevValue})` : '';
  },
  between: (min: keyof typeof breakpoints, max: keyof typeof breakpoints) =>
    `@media (min-width: ${breakpoints[min]}) and (max-width: ${breakpoints[max]})`,
};

// Animation utilities
export const animations = {
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
};

// Theme validation utilities
export const isValidThemeMode = (mode: string): mode is ThemeMode => {
  return ['light', 'dark', 'system'].includes(mode);
};

export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const getEffectiveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  return mode === 'system' ? getSystemTheme() : mode;
};

// Color manipulation utilities
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const adjustOpacity = (color: string, opacity: number): string => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
};

// Components
export { ThemeToggle, ThemeSelector } from '../components/ThemeToggle';
export {
  ThemePreview,
  ThemeGallery,
  CompactThemeSwitcher,
  ThemeStatus
} from '../components/ThemePreview';
export {
  ThemeSettings,
  ThemeSettingsModal
} from '../components/ThemeSettings';
export {
  ThemeSettingsButton,
  QuickThemePanel,
  ThemeSettingsDropdown
} from '../components/ThemeSettingsButton';

// Font Size Components
export { FontSizeSettings } from '../components/FontSizeSettings';
export {
  FontSizeControls,
  FontSizeIndicator
} from '../components/FontSizeControls';

// Layout Components
export {
  LayoutProvider,
  useLayout,
  useLayoutStyles,
  useResponsiveLayout,
} from '../layout/LayoutProvider';

export {
  LayoutSettings,
  LayoutSettingsModal,
} from '../components/LayoutSettings';

export {
  LayoutControls,
  LayoutStatus,
} from '../components/LayoutControls';

// Preference Components
export { PreferenceManager } from '../components/PreferenceManager';
export { usePreferences } from '../hooks/usePreferences';

// Default export
export default {
  ThemeProvider,
  useTheme,
  useThemeStyles,
  lightTheme,
  darkTheme,
  colorPalette,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  themeClasses,
  animations,
};
