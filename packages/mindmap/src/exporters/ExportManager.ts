/**
 * 导出管理器
 * 统一管理所有导出格式，提供高质量的导出功能
 */

import { MindMapData, ExportConfig, Exporter } from '../types'
import { PngExporter } from './PngExporter'
import { SvgExporter } from './SvgExporter'
import { PdfExporter } from './PdfExporter'
import { JsonExporter } from './JsonExporter'

interface ExportProgress {
  /** 当前步骤 */
  step: string
  /** 进度百分比 */
  progress: number
  /** 是否完成 */
  completed: boolean
  /** 错误信息 */
  error?: string
}

interface ExportResult {
  /** 导出的数据 */
  data: Blob | string
  /** 文件名 */
  filename: string
  /** 文件大小 */
  size: number
  /** 导出时间 */
  exportTime: number
  /** 导出配置 */
  config: ExportConfig
}

/**
 * 导出管理器类
 * 提供统一的导出接口和进度管理
 */
export class ExportManager {
  private exporters: Map<ExportConfig['format'], Exporter>
  private progressCallbacks: Set<(progress: ExportProgress) => void> = new Set()

  constructor() {
    // 注册所有导出器
    this.exporters = new Map([
      ['png', new PngExporter() as any],
      ['svg', new SvgExporter() as any],
      ['pdf', new PdfExporter() as any],
      ['json', new JsonExporter() as any]
    ])
  }

  /**
   * 导出思维导图
   */
  async export(data: MindMapData, config: ExportConfig): Promise<ExportResult> {
    const startTime = performance.now()
    
    try {
      // 验证配置
      this.validateConfig(config)
      
      // 获取导出器
      const exporter = this.exporters.get(config.format)
      if (!exporter) {
        throw new Error(`不支持的导出格式: ${config.format}`)
      }

      // 报告开始导出
      this.reportProgress({
        step: '准备导出',
        progress: 0,
        completed: false
      })

      // 预处理数据
      const processedData = await this.preprocessData(data, config)
      
      this.reportProgress({
        step: '正在导出',
        progress: 30,
        completed: false
      })

      // 执行导出
      const exportedData = await exporter.export(processedData, config)
      
      this.reportProgress({
        step: '后处理',
        progress: 80,
        completed: false
      })

      // 后处理
      const result = await this.postprocessResult(exportedData, config)
      
      const endTime = performance.now()
      const exportTime = endTime - startTime

      // 报告完成
      this.reportProgress({
        step: '导出完成',
        progress: 100,
        completed: true
      })

      return {
        data: result.data,
        filename: result.filename,
        size: result.size,
        exportTime,
        config
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导出失败'
      
      this.reportProgress({
        step: '导出失败',
        progress: 0,
        completed: false,
        error: errorMessage
      })

      throw error
    }
  }

  /**
   * 批量导出多种格式
   */
  async exportMultiple(
    data: MindMapData, 
    configs: ExportConfig[]
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = []
    
    for (let i = 0; i < configs.length; i++) {
      const config = configs[i]
      
      this.reportProgress({
        step: `导出 ${config.format.toUpperCase()} (${i + 1}/${configs.length})`,
        progress: (i / configs.length) * 100,
        completed: false
      })

      try {
        const result = await this.export(data, config)
        results.push(result)
      } catch (error) {
        console.error(`导出 ${config.format} 失败:`, error)
        // 继续导出其他格式
      }
    }

    this.reportProgress({
      step: '批量导出完成',
      progress: 100,
      completed: true
    })

    return results
  }

  /**
   * 获取支持的导出格式
   */
  getSupportedFormats(): ExportConfig['format'][] {
    return Array.from(this.exporters.keys())
  }

  /**
   * 获取格式信息
   */
  getFormatInfo(format: ExportConfig['format']): {
    name: string
    description: string
    extension: string
    mimeType: string
    features: string[]
  } {
    const formatInfo = {
      png: {
        name: 'PNG 图片',
        description: '高质量的位图图像，支持透明背景',
        extension: 'png',
        mimeType: 'image/png',
        features: ['高质量', '透明背景', '广泛支持', '适合分享']
      },
      svg: {
        name: 'SVG 矢量图',
        description: '可缩放的矢量图形，保持清晰度',
        extension: 'svg',
        mimeType: 'image/svg+xml',
        features: ['矢量图形', '无限缩放', '小文件', '可编辑']
      },
      pdf: {
        name: 'PDF 文档',
        description: '便携式文档格式，适合打印和分享',
        extension: 'pdf',
        mimeType: 'application/pdf',
        features: ['打印友好', '跨平台', '专业格式', '包含元数据']
      },
      json: {
        name: 'JSON 数据',
        description: '结构化数据格式，便于程序处理',
        extension: 'json',
        mimeType: 'application/json',
        features: ['结构化', '可编程', '轻量级', '易解析']
      }
    }

    return formatInfo[format] || {
      name: '未知格式',
      description: '未知的导出格式',
      extension: 'unknown',
      mimeType: 'application/octet-stream',
      features: []
    }
  }

  /**
   * 添加进度监听器
   */
  onProgress(callback: (progress: ExportProgress) => void): () => void {
    this.progressCallbacks.add(callback)
    
    // 返回取消监听的函数
    return () => {
      this.progressCallbacks.delete(callback)
    }
  }

  /**
   * 下载导出结果
   */
  async downloadResult(result: ExportResult): Promise<void> {
    try {
      let url: string
      
      if (result.data instanceof Blob) {
        url = URL.createObjectURL(result.data)
      } else {
        // 字符串数据转换为Blob
        const blob = new Blob([result.data], { 
          type: this.getFormatInfo(result.config.format).mimeType 
        })
        url = URL.createObjectURL(blob)
      }

      // 创建下载链接
      const link = document.createElement('a')
      link.href = url
      link.download = result.filename
      link.style.display = 'none'
      
      // 触发下载
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 清理URL
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('下载失败:', error)
      throw new Error('下载失败')
    }
  }

  // 私有方法

  private validateConfig(config: ExportConfig): void {
    if (!config.format) {
      throw new Error('导出格式不能为空')
    }

    if (!this.exporters.has(config.format)) {
      throw new Error(`不支持的导出格式: ${config.format}`)
    }

    if (config.width && config.width <= 0) {
      throw new Error('宽度必须大于0')
    }

    if (config.height && config.height <= 0) {
      throw new Error('高度必须大于0')
    }

    if (config.quality && (config.quality < 0 || config.quality > 1)) {
      throw new Error('质量参数必须在0-1之间')
    }
  }

  private async preprocessData(data: MindMapData, config: ExportConfig): Promise<MindMapData> {
    // 数据预处理，如坐标调整、样式优化等
    const processedData = { ...data }
    
    // 如果不包含元数据，移除元数据
    if (!config.includeMetadata) {
      processedData.metadata = undefined
      processedData.nodes = processedData.nodes.map(node => ({
        ...node,
        metadata: undefined
      }))
    }

    return processedData
  }

  private async postprocessResult(
    data: Blob | string, 
    config: ExportConfig
  ): Promise<{ data: Blob | string; filename: string; size: number }> {
    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
    const extension = this.getFormatInfo(config.format).extension
    const filename = `mindmap-${timestamp}.${extension}`
    
    // 计算文件大小
    let size: number
    if (data instanceof Blob) {
      size = data.size
    } else {
      size = new Blob([data]).size
    }

    return { data, filename, size }
  }

  private reportProgress(progress: ExportProgress): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress)
      } catch (error) {
        console.error('进度回调执行失败:', error)
      }
    })
  }
}

export const exportManager = new ExportManager()
