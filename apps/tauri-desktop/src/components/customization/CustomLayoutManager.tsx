/**
 * 自定义布局管理器组件
 * 提供可视化的布局自定义功能
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { 
  Layout, 
  Move, 
  RotateCcw, 
  Save, 
  Settings, 
  Eye, 
  EyeOff,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Grid,
  Sidebar,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react'
import { 
  LayoutConfig,
  ViewMode 
} from '../../packages/core/src/services/UserPreferencesService'

interface Panel {
  id: string
  name: string
  component: React.ComponentType<any>
  defaultWidth?: number
  defaultHeight?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  resizable: boolean
  closable: boolean
  position: 'left' | 'right' | 'top' | 'bottom' | 'center'
}

interface CustomLayoutManagerProps {
  /** 当前布局配置 */
  layout: LayoutConfig
  /** 可用的面板列表 */
  availablePanels: Panel[]
  /** 布局变更回调 */
  onLayoutChange: (layout: LayoutConfig) => void
  /** 保存布局回调 */
  onSaveLayout: (name: string, layout: LayoutConfig) => void
  /** 是否为编辑模式 */
  editMode?: boolean
  /** 类名 */
  className?: string
}

type DevicePreview = 'desktop' | 'tablet' | 'mobile'

export const CustomLayoutManager: React.FC<CustomLayoutManagerProps> = ({
  layout,
  availablePanels,
  onLayoutChange,
  onSaveLayout,
  editMode = false,
  className = ''
}) => {
  // 状态管理
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig>(layout)
  const [isEditing, setIsEditing] = useState(editMode)
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null)
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('desktop')
  const [showGrid, setShowGrid] = useState(true)
  const [draggedPanel, setDraggedPanel] = useState<string | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [layoutName, setLayoutName] = useState('')

  // 引用
  const containerRef = useRef<HTMLDivElement>(null)
  const dragOverlayRef = useRef<HTMLDivElement>(null)

  // 更新布局
  const updateLayout = useCallback((newLayout: LayoutConfig) => {
    setCurrentLayout(newLayout)
    onLayoutChange(newLayout)
  }, [onLayoutChange])

  // 切换面板可见性
  const togglePanelVisibility = useCallback((panelId: string) => {
    const newLayout = { ...currentLayout }
    if (!newLayout.panels[panelId]) {
      const panel = availablePanels.find(p => p.id === panelId)
      if (panel) {
        newLayout.panels[panelId] = {
          width: panel.defaultWidth,
          height: panel.defaultHeight,
          position: panel.position,
          visible: true,
          resizable: panel.resizable
        }
      }
    } else {
      newLayout.panels[panelId].visible = !newLayout.panels[panelId].visible
    }
    updateLayout(newLayout)
  }, [currentLayout, availablePanels, updateLayout])

  // 调整面板大小
  const resizePanel = useCallback((panelId: string, width?: number, height?: number) => {
    const newLayout = { ...currentLayout }
    if (newLayout.panels[panelId]) {
      if (width !== undefined) {
        newLayout.panels[panelId].width = width
      }
      if (height !== undefined) {
        newLayout.panels[panelId].height = height
      }
      updateLayout(newLayout)
    }
  }, [currentLayout, updateLayout])

  // 移动面板位置
  const movePanel = useCallback((panelId: string, position: 'left' | 'right' | 'top' | 'bottom') => {
    const newLayout = { ...currentLayout }
    if (newLayout.panels[panelId]) {
      newLayout.panels[panelId].position = position
      updateLayout(newLayout)
    }
  }, [currentLayout, updateLayout])

  // 重置布局
  const resetLayout = useCallback(() => {
    const defaultLayout: LayoutConfig = {
      sidebar: {
        width: 280,
        collapsed: false,
        position: 'left',
        autoHide: false
      },
      header: {
        height: 60,
        visible: true,
        fixed: true
      },
      footer: {
        height: 40,
        visible: true
      },
      panels: {},
      grid: {
        columns: 12,
        gap: 16,
        responsive: true
      }
    }
    updateLayout(defaultLayout)
  }, [updateLayout])

  // 保存布局
  const handleSaveLayout = useCallback(() => {
    if (layoutName.trim()) {
      onSaveLayout(layoutName, currentLayout)
      setSaveDialogOpen(false)
      setLayoutName('')
    }
  }, [layoutName, currentLayout, onSaveLayout])

  // 获取设备预览样式
  const getDevicePreviewStyle = useMemo(() => {
    switch (devicePreview) {
      case 'tablet':
        return { width: '768px', height: '1024px' }
      case 'mobile':
        return { width: '375px', height: '667px' }
      default:
        return { width: '100%', height: '100%' }
    }
  }, [devicePreview])

  // 渲染面板
  const renderPanel = (panel: Panel) => {
    const panelConfig = currentLayout.panels[panel.id]
    const isVisible = panelConfig?.visible ?? false
    const isSelected = selectedPanel === panel.id

    if (!isVisible && !isEditing) return null

    return (
      <div
        key={panel.id}
        className={`layout-panel ${isSelected ? 'selected' : ''} ${!isVisible ? 'hidden' : ''}`}
        style={{
          width: panelConfig?.width || panel.defaultWidth,
          height: panelConfig?.height || panel.defaultHeight,
          minWidth: panel.minWidth,
          minHeight: panel.minHeight,
          maxWidth: panel.maxWidth,
          maxHeight: panel.maxHeight
        }}
        onClick={() => isEditing && setSelectedPanel(panel.id)}
        draggable={isEditing}
        onDragStart={() => setDraggedPanel(panel.id)}
        onDragEnd={() => setDraggedPanel(null)}
      >
        {/* 面板头部 */}
        {isEditing && (
          <div className="panel-header">
            <span className="panel-title">{panel.name}</span>
            <div className="panel-controls">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  togglePanelVisibility(panel.id)
                }}
                className="panel-control-button"
                title={isVisible ? '隐藏面板' : '显示面板'}
              >
                {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                className="panel-control-button"
                title="移动面板"
              >
                <Move size={14} />
              </button>
              <button
                className="panel-control-button"
                title="面板设置"
              >
                <Settings size={14} />
              </button>
            </div>
          </div>
        )}

        {/* 面板内容 */}
        <div className="panel-content">
          {isVisible ? (
            <panel.component />
          ) : (
            <div className="panel-placeholder">
              <div className="placeholder-content">
                <Layout size={24} />
                <span>{panel.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* 调整大小手柄 */}
        {isEditing && panel.resizable && (
          <>
            <div className="resize-handle resize-handle-right" />
            <div className="resize-handle resize-handle-bottom" />
            <div className="resize-handle resize-handle-corner" />
          </>
        )}
      </div>
    )
  }

  // 渲染侧边栏
  const renderSidebar = () => {
    const { sidebar } = currentLayout

    return (
      <div
        className={`layout-sidebar ${sidebar.collapsed ? 'collapsed' : ''}`}
        style={{
          width: sidebar.collapsed ? 60 : sidebar.width,
          [sidebar.position]: 0
        }}
      >
        {isEditing && (
          <div className="sidebar-controls">
            <button
              onClick={() => updateLayout({
                ...currentLayout,
                sidebar: { ...sidebar, collapsed: !sidebar.collapsed }
              })}
              className="sidebar-control-button"
              title={sidebar.collapsed ? '展开侧边栏' : '收起侧边栏'}
            >
              {sidebar.collapsed ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
          </div>
        )}
        
        <div className="sidebar-content">
          {sidebar.collapsed ? (
            <div className="sidebar-collapsed-content">
              <Sidebar size={24} />
            </div>
          ) : (
            <div className="sidebar-expanded-content">
              <h3>侧边栏</h3>
              <p>侧边栏内容区域</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 渲染工具栏
  const renderToolbar = () => (
    <div className="layout-toolbar">
      <div className="toolbar-left">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`toolbar-button ${isEditing ? 'active' : ''}`}
        >
          <Layout size={16} />
          {isEditing ? '退出编辑' : '编辑布局'}
        </button>

        {isEditing && (
          <>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`toolbar-button ${showGrid ? 'active' : ''}`}
              title="显示网格"
            >
              <Grid size={16} />
            </button>

            <button
              onClick={resetLayout}
              className="toolbar-button"
              title="重置布局"
            >
              <RotateCcw size={16} />
              重置
            </button>

            <button
              onClick={() => setSaveDialogOpen(true)}
              className="toolbar-button"
              title="保存布局"
            >
              <Save size={16} />
              保存
            </button>
          </>
        )}
      </div>

      <div className="toolbar-right">
        <div className="device-preview-controls">
          <button
            onClick={() => setDevicePreview('desktop')}
            className={`device-button ${devicePreview === 'desktop' ? 'active' : ''}`}
            title="桌面预览"
          >
            <Monitor size={16} />
          </button>
          <button
            onClick={() => setDevicePreview('tablet')}
            className={`device-button ${devicePreview === 'tablet' ? 'active' : ''}`}
            title="平板预览"
          >
            <Tablet size={16} />
          </button>
          <button
            onClick={() => setDevicePreview('mobile')}
            className={`device-button ${devicePreview === 'mobile' ? 'active' : ''}`}
            title="手机预览"
          >
            <Smartphone size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  // 渲染面板列表
  const renderPanelList = () => (
    <div className="panel-list">
      <h4>可用面板</h4>
      {availablePanels.map(panel => {
        const isVisible = currentLayout.panels[panel.id]?.visible ?? false
        return (
          <div key={panel.id} className="panel-list-item">
            <span className="panel-name">{panel.name}</span>
            <button
              onClick={() => togglePanelVisibility(panel.id)}
              className={`panel-toggle ${isVisible ? 'active' : ''}`}
            >
              {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className={`custom-layout-manager ${className}`}>
      {/* 工具栏 */}
      {renderToolbar()}

      <div className="layout-editor">
        {/* 侧边面板 */}
        {isEditing && (
          <div className="layout-sidebar-panel">
            {renderPanelList()}
            
            {selectedPanel && (
              <div className="panel-properties">
                <h4>面板属性</h4>
                {/* 这里可以添加面板属性编辑器 */}
              </div>
            )}
          </div>
        )}

        {/* 主要布局区域 */}
        <div className="layout-main">
          <div 
            className="layout-preview"
            style={getDevicePreviewStyle}
            ref={containerRef}
          >
            {/* 网格背景 */}
            {isEditing && showGrid && (
              <div className="layout-grid" />
            )}

            {/* 头部 */}
            {currentLayout.header.visible && (
              <div 
                className="layout-header"
                style={{ height: currentLayout.header.height }}
              >
                <div className="header-content">
                  <span>头部区域</span>
                </div>
              </div>
            )}

            {/* 主体区域 */}
            <div className="layout-body">
              {/* 侧边栏 */}
              {renderSidebar()}

              {/* 内容区域 */}
              <div className="layout-content">
                {availablePanels.map(renderPanel)}
              </div>
            </div>

            {/* 底部 */}
            {currentLayout.footer.visible && (
              <div 
                className="layout-footer"
                style={{ height: currentLayout.footer.height }}
              >
                <div className="footer-content">
                  <span>底部区域</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 保存对话框 */}
      {saveDialogOpen && (
        <div className="save-dialog-overlay">
          <div className="save-dialog">
            <h3>保存布局</h3>
            <input
              type="text"
              placeholder="输入布局名称..."
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className="layout-name-input"
            />
            <div className="dialog-actions">
              <button
                onClick={() => setSaveDialogOpen(false)}
                className="cancel-button"
              >
                取消
              </button>
              <button
                onClick={handleSaveLayout}
                className="save-button"
                disabled={!layoutName.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomLayoutManager
