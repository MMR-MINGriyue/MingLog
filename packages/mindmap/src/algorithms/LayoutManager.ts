/**
 * 布局管理器
 * 统一管理所有思维导图布局算法，提供布局切换和优化功能
 */

import { MindMapData, MindMapNode, LayoutAlgorithm, LayoutConfig, LayoutType } from '../types'
import { TreeLayout } from './TreeLayout'
import { RadialLayout } from './RadialLayout'
import { ForceLayout } from './ForceLayout'

interface LayoutPerformanceMetrics {
  /** 布局计算时间（毫秒） */
  calculationTime: number
  /** 节点数量 */
  nodeCount: number
  /** 连接数量 */
  linkCount: number
  /** 布局类型 */
  layoutType: LayoutType
  /** 时间戳 */
  timestamp: Date
}

interface LayoutTransition {
  /** 源布局类型 */
  from: LayoutType
  /** 目标布局类型 */
  to: LayoutType
  /** 过渡动画时长（毫秒） */
  duration: number
  /** 缓动函数 */
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

/**
 * 布局管理器类
 * 提供统一的布局算法管理和性能优化
 */
export class LayoutManager {
  private algorithms: Map<LayoutType, LayoutAlgorithm>
  private performanceMetrics: LayoutPerformanceMetrics[] = []
  private currentLayout: LayoutType = 'tree'
  private layoutCache: Map<string, MindMapData> = new Map()

  constructor() {
    // 注册所有布局算法
    this.algorithms = new Map([
      ['tree', new TreeLayout() as LayoutAlgorithm],
      ['radial', new RadialLayout() as LayoutAlgorithm],
      ['force', new ForceLayout() as LayoutAlgorithm]
    ])
  }

  /**
   * 计算布局
   * 支持缓存和性能监控
   */
  async calculateLayout(
    data: MindMapData, 
    config: LayoutConfig,
    useCache: boolean = true
  ): Promise<MindMapData> {
    const startTime = performance.now()
    
    // 生成缓存键
    const cacheKey = this.generateCacheKey(data, config)
    
    // 检查缓存
    if (useCache && this.layoutCache.has(cacheKey)) {
      const cachedResult = this.layoutCache.get(cacheKey)!
      console.log(`使用缓存的布局结果: ${config.type}`)
      return cachedResult
    }

    // 获取布局算法
    const algorithm = this.algorithms.get(config.type)
    if (!algorithm) {
      throw new Error(`不支持的布局类型: ${config.type}`)
    }

    try {
      // 执行布局计算
      let result: MindMapData
      
      if (algorithm.name === 'force') {
        // 力导向布局返回Promise
        result = await (algorithm as ForceLayout).calculate(data, config)
      } else {
        // 其他布局算法同步执行
        const calculationResult = algorithm.calculate(data, config)
        result = calculationResult instanceof Promise ? await calculationResult : calculationResult
      }

      const endTime = performance.now()
      const calculationTime = endTime - startTime

      // 记录性能指标
      this.recordPerformanceMetrics({
        calculationTime,
        nodeCount: data.nodes.length,
        linkCount: data.links.length,
        layoutType: config.type,
        timestamp: new Date()
      })

      // 性能警告
      if (calculationTime > 100) {
        console.warn(`布局计算时间过长: ${calculationTime.toFixed(2)}ms (${config.type})`)
      }

      // 缓存结果
      if (useCache) {
        this.layoutCache.set(cacheKey, result)
        
        // 限制缓存大小
        if (this.layoutCache.size > 20) {
          const firstKey = this.layoutCache.keys().next().value
          if (firstKey) {
            this.layoutCache.delete(firstKey)
          }
        }
      }

      this.currentLayout = config.type
      return result

    } catch (error) {
      console.error(`布局计算失败 (${config.type}):`, error)
      throw error
    }
  }

  /**
   * 获取支持的布局类型
   */
  getSupportedLayouts(): LayoutType[] {
    return Array.from(this.algorithms.keys())
  }

  /**
   * 获取布局算法信息
   */
  getLayoutInfo(layoutType: LayoutType): { name: string; description: string; features: string[] } {
    const descriptions: Record<LayoutType, { name: string; description: string; features: string[] }> = {
      tree: {
        name: '树形布局',
        description: '经典的层次化树形结构，适合展示清晰的父子关系',
        features: ['层次清晰', '结构稳定', '适合大型思维导图', '性能优秀']
      },
      radial: {
        name: '径向布局',
        description: '以根节点为中心的放射状布局，适合展示中心主题的发散思维',
        features: ['视觉聚焦', '空间利用率高', '适合展示关联关系', '美观度高']
      },
      force: {
        name: '力导向布局',
        description: '基于物理仿真的自然布局，节点自动寻找平衡位置',
        features: ['自然分布', '动态平衡', '交互性强', '适合复杂关系']
      },
      circular: {
        name: '环形布局',
        description: '节点沿圆形排列的布局方式',
        features: ['对称美观', '空间紧凑', '适合展示循环关系']
      },
      layered: {
        name: '分层布局',
        description: '按层次分组的布局方式',
        features: ['层次分明', '结构清晰', '适合复杂数据']
      }
    }

    return descriptions[layoutType] || {
      name: '未知布局',
      description: '未知的布局类型',
      features: []
    }
  }

  /**
   * 获取推荐的布局类型
   * 基于数据特征自动推荐最适合的布局
   */
  getRecommendedLayout(data: MindMapData): LayoutType {
    const nodeCount = data.nodes.length
    const maxDepth = this.calculateMaxDepth(data)
    const avgBranching = this.calculateAverageBranching(data)

    // 基于数据特征推荐布局
    if (nodeCount <= 20 && maxDepth <= 3) {
      return 'radial' // 小型思维导图适合径向布局
    } else if (nodeCount > 50 || maxDepth > 5) {
      return 'tree' // 大型思维导图适合树形布局
    } else if (avgBranching > 5) {
      return 'force' // 高分支度适合力导向布局
    } else {
      return 'tree' // 默认使用树形布局
    }
  }

  /**
   * 创建布局过渡动画
   */
  createLayoutTransition(
    fromData: MindMapData,
    toData: MindMapData,
    transition: LayoutTransition
  ): { keyframes: MindMapData[]; duration: number } {
    const steps = Math.max(10, Math.min(30, transition.duration / 16)) // 60fps
    const keyframes: MindMapData[] = []

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps
      const easedProgress = this.applyEasing(progress, transition.easing)
      
      const interpolatedNodes = fromData.nodes.map(fromNode => {
        const toNode = toData.nodes.find(n => n.id === fromNode.id)
        if (!toNode) return fromNode

        return {
          ...fromNode,
          x: this.interpolate(fromNode.x || 0, toNode.x || 0, easedProgress),
          y: this.interpolate(fromNode.y || 0, toNode.y || 0, easedProgress)
        }
      })

      keyframes.push({
        ...fromData,
        nodes: interpolatedNodes
      })
    }

    return { keyframes, duration: transition.duration }
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): {
    averageTime: number
    maxTime: number
    minTime: number
    totalCalculations: number
    byLayoutType: Record<LayoutType, { count: number; avgTime: number }>
  } {
    if (this.performanceMetrics.length === 0) {
      return {
        averageTime: 0,
        maxTime: 0,
        minTime: 0,
        totalCalculations: 0,
        byLayoutType: {} as any
      }
    }

    const times = this.performanceMetrics.map(m => m.calculationTime)
    const byLayoutType: Record<string, { count: number; avgTime: number }> = {}

    // 按布局类型统计
    this.performanceMetrics.forEach(metric => {
      if (!byLayoutType[metric.layoutType]) {
        byLayoutType[metric.layoutType] = { count: 0, avgTime: 0 }
      }
      byLayoutType[metric.layoutType].count++
    })

    Object.keys(byLayoutType).forEach(layoutType => {
      const metrics = this.performanceMetrics.filter(m => m.layoutType === layoutType)
      const avgTime = metrics.reduce((sum, m) => sum + m.calculationTime, 0) / metrics.length
      byLayoutType[layoutType].avgTime = avgTime
    })

    return {
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      maxTime: Math.max(...times),
      minTime: Math.min(...times),
      totalCalculations: this.performanceMetrics.length,
      byLayoutType: byLayoutType as any
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.layoutCache.clear()
    console.log('布局缓存已清除')
  }

  /**
   * 清除性能指标
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics = []
    console.log('性能指标已清除')
  }

  // 私有方法

  private generateCacheKey(data: MindMapData, config: LayoutConfig): string {
    const dataHash = this.hashData(data)
    const configHash = this.hashConfig(config)
    return `${dataHash}-${configHash}`
  }

  private hashData(data: MindMapData): string {
    const nodeIds = data.nodes.map(n => n.id).sort().join(',')
    const linkIds = data.links.map(l => `${l.source}-${l.target}`).sort().join(',')
    return `nodes:${nodeIds}|links:${linkIds}`
  }

  private hashConfig(config: LayoutConfig): string {
    return JSON.stringify(config)
  }

  private recordPerformanceMetrics(metrics: LayoutPerformanceMetrics): void {
    this.performanceMetrics.push(metrics)
    
    // 限制指标数量
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics.shift()
    }
  }

  private calculateMaxDepth(data: MindMapData): number {
    return Math.max(...data.nodes.map(node => node.level))
  }

  private calculateAverageBranching(data: MindMapData): number {
    const parentCounts = new Map<string, number>()
    
    data.nodes.forEach(node => {
      if (node.parentId) {
        parentCounts.set(node.parentId, (parentCounts.get(node.parentId) || 0) + 1)
      }
    })

    const branchingFactors = Array.from(parentCounts.values())
    return branchingFactors.length > 0 
      ? branchingFactors.reduce((sum, count) => sum + count, 0) / branchingFactors.length
      : 0
  }

  private applyEasing(progress: number, easing: LayoutTransition['easing']): number {
    switch (easing) {
      case 'ease-in':
        return progress * progress
      case 'ease-out':
        return 1 - (1 - progress) * (1 - progress)
      case 'ease-in-out':
        return progress < 0.5 
          ? 2 * progress * progress 
          : 1 - 2 * (1 - progress) * (1 - progress)
      default:
        return progress
    }
  }

  private interpolate(from: number, to: number, progress: number): number {
    return from + (to - from) * progress
  }
}

export const layoutManager = new LayoutManager()
