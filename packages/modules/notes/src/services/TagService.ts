/**
 * 标签服务
 * 
 * 功能：
 * - 标签的CRUD操作
 * - 层级标签管理
 * - 标签与笔记的关联管理
 * - 标签统计和分析
 * - 标签建议和推荐
 */

import { Database } from 'sqlite3'
import { 
  Tag, 
  NoteTag, 
  TagHierarchy, 
  TagStats, 
  TagSuggestion,
  TagDatabaseSchema 
} from '../database/TagDatabaseSchema'

export interface TagServiceConfig {
  /** 数据库连接 */
  database: Database
  /** 默认标签限制 */
  defaultLimit?: number
  /** 最大标签限制 */
  maxLimit?: number
  /** 是否启用标签建议 */
  enableSuggestions?: boolean
  /** 是否启用自动统计 */
  enableAutoStats?: boolean
}

export interface CreateTagOptions {
  /** 标签名称 */
  name: string
  /** 标签描述 */
  description?: string
  /** 父标签ID */
  parentId?: string
  /** 标签颜色 */
  color?: string
  /** 标签图标 */
  icon?: string
  /** 排序顺序 */
  sortOrder?: number
  /** 是否为系统标签 */
  isSystem?: boolean
  /** 创建者 */
  createdBy?: string
}

export interface UpdateTagOptions {
  /** 标签名称 */
  name?: string
  /** 标签描述 */
  description?: string
  /** 父标签ID */
  parentId?: string
  /** 标签颜色 */
  color?: string
  /** 标签图标 */
  icon?: string
  /** 排序顺序 */
  sortOrder?: number
  /** 是否启用 */
  isActive?: boolean
}

export interface TagSearchOptions {
  /** 搜索关键词 */
  query?: string
  /** 父标签ID过滤 */
  parentId?: string
  /** 是否只显示根标签 */
  rootOnly?: boolean
  /** 是否包含系统标签 */
  includeSystem?: boolean
  /** 排序方式 */
  sortBy?: 'name' | 'usage' | 'created' | 'updated'
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
  /** 限制数量 */
  limit?: number
  /** 偏移量 */
  offset?: number
}

export interface TagWithStats extends Tag {
  /** 使用统计 */
  stats?: TagStats
  /** 子标签数量 */
  childCount?: number
  /** 层级路径 */
  path?: string[]
}

export class TagService {
  private db: Database
  private config: Required<TagServiceConfig>

  constructor(config: TagServiceConfig) {
    this.db = config.database
    this.config = {
      defaultLimit: 50,
      maxLimit: 200,
      enableSuggestions: true,
      enableAutoStats: true,
      ...config
    }
  }

  /**
   * 创建标签
   */
  async createTag(options: CreateTagOptions): Promise<Tag> {
    const tagId = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO tags (
          id, name, description, parent_id, color, icon, 
          sort_order, is_system, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      this.db.run(
        sql,
        [
          tagId,
          options.name,
          options.description || null,
          options.parentId || null,
          options.color || '#6B7280',
          options.icon || null,
          options.sortOrder || 0,
          options.isSystem || false,
          options.createdBy || null
        ],
        function(err) {
          if (err) {
            reject(err)
            return
          }
          
          // 返回创建的标签
          resolve({
            id: tagId,
            name: options.name,
            description: options.description,
            parent_id: options.parentId,
            color: options.color || '#6B7280',
            icon: options.icon,
            sort_order: options.sortOrder || 0,
            usage_count: 0,
            is_system: options.isSystem || false,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: options.createdBy
          })
        }
      )
    })
  }

  /**
   * 获取标签
   */
  async getTag(tagId: string): Promise<Tag | null> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM tags WHERE id = ? AND is_active = TRUE'
      
      this.db.get(sql, [tagId], (err, row: any) => {
        if (err) {
          reject(err)
          return
        }
        resolve(row || null)
      })
    })
  }

  /**
   * 更新标签
   */
  async updateTag(tagId: string, options: UpdateTagOptions): Promise<Tag | null> {
    const updates: string[] = []
    const values: any[] = []

    if (options.name !== undefined) {
      updates.push('name = ?')
      values.push(options.name)
    }
    if (options.description !== undefined) {
      updates.push('description = ?')
      values.push(options.description)
    }
    if (options.parentId !== undefined) {
      updates.push('parent_id = ?')
      values.push(options.parentId)
    }
    if (options.color !== undefined) {
      updates.push('color = ?')
      values.push(options.color)
    }
    if (options.icon !== undefined) {
      updates.push('icon = ?')
      values.push(options.icon)
    }
    if (options.sortOrder !== undefined) {
      updates.push('sort_order = ?')
      values.push(options.sortOrder)
    }
    if (options.isActive !== undefined) {
      updates.push('is_active = ?')
      values.push(options.isActive)
    }

    if (updates.length === 0) {
      return this.getTag(tagId)
    }

    values.push(tagId)

    return new Promise((resolve, reject) => {
      const sql = `UPDATE tags SET ${updates.join(', ')} WHERE id = ?`
      
      this.db.run(sql, values, (err) => {
        if (err) {
          reject(err)
          return
        }
        
        this.getTag(tagId).then(resolve).catch(reject)
      })
    })
  }

  /**
   * 删除标签
   */
  async deleteTag(tagId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // 软删除：设置为不活跃状态
      const sql = 'UPDATE tags SET is_active = FALSE WHERE id = ?'
      
      this.db.run(sql, [tagId], function(err) {
        if (err) {
          reject(err)
          return
        }
        resolve(this.changes > 0)
      })
    })
  }

  /**
   * 搜索标签
   */
  async searchTags(options: TagSearchOptions = {}): Promise<TagWithStats[]> {
    const limit = Math.min(options.limit || this.config.defaultLimit, this.config.maxLimit)
    const offset = options.offset || 0
    
    let sql = `
      SELECT t.*, ts.usage_count as stats_usage_count, ts.note_count, ts.last_used_at
      FROM tags t
      LEFT JOIN tag_stats ts ON t.id = ts.tag_id
      WHERE t.is_active = TRUE
    `
    const params: any[] = []

    // 添加搜索条件
    if (options.query) {
      sql += ' AND t.name LIKE ?'
      params.push(`%${options.query}%`)
    }

    if (options.parentId) {
      sql += ' AND t.parent_id = ?'
      params.push(options.parentId)
    } else if (options.rootOnly) {
      sql += ' AND t.parent_id IS NULL'
    }

    if (!options.includeSystem) {
      sql += ' AND t.is_system = FALSE'
    }

    // 添加排序
    const sortBy = options.sortBy || 'name'
    const sortOrder = options.sortOrder || 'asc'
    
    switch (sortBy) {
      case 'usage':
        sql += ` ORDER BY ts.usage_count ${sortOrder.toUpperCase()}, t.name ASC`
        break
      case 'created':
        sql += ` ORDER BY t.created_at ${sortOrder.toUpperCase()}`
        break
      case 'updated':
        sql += ` ORDER BY t.updated_at ${sortOrder.toUpperCase()}`
        break
      default:
        sql += ` ORDER BY t.name ${sortOrder.toUpperCase()}`
    }

    sql += ' LIMIT ? OFFSET ?'
    params.push(limit, offset)

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows: any[]) => {
        if (err) {
          reject(err)
          return
        }

        const tags: TagWithStats[] = rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          parent_id: row.parent_id,
          color: row.color,
          icon: row.icon,
          sort_order: row.sort_order,
          usage_count: row.usage_count,
          is_system: row.is_system,
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
          created_by: row.created_by,
          stats: {
            tag_id: row.id,
            usage_count: row.stats_usage_count || 0,
            note_count: row.note_count || 0,
            child_count: 0,
            last_used_at: row.last_used_at,
            updated_at: row.updated_at
          }
        }))

        resolve(tags)
      })
    })
  }

  /**
   * 获取标签层级结构
   */
  async getTagHierarchy(rootTagId?: string): Promise<TagWithStats[]> {
    const queries = TagDatabaseSchema.getTagQueries()
    const sql = rootTagId ? queries.getTagDescendants : queries.getRootTags
    const params = rootTagId ? [rootTagId] : []

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows: any[]) => {
        if (err) {
          reject(err)
          return
        }

        const tags: TagWithStats[] = rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          parent_id: row.parent_id,
          color: row.color,
          icon: row.icon,
          sort_order: row.sort_order,
          usage_count: row.usage_count,
          is_system: row.is_system,
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
          created_by: row.created_by
        }))

        resolve(tags)
      })
    })
  }

  /**
   * 获取笔记的标签
   */
  async getNoteTags(noteId: string): Promise<TagWithStats[]> {
    const queries = TagDatabaseSchema.getTagQueries()
    
    return new Promise((resolve, reject) => {
      this.db.all(queries.getNoteTagsWithHierarchy, [noteId], (err, rows: any[]) => {
        if (err) {
          reject(err)
          return
        }

        const tags: TagWithStats[] = rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          parent_id: row.parent_id,
          color: row.color,
          icon: row.icon,
          sort_order: row.sort_order,
          usage_count: row.usage_count,
          is_system: row.is_system,
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
          created_by: row.created_by,
          path: row.path ? row.path.split('/') : []
        }))

        resolve(tags)
      })
    })
  }

  /**
   * 为笔记添加标签
   */
  async addTagsToNote(noteId: string, tagIds: string[], createdBy?: string): Promise<void> {
    const queries = TagDatabaseSchema.getTagManagementQueries()
    
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION')
        
        let completed = 0
        let hasError = false

        for (const tagId of tagIds) {
          const noteTagId = `note_tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          this.db.run(
            queries.addTagsToNote,
            [noteTagId, noteId, tagId, createdBy || null],
            (err) => {
              if (err && !hasError) {
                hasError = true
                this.db.run('ROLLBACK')
                reject(err)
                return
              }
              
              completed++
              if (completed === tagIds.length && !hasError) {
                this.db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    reject(commitErr)
                  } else {
                    resolve()
                  }
                })
              }
            }
          )
        }
      })
    })
  }

  /**
   * 从笔记移除标签
   */
  async removeTagsFromNote(noteId: string, tagIds: string[]): Promise<void> {
    const queries = TagDatabaseSchema.getTagManagementQueries()
    
    return new Promise((resolve, reject) => {
      this.db.run(
        queries.removeTagsFromNote,
        [noteId, JSON.stringify(tagIds)],
        (err) => {
          if (err) {
            reject(err)
            return
          }
          resolve()
        }
      )
    })
  }

  /**
   * 获取热门标签
   */
  async getPopularTags(limit: number = 20): Promise<TagWithStats[]> {
    const queries = TagDatabaseSchema.getTagQueries()
    
    return new Promise((resolve, reject) => {
      this.db.all(queries.getPopularTags, [limit], (err, rows: any[]) => {
        if (err) {
          reject(err)
          return
        }

        const tags: TagWithStats[] = rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          parent_id: row.parent_id,
          color: row.color,
          icon: row.icon,
          sort_order: row.sort_order,
          usage_count: row.usage_count,
          is_system: row.is_system,
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
          created_by: row.created_by,
          stats: {
            tag_id: row.id,
            usage_count: row.usage_count || 0,
            note_count: row.note_count || 0,
            child_count: 0,
            updated_at: row.updated_at
          }
        }))

        resolve(tags)
      })
    })
  }

  /**
   * 获取标签建议
   */
  async getTagSuggestions(noteId: string, limit: number = 10): Promise<TagSuggestion[]> {
    if (!this.config.enableSuggestions) {
      return []
    }

    const queries = TagDatabaseSchema.getTagQueries()
    
    return new Promise((resolve, reject) => {
      this.db.all(queries.getTagSuggestions, [noteId, limit], (err, rows: any[]) => {
        if (err) {
          reject(err)
          return
        }
        resolve(rows as TagSuggestion[])
      })
    })
  }

  /**
   * 重新计算标签统计
   */
  async recalculateTagStats(tagId?: string): Promise<void> {
    const queries = TagDatabaseSchema.getTagManagementQueries()
    
    return new Promise((resolve, reject) => {
      if (tagId) {
        // 重新计算特定标签的统计
        this.db.run(queries.recalculateTagStats, [tagId], (err) => {
          if (err) {
            reject(err)
            return
          }
          resolve()
        })
      } else {
        // 重新计算所有标签的统计
        this.db.run(
          queries.recalculateTagStats.replace('WHERE tag_id = ?', ''),
          [],
          (err) => {
            if (err) {
              reject(err)
              return
            }
            resolve()
          }
        )
      }
    })
  }
}

  /**
   * 合并标签
   */
  async mergeTags(sourceTagId: string, targetTagId: string): Promise<void> {
    const queries = TagDatabaseSchema.getTagManagementQueries()

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION')

        // 合并标签关联
        this.db.run(
          queries.mergeTags,
          [targetTagId, sourceTagId, targetTagId],
          (err) => {
            if (err) {
              this.db.run('ROLLBACK')
              reject(err)
              return
            }

            // 删除源标签
            this.db.run(
              'UPDATE tags SET is_active = FALSE WHERE id = ?',
              [sourceTagId],
              (deleteErr) => {
                if (deleteErr) {
                  this.db.run('ROLLBACK')
                  reject(deleteErr)
                  return
                }

                // 重新计算目标标签统计
                this.db.run(
                  queries.recalculateTagStats,
                  [targetTagId],
                  (statsErr) => {
                    if (statsErr) {
                      this.db.run('ROLLBACK')
                      reject(statsErr)
                      return
                    }

                    this.db.run('COMMIT', (commitErr) => {
                      if (commitErr) {
                        reject(commitErr)
                      } else {
                        resolve()
                      }
                    })
                  }
                )
              }
            )
          }
        )
      })
    })
  }

  /**
   * 获取相似标签
   */
  async getSimilarTags(tagName: string, limit: number = 10): Promise<TagWithStats[]> {
    const queries = TagDatabaseSchema.getTagQueries()

    return new Promise((resolve, reject) => {
      this.db.all(
        queries.getSimilarTags,
        [tagName, tagName, tagName, limit],
        (err, rows: any[]) => {
          if (err) {
            reject(err)
            return
          }

          const tags: TagWithStats[] = rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            parent_id: row.parent_id,
            color: row.color,
            icon: row.icon,
            sort_order: row.sort_order,
            usage_count: row.usage_count,
            is_system: row.is_system,
            is_active: row.is_active,
            created_at: row.created_at,
            updated_at: row.updated_at,
            created_by: row.created_by,
            stats: {
              tag_id: row.id,
              usage_count: row.usage_count || 0,
              note_count: 0,
              child_count: 0,
              updated_at: row.updated_at
            }
          }))

          resolve(tags)
        }
      )
    })
  }
}

export default TagService
