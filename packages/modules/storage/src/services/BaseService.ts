/**
 * 基础服务类
 * 为所有存储服务提供通用功能
 */

import type { DataAccessLayer, StorageConfig } from '../types';

/**
 * 服务状态枚举
 */
export enum ServiceStatus {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  ERROR = 'error'
}

/**
 * 基础服务抽象类
 */
export abstract class BaseService {
  /** 数据访问层 */
  protected dataAccessLayer: DataAccessLayer;
  
  /** 服务状态 */
  protected status: ServiceStatus = ServiceStatus.STOPPED;
  
  /** 服务配置 */
  protected config: StorageConfig;
  
  /** 服务名称 */
  protected abstract readonly serviceName: string;

  /**
   * 构造函数
   */
  constructor(dataAccessLayer: DataAccessLayer) {
    this.dataAccessLayer = dataAccessLayer;
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    try {
      this.status = ServiceStatus.STARTING;
      await this.onInitialize();
      this.log('服务初始化完成');
    } catch (error) {
      this.status = ServiceStatus.ERROR;
      this.logError('服务初始化失败', error);
      throw error;
    }
  }

  /**
   * 启动服务
   */
  public async start(): Promise<void> {
    if (this.status === ServiceStatus.RUNNING) {
      return;
    }

    try {
      this.status = ServiceStatus.STARTING;
      await this.onStart();
      this.status = ServiceStatus.RUNNING;
      this.log('服务启动完成');
    } catch (error) {
      this.status = ServiceStatus.ERROR;
      this.logError('服务启动失败', error);
      throw error;
    }
  }

  /**
   * 停止服务
   */
  public async stop(): Promise<void> {
    if (this.status === ServiceStatus.STOPPED) {
      return;
    }

    try {
      this.status = ServiceStatus.STOPPING;
      await this.onStop();
      this.status = ServiceStatus.STOPPED;
      this.log('服务停止完成');
    } catch (error) {
      this.status = ServiceStatus.ERROR;
      this.logError('服务停止失败', error);
      throw error;
    }
  }

  /**
   * 更新配置
   */
  public async updateConfig(config: StorageConfig): Promise<void> {
    this.config = config;
    await this.onConfigUpdate(config);
    this.log('配置更新完成');
  }

  /**
   * 获取服务状态
   */
  public getStatus(): ServiceStatus {
    return this.status;
  }

  /**
   * 检查服务是否运行中
   */
  public isRunning(): boolean {
    return this.status === ServiceStatus.RUNNING;
  }

  /**
   * 获取服务名称
   */
  public getServiceName(): string {
    return this.serviceName;
  }

  /**
   * 子类需要实现的初始化方法
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * 子类需要实现的启动方法
   */
  protected abstract onStart(): Promise<void>;

  /**
   * 子类需要实现的停止方法
   */
  protected abstract onStop(): Promise<void>;

  /**
   * 子类可以重写的配置更新方法
   */
  protected async onConfigUpdate(config: StorageConfig): Promise<void> {
    // 默认实现为空，子类可以重写
  }

  /**
   * 记录日志
   */
  protected log(message: string, ...args: any[]): void {
    console.log(`[${this.serviceName}] ${message}`, ...args);
  }

  /**
   * 记录错误日志
   */
  protected logError(message: string, error?: any): void {
    console.error(`[${this.serviceName}] ${message}`, error);
  }

  /**
   * 记录警告日志
   */
  protected logWarning(message: string, ...args: any[]): void {
    console.warn(`[${this.serviceName}] ${message}`, ...args);
  }

  /**
   * 记录调试日志
   */
  protected logDebug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.serviceName}] ${message}`, ...args);
    }
  }

  /**
   * 执行带重试的操作
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          break;
        }

        this.logWarning(`操作失败，第${attempt}次重试，${delay}ms后重试`, lastError.message);
        await this.sleep(delay);
        delay *= 2; // 指数退避
      }
    }

    throw lastError!;
  }

  /**
   * 睡眠指定时间
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 验证必需参数
   */
  protected validateRequired(params: Record<string, any>, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => 
      params[field] === undefined || params[field] === null || params[field] === ''
    );

    if (missingFields.length > 0) {
      throw new Error(`缺少必需参数: ${missingFields.join(', ')}`);
    }
  }

  /**
   * 生成唯一ID
   */
  protected generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 格式化日期
   */
  protected formatDate(date: Date): string {
    return date.toISOString();
  }

  /**
   * 解析JSON字符串
   */
  protected parseJSON<T>(jsonString: string, defaultValue: T): T {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      this.logWarning('JSON解析失败，使用默认值', error);
      return defaultValue;
    }
  }

  /**
   * 序列化为JSON字符串
   */
  protected stringifyJSON(obj: any): string {
    try {
      return JSON.stringify(obj);
    } catch (error) {
      this.logError('JSON序列化失败', error);
      return '{}';
    }
  }

  /**
   * 清理HTML标签
   */
  protected stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * 截断文本
   */
  protected truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * 获取性能计时器
   */
  protected createTimer(): { start: () => void; end: () => number } {
    let startTime: number;
    
    return {
      start: () => {
        startTime = performance.now();
      },
      end: () => {
        return performance.now() - startTime;
      }
    };
  }

  /**
   * 执行带性能监控的操作
   */
  protected async executeWithTiming<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const timer = this.createTimer();
    timer.start();

    try {
      const result = await operation();
      const duration = timer.end();
      this.logDebug(`${operationName} 执行完成，耗时: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = timer.end();
      this.logError(`${operationName} 执行失败，耗时: ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }
}
