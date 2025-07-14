import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ThemeProvider } from '../../../../contexts/ThemeContext'
import { BlockReference } from '../BlockReference'

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
)

describe('BlockReference', () => {
  const mockOnClick = vi.fn()
  const mockOnPreview = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnPreview.mockResolvedValue('这是块的预览内容')
  })

  describe('基础渲染', () => {
    it('应该渲染块引用', () => {
      render(
        <TestWrapper>
          <BlockReference blockId="block-123" />
        </TestWrapper>
      )

      expect(screen.getByRole('link')).toBeInTheDocument()
      expect(screen.getByText(/块 block-12/)).toBeInTheDocument()
    })

    it('应该显示自定义文本', () => {
      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            displayText="自定义显示文本"
          />
        </TestWrapper>
      )

      expect(screen.getByText('自定义显示文本')).toBeInTheDocument()
    })

    it('应该显示块内容预览', () => {
      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            blockContent="这是块的内容，会被截断显示前50个字符"
          />
        </TestWrapper>
      )

      expect(screen.getByText('这是块的内容，会被截断显示前50个字符')).toBeInTheDocument()
    })
  })

  describe('交互功能', () => {
    it('应该处理点击事件', () => {
      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            onClick={mockOnClick}
          />
        </TestWrapper>
      )

      fireEvent.click(screen.getByRole('link'))
      expect(mockOnClick).toHaveBeenCalledWith('block-123')
    })

    it('应该处理键盘事件', () => {
      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            onClick={mockOnClick}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      fireEvent.keyDown(link, { key: 'Enter' })
      expect(mockOnClick).toHaveBeenCalledWith('block-123')

      fireEvent.keyDown(link, { key: ' ' })
      expect(mockOnClick).toHaveBeenCalledTimes(2)
    })

    it('应该在禁用时不响应点击', () => {
      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            onClick={mockOnClick}
            disabled={true}
          />
        </TestWrapper>
      )

      fireEvent.click(screen.getByRole('link'))
      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('悬停预览', () => {
    it('应该显示悬停预览', async () => {
      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            onPreview={mockOnPreview}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      fireEvent.mouseEnter(link)

      await waitFor(() => {
        expect(screen.getByText('加载中...')).toBeInTheDocument()
      }, { timeout: 600 })

      await waitFor(() => {
        expect(screen.getByText('这是块的预览内容')).toBeInTheDocument()
      }, { timeout: 1000 })

      expect(mockOnPreview).toHaveBeenCalledWith('block-123')
    })

    it('应该在鼠标离开时隐藏预览', async () => {
      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            onPreview={mockOnPreview}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      fireEvent.mouseEnter(link)
      fireEvent.mouseLeave(link)

      // 等待隐藏延迟
      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument()
      }, { timeout: 300 })
    })

    it('应该处理预览加载失败', async () => {
      mockOnPreview.mockRejectedValue(new Error('加载失败'))

      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            onPreview={mockOnPreview}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      fireEvent.mouseEnter(link)

      await waitFor(() => {
        expect(screen.getByText('无法加载预览')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('样式变体', () => {
    it('应该应用默认样式', () => {
      render(
        <TestWrapper>
          <BlockReference blockId="block-123" variant="default" />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-green-600')
    })

    it('应该应用嵌入样式', () => {
      render(
        <TestWrapper>
          <BlockReference blockId="block-123" variant="embed" />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-blue-600')
    })

    it('应该应用提及样式', () => {
      render(
        <TestWrapper>
          <BlockReference blockId="block-123" variant="mention" />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-purple-600')
    })

    it('应该应用断开链接样式', () => {
      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            variant="broken"
            exists={false}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-red-600')
    })

    it('应该应用禁用样式', () => {
      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            disabled={true}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-gray-400')
    })
  })

  describe('尺寸变体', () => {
    it('应该应用小尺寸样式', () => {
      render(
        <TestWrapper>
          <BlockReference blockId="block-123" size="sm" />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-xs')
    })

    it('应该应用中等尺寸样式', () => {
      render(
        <TestWrapper>
          <BlockReference blockId="block-123" size="md" />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-sm')
    })

    it('应该应用大尺寸样式', () => {
      render(
        <TestWrapper>
          <BlockReference blockId="block-123" size="lg" />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-base')
    })
  })

  describe('显示模式', () => {
    it('应该渲染内联模式', () => {
      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            displayMode="inline"
          />
        </TestWrapper>
      )

      const container = screen.getByRole('link').parentElement
      expect(container).toHaveClass('relative', 'inline-block')
    })

    it('应该渲染块模式', () => {
      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            displayMode="block"
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('block', 'w-full')
    })

    it('应该渲染卡片模式', () => {
      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            displayMode="card"
          />
        </TestWrapper>
      )

      expect(screen.getByText(/块引用 block-12/)).toBeInTheDocument()
      const link = screen.getByRole('link')
      expect(link).toHaveClass('block', 'w-full')
    })
  })

  describe('图标显示', () => {
    it('应该显示图标', () => {
      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            showIcon={true}
          />
        </TestWrapper>
      )

      const icon = screen.getByRole('link').querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('应该隐藏图标', () => {
      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            showIcon={false}
          />
        </TestWrapper>
      )

      const icon = screen.getByRole('link').querySelector('svg')
      expect(icon).not.toBeInTheDocument()
    })

    it('应该根据块类型显示不同图标', () => {
      const { rerender } = render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            blockType="heading"
          />
        </TestWrapper>
      )

      let icon = screen.getByRole('link').querySelector('svg')
      expect(icon).toBeInTheDocument()

      rerender(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            blockType="code"
          />
        </TestWrapper>
      )

      icon = screen.getByRole('link').querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('无障碍功能', () => {
    it('应该有正确的ARIA标签', () => {
      render(
        <TestWrapper>
          <BlockReference 
            blockId="block-123" 
            displayText="自定义文本"
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('aria-label', '块引用 block-123 (显示为: 自定义文本)')
    })

    it('应该有正确的tabIndex', () => {
      const { rerender } = render(
        <TestWrapper>
          <BlockReference blockId="block-123" />
        </TestWrapper>
      )

      let link = screen.getByRole('link')
      expect(link).toHaveAttribute('tabIndex', '0')

      rerender(
        <TestWrapper>
          <BlockReference blockId="block-123" disabled={true} />
        </TestWrapper>
      )

      link = screen.getByRole('link')
      expect(link).toHaveAttribute('tabIndex', '-1')
    })
  })
})
