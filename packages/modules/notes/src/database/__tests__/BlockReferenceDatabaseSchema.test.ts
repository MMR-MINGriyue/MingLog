import { describe, it, expect } from 'vitest'
import BlockReferenceDatabaseSchema from '../BlockReferenceDatabaseSchema'

describe('BlockReferenceDatabaseSchema', () => {
  describe('getAlterBlocksTableSQL', () => {
    it('应该返回扩展blocks表的SQL语句', () => {
      const sqlStatements = BlockReferenceDatabaseSchema.getAlterBlocksTableSQL()
      
      expect(sqlStatements).toHaveLength(2)
      expect(sqlStatements[0]).toContain('ALTER TABLE blocks ADD COLUMN block_type')
      expect(sqlStatements[1]).toContain('ALTER TABLE blocks ADD COLUMN reference_count')
    })

    it('应该包含正确的默认值', () => {
      const sqlStatements = BlockReferenceDatabaseSchema.getAlterBlocksTableSQL()
      
      expect(sqlStatements[0]).toContain("DEFAULT 'paragraph'")
      expect(sqlStatements[1]).toContain('DEFAULT 0')
    })
  })

  describe('getCreateBlockReferencesTableSQL', () => {
    it('应该返回创建block_references表的SQL语句', () => {
      const sql = BlockReferenceDatabaseSchema.getCreateBlockReferencesTableSQL()
      
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS block_references')
      expect(sql).toContain('id TEXT PRIMARY KEY')
      expect(sql).toContain('source_block_id TEXT NOT NULL')
      expect(sql).toContain('target_block_id TEXT NOT NULL')
      expect(sql).toContain('reference_type TEXT NOT NULL')
    })

    it('应该包含正确的约束', () => {
      const sql = BlockReferenceDatabaseSchema.getCreateBlockReferencesTableSQL()
      
      expect(sql).toContain('UNIQUE(source_block_id, target_block_id, position)')
      expect(sql).toContain('FOREIGN KEY (source_block_id) REFERENCES blocks(id)')
      expect(sql).toContain('FOREIGN KEY (target_block_id) REFERENCES blocks(id)')
      expect(sql).toContain("CHECK (reference_type IN ('direct', 'embed', 'mention'))")
    })

    it('应该包含级联删除', () => {
      const sql = BlockReferenceDatabaseSchema.getCreateBlockReferencesTableSQL()
      
      expect(sql).toContain('ON DELETE CASCADE')
    })
  })

  describe('getCreateBlockReferenceIndexesSQL', () => {
    it('应该返回所有必要的索引', () => {
      const indexes = BlockReferenceDatabaseSchema.getCreateBlockReferenceIndexesSQL()
      
      expect(indexes).toHaveLength(10)
      
      // 验证块引用表索引
      expect(indexes.some(idx => idx.includes('idx_block_references_source'))).toBe(true)
      expect(indexes.some(idx => idx.includes('idx_block_references_target'))).toBe(true)
      expect(indexes.some(idx => idx.includes('idx_block_references_type'))).toBe(true)
      expect(indexes.some(idx => idx.includes('idx_block_references_created_at'))).toBe(true)
      expect(indexes.some(idx => idx.includes('idx_block_references_position'))).toBe(true)
      
      // 验证块表扩展索引
      expect(indexes.some(idx => idx.includes('idx_blocks_type'))).toBe(true)
      expect(indexes.some(idx => idx.includes('idx_blocks_reference_count'))).toBe(true)
      expect(indexes.some(idx => idx.includes('idx_blocks_content_search'))).toBe(true)
      
      // 验证复合索引
      expect(indexes.some(idx => idx.includes('idx_blocks_page_type_order'))).toBe(true)
      expect(indexes.some(idx => idx.includes('idx_block_references_source_type'))).toBe(true)
    })

    it('应该使用IF NOT EXISTS', () => {
      const indexes = BlockReferenceDatabaseSchema.getCreateBlockReferenceIndexesSQL()
      
      indexes.forEach(index => {
        expect(index).toContain('CREATE INDEX IF NOT EXISTS')
      })
    })
  })

  describe('getCreateBlockReferenceTriggersSQL', () => {
    it('应该返回所有必要的触发器', () => {
      const triggers = BlockReferenceDatabaseSchema.getCreateBlockReferenceTriggersSQL()
      
      expect(triggers).toHaveLength(3)
      
      // 验证触发器名称
      expect(triggers[0]).toContain('trigger_block_references_insert_update_count')
      expect(triggers[1]).toContain('trigger_block_references_delete_update_count')
      expect(triggers[2]).toContain('trigger_blocks_delete_cleanup_references')
    })

    it('应该包含正确的触发器逻辑', () => {
      const triggers = BlockReferenceDatabaseSchema.getCreateBlockReferenceTriggersSQL()
      
      // 插入触发器应该更新引用计数
      expect(triggers[0]).toContain('AFTER INSERT ON block_references')
      expect(triggers[0]).toContain('UPDATE blocks')
      expect(triggers[0]).toContain('reference_count =')
      
      // 删除触发器应该更新引用计数
      expect(triggers[1]).toContain('AFTER DELETE ON block_references')
      expect(triggers[1]).toContain('UPDATE blocks')
      
      // 块删除触发器应该清理引用
      expect(triggers[2]).toContain('AFTER DELETE ON blocks')
      expect(triggers[2]).toContain('DELETE FROM block_references')
    })

    it('应该使用IF NOT EXISTS', () => {
      const triggers = BlockReferenceDatabaseSchema.getCreateBlockReferenceTriggersSQL()
      
      triggers.forEach(trigger => {
        expect(trigger).toContain('CREATE TRIGGER IF NOT EXISTS')
      })
    })
  })

  describe('查询SQL语句', () => {
    describe('getBlockReferencesQuerySQL', () => {
      it('应该返回查询块引用的SQL语句', () => {
        const sql = BlockReferenceDatabaseSchema.getBlockReferencesQuerySQL()
        
        expect(sql).toContain('SELECT')
        expect(sql).toContain('FROM block_references br')
        expect(sql).toContain('JOIN blocks sb ON br.source_block_id = sb.id')
        expect(sql).toContain('JOIN blocks tb ON br.target_block_id = tb.id')
        expect(sql).toContain('WHERE br.target_block_id = ?')
        expect(sql).toContain('ORDER BY br.created_at DESC')
      })

      it('应该包含所有必要的字段', () => {
        const sql = BlockReferenceDatabaseSchema.getBlockReferencesQuerySQL()
        
        expect(sql).toContain('br.id as reference_id')
        expect(sql).toContain('br.source_block_id')
        expect(sql).toContain('br.target_block_id')
        expect(sql).toContain('br.reference_type')
        expect(sql).toContain('sb.content as source_content')
        expect(sql).toContain('tb.content as target_content')
      })
    })

    describe('getBlockBacklinksQuerySQL', () => {
      it('应该返回查询反向链接的SQL语句', () => {
        const sql = BlockReferenceDatabaseSchema.getBlockBacklinksQuerySQL()
        
        expect(sql).toContain('SELECT')
        expect(sql).toContain('FROM block_references br')
        expect(sql).toContain('JOIN blocks sb ON br.source_block_id = sb.id')
        expect(sql).toContain('WHERE br.target_block_id = ?')
        expect(sql).toContain('ORDER BY br.created_at DESC')
      })
    })

    describe('getPageBlockReferencesQuerySQL', () => {
      it('应该返回查询页面块引用的SQL语句', () => {
        const sql = BlockReferenceDatabaseSchema.getPageBlockReferencesQuerySQL()
        
        expect(sql).toContain('WHERE sb.page_id = ?')
        expect(sql).toContain('ORDER BY sb."order" ASC, br.position ASC')
      })
    })

    describe('getOrphanBlocksQuerySQL', () => {
      it('应该返回查询孤立块的SQL语句', () => {
        const sql = BlockReferenceDatabaseSchema.getOrphanBlocksQuerySQL()
        
        expect(sql).toContain('WHERE b.id NOT IN')
        expect(sql).toContain('SELECT DISTINCT target_block_id')
        expect(sql).toContain("AND b.content != ''")
      })
    })

    describe('getMostReferencedBlocksQuerySQL', () => {
      it('应该返回查询最多引用块的SQL语句', () => {
        const sql = BlockReferenceDatabaseSchema.getMostReferencedBlocksQuerySQL()
        
        expect(sql).toContain('WHERE b.reference_count > 0')
        expect(sql).toContain('ORDER BY b.reference_count DESC')
        expect(sql).toContain('LIMIT ?')
      })
    })

    describe('getBlockReferenceStatsQuerySQL', () => {
      it('应该返回统计查询的SQL语句', () => {
        const sql = BlockReferenceDatabaseSchema.getBlockReferenceStatsQuerySQL()
        
        expect(sql).toContain('COUNT(*) as total_blocks')
        expect(sql).toContain('COUNT(CASE WHEN reference_count > 0 THEN 1 END) as referenced_blocks')
        expect(sql).toContain('COALESCE(SUM(reference_count), 0) as total_references')
        expect(sql).toContain('COALESCE(AVG(CASE WHEN reference_count > 0 THEN reference_count END), 0) as average_references')
      })
    })

    describe('getSearchBlocksQuerySQL', () => {
      it('应该返回搜索块的SQL语句', () => {
        const sql = BlockReferenceDatabaseSchema.getSearchBlocksQuerySQL()
        
        expect(sql).toContain('CASE')
        expect(sql).toContain('relevance_score')
        expect(sql).toContain('WHERE b.content LIKE ?')
        expect(sql).toContain('ORDER BY relevance_score DESC')
        expect(sql).toContain('LIMIT ?')
      })

      it('应该包含相关性评分逻辑', () => {
        const sql = BlockReferenceDatabaseSchema.getSearchBlocksQuerySQL()
        
        expect(sql).toContain('WHEN b.content LIKE ? THEN 100')
        expect(sql).toContain('WHEN b.content LIKE ? THEN 80')
        expect(sql).toContain('WHEN b.content LIKE ? THEN 60')
        expect(sql).toContain('ELSE 40')
      })
    })
  })

  describe('getAllInitializationSQL', () => {
    it('应该返回所有初始化SQL语句', () => {
      const allSQL = BlockReferenceDatabaseSchema.getAllInitializationSQL()
      
      // 应该包含所有类型的SQL语句
      expect(allSQL.length).toBeGreaterThan(10)
      
      // 验证包含各种类型的语句
      const sqlString = allSQL.join(' ')
      expect(sqlString).toContain('ALTER TABLE blocks')
      expect(sqlString).toContain('CREATE TABLE IF NOT EXISTS block_references')
      expect(sqlString).toContain('CREATE INDEX IF NOT EXISTS')
      expect(sqlString).toContain('CREATE TRIGGER IF NOT EXISTS')
    })

    it('应该按正确顺序排列SQL语句', () => {
      const allSQL = BlockReferenceDatabaseSchema.getAllInitializationSQL()
      
      // ALTER语句应该在前面
      expect(allSQL[0]).toContain('ALTER TABLE')
      expect(allSQL[1]).toContain('ALTER TABLE')
      
      // CREATE TABLE语句应该在ALTER之后
      expect(allSQL[2]).toContain('CREATE TABLE IF NOT EXISTS block_references')
    })
  })

  describe('SQL语句语法验证', () => {
    it('所有SQL语句应该是有效的', () => {
      const allSQL = BlockReferenceDatabaseSchema.getAllInitializationSQL()
      
      allSQL.forEach((sql, index) => {
        // 基本语法检查
        expect(sql.trim()).not.toBe('')
        expect(sql).not.toContain('undefined')
        expect(sql).not.toContain('null')
        
        // SQL关键字检查
        const upperSQL = sql.toUpperCase()
        expect(
          upperSQL.includes('CREATE') || 
          upperSQL.includes('ALTER') || 
          upperSQL.includes('SELECT')
        ).toBe(true)
      })
    })

    it('查询SQL语句应该包含参数占位符', () => {
      const querySQL = [
        BlockReferenceDatabaseSchema.getBlockReferencesQuerySQL(),
        BlockReferenceDatabaseSchema.getBlockBacklinksQuerySQL(),
        BlockReferenceDatabaseSchema.getPageBlockReferencesQuerySQL(),
        BlockReferenceDatabaseSchema.getMostReferencedBlocksQuerySQL(),
        BlockReferenceDatabaseSchema.getSearchBlocksQuerySQL()
      ]

      querySQL.forEach(sql => {
        expect(sql).toContain('?')
      })
    })
  })
})
