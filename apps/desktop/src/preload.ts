import { contextBridge, ipcRenderer } from 'electron';

// 定义 API 类型
interface ElectronAPI {
  platform: string;
  version: string;

  // 通用调用方法
  invoke: (channel: string, ...args: any[]) => Promise<any>;

  // 基础功能
  openExternal: (url: string) => Promise<void>;
  getAppInfo: () => Promise<{
    name: string;
    version: string;
    platform: string;
    arch: string;
    nodeVersion: string;
  }>;

  // 对话框
  showMessageBox: (options: any) => Promise<any>;
  showOpenDialog: (options: any) => Promise<any>;
  showSaveDialog: (options: any) => Promise<any>;

  // 应用控制
  restartApp: () => Promise<void>;

  // 事件监听
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}

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
const electronAPI: ElectronAPI = {
  platform: process.platform,
  version: process.versions.electron,

  // 通用调用方法
  invoke: (channel: string, ...args: any[]) => {
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    } else {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
  },

  // 基础功能
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // 对话框
  showMessageBox: (options: any) => ipcRenderer.invoke('show-message-box', options),
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  
  // 应用控制
  restartApp: () => ipcRenderer.invoke('restart-app'),
  
  // 事件监听
  on: (channel: string, callback: (...args: any[]) => void) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },
  
  removeAllListeners: (channel: string) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  }
};

// 暴露 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明，供 TypeScript 使用
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
