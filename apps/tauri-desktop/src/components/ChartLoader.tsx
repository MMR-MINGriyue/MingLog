import React, { Suspense, lazy } from 'react';

// Loading component for charts
const ChartLoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      <span className="text-gray-600 dark:text-gray-400">Loading chart...</span>
    </div>
  </div>
);

// Error boundary for chart components
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-8 text-red-500">
          <div className="text-center">
            <p className="font-medium">Failed to load chart</p>
            <p className="text-sm mt-1">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy loaded chart components
const LazyLineChart = lazy(() => import('./charts/LineChart'));
const LazyBarChart = lazy(() => import('./charts/BarChart'));
const LazyPieChart = lazy(() => import('./charts/PieChart'));
const LazyAreaChart = lazy(() => import('./charts/AreaChart'));

interface ChartLoaderProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: any;
  options?: any;
  className?: string;
  fallback?: React.ReactNode;
}

const ChartLoader: React.FC<ChartLoaderProps> = ({
  type,
  data,
  options,
  className = '',
  fallback,
}) => {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return <LazyLineChart data={data} options={options} className={className} />;
      case 'bar':
        return <LazyBarChart data={data} options={options} className={className} />;
      case 'pie':
        return <LazyPieChart data={data} options={options} className={className} />;
      case 'area':
        return <LazyAreaChart data={data} options={options} className={className} />;
      default:
        return (
          <div className="flex items-center justify-center p-8 text-gray-500">
            <p>Unsupported chart type: {type}</p>
          </div>
        );
    }
  };

  return (
    <ChartErrorBoundary fallback={fallback}>
      <Suspense fallback={<ChartLoadingSpinner />}>
        {renderChart()}
      </Suspense>
    </ChartErrorBoundary>
  );
};

export default ChartLoader;

// Export individual chart loaders for direct use
export const LineChartLoader: React.FC<Omit<ChartLoaderProps, 'type'>> = (props) => (
  <ChartLoader {...props} type="line" />
);

export const BarChartLoader: React.FC<Omit<ChartLoaderProps, 'type'>> = (props) => (
  <ChartLoader {...props} type="bar" />
);

export const PieChartLoader: React.FC<Omit<ChartLoaderProps, 'type'>> = (props) => (
  <ChartLoader {...props} type="pie" />
);

export const AreaChartLoader: React.FC<Omit<ChartLoaderProps, 'type'>> = (props) => (
  <ChartLoader {...props} type="area" />
);

// Utility function to preload chart libraries
export const preloadChartLibraries = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      import('./charts/LineChart');
      import('./charts/BarChart');
    });
  } else {
    setTimeout(() => {
      import('./charts/LineChart');
      import('./charts/BarChart');
    }, 100);
  }
};
