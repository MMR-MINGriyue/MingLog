/**
 * Theme Preview Component
 * Shows a preview of how the interface looks in different themes
 */

import React from 'react';
import { ThemeMode } from '../theme/types';

interface ThemePreviewProps {
  theme: ThemeMode;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  showLabel?: boolean;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({
  theme,
  isSelected = false,
  onClick,
  className = '',
  showLabel = true,
}) => {
  const getThemeStyles = (themeMode: ThemeMode) => {
    const isSystem = themeMode === 'system';
    const isDark = themeMode === 'dark' || (isSystem && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      return {
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#cbd5e1',
        border: '#334155',
        accent: '#667eea',
      };
    }
    
    return {
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      accent: '#667eea',
    };
  };

  const styles = getThemeStyles(theme);
  
  const getThemeInfo = (themeMode: ThemeMode) => {
    switch (themeMode) {
      case 'light':
        return { label: '浅色主题', icon: '☀️', description: '明亮清爽的界面' };
      case 'dark':
        return { label: '深色主题', icon: '🌙', description: '护眼的深色界面' };
      case 'system':
        return { label: '跟随系统', icon: '💻', description: '自动跟随系统设置' };
    }
  };

  const themeInfo = getThemeInfo(theme);

  return (
    <div
      className={`
        relative cursor-pointer rounded-lg border-2 transition-all duration-200
        ${isSelected 
          ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' 
          : 'border-gray-200 hover:border-gray-300'
        }
        ${className}
      `}
      onClick={onClick}
    >
      {/* Preview Window */}
      <div
        className="rounded-t-md p-4 min-h-[120px]"
        style={{ backgroundColor: styles.background }}
      >
        {/* Mock Window Header */}
        <div
          className="flex items-center gap-2 mb-3 p-2 rounded"
          style={{ backgroundColor: styles.surface }}
        >
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
          </div>
          <div
            className="flex-1 text-xs font-medium text-center"
            style={{ color: styles.text }}
          >
            MingLog
          </div>
        </div>

        {/* Mock Content */}
        <div className="space-y-2">
          {/* Mock Title */}
          <div
            className="h-3 rounded"
            style={{ 
              backgroundColor: styles.accent,
              width: '60%'
            }}
          ></div>
          
          {/* Mock Text Lines */}
          <div
            className="h-2 rounded"
            style={{ 
              backgroundColor: styles.textSecondary + '40',
              width: '80%'
            }}
          ></div>
          <div
            className="h-2 rounded"
            style={{ 
              backgroundColor: styles.textSecondary + '40',
              width: '65%'
            }}
          ></div>
          
          {/* Mock Button */}
          <div className="pt-2">
            <div
              className="inline-block px-3 py-1 rounded text-xs text-white"
              style={{ backgroundColor: styles.accent }}
            >
              按钮
            </div>
          </div>
        </div>
      </div>

      {/* Theme Info */}
      {showLabel && (
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{themeInfo.icon}</span>
            <span className="font-medium text-gray-900">{themeInfo.label}</span>
            {isSelected && (
              <svg className="w-4 h-4 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-500">{themeInfo.description}</p>
        </div>
      )}
    </div>
  );
};

// Theme Gallery Component
interface ThemeGalleryProps {
  selectedTheme: ThemeMode;
  onThemeSelect: (theme: ThemeMode) => void;
  className?: string;
}

export const ThemeGallery: React.FC<ThemeGalleryProps> = ({
  selectedTheme,
  onThemeSelect,
  className = '',
}) => {
  const themes: ThemeMode[] = ['light', 'dark', 'system'];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {themes.map((theme) => (
        <ThemePreview
          key={theme}
          theme={theme}
          isSelected={selectedTheme === theme}
          onClick={() => onThemeSelect(theme)}
        />
      ))}
    </div>
  );
};

// Compact Theme Switcher
interface CompactThemeSwitcherProps {
  className?: string;
}

export const CompactThemeSwitcher: React.FC<CompactThemeSwitcherProps> = ({
  className = '',
}) => {
  const [currentTheme, setCurrentTheme] = React.useState<ThemeMode>('system');

  // Load current theme from context or localStorage
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('minglog-theme-preferences');
    if (savedTheme) {
      try {
        const preferences = JSON.parse(savedTheme);
        setCurrentTheme(preferences.mode || 'system');
      } catch (error) {
        console.warn('Failed to parse theme preferences:', error);
      }
    }
  }, []);

  const themes: { mode: ThemeMode; icon: string; label: string }[] = [
    { mode: 'light', icon: '☀️', label: '浅色' },
    { mode: 'dark', icon: '🌙', label: '深色' },
    { mode: 'system', icon: '💻', label: '系统' },
  ];

  const handleThemeChange = (theme: ThemeMode) => {
    setCurrentTheme(theme);
    
    // Apply theme immediately
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .concat(` theme-${theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme}`)
      .trim();

    // Save to localStorage
    try {
      const preferences = { mode: theme };
      localStorage.setItem('minglog-theme-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save theme preferences:', error);
    }
  };

  return (
    <div className={`flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {themes.map((theme) => (
        <button
          key={theme.mode}
          onClick={() => handleThemeChange(theme.mode)}
          className={`
            flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors
            ${currentTheme === theme.mode
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }
          `}
          title={`切换到${theme.label}主题`}
        >
          <span>{theme.icon}</span>
          <span className="hidden sm:inline">{theme.label}</span>
        </button>
      ))}
    </div>
  );
};

// Theme Status Indicator
interface ThemeStatusProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeStatus: React.FC<ThemeStatusProps> = ({
  className = '',
  showLabel = true,
}) => {
  const [currentTheme, setCurrentTheme] = React.useState<ThemeMode>('system');
  const [effectiveTheme, setEffectiveTheme] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    // Check system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateEffectiveTheme = () => {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      setEffectiveTheme(currentTheme === 'system' ? systemTheme : currentTheme as 'light' | 'dark');
    };

    updateEffectiveTheme();
    mediaQuery.addEventListener('change', updateEffectiveTheme);

    return () => mediaQuery.removeEventListener('change', updateEffectiveTheme);
  }, [currentTheme]);

  const getStatusInfo = () => {
    if (currentTheme === 'system') {
      return {
        icon: '💻',
        label: `系统 (${effectiveTheme === 'dark' ? '深色' : '浅色'})`,
        color: 'text-blue-600 dark:text-blue-400',
      };
    }
    
    return {
      icon: effectiveTheme === 'dark' ? '🌙' : '☀️',
      label: effectiveTheme === 'dark' ? '深色' : '浅色',
      color: effectiveTheme === 'dark' ? 'text-purple-600 dark:text-purple-400' : 'text-yellow-600 dark:text-yellow-400',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-lg">{statusInfo.icon}</span>
      {showLabel && (
        <span className={`text-sm font-medium ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      )}
    </div>
  );
};
