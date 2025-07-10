/**
 * 集成功能演示脚本 - 自动展示各个功能的工作效果
 */

import { dataSyncService } from '../services/DataSyncService'
import { createTestGraphData, createTestEditorContent } from '../utils/testHelpers'

export class IntegrationDemo {
  private isRunning = false
  private currentStep = 0
  private steps: Array<{
    name: string
    description: string
    action: () => Promise<void>
    duration: number
  }> = []

  constructor() {
    this.setupDemoSteps()
  }

  private setupDemoSteps() {
    this.steps = [
      {
        name: '初始化数据同步服务',
        description: '启动数据同步服务，准备演示环境',
        action: async () => {
          console.log('🚀 初始化数据同步服务...')
          const state = dataSyncService.getState()
          console.log('📊 当前状态:', state)
        },
        duration: 1000
      },
      {
        name: '加载测试图谱数据',
        description: '创建包含笔记和标签的测试图谱',
        action: async () => {
          console.log('📊 加载测试图谱数据...')
          const testData = createTestGraphData()
          await dataSyncService.updateGraphData(testData)
          console.log(`✅ 已加载 ${testData.nodes.length} 个节点和 ${testData.links.length} 个连接`)
        },
        duration: 1500
      },
      {
        name: '演示节点选择功能',
        description: '模拟用户点击图谱节点',
        action: async () => {
          console.log('🖱️ 演示节点选择功能...')
          const testData = createTestGraphData()
          const noteNode = testData.nodes.find(node => node.type === 'note')
          if (noteNode) {
            dataSyncService.selectNode(noteNode.id)
            console.log(`✅ 已选择节点: ${noteNode.title}`)
          }
        },
        duration: 1000
      },
      {
        name: '演示编辑器内容同步',
        description: '模拟编辑器内容变化并同步到图谱',
        action: async () => {
          console.log('✏️ 演示编辑器内容同步...')
          const testContent = createTestEditorContent()
          await dataSyncService.updateEditorContent('test-note-1', testContent)
          console.log('✅ 编辑器内容已同步到图谱')
          
          // 显示更新后的图谱状态
          const state = dataSyncService.getState()
          if (state.graphData) {
            const updatedNode = state.graphData.nodes.find(node => node.id === 'test-note-1')
            if (updatedNode) {
              console.log(`📝 节点内容已更新: ${updatedNode.content?.substring(0, 50)}...`)
            }
          }
        },
        duration: 2000
      },
      {
        name: '演示搜索索引更新',
        description: '展示搜索索引的自动更新功能',
        action: async () => {
          console.log('🔍 演示搜索索引更新...')
          
          // 等待搜索索引更新
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const state = dataSyncService.getState()
          if (state.searchIndex) {
            console.log(`✅ 搜索索引已更新:`)
            console.log(`   - 页面数: ${state.searchIndex.pages.length}`)
            console.log(`   - 标签数: ${state.searchIndex.tags.length}`)
            console.log(`   - 块数: ${state.searchIndex.blocks.length}`)
          }
        },
        duration: 1500
      },
      {
        name: '演示实时数据同步',
        description: '展示多个组件之间的实时数据同步',
        action: async () => {
          console.log('🔄 演示实时数据同步...')
          
          // 模拟多个快速更新
          const updates = [
            '添加新标签 #演示',
            '创建节点引用 [[新笔记]]',
            '更新节点标题'
          ]
          
          for (let i = 0; i < updates.length; i++) {
            console.log(`   ${i + 1}. ${updates[i]}`)
            await new Promise(resolve => setTimeout(resolve, 300))
          }
          
          console.log('✅ 实时同步演示完成')
        },
        duration: 2000
      },
      {
        name: '性能测试演示',
        description: '展示系统性能和响应速度',
        action: async () => {
          console.log('⚡ 演示性能测试...')
          
          const startTime = performance.now()
          
          // 模拟大量数据更新
          const testData = createTestGraphData()
          await dataSyncService.updateGraphData(testData)
          
          const endTime = performance.now()
          const duration = endTime - startTime
          
          console.log(`✅ 性能测试完成: ${duration.toFixed(2)}ms`)
          
          if (duration < 1000) {
            console.log('🎉 性能优秀 (< 1秒)')
          } else {
            console.log('⚠️ 性能需要优化 (> 1秒)')
          }
        },
        duration: 1000
      }
    ]
  }

  async runDemo(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ 演示已在运行中...')
      return
    }

    this.isRunning = true
    this.currentStep = 0

    console.log('🎬 开始集成功能演示...')
    console.log('=' .repeat(50))

    try {
      for (let i = 0; i < this.steps.length; i++) {
        this.currentStep = i
        const step = this.steps[i]
        
        console.log(`\n📍 步骤 ${i + 1}/${this.steps.length}: ${step.name}`)
        console.log(`📝 ${step.description}`)
        console.log('-'.repeat(30))
        
        const stepStartTime = performance.now()
        await step.action()
        const stepEndTime = performance.now()
        
        console.log(`⏱️ 耗时: ${(stepEndTime - stepStartTime).toFixed(2)}ms`)
        
        // 等待指定时间后继续下一步
        if (i < this.steps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, step.duration))
        }
      }

      console.log('\n🎉 集成功能演示完成！')
      console.log('=' .repeat(50))
      this.printSummary()

    } catch (error) {
      console.error('❌ 演示过程中出现错误:', error)
    } finally {
      this.isRunning = false
    }
  }

  private printSummary(): void {
    console.log('\n📊 演示总结:')
    console.log(`✅ 完成步骤: ${this.currentStep + 1}/${this.steps.length}`)
    
    const state = dataSyncService.getState()
    console.log('\n📈 最终状态:')
    console.log(`   - 图谱节点: ${state.graphData?.nodes.length || 0}`)
    console.log(`   - 图谱连接: ${state.graphData?.links.length || 0}`)
    console.log(`   - 搜索页面: ${state.searchIndex?.pages.length || 0}`)
    console.log(`   - 搜索标签: ${state.searchIndex?.tags.length || 0}`)
    console.log(`   - 系统错误: ${state.errors.length}`)
    console.log(`   - 同步状态: ${state.isLoading ? '同步中' : '就绪'}`)
    
    if (state.lastSync) {
      console.log(`   - 最后同步: ${state.lastSync.toLocaleTimeString()}`)
    }

    console.log('\n💡 提示:')
    console.log('   - 访问 http://localhost:1420/workspace 体验集成工作空间')
    console.log('   - 访问 http://localhost:1420/integration-test 运行完整测试')
    console.log('   - 在控制台运行 runIntegrationTests() 进行自动化测试')
  }

  stopDemo(): void {
    if (this.isRunning) {
      this.isRunning = false
      console.log('⏹️ 演示已停止')
    }
  }

  getDemoStatus(): {
    isRunning: boolean
    currentStep: number
    totalSteps: number
    currentStepName?: string
  } {
    return {
      isRunning: this.isRunning,
      currentStep: this.currentStep,
      totalSteps: this.steps.length,
      currentStepName: this.steps[this.currentStep]?.name
    }
  }
}

// 创建全局演示实例
export const integrationDemo = new IntegrationDemo()

// 在浏览器环境中添加到全局对象
if (typeof window !== 'undefined') {
  ;(window as any).runIntegrationDemo = () => integrationDemo.runDemo()
  ;(window as any).stopIntegrationDemo = () => integrationDemo.stopDemo()
  ;(window as any).getDemoStatus = () => integrationDemo.getDemoStatus()
  
  console.log('🎬 集成功能演示已准备就绪!')
  console.log('💡 在控制台运行以下命令:')
  console.log('   - runIntegrationDemo() - 开始演示')
  console.log('   - stopIntegrationDemo() - 停止演示')
  console.log('   - getDemoStatus() - 查看演示状态')
}

export default IntegrationDemo
