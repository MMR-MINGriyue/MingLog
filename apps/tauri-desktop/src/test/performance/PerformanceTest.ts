import { test, expect, Page } from '@playwright/test'
import { invoke } from '@tauri-apps/api/tauri'

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/')
  })

  test('Memory usage should be within acceptable limits', async () => {
    const systemInfo = await invoke<any>('get_system_info')
    const memoryUsage = systemInfo.memory.percentage

    expect(memoryUsage).toBeLessThan(80) // 内存使用率不应超过80%
  })

  test('CPU usage should be within acceptable limits', async () => {
    const systemInfo = await invoke<any>('get_system_info')
    const cpuUsage = systemInfo.cpu.usage

    expect(cpuUsage).toBeLessThan(80) // CPU使用率不应超过80%
  })

  test('Database operations should complete within time limits', async () => {
    const dbPerformance = await invoke<any>('measure_db_performance')

    expect(dbPerformance.write_time).toBeLessThan(100) // 写入操作应在100ms内完成
    expect(dbPerformance.read_time).toBeLessThan(50) // 读取操作应在50ms内完成
    expect(dbPerformance.index_time).toBeLessThan(75) // 索引操作应在75ms内完成
  })

  test('Page load time should be acceptable', async ({ page }: { page: Page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(2000) // 页面加载时间不应超过2秒
  })

  test('Search performance should be acceptable', async ({ page }: { page: Page }) => {
    await page.getByPlaceholder('搜索...').fill('test')
    
    const startTime = Date.now()
    await page.getByRole('listitem').first().waitFor()
    const searchTime = Date.now() - startTime
    
    expect(searchTime).toBeLessThan(500) // 搜索结果应在500ms内显示
  })

  test('Editor performance should be acceptable', async ({ page }: { page: Page }) => {
    await page.goto('/editor')
    
    const startTime = Date.now()
    await page.getByRole('textbox').type('This is a test content')
    const typeTime = Date.now() - startTime
    
    expect(typeTime).toBeLessThan(100) // 编辑器输入延迟不应超过100ms
  })

  test('Graph visualization should render efficiently', async ({ page }: { page: Page }) => {
    await page.goto('/graph')
    
    const startTime = Date.now()
    await page.getByTestId('graph-container').waitFor()
    const renderTime = Date.now() - startTime
    
    expect(renderTime).toBeLessThan(3000) // 图形可视化应在3秒内完成渲染
  })

  test('File operations should be performant', async () => {
    const startTime = Date.now()
    
    // 创建测试文件
    await invoke<void>('create_test_file', { content: 'test content' })
    
    // 读取文件
    await invoke<string>('read_test_file')
    
    // 更新文件
    await invoke<void>('update_test_file', { content: 'updated content' })
    
    // 删除文件
    await invoke<void>('delete_test_file')
    
    const operationTime = Date.now() - startTime
    expect(operationTime).toBeLessThan(1000) // 文件操作应在1秒内完成
  })

  test('Memory should not leak during extended usage', async ({ page }: { page: Page }) => {
    const initialMemory = (await invoke<any>('get_system_info')).memory.used
    
    // 模拟用户操作
    for (let i = 0; i < 10; i++) {
      await page.goto('/')
      await page.goto('/editor')
      await page.goto('/graph')
      await page.getByRole('textbox').type('Test content ' + i)
    }
    
    const finalMemory = (await invoke<any>('get_system_info')).memory.used
    const memoryIncrease = finalMemory - initialMemory
    
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 内存增长不应超过50MB
  })

  test('Application should handle concurrent operations', async ({ page }: { page: Page }) => {
    const startTime = Date.now()
    
    // 并发执行多个操作
    await Promise.all([
      page.goto('/editor'),
      invoke<any>('measure_db_performance'),
      invoke<any>('get_system_info'),
      page.getByPlaceholder('搜索...').fill('test')
    ])
    
    const concurrentTime = Date.now() - startTime
    expect(concurrentTime).toBeLessThan(3000) // 并发操作应在3秒内完成
  })
})

