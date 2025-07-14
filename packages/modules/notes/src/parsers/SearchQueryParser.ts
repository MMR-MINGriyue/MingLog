/**
 * 搜索查询解析器
 * 
 * 功能：
 * - 解析复杂的搜索查询语法
 * - 支持高级搜索操作符
 * - 提取搜索过滤条件
 * - 查询验证和优化
 */

import { SearchQuery } from '../database/SearchDatabaseSchema'

export interface ParsedSearchQuery {
  /** 主要搜索词 */
  terms: string[]
  /** 精确短语 */
  phrases: string[]
  /** 必须包含的词 */
  required: string[]
  /** 必须排除的词 */
  excluded: string[]
  /** 标签过滤 */
  tags: string[]
  /** 类型过滤 */
  types: string[]
  /** 作者过滤 */
  authors: string[]
  /** 日期过滤 */
  dateRange?: {
    start?: string
    end?: string
  }
  /** 原始查询 */
  originalQuery: string
  /** 处理后的查询 */
  processedQuery: string
}

export interface SearchSyntax {
  /** 精确短语：用引号包围 */
  phrase: RegExp
  /** 必须包含：+ 前缀 */
  required: RegExp
  /** 必须排除：- 前缀 */
  excluded: RegExp
  /** 标签搜索：tag: 前缀 */
  tag: RegExp
  /** 类型搜索：type: 前缀 */
  type: RegExp
  /** 作者搜索：author: 前缀 */
  author: RegExp
  /** 日期搜索：date: 前缀 */
  date: RegExp
  /** 日期范围：date:start..end */
  dateRange: RegExp
}

export class SearchQueryParser {
  private static readonly SYNTAX: SearchSyntax = {
    phrase: /"([^"]+)"/g,
    required: /\+(\S+)/g,
    excluded: /-(\S+)/g,
    tag: /tag:(\S+)/g,
    type: /type:(\S+)/g,
    author: /author:(\S+)/g,
    date: /date:(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g,
    dateRange: /date:(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\.\.(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g
  }

  /**
   * 解析搜索查询字符串
   */
  static parse(queryString: string): ParsedSearchQuery {
    if (!queryString || typeof queryString !== 'string') {
      return this.createEmptyQuery(queryString || '')
    }

    const originalQuery = queryString.trim()
    let workingQuery = originalQuery

    const result: ParsedSearchQuery = {
      terms: [],
      phrases: [],
      required: [],
      excluded: [],
      tags: [],
      types: [],
      authors: [],
      originalQuery,
      processedQuery: ''
    }

    // 解析精确短语
    result.phrases = this.extractMatches(workingQuery, this.SYNTAX.phrase)
    workingQuery = this.removeMatches(workingQuery, this.SYNTAX.phrase)

    // 解析必须包含的词
    result.required = this.extractMatches(workingQuery, this.SYNTAX.required)
    workingQuery = this.removeMatches(workingQuery, this.SYNTAX.required)

    // 解析必须排除的词
    result.excluded = this.extractMatches(workingQuery, this.SYNTAX.excluded)
    workingQuery = this.removeMatches(workingQuery, this.SYNTAX.excluded)

    // 解析标签
    result.tags = this.extractMatches(workingQuery, this.SYNTAX.tag)
    workingQuery = this.removeMatches(workingQuery, this.SYNTAX.tag)

    // 解析类型
    result.types = this.extractMatches(workingQuery, this.SYNTAX.type)
    workingQuery = this.removeMatches(workingQuery, this.SYNTAX.type)

    // 解析作者
    result.authors = this.extractMatches(workingQuery, this.SYNTAX.author)
    workingQuery = this.removeMatches(workingQuery, this.SYNTAX.author)

    // 先解析日期范围（优先级更高）
    const dateRangeMatches = this.extractDateRanges(workingQuery)
    if (dateRangeMatches.length > 0) {
      result.dateRange = dateRangeMatches[0]
      workingQuery = this.removeMatches(workingQuery, this.SYNTAX.dateRange)
    } else {
      // 解析单个日期
      const dateMatches = this.extractMatches(workingQuery, this.SYNTAX.date)
      if (dateMatches.length > 0) {
        result.dateRange = { start: dateMatches[0], end: dateMatches[0] }
        workingQuery = this.removeMatches(workingQuery, this.SYNTAX.date)
      }
    }

    // 剩余的词作为普通搜索词
    result.terms = this.extractTerms(workingQuery)

    // 生成处理后的查询
    result.processedQuery = this.buildProcessedQuery(result)

    return result
  }

  /**
   * 将解析结果转换为SearchQuery对象
   */
  static toSearchQuery(parsed: ParsedSearchQuery, options: Partial<SearchQuery> = {}): SearchQuery {
    return {
      query: parsed.processedQuery,
      types: parsed.types.length > 0 ? parsed.types : options.types,
      tags: parsed.tags.length > 0 ? parsed.tags : options.tags,
      authors: parsed.authors.length > 0 ? parsed.authors : options.authors,
      date_range: parsed.dateRange || options.date_range,
      sort_by: options.sort_by || 'relevance',
      sort_order: options.sort_order || 'desc',
      limit: options.limit || 20,
      offset: options.offset || 0,
      page_ids: options.page_ids
    }
  }

  /**
   * 验证搜索查询
   */
  static validate(queryString: string): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    if (!queryString || queryString.trim().length === 0) {
      errors.push('搜索查询不能为空')
      return { isValid: false, errors, warnings }
    }

    if (queryString.length > 1000) {
      errors.push('搜索查询过长，请限制在1000字符以内')
    }

    // 检查引号匹配
    const quoteCount = (queryString.match(/"/g) || []).length
    if (quoteCount % 2 !== 0) {
      warnings.push('引号不匹配，可能影响精确短语搜索')
    }

    // 检查是否有有效的搜索内容
    const parsed = this.parse(queryString)
    const hasContent = parsed.terms.length > 0 || 
                      parsed.phrases.length > 0 || 
                      parsed.required.length > 0

    if (!hasContent) {
      warnings.push('搜索查询中没有有效的搜索词')
    }

    // 检查日期格式
    if (parsed.dateRange) {
      if (parsed.dateRange.start && !this.isValidDate(parsed.dateRange.start)) {
        errors.push(`无效的开始日期格式: ${parsed.dateRange.start}`)
      }
      if (parsed.dateRange.end && !this.isValidDate(parsed.dateRange.end)) {
        errors.push(`无效的结束日期格式: ${parsed.dateRange.end}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 生成搜索建议
   */
  static generateSuggestions(queryString: string): string[] {
    const suggestions: string[] = []
    const parsed = this.parse(queryString)

    // 如果没有搜索词，建议添加一些
    if (parsed.terms.length === 0 && parsed.phrases.length === 0) {
      suggestions.push('尝试添加一些搜索关键词')
    }

    // 建议使用高级语法
    if (parsed.terms.length > 1 && parsed.phrases.length === 0) {
      suggestions.push('使用引号进行精确短语搜索，如 "完整短语"')
    }

    if (parsed.required.length === 0 && parsed.terms.length > 0) {
      suggestions.push('使用 + 前缀指定必须包含的词，如 +重要')
    }

    if (parsed.excluded.length === 0) {
      suggestions.push('使用 - 前缀排除不需要的词，如 -草稿')
    }

    if (parsed.tags.length === 0) {
      suggestions.push('使用 tag: 搜索特定标签，如 tag:工作')
    }

    if (parsed.types.length === 0) {
      suggestions.push('使用 type: 搜索特定类型，如 type:note')
    }

    return suggestions
  }

  /**
   * 提取匹配项
   */
  private static extractMatches(text: string, regex: RegExp): string[] {
    const matches: string[] = []
    let match: RegExpExecArray | null

    // 重置正则表达式的lastIndex
    regex.lastIndex = 0

    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1])
    }

    return matches
  }

  /**
   * 提取日期范围
   */
  private static extractDateRanges(text: string): Array<{ start: string; end: string }> {
    const ranges: Array<{ start: string; end: string }> = []
    let match: RegExpExecArray | null

    this.SYNTAX.dateRange.lastIndex = 0

    while ((match = this.SYNTAX.dateRange.exec(text)) !== null) {
      ranges.push({
        start: match[1],
        end: match[2]
      })
    }

    return ranges
  }

  /**
   * 移除匹配项
   */
  private static removeMatches(text: string, regex: RegExp): string {
    return text.replace(regex, '').trim()
  }

  /**
   * 提取普通搜索词
   */
  private static extractTerms(text: string): string[] {
    return text
      .split(/\s+/)
      .filter(term => term.length > 0)
      .map(term => term.trim())
  }

  /**
   * 构建处理后的查询
   */
  private static buildProcessedQuery(parsed: ParsedSearchQuery): string {
    const parts: string[] = []

    // 添加普通搜索词
    if (parsed.terms.length > 0) {
      parts.push(parsed.terms.join(' '))
    }

    // 添加精确短语
    parsed.phrases.forEach(phrase => {
      parts.push(`"${phrase}"`)
    })

    // 添加必须包含的词
    parsed.required.forEach(term => {
      parts.push(`+${term}`)
    })

    // 添加必须排除的词
    parsed.excluded.forEach(term => {
      parts.push(`-${term}`)
    })

    return parts.join(' ').trim()
  }

  /**
   * 创建空查询对象
   */
  private static createEmptyQuery(originalQuery: string): ParsedSearchQuery {
    return {
      terms: [],
      phrases: [],
      required: [],
      excluded: [],
      tags: [],
      types: [],
      authors: [],
      originalQuery,
      processedQuery: ''
    }
  }

  /**
   * 验证日期格式
   */
  private static isValidDate(dateString: string): boolean {
    // 支持的日期格式：YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
    const dateRegex = /^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/

    if (!dateRegex.test(dateString)) {
      return false
    }

    // 尝试解析日期
    const normalizedDate = dateString.replace(/[\/\.]/g, '-')
    try {
      const date = new Date(normalizedDate)
      return !isNaN(date.getTime())
    } catch {
      return false
    }
  }
}

/**
 * 搜索查询构建器
 */
export class SearchQueryBuilder {
  private query: Partial<SearchQuery> = {}

  /**
   * 设置搜索关键词
   */
  withQuery(queryString: string): this {
    this.query.query = queryString
    return this
  }

  /**
   * 设置文档类型过滤
   */
  withTypes(...types: string[]): this {
    this.query.types = types
    return this
  }

  /**
   * 设置标签过滤
   */
  withTags(...tags: string[]): this {
    this.query.tags = tags
    return this
  }

  /**
   * 设置页面ID过滤
   */
  withPageIds(...pageIds: string[]): this {
    this.query.page_ids = pageIds
    return this
  }

  /**
   * 设置日期范围过滤
   */
  withDateRange(start?: string, end?: string): this {
    this.query.date_range = { start, end }
    return this
  }

  /**
   * 设置作者过滤
   */
  withAuthors(...authors: string[]): this {
    this.query.authors = authors
    return this
  }

  /**
   * 设置排序方式
   */
  sortBy(field: 'relevance' | 'created_at' | 'updated_at' | 'title', order: 'asc' | 'desc' = 'desc'): this {
    this.query.sort_by = field
    this.query.sort_order = order
    return this
  }

  /**
   * 设置分页
   */
  paginate(limit: number, offset: number = 0): this {
    this.query.limit = limit
    this.query.offset = offset
    return this
  }

  /**
   * 构建查询对象
   */
  build(): SearchQuery {
    if (!this.query.query) {
      throw new Error('搜索查询不能为空')
    }

    return {
      query: this.query.query,
      types: this.query.types,
      tags: this.query.tags,
      page_ids: this.query.page_ids,
      date_range: this.query.date_range,
      authors: this.query.authors,
      sort_by: this.query.sort_by || 'relevance',
      sort_order: this.query.sort_order || 'desc',
      limit: this.query.limit || 20,
      offset: this.query.offset || 0
    }
  }
}

export default SearchQueryParser
