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
  Info
} from 'lucide-react'

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'data', name: 'Data & Storage', icon: Database },
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
                    <select className="input w-full max-w-xs">
                      <option>English</option>
                      <option>中文</option>
                      <option>日本語</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="ml-2 text-sm text-gray-700">Start with system</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="ml-2 text-sm text-gray-700">Minimize to system tray</span>
                    </label>
                  </div>
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
                    <div className="grid grid-cols-3 gap-3">
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="theme" value="light" className="text-primary-600 focus:ring-primary-500" />
                        <span className="ml-2 text-sm text-gray-700">Light</span>
                      </label>
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="theme" value="dark" className="text-primary-600 focus:ring-primary-500" />
                        <span className="ml-2 text-sm text-gray-700">Dark</span>
                      </label>
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="theme" value="auto" className="text-primary-600 focus:ring-primary-500" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700">Auto</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Size
                    </label>
                    <select className="input w-full max-w-xs">
                      <option>Small</option>
                      <option>Medium</option>
                      <option>Large</option>
                    </select>
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
                    <button className="btn-secondary flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">Import Data</h5>
                      <p className="text-sm text-gray-600">Import notes from other applications</p>
                    </div>
                    <button className="btn-secondary flex items-center space-x-2">
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
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
