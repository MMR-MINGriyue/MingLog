/**
 * 模块化导航组件
 * 动态生成基于激活模块的导航菜单
 */

import React, { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Settings, 
  Puzzle,
  Home,
  FileText,
  Star,
  Archive,
  Tag
} from 'lucide-react'
import { useCore } from '../contexts/CoreContext'
import { clsx } from 'clsx'

interface NavigationItem {
  id: string
  label: string
  path: string
  icon: React.ComponentType<any>
  order: number
  moduleId?: string
}

export const ModularNavigation: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const { core, initialized } = useCore()

  // 生成导航项
  const navigationItems = useMemo(() => {
    const items: NavigationItem[] = []

    // 添加核心导航项
    items.push(
      {
        id: 'notes',
        label: '笔记',
        path: '/notes',
        icon: FileText,
        order: 1
      },
      {
        id: 'modules',
        label: t('modules.title') || '模块管理',
        path: '/modules',
        icon: Puzzle,
        order: 999
      },
      {
        id: 'settings',
        label: t('common.settings') || '设置',
        path: '/settings',
        icon: Settings,
        order: 1000
      }
    )

    // 简化版本：直接返回基础导航项
    // 在实际的模块化系统中，这里会动态加载模块的导航项

    // 按order排序
    return items.sort((a, b) => a.order - b.order)
  }, [core, initialized])

  // 图标映射
  const getIconComponent = (iconName?: string): React.ComponentType<any> => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'Home': Home,
      'FileText': FileText,
      'Plus': FileText,
      'Star': Star,
      'Archive': Archive,
      'Tag': Tag,
      'Settings': Settings,
      'Puzzle': Puzzle
    }

    return iconMap[iconName || 'FileText'] || FileText
  }

  // 检查路径是否激活
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="space-y-1">
      {navigationItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.path)

        return (
          <Link
            key={item.id}
            to={item.path}
            className={clsx(
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
              active
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <Icon
              className={clsx(
                'mr-3 h-5 w-5 flex-shrink-0',
                active
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
              )}
            />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * 模块状态指示器
 */
export const ModuleStatusIndicator: React.FC = () => {
  const { core, initialized } = useCore()

  const moduleStats = useMemo(() => {
    if (!initialized || !core) {
      return {
        total: 0,
        active: 0,
        inactive: 0
      }
    }

    try {
      const moduleManager = core.getModuleManager()
      const modules = moduleManager.getRegisteredModules()
      const activeModules = moduleManager.getActiveModules()

      return {
        total: modules.length,
        active: activeModules.length,
        inactive: modules.length - activeModules.length
      }
    } catch (error) {
      console.warn('Failed to get module stats:', error)
      return {
        total: 0,
        active: 0,
        inactive: 0
      }
    }
  }, [core, initialized])

  return (
    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
      <div className="flex items-center justify-between">
        <span>模块状态</span>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
            {moduleStats.active}
          </span>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span>{moduleStats.total}</span>
        </div>
      </div>
    </div>
  )
}
