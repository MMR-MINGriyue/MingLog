/**
 * 富文本工具栏组件
 * 提供格式化按钮和快捷操作
 */

import React, { useCallback, useMemo } from 'react';
import type { CustomElement } from '@minglog/editor';

/**
 * 格式化类型
 */
export type FormatType = 
  | 'bold' 
  | 'italic' 
  | 'underline' 
  | 'strikethrough' 
  | 'code' 
  | 'highlight';

/**
 * 块类型
 */
export type BlockFormatType = 
  | 'paragraph'
  | 'heading-1'
  | 'heading-2' 
  | 'heading-3'
  | 'heading-4'
  | 'heading-5'
  | 'heading-6'
  | 'bulleted-list'
  | 'numbered-list'
  | 'todo-list'
  | 'quote'
  | 'code'
  | 'divider';

/**
 * 工具栏按钮配置
 */
export interface ToolbarButton {
  /** 按钮ID */
  id: string;
  /** 按钮标题 */
  title: string;
  /** 按钮图标 */
  icon: string;
  /** 快捷键 */
  shortcut?: string;
  /** 是否激活 */
  isActive?: boolean;
  /** 是否禁用 */
  isDisabled?: boolean;
  /** 点击处理 */
  onClick: () => void;
}

/**
 * 工具栏属性接口
 */
export interface RichTextToolbarProps {
  /** 当前选中的格式 */
  activeFormats: FormatType[];
  /** 当前块类型 */
  currentBlockType: BlockFormatType;
  /** 是否只读 */
  readOnly?: boolean;
  /** 格式化处理 */
  onFormat: (format: FormatType) => void;
  /** 块格式化处理 */
  onBlockFormat: (blockType: BlockFormatType) => void;
  /** 插入链接处理 */
  onInsertLink: () => void;
  /** 插入图片处理 */
  onInsertImage?: () => void;
  /** 插入表格处理 */
  onInsertTable?: () => void;
  /** 切换代码编辑器处理 */
  onToggleCodeEditor?: () => void;
  /** 撤销处理 */
  onUndo?: () => void;
  /** 重做处理 */
  onRedo?: () => void;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 富文本工具栏组件实现
 */
export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  activeFormats,
  currentBlockType,
  readOnly = false,
  onFormat,
  onBlockFormat,
  onInsertLink,
  onInsertImage,
  onInsertTable,
  onToggleCodeEditor,
  onUndo,
  onRedo,
  className = '',
  style
}) => {
  /**
   * 检查格式是否激活
   */
  const isFormatActive = useCallback((format: FormatType) => {
    return activeFormats.includes(format);
  }, [activeFormats]);

  /**
   * 文本格式化按钮配置
   */
  const textFormatButtons = useMemo((): ToolbarButton[] => [
    {
      id: 'bold',
      title: '粗体',
      icon: '𝐁',
      shortcut: 'Ctrl+B',
      isActive: isFormatActive('bold'),
      onClick: () => onFormat('bold')
    },
    {
      id: 'italic',
      title: '斜体',
      icon: '𝐼',
      shortcut: 'Ctrl+I',
      isActive: isFormatActive('italic'),
      onClick: () => onFormat('italic')
    },
    {
      id: 'underline',
      title: '下划线',
      icon: '𝐔',
      shortcut: 'Ctrl+U',
      isActive: isFormatActive('underline'),
      onClick: () => onFormat('underline')
    },
    {
      id: 'strikethrough',
      title: '删除线',
      icon: '𝐒',
      shortcut: 'Ctrl+Shift+X',
      isActive: isFormatActive('strikethrough'),
      onClick: () => onFormat('strikethrough')
    },
    {
      id: 'code',
      title: '行内代码',
      icon: '⌨',
      shortcut: 'Ctrl+`',
      isActive: isFormatActive('code'),
      onClick: () => onFormat('code')
    },
    {
      id: 'highlight',
      title: '高亮',
      icon: '🖍',
      shortcut: 'Ctrl+Shift+H',
      isActive: isFormatActive('highlight'),
      onClick: () => onFormat('highlight')
    }
  ], [isFormatActive, onFormat]);

  /**
   * 块格式化按钮配置
   */
  const blockFormatButtons = useMemo((): ToolbarButton[] => [
    {
      id: 'heading-1',
      title: '一级标题',
      icon: 'H1',
      shortcut: 'Ctrl+Alt+1',
      isActive: currentBlockType === 'heading-1',
      onClick: () => onBlockFormat('heading-1')
    },
    {
      id: 'heading-2',
      title: '二级标题',
      icon: 'H2',
      shortcut: 'Ctrl+Alt+2',
      isActive: currentBlockType === 'heading-2',
      onClick: () => onBlockFormat('heading-2')
    },
    {
      id: 'heading-3',
      title: '三级标题',
      icon: 'H3',
      shortcut: 'Ctrl+Alt+3',
      isActive: currentBlockType === 'heading-3',
      onClick: () => onBlockFormat('heading-3')
    },
    {
      id: 'bulleted-list',
      title: '无序列表',
      icon: '•',
      shortcut: 'Ctrl+Shift+8',
      isActive: currentBlockType === 'bulleted-list',
      onClick: () => onBlockFormat('bulleted-list')
    },
    {
      id: 'numbered-list',
      title: '有序列表',
      icon: '1.',
      shortcut: 'Ctrl+Shift+7',
      isActive: currentBlockType === 'numbered-list',
      onClick: () => onBlockFormat('numbered-list')
    },
    {
      id: 'todo-list',
      title: '任务列表',
      icon: '☐',
      shortcut: 'Ctrl+Shift+9',
      isActive: currentBlockType === 'todo-list',
      onClick: () => onBlockFormat('todo-list')
    },
    {
      id: 'quote',
      title: '引用',
      icon: '"',
      shortcut: 'Ctrl+Shift+.',
      isActive: currentBlockType === 'quote',
      onClick: () => onBlockFormat('quote')
    },
    {
      id: 'code',
      title: '代码块',
      icon: '{}',
      shortcut: 'Ctrl+Alt+C',
      isActive: currentBlockType === 'code',
      onClick: () => onBlockFormat('code')
    }
  ], [currentBlockType, onBlockFormat]);

  /**
   * 插入操作按钮配置
   */
  const insertButtons = useMemo((): ToolbarButton[] => [
    {
      id: 'link',
      title: '插入链接',
      icon: '🔗',
      shortcut: 'Ctrl+K',
      onClick: onInsertLink
    },
    ...(onInsertImage ? [{
      id: 'image',
      title: '插入图片',
      icon: '🖼',
      onClick: onInsertImage
    }] : []),
    ...(onInsertTable ? [{
      id: 'table',
      title: '插入表格',
      icon: '📊',
      onClick: onInsertTable
    }] : []),
    ...(onToggleCodeEditor ? [{
      id: 'code-editor',
      title: '代码编辑器',
      icon: '💻',
      onClick: onToggleCodeEditor
    }] : []),
    {
      id: 'divider',
      title: '插入分隔线',
      icon: '—',
      onClick: () => onBlockFormat('divider')
    }
  ], [onInsertLink, onInsertImage, onInsertTable, onBlockFormat]);

  /**
   * 历史操作按钮配置
   */
  const historyButtons = useMemo((): ToolbarButton[] => [
    ...(onUndo ? [{
      id: 'undo',
      title: '撤销',
      icon: '↶',
      shortcut: 'Ctrl+Z',
      onClick: onUndo
    }] : []),
    ...(onRedo ? [{
      id: 'redo',
      title: '重做',
      icon: '↷',
      shortcut: 'Ctrl+Y',
      onClick: onRedo
    }] : [])
  ], [onUndo, onRedo]);

  /**
   * 渲染工具栏按钮
   */
  const renderButton = useCallback((button: ToolbarButton) => (
    <button
      key={button.id}
      className={`toolbar-button ${button.isActive ? 'active' : ''} ${button.isDisabled ? 'disabled' : ''}`}
      title={`${button.title}${button.shortcut ? ` (${button.shortcut})` : ''}`}
      onClick={button.onClick}
      disabled={readOnly || button.isDisabled}
      data-testid={`toolbar-${button.id}`}
    >
      <span className="button-icon">{button.icon}</span>
    </button>
  ), [readOnly]);

  /**
   * 工具栏样式
   */
  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    borderBottom: '1px solid #e1e5e9',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px 8px 0 0',
    flexWrap: 'wrap',
    ...style
  };

  if (readOnly) {
    return null;
  }

  return (
    <div 
      className={`rich-text-toolbar ${className}`}
      style={toolbarStyle}
      data-testid="rich-text-toolbar"
    >
      {/* 文本格式化按钮组 */}
      <div className="button-group text-format">
        {textFormatButtons.map(renderButton)}
      </div>

      <div className="toolbar-separator" />

      {/* 块格式化按钮组 */}
      <div className="button-group block-format">
        {blockFormatButtons.map(renderButton)}
      </div>

      <div className="toolbar-separator" />

      {/* 插入操作按钮组 */}
      <div className="button-group insert-actions">
        {insertButtons.map(renderButton)}
      </div>

      {/* 历史操作按钮组 */}
      {historyButtons.length > 0 && (
        <>
          <div className="toolbar-separator" />
          <div className="button-group history-actions">
            {historyButtons.map(renderButton)}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * 默认导出
 */
export default RichTextToolbar;
