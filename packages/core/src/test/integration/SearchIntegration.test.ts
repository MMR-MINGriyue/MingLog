/**
 * MingLog 搜索功能集成测试
 * 验证搜索引擎与链接系统、数据持久化的集成
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SearchEngine } from '../../search/SearchEngine';
import { LinkManagerService } from '../../links/LinkManagerService';
import { PageLinkParser } from '../../parsers/PageLinkParser';
import { CacheManager } from '../../services/CacheManager';
import { PerformanceMonitor } from '../../services/PerformanceMonitor';
import type { SearchDocument, PageLink, SearchOptions, SearchResult } from '../../types/links';

describe('搜索功能集成测试', () => {
  let searchEngine: SearchEngine;
  let linkManager: LinkManagerService;
  let pageLinkParser: PageLinkParser;
  let cacheManager: CacheManager;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    searchEngine = new SearchEngine();
    linkManager = new LinkManagerService();
    pageLinkParser = new PageLinkParser();
    cacheManager = new CacheManager();
    performanceMonitor = new PerformanceMonitor();
    
    performanceMonitor.start();
  });

  afterEach(() => {
    performanceMonitor.stop();
    cacheManager.clear();
  });

  describe('基础搜索功能集成', () => {
    it('应该支持完整的文档索引和搜索流程', async () => {
      // 1. 创建测试文档
      const documents: SearchDocument[] = [
        {
          id: 'ai-intro',
          title: '人工智能简介',
          content: '人工智能（AI）是计算机科学的一个分支，致力于创建能够执行通常需要人类智能的任务的系统。',
          type: 'page',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          tags: ['AI', '人工智能', '计算机科学']
        },
        {
          id: 'ml-basics',
          title: '机器学习基础',
          content: '机器学习是人工智能的一个子集，它使计算机能够在没有明确编程的情况下学习和改进。',
          type: 'page',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          tags: ['机器学习', 'AI', '算法']
        },
        {
          id: 'dl-overview',
          title: '深度学习概述',
          content: '深度学习是机器学习的一个分支，使用多层神经网络来模拟人脑的工作方式。',
          type: 'page',
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
          tags: ['深度学习', '神经网络', '机器学习']
        }
      ];

      // 2. 添加文档到搜索索引
      documents.forEach(doc => {
        searchEngine.addDocument(doc);
      });

      // 3. 基本搜索测试
      const basicResults = searchEngine.search('人工智能');
      expect(basicResults).toHaveLength(2); // ai-intro 和 ml-basics

      // 4. 标题搜索测试
      const titleResults = searchEngine.search('title:机器学习');
      expect(titleResults).toHaveLength(1);
      expect(titleResults[0].document.id).toBe('ml-basics');

      // 5. 标签搜索测试
      const tagResults = searchEngine.search('tag:AI');
      expect(tagResults).toHaveLength(2);

      // 6. 复合搜索测试
      const complexResults = searchEngine.search('机器学习 AND tag:算法');
      expect(complexResults).toHaveLength(1);
      expect(complexResults[0].document.id).toBe('ml-basics');

      // 7. 排除搜索测试
      const excludeResults = searchEngine.search('学习 NOT 深度');
      expect(excludeResults).toHaveLength(1);
      expect(excludeResults[0].document.id).toBe('ml-basics');
    });

    it('应该支持高级搜索选项', async () => {
      // 1. 创建测试数据
      const documents: SearchDocument[] = [
        {
          id: 'recent-doc',
          title: '最新文档',
          content: '这是最新创建的文档',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['最新']
        },
        {
          id: 'old-doc',
          title: '旧文档',
          content: '这是较早创建的文档',
          type: 'page',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          tags: ['历史']
        }
      ];

      documents.forEach(doc => searchEngine.addDocument(doc));

      // 2. 测试日期范围过滤
      const recentResults = searchEngine.search('文档', {
        filters: {
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date()
          }
        }
      });

      expect(recentResults).toHaveLength(1);
      expect(recentResults[0].document.id).toBe('recent-doc');

      // 3. 测试结果限制
      const limitedResults = searchEngine.search('文档', {
        limit: 1
      });

      expect(limitedResults).toHaveLength(1);

      // 4. 测试排序
      const sortedResults = searchEngine.search('文档', {
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      expect(sortedResults[0].document.id).toBe('recent-doc');
      expect(sortedResults[1].document.id).toBe('old-doc');

      // 5. 测试高亮
      const highlightResults = searchEngine.search('最新', {
        highlight: true
      });

      expect(highlightResults[0].highlights).toBeDefined();
      expect(highlightResults[0].highlights!.content).toContain('<mark>最新</mark>');
    });
  });

  describe('搜索与链接系统集成', () => {
    it('应该支持基于链接关系的搜索增强', async () => {
      // 1. 创建相互链接的文档
      const documents: SearchDocument[] = [
        {
          id: 'central-topic',
          title: '中心主题',
          content: '这是一个中心主题，连接到[[相关主题A]]和[[相关主题B]]',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['中心']
        },
        {
          id: 'related-a',
          title: '相关主题A',
          content: '这是相关主题A，它引用了[[中心主题]]',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['相关']
        },
        {
          id: 'related-b',
          title: '相关主题B',
          content: '这是相关主题B，也引用了[[中心主题]]',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['相关']
        }
      ];

      // 2. 添加文档并创建链接
      for (const doc of documents) {
        searchEngine.addDocument(doc);
        
        const links = pageLinkParser.parse(doc.content, doc.id);
        for (const link of links) {
          await linkManager.createLink(link);
        }
      }

      // 3. 基本搜索
      const basicResults = searchEngine.search('中心主题');
      expect(basicResults).toHaveLength(3); // 所有文档都包含"中心主题"

      // 4. 获取链接关系
      const centralBacklinks = await linkManager.getBacklinks('中心主题');
      const linkedDocIds = centralBacklinks.map(link => link.sourceId);

      // 5. 基于链接关系的增强搜索
      const enhancedResults = searchEngine.search('主题', {
        boost: {
          linkedDocuments: linkedDocIds
        }
      });

      expect(enhancedResults).toHaveLength(3);
      
      // 验证链接相关的文档得分更高
      const centralDoc = enhancedResults.find(r => r.document.id === 'central-topic');
      const relatedDocs = enhancedResults.filter(r => linkedDocIds.includes(r.document.id));
      
      expect(centralDoc).toBeDefined();
      expect(relatedDocs).toHaveLength(2);
    });

    it('应该支持链接图谱导航搜索', async () => {
      // 1. 创建复杂的链接网络
      const networkDocs: SearchDocument[] = [
        {
          id: 'hub',
          title: '知识枢纽',
          content: '连接[[概念1]]、[[概念2]]、[[概念3]]',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'concept1',
          title: '概念1',
          content: '这是概念1，它与[[概念2]]相关',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'concept2',
          title: '概念2',
          content: '这是概念2，它连接[[概念1]]和[[概念3]]',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'concept3',
          title: '概念3',
          content: '这是概念3，它引用[[知识枢纽]]',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // 2. 建立链接网络
      for (const doc of networkDocs) {
        searchEngine.addDocument(doc);
        
        const links = pageLinkParser.parse(doc.content, doc.id);
        for (const link of links) {
          await linkManager.createLink(link);
        }
      }

      // 3. 搜索起始点
      const startResults = searchEngine.search('知识枢纽');
      expect(startResults).toHaveLength(2); // hub 和 concept3

      // 4. 获取枢纽的链接网络
      const hubOutlinks = await linkManager.getLinksFromSource('hub');
      const hubBacklinks = await linkManager.getBacklinks('知识枢纽');

      // 5. 构建图谱搜索结果
      const connectedNodeIds = new Set<string>();
      connectedNodeIds.add('hub');

      // 添加出链节点
      hubOutlinks.forEach(link => {
        const targetName = (link as PageLink).pageName;
        const targetDoc = networkDocs.find(doc => doc.title === targetName);
        if (targetDoc) {
          connectedNodeIds.add(targetDoc.id);
        }
      });

      // 添加入链节点
      hubBacklinks.forEach(link => {
        connectedNodeIds.add(link.sourceId);
      });

      // 6. 验证图谱连通性
      expect(connectedNodeIds.size).toBe(4); // 所有节点都连通

      // 7. 基于图谱的相关性搜索
      const graphResults = searchEngine.search('概念', {
        boost: {
          linkedDocuments: Array.from(connectedNodeIds)
        }
      });

      expect(graphResults).toHaveLength(3); // concept1, concept2, concept3
    });
  });

  describe('搜索性能和缓存集成', () => {
    it('应该缓存搜索结果以提升性能', async () => {
      // 1. 创建测试数据
      const documents: SearchDocument[] = Array.from({ length: 100 }, (_, i) => ({
        id: `doc-${i}`,
        title: `文档 ${i}`,
        content: `这是第${i}个测试文档，包含关键词：测试`,
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [`tag-${i % 10}`]
      }));

      documents.forEach(doc => searchEngine.addDocument(doc));

      // 2. 第一次搜索（无缓存）
      const query = '测试';
      const cacheKey = `search:${query}`;

      const startTime1 = performance.now();
      const results1 = searchEngine.search(query);
      const searchTime1 = performance.now() - startTime1;

      expect(results1).toHaveLength(100);

      // 3. 缓存搜索结果
      cacheManager.set(cacheKey, results1);

      // 4. 第二次搜索（从缓存）
      const startTime2 = performance.now();
      const cachedResults = cacheManager.get(cacheKey);
      const cacheTime = performance.now() - startTime2;

      // 5. 验证缓存效果
      expect(cachedResults).toEqual(results1);
      expect(cacheTime).toBeLessThan(searchTime1);

      // 6. 验证缓存统计
      const stats = cacheManager.getStats();
      expect(stats.hitRate).toBeGreaterThan(0);
    });

    it('应该监控搜索性能指标', async () => {
      // 1. 创建大量测试数据
      const documents: SearchDocument[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `perf-doc-${i}`,
        title: `性能测试文档 ${i}`,
        content: `这是性能测试文档${i}，包含各种关键词：性能、测试、搜索、索引`,
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [`perf-tag-${i % 20}`]
      }));

      documents.forEach(doc => searchEngine.addDocument(doc));

      // 2. 执行多次搜索并监控性能
      const queries = ['性能', '测试', '搜索', 'tag:perf-tag-5', '性能 AND 测试'];

      for (const query of queries) {
        await performanceMonitor.measureAsync('search-operation', async () => {
          const results = searchEngine.search(query);
          expect(results.length).toBeGreaterThan(0);
        });
      }

      // 3. 获取性能统计
      const searchMetrics = performanceMonitor.getMetricStats('search-operation');
      expect(searchMetrics.count).toBe(queries.length);
      expect(searchMetrics.avg).toBeGreaterThan(0);
      expect(searchMetrics.avg).toBeLessThan(1000); // 搜索应该在1秒内完成

      // 4. 生成性能报告
      const report = performanceMonitor.generateReport();
      expect(report.metrics.length).toBeGreaterThan(0);
      expect(report.score).toBeGreaterThan(0);
    });

    it('应该处理并发搜索请求', async () => {
      // 1. 创建测试数据
      const documents: SearchDocument[] = Array.from({ length: 500 }, (_, i) => ({
        id: `concurrent-doc-${i}`,
        title: `并发测试文档 ${i}`,
        content: `并发测试内容 ${i}`,
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      documents.forEach(doc => searchEngine.addDocument(doc));

      // 2. 创建并发搜索请求
      const concurrentQueries = Array.from({ length: 10 }, (_, i) => 
        `并发测试 ${i % 3}`
      );

      const startTime = performance.now();

      // 3. 并发执行搜索
      const searchPromises = concurrentQueries.map(query => 
        performanceMonitor.measureAsync('concurrent-search', async () => {
          return searchEngine.search(query);
        })
      );

      const results = await Promise.all(searchPromises);
      const totalTime = performance.now() - startTime;

      // 4. 验证并发搜索结果
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });

      // 5. 验证并发性能
      expect(totalTime).toBeLessThan(5000); // 5秒内完成所有搜索

      const concurrentMetrics = performanceMonitor.getMetricStats('concurrent-search');
      expect(concurrentMetrics.count).toBe(10);
    });
  });

  describe('搜索建议和自动补全', () => {
    it('应该提供智能搜索建议', async () => {
      // 1. 创建测试数据
      const documents: SearchDocument[] = [
        {
          id: 'ml-doc',
          title: '机器学习入门',
          content: '机器学习是人工智能的重要分支',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['机器学习', 'AI']
        },
        {
          id: 'ml-advanced',
          title: '机器学习进阶',
          content: '深入了解机器学习算法',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['机器学习', '算法']
        },
        {
          id: 'ml-practice',
          title: '机器学习实践',
          content: '机器学习的实际应用案例',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['机器学习', '实践']
        }
      ];

      documents.forEach(doc => searchEngine.addDocument(doc));

      // 2. 测试搜索建议
      const suggestions = searchEngine.getSuggestions('机器');
      expect(suggestions).toContain('机器学习');

      // 3. 测试部分匹配建议
      const partialSuggestions = searchEngine.getSuggestions('机器学');
      expect(partialSuggestions).toContain('机器学习');

      // 4. 测试建议限制
      const limitedSuggestions = searchEngine.getSuggestions('机器', 2);
      expect(limitedSuggestions.length).toBeLessThanOrEqual(2);

      // 5. 测试空查询
      const emptySuggestions = searchEngine.getSuggestions('');
      expect(emptySuggestions).toHaveLength(0);
    });

    it('应该基于搜索历史提供建议', async () => {
      // 1. 执行一些搜索以建立历史
      const searchQueries = [
        '机器学习',
        '深度学习',
        '人工智能',
        '机器学习算法',
        '机器学习应用'
      ];

      // 模拟搜索历史
      searchQueries.forEach(query => {
        searchEngine.search(query);
      });

      // 2. 获取热门搜索建议
      const popularQueries = searchEngine.getPopularQueries();
      expect(popularQueries.length).toBeGreaterThan(0);
      expect(popularQueries).toContain('机器学习');

      // 3. 获取搜索历史
      const history = searchEngine.getSearchHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history).toContain('机器学习');
    });
  });

  describe('搜索错误处理和恢复', () => {
    it('应该处理无效查询', () => {
      // 1. 测试空查询
      const emptyResults = searchEngine.search('');
      expect(emptyResults).toHaveLength(0);

      // 2. 测试无效语法
      const invalidResults = searchEngine.search('[[invalid]]');
      expect(Array.isArray(invalidResults)).toBe(true);

      // 3. 测试过长查询
      const longQuery = 'a'.repeat(1000);
      const longResults = searchEngine.search(longQuery);
      expect(Array.isArray(longResults)).toBe(true);
    });

    it('应该处理搜索引擎错误', () => {
      // 1. 模拟搜索引擎内部错误
      const originalSearch = searchEngine.search;
      vi.spyOn(searchEngine, 'search').mockImplementationOnce(() => {
        throw new Error('Search engine error');
      });

      // 2. 验证错误处理
      expect(() => {
        searchEngine.search('test query');
      }).toThrow('Search engine error');

      // 3. 恢复正常功能
      vi.mocked(searchEngine.search).mockRestore();

      // 4. 验证搜索引擎恢复正常
      const normalResults = searchEngine.search('test');
      expect(Array.isArray(normalResults)).toBe(true);
    });
  });
});
