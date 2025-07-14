/**
 * 代码编辑器组件
 * 提供专业的代码编辑和高亮功能
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CodeHighlightService, type SupportedLanguage, type HighlightOptions, type HighlightResult } from '../services/CodeHighlightService';

/**
 * 代码编辑器属性接口
 */
export interface CodeEditorProps {
  /** 代码内容 */
  value: string;
  /** 编程语言 */
  language?: SupportedLanguage;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否显示行号 */
  showLineNumbers?: boolean;
  /** 是否启用语法高亮 */
  enableSyntaxHighlight?: boolean;
  /** 是否启用自动检测语言 */
  autoDetectLanguage?: boolean;
  /** 高亮的行号 */
  highlightLines?: number[];
  /** 主题名称 */
  theme?: 'light' | 'dark' | 'auto';
  /** 字体大小 */
  fontSize?: number;
  /** Tab大小 */
  tabSize?: number;
  /** 是否启用自动缩进 */
  autoIndent?: boolean;
  /** 是否启用代码折叠 */
  enableCodeFolding?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 最大高度 */
  maxHeight?: number;
  /** 内容变更回调 */
  onChange?: (value: string) => void;
  /** 语言变更回调 */
  onLanguageChange?: (language: SupportedLanguage) => void;
  /** 焦点事件回调 */
  onFocus?: () => void;
  /** 失焦事件回调 */
  onBlur?: () => void;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 代码编辑器状态接口
 */
interface CodeEditorState {
  /** 当前语言 */
  currentLanguage: SupportedLanguage;
  /** 高亮结果 */
  highlightResult: HighlightResult | null;
  /** 是否正在高亮 */
  isHighlighting: boolean;
  /** 光标位置 */
  cursorPosition: { line: number; column: number };
  /** 是否聚焦 */
  isFocused: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 代码编辑器组件实现
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  value = '',
  language,
  readOnly = false,
  showLineNumbers = true,
  enableSyntaxHighlight = true,
  autoDetectLanguage = true,
  highlightLines = [],
  theme = 'light',
  fontSize = 14,
  tabSize = 2,
  autoIndent = true,
  enableCodeFolding = false,
  placeholder = '请输入代码...',
  maxHeight = 500,
  onChange,
  onLanguageChange,
  onFocus,
  onBlur,
  className = '',
  style
}) => {
  // 代码高亮服务实例
  const highlightService = useMemo(() => new CodeHighlightService(), []);

  // 编辑器状态
  const [state, setState] = useState<CodeEditorState>({
    currentLanguage: language || 'text',
    highlightResult: null,
    isHighlighting: false,
    cursorPosition: { line: 1, column: 1 },
    isFocused: false,
    error: null
  });

  // DOM引用
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * 获取支持的语言列表
   */
  const supportedLanguages = useMemo(() => {
    return highlightService.getSupportedLanguages();
  }, [highlightService]);

  /**
   * 执行语法高亮
   */
  const performHighlight = useCallback(async (code: string, lang?: SupportedLanguage) => {
    if (!enableSyntaxHighlight || !code.trim()) {
      setState(prev => ({
        ...prev,
        highlightResult: null,
        isHighlighting: false
      }));
      return;
    }

    setState(prev => ({ ...prev, isHighlighting: true, error: null }));

    try {
      const options: HighlightOptions = {
        language: lang || state.currentLanguage,
        showLineNumbers,
        highlightLines,
        autoDetect: autoDetectLanguage && !lang
      };

      const result = await highlightService.highlightCode(code, options);

      setState(prev => ({
        ...prev,
        highlightResult: result,
        currentLanguage: result.language,
        isHighlighting: false
      }));

      // 如果语言发生变化，通知父组件
      if (result.language !== state.currentLanguage && onLanguageChange) {
        onLanguageChange(result.language);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isHighlighting: false,
        error: error instanceof Error ? error.message : '高亮失败'
      }));
    }
  }, [enableSyntaxHighlight, showLineNumbers, highlightLines, autoDetectLanguage, state.currentLanguage, onLanguageChange, highlightService]);

  /**
   * 处理内容变更
   */
  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    onChange?.(newValue);
    
    // 延迟执行高亮以提高性能
    setTimeout(() => {
      performHighlight(newValue);
    }, 100);
  }, [onChange, performHighlight]);

  /**
   * 处理语言变更
   */
  const handleLanguageChange = useCallback((newLanguage: SupportedLanguage) => {
    setState(prev => ({ ...prev, currentLanguage: newLanguage }));
    onLanguageChange?.(newLanguage);
    performHighlight(value, newLanguage);
  }, [value, onLanguageChange, performHighlight]);

  /**
   * 处理键盘事件
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;

    const textarea = event.currentTarget;
    const { selectionStart, selectionEnd } = textarea;

    // Tab键处理
    if (event.key === 'Tab') {
      event.preventDefault();
      const tabString = ' '.repeat(tabSize);
      const newValue = value.substring(0, selectionStart) + tabString + value.substring(selectionEnd);
      onChange?.(newValue);
      
      // 设置光标位置
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + tabSize;
      }, 0);
    }

    // 自动缩进处理
    if (event.key === 'Enter' && autoIndent) {
      const lines = value.substring(0, selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];
      const indent = currentLine.match(/^\s*/)?.[0] || '';
      
      // 如果当前行以 { 结尾，增加缩进
      const extraIndent = currentLine.trim().endsWith('{') ? ' '.repeat(tabSize) : '';
      
      event.preventDefault();
      const newValue = value.substring(0, selectionStart) + '\n' + indent + extraIndent + value.substring(selectionEnd);
      onChange?.(newValue);
      
      // 设置光标位置
      setTimeout(() => {
        const newPosition = selectionStart + 1 + indent.length + extraIndent.length;
        textarea.selectionStart = textarea.selectionEnd = newPosition;
      }, 0);
    }
  }, [readOnly, tabSize, value, onChange, autoIndent]);

  /**
   * 处理焦点事件
   */
  const handleFocus = useCallback(() => {
    setState(prev => ({ ...prev, isFocused: true }));
    onFocus?.();
  }, [onFocus]);

  /**
   * 处理失焦事件
   */
  const handleBlur = useCallback(() => {
    setState(prev => ({ ...prev, isFocused: false }));
    onBlur?.();
  }, [onBlur]);

  /**
   * 更新光标位置
   */
  const updateCursorPosition = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const { selectionStart } = textarea;
    const textBeforeCursor = value.substring(0, selectionStart);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;

    setState(prev => ({
      ...prev,
      cursorPosition: { line, column }
    }));
  }, [value]);

  /**
   * 初始化高亮
   */
  useEffect(() => {
    if (value) {
      performHighlight(value, language);
    }
  }, [value, language, performHighlight]);

  /**
   * 同步滚动
   */
  useEffect(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;

    if (!textarea || !highlight) return;

    const syncScroll = () => {
      highlight.scrollTop = textarea.scrollTop;
      highlight.scrollLeft = textarea.scrollLeft;
    };

    textarea.addEventListener('scroll', syncScroll);
    return () => textarea.removeEventListener('scroll', syncScroll);
  }, []);

  /**
   * 编辑器样式
   */
  const editorStyle: React.CSSProperties = {
    position: 'relative',
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    fontSize: `${fontSize}px`,
    lineHeight: '1.5',
    border: '1px solid #e1e5e9',
    borderRadius: '8px',
    backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
    color: theme === 'dark' ? '#d4d4d4' : '#333333',
    maxHeight: `${maxHeight}px`,
    overflow: 'hidden',
    ...style
  };

  /**
   * 文本区域样式
   */
  const textareaStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    padding: showLineNumbers ? '12px 12px 12px 60px' : '12px',
    border: 'none',
    outline: 'none',
    resize: 'none',
    backgroundColor: 'transparent',
    color: enableSyntaxHighlight ? 'transparent' : 'inherit',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    whiteSpace: 'pre',
    overflow: 'auto',
    caretColor: theme === 'dark' ? '#ffffff' : '#000000',
    tabSize
  };

  /**
   * 高亮层样式
   */
  const highlightStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    padding: showLineNumbers ? '12px 12px 12px 60px' : '12px',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    whiteSpace: 'pre',
    overflow: 'hidden',
    pointerEvents: 'none',
    tabSize
  };

  return (
    <div className={`code-editor ${className}`} style={editorStyle} ref={containerRef}>
      {/* 语言选择器 */}
      {!readOnly && (
        <div className="code-editor-header">
          <select
            value={state.currentLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            className="language-selector"
          >
            {supportedLanguages.map(lang => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
          
          {state.isHighlighting && (
            <span className="highlight-status">正在高亮...</span>
          )}
          
          {state.error && (
            <span className="error-status" title={state.error}>
              ⚠️ 高亮错误
            </span>
          )}
        </div>
      )}

      {/* 编辑器主体 */}
      <div className="code-editor-body">
        {/* 高亮层 */}
        {enableSyntaxHighlight && state.highlightResult && (
          <div
            ref={highlightRef}
            className="highlight-layer"
            style={highlightStyle}
            dangerouslySetInnerHTML={{ __html: state.highlightResult.html }}
          />
        )}

        {/* 文本输入区域 */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSelect={updateCursorPosition}
          onMouseUp={updateCursorPosition}
          onKeyUp={updateCursorPosition}
          readOnly={readOnly}
          placeholder={placeholder}
          style={textareaStyle}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          data-testid="code-editor-textarea"
        />
      </div>

      {/* 状态栏 */}
      <div className="code-editor-footer">
        <span className="cursor-position">
          行 {state.cursorPosition.line}, 列 {state.cursorPosition.column}
        </span>
        <span className="language-info">
          {state.currentLanguage.toUpperCase()}
        </span>
        {state.highlightResult && (
          <span className="highlight-info">
            {state.highlightResult.tokenCount} tokens, {state.highlightResult.processingTime.toFixed(1)}ms
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * 默认导出
 */
export default CodeEditor;
