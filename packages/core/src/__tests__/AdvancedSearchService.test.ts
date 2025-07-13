/**
 * 高级搜索服务测试
 * 测试多条件搜索、正则表达式搜索、查询保存等功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  AdvancedSearchService,
  SearchCondition,
  SearchConditionGroup,
  SearchConditionType,
  SearchOperator
} from '../services/AdvancedSearchService'
import { DataAssociationService, EntityType } from '../services/DataAssociationService'
import { CrossModuleEventBus } from '../services/CrossModuleEventBus'

// 模拟核心API
const mockCoreAPI = {
  events: {
    emit: vi.fn()
  }
}

describe('AdvancedSearchService', () => {
  let advancedSearchService: AdvancedSearchService
  let dataAssociationService: DataAssociationService
  let eventBus: CrossModuleEventBus

  beforeEach(() => {
    vi.clearAllMocks()
    dataAssociationService = new DataAssociationService(mockCoreAPI)
    eventBus = new CrossModuleEventBus()
    advancedSearchService = new AdvancedSearchService(dataAssociationService, eventBus)
  })

  describe('多条件搜索', () => {
    it('应该能够执行简单的文本搜索', async () => {
      // 注册测试数据
      await dataAssociationService.registerSearchEntity(
        EntityType.NOTE,
        'note-1',
        '重要笔记',
        '这是一个重要的笔记内容'
      )

      const condition: SearchCondition = {
        id: 'condition-1',
        type: SearchConditionType.TEXT,
        operator: SearchOperator.AND,
        value: '重要',
        enabled: true
      }

      const conditionGroup: SearchConditionGroup = {
        id: 'group-1',
        name: '测试搜索',
        operator: SearchOperator.AND,
        conditions: [condition],
        enabled: true
      }

      const results = await advancedSearchService.advancedSearch(conditionGroup)

      expect(results).toBeDefined()
      expect(results.totalResults).toBeGreaterThan(0)
      expect(results.results.some(r => r.title.includes('重要'))).toBe(true)
    })

    it('应该能够执行AND操作的多条件搜索', async () => {
      // 注册测试数据
      await dataAssociationService.registerSearchEntity(
        EntityType.NOTE,
        'note-1',
        '重要笔记',
        '这是一个重要的笔记内容'
      )
      await dataAssociationService.registerSearchEntity(
        EntityType.NOTE,
        'note-2',
        '重要任务',
        '这是一个重要的任务描述'
      )
      await dataAssociationService.registerSearchEntity(
        EntityType.NOTE,
        'note-3',
        '普通笔记',
        '这是一个普通的内容'
      )

      const condition1: SearchCondition = {
        id: 'condition-1',
        type: SearchConditionType.TEXT,
        operator: SearchOperator.AND,
        value: '重要',
        enabled: true
      }

      const condition2: SearchCondition = {
        id: 'condition-2',
        type: SearchConditionType.TEXT,
        operator: SearchOperator.AND,
        value: '笔记',
        enabled: true
      }

      const conditionGroup: SearchConditionGroup = {
        id: 'group-1',
        name: 'AND搜索',
        operator: SearchOperator.AND,
        conditions: [condition1, condition2],
        enabled: true
      }

      const results = await advancedSearchService.advancedSearch(conditionGroup)

      expect(results.totalResults).toBe(1)
      expect(results.results[0].title).toBe('重要笔记')
    })

    it('应该能够执行OR操作的多条件搜索', async () => {
      // 注册测试数据
      await dataAssociationService.registerSearchEntity(
        EntityType.NOTE,
        'note-1',
        '重要笔记',
        '这是一个重要的笔记内容'
      )
      await dataAssociationService.registerSearchEntity(
        EntityType.TASK,
        'task-1',
        '紧急任务',
        '这是一个紧急的任务描述'
      )

      const condition1: SearchCondition = {
        id: 'condition-1',
        type: SearchConditionType.TEXT,
        operator: SearchOperator.OR,
        value: '重要',
        enabled: true
      }

      const condition2: SearchCondition = {
        id: 'condition-2',
        type: SearchConditionType.TEXT,
        operator: SearchOperator.OR,
        value: '紧急',
        enabled: true
      }

      const conditionGroup: SearchConditionGroup = {
        id: 'group-1',
        name: 'OR搜索',
        operator: SearchOperator.OR,
        conditions: [condition1, condition2],
        enabled: true
      }

      const results = await advancedSearchService.advancedSearch(conditionGroup)

      expect(results.totalResults).toBe(2)
      expect(results.results.some(r => r.title.includes('重要'))).toBe(true)
      expect(results.results.some(r => r.title.includes('紧急'))).toBe(true)
    })

    it('应该能够处理嵌套的条件组', async () => {
      // 注册测试数据
      await dataAssociationService.registerSearchEntity(
        EntityType.NOTE,
        'note-1',
        '重要笔记',
        '这是一个重要的笔记内容'
      )

      const innerCondition: SearchCondition = {
        id: 'inner-condition',
        type: SearchConditionType.TEXT,
        operator: SearchOperator.AND,
        value: '重要',
        enabled: true
      }

      const innerGroup: SearchConditionGroup = {
        id: 'inner-group',
        name: '内部条件组',
        operator: SearchOperator.AND,
        conditions: [innerCondition],
        enabled: true
      }

      const outerCondition: SearchCondition = {
        id: 'outer-condition',
        type: SearchConditionType.TEXT,
        operator: SearchOperator.AND,
        value: '笔记',
        enabled: true
      }

      const outerGroup: SearchConditionGroup = {
        id: 'outer-group',
        name: '外部条件组',
        operator: SearchOperator.AND,
        conditions: [innerGroup, outerCondition],
        enabled: true
      }

      const results = await advancedSearchService.advancedSearch(outerGroup)

      expect(results.totalResults).toBe(1)
      expect(results.results[0].title).toBe('重要笔记')
    })

    it('应该能够处理禁用的条件', async () => {
      // 注册测试数据
      await dataAssociationService.registerSearchEntity(
        EntityType.NOTE,
        'note-1',
        '重要笔记',
        '这是一个重要的笔记内容'
      )

      const enabledCondition: SearchCondition = {
        id: 'enabled-condition',
        type: SearchConditionType.TEXT,
        operator: SearchOperator.AND,
        value: '重要',
        enabled: true
      }

      const disabledCondition: SearchCondition = {
        id: 'disabled-condition',
        type: SearchConditionType.TEXT,
        operator: SearchOperator.AND,
        value: '不存在的内容',
        enabled: false
      }

      const conditionGroup: SearchConditionGroup = {
        id: 'group-1',
        name: '禁用条件测试',
        operator: SearchOperator.AND,
        conditions: [enabledCondition, disabledCondition],
        enabled: true
      }

      const results = await advancedSearchService.advancedSearch(conditionGroup)

      expect(results.totalResults).toBe(1)
      expect(results.results[0].title).toBe('重要笔记')
    })
  })

  describe('正则表达式搜索', () => {
    beforeEach(async () => {
      // 注册测试数据
      await dataAssociationService.registerSearchEntity(
        EntityType.NOTE,
        'note-1',
        '测试笔记123',
        '这是一个包含数字456的内容'
      )
      await dataAssociationService.registerSearchEntity(
        EntityType.NOTE,
        'note-2',
        '普通笔记',
        '这是一个普通的内容'
      )
    })

    it('应该能够执行正则表达式搜索', async () => {
      const results = await advancedSearchService.regexSearch('\\d+', ['title', 'content'])

      expect(results.totalResults).toBe(1)
      expect(results.results[0].title).toBe('测试笔记123')
    })

    it('应该在无效正则表达式时抛出错误', async () => {
      await expect(advancedSearchService.regexSearch('[invalid'))
        .rejects.toThrow('无效的正则表达式')
    })

    it('应该能够在指定字段中搜索', async () => {
      const results = await advancedSearchService.regexSearch('\\d+', ['content'])

      expect(results.totalResults).toBe(1)
      expect(results.results[0].content).toContain('456')
    })
  })

  describe('保存的搜索查询', () => {
    let testConditionGroup: SearchConditionGroup

    beforeEach(() => {
      testConditionGroup = {
        id: 'test-group',
        name: '测试条件组',
        operator: SearchOperator.AND,
        conditions: [{
          id: 'test-condition',
          type: SearchConditionType.TEXT,
          operator: SearchOperator.AND,
          value: '测试',
          enabled: true
        }],
        enabled: true
      }
    })

    it('应该能够保存搜索查询', async () => {
      const savedQuery = await advancedSearchService.saveSearchQuery(
        '我的搜索',
        testConditionGroup,
        { limit: 10 },
        {
          description: '这是一个测试搜索',
          tags: ['测试', '重要'],
          isPublic: false
        }
      )

      expect(savedQuery).toBeDefined()
      expect(savedQuery.id).toBeDefined()
      expect(savedQuery.name).toBe('我的搜索')
      expect(savedQuery.description).toBe('这是一个测试搜索')
      expect(savedQuery.tags).toEqual(['测试', '重要'])
      expect(savedQuery.isPublic).toBe(false)
      expect(savedQuery.useCount).toBe(0)
      expect(savedQuery.createdAt).toBeInstanceOf(Date)
    })

    it('应该能够获取保存的搜索查询', async () => {
      await advancedSearchService.saveSearchQuery(
        '查询1',
        testConditionGroup,
        { limit: 10 },
        { tags: ['标签1'] }
      )

      await advancedSearchService.saveSearchQuery(
        '查询2',
        testConditionGroup,
        { limit: 20 },
        { tags: ['标签2'], isPublic: true }
      )

      const allQueries = advancedSearchService.getSavedSearchQueries()
      expect(allQueries).toHaveLength(2)

      const publicQueries = advancedSearchService.getSavedSearchQueries({ isPublic: true })
      expect(publicQueries).toHaveLength(1)
      expect(publicQueries[0].name).toBe('查询2')

      const taggedQueries = advancedSearchService.getSavedSearchQueries({ tags: ['标签1'] })
      expect(taggedQueries).toHaveLength(1)
      expect(taggedQueries[0].name).toBe('查询1')
    })

    it('应该能够执行保存的搜索查询', async () => {
      // 注册测试数据
      await dataAssociationService.registerSearchEntity(
        EntityType.NOTE,
        'note-1',
        '测试笔记',
        '这是一个测试内容'
      )

      const savedQuery = await advancedSearchService.saveSearchQuery(
        '测试搜索',
        testConditionGroup,
        { limit: 10 }
      )

      const results = await advancedSearchService.executeSavedQuery(savedQuery.id)

      expect(results).toBeDefined()
      expect(results.totalResults).toBeGreaterThan(0)

      // 验证使用统计更新
      const updatedQueries = advancedSearchService.getSavedSearchQueries()
      const updatedQuery = updatedQueries.find(q => q.id === savedQuery.id)
      expect(updatedQuery?.useCount).toBe(1)
      expect(updatedQuery?.lastUsed).toBeInstanceOf(Date)
    })

    it('应该能够删除保存的搜索查询', async () => {
      const savedQuery = await advancedSearchService.saveSearchQuery(
        '要删除的查询',
        testConditionGroup,
        { limit: 10 }
      )

      const deleted = await advancedSearchService.deleteSavedQuery(savedQuery.id)
      expect(deleted).toBe(true)

      const queries = advancedSearchService.getSavedSearchQueries()
      expect(queries.find(q => q.id === savedQuery.id)).toBeUndefined()
    })

    it('应该在执行不存在的查询时抛出错误', async () => {
      await expect(advancedSearchService.executeSavedQuery('non-existent'))
        .rejects.toThrow('保存的搜索查询不存在')
    })
  })

  describe('搜索模板', () => {
    it('应该能够获取内置搜索模板', () => {
      const templates = advancedSearchService.getSearchTemplates()
      
      expect(templates.length).toBeGreaterThan(0)
      expect(templates.some(t => t.isBuiltIn)).toBe(true)
    })

    it('应该能够按类别过滤模板', () => {
      const commonTemplates = advancedSearchService.getSearchTemplates('常用')
      
      expect(commonTemplates.every(t => t.category === '常用')).toBe(true)
    })

    it('应该能够从模板创建搜索查询', () => {
      const templates = advancedSearchService.getSearchTemplates()
      const template = templates[0]
      
      const query = advancedSearchService.createSearchFromTemplate(template.id)
      
      expect(query).toBeDefined()
      expect(query.conditions.length).toBeGreaterThan(0)
    })

    it('应该在使用不存在的模板时抛出错误', () => {
      expect(() => advancedSearchService.createSearchFromTemplate('non-existent'))
        .toThrow('搜索模板不存在')
    })
  })

  describe('搜索建议', () => {
    it('应该能够获取搜索建议', async () => {
      const conditionGroup: SearchConditionGroup = {
        id: 'test-group',
        name: '测试',
        operator: SearchOperator.AND,
        conditions: [{
          id: 'test-condition',
          type: SearchConditionType.TEXT,
          operator: SearchOperator.AND,
          value: '测试',
          enabled: true
        }],
        enabled: true
      }

      const suggestions = await advancedSearchService.getAdvancedSuggestions(conditionGroup)
      
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.every(s => s.score >= 0)).toBe(true)
    })
  })

  describe('性能和统计', () => {
    it('应该能够获取搜索性能统计', () => {
      const stats = advancedSearchService.getSearchPerformanceStats()
      
      expect(stats).toBeDefined()
      expect(typeof stats.averageSearchTime).toBe('number')
      expect(typeof stats.totalSearches).toBe('number')
      expect(Array.isArray(stats.popularConditionTypes)).toBe(true)
      expect(Array.isArray(stats.templateUsage)).toBe(true)
    })

    it('应该能够创建搜索会话', () => {
      const sessionId = advancedSearchService.createSearchSession()
      
      expect(typeof sessionId).toBe('string')
      expect(sessionId.length).toBeGreaterThan(0)
    })
  })

  describe('错误处理', () => {
    it('应该在空条件组时返回空结果', async () => {
      const emptyGroup: SearchConditionGroup = {
        id: 'empty-group',
        name: '空条件组',
        operator: SearchOperator.AND,
        conditions: [],
        enabled: true
      }

      const results = await advancedSearchService.advancedSearch(emptyGroup)
      
      expect(results.totalResults).toBe(0)
      expect(results.results).toHaveLength(0)
    })

    it('应该能够处理搜索过程中的错误', async () => {
      // 创建一个会导致错误的条件
      const errorCondition: SearchCondition = {
        id: 'error-condition',
        type: 'invalid-type' as any,
        operator: SearchOperator.AND,
        value: 'test',
        enabled: true
      }

      const conditionGroup: SearchConditionGroup = {
        id: 'error-group',
        name: '错误条件组',
        operator: SearchOperator.AND,
        conditions: [errorCondition],
        enabled: true
      }

      const results = await advancedSearchService.advancedSearch(conditionGroup)
      
      // 应该返回空结果而不是抛出错误
      expect(results.totalResults).toBe(0)
    })
  })
})
