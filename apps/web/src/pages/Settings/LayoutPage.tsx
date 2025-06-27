/**
 * Layout Settings Page
 * Dedicated page for layout configuration and preview
 */

import React from 'react';
import { LayoutProvider, useLayout, useLayoutStyles, useResponsiveLayout } from '@minglog/ui/layout/LayoutProvider';
import { LayoutSettings } from '@minglog/ui/components/LayoutSettings';
import { LayoutControls, LayoutStatus } from '@minglog/ui/components/LayoutControls';
import { ThemeProvider, useThemeClasses } from '@minglog/ui/theme';

const LayoutPageContent: React.FC = () => {
  const { bg, text, border } = useThemeClasses();
  const { config, presets } = useLayout();
  const layoutStyles = useLayoutStyles();
  const { screenSize, isMobile, isTablet, isDesktop, contentArea } = useResponsiveLayout();

  return (
    <div className={`min-h-screen ${bg.primary}`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-3xl font-bold ${text.primary}`}>
                界面布局设置
              </h1>
              <p className={`text-lg mt-2 ${text.secondary}`}>
                自定义应用界面布局，优化工作流程
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LayoutStatus showDetails />
              <LayoutControls variant="toolbar" showLabels />
            </div>
          </div>
          
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* 屏幕信息 */}
            <div className={`p-4 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`font-medium mb-2 ${text.primary}`}>屏幕信息</h3>
              <div className="space-y-1 text-sm">
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>尺寸:</span>
                  <span className={text.primary}>{screenSize.width}×{screenSize.height}</span>
                </div>
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>类型:</span>
                  <span className={text.primary}>
                    {isMobile ? '手机' : isTablet ? '平板' : '桌面'}
                  </span>
                </div>
              </div>
            </div>

            {/* 内容区域 */}
            <div className={`p-4 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`font-medium mb-2 ${text.primary}`}>内容区域</h3>
              <div className="space-y-1 text-sm">
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>宽度:</span>
                  <span className={text.primary}>{contentArea.width}px</span>
                </div>
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>高度:</span>
                  <span className={text.primary}>{contentArea.height}px</span>
                </div>
              </div>
            </div>

            {/* 侧边栏状态 */}
            <div className={`p-4 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`font-medium mb-2 ${text.primary}`}>侧边栏</h3>
              <div className="space-y-1 text-sm">
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>位置:</span>
                  <span className={text.primary}>
                    {config.sidebar.position === 'left' ? '左侧' : '右侧'}
                  </span>
                </div>
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>状态:</span>
                  <span className={text.primary}>
                    {config.sidebar.isCollapsed ? '折叠' : '展开'}
                  </span>
                </div>
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>宽度:</span>
                  <span className={text.primary}>{config.sidebar.width}px</span>
                </div>
              </div>
            </div>

            {/* 面板状态 */}
            <div className={`p-4 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`font-medium mb-2 ${text.primary}`}>面板</h3>
              <div className="space-y-1 text-sm">
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>位置:</span>
                  <span className={text.primary}>
                    {config.panel.position === 'bottom' ? '底部' : 
                     config.panel.position === 'right' ? '右侧' : '浮动'}
                  </span>
                </div>
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>状态:</span>
                  <span className={text.primary}>
                    {config.panel.isVisible ? '显示' : '隐藏'}
                  </span>
                </div>
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>尺寸:</span>
                  <span className={text.primary}>
                    {config.panel.position === 'right' 
                      ? `${config.panel.width}px` 
                      : `${config.panel.height}px`
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要设置面板 */}
          <div className="lg:col-span-2">
            <LayoutSettings />
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 快速控制 */}
            <div className={`p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`text-lg font-semibold mb-4 ${text.primary}`}>
                快速控制
              </h3>
              <LayoutControls variant="dropdown" showLabels />
            </div>

            {/* 预设预览 */}
            <div className={`p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`text-lg font-semibold mb-4 ${text.primary}`}>
                布局预设
              </h3>
              <div className="space-y-3">
                {presets.slice(0, 4).map((preset) => (
                  <div
                    key={preset.id}
                    className={`p-3 rounded-lg border ${border.primary} hover:${bg.tertiary} transition-colors cursor-pointer`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{preset.icon}</span>
                      <div className="flex-1">
                        <h4 className={`font-medium ${text.primary}`}>
                          {preset.name}
                        </h4>
                        <p className={`text-sm ${text.secondary}`}>
                          {preset.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 使用技巧 */}
            <div className={`p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`text-lg font-semibold mb-4 ${text.primary}`}>
                💡 使用技巧
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className={text.secondary}>
                  <strong className={text.primary}>快捷键:</strong> 使用 Ctrl/Cmd + B 切换侧边栏
                </div>
                <div className={text.secondary}>
                  <strong className={text.primary}>响应式:</strong> 小屏幕会自动调整布局
                </div>
                <div className={text.secondary}>
                  <strong className={text.primary}>专注模式:</strong> 隐藏所有辅助面板，专注内容
                </div>
                <div className={text.secondary}>
                  <strong className={text.primary}>自定义预设:</strong> 保存常用布局配置
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 布局预览区 */}
        <div className={`mt-8 p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
          <h2 className={`text-xl font-semibold mb-6 ${text.primary}`}>
            布局预览
          </h2>
          
          {/* 模拟布局 */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-64 relative overflow-hidden">
            {/* 工具栏 */}
            {config.toolbar.isVisible && (
              <div 
                className={`absolute ${config.toolbar.position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 flex items-center px-4`}
                style={{ height: `${config.toolbar.height}px` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded"></div>
                  <div className="w-6 h-6 bg-green-500 rounded"></div>
                  <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                </div>
                <div className={`ml-4 text-sm ${text.secondary}`}>工具栏</div>
              </div>
            )}

            {/* 主要内容区域 */}
            <div 
              className="flex h-full"
              style={{ 
                marginTop: config.toolbar.isVisible && config.toolbar.position === 'top' ? `${config.toolbar.height}px` : '0',
                marginBottom: config.toolbar.isVisible && config.toolbar.position === 'bottom' ? `${config.toolbar.height}px` : '0',
              }}
            >
              {/* 左侧边栏 */}
              {config.sidebar.position === 'left' && !config.sidebar.isCollapsed && (
                <div 
                  className="bg-gray-300 dark:bg-gray-600 border-r border-gray-400 dark:border-gray-500 flex items-center justify-center"
                  style={{ width: `${Math.min(config.sidebar.width / 4, 80)}px` }}
                >
                  <span className={`text-xs ${text.secondary}`}>侧边栏</span>
                </div>
              )}

              {/* 主内容 */}
              <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-lg font-medium ${text.primary}`}>主内容区域</div>
                  <div className={`text-sm ${text.secondary}`}>
                    {config.editor.viewMode === 'editor' ? '编辑器' : 
                     config.editor.viewMode === 'preview' ? '预览' : '分屏'}
                  </div>
                </div>
              </div>

              {/* 右侧边栏 */}
              {config.sidebar.position === 'right' && !config.sidebar.isCollapsed && (
                <div 
                  className="bg-gray-300 dark:bg-gray-600 border-l border-gray-400 dark:border-gray-500 flex items-center justify-center"
                  style={{ width: `${Math.min(config.sidebar.width / 4, 80)}px` }}
                >
                  <span className={`text-xs ${text.secondary}`}>侧边栏</span>
                </div>
              )}

              {/* 右侧面板 */}
              {config.panel.isVisible && config.panel.position === 'right' && (
                <div 
                  className="bg-gray-200 dark:bg-gray-700 border-l border-gray-300 dark:border-gray-600 flex items-center justify-center"
                  style={{ width: `${Math.min(config.panel.width / 4, 60)}px` }}
                >
                  <span className={`text-xs ${text.secondary}`}>面板</span>
                </div>
              )}
            </div>

            {/* 底部面板 */}
            {config.panel.isVisible && config.panel.position === 'bottom' && (
              <div 
                className="absolute bottom-0 left-0 right-0 bg-gray-200 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600 flex items-center justify-center"
                style={{ 
                  height: `${Math.min(config.panel.height / 2, 40)}px`,
                  marginBottom: config.toolbar.isVisible && config.toolbar.position === 'bottom' ? `${config.toolbar.height}px` : '0',
                }}
              >
                <span className={`text-xs ${text.secondary}`}>底部面板</span>
              </div>
            )}

            {/* 状态栏 */}
            {config.showStatusBar && (
              <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs px-4 py-1 flex items-center justify-between">
                <span>状态栏</span>
                <span>{contentArea.width}×{contentArea.height}</span>
              </div>
            )}

            {/* 专注模式遮罩 */}
            {config.zenMode && (
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg">
                  <span className={`text-sm font-medium ${text.primary}`}>🧘 专注模式</span>
                </div>
              </div>
            )}
          </div>

          {/* 布局信息 */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className={`font-medium ${text.primary}`}>侧边栏:</span>
              <span className={`ml-2 ${text.secondary}`}>
                {config.sidebar.isCollapsed ? '隐藏' : `${config.sidebar.width}px`}
              </span>
            </div>
            <div>
              <span className={`font-medium ${text.primary}`}>面板:</span>
              <span className={`ml-2 ${text.secondary}`}>
                {config.panel.isVisible 
                  ? `${config.panel.position === 'right' ? config.panel.width : config.panel.height}px`
                  : '隐藏'
                }
              </span>
            </div>
            <div>
              <span className={`font-medium ${text.primary}`}>工具栏:</span>
              <span className={`ml-2 ${text.secondary}`}>
                {config.toolbar.isVisible ? `${config.toolbar.height}px` : '隐藏'}
              </span>
            </div>
            <div>
              <span className={`font-medium ${text.primary}`}>模式:</span>
              <span className={`ml-2 ${text.secondary}`}>
                {config.zenMode ? '专注' : config.fullscreenMode ? '全屏' : '正常'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LayoutPage: React.FC = () => {
  return (
    <ThemeProvider defaultMode="system">
      <LayoutProvider>
        <LayoutPageContent />
      </LayoutProvider>
    </ThemeProvider>
  );
};

export default LayoutPage;
