# MingLog 错误报告系统文档

## 概述

MingLog桌面客户端集成了全面的错误报告系统，用于自动捕获、分析和报告应用程序错误，帮助开发团队快速定位和修复问题。

## 系统架构

### 组件结构

```
错误报告系统
├── 后端错误捕获 (Rust/Tauri)
│   ├── Sentry集成
│   ├── 本地错误日志
│   └── 错误分类和优先级
├── 前端错误边界 (React)
│   ├── JavaScript错误捕获
│   ├── 组件错误恢复
│   └── 用户友好的错误界面
├── 错误测试工具
│   ├── 模拟错误场景
│   ├── 恢复机制测试
│   └── 性能影响评估
└── 隐私保护机制
    ├── 数据脱敏
    ├── 用户同意管理
    └── 本地存储控制
```

## 功能特性

### 1. 自动错误捕获

- **后端错误**: 自动捕获Rust代码中的panic、数据库错误、文件操作错误等
- **前端错误**: 通过React错误边界捕获JavaScript运行时错误
- **系统错误**: 监控系统资源使用和性能问题

### 2. 错误分类和优先级

错误按类型自动分类：
- `database`: 数据库相关错误 (高优先级)
- `io`: 文件和网络I/O错误 (中优先级)
- `serialization`: 数据序列化错误 (中优先级)
- `not_found`: 资源未找到错误 (低优先级)
- `invalid_input`: 用户输入验证错误 (低优先级)
- `permission`: 权限相关错误 (高优先级)
- `internal`: 内部逻辑错误 (高优先级)
- `sync`: 同步相关错误 (中优先级)

### 3. 隐私保护

- **数据脱敏**: 自动移除错误报告中的敏感信息
- **用户控制**: 用户可以完全禁用错误报告
- **本地优先**: 错误信息首先存储在本地
- **透明度**: 清晰说明收集的数据类型和用途

## 使用指南

### 启用错误报告

1. 打开应用设置
2. 导航到"错误报告"选项卡
3. 启用"错误报告"开关
4. 阅读并确认隐私政策

### 配置选项

```typescript
interface ErrorReportingConfig {
  enabled: boolean;                    // 是否启用错误报告
  dsn?: string;                       // Sentry DSN (可选)
  environment: string;                // 环境标识 (development/production)
  release: string;                    // 版本号
  sample_rate: number;                // 采样率 (0.0-1.0)
  include_personal_data: boolean;     // 是否包含个人数据 (默认false)
  auto_session_tracking: boolean;     // 自动会话跟踪
}
```

### API 使用

#### Tauri命令

```rust
// 配置错误报告
configure_error_reporting(config: ErrorReportingConfig) -> Result<()>

// 切换错误报告状态
toggle_error_reporting(enabled: bool) -> Result<()>

// 获取错误报告状态
get_error_reporting_status() -> Result<bool>

// 运行错误测试
run_error_tests() -> Result<Vec<ErrorTestResult>>

// 运行单个错误测试
run_single_error_test(scenario: ErrorTestScenario) -> Result<ErrorTestResult>
```

#### React组件

```tsx
import { ErrorBoundary, withErrorBoundary, useErrorReporting } from './components/ErrorBoundary';

// 使用错误边界包装组件
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// 使用高阶组件
const SafeComponent = withErrorBoundary(YourComponent);

// 手动报告错误
const { reportError } = useErrorReporting();
reportError(new Error('Something went wrong'), 'user-action');
```

## 错误测试工具

### 测试场景

系统提供以下错误测试场景：

1. **数据库连接失败** (`DatabaseConnectionFailure`)
   - 模拟数据库连接中断
   - 测试自动重连机制

2. **文件权限错误** (`FilePermissionError`)
   - 模拟文件访问权限问题
   - 测试权限错误处理

3. **网络超时** (`NetworkTimeout`)
   - 模拟网络连接超时
   - 测试重试机制

4. **内存耗尽** (`MemoryExhaustion`)
   - 模拟内存不足情况
   - 测试内存管理

5. **系统托盘失败** (`SystemTrayFailure`)
   - 模拟系统托盘初始化失败
   - 测试UI降级方案

6. **无效输入** (`InvalidInput`)
   - 模拟用户输入验证错误
   - 测试输入处理

7. **并发问题** (`ConcurrencyIssue`)
   - 模拟资源竞争
   - 测试并发控制

8. **性能降级** (`PerformanceDegradation`)
   - 模拟性能问题
   - 测试性能监控

### 运行测试

```bash
# 运行所有错误测试
node scripts/test-error-reporting.js

# 在应用中运行测试
# 设置 -> 错误报告 -> 运行所有测试
```

## 故障排除

### 常见问题

#### 1. 错误报告未启用

**症状**: 错误没有被记录或报告

**解决方案**:
- 检查错误报告开关是否启用
- 验证配置是否正确
- 查看控制台日志确认初始化状态

#### 2. Sentry连接失败

**症状**: 错误只在本地记录，未上传到Sentry

**解决方案**:
- 验证Sentry DSN配置
- 检查网络连接
- 确认Sentry项目设置

#### 3. 性能影响

**症状**: 应用响应变慢

**解决方案**:
- 降低采样率 (sample_rate)
- 禁用自动会话跟踪
- 检查错误报告频率

#### 4. 隐私担忧

**症状**: 用户担心数据隐私

**解决方案**:
- 确保 `include_personal_data` 设置为 `false`
- 向用户展示隐私保护措施
- 提供完全禁用选项

### 调试步骤

1. **检查配置**
   ```bash
   # 查看错误报告配置文件
   cat ~/.config/MingLog/error_reporting.json
   ```

2. **查看本地日志**
   ```bash
   # 查看错误日志
   cat logs/error_log_YYYYMMDD.json
   ```

3. **测试连接**
   ```bash
   # 运行连接测试
   curl -X POST "https://sentry.io/api/PROJECT_ID/store/" \
        -H "X-Sentry-Auth: Sentry sentry_key=YOUR_KEY"
   ```

## 最佳实践

### 开发阶段

1. **启用详细日志**: 在开发环境中启用所有错误报告
2. **定期测试**: 运行错误测试确保系统正常工作
3. **监控性能**: 确保错误报告不影响应用性能

### 生产环境

1. **用户同意**: 确保获得用户明确同意
2. **数据最小化**: 只收集必要的错误信息
3. **定期审查**: 定期审查错误报告和隐私设置

### 错误处理

1. **优雅降级**: 确保错误不会导致应用崩溃
2. **用户反馈**: 提供清晰的错误信息和恢复选项
3. **快速响应**: 建立错误监控和响应流程

## 技术规范

### 错误报告格式

```json
{
  "error_id": "uuid",
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "error|warning|info",
  "type": "database|io|serialization|...",
  "message": "错误描述",
  "stack_trace": "堆栈跟踪",
  "context": {
    "operation": "操作名称",
    "user_id": "脱敏用户ID",
    "app_version": "1.0.0",
    "platform": "windows|macos|linux"
  },
  "recovery_attempted": true,
  "recovery_successful": false
}
```

### 性能指标

- **错误报告开销**: < 5% CPU使用率
- **内存占用**: < 10MB 额外内存
- **网络使用**: < 1KB 每个错误报告
- **存储空间**: < 100MB 本地日志

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 基础错误捕获和报告功能
- React错误边界实现
- Sentry集成
- 隐私保护机制

### 未来计划

- [ ] 错误趋势分析
- [ ] 自动错误分组
- [ ] 用户反馈集成
- [ ] 离线错误缓存
- [ ] 错误报告仪表板
