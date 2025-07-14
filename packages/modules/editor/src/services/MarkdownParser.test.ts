/**
 * Markdown解析器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownParser, type MarkdownParseOptions } from './MarkdownParser';
import type { CustomElement } from '@minglog/editor';

describe('MarkdownParser', () => {
  let parser: MarkdownParser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  describe('基础Markdown解析', () => {
    it('应该解析段落', async () => {
      const markdown = '这是一个段落';
      const result = await parser.parseMarkdownToSlate(markdown);
      
      expect(result.content).toEqual([
        {
          type: 'paragraph',
          children: [{ text: '这是一个段落' }]
        }
      ]);
      expect(result.errors).toEqual([]);
    });

    it('应该解析标题', async () => {
      const markdown = '# 一级标题\n## 二级标题\n### 三级标题';
      const result = await parser.parseMarkdownToSlate(markdown);
      
      expect(result.content).toEqual([
        {
          type: 'heading-1',
          children: [{ text: '一级标题' }]
        },
        {
          type: 'heading-2',
          children: [{ text: '二级标题' }]
        },
        {
          type: 'heading-3',
          children: [{ text: '三级标题' }]
        }
      ]);
    });

    it('应该解析列表', async () => {
      const markdown = '- 项目1\n- 项目2\n\n1. 编号项目1\n2. 编号项目2';
      const result = await parser.parseMarkdownToSlate(markdown);
      
      expect(result.content).toEqual([
        {
          type: 'bulleted-list',
          children: [{ text: '项目1' }]
        },
        {
          type: 'bulleted-list',
          children: [{ text: '项目2' }]
        },
        {
          type: 'numbered-list',
          children: [{ text: '编号项目1' }]
        },
        {
          type: 'numbered-list',
          children: [{ text: '编号项目2' }]
        }
      ]);
    });

    it('应该解析任务列表', async () => {
      const markdown = '- [ ] 未完成任务\n- [x] 已完成任务';
      const result = await parser.parseMarkdownToSlate(markdown);
      
      expect(result.content).toEqual([
        {
          type: 'todo-list',
          checked: false,
          children: [{ text: '未完成任务' }]
        },
        {
          type: 'todo-list',
          checked: true,
          children: [{ text: '已完成任务' }]
        }
      ]);
    });

    it('应该解析引用', async () => {
      const markdown = '> 这是一个引用';
      const result = await parser.parseMarkdownToSlate(markdown);
      
      expect(result.content).toEqual([
        {
          type: 'quote',
          children: [{ text: '这是一个引用' }]
        }
      ]);
    });

    it('应该解析代码块', async () => {
      const markdown = '```javascript\nconsole.log("Hello");\n```';
      const result = await parser.parseMarkdownToSlate(markdown);
      
      expect(result.content).toEqual([
        {
          type: 'code',
          language: 'javascript',
          children: [{ text: 'console.log("Hello");' }]
        }
      ]);
    });

    it('应该解析分隔线', async () => {
      const markdown = '---';
      const result = await parser.parseMarkdownToSlate(markdown);
      
      expect(result.content).toEqual([
        {
          type: 'divider',
          children: [{ text: '' }]
        }
      ]);
    });
  });

  describe('特殊语法解析', () => {
    it('应该解析双向链接', async () => {
      const markdown = '这里有一个[[页面链接]]';
      const result = await parser.parseMarkdownToSlate(markdown);
      
      expect(result.links).toEqual(['页面链接']);
      expect(result.content[0].children[0].text).toContain('[[页面链接]]');
    });

    it('应该解析标签', async () => {
      const markdown = '这是一个#标签 和另一个#重要标签';
      const result = await parser.parseMarkdownToSlate(markdown);
      
      expect(result.tags).toEqual(['标签', '重要标签']);
      expect(result.content[0].children[0].text).toContain('#标签');
      expect(result.content[0].children[0].text).toContain('#重要标签');
    });

    it('应该解析块引用', async () => {
      const markdown = '参考这个块((block-123))';
      const result = await parser.parseMarkdownToSlate(markdown);
      
      expect(result.blockReferences).toEqual(['block-123']);
      expect(result.content[0].children[0].text).toContain('((block-123))');
    });

    it('应该同时解析多种特殊语法', async () => {
      const markdown = '链接到[[页面]]，标记为#重要，引用((block-456))';
      const result = await parser.parseMarkdownToSlate(markdown);
      
      expect(result.links).toEqual(['页面']);
      expect(result.tags).toEqual(['重要']);
      expect(result.blockReferences).toEqual(['block-456']);
    });
  });

  describe('Slate到Markdown转换', () => {
    it('应该转换段落', async () => {
      const blocks: CustomElement[] = [
        {
          type: 'paragraph',
          children: [{ text: '这是一个段落' }]
        }
      ];
      
      const markdown = await parser.parseSlateToMarkdown(blocks);
      expect(markdown).toBe('这是一个段落');
    });

    it('应该转换标题', async () => {
      const blocks: CustomElement[] = [
        {
          type: 'heading-1',
          children: [{ text: '一级标题' }]
        },
        {
          type: 'heading-2',
          children: [{ text: '二级标题' }]
        }
      ];
      
      const markdown = await parser.parseSlateToMarkdown(blocks);
      expect(markdown).toBe('# 一级标题\n\n## 二级标题');
    });

    it('应该转换列表', async () => {
      const blocks: CustomElement[] = [
        {
          type: 'bulleted-list',
          children: [{ text: '项目1' }]
        },
        {
          type: 'numbered-list',
          children: [{ text: '编号项目1' }]
        }
      ];
      
      const markdown = await parser.parseSlateToMarkdown(blocks);
      expect(markdown).toBe('- 项目1\n\n1. 编号项目1');
    });

    it('应该转换任务列表', async () => {
      const blocks: CustomElement[] = [
        {
          type: 'todo-list',
          checked: false,
          children: [{ text: '未完成' }]
        } as any,
        {
          type: 'todo-list',
          checked: true,
          children: [{ text: '已完成' }]
        } as any
      ];
      
      const markdown = await parser.parseSlateToMarkdown(blocks);
      expect(markdown).toBe('- [ ] 未完成\n\n- [x] 已完成');
    });

    it('应该转换代码块', async () => {
      const blocks: CustomElement[] = [
        {
          type: 'code',
          language: 'javascript',
          children: [{ text: 'console.log("Hello");' }]
        } as any
      ];
      
      const markdown = await parser.parseSlateToMarkdown(blocks);
      expect(markdown).toBe('```javascript\nconsole.log("Hello");\n```');
    });
  });

  describe('解析选项', () => {
    it('应该支持禁用双向链接', async () => {
      const parser = new MarkdownParser({ enableBidirectionalLinks: false });
      const markdown = '这里有一个[[页面链接]]';
      const result = await parser.parseMarkdownToSlate(markdown);
      
      expect(result.links).toEqual([]);
      expect(result.content[0].children[0].text).toBe('这里有一个[[页面链接]]');
    });

    it('应该支持禁用标签', async () => {
      const parser = new MarkdownParser({ enableTags: false });
      const markdown = '这是一个#标签';
      const result = await parser.parseMarkdownToSlate(markdown);
      
      expect(result.tags).toEqual([]);
      expect(result.content[0].children[0].text).toBe('这是一个#标签');
    });

    it('应该支持禁用块引用', async () => {
      const parser = new MarkdownParser({ enableBlockReferences: false });
      const markdown = '参考这个块((block-123))';
      const result = await parser.parseMarkdownToSlate(markdown);
      
      expect(result.blockReferences).toEqual([]);
      expect(result.content[0].children[0].text).toBe('参考这个块((block-123))');
    });

    it('应该支持更新选项', () => {
      const parser = new MarkdownParser({ enableTags: false });
      expect(parser.getOptions().enableTags).toBe(false);
      
      parser.updateOptions({ enableTags: true });
      expect(parser.getOptions().enableTags).toBe(true);
    });
  });

  describe('统计信息', () => {
    it('应该计算正确的统计信息', async () => {
      const markdown = '# 标题\n\n这是段落内容，包含[[链接]]和#标签。\n\n- 列表项';
      const result = await parser.parseMarkdownToSlate(markdown);
      
      expect(result.stats.blockCount).toBe(3);
      expect(result.stats.linkCount).toBe(1);
      expect(result.stats.tagCount).toBe(1);
      expect(result.stats.characterCount).toBe(markdown.length);
      expect(result.stats.wordCount).toBeGreaterThan(0);
    });
  });

  describe('错误处理', () => {
    it('应该处理空输入', async () => {
      const result = await parser.parseMarkdownToSlate('');
      
      expect(result.content).toEqual([]);
      expect(result.errors).toEqual([]);
      expect(result.stats.blockCount).toBe(0);
    });

    it('应该处理无效的Slate内容', async () => {
      const invalidBlocks = [{ type: 'invalid', children: null }] as any;
      
      await expect(parser.parseSlateToMarkdown(invalidBlocks)).rejects.toThrow();
    });
  });
});
