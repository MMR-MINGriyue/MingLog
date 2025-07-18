/**
 * Markdown预览组件
 * 提供实时的Markdown渲染预览功能
 */

import React, { useMemo, useCallback } from 'react';
import type { CustomElement } from '@minglog/editor';
import { MarkdownParser, type ParseResult } from '../services/MarkdownParser';
import { MathRenderer } from './MathRenderer';

/**
 * Markdown预览组件属性
 */
export interface MarkdownPreviewProps {
  /** Slate.js格式的内容 */
  content: CustomElement[];
  /** 是否显示源码 */
  showSource?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 链接点击处理 */
  onLinkClick?: (link: string) => void;
  /** 标签点击处理 */
  onTagClick?: (tag: string) => void;
  /** 块引用点击处理 */
  onBlockReferenceClick?: (blockId: string) => void;
  /** 是否启用语法高亮 */
  enableSyntaxHighlight?: boolean;
  /** 是否启用数学公式渲染 */
  enableMath?: boolean;
}

/**
 * Markdown预览组件实现
 */
export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  showSource = false,
  className = '',
  style,
  onLinkClick,
  onTagClick,
  onBlockReferenceClick,
  enableSyntaxHighlight = true,
  enableMath = true
}) => {
  // 创建Markdown解析器实例
  const parser = useMemo(() => new MarkdownParser({
    enableSyntaxHighlight,
    enableMath,
    linkResolver: (link: string) => link,
    tagResolver: (tag: string) => tag
  }), [enableSyntaxHighlight, enableMath]);

  // 将Slate内容转换为Markdown
  const markdownText = useMemo(async () => {
    try {
      return await parser.parseSlateToMarkdown(content);
    } catch (error) {
      console.error('转换为Markdown失败:', error);
      return '# 预览错误\n\n无法渲染内容';
    }
  }, [content, parser]);

  // 渲染Markdown为HTML
  const renderedHtml = useMemo(() => {
    const rawHtml = renderMarkdownToHtml(content, {
      onLinkClick,
      onTagClick,
      onBlockReferenceClick,
      enableSyntaxHighlight,
      enableMath
    });

    // 如果启用数学公式，进行后处理
    if (enableMath) {
      return postProcessMathFormulas(rawHtml);
    }

    return rawHtml;
  }, [content, onLinkClick, onTagClick, onBlockReferenceClick, enableSyntaxHighlight, enableMath]);

  // 处理链接点击
  const handleLinkClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const link = target.getAttribute('data-link');
    if (link && onLinkClick) {
      event.preventDefault();
      onLinkClick(link);
    }
  }, [onLinkClick]);

  // 处理标签点击
  const handleTagClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const tag = target.getAttribute('data-tag');
    if (tag && onTagClick) {
      event.preventDefault();
      onTagClick(tag);
    }
  }, [onTagClick]);

  // 处理块引用点击
  const handleBlockReferenceClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const blockId = target.getAttribute('data-block-id');
    if (blockId && onBlockReferenceClick) {
      event.preventDefault();
      onBlockReferenceClick(blockId);
    }
  }, [onBlockReferenceClick]);

  // 预览样式
  const previewStyle: React.CSSProperties = {
    padding: '16px',
    lineHeight: '1.6',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '16px',
    color: '#333',
    backgroundColor: '#fff',
    border: '1px solid #e1e5e9',
    borderRadius: '8px',
    minHeight: '200px',
    overflow: 'auto',
    ...style
  };

  // 源码样式
  const sourceStyle: React.CSSProperties = {
    ...previewStyle,
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    fontSize: '14px',
    backgroundColor: '#f8f9fa',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  };

  if (showSource) {
    // 显示Markdown源码
    return (
      <div 
        className={`markdown-source ${className}`}
        style={sourceStyle}
      >
        {React.use(markdownText)}
      </div>
    );
  }

  // 显示渲染后的预览
  return (
    <div 
      className={`markdown-preview ${className}`}
      style={previewStyle}
      onClick={handleLinkClick}
      onClickCapture={(e) => {
        handleTagClick(e);
        handleBlockReferenceClick(e);
      }}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

/**
 * 将Slate内容渲染为HTML
 */
function renderMarkdownToHtml(
  content: CustomElement[], 
  options: {
    onLinkClick?: (link: string) => void;
    onTagClick?: (tag: string) => void;
    onBlockReferenceClick?: (blockId: string) => void;
    enableSyntaxHighlight?: boolean;
    enableMath?: boolean;
  }
): string {
  return content.map(block => renderBlockToHtml(block, options)).join('');
}

/**
 * 将单个块渲染为HTML
 */
function renderBlockToHtml(
  block: CustomElement,
  options: {
    onLinkClick?: (link: string) => void;
    onTagClick?: (tag: string) => void;
    onBlockReferenceClick?: (blockId: string) => void;
    enableSyntaxHighlight?: boolean;
    enableMath?: boolean;
  }
): string {
  const childrenHtml = renderChildrenToHtml(block.children || [], options);

  switch (block.type) {
    case 'paragraph':
      return `<p>${childrenHtml}</p>`;
    
    case 'heading-1':
      return `<h1>${childrenHtml}</h1>`;
    case 'heading-2':
      return `<h2>${childrenHtml}</h2>`;
    case 'heading-3':
      return `<h3>${childrenHtml}</h3>`;
    case 'heading-4':
      return `<h4>${childrenHtml}</h4>`;
    case 'heading-5':
      return `<h5>${childrenHtml}</h5>`;
    case 'heading-6':
      return `<h6>${childrenHtml}</h6>`;
    
    case 'bulleted-list':
      return `<ul><li>${childrenHtml}</li></ul>`;
    
    case 'numbered-list':
      return `<ol><li>${childrenHtml}</li></ol>`;
    
    case 'todo-list':
      const checked = (block as any).checked;
      const checkboxHtml = `<input type="checkbox" ${checked ? 'checked' : ''} disabled>`;
      return `<div class="todo-item">${checkboxHtml} ${childrenHtml}</div>`;
    
    case 'quote':
      return `<blockquote>${childrenHtml}</blockquote>`;
    
    case 'code':
      const language = (block as any).language || 'text';
      const codeClass = options.enableSyntaxHighlight ? `language-${language}` : '';
      return `<pre><code class="${codeClass}">${escapeHtml(childrenHtml)}</code></pre>`;
    
    case 'divider':
      return '<hr>';
    
    default:
      return `<div>${childrenHtml}</div>`;
  }
}

/**
 * 将子节点渲染为HTML
 */
function renderChildrenToHtml(
  children: any[],
  options: {
    onLinkClick?: (link: string) => void;
    onTagClick?: (tag: string) => void;
    onBlockReferenceClick?: (blockId: string) => void;
    enableSyntaxHighlight?: boolean;
    enableMath?: boolean;
  }
): string {
  return children.map(child => {
    if ('text' in child) {
      let text = escapeHtml(child.text);
      
      // 处理双向链接 [[页面名称]]
      text = text.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
        return `<a href="#" class="bi-link" data-link="${escapeHtml(linkText)}">${escapeHtml(linkText)}</a>`;
      });
      
      // 处理标签 #标签名
      text = text.replace(/#([a-zA-Z0-9\u4e00-\u9fa5_-]+)/g, (match, tagName) => {
        return `<span class="tag" data-tag="${escapeHtml(tagName)}">#${escapeHtml(tagName)}</span>`;
      });
      
      // 处理块引用 ((块ID))
      text = text.replace(/\(\(([^)]+)\)\)/g, (match, blockId) => {
        return `<span class="block-ref" data-block-id="${escapeHtml(blockId)}">((${escapeHtml(blockId)}))</span>`;
      });
      
      // 处理数学公式
      if (options.enableMath) {
        // 行内公式 $formula$
        text = text.replace(/\$([^$]+)\$/g, (match, formula) => {
          return `<span class="math-inline" data-formula="${escapeHtml(formula)}" data-inline="true">${escapeHtml(formula)}</span>`;
        });

        // 块级公式 $$formula$$
        text = text.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
          return `<div class="math-block" data-formula="${escapeHtml(formula)}" data-inline="false">${escapeHtml(formula)}</div>`;
        });
      }
      
      // 应用文本格式
      if (child.bold) text = `<strong>${text}</strong>`;
      if (child.italic) text = `<em>${text}</em>`;
      if (child.underline) text = `<u>${text}</u>`;
      if (child.strikethrough) text = `<del>${text}</del>`;
      if (child.code) text = `<code>${text}</code>`;
      
      return text;
    }
    return '';
  }).join('');
}

/**
 * HTML转义函数
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 后处理数学公式，将标记转换为实际渲染
 */
function postProcessMathFormulas(html: string): string {
  // 这里我们暂时保持HTML标记，在实际渲染时通过CSS和JavaScript处理
  // 未来可以集成React组件渲染或服务端渲染
  return html.replace(
    /<(span|div) class="math-(inline|block)" data-formula="([^"]*)" data-inline="(true|false)"[^>]*>([^<]*)<\/(span|div)>/g,
    (match, tag, type, formula, isInline, content, endTag) => {
      const decodedFormula = decodeHtmlEntities(formula);
      const processedFormula = processMathFormula(decodedFormula);

      if (type === 'inline') {
        return `<span class="math-inline math-rendered" data-formula="${formula}" title="${decodedFormula}">${processedFormula}</span>`;
      } else {
        return `<div class="math-block math-rendered" data-formula="${formula}" title="${decodedFormula}">${processedFormula}</div>`;
      }
    }
  );
}

/**
 * 解码HTML实体
 */
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * 处理数学公式，应用基础渲染
 */
function processMathFormula(formula: string): string {
  if (!formula.trim()) {
    return '<span style="color: #999; font-style: italic;">空公式</span>';
  }

  // 简单的数学符号替换 (与MathRenderer中的逻辑保持一致)
  let processed = formula
    // 希腊字母
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\epsilon/g, 'ε')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\pi/g, 'π')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\phi/g, 'φ')
    .replace(/\\omega/g, 'ω')

    // 数学符号
    .replace(/\\infty/g, '∞')
    .replace(/\\sum/g, '∑')
    .replace(/\\prod/g, '∏')
    .replace(/\\int/g, '∫')
    .replace(/\\partial/g, '∂')
    .replace(/\\nabla/g, '∇')
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\neq/g, '≠')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\approx/g, '≈')
    .replace(/\\equiv/g, '≡')

    // 上下标处理
    .replace(/\^{([^}]+)}/g, '<sup>$1</sup>')
    .replace(/\^(\w)/g, '<sup>$1</sup>')
    .replace(/_{([^}]+)}/g, '<sub>$1</sub>')
    .replace(/_(\w)/g, '<sub>$1</sub>')

    // 分数处理
    .replace(/\\frac{([^}]+)}{([^}]+)}/g, '<span style="display: inline-block; text-align: center;"><span style="display: block; border-bottom: 1px solid; padding-bottom: 2px;">$1</span><span style="display: block; padding-top: 2px;">$2</span></span>')

    // 根号处理
    .replace(/\\sqrt{([^}]+)}/g, '√($1)')
    .replace(/\\sqrt/g, '√');

  return `<span style="font-family: 'Times New Roman', serif; font-size: 1.1em;">${processed}</span>`;
}

/**
 * 默认导出
 */
export default MarkdownPreview;
