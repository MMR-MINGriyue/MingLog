import { nanoid } from 'nanoid';
import { Block, BlockSchema } from '../types';
import { EventEmitter } from '../utils/event-emitter';
import { BlockRepository } from '@minglog/database';

export class BlockService extends EventEmitter {
  private blocks = new Map<string, Block>();
  private blockRepo: BlockRepository;
  private currentGraphId: string = 'default';
  private isInitialized = false;

  constructor() {
    super();
    this.blockRepo = new BlockRepository();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load existing blocks from database
      await this.loadBlocksFromDatabase();
      this.isInitialized = true;
      console.log('BlockService initialized successfully');
    } catch (error) {
      console.warn('Failed to load from database, using sample data:', error);
      // Fallback to sample data if database fails
      this.initializeSampleBlocks();
      this.isInitialized = true;
    }
  }

  async createBlock(
    content: string,
    pageId: string,
    parentId?: string
  ): Promise<Block> {
    await this.initialize();

    const now = Date.now();
    const block: Block = {
      id: nanoid(),
      content,
      pageId,
      parentId,
      createdAt: now,
      updatedAt: now,
      children: [],
      refs: this.extractRefs(content),
      properties: {},
      order: 0,
      collapsed: false,
    };

    // Validate block
    const validatedBlock = BlockSchema.parse(block);

    try {
      // Save to database
      await this.blockRepo.create({
        id: validatedBlock.id,
        content: validatedBlock.content,
        pageId: validatedBlock.pageId,
        parentId: validatedBlock.parentId,
        properties: JSON.stringify(validatedBlock.properties || {}),
        refs: validatedBlock.refs.join(','),
        order: validatedBlock.order,
        collapsed: validatedBlock.collapsed,
        graphId: this.currentGraphId,
      });

      // Store in memory cache
      this.blocks.set(validatedBlock.id, validatedBlock);

      // Update parent's children
      if (parentId) {
        const parent = this.blocks.get(parentId);
        if (parent) {
          parent.children.push(validatedBlock.id);
          parent.updatedAt = now;
          // Update parent in database
          await this.updateBlockInDatabase(parent);
        }
      }

      // Emit event
      this.emit('block:created', validatedBlock);

      return validatedBlock;
    } catch (error) {
      console.error('Failed to create block in database:', error);
      throw error;
    }
  }

  async updateBlock(id: string, content: string): Promise<Block> {
    await this.initialize();

    const block = this.blocks.get(id);
    if (!block) {
      throw new Error(`Block with id ${id} not found`);
    }

    const updatedBlock = {
      ...block,
      content,
      updatedAt: Date.now(),
      refs: this.extractRefs(content),
    };

    // Validate updated block
    const validatedBlock = BlockSchema.parse(updatedBlock);

    try {
      // Update in database
      await this.updateBlockInDatabase(validatedBlock);

      // Store updated block in cache
      this.blocks.set(id, validatedBlock);

      // Emit event
      this.emit('block:updated', validatedBlock);

      return validatedBlock;
    } catch (error) {
      console.error('Failed to update block in database:', error);
      throw error;
    }
  }

  async deleteBlock(id: string): Promise<void> {
    await this.initialize();

    const block = this.blocks.get(id);
    if (!block) {
      throw new Error(`Block with id ${id} not found`);
    }

    try {
      // Delete all children recursively first
      for (const childId of block.children) {
        await this.deleteBlock(childId);
      }

      // Remove from parent's children
      if (block.parentId) {
        const parent = this.blocks.get(block.parentId);
        if (parent) {
          parent.children = parent.children.filter(childId => childId !== id);
          parent.updatedAt = Date.now();
          // Update parent in database
          await this.updateBlockInDatabase(parent);
        }
      }

      // Delete from database
      await this.blockRepo.delete(id);

      // Remove from memory cache
      this.blocks.delete(id);

      // Emit event
      this.emit('block:deleted', { id });
    } catch (error) {
      console.error('Failed to delete block from database:', error);
      throw error;
    }
  }

  async getBlock(id: string): Promise<Block | undefined> {
    await this.initialize();
    return this.blocks.get(id);
  }

  // Helper method to update block in database
  private async updateBlockInDatabase(block: Block): Promise<void> {
    await this.blockRepo.update(block.id, {
      content: block.content,
      properties: JSON.stringify(block.properties || {}),
      refs: block.refs.join(','),
      order: block.order,
      collapsed: block.collapsed,
    });
  }

  // Helper method to convert database block to internal block format
  private dbBlockToBlock(dbBlock: any): Block {
    return {
      id: dbBlock.id,
      content: dbBlock.content,
      pageId: dbBlock.pageId,
      parentId: dbBlock.parentId,
      createdAt: dbBlock.createdAt.getTime(),
      updatedAt: dbBlock.updatedAt.getTime(),
      children: [], // Will be populated when loading children
      refs: dbBlock.refs ? dbBlock.refs.split(',').filter(Boolean) : [],
      properties: dbBlock.properties ? JSON.parse(dbBlock.properties) : {},
      order: dbBlock.order,
      collapsed: dbBlock.collapsed,
    };
  }

  // Load blocks from database
  async loadBlocksFromDatabase(): Promise<void> {
    try {
      const dbBlocks = await this.blockRepo.findMany({
        graphId: this.currentGraphId,
      });

      // First pass: create all blocks
      for (const dbBlock of dbBlocks) {
        const block = this.dbBlockToBlock(dbBlock);
        this.blocks.set(block.id, block);
      }

      // Second pass: populate children relationships
      for (const dbBlock of dbBlocks) {
        if (dbBlock.parentId) {
          const parent = this.blocks.get(dbBlock.parentId);
          if (parent) {
            parent.children.push(dbBlock.id);
          }
        }
      }

      console.log(`Loaded ${dbBlocks.length} blocks from database`);
    } catch (error) {
      console.error('Failed to load blocks from database:', error);
      throw error;
    }
  }

  // Indent block (make it a child of the previous sibling)
  async indentBlock(blockId: string): Promise<void> {
    await this.initialize();

    const block = this.blocks.get(blockId);
    if (!block) return;

    // Get all blocks in the same page
    const pageBlocks = Array.from(this.blocks.values())
      .filter(b => b.pageId === block.pageId)
      .sort((a, b) => a.order - b.order);

    // Find current block index
    const currentIndex = pageBlocks.findIndex(b => b.id === blockId);
    if (currentIndex <= 0) return; // Can't indent the first block

    // Find the previous sibling at the same level
    let previousSibling: Block | null = null;
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevBlock = pageBlocks[i];
      if (prevBlock.parentId === block.parentId) {
        previousSibling = prevBlock;
        break;
      }
    }

    if (!previousSibling) return; // No previous sibling to become parent

    try {
      // Remove from current parent
      if (block.parentId) {
        const currentParent = this.blocks.get(block.parentId);
        if (currentParent) {
          currentParent.children = currentParent.children.filter(id => id !== blockId);
          await this.updateBlockInDatabase(currentParent);
        }
      }

      // Add to new parent (previous sibling)
      block.parentId = previousSibling.id;
      block.order = previousSibling.children.length;
      previousSibling.children.push(blockId);

      // Update timestamps
      block.updatedAt = Date.now();
      previousSibling.updatedAt = Date.now();

      // Update both blocks in database
      await this.updateBlockInDatabase(block);
      await this.updateBlockInDatabase(previousSibling);

      this.emit('block:updated', block);
    } catch (error) {
      console.error('Failed to indent block:', error);
      throw error;
    }
  }

  // Outdent block (move it up one level)
  async outdentBlock(blockId: string): Promise<void> {
    await this.initialize();

    const block = this.blocks.get(blockId);
    if (!block || !block.parentId) return; // Can't outdent root blocks

    const currentParent = this.blocks.get(block.parentId);
    if (!currentParent) return;

    try {
      // Remove from current parent
      currentParent.children = currentParent.children.filter(id => id !== blockId);

      // Set new parent (grandparent)
      block.parentId = currentParent.parentId;

      // Add to new parent's children
      if (block.parentId) {
        const newParent = this.blocks.get(block.parentId);
        if (newParent) {
          newParent.children.push(blockId);
          block.order = newParent.children.length - 1;
          await this.updateBlockInDatabase(newParent);
        }
      } else {
        // Becoming a root block
        const rootBlocks = Array.from(this.blocks.values())
          .filter(b => b.pageId === block.pageId && !b.parentId);
        block.order = rootBlocks.length;
      }

      // Update timestamps
      block.updatedAt = Date.now();
      currentParent.updatedAt = Date.now();

      // Update blocks in database
      await this.updateBlockInDatabase(block);
      await this.updateBlockInDatabase(currentParent);

      this.emit('block:updated', block);
    } catch (error) {
      console.error('Failed to outdent block:', error);
      throw error;
    }
  }

  // Toggle collapse state
  async toggleCollapse(blockId: string): Promise<void> {
    await this.initialize();

    const block = this.blocks.get(blockId);
    if (!block) return;

    try {
      block.collapsed = !block.collapsed;
      block.updatedAt = Date.now();

      // Update in database
      await this.updateBlockInDatabase(block);

      this.emit('block:updated', block);
    } catch (error) {
      console.error('Failed to toggle collapse:', error);
      throw error;
    }
  }

  async getBlocksByPage(pageId: string): Promise<Block[]> {
    await this.initialize();
    return Array.from(this.blocks.values())
      .filter(block => block.pageId === pageId)
      .sort((a, b) => a.order - b.order);
  }

  async getAllBlocks(): Promise<Block[]> {
    await this.initialize();
    return Array.from(this.blocks.values())
      .sort((a, b) => a.order - b.order);
  }

  async getChildren(blockId: string): Promise<Block[]> {
    await this.initialize();
    const block = this.blocks.get(blockId);
    if (!block) return [];

    return block.children
      .map(childId => this.blocks.get(childId))
      .filter(Boolean) as Block[];
  }

  // Set current graph
  async setCurrentGraph(graphId: string): Promise<void> {
    this.currentGraphId = graphId;
    // Clear in-memory cache when switching graphs
    this.blocks.clear();
    this.isInitialized = false;
    // Reload blocks for new graph
    await this.initialize();
  }

  private extractRefs(content: string): string[] {
    // Extract page references [[Page Name]]
    const pageRefs = content.match(/\[\[([^\]]+)\]\]/g) || [];
    
    // Extract block references ((block-id))
    const blockRefs = content.match(/\(\(([^)]+)\)\)/g) || [];
    
    // Extract tags #tag
    const tags = content.match(/#[\w-]+/g) || [];
    
    return [
      ...pageRefs.map(ref => ref.slice(2, -2)),
      ...blockRefs.map(ref => ref.slice(2, -2)),
      ...tags.map(tag => tag.slice(1)),
    ];
  }

  // Initialize sample blocks for demo
  private initializeSampleBlocks(): void {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    const journalPageId = `journal-${today}`;

    const sampleBlocks: Block[] = [
      {
        id: 'block-1',
        content: '# 欢迎使用 MingLog! 🎉',
        pageId: journalPageId,
        parentId: undefined,
        createdAt: now,
        updatedAt: now,
        children: ['block-2', 'block-3'],
        refs: [],
        properties: {},
        order: 0,
        collapsed: false,
      },
      {
        id: 'block-2',
        content: '这是一个类似幕布的大纲编辑器',
        pageId: journalPageId,
        parentId: 'block-1',
        createdAt: now + 1,
        updatedAt: now + 1,
        children: ['block-4', 'block-5'],
        refs: [],
        properties: {},
        order: 0,
        collapsed: false,
      },
      {
        id: 'block-3',
        content: '## 快捷键操作',
        pageId: journalPageId,
        parentId: 'block-1',
        createdAt: now + 2,
        updatedAt: now + 2,
        children: ['block-6', 'block-7', 'block-8'],
        refs: [],
        properties: {},
        order: 1,
        collapsed: false,
      },
      {
        id: 'block-4',
        content: '支持无限层级缩进',
        pageId: journalPageId,
        parentId: 'block-2',
        createdAt: now + 3,
        updatedAt: now + 3,
        children: [],
        refs: [],
        properties: {},
        order: 0,
        collapsed: false,
      },
      {
        id: 'block-5',
        content: '流畅的编辑体验',
        pageId: journalPageId,
        parentId: 'block-2',
        createdAt: now + 4,
        updatedAt: now + 4,
        children: [],
        refs: [],
        properties: {},
        order: 1,
        collapsed: false,
      },
      {
        id: 'block-6',
        content: '**Tab**: 增加缩进（成为子项）',
        pageId: journalPageId,
        parentId: 'block-3',
        createdAt: now + 5,
        updatedAt: now + 5,
        children: [],
        refs: [],
        properties: {},
        order: 0,
        collapsed: false,
      },
      {
        id: 'block-7',
        content: '**Shift+Tab**: 减少缩进（提升层级）',
        pageId: journalPageId,
        parentId: 'block-3',
        createdAt: now + 6,
        updatedAt: now + 6,
        children: [],
        refs: [],
        properties: {},
        order: 1,
        collapsed: false,
      },
      {
        id: 'block-8',
        content: '**Enter**: 创建新的同级块',
        pageId: journalPageId,
        parentId: 'block-3',
        createdAt: now + 7,
        updatedAt: now + 7,
        children: [],
        refs: [],
        properties: {},
        order: 2,
        collapsed: false,
      },
    ];

    // Store sample blocks
    sampleBlocks.forEach(block => {
      this.blocks.set(block.id, block);
    });

    console.log('Sample blocks initialized:', sampleBlocks.length, 'blocks');
  }
}
