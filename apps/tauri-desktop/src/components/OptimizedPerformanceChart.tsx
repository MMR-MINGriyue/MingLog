import React, { useMemo, useCallback } from 'react'
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

// Register Chart.js components
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
  cpuUsage?: number
  diskRead?: number
  diskWrite?: number
}

interface OptimizedPerformanceChartProps {
  data: PerformanceMetrics[]
  height?: number
  showLegend?: boolean
  showTooltips?: boolean
  animate?: boolean
  className?: string
  onDataPointClick?: (dataPoint: PerformanceMetrics, index: number) => void
}

const OptimizedPerformanceChart: React.FC<OptimizedPerformanceChartProps> = ({
  data,
  height = 300,
  showLegend = true,
  showTooltips = true,
  animate = true,
  className = '',
  onDataPointClick
}) => {
  // Memoize chart data to prevent unnecessary re-renders
  const chartData: ChartData<'line'> = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      }
    }

    const labels = data.map((_, index) => `${index + 1}`)
    
    return {
      labels,
      datasets: [
        {
          label: 'Memory Usage (%)',
          data: data.map(d => d.memoryUsage.percentage),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Render Time (ms)',
          data: data.map(d => d.renderTime),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'DB Query Time (ms)',
          data: data.map(d => d.dbQueryTime),
          borderColor: 'rgb(245, 101, 101)',
          backgroundColor: 'rgba(245, 101, 101, 0.1)',
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        ...(data.some(d => d.cpuUsage !== undefined) ? [{
          label: 'CPU Usage (%)',
          data: data.map(d => d.cpuUsage || 0),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        }] : [])
      ]
    }
  }, [data])

  // Memoize chart options
  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: animate ? {
      duration: 750,
      easing: 'easeInOutQuart'
    } : false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        enabled: showTooltips,
        mode: 'index',
        intersect: false,
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
            if (index !== undefined && data[index]) {
              return `Sample ${index + 1} - ${data[index].lastUpdate.toLocaleTimeString()}`
            }
            return ''
          },
          label: (context) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            
            if (label.includes('Memory')) {
              return `${label}: ${value.toFixed(1)}%`
            } else if (label.includes('Time')) {
              return `${label}: ${value.toFixed(2)}ms`
            } else if (label.includes('CPU')) {
              return `${label}: ${value.toFixed(1)}%`
            }
            return `${label}: ${value}`
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Sample Points',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Values',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    onClick: onDataPointClick ? (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index
        if (data[index]) {
          onDataPointClick(data[index], index)
        }
      }
    } : undefined
  }), [showLegend, showTooltips, animate, data, onDataPointClick])

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}
        style={{ height }}
        data-testid="empty-performance-chart"
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">No performance data available</p>
          <p className="text-xs mt-1">Start monitoring to see performance metrics</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`relative ${className}`} 
      style={{ height }}
      data-testid="optimized-performance-chart"
    >
      <Line data={chartData} options={chartOptions} />
    </div>
  )
}

export default OptimizedPerformanceChart
export type { PerformanceMetrics, OptimizedPerformanceChartProps }
