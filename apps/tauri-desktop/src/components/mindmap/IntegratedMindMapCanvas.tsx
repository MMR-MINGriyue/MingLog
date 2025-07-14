/**
 * 集成的思维导图画布组件
 * 将MindMapCanvas与MingLog核心系统集成
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { MindMapCanvas } from '@minglog/mindmap'
import { MindMapData, MindMapNode, LayoutConfig, NodeStyle, MindMapTemplate } from '@minglog/mindmap'
import { GraphData, GraphNode, GraphLink } from '@minglog/graph'
import { appCore } from '../../core/AppCore'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { EnhancedNodeStyleEditor } from './EnhancedNodeStyleEditor'
import { TemplateSelector } from './TemplateSelector'
import { TemplateCreator } from './TemplateCreator'
import { EnhancedExportDialog } from './EnhancedExportDialog'
import { ExportManager } from './ExportManager'
import { EnhancedGraphVisualization } from '../graph/EnhancedGraphVisualization'
import { AdvancedLayoutConfigurator } from '../graph/AdvancedLayoutConfigurator'
import { AdvancedClusteringConfigurator } from '../graph/AdvancedClusteringConfigurator'
import { GraphAnalysisPanel } from '../graph/GraphAnalysisPanel'
import './IntegratedMindMapCanvas.css'
import './TemplateSelector.css'
import './TemplateCreator.css'
import './EnhancedExportDialog.css'
import './ExportManager.css'
import '../graph/EnhancedGraphVisualization.css'
import '../graph/AdvancedLayoutConfigurator.css'
import '../graph/AdvancedClusteringConfigurator.css'
import '../graph/GraphAnalysisPanel.css'
import '../graph/EnhancedGraphInteractions.css'

interface IntegratedMindMapCanvasProps {
  /** 思维导图数据 */
  data: MindMapData
  /** 画布宽度 */
  width?: number
  /** 画布高度 */
  height?: number
  /** 布局配置 */
  layout?: LayoutConfig
  /** 是否启用拖拽 */
  enableDrag?: boolean
  /** 是否启用缩放 */
  enableZoom?: boolean
  /** 是否启用编辑 */
  enableEdit?: boolean
  /** 节点点击回调 */
  onNodeClick?: (node: MindMapNode) => void
  /** 节点双击回调 */
  onNodeDoubleClick?: (node: MindMapNode) => void
  /** 节点编辑回调 */
  onNodeEdit?: (node: MindMapNode, newText: string) => void
  /** 背景点击回调 */
  onBackgroundClick?: (event: React.MouseEvent) => void
  /** 模板应用回调 */
  onTemplateApply?: (template: MindMapTemplate) => void
  /** 数据变更回调 */
  onDataChange?: (data: MindMapData) => void
  /** 类名 */
  className?: string
  /** 样式 */
  style?: React.CSSProperties
}

interface CanvasState {
  isLoading: boolean
  error: string | null
  mindMapModule: any | null
  eventBus: any | null
}

interface StyleEditorState {
  isVisible: boolean
  selectedNode: MindMapNode | null
  currentStyle: NodeStyle
}

interface TemplateState {
  selectorVisible: boolean
  creatorVisible: boolean
}

interface ExportState {
  dialogVisible: boolean
  managerVisible: boolean
}

interface GraphVisualizationState {
  visualizationVisible: boolean
  layoutConfiguratorVisible: boolean
  clusteringConfiguratorVisible: boolean
  analysisPanelVisible: boolean
  currentLayoutConfig: LayoutConfig
}

/**
 * 集成的思维导图画布组件
 * 提供与MingLog核心系统的完整集成
 */
export const IntegratedMindMapCanvas: React.FC<IntegratedMindMapCanvasProps> = ({
  data,
  width = 800,
  height = 600,
  layout = { type: 'tree', direction: 'right' },
  enableDrag = true,
  enableZoom = true,
  enableEdit = false,
  onNodeClick,
  onNodeDoubleClick,
  onNodeEdit,
  onBackgroundClick,
  onTemplateApply,
  onDataChange,
  className = '',
  style
}) => {
  // 状态管理
  const [canvasState, setCanvasState] = useState<CanvasState>({
    isLoading: true,
    error: null,
    mindMapModule: null,
    eventBus: null
  })

  // 样式编辑器状态
  const [styleEditorState, setStyleEditorState] = useState<StyleEditorState>({
    isVisible: false,
    selectedNode: null,
    currentStyle: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      borderWidth: 2,
      borderRadius: 6,
      fontSize: 14,
      fontColor: '#374151',
      fontWeight: 'normal',
      padding: 8,
      shape: 'rounded-rect'
    }
  })

  // 模板状态
  const [templateState, setTemplateState] = useState<TemplateState>({
    selectorVisible: false,
    creatorVisible: false
  })

  // 导出状态
  const [exportState, setExportState] = useState<ExportState>({
    dialogVisible: false,
    managerVisible: false
  })

  // 图形可视化状态
  const [graphState, setGraphState] = useState<GraphVisualizationState>({
    visualizationVisible: false,
    layoutConfiguratorVisible: false,
    clusteringConfiguratorVisible: false,
    analysisPanelVisible: false,
    currentLayoutConfig: layout
  })

  // 初始化核心系统集成
  useEffect(() => {
    const initializeIntegration = async () => {
      try {
        setCanvasState(prev => ({ ...prev, isLoading: true, error: null }))

        // 确保核心系统已初始化
        if (!appCore.isInitialized()) {
          await appCore.initialize()
        }

        // 获取思维导图模块
        const moduleManager = appCore.getModuleManager()
        const mindMapModule = moduleManager.getModule('mindmap')
        
        if (!mindMapModule) {
          throw new Error('思维导图模块未找到或未激活')
        }

        // 获取事件总线
        const eventBus = appCore.getEventBus()

        setCanvasState(prev => ({
          ...prev,
          isLoading: false,
          mindMapModule,
          eventBus
        }))

        console.log('思维导图画布集成初始化成功')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '初始化失败'
        setCanvasState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }))
        console.error('思维导图画布集成初始化失败:', error)
      }
    }

    initializeIntegration()
  }, [])

  // 处理节点点击事件
  const handleNodeClick = useCallback((node: MindMapNode) => {
    // 发送事件到事件总线
    if (canvasState.eventBus) {
      canvasState.eventBus.emit('mindmap:node:clicked', {
        nodeId: node.id,
        nodeText: node.text,
        nodeLevel: node.level
      }, 'IntegratedMindMapCanvas')
    }

    // 更新选中节点
    setStyleEditorState(prev => ({
      ...prev,
      selectedNode: node
    }))

    // 调用外部回调
    onNodeClick?.(node)
  }, [canvasState.eventBus, onNodeClick])

  // 处理节点双击事件
  const handleNodeDoubleClick = useCallback((node: MindMapNode) => {
    // 发送事件到事件总线
    if (canvasState.eventBus) {
      canvasState.eventBus.emit('mindmap:node:double-clicked', {
        nodeId: node.id,
        nodeText: node.text,
        nodeLevel: node.level
      }, 'IntegratedMindMapCanvas')
    }

    // 调用外部回调
    onNodeDoubleClick?.(node)
  }, [canvasState.eventBus, onNodeDoubleClick])

  // 处理节点编辑事件
  const handleNodeEdit = useCallback((node: MindMapNode, newText: string) => {
    // 发送事件到事件总线
    if (canvasState.eventBus) {
      canvasState.eventBus.emit('mindmap:node:edited', {
        nodeId: node.id,
        oldText: node.text,
        newText: newText,
        nodeLevel: node.level
      }, 'IntegratedMindMapCanvas')
    }

    // 调用外部回调
    onNodeEdit?.(node, newText)
  }, [canvasState.eventBus, onNodeEdit])

  // 处理背景点击事件
  const handleBackgroundClick = useCallback((event: React.MouseEvent) => {
    // 发送事件到事件总线
    if (canvasState.eventBus) {
      canvasState.eventBus.emit('mindmap:background:clicked', {
        timestamp: Date.now()
      }, 'IntegratedMindMapCanvas')
    }

    // 清除选中节点
    setStyleEditorState(prev => ({
      ...prev,
      selectedNode: null
    }))

    // 调用外部回调
    onBackgroundClick?.(event)
  }, [canvasState.eventBus, onBackgroundClick])

  // 打开样式编辑器
  const openStyleEditor = useCallback((node?: MindMapNode) => {
    setStyleEditorState(prev => ({
      ...prev,
      isVisible: true,
      selectedNode: node || prev.selectedNode
    }))
  }, [])

  // 关闭样式编辑器
  const closeStyleEditor = useCallback(() => {
    setStyleEditorState(prev => ({
      ...prev,
      isVisible: false
    }))
  }, [])

  // 处理样式变更
  const handleStyleChange = useCallback((newStyle: NodeStyle) => {
    setStyleEditorState(prev => ({
      ...prev,
      currentStyle: newStyle
    }))

    // 发送样式变更事件
    if (canvasState.eventBus && styleEditorState.selectedNode) {
      canvasState.eventBus.emit('mindmap:node:style-updated', {
        nodeId: styleEditorState.selectedNode.id,
        style: newStyle
      }, 'IntegratedMindMapCanvas')
    }
  }, [canvasState.eventBus, styleEditorState.selectedNode])

  // 应用样式到所有节点
  const handleApplyToAll = useCallback((style: NodeStyle) => {
    if (canvasState.eventBus) {
      canvasState.eventBus.emit('mindmap:style:apply-to-all', {
        style: style
      }, 'IntegratedMindMapCanvas')
    }
  }, [canvasState.eventBus])

  // 应用样式到同级节点
  const handleApplyToSiblings = useCallback((style: NodeStyle) => {
    if (canvasState.eventBus && styleEditorState.selectedNode) {
      canvasState.eventBus.emit('mindmap:style:apply-to-siblings', {
        nodeId: styleEditorState.selectedNode.id,
        style: style
      }, 'IntegratedMindMapCanvas')
    }
  }, [canvasState.eventBus, styleEditorState.selectedNode])

  // 打开模板选择器
  const openTemplateSelector = useCallback(() => {
    setTemplateState(prev => ({ ...prev, selectorVisible: true }))
  }, [])

  // 关闭模板选择器
  const closeTemplateSelector = useCallback(() => {
    setTemplateState(prev => ({ ...prev, selectorVisible: false }))
  }, [])

  // 打开模板创建器
  const openTemplateCreator = useCallback(() => {
    setTemplateState(prev => ({ ...prev, creatorVisible: true }))
  }, [])

  // 关闭模板创建器
  const closeTemplateCreator = useCallback(() => {
    setTemplateState(prev => ({ ...prev, creatorVisible: false }))
  }, [])

  // 处理模板选择
  const handleTemplateSelect = useCallback((template: MindMapTemplate) => {
    // 应用模板数据
    const templateData = template.data
    onDataChange?.(templateData)
    onTemplateApply?.(template)

    // 发送事件到事件总线
    if (canvasState.eventBus) {
      canvasState.eventBus.emit('mindmap:template:applied', {
        templateId: template.id,
        templateName: template.name,
        category: template.category
      }, 'IntegratedMindMapCanvas')
    }
  }, [onDataChange, onTemplateApply, canvasState.eventBus])

  // 处理模板创建
  const handleTemplateCreated = useCallback((template: MindMapTemplate) => {
    // 发送事件到事件总线
    if (canvasState.eventBus) {
      canvasState.eventBus.emit('mindmap:template:created', {
        templateId: template.id,
        templateName: template.name,
        category: template.category
      }, 'IntegratedMindMapCanvas')
    }
  }, [canvasState.eventBus])

  // 打开导出对话框
  const openExportDialog = useCallback(() => {
    setExportState(prev => ({ ...prev, dialogVisible: true }))
  }, [])

  // 关闭导出对话框
  const closeExportDialog = useCallback(() => {
    setExportState(prev => ({ ...prev, dialogVisible: false }))
  }, [])

  // 打开导出管理器
  const openExportManager = useCallback(() => {
    setExportState(prev => ({ ...prev, managerVisible: true }))
  }, [])

  // 关闭导出管理器
  const closeExportManager = useCallback(() => {
    setExportState(prev => ({ ...prev, managerVisible: false }))
  }, [])

  // 处理导出完成
  const handleExportComplete = useCallback((result: any) => {
    // 发送事件到事件总线
    if (canvasState.eventBus) {
      canvasState.eventBus.emit('mindmap:export:completed', {
        filename: result.filename,
        format: result.format,
        size: result.size,
        exportTime: result.exportTime
      }, 'IntegratedMindMapCanvas')
    }
  }, [canvasState.eventBus])

  // 打开图形可视化
  const openGraphVisualization = useCallback(() => {
    setGraphState(prev => ({ ...prev, visualizationVisible: true }))
  }, [])

  // 关闭图形可视化
  const closeGraphVisualization = useCallback(() => {
    setGraphState(prev => ({ ...prev, visualizationVisible: false }))
  }, [])

  // 打开布局配置器
  const openLayoutConfigurator = useCallback(() => {
    setGraphState(prev => ({ ...prev, layoutConfiguratorVisible: true }))
  }, [])

  // 关闭布局配置器
  const closeLayoutConfigurator = useCallback(() => {
    setGraphState(prev => ({ ...prev, layoutConfiguratorVisible: false }))
  }, [])

  // 打开聚类配置器
  const openClusteringConfigurator = useCallback(() => {
    setGraphState(prev => ({ ...prev, clusteringConfiguratorVisible: true }))
  }, [])

  // 关闭聚类配置器
  const closeClusteringConfigurator = useCallback(() => {
    setGraphState(prev => ({ ...prev, clusteringConfiguratorVisible: false }))
  }, [])

  // 打开分析面板
  const openAnalysisPanel = useCallback(() => {
    setGraphState(prev => ({ ...prev, analysisPanelVisible: true }))
  }, [])

  // 关闭分析面板
  const closeAnalysisPanel = useCallback(() => {
    setGraphState(prev => ({ ...prev, analysisPanelVisible: false }))
  }, [])

  // 处理布局配置变更
  const handleLayoutConfigChange = useCallback((newConfig: LayoutConfig) => {
    setGraphState(prev => ({ ...prev, currentLayoutConfig: newConfig }))
  }, [])

  // 应用布局配置
  const applyLayoutConfig = useCallback((newConfig: LayoutConfig) => {
    setGraphState(prev => ({ ...prev, currentLayoutConfig: newConfig }))

    // 发送事件到事件总线
    if (canvasState.eventBus) {
      canvasState.eventBus.emit('mindmap:layout:changed', {
        layoutType: newConfig.type,
        config: newConfig
      }, 'IntegratedMindMapCanvas')
    }
  }, [canvasState.eventBus])

  // 处理聚类完成
  const handleClusteringComplete = useCallback((result: any) => {
    // 发送事件到事件总线
    if (canvasState.eventBus) {
      canvasState.eventBus.emit('mindmap:clustering:completed', {
        clusterCount: result.clusters.length,
        modularity: result.modularity,
        quality: result.quality,
        executionTime: result.executionTime
      }, 'IntegratedMindMapCanvas')
    }
  }, [canvasState.eventBus])

  // 转换思维导图数据为图形数据
  const convertToGraphData = useCallback((mindMapData: MindMapData): GraphData => {
    const nodes: GraphNode[] = mindMapData.nodes.map(node => ({
      id: node.id,
      label: node.text,
      type: node.level === 0 ? 'root' : 'child',
      level: node.level,
      x: Math.random() * width,
      y: Math.random() * height,
      size: node.level === 0 ? 20 : 15,
      color: node.level === 0 ? '#3b82f6' : '#6b7280'
    }))

    const links: GraphLink[] = mindMapData.links.map(link => ({
      id: link.id,
      source: link.source,
      target: link.target,
      type: link.type || 'default',
      weight: 1
    }))

    return { nodes, links }
  }, [width, height])

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + E 打开样式编辑器
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault()
        if (styleEditorState.selectedNode) {
          openStyleEditor()
        }
      }

      // Ctrl/Cmd + T 打开模板选择器
      if ((event.ctrlKey || event.metaKey) && event.key === 't') {
        event.preventDefault()
        openTemplateSelector()
      }

      // Ctrl/Cmd + Shift + T 打开模板创建器
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault()
        openTemplateCreator()
      }

      // Ctrl/Cmd + Shift + E 打开导出对话框
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'E') {
        event.preventDefault()
        openExportDialog()
      }

      // Ctrl/Cmd + Shift + M 打开导出管理器
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'M') {
        event.preventDefault()
        openExportManager()
      }

      // Ctrl/Cmd + G 打开图形可视化
      if ((event.ctrlKey || event.metaKey) && event.key === 'g') {
        event.preventDefault()
        openGraphVisualization()
      }

      // Ctrl/Cmd + L 打开布局配置器
      if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault()
        openLayoutConfigurator()
      }

      // Ctrl/Cmd + Shift + C 打开聚类配置器
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault()
        openClusteringConfigurator()
      }

      // Ctrl/Cmd + Shift + A 打开分析面板
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
        event.preventDefault()
        openAnalysisPanel()
      }

      // Escape 关闭所有弹窗
      if (event.key === 'Escape') {
        event.preventDefault()
        if (styleEditorState.isVisible) {
          closeStyleEditor()
        } else if (templateState.selectorVisible) {
          closeTemplateSelector()
        } else if (templateState.creatorVisible) {
          closeTemplateCreator()
        } else if (exportState.dialogVisible) {
          closeExportDialog()
        } else if (exportState.managerVisible) {
          closeExportManager()
        } else if (graphState.visualizationVisible) {
          closeGraphVisualization()
        } else if (graphState.layoutConfiguratorVisible) {
          closeLayoutConfigurator()
        } else if (graphState.clusteringConfiguratorVisible) {
          closeClusteringConfigurator()
        } else if (graphState.analysisPanelVisible) {
          closeAnalysisPanel()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    styleEditorState.selectedNode,
    styleEditorState.isVisible,
    templateState.selectorVisible,
    templateState.creatorVisible,
    exportState.dialogVisible,
    exportState.managerVisible,
    graphState.visualizationVisible,
    graphState.layoutConfiguratorVisible,
    graphState.clusteringConfiguratorVisible,
    graphState.analysisPanelVisible,
    openStyleEditor,
    closeStyleEditor,
    openTemplateSelector,
    closeTemplateSelector,
    openTemplateCreator,
    closeTemplateCreator,
    openExportDialog,
    closeExportDialog,
    openExportManager,
    closeExportManager,
    openGraphVisualization,
    closeGraphVisualization,
    openLayoutConfigurator,
    closeLayoutConfigurator,
    openClusteringConfigurator,
    closeClusteringConfigurator,
    openAnalysisPanel,
    closeAnalysisPanel
  ])

  // 计算最终样式
  const finalStyle = useMemo(() => ({
    position: 'relative' as const,
    ...style
  }), [style])

  // 渲染加载状态
  if (canvasState.isLoading) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height, ...finalStyle }}
      >
        <LoadingSpinner size="large" />
        <span className="ml-3 text-gray-600">正在初始化思维导图...</span>
      </div>
    )
  }

  // 渲染错误状态
  if (canvasState.error) {
    return (
      <div 
        className={`flex flex-col items-center justify-center ${className}`}
        style={{ width, height, ...finalStyle }}
      >
        <div className="text-red-500 text-center">
          <div className="text-lg font-semibold mb-2">思维导图初始化失败</div>
          <div className="text-sm">{canvasState.error}</div>
        </div>
      </div>
    )
  }

  // 渲染思维导图画布
  return (
    <ErrorBoundary>
      <div className={className} style={finalStyle}>
        {/* 工具栏 */}
        <div className="mindmap-toolbar">
          <div className="toolbar-section">
            <button
              className="toolbar-button"
              onClick={openTemplateSelector}
              title="选择模板 (Ctrl+T)"
            >
              📋 选择模板
            </button>

            <button
              className="toolbar-button"
              onClick={openTemplateCreator}
              title="创建模板 (Ctrl+Shift+T)"
            >
              ➕ 创建模板
            </button>

            <button
              className={`toolbar-button ${styleEditorState.selectedNode ? '' : 'disabled'}`}
              onClick={() => styleEditorState.selectedNode && openStyleEditor()}
              disabled={!styleEditorState.selectedNode}
              title="编辑节点样式 (Ctrl+E)"
            >
              🎨 样式编辑
            </button>

            <button
              className="toolbar-button"
              onClick={openExportDialog}
              title="导出思维导图 (Ctrl+Shift+E)"
            >
              📤 导出
            </button>

            <button
              className="toolbar-button"
              onClick={openExportManager}
              title="导出管理器 (Ctrl+Shift+M)"
            >
              📋 导出管理
            </button>

            <button
              className="toolbar-button"
              onClick={openGraphVisualization}
              title="图形可视化 (Ctrl+G)"
            >
              🌐 图形分析
            </button>

            <button
              className="toolbar-button"
              onClick={openLayoutConfigurator}
              title="布局配置 (Ctrl+L)"
            >
              ⚙️ 布局设置
            </button>

            <button
              className="toolbar-button"
              onClick={openClusteringConfigurator}
              title="聚类分析 (Ctrl+Shift+C)"
            >
              🎯 聚类分析
            </button>

            <button
              className="toolbar-button"
              onClick={openAnalysisPanel}
              title="图形分析 (Ctrl+Shift+A)"
            >
              📊 图形分析
            </button>

            {styleEditorState.selectedNode && (
              <span className="selected-node-info">
                已选中: {styleEditorState.selectedNode.text}
              </span>
            )}
          </div>

          <div className="toolbar-section">
            <span className="integration-status">
              {canvasState.mindMapModule ? '✅ 已连接' : '❌ 未连接'}
            </span>
          </div>
        </div>

        {/* 思维导图画布 */}
        <MindMapCanvas
          data={data}
          width={width}
          height={height - 50} // 减去工具栏高度
          layout={layout}
          enableDrag={enableDrag}
          enableZoom={enableZoom}
          showLabels={true}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onBackgroundClick={handleBackgroundClick}
          className="integrated-mindmap-canvas"
        />

        {/* 样式编辑器 */}
        <EnhancedNodeStyleEditor
          selectedNode={styleEditorState.selectedNode}
          currentStyle={styleEditorState.currentStyle}
          onStyleChange={handleStyleChange}
          onApplyToAll={handleApplyToAll}
          onApplyToSiblings={handleApplyToSiblings}
          visible={styleEditorState.isVisible}
          onClose={closeStyleEditor}
        />

        {/* 模板选择器 */}
        <TemplateSelector
          visible={templateState.selectorVisible}
          onClose={closeTemplateSelector}
          onTemplateSelect={handleTemplateSelect}
        />

        {/* 模板创建器 */}
        <TemplateCreator
          visible={templateState.creatorVisible}
          onClose={closeTemplateCreator}
          mindMapData={data}
          onTemplateCreated={handleTemplateCreated}
        />

        {/* 导出对话框 */}
        <EnhancedExportDialog
          visible={exportState.dialogVisible}
          onClose={closeExportDialog}
          mindMapData={data}
          onExportComplete={handleExportComplete}
        />

        {/* 导出管理器 */}
        <ExportManager
          visible={exportState.managerVisible}
          onClose={closeExportManager}
          mindMapData={data}
        />

        {/* 图形可视化 */}
        <EnhancedGraphVisualization
          data={convertToGraphData(data)}
          width={width}
          height={height}
          visible={graphState.visualizationVisible}
          onClose={closeGraphVisualization}
          onNodeClick={(node) => {
            // 查找对应的思维导图节点
            const mindMapNode = data.nodes.find(n => n.id === node.id)
            if (mindMapNode) {
              handleNodeClick(mindMapNode)
            }
          }}
        />

        {/* 布局配置器 */}
        <AdvancedLayoutConfigurator
          config={graphState.currentLayoutConfig}
          onChange={handleLayoutConfigChange}
          visible={graphState.layoutConfiguratorVisible}
          onClose={closeLayoutConfigurator}
          onApply={applyLayoutConfig}
        />

        {/* 聚类配置器 */}
        <AdvancedClusteringConfigurator
          data={convertToGraphData(data)}
          visible={graphState.clusteringConfiguratorVisible}
          onClose={closeClusteringConfigurator}
          onClusteringComplete={handleClusteringComplete}
        />

        {/* 图形分析面板 */}
        <GraphAnalysisPanel
          data={convertToGraphData(data)}
          visible={graphState.analysisPanelVisible}
          onClose={closeAnalysisPanel}
          onNodeSelect={(nodeId) => {
            // 查找对应的思维导图节点
            const mindMapNode = data.nodes.find(n => n.id === nodeId)
            if (mindMapNode) {
              handleNodeClick(mindMapNode)
            }
          }}
          onPathHighlight={(path) => {
            // 发送路径高亮事件
            if (canvasState.eventBus) {
              canvasState.eventBus.emit('mindmap:path:highlighted', {
                path,
                pathLength: path.length
              }, 'IntegratedMindMapCanvas')
            }
          }}
        />

        {/* 开发模式下显示详细状态 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            <div>集成状态: {canvasState.mindMapModule ? '已连接' : '未连接'}</div>
            <div>选中节点: {styleEditorState.selectedNode?.id || '无'}</div>
            <div>样式编辑器: {styleEditorState.isVisible ? '打开' : '关闭'}</div>
            <div>模板选择器: {templateState.selectorVisible ? '打开' : '关闭'}</div>
            <div>模板创建器: {templateState.creatorVisible ? '打开' : '关闭'}</div>
            <div>导出对话框: {exportState.dialogVisible ? '打开' : '关闭'}</div>
            <div>导出管理器: {exportState.managerVisible ? '打开' : '关闭'}</div>
            <div>图形可视化: {graphState.visualizationVisible ? '打开' : '关闭'}</div>
            <div>布局配置器: {graphState.layoutConfiguratorVisible ? '打开' : '关闭'}</div>
            <div>聚类配置器: {graphState.clusteringConfiguratorVisible ? '打开' : '关闭'}</div>
            <div>图形分析面板: {graphState.analysisPanelVisible ? '打开' : '关闭'}</div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default IntegratedMindMapCanvas
