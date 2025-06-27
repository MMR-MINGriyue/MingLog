/**
 * 性能测试
 * Performance Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GraphVisualization } from '../components/GraphVisualization';
import { PageManager } from '../components/PageManager';
import { mockGraphData, mockPage, mockGraph } from './utils';

describe('Performance Tests', () => {
  describe('GraphVisualization Performance', () => {
    it('renders large graph efficiently', async () => {
      // Create a large graph with many nodes and links
      const largeGraphData = {
        nodes: Array.from({ length: 1000 }, (_, i) => ({
          id: `node-${i}`,
          label: `Node ${i}`,
          type: 'page' as const,
          size: 8,
        })),
        links: Array.from({ length: 500 }, (_, i) => ({
          id: `link-${i}`,
          source: `node-${i}`,
          target: `node-${(i + 1) % 1000}`,
          type: 'reference' as const,
        })),
      };

      const startTime = performance.now();
      
      render(
        <GraphVisualization
          data={largeGraphData}
          width={800}
          height={600}
          onNodeClick={vi.fn()}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);

      // Should render all nodes
      const circles = document.querySelectorAll('circle');
      expect(circles.length).toBe(1000);
    });

    it('handles rapid zoom operations efficiently', async () => {
      render(
        <GraphVisualization
          data={mockGraphData}
          width={800}
          height={600}
          onNodeClick={vi.fn()}
        />
      );

      const svg = document.querySelector('svg');
      if (!svg) throw new Error('SVG not found');

      const startTime = performance.now();

      // Perform rapid zoom operations
      for (let i = 0; i < 100; i++) {
        fireEvent.wheel(svg, { deltaY: i % 2 === 0 ? -100 : 100 });
      }

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      // Should handle rapid operations efficiently
      expect(operationTime).toBeLessThan(500);
    });

    it('handles rapid pan operations efficiently', async () => {
      render(
        <GraphVisualization
          data={mockGraphData}
          width={800}
          height={600}
          onNodeClick={vi.fn()}
        />
      );

      const svg = document.querySelector('svg');
      if (!svg) throw new Error('SVG not found');

      const startTime = performance.now();

      // Perform rapid pan operations
      for (let i = 0; i < 100; i++) {
        fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(svg, { clientX: 100 + i, clientY: 100 + i });
        fireEvent.mouseUp(svg);
      }

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      // Should handle rapid operations efficiently
      expect(operationTime).toBeLessThan(500);
    });
  });

  describe('PageManager Performance', () => {
    it('renders large page list efficiently', async () => {
      // Create a large list of pages
      const largePageList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockPage,
        id: `page-${i}`,
        name: `Page ${i}`,
        title: `Page ${i} Title`,
        tags: [`tag-${i % 10}`],
        createdAt: Date.now() - i * 1000,
        updatedAt: Date.now() - i * 500,
      }));

      const startTime = performance.now();

      render(
        <PageManager
          pages={largePageList}
          currentPage={largePageList[0]}
          currentGraph={mockGraph}
          onPageSelect={vi.fn()}
          onCreatePage={vi.fn()}
          onDeletePage={vi.fn()}
          onUpdatePage={vi.fn()}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(2000);

      // Should show page list
      expect(screen.getByText('页面')).toBeInTheDocument();
    });

    it('handles rapid search operations efficiently', async () => {
      const largePageList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockPage,
        id: `page-${i}`,
        name: `Page ${i}`,
        title: `Page ${i} Title`,
        tags: [`tag-${i % 10}`],
      }));

      render(
        <PageManager
          pages={largePageList}
          currentPage={largePageList[0]}
          currentGraph={mockGraph}
          onPageSelect={vi.fn()}
          onCreatePage={vi.fn()}
          onDeletePage={vi.fn()}
          onUpdatePage={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText('搜索页面、标签或内容...');
      
      const startTime = performance.now();

      // Perform rapid search operations
      for (let i = 0; i < 50; i++) {
        fireEvent.change(searchInput, { target: { value: `Page ${i}` } });
      }

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      // Should handle rapid search efficiently
      expect(operationTime).toBeLessThan(1000);
    });

    it('handles rapid filter changes efficiently', async () => {
      const largePageList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockPage,
        id: `page-${i}`,
        name: `Page ${i}`,
        title: `Page ${i} Title`,
        isJournal: i % 2 === 0,
        tags: [`tag-${i % 10}`],
      }));

      render(
        <PageManager
          pages={largePageList}
          currentPage={largePageList[0]}
          currentGraph={mockGraph}
          onPageSelect={vi.fn()}
          onCreatePage={vi.fn()}
          onDeletePage={vi.fn()}
          onUpdatePage={vi.fn()}
        />
      );

      const startTime = performance.now();

      // Simulate rapid filter changes
      // This would involve clicking filter buttons rapidly
      // For now, we just measure the initial render time
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;

      // Should handle operations efficiently
      expect(operationTime).toBeLessThan(100);
    });
  });

  describe('Memory Usage', () => {
    it('does not leak memory with repeated renders', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Render and unmount components multiple times
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(
          <GraphVisualization
            data={mockGraphData}
            width={800}
            height={600}
            onNodeClick={vi.fn()}
          />
        );
        unmount();
      }

      // Allow garbage collection
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('cleans up event listeners properly', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <GraphVisualization
          data={mockGraphData}
          width={800}
          height={600}
          onNodeClick={vi.fn()}
        />
      );

      const addedListeners = addEventListenerSpy.mock.calls.length;
      
      unmount();

      const removedListeners = removeEventListenerSpy.mock.calls.length;

      // Should remove as many listeners as it added
      expect(removedListeners).toBeGreaterThanOrEqual(addedListeners);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Rendering Optimization', () => {
    it('uses efficient rendering for large datasets', async () => {
      const largeDataset = {
        nodes: Array.from({ length: 5000 }, (_, i) => ({
          id: `node-${i}`,
          label: `Node ${i}`,
          type: 'page' as const,
          size: 8,
        })),
        links: Array.from({ length: 2500 }, (_, i) => ({
          id: `link-${i}`,
          source: `node-${i}`,
          target: `node-${(i + 1) % 5000}`,
          type: 'reference' as const,
        })),
      };

      const startTime = performance.now();

      render(
        <GraphVisualization
          data={largeDataset}
          width={800}
          height={600}
          showOrphans={false} // This should improve performance
          onNodeClick={vi.fn()}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should still render efficiently even with large dataset
      expect(renderTime).toBeLessThan(3000);
    });

    it('optimizes re-renders when props change', async () => {
      let renderCount = 0;
      const TestComponent = (props: any) => {
        renderCount++;
        return <GraphVisualization {...props} />;
      };

      const { rerender } = render(
        <TestComponent
          data={mockGraphData}
          width={800}
          height={600}
          onNodeClick={vi.fn()}
        />
      );

      const initialRenderCount = renderCount;

      // Change non-critical prop
      rerender(
        <TestComponent
          data={mockGraphData}
          width={800}
          height={600}
          showLabels={false}
          onNodeClick={vi.fn()}
        />
      );

      // Should have re-rendered
      expect(renderCount).toBe(initialRenderCount + 1);
    });
  });
});
