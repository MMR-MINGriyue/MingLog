import React from 'react'

// 最小化的App组件，用于测试基本功能
function App() {
  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎉 MingLog Desktop
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          应用已成功启动！这是一个最小化测试版本。
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ✅ 前端框架
            </h3>
            <p className="text-gray-600">React + TypeScript 正常运行</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ✅ 样式系统
            </h3>
            <p className="text-gray-600">Tailwind CSS 正确加载</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ✅ 桌面应用
            </h3>
            <p className="text-gray-600">Tauri 桌面窗口正常显示</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ⏳ 完整功能
            </h3>
            <p className="text-gray-600">准备加载完整功能...</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            🔄 重新加载应用
          </button>
          
          <div className="text-sm text-gray-500">
            <p>构建时间: {new Date().toLocaleString()}</p>
            <p>版本: 测试版本 v0.1.0</p>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-green-50 rounded-lg">
          <h4 className="text-green-800 font-semibold mb-2">🎯 测试成功！</h4>
          <p className="text-green-700 text-sm">
            如果您看到这个页面，说明MingLog桌面应用的基础架构工作正常。
            现在可以逐步启用完整功能。
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
