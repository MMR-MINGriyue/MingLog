/**
 * MingLog 双向链接系统类型定义
 */

export type LinkType = 'page-reference' | 'block-reference';
export type SourceType = 'page' | 'block';
export type TargetType = 'page' | 'block';

/**
 * 链接实体
 */
export interface Link {
  id: string;
  sourceType: SourceType;
  sourceId: string;
  targetType: TargetType;
  targetId: string;
  linkType: LinkType;
  context?: string;
  position?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建链接请求
 */
export interface CreateLinkRequest {
  sourceType: SourceType;
  sourceId: string;
  targetType: TargetType;
  targetId: string;
  linkType: LinkType;
  context?: string;
  position?: number;
}

/**
 * 页面链接解析结果
 */
export interface PageLink {
  type: 'page-reference';
  pageName: string;
  displayText: string;
  position: number;
  length: number;
  context: string;
  alias?: string;
}

/**
 * 块引用解析结果
 */
export interface BlockLink {
  type: 'block-reference';
  blockId: string;
  position: number;
  length: number;
  context: string;
}

/**
 * 损坏的链接
 */
export interface BrokenLink {
  type: 'broken-link';
  originalText: string;
  position: number;
  length: number;
  reason: string;
}

/**
 * 反向链接信息
 */
export interface BacklinkInfo {
  id: string;
  sourceType: SourceType;
  sourceId: string;
  sourceTitle?: string;
  sourceContent?: string;
  linkType: LinkType;
  context: string;
  position?: number;
  createdAt: string;
}

/**
 * 页面别名
 */
export interface PageAlias {
  id: string;
  pageId: string;
  alias: string;
  createdAt: string;
}

/**
 * 链接图谱节点
 */
export interface LinkGraphNode {
  id: string;
  title: string;
  type: 'page' | 'block';
  x?: number;
  y?: number;
  size?: number;
  color?: string;
}

/**
 * 链接图谱边
 */
export interface LinkGraphEdge {
  id: string;
  source: string;
  target: string;
  type: LinkType;
  weight?: number;
}

/**
 * 链接图谱数据
 */
export interface LinkGraphData {
  nodes: LinkGraphNode[];
  edges: LinkGraphEdge[];
  centerNodeId: string;
  maxDepth: number;
}

/**
 * 链接建议
 */
export interface LinkSuggestion {
  /** 唯一标识 */
  id: string;
  /** 标题 */
  title: string;
  /** 类型 */
  type: 'page' | 'block';
  /** 预览内容 */
  preview: string;
  /** 匹配分数 */
  score: number;
  /** 匹配类型 */
  matchType?: 'exact' | 'fuzzy' | 'history' | 'create';
  /** 创建时间 */
  createdAt?: string;
  /** 最后访问时间 */
  lastAccessedAt?: string;
}

/**
 * 损坏的链接
 */
export interface BrokenLink {
  /** 原始文本 */
  originalText: string;
  /** 位置 */
  position: number;
  /** 长度 */
  length: number;
  /** 错误原因 */
  reason: string;
  /** 修复建议 */
  suggestions?: string[];
}

/**
 * 链接建议
 */
export interface LinkSuggestion {
  id: string;
  title: string;
  type: 'page' | 'block';
  preview: string;
  score: number;
  matchType: 'title' | 'content' | 'alias';
}

/**
 * 链接解析器接口
 */
export interface LinkParser {
  parsePageLinks(content: string): PageLink[];
  parseBlockLinks(content: string): BlockLink[];
  extractLinkContext(content: string, position: number, length: number): string;
}

/**
 * 链接管理器接口
 */
export interface LinkManager {
  createLink(link: CreateLinkRequest): Promise<Link>;
  updateLinksForContent(sourceType: SourceType, sourceId: string, content: string): Promise<void>;
  getBacklinks(targetId: string, targetType?: TargetType): Promise<BacklinkInfo[]>;
  getForwardLinks(sourceId: string, sourceType?: SourceType): Promise<Link[]>;
  deleteLinksForSource(sourceType: SourceType, sourceId: string): Promise<void>;
  deleteLink(linkId: string): Promise<void>;
  getLinkGraph(centerNodeId: string, maxDepth: number): Promise<LinkGraphData>;
}

/**
 * 页面别名管理器接口
 */
export interface AliasManager {
  createAlias(pageId: string, alias: string): Promise<PageAlias>;
  getAliasesForPage(pageId: string): Promise<PageAlias[]>;
  getPageByAlias(alias: string): Promise<string | null>;
  deleteAlias(aliasId: string): Promise<void>;
  updateAlias(aliasId: string, newAlias: string): Promise<PageAlias>;
}

/**
 * 链接搜索选项
 */
export interface LinkSearchOptions {
  query: string;
  limit?: number;
  includeContent?: boolean;
  includeAliases?: boolean;
  sourceType?: SourceType;
  targetType?: TargetType;
}

/**
 * 链接统计信息
 */
export interface LinkStats {
  totalLinks: number;
  pageReferences: number;
  blockReferences: number;
  brokenLinks: number;
  mostLinkedPages: Array<{
    pageId: string;
    title: string;
    linkCount: number;
  }>;
  recentLinks: BacklinkInfo[];
}

/**
 * 链接事件类型
 */
export interface LinkEvents {
  'links:created': { link: Link };
  'links:updated': { sourceType: SourceType; sourceId: string; linkCount: number };
  'links:deleted': { linkId: string };
  'links:bulk-updated': { sourceType: SourceType; sourceId: string; links: Link[] };
  'backlinks:changed': { targetId: string; targetType: TargetType; count: number };
}

/**
 * 链接验证结果
 */
export interface LinkValidationResult {
  isValid: boolean;
  exists: boolean;
  targetId?: string;
  targetTitle?: string;
  error?: string;
}

/**
 * 链接渲染选项
 */
export interface LinkRenderOptions {
  showTooltip?: boolean;
  enableClick?: boolean;
  highlightBroken?: boolean;
  customClassName?: string;
  onLinkClick?: (linkInfo: PageLink | BlockLink) => void;
  onBrokenLinkClick?: (brokenLink: BrokenLink) => void;
}
