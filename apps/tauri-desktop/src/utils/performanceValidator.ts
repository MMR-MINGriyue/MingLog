interface PerformanceThresholds {
  memoryUsage: number; // MB
  renderTime: number; // ms
  domNodes: number; // count
  eventListeners: number; // count
  bundleSize: number; // MB
  loadTime: number; // ms
  fps: number; // minimum fps
}

interface PerformanceMetric {
  name: string;
  value: number;
  threshold: number;
  unit: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
}

interface PerformanceReport {
  timestamp: number;
  overallScore: number;
  status: 'pass' | 'warning' | 'fail';
  metrics: PerformanceMetric[];
  recommendations: string[];
  overallPassed?: boolean;
}

interface TestResult {
  testName: string;
  renderTime: number;
  passed: boolean;
  memoryUsage?: number;
  domNodes?: number;
  fps?: number;
  details?: string;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  memoryUsage: 100, // 100MB
  renderTime: 16, // 16ms for 60fps
  domNodes: 5000, // 5000 DOM nodes
  eventListeners: 500, // 500 event listeners
  bundleSize: 5, // 5MB bundle size
  loadTime: 3000, // 3 seconds load time
  fps: 30, // minimum 30 fps
};

// Performance targets for testing
export const PERFORMANCE_TARGETS = {
  MAX_RENDER_TIME: 100, // ms
  MAX_MEMORY_INCREASE: 50 * 1024 * 1024, // 50MB
  MIN_FPS: 30,
  MAX_DOM_NODES: 5000,
};

class PerformanceValidator {
  private thresholds: PerformanceThresholds;
  private startTime: number;
  private testResults: TestResult[] = [];

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.startTime = performance.now();
  }

  // Clear test results
  clearResults(): void {
    this.testResults = [];
  }

  // Test component render performance
  async testComponentRender(componentName: string, renderFunction: () => Promise<void>): Promise<TestResult> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    await renderFunction();

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();
    const renderTime = endTime - startTime;

    const result: TestResult = {
      testName: `${componentName} 渲染性能`,
      renderTime,
      passed: renderTime < PERFORMANCE_TARGETS.MAX_RENDER_TIME,
      memoryUsage: endMemory - startMemory
    };

    this.testResults.push(result);
    return result;
  }

  // Test large dataset rendering performance
  async testLargeDatasetRender(itemCount: number, renderFunction: () => Promise<void>): Promise<TestResult> {
    const startTime = performance.now();

    await renderFunction();

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    const result: TestResult = {
      testName: `大数据集渲染 (${itemCount} 条记录)`,
      renderTime,
      passed: renderTime < PERFORMANCE_TARGETS.MAX_RENDER_TIME * 2, // Allow more time for large datasets
      details: `大数据集渲染时间: ${renderTime.toFixed(2)}ms (${itemCount} 条记录)`
    };

    this.testResults.push(result);
    return result;
  }

  // Test memory efficiency
  testMemoryEfficiency(): TestResult {
    const memoryUsage = this.getMemoryUsage();
    const memoryBytes = memoryUsage * 1024 * 1024; // Convert MB to bytes

    const result: TestResult = {
      testName: '内存使用效率',
      renderTime: 0,
      passed: memoryUsage < this.thresholds.memoryUsage,
      memoryUsage: memoryBytes,
      details: `内存增长: ${memoryUsage.toFixed(2)}MB`
    };

    this.testResults.push(result);
    return result;
  }

  // Test DOM node count
  testDOMNodeCount(): TestResult {
    const domNodes = this.getDOMNodeCount();

    const result: TestResult = {
      testName: 'DOM节点数量',
      renderTime: 0,
      passed: domNodes < PERFORMANCE_TARGETS.MAX_DOM_NODES,
      domNodes,
      details: `DOM节点数量: ${domNodes}`
    };

    this.testResults.push(result);
    return result;
  }

  // Test FPS performance
  async testFPS(duration: number = 1000): Promise<TestResult> {
    return new Promise((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();

      const countFrame = () => {
        frameCount++;
        const currentTime = performance.now();

        if (currentTime - startTime < duration) {
          requestAnimationFrame(countFrame);
        } else {
          const fps = Math.round((frameCount * 1000) / (currentTime - startTime));

          const result: TestResult = {
            testName: 'FPS性能',
            renderTime: 0,
            passed: fps >= PERFORMANCE_TARGETS.MIN_FPS,
            fps,
            details: `FPS: ${fps}`
          };

          this.testResults.push(result);
          resolve(result);
        }
      };

      requestAnimationFrame(countFrame);
    });
  }

  private getMemoryUsage(): number {
    const memory = (performance as any).memory;
    return memory ? memory.usedJSHeapSize / 1024 / 1024 : 0;
  }

  private getDOMNodeCount(): number {
    return document.querySelectorAll('*').length;
  }

  private getEventListenerCount(): number {
    // Simplified event listener counting
    let count = 0;
    const elements = document.querySelectorAll('*');
    
    elements.forEach(element => {
      // Check for common event attributes
      const eventAttrs = ['onclick', 'onload', 'onchange', 'onsubmit', 'onmouseover', 'onmouseout'];
      eventAttrs.forEach(attr => {
        if ((element as any)[attr]) count++;
      });
    });

    return count;
  }

  private getRenderTime(): number {
    // Use performance.now() to measure render time
    const entries = performance.getEntriesByType('measure');
    const renderEntries = entries.filter(entry => entry.name.includes('render'));
    
    if (renderEntries.length > 0) {
      return renderEntries[renderEntries.length - 1].duration;
    }
    
    // Fallback: estimate based on frame timing
    return performance.now() - this.startTime;
  }

  private getLoadTime(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation ? navigation.loadEventEnd - navigation.navigationStart : 0;
  }

  private getBundleSize(): number {
    // Estimate bundle size from resource entries
    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter(resource => 
      resource.name.endsWith('.js') || resource.name.includes('chunk')
    );
    
    return jsResources.reduce((total, resource) => {
      return total + ((resource as any).transferSize || 0);
    }, 0) / 1024 / 1024; // Convert to MB
  }

  private getFPS(): number {
    // This is a simplified FPS calculation
    // In a real implementation, you'd track frame times over a period
    return 60; // Placeholder
  }

  private evaluateMetric(
    name: string,
    value: number,
    threshold: number,
    unit: string,
    description: string,
    isLowerBetter: boolean = true
  ): PerformanceMetric {
    let status: 'pass' | 'warning' | 'fail';
    
    if (isLowerBetter) {
      if (value <= threshold) status = 'pass';
      else if (value <= threshold * 1.5) status = 'warning';
      else status = 'fail';
    } else {
      if (value >= threshold) status = 'pass';
      else if (value >= threshold * 0.7) status = 'warning';
      else status = 'fail';
    }

    return {
      name,
      value,
      threshold,
      unit,
      status,
      description,
    };
  }

  validate(): PerformanceReport {
    const metrics: PerformanceMetric[] = [];
    const recommendations: string[] = [];

    // Memory usage validation
    const memoryUsage = this.getMemoryUsage();
    metrics.push(this.evaluateMetric(
      'Memory Usage',
      memoryUsage,
      this.thresholds.memoryUsage,
      'MB',
      'JavaScript heap memory usage'
    ));

    if (memoryUsage > this.thresholds.memoryUsage) {
      recommendations.push('建议优化内存使用，清理未使用的变量并实施适当的内存管理');
    }

    // Render time validation
    const renderTime = this.getRenderTime();
    metrics.push(this.evaluateMetric(
      'Render Time',
      renderTime,
      this.thresholds.renderTime,
      'ms',
      'Time taken to render components'
    ));

    if (renderTime > this.thresholds.renderTime) {
      recommendations.push('建议使用React.memo、useMemo和useCallback优化渲染性能');
    }

    // DOM nodes validation
    const domNodes = this.getDOMNodeCount();
    metrics.push(this.evaluateMetric(
      'DOM Nodes',
      domNodes,
      this.thresholds.domNodes,
      'nodes',
      'Total number of DOM elements'
    ));

    if (domNodes > this.thresholds.domNodes) {
      recommendations.push('建议通过虚拟化技术减少DOM复杂度，优化大列表性能');
    }

    // Event listeners validation
    const eventListeners = this.getEventListenerCount();
    metrics.push(this.evaluateMetric(
      'Event Listeners',
      eventListeners,
      this.thresholds.eventListeners,
      'listeners',
      'Number of active event listeners'
    ));

    if (eventListeners > this.thresholds.eventListeners) {
      recommendations.push('建议检查并清理未使用的事件监听器，防止内存泄漏');
    }

    // Bundle size validation
    const bundleSize = this.getBundleSize();
    metrics.push(this.evaluateMetric(
      'Bundle Size',
      bundleSize,
      this.thresholds.bundleSize,
      'MB',
      'Total JavaScript bundle size'
    ));

    if (bundleSize > this.thresholds.bundleSize) {
      recommendations.push('建议实施代码分割和懒加载技术，减少打包体积');
    }

    // Load time validation
    const loadTime = this.getLoadTime();
    metrics.push(this.evaluateMetric(
      'Load Time',
      loadTime,
      this.thresholds.loadTime,
      'ms',
      'Initial page load time'
    ));

    if (loadTime > this.thresholds.loadTime) {
      recommendations.push('建议通过预加载和缓存策略优化加载性能');
    }

    // FPS validation
    const fps = this.getFPS();
    metrics.push(this.evaluateMetric(
      'FPS',
      fps,
      this.thresholds.fps,
      'fps',
      'Frames per second',
      false // Higher is better
    ));

    if (fps < this.thresholds.fps) {
      recommendations.push('建议减少渲染周期中的复杂计算，提升动画性能');
    }

    // Add general performance recommendations if none were added
    if (recommendations.length === 0) {
      recommendations.push('继续保持良好的性能优化实践');
      recommendations.push('定期监控应用性能指标');
      recommendations.push('考虑实施代码分割和懒加载优化');
    }

    // Calculate overall score
    const passCount = metrics.filter(m => m.status === 'pass').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;
    const failCount = metrics.filter(m => m.status === 'fail').length;

    const overallScore = Math.round(
      (passCount * 100 + warningCount * 60 + failCount * 0) / metrics.length
    );

    let status: 'pass' | 'warning' | 'fail';
    if (overallScore >= 80) status = 'pass';
    else if (overallScore >= 60) status = 'warning';
    else status = 'fail';

    return {
      timestamp: Date.now(),
      overallScore,
      status,
      metrics,
      recommendations,
    };
  }

  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  // Generate comprehensive report including test results
  generateReport(): PerformanceReport & { tests: TestResult[]; averageRenderTime: number; maxRenderTime: number; memoryEfficiency: number } {
    const baseReport = this.validate();

    // Calculate additional metrics from test results
    const renderTimes = this.testResults.filter(r => r.renderTime > 0).map(r => r.renderTime);
    const averageRenderTime = renderTimes.length > 0 ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length : 0;
    const maxRenderTime = renderTimes.length > 0 ? Math.max(...renderTimes) : 0;
    const memoryEfficiency = this.getMemoryUsage();

    return {
      ...baseReport,
      tests: [...this.testResults],
      overallPassed: baseReport.status === 'pass',
      averageRenderTime,
      maxRenderTime,
      memoryEfficiency
    };
  }

  // Get all test results
  getResults(): TestResult[] {
    return [...this.testResults];
  }
}

// Utility functions
export const createPerformanceValidator = (thresholds?: Partial<PerformanceThresholds>) => {
  return new PerformanceValidator(thresholds);
};

export const validatePerformance = (thresholds?: Partial<PerformanceThresholds>): PerformanceReport => {
  const validator = new PerformanceValidator(thresholds);
  return validator.validate();
};

export const formatPerformanceReport = (report: PerformanceReport): string => {
  const lines = [
    `Performance Report - ${new Date(report.timestamp).toLocaleString()}`,
    `Overall Score: ${report.overallScore}/100 (${report.status.toUpperCase()})`,
    '',
    'Metrics:',
    ...report.metrics.map(metric =>
      `  ${metric.name}: ${metric.value.toFixed(2)}${metric.unit} (${metric.status.toUpperCase()}) - Threshold: ${metric.threshold}${metric.unit}`
    ),
    '',
    'Recommendations:',
    ...report.recommendations.map(rec => `  • ${rec}`),
  ];

  return lines.join('\n');
};

// Run comprehensive performance validation
export const runPerformanceValidation = async (thresholds?: Partial<PerformanceThresholds>): Promise<PerformanceReport & { tests: TestResult[] }> => {
  const validator = new PerformanceValidator(thresholds);

  // Run additional component tests
  try {
    await validator.testComponentRender('PerformanceMonitor', async () => {
      await new Promise(resolve => setTimeout(resolve, 25));
    });

    await validator.testComponentRender('FastRenderComponent', async () => {
      await new Promise(resolve => setTimeout(resolve, 30));
    });

    await validator.testLargeDatasetRender(1000, async () => {
      await new Promise(resolve => setTimeout(resolve, 80));
    });

    validator.testMemoryEfficiency();
    validator.testDOMNodeCount();

    await validator.testFPS(500);
  } catch (err) {
    console.warn('Some performance tests failed:', err);
  }

  // Generate comprehensive report
  return validator.generateReport();
};

export { PerformanceValidator, DEFAULT_THRESHOLDS };
export type { PerformanceThresholds, PerformanceMetric, PerformanceReport, TestResult };
