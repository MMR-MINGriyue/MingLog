/**
 * 径向布局算法
 */

import { MindMapData, MindMapNode, LayoutAlgorithm, LayoutConfig } from '../types'

export class RadialLayout implements LayoutAlgorithm {
  name = 'radial'

  calculate(data: MindMapData, config: LayoutConfig): MindMapData {
    const {
      nodeSpacing = 100,
      levelSpacing = 120
    } = config

    // 构建层级映射
    const levelMap = this.buildLevelMap(data)
    
    // 计算每层的节点位置
    const updatedNodes = data.nodes.map(node => {
      if (node.id === data.rootId) {
        // 根节点位于中心
        return {
          ...node,
          x: 0,
          y: 0
        }
      }

      const level = node.level
      const nodesInLevel = levelMap.get(level) || []
      const nodeIndex = nodesInLevel.findIndex(n => n.id === node.id)
      
      if (nodeIndex === -1) {
        return node
      }

      // 计算角度和半径
      const radius = level * levelSpacing
      const angleStep = (2 * Math.PI) / nodesInLevel.length
      const angle = nodeIndex * angleStep

      // 如果有父节点，调整角度以靠近父节点
      const adjustedAngle = this.adjustAngleForParent(node, data, angle)

      return {
        ...node,
        x: radius * Math.cos(adjustedAngle),
        y: radius * Math.sin(adjustedAngle)
      }
    })

    return {
      ...data,
      nodes: updatedNodes
    }
  }

  /**
   * 构建层级映射
   */
  private buildLevelMap(data: MindMapData): Map<number, MindMapNode[]> {
    const levelMap = new Map<number, MindMapNode[]>()

    data.nodes.forEach(node => {
      const level = node.level
      if (!levelMap.has(level)) {
        levelMap.set(level, [])
      }
      levelMap.get(level)!.push(node)
    })

    return levelMap
  }

  /**
   * 调整角度以靠近父节点
   */
  private adjustAngleForParent(
    node: MindMapNode,
    data: MindMapData,
    baseAngle: number
  ): number {
    if (!node.parentId) {
      return baseAngle
    }

    const parent = data.nodes.find(n => n.id === node.parentId)
    if (!parent || !parent.x || !parent.y) {
      return baseAngle
    }

    // 计算父节点的角度
    const parentAngle = Math.atan2(parent.y, parent.x)
    
    // 获取同级节点
    const siblings = data.nodes.filter(n => 
      n.parentId === node.parentId && n.id !== node.id
    )

    if (siblings.length === 0) {
      // 如果没有兄弟节点，直接使用父节点角度
      return parentAngle
    }

    // 在父节点角度附近分布
    const siblingCount = siblings.length + 1 // 包括当前节点
    const spreadAngle = Math.PI / 3 // 60度扇形
    const angleStep = spreadAngle / siblingCount
    const nodeIndex = siblings.filter(s => s.id < node.id).length

    return parentAngle - spreadAngle / 2 + (nodeIndex + 1) * angleStep
  }
}

export const radialLayout = new RadialLayout()
