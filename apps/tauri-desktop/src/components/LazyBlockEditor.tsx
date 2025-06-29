import React, { Suspense, lazy } from 'react'
import { Loader2, Edit3 } from 'lucide-react'

// Lazy load the BlockEditor component
const BlockEditor = lazy(() => import('@minglog/editor').then(module => ({
  default: module.BlockEditor || module.default
})))

// Loading skeleton for block editor
const EditorLoadingSkeleton: React.FC = () => (
  <div className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
    <div className="flex items-center space-x-2 mb-3">
      <Edit3 className="w-4 h-4 text-gray-400" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
    </div>
    <div className="flex items-center justify-center mt-4">
      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading editor...</span>
    </div>
  </div>
)

// Error boundary for block editor
class EditorErrorBoundary extends React.Component<
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
    console.error('Block editor error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Editor Error
            </h3>
            <p className="text-xs text-red-600 dark:text-red-300 mb-3">
              Failed to load the block editor.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Props interface for the lazy block editor
interface LazyBlockEditorProps {
  block: any
  onUpdate: (content: string) => void
  onEnter?: () => void
  onBackspace?: () => void
  onTab?: () => void
  onShiftTab?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onDelete?: () => void
  placeholder?: string
  autoFocus?: boolean
  level?: number
  showToolbar?: boolean
}

// Lazy-loaded block editor with error boundary and loading state
const LazyBlockEditor: React.FC<LazyBlockEditorProps> = (props) => {
  return (
    <EditorErrorBoundary>
      <Suspense fallback={<EditorLoadingSkeleton />}>
        <BlockEditor {...props} />
      </Suspense>
    </EditorErrorBoundary>
  )
}

export default React.memo(LazyBlockEditor)
