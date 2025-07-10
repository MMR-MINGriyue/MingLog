/**
 * MingLog 插件管理器
 * 提供插件的安装、更新、卸载和管理功能
 */

import { PluginSystem } from './PluginSystem';
import type { Plugin, PluginManifest } from './PluginSystem';

export interface PluginPackage {
  /** 包名 */
  name: string;
  /** 版本 */
  version: string;
  /** 描述 */
  description: string;
  /** 作者 */
  author: string;
  /** 下载URL */
  downloadUrl: string;
  /** 包大小 */
  size: number;
  /** 发布时间 */
  publishedAt: string;
  /** 标签 */
  tags: string[];
  /** 评分 */
  rating?: number;
  /** 下载次数 */
  downloads?: number;
}

export interface PluginRepository {
  /** 仓库名称 */
  name: string;
  /** 仓库URL */
  url: string;
  /** 是否启用 */
  enabled: boolean;
  /** 最后更新时间 */
  lastUpdated?: string;
}

export interface InstallOptions {
  /** 是否强制安装 */
  force?: boolean;
  /** 是否自动激活 */
  autoActivate?: boolean;
  /** 安装后回调 */
  onProgress?: (progress: number, message: string) => void;
}

export interface UpdateInfo {
  /** 当前版本 */
  currentVersion: string;
  /** 最新版本 */
  latestVersion: string;
  /** 是否有更新 */
  hasUpdate: boolean;
  /** 更新日志 */
  changelog?: string;
}

export class PluginManager {
  private pluginSystem: PluginSystem;
  private repositories: PluginRepository[] = [];
  private installedPlugins = new Map<string, PluginPackage>();

  constructor(pluginSystem: PluginSystem) {
    this.pluginSystem = pluginSystem;
    this.loadRepositories();
    this.loadInstalledPlugins();
  }

  /**
   * 搜索插件
   */
  async searchPlugins(query: string, repository?: string): Promise<PluginPackage[]> {
    const repos = repository 
      ? this.repositories.filter(r => r.name === repository)
      : this.repositories.filter(r => r.enabled);

    const results: PluginPackage[] = [];

    for (const repo of repos) {
      try {
        const packages = await this.fetchPackagesFromRepository(repo, query);
        results.push(...packages);
      } catch (error) {
        console.warn(`Failed to search in repository ${repo.name}:`, error);
      }
    }

    // 去重和排序
    const uniqueResults = this.deduplicatePackages(results);
    return this.sortPackages(uniqueResults, query);
  }

  /**
   * 安装插件
   */
  async installPlugin(
    packageName: string, 
    version?: string, 
    options: InstallOptions = {}
  ): Promise<void> {
    const { force = false, autoActivate = true, onProgress } = options;

    try {
      onProgress?.(0, '正在查找插件...');

      // 查找插件包
      const packages = await this.searchPlugins(packageName);
      const targetPackage = packages.find(p => 
        p.name === packageName && (version ? p.version === version : true)
      );

      if (!targetPackage) {
        throw new Error(`Plugin not found: ${packageName}${version ? `@${version}` : ''}`);
      }

      // 检查是否已安装
      if (this.installedPlugins.has(packageName) && !force) {
        throw new Error(`Plugin already installed: ${packageName}`);
      }

      onProgress?.(20, '正在下载插件...');

      // 下载插件
      const pluginCode = await this.downloadPlugin(targetPackage);

      onProgress?.(60, '正在安装插件...');

      // 解析插件
      const plugin = await this.parsePlugin(pluginCode);

      // 验证插件
      this.validatePlugin(plugin);

      onProgress?.(80, '正在注册插件...');

      // 注册插件
      await this.pluginSystem.registerPlugin(plugin);

      // 记录安装信息
      this.installedPlugins.set(packageName, targetPackage);
      await this.saveInstalledPlugins();

      onProgress?.(90, '正在激活插件...');

      // 自动激活
      if (autoActivate) {
        await this.pluginSystem.activatePlugin(plugin.manifest.id);
      }

      onProgress?.(100, '安装完成');

    } catch (error) {
      throw new Error(`Failed to install plugin: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * 卸载插件
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    try {
      // 停用并卸载插件
      await this.pluginSystem.unregisterPlugin(pluginId);

      // 从已安装列表中移除
      this.installedPlugins.delete(pluginId);
      await this.saveInstalledPlugins();

      // 清理插件数据
      await this.cleanupPluginData(pluginId);

    } catch (error) {
      throw new Error(`Failed to uninstall plugin: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * 更新插件
   */
  async updatePlugin(pluginId: string, onProgress?: (progress: number, message: string) => void): Promise<void> {
    try {
      const updateInfoResult = await this.checkForUpdates(pluginId);
      const updateInfo = Array.isArray(updateInfoResult) ? updateInfoResult[0] : updateInfoResult;

      if (!updateInfo.hasUpdate) {
        throw new Error('No updates available');
      }

      // 卸载旧版本
      onProgress?.(20, '正在卸载旧版本...');
      await this.uninstallPlugin(pluginId);

      // 安装新版本
      onProgress?.(40, '正在安装新版本...');
      await this.installPlugin(pluginId, updateInfo.latestVersion, {
        force: true,
        autoActivate: true,
        onProgress: (progress, message) => {
          onProgress?.(40 + progress * 0.6, message);
        }
      });

      onProgress?.(100, '更新完成');

    } catch (error) {
      throw new Error(`Failed to update plugin: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * 检查更新
   */
  async checkForUpdates(pluginId?: string): Promise<UpdateInfo | UpdateInfo[]> {
    if (pluginId) {
      return this.checkSinglePluginUpdate(pluginId);
    } else {
      return this.checkAllPluginUpdates();
    }
  }

  /**
   * 获取已安装的插件
   */
  getInstalledPlugins(): PluginPackage[] {
    return Array.from(this.installedPlugins.values());
  }

  /**
   * 添加仓库
   */
  async addRepository(repository: PluginRepository): Promise<void> {
    // 验证仓库
    await this.validateRepository(repository);

    this.repositories.push(repository);
    await this.saveRepositories();
  }

  /**
   * 移除仓库
   */
  async removeRepository(repositoryName: string): Promise<void> {
    this.repositories = this.repositories.filter(r => r.name !== repositoryName);
    await this.saveRepositories();
  }

  /**
   * 获取仓库列表
   */
  getRepositories(): PluginRepository[] {
    return [...this.repositories];
  }

  /**
   * 刷新仓库
   */
  async refreshRepositories(): Promise<void> {
    for (const repo of this.repositories) {
      if (repo.enabled) {
        try {
          await this.refreshRepository(repo);
        } catch (error) {
          console.warn(`Failed to refresh repository ${repo.name}:`, error);
        }
      }
    }
  }

  /**
   * 从仓库获取包列表
   */
  private async fetchPackagesFromRepository(repository: PluginRepository, query?: string): Promise<PluginPackage[]> {
    const url = new URL('/api/packages', repository.url);
    if (query) {
      url.searchParams.set('q', query);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Repository request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 下载插件
   */
  private async downloadPlugin(packageInfo: PluginPackage): Promise<string> {
    const response = await fetch(packageInfo.downloadUrl);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * 解析插件代码
   */
  private async parsePlugin(code: string): Promise<Plugin> {
    try {
      // 在安全的环境中执行插件代码
      const module = await this.evaluatePluginCode(code);
      
      if (!module.default || typeof module.default !== 'object') {
        throw new Error('Plugin must export a default object');
      }

      return module.default as Plugin;
    } catch (error) {
      throw new Error(`Failed to parse plugin: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * 安全地执行插件代码
   */
  private async evaluatePluginCode(code: string): Promise<any> {
    // 创建沙箱环境
    const sandbox = {
      console,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      Promise,
      fetch: window.fetch.bind(window),
      // 限制的全局对象
      exports: {},
      module: { exports: {} }
    };

    // 包装代码
    const wrappedCode = `
      (function(exports, module, console, setTimeout, clearTimeout, setInterval, clearInterval, Promise, fetch) {
        ${code}
        return module.exports.default || module.exports || exports;
      })
    `;

    try {
      const func = new Function('return ' + wrappedCode)();
      return func(
        sandbox.exports,
        sandbox.module,
        sandbox.console,
        sandbox.setTimeout,
        sandbox.clearTimeout,
        sandbox.setInterval,
        sandbox.clearInterval,
        sandbox.Promise,
        sandbox.fetch
      );
    } catch (error) {
      throw new Error(`Plugin execution failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * 验证插件
   */
  private validatePlugin(plugin: Plugin): void {
    if (!plugin.manifest) {
      throw new Error('Plugin must have a manifest');
    }

    if (!plugin.activate || typeof plugin.activate !== 'function') {
      throw new Error('Plugin must have an activate function');
    }

    // 检查权限
    const permissions = plugin.manifest.permissions || [];
    for (const permission of permissions) {
      if (!this.isPermissionAllowed(permission)) {
        throw new Error(`Permission not allowed: ${permission}`);
      }
    }
  }

  /**
   * 检查权限是否允许
   */
  private isPermissionAllowed(permission: string): boolean {
    const allowedPermissions = [
      'links:read',
      'links:write',
      'search:read',
      'search:write',
      'ui:menu',
      'ui:panel',
      'ui:notification',
      'storage:read',
      'storage:write',
      'fs:read',
      'fs:write'
    ];

    return allowedPermissions.includes(permission);
  }

  /**
   * 检查单个插件更新
   */
  private async checkSinglePluginUpdate(pluginId: string): Promise<UpdateInfo> {
    const installedPackage = this.installedPlugins.get(pluginId);
    if (!installedPackage) {
      throw new Error(`Plugin not installed: ${pluginId}`);
    }

    const packages = await this.searchPlugins(installedPackage.name);
    const latestPackage = packages.find(p => p.name === installedPackage.name);

    if (!latestPackage) {
      throw new Error(`Plugin not found in repositories: ${pluginId}`);
    }

    return {
      currentVersion: installedPackage.version,
      latestVersion: latestPackage.version,
      hasUpdate: this.compareVersions(latestPackage.version, installedPackage.version) > 0
    };
  }

  /**
   * 检查所有插件更新
   */
  private async checkAllPluginUpdates(): Promise<UpdateInfo[]> {
    const updates: UpdateInfo[] = [];

    for (const [pluginId] of this.installedPlugins) {
      try {
        const updateInfo = await this.checkSinglePluginUpdate(pluginId);
        updates.push(updateInfo);
      } catch (error) {
        console.warn(`Failed to check updates for ${pluginId}:`, error);
      }
    }

    return updates;
  }

  /**
   * 比较版本号
   */
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }

    return 0;
  }

  /**
   * 去重包列表
   */
  private deduplicatePackages(packages: PluginPackage[]): PluginPackage[] {
    const seen = new Set<string>();
    return packages.filter(pkg => {
      const key = `${pkg.name}@${pkg.version}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * 排序包列表
   */
  private sortPackages(packages: PluginPackage[], query: string): PluginPackage[] {
    return packages.sort((a, b) => {
      // 名称匹配优先
      const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase());
      const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase());
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;

      // 评分排序
      const aRating = a.rating || 0;
      const bRating = b.rating || 0;
      
      if (aRating !== bRating) return bRating - aRating;

      // 下载次数排序
      const aDownloads = a.downloads || 0;
      const bDownloads = b.downloads || 0;
      
      return bDownloads - aDownloads;
    });
  }

  /**
   * 验证仓库
   */
  private async validateRepository(repository: PluginRepository): Promise<void> {
    try {
      const response = await fetch(`${repository.url}/api/info`);
      if (!response.ok) {
        throw new Error(`Repository validation failed: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Invalid repository: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * 刷新仓库
   */
  private async refreshRepository(repository: PluginRepository): Promise<void> {
    repository.lastUpdated = new Date().toISOString();
    await this.saveRepositories();
  }

  /**
   * 清理插件数据
   */
  private async cleanupPluginData(pluginId: string): Promise<void> {
    // 清理插件存储数据
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(`plugin-${pluginId}`)
    );
    
    keys.forEach(key => localStorage.removeItem(key));
  }

  /**
   * 加载仓库配置
   */
  private loadRepositories(): void {
    try {
      const data = localStorage.getItem('minglog-plugin-repositories');
      if (data) {
        this.repositories = JSON.parse(data);
      } else {
        // 默认仓库
        this.repositories = [
          {
            name: 'official',
            url: 'https://plugins.minglog.org',
            enabled: true
          }
        ];
      }
    } catch (error) {
      console.warn('Failed to load repositories:', error);
      this.repositories = [];
    }
  }

  /**
   * 保存仓库配置
   */
  private async saveRepositories(): Promise<void> {
    try {
      localStorage.setItem('minglog-plugin-repositories', JSON.stringify(this.repositories));
    } catch (error) {
      console.warn('Failed to save repositories:', error);
    }
  }

  /**
   * 加载已安装插件
   */
  private loadInstalledPlugins(): void {
    try {
      const data = localStorage.getItem('minglog-installed-plugins');
      if (data) {
        const plugins = JSON.parse(data);
        this.installedPlugins = new Map(Object.entries(plugins));
      }
    } catch (error) {
      console.warn('Failed to load installed plugins:', error);
    }
  }

  /**
   * 保存已安装插件
   */
  private async saveInstalledPlugins(): Promise<void> {
    try {
      const plugins = Object.fromEntries(this.installedPlugins);
      localStorage.setItem('minglog-installed-plugins', JSON.stringify(plugins));
    } catch (error) {
      console.warn('Failed to save installed plugins:', error);
    }
  }
}

export default PluginManager;
