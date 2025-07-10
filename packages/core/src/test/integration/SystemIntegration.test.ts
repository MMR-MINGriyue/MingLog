/**
 * MingLog 系统集成测试
 * 测试所有模块的协同工作和完整的用户工作流程
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LinkManagerService } from '../../services/LinkManagerService';
import { SearchEngine } from '../../search/SearchEngine';
import { LinkConsistencyChecker } from '../../services/LinkConsistencyChecker';
import { PageLinkParser } from '../../parsers/PageLinkParser';
import { BlockLinkParser } from '../../parsers/BlockLinkParser';
import { CacheManager } from '../../services/CacheManager';
import { PerformanceMonitor } from '../../services/PerformanceMonitor';
import { PluginSystem } from '../../plugins/PluginSystem';
import { testUtils } from '@test/setup';
import type { SearchDocument, PageLink, BlockLink } from '../../types/links';

describe('系统集成测试', () => {
  let linkManager: LinkManagerService;
  let searchEngine: SearchEngine;
  let consistencyChecker: LinkConsistencyChecker;
  let pageLinkParser: PageLinkParser;
  let blockLinkParser: BlockLinkParser;
  let cacheManager: CacheManager;
  let performanceMonitor: PerformanceMonitor;
  let pluginSystem: PluginSystem;

  beforeEach(async () => {
    // 初始化所有服务
    linkManager = new LinkManagerService();
    searchEngine = new SearchEngine();
    consistencyChecker = new LinkConsistencyChecker(linkManager);
    pageLinkParser = new PageLinkParser();
    blockLinkParser = new BlockLinkParser();
    cacheManager = new CacheManager();
    performanceMonitor = new PerformanceMonitor();
    
    // 模拟插件API
    const mockAPI = {
      links: linkManager,
      search: searchEngine,
      ui: {
        addMenuItem: vi.fn(),
        showNotification: vi.fn()
      },
      fs: {
        read: vi.fn(),
        write: vi.fn()
      }
    };
    
    pluginSystem = new PluginSystem(mockAPI);
    
    performanceMonitor.start();
  });

  afterEach(() => {
    performanceMonitor.stop();
  });

  describe('完整的知识管理工作流程', () => {
    it('应该支持完整的页面创建、链接和搜索流程', async () => {
      // 1. 创建第一个页面
      const page1Content = '这是关于[[机器学习]]的介绍页面，它与[[深度学习]]密切相关。';
      const page1: SearchDocument = {
        id: 'page1',
        title: '人工智能基础',
        content: page1Content,
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['AI', '基础']
      };

      // 2. 解析页面中的链接
      const page1Links = pageLinkParser.parse(page1Content, page1.id);
      expect(page1Links).toHaveLength(2);
      expect(page1Links[0].pageName).toBe('机器学习');
      expect(page1Links[1].pageName).toBe('深度学习');

      // 3. 创建链接
      for (const link of page1Links) {
        await linkManager.createLink(link);
      }

      // 4. 添加页面到搜索索引
      searchEngine.addDocument(page1);

      // 5. 创建第二个页面
      const page2Content = '[[机器学习]]是[[人工智能]]的一个重要分支，包含监督学习和无监督学习。';
      const page2: SearchDocument = {
        id: 'page2',
        title: '机器学习',
        content: page2Content,
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['AI', '机器学习']
      };

      // 6. 解析第二个页面的链接
      const page2Links = pageLinkParser.parse(page2Content, page2.id);
      for (const link of page2Links) {
        await linkManager.createLink(link);
      }

      searchEngine.addDocument(page2);

      // 7. 验证反向链接
      const mlBacklinks = await linkManager.getBacklinks('机器学习');
      expect(mlBacklinks).toHaveLength(2); // 来自page1和page2

      // 8. 验证搜索功能
      const searchResults = searchEngine.search('机器学习');
      expect(searchResults).toHaveLength(2);
      expect(searchResults.map(r => r.document.id)).toContain('page1');
      expect(searchResults.map(r => r.document.id)).toContain('page2');

      // 9. 验证高级搜索
      const tagSearchResults = searchEngine.search('tag:AI');
      expect(tagSearchResults).toHaveLength(2);

      // 10. 验证一致性检查
      const consistencyReport = await consistencyChecker.checkConsistency();
      expect(consistencyReport.totalIssues).toBe(2); // 两个损坏的链接（深度学习和人工智能页面不存在）
    });

    it('应该支持块引用和复杂链接结构', async () => {
      // 1. 创建包含块的页面
      const pageWithBlocks = {
        id: 'blocks-page',
        title: '概念集合',
        content: '重要概念：机器学习是AI的核心技术。',
        type: 'page' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 2. 创建块
      const block1 = {
        id: 'block-ml-concept',
        content: '机器学习是让计算机从数据中学习的技术',
        pageId: 'blocks-page'
      };

      // 3. 创建引用块的页面
      const referencingPage = {
        id: 'referencing-page',
        title: '学习笔记',
        content: '关于机器学习的定义：((block-ml-concept))，这个定义很准确。',
        type: 'page' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 4. 解析块引用
      const blockLinks = blockLinkParser.parse(referencingPage.content, referencingPage.id);
      expect(blockLinks).toHaveLength(1);
      expect(blockLinks[0].blockId).toBe('block-ml-concept');

      // 5. 创建块链接
      for (const link of blockLinks) {
        await linkManager.createLink(link);
      }

      // 6. 添加到搜索索引
      searchEngine.addDocument(pageWithBlocks);
      searchEngine.addDocument(referencingPage);

      // 7. 验证块引用查询
      const blockBacklinks = await linkManager.getBacklinks('block-ml-concept');
      expect(blockBacklinks).toHaveLength(1);
      expect(blockBacklinks[0].sourceId).toBe('referencing-page');
    });
  });

  describe('性能和缓存集成', () => {
    it('应该有效利用缓存提升性能', async () => {
      // 1. 创建大量测试数据
      const documents: SearchDocument[] = [];
      const links: PageLink[] = [];

      for (let i = 0; i < 100; i++) {
        const doc: SearchDocument = {
          id: `doc-${i}`,
          title: `文档 ${i}`,
          content: `这是文档${i}的内容，它链接到[[文档 ${(i + 1) % 100}]]`,
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        documents.push(doc);
        searchEngine.addDocument(doc);

        // 解析链接
        const docLinks = pageLinkParser.parse(doc.content, doc.id);
        links.push(...docLinks);
      }

      // 2. 创建所有链接
      for (const link of links) {
        await linkManager.createLink(link);
      }

      // 3. 第一次搜索（无缓存）
      const startTime1 = performance.now();
      const results1 = searchEngine.search('文档');
      const searchTime1 = performance.now() - startTime1;

      // 4. 缓存搜索结果
      const cacheKey = 'search:文档';
      cacheManager.set(cacheKey, results1);

      // 5. 第二次搜索（从缓存）
      const startTime2 = performance.now();
      const cachedResults = cacheManager.get(cacheKey);
      const cacheTime = performance.now() - startTime2;

      // 6. 验证缓存效果
      expect(cachedResults).toEqual(results1);
      expect(cacheTime).toBeLessThan(searchTime1); // 缓存应该更快

      // 7. 验证缓存统计
      const cacheStats = cacheManager.getStats();
      expect(cacheStats.hitRate).toBeGreaterThan(0);
    });

    it('应该监控和报告性能指标', async () => {
      // 1. 执行一系列操作并监控性能
      await performanceMonitor.measureAsync('link-creation', async () => {
        const link: PageLink = {
          id: 'perf-test-link',
          type: 'page-reference',
          pageName: 'target-page',
          alias: 'Target',
          position: 0,
          context: 'source-page'
        };
        await linkManager.createLink(link);
      });

      await performanceMonitor.measureAsync('search-operation', async () => {
        const doc: SearchDocument = {
          id: 'perf-test-doc',
          title: '性能测试文档',
          content: '这是用于性能测试的文档内容',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        searchEngine.addDocument(doc);
        searchEngine.search('性能测试');
      });

      // 2. 获取性能报告
      const report = performanceMonitor.getReport();
      
      expect(report.metrics.length).toBeGreaterThan(0);
      expect(report.score).toBeGreaterThan(0);
      
      // 3. 验证特定指标
      const linkCreationMetrics = performanceMonitor.getMetricStats('link-creation');
      expect(linkCreationMetrics.count).toBe(1);
      expect(linkCreationMetrics.avg).toBeGreaterThan(0);

      const searchMetrics = performanceMonitor.getMetricStats('search-operation');
      expect(searchMetrics.count).toBe(1);
      expect(searchMetrics.avg).toBeGreaterThan(0);
    });
  });

  describe('插件系统集成', () => {
    it('应该支持插件与核心系统的交互', async () => {
      // 1. 创建测试插件
      const testPlugin = {
        manifest: {
          id: 'integration-test-plugin',
          name: '集成测试插件',
          version: '1.0.0',
          description: '用于集成测试的插件',
          author: 'Test',
          main: 'index.js',
          permissions: ['links:read', 'search:read', 'ui:menu']
        },

        activate: vi.fn(async (context) => {
          const { api } = context;
          
          // 插件与链接系统交互
          const links = await api.links.find({});
          expect(Array.isArray(links)).toBe(true);
          
          // 插件与搜索系统交互
          const searchResults = await api.search.query('test');
          expect(Array.isArray(searchResults)).toBe(true);
          
          // 插件添加UI元素
          api.ui.addMenuItem({
            id: 'test-menu',
            label: '测试菜单',
            action: () => {}
          });
        }),

        deactivate: vi.fn()
      };

      // 2. 注册并激活插件
      await pluginSystem.registerPlugin(testPlugin);
      await pluginSystem.activatePlugin('integration-test-plugin');

      // 3. 验证插件激活
      expect(testPlugin.activate).toHaveBeenCalled();
      expect(pluginSystem.isPluginActive('integration-test-plugin')).toBe(true);

      // 4. 创建一些数据供插件使用
      const testDoc: SearchDocument = {
        id: 'plugin-test-doc',
        title: '插件测试文档',
        content: '这是插件测试文档',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      searchEngine.addDocument(testDoc);

      const testLink: PageLink = {
        id: 'plugin-test-link',
        type: 'page-reference',
        pageName: 'plugin-target',
        alias: 'Plugin Target',
        position: 0,
        context: 'plugin-test-doc'
      };

      await linkManager.createLink(testLink);

      // 5. 验证插件可以访问数据
      const pluginContext = vi.mocked(testPlugin.activate).mock.calls[0][0];
      const links = await pluginContext.api.links.find({});
      expect(links.length).toBeGreaterThan(0);

      const searchResults = await pluginContext.api.search.query('插件');
      expect(searchResults.length).toBeGreaterThan(0);
    });
  });

  describe('错误处理和恢复', () => {
    it('应该优雅地处理系统级错误', async () => {
      // 1. 模拟存储错误
      const originalCreateLink = linkManager.createLink;
      vi.spyOn(linkManager, 'createLink').mockRejectedValueOnce(new Error('Storage error'));

      const link: PageLink = {
        id: 'error-test-link',
        type: 'page-reference',
        pageName: 'error-target',
        alias: 'Error Target',
        position: 0,
        context: 'error-source'
      };

      // 2. 验证错误被正确抛出
      await expect(linkManager.createLink(link)).rejects.toThrow('Storage error');

      // 3. 恢复正常功能
      vi.mocked(linkManager.createLink).mockRestore();

      // 4. 验证系统恢复正常
      await expect(linkManager.createLink(link)).resolves.not.toThrow();
    });

    it('应该处理搜索引擎错误', async () => {
      // 1. 创建无效文档
      const invalidDoc = {
        id: null as any,
        title: '',
        content: '',
        type: 'page' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 2. 验证错误处理
      expect(() => {
        searchEngine.addDocument(invalidDoc);
      }).toThrow();

      // 3. 验证系统仍然可以正常工作
      const validDoc: SearchDocument = {
        id: 'valid-doc',
        title: '有效文档',
        content: '这是一个有效的文档',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => {
        searchEngine.addDocument(validDoc);
      }).not.toThrow();

      const results = searchEngine.search('有效');
      expect(results).toHaveLength(1);
    });
  });

  describe('数据一致性和完整性', () => {
    it('应该维护跨模块的数据一致性', async () => {
      // 1. 创建相互关联的数据
      const pages = [
        {
          id: 'consistency-page-1',
          title: '一致性测试页面1',
          content: '这个页面链接到[[一致性测试页面2]]',
          type: 'page' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'consistency-page-2',
          title: '一致性测试页面2',
          content: '这个页面链接回[[一致性测试页面1]]',
          type: 'page' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // 2. 处理所有页面
      for (const page of pages) {
        // 解析链接
        const links = pageLinkParser.parse(page.content, page.id);
        for (const link of links) {
          await linkManager.createLink(link);
        }

        // 添加到搜索
        searchEngine.addDocument(page);
      }

      // 3. 验证链接一致性
      const page1Backlinks = await linkManager.getBacklinks('一致性测试页面1');
      const page2Backlinks = await linkManager.getBacklinks('一致性测试页面2');

      expect(page1Backlinks).toHaveLength(1);
      expect(page2Backlinks).toHaveLength(1);

      // 4. 验证搜索一致性
      const searchResults = searchEngine.search('一致性测试');
      expect(searchResults).toHaveLength(2);

      // 5. 删除一个页面
      searchEngine.removeDocument('consistency-page-1');

      // 6. 运行一致性检查
      const report = await consistencyChecker.checkConsistency();
      
      // 应该检测到损坏的链接
      expect(report.issuesByType['broken-link']).toBeDefined();
      expect(report.issuesByType['broken-link'].length).toBeGreaterThan(0);
    });
  });

  describe('并发和竞态条件', () => {
    it('应该正确处理并发操作', async () => {
      // 1. 并发创建链接
      const concurrentLinks = Array.from({ length: 10 }, (_, i) => ({
        id: `concurrent-link-${i}`,
        type: 'page-reference' as const,
        pageName: `target-${i}`,
        alias: `Target ${i}`,
        position: i * 10,
        context: 'concurrent-source'
      }));

      // 2. 并发执行
      const createPromises = concurrentLinks.map(link => 
        linkManager.createLink(link)
      );

      await Promise.all(createPromises);

      // 3. 验证所有链接都被创建
      const sourceLinks = await linkManager.getLinksFromSource('concurrent-source');
      expect(sourceLinks).toHaveLength(10);

      // 4. 并发搜索操作
      const searchPromises = Array.from({ length: 5 }, (_, i) => 
        searchEngine.search(`target-${i}`)
      );

      const searchResults = await Promise.all(searchPromises);
      
      // 验证搜索结果
      searchResults.forEach((results, index) => {
        // 每个搜索应该返回结果（即使为空）
        expect(Array.isArray(results)).toBe(true);
      });
    });
  });

  describe('内存和资源管理', () => {
    it('应该有效管理内存使用', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // 1. 创建大量数据
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `memory-test-${i}`,
        title: `Memory Test ${i}`,
        content: `This is memory test content ${i}`.repeat(100),
        type: 'page' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // 2. 添加到搜索引擎
      largeDataSet.forEach(doc => {
        searchEngine.addDocument(doc);
      });

      const afterAddMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // 3. 清理数据
      largeDataSet.forEach(doc => {
        searchEngine.removeDocument(doc.id);
      });

      // 4. 强制垃圾回收（如果支持）
      if (global.gc) {
        global.gc();
      }

      const afterCleanupMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // 5. 验证内存使用
      const memoryIncrease = afterAddMemory - initialMemory;
      const memoryRecovered = afterAddMemory - afterCleanupMemory;

      // 内存增长应该在合理范围内
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB

      // 应该回收大部分内存
      expect(memoryRecovered).toBeGreaterThan(memoryIncrease * 0.5);
    });
  });
});
