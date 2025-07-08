/**
 * 主题上下文
 * 提供主题状态管理和切换功能
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ThemeName, themes, themeManager } from '../design-system/themes'

interface ThemeContextValue {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
  isDark: boolean
  isLight: boolean
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: ThemeName
  storageKey?: string
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'light',
  storageKey = 'minglog-theme'
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    // 服务端渲染时使用默认主题
    if (typeof window === 'undefined') {
      return defaultTheme
    }
    
    // 从本地存储读取
    const stored = localStorage.getItem(storageKey) as ThemeName
    if (stored && themes[stored]) {
      return stored
    }
    
    // 检测系统偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  })

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme)
    themeManager.setTheme(newTheme)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newTheme)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  useEffect(() => {
    // 初始化主题
    themeManager.setTheme(theme)
    
    // 监听主题变化
    const unsubscribe = themeManager.subscribe((newTheme) => {
      setThemeState(newTheme)
    })
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      // 只有在没有手动设置主题时才跟随系统
      if (!localStorage.getItem(storageKey)) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      unsubscribe()
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme, storageKey])

  const value: ThemeContextValue = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// 主题相关的自定义Hook
export function useThemeColors() {
  const { theme } = useTheme()
  return themes[theme].colors
}

export function useThemeShadows() {
  const { theme } = useTheme()
  return themes[theme].shadows
}

export function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<ThemeName>(() => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return systemTheme
}

// 主题切换动画Hook
export function useThemeTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false)

  const transitionTheme = (callback: () => void) => {
    setIsTransitioning(true)
    
    // 添加过渡动画
    if (typeof document !== 'undefined') {
      document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease'
    }
    
    callback()
    
    // 移除过渡动画
    setTimeout(() => {
      if (typeof document !== 'undefined') {
        document.documentElement.style.transition = ''
      }
      setIsTransitioning(false)
    }, 300)
  }

  return { isTransitioning, transitionTheme }
}

// 主题感知的媒体查询Hook
export function useThemeMediaQuery(query: string) {
  const { theme } = useTheme()
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query, theme])

  return matches
}

// 主题相关的CSS类名生成器
export function useThemeClasses() {
  const { theme, isDark, isLight } = useTheme()
  
  return {
    theme: `theme-${theme}`,
    isDark,
    isLight,
    root: `theme-${theme}`,
    // 便捷的条件类名
    when: (condition: boolean, className: string) => condition ? className : '',
    dark: (className: string) => isDark ? className : '',
    light: (className: string) => isLight ? className : ''
  }
}
