import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'

export type Theme = 'light' | 'dark' | 'auto'

interface UseThemeReturn {
  theme: Theme
  actualTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useTheme = (): UseThemeReturn => {
  const [theme, setThemeState] = useState<Theme>('auto')
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')

  // Get system theme preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }, [])

  // Calculate actual theme based on preference and system
  const calculateActualTheme = useCallback((themePreference: Theme): 'light' | 'dark' => {
    if (themePreference === 'auto') {
      return getSystemTheme()
    }
    return themePreference
  }, [getSystemTheme])

  // Apply theme to document
  const applyTheme = useCallback((actualTheme: 'light' | 'dark') => {
    const root = document.documentElement
    
    if (actualTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', actualTheme === 'dark' ? '#1f2937' : '#ffffff')
    }
  }, [])

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('minglog-theme') as Theme
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setThemeState(savedTheme)
    }
  }, [])

  // Update actual theme when theme preference changes
  useEffect(() => {
    const newActualTheme = calculateActualTheme(theme)
    setActualTheme(newActualTheme)
    applyTheme(newActualTheme)
  }, [theme, calculateActualTheme, applyTheme])

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = () => {
        const newActualTheme = calculateActualTheme('auto')
        setActualTheme(newActualTheme)
        applyTheme(newActualTheme)
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme, calculateActualTheme, applyTheme])

  // Set theme and save to localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('minglog-theme', newTheme)
  }, [])

  // Toggle between light and dark (skips auto)
  const toggleTheme = useCallback(() => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('light')
    } else {
      // If auto, toggle to opposite of current actual theme
      setTheme(actualTheme === 'light' ? 'dark' : 'light')
    }
  }, [theme, actualTheme, setTheme])

  return {
    theme,
    actualTheme,
    setTheme,
    toggleTheme
  }
}

// Theme context for providing theme throughout the app
interface ThemeContextType extends UseThemeReturn {}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme = useTheme()

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

// Theme toggle component
interface ThemeToggleProps {
  className?: string
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, setTheme } = useThemeContext()

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'light' 
            ? 'bg-primary-100 text-primary-700' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        title="Light theme"
      >
        ☀️
      </button>
      
      <button
        onClick={() => setTheme('auto')}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'auto' 
            ? 'bg-primary-100 text-primary-700' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        title="Auto theme"
      >
        🌓
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'dark' 
            ? 'bg-primary-100 text-primary-700' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        title="Dark theme"
      >
        🌙
      </button>
    </div>
  )
}
