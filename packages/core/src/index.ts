// Types
export * from './types';

// Services
export { BlockService } from './services/block-service';
export { PageService } from './services/page-service';
export { GraphService } from './services/graph-service';
export { SearchService } from './services/search-service';
export type { SearchResult, SearchOptions } from './services/search-service';

// Utils
export { EventEmitter } from './utils/event-emitter';

// Core class that orchestrates all services
import { BlockService } from './services/block-service';
import { PageService } from './services/page-service';
import { GraphService } from './services/graph-service';
import { SearchService } from './services/search-service';
import { EventEmitter } from './utils/event-emitter';
import type { Graph, LogseqEvent } from './types';

export class MingLogCore extends EventEmitter {
  public readonly blocks: BlockService;
  public readonly pages: PageService;
  public readonly graphs: GraphService;
  public readonly search: SearchService;

  private isInitialized = false;

  constructor() {
    super();

    this.graphs = new GraphService();
    this.blocks = new BlockService();
    this.pages = new PageService();
    this.search = new SearchService();

    // Forward events from services
    this.blocks.on('*', (event: LogseqEvent) => this.emit(event.type, event.payload));
    this.pages.on('*', (event: LogseqEvent) => this.emit(event.type, event.payload));
    this.graphs.on('*', (event: any) => this.emit(event.type, event.payload));
    this.search.on('*', (event: any) => this.emit(event.type, event.payload));
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize graph first
      const currentGraph = await this.graphs.initialize();

      // Set current graph for other services
      await this.blocks.setCurrentGraph(currentGraph.id);
      await this.pages.setCurrentGraph(currentGraph.id);

      // Initialize search with current data
      const allPages = await this.pages.getAllPages();
      const allBlocks = await this.blocks.getAllBlocks();
      await this.search.initialize(allPages, allBlocks);

      this.isInitialized = true;
      console.log('MingLogCore initialized successfully');
      this.emit('core:initialized', currentGraph);
    } catch (error) {
      console.error('Failed to initialize MingLogCore:', error);
      throw error;
    }
  }

  getCurrentGraph() {
    return this.graphs.getCurrentGraph();
  }

  async switchGraph(graphId: string): Promise<void> {
    const graph = await this.graphs.switchToGraph(graphId);
    await this.blocks.setCurrentGraph(graphId);
    await this.pages.setCurrentGraph(graphId);
    this.emit('graph:switched', graph);
  }

  async createQuickNote(content: string): Promise<void> {
    await this.initialize();

    // Create today's journal page if it doesn't exist
    const todayPage = await this.pages.createTodayJournal();

    // Create a new block in today's journal
    await this.blocks.createBlock(content, todayPage.id);
  }

  async searchAll(query: string): Promise<{
    pages: Awaited<ReturnType<PageService['searchPages']>>;
    // blocks: SearchResult[]; // Will be implemented with search service
  }> {
    await this.initialize();

    const pages = await this.pages.searchPages(query);

    return {
      pages,
      // blocks: [], // TODO: Implement with search service
    };
  }
}

// Export legacy name for compatibility
export const LogseqCore = MingLogCore;
