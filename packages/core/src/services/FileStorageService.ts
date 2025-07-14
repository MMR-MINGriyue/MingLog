/**
 * 文件存储服务
 * 提供文件存储、检索、删除等核心功能，集成文件元数据管理和搜索索引
 */

import { EventBus } from '../event-system/EventBus'
import { SearchEngine } from '../search/SearchEngine'
import type { SearchDocument } from '../search/SearchEngine'
import { cn } from '../utils'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'

// 文件实体接口
export interface FileEntity {
  /** 文件唯一标识符 */
  id: string
  /** 文件名 */
  name: string
  /** 原始文件名 */
  original_name: string
  /** 文件类型 */
  type: string
  /** 文件大小（字节） */
  size: number
  /** 存储路径 */
  path: string
  /** 文件校验和 */
  checksum: string
  /** 缩略图路径 */
  thumbnail_path?: string
  /** 文件元数据 */
  metadata: FileMetadata
  /** 关联信息 */
  associations: FileAssociation[]
  /** 创建时间 */
  created_at: Date
  /** 更新时间 */
  updated_at: Date
  /** 创建者ID */
  created_by?: string
  /** 更新者ID */
  updated_by?: string
}

// 文件元数据接口
export interface FileMetadata {
  /** 文件描述 */
  description?: string
  /** 文件标签 */
  tags: string[]
  /** 文件分类 */
  category?: string
  /** 自定义属性 */
  custom_fields: Record<string, any>
  /** 访问权限 */
  permissions: {
    is_public: boolean
    allow_download: boolean
    allow_preview: boolean
    shared_users: string[]
    editors: string[]
    viewers: string[]
  }
  /** 图片特定元数据 */
  image?: {
    width: number
    height: number
    format: string
    color_space?: string
    has_alpha?: boolean
  }
  /** 视频特定元数据 */
  video?: {
    duration: number
    width: number
    height: number
    format: string
    codec?: string
    bitrate?: number
  }
  /** 音频特定元数据 */
  audio?: {
    duration: number
    format: string
    codec?: string
    bitrate?: number
    sample_rate?: number
  }
  /** 文档特定元数据 */
  document?: {
    page_count?: number
    word_count?: number
    language?: string
    author?: string
    title?: string
  }
}

// 文件关联接口
export interface FileAssociation {
  /** 关联类型 */
  type: 'document' | 'block' | 'task' | 'project' | 'note'
  /** 关联目标ID */
  target_id: string
  /** 关联关系 */
  relationship: 'attachment' | 'embed' | 'reference' | 'thumbnail' | 'cover'
  /** 关联元数据 */
  metadata?: Record<string, any>
}

// 文件存储配置接口
export interface FileStorageConfig {
  /** 存储根目录 */
  storage_root: string
  /** 缩略图目录 */
  thumbnail_dir: string
  /** 最大文件大小（字节） */
  max_file_size: number
  /** 允许的文件类型 */
  allowed_types: string[]
  /** 是否启用缩略图生成 */
  enable_thumbnails: boolean
  /** 缩略图配置 */
  thumbnail_config: {
    max_width: number
    max_height: number
    quality: number
    formats: string[]
  }
  /** 是否启用文件索引 */
  enable_indexing: boolean
  /** 存储策略 */
  storage_strategy: 'flat' | 'date-based' | 'hash-based' | 'category-based'
}

// 文件查询选项接口
export interface FileQueryOptions {
  /** 搜索关键词 */
  search?: string
  /** 文件类型过滤 */
  type_filter?: string[]
  /** 标签过滤 */
  tag_filter?: string[]
  /** 分类过滤 */
  category_filter?: string[]
  /** 大小范围过滤 */
  size_range?: {
    min?: number
    max?: number
  }
  /** 日期范围过滤 */
  date_range?: {
    start?: Date
    end?: Date
  }
  /** 关联过滤 */
  association_filter?: {
    type?: string
    target_id?: string
    relationship?: string
  }
  /** 排序字段 */
  sort_by?: 'name' | 'size' | 'created_at' | 'updated_at' | 'type'
  /** 排序方向 */
  sort_order?: 'asc' | 'desc'
  /** 分页偏移 */
  offset?: number
  /** 分页限制 */
  limit?: number
}

// 文件查询结果接口
export interface FileQueryResult {
  /** 文件列表 */
  files: FileEntity[]
  /** 总数量 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页大小 */
  page_size: number
  /** 总页数 */
  total_pages: number
  /** 是否有下一页 */
  has_next: boolean
  /** 是否有上一页 */
  has_prev: boolean
}

// 文件操作结果接口
export interface FileOperationResult {
  /** 操作是否成功 */
  success: boolean
  /** 文件实体 */
  file?: FileEntity
  /** 错误信息 */
  error?: string
  /** 操作耗时（毫秒） */
  duration?: number
}

// 默认配置
const DEFAULT_CONFIG: FileStorageConfig = {
  storage_root: './data/files',
  thumbnail_dir: './data/thumbnails',
  max_file_size: 100 * 1024 * 1024, // 100MB
  allowed_types: [
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'text/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  enable_thumbnails: true,
  thumbnail_config: {
    max_width: 300,
    max_height: 300,
    quality: 80,
    formats: ['jpg', 'png', 'webp']
  },
  enable_indexing: true,
  storage_strategy: 'date-based'
}

/**
 * 文件存储服务类
 */
export class FileStorageService {
  private config: FileStorageConfig
  private eventBus: EventBus
  private searchEngine: SearchEngine
  private files: Map<string, FileEntity> = new Map()

  constructor(
    config: Partial<FileStorageConfig> = {},
    eventBus: EventBus,
    searchEngine: SearchEngine
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.eventBus = eventBus
    this.searchEngine = searchEngine
    
    // 注册事件监听器
    this.registerEventListeners()
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    try {
      // 创建存储目录
      await this.ensureDirectories()
      
      // 加载现有文件索引
      await this.loadFileIndex()
      
      // 触发初始化完成事件
      this.eventBus.emit('file-storage:initialized', {
        service: 'FileStorageService',
        config: this.config
      })
      
      console.log('文件存储服务初始化完成')
    } catch (error) {
      console.error('文件存储服务初始化失败:', error)
      throw error
    }
  }

  /**
   * 存储文件
   */
  public async storeFile(
    file: File,
    metadata: Partial<FileMetadata> = {},
    associations: FileAssociation[] = []
  ): Promise<FileOperationResult> {
    const startTime = performance.now()
    
    try {
      // 验证文件
      const validation = await this.validateFile(file)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          duration: performance.now() - startTime
        }
      }

      // 生成文件ID和路径
      const fileId = this.generateFileId()
      const storagePath = await this.generateStoragePath(file, fileId)
      
      // 计算文件校验和
      const checksum = await this.calculateChecksum(file)
      
      // 检查重复文件
      const existingFile = await this.findFileByChecksum(checksum)
      if (existingFile) {
        // 文件已存在，创建新的引用
        const duplicateFile = await this.createFileReference(existingFile, metadata, associations)
        return {
          success: true,
          file: duplicateFile,
          duration: performance.now() - startTime
        }
      }

      // 保存文件到磁盘
      await this.saveFileToDisk(file, storagePath)
      
      // 生成缩略图（如果需要）
      let thumbnailPath: string | undefined
      if (this.config.enable_thumbnails && this.shouldGenerateThumbnail(file.type)) {
        thumbnailPath = await this.generateThumbnail(storagePath, fileId)
      }

      // 创建文件实体
      const fileEntity: FileEntity = {
        id: fileId,
        name: this.sanitizeFileName(file.name),
        original_name: file.name,
        type: file.type,
        size: file.size,
        path: storagePath,
        checksum,
        thumbnail_path: thumbnailPath,
        metadata: this.buildFileMetadata(file, metadata),
        associations,
        created_at: new Date(),
        updated_at: new Date()
      }

      // 保存到内存索引
      this.files.set(fileId, fileEntity)
      
      // 添加到搜索索引
      if (this.config.enable_indexing) {
        await this.addToSearchIndex(fileEntity)
      }

      // 触发文件存储事件
      this.eventBus.emit('file-storage:file-stored', {
        file: fileEntity,
        operation: 'store'
      })

      return {
        success: true,
        file: fileEntity,
        duration: performance.now() - startTime
      }
    } catch (error) {
      console.error('文件存储失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: performance.now() - startTime
      }
    }
  }

  /**
   * 获取文件
   */
  public async getFile(fileId: string): Promise<FileEntity | null> {
    return this.files.get(fileId) || null
  }

  /**
   * 查询文件
   */
  public async queryFiles(options: FileQueryOptions = {}): Promise<FileQueryResult> {
    const {
      search,
      type_filter,
      tag_filter,
      category_filter,
      size_range,
      date_range,
      association_filter,
      sort_by = 'created_at',
      sort_order = 'desc',
      offset = 0,
      limit = 20
    } = options

    let filteredFiles = Array.from(this.files.values())

    // 应用搜索过滤
    if (search) {
      const searchResults = await this.searchEngine.search(search, {
        filters: { type: 'file' },
        limit: 1000 // 获取所有匹配的文件
      })
      const searchFileIds = new Set(searchResults.map(r => r.document.id))
      filteredFiles = filteredFiles.filter(file => searchFileIds.has(file.id))
    }

    // 应用类型过滤
    if (type_filter && type_filter.length > 0) {
      filteredFiles = filteredFiles.filter(file =>
        type_filter.some(type => this.matchesFileType(file.type, type))
      )
    }

    // 应用标签过滤
    if (tag_filter && tag_filter.length > 0) {
      filteredFiles = filteredFiles.filter(file =>
        tag_filter.some(tag => file.metadata.tags.includes(tag))
      )
    }

    // 应用分类过滤
    if (category_filter && category_filter.length > 0) {
      filteredFiles = filteredFiles.filter(file =>
        file.metadata.category && category_filter.includes(file.metadata.category)
      )
    }

    // 应用大小范围过滤
    if (size_range) {
      filteredFiles = filteredFiles.filter(file => {
        if (size_range.min && file.size < size_range.min) return false
        if (size_range.max && file.size > size_range.max) return false
        return true
      })
    }

    // 应用日期范围过滤
    if (date_range) {
      filteredFiles = filteredFiles.filter(file => {
        if (date_range.start && file.created_at < date_range.start) return false
        if (date_range.end && file.created_at > date_range.end) return false
        return true
      })
    }

    // 应用关联过滤
    if (association_filter) {
      filteredFiles = filteredFiles.filter(file =>
        file.associations.some(assoc => {
          if (association_filter.type && assoc.type !== association_filter.type) return false
          if (association_filter.target_id && assoc.target_id !== association_filter.target_id) return false
          if (association_filter.relationship && assoc.relationship !== association_filter.relationship) return false
          return true
        })
      )
    }

    // 排序
    filteredFiles.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sort_by) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'size':
          aValue = a.size
          bValue = b.size
          break
        case 'created_at':
          aValue = a.created_at.getTime()
          bValue = b.created_at.getTime()
          break
        case 'updated_at':
          aValue = a.updated_at.getTime()
          bValue = b.updated_at.getTime()
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        default:
          aValue = a.created_at.getTime()
          bValue = b.created_at.getTime()
      }

      if (sort_order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    // 分页
    const total = filteredFiles.length
    const paginatedFiles = filteredFiles.slice(offset, offset + limit)
    const page = Math.floor(offset / limit) + 1
    const totalPages = Math.ceil(total / limit)

    return {
      files: paginatedFiles,
      total,
      page,
      page_size: limit,
      total_pages: totalPages,
      has_next: offset + limit < total,
      has_prev: offset > 0
    }
  }

  /**
   * 更新文件元数据
   */
  public async updateFileMetadata(
    fileId: string,
    metadata: Partial<FileMetadata>
  ): Promise<FileOperationResult> {
    const startTime = performance.now()

    try {
      const file = this.files.get(fileId)
      if (!file) {
        return {
          success: false,
          error: '文件不存在',
          duration: performance.now() - startTime
        }
      }

      // 更新元数据
      const updatedFile: FileEntity = {
        ...file,
        metadata: { ...file.metadata, ...metadata },
        updated_at: new Date()
      }

      // 保存到内存索引
      this.files.set(fileId, updatedFile)

      // 更新搜索索引
      if (this.config.enable_indexing) {
        await this.updateSearchIndex(updatedFile)
      }

      // 触发文件更新事件
      this.eventBus.emit('file-storage:file-updated', {
        file: updatedFile,
        operation: 'update-metadata'
      })

      return {
        success: true,
        file: updatedFile,
        duration: performance.now() - startTime
      }
    } catch (error) {
      console.error('文件元数据更新失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: performance.now() - startTime
      }
    }
  }

  /**
   * 删除文件
   */
  public async deleteFile(fileId: string, permanent: boolean = false): Promise<FileOperationResult> {
    const startTime = performance.now()

    try {
      const file = this.files.get(fileId)
      if (!file) {
        return {
          success: false,
          error: '文件不存在',
          duration: performance.now() - startTime
        }
      }

      if (permanent) {
        // 永久删除文件
        await this.deleteFileFromDisk(file.path)

        // 删除缩略图
        if (file.thumbnail_path) {
          await this.deleteFileFromDisk(file.thumbnail_path)
        }

        // 从内存索引中移除
        this.files.delete(fileId)

        // 从搜索索引中移除
        if (this.config.enable_indexing) {
          this.searchEngine.removeDocument(fileId)
        }
      } else {
        // 软删除（标记为已删除）
        const deletedFile: FileEntity = {
          ...file,
          metadata: {
            ...file.metadata,
            custom_fields: {
              ...file.metadata.custom_fields,
              deleted: true,
              deleted_at: new Date().toISOString()
            }
          },
          updated_at: new Date()
        }

        this.files.set(fileId, deletedFile)
      }

      // 触发文件删除事件
      this.eventBus.emit('file-storage:file-deleted', {
        file,
        operation: permanent ? 'permanent-delete' : 'soft-delete'
      })

      return {
        success: true,
        file,
        duration: performance.now() - startTime
      }
    } catch (error) {
      console.error('文件删除失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: performance.now() - startTime
      }
    }
  }

  /**
   * 添加文件关联
   */
  public async addFileAssociation(
    fileId: string,
    association: FileAssociation
  ): Promise<FileOperationResult> {
    const startTime = performance.now()

    try {
      const file = this.files.get(fileId)
      if (!file) {
        return {
          success: false,
          error: '文件不存在',
          duration: performance.now() - startTime
        }
      }

      // 检查关联是否已存在
      const existingAssociation = file.associations.find(assoc =>
        assoc.type === association.type &&
        assoc.target_id === association.target_id &&
        assoc.relationship === association.relationship
      )

      if (existingAssociation) {
        return {
          success: false,
          error: '关联已存在',
          duration: performance.now() - startTime
        }
      }

      // 添加关联
      const updatedFile: FileEntity = {
        ...file,
        associations: [...file.associations, association],
        updated_at: new Date()
      }

      this.files.set(fileId, updatedFile)

      // 触发关联添加事件
      this.eventBus.emit('file-storage:association-added', {
        file: updatedFile,
        association,
        operation: 'add-association'
      })

      return {
        success: true,
        file: updatedFile,
        duration: performance.now() - startTime
      }
    } catch (error) {
      console.error('文件关联添加失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: performance.now() - startTime
      }
    }
  }

  /**
   * 移除文件关联
   */
  public async removeFileAssociation(
    fileId: string,
    associationType: string,
    targetId: string,
    relationship: string
  ): Promise<FileOperationResult> {
    const startTime = performance.now()

    try {
      const file = this.files.get(fileId)
      if (!file) {
        return {
          success: false,
          error: '文件不存在',
          duration: performance.now() - startTime
        }
      }

      // 移除关联
      const updatedAssociations = file.associations.filter(assoc =>
        !(assoc.type === associationType &&
          assoc.target_id === targetId &&
          assoc.relationship === relationship)
      )

      const updatedFile: FileEntity = {
        ...file,
        associations: updatedAssociations,
        updated_at: new Date()
      }

      this.files.set(fileId, updatedFile)

      // 触发关联移除事件
      this.eventBus.emit('file-storage:association-removed', {
        file: updatedFile,
        association: { type: associationType, target_id: targetId, relationship },
        operation: 'remove-association'
      })

      return {
        success: true,
        file: updatedFile,
        duration: performance.now() - startTime
      }
    } catch (error) {
      console.error('文件关联移除失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        duration: performance.now() - startTime
      }
    }
  }

  /**
   * 注册事件监听器
   */
  private registerEventListeners(): void {
    // 监听文件上传完成事件
    this.eventBus.on('file:upload:complete', async (event) => {
      const { files } = event
      for (const uploadedFile of files) {
        // 将上传的文件添加到存储服务
        await this.storeFile(uploadedFile.file, {
          description: `通过文件上传组件上传的文件`,
          tags: [],
          custom_fields: {
            upload_source: 'file-upload-component',
            upload_id: uploadedFile.id
          },
          permissions: {
            is_public: false,
            allow_download: true,
            allow_preview: true,
            shared_users: [],
            editors: [],
            viewers: []
          }
        })
      }
    })

    // 监听文件删除事件
    this.eventBus.on('file:upload:remove', async (event) => {
      const { fileId } = event
      // 这里可以根据需要处理文件删除逻辑
    })
  }

  /**
   * 确保存储目录存在
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.config.storage_root, { recursive: true })
      await fs.mkdir(this.config.thumbnail_dir, { recursive: true })
    } catch (error) {
      console.error('创建存储目录失败:', error)
      throw error
    }
  }

  /**
   * 加载文件索引
   */
  private async loadFileIndex(): Promise<void> {
    // 这里应该从数据库或持久化存储中加载文件索引
    // 目前使用内存存储，实际项目中应该集成数据库
    console.log('文件索引加载完成')
  }

  /**
   * 验证文件
   */
  private async validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
    // 检查文件大小
    if (file.size > this.config.max_file_size) {
      return {
        valid: false,
        error: `文件大小超过限制: ${this.formatFileSize(file.size)} > ${this.formatFileSize(this.config.max_file_size)}`
      }
    }

    // 检查文件类型
    const isAllowedType = this.config.allowed_types.some(type => {
      if (type === '*') return true
      if (type.endsWith('/*')) {
        const category = type.slice(0, -2)
        return file.type.startsWith(category + '/')
      }
      return file.type === type
    })

    if (!isAllowedType) {
      return {
        valid: false,
        error: `不支持的文件类型: ${file.type}`
      }
    }

    return { valid: true }
  }

  /**
   * 生成文件ID
   */
  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成存储路径
   */
  private async generateStoragePath(file: File, fileId: string): Promise<string> {
    const extension = path.extname(file.name)
    const fileName = `${fileId}${extension}`

    switch (this.config.storage_strategy) {
      case 'date-based': {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const datePath = path.join(String(year), month, day)
        const fullPath = path.join(this.config.storage_root, datePath)
        await fs.mkdir(fullPath, { recursive: true })
        return path.join(fullPath, fileName)
      }
      case 'hash-based': {
        const hash = crypto.createHash('md5').update(fileId).digest('hex')
        const hashPath = path.join(hash.substr(0, 2), hash.substr(2, 2))
        const fullPath = path.join(this.config.storage_root, hashPath)
        await fs.mkdir(fullPath, { recursive: true })
        return path.join(fullPath, fileName)
      }
      case 'category-based': {
        const category = this.getFileCategory(file.type)
        const fullPath = path.join(this.config.storage_root, category)
        await fs.mkdir(fullPath, { recursive: true })
        return path.join(fullPath, fileName)
      }
      case 'flat':
      default:
        return path.join(this.config.storage_root, fileName)
    }
  }

  /**
   * 计算文件校验和
   */
  private async calculateChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hash = crypto.createHash('sha256')
    hash.update(new Uint8Array(buffer))
    return hash.digest('hex')
  }

  /**
   * 根据校验和查找文件
   */
  private async findFileByChecksum(checksum: string): Promise<FileEntity | null> {
    for (const file of this.files.values()) {
      if (file.checksum === checksum) {
        return file
      }
    }
    return null
  }

  /**
   * 创建文件引用
   */
  private async createFileReference(
    existingFile: FileEntity,
    metadata: Partial<FileMetadata>,
    associations: FileAssociation[]
  ): Promise<FileEntity> {
    const newFileId = this.generateFileId()
    const referencedFile: FileEntity = {
      ...existingFile,
      id: newFileId,
      metadata: { ...existingFile.metadata, ...metadata },
      associations: [...existingFile.associations, ...associations],
      created_at: new Date(),
      updated_at: new Date()
    }

    this.files.set(newFileId, referencedFile)
    return referencedFile
  }

  /**
   * 保存文件到磁盘
   */
  private async saveFileToDisk(file: File, storagePath: string): Promise<void> {
    const buffer = await file.arrayBuffer()
    await fs.writeFile(storagePath, new Uint8Array(buffer))
  }

  /**
   * 从磁盘删除文件
   */
  private async deleteFileFromDisk(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath)
    } catch (error) {
      // 文件可能已经不存在，忽略错误
      console.warn(`删除文件失败: ${filePath}`, error)
    }
  }

  /**
   * 判断是否应该生成缩略图
   */
  private shouldGenerateThumbnail(fileType: string): boolean {
    return fileType.startsWith('image/') || fileType.startsWith('video/')
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnail(filePath: string, fileId: string): Promise<string> {
    // 这里应该实现实际的缩略图生成逻辑
    // 可以使用sharp、jimp等库来处理图片
    // 目前返回一个模拟的缩略图路径
    const thumbnailFileName = `${fileId}_thumb.jpg`
    const thumbnailPath = path.join(this.config.thumbnail_dir, thumbnailFileName)

    // 模拟缩略图生成
    console.log(`生成缩略图: ${filePath} -> ${thumbnailPath}`)

    return thumbnailPath
  }

  /**
   * 构建文件元数据
   */
  private buildFileMetadata(file: File, metadata: Partial<FileMetadata>): FileMetadata {
    const defaultMetadata: FileMetadata = {
      description: metadata.description || '',
      tags: metadata.tags || [],
      category: metadata.category || this.getFileCategory(file.type),
      custom_fields: metadata.custom_fields || {},
      permissions: metadata.permissions || {
        is_public: false,
        allow_download: true,
        allow_preview: true,
        shared_users: [],
        editors: [],
        viewers: []
      }
    }

    // 根据文件类型添加特定元数据
    if (file.type.startsWith('image/')) {
      defaultMetadata.image = {
        width: 0, // 实际项目中应该读取图片尺寸
        height: 0,
        format: file.type.split('/')[1],
        ...metadata.image
      }
    } else if (file.type.startsWith('video/')) {
      defaultMetadata.video = {
        duration: 0, // 实际项目中应该读取视频时长
        width: 0,
        height: 0,
        format: file.type.split('/')[1],
        ...metadata.video
      }
    } else if (file.type.startsWith('audio/')) {
      defaultMetadata.audio = {
        duration: 0, // 实际项目中应该读取音频时长
        format: file.type.split('/')[1],
        ...metadata.audio
      }
    }

    return defaultMetadata
  }

  /**
   * 获取文件分类
   */
  private getFileCategory(fileType: string): string {
    if (fileType.startsWith('image/')) return 'images'
    if (fileType.startsWith('video/')) return 'videos'
    if (fileType.startsWith('audio/')) return 'audios'
    if (fileType.includes('pdf')) return 'documents'
    if (fileType.startsWith('text/')) return 'documents'
    if (fileType.includes('word') || fileType.includes('excel') || fileType.includes('powerpoint')) {
      return 'documents'
    }
    return 'others'
  }

  /**
   * 清理文件名
   */
  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, '_')
  }

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 匹配文件类型
   */
  private matchesFileType(fileType: string, pattern: string): boolean {
    if (pattern === '*') return true
    if (pattern.endsWith('/*')) {
      const category = pattern.slice(0, -2)
      return fileType.startsWith(category + '/')
    }
    return fileType === pattern
  }

  /**
   * 添加到搜索索引
   */
  private async addToSearchIndex(file: FileEntity): Promise<void> {
    const searchDocument: SearchDocument = {
      id: file.id,
      title: file.name,
      content: `${file.name} ${file.metadata.description || ''} ${file.metadata.tags.join(' ')}`,
      type: 'file' as any,
      path: file.path,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      tags: file.metadata.tags,
      fields: {
        fileType: file.type,
        size: file.size,
        category: file.metadata.category,
        checksum: file.checksum
      }
    }

    this.searchEngine.addDocument(searchDocument)
  }

  /**
   * 更新搜索索引
   */
  private async updateSearchIndex(file: FileEntity): Promise<void> {
    await this.addToSearchIndex(file) // addDocument会自动处理更新
  }
}
