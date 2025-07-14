import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ThemeProvider } from '../../../../contexts/ThemeContext'
import { SmartTextInput } from '../SmartTextInput'
import { LinkSuggestion } from '../../LinkAutoComplete'

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
)

describe('SmartTextInput', () => {
  const mockOnChange = vi.fn()
  const mockOnGetSuggestions = vi.fn()
  const mockOnCheckLinkExists = vi.fn()
  const mockOnLinkClick = vi.fn()
  const mockOnLinkPreview = vi.fn()

  const mockSuggestions: LinkSuggestion[] = [
    {
      id: '1',
      title: '技术文档',
      type: 'page',
      preview: '这是技术文档的预览',
      score: 100,
      matchType: 'exact'
    },
    {
      id: '2',
      title: '技术规范',
      type: 'page',
      preview: '这是技术规范的预览',
      score: 80,
      matchType: 'prefix'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnGetSuggestions.mockResolvedValue(mockSuggestions)
    mockOnCheckLinkExists.mockReturnValue(true)
    mockOnLinkPreview.mockResolvedValue('预览内容')
  })

  describe('基础渲染', () => {
    it('应该渲染输入框', () => {
      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            placeholder="输入文本..."
          />
        </TestWrapper>
      )

      expect(screen.getByPlaceholderText('输入文本...')).toBeInTheDocument()
    })

    it('应该显示初始值', () => {
      render(
        <TestWrapper>
          <SmartTextInput
            value="初始文本"
            onChange={mockOnChange}
          />
        </TestWrapper>
      )

      expect(screen.getByDisplayValue('初始文本')).toBeInTheDocument()
    })
  })

  describe('链接检测', () => {
    it('应该检测双向链接语法', async () => {
      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            onGetSuggestions={mockOnGetSuggestions}
            enableAutoComplete={true}
          />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      
      // 输入链接开始语法
      fireEvent.change(input, { target: { value: '这是一个 [[技' } })
      
      // 模拟光标位置
      Object.defineProperty(input, 'selectionStart', { value: 8 })
      fireEvent.change(input, { target: { value: '这是一个 [[技' } })

      expect(mockOnChange).toHaveBeenCalledWith('这是一个 [[技')

      // 等待防抖延迟
      await waitFor(() => {
        expect(mockOnGetSuggestions).toHaveBeenCalledWith('技')
      }, { timeout: 500 })
    })

    it('应该在非链接文本中不触发自动补全', async () => {
      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            onGetSuggestions={mockOnGetSuggestions}
            enableAutoComplete={true}
          />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      
      // 输入普通文本
      fireEvent.change(input, { target: { value: '普通文本' } })

      expect(mockOnChange).toHaveBeenCalledWith('普通文本')

      // 等待一段时间，确保没有调用建议获取
      await new Promise(resolve => setTimeout(resolve, 400))
      expect(mockOnGetSuggestions).not.toHaveBeenCalled()
    })
  })

  describe('自动补全功能', () => {
    it('应该显示自动补全建议', async () => {
      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            onGetSuggestions={mockOnGetSuggestions}
            enableAutoComplete={true}
            autoCompleteDelay={100}
          />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      
      // 输入链接语法
      fireEvent.change(input, { target: { value: '[[技术' } })
      Object.defineProperty(input, 'selectionStart', { value: 4 })
      fireEvent.change(input, { target: { value: '[[技术' } })

      // 等待自动补全显示
      await waitFor(() => {
        expect(screen.getByText('技术文档')).toBeInTheDocument()
      }, { timeout: 200 })

      expect(screen.getByText('技术规范')).toBeInTheDocument()
    })

    it('应该处理自动补全选择', async () => {
      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            onGetSuggestions={mockOnGetSuggestions}
            enableAutoComplete={true}
            autoCompleteDelay={100}
          />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')

      // 输入链接语法
      fireEvent.change(input, { target: { value: '[[技术' } })
      Object.defineProperty(input, 'selectionStart', { value: 4 })
      fireEvent.change(input, { target: { value: '[[技术' } })

      // 等待自动补全显示
      await waitFor(() => {
        expect(screen.getByText('技术文档')).toBeInTheDocument()
      }, { timeout: 200 })

      // 点击选择建议
      fireEvent.click(screen.getByText('技术文档'))

      // 验证onChange被调用
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('应该禁用自动补全', () => {
      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            onGetSuggestions={mockOnGetSuggestions}
            enableAutoComplete={false}
          />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      
      // 输入链接语法
      fireEvent.change(input, { target: { value: '[[技术' } })

      // 自动补全不应该显示
      expect(screen.queryByText('技术文档')).not.toBeInTheDocument()
    })
  })

  describe('创建新页面选项', () => {
    it('应该显示创建新页面选项', async () => {
      mockOnGetSuggestions.mockResolvedValue([]) // 没有匹配的建议

      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            onGetSuggestions={mockOnGetSuggestions}
            enableAutoComplete={true}
            showCreateOption={true}
            autoCompleteDelay={100}
          />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      
      // 输入新页面名称
      fireEvent.change(input, { target: { value: '[[新页面' } })
      Object.defineProperty(input, 'selectionStart', { value: 5 })
      fireEvent.change(input, { target: { value: '[[新页面' } })

      // 等待自动补全显示
      await waitFor(() => {
        expect(screen.getByText('创建新页面 "新页面"')).toBeInTheDocument()
      }, { timeout: 200 })
    })

    it('应该隐藏创建新页面选项', async () => {
      mockOnGetSuggestions.mockResolvedValue([])

      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            onGetSuggestions={mockOnGetSuggestions}
            enableAutoComplete={true}
            showCreateOption={false}
            autoCompleteDelay={100}
          />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      
      // 输入新页面名称
      fireEvent.change(input, { target: { value: '[[新页面' } })
      Object.defineProperty(input, 'selectionStart', { value: 5 })
      fireEvent.change(input, { target: { value: '[[新页面' } })

      // 等待一段时间
      await new Promise(resolve => setTimeout(resolve, 200))

      // 创建选项不应该显示
      expect(screen.queryByText('创建新页面')).not.toBeInTheDocument()
    })
  })

  describe('键盘事件', () => {
    it('应该处理普通键盘事件', () => {
      const mockOnKeyDown = vi.fn()

      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            onKeyDown={mockOnKeyDown}
          />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      
      // 按下普通键
      fireEvent.keyDown(input, { key: 'a' })

      expect(mockOnKeyDown).toHaveBeenCalled()
    })
  })

  describe('焦点事件', () => {
    it('应该处理焦点事件', () => {
      const mockOnFocus = vi.fn()
      const mockOnBlur = vi.fn()

      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            onFocus={mockOnFocus}
            onBlur={mockOnBlur}
          />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      
      // 获得焦点
      fireEvent.focus(input)
      expect(mockOnFocus).toHaveBeenCalled()

      // 失去焦点
      fireEvent.blur(input)
      expect(mockOnBlur).toHaveBeenCalled()
    })
  })

  describe('错误处理', () => {
    it('应该处理建议获取错误', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockOnGetSuggestions.mockRejectedValue(new Error('网络错误'))

      render(
        <TestWrapper>
          <SmartTextInput
            value=""
            onChange={mockOnChange}
            onGetSuggestions={mockOnGetSuggestions}
            enableAutoComplete={true}
            autoCompleteDelay={100}
          />
        </TestWrapper>
      )

      const input = screen.getByRole('textbox')
      
      // 输入链接语法
      fireEvent.change(input, { target: { value: '[[技术' } })
      Object.defineProperty(input, 'selectionStart', { value: 4 })
      fireEvent.change(input, { target: { value: '[[技术' } })

      // 等待错误处理
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to get suggestions:', expect.any(Error))
      }, { timeout: 200 })

      consoleError.mockRestore()
    })
  })
})
