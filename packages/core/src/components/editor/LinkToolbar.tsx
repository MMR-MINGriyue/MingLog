/**
 * MingLog 链接工具栏组件
 * 提供链接创建、编辑和删除功能
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Editor, Transforms, Range } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';
import { LinkElement } from '../../editor/plugins/withLinks';

export interface LinkToolbarProps {
  /** 是否显示工具栏 */
  visible: boolean;
  /** 工具栏位置 */
  position?: { x: number; y: number };
  /** 当前链接元素 */
  currentLink?: LinkElement;
  /** 关闭回调 */
  onClose: () => void;
  /** 链接验证回调 */
  onValidateLink?: (target: string, type: 'page' | 'block') => Promise<boolean>;
  /** 页面搜索回调 */
  onSearchPages?: (query: string) => Promise<Array<{ id: string; title: string; preview?: string }>>;
  /** 块搜索回调 */
  onSearchBlocks?: (query: string) => Promise<Array<{ id: string; title: string; content?: string }>>;
}

export const LinkToolbar: React.FC<LinkToolbarProps> = ({
  visible,
  position = { x: 0, y: 0 },
  currentLink,
  onClose,
  onValidateLink,
  onSearchPages,
  onSearchBlocks
}) => {
  const editor = useSlate();
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  const [linkType, setLinkType] = useState<'page' | 'block'>('page');
  const [target, setTarget] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string; preview?: string }>>([]);
  const [loading, setLoading] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (currentLink) {
      setIsEditing(true);
      setLinkType(currentLink.linkType === 'page-reference' ? 'page' : 'block');
      setTarget(currentLink.target);
      setDisplayText(currentLink.displayText);
    } else {
      setIsEditing(false);
      setTarget('');
      setDisplayText('');
      
      // 如果有选中文本，使用作为默认显示文本
      const { selection } = editor;
      if (selection && !Range.isCollapsed(selection)) {
        const selectedText = Editor.string(editor, selection);
        setDisplayText(selectedText);
        setTarget(selectedText);
      }
    }
  }, [currentLink, editor]);

  // 搜索建议
  const searchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      if (linkType === 'page' && onSearchPages) {
        const results = await onSearchPages(query);
        setSuggestions(results);
      } else if (linkType === 'block' && onSearchBlocks) {
        const results = await onSearchBlocks(query);
        setSuggestions(results);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [linkType, onSearchPages, onSearchBlocks]);

  // 处理目标输入变化
  const handleTargetChange = useCallback((value: string) => {
    setTarget(value);
    
    // 延迟搜索
    const timeoutId = setTimeout(() => {
      searchSuggestions(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchSuggestions]);

  // 处理建议选择
  const handleSuggestionSelect = useCallback((suggestion: { id: string; title: string }) => {
    setTarget(suggestion.id);
    if (!displayText || displayText === target) {
      setDisplayText(suggestion.title);
    }
    setSuggestions([]);
  }, [target, displayText]);

  // 创建或更新链接
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!target.trim()) return;

    try {
      // 验证链接
      if (onValidateLink) {
        const exists = await onValidateLink(target, linkType);
        if (!exists && linkType === 'block') {
          alert('指定的块不存在');
          return;
        }
      }

      if (isEditing && currentLink) {
        // 更新现有链接
        const linkPath = ReactEditor.findPath(editor, currentLink);
        Transforms.setNodes(
          editor,
          {
            target,
            displayText: displayText || target,
            linkType: linkType === 'page' ? 'page-reference' : 'block-reference'
          },
          { at: linkPath }
        );
      } else {
        // 创建新链接
        const { selection } = editor;
        if (selection) {
          if (linkType === 'page') {
            editor.insertPageLink(target, displayText || target);
          } else {
            editor.insertBlockLink(target);
          }
        }
      }

      onClose();
    } catch (error) {
      console.error('Failed to create/update link:', error);
    }
  }, [target, displayText, linkType, isEditing, currentLink, editor, onValidateLink, onClose]);

  // 删除链接
  const handleDelete = useCallback(() => {
    if (currentLink) {
      const linkPath = ReactEditor.findPath(editor, currentLink);
      Transforms.removeNodes(editor, { at: linkPath });
      onClose();
    }
  }, [currentLink, editor, onClose]);

  // 处理键盘事件
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleSubmit(event as any);
    }
  }, [onClose, handleSubmit]);

  // 点击外部关闭
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="link-toolbar"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 10000
      }}
      onKeyDown={handleKeyDown}
      data-testid="link-toolbar"
    >
      <form onSubmit={handleSubmit} className="link-toolbar__form">
        {/* 头部 */}
        <div className="link-toolbar__header">
          <h3 className="link-toolbar__title">
            {isEditing ? '编辑链接' : '创建链接'}
          </h3>
          <button
            type="button"
            className="link-toolbar__close"
            onClick={onClose}
            title="关闭 (Esc)"
          >
            ✕
          </button>
        </div>

        {/* 链接类型选择 */}
        <div className="link-toolbar__field">
          <label className="link-toolbar__label">链接类型</label>
          <div className="link-toolbar__radio-group">
            <label className="link-toolbar__radio">
              <input
                type="radio"
                value="page"
                checked={linkType === 'page'}
                onChange={(e) => setLinkType(e.target.value as 'page')}
              />
              <span>📄 页面链接</span>
            </label>
            <label className="link-toolbar__radio">
              <input
                type="radio"
                value="block"
                checked={linkType === 'block'}
                onChange={(e) => setLinkType(e.target.value as 'block')}
              />
              <span>🧩 块引用</span>
            </label>
          </div>
        </div>

        {/* 目标输入 */}
        <div className="link-toolbar__field">
          <label className="link-toolbar__label">
            {linkType === 'page' ? '页面名称' : '块ID'}
          </label>
          <div className="link-toolbar__input-wrapper">
            <input
              type="text"
              className="link-toolbar__input"
              value={target}
              onChange={(e) => handleTargetChange(e.target.value)}
              placeholder={linkType === 'page' ? '输入页面名称...' : '输入块ID...'}
              autoFocus
              required
            />
            {loading && (
              <div className="link-toolbar__loading">
                <div className="link-toolbar__spinner" />
              </div>
            )}
          </div>

          {/* 建议列表 */}
          {suggestions.length > 0 && (
            <div className="link-toolbar__suggestions">
              {suggestions.slice(0, 5).map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="link-toolbar__suggestion"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="link-toolbar__suggestion-title">
                    {suggestion.title}
                  </div>
                  {suggestion.preview && (
                    <div className="link-toolbar__suggestion-preview">
                      {suggestion.preview}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 显示文本（仅页面链接） */}
        {linkType === 'page' && (
          <div className="link-toolbar__field">
            <label className="link-toolbar__label">显示文本（可选）</label>
            <input
              type="text"
              className="link-toolbar__input"
              value={displayText}
              onChange={(e) => setDisplayText(e.target.value)}
              placeholder="留空使用页面名称"
            />
          </div>
        )}

        {/* 操作按钮 */}
        <div className="link-toolbar__actions">
          <button
            type="submit"
            className="link-toolbar__btn link-toolbar__btn--primary"
            disabled={!target.trim()}
          >
            {isEditing ? '更新' : '创建'}
          </button>
          
          {isEditing && (
            <button
              type="button"
              className="link-toolbar__btn link-toolbar__btn--danger"
              onClick={handleDelete}
            >
              删除
            </button>
          )}
          
          <button
            type="button"
            className="link-toolbar__btn link-toolbar__btn--secondary"
            onClick={onClose}
          >
            取消
          </button>
        </div>

        {/* 快捷键提示 */}
        <div className="link-toolbar__hint">
          Ctrl+Enter 确认 • Esc 取消
        </div>
      </form>
    </div>
  );
};

// 样式
export const linkToolbarStyles = `
.link-toolbar {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  min-width: 320px;
  max-width: 400px;
}

.link-toolbar__form {
  padding: 16px;
}

.link-toolbar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.link-toolbar__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.link-toolbar__close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #666;
  border-radius: 3px;
}

.link-toolbar__close:hover {
  background: #f0f0f0;
}

.link-toolbar__field {
  margin-bottom: 16px;
}

.link-toolbar__label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.link-toolbar__radio-group {
  display: flex;
  gap: 12px;
}

.link-toolbar__radio {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
}

.link-toolbar__input-wrapper {
  position: relative;
}

.link-toolbar__input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.link-toolbar__input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
}

.link-toolbar__loading {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.link-toolbar__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #0066cc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.link-toolbar__suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.link-toolbar__suggestion {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
}

.link-toolbar__suggestion:hover {
  background: #f8f9fa;
}

.link-toolbar__suggestion-title {
  font-weight: 500;
  margin-bottom: 2px;
}

.link-toolbar__suggestion-preview {
  font-size: 12px;
  color: #666;
  line-height: 1.3;
}

.link-toolbar__actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.link-toolbar__btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.link-toolbar__btn--primary {
  background: #0066cc;
  border-color: #0066cc;
  color: white;
}

.link-toolbar__btn--primary:hover:not(:disabled) {
  background: #0052a3;
}

.link-toolbar__btn--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.link-toolbar__btn--danger {
  background: #dc3545;
  border-color: #dc3545;
  color: white;
}

.link-toolbar__btn--danger:hover {
  background: #c82333;
}

.link-toolbar__btn--secondary {
  background: white;
  color: #666;
}

.link-toolbar__btn--secondary:hover {
  background: #f8f9fa;
}

.link-toolbar__hint {
  font-size: 11px;
  color: #666;
  text-align: center;
}

/* 深色主题 */
@media (prefers-color-scheme: dark) {
  .link-toolbar {
    background: #2d3748;
    border-color: #4a5568;
    color: white;
  }
  
  .link-toolbar__input {
    background: #4a5568;
    border-color: #718096;
    color: white;
  }
  
  .link-toolbar__suggestions {
    background: #2d3748;
    border-color: #4a5568;
  }
  
  .link-toolbar__btn--secondary {
    background: #4a5568;
    border-color: #718096;
    color: white;
  }
}
`;

export default LinkToolbar;
