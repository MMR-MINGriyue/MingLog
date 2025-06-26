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

  // 配置管理
  getConfig: (key?: string) => Promise<any>;
  setConfig: (key: string, value: any) => Promise<boolean>;

  // 性能监控
  getPerformance: () => Promise<{
    summary: {
      averageMemory: number;
      peakMemory: number;
      uptime: number;
      windowCount: number;
    };
    resources: {
      memory: {
        used: number;
        total: number;
        percentage: number;
      };
      cpu: {
        user: number;
        system: number;
      };
    };
  }>;

  // 对话框
  showMessageBox: (options: {
    type?: 'none' | 'info' | 'error' | 'question' | 'warning';
    title?: string;
    message: string;
    detail?: string;
    buttons?: string[];
    defaultId?: number;
    cancelId?: number;
  }) => Promise<{ response: number; checkboxChecked: boolean }>;

  showErrorBox: (title: string, content: string) => Promise<void>;

  // 应用控制
  restartApp: () => Promise<void>;

  // 日志和调试
  getLogFile: () => Promise<string>;
  generatePerformanceReport: () => Promise<string>;
}

// Expose enhanced API for the renderer process
const electronAPI: ElectronAPI = {
  platform: process.platform,
  version: process.versions.electron,

  // 基础功能
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // 配置管理
  getConfig: (key?: string) => ipcRenderer.invoke('get-config', key),
  setConfig: (key: string, value: any) => ipcRenderer.invoke('set-config', key, value),

  // 性能监控
  getPerformance: () => ipcRenderer.invoke('get-performance'),

  // 对话框
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showErrorBox: (title: string, content: string) => ipcRenderer.invoke('show-error-box', title, content),

  // 应用控制
  restartApp: () => ipcRenderer.invoke('restart-app'),

  // 日志和调试
  getLogFile: () => ipcRenderer.invoke('get-log-file'),
  generatePerformanceReport: () => ipcRenderer.invoke('generate-performance-report')
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明，供 TypeScript 使用
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
