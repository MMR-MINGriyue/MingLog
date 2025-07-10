/**
 * MingLog 链接提示组件
 * 显示页面链接的悬停提示信息
 */

import React, { useEffect, useRef } from 'react';

export interface LinkTooltipProps {
  /** 提示位置 */
  position: { x: number; y: number };
  /** 页面名称 */
  pageName: string;
  /** 页面是否存在 */
  exists: boolean;
  /** 预览内容 */
  previewContent?: string;
  /** 别名 */
  alias?: string;
  /** 关闭回调 */
  onClose: () => void;
  /** 最大宽度 */
  maxWidth?: number;
  /** 最大高度 */
  maxHeight?: number;
}

export const LinkTooltip: React.FC<LinkTooltipProps> = ({
  position,
  pageName,
  exists,
  previewContent,
  alias,
  onClose,
  maxWidth = 300,
  maxHeight = 200
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // 调整位置避免超出视窗
  const getAdjustedPosition = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let { x, y } = position;
    
    // 水平位置调整
    if (x + maxWidth > viewportWidth) {
      x = viewportWidth - maxWidth - 10;
    }
    if (x < 10) {
      x = 10;
    }
    
    // 垂直位置调整
    if (y + maxHeight > viewportHeight) {
      y = position.y - maxHeight - 16; // 显示在上方
    }
    if (y < 10) {
      y = 10;
    }
    
    return { x, y };
  };

  const adjustedPosition = getAdjustedPosition();

  // 生成预览内容
  const getPreviewText = () => {
    if (!exists) {
      return '此页面不存在，点击可创建新页面。';
    }
    
    if (previewContent) {
      // 限制预览长度
      const maxLength = 150;
      if (previewContent.length > maxLength) {
        return previewContent.substring(0, maxLength) + '...';
      }
      return previewContent;
    }
    
    return '点击跳转到此页面。';
  };

  return (
    <div
      ref={tooltipRef}
      className={`link-tooltip ${exists ? 'link-tooltip--exists' : 'link-tooltip--broken'}`}
      style={{
        position: 'fixed',
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        maxWidth,
        maxHeight,
        zIndex: 10000
      }}
      data-testid="link-tooltip"
    >
      {/* 箭头 */}
      <div className="link-tooltip__arrow" />
      
      {/* 头部 */}
      <div className="link-tooltip__header">
        <div className="link-tooltip__title">
          {exists ? '📄' : '➕'} {pageName}
        </div>
        {alias && alias !== pageName && (
          <div className="link-tooltip__alias">
            显示为: {alias}
          </div>
        )}
      </div>
      
      {/* 内容 */}
      <div className="link-tooltip__content">
        {getPreviewText()}
      </div>
      
      {/* 底部操作提示 */}
      <div className="link-tooltip__footer">
        <span className="link-tooltip__hint">
          {exists ? '点击跳转' : '点击创建'} • 右键更多选项
        </span>
      </div>
    </div>
  );
};

// 块预览提示组件
export interface BlockPreviewTooltipProps {
  /** 提示位置 */
  position: { x: number; y: number };
  /** 块ID */
  blockId: string;
  /** 块内容 */
  blockContent?: string;
  /** 块标题 */
  blockTitle?: string;
  /** 关闭回调 */
  onClose: () => void;
  /** 最大宽度 */
  maxWidth?: number;
  /** 最大高度 */
  maxHeight?: number;
}

export const BlockPreviewTooltip: React.FC<BlockPreviewTooltipProps> = ({
  position,
  blockId,
  blockContent,
  blockTitle,
  onClose,
  maxWidth = 350,
  maxHeight = 250
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // 调整位置
  const getAdjustedPosition = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let { x, y } = position;
    
    if (x + maxWidth > viewportWidth) {
      x = viewportWidth - maxWidth - 10;
    }
    if (x < 10) {
      x = 10;
    }
    
    if (y + maxHeight > viewportHeight) {
      y = position.y - maxHeight - 16;
    }
    if (y < 10) {
      y = 10;
    }
    
    return { x, y };
  };

  const adjustedPosition = getAdjustedPosition();

  return (
    <div
      ref={tooltipRef}
      className="block-preview-tooltip"
      style={{
        position: 'fixed',
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        maxWidth,
        maxHeight,
        zIndex: 10000
      }}
      data-testid="block-preview-tooltip"
    >
      {/* 箭头 */}
      <div className="block-preview-tooltip__arrow" />
      
      {/* 头部 */}
      <div className="block-preview-tooltip__header">
        <div className="block-preview-tooltip__title">
          🔗 {blockTitle || `块 ${blockId.slice(0, 8)}...`}
        </div>
        <div className="block-preview-tooltip__id">
          ID: {blockId}
        </div>
      </div>
      
      {/* 内容预览 */}
      <div className="block-preview-tooltip__content">
        {blockContent ? (
          <div className="block-preview-tooltip__text">
            {blockContent.length > 200 
              ? blockContent.substring(0, 200) + '...' 
              : blockContent
            }
          </div>
        ) : (
          <div className="block-preview-tooltip__placeholder">
            暂无预览内容
          </div>
        )}
      </div>
      
      {/* 底部 */}
      <div className="block-preview-tooltip__footer">
        <span className="block-preview-tooltip__hint">
          点击跳转到此块
        </span>
      </div>
    </div>
  );
};

// 样式
export const tooltipStyles = `
.link-tooltip,
.block-preview-tooltip {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  font-size: 14px;
  line-height: 1.4;
}

.link-tooltip__arrow,
.block-preview-tooltip__arrow {
  position: absolute;
  top: -6px;
  left: 20px;
  width: 12px;
  height: 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-bottom: none;
  border-right: none;
  transform: rotate(45deg);
}

.link-tooltip__header,
.block-preview-tooltip__header {
  padding: 12px 16px 8px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.link-tooltip__title,
.block-preview-tooltip__title {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.link-tooltip__alias {
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.block-preview-tooltip__id {
  font-size: 11px;
  color: #999;
  font-family: monospace;
}

.link-tooltip__content,
.block-preview-tooltip__content {
  padding: 12px 16px;
  color: #555;
  max-height: 120px;
  overflow-y: auto;
}

.block-preview-tooltip__text {
  white-space: pre-wrap;
  word-break: break-word;
}

.block-preview-tooltip__placeholder {
  color: #999;
  font-style: italic;
}

.link-tooltip__footer,
.block-preview-tooltip__footer {
  padding: 8px 16px;
  background: #f8f9fa;
  border-top: 1px solid #f0f0f0;
}

.link-tooltip__hint,
.block-preview-tooltip__hint {
  font-size: 11px;
  color: #666;
}

.link-tooltip--broken {
  border-color: #ffc107;
}

.link-tooltip--broken .link-tooltip__header {
  background: #fff3cd;
}

/* 深色主题 */
@media (prefers-color-scheme: dark) {
  .link-tooltip,
  .block-preview-tooltip {
    background: #2d3748;
    border-color: #4a5568;
    color: white;
  }
  
  .link-tooltip__arrow,
  .block-preview-tooltip__arrow {
    background: #2d3748;
    border-color: #4a5568;
  }
  
  .link-tooltip__header,
  .block-preview-tooltip__header {
    background: #4a5568;
    border-color: #718096;
  }
  
  .link-tooltip__footer,
  .block-preview-tooltip__footer {
    background: #4a5568;
    border-color: #718096;
  }
}
`;

export default LinkTooltip;
