import React, { Suspense, lazy } from 'react';
import { Activity, Settings, HelpCircle } from 'lucide-react';

// Loading component with skeleton support
const LoadingSpinner: React.FC<{
  message?: string;
  componentType?: 'performance-monitor' | 'user-guide' | 'user-preferences' | 'default';
}> = ({ message = 'Loading...', componentType = 'default' }) => {

  // Get appropriate icon based on component type
  const getIcon = () => {
    switch (componentType) {
      case 'performance-monitor':
        return <Activity data-testid="activity-icon" className="w-6 h-6" />;
      case 'user-guide':
        return <HelpCircle data-testid="help-circle-icon" className="w-6 h-6" />;
      case 'user-preferences':
        return <Settings data-testid="settings-icon" className="w-6 h-6" />;
      default:
        return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>;
    }
  };

  // For performance monitor, render full skeleton overlay
  if (componentType === 'performance-monitor') {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        data-testid="performance-monitor-skeleton"
        role="dialog"
        aria-label="Loading Performance Monitor"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md mx-4">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <span className="text-gray-600 dark:text-gray-400">{message}</span>
          </div>
        </div>
      </div>
    );
  }

  // For user guide, render modal-style skeleton
  if (componentType === 'user-guide') {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        data-testid="user-guide-skeleton"
        role="dialog"
        aria-label="Loading User Guide"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-2xl mx-4">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <span className="text-gray-600 dark:text-gray-400">{message}</span>
          </div>
        </div>
      </div>
    );
  }

  // For user preferences, render modal-style skeleton
  if (componentType === 'user-preferences') {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        data-testid="user-preferences-skeleton"
        role="dialog"
        aria-label="Loading User Preferences"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-lg mx-4">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <span className="text-gray-600 dark:text-gray-400">{message}</span>
          </div>
        </div>
      </div>
    );
  }

  // Default loading spinner
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-3">
        {getIcon()}
        <span className="text-gray-600 dark:text-gray-400">{message}</span>
      </div>
    </div>
  );
};

// Error boundary for lazy components
class LazyComponentErrorBoundary extends React.Component<
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
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-8 text-red-500">
          <div className="text-center">
            <p className="font-medium">Failed to load component</p>
            <p className="text-sm mt-1">{this.state.error?.message}</p>
            <button
              type="button"
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

// Lazy component wrapper with error boundary and loading state
const withLazyLoading = <P extends object>(
  Component: React.LazyExoticComponent<React.ComponentType<P>>,
  loadingMessage?: string,
  componentType?: 'performance-monitor' | 'user-guide' | 'user-preferences' | 'default',
  fallback?: React.ReactNode
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <LazyComponentErrorBoundary fallback={fallback}>
      <Suspense fallback={<LoadingSpinner message={loadingMessage} componentType={componentType} />}>
        <Component {...props} ref={ref} />
      </Suspense>
    </LazyComponentErrorBoundary>
  ));
};

// Lazy loaded components
export const LazyPerformanceMonitor = withLazyLoading(
  lazy(() => import('./PerformanceMonitor')),
  'Loading Performance Monitor...',
  'performance-monitor'
);

export const LazyOptimizedPerformanceMonitor = withLazyLoading(
  lazy(() => import('./OptimizedPerformanceMonitor')),
  'Loading Optimized Performance Monitor...',
  'performance-monitor'
);

export const LazyVirtualizedSearchResults = withLazyLoading(
  lazy(() => import('./VirtualizedSearchResults')),
  'Loading Search Results...',
  'default'
);

export const LazyVirtualizedPerformanceList = withLazyLoading(
  lazy(() => import('./VirtualizedPerformanceList')),
  'Loading Performance List...',
  'default'
);

export const LazySearchComponent = withLazyLoading(
  lazy(() => import('./SearchComponent')),
  'Loading Search Component...',
  'default'
);

// Chart components (heavy dependencies)
export const LazyChartLoader = withLazyLoading(
  lazy(() => import('./ChartLoader')),
  'Loading Charts...',
  'default'
);

// User interface components
export const LazyUserGuide = withLazyLoading(
  lazy(() => import('./UserGuide')),
  'Loading User Guide...',
  'user-guide'
);

export const LazyUserPreferences = withLazyLoading(
  lazy(() => import('./UserPreferences')),
  'Loading User Preferences...',
  'user-preferences'
);

// Settings and configuration components
export const LazySettingsPanel = withLazyLoading(
  lazy(() => import('./SettingsPanel')),
  'Loading Settings...',
  'default'
);

// Module-specific lazy components
export const LazyNotesModule = withLazyLoading(
  lazy(() => import('./modules/NotesModule')),
  'Loading Notes Module...'
);

export const LazyMindMapModule = withLazyLoading(
  lazy(() => import('./modules/MindMapModule')),
  'Loading Mind Map Module...'
);

export const LazyTasksModule = withLazyLoading(
  lazy(() => import('./modules/TasksModule')),
  'Loading Tasks Module...'
);

// Utility function to preload components
export const preloadComponent = (componentLoader: () => Promise<any>) => {
  // Preload on idle or after a delay
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => componentLoader());
  } else {
    setTimeout(() => componentLoader(), 100);
  }
};

// Preload critical components
export const preloadCriticalComponents = () => {
  preloadComponent(() => import('./PerformanceMonitor'));
  preloadComponent(() => import('./SearchComponent'));
};

// Component registry for dynamic loading
export const componentRegistry = {
  PerformanceMonitor: LazyPerformanceMonitor,
  OptimizedPerformanceMonitor: LazyOptimizedPerformanceMonitor,
  VirtualizedSearchResults: LazyVirtualizedSearchResults,
  VirtualizedPerformanceList: LazyVirtualizedPerformanceList,
  SearchComponent: LazySearchComponent,
  ChartLoader: LazyChartLoader,
  SettingsPanel: LazySettingsPanel,
  NotesModule: LazyNotesModule,
  MindMapModule: LazyMindMapModule,
  TasksModule: LazyTasksModule,
};

// Dynamic component loader
export const loadComponent = (componentName: keyof typeof componentRegistry) => {
  return componentRegistry[componentName];
};

// Hook for lazy loading with loading state
export const useLazyComponent = (componentName: keyof typeof componentRegistry) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      const LazyComponent = loadComponent(componentName);
      setComponent(() => LazyComponent);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [componentName]);

  return { Component, isLoading, error };
};

// Safe lazy components with enhanced error boundaries
export const SafeLazyPerformanceMonitor = withLazyLoading(
  lazy(() => import('./PerformanceMonitor')),
  'Loading Performance Monitor...',
  'performance-monitor',
  <div className="p-8 text-center text-red-500">
    <p>Failed to load Performance Monitor</p>
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Reload
    </button>
  </div>
);

export const SafeLazyUserGuide = withLazyLoading(
  lazy(() => import('./UserGuide')),
  'Loading User Guide...',
  'user-guide',
  <div className="p-8 text-center text-red-500">
    <p>Failed to load User Guide</p>
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Reload
    </button>
  </div>
);

export const SafeLazyUserPreferences = withLazyLoading(
  lazy(() => import('./UserPreferences')),
  'Loading User Preferences...',
  'user-preferences',
  <div className="p-8 text-center text-red-500">
    <p>Failed to load User Preferences</p>
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Reload
    </button>
  </div>
);

// Export LazyComponentErrorBoundary for external use
export { LazyComponentErrorBoundary };

export default {
  LazyPerformanceMonitor,
  LazyOptimizedPerformanceMonitor,
  LazyVirtualizedSearchResults,
  LazyVirtualizedPerformanceList,
  LazySearchComponent,
  LazyChartLoader,
  LazySettingsPanel,
  LazyNotesModule,
  LazyMindMapModule,
  LazyTasksModule,
  withLazyLoading,
  preloadComponent,
  preloadCriticalComponents,
  loadComponent,
  useLazyComponent,
};
