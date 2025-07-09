import React, { memo } from 'react'
import {
  Activity,
  Database,
  Clock,
  Zap,
  Monitor,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { LoadingSpinner } from './LoadingStates'
import styles from './PerformanceMonitor.module.css'

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
  cpuCores?: number
  cpuUsage?: number
  diskRead?: number
  diskWrite?: number
  pageLoadTime?: number
  domNodes?: number
  jsHeapSize?: number
  networkRequests?: number
}

interface MetricCardProps {
  icon: React.ReactNode
  title: string
  value: string
  status?: string
  statusColor?: string
  subtitle?: string
  isLoading?: boolean
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
}

const MetricCard: React.FC<MetricCardProps> = memo(({
  icon,
  title,
  value,
  status,
  statusColor = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  subtitle,
  isLoading = false,
  trend,
  trendValue
}) => (
  <div className={`${styles.metricCard} relative overflow-hidden`}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-2">
        {icon}
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h4>
      </div>
      {trend && trendValue && (
        <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
          trend === 'up' ? styles.trendUp : 
          trend === 'down' ? styles.trendDown : 
          styles.trendStable
        }`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
           trend === 'down' ? <TrendingDown className="w-3 h-3" /> : 
           <Monitor className="w-3 h-3" />}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
    
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isLoading ? <LoadingSpinner size="sm" /> : value}
        </span>
        {status && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>
            {status}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
    </div>
  </div>
))

MetricCard.displayName = 'MetricCard'

interface MetricsGridProps {
  metrics: PerformanceMetrics
  isLoading?: boolean
  formatBytes: (bytes: number) => string
  formatTime: (ms: number) => string
}

const MetricsGrid: React.FC<MetricsGridProps> = memo(({ 
  metrics, 
  isLoading = false, 
  formatBytes, 
  formatTime 
}) => {
  // Calculate trends (simplified for demo)
  const getMemoryTrend = () => {
    if (metrics.memoryUsage.percentage > 80) return { trend: 'up' as const, value: '高' }
    if (metrics.memoryUsage.percentage < 50) return { trend: 'down' as const, value: '低' }
    return { trend: 'stable' as const, value: '正常' }
  }

  const getRenderTrend = () => {
    if (metrics.renderTime > 100) return { trend: 'up' as const, value: '慢' }
    if (metrics.renderTime < 16) return { trend: 'down' as const, value: '快' }
    return { trend: 'stable' as const, value: '正常' }
  }

  const memoryTrend = getMemoryTrend()
  const renderTrend = getRenderTrend()

  return (
    <div className={styles.metricsGrid}>
      <MetricCard
        icon={<Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        title="内存使用"
        value={formatBytes(metrics.memoryUsage.used)}
        status={metrics.memoryUsage.percentage > 80 ? '需要注意' : '正常'}
        statusColor={metrics.memoryUsage.percentage > 80 
          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        }
        subtitle={`${metrics.memoryUsage.percentage.toFixed(1)}% / ${formatBytes(metrics.memoryUsage.total)}`}
        isLoading={isLoading}
        trend={memoryTrend.trend}
        trendValue={memoryTrend.value}
      />

      <MetricCard
        icon={<Clock className="w-5 h-5 text-green-600 dark:text-green-400" />}
        title="渲染性能"
        value={formatTime(metrics.renderTime)}
        status={metrics.renderTime > 100 ? '需要优化' : '良好'}
        statusColor={metrics.renderTime > 100 
          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        }
        subtitle="目标: <16ms (60fps)"
        isLoading={isLoading}
        trend={renderTrend.trend}
        trendValue={renderTrend.value}
      />

      <MetricCard
        icon={<Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
        title="数据库查询"
        value={formatTime(metrics.dbQueryTime)}
        status={metrics.dbQueryTime > 200 ? '较慢' : '快速'}
        statusColor={metrics.dbQueryTime > 200 
          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        }
        subtitle="SQLite查询响应时间"
        isLoading={isLoading}
        trend={metrics.dbQueryTime > 200 ? 'up' : 'down'}
        trendValue={metrics.dbQueryTime > 200 ? '慢' : '快'}
      />

      <MetricCard
        icon={<Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
        title="组件数量"
        value={metrics.componentCount.toString()}
        status={metrics.componentCount > 100 ? '较多' : '正常'}
        statusColor={metrics.componentCount > 100 
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        }
        subtitle="当前渲染的React组件"
        isLoading={isLoading}
        trend={metrics.componentCount > 100 ? 'up' : 'stable'}
        trendValue={metrics.componentCount > 100 ? '多' : '正常'}
      />

      {/* Additional metrics if available */}
      {metrics.cpuUsage !== undefined && (
        <MetricCard
          icon={<Monitor className="w-5 h-5 text-red-600 dark:text-red-400" />}
          title="CPU使用率"
          value={`${metrics.cpuUsage.toFixed(1)}%`}
          status={metrics.cpuUsage > 80 ? '高负载' : '正常'}
          statusColor={metrics.cpuUsage > 80 
            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          }
          subtitle={`${metrics.cpuCores || 'N/A'} 核心`}
          isLoading={isLoading}
          trend={metrics.cpuUsage > 80 ? 'up' : 'stable'}
          trendValue={metrics.cpuUsage > 80 ? '高' : '正常'}
        />
      )}

      {metrics.jsHeapSize !== undefined && (
        <MetricCard
          icon={<Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          title="JS堆内存"
          value={formatBytes(metrics.jsHeapSize / 1024 / 1024)}
          status={metrics.jsHeapSize > 100 * 1024 * 1024 ? '较大' : '正常'}
          statusColor={metrics.jsHeapSize > 100 * 1024 * 1024 
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          }
          subtitle="JavaScript堆内存使用"
          isLoading={isLoading}
        />
      )}
    </div>
  )
})

MetricsGrid.displayName = 'MetricsGrid'

export default MetricsGrid
export { MetricCard }
