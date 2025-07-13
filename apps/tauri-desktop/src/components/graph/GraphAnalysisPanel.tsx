/**
 * 图形分析面板
 * 提供完整的图形分析功能，包括中心性分析、路径分析、影响力分析等
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { GraphData, GraphNode, GraphLink } from '@minglog/graph'
import { 
  calculateGraphStats, 
  findCentralNodes, 
  calculateShortestPath,
  generateAnalysisReport
} from '@minglog/graph'
import { appCore } from '../../core/AppCore'

interface GraphAnalysisPanelProps {
  /** 图形数据 */
  data: GraphData
  /** 是否显示 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 节点选择回调 */
  onNodeSelect?: (nodeId: string) => void
  /** 路径高亮回调 */
  onPathHighlight?: (path: string[]) => void
  /** 自定义类名 */
  className?: string
}

interface AnalysisState {
  /** 当前分析标签 */
  activeTab: 'centrality' | 'paths' | 'influence' | 'structure' | 'report'
  /** 中心性分析结果 */
  centralityResults: {
    degree: Array<{ node: GraphNode; score: number; rank: number }>
    betweenness: Array<{ node: GraphNode; score: number; rank: number }>
    closeness: Array<{ node: GraphNode; score: number; rank: number }>
    pagerank: Array<{ node: GraphNode; score: number; rank: number }>
  }
  /** 路径分析状态 */
  pathAnalysis: {
    sourceNode: string | null
    targetNode: string | null
    shortestPath: string[] | null
    allPaths: string[][]
    isAnalyzing: boolean
  }
  /** 影响力分析结果 */
  influenceResults: {
    topInfluencers: Array<{ node: GraphNode; score: number; type: string }>
    influenceNetwork: Array<{ source: string; target: string; influence: number }>
    communityLeaders: Array<{ node: GraphNode; community: string; leadership: number }>
  }
  /** 结构分析结果 */
  structureResults: {
    bridges: Array<{ link: GraphLink; criticality: number }>
    cutVertices: Array<{ node: GraphNode; criticality: number }>
    communities: Array<{ id: string; nodes: string[]; density: number }>
    hierarchyLevels: Array<{ level: number; nodes: string[] }>
  }
  /** 分析报告 */
  analysisReport: any | null
  /** 是否正在分析 */
  isAnalyzing: boolean
}

// 分析标签配置
const analysisTabs = [
  { 
    key: 'centrality' as const, 
    label: '中心性分析', 
    icon: '🎯',
    description: '分析节点在网络中的重要性和影响力'
  },
  { 
    key: 'paths' as const, 
    label: '路径分析', 
    icon: '🛤️',
    description: '分析节点间的连接路径和距离'
  },
  { 
    key: 'influence' as const, 
    label: '影响力分析', 
    icon: '⚡',
    description: '分析节点的影响力传播和权威性'
  },
  { 
    key: 'structure' as const, 
    label: '结构分析', 
    icon: '🏗️',
    description: '分析图形的结构特征和关键组件'
  },
  { 
    key: 'report' as const, 
    label: '分析报告', 
    icon: '📊',
    description: '生成完整的图形分析报告'
  }
]

/**
 * 图形分析面板组件
 */
export const GraphAnalysisPanel: React.FC<GraphAnalysisPanelProps> = ({
  data,
  visible,
  onClose,
  onNodeSelect,
  onPathHighlight,
  className = ''
}) => {
  // 状态管理
  const [state, setState] = useState<AnalysisState>({
    activeTab: 'centrality',
    centralityResults: {
      degree: [],
      betweenness: [],
      closeness: [],
      pagerank: []
    },
    pathAnalysis: {
      sourceNode: null,
      targetNode: null,
      shortestPath: null,
      allPaths: [],
      isAnalyzing: false
    },
    influenceResults: {
      topInfluencers: [],
      influenceNetwork: [],
      communityLeaders: []
    },
    structureResults: {
      bridges: [],
      cutVertices: [],
      communities: [],
      hierarchyLevels: []
    },
    analysisReport: null,
    isAnalyzing: false
  })

  // 计算度中心性
  const calculateDegreeCentrality = useCallback(() => {
    const connectionCounts = new Map<string, number>()
    data.nodes.forEach(node => connectionCounts.set(node.id, 0))

    data.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1)
      connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1)
    })

    const maxConnections = Math.max(...Array.from(connectionCounts.values()))

    return data.nodes
      .map(node => ({
        node,
        score: maxConnections > 0 ? (connectionCounts.get(node.id) || 0) / maxConnections : 0,
        rank: 0
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }))
  }, [data])

  // 计算介数中心性（简化版）
  const calculateBetweennessCentrality = useCallback(() => {
    const betweenness = new Map<string, number>()
    data.nodes.forEach(node => betweenness.set(node.id, 0))

    // 简化的介数中心性计算
    data.nodes.forEach(sourceNode => {
      data.nodes.forEach(targetNode => {
        if (sourceNode.id !== targetNode.id) {
          const path = calculateShortestPath(data.nodes, data.links, sourceNode.id, targetNode.id)
          if (path && path.length > 2) {
            // 中间节点的介数中心性增加
            for (let i = 1; i < path.length - 1; i++) {
              const nodeId = path[i]
              betweenness.set(nodeId, (betweenness.get(nodeId) || 0) + 1)
            }
          }
        }
      })
    })

    const maxBetweenness = Math.max(...Array.from(betweenness.values()))

    return data.nodes
      .map(node => ({
        node,
        score: maxBetweenness > 0 ? (betweenness.get(node.id) || 0) / maxBetweenness : 0,
        rank: 0
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }))
  }, [data])

  // 计算接近中心性
  const calculateClosenessCentrality = useCallback(() => {
    const closeness = new Map<string, number>()

    data.nodes.forEach(sourceNode => {
      let totalDistance = 0
      let reachableNodes = 0

      data.nodes.forEach(targetNode => {
        if (sourceNode.id !== targetNode.id) {
          const path = calculateShortestPath(data.nodes, data.links, sourceNode.id, targetNode.id)
          if (path) {
            totalDistance += path.length - 1
            reachableNodes++
          }
        }
      })

      const score = reachableNodes > 0 ? reachableNodes / totalDistance : 0
      closeness.set(sourceNode.id, score)
    })

    const maxCloseness = Math.max(...Array.from(closeness.values()))

    return data.nodes
      .map(node => ({
        node,
        score: maxCloseness > 0 ? (closeness.get(node.id) || 0) / maxCloseness : 0,
        rank: 0
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }))
  }, [data])

  // 计算PageRank（简化版）
  const calculatePageRank = useCallback(() => {
    const pagerank = new Map<string, number>()
    const damping = 0.85
    const iterations = 50

    // 初始化
    data.nodes.forEach(node => pagerank.set(node.id, 1.0))

    // 构建邻接表
    const adjacency = new Map<string, string[]>()
    data.nodes.forEach(node => adjacency.set(node.id, []))

    data.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      adjacency.get(sourceId)?.push(targetId)
      adjacency.get(targetId)?.push(sourceId)
    })

    // 迭代计算
    for (let i = 0; i < iterations; i++) {
      const newPagerank = new Map<string, number>()
      
      data.nodes.forEach(node => {
        let sum = 0
        const neighbors = adjacency.get(node.id) || []
        
        neighbors.forEach(neighborId => {
          const neighborOutDegree = adjacency.get(neighborId)?.length || 1
          sum += (pagerank.get(neighborId) || 0) / neighborOutDegree
        })
        
        newPagerank.set(node.id, (1 - damping) + damping * sum)
      })
      
      pagerank.clear()
      newPagerank.forEach((value, key) => pagerank.set(key, value))
    }

    const maxPagerank = Math.max(...Array.from(pagerank.values()))

    return data.nodes
      .map(node => ({
        node,
        score: maxPagerank > 0 ? (pagerank.get(node.id) || 0) / maxPagerank : 0,
        rank: 0
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }))
  }, [data])

  // 执行中心性分析
  const performCentralityAnalysis = useCallback(async () => {
    setState(prev => ({ ...prev, isAnalyzing: true }))

    try {
      const degree = calculateDegreeCentrality()
      const betweenness = calculateBetweennessCentrality()
      const closeness = calculateClosenessCentrality()
      const pagerank = calculatePageRank()

      setState(prev => ({
        ...prev,
        centralityResults: { degree, betweenness, closeness, pagerank },
        isAnalyzing: false
      }))

      // 发送事件到事件总线
      if (appCore.isInitialized()) {
        const eventBus = appCore.getEventBus()
        eventBus?.emit('graph:analysis:centrality-completed', {
          nodeCount: data.nodes.length,
          topDegreeNode: degree[0]?.node.id,
          topBetweennessNode: betweenness[0]?.node.id,
          topClosenessNode: closeness[0]?.node.id,
          topPagerankNode: pagerank[0]?.node.id
        }, 'GraphAnalysisPanel')
      }

    } catch (error) {
      console.error('中心性分析失败:', error)
      setState(prev => ({ ...prev, isAnalyzing: false }))
    }
  }, [data, calculateDegreeCentrality, calculateBetweennessCentrality, calculateClosenessCentrality, calculatePageRank])

  // 执行路径分析
  const performPathAnalysis = useCallback(async (sourceId: string, targetId: string) => {
    setState(prev => ({
      ...prev,
      pathAnalysis: { ...prev.pathAnalysis, isAnalyzing: true }
    }))

    try {
      const shortestPath = calculateShortestPath(data.nodes, data.links, sourceId, targetId)
      
      setState(prev => ({
        ...prev,
        pathAnalysis: {
          sourceNode: sourceId,
          targetNode: targetId,
          shortestPath,
          allPaths: shortestPath ? [shortestPath] : [],
          isAnalyzing: false
        }
      }))

      // 高亮路径
      if (shortestPath && onPathHighlight) {
        onPathHighlight(shortestPath)
      }

      // 发送事件到事件总线
      if (appCore.isInitialized()) {
        const eventBus = appCore.getEventBus()
        eventBus?.emit('graph:analysis:path-completed', {
          sourceId,
          targetId,
          pathLength: shortestPath?.length || 0,
          pathExists: !!shortestPath
        }, 'GraphAnalysisPanel')
      }

    } catch (error) {
      console.error('路径分析失败:', error)
      setState(prev => ({
        ...prev,
        pathAnalysis: { ...prev.pathAnalysis, isAnalyzing: false }
      }))
    }
  }, [data, onPathHighlight])

  // 生成分析报告
  const generateReport = useCallback(async () => {
    setState(prev => ({ ...prev, isAnalyzing: true }))

    try {
      const report = generateAnalysisReport(data.nodes, data.links)
      
      setState(prev => ({
        ...prev,
        analysisReport: report,
        isAnalyzing: false
      }))

      // 发送事件到事件总线
      if (appCore.isInitialized()) {
        const eventBus = appCore.getEventBus()
        eventBus?.emit('graph:analysis:report-generated', {
          nodeCount: report.stats.nodeCount,
          linkCount: report.stats.linkCount,
          density: report.stats.density,
          components: report.stats.components,
          recommendationCount: report.recommendations.length
        }, 'GraphAnalysisPanel')
      }

    } catch (error) {
      console.error('报告生成失败:', error)
      setState(prev => ({ ...prev, isAnalyzing: false }))
    }
  }, [data])

  // 初始化分析
  useEffect(() => {
    if (visible && data.nodes.length > 0) {
      performCentralityAnalysis()
    }
  }, [visible, data, performCentralityAnalysis])

  // 切换分析标签
  const switchTab = useCallback((tab: AnalysisState['activeTab']) => {
    setState(prev => ({ ...prev, activeTab: tab }))

    // 根据标签执行相应的分析
    switch (tab) {
      case 'report':
        if (!state.analysisReport) {
          generateReport()
        }
        break
    }
  }, [state.analysisReport, generateReport])

  if (!visible) return null

  return (
    <div className={`graph-analysis-panel ${className}`}>
      {/* 遮罩层 */}
      <div className="analysis-panel-overlay" onClick={onClose} />
      
      {/* 主面板 */}
      <div className="analysis-panel-container">
        {/* 标题栏 */}
        <div className="analysis-panel-header">
          <h2 className="panel-title">📊 图形分析面板</h2>
          <button onClick={onClose} className="close-button" title="关闭">
            ✕
          </button>
        </div>

        {/* 标签导航 */}
        <div className="analysis-tabs">
          {analysisTabs.map(tab => (
            <button
              key={tab.key}
              className={`tab-button ${state.activeTab === tab.key ? 'active' : ''}`}
              onClick={() => switchTab(tab.key)}
              title={tab.description}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="analysis-content">
          {state.isAnalyzing && (
            <div className="analysis-loading">
              <div className="loading-spinner" />
              <span>正在分析图形数据...</span>
            </div>
          )}

          {/* 中心性分析 */}
          {state.activeTab === 'centrality' && !state.isAnalyzing && (
            <div className="centrality-analysis">
              <div className="analysis-section">
                <h3 className="section-title">🎯 度中心性 (Degree Centrality)</h3>
                <div className="centrality-list">
                  {state.centralityResults.degree.slice(0, 10).map((item, index) => (
                    <div 
                      key={item.node.id} 
                      className="centrality-item"
                      onClick={() => onNodeSelect?.(item.node.id)}
                    >
                      <div className="item-rank">#{item.rank}</div>
                      <div className="item-info">
                        <div className="item-name">{item.node.label || item.node.id}</div>
                        <div className="item-score">分数: {(item.score * 100).toFixed(1)}%</div>
                      </div>
                      <div className="item-bar">
                        <div 
                          className="bar-fill"
                          style={{ width: `${item.score * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="analysis-section">
                <h3 className="section-title">🌉 介数中心性 (Betweenness Centrality)</h3>
                <div className="centrality-list">
                  {state.centralityResults.betweenness.slice(0, 10).map((item, index) => (
                    <div 
                      key={item.node.id} 
                      className="centrality-item"
                      onClick={() => onNodeSelect?.(item.node.id)}
                    >
                      <div className="item-rank">#{item.rank}</div>
                      <div className="item-info">
                        <div className="item-name">{item.node.label || item.node.id}</div>
                        <div className="item-score">分数: {(item.score * 100).toFixed(1)}%</div>
                      </div>
                      <div className="item-bar">
                        <div 
                          className="bar-fill betweenness"
                          style={{ width: `${item.score * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 路径分析 */}
          {state.activeTab === 'paths' && (
            <div className="path-analysis">
              <div className="analysis-section">
                <h3 className="section-title">🛤️ 路径分析</h3>
                
                <div className="path-controls">
                  <div className="node-selector">
                    <label>起始节点:</label>
                    <select
                      value={state.pathAnalysis.sourceNode || ''}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        pathAnalysis: { ...prev.pathAnalysis, sourceNode: e.target.value || null }
                      }))}
                    >
                      <option value="">选择节点</option>
                      {data.nodes.map(node => (
                        <option key={node.id} value={node.id}>
                          {node.label || node.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="node-selector">
                    <label>目标节点:</label>
                    <select
                      value={state.pathAnalysis.targetNode || ''}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        pathAnalysis: { ...prev.pathAnalysis, targetNode: e.target.value || null }
                      }))}
                    >
                      <option value="">选择节点</option>
                      {data.nodes.map(node => (
                        <option key={node.id} value={node.id}>
                          {node.label || node.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      if (state.pathAnalysis.sourceNode && state.pathAnalysis.targetNode) {
                        performPathAnalysis(state.pathAnalysis.sourceNode, state.pathAnalysis.targetNode)
                      }
                    }}
                    disabled={!state.pathAnalysis.sourceNode || !state.pathAnalysis.targetNode || state.pathAnalysis.isAnalyzing}
                    className="analyze-button"
                  >
                    {state.pathAnalysis.isAnalyzing ? '分析中...' : '分析路径'}
                  </button>
                </div>

                {state.pathAnalysis.shortestPath && (
                  <div className="path-result">
                    <h4>最短路径结果:</h4>
                    <div className="path-info">
                      <div className="path-length">
                        路径长度: {state.pathAnalysis.shortestPath.length - 1} 步
                      </div>
                      <div className="path-nodes">
                        {state.pathAnalysis.shortestPath.map((nodeId, index) => {
                          const node = data.nodes.find(n => n.id === nodeId)
                          return (
                            <span key={nodeId} className="path-node">
                              {node?.label || nodeId}
                              {index < state.pathAnalysis.shortestPath!.length - 1 && ' → '}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 分析报告 */}
          {state.activeTab === 'report' && (
            <div className="analysis-report">
              {state.analysisReport ? (
                <div className="report-content">
                  <div className="report-section">
                    <h3 className="section-title">📈 图形统计</h3>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-label">节点数量</span>
                        <span className="stat-value">{state.analysisReport.stats.nodeCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">连接数量</span>
                        <span className="stat-value">{state.analysisReport.stats.linkCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">平均连接数</span>
                        <span className="stat-value">{state.analysisReport.stats.avgConnections}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">图密度</span>
                        <span className="stat-value">{(state.analysisReport.stats.density * 100).toFixed(2)}%</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">连通分量</span>
                        <span className="stat-value">{state.analysisReport.stats.components}</span>
                      </div>
                    </div>
                  </div>

                  <div className="report-section">
                    <h3 className="section-title">🌟 中心节点</h3>
                    <div className="central-nodes">
                      {state.analysisReport.centralNodes.map((item: any, index: number) => (
                        <div 
                          key={item.node.id} 
                          className="central-node"
                          onClick={() => onNodeSelect?.(item.node.id)}
                        >
                          <span className="node-rank">#{index + 1}</span>
                          <span className="node-name">{item.node.label || item.node.id}</span>
                          <span className="node-connections">{item.connections} 个连接</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {state.analysisReport.recommendations.length > 0 && (
                    <div className="report-section">
                      <h3 className="section-title">💡 优化建议</h3>
                      <div className="recommendations">
                        {state.analysisReport.recommendations.map((recommendation: string, index: number) => (
                          <div key={index} className="recommendation-item">
                            <span className="recommendation-icon">💡</span>
                            <span className="recommendation-text">{recommendation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="report-placeholder">
                  <button onClick={generateReport} className="generate-report-button">
                    生成分析报告
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GraphAnalysisPanel
