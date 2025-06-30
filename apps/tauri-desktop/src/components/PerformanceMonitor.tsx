import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Activity, Database, Clock, Zap, BarChart3, X } from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

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
  cpuCores?: number
  cpuUsage?: number
  diskRead?: number
  diskWrite?: number
  pageLoadTime?: number
  domNodes?: number
  jsHeapSize?: number
  networkRequests?: number
}

interface PerformanceMonitorProps {
  isOpen: boolean
  onClose: () => void
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: { used: 0, total: 0, percentage: 0 },
    renderTime: 0,
    dbQueryTime: 0,
    componentCount: 0,
    lastUpdate: new Date()
  })
  const [history, setHistory] = useState<PerformanceMetrics[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)

  // 实现真实的内存使用监控
  const getMemoryUsage = useCallback(async () => {
    try {
      const memoryInfo = await invoke<{ used: number; total: number }>('get_memory_info')
      return {
        used: Math.round(memoryInfo.used / (1024 * 1024)), // 转换为MB
        total: Math.round(memoryInfo.total / (1024 * 1024)),
        percentage: Math.round((memoryInfo.used / memoryInfo.total) * 100)
      }
    } catch (error) {
      console.error('Failed to get memory usage:', error)
      return { used: 0, total: 0, percentage: 0 }
    }
  }, [])

  // 实现真实的渲染时间测量
  const measureRenderTime = useCallback(async () => {
    const marks: Performance[] = []
    const observer = new PerformanceObserver((list) => {
      marks.push(...list.getEntries())
    })
    
    observer.observe({ entryTypes: ['measure'] })
    performance.mark('render-start')
    
    // 等待下一帧渲染完成
    await new Promise(requestAnimationFrame)
    
    performance.mark('render-end')
    performance.measure('render-time', 'render-start', 'render-end')
    
    const measurements = performance.getEntriesByName('render-time')
    observer.disconnect()
    
    return measurements[0]?.duration || 0
  }, [])

  // 实现真实的数据库查询时间监控
  const measureDbQueryTime = useCallback(async () => {
    try {
      const startTime = performance.now()
      await invoke('measure_db_performance')
      const endTime = performance.now()
      return endTime - startTime
    } catch (error) {
      console.error('Failed to measure DB performance:', error)
      return 0
    }
  }, [])

  // 实现准确的组件计数
  const countComponents = useCallback(() => {
    let count = 0
    const walker = document.createTreeWalker(
      document.querySelector('#root') || document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (node.hasAttribute('data-reactroot') || 
              node.getAttribute('data-testid')?.startsWith('react-') ||
              node._reactRootContainer) {
            return NodeFilter.FILTER_ACCEPT
          }
          return NodeFilter.FILTER_SKIP
        }
      }
    )
    
    while (walker.nextNode()) count++
    return count
  }, [])

  // 更新指标收集逻辑
  const updateMetrics = useCallback(async () => {
    try {
      const [memUsage, renderTime, dbTime, compCount] = await Promise.all([
        getMemoryUsage(),
        measureRenderTime(),
        measureDbQueryTime(),
        countComponents()
      ])

      const newMetrics: PerformanceMetrics = {
        memoryUsage: memUsage,
        renderTime: renderTime,
        dbQueryTime: dbTime,
        componentCount: compCount,
        lastUpdate: new Date()
      }

      setMetrics(newMetrics)
      setHistory(prev => [...prev.slice(-19), newMetrics])
    } catch (error) {
      console.error('Failed to update metrics:', error)
    }
  }, [getMemoryUsage, measureRenderTime, measureDbQueryTime, countComponents])

  // Start/stop monitoring
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isMonitoring && isOpen) {
      updateMetrics() // Initial update
      interval = setInterval(updateMetrics, 2000) // Update every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isMonitoring, isOpen, updateMetrics])

  // Auto-start monitoring when opened
  useEffect(() => {
    if (isOpen) {
      setIsMonitoring(true)
    } else {
      setIsMonitoring(false)
    }
  }, [isOpen])

  const formatBytes = (bytes: number) => {
    return `${bytes.toFixed(1)} MB`
  }

  const formatTime = (ms: number) => {
    return `${ms.toFixed(1)}ms`
  }

  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.warning) return 'warning'
    return 'poor'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'poor': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // 准备图表数据
  const chartData = useMemo(() => {
    const labels = history.map(h => 
      new Date(h.lastUpdate).toLocaleTimeString()
    ).slice(-20)

    return {
      labels,
      datasets: [
        {
          label: '内存使用 (%)',
          data: history.map(h => h.memoryUsage.percentage).slice(-20),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: '渲染时间 (ms)',
          data: history.map(h => h.renderTime).slice(-20),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
        {
          label: '数据库查询时间 (ms)',
          data: history.map(h => h.dbQueryTime).slice(-20),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
      ],
    }
  }, [history])

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '性能监控趋势',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    animation: {
      duration: 0, // 禁用动画以提高性能
    },
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Performance Monitor</h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isMonitoring ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {isMonitoring ? 'Monitoring' : 'Stopped'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Current Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Memory Usage */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Memory</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  getStatusColor(getPerformanceStatus(metrics.memoryUsage.percentage, { good: 60, warning: 80 }))
                }`}>
                  {metrics.memoryUsage.percentage}%
                </span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {formatBytes(metrics.memoryUsage.used)}
              </div>
              <div className="text-xs text-gray-500">
                of {formatBytes(metrics.memoryUsage.total)}
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.memoryUsage.percentage}%` }}
                />
              </div>
            </div>

            {/* Render Time */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">Render</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  getStatusColor(getPerformanceStatus(metrics.renderTime, { good: 16, warning: 33 }))
                }`}>
                  {getPerformanceStatus(metrics.renderTime, { good: 16, warning: 33 })}
                </span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {formatTime(metrics.renderTime)}
              </div>
              <div className="text-xs text-gray-500">
                per frame
              </div>
            </div>

            {/* Database Query Time */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">DB Query</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  getStatusColor(getPerformanceStatus(metrics.dbQueryTime, { good: 5, warning: 10 }))
                }`}>
                  {getPerformanceStatus(metrics.dbQueryTime, { good: 5, warning: 10 })}
                </span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {formatTime(metrics.dbQueryTime)}
              </div>
              <div className="text-xs text-gray-500">
                average
              </div>
            </div>

            {/* Component Count */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Components</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  getStatusColor(getPerformanceStatus(metrics.componentCount, { good: 100, warning: 200 }))
                }`}>
                  {getPerformanceStatus(metrics.componentCount, { good: 100, warning: 200 })}
                </span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {metrics.componentCount}
              </div>
              <div className="text-xs text-gray-500">
                rendered
              </div>
            </div>
          </div>

          {/* Performance History Chart */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance History</h3>
            <div className="h-32 flex items-end space-x-1">
              {history.map((entry, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="bg-blue-600 rounded-t w-full transition-all duration-300"
                    style={{ 
                      height: `${(entry.memoryUsage.percentage / 100) * 100}%`,
                      minHeight: '4px'
                    }}
                    title={`Memory: ${entry.memoryUsage.percentage}%`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Memory Usage Over Time</span>
              <span>Last {history.length} updates</span>
            </div>
          </div>

          {/* Performance Tips */}
          <div className="mt-6 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Performance Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Memory Optimization</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Close unused notes and tabs</li>
                  <li>• Archive old notes regularly</li>
                  <li>• Limit search results</li>
                  <li>• Restart app if memory usage is high</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Speed Optimization</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use keyboard shortcuts</li>
                  <li>• Enable auto-save to reduce manual saves</li>
                  <li>• Keep database optimized</li>
                  <li>• Close performance monitor when not needed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Platform:</span>
                <span className="ml-2 text-gray-600">{navigator.platform}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">User Agent:</span>
                <span className="ml-2 text-gray-600">{navigator.userAgent.split(' ')[0]}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Update:</span>
                <span className="ml-2 text-gray-600">{metrics.lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <Clock className="w-4 h-4 inline mr-1" />
            Updates every 2 seconds while monitoring
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`btn-secondary ${isMonitoring ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
            <button onClick={onClose} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerformanceMonitor
