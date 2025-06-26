import React from 'react';

export const SimpleHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">MingLog</h1>
            </div>
            <div className="text-sm text-gray-500">
              简化版首页
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎉 MingLog 正在运行！
              </h2>
              <p className="text-gray-600 mb-6">
                这是一个简化版的首页，用于测试基本功能。
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">✅ 前端</h3>
                  <p className="text-sm text-gray-600">React + Vite 正常运行</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">🎨 样式</h3>
                  <p className="text-sm text-gray-600">Tailwind CSS 加载成功</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">🚀 路由</h3>
                  <p className="text-sm text-gray-600">React Router 工作正常</p>
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <div className="text-sm text-gray-600">测试页面链接：</div>
                <div className="space-x-4">
                  <a 
                    href="/simple" 
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    简单测试
                  </a>
                  <a 
                    href="/test" 
                    className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    完整测试
                  </a>
                  <a 
                    href="/pages" 
                    className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    页面管理
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
