/**
 * 块引用语法解析器
 * 
 * 功能：
 * - 解析 ((块ID)) 语法
 * - 提取块ID和引用信息
 * - 支持块引用验证和自动补全
 * - 与双向链接系统集成
 */

export interface BlockMatch {
  /** 完整匹配的文本 */
  fullMatch: string
  /** 块ID */
  blockId: string
  /** 在原文本中的起始位置 */
  startIndex: number
  /** 在原文本中的结束位置 */
  endIndex: number
  /** 引用类型 */
  type: 'block'
}

export interface BlockParseResult {
  /** 原始文本 */
  originalText: string
  /** 解析出的块引用 */
  blockReferences: BlockMatch[]
  /** 处理后的文本（块引用被替换为占位符） */
  processedText: string
  /** 是否包含有效块引用 */
  hasBlockReferences: boolean
}

export interface PotentialBlockReference {
  /** 是否在块引用中 */
  isInBlockReference: boolean
  /** 块引用开始位置 */
  blockStart?: number
  /** 块引用结束位置 */
  blockEnd?: number
  /** 部分块ID */
  partialBlockId?: string
}

export interface BlockSuggestion {
  /** 块ID */
  blockId: string
  /** 块内容预览 */
  preview: string
  /** 块类型 */
  blockType: 'paragraph' | 'heading' | 'list' | 'code' | 'quote'
  /** 所属页面 */
  pageName: string
  /** 匹配分数 */
  score: number
  /** 创建时间 */
  createdAt?: string
  /** 最后修改时间 */
  updatedAt?: string
}

export class BlockReferenceParser {
  // 块引用的正则表达式
  // 支持格式：((块ID))
  private static readonly BLOCK_REFERENCE_REGEX = /\(\(([^)]+)\)\)/g

  // 块ID验证规则
  // 块ID通常是UUID或者自定义的唯一标识符
  private static readonly BLOCK_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/
  
  // 最大块ID长度
  private static readonly MAX_BLOCK_ID_LENGTH = 64

  /**
   * 解析文本中的块引用
   * @param text 要解析的文本
   * @returns 解析结果
   */
  static parse(text: string): BlockParseResult {
    if (!text || typeof text !== 'string') {
      return {
        originalText: text || '',
        blockReferences: [],
        processedText: text || '',
        hasBlockReferences: false
      }
    }

    const blockReferences: BlockMatch[] = []
    let processedText = text
    let match: RegExpExecArray | null

    // 重置正则表达式的lastIndex
    this.BLOCK_REFERENCE_REGEX.lastIndex = 0

    while ((match = this.BLOCK_REFERENCE_REGEX.exec(text)) !== null) {
      const [fullMatch, blockId] = match
      const startIndex = match.index
      const endIndex = startIndex + fullMatch.length

      // 验证块ID
      if (this.isValidBlockId(blockId)) {
        const blockMatch: BlockMatch = {
          fullMatch,
          blockId: blockId.trim(),
          startIndex,
          endIndex,
          type: 'block'
        }

        blockReferences.push(blockMatch)
      }
    }

    // 生成处理后的文本（将块引用替换为占位符）
    if (blockReferences.length > 0) {
      processedText = this.replaceBlockReferencesWithPlaceholders(text, blockReferences)
    }

    return {
      originalText: text,
      blockReferences,
      processedText,
      hasBlockReferences: blockReferences.length > 0
    }
  }

  /**
   * 提取文本中的所有块ID
   * @param text 要解析的文本
   * @returns 块ID数组（去重）
   */
  static extractBlockIds(text: string): string[] {
    const parseResult = this.parse(text)
    const blockIds = parseResult.blockReferences.map(ref => ref.blockId)
    return [...new Set(blockIds)] // 去重
  }

  /**
   * 检查文本是否包含块引用
   * @param text 要检查的文本
   * @returns 是否包含块引用
   */
  static hasBlockReferences(text: string): boolean {
    if (!text) return false
    this.BLOCK_REFERENCE_REGEX.lastIndex = 0
    return this.BLOCK_REFERENCE_REGEX.test(text)
  }

  /**
   * 验证块ID是否有效
   * @param blockId 要验证的块ID
   * @returns 是否有效
   */
  static isValidBlockId(blockId: string): boolean {
    if (!blockId || typeof blockId !== 'string') {
      return false
    }

    const trimmed = blockId.trim()
    
    // 检查长度
    if (trimmed.length === 0 || trimmed.length > this.MAX_BLOCK_ID_LENGTH) {
      return false
    }

    // 检查格式
    return this.BLOCK_ID_REGEX.test(trimmed)
  }

  /**
   * 创建块引用语法
   * @param blockId 块ID
   * @returns 块引用语法字符串
   */
  static createBlockReference(blockId: string): string {
    if (!this.isValidBlockId(blockId)) {
      throw new Error(`Invalid block ID: ${blockId}`)
    }

    return `((${blockId.trim()}))`
  }

  /**
   * 查找光标位置的潜在块引用
   * @param text 文本内容
   * @param cursorPosition 光标位置
   * @returns 潜在块引用信息
   */
  static findPotentialBlockReference(text: string, cursorPosition: number): PotentialBlockReference {
    if (!text || cursorPosition < 0 || cursorPosition > text.length) {
      return { isInBlockReference: false }
    }

    // 查找光标前的 ((
    let blockStart = -1
    for (let i = cursorPosition - 1; i >= 0; i--) {
      if (text.substring(i, i + 2) === '((') {
        blockStart = i
        break
      }
      if (text[i] === ')' || text[i] === '\n') {
        break
      }
    }

    if (blockStart === -1) {
      return { isInBlockReference: false }
    }

    // 查找光标后的 ))
    let blockEnd = -1
    for (let i = cursorPosition; i < text.length - 1; i++) {
      if (text.substring(i, i + 2) === '))') {
        blockEnd = i + 2
        break
      }
      if (text[i] === '(' || text[i] === '\n') {
        break
      }
    }

    // 提取部分块ID
    const partialBlockId = text.substring(blockStart + 2, cursorPosition).trim()

    return {
      isInBlockReference: true,
      blockStart,
      blockEnd: blockEnd > 0 ? blockEnd : undefined,
      partialBlockId
    }
  }

  /**
   * 生成块引用建议
   * @param query 查询字符串
   * @param availableBlocks 可用的块列表
   * @param maxSuggestions 最大建议数量
   * @returns 建议列表
   */
  static generateSuggestions(
    query: string, 
    availableBlocks: BlockSuggestion[], 
    maxSuggestions: number = 10
  ): BlockSuggestion[] {
    if (!query || !availableBlocks.length) {
      return availableBlocks.slice(0, maxSuggestions)
    }

    const queryLower = query.toLowerCase()
    const suggestions: (BlockSuggestion & { score: number })[] = []

    for (const block of availableBlocks) {
      let score = 0
      const blockIdLower = block.blockId.toLowerCase()
      const previewLower = block.preview.toLowerCase()

      // 精确匹配块ID
      if (blockIdLower === queryLower) {
        score = 100
      }
      // 块ID前缀匹配
      else if (blockIdLower.startsWith(queryLower)) {
        score = 80
      }
      // 块ID包含匹配
      else if (blockIdLower.includes(queryLower)) {
        score = 60
      }
      // 预览内容匹配
      else if (previewLower.includes(queryLower)) {
        score = 40
      }
      // 页面名称匹配
      else if (block.pageName.toLowerCase().includes(queryLower)) {
        score = 20
      }

      if (score > 0) {
        suggestions.push({ ...block, score })
      }
    }

    // 按分数排序并返回
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions)
  }

  /**
   * 将块引用替换为占位符
   * @param text 原始文本
   * @param blockReferences 块引用列表
   * @returns 处理后的文本
   */
  private static replaceBlockReferencesWithPlaceholders(
    text: string, 
    blockReferences: BlockMatch[]
  ): string {
    let result = text
    let offset = 0

    for (const ref of blockReferences) {
      const placeholder = `[BLOCK_REF:${ref.blockId}]`
      const start = ref.startIndex + offset
      const end = ref.endIndex + offset
      
      result = result.substring(0, start) + placeholder + result.substring(end)
      offset += placeholder.length - ref.fullMatch.length
    }

    return result
  }

  /**
   * 统计块引用信息
   * @param text 文本内容
   * @returns 统计信息
   */
  static getBlockReferenceStats(text: string) {
    const parseResult = this.parse(text)
    const uniqueBlockIds = new Set(parseResult.blockReferences.map(ref => ref.blockId))

    return {
      totalReferences: parseResult.blockReferences.length,
      uniqueBlocks: uniqueBlockIds.size,
      hasReferences: parseResult.hasBlockReferences,
      blockIds: Array.from(uniqueBlockIds)
    }
  }
}

export default BlockReferenceParser
