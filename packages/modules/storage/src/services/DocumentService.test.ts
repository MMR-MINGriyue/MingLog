/**
 * 文档服务测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DocumentService } from './DocumentService';
import { DataAccessLayerImpl } from './DataAccessLayer';
import type { DocumentEntity, DocumentStatus, StorageConfig } from '../types';

// Mock数据访问层
const mockDataAccessLayer = {
  getConnection: vi.fn(),
  migrate: vi.fn(),
  healthCheck: vi.fn(),
  getStats: vi.fn()
};

// Mock数据库连接
const mockConnection = {
  query: vi.fn(),
  get: vi.fn(),
  run: vi.fn(),
  beginTransaction: vi.fn(),
  close: vi.fn(),
  isConnected: vi.fn(() => true)
};

// Mock事务
const mockTransaction = {
  id: 'test-transaction',
  commit: vi.fn(),
  rollback: vi.fn(),
  isCompleted: vi.fn(() => false)
};

describe('DocumentService', () => {
  let documentService: DocumentService;
  let testDocument: Omit<DocumentEntity, 'id' | 'created_at' | 'updated_at'>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 设置mock返回值
    mockDataAccessLayer.getConnection.mockResolvedValue(mockConnection);
    mockConnection.beginTransaction.mockResolvedValue(mockTransaction);
    
    documentService = new DocumentService(mockDataAccessLayer as any);
    
    testDocument = {
      title: '测试文档',
      content: [{ type: 'paragraph', children: [{ text: '测试内容' }] }],
      status: 'draft' as DocumentStatus,
      path: '/test-document',
      tags: ['测试', '文档'],
      metadata: { category: '测试' },
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
    };
  });

  describe('服务生命周期', () => {
    it('应该正确初始化服务', async () => {
      mockConnection.get.mockResolvedValue({ name: 'documents' });
      
      await documentService.initialize();
      
      expect(mockDataAccessLayer.getConnection).toHaveBeenCalled();
      expect(mockConnection.get).toHaveBeenCalledWith(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='documents'"
      );
    });

    it('应该正确启动和停止服务', async () => {
      await documentService.start();
      expect(documentService.isRunning()).toBe(true);
      
      await documentService.stop();
      expect(documentService.isRunning()).toBe(false);
    });
  });

  describe('文档CRUD操作', () => {
    it('应该创建文档', async () => {
      const mockId = 'test-doc-id';
      mockConnection.run.mockResolvedValue({ changes: 1, lastInsertRowid: 1 });
      
      // Mock generateId方法
      vi.spyOn(documentService as any, 'generateId').mockReturnValue(mockId);
      
      const result = await documentService.createDocument(testDocument);
      
      expect(result.id).toBe(mockId);
      expect(result.title).toBe(testDocument.title);
      expect(mockConnection.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO documents'),
        expect.arrayContaining([mockId, testDocument.title])
      );
    });

    it('应该根据ID获取文档', async () => {
      const mockRow = {
        id: 'test-id',
        title: '测试文档',
        content: JSON.stringify(testDocument.content),
        status: 'draft',
        parent_id: null,
        path: '/test',
        icon: null,
        cover: null,
        tags: JSON.stringify(['测试']),
        metadata: JSON.stringify({}),
        is_template: 0,
        template_id: null,
        sort_order: 0,
        permissions: JSON.stringify(testDocument.permissions),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
        updated_by: null
      };

      mockConnection.get.mockResolvedValue(mockRow);
      
      const result = await documentService.getDocumentById('test-id');
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('test-id');
      expect(result?.title).toBe('测试文档');
      expect(mockConnection.get).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM documents WHERE id = ?'),
        ['test-id']
      );
    });

    it('应该更新文档', async () => {
      const mockUpdatedRow = {
        id: 'test-id',
        title: '更新的标题',
        content: JSON.stringify(testDocument.content),
        status: 'published',
        parent_id: null,
        path: '/test',
        icon: null,
        cover: null,
        tags: JSON.stringify(['更新']),
        metadata: JSON.stringify({}),
        is_template: 0,
        template_id: null,
        sort_order: 0,
        permissions: JSON.stringify(testDocument.permissions),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
        updated_by: null
      };

      mockConnection.run.mockResolvedValue({ changes: 1, lastInsertRowid: 0 });
      mockConnection.get.mockResolvedValue(mockUpdatedRow);
      
      const result = await documentService.updateDocument('test-id', {
        title: '更新的标题',
        status: 'published' as DocumentStatus
      });
      
      expect(result.title).toBe('更新的标题');
      expect(result.status).toBe('published');
      expect(mockConnection.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE documents SET'),
        expect.arrayContaining(['更新的标题', 'published'])
      );
    });

    it('应该删除文档（软删除）', async () => {
      mockConnection.run.mockResolvedValue({ changes: 1, lastInsertRowid: 0 });
      
      await documentService.deleteDocument('test-id');
      
      expect(mockConnection.run).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE documents SET status = 'deleted'"),
        expect.arrayContaining(['test-id'])
      );
    });
  });

  describe('文档查询', () => {
    it('应该查询文档', async () => {
      const mockRows = [
        {
          id: 'doc1',
          title: '文档1',
          content: '{}',
          status: 'published',
          parent_id: null,
          path: '/doc1',
          icon: null,
          cover: null,
          tags: '[]',
          metadata: '{}',
          is_template: 0,
          template_id: null,
          sort_order: 0,
          permissions: JSON.stringify(testDocument.permissions),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null,
          updated_by: null
        }
      ];

      mockConnection.get.mockResolvedValue({ count: 1 });
      mockConnection.query.mockResolvedValue(mockRows);
      
      const result = await documentService.queryDocuments({
        limit: 10,
        offset: 0,
        filters: { status: 'published' }
      });
      
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].title).toBe('文档1');
    });

    it('应该搜索文档', async () => {
      const mockRows = [
        {
          id: 'doc1',
          title: '测试文档',
          content: JSON.stringify([{ type: 'paragraph', children: [{ text: '包含搜索关键词的内容' }] }]),
          tags: JSON.stringify(['测试']),
          metadata: '{}',
          relevance_score: 10
        }
      ];

      mockConnection.query.mockResolvedValue(mockRows);
      
      const result = await documentService.searchDocuments('测试', {
        includeContent: true,
        includeTags: true,
        limit: 10
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].document_id).toBe('doc1');
      expect(result[0].title).toBe('测试文档');
      expect(result[0].score).toBe(10);
    });
  });

  describe('文档关系管理', () => {
    it('应该获取子文档', async () => {
      const mockRows = [
        {
          id: 'child1',
          title: '子文档1',
          content: '{}',
          status: 'draft',
          parent_id: 'parent-id',
          path: '/parent/child1',
          icon: null,
          cover: null,
          tags: '[]',
          metadata: '{}',
          is_template: 0,
          template_id: null,
          sort_order: 0,
          permissions: JSON.stringify(testDocument.permissions),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null,
          updated_by: null
        }
      ];

      mockConnection.query.mockResolvedValue(mockRows);
      
      const result = await documentService.getChildDocuments('parent-id');
      
      expect(result).toHaveLength(1);
      expect(result[0].parent_id).toBe('parent-id');
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE parent_id = ?'),
        ['parent-id']
      );
    });

    it('应该移动文档', async () => {
      const mockDocument = {
        id: 'doc-id',
        parent_id: 'old-parent',
        sort_order: 0
      };

      // Mock getDocumentById
      vi.spyOn(documentService, 'getDocumentById').mockResolvedValue(mockDocument as any);
      
      // Mock checkCircularReference
      vi.spyOn(documentService as any, 'checkCircularReference').mockResolvedValue(false);
      
      // Mock getChildDocuments
      vi.spyOn(documentService, 'getChildDocuments').mockResolvedValue([]);
      
      // Mock updateDocument
      vi.spyOn(documentService, 'updateDocument').mockResolvedValue({
        ...mockDocument,
        parent_id: 'new-parent',
        sort_order: 1
      } as any);

      mockTransaction.commit.mockResolvedValue(undefined);
      
      const result = await documentService.moveDocument('doc-id', 'new-parent', 1);
      
      expect(result.parent_id).toBe('new-parent');
      expect(result.sort_order).toBe(1);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  describe('权限管理', () => {
    it('应该检查文档访问权限', async () => {
      const mockDocument = {
        id: 'doc-id',
        created_by: 'owner-id',
        permissions: {
          is_public: false,
          editors: ['editor-id'],
          viewers: ['viewer-id'],
          shared_users: ['shared-id']
        }
      };

      vi.spyOn(documentService, 'getDocumentById').mockResolvedValue(mockDocument as any);
      
      // 测试创建者权限
      const ownerAccess = await documentService.checkDocumentAccess('doc-id', 'owner-id', 'delete');
      expect(ownerAccess).toBe(true);
      
      // 测试编辑者权限
      const editorAccess = await documentService.checkDocumentAccess('doc-id', 'editor-id', 'write');
      expect(editorAccess).toBe(true);
      
      // 测试查看者权限
      const viewerAccess = await documentService.checkDocumentAccess('doc-id', 'viewer-id', 'read');
      expect(viewerAccess).toBe(true);
      
      // 测试无权限用户
      const noAccess = await documentService.checkDocumentAccess('doc-id', 'random-id', 'read');
      expect(noAccess).toBe(false);
    });

    it('应该分享文档', async () => {
      const mockDocument = {
        id: 'doc-id',
        permissions: {
          is_public: false,
          editors: [],
          viewers: [],
          shared_users: []
        }
      };

      vi.spyOn(documentService, 'getDocumentById').mockResolvedValue(mockDocument as any);
      vi.spyOn(documentService, 'updateDocument').mockResolvedValue({
        ...mockDocument,
        permissions: {
          ...mockDocument.permissions,
          editors: ['user-id']
        }
      } as any);
      
      const result = await documentService.shareDocument('doc-id', 'user-id', 'write');
      
      expect(result.permissions.editors).toContain('user-id');
    });
  });

  describe('标签管理', () => {
    it('应该根据标签获取文档', async () => {
      const mockRows = [
        {
          id: 'doc1',
          title: '标签文档',
          content: '{}',
          status: 'published',
          parent_id: null,
          path: '/tagged-doc',
          icon: null,
          cover: null,
          tags: JSON.stringify(['重要', '工作']),
          metadata: '{}',
          is_template: 0,
          template_id: null,
          sort_order: 0,
          permissions: JSON.stringify(testDocument.permissions),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null,
          updated_by: null
        }
      ];

      mockConnection.query.mockResolvedValue(mockRows);
      
      const result = await documentService.getDocumentsByTag('重要');
      
      expect(result).toHaveLength(1);
      expect(result[0].tags).toContain('重要');
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE tags LIKE ?'),
        ['%"重要"%']
      );
    });

    it('应该获取所有标签及使用次数', async () => {
      const mockRows = [
        { tags: JSON.stringify(['标签1', '标签2']) },
        { tags: JSON.stringify(['标签1', '标签3']) },
        { tags: JSON.stringify(['标签2']) }
      ];

      mockConnection.query.mockResolvedValue(mockRows);
      
      const result = await documentService.getAllTags();
      
      expect(result).toEqual([
        { tag: '标签1', count: 2 },
        { tag: '标签2', count: 2 },
        { tag: '标签3', count: 1 }
      ]);
    });
  });

  describe('错误处理', () => {
    it('应该处理必需参数验证', async () => {
      await expect(documentService.createDocument({} as any))
        .rejects.toThrow('缺少必需参数');
    });

    it('应该处理文档不存在的情况', async () => {
      mockConnection.get.mockResolvedValue(null);
      
      const result = await documentService.getDocumentById('non-existent');
      expect(result).toBeNull();
    });

    it('应该处理循环引用检测', async () => {
      vi.spyOn(documentService, 'getDocumentById').mockResolvedValue({ id: 'doc-id' } as any);
      vi.spyOn(documentService as any, 'checkCircularReference').mockResolvedValue(true);
      
      await expect(documentService.moveDocument('doc-id', 'parent-id'))
        .rejects.toThrow('移动操作会造成循环引用');
    });
  });
});
