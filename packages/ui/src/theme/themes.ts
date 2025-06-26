/**
 * Theme Definitions for MingLog
 * Light and Dark theme implementations
 */

import { Theme, ThemeColors } from './types';
import { 
  colorPalette, 
  typography, 
  spacing, 
  borderRadius, 
  shadows, 
  transitions 
} from './tokens';

// Light Theme Colors
const lightColors: ThemeColors = {
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  surface: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    elevated: '#ffffff',
    overlay: 'rgba(255, 255, 255, 0.9)',
  },
  
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    tertiary: '#94a3b8',
    disabled: '#cbd5e1',
    inverse: '#ffffff',
  },
  
  border: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    focus: colorPalette.primary[500],
    error: colorPalette.error[500],
  },
  
  interactive: {
    primary: colorPalette.primary[500],
    primaryHover: colorPalette.primary[600],
    primaryActive: colorPalette.primary[700],
    secondary: colorPalette.gray[200],
    secondaryHover: colorPalette.gray[300],
    secondaryActive: colorPalette.gray[400],
  },
  
  status: {
    success: colorPalette.success[500],
    warning: colorPalette.warning[500],
    error: colorPalette.error[500],
    info: colorPalette.info[500],
  },
};

// Dark Theme Colors
const darkColors: ThemeColors = {
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
    elevated: '#1e293b',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  
  surface: {
    primary: '#1e293b',
    secondary: '#334155',
    tertiary: '#475569',
    elevated: '#334155',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
  
  text: {
    primary: '#f1f5f9',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    disabled: '#64748b',
    inverse: '#1e293b',
  },
  
  border: {
    primary: '#334155',
    secondary: '#475569',
    tertiary: '#64748b',
    focus: colorPalette.primary[400],
    error: colorPalette.error[400],
  },
  
  interactive: {
    primary: colorPalette.primary[400],
    primaryHover: colorPalette.primary[300],
    primaryActive: colorPalette.primary[200],
    secondary: colorPalette.gray[700],
    secondaryHover: colorPalette.gray[600],
    secondaryActive: colorPalette.gray[500],
  },
  
  status: {
    success: colorPalette.success[400],
    warning: colorPalette.warning[400],
    error: colorPalette.error[400],
    info: colorPalette.info[400],
  },
};

// Light Theme
export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  palette: colorPalette,
};

// Dark Theme
export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
  shadows: {
    ...shadows,
    // Adjust shadows for dark theme
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  transitions,
  palette: colorPalette,
};

// Default theme configuration
export const defaultThemeConfig = {
  defaultTheme: 'system' as const,
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
};

// Theme utilities
export const getThemeColors = (mode: 'light' | 'dark'): ThemeColors => {
  return mode === 'light' ? lightColors : darkColors;
};

export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation - in a real app, you'd use a proper color library
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

// CSS custom properties generator
export const generateCSSVariables = (theme: Theme): Record<string, string> => {
  const variables: Record<string, string> = {};
  
  // Colors
  Object.entries(theme.colors).forEach(([category, colors]) => {
    Object.entries(colors).forEach(([key, value]) => {
      variables[`--color-${category}-${key}`] = value;
    });
  });
  
  // Typography
  Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
    variables[`--font-size-${key}`] = value;
  });
  
  Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
    variables[`--font-weight-${key}`] = value.toString();
  });
  
  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    variables[`--spacing-${key}`] = value;
  });
  
  // Border radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    variables[`--radius-${key}`] = value;
  });
  
  // Shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    variables[`--shadow-${key}`] = value;
  });
  
  return variables;
};

// Theme validation
export const validateTheme = (theme: Partial<Theme>): boolean => {
  const requiredKeys = ['mode', 'colors', 'typography', 'spacing'];
  return requiredKeys.every(key => key in theme);
};

// Theme merging utility
export const mergeThemes = (baseTheme: Theme, customTheme: Partial<Theme>): Theme => {
  return {
    ...baseTheme,
    ...customTheme,
    colors: {
      ...baseTheme.colors,
      ...customTheme.colors,
    },
    typography: {
      ...baseTheme.typography,
      ...customTheme.typography,
    },
  };
};
