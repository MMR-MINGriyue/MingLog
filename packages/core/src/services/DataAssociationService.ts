/**
 * 数据关联服务
 * 实现模块间的数据关联机制，包括双向链接、统一搜索和事件通信
 */

import { EventEmitter } from 'events'

// 关联类型定义
export enum AssociationType {
  REFERENCE = 'reference',           // 引用关系
  DEPENDENCY = 'dependency',         // 依赖关系
  SIMILARITY = 'similarity',         // 相似性关系
  HIERARCHY = 'hierarchy',           // 层次关系
  TEMPORAL = 'temporal',             // 时间关系
  SEMANTIC = 'semantic',             // 语义关系
  USER_DEFINED = 'user_defined'      // 用户自定义关系
}

// 数据实体类型
export enum EntityType {
  NOTE = 'note',
  TASK = 'task',
  MINDMAP_NODE = 'mindmap_node',
  GRAPH_NODE = 'graph_node',
  FILE = 'file',
  TAG = 'tag',
  PROJECT = 'project'
}

// 关联记录接口
export interface AssociationRecord {
  id: string
  sourceType: EntityType
  sourceId: string
  targetType: EntityType
  targetId: string
  associationType: AssociationType
  strength: number                   // 关联强度 0-1
  metadata?: Record<string, any>     // 额外元数据
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

// 搜索结果接口
export interface UnifiedSearchResult {
  id: string
  type: EntityType
  entityType: EntityType            // 实体类型（与type保持一致）
  moduleId?: string                 // 模块ID
  module?: string                   // 模块名称（兼容性）
  title: string
  content?: string
  snippet?: string
  score: number                     // 相关性评分
  relevance?: number                // 相关性（兼容性）
  metadata?: Record<string, any>
  associations?: AssociationRecord[] & {
    connectionCount?: number        // 连接数量
    tags?: string[]                 // 标签
  }                                 // 关联记录
  highlights?: string[]             // 高亮片段
  // 时间戳
  createdAt?: Date | string
  updatedAt?: Date | string
  lastModified?: Date | string
}

// 关联查询选项
export interface AssociationQuery {
  entityType?: EntityType
  entityId?: string
  associationType?: AssociationType
  minStrength?: number
  maxDepth?: number                  // 关联深度
  includeMetadata?: boolean
  sortBy?: 'strength' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// 搜索选项
export interface SearchOptions {
  query: string
  entityTypes?: EntityType[]
  includeAssociations?: boolean
  fuzzyMatch?: boolean
  limit?: number
  offset?: number
}

// 批量操作结果
export interface BatchOperationResult {
  success: number
  failed: number
  errors: Array<{ id: string, error: string }>
}

/**
 * 数据关联服务实现
 */
export class DataAssociationService extends EventEmitter {
  private associations: Map<string, AssociationRecord> = new Map()
  private entityIndex: Map<string, Set<string>> = new Map() // entityType:entityId -> associationIds
  private typeIndex: Map<AssociationType, Set<string>> = new Map() // associationType -> associationIds
  private searchIndex: Map<string, UnifiedSearchResult> = new Map() // entityType:entityId -> searchResult

  constructor(private coreAPI?: any) {
    super()
    this.initializeIndexes()
  }

  /**
   * 初始化索引
   */
  private initializeIndexes(): void {
    // 初始化类型索引
    Object.values(AssociationType).forEach(type => {
      this.typeIndex.set(type, new Set())
    })
  }

  /**
   * 创建关联
   */
  async createAssociation(
    sourceType: EntityType,
    sourceId: string,
    targetType: EntityType,
    targetId: string,
    associationType: AssociationType,
    strength: number = 1.0,
    metadata?: Record<string, any>
  ): Promise<AssociationRecord> {
    // 验证参数
    if (strength < 0 || strength > 1) {
      throw new Error('关联强度必须在0-1之间')
    }

    // 检查是否已存在相同关联
    const existingId = this.findExistingAssociation(sourceType, sourceId, targetType, targetId, associationType)
    if (existingId) {
      throw new Error('关联已存在')
    }

    const association: AssociationRecord = {
      id: this.generateId(),
      sourceType,
      sourceId,
      targetType,
      targetId,
      associationType,
      strength,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 存储关联
    this.associations.set(association.id, association)

    // 更新索引
    this.updateIndexes(association)

    // 发送事件
    this.emit('association:created', association)
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('data:association:created', association)
    }

    return association
  }

  /**
   * 获取关联
   */
  async getAssociation(id: string): Promise<AssociationRecord | null> {
    return this.associations.get(id) || null
  }

  /**
   * 更新关联
   */
  async updateAssociation(
    id: string,
    updates: Partial<Omit<AssociationRecord, 'id' | 'createdAt'>>
  ): Promise<AssociationRecord> {
    const existing = this.associations.get(id)
    if (!existing) {
      throw new Error(`关联记录 ${id} 不存在`)
    }

    const updated: AssociationRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    }

    this.associations.set(id, updated)

    // 更新索引
    this.removeFromIndexes(existing)
    this.updateIndexes(updated)

    // 发送事件
    this.emit('association:updated', { previous: existing, current: updated })
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('data:association:updated', { previous: existing, current: updated })
    }

    return updated
  }

  /**
   * 删除关联
   */
  async deleteAssociation(id: string): Promise<boolean> {
    const association = this.associations.get(id)
    if (!association) {
      return false
    }

    this.associations.delete(id)
    this.removeFromIndexes(association)

    // 发送事件
    this.emit('association:deleted', association)
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('data:association:deleted', association)
    }

    return true
  }

  /**
   * 查询关联
   */
  async queryAssociations(query: AssociationQuery): Promise<AssociationRecord[]> {
    let results = Array.from(this.associations.values())

    // 按实体过滤
    if (query.entityType && query.entityId) {
      const entityKey = `${query.entityType}:${query.entityId}`
      const associationIds = this.entityIndex.get(entityKey)
      if (associationIds) {
        results = results.filter(a => associationIds.has(a.id))
      } else {
        return []
      }
    }

    // 按关联类型过滤
    if (query.associationType) {
      results = results.filter(a => a.associationType === query.associationType)
    }

    // 按强度过滤
    if (query.minStrength !== undefined) {
      results = results.filter(a => a.strength >= query.minStrength)
    }

    // 排序
    if (query.sortBy) {
      results.sort((a, b) => {
        const aValue = a[query.sortBy!]
        const bValue = b[query.sortBy!]

        let comparison = 0
        if (aValue < bValue) comparison = -1
        else if (aValue > bValue) comparison = 1

        return query.sortOrder === 'desc' ? -comparison : comparison
      })
    }

    // 分页
    if (query.offset || query.limit) {
      const start = query.offset || 0
      const end = query.limit ? start + query.limit : undefined
      results = results.slice(start, end)
    }

    return results
  }

  /**
   * 获取实体的所有关联
   */
  async getEntityAssociations(
    entityType: EntityType,
    entityId: string,
    options?: Partial<AssociationQuery>
  ): Promise<AssociationRecord[]> {
    return this.queryAssociations({
      entityType,
      entityId,
      ...options
    })
  }

  /**
   * 获取双向关联
   */
  async getBidirectionalAssociations(
    entityType: EntityType,
    entityId: string,
    options?: Partial<AssociationQuery>
  ): Promise<AssociationRecord[]> {
    const outgoing = await this.getEntityAssociations(entityType, entityId, options)

    // 查找指向该实体的关联
    const incoming = Array.from(this.associations.values()).filter(a =>
      a.targetType === entityType && a.targetId === entityId
    )

    // 合并并去重
    const allAssociations = [...outgoing, ...incoming]
    const uniqueAssociations = allAssociations.filter((a, index, arr) =>
      arr.findIndex(b => b.id === a.id) === index
    )

    return uniqueAssociations
  }

  /**
   * 批量创建关联
   */
  async createAssociationsBatch(
    associations: Array<Omit<AssociationRecord, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      errors: []
    }

    for (const assocData of associations) {
      try {
        await this.createAssociation(
          assocData.sourceType,
          assocData.sourceId,
          assocData.targetType,
          assocData.targetId,
          assocData.associationType,
          assocData.strength,
          assocData.metadata
        )
        result.success++
      } catch (error) {
        result.failed++
        result.errors.push({
          id: `${assocData.sourceType}:${assocData.sourceId}->${assocData.targetType}:${assocData.targetId}`,
          error: error instanceof Error ? error.message : '未知错误'
        })
      }
    }

    return result
  }

  /**
   * 批量删除关联
   */
  async deleteAssociationsBatch(ids: string[]): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      errors: []
    }

    for (const id of ids) {
      try {
        const deleted = await this.deleteAssociation(id)
        if (deleted) {
          result.success++
        } else {
          result.failed++
          result.errors.push({ id, error: '关联不存在' })
        }
      } catch (error) {
        result.failed++
        result.errors.push({
          id,
          error: error instanceof Error ? error.message : '未知错误'
        })
      }
    }

    return result
  }

  /**
   * 注册搜索实体
   */
  async registerSearchEntity(
    entityType: EntityType,
    entityId: string,
    title: string,
    content?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const searchResult: UnifiedSearchResult = {
      id: entityId,
      type: entityType,
      entityType: entityType,  // 添加缺失的entityType字段
      title,
      content,
      score: 1.0,
      metadata
    }

    const key = `${entityType}:${entityId}`
    this.searchIndex.set(key, searchResult)

    // 发送事件
    this.emit('search:entity:registered', searchResult)
  }

  /**
   * 更新搜索实体
   */
  async updateSearchEntity(
    entityType: EntityType,
    entityId: string,
    updates: Partial<Omit<UnifiedSearchResult, 'id' | 'type'>>
  ): Promise<void> {
    const key = `${entityType}:${entityId}`
    const existing = this.searchIndex.get(key)

    if (existing) {
      const updated = { ...existing, ...updates }
      this.searchIndex.set(key, updated)

      // 发送事件
      this.emit('search:entity:updated', updated)
    }
  }

  /**
   * 移除搜索实体
   */
  async unregisterSearchEntity(entityType: EntityType, entityId: string): Promise<void> {
    const key = `${entityType}:${entityId}`
    const removed = this.searchIndex.delete(key)

    if (removed) {
      // 发送事件
      this.emit('search:entity:unregistered', { entityType, entityId })
    }
  }

  /**
   * 统一搜索
   */
  async unifiedSearch(options: SearchOptions): Promise<UnifiedSearchResult[]> {
    const { query, entityTypes, includeAssociations, fuzzyMatch, limit, offset } = options
    const lowerQuery = query.toLowerCase()

    let results = Array.from(this.searchIndex.values())

    // 按实体类型过滤
    if (entityTypes && entityTypes.length > 0) {
      results = results.filter(r => entityTypes.includes(r.type))
    }

    // 搜索匹配
    results = results.filter(result => {
      const titleMatch = result.title.toLowerCase().includes(lowerQuery)
      const contentMatch = result.content?.toLowerCase().includes(lowerQuery)

      if (fuzzyMatch) {
        // 简单的模糊匹配实现
        const titleFuzzy = this.fuzzyMatch(result.title.toLowerCase(), lowerQuery)
        const contentFuzzy = result.content ? this.fuzzyMatch(result.content.toLowerCase(), lowerQuery) : false
        return titleMatch || contentMatch || titleFuzzy || contentFuzzy
      }

      return titleMatch || contentMatch
    })

    // 计算相关性评分
    results.forEach(result => {
      let score = 0
      const titleMatch = result.title.toLowerCase().includes(lowerQuery)
      const contentMatch = result.content?.toLowerCase().includes(lowerQuery)

      if (titleMatch) score += 1.0
      if (contentMatch) score += 0.5

      // 根据匹配位置调整评分
      if (titleMatch && result.title.toLowerCase().startsWith(lowerQuery)) {
        score += 0.5
      }

      result.score = score
    })

    // 按评分排序
    results.sort((a, b) => b.score - a.score)

    // 添加关联信息
    if (includeAssociations) {
      for (const result of results) {
        result.associations = await this.getEntityAssociations(result.type, result.id)
      }
    }

    // 分页
    const start = offset || 0
    const end = limit ? start + limit : undefined
    return results.slice(start, end)
  }

  /**
   * 获取关联图谱
   */
  async getAssociationGraph(
    entityType: EntityType,
    entityId: string,
    maxDepth: number = 2
  ): Promise<{
    nodes: Array<{ id: string, type: EntityType, title: string }>
    edges: Array<{ source: string, target: string, type: AssociationType, strength: number }>
  }> {
    const visited = new Set<string>()
    const nodes = new Map<string, { id: string, type: EntityType, title: string }>()
    const edges: Array<{ source: string, target: string, type: AssociationType, strength: number }> = []

    const traverse = async (currentType: EntityType, currentId: string, depth: number) => {
      const key = `${currentType}:${currentId}`
      if (visited.has(key) || depth > maxDepth) return

      visited.add(key)

      // 添加当前节点
      const searchEntity = this.searchIndex.get(key)
      if (searchEntity) {
        nodes.set(key, {
          id: key, // 使用完整的key作为ID以避免冲突
          type: currentType,
          title: searchEntity.title
        })
      }

      // 获取关联
      const associations = await this.getBidirectionalAssociations(currentType, currentId)

      for (const assoc of associations) {
        // 确定目标节点
        let targetType: EntityType
        let targetId: string

        if (assoc.sourceType === currentType && assoc.sourceId === currentId) {
          targetType = assoc.targetType
          targetId = assoc.targetId
        } else {
          targetType = assoc.sourceType
          targetId = assoc.sourceId
        }

        // 确保目标节点也在搜索索引中
        const targetKey = `${targetType}:${targetId}`
        const targetSearchEntity = this.searchIndex.get(targetKey)
        if (targetSearchEntity) {
          // 添加目标节点到节点列表（如果还没有添加）
          if (!nodes.has(targetKey)) {
            nodes.set(targetKey, {
              id: targetKey,
              type: targetType,
              title: targetSearchEntity.title
            })
          }

          // 添加边
          const sourceKey = `${currentType}:${currentId}`
          edges.push({
            source: sourceKey,
            target: targetKey,
            type: assoc.associationType,
            strength: assoc.strength
          })

          // 递归遍历
          if (depth < maxDepth) {
            await traverse(targetType, targetId, depth + 1)
          }
        }
      }
    }

    await traverse(entityType, entityId, 0)

    return {
      nodes: Array.from(nodes.values()),
      edges
    }
  }

  /**
   * 获取统计信息
   */
  getStatistics(): {
    totalAssociations: number
    associationsByType: Record<AssociationType, number>
    entitiesByType: Record<EntityType, number>
    averageStrength: number
  } {
    const totalAssociations = this.associations.size
    const associationsByType: Record<AssociationType, number> = {} as any
    const entitiesByType: Record<EntityType, number> = {} as any
    let totalStrength = 0

    // 初始化计数器
    Object.values(AssociationType).forEach(type => {
      associationsByType[type] = 0
    })
    Object.values(EntityType).forEach(type => {
      entitiesByType[type] = 0
    })

    // 统计关联
    for (const assoc of this.associations.values()) {
      associationsByType[assoc.associationType]++
      totalStrength += assoc.strength
    }

    // 统计实体
    const entitySet = new Set<string>()
    for (const assoc of this.associations.values()) {
      entitySet.add(`${assoc.sourceType}:${assoc.sourceId}`)
      entitySet.add(`${assoc.targetType}:${assoc.targetId}`)
    }

    for (const entityKey of entitySet) {
      const [type] = entityKey.split(':')
      entitiesByType[type as EntityType]++
    }

    return {
      totalAssociations,
      associationsByType,
      entitiesByType,
      averageStrength: totalAssociations > 0 ? totalStrength / totalAssociations : 0
    }
  }

  /**
   * 清理孤立关联
   */
  async cleanupOrphanedAssociations(): Promise<number> {
    let cleanedCount = 0
    const toDelete: string[] = []

    for (const [id, assoc] of this.associations) {
      // 检查源实体是否存在
      const sourceKey = `${assoc.sourceType}:${assoc.sourceId}`
      const targetKey = `${assoc.targetType}:${assoc.targetId}`

      if (!this.searchIndex.has(sourceKey) || !this.searchIndex.has(targetKey)) {
        toDelete.push(id)
      }
    }

    for (const id of toDelete) {
      await this.deleteAssociation(id)
      cleanedCount++
    }

    return cleanedCount
  }

  // 私有辅助方法

  private generateId(): string {
    return `assoc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private findExistingAssociation(
    sourceType: EntityType,
    sourceId: string,
    targetType: EntityType,
    targetId: string,
    associationType: AssociationType
  ): string | null {
    for (const [id, assoc] of this.associations) {
      if (
        assoc.sourceType === sourceType &&
        assoc.sourceId === sourceId &&
        assoc.targetType === targetType &&
        assoc.targetId === targetId &&
        assoc.associationType === associationType
      ) {
        return id
      }
    }
    return null
  }

  private updateIndexes(association: AssociationRecord): void {
    // 更新实体索引
    const sourceKey = `${association.sourceType}:${association.sourceId}`
    const targetKey = `${association.targetType}:${association.targetId}`

    if (!this.entityIndex.has(sourceKey)) {
      this.entityIndex.set(sourceKey, new Set())
    }
    if (!this.entityIndex.has(targetKey)) {
      this.entityIndex.set(targetKey, new Set())
    }

    this.entityIndex.get(sourceKey)!.add(association.id)
    this.entityIndex.get(targetKey)!.add(association.id)

    // 更新类型索引
    if (!this.typeIndex.has(association.associationType)) {
      this.typeIndex.set(association.associationType, new Set())
    }
    this.typeIndex.get(association.associationType)!.add(association.id)
  }

  private removeFromIndexes(association: AssociationRecord): void {
    // 从实体索引移除
    const sourceKey = `${association.sourceType}:${association.sourceId}`
    const targetKey = `${association.targetType}:${association.targetId}`

    this.entityIndex.get(sourceKey)?.delete(association.id)
    this.entityIndex.get(targetKey)?.delete(association.id)

    // 从类型索引移除
    this.typeIndex.get(association.associationType)?.delete(association.id)
  }

  private fuzzyMatch(text: string, pattern: string): boolean {
    // 简单的模糊匹配实现
    const textChars = text.split('')
    const patternChars = pattern.split('')

    let textIndex = 0
    let patternIndex = 0

    while (textIndex < textChars.length && patternIndex < patternChars.length) {
      if (textChars[textIndex] === patternChars[patternIndex]) {
        patternIndex++
      }
      textIndex++
    }

    return patternIndex === patternChars.length
  }
}

export default DataAssociationService