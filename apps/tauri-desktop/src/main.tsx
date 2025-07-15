import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Initialize i18n
import './i18n'

// Import Tauri API for desktop functionality
// TODO: 修复Tauri API导入
// import { getCurrentWindow } from '@tauri-apps/api/window'

// Initialize Tauri app
async function initializeApp() {
  try {
    // Set up window properties
    const appWindow = getCurrentWindow()
    await appWindow.setTitle('MingLog Desktop')
    
    // Prevent default context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })
    
    // Handle window close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F11') {
        appWindow.toggleMaximize()
      }
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault()
        window.location.reload()
      }
    })
    
    console.log('MingLog Desktop initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Tauri app:', error)
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp)

// Hide loading screen and show app
function showApp() {
  const loadingScreen = document.getElementById('loading-screen')
  const appElement = document.getElementById('app')

  if (loadingScreen) {
    loadingScreen.style.display = 'none'
  }
  if (appElement) {
    appElement.style.display = 'block'
  }
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// Show app after React has rendered
setTimeout(showApp, 100)
