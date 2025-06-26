import { contextBridge, ipcRenderer } from 'electron';

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

// Type definitions for the exposed API
declare global {
  interface Window {
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
  }
}
