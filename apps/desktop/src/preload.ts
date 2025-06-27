import { contextBridge, ipcRenderer } from 'electron';

<<<<<<< HEAD
// 定义 API 类型
interface ElectronAPI {
  platform: string;
  version: string;
=======
// Validate channel names to prevent abuse
const validChannels = [
  'menu-new-page',
  'menu-export',
  'menu-import',
  'menu-preferences',
  'menu-search',
  'theme-changed',
  'window-focus',
  'window-blur',
  'update-checking',
  'update-available',
  'update-not-available',
  'update-error',
  'update-download-progress',
  'update-downloaded'
];

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app-version'),
  getPlatform: () => process.platform,
  isPackaged: () => process.env.NODE_ENV === 'production',

  // File operations
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),

  // Window operations
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // Theme operations
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme: 'light' | 'dark' | 'system') => ipcRenderer.invoke('set-theme', theme),

  // Update operations
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),

  // Settings operations
  getUserPreferences: () => ipcRenderer.invoke('get-user-preferences'),
  setUserPreferences: (preferences: any) => ipcRenderer.invoke('set-user-preferences', preferences),
  getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
  setAppSettings: (settings: any) => ipcRenderer.invoke('set-app-settings', settings),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),
  exportSettings: () => ipcRenderer.invoke('export-settings'),
  importSettings: (settings: any) => ipcRenderer.invoke('import-settings', settings),

  // Menu events
  onMenuNewPage: (callback: () => void) => {
    ipcRenderer.on('menu-new-page', callback);
  },
  onMenuExport: (callback: () => void) => {
    ipcRenderer.on('menu-export', callback);
  },
  onMenuImport: (callback: () => void) => {
    ipcRenderer.on('menu-import', callback);
  },
  onMenuPreferences: (callback: () => void) => {
    ipcRenderer.on('menu-preferences', callback);
  },
  onMenuSearch: (callback: () => void) => {
    ipcRenderer.on('menu-search', callback);
  },

  // Theme events
  onThemeChanged: (callback: (theme: string) => void) => {
    ipcRenderer.on('theme-changed', (_, theme) => callback(theme));
  },

  // Window events
  onWindowFocus: (callback: () => void) => {
    ipcRenderer.on('window-focus', callback);
  },
  onWindowBlur: (callback: () => void) => {
    ipcRenderer.on('window-blur', callback);
  },

  // Update events
  onUpdateChecking: (callback: () => void) => {
    ipcRenderer.on('update-checking', callback);
  },
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_, info) => callback(info));
  },
  onUpdateNotAvailable: (callback: () => void) => {
    ipcRenderer.on('update-not-available', callback);
  },
  onUpdateError: (callback: (error: string) => void) => {
    ipcRenderer.on('update-error', (_, error) => callback(error));
  },
  onUpdateDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('update-download-progress', (_, progress) => callback(progress));
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_, info) => callback(info));
  },

  // Remove listeners (with validation)
  removeAllListeners: (channel: string) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  }
});
>>>>>>> c58be023006b5fbf54a414bc9766eb5463a22469

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
<<<<<<< HEAD
    electronAPI: ElectronAPI;
=======
    electronAPI: {
      // App info
      getVersion: () => Promise<string>;
      getPlatform: () => string;
      isPackaged: () => boolean;

      // File operations
      showSaveDialog: () => Promise<Electron.SaveDialogReturnValue>;
      showOpenDialog: () => Promise<Electron.OpenDialogReturnValue>;

      // Window operations
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;

      // Theme operations
      getTheme: () => Promise<string>;
      setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;

      // Update operations
      checkForUpdates: () => Promise<void>;
      installUpdate: () => Promise<void>;

      // Settings operations
      getUserPreferences: () => Promise<any>;
      setUserPreferences: (preferences: any) => Promise<any>;
      getAppSettings: () => Promise<any>;
      setAppSettings: (settings: any) => Promise<any>;
      resetSettings: () => Promise<any>;
      exportSettings: () => Promise<any>;
      importSettings: (settings: any) => Promise<any>;

      // Menu events
      onMenuNewPage: (callback: () => void) => void;
      onMenuExport: (callback: () => void) => void;
      onMenuImport: (callback: () => void) => void;
      onMenuPreferences: (callback: () => void) => void;
      onMenuSearch: (callback: () => void) => void;

      // Theme events
      onThemeChanged: (callback: (theme: string) => void) => void;

      // Window events
      onWindowFocus: (callback: () => void) => void;
      onWindowBlur: (callback: () => void) => void;

      // Update events
      onUpdateChecking: (callback: () => void) => void;
      onUpdateAvailable: (callback: (info: any) => void) => void;
      onUpdateNotAvailable: (callback: () => void) => void;
      onUpdateError: (callback: (error: string) => void) => void;
      onUpdateDownloadProgress: (callback: (progress: any) => void) => void;
      onUpdateDownloaded: (callback: (info: any) => void) => void;

      // Utility
      removeAllListeners: (channel: string) => void;
    };
>>>>>>> c58be023006b5fbf54a414bc9766eb5463a22469
  }
}
