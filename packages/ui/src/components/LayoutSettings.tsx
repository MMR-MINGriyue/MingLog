/**
 * Layout Settings Component
 * Provides controls for customizing the application layout
 */

import React, { useState } from 'react';
import { useLayout } from '../layout/LayoutProvider';
import { LayoutPreset } from '../types/layout';

interface LayoutSettingsProps {
  className?: string;
  onClose?: () => void;
}

// Layout Settings Modal
interface LayoutSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LayoutSettingsModal: React.FC<LayoutSettingsModalProps> = ({
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
          <LayoutSettings onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export const LayoutSettings: React.FC<LayoutSettingsProps> = ({
  className = '',
  onClose,
}) => {
  const {
    config,
    presets,
    updateSidebar,
    updatePanel,
    updateToolbar,
    updateEditor,
    updateConfig,
    applyPreset,
    resetToDefault,
    saveAsPreset,
    deletePreset,
  } = useLayout();

  const [activeTab, setActiveTab] = useState<'presets' | 'sidebar' | 'panel' | 'toolbar' | 'editor'>('presets');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  const tabs = [
    { id: 'presets' as const, label: '预设', icon: '🎨' },
    { id: 'sidebar' as const, label: '侧边栏', icon: '📋' },
    { id: 'panel' as const, label: '面板', icon: '🔧' },
    { id: 'toolbar' as const, label: '工具栏', icon: '🛠️' },
    { id: 'editor' as const, label: '编辑器', icon: '📝' },
  ];

  const handleSavePreset = () => {
    if (presetName.trim()) {
      saveAsPreset(presetName.trim(), presetDescription.trim());
      setShowSavePreset(false);
      setPresetName('');
      setPresetDescription('');
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          布局设置
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
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
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
        {activeTab === 'presets' && (
          <div className="space-y-6">
            {/* Layout Presets */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                布局预设
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                    onClick={() => applyPreset(preset)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{preset.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {preset.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {preset.description}
                        </p>
                      </div>
                      {!preset.id.startsWith('custom-') && preset.id !== 'default' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePreset(preset.id);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Current Layout */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  保存当前布局
                </h3>
                <button
                  onClick={() => setShowSavePreset(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  保存为预设
                </button>
              </div>

              {showSavePreset && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        预设名称
                      </label>
                      <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="输入预设名称..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        描述 (可选)
                      </label>
                      <textarea
                        value={presetDescription}
                        onChange={(e) => setPresetDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="描述这个布局的特点..."
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSavePreset}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setShowSavePreset(false)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sidebar' && (
          <div className="space-y-6">
            {/* Sidebar Position */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                侧边栏位置
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => updateSidebar({ position: 'left' })}
                  className={`
                    px-4 py-2 rounded-md border transition-colors
                    ${config.sidebar.position === 'left'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  左侧
                </button>
                <button
                  onClick={() => updateSidebar({ position: 'right' })}
                  className={`
                    px-4 py-2 rounded-md border transition-colors
                    ${config.sidebar.position === 'right'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  右侧
                </button>
              </div>
            </div>

            {/* Sidebar Width */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  侧边栏宽度
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {config.sidebar.width}px
                </span>
              </div>
              <input
                type="range"
                min={config.sidebar.minWidth}
                max={config.sidebar.maxWidth}
                step="10"
                value={config.sidebar.width}
                onChange={(e) => updateSidebar({ width: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{config.sidebar.minWidth}px</span>
                <span>{config.sidebar.maxWidth}px</span>
              </div>
            </div>

            {/* Sidebar Options */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                侧边栏选项
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.sidebar.isResizable}
                    onChange={(e) => updateSidebar({ isResizable: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">允许调整大小</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.sidebar.showToggleButton}
                    onChange={(e) => updateSidebar({ showToggleButton: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">显示折叠按钮</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'panel' && (
          <div className="space-y-6">
            {/* Panel Position */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                面板位置
              </h3>
              <div className="flex gap-3">
                {['bottom', 'right', 'floating'].map((position) => (
                  <button
                    key={position}
                    onClick={() => updatePanel({ position: position as any })}
                    className={`
                      px-4 py-2 rounded-md border transition-colors
                      ${config.panel.position === position
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    {position === 'bottom' ? '底部' : position === 'right' ? '右侧' : '浮动'}
                  </button>
                ))}
              </div>
            </div>

            {/* Panel Size */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  面板尺寸
                </h3>
              </div>
              
              {config.panel.position === 'right' ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      宽度
                    </label>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {config.panel.width}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={config.panel.minWidth}
                    max={config.panel.maxWidth}
                    step="10"
                    value={config.panel.width}
                    onChange={(e) => updatePanel({ width: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      高度
                    </label>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {config.panel.height}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={config.panel.minHeight}
                    max={config.panel.maxHeight}
                    step="10"
                    value={config.panel.height}
                    onChange={(e) => updatePanel({ height: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
              )}
            </div>

            {/* Panel Visibility */}
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.panel.isVisible}
                  onChange={(e) => updatePanel({ isVisible: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">显示面板</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'toolbar' && (
          <div className="space-y-6">
            {/* Toolbar Position */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                工具栏位置
              </h3>
              <div className="flex gap-3">
                {['top', 'bottom', 'hidden'].map((position) => (
                  <button
                    key={position}
                    onClick={() => updateToolbar({ position: position as any })}
                    className={`
                      px-4 py-2 rounded-md border transition-colors
                      ${config.toolbar.position === position
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    {position === 'top' ? '顶部' : position === 'bottom' ? '底部' : '隐藏'}
                  </button>
                ))}
              </div>
            </div>

            {/* Toolbar Height */}
            {config.toolbar.position !== 'hidden' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    工具栏高度
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {config.toolbar.height}px
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="80"
                  step="5"
                  value={config.toolbar.height}
                  onChange={(e) => updateToolbar({ height: Number(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
            )}

            {/* Toolbar Options */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                工具栏选项
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.toolbar.showLabels}
                    onChange={(e) => updateToolbar({ showLabels: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">显示按钮标签</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.toolbar.compactMode}
                    onChange={(e) => updateToolbar({ compactMode: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">紧凑模式</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="space-y-6">
            {/* View Mode */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                视图模式
              </h3>
              <div className="flex gap-3">
                {['editor', 'preview', 'split'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateEditor({ viewMode: mode as any })}
                    className={`
                      px-4 py-2 rounded-md border transition-colors
                      ${config.editor.viewMode === mode
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    {mode === 'editor' ? '编辑' : mode === 'preview' ? '预览' : '分屏'}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Options */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                编辑器选项
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.editor.showLineNumbers}
                    onChange={(e) => updateEditor({ showLineNumbers: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">显示行号</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.editor.showMinimap}
                    onChange={(e) => updateEditor({ showMinimap: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">显示小地图</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.editor.wordWrap}
                    onChange={(e) => updateEditor({ wordWrap: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">自动换行</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.editor.renderWhitespace}
                    onChange={(e) => updateEditor({ renderWhitespace: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">显示空白字符</span>
                </label>
              </div>
            </div>

            {/* Tab Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                缩进设置
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tab 大小
                    </label>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {config.editor.tabSize}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    step="1"
                    value={config.editor.tabSize}
                    onChange={(e) => updateEditor({ tabSize: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.editor.insertSpaces}
                    onChange={(e) => updateEditor({ insertSpaces: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">使用空格代替 Tab</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={resetToDefault}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          恢复默认布局
        </button>
        <div className="flex gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
