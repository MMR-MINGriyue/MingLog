import React, { useState, useEffect } from 'react'
import { Info, X, ChevronRight, ChevronLeft, Check } from 'lucide-react'

interface GuideStep {
  id: string
  title: string
  content: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

interface UserGuideProps {
  isOpen: boolean
  onClose: () => void
  steps: GuideStep[]
  componentName: string
}

const UserGuide: React.FC<UserGuideProps> = ({ isOpen, onClose, steps, componentName }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenGuide, setHasSeenGuide] = useState(false)

  useEffect(() => {
    // Check if user has seen this guide before
    const seenGuides = JSON.parse(localStorage.getItem('minglog_seen_guides') || '{}')
    setHasSeenGuide(seenGuides[componentName] || false)
  }, [componentName])

  const markGuideAsSeen = () => {
    const seenGuides = JSON.parse(localStorage.getItem('minglog_seen_guides') || '{}')
    seenGuides[componentName] = true
    localStorage.setItem('minglog_seen_guides', JSON.stringify(seenGuides))
    setHasSeenGuide(true)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      markGuideAsSeen()
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    markGuideAsSeen()
    onClose()
  }

  if (!isOpen || hasSeenGuide) return null

  const currentStepData = steps[currentStep]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Quick Guide
            </h3>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded"
            aria-label="Skip guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
            {currentStepData.title}
          </h4>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {currentStepData.content}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSkip}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Finish</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 Tip: You can always access help by pressing F1 or clicking the help icon
          </p>
        </div>
      </div>
    </div>
  )
}

export default UserGuide

// Predefined guide steps for different components
export const performanceMonitorGuideSteps: GuideStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Performance Monitor',
    content: 'This tool helps you monitor your application\'s performance in real-time. You can track memory usage, render times, and database performance.',
  },
  {
    id: 'metrics',
    title: 'Understanding Metrics',
    content: 'The colored indicators show performance status: Green (good), Yellow (warning), Red (critical). Click on any metric card for detailed information.',
  },
  {
    id: 'controls',
    title: 'Monitor Controls',
    content: 'Use the Start/Stop button to control monitoring. The system automatically adjusts monitoring frequency based on performance status.',
  },
  {
    id: 'keyboard',
    title: 'Keyboard Shortcuts',
    content: 'Press Escape to close, Ctrl+R to restart monitoring, or Tab to navigate between controls. All features are keyboard accessible.',
  },
  {
    id: 'tips',
    title: 'Performance Tips',
    content: 'Check the Performance Tips section for recommendations. Close the monitor when not needed to save system resources.',
  },
]

export const searchGuideSteps: GuideStep[] = [
  {
    id: 'search-welcome',
    title: 'Welcome to Smart Search',
    content: 'Search through all your pages and blocks instantly. The search is optimized for speed with intelligent caching.',
  },
  {
    id: 'search-options',
    title: 'Search Options',
    content: 'Toggle between searching pages, blocks, or both. Use the checkboxes to customize your search scope.',
  },
  {
    id: 'search-navigation',
    title: 'Keyboard Navigation',
    content: 'Use arrow keys to navigate results, Enter to select, and Escape to close. All search features work without a mouse.',
  },
  {
    id: 'search-performance',
    title: 'Search Performance',
    content: 'Search results are cached for 5 minutes and queries are debounced for optimal performance. Typical search time is under 10ms.',
  },
]
