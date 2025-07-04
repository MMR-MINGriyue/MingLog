import React, { memo, useMemo, useCallback, useState } from 'react'
import { Activity, Zap, Database, Clock, BarChart3, X, AlertTriangle } from 'lucide-react'
import { FixedSizeList as List } from 'react-window'

interface PerformanceMetrics {
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  renderTime: number
  dbQueryTime: number
  componentCount: number
  lastUpdate: Date
  cpuUsage?: number
  fps?: number
}

interface OptimizedPerformanceMonitorProps {
  isOpen: boolean
  onClose: () => void
  data: PerformanceMetrics[]
  isMonitoring: boolean
  onToggleMonitoring: () => void
  onClearHistory: () => void
}

// 性能阈值常量
const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME_WARNING: 16, // 60fps
  RENDER_TIME_CRITICAL: 33, // 30fps
  MEMORY_WARNING: 70, // 70%
  MEMORY_CRITICAL: 85, // 85%
  DB_QUERY_WARNING: 100, // 100ms
  DB_QUERY_CRITICAL: 300, // 300ms
}

// 性能状态计算
const getPerformanceStatus = (metrics: PerformanceMetrics) => {
  const issues: string[] = []
  let severity: 'good' | 'warning' | 'critical' = 'good'

  if (metrics.renderTime > PERFORMANCE_THRESHOLDS.RENDER_TIME_CRITICAL) {
    issues.push('渲染时间严重超标')
    severity = 'critical'
  } else if (metrics.renderTime > PERFORMANCE_THRESHOLDS.RENDER_TIME_WARNING) {
    issues.push('渲染时间偏高')
    if (severity === 'good') severity = 'warning'
  }

  if (metrics.memoryUsage.percentage > PERFORMANCE_THRESHOLDS.MEMORY_CRITICAL) {
    issues.push('内存使用严重过高')
    severity = 'critical'
  } else if (metrics.memoryUsage.percentage > PERFORMANCE_THRESHOLDS.MEMORY_WARNING) {
    issues.push('内存使用偏高')
    if (severity === 'good') severity = 'warning'
  }

  if (metrics.dbQueryTime > PERFORMANCE_THRESHOLDS.DB_QUERY_CRITICAL) {
    issues.push('数据库查询严重缓慢')
    severity = 'critical'
  } else if (metrics.dbQueryTime > PERFORMANCE_THRESHOLDS.DB_QUERY_WARNING) {
    issues.push('数据库查询偏慢')
    if (severity === 'good') severity = 'warning'
  }

  return { issues, severity }
}

// 虚拟化列表项组件
const PerformanceListItem = memo(({ index, style, data }: any) => {
  const metrics = data[index]
  const { severity } = getPerformanceStatus(metrics)
  
  const statusColor = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  }[severity]

  return (
    <div style={style} className="flex items-center justify-between p-3 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${
          severity === 'good' ? 'bg-green-500' : 
          severity === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {metrics.lastUpdate.toLocaleTimeString()}
          </div>
          <div className="text-gray-500">
            渲染: {metrics.renderTime.toFixed(1)}ms | 
            内存: {metrics.memoryUsage.percentage.toFixed(1)}% | 
            DB: {metrics.dbQueryTime.toFixed(1)}ms
          </div>
        </div>
      </div>
      <div className={`text-sm font-medium ${statusColor}`}>
        {severity === 'good' ? '正常' : 
         severity === 'warning' ? '警告' : '严重'}
      </div>
    </div>
  )
})

PerformanceListItem.displayName = 'PerformanceListItem'

const OptimizedPerformanceMonitor: React.FC<OptimizedPerformanceMonitorProps> = ({
  isOpen,
  onClose,
  data,
  isMonitoring,
  onToggleMonitoring,
  onClearHistory
}) => {
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview')

  // 计算性能统计
  const performanceStats = useMemo(() => {
    if (data.length === 0) {
      return {
        avgRenderTime: 0,
        avgMemoryUsage: 0,
        avgDbQueryTime: 0,
        totalIssues: 0,
        criticalIssues: 0
      }
    }

    const stats = data.reduce((acc, metrics) => {
      const { issues, severity } = getPerformanceStatus(metrics)
      return {
        renderTime: acc.renderTime + metrics.renderTime,
        memoryUsage: acc.memoryUsage + metrics.memoryUsage.percentage,
        dbQueryTime: acc.dbQueryTime + metrics.dbQueryTime,
        totalIssues: acc.totalIssues + issues.length,
        criticalIssues: acc.criticalIssues + (severity === 'critical' ? 1 : 0)
      }
    }, { renderTime: 0, memoryUsage: 0, dbQueryTime: 0, totalIssues: 0, criticalIssues: 0 })

    return {
      avgRenderTime: stats.renderTime / data.length,
      avgMemoryUsage: stats.memoryUsage / data.length,
      avgDbQueryTime: stats.dbQueryTime / data.length,
      totalIssues: stats.totalIssues,
      criticalIssues: stats.criticalIssues
    }
  }, [data])

  // 最新性能状态
  const latestMetrics = data[data.length - 1]
  const currentStatus = latestMetrics ? getPerformanceStatus(latestMetrics) : null

  const handleViewModeChange = useCallback((mode: 'overview' | 'detailed') => {
    setViewMode(mode)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">性能监控</h2>
            {currentStatus && currentStatus.severity !== 'good' && (
              <AlertTriangle className={`w-5 h-5 ${
                currentStatus.severity === 'warning' ? 'text-yellow-500' : 'text-red-500'
              }`} />
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onToggleMonitoring}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isMonitoring 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isMonitoring ? '停止监控' : '开始监控'}
            </button>
            <button
              type="button"
              onClick={onClearHistory}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
            >
              清除历史
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* View Mode Toggle */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleViewModeChange('overview')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'overview' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                概览
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('detailed')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'detailed' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                详细
              </button>
            </div>
          </div>

          {/* Overview Mode */}
          {viewMode === 'overview' && (
            <div className="p-6 space-y-6">
              {/* Performance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-blue-900">
                        {performanceStats.avgRenderTime.toFixed(1)}ms
                      </div>
                      <div className="text-sm text-blue-700">平均渲染时间</div>
                      <div className="text-xs text-blue-600">
                        目标: &lt;16ms (60fps)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-8 h-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-900">
                        {performanceStats.avgMemoryUsage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-green-700">平均内存使用</div>
                      <div className="text-xs text-green-600">
                        目标: &lt;70%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Database className="w-8 h-8 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold text-purple-900">
                        {performanceStats.avgDbQueryTime.toFixed(1)}ms
                      </div>
                      <div className="text-sm text-purple-700">平均查询时间</div>
                      <div className="text-xs text-purple-600">
                        目标: &lt;100ms
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Status */}
              {currentStatus && (
                <div className={`rounded-lg p-4 ${
                  currentStatus.severity === 'good' ? 'bg-green-50' :
                  currentStatus.severity === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
                }`}>
                  <h3 className="font-medium text-gray-900 mb-2">当前状态</h3>
                  {currentStatus.issues.length === 0 ? (
                    <p className="text-green-700">性能状态良好</p>
                  ) : (
                    <ul className="space-y-1">
                      {currentStatus.issues.map((issue, index) => (
                        <li key={index} className={`text-sm ${
                          currentStatus.severity === 'warning' ? 'text-yellow-700' : 'text-red-700'
                        }`}>
                          • {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Detailed Mode */}
          {viewMode === 'detailed' && (
            <div className="flex-1 p-4">
              <div className="h-full">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  性能历史记录 ({data.length} 条记录)
                </h3>
                {data.length > 0 ? (
                  <List
                    height={400}
                    width="100%"
                    itemCount={data.length}
                    itemSize={70}
                    itemData={data}
                    overscanCount={5}
                  >
                    {PerformanceListItem}
                  </List>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    暂无性能数据
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(OptimizedPerformanceMonitor)
