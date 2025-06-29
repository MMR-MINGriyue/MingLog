import React, { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, Check, Sparkles, BookOpen, Search, Network, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { generateSampleData } from '../utils/sampleData'
import { useNotes } from '../hooks/useNotes'
import { useTags } from '../hooks/useTags'
import { useNotifications } from './NotificationSystem'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action?: () => void
  route?: string
  highlight?: string
}

interface OnboardingTourProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isGeneratingData, setIsGeneratingData] = useState(false)
  const navigate = useNavigate()
  const { createNewNote, createNewTag } = useNotes()
  const { success, error } = useNotifications()

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to MingLog Desktop!',
      description: 'Your modern knowledge management companion. Let\'s take a quick tour to get you started.',
      icon: <Sparkles className="w-8 h-8 text-primary-600" />
    },
    {
      id: 'notes',
      title: 'Create and Edit Notes',
      description: 'Write, organize, and manage your thoughts with our powerful note editor. Support for rich text, tags, and more.',
      icon: <BookOpen className="w-8 h-8 text-blue-600" />,
      route: '/editor',
      action: () => navigate('/editor')
    },
    {
      id: 'search',
      title: 'Powerful Search',
      description: 'Find anything instantly with full-text search, advanced filters, and smart suggestions.',
      icon: <Search className="w-8 h-8 text-green-600" />,
      route: '/search',
      action: () => navigate('/search')
    },
    {
      id: 'graph',
      title: 'Knowledge Graph',
      description: 'Visualize connections between your notes and discover new insights through interactive graphs.',
      icon: <Network className="w-8 h-8 text-purple-600" />,
      route: '/graph',
      action: () => navigate('/graph')
    },
    {
      id: 'settings',
      title: 'Customize Your Experience',
      description: 'Personalize MingLog with themes, shortcuts, and preferences that work best for you.',
      icon: <Settings className="w-8 h-8 text-orange-600" />,
      route: '/settings',
      action: () => navigate('/settings')
    },
    {
      id: 'sample-data',
      title: 'Get Started with Sample Data',
      description: 'Would you like us to create some sample notes and tags to help you explore the features?',
      icon: <Sparkles className="w-8 h-8 text-primary-600" />,
      action: async () => {
        setIsGeneratingData(true)
        try {
          await generateSampleData(createNewNote, createNewTag)
          success('Sample Data Created', 'Sample notes and tags have been added to help you get started!')
        } catch (err) {
          error('Failed to Create Sample Data', 'There was an error creating sample data. You can create notes manually.')
        } finally {
          setIsGeneratingData(false)
        }
      }
    }
  ]

  const currentStepData = steps[currentStep]

  const handleNext = () => {
    if (currentStepData.action) {
      currentStepData.action()
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('minglog-onboarding-completed', 'true')
    onComplete()
    onClose()
    navigate('/')
  }

  const handleSkip = () => {
    localStorage.setItem('minglog-onboarding-completed', 'true')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentStepData.icon}
              <div>
                <h2 className="text-xl font-semibold">{currentStepData.title}</h2>
                <p className="text-primary-100 text-sm">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-primary-100 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 h-1">
          <div
            className="bg-primary-600 h-1 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-gray-600 text-lg leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Special content for sample data step */}
          {currentStepData.id === 'sample-data' && (
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">Sample content includes:</h3>
              <ul className="text-blue-700 space-y-2">
                <li>• 7 example notes covering various topics</li>
                <li>• 10 useful tags for organization</li>
                <li>• Connections between notes for graph visualization</li>
                <li>• Real-world examples of note-taking best practices</li>
              </ul>
              {isGeneratingData && (
                <div className="mt-4 flex items-center text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating sample data...
                </div>
              )}
            </div>
          )}

          {/* Feature highlights for other steps */}
          {currentStepData.id !== 'welcome' && currentStepData.id !== 'sample-data' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Key Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {currentStepData.id === 'notes' && (
                    <>
                      <li>• Rich text editing</li>
                      <li>• Auto-save functionality</li>
                      <li>• Tag organization</li>
                      <li>• Favorites and archiving</li>
                    </>
                  )}
                  {currentStepData.id === 'search' && (
                    <>
                      <li>• Full-text search</li>
                      <li>• Advanced filters</li>
                      <li>• Search history</li>
                      <li>• Instant results</li>
                    </>
                  )}
                  {currentStepData.id === 'graph' && (
                    <>
                      <li>• Interactive visualization</li>
                      <li>• Multiple layouts</li>
                      <li>• Zoom and pan controls</li>
                      <li>• Node filtering</li>
                    </>
                  )}
                  {currentStepData.id === 'settings' && (
                    <>
                      <li>• Theme customization</li>
                      <li>• Keyboard shortcuts</li>
                      <li>• Data import/export</li>
                      <li>• Performance tuning</li>
                    </>
                  )}
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Pro Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {currentStepData.id === 'notes' && (
                    <>
                      <li>• Use Ctrl+N for quick note creation</li>
                      <li>• Tag consistently for better organization</li>
                      <li>• Link related notes together</li>
                      <li>• Use favorites for important notes</li>
                    </>
                  )}
                  {currentStepData.id === 'search' && (
                    <>
                      <li>• Use quotes for exact phrases</li>
                      <li>• Combine multiple search terms</li>
                      <li>• Filter by tags and dates</li>
                      <li>• Save frequent searches</li>
                    </>
                  )}
                  {currentStepData.id === 'graph' && (
                    <>
                      <li>• Click nodes to see details</li>
                      <li>• Use mouse wheel to zoom</li>
                      <li>• Try different layout algorithms</li>
                      <li>• Filter by content type</li>
                    </>
                  )}
                  {currentStepData.id === 'settings' && (
                    <>
                      <li>• Enable auto-save for peace of mind</li>
                      <li>• Customize keyboard shortcuts</li>
                      <li>• Regular data backups</li>
                      <li>• Adjust theme for comfort</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip tour
          </button>
          
          <div className="flex items-center space-x-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            )}
            
            <button
              onClick={handleNext}
              disabled={isGeneratingData}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Get Started</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingTour
