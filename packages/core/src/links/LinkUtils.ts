/**
 * MingLog 链接系统工具函数
 */

import type { PageLink, BlockLink, Link, LinkType } from '../types/links';

export class LinkUtils {
  /**
   * 格式化页面链接文本
   * @param pageName 页面名称
   * @param displayText 显示文本（可选）
   * @returns 格式化的链接文本
   */
  static formatPageLink(pageName: string, displayText?: string): string {
    if (displayText && displayText !== pageName) {
      return `[[${pageName}|${displayText}]]`;
    }
    return `[[${pageName}]]`;
  }

  /**
   * 格式化块引用文本
   * @param blockId 块ID
   * @returns 格式化的引用文本
   */
  static formatBlockLink(blockId: string): string {
    return `((${blockId}))`;
  }

  /**
   * 提取页面链接的页面名称
   * @param linkText 链接文本
   * @returns 页面名称或null
   */
  static extractPageName(linkText: string): string | null {
    const match = linkText.match(/^\[\[([^|\]]+)(?:\|[^\]]+)?\]\]$/);
    return match ? match[1].trim() : null;
  }

  /**
   * 提取块引用的块ID
   * @param linkText 引用文本
   * @returns 块ID或null
   */
  static extractBlockId(linkText: string): string | null {
    const match = linkText.match(/^\(\(([^)]+)\)\)$/);
    return match ? match[1].trim() : null;
  }

  /**
   * 检查文本是否为有效的页面链接
   * @param text 文本
   * @returns 是否为有效的页面链接
   */
  static isPageLink(text: string): boolean {
    return /^\[\[[^\]]+\]\]$/.test(text);
  }

  /**
   * 检查文本是否为有效的块引用
   * @param text 文本
   * @returns 是否为有效的块引用
   */
  static isBlockLink(text: string): boolean {
    return /^\(\([^)]+\)\)$/.test(text);
  }

  /**
   * 检查文本是否为任何类型的链接
   * @param text 文本
   * @returns 是否为链接
   */
  static isAnyLink(text: string): boolean {
    return this.isPageLink(text) || this.isBlockLink(text);
  }

  /**
   * 获取链接类型
   * @param text 文本
   * @returns 链接类型或null
   */
  static getLinkType(text: string): LinkType | null {
    if (this.isPageLink(text)) {
      return 'page-reference';
    }
    if (this.isBlockLink(text)) {
      return 'block-reference';
    }
    return null;
  }

  /**
   * 清理页面名称（移除非法字符）
   * @param pageName 页面名称
   * @returns 清理后的页面名称
   */
  static sanitizePageName(pageName: string): string {
    return pageName
      .replace(/[\[\]]/g, '') // 移除方括号
      .replace(/[|]/g, '') // 移除管道符
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim();
  }

  /**
   * 清理块ID（移除非法字符）
   * @param blockId 块ID
   * @returns 清理后的块ID
   */
  static sanitizeBlockId(blockId: string): string {
    return blockId
      .replace(/[()]/g, '') // 移除圆括号
      .replace(/\s+/g, '') // 移除所有空格
      .trim();
  }

  /**
   * 生成页面链接的显示文本
   * @param pageLink 页面链接
   * @returns 显示文本
   */
  static getDisplayText(pageLink: PageLink): string {
    return pageLink.displayText || pageLink.pageName;
  }

  /**
   * 检查两个链接是否相等
   * @param link1 链接1
   * @param link2 链接2
   * @returns 是否相等
   */
  static areLinksEqual(link1: Link, link2: Link): boolean {
    return (
      link1.sourceType === link2.sourceType &&
      link1.sourceId === link2.sourceId &&
      link1.targetType === link2.targetType &&
      link1.targetId === link2.targetId &&
      link1.linkType === link2.linkType &&
      link1.position === link2.position
    );
  }

  /**
   * 按位置排序链接
   * @param links 链接数组
   * @returns 排序后的链接数组
   */
  static sortLinksByPosition(links: (PageLink | BlockLink)[]): (PageLink | BlockLink)[] {
    return [...links].sort((a, b) => a.position - b.position);
  }

  /**
   * 按创建时间排序链接
   * @param links 链接数组
   * @returns 排序后的链接数组
   */
  static sortLinksByCreatedAt(links: Link[]): Link[] {
    return [...links].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * 过滤特定类型的链接
   * @param links 链接数组
   * @param linkType 链接类型
   * @returns 过滤后的链接数组
   */
  static filterLinksByType(links: Link[], linkType: LinkType): Link[] {
    return links.filter(link => link.linkType === linkType);
  }

  /**
   * 获取链接的唯一标识符
   * @param link 链接
   * @returns 唯一标识符
   */
  static getLinkSignature(link: Link): string {
    return `${link.sourceType}:${link.sourceId}->${link.targetType}:${link.targetId}@${link.position}`;
  }

  /**
   * 计算链接密度（每100字符的链接数）
   * @param content 内容
   * @param linkCount 链接数量
   * @returns 链接密度
   */
  static calculateLinkDensity(content: string, linkCount: number): number {
    if (content.length === 0) return 0;
    return (linkCount / content.length) * 100;
  }

  /**
   * 验证页面名称是否有效
   * @param pageName 页面名称
   * @returns 验证结果
   */
  static validatePageName(pageName: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!pageName || !pageName.trim()) {
      return { isValid: false, error: '页面名称不能为空' };
    }

    if (pageName.length > 200) {
      return { isValid: false, error: '页面名称过长（最多200字符）' };
    }

    if (/[\[\]|]/.test(pageName)) {
      return { isValid: false, error: '页面名称不能包含 [ ] | 字符' };
    }

    return { isValid: true };
  }

  /**
   * 验证块ID是否有效
   * @param blockId 块ID
   * @returns 验证结果
   */
  static validateBlockId(blockId: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!blockId || !blockId.trim()) {
      return { isValid: false, error: '块ID不能为空' };
    }

    if (!/^[a-zA-Z0-9_-]{8,}$/.test(blockId)) {
      return { isValid: false, error: '块ID格式无效（至少8位字母数字字符）' };
    }

    return { isValid: true };
  }

  /**
   * 转义特殊字符用于正则表达式
   * @param text 文本
   * @returns 转义后的文本
   */
  static escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 生成链接的预览文本
   * @param link 页面链接或块引用
   * @param maxLength 最大长度
   * @returns 预览文本
   */
  static generateLinkPreview(link: PageLink | BlockLink, maxLength: number = 100): string {
    const context = link.context || '';
    
    if (context.length <= maxLength) {
      return context;
    }

    // 找到链接在上下文中的位置
    const linkText = link.type === 'page-reference' 
      ? this.formatPageLink(link.pageName, link.displayText)
      : this.formatBlockLink(link.blockId);

    const linkIndex = context.indexOf(linkText);
    
    if (linkIndex === -1) {
      return context.substring(0, maxLength) + '...';
    }

    // 尝试保持链接在预览中心
    const halfLength = Math.floor(maxLength / 2);
    const start = Math.max(0, linkIndex - halfLength);
    const end = Math.min(context.length, start + maxLength);

    let preview = context.substring(start, end);
    
    if (start > 0) {
      preview = '...' + preview;
    }
    if (end < context.length) {
      preview = preview + '...';
    }

    return preview;
  }
}
