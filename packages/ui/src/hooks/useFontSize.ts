/**
 * Font Size Hook
 * Manages font size settings and provides utilities for font size adjustments
 */

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../theme/ThemeProvider';

export interface FontSizeConfig {
  ui: number;           // UI界面字体大小
  editor: number;       // 编辑器字体大小
  code: number;         // 代码字体大小
  heading: number;      // 标题字体大小
}

export interface FontSizePreset {
  name: string;
  label: string;
  config: FontSizeConfig;
}

export interface UseFontSizeOptions {
  storageKey?: string;
  defaultConfig?: Partial<FontSizeConfig>;
  onConfigChange?: (config: FontSizeConfig) => void;
}

export interface UseFontSizeReturn {
  config: FontSizeConfig;
  presets: FontSizePreset[];
  updateConfig: (key: keyof FontSizeConfig, value: number) => void;
  setConfig: (config: FontSizeConfig) => void;
  applyPreset: (preset: FontSizePreset) => void;
  resetToDefault: () => void;
  scaleFont: (factor: number) => void;
  getFontSizeClass: (type: keyof FontSizeConfig) => string;
  getFontSizeStyle: (type: keyof FontSizeConfig) => React.CSSProperties;
}

// 预设字体大小配置
export const FONT_SIZE_PRESETS: FontSizePreset[] = [
  {
    name: 'small',
    label: '小',
    config: { ui: 12, editor: 12, code: 11, heading: 14 }
  },
  {
    name: 'medium',
    label: '中',
    config: { ui: 14, editor: 14, code: 13, heading: 16 }
  },
  {
    name: 'large',
    label: '大',
    config: { ui: 16, editor: 16, code: 15, heading: 18 }
  },
  {
    name: 'extra-large',
    label: '特大',
    config: { ui: 18, editor: 18, code: 17, heading: 20 }
  },
  {
    name: 'accessibility',
    label: '无障碍',
    config: { ui: 20, editor: 20, code: 18, heading: 24 }
  }
];

// 默认字体配置
const DEFAULT_CONFIG: FontSizeConfig = FONT_SIZE_PRESETS[1].config; // 中等大小

export const useFontSize = (options: UseFontSizeOptions = {}): UseFontSizeReturn => {
  const {
    storageKey = 'minglog-font-size-config',
    defaultConfig = {},
    onConfigChange
  } = options;

  const { updatePreferences } = useTheme();
  
  const [config, setConfigState] = useState<FontSizeConfig>(() => {
    // 尝试从localStorage加载配置
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        return { ...DEFAULT_CONFIG, ...defaultConfig, ...parsedConfig };
      }
    } catch (error) {
      console.warn('Failed to load font size config from localStorage:', error);
    }
    
    return { ...DEFAULT_CONFIG, ...defaultConfig };
  });

  // 保存配置到localStorage
  const saveConfig = useCallback((newConfig: FontSizeConfig) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newConfig));
    } catch (error) {
      console.warn('Failed to save font size config to localStorage:', error);
    }
  }, [storageKey]);

  // 应用字体大小到CSS变量
  const applyCSSVariables = useCallback((fontConfig: FontSizeConfig) => {
    const root = document.documentElement;
    
    // 设置CSS自定义属性
    root.style.setProperty('--font-size-ui', `${fontConfig.ui}px`);
    root.style.setProperty('--font-size-editor', `${fontConfig.editor}px`);
    root.style.setProperty('--font-size-code', `${fontConfig.code}px`);
    root.style.setProperty('--font-size-heading', `${fontConfig.heading}px`);
    
    // 更新相关的字体大小变量
    root.style.setProperty('--font-size-xs', `${Math.max(fontConfig.ui - 2, 10)}px`);
    root.style.setProperty('--font-size-sm', `${Math.max(fontConfig.ui - 1, 11)}px`);
    root.style.setProperty('--font-size-base', `${fontConfig.ui}px`);
    root.style.setProperty('--font-size-lg', `${fontConfig.ui + 1}px`);
    root.style.setProperty('--font-size-xl', `${fontConfig.ui + 2}px`);
    root.style.setProperty('--font-size-2xl', `${fontConfig.heading}px`);
    root.style.setProperty('--font-size-3xl', `${fontConfig.heading + 4}px`);
  }, []);

  // 更新配置
  const setConfig = useCallback((newConfig: FontSizeConfig) => {
    setConfigState(newConfig);
    saveConfig(newConfig);
    applyCSSVariables(newConfig);
    updatePreferences({ fontSize: newConfig.ui });
    onConfigChange?.(newConfig);
  }, [saveConfig, applyCSSVariables, updatePreferences, onConfigChange]);

  // 更新单个字体大小
  const updateConfig = useCallback((key: keyof FontSizeConfig, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
  }, [config, setConfig]);

  // 应用预设
  const applyPreset = useCallback((preset: FontSizePreset) => {
    setConfig(preset.config);
  }, [setConfig]);

  // 重置为默认
  const resetToDefault = useCallback(() => {
    setConfig({ ...DEFAULT_CONFIG, ...defaultConfig });
  }, [setConfig, defaultConfig]);

  // 按比例缩放字体
  const scaleFont = useCallback((factor: number) => {
    const newConfig: FontSizeConfig = {
      ui: Math.round(config.ui * factor),
      editor: Math.round(config.editor * factor),
      code: Math.round(config.code * factor),
      heading: Math.round(config.heading * factor),
    };
    
    // 确保字体大小在合理范围内
    newConfig.ui = Math.max(10, Math.min(24, newConfig.ui));
    newConfig.editor = Math.max(10, Math.min(24, newConfig.editor));
    newConfig.code = Math.max(9, Math.min(20, newConfig.code));
    newConfig.heading = Math.max(12, Math.min(32, newConfig.heading));
    
    setConfig(newConfig);
  }, [config, setConfig]);

  // 获取字体大小CSS类名
  const getFontSizeClass = useCallback((type: keyof FontSizeConfig): string => {
    const size = config[type];
    
    // 根据字体大小返回对应的Tailwind CSS类名
    if (size <= 12) return 'text-xs';
    if (size <= 14) return 'text-sm';
    if (size <= 16) return 'text-base';
    if (size <= 18) return 'text-lg';
    if (size <= 20) return 'text-xl';
    if (size <= 24) return 'text-2xl';
    return 'text-3xl';
  }, [config]);

  // 获取字体大小内联样式
  const getFontSizeStyle = useCallback((type: keyof FontSizeConfig): React.CSSProperties => {
    return {
      fontSize: `${config[type]}px`,
    };
  }, [config]);

  // 初始化时应用CSS变量
  useEffect(() => {
    applyCSSVariables(config);
  }, [config, applyCSSVariables]);

  // 监听系统字体大小偏好
  useEffect(() => {
    const handleSystemFontSizeChange = () => {
      // 检查系统是否有字体大小偏好设置
      // 这里可以根据需要实现系统字体大小检测逻辑
    };

    // 可以添加系统字体大小变化的监听器
    // window.addEventListener('resize', handleSystemFontSizeChange);
    
    return () => {
      // window.removeEventListener('resize', handleSystemFontSizeChange);
    };
  }, []);

  return {
    config,
    presets: FONT_SIZE_PRESETS,
    updateConfig,
    setConfig,
    applyPreset,
    resetToDefault,
    scaleFont,
    getFontSizeClass,
    getFontSizeStyle,
  };
};

// 字体大小工具函数
export const fontSizeUtils = {
  // 计算相对字体大小
  getRelativeSize: (baseSize: number, scale: number): number => {
    return Math.round(baseSize * scale);
  },
  
  // 获取字体大小的可读性评分
  getReadabilityScore: (fontSize: number, lineHeight: number = 1.5): number => {
    // 简单的可读性评分算法
    const idealSize = 16;
    const sizeScore = Math.max(0, 100 - Math.abs(fontSize - idealSize) * 5);
    const lineHeightScore = lineHeight >= 1.4 && lineHeight <= 1.8 ? 100 : 80;
    return Math.round((sizeScore + lineHeightScore) / 2);
  },
  
  // 检查字体大小是否符合无障碍标准
  isAccessible: (fontSize: number): boolean => {
    return fontSize >= 14; // WCAG建议最小字体大小
  },
  
  // 获取推荐的行高
  getRecommendedLineHeight: (fontSize: number): number => {
    if (fontSize <= 12) return 1.6;
    if (fontSize <= 16) return 1.5;
    if (fontSize <= 20) return 1.4;
    return 1.3;
  },
};

// 字体大小常量
export const FONT_SIZE_LIMITS = {
  ui: { min: 10, max: 24, default: 14 },
  editor: { min: 10, max: 24, default: 14 },
  code: { min: 9, max: 20, default: 13 },
  heading: { min: 12, max: 32, default: 16 },
} as const;
