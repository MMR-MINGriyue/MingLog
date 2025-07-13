# 🏗️ MingLog 技术架构设计

## 📋 架构概览

MingLog 采用模块化架构设计，支持功能模块的动态加载和管理，确保系统的可扩展性和维护性。

### 🎯 设计原则

- **模块化解耦**：功能独立，接口标准化
- **事件驱动**：模块间通过事件系统通信
- **本地优先**：数据本地存储，可选云同步
- **类型安全**：TypeScript 严格模式
- **性能优先**：懒加载、虚拟化、缓存优化

## 🏛️ 系统架构

### 分层架构图
```
┌─────────────────────────────────────────────────────────────┐
│                    应用层 (Application Layer)                │
├─────────────────────────────────────────────────────────────┤
│  Desktop App (Tauri)  │  Web App (React)  │  Mobile (Future) │
├─────────────────────────────────────────────────────────────┤
│                    表现层 (Presentation Layer)               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ UI Components│ │ Route System│ │ Theme System│            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│                    业务层 (Business Layer)                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ Notes   │ │ MindMap │ │ Tasks   │ │ Search  │ │ Sync    │ │
│  │ Module  │ │ Module  │ │ Module  │ │ Module  │ │ Module  │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │Calendar │ │ Files   │ │Analytics│ │   AI    │ │ Plugin  │ │
│  │ Module  │ │ Module  │ │ Module  │ │ Module  │ │ System  │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    核心层 (Core Layer)                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ Module      │ │ Event       │ │ Database    │            │
│  │ Manager     │ │ System      │ │ Manager     │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│                    数据层 (Data Layer)                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ SQLite      │ │ File System │ │ Search Index│            │
│  │ Database    │ │ Storage     │ │ (MeiliSearch)│            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## 🧩 核心组件设计

### 1. 模块管理器 (ModuleManager)

```typescript
interface ModuleManager {
  // 模块注册和管理
  registerModule(id: string, factory: ModuleFactory, config: ModuleConfig): Promise<void>
  unregisterModule(moduleId: string): Promise<void>
  
  // 模块生命周期
  activateModule(moduleId: string): Promise<void>
  deactivateModule(moduleId: string): Promise<void>
  reloadModule(moduleId: string): Promise<void>
  
  // 模块查询
  getModule(moduleId: string): Module | null
  getActiveModules(): Module[]
  getModuleStatus(moduleId: string): ModuleStatus
  
  // 依赖管理
  resolveDependencies(moduleId: string): string[]
  validateDependencies(): DependencyValidationResult
}

interface ModuleFactory {
  create(config: ModuleConfig, coreAPI: CoreAPI): Promise<Module>
}

interface ModuleConfig {
  id: string
  name: string
  version: string
  description: string
  enabled: boolean
  dependencies: string[]
  settings: Record<string, any>
  permissions: Permission[]
}

enum ModuleStatus {
  UNREGISTERED = 'unregistered',
  REGISTERED = 'registered',
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  DEACTIVATING = 'deactivating',
  INACTIVE = 'inactive',
  ERROR = 'error'
}
```

### 2. 事件系统 (EventBus)

```typescript
interface EventBus {
  // 事件发送
  emit(type: string, data?: any, source?: string, target?: string): void
  emitAsync(type: string, data?: any, source?: string, target?: string): Promise<void>
  
  // 事件监听
  on(type: string, handler: EventHandler): void
  once(type: string, handler: EventHandler): void
  off(type: string, handler: EventHandler): void
  
  // 事件等待
  waitFor(type: string, timeout?: number): Promise<ModuleEvent>
  
  // 事件过滤和路由
  filter(predicate: EventPredicate): EventBus
  route(pattern: string, handler: EventHandler): void
  
  // 事件历史和调试
  getEventHistory(limit?: number): ModuleEvent[]
  enableDebugMode(enabled: boolean): void
}

interface ModuleEvent {
  id: string
  type: string
  data?: any
  source?: string
  target?: string
  timestamp: number
  metadata?: Record<string, any>
}

type EventHandler = (event: ModuleEvent) => void | Promise<void>
type EventPredicate = (event: ModuleEvent) => boolean
```

### 3. 数据库管理器 (DatabaseManager)

```typescript
interface DatabaseManager {
  // 模式管理
  registerSchema(moduleId: string, schema: DatabaseSchema): Promise<void>
  migrateSchema(moduleId: string, version: string): Promise<void>
  
  // 查询操作
  query<T>(sql: string, params?: any[]): Promise<T[]>
  queryOne<T>(sql: string, params?: any[]): Promise<T | null>
  execute(sql: string, params?: any[]): Promise<void>
  
  // 事务支持
  transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>
  
  // 连接管理
  getConnection(): Promise<Connection>
  closeConnection(): Promise<void>
  
  // 备份和恢复
  backup(path: string): Promise<void>
  restore(path: string): Promise<void>
  
  // 性能监控
  getQueryStats(): QueryStats
  enableQueryLogging(enabled: boolean): void
}

interface DatabaseSchema {
  version: string
  tables: TableDefinition[]
  indexes: IndexDefinition[]
  migrations: Migration[]
}

interface TableDefinition {
  name: string
  columns: ColumnDefinition[]
  constraints?: ConstraintDefinition[]
}

interface Migration {
  version: string
  up: string[]
  down: string[]
  validate?: (db: DatabaseManager) => Promise<boolean>
}
```

## 🔌 模块接口标准

### 标准模块接口

```typescript
interface Module {
  // 基本信息
  readonly id: string
  readonly name: string
  readonly version: string
  readonly description: string
  readonly dependencies: string[]
  readonly permissions: Permission[]
  
  // 生命周期方法
  initialize(core: CoreAPI): Promise<void>
  activate(): Promise<void>
  deactivate(): Promise<void>
  destroy(): Promise<void>
  
  // 功能提供
  getRoutes?(): ModuleRoute[]
  getMenuItems?(): ModuleMenuItem[]
  getToolbarItems?(): ToolbarItem[]
  getSettings?(): SettingItem[]
  getCommands?(): Command[]
  
  // 事件处理
  onEvent?(event: ModuleEvent): void | Promise<void>
  
  // 健康检查
  healthCheck?(): Promise<HealthStatus>
}

interface CoreAPI {
  // 核心服务
  readonly moduleManager: ModuleManager
  readonly eventBus: EventBus
  readonly database: DatabaseManager
  readonly fileSystem: FileSystemManager
  readonly search: SearchManager
  
  // 工具函数
  readonly utils: {
    uuid(): string
    debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T
    throttle<T extends (...args: any[]) => any>(fn: T, delay: number): T
    deepClone<T>(obj: T): T
  }
  
  // 配置管理
  getConfig(key: string): any
  setConfig(key: string, value: any): void
  
  // 日志系统
  logger: Logger
}
```

### 模块路由系统

```typescript
interface ModuleRoute {
  path: string
  component: React.ComponentType
  title?: string
  icon?: string
  exact?: boolean
  guards?: RouteGuard[]
  meta?: Record<string, any>
}

interface RouteGuard {
  canActivate(route: ModuleRoute, context: RouteContext): boolean | Promise<boolean>
}

interface RouteContext {
  user?: User
  permissions: Permission[]
  moduleStates: Record<string, ModuleStatus>
}
```

## 🗄️ 数据库设计

### 核心表结构

```sql
-- 模块配置表
CREATE TABLE modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  config JSON DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 模块依赖表
CREATE TABLE module_dependencies (
  module_id TEXT NOT NULL,
  dependency_id TEXT NOT NULL,
  version_constraint TEXT,
  PRIMARY KEY (module_id, dependency_id),
  FOREIGN KEY (module_id) REFERENCES modules(id),
  FOREIGN KEY (dependency_id) REFERENCES modules(id)
);

-- 事件历史表
CREATE TABLE event_history (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  source TEXT,
  target TEXT,
  data JSON,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_type (type),
  INDEX idx_event_timestamp (timestamp)
);

-- 用户设置表
CREATE TABLE user_settings (
  key TEXT PRIMARY KEY,
  value JSON NOT NULL,
  module_id TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id)
);
```

### 模块数据表

```sql
-- 笔记表 (Notes Module)
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  content_type TEXT DEFAULT 'markdown',
  tags JSON DEFAULT '[]',
  is_favorite BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  parent_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES notes(id)
);

-- 任务表 (Tasks Module)
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  project_id TEXT,
  parent_id TEXT,
  assignee_id TEXT,
  due_date DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES tasks(id)
);

-- 文件表 (Files Module)
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  path TEXT NOT NULL,
  checksum TEXT NOT NULL,
  thumbnail_path TEXT,
  metadata JSON DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 关联表
CREATE TABLE note_files (
  note_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  PRIMARY KEY (note_id, file_id),
  FOREIGN KEY (note_id) REFERENCES notes(id),
  FOREIGN KEY (file_id) REFERENCES files(id)
);

CREATE TABLE task_notes (
  task_id TEXT NOT NULL,
  note_id TEXT NOT NULL,
  PRIMARY KEY (task_id, note_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (note_id) REFERENCES notes(id)
);
```

## 🚀 性能优化策略

### 1. 模块懒加载

```typescript
// 动态模块加载
const loadModule = async (moduleId: string): Promise<Module> => {
  const moduleFactory = await import(`./modules/${moduleId}/index.js`)
  return moduleFactory.createModule()
}

// 路由级别的代码分割
const NotesPage = React.lazy(() => import('./modules/notes/pages/NotesPage'))
const TasksPage = React.lazy(() => import('./modules/tasks/pages/TasksPage'))
```

### 2. 虚拟化渲染

```typescript
// 大列表虚拟滚动
import { FixedSizeList as List } from 'react-window'

const VirtualizedNoteList: React.FC<{ notes: Note[] }> = ({ notes }) => (
  <List
    height={600}
    itemCount={notes.length}
    itemSize={80}
    itemData={notes}
  >
    {NoteListItem}
  </List>
)
```

### 3. 缓存策略

```typescript
// 查询结果缓存
class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private ttl = 5 * 60 * 1000 // 5分钟

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry || Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }
}
```

## 🔒 安全机制

### 1. 模块沙箱

```typescript
// 插件沙箱执行环境
class PluginSandbox {
  private iframe: HTMLIFrameElement
  private allowedAPIs: string[]

  constructor(allowedAPIs: string[]) {
    this.allowedAPIs = allowedAPIs
    this.iframe = this.createSandboxIframe()
  }

  execute(code: string, context: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const message = { code, context, allowedAPIs: this.allowedAPIs }
      this.iframe.contentWindow?.postMessage(message, '*')
      
      const handler = (event: MessageEvent) => {
        if (event.data.type === 'result') {
          window.removeEventListener('message', handler)
          resolve(event.data.result)
        } else if (event.data.type === 'error') {
          window.removeEventListener('message', handler)
          reject(new Error(event.data.error))
        }
      }
      
      window.addEventListener('message', handler)
    })
  }
}
```

### 2. 权限控制

```typescript
interface Permission {
  resource: string
  action: string
  conditions?: Record<string, any>
}

class PermissionManager {
  checkPermission(moduleId: string, permission: Permission): boolean {
    const modulePermissions = this.getModulePermissions(moduleId)
    return modulePermissions.some(p => 
      p.resource === permission.resource && 
      p.action === permission.action &&
      this.matchConditions(p.conditions, permission.conditions)
    )
  }

  private matchConditions(
    granted?: Record<string, any>, 
    required?: Record<string, any>
  ): boolean {
    if (!required) return true
    if (!granted) return false
    
    return Object.entries(required).every(([key, value]) => 
      granted[key] === value
    )
  }
}
```

---

*这个技术架构为 MingLog 的模块化设计提供了坚实的基础，确保系统的可扩展性、性能和安全性。*
