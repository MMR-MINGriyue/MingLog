/**
 * 性能监控组件
 * 优化的性能监控面板，支持实时数据收集和可视化
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
} from 'chart.js'
import { Button } from '../../atoms/Button/Button'
import { cn } from '../../../utils/classNames'
import { useTheme } from '../../../contexts/ThemeContext'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export interface PerformanceMetrics {
  timestamp: number
  memoryUsage: number
  cpuUsage: number
  renderTime: number
  fps: number
}

export interface PerformanceMonitorProps {
  isOpen: boolean
  onClose: () => void
  maxDataPoints?: number
  updateInterval?: number
  className?: string
}

export function PerformanceMonitor({
  isOpen,
  onClose,
  maxDataPoints = 50,
  updateInterval = 1000,
  className
}: PerformanceMonitorProps) {
  const { isDark } = useTheme()
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [isCollecting, setIsCollecting] = useState(false)

  // 模拟性能数据收集
  const collectMetrics = useCallback((): PerformanceMetrics => {
    const now = Date.now()
    
    // 模拟数据 - 在实际应用中这些会来自真实的性能API
    const memoryUsage = (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 
                       Math.random() * 100 + 50
    const cpuUsage = Math.random() * 30 + 10
    const renderTime = Math.random() * 16 + 8
    const fps = 60 - Math.random() * 10

    return {
      timestamp: now,
      memoryUsage,
      cpuUsage,
      renderTime,
      fps,
    }
  }, [])

  // 性能数据收集循环
  useEffect(() => {
    if (!isOpen || !isCollecting) return

    const interval = setInterval(() => {
      const newMetric = collectMetrics()
      setMetrics(prev => {
        const updated = [...prev, newMetric]
        return updated.slice(-maxDataPoints)
      })
    }, updateInterval)

    return () => clearInterval(interval)
  }, [isOpen, isCollecting, collectMetrics, maxDataPoints, updateInterval])

  // 开始/停止收集
  const toggleCollection = useCallback(() => {
    setIsCollecting(prev => !prev)
  }, [])

  // 清除数据
  const clearData = useCallback(() => {
    setMetrics([])
  }, [])

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // 图表数据
  const chartData = useMemo(() => {
    const labels = metrics.map(m => new Date(m.timestamp).toLocaleTimeString())
    
    return {
      labels,
      datasets: [
        {
          label: 'Memory (MB)',
          data: metrics.map(m => m.memoryUsage),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
        },
        {
          label: 'CPU (%)',
          data: metrics.map(m => m.cpuUsage),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Render Time (ms)',
          data: metrics.map(m => m.renderTime),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.1,
        },
        {
          label: 'FPS',
          data: metrics.map(m => m.fps),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.1,
        },
      ],
    }
  }, [metrics])

  // 图表选项
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#e5e5e5' : '#404040',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Performance Metrics',
        color: isDark ? '#f5f5f5' : '#262626',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#262626' : '#ffffff',
        titleColor: isDark ? '#f5f5f5' : '#262626',
        bodyColor: isDark ? '#e5e5e5' : '#404040',
        borderColor: isDark ? '#404040' : '#e5e5e5',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: isDark ? '#404040' : '#e5e5e5'
        },
        ticks: {
          color: isDark ? '#a3a3a3' : '#737373'
        }
      },
      y: {
        grid: {
          color: isDark ? '#404040' : '#e5e5e5'
        },
        ticks: {
          color: isDark ? '#a3a3a3' : '#737373'
        }
      }
    },
    animation: {
      duration: 0 // 禁用动画以提高性能
    }
  }), [isDark])

  // 计算统计信息
  const stats = useMemo(() => {
    if (metrics.length === 0) return null

    const latest = metrics[metrics.length - 1]
    const avg = {
      memory: metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length,
      cpu: metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length,
      renderTime: metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length,
      fps: metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length
    }

    return { latest, avg }
  }, [metrics])

  if (!isOpen) return null

  return (
    <div className={cn(
      'fixed inset-0 z-modal bg-black/50 flex items-center justify-center p-4',
      className
    )}>
      <div className={cn(
        'bg-background-elevated rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden',
        'border border-border-primary'
      )}>
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <h2 className="text-xl font-semibold text-foreground-primary">
            Performance Monitor
          </h2>
          <div className="flex items-center gap-3">
            <Button
              variant={isCollecting ? 'destructive' : 'primary'}
              size="sm"
              onClick={toggleCollection}
            >
              {isCollecting ? 'Stop' : 'Start'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearData}
              disabled={metrics.length === 0}
            >
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close performance monitor"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        {stats && (
          <div className="p-6 border-b border-border-primary">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {stats.latest.memoryUsage.toFixed(1)}
                </div>
                <div className="text-sm text-foreground-secondary">
                  Memory (MB)
                </div>
                <div className="text-xs text-foreground-tertiary">
                  Avg: {stats.avg.memory.toFixed(1)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {stats.latest.cpuUsage.toFixed(1)}%
                </div>
                <div className="text-sm text-foreground-secondary">
                  CPU Usage
                </div>
                <div className="text-xs text-foreground-tertiary">
                  Avg: {stats.avg.cpu.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {stats.latest.renderTime.toFixed(1)}ms
                </div>
                <div className="text-sm text-foreground-secondary">
                  Render Time
                </div>
                <div className="text-xs text-foreground-tertiary">
                  Avg: {stats.avg.renderTime.toFixed(1)}ms
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {stats.latest.fps.toFixed(0)}
                </div>
                <div className="text-sm text-foreground-secondary">
                  FPS
                </div>
                <div className="text-xs text-foreground-tertiary">
                  Avg: {stats.avg.fps.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 图表 */}
        <div className="p-6">
          <div className="h-80">
            {metrics.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-foreground-tertiary">
                <div className="text-center">
                  <div className="text-lg mb-2">No data available</div>
                  <div className="text-sm">Click "Start" to begin collecting performance metrics</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 状态信息 */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between text-sm text-foreground-secondary">
            <div>
              Status: {isCollecting ? (
                <span className="text-green-500">Collecting</span>
              ) : (
                <span className="text-foreground-tertiary">Stopped</span>
              )}
            </div>
            <div>
              Data Points: {metrics.length}/{maxDataPoints}
            </div>
            <div>
              Update Interval: {updateInterval}ms
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
