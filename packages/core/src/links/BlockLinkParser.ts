/**
 * MingLog 块引用解析器
 * 支持 ((块ID)) 语法
 */

import { BlockLink, LinkParser } from '../types/links';

export class BlockLinkParser implements Partial<LinkParser> {
  // 块引用正则表达式：((块ID))
  private static readonly BLOCK_LINK_REGEX = /\(\(([^)]+)\)\)/g;
  
  // 块ID格式验证正则
  private static readonly BLOCK_ID_REGEX = /^[a-zA-Z0-9_-]{8,}$/;
  
  // 上下文提取长度
  private static readonly CONTEXT_LENGTH = 50;

  /**
   * 解析内容中的所有块引用
   * @param content 要解析的内容
   * @returns 块引用数组
   */
  parseBlockLinks(content: string): BlockLink[] {
    const links: BlockLink[] = [];
    
    // 重置正则表达式的lastIndex
    BlockLinkParser.BLOCK_LINK_REGEX.lastIndex = 0;
    
    let match;
    while ((match = BlockLinkParser.BLOCK_LINK_REGEX.exec(content)) !== null) {
      const [fullMatch, blockId] = match;
      const position = match.index;
      
      // 验证块ID格式
      if (!this.isValidBlockId(blockId.trim())) {
        continue;
      }
      
      // 提取上下文
      const context = this.extractLinkContext(content, position, fullMatch.length);
      
      links.push({
        type: 'block-reference',
        blockId: blockId.trim(),
        position,
        length: fullMatch.length,
        context
      });
    }
    
    return links;
  }

  /**
   * 提取链接周围的上下文
   * @param content 完整内容
   * @param position 链接位置
   * @param length 链接长度
   * @returns 上下文字符串
   */
  extractLinkContext(content: string, position: number, length: number): string {
    const start = Math.max(0, position - BlockLinkParser.CONTEXT_LENGTH);
    const end = Math.min(content.length, position + length + BlockLinkParser.CONTEXT_LENGTH);
    
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
   * 验证块ID格式是否正确
   * @param blockId 块ID
   * @returns 是否有效
   */
  private isValidBlockId(blockId: string): boolean {
    return BlockLinkParser.BLOCK_ID_REGEX.test(blockId);
  }

  /**
   * 验证块引用语法是否正确
   * @param linkText 链接文本
   * @returns 是否有效
   */
  static isValidBlockLink(linkText: string): boolean {
    // 检查基本格式
    if (!linkText.startsWith('((') || !linkText.endsWith('))')) {
      return false;
    }
    
    // 提取块ID
    const blockId = linkText.slice(2, -2);
    
    // 检查是否为空
    if (!blockId.trim()) {
      return false;
    }
    
    // 验证块ID格式
    return BlockLinkParser.BLOCK_ID_REGEX.test(blockId.trim());
  }

  /**
   * 从光标位置检测是否在块引用内部
   * @param content 内容
   * @param cursorPosition 光标位置
   * @returns 块引用信息或null
   */
  static getLinkAtPosition(content: string, cursorPosition: number): BlockLink | null {
    const parser = new BlockLinkParser();
    const links = parser.parseBlockLinks(content);
    
    for (const link of links) {
      if (cursorPosition >= link.position && cursorPosition <= link.position + link.length) {
        return link;
      }
    }
    
    return null;
  }

  /**
   * 获取当前正在输入的块引用
   * @param content 内容
   * @param cursorPosition 光标位置
   * @returns 正在输入的块引用文本或null
   */
  static getIncompleteLink(content: string, cursorPosition: number): {
    text: string;
    start: number;
    end: number;
  } | null {
    // 向前查找最近的 ((
    let start = cursorPosition;
    while (start >= 1 && content.substring(start - 2, start) !== '((') {
      start--;
    }
    
    if (start < 1 || content.substring(start - 2, start) !== '((') {
      return null;
    }
    
    start -= 2; // 包含 ((
    
    // 向后查找 )) 或内容结束
    let end = cursorPosition;
    while (end < content.length && content.substring(end, end + 2) !== '))') {
      end++;
    }
    
    // 如果找到了 ))，说明引用已完成
    if (end < content.length && content.substring(end, end + 2) === '))') {
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
   * 替换内容中的块引用
   * @param content 原始内容
   * @param replacements 替换映射 (旧块ID -> 新块ID)
   * @returns 替换后的内容
   */
  static replaceBlockLinks(
    content: string, 
    replacements: Map<string, string>
  ): string {
    const parser = new BlockLinkParser();
    const links = parser.parseBlockLinks(content);
    
    // 从后往前替换，避免位置偏移
    const sortedLinks = links.sort((a, b) => b.position - a.position);
    
    let result = content;
    
    for (const link of sortedLinks) {
      const replacement = replacements.get(link.blockId);
      if (replacement !== undefined) {
        const newLinkText = `((${replacement}))`;
        
        result = result.substring(0, link.position) + 
                newLinkText + 
                result.substring(link.position + link.length);
      }
    }
    
    return result;
  }

  /**
   * 统计内容中的块引用数量
   * @param content 内容
   * @returns 引用统计
   */
  static countBlockLinks(content: string): {
    total: number;
    unique: number;
    blocks: Set<string>;
  } {
    const parser = new BlockLinkParser();
    const links = parser.parseBlockLinks(content);
    
    const blocks = new Set<string>();
    
    for (const link of links) {
      blocks.add(link.blockId);
    }
    
    return {
      total: links.length,
      unique: blocks.size,
      blocks
    };
  }

  /**
   * 生成新的块ID
   * @returns 新的块ID
   */
  static generateBlockId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // 生成12位随机字符串
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // 添加时间戳后缀确保唯一性
    const timestamp = Date.now().toString(36);
    
    return result + timestamp;
  }

  /**
   * 验证块ID是否存在于内容中
   * @param content 内容
   * @param blockId 要查找的块ID
   * @returns 是否存在
   */
  static hasBlockId(content: string, blockId: string): boolean {
    const parser = new BlockLinkParser();
    const links = parser.parseBlockLinks(content);
    
    return links.some(link => link.blockId === blockId);
  }

  /**
   * 获取内容中所有唯一的块ID
   * @param content 内容
   * @returns 块ID数组
   */
  static extractBlockIds(content: string): string[] {
    const parser = new BlockLinkParser();
    const links = parser.parseBlockLinks(content);
    
    const blockIds = new Set<string>();
    for (const link of links) {
      blockIds.add(link.blockId);
    }
    
    return Array.from(blockIds);
  }
}
