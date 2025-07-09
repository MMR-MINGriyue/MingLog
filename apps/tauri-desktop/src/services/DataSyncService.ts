/**
 * 数据同步服务 - 管理编辑器、图谱和搜索功能之间的数据同步
 */

import { EventEmitter } from 'events'
import { GraphData, GraphNode, GraphLink } from '@minglog/graph'
import { Descendant } from 'slate'

// 数据同步事件类型
export interface DataSyncEvents {
  'graph-updated': (data: GraphData) => void
  'editor-updated': (pageId: string, content: Descendant[]) => void
  'search-index-updated': (index: SearchIndex) => void
  'node-selected': (nodeId: string) => void
  'page-opened': (pageId: string) => void
  'sync-error': (error: Error) => void
}

// 搜索索引类型
export interface SearchIndex {
  pages: Array<{
    id: string
    title: string
    content: string
    tags: string[]
    lastModified: string
  }>
  blocks: Array<{
    id: string
    pageId: string
    content: string
    type: string
    order: number
  }>
  tags: Array<{
    name: string
    count: number
    pages: string[]
  }>
}

// 数据状态类型
export interface DataState {
  graphData: GraphData | null
  currentPage: any | null
  searchIndex: SearchIndex | null
  isLoading: boolean
  lastSync: Date | null
  errors: Error[]
}

class DataSyncService extends EventEmitter {
  private state: DataState = {
    graphData: null,
    currentPage: null,
    searchIndex: null,
    isLoading: false,
    lastSync: null,
    errors: []
  }

  private syncQueue: Array<() => Promise<void>> = []
  private isSyncing = false

  constructor() {
    super()
    this.setupEventListeners()
  }

  // 设置事件监听器
  private setupEventListeners() {
    // 监听图谱数据变化
    this.on('graph-updated', this.handleGraphUpdate.bind(this))
    
    // 监听编辑器内容变化
    this.on('editor-updated', this.handleEditorUpdate.bind(this))
    
    // 监听节点选择
    this.on('node-selected', this.handleNodeSelection.bind(this))
  }

  // 获取当前状态
  getState(): DataState {
    return { ...this.state }
  }

  // 更新图谱数据
  async updateGraphData(data: GraphData) {
    this.state.graphData = data
    this.emit('graph-updated', data)
    await this.updateSearchIndex()
  }

  // 更新编辑器内容
  async updateEditorContent(pageId: string, content: Descendant[]) {
    this.emit('editor-updated', pageId, content)
    await this.syncEditorToGraph(pageId, content)
    await this.updateSearchIndex()
  }

  // 选择节点
  selectNode(nodeId: string) {
    this.emit('node-selected', nodeId)
  }

  // 打开页面
  openPage(pageId: string) {
    this.emit('page-opened', pageId)
  }

  // 处理图谱更新
  private async handleGraphUpdate(data: GraphData) {
    try {
      // 更新搜索索引
      await this.rebuildSearchIndex(data)
      
      // 通知其他组件
      console.log('Graph data updated:', data.nodes.length, 'nodes')
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  // 处理编辑器更新
  private async handleEditorUpdate(pageId: string, content: Descendant[]) {
    try {
      // 更新图谱中对应的节点
      if (this.state.graphData) {
        const nodeIndex = this.state.graphData.nodes.findIndex(node => node.id === pageId)
        if (nodeIndex !== -1) {
          // 提取文本内容
          const textContent = this.extractTextFromSlateContent(content)
          
          // 更新节点内容
          this.state.graphData.nodes[nodeIndex] = {
            ...this.state.graphData.nodes[nodeIndex],
            content: textContent,
            updatedAt: new Date().toISOString()
          }
          
          // 重新计算节点大小（基于内容长度）
          this.state.graphData.nodes[nodeIndex].size = Math.max(5, Math.min(20, textContent.length / 10))
        }
      }
      
      console.log('Editor content updated for page:', pageId)
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  // 处理节点选择
  private async handleNodeSelection(nodeId: string) {
    try {
      // 如果选择的是笔记节点，准备编辑器数据
      if (this.state.graphData) {
        const node = this.state.graphData.nodes.find(n => n.id === nodeId)
        if (node && node.type === 'note') {
          // 这里可以触发页面加载
          console.log('Note node selected:', node.title)
        }
      }
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  // 同步编辑器内容到图谱
  private async syncEditorToGraph(pageId: string, content: Descendant[]) {
    return new Promise<void>((resolve) => {
      this.addToSyncQueue(async () => {
        // 提取标题和标签
        const { title, tags, links } = this.analyzeContent(content)
        
        // 更新图谱节点
        if (this.state.graphData) {
          this.updateGraphNode(pageId, title, tags)
          this.updateGraphLinks(pageId, links)
        }
        
        resolve()
      })
    })
  }

  // 更新搜索索引
  private async updateSearchIndex() {
    if (!this.state.graphData) return

    const searchIndex: SearchIndex = {
      pages: [],
      blocks: [],
      tags: []
    }

    // 从图谱数据构建搜索索引
    this.state.graphData.nodes.forEach(node => {
      if (node.type === 'note') {
        searchIndex.pages.push({
          id: node.id,
          title: node.title,
          content: node.content || '',
          tags: node.tags || [],
          lastModified: node.updatedAt || new Date().toISOString()
        })
      }
    })

    // 构建标签索引
    const tagCounts = new Map<string, { count: number; pages: string[] }>()
    searchIndex.pages.forEach(page => {
      page.tags.forEach(tag => {
        if (!tagCounts.has(tag)) {
          tagCounts.set(tag, { count: 0, pages: [] })
        }
        const tagData = tagCounts.get(tag)!
        tagData.count++
        tagData.pages.push(page.id)
      })
    })

    searchIndex.tags = Array.from(tagCounts.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      pages: data.pages
    }))

    this.state.searchIndex = searchIndex
    this.emit('search-index-updated', searchIndex)
  }

  // 重建搜索索引
  private async rebuildSearchIndex(graphData: GraphData) {
    this.state.graphData = graphData
    await this.updateSearchIndex()
  }

  // 分析内容提取信息
  private analyzeContent(content: Descendant[]): { title: string; tags: string[]; links: string[] } {
    const textContent = this.extractTextFromSlateContent(content)
    
    // 提取标题（第一行或第一个标题块）
    const lines = textContent.split('\n').filter(line => line.trim())
    const title = lines[0] || '无标题'
    
    // 提取标签（#标签格式）
    const tagMatches = textContent.match(/#[\w\u4e00-\u9fa5]+/g) || []
    const tags = tagMatches.map(tag => tag.substring(1))
    
    // 提取链接（[[链接]]格式）
    const linkMatches = textContent.match(/\[\[([^\]]+)\]\]/g) || []
    const links = linkMatches.map(link => link.slice(2, -2))
    
    return { title, tags, links }
  }

  // 从Slate内容提取纯文本
  private extractTextFromSlateContent(content: Descendant[]): string {
    return content
      .map(node => {
        if ('children' in node) {
          return node.children
            .map(child => ('text' in child ? child.text : ''))
            .join('')
        }
        return ''
      })
      .join('\n')
  }

  // 更新图谱节点
  private updateGraphNode(nodeId: string, title: string, tags: string[]) {
    if (!this.state.graphData) return

    const nodeIndex = this.state.graphData.nodes.findIndex(node => node.id === nodeId)
    if (nodeIndex !== -1) {
      this.state.graphData.nodes[nodeIndex] = {
        ...this.state.graphData.nodes[nodeIndex],
        title,
        tags,
        updatedAt: new Date().toISOString()
      }
    }
  }

  // 更新图谱链接
  private updateGraphLinks(nodeId: string, links: string[]) {
    if (!this.state.graphData) return

    // 移除旧的引用链接
    this.state.graphData.links = this.state.graphData.links.filter(
      link => !(link.source === nodeId && link.type === 'reference')
    )

    // 添加新的引用链接
    links.forEach(targetTitle => {
      const targetNode = this.state.graphData!.nodes.find(node => node.title === targetTitle)
      if (targetNode) {
        this.state.graphData!.links.push({
          id: `ref_${nodeId}_${targetNode.id}`,
          source: nodeId,
          target: targetNode.id,
          type: 'reference',
          weight: 0.8
        })
      }
    })
  }

  // 添加到同步队列
  private addToSyncQueue(task: () => Promise<void>) {
    this.syncQueue.push(task)
    this.processSyncQueue()
  }

  // 处理同步队列
  private async processSyncQueue() {
    if (this.isSyncing || this.syncQueue.length === 0) return

    this.isSyncing = true
    this.state.isLoading = true

    try {
      while (this.syncQueue.length > 0) {
        const task = this.syncQueue.shift()!
        await task()
      }
      
      this.state.lastSync = new Date()
    } catch (error) {
      this.handleError(error as Error)
    } finally {
      this.isSyncing = false
      this.state.isLoading = false
    }
  }

  // 处理错误
  private handleError(error: Error) {
    console.error('DataSyncService error:', error)
    this.state.errors.push(error)
    this.emit('sync-error', error)
  }

  // 清理错误
  clearErrors() {
    this.state.errors = []
  }

  // 销毁服务
  destroy() {
    this.removeAllListeners()
    this.syncQueue = []
    this.state = {
      graphData: null,
      currentPage: null,
      searchIndex: null,
      isLoading: false,
      lastSync: null,
      errors: []
    }
  }
}

// 创建单例实例
export const dataSyncService = new DataSyncService()

export default DataSyncService
