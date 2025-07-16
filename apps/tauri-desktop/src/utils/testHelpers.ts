/**
 * 测试辅助工具 - 提供简化的测试验证功能
 */

import { GraphData } from '@minglog/graph'

// 创建测试用的图谱数据
export const createTestGraphData = (): GraphData => {
  return {
    nodes: [
      {
        id: 'test-note-1',
        title: '测试笔记：知识管理',
        type: 'note',
        content: '这是一篇关于知识管理的测试笔记。它包含了 #知识管理 和 #测试 标签。',
        tags: ['知识管理', '测试'],
        size: 12,
        color: '#3b82f6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-note-2',
        title: '测试笔记：图谱可视化',
        type: 'note',
        content: '这篇笔记探讨图谱可视化技术。它引用了 [[测试笔记：知识管理]] 的内容。',
        tags: ['可视化', '图谱', '测试'],
        size: 10,
        color: '#10b981',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-note-3',
        title: '测试笔记：编辑器功能',
        type: 'note',
        content: '这篇笔记介绍编辑器的各种功能，包括块编辑、拖拽排序等。',
        tags: ['编辑器', '功能', '测试'],
        size: 8,
        color: '#8b5cf6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tag-knowledge',
        title: '知识管理',
        type: 'tag',
        size: 6,
        color: '#f59e0b'
      },
      {
        id: 'tag-test',
        title: '测试',
        type: 'tag',
        size: 8,
        color: '#ef4444'
      },
      {
        id: 'tag-visualization',
        title: '可视化',
        type: 'tag',
        size: 5,
        color: '#06b6d4'
      }
    ],
    links: [
      {
        id: 'link-1',
        source: 'test-note-1',
        target: 'tag-knowledge',
        type: 'tag',
        weight: 1
      },
      {
        id: 'link-2',
        source: 'test-note-1',
        target: 'tag-test',
        type: 'tag',
        weight: 1
      },
      {
        id: 'link-3',
        source: 'test-note-2',
        target: 'tag-visualization',
        type: 'tag',
        weight: 1
      },
      {
        id: 'link-4',
        source: 'test-note-2',
        target: 'tag-test',
        type: 'tag',
        weight: 1
      },
      {
        id: 'link-5',
        source: 'test-note-3',
        target: 'tag-test',
        type: 'tag',
        weight: 1
      },
      {
        id: 'link-6',
        source: 'test-note-2',
        target: 'test-note-1',
        type: 'reference',
        weight: 0.8
      }
    ]
  }
}

// 创建测试用的编辑器内容
export const createTestEditorContent = () => {
  return [
    {
      id: 'block-title',
      type: 'heading-1',
      children: [{ text: '测试文档标题' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'block-intro',
      type: 'paragraph',
      children: [{ 
        text: '这是一个测试文档，用于验证编辑器与图谱的集成功能。' 
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'block-tags',
      type: 'paragraph',
      children: [{ 
        text: '标签测试：#测试 #集成 #功能验证' 
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'block-links',
      type: 'paragraph',
      children: [{ 
        text: '链接测试：这里引用了 [[测试笔记：知识管理]] 和 [[测试笔记：图谱可视化]]。' 
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'block-list',
      type: 'bulleted-list',
      children: [
        {
          type: 'list-item',
          children: [{ text: '功能点1：图谱可视化' }]
        },
        {
          type: 'list-item', 
          children: [{ text: '功能点2：编辑器集成' }]
        },
        {
          type: 'list-item',
          children: [{ text: '功能点3：数据同步' }]
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
}

// 验证图谱数据结构
export const validateGraphData = (data: GraphData): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!data) {
    errors.push('图谱数据为空')
    return { valid: false, errors }
  }
  
  if (!Array.isArray(data.nodes)) {
    errors.push('节点数据不是数组')
  } else if (data.nodes.length === 0) {
    errors.push('没有图谱节点')
  }
  
  if (!Array.isArray(data.links)) {
    errors.push('链接数据不是数组')
  }
  
  // 验证节点结构
  data.nodes.forEach((node, index) => {
    if (!node.id) {
      errors.push(`节点 ${index} 缺少 id`)
    }
    if (!node.title) {
      errors.push(`节点 ${index} 缺少 title`)
    }
    if (!node.type) {
      errors.push(`节点 ${index} 缺少 type`)
    }
  })
  
  // 验证链接结构
  data.links.forEach((link, index) => {
    if (!link.id) {
      errors.push(`链接 ${index} 缺少 id`)
    }
    if (!link.source) {
      errors.push(`链接 ${index} 缺少 source`)
    }
    if (!link.target) {
      errors.push(`链接 ${index} 缺少 target`)
    }
    
    // 验证链接的源和目标节点是否存在
    const sourceExists = data.nodes.some(node => node.id === link.source)
    const targetExists = data.nodes.some(node => node.id === link.target)
    
    if (!sourceExists) {
      errors.push(`链接 ${index} 的源节点 ${link.source} 不存在`)
    }
    if (!targetExists) {
      errors.push(`链接 ${index} 的目标节点 ${link.target} 不存在`)
    }
  })
  
  return { valid: errors.length === 0, errors }
}

// 验证搜索索引
export const validateSearchIndex = (index: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!index) {
    errors.push('搜索索引为空')
    return { valid: false, errors }
  }
  
  if (!Array.isArray(index.pages)) {
    errors.push('搜索索引中的页面数据不是数组')
  }
  
  if (!Array.isArray(index.blocks)) {
    errors.push('搜索索引中的块数据不是数组')
  }
  
  if (!Array.isArray(index.tags)) {
    errors.push('搜索索引中的标签数据不是数组')
  }
  
  return { valid: errors.length === 0, errors }
}

// 简单的性能测试
export const performanceTest = async (testFn: () => Promise<void>, name: string): Promise<number> => {
  const startTime = performance.now()
  await testFn()
  const endTime = performance.now()
  const duration = endTime - startTime
  
  console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
  return duration
}

// 模拟用户操作
export const simulateUserActions = {
  // 模拟节点点击
  clickNode: (nodeId: string) => {
    console.log(`🖱️ 模拟点击节点: ${nodeId}`)
    // 这里可以触发实际的节点点击事件
  },
  
  // 模拟编辑器输入
  typeInEditor: (content: string) => {
    console.log(`⌨️ 模拟编辑器输入: ${content.substring(0, 50)}...`)
    // 这里可以触发实际的编辑器输入事件
  },
  
  // 模拟布局切换
  switchLayout: (layout: 'split' | 'graph-only' | 'editor-only') => {
    console.log(`🔄 模拟布局切换: ${layout}`)
    // 这里可以触发实际的布局切换
  }
}

// 测试报告生成器
export const generateTestReport = (results: any[]): string => {
  const passed = results.filter(r => r.passed).length
  const total = results.length
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0'
  
  let report = `📊 测试报告\n`
  report += `==================\n`
  report += `总测试数: ${total}\n`
  report += `通过: ${passed}\n`
  report += `失败: ${total - passed}\n`
  report += `通过率: ${passRate}%\n`
  report += `==================\n\n`
  
  results.forEach((result, _index) => {
    const status = result.passed ? '✅' : '❌'
    report += `${status} ${result.name}\n`
    if (!result.passed) {
      report += `   错误: ${result.message}\n`
    }
    report += `   耗时: ${result.duration}ms\n\n`
  })
  
  return report
}

// 导出所有工具函数
export default {
  createTestGraphData,
  createTestEditorContent,
  validateGraphData,
  validateSearchIndex,
  performanceTest,
  simulateUserActions,
  generateTestReport
}
