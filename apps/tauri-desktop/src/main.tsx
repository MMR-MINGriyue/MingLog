import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Initialize i18n
import './i18n'

// Initialize global error handling
import './utils/errorHandler'

// Initialize app (兼容浏览器和Tauri环境)
function initializeApp() {
  // 立即设置事件监听器（同步）
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
      e.preventDefault()
      window.location.reload()
    }
  })

  // 异步初始化Tauri功能（如果可用）
  setTimeout(async () => {
    try {
      // 检查是否在Tauri环境中
      if (window.__TAURI__) {
        const { appWindow } = await import('@tauri-apps/api/window')
        await appWindow.setTitle('MingLog Desktop')

        // 添加F11全屏切换
        document.addEventListener('keydown', (e) => {
          if (e.key === 'F11') {
            appWindow.toggleMaximize()
          }
        })

        console.log('MingLog Desktop (Tauri) initialized successfully')
      } else {
        console.log('MingLog Desktop (Browser) initialized successfully')
      }
    } catch (error) {
      console.error('Failed to initialize app:', error)
    }
  }, 0)
}

// 立即初始化（不等待DOM）
initializeApp()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
