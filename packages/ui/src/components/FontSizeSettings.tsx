/**
 * Font Size Settings Component
 * Provides controls for adjusting font sizes across the application
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../theme/ThemeProvider';

interface FontSizeConfig {
  ui: number;           // UI界面字体大小
  editor: number;       // 编辑器字体大小
  code: number;         // 代码字体大小
  heading: number;      // 标题字体大小
}

interface FontSizeSettingsProps {
  className?: string;
  showPreview?: boolean;
  compact?: boolean;
}

export const FontSizeSettings: React.FC<FontSizeSettingsProps> = ({
  className = '',
  showPreview = true,
  compact = false,
}) => {
  const { preferences, updatePreferences } = useTheme();
  
  // 扩展字体配置
  const [fontConfig, setFontConfig] = useState<FontSizeConfig>({
    ui: preferences.fontSize || 14,
    editor: preferences.fontSize || 14,
    code: preferences.fontSize || 13,
    heading: (preferences.fontSize || 14) + 2,
  });

  // 预设字体大小
  const presets = [
    { name: '小', ui: 12, editor: 12, code: 11, heading: 14 },
    { name: '中', ui: 14, editor: 14, code: 13, heading: 16 },
    { name: '大', ui: 16, editor: 16, code: 15, heading: 18 },
    { name: '特大', ui: 18, editor: 18, code: 17, heading: 20 },
  ];

  // 更新字体配置
  const updateFontConfig = (key: keyof FontSizeConfig, value: number) => {
    const newConfig = { ...fontConfig, [key]: value };
    setFontConfig(newConfig);
    
    // 更新主题偏好
    updatePreferences({ fontSize: newConfig.ui });
    
    // 应用到CSS变量
    applyFontSizes(newConfig);
  };

  // 应用预设
  const applyPreset = (preset: typeof presets[0]) => {
    setFontConfig(preset);
    updatePreferences({ fontSize: preset.ui });
    applyFontSizes(preset);
  };

  // 应用字体大小到CSS变量
  const applyFontSizes = (config: FontSizeConfig) => {
    const root = document.documentElement;
    root.style.setProperty('--font-size-ui', `${config.ui}px`);
    root.style.setProperty('--font-size-editor', `${config.editor}px`);
    root.style.setProperty('--font-size-code', `${config.code}px`);
    root.style.setProperty('--font-size-heading', `${config.heading}px`);
  };

  // 初始化时应用字体大小
  useEffect(() => {
    applyFontSizes(fontConfig);
  }, []);

  if (compact) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* 快速预设 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            字体大小预设
          </label>
          <div className="grid grid-cols-4 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`
                  px-3 py-2 text-sm rounded-md border transition-colors
                  ${fontConfig.ui === preset.ui
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* 界面字体调整 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              界面字体
            </label>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {fontConfig.ui}px
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="24"
            step="1"
            value={fontConfig.ui}
            onChange={(e) => updateFontConfig('ui', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 预设选择 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          字体大小预设
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${fontConfig.ui === preset.ui
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="text-center">
                <div className={`font-medium mb-1 ${fontConfig.ui === preset.ui ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                  {preset.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {preset.ui}px
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 详细调整 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          详细调整
        </h3>
        <div className="space-y-6">
          {/* 界面字体 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="font-medium text-gray-900 dark:text-white">
                界面字体大小
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {fontConfig.ui}px
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="24"
              step="1"
              value={fontConfig.ui}
              onChange={(e) => updateFontConfig('ui', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>10px</span>
              <span>17px</span>
              <span>24px</span>
            </div>
          </div>

          {/* 编辑器字体 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="font-medium text-gray-900 dark:text-white">
                编辑器字体大小
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {fontConfig.editor}px
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="24"
              step="1"
              value={fontConfig.editor}
              onChange={(e) => updateFontConfig('editor', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>10px</span>
              <span>17px</span>
              <span>24px</span>
            </div>
          </div>

          {/* 代码字体 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="font-medium text-gray-900 dark:text-white">
                代码字体大小
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {fontConfig.code}px
              </span>
            </div>
            <input
              type="range"
              min="9"
              max="20"
              step="1"
              value={fontConfig.code}
              onChange={(e) => updateFontConfig('code', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>9px</span>
              <span>14px</span>
              <span>20px</span>
            </div>
          </div>

          {/* 标题字体 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="font-medium text-gray-900 dark:text-white">
                标题字体大小
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {fontConfig.heading}px
              </span>
            </div>
            <input
              type="range"
              min="12"
              max="28"
              step="1"
              value={fontConfig.heading}
              onChange={(e) => updateFontConfig('heading', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>12px</span>
              <span>20px</span>
              <span>28px</span>
            </div>
          </div>
        </div>
      </div>

      {/* 实时预览 */}
      {showPreview && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            字体效果预览
          </h3>
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 
                className="font-semibold text-gray-900 dark:text-white mb-2"
                style={{ fontSize: `${fontConfig.heading}px` }}
              >
                这是标题文本预览
              </h4>
              <p 
                className="text-gray-700 dark:text-gray-300 mb-2"
                style={{ fontSize: `${fontConfig.ui}px` }}
              >
                这是界面文本的预览效果，您可以看到当前字体大小的显示效果。这段文字展示了在不同字体大小下的可读性。
              </p>
              <div 
                className="font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded"
                style={{ fontSize: `${fontConfig.code}px` }}
              >
                <div>// 这是代码字体预览</div>
                <div>function example() &#123;</div>
                <div>&nbsp;&nbsp;return "Hello, World!";</div>
                <div>&#125;</div>
              </div>
              <p 
                className="text-gray-600 dark:text-gray-400 mt-2"
                style={{ fontSize: `${fontConfig.editor}px` }}
              >
                这是编辑器文本的预览效果，通常用于文档编辑和内容创作。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 重置按钮 */}
      <div className="flex justify-end">
        <button
          onClick={() => applyPreset(presets[1])} // 重置为中等大小
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          重置为默认大小
        </button>
      </div>
    </div>
  );
};
