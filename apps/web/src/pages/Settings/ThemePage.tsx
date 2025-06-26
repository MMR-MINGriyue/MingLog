/**
 * Theme Settings Page
 * Dedicated page for theme configuration
 */

import React from 'react';
import { 
  ThemeProvider, 
  useTheme,
  useThemeToggle,
  useThemeClasses 
} from '@minglog/ui/theme';
import { ThemeSettings } from '@minglog/ui/components/ThemeSettings';
import { 
  ThemeSettingsButton,
  QuickThemePanel,
  ThemeSettingsDropdown 
} from '@minglog/ui/components/ThemeSettingsButton';
import { ThemeToggle } from '@minglog/ui/components/ThemeToggle';

const ThemePageContent: React.FC = () => {
  const { theme, mode, preferences } = useTheme();
  const { bg, text, border } = useThemeClasses();

  return (
    <div className={`min-h-screen ${bg.primary}`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-3xl font-bold ${text.primary}`}>
                主题设置
              </h1>
              <p className={`text-lg mt-2 ${text.secondary}`}>
                自定义 MingLog 的外观和主题偏好
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle variant="button" size="lg" showLabel />
              <ThemeSettingsDropdown />
            </div>
          </div>
          
          {/* Breadcrumb */}
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <a href="#" className={`inline-flex items-center text-sm font-medium ${text.secondary} hover:${text.primary}`}>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  首页
                </a>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <a href="#" className={`ml-1 text-sm font-medium ${text.secondary} hover:${text.primary} md:ml-2`}>
                    设置
                  </a>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className={`ml-1 text-sm font-medium ${text.primary} md:ml-2`}>
                    主题
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            {/* Main Theme Settings */}
            <ThemeSettings />
          </div>
          
          <div className="space-y-6">
            {/* Quick Theme Panel */}
            <QuickThemePanel />
            
            {/* Theme Info Card */}
            <div className={`p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`text-lg font-semibold mb-4 ${text.primary}`}>
                当前主题信息
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${text.secondary}`}>主题模式</span>
                  <span className={`text-sm font-medium ${text.primary}`}>
                    {mode === 'light' ? '浅色' : mode === 'dark' ? '深色' : '跟随系统'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${text.secondary}`}>字体大小</span>
                  <span className={`text-sm font-medium ${text.primary}`}>
                    {preferences.fontSize}px
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${text.secondary}`}>减少动画</span>
                  <span className={`text-sm font-medium ${text.primary}`}>
                    {preferences.reducedMotion ? '是' : '否'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${text.secondary}`}>高对比度</span>
                  <span className={`text-sm font-medium ${text.primary}`}>
                    {preferences.highContrast ? '是' : '否'}
                  </span>
                </div>
              </div>
              
              {/* Color Swatches */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className={`text-sm font-medium mb-3 ${text.primary}`}>
                  主题色彩
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div 
                      className="w-8 h-8 rounded-full mx-auto mb-1 border border-gray-200 dark:border-gray-600"
                      style={{ backgroundColor: theme.colors.interactive.primary }}
                    ></div>
                    <span className={`text-xs ${text.secondary}`}>主色</span>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-8 h-8 rounded-full mx-auto mb-1 border border-gray-200 dark:border-gray-600"
                      style={{ backgroundColor: theme.colors.background.primary }}
                    ></div>
                    <span className={`text-xs ${text.secondary}`}>背景</span>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-8 h-8 rounded-full mx-auto mb-1 border border-gray-200 dark:border-gray-600"
                      style={{ backgroundColor: theme.colors.text.primary }}
                    ></div>
                    <span className={`text-xs ${text.secondary}`}>文本</span>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-8 h-8 rounded-full mx-auto mb-1 border border-gray-200 dark:border-gray-600"
                      style={{ backgroundColor: theme.colors.status.success }}
                    ></div>
                    <span className={`text-xs ${text.secondary}`}>成功</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tips Card */}
            <div className={`p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`text-lg font-semibold mb-4 ${text.primary}`}>
                💡 使用技巧
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className={text.secondary}>
                  <strong className={text.primary}>快捷键:</strong> 使用 Ctrl/Cmd + Shift + T 快速切换主题
                </div>
                <div className={text.secondary}>
                  <strong className={text.primary}>自动切换:</strong> 选择"跟随系统"可根据系统设置自动切换
                </div>
                <div className={text.secondary}>
                  <strong className={text.primary}>护眼模式:</strong> 深色主题在夜间使用更护眼
                </div>
                <div className={text.secondary}>
                  <strong className={text.primary}>无障碍:</strong> 启用高对比度模式提高可读性
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Examples */}
        <div className={`p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
          <h2 className={`text-xl font-semibold mb-6 ${text.primary}`}>
            主题效果预览
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Example Card 1 */}
            <div className={`p-4 rounded-lg border ${border.primary} ${bg.primary} shadow-sm`}>
              <h3 className={`font-semibold mb-2 ${text.primary}`}>
                示例卡片
              </h3>
              <p className={`text-sm mb-3 ${text.secondary}`}>
                这是一个示例卡片，展示当前主题下的外观效果。
              </p>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                操作按钮
              </button>
            </div>
            
            {/* Example Card 2 */}
            <div className={`p-4 rounded-lg border ${border.primary} ${bg.primary} shadow-sm`}>
              <h3 className={`font-semibold mb-2 ${text.primary}`}>
                表单示例
              </h3>
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="输入框示例"
                  className={`w-full px-3 py-2 border ${border.primary} rounded ${bg.primary} ${text.primary} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <select className={`w-full px-3 py-2 border ${border.primary} rounded ${bg.primary} ${text.primary} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                  <option>选择选项</option>
                  <option>选项 1</option>
                  <option>选项 2</option>
                </select>
              </div>
            </div>
            
            {/* Example Card 3 */}
            <div className={`p-4 rounded-lg border ${border.primary} ${bg.primary} shadow-sm`}>
              <h3 className={`font-semibold mb-2 ${text.primary}`}>
                状态指示
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className={text.secondary}>成功状态</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className={text.secondary}>警告状态</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className={text.secondary}>错误状态</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ThemePage: React.FC = () => {
  return (
    <ThemeProvider defaultMode="system">
      <ThemePageContent />
    </ThemeProvider>
  );
};

export default ThemePage;
