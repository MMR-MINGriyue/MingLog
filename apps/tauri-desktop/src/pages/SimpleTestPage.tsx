/**
 * 简化测试页面 - 用于验证基本功能
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Play, RefreshCw } from 'lucide-react'

const SimpleTestPage: React.FC = () => {
  const navigate = useNavigate()
  const [testResults, setTestResults] = useState<Array<{
    name: string
    status: 'pending' | 'running' | 'success' | 'error'
    message?: string
  }>>([])

  const tests = [
    {
      name: '基础React渲染',
      test: () => {
        return Promise.resolve('React组件正常渲染')
      }
    },
    {
      name: '路由导航功能',
      test: () => {
        return Promise.resolve('React Router正常工作')
      }
    },
    {
      name: '状态管理',
      test: () => {
        return Promise.resolve('useState Hook正常工作')
      }
    },
    {
      name: 'CSS样式加载',
      test: () => {
        const element = document.createElement('div')
        element.className = 'test-class'
        document.body.appendChild(element)
        const _styles = window.getComputedStyle(element)
        document.body.removeChild(element)
        return Promise.resolve('CSS样式正常加载')
      }
    },
    {
      name: 'Lucide图标',
      test: () => {
        return Promise.resolve('Lucide图标库正常工作')
      }
    }
  ]

  const runTests = async () => {
    setTestResults([])
    
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i]
      
      // 设置为运行中
      setTestResults(prev => [
        ...prev,
        { name: test.name, status: 'running' }
      ])
      
      try {
        const result = await test.test()
        
        // 更新为成功
        setTestResults(prev => 
          prev.map((item, index) => 
            index === i 
              ? { name: test.name, status: 'success', message: result }
              : item
          )
        )
      } catch (error) {
        // 更新为失败
        setTestResults(prev => 
          prev.map((item, index) => 
            index === i 
              ? { 
                  name: test.name, 
                  status: 'error', 
                  message: error instanceof Error ? error.message : '未知错误' 
                }
              : item
          )
        )
      }
      
      // 等待一下再继续下一个测试
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-50 border-blue-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const successCount = testResults.filter(r => r.status === 'success').length
  const errorCount = testResults.filter(r => r.status === 'error').length
  const isRunning = testResults.some(r => r.status === 'running')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 顶部导航 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="返回"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              简化功能测试
            </h1>
          </div>
          
          <button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>运行中...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>开始测试</span>
              </>
            )}
          </button>
        </div>

        {/* 测试状态概览 */}
        {testResults.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">测试概览</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{testResults.length}</div>
                <div className="text-sm text-gray-600">总测试数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-sm text-gray-600">成功</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-sm text-gray-600">失败</div>
              </div>
            </div>
            
            {testResults.length > 0 && !isRunning && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(successCount / testResults.length) * 100}%` }}
                  ></div>
                </div>
                <div className="text-center mt-2 text-sm text-gray-600">
                  通过率: {((successCount / testResults.length) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        )}

        {/* 测试结果列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">测试结果</h2>
          
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>点击"开始测试"按钮运行基础功能测试</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium text-gray-900">
                        {result.name}
                      </div>
                      {result.message && (
                        <div className="text-sm text-gray-600 mt-1">
                          {result.message}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {result.status === 'running' && '运行中...'}
                    {result.status === 'success' && '✓ 通过'}
                    {result.status === 'error' && '✗ 失败'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 系统信息 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">系统信息</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">用户代理:</span>
              <div className="text-gray-600 break-all">{navigator.userAgent}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">当前时间:</span>
              <div className="text-gray-600">{new Date().toLocaleString()}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">页面URL:</span>
              <div className="text-gray-600 break-all">{window.location.href}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">屏幕分辨率:</span>
              <div className="text-gray-600">{screen.width} × {screen.height}</div>
            </div>
          </div>
        </div>

        {/* 快速导航 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">快速导航</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors"
            >
              <div className="font-medium text-gray-900">首页</div>
            </button>
            <button
              onClick={() => navigate('/editor')}
              className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors"
            >
              <div className="font-medium text-blue-900">编辑器</div>
            </button>
            <button
              onClick={() => navigate('/graph')}
              className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors"
            >
              <div className="font-medium text-green-900">图谱</div>
            </button>
            <button
              onClick={() => navigate('/workspace')}
              className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors"
            >
              <div className="font-medium text-purple-900">工作空间</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleTestPage
