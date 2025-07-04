import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../components/NotificationSystem'

/**
 * 系统托盘事件处理钩子
 * 监听来自系统托盘的事件并执行相应操作
 */
export const useSystemTray = () => {
  const navigate = useNavigate()

  // 安全地获取通知功能，如果Provider不可用则使用fallback
  let addNotification: any
  try {
    const notifications = useNotifications()
    addNotification = notifications.addNotification
  } catch (error) {
    // Fallback: 如果NotificationProvider不可用，使用console.log
    addNotification = (notification: any) => {
      console.log('Notification:', notification.title, notification.message)
    }
  }

  useEffect(() => {
    let unlistenNewNote: (() => void) | undefined
    let unlistenSync: (() => void) | undefined
    let unlistenSettings: (() => void) | undefined

    const setupListeners = async () => {
      try {
        // 监听新建笔记事件
        unlistenNewNote = await listen('new-note', () => {
          navigate('/notes/new')
          addNotification({
            type: 'info',
            title: '新建笔记',
            message: '正在创建新笔记...',
            duration: 2000,
          })
        })

        // 监听同步事件
        unlistenSync = await listen('start-sync', async () => {
          try {
            // 这里可以调用同步API
            addNotification({
              type: 'info',
              title: '开始同步',
              message: '正在同步数据到WebDAV服务器...',
              duration: 3000,
            })

            // TODO: 实际调用同步API
            // await invoke('start_webdav_sync')
          } catch (error) {
            addNotification({
              type: 'error',
              title: '同步失败',
              message: '无法启动同步，请检查网络连接和WebDAV配置',
              duration: 5000,
            })
          }
        })

        // 监听导航到设置页面事件
        unlistenSettings = await listen('navigate-to-settings', () => {
          navigate('/settings')
          addNotification({
            type: 'info',
            title: '打开设置',
            message: '正在打开设置页面...',
            duration: 2000,
          })
        })
      } catch (error) {
        console.error('Failed to setup system tray listeners:', error)
      }
    }

    setupListeners()

    // 清理监听器
    return () => {
      // 清理所有事件监听器
      if (unlistenNewNote) {
        unlistenNewNote()
      }
      if (unlistenSync) {
        unlistenSync()
      }
      if (unlistenSettings) {
        unlistenSettings()
      }
    }
  }, [navigate, addNotification])
}

/**
 * 桌面通知钩子
 * 提供发送桌面通知的功能
 */
export const useDesktopNotifications = () => {
  const sendNotification = async (
    title: string,
    body: string,
    icon?: string
  ) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('send_notification', { title, body, icon })
    } catch (error) {
      console.warn('Failed to send desktop notification:', error)
    }
  }

  const sendSyncNotification = async (
    status: 'success' | 'error' | 'progress',
    message: string
  ) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('send_sync_notification', { status, message })
    } catch (error) {
      console.warn('Failed to send sync notification:', error)
    }
  }

  const sendReminderNotification = async (
    reminderText: string,
    dueTime: string
  ) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('send_reminder_notification', { 
        reminderText, 
        dueTime 
      })
    } catch (error) {
      console.warn('Failed to send reminder notification:', error)
    }
  }

  return {
    sendNotification,
    sendSyncNotification,
    sendReminderNotification,
  }
}
