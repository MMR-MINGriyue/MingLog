/**
 * 性能监控模块
 * 监控应用启动时间、内存使用、CPU 使用等性能指标
 */

import { app, BrowserWindow } from 'electron';
import { logger } from './logger';

export interface PerformanceMetrics {
  startupTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  windowCount: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private startTime: number;
  private metrics: PerformanceMetrics[] = [];
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.startTime = Date.now();
    this.setupMonitoring();
  }

  /**
   * 设置性能监控
   */
  private setupMonitoring(): void {
    // 监控应用启动完成
    app.whenReady().then(() => {
      const startupTime = Date.now() - this.startTime;
      logger.info(`应用启动完成，耗时: ${startupTime}ms`);
      
      // 开始定期收集性能指标
      this.startPeriodicMonitoring();
    });

    // 监控窗口创建
    app.on('browser-window-created', (_, window) => {
      logger.debug('新窗口创建', { 
        id: window.id,
        windowCount: BrowserWindow.getAllWindows().length 
      });
    });

    // 监控窗口关闭
    app.on('browser-window-focus', (_, window) => {
      logger.debug('窗口获得焦点', { id: window.id });
    });
  }

  /**
   * 开始定期性能监控
   */
  private startPeriodicMonitoring(): void {
    // 每30秒收集一次性能指标
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // 立即收集一次
    this.collectMetrics();
  }

  /**
   * 收集性能指标
   */
  private collectMetrics(): void {
    try {
      const metrics: PerformanceMetrics = {
        startupTime: Date.now() - this.startTime,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        windowCount: BrowserWindow.getAllWindows().length,
        timestamp: Date.now()
      };

      this.metrics.push(metrics);

      // 只保留最近100条记录
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      // 记录关键指标
      const memoryMB = Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024);
      logger.debug('性能指标收集', {
        memory: `${memoryMB}MB`,
        windows: metrics.windowCount,
        uptime: `${Math.round(metrics.startupTime / 1000)}s`
      });

      // 检查内存使用是否过高
      if (memoryMB > 500) {
        logger.warn('内存使用过高', { memoryMB });
      }

    } catch (error) {
      logger.error('收集性能指标失败', error as Error);
    }
  }

  /**
   * 获取当前性能指标
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * 获取所有性能指标
   */
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * 获取性能摘要
   */
  getPerformanceSummary(): {
    averageMemory: number;
    peakMemory: number;
    uptime: number;
    windowCount: number;
  } {
    if (this.metrics.length === 0) {
      return {
        averageMemory: 0,
        peakMemory: 0,
        uptime: 0,
        windowCount: 0
      };
    }

    const memoryValues = this.metrics.map(m => m.memoryUsage.heapUsed);
    const averageMemory = memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length;
    const peakMemory = Math.max(...memoryValues);
    const latest = this.metrics[this.metrics.length - 1];

    return {
      averageMemory: Math.round(averageMemory / 1024 / 1024), // MB
      peakMemory: Math.round(peakMemory / 1024 / 1024), // MB
      uptime: Math.round(latest.startupTime / 1000), // seconds
      windowCount: latest.windowCount
    };
  }

  /**
   * 测量函数执行时间
   */
  measureTime<T>(name: string, fn: () => T): T {
    const start = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - start;
      logger.debug(`性能测量: ${name}`, { duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`性能测量失败: ${name}`, error as Error, { duration: `${duration}ms` });
      throw error;
    }
  }

  /**
   * 测量异步函数执行时间
   */
  async measureTimeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      logger.debug(`异步性能测量: ${name}`, { duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`异步性能测量失败: ${name}`, error as Error, { duration: `${duration}ms` });
      throw error;
    }
  }

  /**
   * 检查系统资源
   */
  checkSystemResources(): {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      user: number;
      system: number;
    };
  } {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000), // 转换为毫秒
        system: Math.round(cpuUsage.system / 1000)
      }
    };
  }

  /**
   * 停止性能监控
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    logger.info('性能监控已停止');
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const summary = this.getPerformanceSummary();
    const current = this.getCurrentMetrics();
    const resources = this.checkSystemResources();

    return `
# MingLog 性能报告

## 基本信息
- 运行时间: ${summary.uptime} 秒
- 窗口数量: ${summary.windowCount}

## 内存使用
- 当前内存: ${resources.memory.used} MB
- 平均内存: ${summary.averageMemory} MB
- 峰值内存: ${summary.peakMemory} MB
- 内存使用率: ${resources.memory.percentage}%

## CPU 使用
- 用户时间: ${resources.cpu.user} ms
- 系统时间: ${resources.cpu.system} ms

## 数据收集
- 收集次数: ${this.metrics.length}
- 最后更新: ${current ? new Date(current.timestamp).toLocaleString() : '无'}

---
生成时间: ${new Date().toLocaleString()}
    `.trim();
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();
