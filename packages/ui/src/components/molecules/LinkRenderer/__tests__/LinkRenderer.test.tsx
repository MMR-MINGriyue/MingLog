import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ThemeProvider } from '../../../../contexts/ThemeContext'
import { LinkRenderer, extractLinks, hasLinks, getLinkStats } from '../LinkRenderer'

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
)

describe('LinkRenderer', () => {
  const mockOnLinkClick = vi.fn()
  const mockOnLinkPreview = vi.fn()
  const mockCheckLinkExists = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckLinkExists.mockReturnValue(true)
  })

  describe('基础渲染', () => {
    it('应该渲染纯文本', () => {
      render(
        <TestWrapper>
          <LinkRenderer content="这是一段普通文本" />
        </TestWrapper>
      )

      expect(screen.getByText('这是一段普通文本')).toBeInTheDocument()
    })

    it('应该渲染包含链接的文本', () => {
      render(
        <TestWrapper>
          <LinkRenderer 
            content="这是一个 [[测试页面]] 的链接"
            onLinkClick={mockOnLinkClick}
          />
        </TestWrapper>
      )

      expect(screen.getByText('这是一个')).toBeInTheDocument()
      expect(screen.getByText('的链接')).toBeInTheDocument()
      expect(screen.getByRole('link')).toHaveTextContent('测试页面')
    })

    it('应该渲染别名链接', () => {
      render(
        <TestWrapper>
          <LinkRenderer 
            content="查看 [[技术文档|文档]] 了解更多"
            onLinkClick={mockOnLinkClick}
          />
        </TestWrapper>
      )

      expect(screen.getByText('查看')).toBeInTheDocument()
      expect(screen.getByText('了解更多')).toBeInTheDocument()
      expect(screen.getByRole('link')).toHaveTextContent('文档')
    })

    it('应该渲染多个链接', () => {
      render(
        <TestWrapper>
          <LinkRenderer 
            content="参考 [[页面A]] 和 [[页面B|B页面]] 的内容"
            onLinkClick={mockOnLinkClick}
          />
        </TestWrapper>
      )

      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2)
      expect(links[0]).toHaveTextContent('页面A')
      expect(links[1]).toHaveTextContent('B页面')
    })
  })

  describe('链接状态', () => {
    it('应该显示存在的链接', () => {
      mockCheckLinkExists.mockReturnValue(true)

      render(
        <TestWrapper>
          <LinkRenderer 
            content="链接到 [[存在页面]]"
            checkLinkExists={mockCheckLinkExists}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-blue-600')
    })

    it('应该显示不存在的链接', () => {
      mockCheckLinkExists.mockReturnValue(false)

      render(
        <TestWrapper>
          <LinkRenderer 
            content="链接到 [[不存在页面]]"
            checkLinkExists={mockCheckLinkExists}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-red-600')
    })

    it('应该显示别名链接样式', () => {
      render(
        <TestWrapper>
          <LinkRenderer 
            content="链接到 [[页面|别名]]"
            checkLinkExists={mockCheckLinkExists}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-purple-600')
    })
  })

  describe('交互行为', () => {
    it('应该处理链接点击', () => {
      render(
        <TestWrapper>
          <LinkRenderer 
            content="点击 [[测试页面]]"
            onLinkClick={mockOnLinkClick}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      fireEvent.click(link)

      expect(mockOnLinkClick).toHaveBeenCalledWith('测试页面')
    })

    it('应该传递自定义链接属性', () => {
      render(
        <TestWrapper>
          <LinkRenderer 
            content="链接 [[页面]]"
            linkProps={{ size: 'lg', disabled: true }}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-lg')
      expect(link).toHaveClass('cursor-not-allowed')
    })
  })

  describe('换行处理', () => {
    it('应该保留换行符', () => {
      const { container } = render(
        <TestWrapper>
          <LinkRenderer
            content="第一行\n第二行"
            preserveLineBreaks={true}
          />
        </TestWrapper>
      )

      // 检查内容包含换行符
      expect(container.textContent).toContain('第一行')
      expect(container.textContent).toContain('第二行')
    })

    it('应该忽略换行符', () => {
      render(
        <TestWrapper>
          <LinkRenderer 
            content="第一行\n第二行"
            preserveLineBreaks={false}
          />
        </TestWrapper>
      )

      const br = document.querySelector('br')
      expect(br).not.toBeInTheDocument()
    })
  })

  describe('自定义样式', () => {
    it('应该应用自定义类名', () => {
      const { container } = render(
        <TestWrapper>
          <LinkRenderer 
            content="测试内容"
            className="custom-class"
          />
        </TestWrapper>
      )

      const span = container.querySelector('span')
      expect(span).toHaveClass('custom-class')
    })
  })
})

describe('工具函数', () => {
  describe('extractLinks', () => {
    it('应该提取简单链接', () => {
      const links = extractLinks('这是 [[页面]] 链接')
      
      expect(links).toHaveLength(1)
      expect(links[0]).toEqual({
        pageName: '页面',
        displayText: undefined,
        fullMatch: '[[页面]]',
        startIndex: 3,
        endIndex: 9
      })
    })

    it('应该提取别名链接', () => {
      const links = extractLinks('这是 [[页面|别名]] 链接')
      
      expect(links).toHaveLength(1)
      expect(links[0]).toEqual({
        pageName: '页面',
        displayText: '别名',
        fullMatch: '[[页面|别名]]',
        startIndex: 3,
        endIndex: 12
      })
    })

    it('应该提取多个链接', () => {
      const links = extractLinks('[[页面A]] 和 [[页面B|B]]')
      
      expect(links).toHaveLength(2)
      expect(links[0].pageName).toBe('页面A')
      expect(links[1].pageName).toBe('页面B')
      expect(links[1].displayText).toBe('B')
    })

    it('应该处理空文本', () => {
      const links = extractLinks('')
      expect(links).toHaveLength(0)
    })
  })

  describe('hasLinks', () => {
    it('应该检测包含链接的文本', () => {
      expect(hasLinks('包含 [[链接]] 的文本')).toBe(true)
      expect(hasLinks('[[开头链接]] 文本')).toBe(true)
      expect(hasLinks('文本 [[结尾链接]]')).toBe(true)
    })

    it('应该检测不包含链接的文本', () => {
      expect(hasLinks('普通文本')).toBe(false)
      expect(hasLinks('[单括号]')).toBe(false)
      expect(hasLinks('')).toBe(false)
    })
  })

  describe('getLinkStats', () => {
    it('应该统计链接信息', () => {
      const stats = getLinkStats('[[页面A]] 和 [[页面B|别名]] 以及 [[页面A]] 再次')
      
      expect(stats).toEqual({
        totalLinks: 3,
        uniquePages: 2,
        aliasLinks: 1,
        directLinks: 2
      })
    })

    it('应该处理空文本', () => {
      const stats = getLinkStats('')
      
      expect(stats).toEqual({
        totalLinks: 0,
        uniquePages: 0,
        aliasLinks: 0,
        directLinks: 0
      })
    })

    it('应该处理无链接文本', () => {
      const stats = getLinkStats('普通文本没有链接')
      
      expect(stats).toEqual({
        totalLinks: 0,
        uniquePages: 0,
        aliasLinks: 0,
        directLinks: 0
      })
    })
  })
})
