/**
 * 模块化设置页面
 * 提供应用设置和模块配置功能
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Settings, 
  Palette, 

  Info,
  Puzzle,
  Monitor,
  Moon,
  Sun
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useCoreInstance } from '../contexts/CoreContext'
import { clsx } from 'clsx'

const ModularSettingsPage: React.FC = () => {
  const { t: _t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const core = useCoreInstance()
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', label: '通用设置', icon: Settings },
    { id: 'appearance', label: '外观', icon: Palette },
    { id: 'modules', label: '模块管理', icon: Puzzle },
    { id: 'about', label: '关于', icon: Info }
  ]

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme as any) // TODO: 修复主题类型
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          语言设置
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            界面语言
          </label>
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          主题设置
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            主题模式
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light', label: '浅色', icon: Sun },
              { value: 'dark', label: '深色', icon: Moon },
              { value: 'system', label: '跟随系统', icon: Monitor }
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value as any)}
                className={clsx(
                  'flex flex-col items-center p-4 rounded-lg border-2 transition-colors',
                  theme === value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <Icon className={clsx(
                  'w-6 h-6 mb-2',
                  theme === value 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400'
                )} />
                <span className={clsx(
                  'text-sm font-medium',
                  theme === value 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300'
                )}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderModulesSettings = () => {
    const moduleManager = (core as any).getModuleManager?.() || { getAvailableModules: () => [], getActiveModules: () => [] } // TODO: 修复模块管理器
    const modules = moduleManager.getRegisteredModules()
    const activeModules = moduleManager.getActiveModules()

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            模块状态
          </h3>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {modules.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                总模块数
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {activeModules.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                已激活
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {modules.length - activeModules.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                未激活
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {modules.map(module => {
              const isActive = activeModules.some(m => m.id === module.id)
              return (
                <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {module.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {module.description}
                    </p>
                  </div>
                  <span className={clsx(
                    'px-2 py-1 text-xs rounded-full',
                    isActive 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                  )}>
                    {isActive ? '已激活' : '未激活'}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => window.location.href = '/modules'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              打开模块管理器
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderAboutSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          应用信息
        </h3>
        
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">M</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            MingLog
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            模块化知识管理系统
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <div>版本: 1.0.0</div>
            <div>构建: {new Date().toLocaleDateString()}</div>
            <div>架构: 模块化</div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">前端框架:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">React 18</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">桌面框架:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">Tauri</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">语言:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">TypeScript</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">样式:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">Tailwind CSS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings()
      case 'appearance':
        return renderAppearanceSettings()
      case 'modules':
        return renderModulesSettings()
      case 'about':
        return renderAboutSettings()
      default:
        return renderGeneralSettings()
    }
  }

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* 侧边栏 */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            设置
          </h1>
          
          <nav className="space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default ModularSettingsPage
