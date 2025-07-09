import { useVirtualizedPerformanceMonitor } from './useVirtualizedPerformanceMonitor';
import { useEffect, useCallback } from 'react';
import type {
  PerformanceMetrics as VirtualizedPerformanceMetrics,
  PerformanceAlert,
  UseVirtualizedPerformanceMonitorOptions,
  UseVirtualizedPerformanceMonitorReturn
} from './useVirtualizedPerformanceMonitor';

// Re-export types for compatibility
export type PerformanceMetrics = VirtualizedPerformanceMetrics;
export type { PerformanceAlert };

// Extended interface for optimized performance monitoring
export interface OptimizedPerformanceMetrics extends VirtualizedPerformanceMetrics {
  queryTime?: number;
  networkLatency?: number;
}

export interface UseOptimizedPerformanceMonitorOptions extends UseVirtualizedPerformanceMonitorOptions {
  enableNetworkMonitoring?: boolean;
  enableQueryTimeTracking?: boolean;
}

export interface UseOptimizedPerformanceMonitorReturn extends UseVirtualizedPerformanceMonitorReturn {
  // Additional optimized features
  isLoading?: boolean;
  error?: string | null;
  history: PerformanceMetrics[];
  getOptimizationSuggestions: () => string[];
  clearHistory: () => void;
}

/**
 * Optimized Performance Monitor Hook
 * 
 * This is an enhanced version of useVirtualizedPerformanceMonitor with additional
 * optimization features and better error handling.
 * 
 * Features:
 * - Real-time performance monitoring
 * - Intelligent alerting system
 * - Performance optimization suggestions
 * - Data export capabilities
 * - Virtualized data handling for large datasets
 */
export const useOptimizedPerformanceMonitor = (
  options: UseOptimizedPerformanceMonitorOptions = {}
): UseOptimizedPerformanceMonitorReturn => {
  const {
    enableNetworkMonitoring = false,
    enableQueryTimeTracking = false,
    ...virtualizedOptions
  } = options;

  // Use the base virtualized performance monitor
  const baseMonitor = useVirtualizedPerformanceMonitor(virtualizedOptions);

  // Additional state for optimized features
  const isLoading = false; // Can be enhanced based on monitoring state
  const error = null; // Can be enhanced with error handling

  // Call Tauri performance monitoring commands when monitoring starts
  const callTauriPerformanceCommands = useCallback(async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');

      // Call system info and database performance commands
      await Promise.all([
        invoke('get_system_info'),
        invoke('measure_db_performance')
      ]);
    } catch (error) {
      console.warn('Failed to call Tauri performance commands:', error);
    }
  }, []);

  // Call Tauri commands when monitoring starts
  useEffect(() => {
    if (baseMonitor.isMonitoring) {
      callTauriPerformanceCommands();
    }
  }, [baseMonitor.isMonitoring, callTauriPerformanceCommands]);

  // Get optimization suggestions based on current metrics
  const getOptimizationSuggestions = (): string[] => {
    const suggestions: string[] = [];
    const { currentMetrics } = baseMonitor;

    if (!currentMetrics) {
      return ['Start monitoring to get optimization suggestions'];
    }

    // Memory optimization suggestions
    if (currentMetrics.memoryUsage > 100) {
      suggestions.push('Consider reducing memory usage by optimizing data structures');
      suggestions.push('Check for memory leaks in event listeners or timers');
    }

    // CPU optimization suggestions
    if (currentMetrics.cpuUsage > 70) {
      suggestions.push('High CPU usage detected - consider optimizing heavy computations');
      suggestions.push('Use Web Workers for intensive tasks');
    }

    // Render time optimization suggestions
    if (currentMetrics.renderTime > 16) {
      suggestions.push('Render time is above 16ms - consider using React.memo or useMemo');
      suggestions.push('Implement virtualization for large lists');
    }

    // FPS optimization suggestions
    if (currentMetrics.fps < 30) {
      suggestions.push('Low FPS detected - reduce DOM manipulations');
      suggestions.push('Use CSS transforms instead of changing layout properties');
    }

    // DOM optimization suggestions
    if (currentMetrics.domNodes > 1000) {
      suggestions.push('High DOM node count - consider component virtualization');
      suggestions.push('Remove unused DOM elements and optimize component structure');
    }

    if (suggestions.length === 0) {
      suggestions.push('Performance looks good! Keep up the excellent work.');
    }

    return suggestions;
  };

  // Clear history (alias for clearData)
  const clearHistory = baseMonitor.clearData;

  return {
    ...baseMonitor,
    isLoading,
    error,
    history: baseMonitor.metrics, // Alias for compatibility
    getOptimizationSuggestions,
    clearHistory,
  };
};

// Default export for convenience
export default useOptimizedPerformanceMonitor;
