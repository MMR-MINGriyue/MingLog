/**
 * MingLog Web Worker 管理器
 * 管理多个Web Worker实例，提供任务调度和负载均衡
 */

import type { WorkerMessage, WorkerResponse } from '../workers/SearchWorker';

export interface WorkerTask {
  id: string;
  type: string;
  payload: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: any) => void;
  priority: number;
  createdAt: number;
}

export interface WorkerPool {
  workers: Worker[];
  activeWorkers: Set<number>;
  taskQueue: WorkerTask[];
  pendingTasks: Map<string, WorkerTask>;
}

export interface WorkerManagerOptions {
  /** Worker数量 */
  workerCount?: number;
  /** Worker脚本路径 */
  workerScript?: string;
  /** 最大队列长度 */
  maxQueueSize?: number;
  /** 任务超时时间（毫秒） */
  taskTimeout?: number;
  /** 是否启用负载均衡 */
  loadBalancing?: boolean;
}

export class WorkerManager {
  private pool: WorkerPool;
  private options: Required<WorkerManagerOptions>;
  private nextTaskId = 0;

  constructor(options: WorkerManagerOptions = {}) {
    this.options = {
      workerCount: Math.max(1, Math.floor(navigator.hardwareConcurrency / 2) || 2),
      workerScript: '/workers/search-worker.js',
      maxQueueSize: 100,
      taskTimeout: 30000,
      loadBalancing: true,
      ...options
    };

    this.pool = {
      workers: [],
      activeWorkers: new Set(),
      taskQueue: [],
      pendingTasks: new Map()
    };

    this.initializeWorkers();
  }

  /**
   * 执行搜索任务
   */
  async search(query: string, options: any = {}): Promise<any> {
    return this.executeTask('search', { query, options }, 1);
  }

  /**
   * 执行索引任务
   */
  async index(documents: any[], operation: 'add' | 'update' | 'remove'): Promise<any> {
    return this.executeTask('index', { documents, operation }, 2);
  }

  /**
   * 获取搜索建议
   */
  async getSuggestions(query: string, limit = 10): Promise<any> {
    return this.executeTask('suggest', { query, limit }, 0);
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<any> {
    return this.executeTask('stats', {}, 0);
  }

  /**
   * 执行任务
   */
  private async executeTask(
    type: string,
    payload: any,
    priority: number,
    onProgress?: (progress: any) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const taskId = this.generateTaskId();
      
      const task: WorkerTask = {
        id: taskId,
        type,
        payload,
        resolve,
        reject,
        onProgress,
        priority,
        createdAt: Date.now()
      };

      // 检查队列大小
      if (this.pool.taskQueue.length >= this.options.maxQueueSize) {
        reject(new Error('Task queue is full'));
        return;
      }

      // 添加到队列
      this.pool.taskQueue.push(task);
      this.pool.pendingTasks.set(taskId, task);

      // 按优先级排序队列
      this.pool.taskQueue.sort((a, b) => b.priority - a.priority);

      // 尝试立即执行
      this.processQueue();

      // 设置超时
      setTimeout(() => {
        if (this.pool.pendingTasks.has(taskId)) {
          this.pool.pendingTasks.delete(taskId);
          reject(new Error('Task timeout'));
        }
      }, this.options.taskTimeout);
    });
  }

  /**
   * 处理任务队列
   */
  private processQueue(): void {
    while (this.pool.taskQueue.length > 0) {
      const availableWorkerIndex = this.findAvailableWorker();
      
      if (availableWorkerIndex === -1) {
        break; // 没有可用的Worker
      }

      const task = this.pool.taskQueue.shift()!;
      this.assignTaskToWorker(task, availableWorkerIndex);
    }
  }

  /**
   * 查找可用的Worker
   */
  private findAvailableWorker(): number {
    if (!this.options.loadBalancing) {
      // 简单轮询
      for (let i = 0; i < this.pool.workers.length; i++) {
        if (!this.pool.activeWorkers.has(i)) {
          return i;
        }
      }
    } else {
      // 负载均衡：选择任务最少的Worker
      let minTasks = Infinity;
      let bestWorker = -1;

      for (let i = 0; i < this.pool.workers.length; i++) {
        if (!this.pool.activeWorkers.has(i)) {
          return i; // 空闲Worker优先
        }

        // 计算Worker的任务数（这里简化为活跃状态）
        const taskCount = this.pool.activeWorkers.has(i) ? 1 : 0;
        if (taskCount < minTasks) {
          minTasks = taskCount;
          bestWorker = i;
        }
      }

      return bestWorker;
    }

    return -1;
  }

  /**
   * 将任务分配给Worker
   */
  private assignTaskToWorker(task: WorkerTask, workerIndex: number): void {
    const worker = this.pool.workers[workerIndex];
    
    this.pool.activeWorkers.add(workerIndex);

    const message: WorkerMessage = {
      id: task.id,
      type: task.type as any,
      payload: task.payload
    };

    worker.postMessage(message);
  }

  /**
   * 处理Worker响应
   */
  private handleWorkerMessage(workerIndex: number, event: MessageEvent<WorkerResponse>): void {
    const { id, type, payload } = event.data;
    const task = this.pool.pendingTasks.get(id);

    if (!task) {
      console.warn(`Received response for unknown task: ${id}`);
      return;
    }

    switch (type) {
      case 'success':
        this.pool.pendingTasks.delete(id);
        this.pool.activeWorkers.delete(workerIndex);
        task.resolve(payload);
        this.processQueue(); // 处理下一个任务
        break;

      case 'error':
        this.pool.pendingTasks.delete(id);
        this.pool.activeWorkers.delete(workerIndex);
        task.reject(new Error(payload.error));
        this.processQueue(); // 处理下一个任务
        break;

      case 'progress':
        if (task.onProgress) {
          task.onProgress(payload);
        }
        break;
    }
  }

  /**
   * 处理Worker错误
   */
  private handleWorkerError(workerIndex: number, error: ErrorEvent): void {
    console.error(`Worker ${workerIndex} error:`, error);
    
    // 重启Worker
    this.restartWorker(workerIndex);
  }

  /**
   * 重启Worker
   */
  private restartWorker(workerIndex: number): void {
    try {
      // 终止旧Worker
      this.pool.workers[workerIndex].terminate();
      
      // 创建新Worker
      const worker = new Worker(this.options.workerScript);
      
      worker.onmessage = (event) => this.handleWorkerMessage(workerIndex, event);
      worker.onerror = (error) => this.handleWorkerError(workerIndex, error);
      
      this.pool.workers[workerIndex] = worker;
      this.pool.activeWorkers.delete(workerIndex);
      
      // 重新处理队列
      this.processQueue();
      
    } catch (error) {
      console.error(`Failed to restart worker ${workerIndex}:`, error);
    }
  }

  /**
   * 初始化Worker池
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.options.workerCount; i++) {
      try {
        const worker = new Worker(this.options.workerScript);
        
        worker.onmessage = (event) => this.handleWorkerMessage(i, event);
        worker.onerror = (error) => this.handleWorkerError(i, error);
        
        this.pool.workers.push(worker);
      } catch (error) {
        console.error(`Failed to create worker ${i}:`, error);
      }
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${++this.nextTaskId}`;
  }

  /**
   * 获取Worker池状态
   */
  getPoolStatus(): {
    totalWorkers: number;
    activeWorkers: number;
    queuedTasks: number;
    pendingTasks: number;
  } {
    return {
      totalWorkers: this.pool.workers.length,
      activeWorkers: this.pool.activeWorkers.size,
      queuedTasks: this.pool.taskQueue.length,
      pendingTasks: this.pool.pendingTasks.size
    };
  }

  /**
   * 清空任务队列
   */
  clearQueue(): void {
    // 拒绝所有排队的任务
    for (const task of this.pool.taskQueue) {
      task.reject(new Error('Queue cleared'));
      this.pool.pendingTasks.delete(task.id);
    }
    
    this.pool.taskQueue = [];
  }

  /**
   * 销毁Worker管理器
   */
  destroy(): void {
    // 清空队列
    this.clearQueue();
    
    // 拒绝所有待处理的任务
    for (const task of this.pool.pendingTasks.values()) {
      task.reject(new Error('Worker manager destroyed'));
    }
    this.pool.pendingTasks.clear();
    
    // 终止所有Worker
    for (const worker of this.pool.workers) {
      worker.terminate();
    }
    
    this.pool.workers = [];
    this.pool.activeWorkers.clear();
  }
}

export default WorkerManager;
