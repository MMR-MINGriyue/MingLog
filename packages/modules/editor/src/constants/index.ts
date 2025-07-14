/**
 * 编辑器模块常量定义
 */

/**
 * 编辑器事件常量
 */
export const EDITOR_EVENTS = {
  // 模块生命周期事件
  INITIALIZED: 'editor:initialized',
  ACTIVATED: 'editor:activated',
  DEACTIVATED: 'editor:deactivated',
  DESTROYED: 'editor:destroyed',

  // 文档事件
  DOCUMENT_CREATED: 'editor:document:created',
  DOCUMENT_OPENED: 'editor:document:opened',
  DOCUMENT_SAVED: 'editor:document:saved',
  DOCUMENT_DELETED: 'editor:document:deleted',
  DOCUMENT_CHANGED: 'editor:document:changed',
  DOCUMENT_CLOSED: 'editor:document:closed',

  // 块事件
  BLOCK_CREATED: 'editor:block:created',
  BLOCK_UPDATED: 'editor:block:updated',
  BLOCK_DELETED: 'editor:block:deleted',
  BLOCK_MOVED: 'editor:block:moved',
  BLOCK_SELECTED: 'editor:block:selected',
  BLOCK_DESELECTED: 'editor:block:deselected',

  // 编辑事件
  CONTENT_CHANGED: 'editor:content:changed',
  SELECTION_CHANGED: 'editor:selection:changed',
  CURSOR_MOVED: 'editor:cursor:moved',
  TEXT_INSERTED: 'editor:text:inserted',
  TEXT_DELETED: 'editor:text:deleted',
  TEXT_FORMATTED: 'editor:text:formatted',

  // 链接事件
  LINK_CREATED: 'editor:link:created',
  LINK_UPDATED: 'editor:link:updated',
  LINK_DELETED: 'editor:link:deleted',
  LINK_CLICKED: 'editor:link:clicked',

  // 自动保存事件
  AUTO_SAVE: 'editor:auto-save',
  AUTO_SAVE_SUCCESS: 'editor:auto-save:success',
  AUTO_SAVE_ERROR: 'editor:auto-save:error',

  // 搜索事件
  SEARCH_STARTED: 'editor:search:started',
  SEARCH_COMPLETED: 'editor:search:completed',
  SEARCH_CLEARED: 'editor:search:cleared',

  // 导入导出事件
  EXPORT_STARTED: 'editor:export:started',
  EXPORT_COMPLETED: 'editor:export:completed',
  EXPORT_ERROR: 'editor:export:error',
  IMPORT_STARTED: 'editor:import:started',
  IMPORT_COMPLETED: 'editor:import:completed',
  IMPORT_ERROR: 'editor:import:error',

  // 协作事件
  COLLABORATION_JOINED: 'editor:collaboration:joined',
  COLLABORATION_LEFT: 'editor:collaboration:left',
  COLLABORATION_USER_JOINED: 'editor:collaboration:user:joined',
  COLLABORATION_USER_LEFT: 'editor:collaboration:user:left',
  COLLABORATION_OPERATION: 'editor:collaboration:operation',

  // 错误事件
  ERROR: 'editor:error',
  WARNING: 'editor:warning'
} as const;

/**
 * 块类型常量
 */
export const BLOCK_TYPES = {
  // 文本块
  PARAGRAPH: 'paragraph',
  HEADING_1: 'heading-1',
  HEADING_2: 'heading-2',
  HEADING_3: 'heading-3',
  HEADING_4: 'heading-4',
  HEADING_5: 'heading-5',
  HEADING_6: 'heading-6',

  // 列表块
  BULLETED_LIST: 'bulleted-list',
  NUMBERED_LIST: 'numbered-list',
  TODO_LIST: 'todo-list',

  // 特殊块
  QUOTE: 'quote',
  CODE: 'code',
  DIVIDER: 'divider',

  // 媒体块
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',

  // 结构块
  TABLE: 'table',
  CALLOUT: 'callout',
  TOGGLE: 'toggle',
  COLUMNS: 'columns',

  // 嵌入块
  EMBED: 'embed',
  MATH: 'math',
  MERMAID: 'mermaid'
} as const;

/**
 * 编辑器命令常量
 */
export const EDITOR_COMMANDS = {
  // 文档操作
  NEW_DOCUMENT: 'new-document',
  OPEN_DOCUMENT: 'open-document',
  SAVE_DOCUMENT: 'save-document',
  SAVE_AS: 'save-as',
  CLOSE_DOCUMENT: 'close-document',
  DELETE_DOCUMENT: 'delete-document',

  // 编辑操作
  UNDO: 'undo',
  REDO: 'redo',
  CUT: 'cut',
  COPY: 'copy',
  PASTE: 'paste',
  SELECT_ALL: 'select-all',
  FIND: 'find',
  REPLACE: 'replace',

  // 格式化操作
  BOLD: 'bold',
  ITALIC: 'italic',
  UNDERLINE: 'underline',
  STRIKETHROUGH: 'strikethrough',
  CODE: 'code',
  HIGHLIGHT: 'highlight',
  CLEAR_FORMATTING: 'clear-formatting',

  // 块操作
  CREATE_BLOCK: 'create-block',
  DELETE_BLOCK: 'delete-block',
  DUPLICATE_BLOCK: 'duplicate-block',
  MOVE_BLOCK_UP: 'move-block-up',
  MOVE_BLOCK_DOWN: 'move-block-down',
  CONVERT_BLOCK: 'convert-block',

  // 链接操作
  INSERT_LINK: 'insert-link',
  EDIT_LINK: 'edit-link',
  REMOVE_LINK: 'remove-link',
  FOLLOW_LINK: 'follow-link',

  // 视图操作
  TOGGLE_FULLSCREEN: 'toggle-fullscreen',
  ZOOM_IN: 'zoom-in',
  ZOOM_OUT: 'zoom-out',
  RESET_ZOOM: 'reset-zoom',
  TOGGLE_SIDEBAR: 'toggle-sidebar',
  TOGGLE_OUTLINE: 'toggle-outline',

  // 导入导出
  EXPORT_MARKDOWN: 'export-markdown',
  EXPORT_HTML: 'export-html',
  EXPORT_PDF: 'export-pdf',
  IMPORT_MARKDOWN: 'import-markdown',
  IMPORT_HTML: 'import-html',

  // 协作操作
  SHARE_DOCUMENT: 'share-document',
  INVITE_COLLABORATOR: 'invite-collaborator',
  LEAVE_COLLABORATION: 'leave-collaboration'
} as const;

/**
 * 编辑器状态常量
 */
export const EDITOR_STATES = {
  IDLE: 'idle',
  EDITING: 'editing',
  SAVING: 'saving',
  LOADING: 'loading',
  ERROR: 'error'
} as const;

/**
 * 文档状态常量
 */
export const DOCUMENT_STATES = {
  DRAFT: 'draft',
  SAVED: 'saved',
  MODIFIED: 'modified',
  SAVING: 'saving',
  ERROR: 'error'
} as const;

/**
 * 主题常量
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
} as const;

/**
 * 导出格式常量
 */
export const EXPORT_FORMATS = {
  MARKDOWN: 'markdown',
  HTML: 'html',
  PDF: 'pdf',
  DOCX: 'docx',
  TXT: 'txt'
} as const;

/**
 * 导入格式常量
 */
export const IMPORT_FORMATS = {
  MARKDOWN: 'markdown',
  HTML: 'html',
  DOCX: 'docx',
  TXT: 'txt'
} as const;

/**
 * 快捷键常量
 */
export const SHORTCUTS = {
  // 文档操作
  NEW_DOCUMENT: 'Ctrl+N',
  OPEN_DOCUMENT: 'Ctrl+O',
  SAVE_DOCUMENT: 'Ctrl+S',
  SAVE_AS: 'Ctrl+Shift+S',
  CLOSE_DOCUMENT: 'Ctrl+W',

  // 编辑操作
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Y',
  CUT: 'Ctrl+X',
  COPY: 'Ctrl+C',
  PASTE: 'Ctrl+V',
  SELECT_ALL: 'Ctrl+A',
  FIND: 'Ctrl+F',
  REPLACE: 'Ctrl+H',

  // 格式化操作
  BOLD: 'Ctrl+B',
  ITALIC: 'Ctrl+I',
  UNDERLINE: 'Ctrl+U',
  STRIKETHROUGH: 'Ctrl+Shift+X',
  CODE: 'Ctrl+`',
  CLEAR_FORMATTING: 'Ctrl+\\',

  // 块操作
  CREATE_BLOCK: 'Enter',
  DELETE_BLOCK: 'Ctrl+Shift+D',
  DUPLICATE_BLOCK: 'Ctrl+D',
  MOVE_BLOCK_UP: 'Ctrl+Shift+Up',
  MOVE_BLOCK_DOWN: 'Ctrl+Shift+Down',

  // 链接操作
  INSERT_LINK: 'Ctrl+K',
  FOLLOW_LINK: 'Ctrl+Click',

  // 视图操作
  TOGGLE_FULLSCREEN: 'F11',
  ZOOM_IN: 'Ctrl+=',
  ZOOM_OUT: 'Ctrl+-',
  RESET_ZOOM: 'Ctrl+0',
  TOGGLE_SIDEBAR: 'Ctrl+B',

  // 导出操作
  EXPORT_MARKDOWN: 'Ctrl+Shift+M',
  EXPORT_HTML: 'Ctrl+Shift+H',
  EXPORT_PDF: 'Ctrl+Shift+P'
} as const;

/**
 * 错误代码常量
 */
export const ERROR_CODES = {
  // 模块错误
  MODULE_NOT_INITIALIZED: 'MODULE_NOT_INITIALIZED',
  MODULE_ALREADY_INITIALIZED: 'MODULE_ALREADY_INITIALIZED',
  MODULE_INITIALIZATION_FAILED: 'MODULE_INITIALIZATION_FAILED',

  // 文档错误
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  DOCUMENT_LOAD_FAILED: 'DOCUMENT_LOAD_FAILED',
  DOCUMENT_SAVE_FAILED: 'DOCUMENT_SAVE_FAILED',
  DOCUMENT_DELETE_FAILED: 'DOCUMENT_DELETE_FAILED',
  DOCUMENT_INVALID_FORMAT: 'DOCUMENT_INVALID_FORMAT',

  // 块错误
  BLOCK_NOT_FOUND: 'BLOCK_NOT_FOUND',
  BLOCK_INVALID_TYPE: 'BLOCK_INVALID_TYPE',
  BLOCK_OPERATION_FAILED: 'BLOCK_OPERATION_FAILED',

  // 链接错误
  LINK_INVALID_FORMAT: 'LINK_INVALID_FORMAT',
  LINK_TARGET_NOT_FOUND: 'LINK_TARGET_NOT_FOUND',
  LINK_CREATION_FAILED: 'LINK_CREATION_FAILED',

  // 导入导出错误
  EXPORT_FAILED: 'EXPORT_FAILED',
  IMPORT_FAILED: 'IMPORT_FAILED',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',

  // 协作错误
  COLLABORATION_CONNECTION_FAILED: 'COLLABORATION_CONNECTION_FAILED',
  COLLABORATION_SYNC_FAILED: 'COLLABORATION_SYNC_FAILED',
  COLLABORATION_CONFLICT: 'COLLABORATION_CONFLICT',

  // 通用错误
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

/**
 * 配置常量
 */
export const CONFIG_KEYS = {
  AUTO_SAVE_INTERVAL: 'autoSaveInterval',
  SPELL_CHECK: 'spellCheck',
  SYNTAX_HIGHLIGHT: 'syntaxHighlight',
  FONT_SIZE: 'fontSize',
  FONT_FAMILY: 'fontFamily',
  THEME: 'theme',
  ENABLE_BIDIRECTIONAL_LINKS: 'enableBidirectionalLinks',
  ENABLE_BLOCK_DRAGGING: 'enableBlockDragging',
  MAX_UNDO_HISTORY: 'maxUndoHistory'
} as const;
