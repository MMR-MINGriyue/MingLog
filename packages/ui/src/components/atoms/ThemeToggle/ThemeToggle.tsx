/**
 * 主题切换按钮
 * 支持亮色/暗色主题切换，带有动画效果
 */

import React from 'react'
import { Button, ButtonProps } from '../Button/Button'
import { useTheme, useThemeTransition } from '../../../contexts/ThemeContext'
import { cn } from '../../../utils/classNames'

export interface ThemeToggleProps extends Omit<ButtonProps, 'children'> {
  showLabel?: boolean
  iconSize?: 'sm' | 'md' | 'lg'
}

export function ThemeToggle({
  showLabel = false,
  iconSize = 'md',
  variant = 'ghost',
  size = 'md',
  className,
  onClick,
  ...props
}: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme()
  const { isTransitioning, transitionTheme } = useThemeTransition()

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e)
    } else {
      transitionTheme(toggleTheme)
    }
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const SunIcon = () => (
    <svg
      className={cn(
        iconSizes[iconSize],
        'transition-all duration-300',
        isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
      )}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )

  const MoonIcon = () => (
    <svg
      className={cn(
        iconSizes[iconSize],
        'absolute transition-all duration-300',
        isDark ? 'rotate-0 scale-100' : '-rotate-90 scale-0'
      )}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isTransitioning}
      className={cn(
        'relative overflow-hidden',
        showLabel && 'gap-2',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      {...props}
    >
      <div className="relative flex items-center justify-center">
        <SunIcon />
        <MoonIcon />
      </div>
      
      {showLabel && (
        <span className="capitalize">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </Button>
  )
}

// 简化的图标版本
export function ThemeToggleIcon({
  className,
  iconSize = 'md',
  ...props
}: Omit<ThemeToggleProps, 'showLabel' | 'variant' | 'size'> & {
  className?: string
}) {
  const { isDark, toggleTheme } = useTheme()
  const { transitionTheme } = useThemeTransition()

  const handleToggle = () => {
    transitionTheme(toggleTheme)
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'relative p-2 rounded-md transition-colors',
        'hover:bg-interactive-hover focus:bg-interactive-hover',
        'focus:outline-none focus:ring-2 focus:ring-brand-primary/20',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      {...props}
    >
      <div className="relative flex items-center justify-center">
        <svg
          className={cn(
            iconSizes[iconSize],
            'transition-all duration-300 text-foreground-primary',
            isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
        
        <svg
          className={cn(
            iconSizes[iconSize],
            'absolute transition-all duration-300 text-foreground-primary',
            isDark ? 'rotate-0 scale-100' : '-rotate-90 scale-0'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </div>
    </button>
  )
}

// 带有系统主题检测的高级版本
export function AdvancedThemeToggle({
  showSystemOption = true,
  ...props
}: ThemeToggleProps & {
  showSystemOption?: boolean
}) {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = React.useState(false)

  const options = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    ...(showSystemOption ? [{ value: 'system', label: 'System', icon: '💻' }] : [])
  ]

  return (
    <div className="relative">
      <ThemeToggle
        {...props}
        onClick={() => setIsOpen(!isOpen)}
      />
      
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉菜单 */}
          <div className="absolute right-0 top-full mt-2 z-50 bg-background-elevated border border-border-primary rounded-md shadow-lg min-w-32">
            {options.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => {
                  setTheme(option.value as any)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm transition-colors',
                  'hover:bg-interactive-hover first:rounded-t-md last:rounded-b-md',
                  'flex items-center gap-2',
                  theme === option.value && 'bg-interactive-selected text-brand-primary'
                )}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
                {theme === option.value && (
                  <span className="ml-auto">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
