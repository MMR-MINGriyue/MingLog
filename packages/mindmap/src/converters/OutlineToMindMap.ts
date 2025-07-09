/**
 * 大纲转思维导图转换器
 */

import { v4 as uuidv4 } from 'uuid'
import { MindMapData, MindMapNode, MindMapLink, OutlineToMindMapConverter as IOutlineToMindMapConverter } from '../types'

// 大纲块接口（来自编辑器）
interface OutlineBlock {
  id: string
  content: string
  type: string
  level?: number
  children?: OutlineBlock[]
  parent_id?: string
  order?: number
  properties?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export class OutlineToMindMapConverter implements IOutlineToMindMapConverter {
  /**
   * 将大纲块数组转换为思维导图数据
   */
  convert(blocks: OutlineBlock[]): MindMapData {
    if (!blocks || blocks.length === 0) {
      throw new Error('大纲数据不能为空')
    }

    // 构建层级结构
    const hierarchicalBlocks = this.buildHierarchy(blocks)
    
    // 找到根节点
    const rootBlock = this.findRootBlock(hierarchicalBlocks)
    if (!rootBlock) {
      throw new Error('未找到根节点')
    }

    // 转换为思维导图节点
    const nodes: MindMapNode[] = []
    const links: MindMapLink[] = []
    
    this.convertNodeRecursive(rootBlock, 0, undefined, nodes, links)

    return {
      nodes,
      links,
      rootId: rootBlock.id,
      metadata: {
        title: rootBlock.content || '思维导图',
        createdAt: new Date(),
        version: '1.0.0'
      }
    }
  }

  /**
   * 构建层级结构
   */
  private buildHierarchy(blocks: OutlineBlock[]): OutlineBlock[] {
    const blockMap = new Map<string, OutlineBlock>()
    const rootBlocks: OutlineBlock[] = []

    // 创建块映射
    blocks.forEach(block => {
      blockMap.set(block.id, { ...block, children: [] })
    })

    // 构建父子关系
    blocks.forEach(block => {
      const currentBlock = blockMap.get(block.id)!
      
      if (block.parent_id && blockMap.has(block.parent_id)) {
        const parentBlock = blockMap.get(block.parent_id)!
        parentBlock.children = parentBlock.children || []
        parentBlock.children.push(currentBlock)
      } else {
        rootBlocks.push(currentBlock)
      }
    })

    // 按order排序
    this.sortChildrenRecursive(rootBlocks)

    return rootBlocks
  }

  /**
   * 递归排序子节点
   */
  private sortChildrenRecursive(blocks: OutlineBlock[]) {
    blocks.sort((a, b) => (a.order || 0) - (b.order || 0))
    
    blocks.forEach(block => {
      if (block.children && block.children.length > 0) {
        this.sortChildrenRecursive(block.children)
      }
    })
  }

  /**
   * 找到根节点
   */
  private findRootBlock(blocks: OutlineBlock[]): OutlineBlock | null {
    if (blocks.length === 1) {
      return blocks[0]
    }

    // 如果有多个根节点，创建一个虚拟根节点
    if (blocks.length > 1) {
      return {
        id: uuidv4(),
        content: '根节点',
        type: 'root',
        level: 0,
        children: blocks,
        created_at: new Date().toISOString()
      }
    }

    return null
  }

  /**
   * 递归转换节点
   */
  private convertNodeRecursive(
    block: OutlineBlock,
    level: number,
    parentId: string | undefined,
    nodes: MindMapNode[],
    links: MindMapLink[]
  ): void {
    // 创建思维导图节点
    const mindMapNode = this.convertNode(block, level, parentId)
    nodes.push(mindMapNode)

    // 如果有父节点，创建链接
    if (parentId) {
      const link: MindMapLink = {
        id: uuidv4(),
        source: parentId,
        target: block.id,
        type: 'parent-child',
        style: {
          strokeWidth: 2,
          strokeColor: this.getLinkColor(level),
          opacity: 0.8
        }
      }
      links.push(link)
    }

    // 递归处理子节点
    if (block.children && block.children.length > 0) {
      block.children.forEach(child => {
        this.convertNodeRecursive(child, level + 1, block.id, nodes, links)
      })
    }
  }

  /**
   * 转换单个节点
   */
  convertNode(block: OutlineBlock, level: number, parentId?: string): MindMapNode {
    return {
      id: block.id,
      text: this.extractTextFromContent(block.content),
      level,
      parentId,
      children: [],
      style: this.getNodeStyle(level, block.type),
      metadata: {
        blockId: block.id,
        properties: block.properties,
        createdAt: block.created_at ? new Date(block.created_at) : new Date(),
        updatedAt: block.updated_at ? new Date(block.updated_at) : new Date()
      }
    }
  }

  /**
   * 从内容中提取纯文本
   */
  private extractTextFromContent(content: string): string {
    if (!content) return '空节点'

    // 移除HTML标签
    const textContent = content.replace(/<[^>]*>/g, '')
    
    // 限制长度
    const maxLength = 50
    if (textContent.length > maxLength) {
      return textContent.substring(0, maxLength) + '...'
    }

    return textContent || '空节点'
  }

  /**
   * 获取节点样式
   */
  private getNodeStyle(level: number, blockType: string) {
    const baseStyle = {
      padding: 8,
      borderRadius: 6,
      borderWidth: 2,
      fontSize: 14,
      fontColor: '#333333'
    }

    // 根据层级设置样式
    switch (level) {
      case 0: // 根节点
        return {
          ...baseStyle,
          backgroundColor: '#4F46E5',
          borderColor: '#3730A3',
          fontColor: '#FFFFFF',
          fontSize: 18,
          fontWeight: 'bold' as const,
          padding: 12
        }
      case 1: // 一级节点
        return {
          ...baseStyle,
          backgroundColor: '#7C3AED',
          borderColor: '#5B21B6',
          fontColor: '#FFFFFF',
          fontSize: 16,
          fontWeight: 'bold' as const
        }
      case 2: // 二级节点
        return {
          ...baseStyle,
          backgroundColor: '#EC4899',
          borderColor: '#BE185D',
          fontColor: '#FFFFFF'
        }
      default: // 三级及以下
        return {
          ...baseStyle,
          backgroundColor: '#F3F4F6',
          borderColor: '#D1D5DB',
          fontColor: '#374151'
        }
    }
  }

  /**
   * 获取链接颜色
   */
  private getLinkColor(level: number): string {
    const colors = [
      '#4F46E5', // 蓝色
      '#7C3AED', // 紫色
      '#EC4899', // 粉色
      '#10B981', // 绿色
      '#F59E0B'  // 橙色
    ]
    
    return colors[level % colors.length]
  }
}

// 导出默认实例
export const outlineToMindMapConverter = new OutlineToMindMapConverter()
