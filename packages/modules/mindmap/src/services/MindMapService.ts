/**
 * 思维导图服务
 * 提供思维导图的CRUD操作、数据同步、版本管理功能
 */

import { MindMapData, MindMapNode, MindMapLink, CreateMindMapRequest, UpdateMindMapRequest } from '../types'

export interface IMindMapService {
  // 思维导图CRUD操作
  createMindMap(request: CreateMindMapRequest): Promise<MindMapData>
  getMindMap(id: string): Promise<MindMapData | null>
  getMindMaps(filter?: MindMapFilter): Promise<MindMapData[]>
  updateMindMap(id: string, updates: UpdateMindMapRequest): Promise<MindMapData>
  deleteMindMap(id: string): Promise<void>
  
  // 节点操作
  addNode(mindMapId: string, node: Omit<MindMapNode, 'id'>): Promise<MindMapNode>
  updateNode(mindMapId: string, nodeId: string, updates: Partial<MindMapNode>): Promise<MindMapNode>
  deleteNode(mindMapId: string, nodeId: string): Promise<void>
  moveNode(mindMapId: string, nodeId: string, newParentId: string | null): Promise<void>
  
  // 链接操作
  addLink(mindMapId: string, link: Omit<MindMapLink, 'id'>): Promise<MindMapLink>
  updateLink(mindMapId: string, linkId: string, updates: Partial<MindMapLink>): Promise<MindMapLink>
  deleteLink(mindMapId: string, linkId: string): Promise<void>
  
  // 数据同步
  syncWithNote(mindMapId: string, noteId: string): Promise<void>
  generateFromNote(noteId: string): Promise<MindMapData>
  exportToNote(mindMapId: string): Promise<string>
  
  // 搜索
  searchMindMaps(query: string): Promise<MindMapData[]>
}

interface MindMapFilter {
  linkedNoteId?: string
  layoutType?: string
  theme?: string
  createdAfter?: Date
  createdBefore?: Date
  limit?: number
  offset?: number
}

interface CreateMindMapRequest {
  title: string
  description?: string
  linkedNoteId?: string
  layoutType?: string
  theme?: string
  initialData?: Partial<MindMapData>
}

interface UpdateMindMapRequest {
  title?: string
  description?: string
  data?: MindMapData
  layoutType?: string
  theme?: string
  settings?: Record<string, any>
}

export class MindMapService implements IMindMapService {
  private coreAPI: any

  constructor(coreAPI?: any) {
    this.coreAPI = coreAPI
  }

  async createMindMap(request: CreateMindMapRequest): Promise<MindMapData> {
    const now = new Date()
    const mindMapId = this.generateId()
    
    // 创建根节点
    const rootNode: MindMapNode = {
      id: this.generateId(),
      text: request.title || '中心主题',
      level: 0,
      children: [],
      x: 0,
      y: 0,
      style: {
        backgroundColor: '#3B82F6',
        textColor: '#FFFFFF',
        borderColor: '#1E40AF',
        borderWidth: 2,
        borderRadius: 8,
        fontSize: 16,
        fontWeight: 'bold'
      },
      metadata: {
        createdAt: now,
        updatedAt: now
      }
    }

    const mindMapData: MindMapData = {
      nodes: [rootNode],
      links: [],
      rootId: rootNode.id,
      metadata: {
        title: request.title,
        description: request.description,
        createdAt: now,
        updatedAt: now,
        version: '1.0.0'
      }
    }

    // 保存到数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `INSERT INTO mindmaps (
          id, title, description, data, layout_type, theme, linked_note_id, 
          settings, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mindMapId,
          request.title,
          request.description || '',
          JSON.stringify(mindMapData),
          request.layoutType || 'tree',
          request.theme || 'default',
          request.linkedNoteId || null,
          JSON.stringify({}),
          now.toISOString(),
          now.toISOString()
        ]
      )

      // 保存根节点
      await this.saveNodeToDatabase(mindMapId, rootNode)
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:created', { mindMapId, data: mindMapData })
    }

    return mindMapData
  }

  async getMindMap(id: string): Promise<MindMapData | null> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const results = await this.coreAPI.database.query(
      'SELECT * FROM mindmaps WHERE id = ?',
      [id]
    )

    if (results.length === 0) {
      return null
    }

    const mindMapRow = results[0]
    
    // 加载节点
    const nodeResults = await this.coreAPI.database.query(
      'SELECT * FROM mindmap_nodes WHERE mindmap_id = ? ORDER BY level, created_at',
      [id]
    )

    // 加载链接
    const linkResults = await this.coreAPI.database.query(
      'SELECT * FROM mindmap_links WHERE mindmap_id = ?',
      [id]
    )

    const nodes = nodeResults.map((row: any) => this.mapRowToNode(row))
    const links = linkResults.map((row: any) => this.mapRowToLink(row))

    // 构建节点层次结构
    const nodeMap = new Map<string, MindMapNode>()
    nodes.forEach(node => {
      node.children = []
      nodeMap.set(node.id, node)
    })

    // 建立父子关系
    nodes.forEach(node => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!
        parent.children.push(node)
      }
    })

    const mindMapData: MindMapData = {
      nodes,
      links,
      rootId: mindMapRow.data ? JSON.parse(mindMapRow.data).rootId : nodes[0]?.id || '',
      metadata: {
        title: mindMapRow.title,
        description: mindMapRow.description,
        createdAt: new Date(mindMapRow.created_at),
        updatedAt: new Date(mindMapRow.updated_at),
        version: '1.0.0'
      }
    }

    return mindMapData
  }

  async getMindMaps(filter?: MindMapFilter): Promise<MindMapData[]> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    let query = 'SELECT * FROM mindmaps WHERE 1=1'
    const params: any[] = []

    if (filter?.linkedNoteId) {
      query += ' AND linked_note_id = ?'
      params.push(filter.linkedNoteId)
    }

    if (filter?.layoutType) {
      query += ' AND layout_type = ?'
      params.push(filter.layoutType)
    }

    if (filter?.theme) {
      query += ' AND theme = ?'
      params.push(filter.theme)
    }

    if (filter?.createdAfter) {
      query += ' AND created_at >= ?'
      params.push(filter.createdAfter.toISOString())
    }

    if (filter?.createdBefore) {
      query += ' AND created_at <= ?'
      params.push(filter.createdBefore.toISOString())
    }

    query += ' ORDER BY updated_at DESC'

    if (filter?.limit) {
      query += ' LIMIT ?'
      params.push(filter.limit)
      if (filter.offset) {
        query += ' OFFSET ?'
        params.push(filter.offset)
      }
    }

    const results = await this.coreAPI.database.query(query, params)
    const mindMaps: MindMapData[] = []

    for (const row of results) {
      const mindMap = await this.getMindMap(row.id)
      if (mindMap) {
        mindMaps.push(mindMap)
      }
    }

    return mindMaps
  }

  async updateMindMap(id: string, updates: UpdateMindMapRequest): Promise<MindMapData> {
    const mindMap = await this.getMindMap(id)
    if (!mindMap) {
      throw new Error(`MindMap ${id} not found`)
    }

    const now = new Date()

    // 更新元数据
    if (updates.title) {
      mindMap.metadata!.title = updates.title
    }
    if (updates.description !== undefined) {
      mindMap.metadata!.description = updates.description
    }
    if (updates.data) {
      mindMap.nodes = updates.data.nodes
      mindMap.links = updates.data.links
      mindMap.rootId = updates.data.rootId
    }
    mindMap.metadata!.updatedAt = now

    // 更新数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `UPDATE mindmaps SET 
          title = ?, description = ?, data = ?, layout_type = ?, 
          theme = ?, settings = ?, updated_at = ?
        WHERE id = ?`,
        [
          updates.title || mindMap.metadata?.title,
          updates.description !== undefined ? updates.description : mindMap.metadata?.description,
          JSON.stringify(mindMap),
          updates.layoutType || 'tree',
          updates.theme || 'default',
          JSON.stringify(updates.settings || {}),
          now.toISOString(),
          id
        ]
      )

      // 更新节点数据
      if (updates.data) {
        // 删除旧节点
        await this.coreAPI.database.execute(
          'DELETE FROM mindmap_nodes WHERE mindmap_id = ?',
          [id]
        )
        
        // 删除旧链接
        await this.coreAPI.database.execute(
          'DELETE FROM mindmap_links WHERE mindmap_id = ?',
          [id]
        )

        // 保存新节点
        for (const node of updates.data.nodes) {
          await this.saveNodeToDatabase(id, node)
        }

        // 保存新链接
        for (const link of updates.data.links) {
          await this.saveLinkToDatabase(id, link)
        }
      }
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:updated', { mindMapId: id, data: mindMap })
    }

    return mindMap
  }

  async deleteMindMap(id: string): Promise<void> {
    const mindMap = await this.getMindMap(id)
    if (!mindMap) {
      throw new Error(`MindMap ${id} not found`)
    }

    // 从数据库删除
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        'DELETE FROM mindmaps WHERE id = ?',
        [id]
      )
      
      // 级联删除节点和链接（通过外键约束自动处理）
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:deleted', { mindMapId: id })
    }
  }

  async addNode(mindMapId: string, node: Omit<MindMapNode, 'id'>): Promise<MindMapNode> {
    const newNode: MindMapNode = {
      ...node,
      id: this.generateId(),
      children: [],
      metadata: {
        ...node.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    // 保存到数据库
    if (this.coreAPI?.database) {
      await this.saveNodeToDatabase(mindMapId, newNode)
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:node-added', { mindMapId, node: newNode })
    }

    return newNode
  }

  async updateNode(mindMapId: string, nodeId: string, updates: Partial<MindMapNode>): Promise<MindMapNode> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const results = await this.coreAPI.database.query(
      'SELECT * FROM mindmap_nodes WHERE id = ? AND mindmap_id = ?',
      [nodeId, mindMapId]
    )

    if (results.length === 0) {
      throw new Error(`Node ${nodeId} not found in mindmap ${mindMapId}`)
    }

    const node = this.mapRowToNode(results[0])
    const updatedNode: MindMapNode = {
      ...node,
      ...updates,
      id: nodeId, // 确保ID不被覆盖
      metadata: {
        ...node.metadata,
        ...updates.metadata,
        updatedAt: new Date()
      }
    }

    // 更新数据库
    await this.coreAPI.database.execute(
      `UPDATE mindmap_nodes SET 
        text = ?, level = ?, parent_id = ?, x = ?, y = ?, 
        style = ?, metadata = ?, updated_at = ?
      WHERE id = ? AND mindmap_id = ?`,
      [
        updatedNode.text,
        updatedNode.level,
        updatedNode.parentId || null,
        updatedNode.x || 0,
        updatedNode.y || 0,
        JSON.stringify(updatedNode.style || {}),
        JSON.stringify(updatedNode.metadata || {}),
        new Date().toISOString(),
        nodeId,
        mindMapId
      ]
    )

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:node-updated', { mindMapId, node: updatedNode })
    }

    return updatedNode
  }

  async deleteNode(mindMapId: string, nodeId: string): Promise<void> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    // 删除节点（级联删除子节点）
    await this.coreAPI.database.execute(
      'DELETE FROM mindmap_nodes WHERE id = ? AND mindmap_id = ?',
      [nodeId, mindMapId]
    )

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:node-deleted', { mindMapId, nodeId })
    }
  }

  async moveNode(mindMapId: string, nodeId: string, newParentId: string | null): Promise<void> {
    await this.updateNode(mindMapId, nodeId, { parentId: newParentId })
  }

  async addLink(mindMapId: string, link: Omit<MindMapLink, 'id'>): Promise<MindMapLink> {
    const newLink: MindMapLink = {
      ...link,
      id: this.generateId()
    }

    // 保存到数据库
    if (this.coreAPI?.database) {
      await this.saveLinkToDatabase(mindMapId, newLink)
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:link-added', { mindMapId, link: newLink })
    }

    return newLink
  }

  async updateLink(mindMapId: string, linkId: string, updates: Partial<MindMapLink>): Promise<MindMapLink> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const results = await this.coreAPI.database.query(
      'SELECT * FROM mindmap_links WHERE id = ? AND mindmap_id = ?',
      [linkId, mindMapId]
    )

    if (results.length === 0) {
      throw new Error(`Link ${linkId} not found in mindmap ${mindMapId}`)
    }

    const link = this.mapRowToLink(results[0])
    const updatedLink: MindMapLink = {
      ...link,
      ...updates,
      id: linkId // 确保ID不被覆盖
    }

    // 更新数据库
    await this.coreAPI.database.execute(
      `UPDATE mindmap_links SET 
        source_id = ?, target_id = ?, type = ?, style = ?, updated_at = ?
      WHERE id = ? AND mindmap_id = ?`,
      [
        updatedLink.source,
        updatedLink.target,
        updatedLink.type,
        JSON.stringify(updatedLink.style || {}),
        new Date().toISOString(),
        linkId,
        mindMapId
      ]
    )

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:link-updated', { mindMapId, link: updatedLink })
    }

    return updatedLink
  }

  async deleteLink(mindMapId: string, linkId: string): Promise<void> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    await this.coreAPI.database.execute(
      'DELETE FROM mindmap_links WHERE id = ? AND mindmap_id = ?',
      [linkId, mindMapId]
    )

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:link-deleted', { mindMapId, linkId })
    }
  }

  async syncWithNote(mindMapId: string, noteId: string): Promise<void> {
    // TODO: 实现与笔记的同步逻辑
    console.log(`Syncing mindmap ${mindMapId} with note ${noteId}`)
  }

  async generateFromNote(noteId: string): Promise<MindMapData> {
    // TODO: 从笔记内容生成思维导图
    throw new Error('Not implemented')
  }

  async exportToNote(mindMapId: string): Promise<string> {
    // TODO: 将思维导图导出为笔记格式
    throw new Error('Not implemented')
  }

  async searchMindMaps(query: string): Promise<MindMapData[]> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const results = await this.coreAPI.database.query(
      `SELECT DISTINCT m.* FROM mindmaps m 
       LEFT JOIN mindmap_nodes n ON m.id = n.mindmap_id
       WHERE m.title LIKE ? OR m.description LIKE ? OR n.text LIKE ?
       ORDER BY m.updated_at DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    )

    const mindMaps: MindMapData[] = []
    for (const row of results) {
      const mindMap = await this.getMindMap(row.id)
      if (mindMap) {
        mindMaps.push(mindMap)
      }
    }

    return mindMaps
  }

  private async saveNodeToDatabase(mindMapId: string, node: MindMapNode): Promise<void> {
    if (!this.coreAPI?.database) return

    await this.coreAPI.database.execute(
      `INSERT INTO mindmap_nodes (
        id, mindmap_id, text, level, parent_id, x, y, style, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        node.id,
        mindMapId,
        node.text,
        node.level,
        node.parentId || null,
        node.x || 0,
        node.y || 0,
        JSON.stringify(node.style || {}),
        JSON.stringify(node.metadata || {}),
        (node.metadata?.createdAt || new Date()).toISOString(),
        (node.metadata?.updatedAt || new Date()).toISOString()
      ]
    )
  }

  private async saveLinkToDatabase(mindMapId: string, link: MindMapLink): Promise<void> {
    if (!this.coreAPI?.database) return

    await this.coreAPI.database.execute(
      `INSERT INTO mindmap_links (
        id, mindmap_id, source_id, target_id, type, style, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        link.id,
        mindMapId,
        link.source,
        link.target,
        link.type,
        JSON.stringify(link.style || {}),
        new Date().toISOString(),
        new Date().toISOString()
      ]
    )
  }

  private mapRowToNode(row: any): MindMapNode {
    return {
      id: row.id,
      text: row.text,
      level: row.level,
      parentId: row.parent_id,
      children: [], // 将在getMindMap中填充
      x: row.x,
      y: row.y,
      style: JSON.parse(row.style || '{}'),
      metadata: JSON.parse(row.metadata || '{}')
    }
  }

  private mapRowToLink(row: any): MindMapLink {
    return {
      id: row.id,
      source: row.source_id,
      target: row.target_id,
      type: row.type,
      style: JSON.parse(row.style || '{}')
    }
  }

  private generateId(): string {
    return `mindmap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
