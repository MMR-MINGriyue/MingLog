import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ThemeProvider } from '../../../../contexts/ThemeContext'
import { BlockReferenceAutoComplete, BlockSuggestion } from '../BlockReferenceAutoComplete'

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
)

describe('BlockReferenceAutoComplete', () => {
  const mockOnSelect = vi.fn()
  const mockOnClose = vi.fn()

  const mockSuggestions: BlockSuggestion[] = [
    {
      blockId: 'block-123',
      preview: '这是第一个块的内容',
      blockType: 'paragraph',
      pageName: '技术文档',
      score: 100,
      matchType: 'exact',
      referenceCount: 5,
      createdAt: '2025-01-14T10:00:00Z'
    },
    {
      blockId: 'block-456',
      preview: '这是第二个块的内容',
      blockType: 'heading',
      pageName: '用户指南',
      score: 80,
      matchType: 'prefix',
      referenceCount: 3,
      createdAt: '2025-01-13T15:30:00Z'
    },
    {
      blockId: 'block-789',
      preview: '这是第三个块的内容',
      blockType: 'code',
      pageName: 'API文档',
      score: 60,
      matchType: 'contains',
      referenceCount: 1,
      createdAt: '2025-01-12T09:15:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该在visible为true时显示', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={mockSuggestions}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(screen.getByText('块引用建议 (3)')).toBeInTheDocument()
      expect(screen.getByText('这是第一个块的内容')).toBeInTheDocument()
    })

    it('应该在visible为false时隐藏', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={mockSuggestions}
            visible={false}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(screen.queryByText('块引用建议')).not.toBeInTheDocument()
    })

    it('应该在没有建议时隐藏', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={[]}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
            showCreateOption={false}
          />
        </TestWrapper>
      )

      expect(screen.queryByText('块引用建议')).not.toBeInTheDocument()
    })
  })

  describe('建议显示', () => {
    it('应该显示所有建议项', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={mockSuggestions}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(screen.getByText('这是第一个块的内容')).toBeInTheDocument()
      expect(screen.getByText('这是第二个块的内容')).toBeInTheDocument()
      expect(screen.getByText('这是第三个块的内容')).toBeInTheDocument()
    })

    it('应该显示块类型图标', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={mockSuggestions}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      const icons = document.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('应该显示匹配类型标识', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={mockSuggestions}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(screen.getByText('精确')).toBeInTheDocument()
      expect(screen.getByText('前缀')).toBeInTheDocument()
      expect(screen.getByText('包含')).toBeInTheDocument()
    })

    it('应该显示引用计数和日期', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={mockSuggestions}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(screen.getByText('5 引用')).toBeInTheDocument()
      expect(screen.getByText('3 引用')).toBeInTheDocument()
      expect(screen.getByText('1 引用')).toBeInTheDocument()
    })
  })

  describe('创建选项', () => {
    it('应该显示创建选项', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="新块"
            suggestions={[]}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
            showCreateOption={true}
          />
        </TestWrapper>
      )

      expect(screen.getByText('创建新块')).toBeInTheDocument()
      expect(screen.getByText('创建新块 "新块"')).toBeInTheDocument()
      expect(screen.getByText('新建')).toBeInTheDocument()
    })

    it('应该隐藏创建选项', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="新块"
            suggestions={[]}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
            showCreateOption={false}
          />
        </TestWrapper>
      )

      expect(screen.queryByText('创建新块')).not.toBeInTheDocument()
    })
  })

  describe('交互功能', () => {
    it('应该处理点击选择', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={mockSuggestions}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      const firstSuggestion = screen.getByText('这是第一个块的内容').closest('div')
      fireEvent.click(firstSuggestion!)

      expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0])
    })

    it('应该处理关闭按钮点击', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={mockSuggestions}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      const closeButton = screen.getByTitle('关闭建议')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('应该处理键盘导航', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={mockSuggestions}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      // 模拟键盘事件
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: 'Enter' })

      expect(mockOnSelect).toHaveBeenCalled()
    })

    it('应该处理Escape键关闭', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={mockSuggestions}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('加载状态', () => {
    it('应该显示加载状态', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={[]}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
            loading={true}
          />
        </TestWrapper>
      )

      expect(screen.getByText('搜索中...')).toBeInTheDocument()
      expect(screen.getByText('搜索块引用...')).toBeInTheDocument()
    })

    it('应该在非加载状态显示正常内容', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={mockSuggestions}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
            loading={false}
          />
        </TestWrapper>
      )

      expect(screen.queryByText('搜索中...')).not.toBeInTheDocument()
      expect(screen.getByText('块引用建议 (3)')).toBeInTheDocument()
    })
  })

  describe('限制和历史记录', () => {
    it('应该限制显示的项目数量', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={mockSuggestions}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
            maxItems={2}
          />
        </TestWrapper>
      )

      expect(screen.getByText('这是第一个块的内容')).toBeInTheDocument()
      expect(screen.getByText('这是第二个块的内容')).toBeInTheDocument()
      expect(screen.queryByText('这是第三个块的内容')).not.toBeInTheDocument()
    })

    it('应该显示历史记录', () => {
      const historyItems = [mockSuggestions[0]]

      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query=""
            suggestions={[]}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
            showHistory={true}
            history={historyItems}
          />
        </TestWrapper>
      )

      expect(screen.getByText('这是第一个块的内容')).toBeInTheDocument()
    })
  })

  describe('无障碍功能', () => {
    it('应该有正确的ARIA标签', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={mockSuggestions}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      const closeButton = screen.getByTitle('关闭建议')
      expect(closeButton).toHaveAttribute('aria-label', '关闭建议')
    })

    it('应该支持键盘导航提示', () => {
      render(
        <TestWrapper>
          <BlockReferenceAutoComplete
            query="test"
            suggestions={mockSuggestions}
            visible={true}
            position={{ x: 100, y: 200 }}
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </TestWrapper>
      )

      expect(screen.getByText('↑↓ 选择 • Enter 确认 • Esc 取消')).toBeInTheDocument()
    })
  })
})
