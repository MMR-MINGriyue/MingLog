/**
 * MingLog 响应式布局组件
 * 提供适配不同屏幕尺寸的布局管理
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  enableSidebar?: boolean;
  enableRightPanel?: boolean;
  sidebarWidth?: number;
  rightPanelWidth?: number;
  collapsible?: boolean;
}

export interface LayoutState {
  sidebarCollapsed: boolean;
  rightPanelCollapsed: boolean;
  mobileMenuOpen: boolean;
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop';
}

const BREAKPOINTS = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)'
};

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className = '',
  enableSidebar = true,
  enableRightPanel = true,
  sidebarWidth = 280,
  rightPanelWidth = 320,
  collapsible = true
}) => {
  // 媒体查询
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  const isTablet = useMediaQuery(BREAKPOINTS.tablet);
  const isDesktop = useMediaQuery(BREAKPOINTS.desktop);

  // 布局状态
  const [layoutState, setLayoutState] = useLocalStorage<LayoutState>('minglog-layout-state', {
    sidebarCollapsed: false,
    rightPanelCollapsed: false,
    mobileMenuOpen: false,
    currentBreakpoint: 'desktop'
  });

  // 更新当前断点
  useEffect(() => {
    let breakpoint: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    
    if (isMobile) {
      breakpoint = 'mobile';
    } else if (isTablet) {
      breakpoint = 'tablet';
    }

    setLayoutState(prev => ({
      ...prev,
      currentBreakpoint: breakpoint,
      // 移动端自动折叠侧边栏
      sidebarCollapsed: isMobile ? true : prev.sidebarCollapsed,
      // 平板和移动端自动折叠右侧面板
      rightPanelCollapsed: (isMobile || isTablet) ? true : prev.rightPanelCollapsed
    }));
  }, [isMobile, isTablet, setLayoutState]);

  // 切换侧边栏
  const toggleSidebar = useCallback(() => {
    setLayoutState(prev => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed
    }));
  }, [setLayoutState]);

  // 切换右侧面板
  const toggleRightPanel = useCallback(() => {
    setLayoutState(prev => ({
      ...prev,
      rightPanelCollapsed: !prev.rightPanelCollapsed
    }));
  }, [setLayoutState]);

  // 切换移动端菜单
  const toggleMobileMenu = useCallback(() => {
    setLayoutState(prev => ({
      ...prev,
      mobileMenuOpen: !prev.mobileMenuOpen
    }));
  }, [setLayoutState]);

  // 关闭移动端菜单
  const closeMobileMenu = useCallback(() => {
    setLayoutState(prev => ({
      ...prev,
      mobileMenuOpen: false
    }));
  }, [setLayoutState]);

  // 计算布局样式
  const getLayoutStyles = () => {
    const styles: React.CSSProperties = {
      display: 'grid',
      height: '100vh',
      overflow: 'hidden'
    };

    if (isMobile) {
      // 移动端布局
      styles.gridTemplateColumns = '1fr';
      styles.gridTemplateRows = 'auto 1fr';
      styles.gridTemplateAreas = '"header" "main"';
    } else {
      // 桌面端布局
      const columns = [];
      let areas = '';

      if (enableSidebar && !layoutState.sidebarCollapsed) {
        columns.push(`${sidebarWidth}px`);
        areas += 'sidebar ';
      }

      columns.push('1fr');
      areas += 'main ';

      if (enableRightPanel && !layoutState.rightPanelCollapsed) {
        columns.push(`${rightPanelWidth}px`);
        areas += 'rightpanel';
      }

      styles.gridTemplateColumns = columns.join(' ');
      styles.gridTemplateAreas = `"${areas.trim()}"`;
    }

    return styles;
  };

  // 侧边栏样式
  const getSidebarStyles = (): React.CSSProperties => {
    if (isMobile) {
      return {
        position: 'fixed',
        top: 0,
        left: layoutState.mobileMenuOpen ? 0 : -sidebarWidth,
        width: sidebarWidth,
        height: '100vh',
        zIndex: 1000,
        transition: 'left 0.3s ease',
        backgroundColor: 'var(--sidebar-bg, #f8f9fa)',
        borderRight: '1px solid var(--border-color, #e9ecef)',
        overflow: 'auto'
      };
    }

    return {
      gridArea: 'sidebar',
      backgroundColor: 'var(--sidebar-bg, #f8f9fa)',
      borderRight: '1px solid var(--border-color, #e9ecef)',
      overflow: 'auto',
      transition: 'width 0.3s ease'
    };
  };

  // 右侧面板样式
  const getRightPanelStyles = (): React.CSSProperties => {
    return {
      gridArea: 'rightpanel',
      backgroundColor: 'var(--panel-bg, #ffffff)',
      borderLeft: '1px solid var(--border-color, #e9ecef)',
      overflow: 'auto',
      transition: 'width 0.3s ease'
    };
  };

  // 主内容区样式
  const getMainStyles = (): React.CSSProperties => {
    return {
      gridArea: 'main',
      overflow: 'auto',
      position: 'relative'
    };
  };

  return (
    <div 
      className={`responsive-layout ${className}`}
      style={getLayoutStyles()}
      data-breakpoint={layoutState.currentBreakpoint}
    >
      {/* 移动端遮罩层 */}
      {isMobile && layoutState.mobileMenuOpen && (
        <div
          className="mobile-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={closeMobileMenu}
        />
      )}

      {/* 移动端头部 */}
      {isMobile && (
        <header
          className="mobile-header"
          style={{
            gridArea: 'header',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            height: '56px',
            backgroundColor: 'var(--header-bg, #ffffff)',
            borderBottom: '1px solid var(--border-color, #e9ecef)',
            zIndex: 100
          }}
        >
          <button
            className="mobile-menu-button"
            onClick={toggleMobileMenu}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px'
            }}
            aria-label="打开菜单"
          >
            ☰
          </button>
          
          <h1
            style={{
              margin: '0 0 0 16px',
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-color, #333333)'
            }}
          >
            MingLog
          </h1>

          <div style={{ marginLeft: 'auto' }}>
            {/* 移动端工具栏 */}
            <MobileToolbar />
          </div>
        </header>
      )}

      {/* 侧边栏 */}
      {enableSidebar && (
        <aside
          className={`sidebar ${layoutState.sidebarCollapsed ? 'collapsed' : ''}`}
          style={getSidebarStyles()}
          data-testid="sidebar"
        >
          <SidebarContent 
            collapsed={layoutState.sidebarCollapsed}
            onToggle={toggleSidebar}
            isMobile={isMobile}
            onMobileClose={closeMobileMenu}
          />
        </aside>
      )}

      {/* 主内容区 */}
      <main
        className="main-content"
        style={getMainStyles()}
        data-testid="main-content"
      >
        {/* 桌面端工具栏 */}
        {!isMobile && (
          <div
            className="desktop-toolbar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 24px',
              borderBottom: '1px solid var(--border-color, #e9ecef)',
              backgroundColor: 'var(--toolbar-bg, #ffffff)'
            }}
          >
            <div className="toolbar-left">
              {collapsible && enableSidebar && (
                <button
                  onClick={toggleSidebar}
                  className="toolbar-button"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                  aria-label={layoutState.sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
                >
                  {layoutState.sidebarCollapsed ? '→' : '←'}
                </button>
              )}
            </div>

            <div className="toolbar-center">
              <DesktopToolbar />
            </div>

            <div className="toolbar-right">
              {collapsible && enableRightPanel && (
                <button
                  onClick={toggleRightPanel}
                  className="toolbar-button"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                  aria-label={layoutState.rightPanelCollapsed ? '展开右侧面板' : '折叠右侧面板'}
                >
                  {layoutState.rightPanelCollapsed ? '←' : '→'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 内容区域 */}
        <div
          className="content-area"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: isMobile ? '16px' : '24px'
          }}
        >
          {children}
        </div>
      </main>

      {/* 右侧面板 */}
      {enableRightPanel && !layoutState.rightPanelCollapsed && !isMobile && (
        <aside
          className="right-panel"
          style={getRightPanelStyles()}
          data-testid="right-panel"
        >
          <RightPanelContent />
        </aside>
      )}
    </div>
  );
};

// 侧边栏内容组件
const SidebarContent: React.FC<{
  collapsed: boolean;
  onToggle: () => void;
  isMobile: boolean;
  onMobileClose: () => void;
}> = ({ collapsed, onToggle, isMobile, onMobileClose }) => {
  return (
    <div className="sidebar-content">
      <div
        className="sidebar-header"
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-color, #e9ecef)'
        }}
      >
        {!collapsed && (
          <h2
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text-color, #333333)'
            }}
          >
            导航
          </h2>
        )}
        
        {isMobile && (
          <button
            onClick={onMobileClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer'
            }}
            aria-label="关闭菜单"
          >
            ×
          </button>
        )}
      </div>

      <nav className="sidebar-nav" style={{ padding: '16px' }}>
        {/* 导航项目 */}
        <SidebarNavItems collapsed={collapsed} />
      </nav>
    </div>
  );
};

// 导航项目组件
const SidebarNavItems: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  const navItems = [
    { id: 'pages', label: '页面', icon: '📄' },
    { id: 'graph', label: '图谱', icon: '🕸️' },
    { id: 'search', label: '搜索', icon: '🔍' },
    { id: 'tags', label: '标签', icon: '🏷️' },
    { id: 'recent', label: '最近', icon: '🕒' }
  ];

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {navItems.map(item => (
        <li key={item.id} style={{ marginBottom: '8px' }}>
          <a
            href={`#${item.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              textDecoration: 'none',
              color: 'var(--text-color, #333333)',
              borderRadius: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg, #f0f0f0)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '16px', marginRight: collapsed ? 0 : '12px' }}>
              {item.icon}
            </span>
            {!collapsed && <span>{item.label}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
};

// 右侧面板内容
const RightPanelContent: React.FC = () => {
  return (
    <div className="right-panel-content">
      <div
        className="panel-header"
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-color, #e9ecef)'
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-color, #333333)'
          }}
        >
          信息面板
        </h3>
      </div>

      <div className="panel-body" style={{ padding: '16px' }}>
        {/* 面板内容 */}
        <div>反向链接、大纲等内容</div>
      </div>
    </div>
  );
};

// 移动端工具栏
const MobileToolbar: React.FC = () => {
  return (
    <div className="mobile-toolbar">
      <button
        style={{
          background: 'none',
          border: 'none',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '8px',
          marginLeft: '8px'
        }}
        aria-label="搜索"
      >
        🔍
      </button>
    </div>
  );
};

// 桌面端工具栏
const DesktopToolbar: React.FC = () => {
  return (
    <div className="desktop-toolbar-content">
      {/* 工具栏内容 */}
    </div>
  );
};

export default ResponsiveLayout;
