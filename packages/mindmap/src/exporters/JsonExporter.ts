/**
 * JSON导出器
 * 导出结构化的JSON数据格式
 */

import { MindMapData, ExportConfig, Exporter } from '../types'

interface ExportedJsonData {
  /** 导出格式版本 */
  version: string
  /** 导出时间 */
  exportedAt: string
  /** 导出配置 */
  exportConfig: ExportConfig
  /** 思维导图数据 */
  mindMapData: MindMapData
  /** 统计信息 */
  statistics: {
    nodeCount: number
    linkCount: number
    maxDepth: number
    totalTextLength: number
  }
  /** 兼容性信息 */
  compatibility: {
    minglogVersion: string
    format: string
    features: string[]
  }
}

export class JsonExporter implements Exporter {
  format: ExportConfig['format'] = 'json'

  async export(data: MindMapData, config: ExportConfig): Promise<string> {
    // 构建导出数据结构
    const exportData: ExportedJsonData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportConfig: config,
      mindMapData: this.processData(data, config),
      statistics: this.calculateStatistics(data),
      compatibility: {
        minglogVersion: '1.0.0',
        format: 'minglog-mindmap-json',
        features: ['nodes', 'links', 'styles', 'metadata', 'layout']
      }
    }

    // 根据配置决定输出格式
    if (config.includeMetadata === false) {
      // 简化格式，只包含核心数据
      return JSON.stringify(exportData.mindMapData, null, 2)
    } else {
      // 完整格式，包含所有信息
      return JSON.stringify(exportData, null, 2)
    }
  }

  /**
   * 处理数据
   */
  private processData(data: MindMapData, config: ExportConfig): MindMapData {
    const processedData: MindMapData = {
      nodes: data.nodes.map(node => this.processNode(node, config)),
      links: data.links.map(link => this.processLink(link, config)),
      rootId: data.rootId,
      metadata: config.includeMetadata ? data.metadata : undefined
    }

    return processedData
  }

  /**
   * 处理节点数据
   */
  private processNode(node: any, config: ExportConfig): any {
    const processedNode: any = {
      id: node.id,
      text: node.text,
      level: node.level,
      children: node.children || [],
      x: node.x,
      y: node.y
    }

    // 添加父节点ID
    if (node.parentId) {
      processedNode.parentId = node.parentId
    }

    // 添加样式信息
    if (node.style) {
      processedNode.style = {
        backgroundColor: node.style.backgroundColor,
        borderColor: node.style.borderColor,
        borderWidth: node.style.borderWidth,
        borderRadius: node.style.borderRadius,
        fontSize: node.style.fontSize,
        fontColor: node.style.fontColor,
        fontWeight: node.style.fontWeight,
        fontFamily: node.style.fontFamily,
        padding: node.style.padding,
        radius: node.style.radius,
        shape: node.style.shape,
        width: node.style.width,
        height: node.style.height
      }
    }

    // 添加元数据
    if (config.includeMetadata && node.metadata) {
      processedNode.metadata = {
        createdAt: node.metadata.createdAt?.toISOString(),
        updatedAt: node.metadata.updatedAt?.toISOString(),
        tags: node.metadata.tags,
        notes: node.metadata.notes,
        attachments: node.metadata.attachments,
        customData: node.metadata.customData
      }
    }

    return processedNode
  }

  /**
   * 处理连接数据
   */
  private processLink(link: any, config: ExportConfig): any {
    const processedLink: any = {
      id: link.id,
      source: link.source,
      target: link.target,
      type: link.type || 'parent-child'
    }

    // 添加样式信息
    if (link.style) {
      processedLink.style = {
        color: link.style.color,
        width: link.style.width,
        dashArray: link.style.dashArray,
        opacity: link.style.opacity
      }
    }

    // 添加元数据
    if (config.includeMetadata && link.metadata) {
      processedLink.metadata = {
        createdAt: link.metadata.createdAt?.toISOString(),
        label: link.metadata.label,
        weight: link.metadata.weight,
        customData: link.metadata.customData
      }
    }

    return processedLink
  }

  /**
   * 计算统计信息
   */
  private calculateStatistics(data: MindMapData): ExportedJsonData['statistics'] {
    const nodeCount = data.nodes.length
    const linkCount = data.links.length
    
    // 计算最大深度
    const maxDepth = Math.max(...data.nodes.map(node => node.level))
    
    // 计算总文本长度
    const totalTextLength = data.nodes.reduce((total, node) => {
      return total + (node.text?.length || 0)
    }, 0)

    return {
      nodeCount,
      linkCount,
      maxDepth,
      totalTextLength
    }
  }

  /**
   * 验证导出数据
   */
  static validateExportedData(jsonString: string): {
    isValid: boolean
    errors: string[]
    data?: ExportedJsonData
  } {
    const errors: string[] = []
    
    try {
      const data = JSON.parse(jsonString)
      
      // 检查基本结构
      if (!data.mindMapData) {
        errors.push('缺少 mindMapData 字段')
      }
      
      if (!data.mindMapData?.nodes || !Array.isArray(data.mindMapData.nodes)) {
        errors.push('mindMapData.nodes 必须是数组')
      }
      
      if (!data.mindMapData?.links || !Array.isArray(data.mindMapData.links)) {
        errors.push('mindMapData.links 必须是数组')
      }
      
      if (!data.mindMapData?.rootId) {
        errors.push('缺少 rootId 字段')
      }
      
      // 检查节点数据
      if (data.mindMapData?.nodes) {
        data.mindMapData.nodes.forEach((node: any, index: number) => {
          if (!node.id) {
            errors.push(`节点 ${index} 缺少 id 字段`)
          }
          if (!node.text) {
            errors.push(`节点 ${index} 缺少 text 字段`)
          }
          if (typeof node.level !== 'number') {
            errors.push(`节点 ${index} 的 level 字段必须是数字`)
          }
        })
      }
      
      // 检查连接数据
      if (data.mindMapData?.links) {
        data.mindMapData.links.forEach((link: any, index: number) => {
          if (!link.id) {
            errors.push(`连接 ${index} 缺少 id 字段`)
          }
          if (!link.source) {
            errors.push(`连接 ${index} 缺少 source 字段`)
          }
          if (!link.target) {
            errors.push(`连接 ${index} 缺少 target 字段`)
          }
        })
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        data: errors.length === 0 ? data : undefined
      }
      
    } catch (error) {
      errors.push(`JSON 解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
      return {
        isValid: false,
        errors
      }
    }
  }

  /**
   * 从导出的JSON数据恢复思维导图数据
   */
  static importFromJson(jsonString: string): MindMapData {
    const validation = JsonExporter.validateExportedData(jsonString)
    
    if (!validation.isValid) {
      throw new Error(`导入失败: ${validation.errors.join(', ')}`)
    }
    
    const exportedData = validation.data!
    const mindMapData = exportedData.mindMapData
    
    // 恢复日期对象
    if (mindMapData.metadata) {
      if (mindMapData.metadata.createdAt) {
        mindMapData.metadata.createdAt = new Date(mindMapData.metadata.createdAt)
      }
      if (mindMapData.metadata.updatedAt) {
        mindMapData.metadata.updatedAt = new Date(mindMapData.metadata.updatedAt)
      }
    }
    
    // 恢复节点的日期对象
    mindMapData.nodes.forEach(node => {
      if (node.metadata) {
        if (node.metadata.createdAt) {
          node.metadata.createdAt = new Date(node.metadata.createdAt)
        }
        if (node.metadata.updatedAt) {
          node.metadata.updatedAt = new Date(node.metadata.updatedAt)
        }
      }
    })
    
    return mindMapData
  }

  /**
   * 生成导入/导出兼容性报告
   */
  static generateCompatibilityReport(data: ExportedJsonData): {
    isCompatible: boolean
    warnings: string[]
    recommendations: string[]
  } {
    const warnings: string[] = []
    const recommendations: string[] = []
    
    // 检查版本兼容性
    if (data.version !== '1.0.0') {
      warnings.push(`版本 ${data.version} 可能不完全兼容当前版本`)
      recommendations.push('建议升级到最新版本')
    }
    
    // 检查功能兼容性
    const requiredFeatures = ['nodes', 'links']
    const missingFeatures = requiredFeatures.filter(
      feature => !data.compatibility.features.includes(feature)
    )
    
    if (missingFeatures.length > 0) {
      warnings.push(`缺少必需功能: ${missingFeatures.join(', ')}`)
      recommendations.push('某些功能可能无法正常工作')
    }
    
    return {
      isCompatible: warnings.length === 0,
      warnings,
      recommendations
    }
  }
}

export const jsonExporter = new JsonExporter()
