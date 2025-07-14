/**
 * 文件管理组件测试
 * 测试文件列表、搜索、过滤、排序、批量操作等功能
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FileManagerComponent, type FileManagerComponentProps } from './FileManagerComponent'
import { FileStorageService, type FileEntity } from '../../services/FileStorageService'
import { FileAssociationService } from '../../services/FileAssociationService'

// Mock services
const mockFileStorageService = {
  queryFiles: vi.fn(),
  deleteFile: vi.fn()
} as any

const mockFileAssociationService = {
  getFileAssociations: vi.fn()
} as any

// 创建测试文件实体
const createTestFileEntity = (id: string, name: string, type: string): FileEntity => ({
  id,
  name,
  original_name: name,
  type,
  size: 1024 * 1024,
  path: `/test/path/${name}`,
  checksum: `checksum-${id}`,
  url: `http://localhost/files/${id}`,
  thumbnail_path: undefined,
  metadata: {
    description: `测试文件 ${name}`,
    tags: ['测试', '文件'],
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

// Mock HTMLElement methods
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  writable: true,
  value: vi.fn()
})

describe('FileManagerComponent', () => {
  let defaultProps: FileManagerComponentProps
  let mockOnFileSelect: ReturnType<typeof vi.fn>
  let mockOnFileUploaded: ReturnType<typeof vi.fn>
  let mockOnFileDeleted: ReturnType<typeof vi.fn>
  let mockOnError: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnFileSelect = vi.fn()
    mockOnFileUploaded = vi.fn()
    mockOnFileDeleted = vi.fn()
    mockOnError = vi.fn()

    defaultProps = {
      fileStorageService: mockFileStorageService,
      fileAssociationService: mockFileAssociationService,
      initialViewMode: 'grid',
      showUpload: true,
      showPreview: true,
      showAssociations: true,
      allowBatchOperations: true,
      allowDelete: true,
      allowDownload: true,
      pageSize: 20,
      onFileSelect: mockOnFileSelect,
      onFileUploaded: mockOnFileUploaded,
      onFileDeleted: mockOnFileDeleted,
      onError: mockOnError
    }

    // Reset mocks
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockFileStorageService.queryFiles.mockResolvedValue({
      files: [
        createTestFileEntity('1', 'test1.jpg', 'image/jpeg'),
        createTestFileEntity('2', 'test2.pdf', 'application/pdf'),
        createTestFileEntity('3', 'test3.txt', 'text/plain')
      ],
      total: 3,
      hasMore: false
    })
    
    mockFileStorageService.deleteFile.mockResolvedValue({
      success: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染文件管理界面', async () => {
      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument()
        expect(screen.getByText('test2.pdf')).toBeInTheDocument()
        expect(screen.getByText('test3.txt')).toBeInTheDocument()
      })

      expect(screen.getByPlaceholderText('搜索文件...')).toBeInTheDocument()
      expect(screen.getByText('上传文件')).toBeInTheDocument()
    })

    it('应该显示正确的文件统计信息', async () => {
      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('共 3 个文件')).toBeInTheDocument()
      })
    })

    it('应该在网格和列表视图之间切换', async () => {
      const user = userEvent.setup()
      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument()
      })

      // 切换到列表视图
      const listViewButton = screen.getByTitle('列表视图')
      await user.click(listViewButton)

      // 验证列表视图元素
      expect(screen.getByText('全选 (3 个文件)')).toBeInTheDocument()

      // 切换回网格视图
      const gridViewButton = screen.getByTitle('网格视图')
      await user.click(gridViewButton)

      // 验证网格视图
      expect(screen.queryByText('全选 (3 个文件)')).not.toBeInTheDocument()
    })
  })

  describe('搜索和过滤', () => {
    it('应该处理搜索功能', async () => {
      const user = userEvent.setup()
      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('搜索文件...')
      await user.type(searchInput, 'test1')

      await waitFor(() => {
        expect(mockFileStorageService.queryFiles).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'test1'
          })
        )
      })
    })

    it('应该处理类型过滤', async () => {
      const user = userEvent.setup()
      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument()
      })

      const typeSelect = screen.getByDisplayValue('全部类型')
      await user.selectOptions(typeSelect, 'image/*')

      await waitFor(() => {
        expect(mockFileStorageService.queryFiles).toHaveBeenCalledWith(
          expect.objectContaining({
            type_filter: ['image/*']
          })
        )
      })
    })

    it('应该处理排序功能', async () => {
      const user = userEvent.setup()
      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument()
      })

      const sortSelect = screen.getByDisplayValue('最新创建')
      await user.selectOptions(sortSelect, 'name-asc')

      await waitFor(() => {
        expect(mockFileStorageService.queryFiles).toHaveBeenCalledWith(
          expect.objectContaining({
            sort_by: 'name',
            sort_order: 'asc'
          })
        )
      })
    })
  })

  describe('文件选择', () => {
    it('应该处理单个文件选择', async () => {
      const user = userEvent.setup()
      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument()
      })

      const fileItem = screen.getByText('test1.jpg').closest('div')
      await user.click(fileItem!)

      expect(mockOnFileSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'test1.jpg'
        })
      )
    })

    it('应该处理批量选择', async () => {
      const user = userEvent.setup()
      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument()
      })

      // 切换到列表视图以便于批量选择
      const listViewButton = screen.getByTitle('列表视图')
      await user.click(listViewButton)

      await waitFor(() => {
        expect(screen.getByText('全选 (3 个文件)')).toBeInTheDocument()
      })

      // 选择全部文件
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /全选/ })
      await user.click(selectAllCheckbox)

      await waitFor(() => {
        expect(screen.getByText('已选择 3 个文件')).toBeInTheDocument()
      })
    })
  })

  describe('文件操作', () => {
    it('应该处理文件删除', async () => {
      const user = userEvent.setup()
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument()
      })

      // 切换到列表视图以便于找到删除按钮
      const listViewButton = screen.getByTitle('列表视图')
      await user.click(listViewButton)

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('删除')
        expect(deleteButtons.length).toBeGreaterThan(0)
      })

      const deleteButton = screen.getAllByTitle('删除')[0]
      await user.click(deleteButton)

      expect(confirmSpy).toHaveBeenCalledWith('确定要删除这个文件吗？')
      
      await waitFor(() => {
        expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith('1', true)
      })

      confirmSpy.mockRestore()
    })

    it('应该处理批量删除', async () => {
      const user = userEvent.setup()
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument()
      })

      // 切换到列表视图
      const listViewButton = screen.getByTitle('列表视图')
      await user.click(listViewButton)

      await waitFor(() => {
        expect(screen.getByText('全选 (3 个文件)')).toBeInTheDocument()
      })

      // 选择全部文件
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /全选/ })
      await user.click(selectAllCheckbox)

      await waitFor(() => {
        expect(screen.getByText('已选择 3 个文件')).toBeInTheDocument()
      })

      // 点击批量删除
      const batchDeleteButton = screen.getByRole('button', { name: /删除/ })
      await user.click(batchDeleteButton)

      expect(confirmSpy).toHaveBeenCalledWith('确定要删除选中的 3 个文件吗？')

      await waitFor(() => {
        expect(mockFileStorageService.deleteFile).toHaveBeenCalledTimes(3)
      })

      confirmSpy.mockRestore()
    })

    it('应该处理文件下载', async () => {
      const user = userEvent.setup()
      
      // Mock document.createElement and click
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      
      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument()
      })

      // 切换到列表视图
      const listViewButton = screen.getByTitle('列表视图')
      await user.click(listViewButton)

      await waitFor(() => {
        const downloadButtons = screen.getAllByTitle('下载')
        expect(downloadButtons.length).toBeGreaterThan(0)
      })

      const downloadButton = screen.getAllByTitle('下载')[0]
      await user.click(downloadButton)

      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toBe('test1.jpg')
    })
  })

  describe('上传功能', () => {
    it('应该显示上传面板', async () => {
      const user = userEvent.setup()
      render(<FileManagerComponent {...defaultProps} />)

      const uploadButton = screen.getByText('上传文件')
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText('上传文件')).toBeInTheDocument()
        expect(screen.getByText('拖拽文件到此处或点击选择文件')).toBeInTheDocument()
      })
    })

    it('应该关闭上传面板', async () => {
      const user = userEvent.setup()
      render(<FileManagerComponent {...defaultProps} />)

      // 打开上传面板
      const uploadButton = screen.getByText('上传文件')
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText('拖拽文件到此处或点击选择文件')).toBeInTheDocument()
      })

      // 关闭上传面板
      const closeButton = screen.getByText('✕')
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('拖拽文件到此处或点击选择文件')).not.toBeInTheDocument()
      })
    })
  })

  describe('错误处理', () => {
    it('应该显示查询错误', async () => {
      mockFileStorageService.queryFiles.mockRejectedValue(new Error('查询失败'))
      
      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('查询失败')).toBeInTheDocument()
      })

      expect(mockOnError).toHaveBeenCalledWith('查询失败')
    })

    it('应该显示删除错误', async () => {
      const user = userEvent.setup()
      
      mockFileStorageService.deleteFile.mockResolvedValue({
        success: false,
        error: '删除失败'
      })
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument()
      })

      // 切换到列表视图
      const listViewButton = screen.getByTitle('列表视图')
      await user.click(listViewButton)

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('删除')
        expect(deleteButtons.length).toBeGreaterThan(0)
      })

      const deleteButton = screen.getAllByTitle('删除')[0]
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('删除失败')).toBeInTheDocument()
      })

      confirmSpy.mockRestore()
    })

    it('应该关闭错误提示', async () => {
      const user = userEvent.setup()
      
      mockFileStorageService.queryFiles.mockRejectedValue(new Error('查询失败'))
      
      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('查询失败')).toBeInTheDocument()
      })

      const closeErrorButton = screen.getByText('✕')
      await user.click(closeErrorButton)

      await waitFor(() => {
        expect(screen.queryByText('查询失败')).not.toBeInTheDocument()
      })
    })
  })

  describe('空状态', () => {
    it('应该显示空文件列表状态', async () => {
      mockFileStorageService.queryFiles.mockResolvedValue({
        files: [],
        total: 0,
        hasMore: false
      })
      
      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('暂无文件')).toBeInTheDocument()
        expect(screen.getByText('上传第一个文件')).toBeInTheDocument()
      })
    })

    it('应该在禁用上传时不显示上传按钮', async () => {
      mockFileStorageService.queryFiles.mockResolvedValue({
        files: [],
        total: 0,
        hasMore: false
      })
      
      render(<FileManagerComponent {...defaultProps} showUpload={false} />)

      await waitFor(() => {
        expect(screen.getByText('暂无文件')).toBeInTheDocument()
      })

      expect(screen.queryByText('上传第一个文件')).not.toBeInTheDocument()
      expect(screen.queryByText('上传文件')).not.toBeInTheDocument()
    })
  })

  describe('性能测试', () => {
    it('应该在100ms内完成组件渲染', async () => {
      const startTime = performance.now()
      
      render(<FileManagerComponent {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(100)
    })

    it('应该正确处理大量文件', async () => {
      const largeFileList = Array.from({ length: 100 }, (_, i) => 
        createTestFileEntity(`file-${i}`, `test-file-${i}.jpg`, 'image/jpeg')
      )

      mockFileStorageService.queryFiles.mockResolvedValue({
        files: largeFileList,
        total: 100,
        hasMore: false
      })

      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('共 100 个文件')).toBeInTheDocument()
      })

      // 验证文件列表渲染
      expect(screen.getByText('test-file-0.jpg')).toBeInTheDocument()
      expect(screen.getByText('test-file-99.jpg')).toBeInTheDocument()
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

      render(<FileManagerComponent {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument()
      })

      // 验证响应式样式应用
      const component = screen.getByText('test1.jpg').closest('.file-manager-component')
      expect(component).toBeInTheDocument()
    })
  })
})
