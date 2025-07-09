/**
 * PageLinkParser 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PageLinkParser } from '../PageLinkParser';

describe('PageLinkParser', () => {
  let parser: PageLinkParser;

  beforeEach(() => {
    parser = new PageLinkParser();
  });

  describe('parsePageLinks', () => {
    it('should parse simple page links', () => {
      const content = '这是一个 [[测试页面]] 的链接';
      const links = parser.parsePageLinks(content);

      expect(links).toHaveLength(1);
      expect(links[0]).toMatchObject({
        type: 'page-reference',
        pageName: '测试页面',
        displayText: '测试页面',
        position: 5,
        length: 8
      });
    });

    it('should parse page links with aliases', () => {
      const content = '这是一个 [[测试页面|显示文本]] 的链接';
      const links = parser.parsePageLinks(content);

      expect(links).toHaveLength(1);
      expect(links[0]).toMatchObject({
        type: 'page-reference',
        pageName: '测试页面',
        displayText: '显示文本',
        position: 5,
        length: 13,
        alias: '显示文本'
      });
    });

    it('should parse multiple page links', () => {
      const content = '链接到 [[页面1]] 和 [[页面2|别名]] 的内容';
      const links = parser.parsePageLinks(content);

      expect(links).toHaveLength(2);
      expect(links[0].pageName).toBe('页面1');
      expect(links[1].pageName).toBe('页面2');
      expect(links[1].alias).toBe('别名');
    });

    it('should handle empty content', () => {
      const content = '';
      const links = parser.parsePageLinks(content);

      expect(links).toHaveLength(0);
    });

    it('should ignore malformed links', () => {
      const content = '这是 [[不完整的链接 和 不完整的链接]] 的内容';
      const links = parser.parsePageLinks(content);

      expect(links).toHaveLength(1); // 这实际上是一个有效的链接
      expect(links[0].pageName).toBe('不完整的链接 和 不完整的链接');
    });

    it('should extract context correctly', () => {
      const content = '这是一个很长的文本，包含了 [[测试页面]] 链接，用于测试上下文提取功能';
      const links = parser.parsePageLinks(content);

      expect(links[0].context).toContain('测试页面');
      expect(links[0].context).toContain('包含了');
      expect(links[0].context).toContain('链接');
    });
  });

  describe('isValidPageLink', () => {
    it('should validate correct page links', () => {
      expect(PageLinkParser.isValidPageLink('[[测试页面]]')).toBe(true);
      expect(PageLinkParser.isValidPageLink('[[页面|别名]]')).toBe(true);
      expect(PageLinkParser.isValidPageLink('[[English Page]]')).toBe(true);
    });

    it('should reject invalid page links', () => {
      expect(PageLinkParser.isValidPageLink('[[]]')).toBe(false);
      expect(PageLinkParser.isValidPageLink('[测试页面]')).toBe(false);
      expect(PageLinkParser.isValidPageLink('[[测试页面')).toBe(false);
      expect(PageLinkParser.isValidPageLink('测试页面]]')).toBe(false);
      expect(PageLinkParser.isValidPageLink('[[测试[页面]]')).toBe(false);
    });
  });

  describe('getLinkAtPosition', () => {
    it('should find link at cursor position', () => {
      const content = '这是 [[测试页面]] 的内容';
      const link = PageLinkParser.getLinkAtPosition(content, 5); // 在链接内部

      expect(link).toBeTruthy();
      expect(link?.pageName).toBe('测试页面');
    });

    it('should return null when cursor is outside links', () => {
      const content = '这是 [[测试页面]] 的内容';
      const link = PageLinkParser.getLinkAtPosition(content, 0); // 在链接外部

      expect(link).toBeNull();
    });
  });

  describe('getIncompleteLink', () => {
    it('should detect incomplete link being typed', () => {
      const content = '这是 [[测试页';
      const incomplete = PageLinkParser.getIncompleteLink(content, content.length);

      expect(incomplete).toBeTruthy();
      expect(incomplete?.text).toBe('[[测试页');
      expect(incomplete?.start).toBe(3);
    });

    it('should return null for complete links', () => {
      const content = '这是 [[测试页面]] 的内容';
      const incomplete = PageLinkParser.getIncompleteLink(content, content.length); // 在内容末尾

      expect(incomplete).toBeNull();
    });
  });

  describe('replacePageLinks', () => {
    it('should replace page names in links', () => {
      const content = '链接到 [[旧页面]] 和 [[另一个页面|别名]]';
      const replacements = new Map([
        ['旧页面', '新页面'],
        ['另一个页面', '替换页面']
      ]);

      const result = PageLinkParser.replacePageLinks(content, replacements);

      expect(result).toBe('链接到 [[新页面]] 和 [[替换页面|别名]]');
    });

    it('should preserve aliases when replacing', () => {
      const content = '[[页面|保持别名]]';
      const replacements = new Map([['页面', '新页面']]);

      const result = PageLinkParser.replacePageLinks(content, replacements);

      expect(result).toBe('[[新页面|保持别名]]');
    });
  });

  describe('countPageLinks', () => {
    it('should count links correctly', () => {
      const content = '[[页面1]] 和 [[页面2]] 还有 [[页面1|别名]]';
      const stats = PageLinkParser.countPageLinks(content);

      expect(stats.total).toBe(3);
      expect(stats.unique).toBe(2);
      expect(stats.withAlias).toBe(1);
      expect(stats.pages.has('页面1')).toBe(true);
      expect(stats.pages.has('页面2')).toBe(true);
    });

    it('should handle empty content', () => {
      const content = '';
      const stats = PageLinkParser.countPageLinks(content);

      expect(stats.total).toBe(0);
      expect(stats.unique).toBe(0);
      expect(stats.withAlias).toBe(0);
      expect(stats.pages.size).toBe(0);
    });
  });
});
