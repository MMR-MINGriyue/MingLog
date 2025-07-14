# 📊 MingLog 数据库模块

MingLog的数据库模块，提供类似Notion的结构化数据管理功能，包括多视图支持、数据关联和强大的查询系统。

## ✨ 功能特性

### 🎯 核心功能
- **数据库管理**: 创建、编辑、删除数据库
- **多视图支持**: 表格、看板、日历、画廊视图
- **字段类型**: 文本、数字、日期、选择、关联、公式等
- **数据关联**: 一对一、一对多、多对多关系
- **查询引擎**: 复杂筛选、排序、聚合操作

### 🔗 集成功能
- **跨模块关联**: 与笔记、任务、文件的双向链接
- **统一搜索**: 数据库内容的全文搜索
- **事件通信**: 与其他模块的事件交互
- **权限管理**: 细粒度的访问控制

### 📊 高级功能
- **公式系统**: 类似Excel的计算功能
- **模板支持**: 预设数据库模板
- **导入导出**: 多格式数据导入导出
- **版本控制**: 数据变更历史追踪

## 🏗️ 架构设计

### 核心组件

```
DatabaseModule/
├── src/
│   ├── DatabaseModule.ts          # 模块主类
│   ├── types/                     # 类型定义
│   │   ├── database.ts           # 数据库类型
│   │   ├── field.ts              # 字段类型
│   │   ├── view.ts               # 视图类型
│   │   ├── query.ts              # 查询类型
│   │   └── index.ts              # 类型导出
│   ├── services/                  # 业务逻辑
│   │   ├── DatabaseService.ts    # 数据库服务
│   │   ├── FieldService.ts       # 字段服务
│   │   ├── ViewService.ts        # 视图服务
│   │   ├── QueryEngine.ts        # 查询引擎
│   │   ├── RelationService.ts    # 关联服务
│   │   └── FormulaEngine.ts      # 公式引擎
│   ├── components/                # React组件
│   │   ├── DatabaseView.tsx      # 数据库主视图
│   │   ├── TableView.tsx         # 表格视图
│   │   ├── KanbanView.tsx        # 看板视图
│   │   ├── CalendarView.tsx      # 日历视图
│   │   ├── GalleryView.tsx       # 画廊视图
│   │   ├── FieldEditor.tsx       # 字段编辑器
│   │   ├── RecordEditor.tsx      # 记录编辑器
│   │   └── QueryBuilder.tsx      # 查询构建器
│   ├── hooks/                     # React Hooks
│   │   ├── useDatabase.ts        # 数据库Hook
│   │   ├── useQuery.ts           # 查询Hook
│   │   ├── useView.ts            # 视图Hook
│   │   └── useRelation.ts        # 关联Hook
│   ├── utils/                     # 工具函数
│   │   ├── validation.ts         # 数据验证
│   │   ├── formatting.ts         # 数据格式化
│   │   ├── export.ts             # 导出工具
│   │   └── import.ts             # 导入工具
│   └── index.ts                   # 模块导出
├── tests/                         # 测试文件
├── docs/                          # 文档
└── package.json
```

### 数据模型

#### 数据库结构
```typescript
interface Database {
  id: string
  name: string
  description?: string
  icon?: string
  fields: Field[]
  views: View[]
  records: Record[]
  relations: Relation[]
  permissions: Permission[]
  createdAt: Date
  updatedAt: Date
}
```

#### 字段类型
```typescript
interface Field {
  id: string
  name: string
  type: FieldType
  config: FieldConfig
  required: boolean
  unique: boolean
  indexed: boolean
}

enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  CHECKBOX = 'checkbox',
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone',
  RELATION = 'relation',
  FORMULA = 'formula',
  ROLLUP = 'rollup',
  CREATED_TIME = 'created_time',
  LAST_EDITED_TIME = 'last_edited_time',
  CREATED_BY = 'created_by',
  LAST_EDITED_BY = 'last_edited_by'
}
```

#### 视图系统
```typescript
interface View {
  id: string
  name: string
  type: ViewType
  config: ViewConfig
  filters: Filter[]
  sorts: Sort[]
  groups: Group[]
}

enum ViewType {
  TABLE = 'table',
  KANBAN = 'kanban',
  CALENDAR = 'calendar',
  GALLERY = 'gallery',
  LIST = 'list'
}
```

## 🚀 快速开始

### 基础使用

```typescript
import { DatabaseModule } from '@minglog/database'

// 创建数据库模块实例
const databaseModule = new DatabaseModule({
  id: 'database',
  name: '数据库管理',
  version: '1.0.0'
})

// 初始化模块
await databaseModule.initialize(coreAPI)
await databaseModule.activate()
```

### 创建数据库

```typescript
const database = await databaseService.createDatabase({
  name: '项目管理',
  description: '项目跟踪和管理数据库',
  fields: [
    {
      name: '项目名称',
      type: FieldType.TEXT,
      required: true
    },
    {
      name: '状态',
      type: FieldType.SELECT,
      config: {
        options: ['进行中', '已完成', '已暂停']
      }
    },
    {
      name: '截止日期',
      type: FieldType.DATE
    }
  ]
})
```

### 查询数据

```typescript
const records = await queryEngine.query({
  database: database.id,
  filters: [
    {
      field: '状态',
      operator: 'equals',
      value: '进行中'
    }
  ],
  sorts: [
    {
      field: '截止日期',
      direction: 'asc'
    }
  ],
  limit: 50
})
```

## 📋 开发计划

### Phase 1: 基础架构 (2周)
- [x] 模块架构设计
- [ ] 基础类型定义
- [ ] 数据库服务实现
- [ ] 字段系统实现

### Phase 2: 视图系统 (3周)
- [ ] 表格视图组件
- [ ] 看板视图组件
- [ ] 日历视图组件
- [ ] 视图切换和配置

### Phase 3: 查询引擎 (2周)
- [ ] 查询构建器
- [ ] 筛选和排序
- [ ] 聚合操作
- [ ] 性能优化

### Phase 4: 高级功能 (3周)
- [ ] 关联系统
- [ ] 公式引擎
- [ ] 导入导出
- [ ] 权限管理

## 🧪 测试

```bash
# 运行测试
npm test

# 运行测试覆盖率
npm run test:coverage

# 运行性能测试
npm run test:performance
```

## 📚 文档

- [API文档](./docs/api.md)
- [组件文档](./docs/components.md)
- [开发指南](./docs/development.md)
- [最佳实践](./docs/best-practices.md)

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

---

**维护者**: MingLog 开发团队  
**最后更新**: 2025-07-13  
**版本**: 1.0.0
