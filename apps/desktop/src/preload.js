/**
 * Preload script for MingLog Desktop
 * 为渲染进程提供安全的Electron API访问
 */

const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 调用主进程方法
  invoke: (channel, ...args) => {
    // 允许的IPC通道列表
    const validChannels = [
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
      'dialog:showOpenDialog',
      'dialog:showSaveDialog'
    ];

    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    } else {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
  },

  // 监听主进程事件
  on: (channel, callback) => {
    const validChannels = [
      'storage:workspaceChanged',
      'storage:autoSaved',
      'app:beforeQuit'
    ];

    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    } else {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
  },

  // 移除事件监听器
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },

  // 获取应用信息
  getAppInfo: () => {
    return {
      name: 'MingLog',
      version: '0.1.0',
      platform: process.platform
    };
  }
});

// 在窗口加载完成后通知主进程
window.addEventListener('DOMContentLoaded', () => {
  console.log('MingLog Desktop preload script loaded');
});
