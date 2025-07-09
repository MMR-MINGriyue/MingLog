/**
 * 集成测试页面 - 用于测试和验证集成功能
 */

import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft,
  RefreshCw,
  Bug,
  TestTube,
  Zap
} from 'lucide-react'
import { integrationTester } from '../test/integration-test'
import { useDataSync } from '../hooks/useDataSync'
import { integrationDemo } from '../demo/IntegrationDemo'

interface TestResult {
  name: string
  passed: boolean
  message: string
  duration: number
}

const IntegrationTestPage: React.FC = () => {
  const navigate = useNavigate()
  const { state, refresh, clearErrors } = useDataSync()
  
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null)
  const [isDemoRunning, setIsDemoRunning] = useState(false)

  // 运行集成测试
  const runTests = useCallback(async () => {
    setIsRunning(true)
    setTestResults([])

    try {
      const results = await integrationTester.runAllTests()
      setTestResults(results)
      setLastRunTime(new Date())
    } catch (error) {
      console.error('测试运行失败:', error)
    } finally {
      setIsRunning(false)
    }
  }, [])

  // 运行功能演示
  const runDemo = useCallback(async () => {
    setIsDemoRunning(true)

    try {
      await integrationDemo.runDemo()
    } catch (error) {
      console.error('演示运行失败:', error)
    } finally {
      setIsDemoRunning(false)
    }
  }, [])

  // 计算测试统计
  const stats = {
    total: testResults.length,
    passed: testResults.filter(r => r.passed).length,
    failed: testResults.filter(r => !r.passed).length,
    passRate: testResults.length > 0 ? ((testResults.filter(r => r.passed).length / testResults.length) * 100).toFixed(1) : '0'
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost p-2"
            title="返回"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <TestTube className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              集成功能测试
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={clearErrors}
            className="btn-ghost p-2"
            title="清理错误"
          >
            <Bug className="w-5 h-5" />
          </button>
          
          <button
            onClick={refresh}
            className="btn-ghost p-2"
            title="刷新数据"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={runDemo}
            disabled={isDemoRunning || isRunning}
            className="btn-secondary flex items-center space-x-2 mr-2"
          >
            {isDemoRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>演示中...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>功能演示</span>
              </>
            )}
          </button>

          <button
            onClick={runTests}
            disabled={isRunning || isDemoRunning}
            className="btn-primary flex items-center space-x-2"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>运行中...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>运行测试</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 系统状态概览 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">系统状态</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {state.graphData?.nodes.length || 0}
                </div>
                <div className="text-sm text-gray-600">图谱节点</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {state.graphData?.links.length || 0}
                </div>
                <div className="text-sm text-gray-600">图谱连接</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {state.searchIndex?.pages.length || 0}
                </div>
                <div className="text-sm text-gray-600">索引页面</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {state.errors.length}
                </div>
                <div className="text-sm text-gray-600">错误数量</div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${state.isLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {state.isLoading ? '同步中' : '就绪'}
                </span>
              </div>
              
              {state.lastSync && (
                <div className="text-sm text-gray-500">
                  最后同步: {state.lastSync.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {/* 演示状态 */}
          {isDemoRunning && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                <h3 className="font-medium text-blue-900">功能演示进行中</h3>
              </div>
              <p className="text-blue-700 text-sm">
                正在自动演示各个集成功能，请查看浏览器控制台获取详细信息...
              </p>
              <div className="mt-2 text-xs text-blue-600">
                💡 按 F12 打开开发者工具 → Console 标签查看演示过程
              </div>
            </div>
          )}

          {/* 测试结果统计 */}
          {testResults.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">测试结果</h2>
                {lastRunTime && (
                  <div className="text-sm text-gray-500">
                    运行时间: {lastRunTime.toLocaleString()}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">总测试数</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
                  <div className="text-sm text-gray-600">通过</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <div className="text-sm text-gray-600">失败</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.passRate}%</div>
                  <div className="text-sm text-gray-600">通过率</div>
                </div>
              </div>
              
              {/* 进度条 */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.passRate}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 详细测试结果 */}
          {testResults.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">详细结果</h2>
              
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.passed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {result.passed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      
                      <div>
                        <div className="font-medium text-gray-900">
                          {result.name}
                        </div>
                        <div className={`text-sm ${
                          result.passed ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.message}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{result.duration}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 快速操作 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => navigate('/workspace')}
                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors"
              >
                <Zap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="font-medium text-blue-900">打开集成工作空间</div>
                <div className="text-sm text-blue-600">测试实际功能</div>
              </button>

              <button
                onClick={() => navigate('/graph')}
                className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors"
              >
                <div className="font-medium text-green-900">图谱页面</div>
                <div className="text-sm text-green-600">测试图谱功能</div>
              </button>

              <button
                onClick={() => navigate('/editor')}
                className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors"
              >
                <div className="font-medium text-purple-900">编辑器页面</div>
                <div className="text-sm text-purple-600">测试编辑功能</div>
              </button>
            </div>

            {/* 快速测试按钮 */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">快速测试</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    console.log('🧪 运行基础功能测试')
                    // 这里可以运行特定的测试
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                >
                  基础功能
                </button>
                <button
                  onClick={() => {
                    console.log('📊 运行图谱测试')
                    // 这里可以运行图谱相关测试
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                >
                  图谱功能
                </button>
                <button
                  onClick={() => {
                    console.log('✏️ 运行编辑器测试')
                    // 这里可以运行编辑器相关测试
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                >
                  编辑器功能
                </button>
                <button
                  onClick={() => {
                    console.log('⚡ 运行性能测试')
                    // 这里可以运行性能测试
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                >
                  性能测试
                </button>
              </div>
            </div>
          </div>

          {/* 系统错误 */}
          {state.errors.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
              <h2 className="text-lg font-semibold text-red-900 mb-4">系统错误</h2>
              
              <div className="space-y-2">
                {state.errors.map((error, index) => (
                  <div key={index} className="p-3 bg-red-50 rounded border border-red-200">
                    <div className="font-medium text-red-900">{error.name}</div>
                    <div className="text-sm text-red-600">{error.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default IntegrationTestPage
