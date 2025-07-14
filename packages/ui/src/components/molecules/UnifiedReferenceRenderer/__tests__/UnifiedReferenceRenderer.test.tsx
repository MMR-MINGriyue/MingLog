import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ThemeProvider } from '../../../../contexts/ThemeContext'
import { 
  UnifiedReferenceRenderer, 
  extractAllReferences, 
  hasAnyReferences, 
  getReferenceStats
} from '../UnifiedReferenceRenderer'

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
)

describe('UnifiedReferenceRenderer', () => {
  const mockOnLinkClick = vi.fn()
  const mockOnLinkPreview = vi.fn()
  const mockCheckLinkExists = vi.fn()
  const mockOnBlockClick = vi.fn()
  const mockOnBlockPreview = vi.fn()
  const mockCheckBlockExists = vi.fn()
  const mockGetBlockContent = vi.fn()
  const mockGetBlockType = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckLinkExists.mockReturnValue(true)
    mockCheckBlockExists.mockReturnValue(true)
    mockGetBlockContent.mockReturnValue('这是块的内容')
    mockGetBlockType.mockReturnValue('paragraph')
    mockOnLinkPreview.mockResolvedValue('链接预览内容')
    mockOnBlockPreview.mockResolvedValue('块预览内容')
  })

  describe('基础渲染', () => {
    it('应该渲染纯文本内容', () => {
      render(
        <TestWrapper>
          <UnifiedReferenceRenderer content="这是纯文本，没有任何引用" />
        </TestWrapper>
      )

      expect(screen.getByText('这是纯文本，没有任何引用')).toBeInTheDocument()
    })

    it('应该渲染只包含双向链接的文本', () => {
      render(
        <TestWrapper>
          <UnifiedReferenceRenderer 
            content="这是包含 [[页面A]] 的文本"
            onLinkClick={mockOnLinkClick}
            checkLinkExists={mockCheckLinkExists}
          />
        </TestWrapper>
      )

      expect(screen.getByText('这是包含', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('的文本', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('页面A')).toBeInTheDocument()
    })

    it('应该渲染只包含块引用的文本', () => {
      render(
        <TestWrapper>
          <UnifiedReferenceRenderer 
            content="这是包含 ((block-123)) 的文本"
            onBlockClick={mockOnBlockClick}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      expect(screen.getByText('这是包含', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('的文本', { exact: false })).toBeInTheDocument()
      expect(screen.getByText(/块 block-12/)).toBeInTheDocument()
    })

    it('应该渲染混合引用的文本', () => {
      render(
        <TestWrapper>
          <UnifiedReferenceRenderer 
            content="参考 [[页面A]] 和 ((block-123)) 的内容"
            onLinkClick={mockOnLinkClick}
            onBlockClick={mockOnBlockClick}
            checkLinkExists={mockCheckLinkExists}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      expect(screen.getByText('参考', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('和', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('的内容', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('页面A')).toBeInTheDocument()
      expect(screen.getByText(/块 block-12/)).toBeInTheDocument()
    })

    it('应该处理空内容', () => {
      render(
        <TestWrapper>
          <UnifiedReferenceRenderer content="" />
        </TestWrapper>
      )

      const container = document.querySelector('span')
      expect(container).toBeInTheDocument()
    })
  })

  describe('引用交互', () => {
    it('应该处理双向链接点击', () => {
      render(
        <TestWrapper>
          <UnifiedReferenceRenderer 
            content="点击 [[页面A]] 链接"
            onLinkClick={mockOnLinkClick}
            checkLinkExists={mockCheckLinkExists}
          />
        </TestWrapper>
      )

      const link = screen.getByText('页面A')
      fireEvent.click(link)
      expect(mockOnLinkClick).toHaveBeenCalledWith('页面A')
    })

    it('应该处理块引用点击', () => {
      render(
        <TestWrapper>
          <UnifiedReferenceRenderer 
            content="点击 ((block-123)) 块"
            onBlockClick={mockOnBlockClick}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      const blockLinks = screen.getAllByRole('link')
      fireEvent.click(blockLinks[0])
      expect(mockOnBlockClick).toHaveBeenCalledWith('block-123')
    })

    it('应该处理混合引用的点击', () => {
      render(
        <TestWrapper>
          <UnifiedReferenceRenderer 
            content="点击 [[页面A]] 或 ((block-123))"
            onLinkClick={mockOnLinkClick}
            onBlockClick={mockOnBlockClick}
            checkLinkExists={mockCheckLinkExists}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      // 点击页面链接
      const pageLink = screen.getByText('页面A')
      fireEvent.click(pageLink)
      expect(mockOnLinkClick).toHaveBeenCalledWith('页面A')

      // 点击块引用
      const blockLinks = screen.getAllByRole('link')
      const blockLink = blockLinks.find(link => link.getAttribute('aria-label')?.includes('block-123'))
      fireEvent.click(blockLink!)
      expect(mockOnBlockClick).toHaveBeenCalledWith('block-123')
    })
  })

  describe('引用状态', () => {
    it('应该显示存在的链接和块', () => {
      mockCheckLinkExists.mockReturnValue(true)
      mockCheckBlockExists.mockReturnValue(true)

      render(
        <TestWrapper>
          <UnifiedReferenceRenderer 
            content="存在的 [[页面A]] 和 ((block-123))"
            checkLinkExists={mockCheckLinkExists}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      const pageLink = screen.getByText('页面A')
      const blockLink = screen.getByText(/块 block-12/)

      // 验证链接和块引用都被正确渲染
      expect(pageLink).toBeInTheDocument()
      expect(blockLink).toBeInTheDocument()
    })

    it('应该显示不存在的链接和块', () => {
      mockCheckLinkExists.mockReturnValue(false)
      mockCheckBlockExists.mockReturnValue(false)

      render(
        <TestWrapper>
          <UnifiedReferenceRenderer 
            content="不存在的 [[页面A]] 和 ((block-123))"
            checkLinkExists={mockCheckLinkExists}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      const pageLink = screen.getByText('页面A')
      const blockLink = screen.getByText(/块 block-12/)

      // 验证断开的链接和块引用都被正确渲染
      expect(pageLink).toBeInTheDocument()
      expect(blockLink).toBeInTheDocument()
    })
  })

  describe('别名和显示文本', () => {
    it('应该处理链接别名', () => {
      render(
        <TestWrapper>
          <UnifiedReferenceRenderer 
            content="查看 [[页面A|别名A]] 内容"
            checkLinkExists={mockCheckLinkExists}
          />
        </TestWrapper>
      )

      expect(screen.getByText('别名A')).toBeInTheDocument()
      expect(screen.queryByText('页面A')).not.toBeInTheDocument()
    })

    it('应该显示块内容', () => {
      mockGetBlockContent.mockReturnValue('自定义块内容')

      render(
        <TestWrapper>
          <UnifiedReferenceRenderer 
            content="查看 ((block-123)) 内容"
            getBlockContent={mockGetBlockContent}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      expect(screen.getByText('自定义块内容')).toBeInTheDocument()
      expect(mockGetBlockContent).toHaveBeenCalledWith('block-123')
    })
  })

  describe('复杂引用解析', () => {
    it('应该正确解析多个混合引用', () => {
      render(
        <TestWrapper>
          <UnifiedReferenceRenderer 
            content="开始 [[页面A]] 中间 ((block-1)) 然后 [[页面B|别名B]] 最后 ((block-2)) 结束"
            onLinkClick={mockOnLinkClick}
            onBlockClick={mockOnBlockClick}
            checkLinkExists={mockCheckLinkExists}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      expect(screen.getByText('开始', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('中间', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('然后', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('最后', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('结束', { exact: false })).toBeInTheDocument()
      
      expect(screen.getByText('页面A')).toBeInTheDocument()
      expect(screen.getByText('别名B')).toBeInTheDocument()
      expect(screen.getAllByText(/块 block-/)).toHaveLength(2)
    })

    it('应该处理相邻的引用', () => {
      render(
        <TestWrapper>
          <UnifiedReferenceRenderer 
            content="[[页面A]]((block-123))"
            checkLinkExists={mockCheckLinkExists}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      expect(screen.getByText('页面A')).toBeInTheDocument()
      expect(screen.getByText(/块 block-12/)).toBeInTheDocument()
    })
  })

  describe('自定义属性传递', () => {
    it('应该传递链接自定义属性', () => {
      render(
        <TestWrapper>
          <UnifiedReferenceRenderer 
            content="自定义 [[页面A]] 链接"
            linkProps={{
              size: 'lg',
              variant: 'alias',
              showIcon: false
            }}
            checkLinkExists={mockCheckLinkExists}
          />
        </TestWrapper>
      )

      const link = screen.getByText('页面A')
      // 验证链接被正确渲染
      expect(link).toBeInTheDocument()

      // 验证自定义属性被应用（通过检查容器元素）
      const linkContainer = link.closest('[role="link"]')
      expect(linkContainer).toBeInTheDocument()
    })

    it('应该传递块引用自定义属性', () => {
      render(
        <TestWrapper>
          <UnifiedReferenceRenderer 
            content="自定义 ((block-123)) 块"
            blockProps={{
              size: 'lg',
              variant: 'embed',
              showIcon: false
            }}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      const block = screen.getByText(/块 block-12/)
      // 验证块引用被正确渲染
      expect(block).toBeInTheDocument()

      // 验证自定义属性被应用（通过检查容器元素）
      const blockContainer = block.closest('[role="link"]')
      expect(blockContainer).toBeInTheDocument()
    })
  })
})

describe('工具函数', () => {
  describe('extractAllReferences', () => {
    it('应该提取所有类型的引用', () => {
      const content = '参考 [[页面A]] 和 ((block-1)) 以及 [[页面B|别名]] 和 ((block-2))'
      const result = extractAllReferences(content)

      expect(result).toEqual({
        links: ['页面A', '页面B'],
        blocks: ['block-1', 'block-2'],
        hasReferences: true
      })
    })

    it('应该处理只有链接的文本', () => {
      const content = '只有 [[页面A]] 链接'
      const result = extractAllReferences(content)

      expect(result).toEqual({
        links: ['页面A'],
        blocks: [],
        hasReferences: true
      })
    })

    it('应该处理只有块引用的文本', () => {
      const content = '只有 ((block-123)) 块'
      const result = extractAllReferences(content)

      expect(result).toEqual({
        links: [],
        blocks: ['block-123'],
        hasReferences: true
      })
    })

    it('应该处理无引用的文本', () => {
      const content = '普通文本'
      const result = extractAllReferences(content)

      expect(result).toEqual({
        links: [],
        blocks: [],
        hasReferences: false
      })
    })
  })

  describe('hasAnyReferences', () => {
    it('应该检测包含引用的文本', () => {
      expect(hasAnyReferences('包含 [[页面A]] 的文本')).toBe(true)
      expect(hasAnyReferences('包含 ((block-123)) 的文本')).toBe(true)
      expect(hasAnyReferences('包含 [[页面A]] 和 ((block-123)) 的文本')).toBe(true)
    })

    it('应该检测不包含引用的文本', () => {
      expect(hasAnyReferences('普通文本')).toBe(false)
      expect(hasAnyReferences('')).toBe(false)
    })
  })

  describe('getReferenceStats', () => {
    it('应该统计引用信息', () => {
      const content = '参考 [[页面A]] 和 ((block-1)) 以及 [[页面A]] 和 ((block-2))'
      const stats = getReferenceStats(content)

      expect(stats).toEqual({
        totalReferences: 4,
        linkCount: 2,
        blockCount: 2,
        uniqueLinks: 1, // 页面A重复了
        uniqueBlocks: 2
      })
    })

    it('应该处理空文本', () => {
      const stats = getReferenceStats('')

      expect(stats).toEqual({
        totalReferences: 0,
        linkCount: 0,
        blockCount: 0,
        uniqueLinks: 0,
        uniqueBlocks: 0
      })
    })
  })
})
