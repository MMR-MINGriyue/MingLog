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

export interface SearchIndex {
  pages: SearchableItem[];
  blocks: SearchableItem[];
  lastUpdated: number;
}

export interface SearchableItem {
  id: string;
  type: 'page' | 'block';
  title: string;
  content: string;
  tags: string[];
  pageId?: string;
  pageName?: string;
  isJournal?: boolean;
  createdAt: number;
  updatedAt: number;
}
