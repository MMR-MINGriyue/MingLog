import React from 'react'
import OptimizedPerformanceMonitor from './OptimizedPerformanceMonitor'

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
  // 直接使用优化的性能监控组件
  return (
    <OptimizedPerformanceMonitor
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}

export default PerformanceMonitor
