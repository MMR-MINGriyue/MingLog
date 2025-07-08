# 增强模块管理器使用示例

## 概述

增强的模块管理器提供了以下新功能：
- 模块热重载
- 循环依赖检测
- 错误边界隔离
- 模块健康检查
- 批量操作
- 性能监控

## 基本使用

### 1. 创建模块管理器

```typescript
import { ModuleManager } from '@minglog/core'

const moduleManager = new ModuleManager(eventBus, coreAPI, {
  enableHotReload: true,        // 启用热重载
  maxRetryAttempts: 3,          // 最大重试次数
  dependencyTimeout: 30000      // 依赖超时时间
})
```

### 2. 注册模块

```typescript
// 基础模块
const notesConfig: ModuleConfig = {
  id: 'notes',
  name: '笔记模块',
  description: '提供笔记管理功能',
  version: '1.0.0',
  enabled: true,
  dependencies: [],
  settings: {}
}

await moduleManager.registerModule('notes', notesModuleFactory, notesConfig)

// 依赖模块
const searchConfig: ModuleConfig = {
  id: 'search',
  name: '搜索模块',
  description: '提供全文搜索功能',
  version: '1.0.0',
  enabled: true,
  dependencies: ['notes'],  // 依赖笔记模块
  settings: {}
}

await moduleManager.registerModule('search', searchModuleFactory, searchConfig)
```

### 3. 激活模块

```typescript
// 单个模块激活（会自动激活依赖）
await moduleManager.activateModule('search')

// 批量激活
const result = await moduleManager.batchOperation(
  ['notes', 'search', 'tasks'], 
  'activate',
  { parallel: true }
)

console.log('成功激活:', result.success)
console.log('激活失败:', result.failed)
```

## 高级功能

### 1. 热重载

```typescript
// 监听文件变化（开发环境）
if (process.env.NODE_ENV === 'development') {
  // 模拟文件变化事件
  eventBus.emit('module:notes:file-changed')
  
  // 模块会自动重载并显示通知
}

// 手动重载模块
await moduleManager.reloadModule('notes')
```

### 2. 依赖管理

```typescript
// 获取依赖树
const dependencyTree = moduleManager.getDependencyTree('search')
console.log('依赖关系:', dependencyTree)

// 检查循环依赖（自动进行）
try {
  await moduleManager.loadModule('moduleA')
} catch (error) {
  if (error.message.includes('Circular dependency')) {
    console.error('检测到循环依赖:', error.message)
  }
}
```

### 3. 错误处理

```typescript
// 监听模块错误
eventBus.on('module:error', (event) => {
  const { moduleId, error } = event.data
  console.error(`模块 ${moduleId} 发生错误:`, error)
  
  // 可以实现自定义错误处理逻辑
  handleModuleError(moduleId, error)
})

// 监听恢复失败
eventBus.on('module:recovery-failed', (event) => {
  const { moduleId, error } = event.data
  console.error(`模块 ${moduleId} 恢复失败:`, error)
  
  // 通知用户或采取其他措施
  notifyUser(`模块 ${moduleId} 无法恢复，请检查配置`)
})
```

### 4. 健康检查

```typescript
// 检查单个模块健康状态
const health = await moduleManager.getModuleHealth('notes')
console.log('模块健康状态:', health)

// 检查所有模块健康状态
const allModules = moduleManager.getActiveModules()
for (const module of allModules) {
  const health = await moduleManager.getModuleHealth(module.id)
  if (health.status !== 'healthy') {
    console.warn(`模块 ${module.id} 状态异常:`, health)
  }
}
```

### 5. 性能监控

```typescript
// 获取模块性能指标
const metrics = moduleManager.getModuleMetrics('notes')
console.log('模块指标:', {
  状态: metrics.status,
  加载时间: metrics.loadTime,
  激活时间: metrics.activationTime,
  错误次数: metrics.errorCount
})

// 监控所有模块性能
const performanceReport = moduleManager.getRegisteredModules().map(config => ({
  模块: config.name,
  指标: moduleManager.getModuleMetrics(config.id)
}))

console.table(performanceReport)
```

## 事件监听

### 模块生命周期事件

```typescript
// 模块注册
eventBus.on('module:registered', (event) => {
  console.log('模块已注册:', event.data.moduleId)
})

// 模块激活
eventBus.on('module:activated', (event) => {
  console.log('模块已激活:', event.data.moduleId)
})

// 模块重载
eventBus.on('module:reloaded', (event) => {
  console.log('模块已重载:', event.data.moduleId)
})
```

### 模块功能注册事件

```typescript
// 路由注册
eventBus.on('module:routes-registered', (event) => {
  const { moduleId, routes } = event.data
  console.log(`模块 ${moduleId} 注册了 ${routes.length} 个路由`)
})

// 菜单项注册
eventBus.on('module:menu-items-registered', (event) => {
  const { moduleId, menuItems } = event.data
  console.log(`模块 ${moduleId} 注册了菜单项:`, menuItems)
})
```

## 最佳实践

### 1. 模块设计

```typescript
class MyModule implements Module {
  readonly id = 'my-module'
  readonly name = '我的模块'
  readonly version = '1.0.0'
  readonly description = '示例模块'
  readonly dependencies = ['core-module']

  async initialize(core: CoreAPI): Promise<void> {
    // 初始化数据库表
    await core.database.execute(`
      CREATE TABLE IF NOT EXISTS my_data (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)
  }

  async activate(): Promise<void> {
    // 注册事件监听器
    this.coreAPI.events.on('data:created', this.handleDataCreated.bind(this))
  }

  async deactivate(): Promise<void> {
    // 清理资源
    this.coreAPI.events.off('data:created', this.handleDataCreated.bind(this))
  }

  // 健康检查
  async healthCheck(): Promise<HealthStatus> {
    try {
      // 检查数据库连接
      await this.coreAPI.database.query('SELECT 1')
      return { status: 'healthy', timestamp: Date.now() }
    } catch (error) {
      return { 
        status: 'error', 
        message: '数据库连接失败',
        timestamp: Date.now() 
      }
    }
  }

  private handleDataCreated(event: ModuleEvent): void {
    // 处理数据创建事件
  }
}
```

### 2. 错误处理

```typescript
// 全局错误处理
function setupGlobalErrorHandling(moduleManager: ModuleManager) {
  // 监听模块错误
  eventBus.on('module:error', async (event) => {
    const { moduleId, error } = event.data
    
    // 记录错误日志
    logger.error(`Module ${moduleId} error:`, error)
    
    // 尝试恢复
    try {
      await moduleManager.reloadModule(moduleId)
      logger.info(`Module ${moduleId} recovered successfully`)
    } catch (recoveryError) {
      logger.error(`Failed to recover module ${moduleId}:`, recoveryError)
      
      // 通知用户
      notificationService.error(
        '模块错误',
        `模块 ${moduleId} 发生错误且无法自动恢复`
      )
    }
  })
}
```

### 3. 开发环境优化

```typescript
if (process.env.NODE_ENV === 'development') {
  // 启用调试模式
  eventBus.setDebugMode(true)
  
  // 启用性能监控
  eventBus.setMetricsEnabled(true)
  
  // 定期输出性能报告
  setInterval(() => {
    const metrics = eventBus.getMetrics()
    console.log('事件总线性能:', metrics)
  }, 30000)
}
```

这些示例展示了如何充分利用增强的模块管理器功能，提高应用的可靠性和开发效率。
