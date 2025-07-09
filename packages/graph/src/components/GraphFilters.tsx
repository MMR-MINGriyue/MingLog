/**
 * 图谱高级过滤器组件
 */

import React, { useState, useCallback } from 'react'
import { 
  Filter, 
  Calendar, 
  Hash, 
  Search, 
  Sliders, 
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

import { GraphFilter, GraphData } from '../types'

interface GraphFiltersProps {
  data: GraphData
  filter: GraphFilter
  onFilterChange: (filter: GraphFilter) => void
  onClose?: () => void
  className?: string
}

export const GraphFilters: React.FC<GraphFiltersProps> = ({
  data,
  filter,
  onFilterChange,
  onClose,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['nodeTypes', 'search'])
  )

  // 切换展开状态
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }, [])

  // 更新过滤器
  const updateFilter = useCallback((updates: Partial<GraphFilter>) => {
    onFilterChange({ ...filter, ...updates })
  }, [filter, onFilterChange])

  // 获取可用的节点类型
  const availableNodeTypes = Array.from(new Set(data.nodes.map(node => node.type)))
  
  // 获取可用的链接类型
  const availableLinkTypes = Array.from(new Set(data.links.map(link => link.type)))
  
  // 获取可用的标签
  const availableTags = Array.from(new Set(
    data.nodes.reduce<string[]>((acc, node) => {
      if (node.tags) {
        acc.push(...node.tags)
      }
      return acc
    }, [])
  )).sort()

  // 节点类型中文映射
  const nodeTypeLabels: Record<string, string> = {
    note: '笔记',
    tag: '标签',
    folder: '文件夹',
    link: '链接'
  }

  // 链接类型中文映射
  const linkTypeLabels: Record<string, string> = {
    reference: '引用',
    tag: '标签',
    folder: '文件夹',
    similarity: '相似性'
  }

  // 渲染展开/折叠按钮
  const renderSectionHeader = (section: string, title: string, icon: React.ReactNode) => {
    const isExpanded = expandedSections.has(section)
    
    return (
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-medium text-gray-700">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">高级过滤器</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* 搜索过滤 */}
        <div>
          {renderSectionHeader('search', '搜索', <Search className="w-4 h-4" />)}
          {expandedSections.has('search') && (
            <div className="mt-2 pl-6">
              <input
                type="text"
                placeholder="搜索节点内容..."
                value={filter.searchQuery || ''}
                onChange={(e) => updateFilter({ searchQuery: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* 节点类型过滤 */}
        <div>
          {renderSectionHeader('nodeTypes', '节点类型', <Hash className="w-4 h-4" />)}
          {expandedSections.has('nodeTypes') && (
            <div className="mt-2 pl-6 space-y-2">
              {availableNodeTypes.map(type => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filter.nodeTypes?.includes(type) || false}
                    onChange={(e) => {
                      const currentTypes = filter.nodeTypes || []
                      const newTypes = e.target.checked
                        ? [...currentTypes, type]
                        : currentTypes.filter(t => t !== type)
                      updateFilter({ nodeTypes: newTypes })
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {nodeTypeLabels[type] || type}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({data.nodes.filter(n => n.type === type).length})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 链接类型过滤 */}
        <div>
          {renderSectionHeader('linkTypes', '连接类型', <Hash className="w-4 h-4" />)}
          {expandedSections.has('linkTypes') && (
            <div className="mt-2 pl-6 space-y-2">
              {availableLinkTypes.map(type => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filter.linkTypes?.includes(type) || false}
                    onChange={(e) => {
                      const currentTypes = filter.linkTypes || []
                      const newTypes = e.target.checked
                        ? [...currentTypes, type]
                        : currentTypes.filter(t => t !== type)
                      updateFilter({ linkTypes: newTypes })
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {linkTypeLabels[type] || type}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({data.links.filter(l => l.type === type).length})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 标签过滤 */}
        {availableTags.length > 0 && (
          <div>
            {renderSectionHeader('tags', '标签', <Hash className="w-4 h-4" />)}
            {expandedSections.has('tags') && (
              <div className="mt-2 pl-6 space-y-2 max-h-32 overflow-y-auto">
                {availableTags.map((tag: string) => (
                  <label key={tag} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filter.tags?.includes(tag) || false}
                      onChange={(e) => {
                        const currentTags = filter.tags || []
                        const newTags = e.target.checked
                          ? [...currentTags, tag]
                          : currentTags.filter(t => t !== tag)
                        updateFilter({ tags: newTags })
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">#{tag}</span>
                    <span className="text-xs text-gray-400">
                      ({data.nodes.filter(n => n.tags?.includes(tag)).length})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 连接数过滤 */}
        <div>
          {renderSectionHeader('connections', '连接数', <Sliders className="w-4 h-4" />)}
          {expandedSections.has('connections') && (
            <div className="mt-2 pl-6 space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">最少连接数</label>
                <input
                  type="number"
                  min="0"
                  value={filter.minConnections || 0}
                  onChange={(e) => updateFilter({ minConnections: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">最多连接数</label>
                <input
                  type="number"
                  min="0"
                  value={filter.maxConnections || ''}
                  onChange={(e) => updateFilter({ maxConnections: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 日期范围过滤 */}
        <div>
          {renderSectionHeader('dateRange', '创建时间', <Calendar className="w-4 h-4" />)}
          {expandedSections.has('dateRange') && (
            <div className="mt-2 pl-6 space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">开始日期</label>
                <input
                  type="date"
                  value={filter.dateRange?.start || ''}
                  onChange={(e) => updateFilter({ 
                    dateRange: { 
                      ...filter.dateRange, 
                      start: e.target.value,
                      end: filter.dateRange?.end || ''
                    } 
                  })}
                  className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">结束日期</label>
                <input
                  type="date"
                  value={filter.dateRange?.end || ''}
                  onChange={(e) => updateFilter({ 
                    dateRange: { 
                      start: filter.dateRange?.start || '',
                      end: e.target.value
                    } 
                  })}
                  className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="p-4 border-t border-gray-100 flex space-x-2">
        <button
          onClick={() => onFilterChange({})}
          className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          清除所有
        </button>
        <button
          onClick={() => {
            // 应用当前过滤器（已经实时应用了）
          }}
          className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          应用过滤器
        </button>
      </div>
    </div>
  )
}

export default GraphFilters
