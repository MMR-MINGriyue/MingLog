/**
 * Theme Toggle Hook
 * Provides functionality for toggling between themes with animations
 */

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import { ThemeMode } from './types';

interface UseThemeToggleOptions {
  enableTransitions?: boolean;
  transitionDuration?: number;
  onThemeChange?: (theme: ThemeMode) => void;
}

interface UseThemeToggleReturn {
  currentTheme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  isSystemTheme: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
  isTransitioning: boolean;
  systemTheme: 'light' | 'dark';
}

export const useThemeToggle = (
  options: UseThemeToggleOptions = {}
): UseThemeToggleReturn => {
  const {
    enableTransitions = true,
    transitionDuration = 200,
    onThemeChange,
  } = options;

  const { mode, setMode, preferences } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

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

  // Get effective theme (resolve 'system' to actual theme)
  const effectiveTheme = mode === 'system' ? systemTheme : mode;
  const isSystemTheme = mode === 'system';

  // Theme transition effect
  const performThemeTransition = useCallback(
    (newTheme: ThemeMode) => {
      if (!enableTransitions) {
        setMode(newTheme);
        onThemeChange?.(newTheme);
        return;
      }

      setIsTransitioning(true);

      // Add transition class to body
      document.body.style.transition = `background-color ${transitionDuration}ms ease, color ${transitionDuration}ms ease`;

      // Apply new theme
      setMode(newTheme);

      // Remove transition after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
        document.body.style.transition = '';
        onThemeChange?.(newTheme);
      }, transitionDuration);
    },
    [enableTransitions, transitionDuration, setMode, onThemeChange]
  );

  // Toggle between light and dark (ignores system)
  const toggleTheme = useCallback(() => {
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light';
    performThemeTransition(newTheme);
  }, [effectiveTheme, performThemeTransition]);

  // Set specific theme
  const setTheme = useCallback(
    (theme: ThemeMode) => {
      performThemeTransition(theme);
    },
    [performThemeTransition]
  );

  // Cycle through all themes: light -> dark -> system
  const cycleTheme = useCallback(() => {
    const themes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % themes.length;
    performThemeTransition(themes[nextIndex]);
  }, [mode, performThemeTransition]);

  return {
    currentTheme: mode,
    effectiveTheme,
    isSystemTheme,
    toggleTheme,
    setTheme,
    cycleTheme,
    isTransitioning,
    systemTheme,
  };
};

// Hook for theme-aware animations
export const useThemeTransition = () => {
  const { mode } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [mode]);

  return { isAnimating };
};

// Hook for theme-based conditional rendering
export const useThemeConditional = () => {
  const { mode } = useTheme();
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const effectiveTheme = mode === 'system' ? systemTheme : mode;
  const isDark = effectiveTheme === 'dark';
  const isLight = effectiveTheme === 'light';

  return {
    isDark,
    isLight,
    effectiveTheme,
    isSystemTheme: mode === 'system',
    // Conditional rendering helpers
    whenDark: (content: React.ReactNode) => isDark ? content : null,
    whenLight: (content: React.ReactNode) => isLight ? content : null,
    whenSystem: (content: React.ReactNode) => mode === 'system' ? content : null,
  };
};

// Hook for theme-aware CSS classes
export const useThemeClasses = () => {
  const { mode } = useTheme();
  const { effectiveTheme } = useThemeConditional();

  const getThemeClass = useCallback(
    (lightClass: string, darkClass: string) => {
      return effectiveTheme === 'dark' ? darkClass : lightClass;
    },
    [effectiveTheme]
  );

  const getConditionalClass = useCallback(
    (condition: boolean, trueClass: string, falseClass: string = '') => {
      return condition ? trueClass : falseClass;
    },
    []
  );

  return {
    themeClass: `theme-${effectiveTheme}`,
    modeClass: `mode-${mode}`,
    getThemeClass,
    getConditionalClass,
    // Common theme-aware classes
    bg: {
      primary: getThemeClass('bg-white', 'bg-gray-900'),
      secondary: getThemeClass('bg-gray-50', 'bg-gray-800'),
      tertiary: getThemeClass('bg-gray-100', 'bg-gray-700'),
    },
    text: {
      primary: getThemeClass('text-gray-900', 'text-white'),
      secondary: getThemeClass('text-gray-600', 'text-gray-300'),
      tertiary: getThemeClass('text-gray-500', 'text-gray-400'),
    },
    border: {
      primary: getThemeClass('border-gray-200', 'border-gray-700'),
      secondary: getThemeClass('border-gray-300', 'border-gray-600'),
    },
  };
};

// Hook for theme persistence
export const useThemePersistence = (storageKey: string = 'minglog-theme') => {
  const { mode, setMode } = useTheme();

  // Save theme to localStorage
  const saveTheme = useCallback(
    (theme: ThemeMode) => {
      try {
        localStorage.setItem(storageKey, theme);
        setMode(theme);
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error);
      }
    },
    [storageKey, setMode]
  );

  // Load theme from localStorage
  const loadTheme = useCallback(() => {
    try {
      const savedTheme = localStorage.getItem(storageKey) as ThemeMode;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setMode(savedTheme);
        return savedTheme;
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
    return null;
  }, [storageKey, setMode]);

  // Clear saved theme
  const clearTheme = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear theme from localStorage:', error);
    }
  }, [storageKey]);

  return {
    currentTheme: mode,
    saveTheme,
    loadTheme,
    clearTheme,
  };
};
