import React, { useState } from 'react';
import { useTheme, Theme, FontSize, SidebarWidth, EditorWidth } from '../hooks/useTheme';
import { Button } from './Button';
import { clsx } from 'clsx';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetSettings, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'editor' | 'layout'>('appearance');

  if (!isOpen) return null;

  const tabs = [
    { id: 'appearance' as const, label: '外观', icon: '🎨' },
    { id: 'editor' as const, label: '编辑器', icon: '✏️' },
    { id: 'layout' as const, label: '布局', icon: '📐' },
  ];

  const themeOptions: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: '浅色', icon: '☀️' },
    { value: 'dark', label: '深色', icon: '🌙' },
    { value: 'system', label: '跟随系统', icon: '💻' },
  ];

  const fontSizeOptions: { value: FontSize; label: string }[] = [
    { value: 'small', label: '小' },
    { value: 'medium', label: '中' },
    { value: 'large', label: '大' },
    { value: 'extra-large', label: '特大' },
  ];

  const sidebarWidthOptions: { value: SidebarWidth; label: string }[] = [
    { value: 'narrow', label: '窄' },
    { value: 'normal', label: '正常' },
    { value: 'wide', label: '宽' },
  ];

  const editorWidthOptions: { value: EditorWidth; label: string }[] = [
    { value: 'narrow', label: '窄' },
    { value: 'normal', label: '正常' },
    { value: 'wide', label: '宽' },
    { value: 'full', label: '全宽' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-xl transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">设置</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'appearance' && (
            <>
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  主题
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateSettings({ theme: option.value })}
                      className={clsx(
                        'p-3 rounded-lg border-2 transition-colors text-center',
                        settings.theme === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {option.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  字体大小
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {fontSizeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateSettings({ fontSize: option.value })}
                      className={clsx(
                        'p-2 rounded-lg border transition-colors text-center',
                        settings.fontSize === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <div className="text-xs font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    紧凑模式
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    减少界面间距
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ compactMode: !settings.compactMode })}
                  className={clsx(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    settings.compactMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                >
                  <span
                    className={clsx(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      settings.compactMode ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    减少动画
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    减少界面动画效果
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
                  className={clsx(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    settings.reducedMotion ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                >
                  <span
                    className={clsx(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </>
          )}

          {activeTab === 'editor' && (
            <>
              {/* Show Line Numbers */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    显示行号
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    在编辑器中显示行号
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ showLineNumbers: !settings.showLineNumbers })}
                  className={clsx(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    settings.showLineNumbers ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                >
                  <span
                    className={clsx(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      settings.showLineNumbers ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Focus Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    专注模式
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    隐藏侧边栏，专注于写作
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ focusMode: !settings.focusMode })}
                  className={clsx(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    settings.focusMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                >
                  <span
                    className={clsx(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      settings.focusMode ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Editor Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  编辑器宽度
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {editorWidthOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateSettings({ editorWidth: option.value })}
                      className={clsx(
                        'p-2 rounded-lg border transition-colors text-center',
                        settings.editorWidth === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <div className="text-xs font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'layout' && (
            <>
              {/* Sidebar Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  侧边栏宽度
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {sidebarWidthOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateSettings({ sidebarWidth: option.value })}
                      className={clsx(
                        'p-2 rounded-lg border transition-colors text-center',
                        settings.sidebarWidth === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <div className="text-xs font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  布局预览
                </label>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex h-20 space-x-2">
                    {/* Sidebar preview */}
                    <div 
                      className={clsx(
                        'bg-blue-200 dark:bg-blue-800 rounded',
                        settings.sidebarWidth === 'narrow' && 'w-6',
                        settings.sidebarWidth === 'normal' && 'w-8',
                        settings.sidebarWidth === 'wide' && 'w-12'
                      )}
                    />
                    {/* Content preview */}
                    <div 
                      className={clsx(
                        'bg-gray-300 dark:bg-gray-600 rounded flex-1',
                        settings.editorWidth === 'narrow' && 'max-w-16',
                        settings.editorWidth === 'normal' && 'max-w-24',
                        settings.editorWidth === 'wide' && 'max-w-32',
                        settings.editorWidth === 'full' && 'max-w-none'
                      )}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={resetSettings}
              className="flex-1"
            >
              重置设置
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              完成
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
