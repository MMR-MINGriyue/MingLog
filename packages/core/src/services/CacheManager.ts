/**
 * MingLog 数据缓存管理器
 * 提供内存缓存、持久化缓存和增量更新机制
 */

export interface CacheEntry<T = any> {
  /** 缓存键 */
  key: string;
  /** 缓存数据 */
  data: T;
  /** 创建时间 */
  createdAt: number;
  /** 最后访问时间 */
  lastAccessedAt: number;
  /** 过期时间（毫秒） */
  ttl?: number;
  /** 数据版本 */
  version: number;
  /** 数据大小（字节） */
  size: number;
  /** 访问次数 */
  accessCount: number;
}

export interface CacheOptions {
  /** 最大缓存大小（字节） */
  maxSize?: number;
  /** 最大缓存项数 */
  maxItems?: number;
  /** 默认TTL（毫秒） */
  defaultTTL?: number;
  /** 是否启用持久化 */
  persistent?: boolean;
  /** 持久化存储键前缀 */
  storagePrefix?: string;
  /** 清理间隔（毫秒） */
  cleanupInterval?: number;
}

export interface CacheStats {
  /** 总缓存项数 */
  totalItems: number;
  /** 总缓存大小 */
  totalSize: number;
  /** 命中次数 */
  hits: number;
  /** 未命中次数 */
  misses: number;
  /** 命中率 */
  hitRate: number;
  /** 最近清理时间 */
  lastCleanup: number;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private options: Required<CacheOptions>;
  private stats: CacheStats;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxItems: 1000,
      defaultTTL: 30 * 60 * 1000, // 30分钟
      persistent: true,
      storagePrefix: 'minglog-cache-',
      cleanupInterval: 5 * 60 * 1000, // 5分钟
      ...options
    };

    this.stats = {
      totalItems: 0,
      totalSize: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      lastCleanup: Date.now()
    };

    this.startCleanupTimer();
    this.loadFromStorage();
  }

  /**
   * 获取缓存数据
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // 检查是否过期
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // 更新访问信息
    entry.lastAccessedAt = Date.now();
    entry.accessCount++;
    
    this.stats.hits++;
    this.updateHitRate();

    return entry.data;
  }

  /**
   * 设置缓存数据
   */
  set<T = any>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const size = this.calculateSize(data);
    
    // 检查是否需要清理空间
    this.ensureSpace(size);

    const entry: CacheEntry<T> = {
      key,
      data,
      createdAt: now,
      lastAccessedAt: now,
      ttl: ttl || this.options.defaultTTL,
      version: 1,
      size,
      accessCount: 1
    };

    // 如果已存在，更新版本号
    const existing = this.cache.get(key);
    if (existing) {
      entry.version = existing.version + 1;
      this.stats.totalSize -= existing.size;
    } else {
      this.stats.totalItems++;
    }

    this.cache.set(key, entry);
    this.stats.totalSize += size;

    // 持久化到存储
    if (this.options.persistent) {
      this.saveToStorage(key, entry);
    }
  }

  /**
   * 删除缓存数据
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.stats.totalItems--;
    this.stats.totalSize -= entry.size;

    // 从持久化存储中删除
    if (this.options.persistent) {
      this.removeFromStorage(key);
    }

    return true;
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.stats.totalItems = 0;
    this.stats.totalSize = 0;

    if (this.options.persistent) {
      this.clearStorage();
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 手动清理过期缓存
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.delete(key);
        cleaned++;
      }
    }

    this.stats.lastCleanup = now;
    return cleaned;
  }

  /**
   * 获取缓存键列表
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 预热缓存
   */
  async warmup(keys: string[], dataLoader: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async (key) => {
      if (!this.has(key)) {
        try {
          const data = await dataLoader(key);
          this.set(key, data);
        } catch (error) {
          console.warn(`Failed to warmup cache for key: ${key}`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * 批量获取
   */
  getMultiple<T = any>(keys: string[]): Map<string, T | null> {
    const result = new Map<string, T | null>();
    
    for (const key of keys) {
      result.set(key, this.get<T>(key));
    }
    
    return result;
  }

  /**
   * 批量设置
   */
  setMultiple<T = any>(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    for (const entry of entries) {
      this.set(entry.key, entry.data, entry.ttl);
    }
  }

  /**
   * 增量更新
   */
  update<T = any>(key: string, updater: (current: T | null) => T, ttl?: number): T {
    const current = this.get<T>(key);
    const updated = updater(current);
    this.set(key, updated, ttl);
    return updated;
  }

  /**
   * 销毁缓存管理器
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }

  /**
   * 检查缓存项是否过期
   */
  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.createdAt > entry.ttl;
  }

  /**
   * 计算数据大小
   */
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      // 如果无法序列化，使用估算值
      return JSON.stringify(data).length * 2;
    }
  }

  /**
   * 确保有足够空间
   */
  private ensureSpace(requiredSize: number): void {
    // 检查项目数量限制
    while (this.cache.size >= this.options.maxItems) {
      this.evictLRU();
    }

    // 检查大小限制
    while (this.stats.totalSize + requiredSize > this.options.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * LRU淘汰策略
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  /**
   * 从存储加载缓存
   */
  private loadFromStorage(): void {
    if (!this.options.persistent || typeof localStorage === 'undefined') return;

    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.options.storagePrefix)
      );

      for (const storageKey of keys) {
        const cacheKey = storageKey.replace(this.options.storagePrefix, '');
        const data = localStorage.getItem(storageKey);
        
        if (data) {
          const entry: CacheEntry = JSON.parse(data);
          
          // 检查是否过期
          if (!this.isExpired(entry)) {
            this.cache.set(cacheKey, entry);
            this.stats.totalItems++;
            this.stats.totalSize += entry.size;
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * 保存到存储
   */
  private saveToStorage(key: string, entry: CacheEntry): void {
    if (!this.options.persistent || typeof localStorage === 'undefined') return;

    try {
      const storageKey = this.options.storagePrefix + key;
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * 从存储删除
   */
  private removeFromStorage(key: string): void {
    if (!this.options.persistent || typeof localStorage === 'undefined') return;

    try {
      const storageKey = this.options.storagePrefix + key;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove cache from storage:', error);
    }
  }

  /**
   * 清空存储
   */
  private clearStorage(): void {
    if (!this.options.persistent || typeof localStorage === 'undefined') return;

    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.options.storagePrefix)
      );

      for (const key of keys) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Failed to clear cache storage:', error);
    }
  }
}

export default CacheManager;
