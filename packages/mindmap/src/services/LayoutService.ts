/**
 * 布局服务
 * 提供思维导图布局管理和优化功能
 */

import { MindMapData, LayoutConfig, LayoutType } from '../types'
import { LayoutManager } from '../algorithms/LayoutManager'

export interface ILayoutService {
  /** 应用布局 */
  applyLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData>
  
  /** 切换布局类型 */
  switchLayout(data: MindMapData, layoutType: LayoutType): Promise<MindMapData>
  
  /** 获取可用的布局类型 */
  getAvailableLayouts(): LayoutType[]
  
  /** 获取布局配置 */
  getLayoutConfig(layoutType: LayoutType): LayoutConfig
  
  /** 优化布局 */
  optimizeLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData>
  
  /** 获取布局性能指标 */
  getPerformanceMetrics(): any[]
  
  /** 预览布局效果 */
  previewLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData>
}

/**
 * 布局服务实现
 */
export class LayoutService implements ILayoutService {
  private layoutManager: LayoutManager

  constructor() {
    this.layoutManager = new LayoutManager()
  }

  async applyLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData> {
    try {
      return await this.layoutManager.calculateLayout(data, config)
    } catch (error) {
      throw new Error(`Failed to apply layout: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async switchLayout(data: MindMapData, layoutType: LayoutType): Promise<MindMapData> {
    const config = this.getLayoutConfig(layoutType)
    return this.applyLayout(data, config)
  }

  getAvailableLayouts(): LayoutType[] {
    return ['tree', 'radial', 'force', 'circular', 'layered']
  }

  getLayoutConfig(layoutType: LayoutType): LayoutConfig {
    const defaultConfigs: Record<LayoutType, LayoutConfig> = {
      tree: {
        type: 'tree',
        direction: 'horizontal',
        nodeSpacing: 120,
        levelSpacing: 200
      },
      radial: {
        type: 'radial',
        nodeSpacing: 100,
        levelSpacing: 120,
        centerForce: 0.1
      },
      force: {
        type: 'force',
        nodeSpacing: 80,
        linkDistance: 100,
        centerForce: 0.05,
        collisionRadius: 30,
        iterations: 300
      },
      circular: {
        type: 'circular',
        nodeSpacing: 90,
        levelSpacing: 150
      },
      layered: {
        type: 'layered',
        nodeSpacing: 100,
        levelSpacing: 180,
        direction: 'vertical'
      }
    }

    return defaultConfigs[layoutType] || defaultConfigs.tree
  }

  async optimizeLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData> {
    // 根据节点数量调整配置
    const nodeCount = data.nodes.length
    const optimizedConfig = { ...config }

    if (nodeCount > 100) {
      // 大型图谱优化
      optimizedConfig.nodeSpacing = Math.max(60, (config.nodeSpacing || 100) * 0.8)
      optimizedConfig.levelSpacing = Math.max(80, (config.levelSpacing || 150) * 0.8)
    } else if (nodeCount < 20) {
      // 小型图谱优化
      optimizedConfig.nodeSpacing = Math.min(150, (config.nodeSpacing || 100) * 1.2)
      optimizedConfig.levelSpacing = Math.min(250, (config.levelSpacing || 150) * 1.2)
    }

    return this.applyLayout(data, optimizedConfig)
  }

  getPerformanceMetrics(): any {
    return this.layoutManager.getPerformanceStats()
  }

  async previewLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData> {
    // 创建数据副本进行预览
    const previewData = JSON.parse(JSON.stringify(data))
    return this.applyLayout(previewData, config)
  }
}
