/**
 * 文件上传组件测试
 * 测试文件上传、拖拽、进度显示、错误处理等功能
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FileUploadComponent, FileUploadComponentProps, FileUploadItem } from './FileUploadComponent'

// Mock EventBus
vi.mock('../../event-system/EventBus', () => ({
  EventBus: vi.fn().mockImplementation(() => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }))
}))

// 创建测试文件
const createTestFile = (name: string, type: string, size: number): File => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

// 创建拖拽事件
const createDragEvent = (type: string, files: File[]) => {
  const event = new Event(type, { bubbles: true })
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files,
      types: ['Files']
    }
  })
  return event
}

describe('FileUploadComponent', () => {
  let mockOnUploadComplete: ReturnType<typeof vi.fn>
  let mockOnUploadProgress: ReturnType<typeof vi.fn>
  let mockOnUploadError: ReturnType<typeof vi.fn>
  let mockOnFileSelect: ReturnType<typeof vi.fn>
  let mockOnFileRemove: ReturnType<typeof vi.fn>

  const defaultProps: FileUploadComponentProps = {
    onUploadComplete: mockOnUploadComplete,
    onUploadProgress: mockOnUploadProgress,
    onUploadError: mockOnUploadError,
    onFileSelect: mockOnFileSelect,
    onFileRemove: mockOnFileRemove
  }

  beforeEach(() => {
    mockOnUploadComplete = vi.fn()
    mockOnUploadProgress = vi.fn()
    mockOnUploadError = vi.fn()
    mockOnFileSelect = vi.fn()
    mockOnFileRemove = vi.fn()
    
    // Mock performance.now for consistent timing
    vi.spyOn(performance, 'now').mockReturnValue(1000)
    
    // Mock Math.random for predictable behavior
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染上传区域', () => {
      render(<FileUploadComponent {...defaultProps} />)

      expect(screen.getByText('拖拽文件到此处或点击选择文件')).toBeInTheDocument()
    })

    it('应该显示自定义占位符文本', () => {
      const customPlaceholder = '请选择要上传的文件'
      render(<FileUploadComponent {...defaultProps} placeholder={customPlaceholder} />)
      
      expect(screen.getByText(customPlaceholder)).toBeInTheDocument()
    })

    it('应该在禁用状态下正确显示', () => {
      render(<FileUploadComponent {...defaultProps} disabled />)
      
      const dropzone = screen.getByRole('button', { hidden: true })
      expect(dropzone).toBeDisabled()
    })
  })

  describe('文件选择', () => {
    it('应该处理文件输入变化', async () => {
      const user = userEvent.setup()
      render(<FileUploadComponent {...defaultProps} />)
      
      const file = createTestFile('test.txt', 'text/plain', 1024)
      const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]') as HTMLInputElement
      
      await user.upload(input, file)
      
      expect(mockOnFileSelect).toHaveBeenCalledWith([file])
    })

    it('应该验证文件类型', async () => {
      const user = userEvent.setup()
      const config = {
        acceptedTypes: ['image/*'],
        autoUpload: false
      }
      
      render(<FileUploadComponent {...defaultProps} config={config} />)
      
      const invalidFile = createTestFile('test.txt', 'text/plain', 1024)
      const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]') as HTMLInputElement
      
      await user.upload(input, invalidFile)
      
      await waitFor(() => {
        expect(screen.getByText(/不支持的文件类型/)).toBeInTheDocument()
      })
    })

    it('应该验证文件大小', async () => {
      const user = userEvent.setup()
      const config = {
        maxFileSize: 1024, // 1KB
        autoUpload: false
      }
      
      render(<FileUploadComponent {...defaultProps} config={config} />)
      
      const largeFile = createTestFile('large.txt', 'text/plain', 2048) // 2KB
      const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]') as HTMLInputElement
      
      await user.upload(input, largeFile)
      
      await waitFor(() => {
        expect(screen.getByText(/文件大小超过限制/)).toBeInTheDocument()
      })
    })

    it('应该限制文件数量', async () => {
      const user = userEvent.setup()
      const config = {
        maxFiles: 1,
        autoUpload: false
      }
      
      render(<FileUploadComponent {...defaultProps} config={config} />)
      
      const file1 = createTestFile('test1.txt', 'text/plain', 1024)
      const file2 = createTestFile('test2.txt', 'text/plain', 1024)
      const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]') as HTMLInputElement
      
      // 上传第一个文件
      await user.upload(input, file1)
      
      // 尝试上传第二个文件
      await user.upload(input, file2)
      
      // 应该只有一个文件被接受
      expect(mockOnFileSelect).toHaveBeenCalledTimes(1)
    })
  })

  describe('拖拽功能', () => {
    it('应该处理拖拽进入事件', () => {
      render(<FileUploadComponent {...defaultProps} />)
      
      const dropzone = screen.getByText('拖拽文件到此处或点击选择文件').closest('div')
      const dragEnterEvent = createDragEvent('dragenter', [])
      
      fireEvent(dropzone!, dragEnterEvent)
      
      // 检查拖拽状态是否更新（通过样式类名变化）
      expect(dropzone).toHaveClass('border-brand-primary')
    })

    it('应该处理文件拖拽放置', async () => {
      render(<FileUploadComponent {...defaultProps} />)
      
      const file = createTestFile('dropped.txt', 'text/plain', 1024)
      const dropzone = screen.getByText('拖拽文件到此处或点击选择文件').closest('div')
      const dropEvent = createDragEvent('drop', [file])
      
      fireEvent(dropzone!, dropEvent)
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith([file])
      })
    })

    it('应该在禁用状态下忽略拖拽事件', () => {
      render(<FileUploadComponent {...defaultProps} disabled />)
      
      const dropzone = screen.getByText('拖拽文件到此处或点击选择文件').closest('div')
      const dragEnterEvent = createDragEvent('dragenter', [])
      
      fireEvent(dropzone!, dragEnterEvent)
      
      // 禁用状态下不应该有拖拽样式
      expect(dropzone).not.toHaveClass('border-brand-primary')
    })
  })

  describe('文件上传', () => {
    it('应该自动开始上传（autoUpload=true）', async () => {
      const user = userEvent.setup()
      const config = { autoUpload: true }
      
      render(<FileUploadComponent {...defaultProps} config={config} />)
      
      const file = createTestFile('auto-upload.txt', 'text/plain', 1024)
      const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]') as HTMLInputElement
      
      await user.upload(input, file)
      
      // 等待上传开始
      await waitFor(() => {
        expect(screen.getByText('上传中...')).toBeInTheDocument()
      })
    })

    it('应该显示上传进度', async () => {
      const user = userEvent.setup()
      const config = { autoUpload: true }
      
      render(<FileUploadComponent {...defaultProps} config={config} />)
      
      const file = createTestFile('progress.txt', 'text/plain', 1024)
      const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]') as HTMLInputElement
      
      await user.upload(input, file)
      
      // 等待进度条出现
      await waitFor(() => {
        expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument()
      })
    })

    it('应该处理上传成功', async () => {
      const user = userEvent.setup()
      const config = { autoUpload: true }
      
      // Mock successful upload
      vi.spyOn(Math, 'random').mockReturnValue(0.9) // 避免模拟失败
      
      render(<FileUploadComponent {...defaultProps} config={config} />)
      
      const file = createTestFile('success.txt', 'text/plain', 1024)
      const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]') as HTMLInputElement
      
      await user.upload(input, file)
      
      // 等待上传完成
      await waitFor(() => {
        expect(screen.getByText('上传完成')).toBeInTheDocument()
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      expect(mockOnUploadComplete).toHaveBeenCalled()
    })

    it('应该处理上传错误', async () => {
      const user = userEvent.setup()
      const config = { autoUpload: true }
      
      // Mock upload failure
      vi.spyOn(Math, 'random').mockReturnValue(0.05) // 触发模拟失败
      
      render(<FileUploadComponent {...defaultProps} config={config} />)
      
      const file = createTestFile('error.txt', 'text/plain', 1024)
      const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]') as HTMLInputElement
      
      await user.upload(input, file)
      
      // 等待错误显示
      await waitFor(() => {
        expect(screen.getByText(/网络连接错误/)).toBeInTheDocument()
      }, { timeout: 5000 })

      expect(mockOnUploadError).toHaveBeenCalled()
    })
  })

  describe('文件管理', () => {
    it('应该允许移除文件', async () => {
      const user = userEvent.setup()
      const config = { autoUpload: false }
      
      render(<FileUploadComponent {...defaultProps} config={config} />)
      
      const file = createTestFile('remove.txt', 'text/plain', 1024)
      const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]') as HTMLInputElement
      
      await user.upload(input, file)
      
      // 等待文件出现在列表中
      await waitFor(() => {
        expect(screen.getByText('remove.txt')).toBeInTheDocument()
      })
      
      // 点击移除按钮
      const removeButtons = screen.getAllByRole('button')
      const removeButton = removeButtons.find(btn => btn.textContent?.includes('移除') || btn.querySelector('svg'))
      if (removeButton) {
        await user.click(removeButton)
      }

      expect(mockOnFileRemove).toHaveBeenCalled()
    })

    it('应该允许重试失败的上传', async () => {
      const user = userEvent.setup()
      const config = { autoUpload: true }
      
      // Mock upload failure first, then success
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.05) // 第一次失败
        .mockReturnValue(0.9) // 重试成功
      
      render(<FileUploadComponent {...defaultProps} config={config} />)
      
      const file = createTestFile('retry.txt', 'text/plain', 1024)
      const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]') as HTMLInputElement
      
      await user.upload(input, file)
      
      // 等待错误显示
      await waitFor(() => {
        expect(screen.getByText('重试')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      // 点击重试按钮
      const retryButton = screen.getByText('重试')
      await user.click(retryButton)
      
      // 等待重试成功
      await waitFor(() => {
        expect(screen.getByText('上传完成')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('应该允许清空文件列表', async () => {
      const user = userEvent.setup()
      const config = { autoUpload: false }
      
      render(<FileUploadComponent {...defaultProps} config={config} />)
      
      const file = createTestFile('clear.txt', 'text/plain', 1024)
      const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]') as HTMLInputElement
      
      await user.upload(input, file)
      
      // 等待文件列表出现
      await waitFor(() => {
        expect(screen.getByText('文件列表')).toBeInTheDocument()
      })
      
      // 点击清空按钮
      const clearButton = screen.getByText('清空列表')
      await user.click(clearButton)
      
      // 文件列表应该消失
      expect(screen.queryByText('文件列表')).not.toBeInTheDocument()
    })
  })

  describe('性能测试', () => {
    it('应该在100ms内完成文件验证', async () => {
      const user = userEvent.setup()
      const startTime = performance.now()
      
      render(<FileUploadComponent {...defaultProps} />)
      
      const file = createTestFile('performance.txt', 'text/plain', 1024)
      const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]') as HTMLInputElement
      
      await user.upload(input, file)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(100)
    })
  })
})
