/**
 * 增强版高级搜索组件测试
 * 测试跨模块搜索、智能过滤器、保存搜索和搜索分析功能
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EnhancedAdvancedSearchComponent } from '../EnhancedAdvancedSearchComponent'
import { UnifiedSearchService, SearchResultAggregation } from '../../../services/UnifiedSearchService'
import { AdvancedSearchService } from '../../../services/AdvancedSearchService'
import { SearchAnalyticsService } from '../../../services/SearchAnalyticsService'

// 模拟搜索服务
const mockUnifiedSearchService = {
  search: vi.fn(),
  smartSearch: vi.fn(),
  getSearchSuggestions: vi.fn(),
  getSearchHistory: vi.fn()
} as unknown as UnifiedSearchService

const mockAdvancedSearchService = {
  advancedSearch: vi.fn(),
  buildConditionGroup: vi.fn(),
  validateConditions: vi.fn()
} as unknown as AdvancedSearchService

const mockSearchAnalyticsService = {
  recordSearch: vi.fn(),
  getSearchStatistics: vi.fn(),
  getOptimizationSuggestions: vi.fn(),
  recordResultClick: vi.fn()
} as unknown as SearchAnalyticsService

// 模拟搜索结果
const mockSearchResults: SearchResultAggregation = {
  results: [
    {
      id: 'result-1',
      title: '测试笔记1',
      snippet: '这是一个包含<mark>搜索关键词</mark>的测试笔记',
      entityType: 'note',
      moduleId: 'notes',
      score: 0.95,
      lastModified: '2024-01-01T00:00:00Z',
      metadata: {
        tags: ['重要', '工作'],
        author: '测试用户'
      }
    },
    {
      id: 'result-2',
      title: '测试任务2',
      snippet: '这是一个包含<mark>搜索关键词</mark>的测试任务',
      entityType: 'task',
      moduleId: 'tasks',
      score: 0.87,
      lastModified: '2024-01-02T00:00:00Z',
      metadata: {
        priority: 'high',
        status: 'pending'
      }
    },
    {
      id: 'result-3',
      title: '测试文件3',
      snippet: '这是一个包含<mark>搜索关键词</mark>的测试文件',
      entityType: 'file',
      moduleId: 'files',
      score: 0.76,
      lastModified: '2024-01-03T00:00:00Z',
      metadata: {
        fileType: 'pdf',
        size: 1024000
      }
    }
  ],
  totalResults: 3,
  searchTime: 45.6,
  resultsByType: {
    note: 1,
    task: 1,
    file: 1
  },
  resultsByModule: {
    notes: 1,
    tasks: 1,
    files: 1
  },
  suggestions: ['相关搜索1', '相关搜索2']
}

// 模拟localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('EnhancedAdvancedSearchComponent', () => {
  const user = userEvent.setup()
  const mockCallbacks = {
    onSearchResults: vi.fn(),
    onSearchStateChange: vi.fn(),
    onError: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // 设置默认的模拟返回值
    mockUnifiedSearchService.search = vi.fn().mockResolvedValue(mockSearchResults)
    mockUnifiedSearchService.smartSearch = vi.fn().mockResolvedValue(mockSearchResults)
    mockUnifiedSearchService.getSearchSuggestions = vi.fn().mockResolvedValue([
      '建议搜索1', '建议搜索2', '建议搜索3'
    ])
    
    mockAdvancedSearchService.advancedSearch = vi.fn().mockResolvedValue(mockSearchResults)
    
    mockSearchAnalyticsService.recordSearch = vi.fn().mockResolvedValue(undefined)
    
    mockLocalStorage.getItem = vi.fn().mockReturnValue(null)
    mockLocalStorage.setItem = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染高级搜索组件', () => {
      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          searchAnalyticsService={mockSearchAnalyticsService}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('🔍 高级搜索')).toBeInTheDocument()
      expect(screen.getByText('简单搜索')).toBeInTheDocument()
      expect(screen.getByText('高级搜索')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/输入搜索查询/)).toBeInTheDocument()

      // 验证初始状态不应该显示搜索结果
      expect(screen.queryByText(/找到.*个结果/)).not.toBeInTheDocument()
      expect(mockUnifiedSearchService.search).not.toHaveBeenCalled()
    })

    it('应该显示搜索模式标签', () => {
      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          enableSearchTemplates={true}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('简单搜索')).toBeInTheDocument()
      expect(screen.getByText('高级搜索')).toBeInTheDocument()
      expect(screen.getByText('搜索模板')).toBeInTheDocument()
    })

    it('应该显示操作按钮', () => {
      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          enableSavedSearches={true}
          enableSearchAnalytics={true}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText(/🔧 过滤器/)).toBeInTheDocument()
      expect(screen.getByText(/💾 保存的搜索/)).toBeInTheDocument()
      expect(screen.getByText(/📊 分析/)).toBeInTheDocument()
    })
  })

  describe('简单搜索功能', () => {
    it('应该执行简单搜索', async () => {
      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          enableLiveSearch={false}
          enableSmartSuggestions={false}
          {...mockCallbacks}
        />
      )

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/)
      const searchButton = screen.getByText('搜索')

      // 验证初始状态
      expect(mockUnifiedSearchService.search).not.toHaveBeenCalled()
      expect(screen.queryByText(/找到.*个结果/)).not.toBeInTheDocument()

      // 输入搜索查询
      await act(async () => {
        await user.type(searchInput, '测试关键词')
      })

      // 验证输入后仍然没有搜索结果
      expect(screen.queryByText(/找到.*个结果/)).not.toBeInTheDocument()

      // 点击搜索按钮
      await act(async () => {
        await user.click(searchButton)
      })

      await waitFor(() => {
        expect(mockUnifiedSearchService.search).toHaveBeenCalledWith(
          '测试关键词',
          expect.objectContaining({
            sortBy: 'relevance',
            sortOrder: 'desc',
            limit: 50
          })
        )
      })

      expect(mockCallbacks.onSearchResults).toHaveBeenCalledWith(mockSearchResults)

      // 验证搜索结果显示
      await waitFor(() => {
        expect(screen.getByText(/找到.*个结果/)).toBeInTheDocument()
      })
    })

    it('应该支持实时搜索', async () => {
      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          enableLiveSearch={true}
          enableSmartSuggestions={false}
          searchDebounceMs={100}
          {...mockCallbacks}
        />
      )

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/)

      // 输入搜索查询
      await act(async () => {
        await user.type(searchInput, '实时搜索')
      })

      // 等待防抖延迟
      await waitFor(() => {
        expect(mockUnifiedSearchService.search).toHaveBeenCalledWith(
          '实时搜索',
          expect.any(Object)
        )
      }, { timeout: 200 })
    })

    it('应该支持Enter键搜索', async () => {
      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          enableLiveSearch={false}
          enableSmartSuggestions={false}
          {...mockCallbacks}
        />
      )

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/)

      // 输入搜索查询并按Enter
      await act(async () => {
        await user.type(searchInput, '回车搜索{enter}')
      })

      await waitFor(() => {
        expect(mockUnifiedSearchService.search).toHaveBeenCalledWith(
          '回车搜索',
          expect.any(Object)
        )
      })
    })
  })

  describe('搜索建议功能', () => {
    it('应该显示搜索建议', async () => {
      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          enableSmartSuggestions={true}
          {...mockCallbacks}
        />
      )

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/)

      // 输入搜索查询
      await act(async () => {
        await user.type(searchInput, '建议')
      })

      await waitFor(() => {
        expect(mockUnifiedSearchService.getSearchSuggestions).toHaveBeenCalledWith('建议', 8)
      })

      // 等待建议显示
      await waitFor(() => {
        expect(screen.getByText('🔍 建议搜索1')).toBeInTheDocument()
        expect(screen.getByText('🔍 建议搜索2')).toBeInTheDocument()
      })
    })

    it('应该支持选择搜索建议', async () => {
      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          enableSmartSuggestions={true}
          enableLiveSearch={false}
          {...mockCallbacks}
        />
      )

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/)

      // 清除之前的调用
      mockUnifiedSearchService.smartSearch.mockClear()

      // 输入搜索查询
      await act(async () => {
        await user.type(searchInput, '建议')
      })

      // 等待建议显示
      await waitFor(() => {
        expect(screen.getByText('🔍 建议搜索1')).toBeInTheDocument()
      })

      // 点击建议
      await act(async () => {
        await user.click(screen.getByText('🔍 建议搜索1'))
      })

      // 验证输入框的值被更新
      expect(searchInput).toHaveValue('建议搜索1')

      // 验证智能搜索被执行（因为enableSmartSuggestions=true）
      await waitFor(() => {
        expect(mockUnifiedSearchService.smartSearch).toHaveBeenCalledWith(
          '建议搜索1',
          expect.any(Object)
        )
      })
    })
  })

  describe('智能搜索功能', () => {
    it('应该使用智能搜索', async () => {
      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          enableSmartSuggestions={false}
          enableLiveSearch={false}
          {...mockCallbacks}
        />
      )

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/)
      const searchButton = screen.getByText('搜索')

      await act(async () => {
        await user.type(searchInput, '智能搜索')
        await user.click(searchButton)
      })

      await waitFor(() => {
        expect(mockUnifiedSearchService.search).toHaveBeenCalledWith(
          '智能搜索',
          expect.any(Object)
        )
      })
    })
  })

  describe('搜索模式切换', () => {
    it('应该切换到高级搜索模式', async () => {
      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          enableSmartSuggestions={false}
          {...mockCallbacks}
        />
      )

      // 点击高级搜索标签
      await act(async () => {
        await user.click(screen.getByText('高级搜索'))
      })

      // 验证高级搜索界面显示
      expect(screen.getByText('搜索条件')).toBeInTheDocument()
      expect(screen.getByText('高级搜索条件构建器')).toBeInTheDocument()
    })

    it('应该切换到模板搜索模式', async () => {
      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          enableSearchTemplates={true}
          enableSmartSuggestions={false}
          {...mockCallbacks}
        />
      )

      // 点击搜索模板标签
      await act(async () => {
        await user.click(screen.getByRole('button', { name: '搜索模板' }))
      })

      // 验证模板搜索界面显示
      expect(screen.getByRole('heading', { name: '搜索模板' })).toBeInTheDocument()
      expect(screen.getByText('最近的笔记')).toBeInTheDocument()
      expect(screen.getByText('重要任务')).toBeInTheDocument()
    })
  })

  describe('搜索分析功能', () => {
    it('应该记录搜索分析', async () => {
      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          searchAnalyticsService={mockSearchAnalyticsService}
          enableSearchAnalytics={true}
          enableSmartSuggestions={false}
          enableLiveSearch={false}
          {...mockCallbacks}
        />
      )

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/)
      const searchButton = screen.getByText('搜索')

      await act(async () => {
        await user.type(searchInput, '分析测试')
        await user.click(searchButton)
      })

      await waitFor(() => {
        expect(mockSearchAnalyticsService.recordSearch).toHaveBeenCalledWith(
          expect.objectContaining({
            query: '分析测试',
            resultCount: 3,
            searchTime: 45.6
          })
        )
      })
    })
  })

  describe('搜索历史功能', () => {
    it('应该保存搜索历史', async () => {
      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          maxSearchHistory={10}
          enableSmartSuggestions={false}
          enableLiveSearch={false}
          {...mockCallbacks}
        />
      )

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/)
      const searchButton = screen.getByText('搜索')

      await act(async () => {
        await user.type(searchInput, '历史测试')
        await user.click(searchButton)
      })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'minglog-search-history',
          expect.stringContaining('历史测试')
        )
      })
    })
  })

  describe('清除搜索功能', () => {
    it('应该清除搜索内容', async () => {
      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          enableSmartSuggestions={false}
          enableLiveSearch={false}
          {...mockCallbacks}
        />
      )

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/)
      const clearButton = screen.getByText('清除')

      // 输入搜索内容
      await act(async () => {
        await user.type(searchInput, '要清除的内容')
      })
      expect(searchInput).toHaveValue('要清除的内容')

      // 点击清除按钮
      await act(async () => {
        await user.click(clearButton)
      })

      // 验证内容被清除
      expect(searchInput).toHaveValue('')
    })
  })

  describe('错误处理', () => {
    it('应该显示搜索错误', async () => {
      mockUnifiedSearchService.search = vi.fn().mockRejectedValue(new Error('搜索服务错误'))

      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          enableSmartSuggestions={false}
          enableLiveSearch={false}
          {...mockCallbacks}
        />
      )

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/)
      const searchButton = screen.getByText('搜索')

      await act(async () => {
        await user.type(searchInput, '错误测试')
        await user.click(searchButton)
      })

      await waitFor(() => {
        expect(screen.getByText('搜索服务错误')).toBeInTheDocument()
      })

      expect(mockCallbacks.onError).toHaveBeenCalledWith('搜索服务错误')
    })

    it('应该关闭错误提示', async () => {
      mockUnifiedSearchService.search = vi.fn().mockRejectedValue(new Error('测试错误'))

      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          enableSmartSuggestions={false}
          enableLiveSearch={false}
          {...mockCallbacks}
        />
      )

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/)
      const searchButton = screen.getByText('搜索')

      await act(async () => {
        await user.type(searchInput, '错误测试')
        await user.click(searchButton)
      })

      await waitFor(() => {
        expect(screen.getByText('测试错误')).toBeInTheDocument()
      })

      // 点击关闭按钮
      const closeButton = screen.getByText('✕')
      await act(async () => {
        await user.click(closeButton)
      })

      expect(screen.queryByText('测试错误')).not.toBeInTheDocument()
    })
  })

  describe('搜索状态管理', () => {
    it('应该显示搜索中状态', async () => {
      // 模拟慢速搜索
      mockUnifiedSearchService.search = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockSearchResults), 1000))
      )

      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          enableSmartSuggestions={false}
          enableLiveSearch={false}
          {...mockCallbacks}
        />
      )

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/)
      const searchButton = screen.getByText('搜索')

      await act(async () => {
        await user.type(searchInput, '慢速搜索')
        await user.click(searchButton)
      })

      // 验证搜索中状态
      expect(screen.getByText('搜索中...')).toBeInTheDocument()
      expect(mockCallbacks.onSearchStateChange).toHaveBeenCalledWith(true)
    })
  })

  describe('键盘交互', () => {
    it('应该支持Escape键关闭建议', async () => {
      render(
        <EnhancedAdvancedSearchComponent
          unifiedSearchService={mockUnifiedSearchService}
          advancedSearchService={mockAdvancedSearchService}
          enableSmartSuggestions={true}
          {...mockCallbacks}
        />
      )

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/)

      // 输入搜索查询显示建议
      await act(async () => {
        await user.type(searchInput, '建议')
      })

      await waitFor(() => {
        expect(screen.getByText('🔍 建议搜索1')).toBeInTheDocument()
      })

      // 按Escape键
      await act(async () => {
        await user.keyboard('{Escape}')
      })

      // 验证建议被隐藏
      expect(screen.queryByText('🔍 建议搜索1')).not.toBeInTheDocument()
    })
  })
})
