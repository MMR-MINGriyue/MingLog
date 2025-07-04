import React, { useState, useEffect, memo, useCallback, useRef } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'

// Dynamic Chart.js imports for better bundle splitting
const loadChartJS = async () => {
  const [
    chartModule,
    reactChartModule
  ] = await Promise.all([
    import('chart.js/auto'),
    import('react-chartjs-2')
  ])

  const {
    Chart: ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
  } = chartModule

  const { Line } = reactChartModule

  // Register only the components we need
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
  )

  return { ChartJS, Line }
}

interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    fill?: boolean
    tension?: number
    pointRadius?: number
    pointHoverRadius?: number
    borderWidth?: number
  }>
}

interface ChartOptions {
  responsive: boolean
  maintainAspectRatio: boolean
  interaction: {
    mode: string
    intersect: boolean
  }
  plugins: {
    legend: {
      position: string
      labels: {
        usePointStyle: boolean
        padding: number
        font: {
          size: number
        }
      }
    }
    tooltip: {
      backgroundColor: string
      titleColor: string
      bodyColor: string
      borderColor: string
      borderWidth: number
      cornerRadius: number
      displayColors: boolean
      callbacks?: {
        label?: (context: any) => string
      }
    }
  }
  scales: {
    x: {
      display: boolean
      title: {
        display: boolean
        text: string
        font: {
          size: number
        }
      }
      grid: {
        color: string
      }
    }
    y: {
      display: boolean
      title: {
        display: boolean
        text: string
        font: {
          size: number
        }
      }
      grid: {
        color: string
      }
      beginAtZero: boolean
    }
  }
  elements: {
    point: {
      radius: number
      hoverRadius: number
    }
    line: {
      tension: number
      borderWidth: number
    }
  }
  animation: {
    duration: number
    easing: string
  }
}

interface ChartLoaderProps {
  data: ChartData
  options: ChartOptions
  height?: number
  fallbackMessage?: string
  loadingMessage?: string
  errorMessage?: string
  onLoadError?: (error: Error) => void
}

const ChartLoader: React.FC<ChartLoaderProps> = memo(({
  data,
  options,
  height = 320,
  fallbackMessage = '暂无图表数据',
  loadingMessage = '正在加载图表...',
  errorMessage = '图表加载失败',
  onLoadError
}) => {
  const [ChartComponent, setChartComponent] = useState<React.ComponentType<any> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 使用ref来跟踪组件挂载状态，防止内存泄漏
  const isMountedRef = useRef(true)
  const chartInstanceRef = useRef<any>(null)
  const loadingTimeoutRef = useRef<NodeJS.Timeout>()

  const loadChart = useCallback(async () => {
    // 清除之前的超时
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }

    try {
      // 只有在组件仍然挂载时才更新状态
      if (!isMountedRef.current) return

      setIsLoading(true)
      setError(null)

      // 添加超时机制，防止无限加载
      const timeoutPromise = new Promise((_, reject) => {
        loadingTimeoutRef.current = setTimeout(() => {
          reject(new Error('Chart loading timeout'))
        }, 10000) // 10秒超时
      })

      const loadPromise = loadChartJS()

      const { Line } = await Promise.race([loadPromise, timeoutPromise]) as any

      // 清除超时
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }

      // 再次检查组件是否仍然挂载
      if (!isMountedRef.current) return

      setChartComponent(() => Line)
    } catch (err) {
      // 清除超时
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }

      // 只有在组件仍然挂载时才更新状态
      if (!isMountedRef.current) return

      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      onLoadError?.(err instanceof Error ? err : new Error(errorMsg))
      console.error('Failed to load Chart.js:', err)
    } finally {
      // 只有在组件仍然挂载时才更新状态
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [onLoadError])

  useEffect(() => {
    // 只有当有数据时才加载图表
    if (data.datasets.length > 0 && data.labels.length > 0) {
      loadChart()
    } else {
      setIsLoading(false)
    }
  }, [data.datasets.length, data.labels.length, loadChart])

  // 清理副作用
  useEffect(() => {
    return () => {
      isMountedRef.current = false

      // 清理超时
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }

      // 清理图表实例
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.destroy()
        } catch (err) {
          console.warn('Failed to destroy chart instance:', err)
        }
        chartInstanceRef.current = null
      }
    }
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
        style={{ height }}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-3 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{loadingMessage}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700"
        style={{ height }}
      >
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-red-500 opacity-50" />
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">{errorMessage}</p>
          <button
            onClick={loadChart}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  // Empty data state
  if (data.datasets.length === 0 || data.labels.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
        style={{ height }}
      >
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{fallbackMessage}</p>
        </div>
      </div>
    )
  }

  // Render chart
  if (ChartComponent) {
    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
        style={{ height }}
      >
        <div style={{ height: height - 32 }}>
          <ChartComponent
            data={data}
            options={options}
            ref={(ref: any) => {
              // 保存图表实例引用以便清理
              if (ref) {
                chartInstanceRef.current = ref
              }
            }}
          />
        </div>
      </div>
    )
  }

  return null
})

ChartLoader.displayName = 'ChartLoader'

export default ChartLoader
export type { ChartData, ChartOptions, ChartLoaderProps }
