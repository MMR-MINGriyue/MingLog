/**
 * 关联系统类型定义
 */

/**
 * 关联类型枚举
 */
export enum RelationType {
  ONE_TO_ONE = 'one_to_one',
  ONE_TO_MANY = 'one_to_many',
  MANY_TO_MANY = 'many_to_many'
}

/**
 * 关联接口
 */
export interface Relation {
  /** 关联唯一标识 */
  id: string
  /** 关联名称 */
  name: string
  /** 关联类型 */
  type: RelationType
  /** 源数据库ID */
  sourceDatabaseId: string
  /** 源字段ID */
  sourceFieldId: string
  /** 目标数据库ID */
  targetDatabaseId: string
  /** 目标字段ID */
  targetFieldId: string
  /** 关联配置 */
  config: RelationConfig
  /** 约束条件 */
  constraints: RelationConstraint[]
  /** 是否双向 */
  bidirectional: boolean
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
}

/**
 * 关联配置
 */
export interface RelationConfig {
  /** 是否级联删除 */
  cascadeDelete: boolean
  /** 是否级联更新 */
  cascadeUpdate: boolean
  /** 显示字段 */
  displayField?: string
  /** 排序字段 */
  sortField?: string
  /** 排序方向 */
  sortDirection?: 'asc' | 'desc'
  /** 筛选条件 */
  filter?: RelationFilter
  /** 是否允许创建新记录 */
  allowCreate: boolean
  /** 是否允许链接现有记录 */
  allowLink: boolean
  /** 是否允许取消链接 */
  allowUnlink: boolean
  /** 最大关联数量 */
  maxCount?: number
  /** 最小关联数量 */
  minCount?: number
}

/**
 * 关联筛选条件
 */
export interface RelationFilter {
  /** 字段ID */
  fieldId: string
  /** 操作符 */
  operator: string
  /** 筛选值 */
  value: any
}

/**
 * 关联约束
 */
export interface RelationConstraint {
  /** 约束类型 */
  type: RelationConstraintType
  /** 约束配置 */
  config: any
  /** 错误消息 */
  errorMessage?: string
}

/**
 * 关联约束类型
 */
export enum RelationConstraintType {
  REQUIRED = 'required',
  UNIQUE = 'unique',
  COUNT_LIMIT = 'count_limit',
  VALUE_CONSTRAINT = 'value_constraint',
  CIRCULAR_REFERENCE = 'circular_reference'
}

/**
 * 关联记录
 */
export interface RelationRecord {
  /** 关联记录ID */
  id: string
  /** 关联ID */
  relationId: string
  /** 源记录ID */
  sourceRecordId: string
  /** 目标记录ID */
  targetRecordId: string
  /** 关联属性 */
  properties: RelationProperties
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
}

/**
 * 关联属性
 */
export interface RelationProperties {
  /** 关联强度 */
  strength?: number
  /** 关联权重 */
  weight?: number
  /** 关联标签 */
  labels?: string[]
  /** 关联描述 */
  description?: string
  /** 自定义属性 */
  custom?: Record<string, any>
}

/**
 * 关联查询参数
 */
export interface RelationQueryParams {
  /** 源记录ID */
  sourceRecordId?: string
  /** 目标记录ID */
  targetRecordId?: string
  /** 关联类型 */
  relationType?: RelationType
  /** 深度限制 */
  depth?: number
  /** 是否包含属性 */
  includeProperties?: boolean
  /** 筛选条件 */
  filters?: RelationFilter[]
  /** 排序规则 */
  sorts?: RelationSort[]
  /** 分页参数 */
  pagination?: RelationPagination
}

/**
 * 关联排序
 */
export interface RelationSort {
  /** 排序字段 */
  field: string
  /** 排序方向 */
  direction: 'asc' | 'desc'
}

/**
 * 关联分页
 */
export interface RelationPagination {
  /** 页码 */
  page: number
  /** 每页大小 */
  pageSize: number
}

/**
 * 关联查询结果
 */
export interface RelationQueryResult {
  /** 关联记录列表 */
  relations: RelationRecord[]
  /** 关联的记录数据 */
  records: Record<string, any>
  /** 总数量 */
  totalCount: number
  /** 分页信息 */
  pagination?: {
    page: number
    pageSize: number
    totalPages: number
  }
}

/**
 * 关联图
 */
export interface RelationGraph {
  /** 节点列表 */
  nodes: RelationNode[]
  /** 边列表 */
  edges: RelationEdge[]
  /** 图属性 */
  properties: GraphProperties
}

/**
 * 关联节点
 */
export interface RelationNode {
  /** 节点ID */
  id: string
  /** 记录ID */
  recordId: string
  /** 数据库ID */
  databaseId: string
  /** 节点标签 */
  label: string
  /** 节点类型 */
  type: string
  /** 节点属性 */
  properties: Record<string, any>
  /** 位置信息 */
  position?: { x: number; y: number }
}

/**
 * 关联边
 */
export interface RelationEdge {
  /** 边ID */
  id: string
  /** 关联ID */
  relationId: string
  /** 源节点ID */
  sourceId: string
  /** 目标节点ID */
  targetId: string
  /** 边标签 */
  label?: string
  /** 边类型 */
  type: RelationType
  /** 边属性 */
  properties: RelationProperties
}

/**
 * 图属性
 */
export interface GraphProperties {
  /** 节点数量 */
  nodeCount: number
  /** 边数量 */
  edgeCount: number
  /** 连通分量数 */
  componentCount: number
  /** 图密度 */
  density: number
  /** 平均度数 */
  averageDegree: number
}

/**
 * 关联分析结果
 */
export interface RelationAnalysis {
  /** 中心性分析 */
  centrality: CentralityAnalysis
  /** 社区检测 */
  communities: Community[]
  /** 路径分析 */
  paths: PathAnalysis
  /** 影响力分析 */
  influence: InfluenceAnalysis
}

/**
 * 中心性分析
 */
export interface CentralityAnalysis {
  /** 度中心性 */
  degreeCentrality: Record<string, number>
  /** 介数中心性 */
  betweennessCentrality: Record<string, number>
  /** 接近中心性 */
  closenessCentrality: Record<string, number>
  /** 特征向量中心性 */
  eigenvectorCentrality: Record<string, number>
}

/**
 * 社区
 */
export interface Community {
  /** 社区ID */
  id: string
  /** 社区成员 */
  members: string[]
  /** 社区大小 */
  size: number
  /** 社区密度 */
  density: number
  /** 社区标签 */
  label?: string
}

/**
 * 路径分析
 */
export interface PathAnalysis {
  /** 最短路径 */
  shortestPaths: ShortestPath[]
  /** 关键路径 */
  criticalPaths: CriticalPath[]
  /** 路径统计 */
  statistics: PathStatistics
}

/**
 * 最短路径
 */
export interface ShortestPath {
  /** 源节点 */
  source: string
  /** 目标节点 */
  target: string
  /** 路径长度 */
  length: number
  /** 路径节点 */
  path: string[]
}

/**
 * 关键路径
 */
export interface CriticalPath {
  /** 路径ID */
  id: string
  /** 路径节点 */
  nodes: string[]
  /** 路径权重 */
  weight: number
  /** 路径类型 */
  type: string
}

/**
 * 路径统计
 */
export interface PathStatistics {
  /** 平均路径长度 */
  averagePathLength: number
  /** 最大路径长度 */
  maxPathLength: number
  /** 直径 */
  diameter: number
  /** 半径 */
  radius: number
}

/**
 * 影响力分析
 */
export interface InfluenceAnalysis {
  /** 影响力排名 */
  influenceRanking: InfluenceRank[]
  /** 影响力传播 */
  influenceSpread: InfluenceSpread[]
  /** 关键节点 */
  keyNodes: KeyNode[]
}

/**
 * 影响力排名
 */
export interface InfluenceRank {
  /** 节点ID */
  nodeId: string
  /** 影响力分数 */
  score: number
  /** 排名 */
  rank: number
}

/**
 * 影响力传播
 */
export interface InfluenceSpread {
  /** 源节点 */
  source: string
  /** 影响范围 */
  reach: string[]
  /** 传播深度 */
  depth: number
  /** 传播强度 */
  intensity: number
}

/**
 * 关键节点
 */
export interface KeyNode {
  /** 节点ID */
  nodeId: string
  /** 关键性类型 */
  type: 'hub' | 'bridge' | 'authority' | 'connector'
  /** 重要性分数 */
  importance: number
  /** 描述 */
  description: string
}

/**
 * 关联服务接口
 */
export interface IRelationService {
  /** 创建关联 */
  createRelation(params: CreateRelationParams): Promise<Relation>
  /** 更新关联 */
  updateRelation(id: string, params: UpdateRelationParams): Promise<Relation>
  /** 删除关联 */
  deleteRelation(id: string): Promise<void>
  /** 获取关联 */
  getRelation(id: string): Promise<Relation | null>
  /** 查询关联 */
  queryRelations(params: RelationQueryParams): Promise<RelationQueryResult>
  /** 创建关联记录 */
  createRelationRecord(params: CreateRelationRecordParams): Promise<RelationRecord>
  /** 删除关联记录 */
  deleteRelationRecord(id: string): Promise<void>
  /** 构建关联图 */
  buildRelationGraph(params: BuildGraphParams): Promise<RelationGraph>
  /** 分析关联 */
  analyzeRelations(params: AnalyzeRelationsParams): Promise<RelationAnalysis>
}

/**
 * 创建关联参数
 */
export interface CreateRelationParams {
  name: string
  type: RelationType
  sourceDatabaseId: string
  sourceFieldId: string
  targetDatabaseId: string
  targetFieldId: string
  config?: Partial<RelationConfig>
  constraints?: RelationConstraint[]
  bidirectional?: boolean
}

/**
 * 更新关联参数
 */
export interface UpdateRelationParams {
  name?: string
  config?: Partial<RelationConfig>
  constraints?: RelationConstraint[]
  bidirectional?: boolean
}

/**
 * 创建关联记录参数
 */
export interface CreateRelationRecordParams {
  relationId: string
  sourceRecordId: string
  targetRecordId: string
  properties?: RelationProperties
}

/**
 * 构建图参数
 */
export interface BuildGraphParams {
  databaseIds?: string[]
  recordIds?: string[]
  relationTypes?: RelationType[]
  depth?: number
  includeProperties?: boolean
}

/**
 * 分析关联参数
 */
export interface AnalyzeRelationsParams {
  graphId?: string
  analysisTypes: ('centrality' | 'communities' | 'paths' | 'influence')[]
  options?: Record<string, any>
}
