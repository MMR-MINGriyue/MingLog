/**
 * 主题系统
 * 定义亮色和暗色主题的具体配置
 */

import { colors, designTokens } from './tokens'

// 主题类型定义
export interface Theme {
  name: string
  colors: {
    // 背景色
    background: {
      primary: string
      secondary: string
      tertiary: string
      elevated: string
    }
    // 前景色
    foreground: {
      primary: string
      secondary: string
      tertiary: string
      disabled: string
    }
    // 边框色
    border: {
      primary: string
      secondary: string
      focus: string
      error: string
    }
    // 品牌色
    brand: {
      primary: string
      secondary: string
      accent: string
    }
    // 语义化颜色
    semantic: {
      success: string
      warning: string
      error: string
      info: string
    }
    // 交互状态
    interactive: {
      hover: string
      active: string
      selected: string
      disabled: string
    }
  }
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }
}

// 亮色主题
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: {
      primary: colors.neutral[50],      // 主背景
      secondary: colors.neutral[100],   // 次要背景
      tertiary: colors.neutral[200],    // 第三级背景
      elevated: '#ffffff'               // 悬浮背景
    },
    foreground: {
      primary: colors.neutral[900],     // 主文字
      secondary: colors.neutral[700],   // 次要文字
      tertiary: colors.neutral[500],    // 第三级文字
      disabled: colors.neutral[400]     // 禁用文字
    },
    border: {
      primary: colors.neutral[200],     // 主边框
      secondary: colors.neutral[300],   // 次要边框
      focus: colors.primary[500],       // 焦点边框
      error: colors.semantic.error[500] // 错误边框
    },
    brand: {
      primary: colors.primary[600],     // 主品牌色
      secondary: colors.primary[100],   // 次要品牌色
      accent: colors.primary[500]       // 强调色
    },
    semantic: {
      success: colors.semantic.success[600],
      warning: colors.semantic.warning[600],
      error: colors.semantic.error[600],
      info: colors.semantic.info[600]
    },
    interactive: {
      hover: colors.neutral[100],       // 悬停状态
      active: colors.neutral[200],      // 激活状态
      selected: colors.primary[50],     // 选中状态
      disabled: colors.neutral[100]     // 禁用状态
    }
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  }
}

// 暗色主题
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: {
      primary: colors.neutral[950],     // 主背景
      secondary: colors.neutral[900],   // 次要背景
      tertiary: colors.neutral[800],    // 第三级背景
      elevated: colors.neutral[900]     // 悬浮背景
    },
    foreground: {
      primary: colors.neutral[50],      // 主文字
      secondary: colors.neutral[300],   // 次要文字
      tertiary: colors.neutral[500],    // 第三级文字
      disabled: colors.neutral[600]     // 禁用文字
    },
    border: {
      primary: colors.neutral[800],     // 主边框
      secondary: colors.neutral[700],   // 次要边框
      focus: colors.primary[400],       // 焦点边框
      error: colors.semantic.error[400] // 错误边框
    },
    brand: {
      primary: colors.primary[400],     // 主品牌色
      secondary: colors.primary[900],   // 次要品牌色
      accent: colors.primary[500]       // 强调色
    },
    semantic: {
      success: colors.semantic.success[400],
      warning: colors.semantic.warning[400],
      error: colors.semantic.error[400],
      info: colors.semantic.info[400]
    },
    interactive: {
      hover: colors.neutral[800],       // 悬停状态
      active: colors.neutral[700],      // 激活状态
      selected: colors.primary[950],    // 选中状态
      disabled: colors.neutral[800]     // 禁用状态
    }
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)'
  }
}

// 主题映射
export const themes = {
  light: lightTheme,
  dark: darkTheme
} as const

export type ThemeName = keyof typeof themes

// CSS 变量生成器
export function generateCSSVariables(theme: Theme): Record<string, string> {
  const cssVars: Record<string, string> = {}
  
  // 背景色变量
  Object.entries(theme.colors.background).forEach(([key, value]) => {
    cssVars[`--color-background-${key}`] = value
  })
  
  // 前景色变量
  Object.entries(theme.colors.foreground).forEach(([key, value]) => {
    cssVars[`--color-foreground-${key}`] = value
  })
  
  // 边框色变量
  Object.entries(theme.colors.border).forEach(([key, value]) => {
    cssVars[`--color-border-${key}`] = value
  })
  
  // 品牌色变量
  Object.entries(theme.colors.brand).forEach(([key, value]) => {
    cssVars[`--color-brand-${key}`] = value
  })
  
  // 语义化颜色变量
  Object.entries(theme.colors.semantic).forEach(([key, value]) => {
    cssVars[`--color-semantic-${key}`] = value
  })
  
  // 交互状态变量
  Object.entries(theme.colors.interactive).forEach(([key, value]) => {
    cssVars[`--color-interactive-${key}`] = value
  })
  
  // 阴影变量
  Object.entries(theme.shadows).forEach(([key, value]) => {
    cssVars[`--shadow-${key}`] = value
  })
  
  // 设计令牌变量
  Object.entries(designTokens.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value
  })
  
  Object.entries(designTokens.borderRadius).forEach(([key, value]) => {
    cssVars[`--radius-${key}`] = value
  })
  
  return cssVars
}

// 主题切换工具
export class ThemeManager {
  private currentTheme: ThemeName = 'light'
  private listeners: Set<(theme: ThemeName) => void> = new Set()
  
  constructor() {
    // 从本地存储读取主题设置
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('minglog-theme') as ThemeName
      if (savedTheme && themes[savedTheme]) {
        this.currentTheme = savedTheme
      } else {
        // 检测系统主题偏好
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        this.currentTheme = prefersDark ? 'dark' : 'light'
      }
      
      this.applyTheme(this.currentTheme)
      
      // 监听系统主题变化
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('minglog-theme')) {
          this.setTheme(e.matches ? 'dark' : 'light')
        }
      })
    }
  }
  
  getCurrentTheme(): ThemeName {
    return this.currentTheme
  }
  
  setTheme(theme: ThemeName): void {
    if (themes[theme]) {
      this.currentTheme = theme
      this.applyTheme(theme)
      
      // 保存到本地存储
      if (typeof window !== 'undefined') {
        localStorage.setItem('minglog-theme', theme)
      }
      
      // 通知监听器
      this.listeners.forEach(listener => listener(theme))
    }
  }
  
  toggleTheme(): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light'
    this.setTheme(newTheme)
  }
  
  subscribe(listener: (theme: ThemeName) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  
  private applyTheme(theme: ThemeName): void {
    if (typeof document === 'undefined') return
    
    const themeConfig = themes[theme]
    const cssVars = generateCSSVariables(themeConfig)
    
    // 应用CSS变量到根元素
    const root = document.documentElement
    Object.entries(cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value)
    })
    
    // 设置主题类名
    root.className = root.className.replace(/theme-\w+/g, '')
    root.classList.add(`theme-${theme}`)
    
    // 设置颜色方案
    root.style.colorScheme = theme
  }
}

// 默认主题管理器实例
export const themeManager = new ThemeManager()

// 主题相关的工具函数
export function getThemeColor(path: string, theme?: Theme): string {
  const currentTheme = theme || themes[themeManager.getCurrentTheme()]
  const keys = path.split('.')
  let value: any = currentTheme.colors
  
  for (const key of keys) {
    value = value?.[key]
  }
  
  return value || ''
}

export function getThemeShadow(size: keyof Theme['shadows'], theme?: Theme): string {
  const currentTheme = theme || themes[themeManager.getCurrentTheme()]
  return currentTheme.shadows[size] || ''
}
