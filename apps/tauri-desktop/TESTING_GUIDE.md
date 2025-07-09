# MingLog PerformanceMonitor 测试指南

## 🎯 测试概述

本指南提供了对MingLog桌面应用中PerformanceMonitor组件进行全面测试的详细说明。测试覆盖UI完整性、功能健壮性、集成测试和用户体验验证。

---

## 📋 测试类型

### **1. 单元测试 (Unit Tests)**
- **工具**: Jest + React Testing Library
- **覆盖范围**: 组件渲染、状态管理、用户交互
- **文件位置**: `src/components/__tests__/`

### **2. 集成测试 (Integration Tests)**
- **工具**: Jest + React Testing Library
- **覆盖范围**: Hook集成、API调用、状态同步
- **文件位置**: `src/hooks/__tests__/`

### **3. 端到端测试 (E2E Tests)**
- **工具**: Playwright
- **覆盖范围**: 完整用户流程、跨浏览器兼容性
- **文件位置**: `e2e/`

### **4. 可访问性测试 (Accessibility Tests)**
- **工具**: Jest + axe-core
- **覆盖范围**: ARIA标签、键盘导航、屏幕阅读器
- **文件位置**: `src/components/__tests__/accessibility/`

### **5. 性能测试 (Performance Tests)**
- **工具**: Jest + Performance API
- **覆盖范围**: 渲染性能、内存使用、响应时间
- **文件位置**: `src/components/__tests__/performance/`

---

## 🚀 快速开始

### **运行所有测试**
```bash
# 运行全面测试套件
npm run test:comprehensive

# 仅运行PerformanceMonitor相关测试
npm run test:performance-monitor

# 观察模式运行测试
npm run test:performance-monitor:watch
```

### **运行特定测试类型**
```bash
# 单元测试
npm test

# E2E测试
npm run test:e2e

# 可访问性测试
npm run test:accessibility

# 性能测试
npm run test:performance
```

---

## 📊 测试用例详解

### **UI完整性测试**

#### **PM-UI-001: 核心UI元素渲染**
```typescript
// 验证所有必需的UI元素正确渲染
expect(screen.getByText('Performance Monitor')).toBeInTheDocument()
expect(screen.getByText('内存使用')).toBeInTheDocument()
expect(screen.getByText('渲染时间')).toBeInTheDocument()
```

#### **PM-UI-002: 指标卡片内容验证**
```typescript
// 验证指标格式正确
expect(screen.getByText('512.0 MB')).toBeInTheDocument() // 内存格式
expect(screen.getByText('16.7ms')).toBeInTheDocument()   // 时间格式
```

#### **PM-UI-003: 图表组件渲染**
```typescript
// 验证Chart.js集成
const chart = screen.getByTestId('performance-chart')
expect(chart).toBeInTheDocument()
```

### **功能完整性测试**

#### **PM-FUNC-001: 启动监控功能**
```typescript
// 测试监控启动
const startButton = screen.getByLabelText(/Start performance monitoring/)
await userEvent.click(startButton)
expect(startMonitoring).toHaveBeenCalled()
```

#### **PM-FUNC-002: 停止监控功能**
```typescript
// 测试监控停止
const stopButton = screen.getByLabelText(/Stop performance monitoring/)
await userEvent.click(stopButton)
expect(stopMonitoring).toHaveBeenCalled()
```

### **集成测试**

#### **PM-INT-001: Hook集成**
```typescript
// 验证Hook调用参数
expect(mockUseOptimizedPerformanceMonitor).toHaveBeenCalledWith({
  updateInterval: 2000,
  maxHistoryEntries: 20,
  enableAutoOptimization: true,
  enableErrorTracking: true
})
```

### **可访问性测试**

#### **PM-A11Y-001: ARIA标签验证**
```typescript
// 验证可访问性属性
const dialog = screen.getByRole('dialog')
expect(dialog).toHaveAttribute('aria-modal', 'true')
expect(dialog).toHaveAttribute('aria-labelledby')
```

#### **PM-A11Y-002: 键盘导航**
```typescript
// 测试Escape键关闭
fireEvent.keyDown(document, { key: 'Escape' })
expect(onClose).toHaveBeenCalled()
```

---

## 🔧 测试配置

### **Jest配置**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/components/PerformanceMonitor.tsx',
    'src/hooks/useOptimizedPerformanceMonitor.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
}
```

### **Playwright配置**
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:1420',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run tauri:dev',
    url: 'http://localhost:1420',
    timeout: 120000
  }
})
```

---

## 📈 测试覆盖率目标

### **代码覆盖率**
- **行覆盖率**: ≥90%
- **分支覆盖率**: ≥90%
- **函数覆盖率**: ≥90%
- **语句覆盖率**: ≥90%

### **功能覆盖率**
- **UI元素**: 100%
- **用户交互**: 100%
- **错误场景**: 100%
- **边界条件**: 100%

### **可访问性覆盖率**
- **WCAG 2.1 AA**: 100%合规
- **键盘导航**: 100%支持
- **屏幕阅读器**: 100%兼容

---

## 🚨 常见问题解决

### **测试失败排查**

#### **1. 组件渲染失败**
```bash
# 检查Mock配置
# 确保所有依赖都已正确Mock
# 验证测试数据格式
```

#### **2. E2E测试超时**
```bash
# 增加超时时间
# 检查Tauri应用启动状态
# 验证端口配置
```

#### **3. 可访问性测试失败**
```bash
# 检查ARIA标签
# 验证键盘导航顺序
# 确认颜色对比度
```

### **性能测试优化**

#### **1. 渲染性能**
```typescript
// 测试组件渲染时间
const startTime = performance.now()
render(<PerformanceMonitor {...props} />)
const renderTime = performance.now() - startTime
expect(renderTime).toBeLessThan(100) // 100ms内完成渲染
```

#### **2. 内存使用**
```typescript
// 测试内存泄漏
const { unmount } = render(<PerformanceMonitor {...props} />)
unmount()
// 验证清理是否完成
```

---

## 📊 测试报告

### **生成测试报告**
```bash
# 生成HTML报告
npm run test:comprehensive

# 查看覆盖率报告
open coverage/lcov-report/index.html

# 查看E2E测试报告
npx playwright show-report
```

### **CI/CD集成**
```yaml
# .github/workflows/test.yml
name: Test PerformanceMonitor
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:comprehensive
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

---

## 🎯 最佳实践

### **编写测试**
1. **描述性测试名称**: 使用清晰的测试用例ID和描述
2. **独立测试**: 每个测试应该独立运行
3. **数据驱动**: 使用测试数据而不是硬编码值
4. **边界测试**: 测试边界条件和错误场景

### **维护测试**
1. **定期更新**: 随功能变更更新测试
2. **重构测试**: 保持测试代码质量
3. **监控覆盖率**: 确保覆盖率不下降
4. **性能监控**: 监控测试执行时间

### **调试测试**
1. **使用调试工具**: 利用Jest和Playwright的调试功能
2. **截图和视频**: 保存失败时的状态
3. **日志记录**: 添加详细的日志信息
4. **逐步调试**: 使用断点和步进调试

---

## 📞 支持和帮助

### **文档资源**
- [Jest官方文档](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright文档](https://playwright.dev/docs/intro)

### **团队支持**
- 技术问题: 联系开发团队
- 测试策略: 联系QA团队
- CI/CD问题: 联系DevOps团队

**测试是确保PerformanceMonitor组件质量的关键环节，请严格按照本指南执行测试！** 🚀
