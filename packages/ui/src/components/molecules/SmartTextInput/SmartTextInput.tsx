/**
 * 智能文本输入框组件
 * 
 * 功能：
 * - 自动检测双向链接语法
 * - 触发自动补全
 * - 实时链接预览
 * - 智能插入链接
 * - 防抖优化
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Input, InputProps } from '../../atoms/Input/Input'
import { LinkAutoComplete, LinkSuggestion } from '../LinkAutoComplete'
import { cn } from '../../../utils/classNames'

// 临时的链接解析器接口，实际使用时应该从notes模块导入
interface LinkParseResult {
  isInLink: boolean
  linkStart?: number
  linkEnd?: number
  partialPageName?: string
}

// 临时的链接解析器实现
const findPotentialLink = (text: string, cursorPosition: number): LinkParseResult => {
  if (!text || cursorPosition < 0 || cursorPosition > text.length) {
    return { isInLink: false }
  }

  // 查找光标前的 [[
  let linkStart = -1
  for (let i = cursorPosition - 1; i >= 0; i--) {
    if (text.substring(i, i + 2) === '[[') {
      linkStart = i
      break
    }
    if (text[i] === ']' || text[i] === '\n') {
      break
    }
  }

  if (linkStart === -1) {
    return { isInLink: false }
  }

  // 查找光标后的 ]]
  let linkEnd = -1
  for (let i = cursorPosition; i < text.length - 1; i++) {
    if (text.substring(i, i + 2) === ']]') {
      linkEnd = i + 2
      break
    }
    if (text[i] === '[' || text[i] === '\n') {
      break
    }
  }

  // 提取部分页面名称
  const partialText = text.substring(linkStart + 2, cursorPosition)
  const pipeIndex = partialText.indexOf('|')
  const partialPageName = pipeIndex >= 0 ? partialText.substring(0, pipeIndex) : partialText

  return {
    isInLink: true,
    linkStart,
    linkEnd: linkEnd > 0 ? linkEnd : undefined,
    partialPageName: partialPageName.trim()
  }
}

export interface SmartTextInputProps extends Omit<InputProps, 'onChange'> {
  /** 输入值 */
  value: string
  /** 值变化回调 */
  onChange: (value: string) => void
  /** 获取链接建议 */
  onGetSuggestions?: (query: string) => Promise<LinkSuggestion[]>
  /** 检查链接是否存在 */
  onCheckLinkExists?: (pageName: string) => boolean
  /** 链接点击回调 */
  onLinkClick?: (pageName: string) => void
  /** 链接预览回调 */
  onLinkPreview?: (pageName: string) => Promise<string | null>
  /** 是否启用自动补全 */
  enableAutoComplete?: boolean
  /** 是否启用链接预览 */
  enableLinkPreview?: boolean
  /** 自动补全延迟（毫秒） */
  autoCompleteDelay?: number
  /** 最大建议数量 */
  maxSuggestions?: number
  /** 是否显示创建新页面选项 */
  showCreateOption?: boolean
  /** 自定义样式类名 */
  className?: string
}

export const SmartTextInput: React.FC<SmartTextInputProps> = ({
  value,
  onChange,
  onGetSuggestions,
  onCheckLinkExists,
  onLinkClick,
  onLinkPreview,
  enableAutoComplete = true,
  enableLinkPreview = true,
  autoCompleteDelay = 300,
  maxSuggestions = 10,
  showCreateOption = true,
  className,
  ...inputProps
}) => {
  const [showAutoComplete, setShowAutoComplete] = useState(false)
  const [autoCompleteQuery, setAutoCompleteQuery] = useState('')
  const [autoCompletePosition, setAutoCompletePosition] = useState({ x: 0, y: 0 })
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  // 检测光标位置的链接状态
  const linkContext = useMemo(() => {
    if (!enableAutoComplete || !inputRef.current) return null

    return findPotentialLink(value, cursorPosition)
  }, [value, cursorPosition, enableAutoComplete])

  // 防抖获取建议
  const debouncedGetSuggestions = useCallback(async (query: string) => {
    if (!onGetSuggestions || !query.trim()) {
      setSuggestions([])
      setIsLoadingSuggestions(false)
      return
    }

    setIsLoadingSuggestions(true)
    try {
      const results = await onGetSuggestions(query)
      setSuggestions(results.slice(0, maxSuggestions))
    } catch (error) {
      console.error('Failed to get suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [onGetSuggestions, maxSuggestions])

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const newCursorPosition = e.target.selectionStart || 0

    onChange(newValue)
    setCursorPosition(newCursorPosition)

    // 检查是否在链接中
    const linkInfo = findPotentialLink(newValue, newCursorPosition)
    
    if (linkInfo.isInLink && linkInfo.partialPageName !== undefined) {
      // 显示自动补全
      setAutoCompleteQuery(linkInfo.partialPageName)
      setShowAutoComplete(true)
      
      // 计算自动补全位置
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect()
        setAutoCompletePosition({
          x: rect.left,
          y: rect.bottom + 4
        })
      }

      // 防抖获取建议
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      debounceTimeoutRef.current = setTimeout(() => {
        debouncedGetSuggestions(linkInfo.partialPageName || '')
      }, autoCompleteDelay)
    } else {
      // 隐藏自动补全
      setShowAutoComplete(false)
      setAutoCompleteQuery('')
      setSuggestions([])
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [onChange, debouncedGetSuggestions, autoCompleteDelay])

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // 如果自动补全显示，让自动补全组件处理键盘事件
    if (showAutoComplete) {
      // 阻止某些键的默认行为，让自动补全组件处理
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab'].includes(e.key)) {
        // 这些键由自动补全组件处理
        return
      }
    }

    // 处理其他键盘事件
    if (inputProps.onKeyDown) {
      inputProps.onKeyDown(e)
    }
  }, [showAutoComplete, inputProps])

  // 处理光标位置变化
  const handleSelectionChange = useCallback(() => {
    if (inputRef.current) {
      const newCursorPosition = inputRef.current.selectionStart || 0
      setCursorPosition(newCursorPosition)
    }
  }, [])

  // 处理自动补全选择
  const handleAutoCompleteSelect = useCallback((suggestion: LinkSuggestion) => {
    if (!linkContext || !inputRef.current) return

    const { linkStart, partialPageName } = linkContext
    
    if (linkStart !== undefined && partialPageName !== undefined) {
      // 构建新的链接文本
      const linkText = suggestion.type === 'create' 
        ? `[[${suggestion.title}]]`
        : `[[${suggestion.title}]]`

      // 替换部分输入的链接
      const beforeLink = value.substring(0, linkStart)
      const afterCursor = value.substring(cursorPosition)
      const newValue = beforeLink + linkText + afterCursor

      // 更新值和光标位置
      onChange(newValue)
      
      // 设置新的光标位置
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPos = linkStart + linkText.length
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
          setCursorPosition(newCursorPos)
        }
      }, 0)
    }

    // 隐藏自动补全
    setShowAutoComplete(false)
    setAutoCompleteQuery('')
    setSuggestions([])
  }, [linkContext, value, cursorPosition, onChange])

  // 处理自动补全关闭
  const handleAutoCompleteClose = useCallback(() => {
    setShowAutoComplete(false)
    setAutoCompleteQuery('')
    setSuggestions([])
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={cn('relative', className)}>
      <Input
        {...inputProps}
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelectionChange}
        onBlur={(e) => {
          // 延迟隐藏自动补全，允许点击选择
          setTimeout(() => {
            setShowAutoComplete(false)
          }, 200)
          
          if (inputProps.onBlur) {
            inputProps.onBlur(e)
          }
        }}
        onFocus={(e) => {
          // 重新检查链接状态
          if (inputRef.current) {
            const cursorPos = inputRef.current.selectionStart || 0
            setCursorPosition(cursorPos)
          }
          
          if (inputProps.onFocus) {
            inputProps.onFocus(e)
          }
        }}
      />

      {/* 自动补全组件 */}
      {enableAutoComplete && (
        <LinkAutoComplete
          query={autoCompleteQuery}
          position={autoCompletePosition}
          visible={showAutoComplete}
          suggestions={suggestions}
          loading={isLoadingSuggestions}
          onSelect={handleAutoCompleteSelect}
          onClose={handleAutoCompleteClose}
          maxItems={maxSuggestions}
          showCreateOption={showCreateOption}
        />
      )}
    </div>
  )
}

export default SmartTextInput
