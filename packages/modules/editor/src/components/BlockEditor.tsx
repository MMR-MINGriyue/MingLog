/**
 * 块编辑器组件
 * 基于现有的@minglog/editor包，提供模块化的块编辑功能
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { BlockEditor as BaseBlockEditor } from '@minglog/editor';
import type { CustomElement, CustomText, BlockType } from '@minglog/editor';
import { BLOCK_TYPES, EDITOR_EVENTS } from '../constants';
import { MarkdownParser } from '../services/MarkdownParser';
import { MarkdownPreview } from './MarkdownPreview';
import { RichTextToolbar, type FormatType, type BlockFormatType } from './RichTextToolbar';
import { KeyboardShortcuts, createKeyboardShortcuts } from '../utils/KeyboardShortcuts';
import { CodeEditor } from './CodeEditor';
import { CodeHighlightService, type SupportedLanguage } from '../services/CodeHighlightService';
import { CommandSystem } from '../commands/CommandSystem';
import { BlockNavigation, NavigationDirection, BlockOperation } from '../utils/BlockNavigation';
import { CommandPalette } from './CommandPalette';
import { EnhancedBlockMenu } from './EnhancedBlockMenu';
import type { EventBus } from '@minglog/core';

/**
 * 编辑器模式枚举
 */
export type EditorMode = 'edit' | 'preview' | 'split';

/**
 * 块编辑器属性接口
 */
export interface BlockEditorProps {
  /** 初始内容 */
  initialValue?: CustomElement[];
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否启用自动保存 */
  autoSave?: boolean;
  /** 自动保存间隔（毫秒） */
  autoSaveInterval?: number;
  /** 占位符文本 */
  placeholder?: string;
  /** 支持的块类型 */
  supportedBlockTypes?: BlockType[];
  /** 内容变更回调 */
  onChange?: (value: CustomElement[]) => void;
  /** 保存回调 */
  onSave?: (value: CustomElement[]) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 编辑器ID */
  editorId?: string;
  /** 编辑器模式 */
  mode?: EditorMode;
  /** 是否启用Markdown支持 */
  enableMarkdown?: boolean;
  /** 是否启用语法高亮 */
  enableSyntaxHighlight?: boolean;
  /** 是否启用数学公式 */
  enableMath?: boolean;
  /** 链接点击处理 */
  onLinkClick?: (link: string) => void;
  /** 标签点击处理 */
  onTagClick?: (tag: string) => void;
  /** 块引用点击处理 */
  onBlockReferenceClick?: (blockId: string) => void;
  /** 是否显示富文本工具栏 */
  showRichTextToolbar?: boolean;
  /** 是否启用快捷键 */
  enableKeyboardShortcuts?: boolean;
  /** 是否启用代码编辑器 */
  enableCodeEditor?: boolean;
  /** 默认代码语言 */
  defaultCodeLanguage?: SupportedLanguage;
  /** 事件总线实例 */
  eventBus?: EventBus;
}

/**
 * 块编辑器状态接口
 */
interface BlockEditorState {
  /** 当前内容 */
  value: CustomElement[];
  /** 是否有未保存的更改 */
  hasUnsavedChanges: boolean;
  /** 是否正在保存 */
  isSaving: boolean;
  /** 最后保存时间 */
  lastSavedAt?: Date;
  /** 错误信息 */
  error?: string;
  /** 当前编辑器模式 */
  currentMode: EditorMode;
  /** 是否正在解析Markdown */
  isParsing: boolean;
  /** 当前激活的格式 */
  activeFormats: FormatType[];
  /** 当前选中的块类型 */
  selectedBlockType: BlockFormatType;
  /** 代码编辑器状态 */
  codeEditorVisible: boolean;
  /** 当前代码语言 */
  currentCodeLanguage: SupportedLanguage;
}

/**
 * 默认编辑器内容
 */
const DEFAULT_VALUE: CustomElement[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }]
  }
];

/**
 * 块编辑器组件实现
 */
export const BlockEditor: React.FC<BlockEditorProps> = ({
  initialValue = DEFAULT_VALUE,
  readOnly = false,
  autoSave = true,
  autoSaveInterval = 30000,
  placeholder = '开始输入...',
  supportedBlockTypes = Object.values(BLOCK_TYPES) as BlockType[],
  onChange,
  onSave,
  onError,
  className = '',
  style,
  editorId = 'block-editor',
  mode = 'edit',
  enableMarkdown = true,
  enableSyntaxHighlight = true,
  enableMath = true,
  onLinkClick,
  onTagClick,
  onBlockReferenceClick,
  showRichTextToolbar = true,
  enableKeyboardShortcuts = true,
  enableCodeEditor = true,
  defaultCodeLanguage = 'javascript',
  eventBus
}) => {
  // 编辑器状态
  const [state, setState] = useState<BlockEditorState>({
    value: initialValue,
    hasUnsavedChanges: false,
    isSaving: false,
    currentMode: mode,
    isParsing: false,
    activeFormats: [],
    selectedBlockType: 'paragraph',
    codeEditorVisible: false,
    currentCodeLanguage: defaultCodeLanguage
  });

  // 自动保存定时器
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // 编辑器引用
  const editorRef = useRef<HTMLDivElement>(null);

  // 快捷键管理器引用
  const shortcutsRef = useRef<KeyboardShortcuts | null>(null);

  // 命令系统引用
  const commandSystemRef = useRef<CommandSystem | null>(null);

  // 块导航系统引用
  const blockNavigationRef = useRef<BlockNavigation | null>(null);

  // 命令面板状态
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);

  // 增强块菜单状态
  const [enhancedBlockMenuVisible, setEnhancedBlockMenuVisible] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // 代码高亮服务引用
  const codeHighlightService = useMemo(() => new CodeHighlightService(), []);

  // Markdown解析器
  const markdownParser = useMemo(() => new MarkdownParser({
    enableSyntaxHighlight,
    enableMath,
    enableBidirectionalLinks: true,
    enableTags: true,
    enableBlockReferences: true
  }), [enableSyntaxHighlight, enableMath]);

  /**
   * 处理格式化
   */
  const handleFormat = useCallback((format: FormatType) => {
    // 这里将集成到Slate.js的格式化逻辑
    // 目前先更新状态
    setState(prev => {
      const newFormats = prev.activeFormats.includes(format)
        ? prev.activeFormats.filter(f => f !== format)
        : [...prev.activeFormats, format];

      return {
        ...prev,
        activeFormats: newFormats,
        hasUnsavedChanges: true
      };
    });

    // 发送格式化事件
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent(EDITOR_EVENTS.TEXT_FORMATTED, {
        detail: {
          editorId,
          format,
          timestamp: Date.now()
        }
      }));
    }
  }, [editorId]);

  /**
   * 处理块格式化
   */
  const handleBlockFormat = useCallback((blockType: BlockFormatType) => {
    // 这里将集成到Slate.js的块格式化逻辑
    // 目前先更新状态
    setState(prev => ({
      ...prev,
      selectedBlockType: blockType,
      hasUnsavedChanges: true
    }));

    // 发送块格式化事件
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent(EDITOR_EVENTS.BLOCK_UPDATED, {
        detail: {
          editorId,
          blockType,
          timestamp: Date.now()
        }
      }));
    }
  }, [editorId]);

  /**
   * 处理链接插入
   */
  const handleInsertLink = useCallback(() => {
    const url = prompt('请输入链接地址:');
    if (url) {
      // 这里将集成到Slate.js的链接插入逻辑
      console.log('插入链接:', url);

      // 发送链接创建事件
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent(EDITOR_EVENTS.LINK_CREATED, {
          detail: {
            editorId,
            url,
            timestamp: Date.now()
          }
        }));
      }
    }
  }, [editorId]);

  /**
   * 处理代码编辑器切换
   */
  const handleToggleCodeEditor = useCallback(() => {
    setState(prev => ({
      ...prev,
      codeEditorVisible: !prev.codeEditorVisible
    }));
  }, []);

  /**
   * 处理代码语言变更
   */
  const handleCodeLanguageChange = useCallback((language: SupportedLanguage) => {
    setState(prev => ({
      ...prev,
      currentCodeLanguage: language
    }));
  }, []);

  /**
   * 处理代码内容变更
   */
  const handleCodeChange = useCallback((code: string) => {
    // 这里将集成到Slate.js的代码块更新逻辑
    // 目前先更新状态
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: true
    }));

    // 发送代码更新事件
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent(EDITOR_EVENTS.BLOCK_UPDATED, {
        detail: {
          editorId,
          blockType: 'code',
          language: state.currentCodeLanguage,
          content: code,
          timestamp: Date.now()
        }
      }));
    }
  }, [editorId, state.currentCodeLanguage]);

  /**
   * 切换编辑器模式
   */
  const switchMode = useCallback((newMode: EditorMode) => {
    setState(prev => ({ ...prev, currentMode: newMode }));
  }, []);

  /**
   * 从Markdown文本导入内容
   */
  const importFromMarkdown = useCallback(async (markdownText: string) => {
    if (!enableMarkdown) return;

    setState(prev => ({ ...prev, isParsing: true, error: undefined }));

    try {
      const parseResult = await markdownParser.parseMarkdownToSlate(markdownText);

      if (parseResult.errors.length > 0) {
        setState(prev => ({
          ...prev,
          isParsing: false,
          error: `解析警告: ${parseResult.errors.join(', ')}`
        }));
      } else {
        setState(prev => ({ ...prev, isParsing: false }));
      }

      if (Array.isArray(parseResult.content)) {
        const newValue = parseResult.content;
        setState(prev => ({
          ...prev,
          value: newValue,
          hasUnsavedChanges: true
        }));
        onChange?.(newValue);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '解析失败';
      setState(prev => ({
        ...prev,
        isParsing: false,
        error: errorMessage
      }));
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [enableMarkdown, markdownParser, onChange, onError]);

  /**
   * 导出为Markdown文本
   */
  const exportToMarkdown = useCallback(async (): Promise<string> => {
    if (!enableMarkdown) return '';

    try {
      return await markdownParser.parseSlateToMarkdown(state.value);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导出失败';
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      return '';
    }
  }, [enableMarkdown, markdownParser, state.value, onError]);

  /**
   * 初始化命令系统和块导航
   */
  useEffect(() => {
    if (!enableKeyboardShortcuts || !eventBus) return;

    // 初始化命令系统
    commandSystemRef.current = new CommandSystem(eventBus);

    // 初始化块导航系统（需要Slate编辑器实例）
    // blockNavigationRef.current = new BlockNavigation(editor);

    return () => {
      commandSystemRef.current = null;
      blockNavigationRef.current?.destroy();
      blockNavigationRef.current = null;
    };
  }, [enableKeyboardShortcuts, eventBus]);

  /**
   * 初始化快捷键
   */
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    shortcutsRef.current = createKeyboardShortcuts({
      onFormat: handleFormat,
      onBlockFormat: handleBlockFormat,
      onInsertLink: handleInsertLink,
      onSave: handleSave,
      onUndo: () => {
        // 这里将集成到Slate.js的撤销逻辑
        console.log('撤销操作');
      },
      onRedo: () => {
        // 这里将集成到Slate.js的重做逻辑
        console.log('重做操作');
      },
      onCommandPalette: () => {
        setCommandPaletteVisible(true);
      },
      onSelectBlock: () => {
        // 选择当前块
        console.log('选择当前块');
      },
      onNavigateBlock: (direction) => {
        if (blockNavigationRef.current) {
          const navDirection = direction === 'up' ? NavigationDirection.UP :
                              direction === 'down' ? NavigationDirection.DOWN :
                              direction === 'first' ? NavigationDirection.FIRST :
                              NavigationDirection.LAST;
          blockNavigationRef.current.navigateToBlock(navDirection);
        }
      },
      onIndent: () => {
        if (blockNavigationRef.current) {
          blockNavigationRef.current.executeBlockOperation(BlockOperation.INDENT);
        }
      },
      onOutdent: () => {
        if (blockNavigationRef.current) {
          blockNavigationRef.current.executeBlockOperation(BlockOperation.OUTDENT);
        }
      },
      onCopyBlock: () => {
        if (blockNavigationRef.current) {
          blockNavigationRef.current.executeBlockOperation(BlockOperation.COPY);
        }
      },
      onCutBlock: () => {
        if (blockNavigationRef.current) {
          blockNavigationRef.current.executeBlockOperation(BlockOperation.CUT);
        }
      },
      onPasteBlock: () => {
        if (blockNavigationRef.current) {
          blockNavigationRef.current.pasteBlocks();
        }
      },
      onDeleteBlock: () => {
        if (blockNavigationRef.current) {
          blockNavigationRef.current.executeBlockOperation(BlockOperation.DELETE);
        }
      },
      onDuplicateBlock: () => {
        if (blockNavigationRef.current) {
          blockNavigationRef.current.executeBlockOperation(BlockOperation.DUPLICATE);
        }
      },
      onMoveBlock: (direction) => {
        if (blockNavigationRef.current) {
          const operation = direction === 'up' ? BlockOperation.MOVE_UP : BlockOperation.MOVE_DOWN;
          blockNavigationRef.current.executeBlockOperation(operation);
        }
      }
    });

    return () => {
      shortcutsRef.current = null;
    };
  }, [enableKeyboardShortcuts, handleFormat, handleBlockFormat, handleInsertLink, handleSave]);

  /**
   * 处理键盘事件
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // 处理斜杠命令
    if (event.key === '/' && !enhancedBlockMenuVisible) {
      event.preventDefault();

      // 获取当前光标位置
      const rect = event.currentTarget.getBoundingClientRect();
      setBlockMenuPosition({
        x: rect.left + 20,
        y: rect.top + 40
      });
      setEnhancedBlockMenuVisible(true);
      return;
    }

    // 处理Escape键
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

    // 处理快捷键
    if (enableKeyboardShortcuts && shortcutsRef.current) {
      const handled = shortcutsRef.current.handleKeyDown(event.nativeEvent);
      if (handled) {
        return;
      }
    }
  }, [enableKeyboardShortcuts, enhancedBlockMenuVisible, commandPaletteVisible]);

  /**
   * 处理内容变更
   */
  const handleChange = useCallback((newValue: CustomElement[]) => {
    setState(prev => ({
      ...prev,
      value: newValue,
      hasUnsavedChanges: true,
      error: undefined
    }));

    // 触发变更回调
    onChange?.(newValue);

    // 发送编辑器事件
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent(EDITOR_EVENTS.CONTENT_CHANGED, {
        detail: {
          editorId,
          value: newValue,
          timestamp: Date.now()
        }
      }));
    }
  }, [onChange, editorId]);

  /**
   * 处理命令选择
   */
  const handleCommandSelect = useCallback(async (commandId: string) => {
    if (!commandSystemRef.current) return;

    try {
      const context = {
        editor: null, // TODO: 传入Slate编辑器实例
        selection: null,
        query: '',
        data: { editorId }
      };

      await commandSystemRef.current.executeCommand(commandId, context);
    } catch (error) {
      console.error('执行命令失败:', error);
      onError?.(error instanceof Error ? error : new Error('命令执行失败'));
    }
  }, [editorId, onError]);

  /**
   * 保存内容
   */
  const handleSave = useCallback(async () => {
    if (!state.hasUnsavedChanges || state.isSaving) {
      return;
    }

    setState(prev => ({ ...prev, isSaving: true, error: undefined }));

    try {
      // 执行保存回调
      await onSave?.(state.value);

      setState(prev => ({
        ...prev,
        hasUnsavedChanges: false,
        isSaving: false,
        lastSavedAt: new Date()
      }));

      // 发送保存成功事件
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent(EDITOR_EVENTS.AUTO_SAVE_SUCCESS, {
          detail: {
            editorId,
            value: state.value,
            timestamp: Date.now()
          }
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存失败';
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage
      }));

      // 触发错误回调
      onError?.(error instanceof Error ? error : new Error(errorMessage));

      // 发送保存失败事件
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent(EDITOR_EVENTS.AUTO_SAVE_ERROR, {
          detail: {
            editorId,
            error: errorMessage,
            timestamp: Date.now()
          }
        }));
      }
    }
  }, [state.value, state.hasUnsavedChanges, state.isSaving, onSave, onError, editorId]);

  /**
   * 设置自动保存
   */
  useEffect(() => {
    if (!autoSave || readOnly || !state.hasUnsavedChanges) {
      return;
    }

    // 清除现有定时器
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // 设置新的定时器
    const timer = setTimeout(() => {
      handleSave();
    }, autoSaveInterval);

    setAutoSaveTimer(timer);

    // 清理函数
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [autoSave, readOnly, state.hasUnsavedChanges, autoSaveInterval, handleSave, autoSaveTimer]);

  /**
   * 组件卸载时清理定时器
   */
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  /**
   * 计算编辑器样式
   */
  const editorStyle = useMemo(() => ({
    minHeight: '200px',
    border: '1px solid #e1e5e9',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '16px',
    lineHeight: '1.6',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    ...style
  }), [style]);

  /**
   * 计算编辑器类名
   */
  const editorClassName = useMemo(() => {
    const baseClass = 'minglog-block-editor';
    const statusClass = state.hasUnsavedChanges ? 'has-changes' : 'saved';
    const readOnlyClass = readOnly ? 'read-only' : 'editable';
    const errorClass = state.error ? 'has-error' : '';
    
    return [baseClass, statusClass, readOnlyClass, errorClass, className]
      .filter(Boolean)
      .join(' ');
  }, [state.hasUnsavedChanges, state.error, readOnly, className]);

  return (
    <div
      className="minglog-block-editor-container"
      ref={editorRef}
      onKeyDown={handleKeyDown}
    >
      {/* 富文本工具栏 */}
      {showRichTextToolbar && !readOnly && (
        <RichTextToolbar
          activeFormats={state.activeFormats}
          currentBlockType={state.selectedBlockType}
          readOnly={readOnly}
          onFormat={handleFormat}
          onBlockFormat={handleBlockFormat}
          onInsertLink={handleInsertLink}
          onToggleCodeEditor={enableCodeEditor ? handleToggleCodeEditor : undefined}
          onUndo={() => {
            // 撤销逻辑
            console.log('撤销');
          }}
          onRedo={() => {
            // 重做逻辑
            console.log('重做');
          }}
        />
      )}

      {/* 编辑器工具栏 */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          {/* 模式切换按钮 */}
          {enableMarkdown && (
            <div className="mode-switcher">
              <button
                className={`mode-button ${state.currentMode === 'edit' ? 'active' : ''}`}
                onClick={() => switchMode('edit')}
                title="编辑模式"
              >
                ✏️ 编辑
              </button>
              <button
                className={`mode-button ${state.currentMode === 'preview' ? 'active' : ''}`}
                onClick={() => switchMode('preview')}
                title="预览模式"
              >
                👁️ 预览
              </button>
              <button
                className={`mode-button ${state.currentMode === 'split' ? 'active' : ''}`}
                onClick={() => switchMode('split')}
                title="分屏模式"
              >
                📱 分屏
              </button>
            </div>
          )}
        </div>

        <div className="toolbar-right">
          {/* 状态信息 */}
          <div className="status-info">
            {state.isParsing && (
              <span className="status-parsing">🔄 正在解析...</span>
            )}
            {state.isSaving && (
              <span className="status-saving">💾 正在保存...</span>
            )}
            {state.hasUnsavedChanges && !state.isSaving && !state.isParsing && (
              <span className="status-unsaved">● 有未保存的更改</span>
            )}
            {!state.hasUnsavedChanges && !state.isSaving && state.lastSavedAt && (
              <span className="status-saved">
                ✅ 已保存 {state.lastSavedAt.toLocaleTimeString()}
              </span>
            )}
            {state.error && (
              <span className="status-error">❌ {state.error}</span>
            )}
          </div>

          {/* 操作按钮 */}
          {!readOnly && (
            <div className="action-buttons">
              {enableMarkdown && (
                <>
                  <button
                    className="action-button"
                    onClick={async () => {
                      const markdown = await exportToMarkdown();
                      navigator.clipboard?.writeText(markdown);
                    }}
                    title="复制Markdown"
                  >
                    📋 复制MD
                  </button>
                  <button
                    className="action-button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        await importFromMarkdown(text);
                      } catch (error) {
                        console.error('粘贴失败:', error);
                      }
                    }}
                    title="粘贴Markdown"
                  >
                    📥 粘贴MD
                  </button>
                </>
              )}
              <button
                className="save-button"
                onClick={handleSave}
                disabled={!state.hasUnsavedChanges || state.isSaving}
                title="保存文档 (Ctrl+S)"
              >
                💾 保存
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 代码编辑器 */}
      {state.codeEditorVisible && enableCodeEditor && (
        <div className="code-editor-panel">
          <div className="code-editor-header">
            <h3>代码编辑器</h3>
            <button
              className="close-button"
              onClick={handleToggleCodeEditor}
              title="关闭代码编辑器"
            >
              ✕
            </button>
          </div>
          <CodeEditor
            value=""
            language={state.currentCodeLanguage}
            readOnly={readOnly}
            showLineNumbers={true}
            enableSyntaxHighlight={enableSyntaxHighlight}
            autoDetectLanguage={true}
            theme="light"
            fontSize={14}
            tabSize={2}
            autoIndent={true}
            placeholder="请输入代码..."
            maxHeight={400}
            onChange={handleCodeChange}
            onLanguageChange={handleCodeLanguageChange}
            className="block-code-editor"
          />
        </div>
      )}

      {/* 编辑器内容区域 */}
      <div className="editor-content">
        {state.currentMode === 'edit' && (
          <BaseBlockEditor
            value={state.value}
            onChange={handleChange}
            readOnly={readOnly}
            placeholder={placeholder}
            className={editorClassName}
            style={editorStyle}
            {...{
              editorId,
              supportedBlockTypes
            }}
          />
        )}

        {state.currentMode === 'preview' && enableMarkdown && (
          <MarkdownPreview
            content={state.value}
            className="preview-panel"
            style={editorStyle}
            onLinkClick={onLinkClick}
            onTagClick={onTagClick}
            onBlockReferenceClick={onBlockReferenceClick}
            enableSyntaxHighlight={enableSyntaxHighlight}
            enableMath={enableMath}
          />
        )}

        {state.currentMode === 'split' && enableMarkdown && (
          <div className="split-view">
            <div className="split-editor">
              <BaseBlockEditor
                value={state.value}
                onChange={handleChange}
                readOnly={readOnly}
                placeholder={placeholder}
                className={editorClassName}
                style={{ ...editorStyle, height: '100%' }}
                {...{
                  editorId,
                  supportedBlockTypes
                }}
              />
            </div>
            <div className="split-preview">
              <MarkdownPreview
                content={state.value}
                className="preview-panel"
                style={{ ...editorStyle, height: '100%' }}
                onLinkClick={onLinkClick}
                onTagClick={onTagClick}
                onBlockReferenceClick={onBlockReferenceClick}
                enableSyntaxHighlight={enableSyntaxHighlight}
                enableMath={enableMath}
              />
            </div>
          </div>
        )}
      </div>

      {/* 编辑器信息 */}
      <div className="editor-info">
        <span className="word-count">
          字数: {state.value.reduce((count, node) => {
            return count + (node.children?.[0] as CustomText)?.text?.length || 0;
          }, 0)}
        </span>
        <span className="block-count">
          块数: {state.value.length}
        </span>
      </div>

      {/* 全局命令面板 */}
      {commandSystemRef.current && (
        <CommandPalette
          visible={commandPaletteVisible}
          onClose={() => setCommandPaletteVisible(false)}
          commandSystem={commandSystemRef.current}
          editorContext={{
            editor: null, // TODO: 传入Slate编辑器实例
            selection: null,
            data: { editorId }
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
          allowedBlocks={supportedBlockTypes}
        />
      )}
    </div>
  );
};

/**
 * 导出块编辑器组件
 */
export default BlockEditor;
