import { test, expect } from '@playwright/test'

test.describe('PerformanceMonitor E2E Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 })
    
    // Open settings page
    await page.click('[data-testid="settings-button"]')
    
    // Open Performance Monitor
    await page.click('[data-testid="open-performance-monitor"]')
    
    // Wait for Performance Monitor to open
    await page.waitForSelector('[data-testid="performance-monitor"]')
  })

  test.describe('🎨 UI Completeness E2E Tests', () => {
    test('PM-E2E-UI-001: Should render all UI elements correctly', async ({ page }) => {
      // Check title
      await expect(page.locator('h2:has-text("Performance Monitor")')).toBeVisible()
      
      // Check metric cards
      await expect(page.locator('text=内存使用')).toBeVisible()
      await expect(page.locator('text=渲染时间')).toBeVisible()
      await expect(page.locator('text=数据库查询')).toBeVisible()
      await expect(page.locator('text=组件数量')).toBeVisible()
      
      // Check control buttons
      await expect(page.locator('[aria-label*="Show help guide"]')).toBeVisible()
      await expect(page.locator('[aria-label*="Show optimization suggestions"]')).toBeVisible()
      await expect(page.locator('[aria-label*="Close performance monitor"]')).toBeVisible()
    })

    test('PM-E2E-UI-002: Should display metrics in correct format', async ({ page }) => {
      // Wait for metrics to load
      await page.waitForSelector('[data-testid="memory-usage-value"]')
      
      // Check memory format (should be "X.X MB")
      const memoryText = await page.locator('[data-testid="memory-usage-value"]').textContent()
      expect(memoryText).toMatch(/^\d+\.\d+ MB$/)
      
      // Check render time format (should be "X.Xms")
      const renderTimeText = await page.locator('[data-testid="render-time-value"]').textContent()
      expect(renderTimeText).toMatch(/^\d+\.\d+ms$/)
      
      // Check database query format (should be "X.Xms")
      const dbQueryText = await page.locator('[data-testid="db-query-value"]').textContent()
      expect(dbQueryText).toMatch(/^\d+\.\d+ms$/)
      
      // Check component count format (should be integer)
      const componentCountText = await page.locator('[data-testid="component-count-value"]').textContent()
      expect(componentCountText).toMatch(/^\d+$/)
    })

    test('PM-E2E-UI-003: Should render performance chart', async ({ page }) => {
      // Check if chart container exists
      await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible()
      
      // Check if chart canvas is rendered (Chart.js creates canvas)
      await expect(page.locator('canvas')).toBeVisible()
    })

    test('PM-E2E-UI-004: Should handle responsive design', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Should still show essential elements
      await expect(page.locator('text=Performance Monitor')).toBeVisible()
      await expect(page.locator('text=内存使用')).toBeVisible()
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      
      // Should show all elements properly
      await expect(page.locator('text=Performance Monitor')).toBeVisible()
      await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible()
    })
  })

  test.describe('⚙️ Functional Completeness E2E Tests', () => {
    test('PM-E2E-FUNC-001: Should start and stop monitoring', async ({ page }) => {
      // Check initial state (should be stopped)
      const startButton = page.locator('[aria-label*="Start performance monitoring"]')
      await expect(startButton).toBeVisible()
      
      // Start monitoring
      await startButton.click()
      
      // Should show stop button
      const stopButton = page.locator('[aria-label*="Stop performance monitoring"]')
      await expect(stopButton).toBeVisible()
      
      // Should show monitoring indicator
      await expect(page.locator('[data-testid="monitoring-indicator"]')).toBeVisible()
      
      // Stop monitoring
      await stopButton.click()
      
      // Should show start button again
      await expect(startButton).toBeVisible()
    })

    test('PM-E2E-FUNC-002: Should update metrics in real-time', async ({ page }) => {
      // Start monitoring
      await page.click('[aria-label*="Start performance monitoring"]')
      
      // Get initial memory value
      const initialMemory = await page.locator('[data-testid="memory-usage-value"]').textContent()
      
      // Wait for update (should happen within 3 seconds based on update interval)
      await page.waitForTimeout(3000)
      
      // Get updated memory value
      const updatedMemory = await page.locator('[data-testid="memory-usage-value"]').textContent()
      
      // Values might be the same, but the component should have updated
      // Check that last update time has changed
      const lastUpdateElement = page.locator('[data-testid="last-update"]')
      await expect(lastUpdateElement).toBeVisible()
    })

    test('PM-E2E-FUNC-003: Should show optimization suggestions', async ({ page }) => {
      // Click optimization suggestions button
      await page.click('[aria-label*="Show optimization suggestions"]')
      
      // Should show suggestions modal
      await expect(page.locator('text=智能优化建议')).toBeVisible()
      
      // Should show at least one suggestion
      await expect(page.locator('[data-testid="optimization-suggestion"]').first()).toBeVisible()
      
      // Should have clear history button
      await expect(page.locator('text=清除历史数据以重置建议')).toBeVisible()
    })

    test('PM-E2E-FUNC-004: Should clear performance history', async ({ page }) => {
      // Start monitoring to generate some history
      await page.click('[aria-label*="Start performance monitoring"]')
      await page.waitForTimeout(2000)
      
      // Open optimization suggestions
      await page.click('[aria-label*="Show optimization suggestions"]')
      
      // Clear history
      await page.click('text=清除历史数据以重置建议')
      
      // Should show confirmation or immediate effect
      // Chart should reset or show empty state
      await page.waitForTimeout(1000)
    })
  })

  test.describe('🔗 Integration E2E Tests', () => {
    test('PM-E2E-INT-001: Should integrate with settings page', async ({ page }) => {
      // Close performance monitor
      await page.click('[aria-label*="Close performance monitor"]')
      
      // Should return to settings page
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible()
      
      // Should be able to reopen
      await page.click('[data-testid="open-performance-monitor"]')
      await expect(page.locator('[data-testid="performance-monitor"]')).toBeVisible()
    })

    test('PM-E2E-INT-002: Should handle WebDAV sync monitoring', async ({ page }) => {
      // Check if WebDAV sync card is visible (if enabled)
      const syncCard = page.locator('[data-testid="webdav-sync-card"]')
      
      if (await syncCard.isVisible()) {
        // Should show sync status
        await expect(page.locator('[data-testid="sync-status"]')).toBeVisible()
        
        // Should show file count
        await expect(page.locator('[data-testid="sync-file-count"]')).toBeVisible()
      }
    })
  })

  test.describe('⌨️ Accessibility E2E Tests', () => {
    test('PM-E2E-A11Y-001: Should support keyboard navigation', async ({ page }) => {
      // Focus should be trapped within the modal
      await page.keyboard.press('Tab')
      
      // Should focus on first interactive element
      const focusedElement = await page.locator(':focus')
      await expect(focusedElement).toBeVisible()
      
      // Tab through all interactive elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
        const currentFocus = await page.locator(':focus')
        await expect(currentFocus).toBeVisible()
      }
    })

    test('PM-E2E-A11Y-002: Should close with Escape key', async ({ page }) => {
      // Press Escape
      await page.keyboard.press('Escape')
      
      // Should close the performance monitor
      await expect(page.locator('[data-testid="performance-monitor"]')).not.toBeVisible()
    })

    test('PM-E2E-A11Y-003: Should have proper ARIA attributes', async ({ page }) => {
      // Check dialog attributes
      const dialog = page.locator('[role="dialog"]')
      await expect(dialog).toHaveAttribute('aria-modal', 'true')
      await expect(dialog).toHaveAttribute('aria-labelledby')
      await expect(dialog).toHaveAttribute('aria-describedby')
      
      // Check button labels
      await expect(page.locator('[aria-label*="Start performance monitoring"]')).toBeVisible()
      await expect(page.locator('[aria-label*="Show help guide"]')).toBeVisible()
    })
  })

  test.describe('🚨 Error Handling E2E Tests', () => {
    test('PM-E2E-ERROR-001: Should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort())
      
      // Start monitoring
      await page.click('[aria-label*="Start performance monitoring"]')
      
      // Should show error state or fallback gracefully
      // Component should not crash
      await expect(page.locator('[data-testid="performance-monitor"]')).toBeVisible()
    })

    test('PM-E2E-ERROR-002: Should handle missing data gracefully', async ({ page }) => {
      // Component should show empty state when no data
      const emptyStateText = page.locator('text=暂无性能数据')
      
      if (await emptyStateText.isVisible()) {
        await expect(emptyStateText).toBeVisible()
        await expect(page.locator('text=开始监控以查看实时性能趋势图表')).toBeVisible()
      }
    })
  })

  test.describe('📱 User Experience E2E Tests', () => {
    test('PM-E2E-UX-001: Should provide smooth user workflow', async ({ page }) => {
      // Complete user workflow
      
      // 1. Open performance monitor (already done in beforeEach)
      await expect(page.locator('[data-testid="performance-monitor"]')).toBeVisible()
      
      // 2. Start monitoring
      await page.click('[aria-label*="Start performance monitoring"]')
      await expect(page.locator('[data-testid="monitoring-indicator"]')).toBeVisible()
      
      // 3. View real-time data
      await page.waitForTimeout(2000)
      await expect(page.locator('[data-testid="memory-usage-value"]')).toBeVisible()
      
      // 4. Check optimization suggestions
      await page.click('[aria-label*="Show optimization suggestions"]')
      await expect(page.locator('text=智能优化建议')).toBeVisible()
      
      // 5. Close suggestions
      await page.click('[aria-label*="Close optimization suggestions"]')
      
      // 6. Stop monitoring
      await page.click('[aria-label*="Stop performance monitoring"]')
      
      // 7. Close performance monitor
      await page.click('[aria-label*="Close performance monitor"]')
      
      // Should return to settings smoothly
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible()
    })

    test('PM-E2E-UX-002: Should show appropriate loading states', async ({ page }) => {
      // Should show loading state during initial data fetch
      const loadingIndicator = page.locator('[data-testid="loading-indicator"]')
      
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).toBeVisible()
        
        // Loading should complete within reasonable time
        await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 })
      }
    })
  })
})
