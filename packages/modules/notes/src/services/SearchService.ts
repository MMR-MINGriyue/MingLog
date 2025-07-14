/**
 * 搜索服务
 * 
 * 功能：
 * - 全文搜索实现
 * - 搜索结果排序和过滤
 * - 搜索历史管理
 * - 搜索建议生成
 * - 搜索性能优化
 */

import { Database } from 'sqlite3'
import { 
  SearchDocument, 
  SearchQuery, 
  SearchResult, 
  SearchStats,
  SearchDatabaseSchema 
} from '../database/SearchDatabaseSchema'

export interface SearchServiceConfig {
  /** 数据库连接 */
  database: Database
  /** 默认搜索限制 */
  defaultLimit?: number
  /** 最大搜索限制 */
  maxLimit?: number
  /** 搜索超时时间（毫秒） */
  searchTimeout?: number
  /** 是否启用搜索历史 */
  enableHistory?: boolean
  /** 是否启用搜索建议 */
  enableSuggestions?: boolean
}

export class SearchService {
  private db: Database
  private config: Required<SearchServiceConfig>

  constructor(config: SearchServiceConfig) {
    this.db = config.database
    this.config = {
      defaultLimit: 20,
      maxLimit: 100,
      searchTimeout: 5000,
      enableHistory: true,
      enableSuggestions: true,
      ...config
    }
  }

  /**
   * 执行全文搜索
   */
  async search(query: SearchQuery): Promise<{
    results: SearchResult[]
    stats: SearchStats
  }> {
    const startTime = Date.now()
    
    try {
      // 预处理搜索查询
      const processedQuery = this.preprocessQuery(query.query)
      if (!processedQuery.trim()) {
        return {
          results: [],
          stats: {
            total_count: 0,
            search_time: Date.now() - startTime,
            type_counts: {},
            suggestions: []
          }
        }
      }

      // 构建搜索参数
      const searchParams = this.buildSearchParams(query, processedQuery)
      
      // 执行搜索
      const results = await this.executeSearch(searchParams)
      
      // 生成搜索统计
      const stats = await this.generateSearchStats(processedQuery, results, startTime)
      
      // 记录搜索历史
      if (this.config.enableHistory) {
        await this.recordSearchHistory(query, results.length, Date.now() - startTime)
      }

      // 生成高亮结果
      const highlightedResults = await this.generateHighlights(results, processedQuery)

      return {
        results: highlightedResults,
        stats
      }
    } catch (error) {
      console.error('Search error:', error)
      throw new Error(`搜索失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取搜索建议
   */
  async getSuggestions(partialQuery: string, limit: number = 10): Promise<string[]> {
    if (!this.config.enableSuggestions || !partialQuery.trim()) {
      return []
    }

    return new Promise((resolve, reject) => {
      const queries = SearchDatabaseSchema.getSearchQueries()
      
      this.db.all(
        queries.searchSuggestions,
        [partialQuery.trim(), limit],
        (err, rows: any[]) => {
          if (err) {
            reject(err)
            return
          }
          
          const suggestions = rows.map(row => row.suggestion)
          resolve(suggestions)
        }
      )
    })
  }

  /**
   * 获取热门搜索
   */
  async getPopularSearches(limit: number = 10): Promise<Array<{
    query: string
    total_searches: number
    last_searched_at: string
  }>> {
    return new Promise((resolve, reject) => {
      const queries = SearchDatabaseSchema.getSearchQueries()
      
      this.db.all(
        queries.popularSearches,
        [limit],
        (err, rows: any[]) => {
          if (err) {
            reject(err)
            return
          }
          resolve(rows)
        }
      )
    })
  }

  /**
   * 获取搜索历史
   */
  async getSearchHistory(userId?: string, limit: number = 20): Promise<Array<{
    query: string
    result_count: number
    search_time: number
    created_at: string
  }>> {
    return new Promise((resolve, reject) => {
      const queries = SearchDatabaseSchema.getSearchQueries()
      
      this.db.all(
        queries.searchHistory,
        [userId || null, limit],
        (err, rows: any[]) => {
          if (err) {
            reject(err)
            return
          }
          resolve(rows)
        }
      )
    })
  }

  /**
   * 添加文档到搜索索引
   */
  async addToIndex(document: Omit<SearchDocument, 'rank'>): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO search_index 
        (id, type, title, content, tags, page_id, created_at, updated_at, author, path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      this.db.run(
        sql,
        [
          document.id,
          document.type,
          document.title,
          document.content,
          document.tags,
          document.page_id,
          document.created_at,
          document.updated_at,
          document.author,
          document.path
        ],
        (err) => {
          if (err) {
            reject(err)
            return
          }
          resolve()
        }
      )
    })
  }

  /**
   * 从搜索索引中移除文档
   */
  async removeFromIndex(documentId: string, type?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = type 
        ? 'DELETE FROM search_index WHERE id = ? AND type = ?'
        : 'DELETE FROM search_index WHERE id = ?'
      
      const params = type ? [documentId, type] : [documentId]
      
      this.db.run(sql, params, (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  }

  /**
   * 重建搜索索引
   */
  async rebuildIndex(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // 清空现有索引
        this.db.run('DELETE FROM search_index', (err) => {
          if (err) {
            reject(err)
            return
          }
        })

        // 重新索引笔记
        this.db.run(`
          INSERT INTO search_index (id, type, title, content, tags, page_id, created_at, updated_at, author, path)
          SELECT 
            id, 'note', title, content, COALESCE(tags, ''), id, created_at, updated_at, author, title
          FROM notes
        `, (err) => {
          if (err) {
            reject(err)
            return
          }
        })

        // 重新索引块引用
        this.db.run(`
          INSERT INTO search_index (id, type, title, content, tags, page_id, created_at, updated_at, path)
          SELECT 
            id, 'block', 'Block ' || substr(id, 1, 8), content, '', page_id, created_at, updated_at, 
            'blocks/' || page_id || '#' || id
          FROM block_references
        `, (err) => {
          if (err) {
            reject(err)
            return
          }
          resolve()
        })
      })
    })
  }

  /**
   * 预处理搜索查询
   */
  private preprocessQuery(query: string): string {
    // 移除特殊字符，保留中文、英文、数字和引号
    let processed = query.replace(/[^\w\s\u4e00-\u9fff"']/g, ' ')
    
    // 处理多个空格
    processed = processed.replace(/\s+/g, ' ')
    
    // 去除首尾空格
    processed = processed.trim()
    
    // 如果查询包含中文，添加简单的分词处理
    if (/[\u4e00-\u9fff]/.test(processed)) {
      // 简单的中文分词：在中文字符间添加空格（可以后续优化为更好的分词算法）
      processed = processed.replace(/([\u4e00-\u9fff])([\u4e00-\u9fff])/g, '$1 $2')
    }
    
    return processed
  }

  /**
   * 构建搜索参数
   */
  private buildSearchParams(query: SearchQuery, processedQuery: string) {
    const limit = Math.min(query.limit || this.config.defaultLimit, this.config.maxLimit)
    const offset = query.offset || 0
    
    return {
      query: processedQuery,
      types: query.types,
      pageIds: query.page_ids,
      dateStart: query.date_range?.start,
      dateEnd: query.date_range?.end,
      sortBy: query.sort_by || 'relevance',
      sortOrder: query.sort_order || 'desc',
      limit,
      offset
    }
  }

  /**
   * 执行搜索查询
   */
  private async executeSearch(params: any): Promise<SearchDocument[]> {
    return new Promise((resolve, reject) => {
      const queries = SearchDatabaseSchema.getSearchQueries()
      const useFiltered = params.types || params.pageIds || params.dateStart || params.dateEnd
      
      const sql = useFiltered ? queries.filteredSearch : queries.basicSearch
      const sqlParams = useFiltered ? [
        params.query,
        params.types ? JSON.stringify(params.types) : null,
        params.types ? JSON.stringify(params.types) : null,
        params.pageIds ? JSON.stringify(params.pageIds) : null,
        params.pageIds ? JSON.stringify(params.pageIds) : null,
        params.dateStart,
        params.dateStart,
        params.dateEnd,
        params.dateEnd,
        params.sortBy,
        params.sortBy,
        params.sortOrder,
        params.sortBy,
        params.sortOrder,
        params.sortBy,
        params.sortOrder,
        params.sortBy,
        params.sortOrder,
        params.sortBy,
        params.sortOrder,
        params.sortBy,
        params.sortOrder,
        params.limit,
        params.offset
      ] : [params.query, params.limit, params.offset]
      
      this.db.all(sql, sqlParams, (err, rows: any[]) => {
        if (err) {
          reject(err)
          return
        }
        resolve(rows as SearchDocument[])
      })
    })
  }

  /**
   * 生成搜索统计
   */
  private async generateSearchStats(
    query: string, 
    results: SearchDocument[], 
    startTime: number
  ): Promise<SearchStats> {
    const searchTime = Date.now() - startTime
    const typeCounts: Record<string, number> = {}
    
    results.forEach(result => {
      typeCounts[result.type] = (typeCounts[result.type] || 0) + 1
    })

    // 生成搜索建议（基于现有数据）
    const suggestions = await this.getSuggestions(query, 5)

    return {
      total_count: results.length,
      search_time: searchTime,
      type_counts: typeCounts,
      suggestions
    }
  }

  /**
   * 记录搜索历史
   */
  private async recordSearchHistory(
    query: SearchQuery, 
    resultCount: number, 
    searchTime: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO search_history (id, query, filters, result_count, search_time, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `
      
      const historyId = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const filters = JSON.stringify({
        types: query.types,
        tags: query.tags,
        page_ids: query.page_ids,
        date_range: query.date_range,
        authors: query.authors
      })
      
      this.db.run(
        sql,
        [historyId, query.query, filters, resultCount, searchTime],
        (err) => {
          if (err) {
            reject(err)
            return
          }
          resolve()
        }
      )
    })
  }

  /**
   * 生成搜索结果高亮
   */
  private async generateHighlights(
    results: SearchDocument[], 
    query: string
  ): Promise<SearchResult[]> {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0)
    
    return results.map(doc => {
      const highlights: string[] = []
      const matchedFields: string[] = []
      
      // 检查标题匹配
      if (this.containsAnyTerm(doc.title.toLowerCase(), queryTerms)) {
        highlights.push(this.highlightText(doc.title, queryTerms))
        matchedFields.push('title')
      }
      
      // 检查内容匹配
      if (this.containsAnyTerm(doc.content.toLowerCase(), queryTerms)) {
        const snippet = this.extractSnippet(doc.content, queryTerms)
        highlights.push(this.highlightText(snippet, queryTerms))
        matchedFields.push('content')
      }
      
      // 检查标签匹配
      if (doc.tags && this.containsAnyTerm(doc.tags.toLowerCase(), queryTerms)) {
        highlights.push(this.highlightText(doc.tags, queryTerms))
        matchedFields.push('tags')
      }
      
      return {
        document: doc,
        score: doc.rank || 0,
        highlights,
        matched_fields: matchedFields
      }
    })
  }

  /**
   * 检查文本是否包含任何搜索词
   */
  private containsAnyTerm(text: string, terms: string[]): boolean {
    return terms.some(term => text.includes(term))
  }

  /**
   * 提取包含搜索词的文本片段
   */
  private extractSnippet(content: string, terms: string[], maxLength: number = 200): string {
    const lowerContent = content.toLowerCase()
    
    // 找到第一个匹配的位置
    let firstMatchIndex = -1
    for (const term of terms) {
      const index = lowerContent.indexOf(term)
      if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
        firstMatchIndex = index
      }
    }
    
    if (firstMatchIndex === -1) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '')
    }
    
    // 计算片段的开始和结束位置
    const start = Math.max(0, firstMatchIndex - maxLength / 2)
    const end = Math.min(content.length, start + maxLength)
    
    let snippet = content.substring(start, end)
    
    if (start > 0) snippet = '...' + snippet
    if (end < content.length) snippet = snippet + '...'
    
    return snippet
  }

  /**
   * 高亮显示搜索词
   */
  private highlightText(text: string, terms: string[]): string {
    let highlighted = text
    
    terms.forEach(term => {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi')
      highlighted = highlighted.replace(regex, '<mark>$1</mark>')
    })
    
    return highlighted
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}

export default SearchService
