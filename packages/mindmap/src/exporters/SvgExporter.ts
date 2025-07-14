/**
 * SVG导出器
 * 导出高质量的矢量图形格式
 */

import { MindMapData, ExportConfig, Exporter } from '../types'

export class SvgExporter implements Exporter {
  format: ExportConfig['format'] = 'svg'

  async export(data: MindMapData, config: ExportConfig): Promise<string> {
    const {
      width = 1200,
      height = 800,
      backgroundColor = '#ffffff'
    } = config

    // 计算思维导图的边界
    const bounds = this.calculateBounds(data)
    const scale = this.calculateScale(bounds, width, height)
    const offsetX = (width - bounds.width * scale) / 2 - bounds.minX * scale
    const offsetY = (height - bounds.height * scale) / 2 - bounds.minY * scale

    // 创建SVG文档
    const svg = this.createSvgDocument(width, height, backgroundColor)
    
    // 创建主要绘图组
    const mainGroup = this.createGroup(svg, offsetX, offsetY, scale)

    // 绘制连接线
    this.drawLinks(mainGroup, data)

    // 绘制节点
    this.drawNodes(mainGroup, data)

    // 添加元数据（如果需要）
    if (config.includeMetadata && data.metadata) {
      this.addMetadata(svg, data.metadata)
    }

    return svg.outerHTML
  }

  /**
   * 计算思维导图的边界框
   */
  private calculateBounds(data: MindMapData): {
    minX: number
    minY: number
    maxX: number
    maxY: number
    width: number
    height: number
  } {
    if (data.nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    data.nodes.forEach(node => {
      const x = node.x || 0
      const y = node.y || 0
      const radius = node.style?.radius || 20
      
      minX = Math.min(minX, x - radius)
      minY = Math.min(minY, y - radius)
      maxX = Math.max(maxX, x + radius)
      maxY = Math.max(maxY, y + radius)
    })

    // 添加边距
    const margin = 50
    minX -= margin
    minY -= margin
    maxX += margin
    maxY += margin

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  /**
   * 计算缩放比例
   */
  private calculateScale(bounds: any, targetWidth: number, targetHeight: number): number {
    const scaleX = targetWidth / bounds.width
    const scaleY = targetHeight / bounds.height
    return Math.min(scaleX, scaleY, 1) // 不放大，只缩小
  }

  /**
   * 创建SVG文档
   */
  private createSvgDocument(width: number, height: number, backgroundColor: string): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    
    svg.setAttribute('width', width.toString())
    svg.setAttribute('height', height.toString())
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')

    // 添加背景
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    background.setAttribute('width', '100%')
    background.setAttribute('height', '100%')
    background.setAttribute('fill', backgroundColor)
    svg.appendChild(background)

    // 添加样式定义
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
    style.textContent = this.getDefaultStyles()
    defs.appendChild(style)
    svg.appendChild(defs)

    return svg
  }

  /**
   * 创建绘图组
   */
  private createGroup(svg: SVGSVGElement, offsetX: number, offsetY: number, scale: number): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.setAttribute('transform', `translate(${offsetX}, ${offsetY}) scale(${scale})`)
    svg.appendChild(group)
    return group
  }

  /**
   * 绘制连接线
   */
  private drawLinks(group: SVGGElement, data: MindMapData): void {
    const linksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    linksGroup.setAttribute('class', 'mindmap-links')
    group.appendChild(linksGroup)

    data.links.forEach(link => {
      const sourceNode = data.nodes.find(n => n.id === link.source)
      const targetNode = data.nodes.find(n => n.id === link.target)
      
      if (!sourceNode || !targetNode) return

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      
      // 计算连接路径
      const pathData = this.calculateLinkPath(sourceNode, targetNode)
      path.setAttribute('d', pathData)
      path.setAttribute('class', 'mindmap-link')
      path.setAttribute('stroke', link.style?.color || '#999999')
      path.setAttribute('stroke-width', (link.style?.width || 2).toString())
      path.setAttribute('fill', 'none')
      
      linksGroup.appendChild(path)
    })
  }

  /**
   * 绘制节点
   */
  private drawNodes(group: SVGGElement, data: MindMapData): void {
    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    nodesGroup.setAttribute('class', 'mindmap-nodes')
    group.appendChild(nodesGroup)

    data.nodes.forEach(node => {
      const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      nodeGroup.setAttribute('class', 'mindmap-node')
      nodeGroup.setAttribute('transform', `translate(${node.x || 0}, ${node.y || 0})`)

      // 绘制节点背景
      const background = this.createNodeBackground(node)
      nodeGroup.appendChild(background)

      // 绘制节点文本
      const text = this.createNodeText(node)
      nodeGroup.appendChild(text)

      nodesGroup.appendChild(nodeGroup)
    })
  }

  /**
   * 创建节点背景
   */
  private createNodeBackground(node: any): SVGElement {
    const style = node.style || {}
    const shape = style.shape || 'circle'
    
    if (shape === 'circle') {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('r', (style.radius || 20).toString())
      circle.setAttribute('fill', style.backgroundColor || '#ffffff')
      circle.setAttribute('stroke', style.borderColor || '#cccccc')
      circle.setAttribute('stroke-width', (style.borderWidth || 2).toString())
      return circle
    } else {
      // 矩形节点
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      const width = style.width || 80
      const height = style.height || 40
      rect.setAttribute('x', (-width / 2).toString())
      rect.setAttribute('y', (-height / 2).toString())
      rect.setAttribute('width', width.toString())
      rect.setAttribute('height', height.toString())
      rect.setAttribute('rx', (style.borderRadius || 6).toString())
      rect.setAttribute('fill', style.backgroundColor || '#ffffff')
      rect.setAttribute('stroke', style.borderColor || '#cccccc')
      rect.setAttribute('stroke-width', (style.borderWidth || 2).toString())
      return rect
    }
  }

  /**
   * 创建节点文本
   */
  private createNodeText(node: any): SVGTextElement {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    const style = node.style || {}
    
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('dominant-baseline', 'central')
    text.setAttribute('fill', style.fontColor || '#333333')
    text.setAttribute('font-size', (style.fontSize || 14).toString())
    text.setAttribute('font-weight', style.fontWeight || 'normal')
    text.setAttribute('font-family', style.fontFamily || 'Arial, sans-serif')
    
    // 处理长文本换行
    const maxWidth = (style.radius || 20) * 1.5
    const words = node.text.split(' ')
    let line = ''
    let lineNumber = 0
    
    words.forEach((word: string, index: number) => {
      const testLine = line + word + ' '
      const testWidth = testLine.length * (style.fontSize || 14) * 0.6 // 估算宽度
      
      if (testWidth > maxWidth && line !== '') {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
        tspan.setAttribute('x', '0')
        tspan.setAttribute('dy', lineNumber === 0 ? '0' : '1.2em')
        tspan.textContent = line.trim()
        text.appendChild(tspan)
        
        line = word + ' '
        lineNumber++
      } else {
        line = testLine
      }
      
      // 最后一个词
      if (index === words.length - 1) {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
        tspan.setAttribute('x', '0')
        tspan.setAttribute('dy', lineNumber === 0 ? '0' : '1.2em')
        tspan.textContent = line.trim()
        text.appendChild(tspan)
      }
    })
    
    return text
  }

  /**
   * 计算连接路径
   */
  private calculateLinkPath(sourceNode: any, targetNode: any): string {
    const sx = sourceNode.x || 0
    const sy = sourceNode.y || 0
    const tx = targetNode.x || 0
    const ty = targetNode.y || 0
    
    // 使用贝塞尔曲线创建平滑连接
    const dx = tx - sx
    const dy = ty - sy
    const dr = Math.sqrt(dx * dx + dy * dy)
    
    // 控制点偏移
    const offset = dr * 0.3
    const cx1 = sx + offset
    const cy1 = sy
    const cx2 = tx - offset
    const cy2 = ty
    
    return `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`
  }

  /**
   * 添加元数据
   */
  private addMetadata(svg: SVGSVGElement, metadata: any): void {
    const metadataElement = document.createElementNS('http://www.w3.org/2000/svg', 'metadata')
    
    const info = document.createElement('info')
    if (metadata.title) {
      const title = document.createElement('title')
      title.textContent = metadata.title
      info.appendChild(title)
    }
    
    if (metadata.description) {
      const desc = document.createElement('description')
      desc.textContent = metadata.description
      info.appendChild(desc)
    }
    
    if (metadata.createdAt) {
      const created = document.createElement('created')
      created.textContent = metadata.createdAt.toISOString()
      info.appendChild(created)
    }
    
    metadataElement.appendChild(info)
    svg.appendChild(metadataElement)
  }

  /**
   * 获取默认样式
   */
  private getDefaultStyles(): string {
    return `
      .mindmap-link {
        stroke: #999999;
        stroke-width: 2;
        fill: none;
      }
      .mindmap-node {
        cursor: pointer;
      }
      .mindmap-node text {
        user-select: none;
        pointer-events: none;
      }
    `
  }
}

export const svgExporter = new SvgExporter()
