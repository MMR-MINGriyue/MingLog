import { nanoid } from 'nanoid';
import { Page, PageSchema } from '../types';
import { EventEmitter } from '../utils/event-emitter';
import { format } from 'date-fns';
// import { PageRepository } from '@minglog/database'; // Disabled for browser compatibility

export class PageService extends EventEmitter {
  private pages = new Map<string, Page>();
  private nameIndex = new Map<string, string>(); // name -> id mapping
  // private pageRepo: PageRepository; // Disabled for browser compatibility
  // private currentGraphId: string = 'default'; // Disabled for browser compatibility

  constructor() {
    super();
    // this.pageRepo = new PageRepository(); // Disabled for browser compatibility
    // Auto-load sample data for demo
    this.initializeSampleData();
  }

  async createPage(name: string, isJournal = false): Promise<Page> {
    // Check if page already exists
    const existingId = this.nameIndex.get(name.toLowerCase());
    if (existingId) {
      const existing = this.pages.get(existingId);
      if (existing) return existing;
    }

    const now = Date.now();
    const page: Page = {
      id: nanoid(),
      name,
      title: name,
      createdAt: now,
      updatedAt: now,
      tags: [],
      isJournal,
      journalDate: isJournal ? format(new Date(), 'yyyy-MM-dd') : undefined,
      properties: {},
    };

    // Validate page
    const validatedPage = PageSchema.parse(page);

    // Store in memory (database operations disabled for browser compatibility)
    this.pages.set(validatedPage.id, validatedPage);
    this.nameIndex.set(name.toLowerCase(), validatedPage.id);

    // Emit event
    this.emit('page:created', validatedPage);

    return validatedPage;
  }

  async updatePage(id: string, updates: Partial<Omit<Page, 'id' | 'createdAt'>>): Promise<Page> {
    const page = this.pages.get(id);
    if (!page) {
      throw new Error(`Page with id ${id} not found`);
    }

    // Update name index if name changed
    if (updates.name && updates.name !== page.name) {
      this.nameIndex.delete(page.name.toLowerCase());
      this.nameIndex.set(updates.name.toLowerCase(), id);
    }

    const updatedPage = {
      ...page,
      ...updates,
      updatedAt: Date.now(),
    };

    // Validate updated page
    const validatedPage = PageSchema.parse(updatedPage);
    
    // Store updated page
    this.pages.set(id, validatedPage);
    
    // Emit event
    this.emit('page:updated', validatedPage);
    
    return validatedPage;
  }

  async deletePage(id: string): Promise<void> {
    const page = this.pages.get(id);
    if (!page) {
      throw new Error(`Page with id ${id} not found`);
    }

    // Remove from name index
    this.nameIndex.delete(page.name.toLowerCase());
    
    // Remove page
    this.pages.delete(id);
    
    // Emit event
    this.emit('page:deleted', { id });
  }

  getPage(id: string): Page | undefined {
    return this.pages.get(id);
  }

  getPageByName(name: string): Page | undefined {
    const id = this.nameIndex.get(name.toLowerCase());
    return id ? this.pages.get(id) : undefined;
  }

  getAllPages(): Page[] {
    return Array.from(this.pages.values());
  }

  getJournalPages(): Page[] {
    return Array.from(this.pages.values())
      .filter(page => page.isJournal)
      .sort((a, b) => (b.journalDate || '').localeCompare(a.journalDate || ''));
  }

  getPagesByTag(tag: string): Page[] {
    return Array.from(this.pages.values())
      .filter(page => page.tags.includes(tag));
  }

  searchPages(query: string): Page[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.pages.values())
      .filter(page => 
        page.name.toLowerCase().includes(lowerQuery) ||
        page.title?.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.name.toLowerCase() === lowerQuery;
        const bExact = b.name.toLowerCase() === lowerQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then prioritize starts with
        const aStarts = a.name.toLowerCase().startsWith(lowerQuery);
        const bStarts = b.name.toLowerCase().startsWith(lowerQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        // Finally sort alphabetically
        return a.name.localeCompare(b.name);
      });
  }

  async createTodayJournal(): Promise<Page> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existing = this.getPageByName(today);

    if (existing) {
      return existing;
    }

    return this.createPage(today, true);
  }

  // Database methods disabled for browser compatibility
  /*
  // Helper method to convert database page to internal page format
  private dbPageToPage(dbPage: any): Page {
    return {
      id: dbPage.id,
      name: dbPage.name,
      title: dbPage.title,
      createdAt: dbPage.createdAt.getTime(),
      updatedAt: dbPage.updatedAt.getTime(),
      tags: dbPage.tags ? dbPage.tags.split(',').filter(Boolean) : [],
      isJournal: dbPage.isJournal,
      journalDate: dbPage.journalDate,
      properties: dbPage.properties || {},
    };
  }

  // Load pages from database
  async loadPagesFromDatabase(): Promise<void> {
    try {
      const dbPages = await this.pageRepo.findMany({
        graphId: this.currentGraphId,
      });

      for (const dbPage of dbPages) {
        const page = this.dbPageToPage(dbPage);
        this.pages.set(page.id, page);
        this.nameIndex.set(page.name.toLowerCase(), page.id);
      }

      console.log(`Loaded ${dbPages.length} pages from database`);
    } catch (error) {
      console.error('Failed to load pages from database:', error);
    }
  }
  */

  // Set current graph (disabled for browser compatibility)
  setCurrentGraph(_graphId: string): void {
    // this.currentGraphId = graphId; // Disabled for browser compatibility
    // Clear in-memory cache when switching graphs
    this.pages.clear();
    this.nameIndex.clear();
  }

  // Initialize sample data for demo
  private initializeSampleData(): void {
    // Create welcome page
    const welcomePage: Page = {
      id: 'welcome-page',
      name: 'Welcome to MingLog',
      title: 'Welcome to MingLog',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['welcome', 'getting-started'],
      isJournal: false,
      properties: {},
    };

    this.pages.set(welcomePage.id, welcomePage);
    this.nameIndex.set(welcomePage.name.toLowerCase(), welcomePage.id);

    // Create today's journal page
    const today = format(new Date(), 'yyyy-MM-dd');
    const journalPage: Page = {
      id: `journal-${today}`,
      name: today,
      title: `Journal - ${today}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
      isJournal: true,
      journalDate: today,
      properties: {},
    };

    this.pages.set(journalPage.id, journalPage);
    this.nameIndex.set(journalPage.name.toLowerCase(), journalPage.id);

    console.log('Sample data initialized:', { welcomePage, journalPage });
  }
}
