import React, { useState, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { CoreProvider } from './contexts/CoreContext'
import { Layout } from './components/Layout'
import { ModularRouter } from './router/ModularRouter'
import { LoadingScreen } from './components/LoadingScreen'
import { routerFutureConfig } from './config/routerConfig'

// 核心包装器组件
const CoreWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900 transition-colors">
      {children}
    </div>
  )
}

// 应用内容组件
const AppContent: React.FC = () => {
  return (
    <CoreProvider>
      <div className="h-full flex flex-col macos-content">
        <Layout>
          <ModularRouter />
        </Layout>
      </div>
    </CoreProvider>
  )
}

function App() {
  const [isLoaded, setIsLoaded] = useState(false)

  // 初始化应用
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 模拟初始化过程
        await new Promise(resolve => setTimeout(resolve, 500))
        setIsLoaded(true)
        console.log('MingLog App loaded successfully')
      } catch (error) {
        console.error('App initialization failed:', error)
        setIsLoaded(true) // 即使出错也要显示应用
      }
    }

    initializeApp()
  }, [])

  // 显示加载屏幕
  if (!isLoaded) {
    return <LoadingScreen />
  }

  // 主应用内容
  return (
    <ErrorBoundary>
      <BrowserRouter future={routerFutureConfig}>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  )
}



export default App
export { AppContent }
