/**
 * 文档服务集成测试
 * 使用真实的数据库连接进行测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DocumentService } from './DocumentService';
import { DataAccessLayerImpl } from './DataAccessLayer';
import type { DocumentEntity, DocumentStatus, StorageConfig } from '../types';

describe('DocumentService Integration Tests', () => {
  let documentService: DocumentService;
  let dataAccessLayer: DataAccessLayerImpl;
  let testConfig: StorageConfig;

  beforeEach(async () => {
    // 使用内存数据库进行测试
    testConfig = {
      database_path: ':memory:',
      enable_wal: false,
      pool_size: 1,
      query_timeout: 5000,
      enable_foreign_keys: true,
      enable_sync: false,
      backup: {
        enabled: false,
        interval: 24,
        retention_days: 1,
        backup_dir: '/tmp'
      }
    };

    dataAccessLayer = new DataAccessLayerImpl(testConfig);
    await dataAccessLayer.migrate();

    documentService = new DocumentService(dataAccessLayer);
    await documentService.initialize();
    await documentService.start();
  });

  afterEach(async () => {
    await documentService.stop();
    const connection = await dataAccessLayer.getConnection();
    await connection.close();
  });

  describe('完整的文档生命周期', () => {
    it('应该完成文档的完整生命周期', async () => {
      // 1. 创建文档
      const document = await documentService.createDocument({
        title: '集成测试文档',
        content: [{ type: 'paragraph', children: [{ text: '这是集成测试内容' }] }],
        status: 'draft' as DocumentStatus,
        path: '/integration-test',
        tags: ['集成测试', '文档'],
        metadata: { category: '测试', priority: 'high' },
        is_template: false,
        sort_order: 0,
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

      expect(document.id).toBeDefined();
      expect(document.title).toBe('集成测试文档');
      expect(document.status).toBe('draft');

      // 2. 获取文档
      const retrievedDocument = await documentService.getDocumentById(document.id);
      expect(retrievedDocument).toBeDefined();
      expect(retrievedDocument!.title).toBe('集成测试文档');

      // 3. 更新文档
      const updatedDocument = await documentService.updateDocument(document.id, {
        title: '更新的集成测试文档',
        status: 'published' as DocumentStatus,
        tags: ['集成测试', '文档', '已发布']
      });

      expect(updatedDocument.title).toBe('更新的集成测试文档');
      expect(updatedDocument.status).toBe('published');
      expect(updatedDocument.tags).toContain('已发布');

      // 4. 搜索文档
      const searchResults = await documentService.searchDocuments('集成测试');
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].document_id).toBe(document.id);

      // 5. 删除文档
      await documentService.deleteDocument(document.id);
      
      const deletedDocument = await documentService.getDocumentById(document.id);
      expect(deletedDocument).toBeNull();
    });

    it('应该正确处理文档层次结构', async () => {
      // 创建父文档
      const parentDocument = await documentService.createDocument({
        title: '父文档',
        content: [{ type: 'paragraph', children: [{ text: '父文档内容' }] }],
        status: 'published' as DocumentStatus,
        path: '/parent',
        tags: ['父级'],
        metadata: {},
        is_template: false,
        sort_order: 0,
        permissions: {
          is_public: true,
          allow_comments: true,
          allow_copy: true,
          allow_export: true,
          shared_users: [],
          editors: [],
          viewers: []
        }
      });

      // 创建子文档
      const childDocument1 = await documentService.createDocument({
        title: '子文档1',
        content: [{ type: 'paragraph', children: [{ text: '子文档1内容' }] }],
        status: 'draft' as DocumentStatus,
        parent_id: parentDocument.id,
        path: '/parent/child1',
        tags: ['子级'],
        metadata: {},
        is_template: false,
        sort_order: 0,
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

      const childDocument2 = await documentService.createDocument({
        title: '子文档2',
        content: [{ type: 'paragraph', children: [{ text: '子文档2内容' }] }],
        status: 'draft' as DocumentStatus,
        parent_id: parentDocument.id,
        path: '/parent/child2',
        tags: ['子级'],
        metadata: {},
        is_template: false,
        sort_order: 1,
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

      // 测试获取子文档
      const children = await documentService.getChildDocuments(parentDocument.id);
      expect(children).toHaveLength(2);
      expect(children[0].title).toBe('子文档1');
      expect(children[1].title).toBe('子文档2');

      // 测试获取文档路径
      const path = await documentService.getDocumentPath(childDocument1.id);
      expect(path).toHaveLength(2);
      expect(path[0].id).toBe(parentDocument.id);
      expect(path[1].id).toBe(childDocument1.id);

      // 测试移动文档
      const movedDocument = await documentService.moveDocument(childDocument2.id, null, 0);
      expect(movedDocument.parent_id).toBeNull();

      // 验证移动后的状态
      const updatedChildren = await documentService.getChildDocuments(parentDocument.id);
      expect(updatedChildren).toHaveLength(1);
      expect(updatedChildren[0].id).toBe(childDocument1.id);
    });

    it('应该正确处理权限管理', async () => {
      // 创建文档
      const document = await documentService.createDocument({
        title: '权限测试文档',
        content: [{ type: 'paragraph', children: [{ text: '权限测试内容' }] }],
        status: 'draft' as DocumentStatus,
        path: '/permission-test',
        tags: ['权限'],
        metadata: {},
        is_template: false,
        sort_order: 0,
        created_by: 'owner-user',
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

      // 测试创建者权限
      const ownerCanRead = await documentService.checkDocumentAccess(document.id, 'owner-user', 'read');
      const ownerCanWrite = await documentService.checkDocumentAccess(document.id, 'owner-user', 'write');
      const ownerCanDelete = await documentService.checkDocumentAccess(document.id, 'owner-user', 'delete');
      
      expect(ownerCanRead).toBe(true);
      expect(ownerCanWrite).toBe(true);
      expect(ownerCanDelete).toBe(true);

      // 分享文档给用户
      await documentService.shareDocument(document.id, 'editor-user', 'write');
      await documentService.shareDocument(document.id, 'viewer-user', 'read');

      // 测试编辑者权限
      const editorCanRead = await documentService.checkDocumentAccess(document.id, 'editor-user', 'read');
      const editorCanWrite = await documentService.checkDocumentAccess(document.id, 'editor-user', 'write');
      const editorCanDelete = await documentService.checkDocumentAccess(document.id, 'editor-user', 'delete');
      
      expect(editorCanRead).toBe(true);
      expect(editorCanWrite).toBe(true);
      expect(editorCanDelete).toBe(false);

      // 测试查看者权限
      const viewerCanRead = await documentService.checkDocumentAccess(document.id, 'viewer-user', 'read');
      const viewerCanWrite = await documentService.checkDocumentAccess(document.id, 'viewer-user', 'write');
      
      expect(viewerCanRead).toBe(true);
      expect(viewerCanWrite).toBe(false);

      // 测试无权限用户
      const randomCanRead = await documentService.checkDocumentAccess(document.id, 'random-user', 'read');
      expect(randomCanRead).toBe(false);

      // 取消分享
      await documentService.unshareDocument(document.id, 'viewer-user');
      const unsharedCanRead = await documentService.checkDocumentAccess(document.id, 'viewer-user', 'read');
      expect(unsharedCanRead).toBe(false);
    });

    it('应该正确处理标签管理', async () => {
      // 创建多个带标签的文档
      await documentService.createDocument({
        title: '工作文档1',
        content: [{ type: 'paragraph', children: [{ text: '工作内容1' }] }],
        status: 'published' as DocumentStatus,
        path: '/work1',
        tags: ['工作', '重要', '项目A'],
        metadata: {},
        is_template: false,
        sort_order: 0,
        permissions: {
          is_public: true,
          allow_comments: true,
          allow_copy: true,
          allow_export: true,
          shared_users: [],
          editors: [],
          viewers: []
        }
      });

      await documentService.createDocument({
        title: '工作文档2',
        content: [{ type: 'paragraph', children: [{ text: '工作内容2' }] }],
        status: 'published' as DocumentStatus,
        path: '/work2',
        tags: ['工作', '项目B'],
        metadata: {},
        is_template: false,
        sort_order: 0,
        permissions: {
          is_public: true,
          allow_comments: true,
          allow_copy: true,
          allow_export: true,
          shared_users: [],
          editors: [],
          viewers: []
        }
      });

      await documentService.createDocument({
        title: '个人文档',
        content: [{ type: 'paragraph', children: [{ text: '个人内容' }] }],
        status: 'draft' as DocumentStatus,
        path: '/personal',
        tags: ['个人', '重要'],
        metadata: {},
        is_template: false,
        sort_order: 0,
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

      // 测试根据标签获取文档
      const workDocuments = await documentService.getDocumentsByTag('工作');
      expect(workDocuments).toHaveLength(2);

      const importantDocuments = await documentService.getDocumentsByTag('重要');
      expect(importantDocuments).toHaveLength(2);

      // 测试获取所有标签
      const allTags = await documentService.getAllTags();
      expect(allTags.length).toBeGreaterThan(0);
      
      const workTag = allTags.find(tag => tag.tag === '工作');
      expect(workTag?.count).toBe(2);
      
      const importantTag = allTags.find(tag => tag.tag === '重要');
      expect(importantTag?.count).toBe(2);
    });

    it('应该正确处理文档复制', async () => {
      // 创建原始文档
      const originalDocument = await documentService.createDocument({
        title: '原始文档',
        content: [{ type: 'paragraph', children: [{ text: '原始内容' }] }],
        status: 'published' as DocumentStatus,
        path: '/original',
        tags: ['原始', '测试'],
        metadata: { category: '测试' },
        is_template: false,
        sort_order: 0,
        permissions: {
          is_public: true,
          allow_comments: true,
          allow_copy: true,
          allow_export: true,
          shared_users: [],
          editors: [],
          viewers: []
        }
      });

      // 复制文档
      const duplicatedDocument = await documentService.duplicateDocument(originalDocument.id, {
        newTitle: '复制的文档',
        copyAsTemplate: false
      });

      expect(duplicatedDocument.id).not.toBe(originalDocument.id);
      expect(duplicatedDocument.title).toBe('复制的文档');
      expect(duplicatedDocument.content).toEqual(originalDocument.content);
      expect(duplicatedDocument.tags).toEqual(originalDocument.tags);
      expect(duplicatedDocument.status).toBe('draft'); // 复制的文档应该是草稿状态
      expect(duplicatedDocument.template_id).toBe(originalDocument.id);
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内完成批量操作', async () => {
      const startTime = performance.now();
      
      // 创建多个文档
      const documents = [];
      for (let i = 0; i < 10; i++) {
        const doc = await documentService.createDocument({
          title: `性能测试文档 ${i}`,
          content: [{ type: 'paragraph', children: [{ text: `内容 ${i}` }] }],
          status: 'draft' as DocumentStatus,
          path: `/perf-test-${i}`,
          tags: ['性能测试'],
          metadata: { index: i },
          is_template: false,
          sort_order: i,
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
        documents.push(doc);
      }
      
      const createTime = performance.now() - startTime;
      expect(createTime).toBeLessThan(1000); // 应该在1秒内完成

      // 批量查询
      const queryStartTime = performance.now();
      const queryResult = await documentService.queryDocuments({
        filters: { status: 'draft' },
        limit: 20
      });
      const queryTime = performance.now() - queryStartTime;
      
      expect(queryTime).toBeLessThan(100); // 查询应该在100ms内完成
      expect(queryResult.data.length).toBeGreaterThanOrEqual(10);

      // 搜索性能
      const searchStartTime = performance.now();
      const searchResults = await documentService.searchDocuments('性能测试');
      const searchTime = performance.now() - searchStartTime;
      
      expect(searchTime).toBeLessThan(200); // 搜索应该在200ms内完成
      expect(searchResults.length).toBeGreaterThanOrEqual(10);
    });
  });
});
