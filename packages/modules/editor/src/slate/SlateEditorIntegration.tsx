/**
 * Slate.js编辑器集成
 * 将命令系统与真实的Slate.js编辑器深度集成
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { createEditor, Descendant, Editor, Transforms, Range, Path, Node, Element as SlateElement, Text } from 'slate';
import { Slate, Editable, withReact, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import type { CustomEditor, CustomElement, CustomText, BlockType } from '@minglog/editor';
import { CommandSystem, CommandContext } from '../commands/CommandSystem';
import { BlockNavigation, NavigationDirection, BlockOperation } from '../utils/BlockNavigation';
import { CommandPalette } from '../components/CommandPalette';
import { EnhancedBlockMenu } from '../components/EnhancedBlockMenu';
import type { EventBus } from '@minglog/core';

interface SlateEditorIntegrationProps {
  /** 初始值 */
  initialValue?: CustomElement[];
  /** 占位符 */
  placeholder?: string;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否自动聚焦 */
  autoFocus?: boolean;
  /** 事件总线 */
  eventBus: EventBus;
  /** 内容变更回调 */
  onChange?: (value: CustomElement[]) => void;
  /** 保存回调 */
  onSave?: (value: CustomElement[]) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 自定义样式类名 */
  className?: string;
}

// 默认值
const DEFAULT_VALUE: CustomElement[] = [
  {
    id: 'default-1',
    type: 'paragraph',
    children: [{ text: '' }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * 自定义Slate.js插件
 */
const withMingLogFeatures = (editor: CustomEditor): CustomEditor => {
  const { insertText, insertBreak, deleteBackward, normalizeNode } = editor;

  // 处理斜杠命令
  editor.insertText = (text: string) => {
    const { selection } = editor;
    
    if (text === '/' && selection && Range.isCollapsed(selection)) {
      // 检查是否在行首或空白后
      const [start] = Range.edges(selection);
      const beforeText = Editor.before(editor, start, { unit: 'character' });
      
      if (!beforeText || Editor.string(editor, { anchor: beforeText, focus: start }) === '') {
        // 触发斜杠命令
        editor.triggerSlashCommand?.(start);
        return;
      }
    }

    // 处理双向链接 [[
    if (text === '[' && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection;
      const beforePoint = Editor.before(editor, anchor, { unit: 'character' });
      
      if (beforePoint) {
        const beforeChar = Editor.string(editor, { anchor: beforePoint, focus: anchor });
        if (beforeChar === '[') {
          // 删除前一个 [，插入双向链接
          Transforms.delete(editor, { at: { anchor: beforePoint, focus: anchor } });
          editor.triggerLinkCommand?.(beforePoint);
          return;
        }
      }
    }

    insertText(text);
  };

  // 处理回车键
  editor.insertBreak = () => {
    const { selection } = editor;
    
    if (selection && Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(editor, {
        match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        at: selection
      });

      if (match) {
        const [block, path] = match;
        const blockElement = block as CustomElement;

        // 处理列表项
        if (blockElement.type === 'bulleted-list' || blockElement.type === 'numbered-list') {
          const text = Node.string(block);
          if (text === '') {
            // 空列表项，转换为段落
            Transforms.setNodes(editor, { type: 'paragraph' }, { at: path });
            return;
          }
        }

        // 处理待办事项
        if (blockElement.type === 'todo-list') {
          const text = Node.string(block);
          if (text === '') {
            // 空待办项，转换为段落
            Transforms.setNodes(editor, { type: 'paragraph' }, { at: path });
            return;
          } else {
            // 创建新的待办项
            const newTodo: CustomElement = {
              id: `todo-${Date.now()}`,
              type: 'todo-list',
              checked: false,
              children: [{ text: '' }],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            insertBreak();
            Transforms.setNodes(editor, newTodo, { at: Editor.next(editor, path) });
            return;
          }
        }
      }
    }

    insertBreak();
  };

  // 标准化节点
  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    // 确保所有块元素都有必要的属性
    if (SlateElement.isElement(node) && Editor.isBlock(editor, node)) {
      const element = node as CustomElement;
      
      if (!element.id) {
        Transforms.setNodes(editor, { 
          id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
        }, { at: path });
        return;
      }

      if (!element.createdAt) {
        Transforms.setNodes(editor, { 
          createdAt: new Date().toISOString() 
        }, { at: path });
        return;
      }

      if (!element.updatedAt) {
        Transforms.setNodes(editor, { 
          updatedAt: new Date().toISOString() 
        }, { at: path });
        return;
      }
    }

    normalizeNode(entry);
  };

  return editor;
};

/**
 * 渲染块元素
 */
const renderElement = (props: RenderElementProps) => {
  const { attributes, children, element } = props;
  const blockElement = element as CustomElement;

  const commonProps = {
    ...attributes,
    'data-block-id': blockElement.id,
    'data-block-type': blockElement.type
  };

  switch (blockElement.type) {
    case 'heading-1':
      return <h1 {...commonProps} className="text-3xl font-bold mb-4">{children}</h1>;
    case 'heading-2':
      return <h2 {...commonProps} className="text-2xl font-bold mb-3">{children}</h2>;
    case 'heading-3':
      return <h3 {...commonProps} className="text-xl font-bold mb-2">{children}</h3>;
    case 'heading-4':
      return <h4 {...commonProps} className="text-lg font-bold mb-2">{children}</h4>;
    case 'heading-5':
      return <h5 {...commonProps} className="text-base font-bold mb-1">{children}</h5>;
    case 'heading-6':
      return <h6 {...commonProps} className="text-sm font-bold mb-1">{children}</h6>;
    
    case 'bulleted-list':
      return (
        <div {...commonProps} className="flex items-start my-1">
          <span className="mr-2 mt-1 text-gray-500">•</span>
          <div className="flex-1">{children}</div>
        </div>
      );
    
    case 'numbered-list':
      return (
        <div {...commonProps} className="flex items-start my-1">
          <span className="mr-2 mt-1 text-gray-500 min-w-[20px]">1.</span>
          <div className="flex-1">{children}</div>
        </div>
      );
    
    case 'todo-list':
      const todoElement = blockElement as any;
      return (
        <div {...commonProps} className="flex items-start my-1">
          <input
            type="checkbox"
            checked={todoElement.checked || false}
            onChange={(e) => {
              // TODO: 更新待办状态
              console.log('Toggle todo:', e.target.checked);
            }}
            className="mr-2 mt-1"
            contentEditable={false}
          />
          <div className={`flex-1 ${todoElement.checked ? 'line-through text-gray-500' : ''}`}>
            {children}
          </div>
        </div>
      );
    
    case 'quote':
      return (
        <blockquote {...commonProps} className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-700">
          {children}
        </blockquote>
      );
    
    case 'code':
      return (
        <pre {...commonProps} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md my-4 overflow-x-auto">
          <code>{children}</code>
        </pre>
      );
    
    case 'divider':
      return (
        <div {...commonProps} className="my-4">
          <hr className="border-gray-300" />
          {children}
        </div>
      );
    
    default:
      return <div {...commonProps} className="my-1">{children}</div>;
  }
};

/**
 * 渲染叶子节点
 */
const renderLeaf = (props: RenderLeafProps) => {
  const { attributes, children, leaf } = props;
  const textLeaf = leaf as CustomText;

  let element = <span {...attributes}>{children}</span>;

  if (textLeaf.bold) {
    element = <strong>{element}</strong>;
  }

  if (textLeaf.italic) {
    element = <em>{element}</em>;
  }

  if (textLeaf.underline) {
    element = <u>{element}</u>;
  }

  if (textLeaf.strikethrough) {
    element = <s>{element}</s>;
  }

  if (textLeaf.code) {
    element = (
      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
        {element}
      </code>
    );
  }

  if (textLeaf.color) {
    element = <span style={{ color: textLeaf.color }}>{element}</span>;
  }

  if (textLeaf.backgroundColor) {
    element = <span style={{ backgroundColor: textLeaf.backgroundColor }}>{element}</span>;
  }

  return element;
};

/**
 * Slate.js编辑器集成组件
 */
export const SlateEditorIntegration: React.FC<SlateEditorIntegrationProps> = ({
  initialValue = DEFAULT_VALUE,
  placeholder = '开始输入...',
  readOnly = false,
  autoFocus = false,
  eventBus,
  onChange,
  onSave,
  onError,
  className = ''
}) => {
  // 创建编辑器实例
  const editor = useMemo(() => {
    const baseEditor = withMingLogFeatures(withHistory(withReact(createEditor()))) as CustomEditor;
    
    // 添加自定义方法
    baseEditor.triggerSlashCommand = (position) => {
      const rect = ReactEditor.toDOMRange(baseEditor, { anchor: position, focus: position }).getBoundingClientRect();
      setBlockMenuPosition({ x: rect.left, y: rect.bottom + 5 });
      setEnhancedBlockMenuVisible(true);
    };

    baseEditor.triggerLinkCommand = (position) => {
      console.log('Trigger link command at:', position);
      // TODO: 实现双向链接创建
    };

    return baseEditor;
  }, []);

  // 状态
  const [value, setValue] = useState<CustomElement[]>(initialValue);
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);
  const [enhancedBlockMenuVisible, setEnhancedBlockMenuVisible] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // 引用
  const commandSystemRef = useRef<CommandSystem | null>(null);
  const blockNavigationRef = useRef<BlockNavigation | null>(null);

  // 初始化命令系统
  useEffect(() => {
    commandSystemRef.current = new CommandSystem(eventBus);
    blockNavigationRef.current = new BlockNavigation(editor);

    return () => {
      blockNavigationRef.current?.destroy();
    };
  }, [eventBus, editor]);

  // 处理内容变更
  const handleChange = useCallback((newValue: CustomElement[]) => {
    setValue(newValue);
    onChange?.(newValue);
  }, [onChange]);

  // 处理键盘事件
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Ctrl+P 打开命令面板
    if (event.ctrlKey && event.key === 'p') {
      event.preventDefault();
      setCommandPaletteVisible(true);
      return;
    }

    // Escape 关闭菜单
    if (event.key === 'Escape') {
      if (enhancedBlockMenuVisible) {
        setEnhancedBlockMenuVisible(false);
        return;
      }
      if (commandPaletteVisible) {
        setCommandPaletteVisible(false);
        return;
      }
    }

    // 块导航快捷键
    if (blockNavigationRef.current) {
      if (event.altKey && event.key === 'ArrowUp') {
        event.preventDefault();
        blockNavigationRef.current.navigateToBlock(NavigationDirection.UP);
        return;
      }
      
      if (event.altKey && event.key === 'ArrowDown') {
        event.preventDefault();
        blockNavigationRef.current.navigateToBlock(NavigationDirection.DOWN);
        return;
      }

      // Tab 缩进
      if (event.key === 'Tab' && !event.shiftKey) {
        event.preventDefault();
        blockNavigationRef.current.executeBlockOperation(BlockOperation.INDENT);
        return;
      }

      // Shift+Tab 取消缩进
      if (event.key === 'Tab' && event.shiftKey) {
        event.preventDefault();
        blockNavigationRef.current.executeBlockOperation(BlockOperation.OUTDENT);
        return;
      }
    }
  }, [enhancedBlockMenuVisible, commandPaletteVisible]);

  // 处理命令选择
  const handleCommandSelect = useCallback(async (commandId: string) => {
    if (!commandSystemRef.current) return;

    try {
      const context: CommandContext = {
        editor,
        selection: editor.selection,
        data: { editorId: 'slate-editor' }
      };

      await commandSystemRef.current.executeCommand(commandId, context);
    } catch (error) {
      console.error('执行命令失败:', error);
      onError?.(error instanceof Error ? error : new Error('命令执行失败'));
    }
  }, [editor, onError]);

  return (
    <div className={`slate-editor-integration ${className}`}>
      <Slate
        editor={editor}
        initialValue={value}
        onChange={handleChange}
      >
        <Editable
          readOnly={readOnly}
          placeholder={placeholder}
          autoFocus={autoFocus}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={handleKeyDown}
          className="slate-editable focus:outline-none min-h-[200px] p-4"
          spellCheck={false}
        />

        {/* 全局命令面板 */}
        {commandSystemRef.current && (
          <CommandPalette
            visible={commandPaletteVisible}
            onClose={() => setCommandPaletteVisible(false)}
            commandSystem={commandSystemRef.current}
            editorContext={{
              editor,
              selection: editor.selection,
              data: { editorId: 'slate-editor' }
            }}
          />
        )}

        {/* 增强块菜单 */}
        {commandSystemRef.current && enhancedBlockMenuVisible && blockMenuPosition && (
          <EnhancedBlockMenu
            position={blockMenuPosition}
            onSelect={handleCommandSelect}
            onClose={() => setEnhancedBlockMenuVisible(false)}
            commandSystem={commandSystemRef.current}
          />
        )}
      </Slate>
    </div>
  );
};

export default SlateEditorIntegration;
