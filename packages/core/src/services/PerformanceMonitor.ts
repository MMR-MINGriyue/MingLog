/**
 * MingLog 性能监控工具
 * 监控应用性能指标，提供性能分析和优化建议
 */

export interface PerformanceMetric {
  /** 指标名称 */
  name: string;
  /** 指标值 */
  value: number;
  /** 单位 */
  unit: string;
  /** 时间戳 */
  timestamp: number;
  /** 标签 */
  tags?: Record<string, string>;
}

export interface PerformanceReport {
  /** 报告时间 */
  timestamp: number;
  /** 时间范围 */
  timeRange: {
    start: number;
    end: number;
  };
  /** 性能指标 */
  metrics: PerformanceMetric[];
  /** 性能评分 */
  score: number;
  /** 建议 */
  recommendations: string[];
  /** 警告 */
  warnings: string[];
}

export interface PerformanceThreshold {
  /** 指标名称 */
  metric: string;
  /** 警告阈值 */
  warning: number;
  /** 错误阈值 */
  error: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private isMonitoring = false;

  constructor() {
    this.setupDefaultThresholds();
  }

  /**
   * 开始监控
   */
  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.setupObservers();
    this.startCustomMetrics();
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * 记录自定义指标
   */
  recordMetric(name: string, value: number, unit = 'ms', tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags
    };

    this.metrics.push(metric);
    this.checkThreshold(metric);
  }

  /**
   * 测量函数执行时间
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms', tags);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms', { ...tags, error: 'true' });
      throw error;
    }
  }

  /**
   * 测量同步函数执行时间
   */
  measure<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms', tags);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms', { ...tags, error: 'true' });
      throw error;
    }
  }

  /**
   * 获取性能报告
   */
  getReport(timeRange?: { start: number; end: number }): PerformanceReport {
    const now = Date.now();
    const range = timeRange || {
      start: now - 60000, // 最近1分钟
      end: now
    };

    const filteredMetrics = this.metrics.filter(
      metric => metric.timestamp >= range.start && metric.timestamp <= range.end
    );

    const score = this.calculatePerformanceScore(filteredMetrics);
    const recommendations = this.generateRecommendations(filteredMetrics);
    const warnings = this.generateWarnings(filteredMetrics);

    return {
      timestamp: now,
      timeRange: range,
      metrics: filteredMetrics,
      score,
      recommendations,
      warnings
    };
  }

  /**
   * 获取指标统计
   */
  getMetricStats(metricName: string, timeRange?: { start: number; end: number }): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const now = Date.now();
    const range = timeRange || {
      start: now - 300000, // 最近5分钟
      end: now
    };

    const values = this.metrics
      .filter(metric => 
        metric.name === metricName &&
        metric.timestamp >= range.start &&
        metric.timestamp <= range.end
      )
      .map(metric => metric.value)
      .sort((a, b) => a - b);

    if (values.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0
      };
    }

    const count = values.length;
    const min = values[0];
    const max = values[values.length - 1];
    const avg = values.reduce((sum, val) => sum + val, 0) / count;
    const p50 = this.percentile(values, 0.5);
    const p95 = this.percentile(values, 0.95);
    const p99 = this.percentile(values, 0.99);

    return { count, min, max, avg, p50, p95, p99 };
  }

  /**
   * 设置性能阈值
   */
  setThreshold(metric: string, warning: number, error: number): void {
    this.thresholds.set(metric, { metric, warning, error });
  }

  /**
   * 清理旧指标
   */
  cleanup(maxAge = 3600000): void { // 默认1小时
    const cutoff = Date.now() - maxAge;
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  /**
   * 设置默认阈值
   */
  private setupDefaultThresholds(): void {
    this.setThreshold('search-time', 200, 1000);
    this.setThreshold('render-time', 16, 100);
    this.setThreshold('memory-usage', 50 * 1024 * 1024, 100 * 1024 * 1024);
    this.setThreshold('bundle-size', 1024 * 1024, 5 * 1024 * 1024);
  }

  /**
   * 设置性能观察器
   */
  private setupObservers(): void {
    // 导航时间观察器
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordNavigationMetrics(navEntry);
            }
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        console.warn('Navigation observer not supported:', error);
      }

      // 资源加载观察器
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              this.recordResourceMetrics(resourceEntry);
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }

      // 长任务观察器
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask') {
              this.recordMetric('long-task', entry.duration, 'ms', {
                startTime: entry.startTime.toString()
              });
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }
  }

  /**
   * 开始自定义指标收集
   */
  private startCustomMetrics(): void {
    // 内存使用监控
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.recordMetric('memory-used', memory.usedJSHeapSize, 'bytes');
        this.recordMetric('memory-total', memory.totalJSHeapSize, 'bytes');
        this.recordMetric('memory-limit', memory.jsHeapSizeLimit, 'bytes');
      }
    }, 5000);

    // FPS监控
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.recordMetric('fps', fps, 'fps');
        frameCount = 0;
        lastTime = currentTime;
      }
      
      if (this.isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };
    
    requestAnimationFrame(measureFPS);
  }

  /**
   * 记录导航指标
   */
  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
    this.recordMetric('dns-lookup', entry.domainLookupEnd - entry.domainLookupStart, 'ms');
    this.recordMetric('tcp-connect', entry.connectEnd - entry.connectStart, 'ms');
    this.recordMetric('request-response', entry.responseEnd - entry.requestStart, 'ms');
    this.recordMetric('dom-parse', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart, 'ms');
    this.recordMetric('page-load', entry.loadEventEnd - entry.loadEventStart, 'ms');
    this.recordMetric('total-load-time', entry.loadEventEnd - entry.startTime, 'ms');
  }

  /**
   * 记录资源指标
   */
  private recordResourceMetrics(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.startTime;
    const size = entry.transferSize || 0;
    
    this.recordMetric('resource-load-time', duration, 'ms', {
      resource: entry.name,
      type: this.getResourceType(entry.name)
    });
    
    if (size > 0) {
      this.recordMetric('resource-size', size, 'bytes', {
        resource: entry.name,
        type: this.getResourceType(entry.name)
      });
    }
  }

  /**
   * 获取资源类型
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  /**
   * 检查阈值
   */
  private checkThreshold(metric: PerformanceMetric): void {
    const threshold = this.thresholds.get(metric.name);
    if (!threshold) return;

    if (metric.value > threshold.error) {
      console.error(`Performance error: ${metric.name} = ${metric.value}${metric.unit} (threshold: ${threshold.error}${metric.unit})`);
    } else if (metric.value > threshold.warning) {
      console.warn(`Performance warning: ${metric.name} = ${metric.value}${metric.unit} (threshold: ${threshold.warning}${metric.unit})`);
    }
  }

  /**
   * 计算性能评分
   */
  private calculatePerformanceScore(metrics: PerformanceMetric[]): number {
    // 简化的评分算法
    let score = 100;
    
    for (const metric of metrics) {
      const threshold = this.thresholds.get(metric.name);
      if (threshold) {
        if (metric.value > threshold.error) {
          score -= 20;
        } else if (metric.value > threshold.warning) {
          score -= 10;
        }
      }
    }
    
    return Math.max(0, score);
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = [];
    
    // 分析搜索性能
    const searchMetrics = metrics.filter(m => m.name === 'search-time');
    if (searchMetrics.length > 0) {
      const avgSearchTime = searchMetrics.reduce((sum, m) => sum + m.value, 0) / searchMetrics.length;
      if (avgSearchTime > 500) {
        recommendations.push('考虑优化搜索算法或使用Web Worker进行后台搜索');
      }
    }
    
    // 分析内存使用
    const memoryMetrics = metrics.filter(m => m.name === 'memory-used');
    if (memoryMetrics.length > 0) {
      const maxMemory = Math.max(...memoryMetrics.map(m => m.value));
      if (maxMemory > 50 * 1024 * 1024) {
        recommendations.push('内存使用较高，考虑实现虚拟滚动或数据分页');
      }
    }
    
    return recommendations;
  }

  /**
   * 生成警告
   */
  private generateWarnings(metrics: PerformanceMetric[]): string[] {
    const warnings: string[] = [];
    
    for (const metric of metrics) {
      const threshold = this.thresholds.get(metric.name);
      if (threshold && metric.value > threshold.warning) {
        warnings.push(`${metric.name} 超过警告阈值: ${metric.value}${metric.unit}`);
      }
    }
    
    return warnings;
  }

  /**
   * 计算百分位数
   */
  private percentile(values: number[], p: number): number {
    const index = Math.ceil(values.length * p) - 1;
    return values[Math.max(0, index)];
  }
}

export default PerformanceMonitor;
