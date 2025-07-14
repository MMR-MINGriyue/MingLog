/**
 * 图谱服务
 * 提供图谱数据的CRUD操作、节点边管理、数据同步功能
 */

import { GraphData, GraphNode, GraphLink, GraphFilter, GraphStats } from '../types'

export interface IGraphService {
  // 图谱CRUD操作
  createGraph(name: string, description?: string): Promise<string>
  getGraph(id: string): Promise<GraphData | null>
  getGraphs(): Promise<Array<{ id: string; name: string; description?: string; createdAt: Date; updatedAt: Date }>>
  updateGraph(id: string, data: GraphData): Promise<void>
  deleteGraph(id: string): Promise<void>
  
  // 节点操作
  addNode(graphId: string, node: Omit<GraphNode, 'id'>): Promise<GraphNode>
  updateNode(graphId: string, nodeId: string, updates: Partial<GraphNode>): Promise<GraphNode>
  deleteNode(graphId: string, nodeId: string): Promise<void>
  getNode(graphId: string, nodeId: string): Promise<GraphNode | null>
  getNodes(graphId: string, filter?: GraphFilter): Promise<GraphNode[]>
  
  // 边操作
  addEdge(graphId: string, edge: Omit<GraphLink, 'id'>): Promise<GraphLink>
  updateEdge(graphId: string, edgeId: string, updates: Partial<GraphLink>): Promise<GraphLink>
  deleteEdge(graphId: string, edgeId: string): Promise<void>
  getEdge(graphId: string, edgeId: string): Promise<GraphLink | null>
  getEdges(graphId: string, filter?: GraphFilter): Promise<GraphLink[]>
  
  // 数据同步
  addNodeFromNote(noteData: any): Promise<void>
  updateNodeFromNote(noteData: any): Promise<void>
  removeNodeFromNote(noteData: any): Promise<void>
  addEdgeFromLink(linkData: any): Promise<void>
  removeEdgeFromLink(linkData: any): Promise<void>
  
  // 查询和搜索
  searchNodes(graphId: string, query: string): Promise<GraphNode[]>
  searchEdges(graphId: string, query: string): Promise<GraphLink[]>
  getNeighbors(graphId: string, nodeId: string, depth?: number): Promise<GraphNode[]>
  getConnectedComponents(graphId: string): Promise<GraphNode[][]>
  
  // 统计信息
  getGraphStats(graphId: string): Promise<GraphStats>
  getNodeStats(graphId: string, nodeId: string): Promise<any>
}

export class GraphService implements IGraphService {
  private coreAPI: any

  constructor(coreAPI?: any) {
    this.coreAPI = coreAPI
  }

  async createGraph(name: string, description?: string): Promise<string> {
    const graphId = this.generateId()
    const now = new Date()

    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `INSERT INTO graphs (id, name, path, settings, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          graphId,
          name,
          '', // path可以为空
          JSON.stringify({ description }),
          now.toISOString(),
          now.toISOString()
        ]
      )
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:created', { graphId, name, description })
    }

    return graphId
  }

  async getGraph(id: string): Promise<GraphData | null> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    // 获取节点
    const nodeResults = await this.coreAPI.database.query(
      'SELECT * FROM graph_nodes WHERE graph_id = ?',
      [id]
    )

    // 获取边
    const edgeResults = await this.coreAPI.database.query(
      'SELECT * FROM graph_edges WHERE graph_id = ?',
      [id]
    )

    if (nodeResults.length === 0 && edgeResults.length === 0) {
      return null
    }

    const nodes = nodeResults.map((row: any) => this.mapRowToNode(row))
    const links = edgeResults.map((row: any) => this.mapRowToEdge(row))

    return { nodes, links }
  }

  async getGraphs(): Promise<Array<{ id: string; name: string; description?: string; createdAt: Date; updatedAt: Date }>> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const results = await this.coreAPI.database.query(
      'SELECT * FROM graphs ORDER BY updated_at DESC'
    )

    return results.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: JSON.parse(row.settings || '{}').description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }))
  }

  async updateGraph(id: string, data: GraphData): Promise<void> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const now = new Date()

    // 更新图谱信息
    await this.coreAPI.database.execute(
      'UPDATE graphs SET updated_at = ? WHERE id = ?',
      [now.toISOString(), id]
    )

    // 删除现有节点和边
    await this.coreAPI.database.execute(
      'DELETE FROM graph_nodes WHERE graph_id = ?',
      [id]
    )
    await this.coreAPI.database.execute(
      'DELETE FROM graph_edges WHERE graph_id = ?',
      [id]
    )

    // 插入新节点
    for (const node of data.nodes) {
      await this.saveNodeToDatabase(id, node)
    }

    // 插入新边
    for (const link of data.links) {
      await this.saveEdgeToDatabase(id, link)
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:updated', { graphId: id, data })
    }
  }

  async deleteGraph(id: string): Promise<void> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    // 删除图谱（级联删除节点和边）
    await this.coreAPI.database.execute(
      'DELETE FROM graphs WHERE id = ?',
      [id]
    )

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:deleted', { graphId: id })
    }
  }

  async addNode(graphId: string, node: Omit<GraphNode, 'id'>): Promise<GraphNode> {
    const newNode: GraphNode = {
      ...node,
      id: this.generateId()
    }

    await this.saveNodeToDatabase(graphId, newNode)

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:node-added', { graphId, node: newNode })
    }

    return newNode
  }

  async updateNode(graphId: string, nodeId: string, updates: Partial<GraphNode>): Promise<GraphNode> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const results = await this.coreAPI.database.query(
      'SELECT * FROM graph_nodes WHERE id = ? AND graph_id = ?',
      [nodeId, graphId]
    )

    if (results.length === 0) {
      throw new Error(`Node ${nodeId} not found in graph ${graphId}`)
    }

    const node = this.mapRowToNode(results[0])
    const updatedNode: GraphNode = {
      ...node,
      ...updates,
      id: nodeId // 确保ID不被覆盖
    }

    // 更新数据库
    await this.coreAPI.database.execute(
      `UPDATE graph_nodes SET 
        node_type = ?, title = ?, content = ?, tags = ?, properties = ?,
        x = ?, y = ?, size = ?, color = ?, updated_at = ?
      WHERE id = ? AND graph_id = ?`,
      [
        updatedNode.type,
        updatedNode.title,
        updatedNode.content || '',
        JSON.stringify(updatedNode.tags || []),
        JSON.stringify({}), // properties
        updatedNode.x || 0,
        updatedNode.y || 0,
        updatedNode.size || 1,
        updatedNode.color || '',
        new Date().toISOString(),
        nodeId,
        graphId
      ]
    )

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:node-updated', { graphId, node: updatedNode })
    }

    return updatedNode
  }

  async deleteNode(graphId: string, nodeId: string): Promise<void> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    // 删除节点（级联删除相关边）
    await this.coreAPI.database.execute(
      'DELETE FROM graph_nodes WHERE id = ? AND graph_id = ?',
      [nodeId, graphId]
    )

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:node-deleted', { graphId, nodeId })
    }
  }

  async getNode(graphId: string, nodeId: string): Promise<GraphNode | null> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const results = await this.coreAPI.database.query(
      'SELECT * FROM graph_nodes WHERE id = ? AND graph_id = ?',
      [nodeId, graphId]
    )

    if (results.length === 0) {
      return null
    }

    return this.mapRowToNode(results[0])
  }

  async getNodes(graphId: string, filter?: GraphFilter): Promise<GraphNode[]> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    let query = 'SELECT * FROM graph_nodes WHERE graph_id = ?'
    const params: any[] = [graphId]

    if (filter?.nodeTypes && filter.nodeTypes.length > 0) {
      query += ` AND node_type IN (${filter.nodeTypes.map(() => '?').join(', ')})`
      params.push(...filter.nodeTypes)
    }

    if (filter?.searchQuery) {
      query += ' AND (title LIKE ? OR content LIKE ?)'
      params.push(`%${filter.searchQuery}%`, `%${filter.searchQuery}%`)
    }

    query += ' ORDER BY created_at DESC'

    const results = await this.coreAPI.database.query(query, params)
    return results.map((row: any) => this.mapRowToNode(row))
  }

  async addEdge(graphId: string, edge: Omit<GraphLink, 'id'>): Promise<GraphLink> {
    const newEdge: GraphLink = {
      ...edge,
      id: this.generateId()
    }

    await this.saveEdgeToDatabase(graphId, newEdge)

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:edge-added', { graphId, edge: newEdge })
    }

    return newEdge
  }

  async updateEdge(graphId: string, edgeId: string, updates: Partial<GraphLink>): Promise<GraphLink> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const results = await this.coreAPI.database.query(
      'SELECT * FROM graph_edges WHERE id = ? AND graph_id = ?',
      [edgeId, graphId]
    )

    if (results.length === 0) {
      throw new Error(`Edge ${edgeId} not found in graph ${graphId}`)
    }

    const edge = this.mapRowToEdge(results[0])
    const updatedEdge: GraphLink = {
      ...edge,
      ...updates,
      id: edgeId // 确保ID不被覆盖
    }

    // 更新数据库
    await this.coreAPI.database.execute(
      `UPDATE graph_edges SET 
        source_id = ?, target_id = ?, edge_type = ?, weight = ?, 
        label = ?, properties = ?, updated_at = ?
      WHERE id = ? AND graph_id = ?`,
      [
        typeof updatedEdge.source === 'string' ? updatedEdge.source : updatedEdge.source.id,
        typeof updatedEdge.target === 'string' ? updatedEdge.target : updatedEdge.target.id,
        updatedEdge.type,
        updatedEdge.weight || 1.0,
        updatedEdge.label || '',
        JSON.stringify({}), // properties
        new Date().toISOString(),
        edgeId,
        graphId
      ]
    )

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:edge-updated', { graphId, edge: updatedEdge })
    }

    return updatedEdge
  }

  async deleteEdge(graphId: string, edgeId: string): Promise<void> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    await this.coreAPI.database.execute(
      'DELETE FROM graph_edges WHERE id = ? AND graph_id = ?',
      [edgeId, graphId]
    )

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:edge-deleted', { graphId, edgeId })
    }
  }

  async getEdge(graphId: string, edgeId: string): Promise<GraphLink | null> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const results = await this.coreAPI.database.query(
      'SELECT * FROM graph_edges WHERE id = ? AND graph_id = ?',
      [edgeId, graphId]
    )

    if (results.length === 0) {
      return null
    }

    return this.mapRowToEdge(results[0])
  }

  async getEdges(graphId: string, filter?: GraphFilter): Promise<GraphLink[]> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    let query = 'SELECT * FROM graph_edges WHERE graph_id = ?'
    const params: any[] = [graphId]

    if (filter?.linkTypes && filter.linkTypes.length > 0) {
      query += ` AND edge_type IN (${filter.linkTypes.map(() => '?').join(', ')})`
      params.push(...filter.linkTypes)
    }

    query += ' ORDER BY created_at DESC'

    const results = await this.coreAPI.database.query(query, params)
    return results.map((row: any) => this.mapRowToEdge(row))
  }

  async addNodeFromNote(noteData: any): Promise<void> {
    // 从笔记数据创建图谱节点
    const graphId = await this.getOrCreateDefaultGraph()
    
    const node: Omit<GraphNode, 'id'> = {
      title: noteData.title || 'Untitled',
      type: 'note',
      content: noteData.content || '',
      tags: noteData.tags || [],
      createdAt: noteData.createdAt || new Date().toISOString(),
      updatedAt: noteData.updatedAt || new Date().toISOString()
    }

    await this.addNode(graphId, node)
  }

  async updateNodeFromNote(noteData: any): Promise<void> {
    // 更新对应的图谱节点
    const graphId = await this.getOrCreateDefaultGraph()
    
    // 查找对应的节点
    const nodes = await this.searchNodes(graphId, noteData.title)
    if (nodes.length > 0) {
      const nodeId = nodes[0].id
      await this.updateNode(graphId, nodeId, {
        title: noteData.title,
        content: noteData.content,
        tags: noteData.tags,
        updatedAt: noteData.updatedAt || new Date().toISOString()
      })
    }
  }

  async removeNodeFromNote(noteData: any): Promise<void> {
    // 从图谱中移除对应的节点
    const graphId = await this.getOrCreateDefaultGraph()
    
    // 查找对应的节点
    const nodes = await this.searchNodes(graphId, noteData.title)
    if (nodes.length > 0) {
      await this.deleteNode(graphId, nodes[0].id)
    }
  }

  async addEdgeFromLink(linkData: any): Promise<void> {
    // 从链接数据创建图谱边
    const graphId = await this.getOrCreateDefaultGraph()
    
    const edge: Omit<GraphLink, 'id'> = {
      source: linkData.sourceId,
      target: linkData.targetId,
      type: linkData.linkType || 'reference',
      weight: linkData.weight || 1.0,
      label: linkData.label || ''
    }

    await this.addEdge(graphId, edge)
  }

  async removeEdgeFromLink(linkData: any): Promise<void> {
    // 从图谱中移除对应的边
    const graphId = await this.getOrCreateDefaultGraph()
    
    // 查找对应的边
    const edges = await this.getEdges(graphId)
    const edge = edges.find(e => 
      (typeof e.source === 'string' ? e.source : e.source.id) === linkData.sourceId &&
      (typeof e.target === 'string' ? e.target : e.target.id) === linkData.targetId
    )
    
    if (edge) {
      await this.deleteEdge(graphId, edge.id)
    }
  }

  async searchNodes(graphId: string, query: string): Promise<GraphNode[]> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const results = await this.coreAPI.database.query(
      `SELECT * FROM graph_nodes 
       WHERE graph_id = ? AND (title LIKE ? OR content LIKE ?)
       ORDER BY title`,
      [graphId, `%${query}%`, `%${query}%`]
    )

    return results.map((row: any) => this.mapRowToNode(row))
  }

  async searchEdges(graphId: string, query: string): Promise<GraphLink[]> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const results = await this.coreAPI.database.query(
      `SELECT * FROM graph_edges 
       WHERE graph_id = ? AND (label LIKE ? OR edge_type LIKE ?)
       ORDER BY created_at DESC`,
      [graphId, `%${query}%`, `%${query}%`]
    )

    return results.map((row: any) => this.mapRowToEdge(row))
  }

  async getNeighbors(graphId: string, nodeId: string, depth: number = 1): Promise<GraphNode[]> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const neighbors = new Set<string>()
    const queue: { nodeId: string; currentDepth: number }[] = [{ nodeId, currentDepth: 0 }]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const { nodeId: currentNodeId, currentDepth } = queue.shift()!
      
      if (visited.has(currentNodeId) || currentDepth >= depth) {
        continue
      }
      
      visited.add(currentNodeId)

      // 获取相邻节点
      const edges = await this.coreAPI.database.query(
        'SELECT * FROM graph_edges WHERE graph_id = ? AND (source_id = ? OR target_id = ?)',
        [graphId, currentNodeId, currentNodeId]
      )

      for (const edge of edges) {
        const neighborId = edge.source_id === currentNodeId ? edge.target_id : edge.source_id
        if (neighborId !== nodeId) { // 排除起始节点
          neighbors.add(neighborId)
          if (currentDepth + 1 < depth) {
            queue.push({ nodeId: neighborId, currentDepth: currentDepth + 1 })
          }
        }
      }
    }

    // 获取邻居节点详细信息
    if (neighbors.size === 0) {
      return []
    }

    const neighborIds = Array.from(neighbors)
    const placeholders = neighborIds.map(() => '?').join(', ')
    const results = await this.coreAPI.database.query(
      `SELECT * FROM graph_nodes WHERE graph_id = ? AND id IN (${placeholders})`,
      [graphId, ...neighborIds]
    )

    return results.map((row: any) => this.mapRowToNode(row))
  }

  async getConnectedComponents(graphId: string): Promise<GraphNode[][]> {
    const nodes = await this.getNodes(graphId)
    const edges = await this.getEdges(graphId)
    
    const visited = new Set<string>()
    const components: GraphNode[][] = []

    // 构建邻接表
    const adjacency = new Map<string, string[]>()
    for (const node of nodes) {
      adjacency.set(node.id, [])
    }
    
    for (const edge of edges) {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id
      
      adjacency.get(sourceId)?.push(targetId)
      adjacency.get(targetId)?.push(sourceId)
    }

    // DFS查找连通分量
    const dfs = (nodeId: string, component: GraphNode[]) => {
      if (visited.has(nodeId)) return
      
      visited.add(nodeId)
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        component.push(node)
      }
      
      const neighbors = adjacency.get(nodeId) || []
      for (const neighborId of neighbors) {
        dfs(neighborId, component)
      }
    }

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        const component: GraphNode[] = []
        dfs(node.id, component)
        if (component.length > 0) {
          components.push(component)
        }
      }
    }

    return components
  }

  async getGraphStats(graphId: string): Promise<GraphStats> {
    const nodes = await this.getNodes(graphId)
    const links = await this.getEdges(graphId)
    
    const nodeCount = nodes.length
    const linkCount = links.length
    
    // 计算连接度
    const connectionCounts = new Map<string, number>()
    for (const link of links) {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1)
      connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1)
    }
    
    const connections = Array.from(connectionCounts.values())
    const avgConnections = connections.length > 0 ? connections.reduce((a, b) => a + b, 0) / connections.length : 0
    const maxConnections = connections.length > 0 ? Math.max(...connections) : 0
    
    // 计算密度
    const maxPossibleLinks = nodeCount > 1 ? (nodeCount * (nodeCount - 1)) / 2 : 0
    const density = maxPossibleLinks > 0 ? linkCount / maxPossibleLinks : 0
    
    // 计算连通分量
    const components = await this.getConnectedComponents(graphId)
    
    return {
      nodeCount,
      linkCount,
      avgConnections,
      maxConnections,
      clusters: components.length,
      density,
      components: components.length
    }
  }

  async getNodeStats(graphId: string, nodeId: string): Promise<any> {
    const neighbors = await this.getNeighbors(graphId, nodeId, 1)
    const edges = await this.getEdges(graphId)
    
    const nodeEdges = edges.filter(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id
      return sourceId === nodeId || targetId === nodeId
    })
    
    return {
      degree: neighbors.length,
      inDegree: nodeEdges.filter(edge => {
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id
        return targetId === nodeId
      }).length,
      outDegree: nodeEdges.filter(edge => {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id
        return sourceId === nodeId
      }).length,
      neighbors: neighbors.length
    }
  }

  private async getOrCreateDefaultGraph(): Promise<string> {
    // 获取或创建默认图谱
    const graphs = await this.getGraphs()
    if (graphs.length > 0) {
      return graphs[0].id
    }
    
    return await this.createGraph('默认图谱', '自动生成的知识图谱')
  }

  private async saveNodeToDatabase(graphId: string, node: GraphNode): Promise<void> {
    if (!this.coreAPI?.database) return

    await this.coreAPI.database.execute(
      `INSERT INTO graph_nodes (
        id, graph_id, node_type, title, content, tags, properties,
        x, y, size, color, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        node.id,
        graphId,
        node.type,
        node.title,
        node.content || '',
        JSON.stringify(node.tags || []),
        JSON.stringify({}), // properties
        node.x || 0,
        node.y || 0,
        node.size || 1,
        node.color || '',
        node.createdAt || new Date().toISOString(),
        node.updatedAt || new Date().toISOString()
      ]
    )
  }

  private async saveEdgeToDatabase(graphId: string, edge: GraphLink): Promise<void> {
    if (!this.coreAPI?.database) return

    await this.coreAPI.database.execute(
      `INSERT INTO graph_edges (
        id, graph_id, source_id, target_id, edge_type, weight, label, properties, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        edge.id,
        graphId,
        typeof edge.source === 'string' ? edge.source : edge.source.id,
        typeof edge.target === 'string' ? edge.target : edge.target.id,
        edge.type,
        edge.weight || 1.0,
        edge.label || '',
        JSON.stringify({}), // properties
        new Date().toISOString(),
        new Date().toISOString()
      ]
    )
  }

  private mapRowToNode(row: any): GraphNode {
    return {
      id: row.id,
      title: row.title,
      type: row.node_type as any,
      content: row.content,
      tags: JSON.parse(row.tags || '[]'),
      x: row.x,
      y: row.y,
      size: row.size,
      color: row.color,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  private mapRowToEdge(row: any): GraphLink {
    return {
      id: row.id,
      source: row.source_id,
      target: row.target_id,
      type: row.edge_type as any,
      weight: row.weight,
      label: row.label,
      color: undefined, // 可以从properties中解析
      strength: row.weight
    }
  }

  private generateId(): string {
    return `graph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
