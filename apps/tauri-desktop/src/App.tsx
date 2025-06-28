import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { EditorPage } from './pages/EditorPage';
import { GraphPage } from './pages/GraphPage';
import { SettingsPage } from './pages/SettingsPage';
import { TitleBar } from './components/TitleBar';

interface PlatformInfo {
  os: string;
  arch: string;
  version: string;
}

function App() {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database
        await invoke('init_database');
        
        // Get platform info
        const info = await invoke('get_platform_info') as PlatformInfo;
        setPlatformInfo(info);
        
        console.log('MingLog Tauri app initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing MingLog...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Custom title bar for desktop */}
        <TitleBar />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/editor" element={<EditorPage />} />
              <Route path="/editor/:pageId" element={<EditorPage />} />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
        
        {/* Status bar */}
        <div className="h-6 bg-gray-200 border-t border-gray-300 flex items-center justify-between px-4 text-xs text-gray-600">
          <span>Ready</span>
          {platformInfo && (
            <span>{platformInfo.os} {platformInfo.arch}</span>
          )}
        </div>
      </div>
    </Router>
  );
}

export default App;
