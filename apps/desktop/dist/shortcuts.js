"use strict";
/**
 * 快捷键管理模块
 * 处理全局快捷键和应用内快捷键
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortcutManager = void 0;
const electron_1 = require("electron");
const logger_1 = require("./logger");
class ShortcutManager {
    constructor(mainWindow) {
        this.shortcuts = new Map();
        this.mainWindow = null;
        this.mainWindow = mainWindow;
        this.setupDefaultShortcuts();
    }
    /**
     * 设置默认快捷键
     */
    setupDefaultShortcuts() {
        // 应用级快捷键
        this.register({
            accelerator: 'CmdOrCtrl+N',
            description: '新建页面',
            action: () => this.sendToRenderer('shortcut:new-page')
        });
        this.register({
            accelerator: 'CmdOrCtrl+S',
            description: '保存当前页面',
            action: () => this.sendToRenderer('shortcut:save-page')
        });
        this.register({
            accelerator: 'CmdOrCtrl+F',
            description: '搜索',
            action: () => this.sendToRenderer('shortcut:search')
        });
        this.register({
            accelerator: 'CmdOrCtrl+Shift+F',
            description: '全局搜索',
            action: () => this.sendToRenderer('shortcut:global-search')
        });
        this.register({
            accelerator: 'CmdOrCtrl+/',
            description: '显示快捷键帮助',
            action: () => this.showShortcutHelp()
        });
        // 编辑器快捷键
        this.register({
            accelerator: 'CmdOrCtrl+B',
            description: '粗体',
            action: () => this.sendToRenderer('shortcut:bold')
        });
        this.register({
            accelerator: 'CmdOrCtrl+I',
            description: '斜体',
            action: () => this.sendToRenderer('shortcut:italic')
        });
        this.register({
            accelerator: 'CmdOrCtrl+K',
            description: '插入链接',
            action: () => this.sendToRenderer('shortcut:link')
        });
        // 块操作快捷键
        this.register({
            accelerator: 'CmdOrCtrl+Shift+1',
            description: '转换为标题 1',
            action: () => this.sendToRenderer('shortcut:heading-1')
        });
        this.register({
            accelerator: 'CmdOrCtrl+Shift+2',
            description: '转换为标题 2',
            action: () => this.sendToRenderer('shortcut:heading-2')
        });
        this.register({
            accelerator: 'CmdOrCtrl+Shift+3',
            description: '转换为标题 3',
            action: () => this.sendToRenderer('shortcut:heading-3')
        });
        this.register({
            accelerator: 'CmdOrCtrl+Shift+Q',
            description: '转换为引用',
            action: () => this.sendToRenderer('shortcut:quote')
        });
        this.register({
            accelerator: 'CmdOrCtrl+Shift+C',
            description: '转换为代码块',
            action: () => this.sendToRenderer('shortcut:code')
        });
        // 导航快捷键
        this.register({
            accelerator: 'CmdOrCtrl+[',
            description: '返回',
            action: () => this.sendToRenderer('shortcut:back')
        });
        this.register({
            accelerator: 'CmdOrCtrl+]',
            description: '前进',
            action: () => this.sendToRenderer('shortcut:forward')
        });
        // 全局快捷键（需要应用在后台时也能工作）
        this.register({
            accelerator: 'CmdOrCtrl+Shift+Space',
            description: '快速捕获',
            action: () => this.quickCapture(),
            global: true
        });
        logger_1.logger.info('默认快捷键已设置', { count: this.shortcuts.size });
    }
    /**
     * 注册快捷键
     */
    register(config) {
        try {
            if (config.global) {
                // 注册全局快捷键
                const success = electron_1.globalShortcut.register(config.accelerator, config.action);
                if (success) {
                    this.shortcuts.set(config.accelerator, config);
                    logger_1.logger.debug('全局快捷键注册成功', {
                        accelerator: config.accelerator,
                        description: config.description
                    });
                }
                else {
                    logger_1.logger.warn('全局快捷键注册失败', {
                        accelerator: config.accelerator,
                        description: config.description
                    });
                }
            }
            else {
                // 应用内快捷键通过菜单系统处理
                this.shortcuts.set(config.accelerator, config);
                logger_1.logger.debug('应用快捷键注册成功', {
                    accelerator: config.accelerator,
                    description: config.description
                });
            }
        }
        catch (error) {
            logger_1.logger.error('快捷键注册失败', error, {
                accelerator: config.accelerator,
                description: config.description
            });
        }
    }
    /**
     * 注销快捷键
     */
    unregister(accelerator) {
        try {
            const config = this.shortcuts.get(accelerator);
            if (config?.global) {
                electron_1.globalShortcut.unregister(accelerator);
            }
            this.shortcuts.delete(accelerator);
            logger_1.logger.debug('快捷键已注销', { accelerator });
        }
        catch (error) {
            logger_1.logger.error('快捷键注销失败', error, { accelerator });
        }
    }
    /**
     * 注销所有快捷键
     */
    unregisterAll() {
        try {
            electron_1.globalShortcut.unregisterAll();
            this.shortcuts.clear();
            logger_1.logger.info('所有快捷键已注销');
        }
        catch (error) {
            logger_1.logger.error('注销所有快捷键失败', error);
        }
    }
    /**
     * 获取所有快捷键
     */
    getAll() {
        return Array.from(this.shortcuts.values());
    }
    /**
     * 发送消息到渲染进程
     */
    sendToRenderer(channel, data) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(channel, data);
        }
    }
    /**
     * 显示快捷键帮助
     */
    showShortcutHelp() {
        const shortcuts = this.getAll();
        const helpContent = shortcuts
            .map(s => `${s.accelerator}: ${s.description}`)
            .join('\n');
        this.sendToRenderer('shortcut:show-help', {
            title: '快捷键帮助',
            content: helpContent,
            shortcuts: shortcuts
        });
    }
    /**
     * 快速捕获功能
     */
    quickCapture() {
        if (this.mainWindow) {
            // 显示窗口
            this.mainWindow.show();
            this.mainWindow.focus();
            // 发送快速捕获事件
            this.sendToRenderer('shortcut:quick-capture');
            logger_1.logger.debug('快速捕获触发');
        }
    }
    /**
     * 检查快捷键是否已注册
     */
    isRegistered(accelerator) {
        return this.shortcuts.has(accelerator);
    }
    /**
     * 检查全局快捷键是否可用
     */
    isGlobalShortcutAvailable(accelerator) {
        return electron_1.globalShortcut.isRegistered(accelerator);
    }
    /**
     * 更新主窗口引用
     */
    updateMainWindow(mainWindow) {
        this.mainWindow = mainWindow;
    }
}
exports.ShortcutManager = ShortcutManager;
// 在应用退出时清理快捷键
electron_1.app.on('will-quit', () => {
    electron_1.globalShortcut.unregisterAll();
});
