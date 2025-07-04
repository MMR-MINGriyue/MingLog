import React, { useState, useEffect } from 'react'
import { Settings, Save, RotateCcw, Monitor, Search, Palette, Accessibility } from 'lucide-react'

interface UserPreferences {
  // Performance Monitor preferences
  performanceMonitor: {
    autoStart: boolean
    updateInterval: number
    showTips: boolean
    compactMode: boolean
  }
  // Search preferences
  search: {
    defaultIncludePages: boolean
    defaultIncludeBlocks: boolean
    cacheEnabled: boolean
    debounceDelay: number
  }
  // UI preferences
  ui: {
    theme: 'light' | 'dark' | 'system'
    fontSize: 'small' | 'medium' | 'large'
    reducedMotion: boolean
    highContrast: boolean
  }
  // Accessibility preferences
  accessibility: {
    screenReaderOptimized: boolean
    keyboardNavigationHints: boolean
    focusIndicators: boolean
    announceChanges: boolean
  }
}

const defaultPreferences: UserPreferences = {
  performanceMonitor: {
    autoStart: true,
    updateInterval: 2000,
    showTips: true,
    compactMode: false,
  },
  search: {
    defaultIncludePages: true,
    defaultIncludeBlocks: true,
    cacheEnabled: true,
    debounceDelay: 300,
  },
  ui: {
    theme: 'system',
    fontSize: 'medium',
    reducedMotion: false,
    highContrast: false,
  },
  accessibility: {
    screenReaderOptimized: false,
    keyboardNavigationHints: true,
    focusIndicators: true,
    announceChanges: true,
  },
}

interface UserPreferencesProps {
  isOpen: boolean
  onClose: () => void
  onPreferencesChange?: (preferences: UserPreferences) => void
}

const UserPreferences: React.FC<UserPreferencesProps> = ({ isOpen, onClose, onPreferencesChange }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [activeTab, setActiveTab] = useState<'monitor' | 'search' | 'ui' | 'accessibility'>('monitor')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    // Load preferences from localStorage
    const savedPreferences = localStorage.getItem('minglog_user_preferences')
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences)
        setPreferences({ ...defaultPreferences, ...parsed })
      } catch (error) {
        console.warn('Failed to parse saved preferences:', error)
      }
    }
  }, [])

  const savePreferences = () => {
    localStorage.setItem('minglog_user_preferences', JSON.stringify(preferences))
    setHasChanges(false)
    onPreferencesChange?.(preferences)
    
    // Show success message
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.className = 'sr-only'
    announcement.textContent = 'Preferences saved successfully'
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  }

  const resetToDefaults = () => {
    setPreferences(defaultPreferences)
    setHasChanges(true)
  }

  const updatePreference = (section: keyof UserPreferences, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
    setHasChanges(true)
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'monitor', label: 'Performance', icon: Monitor },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'ui', label: 'Interface', icon: Palette },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
  ] as const

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              User Preferences
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close preferences"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'monitor' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Performance Monitor Settings</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-start monitoring</span>
                  <input
                    type="checkbox"
                    checked={preferences.performanceMonitor.autoStart}
                    onChange={(e) => updatePreference('performanceMonitor', 'autoStart', e.target.checked)}
                    className="rounded"
                  />
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Update interval: {preferences.performanceMonitor.updateInterval / 1000}s
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="1000"
                    value={preferences.performanceMonitor.updateInterval}
                    onChange={(e) => updatePreference('performanceMonitor', 'updateInterval', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show performance tips</span>
                  <input
                    type="checkbox"
                    checked={preferences.performanceMonitor.showTips}
                    onChange={(e) => updatePreference('performanceMonitor', 'showTips', e.target.checked)}
                    className="rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Compact mode</span>
                  <input
                    type="checkbox"
                    checked={preferences.performanceMonitor.compactMode}
                    onChange={(e) => updatePreference('performanceMonitor', 'compactMode', e.target.checked)}
                    className="rounded"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Search Settings</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Include pages by default</span>
                  <input
                    type="checkbox"
                    checked={preferences.search.defaultIncludePages}
                    onChange={(e) => updatePreference('search', 'defaultIncludePages', e.target.checked)}
                    className="rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Include blocks by default</span>
                  <input
                    type="checkbox"
                    checked={preferences.search.defaultIncludeBlocks}
                    onChange={(e) => updatePreference('search', 'defaultIncludeBlocks', e.target.checked)}
                    className="rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable search cache</span>
                  <input
                    type="checkbox"
                    checked={preferences.search.cacheEnabled}
                    onChange={(e) => updatePreference('search', 'cacheEnabled', e.target.checked)}
                    className="rounded"
                  />
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search delay: {preferences.search.debounceDelay}ms
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={preferences.search.debounceDelay}
                    onChange={(e) => updatePreference('search', 'debounceDelay', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Accessibility Settings</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Screen reader optimized</span>
                  <input
                    type="checkbox"
                    checked={preferences.accessibility.screenReaderOptimized}
                    onChange={(e) => updatePreference('accessibility', 'screenReaderOptimized', e.target.checked)}
                    className="rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keyboard navigation hints</span>
                  <input
                    type="checkbox"
                    checked={preferences.accessibility.keyboardNavigationHints}
                    onChange={(e) => updatePreference('accessibility', 'keyboardNavigationHints', e.target.checked)}
                    className="rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enhanced focus indicators</span>
                  <input
                    type="checkbox"
                    checked={preferences.accessibility.focusIndicators}
                    onChange={(e) => updatePreference('accessibility', 'focusIndicators', e.target.checked)}
                    className="rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Announce status changes</span>
                  <input
                    type="checkbox"
                    checked={preferences.accessibility.announceChanges}
                    onChange={(e) => updatePreference('accessibility', 'announceChanges', e.target.checked)}
                    className="rounded"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={resetToDefaults}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={savePreferences}
              disabled={!hasChanges}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                hasChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserPreferences

// Hook to use preferences in components
export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)

  useEffect(() => {
    const savedPreferences = localStorage.getItem('minglog_user_preferences')
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences)
        setPreferences({ ...defaultPreferences, ...parsed })
      } catch (error) {
        console.warn('Failed to parse saved preferences:', error)
      }
    }
  }, [])

  return preferences
}
