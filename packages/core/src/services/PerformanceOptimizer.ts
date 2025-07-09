/**
 * MingLog 性能优化器
 * 提供性能监控、分析和优化建议
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'memory' | 'timing' | 'network' | 'rendering' | 'interaction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface PerformanceBenchmark {
  name: string;
  target: number;
  warning: number;
  critical: number;
  unit: string;
  description: string;
}

export interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  category: string;
  implementation: string;
  metrics: string[];
}

export interface PerformanceReport {
  timestamp: number;
  score: number;
  metrics: PerformanceMetric[];
  benchmarks: PerformanceBenchmark[];
  suggestions: OptimizationSuggestion[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    improvementPotential: number;
  };
}

export class PerformanceOptimizer {
  private metrics: PerformanceMetric[] = [];
  private benchmarks: PerformanceBenchmark[] = [];
  private suggestions: OptimizationSuggestion[] = [];
  private isMonitoring = false;
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeBenchmarks();
    this.initializeSuggestions();
  }

  private initializeBenchmarks() {
    this.benchmarks = [
      {
        name: 'page-load-time',
        target: 2000,
        warning: 3000,
        critical: 5000,
        unit: 'ms',
        description: '页面加载时间'
      },
      {
        name: 'first-contentful-paint',
        target: 1500,
        warning: 2500,
        critical: 4000,
        unit: 'ms',
        description: '首次内容绘制时间'
      },
      {
        name: 'largest-contentful-paint',
        target: 2500,
        warning: 4000,
        critical: 6000,
        unit: 'ms',
        description: '最大内容绘制时间'
      },
      {
        name: 'cumulative-layout-shift',
        target: 0.1,
        warning: 0.25,
        critical: 0.5,
        unit: 'score',
        description: '累积布局偏移'
      },
      {
        name: 'first-input-delay',
        target: 100,
        warning: 300,
        critical: 500,
        unit: 'ms',
        description: '首次输入延迟'
      },
      {
        name: 'memory-usage',
        target: 50,
        warning: 100,
        critical: 200,
        unit: 'MB',
        description: '内存使用量'
      },
      {
        name: 'search-response-time',
        target: 100,
        warning: 300,
        critical: 1000,
        unit: 'ms',
        description: '搜索响应时间'
      },
      {
        name: 'link-creation-time',
        target: 50,
        warning: 100,
        critical: 300,
        unit: 'ms',
        description: '链接创建时间'
      }
    ];
  }

  private initializeSuggestions() {
    this.suggestions = [
      {
        id: 'enable-virtual-scrolling',
        title: '启用虚拟滚动',
        description: '对于大型列表，使用虚拟滚动可以显著提升渲染性能',
        impact: 'high',
        effort: 'medium',
        category: 'rendering',
        implementation: '使用 VirtualScrollList 组件替换普通列表',
        metrics: ['memory-usage', 'rendering-time']
      },
      {
        id: 'implement-caching',
        title: '实现智能缓存',
        description: '缓存频繁访问的数据和搜索结果',
        impact: 'high',
        effort: 'low',
        category: 'performance',
        implementation: '使用 CacheManager 缓存搜索结果和链接数据',
        metrics: ['search-response-time', 'link-creation-time']
      },
      {
        id: 'optimize-bundle-size',
        title: '优化打包体积',
        description: '减少 JavaScript 包的大小以提升加载速度',
        impact: 'medium',
        effort: 'medium',
        category: 'loading',
        implementation: '使用代码分割和懒加载',
        metrics: ['page-load-time', 'first-contentful-paint']
      },
      {
        id: 'debounce-search',
        title: '搜索防抖',
        description: '对搜索输入进行防抖处理，减少不必要的搜索请求',
        impact: 'medium',
        effort: 'low',
        category: 'interaction',
        implementation: '在搜索组件中添加防抖逻辑',
        metrics: ['search-response-time', 'network-requests']
      },
      {
        id: 'preload-critical-resources',
        title: '预加载关键资源',
        description: '预加载关键的 CSS 和 JavaScript 文件',
        impact: 'medium',
        effort: 'low',
        category: 'loading',
        implementation: '在 HTML 头部添加 preload 标签',
        metrics: ['first-contentful-paint', 'page-load-time']
      },
      {
        id: 'optimize-images',
        title: '优化图片资源',
        description: '使用现代图片格式和适当的压缩',
        impact: 'medium',
        effort: 'medium',
        category: 'loading',
        implementation: '使用 WebP 格式和响应式图片',
        metrics: ['page-load-time', 'largest-contentful-paint']
      },
      {
        id: 'implement-service-worker',
        title: '实现 Service Worker',
        description: '使用 Service Worker 缓存静态资源',
        impact: 'high',
        effort: 'high',
        category: 'loading',
        implementation: '添加 Service Worker 进行资源缓存',
        metrics: ['page-load-time', 'network-requests']
      },
      {
        id: 'optimize-database-queries',
        title: '优化数据库查询',
        description: '优化链接和搜索相关的数据库查询',
        impact: 'high',
        effort: 'medium',
        category: 'database',
        implementation: '添加索引和优化查询语句',
        metrics: ['search-response-time', 'link-creation-time']
      }
    ];
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupPerformanceObservers();
    this.startMemoryMonitoring();
    this.startInteractionMonitoring();
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  private setupPerformanceObservers() {
    if (!('PerformanceObserver' in window)) return;

    // 监控导航时间
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric({
              name: 'page-load-time',
              value: navEntry.loadEventEnd - navEntry.fetchStart,
              unit: 'ms',
              timestamp: Date.now(),
              category: 'timing',
              severity: 'medium'
            });
          }
        });
      });
      
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (error) {
      console.warn('Navigation timing observer not supported:', error);
    }

    // 监控绘制时间
    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric({
            name: entry.name.replace(/-/g, '-'),
            value: entry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
            category: 'rendering',
            severity: 'medium'
          });
        });
      });
      
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    } catch (error) {
      console.warn('Paint timing observer not supported:', error);
    }

    // 监控 LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric({
          name: 'largest-contentful-paint',
          value: lastEntry.startTime,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'rendering',
          severity: 'high'
        });
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn('LCP observer not supported:', error);
    }

    // 监控 CLS
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        
        this.recordMetric({
          name: 'cumulative-layout-shift',
          value: clsValue,
          unit: 'score',
          timestamp: Date.now(),
          category: 'rendering',
          severity: 'high'
        });
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('CLS observer not supported:', error);
    }

    // 监控 FID
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric({
            name: 'first-input-delay',
            value: (entry as any).processingStart - entry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
            category: 'interaction',
            severity: 'high'
          });
        });
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      console.warn('FID observer not supported:', error);
    }
  }

  private startMemoryMonitoring() {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      if (!this.isMonitoring) return;

      const memory = (performance as any).memory;
      if (memory) {
        this.recordMetric({
          name: 'memory-usage',
          value: memory.usedJSHeapSize / 1024 / 1024, // Convert to MB
          unit: 'MB',
          timestamp: Date.now(),
          category: 'memory',
          severity: 'medium',
          metadata: {
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          }
        });
      }

      setTimeout(checkMemory, 5000); // Check every 5 seconds
    };

    checkMemory();
  }

  private startInteractionMonitoring() {
    // 监控长任务
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.recordMetric({
              name: 'long-task',
              value: entry.duration,
              unit: 'ms',
              timestamp: Date.now(),
              category: 'interaction',
              severity: 'high',
              metadata: {
                startTime: entry.startTime
              }
            });
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }
  }

  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'> & { timestamp?: number }) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: metric.timestamp || Date.now()
    };

    this.metrics.push(fullMetric);

    // 保持最近 1000 个指标
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // 检查是否超过基准
    this.checkBenchmark(fullMetric);
  }

  private checkBenchmark(metric: PerformanceMetric) {
    const benchmark = this.benchmarks.find(b => b.name === metric.name);
    if (!benchmark) return;

    if (metric.value > benchmark.critical) {
      metric.severity = 'critical';
      console.warn(`Critical performance issue: ${metric.name} = ${metric.value}${metric.unit} (threshold: ${benchmark.critical}${benchmark.unit})`);
    } else if (metric.value > benchmark.warning) {
      metric.severity = 'high';
      console.warn(`Performance warning: ${metric.name} = ${metric.value}${metric.unit} (threshold: ${benchmark.warning}${benchmark.unit})`);
    } else if (metric.value > benchmark.target) {
      metric.severity = 'medium';
    } else {
      metric.severity = 'low';
    }
  }

  getMetrics(category?: string, timeRange?: { start: number; end: number }): PerformanceMetric[] {
    let filteredMetrics = this.metrics;

    if (category) {
      filteredMetrics = filteredMetrics.filter(m => m.category === category);
    }

    if (timeRange) {
      filteredMetrics = filteredMetrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    return filteredMetrics;
  }

  getMetricStats(metricName: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    latest: number;
  } {
    const metrics = this.metrics.filter(m => m.name === metricName);
    
    if (metrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, latest: 0 };
    }

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: metrics.length,
      avg: sum / metrics.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1]
    };
  }

  generateReport(): PerformanceReport {
    const now = Date.now();
    const recentMetrics = this.getMetrics(undefined, { start: now - 300000, end: now }); // Last 5 minutes

    // 计算性能分数
    const score = this.calculatePerformanceScore(recentMetrics);

    // 生成优化建议
    const applicableSuggestions = this.getApplicableSuggestions(recentMetrics);

    // 统计问题
    const criticalIssues = recentMetrics.filter(m => m.severity === 'critical').length;
    const totalIssues = recentMetrics.filter(m => m.severity !== 'low').length;

    return {
      timestamp: now,
      score,
      metrics: recentMetrics,
      benchmarks: this.benchmarks,
      suggestions: applicableSuggestions,
      summary: {
        totalIssues,
        criticalIssues,
        improvementPotential: Math.max(0, 100 - score)
      }
    };
  }

  private calculatePerformanceScore(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 100;

    let totalScore = 0;
    let weightSum = 0;

    // 为每个基准计算分数
    this.benchmarks.forEach(benchmark => {
      const metric = metrics.find(m => m.name === benchmark.name);
      if (!metric) return;

      let score = 100;
      const weight = this.getBenchmarkWeight(benchmark.name);

      if (metric.value > benchmark.critical) {
        score = 0;
      } else if (metric.value > benchmark.warning) {
        score = 25;
      } else if (metric.value > benchmark.target) {
        score = 75;
      }

      totalScore += score * weight;
      weightSum += weight;
    });

    return weightSum > 0 ? Math.round(totalScore / weightSum) : 100;
  }

  private getBenchmarkWeight(benchmarkName: string): number {
    const weights: Record<string, number> = {
      'page-load-time': 3,
      'first-contentful-paint': 2,
      'largest-contentful-paint': 3,
      'cumulative-layout-shift': 2,
      'first-input-delay': 2,
      'memory-usage': 1,
      'search-response-time': 2,
      'link-creation-time': 1
    };

    return weights[benchmarkName] || 1;
  }

  private getApplicableSuggestions(metrics: PerformanceMetric[]): OptimizationSuggestion[] {
    const issues = new Set<string>();

    // 根据指标确定问题
    metrics.forEach(metric => {
      if (metric.severity === 'critical' || metric.severity === 'high') {
        if (metric.name.includes('paint') || metric.name.includes('load')) {
          issues.add('loading');
        }
        if (metric.name.includes('memory')) {
          issues.add('memory');
        }
        if (metric.name.includes('search')) {
          issues.add('search');
        }
        if (metric.name.includes('interaction') || metric.name.includes('input')) {
          issues.add('interaction');
        }
      }
    });

    // 返回相关的优化建议
    return this.suggestions.filter(suggestion => 
      issues.has(suggestion.category) || 
      suggestion.metrics.some(metric => 
        metrics.some(m => m.name === metric && (m.severity === 'critical' || m.severity === 'high'))
      )
    );
  }

  clearMetrics() {
    this.metrics = [];
  }

  exportMetrics(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      metrics: this.metrics,
      benchmarks: this.benchmarks
    }, null, 2);
  }
}

export default PerformanceOptimizer;
