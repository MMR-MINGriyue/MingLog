/**
 * 增强版导出服务
 * 提供统一的跨模块导出功能，支持多格式、批量导出和自定义参数
 */

import { DatabaseManager } from '../database/DatabaseManager'
import { EventBus } from '../event-system/EventBus'
import { ModuleManager } from '../module-system/ModuleManager'

// 导出格式
export type ExportFormat = 'pdf' | 'markdown' | 'html' | 'json' | 'csv' | 'xlsx' | 'docx' | 'txt' | 'zip'

// 导出范围
export type ExportScope = 'all' | 'selected' | 'current' | 'module' | 'custom'

// 导出质量
export type ExportQuality = 'draft' | 'standard' | 'high' | 'print'

// 导出配置
export interface EnhancedExportConfig {
  /** 导出格式 */
  format: ExportFormat
  /** 导出范围 */
  scope: ExportScope
  /** 导出质量 */
  quality: ExportQuality
  /** 输出文件名（不含扩展名） */
  filename?: string
  /** 是否包含元数据 */
  includeMetadata: boolean
  /** 是否包含图片 */
  includeImages: boolean
  /** 是否包含链接 */
  includeLinks: boolean
  /** 是否包含附件 */
  includeAttachments: boolean
  /** 是否包含评论 */
  includeComments: boolean
  /** 是否包含版本历史 */
  includeVersionHistory: boolean
  /** 日期范围过滤 */
  dateRange?: {
    from?: Date
    to?: Date
  }
  /** 标签过滤 */
  tags?: string[]
  /** 模块过滤 */
  modules?: string[]
  /** 自定义过滤器 */
  customFilters?: Record<string, any>
  /** 模板配置 */
  template?: {
    name: string
    variables?: Record<string, any>
  }
  /** 格式特定选项 */
  formatOptions?: {
    // PDF选项
    pdf?: {
      pageSize: 'A4' | 'A3' | 'Letter' | 'Legal'
      orientation: 'portrait' | 'landscape'
      margins: { top: number; right: number; bottom: number; left: number }
      headerFooter: boolean
      pageNumbers: boolean
      tableOfContents: boolean
    }
    // HTML选项
    html?: {
      theme: string
      includeCSS: boolean
      singleFile: boolean
      responsive: boolean
    }
    // Markdown选项
    markdown?: {
      flavor: 'github' | 'commonmark' | 'gfm'
      includeYAMLFrontMatter: boolean
      linkStyle: 'inline' | 'reference'
    }
    // Excel选项
    xlsx?: {
      sheetName: string
      includeFormulas: boolean
      includeCharts: boolean
      autoFilter: boolean
    }
  }
}

// 导出项目
export interface ExportItem {
  id: string
  type: 'note' | 'task' | 'mindmap' | 'file' | 'project' | 'custom'
  moduleId: string
  title: string
  content?: any
  metadata?: Record<string, any>
  lastModified: Date
  size?: number
  dependencies?: string[]
}

// 导出进度
export interface ExportProgress {
  operationId: string
  stage: 'preparing' | 'collecting' | 'processing' | 'generating' | 'finalizing' | 'completed' | 'failed'
  currentStep: string
  progress: number
  totalItems: number
  processedItems: number
  estimatedTimeRemaining?: number
  errors: Array<{ item: string; error: string }>
  warnings: Array<{ item: string; warning: string }>
}

// 导出结果
export interface ExportResult {
  operationId: string
  success: boolean
  format: ExportFormat
  filename: string
  filePath?: string
  fileSize: number
  totalItems: number
  exportedItems: number
  skippedItems: number
  failedItems: number
  duration: number
  errors: Array<{ item: string; error: string }>
  warnings: Array<{ item: string; warning: string }>
  metadata: {
    exportedAt: Date
    exportedBy?: string
    config: EnhancedExportConfig
    statistics: Record<string, number>
  }
}

// 导出模板
export interface ExportTemplate {
  id: string
  name: string
  description: string
  category: 'document' | 'presentation' | 'report' | 'archive' | 'custom'
  config: EnhancedExportConfig
  variables: Array<{
    name: string
    label: string
    type: 'text' | 'number' | 'boolean' | 'date' | 'select'
    required: boolean
    defaultValue?: any
    options?: string[]
  }>
  preview?: string
  createdAt: Date
  updatedAt: Date
}

// 导出历史
export interface ExportHistory {
  id: string
  operationId: string
  config: EnhancedExportConfig
  result: ExportResult
  createdAt: Date
}

/**
 * 增强版导出服务
 */
export class EnhancedExportService {
  private database: DatabaseManager
  private eventBus: EventBus
  private moduleManager: ModuleManager
  private activeOperations = new Map<string, ExportProgress>()
  private exportTemplates = new Map<string, ExportTemplate>()
  private exportHistory: ExportHistory[] = []

  constructor(
    database: DatabaseManager,
    eventBus: EventBus,
    moduleManager: ModuleManager
  ) {
    this.database = database
    this.eventBus = eventBus
    this.moduleManager = moduleManager
    this.initialize()
  }

  /**
   * 初始化服务
   */
  private async initialize(): Promise<void> {
    try {
      // 创建数据库表
      await this.createTables()

      // 加载导出模板
      await this.loadExportTemplates()

      // 加载导出历史
      await this.loadExportHistory()

      // 注册默认模板
      await this.registerDefaultTemplates()

      console.log('✅ 增强版导出服务初始化完成')
    } catch (error) {
      console.error('❌ 增强版导出服务初始化失败:', error)
      throw error
    }
  }

  /**
   * 创建数据库表
   */
  private async createTables(): Promise<void> {
    // 导出历史表
    await this.database.execute(`
      CREATE TABLE IF NOT EXISTS export_history (
        id TEXT PRIMARY KEY,
        operation_id TEXT NOT NULL,
        config TEXT NOT NULL,
        result TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)

    // 导出模板表
    await this.database.execute(`
      CREATE TABLE IF NOT EXISTS export_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        config TEXT NOT NULL,
        variables TEXT DEFAULT '[]',
        preview TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)

    // 创建索引
    await this.database.execute(`
      CREATE INDEX IF NOT EXISTS idx_export_history_created_at 
      ON export_history(created_at)
    `)

    await this.database.execute(`
      CREATE INDEX IF NOT EXISTS idx_export_templates_category 
      ON export_templates(category)
    `)
  }

  /**
   * 执行导出
   */
  async exportData(
    items: ExportItem[],
    config: EnhancedExportConfig
  ): Promise<ExportResult> {
    const operationId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = performance.now()

    try {
      // 初始化进度
      const progress: ExportProgress = {
        operationId,
        stage: 'preparing',
        currentStep: '准备导出',
        progress: 0,
        totalItems: items.length,
        processedItems: 0,
        errors: [],
        warnings: []
      }

      this.activeOperations.set(operationId, progress)
      this.eventBus.emit('export:started', { operationId, config, totalItems: items.length })

      // 验证配置
      this.validateConfig(config)
      this.updateProgress(operationId, { stage: 'collecting', currentStep: '收集数据', progress: 10 })

      // 收集和过滤数据
      const filteredItems = await this.collectAndFilterItems(items, config)
      this.updateProgress(operationId, { 
        stage: 'processing', 
        currentStep: '处理数据', 
        progress: 30,
        totalItems: filteredItems.length 
      })

      // 处理数据
      const processedData = await this.processItems(filteredItems, config, operationId)
      this.updateProgress(operationId, { stage: 'generating', currentStep: '生成文件', progress: 70 })

      // 生成导出文件
      const exportFile = await this.generateExportFile(processedData, config, operationId)
      this.updateProgress(operationId, { stage: 'finalizing', currentStep: '完成导出', progress: 90 })

      const endTime = performance.now()
      const duration = endTime - startTime

      // 创建结果
      const result: ExportResult = {
        operationId,
        success: true,
        format: config.format,
        filename: exportFile.filename,
        filePath: exportFile.path,
        fileSize: exportFile.size,
        totalItems: items.length,
        exportedItems: filteredItems.length,
        skippedItems: items.length - filteredItems.length,
        failedItems: progress.errors.length,
        duration,
        errors: progress.errors,
        warnings: progress.warnings,
        metadata: {
          exportedAt: new Date(),
          config,
          statistics: this.calculateStatistics(processedData)
        }
      }

      // 保存到历史
      await this.saveToHistory(operationId, config, result)

      // 完成进度
      this.updateProgress(operationId, { 
        stage: 'completed', 
        currentStep: '导出完成', 
        progress: 100 
      })

      // 发送完成事件
      this.eventBus.emit('export:completed', { operationId, result })

      return result

    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      const progress = this.activeOperations.get(operationId)

      const result: ExportResult = {
        operationId,
        success: false,
        format: config.format,
        filename: '',
        fileSize: 0,
        totalItems: items.length,
        exportedItems: 0,
        skippedItems: 0,
        failedItems: items.length,
        duration,
        errors: [
          ...(progress?.errors || []),
          { item: 'general', error: error instanceof Error ? error.message : '导出失败' }
        ],
        warnings: progress?.warnings || [],
        metadata: {
          exportedAt: new Date(),
          config,
          statistics: {}
        }
      }

      // 更新进度为失败
      this.updateProgress(operationId, { 
        stage: 'failed', 
        currentStep: '导出失败', 
        progress: 0 
      })

      // 发送失败事件
      this.eventBus.emit('export:failed', { operationId, result, error })

      return result
    } finally {
      // 清理操作状态
      setTimeout(() => {
        this.activeOperations.delete(operationId)
      }, 30000) // 30秒后清理
    }
  }

  /**
   * 批量导出多种格式
   */
  async exportMultipleFormats(
    items: ExportItem[],
    configs: EnhancedExportConfig[]
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = []

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i]
      
      try {
        const result = await this.exportData(items, config)
        results.push(result)
      } catch (error) {
        console.error(`导出格式 ${config.format} 失败:`, error)
        // 继续导出其他格式
      }
    }

    return results
  }

  /**
   * 获取导出进度
   */
  getExportProgress(operationId: string): ExportProgress | null {
    return this.activeOperations.get(operationId) || null
  }

  /**
   * 取消导出操作
   */
  async cancelExport(operationId: string): Promise<boolean> {
    const progress = this.activeOperations.get(operationId)
    if (!progress) return false

    // 更新状态为已取消
    this.updateProgress(operationId, {
      stage: 'failed',
      currentStep: '已取消',
      progress: 0
    })

    // 发送取消事件
    this.eventBus.emit('export:cancelled', { operationId })

    // 清理操作状态
    this.activeOperations.delete(operationId)

    return true
  }

  /**
   * 获取支持的导出格式
   */
  getSupportedFormats(): Array<{
    format: ExportFormat
    name: string
    description: string
    extensions: string[]
    mimeType: string
    features: string[]
  }> {
    return [
      {
        format: 'pdf',
        name: 'PDF文档',
        description: '便携式文档格式，适合打印和分享',
        extensions: ['pdf'],
        mimeType: 'application/pdf',
        features: ['分页', '目录', '书签', '打印优化']
      },
      {
        format: 'markdown',
        name: 'Markdown',
        description: '轻量级标记语言，适合技术文档',
        extensions: ['md', 'markdown'],
        mimeType: 'text/markdown',
        features: ['纯文本', '版本控制友好', '跨平台']
      },
      {
        format: 'html',
        name: 'HTML网页',
        description: '网页格式，支持富文本和交互',
        extensions: ['html', 'htm'],
        mimeType: 'text/html',
        features: ['富文本', '交互式', '样式自定义']
      },
      {
        format: 'json',
        name: 'JSON数据',
        description: '结构化数据格式，适合程序处理',
        extensions: ['json'],
        mimeType: 'application/json',
        features: ['结构化', '程序友好', '完整数据']
      },
      {
        format: 'xlsx',
        name: 'Excel表格',
        description: '电子表格格式，适合数据分析',
        extensions: ['xlsx'],
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        features: ['表格', '公式', '图表', '数据分析']
      },
      {
        format: 'docx',
        name: 'Word文档',
        description: 'Microsoft Word格式，适合文档编辑',
        extensions: ['docx'],
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        features: ['富文本', '格式化', '协作编辑']
      },
      {
        format: 'zip',
        name: 'ZIP压缩包',
        description: '压缩包格式，包含所有文件和资源',
        extensions: ['zip'],
        mimeType: 'application/zip',
        features: ['压缩', '多文件', '完整备份']
      }
    ]
  }

  /**
   * 获取导出模板
   */
  getExportTemplates(category?: string): ExportTemplate[] {
    const templates = Array.from(this.exportTemplates.values())
    return category ? templates.filter(t => t.category === category) : templates
  }

  /**
   * 创建导出模板
   */
  async createExportTemplate(template: Omit<ExportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    const newTemplate: ExportTemplate = {
      id,
      ...template,
      createdAt: now,
      updatedAt: now
    }

    this.exportTemplates.set(id, newTemplate)
    await this.saveExportTemplate(newTemplate)

    return id
  }

  /**
   * 获取导出历史
   */
  getExportHistory(limit = 50): ExportHistory[] {
    return this.exportHistory
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  /**
   * 清理导出历史
   */
  async cleanupExportHistory(olderThanDays = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    
    const deletedCount = await this.database.execute(`
      DELETE FROM export_history 
      WHERE created_at < ?
    `, [cutoffDate.toISOString()])

    // 更新内存中的历史记录
    this.exportHistory = this.exportHistory.filter(h => h.createdAt >= cutoffDate)

    return deletedCount.changes || 0
  }

  /**
   * 验证导出配置
   */
  private validateConfig(config: EnhancedExportConfig): void {
    if (!config.format) {
      throw new Error('导出格式不能为空')
    }

    const supportedFormats = this.getSupportedFormats().map(f => f.format)
    if (!supportedFormats.includes(config.format)) {
      throw new Error(`不支持的导出格式: ${config.format}`)
    }

    // 验证格式特定选项
    if (config.format === 'pdf' && config.formatOptions?.pdf) {
      const pdfOptions = config.formatOptions.pdf
      if (pdfOptions.margins) {
        const { top, right, bottom, left } = pdfOptions.margins
        if (top < 0 || right < 0 || bottom < 0 || left < 0) {
          throw new Error('PDF边距不能为负数')
        }
      }
    }
  }

  /**
   * 收集和过滤项目
   */
  private async collectAndFilterItems(
    items: ExportItem[],
    config: EnhancedExportConfig
  ): Promise<ExportItem[]> {
    let filteredItems = [...items]

    // 日期范围过滤
    if (config.dateRange) {
      const { from, to } = config.dateRange
      filteredItems = filteredItems.filter(item => {
        const itemDate = item.lastModified
        if (from && itemDate < from) return false
        if (to && itemDate > to) return false
        return true
      })
    }

    // 标签过滤
    if (config.tags && config.tags.length > 0) {
      filteredItems = filteredItems.filter(item => {
        const itemTags = item.metadata?.tags || []
        return config.tags!.some(tag => itemTags.includes(tag))
      })
    }

    // 模块过滤
    if (config.modules && config.modules.length > 0) {
      filteredItems = filteredItems.filter(item => 
        config.modules!.includes(item.moduleId)
      )
    }

    return filteredItems
  }

  /**
   * 处理项目数据
   */
  private async processItems(
    items: ExportItem[],
    config: EnhancedExportConfig,
    operationId: string
  ): Promise<any[]> {
    const processedData: any[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      try {
        // 获取模块特定的导出处理器
        const module = this.moduleManager.getModule(item.moduleId)
        let processedItem = item

        if (module && module.exportProcessor) {
          processedItem = await module.exportProcessor(item, config)
        }

        processedData.push(processedItem)

        // 更新进度
        this.updateProgress(operationId, {
          processedItems: i + 1,
          progress: 30 + (i + 1) / items.length * 40
        })

      } catch (error) {
        const progress = this.activeOperations.get(operationId)
        if (progress) {
          progress.errors.push({
            item: item.id,
            error: error instanceof Error ? error.message : '处理失败'
          })
        }
      }
    }

    return processedData
  }

  /**
   * 生成导出文件
   */
  private async generateExportFile(
    data: any[],
    config: EnhancedExportConfig,
    operationId: string
  ): Promise<{ filename: string; path: string; size: number }> {
    // 这里应该根据不同格式调用相应的生成器
    // 简化实现，返回模拟结果
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
    const filename = `${config.filename || 'export'}-${timestamp}.${config.format}`
    
    // 模拟文件生成
    await new Promise(resolve => setTimeout(resolve, 1000))

    return {
      filename,
      path: `/exports/${filename}`,
      size: data.length * 1024 // 模拟文件大小
    }
  }

  /**
   * 更新导出进度
   */
  private updateProgress(operationId: string, updates: Partial<ExportProgress>): void {
    const progress = this.activeOperations.get(operationId)
    if (progress) {
      Object.assign(progress, updates)
      this.eventBus.emit('export:progress', { operationId, progress })
    }
  }

  /**
   * 计算统计信息
   */
  private calculateStatistics(data: any[]): Record<string, number> {
    const stats: Record<string, number> = {
      totalItems: data.length,
      totalSize: data.reduce((sum, item) => sum + (item.size || 0), 0)
    }

    // 按类型统计
    const typeStats: Record<string, number> = {}
    data.forEach(item => {
      typeStats[item.type] = (typeStats[item.type] || 0) + 1
    })

    return { ...stats, ...typeStats }
  }

  /**
   * 保存到历史记录
   */
  private async saveToHistory(
    operationId: string,
    config: EnhancedExportConfig,
    result: ExportResult
  ): Promise<void> {
    const history: ExportHistory = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operationId,
      config,
      result,
      createdAt: new Date()
    }

    this.exportHistory.unshift(history)

    // 保存到数据库
    await this.database.execute(`
      INSERT INTO export_history (id, operation_id, config, result, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [
      history.id,
      operationId,
      JSON.stringify(config),
      JSON.stringify(result),
      history.createdAt.toISOString()
    ])
  }

  /**
   * 加载导出模板
   */
  private async loadExportTemplates(): Promise<void> {
    const templates = await this.database.query(`
      SELECT * FROM export_templates ORDER BY created_at DESC
    `)

    templates.forEach((row: any) => {
      const template: ExportTemplate = {
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        config: JSON.parse(row.config),
        variables: JSON.parse(row.variables || '[]'),
        preview: row.preview,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }
      this.exportTemplates.set(template.id, template)
    })
  }

  /**
   * 加载导出历史
   */
  private async loadExportHistory(): Promise<void> {
    const history = await this.database.query(`
      SELECT * FROM export_history 
      ORDER BY created_at DESC 
      LIMIT 100
    `)

    this.exportHistory = history.map((row: any) => ({
      id: row.id,
      operationId: row.operation_id,
      config: JSON.parse(row.config),
      result: JSON.parse(row.result),
      createdAt: new Date(row.created_at)
    }))
  }

  /**
   * 保存导出模板
   */
  private async saveExportTemplate(template: ExportTemplate): Promise<void> {
    await this.database.execute(`
      INSERT OR REPLACE INTO export_templates 
      (id, name, description, category, config, variables, preview, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      template.id,
      template.name,
      template.description,
      template.category,
      JSON.stringify(template.config),
      JSON.stringify(template.variables),
      template.preview,
      template.createdAt.toISOString(),
      template.updatedAt.toISOString()
    ])
  }

  /**
   * 注册默认模板
   */
  private async registerDefaultTemplates(): Promise<void> {
    const defaultTemplates: Array<Omit<ExportTemplate, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        name: '标准文档导出',
        description: '导出为PDF文档，包含目录和页码',
        category: 'document',
        config: {
          format: 'pdf',
          scope: 'all',
          quality: 'standard',
          includeMetadata: true,
          includeImages: true,
          includeLinks: true,
          includeAttachments: false,
          includeComments: false,
          includeVersionHistory: false,
          formatOptions: {
            pdf: {
              pageSize: 'A4',
              orientation: 'portrait',
              margins: { top: 20, right: 20, bottom: 20, left: 20 },
              headerFooter: true,
              pageNumbers: true,
              tableOfContents: true
            }
          }
        },
        variables: []
      },
      {
        name: '网页归档',
        description: '导出为HTML网页，包含所有资源',
        category: 'archive',
        config: {
          format: 'html',
          scope: 'all',
          quality: 'high',
          includeMetadata: true,
          includeImages: true,
          includeLinks: true,
          includeAttachments: true,
          includeComments: true,
          includeVersionHistory: false,
          formatOptions: {
            html: {
              theme: 'default',
              includeCSS: true,
              singleFile: false,
              responsive: true
            }
          }
        },
        variables: []
      }
    ]

    for (const template of defaultTemplates) {
      // 检查是否已存在
      const existing = Array.from(this.exportTemplates.values())
        .find(t => t.name === template.name)
      
      if (!existing) {
        await this.createExportTemplate(template)
      }
    }
  }
}

export default EnhancedExportService
