# MingLog 模块化架构设计文档

## 📋 概述

MingLog 已成功重构为模块化知识管理系统，支持功能模块的自由选择和扩展。本文档详细介绍了新的架构设计、实现方案和使用指南。

## 🏗️ 架构概览

### 核心设计原则

1. **模块化解耦**：功能独立，接口标准化
2. **插件友好**：支持第三方模块开发
3. **用户可选**：功能模块可自由启用/禁用
4. **向后兼容**：平滑迁移现有数据

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    MingLog 应用层                            │
├─────────────────────────────────────────────────────────────┤
│  Desktop App (Tauri)  │  Web App (React)  │  Mobile (Future) │
├─────────────────────────────────────────────────────────────┤
│                      模块层                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ Notes   │ │ MindMap │ │ Tasks   │ │ Search  │ │ Sync    │ │
│  │ Module  │ │ Module  │ │ Module  │ │ Module  │ │ Module  │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      核心层                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ Module      │ │ Event       │ │ Database    │            │
│  │ Manager     │ │ System      │ │ Manager     │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## 📁 项目结构

```
minglog/
├── packages/                    # 模块包目录
│   ├── core/                   # 核心包
│   │   ├── src/
│   │   │   ├── types/          # 类型定义
│   │   │   ├── module-manager/ # 模块管理器
│   │   │   ├── event-system/   # 事件系统
│   │   │   ├── database/       # 数据库管理
│   │   │   ├── utils/          # 工具函数
│   │   │   ├── MingLogCore.ts  # 核心类
│   │   │   └── index.ts        # 导出文件
│   │   └── package.json
│   ├── modules/                # 功能模块
│   │   ├── notes/              # 笔记模块
│   │   │   ├── src/
│   │   │   │   ├── NotesModule.ts
│   │   │   │   ├── services/
│   │   │   │   ├── components/
│   │   │   │   ├── types/
│   │   │   │   └── routes/
│   │   │   └── package.json
│   │   ├── mindmap/            # 思维导图模块 (待开发)
│   │   ├── tasks/              # 任务管理模块 (待开发)
│   │   ├── search/             # 搜索模块 (待开发)
│   │   └── sync/               # 同步模块 (待开发)
│   └── ui/                     # 共享UI组件
│       ├── src/
│       │   └── components/
│       └── package.json
├── apps/                       # 应用
│   ├── tauri-desktop/          # 桌面应用
│   └── web/                    # Web应用
├── pnpm-workspace.yaml         # 工作空间配置
└── package.json                # 根包配置
```

## 🔧 核心组件

### 1. 模块管理器 (ModuleManager)

负责模块的生命周期管理：

```typescript
class ModuleManager {
  // 注册模块
  async registerModule(id: string, factory: ModuleFactory, config: ModuleConfig): Promise<void>
  
  // 激活模块
  async activateModule(moduleId: string): Promise<void>
  
  // 停用模块
  async deactivateModule(moduleId: string): Promise<void>
  
  // 获取模块状态
  getModuleStatus(moduleId: string): ModuleStatus
  
  // 获取激活的模块
  getActiveModules(): Module[]
}
```

### 2. 事件系统 (EventBus)

支持模块间通信：

```typescript
class EventBus {
  // 发送事件
  emit(type: string, data?: any, source?: string, target?: string): void
  
  // 监听事件
  on(type: string, handler: (event: ModuleEvent) => void): void
  
  // 取消监听
  off(type: string, handler: (event: ModuleEvent) => void): void
  
  // 等待事件
  waitFor(type: string, timeout?: number): Promise<ModuleEvent>
}
```

### 3. 数据库管理器 (DatabaseManager)

提供模块化数据库访问：

```typescript
class DatabaseManager {
  // 注册模块数据库模式
  registerSchema(moduleId: string, schema: DatabaseSchema): void
  
  // 执行查询
  async query<T>(sql: string, params?: any[]): Promise<T[]>
  
  // 执行事务
  async transaction<T>(callback: () => Promise<T>): Promise<T>
  
  // 创建表
  async createTable(tableName: string, schema: TableSchema): Promise<void>
}
```

## 🧩 模块接口

### 标准模块接口

每个模块必须实现以下接口：

```typescript
interface Module {
  // 基本信息
  readonly id: string
  readonly name: string
  readonly version: string
  readonly description: string
  readonly dependencies: string[]
  
  // 生命周期方法
  initialize(core: CoreAPI): Promise<void>
  activate(): Promise<void>
  deactivate(): Promise<void>
  
  // 功能提供
  getRoutes?(): ModuleRoute[]
  getMenuItems?(): ModuleMenuItem[]
  getSettings?(): SettingItem[]
  
  // 事件处理
  onEvent?(event: ModuleEvent): void
}
```

### 模块配置

```typescript
interface ModuleConfig {
  id: string
  name: string
  description: string
  version: string
  enabled: boolean
  dependencies: string[]
  settings: Record<string, any>
}
```

## 📝 示例：笔记模块

### 模块实现

```typescript
export class NotesModule implements Module {
  readonly id = 'notes'
  readonly name = '笔记管理'
  readonly version = '1.0.0'
  readonly description = '提供笔记的创建、编辑、标签管理等功能'
  readonly dependencies: string[] = []

  async initialize(core: CoreAPI): Promise<void> {
    // 创建数据库表
    await core.database.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        tags TEXT DEFAULT '[]',
        is_favorite BOOLEAN DEFAULT FALSE,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)
  }

  async activate(): Promise<void> {
    // 注册事件监听器
    this.coreAPI.events.on('search:query', this.handleSearchQuery.bind(this))
  }

  async deactivate(): Promise<void> {
    // 清理资源
    this.coreAPI.events.off('search:query', this.handleSearchQuery.bind(this))
  }

  getRoutes(): ModuleRoute[] {
    return [
      {
        path: '/notes',
        component: NotesListPage,
        title: '笔记列表'
      },
      {
        path: '/notes/new',
        component: NoteEditorPage,
        title: '新建笔记'
      }
    ]
  }

  getMenuItems(): ModuleMenuItem[] {
    return [
      {
        id: 'notes',
        label: '笔记',
        icon: 'FileText',
        path: '/notes',
        order: 1
      }
    ]
  }
}
```

### 服务层

```typescript
export class NotesService {
  constructor(private coreAPI: CoreAPI) {}

  async createNote(request: CreateNoteRequest): Promise<Note> {
    const note = {
      id: uuidv4(),
      title: request.title,
      content: request.content || '',
      tags: request.tags || [],
      is_favorite: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await this.coreAPI.database.execute(
      'INSERT INTO notes (...) VALUES (...)',
      [/* parameters */]
    )

    // 发送创建事件
    this.coreAPI.events.emit('data:created', {
      type: 'note',
      id: note.id,
      data: note
    })

    return note
  }
}
```

## 🚀 使用指南

### 1. 初始化核心系统

```typescript
import { MingLogCore } from '@minglog/core'
import { NotesModuleFactory } from '@minglog/notes'

// 创建核心实例
const core = new MingLogCore({
  database: databaseConnection,
  debugMode: true
})

// 初始化
await core.initialize()

// 注册模块
await core.registerModule('notes', NotesModuleFactory, {
  id: 'notes',
  name: '笔记管理',
  version: '1.0.0',
  description: '笔记功能模块',
  enabled: true,
  dependencies: [],
  settings: {}
})

// 激活模块
await core.activateModule('notes')
```

### 2. 开发新模块

1. **创建模块目录**：
   ```bash
   mkdir packages/modules/my-module
   cd packages/modules/my-module
   ```

2. **实现模块类**：
   ```typescript
   export class MyModule implements Module {
     readonly id = 'my-module'
     readonly name = '我的模块'
     // ... 实现接口方法
   }
   ```

3. **注册和激活**：
   ```typescript
   await core.registerModule('my-module', MyModuleFactory, config)
   await core.activateModule('my-module')
   ```

### 3. 模块间通信

```typescript
// 发送事件
core.getEventBus().emit('my-event', { data: 'hello' }, 'my-module')

// 监听事件
core.getEventBus().on('other-event', (event) => {
  console.log('Received:', event.data)
})
```

## 🔄 数据迁移

### 从单体架构迁移

1. **数据备份**：
   ```typescript
   await core.getDatabaseManager().backup('./backup.db')
   ```

2. **模式迁移**：
   - 现有数据表保持不变
   - 新增模块配置表
   - 渐进式迁移数据

3. **功能迁移**：
   - 将现有功能逐步重构为模块
   - 保持API兼容性
   - 分阶段切换

## 📊 性能优化

### 1. 懒加载

- 模块按需加载
- 组件懒加载
- 路由代码分割

### 2. 事件优化

- 事件防抖和节流
- 事件历史限制
- 内存泄漏防护

### 3. 数据库优化

- 索引优化
- 查询缓存
- 连接池管理

## 🧪 测试策略

### 1. 单元测试

```typescript
describe('NotesModule', () => {
  it('should create note', async () => {
    const module = new NotesModule(config)
    await module.initialize(mockCoreAPI)
    
    const service = module.getNotesService()
    const note = await service.createNote({
      title: 'Test Note',
      content: 'Test content'
    })
    
    expect(note.title).toBe('Test Note')
  })
})
```

### 2. 集成测试

```typescript
describe('Module Integration', () => {
  it('should communicate between modules', async () => {
    const core = new MingLogCore(options)
    await core.initialize()
    
    await core.activateModule('notes')
    await core.activateModule('search')
    
    // 测试模块间通信
    core.getEventBus().emit('search:query', { query: 'test' })
    
    const results = await core.getEventBus().waitFor('search:results')
    expect(results.data.results).toBeDefined()
  })
})
```

## 🔮 未来规划

### Phase 2: 基础模块实现 (Week 3-4)
- [ ] 模块管理UI界面
- [ ] 模块配置系统
- [ ] 笔记模块完善

### Phase 3: 扩展模块开发 (Week 5-6)
- [ ] 思维导图模块
- [ ] 任务管理模块
- [ ] 搜索模块重构

### Phase 4: 高级功能 (Week 7-8)
- [ ] 模块热插拔
- [ ] 第三方模块API
- [ ] 性能优化

## 📚 参考资料

- [模块开发指南](./module-development-guide.md)
- [API文档](./api-reference.md)
- [最佳实践](./best-practices.md)
- [故障排除](./troubleshooting.md)

---

**注意**：这是一个活跃的开发项目，架构和API可能会根据需求进行调整。请关注更新日志获取最新信息。
