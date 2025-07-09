/**
 * MingLog Editor 类型定义
 */

import { BaseEditor, Descendant } from 'slate'
import { ReactEditor } from 'slate-react'
import { HistoryEditor } from 'slate-history'

// 扩展Slate编辑器类型
export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor

// 块类型定义
export type BlockType =
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
  | 'divider'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'table'
  | 'callout'
  | 'toggle'
  | 'columns'
  | 'embed'
  | 'math'
  | 'mermaid'

// 文本格式
export interface TextFormat {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  code?: boolean
  color?: string
  backgroundColor?: string
}

// 自定义文本元素
export interface CustomText extends TextFormat {
  text: string
}

// 块元素基础接口
export interface BaseElement {
  id: string
  type: BlockType
  children: Descendant[]
  createdAt?: string
  updatedAt?: string
}

// 段落元素
export interface ParagraphElement extends BaseElement {
  type: 'paragraph'
  align?: 'left' | 'center' | 'right' | 'justify'
}

// 标题元素
export interface HeadingElement extends BaseElement {
  type: 'heading-1' | 'heading-2' | 'heading-3' | 'heading-4' | 'heading-5' | 'heading-6'
  align?: 'left' | 'center' | 'right'
}

// 列表元素
export interface ListElement extends BaseElement {
  type: 'bulleted-list' | 'numbered-list' | 'todo-list'
  level?: number
  checked?: boolean // for todo-list
}

// 引用元素
export interface QuoteElement extends BaseElement {
  type: 'quote'
  author?: string
}

// 代码块元素
export interface CodeElement extends BaseElement {
  type: 'code'
  language?: string
  showLineNumbers?: boolean
}

// 分割线元素
export interface DividerElement extends BaseElement {
  type: 'divider'
}

// 图片元素
export interface ImageElement extends BaseElement {
  type: 'image'
  url: string
  alt?: string
  caption?: string
  width?: number
  height?: number
}

// 表格元素
export interface TableElement extends BaseElement {
  type: 'table'
  columns: number
  rows: number
}

// 标注元素
export interface CalloutElement extends BaseElement {
  type: 'callout'
  icon?: string
  color?: string
}

// 折叠元素
export interface ToggleElement extends BaseElement {
  type: 'toggle'
  isOpen?: boolean
  title: string
}

// 视频元素
export interface VideoElement extends BaseElement {
  type: 'video'
  url: string
  poster?: string
  caption?: string
  width?: number
  height?: number
  autoplay?: boolean
  controls?: boolean
}

// 音频元素
export interface AudioElement extends BaseElement {
  type: 'audio'
  url: string
  caption?: string
  autoplay?: boolean
  controls?: boolean
}

// 文件元素
export interface FileElement extends BaseElement {
  type: 'file'
  url: string
  filename: string
  size?: number
  mimeType?: string
}

// 分栏元素
export interface ColumnsElement extends BaseElement {
  type: 'columns'
  columnCount: number
  columnGap?: number
}

// 嵌入元素
export interface EmbedElement extends BaseElement {
  type: 'embed'
  url: string
  embedType: 'youtube' | 'vimeo' | 'codepen' | 'figma' | 'custom'
  width?: number
  height?: number
}

// 数学公式元素
export interface MathElement extends BaseElement {
  type: 'math'
  formula: string
  inline?: boolean
}

// Mermaid图表元素
export interface MermaidElement extends BaseElement {
  type: 'mermaid'
  chart: string
  theme?: 'default' | 'dark' | 'forest' | 'neutral'
}

// 联合类型
export type CustomElement =
  | ParagraphElement
  | HeadingElement
  | ListElement
  | QuoteElement
  | CodeElement
  | DividerElement
  | ImageElement
  | VideoElement
  | AudioElement
  | FileElement
  | TableElement
  | CalloutElement
  | ToggleElement
  | ColumnsElement
  | EmbedElement
  | MathElement
  | MermaidElement

// 编辑器配置
export interface EditorConfig {
  placeholder?: string
  readOnly?: boolean
  autoFocus?: boolean
  spellCheck?: boolean
  maxLength?: number
  allowedBlocks?: BlockType[]
  showBlockMenu?: boolean
  showFormatToolbar?: boolean
  enableDragDrop?: boolean
  enableKeyboardShortcuts?: boolean
}

// 编辑器事件
export interface EditorEvents {
  onChange?: (value: Descendant[]) => void
  onSelectionChange?: (selection: any) => void
  onFocus?: () => void
  onBlur?: () => void
  onKeyDown?: (event: KeyboardEvent) => void
  onBlockCreate?: (block: CustomElement) => void
  onBlockUpdate?: (block: CustomElement) => void
  onBlockDelete?: (blockId: string) => void
}

// 块菜单项
export interface BlockMenuItem {
  type: BlockType
  title: string
  description: string
  icon: string
  keywords: string[]
  group: 'basic' | 'media' | 'advanced'
}

// 格式化工具栏项
export interface FormatToolbarItem {
  type: string
  icon: string
  title: string
  isActive: (editor: CustomEditor) => boolean
  onToggle: (editor: CustomEditor) => void
  shortcut?: string
}

// 拖拽数据
export interface DragData {
  blockId: string
  blockType: BlockType
  sourceIndex: number
}

// 编辑器状态
export interface EditorState {
  value: Descendant[]
  selection: any
  isComposing: boolean
  isDragging: boolean
  activeBlock?: string
  showBlockMenu: boolean
  blockMenuPosition?: { x: number; y: number }
  showFormatToolbar: boolean
  formatToolbarPosition?: { x: number; y: number }
}

// 块树节点
export interface BlockTreeNode {
  id: string
  type: BlockType
  title: string
  level: number
  children: BlockTreeNode[]
  isExpanded?: boolean
  isSelected?: boolean
}

// 导出的主要组件Props
export interface BlockEditorProps extends EditorConfig, EditorEvents {
  value?: Descendant[]
  className?: string
  style?: React.CSSProperties
}

export interface BlockTreeProps {
  blocks: BlockTreeNode[]
  onBlockSelect?: (blockId: string) => void
  onBlockToggle?: (blockId: string) => void
  onBlockMove?: (fromId: string, toId: string) => void
  className?: string
}

// 声明模块扩展
declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor
    Element: CustomElement
    Text: CustomText
  }
}
