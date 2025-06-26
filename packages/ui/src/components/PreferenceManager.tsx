/**
 * Preference Manager Component
 * Comprehensive settings management interface
 */

import React, { useState, useRef } from 'react';
import { usePreferences } from '../hooks/usePreferences';
import { PreferenceCategory } from '../types/preferences';

interface PreferenceManagerProps {
  className?: string;
  onClose?: () => void;
}

export const PreferenceManager: React.FC<PreferenceManagerProps> = ({
  className = '',
  onClose,
}) => {
  const {
    preferences,
    isLoading,
    error,
    app,
    editor,
    search,
    privacy,
    updateApp,
    updateEditor,
    updateSearch,
    updatePrivacy,
    resetCategory,
    resetAll,
    exportPreferences,
    importPreferences,
  } = usePreferences();

  const [activeTab, setActiveTab] = useState<'general' | 'editor' | 'search' | 'export' | 'privacy' | 'advanced'>('general');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [showResetDialog, setShowResetDialog] = useState<PreferenceCategory | 'all' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'general' as const, label: '常规', icon: '⚙️' },
    { id: 'editor' as const, label: '编辑器', icon: '📝' },
    { id: 'search' as const, label: '搜索', icon: '🔍' },
    { id: 'export' as const, label: '导出', icon: '📤' },
    { id: 'privacy' as const, label: '隐私', icon: '🔒' },
    { id: 'advanced' as const, label: '高级', icon: '🔧' },
  ];

  const handleExport = async () => {
    try {
      const data = await exportPreferences();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `minglog-preferences-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export preferences:', error);
    }
  };

  const handleImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
        setShowImportDialog(true);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    try {
      await importPreferences(importData);
      setShowImportDialog(false);
      setImportData('');
    } catch (error) {
      console.error('Failed to import preferences:', error);
    }
  };

  const handleReset = async (category: PreferenceCategory | 'all') => {
    try {
      if (category === 'all') {
        await resetAll();
      } else {
        await resetCategory(category);
      }
      setShowResetDialog(null);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">加载设置中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 dark:text-red-400 mb-4">
          加载设置失败: {error.message}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          偏好设置
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            导出
          </button>
          <button
            onClick={handleImportFile}
            className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            导入
          </button>
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
        {activeTab === 'general' && app && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                常规设置
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      自动保存
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      自动保存文档更改
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={app.autoSave}
                    onChange={(e) => updateApp({ autoSave: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      自动保存间隔
                    </label>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {app.autoSaveInterval}秒
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="300"
                    step="5"
                    value={app.autoSaveInterval}
                    onChange={(e) => updateApp({ autoSaveInterval: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      关闭前确认
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      关闭应用前显示确认对话框
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={app.confirmBeforeClose}
                    onChange={(e) => updateApp({ confirmBeforeClose: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      显示欢迎屏幕
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      启动时显示欢迎屏幕
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={app.showWelcomeScreen}
                    onChange={(e) => updateApp({ showWelcomeScreen: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      最近文件数量
                    </label>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {app.maxRecentFiles}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={app.maxRecentFiles}
                    onChange={(e) => updateApp({ maxRecentFiles: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                备份设置
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      启用自动备份
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      定期备份您的文档
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={app.enableBackup}
                    onChange={(e) => updateApp({ enableBackup: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                {app.enableBackup && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          备份间隔
                        </label>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {app.backupInterval}小时
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="168"
                        step="1"
                        value={app.backupInterval}
                        onChange={(e) => updateApp({ backupInterval: Number(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          最大备份文件数
                        </label>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {app.maxBackupFiles}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        value={app.maxBackupFiles}
                        onChange={(e) => updateApp({ maxBackupFiles: Number(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'editor' && editor && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                编辑器设置
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      自动换行
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      长行自动换行显示
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editor.wordWrap}
                    onChange={(e) => updateEditor({ wordWrap: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      显示行号
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      在编辑器左侧显示行号
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editor.showLineNumbers}
                    onChange={(e) => updateEditor({ showLineNumbers: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      显示小地图
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      显示文档结构小地图
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editor.showMinimap}
                    onChange={(e) => updateEditor({ showMinimap: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tab 大小
                    </label>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {editor.tabSize}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    step="1"
                    value={editor.tabSize}
                    onChange={(e) => updateEditor({ tabSize: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      使用空格缩进
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      使用空格代替Tab字符
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editor.insertSpaces}
                    onChange={(e) => updateEditor({ insertSpaces: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Markdown 设置
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      实时预览
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      编辑时实时显示预览
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editor.livePreview}
                    onChange={(e) => updateEditor({ livePreview: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      数学公式支持
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      支持 LaTeX 数学公式渲染
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editor.mathSupport}
                    onChange={(e) => updateEditor({ mathSupport: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mermaid 图表支持
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      支持 Mermaid 图表渲染
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editor.mermaidSupport}
                    onChange={(e) => updateEditor({ mermaidSupport: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'search' && search && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                搜索行为
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      区分大小写
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      搜索时区分字母大小写
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={search.caseSensitive}
                    onChange={(e) => updateSearch({ caseSensitive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      全词匹配
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      只匹配完整的单词
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={search.wholeWord}
                    onChange={(e) => updateSearch({ wholeWord: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      正则表达式
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      启用正则表达式搜索
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={search.useRegex}
                    onChange={(e) => updateSearch({ useRegex: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      搜索历史数量
                    </label>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {search.maxSearchHistory}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={search.maxSearchHistory}
                    onChange={(e) => updateSearch({ maxSearchHistory: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && privacy && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                数据收集
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      启用分析
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      收集匿名使用数据以改进产品
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.enableAnalytics}
                    onChange={(e) => updatePrivacy({ enableAnalytics: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      崩溃报告
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      自动发送崩溃报告
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.enableCrashReporting}
                    onChange={(e) => updatePrivacy({ enableCrashReporting: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                安全设置
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      非活动后锁定
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      一段时间无操作后自动锁定
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.lockAfterInactivity}
                    onChange={(e) => updatePrivacy({ lockAfterInactivity: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                {privacy.lockAfterInactivity && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        锁定超时
                      </label>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {privacy.inactivityTimeout}分钟
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      step="5"
                      value={privacy.inactivityTimeout}
                      onChange={(e) => updatePrivacy({ inactivityTimeout: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                高级选项
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      重置所有设置
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      将所有设置恢复为默认值
                    </p>
                  </div>
                  <button
                    onClick={() => setShowResetDialog('all')}
                    className="px-3 py-1 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    重置
                  </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    分类重置
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'app' as const, label: '常规设置' },
                      { key: 'editor' as const, label: '编辑器' },
                      { key: 'search' as const, label: '搜索' },
                      { key: 'privacy' as const, label: '隐私' },
                    ].map((category) => (
                      <button
                        key={category.key}
                        onClick={() => setShowResetDialog(category.key)}
                        className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        重置{category.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                设置信息
              </h3>

              {preferences && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">版本:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">{preferences.version}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">设备ID:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400 font-mono text-xs">
                        {preferences.deviceId}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">最后修改:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {new Date(preferences.lastModified).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowImportDialog(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  导入设置
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  确认要导入这些设置吗？这将覆盖当前的所有设置。
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleImport}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    确认导入
                  </button>
                  <button
                    onClick={() => setShowImportDialog(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowResetDialog(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  确认重置
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  确认要重置{showResetDialog === 'all' ? '所有设置' : '选定的设置'}吗？此操作无法撤销。
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReset(showResetDialog)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    确认重置
                  </button>
                  <button
                    onClick={() => setShowResetDialog(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};