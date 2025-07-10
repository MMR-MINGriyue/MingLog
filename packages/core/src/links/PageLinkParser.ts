/**
 * MingLog 页面链接解析器
 * 支持 [[页面名称]] 和 [[页面名称|显示文本]] 语法
 */

import { PageLink, LinkParser } from '../types/links';

export class PageLinkParser implements Partial<LinkParser> {
  // 页面链接正则表达式：[[页面名称]] 或 [[页面名称|显示文本]]
  private static readonly PAGE_LINK_REGEX = /\[\[([^\]]+)\]\]/g;
  
  // 上下文提取长度
  private static readonly CONTEXT_LENGTH = 50;

  /**
   * 解析内容中的所有页面链接
   * @param content 要解析的内容
   * @returns 页面链接数组
   */
  parsePageLinks(content: string): PageLink[] {
    const links: PageLink[] = [];
    
    // 重置正则表达式的lastIndex
    PageLinkParser.PAGE_LINK_REGEX.lastIndex = 0;
    
    let match;
    while ((match = PageLinkParser.PAGE_LINK_REGEX.exec(content)) !== null) {
      const [fullMatch, linkText] = match;
      const position = match.index;
      
      // 解析页面名称和显示文本
      const { pageName, displayText, alias } = this.parseLinkText(linkText);
      
      // 提取上下文
      const context = this.extractLinkContext(content, position, fullMatch.length);
      
      links.push({
        type: 'page-reference',
        pageName: pageName.trim(),
        displayText: displayText.trim(),
        position,
        length: fullMatch.length,
        context,
        alias: alias || undefined
      });
    }
    
    return links;
  }

  /**
   * 解析链接文本，支持别名语法
   * @param linkText 链接内部文本
   * @returns 解析结果
   */
  private parseLinkText(linkText: string): {
    pageName: string;
    displayText: string;
    alias?: string;
  } {
    // 检查是否包含别名分隔符 |
    const pipeIndex = linkText.indexOf('|');
    
    if (pipeIndex !== -1) {
      // 包含别名：[[页面名称|显示文本]]
      const pageName = linkText.substring(0, pipeIndex);
      const displayText = linkText.substring(pipeIndex + 1);
      
      return {
        pageName,
        displayText,
        alias: displayText !== pageName ? displayText : undefined
      };
    } else {
      // 不包含别名：[[页面名称]]
      return {
        pageName: linkText,
        displayText: linkText
      };
    }
  }

  /**
   * 提取链接周围的上下文
   * @param content 完整内容
   * @param position 链接位置
   * @param length 链接长度
   * @returns 上下文字符串
   */
  extractLinkContext(content: string, position: number, length: number): string {
    const start = Math.max(0, position - PageLinkParser.CONTEXT_LENGTH);
    const end = Math.min(content.length, position + length + PageLinkParser.CONTEXT_LENGTH);
    
    let context = content.substring(start, end);
    
    // 添加省略号
    if (start > 0) {
      context = '...' + context;
    }
    if (end < content.length) {
      context = context + '...';
    }
    
    return context.trim();
  }

  /**
   * 验证页面链接语法是否正确
   * @param linkText 链接文本
   * @returns 是否有效
   */
  static isValidPageLink(linkText: string): boolean {
    // 检查基本格式
    if (!linkText.startsWith('[[') || !linkText.endsWith(']]')) {
      return false;
    }
    
    // 提取内部文本
    const innerText = linkText.slice(2, -2);
    
    // 检查是否为空
    if (!innerText.trim()) {
      return false;
    }
    
    // 检查是否包含非法字符
    const invalidChars = ['[', ']', '\n', '\r'];
    for (const char of invalidChars) {
      if (innerText.includes(char)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 从光标位置检测是否在页面链接内部
   * @param content 内容
   * @param cursorPosition 光标位置
   * @returns 链接信息或null
   */
  static getLinkAtPosition(content: string, cursorPosition: number): PageLink | null {
    const parser = new PageLinkParser();
    const links = parser.parsePageLinks(content);
    
    for (const link of links) {
      if (cursorPosition >= link.position && cursorPosition <= link.position + link.length) {
        return link;
      }
    }
    
    return null;
  }

  /**
   * 获取当前正在输入的链接文本
   * @param content 内容
   * @param cursorPosition 光标位置
   * @returns 正在输入的链接文本或null
   */
  static getIncompleteLink(content: string, cursorPosition: number): {
    text: string;
    start: number;
    end: number;
  } | null {
    // 向前查找最近的 [[
    let start = cursorPosition;
    while (start >= 1 && content.substring(start - 2, start) !== '[[') {
      start--;
    }
    
    if (start < 1 || content.substring(start - 2, start) !== '[[') {
      return null;
    }
    
    start -= 2; // 包含 [[
    
    // 向后查找 ]] 或内容结束
    let end = cursorPosition;
    while (end < content.length && content.substring(end, end + 2) !== ']]') {
      end++;
    }
    
    // 如果找到了 ]]，说明链接已完成
    if (end < content.length && content.substring(end, end + 2) === ']]') {
      return null;
    }
    
    const text = content.substring(start, end);
    
    return {
      text,
      start,
      end
    };
  }

  /**
   * 替换内容中的页面链接
   * @param content 原始内容
   * @param replacements 替换映射
   * @returns 替换后的内容
   */
  static replacePageLinks(
    content: string, 
    replacements: Map<string, string>
  ): string {
    const parser = new PageLinkParser();
    const links = parser.parsePageLinks(content);
    
    // 从后往前替换，避免位置偏移
    const sortedLinks = links.sort((a, b) => b.position - a.position);
    
    let result = content;
    
    for (const link of sortedLinks) {
      const replacement = replacements.get(link.pageName);
      if (replacement !== undefined) {
        const newLinkText = link.alias 
          ? `[[${replacement}|${link.alias}]]`
          : `[[${replacement}]]`;
        
        result = result.substring(0, link.position) + 
                newLinkText + 
                result.substring(link.position + link.length);
      }
    }
    
    return result;
  }

  /**
   * 统计内容中的页面链接数量
   * @param content 内容
   * @returns 链接统计
   */
  static countPageLinks(content: string): {
    total: number;
    unique: number;
    withAlias: number;
    pages: Set<string>;
  } {
    const parser = new PageLinkParser();
    const links = parser.parsePageLinks(content);
    
    const pages = new Set<string>();
    let withAlias = 0;
    
    for (const link of links) {
      pages.add(link.pageName);
      if (link.alias) {
        withAlias++;
      }
    }
    
    return {
      total: links.length,
      unique: pages.size,
      withAlias,
      pages
    };
  }
}
