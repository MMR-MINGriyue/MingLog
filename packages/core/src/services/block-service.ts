import { nanoid } from 'nanoid';
import { Block, BlockSchema } from '../types';
import { EventEmitter } from '../utils/event-emitter';
// import { BlockRepository } from '@minglog/database'; // Disabled for browser compatibility

export class BlockService extends EventEmitter {
  private blocks = new Map<string, Block>();
  // private blockRepo: BlockRepository; // Disabled for browser compatibility
  // private currentGraphId: string = 'default'; // Disabled for browser compatibility

  constructor() {
    super();
    // this.blockRepo = new BlockRepository(); // Disabled for browser compatibility
    this.initializeSampleBlocks();
  }

  async createBlock(
    content: string,
    pageId: string,
    parentId?: string
  ): Promise<Block> {
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

    // Database operations disabled for browser compatibility
    // Store in memory only for now

    // Store in memory
    this.blocks.set(validatedBlock.id, validatedBlock);

    // Update parent's children
    if (parentId) {
      const parent = this.blocks.get(parentId);
      if (parent) {
        parent.children.push(validatedBlock.id);
        parent.updatedAt = now;
      }
    }

    // Emit event
    this.emit('block:created', validatedBlock);

    return validatedBlock;
  }

  async updateBlock(id: string, content: string): Promise<Block> {
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
    
    // Store updated block
    this.blocks.set(id, validatedBlock);
    
    // Emit event
    this.emit('block:updated', validatedBlock);
    
    return validatedBlock;
  }

  async deleteBlock(id: string): Promise<void> {
    const block = this.blocks.get(id);
    if (!block) {
      throw new Error(`Block with id ${id} not found`);
    }

    // Remove from parent's children
    if (block.parentId) {
      const parent = this.blocks.get(block.parentId);
      if (parent) {
        parent.children = parent.children.filter(childId => childId !== id);
        parent.updatedAt = Date.now();
      }
    }

    // Delete all children recursively
    for (const childId of block.children) {
      await this.deleteBlock(childId);
    }

    // Remove block
    this.blocks.delete(id);
    
    // Emit event
    this.emit('block:deleted', { id });
  }

  getBlock(id: string): Block | undefined {
    return this.blocks.get(id);
  }

  // Indent block (make it a child of the previous sibling)
  async indentBlock(blockId: string): Promise<void> {
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

    // Remove from current parent
    if (block.parentId) {
      const currentParent = this.blocks.get(block.parentId);
      if (currentParent) {
        currentParent.children = currentParent.children.filter(id => id !== blockId);
      }
    }

    // Add to new parent (previous sibling)
    block.parentId = previousSibling.id;
    block.order = previousSibling.children.length;
    previousSibling.children.push(blockId);

    // Update timestamps
    block.updatedAt = Date.now();
    previousSibling.updatedAt = Date.now();

    this.emit('block:updated', block);
  }

  // Outdent block (move it up one level)
  async outdentBlock(blockId: string): Promise<void> {
    const block = this.blocks.get(blockId);
    if (!block || !block.parentId) return; // Can't outdent root blocks

    const currentParent = this.blocks.get(block.parentId);
    if (!currentParent) return;

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

    this.emit('block:updated', block);
  }

  // Toggle collapse state
  async toggleCollapse(blockId: string): Promise<void> {
    const block = this.blocks.get(blockId);
    if (!block) return;

    block.collapsed = !block.collapsed;
    block.updatedAt = Date.now();

    this.emit('block:updated', block);
  }

  getBlocksByPage(pageId: string): Block[] {
    return Array.from(this.blocks.values())
      .filter(block => block.pageId === pageId);
  }

  getChildren(blockId: string): Block[] {
    const block = this.blocks.get(blockId);
    if (!block) return [];
    
    return block.children
      .map(childId => this.blocks.get(childId))
      .filter(Boolean) as Block[];
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
