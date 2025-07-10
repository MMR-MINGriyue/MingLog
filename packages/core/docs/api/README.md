# MingLog 双向链接系统 API 文档

## 概述

MingLog 双向链接系统提供了完整的知识管理和链接分析功能。本文档详细介绍了所有可用的 API 接口、组件和服务。

## 目录

- [核心服务](#核心服务)
- [解析器](#解析器)
- [搜索引擎](#搜索引擎)
- [图谱可视化](#图谱可视化)
- [批量操作](#批量操作)
- [性能优化](#性能优化)
- [插件系统](#插件系统)
- [类型定义](#类型定义)

## 核心服务

### LinkManagerService

链接管理服务，提供链接的创建、更新、删除和查询功能。

#### 构造函数

```typescript
constructor(options?: LinkManagerOptions)
```

#### 主要方法

##### createLink(link: PageLink | BlockLink): Promise<void>

创建新的链接。

**参数：**
- `link`: 要创建的链接对象

**示例：**
```typescript
const linkManager = new LinkManagerService();

const pageLink: PageLink = {
  id: 'link-1',
  type: 'page-reference',
  pageName: 'Target Page',
  alias: 'Target',
  position: 0,
  context: 'source-page'
};

await linkManager.createLink(pageLink);
```

##### getBacklinks(targetId: string): Promise<BacklinkInfo[]>

获取指向指定目标的所有反向链接。

**参数：**
- `targetId`: 目标页面或块的ID

**返回：**
- `Promise<BacklinkInfo[]>`: 反向链接信息数组

**示例：**
```typescript
const backlinks = await linkManager.getBacklinks('target-page');
console.log(`找到 ${backlinks.length} 个反向链接`);
```

##### updateLink(linkId: string, updates: Partial<PageLink | BlockLink>): Promise<void>

更新现有链接。

**参数：**
- `linkId`: 链接ID
- `updates`: 要更新的字段

##### deleteLink(linkId: string): Promise<void>

删除指定链接。

**参数：**
- `linkId`: 要删除的链接ID

##### getLinksFromSource(sourceId: string): Promise<(PageLink | BlockLink)[]>

获取从指定源发出的所有链接。

**参数：**
- `sourceId`: 源页面或块的ID

**返回：**
- `Promise<(PageLink | BlockLink)[]>`: 链接数组

## 解析器

### PageLinkParser

页面链接解析器，用于解析文本中的页面引用。

#### 主要方法

##### parse(content: string, context: string): PageLink[]

解析文本内容中的页面链接。

**参数：**
- `content`: 要解析的文本内容
- `context`: 解析上下文（通常是当前页面ID）

**返回：**
- `PageLink[]`: 解析出的页面链接数组

**支持的语法：**
- `[[页面名称]]` - 基本页面链接
- `[[页面名称|别名]]` - 带别名的页面链接
- `[[页面名称#标题]]` - 链接到页面的特定标题

**示例：**
```typescript
const parser = new PageLinkParser();
const content = '这个文档链接到[[重要概念]]和[[另一个页面|别名]]';
const links = parser.parse(content, 'current-page');

console.log(links);
// 输出：
// [
//   {
//     id: 'generated-id-1',
//     type: 'page-reference',
//     pageName: '重要概念',
//     alias: '重要概念',
//     position: 7,
//     context: 'current-page'
//   },
//   {
//     id: 'generated-id-2',
//     type: 'page-reference',
//     pageName: '另一个页面',
//     alias: '别名',
//     position: 17,
//     context: 'current-page'
//   }
// ]
```

### BlockLinkParser

块链接解析器，用于解析文本中的块引用。

#### 主要方法

##### parse(content: string, context: string): BlockLink[]

解析文本内容中的块链接。

**参数：**
- `content`: 要解析的文本内容
- `context`: 解析上下文

**支持的语法：**
- `((block-id))` - 基本块引用
- `((block-id|别名))` - 带别名的块引用

**示例：**
```typescript
const parser = new BlockLinkParser();
const content = '参考这个重要观点：((important-block-123))';
const links = parser.parse(content, 'current-page');
```

## 搜索引擎

### SearchEngine

高性能全文搜索引擎，支持复杂查询语法和相关性排序。

#### 构造函数

```typescript
constructor(options?: SearchEngineOptions)
```

#### 主要方法

##### addDocument(document: SearchDocument): void

添加文档到搜索索引。

**参数：**
- `document`: 要索引的文档

**示例：**
```typescript
const searchEngine = new SearchEngine();

const document: SearchDocument = {
  id: 'doc-1',
  title: '重要文档',
  content: '这是一个包含重要信息的文档',
  type: 'page',
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: ['重要', '文档']
};

searchEngine.addDocument(document);
```

##### search(query: string, options?: SearchOptions): SearchResult[]

执行搜索查询。

**参数：**
- `query`: 搜索查询字符串
- `options`: 搜索选项

**返回：**
- `SearchResult[]`: 搜索结果数组

**支持的查询语法：**
- `简单词汇` - 基本文本搜索
- `"精确短语"` - 精确短语匹配
- `词汇1 AND 词汇2` - 逻辑与操作
- `词汇1 OR 词汇2` - 逻辑或操作
- `NOT 词汇` - 逻辑非操作
- `title:标题` - 字段搜索
- `tag:标签` - 标签搜索
- `type:类型` - 类型搜索

**示例：**
```typescript
// 基本搜索
const results1 = searchEngine.search('重要文档');

// 高级搜索
const results2 = searchEngine.search('title:"重要文档" AND tag:重要', {
  highlight: true,
  limit: 10,
  sortBy: 'score'
});

// 带过滤器的搜索
const results3 = searchEngine.search('文档', {
  filters: {
    fileTypes: ['page'],
    tags: ['重要'],
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31')
    }
  }
});
```

##### getSuggestions(query: string, limit?: number): string[]

获取搜索建议。

**参数：**
- `query`: 部分查询字符串
- `limit`: 建议数量限制

**返回：**
- `string[]`: 搜索建议数组

##### updateDocument(document: SearchDocument): void

更新索引中的文档。

##### removeDocument(documentId: string): void

从索引中删除文档。

##### getStats(): SearchEngineStats

获取搜索引擎统计信息。

## 图谱可视化

### LinkGraphComponent

交互式链接图谱可视化组件。

#### Props

```typescript
interface LinkGraphComponentProps {
  data: LinkGraphData;
  width: number;
  height: number;
  layout?: 'force' | 'hierarchy' | 'circular' | 'grid';
  enableDrag?: boolean;
  enableZoom?: boolean;
  filters?: GraphFilters;
  style?: GraphStyle;
  onNodeClick?: (node: LinkGraphNode) => void;
  onNodeHover?: (node: LinkGraphNode | null) => void;
  onEdgeClick?: (edge: LinkGraphEdge) => void;
}
```

#### 使用示例

```typescript
import { LinkGraphComponent } from '@minglog/core';

const graphData = {
  nodes: [
    { id: 'node1', type: 'page', title: 'Page 1', x: 100, y: 100 },
    { id: 'node2', type: 'page', title: 'Page 2', x: 200, y: 200 }
  ],
  edges: [
    { id: 'edge1', source: 'node1', target: 'node2', type: 'page-reference' }
  ]
};

function MyComponent() {
  return (
    <LinkGraphComponent
      data={graphData}
      width={800}
      height={600}
      layout="force"
      enableDrag={true}
      enableZoom={true}
      onNodeClick={(node) => console.log('Clicked node:', node)}
    />
  );
}
```

### GraphControlPanel

图谱控制面板组件。

#### Props

```typescript
interface GraphControlPanelProps {
  layout: GraphLayout;
  filters: GraphFilters;
  style: GraphStyle;
  onLayoutChange: (layout: GraphLayout) => void;
  onFiltersChange: (filters: GraphFilters) => void;
  onStyleChange: (style: GraphStyle) => void;
  onExport: (format: 'png' | 'svg' | 'json') => void;
}
```

## 批量操作

### BatchOperationsPanel

批量操作面板组件。

#### Props

```typescript
interface BatchOperationsPanelProps {
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  onOperationExecute: (operation: BatchOperation) => void;
}
```

#### 支持的操作

- **重命名**: 批量重命名页面或文件
- **移动**: 批量移动到指定位置
- **删除**: 批量删除选中项目
- **更新链接**: 批量更新链接目标
- **修复损坏**: 自动修复损坏的链接
- **导出**: 批量导出选中内容

### LinkConsistencyChecker

链接一致性检查器。

#### 主要方法

##### checkConsistency(): Promise<ConsistencyReport>

执行完整的一致性检查。

**返回：**
- `Promise<ConsistencyReport>`: 一致性检查报告

**检查项目：**
- 损坏的链接
- 孤立的页面
- 循环引用
- 重复链接
- 无效语法

**示例：**
```typescript
const checker = new LinkConsistencyChecker(linkManager);
const report = await checker.checkConsistency();

console.log(`发现 ${report.totalIssues} 个问题`);
console.log(`可自动修复 ${report.autoFixableCount} 个问题`);

// 自动修复
const autoFixableIssues = report.issuesByType['broken-link']
  .filter(issue => issue.autoFixable)
  .map(issue => issue.id);

const fixResult = await checker.autoFix(autoFixableIssues);
console.log(`成功修复 ${fixResult.fixed} 个问题`);
```

## 性能优化

### VirtualScrollList

虚拟滚动列表组件，用于高效渲染大量列表项。

#### Props

```typescript
interface VirtualScrollListProps<T = any> {
  items: VirtualScrollItem[];
  height: number;
  itemHeight?: number;
  renderItem: (item: VirtualScrollItem, index: number) => React.ReactNode;
  overscan?: number;
  dynamicHeight?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}
```

#### 使用示例

```typescript
import { VirtualScrollList } from '@minglog/core';

const items = Array.from({ length: 10000 }, (_, i) => ({
  id: `item-${i}`,
  data: { title: `Item ${i}`, content: `Content ${i}` }
}));

function MyList() {
  return (
    <VirtualScrollList
      items={items}
      height={400}
      itemHeight={50}
      renderItem={(item, index) => (
        <div key={item.id}>
          {item.data.title}
        </div>
      )}
      onLoadMore={() => console.log('Load more')}
      hasMore={true}
    />
  );
}
```

### CacheManager

智能缓存管理器。

#### 构造函数

```typescript
constructor(options?: CacheOptions)
```

#### 主要方法

##### get<T>(key: string): T | null

获取缓存数据。

##### set<T>(key: string, data: T, ttl?: number): void

设置缓存数据。

##### delete(key: string): boolean

删除缓存数据。

##### getStats(): CacheStats

获取缓存统计信息。

**示例：**
```typescript
const cache = new CacheManager({
  maxSize: 50 * 1024 * 1024, // 50MB
  maxItems: 1000,
  defaultTTL: 30 * 60 * 1000 // 30分钟
});

// 设置缓存
cache.set('user-data', { id: 1, name: 'User' });

// 获取缓存
const userData = cache.get('user-data');

// 获取统计
const stats = cache.getStats();
console.log(`缓存命中率: ${(stats.hitRate * 100).toFixed(2)}%`);
```

## 插件系统

### PluginSystem

插件系统核心。

#### 主要方法

##### registerPlugin(plugin: Plugin): Promise<void>

注册插件。

##### activatePlugin(pluginId: string): Promise<void>

激活插件。

##### deactivatePlugin(pluginId: string): Promise<void>

停用插件。

##### getPlugins(): PluginManifest[]

获取所有插件列表。

**示例：**
```typescript
const pluginSystem = new PluginSystem(api);

// 注册插件
await pluginSystem.registerPlugin(myPlugin);

// 激活插件
await pluginSystem.activatePlugin('my-plugin-id');

// 获取插件列表
const plugins = pluginSystem.getPlugins();
```

### PluginManager

插件管理器。

#### 主要方法

##### searchPlugins(query: string): Promise<PluginPackage[]>

搜索可用插件。

##### installPlugin(packageName: string, options?: InstallOptions): Promise<void>

安装插件。

##### updatePlugin(pluginId: string): Promise<void>

更新插件。

##### uninstallPlugin(pluginId: string): Promise<void>

卸载插件。

## 类型定义

### 核心类型

```typescript
// 页面链接
interface PageLink {
  id: string;
  type: 'page-reference';
  pageName: string;
  alias?: string;
  position: number;
  context: string;
}

// 块链接
interface BlockLink {
  id: string;
  type: 'block-reference';
  blockId: string;
  alias?: string;
  position: number;
  context: string;
}

// 搜索文档
interface SearchDocument {
  id: string;
  title: string;
  content: string;
  type: 'page' | 'block';
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  author?: string;
}

// 图谱节点
interface LinkGraphNode {
  id: string;
  type: 'page' | 'block' | 'tag';
  title: string;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
}

// 图谱边
interface LinkGraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'page-reference' | 'block-reference';
  weight?: number;
}
```

## 错误处理

所有 API 方法都会抛出适当的错误。建议使用 try-catch 块来处理错误：

```typescript
try {
  await linkManager.createLink(link);
} catch (error) {
  console.error('创建链接失败:', error.message);
}
```

## 性能建议

1. **批量操作**: 使用批量 API 而不是循环调用单个操作
2. **缓存**: 合理使用 CacheManager 来缓存频繁访问的数据
3. **虚拟滚动**: 对于大列表使用 VirtualScrollList 组件
4. **懒加载**: 使用懒加载来减少初始加载时间

## 版本兼容性

当前 API 版本: `1.0.0`

API 遵循语义化版本控制。主版本号变更可能包含破坏性变更。
