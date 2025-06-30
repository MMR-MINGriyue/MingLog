import React, { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

interface Bottleneck {
  is_bottleneck: boolean
  usage: number
  threshold: number
}

interface IOBottleneck extends Bottleneck {
  read_bytes: number
  write_bytes: number
}

interface PerformanceData {
  bottlenecks: {
    cpu: Bottleneck
    memory: Bottleneck
    io: IOBottleneck
  }
  recommendations: Array<{
    type: 'cpu' | 'memory' | 'io' | 'none'
    severity: 'high' | 'low'
    message: string
  }>
}

const PerformanceOptimizer: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const analyzePerformance = async () => {
      try {
        setIsLoading(true)
        const data = await invoke<PerformanceData>('analyze_performance_bottlenecks')
        setPerformanceData(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : '性能分析失败')
      } finally {
        setIsLoading(false)
      }
    }

    analyzePerformance()
    const interval = setInterval(analyzePerformance, 30000) // 每30秒更新一次

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-error-50 text-error-700 rounded-lg">
        <div className="flex items-center">
          <XCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!performanceData) {
    return null
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-error-600 bg-error-50'
      case 'low':
        return 'text-success-600 bg-success-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getBottleneckIcon = (isBottleneck: boolean) => {
    return isBottleneck ? (
      <AlertTriangle className="w-5 h-5 text-error-600" />
    ) : (
      <CheckCircle className="w-5 h-5 text-success-600" />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPU 状态 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">CPU 状态</h3>
            {getBottleneckIcon(performanceData.bottlenecks.cpu.is_bottleneck)}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">使用率</span>
              <span className="font-medium">{performanceData.bottlenecks.cpu.usage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  performanceData.bottlenecks.cpu.is_bottleneck
                    ? 'bg-error-600'
                    : 'bg-success-600'
                }`}
                style={{ width: `${performanceData.bottlenecks.cpu.usage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 内存状态 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">内存状态</h3>
            {getBottleneckIcon(performanceData.bottlenecks.memory.is_bottleneck)}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">使用率</span>
              <span className="font-medium">{performanceData.bottlenecks.memory.usage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  performanceData.bottlenecks.memory.is_bottleneck
                    ? 'bg-error-600'
                    : 'bg-success-600'
                }`}
                style={{ width: `${performanceData.bottlenecks.memory.usage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* I/O 状态 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">I/O 状态</h3>
            {getBottleneckIcon(performanceData.bottlenecks.io.is_bottleneck)}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">读取</span>
              <span className="font-medium">
                {(performanceData.bottlenecks.io.read_bytes / 1024 / 1024).toFixed(2)} MB/s
              </span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">写入</span>
              <span className="font-medium">
                {(performanceData.bottlenecks.io.write_bytes / 1024 / 1024).toFixed(2)} MB/s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 优化建议 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-4">性能优化建议</h3>
        <div className="space-y-4">
          {performanceData.recommendations.map((recommendation, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg flex items-start ${getSeverityColor(
                recommendation.severity
              )}`}
            >
              <Info className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium mb-1">
                  {recommendation.type === 'none'
                    ? '系统状态良好'
                    : `${recommendation.type.toUpperCase()} 性能问题`}
                </div>
                <p className="text-sm">{recommendation.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PerformanceOptimizer 