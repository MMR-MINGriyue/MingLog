/**
 * 格式化工具栏组件
 */

import React, { useCallback } from 'react'
import { Editor, Transforms, Text } from 'slate'
import { useSlate } from 'slate-react'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Link, 
  Palette,
  MoreHorizontal,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from 'lucide-react'

import { CustomEditor, CustomText } from '../types'

interface FormatToolbarProps {
  editor: CustomEditor
  position: { x: number; y: number }
  onClose: () => void
  className?: string
}

export const FormatToolbar: React.FC<FormatToolbarProps> = ({
  editor,
  position,
  onClose,
  className = ''
}) => {
  // 检查格式是否激活
  const isFormatActive = useCallback((format: keyof CustomText) => {
    const marks = Editor.marks(editor)
    return marks ? marks[format] === true : false
  }, [editor])

  // 切换文本格式
  const toggleFormat = useCallback((format: keyof CustomText) => {
    const isActive = isFormatActive(format)
    
    if (isActive) {
      Editor.removeMark(editor, format)
    } else {
      Editor.addMark(editor, format, true)
    }
  }, [editor, isFormatActive])

  // 设置文本颜色
  const setTextColor = useCallback((color: string) => {
    Editor.addMark(editor, 'color', color)
  }, [editor])

  // 设置背景颜色
  const setBackgroundColor = useCallback((color: string) => {
    Editor.addMark(editor, 'backgroundColor', color)
  }, [editor])

  // 插入链接
  const insertLink = useCallback(() => {
    const url = window.prompt('请输入链接地址:')
    if (url) {
      Editor.addMark(editor, 'link', url)
    }
  }, [editor])

  // 清除格式
  const clearFormat = useCallback(() => {
    const marks = Editor.marks(editor)
    if (marks) {
      Object.keys(marks).forEach(mark => {
        Editor.removeMark(editor, mark)
      })
    }
  }, [editor])

  // 工具栏按钮配置
  const formatButtons = [
    {
      key: 'bold',
      icon: Bold,
      title: '粗体 (Ctrl+B)',
      isActive: isFormatActive('bold'),
      onClick: () => toggleFormat('bold')
    },
    {
      key: 'italic',
      icon: Italic,
      title: '斜体 (Ctrl+I)',
      isActive: isFormatActive('italic'),
      onClick: () => toggleFormat('italic')
    },
    {
      key: 'underline',
      icon: Underline,
      title: '下划线 (Ctrl+U)',
      isActive: isFormatActive('underline'),
      onClick: () => toggleFormat('underline')
    },
    {
      key: 'strikethrough',
      icon: Strikethrough,
      title: '删除线',
      isActive: isFormatActive('strikethrough'),
      onClick: () => toggleFormat('strikethrough')
    },
    {
      key: 'code',
      icon: Code,
      title: '行内代码 (Ctrl+`)',
      isActive: isFormatActive('code'),
      onClick: () => toggleFormat('code')
    }
  ]

  const colorOptions = [
    { name: '默认', value: '#000000' },
    { name: '红色', value: '#ef4444' },
    { name: '橙色', value: '#f97316' },
    { name: '黄色', value: '#eab308' },
    { name: '绿色', value: '#22c55e' },
    { name: '蓝色', value: '#3b82f6' },
    { name: '紫色', value: '#8b5cf6' },
    { name: '粉色', value: '#ec4899' },
    { name: '灰色', value: '#6b7280' }
  ]

  const backgroundOptions = [
    { name: '无背景', value: 'transparent' },
    { name: '浅红', value: '#fef2f2' },
    { name: '浅橙', value: '#fff7ed' },
    { name: '浅黄', value: '#fefce8' },
    { name: '浅绿', value: '#f0fdf4' },
    { name: '浅蓝', value: '#eff6ff' },
    { name: '浅紫', value: '#faf5ff' },
    { name: '浅粉', value: '#fdf2f8' },
    { name: '浅灰', value: '#f9fafb' }
  ]

  return (
    <div
      className={`fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 ${className}`}
      style={{
        left: position.x - 150, // 居中显示
        top: position.y - 50,
        minWidth: '300px'
      }}
    >
      {/* 主要格式按钮 */}
      <div className="flex items-center space-x-1 mb-2">
        {formatButtons.map(button => {
          const IconComponent = button.icon
          return (
            <button
              key={button.key}
              onClick={button.onClick}
              title={button.title}
              className={`flex items-center justify-center w-8 h-8 rounded transition-colors ${
                button.isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <IconComponent className="w-4 h-4" />
            </button>
          )
        })}
        
        {/* 分隔线 */}
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        {/* 链接按钮 */}
        <button
          onClick={insertLink}
          title="插入链接 (Ctrl+K)"
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <Link className="w-4 h-4" />
        </button>
        
        {/* 清除格式按钮 */}
        <button
          onClick={clearFormat}
          title="清除格式"
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <Type className="w-4 h-4" />
        </button>
      </div>

      {/* 颜色选择 */}
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-xs text-gray-500 w-12">文字:</span>
        <div className="flex space-x-1">
          {colorOptions.slice(0, 6).map(color => (
            <button
              key={color.value}
              onClick={() => setTextColor(color.value)}
              title={color.name}
              className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
              style={{ backgroundColor: color.value }}
            />
          ))}
          <button
            className="w-6 h-6 rounded border border-gray-200 hover:bg-gray-100 flex items-center justify-center"
            title="更多颜色"
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 背景颜色选择 */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500 w-12">背景:</span>
        <div className="flex space-x-1">
          {backgroundOptions.slice(0, 6).map(bg => (
            <button
              key={bg.value}
              onClick={() => setBackgroundColor(bg.value)}
              title={bg.name}
              className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
              style={{ 
                backgroundColor: bg.value,
                border: bg.value === 'transparent' ? '2px dashed #d1d5db' : undefined
              }}
            />
          ))}
          <button
            className="w-6 h-6 rounded border border-gray-200 hover:bg-gray-100 flex items-center justify-center"
            title="更多背景"
          >
            <Palette className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-600 transition-colors"
      >
        ×
      </button>
    </div>
  )
}

export default FormatToolbar
