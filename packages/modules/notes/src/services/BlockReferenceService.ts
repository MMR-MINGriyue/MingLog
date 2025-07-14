/**
 * 块引用服务
 * 
 * 功能：
 * - 块引用的CRUD操作
 * - 反向引用查询
 * - 块引用统计和分析
 * - 块引用同步和更新
 * - 与双向链接系统集成
 */

import { CoreAPI } from '@minglog/core'
import { BlockReferenceRecord, BlockBacklinkInfo, BlockStatistics } from '../database/BlockReferenceDatabaseSchema'
import BlockReferenceParser, { BlockMatch } from '../parsers/BlockReferenceParser'

export interface CreateBlockReferenceRequest {
  /** 源块ID */
  source_block_id: string
  /** 目标块ID */
  target_block_id: string
  /** 引用类型 */
  reference_type: 'direct' | 'embed' | 'mention'
  /** 引用上下文 */
  context?: string
  /** 位置 */
  position?: number
}

export interface UpdateBlockReferenceRequest {
  /** 引用ID */
  id: string
  /** 引用上下文 */
  context?: string
  /** 位置 */
  position?: number
  /** 引用类型 */
  reference_type?: 'direct' | 'embed' | 'mention'
}

export interface BlockReferenceQueryOptions {
  /** 限制数量 */
  limit?: number
  /** 偏移量 */
  offset?: number
  /** 引用类型过滤 */
  reference_type?: string
  /** 排序方式 */
  sort_by?: 'created_at' | 'position' | 'reference_count'
  /** 排序方向 */
  sort_order?: 'asc' | 'desc'
}

export interface SyncBlockReferencesRequest {
  /** 源块ID */
  source_block_id: string
  /** 块内容 */
  content: string
}

export interface BlockSearchOptions {
  /** 搜索查询 */
  query: string
  /** 限制数量 */
  limit?: number
  /** 块类型过滤 */
  block_type?: string
  /** 页面ID过滤 */
  page_id?: string
}

export class BlockReferenceService {
  constructor(private coreAPI: CoreAPI) {}

  /**
   * 创建块引用
   */
  async createBlockReference(request: CreateBlockReferenceRequest): Promise<BlockReferenceRecord> {
    // 验证源块和目标块是否存在
    await this.validateBlockExists(request.source_block_id)
    await this.validateBlockExists(request.target_block_id)

    // 防止自引用
    if (request.source_block_id === request.target_block_id) {
      throw new Error('Block cannot reference itself')
    }

    // 生成引用记录
    const now = new Date().toISOString()
    const referenceRecord: BlockReferenceRecord = {
      id: this.generateId(),
      source_block_id: request.source_block_id,
      target_block_id: request.target_block_id,
      reference_type: request.reference_type,
      context: request.context,
      position: request.position,
      created_at: now,
      updated_at: now
    }

    // 插入引用记录
    await this.coreAPI.database.execute(
      `INSERT INTO block_references (
        id, source_block_id, target_block_id, reference_type, 
        context, position, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        referenceRecord.id,
        referenceRecord.source_block_id,
        referenceRecord.target_block_id,
        referenceRecord.reference_type,
        referenceRecord.context,
        referenceRecord.position,
        referenceRecord.created_at,
        referenceRecord.updated_at
      ]
    )

    // 发送块引用创建事件
    this.coreAPI.events.emit('block-reference:created', {
      reference: referenceRecord,
      source_block: { id: request.source_block_id },
      target_block: { id: request.target_block_id }
    })

    return referenceRecord
  }

  /**
   * 更新块引用
   */
  async updateBlockReference(request: UpdateBlockReferenceRequest): Promise<BlockReferenceRecord> {
    const { id, ...updates } = request
    const now = new Date().toISOString()

    // 检查引用是否存在
    const existingReference = await this.getBlockReference(id)
    if (!existingReference) {
      throw new Error(`Block reference with id ${id} not found`)
    }

    // 构建更新字段
    const updateFields: string[] = []
    const updateValues: any[] = []

    if (updates.context !== undefined) {
      updateFields.push('context = ?')
      updateValues.push(updates.context)
    }

    if (updates.position !== undefined) {
      updateFields.push('position = ?')
      updateValues.push(updates.position)
    }

    if (updates.reference_type !== undefined) {
      updateFields.push('reference_type = ?')
      updateValues.push(updates.reference_type)
    }

    updateFields.push('updated_at = ?')
    updateValues.push(now)
    updateValues.push(id)

    // 执行更新
    await this.coreAPI.database.execute(
      `UPDATE block_references SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    // 获取更新后的记录
    const updatedReference = await this.getBlockReference(id)
    if (!updatedReference) {
      throw new Error('Failed to retrieve updated block reference')
    }

    // 发送块引用更新事件
    this.coreAPI.events.emit('block-reference:updated', {
      reference: updatedReference,
      previous: existingReference,
      changes: updates
    })

    return updatedReference
  }

  /**
   * 删除块引用
   */
  async deleteBlockReference(id: string): Promise<void> {
    // 获取要删除的引用信息
    const reference = await this.getBlockReference(id)
    if (!reference) {
      throw new Error(`Block reference with id ${id} not found`)
    }

    // 删除引用记录
    await this.coreAPI.database.execute(
      'DELETE FROM block_references WHERE id = ?',
      [id]
    )

    // 发送块引用删除事件
    this.coreAPI.events.emit('block-reference:deleted', {
      reference,
      deleted_at: new Date().toISOString()
    })
  }

  /**
   * 获取单个块引用
   */
  async getBlockReference(id: string): Promise<BlockReferenceRecord | null> {
    const result = await this.coreAPI.database.query(
      'SELECT * FROM block_references WHERE id = ?',
      [id]
    )

    return result.length > 0 ? result[0] as BlockReferenceRecord : null
  }

  /**
   * 获取块的所有引用（作为目标）
   */
  async getBlockReferences(
    target_block_id: string, 
    options: BlockReferenceQueryOptions = {}
  ): Promise<BlockReferenceRecord[]> {
    const { limit = 50, offset = 0, reference_type, sort_by = 'created_at', sort_order = 'desc' } = options

    let sql = `
      SELECT br.* FROM block_references br
      WHERE br.target_block_id = ?
    `
    const params: any[] = [target_block_id]

    if (reference_type) {
      sql += ' AND br.reference_type = ?'
      params.push(reference_type)
    }

    sql += ` ORDER BY br.${sort_by} ${sort_order.toUpperCase()}`
    sql += ' LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const result = await this.coreAPI.database.query(sql, params)
    return result as BlockReferenceRecord[]
  }

  /**
   * 获取块的反向链接信息
   */
  async getBlockBacklinks(target_block_id: string): Promise<BlockBacklinkInfo[]> {
    const sql = `
      SELECT 
        br.id as reference_id,
        br.source_block_id,
        br.reference_type,
        br.context,
        br.position,
        br.created_at,
        sb.content as source_content,
        sb.block_type as source_type,
        sb.page_id as source_page_id,
        sp.name as source_page_name
      FROM block_references br
      JOIN blocks sb ON br.source_block_id = sb.id
      JOIN pages sp ON sb.page_id = sp.id
      WHERE br.target_block_id = ?
      ORDER BY br.created_at DESC
    `

    const result = await this.coreAPI.database.query(sql, [target_block_id])
    
    return result.map((row: any) => ({
      reference_id: row.reference_id,
      source_block: {
        id: row.source_block_id,
        content: row.source_content,
        block_type: row.source_type,
        page_id: row.source_page_id,
        page_name: row.source_page_name
      },
      context: row.context,
      position: row.position,
      reference_type: row.reference_type,
      created_at: row.created_at
    })) as BlockBacklinkInfo[]
  }

  /**
   * 获取块的出站引用
   */
  async getOutgoingBlockReferences(source_block_id: string): Promise<BlockReferenceRecord[]> {
    const result = await this.coreAPI.database.query(
      'SELECT * FROM block_references WHERE source_block_id = ? ORDER BY position ASC, created_at ASC',
      [source_block_id]
    )

    return result as BlockReferenceRecord[]
  }

  /**
   * 同步块内容中的引用
   * 解析块内容中的块引用并更新数据库
   */
  async syncBlockReferences(request: SyncBlockReferencesRequest): Promise<{
    created: BlockReferenceRecord[]
    updated: BlockReferenceRecord[]
    deleted: BlockReferenceRecord[]
  }> {
    const { source_block_id, content } = request

    // 解析内容中的块引用
    const parseResult = BlockReferenceParser.parse(content)
    const newReferences = parseResult.blockReferences

    // 获取现有引用
    const existingReferences = await this.getOutgoingBlockReferences(source_block_id)

    const created: BlockReferenceRecord[] = []
    const updated: BlockReferenceRecord[] = []
    const deleted: BlockReferenceRecord[] = []

    // 处理新引用
    for (const refMatch of newReferences) {
      const existingRef = existingReferences.find(ref => 
        ref.target_block_id === refMatch.blockId && 
        ref.position === refMatch.startIndex
      )

      if (existingRef) {
        // 更新现有引用
        const updatedRef = await this.updateBlockReference({
          id: existingRef.id,
          context: refMatch.fullMatch,
          position: refMatch.startIndex
        })
        updated.push(updatedRef)
      } else {
        // 创建新引用
        try {
          const newRef = await this.createBlockReference({
            source_block_id,
            target_block_id: refMatch.blockId,
            reference_type: 'direct',
            context: refMatch.fullMatch,
            position: refMatch.startIndex
          })
          created.push(newRef)
        } catch (error) {
          console.warn(`Failed to create block reference to ${refMatch.blockId}:`, error)
        }
      }
    }

    // 删除不再存在的引用
    const newReferencePositions = new Set(newReferences.map(ref => ref.startIndex))
    for (const existingRef of existingReferences) {
      if (!newReferencePositions.has(existingRef.position || -1)) {
        await this.deleteBlockReference(existingRef.id)
        deleted.push(existingRef)
      }
    }

    // 发送同步完成事件
    this.coreAPI.events.emit('block-references:synced', {
      source_block_id,
      created: created.length,
      updated: updated.length,
      deleted: deleted.length
    })

    return { created, updated, deleted }
  }

  /**
   * 搜索块
   */
  async searchBlocks(options: BlockSearchOptions): Promise<any[]> {
    const { query, limit = 20, block_type, page_id } = options

    let sql = `
      SELECT 
        b.id,
        b.content,
        b.block_type,
        b.page_id,
        p.name as page_name,
        b.reference_count,
        b.created_at,
        -- 计算相关性分数
        CASE 
          WHEN b.content LIKE ? THEN 100
          WHEN b.content LIKE ? THEN 80
          WHEN b.content LIKE ? THEN 60
          ELSE 40
        END as relevance_score
      FROM blocks b
      JOIN pages p ON b.page_id = p.id
      WHERE b.content LIKE ?
    `

    const exactMatch = query
    const prefixMatch = `${query}%`
    const containsMatch = `%${query}%`
    const params = [exactMatch, prefixMatch, containsMatch, containsMatch]

    if (block_type) {
      sql += ' AND b.block_type = ?'
      params.push(block_type)
    }

    if (page_id) {
      sql += ' AND b.page_id = ?'
      params.push(page_id)
    }

    sql += ' ORDER BY relevance_score DESC, b.reference_count DESC, b.created_at DESC'
    sql += ' LIMIT ?'
    params.push(limit)

    const result = await this.coreAPI.database.query(sql, params)
    return result
  }

  /**
   * 获取块引用统计
   */
  async getBlockReferenceStatistics(): Promise<BlockStatistics> {
    const sql = `
      SELECT
        COUNT(*) as total_blocks,
        COUNT(CASE WHEN reference_count > 0 THEN 1 END) as referenced_blocks,
        COALESCE(SUM(reference_count), 0) as total_references,
        COALESCE(AVG(CASE WHEN reference_count > 0 THEN reference_count END), 0) as average_references
      FROM blocks
    `

    const result = await this.coreAPI.database.query(sql)
    const stats = result[0]

    // 获取最多引用的块
    const mostReferencedResult = await this.coreAPI.database.query(`
      SELECT id, content, reference_count
      FROM blocks
      WHERE reference_count > 0
      ORDER BY reference_count DESC, created_at DESC
      LIMIT 1
    `)

    return {
      total_blocks: stats.total_blocks,
      referenced_blocks: stats.referenced_blocks,
      total_references: stats.total_references,
      average_references: parseFloat((stats.average_references || 0).toFixed(2)),
      most_referenced_block: mostReferencedResult.length > 0 ? {
        id: mostReferencedResult[0].id,
        content: mostReferencedResult[0].content,
        reference_count: mostReferencedResult[0].reference_count
      } : undefined
    }
  }

  /**
   * 验证块是否存在
   */
  private async validateBlockExists(blockId: string): Promise<void> {
    const result = await this.coreAPI.database.query(
      'SELECT id FROM blocks WHERE id = ?',
      [blockId]
    )

    if (result.length === 0) {
      throw new Error(`Block with id ${blockId} does not exist`)
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `block_ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export default BlockReferenceService
