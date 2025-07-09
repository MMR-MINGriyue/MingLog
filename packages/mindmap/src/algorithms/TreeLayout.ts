/**
 * 树形布局算法
 */

import { hierarchy, tree, HierarchyNode, HierarchyPointNode } from 'd3-hierarchy'
import { MindMapData, MindMapNode, LayoutAlgorithm, LayoutConfig } from '../types'

export class TreeLayout implements LayoutAlgorithm {
  name = 'tree'

  calculate(data: MindMapData, config: LayoutConfig): MindMapData {
    const {
      nodeSpacing = 120,
      levelSpacing = 200
    } = config

    // 构建层级数据结构
    const hierarchyData = this.buildHierarchyData(data)
    
    // 创建D3树布局
    const treeLayout = tree<MindMapNode>()
      .nodeSize([nodeSpacing, levelSpacing])
      .separation((a, b) => {
        // 根据节点内容长度调整间距
        const aWidth = this.estimateNodeWidth(a.data)
        const bWidth = this.estimateNodeWidth(b.data)
        return (aWidth + bWidth) / 2 / nodeSpacing + 0.5
      })

    // 计算布局
    const root = treeLayout(hierarchyData)

    // 更新节点位置
    const updatedNodes = data.nodes.map(node => {
      const layoutNode = this.findNodeInHierarchy(root, node.id)
      if (layoutNode) {
        return {
          ...node,
          x: layoutNode.y, // 注意：D3的x,y与我们的定义相反
          y: layoutNode.x
        }
      }
      return node
    })

    return {
      ...data,
      nodes: updatedNodes
    }
  }

  /**
   * 构建D3层级数据结构
   */
  private buildHierarchyData(data: MindMapData): HierarchyNode<MindMapNode> {
    const nodeMap = new Map<string, MindMapNode>()
    data.nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] })
    })

    // 构建父子关系
    data.nodes.forEach(node => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!
        const child = nodeMap.get(node.id)!
        parent.children.push(child)
      }
    })

    const rootNode = nodeMap.get(data.rootId)
    if (!rootNode) {
      throw new Error('未找到根节点')
    }

    return hierarchy(rootNode)
  }

  /**
   * 在层级结构中查找节点
   */
  private findNodeInHierarchy(
    root: HierarchyPointNode<MindMapNode>,
    nodeId: string
  ): HierarchyPointNode<MindMapNode> | null {
    if (root.data.id === nodeId) {
      return root
    }

    if (root.children) {
      for (const child of root.children) {
        const found = this.findNodeInHierarchy(child, nodeId)
        if (found) return found
      }
    }

    return null
  }

  /**
   * 估算节点宽度
   */
  private estimateNodeWidth(node: MindMapNode): number {
    const baseWidth = 80
    const charWidth = 8
    const padding = (node.style?.padding || 8) * 2
    
    return Math.max(baseWidth, node.text.length * charWidth + padding)
  }
}

export const treeLayout = new TreeLayout()
