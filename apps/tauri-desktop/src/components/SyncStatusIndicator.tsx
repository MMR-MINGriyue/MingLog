import React, { useState, useEffect } from 'react'
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Download,
  Clock,
  Wifi,
  // WifiOff // Unused
} from 'lucide-react'
import { useNotifications } from './NotificationSystem'
import {
  SyncStatus,
  SyncDirection,
  getSyncStatus,
  startWebDAVSync,
  getWebDAVConfig,
  withErrorHandling
} from '../utils/tauri'

interface SyncStatusIndicatorProps {
  className?: string
  showQuickActions?: boolean
  compact?: boolean
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  className = '', 
  showQuickActions = false,
  compact = false 
}) => {
  const { success, error, info } = useNotifications()
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Idle)
  const [isConfigured, setIsConfigured] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 定期检查同步状态
  useEffect(() => {
    checkSyncStatus()
    checkConfiguration()
    
    const interval = setInterval(() => {
      checkSyncStatus()
    }, 5000) // 每5秒检查一次

    return () => clearInterval(interval)
  }, [])

  const checkSyncStatus = async () => {
    const status = await withErrorHandling(
      () => getSyncStatus(),
      'Failed to get sync status'
    )
    
    if (status) {
      setSyncStatus(status)
      
      // 如果同步成功，更新最后同步时间
      if (status === SyncStatus.Success) {
        setLastSyncTime(new Date())
      }
    }
  }

  const checkConfiguration = async () => {
    const config = await withErrorHandling(
      () => getWebDAVConfig(),
      'Failed to get WebDAV config'
    )
    
    setIsConfigured(config?.enabled || false)
  }

  const handleQuickSync = async (direction: SyncDirection) => {
    if (!isConfigured) {
      error('同步未配置', '请先在设置中配置WebDAV同步')
      return
    }

    setIsLoading(true)
    
    try {
      info('开始同步', `正在执行${getDirectionText(direction)}同步`)
      
      const result = await startWebDAVSync(direction)
      
      if (result.status === SyncStatus.Success) {
        success('同步完成', `成功同步 ${result.files_uploaded + result.files_downloaded} 个文件`)
        setLastSyncTime(new Date())
      } else if (result.status === SyncStatus.Failed) {
        error('同步失败', result.errors.join(', '))
      } else if (result.status === SyncStatus.Conflict) {
        error('同步冲突', '存在文件冲突，请在设置中手动解决')
      }
      
      await checkSyncStatus()
    } catch (err) {
      error('同步失败', '同步过程中发生错误')
      console.error('Quick sync failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getDirectionText = (direction: SyncDirection): string => {
    switch (direction) {
      case SyncDirection.Upload:
        return '上传'
      case SyncDirection.Download:
        return '下载'
      case SyncDirection.Bidirectional:
        return '双向'
      default:
        return '同步'
    }
  }

  const getSyncStatusIcon = () => {
    if (!isConfigured) {
      return <CloudOff className="w-4 h-4 text-gray-400" />
    }

    switch (syncStatus) {
      case SyncStatus.Success:
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case SyncStatus.Failed:
        return <XCircle className="w-4 h-4 text-red-500" />
      case SyncStatus.Syncing:
      case SyncStatus.Uploading:
      case SyncStatus.Downloading:
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case SyncStatus.Conflict:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case SyncStatus.Testing:
        return <Wifi className="w-4 h-4 text-blue-500 animate-pulse" />
      default:
        return <Cloud className="w-4 h-4 text-gray-500" />
    }
  }

  const getSyncStatusText = () => {
    if (!isConfigured) {
      return '未配置'
    }

    switch (syncStatus) {
      case SyncStatus.Success:
        return '同步成功'
      case SyncStatus.Failed:
        return '同步失败'
      case SyncStatus.Syncing:
        return '同步中'
      case SyncStatus.Uploading:
        return '上传中'
      case SyncStatus.Downloading:
        return '下载中'
      case SyncStatus.Conflict:
        return '存在冲突'
      case SyncStatus.Testing:
        return '测试连接'
      default:
        return '空闲'
    }
  }

  const getSyncStatusColor = () => {
    if (!isConfigured) {
      return 'text-gray-500'
    }

    switch (syncStatus) {
      case SyncStatus.Success:
        return 'text-green-600'
      case SyncStatus.Failed:
        return 'text-red-600'
      case SyncStatus.Syncing:
      case SyncStatus.Uploading:
      case SyncStatus.Downloading:
      case SyncStatus.Testing:
        return 'text-blue-600'
      case SyncStatus.Conflict:
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return '从未同步'
    
    const now = new Date()
    const diff = now.getTime() - lastSyncTime.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    
    const days = Math.floor(hours / 24)
    return `${days}天前`
  }

  const isSyncing = [SyncStatus.Syncing, SyncStatus.Uploading, SyncStatus.Downloading, SyncStatus.Testing].includes(syncStatus)

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getSyncStatusIcon()}
        <span className={`text-sm ${getSyncStatusColor()}`}>
          {getSyncStatusText()}
        </span>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* 状态标题 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getSyncStatusIcon()}
          <h4 className="font-medium text-gray-900">同步状态</h4>
        </div>
        
        {isConfigured && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatLastSyncTime()}</span>
          </div>
        )}
      </div>

      {/* 状态信息 */}
      <div className="mb-4">
        <div className={`text-sm font-medium ${getSyncStatusColor()}`}>
          {getSyncStatusText()}
        </div>
        
        {!isConfigured && (
          <p className="text-xs text-gray-500 mt-1">
            在设置中配置WebDAV同步以开始使用
          </p>
        )}
      </div>

      {/* 快速操作按钮 */}
      {showQuickActions && isConfigured && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSync(SyncDirection.Upload)}
              disabled={isSyncing || isLoading}
              className="flex items-center justify-center space-x-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-3 h-3" />
              <span>上传</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleQuickSync(SyncDirection.Download)}
              disabled={isSyncing || isLoading}
              className="flex items-center justify-center space-x-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3 h-3" />
              <span>下载</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleQuickSync(SyncDirection.Bidirectional)}
              disabled={isSyncing || isLoading}
              className="flex items-center justify-center space-x-1 px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-3 h-3" />
              <span>双向</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SyncStatusIndicator
