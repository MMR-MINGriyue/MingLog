/**
 * 模板选择器测试
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TemplateSelector } from '../TemplateSelector'
import { MindMapTemplate, templateManager } from '@minglog/mindmap'

// Mock appCore
const mockAppCore = {
  isInitialized: vi.fn(),
  getEventBus: vi.fn()
}

const mockEventBus = {
  emit: vi.fn()
}

vi.mock('../../core/AppCore', () => ({
  appCore: mockAppCore
}))

// Mock templateManager
const mockTemplates: MindMapTemplate[] = [
  {
    id: 'template1',
    name: '基础思维导图',
    description: '简单的思维导图模板',
    category: 'other',
    tags: ['基础', '通用'],
    data: {
      nodes: [{ id: 'root', text: '中心主题', level: 0, children: [] }],
      links: [],
      rootId: 'root',
      metadata: { title: '基础思维导图' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 5,
    isBuiltIn: true,
    isFavorite: false
  },
  {
    id: 'template2',
    name: '项目规划',
    description: '项目管理模板',
    category: 'project',
    tags: ['项目', '规划'],
    data: {
      nodes: [{ id: 'root', text: '项目名称', level: 0, children: [] }],
      links: [],
      rootId: 'root',
      metadata: { title: '项目规划' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 3,
    isBuiltIn: true,
    isFavorite: true
  }
]

vi.mock('@minglog/mindmap', () => ({
  templateManager: {
    getAllTemplates: vi.fn(),
    getRecentlyUsed: vi.fn(),
    toggleFavorite: vi.fn()
  }
}))

// Mock CSS imports
vi.mock('../TemplateSelector.css', () => ({}))

describe('TemplateSelector', () => {
  const mockOnClose = vi.fn()
  const mockOnTemplateSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockAppCore.isInitialized.mockReturnValue(true)
    mockAppCore.getEventBus.mockReturnValue(mockEventBus)
    
    // Mock templateManager methods
    vi.mocked(templateManager.getAllTemplates).mockReturnValue(mockTemplates)
    vi.mocked(templateManager.getRecentlyUsed).mockReturnValue(['template1'])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该在visible为true时渲染选择器', async () => {
      render(
        <TemplateSelector
          visible={true}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      expect(screen.getByText('📋 选择模板')).toBeInTheDocument()
      
      // 等待模板加载
      await waitFor(() => {
        expect(screen.getByText('基础思维导图')).toBeInTheDocument()
      })
    })

    it('应该在visible为false时不渲染选择器', () => {
      render(
        <TemplateSelector
          visible={false}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      expect(screen.queryByText('📋 选择模板')).not.toBeInTheDocument()
    })

    it('应该显示所有分类', async () => {
      render(
        <TemplateSelector
          visible={true}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('全部')).toBeInTheDocument()
        expect(screen.getByText('最近使用')).toBeInTheDocument()
        expect(screen.getByText('收藏')).toBeInTheDocument()
        expect(screen.getByText('商业')).toBeInTheDocument()
        expect(screen.getByText('项目')).toBeInTheDocument()
      })
    })
  })

  describe('模板显示', () => {
    it('应该显示所有模板', async () => {
      render(
        <TemplateSelector
          visible={true}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('基础思维导图')).toBeInTheDocument()
        expect(screen.getByText('项目规划')).toBeInTheDocument()
      })
    })

    it('应该显示模板信息', async () => {
      render(
        <TemplateSelector
          visible={true}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('简单的思维导图模板')).toBeInTheDocument()
        expect(screen.getByText('项目管理模板')).toBeInTheDocument()
        expect(screen.getByText('使用 5 次')).toBeInTheDocument()
        expect(screen.getByText('使用 3 次')).toBeInTheDocument()
      })
    })

    it('应该显示内置标识', async () => {
      render(
        <TemplateSelector
          visible={true}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      await waitFor(() => {
        const builtinBadges = screen.getAllByText('内置')
        expect(builtinBadges).toHaveLength(2)
      })
    })
  })

  describe('分类过滤', () => {
    it('应该能够按分类过滤模板', async () => {
      render(
        <TemplateSelector
          visible={true}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      // 等待模板加载
      await waitFor(() => {
        expect(screen.getByText('基础思维导图')).toBeInTheDocument()
      })

      // 点击项目分类
      fireEvent.click(screen.getByText('项目'))

      // 应该只显示项目类模板
      await waitFor(() => {
        expect(screen.getByText('项目规划')).toBeInTheDocument()
        expect(screen.queryByText('基础思维导图')).not.toBeInTheDocument()
      })
    })

    it('应该能够显示收藏模板', async () => {
      render(
        <TemplateSelector
          visible={true}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      // 等待模板加载
      await waitFor(() => {
        expect(screen.getByText('基础思维导图')).toBeInTheDocument()
      })

      // 点击收藏分类
      fireEvent.click(screen.getByText('收藏'))

      // 应该只显示收藏的模板
      await waitFor(() => {
        expect(screen.getByText('项目规划')).toBeInTheDocument()
        expect(screen.queryByText('基础思维导图')).not.toBeInTheDocument()
      })
    })
  })

  describe('搜索功能', () => {
    it('应该能够搜索模板', async () => {
      render(
        <TemplateSelector
          visible={true}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      // 等待模板加载
      await waitFor(() => {
        expect(screen.getByText('基础思维导图')).toBeInTheDocument()
      })

      // 输入搜索关键词
      const searchInput = screen.getByPlaceholderText('搜索模板名称、描述或标签...')
      fireEvent.change(searchInput, { target: { value: '项目' } })

      // 应该只显示匹配的模板
      await waitFor(() => {
        expect(screen.getByText('项目规划')).toBeInTheDocument()
        expect(screen.queryByText('基础思维导图')).not.toBeInTheDocument()
      })
    })

    it('应该能够清除搜索', async () => {
      render(
        <TemplateSelector
          visible={true}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      // 等待模板加载
      await waitFor(() => {
        expect(screen.getByText('基础思维导图')).toBeInTheDocument()
      })

      // 输入搜索关键词
      const searchInput = screen.getByPlaceholderText('搜索模板名称、描述或标签...')
      fireEvent.change(searchInput, { target: { value: '项目' } })

      // 点击清除按钮
      const clearButton = screen.getByTitle('清除搜索')
      fireEvent.click(clearButton)

      // 应该显示所有模板
      await waitFor(() => {
        expect(screen.getByText('基础思维导图')).toBeInTheDocument()
        expect(screen.getByText('项目规划')).toBeInTheDocument()
      })
    })
  })

  describe('模板选择', () => {
    it('应该能够选择模板', async () => {
      render(
        <TemplateSelector
          visible={true}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      // 等待模板加载
      await waitFor(() => {
        expect(screen.getByText('基础思维导图')).toBeInTheDocument()
      })

      // 点击模板
      fireEvent.click(screen.getByText('基础思维导图'))

      // 应该显示选中状态
      expect(screen.getByText('已选择: 基础思维导图')).toBeInTheDocument()
    })

    it('应该能够应用模板', async () => {
      render(
        <TemplateSelector
          visible={true}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      // 等待模板加载
      await waitFor(() => {
        expect(screen.getByText('基础思维导图')).toBeInTheDocument()
      })

      // 选择模板
      fireEvent.click(screen.getByText('基础思维导图'))

      // 点击应用按钮
      fireEvent.click(screen.getByText('应用模板'))

      // 应该调用回调函数
      expect(mockOnTemplateSelect).toHaveBeenCalledWith(mockTemplates[0])
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('收藏功能', () => {
    it('应该能够切换收藏状态', async () => {
      render(
        <TemplateSelector
          visible={true}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      // 等待模板加载
      await waitFor(() => {
        expect(screen.getByText('基础思维导图')).toBeInTheDocument()
      })

      // 找到收藏按钮并点击
      const favoriteButtons = screen.getAllByTitle(/添加收藏|取消收藏/)
      fireEvent.click(favoriteButtons[0])

      // 应该调用toggleFavorite
      expect(templateManager.toggleFavorite).toHaveBeenCalledWith('template1')
    })
  })

  describe('关闭功能', () => {
    it('应该能够通过关闭按钮关闭', async () => {
      render(
        <TemplateSelector
          visible={true}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      fireEvent.click(screen.getByTitle('关闭'))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('应该能够通过取消按钮关闭', async () => {
      render(
        <TemplateSelector
          visible={true}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      fireEvent.click(screen.getByText('取消'))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('应该能够通过遮罩层关闭', async () => {
      render(
        <TemplateSelector
          visible={true}
          onClose={mockOnClose}
          onTemplateSelect={mockOnTemplateSelect}
        />
      )

      fireEvent.click(document.querySelector('.template-selector-overlay')!)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
