import React from 'react'
import { Network, Maximize2, Filter, Download } from 'lucide-react'

const GraphPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      {/* Graph Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Knowledge Graph</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Network className="w-4 h-4" />
              <span>0 nodes, 0 connections</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="btn-ghost">
              <Filter className="w-4 h-4" />
            </button>
            <button className="btn-ghost">
              <Download className="w-4 h-4" />
            </button>
            <button className="btn-ghost">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Graph Content */}
      <div className="flex-1 bg-gray-50">
        <div className="h-full relative">
          {/* Graph Canvas Placeholder */}
          <div className="absolute inset-0 bg-white m-6 rounded-lg border border-gray-200">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Network className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Knowledge Graph Visualization
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  The graph visualization component will be integrated here from @minglog/graph package
                </p>
                <div className="space-y-4 text-left max-w-md mx-auto">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Features to include:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Interactive node-link diagram</li>
                      <li>• Force-directed layout</li>
                      <li>• Node clustering and filtering</li>
                      <li>• Search and highlight</li>
                      <li>• Export capabilities</li>
                      <li>• Zoom and pan controls</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Graph Controls */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-soft border border-gray-200 p-2">
            <div className="space-y-2">
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100" title="Zoom In">
                <span className="text-lg font-bold text-gray-600">+</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100" title="Zoom Out">
                <span className="text-lg font-bold text-gray-600">−</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100" title="Reset View">
                <span className="text-sm font-bold text-gray-600">⌂</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GraphPage
