/**
 * Theme Settings Button Component
 * Quick access button for theme settings
 */

import React, { useState } from 'react';
import { ThemeSettingsModal } from './ThemeSettings';
import { useTheme } from '../theme/ThemeProvider';

interface ThemeSettingsButtonProps {
  variant?: 'icon' | 'button' | 'menu-item';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export const ThemeSettingsButton: React.FC<ThemeSettingsButtonProps> = ({
  variant = 'icon',
  size = 'md',
  className = '',
  showLabel = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { mode } = useTheme();

  const sizeClasses = {
    sm: 'w-4 h-4 p-1',
    md: 'w-5 h-5 p-2',
    lg: 'w-6 h-6 p-3',
  };

  const getThemeIcon = () => {
    switch (mode) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'system':
        return '💻';
      default:
        return '🎨';
    }
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`
            inline-flex items-center justify-center rounded-lg transition-colors
            text-gray-600 dark:text-gray-400
            hover:text-gray-900 dark:hover:text-gray-100
            hover:bg-gray-100 dark:hover:bg-gray-800
            ${sizeClasses[size]} ${className}
          `}
          title="主题设置"
        >
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </button>
        <ThemeSettingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  if (variant === 'button') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
            hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${className}
          `}
        >
          <span className="text-lg">{getThemeIcon()}</span>
          {showLabel && <span>主题设置</span>}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </button>
        <ThemeSettingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  if (variant === 'menu-item') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`
            w-full flex items-center gap-3 px-4 py-2 text-left text-sm
            text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
            transition-colors ${className}
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          <div className="flex-1">
            <div className="font-medium">主题设置</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              自定义外观和主题
            </div>
          </div>
          <span className="text-lg">{getThemeIcon()}</span>
        </button>
        <ThemeSettingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  return null;
};

// Quick Theme Panel - 紧凑的主题设置面板
interface QuickThemePanelProps {
  className?: string;
}

export const QuickThemePanel: React.FC<QuickThemePanelProps> = ({
  className = '',
}) => {
  const { mode, setMode, preferences, updatePreferences } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const themes = [
    { mode: 'light' as const, label: '浅色', icon: '☀️' },
    { mode: 'dark' as const, label: '深色', icon: '🌙' },
    { mode: 'system' as const, label: '系统', icon: '💻' },
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white">主题</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Quick Theme Selection */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {themes.map((theme) => (
            <button
              key={theme.mode}
              onClick={() => setMode(theme.mode)}
              className={`
                flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors
                ${mode === theme.mode
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              <span className="text-lg">{theme.icon}</span>
              <span className="text-xs font-medium">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Options */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              字体大小: {preferences.fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="20"
              step="1"
              value={preferences.fontSize}
              onChange={(e) => updatePreferences({ fontSize: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>

          {/* Accessibility Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={preferences.reducedMotion}
                onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">减少动画</span>
            </label>
            
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={preferences.highContrast}
                onChange={(e) => updatePreferences({ highContrast: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">高对比度</span>
            </label>
          </div>

          {/* Full Settings Link */}
          <ThemeSettingsButton variant="menu-item" showLabel />
        </div>
      )}
    </div>
  );
};

// Theme Settings Dropdown
interface ThemeSettingsDropdownProps {
  className?: string;
  trigger?: React.ReactNode;
}

export const ThemeSettingsDropdown: React.FC<ThemeSettingsDropdownProps> = ({
  className = '',
  trigger,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFullSettings, setShowFullSettings] = useState(false);

  const defaultTrigger = (
    <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
      </svg>
    </button>
  );

  return (
    <div className={`relative ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || defaultTrigger}
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-80 z-20">
            <QuickThemePanel />
          </div>
        </>
      )}

      <ThemeSettingsModal 
        isOpen={showFullSettings} 
        onClose={() => setShowFullSettings(false)} 
      />
    </div>
  );
};
