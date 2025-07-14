import { describe, it, expect } from 'vitest'
import BlockReferenceParser, { BlockMatch, BlockParseResult, BlockSuggestion } from '../BlockReferenceParser'

describe('BlockReferenceParser', () => {
  describe('parse', () => {
    it('应该解析简单的块引用', () => {
      const text = '这是一个 ((block-123)) 的引用'
      const result = BlockReferenceParser.parse(text)

      expect(result.hasBlockReferences).toBe(true)
      expect(result.blockReferences).toHaveLength(1)
      expect(result.blockReferences[0]).toEqual({
        fullMatch: '((block-123))',
        blockId: 'block-123',
        startIndex: 5,
        endIndex: 18,
        type: 'block'
      })
    })

    it('应该解析多个块引用', () => {
      const text = '参考 ((block-1)) 和 ((block-2)) 的内容'
      const result = BlockReferenceParser.parse(text)

      expect(result.hasBlockReferences).toBe(true)
      expect(result.blockReferences).toHaveLength(2)
      
      expect(result.blockReferences[0].blockId).toBe('block-1')
      expect(result.blockReferences[0].type).toBe('block')
      
      expect(result.blockReferences[1].blockId).toBe('block-2')
      expect(result.blockReferences[1].type).toBe('block')
    })

    it('应该处理空文本', () => {
      const result = BlockReferenceParser.parse('')
      
      expect(result.hasBlockReferences).toBe(false)
      expect(result.blockReferences).toHaveLength(0)
      expect(result.originalText).toBe('')
      expect(result.processedText).toBe('')
    })

    it('应该处理无块引用的文本', () => {
      const text = '这是普通文本，没有块引用'
      const result = BlockReferenceParser.parse(text)

      expect(result.hasBlockReferences).toBe(false)
      expect(result.blockReferences).toHaveLength(0)
      expect(result.originalText).toBe(text)
      expect(result.processedText).toBe(text)
    })

    it('应该忽略无效的块引用格式', () => {
      const text = '这些不是有效引用：(单括号) (()) ((空)) (( 空格 ))'
      const result = BlockReferenceParser.parse(text)

      expect(result.hasBlockReferences).toBe(false)
      expect(result.blockReferences).toHaveLength(0)
    })

    it('应该处理包含特殊字符的块ID', () => {
      const text = '引用 ((block_123)) 和 ((block-456)) 块'
      const result = BlockReferenceParser.parse(text)

      expect(result.hasBlockReferences).toBe(true)
      expect(result.blockReferences).toHaveLength(2)
      expect(result.blockReferences[0].blockId).toBe('block_123')
      expect(result.blockReferences[1].blockId).toBe('block-456')
    })

    it('应该生成正确的处理后文本', () => {
      const text = '参考 ((block-1)) 的内容'
      const result = BlockReferenceParser.parse(text)

      expect(result.processedText).toBe('参考 [BLOCK_REF:block-1] 的内容')
    })
  })

  describe('extractBlockIds', () => {
    it('应该提取所有块ID', () => {
      const text = '参考 ((block-A)) 和 ((block-B)) 以及 ((block-A)) 再次'
      const blockIds = BlockReferenceParser.extractBlockIds(text)

      expect(blockIds).toEqual(['block-A', 'block-B'])
      expect(blockIds).toHaveLength(2) // 应该去重
    })

    it('应该处理空文本', () => {
      const blockIds = BlockReferenceParser.extractBlockIds('')
      expect(blockIds).toEqual([])
    })
  })

  describe('hasBlockReferences', () => {
    it('应该检测包含块引用的文本', () => {
      expect(BlockReferenceParser.hasBlockReferences('包含 ((block-1)) 的文本')).toBe(true)
      expect(BlockReferenceParser.hasBlockReferences('((开头块)) 文本')).toBe(true)
      expect(BlockReferenceParser.hasBlockReferences('文本 ((结尾块))')).toBe(true)
    })

    it('应该检测不包含块引用的文本', () => {
      expect(BlockReferenceParser.hasBlockReferences('普通文本')).toBe(false)
      expect(BlockReferenceParser.hasBlockReferences('(单括号)')).toBe(false)
      expect(BlockReferenceParser.hasBlockReferences('')).toBe(false)
    })
  })

  describe('isValidBlockId', () => {
    it('应该接受有效的块ID', () => {
      expect(BlockReferenceParser.isValidBlockId('block-123')).toBe(true)
      expect(BlockReferenceParser.isValidBlockId('block_456')).toBe(true)
      expect(BlockReferenceParser.isValidBlockId('ABC123')).toBe(true)
      expect(BlockReferenceParser.isValidBlockId('a')).toBe(true)
      expect(BlockReferenceParser.isValidBlockId('123')).toBe(true)
    })

    it('应该拒绝无效的块ID', () => {
      expect(BlockReferenceParser.isValidBlockId('')).toBe(false)
      expect(BlockReferenceParser.isValidBlockId('   ')).toBe(false)
      expect(BlockReferenceParser.isValidBlockId('block with spaces')).toBe(false)
      expect(BlockReferenceParser.isValidBlockId('block@123')).toBe(false)
      expect(BlockReferenceParser.isValidBlockId('block#123')).toBe(false)
    })

    it('应该拒绝过长的块ID', () => {
      const longId = 'a'.repeat(65)
      expect(BlockReferenceParser.isValidBlockId(longId)).toBe(false)
    })
  })

  describe('createBlockReference', () => {
    it('应该创建块引用', () => {
      const ref = BlockReferenceParser.createBlockReference('block-123')
      expect(ref).toBe('((block-123))')
    })

    it('应该处理前后空格', () => {
      const ref = BlockReferenceParser.createBlockReference('  block-123  ')
      expect(ref).toBe('((block-123))')
    })

    it('应该抛出无效块ID的错误', () => {
      expect(() => BlockReferenceParser.createBlockReference('')).toThrow('Invalid block ID')
      expect(() => BlockReferenceParser.createBlockReference('invalid id')).toThrow('Invalid block ID')
    })
  })

  describe('findPotentialBlockReference', () => {
    it('应该检测光标在块引用中的情况', () => {
      const text = '这是 ((block-123)) 的引用'
      const result = BlockReferenceParser.findPotentialBlockReference(text, 10) // 光标在 "block" 之后

      expect(result.isInBlockReference).toBe(true)
      expect(result.blockStart).toBe(3)
      expect(result.blockEnd).toBe(16)
      expect(result.partialBlockId).toBe('block')
    })

    it('应该检测未完成的块引用', () => {
      const text = '这是 ((block'
      const result = BlockReferenceParser.findPotentialBlockReference(text, 10)

      expect(result.isInBlockReference).toBe(true)
      expect(result.blockStart).toBe(3)
      expect(result.blockEnd).toBeUndefined()
      expect(result.partialBlockId).toBe('block')
    })

    it('应该处理光标不在块引用中的情况', () => {
      const text = '这是普通文本'
      const result = BlockReferenceParser.findPotentialBlockReference(text, 5)

      expect(result.isInBlockReference).toBe(false)
    })

    it('应该处理边界情况', () => {
      expect(BlockReferenceParser.findPotentialBlockReference('', 0).isInBlockReference).toBe(false)
      expect(BlockReferenceParser.findPotentialBlockReference('text', -1).isInBlockReference).toBe(false)
      expect(BlockReferenceParser.findPotentialBlockReference('text', 10).isInBlockReference).toBe(false)
    })
  })

  describe('generateSuggestions', () => {
    const availableBlocks: BlockSuggestion[] = [
      {
        blockId: 'tech-doc-1',
        preview: '技术文档的第一段',
        blockType: 'paragraph',
        pageName: '技术文档',
        score: 0
      },
      {
        blockId: 'tech-spec-1',
        preview: '技术规范的标题',
        blockType: 'heading',
        pageName: '技术规范',
        score: 0
      },
      {
        blockId: 'user-guide-1',
        preview: '用户指南的介绍',
        blockType: 'paragraph',
        pageName: '用户指南',
        score: 0
      },
      {
        blockId: 'api-doc-1',
        preview: 'API文档的概述',
        blockType: 'paragraph',
        pageName: 'API文档',
        score: 0
      }
    ]

    it('应该生成精确匹配的建议', () => {
      const suggestions = BlockReferenceParser.generateSuggestions('tech-doc-1', availableBlocks)
      expect(suggestions[0].blockId).toBe('tech-doc-1')
      expect(suggestions[0].score).toBe(100)
    })

    it('应该生成前缀匹配的建议', () => {
      const suggestions = BlockReferenceParser.generateSuggestions('tech', availableBlocks)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.some(s => s.blockId === 'tech-doc-1')).toBe(true)
      expect(suggestions.some(s => s.blockId === 'tech-spec-1')).toBe(true)
    })

    it('应该生成内容匹配的建议', () => {
      const suggestions = BlockReferenceParser.generateSuggestions('文档', availableBlocks)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.every(s => s.preview.includes('文档') || s.pageName.includes('文档'))).toBe(true)
    })

    it('应该限制建议数量', () => {
      const suggestions = BlockReferenceParser.generateSuggestions('', availableBlocks, 2)
      expect(suggestions.length).toBeLessThanOrEqual(2)
    })

    it('应该处理空查询', () => {
      const suggestions = BlockReferenceParser.generateSuggestions('', availableBlocks)
      expect(suggestions.length).toBe(availableBlocks.length)
    })

    it('应该处理无匹配的查询', () => {
      const suggestions = BlockReferenceParser.generateSuggestions('nonexistent', availableBlocks)
      expect(suggestions.length).toBe(0)
    })
  })

  describe('getBlockReferenceStats', () => {
    it('应该统计块引用信息', () => {
      const text = '参考 ((block-A)) 和 ((block-B)) 以及 ((block-A)) 再次'
      const stats = BlockReferenceParser.getBlockReferenceStats(text)

      expect(stats).toEqual({
        totalReferences: 3,
        uniqueBlocks: 2,
        hasReferences: true,
        blockIds: ['block-A', 'block-B']
      })
    })

    it('应该处理空文本', () => {
      const stats = BlockReferenceParser.getBlockReferenceStats('')

      expect(stats).toEqual({
        totalReferences: 0,
        uniqueBlocks: 0,
        hasReferences: false,
        blockIds: []
      })
    })

    it('应该处理无引用文本', () => {
      const stats = BlockReferenceParser.getBlockReferenceStats('普通文本没有引用')

      expect(stats).toEqual({
        totalReferences: 0,
        uniqueBlocks: 0,
        hasReferences: false,
        blockIds: []
      })
    })
  })
})
