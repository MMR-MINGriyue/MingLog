import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Network, Maximize2, Filter, Download, RefreshCw, Settings } from 'lucide-react'
import { GraphVisualization } from '@minglog/graph'
import { getGraphData, createSampleGraphData, withErrorHandling } from '../utils/tauri'
import { useNotifications } from '../components/NotificationSystem'

const GraphPage: React.FC = () => {
  const navigate = useNavigate()
  const { error } = useNotifications()
  const [showFilters, setShowFilters] = useState(false)
  const [graphLayout, setGraphLayout] = useState('force')
  const [nodeSize, setNodeSize] = useState('medium')
  const [showLabels, setShowLabels] = useState(true)
  const [includeBlocks, setIncludeBlocks] = useState(false)
  const [graphData, setGraphData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<any>(null)

  // Load graph data
  const loadGraphData = async () => {
    setIsLoading(true)

    // For now, use a default graph ID - in a real app, this would come from context or props
    const defaultGraphId = 'default'

    const data = await withErrorHandling(
      () => getGraphData(defaultGraphId, includeBlocks),
      'Failed to load graph data'
    )

    if (data) {
      setGraphData(data)
    }

    setIsLoading(false)
  }

  // Load data on mount and when includeBlocks changes
  useEffect(() => {
    loadGraphData()
  }, [includeBlocks])

  // Refresh data when returning to the page (in case data was modified elsewhere)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadGraphData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleExportGraph = () => {
    // TODO: Implement graph export functionality
    console.log('Exporting graph...')
  }

  const handleRefreshGraph = () => {
    loadGraphData()
  }

  const handleCreateSampleData = async () => {
    const success = await withErrorHandling(
      () => createSampleGraphData(),
      'Failed to create sample data'
    )

    if (success) {
      // Refresh graph data after creating sample data
      loadGraphData()
    }
  }

  const handleNodeClick = (node: any) => {
    setSelectedNode(node)

    // Navigate based on node type and metadata
    if (node.type === 'note' || node.type === 'page') {
      // Navigate to page in block editor
      navigate(`/blocks/${node.id}`)
    } else if (node.type === 'link' || node.type === 'block') {
      // Navigate to specific block within its page
      const pageId = node.metadata?.pageId || node.id.replace('block-', '')
      const blockId = node.id.startsWith('block-') ? node.id.replace('block-', '') : node.id
      navigate(`/blocks/${pageId}#${blockId}`)
    } else if (node.type === 'tag') {
      // Navigate to search page with tag filter
      const tagName = node.label
      navigate(`/search?tags=${encodeURIComponent(tagName)}`)
    }

    console.log('Navigating to node:', node)
  }

  const handleNodeHover = (node: any | null) => {
    // Could be used to show tooltips or preview information
    if (node) {
      console.log('Hovering over node:', node.label)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Graph Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Knowledge Graph</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Network className="w-4 h-4" />
              <span>
                {isLoading ? 'Loading...' : graphData ?
                  `${(graphData.pages?.length || 0) + (includeBlocks ? (graphData.blocks?.length || 0) : 0)} nodes` :
                  'No data'
                }
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-ghost ${showFilters ? 'bg-primary-100 text-primary-700' : ''}`}
              title="Toggle filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={handleRefreshGraph}
              className="btn-ghost"
              title="Refresh graph"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportGraph}
              className="btn-ghost"
              title="Export graph"
            >
              <Download className="w-4 h-4" />
            </button>
            <button className="btn-ghost" title="Fullscreen">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Layout Algorithm
              </label>
              <select
                value={graphLayout}
                onChange={(e) => setGraphLayout(e.target.value)}
                className="input w-full"
              >
                <option value="force">Force-directed</option>
                <option value="circular">Circular</option>
                <option value="hierarchical">Hierarchical</option>
                <option value="grid">Grid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Node Size
              </label>
              <select
                value={nodeSize}
                onChange={(e) => setNodeSize(e.target.value)}
                className="input w-full"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show labels</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeBlocks}
                    onChange={(e) => setIncludeBlocks(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include blocks</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Layout
              </label>
              <select
                value={graphLayout}
                onChange={(e) => setGraphLayout(e.target.value)}
                className="w-full input"
              >
                <option value="force">Force-directed</option>
                <option value="hierarchical">Hierarchical</option>
                <option value="circular">Circular</option>
                <option value="grid">Grid</option>
              </select>
            </div>

            {/* Selected Node Details */}
            {selectedNode && (
              <div className="mt-6 p-4 bg-white rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">Selected Node</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Title:</span> {selectedNode.label}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {selectedNode.type}
                  </div>
                  {selectedNode.metadata?.isJournal && (
                    <div>
                      <span className="font-medium">Journal Entry</span>
                    </div>
                  )}
                  {selectedNode.metadata?.blockCount && (
                    <div>
                      <span className="font-medium">Blocks:</span> {selectedNode.metadata.blockCount}
                    </div>
                  )}
                  {selectedNode.metadata?.pageCount && (
                    <div>
                      <span className="font-medium">Pages:</span> {selectedNode.metadata.pageCount}
                    </div>
                  )}
                  <button
                    onClick={() => handleNodeClick(selectedNode)}
                    className="mt-2 btn-primary text-sm w-full"
                  >
                    Open {selectedNode.type === 'tag' ? 'Search' : 'Page'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Graph Content */}
      <div className="flex-1 bg-gray-50 overflow-hidden">
        <div className="h-full p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading graph data...</p>
              </div>
            </div>
          ) : graphData ? (
            <GraphVisualization
              data={graphData}
              config={{
                width: window.innerWidth - (showFilters ? 400 : 100),
                height: window.innerHeight - 200,
                showLabels,
                theme: 'light', // TODO: Use theme from context
                enableZoom: true,
                enableDrag: true,
                enablePan: true,
              }}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
              className="w-full h-full bg-white rounded-lg shadow-sm border"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No graph data available</p>
                <div className="space-y-2">
                  <button
                    onClick={handleRefreshGraph}
                    className="btn-primary w-full"
                  >
                    Reload Data
                  </button>
                  <button
                    onClick={handleCreateSampleData}
                    className="btn-secondary w-full"
                  >
                    Create Sample Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GraphPage
