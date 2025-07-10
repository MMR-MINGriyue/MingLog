/**
 * MingLog 性能基准测试
 * 测试各个组件和服务的性能指标
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchEngine } from '../../search/SearchEngine';
import { LinkManagerService } from '../../services/LinkManagerService';
import { CacheManager } from '../../services/CacheManager';
import { VirtualScrollList } from '../../components/performance/VirtualScrollList';
import { PerformanceMonitor } from '../../services/PerformanceMonitor';
import { testUtils } from '@test/setup';
import type { SearchDocument, PageLink } from '../../types/links';

describe('性能基准测试', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    performanceMonitor.start();
  });

  afterEach(() => {
    performanceMonitor.stop();
  });

  describe('搜索引擎性能', () => {
    it('应该在合理时间内索引大量文档', async () => {
      const searchEngine = new SearchEngine();
      const documentCount = 10000;
      
      const startTime = performance.now();
      
      // 创建大量文档
      for (let i = 0; i < documentCount; i++) {
        const doc: SearchDocument = {
          id: `perf-doc-${i}`,
          title: `Performance Test Document ${i}`,
          content: `This is a performance test document number ${i}. It contains various keywords like test, performance, benchmark, and document-${i % 100}.`,
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [`tag-${i % 10}`, `category-${i % 5}`]
        };
        
        searchEngine.addDocument(doc);
      }
      
      const indexTime = performance.now() - startTime;
      
      // 性能断言
      expect(indexTime).toBeLessThan(5000); // 5秒内完成索引
      expect(indexTime / documentCount).toBeLessThan(0.5); // 每个文档平均0.5ms
      
      // 记录性能指标
      performanceMonitor.recordMetric('search-indexing-time', indexTime, 'ms', {
        documentCount: documentCount.toString()
      });
      
      console.log(`索引 ${documentCount} 个文档耗时: ${indexTime.toFixed(2)}ms`);
      console.log(`平均每个文档: ${(indexTime / documentCount).toFixed(3)}ms`);
    });

    it('应该快速执行搜索查询', async () => {
      const searchEngine = new SearchEngine();
      
      // 准备测试数据
      for (let i = 0; i < 1000; i++) {
        searchEngine.addDocument({
          id: `search-doc-${i}`,
          title: `Search Document ${i}`,
          content: `Content for search test ${i}. Keywords: performance, search, test-${i % 50}`,
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      const queries = [
        'performance',
        'search test',
        'document',
        'test-25',
        'content performance'
      ];
      
      const searchTimes: number[] = [];
      
      for (const query of queries) {
        const startTime = performance.now();
        const results = searchEngine.search(query);
        const searchTime = performance.now() - startTime;
        
        searchTimes.push(searchTime);
        
        expect(searchTime).toBeLessThan(100); // 100ms内完成搜索
        expect(results.length).toBeGreaterThan(0);
        
        performanceMonitor.recordMetric('search-query-time', searchTime, 'ms', {
          query,
          resultCount: results.length.toString()
        });
      }
      
      const avgSearchTime = searchTimes.reduce((sum, time) => sum + time, 0) / searchTimes.length;
      expect(avgSearchTime).toBeLessThan(50); // 平均50ms内完成
      
      console.log(`平均搜索时间: ${avgSearchTime.toFixed(2)}ms`);
    });

    it('应该高效处理复杂查询', async () => {
      const searchEngine = new SearchEngine();
      
      // 准备复杂的测试数据
      for (let i = 0; i < 5000; i++) {
        searchEngine.addDocument({
          id: `complex-doc-${i}`,
          title: `Complex Document ${i}`,
          content: `This is a complex document with multiple keywords: performance, optimization, search, index, query, result, test-${i}, category-${i % 10}`,
          type: i % 2 === 0 ? 'page' : 'block',
          createdAt: new Date(2024, 0, 1 + (i % 365)),
          updatedAt: new Date(),
          tags: [`tag-${i % 20}`, `type-${i % 5}`]
        });
      }
      
      const complexQueries = [
        'performance AND optimization',
        'title:"Complex Document" AND tag:tag-5',
        '(search OR query) AND type:page',
        'test-* AND category-5',
        'performance optimization search -index'
      ];
      
      for (const query of complexQueries) {
        const startTime = performance.now();
        const results = searchEngine.search(query, {
          highlight: true,
          sortBy: 'score',
          limit: 50
        });
        const queryTime = performance.now() - startTime;
        
        expect(queryTime).toBeLessThan(200); // 200ms内完成复杂查询
        expect(results.length).toBeGreaterThan(0);
        
        performanceMonitor.recordMetric('complex-query-time', queryTime, 'ms', {
          query: query.substring(0, 20) + '...'
        });
      }
    });
  });

  describe('链接管理性能', () => {
    it('应该快速创建和查询链接', async () => {
      const linkManager = new LinkManagerService();
      const linkCount = 5000;
      
      // 测试链接创建性能
      const createStartTime = performance.now();
      
      for (let i = 0; i < linkCount; i++) {
        const link: PageLink = {
          id: `perf-link-${i}`,
          type: 'page-reference',
          pageName: `target-page-${i % 100}`,
          alias: `Target ${i}`,
          position: i * 10,
          context: `source-page-${i % 50}`
        };
        
        await linkManager.createLink(link);
      }
      
      const createTime = performance.now() - createStartTime;
      expect(createTime).toBeLessThan(3000); // 3秒内创建5000个链接
      
      performanceMonitor.recordMetric('link-creation-time', createTime, 'ms', {
        linkCount: linkCount.toString()
      });
      
      // 测试反向链接查询性能
      const queryStartTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        const backlinks = await linkManager.getBacklinks(`target-page-${i}`);
        expect(backlinks.length).toBeGreaterThan(0);
      }
      
      const queryTime = performance.now() - queryStartTime;
      expect(queryTime).toBeLessThan(100); // 100ms内完成10次查询
      
      performanceMonitor.recordMetric('backlink-query-time', queryTime, 'ms');
      
      console.log(`创建 ${linkCount} 个链接耗时: ${createTime.toFixed(2)}ms`);
      console.log(`查询反向链接耗时: ${queryTime.toFixed(2)}ms`);
    });
  });

  describe('缓存系统性能', () => {
    it('应该提供高性能的缓存操作', async () => {
      const cacheManager = new CacheManager({
        maxSize: 10 * 1024 * 1024, // 10MB
        maxItems: 10000
      });
      
      const itemCount = 1000;
      const testData = Array.from({ length: itemCount }, (_, i) => ({
        key: `cache-key-${i}`,
        value: {
          id: i,
          title: `Cache Item ${i}`,
          content: `This is cached content for item ${i}`.repeat(10),
          timestamp: Date.now()
        }
      }));
      
      // 测试缓存写入性能
      const writeStartTime = performance.now();
      
      for (const item of testData) {
        cacheManager.set(item.key, item.value);
      }
      
      const writeTime = performance.now() - writeStartTime;
      expect(writeTime).toBeLessThan(500); // 500ms内完成写入
      
      // 测试缓存读取性能
      const readStartTime = performance.now();
      
      for (let i = 0; i < itemCount; i++) {
        const value = cacheManager.get(`cache-key-${i}`);
        expect(value).toBeDefined();
      }
      
      const readTime = performance.now() - readStartTime;
      expect(readTime).toBeLessThan(100); // 100ms内完成读取
      
      // 测试缓存命中率
      const stats = cacheManager.getStats();
      expect(stats.hitRate).toBeGreaterThan(0.95); // 95%以上命中率
      
      performanceMonitor.recordMetric('cache-write-time', writeTime, 'ms');
      performanceMonitor.recordMetric('cache-read-time', readTime, 'ms');
      performanceMonitor.recordMetric('cache-hit-rate', stats.hitRate * 100, '%');
      
      console.log(`缓存写入 ${itemCount} 项耗时: ${writeTime.toFixed(2)}ms`);
      console.log(`缓存读取 ${itemCount} 项耗时: ${readTime.toFixed(2)}ms`);
      console.log(`缓存命中率: ${(stats.hitRate * 100).toFixed(2)}%`);
    });
  });

  describe('虚拟滚动性能', () => {
    it('应该高效渲染大量列表项', async () => {
      const itemCount = 100000;
      const items = Array.from({ length: itemCount }, (_, i) => ({
        id: `virtual-item-${i}`,
        data: {
          title: `Virtual Item ${i}`,
          content: `Content for virtual scroll item ${i}`
        }
      }));
      
      const renderStartTime = performance.now();
      
      // 模拟虚拟滚动的渲染逻辑
      const visibleRange = { start: 0, end: 20 }; // 只渲染可见项
      const visibleItems = items.slice(visibleRange.start, visibleRange.end);
      
      // 模拟DOM操作
      const renderedElements = visibleItems.map(item => ({
        id: item.id,
        element: `<div data-id="${item.id}">${item.data.title}</div>`
      }));
      
      const renderTime = performance.now() - renderStartTime;
      
      expect(renderTime).toBeLessThan(10); // 10ms内完成渲染
      expect(renderedElements.length).toBe(20); // 只渲染可见项
      
      performanceMonitor.recordMetric('virtual-scroll-render-time', renderTime, 'ms', {
        totalItems: itemCount.toString(),
        visibleItems: visibleItems.length.toString()
      });
      
      // 测试滚动性能
      const scrollTests = 100;
      const scrollStartTime = performance.now();
      
      for (let i = 0; i < scrollTests; i++) {
        const scrollTop = i * 50;
        const newStart = Math.floor(scrollTop / 50);
        const newEnd = newStart + 20;
        const newVisibleItems = items.slice(newStart, Math.min(newEnd, itemCount));
        
        // 模拟更新可见项
        expect(newVisibleItems.length).toBeGreaterThan(0);
      }
      
      const scrollTime = performance.now() - scrollStartTime;
      expect(scrollTime).toBeLessThan(50); // 50ms内完成100次滚动计算
      
      performanceMonitor.recordMetric('virtual-scroll-scroll-time', scrollTime, 'ms');
      
      console.log(`虚拟滚动渲染耗时: ${renderTime.toFixed(2)}ms`);
      console.log(`滚动计算耗时: ${scrollTime.toFixed(2)}ms`);
    });
  });

  describe('内存使用测试', () => {
    it('应该保持合理的内存使用', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // 创建大量对象
      const objects: any[] = [];
      for (let i = 0; i < 10000; i++) {
        objects.push({
          id: i,
          data: new Array(100).fill(`data-${i}`),
          timestamp: Date.now()
        });
      }
      
      const afterCreationMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = afterCreationMemory - initialMemory;
      
      // 清理对象
      objects.length = 0;
      
      // 强制垃圾回收（如果支持）
      if (global.gc) {
        global.gc();
      }
      
      const afterCleanupMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryRecovered = afterCreationMemory - afterCleanupMemory;
      
      performanceMonitor.recordMetric('memory-increase', memoryIncrease, 'bytes');
      performanceMonitor.recordMetric('memory-recovered', memoryRecovered, 'bytes');
      
      // 内存增长应该在合理范围内
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
      
      console.log(`内存增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      console.log(`内存回收: ${(memoryRecovered / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('性能报告生成', () => {
    it('应该生成详细的性能报告', async () => {
      // 运行一些性能测试
      await performanceMonitor.measureAsync('test-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });
      
      performanceMonitor.recordMetric('test-metric', 100, 'ms');
      performanceMonitor.recordMetric('test-metric', 150, 'ms');
      performanceMonitor.recordMetric('test-metric', 120, 'ms');
      
      const report = performanceMonitor.getReport();
      
      expect(report.metrics.length).toBeGreaterThan(0);
      expect(report.score).toBeGreaterThan(0);
      expect(report.recommendations).toBeDefined();
      
      // 获取指标统计
      const stats = performanceMonitor.getMetricStats('test-metric');
      expect(stats.count).toBe(3);
      expect(stats.avg).toBeCloseTo(123.33, 1);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(150);
      
      console.log('性能报告:', {
        totalMetrics: report.metrics.length,
        score: report.score,
        recommendations: report.recommendations.length
      });
    });
  });
});
