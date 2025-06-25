import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnhancedSearch } from '../components/EnhancedSearch';
import { useApiStore } from '../stores/api-store';

interface SearchResult {
  id: string;
  type: 'page' | 'block';
  title: string;
  content: string;
  excerpt: string;
  score: number;
  metadata: {
    pageId?: string;
    pageName?: string;
    blockId?: string;
    tags?: string[];
    isJournal?: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentPage, pages } = useApiStore();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const handleResultSelect = (result: SearchResult) => {
    if (result.type === 'page') {
      // Navigate to the page
      const page = pages.find(p => p.id === result.id);
      if (page) {
        setCurrentPage(page);
        navigate('/');
      }
    } else if (result.type === 'block' && result.metadata.pageId) {
      // Navigate to the page containing the block
      const page = pages.find(p => p.id === result.metadata.pageId);
      if (page) {
        setCurrentPage(page);
        navigate(`/?blockId=${result.id}`);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">搜索</h1>
        <p className="text-gray-600">
          在您的知识库中搜索页面和内容块
        </p>
      </div>

      {/* Enhanced Search Component */}
      <div className="mb-8">
        <EnhancedSearch
          onResultSelect={handleResultSelect}
          placeholder="搜索页面、块、标签..."
          showFilters={true}
          autoFocus={true}
        />
      </div>

      {/* Search Tips */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">🔍 搜索技巧</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h3 className="font-medium mb-2">基本搜索</h3>
            <ul className="space-y-1">
              <li>• 输入关键词进行全文搜索</li>
              <li>• 支持中英文混合搜索</li>
              <li>• 自动匹配标题和内容</li>
              <li>• 实时显示搜索结果</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">高级功能</h3>
            <ul className="space-y-1">
              <li>• 使用过滤器缩小搜索范围</li>
              <li>• 按类型、日期、相关性排序</li>
              <li>• 查看搜索历史记录</li>
              <li>• 键盘导航选择结果</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">⌨️ 键盘快捷键</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>开始搜索</span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Ctrl + K</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>向下选择</span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↓</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>向上选择</span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↑</kbd>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>确认选择</span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Enter</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>关闭搜索</span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Esc</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>切换过滤器</span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Ctrl + F</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Search Statistics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{pages.length}</div>
              <div className="text-sm text-gray-500">可搜索页面</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">-</div>
              <div className="text-sm text-gray-500">内容块</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">-</div>
              <div className="text-sm text-gray-500">标签</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
