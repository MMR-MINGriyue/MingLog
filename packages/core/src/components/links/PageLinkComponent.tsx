/**
 * MingLog 页面链接组件
 * 支持页面链接的渲染、点击交互和悬停提示
 */

import React, { useState, useCallback, useRef } from 'react';
import { PageLink } from '../../types/links';
import { LinkTooltip } from './LinkTooltip';

export interface PageLinkComponentProps {
  /** 页面链接数据 */
  link: PageLink;
  /** 链接是否存在 */
  exists?: boolean;
  /** 是否显示悬停提示 */
  showTooltip?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 点击事件处理 */
  onClick?: (pageName: string, link: PageLink) => void;
  /** 悬停事件处理 */
  onHover?: (pageName: string, link: PageLink) => void;
  /** 右键菜单事件处理 */
  onContextMenu?: (event: React.MouseEvent, pageName: string, link: PageLink) => void;
  /** 是否禁用点击 */
  disabled?: boolean;
  /** 链接预览内容 */
  previewContent?: string;
}

export const PageLinkComponent: React.FC<PageLinkComponentProps> = ({
  link,
  exists = true,
  showTooltip = true,
  className = '',
  style,
  onClick,
  onHover,
  onContextMenu,
  disabled = false,
  previewContent
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const linkRef = useRef<HTMLSpanElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  // 构建CSS类名
  const linkClassName = [
    'page-link',
    exists ? 'page-link--exists' : 'page-link--broken',
    disabled ? 'page-link--disabled' : 'page-link--interactive',
    isHovered ? 'page-link--hovered' : '',
    className
  ].filter(Boolean).join(' ');

  // 处理点击事件
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (disabled) return;
    
    if (onClick) {
      onClick(link.pageName, link);
    } else if (exists) {
      // 默认行为：导航到页面
      console.log(`Navigate to page: ${link.pageName}`);
    } else {
      // 默认行为：创建新页面
      console.log(`Create new page: ${link.pageName}`);
    }
  }, [disabled, onClick, link, exists]);

  // 处理鼠标进入
  const handleMouseEnter = useCallback((event: React.MouseEvent) => {
    if (disabled || !showTooltip) return;

    // 清除之前的延时
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // 延时显示提示
    hoverTimeoutRef.current = setTimeout(() => {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8
      });
      setIsHovered(true);
      
      if (onHover) {
        onHover(link.pageName, link);
      }
    }, 500); // 500ms延时
  }, [disabled, showTooltip, onHover, link]);

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
      onContextMenu(event, link.pageName, link);
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

  // 生成提示标题
  const getTitle = useCallback(() => {
    if (exists) {
      return `跳转到页面: ${link.pageName}`;
    } else {
      return `创建新页面: ${link.pageName}`;
    }
  }, [exists, link.pageName]);

  // 生成ARIA标签
  const getAriaLabel = useCallback(() => {
    const action = exists ? '跳转到' : '创建';
    const alias = link.alias ? ` (显示为: ${link.alias})` : '';
    return `${action}页面 ${link.pageName}${alias}`;
  }, [exists, link.pageName, link.alias]);

  return (
    <>
      <span
        ref={linkRef}
        className={linkClassName}
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
        data-page-name={link.pageName}
        data-exists={exists}
        data-testid="page-link"
      >
        {link.displayText}
      </span>

      {/* 悬停提示 */}
      {isHovered && showTooltip && (
        <LinkTooltip
          position={tooltipPosition}
          pageName={link.pageName}
          exists={exists}
          previewContent={previewContent}
          alias={link.alias}
          onClose={() => setIsHovered(false)}
        />
      )}
    </>
  );
};

// 默认样式（可以通过CSS覆盖）
export const pageLinkStyles = `
.page-link {
  cursor: pointer;
  text-decoration: none;
  border-radius: 3px;
  padding: 1px 2px;
  transition: all 0.2s ease;
  position: relative;
  display: inline;
}

.page-link--exists {
  color: #0066cc;
  background-color: rgba(0, 102, 204, 0.1);
}

.page-link--exists:hover {
  background-color: rgba(0, 102, 204, 0.2);
  text-decoration: underline;
}

.page-link--broken {
  color: #cc6600;
  background-color: rgba(204, 102, 0, 0.1);
  border-bottom: 1px dashed #cc6600;
}

.page-link--broken:hover {
  background-color: rgba(204, 102, 0, 0.2);
}

.page-link--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.page-link--hovered {
  z-index: 1000;
}

.page-link:focus {
  outline: 2px solid #0066cc;
  outline-offset: 1px;
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .page-link--exists {
    color: #66b3ff;
    background-color: rgba(102, 179, 255, 0.1);
  }
  
  .page-link--broken {
    color: #ffb366;
    background-color: rgba(255, 179, 102, 0.1);
    border-bottom-color: #ffb366;
  }
}
`;

export default PageLinkComponent;
