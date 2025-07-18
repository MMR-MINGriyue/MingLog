import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Menu,
  X,
  Plus,
  HelpCircle,
  BookOpen
} from 'lucide-react'
import { useGlobalShortcuts } from '../hooks/useKeyboardShortcuts'
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp'
import LanguageSwitcher from './LanguageSwitcher'
import { ModularNavigation, ModuleStatusIndicator } from './ModularNavigation'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const location = useLocation()

  // Enable global keyboard shortcuts
  useGlobalShortcuts()

  // 获取当前页面标题
  const getPageTitle = () => {
    const path = location.pathname
    switch (path) {
      case '/':
        return '首页'
      case '/notes':
        return '笔记'
      case '/modules':
        return '模块管理'
      case '/settings':
        return '设置'
      default:
        return '明志桌面版'
    }
  }

  // Listen for F1 key to show shortcuts help
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F1') {
        event.preventDefault()
        setShowShortcutsHelp(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // 确保清理函数正确执行
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // 移除静态导航，使用模块化导航

  return (
    <div className="h-full flex macos-content">
      {/* macOS风格侧边栏 */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-16'} transition-all duration-300 flex flex-col macos-sidebar`}>
        {/* macOS风格侧边栏头部 */}
        <div className="px-4 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-500 rounded-xl shadow-sm">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-semibold text-gray-900">
                    MingLog
                  </span>
                  <p className="text-xs text-gray-500 -mt-1">
                    桌面版
                  </p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* 模块化导航菜单 */}
        <div className="flex-1 px-4 py-6">
          {sidebarOpen ? (
            <div className="space-y-4">
              <ModularNavigation />
              <ModuleStatusIndicator />
            </div>
          ) : (
            <ModularNavigation />
          )}
        </div>

        {/* macOS风格快速操作区 */}
        {sidebarOpen && (
          <div className="px-4 py-6 space-y-4 border-t border-gray-200">
            <Link
              to="/notes/new"
              className="w-full bg-blue-500 text-white rounded-xl py-3 px-4 flex items-center justify-center space-x-2 hover:bg-blue-600 hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium text-decoration-none"
            >
              <Plus className="w-5 h-5" />
              <span>新建笔记</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowShortcutsHelp(true)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2.5 px-4 flex items-center justify-center space-x-2 text-sm transition-all duration-200 hover:shadow-md"
              title="快捷键帮助"
            >
              <HelpCircle className="w-4 h-4" />
              <span>快捷键帮助</span>
            </button>

            {/* 语言切换器 */}
            <div className="pt-2">
              <LanguageSwitcher className="w-full" showLabel={true} />
            </div>
          </div>
        )}

        {/* macOS风格侧边栏底部信息 */}
        <div className="px-4 py-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="text-center space-y-2">
              <div className="text-xs font-medium text-gray-600">
                MingLog 桌面版 v1.0.0
              </div>
              <div className="text-xs text-gray-500">
                本地优先 • 隐私安全
              </div>
              <div className="flex items-center justify-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">运行正常</span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mx-auto shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* macOS风格主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* macOS风格标题栏 */}
        <div className="h-14 macos-titlebar flex items-center justify-between px-6 drag-region">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h1 className="text-lg font-semibold text-gray-900 drag-none">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* macOS风格状态信息和控制区 */}
          <div className="flex items-center space-x-4 drag-none">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">已同步</span>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('zh-CN', {
                month: 'long',
                day: 'numeric',
                weekday: 'short'
              })}
            </div>
          </div>
        </div>

        {/* macOS风格页面内容 */}
        <main className="flex-1 overflow-hidden macos-content">
          {children}
        </main>
      </div>

      {/* 键盘快捷键帮助模态框 */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  )
}

export { Layout }
