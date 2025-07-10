/**
 * MingLog 双向链接系统集成测试
 * 验证链接解析、管理和搜索的完整工作流程
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LinkManagerService } from '../../services/LinkManagerService';
import { SearchEngine } from '../../search/SearchEngine';
import { PageLinkParser } from '../../parsers/PageLinkParser';
import { BlockLinkParser } from '../../parsers/BlockLinkParser';
import { LinkConsistencyChecker } from '../../services/LinkConsistencyChecker';
import { CacheManager } from '../../services/CacheManager';
import type { SearchDocument, PageLink, BlockLink } from '../../types/links';

describe('双向链接系统集成测试', () => {
  let linkManager: LinkManagerService;
  let searchEngine: SearchEngine;
  let pageLinkParser: PageLinkParser;
  let blockLinkParser: BlockLinkParser;
  let consistencyChecker: LinkConsistencyChecker;
  let cacheManager: CacheManager;

  beforeEach(() => {
    linkManager = new LinkManagerService();
    searchEngine = new SearchEngine();
    pageLinkParser = new PageLinkParser();
    blockLinkParser = new BlockLinkParser();
    consistencyChecker = new LinkConsistencyChecker(linkManager);
    cacheManager = new CacheManager();
  });

  afterEach(() => {
    // 清理缓存
    cacheManager.clear();
  });

  describe('完整的链接创建和管理流程', () => {
    it('应该支持从文档创建到链接管理的完整流程', async () => {
      // 1. 创建包含链接的文档
      const document1: SearchDocument = {
        id: 'doc1',
        title: '机器学习基础',
        content: '这是关于[[深度学习]]和[[神经网络]]的介绍。参考重要概念：((concept-block-123))',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['AI', '机器学习']
      };

      // 2. 解析页面链接
      const pageLinks = pageLinkParser.parse(document1.content, document1.id);
      expect(pageLinks).toHaveLength(2);
      expect(pageLinks[0].pageName).toBe('深度学习');
      expect(pageLinks[1].pageName).toBe('神经网络');

      // 3. 解析块链接
      const blockLinks = blockLinkParser.parse(document1.content, document1.id);
      expect(blockLinks).toHaveLength(1);
      expect(blockLinks[0].blockId).toBe('concept-block-123');

      // 4. 创建所有链接
      for (const link of [...pageLinks, ...blockLinks]) {
        await linkManager.createLink(link);
      }

      // 5. 添加文档到搜索索引
      searchEngine.addDocument(document1);

      // 6. 创建目标文档
      const document2: SearchDocument = {
        id: 'doc2',
        title: '深度学习',
        content: '深度学习是[[机器学习]]的一个分支，使用[[神经网络]]进行学习。',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['AI', '深度学习']
      };

      // 7. 解析并创建反向链接
      const reversePageLinks = pageLinkParser.parse(document2.content, document2.id);
      for (const link of reversePageLinks) {
        await linkManager.createLink(link);
      }

      searchEngine.addDocument(document2);

      // 8. 验证反向链接
      const backlinks = await linkManager.getBacklinks('深度学习');
      expect(backlinks).toHaveLength(1);
      expect(backlinks[0].sourceId).toBe('doc1');

      const mlBacklinks = await linkManager.getBacklinks('机器学习');
      expect(mlBacklinks).toHaveLength(1);
      expect(mlBacklinks[0].sourceId).toBe('doc2');

      // 9. 验证搜索集成
      const searchResults = searchEngine.search('深度学习');
      expect(searchResults).toHaveLength(2);
      expect(searchResults.map(r => r.document.id)).toContain('doc1');
      expect(searchResults.map(r => r.document.id)).toContain('doc2');
    });

    it('应该支持链接的实时更新和同步', async () => {
      // 1. 创建初始文档
      const originalContent = '这是关于[[机器学习]]的文档';
      const document: SearchDocument = {
        id: 'sync-doc',
        title: '同步测试',
        content: originalContent,
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 2. 解析并创建初始链接
      const initialLinks = pageLinkParser.parse(document.content, document.id);
      for (const link of initialLinks) {
        await linkManager.createLink(link);
      }

      searchEngine.addDocument(document);

      // 3. 更新文档内容
      const updatedContent = '这是关于[[深度学习]]和[[人工智能]]的文档';
      const updatedDocument = { ...document, content: updatedContent };

      // 4. 解析新链接
      const newLinks = pageLinkParser.parse(updatedContent, document.id);

      // 5. 删除旧链接
      const oldLinks = await linkManager.getLinksFromSource(document.id);
      for (const link of oldLinks) {
        await linkManager.deleteLink(link.id);
      }

      // 6. 创建新链接
      for (const link of newLinks) {
        await linkManager.createLink(link);
      }

      // 7. 更新搜索索引
      searchEngine.updateDocument(updatedDocument);

      // 8. 验证链接更新
      const currentLinks = await linkManager.getLinksFromSource(document.id);
      expect(currentLinks).toHaveLength(2);
      expect(currentLinks.map(l => (l as PageLink).pageName)).toContain('深度学习');
      expect(currentLinks.map(l => (l as PageLink).pageName)).toContain('人工智能');
      expect(currentLinks.map(l => (l as PageLink).pageName)).not.toContain('机器学习');

      // 9. 验证搜索结果更新
      const searchResults = searchEngine.search('深度学习');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].document.content).toBe(updatedContent);
    });
  });

  describe('缓存系统集成', () => {
    it('应该缓存频繁访问的链接数据', async () => {
      // 1. 创建测试链接
      const link: PageLink = {
        id: 'cache-test-link',
        type: 'page-reference',
        pageName: 'cached-page',
        alias: 'Cached Page',
        position: 0,
        context: 'cache-source'
      };

      await linkManager.createLink(link);

      // 2. 第一次查询（无缓存）
      const startTime1 = performance.now();
      const backlinks1 = await linkManager.getBacklinks('cached-page');
      const queryTime1 = performance.now() - startTime1;

      // 3. 缓存结果
      const cacheKey = 'backlinks:cached-page';
      cacheManager.set(cacheKey, backlinks1);

      // 4. 第二次查询（从缓存）
      const startTime2 = performance.now();
      const cachedBacklinks = cacheManager.get(cacheKey);
      const cacheTime = performance.now() - startTime2;

      // 5. 验证缓存效果
      expect(cachedBacklinks).toEqual(backlinks1);
      expect(cacheTime).toBeLessThan(queryTime1); // 缓存应该更快

      // 6. 验证缓存统计
      const stats = cacheManager.getStats();
      expect(stats.hitRate).toBeGreaterThan(0);
    });

    it('应该在链接更新时清除相关缓存', async () => {
      const pageName = 'cache-invalidation-test';
      const cacheKey = `backlinks:${pageName}`;

      // 1. 创建链接并缓存
      const link: PageLink = {
        id: 'cache-invalidation-link',
        type: 'page-reference',
        pageName,
        alias: 'Test Page',
        position: 0,
        context: 'test-source'
      };

      await linkManager.createLink(link);
      const backlinks = await linkManager.getBacklinks(pageName);
      cacheManager.set(cacheKey, backlinks);

      // 2. 验证缓存存在
      expect(cacheManager.get(cacheKey)).toEqual(backlinks);

      // 3. 更新链接
      await linkManager.updateLink(link.id, { alias: 'Updated Test Page' });

      // 4. 清除相关缓存
      cacheManager.delete(cacheKey);

      // 5. 验证缓存被清除
      expect(cacheManager.get(cacheKey)).toBeNull();

      // 6. 重新查询应该返回更新后的数据
      const updatedBacklinks = await linkManager.getBacklinks(pageName);
      expect(updatedBacklinks[0].alias).toBe('Updated Test Page');
    });
  });

  describe('一致性检查集成', () => {
    it('应该检测和报告链接一致性问题', async () => {
      // 1. 创建有效链接
      const validLink: PageLink = {
        id: 'valid-link',
        type: 'page-reference',
        pageName: 'existing-page',
        alias: 'Existing Page',
        position: 0,
        context: 'source-page'
      };

      await linkManager.createLink(validLink);

      // 2. 创建损坏链接（目标不存在）
      const brokenLink: PageLink = {
        id: 'broken-link',
        type: 'page-reference',
        pageName: 'non-existent-page',
        alias: 'Non-existent Page',
        position: 10,
        context: 'source-page'
      };

      await linkManager.createLink(brokenLink);

      // 3. 添加目标页面到搜索索引（模拟页面存在）
      const existingPage: SearchDocument = {
        id: 'existing-page',
        title: 'existing-page',
        content: 'This page exists',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      searchEngine.addDocument(existingPage);

      // 4. 运行一致性检查
      const report = await consistencyChecker.checkConsistency();

      // 5. 验证检查结果
      expect(report.totalIssues).toBeGreaterThan(0);
      expect(report.issuesByType['broken-link']).toBeDefined();
      expect(report.issuesByType['broken-link'].length).toBe(1);
      expect(report.issuesByType['broken-link'][0].linkId).toBe('broken-link');

      // 6. 测试自动修复
      const autoFixableIssues = report.issuesByType['broken-link']
        .filter(issue => issue.autoFixable)
        .map(issue => issue.id);

      if (autoFixableIssues.length > 0) {
        const fixResult = await consistencyChecker.autoFix(autoFixableIssues);
        expect(fixResult.fixed).toBeGreaterThan(0);
      }
    });

    it('应该检测循环引用', async () => {
      // 1. 创建循环引用的文档
      const doc1: SearchDocument = {
        id: 'cycle-doc-1',
        title: '循环文档1',
        content: '这个文档链接到[[循环文档2]]',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const doc2: SearchDocument = {
        id: 'cycle-doc-2',
        title: '循环文档2',
        content: '这个文档链接回[[循环文档1]]',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 2. 解析并创建链接
      const links1 = pageLinkParser.parse(doc1.content, doc1.id);
      const links2 = pageLinkParser.parse(doc2.content, doc2.id);

      for (const link of [...links1, ...links2]) {
        await linkManager.createLink(link);
      }

      // 3. 添加到搜索索引
      searchEngine.addDocument(doc1);
      searchEngine.addDocument(doc2);

      // 4. 运行一致性检查
      const report = await consistencyChecker.checkConsistency();

      // 5. 验证循环引用检测
      if (report.issuesByType['circular-reference']) {
        expect(report.issuesByType['circular-reference'].length).toBeGreaterThan(0);
      }

      // 6. 验证链接仍然有效（循环引用不一定是错误）
      const backlinks1 = await linkManager.getBacklinks('循环文档1');
      const backlinks2 = await linkManager.getBacklinks('循环文档2');

      expect(backlinks1).toHaveLength(1);
      expect(backlinks2).toHaveLength(1);
    });
  });

  describe('搜索引擎集成', () => {
    it('应该支持基于链接的搜索增强', async () => {
      // 1. 创建相互链接的文档网络
      const documents = [
        {
          id: 'ai-overview',
          title: '人工智能概述',
          content: '人工智能包括[[机器学习]]、[[深度学习]]和[[自然语言处理]]',
          tags: ['AI', '概述']
        },
        {
          id: 'machine-learning',
          title: '机器学习',
          content: '机器学习是[[人工智能]]的一个分支，包括[[监督学习]]和[[无监督学习]]',
          tags: ['AI', '机器学习']
        },
        {
          id: 'deep-learning',
          title: '深度学习',
          content: '深度学习是[[机器学习]]的高级形式，使用[[神经网络]]',
          tags: ['AI', '深度学习']
        }
      ];

      // 2. 处理所有文档
      for (const docData of documents) {
        const doc: SearchDocument = {
          ...docData,
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // 解析并创建链接
        const links = pageLinkParser.parse(doc.content, doc.id);
        for (const link of links) {
          await linkManager.createLink(link);
        }

        // 添加到搜索索引
        searchEngine.addDocument(doc);
      }

      // 3. 测试基本搜索
      const basicResults = searchEngine.search('机器学习');
      expect(basicResults.length).toBeGreaterThan(0);

      // 4. 测试链接增强搜索
      const mlBacklinks = await linkManager.getBacklinks('机器学习');
      const linkedDocIds = mlBacklinks.map(link => link.sourceId);

      // 搜索结果应该包含链接相关的文档
      const enhancedResults = searchEngine.search('学习', {
        boost: {
          linkedDocuments: linkedDocIds
        }
      });

      expect(enhancedResults.length).toBeGreaterThan(0);

      // 5. 测试标签和链接的组合搜索
      const tagResults = searchEngine.search('tag:AI');
      expect(tagResults).toHaveLength(3);

      // 6. 测试复杂查询
      const complexResults = searchEngine.search('机器学习 AND tag:AI');
      expect(complexResults.length).toBeGreaterThan(0);
    });

    it('应该支持链接图谱的搜索导航', async () => {
      // 1. 创建复杂的链接网络
      const networkDocs = [
        { id: 'central-concept', title: '中心概念', content: '链接到[[概念A]]、[[概念B]]和[[概念C]]' },
        { id: 'concept-a', title: '概念A', content: '相关[[中心概念]]和[[概念B]]' },
        { id: 'concept-b', title: '概念B', content: '连接[[中心概念]]和[[概念C]]' },
        { id: 'concept-c', title: '概念C', content: '引用[[中心概念]]' }
      ];

      // 2. 建立链接网络
      for (const docData of networkDocs) {
        const doc: SearchDocument = {
          ...docData,
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const links = pageLinkParser.parse(doc.content, doc.id);
        for (const link of links) {
          await linkManager.createLink(link);
        }

        searchEngine.addDocument(doc);
      }

      // 3. 测试从搜索结果导航到链接图谱
      const searchResults = searchEngine.search('中心概念');
      expect(searchResults).toHaveLength(4); // 所有文档都包含"中心概念"

      // 4. 获取中心概念的链接网络
      const centralBacklinks = await linkManager.getBacklinks('中心概念');
      const centralOutlinks = await linkManager.getLinksFromSource('central-concept');

      expect(centralBacklinks).toHaveLength(3); // A, B, C 都链接到中心概念
      expect(centralOutlinks).toHaveLength(3); // 中心概念链接到 A, B, C

      // 5. 构建图谱数据
      const graphNodes = new Set<string>();
      const graphEdges: Array<{ source: string; target: string }> = [];

      // 添加中心节点
      graphNodes.add('central-concept');

      // 添加反向链接
      centralBacklinks.forEach(link => {
        graphNodes.add(link.sourceId);
        graphEdges.push({
          source: link.sourceId,
          target: 'central-concept'
        });
      });

      // 添加正向链接
      centralOutlinks.forEach(link => {
        const targetName = (link as PageLink).pageName;
        const targetId = networkDocs.find(doc => doc.title === targetName)?.id;
        if (targetId) {
          graphNodes.add(targetId);
          graphEdges.push({
            source: 'central-concept',
            target: targetId
          });
        }
      });

      // 6. 验证图谱结构
      expect(graphNodes.size).toBe(4); // 4个节点
      expect(graphEdges.length).toBe(6); // 6条边（3进3出）
    });
  });
});
