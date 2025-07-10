/**
 * 笔记模块测试设置
 * 配置测试环境和全局模拟
 */

import { vi, beforeEach, afterEach } from 'vitest'

// 全局测试配置
beforeEach(() => {
  // 清除所有模拟调用历史
  vi.clearAllMocks()

  // 重置所有模拟函数
  vi.resetAllMocks()
})

afterEach(() => {
  // 恢复所有模拟
  vi.restoreAllMocks()
})

// 模拟全局对象 - 在测试文件中单独处理

// 模拟 Date.now 以确保测试的一致性
const mockDateNow = vi.fn(() => 1640995200000) // 2022-01-01 00:00:00 UTC
vi.stubGlobal('Date', {
  ...Date,
  now: mockDateNow
})

// 导出测试工具函数
export const createMockEvent = (type: string, data?: any, source?: string) => ({
  type,
  data,
  source: source || 'test',
  timestamp: Date.now()
})

export const createMockNote = (overrides: any = {}) => ({
  id: 'test-note-id',
  title: 'Test Note',
  content: 'Test content',
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isArchived: false,
  isFavorite: false,
  ...overrides
})

export const createMockConfig = (overrides: any = {}) => ({
  enabled: true,
  settings: {},
  preferences: {},
  ...overrides
})

// 测试超时配置
export const TEST_TIMEOUT = 5000

// 测试数据常量
export const TEST_CONSTANTS = {
  MODULE_ID: 'notes',
  MODULE_NAME: '笔记管理',
  MODULE_VERSION: '1.0.0',
  DEFAULT_NOTE_TITLE: 'Test Note',
  DEFAULT_NOTE_CONTENT: 'Test content'
}
