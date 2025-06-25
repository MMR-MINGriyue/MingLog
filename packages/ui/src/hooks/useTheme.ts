import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type SidebarWidth = 'narrow' | 'normal' | 'wide';
export type EditorWidth = 'narrow' | 'normal' | 'wide' | 'full';

export interface ThemeSettings {
  theme: Theme;
  fontSize: FontSize;
  sidebarWidth: SidebarWidth;
  editorWidth: EditorWidth;
  compactMode: boolean;
  showLineNumbers: boolean;
  focusMode: boolean;
  reducedMotion: boolean;
}

export interface ThemeContextType {
  settings: ThemeSettings;
  updateSettings: (updates: Partial<ThemeSettings>) => void;
  resetSettings: () => void;
  isDark: boolean;
  actualTheme: 'light' | 'dark';
}

const defaultSettings: ThemeSettings = {
  theme: 'system',
  fontSize: 'medium',
  sidebarWidth: 'normal',
  editorWidth: 'normal',
  compactMode: false,
  showLineNumbers: false,
  focusMode: false,
  reducedMotion: false,
};

const STORAGE_KEY = 'minglog-theme-settings';

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useThemeSettings = () => {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load theme settings:', error);
    }
    
    return defaultSettings;
  });

  const [isDark, setIsDark] = useState(false);
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // Save settings to localStorage
  const updateSettings = (updates: Partial<ThemeSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save theme settings:', error);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset theme settings:', error);
    }
  };

  // Handle system theme detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
      let shouldBeDark = false;
      
      if (settings.theme === 'dark') {
        shouldBeDark = true;
      } else if (settings.theme === 'light') {
        shouldBeDark = false;
      } else {
        // system
        shouldBeDark = mediaQuery.matches;
      }
      
      setIsDark(shouldBeDark);
      setActualTheme(shouldBeDark ? 'dark' : 'light');
      
      // Apply theme to document
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [settings.theme]);

  // Apply CSS custom properties for settings
  useEffect(() => {
    const root = document.documentElement;
    
    // Font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px',
    };
    root.style.setProperty('--font-size-base', fontSizeMap[settings.fontSize]);
    
    // Sidebar width
    const sidebarWidthMap = {
      narrow: '200px',
      normal: '280px',
      wide: '360px',
    };
    root.style.setProperty('--sidebar-width', sidebarWidthMap[settings.sidebarWidth]);
    
    // Editor width
    const editorWidthMap = {
      narrow: '600px',
      normal: '800px',
      wide: '1000px',
      full: '100%',
    };
    root.style.setProperty('--editor-max-width', editorWidthMap[settings.editorWidth]);
    
    // Compact mode
    root.style.setProperty('--spacing-scale', settings.compactMode ? '0.8' : '1');
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--transition-duration', '0ms');
    } else {
      root.style.setProperty('--transition-duration', '150ms');
    }
    
    // Focus mode
    if (settings.focusMode) {
      root.classList.add('focus-mode');
    } else {
      root.classList.remove('focus-mode');
    }
    
  }, [settings]);

  return {
    settings,
    updateSettings,
    resetSettings,
    isDark,
    actualTheme,
  };
};

// CSS class utilities
export const getThemeClasses = (settings: ThemeSettings) => {
  const classes = [];
  
  if (settings.compactMode) classes.push('compact-mode');
  if (settings.showLineNumbers) classes.push('show-line-numbers');
  if (settings.focusMode) classes.push('focus-mode');
  if (settings.reducedMotion) classes.push('reduced-motion');
  
  return classes.join(' ');
};

// Responsive font size utilities
export const getFontSizeClasses = (fontSize: FontSize) => {
  const sizeMap = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    'extra-large': 'text-xl',
  };
  return sizeMap[fontSize];
};

// Layout utilities
export const getLayoutClasses = (settings: ThemeSettings) => {
  const classes = [];
  
  // Sidebar width
  const sidebarMap = {
    narrow: 'sidebar-narrow',
    normal: 'sidebar-normal',
    wide: 'sidebar-wide',
  };
  classes.push(sidebarMap[settings.sidebarWidth]);
  
  // Editor width
  const editorMap = {
    narrow: 'editor-narrow',
    normal: 'editor-normal',
    wide: 'editor-wide',
    full: 'editor-full',
  };
  classes.push(editorMap[settings.editorWidth]);
  
  return classes.join(' ');
};
