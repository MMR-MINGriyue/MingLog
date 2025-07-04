import React, { useEffect, useRef, useState } from 'react'
import { Network, Maximize2, ZoomIn, ZoomOut } from 'lucide-react'

export interface GraphNode {
  id: string
  label: string
  type: 'page' | 'block' | 'tag'
  metadata?: {
    pageCount?: number
    blockCount?: number
    connections?: number
  }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: 'reference' | 'tag' | 'parent'
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphVisualizationProps {
  data: GraphData
  onNodeClick?: (node: GraphNode) => void
  onEdgeClick?: (edge: GraphEdge) => void
  className?: string
  height?: number
  width?: number
}

export const LazyGraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  onNodeClick,
  // onEdgeClick, // Unused
  className = "",
  height = 400,
  width = 600
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  // Simple force-directed layout simulation
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map())

  useEffect(() => {
    if (!data.nodes.length) return

    // Initialize random positions for nodes
    const positions = new Map<string, { x: number; y: number }>()
    data.nodes.forEach((node, index) => {
      const angle = (index / data.nodes.length) * 2 * Math.PI
      const radius = Math.min(width, height) * 0.3
      positions.set(node.id, {
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius
      })
    })
    setNodePositions(positions)
  }, [data, width, height])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Apply zoom and pan
    ctx.save()
    ctx.scale(zoom, zoom)
    ctx.translate(pan.x, pan.y)

    // Draw edges
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    data.edges.forEach(edge => {
      const sourcePos = nodePositions.get(edge.source)
      const targetPos = nodePositions.get(edge.target)
      if (sourcePos && targetPos) {
        ctx.beginPath()
        ctx.moveTo(sourcePos.x, sourcePos.y)
        ctx.lineTo(targetPos.x, targetPos.y)
        ctx.stroke()
      }
    })

    // Draw nodes
    data.nodes.forEach(node => {
      const pos = nodePositions.get(node.id)
      if (!pos) return

      const isSelected = selectedNode?.id === node.id
      const radius = isSelected ? 12 : 8

      // Node circle
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI)
      
      // Color based on type
      switch (node.type) {
        case 'page':
          ctx.fillStyle = isSelected ? '#3b82f6' : '#60a5fa'
          break
        case 'block':
          ctx.fillStyle = isSelected ? '#10b981' : '#34d399'
          break
        case 'tag':
          ctx.fillStyle = isSelected ? '#f59e0b' : '#fbbf24'
          break
        default:
          ctx.fillStyle = isSelected ? '#6b7280' : '#9ca3af'
      }
      
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Node label
      ctx.fillStyle = '#374151'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(node.label, pos.x, pos.y + radius + 15)
    })

    ctx.restore()
  }, [data, nodePositions, selectedNode, zoom, pan, width, height])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left - pan.x) / zoom
    const y = (event.clientY - rect.top - pan.y) / zoom

    // Find clicked node
    for (const node of data.nodes) {
      const pos = nodePositions.get(node.id)
      if (!pos) continue

      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)
      if (distance <= 12) {
        setSelectedNode(node)
        onNodeClick?.(node)
        return
      }
    }

    // Clear selection if clicked on empty space
    setSelectedNode(null)
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3))

  if (!data.nodes.length) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height, width }}>
        <div className="text-center text-gray-500">
          <Network className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No graph data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Controls */}
      <div className="absolute top-2 right-2 z-10 flex space-x-1">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2 bg-white rounded shadow hover:bg-gray-50"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2 bg-white rounded shadow hover:bg-gray-50"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setZoom(1)
            setPan({ x: 0, y: 0 })
          }}
          className="p-2 bg-white rounded shadow hover:bg-gray-50"
          title="Reset view"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        className="border border-gray-200 rounded cursor-pointer"
        style={{ width, height }}
      />

      {/* Node info */}
      {selectedNode && (
        <div className="absolute bottom-2 left-2 bg-white p-3 rounded shadow-lg border max-w-xs">
          <h4 className="font-medium text-gray-900">{selectedNode.label}</h4>
          <p className="text-sm text-gray-600 capitalize">{selectedNode.type}</p>
          {selectedNode.metadata && (
            <div className="mt-2 text-xs text-gray-500">
              {selectedNode.metadata.pageCount && (
                <div>Pages: {selectedNode.metadata.pageCount}</div>
              )}
              {selectedNode.metadata.blockCount && (
                <div>Blocks: {selectedNode.metadata.blockCount}</div>
              )}
              {selectedNode.metadata.connections && (
                <div>Connections: {selectedNode.metadata.connections}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-2 left-2 bg-white p-2 rounded shadow border">
        <div className="text-xs font-medium text-gray-700 mb-1">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <span className="text-xs text-gray-600">Pages</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="text-xs text-gray-600">Blocks</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span className="text-xs text-gray-600">Tags</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LazyGraphVisualization
