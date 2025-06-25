import { nanoid } from 'nanoid';
import { Page, PageSchema } from '../types';
import { EventEmitter } from '../utils/event-emitter';
import { format } from 'date-fns';
import { PageRepository } from '@minglog/database';

export class PageService extends EventEmitter {
  private pages = new Map<string, Page>();
  private nameIndex = new Map<string, string>(); // name -> id mapping
  private pageRepo: PageRepository;
  private currentGraphId: string = 'default';
  private isInitialized = false;

  constructor() {
    super();
    this.pageRepo = new PageRepository();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load existing pages from database
      await this.loadPagesFromDatabase();
      this.isInitialized = true;
      console.log('PageService initialized successfully');
    } catch (error) {
      console.warn('Failed to load from database, using sample data:', error);
      // Fallback to sample data if database fails
      this.initializeSampleData();
      this.isInitialized = true;
    }
  }

  async createPage(name: string, isJournal = false): Promise<Page> {
    await this.initialize();

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

    try {
      // Save to database
      await this.pageRepo.create({
        id: validatedPage.id,
        name: validatedPage.name,
        title: validatedPage.title,
        properties: JSON.stringify(validatedPage.properties || {}),
        tags: validatedPage.tags.join(','),
        isJournal: validatedPage.isJournal,
        journalDate: validatedPage.journalDate,
        graphId: this.currentGraphId,
      });

      // Store in memory cache
      this.pages.set(validatedPage.id, validatedPage);
      this.nameIndex.set(name.toLowerCase(), validatedPage.id);

      // Emit event
      this.emit('page:created', validatedPage);

      return validatedPage;
    } catch (error) {
      console.error('Failed to create page in database:', error);
      throw error;
    }
  }

  async updatePage(id: string, updates: Partial<Omit<Page, 'id' | 'createdAt'>>): Promise<Page> {
    await this.initialize();

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

    try {
      // Update in database
      await this.pageRepo.update(id, {
        name: validatedPage.name,
        title: validatedPage.title,
        properties: JSON.stringify(validatedPage.properties || {}),
        tags: validatedPage.tags.join(','),
        isJournal: validatedPage.isJournal,
        journalDate: validatedPage.journalDate,
      });

      // Update memory cache
      this.pages.set(id, validatedPage);

      // Emit event
      this.emit('page:updated', validatedPage);

      return validatedPage;
    } catch (error) {
      console.error('Failed to update page in database:', error);
      throw error;
    }
  }

  async deletePage(id: string): Promise<void> {
    await this.initialize();

    const page = this.pages.get(id);
    if (!page) {
      throw new Error(`Page with id ${id} not found`);
    }

    try {
      // Delete from database (will cascade delete blocks)
      await this.pageRepo.delete(id);

      // Remove from name index
      this.nameIndex.delete(page.name.toLowerCase());

      // Remove from memory cache
      this.pages.delete(id);

      // Emit event
      this.emit('page:deleted', { id });
    } catch (error) {
      console.error('Failed to delete page from database:', error);
      throw error;
    }
  }

  async getPage(id: string): Promise<Page | undefined> {
    await this.initialize();
    return this.pages.get(id);
  }

  async getPageByName(name: string): Promise<Page | undefined> {
    await this.initialize();
    const id = this.nameIndex.get(name.toLowerCase());
    return id ? this.pages.get(id) : undefined;
  }

  async getAllPages(): Promise<Page[]> {
    await this.initialize();
    return Array.from(this.pages.values());
  }

  async getJournalPages(): Promise<Page[]> {
    await this.initialize();
    return Array.from(this.pages.values())
      .filter(page => page.isJournal)
      .sort((a, b) => (b.journalDate || '').localeCompare(a.journalDate || ''));
  }

  async getPagesByTag(tag: string): Promise<Page[]> {
    await this.initialize();
    return Array.from(this.pages.values())
      .filter(page => page.tags.includes(tag));
  }

  async searchPages(query: string): Promise<Page[]> {
    await this.initialize();
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
    const existing = await this.getPageByName(today);

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
      properties: dbPage.properties ? JSON.parse(dbPage.properties) : {},
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

      // If no pages exist, initialize with sample data
      if (dbPages.length === 0) {
        await this.initializeSampleDataInDatabase();
      }
    } catch (error) {
      console.error('Failed to load pages from database:', error);
      throw error;
    }
  }

  // Set current graph
  async setCurrentGraph(graphId: string): Promise<void> {
    this.currentGraphId = graphId;
    // Clear in-memory cache when switching graphs
    this.pages.clear();
    this.nameIndex.clear();
    this.isInitialized = false;
    // Reload pages for new graph
    await this.initialize();
  }

  // Initialize sample data in database
  private async initializeSampleDataInDatabase(): Promise<void> {
    try {
      // Create welcome page
      const welcomePage = await this.createPage('Welcome to MingLog', false);
      welcomePage.tags = ['welcome', 'getting-started'];
      await this.updatePage(welcomePage.id, { tags: welcomePage.tags });

      // Create today's journal page
      await this.createTodayJournal();

      console.log('Sample data initialized in database');
    } catch (error) {
      console.error('Failed to initialize sample data in database:', error);
    }
  }

  // Initialize sample data for demo (fallback)
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

    console.log('Sample data initialized (fallback):', { welcomePage, journalPage });
  }
}
