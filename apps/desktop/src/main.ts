import { app, BrowserWindow, Menu, shell, ipcMain, dialog, screen, nativeTheme, Tray } from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep a global reference of the window object and tray
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

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

const store = new Store<StoreSchema>({
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

// Window state management
let windowState = store.get('windowState');

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
    }
  });
}

function createWindow(): void {
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Restore window state or use defaults
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
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
      if (isProduction && mainWindow && !mainWindow.isDestroyed()) {
        autoUpdater.checkForUpdatesAndNotify();
      }

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
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

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
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

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
app.on('web-contents-created', (_event, contents) => {
  // Prevent navigation to external URLs
  contents.on('will-navigate', (event, navigationUrl) => {
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
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

// Create application menu
function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
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
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About MingLog',
              message: 'MingLog',
              detail: `Version: ${app.getVersion()}\nA modern knowledge management tool.`
            });
          }
        },
        {
          label: 'Learn More',
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

// Auto-updater configuration
if (isProduction) {
  autoUpdater.checkForUpdatesAndNotify();

  // Check for updates every hour
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 60 * 60 * 1000);
}

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-checking');
  }
});

autoUpdater.on('update-available', (info) => {
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

autoUpdater.on('update-not-available', (_info) => {
  console.log('Update not available.');
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-not-available');
  }
});

autoUpdater.on('error', (err) => {
  console.error('Error in auto-updater:', err);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-error', err.message);
  }
});

autoUpdater.on('download-progress', (progressObj) => {
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

autoUpdater.on('update-downloaded', (info) => {
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
  });
  return result;
});

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

ipcMain.handle('set-theme', (_, theme: 'light' | 'dark' | 'system') => {
  nativeTheme.themeSource = theme;

  // Notify renderer of theme change
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  }
});

// Update handlers
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

// Settings handlers
ipcMain.handle('get-user-preferences', () => {
  return store.get('userPreferences');
});

ipcMain.handle('set-user-preferences', (_, preferences: Partial<StoreSchema['userPreferences']>) => {
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

ipcMain.handle('set-app-settings', (_, settings: Partial<StoreSchema['appSettings']>) => {
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

ipcMain.handle('import-settings', (_, settings: any) => {
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
