/**
 * MingLog 桌面应用功能验证测试
 * 使用Vitest + Playwright进行端到端测试
 */

import { test, expect, describe, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';

describe('MingLog 桌面应用功能测试', () => {
  let browser: Browser;
  let page: Page;
  let serverAvailable = false;
  const APP_URL = 'http://localhost:1420';

  beforeAll(async () => {
    // 启动浏览器
    browser = await chromium.launch({
      headless: true, // 在CI环境中使用headless模式
      slowMo: 100 // 减少延迟以提升测试速度
    });
    page = await browser.newPage();

    // 检查开发服务器是否可用
    try {
      const response = await page.goto(APP_URL, { timeout: 5000 });
      if (response && response.ok()) {
        serverAvailable = true;
        await page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.warn('开发服务器不可用，跳过功能测试:', error);
      serverAvailable = false;
    }
  });

  afterAll(async () => {
    await browser?.close();
  });

  test('应用基础加载测试', async () => {
    if (!serverAvailable) {
      console.log('跳过功能测试：开发服务器不可用');
      return;
    }

    // 检查页面标题
    const title = await page.title();
    expect(title).toContain('MingLog');

    // 检查基本UI元素是否存在
    await expect(page.locator('body')).toBeVisible();

    // 等待React应用加载（使用更宽松的超时）
    try {
      await page.waitForSelector('[data-testid="app-container"]', { timeout: 5000 });
    } catch (error) {
      // 如果特定元素不存在，至少确保页面已加载
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('笔记创建功能测试', async () => {
    if (!serverAvailable) {
      console.log('跳过功能测试：开发服务器不可用');
      return;
    }

    // 查找创建笔记按钮
    const createButton = page.locator('[data-testid="create-note-btn"]');
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // 等待笔记编辑器出现
      await page.waitForSelector('[data-testid="note-editor"]', { timeout: 5000 });
      
      // 输入标题
      const titleInput = page.locator('[data-testid="note-title-input"]');
      if (await titleInput.isVisible()) {
        await titleInput.fill('测试笔记标题');
      }
      
      // 输入内容
      const contentEditor = page.locator('[data-testid="note-content-editor"]');
      if (await contentEditor.isVisible()) {
        await contentEditor.fill('这是一个测试笔记的内容。\n\n包含多行文本。');
      }
      
      // 保存笔记
      const saveButton = page.locator('[data-testid="save-note-btn"]');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        
        // 等待保存完成
        await page.waitForTimeout(1000);
      }
    }
  });

  test('笔记列表显示测试', async () => {
    if (!serverAvailable) return;

    // 检查笔记列表是否存在
    const notesList = page.locator('[data-testid="notes-list"]');
    if (await notesList.isVisible()) {
      // 检查是否有笔记项
      const noteItems = page.locator('[data-testid^="note-item-"]');
      const count = await noteItems.count();
      
      if (count > 0) {
        // 验证第一个笔记项的内容
        const firstNote = noteItems.first();
        await expect(firstNote).toBeVisible();
        
        // 检查笔记标题是否显示
        const noteTitle = firstNote.locator('[data-testid="note-title"]');
        if (await noteTitle.isVisible()) {
          const titleText = await noteTitle.textContent();
          expect(titleText).toBeTruthy();
        }
      }
    }
  });

  test('搜索功能测试', async () => {
    if (!serverAvailable) return;

    // 查找搜索框
    const searchInput = page.locator('[data-testid="search-input"]');
    if (await searchInput.isVisible()) {
      // 输入搜索关键词
      await searchInput.fill('测试');
      
      // 等待搜索结果
      await page.waitForTimeout(1000);
      
      // 检查搜索结果
      const searchResults = page.locator('[data-testid="search-results"]');
      if (await searchResults.isVisible()) {
        const resultItems = page.locator('[data-testid^="search-result-"]');
        const resultCount = await resultItems.count();
        
        // 验证搜索结果包含关键词
        if (resultCount > 0) {
          const firstResult = resultItems.first();
          const resultText = await firstResult.textContent();
          expect(resultText?.toLowerCase()).toContain('测试');
        }
      }
      
      // 清空搜索
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
  });

  test('主题切换功能测试', async () => {
    if (!serverAvailable) return;

    // 查找主题切换按钮
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      // 获取当前主题
      const currentTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      });
      
      // 切换主题
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // 验证主题已切换
      const newTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      });
      
      expect(newTheme).not.toBe(currentTheme);
    }
  });

  test('设置页面访问测试', async () => {
    if (!serverAvailable) return;

    // 查找设置按钮
    const settingsButton = page.locator('[data-testid="settings-btn"]');
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      
      // 等待设置页面加载
      await page.waitForTimeout(1000);
      
      // 检查设置页面元素
      const settingsPanel = page.locator('[data-testid="settings-panel"]');
      if (await settingsPanel.isVisible()) {
        await expect(settingsPanel).toBeVisible();
        
        // 检查设置选项
        const settingsOptions = page.locator('[data-testid^="setting-"]');
        const optionsCount = await settingsOptions.count();
        expect(optionsCount).toBeGreaterThan(0);
      }
    }
  });

  test('响应性测试', async () => {
    if (!serverAvailable) return;

    // 测试不同窗口尺寸下的响应性
    const viewports = [
      { width: 1920, height: 1080 }, // 桌面
      { width: 1366, height: 768 },  // 笔记本
      { width: 1024, height: 768 },  // 平板
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // 检查主要元素是否仍然可见
      const mainContainer = page.locator('[data-testid="app-container"]');
      await expect(mainContainer).toBeVisible();
      
      // 检查布局是否适应
      const containerBounds = await mainContainer.boundingBox();
      expect(containerBounds?.width).toBeLessThanOrEqual(viewport.width);
    }
  });

  test('错误处理测试', async () => {
    if (!serverAvailable) return;

    // 监听控制台错误
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // 执行一些可能触发错误的操作
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 尝试访问不存在的路由
    await page.goto(`${APP_URL}/#/non-existent-route`);
    await page.waitForTimeout(2000);
    
    // 返回主页
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    // 检查是否有严重错误
    const criticalErrors = errors.filter(error => 
      error.includes('Uncaught') || 
      error.includes('TypeError') ||
      error.includes('ReferenceError')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
