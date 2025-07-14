/**
 * 文件预览组件测试
 * 测试文件预览、媒体控制、模态框等功能
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FilePreviewComponent, type FilePreviewComponentProps } from './FilePreviewComponent'
import { FileStorageService, type FileEntity } from '../../services/FileStorageService'
import { EventBus } from '../../event-system/EventBus'
import { SearchEngine } from '../../search/SearchEngine'

// Mock FileStorageService
const mockFileStorageService = {
  getFile: vi.fn()
} as any

// 创建测试文件实体
const createTestFileEntity = (type: string, name: string): FileEntity => ({
  id: 'test-file-id',
  name: name,
  original_name: name,
  type: type,
  size: 1024 * 1024, // 1MB
  path: `/test/path/${name}`,
  checksum: 'test-checksum',
  url: `http://localhost/files/${name}`,
  thumbnail_path: undefined,
  metadata: {
    description: '测试文件',
    tags: ['测试', '预览'],
    category: 'test',
    custom_fields: {},
    permissions: {
      is_public: false,
      allow_download: true,
      allow_preview: true,
      shared_users: [],
      editors: [],
      viewers: []
    }
  },
  associations: [],
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01')
})

// Mock HTMLMediaElement
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: vi.fn().mockImplementation(() => Promise.resolve())
})

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: vi.fn()
})

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: vi.fn()
})

// Mock requestFullscreen and exitFullscreen
Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
  writable: true,
  value: vi.fn().mockImplementation(() => Promise.resolve())
})

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: vi.fn().mockImplementation(() => Promise.resolve())
})

// Mock fetch for text content
global.fetch = vi.fn()

describe('FilePreviewComponent', () => {
  let defaultProps: FilePreviewComponentProps
  let mockOnStatusChange: ReturnType<typeof vi.fn>
  let mockOnClose: ReturnType<typeof vi.fn>
  let mockOnError: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnStatusChange = vi.fn()
    mockOnClose = vi.fn()
    mockOnError = vi.fn()

    defaultProps = {
      file: createTestFileEntity('image/jpeg', 'test-image.jpg'),
      fileStorageService: mockFileStorageService,
      mode: 'inline',
      showControls: true,
      showFileInfo: true,
      allowDownload: true,
      allowFullscreen: true,
      onStatusChange: mockOnStatusChange,
      onClose: mockOnClose,
      onError: mockOnError
    }

    // Reset mocks
    mockFileStorageService.getFile.mockClear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染图片预览', async () => {
      render(<FilePreviewComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument()
      })

      expect(mockOnStatusChange).toHaveBeenCalledWith('loaded')
    })

    it('应该显示文件信息', async () => {
      render(<FilePreviewComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test-image.jpg')).toBeInTheDocument()
        expect(screen.getByText('1.00 MB')).toBeInTheDocument()
        expect(screen.getByText('image/jpeg')).toBeInTheDocument()
      })
    })

    it('应该隐藏文件信息当showFileInfo为false', async () => {
      render(<FilePreviewComponent {...defaultProps} showFileInfo={false} />)

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument()
      })

      expect(screen.queryByText('文件名:')).not.toBeInTheDocument()
    })
  })

  describe('文件类型支持', () => {
    it('应该正确渲染视频预览', async () => {
      const videoFile = createTestFileEntity('video/mp4', 'test-video.mp4')
      render(<FilePreviewComponent {...defaultProps} file={videoFile} />)

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument() // video element
      })
    })

    it('应该正确渲染音频预览', async () => {
      const audioFile = createTestFileEntity('audio/mp3', 'test-audio.mp3')
      render(<FilePreviewComponent {...defaultProps} file={audioFile} />)

      await waitFor(() => {
        expect(screen.getByText('test-audio.mp3')).toBeInTheDocument()
      })
    })

    it('应该正确渲染PDF预览', async () => {
      const pdfFile = createTestFileEntity('application/pdf', 'test-document.pdf')
      render(<FilePreviewComponent {...defaultProps} file={pdfFile} />)

      await waitFor(() => {
        expect(screen.getByTitle('test-document.pdf')).toBeInTheDocument()
      })
    })

    it('应该正确渲染文本预览', async () => {
      const textFile = createTestFileEntity('text/plain', 'test-text.txt')
      
      // Mock fetch response
      ;(global.fetch as any).mockResolvedValueOnce({
        text: () => Promise.resolve('这是测试文本内容')
      })

      render(<FilePreviewComponent {...defaultProps} file={textFile} />)

      await waitFor(() => {
        expect(screen.getByText('这是测试文本内容')).toBeInTheDocument()
      })
    })

    it('应该显示不支持的文件类型', async () => {
      const unsupportedFile = createTestFileEntity('application/x-unknown', 'test-unknown.xyz')
      render(<FilePreviewComponent {...defaultProps} file={unsupportedFile} />)

      await waitFor(() => {
        expect(screen.getByText('不支持预览此文件类型')).toBeInTheDocument()
      })
    })
  })

  describe('媒体控制', () => {
    it('应该处理视频播放控制', async () => {
      const user = userEvent.setup()
      const videoFile = createTestFileEntity('video/mp4', 'test-video.mp4')
      render(<FilePreviewComponent {...defaultProps} file={videoFile} />)

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument()
      })

      // 查找播放按钮
      const playButton = screen.getByRole('button', { name: /播放|暂停/ })
      await user.click(playButton)

      // 验证媒体播放方法被调用
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalled()
    })

    it('应该处理音频播放控制', async () => {
      const user = userEvent.setup()
      const audioFile = createTestFileEntity('audio/mp3', 'test-audio.mp3')
      render(<FilePreviewComponent {...defaultProps} file={audioFile} />)

      await waitFor(() => {
        expect(screen.getByText('test-audio.mp3')).toBeInTheDocument()
      })

      // 查找播放按钮
      const playButton = screen.getByRole('button')
      await user.click(playButton)

      expect(HTMLMediaElement.prototype.play).toHaveBeenCalled()
    })

    it('应该处理音量控制', async () => {
      const user = userEvent.setup()
      const videoFile = createTestFileEntity('video/mp4', 'test-video.mp4')
      render(<FilePreviewComponent {...defaultProps} file={videoFile} />)

      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument()
      })

      // 查找音量滑块
      const volumeSlider = screen.getByRole('slider')
      await user.clear(volumeSlider)
      await user.type(volumeSlider, '0.5')

      // 验证音量设置
      expect(volumeSlider).toHaveValue('0.5')
    })
  })

  describe('模态框模式', () => {
    it('应该在模态框模式下正确渲染', async () => {
      render(<FilePreviewComponent {...defaultProps} mode="modal" />)

      await waitFor(() => {
        expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument()
      })

      expect(screen.getByText('文件预览')).toBeInTheDocument()
    })

    it('应该处理模态框关闭', async () => {
      const user = userEvent.setup()
      render(<FilePreviewComponent {...defaultProps} mode="modal" />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /关闭/ })).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /关闭/ })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('应该处理ESC键关闭模态框', async () => {
      render(<FilePreviewComponent {...defaultProps} mode="modal" />)

      await waitFor(() => {
        expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument()
      })

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('全屏功能', () => {
    it('应该处理全屏切换', async () => {
      const user = userEvent.setup()
      render(<FilePreviewComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument()
      })

      const fullscreenButton = screen.getByTitle('全屏')
      await user.click(fullscreenButton)

      expect(HTMLElement.prototype.requestFullscreen).toHaveBeenCalled()
    })

    it('应该在不允许全屏时隐藏全屏按钮', async () => {
      render(<FilePreviewComponent {...defaultProps} allowFullscreen={false} />)

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument()
      })

      expect(screen.queryByTitle('全屏')).not.toBeInTheDocument()
    })
  })

  describe('下载功能', () => {
    it('应该处理文件下载', async () => {
      const user = userEvent.setup()
      
      // Mock createElement and click
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)

      render(<FilePreviewComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument()
      })

      const downloadButton = screen.getByTitle('下载')
      await user.click(downloadButton)

      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toBe('test-image.jpg')
    })

    it('应该在不允许下载时隐藏下载按钮', async () => {
      render(<FilePreviewComponent {...defaultProps} allowDownload={false} />)

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument()
      })

      expect(screen.queryByTitle('下载')).not.toBeInTheDocument()
    })
  })

  describe('错误处理', () => {
    it('应该处理文件加载错误', async () => {
      mockFileStorageService.getFile.mockRejectedValueOnce(new Error('文件不存在'))

      render(<FilePreviewComponent {...defaultProps} file="non-existent-id" />)

      await waitFor(() => {
        expect(screen.getByText('文件加载失败')).toBeInTheDocument()
      })

      expect(mockOnError).toHaveBeenCalledWith('文件不存在')
      expect(mockOnStatusChange).toHaveBeenCalledWith('error')
    })

    it('应该处理媒体加载错误', async () => {
      render(<FilePreviewComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument()
      })

      // 模拟图片加载错误
      const img = screen.getByRole('img')
      fireEvent.error(img)

      expect(mockOnError).toHaveBeenCalledWith('媒体加载失败')
    })

    it('应该处理文本内容加载错误', async () => {
      const textFile = createTestFileEntity('text/plain', 'test-text.txt')
      
      // Mock fetch error
      ;(global.fetch as any).mockRejectedValueOnce(new Error('网络错误'))

      render(<FilePreviewComponent {...defaultProps} file={textFile} />)

      await waitFor(() => {
        expect(screen.getByText('无法加载文本内容')).toBeInTheDocument()
      })
    })
  })

  describe('性能测试', () => {
    it('应该在100ms内完成组件渲染', async () => {
      const startTime = performance.now()
      
      render(<FilePreviewComponent {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(100)
    })

    it('应该正确处理大文件预览', async () => {
      const largeFile = createTestFileEntity('image/jpeg', 'large-image.jpg')
      largeFile.size = 50 * 1024 * 1024 // 50MB

      render(<FilePreviewComponent {...defaultProps} file={largeFile} />)

      await waitFor(() => {
        expect(screen.getByText('50.00 MB')).toBeInTheDocument()
      })
    })
  })

  describe('响应式设计', () => {
    it('应该在移动端正确显示', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      render(<FilePreviewComponent {...defaultProps} mode="modal" />)

      await waitFor(() => {
        expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument()
      })

      // 验证响应式样式应用
      const modal = screen.getByRole('dialog', { hidden: true })
      expect(modal).toHaveClass('file-preview-component')
    })
  })
})
