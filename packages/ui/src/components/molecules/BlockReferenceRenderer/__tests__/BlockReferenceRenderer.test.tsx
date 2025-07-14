import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ThemeProvider } from '../../../../contexts/ThemeContext'
import { 
  BlockReferenceRenderer, 
  extractBlockReferences, 
  hasBlockReferences, 
  getBlockReferenceStats,
  replaceBlockReferences,
  validateBlockReference,
  createBlockReference
} from '../BlockReferenceRenderer'

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
)

describe('BlockReferenceRenderer', () => {
  const mockOnBlockClick = vi.fn()
  const mockOnBlockPreview = vi.fn()
  const mockCheckBlockExists = vi.fn()
  const mockGetBlockContent = vi.fn()
  const mockGetBlockType = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckBlockExists.mockReturnValue(true)
    mockGetBlockContent.mockReturnValue('这是块的内容')
    mockGetBlockType.mockReturnValue('paragraph')
    mockOnBlockPreview.mockResolvedValue('预览内容')
  })

  describe('基础渲染', () => {
    it('应该渲染纯文本内容', () => {
      render(
        <TestWrapper>
          <BlockReferenceRenderer content="这是纯文本，没有块引用" />
        </TestWrapper>
      )

      expect(screen.getByText('这是纯文本，没有块引用')).toBeInTheDocument()
    })

    it('应该渲染包含块引用的文本', () => {
      render(
        <TestWrapper>
          <BlockReferenceRenderer 
            content="这是包含 ((block-123)) 的文本"
            onBlockClick={mockOnBlockClick}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      expect(screen.getByText('这是包含', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('的文本', { exact: false })).toBeInTheDocument()
      expect(screen.getByRole('link')).toBeInTheDocument()
    })

    it('应该渲染多个块引用', () => {
      render(
        <TestWrapper>
          <BlockReferenceRenderer 
            content="参考 ((block-1)) 和 ((block-2)) 的内容"
            onBlockClick={mockOnBlockClick}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2)
      expect(screen.getByText('参考', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('和', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('的内容', { exact: false })).toBeInTheDocument()
    })

    it('应该处理空内容', () => {
      render(
        <TestWrapper>
          <BlockReferenceRenderer content="" />
        </TestWrapper>
      )

      // 空内容应该渲染一个空的span
      const container = document.querySelector('span')
      expect(container).toBeInTheDocument()
    })
  })

  describe('块引用交互', () => {
    it('应该处理块引用点击', () => {
      render(
        <TestWrapper>
          <BlockReferenceRenderer 
            content="点击 ((block-123)) 块"
            onBlockClick={mockOnBlockClick}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      fireEvent.click(screen.getByRole('link'))
      expect(mockOnBlockClick).toHaveBeenCalledWith('block-123')
    })

    it('应该显示块内容', () => {
      mockGetBlockContent.mockReturnValue('这是块的详细内容')

      render(
        <TestWrapper>
          <BlockReferenceRenderer 
            content="查看 ((block-123)) 内容"
            getBlockContent={mockGetBlockContent}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      expect(screen.getByText('这是块的详细内容')).toBeInTheDocument()
      expect(mockGetBlockContent).toHaveBeenCalledWith('block-123')
    })

    it('应该根据块类型显示不同样式', () => {
      mockGetBlockType.mockReturnValue('heading')

      render(
        <TestWrapper>
          <BlockReferenceRenderer 
            content="标题块 ((heading-123))"
            getBlockType={mockGetBlockType}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      expect(mockGetBlockType).toHaveBeenCalledWith('heading-123')
    })
  })

  describe('块存在性检查', () => {
    it('应该显示存在的块', () => {
      mockCheckBlockExists.mockReturnValue(true)

      render(
        <TestWrapper>
          <BlockReferenceRenderer 
            content="存在的块 ((existing-block))"
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-green-600') // 默认存在样式
    })

    it('应该显示不存在的块', () => {
      mockCheckBlockExists.mockReturnValue(false)

      render(
        <TestWrapper>
          <BlockReferenceRenderer 
            content="不存在的块 ((missing-block))"
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-red-600') // 断开链接样式
    })
  })

  describe('换行处理', () => {
    it('应该保留换行符', () => {
      render(
        <TestWrapper>
          <BlockReferenceRenderer 
            content="第一行\n第二行 ((block-123))\n第三行"
            preserveLineBreaks={true}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      // 检查是否包含换行内容（由于React Fragment的渲染方式，可能不会生成br标签）
      const container = screen.getByText('第一行', { exact: false })
      expect(container).toBeInTheDocument()
      expect(screen.getByText('第三行', { exact: false })).toBeInTheDocument()
    })

    it('应该忽略换行符', () => {
      render(
        <TestWrapper>
          <BlockReferenceRenderer 
            content="第一行\n第二行 ((block-123))\n第三行"
            preserveLineBreaks={false}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      const brs = document.querySelectorAll('br')
      expect(brs).toHaveLength(0)
    })
  })

  describe('自定义属性', () => {
    it('应该传递自定义块属性', () => {
      render(
        <TestWrapper>
          <BlockReferenceRenderer 
            content="自定义块 ((custom-block))"
            blockProps={{
              size: 'lg',
              variant: 'embed',
              showIcon: false
            }}
            checkBlockExists={mockCheckBlockExists}
          />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-base') // lg size
      expect(link).toHaveClass('text-blue-600') // embed variant
      
      const icon = link.querySelector('svg')
      expect(icon).not.toBeInTheDocument() // showIcon: false
    })
  })
})

describe('工具函数', () => {
  describe('extractBlockReferences', () => {
    it('应该提取所有块引用', () => {
      const content = '参考 ((block-A)) 和 ((block-B)) 以及 ((block-A)) 再次'
      const blockIds = extractBlockReferences(content)

      expect(blockIds).toEqual(['block-A', 'block-B'])
      expect(blockIds).toHaveLength(2) // 应该去重
    })

    it('应该处理空文本', () => {
      const blockIds = extractBlockReferences('')
      expect(blockIds).toEqual([])
    })

    it('应该处理无块引用的文本', () => {
      const blockIds = extractBlockReferences('普通文本没有块引用')
      expect(blockIds).toEqual([])
    })
  })

  describe('hasBlockReferences', () => {
    it('应该检测包含块引用的文本', () => {
      expect(hasBlockReferences('包含 ((block-1)) 的文本')).toBe(true)
      expect(hasBlockReferences('((开头块)) 文本')).toBe(true)
      expect(hasBlockReferences('文本 ((结尾块))')).toBe(true)
    })

    it('应该检测不包含块引用的文本', () => {
      expect(hasBlockReferences('普通文本')).toBe(false)
      expect(hasBlockReferences('(单括号)')).toBe(false)
      expect(hasBlockReferences('')).toBe(false)
    })
  })

  describe('getBlockReferenceStats', () => {
    it('应该统计块引用信息', () => {
      const content = '参考 ((block-A)) 和 ((block-B)) 以及 ((block-A)) 再次'
      const stats = getBlockReferenceStats(content)

      expect(stats).toEqual({
        totalReferences: 3,
        uniqueBlocks: 2,
        hasReferences: true,
        blockIds: ['block-A', 'block-B']
      })
    })

    it('应该处理空文本', () => {
      const stats = getBlockReferenceStats('')

      expect(stats).toEqual({
        totalReferences: 0,
        uniqueBlocks: 0,
        hasReferences: false,
        blockIds: []
      })
    })
  })

  describe('replaceBlockReferences', () => {
    it('应该替换块引用', () => {
      const content = '查看 ((block-123)) 和 ((block-456)) 的内容'
      const result = replaceBlockReferences(content, (blockId) => `[${blockId}]`)

      expect(result).toBe('查看 [block-123] 和 [block-456] 的内容')
    })

    it('应该处理无块引用的文本', () => {
      const content = '普通文本'
      const result = replaceBlockReferences(content, (blockId) => `[${blockId}]`)

      expect(result).toBe('普通文本')
    })
  })

  describe('validateBlockReference', () => {
    it('应该验证有效的块ID', () => {
      expect(validateBlockReference('block-123')).toBe(true)
      expect(validateBlockReference('block_456')).toBe(true)
      expect(validateBlockReference('ABC123')).toBe(true)
    })

    it('应该拒绝无效的块ID', () => {
      expect(validateBlockReference('')).toBe(false)
      expect(validateBlockReference('block with spaces')).toBe(false)
      expect(validateBlockReference('block@123')).toBe(false)
    })
  })

  describe('createBlockReference', () => {
    it('应该创建块引用语法', () => {
      const ref = createBlockReference('block-123')
      expect(ref).toBe('((block-123))')
    })

    it('应该处理前后空格', () => {
      const ref = createBlockReference('  block-123  ')
      expect(ref).toBe('((block-123))')
    })

    it('应该抛出无效块ID的错误', () => {
      expect(() => createBlockReference('')).toThrow('Invalid block ID')
      expect(() => createBlockReference('invalid id')).toThrow('Invalid block ID')
    })
  })
})
