/**
 * 模块相关类型定义
 */

import { ReactNode } from 'react'

/**
 * 模块配置接口
 */
export interface IModuleConfig {
  /** 模块是否启用 */
  enabled: boolean
  /** 模块设置 */
  settings: Record<string, any>
  /** 用户偏好 */
  preferences: Record<string, any>
}

/**
 * 路由配置接口
 */
export interface IRouteConfig {
  /** 路由路径 */
  path: string
  /** 路由组件 */
  component: React.ComponentType
  /** 路由名称 */
  name: string
  /** 是否需要认证 */
  requireAuth?: boolean
  /** 路由元数据 */
  meta?: Record<string, any>
}

/**
 * 菜单项接口
 */
export interface IMenuItem {
  /** 菜单ID */
  id: string
  /** 菜单标题 */
  title: string
  /** 菜单图标 */
  icon?: ReactNode
  /** 菜单路径 */
  path?: string
  /** 子菜单 */
  children?: IMenuItem[]
  /** 菜单顺序 */
  order?: number
  /** 是否显示 */
  visible?: boolean
}

/**
 * 模块事件接口
 */
export interface IModuleEvent {
  /** 事件类型 */
  type: string
  /** 事件数据 */
  data?: any
  /** 事件来源模块 */
  source?: string
  /** 事件时间戳 */
  timestamp: number
}

/**
 * 模块状态枚举
 */
export enum ModuleStatus {
  /** 未初始化 */
  UNINITIALIZED = 'uninitialized',
  /** 初始化中 */
  INITIALIZING = 'initializing',
  /** 已初始化 */
  INITIALIZED = 'initialized',
  /** 激活中 */
  ACTIVATING = 'activating',
  /** 已激活 */
  ACTIVE = 'active',
  /** 停用中 */
  DEACTIVATING = 'deactivating',
  /** 已停用 */
  INACTIVE = 'inactive',
  /** 销毁中 */
  DESTROYING = 'destroying',
  /** 已销毁 */
  DESTROYED = 'destroyed',
  /** 错误状态 */
  ERROR = 'error'
}

/**
 * 模块元数据接口
 */
export interface IModuleMetadata {
  /** 模块ID */
  id: string
  /** 模块名称 */
  name: string
  /** 模块版本 */
  version: string
  /** 模块描述 */
  description: string
  /** 模块作者 */
  author?: string
  /** 模块图标 */
  icon?: string
  /** 模块标签 */
  tags?: string[]
  /** 依赖的模块 */
  dependencies?: string[]
  /** 可选依赖 */
  optionalDependencies?: string[]
  /** 最小核心版本 */
  minCoreVersion?: string
  /** 模块主页 */
  homepage?: string
  /** 模块仓库 */
  repository?: string
}

/**
 * 模块接口
 */
export interface IModule {
  /** 模块元数据 */
  readonly metadata: IModuleMetadata
  
  /** 模块状态 */
  readonly status: ModuleStatus
  
  /** 模块配置 */
  config: IModuleConfig
  
  /**
   * 初始化模块
   */
  initialize(): Promise<void>
  
  /**
   * 激活模块
   */
  activate(): Promise<void>
  
  /**
   * 停用模块
   */
  deactivate(): Promise<void>
  
  /**
   * 销毁模块
   */
  destroy(): Promise<void>
  
  /**
   * 获取模块配置
   */
  getConfig(): IModuleConfig
  
  /**
   * 设置模块配置
   */
  setConfig(config: Partial<IModuleConfig>): void
  
  /**
   * 获取路由配置
   */
  getRoutes(): IRouteConfig[]
  
  /**
   * 获取菜单项
   */
  getMenuItems(): IMenuItem[]
  
  /**
   * 处理模块事件
   */
  onEvent(event: IModuleEvent): void
  
  /**
   * 获取模块健康状态
   */
  getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'error'
    message?: string
    details?: Record<string, any>
  }>
}

/**
 * 模块工厂接口
 */
export interface IModuleFactory {
  /**
   * 创建模块实例
   */
  createModule(config?: Partial<IModuleConfig>): Promise<IModule>
  
  /**
   * 获取模块元数据
   */
  getMetadata(): IModuleMetadata
}

/**
 * 模块生命周期钩子
 */
export interface IModuleLifecycleHooks {
  /** 初始化前 */
  beforeInitialize?: () => Promise<void>
  /** 初始化后 */
  afterInitialize?: () => Promise<void>
  /** 激活前 */
  beforeActivate?: () => Promise<void>
  /** 激活后 */
  afterActivate?: () => Promise<void>
  /** 停用前 */
  beforeDeactivate?: () => Promise<void>
  /** 停用后 */
  afterDeactivate?: () => Promise<void>
  /** 销毁前 */
  beforeDestroy?: () => Promise<void>
  /** 销毁后 */
  afterDestroy?: () => Promise<void>
}
