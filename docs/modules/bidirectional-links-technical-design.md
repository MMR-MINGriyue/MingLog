# 🔗 MingLog 双向链接系统技术设计文档

**设计日期**: 2025-01-09  
**开发周期**: 4周  
**优先级**: P0 (最高优先级)

## 🎯 功能目标

实现完整的双向链接系统，包括：
- `[[页面名称]]` 语法解析和渲染
- 反向链接面板显示
- 链接图谱可视化
- 块级引用 `((块ID))` 功能
- 自动补全和搜索建议

## 🏗️ 技术架构设计

### 1. 数据模型设计

#### 链接关系表 (links)
```sql
CREATE TABLE links (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL, -- 'page' | 'block'
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'page' | 'block'
  target_id TEXT NOT NULL,
  link_type TEXT NOT NULL, -- 'page-reference' | 'block-reference'
  context TEXT, -- 链接上下文文本
  position INTEGER, -- 在源内容中的位置
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(source_type, source_id, target_type, target_id, position)
);

CREATE INDEX idx_links_source ON links(source_type, source_id);
CREATE INDEX idx_links_target ON links(target_type, target_id);
CREATE INDEX idx_links_type ON links(link_type);
```

#### 页面别名表 (page_aliases)
```sql
CREATE TABLE page_aliases (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  alias TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (page_id) REFERENCES notes(id) ON DELETE CASCADE,
  UNIQUE(alias)
);

CREATE INDEX idx_page_aliases_page_id ON page_aliases(page_id);
CREATE INDEX idx_page_aliases_alias ON page_aliases(alias);
```

### 2. 核心组件架构

```typescript
// 链接解析器
interface LinkParser {
  parsePageLinks(content: string): PageLink[]
  parseBlockLinks(content: string): BlockLink[]
  extractLinkContext(content: string, position: number): string
}

// 链接管理器
interface LinkManager {
  createLink(link: CreateLinkRequest): Promise<Link>
  updateLinks(sourceId: string, content: string): Promise<void>
  getBacklinks(targetId: string): Promise<Link[]>
  getForwardLinks(sourceId: string): Promise<Link[]>
  deleteLinksForSource(sourceId: string): Promise<void>
}

// 链接渲染器
interface LinkRenderer {
  renderPageLink(link: PageLink): React.ReactElement
  renderBlockLink(link: BlockLink): React.ReactElement
  renderBrokenLink(link: BrokenLink): React.ReactElement
}
```

### 3. 语法解析实现

#### 页面链接解析 `[[页面名称]]`
```typescript
export class PageLinkParser {
  private static readonly PAGE_LINK_REGEX = /\[\[([^\]]+)\]\]/g;
  
  parsePageLinks(content: string): PageLink[] {
    const links: PageLink[] = [];
    let match;
    
    while ((match = this.PAGE_LINK_REGEX.exec(content)) !== null) {
      const [fullMatch, linkText] = match;
      const position = match.index;
      
      // 解析别名 [[页面名称|显示文本]]
      const [pageName, displayText] = linkText.split('|');
      
      links.push({
        type: 'page-reference',
        pageName: pageName.trim(),
        displayText: displayText?.trim() || pageName.trim(),
        position,
        length: fullMatch.length,
        context: this.extractContext(content, position)
      });
    }
    
    return links;
  }
}
```

#### 块引用解析 `((块ID))`
```typescript
export class BlockLinkParser {
  private static readonly BLOCK_LINK_REGEX = /\(\(([^)]+)\)\)/g;
  
  parseBlockLinks(content: string): BlockLink[] {
    const links: BlockLink[] = [];
    let match;
    
    while ((match = this.BLOCK_LINK_REGEX.exec(content)) !== null) {
      const [fullMatch, blockId] = match;
      const position = match.index;
      
      links.push({
        type: 'block-reference',
        blockId: blockId.trim(),
        position,
        length: fullMatch.length,
        context: this.extractContext(content, position)
      });
    }
    
    return links;
  }
}
```

### 4. 链接管理服务

```typescript
export class LinkManagerService {
  constructor(
    private database: DatabaseConnection,
    private eventBus: EventBus
  ) {}
  
  async updateLinksForContent(
    sourceType: 'page' | 'block',
    sourceId: string,
    content: string
  ): Promise<void> {
    // 1. 删除旧链接
    await this.deleteLinksForSource(sourceType, sourceId);
    
    // 2. 解析新链接
    const pageLinks = this.pageParser.parsePageLinks(content);
    const blockLinks = this.blockParser.parseBlockLinks(content);
    
    // 3. 创建新链接记录
    for (const link of pageLinks) {
      await this.createPageLink(sourceType, sourceId, link);
    }
    
    for (const link of blockLinks) {
      await this.createBlockLink(sourceType, sourceId, link);
    }
    
    // 4. 发送事件通知
    this.eventBus.emit('links:updated', {
      sourceType,
      sourceId,
      linkCount: pageLinks.length + blockLinks.length
    });
  }
  
  async getBacklinks(targetId: string): Promise<BacklinkInfo[]> {
    const query = `
      SELECT 
        l.*,
        n.title as source_title,
        n.content as source_content
      FROM links l
      LEFT JOIN notes n ON l.source_id = n.id
      WHERE l.target_id = ? AND l.target_type = 'page'
      ORDER BY l.created_at DESC
    `;
    
    const results = await this.database.query(query, [targetId]);
    return results.map(row => this.mapToBacklinkInfo(row));
  }
}
```

## 🎨 UI组件设计

### 1. 链接渲染组件

```typescript
// 页面链接组件
export const PageLinkComponent: React.FC<PageLinkProps> = ({
  pageName,
  displayText,
  exists,
  onClick
}) => {
  const className = exists 
    ? 'page-link page-link--exists' 
    : 'page-link page-link--broken';
    
  return (
    <span 
      className={className}
      onClick={() => onClick(pageName)}
      title={exists ? `跳转到 ${pageName}` : `创建页面 ${pageName}`}
    >
      {displayText}
    </span>
  );
};

// 块引用组件
export const BlockReferenceComponent: React.FC<BlockReferenceProps> = ({
  blockId,
  blockContent,
  exists
}) => {
  if (!exists) {
    return <span className="block-reference block-reference--broken">((已删除的块))</span>;
  }
  
  return (
    <div className="block-reference">
      <div className="block-reference__content">
        {blockContent}
      </div>
      <div className="block-reference__meta">
        引用块 {blockId.slice(0, 8)}...
      </div>
    </div>
  );
};
```

### 2. 反向链接面板

```typescript
export const BacklinksPanel: React.FC<BacklinksPanelProps> = ({
  targetId,
  isOpen,
  onClose
}) => {
  const { backlinks, loading } = useBacklinks(targetId);
  
  return (
    <div className={`backlinks-panel ${isOpen ? 'open' : ''}`}>
      <div className="backlinks-panel__header">
        <h3>反向链接 ({backlinks.length})</h3>
        <button onClick={onClose}>×</button>
      </div>
      
      <div className="backlinks-panel__content">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <BacklinksList backlinks={backlinks} />
        )}
      </div>
    </div>
  );
};
```

### 3. 链接图谱组件

```typescript
export const LinkGraphComponent: React.FC<LinkGraphProps> = ({
  centerNodeId,
  maxDepth = 2,
  onNodeClick
}) => {
  const { nodes, links, loading } = useLinkGraph(centerNodeId, maxDepth);
  
  useEffect(() => {
    if (!loading && nodes.length > 0) {
      initializeD3Graph(nodes, links, onNodeClick);
    }
  }, [nodes, links, loading]);
  
  return (
    <div className="link-graph">
      <div className="link-graph__controls">
        <button onClick={() => setMaxDepth(1)}>1层</button>
        <button onClick={() => setMaxDepth(2)}>2层</button>
        <button onClick={() => setMaxDepth(3)}>3层</button>
      </div>
      
      <svg 
        ref={svgRef}
        className="link-graph__svg"
        width="100%" 
        height="400"
      />
    </div>
  );
};
```

## 🔧 集成到编辑器

### 1. 编辑器插件

```typescript
// Slate.js 插件
export const withLinks = (editor: Editor) => {
  const { insertText, deleteBackward } = editor;
  
  // 拦截输入，实时解析链接
  editor.insertText = (text) => {
    insertText(text);
    
    // 检查是否完成了链接输入
    if (text === ']' && isInPageLink(editor)) {
      const linkText = getCurrentLinkText(editor);
      if (linkText) {
        // 转换为链接元素
        convertToLinkElement(editor, linkText);
      }
    }
  };
  
  return editor;
};
```

### 2. 自动补全功能

```typescript
export const LinkAutoComplete: React.FC<LinkAutoCompleteProps> = ({
  query,
  position,
  onSelect,
  onClose
}) => {
  const { suggestions, loading } = useLinkSuggestions(query);
  
  return (
    <div 
      className="link-autocomplete"
      style={{ 
        position: 'absolute',
        top: position.top,
        left: position.left
      }}
    >
      {suggestions.map(suggestion => (
        <div 
          key={suggestion.id}
          className="link-autocomplete__item"
          onClick={() => onSelect(suggestion)}
        >
          <div className="title">{suggestion.title}</div>
          <div className="preview">{suggestion.preview}</div>
        </div>
      ))}
    </div>
  );
};
```

## 📅 开发计划

### Week 1: 基础架构
- [ ] 数据库表设计和创建
- [ ] 核心接口定义
- [ ] 链接解析器实现
- [ ] 基础测试用例

### Week 2: 链接管理
- [ ] LinkManager服务实现
- [ ] 数据库操作层
- [ ] 事件系统集成
- [ ] 性能优化

### Week 3: UI组件
- [ ] 链接渲染组件
- [ ] 反向链接面板
- [ ] 自动补全组件
- [ ] 样式设计

### Week 4: 编辑器集成
- [ ] 编辑器插件开发
- [ ] 实时链接解析
- [ ] 链接图谱可视化
- [ ] 完整测试和优化

## 🎯 成功指标

- ✅ 支持 `[[页面名称]]` 和 `((块ID))` 语法
- ✅ 实时反向链接更新
- ✅ 链接图谱可视化
- ✅ 自动补全功能
- 📊 链接解析性能 <10ms
- 📊 反向链接查询 <100ms
- 📊 用户体验流畅度 >95%
