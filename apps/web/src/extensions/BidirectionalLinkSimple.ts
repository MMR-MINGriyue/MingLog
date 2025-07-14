import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core'

export interface BidirectionalLinkOptions {
  HTMLAttributes: Record<string, any>
  onLinkClick?: (linkText: string, linkType: 'page' | 'block') => void
  onLinkCreate?: (linkText: string, linkType: 'page' | 'block') => Promise<boolean>
  getPageSuggestions?: (query: string) => Promise<string[]>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bidirectionalLink: {
      insertPageLink: (pageName: string) => ReturnType
      insertBlockReference: (blockId: string) => ReturnType
      removeLink: () => ReturnType
    }
  }
}

/**
 * 简化版双向链接扩展
 * 支持 [[页面名称]] 和 ((块ID)) 语法
 */
export const BidirectionalLinkSimple = Node.create<BidirectionalLinkOptions>({
  name: 'bidirectionalLink',

  group: 'inline',

  inline: true,

  selectable: false,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      onLinkClick: undefined,
      onLinkCreate: undefined,
    }
  },

  addAttributes() {
    return {
      linkText: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-link-text'),
        renderHTML: (attributes: any) => {
          if (!attributes.linkText) {
            return {}
          }
          return {
            'data-link-text': attributes.linkText,
          }
        },
      },
      linkType: {
        default: 'page',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-link-type'),
        renderHTML: (attributes: any) => {
          if (!attributes.linkType) {
            return {}
          }
          return {
            'data-link-type': attributes.linkType,
          }
        },
      },
      exists: {
        default: true,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-exists') === 'true',
        renderHTML: (attributes: any) => {
          return {
            'data-exists': attributes.exists ? 'true' : 'false',
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="bidirectional-link"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }: any) {
    return [
      'span',
      mergeAttributes(
        {
          'data-type': 'bidirectional-link',
          class: 'bidirectional-link inline-flex items-center px-2 py-1 rounded text-sm font-medium cursor-pointer transition-all duration-200 hover:shadow-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100',
        },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      ['span', { class: 'mr-1 text-xs opacity-60' }, HTMLAttributes.linkType === 'page' ? '📄' : '🔗'],
      ['span', { class: 'truncate max-w-xs' }, HTMLAttributes.linkText || ''],
      !HTMLAttributes.exists ? ['span', { class: 'ml-1 text-xs text-red-500', title: '链接目标不存在' }, '⚠️'] : '',
    ]
  },

  addInputRules() {
    return [
      // 页面链接规则: [[页面名称]]
      nodeInputRule({
        find: /\[\[([^\]]+)\]\]$/,
        type: this.type,
        getAttributes: (match: any) => {
          const linkText = match[1]
          return {
            linkText,
            linkType: 'page',
            exists: true,
          }
        },
      }),
      // 块引用规则: ((块ID))
      nodeInputRule({
        find: /\(\(([^)]+)\)\)$/,
        type: this.type,
        getAttributes: (match: any) => {
          const linkText = match[1]
          return {
            linkText,
            linkType: 'block',
            exists: true,
          }
        },
      }),
    ]
  },

  addCommands() {
    return {
      insertPageLink:
        (pageName: string) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              linkText: pageName,
              linkType: 'page',
              exists: true,
            },
          })
        },

      insertBlockReference:
        (blockId: string) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              linkText: blockId,
              linkType: 'block',
              exists: true,
            },
          })
        },

      removeLink:
        () =>
        ({ commands }: any) => {
          return commands.deleteSelection()
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      // Ctrl/Cmd + K 快速插入链接
      'Mod-k': () => {
        const linkText = window.prompt('输入页面名称:')
        if (linkText) {
          return this.editor.commands.insertPageLink(linkText)
        }
        return false
      },
    }
  },

  onCreate() {
    // 添加点击事件监听器
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const linkElement = target.closest('[data-type="bidirectional-link"]') as HTMLElement

      if (linkElement) {
        event.preventDefault()
        event.stopPropagation()

        const linkText = linkElement.getAttribute('data-link-text')
        const linkType = linkElement.getAttribute('data-link-type') as 'page' | 'block'

        if (linkText && this.options.onLinkClick) {
          this.options.onLinkClick(linkText, linkType)
        }
      }
    }

    this.editor.view.dom.addEventListener('click', handleClick)
    // 存储引用以便在销毁时移除
    this.storage.handleClick = handleClick
  },

  onDestroy() {
    // 移除事件监听器
    if (this.storage.handleClick) {
      this.editor.view.dom.removeEventListener('click', this.storage.handleClick)
    }
  },

  addMethods() {
    return {
      validateAllLinks: () => {
        const { state } = this.editor
        const { doc } = state

        doc.descendants((node: any) => {
          if (node.type.name === this.name) {
            const { linkText, linkType } = node.attrs
            this.validateLink(linkText, linkType)
          }
        })
      },

      validateLink: async (linkText: string, linkType: 'page' | 'block') => {
        if (this.options.onLinkCreate) {
          try {
            const exists = await this.options.onLinkCreate(linkText, linkType)

            // 更新链接的存在状态
            this.editor.commands.updateAttributes(this.name, { exists })
          } catch (error) {
            console.error('Link validation failed:', error)
            this.editor.commands.updateAttributes(this.name, { exists: false })
          }
        }
      },
    }
  },
})
