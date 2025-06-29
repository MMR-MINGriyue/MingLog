import { GraphConfig, GraphTheme } from '../types';

/**
 * Default configuration for graph visualization
 */
export const createDefaultConfig = (overrides: Partial<GraphConfig> = {}): GraphConfig => ({
  width: 800,
  height: 600,
  nodeRadius: 8,
  linkDistance: 100,
  linkStrength: 0.5,
  chargeStrength: -300,
  centerForce: 0.1,
  collisionRadius: 12,
  enableZoom: true,
  enableDrag: true,
  enablePan: true,
  showLabels: true,
  showTooltips: true,
  theme: 'light',
  ...overrides,
});

/**
 * Default light theme
 */
export const createDefaultTheme = (overrides: Partial<GraphTheme> = {}): GraphTheme => ({
  background: '#ffffff',
  nodeColors: {
    note: '#3b82f6',
    tag: '#10b981',
    folder: '#f59e0b',
    link: '#8b5cf6',
    page: '#3b82f6',
    block: '#6b7280',
    selected: '#ef4444',
    hovered: '#f97316',
  },
  linkColors: {
    reference: '#6b7280',
    tag: '#10b981',
    hierarchy: '#3b82f6',
    similarity: '#8b5cf6',
    selected: '#ef4444',
    hovered: '#f97316',
  },
  textColor: '#374151',
  labelBackground: '#ffffff',
  tooltipBackground: '#1f2937',
  tooltipBorder: '#374151',
  ...overrides,
});

/**
 * Default dark theme
 */
export const createDarkTheme = (overrides: Partial<GraphTheme> = {}): GraphTheme => ({
  background: '#111827',
  nodeColors: {
    note: '#60a5fa',
    tag: '#34d399',
    folder: '#fbbf24',
    link: '#a78bfa',
    page: '#60a5fa',
    block: '#9ca3af',
    selected: '#f87171',
    hovered: '#fb923c',
  },
  linkColors: {
    reference: '#9ca3af',
    tag: '#34d399',
    hierarchy: '#60a5fa',
    similarity: '#a78bfa',
    selected: '#f87171',
    hovered: '#fb923c',
  },
  textColor: '#f3f4f6',
  labelBackground: '#1f2937',
  tooltipBackground: '#374151',
  tooltipBorder: '#6b7280',
  ...overrides,
});

/**
 * Performance-optimized configuration for large graphs
 */
export const createPerformanceConfig = (nodeCount: number): Partial<GraphConfig> => {
  if (nodeCount > 1000) {
    return {
      showLabels: false,
      showTooltips: false,
      enableDrag: false,
      chargeStrength: -100,
      linkStrength: 0.1,
    };
  } else if (nodeCount > 500) {
    return {
      showLabels: false,
      chargeStrength: -200,
      linkStrength: 0.3,
    };
  }
  
  return {};
};

/**
 * Responsive configuration based on container size
 */
export const createResponsiveConfig = (width: number, _height: number): Partial<GraphConfig> => {
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  
  if (isMobile) {
    return {
      nodeRadius: 6,
      linkDistance: 60,
      showLabels: false,
      enableZoom: true,
      enableDrag: false,
    };
  } else if (isTablet) {
    return {
      nodeRadius: 7,
      linkDistance: 80,
      showLabels: true,
    };
  }
  
  return {};
};
