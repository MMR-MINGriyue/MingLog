/**
 * 图谱控制面板组件
 */

import React from 'react'
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCcw, 
  Download, 
  Filter,
  BarChart3,
  Settings
} from 'lucide-react'

import { GraphControlsProps, LayoutType } from '../types'

export const GraphControls: React.FC<GraphControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoomReset,
  onLayoutChange,
  onFilterChange,
  onExport,
  currentLayout = 'force',
  currentFilter,
  stats,
  className = ''
}) => {
  const layoutOptions: Array<{ value: LayoutType; label: string }> = [
    { value: 'force', label: '力导向' },
    { value: 'circular', label: '环形' },
    { value: 'hierarchical', label: '层次' },
    { value: 'grid', label: '网格' },
    { value: 'radial', label: '径向' }
  ]

  return (
    <div className={`minglog-graph-controls bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* 缩放控制 */}
      <div className="p-3 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-2">缩放控制</h4>
        <div className="flex space-x-2">
          <button
            onClick={onZoomIn}
            className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomOut}
            className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomFit}
            className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            title="适应窗口"
          >
            <Maximize className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomReset}
            className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            title="重置缩放"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 布局控制 */}
      <div className="p-3 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-2">布局算法</h4>
        <select
          value={currentLayout}
          onChange={(e) => onLayoutChange?.(e.target.value as LayoutType)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {layoutOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 过滤器 */}
      <div className="p-3 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <Filter className="w-4 h-4 mr-1" />
          过滤器
        </h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">节点类型</label>
            <div className="flex flex-wrap gap-1">
              {['note', 'tag', 'folder', 'link'].map(type => (
                <button
                  key={type}
                  className={`px-2 py-1 text-xs rounded ${
                    currentFilter?.nodeTypes?.includes(type)
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => {
                    const currentTypes = currentFilter?.nodeTypes || []
                    const newTypes = currentTypes.includes(type)
                      ? currentTypes.filter(t => t !== type)
                      : [...currentTypes, type]
                    onFilterChange?.({ ...currentFilter, nodeTypes: newTypes })
                  }}
                >
                  {type === 'note' ? '笔记' : 
                   type === 'tag' ? '标签' : 
                   type === 'folder' ? '文件夹' : '链接'}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">搜索</label>
            <input
              type="text"
              placeholder="搜索节点..."
              value={currentFilter?.searchQuery || ''}
              onChange={(e) => onFilterChange?.({ ...currentFilter, searchQuery: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      {stats && (
        <div className="p-3 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <BarChart3 className="w-4 h-4 mr-1" />
            统计信息
          </h4>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>节点数量:</span>
              <span className="font-medium">{stats.nodeCount}</span>
            </div>
            <div className="flex justify-between">
              <span>连接数量:</span>
              <span className="font-medium">{stats.linkCount}</span>
            </div>
            <div className="flex justify-between">
              <span>平均连接:</span>
              <span className="font-medium">{stats.avgConnections.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>最大连接:</span>
              <span className="font-medium">{stats.maxConnections}</span>
            </div>
            <div className="flex justify-between">
              <span>密度:</span>
              <span className="font-medium">{(stats.density * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* 导出控制 */}
      <div className="p-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <Download className="w-4 h-4 mr-1" />
          导出
        </h4>
        <div className="flex space-x-2">
          <button
            onClick={() => onExport?.('png')}
            className="flex-1 px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            PNG
          </button>
          <button
            onClick={() => onExport?.('svg')}
            className="flex-1 px-3 py-2 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            SVG
          </button>
          <button
            onClick={() => onExport?.('json')}
            className="flex-1 px-3 py-2 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            JSON
          </button>
        </div>
      </div>
    </div>
  )
}

export default GraphControls
