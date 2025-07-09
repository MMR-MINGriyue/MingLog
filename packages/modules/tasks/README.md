# 📋 MingLog 任务管理模块

MingLog的任务管理模块，提供完整的GTD工作流、项目管理、时间跟踪和看板视图功能。

## ✨ 功能特性

### 🎯 核心功能
- **GTD工作流**: 收集 → 处理 → 组织 → 回顾 → 执行
- **任务管理**: 创建、编辑、删除、状态管理
- **项目管理**: 项目分组、里程碑、进度跟踪
- **时间跟踪**: 时间记录、统计分析
- **看板视图**: 可视化任务流程管理

### 🔗 集成功能
- **笔记关联**: 任务与笔记的双向链接
- **文件关联**: 任务与文件的关联管理
- **统一搜索**: 跨模块搜索和引用
- **事件通信**: 与其他模块的事件交互

### 📊 高级功能
- **智能建议**: 基于内容的上下文和优先级建议
- **重复任务**: 周期性任务自动创建
- **通知提醒**: 到期提醒、过期通知
- **导入导出**: 多格式数据导入导出

## 🏗️ 架构设计

```
packages/modules/tasks/
├── src/
│   ├── TasksModule.ts           # 主模块类
│   ├── services/                # 服务层
│   │   ├── TasksService.ts      # 任务业务逻辑
│   │   ├── ProjectsService.ts   # 项目管理
│   │   ├── GTDService.ts        # GTD工作流
│   │   └── index.ts             # 服务导出
│   ├── types/                   # 类型定义
│   │   ├── task.ts              # 任务相关类型
│   │   ├── project.ts           # 项目相关类型
│   │   └── index.ts             # 类型导出
│   ├── components/              # React组件 (待实现)
│   ├── hooks/                   # React Hooks (待实现)
│   ├── utils/                   # 工具函数 (待实现)
│   └── index.ts                 # 模块主入口
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 快速开始

### 安装依赖

```bash
cd packages/modules/tasks
npm install
```

### 构建模块

```bash
npm run build
```

### 运行测试

```bash
npm test
```

## 📖 使用指南

### 1. 模块注册

```typescript
import { TasksModuleFactory, TASKS_MODULE_METADATA } from '@minglog/tasks'

// 注册任务管理模块
await core.registerModule('tasks', TasksModuleFactory, {
  ...TASKS_MODULE_METADATA,
  enabled: true,
  settings: {
    enableTimeTracking: true,
    enableNotifications: true,
    gtdEnabled: true
  }
})

// 激活模块
await core.activateModule('tasks')
```

### 2. 使用服务

```typescript
// 获取模块实例
const tasksModule = core.getModule('tasks')
const tasksService = tasksModule.getTasksService()
const projectsService = tasksModule.getProjectsService()
const gtdService = tasksModule.getGTDService()

// 创建任务
const task = await tasksService.createTask({
  title: '完成项目文档',
  description: '编写项目的技术文档和用户手册',
  priority: TaskPriority.HIGH,
  dueDate: new Date('2025-01-15'),
  tags: ['文档', '项目'],
  contexts: ['@电脑']
})

// 创建项目
const project = await projectsService.createProject({
  name: 'MingLog v2.0',
  description: '开发MingLog的下一个主要版本',
  startDate: new Date(),
  dueDate: new Date('2025-06-01')
})

// GTD工作流
await gtdService.collect('学习新的编程语言')
const inboxTasks = await gtdService.getInboxTasks()
const processResult = await gtdService.process(inboxTasks[0].id)
await gtdService.organize(inboxTasks[0].id, {
  action: 'defer',
  dueDate: new Date('2025-02-01'),
  context: '@学习'
})
```

### 3. 事件处理

```typescript
// 监听任务事件
core.events.on('task:created', (event) => {
  console.log('新任务创建:', event.data.task)
})

core.events.on('task:completed', (event) => {
  console.log('任务完成:', event.data.task)
  // 可以触发通知、更新统计等
})

core.events.on('project:milestone-reached', (event) => {
  console.log('项目里程碑达成:', event.data)
})
```

## 🎯 GTD工作流

### 收集 (Collect)
```typescript
// 快速收集想法到收集箱
await gtdService.collect('准备下周的会议材料')
await gtdService.collect('购买生日礼物')
await gtdService.collect('学习React新特性')
```

### 处理 (Process)
```typescript
// 处理收集箱中的项目
const inboxTasks = await gtdService.getInboxTasks()
for (const task of inboxTasks) {
  const result = await gtdService.process(task.id)
  console.log('处理结果:', result)
  // { isActionable: true, isProject: false, estimatedTime: 30, suggestedContext: '@电脑' }
}
```

### 组织 (Organize)
```typescript
// 根据处理结果组织任务
await gtdService.organize(taskId, {
  action: 'do',           // 立即执行
  context: '@电脑'
})

await gtdService.organize(taskId, {
  action: 'defer',        // 延期处理
  dueDate: new Date('2025-01-20'),
  context: '@外出'
})

await gtdService.organize(taskId, {
  action: 'delegate',     // 委派他人
  delegateTo: '张三',
  context: '@等待'
})
```

### 回顾 (Review)
```typescript
// 每周回顾
const weeklyReview = await gtdService.weeklyReview()
console.log('回顾结果:', weeklyReview)
// {
//   inboxCount: 5,
//   overdueCount: 2,
//   todayCount: 8,
//   weekCount: 15,
//   somedayCount: 23,
//   recommendations: ['收集箱有5个未处理项目，建议及时处理']
// }
```

### 执行 (Engage)
```typescript
// 获取下一步行动
const nextActions = await gtdService.getNextActions()
const homeActions = await gtdService.getNextActionsByContext('@家里')
const officeActions = await gtdService.getNextActionsByContext('@办公室')
```

## 📊 数据模型

### 任务 (Task)
```typescript
interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus          // inbox, todo, in-progress, waiting, someday, done, cancelled
  priority: TaskPriority      // low, medium, high, urgent
  dueDate?: Date
  estimatedTime?: number      // 预估时间(分钟)
  actualTime?: number         // 实际时间(分钟)
  projectId?: string          // 所属项目
  parentTaskId?: string       // 父任务(子任务)
  linkedNotes: string[]       // 关联笔记
  linkedFiles: string[]       // 关联文件
  tags: string[]              // 标签
  contexts: string[]          // GTD上下文
  recurrence?: TaskRecurrence // 重复设置
  createdAt: Date
  updatedAt: Date
}
```

### 项目 (Project)
```typescript
interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus       // active, on-hold, completed, cancelled
  color?: string
  startDate?: Date
  dueDate?: Date
  tasks: Task[]
  linkedNotes: string[]
  linkedFiles: string[]
  progress: number            // 0-100
  totalTasks: number
  completedTasks: number
  createdAt: Date
  updatedAt: Date
}
```

## 🔧 配置选项

```typescript
const config = {
  enabled: true,
  settings: {
    defaultTaskStatus: 'todo',
    defaultTaskPriority: 'medium',
    enableTimeTracking: true,
    enableNotifications: true,
    gtdEnabled: true,
    kanbanEnabled: true,
    autoArchiveCompletedTasks: false,
    autoArchiveDays: 30,
    reminderSettings: {
      dueSoonDays: 3,
      overdueNotifications: true,
      dailyReviewTime: '09:00',
      weeklyReviewDay: 'sunday'
    }
  },
  preferences: {
    defaultView: 'list',        // 'list' | 'kanban' | 'calendar'
    taskSortBy: 'dueDate',
    taskSortDirection: 'asc',
    showCompletedTasks: false,
    compactView: false,
    enableKeyboardShortcuts: true
  }
}
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

## 📝 开发计划

### Phase 1: 核心功能 (已完成)
- [x] 基础数据模型设计
- [x] 任务CRUD操作
- [x] 项目管理功能
- [x] GTD工作流实现
- [x] 数据库集成

### Phase 2: UI组件 (进行中)
- [ ] 任务列表组件
- [ ] 任务表单组件
- [ ] 看板视图组件
- [ ] 项目视图组件
- [ ] GTD工作流界面

### Phase 3: 高级功能 (计划中)
- [ ] 时间跟踪功能
- [ ] 通知提醒系统
- [ ] 导入导出功能
- [ ] 任务模板系统
- [ ] 高级搜索和过滤

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](../../../LICENSE) 文件

## 🔗 相关链接

- [MingLog 主项目](../../../README.md)
- [模块开发指南](../../../docs/module-development.md)
- [API 文档](./docs/api.md)
- [更新日志](./CHANGELOG.md)
