/**
 * 查询系统类型定义
 */

import { FieldValue } from './field'
import { Filter, Sort, Group } from './view'

/**
 * 查询接口
 */
export interface Query {
  /** 查询ID */
  id: string
  /** 查询名称 */
  name?: string
  /** 目标数据库ID */
  databaseId: string
  /** 筛选条件 */
  filters: Filter[]
  /** 排序规则 */
  sorts: Sort[]
  /** 分组规则 */
  groups: Group[]
  /** 选择字段 */
  select: string[]
  /** 聚合操作 */
  aggregations: Aggregation[]
  /** 连接查询 */
  joins: Join[]
  /** 分页参数 */
  pagination: QueryPagination
  /** 查询选项 */
  options: QueryOptions
}

/**
 * 聚合操作
 */
export interface Aggregation {
  /** 聚合ID */
  id: string
  /** 字段ID */
  fieldId: string
  /** 聚合函数 */
  function: AggregationFunction
  /** 别名 */
  alias?: string
  /** 分组字段 */
  groupBy?: string[]
}

/**
 * 聚合函数枚举
 */
export enum AggregationFunction {
  COUNT = 'count',
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  DISTINCT_COUNT = 'distinct_count',
  MEDIAN = 'median',
  MODE = 'mode',
  STDDEV = 'stddev',
  VARIANCE = 'variance'
}

/**
 * 连接查询
 */
export interface Join {
  /** 连接ID */
  id: string
  /** 连接类型 */
  type: JoinType
  /** 目标数据库ID */
  targetDatabaseId: string
  /** 连接条件 */
  conditions: JoinCondition[]
  /** 别名 */
  alias?: string
}

/**
 * 连接类型
 */
export enum JoinType {
  INNER = 'inner',
  LEFT = 'left',
  RIGHT = 'right',
  FULL = 'full'
}

/**
 * 连接条件
 */
export interface JoinCondition {
  /** 左侧字段ID */
  leftFieldId: string
  /** 操作符 */
  operator: JoinOperator
  /** 右侧字段ID */
  rightFieldId: string
}

/**
 * 连接操作符
 */
export enum JoinOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains'
}

/**
 * 查询分页
 */
export interface QueryPagination {
  /** 页码（从1开始） */
  page: number
  /** 每页大小 */
  pageSize: number
  /** 偏移量 */
  offset?: number
  /** 限制数量 */
  limit?: number
}

/**
 * 查询选项
 */
export interface QueryOptions {
  /** 是否包含已删除记录 */
  includeDeleted?: boolean
  /** 是否包含已归档记录 */
  includeArchived?: boolean
  /** 查询超时时间（毫秒） */
  timeout?: number
  /** 是否使用缓存 */
  useCache?: boolean
  /** 缓存过期时间（秒） */
  cacheTtl?: number
  /** 是否返回总数 */
  includeTotalCount?: boolean
  /** 是否优化查询 */
  optimize?: boolean
}

/**
 * 查询结果
 */
export interface QueryResult<T = any> {
  /** 记录列表 */
  records: T[]
  /** 总记录数 */
  totalCount?: number
  /** 分页信息 */
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  /** 聚合结果 */
  aggregations?: Record<string, any>
  /** 分组结果 */
  groups?: GroupResult[]
  /** 查询元数据 */
  metadata: QueryMetadata
}

/**
 * 分组结果
 */
export interface GroupResult {
  /** 分组键 */
  key: FieldValue
  /** 分组值 */
  value: string
  /** 记录数量 */
  count: number
  /** 分组记录 */
  records: any[]
  /** 子分组 */
  subGroups?: GroupResult[]
}

/**
 * 查询元数据
 */
export interface QueryMetadata {
  /** 查询ID */
  queryId: string
  /** 执行时间（毫秒） */
  executionTime: number
  /** 是否来自缓存 */
  fromCache: boolean
  /** 查询计划 */
  queryPlan?: QueryPlan
  /** 索引使用情况 */
  indexUsage?: IndexUsage[]
  /** 警告信息 */
  warnings?: string[]
}

/**
 * 查询计划
 */
export interface QueryPlan {
  /** 步骤列表 */
  steps: QueryStep[]
  /** 预估成本 */
  estimatedCost: number
  /** 预估行数 */
  estimatedRows: number
}

/**
 * 查询步骤
 */
export interface QueryStep {
  /** 步骤类型 */
  type: 'scan' | 'filter' | 'sort' | 'group' | 'aggregate' | 'join'
  /** 步骤描述 */
  description: string
  /** 成本 */
  cost: number
  /** 行数 */
  rows: number
  /** 使用的索引 */
  index?: string
}

/**
 * 索引使用情况
 */
export interface IndexUsage {
  /** 索引名称 */
  indexName: string
  /** 使用类型 */
  usageType: 'scan' | 'seek' | 'lookup'
  /** 扫描行数 */
  scannedRows: number
  /** 返回行数 */
  returnedRows: number
}

/**
 * 查询构建器
 */
export interface QueryBuilder {
  /** 选择字段 */
  select(fields: string[]): QueryBuilder
  /** 添加筛选条件 */
  where(filter: Filter): QueryBuilder
  /** 添加排序 */
  orderBy(sort: Sort): QueryBuilder
  /** 添加分组 */
  groupBy(group: Group): QueryBuilder
  /** 添加聚合 */
  aggregate(aggregation: Aggregation): QueryBuilder
  /** 添加连接 */
  join(join: Join): QueryBuilder
  /** 设置分页 */
  paginate(pagination: QueryPagination): QueryBuilder
  /** 设置选项 */
  options(options: QueryOptions): QueryBuilder
  /** 构建查询 */
  build(): Query
  /** 执行查询 */
  execute(): Promise<QueryResult>
}

/**
 * 查询优化器
 */
export interface QueryOptimizer {
  /** 优化查询 */
  optimize(query: Query): Query
  /** 分析查询 */
  analyze(query: Query): QueryAnalysis
  /** 建议索引 */
  suggestIndexes(query: Query): IndexSuggestion[]
}

/**
 * 查询分析结果
 */
export interface QueryAnalysis {
  /** 复杂度评分 */
  complexityScore: number
  /** 性能预测 */
  performancePrediction: 'fast' | 'medium' | 'slow'
  /** 瓶颈分析 */
  bottlenecks: QueryBottleneck[]
  /** 优化建议 */
  suggestions: OptimizationSuggestion[]
}

/**
 * 查询瓶颈
 */
export interface QueryBottleneck {
  /** 瓶颈类型 */
  type: 'missing_index' | 'large_scan' | 'complex_filter' | 'expensive_join'
  /** 描述 */
  description: string
  /** 影响程度 */
  impact: 'low' | 'medium' | 'high'
  /** 建议解决方案 */
  solution: string
}

/**
 * 优化建议
 */
export interface OptimizationSuggestion {
  /** 建议类型 */
  type: 'add_index' | 'rewrite_query' | 'partition_data' | 'cache_result'
  /** 建议描述 */
  description: string
  /** 预期收益 */
  expectedBenefit: string
  /** 实施难度 */
  difficulty: 'easy' | 'medium' | 'hard'
}

/**
 * 索引建议
 */
export interface IndexSuggestion {
  /** 索引名称 */
  name: string
  /** 索引字段 */
  fields: string[]
  /** 索引类型 */
  type: 'btree' | 'hash' | 'fulltext'
  /** 预期收益 */
  expectedBenefit: number
  /** 存储成本 */
  storageCost: number
}

/**
 * 查询缓存
 */
export interface QueryCache {
  /** 获取缓存 */
  get(key: string): Promise<QueryResult | null>
  /** 设置缓存 */
  set(key: string, result: QueryResult, ttl?: number): Promise<void>
  /** 删除缓存 */
  delete(key: string): Promise<void>
  /** 清空缓存 */
  clear(): Promise<void>
  /** 生成缓存键 */
  generateKey(query: Query): string
}

/**
 * 查询执行器
 */
export interface QueryExecutor {
  /** 执行查询 */
  execute(query: Query): Promise<QueryResult>
  /** 执行原始SQL */
  executeRaw(sql: string, params?: any[]): Promise<any[]>
  /** 解释查询计划 */
  explain(query: Query): Promise<QueryPlan>
  /** 获取统计信息 */
  getStatistics(): Promise<QueryStatistics>
}

/**
 * 查询统计信息
 */
export interface QueryStatistics {
  /** 总查询数 */
  totalQueries: number
  /** 平均执行时间 */
  averageExecutionTime: number
  /** 缓存命中率 */
  cacheHitRate: number
  /** 慢查询数量 */
  slowQueries: number
  /** 最常用的查询 */
  topQueries: QueryStat[]
}

/**
 * 查询统计
 */
export interface QueryStat {
  /** 查询哈希 */
  queryHash: string
  /** 执行次数 */
  executionCount: number
  /** 平均执行时间 */
  averageTime: number
  /** 最后执行时间 */
  lastExecuted: Date
}
