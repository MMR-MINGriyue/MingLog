"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 验证频道名称以防止滥用
const validChannels = [
    // 菜单事件
    'menu-new-file',
    'menu-open-file',
    'menu-save-file',
    'menu-new-page',
    'menu-export',
    'menu-import',
    'menu-preferences',
    'menu-search',
    'window-focus',
    'window-blur',
    'theme-changed',
    'update-checking',
    'update-available',
    'update-not-available',
    'update-error',
    'update-download-progress',
    'update-downloaded',
    'memory-warning',
    // 存储相关
    'storage:loadWorkspace',
    'storage:saveWorkspace',
    'storage:createPage',
    'storage:updatePage',
    'storage:deletePage',
    'storage:createBackup',
    'storage:getBackupList',
    'storage:restoreBackup',
    'storage:exportMarkdown',
    'storage:importMarkdown',
    'storage:getMetadata',
    // 对话框
    'dialog:showOpenDialog',
    'dialog:showSaveDialog',
    // 文件系统
    'fs:readFile',
    'fs:writeFile',
    // 路径
    'path:getTempDir',
    // 应用信息
    'get-app-info',
    'open-external',
    'show-message-box',
    'show-open-dialog',
    'show-save-dialog',
    'restart-app'
];
// 创建 Electron API
const electronAPI = {
    platform: process.platform,
    version: process.versions.electron,
    // 通用调用方法
    invoke: (channel, ...args) => {
        if (validChannels.includes(channel)) {
            return electron_1.ipcRenderer.invoke(channel, ...args);
        }
        else {
            throw new Error(`Invalid IPC channel: ${channel}`);
        }
    },
    // 基础功能
    openExternal: (url) => electron_1.ipcRenderer.invoke('open-external', url),
    getAppInfo: () => electron_1.ipcRenderer.invoke('get-app-info'),
    // 对话框
    showMessageBox: (options) => electron_1.ipcRenderer.invoke('show-message-box', options),
    showOpenDialog: (options) => electron_1.ipcRenderer.invoke('show-open-dialog', options),
    showSaveDialog: (options) => electron_1.ipcRenderer.invoke('show-save-dialog', options),
    // 应用控制
    restartApp: () => electron_1.ipcRenderer.invoke('restart-app'),
    // 事件监听
    on: (channel, callback) => {
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.on(channel, callback);
        }
    },
    removeAllListeners: (channel) => {
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.removeAllListeners(channel);
        }
    }
};
// 暴露 API 到渲染进程
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
