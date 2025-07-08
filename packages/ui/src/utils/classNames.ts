/**
 * 类名工具函数
 * 提供类名合并、条件类名等功能
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并类名，支持条件类名和 Tailwind CSS 类名冲突解决
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 条件类名工具
 */
export function conditionalClass(condition: boolean, className: string, fallback?: string): string {
  return condition ? className : (fallback || '')
}

/**
 * 变体类名生成器
 */
export function createVariants<T extends Record<string, Record<string, string | string[]>>>(
  variants: T
) {
  return function getVariantClasses<K extends keyof T>(
    variant: K,
    value: keyof T[K]
  ): string {
    const variantClasses = variants[variant]?.[value]
    if (Array.isArray(variantClasses)) {
      return variantClasses.join(' ')
    }
    return variantClasses || ''
  }
}

/**
 * 响应式类名生成器
 */
export function responsive(classes: {
  base?: string
  sm?: string
  md?: string
  lg?: string
  xl?: string
  '2xl'?: string
}): string {
  const classNames: string[] = []
  
  if (classes.base) classNames.push(classes.base)
  if (classes.sm) classNames.push(`sm:${classes.sm}`)
  if (classes.md) classNames.push(`md:${classes.md}`)
  if (classes.lg) classNames.push(`lg:${classes.lg}`)
  if (classes.xl) classNames.push(`xl:${classes.xl}`)
  if (classes['2xl']) classNames.push(`2xl:${classes['2xl']}`)
  
  return classNames.join(' ')
}

/**
 * 状态类名生成器
 */
export function stateClasses(states: {
  base?: string
  hover?: string
  focus?: string
  active?: string
  disabled?: string
  loading?: string
}): string {
  const classNames: string[] = []
  
  if (states.base) classNames.push(states.base)
  if (states.hover) classNames.push(`hover:${states.hover}`)
  if (states.focus) classNames.push(`focus:${states.focus}`)
  if (states.active) classNames.push(`active:${states.active}`)
  if (states.disabled) classNames.push(`disabled:${states.disabled}`)
  if (states.loading) classNames.push(`data-loading:${states.loading}`)
  
  return classNames.join(' ')
}

/**
 * 主题感知类名生成器
 */
export function themeClasses(classes: {
  light?: string
  dark?: string
  base?: string
}): string {
  const classNames: string[] = []
  
  if (classes.base) classNames.push(classes.base)
  if (classes.light) classNames.push(`theme-light:${classes.light}`)
  if (classes.dark) classNames.push(`theme-dark:${classes.dark}`)
  
  return classNames.join(' ')
}

/**
 * 动画类名生成器
 */
export function animationClasses(animation: {
  enter?: string
  enterFrom?: string
  enterTo?: string
  leave?: string
  leaveFrom?: string
  leaveTo?: string
}): {
  enter: string
  enterFrom: string
  enterTo: string
  leave: string
  leaveFrom: string
  leaveTo: string
} {
  return {
    enter: animation.enter || 'transition-all duration-200 ease-out',
    enterFrom: animation.enterFrom || 'opacity-0 scale-95',
    enterTo: animation.enterTo || 'opacity-100 scale-100',
    leave: animation.leave || 'transition-all duration-150 ease-in',
    leaveFrom: animation.leaveFrom || 'opacity-100 scale-100',
    leaveTo: animation.leaveTo || 'opacity-0 scale-95'
  }
}

/**
 * 尺寸类名映射
 */
export const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl'
} as const

/**
 * 间距类名映射
 */
export const spacingClasses = {
  0: 'p-0',
  1: 'p-1',
  2: 'p-2',
  3: 'p-3',
  4: 'p-4',
  5: 'p-5',
  6: 'p-6',
  8: 'p-8',
  10: 'p-10',
  12: 'p-12',
  16: 'p-16',
  20: 'p-20',
  24: 'p-24'
} as const

/**
 * 圆角类名映射
 */
export const radiusClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  base: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full'
} as const

/**
 * 阴影类名映射
 */
export const shadowClasses = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  base: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner'
} as const

/**
 * 边框类名映射
 */
export const borderClasses = {
  0: 'border-0',
  1: 'border',
  2: 'border-2',
  4: 'border-4',
  8: 'border-8'
} as const

/**
 * 类名构建器类
 */
export class ClassNameBuilder {
  private classes: string[] = []

  add(className: string): this {
    if (className) {
      this.classes.push(className)
    }
    return this
  }

  addIf(condition: boolean, className: string): this {
    if (condition && className) {
      this.classes.push(className)
    }
    return this
  }

  addVariant(variant: string, value: string): this {
    if (variant && value) {
      this.classes.push(`${variant}:${value}`)
    }
    return this
  }

  merge(...additionalClasses: ClassValue[]): this {
    this.classes.push(cn(...additionalClasses))
    return this
  }

  build(): string {
    return cn(...this.classes)
  }

  toString(): string {
    return this.build()
  }
}

/**
 * 创建类名构建器
 */
export function createClassNameBuilder(): ClassNameBuilder {
  return new ClassNameBuilder()
}

/**
 * 快捷的类名构建函数
 */
export function buildClassName(builder: (cb: ClassNameBuilder) => void): string {
  const cb = new ClassNameBuilder()
  builder(cb)
  return cb.build()
}
