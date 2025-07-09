/**
 * 块类型选择菜单
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  Type,
  Hash,
  List,
  Quote,
  Code,
  Minus,
  Image as ImageIcon,
  Video,
  Music,
  File,
  Table,
  AlertCircle,
  ChevronRight,
  Columns,
  Globe,
  Calculator,
  GitBranch,
  CheckSquare,
  Search
} from 'lucide-react'

import { BlockType, BlockMenuItem } from '../types'

interface BlockMenuProps {
  position: { x: number; y: number }
  onSelect: (blockType: BlockType) => void
  onClose: () => void
  allowedBlocks?: BlockType[]
}

// 预定义的块菜单项
const DEFAULT_BLOCK_ITEMS: BlockMenuItem[] = [
  {
    type: 'paragraph',
    title: '段落',
    description: '普通文本段落',
    icon: 'Type',
    keywords: ['text', 'paragraph', '段落', '文本'],
    group: 'basic'
  },
  {
    type: 'heading-1',
    title: '标题 1',
    description: '大标题',
    icon: 'Hash',
    keywords: ['heading', 'h1', '标题', '大标题'],
    group: 'basic'
  },
  {
    type: 'heading-2',
    title: '标题 2',
    description: '中标题',
    icon: 'Hash',
    keywords: ['heading', 'h2', '标题', '中标题'],
    group: 'basic'
  },
  {
    type: 'heading-3',
    title: '标题 3',
    description: '小标题',
    icon: 'Hash',
    keywords: ['heading', 'h3', '标题', '小标题'],
    group: 'basic'
  },
  {
    type: 'todo-list',
    title: '待办列表',
    description: '创建可勾选的任务列表',
    icon: 'CheckSquare',
    keywords: ['todo', 'task', 'checkbox', '待办', '任务', '清单'],
    group: 'basic'
  },
  {
    type: 'bulleted-list',
    title: '无序列表',
    description: '创建无序列表',
    icon: 'List',
    keywords: ['list', 'bullet', '列表', '无序'],
    group: 'basic'
  },
  {
    type: 'numbered-list',
    title: '有序列表',
    description: '创建有序列表',
    icon: 'List',
    keywords: ['list', 'number', '列表', '有序', '数字'],
    group: 'basic'
  },
  {
    type: 'quote',
    title: '引用',
    description: '创建引用块',
    icon: 'Quote',
    keywords: ['quote', 'blockquote', '引用', '引述'],
    group: 'basic'
  },
  {
    type: 'code',
    title: '代码块',
    description: '插入代码块',
    icon: 'Code',
    keywords: ['code', 'pre', '代码', '代码块'],
    group: 'basic'
  },
  {
    type: 'divider',
    title: '分割线',
    description: '插入分割线',
    icon: 'Minus',
    keywords: ['divider', 'hr', '分割线', '分隔符'],
    group: 'basic'
  },
  {
    type: 'image',
    title: '图片',
    description: '插入图片',
    icon: 'ImageIcon',
    keywords: ['image', 'picture', '图片', '图像'],
    group: 'media'
  },
  {
    type: 'video',
    title: '视频',
    description: '插入视频',
    icon: 'Video',
    keywords: ['video', 'movie', '视频', '影片'],
    group: 'media'
  },
  {
    type: 'audio',
    title: '音频',
    description: '插入音频',
    icon: 'Music',
    keywords: ['audio', 'sound', 'music', '音频', '音乐'],
    group: 'media'
  },
  {
    type: 'file',
    title: '文件',
    description: '插入文件',
    icon: 'File',
    keywords: ['file', 'attachment', '文件', '附件'],
    group: 'media'
  },
  {
    type: 'video',
    title: '视频',
    description: '插入视频',
    icon: 'Video',
    keywords: ['video', 'movie', '视频', '影片'],
    group: 'media'
  },
  {
    type: 'audio',
    title: '音频',
    description: '插入音频',
    icon: 'Music',
    keywords: ['audio', 'sound', 'music', '音频', '音乐'],
    group: 'media'
  },
  {
    type: 'file',
    title: '文件',
    description: '插入文件',
    icon: 'File',
    keywords: ['file', 'attachment', '文件', '附件'],
    group: 'media'
  },
  {
    type: 'table',
    title: '表格',
    description: '插入表格',
    icon: 'Table',
    keywords: ['table', '表格'],
    group: 'advanced'
  },
  {
    type: 'callout',
    title: '标注',
    description: '创建标注块',
    icon: 'AlertCircle',
    keywords: ['callout', 'note', '标注', '提示'],
    group: 'advanced'
  },
  {
    type: 'toggle',
    title: '折叠块',
    description: '创建可折叠内容',
    icon: 'ChevronRight',
    keywords: ['toggle', 'collapse', '折叠', '展开'],
    group: 'advanced'
  },
  {
    type: 'columns',
    title: '分栏',
    description: '创建多栏布局',
    icon: 'Columns',
    keywords: ['columns', 'layout', '分栏', '布局'],
    group: 'advanced'
  },
  {
    type: 'embed',
    title: '嵌入',
    description: '嵌入外部内容',
    icon: 'Globe',
    keywords: ['embed', 'iframe', '嵌入', '外链'],
    group: 'advanced'
  },
  {
    type: 'math',
    title: '数学公式',
    description: '插入数学公式',
    icon: 'Calculator',
    keywords: ['math', 'formula', 'latex', '数学', '公式'],
    group: 'advanced'
  },
  {
    type: 'mermaid',
    title: 'Mermaid图表',
    description: '创建流程图和图表',
    icon: 'GitBranch',
    keywords: ['mermaid', 'diagram', 'chart', '图表', '流程图'],
    group: 'advanced'
  }
]

export const BlockMenu: React.FC<BlockMenuProps> = ({
  position,
  onSelect,
  onClose,
  allowedBlocks
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 过滤菜单项
  const filteredItems = DEFAULT_BLOCK_ITEMS.filter(item => {
    // 检查是否在允许的块类型中
    if (allowedBlocks && allowedBlocks.indexOf(item.type) === -1) {
      return false
    }
    
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(query))
      )
    }
    
    return true
  })

  // 按组分组
  const groupedItems = filteredItems.reduce((groups, item) => {
    if (!groups[item.group]) {
      groups[item.group] = []
    }
    groups[item.group].push(item)
    return groups
  }, {} as Record<string, BlockMenuItem[]>)

  // 获取图标组件
  const getIcon = (iconName: string) => {
    const iconProps = { className: "w-4 h-4" }
    switch (iconName) {
      case 'Type': return <Type {...iconProps} />
      case 'Hash': return <Hash {...iconProps} />
      case 'List': return <List {...iconProps} />
      case 'CheckSquare': return <CheckSquare {...iconProps} />
      case 'Quote': return <Quote {...iconProps} />
      case 'Code': return <Code {...iconProps} />
      case 'Minus': return <Minus {...iconProps} />
      case 'ImageIcon': return <ImageIcon {...iconProps} />
      case 'Video': return <Video {...iconProps} />
      case 'Music': return <Music {...iconProps} />
      case 'File': return <File {...iconProps} />
      case 'Table': return <Table {...iconProps} />
      case 'AlertCircle': return <AlertCircle {...iconProps} />
      case 'ChevronRight': return <ChevronRight {...iconProps} />
      case 'Columns': return <Columns {...iconProps} />
      case 'Globe': return <Globe {...iconProps} />
      case 'Calculator': return <Calculator {...iconProps} />
      case 'GitBranch': return <GitBranch {...iconProps} />
      default: return <Type {...iconProps} />
    }
  }

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredItems.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredItems.length - 1
          )
          break
        case 'Enter':
          event.preventDefault()
          if (filteredItems[selectedIndex]) {
            onSelect(filteredItems[selectedIndex].type)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [filteredItems, selectedIndex, onSelect, onClose])

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // 自动聚焦搜索框
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // 重置选中索引当搜索结果变化时
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  const groupLabels = {
    basic: '基础',
    media: '媒体',
    advanced: '高级'
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-80 max-w-96"
      style={{
        left: position.x,
        top: position.y,
        maxHeight: '400px'
      }}
    >
      {/* 搜索框 */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="搜索块类型..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 菜单项 */}
      <div className="max-h-80 overflow-y-auto">
        {Object.keys(groupedItems).map((group: string) => {
          const items = groupedItems[group]
          return (
          <div key={group} className="py-2">
            <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
              {groupLabels[group as keyof typeof groupLabels] || group}
            </div>
            {items.map((item: BlockMenuItem, index: number) => {
              const globalIndex = filteredItems.indexOf(item)
              const isSelected = globalIndex === selectedIndex
              
              return (
                <button
                  key={item.type}
                  onClick={() => onSelect(item.type)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className={`flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                    {getIcon(item.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-gray-500 truncate">{item.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
          )
        })}
        
        {filteredItems.length === 0 && (
          <div className="px-3 py-8 text-center text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">未找到匹配的块类型</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BlockMenu
