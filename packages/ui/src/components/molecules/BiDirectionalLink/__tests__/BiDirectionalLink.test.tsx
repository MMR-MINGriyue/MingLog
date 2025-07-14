import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ThemeProvider } from '../../../../contexts/ThemeContext'
import { BiDirectionalLink } from '../BiDirectionalLink'

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
)

describe('BiDirectionalLink', () => {
  const mockOnClick = vi.fn()
  const mockOnPreview = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该渲染基本的链接', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink pageName="测试页面" />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveTextContent('测试页面')
    })

    it('应该显示别名文本', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="技术文档" 
            displayText="文档" 
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveTextContent('文档')
      expect(link).toHaveAttribute('aria-label', '链接到 技术文档 (显示为: 文档)')
    })

    it('应该显示图标', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="测试页面" 
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
          <BiDirectionalLink 
            pageName="测试页面" 
            showIcon={false}
          />
        </TestWrapper>
      )

      const icon = screen.getByRole('link').querySelector('svg')
      expect(icon).not.toBeInTheDocument()
    })
  })

  describe('链接状态', () => {
    it('应该显示存在的链接样式', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="存在页面" 
            exists={true}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-blue-600')
    })

    it('应该显示不存在的链接样式', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="不存在页面" 
            exists={false}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-red-600')
    })

    it('应该显示别名链接样式', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="页面" 
            variant="alias"
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-purple-600')
    })

    it('应该显示断开链接样式', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="页面" 
            variant="broken"
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-red-600')
    })
  })

  describe('大小变体', () => {
    it('应该应用小尺寸样式', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="页面" 
            size="sm"
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-sm')
    })

    it('应该应用中等尺寸样式', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="页面" 
            size="md"
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-base')
    })

    it('应该应用大尺寸样式', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="页面" 
            size="lg"
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-lg')
    })
  })

  describe('交互行为', () => {
    it('应该处理点击事件', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="测试页面" 
            onClick={mockOnClick}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      fireEvent.click(link)

      expect(mockOnClick).toHaveBeenCalledWith('测试页面')
    })

    it('应该处理键盘事件', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="测试页面" 
            onClick={mockOnClick}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      fireEvent.keyDown(link, { key: 'Enter' })

      expect(mockOnClick).toHaveBeenCalledWith('测试页面')
    })

    it('应该处理空格键', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="测试页面" 
            onClick={mockOnClick}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      fireEvent.keyDown(link, { key: ' ' })

      expect(mockOnClick).toHaveBeenCalledWith('测试页面')
    })

    it('禁用状态下不应该响应点击', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="测试页面" 
            onClick={mockOnClick}
            disabled={true}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      fireEvent.click(link)

      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('禁用状态', () => {
    it('应该显示禁用样式', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="页面" 
            disabled={true}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-gray-400', 'cursor-not-allowed')
      expect(link).toHaveAttribute('tabIndex', '-1')
    })
  })

  describe('预览功能', () => {
    it('应该在悬停时显示加载状态', async () => {
      mockOnPreview.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve('预览内容'), 100)
      ))

      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="测试页面" 
            onPreview={mockOnPreview}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      fireEvent.mouseEnter(link)

      // 等待悬停延迟
      await waitFor(() => {
        expect(screen.getByText('加载预览...')).toBeInTheDocument()
      }, { timeout: 600 })
    })

    it('应该显示预览内容', async () => {
      mockOnPreview.mockResolvedValue('这是预览内容')

      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="测试页面" 
            onPreview={mockOnPreview}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      fireEvent.mouseEnter(link)

      await waitFor(() => {
        expect(screen.getAllByText('测试页面')).toHaveLength(2) // 链接文本 + 预览标题
        expect(screen.getByText('这是预览内容')).toBeInTheDocument()
      }, { timeout: 600 })
    })

    it('应该在鼠标离开时隐藏预览', async () => {
      mockOnPreview.mockResolvedValue('预览内容')

      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="测试页面" 
            onPreview={mockOnPreview}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      fireEvent.mouseEnter(link)

      await waitFor(() => {
        expect(screen.getByText('预览内容')).toBeInTheDocument()
      }, { timeout: 600 })

      fireEvent.mouseLeave(link)

      await waitFor(() => {
        expect(screen.queryByText('预览内容')).not.toBeInTheDocument()
      }, { timeout: 300 })
    })
  })

  describe('自定义样式', () => {
    it('应该应用自定义类名', () => {
      render(
        <TestWrapper>
          <BiDirectionalLink 
            pageName="页面" 
            className="custom-class"
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('custom-class')
    })
  })
})
