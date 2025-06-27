/**
 * MingLog 数据存储管理器
 * 负责数据的持久化、备份和恢复
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// 数据模型定义
export interface Block {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'p' | 'quote' | 'code' | 'list' | 'image';
  content: string;
  properties?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface Page {
  id: string;
  title: string;
  blocks: Block[];
  tags: string[];
  properties: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  isJournal?: boolean;
  journalDate?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  pages: Record<string, Page>;
  settings: WorkspaceSettings;
  createdAt: number;
  updatedAt: number;
  version: string;
}

export interface WorkspaceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  fontFamily: string;
  autoSave: boolean;
  autoSaveInterval: number; // 秒
  backupEnabled: boolean;
  backupInterval: number; // 小时
  maxBackups: number;
}

export interface StorageMetadata {
  version: string;
  lastModified: number;
  totalPages: number;
  totalBlocks: number;
  dataPath: string;
}

export class StorageManager {
  private dataDir: string;
  private workspacePath: string;
  private backupDir: string;
  private currentWorkspace: Workspace | null = null;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private isDirty: boolean = false;

  constructor() {
    // 设置数据目录
    this.dataDir = path.join(app.getPath('userData'), 'MingLog');
    this.workspacePath = path.join(this.dataDir, 'workspace.json');
    this.backupDir = path.join(this.dataDir, 'backups');
    
    this.ensureDirectories();
  }

  /**
   * 确保必要的目录存在
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * 创建默认工作空间
   */
  private createDefaultWorkspace(): Workspace {
    const now = Date.now();
    return {
      id: 'default',
      name: 'MingLog 工作空间',
      description: '默认工作空间',
      pages: {
        'welcome': {
          id: 'welcome',
          title: '欢迎使用 MingLog',
          blocks: [
            {
              id: 'b1',
              type: 'h1',
              content: '欢迎使用 MingLog 桌面版',
              createdAt: now,
              updatedAt: now
            },
            {
              id: 'b2',
              type: 'p',
              content: 'MingLog 是一个现代化的知识管理工具，专注于性能、开发体验和可维护性。',
              createdAt: now,
              updatedAt: now
            },
            {
              id: 'b3',
              type: 'h2',
              content: '主要特性',
              createdAt: now,
              updatedAt: now
            },
            {
              id: 'b4',
              type: 'p',
              content: '• 基于块的编辑器系统\n• 双向链接和块引用\n• 全文搜索功能\n• 现代化的用户界面\n• 跨平台桌面应用',
              createdAt: now,
              updatedAt: now
            }
          ],
          tags: ['欢迎', '介绍'],
          properties: {},
          createdAt: now,
          updatedAt: now
        },
        'example': {
          id: 'example',
          title: '示例页面',
          blocks: [
            {
              id: 'e1',
              type: 'h1',
              content: '这是一个示例页面',
              createdAt: now,
              updatedAt: now
            },
            {
              id: 'e2',
              type: 'p',
              content: '您可以在这里编辑内容，添加新的块，或者创建新的页面。',
              createdAt: now,
              updatedAt: now
            }
          ],
          tags: ['示例'],
          properties: {},
          createdAt: now,
          updatedAt: now
        }
      },
      settings: {
        theme: 'light',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30,
        backupEnabled: true,
        backupInterval: 24,
        maxBackups: 10
      },
      createdAt: now,
      updatedAt: now,
      version: '1.0.0'
    };
  }

  /**
   * 加载工作空间
   */
  async loadWorkspace(): Promise<Workspace> {
    try {
      if (fs.existsSync(this.workspacePath)) {
        const data = fs.readFileSync(this.workspacePath, 'utf-8');
        this.currentWorkspace = JSON.parse(data);
        console.log('工作空间加载成功');
      } else {
        this.currentWorkspace = this.createDefaultWorkspace();
        await this.saveWorkspace();
        console.log('创建默认工作空间');
      }
      
      this.startAutoSave();
      return this.currentWorkspace!;
    } catch (error) {
      console.error('加载工作空间失败:', error);
      this.currentWorkspace = this.createDefaultWorkspace();
      return this.currentWorkspace;
    }
  }

  /**
   * 保存工作空间
   */
  async saveWorkspace(): Promise<void> {
    if (!this.currentWorkspace) return;

    try {
      this.currentWorkspace.updatedAt = Date.now();
      const data = JSON.stringify(this.currentWorkspace, null, 2);
      fs.writeFileSync(this.workspacePath, data, 'utf-8');
      this.isDirty = false;
      console.log('工作空间保存成功');
    } catch (error) {
      console.error('保存工作空间失败:', error);
      throw error;
    }
  }

  /**
   * 标记数据为脏数据
   */
  markDirty(): void {
    this.isDirty = true;
  }

  /**
   * 检查是否有未保存的更改
   */
  isDirtyData(): boolean {
    return this.isDirty;
  }

  /**
   * 启动自动保存
   */
  private startAutoSave(): void {
    if (!this.currentWorkspace?.settings.autoSave) return;

    const interval = this.currentWorkspace.settings.autoSaveInterval * 1000;
    this.autoSaveTimer = setInterval(async () => {
      if (this.isDirty) {
        await this.saveWorkspace();
        console.log('自动保存完成');
      }
    }, interval);
  }

  /**
   * 停止自动保存
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * 获取当前工作空间
   */
  getCurrentWorkspace(): Workspace | null {
    return this.currentWorkspace;
  }

  /**
   * 更新页面
   */
  updatePage(pageId: string, updates: Partial<Page>): void {
    if (!this.currentWorkspace) return;

    const page = this.currentWorkspace.pages[pageId];
    if (page) {
      Object.assign(page, updates, { updatedAt: Date.now() });
      this.markDirty();
    }
  }

  /**
   * 创建新页面
   */
  createPage(title: string): Page {
    if (!this.currentWorkspace) throw new Error('工作空间未初始化');

    const now = Date.now();
    const page: Page = {
      id: `page_${now}`,
      title,
      blocks: [
        {
          id: `block_${now}`,
          type: 'h1',
          content: title,
          createdAt: now,
          updatedAt: now
        },
        {
          id: `block_${now + 1}`,
          type: 'p',
          content: '',
          createdAt: now,
          updatedAt: now
        }
      ],
      tags: [],
      properties: {},
      createdAt: now,
      updatedAt: now
    };

    this.currentWorkspace.pages[page.id] = page;
    this.markDirty();
    return page;
  }

  /**
   * 删除页面
   */
  deletePage(pageId: string): void {
    if (!this.currentWorkspace) return;

    delete this.currentWorkspace.pages[pageId];
    this.markDirty();
  }

  /**
   * 获取存储元数据
   */
  getMetadata(): StorageMetadata {
    if (!this.currentWorkspace) {
      throw new Error('工作空间未初始化');
    }

    const pages = Object.values(this.currentWorkspace.pages);
    const totalBlocks = pages.reduce((sum, page) => sum + page.blocks.length, 0);

    return {
      version: this.currentWorkspace.version,
      lastModified: this.currentWorkspace.updatedAt,
      totalPages: pages.length,
      totalBlocks,
      dataPath: this.dataDir
    };
  }

  /**
   * 创建备份
   */
  async createBackup(): Promise<string> {
    if (!this.currentWorkspace) throw new Error('工作空间未初始化');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_${timestamp}.json`;
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      const data = JSON.stringify(this.currentWorkspace, null, 2);
      fs.writeFileSync(backupPath, data, 'utf-8');

      // 清理旧备份
      await this.cleanOldBackups();

      console.log(`备份创建成功: ${backupFileName}`);
      return backupPath;
    } catch (error) {
      console.error('创建备份失败:', error);
      throw error;
    }
  }

  /**
   * 清理旧备份
   */
  private async cleanOldBackups(): Promise<void> {
    if (!this.currentWorkspace) return;

    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          stat: fs.statSync(path.join(this.backupDir, file))
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

      const maxBackups = this.currentWorkspace.settings.maxBackups;
      if (files.length > maxBackups) {
        const filesToDelete = files.slice(maxBackups);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
          console.log(`删除旧备份: ${file.name}`);
        });
      }
    } catch (error) {
      console.error('清理旧备份失败:', error);
    }
  }

  /**
   * 恢复备份
   */
  async restoreBackup(backupPath: string): Promise<void> {
    try {
      const data = fs.readFileSync(backupPath, 'utf-8');
      const workspace = JSON.parse(data) as Workspace;

      // 验证数据结构
      if (!workspace.id || !workspace.pages) {
        throw new Error('无效的备份文件格式');
      }

      this.currentWorkspace = workspace;
      await this.saveWorkspace();
      console.log('备份恢复成功');
    } catch (error) {
      console.error('恢复备份失败:', error);
      throw error;
    }
  }

  /**
   * 获取备份列表
   */
  getBackupList(): Array<{ name: string; path: string; date: Date; size: number }> {
    try {
      return fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stat = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            date: stat.mtime,
            size: stat.size
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('获取备份列表失败:', error);
      return [];
    }
  }

  /**
   * 导出为 Markdown
   */
  exportToMarkdown(pageId?: string): string {
    if (!this.currentWorkspace) throw new Error('工作空间未初始化');

    if (pageId) {
      // 导出单个页面
      const page = this.currentWorkspace.pages[pageId];
      if (!page) throw new Error('页面不存在');
      return this.pageToMarkdown(page);
    } else {
      // 导出所有页面
      const pages = Object.values(this.currentWorkspace.pages);
      return pages.map(page => this.pageToMarkdown(page)).join('\n\n---\n\n');
    }
  }

  /**
   * 页面转换为 Markdown
   */
  private pageToMarkdown(page: Page): string {
    let markdown = `# ${page.title}\n\n`;

    if (page.tags.length > 0) {
      markdown += `Tags: ${page.tags.map(tag => `#${tag}`).join(' ')}\n\n`;
    }

    page.blocks.forEach(block => {
      switch (block.type) {
        case 'h1':
          markdown += `# ${block.content}\n\n`;
          break;
        case 'h2':
          markdown += `## ${block.content}\n\n`;
          break;
        case 'h3':
          markdown += `### ${block.content}\n\n`;
          break;
        case 'quote':
          markdown += `> ${block.content}\n\n`;
          break;
        case 'code':
          markdown += `\`\`\`\n${block.content}\n\`\`\`\n\n`;
          break;
        case 'list':
          const lines = block.content.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              markdown += `- ${line.trim()}\n`;
            }
          });
          markdown += '\n';
          break;
        default:
          markdown += `${block.content}\n\n`;
      }
    });

    return markdown.trim();
  }

  /**
   * 从 Markdown 导入
   */
  importFromMarkdown(markdown: string, title?: string): Page {
    if (!this.currentWorkspace) throw new Error('工作空间未初始化');

    const now = Date.now();
    const pageTitle = title || this.extractTitleFromMarkdown(markdown) || '导入的页面';
    const blocks = this.parseMarkdownToBlocks(markdown);

    const page: Page = {
      id: `imported_${now}`,
      title: pageTitle,
      blocks,
      tags: this.extractTagsFromMarkdown(markdown),
      properties: {},
      createdAt: now,
      updatedAt: now
    };

    this.currentWorkspace.pages[page.id] = page;
    this.markDirty();
    return page;
  }

  /**
   * 从 Markdown 提取标题
   */
  private extractTitleFromMarkdown(markdown: string): string | null {
    const lines = markdown.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return trimmed.substring(2).trim();
      }
    }
    return null;
  }

  /**
   * 从 Markdown 提取标签
   */
  private extractTagsFromMarkdown(markdown: string): string[] {
    const tagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match;

    while ((match = tagRegex.exec(markdown)) !== null) {
      if (!tags.includes(match[1])) {
        tags.push(match[1]);
      }
    }

    return tags;
  }

  /**
   * 解析 Markdown 为块
   */
  private parseMarkdownToBlocks(markdown: string): Block[] {
    const lines = markdown.split('\n');
    const blocks: Block[] = [];
    let currentBlock: { type: Block['type']; content: string[] } | null = null;
    let blockCounter = 0;

    const finishCurrentBlock = () => {
      if (currentBlock && currentBlock.content.length > 0) {
        const now = Date.now();
        blocks.push({
          id: `block_${now}_${blockCounter++}`,
          type: currentBlock.type,
          content: currentBlock.content.join('\n').trim(),
          createdAt: now,
          updatedAt: now
        });
      }
      currentBlock = null;
    };

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        finishCurrentBlock();
        currentBlock = { type: 'h3', content: [trimmed.substring(4)] };
      } else if (trimmed.startsWith('## ')) {
        finishCurrentBlock();
        currentBlock = { type: 'h2', content: [trimmed.substring(3)] };
      } else if (trimmed.startsWith('# ')) {
        finishCurrentBlock();
        currentBlock = { type: 'h1', content: [trimmed.substring(2)] };
      } else if (trimmed.startsWith('> ')) {
        finishCurrentBlock();
        currentBlock = { type: 'quote', content: [trimmed.substring(2)] };
      } else if (trimmed.startsWith('```')) {
        if (currentBlock?.type === 'code') {
          finishCurrentBlock();
        } else {
          finishCurrentBlock();
          currentBlock = { type: 'code', content: [] };
        }
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (currentBlock?.type !== 'list') {
          finishCurrentBlock();
          currentBlock = { type: 'list', content: [] };
        }
        currentBlock.content.push(trimmed.substring(2));
      } else if (trimmed === '') {
        if (currentBlock?.type === 'code') {
          currentBlock.content.push('');
        } else {
          finishCurrentBlock();
        }
      } else {
        if (!currentBlock || currentBlock.type === 'code') {
          if (!currentBlock) {
            currentBlock = { type: 'p', content: [] };
          }
          currentBlock.content.push(line);
        } else {
          currentBlock.content.push(line);
        }
      }
    }

    finishCurrentBlock();
    return blocks;
  }

  /**
   * 销毁存储管理器
   */
  destroy(): void {
    this.stopAutoSave();
    if (this.isDirty) {
      this.saveWorkspace();
    }
  }
}

// 导出单例实例
export const storageManager = new StorageManager();
