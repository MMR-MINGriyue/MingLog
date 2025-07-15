// import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core' // 模块不存在，暂时注释
// import { ReactNodeViewRenderer } from '@tiptap/react' // 模块不存在，暂时注释

// 临时类型定义
const Node = {
  create: (options: any) => ({
    name: options.name,
    group: options.group,
    content: options.content,
    marks: options.marks,
    draggable: options.draggable,
    selectable: options.selectable,
    inline: options.inline,
    atom: options.atom,
    attrs: options.attrs || {},
    parseHTML: options.parseHTML || [],
    renderHTML: options.renderHTML || (() => []),
    addCommands: options.addCommands || (() => ({})),
    addKeyboardShortcuts: options.addKeyboardShortcuts || (() => ({})),
    addInputRules: options.addInputRules || (() => []),
    addNodeView: options.addNodeView || (() => ({})),
  })
}

const mergeAttributes = (...attrs: any[]) => Object.assign({}, ...attrs)

const nodeInputRule = () => ({})

const ReactNodeViewRenderer = (component: any) => (props: any) => component
import { LinkComponent } from '../components/LinkComponent'

export interface BidirectionalLinkOptions {
  HTMLAttributes: Record<string, any>
  onLinkClick?: (linkText: string, linkType: 'page' | 'block') => void
  onLinkCreate?: (linkText: string, linkType: 'page' | 'block') => Promise<boolean>
  getPageSuggestions?: (query: string) => Promise<string[]>
}

// declare module '@tiptap/core' { // 模块不存在，暂时注释
  interface Commands<ReturnType> {
    bidirectionalLink: {
      /**
       * 插入页面链接
       */
      insertPageLink: (pageName: string) => ReturnType
      /**
       * 插入块引用
       */
      insertBlockReference: (blockId: string) => ReturnType
      /**
       * 移除链接
       */
      removeLink: () => ReturnType
    }
  }
// } // 注释掉多余的括号

/**
 * TipTap双向链接扩展
 * 支持 [[页面名称]] 和 ((块ID)) 语法
 */
export const BidirectionalLink = Node.create<BidirectionalLinkOptions>({
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
      getPageSuggestions: undefined,
    }
  },

  addAttributes() {
    return {
      linkText: {
        default: '',
        parseHTML: element => element.getAttribute('data-link-text'),
        renderHTML: attributes => {
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
        parseHTML: element => element.getAttribute('data-link-type'),
        renderHTML: attributes => {
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
        parseHTML: element => element.getAttribute('data-exists') === 'true',
        renderHTML: attributes => {
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

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        {
          'data-type': 'bidirectional-link',
          class: 'bidirectional-link',
        },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkComponent)
  },

  addInputRules() {
    return [
      // 页面链接规则: [[页面名称]]
      nodeInputRule({
        find: /\[\[([^\]]+)\]\]$/,
        type: this.type,
        getAttributes: match => {
          const linkText = match[1]
          return {
            linkText,
            linkType: 'page',
            exists: true, // 默认假设存在，后续验证
          }
        },
      }),
      // 块引用规则: ((块ID))
      nodeInputRule({
        find: /\(\(([^)]+)\)\)$/,
        type: this.type,
        getAttributes: match => {
          const linkText = match[1]
          return {
            linkText,
            linkType: 'block',
            exists: true, // 默认假设存在，后续验证
          }
        },
      }),
    ]
  },

  addCommands() {
    return {
      insertPageLink:
        (pageName: string) =>
        ({ commands }) => {
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
        ({ commands }) => {
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
        ({ commands }) => {
          return commands.deleteSelection()
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      // Ctrl/Cmd + K 快速插入链接
      'Mod-k': () => {
        // 触发链接插入对话框
        const linkText = window.prompt('输入页面名称:')
        if (linkText) {
          return this.editor.commands.insertPageLink(linkText)
        }
        return false
      },
      // 在链接内按 Escape 退出链接
      Escape: ({ editor }) => {
        const { state } = editor
        const { selection } = state
        const node = state.doc.nodeAt(selection.from)
        
        if (node && node.type.name === this.name) {
          // 移动光标到链接后面
          return editor.commands.setTextSelection(selection.from + node.nodeSize)
        }
        return false
      },
    }
  },

  onCreate() {
    // 初始化时验证所有链接的存在性
    this.validateAllLinks()
  },

  onUpdate() {
    // 内容更新时重新验证链接
    this.validateAllLinks()
  },

  addMethods() {
    return {
      /**
       * 验证所有链接的存在性
       */
      validateAllLinks: () => {
        const { state } = this.editor
        const { doc } = state
        
        doc.descendants((node, pos) => {
          if (node.type.name === this.name) {
            const { linkText, linkType } = node.attrs
            this.validateLink(linkText, linkType, pos)
          }
        })
      },

      /**
       * 验证单个链接
       */
      validateLink: async (linkText: string, linkType: 'page' | 'block', pos: number) => {
        if (this.options.onLinkCreate) {
          try {
            const exists = await this.options.onLinkCreate(linkText, linkType)
            
            // 更新链接的存在状态
            this.editor.commands.updateAttributes(this.name, { exists }, { from: pos, to: pos + 1 })
          } catch (error) {
            console.error('Link validation failed:', error)
            this.editor.commands.updateAttributes(this.name, { exists: false }, { from: pos, to: pos + 1 })
          }
        }
      },

      /**
       * 获取所有链接
       */
      getAllLinks: () => {
        const links: Array<{ linkText: string; linkType: 'page' | 'block'; pos: number; exists: boolean }> = []
        const { state } = this.editor
        const { doc } = state
        
        doc.descendants((node, pos) => {
          if (node.type.name === this.name) {
            const { linkText, linkType, exists } = node.attrs
            links.push({ linkText, linkType, pos, exists })
          }
        })
        
        return links
      },
    }
  },
})
