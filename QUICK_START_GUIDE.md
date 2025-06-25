# MingLog 快速启动指南

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- pnpm 8+
- Git

### 1. 克隆项目
```bash
git clone https://github.com/MMR-MINGriyue/MingLog.git
cd MingLog
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 初始化数据库
```bash
pnpm db:generate
pnpm db:migrate
```

### 4. 启动开发服务器
```bash
# 启动后端 API (端口 3001)
pnpm api:dev

# 启动前端应用 (端口 3000)
pnpm web:dev

# 或者同时启动前后端
pnpm dev:full
```

### 5. 访问应用
- 前端应用: http://localhost:3000
- API 文档: http://localhost:3001/health

## 📖 基本使用

### 创建第一个页面
1. 点击 "新建页面" 按钮
2. 输入页面名称
3. 开始编写内容

### 块编辑器操作
- **Enter**: 创建新块
- **Tab**: 增加缩进
- **Shift+Tab**: 减少缩进
- **Ctrl+B**: 粗体
- **Ctrl+I**: 斜体
- **Ctrl+/**: 显示格式化工具栏

### 搜索功能
- **Ctrl+K**: 快速搜索
- 访问 `/search` 页面进行高级搜索
- 支持实时搜索和历史记录

### 数据管理
- 导出: 访问 API `/api/export/default`
- 导入: 使用 `/api/import` 端点

## 🛠️ 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev:full          # 同时启动前后端
pnpm web:dev           # 仅启动前端
pnpm api:dev           # 仅启动后端

# 构建
pnpm build             # 构建所有包
pnpm web:build         # 构建前端
pnpm api:build         # 构建后端

# 数据库
pnpm db:generate       # 生成 Prisma 客户端
pnpm db:migrate        # 运行数据库迁移
pnpm db:studio         # 打开数据库管理界面

# 测试
pnpm test              # 运行测试
pnpm lint              # 代码检查
```

## 📁 项目结构

```
MingLog/
├── apps/
│   ├── web/           # React 前端应用
│   └── api/           # Express 后端 API
├── packages/
│   ├── core/          # 核心类型和工具
│   ├── ui/            # UI 组件库
│   ├── editor/        # 块编辑器
│   ├── search/        # 搜索引擎
│   └── database/      # 数据库模式
├── docs/              # 文档
└── scripts/           # 构建脚本
```

## 🔧 配置

### 环境变量

创建 `.env` 文件:
```env
# API 服务器
PORT=3001
NODE_ENV=development
DATABASE_URL="file:./packages/database/prisma/logseq.db"
CORS_ORIGIN=http://localhost:3000

# 前端应用
VITE_API_URL=http://localhost:3001/api
```

### 数据库配置

数据库文件位置: `packages/database/prisma/logseq.db`

如需重置数据库:
```bash
rm packages/database/prisma/logseq.db
pnpm db:migrate
```

## 🎯 核心功能

### 1. 页面管理
- 创建、编辑、删除页面
- 页面标签和属性
- 日记页面支持

### 2. 块编辑器
- 层次化内容结构
- 拖拽排序
- 富文本格式化
- 快捷键操作

### 3. 搜索系统
- 全文搜索
- 实时搜索建议
- 高级过滤器
- 搜索历史

### 4. 数据导入导出
- JSON 格式完整导出
- Markdown 格式导出
- 批量导入功能
- 数据合并策略

## 🐛 故障排除

### 常见问题

**1. 端口被占用**
```bash
# 检查端口使用情况
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# 杀死进程
taskkill /PID <PID> /F
```

**2. 数据库连接失败**
```bash
# 重新生成数据库
pnpm db:generate
pnpm db:migrate
```

**3. 依赖安装失败**
```bash
# 清理缓存
pnpm store prune
rm -rf node_modules
pnpm install
```

**4. 前端无法连接后端**
- 确保后端 API 服务器正在运行 (端口 3001)
- 检查 CORS 配置
- 验证 `VITE_API_URL` 环境变量

### 日志查看

**后端日志**: 在 API 服务器终端查看
**前端日志**: 在浏览器开发者工具 Console 查看
**数据库日志**: 使用 `pnpm db:studio` 查看数据

## 📚 更多资源

- [API 文档](./API_INTEGRATION_REPORT.md)
- [项目总结](./MINGLOG_PROJECT_SUMMARY.md)
- [测试报告](./test-*.js)
- [GitHub 仓库](https://github.com/MMR-MINGriyue/MingLog)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**需要帮助?** 请创建 [GitHub Issue](https://github.com/MMR-MINGriyue/MingLog/issues) 或联系开发团队。
