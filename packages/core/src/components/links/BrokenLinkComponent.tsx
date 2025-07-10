/**
 * MingLog 损坏链接组件
 * 用于显示和处理损坏的链接语法
 */

import React, { useState, useCallback } from 'react';
import { BrokenLink } from '../../types/links';

export interface BrokenLinkComponentProps {
  /** 损坏链接数据 */
  brokenLink: BrokenLink;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 修复点击事件处理 */
  onFix?: (brokenLink: BrokenLink, fixedText: string) => void;
  /** 删除点击事件处理 */
  onRemove?: (brokenLink: BrokenLink) => void;
  /** 忽略点击事件处理 */
  onIgnore?: (brokenLink: BrokenLink) => void;
  /** 是否显示修复建议 */
  showFixSuggestions?: boolean;
  /** 是否可编辑 */
  editable?: boolean;
}

export const BrokenLinkComponent: React.FC<BrokenLinkComponentProps> = ({
  brokenLink,
  className = '',
  style,
  onFix,
  onRemove,
  onIgnore,
  showFixSuggestions = true,
  editable = true
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(brokenLink.originalText);

  // 构建CSS类名
  const linkClassName = [
    'broken-link',
    showActions ? 'broken-link--active' : '',
    className
  ].filter(Boolean).join(' ');

  // 生成修复建议
  const getFixSuggestions = useCallback(() => {
    const text = brokenLink.originalText;
    const suggestions: string[] = [];

    // 根据不同的错误类型生成建议
    switch (brokenLink.reason) {
      case '不完整的页面链接语法':
        if (text.startsWith('[[') && !text.endsWith(']]')) {
          suggestions.push(text + ']]');
        } else if (!text.startsWith('[[') && text.endsWith(']]')) {
          suggestions.push('[[' + text);
        }
        break;
        
      case '不完整的块引用语法':
        if (text.startsWith('((') && !text.endsWith('))')) {
          suggestions.push(text + '))');
        } else if (!text.startsWith('((') && text.endsWith('))')) {
          suggestions.push('((' + text);
        }
        break;
        
      case '嵌套的页面链接':
        // 提取内层链接
        const innerMatch = text.match(/\[\[([^\]]+)\]\]/);
        if (innerMatch) {
          suggestions.push(innerMatch[0]);
        }
        break;
        
      case '嵌套的块引用':
        // 提取内层引用
        const innerBlockMatch = text.match(/\(\(([^)]+)\)\)/);
        if (innerBlockMatch) {
          suggestions.push(innerBlockMatch[0]);
        }
        break;
        
      default:
        // 通用修复：移除特殊字符
        const cleaned = text.replace(/[[\]()]/g, '');
        if (cleaned.trim()) {
          suggestions.push(`[[${cleaned.trim()}]]`);
          suggestions.push(`((${cleaned.trim()}))`);
        }
    }

    return suggestions;
  }, [brokenLink]);

  // 处理修复
  const handleFix = useCallback((fixedText: string) => {
    if (onFix) {
      onFix(brokenLink, fixedText);
    }
    setShowActions(false);
    setIsEditing(false);
  }, [onFix, brokenLink]);

  // 处理删除
  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove(brokenLink);
    }
    setShowActions(false);
  }, [onRemove, brokenLink]);

  // 处理忽略
  const handleIgnore = useCallback(() => {
    if (onIgnore) {
      onIgnore(brokenLink);
    }
    setShowActions(false);
  }, [onIgnore, brokenLink]);

  // 处理编辑保存
  const handleEditSave = useCallback(() => {
    if (editValue.trim() && editValue !== brokenLink.originalText) {
      handleFix(editValue.trim());
    } else {
      setIsEditing(false);
    }
  }, [editValue, brokenLink.originalText, handleFix]);

  // 处理编辑取消
  const handleEditCancel = useCallback(() => {
    setEditValue(brokenLink.originalText);
    setIsEditing(false);
  }, [brokenLink.originalText]);

  // 处理键盘事件
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleEditSave();
    } else if (event.key === 'Escape') {
      handleEditCancel();
    }
  }, [handleEditSave, handleEditCancel]);

  const fixSuggestions = getFixSuggestions();

  return (
    <span
      className={linkClassName}
      style={style}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => !isEditing && setShowActions(false)}
      data-testid="broken-link"
      data-reason={brokenLink.reason}
    >
      {/* 损坏的链接文本 */}
      {!isEditing ? (
        <span 
          className="broken-link__text"
          title={`损坏的链接: ${brokenLink.reason}`}
        >
          {brokenLink.originalText}
        </span>
      ) : (
        <input
          className="broken-link__edit-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleEditSave}
          autoFocus
          size={editValue.length || 10}
        />
      )}

      {/* 错误指示器 */}
      <span className="broken-link__indicator" title={brokenLink.reason}>
        ⚠️
      </span>

      {/* 操作面板 */}
      {showActions && editable && (
        <div className="broken-link__actions">
          <div className="broken-link__actions-header">
            <span className="broken-link__error-message">
              {brokenLink.reason}
            </span>
          </div>

          {/* 修复建议 */}
          {showFixSuggestions && fixSuggestions.length > 0 && (
            <div className="broken-link__suggestions">
              <div className="broken-link__suggestions-title">修复建议:</div>
              {fixSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="broken-link__suggestion-btn"
                  onClick={() => handleFix(suggestion)}
                  title={`应用修复: ${suggestion}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="broken-link__action-buttons">
            <button
              className="broken-link__action-btn broken-link__action-btn--edit"
              onClick={() => setIsEditing(true)}
              title="手动编辑"
            >
              ✏️ 编辑
            </button>
            
            <button
              className="broken-link__action-btn broken-link__action-btn--remove"
              onClick={handleRemove}
              title="删除此链接"
            >
              🗑️ 删除
            </button>
            
            <button
              className="broken-link__action-btn broken-link__action-btn--ignore"
              onClick={handleIgnore}
              title="忽略此错误"
            >
              👁️ 忽略
            </button>
          </div>
        </div>
      )}
    </span>
  );
};

// 默认样式
export const brokenLinkStyles = `
.broken-link {
  position: relative;
  display: inline-block;
  background-color: rgba(255, 193, 7, 0.2);
  border-bottom: 2px wavy #ffc107;
  border-radius: 3px;
  padding: 1px 2px;
  margin: 0 1px;
}

.broken-link__text {
  color: #856404;
  text-decoration: line-through;
}

.broken-link__indicator {
  font-size: 0.8em;
  margin-left: 2px;
  opacity: 0.8;
}

.broken-link__edit-input {
  background: transparent;
  border: 1px solid #ffc107;
  border-radius: 2px;
  padding: 1px 3px;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
}

.broken-link__actions {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px;
  min-width: 200px;
  margin-top: 4px;
}

.broken-link__actions-header {
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #eee;
}

.broken-link__error-message {
  font-size: 0.85em;
  color: #dc3545;
  font-weight: 500;
}

.broken-link__suggestions {
  margin-bottom: 8px;
}

.broken-link__suggestions-title {
  font-size: 0.8em;
  color: #666;
  margin-bottom: 4px;
}

.broken-link__suggestion-btn {
  display: block;
  width: 100%;
  padding: 4px 6px;
  margin-bottom: 2px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 3px;
  cursor: pointer;
  font-family: monospace;
  font-size: 0.85em;
  text-align: left;
  transition: background-color 0.2s;
}

.broken-link__suggestion-btn:hover {
  background: #e9ecef;
}

.broken-link__action-buttons {
  display: flex;
  gap: 4px;
}

.broken-link__action-btn {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid #dee2e6;
  border-radius: 3px;
  background: white;
  cursor: pointer;
  font-size: 0.75em;
  transition: all 0.2s;
}

.broken-link__action-btn:hover {
  background: #f8f9fa;
}

.broken-link__action-btn--edit:hover {
  border-color: #007bff;
  color: #007bff;
}

.broken-link__action-btn--remove:hover {
  border-color: #dc3545;
  color: #dc3545;
}

.broken-link__action-btn--ignore:hover {
  border-color: #6c757d;
  color: #6c757d;
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .broken-link {
    background-color: rgba(255, 193, 7, 0.3);
  }
  
  .broken-link__text {
    color: #ffc107;
  }
  
  .broken-link__actions {
    background: #2d3748;
    border-color: #4a5568;
    color: white;
  }
  
  .broken-link__suggestion-btn {
    background: #4a5568;
    border-color: #718096;
    color: white;
  }
  
  .broken-link__action-btn {
    background: #4a5568;
    border-color: #718096;
    color: white;
  }
}
`;

export default BrokenLinkComponent;
