/**
 * 快捷键系统演示页面
 * 展示新的命令系统、块导航、全局搜索等功能
 */

import React, { useState, useRef } from 'react';
import { Keyboard, Command, Search, Navigation, Layers, Info } from 'lucide-react';
import { BlockEditor } from '../components/BlockEditor';
import { CommandSystem } from '../commands/CommandSystem';
import type { CustomElement } from '@minglog/editor';

// 模拟事件总线
class MockEventBus {
  private listeners = new Map<string, Function[]>();

  emit(type: string, data?: any, source?: string): void {
    const handlers = this.listeners.get(type) || [];
    handlers.forEach(handler => handler({ type, data, source, timestamp: Date.now() }));
  }

  on(type: string, handler: Function): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(handler);
  }

  off(type: string, handler: Function): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
}

const DEMO_CONTENT: CustomElement[] = [
  {
    type: 'heading-1',
    children: [{ text: 'MingLog 快捷键系统演示' }]
  },
  {
    type: 'paragraph',
    children: [{ text: '欢迎体验全新的快捷键系统！这里集成了来自 Notion、Logseq、幕布等优秀笔记软件的设计理念。' }]
  },
  {
    type: 'heading-2',
    children: [{ text: '🚀 核心功能' }]
  },
  {
    type: 'bulleted-list',
    children: [{ text: '斜杠命令 (/) - 快速创建各种块类型' }]
  },
  {
    type: 'bulleted-list',
    children: [{ text: '全局命令面板 (Ctrl+P) - 搜索和执行所有命令' }]
  },
  {
    type: 'bulleted-list',
    children: [{ text: '智能块导航 (Alt+↑↓) - 在块之间快速移动' }]
  },
  {
    type: 'bulleted-list',
    children: [{ text: '块操作快捷键 - 复制、移动、缩进等' }]
  },
  {
    type: 'heading-2',
    children: [{ text: '⌨️ 快捷键列表' }]
  },
  {
    type: 'paragraph',
    children: [{ text: '试试这些快捷键：' }]
  }
];

interface ShortcutItem {
  category: string;
  shortcuts: Array<{
    key: string;
    description: string;
    example?: string;
  }>;
}

const SHORTCUT_CATEGORIES: ShortcutItem[] = [
  {
    category: '命令系统',
    shortcuts: [
      { key: '/', description: '打开块类型菜单', example: '输入 / 然后搜索"标题"' },
      { key: 'Ctrl+P', description: '打开全局命令面板', example: '搜索所有可用命令' },
      { key: 'Ctrl+Shift+K', description: '打开命令面板（备用）' },
      { key: 'Esc', description: '关闭菜单或选择当前块' }
    ]
  },
  {
    category: '块导航',
    shortcuts: [
      { key: 'Alt+↑', description: '导航到上一个块' },
      { key: 'Alt+↓', description: '导航到下一个块' },
      { key: 'Ctrl+Home', description: '导航到第一个块' },
      { key: 'Ctrl+End', description: '导航到最后一个块' }
    ]
  },
  {
    category: '块操作',
    shortcuts: [
      { key: 'Tab', description: '增加缩进' },
      { key: 'Shift+Tab', description: '减少缩进' },
      { key: 'Ctrl+D', description: '复制当前块' },
      { key: 'Ctrl+Shift+D', description: '复制当前块' },
      { key: 'Ctrl+Shift+↑', description: '向上移动块' },
      { key: 'Ctrl+Shift+↓', description: '向下移动块' }
    ]
  },
  {
    category: '格式化',
    shortcuts: [
      { key: 'Ctrl+B', description: '粗体' },
      { key: 'Ctrl+I', description: '斜体' },
      { key: 'Ctrl+U', description: '下划线' },
      { key: 'Ctrl+Shift+S', description: '删除线' },
      { key: 'Ctrl+E', description: '行内代码' },
      { key: 'Ctrl+K', description: '插入链接' }
    ]
  }
];

/**
 * 快捷键系统演示组件
 */
export const ShortcutSystemDemo: React.FC = () => {
  const [content, setContent] = useState<CustomElement[]>(DEMO_CONTENT);
  const [showShortcuts, setShowShortcuts] = useState(true);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const eventBusRef = useRef(new MockEventBus());

  // 监听命令执行事件
  React.useEffect(() => {
    const eventBus = eventBusRef.current;
    
    const handleCommandExecuted = (event: any) => {
      setEventLog(prev => [
        `[${new Date().toLocaleTimeString()}] 执行命令: ${event.data.command}`,
        ...prev.slice(0, 9) // 保留最近10条记录
      ]);
    };

    const handleCommandError = (event: any) => {
      setEventLog(prev => [
        `[${new Date().toLocaleTimeString()}] 命令错误: ${event.data.error}`,
        ...prev.slice(0, 9)
      ]);
    };

    eventBus.on('command:executed', handleCommandExecuted);
    eventBus.on('command:error', handleCommandError);

    return () => {
      eventBus.off('command:executed', handleCommandExecuted);
      eventBus.off('command:error', handleCommandError);
    };
  }, []);

  const handleContentChange = (newContent: CustomElement[]) => {
    setContent(newContent);
  };

  const handleSave = async (content: CustomElement[]) => {
    console.log('保存内容:', content);
    setEventLog(prev => [
      `[${new Date().toLocaleTimeString()}] 内容已保存`,
      ...prev.slice(0, 9)
    ]);
  };

  const handleError = (error: Error) => {
    console.error('编辑器错误:', error);
    setEventLog(prev => [
      `[${new Date().toLocaleTimeString()}] 错误: ${error.message}`,
      ...prev.slice(0, 9)
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Keyboard className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              MingLog 快捷键系统演示
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Info className="w-4 h-4" />
              <span>{showShortcuts ? '隐藏' : '显示'}快捷键</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* 主编辑区域 */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <BlockEditor
              editorId="demo-editor"
              initialValue={content}
              onChange={handleContentChange}
              onSave={handleSave}
              onError={handleError}
              eventBus={eventBusRef.current as any}
              enableKeyboardShortcuts={true}
              enableMarkdown={true}
              enableSyntaxHighlight={true}
              enableMath={true}
              showRichTextToolbar={true}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>

        {/* 侧边栏 */}
        {showShortcuts && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            {/* 快捷键列表 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Command className="w-5 h-5 mr-2" />
                快捷键参考
              </h3>
              
              <div className="space-y-4">
                {SHORTCUT_CATEGORIES.map((category) => (
                  <div key={category.category}>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {category.category}
                    </h4>
                    <div className="space-y-2">
                      {category.shortcuts.map((shortcut, index) => (
                        <div key={index} className="flex items-start justify-between text-xs">
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-900 dark:text-white font-medium">
                              {shortcut.description}
                            </div>
                            {shortcut.example && (
                              <div className="text-gray-500 dark:text-gray-400 mt-1">
                                {shortcut.example}
                              </div>
                            )}
                          </div>
                          <kbd className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-mono">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 事件日志 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Layers className="w-5 h-5 mr-2" />
                事件日志
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-60 overflow-y-auto">
                {eventLog.length === 0 ? (
                  <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                    暂无事件记录
                  </div>
                ) : (
                  <div className="space-y-1">
                    {eventLog.map((log, index) => (
                      <div key={index} className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortcutSystemDemo;
