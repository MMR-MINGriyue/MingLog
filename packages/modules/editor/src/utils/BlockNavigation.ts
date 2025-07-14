/**
 * 块导航和选择系统
 * 实现类似Notion的块选择、导航、批量操作功能
 */

import type { Editor, Node, Path, Range, Transforms, Element as SlateElement, Text } from 'slate';
import type { ReactEditor } from 'slate-react';
import type { CustomElement, CustomText, BlockType } from '@minglog/editor';

/**
 * 块选择状态
 */
export interface BlockSelection {
  /** 选中的块路径 */
  paths: Path[];
  /** 选择模式 */
  mode: 'single' | 'multiple' | 'range';
  /** 锚点路径（范围选择的起点） */
  anchor?: Path;
  /** 焦点路径（范围选择的终点） */
  focus?: Path;
}

/**
 * 块导航方向
 */
export enum NavigationDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  FIRST = 'first',
  LAST = 'last'
}

/**
 * 块操作类型
 */
export enum BlockOperation {
  COPY = 'copy',
  CUT = 'cut',
  DELETE = 'delete',
  DUPLICATE = 'duplicate',
  MOVE_UP = 'move_up',
  MOVE_DOWN = 'move_down',
  INDENT = 'indent',
  OUTDENT = 'outdent',
  CONVERT = 'convert'
}

/**
 * 块导航系统类
 */
export class BlockNavigation {
  private editor: Editor & ReactEditor;
  private selection: BlockSelection | null = null;
  private clipboard: Node[] = [];
  private listeners: Map<string, Function[]> = new Map();

  constructor(editor: Editor & ReactEditor) {
    this.editor = editor;
    this.initializeEventListeners();
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 监听编辑器选择变化
    const originalOnChange = this.editor.onChange;
    this.editor.onChange = () => {
      originalOnChange();
      this.handleSelectionChange();
    };
  }

  /**
   * 处理选择变化
   */
  private handleSelectionChange(): void {
    const { selection } = this.editor;
    
    if (!selection) {
      this.clearBlockSelection();
      return;
    }

    // 如果是块级选择，更新块选择状态
    if (this.isBlockLevelSelection(selection)) {
      this.updateBlockSelection(selection);
    }
  }

  /**
   * 判断是否为块级选择
   */
  private isBlockLevelSelection(selection: Range): boolean {
    // 检查选择是否跨越整个块
    const [start, end] = Range.edges(selection);
    const startBlock = this.editor.above({
      at: start,
      match: n => Editor.isBlock(this.editor, n)
    });
    const endBlock = this.editor.above({
      at: end,
      match: n => Editor.isBlock(this.editor, n)
    });

    if (!startBlock || !endBlock) return false;

    const [, startPath] = startBlock;
    const [, endPath] = endBlock;

    // 如果选择跨越多个块，或者选择了整个块的内容
    return !Path.equals(startPath, endPath) || this.isEntireBlockSelected(selection, startBlock[0]);
  }

  /**
   * 判断是否选择了整个块
   */
  private isEntireBlockSelected(selection: Range, block: Node): boolean {
    const [start, end] = Range.edges(selection);
    const blockStart = Editor.start(this.editor, ReactEditor.findPath(this.editor, block));
    const blockEnd = Editor.end(this.editor, ReactEditor.findPath(this.editor, block));

    return (
      Editor.isStart(this.editor, start, ReactEditor.findPath(this.editor, block)) &&
      Editor.isEnd(this.editor, end, ReactEditor.findPath(this.editor, block))
    );
  }

  /**
   * 更新块选择状态
   */
  private updateBlockSelection(selection: Range): void {
    const blocks = this.getSelectedBlocks(selection);
    
    this.selection = {
      paths: blocks.map(([, path]) => path),
      mode: blocks.length > 1 ? 'multiple' : 'single',
      anchor: blocks[0]?.[1],
      focus: blocks[blocks.length - 1]?.[1]
    };

    this.emit('selection:changed', this.selection);
  }

  /**
   * 获取选中的块
   */
  private getSelectedBlocks(selection: Range): Array<[Node, Path]> {
    const blocks: Array<[Node, Path]> = [];
    
    for (const [node, path] of Editor.nodes(this.editor, {
      at: selection,
      match: n => Editor.isBlock(this.editor, n)
    })) {
      blocks.push([node, path]);
    }

    return blocks;
  }

  /**
   * 选择块
   */
  selectBlock(path: Path, extend: boolean = false): void {
    const block = Node.get(this.editor, path);
    if (!Editor.isBlock(this.editor, block)) return;

    if (extend && this.selection) {
      // 扩展选择
      this.extendSelection(path);
    } else {
      // 单独选择
      const range = Editor.range(this.editor, path);
      Transforms.select(this.editor, range);
      
      this.selection = {
        paths: [path],
        mode: 'single',
        anchor: path,
        focus: path
      };
    }

    this.emit('block:selected', { paths: this.selection?.paths || [path] });
  }

  /**
   * 扩展选择
   */
  private extendSelection(path: Path): void {
    if (!this.selection || !this.selection.anchor) return;

    const anchor = this.selection.anchor;
    const start = Path.isBefore(anchor, path) ? anchor : path;
    const end = Path.isBefore(anchor, path) ? path : anchor;

    // 获取范围内的所有块
    const blocks: Path[] = [];
    for (const [, blockPath] of Editor.nodes(this.editor, {
      at: { anchor: Editor.start(this.editor, start), focus: Editor.end(this.editor, end) },
      match: n => Editor.isBlock(this.editor, n)
    })) {
      blocks.push(blockPath);
    }

    this.selection = {
      paths: blocks,
      mode: 'range',
      anchor,
      focus: path
    };

    // 选择整个范围
    const range = {
      anchor: Editor.start(this.editor, start),
      focus: Editor.end(this.editor, end)
    };
    Transforms.select(this.editor, range);
  }

  /**
   * 导航到相邻块
   */
  navigateToBlock(direction: NavigationDirection): void {
    const currentPath = this.getCurrentBlockPath();
    if (!currentPath) return;

    let targetPath: Path | null = null;

    switch (direction) {
      case NavigationDirection.UP:
        targetPath = this.getPreviousBlockPath(currentPath);
        break;
      case NavigationDirection.DOWN:
        targetPath = this.getNextBlockPath(currentPath);
        break;
      case NavigationDirection.FIRST:
        targetPath = this.getFirstBlockPath();
        break;
      case NavigationDirection.LAST:
        targetPath = this.getLastBlockPath();
        break;
    }

    if (targetPath) {
      this.selectBlock(targetPath);
      this.scrollToBlock(targetPath);
    }
  }

  /**
   * 获取当前块路径
   */
  private getCurrentBlockPath(): Path | null {
    const { selection } = this.editor;
    if (!selection) return null;

    const block = Editor.above(this.editor, {
      match: n => SlateElement.isElement(n) && Editor.isBlock(this.editor, n),
      at: selection
    });

    return block ? block[1] : null;
  }

  /**
   * 获取上一个块路径
   */
  private getPreviousBlockPath(currentPath: Path): Path | null {
    try {
      const previousPath = Path.previous(currentPath);
      const node = Node.get(this.editor, previousPath);
      return Editor.isBlock(this.editor, node) ? previousPath : null;
    } catch {
      return null;
    }
  }

  /**
   * 获取下一个块路径
   */
  private getNextBlockPath(currentPath: Path): Path | null {
    try {
      const nextPath = Path.next(currentPath);
      const node = Node.get(this.editor, nextPath);
      return Editor.isBlock(this.editor, node) ? nextPath : null;
    } catch {
      return null;
    }
  }

  /**
   * 获取第一个块路径
   */
  private getFirstBlockPath(): Path | null {
    for (const [node, path] of Editor.nodes(this.editor, {
      match: n => Editor.isBlock(this.editor, n)
    })) {
      return path;
    }
    return null;
  }

  /**
   * 获取最后一个块路径
   */
  private getLastBlockPath(): Path | null {
    let lastPath: Path | null = null;
    for (const [node, path] of Editor.nodes(this.editor, {
      match: n => Editor.isBlock(this.editor, n)
    })) {
      lastPath = path;
    }
    return lastPath;
  }

  /**
   * 滚动到块
   */
  private scrollToBlock(path: Path): void {
    try {
      const domNode = ReactEditor.toDOMNode(this.editor, Node.get(this.editor, path));
      domNode.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    } catch (error) {
      console.warn('无法滚动到块:', error);
    }
  }

  /**
   * 执行块操作
   */
  executeBlockOperation(operation: BlockOperation, options?: any): void {
    if (!this.selection || this.selection.paths.length === 0) return;

    switch (operation) {
      case BlockOperation.COPY:
        this.copyBlocks();
        break;
      case BlockOperation.CUT:
        this.cutBlocks();
        break;
      case BlockOperation.DELETE:
        this.deleteBlocks();
        break;
      case BlockOperation.DUPLICATE:
        this.duplicateBlocks();
        break;
      case BlockOperation.MOVE_UP:
        this.moveBlocks(-1);
        break;
      case BlockOperation.MOVE_DOWN:
        this.moveBlocks(1);
        break;
      case BlockOperation.INDENT:
        this.indentBlocks();
        break;
      case BlockOperation.OUTDENT:
        this.outdentBlocks();
        break;
      case BlockOperation.CONVERT:
        this.convertBlocks(options?.blockType);
        break;
    }
  }

  /**
   * 复制块
   */
  private copyBlocks(): void {
    this.clipboard = this.selection!.paths.map(path => Node.get(this.editor, path));
    this.emit('blocks:copied', { count: this.clipboard.length });
  }

  /**
   * 剪切块
   */
  private cutBlocks(): void {
    this.copyBlocks();
    this.deleteBlocks();
  }

  /**
   * 删除块
   */
  private deleteBlocks(): void {
    const paths = [...this.selection!.paths].sort((a, b) => Path.compare(b, a)); // 从后往前删除
    
    Editor.withoutNormalizing(this.editor, () => {
      paths.forEach(path => {
        Transforms.removeNodes(this.editor, { at: path });
      });
    });

    this.clearBlockSelection();
    this.emit('blocks:deleted', { count: paths.length });
  }

  /**
   * 复制块
   */
  private duplicateBlocks(): void {
    const blocks = this.selection!.paths.map(path => Node.get(this.editor, path));
    const lastPath = this.selection!.paths[this.selection!.paths.length - 1];
    
    Editor.withoutNormalizing(this.editor, () => {
      blocks.forEach((block, index) => {
        const insertPath = Path.next([...lastPath.slice(0, -1), lastPath[lastPath.length - 1] + index + 1]);
        Transforms.insertNodes(this.editor, block, { at: insertPath });
      });
    });

    this.emit('blocks:duplicated', { count: blocks.length });
  }

  /**
   * 移动块
   */
  private moveBlocks(direction: number): void {
    if (!this.selection || this.selection.paths.length === 0) return;

    const paths = [...this.selection.paths].sort((a, b) => Path.compare(a, b));

    Editor.withoutNormalizing(this.editor, () => {
      if (direction > 0) {
        // 向下移动：从后往前处理
        for (let i = paths.length - 1; i >= 0; i--) {
          const path = paths[i];
          const nextPath = Path.next(path);

          try {
            const node = Node.get(this.editor, path);
            const nextNode = Node.get(this.editor, nextPath);

            if (nextNode) {
              // 移动到下一个位置
              Transforms.moveNodes(this.editor, {
                at: path,
                to: Path.next(nextPath)
              });
            }
          } catch (error) {
            console.warn('无法向下移动块:', error);
          }
        }
      } else {
        // 向上移动：从前往后处理
        for (let i = 0; i < paths.length; i++) {
          const path = paths[i];
          const prevPath = Path.previous(path);

          try {
            const node = Node.get(this.editor, path);
            const prevNode = Node.get(this.editor, prevPath);

            if (prevNode) {
              // 移动到上一个位置
              Transforms.moveNodes(this.editor, {
                at: path,
                to: prevPath
              });
            }
          } catch (error) {
            console.warn('无法向上移动块:', error);
          }
        }
      }
    });

    this.emit('blocks:moved', { direction, count: paths.length });
  }

  /**
   * 缩进块
   */
  private indentBlocks(): void {
    if (!this.selection || this.selection.paths.length === 0) return;

    Editor.withoutNormalizing(this.editor, () => {
      this.selection!.paths.forEach(path => {
        try {
          const [node] = Editor.node(this.editor, path);
          const element = node as CustomElement;

          // 根据块类型处理缩进
          if (element.type === 'bulleted-list' || element.type === 'numbered-list') {
            // 增加列表层级
            const currentLevel = (element as any).level || 0;
            Transforms.setNodes(this.editor, {
              level: Math.min(currentLevel + 1, 5) // 最大5级缩进
            }, { at: path });
          } else if (element.type === 'paragraph') {
            // 段落转换为列表
            Transforms.setNodes(this.editor, {
              type: 'bulleted-list',
              level: 1
            }, { at: path });
          }
        } catch (error) {
          console.warn('无法缩进块:', error);
        }
      });
    });

    this.emit('blocks:indented', { count: this.selection.paths.length });
  }

  /**
   * 取消缩进块
   */
  private outdentBlocks(): void {
    if (!this.selection || this.selection.paths.length === 0) return;

    Editor.withoutNormalizing(this.editor, () => {
      this.selection!.paths.forEach(path => {
        try {
          const [node] = Editor.node(this.editor, path);
          const element = node as CustomElement;

          // 根据块类型处理取消缩进
          if (element.type === 'bulleted-list' || element.type === 'numbered-list') {
            const currentLevel = (element as any).level || 0;

            if (currentLevel > 1) {
              // 减少列表层级
              Transforms.setNodes(this.editor, {
                level: currentLevel - 1
              }, { at: path });
            } else {
              // 转换为段落
              Transforms.setNodes(this.editor, {
                type: 'paragraph'
              }, { at: path });

              // 移除level属性
              Transforms.unsetNodes(this.editor, 'level', { at: path });
            }
          }
        } catch (error) {
          console.warn('无法取消缩进块:', error);
        }
      });
    });

    this.emit('blocks:outdented', { count: this.selection.paths.length });
  }

  /**
   * 转换块类型
   */
  private convertBlocks(blockType: string): void {
    if (!blockType) return;

    Editor.withoutNormalizing(this.editor, () => {
      this.selection!.paths.forEach(path => {
        Transforms.setNodes(this.editor, { type: blockType }, { at: path });
      });
    });

    this.emit('blocks:converted', { blockType, count: this.selection!.paths.length });
  }

  /**
   * 清除块选择
   */
  clearBlockSelection(): void {
    this.selection = null;
    this.emit('selection:cleared');
  }

  /**
   * 获取当前选择
   */
  getSelection(): BlockSelection | null {
    return this.selection;
  }

  /**
   * 粘贴块
   */
  pasteBlocks(): void {
    if (this.clipboard.length === 0) return;

    const currentPath = this.getCurrentBlockPath();
    if (!currentPath) return;

    Editor.withoutNormalizing(this.editor, () => {
      this.clipboard.forEach((block, index) => {
        const insertPath = Path.next([...currentPath.slice(0, -1), currentPath[currentPath.length - 1] + index + 1]);
        Transforms.insertNodes(this.editor, block, { at: insertPath });
      });
    });

    this.emit('blocks:pasted', { count: this.clipboard.length });
  }

  /**
   * 事件监听
   */
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  /**
   * 移除事件监听
   */
  off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.listeners.clear();
    this.selection = null;
    this.clipboard = [];
  }
}
