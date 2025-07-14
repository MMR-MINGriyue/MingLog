/**
 * MingLog编辑器模块入口文件
 * 导出编辑器模块的所有公共接口和组件
 */

// 核心模块类
export { EditorModule } from './EditorModule';
export type { EditorModuleConfig, EditorService } from './EditorModule';

// 模块工厂
export { EditorModuleFactory, EditorModuleFactoryInstance } from './EditorModuleFactory';

// 编辑器组件
export { BlockEditor } from './components/BlockEditor';
export type { BlockEditorProps, EditorMode } from './components/BlockEditor';
export { MarkdownPreview } from './components/MarkdownPreview';
export type { MarkdownPreviewProps } from './components/MarkdownPreview';
export { RichTextToolbar } from './components/RichTextToolbar';
export type { RichTextToolbarProps, FormatType, BlockFormatType } from './components/RichTextToolbar';
export { CodeEditor } from './components/CodeEditor';
export type { CodeEditorProps } from './components/CodeEditor';

// 从@minglog/editor包重新导出基础组件
export { BlockEditor as BaseBlockEditor } from '@minglog/editor';
export { BlockElement } from '@minglog/editor';
export type { CustomElement, CustomText, BlockType } from '@minglog/editor';

// 编辑器工具函数
export {
  generateId,
  getDefaultValue,
  normalizeValue,
  createBlock,
  isEmptyBlock,
  getBlockText,
  canContainBlocks,
  isInlineBlock,
  getBlockTitle,
  getBlockLevel,
  serializeToText,
  serializeToMarkdown
} from '@minglog/editor';

// 编辑器服务和管理器
export { MarkdownParser } from './services/MarkdownParser';
export type { MarkdownParseOptions, ParseResult } from './services/MarkdownParser';
export { CodeHighlightService } from './services/CodeHighlightService';
export type { SupportedLanguage, LanguageConfig, HighlightResult, HighlightOptions } from './services/CodeHighlightService';

// 未来的服务（待实现）
// export { EditorServiceManager } from './services/EditorServiceManager';
// export { DocumentManager } from './services/DocumentManager';
// export { BlockManager } from './services/BlockManager';
// export { LinkIntegrationService } from './services/LinkIntegrationService';

// 类型定义
export type {
  Document,
  DocumentMetadata,
  Block,
  BlockMetadata,
  EditorState,
  EditorOptions,
  EditorEvent,
  EditorCommand
} from './types';

// 常量
export { EDITOR_EVENTS, BLOCK_TYPES, EDITOR_COMMANDS } from './constants';

// 工具和辅助函数
export { KeyboardShortcuts, createKeyboardShortcuts } from './utils/KeyboardShortcuts';
export type { ShortcutConfig, ShortcutHandlers } from './utils/KeyboardShortcuts';

// 默认配置（待实现）
// export { DEFAULT_EDITOR_CONFIG } from './config/defaultConfig';
