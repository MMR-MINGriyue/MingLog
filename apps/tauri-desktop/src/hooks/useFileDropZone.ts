import { useState, useCallback, useRef, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { useNotifications } from '../components/NotificationSystem'

interface DroppedFile {
  name: string
  path: string
  size: number
  type: string
  lastModified: number
}

interface FileDropZoneOptions {
  accept?: string[]
  maxFiles?: number
  maxSize?: number // in bytes
  onDrop?: (files: DroppedFile[]) => void
  onError?: (error: string) => void
  disabled?: boolean
}

interface UseFileDropZoneReturn {
  isDragOver: boolean
  isProcessing: boolean
  isImporting: boolean
  droppedFiles: DroppedFile[]
  error: string | null
  getRootProps: () => {
    onDragEnter: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
  }
  getInputProps: () => {
    type: 'file'
    multiple: boolean
    accept: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  }
  clearFiles: () => void
  removeFile: (index: number) => void
}

export const useFileDropZone = (options: FileDropZoneOptions = {}): UseFileDropZoneReturn => {
  const {
    accept = [],
    maxFiles = 10,
    maxSize = 10 * 1024 * 1024, // 10MB default
    onDrop,
    onError,
    disabled = false
  } = options

  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([])
  const [error, setError] = useState<string | null>(null)

  const dragCounterRef = useRef(0)
  const unlistenRef = useRef<UnlistenFn | null>(null)

  // Use notification system
  const { addNotification } = useNotifications()

  // Validate file type
  const isValidFileType = useCallback((fileName: string): boolean => {
    if (accept.length === 0) return true
    
    const extension = fileName.toLowerCase().split('.').pop()
    return accept.some(acceptedType => {
      if (acceptedType.startsWith('.')) {
        return acceptedType.toLowerCase() === `.${extension}`
      }
      if (acceptedType.includes('/')) {
        // MIME type check
        return fileName.toLowerCase().includes(acceptedType.split('/')[1])
      }
      return false
    })
  }, [accept])

  // Validate file size
  const isValidFileSize = useCallback((size: number): boolean => {
    return size <= maxSize
  }, [maxSize])

  // Process files (either from drag & drop or file input)
  const processFiles = useCallback(async (files: File[] | FileList) => {
    if (disabled) return

    setIsProcessing(true)
    setError(null)

    try {
      const fileArray = Array.from(files)
      
      // Check file count
      if (fileArray.length > maxFiles) {
        throw new Error(`Too many files. Maximum ${maxFiles} files allowed.`)
      }

      const validFiles: DroppedFile[] = []
      const errors: string[] = []

      for (const file of fileArray) {
        // Validate file type
        if (!isValidFileType(file.name)) {
          errors.push(`${file.name}: Invalid file type`)
          continue
        }

        // Validate file size
        if (!isValidFileSize(file.size)) {
          errors.push(`${file.name}: File too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`)
          continue
        }

        // For web environment, we'll use the file object directly
        // In Tauri, we might need to handle file paths differently
        const droppedFile: DroppedFile = {
          name: file.name,
          path: file.name, // In web context, this would be the file name
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        }

        validFiles.push(droppedFile)
      }

      if (errors.length > 0) {
        const errorMessage = errors.join(', ')
        setError(errorMessage)
        onError?.(errorMessage)
      }

      if (validFiles.length > 0) {
        setDroppedFiles(prev => [...prev, ...validFiles])
        onDrop?.(validFiles)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process files'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }, [disabled, maxFiles, maxSize, isValidFileType, isValidFileSize, onDrop, onError])

  // Drag event handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return

    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return

    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragOver(false)
    }
  }, [disabled])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return

    setIsDragOver(false)
    dragCounterRef.current = 0

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [disabled, processFiles])

  // File input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return

    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
      // Clear the input value to allow selecting the same file again
      e.target.value = ''
    }
  }, [disabled, processFiles])

  // Clear all files
  const clearFiles = useCallback(() => {
    setDroppedFiles([])
    setError(null)
  }, [])

  // Remove specific file
  const removeFile = useCallback((index: number) => {
    setDroppedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Listen for Tauri file drop events (if in Tauri environment)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.__TAURI__) {
      const setupTauriListeners = async () => {
        try {
          const unlistenFunctions: UnlistenFn[] = []

          // Listen for file drop
          const unlistenDrop = await listen('tauri://file-drop', async (event) => {
            const paths = event.payload as string[]
            // Filter for markdown files only
            const markdownPaths = paths.filter(path =>
              path.toLowerCase().endsWith('.md') || path.toLowerCase().endsWith('.markdown')
            )

            if (markdownPaths.length === 0) {
              addNotification({
                type: 'warning',
                title: '无效文件',
                message: '请拖放Markdown文件（.md或.markdown）',
                duration: 4000
              })
              return
            }

            setIsImporting(true)
            try {
              const result = await invoke('import_markdown_files', { paths: markdownPaths })

              if (result) {
                const { success, failed } = result as any
                if (failed === 0) {
                  addNotification({
                    type: 'success',
                    title: '文件导入成功',
                    message: `成功导入 ${success} 个文件`,
                    duration: 4000
                  })
                } else if (success > 0) {
                  addNotification({
                    type: 'warning',
                    title: '部分文件导入失败',
                    message: `成功导入 ${success} 个文件，${failed} 个文件导入失败`,
                    duration: 5000
                  })
                }
              }
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : '未知错误'
              addNotification({
                type: 'error',
                title: '文件导入失败',
                message: `文件导入过程中发生错误：${errorMessage}`,
                duration: 5000
              })
            } finally {
              setIsImporting(false)
            }
          })
          unlistenFunctions.push(unlistenDrop)

          // Listen for drag hover
          const unlistenHover = await listen('tauri://file-drop-hover', () => {
            setIsDragOver(true)
          })
          unlistenFunctions.push(unlistenHover)

          // Listen for drag cancelled
          const unlistenCancelled = await listen('tauri://file-drop-cancelled', () => {
            setIsDragOver(false)
          })
          unlistenFunctions.push(unlistenCancelled)

          unlistenRef.current = () => {
            unlistenFunctions.forEach(fn => {
              if (typeof fn === 'function') {
                fn()
              }
            })
          }
        } catch (err) {
          console.warn('Failed to setup Tauri file drop listeners:', err)
        }
      }

      setupTauriListeners()
    }

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current()
      }
    }
  }, [])

  // Get props for the drop zone root element
  const getRootProps = useCallback(() => ({
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop
  }), [handleDragEnter, handleDragLeave, handleDragOver, handleDrop])

  // Get props for the file input element
  const getInputProps = useCallback(() => ({
    type: 'file' as const,
    multiple: maxFiles > 1,
    accept: accept.join(','),
    onChange: handleInputChange
  }), [maxFiles, accept, handleInputChange])

  return {
    isDragOver,
    isProcessing,
    isImporting,
    droppedFiles,
    error,
    getRootProps,
    getInputProps,
    clearFiles,
    removeFile
  }
}

// useFileOperations Hook for file import operations
interface ImportResult {
  success: number
  failed: number
  files: string[]
}

interface UseFileOperationsReturn {
  importMarkdownFiles: () => Promise<ImportResult>
}

export const useFileOperations = (): UseFileOperationsReturn => {
  // Use notification system
  const { addNotification } = useNotifications()

  const importMarkdownFiles = useCallback(async (): Promise<ImportResult> => {
    try {
      const result = await invoke<ImportResult>('import_markdown_files_with_dialog')

      if (result.success === 0 && result.failed === 0) {
        // No files to import
        addNotification({
          type: 'info',
          title: '无文件导入',
          message: '没有选择任何文件',
          duration: 3000
        })
      } else if (result.failed === 0) {
        addNotification({
          type: 'success',
          title: '导入成功',
          message: `成功导入 ${result.success} 个文件`,
          duration: 4000
        })
      } else if (result.success > 0) {
        addNotification({
          type: 'warning',
          title: '部分导入失败',
          message: `${result.failed} 个文件导入失败`,
          duration: 5000
        })
      } else {
        addNotification({
          type: 'error',
          title: '导入失败',
          message: '所有文件导入失败',
          duration: 5000
        })
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'

      addNotification({
        type: 'error',
        title: '导入失败',
        message: `文件导入失败：${errorMessage}`,
        duration: 5000
      })

      throw err
    }
  }, [addNotification])

  return {
    importMarkdownFiles
  }
}

export type { DroppedFile, FileDropZoneOptions, UseFileDropZoneReturn, ImportResult, UseFileOperationsReturn }
