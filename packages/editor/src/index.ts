/**
 * @minglog/editor 主导出文件
 */

// 主要组件
export { default as BlockEditor } from './components/BlockEditor'
export { default as BlockTree } from './components/BlockTree'
export { default as BlockElement } from './components/BlockElement'
export { default as BlockMenu } from './components/BlockMenu'
export { MubuBlockEditor } from './components/MubuBlockEditor'
export { MubuBlockElement } from './components/MubuBlockElement'

// 类型定义
export type {
  BlockEditorProps,
  BlockTreeProps,
  BlockType,
  CustomElement,
  CustomText,
  CustomEditor,
  EditorConfig,
  EditorEvents,
  BlockTreeNode,
  BlockMenuItem,
  ParagraphElement,
  HeadingElement,
  ListElement,
  QuoteElement,
  CodeElement,
  DividerElement,
  ImageElement,
  TableElement,
  CalloutElement,
  ToggleElement,
  TextFormat,
  EditorState,
  DragData,
  BlockMetadata,
  MubuShortcutConfig,
  MubuEditorConfig
} from './types'

// 工具函数
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
} from './utils/editor'

// 版本信息
export const version = '1.0.0'
