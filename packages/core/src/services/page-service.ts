import { nanoid } from 'nanoid';
import { Page, PageSchema } from '../types';
import { EventEmitter } from '../utils/event-emitter';
import { format } from 'date-fns';
import { PageRepository } from '@minglog/database';

export class PageService extends EventEmitter {
  private pages = new Map<string, Page>();
  private nameIndex = new Map<string, string>(); // name -> id mapping
  private pageRepo: PageRepository;
  private currentGraphId: string = 'default'; // TODO: Make this configurable

  constructor() {
    super();
    this.pageRepo = new PageRepository();
    // Auto-load pages on initialization
    this.loadPagesFromDatabase().catch(console.error);
  }

  async createPage(name: string, isJournal = false): Promise<Page> {
    // Check if page already exists in database
    const existing = await this.pageRepo.findByName(this.currentGraphId, name);
    if (existing) {
      const page = this.dbPageToPage(existing);
      this.pages.set(page.id, page);
      this.nameIndex.set(name.toLowerCase(), page.id);
      return page;
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

    // Save to database
    try {
      await this.pageRepo.create({
        id: validatedPage.id,
        name: validatedPage.name,
        title: validatedPage.title,
        properties: validatedPage.properties,
        tags: validatedPage.tags.join(','),
        isJournal: validatedPage.isJournal,
        journalDate: validatedPage.journalDate,
        graphId: this.currentGraphId,
      });
    } catch (error) {
      console.error('Failed to save page to database:', error);
      // Continue with in-memory storage for now
    }

    // Store in memory
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

  // Set current graph
  setCurrentGraph(graphId: string): void {
    this.currentGraphId = graphId;
    // Clear in-memory cache when switching graphs
    this.pages.clear();
    this.nameIndex.clear();
  }
}
