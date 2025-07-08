import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PerformanceMonitor from '../PerformanceMonitor';

// Mock the useOptimizedPerformanceMonitor hook
vi.mock('../../hooks/useOptimizedPerformanceMonitor', () => ({
  useOptimizedPerformanceMonitor: () => ({
    metrics: [],
    currentMetrics: null,
    isMonitoring: false,
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    clearData: vi.fn(),
    getOptimizationSuggestions: vi.fn(() => []),
    isLoading: false,
    error: null,
    history: [],
    clearHistory: vi.fn(),
  }),
}));

describe('PerformanceMonitor - Simple Tests', () => {
  it('should render without crashing when closed', () => {
    render(<PerformanceMonitor isOpen={false} onClose={vi.fn()} />);
    // When closed, the component should not render anything visible
    expect(screen.queryByText('Performance Monitor')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />);
    // When open, the component should render the title
    expect(screen.getByText('Performance Monitor')).toBeInTheDocument();
  });

  it('should render start button when not monitoring', () => {
    render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Start')).toBeInTheDocument();
  });
});
