import { useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'

interface WindowState {
  width: number
  height: number
  x: number
  y: number
  maximized: boolean
}

/**
 * 窗口状态持久化钩子
 * 保存和恢复窗口的大小、位置和最大化状态
 */
export const useWindowState = () => {
  useEffect(() => {
    let window: any = null
    let saveTimeout: NodeJS.Timeout | null = null

    const initializeWindow = async () => {
      try {
        // 检查是否在Tauri环境中
        if (typeof window !== 'undefined' && (window as any).__TAURI__ === undefined) {
          return
        }

        window = getCurrentWindow()

        // 恢复窗口状态
        await restoreWindowState()

        // 监听窗口事件
        const unlistenResize = await window.listen('tauri://resize', () => {
          scheduleStateSave()
        })

        const unlistenMove = await window.listen('tauri://move', () => {
          scheduleStateSave()
        })

        // 清理函数
        return () => {
          unlistenResize()
          unlistenMove()
          if (saveTimeout) {
            clearTimeout(saveTimeout)
          }
        }
      } catch (error) {
        console.warn('Failed to initialize window state management:', error)
      }
    }

    const scheduleStateSave = () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
      // 延迟保存，避免频繁写入
      saveTimeout = setTimeout(saveWindowState, 500)
    }

    const saveWindowState = async () => {
      try {
        if (!window) return

        const size = await window.innerSize()
        const position = await window.innerPosition()
        const isMaximized = await window.isMaximized()

        const state: WindowState = {
          width: size.width,
          height: size.height,
          x: position.x,
          y: position.y,
          maximized: isMaximized,
        }

        // 保存到本地存储
        localStorage.setItem('minglog-window-state', JSON.stringify(state))

        // 也可以保存到后端数据库
        try {
          await invoke('save_window_state', { state })
        } catch (error) {
          // 忽略后端保存错误，使用本地存储作为备份
          console.debug('Failed to save window state to backend:', error)
        }
      } catch (error) {
        console.warn('Failed to save window state:', error)
      }
    }

    const restoreWindowState = async () => {
      try {
        if (!window) return

        // 首先尝试从本地存储恢复
        const savedState = localStorage.getItem('minglog-window-state')
        let state: WindowState | null = null

        if (savedState) {
          try {
            state = JSON.parse(savedState)
          } catch (error) {
            console.warn('Failed to parse saved window state:', error)
          }
        }

        // 如果本地存储没有，尝试从后端恢复
        if (!state) {
          try {
            state = await invoke('get_window_state')
          } catch (error) {
            console.debug('Failed to get window state from backend:', error)
          }
        }

        if (state && isValidWindowState(state)) {
          // 恢复窗口状态
          if (state.maximized) {
            await window.maximize()
          } else {
            await window.setSize({ width: state.width, height: state.height })
            await window.setPosition({ x: state.x, y: state.y })
          }
        }
      } catch (error) {
        console.warn('Failed to restore window state:', error)
      }
    }

    const isValidWindowState = (state: any): state is WindowState => {
      return (
        state &&
        typeof state.width === 'number' &&
        typeof state.height === 'number' &&
        typeof state.x === 'number' &&
        typeof state.y === 'number' &&
        typeof state.maximized === 'boolean' &&
        state.width > 0 &&
        state.height > 0 &&
        state.width <= 4096 &&
        state.height <= 4096
      )
    }

    // 初始化
    const cleanup = initializeWindow()

    // 页面卸载时保存状态
    const handleBeforeUnload = () => {
      saveWindowState()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      cleanup.then(fn => fn && fn())
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [])
}

/**
 * 窗口控制钩子
 * 提供窗口最小化、最大化、关闭等操作
 */
export const useWindowControls = () => {
  const minimizeWindow = async () => {
    try {
      const window = getCurrentWindow()
      await window.minimize()
    } catch (error) {
      console.warn('Failed to minimize window:', error)
    }
  }

  const maximizeWindow = async () => {
    try {
      const window = getCurrentWindow()
      const isMaximized = await window.isMaximized()
      if (isMaximized) {
        await window.unmaximize()
      } else {
        await window.maximize()
      }
    } catch (error) {
      console.warn('Failed to toggle maximize window:', error)
    }
  }

  const closeWindow = async () => {
    try {
      const window = getCurrentWindow()
      await window.close()
    } catch (error) {
      console.warn('Failed to close window:', error)
    }
  }

  const hideWindow = async () => {
    try {
      const window = getCurrentWindow()
      await window.hide()
    } catch (error) {
      console.warn('Failed to hide window:', error)
    }
  }

  const showWindow = async () => {
    try {
      const window = getCurrentWindow()
      await window.show()
      await window.setFocus()
    } catch (error) {
      console.warn('Failed to show window:', error)
    }
  }

  return {
    minimizeWindow,
    maximizeWindow,
    closeWindow,
    hideWindow,
    showWindow,
  }
}
