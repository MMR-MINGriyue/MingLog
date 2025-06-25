import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { apiClient, Graph, Page, Block } from '../services/api.js';

interface ApiState {
  // Current state
  currentGraph: Graph | null;
  currentPage: Page | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Data cache
  graphs: Graph[];
  pages: Page[];
  blocks: Block[];

  // UI state
  sidebarOpen: boolean;
  searchModalOpen: boolean;
  searchQuery: string;

  // Actions
  initialize: () => Promise<void>;
  setCurrentGraph: (graph: Graph) => void;
  setCurrentPage: (page: Page | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchModalOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setError: (error: string | null) => void;

  // Graph actions
  loadGraphs: () => Promise<void>;
  createGraph: (name: string, description?: string) => Promise<Graph>;
  updateGraph: (id: string, updates: Partial<Graph>) => Promise<Graph>;
  deleteGraph: (id: string) => Promise<void>;

  // Page actions
  loadPages: (graphId?: string) => Promise<void>;
  createPage: (name: string, graphId: string, isJournal?: boolean) => Promise<Page>;
  updatePage: (id: string, updates: Partial<Page>) => Promise<Page>;
  deletePage: (id: string) => Promise<void>;
  createTodayJournal: (graphId: string) => Promise<Page>;

  // Block actions
  loadBlocks: (pageId: string) => Promise<void>;
  createBlock: (content: string, pageId: string, graphId: string, parentId?: string) => Promise<Block>;
  updateBlock: (id: string, updates: Partial<Block>) => Promise<Block>;
  deleteBlock: (id: string) => Promise<void>;
  moveBlock: (id: string, parentId: string | undefined, order: number, pageId?: string) => Promise<Block>;
  toggleBlockCollapse: (id: string) => Promise<Block>;

  // Search actions
  search: (query: string, graphId?: string, type?: 'all' | 'pages' | 'blocks') => Promise<any>;
  getSearchSuggestions: (query: string, graphId?: string) => Promise<any>;
}

export const useApiStore = create<ApiState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentGraph: null,
    currentPage: null,
    isInitialized: false,
    isLoading: false,
    error: null,
    graphs: [],
    pages: [],
    blocks: [],
    sidebarOpen: true,
    searchModalOpen: false,
    searchQuery: '',

    // Initialize
    initialize: async () => {
      const state = get();
      if (state.isInitialized) return;

      set({ isLoading: true, error: null });

      try {
        // Load graphs
        const graphsResponse = await apiClient.getGraphs();
        if (!graphsResponse.success) {
          throw new Error(graphsResponse.error?.message || 'Failed to load graphs');
        }

        const graphs = graphsResponse.data || [];
        let currentGraph = graphs[0] || null;

        // Create default graph if none exists
        if (!currentGraph) {
          const createResponse = await apiClient.createGraph({
            name: 'Default Graph',
            description: 'Default knowledge graph',
            settings: {}
          });
          
          if (createResponse.success && createResponse.data) {
            currentGraph = createResponse.data;
            graphs.push(currentGraph);
          }
        }

        set({
          isInitialized: true,
          isLoading: false,
          graphs,
          currentGraph
        });

        // Load pages for current graph
        if (currentGraph) {
          await get().loadPages(currentGraph.id);
        }

        console.log('API Store initialized successfully');
      } catch (error) {
        console.error('Failed to initialize API store:', error);
        set({ 
          isInitialized: true, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Initialization failed'
        });
      }
    },

    // UI actions
    setCurrentGraph: (graph) => {
      set({ currentGraph: graph });
      // Load pages for the new graph
      if (graph) {
        get().loadPages(graph.id);
      }
    },
    setCurrentPage: (page) => {
      set({ currentPage: page });
      // Load blocks for the new page
      if (page) {
        get().loadBlocks(page.id);
      }
    },
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setSearchModalOpen: (open) => set({ searchModalOpen: open }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setError: (error) => set({ error }),

    // Graph actions
    loadGraphs: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.getGraphs();
        if (response.success && response.data) {
          set({ graphs: response.data, isLoading: false });
        } else {
          throw new Error(response.error?.message || 'Failed to load graphs');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to load graphs'
        });
        throw error;
      }
    },

    createGraph: async (name, description) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.createGraph({ name, description, settings: {} });
        if (response.success && response.data) {
          const newGraph = response.data;
          set(state => ({ 
            graphs: [...state.graphs, newGraph],
            isLoading: false
          }));
          return newGraph;
        } else {
          throw new Error(response.error?.message || 'Failed to create graph');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to create graph'
        });
        throw error;
      }
    },

    updateGraph: async (id, updates) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.updateGraph(id, updates);
        if (response.success && response.data) {
          const updatedGraph = response.data;
          set(state => ({
            graphs: state.graphs.map(g => g.id === id ? updatedGraph : g),
            currentGraph: state.currentGraph?.id === id ? updatedGraph : state.currentGraph,
            isLoading: false
          }));
          return updatedGraph;
        } else {
          throw new Error(response.error?.message || 'Failed to update graph');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to update graph'
        });
        throw error;
      }
    },

    deleteGraph: async (id) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.deleteGraph(id);
        if (response.success) {
          set(state => ({
            graphs: state.graphs.filter(g => g.id !== id),
            currentGraph: state.currentGraph?.id === id ? null : state.currentGraph,
            isLoading: false
          }));
        } else {
          throw new Error(response.error?.message || 'Failed to delete graph');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to delete graph'
        });
        throw error;
      }
    },

    // Page actions
    loadPages: async (graphId) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.getPages({ graphId });
        if (response.success && response.data) {
          set({ pages: response.data, isLoading: false });
        } else {
          throw new Error(response.error?.message || 'Failed to load pages');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to load pages'
        });
        throw error;
      }
    },

    createPage: async (name, graphId, isJournal = false) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.createPage({
          name,
          title: name,
          graphId,
          isJournal,
          tags: [],
          properties: {}
        });
        
        if (response.success && response.data) {
          const newPage = response.data;
          set(state => ({ 
            pages: [...state.pages, newPage],
            isLoading: false
          }));
          return newPage;
        } else {
          throw new Error(response.error?.message || 'Failed to create page');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to create page'
        });
        throw error;
      }
    },

    updatePage: async (id, updates) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.updatePage(id, updates);
        if (response.success && response.data) {
          const updatedPage = response.data;
          set(state => ({
            pages: state.pages.map(p => p.id === id ? updatedPage : p),
            currentPage: state.currentPage?.id === id ? updatedPage : state.currentPage,
            isLoading: false
          }));
          return updatedPage;
        } else {
          throw new Error(response.error?.message || 'Failed to update page');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to update page'
        });
        throw error;
      }
    },

    deletePage: async (id) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.deletePage(id);
        if (response.success) {
          set(state => ({
            pages: state.pages.filter(p => p.id !== id),
            currentPage: state.currentPage?.id === id ? null : state.currentPage,
            isLoading: false
          }));
        } else {
          throw new Error(response.error?.message || 'Failed to delete page');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to delete page'
        });
        throw error;
      }
    },

    createTodayJournal: async (graphId) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.createTodayJournal(graphId);
        if (response.success && response.data) {
          const journalPage = response.data;
          set(state => {
            const existingIndex = state.pages.findIndex(p => p.id === journalPage.id);
            const newPages = existingIndex >= 0 
              ? state.pages.map(p => p.id === journalPage.id ? journalPage : p)
              : [...state.pages, journalPage];
            
            return {
              pages: newPages,
              isLoading: false
            };
          });
          return journalPage;
        } else {
          throw new Error(response.error?.message || 'Failed to create today journal');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to create today journal'
        });
        throw error;
      }
    },

    // Block actions
    loadBlocks: async (pageId) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.getBlocks({ pageId });
        if (response.success && response.data) {
          set({ blocks: response.data, isLoading: false });
        } else {
          throw new Error(response.error?.message || 'Failed to load blocks');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to load blocks'
        });
        throw error;
      }
    },

    createBlock: async (content, pageId, graphId, parentId) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.createBlock({
          content,
          pageId,
          graphId,
          parentId,
          order: 0, // Will be calculated by backend
          properties: {}
        });
        
        if (response.success && response.data) {
          const newBlock = response.data;
          set(state => ({ 
            blocks: [...state.blocks, newBlock],
            isLoading: false
          }));
          return newBlock;
        } else {
          throw new Error(response.error?.message || 'Failed to create block');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to create block'
        });
        throw error;
      }
    },

    updateBlock: async (id, updates) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.updateBlock(id, updates);
        if (response.success && response.data) {
          const updatedBlock = response.data;
          set(state => ({
            blocks: state.blocks.map(b => b.id === id ? updatedBlock : b),
            isLoading: false
          }));
          return updatedBlock;
        } else {
          throw new Error(response.error?.message || 'Failed to update block');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to update block'
        });
        throw error;
      }
    },

    deleteBlock: async (id) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.deleteBlock(id);
        if (response.success) {
          set(state => ({
            blocks: state.blocks.filter(b => b.id !== id),
            isLoading: false
          }));
        } else {
          throw new Error(response.error?.message || 'Failed to delete block');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to delete block'
        });
        throw error;
      }
    },

    moveBlock: async (id, parentId, order, pageId) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.moveBlock(id, { parentId, order, pageId });
        if (response.success && response.data) {
          const movedBlock = response.data;
          set(state => ({
            blocks: state.blocks.map(b => b.id === id ? movedBlock : b),
            isLoading: false
          }));
          return movedBlock;
        } else {
          throw new Error(response.error?.message || 'Failed to move block');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to move block'
        });
        throw error;
      }
    },

    toggleBlockCollapse: async (id) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.toggleBlockCollapse(id);
        if (response.success && response.data) {
          const toggledBlock = response.data;
          set(state => ({
            blocks: state.blocks.map(b => b.id === id ? toggledBlock : b),
            isLoading: false
          }));
          return toggledBlock;
        } else {
          throw new Error(response.error?.message || 'Failed to toggle block collapse');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to toggle block collapse'
        });
        throw error;
      }
    },

    // Search actions
    search: async (query, graphId, type = 'all') => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.search({ query, graphId, type });
        set({ isLoading: false });
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.error?.message || 'Search failed');
        }
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Search failed'
        });
        throw error;
      }
    },

    getSearchSuggestions: async (query, graphId) => {
      try {
        const response = await apiClient.getSearchSuggestions(query, graphId);
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.error?.message || 'Failed to get suggestions');
        }
      } catch (error) {
        console.error('Failed to get search suggestions:', error);
        return [];
      }
    },
  }))
);
