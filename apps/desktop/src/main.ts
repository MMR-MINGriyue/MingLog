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

/**
 * 创建主窗口
 */
function createMainWindow(): void {
  logger.info('开始创建主窗口');

  // 获取保存的窗口状态
  const windowState = configManager.getWindowState();

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
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
  mainWindow.on('closed', () => {
    logger.info('主窗口已关闭');
    mainWindow = null;
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    logger.debug('打开外部链接', { url });
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

/**
 * 加载编辑器页面
 */
function loadEditorPage(): void {
  if (!mainWindow) return;

  const editorPath = path.join(__dirname, 'editor.html');
  mainWindow.loadFile(editorPath);
  logger.info('加载编辑器页面', { path: editorPath });
}



/**
 * 创建应用菜单
 */
function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'MingLog',
      submenu: [
        {
          label: '关于 MingLog',
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
});
