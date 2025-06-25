import Fuse from 'fuse.js';
import type { Page, Block } from '@minglog/core';
import type { 
  SearchResult, 
  SearchOptions, 
  SearchIndex, 
  SearchableItem,
  SearchMatch 
} from './types';

export class SearchEngine {
  private pageIndex: Fuse<SearchableItem> | null = null;
  private blockIndex: Fuse<SearchableItem> | null = null;
  private searchIndex: SearchIndex = {
    pages: [],
    blocks: [],
    lastUpdated: 0,
  };

  private readonly fuseOptions = {
    includeScore: true,
    includeMatches: true,
    threshold: 0.3,
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'content', weight: 0.3 },
      { name: 'tags', weight: 0.2 },
      { name: 'pageName', weight: 0.1 },
    ],
  };

  constructor() {
    this.initializeIndexes();
  }

  private initializeIndexes(): void {
    this.pageIndex = new Fuse(this.searchIndex.pages, this.fuseOptions);
    this.blockIndex = new Fuse(this.searchIndex.blocks, this.fuseOptions);
  }

  // Update the search index with new data
  updateIndex(pages: Page[], blocks: Block[]): void {
    this.searchIndex.pages = pages.map(page => this.pageToSearchableItem(page));
    this.searchIndex.blocks = blocks.map(block => this.blockToSearchableItem(block, pages));
    this.searchIndex.lastUpdated = Date.now();

    // Recreate Fuse indexes
    this.pageIndex = new Fuse(this.searchIndex.pages, this.fuseOptions);
    this.blockIndex = new Fuse(this.searchIndex.blocks, this.fuseOptions);
  }

  // Add or update a single page in the index
  updatePage(page: Page): void {
    const searchableItem = this.pageToSearchableItem(page);
    const existingIndex = this.searchIndex.pages.findIndex(p => p.id === page.id);
    
    if (existingIndex >= 0) {
      this.searchIndex.pages[existingIndex] = searchableItem;
    } else {
      this.searchIndex.pages.push(searchableItem);
    }

    this.pageIndex = new Fuse(this.searchIndex.pages, this.fuseOptions);
  }

  // Add or update a single block in the index
  updateBlock(block: Block, pages: Page[]): void {
    const searchableItem = this.blockToSearchableItem(block, pages);
    const existingIndex = this.searchIndex.blocks.findIndex(b => b.id === block.id);
    
    if (existingIndex >= 0) {
      this.searchIndex.blocks[existingIndex] = searchableItem;
    } else {
      this.searchIndex.blocks.push(searchableItem);
    }

    this.blockIndex = new Fuse(this.searchIndex.blocks, this.fuseOptions);
  }

  // Remove a page from the index
  removePage(pageId: string): void {
    this.searchIndex.pages = this.searchIndex.pages.filter(p => p.id !== pageId);
    this.searchIndex.blocks = this.searchIndex.blocks.filter(b => b.pageId !== pageId);
    
    this.pageIndex = new Fuse(this.searchIndex.pages, this.fuseOptions);
    this.blockIndex = new Fuse(this.searchIndex.blocks, this.fuseOptions);
  }

  // Remove a block from the index
  removeBlock(blockId: string): void {
    this.searchIndex.blocks = this.searchIndex.blocks.filter(b => b.id !== blockId);
    this.blockIndex = new Fuse(this.searchIndex.blocks, this.fuseOptions);
  }

  // Main search method
  search(query: string, options: SearchOptions = {}): SearchResult[] {
    const {
      includePages = true,
      includeBlocks = true,
      threshold = 0.3,
      limit = 50,
      sortBy = 'relevance',
      filters = {},
    } = options;

    if (!query.trim()) {
      return [];
    }

    const results: SearchResult[] = [];

    // Search pages
    if (includePages && this.pageIndex) {
      const pageResults = this.pageIndex.search(query, { limit });
      results.push(...pageResults.map(result => this.fuseResultToSearchResult(result)));
    }

    // Search blocks
    if (includeBlocks && this.blockIndex) {
      const blockResults = this.blockIndex.search(query, { limit });
      results.push(...blockResults.map(result => this.fuseResultToSearchResult(result)));
    }

    // Apply filters
    let filteredResults = this.applyFilters(results, filters);

    // Sort results
    filteredResults = this.sortResults(filteredResults, sortBy);

    // Apply limit
    return filteredResults.slice(0, limit);
  }

  // Quick search for autocomplete/suggestions
  quickSearch(query: string, limit: number = 10): SearchResult[] {
    return this.search(query, {
      includePages: true,
      includeBlocks: false,
      limit,
      threshold: 0.2,
    });
  }

  // Search within a specific page
  searchInPage(pageId: string, query: string, limit: number = 20): SearchResult[] {
    if (!this.blockIndex) return [];

    const pageBlocks = this.searchIndex.blocks.filter(b => b.pageId === pageId);
    const pageBlockIndex = new Fuse(pageBlocks, this.fuseOptions);
    
    const results = pageBlockIndex.search(query, { limit });
    return results.map(result => this.fuseResultToSearchResult(result));
  }

  // Get search suggestions based on existing content
  getSuggestions(query: string, limit: number = 5): string[] {
    const results = this.quickSearch(query, limit * 2);
    const suggestions = new Set<string>();

    results.forEach(result => {
      // Extract words from titles and content
      const words = [
        ...result.title.toLowerCase().split(/\s+/),
        ...result.content.toLowerCase().split(/\s+/),
        ...result.metadata.tags || [],
      ];

      words.forEach(word => {
        if (word.length > 2 && word.includes(query.toLowerCase())) {
          suggestions.add(word);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  private pageToSearchableItem(page: Page): SearchableItem {
    return {
      id: page.id,
      type: 'page',
      title: page.title || page.name,
      content: page.name,
      tags: page.tags,
      isJournal: page.isJournal,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }

  private blockToSearchableItem(block: Block, pages: Page[]): SearchableItem {
    const page = pages.find(p => p.id === block.pageId);
    
    return {
      id: block.id,
      type: 'block',
      title: this.extractBlockTitle(block.content),
      content: this.stripHtml(block.content),
      tags: block.refs,
      pageId: block.pageId,
      pageName: page?.name || '',
      isJournal: page?.isJournal || false,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
    };
  }

  private fuseResultToSearchResult(fuseResult: any): SearchResult {
    const item = fuseResult.item as SearchableItem;
    const score = 1 - (fuseResult.score || 0);
    
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      content: item.content,
      excerpt: this.generateExcerpt(item.content, fuseResult.matches),
      score,
      matches: this.convertFuseMatches(fuseResult.matches || []),
      metadata: {
        pageId: item.pageId,
        pageName: item.pageName,
        blockId: item.type === 'block' ? item.id : undefined,
        tags: item.tags,
        isJournal: item.isJournal,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    };
  }

  private applyFilters(results: SearchResult[], filters: any): SearchResult[] {
    return results.filter(result => {
      // Tag filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag: string) => 
          result.metadata.tags?.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // Journal filter
      if (filters.isJournal !== undefined) {
        if (result.metadata.isJournal !== filters.isJournal) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const resultDate = new Date(result.metadata.updatedAt);
        if (resultDate < filters.dateRange.start || resultDate > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }

  private sortResults(results: SearchResult[], sortBy: string): SearchResult[] {
    switch (sortBy) {
      case 'date':
        return results.sort((a, b) => b.metadata.updatedAt - a.metadata.updatedAt);
      case 'title':
        return results.sort((a, b) => a.title.localeCompare(b.title));
      case 'relevance':
      default:
        return results.sort((a, b) => b.score - a.score);
    }
  }

  private convertFuseMatches(fuseMatches: any[]): SearchMatch[] {
    return fuseMatches.map(match => ({
      field: match.key,
      value: match.value,
      indices: match.indices,
    }));
  }

  private generateExcerpt(content: string, matches: any[], maxLength: number = 150): string {
    if (!matches || matches.length === 0) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    // Find the first match and create an excerpt around it
    const firstMatch = matches[0];
    if (firstMatch && firstMatch.indices && firstMatch.indices.length > 0) {
      const matchStart = firstMatch.indices[0][0];
      const excerptStart = Math.max(0, matchStart - 50);
      const excerptEnd = Math.min(content.length, excerptStart + maxLength);
      
      let excerpt = content.substring(excerptStart, excerptEnd);
      if (excerptStart > 0) excerpt = '...' + excerpt;
      if (excerptEnd < content.length) excerpt = excerpt + '...';
      
      return excerpt;
    }

    return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
  }

  private extractBlockTitle(content: string): string {
    // Remove HTML tags and get first line or first 50 characters
    const text = this.stripHtml(content);
    const firstLine = text.split('\n')[0];
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  // Clear the entire index
  clearIndex(): void {
    this.searchIndex = {
      pages: [],
      blocks: [],
      lastUpdated: Date.now(),
    };
    this.initializeIndexes();
  }

  // Get index statistics
  getStats(): { pages: number; blocks: number; lastUpdated: Date } {
    return {
      pages: this.searchIndex.pages.length,
      blocks: this.searchIndex.blocks.length,
      lastUpdated: new Date(this.searchIndex.lastUpdated),
    };
  }
}
