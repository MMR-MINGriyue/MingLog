# 🤖 开发提示词集合

这个文档包含了MingLog项目各个开发阶段的详细提示词，可以直接用于AI辅助开发。

## 📋 使用说明

每个提示词都包含：
- **背景信息**: 项目上下文和技术栈
- **具体任务**: 明确的开发目标
- **技术要求**: 详细的实现规范
- **验收标准**: 功能完成的判断标准

---

## 🔧 阶段2.1: 编辑器增强

### 提示词 2.1.1: 块编辑器性能优化

```
你是一个专业的React开发者，正在为MingLog项目优化块编辑器组件。

项目背景：
- 使用TypeScript + React 18 + TipTap编辑器
- 采用Zustand状态管理
- 需要支持大量块的高性能渲染
- 目标是流畅的60fps编辑体验

当前问题：
- 大文档（1000+块）渲染缓慢
- 编辑时出现卡顿
- 内存占用过高

任务要求：
1. 优化BlockEditor组件，使用React.memo和useMemo
2. 实现虚拟滚动，只渲染可见区域的块
3. 添加防抖保存机制，避免频繁数据库写入
4. 优化TipTap编辑器配置，减少不必要的重渲染
5. 实现块的懒加载和预加载策略

技术规范：
- 使用react-window或react-virtualized实现虚拟滚动
- 防抖延迟设置为500ms
- 内存占用不超过当前的50%
- 编辑响应时间<100ms

请提供完整的优化方案和代码实现。
```

### 提示词 2.1.2: 双向链接系统

```
你是一个专业的前端开发者，需要为MingLog实现智能的双向链接系统。

项目背景：
- TypeScript + React项目
- 使用Prisma + SQLite存储数据
- 需要支持[[页面名称]]和[[页面|别名]]语法
- 要求实时解析和自动补全

功能需求：
1. 解析文本中的[[]]语法，识别页面链接
2. 自动创建不存在的页面
3. 实现链接的自动补全功能
4. 显示页面的反向链接列表
5. 支持链接预览（hover显示页面内容）
6. 处理页面重命名时的链接更新

技术要求：
- 使用正则表达式解析链接：/\[\[([^\]]+)\]\]/g
- 实现debounced搜索，延迟300ms
- 链接补全最多显示10个结果
- 预览窗口支持markdown渲染
- 数据库查询优化，使用索引

数据结构：
```typescript
interface PageLink {
  id: string;
  fromBlockId: string;
  toPageName: string;
  alias?: string;
  position: { start: number; end: number };
}
```

请实现完整的双向链接系统，包括解析、存储、UI组件和数据库操作。
```

### 提示词 2.1.3: 块引用功能

```
你是一个资深的TypeScript开发者，需要为Logseq Next实现块引用功能。

项目背景：
- 基于React + TypeScript的知识管理工具
- 使用TipTap编辑器和Prisma数据库
- 需要支持((块ID))语法进行块引用
- 要求实现嵌入式显示和实时更新

核心功能：
1. 生成唯一的块ID（使用nanoid）
2. 解析((块ID))语法并渲染为嵌入块
3. 实现块的复制引用功能（右键菜单）
4. 显示块的引用计数和引用列表
5. 支持引用块的实时更新
6. 防止循环引用

技术实现：
- 块ID格式：8位随机字符串
- 引用解析正则：/\(\(([^)]+)\)\)/g
- 使用React Portal渲染嵌入块
- 实现引用关系的图结构检测
- 添加引用深度限制（最大3层）

数据模型：
```typescript
interface BlockReference {
  id: string;
  sourceBlockId: string;
  targetBlockId: string;
  createdAt: Date;
}

interface Block {
  id: string;
  content: string;
  references: BlockReference[];
  referencedBy: BlockReference[];
}
```

验收标准：
- 支持嵌套引用显示
- 引用块内容变更时自动更新
- 删除块时清理相关引用
- 性能：1000个引用块<2秒加载

请提供完整的实现方案。
```

---

## 🗄️ 阶段2.2: 数据持久化

### 提示词 2.2.1: Prisma性能优化

```
你是一个数据库专家，需要优化Logseq Next的Prisma数据层性能。

项目背景：
- 使用Prisma + SQLite
- 数据量：10万+块，1万+页面
- 主要操作：创建、更新、搜索、关系查询
- 目标：查询响应时间<100ms

当前问题：
- 复杂关系查询缓慢
- 全文搜索性能不佳
- 并发写入时锁等待
- 内存占用过高

优化任务：
1. 设计高效的数据库索引策略
2. 优化Prisma查询语句
3. 实现查询结果缓存
4. 添加数据库连接池
5. 实现批量操作优化

技术要求：
- 为常用查询字段添加索引
- 使用Prisma的include和select优化查询
- 实现Redis缓存层（可选）
- 批量操作使用事务
- 添加查询性能监控

关键查询优化：
```sql
-- 页面搜索索引
CREATE INDEX idx_pages_name_fts ON pages USING gin(to_tsvector('english', name));

-- 块内容搜索索引  
CREATE INDEX idx_blocks_content_fts ON blocks USING gin(to_tsvector('english', content));

-- 关系查询索引
CREATE INDEX idx_links_from_to ON links(from_block_id, to_page_id);
CREATE INDEX idx_blocks_page_parent ON blocks(page_id, parent_id);
```

请提供完整的性能优化方案和实现代码。
```

### 提示词 2.2.2: 数据迁移系统

```
你是一个系统架构师，需要为Logseq Next设计数据迁移和版本管理系统。

项目需求：
- 支持数据库schema版本升级
- 处理用户数据的安全迁移
- 支持迁移回滚
- 提供迁移进度显示
- 确保数据完整性

系统设计：
1. 版本管理机制
2. 迁移脚本框架
3. 数据备份策略
4. 回滚机制
5. 完整性检查

技术架构：
```typescript
interface Migration {
  version: string;
  description: string;
  up: (db: PrismaClient) => Promise<void>;
  down: (db: PrismaClient) => Promise<void>;
  validate: (db: PrismaClient) => Promise<boolean>;
}

interface MigrationRunner {
  getCurrentVersion(): Promise<string>;
  getPendingMigrations(): Migration[];
  runMigrations(): Promise<void>;
  rollback(targetVersion: string): Promise<void>;
}
```

实现要求：
- 迁移脚本按版本号排序执行
- 每个迁移在独立事务中执行
- 失败时自动回滚
- 记录迁移历史和执行时间
- 支持数据验证和修复

安全措施：
- 迁移前自动备份数据库
- 提供迁移预览功能
- 支持分步骤迁移
- 添加迁移锁防止并发执行

请设计完整的迁移系统架构和核心代码。
```

---

## 🔍 阶段2.3: 搜索引擎

### 提示词 2.3.1: MeiliSearch集成

```
你是一个搜索引擎专家，需要为Logseq Next集成MeiliSearch实现高性能全文搜索。

项目背景：
- React + TypeScript前端
- 需要搜索页面和块内容
- 支持中英文混合搜索
- 要求实时搜索和高亮显示

集成任务：
1. 配置MeiliSearch服务
2. 设计搜索索引结构
3. 实现数据同步机制
4. 开发搜索API接口
5. 创建搜索UI组件

技术规范：
- 索引名称：logseq_pages, logseq_blocks
- 搜索字段：title, content, tags
- 支持同义词和停用词
- 实现搜索建议和自动补全
- 添加搜索分析和统计

索引结构：
```typescript
interface SearchDocument {
  id: string;
  type: 'page' | 'block';
  title: string;
  content: string;
  tags: string[];
  pageId?: string;
  createdAt: number;
  updatedAt: number;
}
```

搜索功能：
- 模糊搜索和精确匹配
- 按类型、时间、标签过滤
- 搜索结果排序和分页
- 搜索历史记录
- 高级搜索语法

性能要求：
- 搜索响应时间<200ms
- 支持10万+文档
- 实时索引更新<1秒
- 内存占用<500MB

请提供完整的MeiliSearch集成方案。
```

### 提示词 2.3.2: 搜索UI组件

```
你是一个UI/UX专家，需要为Logseq Next设计直观高效的搜索界面。

设计目标：
- 提供流畅的搜索体验
- 支持键盘导航
- 实现搜索结果高亮
- 添加搜索过滤器
- 优化移动端体验

组件需求：
1. 全局搜索框（支持快捷键Cmd+K）
2. 搜索建议下拉列表
3. 搜索结果页面
4. 高级搜索面板
5. 搜索历史管理

交互设计：
- 输入时实时显示建议
- 支持上下箭头选择
- Enter确认搜索
- Escape关闭搜索
- 点击外部区域关闭

UI规范：
```typescript
interface SearchProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onSelect: (result: SearchResult) => void;
  shortcuts?: string[];
  filters?: SearchFilter[];
}

interface SearchResult {
  id: string;
  type: 'page' | 'block';
  title: string;
  content: string;
  highlights: string[];
  score: number;
}
```

技术实现：
- 使用Headless UI构建无障碍组件
- 实现虚拟滚动处理大量结果
- 添加防抖优化搜索请求
- 支持搜索结果缓存
- 实现搜索状态管理

样式要求：
- 响应式设计
- 暗色模式支持
- 动画过渡效果
- 高对比度支持
- 移动端友好

请设计完整的搜索UI系统。
```

---

## 📄 阶段2.4: 页面管理

### 提示词 2.4.1: 页面列表视图

```
你是一个前端架构师，需要为Logseq Next开发功能完整的页面管理系统。

功能需求：
- 显示所有页面的列表视图
- 支持多种排序方式（名称、修改时间、创建时间）
- 实现页面搜索和过滤
- 提供批量操作功能
- 支持页面预览

界面设计：
1. 页面列表表格/卡片视图
2. 搜索和过滤工具栏
3. 批量操作工具栏
4. 页面详情侧边栏
5. 分页或无限滚动

数据结构：
```typescript
interface PageListItem {
  id: string;
  name: string;
  title: string;
  blockCount: number;
  lastModified: Date;
  createdAt: Date;
  tags: string[];
  isJournal: boolean;
  size: number; // 字符数
}

interface PageFilter {
  search?: string;
  tags?: string[];
  dateRange?: { start: Date; end: Date };
  type?: 'all' | 'pages' | 'journals';
  sortBy?: 'name' | 'modified' | 'created' | 'size';
  sortOrder?: 'asc' | 'desc';
}
```

功能实现：
- 实时搜索（防抖300ms）
- 标签过滤器（多选）
- 日期范围选择器
- 批量删除/导出/标签操作
- 页面预览（markdown渲染）

性能优化：
- 虚拟滚动处理大量页面
- 分页加载（每页50项）
- 搜索结果缓存
- 图片懒加载

请实现完整的页面管理界面。
```

### 提示词 2.4.2: 页面模板系统

```
你是一个产品开发专家，需要为Logseq Next实现灵活的页面模板系统。

系统目标：
- 提供预设模板库
- 支持自定义模板创建
- 实现模板变量替换
- 支持模板分享和导入
- 提供模板预览功能

核心功能：
1. 模板编辑器
2. 变量系统
3. 模板库管理
4. 模板应用向导
5. 模板分享机制

数据模型：
```typescript
interface PageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: TemplateVariable[];
  preview?: string;
  author?: string;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
}

interface TemplateVariable {
  name: string;
  type: 'text' | 'date' | 'select' | 'multiline';
  label: string;
  defaultValue?: string;
  options?: string[]; // for select type
  required: boolean;
}
```

模板语法：
- 变量：{{variableName}}
- 日期：{{date:YYYY-MM-DD}}
- 条件：{{#if variable}}...{{/if}}
- 循环：{{#each items}}...{{/each}}

预设模板：
- 日记模板
- 会议记录模板
- 项目计划模板
- 读书笔记模板
- 周报模板

技术实现：
- 使用Handlebars.js处理模板
- 实现模板语法高亮
- 添加模板验证机制
- 支持模板版本管理
- 实现模板导入导出

请开发完整的模板系统。
```

---

## 🎨 阶段2.5: 用户界面优化

### 提示词 2.5.1: 主题系统

```
你是一个UI设计师和前端开发者，需要为Logseq Next实现完整的主题系统。

设计目标：
- 支持亮色/暗色模式
- 提供多种预设主题
- 支持自定义主题创建
- 实现主题的导入导出
- 确保无障碍访问

主题架构：
```typescript
interface Theme {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  colors: {
    // 基础颜色
    primary: string;
    secondary: string;
    accent: string;
    
    // 背景颜色
    background: string;
    surface: string;
    card: string;
    
    // 文本颜色
    text: string;
    textSecondary: string;
    textMuted: string;
    
    // 状态颜色
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // 边框和分割线
    border: string;
    divider: string;
  };
  fonts: {
    sans: string;
    serif: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}
```

功能实现：
1. 主题切换器组件
2. 主题编辑器
3. 实时预览功能
4. 主题导入导出
5. 系统主题检测

技术要求：
- 使用CSS变量实现主题切换
- 支持系统偏好检测
- 实现主题的持久化存储
- 添加主题切换动画
- 确保对比度符合WCAG标准

预设主题：
- Light（默认亮色）
- Dark（默认暗色）
- High Contrast（高对比度）
- Sepia（护眼模式）
- Custom（用户自定义）

请实现完整的主题系统。
```

### 提示词 2.5.2: 响应式设计优化

```
你是一个移动端专家，需要优化Logseq Next的响应式设计和移动端体验。

优化目标：
- 适配各种屏幕尺寸
- 优化触摸交互
- 提升移动端性能
- 改善可用性
- 支持PWA功能

响应式断点：
```css
/* 移动端 */
@media (max-width: 640px) { }

/* 平板端 */
@media (min-width: 641px) and (max-width: 1024px) { }

/* 桌面端 */
@media (min-width: 1025px) { }
```

移动端优化：
1. 侧边栏改为抽屉式导航
2. 编辑器适配触摸操作
3. 搜索界面全屏显示
4. 优化按钮和链接的点击区域
5. 实现手势导航

性能优化：
- 图片懒加载和压缩
- 减少重排和重绘
- 优化字体加载
- 实现虚拟滚动
- 添加加载状态

交互优化：
```typescript
interface TouchGesture {
  type: 'tap' | 'swipe' | 'pinch' | 'longpress';
  direction?: 'left' | 'right' | 'up' | 'down';
  target: HTMLElement;
  callback: (event: TouchEvent) => void;
}
```

PWA功能：
- 离线缓存策略
- 安装提示
- 推送通知
- 后台同步

技术实现：
- 使用Tailwind CSS响应式类
- 实现触摸手势库
- 添加Service Worker
- 优化首屏加载时间

请提供完整的移动端优化方案。
```

---

## 🧪 测试开发提示词

### 提示词: 自动化测试套件

```
你是一个测试工程师，需要为Logseq Next建立完整的自动化测试体系。

测试策略：
- 单元测试：覆盖率>90%
- 集成测试：关键业务流程
- E2E测试：用户核心场景
- 性能测试：响应时间和内存
- 可访问性测试：WCAG合规

测试框架：
- Vitest（单元测试）
- React Testing Library（组件测试）
- Playwright（E2E测试）
- Lighthouse（性能测试）

关键测试场景：
```typescript
// 单元测试示例
describe('BlockEditor', () => {
  it('should create new block on Enter key', () => {
    // 测试块创建
  });
  
  it('should parse page links correctly', () => {
    // 测试链接解析
  });
});

// E2E测试示例
test('user can create and edit pages', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="new-page"]');
  await page.fill('[data-testid="page-title"]', 'Test Page');
  // 验证页面创建成功
});
```

测试数据管理：
- 使用工厂模式生成测试数据
- 实现数据库种子和清理
- 模拟API响应
- 处理异步操作

CI/CD集成：
- GitHub Actions配置
- 测试报告生成
- 覆盖率统计
- 性能回归检测

请建立完整的测试体系。
```

---

## 📊 性能监控提示词

### 提示词: 性能监控系统

```
你是一个性能工程师，需要为Logseq Next实现全面的性能监控和优化系统。

监控目标：
- 应用启动时间
- 页面加载性能
- 用户交互响应
- 内存使用情况
- 网络请求优化

监控指标：
```typescript
interface PerformanceMetrics {
  // Core Web Vitals
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  
  // 自定义指标
  appStartTime: number;
  pageLoadTime: number;
  searchResponseTime: number;
  memoryUsage: number;
  bundleSize: number;
}
```

实现方案：
1. Web Vitals监控
2. 自定义性能标记
3. 内存泄漏检测
4. 网络请求分析
5. 用户体验指标

技术实现：
- Performance Observer API
- Memory API监控
- Bundle分析工具
- 实时性能仪表板
- 性能预算设置

优化建议：
- 代码分割策略
- 资源预加载
- 缓存优化
- 图片优化
- 字体优化

请实现完整的性能监控系统。
```

这些详细的开发提示词为Logseq Next项目的每个开发阶段提供了具体的指导，可以直接用于AI辅助开发，确保项目按照既定的技术标准和质量要求进行。
