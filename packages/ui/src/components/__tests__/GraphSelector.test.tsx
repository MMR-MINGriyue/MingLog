/**
 * GraphSelector 组件测试
 * GraphSelector Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, mockGraph } from '../../test/utils';
import { GraphSelector, GraphStatus } from '../GraphSelector';

describe('GraphSelector', () => {
  const mockGraphs = [
    mockGraph,
    {
      id: 'test-graph-2',
      name: '工作笔记',
      path: 'work-notes',
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 7200000,
    },
  ];

  const defaultProps = {
    graphs: mockGraphs,
    currentGraph: mockGraphs[0],
    onGraphSelect: vi.fn(),
    onCreateGraph: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('dropdown variant', () => {
    it('renders correctly with graphs', () => {
      render(<GraphSelector {...defaultProps} variant="dropdown" />);
      
      expect(screen.getByText('测试图谱')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      render(<GraphSelector {...defaultProps} loading={true} variant="dropdown" />);
      
      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('opens dropdown when clicked', async () => {
      render(<GraphSelector {...defaultProps} variant="dropdown" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('工作笔记')).toBeInTheDocument();
      });
    });

    it('calls onGraphSelect when graph is selected', async () => {
      render(<GraphSelector {...defaultProps} variant="dropdown" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const graphOption = screen.getByText('工作笔记');
        fireEvent.click(graphOption);
      });
      
      expect(defaultProps.onGraphSelect).toHaveBeenCalledWith(mockGraphs[1]);
    });

    it('calls onCreateGraph when create button is clicked', async () => {
      render(<GraphSelector {...defaultProps} variant="dropdown" showCreateButton={true} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const createButton = screen.getByText('创建图谱');
        fireEvent.click(createButton);
      });
      
      expect(defaultProps.onCreateGraph).toHaveBeenCalled();
    });

    it('shows no graphs message when graphs array is empty', async () => {
      render(
        <GraphSelector 
          {...defaultProps} 
          graphs={[]} 
          currentGraph={null}
          variant="dropdown" 
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('暂无图谱')).toBeInTheDocument();
      });
    });

    it('closes dropdown when backdrop is clicked', async () => {
      render(<GraphSelector {...defaultProps} variant="dropdown" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('工作笔记')).toBeInTheDocument();
      });
      
      // Click backdrop
      const backdrop = document.querySelector('.fixed.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      await waitFor(() => {
        expect(screen.queryByText('工作笔记')).not.toBeInTheDocument();
      });
    });
  });

  describe('sidebar variant', () => {
    it('renders correctly in sidebar mode', () => {
      render(<GraphSelector {...defaultProps} variant="sidebar" />);
      
      expect(screen.getByText('图谱')).toBeInTheDocument();
      expect(screen.getByText('测试图谱')).toBeInTheDocument();
      expect(screen.getByText('工作笔记')).toBeInTheDocument();
    });

    it('shows loading skeleton in sidebar mode', () => {
      render(<GraphSelector {...defaultProps} loading={true} variant="sidebar" />);
      
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows empty state in sidebar mode', () => {
      render(
        <GraphSelector 
          {...defaultProps} 
          graphs={[]} 
          currentGraph={null}
          variant="sidebar" 
        />
      );
      
      expect(screen.getByText('暂无图谱')).toBeInTheDocument();
    });

    it('highlights current graph in sidebar mode', () => {
      render(<GraphSelector {...defaultProps} variant="sidebar" />);
      
      const currentGraphButton = screen.getByText('测试图谱').closest('button');
      expect(currentGraphButton).toHaveClass('bg-blue-100');
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<GraphSelector {...defaultProps} variant="dropdown" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('supports keyboard navigation', async () => {
      render(<GraphSelector {...defaultProps} variant="dropdown" />);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('工作笔记')).toBeInTheDocument();
      });
    });
  });
});

describe('GraphStatus', () => {
  it('shows no graph selected state', () => {
    render(<GraphStatus graph={null} />);
    
    expect(screen.getByText('未选择图谱')).toBeInTheDocument();
  });

  it('shows current graph name', () => {
    render(<GraphStatus graph={mockGraph} />);
    
    expect(screen.getByText('测试图谱')).toBeInTheDocument();
  });

  it('has correct styling for different states', () => {
    const { rerender } = render(<GraphStatus graph={null} />);
    
    let statusElement = screen.getByText('未选择图谱').closest('div');
    expect(statusElement).toHaveClass('text-amber-600');
    
    rerender(<GraphStatus graph={mockGraph} />);
    
    statusElement = screen.getByText('测试图谱').closest('div');
    expect(statusElement).toHaveClass('text-green-600');
  });
});
