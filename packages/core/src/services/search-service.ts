import { EventEmitter } from '../utils/event-emitter';
import type { Page, Block } from '../types';

// Define search types locally to avoid circular dependencies
export interface SearchResult {
  id: string;
  type: 'page' | 'block';
  title: string;
  content: string;
  excerpt: string;
  score: number;
  matches: SearchMatch[];
  metadata: {
    pageId?: string;
    pageName?: string;
    blockId?: string;
    tags?: string[];
    isJournal?: boolean;
    createdAt: number;
    updatedAt: number;
  };
}

export interface SearchMatch {
  field: string;
  value: string;
  indices: [number, number][];
}

export interface SearchOptions {
  includePages?: boolean;
  includeBlocks?: boolean;
  includeContent?: boolean;
  includeTags?: boolean;
  fuzzy?: boolean;
  threshold?: number;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'title';
  filters?: {
    tags?: string[];
    isJournal?: boolean;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

export class SearchService extends EventEmitter {
  private pages: Page[] = [];
  private blocks: Block[] = [];
  private isInitialized = false;

  constructor() {
    super();
  }

  async initialize(pages: Page[], blocks: Block[]): Promise<void> {
    this.pages = pages;
    this.blocks = blocks;
    this.isInitialized = true;
    console.log('SearchService initialized with', pages.length, 'pages and', blocks.length, 'blocks');
  }

  // Update the search index with new data
  updateIndex(pages: Page[], blocks: Block[]): void {
    this.pages = pages;
    this.blocks = blocks;
    this.emit('index:updated', { pages: pages.length, blocks: blocks.length });
  }

  // Add or update a single page
  updatePage(page: Page): void {
    const existingIndex = this.pages.findIndex(p => p.id === page.id);
    if (existingIndex >= 0) {
      this.pages[existingIndex] = page;
    } else {
      this.pages.push(page);
    }
    this.emit('page:indexed', page);
  }

  // Add or update a single block
  updateBlock(block: Block): void {
    const existingIndex = this.blocks.findIndex(b => b.id === block.id);
    if (existingIndex >= 0) {
      this.blocks[existingIndex] = block;
    } else {
      this.blocks.push(block);
    }
    this.emit('block:indexed', block);
  }

  // Remove a page
  removePage(pageId: string): void {
    this.pages = this.pages.filter(p => p.id !== pageId);
    this.blocks = this.blocks.filter(b => b.pageId !== pageId);
    this.emit('page:removed', { pageId });
  }

  // Remove a block
  removeBlock(blockId: string): void {
    this.blocks = this.blocks.filter(b => b.id !== blockId);
    this.emit('block:removed', { blockId });
  }

  // Main search method - simple implementation for now
  search(query: string, options: SearchOptions = {}): SearchResult[] {
    if (!this.isInitialized || !query.trim()) {
      return [];
    }

    const {
      includePages = true,
      includeBlocks = true,
      limit = 50,
      sortBy = 'relevance',
      filters = {},
    } = options;

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search pages
    if (includePages) {
      this.pages.forEach(page => {
        const score = this.calculatePageScore(page, lowerQuery);
        if (score > 0) {
          results.push({
            id: page.id,
            type: 'page',
            title: page.title || page.name,
            content: page.name,
            excerpt: this.generateExcerpt(page.name, lowerQuery),
            score,
            matches: this.findMatches(page, lowerQuery),
            metadata: {
              tags: page.tags,
              isJournal: page.isJournal,
              createdAt: page.createdAt,
              updatedAt: page.updatedAt,
            },
          });
        }
      });
    }

    // Search blocks
    if (includeBlocks) {
      this.blocks.forEach(block => {
        const score = this.calculateBlockScore(block, lowerQuery);
        if (score > 0) {
          const page = this.pages.find(p => p.id === block.pageId);
          results.push({
            id: block.id,
            type: 'block',
            title: this.extractBlockTitle(block.content),
            content: this.stripHtml(block.content),
            excerpt: this.generateExcerpt(block.content, lowerQuery),
            score,
            matches: this.findBlockMatches(block, lowerQuery),
            metadata: {
              pageId: block.pageId,
              pageName: page?.name,
              blockId: block.id,
              tags: block.refs,
              isJournal: page?.isJournal,
              createdAt: block.createdAt,
              updatedAt: block.updatedAt,
            },
          });
        }
      });
    }

    // Apply filters
    let filteredResults = this.applyFilters(results, filters);

    // Sort results
    filteredResults = this.sortResults(filteredResults, sortBy);

    // Apply limit
    return filteredResults.slice(0, limit);
  }

  // Quick search for autocomplete
  quickSearch(query: string, limit: number = 10): SearchResult[] {
    return this.search(query, {
      includePages: true,
      includeBlocks: false,
      limit,
    });
  }

  // Search within a specific page
  searchInPage(pageId: string, query: string, limit: number = 20): SearchResult[] {
    const pageBlocks = this.blocks.filter(b => b.pageId === pageId);
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    pageBlocks.forEach(block => {
      const score = this.calculateBlockScore(block, lowerQuery);
      if (score > 0) {
        const page = this.pages.find(p => p.id === block.pageId);
        results.push({
          id: block.id,
          type: 'block',
          title: this.extractBlockTitle(block.content),
          content: this.stripHtml(block.content),
          excerpt: this.generateExcerpt(block.content, lowerQuery),
          score,
          matches: this.findBlockMatches(block, lowerQuery),
          metadata: {
            pageId: block.pageId,
            pageName: page?.name,
            blockId: block.id,
            tags: block.refs,
            isJournal: page?.isJournal,
            createdAt: block.createdAt,
            updatedAt: block.updatedAt,
          },
        });
      }
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Get search suggestions
  getSuggestions(query: string, limit: number = 5): string[] {
    const lowerQuery = query.toLowerCase();
    const suggestions = new Set<string>();

    // Get suggestions from page names and tags
    this.pages.forEach(page => {
      if (page.name.toLowerCase().includes(lowerQuery)) {
        suggestions.add(page.name);
      }
      page.tags.forEach(tag => {
        if (tag.toLowerCase().includes(lowerQuery)) {
          suggestions.add(tag);
        }
      });
    });

    // Get suggestions from block content
    this.blocks.forEach(block => {
      const words = this.stripHtml(block.content).toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 2 && word.includes(lowerQuery)) {
          suggestions.add(word);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  private calculatePageScore(page: Page, query: string): number {
    let score = 0;
    const name = page.name.toLowerCase();
    const title = (page.title || '').toLowerCase();

    // Exact match gets highest score
    if (name === query || title === query) {
      score += 100;
    }
    // Starts with query gets high score
    else if (name.startsWith(query) || title.startsWith(query)) {
      score += 80;
    }
    // Contains query gets medium score
    else if (name.includes(query) || title.includes(query)) {
      score += 60;
    }

    // Tag matches
    page.tags.forEach(tag => {
      if (tag.toLowerCase().includes(query)) {
        score += 40;
      }
    });

    return score;
  }

  private calculateBlockScore(block: Block, query: string): number {
    let score = 0;
    const content = this.stripHtml(block.content).toLowerCase();

    // Content contains query
    if (content.includes(query)) {
      score += 50;
      // Boost score if query appears multiple times
      const matches = content.split(query).length - 1;
      score += matches * 10;
    }

    // Reference matches
    block.refs.forEach(ref => {
      if (ref.toLowerCase().includes(query)) {
        score += 30;
      }
    });

    return score;
  }

  private findMatches(page: Page, query: string): SearchMatch[] {
    const matches: SearchMatch[] = [];
    
    if (page.name.toLowerCase().includes(query)) {
      matches.push({
        field: 'name',
        value: page.name,
        indices: this.findIndices(page.name.toLowerCase(), query),
      });
    }

    if (page.title && page.title.toLowerCase().includes(query)) {
      matches.push({
        field: 'title',
        value: page.title,
        indices: this.findIndices(page.title.toLowerCase(), query),
      });
    }

    return matches;
  }

  private findBlockMatches(block: Block, query: string): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const content = this.stripHtml(block.content);
    
    if (content.toLowerCase().includes(query)) {
      matches.push({
        field: 'content',
        value: content,
        indices: this.findIndices(content.toLowerCase(), query),
      });
    }

    return matches;
  }

  private findIndices(text: string, query: string): [number, number][] {
    const indices: [number, number][] = [];
    let index = text.indexOf(query);
    
    while (index !== -1) {
      indices.push([index, index + query.length - 1]);
      index = text.indexOf(query, index + 1);
    }
    
    return indices;
  }

  private applyFilters(results: SearchResult[], filters: any): SearchResult[] {
    return results.filter(result => {
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag: string) => 
          result.metadata.tags?.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      if (filters.isJournal !== undefined) {
        if (result.metadata.isJournal !== filters.isJournal) return false;
      }

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

  private generateExcerpt(content: string, query: string, maxLength: number = 150): string {
    const text = this.stripHtml(content);
    const lowerText = text.toLowerCase();
    const queryIndex = lowerText.indexOf(query);
    
    if (queryIndex === -1) {
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(text.length, start + maxLength);
    
    let excerpt = text.substring(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < text.length) excerpt = excerpt + '...';
    
    return excerpt;
  }

  private extractBlockTitle(content: string): string {
    const text = this.stripHtml(content);
    const firstLine = text.split('\n')[0];
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  // Get search statistics
  getStats(): { pages: number; blocks: number; isInitialized: boolean } {
    return {
      pages: this.pages.length,
      blocks: this.blocks.length,
      isInitialized: this.isInitialized,
    };
  }

  // Clear the search index
  clearIndex(): void {
    this.pages = [];
    this.blocks = [];
    this.isInitialized = false;
    this.emit('index:cleared', null);
  }
}
