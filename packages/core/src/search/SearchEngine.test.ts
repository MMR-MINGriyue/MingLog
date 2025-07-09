/**
 * SearchEngine 单元测试
 * 测试搜索引擎的索引、查询和结果排序功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchEngine } from './SearchEngine';
import { testUtils } from '@test/setup';
import type { SearchDocument, SearchOptions } from './SearchEngine';

describe('SearchEngine', () => {
  let searchEngine: SearchEngine;
  let mockDocuments: SearchDocument[];

  beforeEach(() => {
    searchEngine = new SearchEngine();
    mockDocuments = [
      {
        id: 'doc1',
        title: '双向链接系统设计',
        content: '本文档介绍了双向链接系统的核心设计理念和实现方案。双向链接是现代知识管理的重要特性。',
        type: 'page',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        tags: ['设计', '系统', '链接'],
        author: 'MingLog Team'
      },
      {
        id: 'doc2',
        title: 'React组件开发指南',
        content: 'React是一个用于构建用户界面的JavaScript库。本指南介绍了组件开发的最佳实践。',
        type: 'page',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-04'),
        tags: ['React', '组件', '开发'],
        author: 'Frontend Team'
      },
      {
        id: 'doc3',
        title: '搜索算法优化',
        content: '搜索算法的性能优化是提升用户体验的关键。本文档讨论了TF-IDF和相关性评分的实现。',
        type: 'block',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-06'),
        tags: ['搜索', '算法', '优化'],
        author: 'Backend Team'
      },
      {
        id: 'doc4',
        title: '用户界面设计',
        content: '良好的用户界面设计能够提升用户体验。本文档介绍了UI设计的基本原则和最佳实践。',
        type: 'page',
        createdAt: new Date('2024-01-07'),
        updatedAt: new Date('2024-01-08'),
        tags: ['UI', '设计', '用户体验'],
        author: 'Design Team'
      }
    ];

    // 添加文档到搜索引擎
    mockDocuments.forEach(doc => {
      searchEngine.addDocument(doc);
    });
  });

  describe('文档管理', () => {
    it('应该能够添加文档', () => {
      const newDoc: SearchDocument = {
        id: 'doc5',
        title: '新文档',
        content: '这是一个新的测试文档',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      searchEngine.addDocument(newDoc);
      const stats = searchEngine.getStats();
      expect(stats.totalDocuments).toBe(5);
    });

    it('应该能够更新文档', () => {
      const updatedDoc = {
        ...mockDocuments[0],
        title: '更新后的标题',
        content: '更新后的内容'
      };

      searchEngine.updateDocument(updatedDoc);
      const results = searchEngine.search('更新后的标题');
      expect(results).toHaveLength(1);
      expect(results[0].document.title).toBe('更新后的标题');
    });

    it('应该能够删除文档', () => {
      searchEngine.removeDocument('doc1');
      const stats = searchEngine.getStats();
      expect(stats.totalDocuments).toBe(3);
      
      const results = searchEngine.search('双向链接');
      expect(results).toHaveLength(0);
    });
  });

  describe('基本搜索功能', () => {
    it('应该能够进行简单的文本搜索', () => {
      const results = searchEngine.search('双向链接');
      expect(results).toHaveLength(1);
      expect(results[0].document.id).toBe('doc1');
    });

    it('应该能够搜索标题', () => {
      const results = searchEngine.search('React组件');
      expect(results).toHaveLength(1);
      expect(results[0].document.id).toBe('doc2');
    });

    it('应该能够搜索内容', () => {
      const results = searchEngine.search('TF-IDF');
      expect(results).toHaveLength(1);
      expect(results[0].document.id).toBe('doc3');
    });

    it('应该返回空结果当没有匹配时', () => {
      const results = searchEngine.search('不存在的内容');
      expect(results).toHaveLength(0);
    });

    it('应该忽略大小写', () => {
      const results1 = searchEngine.search('REACT');
      const results2 = searchEngine.search('react');
      expect(results1).toHaveLength(results2.length);
    });
  });

  describe('高级搜索功能', () => {
    it('应该支持多词搜索', () => {
      const results = searchEngine.search('用户 界面');
      expect(results.length).toBeGreaterThan(0);
      
      // 应该包含包含"用户"或"界面"的文档
      const hasUserDoc = results.some(r => r.document.content.includes('用户'));
      const hasInterfaceDoc = results.some(r => r.document.content.includes('界面'));
      expect(hasUserDoc || hasInterfaceDoc).toBe(true);
    });

    it('应该支持短语搜索', () => {
      const results = searchEngine.search('"用户界面"');
      expect(results).toHaveLength(1);
      expect(results[0].document.id).toBe('doc4');
    });

    it('应该支持通配符搜索', () => {
      const results = searchEngine.search('React*');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('搜索选项', () => {
    it('应该支持限制结果数量', () => {
      const options: SearchOptions = { limit: 2 };
      const results = searchEngine.search('设计', options);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('应该支持结果偏移', () => {
      const allResults = searchEngine.search('设计');
      const offsetResults = searchEngine.search('设计', { offset: 1 });
      
      if (allResults.length > 1) {
        expect(offsetResults[0].document.id).toBe(allResults[1].document.id);
      }
    });

    it('应该支持按相关性排序', () => {
      const results = searchEngine.search('设计', { sortBy: 'score', sortOrder: 'desc' });
      
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });

    it('应该支持按时间排序', () => {
      const results = searchEngine.search('设计', { sortBy: 'createdAt', sortOrder: 'desc' });
      
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].document.createdAt.getTime())
          .toBeGreaterThanOrEqual(results[i + 1].document.createdAt.getTime());
      }
    });
  });

  describe('结果高亮', () => {
    it('应该生成高亮片段', () => {
      const results = searchEngine.search('双向链接', { highlight: true });
      expect(results).toHaveLength(1);
      expect(results[0].highlights).toBeDefined();
      expect(results[0].highlights.length).toBeGreaterThan(0);
    });

    it('应该在高亮片段中包含搜索词', () => {
      const results = searchEngine.search('React', { highlight: true });
      expect(results).toHaveLength(1);
      
      const titleHighlight = results[0].highlights.find(h => h.field === 'title');
      expect(titleHighlight).toBeDefined();
      expect(titleHighlight!.fragments.some(f => f.includes('React'))).toBe(true);
    });

    it('应该支持自定义高亮标签', () => {
      const options: SearchOptions = {
        highlight: true,
        highlightTags: { pre: '<em>', post: '</em>' }
      };
      
      const results = searchEngine.search('React', options);
      const highlight = results[0].highlights[0];
      expect(highlight.fragments[0]).toContain('<em>');
      expect(highlight.fragments[0]).toContain('</em>');
    });
  });

  describe('过滤功能', () => {
    it('应该支持按文档类型过滤', () => {
      const options: SearchOptions = {
        filters: { fileTypes: ['page'] }
      };
      
      const results = searchEngine.search('设计', options);
      results.forEach(result => {
        expect(result.document.type).toBe('page');
      });
    });

    it('应该支持按标签过滤', () => {
      const options: SearchOptions = {
        filters: { tags: ['设计'] }
      };
      
      const results = searchEngine.search('', options);
      results.forEach(result => {
        expect(result.document.tags).toContain('设计');
      });
    });

    it('应该支持按时间范围过滤', () => {
      const options: SearchOptions = {
        filters: {
          dateRange: {
            start: new Date('2024-01-03'),
            end: new Date('2024-01-06')
          }
        }
      };
      
      const results = searchEngine.search('', options);
      results.forEach(result => {
        expect(result.document.createdAt.getTime())
          .toBeGreaterThanOrEqual(new Date('2024-01-03').getTime());
        expect(result.document.createdAt.getTime())
          .toBeLessThanOrEqual(new Date('2024-01-06').getTime());
      });
    });
  });

  describe('搜索建议', () => {
    it('应该提供搜索建议', () => {
      const suggestions = searchEngine.getSuggestions('Rea');
      expect(suggestions).toContain('react');
    });

    it('应该限制建议数量', () => {
      const suggestions = searchEngine.getSuggestions('设', 2);
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });

    it('应该返回相关的建议', () => {
      const suggestions = searchEngine.getSuggestions('搜索');
      expect(suggestions.length).toBeGreaterThan(0);
      suggestions.forEach(suggestion => {
        expect(suggestion.toLowerCase()).toContain('搜');
      });
    });
  });

  describe('相关性评分', () => {
    it('应该为完全匹配给出更高分数', () => {
      const exactResults = searchEngine.search('双向链接系统设计');
      const partialResults = searchEngine.search('设计');
      
      if (exactResults.length > 0 && partialResults.length > 0) {
        expect(exactResults[0].score).toBeGreaterThan(partialResults[0].score);
      }
    });

    it('应该为标题匹配给出更高分数', () => {
      const titleResults = searchEngine.search('React组件开发指南');
      const contentResults = searchEngine.search('JavaScript库');
      
      if (titleResults.length > 0 && contentResults.length > 0) {
        expect(titleResults[0].score).toBeGreaterThan(contentResults[0].score);
      }
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内完成搜索', () => {
      const start = performance.now();
      searchEngine.search('设计');
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100); // 100ms内完成
    });

    it('应该处理大量文档', () => {
      // 添加大量文档
      for (let i = 0; i < 1000; i++) {
        searchEngine.addDocument({
          id: `large-doc-${i}`,
          title: `Large Document ${i}`,
          content: `This is content for document ${i} with some random text`,
          type: 'page',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      const start = performance.now();
      const results = searchEngine.search('document');
      const end = performance.now();
      
      expect(results.length).toBeGreaterThan(0);
      expect(end - start).toBeLessThan(500); // 500ms内完成
    });
  });

  describe('统计信息', () => {
    it('应该提供正确的统计信息', () => {
      const stats = searchEngine.getStats();
      
      expect(stats.totalDocuments).toBe(4);
      expect(stats.totalTerms).toBeGreaterThan(0);
      expect(stats.averageDocumentSize).toBeGreaterThan(0);
      expect(stats.indexSize).toBeGreaterThan(0);
    });
  });
});
