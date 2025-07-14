/**
 * 双向链接系统
 * 实现[[]]语法的双向链接创建和管理
 */

import type { Editor, Node, Path, Range, Transforms, Element as SlateElement } from 'slate';
import type { ReactEditor } from 'slate-react';
import type { EventBus } from '@minglog/core';

/**
 * 页面链接元素
 */
export interface PageLinkElement {
  type: 'page-link';
  pageId: string;
  pageName: string;
  displayText?: string;
  exists: boolean;
  children: Array<{ text: string }>;
}

/**
 * 块引用元素
 */
export interface BlockReferenceElement {
  type: 'block-reference';
  blockId: string;
  blockContent: string;
  exists: boolean;
  children: Array<{ text: string }>;
}

/**
 * 链接数据接口
 */
export interface LinkData {
  id: string;
  type: 'page' | 'block';
  name: string;
  content?: string;
  exists: boolean;
  backlinks: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 双向链接系统配置
 */
export interface BidirectionalLinkConfig {
  /** 是否启用实时解析 */
  enableRealTimeParsing: boolean;
  /** 是否启用自动补全 */
  enableAutoComplete: boolean;
  /** 是否启用链接验证 */
  enableLinkValidation: boolean;
  /** 链接样式配置 */
  linkStyles: {
    existingLink: string;
    brokenLink: string;
    newLink: string;
  };
}

/**
 * 双向链接系统类
 */
export class BidirectionalLinkSystem {
  private editor: Editor & ReactEditor;
  private eventBus: EventBus;
  private config: BidirectionalLinkConfig;
  private linkDatabase = new Map<string, LinkData>();
  private backlinksIndex = new Map<string, Set<string>>();

  constructor(
    editor: Editor & ReactEditor, 
    eventBus: EventBus, 
    config: Partial<BidirectionalLinkConfig> = {}
  ) {
    this.editor = editor;
    this.eventBus = eventBus;
    this.config = {
      enableRealTimeParsing: true,
      enableAutoComplete: true,
      enableLinkValidation: true,
      linkStyles: {
        existingLink: 'text-blue-600 hover:text-blue-800 underline cursor-pointer',
        brokenLink: 'text-red-500 hover:text-red-700 underline cursor-pointer',
        newLink: 'text-green-600 hover:text-green-800 underline cursor-pointer'
      },
      ...config
    };

    this.initializeEditor();
  }

  /**
   * 初始化编辑器插件
   */
  private initializeEditor(): void {
    const { insertText, deleteBackward, normalizeNode } = this.editor;

    // 拦截文本输入
    this.editor.insertText = (text: string) => {
      if (this.config.enableRealTimeParsing) {
        // 检查是否完成了链接输入
        if (text === ']' && this.isInPageLink()) {
          this.handlePageLinkCompletion();
          return;
        }

        // 检查是否完成了块引用输入
        if (text === ')' && this.isInBlockReference()) {
          this.handleBlockReferenceCompletion();
          return;
        }
      }

      insertText(text);
    };

    // 拦截删除操作
    this.editor.deleteBackward = (unit) => {
      if (this.handleLinkDeletion()) {
        return;
      }
      deleteBackward(unit);
    };

    // 标准化节点
    this.editor.normalizeNode = (entry) => {
      const [node, path] = entry;

      // 验证链接元素
      if (SlateElement.isElement(node)) {
        if (node.type === 'page-link') {
          this.validatePageLink(node as PageLinkElement, path);
        } else if (node.type === 'block-reference') {
          this.validateBlockReference(node as BlockReferenceElement, path);
        }
      }

      normalizeNode(entry);
    };
  }

  /**
   * 检查是否在页面链接中
   */
  private isInPageLink(): boolean {
    const { selection } = this.editor;
    if (!selection || !Range.isCollapsed(selection)) return false;

    const [start] = Range.edges(selection);
    const beforeText = this.getTextBefore(start, 50);
    
    // 检查是否有未闭合的 [[
    const lastOpenBracket = beforeText.lastIndexOf('[[');
    const lastCloseBracket = beforeText.lastIndexOf(']]');
    
    return lastOpenBracket > lastCloseBracket;
  }

  /**
   * 检查是否在块引用中
   */
  private isInBlockReference(): boolean {
    const { selection } = this.editor;
    if (!selection || !Range.isCollapsed(selection)) return false;

    const [start] = Range.edges(selection);
    const beforeText = this.getTextBefore(start, 50);
    
    // 检查是否有未闭合的 ((
    const lastOpenParen = beforeText.lastIndexOf('((');
    const lastCloseParen = beforeText.lastIndexOf('))');
    
    return lastOpenParen > lastCloseParen;
  }

  /**
   * 获取光标前的文本
   */
  private getTextBefore(point: any, maxLength: number = 50): string {
    try {
      const beforeRange = {
        anchor: { path: point.path, offset: Math.max(0, point.offset - maxLength) },
        focus: point
      };
      return this.editor.string(beforeRange);
    } catch {
      return '';
    }
  }

  /**
   * 处理页面链接完成
   */
  private handlePageLinkCompletion(): void {
    const { selection } = this.editor;
    if (!selection) return;

    const [start] = Range.edges(selection);
    const beforeText = this.getTextBefore(start, 100);
    
    // 提取链接文本
    const match = beforeText.match(/\[\[([^\]]+)$/);
    if (!match) return;

    const linkText = match[1];
    const linkStart = start.offset - linkText.length - 2; // 减去 [[

    // 删除原始文本
    Transforms.delete(this.editor, {
      at: {
        anchor: { path: start.path, offset: linkStart },
        focus: { path: start.path, offset: start.offset }
      }
    });

    // 创建页面链接元素
    this.createPageLink(linkText);
  }

  /**
   * 处理块引用完成
   */
  private handleBlockReferenceCompletion(): void {
    const { selection } = this.editor;
    if (!selection) return;

    const [start] = Range.edges(selection);
    const beforeText = this.getTextBefore(start, 100);
    
    // 提取块引用文本
    const match = beforeText.match(/\(\(([^)]+)$/);
    if (!match) return;

    const blockId = match[1];
    const refStart = start.offset - blockId.length - 2; // 减去 ((

    // 删除原始文本
    Transforms.delete(this.editor, {
      at: {
        anchor: { path: start.path, offset: refStart },
        focus: { path: start.path, offset: start.offset }
      }
    });

    // 创建块引用元素
    this.createBlockReference(blockId);
  }

  /**
   * 创建页面链接
   */
  createPageLink(pageName: string, displayText?: string): void {
    const pageId = this.getOrCreatePageId(pageName);
    const exists = this.linkDatabase.has(pageId);

    const linkElement: PageLinkElement = {
      type: 'page-link',
      pageId,
      pageName,
      displayText: displayText || pageName,
      exists,
      children: [{ text: displayText || pageName }]
    };

    Transforms.insertNodes(this.editor, [linkElement]);

    // 更新反向链接
    this.updateBacklinks(pageId, this.getCurrentPageId());

    // 发送事件
    this.eventBus.emit('link:created', {
      type: 'page',
      pageId,
      pageName,
      exists,
      timestamp: Date.now()
    }, 'BidirectionalLinkSystem');
  }

  /**
   * 创建块引用
   */
  createBlockReference(blockId: string): void {
    const blockData = this.getBlockData(blockId);
    const exists = !!blockData;

    const refElement: BlockReferenceElement = {
      type: 'block-reference',
      blockId,
      blockContent: blockData?.content || blockId,
      exists,
      children: [{ text: blockData?.content || `((${blockId}))` }]
    };

    Transforms.insertNodes(this.editor, [refElement]);

    // 更新反向链接
    if (exists) {
      this.updateBacklinks(blockId, this.getCurrentPageId());
    }

    // 发送事件
    this.eventBus.emit('link:created', {
      type: 'block',
      blockId,
      exists,
      timestamp: Date.now()
    }, 'BidirectionalLinkSystem');
  }

  /**
   * 获取或创建页面ID
   */
  private getOrCreatePageId(pageName: string): string {
    // 查找现有页面
    for (const [id, data] of this.linkDatabase) {
      if (data.type === 'page' && data.name === pageName) {
        return id;
      }
    }

    // 创建新页面ID
    const pageId = `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 添加到数据库
    this.linkDatabase.set(pageId, {
      id: pageId,
      type: 'page',
      name: pageName,
      exists: false, // 新创建的页面默认不存在
      backlinks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return pageId;
  }

  /**
   * 获取块数据
   */
  private getBlockData(blockId: string): LinkData | null {
    return this.linkDatabase.get(blockId) || null;
  }

  /**
   * 获取当前页面ID
   */
  private getCurrentPageId(): string {
    // TODO: 从上下文获取当前页面ID
    return 'current-page';
  }

  /**
   * 更新反向链接
   */
  private updateBacklinks(targetId: string, sourceId: string): void {
    if (!this.backlinksIndex.has(targetId)) {
      this.backlinksIndex.set(targetId, new Set());
    }
    
    this.backlinksIndex.get(targetId)!.add(sourceId);

    // 更新数据库中的反向链接
    const targetData = this.linkDatabase.get(targetId);
    if (targetData && !targetData.backlinks.includes(sourceId)) {
      targetData.backlinks.push(sourceId);
      targetData.updatedAt = new Date().toISOString();
    }
  }

  /**
   * 验证页面链接
   */
  private validatePageLink(element: PageLinkElement, path: Path): void {
    const exists = this.linkDatabase.has(element.pageId);
    
    if (element.exists !== exists) {
      Transforms.setNodes(this.editor, { exists }, { at: path });
    }
  }

  /**
   * 验证块引用
   */
  private validateBlockReference(element: BlockReferenceElement, path: Path): void {
    const blockData = this.getBlockData(element.blockId);
    const exists = !!blockData;
    
    if (element.exists !== exists) {
      Transforms.setNodes(this.editor, { 
        exists,
        blockContent: blockData?.content || element.blockId
      }, { at: path });
    }
  }

  /**
   * 处理链接删除
   */
  private handleLinkDeletion(): boolean {
    const { selection } = this.editor;
    if (!selection || !Range.isCollapsed(selection)) return false;

    // 检查是否在链接元素的边界
    const [match] = this.editor.nodes({
      match: n => SlateElement.isElement(n) && 
                  (n.type === 'page-link' || n.type === 'block-reference'),
      at: selection
    });

    if (match) {
      const [element, path] = match;
      
      // 删除整个链接元素
      Transforms.removeNodes(this.editor, { at: path });
      
      // 发送事件
      this.eventBus.emit('link:deleted', {
        type: element.type,
        element,
        timestamp: Date.now()
      }, 'BidirectionalLinkSystem');
      
      return true;
    }

    return false;
  }

  /**
   * 获取页面的反向链接
   */
  getBacklinks(pageId: string): string[] {
    const backlinks = this.backlinksIndex.get(pageId);
    return backlinks ? Array.from(backlinks) : [];
  }

  /**
   * 搜索链接
   */
  searchLinks(query: string): LinkData[] {
    const results: LinkData[] = [];
    const lowerQuery = query.toLowerCase();

    for (const data of this.linkDatabase.values()) {
      if (data.name.toLowerCase().includes(lowerQuery) ||
          (data.content && data.content.toLowerCase().includes(lowerQuery))) {
        results.push(data);
      }
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * 添加页面到数据库
   */
  addPage(pageId: string, pageName: string, content?: string): void {
    this.linkDatabase.set(pageId, {
      id: pageId,
      type: 'page',
      name: pageName,
      content,
      exists: true,
      backlinks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 发送事件
    this.eventBus.emit('page:added', {
      pageId,
      pageName,
      timestamp: Date.now()
    }, 'BidirectionalLinkSystem');
  }

  /**
   * 添加块到数据库
   */
  addBlock(blockId: string, content: string): void {
    this.linkDatabase.set(blockId, {
      id: blockId,
      type: 'block',
      name: blockId,
      content,
      exists: true,
      backlinks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 发送事件
    this.eventBus.emit('block:added', {
      blockId,
      content,
      timestamp: Date.now()
    }, 'BidirectionalLinkSystem');
  }

  /**
   * 获取链接统计
   */
  getLinkStats(): {
    totalLinks: number;
    pageLinks: number;
    blockReferences: number;
    brokenLinks: number;
  } {
    let pageLinks = 0;
    let blockReferences = 0;
    let brokenLinks = 0;

    for (const data of this.linkDatabase.values()) {
      if (data.type === 'page') {
        pageLinks++;
      } else {
        blockReferences++;
      }
      
      if (!data.exists) {
        brokenLinks++;
      }
    }

    return {
      totalLinks: this.linkDatabase.size,
      pageLinks,
      blockReferences,
      brokenLinks
    };
  }

  /**
   * 销毁系统
   */
  destroy(): void {
    this.linkDatabase.clear();
    this.backlinksIndex.clear();
  }
}
