/**
 * MingLog 主题插件示例
 * 演示如何创建一个主题切换插件
 */

import type { Plugin, PluginContext, PluginManifest } from '../PluginSystem';

export interface ThemeConfig {
  /** 默认主题 */
  defaultTheme: string;
  /** 可用主题列表 */
  availableThemes: string[];
  /** 是否跟随系统主题 */
  followSystem: boolean;
  /** 自动切换时间 */
  autoSwitchTimes?: {
    lightTime: string;
    darkTime: string;
  };
}

export interface Theme {
  /** 主题ID */
  id: string;
  /** 主题名称 */
  name: string;
  /** 主题描述 */
  description: string;
  /** CSS变量 */
  variables: Record<string, string>;
  /** 自定义CSS */
  customCSS?: string;
}

class ThemePlugin implements Plugin {
  manifest: PluginManifest = {
    id: 'minglog-theme-plugin',
    name: '主题管理器',
    version: '1.0.0',
    description: '提供主题切换和自定义功能',
    author: 'MingLog Team',
    main: 'ThemePlugin.js',
    permissions: ['ui:menu', 'ui:panel', 'storage:read', 'storage:write'],
    configSchema: {
      type: 'object',
      properties: {
        defaultTheme: {
          type: 'string',
          default: 'light',
          title: '默认主题'
        },
        availableThemes: {
          type: 'array',
          items: { type: 'string' },
          default: ['light', 'dark', 'auto'],
          title: '可用主题'
        },
        followSystem: {
          type: 'boolean',
          default: true,
          title: '跟随系统主题'
        }
      }
    }
  };

  private context!: PluginContext;
  private currentTheme = 'light';
  private themes = new Map<string, Theme>();
  private styleElement?: HTMLStyleElement;
  private mediaQuery?: MediaQueryList;

  async activate(context: PluginContext): Promise<void> {
    this.context = context;
    
    // 初始化内置主题
    this.initializeBuiltinThemes();
    
    // 加载用户配置
    await this.loadConfiguration();
    
    // 设置UI
    this.setupUI();
    
    // 应用主题
    await this.applyTheme(this.currentTheme);
    
    // 监听系统主题变化
    this.setupSystemThemeListener();
    
    context.logger.info('Theme plugin activated');
  }

  async deactivate(): Promise<void> {
    // 清理UI
    this.cleanupUI();
    
    // 移除样式
    if (this.styleElement) {
      this.styleElement.remove();
    }
    
    // 移除监听器
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange);
    }
    
    this.context.logger.info('Theme plugin deactivated');
  }

  /**
   * 初始化内置主题
   */
  private initializeBuiltinThemes(): void {
    // 浅色主题
    this.themes.set('light', {
      id: 'light',
      name: '浅色主题',
      description: '明亮清爽的浅色主题',
      variables: {
        '--primary-color': '#0066cc',
        '--secondary-color': '#6c757d',
        '--background-color': '#ffffff',
        '--surface-color': '#f8f9fa',
        '--text-color': '#333333',
        '--text-secondary': '#666666',
        '--border-color': '#e9ecef',
        '--shadow-color': 'rgba(0, 0, 0, 0.1)',
        '--link-color': '#0066cc',
        '--link-hover-color': '#0052a3'
      }
    });

    // 深色主题
    this.themes.set('dark', {
      id: 'dark',
      name: '深色主题',
      description: '护眼的深色主题',
      variables: {
        '--primary-color': '#66b3ff',
        '--secondary-color': '#adb5bd',
        '--background-color': '#1a202c',
        '--surface-color': '#2d3748',
        '--text-color': '#e2e8f0',
        '--text-secondary': '#a0aec0',
        '--border-color': '#4a5568',
        '--shadow-color': 'rgba(0, 0, 0, 0.3)',
        '--link-color': '#66b3ff',
        '--link-hover-color': '#4299e1'
      }
    });

    // 护眼主题
    this.themes.set('sepia', {
      id: 'sepia',
      name: '护眼主题',
      description: '温暖的护眼主题',
      variables: {
        '--primary-color': '#8b4513',
        '--secondary-color': '#a0522d',
        '--background-color': '#f4f1e8',
        '--surface-color': '#ede7d3',
        '--text-color': '#3c2415',
        '--text-secondary': '#5d4037',
        '--border-color': '#d7ccc8',
        '--shadow-color': 'rgba(139, 69, 19, 0.1)',
        '--link-color': '#8b4513',
        '--link-hover-color': '#6d3410'
      }
    });
  }

  /**
   * 加载配置
   */
  private async loadConfiguration(): Promise<void> {
    const config = this.context.config as ThemeConfig;
    
    // 加载当前主题
    const savedTheme = await this.context.storage.get('currentTheme');
    this.currentTheme = savedTheme || config.defaultTheme || 'light';
    
    // 加载自定义主题
    const customThemes = await this.context.storage.get('customThemes');
    if (customThemes) {
      for (const theme of customThemes) {
        this.themes.set(theme.id, theme);
      }
    }
  }

  /**
   * 设置UI
   */
  private setupUI(): void {
    // 添加主题切换菜单
    this.context.api.ui.addMenuItem({
      id: 'theme-switcher',
      label: '主题',
      icon: '🎨',
      action: () => this.showThemePanel(),
      submenu: [
        {
          id: 'light-theme',
          label: '浅色主题',
          action: () => this.switchTheme('light')
        },
        {
          id: 'dark-theme',
          label: '深色主题',
          action: () => this.switchTheme('dark')
        },
        {
          id: 'sepia-theme',
          label: '护眼主题',
          action: () => this.switchTheme('sepia')
        },
        {
          id: 'auto-theme',
          label: '跟随系统',
          action: () => this.switchTheme('auto')
        }
      ]
    });

    // 添加主题管理面板
    this.context.api.ui.addPanel({
      id: 'theme-panel',
      title: '主题管理',
      icon: '🎨',
      component: this.createThemePanel(),
      position: 'right'
    });
  }

  /**
   * 清理UI
   */
  private cleanupUI(): void {
    // UI清理会由插件系统自动处理
  }

  /**
   * 应用主题
   */
  private async applyTheme(themeId: string): Promise<void> {
    let targetTheme = themeId;
    
    // 处理自动主题
    if (themeId === 'auto') {
      targetTheme = this.getSystemTheme();
    }
    
    const theme = this.themes.get(targetTheme);
    if (!theme) {
      this.context.logger.warn(`Theme not found: ${targetTheme}`);
      return;
    }

    // 移除旧样式
    if (this.styleElement) {
      this.styleElement.remove();
    }

    // 创建新样式
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'minglog-theme-styles';
    
    // 生成CSS
    const css = this.generateThemeCSS(theme);
    this.styleElement.textContent = css;
    
    // 应用样式
    document.head.appendChild(this.styleElement);
    
    // 更新body类名
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim();
    document.body.classList.add(`theme-${theme.id}`);
    
    // 保存当前主题
    this.currentTheme = themeId;
    await this.context.storage.set('currentTheme', themeId);
    
    // 发送主题变化事件
    this.context.events.emit('theme-changed', {
      themeId: targetTheme,
      theme
    });
    
    this.context.logger.info(`Applied theme: ${theme.name}`);
  }

  /**
   * 切换主题
   */
  private async switchTheme(themeId: string): Promise<void> {
    await this.applyTheme(themeId);
    
    this.context.api.ui.showNotification(
      `已切换到${this.themes.get(themeId === 'auto' ? this.getSystemTheme() : themeId)?.name}`,
      'info'
    );
  }

  /**
   * 生成主题CSS
   */
  private generateThemeCSS(theme: Theme): string {
    let css = ':root {\n';
    
    // 添加CSS变量
    for (const [variable, value] of Object.entries(theme.variables)) {
      css += `  ${variable}: ${value};\n`;
    }
    
    css += '}\n';
    
    // 添加自定义CSS
    if (theme.customCSS) {
      css += '\n' + theme.customCSS;
    }
    
    return css;
  }

  /**
   * 获取系统主题
   */
  private getSystemTheme(): string {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * 设置系统主题监听器
   */
  private setupSystemThemeListener(): void {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', this.handleSystemThemeChange);
  }

  /**
   * 处理系统主题变化
   */
  private handleSystemThemeChange = async (): Promise<void> => {
    if (this.currentTheme === 'auto') {
      await this.applyTheme('auto');
    }
  };

  /**
   * 显示主题面板
   */
  private showThemePanel(): void {
    // 这里应该显示主题管理面板
    // 简化实现，直接显示通知
    this.context.api.ui.showNotification('主题面板功能开发中...', 'info');
  }

  /**
   * 创建主题面板组件
   */
  private createThemePanel(): any {
    // 这里应该返回一个React组件
    // 简化实现，返回一个占位符
    return {
      type: 'div',
      props: {
        children: '主题管理面板'
      }
    };
  }

  /**
   * 添加自定义主题
   */
  async addCustomTheme(theme: Theme): Promise<void> {
    this.themes.set(theme.id, theme);
    
    // 保存到存储
    const customThemes = Array.from(this.themes.values())
      .filter(t => !['light', 'dark', 'sepia'].includes(t.id));
    
    await this.context.storage.set('customThemes', customThemes);
    
    this.context.logger.info(`Added custom theme: ${theme.name}`);
  }

  /**
   * 删除自定义主题
   */
  async removeCustomTheme(themeId: string): Promise<void> {
    if (['light', 'dark', 'sepia'].includes(themeId)) {
      throw new Error('Cannot remove built-in theme');
    }
    
    this.themes.delete(themeId);
    
    // 如果当前使用的是被删除的主题，切换到默认主题
    if (this.currentTheme === themeId) {
      await this.switchTheme('light');
    }
    
    // 保存到存储
    const customThemes = Array.from(this.themes.values())
      .filter(t => !['light', 'dark', 'sepia'].includes(t.id));
    
    await this.context.storage.set('customThemes', customThemes);
    
    this.context.logger.info(`Removed custom theme: ${themeId}`);
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): Theme | undefined {
    const themeId = this.currentTheme === 'auto' ? this.getSystemTheme() : this.currentTheme;
    return this.themes.get(themeId);
  }

  /**
   * 获取所有主题
   */
  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }
}

// 导出插件
const themePlugin = new ThemePlugin();
export default themePlugin;
