/**
 * 导出服务
 * 提供思维导图的多格式导出功能
 */

import { MindMapData, ExportConfig } from '../types'

export interface IExportService {
  // 导出功能
  exportToPng(data: MindMapData, config?: ExportConfig): Promise<Blob>
  exportToSvg(data: MindMapData, config?: ExportConfig): Promise<string>
  exportToPdf(data: MindMapData, config?: ExportConfig): Promise<Blob>
  exportToJson(data: MindMapData, config?: ExportConfig): Promise<string>
  exportToMarkdown(data: MindMapData, config?: ExportConfig): Promise<string>
  exportToFreeMind(data: MindMapData, config?: ExportConfig): Promise<string>
  
  // 导出配置
  getDefaultConfig(format: string): ExportConfig
  validateConfig(config: ExportConfig): boolean
  
  // 批量导出
  exportMultiple(dataSets: MindMapData[], format: string, config?: ExportConfig): Promise<Blob[]>
}

export class ExportService implements IExportService {
  private coreAPI: any

  constructor(coreAPI?: any) {
    this.coreAPI = coreAPI
  }

  async exportToPng(data: MindMapData, config?: ExportConfig): Promise<Blob> {
    const exportConfig = { ...this.getDefaultConfig('png'), ...config }
    
    // 创建SVG字符串
    const svgString = await this.generateSvg(data, exportConfig)
    
    // 转换为PNG
    return this.svgToPng(svgString, exportConfig)
  }

  async exportToSvg(data: MindMapData, config?: ExportConfig): Promise<string> {
    const exportConfig = { ...this.getDefaultConfig('svg'), ...config }
    return this.generateSvg(data, exportConfig)
  }

  async exportToPdf(data: MindMapData, config?: ExportConfig): Promise<Blob> {
    const exportConfig = { ...this.getDefaultConfig('pdf'), ...config }
    
    // 先生成SVG
    const svgString = await this.generateSvg(data, exportConfig)
    
    // 转换为PDF
    return this.svgToPdf(svgString, exportConfig)
  }

  async exportToJson(data: MindMapData, config?: ExportConfig): Promise<string> {
    const exportConfig = { ...this.getDefaultConfig('json'), ...config }
    
    const exportData = {
      ...data,
      exportInfo: {
        format: 'json',
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        includeMetadata: exportConfig.includeMetadata
      }
    }

    if (!exportConfig.includeMetadata) {
      // 移除元数据
      exportData.nodes = exportData.nodes.map(node => ({
        id: node.id,
        text: node.text,
        level: node.level,
        parentId: node.parentId,
        children: node.children.map(child => ({
          id: child.id,
          text: child.text,
          level: child.level,
          parentId: child.parentId,
          children: []
        })),
        x: node.x,
        y: node.y,
        style: node.style
      }))
    }

    return JSON.stringify(exportData, null, 2)
  }

  async exportToMarkdown(data: MindMapData, config?: ExportConfig): Promise<string> {
    const exportConfig = { ...this.getDefaultConfig('markdown'), ...config }
    
    let markdown = ''
    
    // 添加标题
    if (data.metadata?.title) {
      markdown += `# ${data.metadata.title}\n\n`
    }
    
    if (data.metadata?.description) {
      markdown += `${data.metadata.description}\n\n`
    }
    
    // 构建层次结构
    const rootNode = data.nodes.find(node => node.id === data.rootId)
    if (rootNode) {
      markdown += this.nodeToMarkdown(rootNode, data.nodes, 0)
    }
    
    // 添加元数据
    if (exportConfig.includeMetadata && data.metadata) {
      markdown += '\n---\n\n'
      markdown += '## 元数据\n\n'
      markdown += `- 创建时间: ${data.metadata.createdAt?.toLocaleString()}\n`
      markdown += `- 更新时间: ${data.metadata.updatedAt?.toLocaleString()}\n`
      markdown += `- 版本: ${data.metadata.version}\n`
      markdown += `- 节点数量: ${data.nodes.length}\n`
      markdown += `- 链接数量: ${data.links.length}\n`
    }
    
    return markdown
  }

  async exportToFreeMind(data: MindMapData, config?: ExportConfig): Promise<string> {
    const exportConfig = { ...this.getDefaultConfig('freemind'), ...config }
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<map version="1.0.1">\n'
    
    const rootNode = data.nodes.find(node => node.id === data.rootId)
    if (rootNode) {
      xml += this.nodeToFreeMind(rootNode, data.nodes, 1)
    }
    
    xml += '</map>\n'
    
    return xml
  }

  getDefaultConfig(format: string): ExportConfig {
    const baseConfig: ExportConfig = {
      format: format as any,
      width: 1200,
      height: 800,
      quality: 1.0,
      backgroundColor: '#ffffff',
      includeMetadata: true
    }

    switch (format) {
      case 'png':
        return {
          ...baseConfig,
          format: 'png',
          quality: 0.9
        }
      case 'svg':
        return {
          ...baseConfig,
          format: 'svg'
        }
      case 'pdf':
        return {
          ...baseConfig,
          format: 'pdf',
          width: 842, // A4 width in points
          height: 595 // A4 height in points
        }
      case 'json':
        return {
          ...baseConfig,
          format: 'json'
        }
      default:
        return baseConfig
    }
  }

  validateConfig(config: ExportConfig): boolean {
    if (!config.format) return false
    if (config.width && config.width <= 0) return false
    if (config.height && config.height <= 0) return false
    if (config.quality && (config.quality < 0 || config.quality > 1)) return false
    
    return true
  }

  async exportMultiple(dataSets: MindMapData[], format: string, config?: ExportConfig): Promise<Blob[]> {
    const results: Blob[] = []
    
    for (const data of dataSets) {
      let blob: Blob
      
      switch (format) {
        case 'png':
          blob = await this.exportToPng(data, config)
          break
        case 'pdf':
          blob = await this.exportToPdf(data, config)
          break
        case 'svg':
          const svgString = await this.exportToSvg(data, config)
          blob = new Blob([svgString], { type: 'image/svg+xml' })
          break
        case 'json':
          const jsonString = await this.exportToJson(data, config)
          blob = new Blob([jsonString], { type: 'application/json' })
          break
        case 'markdown':
          const markdownString = await this.exportToMarkdown(data, config)
          blob = new Blob([markdownString], { type: 'text/markdown' })
          break
        case 'freemind':
          const freemindString = await this.exportToFreeMind(data, config)
          blob = new Blob([freemindString], { type: 'application/xml' })
          break
        default:
          throw new Error(`Unsupported format: ${format}`)
      }
      
      results.push(blob)
    }
    
    return results
  }

  private async generateSvg(data: MindMapData, config: ExportConfig): Promise<string> {
    const width = config.width || 1200
    const height = config.height || 800
    const backgroundColor = config.backgroundColor || '#ffffff'
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`
    svg += `<rect width="100%" height="100%" fill="${backgroundColor}"/>\n`
    
    // 计算边界框和缩放
    const bounds = this.calculateBounds(data)
    const scale = this.calculateScale(bounds, width, height)
    const offsetX = (width - bounds.width * scale) / 2 - bounds.minX * scale
    const offsetY = (height - bounds.height * scale) / 2 - bounds.minY * scale
    
    svg += `<g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">\n`
    
    // 渲染链接
    for (const link of data.links) {
      const sourceNode = data.nodes.find(n => n.id === link.source)
      const targetNode = data.nodes.find(n => n.id === link.target)
      
      if (sourceNode && targetNode && sourceNode.x !== undefined && sourceNode.y !== undefined &&
          targetNode.x !== undefined && targetNode.y !== undefined) {
        svg += this.renderLink(sourceNode, targetNode, link)
      }
    }
    
    // 渲染节点
    for (const node of data.nodes) {
      if (node.x !== undefined && node.y !== undefined) {
        svg += this.renderNode(node)
      }
    }
    
    svg += '</g>\n'
    svg += '</svg>'
    
    return svg
  }

  private calculateBounds(data: MindMapData): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    
    for (const node of data.nodes) {
      if (node.x !== undefined && node.y !== undefined) {
        minX = Math.min(minX, node.x - 60) // 考虑节点宽度
        maxX = Math.max(maxX, node.x + 60)
        minY = Math.min(minY, node.y - 20) // 考虑节点高度
        maxY = Math.max(maxY, node.y + 20)
      }
    }
    
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  private calculateScale(bounds: any, targetWidth: number, targetHeight: number): number {
    const scaleX = (targetWidth * 0.9) / bounds.width
    const scaleY = (targetHeight * 0.9) / bounds.height
    return Math.min(scaleX, scaleY, 1) // 不放大，只缩小
  }

  private renderNode(node: any): string {
    const x = node.x || 0
    const y = node.y || 0
    const style = node.style || {}
    
    const backgroundColor = style.backgroundColor || '#3B82F6'
    const textColor = style.textColor || '#FFFFFF'
    const borderColor = style.borderColor || '#1E40AF'
    const borderWidth = style.borderWidth || 2
    const borderRadius = style.borderRadius || 8
    const fontSize = style.fontSize || 14
    
    let svg = `<g transform="translate(${x}, ${y})">\n`
    svg += `<rect x="-60" y="-20" width="120" height="40" rx="${borderRadius}" ry="${borderRadius}" `
    svg += `fill="${backgroundColor}" stroke="${borderColor}" stroke-width="${borderWidth}"/>\n`
    svg += `<text x="0" y="5" text-anchor="middle" font-size="${fontSize}" fill="${textColor}" font-family="Arial, sans-serif">`
    svg += this.escapeXml(node.text)
    svg += '</text>\n'
    svg += '</g>\n'
    
    return svg
  }

  private renderLink(sourceNode: any, targetNode: any, link: any): string {
    const x1 = sourceNode.x || 0
    const y1 = sourceNode.y || 0
    const x2 = targetNode.x || 0
    const y2 = targetNode.y || 0
    
    const style = link.style || {}
    const strokeColor = style.strokeColor || '#6B7280'
    const strokeWidth = style.strokeWidth || 2
    
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>\n`
  }

  private async svgToPng(svgString: string, config: ExportConfig): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      canvas.width = config.width || 1200
      canvas.height = config.height || 800
      
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert SVG to PNG'))
          }
        }, 'image/png', config.quality || 0.9)
      }
      img.onerror = reject
      
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' })
      img.src = URL.createObjectURL(svgBlob)
    })
  }

  private async svgToPdf(svgString: string, config: ExportConfig): Promise<Blob> {
    // 这里需要使用PDF生成库，如jsPDF
    // 为了简化，这里返回一个占位符
    const pdfContent = `PDF conversion not implemented. SVG content:\n${svgString}`
    return new Blob([pdfContent], { type: 'application/pdf' })
  }

  private nodeToMarkdown(node: any, allNodes: any[], level: number): string {
    const indent = '  '.repeat(level)
    let markdown = `${indent}- ${node.text}\n`
    
    // 添加子节点
    const children = allNodes.filter(n => n.parentId === node.id)
    for (const child of children) {
      markdown += this.nodeToMarkdown(child, allNodes, level + 1)
    }
    
    return markdown
  }

  private nodeToFreeMind(node: any, allNodes: any[], level: number): string {
    const indent = '  '.repeat(level)
    let xml = `${indent}<node TEXT="${this.escapeXml(node.text)}">\n`
    
    // 添加子节点
    const children = allNodes.filter(n => n.parentId === node.id)
    for (const child of children) {
      xml += this.nodeToFreeMind(child, allNodes, level + 1)
    }
    
    xml += `${indent}</node>\n`
    return xml
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}
