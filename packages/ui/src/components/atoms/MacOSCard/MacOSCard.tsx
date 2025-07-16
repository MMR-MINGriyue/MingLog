/**
 * macOS风格卡片组件
 * 基于Apple Human Interface Guidelines设计
 */

import React, { forwardRef, useState } from 'react';
import { macosDesignTokens } from '../../../design-system/macos-tokens';

/**
 * 卡片变体
 */
export type MacOSCardVariant = 
  | 'default'      // 默认样式
  | 'elevated'     // 悬浮样式
  | 'outlined'     // 轮廓样式
  | 'filled'       // 填充样式
  | 'vibrancy';    // 毛玻璃样式

/**
 * 卡片尺寸
 */
export type MacOSCardSize = 
  | 'small'        // 小尺寸
  | 'medium'       // 中等尺寸
  | 'large';       // 大尺寸

/**
 * 卡片属性接口
 */
export interface MacOSCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 卡片变体 */
  variant?: MacOSCardVariant;
  /** 卡片尺寸 */
  size?: MacOSCardSize;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否可悬停 */
  hoverable?: boolean;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 卡片标题 */
  title?: React.ReactNode;
  /** 卡片副标题 */
  subtitle?: React.ReactNode;
  /** 头部额外内容 */
  extra?: React.ReactNode;
  /** 卡片封面 */
  cover?: React.ReactNode;
  /** 卡片操作区域 */
  actions?: React.ReactNode[];
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 自定义头部类名 */
  headerClassName?: string;
  /** 自定义内容类名 */
  bodyClassName?: string;
  /** 自定义底部类名 */
  footerClassName?: string;
  /** 子元素 */
  children?: React.ReactNode;
}

/**
 * 获取卡片样式
 */
function getCardStyles(
  variant: MacOSCardVariant,
  size: MacOSCardSize,
  clickable: boolean,
  hoverable: boolean,
  bordered: boolean,
  isHovered: boolean,
  isPressed: boolean
): React.CSSProperties {
  // 基础样式
  const baseStyles: React.CSSProperties = {
    borderRadius: macosDesignTokens.borderRadius.semantic.card,
    transition: `all ${macosDesignTokens.animation.duration.short} ${macosDesignTokens.animation.easing.standard}`,
    position: 'relative',
    overflow: 'hidden',
    cursor: clickable ? 'pointer' : 'default',
    userSelect: 'none',
    WebkitUserSelect: 'none'
  };

  // 尺寸样式
  const sizeStyles: Record<MacOSCardSize, React.CSSProperties> = {
    small: {
      padding: macosDesignTokens.spacing.semantic.padding.sm
    },
    medium: {
      padding: macosDesignTokens.spacing.semantic.padding.md
    },
    large: {
      padding: macosDesignTokens.spacing.semantic.padding.lg
    }
  };

  // 变体样式
  const variantStyles: Record<MacOSCardVariant, React.CSSProperties> = {
    default: {
      backgroundColor: 'var(--macos-bg-secondary)',
      border: bordered ? '1px solid var(--macos-separator-primary)' : 'none',
      boxShadow: macosDesignTokens.shadows.semantic.card
    },
    elevated: {
      backgroundColor: 'var(--macos-bg-primary)',
      border: 'none',
      boxShadow: macosDesignTokens.shadows.level2
    },
    outlined: {
      backgroundColor: 'transparent',
      border: '1px solid var(--macos-separator-primary)',
      boxShadow: 'none'
    },
    filled: {
      backgroundColor: 'var(--macos-fill-quaternary)',
      border: 'none',
      boxShadow: 'none'
    },
    vibrancy: {
      backgroundColor: 'var(--macos-vibrancy-popover)',
      backdropFilter: 'var(--macos-blur-vibrancy)',
      WebkitBackdropFilter: 'var(--macos-blur-vibrancy)',
      border: '1px solid var(--macos-separator-primary)',
      boxShadow: macosDesignTokens.shadows.level1
    }
  };

  // 交互状态样式
  let interactionStyles: React.CSSProperties = {};
  
  if (clickable || hoverable) {
    if (isPressed) {
      interactionStyles = {
        transform: 'scale(0.98)',
        boxShadow: variant === 'elevated' ? macosDesignTokens.shadows.level1 : 
                   variant === 'vibrancy' ? 'none' : 
                   macosDesignTokens.shadows.semantic.card
      };
    } else if (isHovered) {
      interactionStyles = {
        transform: 'translateY(-2px)',
        boxShadow: variant === 'elevated' ? macosDesignTokens.shadows.level3 : 
                   variant === 'vibrancy' ? macosDesignTokens.shadows.level2 : 
                   macosDesignTokens.shadows.level2
      };
    }
  }

  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...interactionStyles
  };
}

/**
 * 加载骨架屏组件
 */
const LoadingSkeleton: React.FC<{ size: MacOSCardSize }> = ({ size }) => {
  const skeletonStyles: React.CSSProperties = {
    background: 'linear-gradient(90deg, var(--macos-fill-quaternary) 25%, var(--macos-fill-tertiary) 50%, var(--macos-fill-quaternary) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: macosDesignTokens.borderRadius.sm
  };

  const lineHeight = size === 'small' ? '12px' : size === 'medium' ? '16px' : '20px';
  const spacing = size === 'small' ? '8px' : size === 'medium' ? '12px' : '16px';

  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}
      </style>
      <div>
        {/* 标题骨架 */}
        <div style={{ ...skeletonStyles, height: lineHeight, marginBottom: spacing, width: '60%' }} />
        
        {/* 内容骨架 */}
        <div style={{ ...skeletonStyles, height: lineHeight, marginBottom: spacing, width: '100%' }} />
        <div style={{ ...skeletonStyles, height: lineHeight, marginBottom: spacing, width: '80%' }} />
        <div style={{ ...skeletonStyles, height: lineHeight, width: '40%' }} />
      </div>
    </>
  );
};

/**
 * macOS风格卡片组件
 */
export const MacOSCard = forwardRef<HTMLDivElement, MacOSCardProps>(({
  variant = 'default',
  size = 'medium',
  clickable = false,
  hoverable = true,
  bordered = true,
  title,
  subtitle,
  extra,
  cover,
  actions,
  loading = false,
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  className = '',
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style,
  ...props
}, ref) => {
  // 状态管理
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // 获取卡片样式
  const cardStyles = getCardStyles(variant, size, clickable, hoverable, bordered, isHovered, isPressed);

  // 事件处理器
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverable || clickable) {
      setIsHovered(true);
    }
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(false);
    setIsPressed(false);
    onMouseLeave?.(e);
  };

  const handleMouseDown = () => {
    if (clickable) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (clickable && !loading) {
      onClick?.(e);
    }
  };

  // 头部样式
  const headerStyles: React.CSSProperties = {
    marginBottom: (title || subtitle) ? (size === 'small' ? '8px' : '12px') : '0',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  };

  // 标题样式
  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: size === 'small' ? 
      macosDesignTokens.typography.textStyles.footnote.fontSize :
      size === 'medium' ?
      macosDesignTokens.typography.textStyles.headline.fontSize :
      macosDesignTokens.typography.textStyles.title3.fontSize,
    fontWeight: 600,
    color: 'var(--macos-text-primary)',
    fontFamily: macosDesignTokens.typography.fontFamily.system,
    lineHeight: 1.2
  };

  // 副标题样式
  const subtitleStyles: React.CSSProperties = {
    margin: 0,
    marginTop: '4px',
    fontSize: macosDesignTokens.typography.textStyles.caption1.fontSize,
    color: 'var(--macos-text-secondary)',
    fontFamily: macosDesignTokens.typography.fontFamily.system,
    lineHeight: 1.3
  };

  // 内容样式
  const bodyStyles: React.CSSProperties = {
    color: 'var(--macos-text-primary)',
    fontSize: macosDesignTokens.typography.textStyles.body.fontSize,
    lineHeight: 1.4,
    fontFamily: macosDesignTokens.typography.fontFamily.system
  };

  // 底部样式
  const footerStyles: React.CSSProperties = {
    marginTop: actions ? (size === 'small' ? '12px' : '16px') : '0',
    display: 'flex',
    gap: macosDesignTokens.spacing.semantic.gap.sm,
    alignItems: 'center',
    justifyContent: 'flex-end'
  };

  return (
    <div
      ref={ref}
      className={`macos-card ${className}`}
      style={{ ...cardStyles, ...style }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {/* 封面 */}
      {cover && (
        <div style={{ 
          margin: `-${cardStyles.padding} -${cardStyles.padding} ${size === 'small' ? '8px' : '12px'} -${cardStyles.padding}`,
          borderRadius: `${macosDesignTokens.borderRadius.semantic.card} ${macosDesignTokens.borderRadius.semantic.card} 0 0`
        }}>
          {cover}
        </div>
      )}

      {/* 头部 */}
      {(title || subtitle || extra) && (
        <div className={headerClassName} style={headerStyles}>
          <div style={{ flex: 1 }}>
            {title && (
              <h3 style={titleStyles}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={subtitleStyles}>
                {subtitle}
              </p>
            )}
          </div>
          {extra && (
            <div style={{ marginLeft: '12px' }}>
              {extra}
            </div>
          )}
        </div>
      )}

      {/* 内容 */}
      <div className={bodyClassName} style={bodyStyles}>
        {loading ? <LoadingSkeleton size={size} /> : children}
      </div>

      {/* 底部操作 */}
      {actions && actions.length > 0 && (
        <div className={footerClassName} style={footerStyles}>
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              {action}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
});

MacOSCard.displayName = 'MacOSCard';

export default MacOSCard;
