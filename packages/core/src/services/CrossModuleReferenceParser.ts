/**
 * 跨模块引用解析器
 * 解析和处理文本中的模块间引用，如 [[note:id]], {{task:id}}, ((mindmap:id))
 */

import { EventBus } from '../event-system/EventBus'
import { DatabaseManager } from '../database/DatabaseManager'
import { CrossModuleLinkService } from './CrossModuleLinkService'

export interface ParsedReference {
  type: 'note' | 'task' | 'mindmap' | 'block'
  id: string
  displayText?: string
  startIndex: number
  endIndex: number
  rawText: string
  isValid: boolean
  targetData?: any
}

export interface ReferencePattern {
  name: string
  pattern: RegExp
  type: 'note' | 'task' | 'mindmap' | 'block'
  extractor: (match: RegExpMatchArray) => { id: string; displayText?: string }
}

export class CrossModuleReferenceParser {
  private eventBus: EventBus
  private database: DatabaseManager
  private linkService: CrossModuleLinkService
  private patterns: ReferencePattern[] = []
  private cache = new Map<string, ParsedReference[]>()

  constructor(
    eventBus: EventBus,
    database: DatabaseManager,
    linkService: CrossModuleLinkService
  ) {
    this.eventBus = eventBus
    this.database = database
    this.linkService = linkService

    this.initializePatterns()
  }

  /**
   * 初始化引用模式
   */
  private initializePatterns(): void {
    // 笔记引用: [[note:id]] 或 [[note:id|显示文本]]
    this.patterns.push({
      name: 'note-reference',
      pattern: /\[\[note:([a-zA-Z0-9_-]+)(?:\|([^\]]+))?\]\]/g,
      type: 'note',
      extractor: (match) => ({
        id: match[1],
        displayText: match[2]
      })
    })

    // 任务引用: {{task:id}} 或 {{task:id|显示文本}}
    this.patterns.push({
      name: 'task-reference',
      pattern: /\{\{task:([a-zA-Z0-9_-]+)(?:\|([^}]+))?\}\}/g,
      type: 'task',
      extractor: (match) => ({
        id: match[1],
        displayText: match[2]
      })
    })

    // 思维导图引用: ((mindmap:id)) 或 ((mindmap:id|显示文本))
    this.patterns.push({
      name: 'mindmap-reference',
      pattern: /\(\(mindmap:([a-zA-Z0-9_-]+)(?:\|([^)]+))?\)\)/g,
      type: 'mindmap',
      extractor: (match) => ({
        id: match[1],
        displayText: match[2]
      })
    })

    // 块引用: ((block:id))
    this.patterns.push({
      name: 'block-reference',
      pattern: /\(\(block:([a-zA-Z0-9_-]+)\)\)/g,
      type: 'block',
      extractor: (match) => ({
        id: match[1]
      })
    })

    // 简化的笔记引用: [[笔记标题]]
    this.patterns.push({
      name: 'simple-note-reference',
      pattern: /\[\[([^\]|]+)\]\]/g,
      type: 'note',
      extractor: (match) => ({
        id: '', // 需要通过标题查找ID
        displayText: match[1]
      })
    })
  }

  /**
   * 解析文本中的所有引用
   */
  async parseReferences(text: string, sourceModule?: string, sourceId?: string): Promise<ParsedReference[]> {
    const cacheKey = `${sourceModule || 'unknown'}:${sourceId || 'unknown'}:${this.hashText(text)}`
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const references: ParsedReference[] = []

    for (const pattern of this.patterns) {
      const matches = Array.from(text.matchAll(pattern.pattern))
      
      for (const match of matches) {
        const { id, displayText } = pattern.extractor(match)
        
        // 对于简化引用，需要通过标题查找ID
        let actualId = id
        if (!id && displayText && pattern.type !== 'block') {
          actualId = await this.findIdByTitle(pattern.type as 'note' | 'task' | 'mindmap', displayText)
        }

        const reference: ParsedReference = {
          type: pattern.type,
          id: actualId,
          displayText,
          startIndex: match.index!,
          endIndex: match.index! + match[0].length,
          rawText: match[0],
          isValid: false
        }

        // 验证引用并获取目标数据
        if (actualId) {
          const targetData = await this.getTargetData(pattern.type, actualId)
          reference.isValid = !!targetData
          reference.targetData = targetData
        }

        references.push(reference)
      }
    }

    // 按位置排序
    references.sort((a, b) => a.startIndex - b.startIndex)

    // 缓存结果
    this.cache.set(cacheKey, references)

    // 如果提供了源信息，创建链接
    if (sourceModule && sourceId) {
      await this.createLinksForReferences(sourceModule, sourceId, references)
    }

    return references
  }

  /**
   * 渲染引用为HTML
   */
  renderReferencesToHTML(text: string, references: ParsedReference[]): string {
    let result = text
    let offset = 0

    for (const ref of references) {
      const startPos = ref.startIndex + offset
      const endPos = ref.endIndex + offset
      
      const html = this.renderReferenceToHTML(ref)
      const originalLength = ref.rawText.length
      const newLength = html.length
      
      result = result.substring(0, startPos) + html + result.substring(endPos)
      offset += newLength - originalLength
    }

    return result
  }

  /**
   * 渲染单个引用为HTML
   */
  private renderReferenceToHTML(ref: ParsedReference): string {
    const displayText = ref.displayText || this.getDefaultDisplayText(ref)
    const className = `cross-module-ref cross-module-ref--${ref.type} ${ref.isValid ? 'valid' : 'invalid'}`
    
    if (ref.isValid) {
      return `<a href="#" class="${className}" data-module="${ref.type}" data-id="${ref.id}" title="${this.getTooltipText(ref)}">${displayText}</a>`
    } else {
      return `<span class="${className}" title="引用无效">${displayText}</span>`
    }
  }

  /**
   * 获取默认显示文本
   */
  private getDefaultDisplayText(ref: ParsedReference): string {
    if (ref.targetData) {
      switch (ref.type) {
        case 'note':
          return ref.targetData.title || `笔记 ${ref.id}`
        case 'task':
          return ref.targetData.title || `任务 ${ref.id}`
        case 'mindmap':
          return ref.targetData.text || `思维导图 ${ref.id}`
        case 'block':
          return `块 ${ref.id}`
      }
    }
    
    return ref.rawText
  }

  /**
   * 获取工具提示文本
   */
  private getTooltipText(ref: ParsedReference): string {
    if (!ref.targetData) return ''

    switch (ref.type) {
      case 'note':
        return `笔记: ${ref.targetData.title}\n创建时间: ${new Date(ref.targetData.created_at).toLocaleString()}`
      case 'task':
        return `任务: ${ref.targetData.title}\n状态: ${ref.targetData.status}\n优先级: ${ref.targetData.priority}`
      case 'mindmap':
        return `思维导图节点: ${ref.targetData.text}\n层级: ${ref.targetData.level}`
      case 'block':
        return `块引用: ${ref.id}`
      default:
        return ''
    }
  }

  /**
   * 通过标题查找ID
   */
  private async findIdByTitle(type: 'note' | 'task' | 'mindmap', title: string): Promise<string> {
    let tableName: string
    let titleField: string

    switch (type) {
      case 'note':
        tableName = 'notes'
        titleField = 'title'
        break
      case 'task':
        tableName = 'tasks'
        titleField = 'title'
        break
      case 'mindmap':
        tableName = 'mindmap_nodes'
        titleField = 'text'
        break
      default:
        return ''
    }

    const results = await this.database.query(
      `SELECT id FROM ${tableName} WHERE ${titleField} = ? LIMIT 1`,
      [title]
    )

    return results.length > 0 ? results[0].id : ''
  }

  /**
   * 获取目标数据
   */
  private async getTargetData(type: string, id: string): Promise<any> {
    let tableName: string

    switch (type) {
      case 'note':
        tableName = 'notes'
        break
      case 'task':
        tableName = 'tasks'
        break
      case 'mindmap':
        tableName = 'mindmap_nodes'
        break
      case 'block':
        tableName = 'blocks'
        break
      default:
        return null
    }

    const results = await this.database.query(
      `SELECT * FROM ${tableName} WHERE id = ? LIMIT 1`,
      [id]
    )

    return results.length > 0 ? results[0] : null
  }

  /**
   * 为引用创建链接
   */
  private async createLinksForReferences(
    sourceModule: string,
    sourceId: string,
    references: ParsedReference[]
  ): Promise<void> {
    for (const ref of references) {
      if (ref.isValid && ref.id) {
        try {
          await this.linkService.createLink(
            sourceModule,
            sourceId,
            ref.type === 'block' ? 'notes' : ref.type, // 块引用归属于notes模块
            ref.id,
            'reference',
            {
              referenceType: ref.type,
              displayText: ref.displayText,
              position: ref.startIndex
            }
          )
        } catch (error) {
          // 链接可能已存在，忽略错误
          console.debug('Link creation failed (may already exist):', error)
        }
      }
    }
  }

  /**
   * 生成文本哈希
   */
  private hashText(text: string): string {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return hash.toString(36)
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 获取引用统计
   */
  async getReferenceStats(): Promise<{
    totalReferences: number
    validReferences: number
    invalidReferences: number
    referencesByType: Record<string, number>
  }> {
    // 这里可以实现更复杂的统计逻辑
    // 目前返回基本统计
    return {
      totalReferences: 0,
      validReferences: 0,
      invalidReferences: 0,
      referencesByType: {}
    }
  }

  /**
   * 添加自定义引用模式
   */
  addCustomPattern(pattern: ReferencePattern): void {
    this.patterns.push(pattern)
  }

  /**
   * 移除引用模式
   */
  removePattern(name: string): void {
    this.patterns = this.patterns.filter(p => p.name !== name)
  }
}
