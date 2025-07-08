# 笔记模块集成指南

## 📋 概述

本文档详细介绍了如何将现有的笔记功能重构为模块化架构，以及如何在Tauri桌面应用中集成和使用新的模块化笔记系统。

## 🏗️ 重构架构

### 原有架构 vs 模块化架构

#### 原有架构（紧耦合）
```
Tauri Desktop App
├── src/pages/HomePage.tsx
├── src/pages/EditorPage.tsx
├── src/components/NotesList.tsx
├── src/hooks/useNotes.ts
└── src-tauri/src/notes.rs
```

#### 新模块化架构（松耦合）
```
MingLog Modular System
├── packages/core/                    # 核心架构
├── packages/modules/notes/           # 笔记模块
│   ├── src/NotesModule.ts           # 模块定义
│   ├── src/components/              # 模块组件
│   ├── src/services/                # 业务逻辑
│   ├── src/hooks/                   # React Hooks
│   └── src/adapters/                # Tauri适配器
└── apps/tauri-desktop/              # 桌面应用
    ├── src/core/AppCore.ts          # 应用核心
    ├── src/contexts/CoreContext.tsx # React上下文
    └── src/router/ModularRouter.tsx # 模块化路由
```

## 🔧 核心组件

### 1. AppCore - 应用核心初始化

负责初始化模块化架构并注册模块：

```typescript
// apps/tauri-desktop/src/core/AppCore.ts
export class AppCore {
  async initialize(): Promise<void> {
    // 创建数据库连接
    const databaseConnection = new TauriDatabaseConnection()
    
    // 初始化核心系统
    this.mingLogCore = new MingLogCore({
      database: databaseConnection,
      debugMode: process.env.NODE_ENV === 'development'
    })
    
    await this.mingLogCore.initialize()
    
    // 注册和激活模块
    await this.registerModules()
  }
}
```

### 2. TauriDatabaseConnection - 数据库适配器

连接模块化架构与Tauri后端：

```typescript
class TauriDatabaseConnection implements DatabaseConnection {
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke('execute_sql', { sql, params: params || [] })
  }
}
```

### 3. TauriNotesAdapter - 笔记API适配器

将模块化的笔记服务与Tauri后端API连接：

```typescript
export class TauriNotesAdapter {
  async createNote(request: CreateNoteRequest): Promise<Note> {
    const result = await invoke('create_note', { request })
    
    // 发送创建事件
    this.coreAPI.events.emit('data:created', {
      type: 'note',
      id: result.id,
      data: result
    }, 'notes')
    
    return result
  }
}
```

## 🎨 UI组件重构

### 1. NotesListPage - 笔记列表页面

完全重构的笔记列表组件，支持：
- 响应式网格/列表布局
- 实时搜索和过滤
- 笔记操作（收藏、归档、删除）
- 状态管理和错误处理

```typescript
export const NotesListPage: React.FC = () => {
  const { notes, loading, error, deleteNote, updateNote } = useNotesService()
  
  // 组件实现...
}
```

### 2. NoteEditorPage - 笔记编辑器

功能完整的笔记编辑器，包含：
- 标题和内容编辑
- 标签管理
- 自动保存
- 键盘快捷键支持

### 3. NoteViewPage - 笔记查看器

只读的笔记查看界面，提供：
- 格式化内容显示
- 快速操作按钮
- 导出和分享功能

## 🔌 Hook系统

### useNotesService Hook

连接React组件与模块化服务：

```typescript
export const useNotesService = (): UseNotesServiceReturn => {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // CRUD操作
  const createNote = useCallback(async (request: CreateNoteRequest) => {
    const result = await withErrorHandling(
      () => invoke('create_note', { request }),
      'Failed to create note'
    )
    
    if (result) {
      setNotes(prev => [result, ...prev])
    }
    
    return result
  }, [])

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    // ... 其他方法
  }
}
```

## 🚦 路由系统

### ModularRouter - 动态路由

自动加载激活模块的路由：

```typescript
export const ModularRouter: React.FC = () => {
  const core = useCoreInstance()

  const moduleRoutes = useMemo(() => {
    const routes: ModuleRoute[] = []
    const activeModules = core.getModuleManager().getActiveModules()

    for (const module of activeModules) {
      if (module.getRoutes) {
        routes.push(...module.getRoutes())
      }
    }

    return routes
  }, [core])

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/notes" replace />} />
      {moduleRoutes.map(route => (
        <Route key={route.path} path={route.path} element={<route.component />} />
      ))}
    </Routes>
  )
}
```

## 🧭 导航系统

### ModularNavigation - 动态导航

根据激活的模块生成导航菜单：

```typescript
export const ModularNavigation: React.FC = () => {
  const core = useCoreInstance()

  const navigationItems = useMemo(() => {
    const items: NavigationItem[] = []
    const activeModules = core.getModuleManager().getActiveModules()

    for (const module of activeModules) {
      if (module.getMenuItems) {
        const menuItems = module.getMenuItems()
        items.push(...menuItems.map(item => ({
          id: item.id,
          label: item.label,
          path: item.path,
          icon: getIconComponent(item.icon),
          order: item.order || 500
        })))
      }
    }

    return items.sort((a, b) => a.order - b.order)
  }, [core])

  // 渲染导航项...
}
```

## 📱 React Context集成

### CoreProvider - 核心上下文

为React应用提供模块化架构访问：

```typescript
export const CoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [core, setCore] = useState<MingLogCore | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeCore = async () => {
      await appCore.initialize()
      setCore(appCore.getCore())
      setInitialized(true)
      setLoading(false)
    }

    initializeCore()
  }, [])

  return (
    <CoreContext.Provider value={{ core, initialized, loading }}>
      {children}
    </CoreContext.Provider>
  )
}
```

## 🔄 数据流

### 完整的数据流程

1. **用户操作** → React组件
2. **组件调用** → useNotesService Hook
3. **Hook调用** → TauriNotesAdapter
4. **适配器调用** → Tauri后端API
5. **后端处理** → 数据库操作
6. **结果返回** → 适配器 → Hook → 组件
7. **事件发送** → EventBus → 其他模块

### 事件驱动更新

```typescript
// 创建笔记时的事件流
await notesAdapter.createNote(request)
  ↓
eventBus.emit('data:created', { type: 'note', data: note })
  ↓
其他模块监听事件并更新状态
```

## 🛠️ 开发工作流

### 1. 启动开发环境

```bash
# 安装依赖
pnpm install

# 构建核心包
pnpm core:build

# 构建模块
pnpm modules:build

# 启动桌面应用
pnpm desktop:dev
```

### 2. 模块开发

```bash
# 创建新模块
mkdir packages/modules/my-module
cd packages/modules/my-module

# 实现模块接口
# - src/MyModule.ts
# - src/components/
# - src/services/
# - src/types/

# 注册模块
// 在 AppCore.ts 中注册新模块
await this.mingLogCore.registerModule('my-module', MyModuleFactory, config)
```

### 3. 调试和测试

```bash
# 运行测试
pnpm test

# 启用调试模式
NODE_ENV=development pnpm desktop:dev

# 查看模块状态
// 在浏览器控制台
appCore.getModuleManager().getActiveModules()
```

## 🔧 配置和自定义

### 模块配置

```typescript
// 模块设置定义
getSettings(): SettingItem[] {
  return [
    {
      key: 'notes.autoSave',
      label: '自动保存',
      type: 'boolean',
      defaultValue: true,
      category: '编辑器'
    }
  ]
}
```

### 主题和样式

```typescript
// 支持暗色主题
className={clsx(
  'bg-white dark:bg-gray-800',
  'text-gray-900 dark:text-white'
)}
```

## 🚀 部署和构建

### 构建流程

```bash
# 构建所有包
pnpm build

# 构建桌面应用
pnpm desktop:build

# 生成安装包
cd apps/tauri-desktop
pnpm tauri build
```

### 生产优化

- 代码分割和懒加载
- 模块按需加载
- 资源压缩和优化
- 错误边界和恢复

## 🔮 未来扩展

### 计划功能

1. **热插拔模块**：运行时动态加载/卸载模块
2. **模块市场**：第三方模块安装和管理
3. **跨平台同步**：Web和移动端模块共享
4. **性能监控**：模块性能分析和优化

### 开发指南

- [模块开发指南](./module-development-guide.md)
- [API参考文档](./api-reference.md)
- [最佳实践](./best-practices.md)

---

这个重构为MingLog提供了强大的模块化能力，使得功能开发更加灵活和可维护。用户可以根据需求选择启用的模块，开发者可以独立开发和测试各个功能模块。
