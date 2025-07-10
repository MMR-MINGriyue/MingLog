/**
 * MingLog 插件系统核心
 * 提供可扩展的插件API和生命周期管理
 */

import { EventEmitter } from 'events';

export interface PluginManifest {
  /** 插件ID */
  id: string;
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件描述 */
  description: string;
  /** 插件作者 */
  author: string;
  /** 插件主页 */
  homepage?: string;
  /** 插件许可证 */
  license?: string;
  /** 依赖的插件 */
  dependencies?: string[];
  /** 支持的MingLog版本 */
  minglogVersion?: string;
  /** 插件入口文件 */
  main: string;
  /** 插件权限 */
  permissions?: string[];
  /** 插件配置模式 */
  configSchema?: any;
}

export interface PluginContext {
  /** 插件ID */
  id: string;
  /** 插件配置 */
  config: any;
  /** 日志记录器 */
  logger: PluginLogger;
  /** 事件发射器 */
  events: EventEmitter;
  /** API访问器 */
  api: PluginAPI;
  /** 存储访问器 */
  storage: PluginStorage;
}

export interface PluginAPI {
  /** 链接管理API */
  links: {
    create: (link: any) => Promise<void>;
    update: (id: string, link: any) => Promise<void>;
    delete: (id: string) => Promise<void>;
    find: (query: any) => Promise<any[]>;
  };
  /** 搜索API */
  search: {
    index: (documents: any[]) => Promise<void>;
    query: (query: string, options?: any) => Promise<any[]>;
  };
  /** UI API */
  ui: {
    addMenuItem: (item: MenuItem) => void;
    addPanel: (panel: Panel) => void;
    showNotification: (message: string, type?: 'info' | 'warning' | 'error') => void;
    openModal: (content: any) => void;
  };
  /** 文件系统API */
  fs: {
    read: (path: string) => Promise<string>;
    write: (path: string, content: string) => Promise<void>;
    exists: (path: string) => Promise<boolean>;
    list: (path: string) => Promise<string[]>;
  };
}

export interface PluginStorage {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

export interface PluginLogger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  submenu?: MenuItem[];
}

export interface Panel {
  id: string;
  title: string;
  icon?: string;
  component: any;
  position: 'left' | 'right' | 'bottom';
}

export interface Plugin {
  /** 插件清单 */
  manifest: PluginManifest;
  /** 插件激活函数 */
  activate: (context: PluginContext) => Promise<void> | void;
  /** 插件停用函数 */
  deactivate?: () => Promise<void> | void;
}

export interface PluginState {
  /** 插件实例 */
  plugin: Plugin;
  /** 插件上下文 */
  context: PluginContext;
  /** 激活状态 */
  active: boolean;
  /** 加载时间 */
  loadedAt: number;
  /** 激活时间 */
  activatedAt?: number;
  /** 错误信息 */
  error?: string;
}

export class PluginSystem extends EventEmitter {
  private plugins = new Map<string, PluginState>();
  private api: PluginAPI;
  private storage: Map<string, PluginStorage> = new Map();

  constructor(api: PluginAPI) {
    super();
    this.api = api;
  }

  /**
   * 注册插件
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    const { manifest } = plugin;

    // 验证插件清单
    this.validateManifest(manifest);

    // 检查依赖
    await this.checkDependencies(manifest);

    // 创建插件上下文
    const context = this.createPluginContext(manifest);

    // 创建插件状态
    const state: PluginState = {
      plugin,
      context,
      active: false,
      loadedAt: Date.now()
    };

    this.plugins.set(manifest.id, state);

    this.emit('plugin-registered', manifest.id);
  }

  /**
   * 激活插件
   */
  async activatePlugin(pluginId: string): Promise<void> {
    const state = this.plugins.get(pluginId);
    if (!state) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (state.active) {
      return; // 已经激活
    }

    try {
      // 激活依赖插件
      for (const depId of state.plugin.manifest.dependencies || []) {
        await this.activatePlugin(depId);
      }

      // 激活插件
      await state.plugin.activate(state.context);
      
      state.active = true;
      state.activatedAt = Date.now();
      state.error = undefined;

      this.emit('plugin-activated', pluginId);
    } catch (error) {
      state.error = error instanceof Error ? error.message : String(error);
      this.emit('plugin-error', pluginId, error);
      throw error;
    }
  }

  /**
   * 停用插件
   */
  async deactivatePlugin(pluginId: string): Promise<void> {
    const state = this.plugins.get(pluginId);
    if (!state || !state.active) {
      return;
    }

    try {
      // 停用依赖此插件的其他插件
      for (const [id, otherState] of this.plugins) {
        if (otherState.active && 
            otherState.plugin.manifest.dependencies?.includes(pluginId)) {
          await this.deactivatePlugin(id);
        }
      }

      // 停用插件
      if (state.plugin.deactivate) {
        await state.plugin.deactivate();
      }

      state.active = false;
      state.activatedAt = undefined;

      this.emit('plugin-deactivated', pluginId);
    } catch (error) {
      state.error = error instanceof Error ? error.message : String(error);
      this.emit('plugin-error', pluginId, error);
      throw error;
    }
  }

  /**
   * 卸载插件
   */
  async unregisterPlugin(pluginId: string): Promise<void> {
    await this.deactivatePlugin(pluginId);
    
    this.plugins.delete(pluginId);
    this.storage.delete(pluginId);

    this.emit('plugin-unregistered', pluginId);
  }

  /**
   * 获取插件列表
   */
  getPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(state => state.plugin.manifest);
  }

  /**
   * 获取激活的插件列表
   */
  getActivePlugins(): PluginManifest[] {
    return Array.from(this.plugins.values())
      .filter(state => state.active)
      .map(state => state.plugin.manifest);
  }

  /**
   * 获取插件状态
   */
  getPluginState(pluginId: string): PluginState | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 检查插件是否激活
   */
  isPluginActive(pluginId: string): boolean {
    const state = this.plugins.get(pluginId);
    return state ? state.active : false;
  }

  /**
   * 获取插件配置
   */
  getPluginConfig(pluginId: string): any {
    const state = this.plugins.get(pluginId);
    return state ? state.context.config : null;
  }

  /**
   * 更新插件配置
   */
  async updatePluginConfig(pluginId: string, config: any): Promise<void> {
    const state = this.plugins.get(pluginId);
    if (!state) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // 验证配置
    this.validateConfig(state.plugin.manifest, config);

    // 更新配置
    state.context.config = { ...state.context.config, ...config };

    // 保存配置
    await this.savePluginConfig(pluginId, state.context.config);

    this.emit('plugin-config-updated', pluginId, config);
  }

  /**
   * 验证插件清单
   */
  private validateManifest(manifest: PluginManifest): void {
    const required = ['id', 'name', 'version', 'main'];
    for (const field of required) {
      if (!manifest[field as keyof PluginManifest]) {
        throw new Error(`Missing required field in manifest: ${field}`);
      }
    }

    // 检查ID格式
    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      throw new Error('Plugin ID must contain only lowercase letters, numbers, and hyphens');
    }

    // 检查版本格式
    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error('Plugin version must follow semantic versioning (x.y.z)');
    }
  }

  /**
   * 检查依赖
   */
  private async checkDependencies(manifest: PluginManifest): Promise<void> {
    for (const depId of manifest.dependencies || []) {
      if (!this.plugins.has(depId)) {
        throw new Error(`Missing dependency: ${depId}`);
      }
    }
  }

  /**
   * 创建插件上下文
   */
  private createPluginContext(manifest: PluginManifest): PluginContext {
    const logger = this.createPluginLogger(manifest.id);
    const storage = this.createPluginStorage(manifest.id);
    const config = this.loadPluginConfig(manifest.id);

    return {
      id: manifest.id,
      config,
      logger,
      events: new EventEmitter(),
      api: this.api,
      storage
    };
  }

  /**
   * 创建插件日志记录器
   */
  private createPluginLogger(pluginId: string): PluginLogger {
    const prefix = `[Plugin:${pluginId}]`;
    
    return {
      debug: (message: string, ...args: any[]) => console.debug(prefix, message, ...args),
      info: (message: string, ...args: any[]) => console.info(prefix, message, ...args),
      warn: (message: string, ...args: any[]) => console.warn(prefix, message, ...args),
      error: (message: string, ...args: any[]) => console.error(prefix, message, ...args)
    };
  }

  /**
   * 创建插件存储
   */
  private createPluginStorage(pluginId: string): PluginStorage {
    const storageKey = `plugin-${pluginId}`;
    
    const storage: PluginStorage = {
      async get(key: string): Promise<any> {
        try {
          const data = localStorage.getItem(`${storageKey}-${key}`);
          return data ? JSON.parse(data) : null;
        } catch {
          return null;
        }
      },

      async set(key: string, value: any): Promise<void> {
        try {
          localStorage.setItem(`${storageKey}-${key}`, JSON.stringify(value));
        } catch (error) {
          throw new Error(`Failed to save plugin data: ${error}`);
        }
      },

      async delete(key: string): Promise<void> {
        localStorage.removeItem(`${storageKey}-${key}`);
      },

      async clear(): Promise<void> {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(storageKey));
        keys.forEach(key => localStorage.removeItem(key));
      }
    };

    this.storage.set(pluginId, storage);
    return storage;
  }

  /**
   * 加载插件配置
   */
  private loadPluginConfig(pluginId: string): any {
    try {
      const data = localStorage.getItem(`plugin-config-${pluginId}`);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  /**
   * 保存插件配置
   */
  private async savePluginConfig(pluginId: string, config: any): Promise<void> {
    try {
      localStorage.setItem(`plugin-config-${pluginId}`, JSON.stringify(config));
    } catch (error) {
      throw new Error(`Failed to save plugin config: ${error}`);
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(manifest: PluginManifest, config: any): void {
    // 这里可以使用JSON Schema或其他验证库
    // 简化实现
    if (manifest.configSchema) {
      // TODO: 实现配置验证
    }
  }
}

export default PluginSystem;
