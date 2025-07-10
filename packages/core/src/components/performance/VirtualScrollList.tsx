/**
 * MingLog 虚拟滚动列表组件
 * 优化大列表性能，支持动态高度和懒加载
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export interface VirtualScrollItem {
  id: string;
  height?: number;
  data: any;
}

export interface VirtualScrollListProps<T = any> {
  /** 列表项数据 */
  items: VirtualScrollItem[];
  /** 容器高度 */
  height: number;
  /** 默认项目高度 */
  itemHeight?: number;
  /** 渲染项目的函数 */
  renderItem: (item: VirtualScrollItem, index: number) => React.ReactNode;
  /** 缓冲区大小（屏幕外渲染的项目数） */
  overscan?: number;
  /** 是否启用动态高度 */
  dynamicHeight?: boolean;
  /** 加载更多回调 */
  onLoadMore?: () => void;
  /** 是否有更多数据 */
  hasMore?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 滚动回调 */
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  /** 自定义类名 */
  className?: string;
}

export const VirtualScrollList = <T,>({
  items,
  height,
  itemHeight = 50,
  renderItem,
  overscan = 5,
  dynamicHeight = false,
  onLoadMore,
  hasMore = false,
  loading = false,
  onScroll,
  className = ''
}: VirtualScrollListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<Map<string, number>>(new Map());
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // 计算项目位置和高度
  const itemPositions = useMemo(() => {
    const positions: Array<{ top: number; height: number }> = [];
    let top = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const height = dynamicHeight 
        ? (itemHeights.get(item.id) || item.height || itemHeight)
        : itemHeight;
      
      positions.push({ top, height });
      top += height;
    }

    return positions;
  }, [items, itemHeights, itemHeight, dynamicHeight]);

  // 计算总高度
  const totalHeight = useMemo(() => {
    if (itemPositions.length === 0) return 0;
    const lastPosition = itemPositions[itemPositions.length - 1];
    return lastPosition.top + lastPosition.height;
  }, [itemPositions]);

  // 计算可见范围
  const visibleRange = useMemo(() => {
    if (itemPositions.length === 0) {
      return { start: 0, end: 0 };
    }

    let start = 0;
    let end = itemPositions.length - 1;

    // 找到第一个可见项目
    for (let i = 0; i < itemPositions.length; i++) {
      const position = itemPositions[i];
      if (position.top + position.height > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
    }

    // 找到最后一个可见项目
    for (let i = start; i < itemPositions.length; i++) {
      const position = itemPositions[i];
      if (position.top > scrollTop + height) {
        end = Math.min(itemPositions.length - 1, i + overscan);
        break;
      }
    }

    return { start, end };
  }, [itemPositions, scrollTop, height, overscan]);

  // 处理滚动事件
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const newScrollTop = target.scrollTop;
    
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    // 清除之前的超时
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // 设置新的超时来检测滚动结束
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    // 调用外部滚动回调
    if (onScroll) {
      onScroll(newScrollTop, target.scrollHeight, target.clientHeight);
    }

    // 检查是否需要加载更多
    if (hasMore && !loading && onLoadMore) {
      const threshold = 200; // 距离底部200px时触发加载
      if (target.scrollHeight - target.scrollTop - target.clientHeight < threshold) {
        onLoadMore();
      }
    }
  }, [onScroll, hasMore, loading, onLoadMore]);

  // 更新项目高度（用于动态高度）
  const updateItemHeight = useCallback((itemId: string, height: number) => {
    if (dynamicHeight) {
      setItemHeights(prev => {
        const newHeights = new Map(prev);
        newHeights.set(itemId, height);
        return newHeights;
      });
    }
  }, [dynamicHeight]);

  // 滚动到指定项目
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!containerRef.current || index < 0 || index >= items.length) return;

    const position = itemPositions[index];
    if (!position) return;

    let scrollTop = position.top;

    if (align === 'center') {
      scrollTop = position.top - (height - position.height) / 2;
    } else if (align === 'end') {
      scrollTop = position.top - height + position.height;
    }

    containerRef.current.scrollTop = Math.max(0, scrollTop);
  }, [itemPositions, items.length, height]);

  // 获取可见项目
  const visibleItems = useMemo(() => {
    const items_to_render = [];
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i >= 0 && i < items.length) {
        const item = items[i];
        const position = itemPositions[i];
        
        items_to_render.push({
          index: i,
          item,
          style: {
            position: 'absolute' as const,
            top: position.top,
            height: position.height,
            width: '100%'
          }
        });
      }
    }
    
    return items_to_render;
  }, [visibleRange, items, itemPositions]);

  // 清理超时
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`virtual-scroll-list ${className} ${isScrolling ? 'scrolling' : ''}`}
      style={{ height, overflow: 'auto' }}
      onScroll={handleScroll}
      data-testid="virtual-scroll-list"
    >
      {/* 虚拟容器，用于设置正确的滚动高度 */}
      <div
        className="virtual-scroll-spacer"
        style={{ height: totalHeight, position: 'relative' }}
        data-testid="virtual-scroll-spacer"
      >
        {/* 渲染可见项目 */}
        {visibleItems.map(({ index, item, style }) => (
          <VirtualScrollItem
            key={item.id}
            item={item}
            index={index}
            style={style}
            renderItem={renderItem}
            onHeightChange={updateItemHeight}
            dynamicHeight={dynamicHeight}
          />
        ))}
        
        {/* 加载更多指示器 */}
        {loading && (
          <div
            className="virtual-scroll-loading"
            data-testid="virtual-scroll-loading"
            style={{
              position: 'absolute',
              top: totalHeight,
              width: '100%',
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div className="loading-spinner" />
            <span>加载中...</span>
          </div>
        )}
      </div>
    </div>
  );
};

// 虚拟滚动项目组件
interface VirtualScrollItemProps {
  item: VirtualScrollItem;
  index: number;
  style: React.CSSProperties;
  renderItem: (item: VirtualScrollItem, index: number) => React.ReactNode;
  onHeightChange: (itemId: string, height: number) => void;
  dynamicHeight: boolean;
}

const VirtualScrollItem: React.FC<VirtualScrollItemProps> = ({
  item,
  index,
  style,
  renderItem,
  onHeightChange,
  dynamicHeight
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  // 测量项目高度
  useEffect(() => {
    if (dynamicHeight && itemRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const height = entry.contentRect.height;
          onHeightChange(item.id, height);
        }
      });

      resizeObserver.observe(itemRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [item.id, onHeightChange, dynamicHeight]);

  return (
    <div ref={itemRef} style={style} className="virtual-scroll-item">
      {renderItem(item, index)}
    </div>
  );
};

export default VirtualScrollList;
