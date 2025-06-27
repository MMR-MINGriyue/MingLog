"use strict";
/**
 * MingLog 数据存储管理器
 * 负责数据的持久化、备份和恢复
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageManager = exports.StorageManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
class StorageManager {
    constructor() {
        this.currentWorkspace = null;
        this.autoSaveTimer = null;
        this.isDirty = false;
        // 设置数据目录
        this.dataDir = path.join(electron_1.app.getPath('userData'), 'MingLog');
        this.workspacePath = path.join(this.dataDir, 'workspace.json');
        this.backupDir = path.join(this.dataDir, 'backups');
        this.ensureDirectories();
    }
    /**
     * 确保必要的目录存在
     */
    ensureDirectories() {
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
    createDefaultWorkspace() {
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
    async loadWorkspace() {
        try {
            if (fs.existsSync(this.workspacePath)) {
                const data = fs.readFileSync(this.workspacePath, 'utf-8');
                this.currentWorkspace = JSON.parse(data);
                console.log('工作空间加载成功');
            }
            else {
                this.currentWorkspace = this.createDefaultWorkspace();
                await this.saveWorkspace();
                console.log('创建默认工作空间');
            }
            this.startAutoSave();
            return this.currentWorkspace;
        }
        catch (error) {
            console.error('加载工作空间失败:', error);
            this.currentWorkspace = this.createDefaultWorkspace();
            return this.currentWorkspace;
        }
    }
    /**
     * 保存工作空间
     */
    async saveWorkspace() {
        if (!this.currentWorkspace)
            return;
        try {
            this.currentWorkspace.updatedAt = Date.now();
            const data = JSON.stringify(this.currentWorkspace, null, 2);
            fs.writeFileSync(this.workspacePath, data, 'utf-8');
            this.isDirty = false;
            console.log('工作空间保存成功');
        }
        catch (error) {
            console.error('保存工作空间失败:', error);
            throw error;
        }
    }
    /**
     * 标记数据为脏数据
     */
    markDirty() {
        this.isDirty = true;
    }
    /**
     * 检查是否有未保存的更改
     */
    isDirtyData() {
        return this.isDirty;
    }
    /**
     * 启动自动保存
     */
    startAutoSave() {
        if (!this.currentWorkspace?.settings.autoSave)
            return;
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
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
    /**
     * 获取当前工作空间
     */
    getCurrentWorkspace() {
        return this.currentWorkspace;
    }
    /**
     * 更新页面
     */
    updatePage(pageId, updates) {
        if (!this.currentWorkspace)
            return;
        const page = this.currentWorkspace.pages[pageId];
        if (page) {
            Object.assign(page, updates, { updatedAt: Date.now() });
            this.markDirty();
        }
    }
    /**
     * 创建新页面
     */
    createPage(title) {
        if (!this.currentWorkspace)
            throw new Error('工作空间未初始化');
        const now = Date.now();
        const page = {
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
    deletePage(pageId) {
        if (!this.currentWorkspace)
            return;
        delete this.currentWorkspace.pages[pageId];
        this.markDirty();
    }
    /**
     * 获取存储元数据
     */
    getMetadata() {
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
    async createBackup() {
        if (!this.currentWorkspace)
            throw new Error('工作空间未初始化');
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
        }
        catch (error) {
            console.error('创建备份失败:', error);
            throw error;
        }
    }
    /**
     * 清理旧备份
     */
    async cleanOldBackups() {
        if (!this.currentWorkspace)
            return;
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
        }
        catch (error) {
            console.error('清理旧备份失败:', error);
        }
    }
    /**
     * 恢复备份
     */
    async restoreBackup(backupPath) {
        try {
            const data = fs.readFileSync(backupPath, 'utf-8');
            const workspace = JSON.parse(data);
            // 验证数据结构
            if (!workspace.id || !workspace.pages) {
                throw new Error('无效的备份文件格式');
            }
            this.currentWorkspace = workspace;
            await this.saveWorkspace();
            console.log('备份恢复成功');
        }
        catch (error) {
            console.error('恢复备份失败:', error);
            throw error;
        }
    }
    /**
     * 获取备份列表
     */
    getBackupList() {
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
        }
        catch (error) {
            console.error('获取备份列表失败:', error);
            return [];
        }
    }
    /**
     * 导出为 Markdown
     */
    exportToMarkdown(pageId) {
        if (!this.currentWorkspace)
            throw new Error('工作空间未初始化');
        if (pageId) {
            // 导出单个页面
            const page = this.currentWorkspace.pages[pageId];
            if (!page)
                throw new Error('页面不存在');
            return this.pageToMarkdown(page);
        }
        else {
            // 导出所有页面
            const pages = Object.values(this.currentWorkspace.pages);
            return pages.map(page => this.pageToMarkdown(page)).join('\n\n---\n\n');
        }
    }
    /**
     * 页面转换为 Markdown
     */
    pageToMarkdown(page) {
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
    importFromMarkdown(markdown, title) {
        if (!this.currentWorkspace)
            throw new Error('工作空间未初始化');
        const now = Date.now();
        const pageTitle = title || this.extractTitleFromMarkdown(markdown) || '导入的页面';
        const blocks = this.parseMarkdownToBlocks(markdown);
        const page = {
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
    extractTitleFromMarkdown(markdown) {
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
    extractTagsFromMarkdown(markdown) {
        const tagRegex = /#(\w+)/g;
        const tags = [];
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
    parseMarkdownToBlocks(markdown) {
        const lines = markdown.split('\n');
        const blocks = [];
        let currentBlock = null;
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
            }
            else if (trimmed.startsWith('## ')) {
                finishCurrentBlock();
                currentBlock = { type: 'h2', content: [trimmed.substring(3)] };
            }
            else if (trimmed.startsWith('# ')) {
                finishCurrentBlock();
                currentBlock = { type: 'h1', content: [trimmed.substring(2)] };
            }
            else if (trimmed.startsWith('> ')) {
                finishCurrentBlock();
                currentBlock = { type: 'quote', content: [trimmed.substring(2)] };
            }
            else if (trimmed.startsWith('```')) {
                if (currentBlock?.type === 'code') {
                    finishCurrentBlock();
                }
                else {
                    finishCurrentBlock();
                    currentBlock = { type: 'code', content: [] };
                }
            }
            else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                if (currentBlock?.type !== 'list') {
                    finishCurrentBlock();
                    currentBlock = { type: 'list', content: [] };
                }
                currentBlock.content.push(trimmed.substring(2));
            }
            else if (trimmed === '') {
                if (currentBlock?.type === 'code') {
                    currentBlock.content.push('');
                }
                else {
                    finishCurrentBlock();
                }
            }
            else {
                if (!currentBlock || currentBlock.type === 'code') {
                    if (!currentBlock) {
                        currentBlock = { type: 'p', content: [] };
                    }
                    currentBlock.content.push(line);
                }
                else {
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
    destroy() {
        this.stopAutoSave();
        if (this.isDirty) {
            this.saveWorkspace();
        }
    }
}
exports.StorageManager = StorageManager;
// 导出单例实例
exports.storageManager = new StorageManager();
