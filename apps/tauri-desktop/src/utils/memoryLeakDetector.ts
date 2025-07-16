import React, { useEffect, useRef, useCallback } from 'react';

interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  domNodes: number;
  eventListeners: number;
}

interface MemoryLeak {
  id: string;
  type: 'memory' | 'dom' | 'listeners' | 'intervals' | 'timeouts';
  severity: 'low' | 'medium' | 'high';
  description: string;
  detected: number;
  growth: number;
  threshold: number;
}

class ResourceTracker {
  private static instance: ResourceTracker | null = null;
  private resources: Map<string, any> = new Map();
  private cleanupCallbacks: Map<string, () => void> = new Map();
  private intervals: Set<NodeJS.Timeout> = new Set();
  private timeouts: Set<NodeJS.Timeout> = new Set();
  private eventListeners: Array<{ target: EventTarget; type: string; listener: EventListener }> = [];

  private constructor() {}

  static getInstance(): ResourceTracker {
    if (!ResourceTracker.instance) {
      ResourceTracker.instance = new ResourceTracker();
    }
    return ResourceTracker.instance;
  }

  register(id: string, resource: any, cleanup?: () => void): void {
    this.resources.set(id, resource);
    if (cleanup) {
      this.cleanupCallbacks.set(id, cleanup);
    }
  }

  unregister(id: string): void {
    const cleanup = this.cleanupCallbacks.get(id);
    if (cleanup) {
      cleanup();
      this.cleanupCallbacks.delete(id);
    }
    this.resources.delete(id);
  }

  registerInterval(id: NodeJS.Timeout): void {
    this.intervals.add(id);
  }

  clearInterval(id: NodeJS.Timeout): void {
    if (this.intervals.has(id)) {
      clearInterval(id);
      this.intervals.delete(id);
    }
  }

  registerTimeout(id: NodeJS.Timeout): void {
    this.timeouts.add(id);
  }

  clearTimeout(id: NodeJS.Timeout): void {
    if (this.timeouts.has(id)) {
      clearTimeout(id);
      this.timeouts.delete(id);
    }
  }

  registerEventListener(target: EventTarget, type: string, listener: EventListener): void {
    this.eventListeners.push({ target, type, listener });
  }

  removeEventListener(target: EventTarget, type: string, listener: EventListener): void {
    const index = this.eventListeners.findIndex(
      item => item.target === target && item.type === type && item.listener === listener
    );
    if (index !== -1) {
      target.removeEventListener(type, listener);
      this.eventListeners.splice(index, 1);
    }
  }

  getResourceStats(): { intervals: number; timeouts: number; eventListeners: number; resources: number; performanceObservers: number; intersectionObservers: number } {
    return {
      intervals: this.intervals.size,
      timeouts: this.timeouts.size,
      eventListeners: this.eventListeners.length,
      resources: this.resources.size,
      performanceObservers: 0, // TODO: Implement performance observer tracking
      intersectionObservers: 0 // TODO: Implement intersection observer tracking
    };
  }

  clearAllResources(): void {
    // Clear intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();

    // Clear timeouts
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts.clear();

    // Remove event listeners
    this.eventListeners.forEach(({ target, type, listener }) => {
      target.removeEventListener(type, listener);
    });
    this.eventListeners = [];

    // Clear other resources
    this.cleanupCallbacks.forEach(cleanup => cleanup());
    this.resources.clear();
    this.cleanupCallbacks.clear();
  }

  cleanup(): void {
    this.clearAllResources();
  }

  getResourceCount(): number {
    return this.resources.size;
  }

  getResources(): Map<string, any> {
    return new Map(this.resources);
  }
}

class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = [];
  private maxSnapshots: number = 50;
  private thresholds = {
    memoryGrowth: 10, // MB
    domGrowth: 1000, // nodes
    listenerGrowth: 100, // listeners
  };

  takeSnapshot(): MemorySnapshot {
    const memory = (performance as any).memory;
    const domNodes = document.querySelectorAll('*').length;
    const eventListeners = this.countEventListeners();

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memory?.usedJSHeapSize || 0,
      totalJSHeapSize: memory?.totalJSHeapSize || 0,
      jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0,
      domNodes,
      eventListeners,
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  private countEventListeners(): number {
    // This is a simplified count - in real implementation you'd need more sophisticated tracking
    const elements = document.querySelectorAll('*');
    let count = 0;
    
    elements.forEach(element => {
      // Check for common event properties
      const events = ['onclick', 'onload', 'onchange', 'onsubmit', 'onmouseover'];
      events.forEach(event => {
        if ((element as any)[event]) count++;
      });
    });

    return count;
  }

  detectLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    // Check ResourceTracker for excessive resources
    const tracker = ResourceTracker.getInstance();
    const stats = tracker.getResourceStats();

    // Interval leak detection
    if (stats.intervals > 5) {
      leaks.push({
        id: `intervals-${Date.now()}`,
        type: 'intervals',
        severity: stats.intervals > 20 ? 'high' : stats.intervals > 10 ? 'medium' : 'low',
        description: `Excessive intervals detected: ${stats.intervals}`,
        detected: Date.now(),
        growth: stats.intervals,
        threshold: 5,
      });
    }

    // Timeout leak detection
    if (stats.timeouts > 10) {
      leaks.push({
        id: `timeouts-${Date.now()}`,
        type: 'timeouts',
        severity: stats.timeouts > 50 ? 'high' : stats.timeouts > 25 ? 'medium' : 'low',
        description: `Excessive timeouts detected: ${stats.timeouts}`,
        detected: Date.now(),
        growth: stats.timeouts,
        threshold: 10,
      });
    }

    // Only check snapshot-based leaks if we have enough snapshots
    if (this.snapshots.length >= 2) {
      const recent = this.snapshots.slice(-Math.min(5, this.snapshots.length));
      const oldest = recent[0];
      const newest = recent[recent.length - 1];

      // Memory leak detection
      const memoryGrowth = (newest.usedJSHeapSize - oldest.usedJSHeapSize) / 1024 / 1024;
      if (memoryGrowth > this.thresholds.memoryGrowth) {
        leaks.push({
          id: `memory-${Date.now()}`,
          type: 'memory',
          severity: memoryGrowth > 50 ? 'high' : memoryGrowth > 25 ? 'medium' : 'low',
          description: `Memory usage increased by ${memoryGrowth.toFixed(1)}MB`,
          detected: Date.now(),
          growth: memoryGrowth,
          threshold: this.thresholds.memoryGrowth,
        });
      }

      // DOM node leak detection
      const domGrowth = newest.domNodes - oldest.domNodes;
      if (domGrowth > this.thresholds.domGrowth) {
        leaks.push({
          id: `dom-${Date.now()}`,
          type: 'dom',
          severity: domGrowth > 5000 ? 'high' : domGrowth > 2000 ? 'medium' : 'low',
          description: `DOM nodes increased by ${domGrowth}`,
          detected: Date.now(),
          growth: domGrowth,
          threshold: this.thresholds.domGrowth,
        });
      }

      // Event listener leak detection
      const listenerGrowth = newest.eventListeners - oldest.eventListeners;
      if (listenerGrowth > this.thresholds.listenerGrowth) {
        leaks.push({
          id: `listeners-${Date.now()}`,
          type: 'listeners',
          severity: listenerGrowth > 500 ? 'high' : listenerGrowth > 200 ? 'medium' : 'low',
          description: `Event listeners increased by ${listenerGrowth}`,
          detected: Date.now(),
          growth: listenerGrowth,
          threshold: this.thresholds.listenerGrowth,
        });
      }
    }

    return leaks;
  }

  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  clear(): void {
    this.snapshots = [];
  }

  setThresholds(thresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
}

// Global detector instance
const globalDetector = new MemoryLeakDetector();

// Hook for memory leak detection
export const useMemoryLeakDetection = (enabled: boolean = true, interval: number = 5000) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [snapshots, setSnapshots] = React.useState<MemorySnapshot[]>([]);
  const [leaks, setLeaks] = React.useState<MemoryLeak[]>([]);

  const checkForLeaks = useCallback(() => {
    const _snapshot = globalDetector.takeSnapshot();
    const detectedLeaks = globalDetector.detectLeaks();

    setSnapshots(globalDetector.getSnapshots());

    if (detectedLeaks.length > 0) {
      setLeaks(prev => [...prev, ...detectedLeaks]);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    checkForLeaks(); // Initial check
    intervalRef.current = setInterval(checkForLeaks, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, checkForLeaks]);

  const getLeakReports = useCallback(() => {
    return leaks;
  }, [leaks]);

  const forceDetection = useCallback(() => {
    checkForLeaks();
  }, [checkForLeaks]);

  const resourceStats = React.useMemo(() => {
    const tracker = ResourceTracker.getInstance();
    return tracker.getResourceStats();
  }, [snapshots]);

  return {
    getLeakReports,
    forceDetection,
    resourceStats,
    snapshots,
    leaks,
    takeSnapshot: () => {
      const snapshot = globalDetector.takeSnapshot();
      setSnapshots(globalDetector.getSnapshots());
      return snapshot;
    },
  };
};

// Hook for safe resource management
export const useSafeResource = () => {
  const trackerRef = useRef<ResourceTracker>(ResourceTracker.getInstance());

  useEffect(() => {
    return () => {
      // Cleanup will be handled by ResourceTracker
    };
  }, []);

  const safeSetInterval = useCallback((callback: () => void, delay: number): NodeJS.Timeout => {
    const id = setInterval(callback, delay);
    trackerRef.current.registerInterval(id);
    return id;
  }, []);

  const safeSetTimeout = useCallback((callback: () => void, delay: number): NodeJS.Timeout => {
    const id = setTimeout(callback, delay);
    trackerRef.current.registerTimeout(id);
    return id;
  }, []);

  const safeAddEventListener = useCallback((target: EventTarget, type: string, listener: EventListener) => {
    target.addEventListener(type, listener);
    trackerRef.current.registerEventListener(target, type, listener);

    // Return cleanup function
    return () => {
      trackerRef.current.removeEventListener(target, type, listener);
    };
  }, []);

  const safeClearInterval = useCallback((id: NodeJS.Timeout) => {
    trackerRef.current.clearInterval(id);
  }, []);

  const safeClearTimeout = useCallback((id: NodeJS.Timeout) => {
    trackerRef.current.clearTimeout(id);
  }, []);

  const safeRemoveEventListener = useCallback((target: EventTarget, type: string, listener: EventListener) => {
    trackerRef.current.removeEventListener(target, type, listener);
  }, []);

  return {
    safeSetInterval,
    safeSetTimeout,
    safeAddEventListener,
    safeClearInterval,
    safeClearTimeout,
    safeRemoveEventListener,
  };
};

// Performance validator utility
export const performanceValidator = {
  validateMemoryUsage: (threshold: number = 100): boolean => {
    const memory = (performance as any).memory;
    if (!memory) return true;
    
    const usedMB = memory.usedJSHeapSize / 1024 / 1024;
    return usedMB < threshold;
  },

  validateDOMSize: (threshold: number = 5000): boolean => {
    const nodeCount = document.querySelectorAll('*').length;
    return nodeCount < threshold;
  },

  validateRenderTime: (_threshold: number = 16): boolean => {
    // This would need to be implemented with actual render time measurement
    return true;
  },

  getPerformanceReport: () => {
    const memory = (performance as any).memory;
    const domNodes = document.querySelectorAll('*').length;
    
    return {
      memory: memory ? {
        used: memory.usedJSHeapSize / 1024 / 1024,
        total: memory.totalJSHeapSize / 1024 / 1024,
        limit: memory.jsHeapSizeLimit / 1024 / 1024,
      } : null,
      domNodes,
      timestamp: Date.now(),
    };
  },
};

export { ResourceTracker, MemoryLeakDetector, globalDetector };
export type { MemorySnapshot, MemoryLeak };
