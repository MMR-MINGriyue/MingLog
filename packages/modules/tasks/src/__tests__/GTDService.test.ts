/**
 * GTDService 单元测试
 * 测试GTD工作流服务的核心功能
 */

describe('GTDService', () => {
  it('应该能够导入GTDService类', () => {
    const { GTDService } = require('../services/GTDService')
    expect(GTDService).toBeDefined()
    expect(typeof GTDService).toBe('function')
  })

  it('应该能够导入GTD相关类型', () => {
    // GTD相关类型是TypeScript类型，不是值，所以不能直接检查
    // 这个测试只是确保导入不会出错
    const types = require('../types')
    expect(types).toBeDefined()
  })
})
