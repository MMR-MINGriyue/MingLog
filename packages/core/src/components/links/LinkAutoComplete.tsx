/**
 * MingLog 链接自动补全组件
 * 在输入[[时显示页面建议，支持模糊匹配和键盘导航
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { LinkSuggestion } from '../../types/links';

export interface LinkAutoCompleteProps {
  /** 搜索查询 */
  query: string;
  /** 链接类型 */
  linkType: 'page' | 'block';
  /** 显示位置 */
  position: { x: number; y: number };
  /** 是否显示 */
  visible: boolean;
  /** 建议列表 */
  suggestions?: LinkSuggestion[];
  /** 加载状态 */
  loading?: boolean;
  /** 选择回调 */
  onSelect: (suggestion: LinkSuggestion) => void;
  /** 关闭回调 */
  onClose: () => void;
  /** 查询变化回调 */
  onQueryChange?: (query: string) => void;
  /** 最大显示数量 */
  maxItems?: number;
  /** 最大宽度 */
  maxWidth?: number;
  /** 最大高度 */
  maxHeight?: number;
  /** 是否显示创建新项选项 */
  showCreateOption?: boolean;
  /** 是否显示历史记录 */
  showHistory?: boolean;
  /** 历史记录 */
  history?: LinkSuggestion[];
}

export const LinkAutoComplete: React.FC<LinkAutoCompleteProps> = ({
  query,
  linkType,
  position,
  visible,
  suggestions = [],
  loading = false,
  onSelect,
  onClose,
  onQueryChange,
  maxItems = 10,
  maxWidth = 400,
  maxHeight = 300,
  showCreateOption = true,
  showHistory = true,
  history = []
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 合并建议和历史记录
  const allSuggestions = useMemo(() => {
    const items: LinkSuggestion[] = [];
    
    // 添加匹配的建议
    const filteredSuggestions = suggestions
      .filter(s => s.title.toLowerCase().includes(query.toLowerCase()) || 
                   s.preview.toLowerCase().includes(query.toLowerCase()))
      .slice(0, maxItems);
    
    items.push(...filteredSuggestions);
    
    // 添加历史记录（如果启用且有查询）
    if (showHistory && query.trim() && history.length > 0) {
      const filteredHistory = history
        .filter(h => h.title.toLowerCase().includes(query.toLowerCase()) &&
                     !items.some(s => s.id === h.id))
        .slice(0, Math.max(0, maxItems - items.length));
      
      if (filteredHistory.length > 0) {
        items.push(...filteredHistory.map(h => ({ ...h, matchType: 'history' as const })));
      }
    }
    
    // 添加创建新项选项
    if (showCreateOption && query.trim() && linkType === 'page') {
      const hasExactMatch = items.some(s => s.title.toLowerCase() === query.toLowerCase());
      if (!hasExactMatch) {
        items.push({
          id: `create-${query}`,
          title: query,
          type: 'page',
          preview: `创建新页面 "${query}"`,
          score: 0,
          matchType: 'create'
        });
      }
    }
    
    return items;
  }, [suggestions, history, query, maxItems, showHistory, showCreateOption, linkType]);

  // 重置选中索引当建议变化时
  useEffect(() => {
    setSelectedIndex(0);
    setHighlightedIndex(-1);
  }, [allSuggestions]);

  // 处理键盘导航
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!visible || allSuggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allSuggestions.length - 1));
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
        
      case 'Enter':
        event.preventDefault();
        if (allSuggestions[selectedIndex]) {
          onSelect(allSuggestions[selectedIndex]);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
        
      case 'Tab':
        event.preventDefault();
        if (allSuggestions[selectedIndex]) {
          onSelect(allSuggestions[selectedIndex]);
        }
        break;
    }
  }, [visible, allSuggestions, selectedIndex, onSelect, onClose]);

  // 绑定键盘事件
  useEffect(() => {
    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, handleKeyDown]);

  // 滚动到选中项
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  // 处理点击外部关闭
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [visible, onClose]);

  // 处理项目点击
  const handleItemClick = useCallback((suggestion: LinkSuggestion, index: number) => {
    setSelectedIndex(index);
    onSelect(suggestion);
  }, [onSelect]);

  // 处理鼠标悬停
  const handleItemHover = useCallback((index: number) => {
    setHighlightedIndex(index);
  }, []);

  // 高亮匹配文本
  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="link-autocomplete__highlight">{part}</mark>
      ) : part
    );
  }, []);

  // 获取项目图标
  const getItemIcon = useCallback((suggestion: LinkSuggestion) => {
    switch (suggestion.matchType) {
      case 'create':
        return '➕';
      case 'history':
        return '🕒';
      default:
        return suggestion.type === 'page' ? '📄' : '🧩';
    }
  }, []);

  // 获取项目样式类
  const getItemClassName = useCallback((index: number, suggestion: LinkSuggestion) => {
    const classes = ['link-autocomplete__item'];
    
    if (index === selectedIndex) {
      classes.push('link-autocomplete__item--selected');
    }
    
    if (index === highlightedIndex) {
      classes.push('link-autocomplete__item--highlighted');
    }
    
    if (suggestion.matchType) {
      classes.push(`link-autocomplete__item--${suggestion.matchType}`);
    }
    
    return classes.join(' ');
  }, [selectedIndex, highlightedIndex]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="link-autocomplete"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        maxWidth,
        maxHeight,
        zIndex: 10000
      }}
      data-testid="link-autocomplete"
    >
      {/* 头部 */}
      <div className="link-autocomplete__header">
        <span className="link-autocomplete__title">
          {linkType === 'page' ? '📄 页面链接' : '🧩 块引用'}
        </span>
        {query && (
          <span className="link-autocomplete__query">
            "{query}"
          </span>
        )}
      </div>

      {/* 内容 */}
      <div className="link-autocomplete__content">
        {loading ? (
          <div className="link-autocomplete__loading">
            <div className="link-autocomplete__spinner" />
            <span>搜索中...</span>
          </div>
        ) : allSuggestions.length === 0 ? (
          <div className="link-autocomplete__empty">
            <span className="link-autocomplete__empty-icon">🔍</span>
            <span className="link-autocomplete__empty-message">
              {query ? '没有找到匹配项' : '开始输入以搜索'}
            </span>
          </div>
        ) : (
          <div className="link-autocomplete__list">
            {allSuggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                ref={el => itemRefs.current[index] = el}
                className={getItemClassName(index, suggestion)}
                onClick={() => handleItemClick(suggestion, index)}
                onMouseEnter={() => handleItemHover(index)}
                data-testid="autocomplete-item"
              >
                <div className="link-autocomplete__item-icon">
                  {getItemIcon(suggestion)}
                </div>
                
                <div className="link-autocomplete__item-content">
                  <div className="link-autocomplete__item-title">
                    {highlightMatch(suggestion.title, query)}
                  </div>
                  
                  {suggestion.preview && (
                    <div className="link-autocomplete__item-preview">
                      {highlightMatch(suggestion.preview, query)}
                    </div>
                  )}
                </div>
                
                {suggestion.matchType === 'history' && (
                  <div className="link-autocomplete__item-badge">
                    历史
                  </div>
                )}
                
                {suggestion.matchType === 'create' && (
                  <div className="link-autocomplete__item-badge link-autocomplete__item-badge--create">
                    新建
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="link-autocomplete__footer">
        <span className="link-autocomplete__hint">
          ↑↓ 选择 • Enter 确认 • Esc 取消
        </span>
      </div>
    </div>
  );
};

// 样式
export const linkAutoCompleteStyles = `
.link-autocomplete {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  font-size: 14px;
  min-width: 250px;
}

.link-autocomplete__header {
  padding: 12px 16px 8px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  display: flex;
  align-items: center;
  gap: 8px;
}

.link-autocomplete__title {
  font-weight: 600;
  color: #333;
}

.link-autocomplete__query {
  font-family: monospace;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.link-autocomplete__content {
  max-height: 250px;
  overflow-y: auto;
}

.link-autocomplete__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 8px;
  color: #666;
}

.link-autocomplete__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #0066cc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.link-autocomplete__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  color: #666;
  gap: 8px;
}

.link-autocomplete__empty-icon {
  font-size: 24px;
  opacity: 0.5;
}

.link-autocomplete__list {
  padding: 4px 0;
}

.link-autocomplete__item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 12px;
}

.link-autocomplete__item:hover,
.link-autocomplete__item--highlighted {
  background: #f8f9fa;
}

.link-autocomplete__item--selected {
  background: #e3f2fd;
  border-left: 3px solid #0066cc;
}

.link-autocomplete__item--create {
  border-top: 1px solid #e0e0e0;
}

.link-autocomplete__item-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.link-autocomplete__item-content {
  flex: 1;
  min-width: 0;
}

.link-autocomplete__item-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  word-break: break-word;
}

.link-autocomplete__item-preview {
  font-size: 12px;
  color: #666;
  line-height: 1.3;
  word-break: break-word;
}

.link-autocomplete__item-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: #e9ecef;
  border-radius: 3px;
  color: #666;
  text-transform: uppercase;
  font-weight: 500;
}

.link-autocomplete__item-badge--create {
  background: #d4edda;
  color: #155724;
}

.link-autocomplete__highlight {
  background: #fff3cd;
  padding: 1px 2px;
  border-radius: 2px;
  font-weight: 600;
}

.link-autocomplete__footer {
  padding: 8px 16px;
  background: #f8f9fa;
  border-top: 1px solid #f0f0f0;
}

.link-autocomplete__hint {
  font-size: 11px;
  color: #666;
}

/* 深色主题 */
@media (prefers-color-scheme: dark) {
  .link-autocomplete {
    background: #2d3748;
    border-color: #4a5568;
    color: white;
  }
  
  .link-autocomplete__header {
    background: #4a5568;
    border-color: #718096;
  }
  
  .link-autocomplete__item:hover,
  .link-autocomplete__item--highlighted {
    background: #4a5568;
  }
  
  .link-autocomplete__item--selected {
    background: #2b6cb0;
  }
  
  .link-autocomplete__footer {
    background: #4a5568;
    border-color: #718096;
  }
}
`;

export default LinkAutoComplete;
