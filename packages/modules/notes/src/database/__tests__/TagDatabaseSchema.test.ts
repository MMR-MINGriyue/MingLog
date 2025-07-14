import { describe, it, expect } from 'vitest'
import { TagDatabaseSchema } from '../TagDatabaseSchema'

describe('TagDatabaseSchema', () => {
  describe('表创建语句', () => {
    it('应该生成标签主表创建语句', () => {
      const statements = TagDatabaseSchema.getCreateTableStatements()
      const tagsStatement = statements.find(stmt => stmt.includes('CREATE TABLE IF NOT EXISTS tags'))
      
      expect(tagsStatement).toBeDefined()
      expect(tagsStatement).toContain('id TEXT PRIMARY KEY')
      expect(tagsStatement).toContain('name TEXT NOT NULL UNIQUE')
      expect(tagsStatement).toContain('parent_id TEXT')
      expect(tagsStatement).toContain('color TEXT DEFAULT \'#6B7280\'')
      expect(tagsStatement).toContain('usage_count INTEGER DEFAULT 0')
      expect(tagsStatement).toContain('is_system BOOLEAN DEFAULT FALSE')
      expect(tagsStatement).toContain('is_active BOOLEAN DEFAULT TRUE')
      expect(tagsStatement).toContain('FOREIGN KEY (parent_id) REFERENCES tags(id)')
    })

    it('应该生成笔记标签关联表创建语句', () => {
      const statements = TagDatabaseSchema.getCreateTableStatements()
      const noteTagsStatement = statements.find(stmt => stmt.includes('CREATE TABLE IF NOT EXISTS note_tags'))
      
      expect(noteTagsStatement).toBeDefined()
      expect(noteTagsStatement).toContain('note_id TEXT NOT NULL')
      expect(noteTagsStatement).toContain('tag_id TEXT NOT NULL')
      expect(noteTagsStatement).toContain('FOREIGN KEY (note_id) REFERENCES notes(id)')
      expect(noteTagsStatement).toContain('FOREIGN KEY (tag_id) REFERENCES tags(id)')
      expect(noteTagsStatement).toContain('UNIQUE(note_id, tag_id)')
    })

    it('应该生成标签层级关系表创建语句', () => {
      const statements = TagDatabaseSchema.getCreateTableStatements()
      const hierarchyStatement = statements.find(stmt => stmt.includes('CREATE TABLE IF NOT EXISTS tag_hierarchy'))
      
      expect(hierarchyStatement).toBeDefined()
      expect(hierarchyStatement).toContain('tag_id TEXT NOT NULL')
      expect(hierarchyStatement).toContain('ancestor_id TEXT NOT NULL')
      expect(hierarchyStatement).toContain('depth INTEGER NOT NULL')
      expect(hierarchyStatement).toContain('path TEXT NOT NULL')
      expect(hierarchyStatement).toContain('PRIMARY KEY (tag_id, ancestor_id)')
    })

    it('应该生成标签统计表创建语句', () => {
      const statements = TagDatabaseSchema.getCreateTableStatements()
      const statsStatement = statements.find(stmt => stmt.includes('CREATE TABLE IF NOT EXISTS tag_stats'))
      
      expect(statsStatement).toBeDefined()
      expect(statsStatement).toContain('tag_id TEXT PRIMARY KEY')
      expect(statsStatement).toContain('usage_count INTEGER DEFAULT 0')
      expect(statsStatement).toContain('note_count INTEGER DEFAULT 0')
      expect(statsStatement).toContain('child_count INTEGER DEFAULT 0')
    })

    it('应该生成标签建议表创建语句', () => {
      const statements = TagDatabaseSchema.getCreateTableStatements()
      const suggestionsStatement = statements.find(stmt => stmt.includes('CREATE TABLE IF NOT EXISTS tag_suggestions'))
      
      expect(suggestionsStatement).toBeDefined()
      expect(suggestionsStatement).toContain('suggested_name TEXT NOT NULL')
      expect(suggestionsStatement).toContain('source TEXT NOT NULL CHECK')
      expect(suggestionsStatement).toContain('confidence REAL DEFAULT 0.0')
      expect(suggestionsStatement).toContain('CHECK (confidence >= 0.0 AND confidence <= 1.0)')
    })

    it('应该生成所有必需的表', () => {
      const statements = TagDatabaseSchema.getCreateTableStatements()
      
      expect(statements).toHaveLength(5)
      expect(statements.some(stmt => stmt.includes('tags'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('note_tags'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('tag_hierarchy'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('tag_stats'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('tag_suggestions'))).toBe(true)
    })
  })

  describe('索引创建语句', () => {
    it('应该生成标签表索引', () => {
      const statements = TagDatabaseSchema.getCreateIndexStatements()
      
      expect(statements.some(stmt => stmt.includes('idx_tags_name'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_tags_parent_id'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_tags_usage_count'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_tags_is_active'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_tags_created_at'))).toBe(true)
    })

    it('应该生成笔记标签关联表索引', () => {
      const statements = TagDatabaseSchema.getCreateIndexStatements()
      
      expect(statements.some(stmt => stmt.includes('idx_note_tags_note_id'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_note_tags_tag_id'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_note_tags_created_at'))).toBe(true)
    })

    it('应该生成标签层级表索引', () => {
      const statements = TagDatabaseSchema.getCreateIndexStatements()
      
      expect(statements.some(stmt => stmt.includes('idx_tag_hierarchy_tag_id'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_tag_hierarchy_ancestor_id'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_tag_hierarchy_depth'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_tag_hierarchy_path'))).toBe(true)
    })

    it('应该生成标签统计表索引', () => {
      const statements = TagDatabaseSchema.getCreateIndexStatements()
      
      expect(statements.some(stmt => stmt.includes('idx_tag_stats_usage_count'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_tag_stats_note_count'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_tag_stats_last_used'))).toBe(true)
    })

    it('应该生成标签建议表索引', () => {
      const statements = TagDatabaseSchema.getCreateIndexStatements()
      
      expect(statements.some(stmt => stmt.includes('idx_tag_suggestions_note_id'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_tag_suggestions_confidence'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_tag_suggestions_source'))).toBe(true)
      expect(statements.some(stmt => stmt.includes('idx_tag_suggestions_created_at'))).toBe(true)
    })

    it('应该生成正确数量的索引', () => {
      const statements = TagDatabaseSchema.getCreateIndexStatements()
      expect(statements).toHaveLength(19)
    })
  })

  describe('触发器创建语句', () => {
    it('应该生成标签插入层级触发器', () => {
      const statements = TagDatabaseSchema.getCreateTriggerStatements()
      const insertTrigger = statements.find(stmt => stmt.includes('trigger_tag_insert_hierarchy'))
      
      expect(insertTrigger).toBeDefined()
      expect(insertTrigger).toContain('AFTER INSERT ON tags')
      expect(insertTrigger).toContain('INSERT INTO tag_hierarchy')
      expect(insertTrigger).toContain('INSERT INTO tag_stats')
      expect(insertTrigger).toContain('UPDATE tag_stats')
    })

    it('应该生成标签删除层级触发器', () => {
      const statements = TagDatabaseSchema.getCreateTriggerStatements()
      const deleteTrigger = statements.find(stmt => stmt.includes('trigger_tag_delete_hierarchy'))
      
      expect(deleteTrigger).toBeDefined()
      expect(deleteTrigger).toContain('BEFORE DELETE ON tags')
      expect(deleteTrigger).toContain('DELETE FROM tag_hierarchy')
      expect(deleteTrigger).toContain('UPDATE tags')
    })

    it('应该生成笔记标签插入统计触发器', () => {
      const statements = TagDatabaseSchema.getCreateTriggerStatements()
      const insertStatsTrigger = statements.find(stmt => stmt.includes('trigger_note_tag_insert_stats'))
      
      expect(insertStatsTrigger).toBeDefined()
      expect(insertStatsTrigger).toContain('AFTER INSERT ON note_tags')
      expect(insertStatsTrigger).toContain('UPDATE tags')
      expect(insertStatsTrigger).toContain('UPDATE tag_stats')
    })

    it('应该生成笔记标签删除统计触发器', () => {
      const statements = TagDatabaseSchema.getCreateTriggerStatements()
      const deleteStatsTrigger = statements.find(stmt => stmt.includes('trigger_note_tag_delete_stats'))
      
      expect(deleteStatsTrigger).toBeDefined()
      expect(deleteStatsTrigger).toContain('AFTER DELETE ON note_tags')
      expect(deleteStatsTrigger).toContain('WHEN usage_count > 0')
    })

    it('应该生成标签更新时间触发器', () => {
      const statements = TagDatabaseSchema.getCreateTriggerStatements()
      const updateTrigger = statements.find(stmt => stmt.includes('trigger_tags_update_timestamp'))
      
      expect(updateTrigger).toBeDefined()
      expect(updateTrigger).toContain('AFTER UPDATE ON tags')
      expect(updateTrigger).toContain('UPDATE tags SET updated_at = datetime(\'now\')')
    })

    it('应该生成所有必需的触发器', () => {
      const statements = TagDatabaseSchema.getCreateTriggerStatements()
      expect(statements).toHaveLength(5)
    })
  })

  describe('标签查询语句', () => {
    it('应该提供根标签查询', () => {
      const queries = TagDatabaseSchema.getTagQueries()
      
      expect(queries.getRootTags).toBeDefined()
      expect(queries.getRootTags).toContain('WHERE parent_id IS NULL')
      expect(queries.getRootTags).toContain('is_active = TRUE')
      expect(queries.getRootTags).toContain('ORDER BY sort_order ASC')
    })

    it('应该提供子标签查询', () => {
      const queries = TagDatabaseSchema.getTagQueries()
      
      expect(queries.getChildTags).toBeDefined()
      expect(queries.getChildTags).toContain('WHERE parent_id = ?')
      expect(queries.getChildTags).toContain('is_active = TRUE')
    })

    it('应该提供标签路径查询', () => {
      const queries = TagDatabaseSchema.getTagQueries()
      
      expect(queries.getTagPath).toBeDefined()
      expect(queries.getTagPath).toContain('JOIN tag_hierarchy th')
      expect(queries.getTagPath).toContain('WHERE th.tag_id = ?')
      expect(queries.getTagPath).toContain('ORDER BY th.depth ASC')
    })

    it('应该提供标签后代查询', () => {
      const queries = TagDatabaseSchema.getTagQueries()
      
      expect(queries.getTagDescendants).toBeDefined()
      expect(queries.getTagDescendants).toContain('WHERE th.ancestor_id = ?')
      expect(queries.getTagDescendants).toContain('th.depth > 0')
    })

    it('应该提供笔记标签查询', () => {
      const queries = TagDatabaseSchema.getTagQueries()
      
      expect(queries.getNoteTagsWithHierarchy).toBeDefined()
      expect(queries.getNoteTagsWithHierarchy).toContain('JOIN note_tags nt')
      expect(queries.getNoteTagsWithHierarchy).toContain('WHERE nt.note_id = ?')
    })

    it('应该提供标签搜索查询', () => {
      const queries = TagDatabaseSchema.getTagQueries()
      
      expect(queries.searchTags).toBeDefined()
      expect(queries.searchTags).toContain('WHERE t.name LIKE ?')
      expect(queries.searchTags).toContain('ORDER BY ts.usage_count DESC')
    })

    it('应该提供热门标签查询', () => {
      const queries = TagDatabaseSchema.getTagQueries()
      
      expect(queries.getPopularTags).toBeDefined()
      expect(queries.getPopularTags).toContain('ORDER BY ts.usage_count DESC')
    })

    it('应该提供最近标签查询', () => {
      const queries = TagDatabaseSchema.getTagQueries()
      
      expect(queries.getRecentTags).toBeDefined()
      expect(queries.getRecentTags).toContain('ORDER BY ts.last_used_at DESC')
    })

    it('应该提供标签建议查询', () => {
      const queries = TagDatabaseSchema.getTagQueries()
      
      expect(queries.getTagSuggestions).toBeDefined()
      expect(queries.getTagSuggestions).toContain('WHERE note_id = ?')
      expect(queries.getTagSuggestions).toContain('ORDER BY confidence DESC')
    })

    it('应该提供相似标签查询', () => {
      const queries = TagDatabaseSchema.getTagQueries()
      
      expect(queries.getSimilarTags).toBeDefined()
      expect(queries.getSimilarTags).toContain('similarity_score')
      expect(queries.getSimilarTags).toContain('ORDER BY similarity_score DESC')
    })
  })

  describe('标签管理查询语句', () => {
    it('应该提供添加标签到笔记的查询', () => {
      const queries = TagDatabaseSchema.getTagManagementQueries()
      
      expect(queries.addTagsToNote).toBeDefined()
      expect(queries.addTagsToNote).toContain('INSERT OR IGNORE INTO note_tags')
    })

    it('应该提供从笔记移除标签的查询', () => {
      const queries = TagDatabaseSchema.getTagManagementQueries()
      
      expect(queries.removeTagsFromNote).toBeDefined()
      expect(queries.removeTagsFromNote).toContain('DELETE FROM note_tags')
      expect(queries.removeTagsFromNote).toContain('json_each(?)')
    })

    it('应该提供替换笔记标签的查询', () => {
      const queries = TagDatabaseSchema.getTagManagementQueries()
      
      expect(queries.replaceNoteTags).toBeDefined()
      expect(queries.replaceNoteTags).toContain('DELETE FROM note_tags WHERE note_id = ?')
      expect(queries.replaceNoteTags).toContain('INSERT INTO note_tags')
    })

    it('应该提供合并标签的查询', () => {
      const queries = TagDatabaseSchema.getTagManagementQueries()
      
      expect(queries.mergeTags).toBeDefined()
      expect(queries.mergeTags).toContain('UPDATE note_tags')
      expect(queries.mergeTags).toContain('NOT EXISTS')
    })

    it('应该提供重新计算统计的查询', () => {
      const queries = TagDatabaseSchema.getTagManagementQueries()
      
      expect(queries.recalculateTagStats).toBeDefined()
      expect(queries.recalculateTagStats).toContain('UPDATE tag_stats')
      expect(queries.recalculateTagStats).toContain('SELECT COUNT(*) FROM note_tags')
    })
  })

  describe('SQL语法验证', () => {
    it('所有创建表语句应该有正确的SQL语法', () => {
      const statements = TagDatabaseSchema.getCreateTableStatements()
      
      statements.forEach(statement => {
        expect(statement).toMatch(/^CREATE TABLE\s+IF\s+NOT\s+EXISTS/i)
        expect(statement).toContain('(')
        expect(statement).toContain(')')
      })
    })

    it('所有索引语句应该有正确的SQL语法', () => {
      const statements = TagDatabaseSchema.getCreateIndexStatements()
      
      statements.forEach(statement => {
        expect(statement).toMatch(/^CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS/i)
        expect(statement).toContain('ON')
        expect(statement).toContain('(')
        expect(statement).toContain(')')
      })
    })

    it('所有触发器语句应该有正确的SQL语法', () => {
      const statements = TagDatabaseSchema.getCreateTriggerStatements()
      
      statements.forEach(statement => {
        expect(statement).toMatch(/^CREATE\s+TRIGGER\s+IF\s+NOT\s+EXISTS/i)
        expect(statement).toContain('BEGIN')
        expect(statement).toContain('END')
      })
    })

    it('所有查询语句应该有正确的SQL语法', () => {
      const queries = TagDatabaseSchema.getTagQueries()
      
      Object.values(queries).forEach(query => {
        expect(query.trim()).toMatch(/^SELECT/i)
        expect(query).toContain('FROM')
      })
    })
  })

  describe('数据完整性', () => {
    it('应该在标签表中包含所有必需的字段', () => {
      const statements = TagDatabaseSchema.getCreateTableStatements()
      const tagsStatement = statements.find(stmt => stmt.includes('CREATE TABLE IF NOT EXISTS tags'))
      
      const requiredFields = ['id', 'name', 'parent_id', 'color', 'sort_order', 'usage_count', 'is_system', 'is_active', 'created_at', 'updated_at']
      requiredFields.forEach(field => {
        expect(tagsStatement).toContain(field)
      })
    })

    it('应该正确设置外键约束', () => {
      const statements = TagDatabaseSchema.getCreateTableStatements()
      
      const tagsStatement = statements.find(stmt => stmt.includes('CREATE TABLE IF NOT EXISTS tags'))
      expect(tagsStatement).toContain('FOREIGN KEY (parent_id) REFERENCES tags(id)')
      
      const noteTagsStatement = statements.find(stmt => stmt.includes('CREATE TABLE IF NOT EXISTS note_tags'))
      expect(noteTagsStatement).toContain('FOREIGN KEY (note_id) REFERENCES notes(id)')
      expect(noteTagsStatement).toContain('FOREIGN KEY (tag_id) REFERENCES tags(id)')
    })

    it('应该设置正确的默认值', () => {
      const statements = TagDatabaseSchema.getCreateTableStatements()
      const tagsStatement = statements.find(stmt => stmt.includes('CREATE TABLE IF NOT EXISTS tags'))
      
      expect(tagsStatement).toContain('color TEXT DEFAULT \'#6B7280\'')
      expect(tagsStatement).toContain('sort_order INTEGER DEFAULT 0')
      expect(tagsStatement).toContain('usage_count INTEGER DEFAULT 0')
      expect(tagsStatement).toContain('is_system BOOLEAN DEFAULT FALSE')
      expect(tagsStatement).toContain('is_active BOOLEAN DEFAULT TRUE')
    })

    it('应该设置正确的约束', () => {
      const statements = TagDatabaseSchema.getCreateTableStatements()
      
      const tagsStatement = statements.find(stmt => stmt.includes('CREATE TABLE IF NOT EXISTS tags'))
      expect(tagsStatement).toContain('name TEXT NOT NULL UNIQUE')
      
      const noteTagsStatement = statements.find(stmt => stmt.includes('CREATE TABLE IF NOT EXISTS note_tags'))
      expect(noteTagsStatement).toContain('UNIQUE(note_id, tag_id)')
      
      const suggestionsStatement = statements.find(stmt => stmt.includes('CREATE TABLE IF NOT EXISTS tag_suggestions'))
      expect(suggestionsStatement).toContain('CHECK (confidence >= 0.0 AND confidence <= 1.0)')
    })
  })
})
