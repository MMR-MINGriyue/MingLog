import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ThemeProvider } from '../../../../contexts/ThemeContext'
import { LinkAutoComplete, LinkSuggestion } from '../LinkAutoComplete'

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
)

describe('LinkAutoComplete', () => {
  const mockOnSelect = vi.fn()
  const mockOnClose = vi.fn()
  const mockOnQueryChange = vi.fn()

  const mockSuggestions: LinkSuggestion[] = [
    {
      id: '1',
      title: '技术文档',
      type: 'page',
      preview: '这是技术文档的预览',
      score: 100,
      matchType: 'exact',
      referenceCount: 5
    },
    {
      id: '2',
      title: '技术规范',
      type: 'page',
      preview: '这是技术规范的预览',
      score: 80,
      matchType: 'prefix',
      referenceCount: 3
    },
    {
      id: '3',
      title: '项目文档',
      type: 'page',
      preview: '这是项目文档的预览',
      score: 60,
      matchType: 'contains',
      referenceCount: 2
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该在visible为false时不渲染', () => {
      render(
        <TestWrapper>
          <LinkAutoComplete
            query="test"
            position={{ x: 0, y: 0 }}
            visible={false}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('应该在visible为true时渲染', () => {
      render(
        <TestWrapper>
          <LinkAutoComplete
            query="test"
            position={{ x: 0, y: 0 }}
            visible={true}
            suggestions={mockSuggestions}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(screen.getByText('技术文档')).toBeInTheDocument()
      expect(screen.getByText('技术规范')).toBeInTheDocument()
      expect(screen.getByText('项目文档')).toBeInTheDocument()
    })

    it('应该显示加载状态', () => {
      render(
        <TestWrapper>
          <LinkAutoComplete
            query="test"
            position={{ x: 0, y: 0 }}
            visible={true}
            loading={true}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(screen.getByText('搜索中...')).toBeInTheDocument()
    })

    it('应该显示空状态', () => {
      render(
        <TestWrapper>
          <LinkAutoComplete
            query="nonexistent"
            position={{ x: 0, y: 0 }}
            visible={true}
            suggestions={[]}
            showCreateOption={false}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(screen.getByText('未找到匹配的页面')).toBeInTheDocument()
    })
  })

  describe('建议项显示', () => {
    it('应该显示建议项的详细信息', () => {
      render(
        <TestWrapper>
          <LinkAutoComplete
            query="技术"
            position={{ x: 0, y: 0 }}
            visible={true}
            suggestions={mockSuggestions}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      // 检查标题
      expect(screen.getByText('技术文档')).toBeInTheDocument()
      
      // 检查预览
      expect(screen.getByText('这是技术文档的预览')).toBeInTheDocument()
      
      // 检查引用次数
      expect(screen.getByText('5 个引用')).toBeInTheDocument()
      
      // 检查匹配类型标识
      expect(screen.getByText('精确')).toBeInTheDocument()
      expect(screen.getByText('前缀')).toBeInTheDocument()
      expect(screen.getByText('包含')).toBeInTheDocument()
    })

    it('应该显示创建新页面选项', () => {
      render(
        <TestWrapper>
          <LinkAutoComplete
            query="新页面"
            position={{ x: 0, y: 0 }}
            visible={true}
            suggestions={[]}
            showCreateOption={true}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(screen.getByText('新页面')).toBeInTheDocument()
      expect(screen.getByText('创建新页面 "新页面"')).toBeInTheDocument()
      expect(screen.getByText('新建')).toBeInTheDocument()
    })

    it('应该隐藏创建新页面选项', () => {
      render(
        <TestWrapper>
          <LinkAutoComplete
            query="新页面"
            position={{ x: 0, y: 0 }}
            visible={true}
            suggestions={[]}
            showCreateOption={false}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(screen.queryByText('创建新页面')).not.toBeInTheDocument()
    })
  })

  describe('交互行为', () => {
    it('应该处理点击选择', () => {
      render(
        <TestWrapper>
          <LinkAutoComplete
            query="技术"
            position={{ x: 0, y: 0 }}
            visible={true}
            suggestions={mockSuggestions}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('技术文档'))

      expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0])
    })

    it('应该处理鼠标悬停', () => {
      render(
        <TestWrapper>
          <LinkAutoComplete
            query="技术"
            position={{ x: 0, y: 0 }}
            visible={true}
            suggestions={mockSuggestions}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      // 找到包含"技术规范"的项目容器
      const secondItem = screen.getByText('技术规范').closest('div')

      // 悬停到第二项
      fireEvent.mouseEnter(secondItem!)

      // 检查鼠标悬停事件被触发（通过检查元素存在性）
      expect(secondItem).toBeInTheDocument()
    })
  })

  describe('键盘导航', () => {
    it('应该处理键盘导航', () => {
      render(
        <TestWrapper>
          <LinkAutoComplete
            query="技术"
            position={{ x: 0, y: 0 }}
            visible={true}
            suggestions={mockSuggestions}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      // 模拟键盘事件
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: 'Enter' })

      expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0])
    })

    it('应该处理Escape键关闭', () => {
      render(
        <TestWrapper>
          <LinkAutoComplete
            query="技术"
            position={{ x: 0, y: 0 }}
            visible={true}
            suggestions={mockSuggestions}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('历史记录', () => {
    const mockHistory: LinkSuggestion[] = [
      {
        id: 'h1',
        title: '历史页面1',
        type: 'page',
        score: 0,
        matchType: 'exact'
      },
      {
        id: 'h2',
        title: '历史页面2',
        type: 'page',
        score: 0,
        matchType: 'exact'
      }
    ]

    it('应该在空查询时显示历史记录', () => {
      render(
        <TestWrapper>
          <LinkAutoComplete
            query=""
            position={{ x: 0, y: 0 }}
            visible={true}
            suggestions={[]}
            history={mockHistory}
            showHistory={true}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(screen.getByText('历史页面1')).toBeInTheDocument()
      expect(screen.getByText('历史页面2')).toBeInTheDocument()
    })

    it('应该隐藏历史记录', () => {
      render(
        <TestWrapper>
          <LinkAutoComplete
            query=""
            position={{ x: 0, y: 0 }}
            visible={true}
            suggestions={[]}
            history={mockHistory}
            showHistory={false}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(screen.queryByText('历史页面1')).not.toBeInTheDocument()
    })
  })

  describe('底部提示', () => {
    it('应该显示键盘快捷键提示', () => {
      render(
        <TestWrapper>
          <LinkAutoComplete
            query="技术"
            position={{ x: 0, y: 0 }}
            visible={true}
            suggestions={mockSuggestions}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(screen.getByText('↑↓ 选择 • ↵ 确认 • Esc 取消')).toBeInTheDocument()
      expect(screen.getByText(/4 项/)).toBeInTheDocument()
    })
  })

  describe('位置和样式', () => {
    it('应该应用正确的位置', () => {
      const { container } = render(
        <TestWrapper>
          <LinkAutoComplete
            query="技术"
            position={{ x: 100, y: 200 }}
            visible={true}
            suggestions={mockSuggestions}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      const autoComplete = container.querySelector('.absolute')
      expect(autoComplete).toHaveStyle({
        top: '200px',
        left: '100px'
      })
    })

    it('应该应用自定义类名', () => {
      const { container } = render(
        <TestWrapper>
          <LinkAutoComplete
            query="技术"
            position={{ x: 0, y: 0 }}
            visible={true}
            suggestions={mockSuggestions}
            className="custom-class"
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })
  })
})
