// Types
export * from './types';

// Services
export { BlockService } from './services/block-service';
export { PageService } from './services/page-service';

// Utils
export { EventEmitter } from './utils/event-emitter';

// Core class that orchestrates all services
import { BlockService } from './services/block-service';
import { PageService } from './services/page-service';
import { EventEmitter } from './utils/event-emitter';
import type { Graph, LogseqEvent } from './types';

export class LogseqCore extends EventEmitter {
  public readonly blocks: BlockService;
  public readonly pages: PageService;
  
  private currentGraph?: Graph;

  constructor() {
    super();
    
    this.blocks = new BlockService();
    this.pages = new PageService();
    
    // Forward events from services
    this.blocks.on('*', (event: LogseqEvent) => this.emit(event.type, event.payload));
    this.pages.on('*', (event: LogseqEvent) => this.emit(event.type, event.payload));
  }

  async loadGraph(graph: Graph): Promise<void> {
    this.currentGraph = graph;
    this.emit('graph:loaded', graph);
  }

  getCurrentGraph(): Graph | undefined {
    return this.currentGraph;
  }

  async createQuickNote(content: string): Promise<void> {
    // Create today's journal page if it doesn't exist
    const todayPage = await this.pages.createTodayJournal();
    
    // Create a new block in today's journal
    await this.blocks.createBlock(content, todayPage.id);
  }

  async searchAll(query: string): Promise<{
    pages: ReturnType<PageService['searchPages']>;
    // blocks: SearchResult[]; // Will be implemented with search service
  }> {
    const pages = this.pages.searchPages(query);
    
    return {
      pages,
      // blocks: [], // TODO: Implement with search service
    };
  }
}
