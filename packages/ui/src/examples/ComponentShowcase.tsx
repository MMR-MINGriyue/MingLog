/**
 * 组件展示示例
 * 用于测试和展示UI组件库的功能
 */

import React, { useState } from 'react'
import { ThemeProvider } from '../contexts/ThemeContext'
import { Button } from '../components/atoms/Button/Button'
import { Input, Textarea } from '../components/atoms/Input/Input'
import { ThemeToggle } from '../components/atoms/ThemeToggle/ThemeToggle'
import { SearchBox, SearchResult } from '../components/molecules/SearchBox/SearchBox'
import { PerformanceMonitor } from '../components/organisms/PerformanceMonitor/PerformanceMonitor'

// 模拟搜索数据
const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    title: 'Getting Started with MingLog',
    content: 'Learn how to use MingLog for note-taking and knowledge management.',
    type: 'page',
    url: '/docs/getting-started'
  },
  {
    id: '2',
    title: 'Task Management',
    content: 'Organize your tasks and projects efficiently.',
    type: 'page',
    url: '/docs/tasks'
  },
  {
    id: '3',
    title: 'Meeting Notes - Q1 Planning',
    content: 'Discussion about Q1 goals and objectives.',
    type: 'block',
    url: '/notes/meeting-q1'
  },
  {
    id: '4',
    title: 'Project Proposal.pdf',
    content: 'Detailed project proposal document.',
    type: 'file',
    url: '/files/project-proposal.pdf'
  },
  {
    id: '5',
    title: 'Review Documentation',
    content: 'Task to review and update project documentation.',
    type: 'task',
    url: '/tasks/review-docs'
  }
]

// 模拟搜索函数
const mockSearch = async (query: string): Promise<SearchResult[]> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300))
  
  return mockSearchResults.filter(result =>
    result.title.toLowerCase().includes(query.toLowerCase()) ||
    result.content?.toLowerCase().includes(query.toLowerCase())
  )
}

export function ComponentShowcase() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [performanceOpen, setPerformanceOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [textareaValue, setTextareaValue] = useState('')

  const handleSearchSelect = (result: SearchResult) => {
    console.log('Selected search result:', result)
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background-primary text-foreground-primary">
        {/* 头部 */}
        <header className="border-b border-border-primary bg-background-elevated">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">MingLog UI Components</h1>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setSearchOpen(true)}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                >
                  Search
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPerformanceOpen(true)}
                >
                  Performance
                </Button>
                <ThemeToggle showLabel />
              </div>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="space-y-12">
            {/* 按钮组件 */}
            <section>
              <h2 className="text-xl font-semibold mb-6">Buttons</h2>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button size="xl">Extra Large</Button>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                  <Button
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    }
                  >
                    With Icon
                  </Button>
                </div>
              </div>
            </section>

            {/* 输入组件 */}
            <section>
              <h2 className="text-xl font-semibold mb-6">Inputs</h2>
              <div className="space-y-6 max-w-md">
                <Input
                  label="Basic Input"
                  placeholder="Enter some text..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                
                <Input
                  label="Input with Icon"
                  placeholder="Search..."
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
                
                <Input
                  label="Input with Addon"
                  placeholder="0.00"
                  leftAddon="$"
                  rightAddon="USD"
                />
                
                <Input
                  label="Error State"
                  placeholder="Invalid input"
                  error
                  errorText="This field is required"
                />
                
                <Input
                  label="Success State"
                  placeholder="Valid input"
                  success
                  helperText="Looks good!"
                />
                
                <Textarea
                  label="Textarea"
                  placeholder="Enter your message..."
                  value={textareaValue}
                  onChange={(e) => setTextareaValue(e.target.value)}
                  helperText="Maximum 500 characters"
                />
              </div>
            </section>

            {/* 主题切换 */}
            <section>
              <h2 className="text-xl font-semibold mb-6">Theme Toggle</h2>
              <div className="flex flex-wrap gap-4">
                <ThemeToggle />
                <ThemeToggle showLabel />
                <ThemeToggle variant="outline" showLabel />
              </div>
            </section>

            {/* 颜色展示 */}
            <section>
              <h2 className="text-xl font-semibold mb-6">Colors</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Background</h3>
                  <div className="space-y-1">
                    <div className="h-8 bg-background-primary border border-border-primary rounded flex items-center px-2 text-xs">Primary</div>
                    <div className="h-8 bg-background-secondary border border-border-primary rounded flex items-center px-2 text-xs">Secondary</div>
                    <div className="h-8 bg-background-tertiary border border-border-primary rounded flex items-center px-2 text-xs">Tertiary</div>
                    <div className="h-8 bg-background-elevated border border-border-primary rounded flex items-center px-2 text-xs">Elevated</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Text</h3>
                  <div className="space-y-1">
                    <div className="text-foreground-primary text-sm">Primary Text</div>
                    <div className="text-foreground-secondary text-sm">Secondary Text</div>
                    <div className="text-foreground-tertiary text-sm">Tertiary Text</div>
                    <div className="text-foreground-disabled text-sm">Disabled Text</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Brand</h3>
                  <div className="space-y-1">
                    <div className="h-8 bg-brand-primary rounded flex items-center px-2 text-xs text-white">Primary</div>
                    <div className="h-8 bg-brand-secondary rounded flex items-center px-2 text-xs">Secondary</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Semantic</h3>
                  <div className="space-y-1">
                    <div className="h-6 bg-semantic-success rounded flex items-center px-2 text-xs text-white">Success</div>
                    <div className="h-6 bg-semantic-warning rounded flex items-center px-2 text-xs text-white">Warning</div>
                    <div className="h-6 bg-semantic-error rounded flex items-center px-2 text-xs text-white">Error</div>
                    <div className="h-6 bg-semantic-info rounded flex items-center px-2 text-xs text-white">Info</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* 搜索框 */}
        <SearchBox
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSearch={mockSearch}
          onSelect={handleSearchSelect}
          placeholder="Search MingLog..."
        />

        {/* 性能监控 */}
        <PerformanceMonitor
          isOpen={performanceOpen}
          onClose={() => setPerformanceOpen(false)}
        />
      </div>
    </ThemeProvider>
  )
}
