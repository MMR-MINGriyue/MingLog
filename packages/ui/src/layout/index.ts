/**
 * Layout System Entry Point
 * Exports all layout-related functionality
 */

// Types
export type {
  SidebarPosition,
  PanelPosition,
  ToolbarPosition,
  ViewMode,
  SidebarConfig,
  PanelConfig,
  ToolbarConfig,
  EditorConfig,
  LayoutConfig,
  LayoutPreset,
  LayoutContextValue,
} from '../types/layout';

// Constants and Defaults
export {
  DEFAULT_LAYOUT_CONFIG,
  LAYOUT_PRESETS,
  validateLayoutConfig,
  layoutUtils,
} from '../types/layout';

// Provider and Hooks
export {
  LayoutProvider,
  useLayout,
  useLayoutStyles,
  useResponsiveLayout,
} from './LayoutProvider';

// Components
export {
  LayoutSettings,
  LayoutSettingsModal,
} from '../components/LayoutSettings';

export {
  LayoutControls,
  LayoutStatus,
} from '../components/LayoutControls';

// Utility functions
export const createLayoutPreset = (
  name: string,
  description: string,
  config: Partial<LayoutConfig>
): LayoutPreset => {
  const { DEFAULT_LAYOUT_CONFIG } = require('../types/layout');
  return {
    id: `custom-${Date.now()}`,
    name,
    description,
    icon: '⚙️',
    config: { ...DEFAULT_LAYOUT_CONFIG, ...config },
  };
};

export const mergeLayoutConfigs = (
  base: LayoutConfig,
  override: Partial<LayoutConfig>
): LayoutConfig => {
  return {
    ...base,
    ...override,
    sidebar: { ...base.sidebar, ...override.sidebar },
    panel: { ...base.panel, ...override.panel },
    toolbar: { ...base.toolbar, ...override.toolbar },
    editor: { ...base.editor, ...override.editor },
  };
};

// Layout CSS classes
export const layoutClasses = {
  // Container classes
  container: 'layout-container',
  
  // Sidebar classes
  sidebar: {
    base: 'layout-sidebar',
    left: 'layout-sidebar-left',
    right: 'layout-sidebar-right',
    collapsed: 'sidebar-collapsed',
    expanded: 'sidebar-expanded',
  },
  
  // Panel classes
  panel: {
    base: 'layout-panel',
    bottom: 'layout-panel-bottom',
    right: 'layout-panel-right',
    floating: 'layout-panel-floating',
    visible: 'panel-visible',
    hidden: 'panel-hidden',
  },
  
  // Toolbar classes
  toolbar: {
    base: 'layout-toolbar',
    top: 'layout-toolbar-top',
    bottom: 'layout-toolbar-bottom',
    hidden: 'layout-toolbar-hidden',
  },
  
  // Main content classes
  main: 'layout-main',
  
  // Status bar classes
  statusBar: 'layout-status-bar',
  
  // Activity bar classes
  activityBar: 'layout-activity-bar',
  
  // Mode classes
  fullscreen: 'fullscreen-mode',
  zen: 'zen-mode',
  
  // Animation classes
  animations: {
    slideInLeft: 'layout-slide-in-left',
    slideOutLeft: 'layout-slide-out-left',
    slideInRight: 'layout-slide-in-right',
    slideOutRight: 'layout-slide-out-right',
    fadeIn: 'layout-fade-in',
    fadeOut: 'layout-fade-out',
  },
  
  // Utility classes
  utils: {
    hidden: 'layout-hidden',
    collapsed: 'layout-collapsed',
    expanded: 'layout-expanded',
    noTransition: 'layout-no-transition',
  },
};

// Layout breakpoints
export const layoutBreakpoints = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  
  // Specific breakpoints
  sm: '(max-width: 640px)',
  md: '(min-width: 641px) and (max-width: 1024px)',
  lg: '(min-width: 1025px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
};

// Layout utilities
export const layoutHelpers = {
  // Check if layout is suitable for screen size
  isLayoutSuitableForScreen: (
    config: LayoutConfig,
    screenSize: { width: number; height: number }
  ): boolean => {
    const minRequiredWidth = config.sidebar.minWidth + 400;
    const minRequiredHeight = config.toolbar.height + config.panel.minHeight + 300;
    
    return screenSize.width >= minRequiredWidth && screenSize.height >= minRequiredHeight;
  },
  
  // Calculate content area dimensions
  calculateContentArea: (
    config: LayoutConfig,
    windowSize: { width: number; height: number }
  ) => {
    let { width, height } = windowSize;
    
    // Subtract sidebar width
    if (!config.sidebar.isCollapsed) {
      width -= config.sidebar.width;
    }
    
    // Subtract panel dimensions
    if (config.panel.isVisible) {
      if (config.panel.position === 'right') {
        width -= config.panel.width;
      } else if (config.panel.position === 'bottom') {
        height -= config.panel.height;
      }
    }
    
    // Subtract toolbar height
    if (config.toolbar.isVisible) {
      height -= config.toolbar.height;
    }
    
    // Subtract status bar height
    if (config.showStatusBar) {
      height -= 24;
    }
    
    return { width: Math.max(0, width), height: Math.max(0, height) };
  },
  
  // Generate CSS variables for layout
  generateLayoutCSS: (config: LayoutConfig): Record<string, string> => {
    return {
      '--sidebar-width': `${config.sidebar.width}px`,
      '--sidebar-min-width': `${config.sidebar.minWidth}px`,
      '--sidebar-max-width': `${config.sidebar.maxWidth}px`,
      '--panel-width': `${config.panel.width}px`,
      '--panel-height': `${config.panel.height}px`,
      '--panel-min-width': `${config.panel.minWidth}px`,
      '--panel-max-width': `${config.panel.maxWidth}px`,
      '--panel-min-height': `${config.panel.minHeight}px`,
      '--panel-max-height': `${config.panel.maxHeight}px`,
      '--toolbar-height': `${config.toolbar.height}px`,
    };
  },
  
  // Get layout class names based on config
  getLayoutClasses: (config: LayoutConfig): string[] => {
    const classes = [layoutClasses.container];
    
    // Sidebar classes
    classes.push(
      config.sidebar.position === 'left' 
        ? layoutClasses.sidebar.left 
        : layoutClasses.sidebar.right
    );
    
    if (config.sidebar.isCollapsed) {
      classes.push(layoutClasses.sidebar.collapsed);
    }
    
    // Panel classes
    if (config.panel.isVisible) {
      classes.push(layoutClasses.panel.visible);
      if (config.panel.position === 'bottom') {
        classes.push(layoutClasses.panel.bottom);
      } else if (config.panel.position === 'floating') {
        classes.push(layoutClasses.panel.floating);
      }
    } else {
      classes.push(layoutClasses.panel.hidden);
    }
    
    // Toolbar classes
    if (config.toolbar.isVisible) {
      classes.push(
        config.toolbar.position === 'top' 
          ? layoutClasses.toolbar.top 
          : layoutClasses.toolbar.bottom
      );
    } else {
      classes.push(layoutClasses.toolbar.hidden);
    }
    
    // Mode classes
    if (config.fullscreenMode) {
      classes.push(layoutClasses.fullscreen);
    }
    
    if (config.zenMode) {
      classes.push(layoutClasses.zen);
    }
    
    return classes;
  },
  
  // Adapt layout for mobile devices
  adaptForMobile: (config: LayoutConfig): LayoutConfig => {
    return {
      ...config,
      sidebar: { ...config.sidebar, isCollapsed: true },
      panel: { ...config.panel, isVisible: false },
      toolbar: { ...config.toolbar, compactMode: true },
      showActivityBar: false,
    };
  },
  
  // Adapt layout for tablet devices
  adaptForTablet: (config: LayoutConfig): LayoutConfig => {
    return {
      ...config,
      sidebar: { ...config.sidebar, width: Math.min(config.sidebar.width, 240) },
      panel: { 
        ...config.panel, 
        width: Math.min(config.panel.width, 280),
        height: Math.min(config.panel.height, 180),
      },
    };
  },
};

// Layout validation
export const validateLayout = {
  // Validate sidebar configuration
  sidebar: (config: SidebarConfig): boolean => {
    return (
      config.width >= config.minWidth &&
      config.width <= config.maxWidth &&
      ['left', 'right'].includes(config.position)
    );
  },
  
  // Validate panel configuration
  panel: (config: PanelConfig): boolean => {
    return (
      config.width >= config.minWidth &&
      config.width <= config.maxWidth &&
      config.height >= config.minHeight &&
      config.height <= config.maxHeight &&
      ['bottom', 'right', 'floating'].includes(config.position)
    );
  },
  
  // Validate toolbar configuration
  toolbar: (config: ToolbarConfig): boolean => {
    return (
      config.height >= 30 &&
      config.height <= 80 &&
      ['top', 'bottom', 'hidden'].includes(config.position)
    );
  },
  
  // Validate complete layout configuration
  complete: (config: LayoutConfig): boolean => {
    return (
      validateLayout.sidebar(config.sidebar) &&
      validateLayout.panel(config.panel) &&
      validateLayout.toolbar(config.toolbar)
    );
  },
};

// Default export
export default {
  LayoutProvider,
  useLayout,
  useLayoutStyles,
  useResponsiveLayout,
  LayoutSettings,
  LayoutControls,
  DEFAULT_LAYOUT_CONFIG,
  LAYOUT_PRESETS,
  layoutClasses,
  layoutHelpers,
  validateLayout,
};
