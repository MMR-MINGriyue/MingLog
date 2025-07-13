# 🛠️ MingLog 开发者指南

## 📋 项目概览

MingLog是一个基于Tauri + Rust + React技术栈的现代化桌面知识管理应用。

### 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端层 (React)                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │   UI组件    │ │   状态管理   │ │   路由管理   │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
                            │
                    Tauri Bridge
                            │
┌─────────────────────────────────────────────────────────┐
│                   后端层 (Rust)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  数据库层   │ │   业务逻辑   │ │   文件系统   │       │
│  │  (SQLite)   │ │   (Rust)    │ │   (Tauri)   │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### 📁 项目结构

```
minglog/
├── apps/
│   └── tauri-desktop/           # Tauri桌面应用
│       ├── src/                 # React前端源码
│       │   ├── components/      # React组件
│       │   ├── hooks/          # 自定义Hooks
│       │   ├── utils/          # 工具函数
│       │   ├── types/          # TypeScript类型定义
│       │   └── test/           # 测试文件
│       ├── src-tauri/          # Rust后端源码
│       │   ├── src/            # Rust源码
│       │   ├── Cargo.toml      # Rust依赖配置
│       │   └── tauri.conf.json # Tauri配置
│       ├── public/             # 静态资源
│       ├── package.json        # Node.js依赖
│       └── vite.config.ts      # Vite构建配置
├── docs/                       # 项目文档
├── scripts/                    # 构建和部署脚本
└── README.md                   # 项目说明
```

## 🚀 开发环境搭建

### 前置要求

**必需软件:**
- Node.js 18+ 
- Rust 1.70+
- Git

**推荐工具:**
- VS Code + Rust Analyzer扩展
- Chrome DevTools
- Tauri CLI

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/MMR-MINGriyue/MingLog.git
   cd MingLog
   ```

2. **安装依赖**
   ```bash
   cd apps/tauri-desktop
   npm install
   ```

3. **安装Tauri CLI**
   ```bash
   npm install -g @tauri-apps/cli
   ```

4. **启动开发服务器**
   ```bash
   npm run tauri:dev
   ```

### 开发工具配置

**VS Code配置 (.vscode/settings.json):**
```json
{
  "rust-analyzer.linkedProjects": ["apps/tauri-desktop/src-tauri/Cargo.toml"],
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

**ESLint配置 (.eslintrc.js):**
```javascript
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    'react/prop-types': 'off'
  }
}
```

## 🏗️ 架构设计

### 前端架构

**组件层次结构:**
```
App
├── SearchComponent (全局搜索)
├── PageManager (页面管理)
│   ├── PageList (页面列表)
│   └── PageEditor (页面编辑器)
├── PerformanceMonitor (性能监控)
├── UserGuide (用户引导)
└── UserPreferences (用户设置)
```

**状态管理:**
- React Hooks (useState, useEffect, useContext)
- 自定义Hooks封装业务逻辑
- Context API用于全局状态

**数据流:**
```
UI组件 → Tauri Commands → Rust后端 → SQLite数据库
       ←                ←           ←
```

### 后端架构

**Rust模块结构:**
```rust
src/
├── main.rs              // 应用入口
├── commands/            // Tauri命令
│   ├── page.rs         // 页面相关命令
│   ├── search.rs       // 搜索相关命令
│   └── file.rs         // 文件操作命令
├── database/           // 数据库层
│   ├── mod.rs          // 数据库模块
│   ├── models.rs       // 数据模型
│   └── migrations.rs   // 数据库迁移
├── services/           // 业务逻辑层
│   ├── page_service.rs // 页面服务
│   └── search_service.rs // 搜索服务
└── utils/              // 工具函数
    ├── error.rs        // 错误处理
    └── config.rs       // 配置管理
```

## 🔧 核心功能实现

### 1. 页面管理系统

**前端组件 (PageManager.tsx):**
```typescript
interface Page {
  id: string
  title: string
  content: string
  parent_id?: string
  created_at: number
  updated_at: number
}

const PageManager: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)

  const createPage = async (title: string) => {
    const page = await invoke<Page>('create_page', { title })
    setPages(prev => [...prev, page])
  }

  const updatePage = async (id: string, updates: Partial<Page>) => {
    const page = await invoke<Page>('update_page', { id, updates })
    setPages(prev => prev.map(p => p.id === id ? page : p))
  }

  // ... 其他页面操作
}
```

**后端命令 (commands/page.rs):**
```rust
use tauri::command;
use crate::database::models::Page;
use crate::services::page_service::PageService;

#[command]
pub async fn create_page(
    title: String,
    state: tauri::State<'_, PageService>
) -> Result<Page, String> {
    state.create_page(title).await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn update_page(
    id: String,
    updates: serde_json::Value,
    state: tauri::State<'_, PageService>
) -> Result<Page, String> {
    state.update_page(id, updates).await
        .map_err(|e| e.to_string())
}
```

### 2. 搜索系统

**搜索服务 (services/search_service.rs):**
```rust
use sqlx::{SqlitePool, Row};
use crate::database::models::SearchResult;

pub struct SearchService {
    pool: SqlitePool,
}

impl SearchService {
    pub async fn search_pages(&self, query: &str) -> Result<Vec<SearchResult>, sqlx::Error> {
        let results = sqlx::query(
            "SELECT id, title, content, 
             snippet(pages_fts, 2, '<mark>', '</mark>', '...', 32) as excerpt,
             rank
             FROM pages_fts 
             WHERE pages_fts MATCH ?
             ORDER BY rank"
        )
        .bind(query)
        .fetch_all(&self.pool)
        .await?;

        Ok(results.into_iter().map(|row| SearchResult {
            id: row.get("id"),
            title: row.get("title"),
            excerpt: row.get("excerpt"),
            score: row.get("rank"),
        }).collect())
    }
}
```

### 3. 性能监控

**性能监控组件 (PerformanceMonitor.tsx):**
```typescript
interface PerformanceMetrics {
  memoryUsage: number
  renderTime: number
  dbQueryTime: number
  componentCount: number
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>()
  const [isMonitoring, setIsMonitoring] = useState(false)

  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(async () => {
      const newMetrics = await invoke<PerformanceMetrics>('get_performance_metrics')
      setMetrics(newMetrics)
    }, 1000)

    return () => clearInterval(interval)
  }, [isMonitoring])

  // ... 渲染性能图表
}
```

## 🧪 测试策略

### 测试架构

```
测试层级:
├── 单元测试 (Unit Tests)
│   ├── React组件测试 (Vitest + React Testing Library)
│   └── Rust函数测试 (cargo test)
├── 集成测试 (Integration Tests)
│   ├── API接口测试
│   └── 数据库操作测试
└── 端到端测试 (E2E Tests)
    └── 用户流程测试 (Playwright)
```

### 前端测试

**组件测试示例:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchComponent } from '../SearchComponent'

describe('SearchComponent', () => {
  it('should display search results', async () => {
    const mockResults = [
      { id: '1', title: 'Test Page', excerpt: 'Test content' }
    ]
    
    // Mock Tauri invoke
    window.__TAURI__ = {
      tauri: {
        invoke: jest.fn().mockResolvedValue(mockResults)
      }
    }

    render(<SearchComponent />)
    
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'test' } })

    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument()
    })
  })
})
```

**运行测试:**
```bash
# 前端测试
npm run test:vitest

# 带覆盖率
npm run test:vitest -- --coverage

# 监听模式
npm run test:vitest -- --watch
```

### 后端测试

**Rust单元测试:**
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::SqlitePool;

    #[tokio::test]
    async fn test_create_page() {
        let pool = SqlitePool::connect(":memory:").await.unwrap();
        let service = PageService::new(pool);
        
        let page = service.create_page("Test Page".to_string()).await.unwrap();
        
        assert_eq!(page.title, "Test Page");
        assert!(!page.id.is_empty());
    }
}
```

**运行Rust测试:**
```bash
cd src-tauri
cargo test
```

## 📦 构建和部署

### 开发构建

```bash
# 前端开发服务器
npm run dev

# Tauri开发模式
npm run tauri:dev

# 前端构建
npm run build
```

### 生产构建

```bash
# 构建所有平台
npm run tauri:build

# 构建特定平台
npm run tauri:build -- --target x86_64-pc-windows-msvc
npm run tauri:build -- --target x86_64-apple-darwin
npm run tauri:build -- --target x86_64-unknown-linux-gnu
```

### 构建配置

**Tauri配置 (tauri.conf.json):**
```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "identifier": "com.minglog.desktop",
    "icon": ["icons/icon.ico", "icons/icon.icns"],
    "category": "Productivity"
  }
}
```

## 🔍 调试技巧

### 前端调试

**Chrome DevTools:**
- 在Tauri应用中按 `F12` 打开开发者工具
- 使用Console查看日志和错误
- 使用Network面板监控Tauri命令调用

**React DevTools:**
```bash
# 安装React DevTools
npm install -g react-devtools
react-devtools
```

### 后端调试

**Rust调试:**
```rust
// 添加调试日志
use log::{info, warn, error};

#[command]
pub async fn debug_command() -> Result<String, String> {
    info!("Debug command called");
    // ... 业务逻辑
    Ok("Success".to_string())
}
```

**日志配置:**
```rust
// main.rs
use env_logger;

fn main() {
    env_logger::init();
    // ... 应用启动
}
```

## 🚀 性能优化

### 前端优化

**代码分割:**
```typescript
// 懒加载组件
const PerformanceMonitor = lazy(() => import('./PerformanceMonitor'))

// 使用Suspense
<Suspense fallback={<Loading />}>
  <PerformanceMonitor />
</Suspense>
```

**虚拟化:**
```typescript
import { FixedSizeList as List } from 'react-window'

const VirtualizedList = ({ items }) => (
  <List
    height={400}
    itemCount={items.length}
    itemSize={50}
  >
    {({ index, style }) => (
      <div style={style}>
        {items[index]}
      </div>
    )}
  </List>
)
```

### 后端优化

**数据库优化:**
```sql
-- 创建索引
CREATE INDEX idx_pages_title ON pages(title);
CREATE INDEX idx_pages_updated_at ON pages(updated_at);

-- 全文搜索索引
CREATE VIRTUAL TABLE pages_fts USING fts5(title, content);
```

**连接池配置:**
```rust
let pool = SqlitePoolOptions::new()
    .max_connections(5)
    .connect(&database_url)
    .await?;
```

## 🤝 贡献指南

### 代码规范

**TypeScript/React:**
- 使用函数组件和Hooks
- 遵循ESLint规则
- 使用TypeScript严格模式
- 组件名使用PascalCase

**Rust:**
- 遵循Rust官方代码规范
- 使用cargo fmt格式化代码
- 使用cargo clippy检查代码质量
- 函数名使用snake_case

### 提交规范

**Commit消息格式:**
```
type(scope): description

[optional body]

[optional footer]
```

**类型说明:**
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建工具或辅助工具的变动

### Pull Request流程

1. Fork项目到个人仓库
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -m 'feat: add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 创建Pull Request

## 📚 参考资源

### 官方文档
- [Tauri官方文档](https://tauri.app/)
- [React官方文档](https://react.dev/)
- [Rust官方文档](https://doc.rust-lang.org/)

### 社区资源
- [Tauri Discord](https://discord.com/invite/tauri)
- [React社区](https://reactjs.org/community/support.html)
- [Rust社区](https://www.rust-lang.org/community)

---

**祝您开发愉快！** 🎉
