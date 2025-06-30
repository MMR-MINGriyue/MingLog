import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Edit3,
  Network,
  Search,
  Plus,
  BookOpen,
  TrendingUp,
  Clock,
  Star,
  Settings
} from 'lucide-react'
import { getNotes, getTags, getAppInfo, withErrorHandling, Note, Tag, AppInfo } from '../utils/tauri'

const HomePage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalNotes: 0,
    thisWeek: 0,
    recent: 0,
    favorites: 0
  })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)

      // Load app info
      const info = await withErrorHandling(() => getAppInfo(), 'Failed to load app info')
      if (info) setAppInfo(info)

      // Load notes
      const notesData = await withErrorHandling(() => getNotes(10, 0), 'Failed to load notes')
      if (notesData) {
        setNotes(notesData)

        // Calculate stats
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        setStats({
          totalNotes: notesData.length,
          thisWeek: notesData.filter(note => new Date(note.created_at) > weekAgo).length,
          recent: notesData.slice(0, 5).length,
          favorites: notesData.filter(note => note.is_favorite).length
        })
      }

      // Load tags
      const tagsData = await withErrorHandling(() => getTags(), 'Failed to load tags')
      if (tagsData) setTags(tagsData)

      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-8">
        {/* Hero Section - Modern Welcome */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
            欢迎使用 明志桌面版
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            融合思维导图层次结构与块编辑器的现代化知识管理工具
          </p>
          {appInfo && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
              <span className="text-sm text-gray-500">版本 {appInfo.version}</span>
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-sm text-gray-500">{appInfo.description}</span>
            </div>
          )}
        </div>

        {/* 核心功能区 - 三大特色功能 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">三大核心功能</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 智能编辑器 */}
            <Link
              to="/editor"
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:-translate-y-1"
            >
              <div className="absolute top-6 right-6 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Edit3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                📝 智能编辑器
              </h3>
              <p className="text-gray-600 text-center mb-4 leading-relaxed">
                双模式编辑：简单文本 + 富文本模式<br/>
                支持 Markdown 语法和实时预览
              </p>
              <div className="flex items-center justify-center text-blue-600 font-medium group-hover:text-blue-700">
                开始创作 <Plus className="w-4 h-4 ml-2" />
              </div>
            </Link>

            {/* 强大搜索 */}
            <Link
              to="/search"
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 hover:-translate-y-1"
            >
              <div className="absolute top-6 right-6 text-xs bg-gray-100 px-2 py-1 rounded-md font-mono text-gray-600">
                Ctrl+K
              </div>
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                🔍 强大搜索
              </h3>
              <p className="text-gray-600 text-center mb-4 leading-relaxed">
                全文搜索，智能匹配<br/>
                支持模糊搜索和关键词高亮
              </p>
              <div className="flex items-center justify-center text-green-600 font-medium group-hover:text-green-700">
                快速查找 <Search className="w-4 h-4 ml-2" />
              </div>
            </Link>

            {/* 知识图谱 */}
            <Link
              to="/graph"
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200 hover:-translate-y-1"
            >
              <div className="absolute top-6 right-6 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Network className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                🕸️ 知识图谱
              </h3>
              <p className="text-gray-600 text-center mb-4 leading-relaxed">
                可视化关联，基于标签的笔记关联<br/>
                交互式探索，智能布局算法
              </p>
              <div className="flex items-center justify-center text-purple-600 font-medium group-hover:text-purple-700">
                探索关联 <Network className="w-4 h-4 ml-2" />
              </div>
            </Link>
          </div>
        </div>

        {/* 数据概览 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">工作空间概览</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stats.totalNotes}</p>
                  <p className="text-sm text-gray-500">总笔记数</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
                  <p className="text-sm text-gray-500">本周新增</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stats.recent}</p>
                  <p className="text-sm text-gray-500">最近编辑</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stats.favorites}</p>
                  <p className="text-sm text-gray-500">收藏笔记</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* 最近笔记 */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">最近笔记</h2>
            <Link
              to="/search"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              查看全部 <span className="ml-1">→</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {notes.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  还没有笔记
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  开始创建您的第一篇笔记，记录想法和灵感
                </p>
                <Link
                  to="/editor"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  创建第一篇笔记
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notes.slice(0, 5).map((note, index) => (
                  <div key={note.id} className="p-6 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <h4 className="text-lg font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {note.title || '无标题笔记'}
                          </h4>
                          {note.is_favorite && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 ml-5">
                          最后编辑：{new Date(note.updated_at).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                          #{index + 1}
                        </span>
                        <Link
                          to={`/editor/${note.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium opacity-0 group-hover:opacity-100"
                        >
                          编辑
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {notes.length > 5 && (
                  <div className="p-6 bg-gray-50 text-center">
                    <Link
                      to="/search"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      查看全部 {notes.length} 篇笔记 →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 快速入门指南 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">快速入门指南</h2>
            <p className="text-gray-600">掌握明志桌面版的核心功能，提升知识管理效率</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  📝 编写笔记
                </h3>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                使用强大的编辑器创建和格式化笔记，支持富文本、代码块、Markdown语法等多种格式。
              </p>
              <Link
                to="/editor"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                开始写作 <span className="ml-1">→</span>
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Search className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  🔍 查找信息
                </h3>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                使用智能搜索功能快速找到任何笔记或信息片段，支持全文搜索和模糊匹配。
              </p>
              <div className="flex items-center justify-between">
                <Link
                  to="/search"
                  className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                >
                  尝试搜索 <span className="ml-1">→</span>
                </Link>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                  Ctrl+K
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Network className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  🕸️ 知识图谱
                </h3>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                可视化笔记之间的连接关系，发现知识中的新联系和模式，构建个人知识网络。
              </p>
              <Link
                to="/graph"
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
              >
                探索图谱 <span className="ml-1">→</span>
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Settings className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ⚙️ 个性化设置
                </h3>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                自定义工作空间，管理数据，配置设置以匹配您的工作流程和使用习惯。
              </p>
              <Link
                to="/settings"
                className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
              >
                打开设置 <span className="ml-1">→</span>
              </Link>
            </div>
          </div>

          {/* 底部提示 */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
              <span className="text-sm text-gray-600">💡 提示：按 </span>
              <kbd className="mx-1 px-2 py-1 bg-gray-100 rounded text-xs font-mono">F1</kbd>
              <span className="text-sm text-gray-600"> 查看所有快捷键</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
