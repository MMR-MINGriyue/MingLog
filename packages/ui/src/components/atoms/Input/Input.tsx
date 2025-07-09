/**
 * Input 组件
 * 基础输入框组件，支持多种类型和状态
 */

import React, { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '../../../utils/classNames'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled' | 'outline'
  inputSize?: 'sm' | 'md' | 'lg'
  error?: boolean
  success?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  leftAddon?: React.ReactNode
  rightAddon?: React.ReactNode
  helperText?: string
  errorText?: string
  label?: string
  required?: boolean
  fullWidth?: boolean
}

const inputVariants = {
  default: [
    'bg-background-elevated border border-border-primary',
    'focus:border-border-focus focus:ring-2 focus:ring-brand-primary/20',
    'hover:border-border-secondary'
  ],
  filled: [
    'bg-background-secondary border border-transparent',
    'focus:bg-background-elevated focus:border-border-focus focus:ring-2 focus:ring-brand-primary/20',
    'hover:bg-background-tertiary'
  ],
  outline: [
    'bg-transparent border-2 border-border-primary',
    'focus:border-border-focus focus:ring-2 focus:ring-brand-primary/20',
    'hover:border-border-secondary'
  ]
}

const inputSizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-5 text-lg'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant = 'default',
    inputSize = 'md',
    error = false,
    success = false,
    leftIcon,
    rightIcon,
    leftAddon,
    rightAddon,
    helperText,
    errorText,
    label,
    required = false,
    fullWidth = false,
    disabled,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const hasError = error || !!errorText
    const hasSuccess = success && !hasError
    const hasLeftElement = leftIcon || leftAddon
    const hasRightElement = rightIcon || rightAddon

    const inputElement = (
      <div className={cn(
        'relative flex items-center',
        fullWidth && 'w-full'
      )}>
        {/* 左侧插槽 */}
        {hasLeftElement && (
          <div className={cn(
            'absolute left-0 z-10 flex items-center',
            leftAddon ? 'inset-y-0' : 'inset-y-0 pl-3'
          )}>
            {leftAddon ? (
              <div className={cn(
                'flex items-center px-3 bg-background-secondary border-r border-border-primary',
                'text-foreground-secondary text-sm',
                inputSizes[inputSize].split(' ')[0], // 只取高度
                'rounded-l-md'
              )}>
                {leftAddon}
              </div>
            ) : (
              <span className="text-foreground-tertiary">
                {leftIcon}
              </span>
            )}
          </div>
        )}

        {/* 输入框 */}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            // 基础样式
            'w-full rounded-md transition-all duration-200',
            'text-foreground-primary placeholder:text-foreground-tertiary',
            'focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-interactive-disabled',
            
            // 变体样式
            inputVariants[variant],
            
            // 尺寸样式
            inputSizes[inputSize],
            
            // 状态样式
            hasError && [
              'border-border-error focus:border-border-error',
              'focus:ring-semantic-error/20'
            ],
            hasSuccess && [
              'border-semantic-success focus:border-semantic-success',
              'focus:ring-semantic-success/20'
            ],
            
            // 左右元素的内边距调整
            hasLeftElement && (leftAddon ? 'pl-20' : 'pl-10'),
            hasRightElement && (rightAddon ? 'pr-20' : 'pr-10'),
            
            className
          )}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            helperText || errorText ? `${inputId}-description` : undefined
          }
          {...props}
        />

        {/* 右侧插槽 */}
        {hasRightElement && (
          <div className={cn(
            'absolute right-0 z-10 flex items-center',
            rightAddon ? 'inset-y-0' : 'inset-y-0 pr-3'
          )}>
            {rightAddon ? (
              <div className={cn(
                'flex items-center px-3 bg-background-secondary border-l border-border-primary',
                'text-foreground-secondary text-sm',
                inputSizes[inputSize].split(' ')[0], // 只取高度
                'rounded-r-md'
              )}>
                {rightAddon}
              </div>
            ) : (
              <span className="text-foreground-tertiary">
                {rightIcon}
              </span>
            )}
          </div>
        )}
      </div>
    )

    if (label) {
      return (
        <div className={cn('space-y-2', fullWidth && 'w-full')}>
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-foreground-primary',
              disabled && 'text-foreground-disabled'
            )}
          >
            {label}
            {required && (
              <span className="ml-1 text-semantic-error" aria-label="required">
                *
              </span>
            )}
          </label>
          {inputElement}
          {(helperText || errorText) && (
            <p
              id={`${inputId}-description`}
              className={cn(
                'text-sm',
                hasError ? 'text-semantic-error' : 'text-foreground-secondary'
              )}
            >
              {errorText || helperText}
            </p>
          )}
        </div>
      )
    }

    return (
      <div className={cn(fullWidth && 'w-full')}>
        {inputElement}
        {(helperText || errorText) && (
          <p
            id={`${inputId}-description`}
            className={cn(
              'mt-2 text-sm',
              hasError ? 'text-semantic-error' : 'text-foreground-secondary'
            )}
          >
            {errorText || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// 文本域组件
export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  variant?: InputProps['variant']
  inputSize?: InputProps['inputSize']
  error?: boolean
  success?: boolean
  helperText?: string
  errorText?: string
  label?: string
  required?: boolean
  fullWidth?: boolean
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    variant = 'default',
    inputSize = 'md',
    error = false,
    success = false,
    helperText,
    errorText,
    label,
    required = false,
    fullWidth = false,
    resize = 'vertical',
    disabled,
    id,
    rows = 4,
    ...props
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    const hasError = error || !!errorText
    const hasSuccess = success && !hasError

    const textareaElement = (
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={cn(
          // 基础样式
          'w-full rounded-md transition-all duration-200',
          'text-foreground-primary placeholder:text-foreground-tertiary',
          'focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-interactive-disabled',
          
          // 变体样式
          inputVariants[variant],
          
          // 尺寸样式（去掉高度，保留内边距）
          inputSizes[inputSize].replace(/h-\w+\s?/, ''),
          
          // 状态样式
          hasError && [
            'border-border-error focus:border-border-error',
            'focus:ring-semantic-error/20'
          ],
          hasSuccess && [
            'border-semantic-success focus:border-semantic-success',
            'focus:ring-semantic-success/20'
          ],
          
          // 调整大小
          {
            'resize-none': resize === 'none',
            'resize-y': resize === 'vertical',
            'resize-x': resize === 'horizontal',
            'resize': resize === 'both'
          },
          
          className
        )}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={
          helperText || errorText ? `${textareaId}-description` : undefined
        }
        {...props}
      />
    )

    if (label) {
      return (
        <div className={cn('space-y-2', fullWidth && 'w-full')}>
          <label
            htmlFor={textareaId}
            className={cn(
              'block text-sm font-medium text-foreground-primary',
              disabled && 'text-foreground-disabled'
            )}
          >
            {label}
            {required && (
              <span className="ml-1 text-semantic-error" aria-label="required">
                *
              </span>
            )}
          </label>
          {textareaElement}
          {(helperText || errorText) && (
            <p
              id={`${textareaId}-description`}
              className={cn(
                'text-sm',
                hasError ? 'text-semantic-error' : 'text-foreground-secondary'
              )}
            >
              {errorText || helperText}
            </p>
          )}
        </div>
      )
    }

    return (
      <div className={cn(fullWidth && 'w-full')}>
        {textareaElement}
        {(helperText || errorText) && (
          <p
            id={`${textareaId}-description`}
            className={cn(
              'mt-2 text-sm',
              hasError ? 'text-semantic-error' : 'text-foreground-secondary'
            )}
          >
            {errorText || helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
