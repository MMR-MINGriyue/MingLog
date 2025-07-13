/**
 * 编辑器模块工厂
 * 负责创建和配置编辑器模块实例
 */

import type { ModuleFactory, ModuleConfig } from '@minglog/core';
import { EditorModule, type EditorModuleConfig } from './EditorModule';

/**
 * 编辑器模块工厂实现
 */
export class EditorModuleFactory implements ModuleFactory {
  readonly id = 'editor';
  readonly name = '编辑器模块工厂';
  readonly version = '1.0.0';

  /**
   * 创建编辑器模块实例
   */
  async create(config: ModuleConfig): Promise<EditorModule> {
    // 验证配置
    this.validateConfig(config);

    // 创建模块实例
    const module = new EditorModule();

    return module;
  }

  /**
   * 验证模块配置
   */
  private validateConfig(config: ModuleConfig): void {
    if (!config) {
      throw new Error('编辑器模块配置不能为空');
    }

    if (config.id !== 'editor') {
      throw new Error('编辑器模块ID必须为"editor"');
    }

    // 验证编辑器特定配置
    const editorConfig = config as EditorModuleConfig;
    
    if (editorConfig.editorSettings) {
      const { editorSettings } = editorConfig;
      
      if (editorSettings.autoSaveInterval < 1000) {
        throw new Error('自动保存间隔不能小于1秒');
      }

      if (editorSettings.fontSize < 8 || editorSettings.fontSize > 72) {
        throw new Error('字体大小必须在8-72之间');
      }

      if (editorSettings.maxUndoHistory < 1 || editorSettings.maxUndoHistory > 1000) {
        throw new Error('撤销历史数量必须在1-1000之间');
      }
    }

    if (editorConfig.supportedBlockTypes && !Array.isArray(editorConfig.supportedBlockTypes)) {
      throw new Error('支持的块类型必须是数组');
    }

    if (editorConfig.shortcuts && typeof editorConfig.shortcuts !== 'object') {
      throw new Error('快捷键配置必须是对象');
    }
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig(): EditorModuleConfig {
    return {
      id: 'editor',
      name: '编辑器模块',
      version: '1.0.0',
      description: '提供富文本编辑、块编辑、双向链接等核心编辑功能',
      enabled: true,
      dependencies: [],
      settings: {},
      author: 'MingLog Team',
      category: '核心功能',
      editorSettings: {
        autoSaveInterval: 30000,
        spellCheck: true,
        syntaxHighlight: true,
        fontSize: 16,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        darkMode: false,
        enableBidirectionalLinks: true,
        enableBlockDragging: true,
        maxUndoHistory: 50
      },
      supportedBlockTypes: [
        'paragraph',
        'heading-1', 'heading-2', 'heading-3', 'heading-4', 'heading-5', 'heading-6',
        'bulleted-list', 'numbered-list', 'todo-list',
        'quote', 'code', 'divider',
        'image', 'video', 'audio', 'file',
        'table', 'callout', 'toggle', 'columns',
        'embed', 'math', 'mermaid'
      ],
      shortcuts: {
        'bold': 'Ctrl+B',
        'italic': 'Ctrl+I',
        'underline': 'Ctrl+U',
        'code': 'Ctrl+`',
        'link': 'Ctrl+K',
        'save': 'Ctrl+S',
        'undo': 'Ctrl+Z',
        'redo': 'Ctrl+Y',
        'search': 'Ctrl+F',
        'newBlock': 'Enter',
        'deleteBlock': 'Ctrl+Shift+D'
      }
    };
  }

  /**
   * 检查模块兼容性
   */
  checkCompatibility(coreVersion: string): boolean {
    // 检查与核心系统的兼容性
    const [major, minor] = coreVersion.split('.').map(Number);
    
    // 要求核心系统版本 >= 1.0.0
    return major >= 1;
  }

  /**
   * 获取模块依赖
   */
  getDependencies(): string[] {
    return []; // 编辑器模块没有依赖其他模块
  }

  /**
   * 获取模块提供的服务
   */
  getProvidedServices(): string[] {
    return [
      'editor', // 编辑器服务
      'document-manager', // 文档管理服务
      'block-editor', // 块编辑器服务
      'markdown-parser', // Markdown解析服务
      'export-service' // 导出服务
    ];
  }

  /**
   * 获取模块需要的权限
   */
  getRequiredPermissions(): string[] {
    return [
      'storage.read', // 读取存储
      'storage.write', // 写入存储
      'file.read', // 读取文件
      'file.write', // 写入文件
      'clipboard.read', // 读取剪贴板
      'clipboard.write' // 写入剪贴板
    ];
  }
}

/**
 * 导出编辑器模块工厂实例
 */
export const EditorModuleFactoryInstance = new EditorModuleFactory();
