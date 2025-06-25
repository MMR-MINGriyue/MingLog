import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { MingLogCore, Block, Page } from '@minglog/core';
import type { Graph } from '@minglog/core/src/services/graph-service';

interface LogseqState {
  // Core instance
  core: MingLogCore;

  // Current state
  currentGraph: Graph | null;
  currentPage: Page | null;
  isInitialized: boolean;

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

  // Core actions
  createBlock: (content: string, pageId: string, parentId?: string) => Promise<Block>;
  updateBlock: (id: string, content: string) => Promise<Block>;
  deleteBlock: (id: string) => Promise<void>;
  createPage: (name: string, isJournal?: boolean) => Promise<Page>;
  updatePage: (id: string, updates: Partial<Page>) => Promise<Page>;
  deletePage: (id: string) => Promise<void>;
}

export const useLogseqStore = create<LogseqState>()(
  subscribeWithSelector((set, get) => {
    const core = new MingLogCore();

    return {
      // Initial state
      core,
      currentGraph: null,
      currentPage: null,
      isInitialized: false,
      sidebarOpen: true,
      searchModalOpen: false,
      searchQuery: '',

      // Initialize core
      initialize: async () => {
        const state = get();
        if (state.isInitialized) return;

        try {
          await core.initialize();
          const currentGraph = core.getCurrentGraph();
          set({
            isInitialized: true,
            currentGraph
          });
          console.log('Store initialized successfully');
        } catch (error) {
          console.error('Failed to initialize store:', error);
          // Set as initialized even if failed to prevent infinite retries
          set({ isInitialized: true });
        }
      },

      // UI actions
      setCurrentGraph: (graph) => set({ currentGraph: graph }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSearchModalOpen: (open) => set({ searchModalOpen: open }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Core actions
      createBlock: async (content, pageId, parentId) => {
        await get().initialize();
        const block = await core.blocks.createBlock(content, pageId, parentId);
        return block;
      },

      updateBlock: async (id, content) => {
        await get().initialize();
        const block = await core.blocks.updateBlock(id, content);
        return block;
      },

      deleteBlock: async (id) => {
        await get().initialize();
        await core.blocks.deleteBlock(id);
      },

      createPage: async (name, isJournal = false) => {
        await get().initialize();
        const page = await core.pages.createPage(name, isJournal);
        return page;
      },

      updatePage: async (id, updates) => {
        await get().initialize();
        const page = await core.pages.updatePage(id, updates);
        return page;
      },

      deletePage: async (id) => {
        await get().initialize();
        await core.pages.deletePage(id);
      },
    };
  })
);
