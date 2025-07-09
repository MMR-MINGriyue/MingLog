/**
 * API 接口类型定义
 */

/**
 * API 响应基础接口
 */
export interface IApiResponse<T = any> {
  /** 是否成功 */
  success: boolean
  /** 响应数据 */
  data?: T
  /** 错误信息 */
  error?: string
  /** 错误码 */
  code?: string
  /** 响应消息 */
  message?: string
  /** 时间戳 */
  timestamp: number
}

/**
 * 分页请求参数
 */
export interface IPaginationParams {
  /** 页码 */
  page: number
  /** 每页大小 */
  pageSize: number
  /** 排序字段 */
  sortBy?: string
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
}

/**
 * 分页响应数据
 */
export interface IPaginatedResponse<T> {
  /** 数据列表 */
  items: T[]
  /** 总数量 */
  total: number
  /** 当前页 */
  page: number
  /** 每页大小 */
  pageSize: number
  /** 总页数 */
  totalPages: number
  /** 是否有下一页 */
  hasNext: boolean
  /** 是否有上一页 */
  hasPrev: boolean
}

/**
 * 搜索请求参数
 */
export interface ISearchParams extends IPaginationParams {
  /** 搜索关键词 */
  query?: string
  /** 搜索过滤器 */
  filters?: Record<string, any>
  /** 搜索字段 */
  fields?: string[]
  /** 高亮设置 */
  highlight?: boolean
}

/**
 * 批量操作请求
 */
export interface IBatchRequest<T> {
  /** 操作类型 */
  operation: 'create' | 'update' | 'delete'
  /** 操作数据 */
  items: T[]
  /** 操作选项 */
  options?: Record<string, any>
}

/**
 * 批量操作响应
 */
export interface IBatchResponse<T> {
  /** 成功的项目 */
  success: T[]
  /** 失败的项目 */
  failed: Array<{
    item: T
    error: string
    code?: string
  }>
  /** 总数 */
  total: number
  /** 成功数 */
  successCount: number
  /** 失败数 */
  failedCount: number
}

/**
 * 文件上传响应
 */
export interface IFileUploadResponse {
  /** 文件ID */
  id: string
  /** 文件名 */
  filename: string
  /** 文件大小 */
  size: number
  /** 文件类型 */
  mimeType: string
  /** 文件URL */
  url: string
  /** 缩略图URL */
  thumbnailUrl?: string
  /** 上传时间 */
  uploadedAt: string
}

/**
 * 导出请求参数
 */
export interface IExportParams {
  /** 导出格式 */
  format: 'json' | 'csv' | 'xlsx' | 'pdf'
  /** 导出过滤器 */
  filters?: Record<string, any>
  /** 导出字段 */
  fields?: string[]
  /** 导出选项 */
  options?: Record<string, any>
}

/**
 * 导入请求参数
 */
export interface IImportParams {
  /** 文件ID */
  fileId: string
  /** 导入格式 */
  format: 'json' | 'csv' | 'xlsx'
  /** 导入选项 */
  options?: {
    /** 是否覆盖现有数据 */
    overwrite?: boolean
    /** 字段映射 */
    fieldMapping?: Record<string, string>
    /** 验证规则 */
    validation?: Record<string, any>
  }
}

/**
 * 导入响应
 */
export interface IImportResponse {
  /** 导入ID */
  importId: string
  /** 总行数 */
  totalRows: number
  /** 成功行数 */
  successRows: number
  /** 失败行数 */
  failedRows: number
  /** 错误详情 */
  errors?: Array<{
    row: number
    field?: string
    message: string
  }>
  /** 导入状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

/**
 * 统计数据接口
 */
export interface IStatsResponse {
  /** 统计数据 */
  stats: Record<string, number>
  /** 时间范围 */
  timeRange: {
    start: string
    end: string
  }
  /** 统计类型 */
  type: string
}

/**
 * 健康检查响应
 */
export interface IHealthCheckResponse {
  /** 服务状态 */
  status: 'healthy' | 'degraded' | 'unhealthy'
  /** 检查时间 */
  timestamp: string
  /** 响应时间 */
  responseTime: number
  /** 详细信息 */
  details: Record<string, {
    status: 'healthy' | 'degraded' | 'unhealthy'
    message?: string
    responseTime?: number
  }>
}

/**
 * API 错误类型
 */
export interface IApiError {
  /** 错误码 */
  code: string
  /** 错误消息 */
  message: string
  /** 错误详情 */
  details?: Record<string, any>
  /** 错误堆栈 */
  stack?: string
  /** HTTP状态码 */
  statusCode?: number
}

/**
 * API 客户端配置
 */
export interface IApiClientConfig {
  /** 基础URL */
  baseURL: string
  /** 超时时间 */
  timeout?: number
  /** 请求头 */
  headers?: Record<string, string>
  /** 认证信息 */
  auth?: {
    type: 'bearer' | 'basic' | 'api-key'
    token?: string
    username?: string
    password?: string
    apiKey?: string
  }
  /** 重试配置 */
  retry?: {
    attempts: number
    delay: number
    backoff?: 'linear' | 'exponential'
  }
}

/**
 * API 客户端接口
 */
export interface IApiClient {
  /**
   * GET 请求
   */
  get<T>(url: string, params?: Record<string, any>): Promise<IApiResponse<T>>
  
  /**
   * POST 请求
   */
  post<T>(url: string, data?: any): Promise<IApiResponse<T>>
  
  /**
   * PUT 请求
   */
  put<T>(url: string, data?: any): Promise<IApiResponse<T>>
  
  /**
   * PATCH 请求
   */
  patch<T>(url: string, data?: any): Promise<IApiResponse<T>>
  
  /**
   * DELETE 请求
   */
  delete<T>(url: string): Promise<IApiResponse<T>>
  
  /**
   * 上传文件
   */
  upload(url: string, file: File, options?: Record<string, any>): Promise<IApiResponse<IFileUploadResponse>>
  
  /**
   * 下载文件
   */
  download(url: string, filename?: string): Promise<void>
}
