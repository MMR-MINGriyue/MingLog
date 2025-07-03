import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

/**
 * 错误报告系统端到端测试
 */
test.describe('错误报告系统', () => {
  let electronApp: any;
  let page: any;

  test.beforeAll(async () => {
    // 启动Electron应用
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../src-tauri/target/debug/minglog-desktop.exe')],
      timeout: 30000,
    });
    
    // 获取第一个窗口
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('应该能够启用和禁用错误报告', async () => {
    // 导航到设置页面
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="error-reporting-tab"]');

    // 检查错误报告开关
    const toggleSwitch = page.locator('[data-testid="error-reporting-toggle"]');
    await expect(toggleSwitch).toBeVisible();

    // 启用错误报告
    await toggleSwitch.click();
    
    // 验证状态变化
    await expect(toggleSwitch).toBeChecked();
    
    // 验证隐私说明显示
    const privacyNotice = page.locator('[data-testid="privacy-notice"]');
    await expect(privacyNotice).toBeVisible();
    await expect(privacyNotice).toContainText('隐私保护');

    // 禁用错误报告
    await toggleSwitch.click();
    await expect(toggleSwitch).not.toBeChecked();
  });

  test('应该能够运行错误测试并显示结果', async () => {
    // 确保在错误报告设置页面
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="error-reporting-tab"]');

    // 启用错误报告
    const toggleSwitch = page.locator('[data-testid="error-reporting-toggle"]');
    if (!(await toggleSwitch.isChecked())) {
      await toggleSwitch.click();
    }

    // 运行错误测试
    const runTestsButton = page.locator('[data-testid="run-error-tests"]');
    await expect(runTestsButton).toBeVisible();
    await runTestsButton.click();

    // 等待测试完成
    await expect(runTestsButton).toContainText('运行中...');
    await expect(runTestsButton).toContainText('运行所有测试', { timeout: 30000 });

    // 验证测试结果显示
    const testResults = page.locator('[data-testid="test-results"]');
    await expect(testResults).toBeVisible();

    // 检查各个测试场景的结果
    const testScenarios = [
      'DatabaseConnectionFailure',
      'FilePermissionError',
      'NetworkTimeout',
      'InvalidInput',
      'ConcurrencyIssue',
      'PerformanceDegradation'
    ];

    for (const scenario of testScenarios) {
      const resultCard = page.locator(`[data-testid="result-${scenario}"]`);
      await expect(resultCard).toBeVisible();
      
      // 验证结果卡片包含必要信息
      await expect(resultCard.locator('.scenario-name')).toBeVisible();
      await expect(resultCard.locator('.status')).toBeVisible();
      await expect(resultCard.locator('.duration')).toBeVisible();
      await expect(resultCard.locator('.error-reported')).toBeVisible();
      await expect(resultCard.locator('.recovery-successful')).toBeVisible();
    }
  });

  test('应该能够触发前端错误并被错误边界捕获', async () => {
    // 注入一个会导致错误的脚本
    await page.evaluate(() => {
      // 创建一个会抛出错误的组件
      const errorButton = document.createElement('button');
      errorButton.id = 'trigger-error';
      errorButton.textContent = '触发错误';
      errorButton.onclick = () => {
        throw new Error('测试错误：这是一个故意触发的错误');
      };
      document.body.appendChild(errorButton);
    });

    // 点击错误按钮
    await page.click('#trigger-error');

    // 验证错误边界是否显示
    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    await expect(errorBoundary).toBeVisible({ timeout: 5000 });

    // 验证错误信息显示
    await expect(errorBoundary).toContainText('应用程序遇到了错误');
    await expect(errorBoundary).toContainText('测试错误');

    // 验证恢复按钮
    const retryButton = page.locator('[data-testid="error-retry-button"]');
    const reloadButton = page.locator('[data-testid="error-reload-button"]');
    
    await expect(retryButton).toBeVisible();
    await expect(reloadButton).toBeVisible();

    // 测试重试功能
    await retryButton.click();
    
    // 验证错误边界消失
    await expect(errorBoundary).not.toBeVisible();
  });

  test('应该正确处理网络错误', async () => {
    // 模拟网络错误
    await page.route('**/*', route => {
      if (route.request().url().includes('api')) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    // 尝试执行需要网络的操作
    await page.click('[data-testid="sync-button"]');

    // 验证网络错误处理
    const errorMessage = page.locator('[data-testid="network-error"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toContainText('网络连接错误');

    // 验证重试机制
    const retryButton = page.locator('[data-testid="retry-network"]');
    await expect(retryButton).toBeVisible();
  });

  test('应该保护用户隐私数据', async () => {
    // 启用错误报告
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="error-reporting-tab"]');
    
    const toggleSwitch = page.locator('[data-testid="error-reporting-toggle"]');
    if (!(await toggleSwitch.isChecked())) {
      await toggleSwitch.click();
    }

    // 验证隐私保护设置
    const includePersonalData = page.locator('[data-testid="include-personal-data"]');
    await expect(includePersonalData).not.toBeChecked();

    // 验证隐私说明
    const privacyItems = page.locator('[data-testid="privacy-notice"] li');
    await expect(privacyItems).toHaveCount(4);
    
    const privacyTexts = await privacyItems.allTextContents();
    expect(privacyTexts).toContain(expect.stringContaining('不会收集任何个人身份信息'));
    expect(privacyTexts).toContain(expect.stringContaining('敏感数据会被自动脱敏'));
    expect(privacyTexts).toContain(expect.stringContaining('可以随时禁用'));
    expect(privacyTexts).toContain(expect.stringContaining('数据传输都经过加密'));
  });

  test('应该显示错误统计和分析', async () => {
    // 导航到错误报告页面
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="error-reporting-tab"]');

    // 运行一些错误测试以生成数据
    const runTestsButton = page.locator('[data-testid="run-error-tests"]');
    await runTestsButton.click();
    
    // 等待测试完成
    await expect(runTestsButton).toContainText('运行所有测试', { timeout: 30000 });

    // 验证错误统计显示
    const errorStats = page.locator('[data-testid="error-statistics"]');
    if (await errorStats.isVisible()) {
      // 验证统计信息包含必要字段
      await expect(errorStats.locator('[data-testid="total-errors"]')).toBeVisible();
      await expect(errorStats.locator('[data-testid="error-types"]')).toBeVisible();
      await expect(errorStats.locator('[data-testid="recovery-rate"]')).toBeVisible();
    }
  });

  test('应该能够导出错误报告', async () => {
    // 导航到错误报告页面
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="error-reporting-tab"]');

    // 查找导出按钮
    const exportButton = page.locator('[data-testid="export-error-report"]');
    if (await exportButton.isVisible()) {
      // 设置下载监听
      const downloadPromise = page.waitForEvent('download');
      
      // 点击导出按钮
      await exportButton.click();
      
      // 等待下载完成
      const download = await downloadPromise;
      
      // 验证文件名
      expect(download.suggestedFilename()).toMatch(/error-report.*\.json/);
    }
  });

  test('应该在应用崩溃后能够恢复', async () => {
    // 模拟应用崩溃
    await page.evaluate(() => {
      // 触发一个严重错误
      setTimeout(() => {
        throw new Error('模拟应用崩溃');
      }, 100);
    });

    // 等待错误边界显示
    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    await expect(errorBoundary).toBeVisible({ timeout: 5000 });

    // 点击重新加载
    const reloadButton = page.locator('[data-testid="error-reload-button"]');
    await reloadButton.click();

    // 验证应用恢复正常
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
  });

  test('性能测试：错误报告不应显著影响应用性能', async () => {
    // 启用错误报告
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="error-reporting-tab"]');
    
    const toggleSwitch = page.locator('[data-testid="error-reporting-toggle"]');
    if (!(await toggleSwitch.isChecked())) {
      await toggleSwitch.click();
    }

    // 测量基本操作的性能
    const startTime = Date.now();
    
    // 执行一系列操作
    await page.click('[data-testid="home-button"]');
    await page.click('[data-testid="notes-button"]');
    await page.click('[data-testid="graph-button"]');
    await page.click('[data-testid="settings-button"]');
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    // 验证性能在可接受范围内（这里设置为5秒）
    expect(duration).toBeLessThan(5000);
    
    console.log(`操作耗时: ${duration}ms`);
  });
});
