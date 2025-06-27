/**
 * Layout Types for MingLog
 * Defines the structure and types for layout customization
 */

export type SidebarPosition = 'left' | 'right';
export type PanelPosition = 'bottom' | 'right' | 'floating';
export type ToolbarPosition = 'top' | 'bottom' | 'hidden';
export type ViewMode = 'editor' | 'preview' | 'split';

export interface SidebarConfig {
  position: SidebarPosition;
  width: number;
  minWidth: number;
  maxWidth: number;
  isCollapsed: boolean;
  isResizable: boolean;
  showToggleButton: boolean;
}

export interface PanelConfig {
  position: PanelPosition;
  width: number;
  height: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  isVisible: boolean;
  isResizable: boolean;
  tabs: string[];
  activeTab: string;
}

export interface ToolbarConfig {
  position: ToolbarPosition;
  height: number;
  isVisible: boolean;
  showLabels: boolean;
  compactMode: boolean;
  customButtons: string[];
}

export interface EditorConfig {
  viewMode: ViewMode;
  showLineNumbers: boolean;
  showMinimap: boolean;
  wordWrap: boolean;
  tabSize: number;
  insertSpaces: boolean;
  renderWhitespace: boolean;
}

export interface LayoutConfig {
  sidebar: SidebarConfig;
  panel: PanelConfig;
  toolbar: ToolbarConfig;
  editor: EditorConfig;
  showStatusBar: boolean;
  showBreadcrumb: boolean;
  showActivityBar: boolean;
  fullscreenMode: boolean;
  zenMode: boolean;
}

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: LayoutConfig;
}

export interface LayoutContextValue {
  config: LayoutConfig;
  presets: LayoutPreset[];
  updateConfig: (updates: Partial<LayoutConfig>) => void;
  updateSidebar: (updates: Partial<SidebarConfig>) => void;
  updatePanel: (updates: Partial<PanelConfig>) => void;
  updateToolbar: (updates: Partial<ToolbarConfig>) => void;
  updateEditor: (updates: Partial<EditorConfig>) => void;
  applyPreset: (preset: LayoutPreset) => void;
  resetToDefault: () => void;
  toggleSidebar: () => void;
  togglePanel: () => void;
  toggleFullscreen: () => void;
  toggleZenMode: () => void;
  saveAsPreset: (name: string, description: string) => void;
  deletePreset: (id: string) => void;
}

// 默认布局配置
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  sidebar: {
    position: 'left',
    width: 280,
    minWidth: 200,
    maxWidth: 500,
    isCollapsed: false,
    isResizable: true,
    showToggleButton: true,
  },
  panel: {
    position: 'bottom',
    width: 300,
    height: 200,
    minWidth: 200,
    maxWidth: 600,
    minHeight: 150,
    maxHeight: 400,
    isVisible: false,
    isResizable: true,
    tabs: ['outline', 'search', 'files'],
    activeTab: 'outline',
  },
  toolbar: {
    position: 'top',
    height: 40,
    isVisible: true,
    showLabels: false,
    compactMode: false,
    customButtons: ['new', 'save', 'export', 'theme'],
  },
  editor: {
    viewMode: 'editor',
    showLineNumbers: true,
    showMinimap: false,
    wordWrap: true,
    tabSize: 2,
    insertSpaces: true,
    renderWhitespace: false,
  },
  showStatusBar: true,
  showBreadcrumb: true,
  showActivityBar: true,
  fullscreenMode: false,
  zenMode: false,
};

// 预设布局
export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'default',
    name: '默认布局',
    description: '标准的三栏布局，适合大多数使用场景',
    icon: '🏠',
    config: DEFAULT_LAYOUT_CONFIG,
  },
  {
    id: 'minimal',
    name: '简洁模式',
    description: '隐藏辅助面板，专注于内容编辑',
    icon: '✨',
    config: {
      ...DEFAULT_LAYOUT_CONFIG,
      sidebar: { ...DEFAULT_LAYOUT_CONFIG.sidebar, isCollapsed: true },
      panel: { ...DEFAULT_LAYOUT_CONFIG.panel, isVisible: false },
      toolbar: { ...DEFAULT_LAYOUT_CONFIG.toolbar, compactMode: true },
      showActivityBar: false,
    },
  },
  {
    id: 'writing',
    name: '写作模式',
    description: '优化的写作环境，减少干扰元素',
    icon: '✍️',
    config: {
      ...DEFAULT_LAYOUT_CONFIG,
      sidebar: { ...DEFAULT_LAYOUT_CONFIG.sidebar, width: 240, isCollapsed: true },
      panel: { ...DEFAULT_LAYOUT_CONFIG.panel, isVisible: false },
      editor: { 
        ...DEFAULT_LAYOUT_CONFIG.editor, 
        showLineNumbers: false,
        wordWrap: true,
      },
      showStatusBar: false,
      showBreadcrumb: false,
    },
  },
  {
    id: 'development',
    name: '开发模式',
    description: '适合代码编辑和文档开发的布局',
    icon: '💻',
    config: {
      ...DEFAULT_LAYOUT_CONFIG,
      sidebar: { ...DEFAULT_LAYOUT_CONFIG.sidebar, width: 320 },
      panel: { 
        ...DEFAULT_LAYOUT_CONFIG.panel, 
        isVisible: true,
        position: 'right',
        width: 350,
      },
      editor: {
        ...DEFAULT_LAYOUT_CONFIG.editor,
        showLineNumbers: true,
        showMinimap: true,
        viewMode: 'split',
        renderWhitespace: true,
      },
    },
  },
  {
    id: 'presentation',
    name: '演示模式',
    description: '全屏预览模式，适合演示和展示',
    icon: '📺',
    config: {
      ...DEFAULT_LAYOUT_CONFIG,
      sidebar: { ...DEFAULT_LAYOUT_CONFIG.sidebar, isCollapsed: true },
      panel: { ...DEFAULT_LAYOUT_CONFIG.panel, isVisible: false },
      toolbar: { ...DEFAULT_LAYOUT_CONFIG.toolbar, isVisible: false },
      editor: { ...DEFAULT_LAYOUT_CONFIG.editor, viewMode: 'preview' },
      showStatusBar: false,
      showBreadcrumb: false,
      showActivityBar: false,
      fullscreenMode: true,
    },
  },
  {
    id: 'zen',
    name: '专注模式',
    description: '极简界面，专注于内容创作',
    icon: '🧘',
    config: {
      ...DEFAULT_LAYOUT_CONFIG,
      sidebar: { ...DEFAULT_LAYOUT_CONFIG.sidebar, isCollapsed: true },
      panel: { ...DEFAULT_LAYOUT_CONFIG.panel, isVisible: false },
      toolbar: { ...DEFAULT_LAYOUT_CONFIG.toolbar, isVisible: false },
      editor: { 
        ...DEFAULT_LAYOUT_CONFIG.editor, 
        showLineNumbers: false,
        showMinimap: false,
      },
      showStatusBar: false,
      showBreadcrumb: false,
      showActivityBar: false,
      zenMode: true,
    },
  },
];

// 布局验证函数
export const validateLayoutConfig = (config: Partial<LayoutConfig>): boolean => {
  try {
    if (config.sidebar) {
      const { width, minWidth, maxWidth } = config.sidebar;
      if (width < minWidth || width > maxWidth) return false;
    }
    
    if (config.panel) {
      const { width, height, minWidth, maxWidth, minHeight, maxHeight } = config.panel;
      if (width < minWidth || width > maxWidth) return false;
      if (height < minHeight || height > maxHeight) return false;
    }
    
    if (config.toolbar) {
      const { height } = config.toolbar;
      if (height < 30 || height > 80) return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// 布局工具函数
export const layoutUtils = {
  // 计算内容区域尺寸
  calculateContentArea: (config: LayoutConfig, windowSize: { width: number; height: number }) => {
    const { width: windowWidth, height: windowHeight } = windowSize;
    
    let contentWidth = windowWidth;
    let contentHeight = windowHeight;
    
    // 减去侧边栏宽度
    if (!config.sidebar.isCollapsed) {
      contentWidth -= config.sidebar.width;
    }
    
    // 减去面板宽度/高度
    if (config.panel.isVisible) {
      if (config.panel.position === 'right') {
        contentWidth -= config.panel.width;
      } else if (config.panel.position === 'bottom') {
        contentHeight -= config.panel.height;
      }
    }
    
    // 减去工具栏高度
    if (config.toolbar.isVisible) {
      contentHeight -= config.toolbar.height;
    }
    
    // 减去状态栏高度
    if (config.showStatusBar) {
      contentHeight -= 24;
    }
    
    return { width: contentWidth, height: contentHeight };
  },
  
  // 检查布局是否适合当前屏幕
  isLayoutSuitableForScreen: (config: LayoutConfig, screenSize: { width: number; height: number }) => {
    const minRequiredWidth = config.sidebar.minWidth + 400; // 最小内容区域
    const minRequiredHeight = config.toolbar.height + config.panel.minHeight + 300;
    
    return screenSize.width >= minRequiredWidth && screenSize.height >= minRequiredHeight;
  },
  
  // 自动调整布局以适应屏幕
  adaptLayoutToScreen: (config: LayoutConfig, screenSize: { width: number; height: number }): LayoutConfig => {
    const adapted = { ...config };
    
    // 小屏幕自动折叠侧边栏
    if (screenSize.width < 768) {
      adapted.sidebar.isCollapsed = true;
      adapted.panel.isVisible = false;
    }
    
    // 超小屏幕隐藏更多元素
    if (screenSize.width < 480) {
      adapted.toolbar.compactMode = true;
      adapted.showActivityBar = false;
    }
    
    return adapted;
  },
};
