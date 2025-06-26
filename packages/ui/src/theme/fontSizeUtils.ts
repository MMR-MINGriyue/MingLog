/**
 * Font Size Utilities
 * Utilities for managing font sizes across the application
 */

import { FontSizeConfig } from '../hooks/useFontSize';

// 字体大小CSS类名映射
export const fontSizeClasses = {
  // UI字体大小类名
  ui: {
    xs: 'text-ui-xs',
    sm: 'text-ui-sm', 
    base: 'text-ui-base',
    lg: 'text-ui-lg',
    xl: 'text-ui-xl',
  },
  
  // 编辑器字体大小类名
  editor: {
    xs: 'text-editor-xs',
    sm: 'text-editor-sm',
    base: 'text-editor-base', 
    lg: 'text-editor-lg',
    xl: 'text-editor-xl',
  },
  
  // 代码字体大小类名
  code: {
    xs: 'text-code-xs',
    sm: 'text-code-sm',
    base: 'text-code-base',
    lg: 'text-code-lg', 
    xl: 'text-code-xl',
  },
  
  // 标题字体大小类名
  heading: {
    xs: 'text-heading-xs',
    sm: 'text-heading-sm',
    base: 'text-heading-base',
    lg: 'text-heading-lg',
    xl: 'text-heading-xl',
    '2xl': 'text-heading-2xl',
    '3xl': 'text-heading-3xl',
  },
};

// 生成字体大小CSS变量
export const generateFontSizeCSS = (config: FontSizeConfig): string => {
  const { ui, editor, code, heading } = config;
  
  return `
    :root {
      /* Base font sizes */
      --font-size-ui: ${ui}px;
      --font-size-editor: ${editor}px;
      --font-size-code: ${code}px;
      --font-size-heading: ${heading}px;
      
      /* UI font size scale */
      --font-size-ui-xs: ${Math.max(ui - 2, 10)}px;
      --font-size-ui-sm: ${Math.max(ui - 1, 11)}px;
      --font-size-ui-base: ${ui}px;
      --font-size-ui-lg: ${ui + 1}px;
      --font-size-ui-xl: ${ui + 2}px;
      
      /* Editor font size scale */
      --font-size-editor-xs: ${Math.max(editor - 2, 10)}px;
      --font-size-editor-sm: ${Math.max(editor - 1, 11)}px;
      --font-size-editor-base: ${editor}px;
      --font-size-editor-lg: ${editor + 1}px;
      --font-size-editor-xl: ${editor + 2}px;
      
      /* Code font size scale */
      --font-size-code-xs: ${Math.max(code - 2, 9)}px;
      --font-size-code-sm: ${Math.max(code - 1, 10)}px;
      --font-size-code-base: ${code}px;
      --font-size-code-lg: ${code + 1}px;
      --font-size-code-xl: ${code + 2}px;
      
      /* Heading font size scale */
      --font-size-heading-xs: ${Math.max(heading - 4, 12)}px;
      --font-size-heading-sm: ${Math.max(heading - 2, 14)}px;
      --font-size-heading-base: ${heading}px;
      --font-size-heading-lg: ${heading + 2}px;
      --font-size-heading-xl: ${heading + 4}px;
      --font-size-heading-2xl: ${heading + 6}px;
      --font-size-heading-3xl: ${heading + 8}px;
      
      /* Line heights */
      --line-height-ui: ${getRecommendedLineHeight(ui)};
      --line-height-editor: ${getRecommendedLineHeight(editor)};
      --line-height-code: ${getRecommendedLineHeight(code)};
      --line-height-heading: ${getRecommendedLineHeight(heading)};
    }
    
    /* Font size utility classes */
    .text-ui-xs { font-size: var(--font-size-ui-xs); line-height: var(--line-height-ui); }
    .text-ui-sm { font-size: var(--font-size-ui-sm); line-height: var(--line-height-ui); }
    .text-ui-base { font-size: var(--font-size-ui-base); line-height: var(--line-height-ui); }
    .text-ui-lg { font-size: var(--font-size-ui-lg); line-height: var(--line-height-ui); }
    .text-ui-xl { font-size: var(--font-size-ui-xl); line-height: var(--line-height-ui); }
    
    .text-editor-xs { font-size: var(--font-size-editor-xs); line-height: var(--line-height-editor); }
    .text-editor-sm { font-size: var(--font-size-editor-sm); line-height: var(--line-height-editor); }
    .text-editor-base { font-size: var(--font-size-editor-base); line-height: var(--line-height-editor); }
    .text-editor-lg { font-size: var(--font-size-editor-lg); line-height: var(--line-height-editor); }
    .text-editor-xl { font-size: var(--font-size-editor-xl); line-height: var(--line-height-editor); }
    
    .text-code-xs { font-size: var(--font-size-code-xs); line-height: var(--line-height-code); font-family: var(--font-family-mono); }
    .text-code-sm { font-size: var(--font-size-code-sm); line-height: var(--line-height-code); font-family: var(--font-family-mono); }
    .text-code-base { font-size: var(--font-size-code-base); line-height: var(--line-height-code); font-family: var(--font-family-mono); }
    .text-code-lg { font-size: var(--font-size-code-lg); line-height: var(--line-height-code); font-family: var(--font-family-mono); }
    .text-code-xl { font-size: var(--font-size-code-xl); line-height: var(--line-height-code); font-family: var(--font-family-mono); }
    
    .text-heading-xs { font-size: var(--font-size-heading-xs); line-height: var(--line-height-heading); font-weight: 600; }
    .text-heading-sm { font-size: var(--font-size-heading-sm); line-height: var(--line-height-heading); font-weight: 600; }
    .text-heading-base { font-size: var(--font-size-heading-base); line-height: var(--line-height-heading); font-weight: 600; }
    .text-heading-lg { font-size: var(--font-size-heading-lg); line-height: var(--line-height-heading); font-weight: 600; }
    .text-heading-xl { font-size: var(--font-size-heading-xl); line-height: var(--line-height-heading); font-weight: 600; }
    .text-heading-2xl { font-size: var(--font-size-heading-2xl); line-height: var(--line-height-heading); font-weight: 700; }
    .text-heading-3xl { font-size: var(--font-size-heading-3xl); line-height: var(--line-height-heading); font-weight: 700; }
  `;
};

// 获取推荐的行高
export const getRecommendedLineHeight = (fontSize: number): number => {
  if (fontSize <= 12) return 1.6;
  if (fontSize <= 16) return 1.5;
  if (fontSize <= 20) return 1.4;
  return 1.3;
};

// 字体大小验证
export const validateFontSize = (size: number, type: keyof FontSizeConfig): boolean => {
  const limits = {
    ui: { min: 10, max: 24 },
    editor: { min: 10, max: 24 },
    code: { min: 9, max: 20 },
    heading: { min: 12, max: 32 },
  };
  
  const limit = limits[type];
  return size >= limit.min && size <= limit.max;
};

// 字体大小转换工具
export const fontSizeConverters = {
  // px转rem
  pxToRem: (px: number, baseFontSize: number = 16): number => {
    return px / baseFontSize;
  },
  
  // rem转px
  remToPx: (rem: number, baseFontSize: number = 16): number => {
    return rem * baseFontSize;
  },
  
  // px转em
  pxToEm: (px: number, parentFontSize: number): number => {
    return px / parentFontSize;
  },
  
  // em转px
  emToPx: (em: number, parentFontSize: number): number => {
    return em * parentFontSize;
  },
};

// 字体大小可读性检查
export const checkReadability = (config: FontSizeConfig): {
  score: number;
  issues: string[];
  suggestions: string[];
} => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // 检查UI字体大小
  if (config.ui < 14) {
    issues.push('界面字体过小，可能影响可读性');
    suggestions.push('建议将界面字体调整到14px或以上');
    score -= 20;
  }

  // 检查编辑器字体大小
  if (config.editor < 13) {
    issues.push('编辑器字体过小，长时间阅读可能造成眼疲劳');
    suggestions.push('建议将编辑器字体调整到13px或以上');
    score -= 15;
  }

  // 检查代码字体大小
  if (config.code < 12) {
    issues.push('代码字体过小，可能影响代码阅读');
    suggestions.push('建议将代码字体调整到12px或以上');
    score -= 15;
  }

  // 检查字体大小一致性
  const sizeDiff = Math.abs(config.ui - config.editor);
  if (sizeDiff > 3) {
    issues.push('界面字体和编辑器字体大小差异过大');
    suggestions.push('建议保持界面字体和编辑器字体大小相近');
    score -= 10;
  }

  // 检查标题字体大小
  if (config.heading <= config.ui) {
    issues.push('标题字体与正文字体大小相同或更小');
    suggestions.push('建议将标题字体调整为比正文字体大2-4px');
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    issues,
    suggestions,
  };
};

// 字体大小无障碍检查
export const checkAccessibility = (config: FontSizeConfig): {
  isAccessible: boolean;
  wcagLevel: 'AA' | 'AAA' | 'Fail';
  recommendations: string[];
} => {
  const recommendations: string[] = [];
  let isAccessible = true;
  let wcagLevel: 'AA' | 'AAA' | 'Fail' = 'AAA';

  // WCAG 2.1 字体大小要求
  const minSizeAA = 14; // AA级别最小字体大小
  const minSizeAAA = 16; // AAA级别最小字体大小

  // 检查UI字体
  if (config.ui < minSizeAA) {
    isAccessible = false;
    wcagLevel = 'Fail';
    recommendations.push(`界面字体大小${config.ui}px低于WCAG AA标准(${minSizeAA}px)`);
  } else if (config.ui < minSizeAAA) {
    wcagLevel = 'AA';
    recommendations.push(`界面字体大小符合WCAG AA标准，建议调整到${minSizeAAA}px以达到AAA标准`);
  }

  // 检查编辑器字体
  if (config.editor < minSizeAA) {
    isAccessible = false;
    wcagLevel = 'Fail';
    recommendations.push(`编辑器字体大小${config.editor}px低于WCAG AA标准(${minSizeAA}px)`);
  } else if (config.editor < minSizeAAA && wcagLevel === 'AAA') {
    wcagLevel = 'AA';
    recommendations.push(`编辑器字体大小符合WCAG AA标准，建议调整到${minSizeAAA}px以达到AAA标准`);
  }

  return {
    isAccessible,
    wcagLevel,
    recommendations,
  };
};

// 字体大小预设生成器
export const generateFontSizePresets = (baseFontSize: number) => {
  return {
    small: {
      ui: Math.max(baseFontSize - 2, 10),
      editor: Math.max(baseFontSize - 2, 10),
      code: Math.max(baseFontSize - 3, 9),
      heading: baseFontSize,
    },
    medium: {
      ui: baseFontSize,
      editor: baseFontSize,
      code: Math.max(baseFontSize - 1, 9),
      heading: baseFontSize + 2,
    },
    large: {
      ui: baseFontSize + 2,
      editor: baseFontSize + 2,
      code: baseFontSize + 1,
      heading: baseFontSize + 4,
    },
    extraLarge: {
      ui: baseFontSize + 4,
      editor: baseFontSize + 4,
      code: baseFontSize + 3,
      heading: baseFontSize + 6,
    },
  };
};

// 导出所有工具函数
export const fontSizeUtils = {
  generateFontSizeCSS,
  getRecommendedLineHeight,
  validateFontSize,
  fontSizeConverters,
  checkReadability,
  checkAccessibility,
  generateFontSizePresets,
};
