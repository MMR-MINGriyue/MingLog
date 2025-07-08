/**
 * 核心上下文
 * 为React组件提供模块化架构的访问
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { MingLogCore } from '@minglog/core'
import { appCore } from '../core/AppCore'

interface CoreContextValue {
  core: MingLogCore | null
  initialized: boolean
  loading: boolean
  error: string | null
}

const CoreContext = createContext<CoreContextValue>({
  core: null,
  initialized: false,
  loading: true,
  error: null
})

interface CoreProviderProps {
  children: ReactNode
}

export const CoreProvider: React.FC<CoreProviderProps> = ({ children }) => {
  const [core, setCore] = useState<MingLogCore | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeCore = async () => {
      try {
        setLoading(true)
        setError(null)

        // 初始化应用核心
        await appCore.initialize()
        
        // 获取核心实例
        const coreInstance = appCore.getCore()
        setCore(coreInstance)
        setInitialized(true)

        console.log('Core context initialized')

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '初始化失败'
        setError(errorMessage)
        console.error('Failed to initialize core context:', err)
      } finally {
        setLoading(false)
      }
    }

    initializeCore()

    // 清理函数
    return () => {
      if (appCore.isInitialized()) {
        appCore.destroy().catch(console.error)
      }
    }
  }, [])

  const value: CoreContextValue = {
    core,
    initialized,
    loading,
    error
  }

  return (
    <CoreContext.Provider value={value}>
      {children}
    </CoreContext.Provider>
  )
}

/**
 * 使用核心上下文的Hook
 */
export const useCore = (): CoreContextValue => {
  const context = useContext(CoreContext)
  if (!context) {
    throw new Error('useCore must be used within a CoreProvider')
  }
  return context
}

/**
 * 获取核心实例的Hook（确保已初始化）
 */
export const useCoreInstance = (): MingLogCore => {
  const { core, initialized, error } = useCore()
  
  if (error) {
    throw new Error(`Core initialization failed: ${error}`)
  }
  
  if (!initialized || !core) {
    throw new Error('Core not initialized')
  }
  
  return core
}

/**
 * 加载状态组件
 */
export const CoreLoadingScreen: React.FC = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          正在初始化 MingLog
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          请稍候，正在加载模块化架构...
        </p>
      </div>
    </div>
  )
}

/**
 * 错误状态组件
 */
export const CoreErrorScreen: React.FC<{ error: string }> = ({ error }) => {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          初始化失败
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error}
        </p>
        
        <button
          onClick={handleRetry}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  )
}

/**
 * 核心包装组件
 * 处理加载和错误状态
 */
export const CoreWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { loading, error } = useCore()

  if (loading) {
    return <CoreLoadingScreen />
  }

  if (error) {
    return <CoreErrorScreen error={error} />
  }

  return <>{children}</>
}
