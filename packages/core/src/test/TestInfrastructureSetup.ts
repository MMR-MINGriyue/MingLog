/**
 * 测试基础设施设置
 * 提供统一的测试工具和配置
 */

import { vi } from 'vitest'

/**
 * 增强的Mock工厂
 */
export class MockFactory {
  /**
   * 创建Mock数据库连接
   */
  static createMockDatabase() {
    return {
      execute: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
      transaction: vi.fn().mockImplementation(async (callback) => {
        return callback({
          execute: vi.fn().mockResolvedValue(undefined),
          query: vi.fn().mockResolvedValue([])
        })
      }),
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true)
    }
  }

  /**
   * 创建Mock事件总线
   */
  static createMockEventBus() {
    const listeners = new Map<string, Function[]>()
    
    return {
      emit: vi.fn().mockImplementation((event: string, data: any) => {
        const eventListeners = listeners.get(event) || []
        eventListeners.forEach(listener => listener(data))
      }),
      on: vi.fn().mockImplementation((event: string, listener: Function) => {
        if (!listeners.has(event)) {
          listeners.set(event, [])
        }
        listeners.get(event)!.push(listener)
      }),
      off: vi.fn().mockImplementation((event: string, listener: Function) => {
        const eventListeners = listeners.get(event) || []
        const index = eventListeners.indexOf(listener)
        if (index > -1) {
          eventListeners.splice(index, 1)
        }
      }),
      once: vi.fn().mockImplementation((event: string, listener: Function) => {
        const onceListener = (data: any) => {
          listener(data)
          this.off(event, onceListener)
        }
        this.on(event, onceListener)
      })
    }
  }

  /**
   * 创建Mock存储
   */
  static createMockStorage() {
    const storage = new Map<string, string>()
    
    return {
      get: vi.fn().mockImplementation(async (key: string) => storage.get(key) || null),
      set: vi.fn().mockImplementation(async (key: string, value: string) => {
        storage.set(key, value)
      }),
      remove: vi.fn().mockImplementation(async (key: string) => {
        storage.delete(key)
      }),
      clear: vi.fn().mockImplementation(async () => {
        storage.clear()
      }),
      keys: vi.fn().mockImplementation(async () => Array.from(storage.keys())),
      size: vi.fn().mockImplementation(async () => storage.size)
    }
  }

  /**
   * 创建Mock设置管理器
   */
  static createMockSettings() {
    const settings = new Map<string, any>()
    
    return {
      get: vi.fn().mockImplementation(async (key: string, defaultValue?: any) => {
        return settings.get(key) ?? defaultValue
      }),
      set: vi.fn().mockImplementation(async (key: string, value: any) => {
        settings.set(key, value)
      }),
      remove: vi.fn().mockImplementation(async (key: string) => {
        settings.delete(key)
      }),
      getModuleSettings: vi.fn().mockImplementation(async (moduleId: string) => {
        const moduleSettings = new Map()
        for (const [key, value] of settings) {
          if (key.startsWith(`${moduleId}.`)) {
            moduleSettings.set(key.substring(moduleId.length + 1), value)
          }
        }
        return Object.fromEntries(moduleSettings)
      }),
      setModuleSettings: vi.fn().mockImplementation(async (moduleId: string, moduleSettings: Record<string, any>) => {
        for (const [key, value] of Object.entries(moduleSettings)) {
          settings.set(`${moduleId}.${key}`, value)
        }
      })
    }
  }

  /**
   * 创建D3.js Mock对象
   * 用于图谱组件测试，避免DOM操作复杂性
   */
  static createMockD3() {
    const mockSelection = {
      selectAll: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      append: vi.fn().mockReturnThis(),
      attr: vi.fn().mockReturnThis(),
      style: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      data: vi.fn().mockReturnThis(),
      enter: vi.fn().mockReturnThis(),
      exit: vi.fn().mockReturnThis(),
      remove: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      call: vi.fn().mockReturnThis(),
      merge: vi.fn().mockReturnThis(),
      join: vi.fn().mockReturnThis(),
      node: vi.fn().mockReturnValue(document.createElement('div')),
      nodes: vi.fn().mockReturnValue([])
    }

    const mockSimulation = {
      nodes: vi.fn().mockReturnThis(),
      force: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      stop: vi.fn().mockReturnThis(),
      restart: vi.fn().mockReturnThis(),
      tick: vi.fn().mockReturnThis(),
      alpha: vi.fn().mockReturnThis(),
      alphaTarget: vi.fn().mockReturnThis()
    }

    const mockForce = {
      id: vi.fn().mockReturnThis(),
      distance: vi.fn().mockReturnThis(),
      strength: vi.fn().mockReturnThis(),
      radius: vi.fn().mockReturnThis()
    }

    const mockZoom = {
      scaleExtent: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      transform: vi.fn().mockReturnThis(),
      translateBy: vi.fn().mockReturnThis(),
      scaleTo: vi.fn().mockReturnThis()
    }

    const mockDrag = {
      on: vi.fn().mockReturnThis(),
      subject: vi.fn().mockReturnThis(),
      container: vi.fn().mockReturnThis()
    }

    return {
      select: vi.fn().mockReturnValue(mockSelection),
      selectAll: vi.fn().mockReturnValue(mockSelection),
      forceSimulation: vi.fn().mockReturnValue(mockSimulation),
      forceLink: vi.fn().mockReturnValue(mockForce),
      forceManyBody: vi.fn().mockReturnValue(mockForce),
      forceCenter: vi.fn().mockReturnValue(mockForce),
      forceCollide: vi.fn().mockReturnValue(mockForce),
      zoom: vi.fn().mockReturnValue(mockZoom),
      drag: vi.fn().mockReturnValue(mockDrag),
      hierarchy: vi.fn().mockReturnValue({
        descendants: vi.fn().mockReturnValue([]),
        links: vi.fn().mockReturnValue([])
      }),
      tree: vi.fn().mockReturnValue(vi.fn()),
      scaleOrdinal: vi.fn().mockReturnValue(vi.fn()),
      schemeCategory10: ['#1f77b4', '#ff7f0e', '#2ca02c'],
      event: { transform: { x: 0, y: 0, k: 1 } }
    }
  }

  /**
   * 创建图谱测试数据
   */
  static createMockGraphData() {
    return {
      nodes: [
        { id: 'node1', type: 'page', title: '测试页面1', x: 100, y: 100 },
        { id: 'node2', type: 'page', title: '测试页面2', x: 200, y: 200 },
        { id: 'node3', type: 'block', title: '测试块1', x: 150, y: 150 }
      ],
      edges: [
        { id: 'edge1', source: 'node1', target: 'node2', type: 'page-reference' },
        { id: 'edge2', source: 'node2', target: 'node3', type: 'block-reference' }
      ]
    }
  }

  /**
   * 创建大型图谱测试数据（用于性能测试）
   */
  static createLargeGraphData(nodeCount: number = 1000) {
    const nodes = []
    const edges = []

    // 生成节点
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: `node${i}`,
        type: i % 3 === 0 ? 'page' : i % 3 === 1 ? 'block' : 'tag',
        title: `测试节点${i}`,
        x: Math.random() * 800,
        y: Math.random() * 600
      })
    }

    // 生成边（每个节点平均连接2-3个其他节点）
    for (let i = 0; i < nodeCount; i++) {
      const connectionCount = Math.floor(Math.random() * 3) + 1
      for (let j = 0; j < connectionCount; j++) {
        const targetIndex = Math.floor(Math.random() * nodeCount)
        if (targetIndex !== i) {
          edges.push({
            id: `edge${i}-${targetIndex}`,
            source: `node${i}`,
            target: `node${targetIndex}`,
            type: 'reference'
          })
        }
      }
    }

    return { nodes, edges }
  }

  /**
   * 创建完整的Mock核心API
   */
  static createMockCoreAPI() {
    return {
      database: this.createMockDatabase(),
      events: this.createMockEventBus(),
      storage: this.createMockStorage(),
      settings: this.createMockSettings(),
      notifications: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn()
      },
      router: {
        navigate: vi.fn(),
        getCurrentPath: vi.fn().mockReturnValue('/'),
        addRoutes: vi.fn(),
        removeRoutes: vi.fn()
      }
    }
  }
}

/**
 * 测试数据生成器
 */
export class TestDataGenerator {
  /**
   * 生成测试任务
   */
  static createTask(overrides: Partial<any> = {}) {
    return {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: '测试任务',
      description: '这是一个测试任务',
      status: 'todo',
      priority: 'medium',
      tags: [],
      contexts: [],
      linkedNotes: [],
      linkedFiles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    }
  }

  /**
   * 生成测试笔记
   */
  static createNote(overrides: Partial<any> = {}) {
    return {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: '测试笔记',
      content: '这是一个测试笔记的内容',
      tags: [],
      isFavorite: false,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    }
  }

  /**
   * 生成测试链接
   */
  static createLink(overrides: Partial<any> = {}) {
    return {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceModule: 'notes',
      sourceId: 'note_123',
      targetModule: 'tasks',
      targetId: 'task_456',
      linkType: 'reference',
      metadata: {},
      createdAt: new Date(),
      ...overrides
    }
  }

  /**
   * 生成测试图谱数据
   */
  static createGraphData(nodeCount: number = 10, edgeCount: number = 15) {
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: `node_${i}`,
      label: `节点 ${i}`,
      type: i % 2 === 0 ? 'note' : 'task',
      size: Math.random() * 20 + 10,
      color: i % 2 === 0 ? '#3b82f6' : '#10b981'
    }))

    const edges = Array.from({ length: edgeCount }, (_, i) => {
      const sourceIndex = Math.floor(Math.random() * nodeCount)
      let targetIndex = Math.floor(Math.random() * nodeCount)
      while (targetIndex === sourceIndex) {
        targetIndex = Math.floor(Math.random() * nodeCount)
      }
      
      return {
        id: `edge_${i}`,
        source: `node_${sourceIndex}`,
        target: `node_${targetIndex}`,
        weight: Math.random(),
        type: 'reference'
      }
    })

    return { nodes, edges }
  }

  /**
   * 生成批量操作项目
   */
  static createBatchItems(count: number = 5, entityType: string = 'note') {
    return Array.from({ length: count }, (_, i) => ({
      id: `item_${i}`,
      entityType,
      entityId: `${entityType}_${i}`,
      title: `测试${entityType} ${i}`,
      content: `这是测试${entityType} ${i}的内容`,
      selected: true,
      metadata: {
        tags: [`标签${i}`],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }))
  }
}

/**
 * 测试工具类
 */
export class TestUtils {
  /**
   * 等待异步操作完成
   */
  static async waitFor(ms: number = 0): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 等待条件满足
   */
  static async waitForCondition(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return
      }
      await this.waitFor(interval)
    }
    
    throw new Error(`条件在 ${timeout}ms 内未满足`)
  }

  /**
   * 性能测试工具
   */
  static async measurePerformance<T>(
    fn: () => Promise<T> | T,
    iterations: number = 1
  ): Promise<{ result: T, averageTime: number, totalTime: number }> {
    const times: number[] = []
    let result: T
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      result = await fn()
      const end = performance.now()
      times.push(end - start)
    }
    
    const totalTime = times.reduce((sum, time) => sum + time, 0)
    const averageTime = totalTime / iterations
    
    return {
      result: result!,
      averageTime,
      totalTime
    }
  }

  /**
   * 内存使用监控
   */
  static getMemoryUsage(): { used: number, total: number } {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize
      }
    }
    return { used: 0, total: 0 }
  }

  /**
   * 深度克隆对象
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T
    }
    
    if (typeof obj === 'object') {
      const cloned = {} as T
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key])
        }
      }
      return cloned
    }
    
    return obj
  }

  /**
   * 生成随机字符串
   */
  static randomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * 生成随机数字
   */
  static randomNumber(min: number = 0, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * 生成随机布尔值
   */
  static randomBoolean(): boolean {
    return Math.random() < 0.5
  }
}

/**
 * 测试断言增强
 */
export class TestAssertions {
  /**
   * 断言对象包含指定属性
   */
  static hasProperties(obj: any, properties: string[]): boolean {
    return properties.every(prop => obj.hasOwnProperty(prop))
  }

  /**
   * 断言数组包含指定元素
   */
  static arrayContains<T>(array: T[], element: T): boolean {
    return array.includes(element)
  }

  /**
   * 断言数组长度在指定范围内
   */
  static arrayLengthBetween(array: any[], min: number, max: number): boolean {
    return array.length >= min && array.length <= max
  }

  /**
   * 断言函数执行时间在指定范围内
   */
  static async executionTimeWithin(
    fn: () => Promise<any> | any,
    maxTime: number
  ): Promise<boolean> {
    const start = performance.now()
    await fn()
    const end = performance.now()
    return (end - start) <= maxTime
  }

  /**
   * 断言对象深度相等
   */
  static deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true
    
    if (obj1 == null || obj2 == null) return false
    
    if (typeof obj1 !== typeof obj2) return false
    
    if (typeof obj1 !== 'object') return obj1 === obj2
    
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    
    if (keys1.length !== keys2.length) return false
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false
      if (!this.deepEqual(obj1[key], obj2[key])) return false
    }
    
    return true
  }
}

// 所有工具已在上面单独导出，无需重复导出
