import React, { useState, useEffect } from 'react';
import { GraphVisualization } from '@minglog/graph';
import { useLogseqStore, core } from '../stores/logseq-store';
import { Button } from '@minglog/ui';
import { 
  AdjustmentsHorizontalIcon, 
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';

interface GraphPageProps {}

export const GraphPage: React.FC<GraphPageProps> = () => {
  const { isInitialized, initialize } = useLogseqStore();
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLayout, setSelectedLayout] = useState<'force' | 'hierarchical' | 'circular' | 'grid'>('force');
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize core
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Load graph data
  useEffect(() => {
    const loadGraphData = async () => {
      if (!core || !isInitialized) return;

      try {
        setLoading(true);
        
        // Get all pages and their relationships
        const pages = await core.pageService.getAllPages();
        const allBlocks = [];
        
        // Get blocks for each page
        for (const page of pages) {
          const blocks = await core.blockService.getBlocksByPageId(page.id);
          allBlocks.push(...blocks);
        }

        // Transform data for graph visualization
        const graphData = {
          notes: pages.map(page => ({
            id: page.id,
            title: page.title,
            content: page.content || '',
            createdAt: page.createdAt,
            updatedAt: page.updatedAt,
            tags: page.tags || [],
          })),
          tags: [], // We'll implement tag extraction later
          links: [], // We'll implement link extraction later
        };

        setGraphData(graphData);
      } catch (error) {
        console.error('Failed to load graph data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGraphData();
  }, [core, isInitialized]);

  const handleNodeClick = (node: any) => {
    console.log('Node clicked:', node);
    // Navigate to the page/note
    if (node.type === 'note') {
      // You can implement navigation here
      window.location.href = `/pages/${node.id}`;
    }
  };

  const handleNodeHover = (node: any) => {
    console.log('Node hovered:', node);
    // Show tooltip or highlight related nodes
  };

  const handleLayoutChange = (layout: typeof selectedLayout) => {
    setSelectedLayout(layout);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-screen'} flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Graph</h1>
          <div className="flex items-center space-x-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Layout selector */}
          <select
            value={selectedLayout}
            onChange={(e) => handleLayoutChange(e.target.value as typeof selectedLayout)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="force">Force Layout</option>
            <option value="hierarchical">Hierarchical</option>
            <option value="circular">Circular</option>
            <option value="grid">Grid</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="h-4 w-4" />
            ) : (
              <ArrowsPointingOutIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Node Size
              </label>
              <input
                type="range"
                min="5"
                max="20"
                defaultValue="8"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link Distance
              </label>
              <input
                type="range"
                min="50"
                max="200"
                defaultValue="100"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Charge Strength
              </label>
              <input
                type="range"
                min="-500"
                max="-100"
                defaultValue="-300"
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Graph Visualization */}
      <div className="flex-1 relative">
        {graphData && (
          <GraphVisualization
            data={graphData}
            config={{
              width: window.innerWidth,
              height: window.innerHeight - (showSettings ? 200 : 120),
              enableZoom: true,
              enableDrag: true,
              showLabels: true,
              theme: 'light',
            }}
            filter={{
              searchQuery: searchQuery,
            }}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            className="w-full h-full"
          />
        )}
      </div>

      {/* Stats */}
      <div className="p-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>
            {graphData?.notes?.length || 0} notes, {graphData?.links?.length || 0} connections
          </span>
          <span>Layout: {selectedLayout}</span>
        </div>
      </div>
    </div>
  );
};

export default GraphPage;
