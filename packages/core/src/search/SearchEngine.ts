/**
 * MingLog 搜索引擎
 * 提供全文搜索、索引管理和结果排序功能
 */

import { SearchQueryParser, SearchQuery, SearchNode, SearchFilter } from './SearchQueryParser';

export interface SearchDocument {
  /** 文档ID */
  id: string;
  /** 文档标题 */
  title: string;
  /** 文档内容 */
  content: string;
  /** 文档类型 */
  type: 'page' | 'block' | 'tag';
  /** 文档路径 */
  path?: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 标签 */
  tags?: string[];
  /** 作者 */
  author?: string;
  /** 文档大小 */
  size?: number;
  /** 自定义字段 */
  fields?: Record<string, any>;
}

export interface SearchResult {
  /** 匹配的文档 */
  document: SearchDocument;
  /** 相关性分数 */
  score: number;
  /** 高亮片段 */
  highlights: SearchHighlight[];
  /** 匹配的字段 */
  matchedFields: string[];
}

export interface SearchHighlight {
  /** 字段名 */
  field: string;
  /** 高亮片段 */
  fragments: string[];
  /** 原始文本 */
  originalText: string;
}

export interface SearchOptions {
  /** 最大结果数 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 是否启用高亮 */
  highlight?: boolean;
  /** 高亮标签 */
  highlightTags?: {
    pre: string;
    post: string;
  };
  /** 片段长度 */
  fragmentSize?: number;
  /** 最大片段数 */
  maxFragments?: number;
  /** 过滤器 */
  filters?: SearchFilter;
}

export class SearchEngine {
  private documents: Map<string, SearchDocument> = new Map();
  private index: Map<string, Set<string>> = new Map();
  private parser = new SearchQueryParser();

  /**
   * 添加文档到索引
   */
  addDocument(document: SearchDocument): void {
    this.documents.set(document.id, document);
    this.indexDocument(document);
  }

  /**
   * 更新文档
   */
  updateDocument(document: SearchDocument): void {
    this.removeDocument(document.id);
    this.addDocument(document);
  }

  /**
   * 删除文档
   */
  removeDocument(id: string): void {
    const document = this.documents.get(id);
    if (document) {
      this.unindexDocument(document);
      this.documents.delete(id);
    }
  }

  /**
   * 搜索文档
   */
  search(query: string, options: SearchOptions = {}): SearchResult[] {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'score',
      sortOrder = 'desc',
      highlight = true,
      highlightTags = { pre: '<mark>', post: '</mark>' },
      fragmentSize = 150,
      maxFragments = 3,
      filters
    } = options;

    // 解析查询
    const parsedQuery = this.parser.parse(query);
    if (parsedQuery.hasError) {
      console.warn('Search query parsing errors:', parsedQuery.errors);
    }

    // 执行搜索
    const candidateIds = this.executeQuery(parsedQuery.ast);
    
    // 应用过滤器
    const filteredIds = filters ? this.applyFilters(candidateIds, filters) : candidateIds;

    // 计算相关性分数
    const results: SearchResult[] = [];
    for (const id of filteredIds) {
      const document = this.documents.get(id);
      if (!document) continue;

      const score = this.calculateScore(document, parsedQuery.ast, query);
      const highlights = highlight ? this.generateHighlights(
        document, 
        query, 
        highlightTags, 
        fragmentSize, 
        maxFragments
      ) : [];

      results.push({
        document,
        score,
        highlights,
        matchedFields: this.getMatchedFields(document, parsedQuery.ast)
      });
    }

    // 排序
    this.sortResults(results, sortBy, sortOrder);

    // 分页
    return results.slice(offset, offset + limit);
  }

  /**
   * 获取搜索建议
   */
  getSuggestions(query: string, limit = 10): string[] {
    const terms = query.toLowerCase().split(/\s+/);
    const lastTerm = terms[terms.length - 1];
    
    if (!lastTerm) return [];

    const suggestions = new Set<string>();
    
    // 从索引中查找匹配的词项
    for (const [term] of this.index) {
      if (term.startsWith(lastTerm) && term !== lastTerm) {
        suggestions.add(term);
      }
    }

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalDocuments: this.documents.size,
      totalTerms: this.index.size,
      averageDocumentSize: this.getAverageDocumentSize(),
      indexSize: this.getIndexSize()
    };
  }

  /**
   * 为文档建立索引
   */
  private indexDocument(document: SearchDocument): void {
    const text = `${document.title} ${document.content}`.toLowerCase();
    const terms = this.tokenize(text);

    for (const term of terms) {
      if (!this.index.has(term)) {
        this.index.set(term, new Set());
      }
      this.index.get(term)!.add(document.id);
    }

    // 索引标签
    if (document.tags) {
      for (const tag of document.tags) {
        const tagTerm = `tag:${tag.toLowerCase()}`;
        if (!this.index.has(tagTerm)) {
          this.index.set(tagTerm, new Set());
        }
        this.index.get(tagTerm)!.add(document.id);
      }
    }

    // 索引类型
    const typeTerm = `type:${document.type}`;
    if (!this.index.has(typeTerm)) {
      this.index.set(typeTerm, new Set());
    }
    this.index.get(typeTerm)!.add(document.id);
  }

  /**
   * 从索引中移除文档
   */
  private unindexDocument(document: SearchDocument): void {
    for (const [term, docIds] of this.index) {
      docIds.delete(document.id);
      if (docIds.size === 0) {
        this.index.delete(term);
      }
    }
  }

  /**
   * 执行查询
   */
  private executeQuery(node: SearchNode): Set<string> {
    switch (node.type) {
      case 'term':
        return this.searchTerm(node.value!);
      
      case 'phrase':
        return this.searchPhrase(node.value!);
      
      case 'wildcard':
        return this.searchWildcard(node.value!);
      
      case 'field':
        return this.searchField(node.field!, node.children![0]);
      
      case 'range':
        return this.searchRange(node.value!);
      
      case 'and':
        return this.intersectSets(node.children!.map(child => this.executeQuery(child)));
      
      case 'or':
        return this.unionSets(node.children!.map(child => this.executeQuery(child)));
      
      case 'not':
        const allDocs = new Set(this.documents.keys());
        const excludeDocs = this.executeQuery(node.children![0]);
        return this.subtractSets(allDocs, excludeDocs);
      
      default:
        return new Set();
    }
  }

  /**
   * 搜索词项
   */
  private searchTerm(term: string): Set<string> {
    const normalizedTerm = term.toLowerCase();
    return this.index.get(normalizedTerm) || new Set();
  }

  /**
   * 搜索短语
   */
  private searchPhrase(phrase: string): Set<string> {
    const terms = this.tokenize(phrase.toLowerCase());
    if (terms.length === 0) return new Set();
    
    // 获取第一个词的文档集合
    let result = this.searchTerm(terms[0]);
    
    // 对于短语搜索，需要验证词项的位置关系
    // 这里简化实现，实际应该检查词项在文档中的相对位置
    for (let i = 1; i < terms.length; i++) {
      const termDocs = this.searchTerm(terms[i]);
      result = this.intersectSets([result, termDocs]);
    }
    
    return result;
  }

  /**
   * 搜索通配符
   */
  private searchWildcard(pattern: string): Set<string> {
    const regex = new RegExp(
      pattern.toLowerCase()
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
    );
    
    const result = new Set<string>();
    for (const [term, docIds] of this.index) {
      if (regex.test(term)) {
        for (const docId of docIds) {
          result.add(docId);
        }
      }
    }
    
    return result;
  }

  /**
   * 搜索字段
   */
  private searchField(field: string, valueNode: SearchNode): Set<string> {
    // 简化实现，实际应该根据字段类型进行特殊处理
    const fieldTerm = `${field}:${valueNode.value}`;
    return this.index.get(fieldTerm.toLowerCase()) || new Set();
  }

  /**
   * 搜索范围
   */
  private searchRange(range: string): Set<string> {
    const [start, end] = range.split('|');
    // 简化实现，实际应该根据数据类型进行范围查询
    return new Set();
  }

  /**
   * 应用过滤器
   */
  private applyFilters(docIds: Set<string>, filters: SearchFilter): Set<string> {
    const result = new Set<string>();
    
    for (const id of docIds) {
      const doc = this.documents.get(id);
      if (!doc) continue;
      
      // 文件类型过滤
      if (filters.fileTypes && !filters.fileTypes.includes(doc.type)) {
        continue;
      }
      
      // 时间范围过滤
      if (filters.dateRange) {
        if (filters.dateRange.start && doc.createdAt < filters.dateRange.start) {
          continue;
        }
        if (filters.dateRange.end && doc.createdAt > filters.dateRange.end) {
          continue;
        }
      }
      
      // 标签过滤
      if (filters.tags && filters.tags.length > 0) {
        const docTags = doc.tags || [];
        if (!filters.tags.some(tag => docTags.includes(tag))) {
          continue;
        }
      }
      
      result.add(id);
    }
    
    return result;
  }

  /**
   * 计算相关性分数
   */
  private calculateScore(document: SearchDocument, queryNode: SearchNode, originalQuery: string): number {
    // 简化的TF-IDF评分
    const terms = this.tokenize(originalQuery.toLowerCase());
    let score = 0;
    
    const docText = `${document.title} ${document.content}`.toLowerCase();
    const docTerms = this.tokenize(docText);
    
    for (const term of terms) {
      const tf = this.calculateTF(term, docTerms);
      const idf = this.calculateIDF(term);
      score += tf * idf;
    }
    
    // 标题匹配加权
    const titleText = document.title.toLowerCase();
    for (const term of terms) {
      if (titleText.includes(term)) {
        score *= 1.5;
      }
    }
    
    return score;
  }

  /**
   * 计算词频
   */
  private calculateTF(term: string, docTerms: string[]): number {
    const count = docTerms.filter(t => t === term).length;
    return count / docTerms.length;
  }

  /**
   * 计算逆文档频率
   */
  private calculateIDF(term: string): number {
    const docCount = this.index.get(term)?.size || 0;
    if (docCount === 0) return 0;
    return Math.log(this.documents.size / docCount);
  }

  /**
   * 生成高亮片段
   */
  private generateHighlights(
    document: SearchDocument,
    query: string,
    tags: { pre: string; post: string },
    fragmentSize: number,
    maxFragments: number
  ): SearchHighlight[] {
    const highlights: SearchHighlight[] = [];
    const terms = this.tokenize(query.toLowerCase());
    
    // 高亮标题
    const titleHighlight = this.highlightText(document.title, terms, tags, fragmentSize);
    if (titleHighlight.fragments.length > 0) {
      highlights.push({
        field: 'title',
        fragments: titleHighlight.fragments.slice(0, maxFragments),
        originalText: document.title
      });
    }
    
    // 高亮内容
    const contentHighlight = this.highlightText(document.content, terms, tags, fragmentSize);
    if (contentHighlight.fragments.length > 0) {
      highlights.push({
        field: 'content',
        fragments: contentHighlight.fragments.slice(0, maxFragments),
        originalText: document.content
      });
    }
    
    return highlights;
  }

  /**
   * 高亮文本
   */
  private highlightText(
    text: string,
    terms: string[],
    tags: { pre: string; post: string },
    fragmentSize: number
  ): { fragments: string[] } {
    const fragments: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const term of terms) {
      let index = 0;
      while ((index = lowerText.indexOf(term, index)) !== -1) {
        const start = Math.max(0, index - fragmentSize / 2);
        const end = Math.min(text.length, index + term.length + fragmentSize / 2);
        
        let fragment = text.slice(start, end);
        
        // 高亮匹配的词项
        const regex = new RegExp(`(${term})`, 'gi');
        fragment = fragment.replace(regex, `${tags.pre}$1${tags.post}`);
        
        if (start > 0) fragment = '...' + fragment;
        if (end < text.length) fragment = fragment + '...';
        
        fragments.push(fragment);
        index += term.length;
      }
    }
    
    return { fragments };
  }

  /**
   * 获取匹配的字段
   */
  private getMatchedFields(document: SearchDocument, queryNode: SearchNode): string[] {
    // 简化实现
    return ['title', 'content'];
  }

  /**
   * 排序结果
   */
  private sortResults(results: SearchResult[], sortBy: string, sortOrder: 'asc' | 'desc'): void {
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'title':
          comparison = a.document.title.localeCompare(b.document.title);
          break;
        case 'createdAt':
          comparison = a.document.createdAt.getTime() - b.document.createdAt.getTime();
          break;
        case 'updatedAt':
          comparison = a.document.updatedAt.getTime() - b.document.updatedAt.getTime();
          break;
        default:
          comparison = a.score - b.score;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * 分词
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 0);
  }

  /**
   * 集合交集
   */
  private intersectSets(sets: Set<string>[]): Set<string> {
    if (sets.length === 0) return new Set();
    
    let result = new Set(sets[0]);
    for (let i = 1; i < sets.length; i++) {
      result = new Set([...result].filter(x => sets[i].has(x)));
    }
    
    return result;
  }

  /**
   * 集合并集
   */
  private unionSets(sets: Set<string>[]): Set<string> {
    const result = new Set<string>();
    for (const set of sets) {
      for (const item of set) {
        result.add(item);
      }
    }
    return result;
  }

  /**
   * 集合差集
   */
  private subtractSets(setA: Set<string>, setB: Set<string>): Set<string> {
    return new Set([...setA].filter(x => !setB.has(x)));
  }

  /**
   * 获取平均文档大小
   */
  private getAverageDocumentSize(): number {
    if (this.documents.size === 0) return 0;
    
    let totalSize = 0;
    for (const doc of this.documents.values()) {
      totalSize += doc.content.length;
    }
    
    return totalSize / this.documents.size;
  }

  /**
   * 获取索引大小
   */
  private getIndexSize(): number {
    let size = 0;
    for (const docIds of this.index.values()) {
      size += docIds.size;
    }
    return size;
  }
}

export default SearchEngine;
