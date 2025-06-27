/**
 * 图谱页面组件
 * Graph Page Component
 */

import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { useLocale } from '../hooks/useLocale';
import { GraphVisualization, GraphSettings, type GraphData, type GraphNode, type GraphLink } from './GraphVisualization';
import { Button } from './Button';

export interface Page {
  id: string;
  name: string;
  title?: string;
  tags: string[];
  isJournal: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Block {
  id: string;
  content: string;
  pageId: string;
  parentId?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

interface GraphPageProps {
  pages: Page[];
  blocks: Block[];
  onNodeClick?: (node: GraphNode) => void;
  onExportGraph?: (format: 'png' | 'svg' | 'json') => void;
  className?: string;
}

export const GraphPage: React.FC<GraphPageProps> = ({
  pages,
  blocks,
  onNodeClick,
  onExportGraph,
  className,
}) => {
  const { t } = useLocale();
  
  // 图谱设置状态
  const [showLabels, setShowLabels] = useState(true);
  const [showOrphans, setShowOrphans] = useState(true);
  const [nodeSize, setNodeSize] = useState(8);
  const [linkDistance, setLinkDistance] = useState(50);
  const [repulsion, setRepulsion] = useState(100);
  const [attraction, setAttraction] = useState(0.1);
  const [layout, setLayout] = useState<'force' | 'circular' | 'hierarchical' | 'grid'>('force');
  const [showSettings, setShowSettings] = useState(false);
  const [graphType, setGraphType] = useState<'pages' | 'blocks' | 'mixed'>('pages');

  // 生成图谱数据
  const graphData = useMemo((): GraphData => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    if (graphType === 'pages' || graphType === 'mixed') {
      // 添加页面节点
      pages.forEach(page => {
        nodes.push({
          id: `page-${page.id}`,
          label: page.title || page.name,
          type: 'page',
          size: nodeSize + (page.isJournal ? 2 : 0),
        });

        // 添加标签节点和链接
        page.tags.forEach(tag => {
          const tagId = `tag-${tag}`;
          if (!nodes.find(n => n.id === tagId)) {
            nodes.push({
              id: tagId,
              label: tag,
              type: 'tag',
              size: nodeSize - 2,
            });
          }
          
          links.push({
            id: `${page.id}-${tag}`,
            source: `page-${page.id}`,
            target: tagId,
            type: 'tag',
          });
        });
      });
    }

    if (graphType === 'blocks' || graphType === 'mixed') {
      // 添加块节点
      blocks.forEach(block => {
        nodes.push({
          id: `block-${block.id}`,
          label: block.content.substring(0, 30) + (block.content.length > 30 ? '...' : ''),
          type: 'block',
          size: nodeSize - 1,
        });

        // 添加块与页面的链接
        if (graphType === 'mixed') {
          links.push({
            id: `${block.id}-${block.pageId}`,
            source: `block-${block.id}`,
            target: `page-${block.pageId}`,
            type: 'parent',
          });
        }

        // 添加块之间的父子关系
        if (block.parentId) {
          links.push({
            id: `${block.id}-${block.parentId}`,
            source: `block-${block.id}`,
            target: `block-${block.parentId}`,
            type: 'parent',
          });
        }
      });
    }

    // 检测页面之间的引用关系（基于内容中的链接）
    if (graphType === 'pages' || graphType === 'mixed') {
      blocks.forEach(block => {
        // 简单的页面引用检测（可以改进为更复杂的算法）
        const content = block.content.toLowerCase();
        pages.forEach(targetPage => {
          const pageName = (targetPage.title || targetPage.name).toLowerCase();
          if (content.includes(pageName) && block.pageId !== targetPage.id) {
            const sourcePageId = `page-${block.pageId}`;
            const targetPageId = `page-${targetPage.id}`;
            
            // 避免重复链接
            if (!links.find(l => 
              (l.source === sourcePageId && l.target === targetPageId) ||
              (l.source === targetPageId && l.target === sourcePageId)
            )) {
              links.push({
                id: `ref-${block.pageId}-${targetPage.id}`,
                source: sourcePageId,
                target: targetPageId,
                type: 'reference',
              });
            }
          }
        });
      });
    }

    return { nodes, links };
  }, [pages, blocks, graphType, nodeSize]);

  const handleSettingsChange = (settings: any) => {
    if ('showLabels' in settings) setShowLabels(settings.showLabels);
    if ('showOrphans' in settings) setShowOrphans(settings.showOrphans);
    if ('nodeSize' in settings) setNodeSize(settings.nodeSize);
    if ('linkDistance' in settings) setLinkDistance(settings.linkDistance);
    if ('repulsion' in settings) setRepulsion(settings.repulsion);
    if ('attraction' in settings) setAttraction(settings.attraction);
    if ('layout' in settings) setLayout(settings.layout);
  };

  const handleExport = (format: 'png' | 'svg' | 'json') => {
    onExportGraph?.(format);
  };

  return (
    <div className={clsx('flex h-full', className)}>
      {/* 主图谱区域 */}
      <div className="flex-1 flex flex-col">
        {/* 工具栏 */}
        <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('graph.knowledgeGraph')}
              </h2>
              
              {/* 图谱类型选择 */}
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
                {[
                  { value: 'pages', label: t('graph.pageGraph') },
                  { value: 'blocks', label: t('graph.blockGraph') },
                  { value: 'mixed', label: t('graph.mixedGraph') },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setGraphType(option.value as any)}
                    className={clsx(
                      'px-3 py-1.5 text-sm font-medium transition-colors',
                      'first:rounded-l-lg last:rounded-r-lg',
                      graphType === option.value
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* 导出按钮 */}
              <div className="flex space-x-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleExport('png')}
                  title={t('graph.exportAsPNG')}
                >
                  PNG
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleExport('svg')}
                  title={t('graph.exportAsSVG')}
                >
                  SVG
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleExport('json')}
                  title={t('graph.exportAsJSON')}
                >
                  JSON
                </Button>
              </div>

              {/* 设置按钮 */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              >
                {t('graph.graphSettings')}
              </Button>
            </div>
          </div>
        </div>

        {/* 图谱可视化 */}
        <div className="flex-1 p-4">
          {graphData.nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 dark:text-gray-600 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t('graph.noData')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('graph.noDataDescription')}
                </p>
              </div>
            </div>
          ) : (
            <GraphVisualization
              data={graphData}
              width={800}
              height={600}
              onNodeClick={onNodeClick}
              showLabels={showLabels}
              showOrphans={showOrphans}
              nodeSize={nodeSize}
              linkDistance={linkDistance}
              repulsion={repulsion}
              attraction={attraction}
              layout={layout}
              className="w-full h-full"
            />
          )}
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {t('graph.graphSettings')}
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <GraphSettings
            showLabels={showLabels}
            showOrphans={showOrphans}
            nodeSize={nodeSize}
            linkDistance={linkDistance}
            repulsion={repulsion}
            attraction={attraction}
            layout={layout}
            onSettingsChange={handleSettingsChange}
          />
        </div>
      )}
    </div>
  );
};

export default GraphPage;
