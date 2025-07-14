/**
 * 双向链接系统集成测试
 * 
 * 测试整个双向链接系统的端到端功能：
 * - 链接解析和渲染
 * - 自动补全功能
 * - 智能输入框
 * - 组件间交互
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { SmartTextInput } from '../../components/molecules/SmartTextInput'
import { LinkRenderer } from '../../components/molecules/LinkRenderer'
import { BiDirectionalLink } from '../../components/molecules/BiDirectionalLink'
import { LinkAutoComplete, LinkSuggestion } from '../../components/molecules/LinkAutoComplete'

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
)

// 模拟页面数据
const mockPages = [
  { id: '1', title: '技术文档', preview: '包含项目的技术规范和API文档', referenceCount: 15 },
  { id: '2', title: '技术规范', preview: '详细的技术实现规范', referenceCount: 8 },
  { id: '3', title: '项目文档', preview: '项目概述和开发指南', referenceCount: 12 },
  { id: '4', title: '用户手册', preview: '面向最终用户的使用指南', referenceCount: 5 }
]

describe('双向链接系统集成测试', () => {
  const mockOnGetSuggestions = vi.fn()
  const mockOnCheckLinkExists = vi.fn()
  const mockOnLinkClick = vi.fn()
  const mockOnLinkPreview = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // 设置默认的mock行为
    mockOnGetSuggestions.mockImplementation(async (query: string): Promise<LinkSuggestion[]> => {
      if (!query.trim()) return []
      
      return mockPages
        .filter(page => page.title.toLowerCase().includes(query.toLowerCase()))
        .map(page => ({
          id: page.id,
          title: page.title,
          type: 'page' as const,
          preview: page.preview,
          score: page.title.toLowerCase().startsWith(query.toLowerCase()) ? 100 : 50,
          matchType: page.title.toLowerCase().startsWith(query.toLowerCase()) 
            ? 'prefix' as const 
            : 'contains' as const,
          referenceCount: page.referenceCount
        }))
    })
    
    mockOnCheckLinkExists.mockImplementation((pageName: string) => {
      return mockPages.some(page => page.title === pageName)
    })
    
    mockOnLinkPreview.mockImplementation(async (pageName: string) => {
      const page = mockPages.find(p => p.title === pageName)
      return page ? page.preview : null
    })
  })

  describe('端到端链接创建流程', () => {
    it('应该完成完整的链接创建流程', async () => {
      const mockOnChange = vi.fn()
      
      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            onGetSuggestions={mockOnGetSuggestions}
            onCheckLinkExists={mockOnCheckLinkExists}
            onLinkClick={mockOnLinkClick}
            onLinkPreview={mockOnLinkPreview}
            enableAutoComplete={true}
            autoCompleteDelay={100}
            placeholder="输入文本..."
          />
        </TestWrapper>
      )

      const input = screen.getByPlaceholderText('输入文本...')

      // 1. 用户开始输入链接
      fireEvent.change(input, { target: { value: '查看 [[技' } })
      Object.defineProperty(input, 'selectionStart', { value: 6 })
      fireEvent.change(input, { target: { value: '查看 [[技' } })

      // 2. 等待自动补全显示
      await waitFor(() => {
        expect(screen.getByText('技术文档')).toBeInTheDocument()
      }, { timeout: 200 })

      // 3. 验证建议列表
      expect(screen.getByText('技术规范')).toBeInTheDocument()
      expect(mockOnGetSuggestions).toHaveBeenCalledWith('技')

      // 4. 用户选择建议
      fireEvent.click(screen.getByText('技术文档'))

      // 5. 验证输入值更新
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('应该支持创建新页面', async () => {
      const mockOnChange = vi.fn()
      
      // 设置空的建议列表
      mockOnGetSuggestions.mockResolvedValue([])
      
      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            onGetSuggestions={mockOnGetSuggestions}
            enableAutoComplete={true}
            showCreateOption={true}
            autoCompleteDelay={100}
            placeholder="输入文本..."
          />
        </TestWrapper>
      )

      const input = screen.getByPlaceholderText('输入文本...')

      // 1. 输入新页面名称
      fireEvent.change(input, { target: { value: '[[新页面' } })
      Object.defineProperty(input, 'selectionStart', { value: 5 })
      fireEvent.change(input, { target: { value: '[[新页面' } })

      // 2. 等待创建选项显示
      await waitFor(() => {
        expect(screen.getByText('创建新页面 "新页面"')).toBeInTheDocument()
      }, { timeout: 200 })

      // 3. 选择创建选项
      fireEvent.click(screen.getByText('新页面'))

      // 4. 验证创建功能被调用
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('链接渲染和交互', () => {
    it('应该正确渲染和处理链接交互', async () => {
      const testContent = '请参考 [[技术文档]] 和 [[用户手册|手册]] 了解详情。'
      
      render(
        <TestWrapper>
          <LinkRenderer
            content={testContent}
            onLinkClick={mockOnLinkClick}
            onLinkPreview={mockOnLinkPreview}
            checkLinkExists={mockOnCheckLinkExists}
          />
        </TestWrapper>
      )

      // 1. 验证链接渲染
      const techDocLink = screen.getByText('技术文档')
      const manualLink = screen.getByText('手册')
      
      expect(techDocLink).toBeInTheDocument()
      expect(manualLink).toBeInTheDocument()

      // 2. 测试链接点击
      fireEvent.click(techDocLink)
      expect(mockOnLinkClick).toHaveBeenCalledWith('技术文档')

      fireEvent.click(manualLink)
      expect(mockOnLinkClick).toHaveBeenCalledWith('用户手册')

      // 3. 测试链接预览
      fireEvent.mouseEnter(techDocLink)
      
      await waitFor(() => {
        expect(mockOnLinkPreview).toHaveBeenCalledWith('技术文档')
      }, { timeout: 600 })
    })

    it('应该正确显示链接状态', () => {
      // 设置部分页面不存在
      mockOnCheckLinkExists.mockImplementation((pageName: string) => {
        return pageName === '技术文档'
      })

      const testContent = '查看 [[技术文档]] 和 [[不存在页面]]'
      
      render(
        <TestWrapper>
          <LinkRenderer
            content={testContent}
            checkLinkExists={mockOnCheckLinkExists}
          />
        </TestWrapper>
      )

      const existingLink = screen.getByText('技术文档')
      const brokenLink = screen.getByText('不存在页面')

      // 验证链接存在
      expect(existingLink).toBeInTheDocument()
      expect(brokenLink).toBeInTheDocument()

      // 验证链接状态检查被调用
      expect(mockOnCheckLinkExists).toHaveBeenCalledWith('技术文档')
      expect(mockOnCheckLinkExists).toHaveBeenCalledWith('不存在页面')
    })
  })

  describe('组件间协作', () => {
    it('应该在SmartTextInput和LinkRenderer间正确协作', async () => {
      const TestApp: React.FC = () => {
        const [content, setContent] = React.useState('')

        return (
          <div>
            <SmartTextInput
              value={content}
              onChange={setContent}
              onGetSuggestions={mockOnGetSuggestions}
              onCheckLinkExists={mockOnCheckLinkExists}
              enableAutoComplete={true}
              autoCompleteDelay={100}
              placeholder="输入内容..."
            />
            <div data-testid="preview">
              <LinkRenderer
                content={content}
                onLinkClick={mockOnLinkClick}
                onLinkPreview={mockOnLinkPreview}
                checkLinkExists={mockOnCheckLinkExists}
              />
            </div>
          </div>
        )
      }

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      )

      const input = screen.getByPlaceholderText('输入内容...')

      // 1. 输入包含链接的文本
      fireEvent.change(input, { target: { value: '参考 [[技术文档]] 了解详情' } })

      // 2. 验证预览区域显示链接
      const preview = screen.getByTestId('preview')
      expect(preview).toHaveTextContent('参考')
      expect(preview).toHaveTextContent('了解详情')
      
      const link = screen.getByText('技术文档')
      expect(link).toBeInTheDocument()

      // 3. 测试链接交互
      fireEvent.click(link)
      expect(mockOnLinkClick).toHaveBeenCalledWith('技术文档')
    })
  })

  describe('性能和用户体验', () => {
    it('应该正确处理防抖和延迟', async () => {
      const mockOnChange = vi.fn()
      
      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            onGetSuggestions={mockOnGetSuggestions}
            enableAutoComplete={true}
            autoCompleteDelay={300}
            placeholder="输入文本..."
          />
        </TestWrapper>
      )

      const input = screen.getByPlaceholderText('输入文本...')

      // 1. 快速连续输入
      fireEvent.change(input, { target: { value: '[[技' } })
      fireEvent.change(input, { target: { value: '[[技术' } })
      fireEvent.change(input, { target: { value: '[[技术文' } })

      // 2. 在延迟时间内，建议获取不应该被调用
      expect(mockOnGetSuggestions).not.toHaveBeenCalled()

      // 3. 等待防抖延迟后，应该只调用一次
      await waitFor(() => {
        expect(mockOnGetSuggestions).toHaveBeenCalledTimes(1)
        expect(mockOnGetSuggestions).toHaveBeenCalledWith('技术文')
      }, { timeout: 400 })
    })

    it('应该正确处理键盘导航', async () => {
      const mockOnChange = vi.fn()
      
      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            onGetSuggestions={mockOnGetSuggestions}
            enableAutoComplete={true}
            autoCompleteDelay={100}
            placeholder="输入文本..."
          />
        </TestWrapper>
      )

      const input = screen.getByPlaceholderText('输入文本...')

      // 1. 触发自动补全
      fireEvent.change(input, { target: { value: '[[技术' } })
      Object.defineProperty(input, 'selectionStart', { value: 4 })
      fireEvent.change(input, { target: { value: '[[技术' } })

      // 2. 等待建议显示
      await waitFor(() => {
        expect(screen.getByText('技术文档')).toBeInTheDocument()
      }, { timeout: 200 })

      // 3. 测试键盘导航
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: 'Enter' })

      // 4. 验证选择功能
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('错误处理和边界情况', () => {
    it('应该正确处理网络错误', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockOnGetSuggestions.mockRejectedValue(new Error('网络错误'))

      const mockOnChange = vi.fn()
      
      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            onGetSuggestions={mockOnGetSuggestions}
            enableAutoComplete={true}
            autoCompleteDelay={100}
            placeholder="输入文本..."
          />
        </TestWrapper>
      )

      const input = screen.getByPlaceholderText('输入文本...')

      // 触发网络请求
      fireEvent.change(input, { target: { value: '[[技术' } })
      Object.defineProperty(input, 'selectionStart', { value: 4 })
      fireEvent.change(input, { target: { value: '[[技术' } })

      // 等待错误处理
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled()
      }, { timeout: 200 })

      consoleError.mockRestore()
    })

    it('应该处理空数据和无效输入', () => {
      render(
        <TestWrapper>
          <LinkRenderer
            content=""
            onLinkClick={mockOnLinkClick}
            checkLinkExists={mockOnCheckLinkExists}
          />
        </TestWrapper>
      )

      // 空内容不应该导致错误
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })
})
