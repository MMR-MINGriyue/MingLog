// API client for MingLog backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface Graph {
  id: string;
  name: string;
  description?: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  name: string;
  title: string;
  graphId: string;
  tags: string[];
  isJournal: boolean;
  journalDate?: string;
  properties: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  blocks?: Block[];
  _count?: {
    blocks: number;
  };
}

export interface Block {
  id: string;
  content: string;
  pageId: string;
  graphId: string;
  parentId?: string;
  order: number;
  collapsed: boolean;
  properties: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  children?: Block[];
  parent?: Block;
  page?: Page;
  _count?: {
    children: number;
  };
}

export interface SearchResult {
  query: string;
  pages: (Page & { type: 'page'; relevance: number })[];
  blocks: (Block & { type: 'block'; relevance: number })[];
  combined: Array<(Page | Block) & { type: 'page' | 'block'; relevance: number }>;
  total: number;
}

export interface SearchSuggestion {
  type: 'page' | 'tag';
  value: string;
  label: string;
}

export interface SearchStats {
  pages: number;
  blocks: number;
  tags: number;
  total: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Graph API methods
  async getGraphs(): Promise<ApiResponse<Graph[]>> {
    return this.request<Graph[]>('/graphs');
  }

  async getGraph(id: string): Promise<ApiResponse<Graph>> {
    return this.request<Graph>(`/graphs/${id}`);
  }

  async createGraph(data: Omit<Graph, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Graph>> {
    return this.request<Graph>('/graphs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGraph(id: string, data: Partial<Omit<Graph, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Graph>> {
    return this.request<Graph>(`/graphs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGraph(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/graphs/${id}`, {
      method: 'DELETE',
    });
  }

  async getGraphStats(id: string): Promise<ApiResponse<{ graphId: string; pageCount: number; blockCount: number; totalItems: number }>> {
    return this.request(`/graphs/${id}/stats`);
  }

  // Page API methods
  async getPages(params?: {
    graphId?: string;
    isJournal?: boolean;
    tag?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Page[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return this.request<Page[]>(`/pages${query ? `?${query}` : ''}`);
  }

  async getPage(id: string, includeBlocks = false): Promise<ApiResponse<Page>> {
    return this.request<Page>(`/pages/${id}?includeBlocks=${includeBlocks}`);
  }

  async createPage(data: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Page>> {
    return this.request<Page>('/pages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePage(id: string, data: Partial<Omit<Page, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Page>> {
    return this.request<Page>(`/pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePage(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/pages/${id}`, {
      method: 'DELETE',
    });
  }

  async createTodayJournal(graphId: string): Promise<ApiResponse<Page>> {
    return this.request<Page>('/pages/journal/today', {
      method: 'POST',
      body: JSON.stringify({ graphId }),
    });
  }

  // Block API methods
  async getBlocks(params?: {
    pageId?: string;
    graphId?: string;
    parentId?: string | null;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Block[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (value === null) {
            searchParams.append(key, 'null');
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }
    
    const query = searchParams.toString();
    return this.request<Block[]>(`/blocks${query ? `?${query}` : ''}`);
  }

  async getBlock(id: string, includeChildren = false): Promise<ApiResponse<Block>> {
    return this.request<Block>(`/blocks/${id}?includeChildren=${includeChildren}`);
  }

  async createBlock(data: Omit<Block, 'id' | 'createdAt' | 'updatedAt' | 'collapsed'>): Promise<ApiResponse<Block>> {
    return this.request<Block>('/blocks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBlock(id: string, data: Partial<Omit<Block, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Block>> {
    return this.request<Block>(`/blocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBlock(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/blocks/${id}`, {
      method: 'DELETE',
    });
  }

  async moveBlock(id: string, data: { parentId?: string; order: number; pageId?: string }): Promise<ApiResponse<Block>> {
    return this.request<Block>(`/blocks/${id}/move`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleBlockCollapse(id: string): Promise<ApiResponse<Block>> {
    return this.request<Block>(`/blocks/${id}/toggle-collapse`, {
      method: 'POST',
    });
  }

  // Search API methods
  async search(params: {
    query: string;
    graphId?: string;
    type?: 'all' | 'pages' | 'blocks';
    limit?: number;
  }): Promise<ApiResponse<SearchResult>> {
    return this.request<SearchResult>('/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getSearchSuggestions(query: string, graphId?: string, limit = 10): Promise<ApiResponse<SearchSuggestion[]>> {
    const searchParams = new URLSearchParams({ q: query, limit: limit.toString() });
    if (graphId) {
      searchParams.append('graphId', graphId);
    }
    
    return this.request<SearchSuggestion[]>(`/search/suggestions?${searchParams.toString()}`);
  }

  async getSearchStats(graphId?: string): Promise<ApiResponse<SearchStats>> {
    const searchParams = graphId ? `?graphId=${graphId}` : '';
    return this.request<SearchStats>(`/search/stats${searchParams}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
