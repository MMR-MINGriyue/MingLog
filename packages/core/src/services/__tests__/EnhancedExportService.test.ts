/**
 * 增强版导出服务测试
 * 测试多格式导出、批量导出、模板系统和进度监控功能
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EnhancedExportService, ExportItem, EnhancedExportConfig } from '../EnhancedExportService'
import { DatabaseManager } from '../../database/DatabaseManager'
import { EventBus } from '../../event-system/EventBus'
import { ModuleManager } from '../../module-system/ModuleManager'

// 模拟依赖
const mockDatabase = {
  execute: vi.fn(),
  query: vi.fn()
} as unknown as DatabaseManager

const mockEventBus = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
} as unknown as EventBus

const mockModuleManager = {
  getModule: vi.fn()
} as unknown as ModuleManager

// 测试数据
const mockExportItems: ExportItem[] = [
  {
    id: 'item-1',
    type: 'note',
    moduleId: 'notes',
    title: '测试笔记1',
    content: '这是一个测试笔记的内容',
    metadata: {
      tags: ['重要', '工作'],
      author: '测试用户'
    },
    lastModified: new Date('2024-01-01'),
    size: 1024
  },
  {
    id: 'item-2',
    type: 'task',
    moduleId: 'tasks',
    title: '测试任务2',
    content: '这是一个测试任务的内容',
    metadata: {
      priority: 'high',
      status: 'pending'
    },
    lastModified: new Date('2024-01-02'),
    size: 512
  },
  {
    id: 'item-3',
    type: 'mindmap',
    moduleId: 'mindmap',
    title: '测试思维导图3',
    content: { nodes: [], links: [] },
    metadata: {
      tags: ['创意'],
      nodeCount: 10
    },
    lastModified: new Date('2024-01-03'),
    size: 2048
  }
]

describe('EnhancedExportService', () => {
  let exportService: EnhancedExportService

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // 设置数据库模拟
    mockDatabase.execute = vi.fn().mockResolvedValue({ changes: 1 })
    mockDatabase.query = vi.fn().mockResolvedValue([])
    
    // 创建服务实例
    exportService = new EnhancedExportService(mockDatabase, mockEventBus, mockModuleManager)
    
    // 等待初始化完成
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('服务初始化', () => {
    it('应该正确初始化导出服务', () => {
      expect(exportService).toBeDefined()
      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS export_history')
      )
      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS export_templates')
      )
    })

    it('应该获取支持的导出格式', () => {
      const formats = exportService.getSupportedFormats()
      
      expect(formats).toHaveLength(7)
      expect(formats.map(f => f.format)).toContain('pdf')
      expect(formats.map(f => f.format)).toContain('markdown')
      expect(formats.map(f => f.format)).toContain('html')
      expect(formats.map(f => f.format)).toContain('json')
      expect(formats.map(f => f.format)).toContain('xlsx')
      expect(formats.map(f => f.format)).toContain('docx')
      expect(formats.map(f => f.format)).toContain('zip')
    })
  })

  describe('单个导出功能', () => {
    it('应该成功导出PDF格式', async () => {
      const config: EnhancedExportConfig = {
        format: 'pdf',
        scope: 'selected',
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
      }

      const result = await exportService.exportData(mockExportItems, config)

      expect(result.success).toBe(true)
      expect(result.format).toBe('pdf')
      expect(result.totalItems).toBe(3)
      expect(result.exportedItems).toBe(3)
      expect(result.filename).toMatch(/\.pdf$/)
      expect(result.duration).toBeGreaterThan(0)
      expect(mockEventBus.emit).toHaveBeenCalledWith('export:started', expect.any(Object))
      expect(mockEventBus.emit).toHaveBeenCalledWith('export:completed', expect.any(Object))
    })

    it('应该成功导出Markdown格式', async () => {
      const config: EnhancedExportConfig = {
        format: 'markdown',
        scope: 'selected',
        quality: 'standard',
        includeMetadata: true,
        includeImages: true,
        includeLinks: true,
        includeAttachments: false,
        includeComments: false,
        includeVersionHistory: false,
        formatOptions: {
          markdown: {
            flavor: 'github',
            includeYAMLFrontMatter: true,
            linkStyle: 'inline'
          }
        }
      }

      const result = await exportService.exportData(mockExportItems, config)

      expect(result.success).toBe(true)
      expect(result.format).toBe('markdown')
      expect(result.filename).toMatch(/\.markdown$/)
    })

    it('应该成功导出JSON格式', async () => {
      const config: EnhancedExportConfig = {
        format: 'json',
        scope: 'selected',
        quality: 'standard',
        includeMetadata: true,
        includeImages: false,
        includeLinks: true,
        includeAttachments: false,
        includeComments: false,
        includeVersionHistory: true
      }

      const result = await exportService.exportData(mockExportItems, config)

      expect(result.success).toBe(true)
      expect(result.format).toBe('json')
      expect(result.filename).toMatch(/\.json$/)
    })
  })

  describe('批量导出功能', () => {
    it('应该成功执行批量导出', async () => {
      const configs: EnhancedExportConfig[] = [
        {
          format: 'pdf',
          scope: 'selected',
          quality: 'standard',
          includeMetadata: true,
          includeImages: true,
          includeLinks: true,
          includeAttachments: false,
          includeComments: false,
          includeVersionHistory: false
        },
        {
          format: 'markdown',
          scope: 'selected',
          quality: 'standard',
          includeMetadata: true,
          includeImages: false,
          includeLinks: true,
          includeAttachments: false,
          includeComments: false,
          includeVersionHistory: false
        },
        {
          format: 'json',
          scope: 'selected',
          quality: 'standard',
          includeMetadata: true,
          includeImages: false,
          includeLinks: true,
          includeAttachments: false,
          includeComments: false,
          includeVersionHistory: true
        }
      ]

      const results = await exportService.exportMultipleFormats(mockExportItems, configs)

      expect(results).toHaveLength(3)
      expect(results.every(r => r.success)).toBe(true)
      expect(results.map(r => r.format)).toEqual(['pdf', 'markdown', 'json'])
    })

    it('应该处理批量导出中的部分失败', async () => {
      // 模拟一个会失败的配置
      const configs: EnhancedExportConfig[] = [
        {
          format: 'pdf',
          scope: 'selected',
          quality: 'standard',
          includeMetadata: true,
          includeImages: true,
          includeLinks: true,
          includeAttachments: false,
          includeComments: false,
          includeVersionHistory: false
        },
        {
          format: 'invalid' as any, // 无效格式
          scope: 'selected',
          quality: 'standard',
          includeMetadata: true,
          includeImages: true,
          includeLinks: true,
          includeAttachments: false,
          includeComments: false,
          includeVersionHistory: false
        }
      ]

      const results = await exportService.exportMultipleFormats(mockExportItems, configs)

      expect(results).toHaveLength(1) // 只有成功的导出
      expect(results[0].success).toBe(true)
      expect(results[0].format).toBe('pdf')
    })
  })

  describe('数据过滤功能', () => {
    it('应该根据日期范围过滤项目', async () => {
      const config: EnhancedExportConfig = {
        format: 'json',
        scope: 'selected',
        quality: 'standard',
        includeMetadata: true,
        includeImages: true,
        includeLinks: true,
        includeAttachments: false,
        includeComments: false,
        includeVersionHistory: false,
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-01-02')
        }
      }

      const result = await exportService.exportData(mockExportItems, config)

      expect(result.success).toBe(true)
      expect(result.exportedItems).toBe(2) // 只有前两个项目在日期范围内
    })

    it('应该根据标签过滤项目', async () => {
      const config: EnhancedExportConfig = {
        format: 'json',
        scope: 'selected',
        quality: 'standard',
        includeMetadata: true,
        includeImages: true,
        includeLinks: true,
        includeAttachments: false,
        includeComments: false,
        includeVersionHistory: false,
        tags: ['重要']
      }

      const result = await exportService.exportData(mockExportItems, config)

      expect(result.success).toBe(true)
      expect(result.exportedItems).toBe(1) // 只有第一个项目有"重要"标签
    })

    it('应该根据模块过滤项目', async () => {
      const config: EnhancedExportConfig = {
        format: 'json',
        scope: 'selected',
        quality: 'standard',
        includeMetadata: true,
        includeImages: true,
        includeLinks: true,
        includeAttachments: false,
        includeComments: false,
        includeVersionHistory: false,
        modules: ['notes', 'tasks']
      }

      const result = await exportService.exportData(mockExportItems, config)

      expect(result.success).toBe(true)
      expect(result.exportedItems).toBe(2) // 只有notes和tasks模块的项目
    })
  })

  describe('进度监控功能', () => {
    it('应该报告导出进度', async () => {
      const config: EnhancedExportConfig = {
        format: 'pdf',
        scope: 'selected',
        quality: 'standard',
        includeMetadata: true,
        includeImages: true,
        includeLinks: true,
        includeAttachments: false,
        includeComments: false,
        includeVersionHistory: false
      }

      const progressEvents: any[] = []
      mockEventBus.emit = vi.fn().mockImplementation((event, data) => {
        if (event === 'export:progress') {
          progressEvents.push(data)
        }
      })

      await exportService.exportData(mockExportItems, config)

      expect(progressEvents.length).toBeGreaterThan(0)
      expect(progressEvents.some(e => e.progress.stage === 'preparing')).toBe(true)
      expect(progressEvents.some(e => e.progress.stage === 'collecting')).toBe(true)
      expect(progressEvents.some(e => e.progress.stage === 'processing')).toBe(true)
    })

    it('应该支持取消导出操作', async () => {
      const config: EnhancedExportConfig = {
        format: 'pdf',
        scope: 'selected',
        quality: 'standard',
        includeMetadata: true,
        includeImages: true,
        includeLinks: true,
        includeAttachments: false,
        includeComments: false,
        includeVersionHistory: false
      }

      // 开始导出
      const exportPromise = exportService.exportData(mockExportItems, config)
      
      // 等待一小段时间后取消
      setTimeout(() => {
        const operations = Array.from((exportService as any).activeOperations.keys())
        if (operations.length > 0) {
          exportService.cancelExport(operations[0])
        }
      }, 50)

      const result = await exportPromise

      // 验证取消事件被发送
      expect(mockEventBus.emit).toHaveBeenCalledWith('export:cancelled', expect.any(Object))
    })
  })

  describe('模板系统', () => {
    it('应该创建导出模板', async () => {
      const templateData = {
        name: '测试模板',
        description: '用于测试的导出模板',
        category: 'document' as const,
        config: {
          format: 'pdf' as const,
          scope: 'selected' as const,
          quality: 'standard' as const,
          includeMetadata: true,
          includeImages: true,
          includeLinks: true,
          includeAttachments: false,
          includeComments: false,
          includeVersionHistory: false
        },
        variables: []
      }

      const templateId = await exportService.createExportTemplate(templateData)

      expect(templateId).toBeDefined()
      expect(typeof templateId).toBe('string')
      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO export_templates'),
        expect.any(Array)
      )
    })

    it('应该获取导出模板', () => {
      const templates = exportService.getExportTemplates()
      
      expect(Array.isArray(templates)).toBe(true)
      // 应该包含默认模板
      expect(templates.some(t => t.name === '标准文档导出')).toBe(true)
      expect(templates.some(t => t.name === '网页归档')).toBe(true)
    })

    it('应该按类别过滤模板', () => {
      const documentTemplates = exportService.getExportTemplates('document')
      const archiveTemplates = exportService.getExportTemplates('archive')
      
      expect(documentTemplates.every(t => t.category === 'document')).toBe(true)
      expect(archiveTemplates.every(t => t.category === 'archive')).toBe(true)
    })
  })

  describe('导出历史', () => {
    it('应该保存导出历史', async () => {
      const config: EnhancedExportConfig = {
        format: 'pdf',
        scope: 'selected',
        quality: 'standard',
        includeMetadata: true,
        includeImages: true,
        includeLinks: true,
        includeAttachments: false,
        includeComments: false,
        includeVersionHistory: false
      }

      await exportService.exportData(mockExportItems, config)

      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO export_history'),
        expect.any(Array)
      )
    })

    it('应该获取导出历史', () => {
      const history = exportService.getExportHistory(10)
      
      expect(Array.isArray(history)).toBe(true)
      expect(history.length).toBeLessThanOrEqual(10)
    })

    it('应该清理过期的导出历史', async () => {
      const deletedCount = await exportService.cleanupExportHistory(30)
      
      expect(typeof deletedCount).toBe('number')
      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM export_history'),
        expect.any(Array)
      )
    })
  })

  describe('错误处理', () => {
    it('应该处理无效的导出格式', async () => {
      const config: EnhancedExportConfig = {
        format: 'invalid' as any,
        scope: 'selected',
        quality: 'standard',
        includeMetadata: true,
        includeImages: true,
        includeLinks: true,
        includeAttachments: false,
        includeComments: false,
        includeVersionHistory: false
      }

      const result = await exportService.exportData(mockExportItems, config)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].error).toContain('不支持的导出格式')
    })

    it('应该处理无效的PDF边距', async () => {
      const config: EnhancedExportConfig = {
        format: 'pdf',
        scope: 'selected',
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
            margins: { top: -10, right: 20, bottom: 20, left: 20 }, // 无效的负边距
            headerFooter: true,
            pageNumbers: true,
            tableOfContents: true
          }
        }
      }

      const result = await exportService.exportData(mockExportItems, config)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].error).toContain('PDF边距不能为负数')
    })

    it('应该处理空项目列表', async () => {
      const config: EnhancedExportConfig = {
        format: 'pdf',
        scope: 'selected',
        quality: 'standard',
        includeMetadata: true,
        includeImages: true,
        includeLinks: true,
        includeAttachments: false,
        includeComments: false,
        includeVersionHistory: false
      }

      const result = await exportService.exportData([], config)

      expect(result.success).toBe(true)
      expect(result.totalItems).toBe(0)
      expect(result.exportedItems).toBe(0)
    })
  })
})
