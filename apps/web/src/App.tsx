import React from 'react';






import ErrorBoundary from './ErrorBoundary';
import TipTapTest from './TipTapTest';
import { GTDTest } from './GTDTest';

const App: React.FC = () => {
  const [currentTest, setCurrentTest] = React.useState<'tiptap' | 'gtd'>('gtd')

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">MingLog 知识管理 - 功能测试</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentTest('tiptap')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentTest === 'tiptap'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              TipTap编辑器
            </button>
            <button
              type="button"
              onClick={() => setCurrentTest('gtd')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentTest === 'gtd'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              GTD工作流
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        <ErrorBoundary fallback={<div className="error-fallback">应用加载失败，请刷新页面重试</div>}>
          {currentTest === 'tiptap' ? <TipTapTest /> : <GTDTest />}
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default App;