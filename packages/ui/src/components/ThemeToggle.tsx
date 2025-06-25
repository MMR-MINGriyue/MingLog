import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { clsx } from 'clsx';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  size = 'md',
  showLabel = false,
}) => {
  const { settings, updateSettings, isDark } = useTheme();

  const toggleTheme = () => {
    if (settings.theme === 'light') {
      updateSettings({ theme: 'dark' });
    } else if (settings.theme === 'dark') {
      updateSettings({ theme: 'system' });
    } else {
      updateSettings({ theme: 'light' });
    }
  };

  const getIcon = () => {
    switch (settings.theme) {
      case 'light':
        return (
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'dark':
        return (
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      case 'system':
        return (
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const getLabel = () => {
    switch (settings.theme) {
      case 'light':
        return '浅色';
      case 'dark':
        return '深色';
      case 'system':
        return '跟随系统';
    }
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={toggleTheme}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg transition-colors',
        'text-gray-600 dark:text-gray-400',
        'hover:text-gray-900 dark:hover:text-gray-100',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        size === 'sm' && 'p-1',
        size === 'md' && 'p-2',
        size === 'lg' && 'p-3',
        className
      )}
      title={`当前主题: ${getLabel()}`}
    >
      <div className={sizeClasses[size]}>
        {getIcon()}
      </div>
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {getLabel()}
        </span>
      )}
    </button>
  );
};

// Quick theme selector component
export const ThemeSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { settings, updateSettings } = useTheme();

  const themes = [
    { value: 'light' as const, label: '浅色', icon: '☀️' },
    { value: 'dark' as const, label: '深色', icon: '🌙' },
    { value: 'system' as const, label: '系统', icon: '💻' },
  ];

  return (
    <div className={clsx('flex rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      {themes.map((theme, index) => (
        <button
          key={theme.value}
          onClick={() => updateSettings({ theme: theme.value })}
          className={clsx(
            'flex-1 px-3 py-2 text-sm font-medium transition-colors',
            'first:rounded-l-lg last:rounded-r-lg',
            settings.theme === theme.value
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          )}
        >
          <span className="mr-1">{theme.icon}</span>
          {theme.label}
        </button>
      ))}
    </div>
  );
};
