import React from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Minus, Square, X } from 'lucide-react';

export const TitleBar: React.FC = () => {
  const handleMinimize = async () => {
    try {
      await invoke('minimize_window');
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      await invoke('maximize_window');
    } catch (error) {
      console.error('Failed to maximize window:', error);
    }
  };

  const handleClose = async () => {
    try {
      await invoke('close_window');
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  return (
    <div 
      className="h-8 bg-gray-800 text-white flex items-center justify-between px-4 select-none"
      data-tauri-drag-region
    >
      {/* App title */}
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
          <span className="text-xs font-bold text-white">M</span>
        </div>
        <span className="text-sm font-medium">MingLog</span>
      </div>

      {/* Window controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={handleMinimize}
          className="w-8 h-6 flex items-center justify-center hover:bg-gray-700 rounded transition-colors"
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-6 flex items-center justify-center hover:bg-gray-700 rounded transition-colors"
          title="Maximize"
        >
          <Square size={12} />
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-6 flex items-center justify-center hover:bg-red-600 rounded transition-colors"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
