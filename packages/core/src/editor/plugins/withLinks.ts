/**
 * MingLog Slate.js 链接插件
 * 支持实时链接解析、可视化渲染和编辑功能
 */

import { Editor, Element, Node, Path, Point, Range, Text, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import { PageLinkParser } from '../../links/PageLinkParser';
import { BlockLinkParser } from '../../links/BlockLinkParser';
import { UnifiedLinkParser } from '../../links/UnifiedLinkParser';

// 链接元素类型
export interface LinkElement extends Element {
  type: 'page-link' | 'block-link' | 'broken-link';
  linkType: 'page-reference' | 'block-reference';
  target: string;
  displayText: string;
  alias?: string;
  exists?: boolean;
  children: Text[];
}

// 链接插件配置
export interface LinkPluginOptions {
  /** 是否启用实时解析 */
  enableRealTimeParsing?: boolean;
  /** 是否启用自动补全 */
  enableAutoComplete?: boolean;
  /** 是否启用链接验证 */
  enableValidation?: boolean;
  /** 链接验证回调 */
  validateLink?: (target: string, type: 'page' | 'block') => Promise<boolean>;
  /** 链接点击回调 */
  onLinkClick?: (target: string, type: 'page' | 'block') => void;
  /** 自动补全数据源 */
  getAutoCompleteData?: (query: string, type: 'page' | 'block') => Promise<any[]>;
}

// 扩展Editor接口
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & {
      linkParser: UnifiedLinkParser;
      linkOptions: LinkPluginOptions;
    };
    Element: LinkElement;
  }
}

/**
 * Slate.js 链接插件
 */
export const withLinks = (editor: Editor, options: LinkPluginOptions = {}): Editor => {
  const {
    enableRealTimeParsing = true,
    enableAutoComplete = true,
    enableValidation = true,
    validateLink,
    onLinkClick,
    getAutoCompleteData
  } = options;

  // 初始化解析器
  editor.linkParser = new UnifiedLinkParser();
  editor.linkOptions = options;

  const { insertText, insertBreak, deleteBackward, deleteForward, normalizeNode } = editor;

  // 检查是否为链接元素
  const isLinkElement = (element: Element): element is LinkElement => {
    return ['page-link', 'block-link', 'broken-link'].includes(element.type);
  };

  // 检查是否在链接内部
  const isInLink = (editor: Editor): boolean => {
    const [match] = Editor.nodes(editor, {
      match: n => Element.isElement(n) && isLinkElement(n),
    });
    return !!match;
  };

  // 获取当前链接
  const getCurrentLink = (editor: Editor): [LinkElement, Path] | null => {
    const [match] = Editor.nodes(editor, {
      match: n => Element.isElement(n) && isLinkElement(n),
    });
    return match ? [match[0] as LinkElement, match[1]] : null;
  };

  // 解析文本中的链接
  const parseLinksInText = (text: string): Array<{
    type: 'page-link' | 'block-link' | 'broken-link';
    linkType: 'page-reference' | 'block-reference';
    target: string;
    displayText: string;
    alias?: string;
    start: number;
    end: number;
  }> => {
    const links = editor.linkParser.parseAllLinks(text);
    const brokenLinks = editor.linkParser.validateLinkSyntax(text);
    
    const result: any[] = [];

    // 添加有效链接
    links.forEach(link => {
      if (link.type === 'page-reference') {
        result.push({
          type: 'page-link',
          linkType: 'page-reference',
          target: link.pageName,
          displayText: link.displayText,
          alias: link.alias,
          start: link.position,
          end: link.position + link.length
        });
      } else if (link.type === 'block-reference') {
        result.push({
          type: 'block-link',
          linkType: 'block-reference',
          target: link.blockId,
          displayText: `((${link.blockId}))`,
          start: link.position,
          end: link.position + link.length
        });
      }
    });

    // 添加损坏的链接
    if (!brokenLinks.isValid) {
      brokenLinks.errors.forEach(error => {
        result.push({
          type: 'broken-link',
          linkType: 'page-reference', // 默认类型
          target: '',
          displayText: error.text || '',
          start: error.position,
          end: error.position + (error.text?.length || 0)
        });
      });
    }

    return result.sort((a, b) => a.start - b.start);
  };

  // 将文本转换为链接元素
  const convertTextToLinks = (editor: Editor, path: Path) => {
    const node = Node.get(editor, path);
    
    if (!Text.isText(node)) return;

    const text = node.text;
    const links = parseLinksInText(text);

    if (links.length === 0) return;

    // 从后往前处理，避免路径变化
    for (let i = links.length - 1; i >= 0; i--) {
      const link = links[i];
      
      // 创建链接元素
      const linkElement: LinkElement = {
        type: link.type,
        linkType: link.linkType,
        target: link.target,
        displayText: link.displayText,
        alias: link.alias,
        exists: true, // 将通过验证更新
        children: [{ text: link.displayText }]
      };

      // 替换文本为链接元素
      const linkPath = [...path];
      const start = { path: linkPath, offset: link.start };
      const end = { path: linkPath, offset: link.end };
      const range = { anchor: start, focus: end };

      Transforms.select(editor, range);
      Transforms.insertNodes(editor, linkElement);
    }
  };

  // 验证链接存在性
  const validateLinkExists = async (element: LinkElement, path: Path) => {
    if (!enableValidation || !validateLink) return;

    try {
      const exists = await validateLink(
        element.target,
        element.linkType === 'page-reference' ? 'page' : 'block'
      );

      if (element.exists !== exists) {
        Transforms.setNodes(
          editor,
          { exists },
          { at: path }
        );
      }
    } catch (error) {
      console.warn('Link validation failed:', error);
    }
  };

  // 处理链接点击
  const handleLinkClick = (element: LinkElement) => {
    if (onLinkClick) {
      onLinkClick(
        element.target,
        element.linkType === 'page-reference' ? 'page' : 'block'
      );
    }
  };

  // 重写 insertText
  editor.insertText = (text: string) => {
    insertText(text);

    if (enableRealTimeParsing) {
      // 检查是否触发了链接语法
      const { selection } = editor;
      if (selection && Range.isCollapsed(selection)) {
        const [node, path] = Editor.node(editor, selection);
        
        if (Text.isText(node)) {
          // 延迟解析，避免频繁触发
          setTimeout(() => {
            convertTextToLinks(editor, path);
          }, 100);
        }
      }
    }
  };

  // 重写 insertBreak
  editor.insertBreak = () => {
    if (isInLink(editor)) {
      // 在链接内部按回车，退出链接
      Transforms.move(editor, { unit: 'offset' });
      insertBreak();
    } else {
      insertBreak();
    }
  };

  // 重写 deleteBackward
  editor.deleteBackward = (unit) => {
    const { selection } = editor;
    
    if (selection && Range.isCollapsed(selection)) {
      const currentLink = getCurrentLink(editor);
      
      if (currentLink) {
        const [linkElement, linkPath] = currentLink;
        const start = Editor.start(editor, linkPath);
        
        // 如果在链接开始位置删除，删除整个链接
        if (Point.equals(selection.anchor, start)) {
          Transforms.removeNodes(editor, { at: linkPath });
          return;
        }
      }
    }
    
    deleteBackward(unit);
  };

  // 重写 deleteForward
  editor.deleteForward = (unit) => {
    const { selection } = editor;
    
    if (selection && Range.isCollapsed(selection)) {
      const currentLink = getCurrentLink(editor);
      
      if (currentLink) {
        const [linkElement, linkPath] = currentLink;
        const end = Editor.end(editor, linkPath);
        
        // 如果在链接结束位置删除，删除整个链接
        if (Point.equals(selection.anchor, end)) {
          Transforms.removeNodes(editor, { at: linkPath });
          return;
        }
      }
    }
    
    deleteForward(unit);
  };

  // 重写 normalizeNode
  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    // 处理链接元素
    if (Element.isElement(node) && isLinkElement(node)) {
      // 验证链接存在性
      if (enableValidation) {
        validateLinkExists(node, path);
      }

      // 确保链接元素只包含文本子节点
      for (const [child, childPath] of Node.children(editor, path)) {
        if (Element.isElement(child)) {
          Transforms.unwrapNodes(editor, { at: childPath });
          return;
        }
      }

      // 确保链接元素有正确的文本内容
      const text = Node.string(node);
      if (text !== node.displayText) {
        Transforms.insertText(editor, node.displayText, { at: path });
        Transforms.delete(editor, {
          at: {
            anchor: { path: [...path, 0], offset: node.displayText.length },
            focus: { path: [...path, 0], offset: text.length }
          }
        });
        return;
      }
    }

    normalizeNode(entry);
  };

  // 添加链接相关的辅助方法
  editor.insertPageLink = (pageName: string, displayText?: string) => {
    const linkElement: LinkElement = {
      type: 'page-link',
      linkType: 'page-reference',
      target: pageName,
      displayText: displayText || pageName,
      exists: true,
      children: [{ text: displayText || pageName }]
    };

    Transforms.insertNodes(editor, linkElement);
  };

  editor.insertBlockLink = (blockId: string) => {
    const linkElement: LinkElement = {
      type: 'block-link',
      linkType: 'block-reference',
      target: blockId,
      displayText: `((${blockId}))`,
      exists: true,
      children: [{ text: `((${blockId}))` }]
    };

    Transforms.insertNodes(editor, linkElement);
  };

  editor.isLinkActive = () => {
    return isInLink(editor);
  };

  editor.getCurrentLink = () => {
    return getCurrentLink(editor);
  };

  return editor;
};

// 链接元素渲染器
export const renderLinkElement = (props: any) => {
  const { attributes, children, element } = props;

  if (!['page-link', 'block-link', 'broken-link'].includes(element.type)) {
    return null;
  }

  const className = [
    'slate-link',
    `slate-link--${element.type}`,
    element.exists === false ? 'slate-link--broken' : 'slate-link--exists'
  ].join(' ');

  return (
    <span
      {...attributes}
      className={className}
      data-link-type={element.linkType}
      data-target={element.target}
      data-exists={element.exists}
      contentEditable={false}
    >
      {children}
    </span>
  );
};

export default withLinks;
