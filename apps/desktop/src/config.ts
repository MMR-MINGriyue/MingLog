/**
 * 应用配置管理
 * 处理用户设置、窗口状态等配置信息
 */

import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { logger } from './logger';

export interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized: boolean;
  isFullScreen: boolean;
}

export interface AppConfig {
  // 窗口设置
  windowState: WindowState;
  
  // 应用设置
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  autoUpdate: boolean;
  startMinimized: boolean;
  
  // 编辑器设置
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  
  // 开发设置
  devTools: boolean;
  debugMode: boolean;
}

export class ConfigManager {
  private configPath: string;
  private config: AppConfig;
  private defaultConfig: AppConfig;

  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'config.json');
    
    this.defaultConfig = {
      windowState: {
        width: 1200,
        height: 800,
        isMaximized: false,
        isFullScreen: false
      },
      theme: 'system',
      language: 'zh-CN',
      autoUpdate: true,
      startMinimized: false,
      fontSize: 14,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: 1.6,
      devTools: process.env.NODE_ENV === 'development',
      debugMode: process.env.NODE_ENV === 'development'
    };

    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf-8');
        const parsedConfig = JSON.parse(configData);
        
        // 合并默认配置和用户配置
        const config = { ...this.defaultConfig, ...parsedConfig };
        
        // 确保窗口状态的完整性
        config.windowState = { ...this.defaultConfig.windowState, ...parsedConfig.windowState };
        
        logger.info('配置文件加载成功', { path: this.configPath });
        return config;
      }
    } catch (error) {
      logger.error('加载配置文件失败，使用默认配置', error as Error, { path: this.configPath });
    }

    return { ...this.defaultConfig };
  }

  private saveConfig(): void {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      logger.debug('配置文件保存成功', { path: this.configPath });
    } catch (error) {
      logger.error('保存配置文件失败', error as Error, { path: this.configPath });
    }
  }

  // 获取配置
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  // 设置配置
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
    this.saveConfig();
    logger.debug('配置已更新', { key, value });
  }

  // 获取完整配置
  getAll(): AppConfig {
    return { ...this.config };
  }

  // 重置为默认配置
  reset(): void {
    this.config = { ...this.defaultConfig };
    this.saveConfig();
    logger.info('配置已重置为默认值');
  }

  // 窗口状态管理
  getWindowState(): WindowState {
    return { ...this.config.windowState };
  }

  setWindowState(state: Partial<WindowState>): void {
    this.config.windowState = { ...this.config.windowState, ...state };
    this.saveConfig();
  }

  // 主题管理
  getTheme(): 'light' | 'dark' | 'system' {
    return this.config.theme;
  }

  setTheme(theme: 'light' | 'dark' | 'system'): void {
    this.set('theme', theme);
  }

  // 语言管理
  getLanguage(): 'zh-CN' | 'en-US' {
    return this.config.language;
  }

  setLanguage(language: 'zh-CN' | 'en-US'): void {
    this.set('language', language);
  }

  // 编辑器设置
  getEditorConfig() {
    return {
      fontSize: this.config.fontSize,
      fontFamily: this.config.fontFamily,
      lineHeight: this.config.lineHeight
    };
  }

  setEditorConfig(config: Partial<{ fontSize: number; fontFamily: string; lineHeight: number }>): void {
    if (config.fontSize !== undefined) this.set('fontSize', config.fontSize);
    if (config.fontFamily !== undefined) this.set('fontFamily', config.fontFamily);
    if (config.lineHeight !== undefined) this.set('lineHeight', config.lineHeight);
  }

  // 开发设置
  isDevelopment(): boolean {
    return this.config.debugMode || process.env.NODE_ENV === 'development';
  }

  shouldShowDevTools(): boolean {
    return this.config.devTools;
  }

  // 导出配置（用于备份）
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  // 导入配置（用于恢复）
  importConfig(configJson: string): boolean {
    try {
      const importedConfig = JSON.parse(configJson);
      
      // 验证配置格式
      if (typeof importedConfig === 'object' && importedConfig !== null) {
        this.config = { ...this.defaultConfig, ...importedConfig };
        this.saveConfig();
        logger.info('配置导入成功');
        return true;
      }
    } catch (error) {
      logger.error('配置导入失败', error as Error);
    }
    
    return false;
  }
}

// 创建全局配置管理实例
export const configManager = new ConfigManager();
