/**
 * 模块服务基础类
 * 提供模块的核心业务逻辑
 */

import { IApiClient, IApiResponse, IPaginationParams, IPaginatedResponse } from '../types'

/**
 * 基础实体接口
 */
export interface IBaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

/**
 * 服务配置接口
 */
export interface IServiceConfig {
  apiClient?: IApiClient
  baseUrl?: string
  timeout?: number
  retryAttempts?: number
}

/**
 * 基础服务类
 */
export abstract class BaseService<T extends IBaseEntity> {
  protected apiClient?: IApiClient
  protected baseUrl: string
  protected resourcePath: string

  constructor(
    resourcePath: string,
    config: IServiceConfig = {}
  ) {
    this.resourcePath = resourcePath
    this.baseUrl = config.baseUrl || ''
    this.apiClient = config.apiClient
  }

  /**
   * 获取所有实体
   */
  async getAll(params?: IPaginationParams): Promise<IPaginatedResponse<T>> {
    if (!this.apiClient) {
      throw new Error('API client not configured')
    }

    const response = await this.apiClient.get<IPaginatedResponse<T>>(
      `${this.baseUrl}/${this.resourcePath}`,
      params
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch data')
    }

    return response.data!
  }

  /**
   * 根据ID获取实体
   */
  async getById(id: string): Promise<T> {
    if (!this.apiClient) {
      throw new Error('API client not configured')
    }

    const response = await this.apiClient.get<T>(
      `${this.baseUrl}/${this.resourcePath}/${id}`
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch data')
    }

    return response.data!
  }

  /**
   * 创建实体
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    if (!this.apiClient) {
      throw new Error('API client not configured')
    }

    const response = await this.apiClient.post<T>(
      `${this.baseUrl}/${this.resourcePath}`,
      data
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to create data')
    }

    return response.data!
  }

  /**
   * 更新实体
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
    if (!this.apiClient) {
      throw new Error('API client not configured')
    }

    const response = await this.apiClient.put<T>(
      `${this.baseUrl}/${this.resourcePath}/${id}`,
      data
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to update data')
    }

    return response.data!
  }

  /**
   * 删除实体
   */
  async delete(id: string): Promise<void> {
    if (!this.apiClient) {
      throw new Error('API client not configured')
    }

    const response = await this.apiClient.delete(
      `${this.baseUrl}/${this.resourcePath}/${id}`
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete data')
    }
  }

  /**
   * 批量删除
   */
  async batchDelete(ids: string[]): Promise<void> {
    if (!this.apiClient) {
      throw new Error('API client not configured')
    }

    const response = await this.apiClient.post(
      `${this.baseUrl}/${this.resourcePath}/batch-delete`,
      { ids }
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to batch delete')
    }
  }

  /**
   * 搜索实体
   */
  async search(query: string, params?: IPaginationParams): Promise<IPaginatedResponse<T>> {
    if (!this.apiClient) {
      throw new Error('API client not configured')
    }

    const response = await this.apiClient.get<IPaginatedResponse<T>>(
      `${this.baseUrl}/${this.resourcePath}/search`,
      { query, ...params }
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to search data')
    }

    return response.data!
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<Record<string, number>> {
    if (!this.apiClient) {
      throw new Error('API client not configured')
    }

    const response = await this.apiClient.get<Record<string, number>>(
      `${this.baseUrl}/${this.resourcePath}/stats`
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch stats')
    }

    return response.data!
  }

  /**
   * 导出数据
   */
  async export(format: 'json' | 'csv' | 'xlsx' = 'json'): Promise<string> {
    if (!this.apiClient) {
      throw new Error('API client not configured')
    }

    const response = await this.apiClient.get<{ downloadUrl: string }>(
      `${this.baseUrl}/${this.resourcePath}/export`,
      { format }
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to export data')
    }

    return response.data!.downloadUrl
  }

  /**
   * 设置API客户端
   */
  setApiClient(apiClient: IApiClient): void {
    this.apiClient = apiClient
  }

  /**
   * 获取资源路径
   */
  getResourcePath(): string {
    return this.resourcePath
  }
}

/**
 * 示例实体接口
 */
export interface IExampleEntity extends IBaseEntity {
  title: string
  content: string
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  metadata: Record<string, any>
}

/**
 * 示例服务实现
 */
export class ExampleService extends BaseService<IExampleEntity> {
  constructor(config: IServiceConfig = {}) {
    super('examples', config)
  }

  /**
   * 根据状态获取实体
   */
  async getByStatus(status: IExampleEntity['status'], params?: IPaginationParams): Promise<IPaginatedResponse<IExampleEntity>> {
    if (!this.apiClient) {
      throw new Error('API client not configured')
    }

    const response = await this.apiClient.get<IPaginatedResponse<IExampleEntity>>(
      `${this.baseUrl}/${this.resourcePath}`,
      { status, ...params }
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch data by status')
    }

    return response.data!
  }

  /**
   * 根据标签获取实体
   */
  async getByTags(tags: string[], params?: IPaginationParams): Promise<IPaginatedResponse<IExampleEntity>> {
    if (!this.apiClient) {
      throw new Error('API client not configured')
    }

    const response = await this.apiClient.get<IPaginatedResponse<IExampleEntity>>(
      `${this.baseUrl}/${this.resourcePath}`,
      { tags: tags.join(','), ...params }
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch data by tags')
    }

    return response.data!
  }

  /**
   * 发布实体
   */
  async publish(id: string): Promise<IExampleEntity> {
    if (!this.apiClient) {
      throw new Error('API client not configured')
    }

    const response = await this.apiClient.post<IExampleEntity>(
      `${this.baseUrl}/${this.resourcePath}/${id}/publish`
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to publish')
    }

    return response.data!
  }

  /**
   * 归档实体
   */
  async archive(id: string): Promise<IExampleEntity> {
    if (!this.apiClient) {
      throw new Error('API client not configured')
    }

    const response = await this.apiClient.post<IExampleEntity>(
      `${this.baseUrl}/${this.resourcePath}/${id}/archive`
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to archive')
    }

    return response.data!
  }

  /**
   * 复制实体
   */
  async duplicate(id: string): Promise<IExampleEntity> {
    if (!this.apiClient) {
      throw new Error('API client not configured')
    }

    const response = await this.apiClient.post<IExampleEntity>(
      `${this.baseUrl}/${this.resourcePath}/${id}/duplicate`
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to duplicate')
    }

    return response.data!
  }
}
