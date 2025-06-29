import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'

// Import i18n configuration
import './i18n'

// Import components from packages (will be implemented later)
// import { DatabaseProvider } from '@minglog/database'
// import { EditorProvider } from '@minglog/editor'
// import { SearchProvider } from '@minglog/search'

// Import local components
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import EditorPage from './pages/EditorPage'
import BlockEditorPage from './components/BlockEditorPage'
import GraphPage from './pages/GraphPage'
import SearchPage from './pages/SearchPage'
import SettingsPage from './pages/SettingsPage'
import LoadingScreen from './components/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'
import { NotificationProvider } from './components/NotificationSystem'
import { ThemeProvider } from './hooks/useTheme'
import OnboardingTour from './components/OnboardingTour'
import SearchComponent from './components/SearchComponent'

// Types
interface AppState {
  isLoading: boolean
  isInitialized: boolean
  error: string | null
}

function App() {
  const { t } = useTranslation()
  const [appState, setAppState] = useState<AppState>({
    isLoading: true,
    isInitialized: false,
    error: null,
  })
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

  // Initialize the application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setAppState(prev => ({ ...prev, isLoading: true, error: null }))
        
        // Initialize Tauri backend
        await invoke('init_app')
        
        // Initialize database
        await invoke('init_database')
        
        // Set app as initialized
        setAppState({
          isLoading: false,
          isInitialized: true,
          error: null,
        })

        // Check if this is the first time user opens the app
        const hasCompletedOnboarding = localStorage.getItem('minglog-onboarding-completed')
        if (!hasCompletedOnboarding) {
          setShowOnboarding(true)
        }
        
        console.log('MingLog Desktop app initialized successfully')
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setAppState({
          isLoading: false,
          isInitialized: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        })
      }
    }

    initializeApp()
  }, [])

  // Show loading screen while initializing
  if (appState.isLoading) {
    return <LoadingScreen message={t('common.loading')} />
  }

  // Show error screen if initialization failed
  if (appState.error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-error-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('errors.generic')}
          </h2>
          <p className="text-gray-600 mb-4">
            {appState.error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  }

  // Main app content
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          {/* TODO: Add other providers when packages are ready */}
          {/* <DatabaseProvider> */}
          {/* <EditorProvider> */}
          {/* <SearchProvider> */}
            <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/editor" element={<EditorPage />} />
                  <Route path="/editor/:pageId" element={<EditorPage />} />
                  <Route path="/blocks" element={<BlockEditorPage />} />
                  <Route path="/blocks/:pageId" element={<BlockEditorPage />} />
                  <Route path="/graph" element={<GraphPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </div>
          {/* </SearchProvider> */}
          {/* </EditorProvider> */}
          {/* </DatabaseProvider> */}
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
