/**
 * 模板管理器测试
 * 测试模板的创建、管理、过滤和应用功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TemplateManager, MindMapTemplate, TemplateCategory } from '../TemplateManager'
import { MindMapData } from '../../types'

describe('TemplateManager', () => {
  let templateManager: TemplateManager

  beforeEach(() => {
    templateManager = new TemplateManager()
  })

  describe('基础功能', () => {
    it('应该初始化内置模板', () => {
      const templates = templateManager.getAllTemplates()
      expect(templates.length).toBeGreaterThan(0)
      
      // 检查是否有内置模板
      const builtInTemplates = templates.filter(t => t.isBuiltIn)
      expect(builtInTemplates.length).toBeGreaterThan(0)
    })

    it('应该包含基础思维导图模板', () => {
      const templates = templateManager.getAllTemplates()
      const basicTemplate = templates.find(t => t.name === '基础思维导图')
      
      expect(basicTemplate).toBeDefined()
      expect(basicTemplate?.isBuiltIn).toBe(true)
      expect(basicTemplate?.data.nodes.length).toBeGreaterThan(0)
    })

    it('应该包含项目规划模板', () => {
      const templates = templateManager.getAllTemplates()
      const projectTemplate = templates.find(t => t.name === '项目规划')
      
      expect(projectTemplate).toBeDefined()
      expect(projectTemplate?.category).toBe('project')
      expect(projectTemplate?.data.nodes.length).toBeGreaterThan(1)
    })
  })

  describe('模板获取和过滤', () => {
    it('应该能够根据分类过滤模板', () => {
      const businessTemplates = templateManager.getTemplates({ category: 'business' })
      const projectTemplates = templateManager.getTemplates({ category: 'project' })
      
      businessTemplates.forEach(template => {
        expect(template.category).toBe('business')
      })
      
      projectTemplates.forEach(template => {
        expect(template.category).toBe('project')
      })
    })

    it('应该能够根据标签过滤模板', () => {
      const planningTemplates = templateManager.getTemplates({ tags: ['规划'] })
      
      planningTemplates.forEach(template => {
        expect(template.tags.some(tag => tag.includes('规划'))).toBe(true)
      })
    })

    it('应该能够根据搜索关键词过滤模板', () => {
      const searchResults = templateManager.getTemplates({ search: '项目' })
      
      searchResults.forEach(template => {
        const matchesName = template.name.includes('项目')
        const matchesDescription = template.description.includes('项目')
        const matchesTags = template.tags.some(tag => tag.includes('项目'))
        
        expect(matchesName || matchesDescription || matchesTags).toBe(true)
      })
    })

    it('应该能够只显示收藏模板', () => {
      // 先收藏一个模板
      const templates = templateManager.getAllTemplates()
      const templateToFavorite = templates[0]
      templateManager.toggleFavorite(templateToFavorite.id)
      
      const favoriteTemplates = templateManager.getTemplates({ favoritesOnly: true })
      
      favoriteTemplates.forEach(template => {
        expect(template.isFavorite).toBe(true)
      })
    })

    it('应该能够只显示内置模板', () => {
      const builtInTemplates = templateManager.getTemplates({ builtInOnly: true })
      
      builtInTemplates.forEach(template => {
        expect(template.isBuiltIn).toBe(true)
      })
    })
  })

  describe('模板应用', () => {
    it('应该能够应用模板并增加使用次数', () => {
      const templates = templateManager.getAllTemplates()
      const template = templates[0]
      const initialUsageCount = template.usageCount
      
      const appliedData = templateManager.applyTemplate(template.id)
      
      expect(appliedData).toBeDefined()
      expect(appliedData.nodes.length).toBeGreaterThan(0)
      expect(template.usageCount).toBe(initialUsageCount + 1)
    })

    it('应该深拷贝模板数据，避免修改原模板', () => {
      const templates = templateManager.getAllTemplates()
      const template = templates[0]
      const originalNodeCount = template.data.nodes.length
      
      const appliedData = templateManager.applyTemplate(template.id)
      
      // 修改应用的数据
      appliedData.nodes.push({
        id: 'new-node',
        text: '新节点',
        level: 1,
        children: []
      })
      
      // 原模板数据不应该被修改
      expect(template.data.nodes.length).toBe(originalNodeCount)
    })

    it('应该在应用不存在的模板时抛出错误', () => {
      expect(() => {
        templateManager.applyTemplate('non-existent-template')
      }).toThrow('模板不存在')
    })
  })

  describe('自定义模板管理', () => {
    it('应该能够创建自定义模板', () => {
      const customData: MindMapData = {
        nodes: [
          {
            id: 'custom-root',
            text: '自定义模板',
            level: 0,
            children: []
          }
        ],
        links: [],
        rootId: 'custom-root'
      }

      const customTemplate = templateManager.createTemplate(
        '自定义模板',
        '这是一个自定义模板',
        'other',
        customData,
        ['自定义', '测试']
      )

      expect(customTemplate.name).toBe('自定义模板')
      expect(customTemplate.category).toBe('other')
      expect(customTemplate.isBuiltIn).toBe(false)
      expect(customTemplate.tags).toContain('自定义')
      
      // 验证模板已添加到管理器中
      const retrievedTemplate = templateManager.getTemplate(customTemplate.id)
      expect(retrievedTemplate).toBeDefined()
      expect(retrievedTemplate?.name).toBe('自定义模板')
    })

    it('应该能够删除自定义模板', () => {
      const customData: MindMapData = {
        nodes: [{ id: 'test', text: '测试', level: 0, children: [] }],
        links: [],
        rootId: 'test'
      }

      const customTemplate = templateManager.createTemplate(
        '待删除模板',
        '这个模板将被删除',
        'other',
        customData
      )

      const deleteResult = templateManager.deleteTemplate(customTemplate.id)
      expect(deleteResult).toBe(true)
      
      const retrievedTemplate = templateManager.getTemplate(customTemplate.id)
      expect(retrievedTemplate).toBeUndefined()
    })

    it('应该不能删除内置模板', () => {
      const builtInTemplates = templateManager.getTemplates({ builtInOnly: true })
      const builtInTemplate = builtInTemplates[0]

      expect(() => {
        templateManager.deleteTemplate(builtInTemplate.id)
      }).toThrow('不能删除内置模板')
    })
  })

  describe('收藏功能', () => {
    it('应该能够切换模板收藏状态', () => {
      const templates = templateManager.getAllTemplates()
      const template = templates[0]
      const initialFavoriteState = template.isFavorite

      const newFavoriteState = templateManager.toggleFavorite(template.id)
      expect(newFavoriteState).toBe(!initialFavoriteState)
      expect(template.isFavorite).toBe(!initialFavoriteState)

      // 再次切换
      const finalFavoriteState = templateManager.toggleFavorite(template.id)
      expect(finalFavoriteState).toBe(initialFavoriteState)
      expect(template.isFavorite).toBe(initialFavoriteState)
    })

    it('应该在切换不存在模板的收藏状态时返回false', () => {
      const result = templateManager.toggleFavorite('non-existent-template')
      expect(result).toBe(false)
    })
  })

  describe('统计信息', () => {
    it('应该提供正确的统计信息', () => {
      const stats = templateManager.getStats()
      
      expect(stats.total).toBeGreaterThan(0)
      expect(typeof stats.byCategory).toBe('object')
      expect(Array.isArray(stats.mostUsed)).toBe(true)
      expect(Array.isArray(stats.recentlyUsed)).toBe(true)
      
      // 验证分类统计
      const categories: TemplateCategory[] = ['business', 'education', 'personal', 'project', 'creative', 'analysis', 'planning', 'other']
      categories.forEach(category => {
        expect(typeof stats.byCategory[category]).toBe('number')
        expect(stats.byCategory[category]).toBeGreaterThanOrEqual(0)
      })
    })

    it('应该正确统计各分类的模板数量', () => {
      const stats = templateManager.getStats()
      const allTemplates = templateManager.getAllTemplates()
      
      // 手动计算各分类数量
      const manualCount: Record<TemplateCategory, number> = {
        business: 0, education: 0, personal: 0, project: 0,
        creative: 0, analysis: 0, planning: 0, other: 0
      }
      
      allTemplates.forEach(template => {
        manualCount[template.category]++
      })
      
      // 验证统计结果
      Object.keys(manualCount).forEach(category => {
        expect(stats.byCategory[category as TemplateCategory]).toBe(manualCount[category as TemplateCategory])
      })
    })
  })

  describe('分类信息', () => {
    it('应该提供完整的分类信息', () => {
      const categoryInfo = templateManager.getCategoryInfo()
      
      expect(categoryInfo.length).toBe(8) // 8个分类
      
      categoryInfo.forEach(info => {
        expect(info.category).toBeDefined()
        expect(info.name).toBeDefined()
        expect(info.description).toBeDefined()
        expect(info.icon).toBeDefined()
        expect(typeof info.count).toBe('number')
        expect(info.count).toBeGreaterThanOrEqual(0)
      })
    })

    it('应该包含所有预期的分类', () => {
      const categoryInfo = templateManager.getCategoryInfo()
      const categories = categoryInfo.map(info => info.category)
      
      const expectedCategories: TemplateCategory[] = [
        'business', 'education', 'personal', 'project',
        'creative', 'analysis', 'planning', 'other'
      ]
      
      expectedCategories.forEach(category => {
        expect(categories).toContain(category)
      })
    })
  })

  describe('最近使用记录', () => {
    it('应该记录最近使用的模板', () => {
      const templates = templateManager.getAllTemplates()
      const template1 = templates[0]
      const template2 = templates[1]
      
      // 应用模板
      templateManager.applyTemplate(template1.id)
      templateManager.applyTemplate(template2.id)
      
      const stats = templateManager.getStats()
      expect(stats.recentlyUsed.length).toBeGreaterThan(0)
      expect(stats.recentlyUsed[0].id).toBe(template2.id) // 最近使用的在前面
    })
  })
})
