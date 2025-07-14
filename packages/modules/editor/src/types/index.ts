/**
 * 编辑器模块类型定义
 */

import type { CustomElement, CustomText } from '@minglog/editor';

/**
 * 文档接口
 */
export interface Document {
  /** 文档唯一标识 */
  id: string;
  /** 文档标题 */
  title: string;
  /** 文档内容（Slate.js格式） */
  content: CustomElement[];
  /** 文档元数据 */
  metadata: DocumentMetadata;
  /** 创建时间 */
  createdAt: string;
  /** 最后修改时间 */
  updatedAt: string;
  /** 文档版本 */
  version: number;
  /** 是否已保存 */
  isSaved: boolean;
  /** 是否为草稿 */
  isDraft: boolean;
}

/**
 * 文档元数据
 */
export interface DocumentMetadata {
  /** 作者 */
  author?: string;
  /** 标签 */
  tags: string[];
  /** 分类 */
  category?: string;
  /** 文档路径 */
  path: string;
  /** 文档大小（字符数） */
  size: number;
  /** 字数统计 */
  wordCount: number;
  /** 阅读时间估计（分钟） */
  readingTime: number;
  /** 最后访问时间 */
  lastAccessedAt?: string;
  /** 是否收藏 */
  isFavorite: boolean;
  /** 是否归档 */
  isArchived: boolean;
  /** 自定义属性 */
  customProperties: Record<string, any>;
}

/**
 * 块接口
 */
export interface Block extends CustomElement {
  /** 块元数据 */
  metadata: BlockMetadata;
}

/**
 * 块元数据
 */
export interface BlockMetadata {
  /** 块在文档中的位置 */
  position: number;
  /** 块的层级 */
  level: number;
  /** 块的父级ID */
  parentId?: string;
  /** 子块ID列表 */
  childrenIds: string[];
  /** 是否折叠 */
  isCollapsed: boolean;
  /** 是否选中 */
  isSelected: boolean;
  /** 是否聚焦 */
  isFocused: boolean;
  /** 自定义样式 */
  customStyles: Record<string, any>;
  /** 注释 */
  comments: Comment[];
}

/**
 * 注释接口
 */
export interface Comment {
  /** 注释ID */
  id: string;
  /** 注释内容 */
  content: string;
  /** 作者 */
  author: string;
  /** 创建时间 */
  createdAt: string;
  /** 是否已解决 */
  isResolved: boolean;
}

/**
 * 编辑器状态
 */
export interface EditorState {
  /** 当前文档 */
  currentDocument?: Document;
  /** 选中的块 */
  selectedBlocks: string[];
  /** 光标位置 */
  cursorPosition?: {
    blockId: string;
    offset: number;
  };
  /** 选择范围 */
  selection?: {
    start: { blockId: string; offset: number };
    end: { blockId: string; offset: number };
  };
  /** 撤销历史 */
  undoHistory: any[];
  /** 重做历史 */
  redoHistory: any[];
  /** 是否正在编辑 */
  isEditing: boolean;
  /** 是否只读模式 */
  isReadOnly: boolean;
  /** 是否全屏模式 */
  isFullscreen: boolean;
  /** 当前主题 */
  theme: 'light' | 'dark' | 'auto';
  /** 缩放级别 */
  zoomLevel: number;
}

/**
 * 编辑器选项
 */
export interface EditorOptions {
  /** 是否启用自动保存 */
  autoSave: boolean;
  /** 自动保存间隔（毫秒） */
  autoSaveInterval: number;
  /** 是否启用拼写检查 */
  spellCheck: boolean;
  /** 是否启用语法高亮 */
  syntaxHighlight: boolean;
  /** 是否启用行号 */
  lineNumbers: boolean;
  /** 是否启用代码折叠 */
  codeFolding: boolean;
  /** 是否启用双向链接 */
  bidirectionalLinks: boolean;
  /** 是否启用块拖拽 */
  blockDragging: boolean;
  /** 是否启用协作模式 */
  collaboration: boolean;
  /** 字体设置 */
  font: {
    family: string;
    size: number;
    lineHeight: number;
  };
  /** 编辑器主题 */
  theme: 'light' | 'dark' | 'auto';
  /** 快捷键配置 */
  shortcuts: Record<string, string>;
}

/**
 * 编辑器事件
 */
export interface EditorEvent {
  /** 事件类型 */
  type: string;
  /** 事件数据 */
  data: any;
  /** 事件时间戳 */
  timestamp: number;
  /** 事件来源 */
  source: string;
}

/**
 * 编辑器命令
 */
export interface EditorCommand {
  /** 命令ID */
  id: string;
  /** 命令名称 */
  name: string;
  /** 命令描述 */
  description: string;
  /** 命令快捷键 */
  shortcut?: string;
  /** 命令处理函数 */
  handler: (args?: any) => void | Promise<void>;
  /** 是否可用 */
  isEnabled: () => boolean;
  /** 命令分组 */
  group: string;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  /** 文档ID */
  documentId: string;
  /** 文档标题 */
  documentTitle: string;
  /** 匹配的块 */
  matches: SearchMatch[];
  /** 匹配分数 */
  score: number;
}

/**
 * 搜索匹配
 */
export interface SearchMatch {
  /** 块ID */
  blockId: string;
  /** 块内容 */
  blockContent: string;
  /** 匹配的文本片段 */
  fragments: string[];
  /** 匹配位置 */
  positions: { start: number; end: number }[];
}

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 导出格式 */
  format: 'markdown' | 'html' | 'pdf' | 'docx' | 'txt';
  /** 是否包含元数据 */
  includeMetadata: boolean;
  /** 是否包含图片 */
  includeImages: boolean;
  /** 是否包含链接 */
  includeLinks: boolean;
  /** 自定义样式 */
  customStyles?: string;
  /** 输出路径 */
  outputPath?: string;
}

/**
 * 导入选项
 */
export interface ImportOptions {
  /** 导入格式 */
  format: 'markdown' | 'html' | 'docx' | 'txt';
  /** 是否保留格式 */
  preserveFormatting: boolean;
  /** 是否解析链接 */
  parseLinks: boolean;
  /** 是否创建新文档 */
  createNewDocument: boolean;
  /** 目标文档ID（如果不创建新文档） */
  targetDocumentId?: string;
}

/**
 * 协作用户
 */
export interface CollaborationUser {
  /** 用户ID */
  id: string;
  /** 用户名 */
  name: string;
  /** 用户头像 */
  avatar?: string;
  /** 用户颜色 */
  color: string;
  /** 光标位置 */
  cursor?: {
    blockId: string;
    offset: number;
  };
  /** 是否在线 */
  isOnline: boolean;
  /** 最后活动时间 */
  lastActiveAt: string;
}

/**
 * 协作操作
 */
export interface CollaborationOperation {
  /** 操作ID */
  id: string;
  /** 操作类型 */
  type: 'insert' | 'delete' | 'format' | 'move';
  /** 操作数据 */
  data: any;
  /** 操作作者 */
  author: string;
  /** 操作时间戳 */
  timestamp: number;
  /** 操作版本 */
  version: number;
}
