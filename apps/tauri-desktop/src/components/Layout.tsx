import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
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

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
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
    { name: 'Home', href: '/', icon: Home },
    { name: 'Editor', href: '/editor', icon: Edit3 },
    { name: 'Knowledge Graph', href: '/graph', icon: Network },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-2">
                <BookOpen className="w-8 h-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">MingLog</span>
              </div>
            )}
            <button
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

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  active
                    ? 'bg-primary-100 text-primary-700 border-primary-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-transparent'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors`}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon className={`${sidebarOpen ? 'mr-3' : ''} w-5 h-5 flex-shrink-0`} />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Quick Actions */}
        {sidebarOpen && (
          <div className="px-4 py-4 border-t border-gray-200 space-y-2">
            <Link
              to="/editor"
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Note</span>
            </Link>

            <button
              onClick={() => setShowShortcutsHelp(true)}
              className="w-full btn-ghost flex items-center justify-center space-x-2 text-sm"
              title="Keyboard shortcuts (F1)"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Shortcuts</span>
            </button>
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="px-4 py-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="text-xs text-gray-500 text-center">
              <div>MingLog Desktop v1.0.0</div>
              <div className="mt-1">Knowledge Management Tool</div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="w-4 h-4 text-primary-600" />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Title Bar (for desktop app feel) */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 drag-region">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900 drag-none">
              {navigation.find(item => isActive(item.href))?.name || 'MingLog Desktop'}
            </h1>
          </div>
          
          {/* Window Controls Placeholder */}
          <div className="flex items-center space-x-2 drag-none">
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString()}
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
