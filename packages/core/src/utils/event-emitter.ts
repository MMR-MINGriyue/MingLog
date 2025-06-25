export type EventListener<T = any> = (data: T) => void | Promise<void>;

export class EventEmitter {
  private listeners = new Map<string, Set<EventListener>>();

  on<T = any>(event: string, listener: EventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  once<T = any>(event: string, listener: EventListener<T>): () => void {
    const onceListener = (data: T) => {
      listener(data);
      this.off(event, onceListener);
    };
    
    return this.on(event, onceListener);
  }

  off(event: string, listener: EventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit<T = any>(event: string, data: T): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;
    
    for (const listener of eventListeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }

  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}
