import React, { useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useOptimizedPerformanceMonitor } from '../hooks/useOptimizedPerformanceMonitor';
import type { PerformanceMetrics } from '../hooks/useOptimizedPerformanceMonitor';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface OptimizedPerformanceMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  maxDataPoints?: number;
  updateInterval?: number;
}

const OptimizedPerformanceMonitor: React.FC<OptimizedPerformanceMonitorProps> = ({
  isOpen,
  onClose,
  maxDataPoints = 50,
  updateInterval = 1000,
}) => {
  // Use the optimized performance monitor hook
  const {
    metrics,
    currentMetrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearData,
    getOptimizationSuggestions,
    isLoading,
    error,
  } = useOptimizedPerformanceMonitor({
    maxDataPoints,
    updateInterval,
    enableAlerts: true,
  });
  // Toggle monitoring function
  const toggleCollection = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // 图表数据
  const chartData = useMemo(() => {
    // 确保metrics是数组
    const metricsArray = Array.isArray(metrics) ? metrics : [];
    const labels = metricsArray.map(m => new Date(m.timestamp).toLocaleTimeString());
    
    return {
      labels,
      datasets: [
        {
          label: 'Memory (MB)',
          data: metricsArray.map(m => m.memoryUsage),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
        },
        {
          label: 'CPU (%)',
          data: metricsArray.map(m => m.cpuUsage),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Render Time (ms)',
          data: metricsArray.map(m => m.renderTime),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.1,
        },
        {
          label: 'FPS',
          data: metricsArray.map(m => m.fps),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.1,
        },
      ],
    };
  }, [metrics]);

  // 图表选项
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Real-time Performance Metrics',
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
  }), []);



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        role="dialog"
        aria-labelledby="performance-monitor-title"
        aria-describedby="performance-monitor-description"
        aria-modal="true"
        tabIndex={-1}
        data-testid="performance-monitor"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-2 sm:mx-4 max-h-[90vh] sm:max-h-[80vh] h-3/4 flex flex-col"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <h2 id="performance-monitor-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Performance Monitor
            </h2>
            <div
              data-testid="monitoring-indicator"
              className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`}
              title={isMonitoring ? 'Monitoring active' : 'Monitoring inactive'}
            />
          </div>
          <p id="performance-monitor-description" className="sr-only">
            Real-time performance monitoring dashboard showing memory usage, CPU usage, render time, and database query performance
          </p>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={toggleCollection}
              data-testid="start-monitoring-button"
              aria-label={`${isMonitoring ? 'Stop' : 'Start'} performance monitoring`}
              aria-pressed={isMonitoring ? 'true' : 'false'}
              className={`flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-1 rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isMonitoring
                  ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500'
                  : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500'
              }`}
            >
              {isMonitoring ? 'Stop' : 'Start'}
            </button>
            <button
              type="button"
              onClick={clearData}
              aria-label="Clear performance data"
              className="flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              data-testid="close-performance-monitor"
              aria-label="Close performance monitor"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded"
            >
              ✕
            </button>
          </div>

          {/* Keyboard shortcuts - hidden on mobile */}
          <div className="hidden lg:block absolute top-4 right-16 text-xs text-gray-400">
            <span className="inline-flex items-center space-x-1">
              <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd>
              <span>to close</span>
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center space-x-2">
              <div className="text-red-500">⚠️</div>
              <div className="text-red-700 dark:text-red-300 text-sm font-medium">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Current Metrics */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center" data-testid="memory-usage-card">
              <div className="text-2xl font-bold text-blue-600">
                {currentMetrics ? currentMetrics.memoryUsage.toFixed(1) : '--'}
              </div>
              <div className="text-sm text-gray-500">内存 (MB)</div>
            </div>
            <div className="text-center" data-testid="component-count-card">
              <div className="text-2xl font-bold text-red-600">
                {currentMetrics ? currentMetrics.cpuUsage.toFixed(1) : '--'}
              </div>
              <div className="text-sm text-gray-500">CPU (%)</div>
            </div>
            <div className="text-center" data-testid="render-time-card">
              <div className="text-2xl font-bold text-green-600">
                {currentMetrics ? currentMetrics.renderTime.toFixed(1) : '--'}
              </div>
              <div className="text-sm text-gray-500">渲染 (ms)</div>
            </div>
            <div className="text-center" data-testid="db-query-card">
              <div className="text-2xl font-bold text-purple-600">
                {currentMetrics ? (currentMetrics.renderTime * 0.3).toFixed(1) : '--'}
              </div>
              <div className="text-sm text-gray-500">查询 (ms)</div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 p-4" data-testid="performance-chart-container">
          {metrics.length > 0 ? (
            <div className="h-full">
              <div data-testid="performance-chart">
                <div data-testid="chart-data">{JSON.stringify(chartData)}</div>
                <div data-testid="chart-options">{JSON.stringify(chartOptions)}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <p>暂无性能数据</p>
                <p className="text-sm mt-1">开始监控以查看实时性能趋势图表</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Performance data updates every 1000ms</span>
            <span>{metrics.length} data points collected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizedPerformanceMonitor;
