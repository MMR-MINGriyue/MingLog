/**
 * 双向链接系统单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEditor } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { BidirectionalLinkSystem, PageLinkElement, BlockReferenceElement } from '../links/BidirectionalLinkSystem';

// 模拟事件总线
class MockEventBus {
  private listeners = new Map<string, Function[]>();

  emit(type: string, data?: any, source?: string): void {
    const handlers = this.listeners.get(type) || [];
    handlers.forEach(handler => handler({ type, data, source, timestamp: Date.now() }));
  }

  on(type: string, handler: Function): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(handler);
  }

  off(type: string, handler: Function): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
}

// 模拟ReactEditor
const mockReactEditor = {
  findPath: vi.fn(),
  toDOMNode: vi.fn(),
  toDOMRange: vi.fn(() => ({
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 100, bottom: 20 })
  }))
};

// 创建测试编辑器
const createTestEditor = () => {
  const editor = withHistory(withReact(createEditor()));
  Object.assign(editor, mockReactEditor);
  
  // 模拟编辑器方法
  editor.insertNodes = vi.fn();
  editor.insertText = vi.fn();
  editor.string = vi.fn();
  editor.nodes = vi.fn();
  
  return editor as any;
};

describe('BidirectionalLinkSystem', () => {
  let editor: any;
  let eventBus: MockEventBus;
  let linkSystem: BidirectionalLinkSystem;

  beforeEach(() => {
    editor = createTestEditor();
    eventBus = new MockEventBus();
    linkSystem = new BidirectionalLinkSystem(editor, eventBus as any);
  });

  afterEach(() => {
    linkSystem.destroy();
  });

  describe('页面链接创建', () => {
    it('应该能够创建新的页面链接', () => {
      const eventHandler = vi.fn();
      eventBus.on('link:created', eventHandler);

      linkSystem.createPageLink('测试页面');

      expect(editor.insertNodes).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'page-link',
          pageName: '测试页面',
          exists: false
        })
      ]);

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'page',
            pageName: '测试页面',
            exists: false
          })
        })
      );
    });

    it('应该能够创建带自定义显示文本的页面链接', () => {
      linkSystem.createPageLink('实际页面名', '显示文本');

      expect(editor.insertNodes).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'page-link',
          pageName: '实际页面名',
          displayText: '显示文本',
          children: [{ text: '显示文本' }]
        })
      ]);
    });

    it('应该识别已存在的页面', () => {
      // 先添加一个页面到数据库
      linkSystem.addPage('existing-page', '已存在页面');

      linkSystem.createPageLink('已存在页面');

      expect(editor.insertNodes).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'page-link',
          pageName: '已存在页面',
          exists: true
        })
      ]);
    });
  });

  describe('块引用创建', () => {
    it('应该能够创建块引用', () => {
      const eventHandler = vi.fn();
      eventBus.on('link:created', eventHandler);

      linkSystem.createBlockReference('block-123');

      expect(editor.insertNodes).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'block-reference',
          blockId: 'block-123',
          exists: false
        })
      ]);

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'block',
            blockId: 'block-123',
            exists: false
          })
        })
      );
    });

    it('应该识别已存在的块', () => {
      // 先添加一个块到数据库
      linkSystem.addBlock('existing-block', '这是一个已存在的块内容');

      linkSystem.createBlockReference('existing-block');

      expect(editor.insertNodes).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'block-reference',
          blockId: 'existing-block',
          blockContent: '这是一个已存在的块内容',
          exists: true
        })
      ]);
    });
  });

  describe('[[语法解析', () => {
    it('应该检测页面链接语法', () => {
      // 模拟编辑器状态
      editor.selection = {
        anchor: { path: [0, 0], offset: 10 },
        focus: { path: [0, 0], offset: 10 }
      };

      editor.string = vi.fn().mockReturnValue('这是一个[[测试页面');

      const isInPageLink = linkSystem['isInPageLink']();
      expect(isInPageLink).toBe(true);
    });

    it('应该检测完整的页面链接', () => {
      editor.selection = {
        anchor: { path: [0, 0], offset: 15 },
        focus: { path: [0, 0], offset: 15 }
      };

      editor.string = vi.fn().mockReturnValue('这是一个[[测试页面]]后面');

      const isInPageLink = linkSystem['isInPageLink']();
      expect(isInPageLink).toBe(false); // 已经闭合的链接
    });
  });

  describe('((语法解析', () => {
    it('应该检测块引用语法', () => {
      editor.selection = {
        anchor: { path: [0, 0], offset: 12 },
        focus: { path: [0, 0], offset: 12 }
      };

      editor.string = vi.fn().mockReturnValue('这是一个((block-123');

      const isInBlockRef = linkSystem['isInBlockReference']();
      expect(isInBlockRef).toBe(true);
    });

    it('应该检测完整的块引用', () => {
      editor.selection = {
        anchor: { path: [0, 0], offset: 18 },
        focus: { path: [0, 0], offset: 18 }
      };

      editor.string = vi.fn().mockReturnValue('这是一个((block-123))后面');

      const isInBlockRef = linkSystem['isInBlockReference']();
      expect(isInBlockRef).toBe(false); // 已经闭合的引用
    });
  });

  describe('反向链接管理', () => {
    it('应该记录反向链接', () => {
      // 添加页面
      linkSystem.addPage('page-1', '页面1');
      linkSystem.addPage('page-2', '页面2');

      // 创建从页面1到页面2的链接
      linkSystem['updateBacklinks']('page-2', 'page-1');

      const backlinks = linkSystem.getBacklinks('page-2');
      expect(backlinks).toContain('page-1');
    });

    it('应该避免重复的反向链接', () => {
      linkSystem.addPage('page-1', '页面1');
      linkSystem.addPage('page-2', '页面2');

      // 多次添加相同的反向链接
      linkSystem['updateBacklinks']('page-2', 'page-1');
      linkSystem['updateBacklinks']('page-2', 'page-1');
      linkSystem['updateBacklinks']('page-2', 'page-1');

      const backlinks = linkSystem.getBacklinks('page-2');
      expect(backlinks.filter(id => id === 'page-1')).toHaveLength(1);
    });
  });

  describe('链接搜索', () => {
    beforeEach(() => {
      // 添加测试数据
      linkSystem.addPage('page-1', '测试页面1', '这是第一个测试页面的内容');
      linkSystem.addPage('page-2', '另一个页面', '这是另一个页面的内容');
      linkSystem.addBlock('block-1', '这是一个测试块的内容');
      linkSystem.addBlock('block-2', '另一个块内容');
    });

    it('应该能够按名称搜索链接', () => {
      const results = linkSystem.searchLinks('测试');
      
      expect(results).toHaveLength(2); // 页面1和块1都包含"测试"
      expect(results.some(r => r.name === '测试页面1')).toBe(true);
      expect(results.some(r => r.content?.includes('测试块'))).toBe(true);
    });

    it('应该能够按内容搜索链接', () => {
      const results = linkSystem.searchLinks('内容');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => 
        r.name.includes('内容') || (r.content && r.content.includes('内容'))
      )).toBe(true);
    });

    it('应该返回按名称排序的结果', () => {
      const results = linkSystem.searchLinks('页面');
      
      expect(results[0].name <= results[1].name).toBe(true);
    });
  });

  describe('数据库管理', () => {
    it('应该能够添加页面到数据库', () => {
      const eventHandler = vi.fn();
      eventBus.on('page:added', eventHandler);

      linkSystem.addPage('test-page', '测试页面', '页面内容');

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pageId: 'test-page',
            pageName: '测试页面'
          })
        })
      );
    });

    it('应该能够添加块到数据库', () => {
      const eventHandler = vi.fn();
      eventBus.on('block:added', eventHandler);

      linkSystem.addBlock('test-block', '块内容');

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            blockId: 'test-block',
            content: '块内容'
          })
        })
      );
    });
  });

  describe('链接统计', () => {
    beforeEach(() => {
      linkSystem.addPage('page-1', '页面1');
      linkSystem.addPage('page-2', '页面2');
      linkSystem.addBlock('block-1', '块1');
      
      // 添加一个不存在的链接
      linkSystem['linkDatabase'].set('broken-link', {
        id: 'broken-link',
        type: 'page',
        name: '损坏的链接',
        exists: false,
        backlinks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    it('应该提供正确的链接统计', () => {
      const stats = linkSystem.getLinkStats();

      expect(stats.totalLinks).toBe(4);
      expect(stats.pageLinks).toBe(3); // 包括损坏的链接
      expect(stats.blockReferences).toBe(1);
      expect(stats.brokenLinks).toBe(1);
    });
  });

  describe('编辑器集成', () => {
    it('应该拦截文本输入以处理链接语法', () => {
      const originalInsertText = editor.insertText;
      
      // 模拟输入 ']' 完成页面链接
      editor.selection = {
        anchor: { path: [0, 0], offset: 10 },
        focus: { path: [0, 0], offset: 10 }
      };
      
      editor.string = vi.fn().mockReturnValue('[[测试页面');
      
      // 调用被拦截的 insertText
      editor.insertText(']');
      
      // 应该调用页面链接完成处理
      expect(editor.insertNodes).toHaveBeenCalled();
    });

    it('应该拦截删除操作以处理链接删除', () => {
      // 模拟在链接元素上的删除操作
      editor.nodes = vi.fn().mockReturnValue([
        [{
          type: 'page-link',
          pageId: 'test-page',
          pageName: '测试页面',
          exists: true,
          children: [{ text: '测试页面' }]
        }, [0]]
      ]);

      const eventHandler = vi.fn();
      eventBus.on('link:deleted', eventHandler);

      // 模拟删除操作
      const result = linkSystem['handleLinkDeletion']();

      expect(result).toBe(true);
      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的编辑器状态', () => {
      editor.selection = null;

      expect(() => {
        linkSystem['isInPageLink']();
      }).not.toThrow();

      expect(() => {
        linkSystem['isInBlockReference']();
      }).not.toThrow();
    });

    it('应该处理字符串提取错误', () => {
      editor.selection = {
        anchor: { path: [0, 0], offset: 5 },
        focus: { path: [0, 0], offset: 5 }
      };

      editor.string = vi.fn().mockImplementation(() => {
        throw new Error('字符串提取失败');
      });

      const result = linkSystem['getTextBefore']({ path: [0, 0], offset: 5 });
      expect(result).toBe('');
    });
  });

  describe('清理和销毁', () => {
    it('应该能够清理所有数据', () => {
      linkSystem.addPage('test-page', '测试页面');
      linkSystem.addBlock('test-block', '测试块');

      expect(linkSystem['linkDatabase'].size).toBeGreaterThan(0);
      expect(linkSystem['backlinksIndex'].size).toBeGreaterThan(0);

      linkSystem.destroy();

      expect(linkSystem['linkDatabase'].size).toBe(0);
      expect(linkSystem['backlinksIndex'].size).toBe(0);
    });
  });
});
