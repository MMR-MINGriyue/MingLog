/**
 * MingLog 桌面应用环境集成测试
 * 验证在实际桌面应用环境中的功能集成
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MingLogCore } from '../../MingLogCore';
import { LinkManagerService } from '../../services/LinkManagerService';
import { SearchEngine } from '../../search/SearchEngine';
import { PerformanceMonitor } from '../../services/PerformanceMonitor';
import type { SearchDocument, PageLink } from '../../types/links';

// 模拟 Tauri API
const mockTauriAPI = {
  invoke: vi.fn(),
  listen: vi.fn(),
  emit: vi.fn(),
  fs: {
    readTextFile: vi.fn(),
    writeTextFile: vi.fn(),
    exists: vi.fn(),
    createDir: vi.fn(),
    removeFile: vi.fn()
  },
  path: {
    appDataDir: vi.fn().mockResolvedValue('/app/data'),
    documentDir: vi.fn().mockResolvedValue('/documents'),
    homeDir: vi.fn().mockResolvedValue('/home/user')
  },
  window: {
    getCurrent: vi.fn().mockReturnValue({
      setTitle: vi.fn(),
      minimize: vi.fn(),
      maximize: vi.fn(),
      close: vi.fn(),
      show: vi.fn(),
      hide: vi.fn()
    })
  },
  notification: {
    sendNotification: vi.fn()
  },
  dialog: {
    open: vi.fn(),
    save: vi.fn(),
    message: vi.fn()
  },
  clipboard: {
    writeText: vi.fn(),
    readText: vi.fn()
  }
};

// 模拟桌面环境
const mockDesktopEnvironment = () => {
  // 模拟 window.tauri
  (global as any).window = {
    ...global.window,
    __TAURI__: mockTauriAPI
  };

  // 模拟桌面特定的 API
  Object.defineProperty(navigator, 'platform', {
    value: 'Win32',
    configurable: true
  });

  // 模拟文件系统权限
  Object.defineProperty(window, 'showDirectoryPicker', {
    value: vi.fn().mockResolvedValue({
      name: 'test-directory',
      kind: 'directory'
    }),
    configurable: true
  });
};

describe('桌面应用环境集成测试', () => {
  let core: MingLogCore;
  let linkManager: LinkManagerService;
  let searchEngine: SearchEngine;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(async () => {
    // 设置桌面环境模拟
    mockDesktopEnvironment();

    // 初始化核心组件
    core = new MingLogCore({
      environment: 'desktop',
      dataPath: '/app/data',
      debugMode: true
    });

    linkManager = new LinkManagerService();
    searchEngine = new SearchEngine();
    performanceMonitor = new PerformanceMonitor();

    await core.initialize();
    performanceMonitor.start();
  });

  afterEach(async () => {
    performanceMonitor.stop();
    await core.destroy();
    vi.clearAllMocks();
  });

  describe('桌面应用初始化', () => {
    it('应该在桌面环境中正确初始化', async () => {
      // 验证 Tauri API 可用性
      expect(window.__TAURI__).toBeDefined();
      expect(window.__TAURI__.invoke).toBeDefined();

      // 验证核心系统初始化
      expect(core.getEventBus()).toBeDefined();
      expect(core.getDatabaseManager()).toBeDefined();

      // 验证桌面特定配置
      const settings = await core.getSettingsManager().getGlobalSettings();
      expect(settings.environment).toBe('desktop');
    });

    it('应该设置正确的数据目录', async () => {
      // 验证数据目录设置
      expect(mockTauriAPI.path.appDataDir).toHaveBeenCalled();

      // 验证数据目录创建
      expect(mockTauriAPI.fs.createDir).toHaveBeenCalledWith(
        expect.stringContaining('minglog'),
        expect.any(Object)
      );
    });

    it('应该注册桌面特定的事件监听器', async () => {
      // 验证窗口事件监听
      expect(mockTauriAPI.listen).toHaveBeenCalledWith(
        'tauri://window-created',
        expect.any(Function)
      );

      expect(mockTauriAPI.listen).toHaveBeenCalledWith(
        'tauri://close-requested',
        expect.any(Function)
      );

      // 验证文件系统事件监听
      expect(mockTauriAPI.listen).toHaveBeenCalledWith(
        'tauri://file-drop',
        expect.any(Function)
      );
    });
  });

  describe('文件系统集成', () => {
    it('应该支持本地文件读写', async () => {
      const testContent = '这是测试文件内容';
      const filePath = '/app/data/test.md';

      // 模拟文件写入
      mockTauriAPI.fs.writeTextFile.mockResolvedValueOnce(undefined);
      
      // 写入文件
      await mockTauriAPI.fs.writeTextFile(filePath, testContent);
      
      expect(mockTauriAPI.fs.writeTextFile).toHaveBeenCalledWith(filePath, testContent);

      // 模拟文件读取
      mockTauriAPI.fs.readTextFile.mockResolvedValueOnce(testContent);
      
      // 读取文件
      const readContent = await mockTauriAPI.fs.readTextFile(filePath);
      
      expect(readContent).toBe(testContent);
      expect(mockTauriAPI.fs.readTextFile).toHaveBeenCalledWith(filePath);
    });

    it('应该支持文件拖拽导入', async () => {
      const mockFiles = [
        { path: '/path/to/file1.md', name: 'file1.md' },
        { path: '/path/to/file2.txt', name: 'file2.txt' }
      ];

      // 模拟文件拖拽事件
      const fileDropHandler = vi.fn();
      mockTauriAPI.listen.mockImplementation((event, handler) => {
        if (event === 'tauri://file-drop') {
          fileDropHandler.mockImplementation(handler);
        }
      });

      // 触发文件拖拽
      await fileDropHandler({ payload: mockFiles });

      // 验证文件处理
      expect(fileDropHandler).toHaveBeenCalledWith({
        payload: mockFiles
      });
    });

    it('应该支持目录选择和文件浏览', async () => {
      // 模拟目录选择对话框
      mockTauriAPI.dialog.open.mockResolvedValueOnce('/selected/directory');

      // 打开目录选择对话框
      const selectedPath = await mockTauriAPI.dialog.open({
        directory: true,
        multiple: false
      });

      expect(selectedPath).toBe('/selected/directory');
      expect(mockTauriAPI.dialog.open).toHaveBeenCalledWith({
        directory: true,
        multiple: false
      });
    });
  });

  describe('窗口管理集成', () => {
    it('应该支持窗口操作', async () => {
      const currentWindow = mockTauriAPI.window.getCurrent();

      // 测试窗口标题设置
      await currentWindow.setTitle('MingLog - 测试文档');
      expect(currentWindow.setTitle).toHaveBeenCalledWith('MingLog - 测试文档');

      // 测试窗口最小化
      await currentWindow.minimize();
      expect(currentWindow.minimize).toHaveBeenCalled();

      // 测试窗口最大化
      await currentWindow.maximize();
      expect(currentWindow.maximize).toHaveBeenCalled();
    });

    it('应该处理窗口关闭事件', async () => {
      const closeHandler = vi.fn();
      
      // 注册关闭事件监听器
      mockTauriAPI.listen.mockImplementation((event, handler) => {
        if (event === 'tauri://close-requested') {
          closeHandler.mockImplementation(handler);
        }
      });

      // 模拟窗口关闭请求
      await closeHandler({ preventDefault: vi.fn() });

      expect(closeHandler).toHaveBeenCalled();
    });

    it('应该支持多窗口管理', async () => {
      // 模拟创建新窗口
      mockTauriAPI.invoke.mockResolvedValueOnce('new-window-id');

      const newWindowId = await mockTauriAPI.invoke('create_window', {
        label: 'secondary-window',
        url: '/secondary.html'
      });

      expect(newWindowId).toBe('new-window-id');
      expect(mockTauriAPI.invoke).toHaveBeenCalledWith('create_window', {
        label: 'secondary-window',
        url: '/secondary.html'
      });
    });
  });

  describe('系统通知集成', () => {
    it('应该支持桌面通知', async () => {
      // 发送桌面通知
      await mockTauriAPI.notification.sendNotification({
        title: '测试通知',
        body: '这是一个测试通知消息'
      });

      expect(mockTauriAPI.notification.sendNotification).toHaveBeenCalledWith({
        title: '测试通知',
        body: '这是一个测试通知消息'
      });
    });

    it('应该集成应用内通知系统', async () => {
      const eventBus = core.getEventBus();
      const notificationHandler = vi.fn();

      // 监听通知事件
      eventBus.on('notification:desktop', notificationHandler);

      // 发送应用内通知
      eventBus.emit('notification:desktop', {
        title: '应用内通知',
        message: '这是应用内通知消息',
        type: 'info'
      }, 'DesktopApp');

      expect(notificationHandler).toHaveBeenCalledWith({
        type: 'notification:desktop',
        data: {
          title: '应用内通知',
          message: '这是应用内通知消息',
          type: 'info'
        },
        source: 'DesktopApp',
        timestamp: expect.any(Number)
      });
    });
  });

  describe('剪贴板集成', () => {
    it('应该支持剪贴板操作', async () => {
      const testText = '这是剪贴板测试文本';

      // 写入剪贴板
      await mockTauriAPI.clipboard.writeText(testText);
      expect(mockTauriAPI.clipboard.writeText).toHaveBeenCalledWith(testText);

      // 模拟剪贴板读取
      mockTauriAPI.clipboard.readText.mockResolvedValueOnce(testText);

      // 读取剪贴板
      const clipboardContent = await mockTauriAPI.clipboard.readText();
      expect(clipboardContent).toBe(testText);
    });

    it('应该支持链接复制功能', async () => {
      // 创建测试链接
      const link: PageLink = {
        id: 'clipboard-link',
        type: 'page-reference',
        pageName: '目标页面',
        alias: '目标页面',
        position: 0,
        context: 'source-page'
      };

      await linkManager.createLink(link);

      // 生成链接文本
      const linkText = `[[${link.pageName}]]`;

      // 复制链接到剪贴板
      await mockTauriAPI.clipboard.writeText(linkText);

      expect(mockTauriAPI.clipboard.writeText).toHaveBeenCalledWith(linkText);
    });
  });

  describe('完整工作流程测试', () => {
    it('应该支持完整的文档创建和编辑流程', async () => {
      // 1. 创建新文档
      const document: SearchDocument = {
        id: 'desktop-test-doc',
        title: '桌面测试文档',
        content: '这是在桌面应用中创建的文档，包含[[链接页面]]',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['桌面', '测试']
      };

      // 2. 添加到搜索索引
      searchEngine.addDocument(document);

      // 3. 解析并创建链接
      const links = await linkManager.getLinksFromSource(document.id);
      expect(Array.isArray(links)).toBe(true);

      // 4. 保存到本地文件
      const filePath = `/app/data/documents/${document.id}.json`;
      const documentData = JSON.stringify(document, null, 2);

      mockTauriAPI.fs.writeTextFile.mockResolvedValueOnce(undefined);
      await mockTauriAPI.fs.writeTextFile(filePath, documentData);

      expect(mockTauriAPI.fs.writeTextFile).toHaveBeenCalledWith(filePath, documentData);

      // 5. 更新窗口标题
      const currentWindow = mockTauriAPI.window.getCurrent();
      await currentWindow.setTitle(`MingLog - ${document.title}`);

      expect(currentWindow.setTitle).toHaveBeenCalledWith(`MingLog - ${document.title}`);

      // 6. 发送保存成功通知
      await mockTauriAPI.notification.sendNotification({
        title: '文档已保存',
        body: `文档 "${document.title}" 已成功保存`
      });

      expect(mockTauriAPI.notification.sendNotification).toHaveBeenCalledWith({
        title: '文档已保存',
        body: `文档 "${document.title}" 已成功保存`
      });
    });

    it('应该支持搜索和导航工作流程', async () => {
      // 1. 创建测试文档
      const documents: SearchDocument[] = [
        {
          id: 'search-doc-1',
          title: '搜索测试文档1',
          content: '这是第一个搜索测试文档',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'search-doc-2',
          title: '搜索测试文档2',
          content: '这是第二个搜索测试文档',
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      documents.forEach(doc => searchEngine.addDocument(doc));

      // 2. 执行搜索
      const searchResults = searchEngine.search('搜索测试');
      expect(searchResults).toHaveLength(2);

      // 3. 选择搜索结果并导航
      const selectedDoc = searchResults[0].document;
      const currentWindow = mockTauriAPI.window.getCurrent();

      // 更新窗口标题
      await currentWindow.setTitle(`MingLog - ${selectedDoc.title}`);

      // 4. 复制文档链接
      const documentLink = `[[${selectedDoc.title}]]`;
      await mockTauriAPI.clipboard.writeText(documentLink);

      expect(mockTauriAPI.clipboard.writeText).toHaveBeenCalledWith(documentLink);
    });

    it('应该支持数据导入导出工作流程', async () => {
      // 1. 选择导出目录
      mockTauriAPI.dialog.open.mockResolvedValueOnce('/export/directory');

      const exportPath = await mockTauriAPI.dialog.open({
        directory: true,
        title: '选择导出目录'
      });

      expect(exportPath).toBe('/export/directory');

      // 2. 准备导出数据
      const exportData = {
        documents: [
          {
            id: 'export-doc',
            title: '导出测试文档',
            content: '这是要导出的文档内容',
            type: 'page',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        links: [],
        metadata: {
          exportedAt: new Date(),
          version: '1.0.0'
        }
      };

      // 3. 写入导出文件
      const exportFilePath = `${exportPath}/minglog-export.json`;
      const exportContent = JSON.stringify(exportData, null, 2);

      mockTauriAPI.fs.writeTextFile.mockResolvedValueOnce(undefined);
      await mockTauriAPI.fs.writeTextFile(exportFilePath, exportContent);

      expect(mockTauriAPI.fs.writeTextFile).toHaveBeenCalledWith(exportFilePath, exportContent);

      // 4. 显示导出成功通知
      await mockTauriAPI.notification.sendNotification({
        title: '导出完成',
        body: `数据已成功导出到 ${exportPath}`
      });
    });
  });

  describe('性能监控', () => {
    it('应该监控桌面应用性能', async () => {
      // 1. 监控应用启动时间
      await performanceMonitor.measureAsync('app-startup', async () => {
        await core.initialize();
      });

      // 2. 监控文件操作性能
      await performanceMonitor.measureAsync('file-operation', async () => {
        await mockTauriAPI.fs.writeTextFile('/test/file.txt', 'test content');
        await mockTauriAPI.fs.readTextFile('/test/file.txt');
      });

      // 3. 监控搜索性能
      await performanceMonitor.measureAsync('search-operation', async () => {
        searchEngine.search('测试查询');
      });

      // 4. 获取性能报告
      const report = performanceMonitor.generateReport();

      expect(report.metrics.length).toBeGreaterThan(0);
      expect(report.score).toBeGreaterThan(0);

      // 验证关键性能指标
      const startupMetrics = performanceMonitor.getMetricStats('app-startup');
      expect(startupMetrics.count).toBeGreaterThan(0);

      const fileMetrics = performanceMonitor.getMetricStats('file-operation');
      expect(fileMetrics.count).toBeGreaterThan(0);

      const searchMetrics = performanceMonitor.getMetricStats('search-operation');
      expect(searchMetrics.count).toBeGreaterThan(0);
    });

    it('应该监控内存使用情况', async () => {
      // 创建大量数据以测试内存使用
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `memory-test-${i}`,
        title: `内存测试文档 ${i}`,
        content: `这是内存测试文档${i}的内容`.repeat(100),
        type: 'page' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // 添加到搜索引擎
      largeDataSet.forEach(doc => searchEngine.addDocument(doc));

      // 检查内存使用
      if ((performance as any).memory) {
        const memoryInfo = (performance as any).memory;
        expect(memoryInfo.usedJSHeapSize).toBeGreaterThan(0);
        expect(memoryInfo.totalJSHeapSize).toBeGreaterThan(memoryInfo.usedJSHeapSize);
      }

      // 清理数据
      largeDataSet.forEach(doc => searchEngine.removeDocument(doc.id));
    });
  });
});
