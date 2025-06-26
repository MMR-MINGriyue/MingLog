/**
 * Theme Settings Component
 * Complete theme configuration interface
 */

import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { ThemeMode, UserThemePreferences } from '../theme/types';
import { ThemePreview, ThemeGallery } from './ThemePreview';
import { ThemeToggle } from './ThemeToggle';

interface ThemeSettingsProps {
  className?: string;
  onClose?: () => void;
}

// Theme Settings Modal
interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl">
          <ThemeSettings onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({
  className = '',
  onClose,
}) => {
  const { theme, mode, preferences, updatePreferences, resetToDefaults } = useTheme();
  const [activeTab, setActiveTab] = useState<'theme' | 'appearance' | 'accessibility'>('theme');

  const handleThemeChange = (newMode: ThemeMode) => {
    updatePreferences({ mode: newMode });
  };

  const handleFontSizeChange = (fontSize: number) => {
    updatePreferences({ fontSize });
  };

  const handleAccessibilityChange = (key: keyof UserThemePreferences, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  const tabs = [
    { id: 'theme' as const, label: '主题', icon: '🎨' },
    { id: 'appearance' as const, label: '外观', icon: '👁️' },
    { id: 'accessibility' as const, label: '无障碍', icon: '♿' },
  ];

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          主题设置
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'theme' && (
          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                选择主题
              </h3>
              <ThemeGallery
                selectedTheme={mode}
                onThemeSelect={handleThemeChange}
              />
            </div>

            {/* Quick Toggle */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                快速切换
              </h3>
              <div className="flex flex-wrap gap-4">
                <ThemeToggle variant="button" size="lg" showLabel />
                <ThemeToggle variant="segmented" showLabel />
              </div>
            </div>

            {/* Current Theme Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                当前主题信息
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">模式:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{mode}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">有效主题:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {mode === 'system' 
                      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? '深色' : '浅色')
                      : (mode === 'dark' ? '深色' : '浅色')
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6">
            {/* Font Size */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                字体大小
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    基础字体大小
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {preferences.fontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="20"
                  step="1"
                  value={preferences.fontSize}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>小 (12px)</span>
                  <span>中 (16px)</span>
                  <span>大 (20px)</span>
                </div>
              </div>

              {/* Font Preview */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  字体预览
                </h4>
                <div style={{ fontSize: `${preferences.fontSize}px` }}>
                  <p className="text-gray-900 dark:text-white mb-2">
                    这是标题文本的预览效果
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    这是正文内容的预览效果，您可以看到当前字体大小的显示效果。
                  </p>
                </div>
              </div>
            </div>

            {/* Font Family */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                字体族
              </h3>
              <select
                value={preferences.fontFamily || 'default'}
                onChange={(e) => updatePreferences({ 
                  fontFamily: e.target.value === 'default' ? undefined : e.target.value 
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">系统默认</option>
                <option value="serif">衬线字体 (Serif)</option>
                <option value="mono">等宽字体 (Monospace)</option>
              </select>
            </div>

            {/* Color Customization */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                颜色自定义
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    主色调
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.colors.interactive.primary}
                      className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600"
                      disabled // 暂时禁用，需要实现自定义颜色功能
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {theme.colors.interactive.primary}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    强调色
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.colors.status.info}
                      className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600"
                      disabled // 暂时禁用，需要实现自定义颜色功能
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {theme.colors.status.info}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                * 自定义颜色功能即将推出
              </p>
            </div>
          </div>
        )}

        {activeTab === 'accessibility' && (
          <div className="space-y-6">
            {/* Motion Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                动画设置
              </h3>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.reducedMotion}
                  onChange={(e) => handleAccessibilityChange('reducedMotion', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    减少动画效果
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    禁用或减少界面动画和过渡效果
                  </div>
                </div>
              </label>
            </div>

            {/* Contrast Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                对比度设置
              </h3>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.highContrast}
                  onChange={(e) => handleAccessibilityChange('highContrast', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    高对比度模式
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    增强文本和背景的对比度，提高可读性
                  </div>
                </div>
              </label>
            </div>

            {/* System Preferences */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                系统偏好
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      系统主题偏好
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {window.matchMedia('(prefers-color-scheme: dark)').matches ? '深色' : '浅色'}
                    </div>
                  </div>
                  <span className="text-2xl">
                    {window.matchMedia('(prefers-color-scheme: dark)').matches ? '🌙' : '☀️'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      系统动画偏好
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {window.matchMedia('(prefers-reduced-motion: reduce)').matches ? '减少动画' : '正常动画'}
                    </div>
                  </div>
                  <span className="text-2xl">
                    {window.matchMedia('(prefers-reduced-motion: reduce)').matches ? '🚫' : '✨'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={resetToDefaults}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          恢复默认设置
        </button>
        <div className="flex gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              取消
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
};
