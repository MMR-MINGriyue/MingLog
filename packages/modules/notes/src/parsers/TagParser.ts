/**
 * 标签解析器
 * 
 * 功能：
 * - 从文本中提取标签
 * - 智能标签建议
 * - 标签格式验证
 * - 标签自动补全
 */

export interface ExtractedTag {
  /** 标签名称 */
  name: string
  /** 在文本中的位置 */
  position: {
    start: number
    end: number
  }
  /** 标签类型 */
  type: 'hashtag' | 'mention' | 'keyword' | 'category'
  /** 置信度 */
  confidence: number
  /** 建议来源 */
  source: 'explicit' | 'content' | 'frequency' | 'similarity'
}

export interface TagSuggestionOptions {
  /** 最大建议数量 */
  maxSuggestions?: number
  /** 最小置信度 */
  minConfidence?: number
  /** 是否包含现有标签 */
  includeExisting?: boolean
  /** 现有标签列表 */
  existingTags?: string[]
  /** 是否启用智能建议 */
  enableSmartSuggestions?: boolean
}

export interface TagValidationResult {
  /** 是否有效 */
  isValid: boolean
  /** 错误信息 */
  errors: string[]
  /** 警告信息 */
  warnings: string[]
  /** 建议的修正 */
  suggestions: string[]
}

export class TagParser {
  private static readonly TAG_PATTERNS = {
    // #标签 格式
    hashtag: /#([a-zA-Z0-9\u4e00-\u9fff_-]+)/g,
    // @提及 格式
    mention: /@([a-zA-Z0-9\u4e00-\u9fff_-]+)/g,
    // 标签: 格式
    colonTag: /标签[:：]\s*([^\s,，;；]+)/g,
    // 分类: 格式
    category: /分类[:：]\s*([^\s,，;；]+)/g
  }

  private static readonly KEYWORD_PATTERNS = [
    // 技术相关
    /\b(JavaScript|TypeScript|React|Vue|Angular|Node\.js|Python|Java|C\+\+|Go|Rust)\b/gi,
    // 工作相关
    /\b(项目|任务|会议|计划|目标|deadline|需求|bug|测试)\b/gi,
    // 学习相关
    /\b(学习|教程|笔记|总结|复习|考试|课程|培训)\b/gi,
    // 生活相关
    /\b(健康|运动|旅行|美食|电影|音乐|读书|购物)\b/gi
  ]

  /**
   * 从文本中提取标签
   */
  static extractTags(text: string, options: TagSuggestionOptions = {}): ExtractedTag[] {
    const tags: ExtractedTag[] = []
    
    if (!text || typeof text !== 'string') {
      return tags
    }

    // 提取显式标签（#标签）
    tags.push(...this.extractHashtags(text))
    
    // 提取提及标签（@标签）
    tags.push(...this.extractMentions(text))
    
    // 提取冒号标签（标签: 内容）
    tags.push(...this.extractColonTags(text))
    
    // 提取分类标签
    tags.push(...this.extractCategoryTags(text))
    
    // 提取关键词标签
    if (options.enableSmartSuggestions) {
      tags.push(...this.extractKeywordTags(text))
    }

    // 过滤和排序
    return this.filterAndSortTags(tags, options)
  }

  /**
   * 提取#标签
   */
  private static extractHashtags(text: string): ExtractedTag[] {
    const tags: ExtractedTag[] = []
    let match: RegExpExecArray | null

    this.TAG_PATTERNS.hashtag.lastIndex = 0
    while ((match = this.TAG_PATTERNS.hashtag.exec(text)) !== null) {
      tags.push({
        name: match[1],
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        type: 'hashtag',
        confidence: 0.9,
        source: 'explicit'
      })
    }

    return tags
  }

  /**
   * 提取@提及
   */
  private static extractMentions(text: string): ExtractedTag[] {
    const tags: ExtractedTag[] = []
    let match: RegExpExecArray | null

    this.TAG_PATTERNS.mention.lastIndex = 0
    while ((match = this.TAG_PATTERNS.mention.exec(text)) !== null) {
      tags.push({
        name: match[1],
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        type: 'mention',
        confidence: 0.8,
        source: 'explicit'
      })
    }

    return tags
  }

  /**
   * 提取冒号标签
   */
  private static extractColonTags(text: string): ExtractedTag[] {
    const tags: ExtractedTag[] = []
    let match: RegExpExecArray | null

    this.TAG_PATTERNS.colonTag.lastIndex = 0
    while ((match = this.TAG_PATTERNS.colonTag.exec(text)) !== null) {
      // 分割多个标签（用逗号、分号分隔）
      const tagNames = match[1].split(/[,，;；]/).map(name => name.trim()).filter(name => name)
      
      tagNames.forEach(name => {
        tags.push({
          name,
          position: {
            start: match!.index,
            end: match!.index + match![0].length
          },
          type: 'keyword',
          confidence: 0.7,
          source: 'explicit'
        })
      })
    }

    return tags
  }

  /**
   * 提取分类标签
   */
  private static extractCategoryTags(text: string): ExtractedTag[] {
    const tags: ExtractedTag[] = []
    let match: RegExpExecArray | null

    this.TAG_PATTERNS.category.lastIndex = 0
    while ((match = this.TAG_PATTERNS.category.exec(text)) !== null) {
      tags.push({
        name: match[1],
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        type: 'category',
        confidence: 0.8,
        source: 'explicit'
      })
    }

    return tags
  }

  /**
   * 提取关键词标签
   */
  private static extractKeywordTags(text: string): ExtractedTag[] {
    const tags: ExtractedTag[] = []

    this.KEYWORD_PATTERNS.forEach(pattern => {
      let match: RegExpExecArray | null
      pattern.lastIndex = 0
      
      while ((match = pattern.exec(text)) !== null) {
        tags.push({
          name: match[0].toLowerCase(),
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          type: 'keyword',
          confidence: 0.6,
          source: 'content'
        })
      }
    })

    return tags
  }

  /**
   * 过滤和排序标签
   */
  private static filterAndSortTags(tags: ExtractedTag[], options: TagSuggestionOptions): ExtractedTag[] {
    const maxSuggestions = options.maxSuggestions || 20
    const minConfidence = options.minConfidence || 0.5
    const existingTags = new Set(options.existingTags || [])

    // 去重和过滤
    const uniqueTags = new Map<string, ExtractedTag>()
    
    tags.forEach(tag => {
      const normalizedName = tag.name.toLowerCase().trim()
      
      // 跳过空标签
      if (!normalizedName) return
      
      // 跳过置信度过低的标签
      if (tag.confidence < minConfidence) return
      
      // 跳过已存在的标签（如果设置了不包含现有标签）
      if (!options.includeExisting && existingTags.has(normalizedName)) return
      
      // 保留置信度更高的标签
      const existing = uniqueTags.get(normalizedName)
      if (!existing || tag.confidence > existing.confidence) {
        uniqueTags.set(normalizedName, {
          ...tag,
          name: normalizedName
        })
      }
    })

    // 排序：按置信度降序，然后按类型优先级
    const typeOrder = { hashtag: 4, category: 3, mention: 2, keyword: 1 }
    
    return Array.from(uniqueTags.values())
      .sort((a, b) => {
        // 首先按置信度排序
        if (a.confidence !== b.confidence) {
          return b.confidence - a.confidence
        }
        // 然后按类型优先级排序
        return (typeOrder[b.type] || 0) - (typeOrder[a.type] || 0)
      })
      .slice(0, maxSuggestions)
  }

  /**
   * 验证标签名称
   */
  static validateTagName(name: string): TagValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    if (!name || typeof name !== 'string') {
      errors.push('标签名称不能为空')
      return { isValid: false, errors, warnings, suggestions }
    }

    const trimmedName = name.trim()

    // 检查长度
    if (trimmedName.length === 0) {
      errors.push('标签名称不能为空')
    } else if (trimmedName.length > 50) {
      errors.push('标签名称不能超过50个字符')
      suggestions.push(trimmedName.substring(0, 50))
    }

    // 检查特殊字符
    if (/[<>"/\\|?*]/.test(trimmedName)) {
      errors.push('标签名称不能包含特殊字符: < > " / \\ | ? *')
      suggestions.push(trimmedName.replace(/[<>"/\\|?*]/g, ''))
    }

    // 检查是否只包含空格
    if (trimmedName && !/\S/.test(trimmedName)) {
      errors.push('标签名称不能只包含空格')
    }

    // 警告：建议使用的格式
    if (trimmedName.includes(' ')) {
      warnings.push('建议使用下划线或连字符代替空格')
      suggestions.push(trimmedName.replace(/\s+/g, '_'))
    }

    if (/^[0-9]+$/.test(trimmedName)) {
      warnings.push('纯数字标签可能不够描述性')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  /**
   * 生成标签建议
   */
  static generateTagSuggestions(
    content: string, 
    existingTags: string[] = [],
    options: TagSuggestionOptions = {}
  ): string[] {
    const extractedTags = this.extractTags(content, {
      ...options,
      existingTags,
      enableSmartSuggestions: true
    })

    return extractedTags.map(tag => tag.name)
  }

  /**
   * 标准化标签名称
   */
  static normalizeTagName(name: string): string {
    if (!name || typeof name !== 'string') {
      return ''
    }

    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')  // 空格替换为下划线
      .replace(/[<>"/\\|?*]/g, '')  // 移除特殊字符
      .substring(0, 50)  // 限制长度
  }

  /**
   * 检查标签相似性
   */
  static calculateTagSimilarity(tag1: string, tag2: string): number {
    if (!tag1 || !tag2) return 0
    
    const normalized1 = this.normalizeTagName(tag1)
    const normalized2 = this.normalizeTagName(tag2)
    
    if (normalized1 === normalized2) return 1
    
    // 简单的编辑距离相似度
    const maxLength = Math.max(normalized1.length, normalized2.length)
    if (maxLength === 0) return 1
    
    const distance = this.levenshteinDistance(normalized1, normalized2)
    return 1 - distance / maxLength
  }

  /**
   * 计算编辑距离
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator  // substitution
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  /**
   * 从文本中移除标签标记
   */
  static removeTagMarkings(text: string): string {
    if (!text || typeof text !== 'string') {
      return ''
    }

    return text
      .replace(this.TAG_PATTERNS.hashtag, '$1')  // 移除#
      .replace(this.TAG_PATTERNS.mention, '$1')  // 移除@
      .replace(this.TAG_PATTERNS.colonTag, '')   // 移除标签:
      .replace(this.TAG_PATTERNS.category, '')   // 移除分类:
      .trim()
  }
}

export default TagParser
