/**
 * 键盘导航管理器
 * 提供方向键导航、Tab导航和焦点管理功能
 */

import { EventEmitter } from 'events';

/**
 * 可导航元素接口
 */
export interface NavigableElement {
  /** 元素ID */
  id: string;
  /** DOM元素 */
  element: HTMLElement;
  /** 导航组 */
  group: string;
  /** 优先级 */
  priority: number;
  /** 是否可见 */
  visible: boolean;
  /** 是否可聚焦 */
  focusable: boolean;
  /** 位置信息 */
  bounds: DOMRect;
  /** 自定义数据 */
  data?: any;
}

/**
 * 导航方向
 */
export type NavigationDirection = 'up' | 'down' | 'left' | 'right' | 'next' | 'prev';

/**
 * 导航配置
 */
export interface NavigationConfig {
  /** 是否启用方向键导航 */
  enableArrowKeys: boolean;
  /** 是否启用Tab导航 */
  enableTabNavigation: boolean;
  /** 是否循环导航 */
  wrapAround: boolean;
  /** 导航阈值 */
  threshold: number;
  /** 是否自动滚动到焦点元素 */
  autoScroll: boolean;
  /** 滚动偏移 */
  scrollOffset: number;
}

/**
 * 键盘导航管理器
 */
export class KeyboardNavigationManager extends EventEmitter {
  private elements: Map<string, NavigableElement> = new Map();
  private currentFocus: string | null = null;
  private config: NavigationConfig;
  private keydownHandler: (event: KeyboardEvent) => void;
  private observer: MutationObserver;

  constructor(config: Partial<NavigationConfig> = {}) {
    super();
    
    this.config = {
      enableArrowKeys: true,
      enableTabNavigation: true,
      wrapAround: true,
      threshold: 10,
      autoScroll: true,
      scrollOffset: 100,
      ...config
    };

    this.keydownHandler = this.handleKeyDown.bind(this);
    this.init();
  }

  /**
   * 初始化导航管理器
   */
  private init(): void {
    // 绑定键盘事件
    document.addEventListener('keydown', this.keydownHandler, true);
    
    // 监听DOM变化
    this.observer = new MutationObserver(this.handleMutation.bind(this));
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-navigable', 'tabindex', 'disabled', 'hidden']
    });

    // 初始扫描可导航元素
    this.scanNavigableElements();
  }

  /**
   * 注册可导航元素
   */
  register(element: HTMLElement, options: {
    id?: string;
    group?: string;
    priority?: number;
    data?: any;
  } = {}): string {
    const id = options.id || this.generateId();
    const bounds = element.getBoundingClientRect();
    
    const navigableElement: NavigableElement = {
      id,
      element,
      group: options.group || 'default',
      priority: options.priority || 0,
      visible: this.isVisible(element),
      focusable: this.isFocusable(element),
      bounds,
      data: options.data
    };

    this.elements.set(id, navigableElement);
    this.emit('element-registered', navigableElement);
    
    return id;
  }

  /**
   * 注销可导航元素
   */
  unregister(id: string): void {
    const element = this.elements.get(id);
    if (element) {
      this.elements.delete(id);
      
      if (this.currentFocus === id) {
        this.currentFocus = null;
      }
      
      this.emit('element-unregistered', element);
    }
  }

  /**
   * 设置焦点
   */
  focus(id: string): boolean {
    const element = this.elements.get(id);
    if (!element || !element.focusable || !element.visible) {
      return false;
    }

    // 移除之前的焦点
    if (this.currentFocus) {
      const prevElement = this.elements.get(this.currentFocus);
      if (prevElement) {
        prevElement.element.classList.remove('keyboard-focus');
        this.emit('focus-lost', prevElement);
      }
    }

    // 设置新焦点
    this.currentFocus = id;
    element.element.focus();
    element.element.classList.add('keyboard-focus');
    
    // 自动滚动
    if (this.config.autoScroll) {
      this.scrollToElement(element.element);
    }
    
    this.emit('focus-gained', element);
    return true;
  }

  /**
   * 导航到指定方向
   */
  navigate(direction: NavigationDirection): boolean {
    if (!this.currentFocus) {
      // 没有当前焦点，选择第一个可用元素
      return this.focusFirst();
    }

    const currentElement = this.elements.get(this.currentFocus);
    if (!currentElement) {
      return false;
    }

    const nextElement = this.findNextElement(currentElement, direction);
    if (nextElement) {
      return this.focus(nextElement.id);
    }

    // 如果启用了循环导航
    if (this.config.wrapAround) {
      if (direction === 'next' || direction === 'down' || direction === 'right') {
        return this.focusFirst(currentElement.group);
      } else if (direction === 'prev' || direction === 'up' || direction === 'left') {
        return this.focusLast(currentElement.group);
      }
    }

    return false;
  }

  /**
   * 处理键盘事件
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // 检查是否在输入元素中
    const target = event.target as HTMLElement;
    if (this.isInputElement(target) && !this.shouldHandleInInput(event)) {
      return;
    }

    let handled = false;

    if (this.config.enableArrowKeys) {
      switch (event.key) {
        case 'ArrowUp':
          handled = this.navigate('up');
          break;
        case 'ArrowDown':
          handled = this.navigate('down');
          break;
        case 'ArrowLeft':
          handled = this.navigate('left');
          break;
        case 'ArrowRight':
          handled = this.navigate('right');
          break;
      }
    }

    if (this.config.enableTabNavigation) {
      switch (event.key) {
        case 'Tab':
          if (event.shiftKey) {
            handled = this.navigate('prev');
          } else {
            handled = this.navigate('next');
          }
          break;
      }
    }

    // 其他导航键
    switch (event.key) {
      case 'Home':
        handled = this.focusFirst();
        break;
      case 'End':
        handled = this.focusLast();
        break;
      case 'Enter':
      case ' ':
        if (this.currentFocus) {
          const element = this.elements.get(this.currentFocus);
          if (element) {
            this.activateElement(element);
            handled = true;
          }
        }
        break;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * 查找下一个元素
   */
  private findNextElement(current: NavigableElement, direction: NavigationDirection): NavigableElement | null {
    const candidates = this.getNavigableCandidates(current.group);
    
    if (candidates.length <= 1) {
      return null;
    }

    switch (direction) {
      case 'next':
        return this.findNextInTabOrder(current, candidates);
      case 'prev':
        return this.findPrevInTabOrder(current, candidates);
      case 'up':
        return this.findNearestInDirection(current, candidates, 'up');
      case 'down':
        return this.findNearestInDirection(current, candidates, 'down');
      case 'left':
        return this.findNearestInDirection(current, candidates, 'left');
      case 'right':
        return this.findNearestInDirection(current, candidates, 'right');
      default:
        return null;
    }
  }

  /**
   * 在Tab顺序中查找下一个元素
   */
  private findNextInTabOrder(current: NavigableElement, candidates: NavigableElement[]): NavigableElement | null {
    const sorted = candidates.sort((a, b) => {
      // 按优先级和DOM顺序排序
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      const position = a.element.compareDocumentPosition(b.element);
      return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });

    const currentIndex = sorted.findIndex(el => el.id === current.id);
    if (currentIndex === -1) return null;
    
    return sorted[currentIndex + 1] || null;
  }

  /**
   * 在Tab顺序中查找上一个元素
   */
  private findPrevInTabOrder(current: NavigableElement, candidates: NavigableElement[]): NavigableElement | null {
    const sorted = candidates.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      const position = a.element.compareDocumentPosition(b.element);
      return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });

    const currentIndex = sorted.findIndex(el => el.id === current.id);
    if (currentIndex === -1) return null;
    
    return sorted[currentIndex - 1] || null;
  }

  /**
   * 在指定方向查找最近的元素
   */
  private findNearestInDirection(
    current: NavigableElement, 
    candidates: NavigableElement[], 
    direction: 'up' | 'down' | 'left' | 'right'
  ): NavigableElement | null {
    const currentBounds = current.bounds;
    let bestCandidate: NavigableElement | null = null;
    let bestDistance = Infinity;

    for (const candidate of candidates) {
      if (candidate.id === current.id) continue;
      
      const candidateBounds = candidate.bounds;
      
      // 检查方向是否正确
      if (!this.isInDirection(currentBounds, candidateBounds, direction)) {
        continue;
      }

      // 计算距离
      const distance = this.calculateDistance(currentBounds, candidateBounds, direction);
      
      if (distance < bestDistance) {
        bestDistance = distance;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  /**
   * 检查元素是否在指定方向
   */
  private isInDirection(
    from: DOMRect, 
    to: DOMRect, 
    direction: 'up' | 'down' | 'left' | 'right'
  ): boolean {
    const threshold = this.config.threshold;
    
    switch (direction) {
      case 'up':
        return to.bottom <= from.top + threshold;
      case 'down':
        return to.top >= from.bottom - threshold;
      case 'left':
        return to.right <= from.left + threshold;
      case 'right':
        return to.left >= from.right - threshold;
      default:
        return false;
    }
  }

  /**
   * 计算距离
   */
  private calculateDistance(
    from: DOMRect, 
    to: DOMRect, 
    direction: 'up' | 'down' | 'left' | 'right'
  ): number {
    const fromCenter = {
      x: from.left + from.width / 2,
      y: from.top + from.height / 2
    };
    
    const toCenter = {
      x: to.left + to.width / 2,
      y: to.top + to.height / 2
    };

    // 计算主方向距离和垂直方向距离
    let mainDistance: number;
    let crossDistance: number;

    switch (direction) {
      case 'up':
        mainDistance = fromCenter.y - toCenter.y;
        crossDistance = Math.abs(fromCenter.x - toCenter.x);
        break;
      case 'down':
        mainDistance = toCenter.y - fromCenter.y;
        crossDistance = Math.abs(fromCenter.x - toCenter.x);
        break;
      case 'left':
        mainDistance = fromCenter.x - toCenter.x;
        crossDistance = Math.abs(fromCenter.y - toCenter.y);
        break;
      case 'right':
        mainDistance = toCenter.x - fromCenter.x;
        crossDistance = Math.abs(fromCenter.y - toCenter.y);
        break;
      default:
        return Infinity;
    }

    // 主方向距离权重更高
    return mainDistance + crossDistance * 0.3;
  }

  /**
   * 获取可导航候选元素
   */
  private getNavigableCandidates(group?: string): NavigableElement[] {
    const candidates: NavigableElement[] = [];
    
    for (const element of this.elements.values()) {
      if (element.visible && element.focusable) {
        if (!group || element.group === group) {
          // 更新边界信息
          element.bounds = element.element.getBoundingClientRect();
          candidates.push(element);
        }
      }
    }
    
    return candidates;
  }

  /**
   * 聚焦第一个元素
   */
  private focusFirst(group?: string): boolean {
    const candidates = this.getNavigableCandidates(group);
    if (candidates.length === 0) return false;
    
    const sorted = candidates.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      const position = a.element.compareDocumentPosition(b.element);
      return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    
    return this.focus(sorted[0].id);
  }

  /**
   * 聚焦最后一个元素
   */
  private focusLast(group?: string): boolean {
    const candidates = this.getNavigableCandidates(group);
    if (candidates.length === 0) return false;
    
    const sorted = candidates.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      const position = a.element.compareDocumentPosition(b.element);
      return position & Node.DOCUMENT_POSITION_FOLLOWING ? 1 : -1;
    });
    
    return this.focus(sorted[0].id);
  }

  /**
   * 激活元素
   */
  private activateElement(element: NavigableElement): void {
    const htmlElement = element.element;
    
    if (htmlElement.tagName === 'BUTTON' || htmlElement.tagName === 'A') {
      htmlElement.click();
    } else if (htmlElement.hasAttribute('data-action')) {
      const action = htmlElement.getAttribute('data-action');
      this.emit('element-activated', { element, action });
    } else {
      this.emit('element-activated', { element });
    }
  }

  /**
   * 扫描可导航元素
   */
  private scanNavigableElements(): void {
    const elements = document.querySelectorAll('[data-navigable], [tabindex], button, a, input, select, textarea');
    
    elements.forEach((el) => {
      const htmlElement = el as HTMLElement;
      if (this.isFocusable(htmlElement)) {
        this.register(htmlElement, {
          group: htmlElement.getAttribute('data-nav-group') || 'default',
          priority: parseInt(htmlElement.getAttribute('data-nav-priority') || '0')
        });
      }
    });
  }

  /**
   * 处理DOM变化
   */
  private handleMutation(mutations: MutationRecord[]): void {
    let needsRescan = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        needsRescan = true;
        break;
      } else if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLElement;
        const id = this.findElementId(target);
        
        if (id) {
          this.updateElement(id);
        } else if (this.isFocusable(target)) {
          this.register(target);
        }
      }
    }
    
    if (needsRescan) {
      // 延迟重新扫描，避免频繁操作
      setTimeout(() => this.scanNavigableElements(), 100);
    }
  }

  /**
   * 更新元素状态
   */
  private updateElement(id: string): void {
    const element = this.elements.get(id);
    if (!element) return;
    
    element.visible = this.isVisible(element.element);
    element.focusable = this.isFocusable(element.element);
    element.bounds = element.element.getBoundingClientRect();
  }

  /**
   * 检查元素是否可见
   */
  private isVisible(element: HTMLElement): boolean {
    if (element.hidden || element.style.display === 'none') {
      return false;
    }
    
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * 检查元素是否可聚焦
   */
  private isFocusable(element: HTMLElement): boolean {
    if (element.hasAttribute('disabled') || element.getAttribute('tabindex') === '-1') {
      return false;
    }
    
    const tagName = element.tagName.toLowerCase();
    const focusableTags = ['button', 'a', 'input', 'select', 'textarea'];
    
    return (
      focusableTags.includes(tagName) ||
      element.hasAttribute('tabindex') ||
      element.hasAttribute('data-navigable')
    );
  }

  /**
   * 检查是否为输入元素
   */
  private isInputElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || element.contentEditable === 'true';
  }

  /**
   * 检查是否应该在输入元素中处理导航
   */
  private shouldHandleInInput(event: KeyboardEvent): boolean {
    // 在某些情况下，即使在输入元素中也要处理导航
    return event.ctrlKey || event.altKey || event.metaKey;
  }

  /**
   * 滚动到元素
   */
  private scrollToElement(element: HTMLElement): void {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
  }

  /**
   * 查找元素ID
   */
  private findElementId(element: HTMLElement): string | null {
    for (const [id, navElement] of this.elements) {
      if (navElement.element === element) {
        return id;
      }
    }
    return null;
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    document.removeEventListener('keydown', this.keydownHandler, true);
    this.observer.disconnect();
    this.elements.clear();
    this.removeAllListeners();
  }
}

// 创建全局实例
export const keyboardNavigationManager = new KeyboardNavigationManager();
