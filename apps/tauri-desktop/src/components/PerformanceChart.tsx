import React, { memo, useMemo } from 'react'
import ChartLoader, { ChartData, ChartOptions } from './ChartLoader'

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

interface PerformanceChartProps {
  history: PerformanceMetrics[]
  isLoading?: boolean
}

const PerformanceChart: React.FC<PerformanceChartProps> = memo(({ history, isLoading = false }) => {
  // Memoized chart options for better performance
  const chartOptions = useMemo((): ChartOptions => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || ''
            const value = context.parsed.y

            if (label.includes('内存')) {
              return `${label}: ${value.toFixed(1)}%`
            } else if (label.includes('时间')) {
              return `${label}: ${value.toFixed(1)}ms`
            }
            return `${label}: ${value}`
          }
        }
      },
    },
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
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '数值',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        beginAtZero: true,
      },
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 6,
      },
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
    },
    animation: {
      duration: isLoading ? 0 : 750,
      easing: 'easeInOutQuart',
    },
  }), [isLoading])

  // Memoized chart data with optimized processing
  const chartData = useMemo((): ChartData => {
    if (history.length === 0) {
      return {
        labels: [],
        datasets: [],
      }
    }

    // Limit to last 20 data points for performance
    const recentHistory = history.slice(-20)

    const labels = recentHistory.map((_, index) => {
      const now = new Date()
      const time = new Date(now.getTime() - (recentHistory.length - 1 - index) * 2000)
      return time.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    })

    return {
      labels,
      datasets: [
        {
          label: '内存使用率 (%)',
          data: recentHistory.map(h => h.memoryUsage.percentage),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          borderWidth: 2,
        },
        {
          label: '渲染时间 (ms)',
          data: recentHistory.map(h => h.renderTime),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          borderWidth: 2,
        },
        {
          label: '数据库查询 (ms)',
          data: recentHistory.map(h => h.dbQueryTime),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          borderWidth: 2,
        },
      ],
    }
  }, [history])

  return (
    <div data-testid="performance-chart">
      <ChartLoader
        data={chartData}
        options={chartOptions}
        height={320}
        fallbackMessage="暂无性能数据，开始监控以查看实时性能趋势图表"
        loadingMessage="正在加载性能图表..."
        errorMessage="性能图表加载失败"
        onLoadError={(error) => {
          console.error('Performance chart load error:', error)
        }}
      />
    </div>
  )
})

PerformanceChart.displayName = 'PerformanceChart'

export default PerformanceChart
