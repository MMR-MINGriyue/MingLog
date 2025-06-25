import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useLogseqStore } from '../stores/logseq-store';

export const Layout: React.FC = () => {
  const sidebarOpen = useLogseqStore((state) => state.sidebarOpen);

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 overflow-hidden bg-white border-r border-gray-200`}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
