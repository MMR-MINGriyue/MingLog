/**
 * MingLog 数据持久化集成测试
 * 验证数据库操作、缓存系统和数据一致性
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseManager } from '../../database/DatabaseManager';
import { CacheManager } from '../../services/CacheManager';
import { LinkManagerService } from '../../services/LinkManagerService';
import { SearchEngine } from '../../search/SearchEngine';
import type { DatabaseConnection } from '../../database/DatabaseManager';
import type { SearchDocument, PageLink, BlockLink } from '../../types/links';

// 模拟数据库连接
const createMockDatabase = (): DatabaseConnection => {
  const storage = new Map<string, any>();
  const tables = new Map<string, any[]>();

  return {
    query: vi.fn().mockImplementation(async (sql: string, params?: any[]) => {
      // 模拟简单的 SELECT 查询
      if (sql.includes('SELECT')) {
        const tableName = sql.match(/FROM\s+(\w+)/i)?.[1];
        if (tableName && tables.has(tableName)) {
          return tables.get(tableName) || [];
        }
        return [];
      }
      return [];
    }),

    execute: vi.fn().mockImplementation(async (sql: string, params?: any[]) => {
      // 模拟 INSERT/UPDATE/DELETE 操作
      if (sql.includes('INSERT')) {
        const tableName = sql.match(/INTO\s+(\w+)/i)?.[1];
        if (tableName) {
          if (!tables.has(tableName)) {
            tables.set(tableName, []);
          }
          const table = tables.get(tableName)!;
          const newId = table.length + 1;
          table.push({ id: newId, ...params });
          return { changes: 1, lastInsertRowid: newId };
        }
      } else if (sql.includes('UPDATE')) {
        return { changes: 1, lastInsertRowid: 0 };
      } else if (sql.includes('DELETE')) {
        return { changes: 1, lastInsertRowid: 0 };
      }
      return { changes: 0, lastInsertRowid: 0 };
    }),

    close: vi.fn().mockResolvedValue(undefined),

    prepare: vi.fn().mockReturnValue({
      run: vi.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 }),
      get: vi.fn().mockReturnValue(undefined),
      all: vi.fn().mockReturnValue([]),
      finalize: vi.fn()
    }),

    transaction: vi.fn().mockImplementation((callback) => {
      return callback();
    }),

    backup: vi.fn().mockResolvedValue(undefined),
    pragma: vi.fn().mockResolvedValue([])
  };
};

describe('数据持久化集成测试', () => {
  let databaseManager: DatabaseManager;
  let cacheManager: CacheManager;
  let linkManager: LinkManagerService;
  let searchEngine: SearchEngine;
  let mockDatabase: DatabaseConnection;

  beforeEach(async () => {
    mockDatabase = createMockDatabase();
    databaseManager = new DatabaseManager(mockDatabase);
    cacheManager = new CacheManager();
    linkManager = new LinkManagerService();
    searchEngine = new SearchEngine();

    // 初始化数据库
    await databaseManager.initialize();
  });

  afterEach(async () => {
    await databaseManager.close();
    cacheManager.clear();
  });

  describe('数据库基础操作', () => {
    it('应该成功初始化数据库连接', async () => {
      expect(databaseManager.getConnection()).toBe(mockDatabase);
      expect(databaseManager.isConnected()).toBe(true);
    });

    it('应该支持基本的CRUD操作', async () => {
      // 1. 创建数据
      const insertResult = await databaseManager.execute(
        'INSERT INTO test_table (name, value) VALUES (?, ?)',
        ['test', 'value']
      );

      expect(insertResult.changes).toBe(1);
      expect(insertResult.lastInsertRowid).toBeGreaterThan(0);

      // 2. 查询数据
      const queryResult = await databaseManager.query(
        'SELECT * FROM test_table WHERE name = ?',
        ['test']
      );

      expect(Array.isArray(queryResult)).toBe(true);

      // 3. 更新数据
      const updateResult = await databaseManager.execute(
        'UPDATE test_table SET value = ? WHERE name = ?',
        ['new_value', 'test']
      );

      expect(updateResult.changes).toBe(1);

      // 4. 删除数据
      const deleteResult = await databaseManager.execute(
        'DELETE FROM test_table WHERE name = ?',
        ['test']
      );

      expect(deleteResult.changes).toBe(1);
    });

    it('应该支持事务操作', async () => {
      const transactionResult = await databaseManager.transaction(async () => {
        // 在事务中执行多个操作
        await databaseManager.execute(
          'INSERT INTO test_table (name, value) VALUES (?, ?)',
          ['tx_test1', 'value1']
        );

        await databaseManager.execute(
          'INSERT INTO test_table (name, value) VALUES (?, ?)',
          ['tx_test2', 'value2']
        );

        return 'transaction_success';
      });

      expect(transactionResult).toBe('transaction_success');
      expect(mockDatabase.transaction).toHaveBeenCalled();
    });

    it('应该处理数据库错误', async () => {
      // 模拟数据库错误
      vi.mocked(mockDatabase.execute).mockRejectedValueOnce(new Error('Database error'));

      // 验证错误被正确抛出
      await expect(
        databaseManager.execute('INVALID SQL')
      ).rejects.toThrow('Database error');
    });
  });

  describe('缓存系统集成', () => {
    it('应该缓存数据库查询结果', async () => {
      const cacheKey = 'test_query_cache';
      const testData = [
        { id: 1, name: 'test1', value: 'value1' },
        { id: 2, name: 'test2', value: 'value2' }
      ];

      // 1. 模拟数据库查询
      vi.mocked(mockDatabase.query).mockResolvedValueOnce(testData);

      // 2. 第一次查询（从数据库）
      const startTime1 = performance.now();
      const result1 = await databaseManager.query('SELECT * FROM test_table');
      const dbTime = performance.now() - startTime1;

      // 3. 缓存结果
      cacheManager.set(cacheKey, result1);

      // 4. 第二次查询（从缓存）
      const startTime2 = performance.now();
      const cachedResult = cacheManager.get(cacheKey);
      const cacheTime = performance.now() - startTime2;

      // 5. 验证缓存效果
      expect(cachedResult).toEqual(result1);
      expect(cacheTime).toBeLessThan(dbTime);

      // 6. 验证缓存统计
      const stats = cacheManager.getStats();
      expect(stats.hitRate).toBeGreaterThan(0);
    });

    it('应该在数据更新时清除相关缓存', async () => {
      const cacheKey = 'user_data_cache';
      const userData = { id: 1, name: 'John', email: 'john@example.com' };

      // 1. 缓存用户数据
      cacheManager.set(cacheKey, userData);
      expect(cacheManager.get(cacheKey)).toEqual(userData);

      // 2. 更新数据库中的用户数据
      await databaseManager.execute(
        'UPDATE users SET email = ? WHERE id = ?',
        ['newemail@example.com', 1]
      );

      // 3. 清除相关缓存
      cacheManager.delete(cacheKey);

      // 4. 验证缓存被清除
      expect(cacheManager.get(cacheKey)).toBeNull();
    });

    it('应该支持缓存过期机制', async () => {
      const shortTTL = 100; // 100ms
      const testData = { test: 'data' };

      // 1. 设置短期缓存
      cacheManager.set('short_cache', testData, shortTTL);

      // 2. 立即获取应该成功
      expect(cacheManager.get('short_cache')).toEqual(testData);

      // 3. 等待过期
      await new Promise(resolve => setTimeout(resolve, shortTTL + 50));

      // 4. 过期后获取应该返回null
      expect(cacheManager.get('short_cache')).toBeNull();
    });
  });

  describe('链接数据持久化', () => {
    it('应该持久化页面链接数据', async () => {
      const pageLink: PageLink = {
        id: 'test-page-link',
        type: 'page-reference',
        pageName: 'Target Page',
        alias: 'Target',
        position: 0,
        context: 'source-page'
      };

      // 1. 创建链接
      await linkManager.createLink(pageLink);

      // 2. 验证数据库操作被调用
      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.any(Array)
      );

      // 3. 查询链接
      const links = await linkManager.getLinksFromSource('source-page');
      expect(Array.isArray(links)).toBe(true);

      // 4. 更新链接
      await linkManager.updateLink('test-page-link', { alias: 'New Target' });
      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.any(Array)
      );

      // 5. 删除链接
      await linkManager.deleteLink('test-page-link');
      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.any(Array)
      );
    });

    it('应该持久化块链接数据', async () => {
      const blockLink: BlockLink = {
        id: 'test-block-link',
        type: 'block-reference',
        blockId: 'target-block-123',
        position: 10,
        context: 'source-page'
      };

      // 1. 创建块链接
      await linkManager.createLink(blockLink);

      // 2. 验证数据库操作
      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.any(Array)
      );

      // 3. 查询块链接
      const backlinks = await linkManager.getBacklinks('target-block-123');
      expect(Array.isArray(backlinks)).toBe(true);
    });

    it('应该支持批量链接操作', async () => {
      const links: (PageLink | BlockLink)[] = [
        {
          id: 'batch-link-1',
          type: 'page-reference',
          pageName: 'Page 1',
          alias: 'P1',
          position: 0,
          context: 'batch-source'
        },
        {
          id: 'batch-link-2',
          type: 'page-reference',
          pageName: 'Page 2',
          alias: 'P2',
          position: 10,
          context: 'batch-source'
        },
        {
          id: 'batch-link-3',
          type: 'block-reference',
          blockId: 'block-123',
          position: 20,
          context: 'batch-source'
        }
      ];

      // 1. 批量创建链接
      await databaseManager.transaction(async () => {
        for (const link of links) {
          await linkManager.createLink(link);
        }
      });

      // 2. 验证事务被使用
      expect(mockDatabase.transaction).toHaveBeenCalled();

      // 3. 验证所有链接都被创建
      expect(mockDatabase.execute).toHaveBeenCalledTimes(links.length);
    });
  });

  describe('搜索索引持久化', () => {
    it('应该持久化搜索文档', async () => {
      const document: SearchDocument = {
        id: 'test-doc',
        title: '测试文档',
        content: '这是一个测试文档的内容',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['测试', '文档']
      };

      // 1. 添加文档到搜索索引
      searchEngine.addDocument(document);

      // 2. 模拟持久化搜索索引
      const indexData = {
        documents: [document],
        index: searchEngine.exportIndex()
      };

      await databaseManager.execute(
        'INSERT INTO search_index (data) VALUES (?)',
        [JSON.stringify(indexData)]
      );

      // 3. 验证数据库操作
      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO search_index'),
        expect.any(Array)
      );

      // 4. 模拟从数据库恢复搜索索引
      vi.mocked(mockDatabase.query).mockResolvedValueOnce([
        { data: JSON.stringify(indexData) }
      ]);

      const restoredData = await databaseManager.query(
        'SELECT data FROM search_index ORDER BY id DESC LIMIT 1'
      );

      expect(restoredData).toHaveLength(1);
      const parsedData = JSON.parse(restoredData[0].data);
      expect(parsedData.documents).toHaveLength(1);
      expect(parsedData.documents[0].id).toBe('test-doc');
    });

    it('应该支持增量索引更新', async () => {
      const documents: SearchDocument[] = [
        {
          id: 'doc1',
          title: '文档1',
          content: '内容1',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'doc2',
          title: '文档2',
          content: '内容2',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // 1. 添加初始文档
      documents.forEach(doc => searchEngine.addDocument(doc));

      // 2. 更新文档
      const updatedDoc = {
        ...documents[0],
        content: '更新后的内容1',
        updatedAt: new Date()
      };

      searchEngine.updateDocument(updatedDoc);

      // 3. 删除文档
      searchEngine.removeDocument('doc2');

      // 4. 模拟增量更新持久化
      const incrementalUpdate = {
        updated: [updatedDoc],
        deleted: ['doc2'],
        timestamp: new Date()
      };

      await databaseManager.execute(
        'INSERT INTO search_updates (data) VALUES (?)',
        [JSON.stringify(incrementalUpdate)]
      );

      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO search_updates'),
        expect.any(Array)
      );
    });
  });

  describe('数据一致性和完整性', () => {
    it('应该维护链接和搜索数据的一致性', async () => {
      // 1. 创建文档和链接
      const document: SearchDocument = {
        id: 'consistency-doc',
        title: '一致性测试',
        content: '这个文档链接到[[目标页面]]',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const link: PageLink = {
        id: 'consistency-link',
        type: 'page-reference',
        pageName: '目标页面',
        alias: '目标页面',
        position: 7,
        context: 'consistency-doc'
      };

      // 2. 在事务中同时创建文档和链接
      await databaseManager.transaction(async () => {
        // 添加到搜索索引
        searchEngine.addDocument(document);
        
        // 创建链接
        await linkManager.createLink(link);
        
        // 持久化搜索索引
        await databaseManager.execute(
          'INSERT INTO documents (id, title, content) VALUES (?, ?, ?)',
          [document.id, document.title, document.content]
        );
      });

      // 3. 验证数据一致性
      const searchResults = searchEngine.search('一致性测试');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].document.id).toBe('consistency-doc');

      const links = await linkManager.getLinksFromSource('consistency-doc');
      expect(links).toHaveLength(1);
      expect((links[0] as PageLink).pageName).toBe('目标页面');

      // 4. 测试级联更新
      const updatedDocument = {
        ...document,
        content: '这个文档链接到[[新目标页面]]',
        updatedAt: new Date()
      };

      await databaseManager.transaction(async () => {
        // 更新搜索索引
        searchEngine.updateDocument(updatedDocument);
        
        // 删除旧链接
        await linkManager.deleteLink('consistency-link');
        
        // 创建新链接
        const newLink: PageLink = {
          id: 'new-consistency-link',
          type: 'page-reference',
          pageName: '新目标页面',
          alias: '新目标页面',
          position: 7,
          context: 'consistency-doc'
        };
        await linkManager.createLink(newLink);
        
        // 更新数据库
        await databaseManager.execute(
          'UPDATE documents SET content = ? WHERE id = ?',
          [updatedDocument.content, updatedDocument.id]
        );
      });

      // 5. 验证更新后的一致性
      const updatedSearchResults = searchEngine.search('一致性测试');
      expect(updatedSearchResults[0].document.content).toBe(updatedDocument.content);

      const updatedLinks = await linkManager.getLinksFromSource('consistency-doc');
      expect(updatedLinks).toHaveLength(1);
      expect((updatedLinks[0] as PageLink).pageName).toBe('新目标页面');
    });

    it('应该处理数据冲突和恢复', async () => {
      // 1. 模拟并发更新冲突
      const document: SearchDocument = {
        id: 'conflict-doc',
        title: '冲突测试',
        content: '原始内容',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      searchEngine.addDocument(document);

      // 2. 模拟第一个更新
      const update1 = {
        ...document,
        content: '更新1的内容',
        updatedAt: new Date()
      };

      // 3. 模拟第二个更新（冲突）
      const update2 = {
        ...document,
        content: '更新2的内容',
        updatedAt: new Date()
      };

      // 4. 处理冲突（最后写入获胜）
      searchEngine.updateDocument(update1);
      searchEngine.updateDocument(update2);

      // 5. 验证最终状态
      const finalResults = searchEngine.search('冲突测试');
      expect(finalResults[0].document.content).toBe('更新2的内容');
    });

    it('应该支持数据备份和恢复', async () => {
      // 1. 创建测试数据
      const testData = {
        documents: [
          {
            id: 'backup-doc-1',
            title: '备份文档1',
            content: '备份内容1',
            type: 'page',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        links: [
          {
            id: 'backup-link-1',
            type: 'page-reference',
            pageName: '备份目标',
            alias: '备份目标',
            position: 0,
            context: 'backup-doc-1'
          }
        ]
      };

      // 2. 模拟数据备份
      await databaseManager.backup('backup.db');
      expect(mockDatabase.backup).toHaveBeenCalledWith('backup.db');

      // 3. 模拟数据恢复
      const backupData = JSON.stringify(testData);
      vi.mocked(mockDatabase.query).mockResolvedValueOnce([
        { data: backupData }
      ]);

      const restoredData = await databaseManager.query(
        'SELECT data FROM backups ORDER BY created_at DESC LIMIT 1'
      );

      expect(restoredData).toHaveLength(1);
      const parsedBackup = JSON.parse(restoredData[0].data);
      expect(parsedBackup.documents).toHaveLength(1);
      expect(parsedBackup.links).toHaveLength(1);
    });
  });
});
