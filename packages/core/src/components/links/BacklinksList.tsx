/**
 * MingLog 反向链接列表组件
 * 支持链接分组和过滤显示
 */

import React, { useCallback, useState } from 'react';
import { BacklinkInfo } from '../../types/links';

export interface BacklinksListProps {
  /** 分组的反向链接数据 */
  groupedBacklinks: Record<string, BacklinkInfo[]>;
  /** 链接点击回调 */
  onLinkClick?: (backlink: BacklinkInfo) => void;
  /** 是否显示分组标题 */
  showGroupHeaders?: boolean;
  /** 是否显示上下文 */
  showContext?: boolean;
  /** 上下文最大长度 */
  maxContextLength?: number;
}

export const BacklinksList: React.FC<BacklinksListProps> = ({
  groupedBacklinks,
  onLinkClick,
  showGroupHeaders = true,
  showContext = true,
  maxContextLength = 100
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(Object.keys(groupedBacklinks)));

  // 切换分组展开状态
  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  }, []);

  // 处理链接点击
  const handleLinkClick = useCallback((backlink: BacklinkInfo, event: React.MouseEvent) => {
    event.preventDefault();
    if (onLinkClick) {
      onLinkClick(backlink);
    }
  }, [onLinkClick]);

  // 格式化时间
  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString();
    }
  }, []);

  // 截断上下文
  const truncateContext = useCallback((context: string, maxLength: number) => {
    if (context.length <= maxLength) {
      return context;
    }
    return context.substring(0, maxLength) + '...';
  }, []);

  // 高亮搜索词（如果需要的话）
  const highlightText = useCallback((text: string, highlight?: string) => {
    if (!highlight) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={index} className="backlinks-list__highlight">{part}</mark>
      ) : part
    );
  }, []);

  return (
    <div className="backlinks-list" data-testid="backlinks-list">
      {Object.entries(groupedBacklinks).map(([groupName, backlinks]) => (
        <div key={groupName} className="backlinks-list__group">
          {/* 分组标题 */}
          {showGroupHeaders && Object.keys(groupedBacklinks).length > 1 && (
            <div 
              className="backlinks-list__group-header"
              onClick={() => toggleGroup(groupName)}
            >
              <span className={`backlinks-list__group-toggle ${expandedGroups.has(groupName) ? 'expanded' : ''}`}>
                ▶
              </span>
              <span className="backlinks-list__group-title">{groupName}</span>
              <span className="backlinks-list__group-count">({backlinks.length})</span>
            </div>
          )}

          {/* 链接列表 */}
          {(!showGroupHeaders || expandedGroups.has(groupName)) && (
            <div className="backlinks-list__items">
              {backlinks.map((backlink, index) => (
                <BacklinkItem
                  key={`${backlink.id}-${index}`}
                  backlink={backlink}
                  onClick={handleLinkClick}
                  showContext={showContext}
                  maxContextLength={maxContextLength}
                  formatTime={formatTime}
                  truncateContext={truncateContext}
                  highlightText={highlightText}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// 单个反向链接项组件
interface BacklinkItemProps {
  backlink: BacklinkInfo;
  onClick: (backlink: BacklinkInfo, event: React.MouseEvent) => void;
  showContext: boolean;
  maxContextLength: number;
  formatTime: (dateString: string) => string;
  truncateContext: (context: string, maxLength: number) => string;
  highlightText: (text: string, highlight?: string) => React.ReactNode;
}

const BacklinkItem: React.FC<BacklinkItemProps> = ({
  backlink,
  onClick,
  showContext,
  maxContextLength,
  formatTime,
  truncateContext,
  highlightText
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`backlinks-list__item ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="backlink-item"
    >
      {/* 来源信息 */}
      <div className="backlinks-list__item-header">
        <button
          className="backlinks-list__source-link"
          onClick={(e) => onClick(backlink, e)}
          title={`跳转到 ${backlink.sourceTitle || backlink.sourceId}`}
        >
          <span className="backlinks-list__source-icon">
            {backlink.sourceType === 'page' ? '📄' : '🧩'}
          </span>
          <span className="backlinks-list__source-title">
            {backlink.sourceTitle || backlink.sourceId}
          </span>
        </button>

        <div className="backlinks-list__item-meta">
          <span className="backlinks-list__link-type">
            {backlink.linkType === 'page-reference' ? '页面引用' : '块引用'}
          </span>
          <span className="backlinks-list__time">
            {formatTime(backlink.createdAt)}
          </span>
        </div>
      </div>

      {/* 上下文 */}
      {showContext && backlink.context && (
        <div className="backlinks-list__context">
          <div className="backlinks-list__context-text">
            {highlightText(truncateContext(backlink.context, maxContextLength))}
          </div>
          {backlink.position !== undefined && (
            <div className="backlinks-list__position">
              位置: {backlink.position}
            </div>
          )}
        </div>
      )}

      {/* 悬停时显示的额外信息 */}
      {isHovered && (
        <div className="backlinks-list__item-actions">
          <button
            className="backlinks-list__action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClick(backlink, e);
            }}
            title="跳转到此链接"
          >
            🔗 跳转
          </button>
          
          <button
            className="backlinks-list__action-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(backlink.sourceId);
            }}
            title="复制来源ID"
          >
            📋 复制
          </button>
        </div>
      )}
    </div>
  );
};

// 样式
export const backlinksListStyles = `
.backlinks-list {
  height: 100%;
  overflow-y: auto;
}

.backlinks-list__group {
  margin-bottom: 8px;
}

.backlinks-list__group-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.backlinks-list__group-header:hover {
  background: #e9ecef;
}

.backlinks-list__group-toggle {
  margin-right: 8px;
  transition: transform 0.2s;
  font-size: 12px;
}

.backlinks-list__group-toggle.expanded {
  transform: rotate(90deg);
}

.backlinks-list__group-title {
  flex: 1;
  font-weight: 500;
}

.backlinks-list__group-count {
  font-size: 12px;
  color: #666;
}

.backlinks-list__items {
  padding-left: 8px;
}

.backlinks-list__item {
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 8px;
  background: white;
  transition: all 0.2s;
  position: relative;
}

.backlinks-list__item:hover,
.backlinks-list__item.hovered {
  border-color: #0066cc;
  box-shadow: 0 2px 8px rgba(0, 102, 204, 0.1);
}

.backlinks-list__item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.backlinks-list__source-link {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #0066cc;
  text-decoration: none;
  flex: 1;
  text-align: left;
}

.backlinks-list__source-link:hover {
  text-decoration: underline;
}

.backlinks-list__source-icon {
  margin-right: 6px;
}

.backlinks-list__source-title {
  font-weight: 500;
}

.backlinks-list__item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.backlinks-list__link-type {
  padding: 2px 6px;
  background: #e9ecef;
  border-radius: 3px;
}

.backlinks-list__context {
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  border-left: 3px solid #0066cc;
}

.backlinks-list__context-text {
  line-height: 1.4;
  color: #555;
}

.backlinks-list__position {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.backlinks-list__highlight {
  background: #fff3cd;
  padding: 1px 2px;
  border-radius: 2px;
}

.backlinks-list__item-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  background: white;
  padding: 4px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.backlinks-list__action-btn {
  padding: 4px 8px;
  border: 1px solid #dee2e6;
  border-radius: 3px;
  background: white;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

.backlinks-list__action-btn:hover {
  background: #f8f9fa;
  border-color: #0066cc;
}

/* 深色主题 */
@media (prefers-color-scheme: dark) {
  .backlinks-list__group-header {
    background: #4a5568;
    color: white;
  }
  
  .backlinks-list__item {
    background: #2d3748;
    border-color: #4a5568;
    color: white;
  }
  
  .backlinks-list__context {
    background: #4a5568;
  }
  
  .backlinks-list__item-actions {
    background: #2d3748;
  }
  
  .backlinks-list__action-btn {
    background: #4a5568;
    border-color: #718096;
    color: white;
  }
}
`;

export default BacklinksList;
