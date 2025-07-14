/**
 * 导入导出服务
 * 提供任务数据的导入导出功能，支持多种格式
 */

import { Task, Project, ImportResult, ExportResult, ImportFormat, ExportFormat } from '../types'

export interface IImportExportService {
  // 导入
  importTasks(data: string, format: ImportFormat): Promise<ImportResult>
  importProjects(data: string, format: ImportFormat): Promise<ImportResult>
  importFromFile(filePath: string): Promise<ImportResult>
  
  // 导出
  exportTasks(taskIds?: string[], format?: ExportFormat): Promise<ExportResult>
  exportProjects(projectIds?: string[], format?: ExportFormat): Promise<ExportResult>
  exportToFile(filePath: string, format: ExportFormat): Promise<void>
  
  // 格式支持
  getSupportedImportFormats(): ImportFormat[]
  getSupportedExportFormats(): ExportFormat[]
}

export class ImportExportService implements IImportExportService {
  private coreAPI: any

  constructor(coreAPI?: any) {
    this.coreAPI = coreAPI
  }

  async importTasks(data: string, format: ImportFormat): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      errors: [],
      items: []
    }

    try {
      let tasks: any[] = []

      switch (format) {
        case ImportFormat.JSON:
          tasks = JSON.parse(data)
          break
        case ImportFormat.CSV:
          tasks = this.parseCSV(data)
          break
        case ImportFormat.MARKDOWN:
          tasks = this.parseMarkdown(data)
          break
        case ImportFormat.TODOTXT:
          tasks = this.parseTodoTxt(data)
          break
        default:
          throw new Error(`Unsupported import format: ${format}`)
      }

      // 验证和导入任务
      for (const taskData of tasks) {
        try {
          const task = await this.validateAndCreateTask(taskData)
          result.items.push(task)
          result.imported++
        } catch (error) {
          result.failed++
          result.errors.push(`Task "${taskData.title || 'Unknown'}": ${error.message}`)
        }
      }

      result.success = result.imported > 0

      // 发送事件通知
      if (this.coreAPI?.events) {
        this.coreAPI.events.emit('import:tasks-completed', { result })
      }

    } catch (error) {
      result.errors.push(`Import failed: ${error.message}`)
    }

    return result
  }

  async importProjects(data: string, format: ImportFormat): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      errors: [],
      items: []
    }

    try {
      let projects: any[] = []

      switch (format) {
        case ImportFormat.JSON:
          projects = JSON.parse(data)
          break
        case ImportFormat.CSV:
          projects = this.parseProjectsCSV(data)
          break
        default:
          throw new Error(`Unsupported import format for projects: ${format}`)
      }

      // 验证和导入项目
      for (const projectData of projects) {
        try {
          const project = await this.validateAndCreateProject(projectData)
          result.items.push(project)
          result.imported++
        } catch (error) {
          result.failed++
          result.errors.push(`Project "${projectData.name || 'Unknown'}": ${error.message}`)
        }
      }

      result.success = result.imported > 0

      // 发送事件通知
      if (this.coreAPI?.events) {
        this.coreAPI.events.emit('import:projects-completed', { result })
      }

    } catch (error) {
      result.errors.push(`Import failed: ${error.message}`)
    }

    return result
  }

  async importFromFile(filePath: string): Promise<ImportResult> {
    // 根据文件扩展名确定格式
    const extension = filePath.split('.').pop()?.toLowerCase()
    let format: ImportFormat

    switch (extension) {
      case 'json':
        format = ImportFormat.JSON
        break
      case 'csv':
        format = ImportFormat.CSV
        break
      case 'md':
      case 'markdown':
        format = ImportFormat.MARKDOWN
        break
      case 'txt':
        format = ImportFormat.TODOTXT
        break
      default:
        throw new Error(`Unsupported file format: ${extension}`)
    }

    // 读取文件内容
    const data = await this.readFile(filePath)
    
    // 根据内容判断是任务还是项目
    if (this.looksLikeProjectData(data)) {
      return this.importProjects(data, format)
    } else {
      return this.importTasks(data, format)
    }
  }

  async exportTasks(taskIds?: string[], format: ExportFormat = ExportFormat.JSON): Promise<ExportResult> {
    const result: ExportResult = {
      success: false,
      data: '',
      format,
      count: 0
    }

    try {
      // 获取任务数据
      let tasks: Task[] = []
      if (this.coreAPI?.database) {
        let query = 'SELECT * FROM tasks'
        const params: any[] = []

        if (taskIds && taskIds.length > 0) {
          query += ` WHERE id IN (${taskIds.map(() => '?').join(', ')})`
          params.push(...taskIds)
        }

        query += ' ORDER BY created_at DESC'

        const results = await this.coreAPI.database.query(query, params)
        tasks = results.map((row: any) => this.mapRowToTask(row))
      }

      // 根据格式导出
      switch (format) {
        case ExportFormat.JSON:
          result.data = JSON.stringify(tasks, null, 2)
          break
        case ExportFormat.CSV:
          result.data = this.tasksToCSV(tasks)
          break
        case ExportFormat.MARKDOWN:
          result.data = this.tasksToMarkdown(tasks)
          break
        case ExportFormat.TODOTXT:
          result.data = this.tasksToTodoTxt(tasks)
          break
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }

      result.count = tasks.length
      result.success = true

      // 发送事件通知
      if (this.coreAPI?.events) {
        this.coreAPI.events.emit('export:tasks-completed', { result })
      }

    } catch (error) {
      result.data = `Export failed: ${error.message}`
    }

    return result
  }

  async exportProjects(projectIds?: string[], format: ExportFormat = ExportFormat.JSON): Promise<ExportResult> {
    const result: ExportResult = {
      success: false,
      data: '',
      format,
      count: 0
    }

    try {
      // 获取项目数据
      let projects: Project[] = []
      if (this.coreAPI?.database) {
        let query = 'SELECT * FROM projects'
        const params: any[] = []

        if (projectIds && projectIds.length > 0) {
          query += ` WHERE id IN (${projectIds.map(() => '?').join(', ')})`
          params.push(...projectIds)
        }

        query += ' ORDER BY created_at DESC'

        const results = await this.coreAPI.database.query(query, params)
        projects = results.map((row: any) => this.mapRowToProject(row))
      }

      // 根据格式导出
      switch (format) {
        case ExportFormat.JSON:
          result.data = JSON.stringify(projects, null, 2)
          break
        case ExportFormat.CSV:
          result.data = this.projectsToCSV(projects)
          break
        default:
          throw new Error(`Unsupported export format for projects: ${format}`)
      }

      result.count = projects.length
      result.success = true

      // 发送事件通知
      if (this.coreAPI?.events) {
        this.coreAPI.events.emit('export:projects-completed', { result })
      }

    } catch (error) {
      result.data = `Export failed: ${error.message}`
    }

    return result
  }

  async exportToFile(filePath: string, format: ExportFormat): Promise<void> {
    // 导出所有任务和项目
    const tasksResult = await this.exportTasks(undefined, format)
    const projectsResult = await this.exportProjects(undefined, format)

    // 合并数据
    let combinedData = ''
    if (format === ExportFormat.JSON) {
      combinedData = JSON.stringify({
        tasks: JSON.parse(tasksResult.data),
        projects: JSON.parse(projectsResult.data),
        exportedAt: new Date().toISOString()
      }, null, 2)
    } else {
      combinedData = `# Projects\n${projectsResult.data}\n\n# Tasks\n${tasksResult.data}`
    }

    // 写入文件
    await this.writeFile(filePath, combinedData)
  }

  getSupportedImportFormats(): ImportFormat[] {
    return [
      ImportFormat.JSON,
      ImportFormat.CSV,
      ImportFormat.MARKDOWN,
      ImportFormat.TODOTXT
    ]
  }

  getSupportedExportFormats(): ExportFormat[] {
    return [
      ExportFormat.JSON,
      ExportFormat.CSV,
      ExportFormat.MARKDOWN,
      ExportFormat.TODOTXT
    ]
  }

  private parseCSV(data: string): any[] {
    const lines = data.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim())
    const tasks = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const task: any = {}
      
      headers.forEach((header, index) => {
        task[header] = values[index] || ''
      })
      
      tasks.push(task)
    }

    return tasks
  }

  private parseMarkdown(data: string): any[] {
    const tasks = []
    const lines = data.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
        const isCompleted = trimmed.startsWith('- [x]')
        const title = trimmed.substring(5).trim()
        
        tasks.push({
          title,
          status: isCompleted ? 'done' : 'todo',
          description: ''
        })
      }
    }

    return tasks
  }

  private parseTodoTxt(data: string): any[] {
    const tasks = []
    const lines = data.split('\n').filter(line => line.trim())

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('x ')) {
        // 已完成任务
        tasks.push({
          title: trimmed.substring(2).trim(),
          status: 'done'
        })
      } else if (trimmed.match(/^\([A-Z]\)/)) {
        // 有优先级的任务
        const priority = trimmed.charAt(1)
        const title = trimmed.substring(3).trim()
        tasks.push({
          title,
          priority: priority === 'A' ? 'high' : priority === 'B' ? 'medium' : 'low',
          status: 'todo'
        })
      } else if (trimmed) {
        // 普通任务
        tasks.push({
          title: trimmed,
          status: 'todo'
        })
      }
    }

    return tasks
  }

  private parseProjectsCSV(data: string): any[] {
    // 类似parseCSV，但针对项目数据
    return this.parseCSV(data)
  }

  private async validateAndCreateTask(taskData: any): Promise<Task> {
    // 验证必需字段
    if (!taskData.title) {
      throw new Error('Task title is required')
    }

    // 创建任务（这里应该调用TasksService）
    const task: Task = {
      id: this.generateId(),
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      completedAt: taskData.completedAt ? new Date(taskData.completedAt) : null,
      estimatedTime: taskData.estimatedTime || null,
      actualTime: taskData.actualTime || null,
      projectId: taskData.projectId || null,
      parentTaskId: taskData.parentTaskId || null,
      linkedNotes: taskData.linkedNotes || [],
      linkedFiles: taskData.linkedFiles || [],
      tags: taskData.tags || [],
      contexts: taskData.contexts || [],
      recurrence: taskData.recurrence || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 保存到数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `INSERT INTO tasks (
          id, title, description, status, priority, due_date, completed_at,
          estimated_time, actual_time, project_id, parent_task_id,
          linked_notes, linked_files, tags, contexts, recurrence,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id, task.title, task.description, task.status, task.priority,
          task.dueDate?.toISOString(), task.completedAt?.toISOString(),
          task.estimatedTime, task.actualTime, task.projectId, task.parentTaskId,
          JSON.stringify(task.linkedNotes), JSON.stringify(task.linkedFiles),
          JSON.stringify(task.tags), JSON.stringify(task.contexts),
          JSON.stringify(task.recurrence),
          task.createdAt.toISOString(), task.updatedAt.toISOString()
        ]
      )
    }

    return task
  }

  private async validateAndCreateProject(projectData: any): Promise<Project> {
    // 验证必需字段
    if (!projectData.name) {
      throw new Error('Project name is required')
    }

    // 创建项目（这里应该调用ProjectsService）
    const project: Project = {
      id: this.generateId(),
      name: projectData.name,
      description: projectData.description || '',
      status: projectData.status || 'active',
      color: projectData.color || null,
      startDate: projectData.startDate ? new Date(projectData.startDate) : null,
      dueDate: projectData.dueDate ? new Date(projectData.dueDate) : null,
      completedAt: projectData.completedAt ? new Date(projectData.completedAt) : null,
      tasks: [],
      linkedNotes: projectData.linkedNotes || [],
      linkedFiles: projectData.linkedFiles || [],
      progress: projectData.progress || 0,
      totalTasks: projectData.totalTasks || 0,
      completedTasks: projectData.completedTasks || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 保存到数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `INSERT INTO projects (
          id, name, description, status, color, start_date, due_date, completed_at,
          linked_notes, linked_files, progress, total_tasks, completed_tasks,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          project.id, project.name, project.description, project.status, project.color,
          project.startDate?.toISOString(), project.dueDate?.toISOString(),
          project.completedAt?.toISOString(),
          JSON.stringify(project.linkedNotes), JSON.stringify(project.linkedFiles),
          project.progress, project.totalTasks, project.completedTasks,
          project.createdAt.toISOString(), project.updatedAt.toISOString()
        ]
      )
    }

    return project
  }

  private looksLikeProjectData(data: string): boolean {
    // 简单的启发式判断
    return data.includes('project') || data.includes('Project') || 
           data.includes('"name"') && data.includes('"tasks"')
  }

  private async readFile(filePath: string): Promise<string> {
    // 这里应该使用Tauri的文件API
    if (this.coreAPI?.fs) {
      return await this.coreAPI.fs.readTextFile(filePath)
    }
    throw new Error('File system not available')
  }

  private async writeFile(filePath: string, data: string): Promise<void> {
    // 这里应该使用Tauri的文件API
    if (this.coreAPI?.fs) {
      await this.coreAPI.fs.writeTextFile(filePath, data)
    } else {
      throw new Error('File system not available')
    }
  }

  private tasksToCSV(tasks: Task[]): string {
    if (tasks.length === 0) return ''

    const headers = ['id', 'title', 'description', 'status', 'priority', 'dueDate', 'tags']
    const rows = [headers.join(',')]

    for (const task of tasks) {
      const row = [
        task.id,
        `"${task.title}"`,
        `"${task.description || ''}"`,
        task.status,
        task.priority,
        task.dueDate?.toISOString() || '',
        `"${task.tags.join(';')}"`
      ]
      rows.push(row.join(','))
    }

    return rows.join('\n')
  }

  private tasksToMarkdown(tasks: Task[]): string {
    const lines = ['# Tasks\n']

    for (const task of tasks) {
      const checkbox = task.status === 'done' ? '[x]' : '[ ]'
      lines.push(`- ${checkbox} ${task.title}`)
      if (task.description) {
        lines.push(`  ${task.description}`)
      }
      if (task.tags.length > 0) {
        lines.push(`  Tags: ${task.tags.join(', ')}`)
      }
      lines.push('')
    }

    return lines.join('\n')
  }

  private tasksToTodoTxt(tasks: Task[]): string {
    const lines = []

    for (const task of tasks) {
      let line = ''
      
      if (task.status === 'done') {
        line += 'x '
      }
      
      if (task.priority === 'high') {
        line += '(A) '
      } else if (task.priority === 'medium') {
        line += '(B) '
      } else if (task.priority === 'low') {
        line += '(C) '
      }
      
      line += task.title
      
      if (task.tags.length > 0) {
        line += ' ' + task.tags.map(tag => `+${tag}`).join(' ')
      }
      
      lines.push(line)
    }

    return lines.join('\n')
  }

  private projectsToCSV(projects: Project[]): string {
    if (projects.length === 0) return ''

    const headers = ['id', 'name', 'description', 'status', 'progress', 'startDate', 'dueDate']
    const rows = [headers.join(',')]

    for (const project of projects) {
      const row = [
        project.id,
        `"${project.name}"`,
        `"${project.description || ''}"`,
        project.status,
        project.progress.toString(),
        project.startDate?.toISOString() || '',
        project.dueDate?.toISOString() || ''
      ]
      rows.push(row.join(','))
    }

    return rows.join('\n')
  }

  private mapRowToTask(row: any): Task {
    // 简化的任务映射
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date ? new Date(row.due_date) : null,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      estimatedTime: row.estimated_time,
      actualTime: row.actual_time,
      projectId: row.project_id,
      parentTaskId: row.parent_task_id,
      linkedNotes: JSON.parse(row.linked_notes || '[]'),
      linkedFiles: JSON.parse(row.linked_files || '[]'),
      tags: JSON.parse(row.tags || '[]'),
      contexts: JSON.parse(row.contexts || '[]'),
      recurrence: row.recurrence ? JSON.parse(row.recurrence) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  private mapRowToProject(row: any): Project {
    // 简化的项目映射
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      color: row.color,
      startDate: row.start_date ? new Date(row.start_date) : null,
      dueDate: row.due_date ? new Date(row.due_date) : null,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      tasks: [],
      linkedNotes: JSON.parse(row.linked_notes || '[]'),
      linkedFiles: JSON.parse(row.linked_files || '[]'),
      progress: row.progress || 0,
      totalTasks: row.total_tasks || 0,
      completedTasks: row.completed_tasks || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  private generateId(): string {
    return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
