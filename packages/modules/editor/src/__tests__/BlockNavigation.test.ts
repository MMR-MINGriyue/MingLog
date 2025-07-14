/**
 * 块导航系统单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEditor } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { BlockNavigation, NavigationDirection, BlockOperation } from '../utils/BlockNavigation';
import type { CustomElement } from '@minglog/editor';

// 模拟ReactEditor
const mockReactEditor = {
  findPath: vi.fn(),
  toDOMNode: vi.fn(() => ({
    scrollIntoView: vi.fn()
  }))
};

// 创建测试编辑器
const createTestEditor = () => {
  const editor = withHistory(withReact(createEditor()));
  Object.assign(editor, mockReactEditor);
  return editor as any;
};

// 测试数据
const TEST_CONTENT: CustomElement[] = [
  {
    id: 'block-1',
    type: 'heading-1',
    children: [{ text: '标题 1' }],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'block-2',
    type: 'paragraph',
    children: [{ text: '这是第一个段落' }],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'block-3',
    type: 'bulleted-list',
    level: 1,
    children: [{ text: '列表项 1' }],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'block-4',
    type: 'bulleted-list',
    level: 2,
    children: [{ text: '子列表项' }],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'block-5',
    type: 'paragraph',
    children: [{ text: '最后一个段落' }],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

describe('BlockNavigation', () => {
  let editor: any;
  let blockNavigation: BlockNavigation;

  beforeEach(() => {
    editor = createTestEditor();
    editor.children = TEST_CONTENT;
    
    // 模拟选择
    editor.selection = {
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 0 }
    };

    blockNavigation = new BlockNavigation(editor);
  });

  afterEach(() => {
    blockNavigation.destroy();
  });

  describe('块选择', () => {
    it('应该能够选择单个块', () => {
      const eventHandler = vi.fn();
      blockNavigation.on('block:selected', eventHandler);

      blockNavigation.selectBlock([1]);

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          paths: [[1]]
        })
      );
    });

    it('应该能够扩展选择多个块', () => {
      // 先选择第一个块
      blockNavigation.selectBlock([1]);
      
      // 扩展选择到第三个块
      blockNavigation.selectBlock([3], true);

      const selection = blockNavigation.getSelection();
      expect(selection?.mode).toBe('range');
      expect(selection?.paths).toHaveLength(3); // 应该包含 [1], [2], [3]
    });

    it('应该能够清除块选择', () => {
      blockNavigation.selectBlock([1]);
      expect(blockNavigation.getSelection()).not.toBeNull();

      blockNavigation.clearBlockSelection();
      expect(blockNavigation.getSelection()).toBeNull();
    });
  });

  describe('块导航', () => {
    it('应该能够导航到下一个块', () => {
      // 设置当前选择在第一个块
      editor.selection = {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 0 }
      };

      const selectSpy = vi.spyOn(blockNavigation, 'selectBlock');
      blockNavigation.navigateToBlock(NavigationDirection.DOWN);

      expect(selectSpy).toHaveBeenCalledWith([1]);
    });

    it('应该能够导航到上一个块', () => {
      // 设置当前选择在第二个块
      editor.selection = {
        anchor: { path: [1, 0], offset: 0 },
        focus: { path: [1, 0], offset: 0 }
      };

      const selectSpy = vi.spyOn(blockNavigation, 'selectBlock');
      blockNavigation.navigateToBlock(NavigationDirection.UP);

      expect(selectSpy).toHaveBeenCalledWith([0]);
    });

    it('应该能够导航到第一个块', () => {
      const selectSpy = vi.spyOn(blockNavigation, 'selectBlock');
      blockNavigation.navigateToBlock(NavigationDirection.FIRST);

      expect(selectSpy).toHaveBeenCalledWith([0]);
    });

    it('应该能够导航到最后一个块', () => {
      const selectSpy = vi.spyOn(blockNavigation, 'selectBlock');
      blockNavigation.navigateToBlock(NavigationDirection.LAST);

      expect(selectSpy).toHaveBeenCalledWith([4]);
    });
  });

  describe('块操作', () => {
    beforeEach(() => {
      // 选择一个块进行操作
      blockNavigation.selectBlock([2]);
    });

    it('应该能够复制块', () => {
      const eventHandler = vi.fn();
      blockNavigation.on('blocks:copied', eventHandler);

      blockNavigation.executeBlockOperation(BlockOperation.COPY);

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1
        })
      );
    });

    it('应该能够删除块', () => {
      const eventHandler = vi.fn();
      blockNavigation.on('blocks:deleted', eventHandler);

      // 模拟 Transforms.removeNodes
      const removeNodesSpy = vi.spyOn(editor, 'removeNodes').mockImplementation(() => {});

      blockNavigation.executeBlockOperation(BlockOperation.DELETE);

      expect(removeNodesSpy).toHaveBeenCalled();
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1
        })
      );
    });

    it('应该能够复制块', () => {
      const eventHandler = vi.fn();
      blockNavigation.on('blocks:duplicated', eventHandler);

      // 模拟 Transforms.insertNodes
      const insertNodesSpy = vi.spyOn(editor, 'insertNodes').mockImplementation(() => {});

      blockNavigation.executeBlockOperation(BlockOperation.DUPLICATE);

      expect(insertNodesSpy).toHaveBeenCalled();
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1
        })
      );
    });

    it('应该能够缩进块', () => {
      const eventHandler = vi.fn();
      blockNavigation.on('blocks:indented', eventHandler);

      // 模拟 Transforms.setNodes
      const setNodesSpy = vi.spyOn(editor, 'setNodes').mockImplementation(() => {});

      blockNavigation.executeBlockOperation(BlockOperation.INDENT);

      expect(setNodesSpy).toHaveBeenCalled();
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1
        })
      );
    });

    it('应该能够取消缩进块', () => {
      // 选择一个有缩进的列表项
      blockNavigation.selectBlock([3]); // level: 2 的列表项

      const eventHandler = vi.fn();
      blockNavigation.on('blocks:outdented', eventHandler);

      // 模拟 Transforms.setNodes
      const setNodesSpy = vi.spyOn(editor, 'setNodes').mockImplementation(() => {});

      blockNavigation.executeBlockOperation(BlockOperation.OUTDENT);

      expect(setNodesSpy).toHaveBeenCalled();
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1
        })
      );
    });
  });

  describe('块移动', () => {
    it('应该能够向上移动块', () => {
      blockNavigation.selectBlock([2]);

      const eventHandler = vi.fn();
      blockNavigation.on('blocks:moved', eventHandler);

      // 模拟 Transforms.moveNodes
      const moveNodesSpy = vi.spyOn(editor, 'moveNodes').mockImplementation(() => {});

      blockNavigation.executeBlockOperation(BlockOperation.MOVE_UP);

      expect(moveNodesSpy).toHaveBeenCalled();
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          direction: -1,
          count: 1
        })
      );
    });

    it('应该能够向下移动块', () => {
      blockNavigation.selectBlock([2]);

      const eventHandler = vi.fn();
      blockNavigation.on('blocks:moved', eventHandler);

      // 模拟 Transforms.moveNodes
      const moveNodesSpy = vi.spyOn(editor, 'moveNodes').mockImplementation(() => {});

      blockNavigation.executeBlockOperation(BlockOperation.MOVE_DOWN);

      expect(moveNodesSpy).toHaveBeenCalled();
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          direction: 1,
          count: 1
        })
      );
    });
  });

  describe('粘贴操作', () => {
    it('应该能够粘贴复制的块', () => {
      // 先复制一个块
      blockNavigation.selectBlock([1]);
      blockNavigation.executeBlockOperation(BlockOperation.COPY);

      // 移动到另一个位置
      blockNavigation.selectBlock([3]);

      const eventHandler = vi.fn();
      blockNavigation.on('blocks:pasted', eventHandler);

      // 模拟 Transforms.insertNodes
      const insertNodesSpy = vi.spyOn(editor, 'insertNodes').mockImplementation(() => {});

      blockNavigation.pasteBlocks();

      expect(insertNodesSpy).toHaveBeenCalled();
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 1
        })
      );
    });

    it('空剪贴板时不应该粘贴', () => {
      blockNavigation.selectBlock([1]);

      const eventHandler = vi.fn();
      blockNavigation.on('blocks:pasted', eventHandler);

      blockNavigation.pasteBlocks();

      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  describe('事件系统', () => {
    it('应该能够添加和移除事件监听器', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      blockNavigation.on('test:event', handler1);
      blockNavigation.on('test:event', handler2);

      // 触发事件
      blockNavigation['emit']('test:event', { data: 'test' });

      expect(handler1).toHaveBeenCalledWith({ data: 'test' });
      expect(handler2).toHaveBeenCalledWith({ data: 'test' });

      // 移除一个监听器
      blockNavigation.off('test:event', handler1);

      // 再次触发事件
      blockNavigation['emit']('test:event', { data: 'test2' });

      expect(handler1).toHaveBeenCalledTimes(1); // 不应该再被调用
      expect(handler2).toHaveBeenCalledTimes(2); // 应该被调用两次
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的块路径', () => {
      // 尝试选择不存在的块
      expect(() => {
        blockNavigation.selectBlock([999]);
      }).not.toThrow();
    });

    it('应该处理空选择的操作', () => {
      blockNavigation.clearBlockSelection();

      // 尝试在没有选择的情况下执行操作
      expect(() => {
        blockNavigation.executeBlockOperation(BlockOperation.COPY);
      }).not.toThrow();
    });

    it('应该处理编辑器操作错误', () => {
      blockNavigation.selectBlock([1]);

      // 模拟编辑器操作失败
      const setNodesSpy = vi.spyOn(editor, 'setNodes').mockImplementation(() => {
        throw new Error('编辑器操作失败');
      });

      // 应该不会抛出错误，而是在内部处理
      expect(() => {
        blockNavigation.executeBlockOperation(BlockOperation.INDENT);
      }).not.toThrow();

      expect(setNodesSpy).toHaveBeenCalled();
    });
  });
});
