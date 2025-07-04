import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { FixedSizeList as List } from 'react-window'
import { Activity, Database, Clock, Zap } from 'lucide-react'

interface PerformanceMetrics {
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  renderTime: number
  dbQueryTime: number
  componentCount: number
  lastUpdate: Date
  cpuCores?: number
  cpuUsage?: number
  diskRead?: number
  diskWrite?: number
  pageLoadTime?: number
  domNodes?: number
  jsHeapSize?: number
  networkRequests?: number
  fps?: number
  bundleSize?: number
}

interface VirtualizedPerformanceListProps {
  data: PerformanceMetrics[]
  height: number
  itemHeight?: number
  onItemClick?: (item: PerformanceMetrics, index: number) => void
  className?: string
}

interface ListItemProps {
  index: number
  style: React.CSSProperties
  data: {
    items: PerformanceMetrics[]
    onItemClick?: (item: PerformanceMetrics, index: number) => void
  }
}

// 优化的列表项组件 - 使用memo避免不必要的重渲染
const ListItem = memo<ListItemProps>(({ index, style, data }) => {
  const { items, onItemClick } = data
  const item = items[index]

  if (!item) {
    return (
      <div style={style} className="flex items-center justify-center text-gray-400">
        <span>No data</span>
      </div>
    )
  }

  const handleClick = useCallback(() => {
    onItemClick?.(item, index)
  }, [item, index, onItemClick])

  // 格式化时间显示
  const timeDisplay = useMemo(() => {
    const now = new Date()
    const diff = now.getTime() - item.lastUpdate.getTime()
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return item.lastUpdate.toLocaleTimeString()
  }, [item.lastUpdate])

  // 性能状态指示器
  const getPerformanceStatus = useMemo(() => {
    const memoryStatus = item.memoryUsage.percentage > 80 ? 'critical' : 
                        item.memoryUsage.percentage > 60 ? 'warning' : 'good'
    const renderStatus = item.renderTime > 100 ? 'critical' :
                        item.renderTime > 50 ? 'warning' : 'good'
    
    if (memoryStatus === 'critical' || renderStatus === 'critical') return 'critical'
    if (memoryStatus === 'warning' || renderStatus === 'warning') return 'warning'
    return 'good'
  }, [item.memoryUsage.percentage, item.renderTime])

  const statusColors = {
    good: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    critical: 'bg-red-100 text-red-700'
  }

  return (
    <div
      style={style}
      className={`
        flex items-center justify-between px-4 py-2 border-b border-gray-100 
        hover:bg-gray-50 cursor-pointer transition-colors duration-150
        ${onItemClick ? 'hover:shadow-sm' : ''}
      `}
      onClick={handleClick}
      role="listitem"
      tabIndex={0}
      aria-label={`Performance metrics from ${timeDisplay}`}
    >
      {/* 状态指示器 */}
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${
          getPerformanceStatus === 'good' ? 'bg-green-400' :
          getPerformanceStatus === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
        }`} />
        
        {/* 时间戳 */}
        <span className="text-sm text-gray-500 min-w-[80px]">
          {timeDisplay}
        </span>
      </div>

      {/* 核心指标 */}
      <div className="flex items-center space-x-6 flex-1">
        {/* 内存使用率 */}
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-blue-600" />
          <div className="text-sm">
            <span className="font-medium">{item.memoryUsage.percentage.toFixed(1)}%</span>
            <span className="text-gray-500 ml-1">
              ({(item.memoryUsage.used / 1024 / 1024).toFixed(1)}MB)
            </span>
          </div>
        </div>

        {/* 渲染时间 */}
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-green-600" />
          <div className="text-sm">
            <span className="font-medium">{item.renderTime.toFixed(1)}ms</span>
          </div>
        </div>

        {/* 数据库查询时间 */}
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-purple-600" />
          <div className="text-sm">
            <span className="font-medium">{item.dbQueryTime.toFixed(1)}ms</span>
          </div>
        </div>

        {/* 组件数量 */}
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-orange-600" />
          <div className="text-sm">
            <span className="font-medium">{item.componentCount}</span>
          </div>
        </div>
      </div>

      {/* 整体状态标签 */}
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[getPerformanceStatus]}`}>
        {getPerformanceStatus === 'good' ? 'Good' :
         getPerformanceStatus === 'warning' ? 'Warning' : 'Critical'}
      </div>
    </div>
  )
})

ListItem.displayName = 'VirtualizedPerformanceListItem'

// 主虚拟化列表组件
const VirtualizedPerformanceList: React.FC<VirtualizedPerformanceListProps> = ({
  data,
  height,
  itemHeight = 60,
  onItemClick,
  className = ''
}) => {
  const listRef = useRef<List>(null)
  const [isScrolling, setIsScrolling] = useState(false)

  // 优化的数据传递 - 避免每次渲染都创建新对象
  const itemData = useMemo(() => ({
    items: data,
    onItemClick
  }), [data, onItemClick])

  // 滚动到最新数据
  const scrollToLatest = useCallback(() => {
    if (listRef.current && data.length > 0) {
      listRef.current.scrollToItem(data.length - 1, 'end')
    }
  }, [data.length])

  // 滚动状态管理
  const handleScroll = useCallback(() => {
    setIsScrolling(true)
  }, [])

  const handleScrollStop = useCallback(() => {
    setIsScrolling(false)
  }, [])

  // 键盘导航支持
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!listRef.current) return

    switch (event.key) {
      case 'Home':
        event.preventDefault()
        listRef.current.scrollToItem(0, 'start')
        break
      case 'End':
        event.preventDefault()
        listRef.current.scrollToItem(data.length - 1, 'end')
        break
      case 'PageUp':
        event.preventDefault()
        // 向上滚动一页
        break
      case 'PageDown':
        event.preventDefault()
        // 向下滚动一页
        break
    }
  }, [data.length])

  // 自动滚动到最新数据（可选）
  useEffect(() => {
    if (!isScrolling && data.length > 0) {
      const timer = setTimeout(() => {
        scrollToLatest()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [data.length, isScrolling, scrollToLatest])

  if (data.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>No performance data available</p>
          <p className="text-sm">Start monitoring to see real-time metrics</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="list"
      aria-label="Performance metrics history"
    >
      {/* 列表头部 */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between text-sm font-medium text-gray-700">
          <span>Performance History ({data.length} entries)</span>
          <button
            onClick={scrollToLatest}
            className="text-blue-600 hover:text-blue-700 transition-colors"
            aria-label="Scroll to latest metrics"
          >
            Latest
          </button>
        </div>
      </div>

      {/* 虚拟化列表 */}
      <List
        ref={listRef}
        height={height - 40} // 减去头部高度
        width="100%"
        itemCount={data.length}
        itemSize={itemHeight}
        itemData={itemData}
        onScroll={handleScroll}
        onItemsRendered={handleScrollStop}
        overscanCount={5} // 预渲染5个项目以提升滚动性能
      >
        {ListItem}
      </List>
    </div>
  )
}

export default memo(VirtualizedPerformanceList)
