import React, { useState, useEffect } from 'react'
import {
  Cloud,
  Server,
  User,
  Key,
  FolderOpen,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  RefreshCw,
  Upload,
  Download,
  RotateCcw
} from 'lucide-react'
import { useNotifications } from './NotificationSystem'
import {
  WebDAVConfig,
  ConflictResolution,
  SyncDirection,
  SyncStatus,
  configureWebDAVSync,
  getWebDAVConfig,
  testWebDAVConnection,
  startWebDAVSync,
  stopWebDAVSync,
  getSyncStatus,
  getSyncStats,
  clearSyncCache,
  withErrorHandling
} from '../utils/tauri'

interface WebDAVSettingsProps {
  className?: string
}

const WebDAVSettings: React.FC<WebDAVSettingsProps> = ({ className = '' }) => {
  const { success, error, info } = useNotifications()
  
  // 配置状态
  const [config, setConfig] = useState<WebDAVConfig>({
    server_url: '',
    username: '',
    password: '',
    remote_path: '/minglog',
    enabled: false,
    auto_sync_interval: 300, // 5分钟
    conflict_resolution: ConflictResolution.LocalWins,
    sync_attachments: true,
    max_file_size: 10 * 1024 * 1024 // 10MB
  })

  // UI状态
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'failed'>('unknown')
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Idle)
  const [syncStats, setSyncStats] = useState<Record<string, number>>({})
  const [showPassword, setShowPassword] = useState(false)

  // 加载配置
  useEffect(() => {
    loadConfig()
    loadSyncStatus()
    loadSyncStats()
  }, [])

  const loadConfig = async () => {
    const savedConfig = await withErrorHandling(
      () => getWebDAVConfig(),
      'Failed to load WebDAV configuration'
    )
    
    if (savedConfig) {
      setConfig(savedConfig)
    }
  }

  const loadSyncStatus = async () => {
    const status = await withErrorHandling(
      () => getSyncStatus(),
      'Failed to load sync status'
    )
    
    if (status) {
      setSyncStatus(status)
    }
  }

  const loadSyncStats = async () => {
    const stats = await withErrorHandling(
      () => getSyncStats(),
      'Failed to load sync stats'
    )
    
    if (stats) {
      setSyncStats(stats)
    }
  }

  const handleConfigChange = (field: keyof WebDAVConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 重置连接状态
    if (['server_url', 'username', 'password', 'remote_path'].includes(field)) {
      setConnectionStatus('unknown')
    }
  }

  const handleSaveConfig = async () => {
    setIsLoading(true)
    
    try {
      await configureWebDAVSync(config)
      success('WebDAV配置已保存', '同步配置已成功更新')
      
      // 如果启用了同步，测试连接
      if (config.enabled) {
        await handleTestConnection()
      }
    } catch (err) {
      error('保存配置失败', '请检查配置信息是否正确')
      console.error('Failed to save WebDAV config:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!config.server_url || !config.username || !config.password) {
      error('配置不完整', '请填写服务器URL、用户名和密码')
      return
    }

    setIsTesting(true)
    setConnectionStatus('unknown')
    
    try {
      // 先保存配置
      await configureWebDAVSync(config)
      
      // 测试连接
      const isConnected = await testWebDAVConnection()
      
      if (isConnected) {
        setConnectionStatus('success')
        success('连接测试成功', 'WebDAV服务器连接正常')
      } else {
        setConnectionStatus('failed')
        error('连接测试失败', '无法连接到WebDAV服务器')
      }
    } catch (err) {
      setConnectionStatus('failed')
      error('连接测试失败', '请检查服务器地址和认证信息')
      console.error('Connection test failed:', err)
    } finally {
      setIsTesting(false)
    }
  }

  const handleSync = async (direction: SyncDirection) => {
    if (!config.enabled) {
      error('同步未启用', '请先启用WebDAV同步功能')
      return
    }

    try {
      info('开始同步', `正在执行${direction === SyncDirection.Upload ? '上传' : direction === SyncDirection.Download ? '下载' : '双向'}同步`)
      
      const result = await startWebDAVSync(direction)
      
      if (result.status === SyncStatus.Success) {
        success('同步完成', `成功同步 ${result.files_uploaded + result.files_downloaded} 个文件`)
      } else if (result.status === SyncStatus.Failed) {
        error('同步失败', result.errors.join(', '))
      } else if (result.status === SyncStatus.Conflict) {
        error('同步冲突', '存在文件冲突，请手动解决')
      }
      
      // 刷新状态
      await loadSyncStatus()
      await loadSyncStats()
    } catch (err) {
      error('同步失败', '同步过程中发生错误')
      console.error('Sync failed:', err)
    }
  }

  const handleStopSync = async () => {
    try {
      await stopWebDAVSync()
      success('同步已停止', '同步操作已取消')
      await loadSyncStatus()
    } catch (err) {
      error('停止同步失败', '无法停止同步操作')
      console.error('Failed to stop sync:', err)
    }
  }

  const handleClearCache = async () => {
    try {
      await clearSyncCache()
      success('缓存已清理', '同步缓存已清空')
      await loadSyncStats()
    } catch (err) {
      error('清理缓存失败', '无法清理同步缓存')
      console.error('Failed to clear cache:', err)
    }
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case SyncStatus.Success:
        return 'text-green-600'
      case SyncStatus.Failed:
        return 'text-red-600'
      case SyncStatus.Syncing:
      case SyncStatus.Uploading:
      case SyncStatus.Downloading:
        return 'text-blue-600'
      case SyncStatus.Conflict:
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  const isSyncing = [SyncStatus.Syncing, SyncStatus.Uploading, SyncStatus.Downloading, SyncStatus.Testing].includes(syncStatus)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center space-x-3">
        <Cloud className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">WebDAV 同步</h3>
      </div>

      {/* 启用/禁用开关 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-gray-600" />
          <div>
            <h4 className="font-medium text-gray-900">启用 WebDAV 同步</h4>
            <p className="text-sm text-gray-600">将笔记同步到 WebDAV 服务器</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => handleConfigChange('enabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* 服务器配置 */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center space-x-2">
          <Server className="w-4 h-4" />
          <span>服务器配置</span>
        </h4>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              服务器 URL
            </label>
            <input
              type="url"
              value={config.server_url}
              onChange={(e) => handleConfigChange('server_url', e.target.value)}
              placeholder="https://dav.jianguoyun.com/dav/"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={config.username}
                  onChange={(e) => handleConfigChange('username', e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={config.password}
                  onChange={(e) => handleConfigChange('password', e.target.value)}
                  placeholder="密码或应用专用密码"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              远程路径
            </label>
            <div className="relative">
              <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={config.remote_path}
                onChange={(e) => handleConfigChange('remote_path', e.target.value)}
                placeholder="/minglog"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* 连接测试 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {getConnectionStatusIcon()}
            <span className="text-sm font-medium">
              {connectionStatus === 'success' ? '连接正常' : 
               connectionStatus === 'failed' ? '连接失败' : '未测试'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isTesting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            <span>{isTesting ? '测试中...' : '测试连接'}</span>
          </button>
        </div>
      </div>

      {/* 同步选项 */}
      {config.enabled && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>同步选项</span>
          </h4>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                自动同步间隔（秒）
              </label>
              <select
                value={config.auto_sync_interval || 300}
                onChange={(e) => handleConfigChange('auto_sync_interval', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value={0}>手动同步</option>
                <option value={300}>5 分钟</option>
                <option value={600}>10 分钟</option>
                <option value={1800}>30 分钟</option>
                <option value={3600}>1 小时</option>
                <option value={21600}>6 小时</option>
                <option value={86400}>24 小时</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                冲突解决策略
              </label>
              <select
                value={config.conflict_resolution}
                onChange={(e) => handleConfigChange('conflict_resolution', e.target.value as ConflictResolution)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value={ConflictResolution.LocalWins}>本地优先</option>
                <option value={ConflictResolution.RemoteWins}>远程优先</option>
                <option value={ConflictResolution.ManualMerge}>手动合并</option>
                <option value={ConflictResolution.CreateBoth}>保留两个版本</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.sync_attachments}
                  onChange={(e) => handleConfigChange('sync_attachments', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <span className="text-sm font-medium text-gray-700">同步附件</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最大文件大小（MB）
              </label>
              <input
                type="number"
                value={Math.round((config.max_file_size || 10485760) / 1024 / 1024)}
                onChange={(e) => handleConfigChange('max_file_size', parseInt(e.target.value) * 1024 * 1024)}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* 同步控制 */}
      {config.enabled && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>同步控制</span>
          </h4>

          {/* 同步状态 */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">同步状态</span>
              <span className={`text-sm font-medium ${getSyncStatusColor()}`}>
                {syncStatus}
              </span>
            </div>

            {Object.keys(syncStats).length > 0 && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{syncStats.total_files || 0}</div>
                  <div className="text-gray-600">总文件</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">{syncStats.synced_files || 0}</div>
                  <div className="text-gray-600">已同步</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600">{syncStats.failed_files || 0}</div>
                  <div className="text-gray-600">失败</div>
                </div>
              </div>
            )}
          </div>

          {/* 同步按钮 */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleSync(SyncDirection.Upload)}
              disabled={isSyncing || isLoading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              <span>上传</span>
            </button>

            <button
              type="button"
              onClick={() => handleSync(SyncDirection.Download)}
              disabled={isSyncing || isLoading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>下载</span>
            </button>

            <button
              type="button"
              onClick={() => handleSync(SyncDirection.Bidirectional)}
              disabled={isSyncing || isLoading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              <span>双向</span>
            </button>
          </div>

          {/* 停止同步和清理缓存 */}
          <div className="flex space-x-3">
            {isSyncing && (
              <button
                type="button"
                onClick={handleStopSync}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <XCircle className="w-4 h-4" />
                <span>停止同步</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClearCache}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              <span>清理缓存</span>
            </button>
          </div>
        </div>
      )}

      {/* 保存配置按钮 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveConfig}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          <span>{isLoading ? '保存中...' : '保存配置'}</span>
        </button>
      </div>
    </div>
  )
}

export default WebDAVSettings
