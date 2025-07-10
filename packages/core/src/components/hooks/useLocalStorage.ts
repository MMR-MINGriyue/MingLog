/**
 * useLocalStorage Hook
 * 本地存储状态管理钩子
 */

import { useState, useEffect, useCallback } from 'react';

// 序列化函数
function serialize<T>(value: T): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    throw new Error(`Failed to serialize value: ${error}`);
  }
}

// 反序列化函数
function deserialize<T>(value: string): T {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Failed to deserialize value: ${error}`);
  }
}

// 检查是否支持 localStorage
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__localStorage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export interface UseLocalStorageOptions<T> {
  /** 序列化函数 */
  serializer?: {
    read: (value: string) => T;
    write: (value: T) => string;
  };
  /** 错误处理函数 */
  onError?: (error: Error) => void;
  /** 是否同步多个标签页 */
  syncAcrossTabs?: boolean;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  const {
    serializer = {
      read: deserialize,
      write: serialize
    },
    onError = console.error,
    syncAcrossTabs = true
  } = options;

  // 读取存储值
  const readValue = useCallback((): T => {
    if (!isLocalStorageAvailable()) {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return serializer.read(item);
    } catch (error) {
      onError(error as Error);
      return initialValue;
    }
  }, [key, initialValue, serializer, onError]);

  // 状态
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // 设置值
  const setValue = useCallback(
    (value: T | ((prevValue: T) => T)) => {
      if (!isLocalStorageAvailable()) {
        setStoredValue(value instanceof Function ? value(storedValue) : value);
        return;
      }

      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        
        // 保存到 localStorage
        window.localStorage.setItem(key, serializer.write(newValue));
        
        // 更新状态
        setStoredValue(newValue);
        
        // 触发自定义事件（用于跨标签页同步）
        if (syncAcrossTabs) {
          window.dispatchEvent(
            new CustomEvent('local-storage-change', {
              detail: { key, newValue }
            })
          );
        }
      } catch (error) {
        onError(error as Error);
      }
    },
    [key, storedValue, serializer, onError, syncAcrossTabs]
  );

  // 删除值
  const removeValue = useCallback(() => {
    if (!isLocalStorageAvailable()) {
      setStoredValue(initialValue);
      return;
    }

    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      
      // 触发自定义事件
      if (syncAcrossTabs) {
        window.dispatchEvent(
          new CustomEvent('local-storage-change', {
            detail: { key, newValue: initialValue }
          })
        );
      }
    } catch (error) {
      onError(error as Error);
    }
  }, [key, initialValue, syncAcrossTabs, onError]);

  // 监听存储变化（跨标签页同步）
  useEffect(() => {
    if (!isLocalStorageAvailable() || !syncAcrossTabs) {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = serializer.read(e.newValue);
          setStoredValue(newValue);
        } catch (error) {
          onError(error as Error);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.newValue);
      }
    };

    // 监听原生 storage 事件
    window.addEventListener('storage', handleStorageChange);
    
    // 监听自定义事件（同一标签页内的变化）
    window.addEventListener('local-storage-change', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-change', handleCustomStorageChange as EventListener);
    };
  }, [key, initialValue, serializer, onError, syncAcrossTabs]);

  // 初始化时读取值
  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  return [storedValue, setValue, removeValue];
}

// 简化版本，只返回值和设置函数
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>
): [T, (value: T | ((prevValue: T) => T)) => void] {
  const [value, setValue] = useLocalStorage(key, initialValue, options);
  return [value, setValue];
}

// 只读版本
export function useLocalStorageValue<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>
): T {
  const [value] = useLocalStorage(key, initialValue, options);
  return value;
}

// 批量操作钩子
export function useLocalStorageBatch() {
  const setMultiple = useCallback((items: Record<string, any>) => {
    if (!isLocalStorageAvailable()) {
      return;
    }

    try {
      Object.entries(items).forEach(([key, value]) => {
        window.localStorage.setItem(key, serialize(value));
      });
    } catch (error) {
      console.error('Failed to set multiple localStorage items:', error);
    }
  }, []);

  const getMultiple = useCallback(<T extends Record<string, any>>(
    keys: (keyof T)[],
    defaults: T
  ): T => {
    if (!isLocalStorageAvailable()) {
      return defaults;
    }

    const result = { ...defaults };

    try {
      keys.forEach(key => {
        const item = window.localStorage.getItem(key as string);
        if (item !== null) {
          result[key] = deserialize(item);
        }
      });
    } catch (error) {
      console.error('Failed to get multiple localStorage items:', error);
    }

    return result;
  }, []);

  const removeMultiple = useCallback((keys: string[]) => {
    if (!isLocalStorageAvailable()) {
      return;
    }

    try {
      keys.forEach(key => {
        window.localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to remove multiple localStorage items:', error);
    }
  }, []);

  const clear = useCallback(() => {
    if (!isLocalStorageAvailable()) {
      return;
    }

    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }, []);

  return {
    setMultiple,
    getMultiple,
    removeMultiple,
    clear
  };
}

// 存储使用情况钩子
export function useLocalStorageInfo() {
  const [info, setInfo] = useState<{
    used: number;
    available: number;
    total: number;
    percentage: number;
  }>({ used: 0, available: 0, total: 0, percentage: 0 });

  const updateInfo = useCallback(() => {
    if (!isLocalStorageAvailable()) {
      return;
    }

    try {
      let used = 0;
      for (let key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          used += window.localStorage[key].length + key.length;
        }
      }

      // 估算总容量（通常为 5-10MB）
      const total = 5 * 1024 * 1024; // 5MB
      const available = total - used;
      const percentage = (used / total) * 100;

      setInfo({ used, available, total, percentage });
    } catch (error) {
      console.error('Failed to get localStorage info:', error);
    }
  }, []);

  useEffect(() => {
    updateInfo();
    
    // 监听存储变化
    const handleStorageChange = () => {
      updateInfo();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-change', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-change', handleStorageChange);
    };
  }, [updateInfo]);

  return { ...info, refresh: updateInfo };
}

// 存储监听钩子
export function useLocalStorageListener(
  key: string,
  callback: (newValue: string | null, oldValue: string | null) => void
) {
  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        callback(e.newValue, e.oldValue);
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        callback(serialize(e.detail.newValue), null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-change', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-change', handleCustomStorageChange as EventListener);
    };
  }, [key, callback]);
}

export default useLocalStorage;
