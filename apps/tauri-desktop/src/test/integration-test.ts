/**
 * 集成功能测试脚本
 */

import { dataSyncService } from '../services/DataSyncService'
import { GraphData } from '@minglog/graph'
import {
  createTestGraphData,
  createTestEditorContent,
  validateGraphData,
  validateSearchIndex,
  performanceTest,
  generateTestReport
} from '../utils/testHelpers'

// 获取测试数据
const testGraphData = createTestGraphData()
const testEditorContent = createTestEditorContent()

// 测试结果接口
interface TestResult {
  name: string
  passed: boolean
  message: string
  duration: number
}

class IntegrationTester {
  private results: TestResult[] = []

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 开始集成功能测试...')

    await this.testDataSyncService()
    await this.testGraphDataValidation()
    await this.testGraphDataUpdate()
    await this.testEditorContentSync()
    await this.testSearchIndexUpdate()
    await this.testNodeSelection()
    await this.testPerformance()
    await this.testErrorHandling()

    this.printResults()
    return this.results
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now()
    try {
      await testFn()
      const duration = Date.now() - startTime
      this.results.push({
        name,
        passed: true,
        message: '测试通过',
        duration
      })
      console.log(`✅ ${name} - 通过 (${duration}ms)`)
    } catch (error) {
      const duration = Date.now() - startTime
      this.results.push({
        name,
        passed: false,
        message: error instanceof Error ? error.message : '未知错误',
        duration
      })
      console.log(`❌ ${name} - 失败: ${error instanceof Error ? error.message : error}`)
    }
  }

  private async testDataSyncService(): Promise<void> {
    await this.runTest('数据同步服务初始化', async () => {
      const state = dataSyncService.getState()
      if (!state) {
        throw new Error('数据同步服务状态为空')
      }
    })
  }

  private async testGraphDataValidation(): Promise<void> {
    await this.runTest('图谱数据结构验证', async () => {
      const validation = validateGraphData(testGraphData)
      if (!validation.valid) {
        throw new Error(`图谱数据验证失败: ${validation.errors.join(', ')}`)
      }
    })
  }

  private async testGraphDataUpdate(): Promise<void> {
    await this.runTest('图谱数据更新', async () => {
      await dataSyncService.updateGraphData(testGraphData)
      const state = dataSyncService.getState()
      
      if (!state.graphData) {
        throw new Error('图谱数据未更新')
      }
      
      if (state.graphData.nodes.length !== testGraphData.nodes.length) {
        throw new Error(`节点数量不匹配: 期望 ${testGraphData.nodes.length}, 实际 ${state.graphData.nodes.length}`)
      }
      
      if (state.graphData.links.length !== testGraphData.links.length) {
        throw new Error(`链接数量不匹配: 期望 ${testGraphData.links.length}, 实际 ${state.graphData.links.length}`)
      }
    })
  }

  private async testEditorContentSync(): Promise<void> {
    await this.runTest('编辑器内容同步', async () => {
      await dataSyncService.updateEditorContent('test-note-1', testEditorContent)
      
      // 检查图谱数据是否更新
      const state = dataSyncService.getState()
      if (!state.graphData) {
        throw new Error('图谱数据为空')
      }
      
      const updatedNode = state.graphData.nodes.find(node => node.id === 'test-note-1')
      if (!updatedNode) {
        throw new Error('未找到更新的节点')
      }
      
      // 检查内容是否包含提取的文本
      if (!updatedNode.content?.includes('测试标题')) {
        throw new Error('节点内容未正确更新')
      }
    })
  }

  private async testSearchIndexUpdate(): Promise<void> {
    await this.runTest('搜索索引更新', async () => {
      // 等待搜索索引更新
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const state = dataSyncService.getState()
      if (!state.searchIndex) {
        throw new Error('搜索索引未生成')
      }
      
      if (state.searchIndex.pages.length === 0) {
        throw new Error('搜索索引中没有页面')
      }
      
      if (state.searchIndex.tags.length === 0) {
        throw new Error('搜索索引中没有标签')
      }
    })
  }

  private async testNodeSelection(): Promise<void> {
    await this.runTest('节点选择功能', async () => {
      let eventFired = false

      const handler = () => {
        eventFired = true
      }

      dataSyncService.on('node-selected', handler)
      dataSyncService.selectNode('test-note-1')

      // 等待事件处理
      await new Promise(resolve => setTimeout(resolve, 10))

      dataSyncService.off('node-selected', handler)

      if (!eventFired) {
        throw new Error('节点选择事件未触发')
      }
    })
  }

  private async testPerformance(): Promise<void> {
    await this.runTest('性能测试', async () => {
      // 测试图谱数据更新性能
      const updateDuration = await performanceTest(async () => {
        await dataSyncService.updateGraphData(testGraphData)
      }, '图谱数据更新')

      if (updateDuration > 1000) { // 超过1秒认为性能不佳
        throw new Error(`图谱数据更新耗时过长: ${updateDuration.toFixed(2)}ms`)
      }

      // 测试编辑器内容同步性能
      const syncDuration = await performanceTest(async () => {
        await dataSyncService.updateEditorContent('test-note-1', testEditorContent)
      }, '编辑器内容同步')

      if (syncDuration > 500) { // 超过500ms认为性能不佳
        throw new Error(`编辑器内容同步耗时过长: ${syncDuration.toFixed(2)}ms`)
      }
    })
  }

  private async testErrorHandling(): Promise<void> {
    await this.runTest('错误处理机制', async () => {
      const initialErrorCount = dataSyncService.getState().errors.length
      
      // 清理错误
      dataSyncService.clearErrors()
      
      const clearedErrorCount = dataSyncService.getState().errors.length
      if (clearedErrorCount !== 0) {
        throw new Error('错误清理功能异常')
      }
    })
  }

  private printResults(): void {
    const report = generateTestReport(this.results)
    console.log(report)

    const passed = this.results.filter(r => r.passed).length
    const total = this.results.length

    if (passed === total) {
      console.log('🎉 所有测试通过！集成功能正常工作。')
    } else {
      console.log('⚠️ 部分测试失败，需要检查相关功能。')
    }
  }
}

// 导出测试器
export const integrationTester = new IntegrationTester()

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中，将测试器添加到全局对象
  ;(window as any).runIntegrationTests = () => integrationTester.runAllTests()
  console.log('💡 在浏览器控制台中运行 runIntegrationTests() 来执行集成测试')
}

export default IntegrationTester
