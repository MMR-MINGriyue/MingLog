/**
 * 思维导图模板管理器
 * 提供模板的创建、管理、分类和应用功能
 */

import { MindMapData, MindMapNode, MindMapLink } from '../types'

export interface MindMapTemplate {
  /** 模板ID */
  id: string
  /** 模板名称 */
  name: string
  /** 模板描述 */
  description: string
  /** 模板分类 */
  category: TemplateCategory
  /** 模板标签 */
  tags: string[]
  /** 模板预览图 */
  thumbnail?: string
  /** 模板数据 */
  data: MindMapData
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
  /** 作者信息 */
  author?: {
    name: string
    email?: string
  }
  /** 使用次数 */
  usageCount: number
  /** 是否为内置模板 */
  isBuiltIn: boolean
  /** 是否为收藏模板 */
  isFavorite: boolean
}

export type TemplateCategory = 
  | 'business' 
  | 'education' 
  | 'personal' 
  | 'project' 
  | 'creative' 
  | 'analysis' 
  | 'planning'
  | 'other'

export interface TemplateFilter {
  /** 分类过滤 */
  category?: TemplateCategory
  /** 标签过滤 */
  tags?: string[]
  /** 搜索关键词 */
  search?: string
  /** 是否只显示收藏 */
  favoritesOnly?: boolean
  /** 是否只显示内置模板 */
  builtInOnly?: boolean
}

export interface TemplateStats {
  /** 总模板数 */
  total: number
  /** 各分类统计 */
  byCategory: Record<TemplateCategory, number>
  /** 最受欢迎的模板 */
  mostUsed: MindMapTemplate[]
  /** 最近使用的模板 */
  recentlyUsed: MindMapTemplate[]
}

/**
 * 模板管理器类
 */
export class TemplateManager {
  private templates: Map<string, MindMapTemplate> = new Map()
  private recentlyUsed: string[] = []

  constructor() {
    this.initializeBuiltInTemplates()
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): MindMapTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * 根据过滤条件获取模板
   */
  getTemplates(filter?: TemplateFilter): MindMapTemplate[] {
    let templates = this.getAllTemplates()

    if (filter) {
      // 分类过滤
      if (filter.category) {
        templates = templates.filter(t => t.category === filter.category)
      }

      // 标签过滤
      if (filter.tags && filter.tags.length > 0) {
        templates = templates.filter(t => 
          filter.tags!.some(tag => t.tags.includes(tag))
        )
      }

      // 搜索过滤
      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        templates = templates.filter(t => 
          t.name.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          t.tags.some(tag => tag.toLowerCase().includes(searchLower))
        )
      }

      // 收藏过滤
      if (filter.favoritesOnly) {
        templates = templates.filter(t => t.isFavorite)
      }

      // 内置模板过滤
      if (filter.builtInOnly) {
        templates = templates.filter(t => t.isBuiltIn)
      }
    }

    // 按使用次数和更新时间排序
    return templates.sort((a, b) => {
      if (a.usageCount !== b.usageCount) {
        return b.usageCount - a.usageCount
      }
      return b.updatedAt.getTime() - a.updatedAt.getTime()
    })
  }

  /**
   * 根据ID获取模板
   */
  getTemplate(id: string): MindMapTemplate | undefined {
    return this.templates.get(id)
  }

  /**
   * 应用模板
   */
  applyTemplate(templateId: string): MindMapData {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`)
    }

    // 增加使用次数
    template.usageCount++
    template.updatedAt = new Date()

    // 更新最近使用记录
    this.updateRecentlyUsed(templateId)

    // 深拷贝模板数据，避免修改原模板
    return this.cloneTemplateData(template.data)
  }

  /**
   * 创建自定义模板
   */
  createTemplate(
    name: string,
    description: string,
    category: TemplateCategory,
    data: MindMapData,
    tags: string[] = []
  ): MindMapTemplate {
    const template: MindMapTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      category,
      tags,
      data: this.cloneTemplateData(data),
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      isBuiltIn: false,
      isFavorite: false
    }

    this.templates.set(template.id, template)
    return template
  }

  /**
   * 删除模板
   */
  deleteTemplate(templateId: string): boolean {
    const template = this.getTemplate(templateId)
    if (!template) {
      return false
    }

    if (template.isBuiltIn) {
      throw new Error('不能删除内置模板')
    }

    return this.templates.delete(templateId)
  }

  /**
   * 切换模板收藏状态
   */
  toggleFavorite(templateId: string): boolean {
    const template = this.getTemplate(templateId)
    if (!template) {
      return false
    }

    template.isFavorite = !template.isFavorite
    template.updatedAt = new Date()
    return template.isFavorite
  }

  /**
   * 获取模板统计信息
   */
  getStats(): TemplateStats {
    const templates = this.getAllTemplates()
    
    const byCategory: Record<TemplateCategory, number> = {
      business: 0,
      education: 0,
      personal: 0,
      project: 0,
      creative: 0,
      analysis: 0,
      planning: 0,
      other: 0
    }

    templates.forEach(template => {
      byCategory[template.category]++
    })

    const mostUsed = templates
      .filter(t => t.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)

    const recentlyUsed = this.recentlyUsed
      .map(id => this.getTemplate(id))
      .filter(t => t !== undefined) as MindMapTemplate[]

    return {
      total: templates.length,
      byCategory,
      mostUsed,
      recentlyUsed
    }
  }

  /**
   * 获取分类信息
   */
  getCategoryInfo(): Array<{
    category: TemplateCategory
    name: string
    description: string
    icon: string
    count: number
  }> {
    const stats = this.getStats()
    
    return [
      {
        category: 'business',
        name: '商业分析',
        description: '商业计划、市场分析、竞争分析等',
        icon: '💼',
        count: stats.byCategory.business
      },
      {
        category: 'education',
        name: '教育学习',
        description: '课程笔记、知识梳理、学习计划等',
        icon: '📚',
        count: stats.byCategory.education
      },
      {
        category: 'personal',
        name: '个人发展',
        description: '目标规划、技能提升、生活管理等',
        icon: '🌟',
        count: stats.byCategory.personal
      },
      {
        category: 'project',
        name: '项目管理',
        description: '项目规划、任务分解、进度跟踪等',
        icon: '📋',
        count: stats.byCategory.project
      },
      {
        category: 'creative',
        name: '创意设计',
        description: '头脑风暴、创意构思、设计思维等',
        icon: '🎨',
        count: stats.byCategory.creative
      },
      {
        category: 'analysis',
        name: '分析决策',
        description: '问题分析、决策树、SWOT分析等',
        icon: '🔍',
        count: stats.byCategory.analysis
      },
      {
        category: 'planning',
        name: '规划策略',
        description: '战略规划、时间管理、流程设计等',
        icon: '📅',
        count: stats.byCategory.planning
      },
      {
        category: 'other',
        name: '其他',
        description: '其他类型的思维导图模板',
        icon: '📝',
        count: stats.byCategory.other
      }
    ]
  }

  // 私有方法

  /**
   * 初始化内置模板
   */
  private initializeBuiltInTemplates(): void {
    const builtInTemplates: Omit<MindMapTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'isBuiltIn' | 'isFavorite'>[] = [
      {
        name: '基础思维导图',
        description: '简单的思维导图模板，适合快速开始',
        category: 'other',
        tags: ['基础', '通用'],
        data: this.createBasicTemplate(),
        author: { name: 'MingLog Team' }
      },
      {
        name: '项目规划',
        description: '项目管理和任务分解的思维导图模板',
        category: 'project',
        tags: ['项目管理', '任务分解', '规划'],
        data: this.createProjectPlanningTemplate(),
        author: { name: 'MingLog Team' }
      },
      {
        name: 'SWOT分析',
        description: '优势、劣势、机会、威胁分析模板',
        category: 'analysis',
        tags: ['SWOT', '分析', '决策'],
        data: this.createSWOTTemplate(),
        author: { name: 'MingLog Team' }
      },
      {
        name: '学习笔记',
        description: '课程学习和知识整理的思维导图模板',
        category: 'education',
        tags: ['学习', '笔记', '知识管理'],
        data: this.createStudyNotesTemplate(),
        author: { name: 'MingLog Team' }
      },
      {
        name: '头脑风暴',
        description: '创意思考和想法收集的思维导图模板',
        category: 'creative',
        tags: ['头脑风暴', '创意', '思考'],
        data: this.createBrainstormingTemplate(),
        author: { name: 'MingLog Team' }
      }
    ]

    builtInTemplates.forEach((templateData, index) => {
      const template: MindMapTemplate = {
        ...templateData,
        id: `builtin_${index + 1}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        isBuiltIn: true,
        isFavorite: false
      }
      this.templates.set(template.id, template)
    })
  }

  /**
   * 创建基础模板数据
   */
  private createBasicTemplate(): MindMapData {
    return {
      nodes: [
        {
          id: 'root',
          text: '中心主题',
          level: 0,
          children: [],
          x: 400,
          y: 300,
          style: {
            backgroundColor: '#4A90E2',
            textColor: '#FFFFFF',
            borderColor: '#2E5C8A',
            radius: 30,
            fontSize: 16,
            fontWeight: 'bold'
          }
        }
      ],
      links: [],
      rootId: 'root',
      metadata: {
        title: '基础思维导图',
        description: '简单的思维导图模板',
        version: '1.0.0'
      }
    }
  }

  /**
   * 创建项目规划模板数据
   */
  private createProjectPlanningTemplate(): MindMapData {
    const nodes: MindMapNode[] = [
      {
        id: 'root',
        text: '项目名称',
        level: 0,
        children: [],
        x: 400,
        y: 300,
        style: { backgroundColor: '#FF6B6B', textColor: '#FFFFFF', radius: 35, fontWeight: 'bold' }
      },
      {
        id: 'goals',
        text: '项目目标',
        level: 1,
        parentId: 'root',
        children: [],
        x: 250,
        y: 200,
        style: { backgroundColor: '#4ECDC4', textColor: '#FFFFFF', radius: 25 }
      },
      {
        id: 'tasks',
        text: '任务分解',
        level: 1,
        parentId: 'root',
        children: [],
        x: 550,
        y: 200,
        style: { backgroundColor: '#45B7D1', textColor: '#FFFFFF', radius: 25 }
      },
      {
        id: 'resources',
        text: '资源需求',
        level: 1,
        parentId: 'root',
        children: [],
        x: 250,
        y: 400,
        style: { backgroundColor: '#F9CA24', textColor: '#333333', radius: 25 }
      },
      {
        id: 'timeline',
        text: '时间计划',
        level: 1,
        parentId: 'root',
        children: [],
        x: 550,
        y: 400,
        style: { backgroundColor: '#6C5CE7', textColor: '#FFFFFF', radius: 25 }
      }
    ]

    const links: MindMapLink[] = [
      { id: 'link1', source: 'root', target: 'goals', type: 'parent-child' },
      { id: 'link2', source: 'root', target: 'tasks', type: 'parent-child' },
      { id: 'link3', source: 'root', target: 'resources', type: 'parent-child' },
      { id: 'link4', source: 'root', target: 'timeline', type: 'parent-child' }
    ]

    return {
      nodes,
      links,
      rootId: 'root',
      metadata: {
        title: '项目规划模板',
        description: '项目管理和任务分解的思维导图模板'
      }
    }
  }

  /**
   * 创建SWOT分析模板数据
   */
  private createSWOTTemplate(): MindMapData {
    // 实现SWOT分析模板...
    return this.createBasicTemplate() // 简化实现
  }

  /**
   * 创建学习笔记模板数据
   */
  private createStudyNotesTemplate(): MindMapData {
    // 实现学习笔记模板...
    return this.createBasicTemplate() // 简化实现
  }

  /**
   * 创建头脑风暴模板数据
   */
  private createBrainstormingTemplate(): MindMapData {
    // 实现头脑风暴模板...
    return this.createBasicTemplate() // 简化实现
  }

  /**
   * 深拷贝模板数据
   */
  private cloneTemplateData(data: MindMapData): MindMapData {
    return JSON.parse(JSON.stringify(data))
  }

  /**
   * 更新最近使用记录
   */
  private updateRecentlyUsed(templateId: string): void {
    // 移除已存在的记录
    this.recentlyUsed = this.recentlyUsed.filter(id => id !== templateId)
    
    // 添加到开头
    this.recentlyUsed.unshift(templateId)
    
    // 限制记录数量
    if (this.recentlyUsed.length > 10) {
      this.recentlyUsed = this.recentlyUsed.slice(0, 10)
    }
  }
}

export const templateManager = new TemplateManager()
