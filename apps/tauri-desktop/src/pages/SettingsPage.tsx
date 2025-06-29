import React, { useState } from 'react'
import {
  Settings,
  User,
  Database,
  Palette,
  Shield,
  Download,
  Upload,
  Trash2,
  Info,
  Activity,
  Sync,
  HelpCircle
} from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { useThemeContext, ThemeToggle } from '../hooks/useTheme'
import { useNotifications } from '../components/NotificationSystem'
import { exportData, importData, getAppInfo, withErrorHandling } from '../utils/tauri'
import PerformanceMonitor from '../components/PerformanceMonitor'
import OnboardingTour from '../components/OnboardingTour'

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general')
  const { settings, updateSetting, updateMultipleSettings, resetToDefaults, loading } = useSettings()
  const { theme } = useThemeContext()
  const { success, error } = useNotifications()
  const [appInfo, setAppInfo] = useState<any>(null)
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Load app info
  React.useEffect(() => {
    const loadAppInfo = async () => {
      const info = await withErrorHandling(() => getAppInfo(), 'Failed to load app info')
      if (info) setAppInfo(info)
    }
    loadAppInfo()
  }, [])

  const handleExportData = async () => {
    try {
      // In a real app, you'd use Tauri's dialog API to select save location
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `minglog-backup-${timestamp}.json`

      const result = await withErrorHandling(
        () => exportData(filename),
        'Failed to export data'
      )

      if (result !== null) {
        success('Data Exported', `Your data has been exported to ${filename}`)
      }
    } catch (err) {
      error('Export Failed', 'Unable to export your data')
    }
  }

  const handleImportData = async () => {
    try {
      // In a real app, you'd use Tauri's dialog API to select file
      const filename = 'minglog-backup.json' // Placeholder

      const result = await withErrorHandling(
        () => importData(filename),
        'Failed to import data'
      )

      if (result) {
        success('Data Imported', result)
      }
    } catch (err) {
      error('Import Failed', 'Unable to import data')
    }
  }

  const handleResetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      const result = await resetToDefaults()
      if (result) {
        success('Settings Reset', 'All settings have been reset to defaults')
      } else {
        error('Reset Failed', 'Unable to reset settings')
      }
    }
  }

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'sync', name: 'Sync & Cloud', icon: Sync },
    { id: 'data', name: 'Data & Storage', icon: Database },
    { id: 'performance', name: 'Performance', icon: Activity },
    { id: 'privacy', name: 'Privacy & Security', icon: Shield },
    { id: 'about', name: 'About', icon: Info },
  ]

  return (
    <div className="h-full flex">
      {/* Settings Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 border-primary-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-transparent'
                  } w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors`}
                >
                  <Icon className="mr-3 w-5 h-5 flex-shrink-0" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">General Settings</h3>
              </div>

              <div className="card">
                <div className="card-header">
                  <h4 className="text-lg font-medium text-gray-900">Application</h4>
                </div>
                <div className="card-body space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSetting('language', e.target.value as any)}
                      className="input w-full max-w-xs"
                      disabled={loading}
                    >
                      <option value="en">English</option>
                      <option value="zh">中文</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.startWithSystem}
                        onChange={(e) => updateSetting('startWithSystem', e.target.checked)}
                        disabled={loading}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Start with system</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.minimizeToTray}
                        onChange={(e) => updateSetting('minimizeToTray', e.target.checked)}
                        disabled={loading}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Minimize to system tray</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.autoSave}
                        onChange={(e) => updateSetting('autoSave', e.target.checked)}
                        disabled={loading}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Auto-save notes</span>
                    </label>
                  </div>

                  {settings.autoSave && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auto-save interval (seconds)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="300"
                        value={settings.autoSaveInterval}
                        onChange={(e) => updateSetting('autoSaveInterval', parseInt(e.target.value))}
                        disabled={loading}
                        className="input w-24"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Appearance</h3>
              </div>

              <div className="card">
                <div className="card-header">
                  <h4 className="text-lg font-medium text-gray-900">Theme</h4>
                </div>
                <div className="card-body space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Theme
                    </label>
                    <ThemeToggle className="justify-start" />
                    <p className="text-xs text-gray-500 mt-2">
                      Current theme: {theme} mode
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Size
                    </label>
                    <select
                      value={settings.fontSize}
                      onChange={(e) => updateSetting('fontSize', e.target.value as any)}
                      disabled={loading}
                      className="input w-full max-w-xs"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.showLineNumbers}
                        onChange={(e) => updateSetting('showLineNumbers', e.target.checked)}
                        disabled={loading}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show line numbers in editor</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.wordWrap}
                        onChange={(e) => updateSetting('wordWrap', e.target.checked)}
                        disabled={loading}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Word wrap</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.spellCheck}
                        onChange={(e) => updateSetting('spellCheck', e.target.checked)}
                        disabled={loading}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Spell check</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Data & Storage</h3>
              </div>

              <div className="card">
                <div className="card-header">
                  <h4 className="text-lg font-medium text-gray-900">Backup & Export</h4>
                </div>
                <div className="card-body space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">Export Data</h5>
                      <p className="text-sm text-gray-600">Download all your notes and data</p>
                    </div>
                    <button
                      onClick={handleExportData}
                      disabled={loading}
                      className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">Import Data</h5>
                      <p className="text-sm text-gray-600">Import notes from other applications</p>
                    </div>
                    <button
                      onClick={handleImportData}
                      disabled={loading}
                      className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Import</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h4 className="text-lg font-medium text-gray-900">Storage</h4>
                </div>
                <div className="card-body space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Used Storage</span>
                      <span>0 MB of unlimited</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <h5 className="font-medium text-gray-900">Clear Cache</h5>
                      <p className="text-sm text-gray-600">Free up space by clearing temporary files</p>
                    </div>
                    <button className="btn-secondary">
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Privacy & Security</h3>
              </div>

              <div className="card">
                <div className="card-header">
                  <h4 className="text-lg font-medium text-gray-900">Data Privacy</h4>
                </div>
                <div className="card-body space-y-4">
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Keep data local only</span>
                    </label>
                    <p className="ml-6 text-xs text-gray-500">All your data stays on your device</p>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="ml-2 text-sm text-gray-700">Anonymous usage analytics</span>
                    </label>
                    <p className="ml-6 text-xs text-gray-500">Help improve the app with anonymous usage data</p>
                  </div>
                </div>
              </div>

              <div className="card border-error-200">
                <div className="card-header">
                  <h4 className="text-lg font-medium text-error-900">Danger Zone</h4>
                </div>
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-error-900">Delete All Data</h5>
                      <p className="text-sm text-error-600">Permanently delete all your notes and data</p>
                    </div>
                    <button className="btn-danger flex items-center space-x-2">
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">About MingLog Desktop</h3>
              </div>

              <div className="card">
                <div className="card-body text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">MingLog Desktop</h4>
                  <p className="text-gray-600 mb-4">Version 1.0.0</p>
                  <p className="text-sm text-gray-500 mb-6">
                    A modern knowledge management tool built with Tauri and React
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <a href="https://github.com/MMR-MINGriyue/MingLog" className="text-primary-600 hover:text-primary-700 block">
                      GitHub Repository
                    </a>
                    <a href="https://github.com/MMR-MINGriyue/MingLog/issues" className="text-primary-600 hover:text-primary-700 block">
                      Report Issues
                    </a>
                    <a href="https://github.com/MMR-MINGriyue/MingLog/blob/main/LICENSE" className="text-primary-600 hover:text-primary-700 block">
                      License (MIT)
                    </a>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h4 className="text-lg font-medium text-gray-900">System Information</h4>
                </div>
                <div className="card-body">
                  <dl className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <dt className="font-medium text-gray-900">Platform</dt>
                      <dd className="text-gray-600">Desktop (Tauri)</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900">Framework</dt>
                      <dd className="text-gray-600">React + TypeScript</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900">Backend</dt>
                      <dd className="text-gray-600">Rust + SQLite</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}
          )}

          {/* Sync & Cloud Settings */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Sync & Cloud Settings</h3>
                <p className="text-gray-600">Configure data synchronization across devices.</p>
              </div>

              <div className="card">
                <div className="card-header">
                  <h4 className="text-lg font-medium text-gray-900">Sync Status</h4>
                </div>
                <div className="card-body">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">🚀 Coming Soon!</h5>
                    <p className="text-blue-700 text-sm">
                      Cloud synchronization is currently in development. Features will include:
                    </p>
                    <ul className="text-blue-700 text-sm mt-2 space-y-1">
                      <li>• Sync across multiple devices</li>
                      <li>• GitHub repository backup</li>
                      <li>• Dropbox integration</li>
                      <li>• Conflict resolution</li>
                      <li>• Offline-first design</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Settings */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Settings</h3>
                <p className="text-gray-600">Monitor and optimize application performance.</p>
              </div>

              <div className="card">
                <div className="card-header">
                  <h4 className="text-lg font-medium text-gray-900">Performance Monitor</h4>
                </div>
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">Real-time Performance Monitoring</h5>
                      <p className="text-sm text-gray-600">Monitor memory usage, render time, and database performance</p>
                    </div>
                    <button
                      onClick={() => setShowPerformanceMonitor(true)}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Activity className="w-4 h-4" />
                      <span>Open Monitor</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h4 className="text-lg font-medium text-gray-900">Performance Tips</h4>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Memory Optimization</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Close unused notes and tabs</li>
                        <li>• Archive old notes regularly</li>
                        <li>• Limit search results</li>
                        <li>• Restart app if memory usage is high</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Speed Optimization</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Use keyboard shortcuts</li>
                        <li>• Enable auto-save to reduce manual saves</li>
                        <li>• Keep database optimized</li>
                        <li>• Close performance monitor when not needed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Help & Support */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Help & Support</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowOnboarding(true)}
                className="btn-ghost justify-start text-sm"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Show Tutorial
              </button>
              <button className="btn-ghost justify-start text-sm">
                <Info className="w-4 h-4 mr-2" />
                User Guide
              </button>
              <button className="btn-ghost justify-start text-sm">
                <Settings className="w-4 h-4 mr-2" />
                Reset All Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Monitor Modal */}
      <PerformanceMonitor
        isOpen={showPerformanceMonitor}
        onClose={() => setShowPerformanceMonitor(false)}
      />

      {/* Onboarding Tour Modal */}
      <OnboardingTour
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => setShowOnboarding(false)}
      />
    </div>
  )
}

export default SettingsPage
