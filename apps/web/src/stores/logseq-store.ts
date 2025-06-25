import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { LogseqCore, Block, Page, Graph } from '@minglog/core';

interface LogseqState {
  // Core instance
  core: LogseqCore;
  
  // Current state
  currentGraph: Graph | null;
  currentPage: Page | null;
  
  // UI state
  sidebarOpen: boolean;
  searchOpen: boolean;
  searchQuery: string;
  
  // Actions
  setCurrentGraph: (graph: Graph) => void;
  setCurrentPage: (page: Page | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
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
    const core = new LogseqCore();
    
    return {
      // Initial state
      core,
      currentGraph: null,
      currentPage: null,
      sidebarOpen: true,
      searchOpen: false,
      searchQuery: '',
      
      // UI actions
      setCurrentGraph: (graph) => set({ currentGraph: graph }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Core actions
      createBlock: async (content, pageId, parentId) => {
        const block = await core.blocks.createBlock(content, pageId, parentId);
        return block;
      },
      
      updateBlock: async (id, content) => {
        const block = await core.blocks.updateBlock(id, content);
        return block;
      },
      
      deleteBlock: async (id) => {
        await core.blocks.deleteBlock(id);
      },
      
      createPage: async (name, isJournal = false) => {
        const page = await core.pages.createPage(name, isJournal);
        return page;
      },
      
      updatePage: async (id, updates) => {
        const page = await core.pages.updatePage(id, updates);
        return page;
      },
      
      deletePage: async (id) => {
        await core.pages.deletePage(id);
      },
    };
  })
);
