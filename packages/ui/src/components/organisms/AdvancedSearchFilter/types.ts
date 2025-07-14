/**
 * 高级搜索过滤器类型定义
 * 
 * 功能：
 * - 多维度搜索过滤条件
 * - 搜索结果类型定义
 * - 过滤器配置选项
 * - 搜索状态管理
 */

export interface DateRange {
  /** 开始日期 */
  start?: string
  /** 结束日期 */
  end?: string
}

export interface TagFilter {
  /** 标签ID */
  id: string
  /** 标签名称 */
  name: string
  /** 标签颜色 */
  color?: string
  /** 是否选中 */
  selected: boolean
  /** 子标签 */
  children?: TagFilter[]
}

export interface AuthorFilter {
  /** 作者ID */
  id: string
  /** 作者名称 */
  name: string
  /** 是否选中 */
  selected: boolean
  /** 文档数量 */
  documentCount?: number
}

export interface ContentTypeFilter {
  /** 内容类型 */
  type: 'note' | 'block' | 'link' | 'tag' | 'attachment'
  /** 显示名称 */
  label: string
  /** 是否选中 */
  selected: boolean
  /** 图标 */
  icon?: string
  /** 文档数量 */
  count?: number
}

export interface SizeFilter {
  /** 最小大小（字节） */
  min?: number
  /** 最大大小（字节） */
  max?: number
  /** 预设选项 */
  preset?: 'small' | 'medium' | 'large' | 'custom'
}

export interface AdvancedSearchFilters {
  /** 搜索关键词 */
  query: string
  
  /** 内容类型过滤 */
  contentTypes: ContentTypeFilter[]
  
  /** 标签过滤 */
  tags: TagFilter[]
  
  /** 作者过滤 */
  authors: AuthorFilter[]
  
  /** 日期范围过滤 */
  dateRange: {
    /** 创建日期范围 */
    created?: DateRange
    /** 修改日期范围 */
    modified?: DateRange
  }
  
  /** 文件大小过滤 */
  size?: SizeFilter
  
  /** 排序选项 */
  sortBy: 'relevance' | 'created' | 'modified' | 'title' | 'size'
  
  /** 排序方向 */
  sortOrder: 'asc' | 'desc'
  
  /** 是否包含已删除项目 */
  includeDeleted: boolean
  
  /** 是否只显示收藏项目 */
  favoritesOnly: boolean
  
  /** 自定义字段过滤 */
  customFields?: Record<string, any>
}

export interface SearchResult {
  /** 文档ID */
  id: string
  /** 文档类型 */
  type: ContentTypeFilter['type']
  /** 标题 */
  title: string
  /** 内容摘要 */
  excerpt: string
  /** 高亮片段 */
  highlights: string[]
  /** 匹配的字段 */
  matchedFields: string[]
  /** 相关性分数 */
  score: number
  /** 标签 */
  tags: TagFilter[]
  /** 作者 */
  author?: AuthorFilter
  /** 创建时间 */
  createdAt: string
  /** 修改时间 */
  modifiedAt: string
  /** 文件大小 */
  size?: number
  /** 路径 */
  path?: string
  /** 是否收藏 */
  isFavorite: boolean
  /** 缩略图 */
  thumbnail?: string
}

export interface SearchResultGroup {
  /** 分组类型 */
  groupBy: 'type' | 'date' | 'author' | 'tag'
  /** 分组名称 */
  name: string
  /** 分组结果 */
  results: SearchResult[]
  /** 分组统计 */
  count: number
}

export interface SearchStats {
  /** 总结果数 */
  totalCount: number
  /** 搜索耗时（毫秒） */
  searchTime: number
  /** 按类型分组的统计 */
  typeStats: Record<string, number>
  /** 按日期分组的统计 */
  dateStats: Record<string, number>
  /** 建议的相关搜索 */
  suggestions: string[]
  /** 是否有更多结果 */
  hasMore: boolean
}

export interface FilterPreset {
  /** 预设ID */
  id: string
  /** 预设名称 */
  name: string
  /** 预设描述 */
  description?: string
  /** 预设过滤器 */
  filters: Partial<AdvancedSearchFilters>
  /** 是否为系统预设 */
  isSystem: boolean
  /** 创建时间 */
  createdAt: string
  /** 使用次数 */
  usageCount: number
}

export interface SearchHistory {
  /** 历史记录ID */
  id: string
  /** 搜索查询 */
  query: string
  /** 使用的过滤器 */
  filters: AdvancedSearchFilters
  /** 结果数量 */
  resultCount: number
  /** 搜索时间 */
  searchedAt: string
  /** 搜索耗时 */
  searchTime: number
}

export interface AdvancedSearchConfig {
  /** 是否启用实时搜索 */
  enableRealTimeSearch: boolean
  /** 搜索防抖延迟（毫秒） */
  searchDebounceDelay: number
  /** 每页结果数 */
  resultsPerPage: number
  /** 最大结果数 */
  maxResults: number
  /** 是否启用搜索建议 */
  enableSuggestions: boolean
  /** 是否启用搜索历史 */
  enableHistory: boolean
  /** 历史记录保留天数 */
  historyRetentionDays: number
  /** 默认排序方式 */
  defaultSortBy: AdvancedSearchFilters['sortBy']
  /** 默认排序方向 */
  defaultSortOrder: AdvancedSearchFilters['sortOrder']
  /** 是否启用分组显示 */
  enableGrouping: boolean
  /** 默认分组方式 */
  defaultGroupBy: SearchResultGroup['groupBy']
}

export interface SearchFilterState {
  /** 当前过滤器 */
  filters: AdvancedSearchFilters
  /** 搜索结果 */
  results: SearchResult[]
  /** 分组结果 */
  groupedResults: SearchResultGroup[]
  /** 搜索统计 */
  stats: SearchStats
  /** 是否正在搜索 */
  isSearching: boolean
  /** 搜索错误 */
  error?: string
  /** 当前页码 */
  currentPage: number
  /** 总页数 */
  totalPages: number
  /** 选中的结果 */
  selectedResults: string[]
  /** 搜索历史 */
  history: SearchHistory[]
  /** 过滤器预设 */
  presets: FilterPreset[]
}

export interface SearchFilterActions {
  /** 更新过滤器 */
  updateFilters: (filters: Partial<AdvancedSearchFilters>) => void
  /** 执行搜索 */
  performSearch: () => Promise<void>
  /** 清除过滤器 */
  clearFilters: () => void
  /** 重置到默认状态 */
  resetToDefault: () => void
  /** 保存过滤器预设 */
  savePreset: (name: string, description?: string) => void
  /** 加载过滤器预设 */
  loadPreset: (presetId: string) => void
  /** 删除过滤器预设 */
  deletePreset: (presetId: string) => void
  /** 选择/取消选择结果 */
  toggleResultSelection: (resultId: string) => void
  /** 选择所有结果 */
  selectAllResults: () => void
  /** 清除所有选择 */
  clearSelection: () => void
  /** 切换页面 */
  changePage: (page: number) => void
  /** 导出搜索结果 */
  exportResults: (format: 'json' | 'csv' | 'pdf') => Promise<void>
}

export type SearchFilterContextType = SearchFilterState & SearchFilterActions

// 预定义的内容类型
export const DEFAULT_CONTENT_TYPES: ContentTypeFilter[] = [
  {
    type: 'note',
    label: '笔记',
    selected: true,
    icon: 'document-text',
    count: 0
  },
  {
    type: 'block',
    label: '块引用',
    selected: true,
    icon: 'cube',
    count: 0
  },
  {
    type: 'link',
    label: '链接',
    selected: true,
    icon: 'link',
    count: 0
  },
  {
    type: 'tag',
    label: '标签',
    selected: false,
    icon: 'tag',
    count: 0
  },
  {
    type: 'attachment',
    label: '附件',
    selected: false,
    icon: 'paper-clip',
    count: 0
  }
]

// 预定义的排序选项
export const SORT_OPTIONS = [
  { value: 'relevance', label: '相关性' },
  { value: 'created', label: '创建时间' },
  { value: 'modified', label: '修改时间' },
  { value: 'title', label: '标题' },
  { value: 'size', label: '大小' }
] as const

// 预定义的分组选项
export const GROUP_OPTIONS = [
  { value: 'type', label: '按类型分组' },
  { value: 'date', label: '按日期分组' },
  { value: 'author', label: '按作者分组' },
  { value: 'tag', label: '按标签分组' }
] as const

// 预定义的文件大小选项
export const SIZE_PRESETS = [
  { value: 'small', label: '小文件 (<1MB)', min: 0, max: 1024 * 1024 },
  { value: 'medium', label: '中等文件 (1-10MB)', min: 1024 * 1024, max: 10 * 1024 * 1024 },
  { value: 'large', label: '大文件 (>10MB)', min: 10 * 1024 * 1024, max: undefined }
] as const
