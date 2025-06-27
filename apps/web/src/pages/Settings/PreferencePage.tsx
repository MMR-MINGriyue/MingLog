/**
 * Preference Settings Page
 * Comprehensive preference management interface
 */

import React from 'react';
import { ThemeProvider, useThemeClasses } from '@minglog/ui/theme';
import { PreferenceManager } from '@minglog/ui/components/PreferenceManager';
import { usePreferences } from '@minglog/ui/hooks/usePreferences';

const PreferencePageContent: React.FC = () => {
  const { bg, text, border } = useThemeClasses();
  const { preferences, isLoading, error } = usePreferences();

  return (
    <div className={`min-h-screen ${bg.primary}`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${text.primary}`}>
            偏好设置
          </h1>
          <p className={`text-lg mt-2 ${text.secondary}`}>
            管理应用程序的所有设置和偏好
          </p>
        </div>

        {/* Status Information */}
        {!isLoading && !error && preferences && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Settings Status */}
            <div className={`p-4 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`font-medium mb-2 ${text.primary}`}>设置状态</h3>
              <div className="space-y-1 text-sm">
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>版本:</span>
                  <span className={text.primary}>{preferences.version}</span>
                </div>
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>最后修改:</span>
                  <span className={text.primary}>
                    {new Date(preferences.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* App Settings */}
            <div className={`p-4 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`font-medium mb-2 ${text.primary}`}>应用设置</h3>
              <div className="space-y-1 text-sm">
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>自动保存:</span>
                  <span className={text.primary}>
                    {preferences.app.autoSave ? '开启' : '关闭'}
                  </span>
                </div>
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>语言:</span>
                  <span className={text.primary}>{preferences.app.language}</span>
                </div>
              </div>
            </div>

            {/* Editor Settings */}
            <div className={`p-4 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`font-medium mb-2 ${text.primary}`}>编辑器</h3>
              <div className="space-y-1 text-sm">
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>自动换行:</span>
                  <span className={text.primary}>
                    {preferences.editor.wordWrap ? '开启' : '关闭'}
                  </span>
                </div>
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>Tab大小:</span>
                  <span className={text.primary}>{preferences.editor.tabSize}</span>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className={`p-4 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`font-medium mb-2 ${text.primary}`}>隐私</h3>
              <div className="space-y-1 text-sm">
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>分析:</span>
                  <span className={text.primary}>
                    {preferences.privacy.enableAnalytics ? '开启' : '关闭'}
                  </span>
                </div>
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>崩溃报告:</span>
                  <span className={text.primary}>
                    {preferences.privacy.enableCrashReporting ? '开启' : '关闭'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Preference Manager */}
        <div className="mb-8">
          <PreferenceManager />
        </div>

        {/* Quick Actions */}
        <div className={`p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
          <h2 className={`text-xl font-semibold mb-4 ${text.primary}`}>
            快速操作
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export Settings */}
            <div className={`p-4 border ${border.primary} rounded-lg hover:${bg.tertiary} transition-colors`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📤</span>
                <h3 className={`font-medium ${text.primary}`}>导出设置</h3>
              </div>
              <p className={`text-sm ${text.secondary} mb-3`}>
                将当前设置导出为JSON文件，便于备份或迁移
              </p>
              <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                导出设置
              </button>
            </div>

            {/* Import Settings */}
            <div className={`p-4 border ${border.primary} rounded-lg hover:${bg.tertiary} transition-colors`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📥</span>
                <h3 className={`font-medium ${text.primary}`}>导入设置</h3>
              </div>
              <p className={`text-sm ${text.secondary} mb-3`}>
                从JSON文件导入设置，快速恢复配置
              </p>
              <button className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                选择文件
              </button>
            </div>

            {/* Reset Settings */}
            <div className={`p-4 border ${border.primary} rounded-lg hover:${bg.tertiary} transition-colors`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🔄</span>
                <h3 className={`font-medium ${text.primary}`}>重置设置</h3>
              </div>
              <p className={`text-sm ${text.secondary} mb-3`}>
                将所有设置恢复为默认值
              </p>
              <button className="w-full px-3 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                重置所有
              </button>
            </div>
          </div>
        </div>

        {/* Settings Categories Overview */}
        <div className={`p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
          <h2 className={`text-xl font-semibold mb-6 ${text.primary}`}>
            设置分类概览
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* General Settings */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <h3 className={`font-medium ${text.primary}`}>常规设置</h3>
              </div>
              <ul className={`space-y-1 text-sm ${text.secondary}`}>
                <li>• 自动保存配置</li>
                <li>• 语言和地区</li>
                <li>• 窗口状态</li>
                <li>• 备份设置</li>
              </ul>
            </div>

            {/* Editor Settings */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <h3 className={`font-medium ${text.primary}`}>编辑器设置</h3>
              </div>
              <ul className={`space-y-1 text-sm ${text.secondary}`}>
                <li>• 编辑器外观</li>
                <li>• 缩进和格式</li>
                <li>• Markdown支持</li>
                <li>• 代码高亮</li>
              </ul>
            </div>

            {/* Search Settings */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔍</span>
                <h3 className={`font-medium ${text.primary}`}>搜索设置</h3>
              </div>
              <ul className={`space-y-1 text-sm ${text.secondary}`}>
                <li>• 搜索行为</li>
                <li>• 搜索范围</li>
                <li>• 搜索历史</li>
                <li>• 高级选项</li>
              </ul>
            </div>

            {/* Export Settings */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📤</span>
                <h3 className={`font-medium ${text.primary}`}>导出设置</h3>
              </div>
              <ul className={`space-y-1 text-sm ${text.secondary}`}>
                <li>• 默认格式</li>
                <li>• PDF配置</li>
                <li>• HTML选项</li>
                <li>• 导出路径</li>
              </ul>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔒</span>
                <h3 className={`font-medium ${text.primary}`}>隐私设置</h3>
              </div>
              <ul className={`space-y-1 text-sm ${text.secondary}`}>
                <li>• 数据收集</li>
                <li>• 分析统计</li>
                <li>• 安全选项</li>
                <li>• 加密设置</li>
              </ul>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔧</span>
                <h3 className={`font-medium ${text.primary}`}>高级设置</h3>
              </div>
              <ul className={`space-y-1 text-sm ${text.secondary}`}>
                <li>• 重置选项</li>
                <li>• 导入导出</li>
                <li>• 调试信息</li>
                <li>• 开发者选项</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tips and Help */}
        <div className={`mt-8 p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
          <h2 className={`text-xl font-semibold mb-4 ${text.primary}`}>
            💡 使用技巧
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className={`font-medium mb-2 ${text.primary}`}>设置管理</h3>
              <ul className={`space-y-1 text-sm ${text.secondary}`}>
                <li>• 设置会自动保存，无需手动保存</li>
                <li>• 可以导出设置文件进行备份</li>
                <li>• 重置功能可以按分类或全部重置</li>
                <li>• 导入设置时会覆盖现有配置</li>
              </ul>
            </div>
            
            <div>
              <h3 className={`font-medium mb-2 ${text.primary}`}>最佳实践</h3>
              <ul className={`space-y-1 text-sm ${text.secondary}`}>
                <li>• 定期导出设置文件作为备份</li>
                <li>• 根据使用习惯调整编辑器设置</li>
                <li>• 合理配置隐私和安全选项</li>
                <li>• 使用搜索历史提高工作效率</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PreferencePage: React.FC = () => {
  return (
    <ThemeProvider defaultMode="system">
      <PreferencePageContent />
    </ThemeProvider>
  );
};

export default PreferencePage;
