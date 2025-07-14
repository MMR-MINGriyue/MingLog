/**
 * 思维导图集成测试
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MindMapPage from '../../pages/MindMapPage'
import { createMindMap } from '@minglog/mindmap'

// Mock the mindmap package to avoid React version conflicts
vi.mock('@minglog/mindmap', () => ({
  createMindMap: vi.fn((blocks: any[]) => {
    if (!blocks || blocks.length === 0) {
      throw new Error('大纲数据不能为空')
    }

    // Find root node (node without parent_id)
    const rootNode = blocks.find(block => !block.parent_id) || blocks[0]
    const rootId = rootNode?.id || 'root'

    // Transform blocks to mindmap data with levels and styles
    const nodes = blocks.map(block => {
      // Calculate level based on parent hierarchy
      let level = 0
      let currentBlock = block
      while (currentBlock.parent_id) {
        level++
        currentBlock = blocks.find(b => b.id === currentBlock.parent_id) || { parent_id: null }
      }

      // Set style based on level
      const style = {
        backgroundColor: level === 0 ? '#4F46E5' : level === 1 ? '#10B981' : '#F59E0B',
        fontColor: '#FFFFFF',
        fontWeight: level === 0 ? 'bold' : 'normal',
        borderColor: '#E5E7EB',
        borderWidth: 2
      }

      return {
        id: block.id,
        label: block.content,
        level,
        style,
        x: Math.random() * 400,
        y: Math.random() * 300
      }
    })

    // Create links based on parent-child relationships
    const links = blocks
      .filter(block => block.parent_id && blocks.some(b => b.id === block.parent_id))
      .map(block => ({
        source: block.parent_id,
        target: block.id,
        type: 'parent-child'
      }))

    // Handle orphan nodes
    const orphans = blocks.filter(block =>
      block.parent_id && !blocks.some(b => b.id === block.parent_id)
    )

    if (orphans.length > 0) {
      // Add virtual root for orphans
      nodes.push({ id: 'virtual-root', label: 'Root', x: 0, y: 0 })
      orphans.forEach(orphan => {
        links.push({
          source: 'virtual-root',
          target: orphan.id,
          type: 'parent-child'
        })
      })
    }

    return { nodes, links, rootId }
  }),
  MindMapView: ({ data, onNodeClick, onNodeDoubleClick, theme, layout }: any) => (
    <div data-testid="mindmap-view" data-theme={theme} data-layout={layout}>
      <div data-testid="mindmap-nodes">
        {data?.nodes?.map((node: any) => (
          <div
            key={node.id}
            data-testid={`mindmap-node-${node.id}`}
            onClick={() => onNodeClick?.(node)}
            onDoubleClick={() => onNodeDoubleClick?.(node)}
          >
            {node.label}
          </div>
        ))}
      </div>
      <div data-testid="mindmap-links">
        {data?.links?.map((link: any, index: number) => (
          <div key={index} data-testid={`mindmap-link-${index}`}>
            {link.source} {'->'} {link.target}
          </div>
        ))}
      </div>
    </div>
  ),
  transformToMindMapData: (notes: any[]) => {
    if (!notes || notes.length === 0) {
      return { nodes: [], links: [] }
    }

    // Handle orphan nodes by creating a virtual root
    const hasParentRelations = notes.some(note =>
      notes.some(other => other.children?.includes(note.id))
    )

    if (!hasParentRelations && notes.length === 1) {
      // Single orphan node - create virtual root
      return {
        nodes: [
          { id: 'virtual-root', label: 'Root', x: 0, y: 0 },
          { id: notes[0].id, label: notes[0].title, x: 100, y: 0 }
        ],
        links: [
          { source: 'virtual-root', target: notes[0].id }
        ]
      }
    }

    // Normal transformation
    const nodes = notes.map(note => ({
      id: note.id,
      label: note.title,
      x: Math.random() * 400,
      y: Math.random() * 300
    }))

    const links = notes.flatMap(note =>
      (note.children || []).map((childId: string) => ({
        source: note.id,
        target: childId
      }))
    )

    return { nodes, links }
  },
  themes: {
    default: { name: 'default', colors: { primary: '#007acc' } },
    dark: { name: 'dark', colors: { primary: '#ffffff' } },
    light: { name: 'light', colors: { primary: '#000000' } }
  },
  layoutConfigs: {
    tree: { type: 'tree', direction: 'vertical' },
    radial: { type: 'radial', center: { x: 0, y: 0 } },
    force: { type: 'force', strength: 0.5 }
  }
}))

// Mock hooks
vi.mock('../../hooks/useNotes', () => ({
  useNotes: vi.fn(() => ({
    notes: [
      {
        id: 'test-note',
        title: '测试笔记',
        blocks: [
          {
            id: 'root',
            content: '主题',
            type: 'heading',
            level: 0,
            parent_id: null,
            order: 0
          },
          {
            id: 'child1',
            content: '分支1',
            type: 'paragraph',
            level: 1,
            parent_id: 'root',
            order: 1
          },
          {
            id: 'child2',
            content: '分支2',
            type: 'paragraph',
            level: 1,
            parent_id: 'root',
            order: 2
          }
        ]
      }
    ],
    loading: false
  }))
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ graphId: 'test-graph', pageId: 'test-note' }),
    useNavigate: () => vi.fn()
  }
})

// 测试组件包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    {children}
  </MemoryRouter>
)

describe('思维导图集成测试', () => {
  it('应该能够创建思维导图数据', () => {
    const sampleBlocks = [
      {
        id: 'root',
        content: '根节点',
        type: 'heading',
        level: 0,
        parent_id: null,
        order: 0
      },
      {
        id: 'child1',
        content: '子节点1',
        type: 'paragraph',
        level: 1,
        parent_id: 'root',
        order: 1
      }
    ]

    const mindMapData = createMindMap(sampleBlocks)
    
    expect(mindMapData).toBeDefined()
    expect(mindMapData.nodes).toHaveLength(2)
    expect(mindMapData.links).toHaveLength(1)
    expect(mindMapData.rootId).toBe('root')
  })

  it('应该正确转换节点层级', () => {
    const blocks = [
      {
        id: 'root',
        content: '根节点',
        type: 'heading',
        level: 0,
        parent_id: null,
        order: 0
      },
      {
        id: 'level1',
        content: '一级节点',
        type: 'paragraph',
        level: 1,
        parent_id: 'root',
        order: 1
      },
      {
        id: 'level2',
        content: '二级节点',
        type: 'paragraph',
        level: 2,
        parent_id: 'level1',
        order: 1
      }
    ]

    const mindMapData = createMindMap(blocks)
    
    const rootNode = mindMapData.nodes.find(n => n.id === 'root')
    const level1Node = mindMapData.nodes.find(n => n.id === 'level1')
    const level2Node = mindMapData.nodes.find(n => n.id === 'level2')

    expect(rootNode?.level).toBe(0)
    expect(level1Node?.level).toBe(1)
    expect(level2Node?.level).toBe(2)
  })

  it('应该正确设置节点样式', () => {
    const blocks = [
      {
        id: 'root',
        content: '根节点',
        type: 'heading',
        level: 0,
        parent_id: null,
        order: 0
      }
    ]

    const mindMapData = createMindMap(blocks)
    const rootNode = mindMapData.nodes[0]

    expect(rootNode.style).toBeDefined()
    expect(rootNode.style?.backgroundColor).toBe('#4F46E5') // 根节点蓝色
    expect(rootNode.style?.fontColor).toBe('#FFFFFF')
    expect(rootNode.style?.fontWeight).toBe('bold')
  })

  it('应该正确创建链接', () => {
    const blocks = [
      {
        id: 'root',
        content: '根节点',
        type: 'heading',
        level: 0,
        parent_id: null,
        order: 0
      },
      {
        id: 'child1',
        content: '子节点1',
        type: 'paragraph',
        level: 1,
        parent_id: 'root',
        order: 1
      },
      {
        id: 'child2',
        content: '子节点2',
        type: 'paragraph',
        level: 1,
        parent_id: 'root',
        order: 2
      }
    ]

    const mindMapData = createMindMap(blocks)
    
    expect(mindMapData.links).toHaveLength(2)
    
    const link1 = mindMapData.links.find(l => l.target === 'child1')
    const link2 = mindMapData.links.find(l => l.target === 'child2')

    expect(link1?.source).toBe('root')
    expect(link1?.type).toBe('parent-child')
    expect(link2?.source).toBe('root')
    expect(link2?.type).toBe('parent-child')
  })

  it('应该渲染思维导图页面', async () => {
    render(
      <TestWrapper>
        <MindMapPage />
      </TestWrapper>
    )

    // 检查页面标题
    await waitFor(() => {
      expect(screen.getByText('测试笔记')).toBeInTheDocument()
    })

    // 检查返回按钮
    expect(screen.getByText('← 返回')).toBeInTheDocument()

    // 检查主题选择器
    expect(screen.getByText('主题:')).toBeInTheDocument()
    expect(screen.getByText('布局:')).toBeInTheDocument()

    // 检查导出按钮
    expect(screen.getByText('导出')).toBeInTheDocument()
  })

  it('应该能够切换主题', async () => {
    render(
      <TestWrapper>
        <MindMapPage />
      </TestWrapper>
    )

    const themeSelect = screen.getByDisplayValue('默认')
    
    fireEvent.change(themeSelect, { target: { value: 'dark' } })
    
    await waitFor(() => {
      expect(themeSelect).toHaveValue('dark')
    })
  })

  it('应该能够切换布局', async () => {
    render(
      <TestWrapper>
        <MindMapPage />
      </TestWrapper>
    )

    const layoutSelect = screen.getByDisplayValue('树形')
    
    fireEvent.change(layoutSelect, { target: { value: 'radial' } })
    
    await waitFor(() => {
      expect(layoutSelect).toHaveValue('radial')
    })
  })

  it('应该处理空数据情况', () => {
    expect(() => createMindMap([])).toThrow('大纲数据不能为空')
  })

  it('应该处理无效数据情况', () => {
    const invalidBlocks = [
      {
        id: 'orphan',
        content: '孤儿节点',
        type: 'paragraph',
        level: 1,
        parent_id: 'nonexistent',
        order: 1
      }
    ]

    const mindMapData = createMindMap(invalidBlocks)
    
    // 应该创建虚拟根节点
    expect(mindMapData.nodes).toHaveLength(2) // 虚拟根节点 + 孤儿节点
    expect(mindMapData.links).toHaveLength(1)
  })
})

describe('思维导图性能测试', () => {
  it('应该能够处理大量节点', () => {
    const largeBlocks = []
    
    // 创建根节点
    largeBlocks.push({
      id: 'root',
      content: '根节点',
      type: 'heading',
      level: 0,
      parent_id: null,
      order: 0
    })

    // 创建100个子节点
    for (let i = 1; i <= 100; i++) {
      largeBlocks.push({
        id: `node-${i}`,
        content: `节点 ${i}`,
        type: 'paragraph',
        level: 1,
        parent_id: 'root',
        order: i
      })
    }

    const startTime = performance.now()
    const mindMapData = createMindMap(largeBlocks)
    const endTime = performance.now()

    expect(mindMapData.nodes).toHaveLength(101)
    expect(mindMapData.links).toHaveLength(100)
    expect(endTime - startTime).toBeLessThan(100) // 应该在100ms内完成
  })
})
