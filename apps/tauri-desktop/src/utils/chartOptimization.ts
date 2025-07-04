// Chart.js 性能优化工具
import type { ChartOptions, ChartData } from 'chart.js'

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

// 数据采样策略
export const sampleChartData = (
  data: PerformanceMetrics[], 
  maxPoints: number = 50,
  strategy: 'uniform' | 'adaptive' | 'peak' = 'adaptive'
): PerformanceMetrics[] => {
  if (data.length <= maxPoints) return data

  switch (strategy) {
    case 'uniform':
      return uniformSampling(data, maxPoints)
    case 'adaptive':
      return adaptiveSampling(data, maxPoints)
    case 'peak':
      return peakSampling(data, maxPoints)
    default:
      return uniformSampling(data, maxPoints)
  }
}

// 均匀采样
const uniformSampling = (data: PerformanceMetrics[], maxPoints: number): PerformanceMetrics[] => {
  const step = Math.ceil(data.length / maxPoints)
  const sampled: PerformanceMetrics[] = []
  
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i])
  }
  
  return sampled
}

// 自适应采样 - 保留重要的数据点
const adaptiveSampling = (data: PerformanceMetrics[], maxPoints: number): PerformanceMetrics[] => {
  if (data.length <= maxPoints) return data

  const sampled: PerformanceMetrics[] = [data[0]] // 始终保留第一个点
  const threshold = calculateVarianceThreshold(data)
  
  for (let i = 1; i < data.length - 1; i++) {
    const current = data[i]
    const previous = data[i - 1]
    
    // 计算变化率
    const memoryChange = Math.abs(current.memoryUsage.percentage - previous.memoryUsage.percentage)
    const renderChange = Math.abs(current.renderTime - previous.renderTime)
    const dbChange = Math.abs(current.dbQueryTime - previous.dbQueryTime)
    
    const totalChange = memoryChange + renderChange + dbChange
    
    // 如果变化超过阈值，保留这个点
    if (totalChange > threshold || sampled.length < maxPoints - 1) {
      sampled.push(current)
    }
    
    if (sampled.length >= maxPoints - 1) break
  }
  
  // 始终保留最后一个点
  if (data.length > 1) {
    sampled.push(data[data.length - 1])
  }
  
  return sampled
}

// 峰值采样 - 保留峰值和谷值
const peakSampling = (data: PerformanceMetrics[], maxPoints: number): PerformanceMetrics[] => {
  if (data.length <= maxPoints) return data

  const peaks: { index: number; value: number }[] = []
  
  // 找到所有峰值和谷值
  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1].memoryUsage.percentage
    const curr = data[i].memoryUsage.percentage
    const next = data[i + 1].memoryUsage.percentage
    
    // 峰值或谷值
    if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
      peaks.push({ index: i, value: curr })
    }
  }
  
  // 按重要性排序并选择前N个
  peaks.sort((a, b) => Math.abs(b.value - 50) - Math.abs(a.value - 50))
  const selectedIndices = peaks.slice(0, maxPoints - 2).map(p => p.index)
  selectedIndices.sort((a, b) => a - b)
  
  // 添加首尾点
  const result = [data[0]]
  selectedIndices.forEach(index => result.push(data[index]))
  result.push(data[data.length - 1])
  
  return result
}

// 计算变化阈值
const calculateVarianceThreshold = (data: PerformanceMetrics[]): number => {
  if (data.length < 2) return 0

  const changes: number[] = []
  
  for (let i = 1; i < data.length; i++) {
    const current = data[i]
    const previous = data[i - 1]
    
    const memoryChange = Math.abs(current.memoryUsage.percentage - previous.memoryUsage.percentage)
    const renderChange = Math.abs(current.renderTime - previous.renderTime)
    const dbChange = Math.abs(current.dbQueryTime - previous.dbQueryTime)
    
    changes.push(memoryChange + renderChange + dbChange)
  }
  
  // 返回平均变化的1.5倍作为阈值
  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length
  return avgChange * 1.5
}

// 优化的Chart.js配置生成器
export const createOptimizedChartOptions = (
  enableAnimation: boolean = true,
  enableTooltips: boolean = true,
  enableLegend: boolean = true,
  maxDataPoints: number = 50
): ChartOptions => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    
    // 性能优化配置
    parsing: false, // 禁用数据解析以提升性能
    normalized: true, // 启用数据标准化
    spanGaps: true, // 跨越数据间隙
    
    // 动画配置
    animation: enableAnimation ? {
      duration: 750,
      easing: 'easeInOutQuart',
    } : false,
    
    // 交互配置
    interaction: {
      mode: 'index',
      intersect: false,
    },
    
    // 插件配置
    plugins: {
      legend: {
        display: enableLegend,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        enabled: enableTooltips,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context) => {
            const index = context[0]?.dataIndex
            if (index !== undefined) {
              return `数据点 ${index + 1}`
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
        },
      },
    },
    
    // 坐标轴配置
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '时间',
          font: {
            size: 12,
          },
        },
        ticks: {
          maxTicksLimit: Math.min(maxDataPoints / 5, 10), // 限制X轴标签数量
          font: {
            size: 10,
          },
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: '数值',
          font: {
            size: 12,
          },
        },
        ticks: {
          font: {
            size: 10,
          },
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    
    // 元素配置
    elements: {
      point: {
        radius: maxDataPoints > 30 ? 0 : 3, // 数据点多时隐藏点
        hoverRadius: 6,
      },
      line: {
        borderJoinStyle: 'round',
        tension: 0.4,
      },
    },
  } as ChartOptions
}

// 数据压缩工具
export const compressChartData = (
  data: ChartData,
  compressionRatio: number = 0.7
): ChartData => {
  const originalLength = data.labels?.length || 0
  const targetLength = Math.floor(originalLength * compressionRatio)
  
  if (originalLength <= targetLength) return data

  const step = Math.ceil(originalLength / targetLength)
  const compressedLabels: string[] = []
  const compressedDatasets = data.datasets.map(dataset => ({
    ...dataset,
    data: [] as number[]
  }))

  for (let i = 0; i < originalLength; i += step) {
    compressedLabels.push(data.labels?.[i] as string || '')
    
    data.datasets.forEach((dataset, datasetIndex) => {
      compressedDatasets[datasetIndex].data.push(dataset.data[i] as number || 0)
    })
  }

  return {
    labels: compressedLabels,
    datasets: compressedDatasets
  }
}

// 性能监控工具
export const measureChartPerformance = () => {
  const startTime = performance.now()
  
  return {
    end: () => {
      const endTime = performance.now()
      return endTime - startTime
    }
  }
}

// 内存使用监控
export const getChartMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    }
  }
  return null
}
