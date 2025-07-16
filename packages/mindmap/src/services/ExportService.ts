/**
 * 导出服务
 * 提供思维导图导出功能和格式管理
 */

import { MindMapData, ExportConfig } from '../types'
import { ExportManager } from '../exporters/ExportManager'

export interface IExportService {
  /** 导出思维导图 */
  exportMindMap(data: MindMapData, config: ExportConfig): Promise<Blob | string>
  
  /** 获取支持的导出格式 */
  getSupportedFormats(): ExportConfig['format'][]
  
  /** 获取默认导出配置 */
  getDefaultConfig(format: ExportConfig['format']): ExportConfig
  
  /** 验证导出配置 */
  validateConfig(config: ExportConfig): boolean
  
  /** 预估导出文件大小 */
  estimateFileSize(data: MindMapData, config: ExportConfig): Promise<number>
  
  /** 批量导出 */
  batchExport(data: MindMapData, configs: ExportConfig[]): Promise<Array<{ config: ExportConfig; result: Blob | string }>>
}

/**
 * 导出服务实现
 */
export class ExportService implements IExportService {
  private exportManager: ExportManager

  constructor() {
    this.exportManager = new ExportManager()
  }

  async exportMindMap(data: MindMapData, config: ExportConfig): Promise<Blob | string> {
    if (!this.validateConfig(config)) {
      throw new Error('Invalid export configuration')
    }

    try {
      const result = await this.exportManager.export(data, config)
      return result.data
    } catch (error) {
      throw new Error(`Failed to export mind map: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  getSupportedFormats(): ExportConfig['format'][] {
    return ['png', 'svg', 'pdf', 'json']
  }

  getDefaultConfig(format: ExportConfig['format']): ExportConfig {
    const defaultConfigs: Record<ExportConfig['format'], ExportConfig> = {
      png: {
        format: 'png',
        width: 1920,
        height: 1080,
        quality: 0.9,
        backgroundColor: '#ffffff',
        dpi: 300,
        includeMetadata: false
      },
      svg: {
        format: 'svg',
        width: 1920,
        height: 1080,
        backgroundColor: '#ffffff',
        includeMetadata: true
      },
      pdf: {
        format: 'pdf',
        width: 1920,
        height: 1080,
        backgroundColor: '#ffffff',
        includeMetadata: true,
        compress: true
      },
      json: {
        format: 'json',
        includeMetadata: true,
        compress: false
      }
    }

    return defaultConfigs[format]
  }

  validateConfig(config: ExportConfig): boolean {
    // 检查必需字段
    if (!config.format || !this.getSupportedFormats().includes(config.format)) {
      return false
    }

    // 检查尺寸配置
    if (config.format !== 'json') {
      if (config.width && (config.width <= 0 || config.width > 10000)) {
        return false
      }
      if (config.height && (config.height <= 0 || config.height > 10000)) {
        return false
      }
    }

    // 检查质量配置
    if (config.quality && (config.quality < 0 || config.quality > 1)) {
      return false
    }

    // 检查DPI配置
    if (config.dpi && (config.dpi < 72 || config.dpi > 600)) {
      return false
    }

    return true
  }

  async estimateFileSize(data: MindMapData, config: ExportConfig): Promise<number> {
    const nodeCount = data.nodes.length
    const linkCount = data.links.length

    // 基于格式和内容估算文件大小
    switch (config.format) {
      case 'png':
        const width = config.width || 1920
        const height = config.height || 1080
        const quality = config.quality || 0.9
        // PNG大小估算：像素数 * 4字节 * 压缩率
        return Math.round(width * height * 4 * (1 - quality * 0.7))

      case 'svg':
        // SVG大小估算：基于节点和链接数量
        return Math.round((nodeCount * 200 + linkCount * 50) * 1.2)

      case 'pdf':
        // PDF大小估算：基于内容复杂度
        return Math.round((nodeCount * 300 + linkCount * 100) * 1.5)

      case 'json':
        // JSON大小估算：基于数据结构
        const jsonString = JSON.stringify(data)
        return config.compress ? Math.round(jsonString.length * 0.3) : jsonString.length

      default:
        return 0
    }
  }

  async batchExport(data: MindMapData, configs: ExportConfig[]): Promise<Array<{ config: ExportConfig; result: Blob | string }>> {
    const results: Array<{ config: ExportConfig; result: Blob | string }> = []

    for (const config of configs) {
      try {
        const result = await this.exportMindMap(data, config)
        results.push({ config, result })
      } catch (error) {
        console.error(`Failed to export with config ${config.format}:`, error)
        // 继续处理其他配置，不中断批量导出
      }
    }

    return results
  }
}
