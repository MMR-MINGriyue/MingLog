/**
 * macOS风格按钮组件
 * 基于Apple Human Interface Guidelines设计
 */

import React, { forwardRef } from 'react';
import { macosDesignTokens } from '../../../design-system/macos-tokens';

/**
 * 按钮变体
 */
export type MacOSButtonVariant = 
  | 'primary'      // 主要按钮 - 蓝色背景
  | 'secondary'    // 次要按钮 - 灰色背景
  | 'destructive'  // 危险按钮 - 红色背景
  | 'ghost'        // 幽灵按钮 - 透明背景
  | 'link';        // 链接按钮 - 无背景

/**
 * 按钮尺寸
 */
export type MacOSButtonSize = 
  | 'small'        // 小尺寸
  | 'medium'       // 中等尺寸
  | 'large';       // 大尺寸

/**
 * 按钮属性接口
 */
export interface MacOSButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  /** 按钮变体 */
  variant?: MacOSButtonVariant;
  /** 按钮尺寸 */
  size?: MacOSButtonSize;
  /** 是否为圆形按钮 */
  rounded?: boolean;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 左侧图标 */
  leftIcon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 是否为全宽按钮 */
  fullWidth?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 子元素 */
  children?: React.ReactNode;
}

/**
 * 获取按钮样式
 */
function getButtonStyles(
  variant: MacOSButtonVariant,
  size: MacOSButtonSize,
  rounded: boolean,
  fullWidth: boolean,
  loading: boolean,
  disabled: boolean
): React.CSSProperties {
  // 基础样式
  const baseStyles: React.CSSProperties = {
    display: fullWidth ? 'flex' : 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: rounded ? '50%' : macosDesignTokens.borderRadius.semantic.button,
    fontFamily: macosDesignTokens.typography.fontFamily.system,
    fontWeight: 400,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: `all ${macosDesignTokens.animation.duration.short} ${macosDesignTokens.animation.easing.standard}`,
    outline: 'none',
    position: 'relative',
    overflow: 'hidden',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.5 : 1,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTapHighlightColor: 'transparent'
  };

  // 尺寸样式
  const sizeStyles: Record<MacOSButtonSize, React.CSSProperties> = {
    small: {
      padding: rounded ? '6px' : '4px 12px',
      fontSize: macosDesignTokens.typography.textStyles.caption1.fontSize,
      lineHeight: macosDesignTokens.typography.textStyles.caption1.lineHeight,
      minHeight: '28px',
      minWidth: rounded ? '28px' : '60px'
    },
    medium: {
      padding: rounded ? '8px' : '6px 16px',
      fontSize: macosDesignTokens.typography.textStyles.body.fontSize,
      lineHeight: macosDesignTokens.typography.textStyles.body.lineHeight,
      minHeight: '32px',
      minWidth: rounded ? '32px' : '80px'
    },
    large: {
      padding: rounded ? '12px' : '10px 24px',
      fontSize: macosDesignTokens.typography.textStyles.headline.fontSize,
      lineHeight: macosDesignTokens.typography.textStyles.headline.lineHeight,
      minHeight: '44px',
      minWidth: rounded ? '44px' : '120px'
    }
  };

  // 变体样式
  const variantStyles: Record<MacOSButtonVariant, React.CSSProperties> = {
    primary: {
      background: 'var(--macos-system-blue)',
      color: 'white',
      border: 'none'
    },
    secondary: {
      background: 'var(--macos-fill-quaternary)',
      color: 'var(--macos-text-primary)',
      border: '1px solid var(--macos-separator-primary)'
    },
    destructive: {
      background: 'var(--macos-system-red)',
      color: 'white',
      border: 'none'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--macos-text-primary)',
      border: 'none'
    },
    link: {
      background: 'transparent',
      color: 'var(--macos-text-link)',
      border: 'none',
      textDecoration: 'none',
      padding: '0'
    }
  };

  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant]
  };
}

/**
 * 加载指示器组件
 */
const LoadingSpinner: React.FC<{ size: MacOSButtonSize }> = ({ size }) => {
  const spinnerSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;
  
  return (
    <div
      style={{
        width: spinnerSize,
        height: spinnerSize,
        border: '2px solid currentColor',
        borderTop: '2px solid transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginRight: '8px'
      }}
    />
  );
};

/**
 * macOS风格按钮组件
 */
export const MacOSButton = forwardRef<HTMLButtonElement, MacOSButtonProps>(({
  variant = 'secondary',
  size = 'medium',
  rounded = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  children,
  disabled = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  style,
  ...props
}, ref) => {
  // 状态管理
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  // 获取按钮样式
  const buttonStyles = getButtonStyles(variant, size, rounded, fullWidth, loading, disabled);

  // 处理悬停效果
  const getHoverStyles = (): React.CSSProperties => {
    if (disabled || loading) return {};
    
    if (!isHovered && !isFocused && !isPressed) return {};

    const hoverStyles: Record<MacOSButtonVariant, React.CSSProperties> = {
      primary: {
        background: 'color-mix(in srgb, var(--macos-system-blue) 90%, black)',
        transform: isPressed ? 'scale(0.98)' : 'none'
      },
      secondary: {
        background: 'var(--macos-fill-tertiary)',
        transform: isPressed ? 'scale(0.98)' : 'none'
      },
      destructive: {
        background: 'color-mix(in srgb, var(--macos-system-red) 90%, black)',
        transform: isPressed ? 'scale(0.98)' : 'none'
      },
      ghost: {
        background: 'var(--macos-fill-quaternary)',
        transform: isPressed ? 'scale(0.98)' : 'none'
      },
      link: {
        textDecoration: 'underline',
        transform: isPressed ? 'scale(0.98)' : 'none'
      }
    };

    return hoverStyles[variant];
  };

  // 处理焦点样式
  const getFocusStyles = (): React.CSSProperties => {
    if (!isFocused || disabled || loading) return {};
    
    return {
      boxShadow: 'var(--macos-shadow-focus)'
    };
  };

  // 事件处理器
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    setIsPressed(false);
    onMouseLeave?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  // 合并样式
  const finalStyles: React.CSSProperties = {
    ...buttonStyles,
    ...getHoverStyles(),
    ...getFocusStyles(),
    ...style
  };

  return (
    <>
      {/* 添加旋转动画的CSS */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <button
        ref={ref}
        className={`macos-button ${className}`}
        style={finalStyles}
        disabled={disabled || loading}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        {...props}
      >
        {/* 加载状态 */}
        {loading && <LoadingSpinner size={size} />}
        
        {/* 左侧图标 */}
        {leftIcon && !loading && (
          <span style={{ marginRight: children ? '8px' : '0' }}>
            {leftIcon}
          </span>
        )}
        
        {/* 按钮文本 */}
        {children && (
          <span style={{ 
            opacity: loading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center'
          }}>
            {children}
          </span>
        )}
        
        {/* 右侧图标 */}
        {rightIcon && !loading && (
          <span style={{ marginLeft: children ? '8px' : '0' }}>
            {rightIcon}
          </span>
        )}
      </button>
    </>
  );
});

MacOSButton.displayName = 'MacOSButton';

export default MacOSButton;
