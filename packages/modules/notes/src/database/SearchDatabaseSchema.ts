/**
 * 搜索数据库模式
 * 
 * 功能：
 * - 基于SQLite FTS5的全文搜索
 * - 支持多种文档类型索引
 * - 中文分词支持
 * - 相关性排序
 * - 实时索引更新
 */

export interface SearchDocument {
  /** 文档ID */
  id: string
  /** 文档类型 */
  type: 'note' | 'block' | 'tag' | 'link'
  /** 标题 */
  title: string
  /** 内容 */
  content: string
  /** 标签（空格分隔） */
  tags: string
  /** 所属页面ID */
  page_id?: string
  /** 创建时间 */
  created_at: string
  /** 修改时间 */
  updated_at: string
  /** 作者 */
  author?: string
  /** 文档路径 */
  path?: string
  /** 相关性分数（搜索时计算） */
  rank?: number
}

export interface SearchQuery {
  /** 搜索关键词 */
  query: string
  /** 文档类型过滤 */
  types?: string[]
  /** 标签过滤 */
  tags?: string[]
  /** 页面ID过滤 */
  page_ids?: string[]
  /** 日期范围过滤 */
  date_range?: {
    start?: string
    end?: string
  }
  /** 作者过滤 */
  authors?: string[]
  /** 排序方式 */
  sort_by?: 'relevance' | 'created_at' | 'updated_at' | 'title'
  /** 排序方向 */
  sort_order?: 'asc' | 'desc'
  /** 分页限制 */
  limit?: number
  /** 分页偏移 */
  offset?: number
}

export interface SearchResult {
  /** 搜索文档 */
  document: SearchDocument
  /** 相关性分数 */
  score: number
  /** 高亮片段 */
  highlights: string[]
  /** 匹配的字段 */
  matched_fields: string[]
}

export interface SearchStats {
  /** 总结果数 */
  total_count: number
  /** 搜索耗时（毫秒） */
  search_time: number
  /** 按类型分组的结果数 */
  type_counts: Record<string, number>
  /** 建议的相关搜索 */
  suggestions: string[]
}

export class SearchDatabaseSchema {
  /**
   * 创建搜索相关表的SQL语句
   */
  static getCreateTableStatements(): string[] {
    return [
      // 创建FTS5虚拟表用于全文搜索
      `CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
        id UNINDEXED,
        type UNINDEXED,
        title,
        content,
        tags,
        page_id UNINDEXED,
        created_at UNINDEXED,
        updated_at UNINDEXED,
        author,
        path,
        tokenize = 'unicode61 remove_diacritics 1'
      )`,

      // 创建搜索历史表
      `CREATE TABLE IF NOT EXISTS search_history (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        filters TEXT, -- JSON格式的过滤条件
        result_count INTEGER DEFAULT 0,
        search_time INTEGER DEFAULT 0, -- 搜索耗时（毫秒）
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        user_id TEXT
      )`,

      // 创建搜索统计表
      `CREATE TABLE IF NOT EXISTS search_stats (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        total_searches INTEGER DEFAULT 1,
        avg_result_count REAL DEFAULT 0,
        avg_search_time REAL DEFAULT 0,
        last_searched_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,

      // 创建搜索建议表
      `CREATE TABLE IF NOT EXISTS search_suggestions (
        id TEXT PRIMARY KEY,
        suggestion TEXT NOT NULL UNIQUE,
        frequency INTEGER DEFAULT 1,
        category TEXT, -- 'query', 'tag', 'author', etc.
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    ]
  }

  /**
   * 创建索引的SQL语句
   */
  static getCreateIndexStatements(): string[] {
    return [
      // 搜索历史索引
      'CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query)',
      'CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id)',

      // 搜索统计索引
      'CREATE INDEX IF NOT EXISTS idx_search_stats_query ON search_stats(query)',
      'CREATE INDEX IF NOT EXISTS idx_search_stats_frequency ON search_stats(total_searches)',
      'CREATE INDEX IF NOT EXISTS idx_search_stats_last_searched ON search_stats(last_searched_at)',

      // 搜索建议索引
      'CREATE INDEX IF NOT EXISTS idx_search_suggestions_suggestion ON search_suggestions(suggestion)',
      'CREATE INDEX IF NOT EXISTS idx_search_suggestions_frequency ON search_suggestions(frequency)',
      'CREATE INDEX IF NOT EXISTS idx_search_suggestions_category ON search_suggestions(category)'
    ]
  }

  /**
   * 创建触发器的SQL语句
   */
  static getCreateTriggerStatements(): string[] {
    return [
      // 当笔记创建时自动添加到搜索索引
      `CREATE TRIGGER IF NOT EXISTS trigger_note_insert_search
       AFTER INSERT ON notes
       BEGIN
         INSERT INTO search_index (id, type, title, content, tags, page_id, created_at, updated_at, author, path)
         VALUES (
           NEW.id,
           'note',
           NEW.title,
           NEW.content,
           COALESCE(NEW.tags, ''),
           NEW.id,
           NEW.created_at,
           NEW.updated_at,
           NEW.author,
           NEW.title
         );
       END`,

      // 当笔记更新时更新搜索索引
      `CREATE TRIGGER IF NOT EXISTS trigger_note_update_search
       AFTER UPDATE ON notes
       BEGIN
         UPDATE search_index 
         SET 
           title = NEW.title,
           content = NEW.content,
           tags = COALESCE(NEW.tags, ''),
           updated_at = NEW.updated_at,
           author = NEW.author,
           path = NEW.title
         WHERE id = NEW.id AND type = 'note';
       END`,

      // 当笔记删除时从搜索索引中移除
      `CREATE TRIGGER IF NOT EXISTS trigger_note_delete_search
       AFTER DELETE ON notes
       BEGIN
         DELETE FROM search_index WHERE id = OLD.id AND type = 'note';
       END`,

      // 当块引用创建时添加到搜索索引
      `CREATE TRIGGER IF NOT EXISTS trigger_block_insert_search
       AFTER INSERT ON block_references
       BEGIN
         INSERT INTO search_index (id, type, title, content, tags, page_id, created_at, updated_at, path)
         VALUES (
           NEW.id,
           'block',
           'Block ' || substr(NEW.id, 1, 8),
           NEW.content,
           '',
           NEW.page_id,
           NEW.created_at,
           NEW.updated_at,
           'blocks/' || NEW.page_id || '#' || NEW.id
         );
       END`,

      // 当块引用更新时更新搜索索引
      `CREATE TRIGGER IF NOT EXISTS trigger_block_update_search
       AFTER UPDATE ON block_references
       BEGIN
         UPDATE search_index 
         SET 
           content = NEW.content,
           updated_at = NEW.updated_at
         WHERE id = NEW.id AND type = 'block';
       END`,

      // 当块引用删除时从搜索索引中移除
      `CREATE TRIGGER IF NOT EXISTS trigger_block_delete_search
       AFTER DELETE ON block_references
       BEGIN
         DELETE FROM search_index WHERE id = OLD.id AND type = 'block';
       END`,

      // 更新搜索统计的触发器
      `CREATE TRIGGER IF NOT EXISTS trigger_update_search_stats
       AFTER INSERT ON search_history
       BEGIN
         INSERT OR REPLACE INTO search_stats (
           id, query, total_searches, avg_result_count, avg_search_time, last_searched_at
         )
         VALUES (
           'stats_' || NEW.query,
           NEW.query,
           COALESCE((SELECT total_searches FROM search_stats WHERE query = NEW.query), 0) + 1,
           (
             SELECT AVG(result_count) 
             FROM search_history 
             WHERE query = NEW.query
           ),
           (
             SELECT AVG(search_time) 
             FROM search_history 
             WHERE query = NEW.query
           ),
           NEW.created_at
         );
       END`
    ]
  }

  /**
   * 获取搜索查询的SQL语句
   */
  static getSearchQueries() {
    return {
      // 基础全文搜索
      basicSearch: `
        SELECT 
          id, type, title, content, tags, page_id, created_at, updated_at, author, path,
          bm25(search_index) as rank
        FROM search_index 
        WHERE search_index MATCH ?
        ORDER BY rank
        LIMIT ? OFFSET ?
      `,

      // 带过滤条件的搜索
      filteredSearch: `
        SELECT 
          id, type, title, content, tags, page_id, created_at, updated_at, author, path,
          bm25(search_index) as rank
        FROM search_index 
        WHERE search_index MATCH ?
          AND (? IS NULL OR type IN (SELECT value FROM json_each(?)))
          AND (? IS NULL OR page_id IN (SELECT value FROM json_each(?)))
          AND (? IS NULL OR created_at >= ?)
          AND (? IS NULL OR created_at <= ?)
        ORDER BY 
          CASE WHEN ? = 'relevance' THEN rank END,
          CASE WHEN ? = 'created_at' AND ? = 'desc' THEN created_at END DESC,
          CASE WHEN ? = 'created_at' AND ? = 'asc' THEN created_at END ASC,
          CASE WHEN ? = 'updated_at' AND ? = 'desc' THEN updated_at END DESC,
          CASE WHEN ? = 'updated_at' AND ? = 'asc' THEN updated_at END ASC,
          CASE WHEN ? = 'title' AND ? = 'desc' THEN title END DESC,
          CASE WHEN ? = 'title' AND ? = 'asc' THEN title END ASC
        LIMIT ? OFFSET ?
      `,

      // 搜索建议查询
      searchSuggestions: `
        SELECT suggestion, frequency, category
        FROM search_suggestions
        WHERE suggestion LIKE ? || '%'
        ORDER BY frequency DESC, suggestion ASC
        LIMIT ?
      `,

      // 热门搜索查询
      popularSearches: `
        SELECT query, total_searches, last_searched_at
        FROM search_stats
        ORDER BY total_searches DESC, last_searched_at DESC
        LIMIT ?
      `,

      // 搜索历史查询
      searchHistory: `
        SELECT query, result_count, search_time, created_at
        FROM search_history
        WHERE user_id = ? OR user_id IS NULL
        ORDER BY created_at DESC
        LIMIT ?
      `,

      // 获取搜索统计
      searchStatsQuery: `
        SELECT 
          COUNT(*) as total_count,
          COUNT(DISTINCT type) as type_count,
          type,
          COUNT(*) as count_by_type
        FROM search_index
        WHERE search_index MATCH ?
        GROUP BY type
      `
    }
  }

  /**
   * 获取中文分词相关的辅助函数
   */
  static getChineseTokenizerHelpers() {
    return {
      // 简单的中文分词函数（基于常见分隔符）
      simpleChineseTokenize: `
        CREATE OR REPLACE FUNCTION simple_chinese_tokenize(text TEXT) 
        RETURNS TEXT AS $$
        BEGIN
          -- 简单的中文分词：在中文字符间添加空格
          RETURN regexp_replace(text, '([\\u4e00-\\u9fff])([\\u4e00-\\u9fff])', '\\1 \\2', 'g');
        END;
        $$ LANGUAGE plpgsql;
      `,

      // 预处理搜索查询
      preprocessQuery: `
        CREATE OR REPLACE FUNCTION preprocess_search_query(query TEXT)
        RETURNS TEXT AS $$
        BEGIN
          -- 移除特殊字符，处理引号
          query := regexp_replace(query, '[^\\w\\s\\u4e00-\\u9fff"'']', ' ', 'g');
          -- 处理多个空格
          query := regexp_replace(query, '\\s+', ' ', 'g');
          -- 去除首尾空格
          query := trim(query);
          RETURN query;
        END;
        $$ LANGUAGE plpgsql;
      `
    }
  }
}

export default SearchDatabaseSchema
