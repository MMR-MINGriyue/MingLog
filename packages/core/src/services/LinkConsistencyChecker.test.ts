/**
 * LinkConsistencyChecker 单元测试
 * 测试链接一致性检查和自动修复功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LinkConsistencyChecker } from './LinkConsistencyChecker';
import { LinkManagerService } from './LinkManagerService';
import { testUtils } from '@test/setup';
import type { PageLink, BlockLink } from '../types/links';

// 模拟LinkManagerService
const mockLinkManager = {
  getAllPages: vi.fn(),
  getAllBlocks: vi.fn(),
  getAllLinks: vi.fn(),
  createLink: vi.fn(),
  updateLink: vi.fn(),
  deleteLink: vi.fn()
} as unknown as LinkManagerService;

describe('LinkConsistencyChecker', () => {
  let checker: LinkConsistencyChecker;
  let mockPages: any[];
  let mockBlocks: any[];
  let mockLinks: (PageLink | BlockLink)[];

  beforeEach(() => {
    checker = new LinkConsistencyChecker(mockLinkManager);
    
    mockPages = [
      { id: 'page1', title: '页面1', content: '内容1' },
      { id: 'page2', title: '页面2', content: '内容2' },
      { id: 'page3', title: '页面3', content: '内容3' }
    ];

    mockBlocks = [
      { id: 'block1', content: '块1内容', pageId: 'page1' },
      { id: 'block2', content: '块2内容', pageId: 'page2' },
      { id: 'block3', content: '块3内容', pageId: 'page3' }
    ];

    mockLinks = [
      {
        id: 'link1',
        type: 'page-reference',
        pageName: 'page1',
        alias: '页面1',
        position: 0,
        context: 'page2'
      } as PageLink,
      {
        id: 'link2',
        type: 'page-reference',
        pageName: 'page2',
        alias: '页面2',
        position: 10,
        context: 'page1'
      } as PageLink,
      {
        id: 'link3',
        type: 'block-reference',
        blockId: 'block1',
        alias: '块1',
        position: 20,
        context: 'page3'
      } as BlockLink,
      {
        id: 'link4',
        type: 'page-reference',
        pageName: 'nonexistent-page',
        alias: '不存在的页面',
        position: 30,
        context: 'page1'
      } as PageLink
    ];

    // 设置模拟返回值
    vi.mocked(mockLinkManager.getAllPages).mockResolvedValue(mockPages);
    vi.mocked(mockLinkManager.getAllBlocks).mockResolvedValue(mockBlocks);
    vi.mocked(mockLinkManager.getAllLinks).mockResolvedValue(mockLinks);
  });

  describe('一致性检查', () => {
    it('应该检测损坏的页面链接', async () => {
      const report = await checker.checkConsistency();
      
      expect(report.issuesByType['broken-link']).toBeDefined();
      expect(report.issuesByType['broken-link'].length).toBeGreaterThan(0);
      
      const brokenLink = report.issuesByType['broken-link'].find(
        issue => issue.targetId === 'nonexistent-page'
      );
      expect(brokenLink).toBeDefined();
      expect(brokenLink!.severity).toBe('error');
    });

    it('应该检测损坏的块链接', async () => {
      const brokenBlockLink: BlockLink = {
        id: 'broken-block-link',
        type: 'block-reference',
        blockId: 'nonexistent-block',
        alias: '不存在的块',
        position: 0,
        context: 'page1'
      };

      mockLinks.push(brokenBlockLink);
      vi.mocked(mockLinkManager.getAllLinks).mockResolvedValue(mockLinks);

      const report = await checker.checkConsistency();
      
      const brokenBlockIssue = report.issuesByType['broken-link'].find(
        issue => issue.targetId === 'nonexistent-block'
      );
      expect(brokenBlockIssue).toBeDefined();
    });

    it('应该检测孤立页面', async () => {
      // 添加一个没有被引用的页面
      const orphanPage = { id: 'orphan-page', title: '孤立页面', content: '内容' };
      mockPages.push(orphanPage);
      vi.mocked(mockLinkManager.getAllPages).mockResolvedValue(mockPages);

      const report = await checker.checkConsistency();
      
      expect(report.issuesByType['orphaned-page']).toBeDefined();
      const orphanIssue = report.issuesByType['orphaned-page'].find(
        issue => issue.sourceId === 'orphan-page'
      );
      expect(orphanIssue).toBeDefined();
      expect(orphanIssue!.severity).toBe('warning');
    });

    it('应该检测循环引用', async () => {
      // 创建循环引用
      const cyclicLinks: PageLink[] = [
        {
          id: 'cyclic1',
          type: 'page-reference',
          pageName: 'page2',
          alias: '页面2',
          position: 0,
          context: 'page1'
        },
        {
          id: 'cyclic2',
          type: 'page-reference',
          pageName: 'page3',
          alias: '页面3',
          position: 0,
          context: 'page2'
        },
        {
          id: 'cyclic3',
          type: 'page-reference',
          pageName: 'page1',
          alias: '页面1',
          position: 0,
          context: 'page3'
        }
      ];

      vi.mocked(mockLinkManager.getAllLinks).mockResolvedValue(cyclicLinks);

      const report = await checker.checkConsistency();
      
      expect(report.issuesByType['circular-reference']).toBeDefined();
      expect(report.issuesByType['circular-reference'].length).toBeGreaterThan(0);
    });

    it('应该检测重复链接', async () => {
      // 添加重复链接
      const duplicateLink: PageLink = {
        id: 'duplicate-link',
        type: 'page-reference',
        pageName: 'page1',
        alias: '页面1',
        position: 5,
        context: 'page2'
      };

      mockLinks.push(duplicateLink);
      vi.mocked(mockLinkManager.getAllLinks).mockResolvedValue(mockLinks);

      const report = await checker.checkConsistency();
      
      expect(report.issuesByType['duplicate-link']).toBeDefined();
      expect(report.issuesByType['duplicate-link'].length).toBeGreaterThan(0);
    });

    it('应该检测无效语法', async () => {
      // 添加无效语法的链接
      const invalidLink: PageLink = {
        id: 'invalid-link',
        type: 'page-reference',
        pageName: '', // 空的页面名
        alias: '无效链接',
        position: 0,
        context: 'page1'
      };

      mockLinks.push(invalidLink);
      vi.mocked(mockLinkManager.getAllLinks).mockResolvedValue(mockLinks);

      const report = await checker.checkConsistency();
      
      expect(report.issuesByType['invalid-syntax']).toBeDefined();
      expect(report.issuesByType['invalid-syntax'].length).toBeGreaterThan(0);
    });
  });

  describe('修复建议', () => {
    it('应该为损坏链接提供修复建议', async () => {
      const report = await checker.checkConsistency();
      
      const brokenLinkIssue = report.issuesByType['broken-link'].find(
        issue => issue.targetId === 'nonexistent-page'
      );
      
      expect(brokenLinkIssue!.suggestions).toBeDefined();
      expect(brokenLinkIssue!.suggestions.length).toBeGreaterThan(0);
      
      // 应该包含移除链接的建议
      const removeSuggestion = brokenLinkIssue!.suggestions.find(
        s => s.type === 'remove'
      );
      expect(removeSuggestion).toBeDefined();
    });

    it('应该为相似页面名提供替换建议', async () => {
      // 添加相似的页面名
      const similarPage = { id: 'page-similar', title: 'nonexistent-page-similar', content: '内容' };
      mockPages.push(similarPage);
      vi.mocked(mockLinkManager.getAllPages).mockResolvedValue(mockPages);

      const report = await checker.checkConsistency();
      
      const brokenLinkIssue = report.issuesByType['broken-link'].find(
        issue => issue.targetId === 'nonexistent-page'
      );
      
      const replaceSuggestion = brokenLinkIssue!.suggestions.find(
        s => s.type === 'replace'
      );
      expect(replaceSuggestion).toBeDefined();
    });

    it('应该按置信度排序建议', async () => {
      const report = await checker.checkConsistency();
      
      const brokenLinkIssue = report.issuesByType['broken-link'][0];
      const suggestions = brokenLinkIssue.suggestions;
      
      for (let i = 0; i < suggestions.length - 1; i++) {
        expect(suggestions[i].confidence).toBeGreaterThanOrEqual(suggestions[i + 1].confidence);
      }
    });
  });

  describe('自动修复', () => {
    it('应该能够自动修复可修复的问题', async () => {
      const report = await checker.checkConsistency();
      
      const autoFixableIssues = report.issuesByType['broken-link']
        .filter(issue => issue.autoFixable)
        .map(issue => issue.id);
      
      if (autoFixableIssues.length > 0) {
        const result = await checker.autoFix(autoFixableIssues);
        expect(result.fixed).toBeGreaterThan(0);
        expect(result.errors.length).toBe(0);
      }
    });

    it('应该报告无法修复的问题', async () => {
      const nonFixableIssueId = 'non-fixable-issue';
      
      const result = await checker.autoFix([nonFixableIssueId]);
      expect(result.fixed).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain(nonFixableIssueId);
    });

    it('应该处理修复过程中的错误', async () => {
      const report = await checker.checkConsistency();
      const issueId = report.issuesByType['broken-link'][0]?.id;
      
      if (issueId) {
        // 模拟修复过程中的错误
        vi.mocked(mockLinkManager.deleteLink).mockRejectedValue(new Error('修复失败'));
        
        const result = await checker.autoFix([issueId]);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('报告生成', () => {
    it('应该生成完整的一致性报告', async () => {
      const report = await checker.checkConsistency();
      
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.totalIssues).toBeGreaterThanOrEqual(0);
      expect(report.issuesByType).toBeDefined();
      expect(report.issuesBySeverity).toBeDefined();
      expect(report.autoFixableCount).toBeGreaterThanOrEqual(0);
      expect(report.stats).toBeDefined();
    });

    it('应该正确统计问题数量', async () => {
      const report = await checker.checkConsistency();
      
      let totalFromTypes = 0;
      Object.values(report.issuesByType).forEach(issues => {
        totalFromTypes += issues.length;
      });
      
      expect(report.totalIssues).toBe(totalFromTypes);
    });

    it('应该正确分组问题严重程度', async () => {
      const report = await checker.checkConsistency();
      
      let totalFromSeverity = 0;
      Object.values(report.issuesBySeverity).forEach(issues => {
        totalFromSeverity += issues.length;
      });
      
      expect(report.totalIssues).toBe(totalFromSeverity);
    });

    it('应该提供准确的统计信息', async () => {
      const report = await checker.checkConsistency();
      
      expect(report.stats.totalPages).toBe(mockPages.length);
      expect(report.stats.totalBlocks).toBe(mockBlocks.length);
      expect(report.stats.totalLinks).toBe(mockLinks.length);
      expect(report.stats.brokenLinks).toBeGreaterThanOrEqual(0);
      expect(report.stats.orphanedPages).toBeGreaterThanOrEqual(0);
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内完成检查', async () => {
      const start = performance.now();
      await checker.checkConsistency();
      const end = performance.now();
      
      expect(end - start).toBeLessThan(1000); // 1秒内完成
    });

    it('应该处理大量数据', async () => {
      // 创建大量测试数据
      const largePages = Array.from({ length: 1000 }, (_, i) => ({
        id: `large-page-${i}`,
        title: `Large Page ${i}`,
        content: `Content ${i}`
      }));

      const largeLinks = Array.from({ length: 500 }, (_, i) => ({
        id: `large-link-${i}`,
        type: 'page-reference' as const,
        pageName: `large-page-${i % 1000}`,
        alias: `Page ${i}`,
        position: 0,
        context: `large-page-${(i + 1) % 1000}`
      }));

      vi.mocked(mockLinkManager.getAllPages).mockResolvedValue(largePages);
      vi.mocked(mockLinkManager.getAllLinks).mockResolvedValue(largeLinks);

      const start = performance.now();
      const report = await checker.checkConsistency();
      const end = performance.now();
      
      expect(report).toBeDefined();
      expect(end - start).toBeLessThan(5000); // 5秒内完成
    });
  });
});
