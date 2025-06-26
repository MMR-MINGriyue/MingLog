/**
 * Theme System Types for MingLog
 * Defines the structure and types for the theme system
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ColorPalette {
  // Primary colors
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // Secondary colors
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // Semantic colors
  success: {
    50: string;
    100: string;
    500: string;
    600: string;
    900: string;
  };
  
  warning: {
    50: string;
    100: string;
    500: string;
    600: string;
    900: string;
  };
  
  error: {
    50: string;
    100: string;
    500: string;
    600: string;
    900: string;
  };
  
  info: {
    50: string;
    100: string;
    500: string;
    600: string;
    900: string;
  };
  
  // Neutral colors
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
}

export interface ThemeColors {
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    overlay: string;
  };
  
  // Surface colors
  surface: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    overlay: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
  };
  
  // Border colors
  border: {
    primary: string;
    secondary: string;
    tertiary: string;
    focus: string;
    error: string;
  };
  
  // Interactive colors
  interactive: {
    primary: string;
    primaryHover: string;
    primaryActive: string;
    secondary: string;
    secondaryHover: string;
    secondaryActive: string;
  };
  
  // Status colors
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface Typography {
  fontFamily: {
    sans: string;
    mono: string;
    serif: string;
  };
  
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface Spacing {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  56: string;
  64: string;
}

export interface BorderRadius {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

export interface Shadows {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

export interface Transitions {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  
  timing: {
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  transitions: Transitions;
  palette: ColorPalette;
}

export interface ThemeConfig {
  defaultTheme: ThemeMode;
  themes: {
    light: Theme;
    dark: Theme;
  };
  customThemes?: Record<string, Theme>;
}

export interface UserThemePreferences {
  mode: ThemeMode;
  fontSize: number;
  fontFamily?: string;
  customColors?: Partial<ThemeColors>;
  reducedMotion?: boolean;
  highContrast?: boolean;
}

// Theme context types
export interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  preferences: UserThemePreferences;
  updatePreferences: (preferences: Partial<UserThemePreferences>) => void;
  resetToDefaults: () => void;
}

// Component theme types
export interface ComponentTheme {
  base: string;
  variants: Record<string, string>;
  sizes: Record<string, string>;
  states: Record<string, string>;
}

export interface ThemeComponents {
  button: ComponentTheme;
  input: ComponentTheme;
  card: ComponentTheme;
  modal: ComponentTheme;
  tooltip: ComponentTheme;
  dropdown: ComponentTheme;
  sidebar: ComponentTheme;
  editor: ComponentTheme;
}

// Utility types
export type ThemeValue<T> = T | ((theme: Theme) => T);
export type ResponsiveValue<T> = T | T[];
export type ColorValue = keyof ThemeColors | string;
