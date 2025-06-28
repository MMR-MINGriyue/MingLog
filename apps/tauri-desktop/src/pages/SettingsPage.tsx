import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface PlatformInfo {
  os: string;
  arch: string;
  version: string;
}

export const SettingsPage: React.FC = () => {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [appVersion, setAppVersion] = useState<string>('');

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const [platform, version] = await Promise.all([
          invoke('get_platform_info') as Promise<PlatformInfo>,
          invoke('get_app_version') as Promise<string>,
        ]);
        
        setPlatformInfo(platform);
        setAppVersion(version);
      } catch (error) {
        console.error('Failed to load system info:', error);
      }
    };

    loadInfo();
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure your MingLog experience
        </p>
      </div>
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">General</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">Follow System</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-save interval
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="1">1 second</option>
                  <option value="5">5 seconds</option>
                  <option value="10">10 seconds</option>
                  <option value="30">30 seconds</option>
                </select>
              </div>
            </div>
          </div>

          {/* Editor Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Editor</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Show line numbers
                  </label>
                  <p className="text-xs text-gray-500">
                    Display line numbers in the editor
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Word wrap
                  </label>
                  <p className="text-xs text-gray-500">
                    Wrap long lines in the editor
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">App Version:</span>
                <span className="font-mono">{appVersion}</span>
              </div>
              
              {platformInfo && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Operating System:</span>
                    <span className="font-mono">{platformInfo.os}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Architecture:</span>
                    <span className="font-mono">{platformInfo.arch}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
