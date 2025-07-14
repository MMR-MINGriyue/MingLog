/**
 * Markdown解析器服务
 * 基于unified.js生态系统，提供Markdown与HTML的双向转换
 * 支持标准语法和MingLog特殊语法扩展
 */

import type { CustomElement, CustomText } from '@minglog/editor';

/**
 * Markdown解析选项
 */
export interface MarkdownParseOptions {
  /** 是否启用双向链接解析 */
  enableBidirectionalLinks?: boolean;
  /** 是否启用标签解析 */
  enableTags?: boolean;
  /** 是否启用块引用解析 */
  enableBlockReferences?: boolean;
  /** 是否启用数学公式解析 */
  enableMath?: boolean;
  /** 是否启用代码语法高亮 */
  enableSyntaxHighlight?: boolean;
  /** 是否启用表格解析 */
  enableTables?: boolean;
  /** 是否启用任务列表 */
  enableTaskLists?: boolean;
  /** 自定义链接解析器 */
  linkResolver?: (link: string) => string;
  /** 自定义标签解析器 */
  tagResolver?: (tag: string) => string;
}

/**
 * 解析结果接口
 */
export interface ParseResult {
  /** 解析后的内容 */
  content: string | CustomElement[];
  /** 提取的链接 */
  links: string[];
  /** 提取的标签 */
  tags: string[];
  /** 提取的块引用 */
  blockReferences: string[];
  /** 解析错误 */
  errors: string[];
  /** 解析统计 */
  stats: {
    wordCount: number;
    characterCount: number;
    blockCount: number;
    linkCount: number;
    tagCount: number;
  };
}

/**
 * Markdown解析器实现
 */
export class MarkdownParser {
  private options: Required<MarkdownParseOptions>;

  constructor(options: MarkdownParseOptions = {}) {
    this.options = {
      enableBidirectionalLinks: true,
      enableTags: true,
      enableBlockReferences: true,
      enableMath: true,
      enableSyntaxHighlight: true,
      enableTables: true,
      enableTaskLists: true,
      linkResolver: (link: string) => link,
      tagResolver: (tag: string) => tag,
      ...options
    };
  }

  /**
   * 将Markdown文本解析为Slate.js格式
   */
  async parseMarkdownToSlate(markdown: string): Promise<ParseResult> {
    const result: ParseResult = {
      content: [],
      links: [],
      tags: [],
      blockReferences: [],
      errors: [],
      stats: {
        wordCount: 0,
        characterCount: markdown.length,
        blockCount: 0,
        linkCount: 0,
        tagCount: 0
      }
    };

    try {
      // 预处理：提取特殊语法
      const preprocessed = this.preprocessMarkdown(markdown, result);
      
      // 解析基础Markdown
      const blocks = this.parseBasicMarkdown(preprocessed, result);
      
      // 后处理：应用特殊语法
      result.content = this.postprocessBlocks(blocks, result);
      
      // 更新统计信息
      this.updateStats(result);

    } catch (error) {
      result.errors.push(`解析错误: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * 将Slate.js格式转换为Markdown文本
   */
  async parseSlateToMarkdown(blocks: CustomElement[]): Promise<string> {
    try {
      return blocks.map(block => this.blockToMarkdown(block)).join('\n\n');
    } catch (error) {
      throw new Error(`转换为Markdown失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 预处理Markdown，提取特殊语法
   */
  private preprocessMarkdown(markdown: string, result: ParseResult): string {
    let processed = markdown;

    // 提取双向链接 [[页面名称]]
    if (this.options.enableBidirectionalLinks) {
      const linkRegex = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = linkRegex.exec(markdown)) !== null) {
        const linkText = match[1];
        result.links.push(linkText);
        // 替换为临时标记
        processed = processed.replace(match[0], `__BILINK_${result.links.length - 1}__`);
      }
    }

    // 提取标签 #标签名
    if (this.options.enableTags) {
      const tagRegex = /#([a-zA-Z0-9\u4e00-\u9fa5_-]+)/g;
      let match;
      while ((match = tagRegex.exec(markdown)) !== null) {
        const tagName = match[1];
        result.tags.push(tagName);
        // 替换为临时标记
        processed = processed.replace(match[0], `__TAG_${result.tags.length - 1}__`);
      }
    }

    // 提取块引用 ((块ID))
    if (this.options.enableBlockReferences) {
      const blockRefRegex = /\(\(([^)]+)\)\)/g;
      let match;
      while ((match = blockRefRegex.exec(markdown)) !== null) {
        const blockId = match[1];
        result.blockReferences.push(blockId);
        // 替换为临时标记
        processed = processed.replace(match[0], `__BLOCKREF_${result.blockReferences.length - 1}__`);
      }
    }

    return processed;
  }

  /**
   * 解析基础Markdown语法
   */
  private parseBasicMarkdown(markdown: string, result: ParseResult): CustomElement[] {
    const blocks: CustomElement[] = [];
    const lines = markdown.split('\n');
    let currentBlock: CustomElement | null = null;
    let inCodeBlock = false;
    let codeBlockLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // 处理代码块
      if (trimmedLine.startsWith('```')) {
        if (!inCodeBlock) {
          // 开始代码块
          inCodeBlock = true;
          codeBlockLanguage = trimmedLine.slice(3).trim();
          currentBlock = {
            type: 'code',
            language: codeBlockLanguage || 'text',
            children: [{ text: '' }]
          };
        } else {
          // 结束代码块
          inCodeBlock = false;
          if (currentBlock) {
            blocks.push(currentBlock);
            currentBlock = null;
          }
        }
        continue;
      }

      if (inCodeBlock) {
        // 在代码块内
        if (currentBlock) {
          const text = (currentBlock.children[0] as CustomText).text;
          (currentBlock.children[0] as CustomText).text = text ? `${text}\n${line}` : line;
        }
        continue;
      }

      // 处理标题
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        blocks.push({
          type: `heading-${level}` as any,
          children: this.parseInlineText(text, result)
        });
        continue;
      }

      // 处理列表
      const bulletMatch = line.match(/^(\s*)[*+-]\s+(.+)$/);
      if (bulletMatch) {
        const text = bulletMatch[2];
        blocks.push({
          type: 'bulleted-list',
          children: this.parseInlineText(text, result)
        });
        continue;
      }

      const numberedMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
      if (numberedMatch) {
        const text = numberedMatch[2];
        blocks.push({
          type: 'numbered-list',
          children: this.parseInlineText(text, result)
        });
        continue;
      }

      // 处理任务列表
      if (this.options.enableTaskLists) {
        const taskMatch = line.match(/^(\s*)-\s+\[([ x])\]\s+(.+)$/);
        if (taskMatch) {
          const checked = taskMatch[2] === 'x';
          const text = taskMatch[3];
          blocks.push({
            type: 'todo-list',
            checked,
            children: this.parseInlineText(text, result)
          });
          continue;
        }
      }

      // 处理引用
      if (line.startsWith('> ')) {
        const text = line.slice(2);
        blocks.push({
          type: 'quote',
          children: this.parseInlineText(text, result)
        });
        continue;
      }

      // 处理分隔线
      if (/^[-*_]{3,}$/.test(trimmedLine)) {
        blocks.push({
          type: 'divider',
          children: [{ text: '' }]
        });
        continue;
      }

      // 处理空行
      if (trimmedLine === '') {
        continue;
      }

      // 处理普通段落
      blocks.push({
        type: 'paragraph',
        children: this.parseInlineText(line, result)
      });
    }

    return blocks;
  }

  /**
   * 解析行内文本格式
   */
  private parseInlineText(text: string, result: ParseResult): CustomText[] {
    const children: CustomText[] = [];
    let currentText = text;
    let currentNode: CustomText = { text: '' };

    // 简化的行内格式解析
    // 这里可以扩展支持更复杂的行内格式
    
    // 处理粗体 **text**
    currentText = currentText.replace(/\*\*([^*]+)\*\*/g, (match, content) => {
      return `__BOLD_START__${content}__BOLD_END__`;
    });

    // 处理斜体 *text*
    currentText = currentText.replace(/\*([^*]+)\*/g, (match, content) => {
      return `__ITALIC_START__${content}__ITALIC_END__`;
    });

    // 处理行内代码 `code`
    currentText = currentText.replace(/`([^`]+)`/g, (match, content) => {
      return `__CODE_START__${content}__CODE_END__`;
    });

    // 简化处理：直接返回文本
    children.push({ text: currentText });

    return children;
  }

  /**
   * 后处理：恢复特殊语法
   */
  private postprocessBlocks(blocks: CustomElement[], result: ParseResult): CustomElement[] {
    return blocks.map(block => {
      if (block.children) {
        block.children = block.children.map(child => {
          if ('text' in child) {
            let text = child.text;

            // 恢复双向链接
            text = text.replace(/__BILINK_(\d+)__/g, (match, index) => {
              const linkText = result.links[parseInt(index)];
              return `[[${linkText}]]`;
            });

            // 恢复标签
            text = text.replace(/__TAG_(\d+)__/g, (match, index) => {
              const tagName = result.tags[parseInt(index)];
              return `#${tagName}`;
            });

            // 恢复块引用
            text = text.replace(/__BLOCKREF_(\d+)__/g, (match, index) => {
              const blockId = result.blockReferences[parseInt(index)];
              return `((${blockId}))`;
            });

            return { ...child, text };
          }
          return child;
        });
      }
      return block;
    });
  }

  /**
   * 将单个块转换为Markdown
   */
  private blockToMarkdown(block: CustomElement): string {
    switch (block.type) {
      case 'paragraph':
        return this.childrenToMarkdown(block.children);
      
      case 'heading-1':
        return `# ${this.childrenToMarkdown(block.children)}`;
      case 'heading-2':
        return `## ${this.childrenToMarkdown(block.children)}`;
      case 'heading-3':
        return `### ${this.childrenToMarkdown(block.children)}`;
      case 'heading-4':
        return `#### ${this.childrenToMarkdown(block.children)}`;
      case 'heading-5':
        return `##### ${this.childrenToMarkdown(block.children)}`;
      case 'heading-6':
        return `###### ${this.childrenToMarkdown(block.children)}`;
      
      case 'bulleted-list':
        return `- ${this.childrenToMarkdown(block.children)}`;
      
      case 'numbered-list':
        return `1. ${this.childrenToMarkdown(block.children)}`;
      
      case 'todo-list':
        const checked = (block as any).checked ? 'x' : ' ';
        return `- [${checked}] ${this.childrenToMarkdown(block.children)}`;
      
      case 'quote':
        return `> ${this.childrenToMarkdown(block.children)}`;
      
      case 'code':
        const language = (block as any).language || '';
        const codeText = this.childrenToMarkdown(block.children);
        return `\`\`\`${language}\n${codeText}\n\`\`\``;
      
      case 'divider':
        return '---';
      
      default:
        return this.childrenToMarkdown(block.children);
    }
  }

  /**
   * 将子节点转换为Markdown文本
   */
  private childrenToMarkdown(children: any[]): string {
    return children.map(child => {
      if ('text' in child) {
        let text = child.text;
        
        // 应用格式
        if (child.bold) text = `**${text}**`;
        if (child.italic) text = `*${text}*`;
        if (child.code) text = `\`${text}\``;
        
        return text;
      }
      return '';
    }).join('');
  }

  /**
   * 更新解析统计信息
   */
  private updateStats(result: ParseResult): void {
    if (Array.isArray(result.content)) {
      result.stats.blockCount = result.content.length;
      result.stats.wordCount = result.content.reduce((count, block) => {
        const text = this.childrenToMarkdown(block.children || []);
        return count + text.split(/\s+/).filter(word => word.length > 0).length;
      }, 0);
    }
    
    result.stats.linkCount = result.links.length;
    result.stats.tagCount = result.tags.length;
  }

  /**
   * 更新解析选项
   */
  updateOptions(options: Partial<MarkdownParseOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 获取当前解析选项
   */
  getOptions(): MarkdownParseOptions {
    return { ...this.options };
  }
}
