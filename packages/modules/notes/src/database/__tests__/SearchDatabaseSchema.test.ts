import { describe, it, expect } from 'vitest'
import { SearchDatabaseSchema } from '../SearchDatabaseSchema'

describe('SearchDatabaseSchema', () => {
  describe('表创建语句', () => {
    it('应该生成正确的FTS5虚拟表创建语句', () => {
      const statements = SearchDatabaseSchema.getCreateTableStatements()
      const ftsStatement = statements.find(stmt => stmt.includes('search_index USING fts5'))
      
      expect(ftsStatement).toBeDefined()
      expect(ftsStatement).toContain('CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5')
      expect(ftsStatement).toContain('id UNINDEXED')
      expect(ftsStatement).toContain('type UNINDEXED')
      expect(ftsStatement).toContain('title')
      expect(ftsStatement).toContain('content')
      expect(ftsStatement).toContain('tags')
      expect(ftsStatement).toContain('tokenize = \'unicode61 remove_diacritics 1\'')
    })

    it('应该生成搜索历史表创建语句', () => {
      const statements = SearchDatabaseSchema.getCreateTableStatements()
      const historyStatement = statements.find(stmt => stmt.includes('search_history'))
      
      expect(historyStatement).toBeDefined()
      expect(historyStatement).toContain('CREATE TABLE IF NOT EXISTS search_history')
      expect(historyStatement).toContain('id TEXT PRIMARY KEY')
      expect(historyStatement).toContain('query TEXT NOT NULL')
      expect(historyStatement).toContain('filters TEXT')
      expect(historyStatement).toContain('result_count INTEGER DEFAULT 0')
      expect(historyStatement).toContain('search_time INTEGER DEFAULT 0')
    })

    it('应该生成搜索统计表创建语句', () => {
      const statements = SearchDatabaseSchema.getCreateTableStatements()
      const statsStatement = statements.find(stmt => stmt.includes('search_stats'))
      
      expect(statsStatement).toBeDefined()
      expect(statsStatement).toContain('CREATE TABLE IF NOT EXISTS search_stats')
      expect(statsStatement).toContain('total_searches INTEGER DEFAULT 1')
      expect(statsStatement).toContain('avg_result_count REAL DEFAULT 0')
      expect(statsStatement).toContain('avg_search_time REAL DEFAULT 0')
    })

    it('应该生成搜索建议表创建语句', () => {
      const statements = SearchDatabaseSchema.getCreateTableStatements()
      const suggestionsStatement = statements.find(stmt => stmt.includes('search_suggestions'))
      
      expect(suggestionsStatement).toBeDefined()
      expect(suggestionsStatement).toContain('CREATE TABLE IF NOT EXISTS search_suggestions')
      expect(suggestionsStatement).toContain('suggestion TEXT NOT NULL UNIQUE')
      expect(suggestionsStatement).toContain('frequency INTEGER DEFAULT 1')
      expect(suggestionsStatement).toContain('category TEXT')
    })

    it('应该生成所有必需的表', () => {
      const statements = SearchDatabaseSchema.getCreateTableStatements()
      
      expect(statements).toHaveLength(4)
      expect(statements.some(stmt => stmt.includes('search_index'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('search_history'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('search_stats'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('search_suggestions'))).toBe(true)
    })
  })

  describe('索引创建语句', () => {
    it('应该生成搜索历史索引', () => {
      const statements = SearchDatabaseSchema.getCreateIndexStatements()
      
      expect(statements.some(stmt => stmt.includes('idx_search_history_query'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_search_history_created_at'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_search_history_user_id'))).toBe(true)
    })

    it('应该生成搜索统计索引', () => {
      const statements = SearchDatabaseSchema.getCreateIndexStatements()
      
      expect(statements.some(stmt => stmt.includes('idx_search_stats_query'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_search_stats_frequency'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_search_stats_last_searched'))).toBe(true)
    })

    it('应该生成搜索建议索引', () => {
      const statements = SearchDatabaseSchema.getCreateIndexStatements()
      
      expect(statements.some(stmt => stmt.includes('idx_search_suggestions_suggestion'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_search_suggestions_frequency'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_search_suggestions_category'))).toBe(true)
    })

    it('应该生成正确数量的索引', () => {
      const statements = SearchDatabaseSchema.getCreateIndexStatements()
      expect(statements).toHaveLength(9)
    })
  })

  describe('触发器创建语句', () => {
    it('应该生成笔记相关的触发器', () => {
      const statements = SearchDatabaseSchema.getCreateTriggerStatements()
      
      expect(statements.some(stmt => stmt.includes('trigger_note_insert_search'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('trigger_note_update_search'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('trigger_note_delete_search'))).toBe(true)
    })

    it('应该生成块引用相关的触发器', () => {
      const statements = SearchDatabaseSchema.getCreateTriggerStatements()
      
      expect(statements.some(stmt => stmt.includes('trigger_block_insert_search'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('trigger_block_update_search'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('trigger_block_delete_search'))).toBe(true)
    })

    it('应该生成搜索统计更新触发器', () => {
      const statements = SearchDatabaseSchema.getCreateTriggerStatements()
      
      expect(statements.some(stmt => stmt.includes('trigger_update_search_stats'))).toBe(true)
    })

    it('应该在触发器中正确处理搜索索引', () => {
      const statements = SearchDatabaseSchema.getCreateTriggerStatements()
      const insertTrigger = statements.find(stmt => stmt.includes('trigger_note_insert_search'))
      
      expect(insertTrigger).toContain('INSERT INTO search_index')
      expect(insertTrigger).toContain('NEW.id')
      expect(insertTrigger).toContain('\'note\'')
      expect(insertTrigger).toContain('NEW.title')
      expect(insertTrigger).toContain('NEW.content')
    })
  })

  describe('搜索查询语句', () => {
    it('应该提供基础搜索查询', () => {
      const queries = SearchDatabaseSchema.getSearchQueries()
      
      expect(queries.basicSearch).toBeDefined()
      expect(queries.basicSearch).toContain('SELECT')
      expect(queries.basicSearch).toContain('FROM search_index')
      expect(queries.basicSearch).toContain('WHERE search_index MATCH ?')
      expect(queries.basicSearch).toContain('bm25(search_index) as rank')
      expect(queries.basicSearch).toContain('ORDER BY rank')
    })

    it('应该提供过滤搜索查询', () => {
      const queries = SearchDatabaseSchema.getSearchQueries()
      
      expect(queries.filteredSearch).toBeDefined()
      expect(queries.filteredSearch).toContain('WHERE search_index MATCH ?')
      expect(queries.filteredSearch).toContain('AND (? IS NULL OR type IN')
      expect(queries.filteredSearch).toContain('AND (? IS NULL OR page_id IN')
      expect(queries.filteredSearch).toContain('AND (? IS NULL OR created_at >=')
    })

    it('应该提供搜索建议查询', () => {
      const queries = SearchDatabaseSchema.getSearchQueries()
      
      expect(queries.searchSuggestions).toBeDefined()
      expect(queries.searchSuggestions).toContain('FROM search_suggestions')
      expect(queries.searchSuggestions).toContain('WHERE suggestion LIKE ? || \'%\'')
      expect(queries.searchSuggestions).toContain('ORDER BY frequency DESC')
    })

    it('应该提供热门搜索查询', () => {
      const queries = SearchDatabaseSchema.getSearchQueries()
      
      expect(queries.popularSearches).toBeDefined()
      expect(queries.popularSearches).toContain('FROM search_stats')
      expect(queries.popularSearches).toContain('ORDER BY total_searches DESC')
    })

    it('应该提供搜索历史查询', () => {
      const queries = SearchDatabaseSchema.getSearchQueries()
      
      expect(queries.searchHistory).toBeDefined()
      expect(queries.searchHistory).toContain('FROM search_history')
      expect(queries.searchHistory).toContain('WHERE user_id = ? OR user_id IS NULL')
      expect(queries.searchHistory).toContain('ORDER BY created_at DESC')
    })

    it('应该提供搜索统计查询', () => {
      const queries = SearchDatabaseSchema.getSearchQueries()
      
      expect(queries.searchStatsQuery).toBeDefined()
      expect(queries.searchStatsQuery).toContain('COUNT(*) as total_count')
      expect(queries.searchStatsQuery).toContain('GROUP BY type')
    })
  })

  describe('中文分词辅助函数', () => {
    it('应该提供中文分词相关的辅助函数', () => {
      const helpers = SearchDatabaseSchema.getChineseTokenizerHelpers()
      
      expect(helpers.simpleChineseTokenize).toBeDefined()
      expect(helpers.preprocessQuery).toBeDefined()
    })

    it('应该包含正确的中文分词逻辑', () => {
      const helpers = SearchDatabaseSchema.getChineseTokenizerHelpers()
      
      expect(helpers.simpleChineseTokenize).toContain('simple_chinese_tokenize')
      expect(helpers.simpleChineseTokenize).toContain('\\u4e00-\\u9fff')
      expect(helpers.preprocessQuery).toContain('preprocess_search_query')
    })
  })

  describe('SQL语法验证', () => {
    it('所有创建表语句应该有正确的SQL语法', () => {
      const statements = SearchDatabaseSchema.getCreateTableStatements()
      
      statements.forEach(statement => {
        expect(statement).toMatch(/^CREATE\s+(VIRTUAL\s+)?TABLE\s+IF\s+NOT\s+EXISTS/i)
        expect(statement).toContain('(')
        expect(statement).toContain(')')
      })
    })

    it('所有索引语句应该有正确的SQL语法', () => {
      const statements = SearchDatabaseSchema.getCreateIndexStatements()
      
      statements.forEach(statement => {
        expect(statement).toMatch(/^CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS/i)
        expect(statement).toContain('ON')
        expect(statement).toContain('(')
        expect(statement).toContain(')')
      })
    })

    it('所有触发器语句应该有正确的SQL语法', () => {
      const statements = SearchDatabaseSchema.getCreateTriggerStatements()
      
      statements.forEach(statement => {
        expect(statement).toMatch(/^CREATE\s+TRIGGER\s+IF\s+NOT\s+EXISTS/i)
        expect(statement).toContain('AFTER')
        expect(statement).toContain('BEGIN')
        expect(statement).toContain('END')
      })
    })

    it('所有查询语句应该有正确的SQL语法', () => {
      const queries = SearchDatabaseSchema.getSearchQueries()
      
      Object.values(queries).forEach(query => {
        expect(query.trim()).toMatch(/^SELECT/i)
        expect(query).toContain('FROM')
      })
    })
  })

  describe('数据完整性', () => {
    it('应该在FTS表中包含所有必需的字段', () => {
      const statements = SearchDatabaseSchema.getCreateTableStatements()
      const ftsStatement = statements.find(stmt => stmt.includes('search_index USING fts5'))
      
      const requiredFields = ['id', 'type', 'title', 'content', 'tags', 'page_id', 'created_at', 'updated_at', 'author', 'path']
      requiredFields.forEach(field => {
        expect(ftsStatement).toContain(field)
      })
    })

    it('应该正确设置UNINDEXED字段', () => {
      const statements = SearchDatabaseSchema.getCreateTableStatements()
      const ftsStatement = statements.find(stmt => stmt.includes('search_index USING fts5'))
      
      expect(ftsStatement).toContain('id UNINDEXED')
      expect(ftsStatement).toContain('type UNINDEXED')
      expect(ftsStatement).toContain('page_id UNINDEXED')
      expect(ftsStatement).toContain('created_at UNINDEXED')
      expect(ftsStatement).toContain('updated_at UNINDEXED')
    })

    it('应该在历史表中包含必需的约束', () => {
      const statements = SearchDatabaseSchema.getCreateTableStatements()
      const historyStatement = statements.find(stmt => stmt.includes('search_history'))
      
      expect(historyStatement).toContain('id TEXT PRIMARY KEY')
      expect(historyStatement).toContain('query TEXT NOT NULL')
      expect(historyStatement).toContain('DEFAULT (datetime(\'now\'))')
    })

    it('应该在建议表中包含唯一约束', () => {
      const statements = SearchDatabaseSchema.getCreateTableStatements()
      const suggestionsStatement = statements.find(stmt => stmt.includes('search_suggestions'))
      
      expect(suggestionsStatement).toContain('suggestion TEXT NOT NULL UNIQUE')
    })
  })
})
