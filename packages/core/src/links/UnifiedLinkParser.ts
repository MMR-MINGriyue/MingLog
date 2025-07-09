/**
 * MingLog 统一链接解析器
 * 整合页面链接和块引用解析功能
 */

import { PageLink, BlockLink, LinkParser, BrokenLink } from '../types/links';
import { PageLinkParser } from './PageLinkParser';
import { BlockLinkParser } from './BlockLinkParser';

export class UnifiedLinkParser implements LinkParser {
  private pageParser: PageLinkParser;
  private blockParser: BlockLinkParser;

  constructor() {
    this.pageParser = new PageLinkParser();
    this.blockParser = new BlockLinkParser();
  }

  /**
   * 解析内容中的所有页面链接
   * @param content 要解析的内容
   * @returns 页面链接数组
   */
  parsePageLinks(content: string): PageLink[] {
    return this.pageParser.parsePageLinks(content);
  }

  /**
   * 解析内容中的所有块引用
   * @param content 要解析的内容
   * @returns 块引用数组
   */
  parseBlockLinks(content: string): BlockLink[] {
    return this.blockParser.parseBlockLinks(content);
  }

  /**
   * 解析内容中的所有链接（页面链接 + 块引用）
   * @param content 要解析的内容
   * @returns 所有链接的联合类型数组
   */
  parseAllLinks(content: string): (PageLink | BlockLink)[] {
    const pageLinks = this.parsePageLinks(content);
    const blockLinks = this.parseBlockLinks(content);
    
    // 合并并按位置排序
    const allLinks = [...pageLinks, ...blockLinks];
    return allLinks.sort((a, b) => a.position - b.position);
  }

  /**
   * 提取链接周围的上下文
   * @param content 完整内容
   * @param position 链接位置
   * @param length 链接长度
   * @returns 上下文字符串
   */
  extractLinkContext(content: string, position: number, length: number): string {
    return this.pageParser.extractLinkContext(content, position, length);
  }

  /**
   * 检测并修复损坏的链接语法
   * @param content 内容
   * @returns 修复后的内容和损坏链接列表
   */
  detectAndFixBrokenLinks(content: string): {
    fixedContent: string;
    brokenLinks: BrokenLink[];
  } {
    const brokenLinks: BrokenLink[] = [];
    let fixedContent = content;

    // 检测不完整的页面链接 [[xxx 或 xxx]]
    const incompletePageLinks = this.findIncompletePageLinks(content);
    for (const broken of incompletePageLinks) {
      brokenLinks.push(broken);
    }

    // 检测不完整的块引用 ((xxx 或 xxx))
    const incompleteBlockLinks = this.findIncompleteBlockLinks(content);
    for (const broken of incompleteBlockLinks) {
      brokenLinks.push(broken);
    }

    // 检测嵌套链接 [[[[xxx]]]]
    const nestedLinks = this.findNestedLinks(content);
    for (const broken of nestedLinks) {
      brokenLinks.push(broken);
    }

    return {
      fixedContent,
      brokenLinks
    };
  }

  /**
   * 查找不完整的页面链接
   */
  private findIncompletePageLinks(content: string): BrokenLink[] {
    const brokenLinks: BrokenLink[] = [];
    
    // 查找单独的 [[ 或 ]]
    const singleBrackets = /(\[\[(?![^\]]*\]\])|(?<!\[\[[^\]]*)\]\])/g;
    let match;
    
    while ((match = singleBrackets.exec(content)) !== null) {
      const context = this.extractLinkContext(content, match.index, match[0].length);
      
      brokenLinks.push({
        type: 'broken-link',
        originalText: match[0],
        position: match.index,
        length: match[0].length,
        reason: '不完整的页面链接语法'
      });
    }
    
    return brokenLinks;
  }

  /**
   * 查找不完整的块引用
   */
  private findIncompleteBlockLinks(content: string): BrokenLink[] {
    const brokenLinks: BrokenLink[] = [];
    
    // 查找单独的 (( 或 ))
    const singleParens = /(\(\((?![^)]*\)\))|(?<!\(\([^)]*)\)\))/g;
    let match;
    
    while ((match = singleParens.exec(content)) !== null) {
      const context = this.extractLinkContext(content, match.index, match[0].length);
      
      brokenLinks.push({
        type: 'broken-link',
        originalText: match[0],
        position: match.index,
        length: match[0].length,
        reason: '不完整的块引用语法'
      });
    }
    
    return brokenLinks;
  }

  /**
   * 查找嵌套链接
   */
  private findNestedLinks(content: string): BrokenLink[] {
    const brokenLinks: BrokenLink[] = [];
    
    // 查找嵌套的页面链接
    const nestedPageLinks = /\[\[([^\]]*\[\[[^\]]*\]\][^\]]*)\]\]/g;
    let match;
    
    while ((match = nestedPageLinks.exec(content)) !== null) {
      const context = this.extractLinkContext(content, match.index, match[0].length);
      
      brokenLinks.push({
        type: 'broken-link',
        originalText: match[0],
        position: match.index,
        length: match[0].length,
        reason: '嵌套的页面链接'
      });
    }
    
    // 查找嵌套的块引用
    const nestedBlockLinks = /\(\(([^)]*\(\([^)]*\)\)[^)]*)\)\)/g;
    
    while ((match = nestedBlockLinks.exec(content)) !== null) {
      const context = this.extractLinkContext(content, match.index, match[0].length);
      
      brokenLinks.push({
        type: 'broken-link',
        originalText: match[0],
        position: match.index,
        length: match[0].length,
        reason: '嵌套的块引用'
      });
    }
    
    return brokenLinks;
  }

  /**
   * 获取光标位置的链接信息
   * @param content 内容
   * @param cursorPosition 光标位置
   * @returns 链接信息或null
   */
  getLinkAtPosition(content: string, cursorPosition: number): PageLink | BlockLink | null {
    // 先检查页面链接
    const pageLink = PageLinkParser.getLinkAtPosition(content, cursorPosition);
    if (pageLink) {
      return pageLink;
    }
    
    // 再检查块引用
    const blockLink = BlockLinkParser.getLinkAtPosition(content, cursorPosition);
    if (blockLink) {
      return blockLink;
    }
    
    return null;
  }

  /**
   * 获取正在输入的链接
   * @param content 内容
   * @param cursorPosition 光标位置
   * @returns 正在输入的链接信息或null
   */
  getIncompleteLink(content: string, cursorPosition: number): {
    text: string;
    start: number;
    end: number;
    type: 'page' | 'block';
  } | null {
    // 检查页面链接
    const pageLink = PageLinkParser.getIncompleteLink(content, cursorPosition);
    if (pageLink) {
      return {
        ...pageLink,
        type: 'page'
      };
    }
    
    // 检查块引用
    const blockLink = BlockLinkParser.getIncompleteLink(content, cursorPosition);
    if (blockLink) {
      return {
        ...blockLink,
        type: 'block'
      };
    }
    
    return null;
  }

  /**
   * 统计内容中的所有链接
   * @param content 内容
   * @returns 链接统计信息
   */
  getLinkStatistics(content: string): {
    pageLinks: ReturnType<typeof PageLinkParser.countPageLinks>;
    blockLinks: ReturnType<typeof BlockLinkParser.countBlockLinks>;
    total: number;
  } {
    const pageStats = PageLinkParser.countPageLinks(content);
    const blockStats = BlockLinkParser.countBlockLinks(content);
    
    return {
      pageLinks: pageStats,
      blockLinks: blockStats,
      total: pageStats.total + blockStats.total
    };
  }

  /**
   * 验证内容中的所有链接语法
   * @param content 内容
   * @returns 验证结果
   */
  validateLinkSyntax(content: string): {
    isValid: boolean;
    errors: Array<{
      position: number;
      length: number;
      message: string;
      type: 'page' | 'block' | 'syntax';
    }>;
  } {
    const errors: Array<{
      position: number;
      length: number;
      message: string;
      type: 'page' | 'block' | 'syntax';
    }> = [];

    // 检测损坏的链接
    const { brokenLinks } = this.detectAndFixBrokenLinks(content);
    
    for (const broken of brokenLinks) {
      errors.push({
        position: broken.position,
        length: broken.length,
        message: broken.reason,
        type: 'syntax'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
