/**
 * Layout Provider for MingLog
 * Provides layout context and manages layout state
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  LayoutConfig, 
  LayoutContextValue, 
  LayoutPreset,
  SidebarConfig,
  PanelConfig,
  ToolbarConfig,
  EditorConfig,
  DEFAULT_LAYOUT_CONFIG,
  LAYOUT_PRESETS,
  validateLayoutConfig,
  layoutUtils
} from '../types/layout';

// Create layout context
const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

interface LayoutProviderProps {
  children: React.ReactNode;
  storageKey?: string;
  onConfigChange?: (config: LayoutConfig) => void;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({
  children,
  storageKey = 'minglog-layout-config',
  onConfigChange,
}) => {
  const [config, setConfig] = useState<LayoutConfig>(DEFAULT_LAYOUT_CONFIG);
  const [presets, setPresets] = useState<LayoutPreset[]>(LAYOUT_PRESETS);

  // Load configuration from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        if (validateLayoutConfig(parsedConfig)) {
          setConfig({ ...DEFAULT_LAYOUT_CONFIG, ...parsedConfig });
        }
      }
    } catch (error) {
      console.warn('Failed to load layout config from localStorage:', error);
    }
  }, [storageKey]);

  // Load custom presets
  useEffect(() => {
    try {
      const customPresets = localStorage.getItem(`${storageKey}-presets`);
      if (customPresets) {
        const parsed = JSON.parse(customPresets);
        setPresets([...LAYOUT_PRESETS, ...parsed]);
      }
    } catch (error) {
      console.warn('Failed to load custom presets:', error);
    }
  }, [storageKey]);

  // Save configuration to storage
  const saveConfig = useCallback((newConfig: LayoutConfig) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newConfig));
    } catch (error) {
      console.warn('Failed to save layout config to localStorage:', error);
    }
  }, [storageKey]);

  // Save custom presets
  const savePresets = useCallback((customPresets: LayoutPreset[]) => {
    try {
      const custom = customPresets.filter(p => !LAYOUT_PRESETS.find(bp => bp.id === p.id));
      localStorage.setItem(`${storageKey}-presets`, JSON.stringify(custom));
    } catch (error) {
      console.warn('Failed to save custom presets:', error);
    }
  }, [storageKey]);

  // Apply CSS variables for layout
  useEffect(() => {
    const root = document.documentElement;
    
    // Sidebar variables
    root.style.setProperty('--sidebar-width', `${config.sidebar.width}px`);
    root.style.setProperty('--sidebar-min-width', `${config.sidebar.minWidth}px`);
    root.style.setProperty('--sidebar-max-width', `${config.sidebar.maxWidth}px`);
    
    // Panel variables
    root.style.setProperty('--panel-width', `${config.panel.width}px`);
    root.style.setProperty('--panel-height', `${config.panel.height}px`);
    
    // Toolbar variables
    root.style.setProperty('--toolbar-height', `${config.toolbar.height}px`);
    
    // Layout classes
    document.body.className = document.body.className
      .replace(/layout-\w+/g, '')
      .concat(
        ` layout-sidebar-${config.sidebar.position}`,
        ` layout-panel-${config.panel.position}`,
        ` layout-toolbar-${config.toolbar.position}`,
        config.sidebar.isCollapsed ? ' sidebar-collapsed' : ' sidebar-expanded',
        config.panel.isVisible ? ' panel-visible' : ' panel-hidden',
        config.fullscreenMode ? ' fullscreen-mode' : '',
        config.zenMode ? ' zen-mode' : ''
      )
      .trim();

    onConfigChange?.(config);
  }, [config, onConfigChange]);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<LayoutConfig>) => {
    const newConfig = { ...config, ...updates };
    if (validateLayoutConfig(newConfig)) {
      setConfig(newConfig);
      saveConfig(newConfig);
    }
  }, [config, saveConfig]);

  // Update sidebar configuration
  const updateSidebar = useCallback((updates: Partial<SidebarConfig>) => {
    updateConfig({ sidebar: { ...config.sidebar, ...updates } });
  }, [config.sidebar, updateConfig]);

  // Update panel configuration
  const updatePanel = useCallback((updates: Partial<PanelConfig>) => {
    updateConfig({ panel: { ...config.panel, ...updates } });
  }, [config.panel, updateConfig]);

  // Update toolbar configuration
  const updateToolbar = useCallback((updates: Partial<ToolbarConfig>) => {
    updateConfig({ toolbar: { ...config.toolbar, ...updates } });
  }, [config.toolbar, updateConfig]);

  // Update editor configuration
  const updateEditor = useCallback((updates: Partial<EditorConfig>) => {
    updateConfig({ editor: { ...config.editor, ...updates } });
  }, [config.editor, updateConfig]);

  // Apply preset
  const applyPreset = useCallback((preset: LayoutPreset) => {
    setConfig(preset.config);
    saveConfig(preset.config);
  }, [saveConfig]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    setConfig(DEFAULT_LAYOUT_CONFIG);
    saveConfig(DEFAULT_LAYOUT_CONFIG);
  }, [saveConfig]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    updateSidebar({ isCollapsed: !config.sidebar.isCollapsed });
  }, [config.sidebar.isCollapsed, updateSidebar]);

  // Toggle panel
  const togglePanel = useCallback(() => {
    updatePanel({ isVisible: !config.panel.isVisible });
  }, [config.panel.isVisible, updatePanel]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    updateConfig({ fullscreenMode: !config.fullscreenMode });
  }, [config.fullscreenMode, updateConfig]);

  // Toggle zen mode
  const toggleZenMode = useCallback(() => {
    const zenMode = !config.zenMode;
    updateConfig({
      zenMode,
      sidebar: { ...config.sidebar, isCollapsed: zenMode },
      panel: { ...config.panel, isVisible: !zenMode },
      toolbar: { ...config.toolbar, isVisible: !zenMode },
      showStatusBar: !zenMode,
      showBreadcrumb: !zenMode,
      showActivityBar: !zenMode,
    });
  }, [config, updateConfig]);

  // Save as preset
  const saveAsPreset = useCallback((name: string, description: string) => {
    const newPreset: LayoutPreset = {
      id: `custom-${Date.now()}`,
      name,
      description,
      icon: '⚙️',
      config: { ...config },
    };
    
    const newPresets = [...presets, newPreset];
    setPresets(newPresets);
    savePresets(newPresets);
  }, [config, presets, savePresets]);

  // Delete preset
  const deletePreset = useCallback((id: string) => {
    // Don't allow deleting built-in presets
    if (LAYOUT_PRESETS.find(p => p.id === id)) return;
    
    const newPresets = presets.filter(p => p.id !== id);
    setPresets(newPresets);
    savePresets(newPresets);
  }, [presets, savePresets]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const screenSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      
      // Auto-adapt layout for small screens
      if (!layoutUtils.isLayoutSuitableForScreen(config, screenSize)) {
        const adaptedConfig = layoutUtils.adaptLayoutToScreen(config, screenSize);
        setConfig(adaptedConfig);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, [config]);

  // Context value
  const contextValue: LayoutContextValue = {
    config,
    presets,
    updateConfig,
    updateSidebar,
    updatePanel,
    updateToolbar,
    updateEditor,
    applyPreset,
    resetToDefault,
    toggleSidebar,
    togglePanel,
    toggleFullscreen,
    toggleZenMode,
    saveAsPreset,
    deletePreset,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

// Hook to use layout context
export const useLayout = (): LayoutContextValue => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

// Hook for layout-aware styles
export const useLayoutStyles = () => {
  const { config } = useLayout();
  
  return {
    // Container styles
    container: {
      display: 'grid',
      gridTemplateAreas: config.sidebar.position === 'left' 
        ? '"sidebar main panel"'
        : '"panel main sidebar"',
      gridTemplateColumns: config.sidebar.isCollapsed 
        ? 'auto 1fr auto'
        : `${config.sidebar.width}px 1fr ${config.panel.isVisible ? `${config.panel.width}px` : 'auto'}`,
      height: '100vh',
    },
    
    // Sidebar styles
    sidebar: {
      gridArea: 'sidebar',
      width: config.sidebar.isCollapsed ? 'auto' : `${config.sidebar.width}px`,
      minWidth: config.sidebar.minWidth,
      maxWidth: config.sidebar.maxWidth,
      transition: 'width 0.2s ease',
    },
    
    // Main content styles
    main: {
      gridArea: 'main',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    
    // Panel styles
    panel: {
      gridArea: 'panel',
      width: config.panel.isVisible ? `${config.panel.width}px` : '0',
      height: config.panel.position === 'bottom' ? `${config.panel.height}px` : 'auto',
      transition: 'width 0.2s ease, height 0.2s ease',
    },
    
    // Toolbar styles
    toolbar: {
      height: config.toolbar.isVisible ? `${config.toolbar.height}px` : '0',
      transition: 'height 0.2s ease',
    },
  };
};

// Hook for responsive layout
export const useResponsiveLayout = () => {
  const { config, updateConfig } = useLayout();
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenSize.width < 768;
  const isTablet = screenSize.width >= 768 && screenSize.width < 1024;
  const isDesktop = screenSize.width >= 1024;

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    contentArea: layoutUtils.calculateContentArea(config, screenSize),
  };
};
