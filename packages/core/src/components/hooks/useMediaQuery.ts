/**
 * useMediaQuery Hook
 * 响应式媒体查询钩子
 */

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // 服务端渲染时返回 false
    if (typeof window === 'undefined') {
      return false;
    }
    
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // 更新匹配状态
    const updateMatches = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 设置初始状态
    setMatches(mediaQuery.matches);

    // 添加监听器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatches);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(updateMatches);
    }

    // 清理函数
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateMatches);
      } else {
        // 兼容旧版浏览器
        mediaQuery.removeListener(updateMatches);
      }
    };
  }, [query]);

  return matches;
}

// 预定义的断点查询
export const BREAKPOINTS = {
  xs: '(max-width: 575px)',
  sm: '(min-width: 576px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 992px)',
  xl: '(min-width: 1200px)',
  xxl: '(min-width: 1400px)',
  
  // 范围查询
  smOnly: '(min-width: 576px) and (max-width: 767px)',
  mdOnly: '(min-width: 768px) and (max-width: 991px)',
  lgOnly: '(min-width: 992px) and (max-width: 1199px)',
  xlOnly: '(min-width: 1200px) and (max-width: 1399px)',
  
  // 方向查询
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  
  // 设备类型
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  
  // 高分辨率屏幕
  retina: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  
  // 用户偏好
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',
  prefersDarkScheme: '(prefers-color-scheme: dark)',
  prefersLightScheme: '(prefers-color-scheme: light)'
};

// 便捷的断点钩子
export function useBreakpoint() {
  const isXs = useMediaQuery(BREAKPOINTS.xs);
  const isSm = useMediaQuery(BREAKPOINTS.sm);
  const isMd = useMediaQuery(BREAKPOINTS.md);
  const isLg = useMediaQuery(BREAKPOINTS.lg);
  const isXl = useMediaQuery(BREAKPOINTS.xl);
  const isXxl = useMediaQuery(BREAKPOINTS.xxl);
  
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  const isTablet = useMediaQuery(BREAKPOINTS.tablet);
  const isDesktop = useMediaQuery(BREAKPOINTS.desktop);
  
  const isPortrait = useMediaQuery(BREAKPOINTS.portrait);
  const isLandscape = useMediaQuery(BREAKPOINTS.landscape);
  
  const isRetina = useMediaQuery(BREAKPOINTS.retina);
  const prefersReducedMotion = useMediaQuery(BREAKPOINTS.prefersReducedMotion);
  const prefersDarkScheme = useMediaQuery(BREAKPOINTS.prefersDarkScheme);

  // 获取当前断点名称
  const getCurrentBreakpoint = (): string => {
    if (isXxl) return 'xxl';
    if (isXl) return 'xl';
    if (isLg) return 'lg';
    if (isMd) return 'md';
    if (isSm) return 'sm';
    return 'xs';
  };

  // 获取设备类型
  const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  };

  return {
    // 断点状态
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,
    
    // 设备类型
    isMobile,
    isTablet,
    isDesktop,
    
    // 方向
    isPortrait,
    isLandscape,
    
    // 其他特性
    isRetina,
    prefersReducedMotion,
    prefersDarkScheme,
    
    // 工具函数
    getCurrentBreakpoint,
    getDeviceType,
    
    // 便捷检查函数
    isSmallScreen: isMobile,
    isMediumScreen: isTablet,
    isLargeScreen: isDesktop,
    
    // 范围检查
    isAtLeast: (breakpoint: keyof typeof BREAKPOINTS) => {
      const query = BREAKPOINTS[breakpoint];
      return useMediaQuery(query);
    },
    
    isAtMost: (breakpoint: keyof typeof BREAKPOINTS) => {
      // 这里需要根据断点计算最大宽度查询
      const breakpointValues = {
        xs: 575,
        sm: 767,
        md: 991,
        lg: 1199,
        xl: 1399,
        xxl: Infinity
      };
      
      const maxWidth = breakpointValues[breakpoint as keyof typeof breakpointValues];
      if (maxWidth === Infinity) return true;
      
      return useMediaQuery(`(max-width: ${maxWidth}px)`);
    }
  };
}

// 响应式值钩子
export function useResponsiveValue<T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  xxl?: T;
}): T | undefined {
  const { isXs, isSm, isMd, isLg, isXl, isXxl } = useBreakpoint();
  
  // 从大到小检查断点
  if (isXxl && values.xxl !== undefined) return values.xxl;
  if (isXl && values.xl !== undefined) return values.xl;
  if (isLg && values.lg !== undefined) return values.lg;
  if (isMd && values.md !== undefined) return values.md;
  if (isSm && values.sm !== undefined) return values.sm;
  if (isXs && values.xs !== undefined) return values.xs;
  
  // 如果没有匹配的断点值，返回最小的可用值
  return values.xs || values.sm || values.md || values.lg || values.xl || values.xxl;
}

// 窗口尺寸钩子
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
  }>(() => {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }
    
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    
    // 设置初始值
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowSize;
}

// 视口尺寸钩子（考虑滚动条）
export function useViewportSize() {
  const [viewportSize, setViewportSize] = useState<{
    width: number;
    height: number;
  }>(() => {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }
    
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setViewportSize({
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight
      });
    };

    window.addEventListener('resize', handleResize);
    
    // 设置初始值
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return viewportSize;
}

export default useMediaQuery;
