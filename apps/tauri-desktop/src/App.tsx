import React, { useState, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Import i18n configuration
import './i18n'

// Import modular architecture
import { CoreProvider, CoreWrapper } from './contexts/CoreContext'
import { ModularRouter } from './router/ModularRouter'

// Import local components
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { NotificationProvider } from './components/NotificationSystem'
import { ThemeProvider } from './hooks/useTheme'
import OnboardingTour from './components/OnboardingTour'
import SearchComponent from './components/SearchComponent'

function App() {
  const { t } = useTranslation()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  // Handle global search shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K or Ctrl+F to open search
      if ((event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === 'f')) {
        // Don't trigger if already in an input field
        const target = event.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
          return
        }

        event.preventDefault()
        setShowSearch(true)
      }

      // Escape to close search
      if (event.key === 'Escape' && showSearch) {
        setShowSearch(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showSearch])

  // Check for onboarding on mount
  useEffect(() => {
    try {
      const hasCompletedOnboarding = localStorage.getItem('minglog-onboarding-completed')
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true)
      }
    } catch (e) {
      console.warn('LocalStorage not available:', e)
    }
  }, [])

  // Main app content with modular architecture
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <BrowserRouter>
            <CoreProvider>
              <CoreWrapper>
                <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
                  <Layout>
                    <ModularRouter />
                  </Layout>
                </div>
              </CoreWrapper>
            </CoreProvider>
          </BrowserRouter>
        </NotificationProvider>

        {/* Onboarding Tour */}
        <OnboardingTour
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={() => setShowOnboarding(false)}
        />

        {/* Global Search */}
        <SearchComponent
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
        />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
