import { useState, useEffect, useCallback, useRef } from 'react';

export interface PerformanceMetrics {
  timestamp: number;
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  fps: number;
  domNodes: number;
  eventListeners: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
}

export interface UseVirtualizedPerformanceMonitorOptions {
  maxDataPoints?: number;
  updateInterval?: number;
  enableAlerts?: boolean;
  thresholds?: {
    memoryUsage?: number;
    cpuUsage?: number;
    renderTime?: number;
    fps?: number;
  };
}

export interface UseVirtualizedPerformanceMonitorReturn {
  metrics: PerformanceMetrics[];
  currentMetrics: PerformanceMetrics | null;
  alerts: PerformanceAlert[];
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearData: () => void;
  clearAlerts: () => void;
  exportData: () => string;
  getAverageMetrics: () => Partial<PerformanceMetrics>;
  getPerformanceScore: () => number;
}

const DEFAULT_THRESHOLDS = {
  memoryUsage: 100, // MB
  cpuUsage: 80, // %
  renderTime: 16, // ms (60fps)
  fps: 30, // minimum fps
};

export const useVirtualizedPerformanceMonitor = (
  options: UseVirtualizedPerformanceMonitorOptions = {}
): UseVirtualizedPerformanceMonitorReturn => {
  const {
    maxDataPoints = 100,
    updateInterval = 1000,
    enableAlerts = true,
    thresholds = DEFAULT_THRESHOLDS,
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(performance.now());
  const frameCount = useRef<number>(0);
  const fpsHistory = useRef<number[]>([]);

  // FPS calculation
  const calculateFPS = useCallback(() => {
    const now = performance.now();
    const delta = now - lastFrameTime.current;
    
    if (delta >= 1000) {
      const fps = (frameCount.current * 1000) / delta;
      fpsHistory.current.push(fps);
      
      if (fpsHistory.current.length > 10) {
        fpsHistory.current.shift();
      }
      
      frameCount.current = 0;
      lastFrameTime.current = now;
      
      return fpsHistory.current.reduce((sum, f) => sum + f, 0) / fpsHistory.current.length;
    }
    
    frameCount.current++;
    return fpsHistory.current[fpsHistory.current.length - 1] || 60;
  }, []);

  // Collect performance metrics
  const collectMetrics = useCallback((): PerformanceMetrics => {
    const now = performance.now();
    
    // Memory usage (if available)
    const memoryInfo = (performance as any).memory;
    const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;
    
    // CPU usage estimation (simplified)
    const cpuUsage = Math.min(100, Math.random() * 20 + 10); // Placeholder
    
    // Render time estimation
    const renderTime = performance.now() - now;
    
    // FPS calculation
    const fps = calculateFPS();
    
    // DOM metrics
    const domNodes = document.querySelectorAll('*').length;
    const eventListeners = (window as any).getEventListeners ? 
      Object.keys((window as any).getEventListeners(document)).length : 0;

    return {
      timestamp: Date.now(),
      memoryUsage,
      cpuUsage,
      renderTime: Math.max(0, renderTime),
      fps,
      domNodes,
      eventListeners,
    };
  }, [calculateFPS]);

  // Check thresholds and create alerts
  const checkThresholds = useCallback((metric: PerformanceMetrics) => {
    if (!enableAlerts) return;

    const checks = [
      {
        key: 'memoryUsage' as const,
        value: metric.memoryUsage,
        threshold: thresholds.memoryUsage || DEFAULT_THRESHOLDS.memoryUsage,
        message: `High memory usage: ${metric.memoryUsage.toFixed(1)}MB`,
      },
      {
        key: 'cpuUsage' as const,
        value: metric.cpuUsage,
        threshold: thresholds.cpuUsage || DEFAULT_THRESHOLDS.cpuUsage,
        message: `High CPU usage: ${metric.cpuUsage.toFixed(1)}%`,
      },
      {
        key: 'renderTime' as const,
        value: metric.renderTime,
        threshold: thresholds.renderTime || DEFAULT_THRESHOLDS.renderTime,
        message: `Slow render time: ${metric.renderTime.toFixed(1)}ms`,
      },
      {
        key: 'fps' as const,
        value: metric.fps,
        threshold: thresholds.fps || DEFAULT_THRESHOLDS.fps,
        message: `Low FPS: ${metric.fps.toFixed(0)}`,
        isLowThreshold: true,
      },
    ];

    checks.forEach(({ key, value, threshold, message, isLowThreshold }) => {
      const isAlert = isLowThreshold ? value < threshold : value > threshold;
      
      if (isAlert) {
        const alert: PerformanceAlert = {
          id: `${key}-${Date.now()}`,
          type: value > threshold * 1.5 ? 'error' : 'warning',
          message,
          timestamp: Date.now(),
          metric: key,
          value,
          threshold,
        };

        setAlerts(prev => {
          // Avoid duplicate alerts for the same metric within 5 seconds
          const recentAlert = prev.find(a => 
            a.metric === key && 
            Date.now() - a.timestamp < 5000
          );
          
          if (recentAlert) return prev;
          
          return [...prev.slice(-19), alert]; // Keep last 20 alerts
        });
      }
    });
  }, [enableAlerts, thresholds]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    
    const updateMetrics = () => {
      const newMetric = collectMetrics();
      
      setMetrics(prev => {
        const updated = [...prev, newMetric];
        return updated.slice(-maxDataPoints);
      });
      
      checkThresholds(newMetric);
    };

    // Initial collection
    updateMetrics();
    
    // Set up interval
    intervalRef.current = setInterval(updateMetrics, updateInterval);
    
    // Set up FPS monitoring
    const fpsLoop = () => {
      calculateFPS();
      if (isMonitoring) {
        frameRef.current = requestAnimationFrame(fpsLoop);
      }
    };
    frameRef.current = requestAnimationFrame(fpsLoop);
  }, [isMonitoring, collectMetrics, checkThresholds, maxDataPoints, updateInterval, calculateFPS]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  // Clear data
  const clearData = useCallback(() => {
    setMetrics([]);
  }, []);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Export data as JSON
  const exportData = useCallback(() => {
    const data = {
      metrics,
      alerts,
      exportTime: new Date().toISOString(),
      summary: getAverageMetrics(),
    };
    return JSON.stringify(data, null, 2);
  }, [metrics, alerts]);

  // Get average metrics
  const getAverageMetrics = useCallback((): Partial<PerformanceMetrics> => {
    if (metrics.length === 0) return {};

    const sums = metrics.reduce(
      (acc, metric) => ({
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        cpuUsage: acc.cpuUsage + metric.cpuUsage,
        renderTime: acc.renderTime + metric.renderTime,
        fps: acc.fps + metric.fps,
        domNodes: acc.domNodes + metric.domNodes,
        eventListeners: acc.eventListeners + metric.eventListeners,
      }),
      { memoryUsage: 0, cpuUsage: 0, renderTime: 0, fps: 0, domNodes: 0, eventListeners: 0 }
    );

    const count = metrics.length;
    return {
      memoryUsage: sums.memoryUsage / count,
      cpuUsage: sums.cpuUsage / count,
      renderTime: sums.renderTime / count,
      fps: sums.fps / count,
      domNodes: sums.domNodes / count,
      eventListeners: sums.eventListeners / count,
    };
  }, [metrics]);

  // Calculate performance score (0-100)
  const getPerformanceScore = useCallback((): number => {
    if (metrics.length === 0) return 100;

    const avg = getAverageMetrics();
    let score = 100;

    // Memory score (0-25 points)
    if (avg.memoryUsage) {
      score -= Math.min(25, (avg.memoryUsage / 200) * 25);
    }

    // CPU score (0-25 points)
    if (avg.cpuUsage) {
      score -= Math.min(25, (avg.cpuUsage / 100) * 25);
    }

    // Render time score (0-25 points)
    if (avg.renderTime) {
      score -= Math.min(25, (avg.renderTime / 32) * 25);
    }

    // FPS score (0-25 points)
    if (avg.fps) {
      score -= Math.min(25, Math.max(0, (60 - avg.fps) / 60) * 25);
    }

    return Math.max(0, Math.round(score));
  }, [metrics, getAverageMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  const currentMetrics = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  return {
    metrics,
    currentMetrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearData,
    clearAlerts,
    exportData,
    getAverageMetrics,
    getPerformanceScore,
  };
};
