/**
 * 图谱分析工具组件
 */

import React, { useMemo } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Network, 
  Target, 
  Users, 
  Link as LinkIcon,
  Activity,
  Zap
} from 'lucide-react'

import { GraphData, GraphNode, GraphLink } from '../types'

interface GraphAnalyticsProps {
  data: GraphData
  className?: string
}

interface AnalyticsData {
  totalNodes: number
  totalLinks: number
  averageConnections: number
  maxConnections: number
  minConnections: number
  nodeTypeDistribution: Record<string, number>
  linkTypeDistribution: Record<string, number>
  centralityScores: Array<{ nodeId: string; title: string; score: number }>
  clusteringCoefficient: number
  networkDensity: number
  connectedComponents: number
  averagePathLength: number
}

export const GraphAnalytics: React.FC<GraphAnalyticsProps> = ({
  data,
  className = ''
}) => {
  // 计算图谱分析数据
  const analytics = useMemo((): AnalyticsData => {
    const { nodes, links } = data
    
    // 基础统计
    const totalNodes = nodes.length
    const totalLinks = links.length
    
    // 连接度统计
    const connectionCounts = new Map<string, number>()
    nodes.forEach(node => connectionCounts.set(node.id, 0))
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1)
      connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1)
    })
    
    const connections = Array.from(connectionCounts.values())
    const averageConnections = connections.reduce((sum, count) => sum + count, 0) / totalNodes
    const maxConnections = Math.max(...connections, 0)
    const minConnections = Math.min(...connections, 0)
    
    // 节点类型分布
    const nodeTypeDistribution: Record<string, number> = {}
    nodes.forEach(node => {
      nodeTypeDistribution[node.type] = (nodeTypeDistribution[node.type] || 0) + 1
    })
    
    // 链接类型分布
    const linkTypeDistribution: Record<string, number> = {}
    links.forEach(link => {
      linkTypeDistribution[link.type] = (linkTypeDistribution[link.type] || 0) + 1
    })
    
    // 中心性分析（度中心性）
    const centralityScores = nodes
      .map(node => ({
        nodeId: node.id,
        title: node.title,
        score: connectionCounts.get(node.id) || 0
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
    
    // 聚类系数（简化计算）
    let totalTriangles = 0
    let totalTriplets = 0
    
    nodes.forEach(node => {
      const neighbors = new Set<string>()
      links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id
        const targetId = typeof link.target === 'string' ? link.target : link.target.id
        
        if (sourceId === node.id) neighbors.add(targetId)
        if (targetId === node.id) neighbors.add(sourceId)
      })
      
      const neighborArray = Array.from(neighbors)
      const degree = neighborArray.length
      
      if (degree >= 2) {
        totalTriplets += (degree * (degree - 1)) / 2
        
        // 计算邻居之间的连接
        for (let i = 0; i < neighborArray.length; i++) {
          for (let j = i + 1; j < neighborArray.length; j++) {
            const hasConnection = links.some(link => {
              const sourceId = typeof link.source === 'string' ? link.source : link.source.id
              const targetId = typeof link.target === 'string' ? link.target : link.target.id
              
              return (sourceId === neighborArray[i] && targetId === neighborArray[j]) ||
                     (sourceId === neighborArray[j] && targetId === neighborArray[i])
            })
            
            if (hasConnection) totalTriangles++
          }
        }
      }
    })
    
    const clusteringCoefficient = totalTriplets > 0 ? totalTriangles / totalTriplets : 0
    
    // 网络密度
    const maxPossibleLinks = (totalNodes * (totalNodes - 1)) / 2
    const networkDensity = maxPossibleLinks > 0 ? totalLinks / maxPossibleLinks : 0
    
    // 连通分量数（简化计算）
    const visited = new Set<string>()
    let connectedComponents = 0
    
    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)
      
      links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id
        const targetId = typeof link.target === 'string' ? link.target : link.target.id
        
        if (sourceId === nodeId && !visited.has(targetId)) {
          dfs(targetId)
        } else if (targetId === nodeId && !visited.has(sourceId)) {
          dfs(sourceId)
        }
      })
    }
    
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        connectedComponents++
        dfs(node.id)
      }
    })
    
    // 平均路径长度（简化估算）
    const averagePathLength = totalNodes > 1 ? Math.log(totalNodes) / Math.log(averageConnections || 1) : 0
    
    return {
      totalNodes,
      totalLinks,
      averageConnections,
      maxConnections,
      minConnections,
      nodeTypeDistribution,
      linkTypeDistribution,
      centralityScores,
      clusteringCoefficient,
      networkDensity,
      connectedComponents,
      averagePathLength
    }
  }, [data])

  // 节点类型中文映射
  const nodeTypeLabels: Record<string, string> = {
    note: '笔记',
    tag: '标签',
    folder: '文件夹',
    link: '链接'
  }

  // 链接类型中文映射
  const linkTypeLabels: Record<string, string> = {
    reference: '引用',
    tag: '标签',
    folder: '文件夹',
    similarity: '相似性'
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* 标题 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">图谱分析</h3>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 基础统计 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Network className="w-4 h-4 mr-2" />
            基础统计
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalNodes}</div>
              <div className="text-sm text-blue-600">节点总数</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics.totalLinks}</div>
              <div className="text-sm text-green-600">连接总数</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.averageConnections.toFixed(1)}
              </div>
              <div className="text-sm text-purple-600">平均连接数</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{analytics.maxConnections}</div>
              <div className="text-sm text-orange-600">最大连接数</div>
            </div>
          </div>
        </div>

        {/* 网络指标 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            网络指标
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">网络密度</span>
              <span className="text-sm font-medium">{(analytics.networkDensity * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">聚类系数</span>
              <span className="text-sm font-medium">{analytics.clusteringCoefficient.toFixed(3)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">连通分量</span>
              <span className="text-sm font-medium">{analytics.connectedComponents}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">平均路径长度</span>
              <span className="text-sm font-medium">{analytics.averagePathLength.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* 节点类型分布 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            节点类型分布
          </h4>
          <div className="space-y-2">
            {Object.entries(analytics.nodeTypeDistribution).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {nodeTypeLabels[type] || type}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(count / analytics.totalNodes) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 中心性排名 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            中心性排名 (Top 5)
          </h4>
          <div className="space-y-2">
            {analytics.centralityScores.slice(0, 5).map((item, index) => (
              <div key={item.nodeId} className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </div>
                </div>
                <div className="text-sm text-gray-500">{item.score}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 连接类型分布 */}
        {Object.keys(analytics.linkTypeDistribution).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <LinkIcon className="w-4 h-4 mr-2" />
              连接类型分布
            </h4>
            <div className="space-y-2">
              {Object.entries(analytics.linkTypeDistribution).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {linkTypeLabels[type] || type}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${(count / analytics.totalLinks) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GraphAnalytics
