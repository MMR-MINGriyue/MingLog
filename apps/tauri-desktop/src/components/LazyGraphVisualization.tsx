import React, { Suspense, lazy } from 'react'
import { Loader2 } from 'lucide-react'

// Lazy load the GraphVisualization component
const GraphVisualization = lazy(() => import('@minglog/graph').then(module => ({
  default: module.GraphVisualization
})))

// Loading skeleton for graph visualization
const GraphLoadingSkeleton: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
      <p className="text-sm text-gray-600 dark:text-gray-400">Loading graph visualization...</p>
      <div className="mt-4 space-y-2">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32 mx-auto"></div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24 mx-auto"></div>
      </div>
    </div>
  </div>
)

// Error boundary for graph visualization
class GraphErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Graph visualization error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-center p-6">
            <div className="text-red-500 mb-2">⚠️</div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              Graph Visualization Error
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300 mb-4">
              Failed to load the graph visualization component.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Props interface for the lazy graph component
interface LazyGraphVisualizationProps {
  data: any
  config?: any
  filter?: any
  theme?: any
  onNodeClick?: (node: any) => void
  onNodeHover?: (node: any) => void
  onLinkClick?: (link: any) => void
  onBackgroundClick?: () => void
  className?: string
  style?: React.CSSProperties
}

// Lazy-loaded graph visualization with error boundary and loading state
const LazyGraphVisualization: React.FC<LazyGraphVisualizationProps> = (props) => {
  return (
    <GraphErrorBoundary>
      <Suspense fallback={<GraphLoadingSkeleton />}>
        <GraphVisualization {...props} />
      </Suspense>
    </GraphErrorBoundary>
  )
}

export default React.memo(LazyGraphVisualization)
