import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { ThemeMode } from '../theme/types';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'button' | 'dropdown' | 'segmented';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
  variant = 'button',
}) => {
  const { mode, setMode, preferences } = useTheme();

  const themes: { mode: ThemeMode; label: string; icon: JSX.Element }[] = [
    {
      mode: 'light',
      label: '浅色',
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      mode: 'dark',
      label: '深色',
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )
    },
    {
      mode: 'system',
      label: '跟随系统',
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
  ];

  const toggleTheme = () => {
    const currentIndex = themes.findIndex(t => t.mode === preferences.mode);
    const nextIndex = (currentIndex + 1) % themes.length;
    setMode(themes[nextIndex].mode);
  };

  const getCurrentTheme = () => {
    return themes.find(t => t.mode === preferences.mode) || themes[0];
  };

  const sizeClasses = {
    sm: 'w-4 h-4 p-1',
    md: 'w-5 h-5 p-2',
    lg: 'w-6 h-6 p-3',
  };

  const currentTheme = getCurrentTheme();

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`
          inline-flex items-center justify-center rounded-lg transition-colors
          text-gray-600 dark:text-gray-400
          hover:text-gray-900 dark:hover:text-gray-100
          hover:bg-gray-100 dark:hover:bg-gray-800
          ${sizeClasses[size]} ${className}
        `}
        title={`当前主题: ${currentTheme.label}`}
      >
        <div className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'}`}>
          {currentTheme.icon}
        </div>
        {showLabel && (
          <span className="ml-2 text-sm font-medium">
            {currentTheme.label}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <select
        value={preferences.mode}
        onChange={(e) => setMode(e.target.value as ThemeMode)}
        className={`
          rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          dark:bg-gray-800 dark:border-gray-600 dark:text-white
          ${className}
        `}
      >
        {themes.map((theme) => (
          <option key={theme.mode} value={theme.mode}>
            {theme.label}
          </option>
        ))}
      </select>
    );
  }

  if (variant === 'segmented') {
    return (
      <div className={`inline-flex rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        {themes.map((theme) => (
          <button
            key={theme.mode}
            onClick={() => setMode(theme.mode)}
            className={`
              flex-1 px-3 py-2 text-sm font-medium transition-colors
              first:rounded-l-lg last:rounded-r-lg
              ${preferences.mode === theme.mode
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }
            `}
          >
            <div className="w-4 h-4 inline-block mr-1">
              {theme.icon}
            </div>
            {showLabel && theme.label}
          </button>
        ))}
      </div>
    );
  }

  return null;
};

// Quick theme selector component
export const ThemeSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { preferences, setMode } = useTheme();

  const themes = [
    { value: 'light' as const, label: '浅色', icon: '☀️' },
    { value: 'dark' as const, label: '深色', icon: '🌙' },
    { value: 'system' as const, label: '系统', icon: '💻' },
  ];

  return (
    <div className={`flex rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {themes.map((theme) => (
        <button
          key={theme.value}
          onClick={() => setMode(theme.value)}
          className={`
            flex-1 px-3 py-2 text-sm font-medium transition-colors
            first:rounded-l-lg last:rounded-r-lg
            ${preferences.mode === theme.value
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }
          `}
        >
          <span className="mr-1">{theme.icon}</span>
          {theme.label}
        </button>
      ))}
    </div>
  );
};
