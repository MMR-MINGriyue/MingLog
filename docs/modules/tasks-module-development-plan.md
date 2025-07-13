# 📋 任务管理模块开发计划

**开发周期**: Week 1-2 (Phase 1)  
**优先级**: P1 (重要功能)  
**目标**: 开发完整的GTD任务管理系统，实现与笔记模块的深度集成

## 🎯 功能目标

### 核心功能
- ✅ **GTD工作流**: 收集 → 处理 → 组织 → 回顾 → 执行
- 📊 **看板视图**: 待办、进行中、已完成、已取消
- 📈 **项目管理**: 项目分组、里程碑、进度跟踪
- ⏰ **时间管理**: 截止日期、提醒、时间跟踪
- 🔗 **笔记集成**: 任务与笔记的双向关联

### 高级功能
- 🏷️ **标签系统**: 上下文标签、优先级标签
- 📊 **统计分析**: 完成率、时间分布、效率分析
- 🔄 **重复任务**: 周期性任务自动创建
- 📱 **快速操作**: 快捷键、批量操作

## 🏗️ 技术架构设计

### 数据模型设计

```typescript
// 任务实体
interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: Date
  completedAt?: Date
  estimatedTime?: number // 预估时间(分钟)
  actualTime?: number    // 实际时间(分钟)
  
  // 关联关系
  projectId?: string
  parentTaskId?: string  // 子任务
  linkedNotes: string[]  // 关联笔记
  linkedFiles: string[]  // 关联文件
  
  // 标签和分类
  tags: string[]
  contexts: string[]     // GTD上下文 (@home, @office, @calls)
  
  // 重复任务
  recurrence?: TaskRecurrence
  
  // 元数据
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

// 任务状态
enum TaskStatus {
  INBOX = 'inbox',           // 收集箱
  TODO = 'todo',             // 待办
  IN_PROGRESS = 'in-progress', // 进行中
  WAITING = 'waiting',       // 等待
  SOMEDAY = 'someday',       // 将来/也许
  DONE = 'done',             // 已完成
  CANCELLED = 'cancelled'    // 已取消
}

// 优先级
enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  URGENT = 'urgent'
}

// 项目实体
interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  color?: string
  
  // 时间管理
  startDate?: Date
  dueDate?: Date
  completedAt?: Date
  
  // 关联关系
  tasks: Task[]
  linkedNotes: string[]
  
  // 统计信息
  progress: number // 0-100
  totalTasks: number
  completedTasks: number
  
  // 元数据
  createdAt: Date
  updatedAt: Date
}

// 项目状态
enum ProjectStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on-hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// 重复任务配置
interface TaskRecurrence {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number // 间隔
  daysOfWeek?: number[] // 周几 (0=周日)
  dayOfMonth?: number   // 月的第几天
  endDate?: Date        // 结束日期
  maxOccurrences?: number // 最大重复次数
}
```

### 数据库Schema设计

```sql
-- 任务表
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'inbox',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TEXT,
  completed_at TEXT,
  estimated_time INTEGER,
  actual_time INTEGER,
  
  project_id TEXT,
  parent_task_id TEXT,
  linked_notes TEXT DEFAULT '[]', -- JSON数组
  linked_files TEXT DEFAULT '[]', -- JSON数组
  
  tags TEXT DEFAULT '[]',         -- JSON数组
  contexts TEXT DEFAULT '[]',     -- JSON数组
  
  recurrence TEXT,                -- JSON对象
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 项目表
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  color TEXT,
  
  start_date TEXT,
  due_date TEXT,
  completed_at TEXT,
  
  linked_notes TEXT DEFAULT '[]', -- JSON数组
  
  progress INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 任务时间记录表
CREATE TABLE task_time_entries (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration INTEGER, -- 秒
  description TEXT,
  created_at TEXT NOT NULL,
  
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_projects_status ON projects(status);
```

### 模块架构设计

```
packages/modules/tasks/
├── src/
│   ├── TasksModule.ts           # 主模块类
│   ├── services/
│   │   ├── TasksService.ts      # 任务业务逻辑
│   │   ├── ProjectsService.ts   # 项目业务逻辑
│   │   ├── TimeTrackingService.ts # 时间跟踪
│   │   └── GTDService.ts        # GTD工作流
│   ├── components/
│   │   ├── TaskList.tsx         # 任务列表
│   │   ├── TaskCard.tsx         # 任务卡片
│   │   ├── KanbanBoard.tsx      # 看板视图
│   │   ├── ProjectView.tsx      # 项目视图
│   │   ├── TaskForm.tsx         # 任务表单
│   │   └── TimeTracker.tsx      # 时间跟踪器
│   ├── hooks/
│   │   ├── useTasks.ts          # 任务数据管理
│   │   ├── useProjects.ts       # 项目数据管理
│   │   ├── useTimeTracking.ts   # 时间跟踪
│   │   └── useGTDWorkflow.ts    # GTD工作流
│   ├── types/
│   │   ├── task.ts              # 任务类型定义
│   │   ├── project.ts           # 项目类型定义
│   │   └── index.ts             # 类型导出
│   ├── utils/
│   │   ├── gtd.ts               # GTD工具函数
│   │   ├── timeUtils.ts         # 时间工具
│   │   └── taskFilters.ts       # 任务过滤器
│   └── index.ts                 # 模块导出
├── package.json
└── tsconfig.json
```

## 🔄 与笔记模块集成设计

### 双向关联机制

```typescript
// 从笔记创建任务
interface NoteToTaskConverter {
  extractTasksFromNote(noteId: string): Promise<Task[]>
  createTaskFromSelection(noteId: string, selection: string): Promise<Task>
  linkTaskToNote(taskId: string, noteId: string): Promise<void>
}

// 从任务创建笔记
interface TaskToNoteConverter {
  createNoteFromTask(taskId: string): Promise<string> // 返回noteId
  generateTaskReport(projectId: string): Promise<string> // 生成项目报告
  createMeetingNotes(taskIds: string[]): Promise<string> // 会议纪要
}

// 跨模块事件
interface TaskModuleEvents {
  'task:created': { task: Task, linkedNoteId?: string }
  'task:completed': { task: Task, completionNotes?: string }
  'task:linked-to-note': { taskId: string, noteId: string }
  'project:milestone-reached': { project: Project, milestone: string }
}
```

### 统一搜索集成

```typescript
// 任务搜索提供者
class TaskSearchProvider implements SearchProvider {
  async search(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    // 搜索任务标题、描述、标签
    // 支持高级查询: status:todo priority:high @home
    // 返回统一的搜索结果格式
  }
  
  async getRelatedContent(taskId: string): Promise<RelatedContent[]> {
    // 获取相关的笔记、文件、其他任务
  }
}
```

## 📱 用户界面设计

### 主要视图

1. **收集箱视图** - 快速捕获想法和任务
2. **看板视图** - 可视化任务流程
3. **列表视图** - 传统任务列表，支持排序和过滤
4. **项目视图** - 项目管理和进度跟踪
5. **日历视图** - 基于时间的任务规划
6. **统计视图** - 效率分析和报告

### 快捷操作

- `Ctrl+Shift+T` - 快速创建任务
- `Ctrl+Shift+P` - 快速创建项目
- `Space` - 快速标记完成
- `E` - 快速编辑
- `D` - 设置截止日期
- `P` - 设置优先级

## 🧪 测试策略

### 单元测试
- [ ] TasksService 业务逻辑测试
- [ ] GTDService 工作流测试
- [ ] 数据模型验证测试
- [ ] 工具函数测试

### 集成测试
- [ ] 与笔记模块的集成测试
- [ ] 数据库操作测试
- [ ] 事件通信测试
- [ ] 搜索集成测试

### E2E测试
- [ ] 完整的GTD工作流测试
- [ ] 任务创建到完成的完整流程
- [ ] 跨模块操作测试
- [ ] 性能测试 (大量任务处理)

## 📈 开发里程碑

### Week 1: 核心功能开发
- [ ] Day 1-2: 数据模型和数据库设计
- [ ] Day 3-4: TasksService 和 ProjectsService 开发
- [ ] Day 5-7: 基础UI组件开发 (TaskList, TaskCard, TaskForm)

### Week 2: 高级功能和集成
- [ ] Day 8-9: GTD工作流实现
- [ ] Day 10-11: 看板视图和项目管理
- [ ] Day 12-13: 与笔记模块集成
- [ ] Day 14: 测试和优化

## 🎯 成功指标

- [ ] 支持完整的GTD工作流程
- [ ] 与笔记模块无缝集成
- [ ] 看板视图流畅操作
- [ ] 搜索响应时间 < 200ms
- [ ] 支持1000+任务的性能表现
- [ ] 测试覆盖率 > 90%

---

**下一步**: 开始数据模型设计和数据库schema实现，建立任务管理模块的基础架构。
