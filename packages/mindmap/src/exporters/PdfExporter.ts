/**
 * PDF导出器
 * 导出高质量的PDF文档格式
 */

import { MindMapData, ExportConfig, Exporter } from '../types'

// 简化的PDF生成器（实际项目中可以使用jsPDF或类似库）
interface PDFDocument {
  addPage(): void
  setFontSize(size: number): void
  text(text: string, x: number, y: number): void
  circle(x: number, y: number, radius: number, style?: string): void
  rect(x: number, y: number, width: number, height: number, style?: string): void
  line(x1: number, y1: number, x2: number, y2: number): void
  setDrawColor(r: number, g: number, b: number): void
  setFillColor(r: number, g: number, b: number): void
  setTextColor(r: number, g: number, b: number): void
  output(type: 'blob'): Blob
}

export class PdfExporter implements Exporter {
  format: ExportConfig['format'] = 'pdf'

  async export(data: MindMapData, config: ExportConfig): Promise<Blob> {
    const {
      width = 1200,
      height = 800,
      backgroundColor = '#ffffff'
    } = config

    // 创建PDF文档（这里使用模拟实现）
    const pdf = await this.createPdfDocument(width, height)
    
    // 设置背景
    this.setBackground(pdf, backgroundColor, width, height)
    
    // 计算布局
    const bounds = this.calculateBounds(data)
    const scale = this.calculateScale(bounds, width, height)
    const offsetX = (width - bounds.width * scale) / 2 - bounds.minX * scale
    const offsetY = (height - bounds.height * scale) / 2 - bounds.minY * scale

    // 绘制连接线
    this.drawLinks(pdf, data, offsetX, offsetY, scale)
    
    // 绘制节点
    this.drawNodes(pdf, data, offsetX, offsetY, scale)
    
    // 添加元数据
    if (config.includeMetadata && data.metadata) {
      this.addMetadata(pdf, data.metadata)
    }

    // 生成PDF
    return pdf.output('blob')
  }

  /**
   * 创建PDF文档
   */
  private async createPdfDocument(width: number, height: number): Promise<PDFDocument> {
    // 这里是简化实现，实际项目中应该使用专业的PDF库
    // 例如：jsPDF, PDFKit等
    
    return new Promise((resolve) => {
      // 模拟异步PDF创建
      setTimeout(() => {
        const mockPdf: PDFDocument = {
          addPage: () => {},
          setFontSize: (size: number) => {},
          text: (text: string, x: number, y: number) => {},
          circle: (x: number, y: number, radius: number, style?: string) => {},
          rect: (x: number, y: number, width: number, height: number, style?: string) => {},
          line: (x1: number, y1: number, x2: number, y2: number) => {},
          setDrawColor: (r: number, g: number, b: number) => {},
          setFillColor: (r: number, g: number, b: number) => {},
          setTextColor: (r: number, g: number, b: number) => {},
          output: (type: 'blob') => {
            // 创建一个简单的PDF Blob
            const pdfContent = this.generatePdfContent(width, height)
            return new Blob([pdfContent], { type: 'application/pdf' })
          }
        }
        resolve(mockPdf)
      }, 100)
    })
  }

  /**
   * 设置背景
   */
  private setBackground(pdf: PDFDocument, backgroundColor: string, width: number, height: number): void {
    const color = this.hexToRgb(backgroundColor)
    pdf.setFillColor(color.r, color.g, color.b)
    pdf.rect(0, 0, width, height, 'F')
  }

  /**
   * 计算边界框
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
    return Math.min(scaleX, scaleY, 1)
  }

  /**
   * 绘制连接线
   */
  private drawLinks(
    pdf: PDFDocument, 
    data: MindMapData, 
    offsetX: number, 
    offsetY: number, 
    scale: number
  ): void {
    data.links.forEach(link => {
      const sourceNode = data.nodes.find(n => n.id === link.source)
      const targetNode = data.nodes.find(n => n.id === link.target)
      
      if (!sourceNode || !targetNode) return

      const sx = (sourceNode.x || 0) * scale + offsetX
      const sy = (sourceNode.y || 0) * scale + offsetY
      const tx = (targetNode.x || 0) * scale + offsetX
      const ty = (targetNode.y || 0) * scale + offsetY

      // 设置线条颜色
      const color = this.hexToRgb(link.style?.color || '#999999')
      pdf.setDrawColor(color.r, color.g, color.b)
      
      // 绘制连接线
      pdf.line(sx, sy, tx, ty)
    })
  }

  /**
   * 绘制节点
   */
  private drawNodes(
    pdf: PDFDocument, 
    data: MindMapData, 
    offsetX: number, 
    offsetY: number, 
    scale: number
  ): void {
    data.nodes.forEach(node => {
      const x = (node.x || 0) * scale + offsetX
      const y = (node.y || 0) * scale + offsetY
      const style = node.style || {}
      
      // 绘制节点背景
      const bgColor = this.hexToRgb(style.backgroundColor || '#ffffff')
      pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b)
      
      const borderColor = this.hexToRgb(style.borderColor || '#cccccc')
      pdf.setDrawColor(borderColor.r, borderColor.g, borderColor.b)
      
      if (style.shape === 'rect') {
        const width = (style.width || 80) * scale
        const height = (style.height || 40) * scale
        pdf.rect(x - width/2, y - height/2, width, height, 'FD')
      } else {
        const radius = (style.radius || 20) * scale
        pdf.circle(x, y, radius, 'FD')
      }
      
      // 绘制文本
      const textColor = this.hexToRgb(style.fontColor || '#333333')
      pdf.setTextColor(textColor.r, textColor.g, textColor.b)
      pdf.setFontSize((style.fontSize || 14) * scale)
      
      // 简单的文本居中（实际实现需要更复杂的文本测量）
      const textLines = this.wrapText(node.text, (style.radius || 20) * 2 * scale)
      textLines.forEach((line, index) => {
        const lineY = y + (index - textLines.length/2 + 0.5) * (style.fontSize || 14) * scale * 1.2
        pdf.text(line, x, lineY)
      })
    })
  }

  /**
   * 添加元数据
   */
  private addMetadata(pdf: PDFDocument, metadata: any): void {
    // 在PDF中添加文档信息
    // 实际实现中可以使用PDF库的元数据API
    
    if (metadata.title || metadata.description) {
      // 在页面底部添加元数据信息
      pdf.setFontSize(10)
      pdf.setTextColor(128, 128, 128)
      
      let infoY = 750 // 页面底部
      
      if (metadata.title) {
        pdf.text(`标题: ${metadata.title}`, 50, infoY)
        infoY += 15
      }
      
      if (metadata.description) {
        pdf.text(`描述: ${metadata.description}`, 50, infoY)
        infoY += 15
      }
      
      if (metadata.createdAt) {
        pdf.text(`创建时间: ${metadata.createdAt.toLocaleString()}`, 50, infoY)
      }
    }
  }

  /**
   * 文本换行
   */
  private wrapText(text: string, maxWidth: number): string[] {
    // 简化的文本换行实现
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      // 简单的宽度估算
      if (testLine.length * 8 > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    })
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }

  /**
   * 十六进制颜色转RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 }
  }

  /**
   * 生成简单的PDF内容
   */
  private generatePdfContent(width: number, height: number): string {
    // 这是一个非常简化的PDF内容生成
    // 实际项目中应该使用专业的PDF库
    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${width} ${height}]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(MindMap Export) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF`
  }
}

export const pdfExporter = new PdfExporter()
