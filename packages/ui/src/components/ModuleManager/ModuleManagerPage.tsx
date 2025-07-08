/**
 * 模块管理页面
 * 提供模块的查看、管理和配置功能
 */

import React, { useState, useEffect } from 'react'
import { ModuleConfig, ModuleStatus } from '@minglog/core'
import { Search, Filter, RefreshCw, Plus, AlertTriangle } from 'lucide-react'
import { ModuleCard } from './ModuleCard'
import { ModuleConfigModal } from './ModuleConfigModal'
import { clsx } from 'clsx'

interface ModuleManagerPageProps {
  modules: ModuleConfig[]
  moduleStatuses: Record<string, ModuleStatus>
  moduleSettings: Record<string, any>
  moduleSchemas: Record<string, any[]>
  onToggleModule: (moduleId: string, enabled: boolean) => Promise<void>
  onUpdateModuleConfig: (moduleId: string, config: Record<string, any>) => Promise<void>
  onRefresh: () => Promise<void>
  loading?: boolean
}

export const ModuleManagerPage: React.FC<ModuleManagerPageProps> = ({
  modules,
  moduleStatuses,
  moduleSettings,
  moduleSchemas,
  onToggleModule,
  onUpdateModuleConfig,
  onRefresh,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [configModalModule, setConfigModalModule] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 过滤模块
  const filteredModules = modules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'active' && module.enabled) ||
                         (filterStatus === 'inactive' && !module.enabled)
    
    return matchesSearch && matchesFilter
  })

  // 统计信息
  const stats = {
    total: modules.length,
    active: modules.filter(m => m.enabled).length,
    inactive: modules.filter(m => !m.enabled).length,
    error: Object.values(moduleStatuses).filter(s => s === 'error').length
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleToggleModule = async (moduleId: string, enabled: boolean) => {
    try {
      await onToggleModule(moduleId, enabled)
    } catch (error) {
      console.error('Failed to toggle module:', error)
      // TODO: 显示错误通知
    }
  }

  const handleConfigureModule = (moduleId: string) => {
    setConfigModalModule(moduleId)
  }

  const handleCloseConfigModal = () => {
    setConfigModalModule(null)
  }

  const handleSaveModuleConfig = async (config: Record<string, any>) => {
    if (configModalModule) {
      try {
        await onUpdateModuleConfig(configModalModule, config)
        setConfigModalModule(null)
      } catch (error) {
        console.error('Failed to update module config:', error)
        // TODO: 显示错误通知
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 页面头部 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              模块管理
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              管理和配置应用功能模块
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className={clsx(
                'inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-colors',
                'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800',
                'hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                (isRefreshing || loading) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RefreshCw className={clsx('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
              刷新
            </button>
            
            <button
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              安装模块
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              总模块数
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.active}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              已激活
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {stats.inactive}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              未激活
            </div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.error}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">
              错误状态
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索模块..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 状态过滤 */}
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部模块</option>
              <option value="active">已激活</option>
              <option value="inactive">未激活</option>
            </select>
          </div>
        </div>
      </div>

      {/* 模块列表 */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">加载模块中...</p>
            </div>
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || filterStatus !== 'all' ? '没有找到匹配的模块' : '暂无可用模块'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map(module => (
              <ModuleCard
                key={module.id}
                module={module}
                status={moduleStatuses[module.id] || 'unloaded'}
                onToggle={handleToggleModule}
                onConfigure={handleConfigureModule}
                disabled={loading}
              />
            ))}
          </div>
        )}
      </div>

      {/* 配置模态框 */}
      {configModalModule && (
        <ModuleConfigModal
          moduleId={configModalModule}
          module={modules.find(m => m.id === configModalModule)!}
          settings={moduleSchemas[configModalModule] || []}
          currentValues={moduleSettings[configModalModule] || {}}
          onSave={handleSaveModuleConfig}
          onClose={handleCloseConfigModal}
        />
      )}
    </div>
  )
}
