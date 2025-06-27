<<<<<<< HEAD
import { app, BrowserWindow, Menu, shell, dialog, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import { logger } from './logger';
import { configManager } from './config';
import { performanceMonitor } from './performance';
import { ShortcutManager } from './shortcuts';

// 应用配置
const APP_CONFIG = {
  name: 'MingLog',
  version: app.getVersion(),
  minWidth: 800,
  minHeight: 600,
  defaultWidth: 1200,
  defaultHeight: 800
};

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let shortcutManager: ShortcutManager | null = null;

/**
 * 创建启动画面
 */
=======
const { app, BrowserWindow, Menu, shell, ipcMain, dialog, screen: electronScreen, nativeTheme, Tray } = require('electron');
// const { autoUpdater } = require('electron-updater');
// const Store = require('electron-store');
const path = require('path');
const fs = require('fs');

// Keep a global reference of the window object and tray
let mainWindow: typeof BrowserWindow | null = null;
let splashWindow: typeof BrowserWindow | null = null;
let tray: typeof Tray | null = null;

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Initialize electron-store
interface StoreSchema {
  windowState: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    isMaximized: boolean;
  };
  userPreferences: {
    theme: 'light' | 'dark' | 'system';
    fontSize: number;
    sidebarWidth: number;
    autoSave: boolean;
    showLineNumbers: boolean;
    enableSpellCheck: boolean;
  };
  appSettings: {
    autoUpdate: boolean;
    minimizeToTray: boolean;
    startMinimized: boolean;
    openAtLogin: boolean;
  };
}

/*
const store = new Store({
  defaults: {
    windowState: {
      width: 1200,
      height: 800,
      isMaximized: false
    },
    userPreferences: {
      theme: 'system',
      fontSize: 14,
      sidebarWidth: 280,
      autoSave: true,
      showLineNumbers: true,
      enableSpellCheck: true
    },
    appSettings: {
      autoUpdate: true,
      minimizeToTray: true,
      startMinimized: false,
      openAtLogin: false
    }
  }
});
*/

// Window state management
// let windowState = store.get('windowState');
let windowState = {
  width: 1200,
  height: 800,
  isMaximized: false
};

// Enable live reload for Electron in development
if (isDevelopment) {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (error) {
    console.warn('electron-reload not available:', error);
  }
}

// Save window state
function saveWindowState(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const bounds = mainWindow.getBounds();
  const newWindowState = {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    isMaximized: mainWindow.isMaximized()
  };

  windowState = newWindowState;
  store.set('windowState', newWindowState);
}

// Load window state from persistent storage
function loadWindowState(): void {
  windowState = store.get('windowState');
}

// Create splash screen
>>>>>>> c58be023006b5fbf54a414bc9766eb5463a22469
function createSplashWindow(): void {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
<<<<<<< HEAD
=======
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    show: false
  });

  const splashPath = path.join(__dirname, '..', 'assets', 'splash.html');
  splashWindow.loadFile(splashPath);

  splashWindow.once('ready-to-show', () => {
    splashWindow?.show();
  });

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

// Close splash screen
function closeSplashWindow(): void {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}

// Create system tray
function createTray(): void {
  const trayIconPath = path.join(__dirname, '..', 'assets',
    process.platform === 'win32' ? 'tray-icon.ico' : 'tray-icon.png'
  );

  tray = new Tray(trayIconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show MingLog',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'New Page',
      accelerator: 'CmdOrCtrl+N',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('menu-new-page');
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Preferences',
      accelerator: 'CmdOrCtrl+,',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('menu-preferences');
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit MingLog',
      accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('MingLog - Knowledge Management Tool');

  // Handle tray click
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      createWindow();
    }
  });

  // Handle double-click on tray (Windows/Linux)
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
>>>>>>> c58be023006b5fbf54a414bc9766eb5463a22469
    }
  });

  // 加载启动画面
  const splashHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: white;
          border-radius: 12px;
          overflow: hidden;
        }
        .logo {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 16px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .subtitle {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 24px;
        }
        .loading {
          width: 200px;
          height: 4px;
          background: rgba(255,255,255,0.3);
          border-radius: 2px;
          overflow: hidden;
        }
        .loading-bar {
          height: 100%;
          background: white;
          border-radius: 2px;
          animation: loading 2s ease-in-out infinite;
        }
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .version {
          position: absolute;
          bottom: 16px;
          font-size: 12px;
          opacity: 0.7;
        }
      </style>
    </head>
    <body>
      <div class="logo">M</div>
      <div class="subtitle">MingLog</div>
      <div class="loading">
        <div class="loading-bar"></div>
      </div>
      <div class="version">v${APP_CONFIG.version}</div>
    </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);

  // 3秒后关闭启动画面
  setTimeout(() => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
  }, 3000);
}

<<<<<<< HEAD
/**
 * 创建主窗口
 */
function createMainWindow(): void {
  logger.info('开始创建主窗口');

  // 获取保存的窗口状态
  const windowState = configManager.getWindowState();

  // Create the browser window
  mainWindow = new BrowserWindow({
=======
function createWindow(): void {
  // Get primary display dimensions
  const primaryDisplay = electronScreen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Restore window state or use defaults
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
>>>>>>> c58be023006b5fbf54a414bc9766eb5463a22469
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
<<<<<<< HEAD
    minWidth: APP_CONFIG.minWidth,
    minHeight: APP_CONFIG.minHeight,
    show: false, // 先不显示，等加载完成后再显示
    icon: path.join(__dirname, '../assets/icon.ico'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev
    }
  });

  // 恢复窗口状态
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }
  if (windowState.isFullScreen) {
    mainWindow.setFullScreen(true);
  }

  // 加载应用内容
  if (isDev) {
    // 开发环境：尝试连接到开发服务器
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      // 如果开发服务器未启动，加载本地编辑器
      loadEditorPage();
    });

    // 开发环境下打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境：加载编辑器页面
    loadEditorPage();
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      logger.info('主窗口显示完成');

      // 关闭启动画面
      if (splashWindow) {
        splashWindow.close();
        splashWindow = null;
      }
    }
  });

  // 保存窗口状态
  const saveWindowState = () => {
    if (!mainWindow) return;

    const bounds = mainWindow.getBounds();
    configManager.setWindowState({
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: mainWindow.isMaximized(),
      isFullScreen: mainWindow.isFullScreen()
    });
  };

  // 监听窗口状态变化
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('maximize', saveWindowState);
  mainWindow.on('unmaximize', saveWindowState);
  mainWindow.on('enter-full-screen', saveWindowState);
  mainWindow.on('leave-full-screen', saveWindowState);

  // Handle window closed
=======
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // enableRemoteModule: false, // Deprecated in newer Electron versions
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1a1a1a' : '#ffffff',
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    frame: true,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closable: true
  };

  // Ensure window fits on screen
  if (windowState.x && windowState.y) {
    if (windowState.x + windowState.width > screenWidth) {
      windowOptions.x = screenWidth - windowState.width;
    }
    if (windowState.y + windowState.height > screenHeight) {
      windowOptions.y = screenHeight - windowState.height;
    }
  }

  // Create the browser window
  mainWindow = new BrowserWindow(windowOptions);

  // Load the app with optimizations
  if (isDevelopment) {
    // In development, load from the dev server
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development (delayed to improve startup)
    mainWindow.webContents.once('dom-ready', () => {
      if (process.env.OPEN_DEVTOOLS === 'true') {
        mainWindow?.webContents.openDevTools();
      }
    });
  } else {
    // In production, load from the built web app
    const webPath = path.join(__dirname, '..', 'resources', 'web', 'index.html');
    mainWindow.loadFile(webPath);
  }

  // Optimize resource loading
  mainWindow.webContents.on('dom-ready', () => {
    // Inject performance optimizations
    mainWindow?.webContents.executeJavaScript(`
      // Preload critical resources
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          // Preload fonts and critical assets
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'font';
          link.type = 'font/woff2';
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        });
      }
    `);
  });

  // Restore maximized state
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Show window when ready with performance optimizations
  mainWindow.once('ready-to-show', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    // Close splash screen
    closeSplashWindow();

    // Show and focus window
    mainWindow.show();
    mainWindow.focus();

    // Defer non-critical operations to improve perceived startup time
    setTimeout(() => {
      // Check for updates in production (deferred)
      // if (isProduction && mainWindow && !mainWindow.isDestroyed()) {
      //   autoUpdater.checkForUpdatesAndNotify();
      // }

      // Preload commonly used dialogs
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`
          // Warm up the renderer process
          if (window.performance && window.performance.mark) {
            window.performance.mark('app-ready');
          }
        `);
      }
    }, 1000);
  });

  // Save window state on resize/move
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('maximize', () => {
    windowState.isMaximized = true;
  });
  mainWindow.on('unmaximize', () => {
    windowState.isMaximized = false;
    saveWindowState();
  });

  // Handle window events
>>>>>>> c58be023006b5fbf54a414bc9766eb5463a22469
  mainWindow.on('closed', () => {
    logger.info('主窗口已关闭');
    mainWindow = null;
  });

<<<<<<< HEAD
  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    logger.debug('打开外部链接', { url });
=======
  mainWindow.on('focus', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-focus');
    }
  });

  mainWindow.on('blur', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-blur');
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
>>>>>>> c58be023006b5fbf54a414bc9766eb5463a22469
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 监听页面加载事件
  mainWindow.webContents.on('did-finish-load', () => {
    logger.info('页面加载完成');

    // 页面加载完成后初始化快捷键
    if (!shortcutManager) {
      shortcutManager = new ShortcutManager(mainWindow!);
      logger.info('快捷键管理器已初始化');
    }
  });

  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    logger.error('页面加载失败', new Error(errorDescription), { errorCode });
  });
}

<<<<<<< HEAD
/**
 * 加载编辑器页面
 */
function loadEditorPage(): void {
  if (!mainWindow) return;

  const editorPath = path.join(__dirname, 'editor.html');
  mainWindow.loadFile(editorPath);
  logger.info('加载编辑器页面', { path: editorPath });
}


=======
// Optimize app startup
app.commandLine.appendSwitch('--disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('--disable-web-security');
app.commandLine.appendSwitch('--enable-features', 'VaapiVideoDecoder');

// App event handlers
app.whenReady().then(async () => {
  // Performance: Load window state first
  loadWindowState();

  // Apply saved settings
  const userPrefs = store.get('userPreferences');
  const appSettings = store.get('appSettings');

  // Apply theme setting
  nativeTheme.themeSource = userPrefs.theme;

  // Apply login item setting
  app.setLoginItemSettings({
    openAtLogin: appSettings.openAtLogin,
    openAsHidden: false
  });

  // Set app user model ID for Windows (early)
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.minglog.desktop');
  }

  // Create splash screen first for immediate feedback
  createSplashWindow();

  // Create main window (hidden initially)
  createWindow();

  // Defer menu and tray creation to improve startup time
  process.nextTick(() => {
    createMenu();
    if (appSettings.minimizeToTray) {
      createTray();
    }
  });

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  // Save window state before closing
  saveWindowState();

  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Save window state before quitting
  saveWindowState();

  // Clean up resources
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

// Memory management
app.on('window-all-closed', () => {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

// Handle memory warnings
app.on('gpu-info-update', async () => {
  // Monitor GPU memory usage
  if (mainWindow && !mainWindow.isDestroyed()) {
    const memoryInfo = await process.getProcessMemoryInfo();
    if (memoryInfo.private > 200 * 1024 * 1024) { // 200MB threshold
      console.warn('High memory usage detected:', memoryInfo);
      // Optionally notify renderer to clean up
      mainWindow.webContents.send('memory-warning', memoryInfo);
    }
  }
});

// Security: Prevent navigation to external websites
app.on('web-contents-created', (_event: any, contents: any) => {
  // Prevent navigation to external URLs
  contents.on('will-navigate', (event: any, navigationUrl: string) => {
    try {
      const parsedUrl = new URL(navigationUrl);

      // Allow localhost in development and file:// in production
      const allowedOrigins = isDevelopment
        ? ['http://localhost:3000', 'http://127.0.0.1:3000']
        : [];

      if (!allowedOrigins.includes(parsedUrl.origin) && !navigationUrl.startsWith('file://')) {
        event.preventDefault();
        console.warn('Blocked navigation to:', navigationUrl);
      }
    } catch (error) {
      // Invalid URL, block it
      event.preventDefault();
      console.warn('Blocked invalid URL:', navigationUrl);
    }
  });

  // Prevent opening new windows
  contents.setWindowOpenHandler(({ url }: { url: string }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});
>>>>>>> c58be023006b5fbf54a414bc9766eb5463a22469

/**
 * 创建应用菜单
 */
function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'MingLog',
      submenu: [
        {
<<<<<<< HEAD
          label: '关于 MingLog',
=======
          label: 'New Page',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-new-page');
          }
        },
        { type: 'separator' },
        {
          label: 'Export',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow?.webContents.send('menu-export');
          }
        },
        {
          label: 'Import',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow?.webContents.send('menu-import');
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow?.webContents.send('menu-preferences');
          }
        },
        { type: 'separator' },
        {
          role: 'quit'
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Search',
          accelerator: 'CmdOrCtrl+K',
          click: () => {
            mainWindow?.webContents.send('menu-search');
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'About MingLog',
>>>>>>> c58be023006b5fbf54a414bc9766eb5463a22469
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '关于 MingLog',
              message: 'MingLog',
              detail: `版本: ${APP_CONFIG.version}\n现代化知识管理工具\n\n© 2025 MingLog Team`,
              buttons: ['确定']
            });
          }
        },
        { type: 'separator' },
        {
          label: '检查更新',
          click: () => {
            autoUpdater.checkForUpdatesAndNotify();
          }
        },
        { type: 'separator' },
        { role: 'quit', label: '退出' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'close', label: '关闭' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '用户指南',
          click: () => {
            shell.openExternal('https://github.com/MMR-MINGriyue/MingLog#readme');
          }
        },
        {
          label: '报告问题',
          click: () => {
            shell.openExternal('https://github.com/MMR-MINGriyue/MingLog/issues');
          }
        },
        { type: 'separator' },
        {
          label: '访问 GitHub',
          click: () => {
            shell.openExternal('https://github.com/MMR-MINGriyue/MingLog');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

<<<<<<< HEAD
/**
 * 设置自动更新
 */
function setupAutoUpdater(): void {
  if (isDev) return;

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: '更新可用',
      message: '发现新版本',
      detail: '新版本正在下载中，下载完成后将自动安装。',
      buttons: ['确定']
    });
=======
// Auto-updater configuration
// if (isProduction) {
//   autoUpdater.checkForUpdatesAndNotify();

//   // Check for updates every hour
//   setInterval(() => {
//     autoUpdater.checkForUpdatesAndNotify();
//   }, 60 * 60 * 1000);
// }

// Auto-updater events (temporarily disabled)
/*
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-checking');
  }
});

autoUpdater.on('update-available', (info: any) => {
  console.log('Update available:', info.version);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-available', info);
  }

  // Show notification to user
  dialog.showMessageBox(mainWindow!, {
    type: 'info',
    title: 'Update Available',
    message: `A new version (${info.version}) is available and will be downloaded in the background.`,
    buttons: ['OK']
  });
});

autoUpdater.on('update-not-available', (_info: any) => {
  console.log('Update not available.');
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-not-available');
  }
});

autoUpdater.on('error', (err: any) => {
  console.error('Error in auto-updater:', err);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-error', err.message);
  }
});

autoUpdater.on('download-progress', (progressObj: any) => {
  const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${Math.round(progressObj.percent)}% (${progressObj.transferred}/${progressObj.total})`;
  console.log(logMessage);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-download-progress', {
      percent: Math.round(progressObj.percent),
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond
    });
  }
});

autoUpdater.on('update-downloaded', (info: any) => {
  console.log('Update downloaded:', info.version);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-downloaded', info);
  }

  // Ask user if they want to restart now
  const response = dialog.showMessageBoxSync(mainWindow!, {
    type: 'info',
    title: 'Update Ready',
    message: `Update ${info.version} has been downloaded and is ready to install.`,
    detail: 'The application will restart to apply the update.',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0,
    cancelId: 1
  });

  if (response === 0) {
    // User chose to restart now
    autoUpdater.quitAndInstall();
  }
});
*/

// IPC handlers
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async () => {
  if (!mainWindow) return { canceled: true };

  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'Markdown Files', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
>>>>>>> c58be023006b5fbf54a414bc9766eb5463a22469
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: '更新已下载',
      message: '更新已下载完成',
      detail: '应用将重启以应用更新。',
      buttons: ['立即重启', '稍后重启']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}

/**
 * 设置 IPC 处理程序
 */
function setupIPC(): void {
  logger.info('设置 IPC 处理程序');

  // 处理外部链接打开
  ipcMain.handle('open-external', async (_, url: string) => {
    logger.debug('IPC: 打开外部链接', { url });
    await shell.openExternal(url);
  });

  // 获取应用信息
  ipcMain.handle('get-app-info', () => {
    const info = {
      name: APP_CONFIG.name,
      version: APP_CONFIG.version,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    };
    logger.debug('IPC: 获取应用信息', info);
    return info;
  });

  // 获取配置
  ipcMain.handle('get-config', (_, key?: string) => {
    if (key) {
      return configManager.get(key as any);
    }
    return configManager.getAll();
  });

  // 设置配置
  ipcMain.handle('set-config', (_, key: string, value: any) => {
    logger.debug('IPC: 设置配置', { key, value });
    configManager.set(key as any, value);
    return true;
  });

  // 获取性能信息
  ipcMain.handle('get-performance', () => {
    const summary = performanceMonitor.getPerformanceSummary();
    const resources = performanceMonitor.checkSystemResources();
    logger.debug('IPC: 获取性能信息', { summary, resources });
    return { summary, resources };
  });

  // 显示消息框
  ipcMain.handle('show-message-box', async (_, options: Electron.MessageBoxOptions) => {
    if (mainWindow) {
      const result = await dialog.showMessageBox(mainWindow, options);
      logger.debug('IPC: 显示消息框', { options, result });
      return result;
    }
    return { response: 0, checkboxChecked: false };
  });

  // 显示错误对话框
  ipcMain.handle('show-error-box', (_, title: string, content: string) => {
    logger.error('IPC: 显示错误对话框', new Error(content), { title });
    dialog.showErrorBox(title, content);
  });

  // 重启应用
  ipcMain.handle('restart-app', () => {
    logger.info('IPC: 重启应用');
    app.relaunch();
    app.exit();
  });

  // 获取日志文件路径
  ipcMain.handle('get-log-file', () => {
    const logFile = logger.getLogFile();
    logger.debug('IPC: 获取日志文件路径', { logFile });
    return logFile;
  });

  // 生成性能报告
  ipcMain.handle('generate-performance-report', () => {
    const report = performanceMonitor.generateReport();
    logger.debug('IPC: 生成性能报告');
    return report;
  });
}

// App event handlers
app.whenReady().then(async () => {
  try {
    logger.info('应用启动开始', {
      version: APP_CONFIG.version,
      platform: process.platform,
      arch: process.arch
    });

    // 创建启动画面
    createSplashWindow();

    // 延迟创建主窗口，让启动画面先显示
    setTimeout(() => {
      performanceMonitor.measureTime('主窗口创建', () => {
        createMainWindow();
        createMenu();
        setupAutoUpdater();
        setupIPC();
      });
    }, 1000);

    app.on('activate', () => {
      logger.debug('应用激活事件');
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });

  } catch (error) {
    logger.error('应用启动失败', error as Error);
    dialog.showErrorBox('启动错误', `应用启动失败：\n${(error as Error).message}`);
    app.quit();
  }
});

<<<<<<< HEAD
app.on('window-all-closed', () => {
  logger.info('所有窗口已关闭');
  if (process.platform !== 'darwin') {
    // 保存最终状态
    performanceMonitor.stop();
    logger.info('应用退出');
    app.quit();
  }
});

app.on('before-quit', () => {
  logger.info('应用准备退出');
});

app.on('will-quit', () => {
  logger.info('应用即将退出');
});

// 处理应用启动时的错误
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', error);

  if (mainWindow && !mainWindow.isDestroyed()) {
    dialog.showErrorBox('应用错误', `发生未处理的错误：\n${error.message}\n\n请查看日志文件获取详细信息。`);
  }

  // 不要立即退出，让用户有机会保存数据
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝', new Error(String(reason)), { promise });
});

// 安全设置
app.on('web-contents-created', (_, contents) => {
  logger.debug('Web 内容创建', { id: contents.id });

  // 使用新的 API 处理新窗口
  contents.setWindowOpenHandler(({ url }) => {
    logger.debug('阻止新窗口打开，使用外部浏览器', { url });
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 阻止导航到外部 URL
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (parsedUrl.origin !== 'http://localhost:3000' &&
        parsedUrl.protocol !== 'data:' &&
        parsedUrl.protocol !== 'file:') {
      event.preventDefault();
      logger.debug('阻止导航到外部 URL', { url: navigationUrl });
      shell.openExternal(navigationUrl);
    }
  });
});

// 设置应用安全策略
app.on('certificate-error', (event, _, url, error, __, callback) => {
  if (isDev) {
    // 开发环境下忽略证书错误
    event.preventDefault();
    callback(true);
  } else {
    // 生产环境下记录证书错误
    logger.error('证书错误', new Error(error), { url });
    callback(false);
  }
=======
ipcMain.handle('show-open-dialog', async () => {
  if (!mainWindow) return { canceled: true };

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'Markdown Files', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
>>>>>>> c58be023006b5fbf54a414bc9766eb5463a22469
});

// Window control handlers
ipcMain.handle('minimize-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});

// Theme handlers
ipcMain.handle('get-theme', () => {
  return nativeTheme.themeSource;
});

ipcMain.handle('set-theme', (_: any, theme: 'light' | 'dark' | 'system') => {
  nativeTheme.themeSource = theme;

  // Notify renderer of theme change
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  }
});

// Update handlers (temporarily disabled)
/*
ipcMain.handle('check-for-updates', () => {
  if (isProduction) {
    autoUpdater.checkForUpdatesAndNotify();
  } else {
    console.log('Update check skipped in development mode');
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});
*/

// Settings handlers
ipcMain.handle('get-user-preferences', () => {
  return store.get('userPreferences');
});

ipcMain.handle('set-user-preferences', (_: any, preferences: any) => {
  const currentPrefs = store.get('userPreferences');
  const newPrefs = { ...currentPrefs, ...preferences };
  store.set('userPreferences', newPrefs);

  // Apply theme change immediately
  if (preferences.theme) {
    nativeTheme.themeSource = preferences.theme;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
    }
  }

  return newPrefs;
});

ipcMain.handle('get-app-settings', () => {
  return store.get('appSettings');
});

ipcMain.handle('set-app-settings', (_: any, settings: any) => {
  const currentSettings = store.get('appSettings');
  const newSettings = { ...currentSettings, ...settings };
  store.set('appSettings', newSettings);

  // Apply settings immediately
  if (settings.openAtLogin !== undefined) {
    app.setLoginItemSettings({
      openAtLogin: settings.openAtLogin,
      openAsHidden: false
    });
  }

  return newSettings;
});

ipcMain.handle('reset-settings', () => {
  store.clear();
  return {
    userPreferences: store.get('userPreferences'),
    appSettings: store.get('appSettings')
  };
});

ipcMain.handle('export-settings', () => {
  return {
    userPreferences: store.get('userPreferences'),
    appSettings: store.get('appSettings'),
    windowState: store.get('windowState')
  };
});

ipcMain.handle('import-settings', (_: any, settings: any) => {
  try {
    if (settings.userPreferences) {
      store.set('userPreferences', settings.userPreferences);
    }
    if (settings.appSettings) {
      store.set('appSettings', settings.appSettings);
    }
    if (settings.windowState) {
      store.set('windowState', settings.windowState);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});
