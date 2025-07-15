/**
 * 核心上下文
 * 为React组件提供基本的应用状态管理
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// 简化的核心接口
interface SimplifiedCore {
  version: string
  initialized: boolean
  modules: string[]
}

interface CoreContextValue {
  core: SimplifiedCore | null
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
  const [core, setCore] = useState<SimplifiedCore | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeCore = async () => {
      try {
        setLoading(true)
        setError(null)

        // 模拟初始化过程
        await new Promise(resolve => setTimeout(resolve, 500))

        // 创建简化的核心实例
        const coreInstance: SimplifiedCore = {
          version: '1.0.0',
          initialized: true,
          modules: ['notes', 'settings']
        }

        setCore(coreInstance)
        setInitialized(true)

        console.log('Core context initialized successfully')

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '初始化失败'
        setError(errorMessage)
        console.error('Failed to initialize core context:', err)
      } finally {
        setLoading(false)
      }
    }

    initializeCore()
  }, [])

  const value: CoreContextValue = {
    core,
    initialized,
    loading,
    error
  }

  // 如果有错误，显示错误界面
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">初始化失败</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    )
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
export const useCoreInstance = (): SimplifiedCore => {
  const { core, initialized, error } = useCore()

  if (error) {
    throw new Error(`Core initialization failed: ${error}`)
  }

  if (!initialized || !core) {
    throw new Error('Core not initialized')
  }

  return core
}
