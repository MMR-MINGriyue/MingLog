import React, { useState, useEffect } from 'react'
import { Task, TaskStatus, GTDReviewResult } from '../types'

interface GTDReviewProps {
  onReviewComplete?: (result: GTDReviewResult) => void
}

/**
 * GTD回顾组件
 * 实现GTD工作流的回顾阶段
 */
export const GTDReview: React.FC<GTDReviewProps> = ({
  onReviewComplete
}) => {
  const [reviewData, setReviewData] = useState<GTDReviewResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [reviewType, setReviewType] = useState<'daily' | 'weekly'>('weekly')
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([])

  // 加载回顾数据
  useEffect(() => {
    loadReviewData()
  }, [reviewType])

  const loadReviewData = async () => {
    setIsLoading(true)
    
    // 模拟数据加载
    setTimeout(() => {
      const mockReviewData: GTDReviewResult = {
        inboxCount: 3,
        overdueCount: 2,
        todayCount: 5,
        weekCount: 12,
        somedayCount: 8,
        recommendations: [
          '收集箱有 3 个未处理项目，建议及时处理',
          '有 2 个过期任务需要关注',
          '本周任务较多，建议合理安排优先级'
        ]
      }

      const mockCompletedTasks: Task[] = [
        {
          id: 'completed-1',
          title: '完成项目文档',
          status: TaskStatus.DONE,
          priority: 'high' as any,
          completedAt: new Date(),
          actualTime: 180,
          linkedNotes: [],
          linkedFiles: [],
          tags: ['文档', '项目'],
          contexts: ['@电脑'],
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date()
        },
        {
          id: 'completed-2',
          title: '团队会议',
          status: TaskStatus.DONE,
          priority: 'medium' as any,
          completedAt: new Date(),
          actualTime: 60,
          linkedNotes: [],
          linkedFiles: [],
          tags: ['会议'],
          contexts: ['@会议室'],
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date()
        }
      ]

      const mockUpcomingTasks: Task[] = [
        {
          id: 'upcoming-1',
          title: '准备演示文稿',
          status: TaskStatus.TODO,
          priority: 'high' as any,
          dueDate: new Date(Date.now() + 86400000),
          estimatedTime: 120,
          linkedNotes: [],
          linkedFiles: [],
          tags: ['演示', '准备'],
          contexts: ['@电脑'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'upcoming-2',
          title: '客户电话',
          status: TaskStatus.TODO,
          priority: 'medium' as any,
          dueDate: new Date(Date.now() + 172800000),
          estimatedTime: 30,
          linkedNotes: [],
          linkedFiles: [],
          tags: ['客户', '沟通'],
          contexts: ['@电话'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      setReviewData(mockReviewData)
      setCompletedTasks(mockCompletedTasks)
      setUpcomingTasks(mockUpcomingTasks)
      setIsLoading(false)
    }, 1000)
  }

  // 获取状态颜色
  const getStatusColor = (count: number, type: 'info' | 'warning' | 'success' | 'danger') => {
    const colors = {
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      success: 'bg-green-100 text-green-800 border-green-200',
      danger: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[type]
  }

  // 完成回顾
  const handleCompleteReview = () => {
    if (reviewData && onReviewComplete) {
      onReviewComplete(reviewData)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">正在生成回顾报告...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 标题栏 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">GTD 回顾</h1>
        <p className="text-gray-600">回顾进展，调整方向，保持系统清晰</p>
        
        {/* 回顾类型切换 */}
        <div className="flex justify-center mt-4">
          <div className="bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setReviewType('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                reviewType === 'daily'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              日常回顾
            </button>
            <button
              onClick={() => setReviewType('weekly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                reviewType === 'weekly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              周回顾
            </button>
          </div>
        </div>
      </div>

      {reviewData && (
        <>
          {/* 系统状态概览 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">📊</span>
              系统状态概览
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className={`p-4 rounded-lg border ${getStatusColor(reviewData.inboxCount, reviewData.inboxCount > 5 ? 'warning' : 'info')}`}>
                <div className="text-2xl font-bold">{reviewData.inboxCount}</div>
                <div className="text-sm">收集箱</div>
              </div>
              
              <div className={`p-4 rounded-lg border ${getStatusColor(reviewData.overdueCount, reviewData.overdueCount > 0 ? 'danger' : 'success')}`}>
                <div className="text-2xl font-bold">{reviewData.overdueCount}</div>
                <div className="text-sm">过期任务</div>
              </div>
              
              <div className={`p-4 rounded-lg border ${getStatusColor(reviewData.todayCount, 'info')}`}>
                <div className="text-2xl font-bold">{reviewData.todayCount}</div>
                <div className="text-sm">今日任务</div>
              </div>
              
              <div className={`p-4 rounded-lg border ${getStatusColor(reviewData.weekCount, 'info')}`}>
                <div className="text-2xl font-bold">{reviewData.weekCount}</div>
                <div className="text-sm">本周任务</div>
              </div>
              
              <div className={`p-4 rounded-lg border ${getStatusColor(reviewData.somedayCount, reviewData.somedayCount > 20 ? 'warning' : 'info')}`}>
                <div className="text-2xl font-bold">{reviewData.somedayCount}</div>
                <div className="text-sm">将来/也许</div>
              </div>
            </div>
          </div>

          {/* 系统建议 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">💡</span>
              系统建议
            </h2>
            
            {reviewData.recommendations.length > 0 ? (
              <div className="space-y-3">
                {reviewData.recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <span className="text-amber-600 mt-0.5">⚠️</span>
                    <p className="text-amber-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-green-600">
                <span className="text-2xl">✅</span>
                <p className="mt-2">系统运行良好，无需特别关注的问题！</p>
              </div>
            )}
          </div>

          {/* 已完成任务回顾 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">✅</span>
              已完成任务
              <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {completedTasks.length} 项
              </span>
            </h2>
            
            {completedTasks.length > 0 ? (
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-green-900">{task.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-green-700">
                        <span>完成时间: {task.completedAt?.toLocaleString()}</span>
                        {task.actualTime && (
                          <span>用时: {task.actualTime} 分钟</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>本期间暂无完成的任务</p>
              </div>
            )}
          </div>

          {/* 即将到期任务 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">⏰</span>
              即将到期任务
              <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {upcomingTasks.length} 项
              </span>
            </h2>
            
            {upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-blue-900">{task.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-blue-700">
                        <span>截止: {task.dueDate?.toLocaleDateString()}</span>
                        {task.estimatedTime && (
                          <span>预估: {task.estimatedTime} 分钟</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.contexts.map((context) => (
                        <span
                          key={context}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {context}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <p>近期无即将到期的任务</p>
              </div>
            )}
          </div>

          {/* 回顾检查清单 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">📋</span>
              回顾检查清单
            </h2>
            
            <div className="space-y-3">
              {[
                '清空收集箱中的所有项目',
                '回顾并更新项目列表',
                '检查"等待"列表中的项目',
                '回顾"将来/也许"列表',
                '确认下周的优先任务',
                '更新上下文列表',
                '回顾已完成的成就'
              ].map((item, index) => (
                <label
                  key={index}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => loadReviewData()}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              刷新数据
            </button>
            <button
              onClick={handleCompleteReview}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              完成回顾
            </button>
          </div>
        </>
      )}
    </div>
  )
}
