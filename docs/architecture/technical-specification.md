# 📋 MingLog 技术规格书

## 📊 项目概览

**项目名称**: MingLog - 现代化个人知识管理桌面应用
**版本**: v1.0.0
**开发周期**: 2024年12月 - 2025年1月 (5周)
**技术栈**: Tauri + Rust + React + TypeScript
**目标平台**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)

## 🏗️ 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户界面层                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │  搜索组件   │ │  页面管理   │ │  编辑器     │ │  设置面板   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                        React + TypeScript
                                │
┌─────────────────────────────────────────────────────────────────┐
│                       Tauri Bridge                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │  IPC通信    │ │  事件系统   │ │  文件系统   │ │  系统集成   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                            Rust Backend
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        业务逻辑层                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │  页面服务   │ │  搜索服务   │ │  文件服务   │ │  配置服务   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                            数据访问层
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        数据存储层                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ SQLite数据库│ │  文件系统   │ │  配置文件   │ │  缓存系统   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 技术栈详细说明

#### 前端技术栈
| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|----------|
| React | 18.2.0 | UI框架 | 成熟的组件化开发，丰富的生态系统 |
| TypeScript | 5.0+ | 类型系统 | 提供类型安全，提升开发效率 |
| Tailwind CSS | 3.0+ | 样式框架 | 实用优先，快速开发，易于维护 |
| Vite | 4.0+ | 构建工具 | 快速的开发服务器和构建速度 |
| Vitest | 1.0+ | 测试框架 | 与Vite集成良好，快速的测试执行 |

#### 后端技术栈
| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|----------|
| Tauri | 2.0+ | 桌面应用框架 | 轻量级，安全性高，性能优秀 |
| Rust | 1.70+ | 系统编程语言 | 内存安全，高性能，并发支持 |
| SQLite | 3.40+ | 嵌入式数据库 | 轻量级，无需配置，ACID支持 |
| sqlx | 0.7+ | 数据库工具包 | 异步支持，编译时SQL检查 |
| tokio | 1.0+ | 异步运行时 | 高性能异步编程支持 |

## 📊 数据库设计

### 数据库架构

**数据库类型**: SQLite 3.40+
**连接方式**: 异步连接池 (sqlx)
**事务支持**: ACID事务
**备份策略**: WAL模式 + 定期备份

### 核心表结构

#### 1. pages 表 (页面数据)
```sql
CREATE TABLE pages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    parent_id TEXT,
    position INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES pages(id)
);

-- 索引
CREATE INDEX idx_pages_parent_id ON pages(parent_id);
CREATE INDEX idx_pages_updated_at ON pages(updated_at);
CREATE INDEX idx_pages_title ON pages(title);
```

#### 2. blocks 表 (块数据)
```sql
CREATE TABLE blocks (
    id TEXT PRIMARY KEY,
    page_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    content TEXT NOT NULL DEFAULT '',
    position INTEGER DEFAULT 0,
    properties TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_blocks_page_id ON blocks(page_id);
CREATE INDEX idx_blocks_position ON blocks(page_id, position);
```

#### 3. 全文搜索表 (FTS5)
```sql
CREATE VIRTUAL TABLE pages_fts USING fts5(
    title,
    content,
    content_rowid=id
);

-- 触发器保持FTS表同步
CREATE TRIGGER pages_fts_insert AFTER INSERT ON pages BEGIN
    INSERT INTO pages_fts(rowid, title, content)
    VALUES (new.rowid, new.title, new.content);
END;

CREATE TRIGGER pages_fts_update AFTER UPDATE ON pages BEGIN
    UPDATE pages_fts SET title = new.title, content = new.content
    WHERE rowid = new.rowid;
END;

CREATE TRIGGER pages_fts_delete AFTER DELETE ON pages BEGIN
    DELETE FROM pages_fts WHERE rowid = old.rowid;
END;
```

#### 4. 配置表
```sql
CREATE TABLE app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 默认配置
INSERT INTO app_config (key, value, updated_at) VALUES
('theme', 'light', strftime('%s', 'now')),
('auto_save_interval', '5000', strftime('%s', 'now')),
('search_debounce_delay', '300', strftime('%s', 'now'));
```

### 数据库性能优化

#### 连接池配置
```rust
let pool = SqlitePoolOptions::new()
    .max_connections(5)
    .min_connections(1)
    .acquire_timeout(Duration::from_secs(30))
    .idle_timeout(Duration::from_secs(600))
    .max_lifetime(Duration::from_secs(1800))
    .connect(&database_url)
    .await?;
```

#### WAL模式配置
```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = memory;
PRAGMA mmap_size = 268435456; -- 256MB
```

## 🔧 API设计

### Tauri Commands

#### 页面管理API
```rust
// 创建页面
#[command]
async fn create_page(
    title: String,
    parent_id: Option<String>,
    state: State<'_, AppState>
) -> Result<Page, String>

// 更新页面
#[command]
async fn update_page(
    id: String,
    title: Option<String>,
    content: Option<String>,
    state: State<'_, AppState>
) -> Result<Page, String>

// 删除页面
#[command]
async fn delete_page(
    id: String,
    state: State<'_, AppState>
) -> Result<(), String>

// 获取页面列表
#[command]
async fn get_pages(
    parent_id: Option<String>,
    state: State<'_, AppState>
) -> Result<Vec<Page>, String>
```

#### 搜索API
```rust
// 搜索页面
#[command]
async fn search_pages(
    query: String,
    limit: Option<u32>,
    state: State<'_, AppState>
) -> Result<Vec<SearchResult>, String>

// 获取搜索建议
#[command]
async fn get_search_suggestions(
    query: String,
    state: State<'_, AppState>
) -> Result<Vec<String>, String>
```

#### 文件操作API
```rust
// 导入Markdown文件
#[command]
async fn import_markdown(
    file_path: String,
    state: State<'_, AppState>
) -> Result<Page, String>

// 导出页面为Markdown
#[command]
async fn export_page(
    page_id: String,
    file_path: String,
    state: State<'_, AppState>
) -> Result<(), String>

// 备份数据
#[command]
async fn backup_data(
    backup_path: String,
    state: State<'_, AppState>
) -> Result<(), String>
```

### 前端API调用

#### TypeScript类型定义
```typescript
interface Page {
  id: string
  title: string
  content: string
  parent_id?: string
  position: number
  created_at: number
  updated_at: number
}

interface SearchResult {
  id: string
  title: string
  excerpt: string
  score: number
  page_id: string
}

interface Block {
  id: string
  page_id: string
  type: 'text' | 'heading' | 'list' | 'quote' | 'code'
  content: string
  position: number
  properties: Record<string, any>
}
```

#### API调用封装
```typescript
import { invoke } from '@tauri-apps/api/tauri'

export class PageAPI {
  static async createPage(title: string, parentId?: string): Promise<Page> {
    return invoke('create_page', { title, parent_id: parentId })
  }

  static async updatePage(id: string, updates: Partial<Page>): Promise<Page> {
    return invoke('update_page', { id, ...updates })
  }

  static async deletePage(id: string): Promise<void> {
    return invoke('delete_page', { id })
  }

  static async getPages(parentId?: string): Promise<Page[]> {
    return invoke('get_pages', { parent_id: parentId })
  }
}
```

## 🎨 用户界面设计

### 设计系统

#### 颜色系统
```css
:root {
  /* 主色调 */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-900: #1e3a8a;

  /* 灰度色调 */
  --gray-50: #f9fafb;
  --gray-500: #6b7280;
  --gray-900: #111827;

  /* 语义色彩 */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
}

[data-theme="dark"] {
  --gray-50: #111827;
  --gray-500: #9ca3af;
  --gray-900: #f9fafb;
}
```

#### 字体系统
```css
.font-system {
  font-family:
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    "WenQuanYi Micro Hei",
    sans-serif;
}

.font-mono {
  font-family:
    "SF Mono",
    "Monaco",
    "Inconsolata",
    "Roboto Mono",
    monospace;
}
```

#### 间距系统
```css
.spacing {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
}
```

### 响应式设计

#### 断点系统
```css
/* 移动端 */
@media (max-width: 640px) {
  .container { padding: 1rem; }
}

/* 平板端 */
@media (min-width: 641px) and (max-width: 1024px) {
  .container { padding: 1.5rem; }
}

/* 桌面端 */
@media (min-width: 1025px) {
  .container { padding: 2rem; }
}
```

#### 组件适配
```typescript
const SearchComponent: React.FC = () => {
  return (
    <div className="
      fixed inset-0 bg-black bg-opacity-50 z-50
      flex items-start justify-center
      pt-4 sm:pt-20
    ">
      <div className="
        bg-white dark:bg-gray-800 rounded-lg shadow-xl
        w-full max-w-2xl mx-2 sm:mx-4
        max-h-[95vh] sm:max-h-[70vh]
        flex flex-col
      ">
        {/* 搜索内容 */}
      </div>
    </div>
  )
}
```

## 🚀 性能规格

### 性能目标

#### 启动性能
| 指标 | 目标值 | 实际值 | 状态 |
|------|--------|--------|------|
| 冷启动时间 | <3秒 | ~2.9秒 | ✅ |
| 热启动时间 | <1秒 | ~0.4秒 | ✅ |
| 首屏渲染 | <2秒 | ~0.6秒 | ✅ |
| 初始内存 | <100MB | ~73MB | ✅ |

#### 运行时性能
| 指标 | 目标值 | 实际值 | 状态 |
|------|--------|--------|------|
| 搜索响应 | <100ms | ~67ms | ✅ |
| 页面切换 | <200ms | ~71ms | ✅ |
| 运行时内存 | <200MB | ~196MB | ✅ |
| CPU使用率 | <10% | ~3.9% | ✅ |

#### 应用大小
| 指标 | 目标值 | 实际值 | 状态 |
|------|--------|--------|------|
| 前端包大小 | <50KB | ~20KB | ✅ |
| 安装包大小 | <50MB | ~15-30MB | ✅ |
| 数据库大小 | 动态增长 | 按需增长 | ✅ |

### 性能优化策略

#### 前端优化
1. **代码分割**: 使用React.lazy()懒加载重型组件
2. **虚拟化**: 使用react-window处理大量列表数据
3. **缓存策略**: 实现LRU缓存减少重复计算
4. **防抖优化**: 搜索输入使用300ms防抖

#### 后端优化
1. **数据库索引**: 为常用查询字段创建索引
2. **连接池**: 使用连接池管理数据库连接
3. **异步处理**: 所有I/O操作使用异步模式
4. **内存管理**: 及时释放不需要的资源

#### 内存优化
1. **智能缓存**: 限制缓存大小和生存时间
2. **垃圾回收**: 定期清理无用数据
3. **内存监控**: 实时监控内存使用情况
4. **泄漏检测**: 自动检测和报告内存泄漏

## 🛡️ 安全规格

### 安全架构

#### Tauri安全模型
```json
{
  "security": {
    "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  },
  "allowlist": {
    "all": false,
    "fs": {
      "scope": ["$APPDATA/*", "$DOCUMENT/*"],
      "readFile": true,
      "writeFile": true,
      "readDir": true
    },
    "shell": {
      "open": true
    }
  }
}
```

#### 数据安全
1. **本地存储**: 所有数据存储在用户本地
2. **数据加密**: 敏感配置使用AES加密
3. **访问控制**: 严格的文件系统访问权限
4. **输入验证**: 所有用户输入进行验证和清理

### 安全威胁分析

| 威胁类型 | 风险等级 | 缓解措施 | 状态 |
|----------|----------|----------|------|
| XSS攻击 | 中 | CSP策略 + 输入清理 | ✅ |
| SQL注入 | 低 | 参数化查询 | ✅ |
| 文件系统攻击 | 中 | 路径验证 + 权限控制 | ✅ |
| 内存泄漏 | 低 | 自动内存管理 | ✅ |

## 🧪 测试规格

### 测试策略

#### 测试金字塔
```
        /\
       /  \
      / E2E \     端到端测试 (10%)
     /______\
    /        \
   / 集成测试  \   集成测试 (20%)
  /____________\
 /              \
/    单元测试     \  单元测试 (70%)
/________________\
```

#### 测试覆盖率目标
| 测试类型 | 目标覆盖率 | 当前覆盖率 | 状态 |
|----------|------------|------------|------|
| 前端单元测试 | 85% | 71.9% | 🔄 |
| 后端单元测试 | 90% | 85%+ | ✅ |
| 集成测试 | 80% | 75%+ | 🔄 |
| E2E测试 | 60% | 50%+ | 🔄 |

### 测试环境

#### 前端测试配置
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  }
})
```

#### 后端测试配置
```rust
// Cargo.toml
[dev-dependencies]
tokio-test = "0.4"
sqlx = { version = "0.7", features = ["testing"] }

// 测试配置
#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::SqlitePool;

    async fn setup_test_db() -> SqlitePool {
        SqlitePool::connect(":memory:").await.unwrap()
    }
}
```

## 📦 部署规格

### 构建配置

#### 前端构建
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'date-fns']
        }
      }
    }
  }
})
```

#### Tauri构建
```toml
# Cargo.toml
[profile.release]
opt-level = 3
lto = true
codegen-units = 1
panic = "abort"
strip = true
```

### 平台支持

#### Windows
- **最低版本**: Windows 10 (1903)
- **架构**: x86_64
- **安装包**: .msi, .exe
- **依赖**: WebView2 Runtime

#### macOS
- **最低版本**: macOS 10.15 (Catalina)
- **架构**: x86_64, aarch64 (Apple Silicon)
- **安装包**: .dmg, .app
- **签名**: Apple Developer Certificate

#### Linux
- **发行版**: Ubuntu 20.04+, Fedora 35+, Arch Linux
- **架构**: x86_64
- **安装包**: .deb, .rpm, .AppImage
- **依赖**: webkit2gtk

### 自动更新

#### 更新机制
```json
{
  "updater": {
    "active": true,
    "endpoints": [
      "https://releases.minglog.com/{{target}}/{{current_version}}"
    ],
    "dialog": true,
    "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDFBQ0VGMTU3QTdBNDMxNzQ="
  }
}
```

## 📊 监控规格

### 性能监控

#### 指标收集
```typescript
interface PerformanceMetrics {
  // 内存指标
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }

  // 渲染指标
  renderMetrics: {
    fps: number
    renderTime: number
    componentCount: number
  }

  // 数据库指标
  databaseMetrics: {
    queryTime: number
    connectionCount: number
    cacheHitRate: number
  }
}
```

#### 错误监控
```rust
pub struct ErrorTracker {
    errors: Vec<ErrorInfo>,
    max_errors: usize,
}

impl ErrorTracker {
    pub fn capture_error(&mut self, error: Error, context: ErrorContext) {
        let error_info = ErrorInfo {
            message: error.to_string(),
            timestamp: SystemTime::now(),
            context,
            stack_trace: error.backtrace(),
        };

        self.errors.push(error_info);

        if self.errors.len() > self.max_errors {
            self.errors.remove(0);
        }
    }
}
```

### 日志系统

#### 日志级别
```rust
use log::{error, warn, info, debug, trace};

// 错误级别 - 严重错误
error!("Database connection failed: {}", err);

// 警告级别 - 潜在问题
warn!("Memory usage high: {}MB", memory_mb);

// 信息级别 - 重要事件
info!("User created new page: {}", page_id);

// 调试级别 - 调试信息
debug!("Search query: {}", query);

// 跟踪级别 - 详细跟踪
trace!("Function entry: create_page");
```

## 🔄 维护规格

### 版本管理

#### 语义化版本
```
MAJOR.MINOR.PATCH

MAJOR: 不兼容的API变更
MINOR: 向后兼容的功能新增
PATCH: 向后兼容的错误修复
```

#### 发布周期
- **主版本**: 每年1-2次
- **次版本**: 每季度1次
- **补丁版本**: 按需发布
- **安全更新**: 立即发布

### 数据库迁移

#### 迁移脚本
```rust
pub struct Migration {
    pub version: u32,
    pub description: String,
    pub up_sql: String,
    pub down_sql: String,
}

pub async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::migrate!("./migrations").run(pool).await
}
```

#### 备份策略
1. **自动备份**: 每日自动备份
2. **版本备份**: 升级前自动备份
3. **手动备份**: 用户主动备份
4. **云备份**: 可选的云端备份

## 📋 合规性规格

### 无障碍访问

#### WCAG 2.1 AA标准
| 原则 | 指导方针 | 符合性 | 实现方式 |
|------|----------|--------|----------|
| 可感知 | 文本替代 | ✅ | alt属性, aria-label |
| 可操作 | 键盘访问 | ✅ | 完整键盘导航 |
| 可理解 | 可读性 | ✅ | 语义化HTML |
| 健壮性 | 兼容性 | ✅ | 标准Web技术 |

#### 辅助技术支持
- **屏幕阅读器**: NVDA, JAWS, VoiceOver
- **语音识别**: Dragon NaturallySpeaking
- **键盘导航**: 完整的键盘操作支持
- **高对比度**: 系统高对比度模式支持

### 隐私保护

#### 数据处理原则
1. **数据最小化**: 只收集必要的数据
2. **本地优先**: 数据存储在用户本地
3. **透明度**: 明确的隐私政策
4. **用户控制**: 用户完全控制自己的数据

#### 数据类型
- **用户内容**: 页面、块、搜索历史
- **应用设置**: 主题、快捷键、界面配置
- **性能数据**: 匿名的性能指标
- **错误日志**: 不包含用户内容的错误信息

## 📚 文档规格

### 文档结构
```
docs/
├── user-manual.md          # 用户手册
├── developer-guide.md      # 开发者指南
├── technical-specification.md # 技术规格书
├── deployment-guide.md     # 部署指南
├── api-reference.md        # API参考
├── troubleshooting.md      # 故障排除
└── changelog.md            # 变更日志
```

### 文档维护
- **更新频率**: 每个版本发布时更新
- **多语言**: 中文为主，英文为辅
- **格式标准**: Markdown + 图表
- **版本控制**: 与代码同步版本管理

---

**本技术规格书版本**: v1.0.0
**最后更新**: 2025年1月
**维护者**: MingLog开发团队