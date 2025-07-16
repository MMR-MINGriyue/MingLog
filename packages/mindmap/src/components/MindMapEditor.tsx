/**
 * 思维导图编辑器组件
 * 提供完整的思维导图创建、编辑和管理功能
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { MindMapView } from './MindMapView'
import { NodeStyleEditor } from './NodeStyleEditor'
import { ExportDialog } from './ExportDialog'
import { TemplateDialog } from './TemplateDialog'
import { MindMapData, MindMapNode, MindMapLink, LayoutConfig, ExportConfig, LayoutType, NodeStyle } from '../types'
import { MindMapTemplate } from '../templates/TemplateManager'
import { exportManager } from '../exporters/ExportManager'
// import './NodeStyleEditor.css'
// import './ExportDialog.css'
// import './TemplateDialog.css'

interface MindMapEditorProps {
  /** 初始思维导图数据 */
  initialData?: MindMapData
  /** 画布宽度 */
  width?: number
  /** 画布高度 */
  height?: number
  /** 是否启用编辑模式 */
  enableEdit?: boolean
  /** 是否显示工具栏 */
  showToolbar?: boolean
  /** 保存回调 */
  onSave?: (data: MindMapData) => void
  /** 导出回调 */
  onExport?: (data: MindMapData, config: ExportConfig) => void
  /** 数据变更回调 */
  onChange?: (data: MindMapData) => void
  /** 类名 */
  className?: string
}

interface EditorState {
  /** 当前思维导图数据 */
  data: MindMapData
  /** 历史记录栈 */
  history: MindMapData[]
  /** 当前历史位置 */
  historyIndex: number
  /** 是否有未保存的更改 */
  hasUnsavedChanges: boolean
  /** 当前布局配置 */
  layout: LayoutConfig
  /** 选中的节点ID */
  selectedNodeIds: Set<string>
  /** 当前选中的节点 */
  selectedNode: MindMapNode | null
  /** 是否显示样式编辑器 */
  showStyleEditor: boolean
  /** 是否显示导出对话框 */
  showExportDialog: boolean
  /** 是否显示模板选择对话框 */
  showTemplateDialog: boolean
}

/**
 * 思维导图编辑器组件
 * 集成完整的编辑功能和状态管理
 */
export const MindMapEditor: React.FC<MindMapEditorProps> = ({
  initialData,
  width = 1000,
  height = 700,
  enableEdit = true,
  showToolbar = true,
  onSave,
  onExport,
  onChange,
  className = ''
}) => {
  // 创建默认数据
  const createDefaultData = useCallback((): MindMapData => ({
    nodes: [
      {
        id: 'root',
        text: '中心主题',
        level: 0,
        children: [],
        x: width / 2,
        y: height / 2,
        style: {
          backgroundColor: '#4A90E2',
          textColor: '#FFFFFF',
          borderColor: '#2E5C8A',
          radius: 30,
          fontSize: 16,
          fontWeight: 'bold'
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ],
    links: [],
    rootId: 'root',
    metadata: {
      title: '新思维导图',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0'
    }
  }), [width, height])

  // 状态管理
  const [editorState, setEditorState] = useState<EditorState>(() => {
    const data = initialData || createDefaultData()
    return {
      data,
      history: [data],
      historyIndex: 0,
      hasUnsavedChanges: false,
      layout: { type: 'tree', direction: 'right' },
      selectedNodeIds: new Set(),
      selectedNode: null,
      showStyleEditor: false,
      showExportDialog: false,
      showTemplateDialog: false
    }
  })

  // 引用
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * 添加历史记录
   */
  const addToHistory = useCallback((newData: MindMapData) => {
    setEditorState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1)
      newHistory.push(newData)
      
      // 限制历史记录数量
      if (newHistory.length > 50) {
        newHistory.shift()
      }

      return {
        ...prev,
        data: newData,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        hasUnsavedChanges: true
      }
    })

    // 通知外部数据变更
    onChange?.(newData)

    // 自动保存（防抖）
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave()
    }, 2000)
  }, [onChange])

  /**
   * 撤销操作
   */
  const handleUndo = useCallback(() => {
    setEditorState(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1
        const newData = prev.history[newIndex]
        onChange?.(newData)
        return {
          ...prev,
          data: newData,
          historyIndex: newIndex,
          hasUnsavedChanges: true
        }
      }
      return prev
    })
  }, [onChange])

  /**
   * 重做操作
   */
  const handleRedo = useCallback(() => {
    setEditorState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1
        const newData = prev.history[newIndex]
        onChange?.(newData)
        return {
          ...prev,
          data: newData,
          historyIndex: newIndex,
          hasUnsavedChanges: true
        }
      }
      return prev
    })
  }, [onChange])

  /**
   * 添加节点
   */
  const handleAddNode = useCallback((parentNode: MindMapNode) => {
    const newNodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newNode: MindMapNode = {
      id: newNodeId,
      text: '新节点',
      level: parentNode.level + 1,
      parentId: parentNode.id,
      children: [],
      x: (parentNode.x || 0) + 150,
      y: (parentNode.y || 0) + 50,
      style: {
        backgroundColor: '#F3F4F6',
        textColor: '#1F2937',
        borderColor: '#D1D5DB',
        radius: 20,
        fontSize: 14
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    const newLink: MindMapLink = {
      id: `link_${newNodeId}`,
      source: parentNode.id,
      target: newNodeId,
      type: 'parent-child'
    }

    const newData: MindMapData = {
      ...editorState.data,
      nodes: [...editorState.data.nodes, newNode],
      links: [...editorState.data.links, newLink],
      metadata: {
        ...editorState.data.metadata,
        updatedAt: new Date()
      }
    }

    addToHistory(newData)
  }, [editorState.data, addToHistory])

  /**
   * 编辑节点
   */
  const handleEditNode = useCallback((node: MindMapNode, newText: string) => {
    const newData: MindMapData = {
      ...editorState.data,
      nodes: editorState.data.nodes.map(n =>
        n.id === node.id 
          ? { 
              ...n, 
              text: newText,
              metadata: { ...n.metadata, updatedAt: new Date() }
            }
          : n
      ),
      metadata: {
        ...editorState.data.metadata,
        updatedAt: new Date()
      }
    }

    addToHistory(newData)
  }, [editorState.data, addToHistory])

  /**
   * 删除节点
   */
  const handleDeleteNode = useCallback((node: MindMapNode) => {
    if (node.id === editorState.data.rootId) {
      console.warn('不能删除根节点')
      return
    }

    // 递归收集要删除的节点ID
    const nodesToDelete = new Set<string>()
    const collectNodeIds = (nodeId: string) => {
      nodesToDelete.add(nodeId)
      const childNodes = editorState.data.nodes.filter(n => n.parentId === nodeId)
      childNodes.forEach(child => collectNodeIds(child.id))
    }
    collectNodeIds(node.id)

    const newData: MindMapData = {
      ...editorState.data,
      nodes: editorState.data.nodes.filter(n => !nodesToDelete.has(n.id)),
      links: editorState.data.links.filter(l =>
        !nodesToDelete.has(l.source) && !nodesToDelete.has(l.target)
      ),
      metadata: {
        ...editorState.data.metadata,
        updatedAt: new Date()
      }
    }

    addToHistory(newData)
  }, [editorState.data, addToHistory])

  /**
   * 移动节点
   */
  const handleMoveNode = useCallback((node: MindMapNode, newPosition: { x: number; y: number }) => {
    const newData: MindMapData = {
      ...editorState.data,
      nodes: editorState.data.nodes.map(n =>
        n.id === node.id 
          ? { 
              ...n, 
              x: newPosition.x, 
              y: newPosition.y,
              metadata: { ...n.metadata, updatedAt: new Date() }
            }
          : n
      ),
      metadata: {
        ...editorState.data.metadata,
        updatedAt: new Date()
      }
    }

    addToHistory(newData)
  }, [editorState.data, addToHistory])

  /**
   * 保存思维导图
   */
  const handleSave = useCallback(() => {
    if (editorState.hasUnsavedChanges) {
      onSave?.(editorState.data)
      setEditorState(prev => ({ ...prev, hasUnsavedChanges: false }))
    }
  }, [editorState.data, editorState.hasUnsavedChanges, onSave])

  /**
   * 打开导出对话框
   */
  const handleOpenExportDialog = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      showExportDialog: true
    }))
  }, [])

  /**
   * 关闭导出对话框
   */
  const handleCloseExportDialog = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      showExportDialog: false
    }))
  }, [])

  /**
   * 打开模板选择对话框
   */
  const handleOpenTemplateDialog = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      showTemplateDialog: true
    }))
  }, [])

  /**
   * 关闭模板选择对话框
   */
  const handleCloseTemplateDialog = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      showTemplateDialog: false
    }))
  }, [])

  /**
   * 应用模板
   */
  const handleApplyTemplate = useCallback((data: MindMapData, template: MindMapTemplate) => {
    // 更新思维导图数据
    const newData: MindMapData = {
      ...data,
      metadata: {
        ...data.metadata,
        title: template.name,
        description: `基于模板"${template.name}"创建`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    // 添加到历史记录
    addToHistory(newData)

    // 关闭模板对话框
    setEditorState(prev => ({
      ...prev,
      showTemplateDialog: false
    }))

    console.log('应用模板成功:', template.name)
  }, [addToHistory])

  /**
   * 导出思维导图
   */
  const handleExport = useCallback(async (config: ExportConfig) => {
    try {
      setEditorState(prev => ({ ...prev, showExportDialog: false }))

      // 显示导出进度
      const progressCallback = (progress: any) => {
        console.log('导出进度:', progress)
        // 这里可以显示进度条或通知
      }

      const unsubscribe = exportManager.onProgress(progressCallback)

      try {
        // 执行导出
        const result = await exportManager.export(editorState.data, config)

        // 自动下载
        await exportManager.downloadResult(result)

        console.log('导出成功:', result)

        // 调用外部回调
        onExport?.(editorState.data, config)

      } finally {
        unsubscribe()
      }

    } catch (error) {
      console.error('导出失败:', error)
      // 这里可以显示错误通知
    }
  }, [editorState.data, onExport])

  /**
   * 布局变更
   */
  const handleLayoutChange = useCallback((layoutType: LayoutType) => {
    setEditorState(prev => ({
      ...prev,
      layout: { ...prev.layout, type: layoutType }
    }))
  }, [])

  /**
   * 节点选择处理
   */
  const handleNodeSelect = useCallback((node: MindMapNode) => {
    setEditorState(prev => ({
      ...prev,
      selectedNode: node,
      selectedNodeIds: new Set([node.id])
    }))
  }, [])

  /**
   * 打开样式编辑器
   */
  const handleOpenStyleEditor = useCallback((node?: MindMapNode) => {
    setEditorState(prev => ({
      ...prev,
      selectedNode: node || prev.selectedNode,
      showStyleEditor: true
    }))
  }, [])

  /**
   * 关闭样式编辑器
   */
  const handleCloseStyleEditor = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      showStyleEditor: false
    }))
  }, [])

  /**
   * 样式变更处理
   */
  const handleStyleChange = useCallback((style: NodeStyle) => {
    if (!editorState.selectedNode) return

    const newData: MindMapData = {
      ...editorState.data,
      nodes: editorState.data.nodes.map(n =>
        n.id === editorState.selectedNode!.id
          ? {
              ...n,
              style: { ...n.style, ...style },
              metadata: { ...n.metadata, updatedAt: new Date() }
            }
          : n
      ),
      metadata: {
        ...editorState.data.metadata,
        updatedAt: new Date()
      }
    }

    addToHistory(newData)
  }, [editorState.selectedNode, editorState.data, addToHistory])

  /**
   * 应用样式到所有节点
   */
  const handleApplyStyleToAll = useCallback((style: NodeStyle) => {
    const newData: MindMapData = {
      ...editorState.data,
      nodes: editorState.data.nodes.map(n => ({
        ...n,
        style: { ...n.style, ...style },
        metadata: { ...n.metadata, updatedAt: new Date() }
      })),
      metadata: {
        ...editorState.data.metadata,
        updatedAt: new Date()
      }
    }

    addToHistory(newData)
  }, [editorState.data, addToHistory])

  /**
   * 应用样式到同级节点
   */
  const handleApplyStyleToSiblings = useCallback((style: NodeStyle) => {
    if (!editorState.selectedNode) return

    const selectedNode = editorState.selectedNode
    const siblings = editorState.data.nodes.filter(n =>
      n.parentId === selectedNode.parentId && n.id !== selectedNode.id
    )

    const newData: MindMapData = {
      ...editorState.data,
      nodes: editorState.data.nodes.map(n => {
        if (siblings.some(s => s.id === n.id) || n.id === selectedNode.id) {
          return {
            ...n,
            style: { ...n.style, ...style },
            metadata: { ...n.metadata, updatedAt: new Date() }
          }
        }
        return n
      }),
      metadata: {
        ...editorState.data.metadata,
        updatedAt: new Date()
      }
    }

    addToHistory(newData)
  }, [editorState.selectedNode, editorState.data, addToHistory])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault()
            if (event.shiftKey) {
              handleRedo()
            } else {
              handleUndo()
            }
            break
          case 's':
            event.preventDefault()
            if (event.shiftKey) {
              // Ctrl+Shift+S 打开样式编辑器
              handleOpenStyleEditor()
            } else {
              handleSave()
            }
            break
          case 't':
            event.preventDefault()
            // Ctrl+T 打开模板选择对话框
            handleOpenTemplateDialog()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleUndo, handleRedo, handleSave, handleOpenStyleEditor, handleOpenTemplateDialog])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={`mindmap-editor ${className}`}>
      <MindMapView
        data={editorState.data}
        width={width}
        height={height}
        layout={editorState.layout}
        enableEdit={enableEdit}
        enableDrag={enableEdit}
        enableZoom={true}
        showToolbar={showToolbar}
        showMinimap={true}
        onNodeAdd={handleAddNode}
        onNodeEdit={handleEditNode}
        onNodeDelete={handleDeleteNode}
        onNodeMove={handleMoveNode}
        onNodeSelect={handleNodeSelect}
        onStyleEdit={handleOpenStyleEditor}
        onExport={handleOpenExportDialog}
      />
      
      {/* 状态指示器 */}
      {editorState.hasUnsavedChanges && (
        <div className="unsaved-indicator">
          <span>● 有未保存的更改</span>
        </div>
      )}

      {/* 节点样式编辑器 */}
      <NodeStyleEditor
        selectedNode={editorState.selectedNode}
        currentStyle={editorState.selectedNode?.style || {}}
        onStyleChange={handleStyleChange}
        onApplyToAll={handleApplyStyleToAll}
        onApplyToSiblings={handleApplyStyleToSiblings}
        visible={editorState.showStyleEditor}
        onClose={handleCloseStyleEditor}
      />

      {/* 导出对话框 */}
      <ExportDialog
        visible={editorState.showExportDialog}
        onClose={handleCloseExportDialog}
        onExport={handleExport}
      />

      {/* 模板选择对话框 */}
      <TemplateDialog
        visible={editorState.showTemplateDialog}
        onClose={handleCloseTemplateDialog}
        onSelectTemplate={handleApplyTemplate}
      />
    </div>
  )
}

export default MindMapEditor
