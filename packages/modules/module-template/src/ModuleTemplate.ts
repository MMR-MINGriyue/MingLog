/**
 * 模块模板基础类
 * 提供模块的基础实现，其他模块可以继承此类
 */

import React from 'react'
import {
  IModule,
  IModuleConfig,
  IModuleMetadata,
  ModuleStatus,
  IRouteConfig,
  IMenuItem,
  IModuleEvent,
  IModuleLifecycleHooks
} from './types'

/**
 * 默认模块配置
 */
const DEFAULT_CONFIG: IModuleConfig = {
  enabled: true,
  settings: {},
  preferences: {}
}

/**
 * 模块模板基础类
 */
export abstract class BaseModule implements IModule {
  protected _status: ModuleStatus = ModuleStatus.UNINITIALIZED
  protected _config: IModuleConfig = { ...DEFAULT_CONFIG }
  protected _hooks: IModuleLifecycleHooks = {}

  constructor(
    protected _metadata: IModuleMetadata,
    config?: Partial<IModuleConfig>,
    hooks?: IModuleLifecycleHooks
  ) {
    if (config) {
      this._config = { ...DEFAULT_CONFIG, ...config }
    }
    if (hooks) {
      this._hooks = hooks
    }
  }

  /**
   * 获取模块元数据
   */
  get metadata(): IModuleMetadata {
    return { ...this._metadata }
  }

  /**
   * 获取模块状态
   */
  get status(): ModuleStatus {
    return this._status
  }

  /**
   * 获取模块配置
   */
  get config(): IModuleConfig {
    return { ...this._config }
  }

  /**
   * 设置模块配置
   */
  set config(config: IModuleConfig) {
    this._config = { ...config }
  }

  /**
   * 初始化模块
   */
  async initialize(): Promise<void> {
    if (this._status !== ModuleStatus.UNINITIALIZED) {
      throw new Error(`Module ${this._metadata.id} is already initialized`)
    }

    try {
      this._status = ModuleStatus.INITIALIZING
      
      // 执行初始化前钩子
      if (this._hooks.beforeInitialize) {
        await this._hooks.beforeInitialize()
      }

      // 执行具体的初始化逻辑
      await this.onInitialize()

      this._status = ModuleStatus.INITIALIZED

      // 执行初始化后钩子
      if (this._hooks.afterInitialize) {
        await this._hooks.afterInitialize()
      }

      console.log(`Module ${this._metadata.id} initialized successfully`)
    } catch (error) {
      this._status = ModuleStatus.ERROR
      console.error(`Failed to initialize module ${this._metadata.id}:`, error)
      throw error
    }
  }

  /**
   * 激活模块
   */
  async activate(): Promise<void> {
    if (this._status !== ModuleStatus.INITIALIZED && this._status !== ModuleStatus.INACTIVE) {
      throw new Error(`Module ${this._metadata.id} must be initialized before activation`)
    }

    try {
      this._status = ModuleStatus.ACTIVATING

      // 执行激活前钩子
      if (this._hooks.beforeActivate) {
        await this._hooks.beforeActivate()
      }

      // 执行具体的激活逻辑
      await this.onActivate()

      this._status = ModuleStatus.ACTIVE

      // 执行激活后钩子
      if (this._hooks.afterActivate) {
        await this._hooks.afterActivate()
      }

      console.log(`Module ${this._metadata.id} activated successfully`)
    } catch (error) {
      this._status = ModuleStatus.ERROR
      console.error(`Failed to activate module ${this._metadata.id}:`, error)
      throw error
    }
  }

  /**
   * 停用模块
   */
  async deactivate(): Promise<void> {
    if (this._status !== ModuleStatus.ACTIVE) {
      throw new Error(`Module ${this._metadata.id} is not active`)
    }

    try {
      this._status = ModuleStatus.DEACTIVATING

      // 执行停用前钩子
      if (this._hooks.beforeDeactivate) {
        await this._hooks.beforeDeactivate()
      }

      // 执行具体的停用逻辑
      await this.onDeactivate()

      this._status = ModuleStatus.INACTIVE

      // 执行停用后钩子
      if (this._hooks.afterDeactivate) {
        await this._hooks.afterDeactivate()
      }

      console.log(`Module ${this._metadata.id} deactivated successfully`)
    } catch (error) {
      this._status = ModuleStatus.ERROR
      console.error(`Failed to deactivate module ${this._metadata.id}:`, error)
      throw error
    }
  }

  /**
   * 销毁模块
   */
  async destroy(): Promise<void> {
    if (this._status === ModuleStatus.DESTROYED) {
      return
    }

    try {
      // 如果模块处于激活状态，先停用
      if (this._status === ModuleStatus.ACTIVE) {
        await this.deactivate()
      }

      this._status = ModuleStatus.DESTROYING

      // 执行销毁前钩子
      if (this._hooks.beforeDestroy) {
        await this._hooks.beforeDestroy()
      }

      // 执行具体的销毁逻辑
      await this.onDestroy()

      this._status = ModuleStatus.DESTROYED

      // 执行销毁后钩子
      if (this._hooks.afterDestroy) {
        await this._hooks.afterDestroy()
      }

      console.log(`Module ${this._metadata.id} destroyed successfully`)
    } catch (error) {
      this._status = ModuleStatus.ERROR
      console.error(`Failed to destroy module ${this._metadata.id}:`, error)
      throw error
    }
  }

  /**
   * 获取模块配置
   */
  getConfig(): IModuleConfig {
    return { ...this._config }
  }

  /**
   * 设置模块配置
   */
  setConfig(config: Partial<IModuleConfig>): void {
    const oldConfig = { ...this._config }
    this._config = { ...this._config, ...config }
    
    // 触发配置变更事件
    this.onConfigChanged(oldConfig, this._config)
  }

  /**
   * 获取模块健康状态
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'error'
    message?: string
    details?: Record<string, any>
  }> {
    try {
      // 检查模块状态
      if (this._status === ModuleStatus.ERROR) {
        return {
          status: 'error',
          message: 'Module is in error state'
        }
      }

      if (this._status === ModuleStatus.DESTROYED) {
        return {
          status: 'error',
          message: 'Module is destroyed'
        }
      }

      // 执行具体的健康检查
      const healthCheck = await this.onHealthCheck()
      
      return {
        status: 'healthy',
        ...healthCheck
      }
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { error }
      }
    }
  }

  // 抽象方法，子类需要实现

  /**
   * 具体的初始化逻辑
   */
  protected abstract onInitialize(): Promise<void>

  /**
   * 具体的激活逻辑
   */
  protected abstract onActivate(): Promise<void>

  /**
   * 具体的停用逻辑
   */
  protected abstract onDeactivate(): Promise<void>

  /**
   * 具体的销毁逻辑
   */
  protected abstract onDestroy(): Promise<void>

  /**
   * 获取路由配置
   */
  abstract getRoutes(): IRouteConfig[]

  /**
   * 获取菜单项
   */
  abstract getMenuItems(): IMenuItem[]

  /**
   * 处理模块事件
   */
  abstract onEvent(event: IModuleEvent): void

  // 可选的钩子方法，子类可以重写

  /**
   * 配置变更处理
   */
  protected onConfigChanged(oldConfig: IModuleConfig, newConfig: IModuleConfig): void {
    // 默认实现为空，子类可以重写
  }

  /**
   * 健康检查
   */
  protected async onHealthCheck(): Promise<{
    message?: string
    details?: Record<string, any>
  }> {
    // 默认返回健康状态
    return {
      message: 'Module is healthy'
    }
  }

  /**
   * 获取模块版本信息
   */
  getVersionInfo(): {
    version: string
    buildTime?: string
    gitHash?: string
  } {
    return {
      version: this._metadata.version
    }
  }

  /**
   * 检查依赖是否满足
   */
  checkDependencies(availableModules: string[]): {
    satisfied: boolean
    missing: string[]
    optional: string[]
  } {
    const missing: string[] = []
    const optional: string[] = []

    // 检查必需依赖
    if (this._metadata.dependencies) {
      for (const dep of this._metadata.dependencies) {
        if (!availableModules.includes(dep)) {
          missing.push(dep)
        }
      }
    }

    // 检查可选依赖
    if (this._metadata.optionalDependencies) {
      for (const dep of this._metadata.optionalDependencies) {
        if (!availableModules.includes(dep)) {
          optional.push(dep)
        }
      }
    }

    return {
      satisfied: missing.length === 0,
      missing,
      optional
    }
  }
}

/**
 * 示例模块实现
 */
export class ExampleModule extends BaseModule {
  constructor(config?: Partial<IModuleConfig>) {
    const metadata: IModuleMetadata = {
      id: 'example-module',
      name: 'Example Module',
      version: '1.0.0',
      description: 'An example module implementation',
      author: 'MingLog Team',
      icon: '📝',
      tags: ['example', 'template'],
      dependencies: [],
      optionalDependencies: []
    }

    super(metadata, config)
  }

  protected async onInitialize(): Promise<void> {
    // 初始化逻辑
    console.log('Example module initializing...')
  }

  protected async onActivate(): Promise<void> {
    // 激活逻辑
    console.log('Example module activating...')
  }

  protected async onDeactivate(): Promise<void> {
    // 停用逻辑
    console.log('Example module deactivating...')
  }

  protected async onDestroy(): Promise<void> {
    // 销毁逻辑
    console.log('Example module destroying...')
  }

  getRoutes(): IRouteConfig[] {
    return [
      {
        path: '/example',
        component: (() => {
          // 示例组件，实际使用时应该导入真实组件
          const ExampleComponent = () => React.createElement('div', null, 'Example Page')
          return ExampleComponent
        }) as any,
        name: 'Example Page'
      }
    ]
  }

  getMenuItems(): IMenuItem[] {
    return [
      {
        id: 'example',
        title: 'Example',
        icon: '📝',
        path: '/example',
        order: 100
      }
    ]
  }

  onEvent(event: IModuleEvent): void {
    console.log('Example module received event:', event)
  }
}
