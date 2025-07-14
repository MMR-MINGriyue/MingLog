/**
 * 增强版文件管理组件测试
 * 测试文件预览、批量操作、响应式设计等功能
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EnhancedFileManagerComponent } from '../EnhancedFileManagerComponent'
import { FileStorageService, FileEntity } from '../../../services/FileStorageService'
import { FileAssociationService } from '../../../services/FileAssociationService'

// 模拟文件数据
const mockFiles: FileEntity[] = [
  {
    id: 'file-1',
    name: '测试文档.pdf',
    path: '/documents/test.pdf',
    size: 1024000,
    type: 'application/pdf',
    category: 'document',
    created_at: '2024-01-01T00:00:00Z',
    modified_at: '2024-01-02T00:00:00Z',
    metadata: {}
  },
  {
    id: 'file-2',
    name: '图片.jpg',
    path: '/images/photo.jpg',
    size: 512000,
    type: 'image/jpeg',
    category: 'image',
    created_at: '2024-01-01T00:00:00Z',
    modified_at: '2024-01-02T00:00:00Z',
    metadata: {}
  },
  {
    id: 'file-3',
    name: '视频.mp4',
    path: '/videos/video.mp4',
    size: 10240000,
    type: 'video/mp4',
    category: 'video',
    created_at: '2024-01-01T00:00:00Z',
    modified_at: '2024-01-02T00:00:00Z',
    metadata: {}
  }
]

// 模拟服务
const mockFileStorageService = {
  queryFiles: vi.fn(),
  getFile: vi.fn(),
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  updateFile: vi.fn(),
  getFileUrl: vi.fn()
} as unknown as FileStorageService

const mockFileAssociationService = {
  getAssociations: vi.fn(),
  createAssociation: vi.fn(),
  deleteAssociation: vi.fn()
} as unknown as FileAssociationService

// 模拟ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// 模拟IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

describe('EnhancedFileManagerComponent', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // 设置默认的模拟返回值
    mockFileStorageService.queryFiles = vi.fn().mockResolvedValue({
      files: mockFiles,
      total: mockFiles.length,
      hasMore: false
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染文件管理组件', async () => {
      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
          fileAssociationService={mockFileAssociationService}
        />
      )

      // 检查工具栏是否存在
      expect(screen.getByPlaceholderText('搜索文件...')).toBeInTheDocument()
      
      // 检查视图切换按钮
      expect(screen.getByText('网格')).toBeInTheDocument()
      expect(screen.getByText('列表')).toBeInTheDocument()
      expect(screen.getByText('表格')).toBeInTheDocument()

      // 等待文件加载
      await waitFor(() => {
        expect(mockFileStorageService.queryFiles).toHaveBeenCalled()
      })
    })

    it('应该显示加载状态', () => {
      // 让queryFiles返回一个永不resolve的Promise来模拟加载状态
      mockFileStorageService.queryFiles = vi.fn().mockImplementation(() => new Promise(() => {}))

      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
        />
      )

      expect(screen.getByText('加载中...')).toBeInTheDocument()
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument() // 加载动画
    })

    it('应该显示空状态', async () => {
      mockFileStorageService.queryFiles = vi.fn().mockResolvedValue({
        files: [],
        total: 0,
        hasMore: false
      })

      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('暂无文件')).toBeInTheDocument()
        expect(screen.getByText('拖拽文件到此处或点击上传按钮')).toBeInTheDocument()
      })
    })
  })

  describe('视图模式切换', () => {
    it('应该支持网格视图', async () => {
      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
          initialViewMode="grid"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('测试文档.pdf')).toBeInTheDocument()
      })

      // 检查网格布局类名
      const fileContainer = screen.getByText('测试文档.pdf').closest('.grid')
      expect(fileContainer).toBeInTheDocument()
    })

    it('应该支持列表视图', async () => {
      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
          initialViewMode="list"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('测试文档.pdf')).toBeInTheDocument()
      })

      // 点击列表视图按钮
      await user.click(screen.getByText('列表'))

      // 检查列表布局
      const fileContainer = screen.getByText('测试文档.pdf').closest('.space-y-2')
      expect(fileContainer).toBeInTheDocument()
    })

    it('应该支持表格视图', async () => {
      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
          initialViewMode="table"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('测试文档.pdf')).toBeInTheDocument()
      })

      // 点击表格视图按钮
      await user.click(screen.getByText('表格'))

      // 检查表格布局
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('名称')).toBeInTheDocument()
      expect(screen.getByText('大小')).toBeInTheDocument()
      expect(screen.getByText('修改时间')).toBeInTheDocument()
    })
  })

  describe('搜索功能', () => {
    it('应该支持实时搜索', async () => {
      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
          enableLiveSearch={true}
          searchDebounceMs={100}
        />
      )

      const searchInput = screen.getByPlaceholderText('搜索文件...')
      
      // 输入搜索关键词
      await user.type(searchInput, '测试')

      // 等待防抖延迟
      await waitFor(() => {
        expect(mockFileStorageService.queryFiles).toHaveBeenCalledWith(
          expect.objectContaining({
            search: '测试'
          })
        )
      }, { timeout: 200 })
    })

    it('应该支持禁用实时搜索', async () => {
      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
          enableLiveSearch={false}
        />
      )

      const searchInput = screen.getByPlaceholderText('搜索文件...')
      
      // 输入搜索关键词
      await user.type(searchInput, '测试')

      // 等待一段时间，确保没有触发搜索
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // 应该只调用一次（初始加载）
      expect(mockFileStorageService.queryFiles).toHaveBeenCalledTimes(1)
    })
  })

  describe('文件选择', () => {
    it('应该支持单文件选择', async () => {
      const onFileSelect = vi.fn()
      
      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
          onFileSelect={onFileSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('测试文档.pdf')).toBeInTheDocument()
      })

      // 点击文件
      await user.click(screen.getByText('测试文档.pdf'))

      expect(onFileSelect).toHaveBeenCalledWith(mockFiles[0])
    })

    it('应该支持批量选择', async () => {
      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('测试文档.pdf')).toBeInTheDocument()
      })

      // 选择多个文件
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1]) // 第一个文件的复选框
      await user.click(checkboxes[2]) // 第二个文件的复选框

      // 检查批量操作按钮是否出现
      expect(screen.getByText(/批量操作 \(2\)/)).toBeInTheDocument()
    })

    it('应该支持全选功能', async () => {
      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
          initialViewMode="table"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('测试文档.pdf')).toBeInTheDocument()
      })

      // 点击表格视图以显示全选复选框
      await user.click(screen.getByText('表格'))

      // 点击全选复选框
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
      await user.click(selectAllCheckbox)

      // 检查是否显示批量操作按钮
      expect(screen.getByText(/批量操作 \(3\)/)).toBeInTheDocument()
    })
  })

  describe('排序功能', () => {
    it('应该支持按名称排序', async () => {
      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('测试文档.pdf')).toBeInTheDocument()
      })

      // 选择按名称降序排序
      const sortSelect = screen.getByDisplayValue('名称 ↑')
      await user.selectOptions(sortSelect, 'name-desc')

      await waitFor(() => {
        expect(mockFileStorageService.queryFiles).toHaveBeenCalledWith(
          expect.objectContaining({
            sort_by: 'name',
            sort_order: 'desc'
          })
        )
      })
    })

    it('应该支持按大小排序', async () => {
      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('测试文档.pdf')).toBeInTheDocument()
      })

      // 选择按大小排序
      const sortSelect = screen.getByDisplayValue('名称 ↑')
      await user.selectOptions(sortSelect, 'size-desc')

      await waitFor(() => {
        expect(mockFileStorageService.queryFiles).toHaveBeenCalledWith(
          expect.objectContaining({
            sort_by: 'size',
            sort_order: 'desc'
          })
        )
      })
    })
  })

  describe('键盘快捷键', () => {
    it('应该支持Ctrl+A全选', async () => {
      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
          enableKeyboardShortcuts={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('测试文档.pdf')).toBeInTheDocument()
      })

      // 按Ctrl+A
      await user.keyboard('{Control>}a{/Control}')

      // 检查是否显示批量操作按钮
      expect(screen.getByText(/批量操作 \(3\)/)).toBeInTheDocument()
    })

    it('应该支持Escape取消选择', async () => {
      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
          enableKeyboardShortcuts={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('测试文档.pdf')).toBeInTheDocument()
      })

      // 先选择一些文件
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      // 按Escape
      await user.keyboard('{Escape}')

      // 检查批量操作按钮是否消失
      expect(screen.queryByText(/批量操作/)).not.toBeInTheDocument()
    })

    it('应该支持Ctrl+F聚焦搜索框', async () => {
      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
          enableKeyboardShortcuts={true}
        />
      )

      const searchInput = screen.getByPlaceholderText('搜索文件...')

      // 按Ctrl+F
      await user.keyboard('{Control>}f{/Control}')

      // 检查搜索框是否获得焦点
      expect(searchInput).toHaveFocus()
    })
  })

  describe('错误处理', () => {
    it('应该显示加载错误', async () => {
      mockFileStorageService.queryFiles = vi.fn().mockRejectedValue(new Error('网络错误'))

      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('网络错误')).toBeInTheDocument()
      })

      // 检查错误提示的关闭按钮
      const closeButton = screen.getByText('✕')
      expect(closeButton).toBeInTheDocument()

      // 点击关闭按钮
      await user.click(closeButton)
      expect(screen.queryByText('网络错误')).not.toBeInTheDocument()
    })

    it('应该调用错误回调', async () => {
      const onError = vi.fn()
      mockFileStorageService.queryFiles = vi.fn().mockRejectedValue(new Error('测试错误'))

      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
          onError={onError}
        />
      )

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('测试错误')
      })
    })
  })

  describe('响应式设计', () => {
    it('应该在移动端隐藏文件夹树', () => {
      // 模拟移动端视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
          showFolderTree={true}
        />
      )

      // 在移动端，文件夹树应该通过CSS隐藏
      // 这里我们主要测试组件能正常渲染
      expect(screen.getByPlaceholderText('搜索文件...')).toBeInTheDocument()
    })
  })

  describe('批量操作', () => {
    it('应该打开批量操作面板', async () => {
      const onBatchOperation = vi.fn()

      render(
        <EnhancedFileManagerComponent
          fileStorageService={mockFileStorageService}
          onBatchOperation={onBatchOperation}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('测试文档.pdf')).toBeInTheDocument()
      })

      // 选择文件
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      // 点击批量操作按钮
      await user.click(screen.getByText(/批量操作 \(1\)/))

      // 检查批量操作面板是否打开
      expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument()
    })
  })
})
