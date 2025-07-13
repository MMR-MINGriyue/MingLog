/**
 * 增强性能监控组件
 * 提供实时性能指标显示、优化建议和性能告警
 * 确保<100ms响应时间目标
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { cn } from '../../utils'
import { EnhancedPerformanceMonitor, PerformanceMetric, PerformanceAlert, OptimizationSuggestion, PerformanceBenchmark } from '../../services/EnhancedPerformanceMonitor'

// 简单的图标组件
const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
)

const LightbulbIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// 组件属性接口
export interface EnhancedPerformanceMonitorComponentProps {
  /** 性能监控服务实例 */
  monitor: EnhancedPerformanceMonitor
  /** 是否显示 */
  isOpen: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 自定义样式类名 */
  className?: string
  /** 是否显示详细信息 */
  showDetails?: boolean
  /** 更新间隔（毫秒） */
  updateInterval?: number
}

/**
 * 增强性能监控组件
 */
export const EnhancedPerformanceMonitorComponent: React.FC<EnhancedPerformanceMonitorComponentProps> = ({
  monitor,
  isOpen,
  onClose,
  className,
  showDetails = true,
  updateInterval = 2000
}) => {
  // 状态管理
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const [benchmarks, setBenchmarks] = useState<PerformanceBenchmark[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'alerts' | 'suggestions'>('overview')
  const [isMonitoring, setIsMonitoring] = useState(false)

  // 更新数据
  const updateData = useCallback(() => {
    if (!isOpen) return

    const recentMetrics = monitor.getMetrics({
      timeRange: {
        start: Date.now() - 5 * 60 * 1000, // 最近5分钟
        end: Date.now()
      }
    })
    setMetrics(recentMetrics)

    const recentAlerts = monitor.getAlerts()
    setAlerts(recentAlerts.slice(-10)) // 最近10个告警

    const currentSuggestions = monitor.getSuggestions()
    setSuggestions(currentSuggestions.slice(-5)) // 最近5个建议

    const currentBenchmarks = monitor.getBenchmarks()
    setBenchmarks(currentBenchmarks)
  }, [monitor, isOpen])

  // 定期更新数据
  useEffect(() => {
    if (!isOpen) return

    updateData()
    const interval = setInterval(updateData, updateInterval)
    return () => clearInterval(interval)
  }, [isOpen, updateData, updateInterval])

  // 启动/停止监控
  const toggleMonitoring = useCallback(async () => {
    if (isMonitoring) {
      monitor.stop()
      setIsMonitoring(false)
    } else {
      await monitor.start()
      setIsMonitoring(true)
    }
  }, [monitor, isMonitoring])

  // 清除历史数据
  const clearHistory = useCallback(() => {
    monitor.clearHistory()
    updateData()
  }, [monitor, updateData])

  // 计算性能摘要
  const performanceSummary = useMemo(() => {
    return monitor.getPerformanceSummary()
  }, [monitor, metrics, alerts, suggestions, benchmarks])

  // 获取最新指标值
  const getLatestMetricValue = useCallback((metricName: string): number | null => {
    const metricData = metrics.filter(m => m.name === metricName)
    if (metricData.length === 0) return null
    return metricData[metricData.length - 1].value
  }, [metrics])

  // 格式化数值
  const formatValue = useCallback((value: number, unit: string): string => {
    if (unit === 'ms') {
      return `${value.toFixed(1)}ms`
    } else if (unit === 'MB') {
      return `${value.toFixed(1)}MB`
    } else if (unit === 'fps') {
      return `${Math.round(value)}fps`
    } else if (unit === 'count') {
      return Math.round(value).toString()
    }
    return `${value.toFixed(1)}${unit}`
  }, [])

  // 获取状态颜色
  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }, [])

  // 获取告警级别颜色
  const getAlertColor = useCallback((level: PerformanceAlert['level']): string => {
    switch (level) {
      case 'info': return 'text-blue-600 bg-blue-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'critical': return 'text-red-800 bg-red-200'
      default: return 'text-gray-600 bg-gray-100'
    }
  }, [])

  // 获取优先级颜色
  const getPriorityColor = useCallback((priority: OptimizationSuggestion['priority']): string => {
    switch (priority) {
      case 'low': return 'text-gray-600 bg-gray-100'
      case 'medium': return 'text-blue-600 bg-blue-100'
      case 'high': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50',
      className
    )}>
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ChartIcon />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">性能监控中心</h2>
              <p className="text-sm text-gray-600">实时性能指标监控和优化建议</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMonitoring}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                isMonitoring 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              )}
            >
              {isMonitoring ? '停止监控' : '开始监控'}
            </button>
            
            <button
              onClick={clearHistory}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="清除历史数据"
            >
              <RefreshIcon />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="关闭"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* 状态概览 */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={cn(
                'inline-flex px-3 py-1 rounded-full text-sm font-medium',
                getStatusColor(performanceSummary.status)
              )}>
                {performanceSummary.status === 'excellent' && '优秀'}
                {performanceSummary.status === 'good' && '良好'}
                {performanceSummary.status === 'warning' && '警告'}
                {performanceSummary.status === 'critical' && '严重'}
              </div>
              <p className="text-xs text-gray-600 mt-1">整体状态</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {performanceSummary.metrics.recent}
              </div>
              <p className="text-xs text-gray-600">最近指标</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {performanceSummary.alerts.active}
              </div>
              <p className="text-xs text-gray-600">活跃告警</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {performanceSummary.suggestions.highPriority}
              </div>
              <p className="text-xs text-gray-600">高优先级建议</p>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'overview', label: '概览', icon: ChartIcon },
              { key: 'metrics', label: '指标', icon: ChartIcon },
              { key: 'alerts', label: '告警', icon: AlertIcon },
              { key: 'suggestions', label: '建议', icon: LightbulbIcon }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={cn(
                  'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 关键指标 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">关键性能指标</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'render-time', label: '渲染时间', unit: 'ms', target: 16 },
                    { name: 'memory-usage', label: '内存使用', unit: 'MB', target: 100 },
                    { name: 'fps', label: '帧率', unit: 'fps', target: 60 },
                    { name: 'dom-nodes', label: 'DOM节点', unit: 'count', target: 1000 }
                  ].map(({ name, label, unit, target }) => {
                    const value = getLatestMetricValue(name)
                    const benchmark = benchmarks.find(b => b.name === name)
                    
                    return (
                      <div key={name} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{label}</span>
                          {benchmark && (
                            <span className={cn(
                              'px-2 py-1 text-xs rounded-full',
                              getStatusColor(benchmark.status)
                            )}>
                              {benchmark.status}
                            </span>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {value !== null ? formatValue(value, unit) : '--'}
                        </div>
                        <div className="text-xs text-gray-500">
                          目标: {formatValue(target, unit)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 最近告警 */}
              {alerts.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">最近告警</h3>
                  <div className="space-y-2">
                    {alerts.slice(0, 3).map(alert => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <AlertIcon className={cn('w-5 h-5 mt-0.5', getAlertColor(alert.level).split(' ')[0])} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <span className={cn(
                          'px-2 py-1 text-xs rounded-full',
                          getAlertColor(alert.level)
                        )}>
                          {alert.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 优化建议 */}
              {suggestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">优化建议</h3>
                  <div className="space-y-2">
                    {suggestions.slice(0, 3).map(suggestion => (
                      <div key={suggestion.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <LightbulbIcon className="w-5 h-5 mt-0.5 text-yellow-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{suggestion.title}</p>
                          <p className="text-xs text-gray-600">{suggestion.description}</p>
                        </div>
                        <span className={cn(
                          'px-2 py-1 text-xs rounded-full',
                          getPriorityColor(suggestion.priority)
                        )}>
                          {suggestion.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">性能指标详情</h3>

              {benchmarks.length > 0 ? (
                <div className="space-y-4">
                  {benchmarks.map(benchmark => (
                    <div key={benchmark.name} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{benchmark.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'px-2 py-1 text-xs rounded-full',
                            getStatusColor(benchmark.status)
                          )}>
                            {benchmark.status}
                          </span>
                          <span className={cn(
                            'px-2 py-1 text-xs rounded-full',
                            benchmark.trend === 'improving' ? 'text-green-600 bg-green-100' :
                            benchmark.trend === 'degrading' ? 'text-red-600 bg-red-100' :
                            'text-gray-600 bg-gray-100'
                          )}>
                            {benchmark.trend === 'improving' && '↗ 改善'}
                            {benchmark.trend === 'degrading' && '↘ 恶化'}
                            {benchmark.trend === 'stable' && '→ 稳定'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">当前值:</span>
                          <span className="ml-2 font-medium">{benchmark.current.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">目标值:</span>
                          <span className="ml-2 font-medium">{benchmark.target.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">平均值:</span>
                          <span className="ml-2 font-medium">{benchmark.average.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* 简单的进度条 */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>0</span>
                          <span>{benchmark.target}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              'h-2 rounded-full transition-all duration-300',
                              benchmark.current <= benchmark.target ? 'bg-green-500' : 'bg-red-500'
                            )}
                            style={{
                              width: `${Math.min((benchmark.current / benchmark.target) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无性能指标数据
                </div>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">性能告警</h3>

              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <AlertIcon className={cn('w-5 h-5 mt-0.5', getAlertColor(alert.level).split(' ')[0])} />
                          <div>
                            <h4 className="font-medium text-gray-900">{alert.message}</h4>
                            <p className="text-sm text-gray-600">
                              指标: {alert.metric} | 当前值: {alert.value} | 阈值: {alert.threshold}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          'px-2 py-1 text-xs rounded-full',
                          getAlertColor(alert.level)
                        )}>
                          {alert.level}
                        </span>
                      </div>

                      {alert.suggestions.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md">
                          <h5 className="text-sm font-medium text-blue-900 mb-2">建议操作:</h5>
                          <ul className="text-sm text-blue-800 space-y-1">
                            {alert.suggestions.map((suggestion, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-600">•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无性能告警
                </div>
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">优化建议</h3>

              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.map(suggestion => (
                    <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <LightbulbIcon className="w-5 h-5 mt-0.5 text-yellow-600" />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            'px-2 py-1 text-xs rounded-full',
                            getPriorityColor(suggestion.priority)
                          )}>
                            {suggestion.priority}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                            {suggestion.category}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">预期收益:</span>
                          <span className="ml-2 text-green-600">{suggestion.expectedImprovement}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">实施难度:</span>
                          <span className={cn(
                            'ml-2',
                            suggestion.difficulty === 'easy' ? 'text-green-600' :
                            suggestion.difficulty === 'medium' ? 'text-yellow-600' :
                            'text-red-600'
                          )}>
                            {suggestion.difficulty === 'easy' && '简单'}
                            {suggestion.difficulty === 'medium' && '中等'}
                            {suggestion.difficulty === 'hard' && '困难'}
                          </span>
                        </div>
                      </div>

                      {suggestion.relatedMetrics.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">相关指标:</h5>
                          <div className="flex flex-wrap gap-2">
                            {suggestion.relatedMetrics.map(metric => (
                              <span key={metric} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                {metric}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无优化建议
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EnhancedPerformanceMonitorComponent
