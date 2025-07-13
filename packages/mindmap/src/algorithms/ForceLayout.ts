/**
 * 力导向布局算法
 * 使用D3.js的力导向仿真实现自然的节点分布
 */

import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY, Simulation } from 'd3-force'
import { MindMapData, MindMapNode, MindMapLink, LayoutAlgorithm, LayoutConfig } from '../types'

interface ForceNode extends MindMapNode {
  /** D3力导向仿真的x坐标 */
  x?: number
  /** D3力导向仿真的y坐标 */
  y?: number
  /** D3力导向仿真的x速度 */
  vx?: number
  /** D3力导向仿真的y速度 */
  vy?: number
  /** 固定x坐标 */
  fx?: number | null
  /** 固定y坐标 */
  fy?: number | null
}

interface ForceLink {
  id: string
  /** 源节点引用 */
  source: ForceNode | string
  /** 目标节点引用 */
  target: ForceNode | string
  type: 'parent-child' | 'association' | 'reference' | 'custom'
}

/**
 * 力导向布局算法实现
 * 提供自然的节点分布和动态平衡
 */
export class ForceLayout implements LayoutAlgorithm {
  name = 'force'

  /**
   * 计算力导向布局
   */
  calculate(data: MindMapData, config: LayoutConfig): Promise<MindMapData> {
    return new Promise((resolve) => {
      const {
        nodeSpacing = 80,
        levelSpacing = 120,
        centerForce = 0.1,
        linkDistance = 100,
        collisionRadius = 30,
        iterations = 300
      } = config

      // 准备节点数据
      const nodes: ForceNode[] = data.nodes.map(node => ({
        ...node,
        x: node.x || Math.random() * 800,
        y: node.y || Math.random() * 600
      }))

      // 准备连接数据
      const links: ForceLink[] = data.links.map(link => ({
        ...link,
        source: link.source,
        target: link.target
      }))

      // 创建力导向仿真
      const simulation = forceSimulation(nodes)
        .force('link', forceLink(links)
          .id((d: any) => d.id)
          .distance(linkDistance)
          .strength(0.8)
        )
        .force('charge', forceManyBody()
          .strength(-300)
          .distanceMax(200)
        )
        .force('center', forceCenter(400, 300)
          .strength(centerForce)
        )
        .force('collision', forceCollide()
          .radius(collisionRadius)
          .strength(0.9)
        )
        .force('x', forceX(400).strength(0.1))
        .force('y', forceY(300).strength(0.1))

      // 根据层级调整节点位置
      this.applyHierarchicalConstraints(nodes, data, simulation)

      // 设置仿真参数
      simulation
        .alpha(1)
        .alphaDecay(0.02)
        .velocityDecay(0.4)

      let tickCount = 0
      const maxTicks = iterations

      // 监听仿真tick事件
      simulation.on('tick', () => {
        tickCount++
        
        // 应用层级约束
        this.enforceHierarchicalConstraints(nodes, data)
        
        // 检查是否达到稳定状态或最大迭代次数
        if (tickCount >= maxTicks || simulation.alpha() < 0.01) {
          simulation.stop()
          
          // 返回更新后的数据
          const updatedNodes = nodes.map(node => ({
            ...node,
            x: Math.round(node.x || 0),
            y: Math.round(node.y || 0)
          }))

          resolve({
            ...data,
            nodes: updatedNodes
          })
        }
      })

      // 启动仿真
      simulation.restart()
    })
  }

  /**
   * 应用层级约束
   * 确保父子节点保持合理的相对位置
   */
  private applyHierarchicalConstraints(
    nodes: ForceNode[], 
    data: MindMapData, 
    simulation: Simulation<ForceNode, ForceLink>
  ): void {
    // 固定根节点位置
    const rootNode = nodes.find(node => node.id === data.rootId)
    if (rootNode) {
      rootNode.fx = 400
      rootNode.fy = 300
    }

    // 添加层级力
    simulation.force('hierarchy', () => {
      nodes.forEach(node => {
        if (node.parentId) {
          const parent = nodes.find(n => n.id === node.parentId)
          if (parent && parent.x !== undefined && parent.y !== undefined) {
            // 计算理想距离
            const idealDistance = 120 + node.level * 20
            const dx = (node.x || 0) - parent.x
            const dy = (node.y || 0) - parent.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance > 0) {
              // 调整节点位置以保持理想距离
              const force = (distance - idealDistance) * 0.1
              const fx = (dx / distance) * force
              const fy = (dy / distance) * force
              
              if (node.vx !== undefined && node.vy !== undefined) {
                node.vx -= fx
                node.vy -= fy
              }
              if (parent.vx !== undefined && parent.vy !== undefined) {
                parent.vx += fx * 0.5
                parent.vy += fy * 0.5
              }
            }
          }
        }
      })
    })

    // 添加同级分离力
    simulation.force('sibling-separation', () => {
      const nodesByParent = new Map<string, ForceNode[]>()
      
      nodes.forEach(node => {
        const parentId = node.parentId || 'root'
        if (!nodesByParent.has(parentId)) {
          nodesByParent.set(parentId, [])
        }
        nodesByParent.get(parentId)!.push(node)
      })

      nodesByParent.forEach(siblings => {
        if (siblings.length > 1) {
          for (let i = 0; i < siblings.length; i++) {
            for (let j = i + 1; j < siblings.length; j++) {
              const nodeA = siblings[i]
              const nodeB = siblings[j]
              
              if (nodeA.x !== undefined && nodeA.y !== undefined &&
                  nodeB.x !== undefined && nodeB.y !== undefined) {
                const dx = nodeA.x - nodeB.x
                const dy = nodeA.y - nodeB.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                const minDistance = 80
                
                if (distance < minDistance && distance > 0) {
                  const force = (minDistance - distance) * 0.1
                  const fx = (dx / distance) * force
                  const fy = (dy / distance) * force
                  
                  if (nodeA.vx !== undefined && nodeA.vy !== undefined) {
                    nodeA.vx += fx
                    nodeA.vy += fy
                  }
                  if (nodeB.vx !== undefined && nodeB.vy !== undefined) {
                    nodeB.vx -= fx
                    nodeB.vy -= fy
                  }
                }
              }
            }
          }
        }
      })
    })
  }

  /**
   * 强制执行层级约束
   * 在每个tick中调用，确保层级结构不被破坏
   */
  private enforceHierarchicalConstraints(nodes: ForceNode[], data: MindMapData): void {
    // 确保根节点保持在中心
    const rootNode = nodes.find(node => node.id === data.rootId)
    if (rootNode) {
      rootNode.x = 400
      rootNode.y = 300
    }

    // 限制节点的移动范围
    nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        // 限制在画布范围内
        node.x = Math.max(50, Math.min(750, node.x))
        node.y = Math.max(50, Math.min(550, node.y))
        
        // 根据层级限制移动范围
        if (node.level > 0) {
          const maxRadius = 100 + node.level * 80
          const dx = node.x - 400
          const dy = node.y - 300
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance > maxRadius) {
            const scale = maxRadius / distance
            node.x = 400 + dx * scale
            node.y = 300 + dy * scale
          }
        }
      }
    })
  }

  /**
   * 计算节点的理想位置
   * 基于层级和兄弟节点关系
   */
  private calculateIdealPosition(
    node: ForceNode, 
    nodes: ForceNode[], 
    data: MindMapData
  ): { x: number; y: number } {
    if (node.id === data.rootId) {
      return { x: 400, y: 300 }
    }

    const parent = nodes.find(n => n.id === node.parentId)
    if (!parent || parent.x === undefined || parent.y === undefined) {
      return { x: node.x || 400, y: node.y || 300 }
    }

    // 获取兄弟节点
    const siblings = nodes.filter(n => n.parentId === node.parentId && n.id !== node.id)
    const totalSiblings = siblings.length + 1
    const nodeIndex = siblings.filter(s => s.id < node.id).length

    // 计算角度分布
    const baseAngle = Math.atan2(parent.y - 300, parent.x - 400)
    const spreadAngle = Math.PI / 2 // 90度扇形
    const angleStep = spreadAngle / Math.max(totalSiblings, 1)
    const nodeAngle = baseAngle - spreadAngle / 2 + (nodeIndex + 0.5) * angleStep

    // 计算距离
    const distance = 120 + node.level * 20

    return {
      x: parent.x + distance * Math.cos(nodeAngle),
      y: parent.y + distance * Math.sin(nodeAngle)
    }
  }
}

export const forceLayout = new ForceLayout()
