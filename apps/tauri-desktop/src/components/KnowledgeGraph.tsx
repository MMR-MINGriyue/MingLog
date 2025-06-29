import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Filter, Download, Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'

interface GraphNode {
  id: string
  title: string
  type: 'note' | 'tag' | 'concept'
  x: number
  y: number
  connections: string[]
  size: number
  color: string
}

interface GraphLink {
  source: string
  target: string
  strength: number
}

interface KnowledgeGraphProps {
  width?: number
  height?: number
  className?: string
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ 
  width = 800, 
  height = 600, 
  className = '' 
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Generate sample graph data
  const generateSampleData = useCallback(() => {
    const sampleNodes: GraphNode[] = [
      {
        id: 'note-1',
        title: 'Machine Learning Basics',
        type: 'note',
        x: 200,
        y: 150,
        connections: ['tag-1', 'concept-1'],
        size: 20,
        color: '#3B82F6'
      },
      {
        id: 'note-2',
        title: 'Neural Networks',
        type: 'note',
        x: 350,
        y: 200,
        connections: ['tag-1', 'concept-1', 'concept-2'],
        size: 25,
        color: '#3B82F6'
      },
      {
        id: 'note-3',
        title: 'Deep Learning Applications',
        type: 'note',
        x: 500,
        y: 150,
        connections: ['tag-1', 'concept-2'],
        size: 18,
        color: '#3B82F6'
      },
      {
        id: 'tag-1',
        title: 'AI',
        type: 'tag',
        x: 350,
        y: 100,
        connections: ['note-1', 'note-2', 'note-3'],
        size: 15,
        color: '#10B981'
      },
      {
        id: 'concept-1',
        title: 'Algorithms',
        type: 'concept',
        x: 150,
        y: 250,
        connections: ['note-1', 'note-2'],
        size: 12,
        color: '#F59E0B'
      },
      {
        id: 'concept-2',
        title: 'Data Science',
        type: 'concept',
        x: 450,
        y: 300,
        connections: ['note-2', 'note-3'],
        size: 14,
        color: '#F59E0B'
      }
    ]

    const sampleLinks: GraphLink[] = [
      { source: 'note-1', target: 'tag-1', strength: 0.8 },
      { source: 'note-2', target: 'tag-1', strength: 0.9 },
      { source: 'note-3', target: 'tag-1', strength: 0.7 },
      { source: 'note-1', target: 'concept-1', strength: 0.6 },
      { source: 'note-2', target: 'concept-1', strength: 0.8 },
      { source: 'note-2', target: 'concept-2', strength: 0.7 },
      { source: 'note-3', target: 'concept-2', strength: 0.9 }
    ]

    setNodes(sampleNodes)
    setLinks(sampleLinks)
  }, [])

  useEffect(() => {
    generateSampleData()
  }, [generateSampleData])

  // Handle mouse events for pan and zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.1, Math.min(3, prev * delta)))
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedNode(null)
  }

  const zoomIn = () => setZoom(prev => Math.min(3, prev * 1.2))
  const zoomOut = () => setZoom(prev => Math.max(0.1, prev / 1.2))

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId)
  }

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'note': return '📝'
      case 'tag': return '🏷️'
      case 'concept': return '💡'
      default: return '⚪'
    }
  }

  return (
    <div className={`relative bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Graph Controls */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-soft border border-gray-200 p-2">
        <div className="flex flex-col space-y-2">
          <button
            onClick={zoomIn}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Graph Info */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-soft border border-gray-200 p-3">
        <div className="text-sm text-gray-600">
          <div>Nodes: {nodes.length}</div>
          <div>Connections: {links.length}</div>
          <div>Zoom: {Math.round(zoom * 100)}%</div>
        </div>
      </div>

      {/* SVG Graph */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
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
              fill="#94A3B8"
            />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Links */}
          {links.map((link, index) => {
            const sourceNode = nodes.find(n => n.id === link.source)
            const targetNode = nodes.find(n => n.id === link.target)
            
            if (!sourceNode || !targetNode) return null

            return (
              <line
                key={index}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="#94A3B8"
                strokeWidth={link.strength * 2}
                strokeOpacity={0.6}
                markerEnd="url(#arrowhead)"
              />
            )
          })}

          {/* Nodes */}
          {nodes.map(node => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.size}
                fill={node.color}
                stroke={selectedNode === node.id ? '#1F2937' : '#FFFFFF'}
                strokeWidth={selectedNode === node.id ? 3 : 2}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleNodeClick(node.id)}
              />
              <text
                x={node.x}
                y={node.y - node.size - 5}
                textAnchor="middle"
                className="text-xs font-medium fill-gray-700 pointer-events-none"
              >
                {getNodeTypeIcon(node.type)} {node.title}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-soft border border-gray-200 p-4 max-w-xs">
          {(() => {
            const node = nodes.find(n => n.id === selectedNode)
            if (!node) return null

            return (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{getNodeTypeIcon(node.type)}</span>
                  <h3 className="font-semibold text-gray-900">{node.title}</h3>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Type: {node.type}</div>
                  <div>Connections: {node.connections.length}</div>
                  <div className="mt-2">
                    <span className="font-medium">Connected to:</span>
                    <div className="mt-1 space-y-1">
                      {node.connections.map(connId => {
                        const connNode = nodes.find(n => n.id === connId)
                        return connNode ? (
                          <div key={connId} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {getNodeTypeIcon(connNode.type)} {connNode.title}
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

export default KnowledgeGraph
