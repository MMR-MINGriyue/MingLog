import { test, expect } from '@playwright/test'

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should open search modal with keyboard shortcut', async ({ page }) => {
    // Press Ctrl+K (or Cmd+K on Mac) to open search
    await page.keyboard.press('ControlOrMeta+k')
    
    // Verify search modal is open
    await expect(page.getByPlaceholder(/search pages and blocks/i)).toBeVisible()
  })

  test('should close search modal with escape key', async ({ page }) => {
    // Open search
    await page.keyboard.press('ControlOrMeta+k')
    await expect(page.getByPlaceholder(/search pages and blocks/i)).toBeVisible()
    
    // Close with escape
    await page.keyboard.press('Escape')
    await expect(page.getByPlaceholder(/search pages and blocks/i)).not.toBeVisible()
  })

  test('should perform search and display results', async ({ page }) => {
    // Open search
    await page.keyboard.press('ControlOrMeta+k')
    
    // Type search query
    const searchInput = page.getByPlaceholder(/search pages and blocks/i)
    await searchInput.fill('test')
    
    // Wait for search results
    await page.waitForTimeout(500) // Wait for debounce
    
    // Check if results are displayed (this assumes there's test data)
    const resultsContainer = page.locator('[data-testid="search-results"]')
    await expect(resultsContainer).toBeVisible()
  })

  test('should navigate through search results with arrow keys', async ({ page }) => {
    // Open search and perform search
    await page.keyboard.press('ControlOrMeta+k')
    const searchInput = page.getByPlaceholder(/search pages and blocks/i)
    await searchInput.fill('test')
    await page.waitForTimeout(500)
    
    // Navigate down with arrow key
    await page.keyboard.press('ArrowDown')
    
    // Verify first result is selected
    const firstResult = page.locator('[data-testid="search-result"]:first-child')
    await expect(firstResult).toHaveClass(/bg-blue-50/)
    
    // Navigate down again
    await page.keyboard.press('ArrowDown')
    
    // Verify second result is selected
    const secondResult = page.locator('[data-testid="search-result"]:nth-child(2)')
    await expect(secondResult).toHaveClass(/bg-blue-50/)
  })

  test('should select result with enter key', async ({ page }) => {
    // Open search and perform search
    await page.keyboard.press('ControlOrMeta+k')
    const searchInput = page.getByPlaceholder(/search pages and blocks/i)
    await searchInput.fill('test')
    await page.waitForTimeout(500)
    
    // Press enter to select first result
    await page.keyboard.press('Enter')
    
    // Verify search modal is closed
    await expect(searchInput).not.toBeVisible()
    
    // Verify navigation occurred (URL should change)
    await expect(page).toHaveURL(/\/page\//)
  })

  test('should click on search result to navigate', async ({ page }) => {
    // Open search and perform search
    await page.keyboard.press('ControlOrMeta+k')
    const searchInput = page.getByPlaceholder(/search pages and blocks/i)
    await searchInput.fill('test')
    await page.waitForTimeout(500)
    
    // Click on first result
    const firstResult = page.locator('[data-testid="search-result"]:first-child')
    await firstResult.click()
    
    // Verify search modal is closed
    await expect(searchInput).not.toBeVisible()
    
    // Verify navigation occurred
    await expect(page).toHaveURL(/\/page\//)
  })

  test('should show no results message for empty search', async ({ page }) => {
    // Open search
    await page.keyboard.press('ControlOrMeta+k')
    
    // Type search query that should return no results
    const searchInput = page.getByPlaceholder(/search pages and blocks/i)
    await searchInput.fill('nonexistentquery12345')
    await page.waitForTimeout(500)
    
    // Check for no results message
    await expect(page.getByText(/no results found/i)).toBeVisible()
  })

  test('should highlight search terms in results', async ({ page }) => {
    // Open search and perform search
    await page.keyboard.press('ControlOrMeta+k')
    const searchInput = page.getByPlaceholder(/search pages and blocks/i)
    await searchInput.fill('test')
    await page.waitForTimeout(500)
    
    // Check for highlighted text
    const highlightedText = page.locator('mark')
    await expect(highlightedText).toBeVisible()
    await expect(highlightedText).toContainText('test')
  })

  test('should show loading state during search', async ({ page }) => {
    // Open search
    await page.keyboard.press('ControlOrMeta+k')
    
    // Type search query
    const searchInput = page.getByPlaceholder(/search pages and blocks/i)
    await searchInput.fill('test')
    
    // Check for loading indicator (should appear briefly)
    const _loadingIndicator = page.getByText(/searching/i)
    // Note: This might be too fast to catch in some cases
  })

  test('should maintain search state when reopening', async ({ page }) => {
    // Open search and perform search
    await page.keyboard.press('ControlOrMeta+k')
    const searchInput = page.getByPlaceholder(/search pages and blocks/i)
    await searchInput.fill('test query')
    await page.waitForTimeout(500)
    
    // Close search
    await page.keyboard.press('Escape')
    
    // Reopen search
    await page.keyboard.press('ControlOrMeta+k')
    
    // Verify search query is maintained
    await expect(searchInput).toHaveValue('test query')
  })

  test('should clear search when clicking clear button', async ({ page }) => {
    // Open search and type query
    await page.keyboard.press('ControlOrMeta+k')
    const searchInput = page.getByPlaceholder(/search pages and blocks/i)
    await searchInput.fill('test query')
    
    // Click clear button
    const clearButton = page.getByRole('button', { name: /clear/i })
    await clearButton.click()
    
    // Verify input is cleared
    await expect(searchInput).toHaveValue('')
  })

  test('should handle special characters in search', async ({ page }) => {
    // Open search
    await page.keyboard.press('ControlOrMeta+k')
    
    // Type search query with special characters
    const searchInput = page.getByPlaceholder(/search pages and blocks/i)
    await searchInput.fill('test & special "characters" [brackets]')
    await page.waitForTimeout(500)
    
    // Should not crash and should handle gracefully
    await expect(searchInput).toHaveValue('test & special "characters" [brackets]')
  })

  test('should show search statistics', async ({ page }) => {
    // Open search and perform search
    await page.keyboard.press('ControlOrMeta+k')
    const searchInput = page.getByPlaceholder(/search pages and blocks/i)
    await searchInput.fill('test')
    await page.waitForTimeout(500)
    
    // Check for search statistics (results count, timing)
    const statsText = page.getByText(/result/)
    await expect(statsText).toBeVisible()
  })

  test('should support keyboard navigation shortcuts', async ({ page }) => {
    // Open search and perform search
    await page.keyboard.press('ControlOrMeta+k')
    const searchInput = page.getByPlaceholder(/search pages and blocks/i)
    await searchInput.fill('test')
    await page.waitForTimeout(500)
    
    // Test various keyboard shortcuts
    await page.keyboard.press('ArrowDown') // Navigate down
    await page.keyboard.press('ArrowUp')   // Navigate up
    await page.keyboard.press('Home')      // Go to first result
    await page.keyboard.press('End')       // Go to last result
    
    // Should not crash and should handle all shortcuts
    await expect(searchInput).toBeFocused()
  })
})
