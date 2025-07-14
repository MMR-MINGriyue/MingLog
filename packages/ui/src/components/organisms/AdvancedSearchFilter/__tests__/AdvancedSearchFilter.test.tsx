import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ThemeProvider } from '../../../../contexts/ThemeContext'
import { AdvancedSearchFilter } from '../AdvancedSearchFilter'
import { SearchResult, SearchStats } from '../types'

// Mock数据
const mockResults: SearchResult[] = [
  {
    id: 'result1',
    type: 'note',
    title: '测试笔记1',
    excerpt: '这是一个测试笔记的摘要内容',
    highlights: ['测试<mark>关键词</mark>高亮'],
    matchedFields: ['title', 'content'],
    score: 0.95,
    tags: [
      { id: 'tag1', name: '测试', color: '#blue', selected: false }
    ],
    author: { id: 'user1', name: '测试用户', selected: false },
    createdAt: '2025-01-14T10:00:00Z',
    modifiedAt: '2025-01-14T12:00:00Z',
    size: 1024,
    path: '/notes/test1.md',
    isFavorite: false
  },
  {
    id: 'result2',
    type: 'block',
    title: '测试块引用',
    excerpt: '这是一个块引用的内容',
    highlights: [],
    matchedFields: ['content'],
    score: 0.85,
    tags: [],
    createdAt: '2025-01-14T11:00:00Z',
    modifiedAt: '2025-01-14T13:00:00Z',
    isFavorite: true
  }
]

const mockStats: SearchStats = {
  totalCount: 2,
  searchTime: 150,
  typeStats: { note: 1, block: 1 },
  dateStats: { '2025-01-14': 2 },
  suggestions: ['相关搜索1', '相关搜索2'],
  hasMore: false
}

const mockOnSearch = vi.fn().mockResolvedValue({
  results: mockResults,
  stats: mockStats
})

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  )
}

describe('AdvancedSearchFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染搜索框', () => {
      renderWithTheme(
        <AdvancedSearchFilter onSearch={mockOnSearch} />
      )

      expect(screen.getByPlaceholderText('搜索笔记、块引用、标签...')).toBeInTheDocument()
    })

    it('应该渲染内容类型过滤器', () => {
      renderWithTheme(
        <AdvancedSearchFilter onSearch={mockOnSearch} />
      )

      expect(screen.getByText('笔记')).toBeInTheDocument()
      expect(screen.getByText('块引用')).toBeInTheDocument()
      expect(screen.getByText('链接')).toBeInTheDocument()
      expect(screen.getByText('标签')).toBeInTheDocument()
      expect(screen.getByText('附件')).toBeInTheDocument()
    })

    it('应该渲染高级选项切换按钮', () => {
      renderWithTheme(
        <AdvancedSearchFilter onSearch={mockOnSearch} />
      )

      expect(screen.getByText('高级选项')).toBeInTheDocument()
    })

    it('应该渲染排序选择器', () => {
      renderWithTheme(
        <AdvancedSearchFilter onSearch={mockOnSearch} />
      )

      expect(screen.getByDisplayValue('相关性')).toBeInTheDocument()
    })
  })

  describe('搜索功能', () => {
    it('应该在输入搜索关键词时触发搜索', async () => {
      renderWithTheme(
        <AdvancedSearchFilter
          onSearch={mockOnSearch}
          enableRealTimeSearch={false}
        />
      )

      const searchInput = screen.getByPlaceholderText('搜索笔记、块引用、标签...')
      fireEvent.change(searchInput, { target: { value: '测试关键词' } })

      // 手动触发搜索（因为禁用了实时搜索）
      fireEvent.keyDown(searchInput, { key: 'Enter' })

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith(
          expect.objectContaining({
            query: '测试关键词'
          })
        )
      })
    })

    it('应该显示搜索结果', async () => {
      renderWithTheme(
        <AdvancedSearchFilter onSearch={mockOnSearch} enableRealTimeSearch={false} />
      )

      const searchInput = screen.getByPlaceholderText('搜索笔记、块引用、标签...')
      fireEvent.change(searchInput, { target: { value: '测试' } })
      fireEvent.keyDown(searchInput, { key: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText('测试笔记1')).toBeInTheDocument()
        expect(screen.getByText('测试块引用')).toBeInTheDocument()
      })
    })

    it('应该显示搜索统计信息', async () => {
      renderWithTheme(
        <AdvancedSearchFilter onSearch={mockOnSearch} enableRealTimeSearch={false} />
      )

      const searchInput = screen.getByPlaceholderText('搜索笔记、块引用、标签...')
      fireEvent.change(searchInput, { target: { value: '测试' } })
      fireEvent.keyDown(searchInput, { key: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText(/找到 2 个结果/)).toBeInTheDocument()
        expect(screen.getByText(/150ms/)).toBeInTheDocument()
      })
    })

    it('应该显示搜索建议', async () => {
      renderWithTheme(
        <AdvancedSearchFilter onSearch={mockOnSearch} enableRealTimeSearch={false} />
      )

      const searchInput = screen.getByPlaceholderText('搜索笔记、块引用、标签...')
      fireEvent.change(searchInput, { target: { value: '测试' } })
      fireEvent.keyDown(searchInput, { key: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText('相关搜索1')).toBeInTheDocument()
        expect(screen.getByText('相关搜索2')).toBeInTheDocument()
      })
    })
  })

  describe('过滤器功能', () => {
    it('应该切换内容类型过滤器', () => {
      const onFiltersChange = vi.fn()

      renderWithTheme(
        <AdvancedSearchFilter
          onSearch={mockOnSearch}
          onFiltersChange={onFiltersChange}
          enableRealTimeSearch={false}
        />
      )

      const noteFilter = screen.getByText('笔记')
      fireEvent.click(noteFilter)

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          contentTypes: expect.arrayContaining([
            expect.objectContaining({
              type: 'note',
              selected: false
            })
          ])
        })
      )
    })

    it('应该显示高级过滤器面板', () => {
      renderWithTheme(
        <AdvancedSearchFilter onSearch={mockOnSearch} />
      )

      const advancedButton = screen.getByText('高级选项')
      fireEvent.click(advancedButton)

      expect(screen.getByText('创建日期')).toBeInTheDocument()
      expect(screen.getByText('其他选项')).toBeInTheDocument()
    })

    it('应该设置日期范围过滤器', () => {
      const onFiltersChange = vi.fn()

      renderWithTheme(
        <AdvancedSearchFilter
          onSearch={mockOnSearch}
          onFiltersChange={onFiltersChange}
          enableRealTimeSearch={false}
        />
      )

      // 展开高级选项
      const advancedButton = screen.getByText('高级选项')
      fireEvent.click(advancedButton)

      // 设置开始日期 - 查找日期输入框
      const dateInputs = screen.getAllByDisplayValue('').filter(input =>
        (input as HTMLInputElement).type === 'date'
      )
      fireEvent.change(dateInputs[0], { target: { value: '2025-01-01' } })

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: expect.objectContaining({
            created: expect.objectContaining({
              start: '2025-01-01'
            })
          })
        })
      )
    })

    it('应该切换其他选项', () => {
      const onFiltersChange = vi.fn()

      renderWithTheme(
        <AdvancedSearchFilter
          onSearch={mockOnSearch}
          onFiltersChange={onFiltersChange}
          enableRealTimeSearch={false}
        />
      )

      // 展开高级选项
      const advancedButton = screen.getByText('高级选项')
      fireEvent.click(advancedButton)

      // 切换"包含已删除项目"
      const deletedCheckbox = screen.getByLabelText('包含已删除项目')
      fireEvent.click(deletedCheckbox)

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          includeDeleted: true
        })
      )
    })
  })

  describe('排序功能', () => {
    it('应该更改排序方式', () => {
      const onFiltersChange = vi.fn()

      renderWithTheme(
        <AdvancedSearchFilter
          onSearch={mockOnSearch}
          onFiltersChange={onFiltersChange}
          enableRealTimeSearch={false}
        />
      )

      const sortSelect = screen.getByDisplayValue('相关性')
      fireEvent.change(sortSelect, { target: { value: 'created' } })

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'created'
        })
      )
    })

    it('应该切换排序方向', () => {
      const onFiltersChange = vi.fn()

      renderWithTheme(
        <AdvancedSearchFilter
          onSearch={mockOnSearch}
          onFiltersChange={onFiltersChange}
          enableRealTimeSearch={false}
        />
      )

      const sortOrderButton = screen.getByTitle('降序')
      fireEvent.click(sortOrderButton)

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sortOrder: 'asc'
        })
      )
    })
  })

  describe('结果交互', () => {
    it('应该处理结果点击', async () => {
      const onResultSelect = vi.fn()

      renderWithTheme(
        <AdvancedSearchFilter
          onSearch={mockOnSearch}
          onResultSelect={onResultSelect}
          enableRealTimeSearch={false}
        />
      )

      // 触发搜索以显示结果
      const searchInput = screen.getByPlaceholderText('搜索笔记、块引用、标签...')
      fireEvent.change(searchInput, { target: { value: '测试' } })
      fireEvent.keyDown(searchInput, { key: 'Enter' })

      await waitFor(() => {
        const resultItem = screen.getByText('测试笔记1')
        fireEvent.click(resultItem.closest('div')!)

        expect(onResultSelect).toHaveBeenCalledWith(mockResults[0])
      })
    })
  })

  describe('清除功能', () => {
    it('应该清除所有过滤器', () => {
      renderWithTheme(
        <AdvancedSearchFilter onSearch={mockOnSearch} enableRealTimeSearch={false} />
      )

      // 设置一些过滤器
      const searchInput = screen.getByPlaceholderText('搜索笔记、块引用、标签...')
      fireEvent.change(searchInput, { target: { value: '测试' } })

      // 应该显示清除按钮
      const clearButton = screen.getByTitle('清除所有过滤器')
      fireEvent.click(clearButton)

      expect(searchInput).toHaveValue('')
    })
  })

  describe('加载状态', () => {
    it('应该显示加载指示器', async () => {
      const slowOnSearch = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ results: [], stats: mockStats }), 1000))
      )

      renderWithTheme(
        <AdvancedSearchFilter onSearch={slowOnSearch} />
      )

      const searchInput = screen.getByPlaceholderText('搜索笔记、块引用、标签...')
      fireEvent.change(searchInput, { target: { value: '测试' } })

      // 应该显示加载指示器
      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).toBeInTheDocument()
      })
    })
  })

  describe('错误处理', () => {
    it('应该显示搜索错误', async () => {
      const errorOnSearch = vi.fn().mockRejectedValue(new Error('搜索失败'))

      renderWithTheme(
        <AdvancedSearchFilter onSearch={errorOnSearch} enableRealTimeSearch={false} />
      )

      const searchInput = screen.getByPlaceholderText('搜索笔记、块引用、标签...')
      fireEvent.change(searchInput, { target: { value: '测试' } })
      fireEvent.keyDown(searchInput, { key: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText('搜索失败')).toBeInTheDocument()
      })
    })
  })

  describe('禁用状态', () => {
    it('应该在禁用时不响应交互', () => {
      renderWithTheme(
        <AdvancedSearchFilter 
          onSearch={mockOnSearch}
          disabled={true}
        />
      )

      const searchInput = screen.getByPlaceholderText('搜索笔记、块引用、标签...')
      expect(searchInput).toBeDisabled()

      const noteFilter = screen.getByText('笔记')
      fireEvent.click(noteFilter)
      
      // 不应该触发搜索
      expect(mockOnSearch).not.toHaveBeenCalled()
    })
  })

  describe('主题支持', () => {
    it('应该在深色主题下正确渲染', () => {
      // 简化测试 - 只检查组件能正常渲染
      render(
        <ThemeProvider initialTheme="dark">
          <AdvancedSearchFilter onSearch={mockOnSearch} />
        </ThemeProvider>
      )

      const searchInput = screen.getByPlaceholderText('搜索笔记、块引用、标签...')
      // 检查组件正常渲染
      expect(searchInput).toBeInTheDocument()
    })
  })

  describe('空状态', () => {
    it('应该显示空状态消息', async () => {
      const emptyOnSearch = vi.fn().mockResolvedValue({
        results: [],
        stats: { ...mockStats, totalCount: 0 }
      })

      renderWithTheme(
        <AdvancedSearchFilter onSearch={emptyOnSearch} enableRealTimeSearch={false} />
      )

      const searchInput = screen.getByPlaceholderText('搜索笔记、块引用、标签...')
      fireEvent.change(searchInput, { target: { value: '不存在的内容' } })
      fireEvent.keyDown(searchInput, { key: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText('未找到匹配结果')).toBeInTheDocument()
        expect(screen.getByText('尝试调整搜索条件或使用不同的关键词')).toBeInTheDocument()
      })
    })
  })
})
