/**
 * 链接自动补全功能演示
 * 展示SmartTextInput和LinkAutoComplete组件的使用
 */

import React, { useState, useCallback } from 'react'
import { SmartTextInput } from '../components/molecules/SmartTextInput'
import { LinkAutoComplete, LinkSuggestion } from '../components/molecules/LinkAutoComplete'
import { BiDirectionalLink } from '../components/molecules/BiDirectionalLink'
import { LinkRenderer } from '../components/molecules/LinkRenderer'

// 模拟页面数据
const mockPages = [
  { id: '1', title: '技术文档', preview: '包含项目的技术规范和API文档', referenceCount: 15 },
  { id: '2', title: '技术规范', preview: '详细的技术实现规范', referenceCount: 8 },
  { id: '3', title: '项目文档', preview: '项目概述和开发指南', referenceCount: 12 },
  { id: '4', title: '用户手册', preview: '面向最终用户的使用指南', referenceCount: 5 },
  { id: '5', title: '开发指南', preview: '开发环境搭建和开发流程', referenceCount: 10 },
  { id: '6', title: '部署文档', preview: '生产环境部署和运维指南', referenceCount: 6 },
  { id: '7', title: '测试文档', preview: '测试策略和测试用例', referenceCount: 4 },
  { id: '8', title: '设计文档', preview: 'UI/UX设计规范和组件库', referenceCount: 7 }
]

export const LinkAutoCompleteDemo: React.FC = () => {
  const [inputValue, setInputValue] = useState('')
  const [directInputValue, setDirectInputValue] = useState('')
  const [showDirectAutoComplete, setShowDirectAutoComplete] = useState(false)
  const [directPosition, setDirectPosition] = useState({ x: 0, y: 0 })
  const [directSuggestions, setDirectSuggestions] = useState<LinkSuggestion[]>([])
  const [history, setHistory] = useState<LinkSuggestion[]>([
    { id: 'h1', title: '最近访问的页面1', type: 'page', score: 0, matchType: 'exact' },
    { id: 'h2', title: '最近访问的页面2', type: 'page', score: 0, matchType: 'exact' }
  ])

  // 模拟获取建议
  const handleGetSuggestions = useCallback(async (query: string): Promise<LinkSuggestion[]> => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200))

    if (!query.trim()) return []

    const filtered = mockPages
      .filter(page => 
        page.title.toLowerCase().includes(query.toLowerCase())
      )
      .map(page => ({
        id: page.id,
        title: page.title,
        type: 'page' as const,
        preview: page.preview,
        score: page.title.toLowerCase().startsWith(query.toLowerCase()) ? 100 : 50,
        matchType: page.title.toLowerCase().startsWith(query.toLowerCase()) 
          ? 'prefix' as const 
          : 'contains' as const,
        referenceCount: page.referenceCount
      }))
      .sort((a, b) => b.score - a.score)

    return filtered
  }, [])

  // 检查链接是否存在
  const handleCheckLinkExists = useCallback((pageName: string): boolean => {
    return mockPages.some(page => page.title === pageName)
  }, [])

  // 处理链接点击
  const handleLinkClick = useCallback((pageName: string) => {
    console.log('链接点击:', pageName)
    alert(`导航到页面: ${pageName}`)
  }, [])

  // 处理链接预览
  const handleLinkPreview = useCallback(async (pageName: string): Promise<string | null> => {
    const page = mockPages.find(p => p.title === pageName)
    return page ? page.preview : null
  }, [])

  // 处理直接自动补全
  const handleDirectInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDirectInputValue(value)

    // 检查是否输入了 [[
    if (value.endsWith('[[')) {
      const rect = e.target.getBoundingClientRect()
      setDirectPosition({ x: rect.left, y: rect.bottom + 4 })
      setShowDirectAutoComplete(true)
      handleGetSuggestions('').then(setDirectSuggestions)
    } else if (value.includes('[[') && !value.includes(']]')) {
      const query = value.split('[[').pop() || ''
      handleGetSuggestions(query).then(setDirectSuggestions)
    } else {
      setShowDirectAutoComplete(false)
    }
  }, [handleGetSuggestions])

  // 处理直接自动补全选择
  const handleDirectSelect = useCallback((suggestion: LinkSuggestion) => {
    const beforeLink = directInputValue.substring(0, directInputValue.lastIndexOf('[['))
    const newValue = beforeLink + `[[${suggestion.title}]]`
    setDirectInputValue(newValue)
    setShowDirectAutoComplete(false)
  }, [directInputValue])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          链接自动补全功能演示
        </h1>
        <p className="text-gray-600">
          展示智能文本输入和自动补全功能
        </p>
      </div>

      {/* SmartTextInput 演示 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          1. 智能文本输入框 (SmartTextInput)
        </h2>
        <p className="text-gray-600">
          输入 <code className="bg-gray-100 px-1 rounded">[[</code> 开始创建链接，支持自动补全和智能提示
        </p>
        
        <div className="space-y-2">
          <SmartTextInput
            value={inputValue}
            onChange={setInputValue}
            onGetSuggestions={handleGetSuggestions}
            onCheckLinkExists={handleCheckLinkExists}
            onLinkClick={handleLinkClick}
            onLinkPreview={handleLinkPreview}
            placeholder="输入文本，尝试输入 [[技术 来触发自动补全..."
            className="w-full"
            enableAutoComplete={true}
            enableLinkPreview={true}
            autoCompleteDelay={300}
            maxSuggestions={8}
            showCreateOption={true}
          />
          
          {/* 实时预览 */}
          {inputValue && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">实时预览:</h3>
              <LinkRenderer
                content={inputValue}
                onLinkClick={handleLinkClick}
                onLinkPreview={handleLinkPreview}
                checkLinkExists={handleCheckLinkExists}
              />
            </div>
          )}
        </div>
      </section>

      {/* 直接自动补全演示 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          2. 直接自动补全 (LinkAutoComplete)
        </h2>
        <p className="text-gray-600">
          直接使用自动补全组件，输入 <code className="bg-gray-100 px-1 rounded">[[</code> 触发
        </p>
        
        <div className="relative">
          <input
            type="text"
            value={directInputValue}
            onChange={handleDirectInput}
            placeholder="输入 [[ 触发自动补全..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <LinkAutoComplete
            query={directInputValue.includes('[[') ? directInputValue.split('[[').pop() || '' : ''}
            position={directPosition}
            visible={showDirectAutoComplete}
            suggestions={directSuggestions}
            onSelect={handleDirectSelect}
            onClose={() => setShowDirectAutoComplete(false)}
            maxItems={6}
            showCreateOption={true}
            showHistory={true}
            history={history}
          />
        </div>
      </section>

      {/* 功能特性展示 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          3. 功能特性展示
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 链接状态展示 */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">链接状态</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BiDirectionalLink pageName="技术文档" exists={true} />
                <span className="text-sm text-gray-600">存在的页面</span>
              </div>
              <div className="flex items-center gap-2">
                <BiDirectionalLink pageName="不存在页面" exists={false} />
                <span className="text-sm text-gray-600">不存在的页面</span>
              </div>
              <div className="flex items-center gap-2">
                <BiDirectionalLink 
                  pageName="技术文档" 
                  displayText="文档" 
                  variant="alias" 
                />
                <span className="text-sm text-gray-600">别名链接</span>
              </div>
            </div>
          </div>

          {/* 键盘快捷键 */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">键盘快捷键</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div><kbd className="bg-gray-100 px-1 rounded">↑↓</kbd> 选择建议</div>
              <div><kbd className="bg-gray-100 px-1 rounded">Enter</kbd> 确认选择</div>
              <div><kbd className="bg-gray-100 px-1 rounded">Tab</kbd> 确认选择</div>
              <div><kbd className="bg-gray-100 px-1 rounded">Esc</kbd> 关闭自动补全</div>
            </div>
          </div>
        </div>
      </section>

      {/* 示例文本 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          4. 示例文本
        </h2>
        <p className="text-gray-600">
          复制以下文本到上面的输入框中体验链接渲染效果：
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <code className="text-sm">
            请参考 [[技术文档]] 了解详细信息。同时查看 [[用户手册|手册]] 获取使用指南。
            如果遇到问题，请查阅 [[故障排除]] 页面。
          </code>
        </div>
      </section>
    </div>
  )
}

export default LinkAutoCompleteDemo
