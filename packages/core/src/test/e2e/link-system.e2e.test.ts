/**
 * MingLog 双向链接系统 E2E 测试
 * 测试完整的用户工作流程
 */

import { test, expect, Page } from '@playwright/test';

test.describe('双向链接系统 E2E 测试', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    
    // 等待应用加载完成
    await page.waitForSelector('[data-testid="minglog-app"]', { timeout: 10000 });
  });

  test.describe('基本链接功能', () => {
    test('应该能够创建和导航页面链接', async () => {
      // 创建第一个页面
      await page.click('[data-testid="new-page-button"]');
      await page.fill('[data-testid="page-title-input"]', '测试页面1');
      await page.fill('[data-testid="page-content-editor"]', '这是一个测试页面，它链接到[[测试页面2]]');
      await page.click('[data-testid="save-page-button"]');

      // 验证链接被正确解析
      await expect(page.locator('[data-testid="page-link"]')).toContainText('测试页面2');

      // 点击链接创建新页面
      await page.click('[data-testid="page-link"]');
      
      // 验证跳转到新页面创建界面
      await expect(page.locator('[data-testid="page-title-input"]')).toHaveValue('测试页面2');
      
      // 填写新页面内容
      await page.fill('[data-testid="page-content-editor"]', '这是测试页面2，它反向链接到[[测试页面1]]');
      await page.click('[data-testid="save-page-button"]');

      // 验证反向链接面板
      await expect(page.locator('[data-testid="backlinks-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="backlink-item"]')).toContainText('测试页面1');
    });

    test('应该能够创建和引用块链接', async () => {
      // 创建包含块的页面
      await page.click('[data-testid="new-page-button"]');
      await page.fill('[data-testid="page-title-input"]', '块测试页面');
      
      // 创建一个块
      await page.fill('[data-testid="page-content-editor"]', '这是一个重要的概念块');
      await page.click('[data-testid="create-block-button"]');
      
      // 获取块ID
      const blockId = await page.getAttribute('[data-testid="block-element"]', 'data-block-id');
      expect(blockId).toBeTruthy();

      // 在另一个页面中引用这个块
      await page.click('[data-testid="new-page-button"]');
      await page.fill('[data-testid="page-title-input"]', '引用页面');
      await page.fill('[data-testid="page-content-editor"]', `这里引用了一个重要概念：((${ blockId }))`);
      await page.click('[data-testid="save-page-button"]');

      // 验证块引用被正确渲染
      await expect(page.locator('[data-testid="block-reference"]')).toBeVisible();
      await expect(page.locator('[data-testid="block-reference"]')).toContainText('这是一个重要的概念块');
    });
  });

  test.describe('图谱可视化', () => {
    test('应该能够查看和交互图谱', async () => {
      // 先创建一些相互链接的页面
      await createLinkedPages(page);

      // 打开图谱视图
      await page.click('[data-testid="graph-view-button"]');
      
      // 等待图谱加载
      await page.waitForSelector('[data-testid="link-graph-component"]', { timeout: 5000 });

      // 验证图谱节点
      const nodes = page.locator('[data-testid="graph-node"]');
      await expect(nodes).toHaveCount(3);

      // 验证图谱边
      const edges = page.locator('[data-testid="graph-edge"]');
      await expect(edges.first()).toBeVisible();

      // 测试节点点击
      await nodes.first().click();
      await expect(page.locator('[data-testid="node-details-panel"]')).toBeVisible();

      // 测试图谱控制面板
      await page.click('[data-testid="graph-controls-toggle"]');
      await expect(page.locator('[data-testid="graph-control-panel"]')).toBeVisible();

      // 测试布局切换
      await page.selectOption('[data-testid="layout-selector"]', 'hierarchy');
      await page.waitForTimeout(1000); // 等待布局动画

      // 测试过滤器
      await page.uncheck('[data-testid="filter-page-nodes"]');
      await expect(page.locator('[data-testid="graph-node"][data-type="page"]')).toHaveCount(0);
    });

    test('应该能够导出图谱', async () => {
      await createLinkedPages(page);
      await page.click('[data-testid="graph-view-button"]');
      await page.waitForSelector('[data-testid="link-graph-component"]');

      // 打开导出菜单
      await page.click('[data-testid="graph-export-button"]');
      await expect(page.locator('[data-testid="export-menu"]')).toBeVisible();

      // 测试PNG导出
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-png-button"]');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.png');
    });
  });

  test.describe('高级搜索', () => {
    test('应该能够执行基本搜索', async () => {
      // 创建测试内容
      await createSearchTestContent(page);

      // 打开搜索
      await page.click('[data-testid="search-button"]');
      await page.fill('[data-testid="search-input"]', '测试内容');
      await page.press('[data-testid="search-input"]', 'Enter');

      // 验证搜索结果
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-result-item"]')).toHaveCount(2);
    });

    test('应该能够使用高级搜索语法', async () => {
      await createSearchTestContent(page);

      // 测试标题搜索
      await page.click('[data-testid="search-button"]');
      await page.fill('[data-testid="search-input"]', 'title:"搜索测试页面1"');
      await page.press('[data-testid="search-input"]', 'Enter');

      await expect(page.locator('[data-testid="search-result-item"]')).toHaveCount(1);

      // 测试标签搜索
      await page.fill('[data-testid="search-input"]', 'tag:测试');
      await page.press('[data-testid="search-input"]', 'Enter');

      await expect(page.locator('[data-testid="search-result-item"]')).toHaveCount(2);

      // 测试组合搜索
      await page.fill('[data-testid="search-input"]', '内容 AND tag:测试');
      await page.press('[data-testid="search-input"]', 'Enter');

      await expect(page.locator('[data-testid="search-result-item"]')).toHaveCount(2);
    });

    test('应该能够使用搜索过滤器', async () => {
      await createSearchTestContent(page);

      await page.click('[data-testid="search-button"]');
      await page.click('[data-testid="advanced-search-toggle"]');

      // 使用日期过滤器
      await page.fill('[data-testid="date-filter-start"]', '2024-01-01');
      await page.fill('[data-testid="date-filter-end"]', '2024-12-31');

      // 使用类型过滤器
      await page.check('[data-testid="filter-type-page"]');
      await page.uncheck('[data-testid="filter-type-block"]');

      await page.fill('[data-testid="search-input"]', '测试');
      await page.press('[data-testid="search-input"]', 'Enter');

      // 验证过滤结果
      const results = page.locator('[data-testid="search-result-item"]');
      await expect(results).toHaveCount(2);
      
      for (let i = 0; i < await results.count(); i++) {
        await expect(results.nth(i).locator('[data-testid="result-type"]')).toContainText('page');
      }
    });
  });

  test.describe('批量操作', () => {
    test('应该能够执行批量重命名', async () => {
      // 创建多个页面
      await createMultiplePages(page);

      // 打开批量操作面板
      await page.click('[data-testid="batch-operations-button"]');
      await expect(page.locator('[data-testid="batch-operations-panel"]')).toBeVisible();

      // 选择页面
      await page.check('[data-testid="batch-item-checkbox"]:nth-child(1)');
      await page.check('[data-testid="batch-item-checkbox"]:nth-child(2)');

      // 选择重命名操作
      await page.click('[data-testid="batch-operation-rename"]');

      // 设置重命名参数
      await page.fill('[data-testid="rename-pattern"]', '批量测试');
      await page.fill('[data-testid="rename-replacement"]', '重命名测试');

      // 预览操作
      await page.click('[data-testid="batch-preview-button"]');
      await expect(page.locator('[data-testid="batch-preview"]')).toBeVisible();

      // 执行操作
      await page.click('[data-testid="batch-execute-button"]');
      await expect(page.locator('[data-testid="batch-success-message"]')).toBeVisible();
    });

    test('应该能够检查链接一致性', async () => {
      // 创建有问题的链接
      await createInconsistentLinks(page);

      // 打开一致性检查
      await page.click('[data-testid="consistency-check-button"]');
      await expect(page.locator('[data-testid="consistency-report"]')).toBeVisible();

      // 验证检测到的问题
      await expect(page.locator('[data-testid="broken-links-count"]')).toContainText('1');

      // 执行自动修复
      await page.click('[data-testid="auto-fix-button"]');
      await expect(page.locator('[data-testid="fix-success-message"]')).toBeVisible();
    });
  });

  test.describe('插件系统', () => {
    test('应该能够安装和激活插件', async () => {
      // 打开插件管理
      await page.click('[data-testid="plugin-manager-button"]');
      await expect(page.locator('[data-testid="plugin-manager"]')).toBeVisible();

      // 搜索插件
      await page.fill('[data-testid="plugin-search"]', '主题');
      await page.press('[data-testid="plugin-search"]', 'Enter');

      // 安装插件
      await page.click('[data-testid="install-plugin-button"]:first-child');
      await expect(page.locator('[data-testid="install-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="install-success"]')).toBeVisible();

      // 激活插件
      await page.click('[data-testid="activate-plugin-button"]');
      await expect(page.locator('[data-testid="plugin-active-badge"]')).toBeVisible();
    });
  });

  test.describe('响应式设计', () => {
    test('应该在移动设备上正常工作', async () => {
      // 设置移动设备视口
      await page.setViewportSize({ width: 375, height: 667 });

      // 验证移动端导航
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

      // 测试移动端搜索
      await page.click('[data-testid="mobile-search-button"]');
      await expect(page.locator('[data-testid="mobile-search-overlay"]')).toBeVisible();

      // 测试移动端图谱
      await page.click('[data-testid="mobile-graph-button"]');
      await expect(page.locator('[data-testid="mobile-graph-view"]')).toBeVisible();
    });
  });

  // 辅助函数
  async function createLinkedPages(page: Page) {
    // 创建页面1
    await page.click('[data-testid="new-page-button"]');
    await page.fill('[data-testid="page-title-input"]', '图谱测试页面1');
    await page.fill('[data-testid="page-content-editor"]', '链接到[[图谱测试页面2]]和[[图谱测试页面3]]');
    await page.click('[data-testid="save-page-button"]');

    // 创建页面2
    await page.click('[data-testid="new-page-button"]');
    await page.fill('[data-testid="page-title-input"]', '图谱测试页面2');
    await page.fill('[data-testid="page-content-editor"]', '链接回[[图谱测试页面1]]');
    await page.click('[data-testid="save-page-button"]');

    // 创建页面3
    await page.click('[data-testid="new-page-button"]');
    await page.fill('[data-testid="page-title-input"]', '图谱测试页面3');
    await page.fill('[data-testid="page-content-editor"]', '独立页面');
    await page.click('[data-testid="save-page-button"]');
  }

  async function createSearchTestContent(page: Page) {
    // 创建搜索测试页面1
    await page.click('[data-testid="new-page-button"]');
    await page.fill('[data-testid="page-title-input"]', '搜索测试页面1');
    await page.fill('[data-testid="page-content-editor"]', '这是测试内容，包含重要信息');
    await page.fill('[data-testid="page-tags-input"]', '测试,重要');
    await page.click('[data-testid="save-page-button"]');

    // 创建搜索测试页面2
    await page.click('[data-testid="new-page-button"]');
    await page.fill('[data-testid="page-title-input"]', '搜索测试页面2');
    await page.fill('[data-testid="page-content-editor"]', '另一个测试内容，用于验证搜索功能');
    await page.fill('[data-testid="page-tags-input"]', '测试,验证');
    await page.click('[data-testid="save-page-button"]');
  }

  async function createMultiplePages(page: Page) {
    for (let i = 1; i <= 3; i++) {
      await page.click('[data-testid="new-page-button"]');
      await page.fill('[data-testid="page-title-input"]', `批量测试页面${i}`);
      await page.fill('[data-testid="page-content-editor"]', `这是批量测试页面${i}的内容`);
      await page.click('[data-testid="save-page-button"]');
    }
  }

  async function createInconsistentLinks(page: Page) {
    await page.click('[data-testid="new-page-button"]');
    await page.fill('[data-testid="page-title-input"]', '有问题的页面');
    await page.fill('[data-testid="page-content-editor"]', '这个页面链接到[[不存在的页面]]');
    await page.click('[data-testid="save-page-button"]');
  }
});
