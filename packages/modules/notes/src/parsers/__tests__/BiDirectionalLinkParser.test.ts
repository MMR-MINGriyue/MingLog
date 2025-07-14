import { describe, it, expect } from 'vitest'
import BiDirectionalLinkParser, { LinkMatch, ParseResult } from '../BiDirectionalLinkParser'

describe('BiDirectionalLinkParser', () => {
  describe('parse', () => {
    it('应该解析简单的双向链接', () => {
      const text = '这是一个 [[测试页面]] 的链接'
      const result = BiDirectionalLinkParser.parse(text)

      expect(result.hasLinks).toBe(true)
      expect(result.links).toHaveLength(1)
      expect(result.links[0]).toEqual({
        fullMatch: '[[测试页面]]',
        pageName: '测试页面',
        displayText: undefined,
        startIndex: 5,
        endIndex: 13,
        type: 'page'
      })
    })

    it('应该解析带别名的双向链接', () => {
      const text = '查看 [[技术文档|文档]] 了解更多'
      const result = BiDirectionalLinkParser.parse(text)

      expect(result.hasLinks).toBe(true)
      expect(result.links).toHaveLength(1)
      expect(result.links[0]).toEqual({
        fullMatch: '[[技术文档|文档]]',
        pageName: '技术文档',
        displayText: '文档',
        startIndex: 3,
        endIndex: 14,
        type: 'alias'
      })
    })

    it('应该解析多个双向链接', () => {
      const text = '参考 [[页面A]] 和 [[页面B|B页面]] 的内容'
      const result = BiDirectionalLinkParser.parse(text)

      expect(result.hasLinks).toBe(true)
      expect(result.links).toHaveLength(2)
      
      expect(result.links[0].pageName).toBe('页面A')
      expect(result.links[0].type).toBe('page')
      
      expect(result.links[1].pageName).toBe('页面B')
      expect(result.links[1].displayText).toBe('B页面')
      expect(result.links[1].type).toBe('alias')
    })

    it('应该处理空文本', () => {
      const result = BiDirectionalLinkParser.parse('')
      
      expect(result.hasLinks).toBe(false)
      expect(result.links).toHaveLength(0)
      expect(result.originalText).toBe('')
      expect(result.processedText).toBe('')
    })

    it('应该处理无链接的文本', () => {
      const text = '这是普通文本，没有链接'
      const result = BiDirectionalLinkParser.parse(text)

      expect(result.hasLinks).toBe(false)
      expect(result.links).toHaveLength(0)
      expect(result.originalText).toBe(text)
      expect(result.processedText).toBe(text)
    })

    it('应该忽略无效的链接格式', () => {
      const text = '这些不是有效链接：[单括号] [[]] [[|别名]] [[页面|]]'
      const result = BiDirectionalLinkParser.parse(text)

      expect(result.hasLinks).toBe(false)
      expect(result.links).toHaveLength(0)
    })

    it('应该处理包含特殊字符的页面名', () => {
      const text = '链接到 [[项目-2024]] 和 [[API_文档]] 页面'
      const result = BiDirectionalLinkParser.parse(text)

      expect(result.hasLinks).toBe(true)
      expect(result.links).toHaveLength(2)
      expect(result.links[0].pageName).toBe('项目-2024')
      expect(result.links[1].pageName).toBe('API_文档')
    })
  })

  describe('extractPageNames', () => {
    it('应该提取所有页面名称', () => {
      const text = '参考 [[页面A]] 和 [[页面B|显示B]] 以及 [[页面A]] 再次'
      const pageNames = BiDirectionalLinkParser.extractPageNames(text)

      expect(pageNames).toEqual(['页面A', '页面B'])
      expect(pageNames).toHaveLength(2) // 应该去重
    })

    it('应该处理空文本', () => {
      const pageNames = BiDirectionalLinkParser.extractPageNames('')
      expect(pageNames).toEqual([])
    })
  })

  describe('hasLinks', () => {
    it('应该正确检测包含链接的文本', () => {
      expect(BiDirectionalLinkParser.hasLinks('包含 [[链接]] 的文本')).toBe(true)
      expect(BiDirectionalLinkParser.hasLinks('[[开头链接]] 文本')).toBe(true)
      expect(BiDirectionalLinkParser.hasLinks('文本 [[结尾链接]]')).toBe(true)
    })

    it('应该正确检测不包含链接的文本', () => {
      expect(BiDirectionalLinkParser.hasLinks('普通文本')).toBe(false)
      expect(BiDirectionalLinkParser.hasLinks('[单括号]')).toBe(false)
      expect(BiDirectionalLinkParser.hasLinks('')).toBe(false)
    })
  })

  describe('isValidPageName', () => {
    it('应该接受有效的页面名称', () => {
      expect(BiDirectionalLinkParser.isValidPageName('普通页面')).toBe(true)
      expect(BiDirectionalLinkParser.isValidPageName('Page-123')).toBe(true)
      expect(BiDirectionalLinkParser.isValidPageName('API_文档')).toBe(true)
      expect(BiDirectionalLinkParser.isValidPageName('项目 2024')).toBe(true)
    })

    it('应该拒绝无效的页面名称', () => {
      expect(BiDirectionalLinkParser.isValidPageName('')).toBe(false)
      expect(BiDirectionalLinkParser.isValidPageName('   ')).toBe(false)
      expect(BiDirectionalLinkParser.isValidPageName('包含/斜杠')).toBe(false)
      expect(BiDirectionalLinkParser.isValidPageName('包含|管道')).toBe(false)
      expect(BiDirectionalLinkParser.isValidPageName('包含<尖括号>')).toBe(false)
    })

    it('应该拒绝过长的页面名称', () => {
      const longName = 'a'.repeat(256)
      expect(BiDirectionalLinkParser.isValidPageName(longName)).toBe(false)
    })
  })

  describe('createLink', () => {
    it('应该创建简单链接', () => {
      const link = BiDirectionalLinkParser.createLink('测试页面')
      expect(link).toBe('[[测试页面]]')
    })

    it('应该创建带别名的链接', () => {
      const link = BiDirectionalLinkParser.createLink('技术文档', '文档')
      expect(link).toBe('[[技术文档|文档]]')
    })

    it('应该忽略相同的显示文本', () => {
      const link = BiDirectionalLinkParser.createLink('页面名', '页面名')
      expect(link).toBe('[[页面名]]')
    })

    it('应该抛出无效页面名称的错误', () => {
      expect(() => BiDirectionalLinkParser.createLink('')).toThrow('Invalid page name')
      expect(() => BiDirectionalLinkParser.createLink('包含|管道')).toThrow('Invalid page name')
    })
  })

  describe('findPotentialLink', () => {
    it('应该检测光标在链接中的情况', () => {
      const text = '这是 [[测试页面]] 的链接'
      const result = BiDirectionalLinkParser.findPotentialLink(text, 7) // 光标在 "测试" 之间

      expect(result.isInLink).toBe(true)
      expect(result.linkStart).toBe(3)
      expect(result.linkEnd).toBe(11)
      expect(result.partialPageName).toBe('测试')
    })

    it('应该检测未完成的链接', () => {
      const text = '这是 [[测试'
      const result = BiDirectionalLinkParser.findPotentialLink(text, 7)

      expect(result.isInLink).toBe(true)
      expect(result.linkStart).toBe(3)
      expect(result.linkEnd).toBeUndefined()
      expect(result.partialPageName).toBe('测试')
    })

    it('应该处理光标不在链接中的情况', () => {
      const text = '这是普通文本'
      const result = BiDirectionalLinkParser.findPotentialLink(text, 5)

      expect(result.isInLink).toBe(false)
    })

    it('应该处理带别名的链接', () => {
      const text = '查看 [[技术文档|文档]] 了解'
      const result = BiDirectionalLinkParser.findPotentialLink(text, 9) // 光标在 "技术文档" 之后

      expect(result.isInLink).toBe(true)
      expect(result.partialPageName).toBe('技术文档')
    })
  })

  describe('generateSuggestions', () => {
    const availablePages = [
      '技术文档',
      '技术规范',
      '项目文档',
      '用户手册',
      'API文档',
      '测试文档'
    ]

    it('应该生成精确匹配的建议', () => {
      const suggestions = BiDirectionalLinkParser.generateSuggestions('技术文档', availablePages)
      expect(suggestions[0]).toBe('技术文档')
    })

    it('应该生成前缀匹配的建议', () => {
      const suggestions = BiDirectionalLinkParser.generateSuggestions('技术', availablePages)
      expect(suggestions).toContain('技术文档')
      expect(suggestions).toContain('技术规范')
    })

    it('应该生成包含匹配的建议', () => {
      const suggestions = BiDirectionalLinkParser.generateSuggestions('文档', availablePages)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.every(s => s.includes('文档'))).toBe(true)
    })

    it('应该限制建议数量', () => {
      const suggestions = BiDirectionalLinkParser.generateSuggestions('文档', availablePages, 2)
      expect(suggestions.length).toBeLessThanOrEqual(2)
    })

    it('应该处理空查询', () => {
      const suggestions = BiDirectionalLinkParser.generateSuggestions('', availablePages)
      expect(suggestions).toEqual([])
    })

    it('应该处理不匹配的查询', () => {
      const suggestions = BiDirectionalLinkParser.generateSuggestions('不存在', availablePages)
      expect(suggestions).toEqual([])
    })
  })
})
