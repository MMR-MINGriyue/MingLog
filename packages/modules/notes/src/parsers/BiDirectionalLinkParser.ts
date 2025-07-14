/**
 * 双向链接语法解析器
 * 
 * 功能：
 * - 解析 [[页面名]] 语法
 * - 提取页面名称和链接信息
 * - 支持嵌套和复杂链接格式
 * - 提供链接验证和自动补全支持
 */

export interface LinkMatch {
  /** 完整匹配的文本 */
  fullMatch: string
  /** 页面名称 */
  pageName: string
  /** 显示文本（如果与页面名不同） */
  displayText?: string
  /** 在原文本中的起始位置 */
  startIndex: number
  /** 在原文本中的结束位置 */
  endIndex: number
  /** 链接类型 */
  type: 'page' | 'alias'
}

export interface ParseResult {
  /** 原始文本 */
  originalText: string
  /** 解析出的链接 */
  links: LinkMatch[]
  /** 处理后的文本（链接被替换为占位符） */
  processedText: string
  /** 是否包含有效链接 */
  hasLinks: boolean
}

export class BiDirectionalLinkParser {
  // 双向链接的正则表达式
  // 支持格式：[[页面名]]、[[页面名|显示文本]]
  private static readonly LINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

  // 页面名称验证规则
  private static readonly PAGE_NAME_REGEX = /^[^<>:"/\\|?*\x00-\x1f]+$/
  
  // 最大页面名称长度
  private static readonly MAX_PAGE_NAME_LENGTH = 255

  /**
   * 解析文本中的双向链接
   * @param text 要解析的文本
   * @returns 解析结果
   */
  static parse(text: string): ParseResult {
    if (!text || typeof text !== 'string') {
      return {
        originalText: text || '',
        links: [],
        processedText: text || '',
        hasLinks: false
      }
    }

    const links: LinkMatch[] = []
    let processedText = text
    let match: RegExpExecArray | null

    // 重置正则表达式的lastIndex
    this.LINK_REGEX.lastIndex = 0

    while ((match = this.LINK_REGEX.exec(text)) !== null) {
      const [fullMatch, pageName, displayText] = match
      const startIndex = match.index
      const endIndex = startIndex + fullMatch.length

      // 验证页面名称
      if (this.isValidPageName(pageName)) {
        const linkMatch: LinkMatch = {
          fullMatch,
          pageName: pageName.trim(),
          displayText: displayText?.trim(),
          startIndex,
          endIndex,
          type: displayText ? 'alias' : 'page'
        }

        links.push(linkMatch)
      }
    }

    // 生成处理后的文本（将链接替换为占位符）
    if (links.length > 0) {
      processedText = this.replaceLinksWithPlaceholders(text, links)
    }

    return {
      originalText: text,
      links,
      processedText,
      hasLinks: links.length > 0
    }
  }

  /**
   * 提取文本中的所有页面名称
   * @param text 要解析的文本
   * @returns 页面名称数组（去重）
   */
  static extractPageNames(text: string): string[] {
    const parseResult = this.parse(text)
    const pageNames = parseResult.links.map(link => link.pageName)
    return [...new Set(pageNames)] // 去重
  }

  /**
   * 检查文本是否包含双向链接
   * @param text 要检查的文本
   * @returns 是否包含链接
   */
  static hasLinks(text: string): boolean {
    if (!text) return false
    this.LINK_REGEX.lastIndex = 0
    return this.LINK_REGEX.test(text)
  }

  /**
   * 验证页面名称是否有效
   * @param pageName 页面名称
   * @returns 是否有效
   */
  static isValidPageName(pageName: string): boolean {
    if (!pageName || typeof pageName !== 'string') {
      return false
    }

    const trimmedName = pageName.trim()
    
    // 检查长度
    if (trimmedName.length === 0 || trimmedName.length > this.MAX_PAGE_NAME_LENGTH) {
      return false
    }

    // 检查字符规则
    if (!this.PAGE_NAME_REGEX.test(trimmedName)) {
      return false
    }

    return true
  }

  /**
   * 创建双向链接语法
   * @param pageName 页面名称
   * @param displayText 显示文本（可选）
   * @returns 链接语法字符串
   */
  static createLink(pageName: string, displayText?: string): string {
    if (!this.isValidPageName(pageName)) {
      throw new Error(`Invalid page name: ${pageName}`)
    }

    const trimmedPageName = pageName.trim()
    const trimmedDisplayText = displayText?.trim()

    if (trimmedDisplayText && trimmedDisplayText !== trimmedPageName) {
      return `[[${trimmedPageName}|${trimmedDisplayText}]]`
    }

    return `[[${trimmedPageName}]]`
  }

  /**
   * 替换文本中的链接为占位符
   * @param text 原始文本
   * @param links 链接信息
   * @returns 处理后的文本
   */
  private static replaceLinksWithPlaceholders(text: string, links: LinkMatch[]): string {
    let result = text
    let offset = 0

    // 按位置排序，从后往前替换以避免位置偏移问题
    const sortedLinks = [...links].sort((a, b) => b.startIndex - a.startIndex)

    for (const link of sortedLinks) {
      const placeholder = `__LINK_${link.pageName.replace(/\s+/g, '_')}_${Date.now()}__`
      const before = result.substring(0, link.startIndex)
      const after = result.substring(link.endIndex)
      result = before + placeholder + after
    }

    return result
  }

  /**
   * 查找可能的链接位置（用于自动补全）
   * @param text 文本
   * @param cursorPosition 光标位置
   * @returns 可能的链接信息
   */
  static findPotentialLink(text: string, cursorPosition: number): {
    isInLink: boolean
    linkStart?: number
    linkEnd?: number
    partialPageName?: string
  } {
    if (!text || cursorPosition < 0 || cursorPosition > text.length) {
      return { isInLink: false }
    }

    // 查找光标前的 [[
    let linkStart = -1
    for (let i = cursorPosition - 1; i >= 0; i--) {
      if (text.substring(i, i + 2) === '[[') {
        linkStart = i
        break
      }
      if (text[i] === ']' || text[i] === '\n') {
        break
      }
    }

    if (linkStart === -1) {
      return { isInLink: false }
    }

    // 查找光标后的 ]]
    let linkEnd = -1
    for (let i = cursorPosition; i < text.length - 1; i++) {
      if (text.substring(i, i + 2) === ']]') {
        linkEnd = i + 2
        break
      }
      if (text[i] === '[' || text[i] === '\n') {
        break
      }
    }

    // 提取部分页面名称
    const partialText = text.substring(linkStart + 2, cursorPosition)
    const pipeIndex = partialText.indexOf('|')
    const partialPageName = pipeIndex >= 0 ? partialText.substring(0, pipeIndex) : partialText

    return {
      isInLink: true,
      linkStart,
      linkEnd: linkEnd > 0 ? linkEnd : undefined,
      partialPageName: partialPageName.trim()
    }
  }

  /**
   * 生成链接建议（用于自动补全）
   * @param partialPageName 部分页面名称
   * @param availablePages 可用页面列表
   * @param maxSuggestions 最大建议数量
   * @returns 建议列表
   */
  static generateSuggestions(
    partialPageName: string,
    availablePages: string[],
    maxSuggestions: number = 10
  ): string[] {
    if (!partialPageName || !availablePages.length) {
      return []
    }

    const query = partialPageName.toLowerCase()
    const suggestions: { page: string; score: number }[] = []

    for (const page of availablePages) {
      const pageLower = page.toLowerCase()
      let score = 0

      // 精确匹配得分最高
      if (pageLower === query) {
        score = 1000
      }
      // 开头匹配
      else if (pageLower.startsWith(query)) {
        score = 500 + (query.length / page.length) * 100
      }
      // 包含匹配
      else if (pageLower.includes(query)) {
        score = 100 + (query.length / page.length) * 50
      }

      if (score > 0) {
        suggestions.push({ page, score })
      }
    }

    // 按分数排序并返回
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions)
      .map(s => s.page)
  }
}

export default BiDirectionalLinkParser
