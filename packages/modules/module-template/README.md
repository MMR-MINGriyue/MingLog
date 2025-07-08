# MingLog 模块开发模板

这是 MingLog 模块的标准开发模板，提供了统一的目录结构、接口定义和开发规范。

## 📁 目录结构

```
module-template/
├── package.json              # 模块包配置
├── tsconfig.json             # TypeScript 配置
├── README.md                 # 模块文档
├── CHANGELOG.md              # 变更日志
├── src/                      # 源代码目录
│   ├── index.ts              # 模块主入口
│   ├── ModuleTemplate.ts     # 模块主类
│   ├── types/                # 类型定义
│   │   ├── index.ts          # 类型导出
│   │   ├── module.ts         # 模块相关类型
│   │   ├── api.ts            # API 接口类型
│   │   └── events.ts         # 事件类型
│   ├── services/             # 业务逻辑服务
│   │   ├── index.ts          # 服务导出
│   │   ├── ModuleService.ts  # 主要业务服务
│   │   └── ApiService.ts     # API 服务
│   ├── components/           # React 组件
│   │   ├── index.ts          # 组件导出
│   │   ├── pages/            # 页面组件
│   │   ├── widgets/          # 小部件组件
│   │   └── common/           # 通用组件
│   ├── hooks/                # React Hooks
│   │   ├── index.ts          # Hooks 导出
│   │   ├── useModuleData.ts  # 数据管理 Hook
│   │   └── useModuleState.ts # 状态管理 Hook
│   ├── stores/               # 状态管理
│   │   ├── index.ts          # Store 导出
│   │   └── moduleStore.ts    # 模块状态
│   ├── adapters/             # 平台适配器
│   │   ├── index.ts          # 适配器导出
│   │   ├── TauriAdapter.ts   # Tauri 平台适配
│   │   └── WebAdapter.ts     # Web 平台适配
│   ├── routes/               # 路由配置
│   │   ├── index.ts          # 路由导出
│   │   └── moduleRoutes.ts   # 模块路由
│   ├── utils/                # 工具函数
│   │   ├── index.ts          # 工具导出
│   │   ├── helpers.ts        # 辅助函数
│   │   └── validators.ts     # 验证函数
│   ├── constants/            # 常量定义
│   │   ├── index.ts          # 常量导出
│   │   ├── config.ts         # 配置常量
│   │   └── events.ts         # 事件常量
│   └── assets/               # 静态资源
│       ├── icons/            # 图标
│       ├── images/           # 图片
│       └── styles/           # 样式文件
├── tests/                    # 测试文件
│   ├── unit/                 # 单元测试
│   ├── integration/          # 集成测试
│   └── __mocks__/            # 模拟数据
├── docs/                     # 文档
│   ├── api.md                # API 文档
│   ├── usage.md              # 使用指南
│   └── development.md        # 开发指南
└── examples/                 # 示例代码
    ├── basic-usage.tsx       # 基础使用示例
    └── advanced-usage.tsx    # 高级使用示例
```

## 🔧 开发规范

### 1. 模块接口规范

每个模块必须实现 `IModule` 接口：

```typescript
interface IModule {
  id: string                    // 模块唯一标识
  name: string                  // 模块显示名称
  version: string               // 模块版本
  description: string           // 模块描述
  icon?: string                 // 模块图标
  dependencies?: string[]       // 依赖的其他模块
  
  // 生命周期方法
  initialize(): Promise<void>   // 初始化
  activate(): Promise<void>     // 激活
  deactivate(): Promise<void>   // 停用
  destroy(): Promise<void>      // 销毁
  
  // 配置管理
  getConfig(): ModuleConfig     // 获取配置
  setConfig(config: Partial<ModuleConfig>): void  // 设置配置
  
  // 路由注册
  getRoutes(): RouteConfig[]    // 获取路由配置
  
  // 菜单注册
  getMenuItems(): MenuItem[]    // 获取菜单项
  
  // 事件处理
  onEvent(event: ModuleEvent): void  // 处理事件
}
```

### 2. 命名规范

- **文件命名**: 使用 PascalCase (如 `ModuleService.ts`)
- **组件命名**: 使用 PascalCase (如 `NoteEditor`)
- **Hook命名**: 使用 camelCase，以 `use` 开头 (如 `useModuleData`)
- **常量命名**: 使用 UPPER_SNAKE_CASE (如 `MODULE_EVENTS`)
- **类型命名**: 使用 PascalCase，接口以 `I` 开头 (如 `IModuleConfig`)

### 3. 导出规范

每个目录都应该有 `index.ts` 文件统一导出：

```typescript
// src/index.ts - 模块主入口
export { default as ModuleTemplate } from './ModuleTemplate'
export * from './types'
export * from './services'
export * from './components'
export * from './hooks'
export * from './utils'
export * from './constants'
```

### 4. 类型定义规范

- 所有公共接口都要有完整的 TypeScript 类型定义
- 使用 JSDoc 注释描述复杂类型
- 导出所有需要被外部使用的类型

### 5. 错误处理规范

- 使用统一的错误类型和错误码
- 所有异步操作都要有错误处理
- 提供有意义的错误信息

### 6. 测试规范

- 单元测试覆盖率 > 80%
- 关键业务逻辑必须有测试
- 使用 Jest + React Testing Library

### 7. 文档规范

- README.md 包含模块介绍、安装、使用方法
- API 文档要完整描述所有公共接口
- 提供使用示例

## 🚀 快速开始

### 1. 创建新模块

```bash
# 复制模板
cp -r packages/modules/module-template packages/modules/your-module

# 修改模块信息
cd packages/modules/your-module
# 编辑 package.json, README.md 等文件
```

### 2. 开发流程

1. **设计阶段**: 定义模块功能、接口、数据结构
2. **实现阶段**: 按照目录结构实现各个部分
3. **测试阶段**: 编写单元测试和集成测试
4. **文档阶段**: 完善 API 文档和使用指南
5. **集成阶段**: 在主应用中集成和测试

### 3. 开发工具

- `npm run dev`: 开发模式
- `npm run build`: 构建模块
- `npm run test`: 运行测试
- `npm run lint`: 代码检查
- `npm run docs`: 生成文档

## 📋 检查清单

在提交模块之前，请确保：

- [ ] 实现了 `IModule` 接口
- [ ] 所有公共 API 都有 TypeScript 类型定义
- [ ] 单元测试覆盖率 > 80%
- [ ] 通过了 ESLint 检查
- [ ] 完善了 README.md 和 API 文档
- [ ] 提供了使用示例
- [ ] 在主应用中测试通过

## 🔗 相关资源

- [模块管理器文档](../core/README.md)
- [开发指南](../../docs/developer-guide.md)
- [API 参考](../../docs/api-reference.md)
- [最佳实践](../../docs/best-practices.md)
