/**
 * Button 组件
 * 基础按钮组件，支持多种变体和状态
 */

import React, { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '../../../utils/classNames'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const buttonVariants = {
  primary: [
    'bg-brand-primary text-white',
    'hover:bg-brand-primary/90',
    'focus:ring-2 focus:ring-brand-primary/20',
    'disabled:bg-interactive-disabled disabled:text-foreground-disabled'
  ],
  secondary: [
    'bg-background-secondary text-foreground-primary border border-border-primary',
    'hover:bg-interactive-hover',
    'focus:ring-2 focus:ring-brand-primary/20',
    'disabled:bg-interactive-disabled disabled:text-foreground-disabled disabled:border-border-primary'
  ],
  outline: [
    'bg-transparent text-foreground-primary border border-border-primary',
    'hover:bg-interactive-hover',
    'focus:ring-2 focus:ring-brand-primary/20',
    'disabled:bg-transparent disabled:text-foreground-disabled disabled:border-border-primary'
  ],
  ghost: [
    'bg-transparent text-foreground-primary',
    'hover:bg-interactive-hover',
    'focus:ring-2 focus:ring-brand-primary/20',
    'disabled:bg-transparent disabled:text-foreground-disabled'
  ],
  destructive: [
    'bg-semantic-error text-white',
    'hover:bg-semantic-error/90',
    'focus:ring-2 focus:ring-semantic-error/20',
    'disabled:bg-interactive-disabled disabled:text-foreground-disabled'
  ]
}

const buttonSizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg',
  xl: 'h-14 px-8 text-xl'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    children,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        className={cn(
          // 基础样式
          'inline-flex items-center justify-center gap-2',
          'font-medium rounded-md',
          'transition-all duration-200',
          'focus:outline-none focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          
          // 变体样式
          buttonVariants[variant],
          
          // 尺寸样式
          buttonSizes[size],
          
          // 全宽样式
          fullWidth && 'w-full',
          
          // 加载状态
          loading && 'cursor-wait',
          
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {!loading && leftIcon && (
          <span className="flex-shrink-0">
            {leftIcon}
          </span>
        )}
        
        {children && (
          <span className={cn(
            'truncate',
            (leftIcon || rightIcon || loading) && 'flex-1'
          )}>
            {children}
          </span>
        )}
        
        {!loading && rightIcon && (
          <span className="flex-shrink-0">
            {rightIcon}
          </span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// 按钮组组件
export interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
  size?: ButtonProps['size']
  variant?: ButtonProps['variant']
}

export function ButtonGroup({
  children,
  className,
  orientation = 'horizontal',
  size,
  variant
}: ButtonGroupProps) {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        '[&>button]:rounded-none',
        '[&>button:first-child]:rounded-l-md',
        '[&>button:last-child]:rounded-r-md',
        orientation === 'vertical' && [
          '[&>button:first-child]:rounded-t-md [&>button:first-child]:rounded-l-none',
          '[&>button:last-child]:rounded-b-md [&>button:last-child]:rounded-r-none'
        ],
        '[&>button:not(:first-child)]:border-l-0',
        orientation === 'vertical' && '[&>button:not(:first-child)]:border-l [&>button:not(:first-child)]:border-t-0',
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement<ButtonProps>(child) && child.type === Button) {
          return React.cloneElement(child, {
            size: size || child.props.size,
            variant: variant || child.props.variant
          } as Partial<ButtonProps>)
        }
        return child
      })}
    </div>
  )
}

// 图标按钮组件
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = 'md', ...props }, ref) => {
    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-7 w-7'
    }

    return (
      <Button
        ref={ref}
        size={size}
        className={cn(
          'aspect-square p-0',
          className
        )}
        {...props}
      >
        <span className={cn('flex items-center justify-center', iconSizes[size])}>
          {icon}
        </span>
      </Button>
    )
  }
)

IconButton.displayName = 'IconButton'
