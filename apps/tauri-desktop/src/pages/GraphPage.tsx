import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Search, Filter, Settings } from 'lucide-react';
import { SimpleGraphVisualization } from '../components/SimpleGraphVisualization';

interface Page {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export const GraphPage: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // 获取页面数据
  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        const pagesResponse = await invoke<string>('get_all_pages');
        const pagesData = JSON.parse(pagesResponse);
        setPages(pagesData);
      } catch (error) {
        console.error('Failed to fetch pages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  // 将页面数据转换为图谱数据
  const transformPagesToGraphData = (pages: Page[]) => {
    const nodes = pages.map(page => ({
      id: page.id,
      label: page.title || 'Untitled',
      type: 'note' as const,
      metadata: {
        content: page.content,
        tags: page.tags || [],
        created_at: page.created_at,
        updated_at: page.updated_at,
      },
      connections: 0, // 将在后面计算
    }));

    // 添加标签节点
    const tagSet = new Set<string>();
    pages.forEach(page => {
      page.tags?.forEach(tag => tagSet.add(tag));
    });

    const tagNodes = Array.from(tagSet).map(tag => ({
      id: `tag-${tag}`,
      label: tag,
      type: 'tag' as const,
      metadata: { tag },
      connections: 0,
    }));

    // 创建链接
    const links: any[] = [];

    // 页面到标签的链接
    pages.forEach(page => {
      page.tags?.forEach(tag => {
        links.push({
          id: `${page.id}-tag-${tag}`,
          source: page.id,
          target: `tag-${tag}`,
          type: 'tag' as const,
          weight: 1,
        });
      });
    });

    // 基于内容相似性的链接（简单实现：共享标签）
    for (let i = 0; i < pages.length; i++) {
      for (let j = i + 1; j < pages.length; j++) {
        const page1 = pages[i];
        const page2 = pages[j];
        const sharedTags = page1.tags?.filter(tag => page2.tags?.includes(tag)) || [];

        if (sharedTags.length > 0) {
          links.push({
            id: `${page1.id}-${page2.id}`,
            source: page1.id,
            target: page2.id,
            type: 'similarity' as const,
            weight: sharedTags.length,
            label: `${sharedTags.length} shared tag${sharedTags.length > 1 ? 's' : ''}`,
          });
        }
      }
    }

    // 计算连接数
    const allNodes = [...nodes, ...tagNodes];
    allNodes.forEach(node => {
      node.connections = links.filter(link =>
        link.source === node.id || link.target === node.id
      ).length;
    });

    return {
      nodes: allNodes,
      links,
    };
  };

  const graphData = transformPagesToGraphData(pages);

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    console.log('Node clicked:', node);
  };

  const handleNodeHover = (node: any) => {
    // 可以添加悬停效果
  };

  const handleCreateSampleData = async () => {
    try {
      await invoke('create_sample_data');
      // 重新获取数据
      const pagesResponse = await invoke<string>('get_all_pages');
      const pagesData = JSON.parse(pagesResponse);
      setPages(pagesData);
    } catch (error) {
      console.error('Failed to create sample data:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Graph</h1>
          <p className="text-gray-600 mt-1">
            Visualize connections between your notes and ideas
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading your knowledge graph...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Graph</h1>
            <p className="text-gray-600 mt-1">
              Visualize connections between your {pages.length} pages and ideas
            </p>
          </div>

          {/* 工具栏 */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <Filter className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5" />
            </button>
            {pages.length === 0 && (
              <button
                onClick={handleCreateSampleData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Create Sample Data
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 图谱可视化 */}
      <div className="flex-1 relative">
        <SimpleGraphVisualization
          data={graphData}
          onNodeClick={handleNodeClick}
          className="w-full h-full"
        />

        {/* 节点详情面板 */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{selectedNode.label}</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {selectedNode.type}
                </span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Connections:</span>
                <span className="ml-2 text-gray-600">{selectedNode.connections}</span>
              </div>

              {selectedNode.metadata?.tags && (
                <div>
                  <span className="font-medium text-gray-700">Tags:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedNode.metadata.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.metadata?.content && (
                <div>
                  <span className="font-medium text-gray-700">Content:</span>
                  <p className="mt-1 text-gray-600 text-xs max-h-20 overflow-y-auto">
                    {selectedNode.metadata.content.substring(0, 200)}
                    {selectedNode.metadata.content.length > 200 ? '...' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
