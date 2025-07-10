/**
 * PNG导出器
 */

import { MindMapData, ExportConfig, Exporter } from '../types'

export class PngExporter implements Exporter {
  format: ExportConfig['format'] = 'png'

  async export(data: MindMapData, config: ExportConfig): Promise<Blob> {
    const {
      width = 1200,
      height = 800,
      quality = 1,
      backgroundColor = '#ffffff'
    } = config

    // 创建离屏Canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('无法创建Canvas上下文')
    }

    canvas.width = width
    canvas.height = height

    // 设置背景
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    // 计算缩放和偏移
    const bounds = this.calculateBounds(data)
    const scale = this.calculateScale(bounds, width, height)
    const offsetX = (width - bounds.width * scale) / 2 - bounds.minX * scale
    const offsetY = (height - bounds.height * scale) / 2 - bounds.minY * scale

    // 应用变换
    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    // 绘制链接
    await this.drawLinks(ctx, data)

    // 绘制节点
    await this.drawNodes(ctx, data)

    ctx.restore()

    // 转换为Blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('导出失败'))
          }
        },
        'image/png',
        quality
      )
    })
  }

  /**
   * 计算边界
   */
  private calculateBounds(data: MindMapData) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    data.nodes.forEach(node => {
      const x = node.x || 0
      const y = node.y || 0
      const nodeWidth = this.estimateNodeWidth(node)
      const nodeHeight = this.estimateNodeHeight(node)

      minX = Math.min(minX, x - nodeWidth / 2)
      minY = Math.min(minY, y - nodeHeight / 2)
      maxX = Math.max(maxX, x + nodeWidth / 2)
      maxY = Math.max(maxY, y + nodeHeight / 2)
    })

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
  private calculateScale(bounds: any, canvasWidth: number, canvasHeight: number): number {
    const padding = 50
    const scaleX = (canvasWidth - padding * 2) / bounds.width
    const scaleY = (canvasHeight - padding * 2) / bounds.height
    return Math.min(scaleX, scaleY, 1) // 最大不超过1
  }

  /**
   * 绘制链接
   */
  private async drawLinks(ctx: CanvasRenderingContext2D, data: MindMapData) {
    data.links.forEach(link => {
      const sourceNode = data.nodes.find(n => n.id === link.source)
      const targetNode = data.nodes.find(n => n.id === link.target)
      
      if (!sourceNode || !targetNode) return

      const sourceX = sourceNode.x || 0
      const sourceY = sourceNode.y || 0
      const targetX = targetNode.x || 0
      const targetY = targetNode.y || 0

      const style = link.style || {}
      
      ctx.save()
      ctx.strokeStyle = style.strokeColor || '#6b7280'
      ctx.lineWidth = style.strokeWidth || 2
      ctx.globalAlpha = style.opacity || 0.8

      if (style.strokeDasharray) {
        const dashArray = style.strokeDasharray.split(',').map(Number)
        ctx.setLineDash(dashArray)
      }

      ctx.beginPath()
      ctx.moveTo(sourceX, sourceY)
      
      // 简单的贝塞尔曲线
      const midX = (sourceX + targetX) / 2
      ctx.quadraticCurveTo(midX, sourceY, targetX, targetY)
      
      ctx.stroke()
      ctx.restore()
    })
  }

  /**
   * 绘制节点
   */
  private async drawNodes(ctx: CanvasRenderingContext2D, data: MindMapData) {
    for (const node of data.nodes) {
      await this.drawNode(ctx, node)
    }
  }

  /**
   * 绘制单个节点
   */
  private async drawNode(ctx: CanvasRenderingContext2D, node: MindMapData['nodes'][0]) {
    const x = node.x || 0
    const y = node.y || 0
    const style = node.style || {}
    
    const nodeWidth = this.estimateNodeWidth(node)
    const nodeHeight = this.estimateNodeHeight(node)

    ctx.save()

    // 绘制背景
    ctx.fillStyle = style.backgroundColor || '#ffffff'
    ctx.strokeStyle = style.borderColor || '#d1d5db'
    ctx.lineWidth = style.borderWidth || 2

    const radius = style.borderRadius || 6
    this.drawRoundedRect(
      ctx,
      x - nodeWidth / 2,
      y - nodeHeight / 2,
      nodeWidth,
      nodeHeight,
      radius
    )
    
    ctx.fill()
    ctx.stroke()

    // 绘制文本
    ctx.fillStyle = style.fontColor || '#374151'
    ctx.font = `${style.fontWeight || 'normal'} ${style.fontSize || 14}px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    ctx.fillText(node.text, x, y)

    ctx.restore()
  }

  /**
   * 绘制圆角矩形
   */
  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  /**
   * 估算节点宽度
   */
  private estimateNodeWidth(node: MindMapData['nodes'][0]): number {
    const fontSize = node.style?.fontSize || 14
    const padding = (node.style?.padding || 8) * 2
    return Math.max(80, node.text.length * (fontSize * 0.6) + padding)
  }

  /**
   * 估算节点高度
   */
  private estimateNodeHeight(node: MindMapData['nodes'][0]): number {
    const fontSize = node.style?.fontSize || 14
    const padding = (node.style?.padding || 8) * 2
    return fontSize + padding
  }
}

export const pngExporter = new PngExporter()
