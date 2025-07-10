/**
 * 思维导图主视图组件
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { select, Selection } from 'd3-selection'
import { zoom, zoomIdentity, ZoomBehavior } from 'd3-zoom'
import { drag } from 'd3-drag'
import 'd3-transition'

import { MindMapProps, MindMapData, MindMapNode, LayoutConfig } from '../types'
import { treeLayout } from '../algorithms/TreeLayout'
import { radialLayout } from '../algorithms/RadialLayout'
import { MindMapNode as NodeComponent } from './MindMapNode'
import { MindMapLink } from './MindMapLink'
import { MindMapToolbar } from './MindMapToolbar'

export const MindMapView: React.FC<MindMapProps> = ({
  data,
  width = 800,
  height = 600,
  layout = { type: 'tree' },
  enableZoom = true,
  enableDrag = true,
  enableEdit = false,
  showToolbar = true,
  onNodeClick,
  onNodeDoubleClick,
  onNodeEdit,
  onZoom,
  className = '',
  style
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [layoutData, setLayoutData] = useState<MindMapData>(data)
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig>(layout)
  const [zoomLevel, setZoomLevel] = useState(1)

  // 计算布局
  const calculateLayout = useCallback((layoutConfig: LayoutConfig) => {
    let algorithm
    switch (layoutConfig.type) {
      case 'radial':
        algorithm = radialLayout
        break
      case 'tree':
      default:
        algorithm = treeLayout
        break
    }

    const newLayoutData = algorithm.calculate(data, layoutConfig)
    setLayoutData(newLayoutData)
  }, [data])

  // 初始化布局
  useEffect(() => {
    calculateLayout(currentLayout)
  }, [calculateLayout, currentLayout])

  // 设置SVG和缩放
  useEffect(() => {
    if (!svgRef.current) return

    const svg = select(svgRef.current)
    const container = svg.select('.mindmap-container')

    // 清除之前的缩放行为
    svg.on('.zoom', null)

    if (enableZoom) {
      const zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> = zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 5])
        .on('zoom', (event) => {
          const { transform } = event
          container.attr('transform', transform.toString())
          setZoomLevel(transform.k)
          onZoom?.(transform.k)
        })

      svg.call(zoomBehavior)

      // 居中显示
      const centerX = width / 2
      const centerY = height / 2
      svg.call(
        zoomBehavior.transform,
        zoomIdentity.translate(centerX, centerY).scale(1)
      )
    }
  }, [enableZoom, width, height, onZoom])

  // 处理布局切换
  const handleLayoutChange = useCallback((newLayoutType: LayoutConfig['type']) => {
    const newLayout = { ...currentLayout, type: newLayoutType }
    setCurrentLayout(newLayout)
  }, [currentLayout])

  // 处理节点点击
  const handleNodeClick = useCallback((node: MindMapNode, event: React.MouseEvent) => {
    event.stopPropagation()
    onNodeClick?.(node, event.nativeEvent)
  }, [onNodeClick])

  // 处理节点双击
  const handleNodeDoubleClick = useCallback((node: MindMapNode, event: React.MouseEvent) => {
    event.stopPropagation()
    onNodeDoubleClick?.(node, event.nativeEvent)
  }, [onNodeDoubleClick])

  // 渲染节点
  const renderNodes = () => {
    return layoutData.nodes.map(node => (
      <NodeComponent
        key={node.id}
        node={node}
        onClick={handleNodeClick}
        onDoubleClick={handleNodeDoubleClick}
        enableEdit={enableEdit}
        onEdit={onNodeEdit}
      />
    ))
  }

  // 渲染链接
  const renderLinks = () => {
    return layoutData.links.map(link => {
      const sourceNode = layoutData.nodes.find(n => n.id === link.source)
      const targetNode = layoutData.nodes.find(n => n.id === link.target)
      
      if (!sourceNode || !targetNode) return null

      return (
        <MindMapLink
          key={link.id}
          link={link}
          sourceNode={sourceNode}
          targetNode={targetNode}
        />
      )
    })
  }

  return (
    <div 
      ref={containerRef}
      className={`mindmap-view ${className}`}
      style={{ width, height, position: 'relative', ...style }}
    >
      {showToolbar && (
        <MindMapToolbar
          currentLayout={currentLayout.type}
          zoomLevel={zoomLevel}
          onLayoutChange={handleLayoutChange}
          onZoomIn={() => {
            if (svgRef.current && enableZoom) {
              const svg = select(svgRef.current)
              svg.transition().call(
                zoom<SVGSVGElement, unknown>().scaleBy as any,
                1.2
              )
            }
          }}
          onZoomOut={() => {
            if (svgRef.current && enableZoom) {
              const svg = select(svgRef.current)
              svg.transition().call(
                zoom<SVGSVGElement, unknown>().scaleBy as any,
                0.8
              )
            }
          }}
          onFitToView={() => {
            if (svgRef.current && enableZoom) {
              const svg = select(svgRef.current)
              const centerX = width / 2
              const centerY = height / 2
              svg.transition().call(
                zoom<SVGSVGElement, unknown>().transform as any,
                zoomIdentity.translate(centerX, centerY).scale(1)
              )
            }
          }}
        />
      )}

      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="mindmap-svg"
        style={{ display: 'block', background: '#fafafa' }}
      >
        <defs>
          {/* 箭头标记 */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#666"
            />
          </marker>
        </defs>

        <g className="mindmap-container">
          {/* 渲染链接 */}
          <g className="links">
            {renderLinks()}
          </g>

          {/* 渲染节点 */}
          <g className="nodes">
            {renderNodes()}
          </g>
        </g>
      </svg>
    </div>
  )
}

export default MindMapView
