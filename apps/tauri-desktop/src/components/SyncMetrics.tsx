import React, { memo } from 'react'
import {
  Cloud,
  Upload,
  Download,
  Wifi,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { MetricCard } from './MetricsGrid'
import { SyncStatus } from '../utils/tauri'

interface SyncMetricsData {
  uploadSpeed: number
  downloadSpeed: number
  filesInQueue: number
  lastSyncDuration: number
  errorCount: number
  connectionLatency: number
}

interface WebDAVConfig {
  enabled: boolean
  server_url?: string
  username?: string
  auto_sync_interval?: number
}

interface SyncMetricsProps {
  syncStatus: SyncStatus
  syncMetrics: SyncMetricsData
  syncConfig: WebDAVConfig | null
  isLoading?: boolean
}

const SyncMetrics: React.FC<SyncMetricsProps> = memo(({ 
  syncStatus, 
  syncMetrics, 
  syncConfig, 
  isLoading = false 
}) => {
  // Don't render if sync is not enabled
  if (!syncConfig?.enabled) {
    return null
  }

  const formatSpeed = (kbps: number) => {
    if (kbps < 1024) {
      return `${kbps.toFixed(1)} KB/s`
    }
    return `${(kbps / 1024).toFixed(1)} MB/s`
  }

  const formatLatency = (ms: number) => {
    return `${ms.toFixed(0)}ms`
  }

  const getSyncStatusInfo = (status: SyncStatus) => {
    switch (status) {
      case SyncStatus.Idle:
        return { text: '空闲', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' }
      case SyncStatus.Syncing:
        return { text: '同步中', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' }
      case SyncStatus.Success:
        return { text: '成功', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' }
      case SyncStatus.Failed:
        return { text: '失败', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
      case SyncStatus.Conflict:
        return { text: '冲突', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' }
      default:
        return { text: '未知', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' }
    }
  }

  const statusInfo = getSyncStatusInfo(syncStatus)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          WebDAV 同步监控
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            syncStatus === SyncStatus.Syncing ? 'bg-blue-500 animate-pulse' :
            syncStatus === SyncStatus.Success ? 'bg-green-500' :
            syncStatus === SyncStatus.Failed ? 'bg-red-500' :
            syncStatus === SyncStatus.Conflict ? 'bg-yellow-500' :
            'bg-gray-400'
          }`} />
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          icon={<Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          title="同步状态"
          value={statusInfo.text}
          status={syncStatus === SyncStatus.Success ? '正常' : syncStatus === SyncStatus.Failed ? '异常' : '运行中'}
          statusColor={statusInfo.color}
          subtitle={`服务器: ${syncConfig.server_url ? new URL(syncConfig.server_url).hostname : 'N/A'}`}
          isLoading={isLoading}
          trend={syncStatus === SyncStatus.Success ? 'down' : syncStatus === SyncStatus.Failed ? 'up' : 'stable'}
          trendValue={syncStatus === SyncStatus.Success ? '稳定' : syncStatus === SyncStatus.Failed ? '错误' : '运行'}
        />

        <MetricCard
          icon={<Upload className="w-5 h-5 text-green-600 dark:text-green-400" />}
          title="上传速度"
          value={formatSpeed(syncMetrics.uploadSpeed)}
          status={syncMetrics.uploadSpeed > 500 ? '快速' : syncMetrics.uploadSpeed > 100 ? '正常' : '较慢'}
          statusColor={syncMetrics.uploadSpeed > 500 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : syncMetrics.uploadSpeed > 100 
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          }
          subtitle="实时上传传输速度"
          isLoading={isLoading}
          trend={syncMetrics.uploadSpeed > 500 ? 'up' : 'stable'}
          trendValue={syncMetrics.uploadSpeed > 500 ? '快' : '正常'}
        />

        <MetricCard
          icon={<Download className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          title="下载速度"
          value={formatSpeed(syncMetrics.downloadSpeed)}
          status={syncMetrics.downloadSpeed > 500 ? '快速' : syncMetrics.downloadSpeed > 100 ? '正常' : '较慢'}
          statusColor={syncMetrics.downloadSpeed > 500 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : syncMetrics.downloadSpeed > 100 
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          }
          subtitle="实时下载传输速度"
          isLoading={isLoading}
          trend={syncMetrics.downloadSpeed > 500 ? 'up' : 'stable'}
          trendValue={syncMetrics.downloadSpeed > 500 ? '快' : '正常'}
        />

        <MetricCard
          icon={<Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
          title="同步耗时"
          value={`${syncMetrics.lastSyncDuration.toFixed(0)}ms`}
          status={syncMetrics.lastSyncDuration > 5000 ? '较慢' : '正常'}
          statusColor={syncMetrics.lastSyncDuration > 5000 
            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          }
          subtitle="最后一次同步用时"
          isLoading={isLoading}
          trend={syncMetrics.lastSyncDuration > 5000 ? 'up' : 'down'}
          trendValue={syncMetrics.lastSyncDuration > 5000 ? '慢' : '快'}
        />

        <MetricCard
          icon={<Wifi className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />}
          title="连接延迟"
          value={formatLatency(syncMetrics.connectionLatency)}
          status={syncMetrics.connectionLatency > 200 ? '较高' : '正常'}
          statusColor={syncMetrics.connectionLatency > 200 
            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          }
          subtitle="网络连接质量"
          isLoading={isLoading}
          trend={syncMetrics.connectionLatency > 200 ? 'up' : 'down'}
          trendValue={syncMetrics.connectionLatency > 200 ? '高' : '低'}
        />

        {syncMetrics.filesInQueue > 0 && (
          <MetricCard
            icon={<CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            title="队列文件"
            value={syncMetrics.filesInQueue.toString()}
            status="等待同步"
            statusColor="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
            subtitle="待同步文件数量"
            isLoading={isLoading}
            trend="up"
            trendValue="待处理"
          />
        )}

        {syncMetrics.errorCount > 0 && (
          <MetricCard
            icon={<AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />}
            title="同步错误"
            value={syncMetrics.errorCount.toString()}
            status="需要注意"
            statusColor="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            subtitle={`最后同步: ${syncMetrics.lastSyncDuration.toFixed(0)}ms`}
            isLoading={isLoading}
            trend="up"
            trendValue="错误"
          />
        )}
      </div>

      {/* Sync configuration info */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div>自动同步间隔: {syncConfig.auto_sync_interval ? `${syncConfig.auto_sync_interval}秒` : '已禁用'}</div>
          <div>用户名: {syncConfig.username || 'N/A'}</div>
          <div>服务器: {syncConfig.server_url || 'N/A'}</div>
        </div>
      </div>
    </div>
  )
})

SyncMetrics.displayName = 'SyncMetrics'

export default SyncMetrics
