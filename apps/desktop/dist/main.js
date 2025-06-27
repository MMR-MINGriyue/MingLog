"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const storage_1 = require("./storage");
// 应用配置
const APP_CONFIG = {
    name: 'MingLog',
    version: electron_1.app.getVersion(),
    minWidth: 800,
    minHeight: 600,
    defaultWidth: 1200,
    defaultHeight: 800
};
// Keep a global reference of the window object
let mainWindow = null;
let splashWindow = null;
/**
 * 创建启动画面
 */
function createSplashWindow() {
    splashWindow = new electron_1.BrowserWindow({
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
function createMainWindow() {
    // 获取屏幕尺寸
    const primaryDisplay = electron_1.screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    // 计算窗口位置（居中）
    const windowWidth = Math.min(APP_CONFIG.defaultWidth, width - 100);
    const windowHeight = Math.min(APP_CONFIG.defaultHeight, height - 100);
    const x = Math.floor((width - windowWidth) / 2);
    const y = Math.floor((height - windowHeight) / 2);
    mainWindow = new electron_1.BrowserWindow({
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
    }
    else {
        // 在生产环境中，直接加载内嵌的HTML内容
        const editorHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MingLog 编辑器</title>
    <style>
        /* CSS变量定义 - 现代化设计系统 */
        :root {
            /* 主色调 */
            --primary-50: #f0f4ff;
            --primary-100: #e0e7ff;
            --primary-200: #c7d2fe;
            --primary-300: #a5b4fc;
            --primary-400: #818cf8;
            --primary-500: #6366f1;
            --primary-600: #4f46e5;
            --primary-700: #4338ca;
            --primary-800: #3730a3;
            --primary-900: #312e81;

            /* 浅色主题 */
            --bg-primary: #ffffff;
            --bg-secondary: #f9fafb;
            --bg-tertiary: #f3f4f6;
            --text-primary: #111827;
            --text-secondary: #374151;
            --text-tertiary: #6b7280;
            --border-primary: #e5e7eb;
            --border-secondary: #d1d5db;

            /* 中性色 */
            --gray-50: #f9fafb;
            --gray-100: #f3f4f6;
            --gray-200: #e5e7eb;
            --gray-300: #d1d5db;
            --gray-400: #9ca3af;
            --gray-500: #6b7280;
            --gray-600: #4b5563;
            --gray-700: #374151;
            --gray-800: #1f2937;
            --gray-900: #111827;

            /* 语义色彩 */
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --info: #3b82f6;

            /* 阴影 */
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

            /* 圆角 */
            --radius-sm: 0.375rem;
            --radius: 0.5rem;
            --radius-md: 0.75rem;
            --radius-lg: 1rem;
            --radius-xl: 1.5rem;

            /* 间距 */
            --space-1: 0.25rem;
            --space-2: 0.5rem;
            --space-3: 0.75rem;
            --space-4: 1rem;
            --space-5: 1.25rem;
            --space-6: 1.5rem;
            --space-8: 2rem;
            --space-10: 2.5rem;
            --space-12: 3rem;

            /* 字体 */
            --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }

        /* 深色主题 */
        [data-theme="dark"] {
            --bg-primary: #1f2937;
            --bg-secondary: #111827;
            --bg-tertiary: #0f172a;
            --text-primary: #f9fafb;
            --text-secondary: #e5e7eb;
            --text-tertiary: #9ca3af;
            --border-primary: #374151;
            --border-secondary: #4b5563;

            --gray-50: #0f172a;
            --gray-100: #1e293b;
            --gray-200: #334155;
            --gray-300: #475569;
            --gray-400: #64748b;
            --gray-500: #94a3b8;
            --gray-600: #cbd5e1;
            --gray-700: #e2e8f0;
            --gray-800: #f1f5f9;
            --gray-900: #f8fafc;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--font-sans);
            background: var(--bg-secondary);
            color: var(--text-primary);
            height: 100vh;
            display: flex;
            flex-direction: column;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            transition: background-color 0.3s ease, color 0.3s ease;
        }
        /* 头部设计 */
        .header {
            background: var(--bg-primary);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--border-primary);
            padding: var(--space-4) var(--space-6);
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: var(--shadow-sm);
            position: relative;
            z-index: 10;
            transition: all 0.3s ease;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            font-weight: 700;
            font-size: 1.125rem;
            color: var(--gray-900);
        }

        .logo-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 800;
            font-size: 1rem;
            box-shadow: var(--shadow);
            position: relative;
        }

        .logo-icon::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: var(--radius-md);
            background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%);
            pointer-events: none;
        }

        .toolbar {
            display: flex;
            gap: var(--space-2);
            align-items: center;
        }

        .btn {
            padding: var(--space-2) var(--space-4);
            border: 1px solid var(--gray-300);
            background: white;
            border-radius: var(--radius);
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: var(--space-2);
            position: relative;
            overflow: hidden;
        }

        .btn::before {
            content: '';
            position: absolute;
            inset: 0;
            background: var(--primary-50);
            transform: translateX(-100%);
            transition: transform 0.3s ease;
        }

        .btn:hover {
            background: var(--gray-50);
            border-color: var(--primary-300);
            color: var(--primary-700);
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
        }

        .btn:hover::before {
            transform: translateX(0);
        }

        .btn:active {
            transform: translateY(0);
            box-shadow: var(--shadow-sm);
        }

        .btn.primary {
            background: var(--primary-600);
            color: white;
            border-color: var(--primary-600);
            box-shadow: var(--shadow);
        }

        .btn.primary::before {
            background: rgba(255, 255, 255, 0.1);
        }

        .btn.primary:hover {
            background: var(--primary-700);
            border-color: var(--primary-700);
            color: white;
            box-shadow: var(--shadow-lg);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
        }

        .btn-icon {
            font-size: 1rem;
            opacity: 0.8;
            transition: opacity 0.2s ease;
        }

        .btn:hover .btn-icon {
            opacity: 1;
        }
        /* 主体布局 */
        .main {
            flex: 1;
            display: flex;
            overflow: hidden;
            gap: 0;
        }

        /* 侧边栏设计 */
        .sidebar {
            width: 280px;
            background: var(--bg-primary);
            border-right: 1px solid var(--border-primary);
            display: flex;
            flex-direction: column;
            box-shadow: var(--shadow-sm);
            position: relative;
            z-index: 5;
            transition: all 0.3s ease;
        }

        .sidebar-header {
            padding: var(--space-5) var(--space-5) var(--space-4);
            border-bottom: 1px solid var(--border-secondary);
            font-weight: 600;
            font-size: 0.875rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background: var(--bg-secondary);
            transition: all 0.3s ease;
        }

        .page-list {
            flex: 1;
            overflow-y: auto;
            padding: var(--space-2);
        }

        .page-list::-webkit-scrollbar {
            width: 6px;
        }

        .page-list::-webkit-scrollbar-track {
            background: transparent;
        }

        .page-list::-webkit-scrollbar-thumb {
            background: var(--gray-300);
            border-radius: 3px;
        }

        .page-list::-webkit-scrollbar-thumb:hover {
            background: var(--gray-400);
        }

        .page-item {
            padding: var(--space-3) var(--space-4);
            margin-bottom: var(--space-1);
            border-radius: var(--radius);
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            border: 1px solid transparent;
        }

        .page-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 0;
            background: var(--primary-500);
            border-radius: 0 2px 2px 0;
            transition: height 0.2s ease;
        }

        .page-item:hover {
            background: var(--gray-50);
            border-color: var(--gray-200);
            transform: translateX(2px);
        }

        .page-item.active {
            background: var(--primary-50);
            border-color: var(--primary-200);
            color: var(--primary-900);
        }

        .page-item.active::before {
            height: 60%;
        }

        .page-title {
            font-weight: 600;
            font-size: 0.875rem;
            margin-bottom: var(--space-1);
            color: inherit;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .page-preview {
            font-size: 0.75rem;
            color: var(--gray-500);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.4;
        }

        .page-item.active .page-preview {
            color: var(--primary-700);
        }
        /* 编辑器容器 */
        .editor-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: white;
            position: relative;
        }

        /* 编辑器头部 */
        .editor-header {
            padding: var(--space-6) var(--space-8) var(--space-5);
            border-bottom: 1px solid var(--gray-100);
            background: white;
            position: relative;
        }

        .page-title-input {
            font-size: 2rem;
            font-weight: 700;
            border: none;
            outline: none;
            width: 100%;
            background: transparent;
            color: var(--gray-900);
            line-height: 1.2;
            padding: var(--space-2) 0;
            border-radius: var(--radius);
            transition: all 0.2s ease;
        }

        .page-title-input:focus {
            background: var(--gray-50);
            padding: var(--space-2) var(--space-4);
            margin: 0 calc(-1 * var(--space-4));
        }

        .page-title-input::placeholder {
            color: var(--gray-400);
            font-weight: 400;
        }

        /* 编辑器主体 */
        .editor {
            flex: 1;
            padding: var(--space-6) var(--space-8);
            overflow-y: auto;
            background: white;
            position: relative;
        }

        .editor::-webkit-scrollbar {
            width: 8px;
        }

        .editor::-webkit-scrollbar-track {
            background: transparent;
        }

        .editor::-webkit-scrollbar-thumb {
            background: var(--gray-300);
            border-radius: 4px;
        }

        .editor::-webkit-scrollbar-thumb:hover {
            background: var(--gray-400);
        }

        .editor-content {
            min-height: 100%;
            outline: none;
            font-size: 1rem;
            line-height: 1.7;
            color: var(--gray-700);
            max-width: 65ch;
            margin: 0 auto;
        }

        .editor-content:empty::before {
            content: "开始写作...";
            color: var(--gray-400);
            font-style: italic;
        }
        /* 状态栏 */
        .status-bar {
            background: var(--gray-50);
            border-top: 1px solid var(--gray-200);
            padding: var(--space-3) var(--space-8);
            font-size: 0.75rem;
            color: var(--gray-500);
            display: flex;
            justify-content: space-between;
            align-items: center;
            backdrop-filter: blur(10px);
            position: relative;
        }

        .status-bar::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--gray-300), transparent);
        }

        /* 块编辑器样式 */
        .block {
            margin: var(--space-4) 0;
            padding: var(--space-3) var(--space-4);
            border-radius: var(--radius);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            border: 1px solid transparent;
        }

        .block::before {
            content: '';
            position: absolute;
            left: -2px;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 0;
            background: var(--primary-500);
            border-radius: 2px;
            transition: height 0.2s ease;
        }

        .block:hover {
            background: var(--gray-50);
            border-color: var(--gray-200);
        }

        .block:hover::before {
            height: 30%;
        }

        .block.focused {
            background: var(--primary-50);
            border-color: var(--primary-300);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .block.focused::before {
            height: 80%;
        }

        .block-content {
            outline: none;
            width: 100%;
            border: none;
            background: transparent;
            font-size: inherit;
            line-height: inherit;
            color: inherit;
            resize: none;
            overflow: hidden;
            font-family: inherit;
        }

        /* 不同类型块的样式 */
        .block-type-h1 .block-content {
            font-size: 2.25rem;
            font-weight: 800;
            color: var(--gray-900);
            line-height: 1.1;
            margin: var(--space-2) 0;
        }

        .block-type-h2 .block-content {
            font-size: 1.875rem;
            font-weight: 700;
            color: var(--gray-900);
            line-height: 1.2;
            margin: var(--space-2) 0;
        }

        .block-type-h3 .block-content {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--gray-900);
            line-height: 1.3;
            margin: var(--space-1) 0;
        }

        .block-type-quote {
            border-left: 4px solid var(--primary-400);
            background: var(--primary-50);
            padding-left: var(--space-6);
        }

        .block-type-quote .block-content {
            font-style: italic;
            color: var(--gray-700);
            font-size: 1.125rem;
        }

        .block-type-code {
            background: var(--gray-900);
            border-radius: var(--radius-md);
            padding: var(--space-4);
        }

        .block-type-code .block-content {
            font-family: var(--font-mono);
            color: #e5e7eb;
            font-size: 0.875rem;
            line-height: 1.6;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
            .sidebar {
                width: 240px;
            }

            .editor {
                padding: var(--space-4) var(--space-5);
            }

            .editor-header {
                padding: var(--space-4) var(--space-5);
            }

            .page-title-input {
                font-size: 1.75rem;
            }
        }

        /* 动画效果 */
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .page-item {
            animation: fadeIn 0.3s ease-out;
        }

        /* 加载状态 */
        .loading {
            position: relative;
            pointer-events: none;
        }

        .loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            margin: -10px 0 0 -10px;
            border: 2px solid var(--primary-200);
            border-top: 2px solid var(--primary-600);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <div class="logo-icon">M</div>
            <span>MingLog</span>
        </div>
        <div class="toolbar">
            <button type="button" class="btn" id="newPageBtn" title="创建新页面 (Ctrl+N)">
                <span class="btn-icon">📄</span>
                新建页面
            </button>
            <button type="button" class="btn" id="saveBtn" title="保存页面 (Ctrl+S)">
                <span class="btn-icon">💾</span>
                保存
            </button>
            <button type="button" class="btn" id="importBtn" title="导入Markdown文件">
                <span class="btn-icon">📥</span>
                导入
            </button>
            <button type="button" class="btn" id="exportBtn" title="导出当前页面">
                <span class="btn-icon">📤</span>
                导出
            </button>
            <button type="button" class="btn" id="backupBtn" title="创建备份">
                <span class="btn-icon">🔄</span>
                备份
            </button>
            <button type="button" class="btn" id="themeBtn" title="切换主题">
                <span class="btn-icon" id="themeIcon">🌙</span>
            </button>
            <button type="button" class="btn" id="settingsBtn" title="打开设置">
                <span class="btn-icon">⚙️</span>
                设置
            </button>
            <button type="button" class="btn primary" id="performanceBtn" title="查看性能信息">
                <span class="btn-icon">📊</span>
                性能
            </button>
            <button type="button" class="btn" id="testBtn" title="测试按钮" style="background: red; color: white;">
                测试
            </button>
        </div>
    </div>
    <div class="main">
        <div class="sidebar">
            <div class="sidebar-header">页面列表</div>
            <div class="page-list" id="pageList">
                <div class="page-item active" data-page-id="welcome">
                    <div class="page-title">欢迎使用 MingLog</div>
                    <div class="page-preview">开始您的知识管理之旅...</div>
                </div>
                <div class="page-item" data-page-id="example">
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
        // 应用状态
        var appState = {
            currentPageId: 'welcome',
            workspace: null,
            isLoading: false,
            isDirty: false,
            theme: 'light'
        };

        // Electron API 访问
        var electronAPI = window.electronAPI || {
            invoke: (channel, ...args) => {
                console.warn('Electron API not available, using mock data');
                return Promise.resolve({ success: false, error: 'API not available' });
            }
        };

        // 主题管理
        function initializeTheme() {
            // 从本地存储读取主题设置
            var savedTheme = localStorage.getItem('minglog-theme') || 'light';
            setTheme(savedTheme);
        }

        function setTheme(theme) {
            appState.theme = theme;
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('minglog-theme', theme);

            // 更新主题按钮图标
            var themeIcon = document.getElementById('themeIcon');
            if (themeIcon) {
                themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
            }
        }

        function toggleTheme() {
            var newTheme = appState.theme === 'light' ? 'dark' : 'light';
            setTheme(newTheme);

            // 添加切换动画效果
            document.body.style.transition = 'all 0.3s ease';
            setTimeout(function() {
                document.body.style.transition = '';
            }, 300);
        }

        // 简单测试函数
        function testFunction() {
            alert('测试函数工作正常！');
            console.log('testFunction called');
        }

        // 创建新页面
        async function createNewPage() {
            console.log('createNewPage function called');
            var title = prompt('请输入新页面标题:', '新页面');
            console.log('User input title:', title);
            if (title && title.trim()) {
                try {
                    setLoading(true);
                    var result = await electronAPI.invoke('storage:createPage', title.trim());

                    if (result.success) {
                        var page = result.data;
                        addPageToList(page);
                        selectPage(page.id);
                        showMessage('页面创建成功');
                    } else {
                        showMessage('创建页面失败: ' + result.error, 'error');
                    }
                } catch (error) {
                    console.error('创建页面失败:', error);
                    showMessage('创建页面失败', 'error');
                } finally {
                    setLoading(false);
                }
            }
        }

        // 添加页面到列表
        function addPageToList(page) {
            var pageList = document.getElementById('pageList');
            var newPageItem = document.createElement('div');
            newPageItem.className = 'page-item';
            newPageItem.setAttribute('data-page-id', page.id);

            var titleDiv = document.createElement('div');
            titleDiv.className = 'page-title';
            titleDiv.textContent = page.title;

            var previewDiv = document.createElement('div');
            previewDiv.className = 'page-preview';
            previewDiv.textContent = getPagePreview(page);

            newPageItem.appendChild(titleDiv);
            newPageItem.appendChild(previewDiv);
            pageList.appendChild(newPageItem);
        }

        // 获取页面预览
        function getPagePreview(page) {
            if (!page.blocks || page.blocks.length === 0) return '空白页面';

            var content = '';
            page.blocks.forEach(function(block) {
                if (block.content && block.content.trim()) {
                    content += block.content + ' ';
                }
            });

            var preview = content.substring(0, 50);
            return (preview + (content.length > 50 ? '...' : '')) || '空白页面';
        }

        // 设置加载状态
        function setLoading(loading) {
            appState.isLoading = loading;
            var buttons = document.querySelectorAll('.btn');
            buttons.forEach(function(btn) {
                btn.disabled = loading;
                if (loading) {
                    btn.style.opacity = '0.6';
                } else {
                    btn.style.opacity = '1';
                }
            });
        }

        // 显示消息
        function showMessage(message, type) {
            var statusElement = document.getElementById('lastSaved');
            statusElement.textContent = message;
            statusElement.style.color = type === 'error' ? '#dc3545' : '#28a745';

            setTimeout(function() {
                statusElement.textContent = '已保存';
                statusElement.style.color = '';
            }, 3000);
        }

        // 初始化工作空间
        async function initializeWorkspace() {
            try {
                setLoading(true);
                var result = await electronAPI.invoke('storage:loadWorkspace');

                if (result.success) {
                    appState.workspace = result.data;
                    renderPageList();
                    if (appState.workspace.pages['welcome']) {
                        selectPage('welcome');
                    } else {
                        var firstPageId = Object.keys(appState.workspace.pages)[0];
                        if (firstPageId) {
                            selectPage(firstPageId);
                        }
                    }
                    showMessage('工作空间加载成功');
                } else {
                    showMessage('加载工作空间失败: ' + result.error, 'error');
                }
            } catch (error) {
                console.error('初始化工作空间失败:', error);
                showMessage('初始化失败', 'error');
            } finally {
                setLoading(false);
            }
        }

        // 渲染页面列表
        function renderPageList() {
            var pageList = document.getElementById('pageList');
            pageList.innerHTML = '';

            if (appState.workspace && appState.workspace.pages) {
                Object.values(appState.workspace.pages).forEach(function(page) {
                    addPageToList(page);
                });
            }
        }

        // 加载页面内容
        function loadPage(pageId) {
            if (!appState.workspace || !appState.workspace.pages[pageId]) return;

            var page = appState.workspace.pages[pageId];
            appState.currentPageId = pageId;

            // 更新页面标题
            document.querySelector('.page-title-input').value = page.title;

            // 清空编辑器
            var editorContent = document.getElementById('editorContent');
            editorContent.innerHTML = '';

            // 渲染所有块
            if (page.blocks && page.blocks.length > 0) {
                page.blocks.forEach(function(block) {
                    var blockElement = createBlockElement(block);
                    editorContent.appendChild(blockElement);
                });
            } else {
                // 如果没有块，创建一个默认的段落块
                var defaultBlock = {
                    id: 'block_' + Date.now(),
                    type: 'p',
                    content: '',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                var blockElement = createBlockElement(defaultBlock);
                editorContent.appendChild(blockElement);
            }

            setupTextareas();
            updateStatus();
        }

        // 创建块元素
        function createBlockElement(block) {
            var blockDiv = document.createElement('div');
            blockDiv.className = 'block block-type-' + block.type;
            blockDiv.setAttribute('data-type', block.type);
            blockDiv.setAttribute('data-block-id', block.id);

            var textarea = document.createElement('textarea');
            textarea.className = 'block-content';
            textarea.value = block.content;
            textarea.placeholder = getPlaceholderForType(block.type);

            blockDiv.appendChild(textarea);
            return blockDiv;
        }

        // 获取块类型的占位符
        function getPlaceholderForType(type) {
            switch(type) {
                case 'h1': return '标题';
                case 'h2': return '子标题';
                case 'h3': return '小标题';
                case 'quote': return '引用内容';
                case 'code': return '代码';
                default: return '开始写作...';
            }
        }

        // 选择页面
        function selectPage(pageId) {
            // 更新UI状态
            var pageItems = document.querySelectorAll('.page-item');
            pageItems.forEach(function(item) {
                item.classList.remove('active');
                if (item.getAttribute('data-page-id') === pageId) {
                    item.classList.add('active');
                }
            });

            // 更新当前页面ID
            appState.currentPageId = pageId;

            // 加载页面内容
            loadPage(pageId);
            updateStatus();
        }

        // 保存页面
        async function savePage() {
            if (!appState.workspace || !appState.currentPageId) return;

            try {
                setLoading(true);

                // 收集页面数据
                var title = document.querySelector('.page-title-input').value;
                var blockElements = document.querySelectorAll('.block');
                var updatedBlocks = [];

                blockElements.forEach(function(blockElement) {
                    var textarea = blockElement.querySelector('.block-content');
                    var blockId = blockElement.getAttribute('data-block-id');
                    var blockType = blockElement.getAttribute('data-type');
                    var content = textarea.value;

                    updatedBlocks.push({
                        id: blockId,
                        type: blockType,
                        content: content,
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    });
                });

                // 准备更新数据
                var updates = {
                    title: title || '无标题页面',
                    blocks: updatedBlocks,
                    updatedAt: Date.now()
                };

                // 调用存储API
                var result = await electronAPI.invoke('storage:updatePage', appState.currentPageId, updates);

                if (result.success) {
                    // 更新本地状态
                    Object.assign(appState.workspace.pages[appState.currentPageId], updates);

                    // 更新页面列表中的预览
                    updatePageListItem(appState.currentPageId);

                    showMessage('保存成功');
                    appState.isDirty = false;
                } else {
                    showMessage('保存失败: ' + result.error, 'error');
                }
            } catch (error) {
                console.error('保存页面失败:', error);
                showMessage('保存失败', 'error');
            } finally {
                setLoading(false);
                updateStatus();
            }
        }

        // 更新页面列表项
        function updatePageListItem(pageId) {
            var page = appState.workspace.pages[pageId];
            if (!page) return;

            var pageItem = document.querySelector('[data-page-id="' + pageId + '"]');
            if (pageItem) {
                var titleElement = pageItem.querySelector('.page-title');
                var previewElement = pageItem.querySelector('.page-preview');
                titleElement.textContent = page.title;
                previewElement.textContent = getPagePreview(page);
            }
        }

        // 导入文件
        async function importMarkdown() {
            var choice = prompt('选择导入方式:\\n\\n1 - 导入单个Markdown文件\\n2 - 批量导入Markdown文件\\n3 - 导入工作空间数据 (JSON)\\n\\n请输入选项编号 (1-3):');

            switch(choice) {
                case '1':
                    await importSingleFile();
                    break;
                case '2':
                    await importMultipleFiles();
                    break;
                case '3':
                    await importWorkspaceData();
                    break;
                default:
                    if (choice !== null) {
                        alert('无效的选项');
                    }
                    break;
            }
        }

        // 导入工作空间数据
        async function importWorkspaceData() {
            try {
                setLoading(true);

                var confirmImport = confirm('⚠️ 警告: 导入工作空间数据将覆盖当前所有数据！\\n\\n确定要继续吗？');
                if (!confirmImport) {
                    return;
                }

                // 打开文件选择对话框
                var result = await electronAPI.invoke('dialog:showOpenDialog', {
                    title: '选择工作空间数据文件',
                    filters: [
                        { name: 'JSON文件', extensions: ['json'] },
                        { name: '所有文件', extensions: ['*'] }
                    ],
                    properties: ['openFile']
                });

                if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
                    return;
                }

                var filePath = result.filePaths[0];

                // 读取文件内容
                var fileResult = await electronAPI.invoke('fs:readFile', filePath);
                if (!fileResult.success) {
                    showMessage('读取文件失败: ' + fileResult.error, 'error');
                    return;
                }

                // 解析JSON数据
                var importData;
                try {
                    importData = JSON.parse(fileResult.data);
                } catch (error) {
                    showMessage('文件格式错误，不是有效的JSON文件', 'error');
                    return;
                }

                // 验证数据格式
                if (!importData.workspace || !importData.workspace.pages) {
                    showMessage('文件格式错误，不是有效的工作空间数据', 'error');
                    return;
                }

                // 使用备份恢复功能来导入数据
                // 首先获取临时文件路径
                var tempPathResult = await electronAPI.invoke('path:getTempDir');
                if (!tempPathResult.success) {
                    showMessage('获取临时路径失败: ' + tempPathResult.error, 'error');
                    return;
                }

                var tempBackupPath = tempPathResult.data;
                var writeResult = await electronAPI.invoke('fs:writeFile', tempBackupPath, JSON.stringify(importData.workspace, null, 2));

                if (!writeResult.success) {
                    showMessage('创建临时文件失败: ' + writeResult.error, 'error');
                    return;
                }

                // 恢复数据
                await restoreBackup(tempBackupPath);

                showMessage('工作空间数据导入成功');

            } catch (error) {
                console.error('导入工作空间数据失败:', error);
                showMessage('导入失败', 'error');
            } finally {
                setLoading(false);
            }
        }

        // 导入单个文件
        async function importSingleFile() {
            try {
                setLoading(true);

                // 打开文件选择对话框
                var result = await electronAPI.invoke('dialog:showOpenDialog', {
                    title: '选择Markdown文件',
                    filters: [
                        { name: 'Markdown文件', extensions: ['md', 'markdown', 'txt'] },
                        { name: '所有文件', extensions: ['*'] }
                    ],
                    properties: ['openFile']
                });

                if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
                    return;
                }

                var filePath = result.filePaths[0];

                // 读取文件内容
                var fileResult = await electronAPI.invoke('fs:readFile', filePath);
                if (!fileResult.success) {
                    showMessage('读取文件失败: ' + fileResult.error, 'error');
                    return;
                }
                var content = fileResult.data;

                // 从文件名提取标题
                var fileName = filePath.split('\\\\').pop().split('/').pop();
                var title = fileName.replace(/\\.(md|markdown|txt)$/i, '');

                // 导入为新页面
                var importResult = await electronAPI.invoke('storage:importMarkdown', content, title);

                if (importResult.success) {
                    var page = importResult.data;

                    // 重新加载工作空间以获取最新数据
                    await initializeWorkspace();

                    // 切换到新导入的页面
                    selectPage(page.id);

                    showMessage('导入成功: ' + page.title);
                } else {
                    showMessage('导入失败: ' + importResult.error, 'error');
                }
            } catch (error) {
                console.error('导入文件失败:', error);
                showMessage('导入失败', 'error');
            } finally {
                setLoading(false);
            }
        }

        // 批量导入多个文件
        async function importMultipleFiles() {
            try {
                setLoading(true);

                // 打开文件选择对话框（多选）
                var result = await electronAPI.invoke('dialog:showOpenDialog', {
                    title: '选择多个Markdown文件',
                    filters: [
                        { name: 'Markdown文件', extensions: ['md', 'markdown', 'txt'] },
                        { name: '所有文件', extensions: ['*'] }
                    ],
                    properties: ['openFile', 'multiSelections']
                });

                if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
                    return;
                }

                var successCount = 0;
                var errorCount = 0;
                var lastImportedPageId = null;

                // 逐个导入文件
                for (var i = 0; i < result.filePaths.length; i++) {
                    try {
                        var filePath = result.filePaths[i];

                        // 读取文件内容
                        var fileResult = await electronAPI.invoke('fs:readFile', filePath);
                        if (!fileResult.success) {
                            console.error('读取文件失败:', filePath, fileResult.error);
                            errorCount++;
                            continue;
                        }

                        var content = fileResult.data;

                        // 从文件名提取标题
                        var fileName = filePath.split('\\\\').pop().split('/').pop();
                        var title = fileName.replace(/\\.(md|markdown|txt)$/i, '');

                        // 导入为新页面
                        var importResult = await electronAPI.invoke('storage:importMarkdown', content, title);

                        if (importResult.success) {
                            successCount++;
                            lastImportedPageId = importResult.data.id;
                        } else {
                            console.error('导入页面失败:', title, importResult.error);
                            errorCount++;
                        }
                    } catch (error) {
                        console.error('处理文件失败:', filePath, error);
                        errorCount++;
                    }
                }

                // 重新加载工作空间
                await initializeWorkspace();

                // 切换到最后导入的页面
                if (lastImportedPageId) {
                    selectPage(lastImportedPageId);
                }

                // 显示导入结果
                var message = '批量导入完成\\n\\n';
                message += '成功: ' + successCount + ' 个文件\\n';
                if (errorCount > 0) {
                    message += '失败: ' + errorCount + ' 个文件';
                }
                showMessage(message);

            } catch (error) {
                console.error('批量导入失败:', error);
                showMessage('批量导入失败', 'error');
            } finally {
                setLoading(false);
            }
        }

        // 导出当前页面为Markdown
        async function exportCurrentPage() {
            if (!appState.currentPageId) {
                showMessage('请先选择一个页面', 'error');
                return;
            }

            try {
                setLoading(true);

                var page = appState.workspace.pages[appState.currentPageId];
                if (!page) {
                    showMessage('页面不存在', 'error');
                    return;
                }

                // 获取Markdown内容
                var result = await electronAPI.invoke('storage:exportMarkdown', appState.currentPageId);

                if (!result.success) {
                    showMessage('导出失败: ' + result.error, 'error');
                    return;
                }

                var markdown = result.data;

                // 打开保存对话框
                var saveResult = await electronAPI.invoke('dialog:showSaveDialog', {
                    title: '保存Markdown文件',
                    defaultPath: page.title + '.md',
                    filters: [
                        { name: 'Markdown文件', extensions: ['md'] },
                        { name: '文本文件', extensions: ['txt'] },
                        { name: '所有文件', extensions: ['*'] }
                    ]
                });

                if (saveResult.canceled || !saveResult.filePath) {
                    return;
                }

                // 保存文件
                var writeResult = await electronAPI.invoke('fs:writeFile', saveResult.filePath, markdown);
                if (!writeResult.success) {
                    showMessage('保存文件失败: ' + writeResult.error, 'error');
                    return;
                }

                showMessage('导出成功: ' + saveResult.filePath);
            } catch (error) {
                console.error('导出文件失败:', error);
                showMessage('导出失败', 'error');
            } finally {
                setLoading(false);
            }
        }

        // 导出所有页面
        async function exportAllPages() {
            try {
                setLoading(true);

                // 获取所有页面的Markdown内容
                var result = await electronAPI.invoke('storage:exportMarkdown');

                if (!result.success) {
                    showMessage('导出失败: ' + result.error, 'error');
                    return;
                }

                var markdown = result.data;

                // 打开保存对话框
                var saveResult = await electronAPI.invoke('dialog:showSaveDialog', {
                    title: '保存所有页面',
                    defaultPath: 'MingLog导出_' + new Date().toISOString().split('T')[0] + '.md',
                    filters: [
                        { name: 'Markdown文件', extensions: ['md'] },
                        { name: '文本文件', extensions: ['txt'] }
                    ]
                });

                if (saveResult.canceled || !saveResult.filePath) {
                    return;
                }

                // 保存文件
                var writeResult = await electronAPI.invoke('fs:writeFile', saveResult.filePath, markdown);
                if (!writeResult.success) {
                    showMessage('保存文件失败: ' + writeResult.error, 'error');
                    return;
                }

                showMessage('导出成功: ' + saveResult.filePath);
            } catch (error) {
                console.error('导出所有页面失败:', error);
                showMessage('导出失败', 'error');
            } finally {
                setLoading(false);
            }
        }

        // 创建备份
        async function createBackup() {
            try {
                setLoading(true);

                var result = await electronAPI.invoke('storage:createBackup');

                if (result.success) {
                    showMessage('备份创建成功');
                } else {
                    showMessage('备份失败: ' + result.error, 'error');
                }
            } catch (error) {
                console.error('创建备份失败:', error);
                showMessage('备份失败', 'error');
            } finally {
                setLoading(false);
            }
        }

        // 显示备份管理
        async function showBackupManager() {
            try {
                setLoading(true);

                var result = await electronAPI.invoke('storage:getBackupList');

                if (!result.success) {
                    showMessage('获取备份列表失败: ' + result.error, 'error');
                    return;
                }

                var backups = result.data;

                if (backups.length === 0) {
                    var createFirst = confirm('没有找到备份文件\\n\\n是否创建第一个备份？');
                    if (createFirst) {
                        await createBackup();
                    }
                    return;
                }

                // 显示备份列表并让用户选择操作
                await showBackupList(backups);

            } catch (error) {
                console.error('显示备份管理失败:', error);
                showMessage('备份管理失败', 'error');
            } finally {
                setLoading(false);
            }
        }

        // 显示备份列表
        async function showBackupList(backups) {
            var message = '📦 备份管理 (' + backups.length + ' 个备份)\\n\\n';

            backups.forEach(function(backup, index) {
                var date = new Date(backup.date).toLocaleString();
                var size = Math.round(backup.size / 1024) + 'KB';
                message += '📄 ' + (index + 1) + '. ' + backup.name + '\\n';
                message += '   📅 ' + date + '\\n';
                message += '   💾 ' + size + '\\n\\n';
            });

            message += '选择操作:\\n';
            message += '✅ 确定 - 创建新备份\\n';
            message += '❌ 取消 - 恢复备份';

            var choice = confirm(message);
            if (choice) {
                await createBackup();
            } else {
                await showRestoreOptions(backups);
            }
        }

        // 显示恢复选项
        async function showRestoreOptions(backups) {
            if (backups.length === 0) {
                alert('没有可恢复的备份');
                return;
            }

            var message = '🔄 选择要恢复的备份\\n\\n';
            message += '⚠️ 警告: 恢复备份将覆盖当前所有数据！\\n\\n';

            backups.forEach(function(backup, index) {
                var date = new Date(backup.date).toLocaleString();
                message += (index + 1) + '. ' + date + '\\n';
            });

            var choice = prompt(message + '\\n请输入备份编号 (1-' + backups.length + ')，或输入0取消:');

            if (!choice || choice === '0') {
                return;
            }

            var index = parseInt(choice) - 1;
            if (index < 0 || index >= backups.length) {
                alert('无效的备份编号');
                return;
            }

            var selectedBackup = backups[index];
            var confirmRestore = confirm('确定要恢复以下备份吗？\\n\\n' +
                '📄 ' + selectedBackup.name + '\\n' +
                '📅 ' + new Date(selectedBackup.date).toLocaleString() + '\\n\\n' +
                '⚠️ 这将覆盖当前所有数据！');

            if (confirmRestore) {
                await restoreBackup(selectedBackup.path);
            }
        }

        // 恢复备份
        async function restoreBackup(backupPath) {
            try {
                setLoading(true);
                showMessage('正在恢复备份...');

                var result = await electronAPI.invoke('storage:restoreBackup', backupPath);

                if (result.success) {
                    showMessage('备份恢复成功，正在重新加载...');

                    // 重新初始化工作空间
                    setTimeout(async function() {
                        await initializeWorkspace();
                        showMessage('备份恢复完成');
                    }, 1000);
                } else {
                    showMessage('恢复备份失败: ' + result.error, 'error');
                }
            } catch (error) {
                console.error('恢复备份失败:', error);
                showMessage('恢复备份失败', 'error');
            } finally {
                setLoading(false);
            }
        }

        // 显示导出菜单
        function showExportMenu() {
            var choice = prompt('选择导出选项:\\n\\n1 - 导出当前页面 (Markdown)\\n2 - 导出所有页面 (Markdown)\\n3 - 导出完整数据 (JSON)\\n\\n请输入选项编号 (1-3):');

            switch(choice) {
                case '1':
                    exportCurrentPage();
                    break;
                case '2':
                    exportAllPages();
                    break;
                case '3':
                    exportWorkspaceData();
                    break;
                default:
                    if (choice !== null) {
                        alert('无效的选项');
                    }
                    break;
            }
        }

        // 导出工作空间数据 (JSON格式)
        async function exportWorkspaceData() {
            try {
                setLoading(true);

                if (!appState.workspace) {
                    showMessage('工作空间未加载', 'error');
                    return;
                }

                // 打开保存对话框
                var saveResult = await electronAPI.invoke('dialog:showSaveDialog', {
                    title: '导出工作空间数据',
                    defaultPath: 'MingLog_工作空间_' + new Date().toISOString().split('T')[0] + '.json',
                    filters: [
                        { name: 'JSON文件', extensions: ['json'] },
                        { name: '所有文件', extensions: ['*'] }
                    ]
                });

                if (saveResult.canceled || !saveResult.filePath) {
                    return;
                }

                // 准备导出数据
                var exportData = {
                    exportInfo: {
                        version: '1.0.0',
                        exportDate: new Date().toISOString(),
                        source: 'MingLog Desktop',
                        description: '完整的工作空间数据导出'
                    },
                    workspace: appState.workspace
                };

                var jsonData = JSON.stringify(exportData, null, 2);

                // 保存文件
                var writeResult = await electronAPI.invoke('fs:writeFile', saveResult.filePath, jsonData);
                if (!writeResult.success) {
                    showMessage('保存文件失败: ' + writeResult.error, 'error');
                    return;
                }

                showMessage('工作空间数据导出成功: ' + saveResult.filePath);
            } catch (error) {
                console.error('导出工作空间数据失败:', error);
                showMessage('导出失败', 'error');
            } finally {
                setLoading(false);
            }
        }

        // 显示设置对话框
        function showSettings() {
            alert('设置功能\\n\\n版本: 0.1.0\\n作者: MingLog Team\\n\\n快捷键:\\nCtrl+N: 新建页面\\nCtrl+S: 保存页面\\nCtrl+I: 导入文件\\nCtrl+E: 导出页面');
        }

        // 显示性能信息
        function showPerformance() {
            if (!appState.workspace) {
                alert('工作空间未加载');
                return;
            }

            var pageCount = Object.keys(appState.workspace.pages).length;
            var wordCount = document.getElementById('wordCount').textContent;
            alert('性能信息\\n\\n页面数量: ' + pageCount + '\\n' + wordCount + '\\n\\n平台: Windows\\nElectron版本: 28.3.3');
        }

        // 更新状态栏
        function updateStatus() {
            var blocks = document.querySelectorAll('.block-content');
            var wordCount = 0;
            var blockCount = 0;

            blocks.forEach(function(block) {
                if (block.value && block.value.trim()) {
                    blockCount++;
                    wordCount += block.value.length;
                }
            });

            document.getElementById('wordCount').textContent = '字数: ' + wordCount;
            document.getElementById('blockCount').textContent = '块数: ' + blockCount;
        }

        // 设置文本区域
        function setupTextareas() {
            var textareas = document.querySelectorAll('.block-content');
            textareas.forEach(function(textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';

                // 移除旧的事件监听器
                textarea.removeEventListener('input', handleTextareaInput);
                textarea.removeEventListener('keydown', handleTextareaKeydown);

                // 添加新的事件监听器
                textarea.addEventListener('input', handleTextareaInput);
                textarea.addEventListener('keydown', handleTextareaKeydown);
            });
        }

        // 处理文本区域输入
        function handleTextareaInput(e) {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
            updateStatus();
        }

        // 处理文本区域快捷键
        function handleTextareaKeydown(e) {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                savePage();
            }
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                createNewPage();
            }
        }

        // 页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOMContentLoaded event fired');

            // 测试按钮是否存在
            var newPageBtn = document.getElementById('newPageBtn');
            console.log('newPageBtn element:', newPageBtn);

            if (!newPageBtn) {
                console.error('newPageBtn element not found!');
                return;
            }

            // 绑定按钮事件
            newPageBtn.addEventListener('click', function() {
                console.log('newPageBtn clicked!');
                createNewPage();
            });
            document.getElementById('saveBtn').addEventListener('click', savePage);
            document.getElementById('importBtn').addEventListener('click', importMarkdown);
            document.getElementById('exportBtn').addEventListener('click', showExportMenu);
            document.getElementById('backupBtn').addEventListener('click', showBackupManager);
            document.getElementById('themeBtn').addEventListener('click', toggleTheme);
            document.getElementById('settingsBtn').addEventListener('click', showSettings);
            document.getElementById('performanceBtn').addEventListener('click', showPerformance);

            // 绑定测试按钮
            var testBtn = document.getElementById('testBtn');
            if (testBtn) {
                testBtn.addEventListener('click', function() {
                    console.log('Test button clicked!');
                    testFunction();
                });
                console.log('Test button event bound successfully');
            } else {
                console.error('Test button not found!');
            }

            // 绑定页面列表点击事件
            document.getElementById('pageList').addEventListener('click', function(e) {
                var pageItem = e.target.closest('.page-item');
                if (pageItem) {
                    var pageId = pageItem.getAttribute('data-page-id');
                    selectPage(pageId);
                }
            });

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
                if (e.ctrlKey && e.key === 'i') {
                    e.preventDefault();
                    importMarkdown();
                }
                if (e.ctrlKey && e.key === 'e') {
                    e.preventDefault();
                    showExportMenu();
                }
                if (e.ctrlKey && e.key === 'b') {
                    e.preventDefault();
                    showBackupManager();
                }
            });

            // 监听页面标题变化
            document.querySelector('.page-title-input').addEventListener('input', function() {
                appState.isDirty = true;
            });

            // 初始化主题
            initializeTheme();

            // 初始化工作空间
            initializeWorkspace();

            // 定期更新状态
            setInterval(updateStatus, 1000);
        });
    </script>
</body>
</html>`;
        mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(editorHTML));
        // 临时启用开发者工具进行调试
        mainWindow.webContents.openDevTools();
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
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    return mainWindow;
}
/**
 * 创建应用菜单
 */
function createMenu() {
    const template = [
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
                            const result = await electron_1.dialog.showOpenDialog(mainWindow, {
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
                        electron_1.app.quit();
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
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}
// 应用程序事件处理
electron_1.app.whenReady().then(async () => {
    // 初始化存储系统
    setupStorageIPC();
    // 创建启动画面
    createSplashWindow();
    // 延迟创建主窗口，给启动画面一些显示时间
    setTimeout(() => {
        createMainWindow();
        createMenu();
    }, 1500);
    // macOS 特殊处理
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});
// 所有窗口关闭时退出应用（除了 macOS）
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// 应用退出前清理
electron_1.app.on('before-quit', () => {
    storage_1.storageManager.destroy();
});
// 安全设置
electron_1.app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
});
// IPC 事件处理
electron_1.ipcMain.handle('app-version', () => {
    return electron_1.app.getVersion();
});
electron_1.ipcMain.handle('app-name', () => {
    return APP_CONFIG.name;
});
electron_1.ipcMain.handle('show-message-box', async (event, options) => {
    if (mainWindow) {
        const result = await electron_1.dialog.showMessageBox(mainWindow, options);
        return result;
    }
    return { response: 0 };
});
electron_1.ipcMain.handle('show-open-dialog', async (event, options) => {
    if (mainWindow) {
        const result = await electron_1.dialog.showOpenDialog(mainWindow, options);
        return result;
    }
    return { canceled: true, filePaths: [] };
});
electron_1.ipcMain.handle('show-save-dialog', async (event, options) => {
    if (mainWindow) {
        const result = await electron_1.dialog.showSaveDialog(mainWindow, options);
        return result;
    }
    return { canceled: true, filePath: '' };
});
// 自动更新功能暂时禁用，避免依赖问题
// TODO: 在解决依赖问题后重新启用自动更新
// 错误处理辅助函数
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
// 存储相关的IPC处理器
function setupStorageIPC() {
    // 加载工作空间
    electron_1.ipcMain.handle('storage:loadWorkspace', async () => {
        try {
            const workspace = await storage_1.storageManager.loadWorkspace();
            return { success: true, data: workspace };
        }
        catch (error) {
            console.error('加载工作空间失败:', error);
            return { success: false, error: getErrorMessage(error) };
        }
    });
    // 保存工作空间
    electron_1.ipcMain.handle('storage:saveWorkspace', async () => {
        try {
            await storage_1.storageManager.saveWorkspace();
            return { success: true };
        }
        catch (error) {
            console.error('保存工作空间失败:', error);
            return { success: false, error: getErrorMessage(error) };
        }
    });
    // 创建新页面
    electron_1.ipcMain.handle('storage:createPage', async (event, title) => {
        try {
            const page = storage_1.storageManager.createPage(title);
            return { success: true, data: page };
        }
        catch (error) {
            console.error('创建页面失败:', error);
            return { success: false, error: getErrorMessage(error) };
        }
    });
    // 更新页面
    electron_1.ipcMain.handle('storage:updatePage', async (event, pageId, updates) => {
        try {
            storage_1.storageManager.updatePage(pageId, updates);
            return { success: true };
        }
        catch (error) {
            console.error('更新页面失败:', error);
            return { success: false, error: getErrorMessage(error) };
        }
    });
    // 删除页面
    electron_1.ipcMain.handle('storage:deletePage', async (event, pageId) => {
        try {
            storage_1.storageManager.deletePage(pageId);
            return { success: true };
        }
        catch (error) {
            console.error('删除页面失败:', error);
            return { success: false, error: getErrorMessage(error) };
        }
    });
    // 创建备份
    electron_1.ipcMain.handle('storage:createBackup', async () => {
        try {
            const backupPath = await storage_1.storageManager.createBackup();
            return { success: true, data: backupPath };
        }
        catch (error) {
            console.error('创建备份失败:', error);
            return { success: false, error: getErrorMessage(error) };
        }
    });
    // 获取备份列表
    electron_1.ipcMain.handle('storage:getBackupList', async () => {
        try {
            const backups = storage_1.storageManager.getBackupList();
            return { success: true, data: backups };
        }
        catch (error) {
            console.error('获取备份列表失败:', error);
            return { success: false, error: getErrorMessage(error) };
        }
    });
    // 恢复备份
    electron_1.ipcMain.handle('storage:restoreBackup', async (event, backupPath) => {
        try {
            await storage_1.storageManager.restoreBackup(backupPath);
            return { success: true };
        }
        catch (error) {
            console.error('恢复备份失败:', error);
            return { success: false, error: getErrorMessage(error) };
        }
    });
    // 导出为Markdown
    electron_1.ipcMain.handle('storage:exportMarkdown', async (event, pageId) => {
        try {
            const markdown = storage_1.storageManager.exportToMarkdown(pageId);
            return { success: true, data: markdown };
        }
        catch (error) {
            console.error('导出Markdown失败:', error);
            return { success: false, error: getErrorMessage(error) };
        }
    });
    // 从Markdown导入
    electron_1.ipcMain.handle('storage:importMarkdown', async (event, markdown, title) => {
        try {
            const page = storage_1.storageManager.importFromMarkdown(markdown, title);
            return { success: true, data: page };
        }
        catch (error) {
            console.error('导入Markdown失败:', error);
            return { success: false, error: getErrorMessage(error) };
        }
    });
    // 获取存储元数据
    electron_1.ipcMain.handle('storage:getMetadata', async () => {
        try {
            const metadata = storage_1.storageManager.getMetadata();
            return { success: true, data: metadata };
        }
        catch (error) {
            console.error('获取元数据失败:', error);
            return { success: false, error: getErrorMessage(error) };
        }
    });
    // 选择文件对话框
    electron_1.ipcMain.handle('dialog:showOpenDialog', async (event, options) => {
        const result = await electron_1.dialog.showOpenDialog(mainWindow, options);
        return result;
    });
    // 保存文件对话框
    electron_1.ipcMain.handle('dialog:showSaveDialog', async (event, options) => {
        const result = await electron_1.dialog.showSaveDialog(mainWindow, options);
        return result;
    });
    // 读取文件
    electron_1.ipcMain.handle('fs:readFile', async (event, filePath) => {
        try {
            const fs = require('fs');
            const content = fs.readFileSync(filePath, 'utf-8');
            return { success: true, data: content };
        }
        catch (error) {
            console.error('读取文件失败:', error);
            return { success: false, error: getErrorMessage(error) };
        }
    });
    // 写入文件
    electron_1.ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
        try {
            const fs = require('fs');
            fs.writeFileSync(filePath, content, 'utf-8');
            return { success: true };
        }
        catch (error) {
            console.error('写入文件失败:', error);
            return { success: false, error: getErrorMessage(error) };
        }
    });
    // 获取临时目录路径
    electron_1.ipcMain.handle('path:getTempDir', async () => {
        try {
            const os = require('os');
            const path = require('path');
            const tempDir = os.tmpdir();
            const tempPath = path.join(tempDir, 'minglog_import_' + Date.now() + '.json');
            return { success: true, data: tempPath };
        }
        catch (error) {
            console.error('获取临时目录失败:', error);
            return { success: false, error: getErrorMessage(error) };
        }
    });
}
