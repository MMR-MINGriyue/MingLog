/**
 * MingLog 双向链接系统 Week 2 功能演示
 * 展示UI组件、反向链接面板、自动补全和编辑器集成功能
 */

import React, { useState } from 'react';
import { PageLinkComponent } from './PageLinkComponent';
import { BlockReferenceComponent } from './BlockReferenceComponent';
import { BrokenLinkComponent } from './BrokenLinkComponent';
import { BacklinksPanel } from './BacklinksPanel';
import { LinkAutoComplete } from './LinkAutoComplete';
import { PageLink, BlockLink, BrokenLink, BacklinkInfo, LinkSuggestion } from '../../types/links';

// 模拟数据
const mockPageLink: PageLink = {
  type: 'page-reference',
  pageName: '双向链接系统',
  displayText: '双向链接系统',
  position: 0,
  length: 8,
  context: '这是一个关于双向链接系统的演示'
};

const mockPageLinkWithAlias: PageLink = {
  type: 'page-reference',
  pageName: '技术文档',
  displayText: '文档',
  alias: '文档',
  position: 0,
  length: 6,
  context: '查看技术文档了解更多信息'
};

const mockBlockLink: BlockLink = {
  type: 'block-reference',
  blockId: 'block-abc123',
  position: 0,
  length: 15,
  context: '参考之前的讨论 ((block-abc123)) 中的要点'
};

const mockBrokenLink: BrokenLink = {
  type: 'broken-link',
  originalText: '[[不完整的链接',
  position: 0,
  length: 8,
  reason: '不完整的页面链接语法',
  suggestions: ['[[不完整的链接]]']
};

const mockBacklinks: BacklinkInfo[] = [
  {
    id: 'link-1',
    sourceType: 'page',
    sourceId: 'page-1',
    sourceTitle: '项目介绍',
    linkType: 'page-reference',
    context: '本项目使用了先进的双向链接系统来组织知识',
    position: 10,
    createdAt: '2024-01-01T10:00:00Z'
  },
  {
    id: 'link-2',
    sourceType: 'page',
    sourceId: 'page-2',
    sourceTitle: '技术架构',
    linkType: 'page-reference',
    context: '双向链接系统的核心组件包括解析器和渲染器',
    position: 20,
    createdAt: '2024-01-02T10:00:00Z'
  }
];

const mockSuggestions: LinkSuggestion[] = [
  {
    id: 'page-1',
    title: '双向链接系统',
    type: 'page',
    preview: '一个强大的知识管理系统',
    score: 0.9,
    matchType: 'exact'
  },
  {
    id: 'page-2',
    title: '技术文档',
    type: 'page',
    preview: '详细的技术实现文档',
    score: 0.8,
    matchType: 'fuzzy'
  },
  {
    id: 'page-3',
    title: '用户指南',
    type: 'page',
    preview: '用户使用指南和最佳实践',
    score: 0.7,
    matchType: 'history'
  }
];

export const LinkSystemDemo: React.FC = () => {
  const [showBacklinks, setShowBacklinks] = useState(false);
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [autoCompleteQuery, setAutoCompleteQuery] = useState('');

  const handleLinkClick = (pageName: string, link: PageLink) => {
    console.log(`点击页面链接: ${pageName}`, link);
  };

  const handleBlockClick = (blockId: string, link: BlockLink) => {
    console.log(`点击块引用: ${blockId}`, link);
  };

  const handleBrokenLinkFix = (brokenLink: BrokenLink, fixedText: string) => {
    console.log(`修复损坏链接: ${brokenLink.originalText} -> ${fixedText}`);
  };

  const handleAutoCompleteSelect = (suggestion: LinkSuggestion) => {
    console.log(`选择建议: ${suggestion.title}`, suggestion);
    setShowAutoComplete(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔗 MingLog 双向链接系统 Week 2 功能演示</h1>
      
      {/* 基础链接组件演示 */}
      <section style={{ marginBottom: '30px' }}>
        <h2>1. 基础链接组件</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <h3>页面链接组件</h3>
          <p>
            这是一个 <PageLinkComponent 
              link={mockPageLink} 
              exists={true}
              onClick={handleLinkClick}
            /> 的演示。
          </p>
          <p>
            这是一个带别名的链接：<PageLinkComponent 
              link={mockPageLinkWithAlias} 
              exists={true}
              onClick={handleLinkClick}
            />
          </p>
          <p>
            这是一个不存在的页面：<PageLinkComponent 
              link={{...mockPageLink, pageName: '不存在的页面', displayText: '不存在的页面'}} 
              exists={false}
              onClick={handleLinkClick}
            />
          </p>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h3>块引用组件</h3>
          <p>
            参考之前的讨论 <BlockReferenceComponent 
              link={mockBlockLink}
              exists={true}
              blockContent="这是一个重要的讨论要点，包含了关键的技术决策。"
              blockTitle="技术决策讨论"
              onClick={handleBlockClick}
            /> 中的要点。
          </p>
          
          <div style={{ marginTop: '10px' }}>
            <BlockReferenceComponent 
              link={mockBlockLink}
              exists={true}
              blockContent="这是块模式显示的内容，可以显示更多的上下文信息。"
              blockTitle="详细讨论"
              displayMode="block"
              onClick={handleBlockClick}
            />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h3>损坏链接组件</h3>
          <p>
            这里有一个损坏的链接：<BrokenLinkComponent 
              brokenLink={mockBrokenLink}
              onFix={handleBrokenLinkFix}
              onRemove={(link) => console.log('删除损坏链接:', link)}
              onIgnore={(link) => console.log('忽略损坏链接:', link)}
            />
          </p>
        </div>
      </section>

      {/* 反向链接面板演示 */}
      <section style={{ marginBottom: '30px' }}>
        <h2>2. 反向链接面板</h2>
        <button 
          onClick={() => setShowBacklinks(!showBacklinks)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showBacklinks ? '隐藏' : '显示'}反向链接面板
        </button>
        
        <BacklinksPanel
          targetId="target-page"
          isOpen={showBacklinks}
          onClose={() => setShowBacklinks(false)}
          backlinks={mockBacklinks}
          onLinkClick={(backlink) => console.log('点击反向链接:', backlink)}
          position="right"
          width={350}
          height={400}
        />
      </section>

      {/* 自动补全演示 */}
      <section style={{ marginBottom: '30px' }}>
        <h2>3. 链接自动补全</h2>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="输入 [[ 触发自动补全..."
            value={autoCompleteQuery}
            onChange={(e) => {
              const value = e.target.value;
              setAutoCompleteQuery(value);
              setShowAutoComplete(value.includes('[['));
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '300px'
            }}
          />
          
          <LinkAutoComplete
            query={autoCompleteQuery.replace('[[', '')}
            linkType="page"
            position={{ x: 0, y: 40 }}
            visible={showAutoComplete}
            suggestions={mockSuggestions}
            onSelect={handleAutoCompleteSelect}
            onClose={() => setShowAutoComplete(false)}
            maxItems={5}
          />
        </div>
      </section>

      {/* 功能特性总结 */}
      <section style={{ marginBottom: '30px' }}>
        <h2>4. Week 2 功能特性总结</h2>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '6px',
          border: '1px solid #e9ecef'
        }}>
          <h3>✅ 已完成的功能</h3>
          <ul>
            <li><strong>UI组件开发</strong>
              <ul>
                <li>PageLinkComponent - 页面链接渲染和交互</li>
                <li>BlockReferenceComponent - 块引用显示和预览</li>
                <li>BrokenLinkComponent - 损坏链接处理和修复</li>
                <li>LinkTooltip - 链接悬停提示</li>
              </ul>
            </li>
            <li><strong>反向链接面板</strong>
              <ul>
                <li>BacklinksPanel - 实时显示反向链接</li>
                <li>BacklinksList - 支持分组和过滤</li>
                <li>统计信息和快速导航</li>
                <li>搜索和排序功能</li>
              </ul>
            </li>
            <li><strong>自动补全功能</strong>
              <ul>
                <li>LinkAutoComplete - 智能链接建议</li>
                <li>模糊匹配和历史记录</li>
                <li>键盘导航支持</li>
                <li>创建新页面选项</li>
              </ul>
            </li>
            <li><strong>编辑器集成</strong>
              <ul>
                <li>withLinks Slate.js插件</li>
                <li>LinkToolbar - 链接创建和编辑</li>
                <li>实时链接解析</li>
                <li>可视化渲染</li>
              </ul>
            </li>
            <li><strong>测试和验证</strong>
              <ul>
                <li>组件单元测试</li>
                <li>交互功能测试</li>
                <li>可访问性测试</li>
                <li>边界情况处理</li>
              </ul>
            </li>
          </ul>

          <h3>🎯 技术亮点</h3>
          <ul>
            <li><strong>组件化设计</strong> - 模块化、可复用的React组件</li>
            <li><strong>TypeScript支持</strong> - 完整的类型定义和类型安全</li>
            <li><strong>可访问性</strong> - ARIA标签、键盘导航、屏幕阅读器支持</li>
            <li><strong>响应式设计</strong> - 支持不同屏幕尺寸和设备</li>
            <li><strong>主题支持</strong> - 深色/浅色主题切换</li>
            <li><strong>性能优化</strong> - 虚拟化、延迟加载、防抖处理</li>
          </ul>

          <h3>🔄 与Week 1的集成</h3>
          <ul>
            <li>完美集成Week 1的核心解析器和服务层</li>
            <li>使用统一的类型定义和接口</li>
            <li>保持数据流的一致性和可预测性</li>
            <li>扩展了原有的功能而不破坏现有架构</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default LinkSystemDemo;
