/**
 * GraphVisualization 组件测试
 * GraphVisualization Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, mockGraphData, mockMouseEvent } from '../../test/utils';
import { GraphVisualization, GraphSettings } from '../GraphVisualization';

describe('GraphVisualization', () => {
  const defaultProps = {
    data: mockGraphData,
    width: 800,
    height: 600,
    onNodeClick: vi.fn(),
    onNodeHover: vi.fn(),
    onLinkClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders SVG canvas with correct dimensions', () => {
      render(<GraphVisualization {...defaultProps} />);
      
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '800');
      expect(svg).toHaveAttribute('height', '600');
    });

    it('renders nodes and links', () => {
      render(<GraphVisualization {...defaultProps} />);
      
      // Check for nodes (circles)
      const circles = document.querySelectorAll('circle');
      expect(circles.length).toBe(mockGraphData.nodes.length);
      
      // Check for links (lines)
      const lines = document.querySelectorAll('line');
      expect(lines.length).toBe(mockGraphData.links.length);
    });

    it('shows node labels when enabled', () => {
      render(<GraphVisualization {...defaultProps} showLabels={true} />);
      
      const labels = document.querySelectorAll('text');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('hides node labels when disabled', () => {
      render(<GraphVisualization {...defaultProps} showLabels={false} />);
      
      const labels = document.querySelectorAll('text');
      expect(labels.length).toBe(1); // Only stats text
    });
  });

  describe('interactions', () => {
    it('calls onNodeClick when node is clicked', () => {
      render(<GraphVisualization {...defaultProps} />);
      
      const firstNode = document.querySelector('circle');
      if (firstNode) {
        fireEvent.click(firstNode);
        expect(defaultProps.onNodeClick).toHaveBeenCalled();
      }
    });

    it('calls onNodeHover when node is hovered', () => {
      render(<GraphVisualization {...defaultProps} />);
      
      const firstNode = document.querySelector('circle');
      if (firstNode) {
        fireEvent.mouseEnter(firstNode);
        expect(defaultProps.onNodeHover).toHaveBeenCalled();
      }
    });

    it('calls onLinkClick when link is clicked', () => {
      render(<GraphVisualization {...defaultProps} />);
      
      const firstLink = document.querySelector('line');
      if (firstLink) {
        fireEvent.click(firstLink);
        expect(defaultProps.onLinkClick).toHaveBeenCalled();
      }
    });

    it('supports pan and zoom', () => {
      render(<GraphVisualization {...defaultProps} />);
      
      const svg = document.querySelector('svg');
      if (svg) {
        // Test mouse down for panning
        fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(svg, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(svg);
        
        // Test wheel for zooming
        fireEvent.wheel(svg, { deltaY: -100 });
        
        expect(svg).toBeInTheDocument();
      }
    });
  });

  describe('toolbar actions', () => {
    it('has reset view button', () => {
      render(<GraphVisualization {...defaultProps} />);
      
      const resetButton = screen.getByTitle('重置缩放');
      expect(resetButton).toBeInTheDocument();
      
      fireEvent.click(resetButton);
      // Should reset zoom and pan
    });

    it('has fit to screen button', () => {
      render(<GraphVisualization {...defaultProps} />);
      
      const fitButton = screen.getByTitle('适应屏幕');
      expect(fitButton).toBeInTheDocument();
      
      fireEvent.click(fitButton);
      // Should fit content to screen
    });
  });

  describe('node styling', () => {
    it('applies different colors for different node types', () => {
      render(<GraphVisualization {...defaultProps} />);
      
      const circles = document.querySelectorAll('circle');
      
      // Check if nodes have different fill colors based on type
      const pageNodes = Array.from(circles).filter(circle => 
        circle.getAttribute('fill') === '#3B82F6' // blue for pages
      );
      const tagNodes = Array.from(circles).filter(circle => 
        circle.getAttribute('fill') === '#F59E0B' // amber for tags
      );
      
      expect(pageNodes.length).toBeGreaterThan(0);
      expect(tagNodes.length).toBeGreaterThan(0);
    });

    it('highlights selected nodes', () => {
      render(<GraphVisualization {...defaultProps} />);
      
      const firstNode = document.querySelector('circle');
      if (firstNode) {
        fireEvent.click(firstNode);
        
        // Selected node should have different stroke
        expect(firstNode).toHaveAttribute('stroke-width', '3');
      }
    });
  });

  describe('information panel', () => {
    it('shows node information on hover', async () => {
      render(<GraphVisualization {...defaultProps} />);
      
      const firstNode = document.querySelector('circle');
      if (firstNode) {
        fireEvent.mouseEnter(firstNode);
        
        await waitFor(() => {
          expect(screen.getByText('页面1')).toBeInTheDocument();
        });
      }
    });

    it('shows node information on selection', async () => {
      render(<GraphVisualization {...defaultProps} />);
      
      const firstNode = document.querySelector('circle');
      if (firstNode) {
        fireEvent.click(firstNode);
        
        await waitFor(() => {
          expect(screen.getByText('页面1')).toBeInTheDocument();
        });
      }
    });
  });

  describe('statistics', () => {
    it('displays node and link counts', () => {
      render(<GraphVisualization {...defaultProps} />);
      
      // Should show stats in bottom left
      expect(screen.getByText(/节点: 3, 连接: 2/)).toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    it('filters out orphan nodes when showOrphans is false', () => {
      const dataWithOrphan = {
        nodes: [
          ...mockGraphData.nodes,
          {
            id: 'orphan-1',
            label: '孤立节点',
            type: 'page' as const,
            size: 10,
          },
        ],
        links: mockGraphData.links,
      };

      render(
        <GraphVisualization 
          {...defaultProps} 
          data={dataWithOrphan}
          showOrphans={false} 
        />
      );
      
      // Should only show connected nodes
      const circles = document.querySelectorAll('circle');
      expect(circles.length).toBe(3); // Original 3 nodes, orphan filtered out
    });
  });
});

describe('GraphSettings', () => {
  const defaultProps = {
    showLabels: true,
    showOrphans: true,
    nodeSize: 8,
    linkDistance: 50,
    repulsion: 100,
    attraction: 0.1,
    layout: 'force' as const,
    onSettingsChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all setting controls', () => {
    render(<GraphSettings {...defaultProps} />);
    
    expect(screen.getByText('显示设置')).toBeInTheDocument();
    expect(screen.getByText('布局设置')).toBeInTheDocument();
    expect(screen.getByText('显示标签')).toBeInTheDocument();
    expect(screen.getByText('显示孤立节点')).toBeInTheDocument();
  });

  it('calls onSettingsChange when checkbox is toggled', () => {
    render(<GraphSettings {...defaultProps} />);
    
    const showLabelsCheckbox = screen.getByRole('checkbox', { name: /显示标签/ });
    fireEvent.click(showLabelsCheckbox);
    
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      showLabels: false,
    });
  });

  it('calls onSettingsChange when layout is changed', () => {
    render(<GraphSettings {...defaultProps} />);
    
    const layoutSelect = screen.getByDisplayValue('力导向布局');
    fireEvent.change(layoutSelect, { target: { value: 'circular' } });
    
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      layout: 'circular',
    });
  });

  it('calls onSettingsChange when slider values change', () => {
    render(<GraphSettings {...defaultProps} />);
    
    const nodeSizeSlider = screen.getByDisplayValue('8');
    fireEvent.change(nodeSizeSlider, { target: { value: '12' } });
    
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      nodeSize: 12,
    });
  });

  it('displays current values correctly', () => {
    render(<GraphSettings {...defaultProps} />);
    
    expect(screen.getByText('节点大小: 8')).toBeInTheDocument();
    expect(screen.getByText('链接距离: 50')).toBeInTheDocument();
    expect(screen.getByText('排斥力: 100')).toBeInTheDocument();
    expect(screen.getByText('吸引力: 10.0%')).toBeInTheDocument();
  });
});
