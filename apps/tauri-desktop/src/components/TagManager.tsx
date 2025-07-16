/**
 * 标签管理组件
 * 支持标签的创建、编辑、删除和颜色管理
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Tag,
  Plus,
  X,
  Edit3,
  Trash2,
  Hash,
  Palette,
  Check,
  Search
} from 'lucide-react'

interface TagData {
  id: string
  name: string
  color: string
  count: number
}

interface TagManagerProps {
  tags: string[]
  allTags: string[]
  onChange: (tags: string[]) => void
  onCreateTag?: (tagName: string) => void
  onDeleteTag?: (tagName: string) => void
  className?: string
  placeholder?: string
  maxTags?: number
}

// 预定义的标签颜色
const TAG_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#EC4899', // pink
  '#6B7280'  // gray
]

const TagManager: React.FC<TagManagerProps> = ({
  tags,
  allTags,
  onChange,
  onCreateTag,
  onDeleteTag,
  className = '',
  placeholder = '添加标签...',
  maxTags = 10
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 过滤可用标签
  const availableTags = allTags.filter(tag => 
    !tags.includes(tag) && 
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 处理点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 添加标签
  const addTag = useCallback((tagName: string) => {
    const trimmedTag = tagName.trim()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onChange([...tags, trimmedTag])
      if (!allTags.includes(trimmedTag)) {
        onCreateTag?.(trimmedTag)
      }
      setInputValue('')
      setSearchQuery('')
    }
  }, [tags, allTags, maxTags, onChange, onCreateTag])

  // 移除标签
  const removeTag = useCallback((tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove))
  }, [tags, onChange])

  // 处理输入框键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (inputValue.trim()) {
          addTag(inputValue)
        } else if (availableTags.length > 0) {
          addTag(availableTags[0])
        }
        break
      case 'Backspace':
        if (!inputValue && tags.length > 0) {
          removeTag(tags[tags.length - 1])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSearchQuery('')
        inputRef.current?.blur()
        break
      case 'ArrowDown':
        e.preventDefault()
        setIsOpen(true)
        break
    }
  }, [inputValue, availableTags, tags, addTag, removeTag])

  // 获取标签颜色
  const getTagColor = useCallback((tagName: string) => {
    const index = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return TAG_COLORS[index % TAG_COLORS.length]
  }, [])

  // 开始编辑标签
  const startEditTag = useCallback((tag: string) => {
    setEditingTag(tag)
    setEditValue(tag)
  }, [])

  // 完成编辑标签
  const finishEditTag = useCallback(() => {
    if (editingTag && editValue.trim() && editValue !== editingTag) {
      const newTags = tags.map(tag => tag === editingTag ? editValue.trim() : tag)
      onChange(newTags)
    }
    setEditingTag(null)
    setEditValue('')
  }, [editingTag, editValue, tags, onChange])

  // 取消编辑
  const cancelEditTag = useCallback(() => {
    setEditingTag(null)
    setEditValue('')
  }, [])

  return (
    <div className={`tag-manager relative ${className}`} ref={dropdownRef}>
      {/* 标签显示区域 */}
      <div className="flex flex-wrap items-center gap-2 p-3 border border-gray-300 rounded-lg bg-white min-h-[44px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        {/* 已选标签 */}
        {tags.map((tag) => (
          <div
            key={tag}
            className="flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: `${getTagColor(tag)}20`,
              color: getTagColor(tag),
              border: `1px solid ${getTagColor(tag)}40`
            }}
          >
            {editingTag === tag ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    finishEditTag()
                  } else if (e.key === 'Escape') {
                    cancelEditTag()
                  }
                }}
                onBlur={finishEditTag}
                className="bg-transparent border-none outline-none text-sm w-16"
                autoFocus
              />
            ) : (
              <>
                <Hash className="w-3 h-3" />
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => startEditTag(tag)}
                  className="p-0.5 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
                  title="编辑标签"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="p-0.5 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
                  title="删除标签"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        ))}

        {/* 输入框 */}
        {tags.length < maxTags && (
          <div className="flex items-center space-x-1 flex-1 min-w-[120px]">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setSearchQuery(e.target.value)
                setIsOpen(true)
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              placeholder={tags.length === 0 ? placeholder : ''}
              className="flex-1 border-none outline-none text-sm bg-transparent placeholder-gray-400"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => addTag(inputValue)}
                className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                title="添加标签"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 下拉建议列表 */}
      {isOpen && (inputValue || availableTags.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {/* 搜索框 */}
          {availableTags.length > 5 && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索标签..."
                  className="w-full pl-8 pr-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* 创建新标签选项 */}
          {inputValue && !allTags.includes(inputValue.trim()) && (
            <button
              type="button"
              onClick={() => addTag(inputValue)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 border-b border-gray-100"
            >
              <Plus className="w-4 h-4 text-green-600" />
              <span>创建标签 "<strong>{inputValue.trim()}</strong>"</span>
            </button>
          )}

          {/* 可用标签列表 */}
          {availableTags.length > 0 ? (
            availableTags.slice(0, 10).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getTagColor(tag) }}
                  />
                  <span>{tag}</span>
                </div>
                <Plus className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          ) : inputValue && (
            <div className="px-3 py-2 text-sm text-gray-500">
              没有找到匹配的标签
            </div>
          )}

          {/* 标签数量限制提示 */}
          {tags.length >= maxTags && (
            <div className="px-3 py-2 text-sm text-amber-600 bg-amber-50 border-t border-amber-200">
              最多只能添加 {maxTags} 个标签
            </div>
          )}
        </div>
      )}

      {/* 标签统计 */}
      {tags.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          已选择 {tags.length} 个标签
          {maxTags && ` (最多 ${maxTags} 个)`}
        </div>
      )}
    </div>
  )
}

export default TagManager
