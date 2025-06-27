/**
 * 幕布风格编辑器组件
 * Mubu-style Editor Component
 */

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Code from '@tiptap/extension-code';
import Strike from '@tiptap/extension-strike';
import Underline from '@tiptap/extension-underline';
import { clsx } from 'clsx';
import type { Block } from '@minglog/core';

interface MubuStyleEditorProps {
  block: Block;
  onUpdate: (content: string) => void;
  onEnter?: () => void;
  onBackspace?: () => void;
  onTab?: () => void;
  onShiftTab?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  level?: number;
  showBullet?: boolean;
  isCollapsed?: boolean;
  hasChildren?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const MubuStyleEditor: React.FC<MubuStyleEditorProps> = ({
  block,
  onUpdate,
  onEnter,
  onBackspace,
  onTab,
  onShiftTab,
  onArrowUp,
  onArrowDown,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  placeholder = '开始写作...',
  autoFocus = false,
  level = 0,
  showBullet = true,
  isCollapsed = false,
  hasChildren = false,
  onToggleCollapse,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Code.configure({
        HTMLAttributes: {
          class: 'bg-blue-50 text-blue-700 px-1 py-0.5 rounded text-sm font-mono border border-blue-200',
        },
      }),
      Strike,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-500',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: block.content,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      onUpdate(content);
    },
    onFocus: () => {
      setIsFocused(true);
      setShowToolbar(true);
    },
    onBlur: () => {
      setIsFocused(false);
      setTimeout(() => setShowToolbar(false), 150); // 延迟隐藏，允许点击工具栏
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        // Enter: 创建新块
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onEnter?.();
          return true;
        }

        // Tab: 增加缩进
        if (event.key === 'Tab' && !event.shiftKey) {
          event.preventDefault();
          onTab?.();
          return true;
        }

        // Shift+Tab: 减少缩进
        if (event.key === 'Tab' && event.shiftKey) {
          event.preventDefault();
          onShiftTab?.();
          return true;
        }

        // Backspace: 删除空块或合并
        if (event.key === 'Backspace' && editor?.isEmpty) {
          event.preventDefault();
          onBackspace?.();
          return true;
        }

        // Delete: 删除块
        if (event.key === 'Delete' && event.ctrlKey) {
          event.preventDefault();
          onDelete?.();
          return true;
        }

        // 上下箭头导航
        if (event.key === 'ArrowUp' && event.ctrlKey) {
          event.preventDefault();
          onArrowUp?.();
          return true;
        }

        if (event.key === 'ArrowDown' && event.ctrlKey) {
          event.preventDefault();
          onArrowDown?.();
          return true;
        }

        // 块移动
        if (event.key === 'ArrowUp' && event.ctrlKey && event.shiftKey) {
          event.preventDefault();
          onMoveUp?.();
          return true;
        }

        if (event.key === 'ArrowDown' && event.ctrlKey && event.shiftKey) {
          event.preventDefault();
          onMoveDown?.();
          return true;
        }

        // 复制块
        if (event.key === 'd' && event.ctrlKey) {
          event.preventDefault();
          onDuplicate?.();
          return true;
        }

        // 格式化快捷键
        if (event.key === 'b' && event.ctrlKey) {
          event.preventDefault();
          editor?.chain().focus().toggleBold().run();
          return true;
        }

        if (event.key === 'i' && event.ctrlKey) {
          event.preventDefault();
          editor?.chain().focus().toggleItalic().run();
          return true;
        }

        if (event.key === 'u' && event.ctrlKey) {
          event.preventDefault();
          editor?.chain().focus().toggleUnderline().run();
          return true;
        }

        if (event.key === 'e' && event.ctrlKey) {
          event.preventDefault();
          editor?.chain().focus().toggleCode().run();
          return true;
        }

        return false;
      },
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[1.5rem] mubu-editor-content',
      },
    },
  });

  useEffect(() => {
    if (editor && autoFocus) {
      editor.commands.focus();
    }
  }, [editor, autoFocus]);

  useEffect(() => {
    if (editor && editor.getHTML() !== block.content) {
      editor.commands.setContent(block.content);
    }
  }, [editor, block.content]);

  // 工具栏组件
  const Toolbar = () => {
    if (!editor || !showToolbar) return null;

    return (
      <div className="absolute top-0 left-0 transform -translate-y-full mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 flex items-center space-x-1 z-20">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={clsx(
            'p-1.5 rounded text-sm font-bold transition-colors',
            editor.isActive('bold')
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
          title="粗体 (Ctrl+B)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h5.5a2.5 2.5 0 010 5H6v2h4.5a2.5 2.5 0 010 5H4a1 1 0 01-1-1V4zm2 1v3h3.5a.5.5 0 000-1H5zm0 5v3h4.5a.5.5 0 000-1H5z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={clsx(
            'p-1.5 rounded text-sm italic transition-colors',
            editor.isActive('italic')
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
          title="斜体 (Ctrl+I)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 2a1 1 0 000 2h.5L7 12H6a1 1 0 100 2h4a1 1 0 100-2h-.5L11 4h1a1 1 0 100-2H8z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={clsx(
            'p-1.5 rounded text-sm font-mono transition-colors',
            editor.isActive('code')
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
          title="代码 (Ctrl+E)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />

        <button
          onClick={() => onDelete?.()}
          className="p-1.5 rounded text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="删除块 (Ctrl+Delete)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div
      ref={editorRef}
      className={clsx(
        'group relative flex items-start transition-all duration-200',
        'hover:bg-gray-50/50 dark:hover:bg-gray-800/30 rounded-md',
        isFocused && 'bg-blue-50/30 dark:bg-blue-900/10',
        className
      )}
      style={{ paddingLeft: `${level * 24}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 缩进线 */}
      {level > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex">
          {Array.from({ length: level }).map((_, i) => (
            <div
              key={i}
              className="w-6 border-l border-gray-200 dark:border-gray-700"
              style={{ left: `${i * 24 + 12}px` }}
            />
          ))}
        </div>
      )}

      {/* 项目符号和折叠按钮 */}
      {showBullet && (
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center mr-2 mt-0.5">
          {hasChildren ? (
            <button
              onClick={onToggleCollapse}
              className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={isCollapsed ? '展开' : '折叠'}
            >
              <svg
                className={clsx('w-3 h-3 transition-transform', isCollapsed && 'rotate-90')}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
          )}
        </div>
      )}

      {/* 编辑器内容 */}
      <div className="flex-1 min-w-0 relative">
        <EditorContent editor={editor} />
        <Toolbar />
      </div>

      {/* 悬停操作按钮 */}
      {(isHovered || isFocused) && (
        <div className="flex-shrink-0 ml-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onDuplicate}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="复制块 (Ctrl+D)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button
            onClick={onMoveUp}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="上移 (Ctrl+Shift+↑)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          
          <button
            onClick={onMoveDown}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="下移 (Ctrl+Shift+↓)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default MubuStyleEditor;
