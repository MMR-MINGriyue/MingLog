/**
 * Jest 测试环境设置
 * 配置全局测试环境和Mock
 */

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // 静默某些预期的警告
  console.error = jest.fn((message) => {
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render is deprecated') ||
       message.includes('Warning: componentWillReceiveProps has been renamed'))
    ) {
      return;
    }
    originalConsoleError(message);
  });
  
  console.warn = jest.fn((message) => {
    if (
      typeof message === 'string' &&
      (message.includes('componentWillReceiveProps has been renamed') ||
       message.includes('componentWillMount has been renamed'))
    ) {
      return;
    }
    originalConsoleWarn(message);
  });
});

afterEach(() => {
  // 恢复console方法
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  // 清理所有Mock
  jest.clearAllMocks();
});

// 测试工具函数
export const createMockCoreAPI = () => ({
  database: {
    execute: jest.fn(),
    query: jest.fn(),
    transaction: jest.fn()
  },
  events: {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  },
  storage: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn()
  },
  settings: {
    get: jest.fn(),
    set: jest.fn(),
    getModuleSettings: jest.fn(),
    setModuleSettings: jest.fn()
  }
});

// 创建Mock任务数据
export const createMockTask = (overrides = {}) => ({
  id: 'task_123',
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
});

// 等待异步操作完成的工具函数
export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

// 性能测试工具
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};
