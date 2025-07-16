/**
 * 搜索类型定义
 * 统一的搜索数据结构
 */

// 基础搜索查询
export interface SearchQuery {
  /** 搜索关键词 */
  query: string
  /** 搜索类型 */
  type?: 'simple' | 'fuzzy' | 'exact' | 'regex'
  /** 文档类型过滤 */
  types?: string[]
  /** 标签过滤 */
  tags?: string[]
  /** 页面ID过滤 */
  pageIds?: string[]
  /** 日期范围过滤 */
  dateRange?: {
    start?: Date
    end?: Date
  }
  /** 作者过滤 */
  authors?: string[]
  /** 排序方式 */
  sortBy?: 'relevance' | 'createdAt' | 'updatedAt' | 'title'
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
  /** 分页限制 */
  limit?: number
  /** 分页偏移 */
  offset?: number
  /** 高级搜索选项 */
  options?: AdvancedSearchOptions
  /** 搜索范围 */
  scope?: string
}

// 高级搜索选项
export interface AdvancedSearchOptions {
  /** 是否包含内容 */
  includeContent?: boolean
  /** 是否包含元数据 */
  includeMetadata?: boolean
  /** 最小相关性分数 */
  minScore?: number
  /** 高亮选项 */
  highlight?: {
    enabled: boolean
    preTag?: string
    postTag?: string
    maxFragments?: number
    fragmentSize?: number
  }
  /** 搜索范围 */
  scope?: string[]
  /** 模糊搜索配置 */
  fuzzy?: {
    enabled: boolean
    distance?: number
    prefix?: number
  }
}

// 搜索结果
export interface SearchResult {
  /** 结果ID */
  id: string
  /** 标题 */
  title: string
  /** 内容 */
  content: string
  /** 类型 */
  type: string
  /** 模块ID */
  moduleId: string
  /** 相关性分数 */
  score: number
  /** 高亮片段 */
  highlights?: string[]
  /** 匹配的字段 */
  matchedFields?: string[]
  /** 元数据 */
  metadata?: Record<string, any>
  /** 创建时间 */
  createdAt?: Date
  /** 更新时间 */
  updatedAt?: Date
}

// 搜索响应
export interface SearchResponse {
  /** 搜索结果 */
  results: SearchResult[]
  /** 总数 */
  total: number
  /** 查询信息 */
  query: SearchQuery
  /** 搜索耗时 */
  took: number
  /** 建议 */
  suggestions?: string[]
  /** 分面信息 */
  facets?: Record<string, any>
  /** 分页信息 */
  pagination?: {
    page: number
    pageSize: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 搜索聚合结果
export interface SearchResultAggregation {
  /** 查询字符串 */
  query: string
  /** 总结果数 */
  totalResults: number
  /** 按模块分组的结果 */
  resultsByModule: Record<string, SearchResult[]>
  /** 搜索耗时 */
  searchTime: number
  /** 建议 */
  suggestions: string[]
  /** 相关查询 */
  relatedQueries: string[]
}

// 搜索节点（用于查询解析）
export interface SearchNode {
  type: 'term' | 'phrase' | 'wildcard' | 'and' | 'or' | 'not' | 'field' | 'range'
  value?: string
  field?: string
  children?: SearchNode[]
  start?: number
  end?: number
}

// 搜索过滤器
export interface SearchFilter {
  /** 文件类型过滤 */
  fileTypes?: string[]
  /** 创建时间范围 */
  dateRange?: {
    start?: Date
    end?: Date
  }
  /** 标签过滤 */
  tags?: string[]
  /** 作者过滤 */
  authors?: string[]
  /** 大小范围 */
  sizeRange?: {
    min?: number
    max?: number
  }
  /** 路径过滤 */
  paths?: string[]
}

// 搜索文档
export interface SearchDocument {
  id: string
  title: string
  content: string
  type: 'page' | 'block'
  createdAt: Date
  updatedAt: Date
  tags?: string[]
  author?: string
  metadata?: Record<string, any>
}
