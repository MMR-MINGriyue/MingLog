/**
 * 智能块引用输入框组件
 * 
 * 功能：
 * - 实时检测块引用语法输入
 * - 自动显示块引用建议
 * - 支持键盘导航和选择
 * - 防抖优化性能
 * - 与统一引用渲染器集成
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '../../../utils/classNames'
import { useTheme } from '../../../contexts/ThemeContext'
import { BlockReferenceAutoComplete, BlockSuggestion } from '../BlockReferenceAutoComplete'

// 临时使用本地解析器实现
const BlockReferenceParser = {
  findPotentialBlockReference: (text: string, cursorPosition: number) => {
    if (!text || cursorPosition < 0 || cursorPosition > text.length) {
      return { isInBlockReference: false }
    }

    // 查找光标前的 ((
    let blockStart = -1
    for (let i = cursorPosition - 1; i >= 0; i--) {
      if (text.substring(i, i + 2) === '((') {
        blockStart = i
        break
      }
      if (text[i] === ')' || text[i] === '\n') {
        break
      }
    }

    if (blockStart === -1) {
      return { isInBlockReference: false }
    }

    // 查找光标后的 ))
    let blockEnd = -1
    for (let i = cursorPosition; i < text.length - 1; i++) {
      if (text.substring(i, i + 2) === '))') {
        blockEnd = i + 2
        break
      }
      if (text[i] === '(' || text[i] === '\n') {
        break
      }
    }

    // 提取部分块ID
    const partialBlockId = text.substring(blockStart + 2, cursorPosition).trim()

    return {
      isInBlockReference: true,
      blockStart,
      blockEnd: blockEnd > 0 ? blockEnd : undefined,
      partialBlockId
    }
  },

  createBlockReference: (blockId: string): string => {
    return `((${blockId.trim()}))`
  }
}

export interface SmartBlockInputProps {
  /** 输入值 */
  value: string
  /** 值变化回调 */
  onChange: (value: string) => void
  /** 获取块建议的函数 */
  onGetSuggestions?: (query: string) => Promise<BlockSuggestion[]>
  /** 检查块是否存在 */
  onCheckBlockExists?: (blockId: string) => boolean
  /** 块点击回调 */
  onBlockClick?: (blockId: string) => void
  /** 块预览回调 */
  onBlockPreview?: (blockId: string) => Promise<string | null>
  /** 是否启用自动补全 */
  enableAutoComplete?: boolean
  /** 自动补全延迟（毫秒） */
  autoCompleteDelay?: number
  /** 是否显示创建选项 */
  showCreateOption?: boolean
  /** 占位符文本 */
  placeholder?: string
  /** 自定义样式类名 */
  className?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readOnly?: boolean
  /** 输入框类型 */
  inputType?: 'input' | 'textarea'
  /** 文本域行数 */
  rows?: number
}

export const SmartBlockInput: React.FC<SmartBlockInputProps> = ({
  value,
  onChange,
  onGetSuggestions,
  onCheckBlockExists,
  onBlockClick,
  onBlockPreview,
  enableAutoComplete = true,
  autoCompleteDelay = 300,
  showCreateOption = true,
  placeholder,
  className,
  disabled = false,
  readOnly = false,
  inputType = 'input',
  rows = 3
}) => {
  const { theme } = useTheme()
  const [suggestions, setSuggestions] = useState<BlockSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 })
  const [currentQuery, setCurrentQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  // 防抖获取建议
  const debouncedGetSuggestions = useCallback(async (query: string) => {
    if (!onGetSuggestions || !query.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    try {
      const results = await onGetSuggestions(query)
      setSuggestions(results)
      setShowSuggestions(results.length > 0 || showCreateOption)
    } catch (error) {
      console.error('Failed to get block suggestions:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsLoading(false)
    }
  }, [onGetSuggestions, showCreateOption])

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart || 0

    onChange(newValue)

    if (!enableAutoComplete) return

    // 检查是否在块引用中
    const potentialRef = BlockReferenceParser.findPotentialBlockReference(newValue, cursorPosition)
    
    if (potentialRef.isInBlockReference && potentialRef.partialBlockId !== undefined) {
      setCurrentQuery(potentialRef.partialBlockId)
      
      // 计算建议框位置
      const rect = e.target.getBoundingClientRect()
      setSuggestionPosition({
        x: rect.left,
        y: rect.bottom
      })

      // 清除之前的防抖定时器
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      // 设置新的防抖定时器
      debounceTimeoutRef.current = setTimeout(() => {
        debouncedGetSuggestions(potentialRef.partialBlockId!)
      }, autoCompleteDelay)
    } else {
      // 不在块引用中，隐藏建议
      setShowSuggestions(false)
      setCurrentQuery('')
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [onChange, enableAutoComplete, debouncedGetSuggestions, autoCompleteDelay])

  // 处理建议选择
  const handleSuggestionSelect = useCallback((suggestion: BlockSuggestion) => {
    if (!inputRef.current) return

    const cursorPosition = inputRef.current.selectionStart || 0
    const potentialRef = BlockReferenceParser.findPotentialBlockReference(value, cursorPosition)

    if (potentialRef.isInBlockReference && potentialRef.blockStart !== undefined) {
      let newBlockId: string
      
      if (suggestion.matchType === 'create') {
        // 创建新块的逻辑
        newBlockId = currentQuery
      } else {
        newBlockId = suggestion.blockId
      }

      const blockReference = BlockReferenceParser.createBlockReference(newBlockId)
      
      // 替换当前的部分块引用
      const beforeBlock = value.substring(0, potentialRef.blockStart)
      const afterBlock = potentialRef.blockEnd 
        ? value.substring(potentialRef.blockEnd)
        : value.substring(cursorPosition) + '))'
      
      const newValue = beforeBlock + blockReference + afterBlock
      onChange(newValue)

      // 设置光标位置到块引用后面
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPosition = beforeBlock.length + blockReference.length
          inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
          inputRef.current.focus()
        }
      }, 0)
    }

    setShowSuggestions(false)
    setCurrentQuery('')
  }, [value, onChange, currentQuery])

  // 处理建议关闭
  const handleSuggestionClose = useCallback(() => {
    setShowSuggestions(false)
    setCurrentQuery('')
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // 基础样式类
  const inputClasses = cn(
    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    'placeholder-gray-400 transition-colors duration-200',
    {
      'bg-gray-50 cursor-not-allowed': disabled,
      'bg-white': !disabled && !readOnly,
      'bg-gray-50': readOnly && !disabled
    },
    theme === 'dark' && {
      'bg-gray-800 border-gray-600 text-white placeholder-gray-500': !disabled,
      'focus:ring-blue-400 focus:border-blue-400': !disabled,
      'bg-gray-900 border-gray-700': disabled
    },
    className
  )

  // 渲染输入框
  const renderInput = () => {
    const commonProps = {
      ref: inputRef as any,
      value,
      onChange: handleInputChange,
      placeholder,
      disabled,
      readOnly,
      className: inputClasses
    }

    if (inputType === 'textarea') {
      return (
        <textarea
          {...commonProps}
          rows={rows}
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        />
      )
    }

    return (
      <input
        {...commonProps}
        type="text"
        ref={inputRef as React.RefObject<HTMLInputElement>}
      />
    )
  }

  return (
    <div className="relative">
      {renderInput()}
      
      {/* 块引用自动补全 */}
      <BlockReferenceAutoComplete
        query={currentQuery}
        suggestions={suggestions}
        visible={showSuggestions}
        position={suggestionPosition}
        onSelect={handleSuggestionSelect}
        onClose={handleSuggestionClose}
        showCreateOption={showCreateOption}
        loading={isLoading}
      />
    </div>
  )
}

export default SmartBlockInput
