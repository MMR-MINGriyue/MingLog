/**
 * 看板服务
 * 提供看板视图、列管理、任务拖拽功能
 */

import { Task, KanbanBoard, KanbanColumn, KanbanCard, TaskStatus } from '../types'

export interface IKanbanService {
  // 看板管理
  createBoard(name: string, projectId?: string): Promise<KanbanBoard>
  getBoard(id: string): Promise<KanbanBoard | null>
  getBoards(projectId?: string): Promise<KanbanBoard[]>
  updateBoard(id: string, updates: Partial<KanbanBoard>): Promise<KanbanBoard>
  deleteBoard(id: string): Promise<void>
  
  // 列管理
  createColumn(boardId: string, name: string, status: TaskStatus): Promise<KanbanColumn>
  updateColumn(id: string, updates: Partial<KanbanColumn>): Promise<KanbanColumn>
  deleteColumn(id: string): Promise<void>
  reorderColumns(boardId: string, columnIds: string[]): Promise<void>
  
  // 卡片管理
  moveCard(taskId: string, fromColumnId: string, toColumnId: string, position: number): Promise<void>
  getBoardData(boardId: string): Promise<KanbanBoard>
}

export class KanbanService implements IKanbanService {
  private coreAPI: any

  constructor(coreAPI?: any) {
    this.coreAPI = coreAPI
  }

  async createBoard(name: string, projectId?: string): Promise<KanbanBoard> {
    const now = new Date()
    const board: KanbanBoard = {
      id: this.generateId(),
      name,
      projectId,
      columns: [],
      settings: {
        allowDragDrop: true,
        showTaskCount: true,
        showProgress: true,
        autoArchiveCompleted: false
      },
      createdAt: now,
      updatedAt: now
    }

    // 创建默认列
    const defaultColumns = [
      { name: '待办', status: TaskStatus.TODO, color: '#e3f2fd' },
      { name: '进行中', status: TaskStatus.IN_PROGRESS, color: '#fff3e0' },
      { name: '已完成', status: TaskStatus.DONE, color: '#e8f5e8' }
    ]

    for (let i = 0; i < defaultColumns.length; i++) {
      const col = defaultColumns[i]
      const column = await this.createColumn(board.id, col.name, col.status)
      column.color = col.color
      column.order = i
      board.columns.push(column)
    }

    // 保存到数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `INSERT INTO kanban_boards (
          id, name, project_id, settings, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          board.id, board.name, board.projectId || null,
          JSON.stringify(board.settings),
          board.createdAt.toISOString(), board.updatedAt.toISOString()
        ]
      )
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('kanban:board-created', { board })
    }

    return board
  }

  async getBoard(id: string): Promise<KanbanBoard | null> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const results = await this.coreAPI.database.query(
      'SELECT * FROM kanban_boards WHERE id = ?',
      [id]
    )

    if (results.length === 0) {
      return null
    }

    const board = this.mapRowToBoard(results[0])
    
    // 加载列
    const columns = await this.coreAPI.database.query(
      'SELECT * FROM kanban_columns WHERE board_id = ? ORDER BY column_order',
      [id]
    )
    
    board.columns = columns.map((row: any) => this.mapRowToColumn(row))
    
    return board
  }

  async getBoards(projectId?: string): Promise<KanbanBoard[]> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    let query = 'SELECT * FROM kanban_boards'
    const params: any[] = []

    if (projectId) {
      query += ' WHERE project_id = ?'
      params.push(projectId)
    }

    query += ' ORDER BY created_at DESC'

    const results = await this.coreAPI.database.query(query, params)
    const boards = results.map((row: any) => this.mapRowToBoard(row))

    // 为每个看板加载列
    for (const board of boards) {
      const columns = await this.coreAPI.database.query(
        'SELECT * FROM kanban_columns WHERE board_id = ? ORDER BY column_order',
        [board.id]
      )
      board.columns = columns.map((row: any) => this.mapRowToColumn(row))
    }

    return boards
  }

  async updateBoard(id: string, updates: Partial<KanbanBoard>): Promise<KanbanBoard> {
    const board = await this.getBoard(id)
    if (!board) {
      throw new Error(`Board ${id} not found`)
    }

    const updatedBoard: KanbanBoard = {
      ...board,
      ...updates,
      updatedAt: new Date()
    }

    // 更新数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `UPDATE kanban_boards SET 
          name = ?, project_id = ?, settings = ?, updated_at = ?
        WHERE id = ?`,
        [
          updatedBoard.name, updatedBoard.projectId || null,
          JSON.stringify(updatedBoard.settings), updatedBoard.updatedAt.toISOString(),
          id
        ]
      )
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('kanban:board-updated', { board: updatedBoard })
    }

    return updatedBoard
  }

  async deleteBoard(id: string): Promise<void> {
    const board = await this.getBoard(id)
    if (!board) {
      throw new Error(`Board ${id} not found`)
    }

    // 删除相关的列
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        'DELETE FROM kanban_columns WHERE board_id = ?',
        [id]
      )
      
      await this.coreAPI.database.execute(
        'DELETE FROM kanban_boards WHERE id = ?',
        [id]
      )
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('kanban:board-deleted', { boardId: id })
    }
  }

  async createColumn(boardId: string, name: string, status: TaskStatus): Promise<KanbanColumn> {
    const now = new Date()
    
    // 获取当前最大排序值
    let maxOrder = 0
    if (this.coreAPI?.database) {
      const results = await this.coreAPI.database.query(
        'SELECT MAX(column_order) as max_order FROM kanban_columns WHERE board_id = ?',
        [boardId]
      )
      maxOrder = (results[0]?.max_order || 0) + 1
    }

    const column: KanbanColumn = {
      id: this.generateId(),
      boardId,
      name,
      status,
      order: maxOrder,
      color: '#f5f5f5',
      limit: null,
      cards: [],
      createdAt: now,
      updatedAt: now
    }

    // 保存到数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `INSERT INTO kanban_columns (
          id, board_id, name, status, column_order, color, task_limit, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          column.id, column.boardId, column.name, column.status,
          column.order, column.color, column.limit,
          column.createdAt.toISOString(), column.updatedAt.toISOString()
        ]
      )
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('kanban:column-created', { column })
    }

    return column
  }

  async updateColumn(id: string, updates: Partial<KanbanColumn>): Promise<KanbanColumn> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const results = await this.coreAPI.database.query(
      'SELECT * FROM kanban_columns WHERE id = ?',
      [id]
    )

    if (results.length === 0) {
      throw new Error(`Column ${id} not found`)
    }

    const column = this.mapRowToColumn(results[0])
    const updatedColumn: KanbanColumn = {
      ...column,
      ...updates,
      updatedAt: new Date()
    }

    // 更新数据库
    await this.coreAPI.database.execute(
      `UPDATE kanban_columns SET 
        name = ?, status = ?, column_order = ?, color = ?, task_limit = ?, updated_at = ?
      WHERE id = ?`,
      [
        updatedColumn.name, updatedColumn.status, updatedColumn.order,
        updatedColumn.color, updatedColumn.limit, updatedColumn.updatedAt.toISOString(),
        id
      ]
    )

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('kanban:column-updated', { column: updatedColumn })
    }

    return updatedColumn
  }

  async deleteColumn(id: string): Promise<void> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const results = await this.coreAPI.database.query(
      'SELECT * FROM kanban_columns WHERE id = ?',
      [id]
    )

    if (results.length === 0) {
      throw new Error(`Column ${id} not found`)
    }

    // 删除列
    await this.coreAPI.database.execute(
      'DELETE FROM kanban_columns WHERE id = ?',
      [id]
    )

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('kanban:column-deleted', { columnId: id })
    }
  }

  async reorderColumns(boardId: string, columnIds: string[]): Promise<void> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    // 更新列的排序
    for (let i = 0; i < columnIds.length; i++) {
      await this.coreAPI.database.execute(
        'UPDATE kanban_columns SET column_order = ?, updated_at = ? WHERE id = ? AND board_id = ?',
        [i, new Date().toISOString(), columnIds[i], boardId]
      )
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('kanban:columns-reordered', { boardId, columnIds })
    }
  }

  async moveCard(taskId: string, fromColumnId: string, toColumnId: string, position: number): Promise<void> {
    // 这个方法需要与TasksService协调，更新任务状态
    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('kanban:card-moved', { 
        taskId, fromColumnId, toColumnId, position 
      })
    }
  }

  async getBoardData(boardId: string): Promise<KanbanBoard> {
    const board = await this.getBoard(boardId)
    if (!board) {
      throw new Error(`Board ${boardId} not found`)
    }

    // 为每列加载任务卡片
    for (const column of board.columns) {
      if (this.coreAPI?.database) {
        const tasks = await this.coreAPI.database.query(
          'SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC',
          [column.status]
        )
        
        column.cards = tasks.map((task: any) => ({
          id: task.id,
          taskId: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.due_date ? new Date(task.due_date) : null,
          tags: JSON.parse(task.tags || '[]'),
          assignee: null, // 可以扩展
          position: 0 // 可以扩展
        }))
      }
    }

    return board
  }

  private mapRowToBoard(row: any): KanbanBoard {
    return {
      id: row.id,
      name: row.name,
      projectId: row.project_id,
      columns: [],
      settings: JSON.parse(row.settings || '{}'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  private mapRowToColumn(row: any): KanbanColumn {
    return {
      id: row.id,
      boardId: row.board_id,
      name: row.name,
      status: row.status as TaskStatus,
      order: row.column_order || 0,
      color: row.color || '#f5f5f5',
      limit: row.task_limit,
      cards: [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  private generateId(): string {
    return `kanban_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
