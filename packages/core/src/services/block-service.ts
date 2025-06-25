import { nanoid } from 'nanoid';
import { Block, BlockSchema } from '../types';
import { EventEmitter } from '../utils/event-emitter';

export class BlockService extends EventEmitter {
  private blocks = new Map<string, Block>();

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
    };

    // Validate block
    const validatedBlock = BlockSchema.parse(block);
    
    // Store block
    this.blocks.set(block.id, validatedBlock);
    
    // Update parent's children
    if (parentId) {
      const parent = this.blocks.get(parentId);
      if (parent) {
        parent.children.push(block.id);
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
}
