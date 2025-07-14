# @minglog/storage

MingLog数据存储与管理模块，提供完整的数据持久化和管理功能。

## 🚀 功能特性

### 核心功能
- **文档管理**: 完整的文档CRUD操作、元数据管理、搜索和关系管理
- **块管理**: 块级内容管理、层次结构、内容解析和引用管理
- **版本控制**: 文档和块的版本历史、变更追踪、差异比较和回滚功能
- **数据同步**: 本地数据同步机制、冲突检测和解决
- **备份恢复**: 自动备份、数据恢复、导入导出功能
- **数据完整性**: 完整性检查、约束验证、数据修复

### 技术特性
- **高性能**: 数据库操作 < 100ms，支持连接池和事务
- **可扩展**: 模块化架构，支持插件扩展
- **类型安全**: 完整的TypeScript类型定义
- **测试覆盖**: 85%+ 测试覆盖率
- **多环境**: 支持开发、测试、生产环境配置

## 📦 安装

```bash
npm install @minglog/storage
```

## 🔧 快速开始

### 基础使用

```typescript
import { createStorageModule } from '@minglog/storage';

// 创建存储模块
const storageModule = createStorageModule({
  storage: {
    database_path: './data/minglog.db',
    enable_wal: true,
    pool_size: 10
  }
});

// 初始化和启动
await storageModule.initialize();
await storageModule.start();

// 获取服务
const documentService = storageModule.getDocumentService();
const blockService = storageModule.getBlockService();
```

### 文档操作

```typescript
// 创建文档
const document = await documentService.createDocument({
  title: '我的文档',
  content: [{ type: 'paragraph', children: [{ text: '内容' }] }],
  status: DocumentStatus.DRAFT,
  path: '/documents/my-document',
  tags: ['标签1', '标签2'],
  metadata: { category: '笔记' },
  permissions: {
    is_public: false,
    allow_comments: true,
    allow_copy: true,
    allow_export: true,
    shared_users: [],
    editors: [],
    viewers: []
  }
});

// 查询文档
const documents = await documentService.queryDocuments({
  filters: { status: DocumentStatus.PUBLISHED },
  search: '关键词',
  limit: 20,
  sort_by: 'updated_at',
  sort_order: 'desc'
});

// 更新文档
await documentService.updateDocument(document.id, {
  title: '更新的标题',
  status: DocumentStatus.PUBLISHED
});

// 获取文档
const retrievedDocument = await documentService.getDocumentById('document-id');

// 删除文档（软删除）
await documentService.deleteDocument('document-id');

// 全文搜索
const searchResults = await documentService.searchDocuments('关键词', {
  includeContent: true,
  includeTags: true,
  includeMetadata: true,
  limit: 20
});

// 文档关系管理
const children = await documentService.getChildDocuments('parent-id');
const documentPath = await documentService.getDocumentPath('document-id');
const movedDocument = await documentService.moveDocument('doc-id', 'new-parent-id', 1);

// 文档复制
const duplicatedDocument = await documentService.duplicateDocument('doc-id', {
  newTitle: '副本文档',
  includeChildren: true,
  copyAsTemplate: false
});

// 标签管理
const taggedDocuments = await documentService.getDocumentsByTag('重要');
const allTags = await documentService.getAllTags();

// 权限管理
const hasReadAccess = await documentService.checkDocumentAccess('doc-id', 'user-id', 'read');
const hasWriteAccess = await documentService.checkDocumentAccess('doc-id', 'user-id', 'write');

// 分享文档
await documentService.shareDocument('doc-id', 'user-id', 'write');
await documentService.shareDocument('doc-id', 'another-user-id', 'read');

// 取消分享
await documentService.unshareDocument('doc-id', 'user-id');

// 更新权限
await documentService.updateDocumentPermissions('doc-id', {
  is_public: true,
  allow_comments: false
});
```

### 块操作

```typescript
// 创建块
const block = await blockService.createBlock({
  document_id: document.id,
  type: BlockType.PARAGRAPH,
  content: { text: '块内容' },
  path: 'block-1',
  sort_order: 0,
  properties: { style: 'normal' }
});

// 获取文档的所有块
const blocks = await blockService.getBlocksByDocumentId(document.id);

// 移动块
await blockService.moveBlock(block.id, newParentId, newSortOrder);
```

### 版本控制

```typescript
const versionManager = storageModule.getVersionManager();

// 创建版本记录
await versionManager.createVersion({
  entity_id: document.id,
  entity_type: 'document',
  version: 1,
  content: document.content,
  change_type: 'create',
  change_description: '创建文档'
});

// 获取版本历史
const versions = await versionManager.getVersionHistory(document.id, 'document');

// 版本回滚
await versionManager.rollbackToVersion(document.id, 'document', 1);
```

### 数据同步和备份

```typescript
const syncManager = storageModule.getSyncManager();

// 创建备份
const backupPath = await syncManager.createBackup();

// 导出数据
const exportPath = await syncManager.exportData({
  format: 'json',
  include_metadata: true,
  include_versions: true,
  include_deleted: false
});

// 数据完整性检查
const integrity = await syncManager.checkDataIntegrity();
```

## ⚙️ 配置

### 环境配置

```typescript
import { storageModuleFactory } from '@minglog/storage';

// 开发环境
const devModule = storageModuleFactory.createDevelopmentConfig({
  storage: {
    database_path: './data/dev/minglog.db'
  }
});

// 测试环境
const testModule = storageModuleFactory.createTestConfig();

// 生产环境
const prodModule = storageModuleFactory.createProductionConfig({
  storage: {
    pool_size: 20,
    backup: {
      interval: 6, // 6小时备份一次
      retention_days: 90
    }
  }
});
```

### 配置构建器

```typescript
const config = storageModuleFactory.createConfigBuilder()
  .databasePath('./custom/path.db')
  .enableWAL(true)
  .poolSize(15)
  .queryTimeout(30000)
  .backup({
    enabled: true,
    interval: 12,
    retention_days: 60,
    backup_dir: './backups'
  })
  .build();

const module = storageModuleFactory.create(config);
```

## 🧪 测试

```bash
# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行测试UI
npm run test:ui
```

## 📊 性能指标

- **数据库查询**: < 100ms
- **数据库写入**: < 200ms
- **事务操作**: < 500ms
- **同步操作**: < 5s
- **备份操作**: < 10s

## 🔒 数据安全

- **事务支持**: 确保数据一致性
- **外键约束**: 维护数据完整性
- **自动备份**: 定期数据备份
- **版本控制**: 变更历史追踪
- **完整性检查**: 定期数据验证

## 🏗️ 架构设计

```
StorageModule
├── DocumentService     # 文档管理服务
├── BlockService       # 块管理服务
├── VersionManager     # 版本控制管理器
├── SyncManager        # 同步管理器
└── DataAccessLayer    # 数据访问层
    └── DatabaseConnection # 数据库连接
```

## 📝 API 文档

详细的API文档请参考 [API Documentation](./docs/api.md)

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](../../CONTRIBUTING.md)

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件
