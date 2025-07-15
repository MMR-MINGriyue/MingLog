/**
 * macOS风格主题系统
 * 基于Apple Human Interface Guidelines的主题配置
 */

import { macosDesignTokens } from './macos-tokens';

/**
 * macOS主题接口
 */
export interface MacOSTheme {
  name: string;
  appearance: 'light' | 'dark';
  colors: {
    // 文本颜色
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
      link: string;
    };
    
    // 背景颜色
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      grouped: {
        primary: string;
        secondary: string;
        tertiary: string;
      };
    };
    
    // 分隔符
    separator: {
      primary: string;
      opaque: string;
    };
    
    // 填充色
    fill: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
    };
    
    // 系统颜色
    system: {
      blue: string;
      green: string;
      indigo: string;
      orange: string;
      pink: string;
      purple: string;
      red: string;
      teal: string;
      yellow: string;
    };
    
    // 控件颜色
    control: {
      accent: string;
      background: string;
      border: string;
      text: string;
    };
    
    // 毛玻璃效果
    vibrancy: {
      sidebar: string;
      menu: string;
      popover: string;
      sheet: string;
    };
  };
  
  // 阴影
  shadows: {
    level1: string;
    level2: string;
    level3: string;
    level4: string;
    level5: string;
    focus: string;
  };
  
  // 模糊效果
  blur: {
    vibrancy: string;
    subtle: string;
    strong: string;
  };
}

/**
 * macOS亮色主题
 */
export const macosLightTheme: MacOSTheme = {
  name: 'macOS Light',
  appearance: 'light',
  colors: {
    text: {
      primary: macosDesignTokens.colors.gray.light.primary,
      secondary: `${macosDesignTokens.colors.gray.light.secondary}99`, // 60% opacity
      tertiary: `${macosDesignTokens.colors.gray.light.tertiary}4D`,   // 30% opacity
      quaternary: `${macosDesignTokens.colors.gray.light.quaternary}2E`, // 18% opacity
      link: macosDesignTokens.colors.gray.light.link
    },
    
    background: {
      primary: macosDesignTokens.colors.gray.light.systemBackground,
      secondary: macosDesignTokens.colors.gray.light.secondarySystemBackground,
      tertiary: macosDesignTokens.colors.gray.light.tertiarySystemBackground,
      grouped: {
        primary: macosDesignTokens.colors.gray.light.systemGroupedBackground,
        secondary: macosDesignTokens.colors.gray.light.secondarySystemGroupedBackground,
        tertiary: macosDesignTokens.colors.gray.light.tertiarySystemGroupedBackground
      }
    },
    
    separator: {
      primary: `${macosDesignTokens.colors.gray.light.separator}4A`, // 29% opacity
      opaque: macosDesignTokens.colors.gray.light.opaqueSeparator
    },
    
    fill: {
      primary: macosDesignTokens.colors.gray.light.systemFill,
      secondary: macosDesignTokens.colors.gray.light.secondarySystemFill,
      tertiary: macosDesignTokens.colors.gray.light.tertiarySystemFill,
      quaternary: macosDesignTokens.colors.gray.light.quaternarySystemFill
    },
    
    system: {
      blue: macosDesignTokens.colors.system.blue,
      green: macosDesignTokens.colors.system.green,
      indigo: macosDesignTokens.colors.system.indigo,
      orange: macosDesignTokens.colors.system.orange,
      pink: macosDesignTokens.colors.system.pink,
      purple: macosDesignTokens.colors.system.purple,
      red: macosDesignTokens.colors.system.red,
      teal: macosDesignTokens.colors.system.teal,
      yellow: macosDesignTokens.colors.system.yellow
    },
    
    control: {
      accent: macosDesignTokens.colors.system.blue,
      background: '#FFFFFF',
      border: '#D1D1D6',
      text: '#000000'
    },
    
    vibrancy: {
      sidebar: macosDesignTokens.blur.vibrancy.light.sidebar,
      menu: macosDesignTokens.blur.vibrancy.light.menu,
      popover: macosDesignTokens.blur.vibrancy.light.popover,
      sheet: macosDesignTokens.blur.vibrancy.light.sheet
    }
  },
  
  shadows: {
    level1: macosDesignTokens.shadows.level1,
    level2: macosDesignTokens.shadows.level2,
    level3: macosDesignTokens.shadows.level3,
    level4: macosDesignTokens.shadows.level4,
    level5: macosDesignTokens.shadows.level5,
    focus: macosDesignTokens.shadows.semantic.focus
  },
  
  blur: {
    vibrancy: macosDesignTokens.blur.filters.vibrancy,
    subtle: macosDesignTokens.blur.filters.subtle,
    strong: macosDesignTokens.blur.filters.strong
  }
};

/**
 * macOS暗色主题
 */
export const macosDarkTheme: MacOSTheme = {
  name: 'macOS Dark',
  appearance: 'dark',
  colors: {
    text: {
      primary: macosDesignTokens.colors.gray.dark.primary,
      secondary: `${macosDesignTokens.colors.gray.dark.secondary}99`, // 60% opacity
      tertiary: `${macosDesignTokens.colors.gray.dark.tertiary}4D`,   // 30% opacity
      quaternary: `${macosDesignTokens.colors.gray.dark.quaternary}2E`, // 18% opacity
      link: macosDesignTokens.colors.gray.dark.link
    },
    
    background: {
      primary: macosDesignTokens.colors.gray.dark.systemBackground,
      secondary: macosDesignTokens.colors.gray.dark.secondarySystemBackground,
      tertiary: macosDesignTokens.colors.gray.dark.tertiarySystemBackground,
      grouped: {
        primary: macosDesignTokens.colors.gray.dark.systemGroupedBackground,
        secondary: macosDesignTokens.colors.gray.dark.secondarySystemGroupedBackground,
        tertiary: macosDesignTokens.colors.gray.dark.tertiarySystemGroupedBackground
      }
    },
    
    separator: {
      primary: `${macosDesignTokens.colors.gray.dark.separator}99`, // 60% opacity
      opaque: macosDesignTokens.colors.gray.dark.opaqueSeparator
    },
    
    fill: {
      primary: macosDesignTokens.colors.gray.dark.systemFill,
      secondary: macosDesignTokens.colors.gray.dark.secondarySystemFill,
      tertiary: macosDesignTokens.colors.gray.dark.tertiarySystemFill,
      quaternary: macosDesignTokens.colors.gray.dark.quaternarySystemFill
    },
    
    system: {
      blue: macosDesignTokens.colors.system.blueDark,
      green: macosDesignTokens.colors.system.greenDark,
      indigo: macosDesignTokens.colors.system.indigoDark,
      orange: macosDesignTokens.colors.system.orangeDark,
      pink: macosDesignTokens.colors.system.pinkDark,
      purple: macosDesignTokens.colors.system.purpleDark,
      red: macosDesignTokens.colors.system.redDark,
      teal: macosDesignTokens.colors.system.tealDark,
      yellow: macosDesignTokens.colors.system.yellowDark
    },
    
    control: {
      accent: macosDesignTokens.colors.system.blueDark,
      background: '#1C1C1E',
      border: '#38383A',
      text: '#FFFFFF'
    },
    
    vibrancy: {
      sidebar: macosDesignTokens.blur.vibrancy.dark.sidebar,
      menu: macosDesignTokens.blur.vibrancy.dark.menu,
      popover: macosDesignTokens.blur.vibrancy.dark.popover,
      sheet: macosDesignTokens.blur.vibrancy.dark.sheet
    }
  },
  
  shadows: {
    level1: macosDesignTokens.shadows.dark.level1,
    level2: macosDesignTokens.shadows.dark.level2,
    level3: macosDesignTokens.shadows.dark.level3,
    level4: macosDesignTokens.shadows.dark.level4,
    level5: macosDesignTokens.shadows.dark.level5,
    focus: '0 0 0 3px rgba(10, 132, 255, 0.3)' // 暗色模式焦点色
  },
  
  blur: {
    vibrancy: macosDesignTokens.blur.filters.vibrancy,
    subtle: macosDesignTokens.blur.filters.subtle,
    strong: macosDesignTokens.blur.filters.strong
  }
};

/**
 * macOS主题映射
 */
export const macosThemes = {
  light: macosLightTheme,
  dark: macosDarkTheme
} as const;

export type MacOSThemeName = keyof typeof macosThemes;

/**
 * 生成macOS主题CSS变量
 */
export function generateMacOSCSSVariables(theme: MacOSTheme): Record<string, string> {
  return {
    // 文本颜色
    '--macos-text-primary': theme.colors.text.primary,
    '--macos-text-secondary': theme.colors.text.secondary,
    '--macos-text-tertiary': theme.colors.text.tertiary,
    '--macos-text-quaternary': theme.colors.text.quaternary,
    '--macos-text-link': theme.colors.text.link,
    
    // 背景颜色
    '--macos-bg-primary': theme.colors.background.primary,
    '--macos-bg-secondary': theme.colors.background.secondary,
    '--macos-bg-tertiary': theme.colors.background.tertiary,
    '--macos-bg-grouped-primary': theme.colors.background.grouped.primary,
    '--macos-bg-grouped-secondary': theme.colors.background.grouped.secondary,
    '--macos-bg-grouped-tertiary': theme.colors.background.grouped.tertiary,
    
    // 分隔符
    '--macos-separator-primary': theme.colors.separator.primary,
    '--macos-separator-opaque': theme.colors.separator.opaque,
    
    // 填充色
    '--macos-fill-primary': theme.colors.fill.primary,
    '--macos-fill-secondary': theme.colors.fill.secondary,
    '--macos-fill-tertiary': theme.colors.fill.tertiary,
    '--macos-fill-quaternary': theme.colors.fill.quaternary,
    
    // 系统颜色
    '--macos-system-blue': theme.colors.system.blue,
    '--macos-system-green': theme.colors.system.green,
    '--macos-system-indigo': theme.colors.system.indigo,
    '--macos-system-orange': theme.colors.system.orange,
    '--macos-system-pink': theme.colors.system.pink,
    '--macos-system-purple': theme.colors.system.purple,
    '--macos-system-red': theme.colors.system.red,
    '--macos-system-teal': theme.colors.system.teal,
    '--macos-system-yellow': theme.colors.system.yellow,
    
    // 控件颜色
    '--macos-control-accent': theme.colors.control.accent,
    '--macos-control-background': theme.colors.control.background,
    '--macos-control-border': theme.colors.control.border,
    '--macos-control-text': theme.colors.control.text,
    
    // 毛玻璃效果
    '--macos-vibrancy-sidebar': theme.colors.vibrancy.sidebar,
    '--macos-vibrancy-menu': theme.colors.vibrancy.menu,
    '--macos-vibrancy-popover': theme.colors.vibrancy.popover,
    '--macos-vibrancy-sheet': theme.colors.vibrancy.sheet,
    
    // 阴影
    '--macos-shadow-level1': theme.shadows.level1,
    '--macos-shadow-level2': theme.shadows.level2,
    '--macos-shadow-level3': theme.shadows.level3,
    '--macos-shadow-level4': theme.shadows.level4,
    '--macos-shadow-level5': theme.shadows.level5,
    '--macos-shadow-focus': theme.shadows.focus,
    
    // 模糊效果
    '--macos-blur-vibrancy': theme.blur.vibrancy,
    '--macos-blur-subtle': theme.blur.subtle,
    '--macos-blur-strong': theme.blur.strong,
    
    // 字体
    '--macos-font-system': macosDesignTokens.typography.fontFamily.system,
    '--macos-font-mono': macosDesignTokens.typography.fontFamily.mono,
    '--macos-font-rounded': macosDesignTokens.typography.fontFamily.rounded,
    
    // 间距
    '--macos-spacing-xs': macosDesignTokens.spacing.semantic.padding.xs,
    '--macos-spacing-sm': macosDesignTokens.spacing.semantic.padding.sm,
    '--macos-spacing-md': macosDesignTokens.spacing.semantic.padding.md,
    '--macos-spacing-lg': macosDesignTokens.spacing.semantic.padding.lg,
    '--macos-spacing-xl': macosDesignTokens.spacing.semantic.padding.xl,
    
    // 圆角
    '--macos-radius-button': macosDesignTokens.borderRadius.semantic.button,
    '--macos-radius-card': macosDesignTokens.borderRadius.semantic.card,
    '--macos-radius-modal': macosDesignTokens.borderRadius.semantic.modal,
    '--macos-radius-input': macosDesignTokens.borderRadius.semantic.input,
    
    // 动画
    '--macos-transition-standard': `all ${macosDesignTokens.animation.duration.standard} ${macosDesignTokens.animation.easing.standard}`,
    '--macos-transition-short': `all ${macosDesignTokens.animation.duration.short} ${macosDesignTokens.animation.easing.standard}`,
    '--macos-transition-complex': `all ${macosDesignTokens.animation.duration.complex} ${macosDesignTokens.animation.easing.standard}`
  };
}

/**
 * macOS主题管理器
 */
export class MacOSThemeManager {
  private currentTheme: MacOSThemeName = 'light';
  private listeners: Set<(theme: MacOSThemeName) => void> = new Set();
  
  constructor() {
    if (typeof window !== 'undefined') {
      // 从本地存储读取主题设置
      const savedTheme = localStorage.getItem('minglog-macos-theme') as MacOSThemeName;
      if (savedTheme && macosThemes[savedTheme]) {
        this.currentTheme = savedTheme;
      } else {
        // 检测系统主题偏好
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.currentTheme = prefersDark ? 'dark' : 'light';
      }
      
      this.applyTheme(this.currentTheme);
      
      // 监听系统主题变化
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('minglog-macos-theme')) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }
  
  getCurrentTheme(): MacOSThemeName {
    return this.currentTheme;
  }
  
  setTheme(theme: MacOSThemeName): void {
    if (macosThemes[theme]) {
      this.currentTheme = theme;
      this.applyTheme(theme);
      
      // 保存到本地存储
      if (typeof window !== 'undefined') {
        localStorage.setItem('minglog-macos-theme', theme);
      }
      
      // 通知监听器
      this.listeners.forEach(listener => listener(theme));
    }
  }
  
  toggleTheme(): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }
  
  subscribe(listener: (theme: MacOSThemeName) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private applyTheme(theme: MacOSThemeName): void {
    if (typeof document === 'undefined') return;
    
    const themeConfig = macosThemes[theme];
    const cssVars = generateMacOSCSSVariables(themeConfig);
    
    // 应用CSS变量到根元素
    const root = document.documentElement;
    Object.entries(cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // 设置主题类名
    root.className = root.className.replace(/macos-theme-\w+/g, '');
    root.classList.add(`macos-theme-${theme}`);
    
    // 设置颜色方案
    root.style.colorScheme = theme;
  }
}

// 默认macOS主题管理器实例
export const macosThemeManager = new MacOSThemeManager();
