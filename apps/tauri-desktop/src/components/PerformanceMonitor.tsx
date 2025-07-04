import React from 'react'
import OptimizedPerformanceMonitor from './OptimizedPerformanceMonitor'
import { useVirtualizedPerformanceMonitor } from '../hooks/useVirtualizedPerformanceMonitor'

interface PerformanceMonitorProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * 优化的性能监控组件
 * 目标：实现<100ms渲染性能
 * 特性：虚拟化列表、智能数据压缩、实时性能分析
 */
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ isOpen, onClose }) => {
  // 使用新的虚拟化性能监控Hook
  const {
    history,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearHistory
  } = useVirtualizedPerformanceMonitor({
    updateInterval: 1000, // 更频繁的更新以实现<100ms目标
    maxHistoryEntries: 500, // 减少历史记录以提升性能
    enableSmartSampling: true,
    enablePerformanceOptimization: true,
    samplingThreshold: 3, // 更敏感的变化检测
    compressionRatio: 0.8 // 更高的压缩比
  })

  // 使用优化的性能监控组件
  return (
    <OptimizedPerformanceMonitor
      isOpen={isOpen}
      onClose={onClose}
      data={history}
      isMonitoring={isMonitoring}
      onToggleMonitoring={isMonitoring ? stopMonitoring : startMonitoring}
      onClearHistory={clearHistory}
    />
  )
}

export default PerformanceMonitor
