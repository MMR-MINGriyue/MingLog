# 🚀 快速启动指南

欢迎来到MingLog项目！这个指南将帮助您在5分钟内启动开发环境。

## 📋 前置要求

### 必需软件
- **Node.js** 18+ ([下载](https://nodejs.org/))
- **pnpm** 8+ ([安装指南](https://pnpm.io/installation))
- **Git** ([下载](https://git-scm.com/))

### 推荐工具
- **VS Code** + 推荐扩展
- **Chrome DevTools**
- **Prisma Studio**

---

## ⚡ 5分钟快速启动

### 1️⃣ 克隆项目
```bash
git clone <repository-url>
cd logseq-next
```

### 2️⃣ 安装依赖
```bash
pnpm install
```

### 3️⃣ 初始化数据库
```bash
pnpm db:generate
```

### 4️⃣ 构建包
```bash
pnpm build
```

### 5️⃣ 启动开发服务器
```bash
pnpm dev
```

### 6️⃣ 打开浏览器
访问 [http://localhost:3000](http://localhost:3000)

🎉 **恭喜！您已经成功启动了MingLog！**

---

## 🛠️ 开发环境配置

### VS Code扩展推荐
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "Prisma.prisma",
    "ms-playwright.playwright"
  ]
}
```

### 环境变量配置
创建 `.env.local` 文件：
```env
# 数据库
DATABASE_URL="file:./dev.db"

# 开发模式
NODE_ENV=development
VITE_DEV_MODE=true

# API配置
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 📁 项目结构导览

```
minglog/
├── 📱 apps/
│   └── web/                 # React Web应用
│       ├── src/
│       │   ├── components/  # React组件
│       │   ├── pages/       # 页面组件
│       │   ├── stores/      # Zustand状态管理
│       │   └── styles/      # 样式文件
│       └── public/          # 静态资源
│
├── 📦 packages/
│   ├── core/               # 核心业务逻辑
│   │   ├── src/
│   │   │   ├── types/      # TypeScript类型定义
│   │   │   ├── services/   # 业务服务
│   │   │   └── utils/      # 工具函数
│   │   └── tests/          # 单元测试
│   │
│   ├── database/           # 数据库层
│   │   ├── prisma/         # Prisma配置
│   │   └── src/            # 数据库工具
│   │
│   ├── editor/             # 编辑器组件
│   │   └── src/
│   │       └── components/ # TipTap编辑器组件
│   │
│   └── ui/                 # UI组件库
│       ├── src/
│       │   └── components/ # 可复用UI组件
│       └── stories/        # Storybook故事
│
├── 📚 docs/                # 项目文档
├── 🛠️ scripts/             # 构建脚本
└── 🧪 tests/               # E2E测试
```

---

## 🎯 常用命令

### 开发命令
```bash
# 启动所有服务
pnpm dev

# 只启动Web应用
pnpm web:dev

# 构建所有包
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 格式化代码
pnpm format
```

### 数据库命令
```bash
# 生成Prisma客户端
pnpm db:generate

# 运行数据库迁移
pnpm db:migrate

# 打开Prisma Studio
pnpm db:studio

# 重置数据库
pnpm db:reset
```

### 包管理命令
```bash
# 安装依赖到特定包
pnpm --filter @logseq/core add lodash

# 构建特定包
pnpm --filter @logseq/ui build

# 运行特定包的测试
pnpm --filter @logseq/core test
```

---

## 🧪 第一个功能开发

让我们通过开发一个简单功能来熟悉项目结构：

### 任务：添加"Hello World"页面

#### 1️⃣ 创建页面组件
```typescript
// apps/web/src/pages/HelloPage.tsx
import React from 'react';
import { Button } from '@minglog/ui';

export const HelloPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Hello MingLog!</h1>
      <p className="text-gray-600 mb-4">
        欢迎来到现代化的知识管理工具
      </p>
      <Button variant="primary">
        开始使用
      </Button>
    </div>
  );
};
```

#### 2️⃣ 添加路由
```typescript
// apps/web/src/App.tsx
import { HelloPage } from './pages/HelloPage';

// 在Routes中添加
<Route path="/hello" element={<HelloPage />} />
```

#### 3️⃣ 添加导航链接
```typescript
// apps/web/src/components/Sidebar.tsx
const navigation = [
  // ... 其他导航项
  { name: 'Hello', href: '/hello', icon: HomeIcon },
];
```

#### 4️⃣ 测试功能
```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:3000/hello
```

---

## 🔧 开发工作流

### 功能开发流程
1. **创建分支**: `git checkout -b feature/your-feature`
2. **开发功能**: 编写代码和测试
3. **运行测试**: `pnpm test`
4. **代码检查**: `pnpm lint`
5. **提交代码**: `git commit -m "feat: add your feature"`
6. **推送分支**: `git push origin feature/your-feature`
7. **创建PR**: 在GitHub上创建Pull Request

### 调试技巧
```typescript
// 使用React DevTools
console.log('Debug info:', data);

// 使用Zustand DevTools
const useStore = create(
  devtools((set) => ({
    // store implementation
  }))
);

// 使用Prisma Studio查看数据库
// 运行: pnpm db:studio
```

---

## 📚 学习资源

### 核心技术文档
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [Zustand](https://github.com/pmndrs/zustand)

### 项目特定文档
- [架构设计](./architecture.md)
- [开发指南](./development.md)
- [开发路线图](./roadmap.md)
- [API文档](./api/)

---

## 🆘 常见问题

### Q: 安装依赖失败
```bash
# 清理缓存重新安装
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Q: 数据库连接错误
```bash
# 重新生成Prisma客户端
pnpm db:generate

# 检查数据库文件权限
ls -la packages/database/prisma/
```

### Q: 构建失败
```bash
# 清理构建缓存
pnpm clean
pnpm build
```

### Q: 热更新不工作
```bash
# 重启开发服务器
# Ctrl+C 停止服务器
pnpm dev
```

---

## 🤝 获取帮助

### 内部资源
- 📖 [项目文档](./README.md)
- 🐛 [GitHub Issues](https://github.com/logseq/logseq-next/issues)
- 💬 [团队讨论](https://github.com/logseq/logseq-next/discussions)

### 外部资源
- 🌐 [React社区](https://react.dev/community)
- 📚 [TypeScript手册](https://www.typescriptlang.org/docs/)
- 🎓 [Prisma学习](https://www.prisma.io/learn)

---

## ✅ 下一步

现在您已经成功启动了开发环境，建议您：

1. 📖 **阅读架构文档** - 了解项目整体设计
2. 🧪 **运行测试套件** - 熟悉测试流程
3. 🎨 **查看Storybook** - 了解UI组件库
4. 🔍 **浏览代码** - 熟悉代码结构
5. 🚀 **开始第一个任务** - 参考开发路线图

祝您开发愉快！🎉
