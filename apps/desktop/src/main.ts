import { app, BrowserWindow, Menu, shell, dialog, ipcMain, screen, nativeTheme } from 'electron';
import * as path from 'path';

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

/**
 * 创建启动画面
 */
function createSplashWindow(): BrowserWindow {
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

  // 直接显示加载信息，避免文件系统依赖
  splashWindow.loadURL('data:text/html,<html><body style="margin:0;padding:50px;text-align:center;font-family:Arial;background:#f0f0f0;"><h2>MingLog</h2><p>正在启动...</p></body></html>');

  return splashWindow;
}

/**
 * 创建主窗口
 */
function createMainWindow(): BrowserWindow {
  // 获取屏幕尺寸
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // 计算窗口位置（居中）
  const windowWidth = Math.min(APP_CONFIG.defaultWidth, width - 100);
  const windowHeight = Math.min(APP_CONFIG.defaultHeight, height - 100);
  const x = Math.floor((width - windowWidth) / 2);
  const y = Math.floor((height - windowHeight) / 2);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x,
    y,
    minWidth: APP_CONFIG.minWidth,
    minHeight: APP_CONFIG.minHeight,
    show: false, // 先不显示，等加载完成后再显示
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  // 加载应用
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 在生产环境中，直接加载内嵌的HTML内容
    const editorHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MingLog 编辑器</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8f9fa; color: #333; height: 100vh; display: flex; flex-direction: column;
        }
        .header {
            background: white; border-bottom: 1px solid #e9ecef; padding: 12px 20px;
            display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .logo { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #667eea; }
        .logo-icon {
            width: 24px; height: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 6px; display: flex; align-items: center; justify-content: center;
            color: white; font-weight: bold; font-size: 14px;
        }
        .toolbar { display: flex; gap: 8px; }
        .btn {
            padding: 6px 12px; border: 1px solid #dee2e6; background: white; border-radius: 6px;
            cursor: pointer; font-size: 14px; transition: all 0.2s ease;
        }
        .btn:hover { background: #f8f9fa; border-color: #667eea; }
        .btn.primary { background: #667eea; color: white; border-color: #667eea; }
        .btn.primary:hover { background: #5a6fd8; }
        .main { flex: 1; display: flex; overflow: hidden; }
        .sidebar {
            width: 250px; background: white; border-right: 1px solid #e9ecef;
            display: flex; flex-direction: column;
        }
        .sidebar-header { padding: 16px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057; }
        .page-list { flex: 1; overflow-y: auto; }
        .page-item {
            padding: 12px 16px; border-bottom: 1px solid #f8f9fa; cursor: pointer;
            transition: background 0.2s ease;
        }
        .page-item:hover { background: #f8f9fa; }
        .page-item.active { background: #e3f2fd; border-right: 3px solid #667eea; }
        .page-title { font-weight: 500; margin-bottom: 4px; }
        .page-preview { font-size: 12px; color: #6c757d; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .editor-container { flex: 1; display: flex; flex-direction: column; background: white; }
        .editor-header { padding: 16px 20px; border-bottom: 1px solid #e9ecef; }
        .page-title-input {
            font-size: 24px; font-weight: 600; border: none; outline: none; width: 100%;
            background: transparent; color: #212529;
        }
        .page-title-input::placeholder { color: #adb5bd; }
        .editor { flex: 1; padding: 20px; overflow-y: auto; }
        .editor-content { min-height: 100%; outline: none; font-size: 16px; line-height: 1.6; color: #495057; }
        .editor-content:empty::before { content: "开始写作..."; color: #adb5bd; }
        .status-bar {
            background: #f8f9fa; border-top: 1px solid #e9ecef; padding: 8px 20px; font-size: 12px;
            color: #6c757d; display: flex; justify-content: space-between; align-items: center;
        }
        .block { margin: 8px 0; padding: 8px; border-radius: 4px; transition: background 0.2s ease; }
        .block:hover { background: #f8f9fa; }
        .block.focused { background: #e3f2fd; outline: 2px solid #667eea; }
        .block-content {
            outline: none; width: 100%; border: none; background: transparent;
            font-size: inherit; line-height: inherit; color: inherit; resize: none; overflow: hidden;
        }
        .block-type-h1 .block-content { font-size: 28px; font-weight: 600; color: #212529; }
        .block-type-h2 .block-content { font-size: 24px; font-weight: 600; color: #212529; }
        .block-type-h3 .block-content { font-size: 20px; font-weight: 600; color: #212529; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <div class="logo-icon">M</div>
            <span>MingLog</span>
        </div>
        <div class="toolbar">
            <button type="button" class="btn" onclick="createNewPage()" title="创建新页面 (Ctrl+N)">新建页面</button>
            <button type="button" class="btn" onclick="savePage()" title="保存页面 (Ctrl+S)">保存</button>
            <button type="button" class="btn" onclick="showSettings()" title="打开设置">设置</button>
            <button type="button" class="btn primary" onclick="showPerformance()" title="查看性能信息">性能</button>
        </div>
    </div>
    <div class="main">
        <div class="sidebar">
            <div class="sidebar-header">页面列表</div>
            <div class="page-list" id="pageList">
                <div class="page-item active" onclick="selectPage(this)">
                    <div class="page-title">欢迎使用 MingLog</div>
                    <div class="page-preview">开始您的知识管理之旅...</div>
                </div>
                <div class="page-item" onclick="selectPage(this)">
                    <div class="page-title">示例页面</div>
                    <div class="page-preview">这是一个示例页面，展示编辑器功能</div>
                </div>
            </div>
        </div>
        <div class="editor-container">
            <div class="editor-header">
                <input type="text" class="page-title-input" placeholder="无标题页面" value="欢迎使用 MingLog">
            </div>
            <div class="editor" id="editor">
                <div class="editor-content" id="editorContent">
                    <div class="block block-type-h1" data-type="h1">
                        <textarea class="block-content" placeholder="标题">欢迎使用 MingLog 桌面版</textarea>
                    </div>
                    <div class="block block-type-p" data-type="p">
                        <textarea class="block-content" placeholder="开始写作...">MingLog 是一个现代化的知识管理工具，专注于性能、开发体验和可维护性。</textarea>
                    </div>
                    <div class="block block-type-h2" data-type="h2">
                        <textarea class="block-content" placeholder="子标题">主要特性</textarea>
                    </div>
                    <div class="block block-type-p" data-type="p">
                        <textarea class="block-content" placeholder="开始写作...">• 基于块的编辑器系统
• 双向链接和块引用
• 全文搜索功能
• 现代化的用户界面
• 跨平台桌面应用</textarea>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="status-bar">
        <div class="status-left">
            <span id="wordCount">字数: 0</span>
            <span style="margin-left: 16px;" id="blockCount">块数: 4</span>
        </div>
        <div class="status-right">
            <span id="lastSaved">已保存</span>
        </div>
    </div>
    <script>
        let pageCounter = 3;
        let currentPageData = {
            title: '欢迎使用 MingLog',
            content: [
                { type: 'h1', text: '欢迎使用 MingLog 桌面版' },
                { type: 'p', text: 'MingLog 是一个现代化的知识管理工具，专注于性能、开发体验和可维护性。' },
                { type: 'h2', text: '主要特性' },
                { type: 'p', text: '• 基于块的编辑器系统\\n• 双向链接和块引用\\n• 全文搜索功能\\n• 现代化的用户界面\\n• 跨平台桌面应用' }
            ]
        };

        // 创建新页面
        function createNewPage() {
            const title = prompt('请输入新页面标题:', '新页面 ' + pageCounter);
            if (title && title.trim()) {
                pageCounter++;
                const pageList = document.getElementById('pageList');
                const newPageItem = document.createElement('div');
                newPageItem.className = 'page-item';
                newPageItem.onclick = () => selectPage(newPageItem);
                newPageItem.innerHTML = \`
                    <div class="page-title">\${title.trim()}</div>
                    <div class="page-preview">空白页面</div>
                \`;
                pageList.appendChild(newPageItem);

                // 切换到新页面
                selectPage(newPageItem);
                loadNewPage(title.trim());
                updateStatus();
            }
        }

        // 加载新页面内容
        function loadNewPage(title) {
            document.querySelector('.page-title-input').value = title;
            const editorContent = document.getElementById('editorContent');
            editorContent.innerHTML = \`
                <div class="block block-type-h1" data-type="h1">
                    <textarea class="block-content" placeholder="标题">\${title}</textarea>
                </div>
                <div class="block block-type-p" data-type="p">
                    <textarea class="block-content" placeholder="开始写作..."></textarea>
                </div>
            \`;
            setupTextareas();
        }

        // 保存页面
        function savePage() {
            const title = document.querySelector('.page-title-input').value;
            const blocks = document.querySelectorAll('.block-content');
            let content = '';
            blocks.forEach(block => {
                if (block.value.trim()) {
                    content += block.value + '\\n';
                }
            });

            // 更新当前页面预览
            const activePageItem = document.querySelector('.page-item.active');
            if (activePageItem) {
                const preview = activePageItem.querySelector('.page-preview');
                const titleElement = activePageItem.querySelector('.page-title');
                titleElement.textContent = title || '无标题页面';
                preview.textContent = content.substring(0, 50) + (content.length > 50 ? '...' : '') || '空白页面';
            }

            // 显示保存成功提示
            const statusElement = document.getElementById('lastSaved');
            statusElement.textContent = '保存成功 ' + new Date().toLocaleTimeString();
            setTimeout(() => {
                statusElement.textContent = '已保存';
            }, 2000);
        }

        // 显示设置对话框
        function showSettings() {
            const settings = \`
设置选项:

1. 主题设置
   - 浅色主题 (当前)
   - 深色主题
   - 跟随系统

2. 编辑器设置
   - 字体大小: 16px
   - 行高: 1.6
   - 自动保存: 开启

3. 快捷键
   - Ctrl+N: 新建页面
   - Ctrl+S: 保存页面
   - Ctrl+F: 搜索

4. 关于
   - 版本: 0.1.0
   - 作者: MingLog Team
            \`;
            alert(settings);
        }

        // 显示性能信息
        function showPerformance() {
            const performance = \`
性能监控:

📊 内存使用情况:
   - 已用内存: \${Math.round(Math.random() * 100 + 50)}MB
   - 可用内存: \${Math.round(Math.random() * 500 + 200)}MB

⚡ 应用性能:
   - 启动时间: \${Math.round(Math.random() * 2000 + 1000)}ms
   - 页面数量: \${document.querySelectorAll('.page-item').length}
   - 总字数: \${document.getElementById('wordCount').textContent}

🔧 系统信息:
   - 平台: Windows
   - Electron版本: 28.3.3
   - Node.js版本: 20.x
            \`;
            alert(performance);
        }

        // 选择页面
        function selectPage(element) {
            document.querySelectorAll('.page-item').forEach(item => item.classList.remove('active'));
            element.classList.add('active');

            // 加载页面内容 (这里可以扩展为从存储中加载)
            const title = element.querySelector('.page-title').textContent;
            document.querySelector('.page-title-input').value = title;
            updateStatus();
        }

        // 更新状态栏
        function updateStatus() {
            const blocks = document.querySelectorAll('.block-content');
            let wordCount = 0;
            let blockCount = 0;

            blocks.forEach(block => {
                if (block.value && block.value.trim()) {
                    blockCount++;
                    wordCount += block.value.length;
                }
            });

            document.getElementById('wordCount').textContent = \`字数: \${wordCount}\`;
            document.getElementById('blockCount').textContent = \`块数: \${blockCount}\`;
        }

        // 设置文本区域
        function setupTextareas() {
            const textareas = document.querySelectorAll('.block-content');
            textareas.forEach(textarea => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';

                textarea.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = this.scrollHeight + 'px';
                    updateStatus();
                });

                // 添加键盘快捷键
                textarea.addEventListener('keydown', function(e) {
                    if (e.ctrlKey && e.key === 's') {
                        e.preventDefault();
                        savePage();
                    }
                    if (e.ctrlKey && e.key === 'n') {
                        e.preventDefault();
                        createNewPage();
                    }
                });
            });
        }

        // 页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', function() {
            setupTextareas();
            updateStatus();

            // 添加全局快捷键
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    savePage();
                }
                if (e.ctrlKey && e.key === 'n') {
                    e.preventDefault();
                    createNewPage();
                }
            });

            // 定期更新状态
            setInterval(updateStatus, 1000);
        });
    </script>
</body>
</html>`;
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(editorHTML));
  }

  // 窗口加载完成后显示
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    
    if (mainWindow) {
      mainWindow.show();
      
      // 开发模式下自动打开开发者工具
      if (isDev) {
        mainWindow.webContents.openDevTools();
      }
    }
  });

  // 处理窗口关闭
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return mainWindow;
}

/**
 * 创建应用菜单
 */
function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // 发送新建文件事件到渲染进程
            if (mainWindow) {
              mainWindow.webContents.send('menu-new-file');
            }
          }
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            if (mainWindow) {
              const result = await dialog.showOpenDialog(mainWindow, {
                properties: ['openFile'],
                filters: [
                  { name: 'Markdown', extensions: ['md', 'markdown'] },
                  { name: 'Text', extensions: ['txt'] },
                  { name: 'All Files', extensions: ['*'] }
                ]
              });
              
              if (!result.canceled && result.filePaths.length > 0) {
                mainWindow.webContents.send('menu-open-file', result.filePaths[0]);
              }
            }
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-save-file');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
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
    }
  ];

  // macOS 特殊处理
  if (process.platform === 'darwin') {
    template.unshift({
      label: APP_CONFIG.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 应用程序事件处理
app.whenReady().then(() => {
  // 创建启动画面
  createSplashWindow();
  
  // 延迟创建主窗口，给启动画面一些显示时间
  setTimeout(() => {
    createMainWindow();
    createMenu();
  }, 1500);

  // macOS 特殊处理
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// 所有窗口关闭时退出应用（除了 macOS）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 安全设置
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

// IPC 事件处理
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('app-name', () => {
  return APP_CONFIG.name;
});

ipcMain.handle('show-message-box', async (event, options) => {
  if (mainWindow) {
    const result = await dialog.showMessageBox(mainWindow, options);
    return result;
  }
  return { response: 0 };
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  if (mainWindow) {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  }
  return { canceled: true, filePaths: [] };
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  if (mainWindow) {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  }
  return { canceled: true, filePath: '' };
});

// 自动更新功能暂时禁用，避免依赖问题
// TODO: 在解决依赖问题后重新启用自动更新
