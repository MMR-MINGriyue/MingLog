/**
 * 双向链接数据库模型设计
 * 
 * 功能：
 * - 支持页面到页面的链接关系
 * - 支持块到块的引用关系
 * - 支持链接的上下文信息存储
 * - 提供高效的查询索引
 * - 支持链接的创建、更新、删除操作
 */

export interface LinkRecord {
  /** 链接唯一标识 */
  id: string
  /** 源类型：page | block */
  source_type: 'page' | 'block'
  /** 源ID */
  source_id: string
  /** 目标类型：page | block */
  target_type: 'page' | 'block'
  /** 目标ID */
  target_id: string
  /** 链接类型：page-reference | block-reference | alias */
  link_type: 'page-reference' | 'block-reference' | 'alias'
  /** 链接上下文文本 */
  context?: string
  /** 在源内容中的位置 */
  position?: number
  /** 显示文本（用于别名链接） */
  display_text?: string
  /** 创建时间 */
  created_at: string
  /** 更新时间 */
  updated_at: string
}

export interface PageReference {
  /** 页面ID */
  page_id: string
  /** 页面名称 */
  page_name: string
  /** 页面标题 */
  page_title?: string
  /** 引用次数 */
  reference_count: number
  /** 最后引用时间 */
  last_referenced_at: string
}

export interface BacklinkInfo {
  /** 链接ID */
  link_id: string
  /** 源页面/块信息 */
  source: {
    type: 'page' | 'block'
    id: string
    title?: string
    content?: string
  }
  /** 链接上下文 */
  context?: string
  /** 链接位置 */
  position?: number
  /** 显示文本 */
  display_text?: string
  /** 创建时间 */
  created_at: string
}

/**
 * 双向链接数据库模式定义
 */
export class LinkDatabaseSchema {
  /**
   * 获取创建链接表的SQL语句
   */
  static getCreateLinksTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY,
        source_type TEXT NOT NULL CHECK (source_type IN ('page', 'block')),
        source_id TEXT NOT NULL,
        target_type TEXT NOT NULL CHECK (target_type IN ('page', 'block')),
        target_id TEXT NOT NULL,
        link_type TEXT NOT NULL CHECK (link_type IN ('page-reference', 'block-reference', 'alias')),
        context TEXT,
        position INTEGER,
        display_text TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        
        -- 确保同一位置不会有重复链接
        UNIQUE(source_type, source_id, target_type, target_id, position),
        
        -- 外键约束
        FOREIGN KEY (source_id) REFERENCES pages(id) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES pages(id) ON DELETE CASCADE
      )
    `
  }

  /**
   * 获取创建页面引用统计表的SQL语句
   */
  static getCreatePageReferencesTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS page_references (
        page_id TEXT PRIMARY KEY,
        page_name TEXT NOT NULL,
        page_title TEXT,
        reference_count INTEGER DEFAULT 0,
        last_referenced_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
      )
    `
  }

  /**
   * 获取创建索引的SQL语句数组
   */
  static getCreateIndexesSQL(): string[] {
    return [
      // 链接表索引
      'CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_type, source_id)',
      'CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_type, target_id)',
      'CREATE INDEX IF NOT EXISTS idx_links_type ON links(link_type)',
      'CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_links_position ON links(source_id, position)',
      
      // 页面引用表索引
      'CREATE INDEX IF NOT EXISTS idx_page_references_name ON page_references(page_name)',
      'CREATE INDEX IF NOT EXISTS idx_page_references_count ON page_references(reference_count DESC)',
      'CREATE INDEX IF NOT EXISTS idx_page_references_last_ref ON page_references(last_referenced_at DESC)',
      
      // 复合索引用于常见查询
      'CREATE INDEX IF NOT EXISTS idx_links_source_target ON links(source_type, source_id, target_type, target_id)',
      'CREATE INDEX IF NOT EXISTS idx_links_target_source ON links(target_type, target_id, source_type, source_id)'
    ]
  }

  /**
   * 获取创建触发器的SQL语句数组
   * 用于自动维护页面引用统计
   */
  static getCreateTriggersSQL(): string[] {
    return [
      // 插入链接时更新引用统计
      `
        CREATE TRIGGER IF NOT EXISTS trigger_links_insert_update_refs
        AFTER INSERT ON links
        WHEN NEW.target_type = 'page'
        BEGIN
          INSERT OR REPLACE INTO page_references (
            page_id, page_name, page_title, reference_count, last_referenced_at, created_at, updated_at
          )
          SELECT 
            NEW.target_id,
            p.name,
            p.title,
            COALESCE((
              SELECT COUNT(*) FROM links 
              WHERE target_type = 'page' AND target_id = NEW.target_id
            ), 0),
            NEW.created_at,
            COALESCE(pr.created_at, NEW.created_at),
            NEW.created_at
          FROM pages p
          LEFT JOIN page_references pr ON pr.page_id = NEW.target_id
          WHERE p.id = NEW.target_id;
        END
      `,
      
      // 删除链接时更新引用统计
      `
        CREATE TRIGGER IF NOT EXISTS trigger_links_delete_update_refs
        AFTER DELETE ON links
        WHEN OLD.target_type = 'page'
        BEGIN
          UPDATE page_references 
          SET 
            reference_count = (
              SELECT COUNT(*) FROM links 
              WHERE target_type = 'page' AND target_id = OLD.target_id
            ),
            updated_at = datetime('now')
          WHERE page_id = OLD.target_id;
          
          -- 如果引用计数为0，删除记录
          DELETE FROM page_references 
          WHERE page_id = OLD.target_id AND reference_count = 0;
        END
      `,
      
      // 页面删除时清理引用记录
      `
        CREATE TRIGGER IF NOT EXISTS trigger_pages_delete_cleanup_refs
        AFTER DELETE ON pages
        BEGIN
          DELETE FROM page_references WHERE page_id = OLD.id;
        END
      `
    ]
  }

  /**
   * 获取完整的数据库初始化SQL语句
   */
  static getFullInitializationSQL(): string[] {
    return [
      this.getCreateLinksTableSQL(),
      this.getCreatePageReferencesTableSQL(),
      ...this.getCreateIndexesSQL(),
      ...this.getCreateTriggersSQL()
    ]
  }

  /**
   * 获取查询反向链接的SQL语句
   */
  static getBacklinksQuerySQL(): string {
    return `
      SELECT 
        l.id as link_id,
        l.source_type,
        l.source_id,
        l.context,
        l.position,
        l.display_text,
        l.created_at,
        CASE 
          WHEN l.source_type = 'page' THEN p.name
          WHEN l.source_type = 'block' THEN b.content
        END as source_title,
        CASE 
          WHEN l.source_type = 'page' THEN p.title
          WHEN l.source_type = 'block' THEN (
            SELECT p2.name FROM pages p2 WHERE p2.id = b.page_id
          )
        END as source_content
      FROM links l
      LEFT JOIN pages p ON l.source_type = 'page' AND l.source_id = p.id
      LEFT JOIN blocks b ON l.source_type = 'block' AND l.source_id = b.id
      WHERE l.target_type = ? AND l.target_id = ?
      ORDER BY l.created_at DESC
    `
  }

  /**
   * 获取查询页面所有链接的SQL语句
   */
  static getPageLinksQuerySQL(): string {
    return `
      SELECT 
        l.id as link_id,
        l.target_type,
        l.target_id,
        l.link_type,
        l.context,
        l.position,
        l.display_text,
        l.created_at,
        CASE 
          WHEN l.target_type = 'page' THEN p.name
          WHEN l.target_type = 'block' THEN b.content
        END as target_title,
        CASE 
          WHEN l.target_type = 'page' THEN p.title
          WHEN l.target_type = 'block' THEN (
            SELECT p2.name FROM pages p2 WHERE p2.id = b.page_id
          )
        END as target_content
      FROM links l
      LEFT JOIN pages p ON l.target_type = 'page' AND l.target_id = p.id
      LEFT JOIN blocks b ON l.target_type = 'block' AND l.target_id = b.id
      WHERE l.source_type = ? AND l.source_id = ?
      ORDER BY l.position ASC, l.created_at ASC
    `
  }

  /**
   * 获取查询热门页面的SQL语句
   */
  static getPopularPagesQuerySQL(): string {
    return `
      SELECT 
        pr.page_id,
        pr.page_name,
        pr.page_title,
        pr.reference_count,
        pr.last_referenced_at
      FROM page_references pr
      WHERE pr.reference_count > 0
      ORDER BY pr.reference_count DESC, pr.last_referenced_at DESC
      LIMIT ?
    `
  }

  /**
   * 获取查询孤立页面的SQL语句
   */
  static getOrphanPagesQuerySQL(): string {
    return `
      SELECT 
        p.id,
        p.name,
        p.title,
        p.created_at
      FROM pages p
      LEFT JOIN page_references pr ON p.id = pr.page_id
      WHERE pr.page_id IS NULL OR pr.reference_count = 0
      ORDER BY p.created_at DESC
    `
  }
}

export default LinkDatabaseSchema
