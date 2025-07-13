/**
 * BatchOperationsPanel 单元测试
 * 测试批量操作面板的选择、执行、错误处理、进度显示和用户交互功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchOperationsPanel } from './BatchOperationsPanel';

// 模拟数据类型
interface BatchItem {
  id: string;
  title: string;
  type: 'page' | 'block' | 'file';
  selected?: boolean;
  path?: string;
  size?: number;
  lastModified?: Date;
}

interface BatchOperation {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiresConfirmation?: boolean;
  supportedTypes?: string[];
}

describe('BatchOperationsPanel', () => {
  // 测试数据
  const mockItems: BatchItem[] = [
    {
      id: 'item1',
      title: '测试页面1',
      type: 'page',
      path: '/test/page1',
      lastModified: new Date('2024-01-01')
    },
    {
      id: 'item2',
      title: '测试块1',
      type: 'block',
      path: '/test/block1',
      lastModified: new Date('2024-01-02')
    },
    {
      id: 'item3',
      title: '测试文件1.md',
      type: 'file',
      path: '/test/file1.md',
      size: 1024,
      lastModified: new Date('2024-01-03')
    }
  ];

  const mockOperations: BatchOperation[] = [
    {
      id: 'delete',
      name: '删除',
      description: '删除选中的项目',
      icon: '🗑️',
      requiresConfirmation: true
    },
    {
      id: 'move',
      name: '移动',
      description: '移动选中的项目到其他位置',
      icon: '📁',
      requiresConfirmation: false
    },
    {
      id: 'copy',
      name: '复制',
      description: '复制选中的项目',
      icon: '📋',
      requiresConfirmation: false
    },
    {
      id: 'export',
      name: '导出',
      description: '导出选中的项目',
      icon: '📤',
      supportedTypes: ['page', 'file']
    }
  ];

  // Mock回调函数
  const mockCallbacks = {
    onSelectionChange: vi.fn(),
    onOperationExecute: vi.fn(),
    onOperationComplete: vi.fn(),
    onOperationError: vi.fn(),
    onCancel: vi.fn()
  };

  const defaultProps = {
    items: mockItems,
    operations: mockOperations,
    selectedItems: [],
    isLoading: false,
    showProgress: false,
    progress: 0,
    ...mockCallbacks
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基础渲染测试', () => {
    it('应该正确渲染批量操作面板', () => {
      render(<BatchOperationsPanel {...defaultProps} />);
      
      // 验证主要元素存在
      expect(screen.getByText('📋 批量操作')).toBeInTheDocument();
      expect(screen.getByText('选择项目进行批量操作')).toBeInTheDocument();
      expect(screen.getByText('全选')).toBeInTheDocument();
      expect(screen.getByText('取消选择')).toBeInTheDocument();
    });

    it('应该显示项目列表', () => {
      render(<BatchOperationsPanel {...defaultProps} />);
      
      // 验证项目显示
      expect(screen.getByText('测试页面1')).toBeInTheDocument();
      expect(screen.getByText('测试块1')).toBeInTheDocument();
      expect(screen.getByText('测试文件1.md')).toBeInTheDocument();
      
      // 验证项目类型图标
      expect(screen.getByText('📄')).toBeInTheDocument(); // page
      expect(screen.getByText('🧩')).toBeInTheDocument(); // block
      expect(screen.getByText('📄')).toBeInTheDocument(); // file
    });

    it('应该显示操作按钮', () => {
      render(<BatchOperationsPanel {...defaultProps} />);
      
      // 验证操作按钮
      expect(screen.getByText('🗑️ 删除')).toBeInTheDocument();
      expect(screen.getByText('📁 移动')).toBeInTheDocument();
      expect(screen.getByText('📋 复制')).toBeInTheDocument();
      expect(screen.getByText('📤 导出')).toBeInTheDocument();
    });

    it('应该根据选中状态禁用操作按钮', () => {
      render(<BatchOperationsPanel {...defaultProps} />);
      
      // 没有选中项目时，操作按钮应该被禁用
      const deleteBtn = screen.getByText('🗑️ 删除').closest('button');
      const moveBtn = screen.getByText('📁 移动').closest('button');
      
      expect(deleteBtn).toBeDisabled();
      expect(moveBtn).toBeDisabled();
    });

    it('应该显示选中项目统计', () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedItems: ['item1', 'item2']
      };
      
      render(<BatchOperationsPanel {...propsWithSelection} />);
      
      expect(screen.getByText('已选择 2 个项目')).toBeInTheDocument();
    });
  });

  describe('项目选择测试', () => {
    it('应该处理单个项目选择', async () => {
      render(<BatchOperationsPanel {...defaultProps} />);
      
      // 点击第一个项目的复选框
      const checkbox = screen.getAllByRole('checkbox')[1]; // 第0个是全选框
      await userEvent.click(checkbox);
      
      expect(mockCallbacks.onSelectionChange).toHaveBeenCalledWith(['item1']);
    });

    it('应该处理全选操作', async () => {
      render(<BatchOperationsPanel {...defaultProps} />);
      
      const selectAllBtn = screen.getByText('全选');
      await userEvent.click(selectAllBtn);
      
      expect(mockCallbacks.onSelectionChange).toHaveBeenCalledWith(['item1', 'item2', 'item3']);
    });

    it('应该处理取消选择操作', async () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedItems: ['item1', 'item2']
      };
      
      render(<BatchOperationsPanel {...propsWithSelection} />);
      
      const clearSelectionBtn = screen.getByText('取消选择');
      await userEvent.click(clearSelectionBtn);
      
      expect(mockCallbacks.onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('应该处理全选复选框状态', async () => {
      const propsWithPartialSelection = {
        ...defaultProps,
        selectedItems: ['item1']
      };
      
      render(<BatchOperationsPanel {...propsWithPartialSelection} />);
      
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      
      // 部分选择状态应该显示为indeterminate
      expect(selectAllCheckbox).toHaveProperty('indeterminate', true);
    });

    it('应该在全部选中时显示全选状态', () => {
      const propsWithFullSelection = {
        ...defaultProps,
        selectedItems: ['item1', 'item2', 'item3']
      };
      
      render(<BatchOperationsPanel {...propsWithFullSelection} />);
      
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      expect(selectAllCheckbox).toBeChecked();
    });
  });

  describe('批量操作执行测试', () => {
    it('应该执行不需要确认的操作', async () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedItems: ['item1', 'item2']
      };
      
      render(<BatchOperationsPanel {...propsWithSelection} />);
      
      const copyBtn = screen.getByText('📋 复制');
      await userEvent.click(copyBtn);
      
      expect(mockCallbacks.onOperationExecute).toHaveBeenCalledWith('copy', ['item1', 'item2']);
    });

    it('应该显示确认对话框对于需要确认的操作', async () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedItems: ['item1']
      };
      
      render(<BatchOperationsPanel {...propsWithSelection} />);
      
      const deleteBtn = screen.getByText('🗑️ 删除');
      await userEvent.click(deleteBtn);
      
      // 验证确认对话框显示
      expect(screen.getByText('确认删除')).toBeInTheDocument();
      expect(screen.getByText('确定要删除选中的 1 个项目吗？此操作不可撤销。')).toBeInTheDocument();
      expect(screen.getByText('确认')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('应该在确认后执行删除操作', async () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedItems: ['item1']
      };
      
      render(<BatchOperationsPanel {...propsWithSelection} />);
      
      const deleteBtn = screen.getByText('🗑️ 删除');
      await userEvent.click(deleteBtn);
      
      const confirmBtn = screen.getByText('确认');
      await userEvent.click(confirmBtn);
      
      expect(mockCallbacks.onOperationExecute).toHaveBeenCalledWith('delete', ['item1']);
    });

    it('应该在取消确认时不执行操作', async () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedItems: ['item1']
      };
      
      render(<BatchOperationsPanel {...propsWithSelection} />);
      
      const deleteBtn = screen.getByText('🗑️ 删除');
      await userEvent.click(deleteBtn);
      
      const cancelBtn = screen.getByText('取消');
      await userEvent.click(cancelBtn);
      
      expect(mockCallbacks.onOperationExecute).not.toHaveBeenCalled();
      expect(screen.queryByText('确认删除')).not.toBeInTheDocument();
    });

    it('应该根据支持的类型过滤操作', () => {
      const propsWithFileSelection = {
        ...defaultProps,
        selectedItems: ['item2'] // block类型
      };
      
      render(<BatchOperationsPanel {...propsWithFileSelection} />);
      
      // 导出操作只支持page和file类型，所以应该被禁用
      const exportBtn = screen.getByText('📤 导出').closest('button');
      expect(exportBtn).toBeDisabled();
    });
  });

  describe('加载和进度状态测试', () => {
    it('应该显示加载状态', () => {
      const propsWithLoading = {
        ...defaultProps,
        isLoading: true
      };
      
      render(<BatchOperationsPanel {...propsWithLoading} />);
      
      expect(screen.getByText('正在处理...')).toBeInTheDocument();
      
      // 操作按钮应该被禁用
      const deleteBtn = screen.getByText('🗑️ 删除').closest('button');
      expect(deleteBtn).toBeDisabled();
    });

    it('应该显示进度条', () => {
      const propsWithProgress = {
        ...defaultProps,
        showProgress: true,
        progress: 50
      };
      
      render(<BatchOperationsPanel {...propsWithProgress} />);
      
      expect(screen.getByText('进度: 50%')).toBeInTheDocument();
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('value', '50');
    });

    it('应该在完成时隐藏进度条', () => {
      const propsWithCompleteProgress = {
        ...defaultProps,
        showProgress: true,
        progress: 100
      };
      
      const { rerender } = render(<BatchOperationsPanel {...propsWithCompleteProgress} />);
      
      expect(screen.getByText('进度: 100%')).toBeInTheDocument();
      
      // 模拟操作完成后隐藏进度
      rerender(<BatchOperationsPanel {...defaultProps} showProgress={false} progress={0} />);
      
      expect(screen.queryByText('进度:')).not.toBeInTheDocument();
    });
  });

  describe('错误处理测试', () => {
    it('应该显示错误消息', () => {
      const propsWithError = {
        ...defaultProps,
        error: '操作失败：网络连接错误'
      };
      
      render(<BatchOperationsPanel {...propsWithError} />);
      
      expect(screen.getByText('⚠️ 操作失败：网络连接错误')).toBeInTheDocument();
    });

    it('应该提供重试按钮', async () => {
      const propsWithError = {
        ...defaultProps,
        error: '操作失败',
        onRetry: vi.fn()
      };
      
      render(<BatchOperationsPanel {...propsWithError} />);
      
      const retryBtn = screen.getByText('重试');
      await userEvent.click(retryBtn);
      
      expect(propsWithError.onRetry).toHaveBeenCalled();
    });

    it('应该提供关闭错误消息的功能', async () => {
      const propsWithError = {
        ...defaultProps,
        error: '操作失败',
        onErrorDismiss: vi.fn()
      };
      
      render(<BatchOperationsPanel {...propsWithError} />);
      
      const dismissBtn = screen.getByTitle('关闭错误消息');
      await userEvent.click(dismissBtn);
      
      expect(propsWithError.onErrorDismiss).toHaveBeenCalled();
    });
  });

  describe('性能测试', () => {
    it('应该快速渲染组件', () => {
      const startTime = performance.now();
      
      render(<BatchOperationsPanel {...defaultProps} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 验证渲染时间小于50ms
      expect(renderTime).toBeLessThan(50);
    });

    it('应该处理大量项目', () => {
      // 创建大量项目
      const largeItemList: BatchItem[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `item${i}`,
        title: `项目${i}`,
        type: 'page' as const,
        path: `/test/item${i}`
      }));
      
      const propsWithLargeList = {
        ...defaultProps,
        items: largeItemList
      };
      
      const startTime = performance.now();
      
      render(<BatchOperationsPanel {...propsWithLargeList} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 验证大量数据渲染时间合理
      expect(renderTime).toBeLessThan(200);
      
      // 验证虚拟化或分页工作正常
      expect(screen.getByText('项目0')).toBeInTheDocument();
    });
  });

  describe('键盘交互测试', () => {
    it('应该支持键盘导航', async () => {
      render(<BatchOperationsPanel {...defaultProps} />);

      // Tab键导航到第一个项目
      await userEvent.tab();
      await userEvent.tab();

      // 空格键选择项目
      await userEvent.keyboard(' ');

      expect(mockCallbacks.onSelectionChange).toHaveBeenCalledWith(['item1']);
    });

    it('应该支持Ctrl+A全选', async () => {
      render(<BatchOperationsPanel {...defaultProps} />);

      await userEvent.keyboard('{Control>}a{/Control}');

      expect(mockCallbacks.onSelectionChange).toHaveBeenCalledWith(['item1', 'item2', 'item3']);
    });

    it('应该支持Delete键删除', async () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedItems: ['item1']
      };

      render(<BatchOperationsPanel {...propsWithSelection} />);

      await userEvent.keyboard('{Delete}');

      // 应该显示确认对话框
      expect(screen.getByText('确认删除')).toBeInTheDocument();
    });

    it('应该支持Escape键取消操作', async () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedItems: ['item1']
      };

      render(<BatchOperationsPanel {...propsWithSelection} />);

      // 打开删除确认对话框
      const deleteBtn = screen.getByText('🗑️ 删除');
      await userEvent.click(deleteBtn);

      // Escape键取消
      await userEvent.keyboard('{Escape}');

      expect(screen.queryByText('确认删除')).not.toBeInTheDocument();
    });
  });

  describe('拖拽操作测试', () => {
    it('应该支持拖拽选择多个项目', async () => {
      render(<BatchOperationsPanel {...defaultProps} />);

      // 模拟拖拽选择（这里简化为点击多个项目）
      const checkboxes = screen.getAllByRole('checkbox').slice(1); // 排除全选框

      // 按住Ctrl点击多个项目
      await userEvent.click(checkboxes[0], { ctrlKey: true });
      await userEvent.click(checkboxes[1], { ctrlKey: true });

      expect(mockCallbacks.onSelectionChange).toHaveBeenCalledTimes(2);
    });

    it('应该支持Shift点击范围选择', async () => {
      render(<BatchOperationsPanel {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox').slice(1);

      // 点击第一个项目
      await userEvent.click(checkboxes[0]);

      // Shift+点击第三个项目，应该选择范围
      await userEvent.click(checkboxes[2], { shiftKey: true });

      expect(mockCallbacks.onSelectionChange).toHaveBeenLastCalledWith(['item1', 'item2', 'item3']);
    });
  });

  describe('过滤和搜索测试', () => {
    it('应该支持按类型过滤项目', async () => {
      const propsWithFilter = {
        ...defaultProps,
        showFilter: true
      };

      render(<BatchOperationsPanel {...propsWithFilter} />);

      // 选择只显示页面类型
      const typeFilter = screen.getByLabelText('类型过滤');
      await userEvent.selectOptions(typeFilter, 'page');

      // 应该只显示页面类型的项目
      expect(screen.getByText('测试页面1')).toBeInTheDocument();
      expect(screen.queryByText('测试块1')).not.toBeInTheDocument();
      expect(screen.queryByText('测试文件1.md')).not.toBeInTheDocument();
    });

    it('应该支持搜索项目', async () => {
      const propsWithSearch = {
        ...defaultProps,
        showSearch: true
      };

      render(<BatchOperationsPanel {...propsWithSearch} />);

      const searchInput = screen.getByPlaceholderText('搜索项目...');
      await userEvent.type(searchInput, '页面');

      // 应该只显示匹配的项目
      expect(screen.getByText('测试页面1')).toBeInTheDocument();
      expect(screen.queryByText('测试块1')).not.toBeInTheDocument();
    });

    it('应该支持清除搜索', async () => {
      const propsWithSearch = {
        ...defaultProps,
        showSearch: true
      };

      render(<BatchOperationsPanel {...propsWithSearch} />);

      const searchInput = screen.getByPlaceholderText('搜索项目...');
      await userEvent.type(searchInput, '页面');

      const clearBtn = screen.getByTitle('清除搜索');
      await userEvent.click(clearBtn);

      expect(searchInput).toHaveValue('');
      expect(screen.getByText('测试块1')).toBeInTheDocument();
    });
  });

  describe('排序功能测试', () => {
    it('应该支持按名称排序', async () => {
      const propsWithSort = {
        ...defaultProps,
        showSort: true
      };

      render(<BatchOperationsPanel {...propsWithSort} />);

      const sortSelect = screen.getByLabelText('排序方式');
      await userEvent.selectOptions(sortSelect, 'name-asc');

      // 验证排序回调被调用
      expect(mockCallbacks.onSortChange).toHaveBeenCalledWith('name-asc');
    });

    it('应该支持按修改时间排序', async () => {
      const propsWithSort = {
        ...defaultProps,
        showSort: true,
        onSortChange: vi.fn()
      };

      render(<BatchOperationsPanel {...propsWithSort} />);

      const sortSelect = screen.getByLabelText('排序方式');
      await userEvent.selectOptions(sortSelect, 'modified-desc');

      expect(propsWithSort.onSortChange).toHaveBeenCalledWith('modified-desc');
    });
  });

  describe('上下文菜单测试', () => {
    it('应该显示右键上下文菜单', async () => {
      render(<BatchOperationsPanel {...defaultProps} />);

      const firstItem = screen.getByText('测试页面1');
      await userEvent.pointer({ keys: '[MouseRight]', target: firstItem });

      // 验证上下文菜单显示
      expect(screen.getByText('选择')).toBeInTheDocument();
      expect(screen.getByText('复制')).toBeInTheDocument();
      expect(screen.getByText('删除')).toBeInTheDocument();
    });

    it('应该在上下文菜单中执行操作', async () => {
      render(<BatchOperationsPanel {...defaultProps} />);

      const firstItem = screen.getByText('测试页面1');
      await userEvent.pointer({ keys: '[MouseRight]', target: firstItem });

      const selectMenuItem = screen.getByText('选择');
      await userEvent.click(selectMenuItem);

      expect(mockCallbacks.onSelectionChange).toHaveBeenCalledWith(['item1']);
    });
  });

  describe('无障碍性测试', () => {
    it('应该提供正确的ARIA标签', () => {
      render(<BatchOperationsPanel {...defaultProps} />);

      // 验证主要区域的ARIA标签
      expect(screen.getByRole('region', { name: '批量操作面板' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: '项目列表' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: '操作按钮' })).toBeInTheDocument();
    });

    it('应该提供键盘焦点指示', async () => {
      render(<BatchOperationsPanel {...defaultProps} />);

      // Tab到第一个可聚焦元素
      await userEvent.tab();

      const focusedElement = document.activeElement;
      expect(focusedElement).toHaveClass('focusable');
    });

    it('应该提供屏幕阅读器支持', () => {
      const propsWithSelection = {
        ...defaultProps,
        selectedItems: ['item1', 'item2']
      };

      render(<BatchOperationsPanel {...propsWithSelection} />);

      // 验证屏幕阅读器公告
      expect(screen.getByText('已选择 2 个项目')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空项目列表', () => {
      const propsWithEmptyList = {
        ...defaultProps,
        items: []
      };

      render(<BatchOperationsPanel {...propsWithEmptyList} />);

      expect(screen.getByText('没有可操作的项目')).toBeInTheDocument();
      expect(screen.getByText('全选').closest('button')).toBeDisabled();
    });

    it('应该处理无操作权限', () => {
      const propsWithoutPermissions = {
        ...defaultProps,
        operations: [],
        readOnly: true
      };

      render(<BatchOperationsPanel {...propsWithoutPermissions} />);

      expect(screen.getByText('只读模式')).toBeInTheDocument();
      expect(screen.queryByText('🗑️ 删除')).not.toBeInTheDocument();
    });

    it('应该处理网络错误重试', async () => {
      const propsWithNetworkError = {
        ...defaultProps,
        error: '网络连接失败',
        onRetry: vi.fn()
      };

      render(<BatchOperationsPanel {...propsWithNetworkError} />);

      const retryBtn = screen.getByText('重试');
      await userEvent.click(retryBtn);

      expect(propsWithNetworkError.onRetry).toHaveBeenCalled();
    });

    it('应该处理操作超时', () => {
      const propsWithTimeout = {
        ...defaultProps,
        isLoading: true,
        operationTimeout: true
      };

      render(<BatchOperationsPanel {...propsWithTimeout} />);

      expect(screen.getByText('操作超时')).toBeInTheDocument();
      expect(screen.getByText('取消操作')).toBeInTheDocument();
    });
  });
});
