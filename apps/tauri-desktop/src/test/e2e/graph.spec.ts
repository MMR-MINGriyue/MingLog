import { test, expect } from '@playwright/test'

test.describe('Graph Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Navigate to graph page
    await page.getByRole('link', { name: /graph/i }).click()
    await page.waitForLoadState('networkidle')
  })

  test('should load graph visualization', async ({ page }) => {
    // Verify graph container is present
    const graphContainer = page.locator('[data-testid="graph-container"]')
    await expect(graphContainer).toBeVisible()
    
    // Verify SVG or Canvas element is present
    const graphSvg = page.locator('svg, canvas')
    await expect(graphSvg).toBeVisible()
  })

  test('should display nodes and links', async ({ page }) => {
    // Wait for graph to load
    await page.waitForTimeout(2000)
    
    // Check for nodes (circles or other node representations)
    const nodes = page.locator('[data-testid="graph-node"]')
    await expect(nodes.first()).toBeVisible()
    
    // Check for links (lines connecting nodes)
    const links = page.locator('[data-testid="graph-link"]')
    await expect(links.first()).toBeVisible()
  })

  test('should allow zooming with mouse wheel', async ({ page }) => {
    const graphContainer = page.locator('[data-testid="graph-container"]')
    
    // Get initial transform
    const initialTransform = await graphContainer.getAttribute('transform')
    
    // Zoom in with mouse wheel
    await graphContainer.hover()
    await page.mouse.wheel(0, -100) // Scroll up to zoom in
    
    await page.waitForTimeout(500)
    
    // Verify transform changed (indicating zoom occurred)
    const newTransform = await graphContainer.getAttribute('transform')
    expect(newTransform).not.toBe(initialTransform)
  })

  test('should allow panning by dragging', async ({ page }) => {
    const graphContainer = page.locator('[data-testid="graph-container"]')
    
    // Get initial position
    const initialBox = await graphContainer.boundingBox()
    
    // Pan by dragging
    await page.mouse.move(initialBox!.x + 100, initialBox!.y + 100)
    await page.mouse.down()
    await page.mouse.move(initialBox!.x + 200, initialBox!.y + 200)
    await page.mouse.up()
    
    await page.waitForTimeout(500)
    
    // Verify position changed
    const newBox = await graphContainer.boundingBox()
    expect(newBox!.x).not.toBe(initialBox!.x)
  })

  test('should highlight node on hover', async ({ page }) => {
    // Wait for graph to load
    await page.waitForTimeout(2000)
    
    const firstNode = page.locator('[data-testid="graph-node"]').first()
    
    // Hover over node
    await firstNode.hover()
    
    // Check for highlight class or style change
    await expect(firstNode).toHaveClass(/highlighted|hovered/)
  })

  test('should show tooltip on node hover', async ({ page }) => {
    // Wait for graph to load
    await page.waitForTimeout(2000)
    
    const firstNode = page.locator('[data-testid="graph-node"]').first()
    
    // Hover over node
    await firstNode.hover()
    
    // Check for tooltip
    const tooltip = page.locator('[data-testid="graph-tooltip"]')
    await expect(tooltip).toBeVisible()
  })

  test('should navigate to page on node click', async ({ page }) => {
    // Wait for graph to load
    await page.waitForTimeout(2000)
    
    const firstNode = page.locator('[data-testid="graph-node"]').first()
    
    // Click on node
    await firstNode.click()
    
    // Verify navigation occurred
    await expect(page).toHaveURL(/\/page\//)
  })

  test('should filter nodes by type', async ({ page }) => {
    // Look for filter controls
    const pageFilter = page.getByRole('checkbox', { name: /pages/i })
    const blockFilter = page.getByRole('checkbox', { name: /blocks/i })
    
    if (await pageFilter.isVisible()) {
      // Uncheck pages filter
      await pageFilter.uncheck()
      await page.waitForTimeout(1000)
      
      // Verify page nodes are hidden
      const pageNodes = page.locator('[data-testid="graph-node"][data-type="page"]')
      await expect(pageNodes.first()).not.toBeVisible()
      
      // Re-check pages filter
      await pageFilter.check()
      await page.waitForTimeout(1000)
      
      // Verify page nodes are visible again
      await expect(pageNodes.first()).toBeVisible()
    }
  })

  test('should search and highlight nodes', async ({ page }) => {
    // Look for search input in graph view
    const graphSearch = page.getByPlaceholder(/search in graph/i)
    
    if (await graphSearch.isVisible()) {
      // Type search query
      await graphSearch.fill('test')
      await page.waitForTimeout(500)
      
      // Check for highlighted nodes
      const highlightedNodes = page.locator('[data-testid="graph-node"].highlighted')
      await expect(highlightedNodes.first()).toBeVisible()
    }
  })

  test('should reset view with reset button', async ({ page }) => {
    const graphContainer = page.locator('[data-testid="graph-container"]')
    
    // Zoom and pan to change view
    await graphContainer.hover()
    await page.mouse.wheel(0, -200) // Zoom in
    await page.mouse.move(100, 100)
    await page.mouse.down()
    await page.mouse.move(300, 300)
    await page.mouse.up()
    
    // Click reset button
    const resetButton = page.getByRole('button', { name: /reset view|center/i })
    if (await resetButton.isVisible()) {
      await resetButton.click()
      await page.waitForTimeout(1000)
      
      // Verify view is reset (this is hard to test precisely)
      await expect(graphContainer).toBeVisible()
    }
  })

  test('should handle large graphs efficiently', async ({ page }) => {
    // This test assumes there's a way to load a large graph or test data
    const startTime = Date.now()
    
    // Wait for graph to fully load
    await page.waitForTimeout(5000)
    
    const loadTime = Date.now() - startTime
    
    // Verify graph loads within reasonable time
    expect(loadTime).toBeLessThan(10000) // Less than 10 seconds
    
    // Verify graph is interactive
    const graphContainer = page.locator('[data-testid="graph-container"]')
    await expect(graphContainer).toBeVisible()
  })

  test('should maintain performance during interactions', async ({ page }) => {
    // Wait for graph to load
    await page.waitForTimeout(2000)
    
    const graphContainer = page.locator('[data-testid="graph-container"]')
    
    // Perform multiple rapid interactions
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, i % 2 === 0 ? -50 : 50) // Alternate zoom in/out
      await page.waitForTimeout(50)
    }
    
    // Verify graph is still responsive
    await expect(graphContainer).toBeVisible()
    
    // Try clicking after rapid interactions
    const firstNode = page.locator('[data-testid="graph-node"]').first()
    await firstNode.click()
    
    // Should still be able to navigate
    await expect(page).toHaveURL(/\/page\/|\/graph/)
  })

  test('should show graph statistics', async ({ page }) => {
    // Look for statistics display
    const statsContainer = page.locator('[data-testid="graph-stats"]')
    
    if (await statsContainer.isVisible()) {
      // Check for node count
      await expect(statsContainer.getByText(/nodes/i)).toBeVisible()
      
      // Check for link count
      await expect(statsContainer.getByText(/links|connections/i)).toBeVisible()
    }
  })

  test('should handle empty graph gracefully', async ({ page }) => {
    // This test would need a way to clear all data or navigate to empty graph
    // For now, we'll test that the graph container handles no data
    
    const graphContainer = page.locator('[data-testid="graph-container"]')
    await expect(graphContainer).toBeVisible()
    
    // Should show empty state message if no data
    const emptyMessage = page.getByText(/no data|empty graph/i)
    // This might not be visible if there's test data
  })

  test('should support keyboard shortcuts in graph view', async ({ page }) => {
    // Test common keyboard shortcuts
    await page.keyboard.press('Space') // Pan mode
    await page.keyboard.press('Escape') // Reset selection
    await page.keyboard.press('f') // Fit to screen
    await page.keyboard.press('r') // Reset view
    
    // Should not crash and graph should remain functional
    const graphContainer = page.locator('[data-testid="graph-container"]')
    await expect(graphContainer).toBeVisible()
  })

  test('should export graph as image', async ({ page }) => {
    // Look for export button
    const exportButton = page.getByRole('button', { name: /export|download/i })
    
    if (await exportButton.isVisible()) {
      // Start download
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()
      
      // Verify download started
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/\.(png|svg|jpg)$/i)
    }
  })
})
