/**
 * 模块化路由系统
 * 动态加载模块路由并集成到应用路由中
 */

import React, { useMemo, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ModuleRoute } from '@minglog/core'
import { useCoreInstance } from '../contexts/CoreContext'
import ModularSettingsPage from '../pages/ModularSettingsPage'
import NotesPage from '../pages/NotesPage'
// import { NotesModule } from '../components/modules/NotesModule'

// 模块组件懒加载包装器
const ModuleComponentWrapper: React.FC<{ 
  component: React.ComponentType<any>
  [key: string]: any 
}> = ({ component: Component, ...props }) => {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载模块中...</p>
        </div>
      </div>
    }>
      <Component {...props} />
    </Suspense>
  )
}

// 路由加载错误边界
class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              页面加载失败
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || '未知错误'}
            </p>
            
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export const ModularRouter: React.FC = () => {
  const core = useCoreInstance()

  // 获取所有激活模块的路由
  const moduleRoutes = useMemo(() => {
    const routes: ModuleRoute[] = []
    const moduleManager = (core as any).getModuleManager?.() || { getActiveModules: () => [] } // TODO: 修复模块管理器
    const activeModules = moduleManager.getActiveModules()

    for (const module of activeModules) {
      if (module.getRoutes) {
        const moduleRoutes = module.getRoutes()
        routes.push(...moduleRoutes)
      }
    }

    return routes
  }, [core])

  // 渲染模块路由
  const renderModuleRoutes = () => {
    return moduleRoutes.map((route, index) => (
      <Route
        key={`${route.path}-${index}`}
        path={route.path}
        element={
          <RouteErrorBoundary>
            <ModuleComponentWrapper component={route.component} />
          </RouteErrorBoundary>
        }
      />
    ))
  }

  return (
    <Routes>
      {/* 默认重定向到笔记页面 */}
      <Route path="/" element={<Navigate to="/notes" replace />} />

      {/* 笔记页面 */}
      <Route
        path="/notes"
        element={
          <RouteErrorBoundary>
            <NotesPage />
          </RouteErrorBoundary>
        }
      />

      {/* 笔记详情页面 */}
      <Route
        path="/notes/:noteId"
        element={
          <RouteErrorBoundary>
            <NotesPage />
          </RouteErrorBoundary>
        }
      />

      {/* 模块管理页面 */}
      <Route
        path="/modules"
        element={
          <RouteErrorBoundary>
            <ModuleManagerPage />
          </RouteErrorBoundary>
        }
      />

      {/* 设置页面 */}
      <Route
        path="/settings"
        element={
          <RouteErrorBoundary>
            <ModularSettingsPage />
          </RouteErrorBoundary>
        }
      />

      {/* 动态模块路由 */}
      {renderModuleRoutes()}

      {/* 404页面 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

// 模块管理页面组件
const ModuleManagerPage: React.FC = () => {
  return (
    <div className="h-full p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">模块管理</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">模块管理功能</h3>
            <p className="text-gray-600">模块管理功能正在开发中，敬请期待。</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 404页面组件
const NotFoundPage: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          页面不存在
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          您访问的页面可能已被删除或不存在
        </p>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-4"
        >
          返回上页
        </button>
        <button
          type="button"
          onClick={() => window.location.href = '/notes'}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          回到首页
        </button>
      </div>
    </div>
  )
}
