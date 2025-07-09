/**
 * 链接系统集成测试
 * 测试各个模块之间的协作和数据流
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LinkManagerService } from '../../services/LinkManagerService';
import { SearchEngine } from '../../search/SearchEngine';
import { LinkConsistencyChecker } from '../../services/LinkConsistencyChecker';
import { PageLinkParser } from '../../parsers/PageLinkParser';
import { BlockLinkParser } from '../../parsers/BlockLinkParser';
import { testUtils } from '@test/setup';
import type { PageLink, BlockLink, SearchDocument } from '../../types/links';

describe('链接系统集成测试', () => {
  let linkManager: LinkManagerService;
  let searchEngine: SearchEngine;
  let consistencyChecker: LinkConsistencyChecker;
  let pageLinkParser: PageLinkParser;
  let blockLinkParser: BlockLinkParser;

  beforeEach(() => {
    linkManager = new LinkManagerService();
    searchEngine = new SearchEngine();
    consistencyChecker = new LinkConsistencyChecker(linkManager);
    pageLinkParser = new PageLinkParser();
    blockLinkParser = new BlockLinkParser();
  });

  describe('链接创建和搜索集成', () => {
    it('应该能够创建链接并在搜索中找到', async () => {
      // 创建测试文档
      const document: SearchDocument = {
        id: 'test-doc',
        title: '测试文档',
        content: '这是一个包含[[链接页面]]的测试文档',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 解析链接
      const links = pageLinkParser.parse(document.content, document.id);
      expect(links).toHaveLength(1);
      expect(links[0].pageName).toBe('链接页面');

      // 创建链接
      for (const link of links) {
        await linkManager.createLink(link);
      }

      // 添加文档到搜索引擎
      searchEngine.addDocument(document);

      // 搜索应该能找到文档
      const searchResults = searchEngine.search('链接页面');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].document.id).toBe('test-doc');

      // 获取反向链接
      const backlinks = await linkManager.getBacklinks('链接页面');
      expect(backlinks).toHaveLength(1);
      expect(backlinks[0].sourceId).toBe('test-doc');
    });

    it('应该能够处理复杂的链接结构', async () => {
      const documents = [
        {
          id: 'doc1',
          title: '文档1',
          content: '这个文档链接到[[文档2]]和[[文档3]]',
          type: 'page' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'doc2',
          title: '文档2',
          content: '这个文档链接回[[文档1]]并引用((block-123))',
          type: 'page' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'doc3',
          title: '文档3',
          content: '这是一个独立的文档',
          type: 'page' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // 处理所有文档
      for (const doc of documents) {
        // 解析页面链接
        const pageLinks = pageLinkParser.parse(doc.content, doc.id);
        for (const link of pageLinks) {
          await linkManager.createLink(link);
        }

        // 解析块链接
        const blockLinks = blockLinkParser.parse(doc.content, doc.id);
        for (const link of blockLinks) {
          await linkManager.createLink(link);
        }

        // 添加到搜索引擎
        searchEngine.addDocument(doc);
      }

      // 验证链接网络
      const doc1Backlinks = await linkManager.getBacklinks('文档1');
      expect(doc1Backlinks).toHaveLength(1);
      expect(doc1Backlinks[0].sourceId).toBe('doc2');

      const doc2Backlinks = await linkManager.getBacklinks('文档2');
      expect(doc2Backlinks).toHaveLength(1);
      expect(doc2Backlinks[0].sourceId).toBe('doc1');

      const doc3Backlinks = await linkManager.getBacklinks('文档3');
      expect(doc3Backlinks).toHaveLength(1);
      expect(doc3Backlinks[0].sourceId).toBe('doc1');

      // 验证搜索功能
      const searchResults = searchEngine.search('文档');
      expect(searchResults).toHaveLength(3);
    });
  });

  describe('一致性检查集成', () => {
    it('应该检测和修复链接一致性问题', async () => {
      // 创建有问题的链接结构
      const brokenLink: PageLink = {
        id: 'broken-link',
        type: 'page-reference',
        pageName: 'nonexistent-page',
        alias: '不存在的页面',
        position: 0,
        context: 'source-page'
      };

      await linkManager.createLink(brokenLink);

      // 运行一致性检查
      const report = await consistencyChecker.checkConsistency();
      
      expect(report.totalIssues).toBeGreaterThan(0);
      expect(report.issuesByType['broken-link']).toBeDefined();
      expect(report.issuesByType['broken-link'].length).toBeGreaterThan(0);

      // 尝试自动修复
      const autoFixableIssues = report.issuesByType['broken-link']
        .filter(issue => issue.autoFixable)
        .map(issue => issue.id);

      if (autoFixableIssues.length > 0) {
        const fixResult = await consistencyChecker.autoFix(autoFixableIssues);
        expect(fixResult.fixed).toBeGreaterThan(0);
      }
    });

    it('应该处理循环引用检测', async () => {
      // 创建循环引用
      const links: PageLink[] = [
        {
          id: 'link1',
          type: 'page-reference',
          pageName: 'page2',
          alias: '页面2',
          position: 0,
          context: 'page1'
        },
        {
          id: 'link2',
          type: 'page-reference',
          pageName: 'page3',
          alias: '页面3',
          position: 0,
          context: 'page2'
        },
        {
          id: 'link3',
          type: 'page-reference',
          pageName: 'page1',
          alias: '页面1',
          position: 0,
          context: 'page3'
        }
      ];

      for (const link of links) {
        await linkManager.createLink(link);
      }

      const report = await consistencyChecker.checkConsistency();
      
      expect(report.issuesByType['circular-reference']).toBeDefined();
      expect(report.issuesByType['circular-reference'].length).toBeGreaterThan(0);
    });
  });

  describe('搜索和链接导航集成', () => {
    it('应该支持通过搜索发现链接关系', async () => {
      const documents = [
        {
          id: 'concept-a',
          title: '概念A',
          content: '概念A与[[概念B]]密切相关，同时也涉及[[概念C]]',
          type: 'page' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['概念', '理论']
        },
        {
          id: 'concept-b',
          title: '概念B',
          content: '概念B是[[概念A]]的延伸，具有独特的特性',
          type: 'page' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['概念', '实践']
        },
        {
          id: 'concept-c',
          title: '概念C',
          content: '概念C提供了不同的视角来理解[[概念A]]',
          type: 'page' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['概念', '视角']
        }
      ];

      // 处理文档和链接
      for (const doc of documents) {
        const links = pageLinkParser.parse(doc.content, doc.id);
        for (const link of links) {
          await linkManager.createLink(link);
        }
        searchEngine.addDocument(doc);
      }

      // 搜索概念A
      const searchResults = searchEngine.search('概念A');
      expect(searchResults.length).toBeGreaterThan(0);

      // 获取概念A的反向链接
      const backlinks = await linkManager.getBacklinks('概念A');
      expect(backlinks).toHaveLength(2); // 来自概念B和概念C

      // 验证链接网络的完整性
      const conceptALinks = await linkManager.getLinksFromSource('concept-a');
      expect(conceptALinks).toHaveLength(2); // 指向概念B和概念C

      // 通过标签搜索相关概念
      const tagSearchResults = searchEngine.search('', {
        filters: { tags: ['概念'] }
      });
      expect(tagSearchResults).toHaveLength(3);
    });

    it('应该支持高级搜索语法查找链接', async () => {
      const document: SearchDocument = {
        id: 'advanced-doc',
        title: '高级文档',
        content: '这个文档包含[[重要概念]]和[[次要概念]]，还有一些((block-ref-123))',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['高级', '概念']
      };

      // 解析并创建链接
      const pageLinks = pageLinkParser.parse(document.content, document.id);
      const blockLinks = blockLinkParser.parse(document.content, document.id);
      
      for (const link of [...pageLinks, ...blockLinks]) {
        await linkManager.createLink(link);
      }

      searchEngine.addDocument(document);

      // 使用高级搜索语法
      const titleSearch = searchEngine.search('title:"高级文档"');
      expect(titleSearch).toHaveLength(1);

      const tagSearch = searchEngine.search('tag:高级');
      expect(tagSearch).toHaveLength(1);

      const contentSearch = searchEngine.search('重要概念 AND 次要概念');
      expect(contentSearch).toHaveLength(1);
    });
  });

  describe('性能集成测试', () => {
    it('应该在大量数据下保持性能', async () => {
      const startTime = performance.now();

      // 创建大量文档和链接
      const documentCount = 100;
      const documents: SearchDocument[] = [];

      for (let i = 0; i < documentCount; i++) {
        const doc: SearchDocument = {
          id: `doc-${i}`,
          title: `文档 ${i}`,
          content: `这是文档${i}，它链接到[[文档 ${(i + 1) % documentCount}]]和[[文档 ${(i + 2) % documentCount}]]`,
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [`tag-${i % 10}`]
        };

        documents.push(doc);

        // 解析链接
        const links = pageLinkParser.parse(doc.content, doc.id);
        for (const link of links) {
          await linkManager.createLink(link);
        }

        // 添加到搜索引擎
        searchEngine.addDocument(doc);
      }

      const setupTime = performance.now() - startTime;
      expect(setupTime).toBeLessThan(5000); // 5秒内完成设置

      // 测试搜索性能
      const searchStart = performance.now();
      const searchResults = searchEngine.search('文档');
      const searchTime = performance.now() - searchStart;
      
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchTime).toBeLessThan(100); // 100ms内完成搜索

      // 测试链接查询性能
      const linkStart = performance.now();
      const backlinks = await linkManager.getBacklinks('文档 0');
      const linkTime = performance.now() - linkStart;
      
      expect(backlinks.length).toBeGreaterThan(0);
      expect(linkTime).toBeLessThan(50); // 50ms内完成链接查询

      // 测试一致性检查性能
      const consistencyStart = performance.now();
      const report = await consistencyChecker.checkConsistency();
      const consistencyTime = performance.now() - consistencyStart;
      
      expect(report).toBeDefined();
      expect(consistencyTime).toBeLessThan(2000); // 2秒内完成一致性检查
    });
  });

  describe('错误处理集成', () => {
    it('应该优雅地处理系统级错误', async () => {
      // 模拟存储错误
      const originalCreateLink = linkManager.createLink;
      vi.spyOn(linkManager, 'createLink').mockRejectedValueOnce(new Error('Storage error'));

      const link: PageLink = {
        id: 'test-link',
        type: 'page-reference',
        pageName: 'test-page',
        alias: 'Test Page',
        position: 0,
        context: 'source'
      };

      await expect(linkManager.createLink(link)).rejects.toThrow('Storage error');

      // 恢复原始方法
      vi.mocked(linkManager.createLink).mockRestore();

      // 验证系统仍然可以正常工作
      await expect(linkManager.createLink(link)).resolves.not.toThrow();
    });

    it('应该处理搜索引擎错误', async () => {
      const invalidDocument = {
        id: null as any,
        title: '',
        content: '',
        type: 'page' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => {
        searchEngine.addDocument(invalidDocument);
      }).toThrow();

      // 验证搜索引擎仍然可以正常工作
      const validDocument: SearchDocument = {
        id: 'valid-doc',
        title: '有效文档',
        content: '这是一个有效的文档',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => {
        searchEngine.addDocument(validDocument);
      }).not.toThrow();
    });
  });
});
