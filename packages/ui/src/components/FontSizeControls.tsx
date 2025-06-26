/**
 * Font Size Controls Component
 * Quick controls for adjusting font sizes
 */

import React from 'react';
import { useFontSize, FONT_SIZE_PRESETS } from '../hooks/useFontSize';

interface FontSizeControlsProps {
  variant?: 'toolbar' | 'dropdown' | 'inline';
  showLabels?: boolean;
  showPresets?: boolean;
  className?: string;
}

export const FontSizeControls: React.FC<FontSizeControlsProps> = ({
  variant = 'toolbar',
  showLabels = false,
  showPresets = true,
  className = '',
}) => {
  const { config, updateConfig, applyPreset, scaleFont, resetToDefault } = useFontSize();

  if (variant === 'toolbar') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* 缩小按钮 */}
        <button
          onClick={() => scaleFont(0.9)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          title="缩小字体"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        {/* 当前字体大小显示 */}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-center">
          {config.ui}px
        </span>

        {/* 放大按钮 */}
        <button
          onClick={() => scaleFont(1.1)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          title="放大字体"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* 分隔线 */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* 重置按钮 */}
        <button
          onClick={resetToDefault}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          title="重置字体大小"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        {/* 预设选择 */}
        {showPresets && (
          <>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            <select
              value={FONT_SIZE_PRESETS.find(p => p.config.ui === config.ui)?.name || 'custom'}
              onChange={(e) => {
                const preset = FONT_SIZE_PRESETS.find(p => p.name === e.target.value);
                if (preset) applyPreset(preset);
              }}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="custom">自定义</option>
              {FONT_SIZE_PRESETS.map((preset) => (
                <option key={preset.name} value={preset.name}>
                  {preset.label}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
    );
  }

  if (variant === 'dropdown') {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          {showLabels && <span>字体大小</span>}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {config.ui}px
          </span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)} 
            />
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  字体大小调整
                </h3>
                
                {/* 快速调整 */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => scaleFont(0.9)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                  >
                    缩小
                  </button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-center">
                    {config.ui}px
                  </span>
                  <button
                    onClick={() => scaleFont(1.1)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                  >
                    放大
                  </button>
                </div>

                {/* 预设选择 */}
                <div className="space-y-2">
                  {FONT_SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        applyPreset(preset);
                        setIsOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors
                        ${config.ui === preset.config.ui
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }
                      `}
                    >
                      <span>{preset.label}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {preset.config.ui}px
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      resetToDefault();
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    重置为默认
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          字体大小:
        </label>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateConfig('ui', Math.max(10, config.ui - 1))}
            className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title="减小字体"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <input
            type="number"
            min="10"
            max="24"
            value={config.ui}
            onChange={(e) => updateConfig('ui', Number(e.target.value))}
            className="w-16 px-2 py-1 text-sm text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={() => updateConfig('ui', Math.min(24, config.ui + 1))}
            className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title="增大字体"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {showPresets && (
          <select
            value={FONT_SIZE_PRESETS.find(p => p.config.ui === config.ui)?.name || 'custom'}
            onChange={(e) => {
              const preset = FONT_SIZE_PRESETS.find(p => p.name === e.target.value);
              if (preset) applyPreset(preset);
            }}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="custom">自定义</option>
            {FONT_SIZE_PRESETS.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.label}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  }

  return null;
};

// 字体大小状态指示器
interface FontSizeIndicatorProps {
  className?: string;
  showValue?: boolean;
}

export const FontSizeIndicator: React.FC<FontSizeIndicatorProps> = ({
  className = '',
  showValue = true,
}) => {
  const { config } = useFontSize();

  const getIndicatorColor = (size: number) => {
    if (size < 12) return 'text-red-500';
    if (size < 14) return 'text-yellow-500';
    if (size <= 16) return 'text-green-500';
    if (size <= 18) return 'text-blue-500';
    return 'text-purple-500';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg className={`w-4 h-4 ${getIndicatorColor(config.ui)}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"/>
      </svg>
      {showValue && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {config.ui}px
        </span>
      )}
    </div>
  );
};
