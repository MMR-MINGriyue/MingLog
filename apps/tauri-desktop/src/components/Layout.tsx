import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Home,
  Edit3,
  Network,
  Search,
  Settings,
  Menu,
  X,
  Plus,
  BookOpen,
  HelpCircle
} from 'lucide-react'
import { useGlobalShortcuts } from '../hooks/useKeyboardShortcuts'
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp'
import LanguageSwitcher from './LanguageSwitcher'

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

  // Listen for F1 key to show shortcuts help
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F1') {
        event.preventDefault()
        setShowShortcutsHelp(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const navigation = [
    { name: '首页', href: '/', icon: Home, description: '工作空间概览' },
    { name: '智能编辑器', href: '/editor', icon: Edit3, description: '创建和编辑笔记' },
    { name: '块编辑器', href: '/blocks', icon: BookOpen, description: 'Notion风格编辑' },
    { name: '知识图谱', href: '/graph', icon: Network, description: '可视化关联' },
    { name: '全局搜索', href: '/search', icon: Search, description: 'Ctrl+K 快速搜索' },
    { name: '设置', href: '/settings', icon: Settings, description: '个性化配置' },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="h-full flex bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 现代化侧边栏 */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-16'} transition-all duration-300 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-lg`}>
        {/* 侧边栏头部 */}
        <div className="px-4 py-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">明志</span>
                  <p className="text-xs text-gray-500 -mt-1">桌面版</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-4 py-6 space-y-3">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  active
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-md`}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon className={`${sidebarOpen ? 'mr-4' : ''} w-5 h-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                {sidebarOpen && (
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className={`text-xs ${active ? 'text-blue-100' : 'text-gray-500'} mt-0.5`}>
                      {item.description}
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* 快速操作区 */}
        {sidebarOpen && (
          <div className="px-4 py-6 border-t border-gray-200/50 space-y-4">
            <Link
              to="/editor"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl py-3 px-4 flex items-center justify-center space-x-2 hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>新建笔记</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowShortcutsHelp(true)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-2.5 px-4 flex items-center justify-center space-x-2 text-sm transition-all duration-200 hover:shadow-md"
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

        {/* 侧边栏底部信息 */}
        <div className="px-4 py-4 border-t border-gray-200/50">
          {sidebarOpen ? (
            <div className="text-center space-y-2">
              <div className="text-xs text-gray-600 font-medium">明志桌面版 v1.0.0</div>
              <div className="text-xs text-gray-500">本地优先 • 隐私安全</div>
              <div className="flex items-center justify-center space-x-1 text-xs text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>运行正常</span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 现代化标题栏 */}
        <div className="h-14 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 flex items-center justify-between px-6 drag-region shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h1 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent drag-none">
                {navigation.find(item => isActive(item.href))?.name || '明志桌面版'}
              </h1>
            </div>
          </div>

          {/* 状态信息和控制区 */}
          <div className="flex items-center space-x-4 drag-none">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>已同步</span>
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

        {/* Page Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  )
}

export default Layout
