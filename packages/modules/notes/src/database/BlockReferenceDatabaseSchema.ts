/**
 * 块引用数据库模型设计
 * 
 * 功能：
 * - 扩展现有的blocks表支持块引用
 * - 创建block_references表存储引用关系
 * - 提供高效的查询索引
 * - 支持块引用的创建、更新、删除操作
 * - 与双向链接系统集成
 */

export interface BlockRecord {
  /** 块唯一标识 */
  id: string
  /** 块内容 */
  content: string
  /** 块类型 */
  block_type: 'paragraph' | 'heading' | 'list' | 'code' | 'quote' | 'image' | 'table'
  /** 父块ID（用于嵌套结构） */
  parent_id?: string
  /** 所属页面ID */
  page_id: string
  /** 块在页面中的顺序 */
  order: number
  /** 块属性（JSON格式） */
  properties?: string
  /** 是否折叠 */
  collapsed: boolean
  /** 引用计数 */
  reference_count: number
  /** 创建时间 */
  created_at: string
  /** 更新时间 */
  updated_at: string
  /** 图谱ID */
  graph_id: string
}

export interface BlockReferenceRecord {
  /** 引用唯一标识 */
  id: string
  /** 源块ID */
  source_block_id: string
  /** 目标块ID */
  target_block_id: string
  /** 引用类型 */
  reference_type: 'direct' | 'embed' | 'mention'
  /** 引用上下文 */
  context?: string
  /** 在源块中的位置 */
  position?: number
  /** 创建时间 */
  created_at: string
  /** 更新时间 */
  updated_at: string
}

export interface BlockBacklinkInfo {
  /** 引用ID */
  reference_id: string
  /** 源块信息 */
  source_block: {
    id: string
    content: string
    block_type: string
    page_id: string
    page_name?: string
  }
  /** 引用上下文 */
  context?: string
  /** 引用位置 */
  position?: number
  /** 引用类型 */
  reference_type: string
  /** 创建时间 */
  created_at: string
}

export interface BlockStatistics {
  /** 总块数 */
  total_blocks: number
  /** 有引用的块数 */
  referenced_blocks: number
  /** 总引用数 */
  total_references: number
  /** 平均引用数 */
  average_references: number
  /** 最多引用的块 */
  most_referenced_block?: {
    id: string
    content: string
    reference_count: number
  }
}

/**
 * 块引用数据库模式定义
 */
export class BlockReferenceDatabaseSchema {
  /**
   * 获取扩展blocks表的SQL语句
   * 在现有blocks表基础上添加块引用相关字段
   */
  static getAlterBlocksTableSQL(): string[] {
    return [
      // 添加块类型字段（如果不存在）
      `ALTER TABLE blocks ADD COLUMN block_type TEXT DEFAULT 'paragraph'`,

      // 添加引用计数字段（如果不存在）
      `ALTER TABLE blocks ADD COLUMN reference_count INTEGER DEFAULT 0`
    ]
  }

  /**
   * 获取创建块引用表的SQL语句
   */
  static getCreateBlockReferencesTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS block_references (
        id TEXT PRIMARY KEY,
        source_block_id TEXT NOT NULL,
        target_block_id TEXT NOT NULL,
        reference_type TEXT NOT NULL DEFAULT 'direct' 
          CHECK (reference_type IN ('direct', 'embed', 'mention')),
        context TEXT,
        position INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        
        -- 确保同一位置不会有重复引用
        UNIQUE(source_block_id, target_block_id, position),
        
        -- 外键约束
        FOREIGN KEY (source_block_id) REFERENCES blocks(id) ON DELETE CASCADE,
        FOREIGN KEY (target_block_id) REFERENCES blocks(id) ON DELETE CASCADE
      )
    `
  }

  /**
   * 获取创建块引用索引的SQL语句数组
   */
  static getCreateBlockReferenceIndexesSQL(): string[] {
    return [
      // 块引用表索引
      'CREATE INDEX IF NOT EXISTS idx_block_references_source ON block_references(source_block_id)',
      'CREATE INDEX IF NOT EXISTS idx_block_references_target ON block_references(target_block_id)',
      'CREATE INDEX IF NOT EXISTS idx_block_references_type ON block_references(reference_type)',
      'CREATE INDEX IF NOT EXISTS idx_block_references_created_at ON block_references(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_block_references_position ON block_references(source_block_id, position)',
      
      // 块表扩展索引
      'CREATE INDEX IF NOT EXISTS idx_blocks_type ON blocks(block_type)',
      'CREATE INDEX IF NOT EXISTS idx_blocks_reference_count ON blocks(reference_count DESC)',
      'CREATE INDEX IF NOT EXISTS idx_blocks_content_search ON blocks(content)',
      
      // 复合索引优化查询
      'CREATE INDEX IF NOT EXISTS idx_blocks_page_type_order ON blocks(page_id, block_type, "order")',
      'CREATE INDEX IF NOT EXISTS idx_block_references_source_type ON block_references(source_block_id, reference_type)'
    ]
  }

  /**
   * 获取创建块引用触发器的SQL语句数组
   * 用于自动维护块引用统计
   */
  static getCreateBlockReferenceTriggersSQL(): string[] {
    return [
      // 插入块引用时更新目标块的引用计数
      `
        CREATE TRIGGER IF NOT EXISTS trigger_block_references_insert_update_count
        AFTER INSERT ON block_references
        BEGIN
          UPDATE blocks 
          SET 
            reference_count = (
              SELECT COUNT(*) FROM block_references 
              WHERE target_block_id = NEW.target_block_id
            ),
            updated_at = NEW.created_at
          WHERE id = NEW.target_block_id;
        END
      `,
      
      // 删除块引用时更新目标块的引用计数
      `
        CREATE TRIGGER IF NOT EXISTS trigger_block_references_delete_update_count
        AFTER DELETE ON block_references
        BEGIN
          UPDATE blocks 
          SET 
            reference_count = (
              SELECT COUNT(*) FROM block_references 
              WHERE target_block_id = OLD.target_block_id
            ),
            updated_at = datetime('now')
          WHERE id = OLD.target_block_id;
        END
      `,
      
      // 块删除时清理相关引用
      `
        CREATE TRIGGER IF NOT EXISTS trigger_blocks_delete_cleanup_references
        AFTER DELETE ON blocks
        BEGIN
          DELETE FROM block_references 
          WHERE source_block_id = OLD.id OR target_block_id = OLD.id;
        END
      `
    ]
  }

  /**
   * 获取查询块的所有引用的SQL语句
   */
  static getBlockReferencesQuerySQL(): string {
    return `
      SELECT 
        br.id as reference_id,
        br.source_block_id,
        br.target_block_id,
        br.reference_type,
        br.context,
        br.position,
        br.created_at,
        sb.content as source_content,
        sb.block_type as source_type,
        sb.page_id as source_page_id,
        sp.name as source_page_name,
        tb.content as target_content,
        tb.block_type as target_type,
        tb.page_id as target_page_id,
        tp.name as target_page_name
      FROM block_references br
      JOIN blocks sb ON br.source_block_id = sb.id
      JOIN blocks tb ON br.target_block_id = tb.id
      JOIN pages sp ON sb.page_id = sp.id
      JOIN pages tp ON tb.page_id = tp.id
      WHERE br.target_block_id = ?
      ORDER BY br.created_at DESC
    `
  }

  /**
   * 获取查询块的反向链接的SQL语句
   */
  static getBlockBacklinksQuerySQL(): string {
    return `
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
  }

  /**
   * 获取查询页面所有块引用的SQL语句
   */
  static getPageBlockReferencesQuerySQL(): string {
    return `
      SELECT 
        br.id as reference_id,
        br.source_block_id,
        br.target_block_id,
        br.reference_type,
        br.context,
        br.position,
        br.created_at,
        sb.content as source_content,
        tb.content as target_content,
        tb.page_id as target_page_id,
        tp.name as target_page_name
      FROM block_references br
      JOIN blocks sb ON br.source_block_id = sb.id
      JOIN blocks tb ON br.target_block_id = tb.id
      JOIN pages tp ON tb.page_id = tp.id
      WHERE sb.page_id = ?
      ORDER BY sb."order" ASC, br.position ASC
    `
  }

  /**
   * 获取查询孤立块的SQL语句
   * 返回没有被任何其他块引用的块
   */
  static getOrphanBlocksQuerySQL(): string {
    return `
      SELECT 
        b.id,
        b.content,
        b.block_type,
        b.page_id,
        p.name as page_name,
        b.created_at
      FROM blocks b
      JOIN pages p ON b.page_id = p.id
      WHERE b.id NOT IN (
        SELECT DISTINCT target_block_id 
        FROM block_references
      )
      AND b.content != ''
      ORDER BY b.created_at DESC
    `
  }

  /**
   * 获取查询最多引用块的SQL语句
   */
  static getMostReferencedBlocksQuerySQL(): string {
    return `
      SELECT 
        b.id,
        b.content,
        b.block_type,
        b.page_id,
        p.name as page_name,
        b.reference_count,
        b.created_at
      FROM blocks b
      JOIN pages p ON b.page_id = p.id
      WHERE b.reference_count > 0
      ORDER BY b.reference_count DESC, b.created_at DESC
      LIMIT ?
    `
  }

  /**
   * 获取块引用统计的SQL语句
   */
  static getBlockReferenceStatsQuerySQL(): string {
    return `
      SELECT 
        COUNT(*) as total_blocks,
        COUNT(CASE WHEN reference_count > 0 THEN 1 END) as referenced_blocks,
        COALESCE(SUM(reference_count), 0) as total_references,
        COALESCE(AVG(CASE WHEN reference_count > 0 THEN reference_count END), 0) as average_references
      FROM blocks
    `
  }

  /**
   * 获取搜索块的SQL语句
   */
  static getSearchBlocksQuerySQL(): string {
    return `
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
      ORDER BY relevance_score DESC, b.reference_count DESC, b.created_at DESC
      LIMIT ?
    `
  }

  /**
   * 获取所有数据库初始化SQL语句
   */
  static getAllInitializationSQL(): string[] {
    return [
      ...this.getAlterBlocksTableSQL(),
      this.getCreateBlockReferencesTableSQL(),
      ...this.getCreateBlockReferenceIndexesSQL(),
      ...this.getCreateBlockReferenceTriggersSQL()
    ]
  }
}

export default BlockReferenceDatabaseSchema
