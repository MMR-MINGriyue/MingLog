/**
 * 编辑器工具函数
 */

import { Descendant } from 'slate'
import { CustomElement, CustomText } from '../types'

// 生成唯一ID
export const generateId = (): string => {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 获取默认编辑器值
export const getDefaultValue = (): Descendant[] => {
  return [
    {
      id: generateId(),
      type: 'paragraph',
      children: [{ text: '' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as CustomElement
  ]
}

// 规范化编辑器值
export const normalizeValue = (value: Descendant[]): Descendant[] => {
  if (!value || value.length === 0) {
    return getDefaultValue()
  }

  return value.map(node => {
    if ('type' in node) {
      const element = node as CustomElement
      return {
        ...element,
        id: element.id || generateId(),
        createdAt: element.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
    return node
  })
}

// 创建新块
export const createBlock = (type: string, content: string = ''): CustomElement => {
  const baseBlock = {
    id: generateId(),
    children: [{ text: content } as CustomText],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  switch (type) {
    case 'paragraph':
      return {
        ...baseBlock,
        type: 'paragraph'
      } as CustomElement

    case 'heading-1':
      return {
        ...baseBlock,
        type: 'heading-1'
      } as CustomElement

    case 'heading-2':
      return {
        ...baseBlock,
        type: 'heading-2'
      } as CustomElement

    case 'heading-3':
      return {
        ...baseBlock,
        type: 'heading-3'
      } as CustomElement

    case 'heading-4':
      return {
        ...baseBlock,
        type: 'heading-4'
      } as CustomElement

    case 'heading-5':
      return {
        ...baseBlock,
        type: 'heading-5'
      } as CustomElement

    case 'heading-6':
      return {
        ...baseBlock,
        type: 'heading-6'
      } as CustomElement

    case 'bulleted-list':
      return {
        ...baseBlock,
        type: 'bulleted-list'
      } as CustomElement

    case 'numbered-list':
      return {
        ...baseBlock,
        type: 'numbered-list'
      } as CustomElement

    case 'todo-list':
      return {
        ...baseBlock,
        type: 'todo-list',
        checked: false
      } as CustomElement

    case 'quote':
      return {
        ...baseBlock,
        type: 'quote'
      } as CustomElement

    case 'code':
      return {
        ...baseBlock,
        type: 'code',
        language: 'javascript'
      } as CustomElement

    case 'divider':
      return {
        ...baseBlock,
        type: 'divider',
        children: [{ text: '' }]
      } as CustomElement

    case 'video':
      return {
        ...baseBlock,
        type: 'video',
        url: '',
        controls: true,
        children: [{ text: '' }]
      } as CustomElement

    case 'audio':
      return {
        ...baseBlock,
        type: 'audio',
        url: '',
        controls: true,
        children: [{ text: '' }]
      } as CustomElement

    case 'file':
      return {
        ...baseBlock,
        type: 'file',
        url: '',
        filename: '未命名文件',
        children: [{ text: '' }]
      } as CustomElement

    case 'callout':
      return {
        ...baseBlock,
        type: 'callout',
        icon: '💡',
        color: 'info'
      } as CustomElement

    case 'toggle':
      return {
        ...baseBlock,
        type: 'toggle',
        title: '点击展开',
        isOpen: false
      } as CustomElement

    case 'columns':
      return {
        ...baseBlock,
        type: 'columns',
        columnCount: 2,
        columnGap: 16
      } as CustomElement

    case 'embed':
      return {
        ...baseBlock,
        type: 'embed',
        url: '',
        embedType: 'custom',
        width: 800,
        height: 400,
        children: [{ text: '' }]
      } as CustomElement

    case 'math':
      return {
        ...baseBlock,
        type: 'math',
        formula: 'E = mc^2',
        inline: false,
        children: [{ text: '' }]
      } as CustomElement

    case 'mermaid':
      return {
        ...baseBlock,
        type: 'mermaid',
        chart: 'graph TD\n    A[开始] --> B[结束]',
        theme: 'default',
        children: [{ text: '' }]
      } as CustomElement

    default:
      return {
        ...baseBlock,
        type: 'paragraph'
      } as CustomElement
  }
}

// 检查是否为空块
export const isEmptyBlock = (element: CustomElement): boolean => {
  if (!element.children || element.children.length === 0) {
    return true
  }

  return element.children.every(child => {
    if ('text' in child) {
      return child.text.trim() === ''
    }
    return false
  })
}

// 获取块的文本内容
export const getBlockText = (element: CustomElement): string => {
  if (!element.children) return ''
  
  return element.children
    .map(child => {
      if ('text' in child) {
        return child.text
      }
      return ''
    })
    .join('')
}

// 检查块是否可以包含其他块
export const canContainBlocks = (type: string): boolean => {
  return ['toggle', 'callout'].indexOf(type) !== -1
}

// 检查块是否为内联块
export const isInlineBlock = (type: string): boolean => {
  return ['divider'].indexOf(type) !== -1
}

// 获取块的显示标题
export const getBlockTitle = (element: CustomElement): string => {
  const text = getBlockText(element)
  
  if (text.trim()) {
    return text.length > 50 ? text.substring(0, 50) + '...' : text
  }

  switch (element.type) {
    case 'paragraph':
      return '段落'
    case 'heading-1':
      return '标题 1'
    case 'heading-2':
      return '标题 2'
    case 'heading-3':
      return '标题 3'
    case 'heading-4':
      return '标题 4'
    case 'heading-5':
      return '标题 5'
    case 'heading-6':
      return '标题 6'
    case 'bulleted-list':
      return '无序列表'
    case 'numbered-list':
      return '有序列表'
    case 'todo-list':
      return '待办列表'
    case 'quote':
      return '引用'
    case 'code':
      return '代码块'
    case 'divider':
      return '分割线'
    case 'image':
      return '图片'
    case 'video':
      return '视频'
    case 'audio':
      return '音频'
    case 'file':
      return '文件'
    case 'table':
      return '表格'
    case 'callout':
      return '标注'
    case 'toggle':
      return (element as any).title || '折叠块'
    case 'columns':
      return '分栏'
    case 'embed':
      return '嵌入'
    case 'math':
      return '数学公式'
    case 'mermaid':
      return 'Mermaid图表'
    default:
      return '未知块'
  }
}

// 获取块的层级
export const getBlockLevel = (element: CustomElement): number => {
  switch (element.type) {
    case 'heading-1':
      return 1
    case 'heading-2':
      return 2
    case 'heading-3':
      return 3
    case 'heading-4':
      return 4
    case 'heading-5':
      return 5
    case 'heading-6':
      return 6
    default:
      return 0
  }
}

// 序列化为纯文本
export const serializeToText = (nodes: Descendant[]): string => {
  return nodes
    .map(node => {
      if ('type' in node) {
        const element = node as CustomElement
        return getBlockText(element)
      }
      return ''
    })
    .join('\n')
}

// 序列化为Markdown
export const serializeToMarkdown = (nodes: Descendant[]): string => {
  return nodes
    .map(node => {
      if ('type' in node) {
        const element = node as CustomElement
        const text = getBlockText(element)
        
        switch (element.type) {
          case 'heading-1':
            return `# ${text}`
          case 'heading-2':
            return `## ${text}`
          case 'heading-3':
            return `### ${text}`
          case 'bulleted-list':
            return `- ${text}`
          case 'numbered-list':
            return `1. ${text}`
          case 'quote':
            return `> ${text}`
          case 'code':
            return `\`\`\`\n${text}\n\`\`\``
          case 'divider':
            return '---'
          default:
            return text
        }
      }
      return ''
    })
    .join('\n\n')
}
