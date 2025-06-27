/**
 * Theme Provider for MingLog
 * Provides theme context and manages theme state
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Theme, ThemeMode, ThemeContextValue, UserThemePreferences } from './types';
import { lightTheme, darkTheme, generateCSSVariables } from './themes';

// Create theme context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Default user preferences
const defaultPreferences: UserThemePreferences = {
  mode: 'system',
  fontSize: 14,
  fontFamily: undefined,
  customColors: undefined,
  reducedMotion: false,
  highContrast: false,
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'system',
  storageKey = 'minglog-theme-preferences',
}) => {
  const [preferences, setPreferences] = useState<UserThemePreferences>(defaultPreferences);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Determine current theme mode
  const currentMode = preferences.mode === 'system' ? systemTheme : preferences.mode;
  const currentTheme = currentMode === 'light' ? lightTheme : darkTheme;

  // Load preferences from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsedPreferences });
      } else {
        setPreferences({ ...defaultPreferences, mode: defaultMode });
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
      setPreferences({ ...defaultPreferences, mode: defaultMode });
    }
  }, [defaultMode, storageKey]);

  // Save preferences to storage
  const savePreferences = useCallback((newPreferences: UserThemePreferences) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newPreferences));
    } catch (error) {
      console.warn('Failed to save theme preferences:', error);
    }
  }, [storageKey]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Set initial value
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Apply CSS variables to document
  useEffect(() => {
    const root = document.documentElement;
    const variables = generateCSSVariables(currentTheme);
    
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Apply theme class to body
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .concat(` theme-${currentMode}`)
      .trim();

    // Apply font size preference
    if (preferences.fontSize !== 14) {
      root.style.setProperty('--base-font-size', `${preferences.fontSize}px`);
    }

    // Apply reduced motion preference
    if (preferences.reducedMotion) {
      root.style.setProperty('--transition-duration-fast', '0ms');
      root.style.setProperty('--transition-duration-normal', '0ms');
      root.style.setProperty('--transition-duration-slow', '0ms');
    }

    // Apply high contrast preference
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [currentTheme, currentMode, preferences]);

  // Set theme mode
  const setMode = useCallback((mode: ThemeMode) => {
    const newPreferences = { ...preferences, mode };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<UserThemePreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const newPreferences = { ...defaultPreferences, mode: defaultMode };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  }, [defaultMode, savePreferences]);

  // Context value
  const contextValue: ThemeContextValue = {
    theme: currentTheme,
    mode: currentMode,
    setMode,
    preferences,
    updatePreferences,
    resetToDefaults,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook to get theme-aware styles
export const useThemeStyles = () => {
  const { theme } = useTheme();
  
  return {
    // Helper functions for common styling patterns
    getColor: (path: string) => {
      const keys = path.split('.');
      let value: any = theme.colors;
      for (const key of keys) {
        value = value?.[key];
      }
      return value || path;
    },
    
    getSpacing: (size: keyof typeof theme.spacing) => theme.spacing[size],
    
    getBorderRadius: (size: keyof typeof theme.borderRadius) => theme.borderRadius[size],
    
    getShadow: (size: keyof typeof theme.shadows) => theme.shadows[size],
    
    // CSS-in-JS style helpers
    button: {
      primary: {
        backgroundColor: theme.colors.interactive.primary,
        color: theme.colors.text.inverse,
        border: 'none',
        borderRadius: theme.borderRadius.md,
        padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        transition: `all ${theme.transitions.duration.normal} ${theme.transitions.timing.easeInOut}`,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: theme.colors.interactive.primaryHover,
        },
        '&:active': {
          backgroundColor: theme.colors.interactive.primaryActive,
        },
      },
      
      secondary: {
        backgroundColor: theme.colors.interactive.secondary,
        color: theme.colors.text.primary,
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.md,
        padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        transition: `all ${theme.transitions.duration.normal} ${theme.transitions.timing.easeInOut}`,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: theme.colors.interactive.secondaryHover,
        },
      },
    },
    
    card: {
      backgroundColor: theme.colors.surface.primary,
      border: `1px solid ${theme.colors.border.primary}`,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing[6],
      boxShadow: theme.shadows.sm,
    },
    
    input: {
      backgroundColor: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.primary}`,
      borderRadius: theme.borderRadius.md,
      padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
      '&:focus': {
        outline: 'none',
        borderColor: theme.colors.border.focus,
        boxShadow: `0 0 0 3px ${theme.colors.interactive.primary}20`,
      },
    },
  };
};

// Hook for responsive theme values
export const useResponsiveValue = <T>(values: T | T[]): T => {
  // Simple implementation - in a real app, you'd use proper breakpoint detection
  return Array.isArray(values) ? values[0] : values;
};
