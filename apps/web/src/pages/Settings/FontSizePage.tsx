/**
 * Font Size Settings Page
 * Dedicated page for font size configuration and testing
 */

import React from 'react';
import { ThemeProvider, useThemeClasses } from '@minglog/ui/theme';
import { FontSizeSettings } from '@minglog/ui/components/FontSizeSettings';
import { FontSizeControls, FontSizeIndicator } from '@minglog/ui/components/FontSizeControls';
import { useFontSize } from '@minglog/ui/hooks/useFontSize';
import { checkReadability, checkAccessibility } from '@minglog/ui/theme/fontSizeUtils';

const FontSizePageContent: React.FC = () => {
  const { bg, text, border } = useThemeClasses();
  const { config, getFontSizeStyle } = useFontSize();
  
  // 获取可读性和无障碍检查结果
  const readabilityCheck = checkReadability(config);
  const accessibilityCheck = checkAccessibility(config);

  return (
    <div className={`min-h-screen ${bg.primary}`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-3xl font-bold ${text.primary}`}>
                字体大小设置
              </h1>
              <p className={`text-lg mt-2 ${text.secondary}`}>
                调整界面、编辑器和代码的字体大小，优化阅读体验
              </p>
            </div>
            <div className="flex items-center gap-4">
              <FontSizeIndicator showValue />
              <FontSizeControls variant="toolbar" showPresets />
            </div>
          </div>
          
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* 可读性评分 */}
            <div className={`p-4 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  readabilityCheck.score >= 80 ? 'bg-green-500' : 
                  readabilityCheck.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <h3 className={`font-medium ${text.primary}`}>可读性评分</h3>
              </div>
              <div className={`text-2xl font-bold ${text.primary}`}>
                {readabilityCheck.score}/100
              </div>
              <p className={`text-sm ${text.secondary}`}>
                {readabilityCheck.score >= 80 ? '优秀' : 
                 readabilityCheck.score >= 60 ? '良好' : '需要改进'}
              </p>
            </div>

            {/* 无障碍等级 */}
            <div className={`p-4 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  accessibilityCheck.wcagLevel === 'AAA' ? 'bg-green-500' : 
                  accessibilityCheck.wcagLevel === 'AA' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <h3 className={`font-medium ${text.primary}`}>无障碍等级</h3>
              </div>
              <div className={`text-2xl font-bold ${text.primary}`}>
                WCAG {accessibilityCheck.wcagLevel}
              </div>
              <p className={`text-sm ${text.secondary}`}>
                {accessibilityCheck.isAccessible ? '符合标准' : '不符合标准'}
              </p>
            </div>

            {/* 当前配置 */}
            <div className={`p-4 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`font-medium mb-2 ${text.primary}`}>当前配置</h3>
              <div className="space-y-1 text-sm">
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>界面:</span>
                  <span className={text.primary}>{config.ui}px</span>
                </div>
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>编辑器:</span>
                  <span className={text.primary}>{config.editor}px</span>
                </div>
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>代码:</span>
                  <span className={text.primary}>{config.code}px</span>
                </div>
                <div className={`flex justify-between ${text.secondary}`}>
                  <span>标题:</span>
                  <span className={text.primary}>{config.heading}px</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要设置面板 */}
          <div className="lg:col-span-2">
            <FontSizeSettings showPreview />
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 快速调整 */}
            <div className={`p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`text-lg font-semibold mb-4 ${text.primary}`}>
                快速调整
              </h3>
              <FontSizeControls variant="dropdown" showLabels showPresets />
            </div>

            {/* 建议和警告 */}
            {(readabilityCheck.issues.length > 0 || accessibilityCheck.recommendations.length > 0) && (
              <div className={`p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
                <h3 className={`text-lg font-semibold mb-4 ${text.primary}`}>
                  建议和提醒
                </h3>
                
                {readabilityCheck.issues.length > 0 && (
                  <div className="mb-4">
                    <h4 className={`text-sm font-medium mb-2 text-yellow-600 dark:text-yellow-400`}>
                      ⚠️ 可读性问题
                    </h4>
                    <ul className="space-y-1">
                      {readabilityCheck.issues.map((issue, index) => (
                        <li key={index} className={`text-sm ${text.secondary}`}>
                          • {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {readabilityCheck.suggestions.length > 0 && (
                  <div className="mb-4">
                    <h4 className={`text-sm font-medium mb-2 text-blue-600 dark:text-blue-400`}>
                      💡 改进建议
                    </h4>
                    <ul className="space-y-1">
                      {readabilityCheck.suggestions.map((suggestion, index) => (
                        <li key={index} className={`text-sm ${text.secondary}`}>
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {accessibilityCheck.recommendations.length > 0 && (
                  <div>
                    <h4 className={`text-sm font-medium mb-2 text-green-600 dark:text-green-400`}>
                      ♿ 无障碍建议
                    </h4>
                    <ul className="space-y-1">
                      {accessibilityCheck.recommendations.map((recommendation, index) => (
                        <li key={index} className={`text-sm ${text.secondary}`}>
                          • {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 使用技巧 */}
            <div className={`p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
              <h3 className={`text-lg font-semibold mb-4 ${text.primary}`}>
                💡 使用技巧
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className={text.secondary}>
                  <strong className={text.primary}>快捷键:</strong> 使用 Ctrl/Cmd + Plus/Minus 快速调整字体大小
                </div>
                <div className={text.secondary}>
                  <strong className={text.primary}>编辑器优化:</strong> 编辑器字体建议比界面字体稍大，提高长时间阅读舒适度
                </div>
                <div className={text.secondary}>
                  <strong className={text.primary}>代码字体:</strong> 代码字体通常比正文字体小1-2px，保持代码紧凑性
                </div>
                <div className={text.secondary}>
                  <strong className={text.primary}>无障碍:</strong> 字体大小至少14px才符合WCAG AA标准
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 字体效果展示区 */}
        <div className={`mt-8 p-6 rounded-lg border ${border.primary} ${bg.secondary}`}>
          <h2 className={`text-xl font-semibold mb-6 ${text.primary}`}>
            字体效果展示
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 界面文本示例 */}
            <div>
              <h3 className={`font-medium mb-4 ${text.primary}`}>界面文本示例</h3>
              <div className="space-y-4">
                <div style={getFontSizeStyle('heading')}>
                  <h4 className={`font-semibold ${text.primary}`}>
                    这是标题文本 (H4)
                  </h4>
                </div>
                <div style={getFontSizeStyle('ui')}>
                  <p className={text.primary}>
                    这是界面正文文本。MingLog 是一个现代化的知识管理工具，
                    帮助您更好地组织和管理个人知识库。
                  </p>
                </div>
                <div style={getFontSizeStyle('ui')}>
                  <p className={text.secondary}>
                    这是次要文本，通常用于描述、提示或辅助信息。
                    字体颜色较浅，但仍保持良好的可读性。
                  </p>
                </div>
                <div style={getFontSizeStyle('ui')}>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                      主要按钮
                    </button>
                    <button className={`px-3 py-1 border ${border.primary} ${text.primary} rounded text-sm hover:${bg.tertiary} transition-colors`}>
                      次要按钮
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 编辑器和代码示例 */}
            <div>
              <h3 className={`font-medium mb-4 ${text.primary}`}>编辑器和代码示例</h3>
              <div className="space-y-4">
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${text.secondary}`}>编辑器文本</h4>
                  <div 
                    className={`p-3 border ${border.primary} rounded ${bg.primary}`}
                    style={getFontSizeStyle('editor')}
                  >
                    <p className={text.primary}>
                      这是编辑器中的文本内容。编辑器通常用于长文档的编写和编辑，
                      因此字体大小的选择对用户体验至关重要。合适的字体大小可以减少眼疲劳，
                      提高工作效率。
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${text.secondary}`}>代码文本</h4>
                  <div 
                    className={`p-3 bg-gray-100 dark:bg-gray-800 rounded font-mono ${text.primary}`}
                    style={getFontSizeStyle('code')}
                  >
                    <div>// TypeScript 代码示例</div>
                    <div>interface User &#123;</div>
                    <div>&nbsp;&nbsp;id: number;</div>
                    <div>&nbsp;&nbsp;name: string;</div>
                    <div>&nbsp;&nbsp;email: string;</div>
                    <div>&#125;</div>
                    <div></div>
                    <div>const user: User = &#123;</div>
                    <div>&nbsp;&nbsp;id: 1,</div>
                    <div>&nbsp;&nbsp;name: "张三",</div>
                    <div>&nbsp;&nbsp;email: "zhangsan@example.com"</div>
                    <div>&#125;;</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FontSizePage: React.FC = () => {
  return (
    <ThemeProvider defaultMode="system">
      <FontSizePageContent />
    </ThemeProvider>
  );
};

export default FontSizePage;
