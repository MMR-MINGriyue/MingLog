import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js'
import {
  sampleChartData,
  createOptimizedChartOptions,
  measureChartPerformance,
  getChartMemoryUsage
} from '../utils/chartOptimization'

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

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
}

interface OptimizedPerformanceChartProps {
  data: PerformanceMetrics[]
  height?: number
  maxDataPoints?: number
  enableAnimation?: boolean
  updateInterval?: number
  className?: string
}

// 性能监控状态
interface ChartPerformanceStats {
  renderTime: number
  memoryUsage: number | null
  dataPoints: number
  compressionRatio: number
}

// 格式化时间标签
const formatTimeLabel = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 优化的图表组件
const OptimizedPerformanceChart: React.FC<OptimizedPerformanceChartProps> = ({
  data,
  height = 300,
  maxDataPoints = 50,
  enableAnimation = true,
  updateInterval = 2000,
  className = ''
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)
  const [performanceStats, setPerformanceStats] = useState<ChartPerformanceStats>({
    renderTime: 0,
    memoryUsage: null,
    dataPoints: 0,
    compressionRatio: 1
  })

  // 智能数据采样 - 使用优化的采样算法
  const sampledData = useMemo(() => {
    const performanceTimer = measureChartPerformance()
    const sampled = sampleChartData(data, maxDataPoints, 'adaptive')
    const renderTime = performanceTimer.end()

    // 更新性能统计
    setPerformanceStats(prev => ({
      ...prev,
      renderTime,
      dataPoints: sampled.length,
      compressionRatio: data.length > 0 ? sampled.length / data.length : 1,
      memoryUsage: getChartMemoryUsage()?.used || null
    }))

    return sampled
  }, [data, maxDataPoints])

  // 优化的图表数据 - 使用useMemo缓存计算结果
  const chartData = useMemo((): ChartData<'line'> => {
    const labels = sampledData.map(item => formatTimeLabel(item.lastUpdate))
    
    return {
      labels,
      datasets: [
        {
          label: '内存使用率 (%)',
          data: sampledData.map(item => item.memoryUsage.percentage),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: sampledData.length > 20 ? 0 : 3, // 数据点多时隐藏点
          pointHoverRadius: 6,
          borderWidth: 2,
        },
        {
          label: '渲染时间 (ms)',
          data: sampledData.map(item => item.renderTime),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: sampledData.length > 20 ? 0 : 3,
          pointHoverRadius: 6,
          borderWidth: 2,
          yAxisID: 'y1', // 使用第二个Y轴
        },
        {
          label: '数据库查询 (ms)',
          data: sampledData.map(item => item.dbQueryTime),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: sampledData.length > 20 ? 0 : 3,
          pointHoverRadius: 6,
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    }
  }, [sampledData])

  // 优化的图表配置 - 使用配置生成器
  const chartOptions = useMemo((): ChartOptions<'line'> => {
    const baseOptions = createOptimizedChartOptions(
      enableAnimation,
      true, // enableTooltips
      true, // enableLegend
      maxDataPoints
    )

    // 自定义tooltip回调
    if (baseOptions.plugins?.tooltip) {
      baseOptions.plugins.tooltip.callbacks = {
        title: (context) => {
          const index = context[0]?.dataIndex
          if (index !== undefined && sampledData[index]) {
            return formatTimeLabel(sampledData[index].lastUpdate)
          }
          return ''
        },
        label: (context) => {
          const label = context.dataset.label || ''
          const value = context.parsed.y

          if (label.includes('内存')) {
            return `${label}: ${value.toFixed(1)}%`
          } else if (label.includes('时间') || label.includes('查询')) {
            return `${label}: ${value.toFixed(1)}ms`
          }
          return `${label}: ${value}`
        },
      }
    }

    // 自定义双Y轴配置
    if (baseOptions.scales) {
      baseOptions.scales.y = {
        ...baseOptions.scales.y,
        title: {
          display: true,
          text: '内存使用率 (%)',
          font: { size: 12 },
        },
        min: 0,
        max: 100,
      }

      baseOptions.scales.y1 = {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: '响应时间 (ms)',
          font: { size: 12 },
        },
        min: 0,
        ticks: {
          font: { size: 10 },
        },
        grid: {
          drawOnChartArea: false, // 避免网格线重叠
        },
      }
    }

    return baseOptions as ChartOptions<'line'>
  }, [enableAnimation, sampledData, maxDataPoints])

  // 节流更新机制 - 避免过度频繁的重渲染
  const shouldUpdate = useMemo(() => {
    const now = Date.now()
    if (now - lastUpdateTime < updateInterval / 2) {
      return false
    }
    setLastUpdateTime(now)
    return true
  }, [data, lastUpdateTime, updateInterval])

  // 可见性检测 - 当图表不可见时暂停更新
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    const chartElement = chartRef.current?.canvas
    if (chartElement) {
      observer.observe(chartElement)
    }

    return () => {
      if (chartElement) {
        observer.unobserve(chartElement)
      }
    }
  }, [])

  // 清理图表实例以防止内存泄漏
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [])

  // 如果数据为空，显示占位符
  if (sampledData.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center border border-gray-200 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-lg font-medium">No Performance Data</p>
          <p className="text-sm">Start monitoring to see real-time performance trends</p>
        </div>
      </div>
    )
  }

  // 只在可见且需要更新时渲染图表
  if (!isVisible || !shouldUpdate) {
    return (
      <div 
        className={`border border-gray-200 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="flex items-center justify-center h-full text-gray-500">
          <span>Chart paused (not visible)</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`border border-gray-200 rounded-lg p-4 ${className}`}
      style={{ height }}
    >
      {/* 性能统计信息 */}
      <div className="flex justify-between items-center mb-2 text-xs text-gray-500">
        <span>数据点: {performanceStats.dataPoints}/{data.length}</span>
        <span>压缩率: {(performanceStats.compressionRatio * 100).toFixed(1)}%</span>
        <span>渲染时间: {performanceStats.renderTime.toFixed(1)}ms</span>
        {performanceStats.memoryUsage && (
          <span>内存: {(performanceStats.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
        )}
      </div>

      <Line
        ref={chartRef}
        data={chartData}
        options={chartOptions}
        height={height - 64} // 减去padding和统计信息高度
      />
    </div>
  )
}

export default memo(OptimizedPerformanceChart)
