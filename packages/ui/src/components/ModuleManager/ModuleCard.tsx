/**
 * 模块卡片组件
 * 显示单个模块的信息和操作
 */

import React from 'react'
import { ModuleConfig, ModuleStatus } from '@minglog/core'
import { Settings, Power, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { clsx } from 'clsx'

interface ModuleCardProps {
  module: ModuleConfig
  status: ModuleStatus
  onToggle: (moduleId: string, enabled: boolean) => void
  onConfigure: (moduleId: string) => void
  disabled?: boolean
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  status,
  onToggle,
  onConfigure,
  disabled = false
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'loading':
      case 'activating':
      case 'deactivating':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Power className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'active':
        return '已激活'
      case 'loaded':
        return '已加载'
      case 'loading':
        return '加载中...'
      case 'activating':
        return '激活中...'
      case 'deactivating':
        return '停用中...'
      case 'error':
        return '错误'
      default:
        return '未加载'
    }
  }

  const isActive = status === 'active'
  const isLoading = ['loading', 'activating', 'deactivating'].includes(status)

  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200',
      'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
      disabled && 'opacity-50 cursor-not-allowed'
    )}>
      {/* 模块头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {module.icon && (
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-lg">
                {module.icon}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {module.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              v{module.version}
            </p>
          </div>
        </div>
        
        {/* 状态指示器 */}
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* 模块描述 */}
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
        {module.description}
      </p>

      {/* 依赖关系 */}
      {module.dependencies.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">依赖模块:</p>
          <div className="flex flex-wrap gap-1">
            {module.dependencies.map(dep => (
              <span
                key={dep}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded"
              >
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          {/* 启用/禁用开关 */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={module.enabled}
              onChange={(e) => onToggle(module.id, e.target.checked)}
              disabled={disabled || isLoading}
              className="sr-only peer"
            />
            <div className={clsx(
              'w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700',
              'peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600',
              'peer-checked:bg-blue-600',
              (disabled || isLoading) && 'opacity-50 cursor-not-allowed'
            )}></div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
              {module.enabled ? '已启用' : '已禁用'}
            </span>
          </label>
        </div>

        {/* 配置按钮 */}
        <button
          onClick={() => onConfigure(module.id)}
          disabled={disabled || !isActive}
          className={clsx(
            'inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-colors',
            'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800',
            'hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            (disabled || !isActive) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Settings className="w-4 h-4 mr-1" />
          配置
        </button>
      </div>
    </div>
  )
}
