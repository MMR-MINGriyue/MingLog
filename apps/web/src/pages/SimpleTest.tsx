import React, { useState } from 'react';

export const SimpleTest: React.FC = () => {
  const [message, setMessage] = useState('MingLog 测试页面加载成功！');

  const testBasicFunction = () => {
    setMessage('✅ 基本功能正常工作！时间：' + new Date().toLocaleTimeString());
  };

  const testApiConnection = async () => {
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      setMessage(`✅ API 连接成功！状态：${data.status}`);
    } catch (error) {
      setMessage(`❌ API 连接失败：${error}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🧪 简单测试页面</h1>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2">系统状态</h2>
          <div className="text-sm space-y-1">
            <div>✅ React 组件正常渲染</div>
            <div>✅ TypeScript 编译成功</div>
            <div>✅ 样式加载正常</div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <button
            onClick={testBasicFunction}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            测试基本功能
          </button>
          
          <button
            onClick={testApiConnection}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            测试 API 连接
          </button>
        </div>

        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
          <div className="text-gray-400 mb-2">测试结果：</div>
          <div>{message}</div>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">导航测试：</h3>
          <div className="space-y-1">
            <div>• <a href="/" className="text-blue-600 hover:underline">返回首页</a></div>
            <div>• <a href="/pages" className="text-blue-600 hover:underline">所有页面</a></div>
            <div>• <a href="/test" className="text-blue-600 hover:underline">完整测试页面</a></div>
          </div>
        </div>
      </div>
    </div>
  );
};
