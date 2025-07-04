import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { useNotifications } from '../components/NotificationSystem'

interface FileDropEvent {
  paths: string[]
}

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

/**
 * 文件拖放区域钩子
 * 支持拖放Markdown文件到应用中进行导入
 */
export const useFileDropZone = () => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

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
    let unlistenFileDrop: (() => void) | null = null
    let unlistenDragOver: (() => void) | null = null
    let unlistenDragLeave: (() => void) | null = null

    const setupFileDropListeners = async () => {
      try {
        // 检查是否在Tauri环境中
        if (typeof window !== 'undefined' && (window as any).__TAURI__ === undefined) {
          return
        }

        // 监听文件拖放事件
        unlistenFileDrop = await listen<FileDropEvent>('tauri://file-drop', async (event) => {
          setIsDragOver(false)
          await handleFileDrop(event.payload.paths)
        })

        // 监听拖拽悬停事件
        unlistenDragOver = await listen('tauri://file-drop-hover', () => {
          setIsDragOver(true)
        })

        // 监听拖拽离开事件
        unlistenDragLeave = await listen('tauri://file-drop-cancelled', () => {
          setIsDragOver(false)
        })

      } catch (error) {
        console.warn('Failed to setup file drop listeners:', error)
      }
    }

    const handleFileDrop = async (paths: string[]) => {
      if (paths.length === 0) return

      setIsImporting(true)

      try {
        // 过滤出Markdown文件
        const markdownFiles = paths.filter(path => 
          path.toLowerCase().endsWith('.md') || 
          path.toLowerCase().endsWith('.markdown')
        )

        if (markdownFiles.length === 0) {
          addNotification({
            type: 'warning',
            title: '不支持的文件类型',
            message: '请拖放Markdown文件（.md或.markdown）',
            duration: 4000,
          })
          return
        }

        // 显示开始导入通知
        addNotification({
          type: 'info',
          title: '开始导入文件',
          message: `正在导入 ${markdownFiles.length} 个Markdown文件...`,
          duration: 3000,
        })

        // 调用后端导入API
        const result: ImportResult = await invoke('import_markdown_files', {
          filePaths: markdownFiles
        })

        // 显示导入结果
        if (result.success > 0) {
          addNotification({
            type: 'success',
            title: '导入成功',
            message: `成功导入 ${result.success} 个文件${result.failed > 0 ? `，${result.failed} 个文件导入失败` : ''}`,
            duration: 5000,
          })
        }

        if (result.failed > 0) {
          addNotification({
            type: 'error',
            title: '部分导入失败',
            message: `${result.failed} 个文件导入失败：${result.errors.join(', ')}`,
            duration: 8000,
          })
        }

      } catch (error) {
        console.error('File import failed:', error)
        addNotification({
          type: 'error',
          title: '导入失败',
          message: `文件导入过程中发生错误：${error}`,
          duration: 6000,
        })
      } finally {
        setIsImporting(false)
      }
    }

    setupFileDropListeners()

    return () => {
      unlistenFileDrop?.()
      unlistenDragOver?.()
      unlistenDragLeave?.()
    }
  }, [addNotification])

  return {
    isDragOver,
    isImporting,
  }
}

/**
 * 文件操作钩子
 * 提供文件导入、导出等操作
 */
export const useFileOperations = () => {
  const { addNotification } = useNotifications()

  const importMarkdownFiles = async () => {
    try {
      const result: ImportResult = await invoke('import_markdown_files_with_dialog')
      
      if (result.success > 0) {
        addNotification({
          type: 'success',
          title: '导入成功',
          message: `成功导入 ${result.success} 个文件`,
          duration: 4000,
        })
      }

      if (result.failed > 0) {
        addNotification({
          type: 'warning',
          title: '部分导入失败',
          message: `${result.failed} 个文件导入失败`,
          duration: 5000,
        })
      }

      return result
    } catch (error) {
      addNotification({
        type: 'error',
        title: '导入失败',
        message: `文件导入失败：${error}`,
        duration: 5000,
      })
      throw error
    }
  }

  const exportPages = async () => {
    try {
      const result = await invoke('export_pages_with_dialog')
      
      addNotification({
        type: 'success',
        title: '导出成功',
        message: '页面已成功导出到选定文件夹',
        duration: 4000,
      })

      return result
    } catch (error) {
      addNotification({
        type: 'error',
        title: '导出失败',
        message: `页面导出失败：${error}`,
        duration: 5000,
      })
      throw error
    }
  }

  const createBackup = async () => {
    try {
      const result = await invoke('create_backup_with_dialog')
      
      addNotification({
        type: 'success',
        title: '备份成功',
        message: '数据备份已创建完成',
        duration: 4000,
      })

      return result
    } catch (error) {
      addNotification({
        type: 'error',
        title: '备份失败',
        message: `数据备份失败：${error}`,
        duration: 5000,
      })
      throw error
    }
  }

  return {
    importMarkdownFiles,
    exportPages,
    createBackup,
  }
}

/**
 * 拖放覆盖层组件的样式和行为
 */
export const useDropOverlay = (isDragOver: boolean, isImporting: boolean) => {
  const overlayStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    backdropFilter: 'blur(4px)',
    display: isDragOver || isImporting ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    border: '3px dashed #3b82f6',
    borderRadius: '12px',
    margin: '20px',
  }

  const contentStyle = {
    textAlign: 'center' as const,
    color: '#1e40af',
    fontSize: '24px',
    fontWeight: '600',
    padding: '40px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
  }

  return {
    overlayStyle,
    contentStyle,
  }
}
