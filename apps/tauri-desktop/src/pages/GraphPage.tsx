import React, { useState } from 'react'
import { Network, Maximize2, Filter, Download, RefreshCw, Settings } from 'lucide-react'
import KnowledgeGraph from '../components/KnowledgeGraph'

const GraphPage: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false)
  const [graphLayout, setGraphLayout] = useState('force')
  const [nodeSize, setNodeSize] = useState('medium')
  const [showLabels, setShowLabels] = useState(true)

  const handleExportGraph = () => {
    // In a real app, this would export the graph as SVG/PNG
    console.log('Exporting graph...')
  }

  const handleRefreshGraph = () => {
    // In a real app, this would reload graph data
    console.log('Refreshing graph...')
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
              <span>6 nodes, 7 connections</span>
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
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show labels</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Type
              </label>
              <div className="space-y-1">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="ml-2 text-sm text-gray-700">📝 Notes</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="ml-2 text-sm text-gray-700">🏷️ Tags</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="ml-2 text-sm text-gray-700">💡 Concepts</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graph Content */}
      <div className="flex-1 bg-gray-50 overflow-hidden">
        <div className="h-full p-6">
          <KnowledgeGraph
            width={window.innerWidth - 300}
            height={window.innerHeight - 200}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  )
}

export default GraphPage
