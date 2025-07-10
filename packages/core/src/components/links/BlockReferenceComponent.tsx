/**
 * MingLog 块引用组件
 * 支持块引用的显示、预览和交互
 */

import React, { useState, useCallback, useRef } from 'react';
import { BlockLink } from '../../types/links';
import { BlockPreviewTooltip } from './BlockPreviewTooltip';

export interface BlockReferenceComponentProps {
  /** 块引用数据 */
  link: BlockLink;
  /** 块是否存在 */
  exists?: boolean;
  /** 块内容预览 */
  blockContent?: string;
  /** 块标题 */
  blockTitle?: string;
  /** 是否显示预览提示 */
  showPreview?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 点击事件处理 */
  onClick?: (blockId: string, link: BlockLink) => void;
  /** 悬停事件处理 */
  onHover?: (blockId: string, link: BlockLink) => void;
  /** 右键菜单事件处理 */
  onContextMenu?: (event: React.MouseEvent, blockId: string, link: BlockLink) => void;
  /** 是否禁用点击 */
  disabled?: boolean;
  /** 显示模式 */
  displayMode?: 'inline' | 'block' | 'card';
}

export const BlockReferenceComponent: React.FC<BlockReferenceComponentProps> = ({
  link,
  exists = true,
  blockContent,
  blockTitle,
  showPreview = true,
  className = '',
  style,
  onClick,
  onHover,
  onContextMenu,
  disabled = false,
  displayMode = 'inline'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const blockRef = useRef<HTMLElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  // 构建CSS类名
  const blockClassName = [
    'block-reference',
    `block-reference--${displayMode}`,
    exists ? 'block-reference--exists' : 'block-reference--broken',
    disabled ? 'block-reference--disabled' : 'block-reference--interactive',
    isHovered ? 'block-reference--hovered' : '',
    className
  ].filter(Boolean).join(' ');

  // 处理点击事件
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (disabled) return;
    
    if (onClick) {
      onClick(link.blockId, link);
    } else if (exists) {
      // 默认行为：跳转到块
      console.log(`Navigate to block: ${link.blockId}`);
    } else {
      // 默认行为：显示错误信息
      console.log(`Block not found: ${link.blockId}`);
    }
  }, [disabled, onClick, link, exists]);

  // 处理鼠标进入
  const handleMouseEnter = useCallback((event: React.MouseEvent) => {
    if (disabled || !showPreview || !exists) return;

    // 清除之前的延时
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // 延时显示预览
    hoverTimeoutRef.current = setTimeout(() => {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8
      });
      setIsHovered(true);
      
      if (onHover) {
        onHover(link.blockId, link);
      }
    }, 300); // 300ms延时，比页面链接更快
  }, [disabled, showPreview, exists, onHover, link]);

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(false);
  }, []);

  // 处理右键菜单
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    
    if (onContextMenu) {
      onContextMenu(event, link.blockId, link);
    }
  }, [disabled, onContextMenu, link]);

  // 处理键盘事件
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event as any);
    }
  }, [disabled, handleClick]);

  // 生成显示文本
  const getDisplayText = useCallback(() => {
    if (!exists) {
      return '(已删除的块)';
    }
    
    if (displayMode === 'block' || displayMode === 'card') {
      return blockContent || `块引用 ${link.blockId.slice(0, 8)}...`;
    }
    
    return `((${link.blockId.slice(0, 8)}...))`;
  }, [exists, displayMode, blockContent, link.blockId]);

  // 生成提示标题
  const getTitle = useCallback(() => {
    if (!exists) {
      return `块不存在: ${link.blockId}`;
    }
    return `跳转到块: ${link.blockId}`;
  }, [exists, link.blockId]);

  // 生成ARIA标签
  const getAriaLabel = useCallback(() => {
    if (!exists) {
      return `已删除的块引用 ${link.blockId}`;
    }
    return `块引用 ${link.blockId}${blockTitle ? ` - ${blockTitle}` : ''}`;
  }, [exists, link.blockId, blockTitle]);

  // 渲染内联模式
  if (displayMode === 'inline') {
    return (
      <>
        <span
          ref={blockRef as React.RefObject<HTMLSpanElement>}
          className={blockClassName}
          style={style}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
          onKeyDown={handleKeyDown}
          title={getTitle()}
          role="link"
          tabIndex={disabled ? -1 : 0}
          aria-label={getAriaLabel()}
          data-block-id={link.blockId}
          data-exists={exists}
          data-testid="block-reference"
        >
          {getDisplayText()}
        </span>

        {/* 预览提示 */}
        {isHovered && showPreview && exists && (
          <BlockPreviewTooltip
            position={tooltipPosition}
            blockId={link.blockId}
            blockContent={blockContent}
            blockTitle={blockTitle}
            onClose={() => setIsHovered(false)}
          />
        )}
      </>
    );
  }

  // 渲染块模式或卡片模式
  const Element = displayMode === 'block' ? 'div' : 'div';
  
  return (
    <>
      <Element
        ref={blockRef as React.RefObject<HTMLDivElement>}
        className={blockClassName}
        style={style}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        title={getTitle()}
        role="link"
        tabIndex={disabled ? -1 : 0}
        aria-label={getAriaLabel()}
        data-block-id={link.blockId}
        data-exists={exists}
        data-testid="block-reference"
      >
        {displayMode === 'card' && (
          <div className="block-reference__header">
            <span className="block-reference__icon">🔗</span>
            <span className="block-reference__title">
              {blockTitle || `块 ${link.blockId.slice(0, 8)}...`}
            </span>
          </div>
        )}
        
        <div className="block-reference__content">
          {getDisplayText()}
        </div>
        
        {displayMode === 'card' && (
          <div className="block-reference__meta">
            <span className="block-reference__id">ID: {link.blockId}</span>
          </div>
        )}
      </Element>

      {/* 预览提示 */}
      {isHovered && showPreview && exists && displayMode === 'inline' && (
        <BlockPreviewTooltip
          position={tooltipPosition}
          blockId={link.blockId}
          blockContent={blockContent}
          blockTitle={blockTitle}
          onClose={() => setIsHovered(false)}
        />
      )}
    </>
  );
};

// 默认样式
export const blockReferenceStyles = `
.block-reference {
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.block-reference--inline {
  display: inline;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

.block-reference--block {
  display: block;
  padding: 8px 12px;
  margin: 4px 0;
  border-left: 3px solid #0066cc;
  background-color: rgba(0, 102, 204, 0.05);
  border-radius: 0 4px 4px 0;
}

.block-reference--card {
  display: block;
  padding: 12px;
  margin: 8px 0;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: #fafafa;
}

.block-reference--exists {
  color: #0066cc;
  background-color: rgba(0, 102, 204, 0.1);
}

.block-reference--broken {
  color: #999;
  background-color: rgba(153, 153, 153, 0.1);
  text-decoration: line-through;
}

.block-reference--exists:hover {
  background-color: rgba(0, 102, 204, 0.2);
}

.block-reference--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.block-reference__header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
}

.block-reference__icon {
  margin-right: 6px;
}

.block-reference__title {
  flex: 1;
}

.block-reference__content {
  line-height: 1.4;
}

.block-reference__meta {
  margin-top: 8px;
  font-size: 0.8em;
  color: #666;
}

.block-reference:focus {
  outline: 2px solid #0066cc;
  outline-offset: 1px;
}
`;

export default BlockReferenceComponent;
