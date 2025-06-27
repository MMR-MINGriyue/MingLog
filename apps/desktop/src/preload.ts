import { contextBridge, ipcRenderer } from 'electron';

// 定义 API 类型
interface ElectronAPI {
  platform: string;
  version: string;
  
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
  'memory-warning'
];

// 创建 Electron API
const electronAPI: ElectronAPI = {
  platform: process.platform,
  version: process.versions.electron,
  
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
