/**
 * 模块管理器
 * 负责模块的加载、激活、停用和生命周期管理
 * 支持热重载、依赖解析、错误隔离等高级功能
 */

import { EventBus, CORE_EVENTS } from '../event-system/EventBus.js'
import { VersionManager } from '../utils/version-manager.js'
import { ModuleStatus } from '../types/index.js'
import type {
  Module,
  ModuleConfig,
  ModuleRegistration,
  CoreAPI,
  ModuleFactory,
  VersionConstraint
} from '../types/index.js'

export interface ModuleManagerOptions {
  enableHotReload?: boolean
  maxRetryAttempts?: number
  dependencyTimeout?: number
}

export class ModuleManager {
  private modules: Map<string, ModuleRegistration> = new Map()
  private eventBus: EventBus
  private coreAPI: CoreAPI
  private initializationOrder: string[] = []
  private dependencyGraph: Map<string, Set<string>> = new Map()
  private reverseDependencyGraph: Map<string, Set<string>> = new Map()
  private options: ModuleManagerOptions
  private hotReloadWatchers: Map<string, any> = new Map()

  constructor(eventBus: EventBus, coreAPI: CoreAPI, options: ModuleManagerOptions = {}) {
    this.eventBus = eventBus
    this.coreAPI = coreAPI
    this.options = {
      enableHotReload: false,
      maxRetryAttempts: 3,
      dependencyTimeout: 30000,
      ...options
    }

    this.setupErrorBoundary()
  }

  /**
   * 设置错误边界
   */
  private setupErrorBoundary(): void {
    // 监听未捕获的错误
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleGlobalError(event.error)
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.handleGlobalError(event.reason)
      })
    }
  }

  /**
   * 处理全局错误
   */
  private handleGlobalError(error: Error): void {
    // 尝试识别错误来源的模块
    const moduleId = this.identifyErrorSource(error)
    if (moduleId) {
      this.handleModuleError(moduleId, error)
    }
  }

  /**
   * 识别错误来源的模块
   */
  private identifyErrorSource(error: Error): string | null {
    // 通过堆栈跟踪识别模块
    const stack = error.stack || ''
    for (const [moduleId] of this.modules) {
      if (stack.includes(`modules/${moduleId}/`) || stack.includes(moduleId)) {
        return moduleId
      }
    }
    return null
  }

  /**
   * 处理模块错误
   */
  private async handleModuleError(moduleId: string, error: Error): Promise<void> {
    const registration = this.modules.get(moduleId)
    if (!registration) return

    registration.error = error
    registration.status = ModuleStatus.ERROR

    this.eventBus.emit('module:error', { moduleId, error }, 'ModuleManager')

    // 尝试恢复模块
    if (this.options.maxRetryAttempts && this.options.maxRetryAttempts > 0) {
      await this.attemptModuleRecovery(moduleId)
    }
  }

  /**
   * 尝试模块恢复
   */
  private async attemptModuleRecovery(moduleId: string): Promise<void> {
    const registration = this.modules.get(moduleId)
    if (!registration) return

    let attempts = 0
    while (attempts < (this.options.maxRetryAttempts || 3)) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)))
        await this.reloadModule(moduleId)
        break
      } catch (error) {
        attempts++
        if (attempts >= (this.options.maxRetryAttempts || 3)) {
          this.eventBus.emit('module:recovery-failed', { moduleId, error }, 'ModuleManager')
        }
      }
    }
  }

  /**
   * 重载模块
   */
  async reloadModule(moduleId: string): Promise<void> {
    const registration = this.modules.get(moduleId)
    if (!registration) {
      throw new Error(`Module ${moduleId} is not registered`)
    }

    const wasActive = registration.status === ModuleStatus.ACTIVE

    // 先卸载模块
    await this.unloadModule(moduleId)

    // 重新加载模块
    await this.loadModule(moduleId)

    // 如果之前是激活状态，重新激活
    if (wasActive) {
      await this.activateModule(moduleId)
    }

    this.eventBus.emit('module:reloaded', { moduleId }, 'ModuleManager')
  }

  /**
   * 注册模块工厂
   */
  async registerModule(id: string, factory: ModuleFactory, config: ModuleConfig): Promise<void> {
    // 验证模块配置
    this.validateModuleConfig(config)

    if (this.modules.has(id)) {
      if (this.options.enableHotReload) {
        // 热重载模式下允许重新注册
        await this.reloadModule(id)
        return
      } else {
        throw new Error(`Module ${id} is already registered`)
      }
    }

    // 检查版本兼容性
    try {
      this.checkVersionCompatibility(config)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Version compatibility check failed for module ${id}: ${errorMessage}`)
    }

    const registration: ModuleRegistration = {
      id,
      factory,
      config,
      status: ModuleStatus.UNLOADED,
      registeredAt: Date.now()
    }

    this.modules.set(id, registration)

    // 构建依赖图
    this.buildDependencyGraph(id, config.dependencies)

    // 设置热重载监听器
    if (this.options.enableHotReload) {
      this.setupHotReload(id)
    }

    this.eventBus.emit(CORE_EVENTS.MODULE_REGISTERED, { moduleId: id, config }, 'ModuleManager')
  }

  /**
   * 验证模块配置
   */
  private validateModuleConfig(config: ModuleConfig): void {
    if (!config.id) {
      throw new Error('Module ID is required')
    }

    if (!config.name) {
      throw new Error('Module name is required')
    }

    if (!config.version) {
      throw new Error('Module version is required')
    }

    if (!VersionManager.isValidVersion(config.version)) {
      throw new Error(`Invalid version format: ${config.version}`)
    }

    // 验证依赖版本约束
    if (config.dependencyConstraints) {
      for (const constraint of config.dependencyConstraints) {
        if (!VersionManager.isValidConstraint(constraint.constraint)) {
          throw new Error(
            `Invalid version constraint for dependency ${constraint.module}: ${constraint.constraint}`
          )
        }
      }
    }

    // 验证核心版本约束
    if (config.minCoreVersion && !VersionManager.isValidVersion(config.minCoreVersion)) {
      throw new Error(`Invalid minCoreVersion format: ${config.minCoreVersion}`)
    }

    if (config.maxCoreVersion && !VersionManager.isValidVersion(config.maxCoreVersion)) {
      throw new Error(`Invalid maxCoreVersion format: ${config.maxCoreVersion}`)
    }
  }

  /**
   * 构建依赖图
   */
  private buildDependencyGraph(moduleId: string, dependencies: string[]): void {
    // 构建正向依赖图
    this.dependencyGraph.set(moduleId, new Set(dependencies))

    // 构建反向依赖图
    for (const depId of dependencies) {
      if (!this.reverseDependencyGraph.has(depId)) {
        this.reverseDependencyGraph.set(depId, new Set())
      }
      this.reverseDependencyGraph.get(depId)!.add(moduleId)
    }
  }

  /**
   * 检测循环依赖
   */
  private detectCircularDependencies(moduleId: string, visited: Set<string> = new Set(), path: string[] = []): string[] | null {
    if (path.includes(moduleId)) {
      return [...path, moduleId] // 找到循环
    }

    if (visited.has(moduleId)) {
      return null // 已经检查过
    }

    visited.add(moduleId)
    path.push(moduleId)

    const dependencies = this.dependencyGraph.get(moduleId) || new Set()
    for (const depId of dependencies) {
      const cycle = this.detectCircularDependencies(depId, visited, [...path])
      if (cycle) {
        return cycle
      }
    }

    return null
  }

  /**
   * 设置热重载
   */
  private setupHotReload(moduleId: string): void {
    if (typeof window === 'undefined') return // 仅在浏览器环境中启用

    // 这里可以集成文件监听器或开发服务器的热重载机制
    // 示例：监听模块文件变化
    this.eventBus.on(`module:${moduleId}:file-changed`, async () => {
      try {
        await this.reloadModule(moduleId)
        this.coreAPI.notifications.success('模块热重载', `模块 ${moduleId} 已成功重载`)
      } catch (error) {
        this.coreAPI.notifications.error('模块热重载失败', `模块 ${moduleId} 重载失败: ${error}`)
      }
    })
  }

  /**
   * 加载模块
   */
  async loadModule(moduleId: string): Promise<void> {
    const registration = this.modules.get(moduleId)
    if (!registration) {
      throw new Error(`Module ${moduleId} is not registered`)
    }

    if (registration.status !== ModuleStatus.UNLOADED) {
      return // 已经加载或正在加载
    }

    try {
      registration.status = ModuleStatus.LOADING

      // 检测循环依赖
      const cycle = this.detectCircularDependencies(moduleId)
      if (cycle) {
        throw new Error(`Circular dependency detected: ${cycle.join(' -> ')}`)
      }

      // 检查并加载依赖
      await this.loadDependencies(registration.config.dependencies)

      // 创建模块实例
      registration.instance = await registration.factory.create(registration.config)

      // 初始化模块
      await registration.instance.initialize(this.coreAPI)

      registration.status = ModuleStatus.LOADED
      registration.error = undefined // 清除之前的错误

      this.eventBus.emit(CORE_EVENTS.MODULE_LOADED, {
        moduleId,
        module: registration.instance
      }, 'ModuleManager')

    } catch (error) {
      registration.status = ModuleStatus.ERROR
      registration.error = error as Error

      this.eventBus.emit('module:error', {
        moduleId,
        error: error as Error
      }, 'ModuleManager')

      throw error
    }
  }

  /**
   * 加载依赖模块
   */
  private async loadDependencies(dependencies: string[]): Promise<void> {
    const loadPromises = dependencies.map(async (depId) => {
      const depRegistration = this.modules.get(depId)
      if (!depRegistration) {
        throw new Error(`Dependency module ${depId} is not registered`)
      }

      if (depRegistration.status === ModuleStatus.UNLOADED) {
        await this.loadModule(depId)
      } else if (depRegistration.status === ModuleStatus.ERROR) {
        throw new Error(`Dependency module ${depId} is in error state`)
      }
    })

    await Promise.all(loadPromises)
  }

  /**
   * 检查版本兼容性
   */
  private checkVersionCompatibility(moduleConfig: ModuleConfig): void {
    // 检查核心版本兼容性
    if (moduleConfig.minCoreVersion) {
      const coreVersion = this.getCoreVersion()
      if (VersionManager.compareVersions(coreVersion, moduleConfig.minCoreVersion) < 0) {
        throw new Error(
          `Module ${moduleConfig.id} requires core version >= ${moduleConfig.minCoreVersion}, ` +
          `but current version is ${coreVersion}`
        )
      }
    }

    if (moduleConfig.maxCoreVersion) {
      const coreVersion = this.getCoreVersion()
      if (VersionManager.compareVersions(coreVersion, moduleConfig.maxCoreVersion) > 0) {
        throw new Error(
          `Module ${moduleConfig.id} requires core version <= ${moduleConfig.maxCoreVersion}, ` +
          `but current version is ${coreVersion}`
        )
      }
    }

    // 检查依赖版本约束
    if (moduleConfig.dependencyConstraints) {
      for (const constraint of moduleConfig.dependencyConstraints) {
        this.checkDependencyConstraint(moduleConfig.id, constraint)
      }
    }
  }

  /**
   * 检查依赖约束
   */
  private checkDependencyConstraint(moduleId: string, constraint: VersionConstraint): void {
    const depRegistration = this.modules.get(constraint.module)

    if (!depRegistration) {
      if (!constraint.optional) {
        throw new Error(
          `Module ${moduleId} requires dependency ${constraint.module} ` +
          `with version constraint ${constraint.constraint}, but the dependency is not registered`
        )
      }
      return
    }

    const depVersion = depRegistration.config.version
    if (!VersionManager.satisfiesConstraint(depVersion, constraint.constraint)) {
      throw new Error(
        `Module ${moduleId} requires ${constraint.module} version ${constraint.constraint}, ` +
        `but found version ${depVersion}`
      )
    }
  }

  /**
   * 获取核心版本
   */
  private getCoreVersion(): string {
    // 这里应该从实际的核心版本获取
    // 暂时返回固定版本
    return '1.0.0'
  }

  /**
   * 获取依赖冲突
   */
  getDependencyConflicts(): Array<{
    moduleId: string
    conflicts: Array<{
      dependency: string
      required: string
      actual: string
    }>
  }> {
    const conflicts: Array<{
      moduleId: string
      conflicts: Array<{
        dependency: string
        required: string
        actual: string
      }>
    }> = []

    for (const [moduleId, registration] of this.modules) {
      const moduleConflicts: Array<{
        dependency: string
        required: string
        actual: string
      }> = []

      if (registration.config.dependencyConstraints) {
        for (const constraint of registration.config.dependencyConstraints) {
          const depRegistration = this.modules.get(constraint.module)
          if (depRegistration) {
            const depVersion = depRegistration.config.version
            if (!VersionManager.satisfiesConstraint(depVersion, constraint.constraint)) {
              moduleConflicts.push({
                dependency: constraint.module,
                required: constraint.constraint,
                actual: depVersion
              })
            }
          }
        }
      }

      if (moduleConflicts.length > 0) {
        conflicts.push({
          moduleId,
          conflicts: moduleConflicts
        })
      }
    }

    return conflicts
  }

  /**
   * 获取升级建议
   */
  getUpgradeSuggestions(): Array<{
    moduleId: string
    currentVersion: string
    suggestions: {
      patch?: string
      minor?: string
      major?: string
    }
  }> {
    const suggestions: Array<{
      moduleId: string
      currentVersion: string
      suggestions: {
        patch?: string
        minor?: string
        major?: string
      }
    }> = []

    // 这里需要从模块注册表或远程仓库获取可用版本
    // 暂时返回空数组
    return suggestions
  }

  /**
   * 激活模块
   */
  async activateModule(moduleId: string): Promise<void> {
    const registration = this.modules.get(moduleId)
    if (!registration) {
      throw new Error(`Module ${moduleId} is not registered`)
    }

    // 如果已经激活，直接返回
    if (registration.status === ModuleStatus.ACTIVE) {
      return
    }

    // 如果未加载，先加载
    if (registration.status === ModuleStatus.UNLOADED) {
      await this.loadModule(moduleId)
    }

    if (registration.status !== ModuleStatus.LOADED) {
      throw new Error(`Module ${moduleId} is not in loaded state: ${registration.status}`)
    }

    if (!registration.instance) {
      throw new Error(`Module ${moduleId} instance not found`)
    }

    try {
      registration.status = ModuleStatus.ACTIVATING

      // 按拓扑顺序激活依赖模块
      const activationOrder = this.getActivationOrder(moduleId)
      for (const depId of activationOrder) {
        if (depId !== moduleId && !this.isModuleActive(depId)) {
          await this.activateModule(depId)
        }
      }

      // 激活模块
      await registration.instance.activate()

      registration.status = ModuleStatus.ACTIVE
      registration.config.enabled = true

      // 记录激活顺序
      if (!this.initializationOrder.includes(moduleId)) {
        this.initializationOrder.push(moduleId)
      }

      // 注册模块功能
      await this.registerModuleFeatures(registration.instance)

      // 注册设置模式
      this.registerModuleSettings(registration.instance)

      this.eventBus.emit(CORE_EVENTS.MODULE_ACTIVATED, {
        moduleId,
        module: registration.instance
      }, 'ModuleManager')

    } catch (error) {
      registration.status = ModuleStatus.ERROR
      registration.error = error as Error

      this.eventBus.emit('module:error', {
        moduleId,
        error: error as Error
      }, 'ModuleManager')

      throw error
    }
  }

  /**
   * 获取模块激活顺序（拓扑排序）
   */
  private getActivationOrder(moduleId: string): string[] {
    const visited = new Set<string>()
    const order: string[] = []

    const visit = (id: string) => {
      if (visited.has(id)) return
      visited.add(id)

      const dependencies = this.dependencyGraph.get(id) || new Set()
      for (const depId of dependencies) {
        visit(depId)
      }

      order.push(id)
    }

    visit(moduleId)
    return order
  }

  /**
   * 停用模块
   */
  async deactivateModule(moduleId: string, force: boolean = false): Promise<void> {
    const registration = this.modules.get(moduleId)
    if (!registration || !registration.instance) {
      return
    }

    if (registration.status !== ModuleStatus.ACTIVE) {
      return
    }

    try {
      registration.status = ModuleStatus.DEACTIVATING

      // 检查是否有其他模块依赖此模块
      const dependentModules = this.getActiveDependentModules(moduleId)
      if (dependentModules.length > 0 && !force) {
        throw new Error(`Cannot deactivate module ${moduleId}: it has active dependents: ${dependentModules.join(', ')}`)
      }

      // 如果强制停用，先停用依赖此模块的其他模块
      if (force && dependentModules.length > 0) {
        for (const depModuleId of dependentModules) {
          await this.deactivateModule(depModuleId, true)
        }
      }

      // 停用模块
      await registration.instance.deactivate()

      registration.status = ModuleStatus.LOADED
      registration.config.enabled = false

      // 从激活顺序中移除
      const index = this.initializationOrder.indexOf(moduleId)
      if (index > -1) {
        this.initializationOrder.splice(index, 1)
      }

      // 注销模块功能
      await this.unregisterModuleFeatures(moduleId)

      this.eventBus.emit(CORE_EVENTS.MODULE_DEACTIVATED, {
        moduleId,
        module: registration.instance
      }, 'ModuleManager')

    } catch (error) {
      registration.status = ModuleStatus.ERROR
      registration.error = error as Error

      this.eventBus.emit('module:error', {
        moduleId,
        error: error as Error
      }, 'ModuleManager')

      throw error
    }
  }

  /**
   * 获取激活状态的依赖模块
   */
  private getActiveDependentModules(moduleId: string): string[] {
    const dependents = this.reverseDependencyGraph.get(moduleId) || new Set()
    return Array.from(dependents).filter(depId => this.isModuleActive(depId))
  }

  /**
   * 卸载模块
   */
  async unloadModule(moduleId: string, force: boolean = false): Promise<void> {
    const registration = this.modules.get(moduleId)
    if (!registration) {
      return
    }

    // 如果模块处于激活状态，先停用
    if (registration.status === ModuleStatus.ACTIVE) {
      await this.deactivateModule(moduleId, force)
    }

    // 清理热重载监听器
    if (this.hotReloadWatchers.has(moduleId)) {
      const watcher = this.hotReloadWatchers.get(moduleId)
      if (watcher && typeof watcher.close === 'function') {
        watcher.close()
      }
      this.hotReloadWatchers.delete(moduleId)
    }

    // 销毁模块实例
    if (registration.instance?.destroy) {
      try {
        await registration.instance.destroy()
      } catch (error) {
        console.warn(`Error destroying module ${moduleId}:`, error)
      }
    }

    registration.instance = undefined
    registration.status = ModuleStatus.UNLOADED
    registration.error = undefined

    this.eventBus.emit(CORE_EVENTS.MODULE_UNLOADED, { moduleId }, 'ModuleManager')
  }

  /**
   * 完全移除模块
   */
  async removeModule(moduleId: string): Promise<void> {
    await this.unloadModule(moduleId, true)

    // 从依赖图中移除
    this.dependencyGraph.delete(moduleId)
    this.reverseDependencyGraph.delete(moduleId)

    // 从其他模块的依赖图中移除此模块
    for (const [id, deps] of this.dependencyGraph) {
      deps.delete(moduleId)
    }

    for (const [id, deps] of this.reverseDependencyGraph) {
      deps.delete(moduleId)
    }

    // 从注册表中移除
    this.modules.delete(moduleId)

    this.eventBus.emit('module:removed', { moduleId }, 'ModuleManager')
  }

  /**
   * 获取模块实例
   */
  getModule(moduleId: string): Module | undefined {
    return this.modules.get(moduleId)?.instance
  }

  /**
   * 获取模块配置
   */
  getModuleConfig(moduleId: string): ModuleConfig | undefined {
    return this.modules.get(moduleId)?.config
  }

  /**
   * 获取模块状态
   */
  getModuleStatus(moduleId: string): ModuleStatus | undefined {
    return this.modules.get(moduleId)?.status
  }

  /**
   * 检查模块是否激活
   */
  isModuleActive(moduleId: string): boolean {
    return this.modules.get(moduleId)?.status === ModuleStatus.ACTIVE
  }

  /**
   * 获取所有已注册的模块
   */
  getRegisteredModules(): ModuleConfig[] {
    return Array.from(this.modules.values()).map(reg => reg.config)
  }

  /**
   * 获取所有激活的模块
   */
  getActiveModules(): Module[] {
    return Array.from(this.modules.values())
      .filter(reg => reg.status === ModuleStatus.ACTIVE && reg.instance)
      .map(reg => reg.instance!)
  }

  /**
   * 获取模块错误信息
   */
  getModuleError(moduleId: string): Error | undefined {
    return this.modules.get(moduleId)?.error
  }

  /**
   * 获取模块健康状态
   */
  async getModuleHealth(moduleId: string): Promise<{ status: string; details?: any }> {
    const registration = this.modules.get(moduleId)
    if (!registration) {
      return { status: 'not_found' }
    }

    if (registration.status === ModuleStatus.ERROR) {
      return {
        status: 'error',
        details: {
          error: registration.error?.message,
          stack: registration.error?.stack
        }
      }
    }

    if (registration.instance?.healthCheck) {
      try {
        const health = await registration.instance.healthCheck()
        return { status: 'healthy', details: health }
      } catch (error) {
        return {
          status: 'unhealthy',
          details: { error: (error as Error).message }
        }
      }
    }

    return { status: registration.status }
  }

  /**
   * 获取模块性能指标
   */
  getModuleMetrics(moduleId: string): any {
    const registration = this.modules.get(moduleId)
    if (!registration) return null

    return {
      status: registration.status,
      loadTime: registration.loadTime,
      activationTime: registration.activationTime,
      errorCount: registration.errorCount || 0,
      lastError: registration.error?.message
    }
  }

  /**
   * 注册模块功能（路由、菜单等）
   */
  private async registerModuleFeatures(module: Module): Promise<void> {
    try {
      // 注册路由
      if (module.getRoutes) {
        const routes = module.getRoutes()
        this.coreAPI.router.addRoutes(routes)
        this.eventBus.emit('module:routes-registered', {
          moduleId: module.id,
          routes
        }, 'ModuleManager')
      }

      // 注册菜单项
      if (module.getMenuItems) {
        const menuItems = module.getMenuItems()
        this.eventBus.emit('module:menu-items-registered', {
          moduleId: module.id,
          menuItems
        }, 'ModuleManager')
      }

      // 注册工具栏项
      if (module.getToolbarItems) {
        const toolbarItems = module.getToolbarItems()
        this.eventBus.emit('module:toolbar-items-registered', {
          moduleId: module.id,
          toolbarItems
        }, 'ModuleManager')
      }

      // 注册命令
      if (module.getCommands) {
        const commands = module.getCommands()
        this.eventBus.emit('module:commands-registered', {
          moduleId: module.id,
          commands
        }, 'ModuleManager')
      }
    } catch (error) {
      console.warn(`Error registering features for module ${module.id}:`, error)
    }
  }

  /**
   * 注销模块功能
   */
  private async unregisterModuleFeatures(moduleId: string): Promise<void> {
    try {
      // 注销路由
      this.coreAPI.router.removeRoutes(moduleId)

      // 发送注销事件
      this.eventBus.emit('module:features-unregistered', { moduleId }, 'ModuleManager')
    } catch (error) {
      console.warn(`Error unregistering features for module ${moduleId}:`, error)
    }
  }

  /**
   * 注册模块设置
   */
  private registerModuleSettings(module: Module): void {
    if (module.getSettings) {
      const settings = module.getSettings()
      this.eventBus.emit('module:register-settings', {
        moduleId: module.id,
        settings
      }, 'ModuleManager')
    }
  }

  /**
   * 获取模块依赖树
   */
  getDependencyTree(moduleId: string): any {
    const visited = new Set<string>()

    const buildTree = (id: string): any => {
      if (visited.has(id)) {
        return { id, circular: true }
      }

      visited.add(id)
      const dependencies = this.dependencyGraph.get(id) || new Set()

      return {
        id,
        status: this.getModuleStatus(id),
        dependencies: Array.from(dependencies).map(depId => buildTree(depId))
      }
    }

    return buildTree(moduleId)
  }

  /**
   * 批量操作模块
   */
  async batchOperation(
    moduleIds: string[],
    operation: 'activate' | 'deactivate' | 'reload',
    options: { parallel?: boolean; force?: boolean } = {}
  ): Promise<{ success: string[]; failed: { id: string; error: Error }[] }> {
    const success: string[] = []
    const failed: { id: string; error: Error }[] = []

    const executeOperation = async (moduleId: string) => {
      try {
        switch (operation) {
          case 'activate':
            await this.activateModule(moduleId)
            break
          case 'deactivate':
            await this.deactivateModule(moduleId, options.force)
            break
          case 'reload':
            await this.reloadModule(moduleId)
            break
        }
        success.push(moduleId)
      } catch (error) {
        failed.push({ id: moduleId, error: error as Error })
      }
    }

    if (options.parallel) {
      await Promise.allSettled(moduleIds.map(executeOperation))
    } else {
      for (const moduleId of moduleIds) {
        await executeOperation(moduleId)
      }
    }

    return { success, failed }
  }

  /**
   * 停用所有模块
   */
  async deactivateAllModules(): Promise<void> {
    const activeModules = Array.from(this.activeModules.keys())

    // 按依赖关系逆序停用模块
    const sortedModules = this.sortModulesByDependencies(activeModules).reverse()

    for (const moduleId of sortedModules) {
      try {
        await this.deactivateModule(moduleId)
      } catch (error) {
        console.error(`Failed to deactivate module ${moduleId}:`, error)
        // 继续停用其他模块，不要因为一个模块失败而停止
      }
    }
  }
}
