/**
 * 视图类型定义
 */

import { FieldValue } from './field'

/**
 * 视图类型枚举
 */
export enum ViewType {
  TABLE = 'table',
  KANBAN = 'kanban',
  CALENDAR = 'calendar',
  GALLERY = 'gallery',
  LIST = 'list',
  TIMELINE = 'timeline',
  CHART = 'chart'
}

/**
 * 视图接口
 */
export interface View {
  /** 视图唯一标识 */
  id: string
  /** 视图名称 */
  name: string
  /** 视图类型 */
  type: ViewType
  /** 数据库ID */
  databaseId: string
  /** 视图配置 */
  config: ViewConfig
  /** 筛选条件 */
  filters: Filter[]
  /** 排序规则 */
  sorts: Sort[]
  /** 分组规则 */
  groups: Group[]
  /** 显示字段 */
  visibleFields: string[]
  /** 隐藏字段 */
  hiddenFields: string[]
  /** 字段顺序 */
  fieldOrder: string[]
  /** 是否为默认视图 */
  isDefault: boolean
  /** 是否公开 */
  isPublic: boolean
  /** 权限设置 */
  permissions: ViewPermission[]
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
  /** 创建者 */
  createdBy: string
}

/**
 * 视图配置（根据类型不同而不同）
 */
export type ViewConfig = 
  | TableViewConfig
  | KanbanViewConfig
  | CalendarViewConfig
  | GalleryViewConfig
  | ListViewConfig
  | TimelineViewConfig
  | ChartViewConfig

/**
 * 表格视图配置
 */
export interface TableViewConfig {
  /** 行高 */
  rowHeight: 'compact' | 'medium' | 'tall'
  /** 是否显示行号 */
  showRowNumbers: boolean
  /** 是否显示复选框 */
  showCheckboxes: boolean
  /** 是否启用行选择 */
  enableRowSelection: boolean
  /** 是否启用列调整 */
  enableColumnResize: boolean
  /** 是否启用列排序 */
  enableColumnSort: boolean
  /** 冻结列数 */
  frozenColumns: number
  /** 分页配置 */
  pagination: PaginationConfig
}

/**
 * 看板视图配置
 */
export interface KanbanViewConfig {
  /** 分组字段 */
  groupByField: string
  /** 卡片模板 */
  cardTemplate: CardTemplate
  /** 列配置 */
  columns: KanbanColumn[]
  /** 是否启用拖拽 */
  enableDragDrop: boolean
  /** 卡片大小 */
  cardSize: 'small' | 'medium' | 'large'
}

/**
 * 日历视图配置
 */
export interface CalendarViewConfig {
  /** 日期字段 */
  dateField: string
  /** 结束日期字段（可选） */
  endDateField?: string
  /** 标题字段 */
  titleField: string
  /** 颜色字段 */
  colorField?: string
  /** 默认视图 */
  defaultView: 'month' | 'week' | 'day' | 'agenda'
  /** 是否显示周末 */
  showWeekends: boolean
  /** 工作时间 */
  businessHours?: BusinessHours
}

/**
 * 画廊视图配置
 */
export interface GalleryViewConfig {
  /** 图片字段 */
  imageField: string
  /** 标题字段 */
  titleField: string
  /** 描述字段 */
  descriptionField?: string
  /** 卡片大小 */
  cardSize: 'small' | 'medium' | 'large'
  /** 每行卡片数 */
  cardsPerRow: number
  /** 卡片比例 */
  aspectRatio: '1:1' | '4:3' | '16:9' | 'auto'
}

/**
 * 列表视图配置
 */
export interface ListViewConfig {
  /** 主要字段 */
  primaryField: string
  /** 次要字段 */
  secondaryField?: string
  /** 图标字段 */
  iconField?: string
  /** 是否显示分隔线 */
  showDividers: boolean
  /** 项目高度 */
  itemHeight: 'compact' | 'medium' | 'tall'
}

/**
 * 时间线视图配置
 */
export interface TimelineViewConfig {
  /** 开始日期字段 */
  startDateField: string
  /** 结束日期字段 */
  endDateField: string
  /** 标题字段 */
  titleField: string
  /** 进度字段 */
  progressField?: string
  /** 时间单位 */
  timeUnit: 'day' | 'week' | 'month' | 'quarter' | 'year'
  /** 是否显示依赖关系 */
  showDependencies: boolean
}

/**
 * 图表视图配置
 */
export interface ChartViewConfig {
  /** 图表类型 */
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area'
  /** X轴字段 */
  xAxisField: string
  /** Y轴字段 */
  yAxisField: string
  /** 分组字段 */
  groupByField?: string
  /** 聚合函数 */
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max'
  /** 图表标题 */
  title?: string
}

/**
 * 筛选条件
 */
export interface Filter {
  /** 筛选ID */
  id: string
  /** 字段ID */
  fieldId: string
  /** 操作符 */
  operator: FilterOperator
  /** 筛选值 */
  value: FieldValue
  /** 逻辑连接符 */
  conjunction?: 'and' | 'or'
}

/**
 * 筛选操作符
 */
export enum FilterOperator {
  // 通用操作符
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  
  // 文本操作符
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  
  // 数字操作符
  GREATER_THAN = 'greater_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN = 'less_than',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  
  // 日期操作符
  IS_TODAY = 'is_today',
  IS_YESTERDAY = 'is_yesterday',
  IS_TOMORROW = 'is_tomorrow',
  IS_THIS_WEEK = 'is_this_week',
  IS_THIS_MONTH = 'is_this_month',
  IS_THIS_YEAR = 'is_this_year',
  IS_BEFORE = 'is_before',
  IS_AFTER = 'is_after',
  IS_BETWEEN = 'is_between',
  
  // 选择操作符
  IS_ANY_OF = 'is_any_of',
  IS_NONE_OF = 'is_none_of',
  
  // 关联操作符
  HAS_ANY = 'has_any',
  HAS_ALL = 'has_all',
  HAS_NONE = 'has_none'
}

/**
 * 排序规则
 */
export interface Sort {
  /** 字段ID */
  fieldId: string
  /** 排序方向 */
  direction: 'asc' | 'desc'
  /** 排序优先级 */
  priority: number
}

/**
 * 分组规则
 */
export interface Group {
  /** 字段ID */
  fieldId: string
  /** 分组顺序 */
  order: 'asc' | 'desc'
  /** 是否折叠 */
  collapsed: boolean
}

/**
 * 分页配置
 */
export interface PaginationConfig {
  /** 是否启用分页 */
  enabled: boolean
  /** 每页记录数 */
  pageSize: number
  /** 是否显示页码 */
  showPageNumbers: boolean
  /** 是否显示总数 */
  showTotal: boolean
}

/**
 * 卡片模板
 */
export interface CardTemplate {
  /** 标题字段 */
  titleField: string
  /** 描述字段 */
  descriptionField?: string
  /** 图片字段 */
  imageField?: string
  /** 标签字段 */
  tagFields: string[]
  /** 自定义字段 */
  customFields: string[]
}

/**
 * 看板列配置
 */
export interface KanbanColumn {
  /** 列ID */
  id: string
  /** 列标题 */
  title: string
  /** 列颜色 */
  color?: string
  /** 对应的字段值 */
  value: FieldValue
  /** 是否折叠 */
  collapsed: boolean
  /** 列宽度 */
  width?: number
}

/**
 * 工作时间配置
 */
export interface BusinessHours {
  /** 开始时间 */
  startTime: string
  /** 结束时间 */
  endTime: string
  /** 工作日 */
  workDays: number[]
}

/**
 * 视图权限
 */
export interface ViewPermission {
  /** 用户/角色ID */
  principalId: string
  /** 权限类型 */
  type: 'user' | 'role' | 'group'
  /** 权限级别 */
  level: 'view' | 'edit' | 'admin'
}

/**
 * 视图创建参数
 */
export interface CreateViewParams {
  name: string
  type: ViewType
  config?: Partial<ViewConfig>
  filters?: Filter[]
  sorts?: Sort[]
  groups?: Group[]
  visibleFields?: string[]
  isDefault?: boolean
  isPublic?: boolean
}

/**
 * 视图更新参数
 */
export interface UpdateViewParams {
  name?: string
  config?: Partial<ViewConfig>
  filters?: Filter[]
  sorts?: Sort[]
  groups?: Group[]
  visibleFields?: string[]
  hiddenFields?: string[]
  fieldOrder?: string[]
  isDefault?: boolean
  isPublic?: boolean
}

/**
 * 视图查询结果
 */
export interface ViewQueryResult {
  /** 记录列表 */
  records: any[]
  /** 总记录数 */
  totalCount: number
  /** 分页信息 */
  pagination?: {
    page: number
    pageSize: number
    totalPages: number
  }
  /** 分组信息 */
  groups?: {
    [key: string]: any[]
  }
  /** 聚合信息 */
  aggregations?: {
    [key: string]: any
  }
}
