/**
 * Theme Demo Page
 * Demonstrates the theme system functionality
 */

import React from 'react';
import { 
  ThemeProvider, 
  useTheme, 
  useThemeToggle,
  useThemeClasses 
} from '@minglog/ui/theme';
import { 
  ThemeToggle, 
  ThemeSelector 
} from '@minglog/ui/components/ThemeToggle';
import { 
  ThemePreview, 
  ThemeGallery, 
  CompactThemeSwitcher,
  ThemeStatus 
} from '@minglog/ui/components/ThemePreview';

const ThemeDemoContent: React.FC = () => {
  const { theme, mode, preferences } = useTheme();
  const { toggleTheme, cycleTheme, effectiveTheme } = useThemeToggle();
  const { bg, text, border } = useThemeClasses();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${bg.primary}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className={`text-3xl font-bold ${text.primary}`}>
              MingLog 主题系统演示
            </h1>
            <div className="flex items-center gap-4">
              <ThemeStatus />
              <ThemeToggle variant="button" showLabel />
            </div>
          </div>
          <p className={`text-lg ${text.secondary}`}>
            体验 MingLog 的主题切换功能，支持浅色、深色和跟随系统主题。
          </p>
        </header>

        {/* Theme Controls Section */}
        <section className={`mb-8 p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
          <h2 className={`text-xl font-semibold mb-4 ${text.primary}`}>
            主题控制
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Button Toggle */}
            <div>
              <h3 className={`text-sm font-medium mb-2 ${text.secondary}`}>
                按钮切换
              </h3>
              <div className="space-y-2">
                <ThemeToggle variant="button" size="sm" showLabel />
                <ThemeToggle variant="button" size="md" showLabel />
                <ThemeToggle variant="button" size="lg" showLabel />
              </div>
            </div>

            {/* Dropdown Toggle */}
            <div>
              <h3 className={`text-sm font-medium mb-2 ${text.secondary}`}>
                下拉选择
              </h3>
              <ThemeToggle variant="dropdown" />
            </div>

            {/* Segmented Control */}
            <div>
              <h3 className={`text-sm font-medium mb-2 ${text.secondary}`}>
                分段控制
              </h3>
              <ThemeSelector />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={toggleTheme}
              className={`
                px-4 py-2 rounded-md font-medium transition-colors
                bg-blue-600 hover:bg-blue-700 text-white
              `}
            >
              切换主题
            </button>
            <button
              onClick={cycleTheme}
              className={`
                px-4 py-2 rounded-md font-medium transition-colors border
                ${border.primary} ${text.primary} hover:${bg.tertiary}
              `}
            >
              循环主题
            </button>
          </div>
        </section>

        {/* Theme Gallery */}
        <section className={`mb-8 p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
          <h2 className={`text-xl font-semibold mb-4 ${text.primary}`}>
            主题预览
          </h2>
          <ThemeGallery
            selectedTheme={mode}
            onThemeSelect={(theme) => {
              // This would normally use the theme context
              console.log('Selected theme:', theme);
            }}
          />
        </section>

        {/* Current Theme Info */}
        <section className={`mb-8 p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
          <h2 className={`text-xl font-semibold mb-4 ${text.primary}`}>
            当前主题信息
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className={`text-sm font-medium mb-2 ${text.secondary}`}>
                主题设置
              </h3>
              <div className="space-y-2 text-sm">
                <div className={text.primary}>
                  <span className="font-medium">模式:</span> {mode}
                </div>
                <div className={text.primary}>
                  <span className="font-medium">有效主题:</span> {effectiveTheme}
                </div>
                <div className={text.primary}>
                  <span className="font-medium">字体大小:</span> {preferences.fontSize}px
                </div>
                <div className={text.primary}>
                  <span className="font-medium">减少动画:</span> {preferences.reducedMotion ? '是' : '否'}
                </div>
                <div className={text.primary}>
                  <span className="font-medium">高对比度:</span> {preferences.highContrast ? '是' : '否'}
                </div>
              </div>
            </div>

            <div>
              <h3 className={`text-sm font-medium mb-2 ${text.secondary}`}>
                主题颜色
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: theme.colors.background.primary }}
                  ></div>
                  <span className={`text-xs ${text.primary}`}>背景</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: theme.colors.text.primary }}
                  ></div>
                  <span className={`text-xs ${text.primary}`}>文本</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: theme.colors.interactive.primary }}
                  ></div>
                  <span className={`text-xs ${text.primary}`}>主色</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: theme.colors.border.primary }}
                  ></div>
                  <span className={`text-xs ${text.primary}`}>边框</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Component Examples */}
        <section className={`mb-8 p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
          <h2 className={`text-xl font-semibold mb-4 ${text.primary}`}>
            组件示例
          </h2>
          
          <div className="space-y-6">
            {/* Buttons */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${text.secondary}`}>
                按钮
              </h3>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
                  主要按钮
                </button>
                <button className={`px-4 py-2 border ${border.primary} ${text.primary} hover:${bg.tertiary} rounded-md font-medium transition-colors`}>
                  次要按钮
                </button>
                <button className={`px-4 py-2 ${text.primary} hover:${bg.tertiary} rounded-md font-medium transition-colors`}>
                  文本按钮
                </button>
              </div>
            </div>

            {/* Cards */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${text.secondary}`}>
                卡片
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`p-4 rounded-lg border ${border.primary} ${bg.primary} shadow-sm`}>
                    <h4 className={`font-medium mb-2 ${text.primary}`}>
                      卡片标题 {i}
                    </h4>
                    <p className={`text-sm ${text.secondary}`}>
                      这是一个示例卡片，展示在不同主题下的外观效果。
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Elements */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${text.secondary}`}>
                表单元素
              </h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${text.primary}`}>
                    文本输入
                  </label>
                  <input
                    type="text"
                    placeholder="请输入内容..."
                    className={`
                      w-full px-3 py-2 border ${border.primary} rounded-md
                      ${bg.primary} ${text.primary}
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    `}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${text.primary}`}>
                    选择框
                  </label>
                  <select className={`
                    w-full px-3 py-2 border ${border.primary} rounded-md
                    ${bg.primary} ${text.primary}
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  `}>
                    <option>选项 1</option>
                    <option>选项 2</option>
                    <option>选项 3</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compact Switcher */}
        <section className={`p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
          <h2 className={`text-xl font-semibold mb-4 ${text.primary}`}>
            紧凑型切换器
          </h2>
          <CompactThemeSwitcher />
        </section>
      </div>
    </div>
  );
};

const ThemeDemo: React.FC = () => {
  return (
    <ThemeProvider defaultMode="system">
      <ThemeDemoContent />
    </ThemeProvider>
  );
};

export default ThemeDemo;
