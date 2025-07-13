/**
 * 搜索分析服务
 * 提供搜索行为分析、性能监控和搜索优化建议
 */

import { DatabaseManager } from '../database/DatabaseManager'
import { EventBus } from '../event-system/EventBus'

// 搜索记录
export interface SearchRecord {
  id?: string
  query: string
  filters?: Record<string, any>
  resultCount: number
  searchTime: number
  timestamp: Date
  userId?: string
  sessionId?: string
  clickedResults?: string[]
  searchMode?: 'simple' | 'advanced' | 'template'
  source?: 'manual' | 'suggestion' | 'template' | 'saved'
}

// 搜索统计
export interface SearchStatistics {
  totalSearches: number
  uniqueQueries: number
  averageSearchTime: number
  averageResultCount: number
  popularQueries: Array<{ query: string; count: number }>
  popularFilters: Array<{ filter: string; count: number }>
  searchTrends: Array<{ date: string; count: number }>
  performanceMetrics: {
    fastSearches: number // <100ms
    slowSearches: number // >1000ms
    averageTime: number
    p95Time: number
  }
  userBehavior: {
    clickThroughRate: number
    averageResultsViewed: number
    commonSearchPatterns: string[]
  }
}

// 搜索建议
export interface SearchOptimizationSuggestion {
  type: 'query' | 'filter' | 'performance' | 'content'
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  action?: string
  impact?: string
}

// 搜索分析配置
export interface SearchAnalyticsConfig {
  enableTracking: boolean
  enablePerformanceMonitoring: boolean
  enableUserBehaviorTracking: boolean
  retentionDays: number
  batchSize: number
  flushInterval: number
}

/**
 * 搜索分析服务
 */
export class SearchAnalyticsService {
  private database: DatabaseManager
  private eventBus: EventBus
  private config: SearchAnalyticsConfig
  private recordBuffer: SearchRecord[] = []
  private flushTimer?: NodeJS.Timeout

  constructor(
    database: DatabaseManager,
    eventBus: EventBus,
    config: Partial<SearchAnalyticsConfig> = {}
  ) {
    this.database = database
    this.eventBus = eventBus
    this.config = {
      enableTracking: true,
      enablePerformanceMonitoring: true,
      enableUserBehaviorTracking: true,
      retentionDays: 90,
      batchSize: 100,
      flushInterval: 30000, // 30秒
      ...config
    }

    this.initialize()
  }

  /**
   * 初始化服务
   */
  private async initialize(): Promise<void> {
    try {
      // 创建数据库表
      await this.createTables()

      // 设置定期刷新
      if (this.config.enableTracking) {
        this.startPeriodicFlush()
      }

      // 设置事件监听
      this.setupEventListeners()

      console.log('✅ 搜索分析服务初始化完成')
    } catch (error) {
      console.error('❌ 搜索分析服务初始化失败:', error)
      throw error
    }
  }

  /**
   * 创建数据库表
   */
  private async createTables(): Promise<void> {
    // 搜索记录表
    await this.database.execute(`
      CREATE TABLE IF NOT EXISTS search_records (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        filters TEXT DEFAULT '{}',
        result_count INTEGER NOT NULL,
        search_time REAL NOT NULL,
        timestamp TEXT NOT NULL,
        user_id TEXT,
        session_id TEXT,
        clicked_results TEXT DEFAULT '[]',
        search_mode TEXT DEFAULT 'simple',
        source TEXT DEFAULT 'manual',
        created_at TEXT NOT NULL
      )
    `)

    // 创建索引
    await this.database.execute(`
      CREATE INDEX IF NOT EXISTS idx_search_records_timestamp 
      ON search_records(timestamp)
    `)

    await this.database.execute(`
      CREATE INDEX IF NOT EXISTS idx_search_records_query 
      ON search_records(query)
    `)

    await this.database.execute(`
      CREATE INDEX IF NOT EXISTS idx_search_records_user 
      ON search_records(user_id)
    `)

    // 搜索性能表
    await this.database.execute(`
      CREATE TABLE IF NOT EXISTS search_performance (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        total_searches INTEGER DEFAULT 0,
        average_time REAL DEFAULT 0,
        p95_time REAL DEFAULT 0,
        slow_searches INTEGER DEFAULT 0,
        fast_searches INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        UNIQUE(date)
      )
    `)
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    this.eventBus.on('search:executed', this.handleSearchExecuted.bind(this))
    this.eventBus.on('search:result-clicked', this.handleResultClicked.bind(this))
    this.eventBus.on('search:filter-applied', this.handleFilterApplied.bind(this))
  }

  /**
   * 记录搜索
   */
  async recordSearch(record: Omit<SearchRecord, 'id'>): Promise<void> {
    if (!this.config.enableTracking) return

    const searchRecord: SearchRecord = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...record
    }

    // 添加到缓冲区
    this.recordBuffer.push(searchRecord)

    // 如果缓冲区满了，立即刷新
    if (this.recordBuffer.length >= this.config.batchSize) {
      await this.flushRecords()
    }

    // 发送事件
    this.eventBus.emit('search:recorded', { record: searchRecord })
  }

  /**
   * 获取搜索统计
   */
  async getSearchStatistics(
    startDate?: Date,
    endDate?: Date,
    userId?: string
  ): Promise<SearchStatistics> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 默认30天
    const end = endDate || new Date()

    let whereClause = 'WHERE timestamp >= ? AND timestamp <= ?'
    const params: any[] = [start.toISOString(), end.toISOString()]

    if (userId) {
      whereClause += ' AND user_id = ?'
      params.push(userId)
    }

    // 基础统计
    const basicStats = await this.database.query(`
      SELECT 
        COUNT(*) as total_searches,
        COUNT(DISTINCT query) as unique_queries,
        AVG(search_time) as average_search_time,
        AVG(result_count) as average_result_count
      FROM search_records 
      ${whereClause}
    `, params)

    // 热门查询
    const popularQueries = await this.database.query(`
      SELECT query, COUNT(*) as count
      FROM search_records 
      ${whereClause}
      GROUP BY query
      ORDER BY count DESC
      LIMIT 20
    `, params)

    // 热门过滤器
    const popularFilters = await this.database.query(`
      SELECT filters, COUNT(*) as count
      FROM search_records 
      ${whereClause}
      WHERE filters != '{}'
      GROUP BY filters
      ORDER BY count DESC
      LIMIT 10
    `, params)

    // 搜索趋势（按天）
    const searchTrends = await this.database.query(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM search_records 
      ${whereClause}
      GROUP BY DATE(timestamp)
      ORDER BY date
    `, params)

    // 性能指标
    const performanceStats = await this.database.query(`
      SELECT 
        COUNT(CASE WHEN search_time < 100 THEN 1 END) as fast_searches,
        COUNT(CASE WHEN search_time > 1000 THEN 1 END) as slow_searches,
        AVG(search_time) as average_time
      FROM search_records 
      ${whereClause}
    `, params)

    // P95性能
    const p95Stats = await this.database.query(`
      SELECT search_time
      FROM search_records 
      ${whereClause}
      ORDER BY search_time
      LIMIT 1 OFFSET (
        SELECT CAST(COUNT(*) * 0.95 AS INTEGER)
        FROM search_records 
        ${whereClause}
      )
    `, params)

    // 用户行为统计
    const behaviorStats = await this.database.query(`
      SELECT 
        AVG(CASE WHEN clicked_results != '[]' THEN 1.0 ELSE 0.0 END) as click_through_rate,
        AVG(JSON_ARRAY_LENGTH(clicked_results)) as average_results_viewed
      FROM search_records 
      ${whereClause}
    `, params)

    const stats = basicStats[0] || {}
    const performance = performanceStats[0] || {}
    const behavior = behaviorStats[0] || {}
    const p95Time = p95Stats[0]?.search_time || 0

    return {
      totalSearches: stats.total_searches || 0,
      uniqueQueries: stats.unique_queries || 0,
      averageSearchTime: stats.average_search_time || 0,
      averageResultCount: stats.average_result_count || 0,
      popularQueries: popularQueries.map(q => ({
        query: q.query,
        count: q.count
      })),
      popularFilters: popularFilters.map(f => ({
        filter: f.filters,
        count: f.count
      })),
      searchTrends: searchTrends.map(t => ({
        date: t.date,
        count: t.count
      })),
      performanceMetrics: {
        fastSearches: performance.fast_searches || 0,
        slowSearches: performance.slow_searches || 0,
        averageTime: performance.average_time || 0,
        p95Time
      },
      userBehavior: {
        clickThroughRate: behavior.click_through_rate || 0,
        averageResultsViewed: behavior.average_results_viewed || 0,
        commonSearchPatterns: await this.getCommonSearchPatterns(whereClause, params)
      }
    }
  }

  /**
   * 获取搜索优化建议
   */
  async getOptimizationSuggestions(
    statistics: SearchStatistics
  ): Promise<SearchOptimizationSuggestion[]> {
    const suggestions: SearchOptimizationSuggestion[] = []

    // 性能建议
    if (statistics.performanceMetrics.averageTime > 500) {
      suggestions.push({
        type: 'performance',
        priority: 'high',
        title: '搜索性能需要优化',
        description: `平均搜索时间为 ${statistics.performanceMetrics.averageTime.toFixed(2)}ms，建议优化索引`,
        action: '优化搜索索引',
        impact: '可提升搜索速度50%以上'
      })
    }

    // 查询建议
    if (statistics.userBehavior.clickThroughRate < 0.3) {
      suggestions.push({
        type: 'query',
        priority: 'medium',
        title: '搜索结果相关性有待提升',
        description: `点击率仅为 ${(statistics.userBehavior.clickThroughRate * 100).toFixed(1)}%`,
        action: '改进搜索算法',
        impact: '提升用户搜索体验'
      })
    }

    // 内容建议
    if (statistics.averageResultCount < 5) {
      suggestions.push({
        type: 'content',
        priority: 'low',
        title: '搜索结果数量较少',
        description: `平均每次搜索仅返回 ${statistics.averageResultCount.toFixed(1)} 个结果`,
        action: '丰富内容索引',
        impact: '提供更多相关结果'
      })
    }

    // 过滤器建议
    const filterUsageRate = statistics.popularFilters.length / statistics.totalSearches
    if (filterUsageRate < 0.1) {
      suggestions.push({
        type: 'filter',
        priority: 'low',
        title: '过滤器使用率较低',
        description: '用户很少使用搜索过滤器',
        action: '改进过滤器UI设计',
        impact: '帮助用户更精确地搜索'
      })
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * 记录结果点击
   */
  async recordResultClick(searchId: string, resultId: string): Promise<void> {
    if (!this.config.enableUserBehaviorTracking) return

    try {
      // 更新搜索记录的点击结果
      await this.database.execute(`
        UPDATE search_records 
        SET clicked_results = JSON_INSERT(
          COALESCE(clicked_results, '[]'),
          '$[#]',
          ?
        )
        WHERE id = ?
      `, [resultId, searchId])

      // 发送事件
      this.eventBus.emit('search:result-clicked', {
        searchId,
        resultId,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('记录结果点击失败:', error)
    }
  }

  /**
   * 清理过期数据
   */
  async cleanupOldRecords(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000)

    try {
      const result = await this.database.execute(`
        DELETE FROM search_records 
        WHERE timestamp < ?
      `, [cutoffDate.toISOString()])

      console.log(`🧹 清理了 ${result.changes || 0} 条过期搜索记录`)

      // 清理性能数据
      await this.database.execute(`
        DELETE FROM search_performance 
        WHERE date < ?
      `, [cutoffDate.toISOString().split('T')[0]])

    } catch (error) {
      console.error('清理过期数据失败:', error)
    }
  }

  /**
   * 导出搜索数据
   */
  async exportSearchData(
    startDate?: Date,
    endDate?: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate || new Date()

    const records = await this.database.query(`
      SELECT * FROM search_records 
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
    `, [start.toISOString(), end.toISOString()])

    if (format === 'csv') {
      return this.convertToCSV(records)
    } else {
      return JSON.stringify(records, null, 2)
    }
  }

  /**
   * 刷新记录到数据库
   */
  private async flushRecords(): Promise<void> {
    if (this.recordBuffer.length === 0) return

    try {
      const records = [...this.recordBuffer]
      this.recordBuffer = []

      for (const record of records) {
        await this.database.execute(`
          INSERT INTO search_records (
            id, query, filters, result_count, search_time, timestamp,
            user_id, session_id, clicked_results, search_mode, source, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          record.id,
          record.query,
          JSON.stringify(record.filters || {}),
          record.resultCount,
          record.searchTime,
          record.timestamp.toISOString(),
          record.userId || null,
          record.sessionId || null,
          JSON.stringify(record.clickedResults || []),
          record.searchMode || 'simple',
          record.source || 'manual',
          new Date().toISOString()
        ])
      }

      console.log(`💾 刷新了 ${records.length} 条搜索记录`)
    } catch (error) {
      console.error('刷新搜索记录失败:', error)
      // 将记录放回缓冲区
      this.recordBuffer.unshift(...this.recordBuffer)
    }
  }

  /**
   * 开始定期刷新
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushRecords()
    }, this.config.flushInterval)
  }

  /**
   * 获取常见搜索模式
   */
  private async getCommonSearchPatterns(
    whereClause: string,
    params: any[]
  ): Promise<string[]> {
    // 简化实现，返回常见的查询模式
    const patterns = await this.database.query(`
      SELECT query
      FROM search_records 
      ${whereClause}
      GROUP BY query
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `, params)

    return patterns.map(p => p.query)
  }

  /**
   * 转换为CSV格式
   */
  private convertToCSV(records: any[]): string {
    if (records.length === 0) return ''

    const headers = Object.keys(records[0])
    const csvRows = [
      headers.join(','),
      ...records.map(record =>
        headers.map(header => {
          const value = record[header]
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        }).join(',')
      )
    ]

    return csvRows.join('\n')
  }

  /**
   * 处理搜索执行事件
   */
  private handleSearchExecuted(event: any): void {
    // 可以在这里添加额外的搜索分析逻辑
  }

  /**
   * 处理结果点击事件
   */
  private handleResultClicked(event: any): void {
    // 可以在这里添加点击行为分析逻辑
  }

  /**
   * 处理过滤器应用事件
   */
  private handleFilterApplied(event: any): void {
    // 可以在这里添加过滤器使用分析逻辑
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    // 刷新剩余记录
    await this.flushRecords()
  }
}

export default SearchAnalyticsService
