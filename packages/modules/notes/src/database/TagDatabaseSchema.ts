/**
 * 标签数据库模式
 * 
 * 功能：
 * - 层级标签结构支持
 * - 标签与笔记的多对多关系
 * - 标签统计和使用频率
 * - 标签颜色和图标自定义
 * - 标签搜索和过滤
 */

export interface Tag {
  /** 标签ID */
  id: string
  /** 标签名称 */
  name: string
  /** 标签描述 */
  description?: string
  /** 父标签ID（支持层级结构） */
  parent_id?: string
  /** 标签颜色 */
  color?: string
  /** 标签图标 */
  icon?: string
  /** 排序顺序 */
  sort_order: number
  /** 使用次数 */
  usage_count: number
  /** 是否为系统标签 */
  is_system: boolean
  /** 是否启用 */
  is_active: boolean
  /** 创建时间 */
  created_at: string
  /** 修改时间 */
  updated_at: string
  /** 创建者 */
  created_by?: string
}

export interface NoteTag {
  /** 关联ID */
  id: string
  /** 笔记ID */
  note_id: string
  /** 标签ID */
  tag_id: string
  /** 添加时间 */
  created_at: string
  /** 添加者 */
  created_by?: string
}

export interface TagHierarchy {
  /** 标签ID */
  tag_id: string
  /** 祖先标签ID */
  ancestor_id: string
  /** 层级深度 */
  depth: number
  /** 路径（用于快速查询） */
  path: string
}

export interface TagStats {
  /** 标签ID */
  tag_id: string
  /** 使用次数 */
  usage_count: number
  /** 关联笔记数 */
  note_count: number
  /** 子标签数 */
  child_count: number
  /** 最后使用时间 */
  last_used_at?: string
  /** 统计更新时间 */
  updated_at: string
}

export interface TagSuggestion {
  /** 建议ID */
  id: string
  /** 建议的标签名 */
  suggested_name: string
  /** 建议来源 */
  source: 'content' | 'similar' | 'frequency' | 'ai'
  /** 置信度 */
  confidence: number
  /** 相关笔记ID */
  note_id?: string
  /** 创建时间 */
  created_at: string
}

export class TagDatabaseSchema {
  /**
   * 创建标签相关表的SQL语句
   */
  static getCreateTableStatements(): string[] {
    return [
      // 标签主表
      `CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        parent_id TEXT,
        color TEXT DEFAULT '#6B7280',
        icon TEXT,
        sort_order INTEGER DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        is_system BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_by TEXT,
        FOREIGN KEY (parent_id) REFERENCES tags(id) ON DELETE SET NULL
      )`,

      // 笔记标签关联表
      `CREATE TABLE IF NOT EXISTS note_tags (
        id TEXT PRIMARY KEY,
        note_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_by TEXT,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
        UNIQUE(note_id, tag_id)
      )`,

      // 标签层级关系表（用于快速查询层级结构）
      `CREATE TABLE IF NOT EXISTS tag_hierarchy (
        tag_id TEXT NOT NULL,
        ancestor_id TEXT NOT NULL,
        depth INTEGER NOT NULL,
        path TEXT NOT NULL,
        PRIMARY KEY (tag_id, ancestor_id),
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
        FOREIGN KEY (ancestor_id) REFERENCES tags(id) ON DELETE CASCADE
      )`,

      // 标签统计表
      `CREATE TABLE IF NOT EXISTS tag_stats (
        tag_id TEXT PRIMARY KEY,
        usage_count INTEGER DEFAULT 0,
        note_count INTEGER DEFAULT 0,
        child_count INTEGER DEFAULT 0,
        last_used_at TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )`,

      // 标签建议表
      `CREATE TABLE IF NOT EXISTS tag_suggestions (
        id TEXT PRIMARY KEY,
        suggested_name TEXT NOT NULL,
        source TEXT NOT NULL CHECK (source IN ('content', 'similar', 'frequency', 'ai')),
        confidence REAL DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
        note_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      )`
    ]
  }

  /**
   * 创建索引的SQL语句
   */
  static getCreateIndexStatements(): string[] {
    return [
      // 标签表索引
      'CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)',
      'CREATE INDEX IF NOT EXISTS idx_tags_parent_id ON tags(parent_id)',
      'CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC)',
      'CREATE INDEX IF NOT EXISTS idx_tags_is_active ON tags(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_tags_created_at ON tags(created_at)',

      // 笔记标签关联表索引
      'CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id)',
      'CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id)',
      'CREATE INDEX IF NOT EXISTS idx_note_tags_created_at ON note_tags(created_at)',

      // 标签层级表索引
      'CREATE INDEX IF NOT EXISTS idx_tag_hierarchy_tag_id ON tag_hierarchy(tag_id)',
      'CREATE INDEX IF NOT EXISTS idx_tag_hierarchy_ancestor_id ON tag_hierarchy(ancestor_id)',
      'CREATE INDEX IF NOT EXISTS idx_tag_hierarchy_depth ON tag_hierarchy(depth)',
      'CREATE INDEX IF NOT EXISTS idx_tag_hierarchy_path ON tag_hierarchy(path)',

      // 标签统计表索引
      'CREATE INDEX IF NOT EXISTS idx_tag_stats_usage_count ON tag_stats(usage_count DESC)',
      'CREATE INDEX IF NOT EXISTS idx_tag_stats_note_count ON tag_stats(note_count DESC)',
      'CREATE INDEX IF NOT EXISTS idx_tag_stats_last_used ON tag_stats(last_used_at DESC)',

      // 标签建议表索引
      'CREATE INDEX IF NOT EXISTS idx_tag_suggestions_note_id ON tag_suggestions(note_id)',
      'CREATE INDEX IF NOT EXISTS idx_tag_suggestions_confidence ON tag_suggestions(confidence DESC)',
      'CREATE INDEX IF NOT EXISTS idx_tag_suggestions_source ON tag_suggestions(source)',
      'CREATE INDEX IF NOT EXISTS idx_tag_suggestions_created_at ON tag_suggestions(created_at DESC)'
    ]
  }

  /**
   * 创建触发器的SQL语句
   */
  static getCreateTriggerStatements(): string[] {
    return [
      // 标签创建时更新层级关系
      `CREATE TRIGGER IF NOT EXISTS trigger_tag_insert_hierarchy
       AFTER INSERT ON tags
       BEGIN
         -- 为自己添加层级记录（深度为0）
         INSERT INTO tag_hierarchy (tag_id, ancestor_id, depth, path)
         VALUES (NEW.id, NEW.id, 0, NEW.id);
         
         -- 如果有父标签，添加所有祖先的层级关系
         INSERT INTO tag_hierarchy (tag_id, ancestor_id, depth, path)
         SELECT NEW.id, th.ancestor_id, th.depth + 1, th.path || '/' || NEW.id
         FROM tag_hierarchy th
         WHERE th.tag_id = NEW.parent_id AND NEW.parent_id IS NOT NULL;
         
         -- 初始化统计记录
         INSERT INTO tag_stats (tag_id, usage_count, note_count, child_count)
         VALUES (NEW.id, 0, 0, 0);
         
         -- 更新父标签的子标签计数
         UPDATE tag_stats 
         SET child_count = child_count + 1,
             updated_at = datetime('now')
         WHERE tag_id = NEW.parent_id AND NEW.parent_id IS NOT NULL;
       END`,

      // 标签删除时清理层级关系
      `CREATE TRIGGER IF NOT EXISTS trigger_tag_delete_hierarchy
       BEFORE DELETE ON tags
       BEGIN
         -- 删除所有相关的层级关系
         DELETE FROM tag_hierarchy WHERE tag_id = OLD.id OR ancestor_id = OLD.id;
         
         -- 更新父标签的子标签计数
         UPDATE tag_stats 
         SET child_count = child_count - 1,
             updated_at = datetime('now')
         WHERE tag_id = OLD.parent_id AND OLD.parent_id IS NOT NULL;
         
         -- 将子标签的父标签设为当前标签的父标签
         UPDATE tags 
         SET parent_id = OLD.parent_id,
             updated_at = datetime('now')
         WHERE parent_id = OLD.id;
       END`,

      // 标签使用时更新统计
      `CREATE TRIGGER IF NOT EXISTS trigger_note_tag_insert_stats
       AFTER INSERT ON note_tags
       BEGIN
         -- 更新标签使用统计
         UPDATE tags 
         SET usage_count = usage_count + 1,
             updated_at = datetime('now')
         WHERE id = NEW.tag_id;
         
         UPDATE tag_stats 
         SET usage_count = usage_count + 1,
             note_count = (SELECT COUNT(*) FROM note_tags WHERE tag_id = NEW.tag_id),
             last_used_at = datetime('now'),
             updated_at = datetime('now')
         WHERE tag_id = NEW.tag_id;
       END`,

      // 标签移除时更新统计
      `CREATE TRIGGER IF NOT EXISTS trigger_note_tag_delete_stats
       AFTER DELETE ON note_tags
       BEGIN
         -- 更新标签使用统计
         UPDATE tags 
         SET usage_count = CASE 
           WHEN usage_count > 0 THEN usage_count - 1 
           ELSE 0 
         END,
         updated_at = datetime('now')
         WHERE id = OLD.tag_id;
         
         UPDATE tag_stats 
         SET usage_count = CASE 
           WHEN usage_count > 0 THEN usage_count - 1 
           ELSE 0 
         END,
         note_count = (SELECT COUNT(*) FROM note_tags WHERE tag_id = OLD.tag_id),
         updated_at = datetime('now')
         WHERE tag_id = OLD.tag_id;
       END`,

      // 标签更新时间触发器
      `CREATE TRIGGER IF NOT EXISTS trigger_tags_update_timestamp
       AFTER UPDATE ON tags
       BEGIN
         UPDATE tags SET updated_at = datetime('now') WHERE id = NEW.id;
       END`
    ]
  }

  /**
   * 获取标签查询的SQL语句
   */
  static getTagQueries() {
    return {
      // 获取所有根标签
      getRootTags: `
        SELECT * FROM tags 
        WHERE parent_id IS NULL AND is_active = TRUE
        ORDER BY sort_order ASC, name ASC
      `,

      // 获取标签的子标签
      getChildTags: `
        SELECT * FROM tags 
        WHERE parent_id = ? AND is_active = TRUE
        ORDER BY sort_order ASC, name ASC
      `,

      // 获取标签的完整层级路径
      getTagPath: `
        SELECT t.id, t.name, th.depth
        FROM tags t
        JOIN tag_hierarchy th ON t.id = th.ancestor_id
        WHERE th.tag_id = ?
        ORDER BY th.depth ASC
      `,

      // 获取标签的所有后代
      getTagDescendants: `
        SELECT t.*, th.depth
        FROM tags t
        JOIN tag_hierarchy th ON t.id = th.tag_id
        WHERE th.ancestor_id = ? AND th.depth > 0
        ORDER BY th.depth ASC, t.sort_order ASC, t.name ASC
      `,

      // 获取笔记的所有标签
      getNoteTagsWithHierarchy: `
        SELECT t.*, th.path
        FROM tags t
        JOIN note_tags nt ON t.id = nt.tag_id
        LEFT JOIN tag_hierarchy th ON t.id = th.tag_id AND th.depth = 0
        WHERE nt.note_id = ? AND t.is_active = TRUE
        ORDER BY t.sort_order ASC, t.name ASC
      `,

      // 搜索标签
      searchTags: `
        SELECT t.*, ts.usage_count, ts.note_count
        FROM tags t
        LEFT JOIN tag_stats ts ON t.id = ts.tag_id
        WHERE t.name LIKE ? AND t.is_active = TRUE
        ORDER BY ts.usage_count DESC, t.name ASC
        LIMIT ?
      `,

      // 获取热门标签
      getPopularTags: `
        SELECT t.*, ts.usage_count, ts.note_count
        FROM tags t
        JOIN tag_stats ts ON t.id = ts.tag_id
        WHERE t.is_active = TRUE
        ORDER BY ts.usage_count DESC, ts.note_count DESC
        LIMIT ?
      `,

      // 获取最近使用的标签
      getRecentTags: `
        SELECT t.*, ts.last_used_at
        FROM tags t
        JOIN tag_stats ts ON t.id = ts.tag_id
        WHERE t.is_active = TRUE AND ts.last_used_at IS NOT NULL
        ORDER BY ts.last_used_at DESC
        LIMIT ?
      `,

      // 获取标签建议
      getTagSuggestions: `
        SELECT * FROM tag_suggestions
        WHERE note_id = ?
        ORDER BY confidence DESC, created_at DESC
        LIMIT ?
      `,

      // 获取相似标签
      getSimilarTags: `
        SELECT t.*, ts.usage_count,
               (CASE 
                 WHEN t.name LIKE ? || '%' THEN 3
                 WHEN t.name LIKE '%' || ? || '%' THEN 2
                 ELSE 1
               END) as similarity_score
        FROM tags t
        LEFT JOIN tag_stats ts ON t.id = ts.tag_id
        WHERE t.name LIKE '%' || ? || '%' AND t.is_active = TRUE
        ORDER BY similarity_score DESC, ts.usage_count DESC
        LIMIT ?
      `
    }
  }

  /**
   * 获取标签管理的辅助函数SQL
   */
  static getTagManagementQueries() {
    return {
      // 批量添加标签到笔记
      addTagsToNote: `
        INSERT OR IGNORE INTO note_tags (id, note_id, tag_id, created_by)
        VALUES (?, ?, ?, ?)
      `,

      // 批量移除笔记的标签
      removeTagsFromNote: `
        DELETE FROM note_tags 
        WHERE note_id = ? AND tag_id IN (SELECT value FROM json_each(?))
      `,

      // 替换笔记的所有标签
      replaceNoteTags: `
        DELETE FROM note_tags WHERE note_id = ?;
        INSERT INTO note_tags (id, note_id, tag_id, created_by)
        SELECT ?, ?, value, ? FROM json_each(?)
      `,

      // 合并标签（将源标签的所有关联转移到目标标签）
      mergeTags: `
        UPDATE note_tags 
        SET tag_id = ?, created_at = datetime('now')
        WHERE tag_id = ? AND NOT EXISTS (
          SELECT 1 FROM note_tags nt2 
          WHERE nt2.note_id = note_tags.note_id AND nt2.tag_id = ?
        )
      `,

      // 重新计算标签统计
      recalculateTagStats: `
        UPDATE tag_stats 
        SET usage_count = (
          SELECT COUNT(*) FROM note_tags WHERE tag_id = tag_stats.tag_id
        ),
        note_count = (
          SELECT COUNT(DISTINCT note_id) FROM note_tags WHERE tag_id = tag_stats.tag_id
        ),
        child_count = (
          SELECT COUNT(*) FROM tags WHERE parent_id = tag_stats.tag_id
        ),
        updated_at = datetime('now')
        WHERE tag_id = ?
      `
    }
  }
}

export default TagDatabaseSchema
