/**
 * MindMap 模块基础测试
 * 测试思维导图模块的核心功能
 */

import { describe, it, expect } from 'vitest'

describe('MindMap模块', () => {
  it('应该能够导入MindMapView组件', () => {
    const { MindMapView } = require('../components/MindMapView')
    expect(MindMapView).toBeDefined()
    expect(typeof MindMapView).toBe('function')
  })

  it('应该能够导入MindMap相关类型', () => {
    const types = require('../types')
    expect(types).toBeDefined()
  })

  it('应该能够导入MindMapService', () => {
    const { MindMapService } = require('../services/MindMapService')
    expect(MindMapService).toBeDefined()
    expect(typeof MindMapService).toBe('function')
  })

  it('应该能够导入MindMapModule', () => {
    const { MindMapModule } = require('../MindMapModule')
    expect(MindMapModule).toBeDefined()
    expect(typeof MindMapModule).toBe('function')
  })
})
