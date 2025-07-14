import { describe, it, expect } from 'vitest'
import LinkDatabaseSchema, { LinkRecord, PageReference, BacklinkInfo } from '../LinkDatabaseSchema'

describe('LinkDatabaseSchema', () => {
  describe('SQL语句生成', () => {
    it('应该生成正确的链接表创建SQL', () => {
      const sql = LinkDatabaseSchema.getCreateLinksTableSQL()
      
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS links')
      expect(sql).toContain('id TEXT PRIMARY KEY')
      expect(sql).toContain('source_type TEXT NOT NULL')
      expect(sql).toContain('target_type TEXT NOT NULL')
      expect(sql).toContain('link_type TEXT NOT NULL')
      expect(sql).toContain('CHECK (source_type IN (\'page\', \'block\'))')
      expect(sql).toContain('CHECK (target_type IN (\'page\', \'block\'))')
      expect(sql).toContain('CHECK (link_type IN (\'page-reference\', \'block-reference\', \'alias\'))')
      expect(sql).toContain('UNIQUE(source_type, source_id, target_type, target_id, position)')
    })

    it('应该生成正确的页面引用表创建SQL', () => {
      const sql = LinkDatabaseSchema.getCreatePageReferencesTableSQL()
      
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS page_references')
      expect(sql).toContain('page_id TEXT PRIMARY KEY')
      expect(sql).toContain('reference_count INTEGER DEFAULT 0')
      expect(sql).toContain('FOREIGN KEY (page_id) REFERENCES pages(id)')
    })

    it('应该生成必要的索引SQL', () => {
      const indexes = LinkDatabaseSchema.getCreateIndexesSQL()
      
      expect(indexes).toHaveLength(10)
      expect(indexes.some(sql => sql.includes('idx_links_source'))).toBe(true)
      expect(indexes.some(sql => sql.includes('idx_links_target'))).toBe(true)
      expect(indexes.some(sql => sql.includes('idx_links_type'))).toBe(true)
      expect(indexes.some(sql => sql.includes('idx_page_references_name'))).toBe(true)
      expect(indexes.some(sql => sql.includes('idx_page_references_count'))).toBe(true)
    })

    it('应该生成触发器SQL', () => {
      const triggers = LinkDatabaseSchema.getCreateTriggersSQL()
      
      expect(triggers).toHaveLength(3)
      expect(triggers.some(sql => sql.includes('trigger_links_insert_update_refs'))).toBe(true)
      expect(triggers.some(sql => sql.includes('trigger_links_delete_update_refs'))).toBe(true)
      expect(triggers.some(sql => sql.includes('trigger_pages_delete_cleanup_refs'))).toBe(true)
    })
  })

  describe('查询SQL生成', () => {
    it('应该生成反向链接查询SQL', () => {
      const sql = LinkDatabaseSchema.getBacklinksQuerySQL()
      
      expect(sql).toContain('SELECT')
      expect(sql).toContain('FROM links l')
      expect(sql).toContain('LEFT JOIN pages p')
      expect(sql).toContain('LEFT JOIN blocks b')
      expect(sql).toContain('WHERE l.target_type = ? AND l.target_id = ?')
      expect(sql).toContain('ORDER BY l.created_at DESC')
    })

    it('应该生成页面链接查询SQL', () => {
      const sql = LinkDatabaseSchema.getPageLinksQuerySQL()
      
      expect(sql).toContain('SELECT')
      expect(sql).toContain('FROM links l')
      expect(sql).toContain('WHERE l.source_type = ? AND l.source_id = ?')
      expect(sql).toContain('ORDER BY l.position ASC, l.created_at ASC')
    })

    it('应该生成热门页面查询SQL', () => {
      const sql = LinkDatabaseSchema.getPopularPagesQuerySQL()
      
      expect(sql).toContain('SELECT')
      expect(sql).toContain('FROM page_references pr')
      expect(sql).toContain('WHERE pr.reference_count > 0')
      expect(sql).toContain('ORDER BY pr.reference_count DESC')
      expect(sql).toContain('LIMIT ?')
    })

    it('应该生成孤立页面查询SQL', () => {
      const sql = LinkDatabaseSchema.getOrphanPagesQuerySQL()
      
      expect(sql).toContain('SELECT')
      expect(sql).toContain('FROM pages p')
      expect(sql).toContain('LEFT JOIN page_references pr')
      expect(sql).toContain('WHERE pr.page_id IS NULL OR pr.reference_count = 0')
    })
  })

  describe('完整初始化', () => {
    it('应该返回完整的初始化SQL数组', () => {
      const sqls = LinkDatabaseSchema.getFullInitializationSQL()
      
      expect(sqls.length).toBeGreaterThan(10)
      expect(sqls[0]).toContain('CREATE TABLE IF NOT EXISTS links')
      expect(sqls[1]).toContain('CREATE TABLE IF NOT EXISTS page_references')
      expect(sqls.some(sql => sql.includes('CREATE INDEX'))).toBe(true)
      expect(sqls.some(sql => sql.includes('CREATE TRIGGER'))).toBe(true)
    })
  })

  describe('类型定义验证', () => {
    it('LinkRecord接口应该包含所有必要字段', () => {
      const linkRecord: LinkRecord = {
        id: 'link-1',
        source_type: 'page',
        source_id: 'page-1',
        target_type: 'page',
        target_id: 'page-2',
        link_type: 'page-reference',
        context: '这是一个链接到 [[页面2]] 的示例',
        position: 10,
        display_text: '页面2',
        created_at: '2025-01-14T10:00:00Z',
        updated_at: '2025-01-14T10:00:00Z'
      }

      expect(linkRecord.id).toBe('link-1')
      expect(linkRecord.source_type).toBe('page')
      expect(linkRecord.target_type).toBe('page')
      expect(linkRecord.link_type).toBe('page-reference')
    })

    it('PageReference接口应该包含所有必要字段', () => {
      const pageRef: PageReference = {
        page_id: 'page-1',
        page_name: '测试页面',
        page_title: '测试页面标题',
        reference_count: 5,
        last_referenced_at: '2025-01-14T10:00:00Z'
      }

      expect(pageRef.page_id).toBe('page-1')
      expect(pageRef.reference_count).toBe(5)
    })

    it('BacklinkInfo接口应该包含所有必要字段', () => {
      const backlink: BacklinkInfo = {
        link_id: 'link-1',
        source: {
          type: 'page',
          id: 'page-1',
          title: '源页面',
          content: '页面内容'
        },
        context: '链接上下文',
        position: 10,
        display_text: '显示文本',
        created_at: '2025-01-14T10:00:00Z'
      }

      expect(backlink.link_id).toBe('link-1')
      expect(backlink.source.type).toBe('page')
      expect(backlink.source.id).toBe('page-1')
    })
  })

  describe('SQL语句语法验证', () => {
    it('所有SQL语句应该是有效的SQLite语法', () => {
      const allSQLs = LinkDatabaseSchema.getFullInitializationSQL()

      // 基本语法检查
      allSQLs.forEach(sql => {
        const trimmedSQL = sql.trim()
        expect(trimmedSQL).not.toBe('')
        expect(trimmedSQL).toMatch(/^(CREATE|INSERT|UPDATE|DELETE|SELECT)/i)
      })
    })

    it('查询SQL应该包含正确的参数占位符', () => {
      const backlinksSQL = LinkDatabaseSchema.getBacklinksQuerySQL()
      const pageLinksSQL = LinkDatabaseSchema.getPageLinksQuerySQL()
      const popularPagesSQL = LinkDatabaseSchema.getPopularPagesQuerySQL()
      
      expect(backlinksSQL.match(/\?/g)).toHaveLength(2)
      expect(pageLinksSQL.match(/\?/g)).toHaveLength(2)
      expect(popularPagesSQL.match(/\?/g)).toHaveLength(1)
    })
  })

  describe('数据完整性约束', () => {
    it('链接表应该有正确的约束', () => {
      const sql = LinkDatabaseSchema.getCreateLinksTableSQL()
      
      // 检查CHECK约束
      expect(sql).toContain('CHECK (source_type IN (\'page\', \'block\'))')
      expect(sql).toContain('CHECK (target_type IN (\'page\', \'block\'))')
      expect(sql).toContain('CHECK (link_type IN (\'page-reference\', \'block-reference\', \'alias\'))')
      
      // 检查UNIQUE约束
      expect(sql).toContain('UNIQUE(source_type, source_id, target_type, target_id, position)')
      
      // 检查外键约束
      expect(sql).toContain('FOREIGN KEY (source_id) REFERENCES pages(id) ON DELETE CASCADE')
      expect(sql).toContain('FOREIGN KEY (target_id) REFERENCES pages(id) ON DELETE CASCADE')
    })

    it('页面引用表应该有正确的约束', () => {
      const sql = LinkDatabaseSchema.getCreatePageReferencesTableSQL()
      
      expect(sql).toContain('page_id TEXT PRIMARY KEY')
      expect(sql).toContain('reference_count INTEGER DEFAULT 0')
      expect(sql).toContain('FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE')
    })
  })
})
