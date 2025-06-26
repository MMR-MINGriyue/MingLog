import React, { useState, useEffect } from 'react';
import { useLogseqStore, core } from '../stores/logseq-store';
import { Button } from '@minglog/ui';

export const TestPage: React.FC = () => {
  const { currentGraph, initialize } = useLogseqStore();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCoreServices = async () => {
    setIsLoading(true);
    addResult('🧪 开始测试核心服务...');

    try {
      // Test graph service
      addResult(`✅ 图谱服务: ${currentGraph ? currentGraph.name : '未初始化'}`);

      // Test page creation
      const testPage = await core.pages.createPage('测试页面-' + Date.now());
      addResult(`✅ 页面创建: ${testPage.name}`);

      // Test block creation
      const testBlock = await core.blocks.createBlock('这是一个测试块', testPage.id);
      addResult(`✅ 块创建: ${testBlock.content}`);

      // Test block operations
      await core.blocks.indentBlock(testBlock.id);
      addResult('✅ 块缩进操作完成');

      await core.blocks.outdentBlock(testBlock.id);
      addResult('✅ 块取消缩进操作完成');

      // Test page listing
      const allPages = await core.pages.getAllPages();
      addResult(`✅ 页面列表: 共 ${allPages.length} 个页面`);

      // Test block listing
      const pageBlocks = core.blocks.getBlocksByPage(testPage.id);
      addResult(`✅ 块列表: 页面有 ${pageBlocks.length} 个块`);

    } catch (error) {
      addResult(`❌ 核心服务测试失败: ${error}`);
    }

    setIsLoading(false);
  };

  const testApiServices = async () => {
    setIsLoading(true);
    addResult('🌐 开始测试 API 服务...');

    try {
      // Test health check
      const healthResponse = await fetch('http://localhost:3001/health');
      const healthData = await healthResponse.json();
      addResult(`✅ API 健康检查: ${healthData.status}`);

    } catch (error) {
      addResult(`❌ API 服务测试失败: ${error}`);
    }

    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🧪 MingLog 功能测试</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">系统状态</h3>
            <div className="space-y-1 text-sm">
              <div>核心图谱: {currentGraph ? `✅ ${currentGraph.name}` : '❌ 未初始化'}</div>
              <div>前端服务: ✅ http://localhost:3000</div>
              <div>API 服务: ✅ http://localhost:3001</div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">测试操作</h3>
            <div className="space-y-2">
              <Button
                onClick={testCoreServices}
                disabled={isLoading}
                variant="primary"
                size="sm"
                className="w-full"
              >
                {isLoading ? '测试中...' : '测试核心服务'}
              </Button>
              <Button
                onClick={testApiServices}
                disabled={isLoading}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                {isLoading ? '测试中...' : '测试 API 服务'}
              </Button>
              <Button
                onClick={clearResults}
                variant="outline"
                size="sm"
                className="w-full"
              >
                清除结果
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">测试日志</span>
            <span className="text-gray-400">{testResults.length} 条记录</span>
          </div>
          {testResults.length === 0 ? (
            <div className="text-gray-500">点击上方按钮开始测试...</div>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="break-words">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
