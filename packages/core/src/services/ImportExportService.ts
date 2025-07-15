/**
 * 导入导出服务
 * 提供统一的数据导入导出功能
 */

import { EventEmitter } from 'events'
import { EntityType } from './DataAssociationService'
import { BatchOperationService, BatchOperationItem, BatchOperationResult } from './BatchOperationService'

// 导出格式
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  MARKDOWN = 'markdown',
  HTML = 'html',
  PDF = 'pdf',
  XLSX = 'xlsx',
  XML = 'xml'
}

// 导入格式
export enum ImportFormat {
  JSON = 'json',
  CSV = 'csv',
  MARKDOWN = 'markdown',
  XLSX = 'xlsx',
  XML = 'xml',
  NOTION = 'notion',
  OBSIDIAN = 'obsidian',
  ROAM = 'roam'
}

// 导出选项
export interface ExportOptions {
  format: ExportFormat
  includeMetadata: boolean
  includeAssociations: boolean
  includeAttachments: boolean
  dateRange?: {
    from: Date
    to: Date
  }
  filters?: {
    entityTypes?: EntityType[]
    tags?: string[]
    status?: string[]
  }
  compression?: boolean
  encryption?: {
    enabled: boolean
    password?: string
  }
}

// 导入选项
export interface ImportOptions {
  format: ImportFormat
  mergeStrategy: 'replace' | 'merge' | 'append' | 'skip'
  conflictResolution: 'overwrite' | 'skip' | 'rename' | 'prompt'
  preserveIds: boolean
  preserveTimestamps: boolean
  createMissingReferences: boolean
  validateData: boolean
  batchSize: number
}

// 导出结果
export interface ExportResult {
  success: boolean
  format: ExportFormat
  filePath?: string
  fileSize?: number
  itemCount: number
  exportedItems: {
    [entityType: string]: number
  }
  duration: number
  errors: string[]
  warnings: string[]
}

// 导入结果
export interface ImportResult {
  success: boolean
  format: ImportFormat
  totalItems: number
  importedItems: number
  skippedItems: number
  failedItems: number
  createdItems: {
    [entityType: string]: number
  }
  updatedItems: {
    [entityType: string]: number
  }
  duration: number
  errors: Array<{
    item: string
    error: string
  }>
  warnings: Array<{
    item: string
    warning: string
  }>
}

// 数据转换器接口
export interface IDataTransformer {
  canHandle(format: ExportFormat | ImportFormat): boolean
  export(items: BatchOperationItem[], options: ExportOptions): Promise<Blob | string>
  import(data: string | ArrayBuffer, options: ImportOptions): Promise<BatchOperationItem[]>
  validate(data: string | ArrayBuffer): Promise<boolean>
  getSchema?(): any
}

/**
 * 导入导出服务实现
 */
export class ImportExportService extends EventEmitter {
  private transformers: Map<string, IDataTransformer> = new Map()
  private activeOperations: Map<string, { type: 'import' | 'export', progress: number }> = new Map()

  constructor(
    private batchOperationService: BatchOperationService,
    private coreAPI?: any
  ) {
    super()
    this.initializeBuiltInTransformers()
  }

  /**
   * 注册数据转换器
   */
  registerTransformer(key: string, transformer: IDataTransformer): void {
    this.transformers.set(key, transformer)
    console.log(`数据转换器已注册: ${key}`)
  }

  /**
   * 注销数据转换器
   */
  unregisterTransformer(key: string): void {
    this.transformers.delete(key)
    console.log(`数据转换器已注销: ${key}`)
  }

  /**
   * 获取支持的导出格式
   */
  getSupportedExportFormats(): ExportFormat[] {
    const formats = new Set<ExportFormat>()
    
    for (const transformer of this.transformers.values()) {
      Object.values(ExportFormat).forEach(format => {
        if (transformer.canHandle(format)) {
          formats.add(format)
        }
      })
    }
    
    return Array.from(formats)
  }

  /**
   * 获取支持的导入格式
   */
  getSupportedImportFormats(): ImportFormat[] {
    const formats = new Set<ImportFormat>()
    
    for (const transformer of this.transformers.values()) {
      Object.values(ImportFormat).forEach(format => {
        if (transformer.canHandle(format)) {
          formats.add(format)
        }
      })
    }
    
    return Array.from(formats)
  }

  /**
   * 导出数据
   */
  async exportData(
    items: BatchOperationItem[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const operationId = this.generateOperationId()
    const startTime = performance.now()

    try {
      this.activeOperations.set(operationId, { type: 'export', progress: 0 })
      
      // 发送开始事件
      this.emit('export:started', { operationId, itemCount: items.length, options })

      // 查找转换器
      const transformer = this.findTransformer(options.format)
      if (!transformer) {
        throw new Error(`不支持的导出格式: ${options.format}`)
      }

      // 过滤数据
      const filteredItems = this.filterItems(items, options)
      
      // 更新进度
      this.updateProgress(operationId, 25)

      // 执行导出
      const exportedData = await transformer.export(filteredItems, options)
      
      // 更新进度
      this.updateProgress(operationId, 75)

      // 保存文件
      const filePath = await this.saveExportedData(exportedData, options)
      const fileSize = this.getDataSize(exportedData)

      // 更新进度
      this.updateProgress(operationId, 100)

      const endTime = performance.now()
      const duration = endTime - startTime

      const result: ExportResult = {
        success: true,
        format: options.format,
        filePath,
        fileSize,
        itemCount: filteredItems.length,
        exportedItems: this.countItemsByType(filteredItems),
        duration,
        errors: [],
        warnings: []
      }

      // 清理操作状态
      this.activeOperations.delete(operationId)

      // 发送完成事件
      this.emit('export:completed', { operationId, result })

      return result

    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      const result: ExportResult = {
        success: false,
        format: options.format,
        itemCount: 0,
        exportedItems: {},
        duration,
        errors: [error instanceof Error ? error.message : '导出失败'],
        warnings: []
      }

      // 清理操作状态
      this.activeOperations.delete(operationId)

      // 发送失败事件
      this.emit('export:failed', { operationId, result, error })

      return result
    }
  }

  /**
   * 导入数据
   */
  async importData(
    data: string | ArrayBuffer | File,
    options: ImportOptions
  ): Promise<ImportResult> {
    const operationId = this.generateOperationId()
    const startTime = performance.now()

    try {
      this.activeOperations.set(operationId, { type: 'import', progress: 0 })

      // 发送开始事件
      this.emit('import:started', { operationId, options })

      // 处理文件数据
      const processedData = await this.processImportData(data)
      
      // 查找转换器
      const transformer = this.findTransformer(options.format)
      if (!transformer) {
        throw new Error(`不支持的导入格式: ${options.format}`)
      }

      // 更新进度
      this.updateProgress(operationId, 10)

      // 验证数据
      if (options.validateData) {
        const isValid = await transformer.validate(processedData)
        if (!isValid) {
          throw new Error('数据格式验证失败')
        }
      }

      // 更新进度
      this.updateProgress(operationId, 25)

      // 解析数据
      const parsedItems = await transformer.import(processedData, options)
      
      // 更新进度
      this.updateProgress(operationId, 50)

      // 批量处理导入
      const importResult = await this.processBatchImport(parsedItems, options, operationId)

      // 更新进度
      this.updateProgress(operationId, 100)

      const endTime = performance.now()
      const duration = endTime - startTime

      const result: ImportResult = {
        success: importResult.status === 'completed',
        format: options.format,
        totalItems: parsedItems.length,
        importedItems: importResult.successCount,
        skippedItems: importResult.skippedCount,
        failedItems: importResult.failureCount,
        createdItems: this.countItemsByType(parsedItems),
        updatedItems: {},
        duration,
        errors: importResult.errors.map(e => ({ item: e.itemId, error: e.error })),
        warnings: []
      }

      // 清理操作状态
      this.activeOperations.delete(operationId)

      // 发送完成事件
      this.emit('import:completed', { operationId, result })

      return result

    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      const result: ImportResult = {
        success: false,
        format: options.format,
        totalItems: 0,
        importedItems: 0,
        skippedItems: 0,
        failedItems: 0,
        createdItems: {},
        updatedItems: {},
        duration,
        errors: [{ item: 'general', error: error instanceof Error ? error.message : '导入失败' }],
        warnings: []
      }

      // 清理操作状态
      this.activeOperations.delete(operationId)

      // 发送失败事件
      this.emit('import:failed', { operationId, result, error })

      return result
    }
  }

  /**
   * 获取操作进度
   */
  getOperationProgress(operationId: string): { type: 'import' | 'export', progress: number } | null {
    return this.activeOperations.get(operationId) || null
  }

  /**
   * 取消操作
   */
  async cancelOperation(operationId: string): Promise<boolean> {
    const operation = this.activeOperations.get(operationId)
    if (!operation) return false

    this.activeOperations.delete(operationId)
    this.emit('operation:cancelled', { operationId })
    
    return true
  }

  /**
   * 验证导入数据
   */
  async validateImportData(
    data: string | ArrayBuffer | File,
    format: ImportFormat
  ): Promise<{ valid: boolean, errors: string[], warnings: string[] }> {
    try {
      const processedData = await this.processImportData(data)
      const transformer = this.findTransformer(format)
      
      if (!transformer) {
        return {
          valid: false,
          errors: [`不支持的导入格式: ${format}`],
          warnings: []
        }
      }

      const isValid = await transformer.validate(processedData)
      
      return {
        valid: isValid,
        errors: isValid ? [] : ['数据格式验证失败'],
        warnings: []
      }
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : '验证失败'],
        warnings: []
      }
    }
  }

  // 私有方法

  private findTransformer(format: ExportFormat | ImportFormat): IDataTransformer | null {
    for (const transformer of this.transformers.values()) {
      if (transformer.canHandle(format)) {
        return transformer
      }
    }
    return null
  }

  private filterItems(items: BatchOperationItem[], options: ExportOptions): BatchOperationItem[] {
    let filtered = items

    // 按实体类型过滤
    if (options.filters?.entityTypes) {
      filtered = filtered.filter(item => 
        options.filters!.entityTypes!.includes(item.entityType)
      )
    }

    // 按标签过滤
    if (options.filters?.tags) {
      filtered = filtered.filter(item =>
        options.filters!.tags!.some(tag => 
          item.metadata?.tags?.includes(tag)
        )
      )
    }

    // 按日期范围过滤
    if (options.dateRange) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.metadata?.createdAt || item.metadata?.updatedAt)
        return itemDate >= options.dateRange!.from && itemDate <= options.dateRange!.to
      })
    }

    return filtered
  }

  private async saveExportedData(data: Blob | string, options: ExportOptions): Promise<string> {
    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `export_${timestamp}.${options.format}`
    
    // 在实际应用中，这里会保存到文件系统
    console.log(`保存导出文件: ${fileName}`)
    
    return fileName
  }

  private getDataSize(data: Blob | string): number {
    if (data instanceof Blob) {
      return data.size
    }
    return new Blob([data]).size
  }

  private countItemsByType(items: BatchOperationItem[]): { [entityType: string]: number } {
    const counts: { [entityType: string]: number } = {}
    
    items.forEach(item => {
      counts[item.entityType] = (counts[item.entityType] || 0) + 1
    })
    
    return counts
  }

  private async processImportData(data: string | ArrayBuffer | File): Promise<string | ArrayBuffer> {
    if (data instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string | ArrayBuffer)
        reader.onerror = () => reject(new Error('文件读取失败'))
        reader.readAsText(data)
      })
    }
    return data
  }

  private async processBatchImport(
    items: BatchOperationItem[],
    options: ImportOptions,
    operationId: string
  ): Promise<BatchOperationResult> {
    // 使用批量操作服务处理导入
    const batchConfig = {
      id: 'batch-import',
      name: '批量导入',
      description: '批量导入数据',
      type: 'import' as any,
      entityTypes: [],
      params: options,
      options: {
        batchSize: options.batchSize,
        parallel: true
      }
    }

    // 模拟批量导入结果
    return {
      operationId: 'import-' + Date.now(),
      status: 'completed' as any,
      totalItems: 0,
      processedItems: 0,
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      errors: [],
      warnings: [],
      summary: '导入完成'
    }
  }

  private updateProgress(operationId: string, progress: number): void {
    const operation = this.activeOperations.get(operationId)
    if (operation) {
      operation.progress = progress
      this.activeOperations.set(operationId, operation)
      this.emit('operation:progress', { operationId, progress })
    }
  }

  private initializeBuiltInTransformers(): void {
    // 注册内置转换器
    this.registerTransformer('json', new JSONTransformer())
    this.registerTransformer('csv', new CSVTransformer())
    this.registerTransformer('markdown', new MarkdownTransformer())
  }

  private generateOperationId(): string {
    return `import_export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// JSON转换器
class JSONTransformer implements IDataTransformer {
  canHandle(format: ExportFormat | ImportFormat): boolean {
    return format === ExportFormat.JSON || format === ImportFormat.JSON
  }

  async export(items: BatchOperationItem[], options: ExportOptions): Promise<string> {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      options,
      items: items.map(item => ({
        id: item.entityId,
        type: item.entityType,
        title: item.title,
        content: item.content,
        metadata: options.includeMetadata ? item.metadata : undefined
      }))
    }

    return JSON.stringify(exportData, null, 2)
  }

  async import(data: string | ArrayBuffer, options: ImportOptions): Promise<BatchOperationItem[]> {
    const jsonData = JSON.parse(data as string)
    const items: BatchOperationItem[] = []

    if (jsonData.items && Array.isArray(jsonData.items)) {
      jsonData.items.forEach((item: any, index: number) => {
        items.push({
          id: `import_${index}`,
          entityType: item.type || EntityType.NOTE,
          entityId: item.id || `imported_${index}`,
          title: item.title || '未命名',
          content: item.content,
          metadata: item.metadata,
          selected: false
        })
      })
    }

    return items
  }

  async validate(data: string | ArrayBuffer): Promise<boolean> {
    try {
      const jsonData = JSON.parse(data as string)
      return jsonData && typeof jsonData === 'object' && Array.isArray(jsonData.items)
    } catch {
      return false
    }
  }
}

// CSV转换器
class CSVTransformer implements IDataTransformer {
  canHandle(format: ExportFormat | ImportFormat): boolean {
    return format === ExportFormat.CSV || format === ImportFormat.CSV
  }

  async export(items: BatchOperationItem[], options: ExportOptions): Promise<string> {
    const headers = ['ID', 'Type', 'Title', 'Content']
    const rows = items.map(item => [
      item.entityId,
      item.entityType,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${(item.content || '').replace(/"/g, '""')}"`
    ])

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  async import(data: string | ArrayBuffer, options: ImportOptions): Promise<BatchOperationItem[]> {
    const lines = (data as string).split('\n').filter(line => line.trim())
    const headers = lines[0].split(',')
    const items: BatchOperationItem[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      if (values.length >= 3) {
        items.push({
          id: `csv_import_${i}`,
          entityType: (values[1] as EntityType) || EntityType.NOTE,
          entityId: values[0] || `csv_${i}`,
          title: values[2] || '未命名',
          content: values[3] || '',
          selected: false
        })
      }
    }

    return items
  }

  async validate(data: string | ArrayBuffer): Promise<boolean> {
    try {
      const lines = (data as string).split('\n')
      return lines.length > 1 && lines[0].includes(',')
    } catch {
      return false
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }
}

// Markdown转换器
class MarkdownTransformer implements IDataTransformer {
  canHandle(format: ExportFormat | ImportFormat): boolean {
    return format === ExportFormat.MARKDOWN || format === ImportFormat.MARKDOWN
  }

  async export(items: BatchOperationItem[], options: ExportOptions): Promise<string> {
    const sections = items.map(item => {
      let markdown = `# ${item.title}\n\n`
      if (item.content) {
        markdown += `${item.content}\n\n`
      }
      if (options.includeMetadata && item.metadata) {
        markdown += `---\n`
        markdown += `Type: ${item.entityType}\n`
        markdown += `ID: ${item.entityId}\n`
        if (item.metadata.tags) {
          markdown += `Tags: ${item.metadata.tags.join(', ')}\n`
        }
        markdown += `---\n\n`
      }
      return markdown
    })

    return sections.join('\n')
  }

  async import(data: string | ArrayBuffer, options: ImportOptions): Promise<BatchOperationItem[]> {
    const content = data as string
    const sections = content.split(/^# /m).filter(section => section.trim())
    const items: BatchOperationItem[] = []

    sections.forEach((section, index) => {
      const lines = section.split('\n')
      const title = lines[0].trim()
      const content = lines.slice(1).join('\n').trim()

      items.push({
        id: `md_import_${index}`,
        entityType: EntityType.NOTE,
        entityId: `md_${index}`,
        title: title || '未命名',
        content,
        selected: false
      })
    })

    return items
  }

  async validate(data: string | ArrayBuffer): Promise<boolean> {
    const content = data as string
    return content.includes('#') || content.includes('*') || content.includes('-')
  }
}

export default ImportExportService
