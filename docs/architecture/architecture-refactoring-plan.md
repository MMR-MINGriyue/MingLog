# 🔧 MingLog 架构重构实施计划

## 📋 重构概述

基于架构分析，我们需要进行 **Phase 1.5: 架构重构**，在继续开发新功能之前优化现有架构。

## 🎯 重构目标

1. **建立完整的UI组件库** - 解决组件分散问题
2. **标准化模块开发** - 统一模块结构和规范
3. **抽象数据访问层** - 支持多种存储后端
4. **优化跨平台架构** - 最大化代码复用

## 📅 实施时间线

### Week 1: UI组件库重构
- **Day 1-2**: 设计系统基础
- **Day 3-4**: 组件迁移和重构
- **Day 5**: 主题系统实现

### Week 2: 模块标准化
- **Day 1-2**: 模块模板和规范
- **Day 3-4**: 现有模块重构
- **Day 5**: 模块开发工具

### Week 3: 数据层和跨平台优化
- **Day 1-2**: 数据访问层抽象
- **Day 3-4**: 平台适配器重构
- **Day 5**: 集成测试和验证

## 🔄 详细实施步骤

### Step 1: UI组件库重构

#### 1.1 创建设计系统基础

```typescript
// packages/ui/src/design-system/tokens.ts
export const designTokens = {
  colors: {
    primary: {
      50: '#f0f9ff',
      500: '#3b82f6',
      900: '#1e3a8a'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem'
    }
  }
}
```

#### 1.2 建立组件库结构

```
packages/ui/src/
├── design-system/
│   ├── tokens.ts           # 设计令牌
│   ├── themes.ts           # 主题定义
│   └── index.ts            # 导出
├── components/
│   ├── atoms/              # 原子组件
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Icon/
│   │   └── Typography/
│   ├── molecules/          # 分子组件
│   │   ├── SearchBox/
│   │   ├── Card/
│   │   ├── Modal/
│   │   └── Dropdown/
│   ├── organisms/          # 有机体组件
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── DataTable/
│   │   └── PerformanceMonitor/
│   └── templates/          # 模板组件
│       ├── AppLayout/
│       ├── ModuleLayout/
│       └── SettingsLayout/
├── hooks/                  # 共享Hooks
│   ├── useTheme.ts
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   └── useKeyboard.ts
├── contexts/               # 共享Context
│   ├── ThemeContext.tsx
│   ├── NotificationContext.tsx
│   └── ModalContext.tsx
└── utils/                  # UI工具函数
    ├── classNames.ts
    ├── animations.ts
    └── accessibility.ts
```

#### 1.3 组件迁移清单

**从 apps/tauri-desktop/src/components/ 迁移到 packages/ui/src/components/**:

```bash
# 高优先级组件
✅ PerformanceMonitor.tsx    → organisms/PerformanceMonitor/
✅ SearchComponent.tsx       → molecules/SearchBox/
✅ SettingsPanel.tsx         → organisms/SettingsPanel/
✅ NotificationSystem.tsx    → organisms/NotificationSystem/
✅ ModuleSelector.tsx        → molecules/ModuleSelector/

# 中优先级组件
✅ LoadingSpinner.tsx        → atoms/LoadingSpinner/
✅ ErrorBoundary.tsx         → molecules/ErrorBoundary/
✅ ConfirmDialog.tsx         → molecules/ConfirmDialog/
✅ TooltipWrapper.tsx        → atoms/Tooltip/

# 低优先级组件
✅ ThemeToggle.tsx           → atoms/ThemeToggle/
✅ KeyboardShortcuts.tsx     → molecules/KeyboardShortcuts/
```

### Step 2: 模块标准化

#### 2.1 创建模块开发模板

```
packages/modules/_template/
├── src/
│   ├── components/         # 模块特定组件
│   │   ├── ModuleView.tsx
│   │   ├── ModuleSettings.tsx
│   │   └── index.ts
│   ├── services/           # 业务逻辑
│   │   ├── ModuleService.ts
│   │   ├── DataService.ts
│   │   └── index.ts
│   ├── types/              # 类型定义
│   │   ├── module.types.ts
│   │   ├── data.types.ts
│   │   └── index.ts
│   ├── hooks/              # 模块Hooks
│   │   ├── useModuleData.ts
│   │   ├── useModuleSettings.ts
│   │   └── index.ts
│   ├── utils/              # 工具函数
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── index.ts
│   ├── constants/          # 常量定义
│   │   ├── events.ts
│   │   ├── defaults.ts
│   │   └── index.ts
│   ├── module.config.ts    # 模块配置
│   ├── module.factory.ts   # 模块工厂
│   └── index.ts            # 模块入口
├── __tests__/              # 测试文件
│   ├── components/
│   ├── services/
│   ├── hooks/
│   └── integration/
├── docs/                   # 模块文档
│   ├── README.md
│   ├── API.md
│   └── CHANGELOG.md
├── package.json            # 模块依赖
└── tsconfig.json           # TypeScript配置
```

#### 2.2 标准模块接口

```typescript
// packages/modules/_template/src/module.factory.ts
import { Module, ModuleConfig, CoreAPI } from '@minglog/core'
import { TemplateModule } from './TemplateModule'

export class TemplateModuleFactory implements ModuleFactory {
  async create(config: ModuleConfig): Promise<Module> {
    return new TemplateModule(config)
  }
}

// packages/modules/_template/src/TemplateModule.ts
export class TemplateModule implements Module {
  readonly id = 'template'
  readonly name = '模板模块'
  readonly version = '1.0.0'
  readonly description = '模块开发模板'
  readonly dependencies: string[] = []

  private coreAPI!: CoreAPI
  private service!: TemplateService

  async initialize(core: CoreAPI): Promise<void> {
    this.coreAPI = core
    this.service = new TemplateService(core)
    
    // 初始化数据库表
    await this.setupDatabase()
    
    // 注册事件监听器
    this.setupEventListeners()
  }

  async activate(): Promise<void> {
    // 激活模块服务
    await this.service.start()
    
    // 注册路由
    this.registerRoutes()
    
    // 注册菜单项
    this.registerMenuItems()
  }

  async deactivate(): Promise<void> {
    // 停用模块服务
    await this.service.stop()
    
    // 清理资源
    this.cleanup()
  }

  async destroy(): Promise<void> {
    // 销毁模块
    await this.service.destroy()
  }

  // 健康检查
  async healthCheck(): Promise<HealthStatus> {
    return this.service.healthCheck()
  }

  // 获取路由
  getRoutes(): ModuleRoute[] {
    return [
      {
        path: '/template',
        component: TemplateView,
        title: '模板',
        icon: 'template'
      }
    ]
  }

  // 获取菜单项
  getMenuItems(): ModuleMenuItem[] {
    return [
      {
        id: 'template',
        label: '模板',
        icon: 'template',
        path: '/template',
        order: 100
      }
    ]
  }

  // 获取设置项
  getSettings(): SettingItem[] {
    return [
      {
        key: 'template.enabled',
        label: '启用模板功能',
        type: 'boolean',
        defaultValue: true
      }
    ]
  }

  private async setupDatabase(): Promise<void> {
    // 创建模块数据表
  }

  private setupEventListeners(): void {
    // 注册事件监听器
  }

  private registerRoutes(): void {
    // 注册模块路由
  }

  private registerMenuItems(): void {
    // 注册菜单项
  }

  private cleanup(): void {
    // 清理资源
  }
}
```

### Step 3: 数据访问层抽象

#### 3.1 创建数据访问接口

```typescript
// packages/services/src/data-access/DataAccessLayer.ts
export interface DataAccessLayer {
  // 基础CRUD操作
  create<T>(table: string, data: Partial<T>): Promise<T>
  findById<T>(table: string, id: string): Promise<T | null>
  findMany<T>(table: string, query?: QueryOptions): Promise<T[]>
  update<T>(table: string, id: string, data: Partial<T>): Promise<T>
  delete(table: string, id: string): Promise<void>
  
  // 批量操作
  createMany<T>(table: string, data: Partial<T>[]): Promise<T[]>
  updateMany<T>(table: string, query: QueryOptions, data: Partial<T>): Promise<number>
  deleteMany(table: string, query: QueryOptions): Promise<number>
  
  // 事务支持
  transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>
  
  // 查询构建器
  query<T>(table: string): QueryBuilder<T>
  
  // 缓存支持
  cached<T>(key: string, ttl: number, factory: () => Promise<T>): Promise<T>
  invalidateCache(pattern: string): Promise<void>
}

// packages/services/src/data-access/QueryBuilder.ts
export class QueryBuilder<T> {
  where(field: keyof T, operator: string, value: any): this
  whereIn(field: keyof T, values: any[]): this
  orderBy(field: keyof T, direction: 'asc' | 'desc'): this
  limit(count: number): this
  offset(count: number): this
  select(fields: (keyof T)[]): this
  join(table: string, on: string): this
  
  async find(): Promise<T[]>
  async findOne(): Promise<T | null>
  async count(): Promise<number>
  async exists(): Promise<boolean>
}
```

#### 3.2 实现SQLite适配器

```typescript
// packages/adapters/src/database/SQLiteAdapter.ts
export class SQLiteDataAccessLayer implements DataAccessLayer {
  constructor(private db: DatabaseManager) {}

  async create<T>(table: string, data: Partial<T>): Promise<T> {
    const fields = Object.keys(data).join(', ')
    const placeholders = Object.keys(data).map(() => '?').join(', ')
    const values = Object.values(data)
    
    const sql = `INSERT INTO ${table} (${fields}) VALUES (${placeholders}) RETURNING *`
    const result = await this.db.queryOne<T>(sql, values)
    
    if (!result) {
      throw new Error(`Failed to create record in ${table}`)
    }
    
    return result
  }

  async findById<T>(table: string, id: string): Promise<T | null> {
    const sql = `SELECT * FROM ${table} WHERE id = ?`
    return this.db.queryOne<T>(sql, [id])
  }

  // ... 其他方法实现
}
```

### Step 4: 跨平台适配器优化

#### 4.1 平台适配器接口

```typescript
// packages/adapters/src/platform/PlatformAdapter.ts
export interface PlatformAdapter {
  // 文件系统
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  deleteFile(path: string): Promise<void>
  
  // 通知
  showNotification(title: string, message: string): Promise<void>
  
  // 系统集成
  openExternal(url: string): Promise<void>
  getSystemInfo(): Promise<SystemInfo>
  
  // 窗口管理
  setWindowTitle(title: string): Promise<void>
  minimizeWindow(): Promise<void>
  maximizeWindow(): Promise<void>
}

// packages/adapters/src/platform/TauriAdapter.ts
export class TauriPlatformAdapter implements PlatformAdapter {
  async readFile(path: string): Promise<string> {
    return invoke('read_file', { path })
  }

  async writeFile(path: string, content: string): Promise<void> {
    return invoke('write_file', { path, content })
  }

  // ... 其他Tauri特定实现
}

// packages/adapters/src/platform/WebAdapter.ts
export class WebPlatformAdapter implements PlatformAdapter {
  async readFile(path: string): Promise<string> {
    // Web环境下的文件读取实现
    throw new Error('File system access not available in web environment')
  }

  async showNotification(title: string, message: string): Promise<void> {
    if ('Notification' in window) {
      new Notification(title, { body: message })
    }
  }

  // ... 其他Web特定实现
}
```

## 🧪 测试策略

### 组件测试
```typescript
// packages/ui/src/components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button Component', () => {
  it('should render correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### 模块测试
```typescript
// packages/modules/notes/src/__tests__/NotesModule.test.ts
import { NotesModule } from '../NotesModule'
import { createMockCoreAPI } from '@minglog/core/testing'

describe('NotesModule', () => {
  let module: NotesModule
  let mockCore: CoreAPI

  beforeEach(() => {
    mockCore = createMockCoreAPI()
    module = new NotesModule({
      id: 'notes',
      name: 'Notes',
      version: '1.0.0',
      enabled: true,
      dependencies: [],
      settings: {}
    })
  })

  it('should initialize correctly', async () => {
    await module.initialize(mockCore)
    expect(module.getStatus()).toBe(ModuleStatus.LOADED)
  })
})
```

## 📊 成功指标

### 代码质量
- [ ] 组件复用率 > 80%
- [ ] 测试覆盖率 > 90%
- [ ] TypeScript 严格模式 100%
- [ ] ESLint 零警告

### 性能指标
- [ ] 组件渲染时间 < 16ms
- [ ] 模块加载时间 < 300ms
- [ ] 内存使用减少 20%
- [ ] 包大小减少 15%

### 开发体验
- [ ] 组件开发时间减少 50%
- [ ] 模块开发时间减少 40%
- [ ] 构建时间减少 30%
- [ ] 热重载时间 < 1s

## 🚀 迁移策略

### 渐进式迁移
1. **并行开发**: 新组件库与现有代码并存
2. **逐步替换**: 按优先级逐步替换现有组件
3. **向后兼容**: 保持现有API的兼容性
4. **充分测试**: 每个迁移步骤都有完整测试

### 风险控制
- **功能回归测试**: 确保现有功能不受影响
- **性能监控**: 实时监控性能变化
- **用户反馈**: 收集用户使用反馈
- **回滚计划**: 准备快速回滚方案

---

**预计完成时间**: 3周  
**预期收益**: 60% 开发效率提升，40% 维护成本降低  
**风险等级**: 中等（有完整的回滚计划）
