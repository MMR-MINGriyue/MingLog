/**
 * macOS风格输入框组件
 * 基于Apple Human Interface Guidelines设计
 */

import React, { forwardRef, useState } from 'react';
import { macosDesignTokens } from '../../../design-system/macos-tokens';

/**
 * 输入框变体
 */
export type MacOSInputVariant = 
  | 'default'      // 默认样式
  | 'filled'       // 填充样式
  | 'outlined';    // 轮廓样式

/**
 * 输入框尺寸
 */
export type MacOSInputSize = 
  | 'small'        // 小尺寸
  | 'medium'       // 中等尺寸
  | 'large';       // 大尺寸

/**
 * 输入框属性接口
 */
export interface MacOSInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 输入框变体 */
  variant?: MacOSInputVariant;
  /** 输入框尺寸 */
  size?: MacOSInputSize;
  /** 标签文本 */
  label?: string;
  /** 帮助文本 */
  helperText?: string;
  /** 错误文本 */
  error?: string;
  /** 是否显示错误状态 */
  hasError?: boolean;
  /** 左侧图标 */
  leftIcon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 是否显示清除按钮 */
  clearable?: boolean;
  /** 清除按钮点击回调 */
  onClear?: () => void;
  /** 是否为全宽输入框 */
  fullWidth?: boolean;
  /** 容器类名 */
  containerClassName?: string;
  /** 标签类名 */
  labelClassName?: string;
}

/**
 * 获取输入框样式
 */
function getInputStyles(
  variant: MacOSInputVariant,
  size: MacOSInputSize,
  hasError: boolean,
  isFocused: boolean,
  disabled: boolean
): React.CSSProperties {
  // 基础样式
  const baseStyles: React.CSSProperties = {
    display: 'block',
    width: '100%',
    border: '1px solid var(--macos-separator-primary)',
    borderRadius: macosDesignTokens.borderRadius.semantic.input,
    fontFamily: macosDesignTokens.typography.fontFamily.system,
    transition: `all ${macosDesignTokens.animation.duration.short} ${macosDesignTokens.animation.easing.standard}`,
    outline: 'none',
    backgroundColor: 'var(--macos-bg-primary)',
    color: 'var(--macos-text-primary)',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'text'
  };

  // 尺寸样式
  const sizeStyles: Record<MacOSInputSize, React.CSSProperties> = {
    small: {
      padding: '6px 12px',
      fontSize: macosDesignTokens.typography.textStyles.footnote.fontSize,
      lineHeight: macosDesignTokens.typography.textStyles.footnote.lineHeight,
      minHeight: '28px'
    },
    medium: {
      padding: '8px 12px',
      fontSize: macosDesignTokens.typography.textStyles.body.fontSize,
      lineHeight: macosDesignTokens.typography.textStyles.body.lineHeight,
      minHeight: '32px'
    },
    large: {
      padding: '12px 16px',
      fontSize: macosDesignTokens.typography.textStyles.headline.fontSize,
      lineHeight: macosDesignTokens.typography.textStyles.headline.lineHeight,
      minHeight: '44px'
    }
  };

  // 变体样式
  const variantStyles: Record<MacOSInputVariant, React.CSSProperties> = {
    default: {
      backgroundColor: 'var(--macos-bg-primary)',
      border: '1px solid var(--macos-separator-primary)'
    },
    filled: {
      backgroundColor: 'var(--macos-fill-quaternary)',
      border: '1px solid transparent'
    },
    outlined: {
      backgroundColor: 'transparent',
      border: '2px solid var(--macos-separator-primary)'
    }
  };

  // 状态样式
  let stateStyles: React.CSSProperties = {};
  
  if (hasError) {
    stateStyles = {
      borderColor: 'var(--macos-system-red)',
      boxShadow: '0 0 0 3px rgba(255, 59, 48, 0.3)'
    };
  } else if (isFocused) {
    stateStyles = {
      borderColor: 'var(--macos-system-blue)',
      boxShadow: 'var(--macos-shadow-focus)'
    };
  }

  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...stateStyles
  };
}

/**
 * 清除按钮组件
 */
const ClearButton: React.FC<{
  onClick: () => void;
  size: MacOSInputSize;
}> = ({ onClick, size }) => {
  const buttonSize = size === 'small' ? 16 : size === 'medium' ? 18 : 20;
  
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: buttonSize,
        height: buttonSize,
        border: 'none',
        borderRadius: '50%',
        backgroundColor: 'var(--macos-fill-tertiary)',
        color: 'var(--macos-text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        transition: `all ${macosDesignTokens.animation.duration.shortest} ${macosDesignTokens.animation.easing.standard}`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--macos-fill-secondary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--macos-fill-tertiary)';
      }}
    >
      ×
    </button>
  );
};

/**
 * macOS风格输入框组件
 */
export const MacOSInput = forwardRef<HTMLInputElement, MacOSInputProps>(({
  variant = 'default',
  size = 'medium',
  label,
  helperText,
  error,
  hasError = false,
  leftIcon,
  rightIcon,
  clearable = false,
  onClear,
  fullWidth = true,
  containerClassName = '',
  labelClassName = '',
  className = '',
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  style,
  ...props
}, ref) => {
  // 状态管理
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');

  // 计算是否有错误
  const hasErrorState = hasError || !!error;

  // 计算是否显示清除按钮
  const showClearButton = clearable && !disabled && (value || internalValue);

  // 获取输入框样式
  const inputStyles = getInputStyles(variant, size, hasErrorState, isFocused, disabled);

  // 计算内边距（考虑图标）
  const paddingLeft = leftIcon ? '40px' : inputStyles.padding?.toString().split(' ')[1] || '12px';
  const paddingRight = (rightIcon || showClearButton) ? '40px' : inputStyles.padding?.toString().split(' ')[1] || '12px';

  // 事件处理器
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    onChange?.(e);
  };

  const handleClear = () => {
    setInternalValue('');
    onClear?.();
    
    // 触发onChange事件
    if (onChange) {
      const syntheticEvent = {
        target: { value: '' },
        currentTarget: { value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  // 容器样式
  const containerStyles: React.CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    position: 'relative'
  };

  // 标签样式
  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontSize: macosDesignTokens.typography.textStyles.footnote.fontSize,
    fontWeight: 500,
    color: hasErrorState ? 'var(--macos-system-red)' : 'var(--macos-text-primary)',
    fontFamily: macosDesignTokens.typography.fontFamily.system
  };

  // 帮助文本样式
  const helperTextStyles: React.CSSProperties = {
    marginTop: '4px',
    fontSize: macosDesignTokens.typography.textStyles.caption1.fontSize,
    color: hasErrorState ? 'var(--macos-system-red)' : 'var(--macos-text-secondary)',
    fontFamily: macosDesignTokens.typography.fontFamily.system
  };

  // 图标容器样式
  const iconContainerStyles: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--macos-text-tertiary)',
    pointerEvents: 'none',
    fontSize: size === 'small' ? '14px' : size === 'medium' ? '16px' : '18px'
  };

  return (
    <div className={containerClassName} style={containerStyles}>
      {/* 标签 */}
      {label && (
        <label className={labelClassName} style={labelStyles}>
          {label}
        </label>
      )}
      
      {/* 输入框容器 */}
      <div style={{ position: 'relative' }}>
        {/* 左侧图标 */}
        {leftIcon && (
          <div style={{ ...iconContainerStyles, left: '12px' }}>
            {leftIcon}
          </div>
        )}
        
        {/* 输入框 */}
        <input
          ref={ref}
          className={`macos-input ${className}`}
          style={{
            ...inputStyles,
            paddingLeft,
            paddingRight,
            ...style
          }}
          value={value !== undefined ? value : internalValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          {...props}
        />
        
        {/* 右侧图标 */}
        {rightIcon && !showClearButton && (
          <div style={{ ...iconContainerStyles, right: '12px' }}>
            {rightIcon}
          </div>
        )}
        
        {/* 清除按钮 */}
        {showClearButton && (
          <ClearButton onClick={handleClear} size={size} />
        )}
      </div>
      
      {/* 帮助文本或错误信息 */}
      {(helperText || error) && (
        <div style={helperTextStyles}>
          {error || helperText}
        </div>
      )}
    </div>
  );
});

MacOSInput.displayName = 'MacOSInput';

export default MacOSInput;
