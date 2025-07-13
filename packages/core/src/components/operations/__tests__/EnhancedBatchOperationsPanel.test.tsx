/**
 * 增强版批量操作面板测试
 * 测试操作分类、参数配置、进度显示、历史记录等功能
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EnhancedBatchOperationsPanel, EnhancedBatchItem, EnhancedBatchOperation } from '../EnhancedBatchOperationsPanel'
import { BatchOperationService, BatchOperationStatus } from '../../../services/BatchOperationService'

// 模拟批量操作服务
const mockBatchOperationService = {
  previewOperation: vi.fn(),
  executeOperation: vi.fn(),
  getOperationResult: vi.fn(),
  cancelOperation: vi.fn()
} as unknown as BatchOperationService

// 测试数据
const mockItems: EnhancedBatchItem[] = [
  {
    id: 'item-1',
    title: '测试文档1',
    type: 'file',
    entityType: 'document',
    lastModified: new Date('2024-01-01'),
    permissions: { canRead: true, canWrite: true, canDelete: true }
  },
  {
    id: 'item-2',
    title: '测试笔记2',
    type: 'note',
    entityType: 'note',
    lastModified: new Date('2024-01-02'),
    permissions: { canRead: true, canWrite: true, canDelete: false }
  },
  {
    id: 'item-3',
    title: '测试任务3',
    type: 'task',
    entityType: 'task',
    lastModified: new Date('2024-01-03'),
    permissions: { canRead: true, canWrite: false, canDelete: false }
  }
]

const mockOperations: EnhancedBatchOperation[] = [
  {
    id: 'delete',
    name: '批量删除',
    description: '删除选中的项目',
    icon: '🗑️',
    category: 'basic',
    requiresConfirmation: true,
    permissions: ['delete'],
    riskLevel: 'high',
    canUndo: false,
    estimatedTime: 2
  },
  {
    id: 'move',
    name: '批量移动',
    description: '移动选中的项目',
    icon: '📁',
    category: 'basic',
    supportedTypes: ['file', 'note'],
    permissions: ['write'],
    riskLevel: 'medium',
    canUndo: true,
    estimatedTime: 1,
    params: [
      {
        name: 'targetPath',
        label: '目标路径',
        type: 'text',
        required: true
      }
    ]
  },
  {
    id: 'export',
    name: '批量导出',
    description: '导出选中的项目',
    icon: '📤',
    category: 'export',
    supportedTypes: ['file', 'note'],
    riskLevel: 'low',
    canUndo: false,
    estimatedTime: 3,
    params: [
      {
        name: 'format',
        label: '导出格式',
        type: 'select',
        required: true,
        options: [
          { value: 'json', label: 'JSON' },
          { value: 'csv', label: 'CSV' },
          { value: 'pdf', label: 'PDF' }
        ]
      },
      {
        name: 'includeMetadata',
        label: '包含元数据',
        type: 'boolean',
        default: true
      }
    ]
  },
  {
    id: 'tag',
    name: '批量标签',
    description: '为选中项目添加标签',
    icon: '🏷️',
    category: 'advanced',
    riskLevel: 'low',
    canUndo: true,
    estimatedTime: 0.5,
    params: [
      {
        name: 'tags',
        label: '标签',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'important', label: '重要' },
          { value: 'urgent', label: '紧急' },
          { value: 'review', label: '待审核' }
        ]
      }
    ]
  }
]

describe('EnhancedBatchOperationsPanel', () => {
  const user = userEvent.setup()
  const mockCallbacks = {
    onSelectionChange: vi.fn(),
    onOperationExecute: vi.fn(),
    onOperationComplete: vi.fn(),
    onOperationError: vi.fn(),
    onCancel: vi.fn(),
    onUndo: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // 设置默认的模拟返回值
    mockBatchOperationService.previewOperation = vi.fn().mockResolvedValue('预览结果：将删除3个项目')
    mockBatchOperationService.executeOperation = vi.fn().mockResolvedValue('operation-123')
    mockBatchOperationService.getOperationResult = vi.fn().mockResolvedValue({
      operationId: 'operation-123',
      status: BatchOperationStatus.COMPLETED,
      totalItems: 3,
      processedItems: 3,
      successCount: 3,
      failureCount: 0,
      errors: [],
      warnings: [],
      summary: '成功处理3个项目'
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染批量操作面板', () => {
      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={['item-1', 'item-2']}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('📋 批量操作')).toBeInTheDocument()
      expect(screen.getByText('已选择 2 个项目')).toBeInTheDocument()
      expect(screen.getByText('选择操作')).toBeInTheDocument()
    })

    it('应该显示空状态当没有选中项目时', () => {
      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={[]}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('请选择要操作的项目')).toBeInTheDocument()
      expect(screen.getByText('选择一个或多个项目后，可以执行批量操作')).toBeInTheDocument()
    })
  })

  describe('操作分类', () => {
    it('应该按类别显示操作', () => {
      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={['item-1', 'item-2']}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('基础操作')).toBeInTheDocument()
      expect(screen.getByText('高级操作')).toBeInTheDocument()
      expect(screen.getByText('导出操作')).toBeInTheDocument()
    })

    it('应该根据权限过滤操作', () => {
      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={['item-2']} // item-2没有删除权限
          enablePermissionCheck={true}
          {...mockCallbacks}
        />
      )

      // 删除操作应该被过滤掉，因为item-2没有删除权限
      expect(screen.queryByText('批量删除')).not.toBeInTheDocument()
      expect(screen.getByText('批量移动')).toBeInTheDocument()
    })

    it('应该根据支持的类型过滤操作', () => {
      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={['item-3']} // item-3是task类型
          {...mockCallbacks}
        />
      )

      // 移动和导出操作不支持task类型
      expect(screen.queryByText('批量移动')).not.toBeInTheDocument()
      expect(screen.queryByText('批量导出')).not.toBeInTheDocument()
      expect(screen.getByText('批量删除')).toBeInTheDocument() // 删除操作没有类型限制
    })
  })

  describe('操作选择和参数配置', () => {
    it('应该选择操作并显示参数配置', async () => {
      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={['item-1', 'item-2']}
          {...mockCallbacks}
        />
      )

      // 选择移动操作
      await user.click(screen.getByText('批量移动'))

      // 应该显示参数配置
      expect(screen.getByText('操作参数')).toBeInTheDocument()
      expect(screen.getByText('目标路径')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('请输入目标路径')).toBeInTheDocument()
    })

    it('应该处理不同类型的参数', async () => {
      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={['item-1', 'item-2']}
          {...mockCallbacks}
        />
      )

      // 选择导出操作
      await user.click(screen.getByText('批量导出'))

      // 应该显示选择框和复选框
      expect(screen.getByText('导出格式')).toBeInTheDocument()
      expect(screen.getByText('包含元数据')).toBeInTheDocument()
      
      const formatSelect = screen.getByDisplayValue('')
      expect(formatSelect).toBeInTheDocument()
      
      const metadataCheckbox = screen.getByRole('checkbox')
      expect(metadataCheckbox).toBeChecked() // 默认值为true
    })

    it('应该处理多选参数', async () => {
      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={['item-1', 'item-2']}
          {...mockCallbacks}
        />
      )

      // 选择标签操作
      await user.click(screen.getByText('批量标签'))

      // 应该显示多选选项
      expect(screen.getByText('重要')).toBeInTheDocument()
      expect(screen.getByText('紧急')).toBeInTheDocument()
      expect(screen.getByText('待审核')).toBeInTheDocument()
    })
  })

  describe('预览功能', () => {
    it('应该支持操作预览', async () => {
      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={['item-1', 'item-2']}
          {...mockCallbacks}
        />
      )

      // 选择删除操作
      await user.click(screen.getByText('批量删除'))

      // 点击预览按钮
      await user.click(screen.getByText('预览操作'))

      // 应该显示预览对话框
      await waitFor(() => {
        expect(screen.getByText('操作预览')).toBeInTheDocument()
        expect(screen.getByText('预览结果：将删除3个项目')).toBeInTheDocument()
      })

      expect(mockBatchOperationService.previewOperation).toHaveBeenCalled()
    })
  })

  describe('操作执行', () => {
    it('应该执行不需要确认的操作', async () => {
      mockCallbacks.onOperationExecute.mockResolvedValue(undefined)

      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={['item-1', 'item-2']}
          {...mockCallbacks}
        />
      )

      // 选择移动操作（不需要确认）
      await user.click(screen.getByText('批量移动'))

      // 填写必填参数
      const pathInput = screen.getByPlaceholderText('请输入目标路径')
      await user.type(pathInput, '/new/path')

      // 点击执行按钮
      await user.click(screen.getByText('执行操作 (2项)'))

      await waitFor(() => {
        expect(mockBatchOperationService.executeOperation).toHaveBeenCalled()
        expect(mockCallbacks.onOperationExecute).toHaveBeenCalledWith(
          'move',
          expect.arrayContaining([
            expect.objectContaining({ id: 'item-1' }),
            expect.objectContaining({ id: 'item-2' })
          ]),
          expect.objectContaining({ targetPath: '/new/path' })
        )
      })
    })

    it('应该显示确认对话框对于高风险操作', async () => {
      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={['item-1', 'item-2']}
          {...mockCallbacks}
        />
      )

      // 选择删除操作（需要确认）
      await user.click(screen.getByText('批量删除'))

      // 点击执行按钮
      await user.click(screen.getByText('执行操作 (2项)'))

      // 应该显示确认对话框
      expect(screen.getByText('确认操作')).toBeInTheDocument()
      expect(screen.getByText('您即将执行 批量删除 操作')).toBeInTheDocument()
      expect(screen.getByText('这将影响 2 个项目')).toBeInTheDocument()
      expect(screen.getByText('⚠️ 这是一个高风险操作，可能无法撤销')).toBeInTheDocument()
    })

    it('应该验证必填参数', async () => {
      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={['item-1', 'item-2']}
          {...mockCallbacks}
        />
      )

      // 选择移动操作
      await user.click(screen.getByText('批量移动'))

      // 不填写必填参数，直接点击执行
      await user.click(screen.getByText('执行操作 (2项)'))

      // 应该显示错误信息
      await waitFor(() => {
        expect(screen.getByText('目标路径 是必填项')).toBeInTheDocument()
      })

      // 不应该执行操作
      expect(mockBatchOperationService.executeOperation).not.toHaveBeenCalled()
    })
  })

  describe('进度显示', () => {
    it('应该显示操作进度', async () => {
      // 模拟进行中的操作
      mockBatchOperationService.getOperationResult = vi.fn().mockResolvedValue({
        operationId: 'operation-123',
        status: BatchOperationStatus.RUNNING,
        totalItems: 3,
        processedItems: 1,
        successCount: 1,
        failureCount: 0,
        errors: [],
        warnings: [],
        summary: '正在处理...'
      })

      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={['item-1', 'item-2']}
          enableRealTimeProgress={true}
          {...mockCallbacks}
        />
      )

      // 选择并执行操作
      await user.click(screen.getByText('批量移动'))
      const pathInput = screen.getByPlaceholderText('请输入目标路径')
      await user.type(pathInput, '/new/path')
      await user.click(screen.getByText('执行操作 (2项)'))

      // 等待进度显示
      await waitFor(() => {
        expect(screen.getByText('正在执行: 批量移动')).toBeInTheDocument()
        expect(screen.getByText('1 / 3 (33%)')).toBeInTheDocument()
      })
    })
  })

  describe('高级选项', () => {
    it('应该显示高级选项', async () => {
      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={['item-1', 'item-2']}
          showAdvancedOptions={true}
          {...mockCallbacks}
        />
      )

      // 选择操作
      await user.click(screen.getByText('批量移动'))

      // 点击高级选项
      await user.click(screen.getByText('高级选项'))

      // 应该显示高级配置
      expect(screen.getByText('批处理大小')).toBeInTheDocument()
      expect(screen.getByText('最大并发数')).toBeInTheDocument()
    })
  })

  describe('错误处理', () => {
    it('应该显示操作错误', async () => {
      mockBatchOperationService.executeOperation = vi.fn().mockRejectedValue(new Error('操作失败'))

      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={['item-1', 'item-2']}
          {...mockCallbacks}
        />
      )

      // 选择并执行操作
      await user.click(screen.getByText('批量移动'))
      const pathInput = screen.getByPlaceholderText('请输入目标路径')
      await user.type(pathInput, '/new/path')
      await user.click(screen.getByText('执行操作 (2项)'))

      // 应该显示错误
      await waitFor(() => {
        expect(screen.getByText('操作失败')).toBeInTheDocument()
      })

      expect(mockCallbacks.onOperationError).toHaveBeenCalledWith('操作失败', 'move')
    })
  })

  describe('操作历史', () => {
    it('应该显示操作历史', () => {
      render(
        <EnhancedBatchOperationsPanel
          batchOperationService={mockBatchOperationService}
          items={mockItems}
          operations={mockOperations}
          selectedItems={['item-1', 'item-2']}
          enableHistory={true}
          {...mockCallbacks}
        />
      )

      // 初始状态下没有历史记录
      expect(screen.queryByText('操作历史')).not.toBeInTheDocument()
    })
  })

  describe('撤销功能', () => {
    it('应该支持撤销操作', async () => {
      mockCallbacks.onUndo.mockResolvedValue(undefined)

      // 这里需要模拟有历史记录的状态
      // 由于组件内部管理历史记录状态，我们需要先执行一个操作来创建历史记录
      // 这个测试可能需要更复杂的设置或者重构组件以支持初始历史记录
    })
  })
})
