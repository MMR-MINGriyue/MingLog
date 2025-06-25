import { z } from 'zod';

// Base entity schema
export const BaseEntitySchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Block schema
export const BlockSchema = BaseEntitySchema.extend({
  content: z.string(),
  parentId: z.string().optional(),
  pageId: z.string(),
  properties: z.record(z.any()).optional(),
  children: z.array(z.string()).default([]),
  refs: z.array(z.string()).default([]),
  order: z.number().default(0),
  collapsed: z.boolean().default(false),
});

// Page schema
export const PageSchema = BaseEntitySchema.extend({
  name: z.string(),
  title: z.string().optional(),
  properties: z.record(z.any()).optional(),
  tags: z.array(z.string()).default([]),
  isJournal: z.boolean().default(false),
  journalDate: z.string().optional(),
});

// Link schema
export const LinkSchema = z.object({
  id: z.string(),
  fromBlockId: z.string(),
  toPageId: z.string(),
  linkType: z.enum(['reference', 'embed', 'tag']),
});

// Graph schema
export const GraphSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  settings: z.record(z.any()).optional(),
});

// Export types
export type Block = z.infer<typeof BlockSchema>;
export type Page = z.infer<typeof PageSchema>;
export type Link = z.infer<typeof LinkSchema>;
export type Graph = z.infer<typeof GraphSchema>;
export type BaseEntity = z.infer<typeof BaseEntitySchema>;

// Search result types
export interface SearchResult {
  id: string;
  type: 'block' | 'page';
  content: string;
  highlights: string[];
  score: number;
  page?: Page;
  block?: Block;
}

// Plugin types
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  permissions: string[];
}

export interface Command {
  id: string;
  name: string;
  description: string;
  keybinding?: string;
  handler: () => void | Promise<void>;
}

export interface Renderer {
  type: string;
  component: any; // React.ComponentType<any>
}

// Event types
export type EventType = 
  | 'block:created'
  | 'block:updated'
  | 'block:deleted'
  | 'page:created'
  | 'page:updated'
  | 'page:deleted'
  | 'graph:loaded'
  | 'plugin:loaded'
  | 'plugin:unloaded';

export interface LogseqEvent<T = any> {
  type: EventType;
  payload: T;
  timestamp: number;
}
