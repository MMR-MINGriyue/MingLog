# MingLog 核心功能验证指南

## 概述

本指南详细说明如何执行 MingLog 核心功能验证测试，确保所有核心模块能够正常协同工作。

## 测试架构

### 测试层次结构

```
核心功能验证测试
├── 核心系统集成测试
│   ├── 系统初始化验证
│   ├── 模块注册和管理
│   ├── 核心API功能
│   ├── 设置管理
│   └── 错误处理和恢复
├── 双向链接系统集成测试
│   ├── 完整链接创建和管理流程
│   ├── 缓存系统集成
│   ├── 一致性检查集成
│   └── 搜索引擎集成
├── 编辑器集成测试
│   ├── 基本编辑功能
│   ├── 链接创建功能
│   ├── 自动补全功能
│   ├── 链接编辑功能
│   ├── 实时链接解析
│   └── 性能优化
├── 搜索功能集成测试
│   ├── 基础搜索功能集成
│   ├── 搜索与链接系统集成
│   ├── 搜索性能和缓存集成
│   ├── 搜索建议和自动补全
│   └── 搜索错误处理和恢复
├── 数据持久化集成测试
│   ├── 数据库基础操作
│   ├── 缓存系统集成
│   ├── 链接数据持久化
│   ├── 搜索索引持久化
│   └── 数据一致性和完整性
└── 桌面环境集成测试
    ├── 桌面应用初始化
    ├── 文件系统集成
    ├── 窗口管理集成
    ├── 系统通知集成
    ├── 剪贴板集成
    ├── 完整工作流程测试
    └── 性能监控
```

## 快速开始

### 1. 环境准备

确保已安装所有依赖：

```bash
cd packages/core
npm install
```

### 2. 运行完整验证测试

```bash
# 运行完整的核心功能验证测试套件
npm run test:core-verification

# 或者使用详细模式
npm run test:integration:full
```

### 3. 运行单独的测试套件

```bash
# 只运行集成测试
npm run test:integration

# 运行特定的测试文件
npx vitest run src/test/integration/CoreIntegration.test.ts
npx vitest run src/test/integration/LinkSystemIntegration.test.ts
npx vitest run src/test/integration/EditorIntegration.test.ts
npx vitest run src/test/integration/SearchIntegration.test.ts
npx vitest run src/test/integration/DataPersistenceIntegration.test.ts
npx vitest run src/test/integration/DesktopEnvironment.test.ts
```

## 测试套件详解

### 1. 核心系统集成测试

**文件**: `src/test/integration/CoreIntegration.test.ts`

**验证内容**:
- MingLog 核心系统的正确初始化
- 事件总线的功能
- 数据库管理器的连接和操作
- 模块注册、激活和停用
- 核心 API 的完整性
- 设置管理系统
- 错误处理和资源清理

**关键测试场景**:
```typescript
// 系统初始化验证
expect(core.getEventBus()).toBeDefined();
expect(core.getDatabaseManager()).toBeDefined();

// 模块管理验证
await core.registerModule('test-module', moduleFactory, config);
await core.activateModule('test-module');
expect(moduleManager.getActiveModules()).toHaveLength(1);

// API功能验证
await coreAPI.storage.set('test-key', { test: 'data' });
const result = await coreAPI.storage.get('test-key');
expect(result).toEqual({ test: 'data' });
```

### 2. 双向链接系统集成测试

**文件**: `src/test/integration/LinkSystemIntegration.test.ts`

**验证内容**:
- 页面链接和块链接的解析
- 链接的创建、更新和删除
- 反向链接的正确维护
- 缓存系统的集成
- 链接一致性检查
- 与搜索引擎的集成

**关键测试场景**:
```typescript
// 链接解析和创建
const pageLinks = pageLinkParser.parse(document.content, document.id);
for (const link of pageLinks) {
  await linkManager.createLink(link);
}

// 反向链接验证
const backlinks = await linkManager.getBacklinks('目标页面');
expect(backlinks).toHaveLength(1);

// 一致性检查
const report = await consistencyChecker.checkConsistency();
expect(report.totalIssues).toBe(expectedIssues);
```

### 3. 编辑器集成测试

**文件**: `src/test/integration/EditorIntegration.test.ts`

**验证内容**:
- 富文本编辑器的基本功能
- 链接语法的实时解析
- 自动补全功能
- 快捷键操作
- 链接的编辑和删除
- 性能优化（防抖、大文档处理）

**关键测试场景**:
```typescript
// 链接创建
await user.type(textarea, '这是关于[[机器学习]]的文档');
expect(mockOnLinkCreate).toHaveBeenCalled();

// 自动补全
await user.type(textarea, '[[机器');
expect(screen.getByTestId('link-suggestions')).toBeInTheDocument();

// 快捷键
await user.keyboard('{Control>}[{/Control}');
expect(mockOnChange).toHaveBeenCalledWith('测试内容[[]]');
```

### 4. 搜索功能集成测试

**文件**: `src/test/integration/SearchIntegration.test.ts`

**验证内容**:
- 文档索引和基本搜索
- 高级搜索选项（过滤、排序、高亮）
- 与链接系统的集成
- 搜索性能和缓存
- 搜索建议和自动补全
- 并发搜索处理

**关键测试场景**:
```typescript
// 基本搜索
const results = searchEngine.search('人工智能');
expect(results).toHaveLength(2);

// 高级搜索
const tagResults = searchEngine.search('tag:AI');
expect(tagResults).toHaveLength(2);

// 链接增强搜索
const enhancedResults = searchEngine.search('主题', {
  boost: { linkedDocuments: linkedDocIds }
});
```

### 5. 数据持久化集成测试

**文件**: `src/test/integration/DataPersistenceIntegration.test.ts`

**验证内容**:
- 数据库的基本 CRUD 操作
- 事务处理
- 缓存系统的集成
- 链接数据的持久化
- 搜索索引的持久化
- 数据一致性和完整性
- 备份和恢复

**关键测试场景**:
```typescript
// 数据库操作
const result = await databaseManager.execute(
  'INSERT INTO test_table (name, value) VALUES (?, ?)',
  ['test', 'value']
);
expect(result.changes).toBe(1);

// 事务处理
await databaseManager.transaction(async () => {
  await databaseManager.execute(sql1, params1);
  await databaseManager.execute(sql2, params2);
});

// 缓存集成
cacheManager.set(cacheKey, data);
const cached = cacheManager.get(cacheKey);
expect(cached).toEqual(data);
```

### 6. 桌面环境集成测试

**文件**: `src/test/integration/DesktopEnvironment.test.ts`

**验证内容**:
- 桌面应用的初始化
- Tauri API 的集成
- 文件系统操作
- 窗口管理
- 系统通知
- 剪贴板操作
- 完整的工作流程
- 性能监控

**关键测试场景**:
```typescript
// 桌面环境验证
expect(window.__TAURI__).toBeDefined();
expect(window.__TAURI__.invoke).toBeDefined();

// 文件操作
await mockTauriAPI.fs.writeTextFile(filePath, content);
const readContent = await mockTauriAPI.fs.readTextFile(filePath);
expect(readContent).toBe(content);

// 窗口操作
await currentWindow.setTitle('MingLog - 测试文档');
expect(currentWindow.setTitle).toHaveBeenCalled();
```

## 测试配置

### Vitest 配置

测试使用专门的配置文件 `vitest.integration.config.ts`：

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    testTimeout: 60000,
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      }
    }
  }
});
```

### 测试设置

全局测试设置在 `src/test/setup/integration-setup.ts` 中：

- 模拟浏览器 API（localStorage、IndexedDB、fetch 等）
- 模拟桌面环境 API（Tauri、Electron）
- 模拟数据库连接
- 设置测试环境变量

## 测试报告

### 运行结果

测试完成后会生成以下报告：

1. **控制台输出**: 实时显示测试进度和结果
2. **JSON 报告**: `integration-test-report.json`
3. **HTML 报告**: `integration-test-report.html`
4. **覆盖率报告**: `coverage/integration/` 目录

### 报告内容

- 测试套件执行状态
- 测试通过率和失败详情
- 代码覆盖率统计
- 性能指标
- 错误信息和堆栈跟踪

## 故障排除

### 常见问题

1. **测试超时**
   ```bash
   # 增加超时时间
   npx vitest run --testTimeout=120000
   ```

2. **内存不足**
   ```bash
   # 增加 Node.js 内存限制
   NODE_OPTIONS="--max-old-space-size=4096" npm run test:integration
   ```

3. **模拟 API 问题**
   - 检查 `integration-setup.ts` 中的模拟配置
   - 确保所有必要的 API 都已模拟

4. **数据库连接问题**
   - 验证模拟数据库连接的配置
   - 检查数据库操作的模拟实现

### 调试技巧

1. **启用详细输出**
   ```bash
   npm run test:integration -- --reporter=verbose
   ```

2. **运行单个测试**
   ```bash
   npx vitest run -t "应该成功初始化所有核心组件"
   ```

3. **启用调试模式**
   ```bash
   DEBUG=minglog:* npm run test:integration
   ```

## 持续集成

### CI/CD 集成

在 CI/CD 管道中运行测试：

```yaml
# GitHub Actions 示例
- name: Run Core Verification Tests
  run: |
    cd packages/core
    npm ci
    npm run test:core-verification
    
- name: Upload Test Reports
  uses: actions/upload-artifact@v3
  with:
    name: test-reports
    path: |
      packages/core/integration-test-report.html
      packages/core/coverage/integration/
```

### 质量门禁

建议的质量标准：

- 测试通过率: ≥ 95%
- 代码覆盖率: ≥ 80%
- 性能基准: 启动时间 < 3秒，内存使用 < 100MB

## 最佳实践

1. **定期运行**: 每次代码变更后都应运行核心验证测试
2. **监控性能**: 关注测试执行时间和资源使用
3. **维护模拟**: 保持模拟 API 与实际 API 的同步
4. **文档更新**: 及时更新测试文档和配置
5. **错误分析**: 仔细分析失败的测试，找出根本原因

## 扩展测试

### 添加新的测试套件

1. 在 `src/test/integration/` 目录下创建新的测试文件
2. 更新 `scripts/run-integration-tests.js` 中的测试套件配置
3. 添加相应的文档说明

### 自定义测试配置

可以通过环境变量自定义测试行为：

```bash
# 启用调试模式
MINGLOG_DEBUG=true npm run test:integration

# 设置测试超时
TEST_TIMEOUT=120000 npm run test:integration

# 跳过性能测试
SKIP_PERFORMANCE_TESTS=true npm run test:integration
```

通过这个完整的核心功能验证系统，我们可以确保 MingLog 的所有核心模块都能正常工作，为后续的功能开发提供可靠的基础。
