import { nanoid } from 'nanoid';
import { EventEmitter } from '../utils/event-emitter';
import { getPrismaClient } from '@minglog/database';

export interface Graph {
  id: string;
  name: string;
  path: string;
  settings?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export class GraphService extends EventEmitter {
  private currentGraph: Graph | null = null;
  private graphs: Map<string, Graph> = new Map();
  private client: any;

  constructor() {
    super();
    this.client = getPrismaClient();
  }

  async initialize(): Promise<Graph> {
    try {
      // Check if we're in browser environment
      if (typeof window !== 'undefined') {
        // Browser environment - use in-memory storage
        return this.initializeBrowserGraph();
      }

      // Server environment - use database
      return this.initializeDatabaseGraph();
    } catch (error) {
      console.error('Failed to initialize graph:', error);
      // Fallback to browser initialization
      return this.initializeBrowserGraph();
    }
  }

  private async initializeBrowserGraph(): Promise<Graph> {
    // Create default graph for browser
    const defaultGraph: Graph = {
      id: 'default',
      name: '默认图谱',
      path: './graphs/default',
      settings: {
        theme: 'light',
        autoSave: true,
        enabledFeatures: ['blocks', 'pages', 'links']
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.graphs.set(defaultGraph.id, defaultGraph);
    this.currentGraph = defaultGraph;

    console.log('Browser graph initialized:', defaultGraph);
    return defaultGraph;
  }

  private async initializeDatabaseGraph(): Promise<Graph> {
    const client = getPrismaClient();

    // Try to find existing default graph
    let dbGraph = await client.graph.findFirst({
      where: { name: 'Default Graph' }
    });

    if (!dbGraph) {
      // Create default graph if it doesn't exist
      dbGraph = await client.graph.create({
        data: {
          id: 'default',
          name: 'Default Graph',
          path: './graphs/default',
          settings: JSON.stringify({
            theme: 'light',
            autoSave: true,
            enabledFeatures: ['blocks', 'pages', 'links']
          })
        }
      });
    }

    this.currentGraph = {
      id: dbGraph.id,
      name: dbGraph.name,
      path: dbGraph.path,
      settings: dbGraph.settings ? JSON.parse(dbGraph.settings) : {},
      createdAt: dbGraph.createdAt.getTime(),
      updatedAt: dbGraph.updatedAt.getTime(),
    };

    this.graphs.set(this.currentGraph.id, this.currentGraph);
    console.log('Database graph initialized:', this.currentGraph.name);
    return this.currentGraph;
  }

  getCurrentGraph(): Graph | null {
    return this.currentGraph;
  }

  getCurrentGraphId(): string {
    return this.currentGraph?.id || 'default';
  }

  async updateGraphSettings(settings: Record<string, any>): Promise<void> {
    if (!this.currentGraph) return;

    try {
      await this.client.graph.update({
        where: { id: this.currentGraph.id },
        data: {
          settings: JSON.stringify(settings)
        }
      });

      this.currentGraph.settings = settings;
      this.currentGraph.updatedAt = Date.now();

      this.emit('graph:updated', this.currentGraph);
    } catch (error) {
      console.error('Failed to update graph settings:', error);
      // Update in memory even if database fails
      this.currentGraph.settings = settings;
      this.currentGraph.updatedAt = Date.now();
    }
  }

  async createGraph(name: string, path: string): Promise<Graph> {
    try {
      const dbGraph = await this.client.graph.create({
        data: {
          id: nanoid(),
          name,
          path,
          settings: JSON.stringify({
            theme: 'light',
            autoSave: true,
            enabledFeatures: ['blocks', 'pages', 'links']
          })
        }
      });

      const graph: Graph = {
        id: dbGraph.id,
        name: dbGraph.name,
        path: dbGraph.path,
        settings: JSON.parse(dbGraph.settings || '{}'),
        createdAt: dbGraph.createdAt.getTime(),
        updatedAt: dbGraph.updatedAt.getTime(),
      };

      this.emit('graph:created', graph);
      return graph;
    } catch (error) {
      console.error('Failed to create graph:', error);
      throw error;
    }
  }

  async switchToGraph(graphId: string): Promise<Graph> {
    try {
      const dbGraph = await this.client.graph.findUnique({
        where: { id: graphId }
      });

      if (!dbGraph) {
        throw new Error(`Graph with id ${graphId} not found`);
      }

      this.currentGraph = {
        id: dbGraph.id,
        name: dbGraph.name,
        path: dbGraph.path,
        settings: dbGraph.settings ? JSON.parse(dbGraph.settings) : {},
        createdAt: dbGraph.createdAt.getTime(),
        updatedAt: dbGraph.updatedAt.getTime(),
      };

      this.emit('graph:switched', this.currentGraph);
      return this.currentGraph;
    } catch (error) {
      console.error('Failed to switch graph:', error);
      throw error;
    }
  }

  async getAllGraphs(): Promise<Graph[]> {
    try {
      const dbGraphs = await this.client.graph.findMany({
        orderBy: { updatedAt: 'desc' }
      });

      return dbGraphs.map(dbGraph => ({
        id: dbGraph.id,
        name: dbGraph.name,
        path: dbGraph.path,
        settings: dbGraph.settings ? JSON.parse(dbGraph.settings) : {},
        createdAt: dbGraph.createdAt.getTime(),
        updatedAt: dbGraph.updatedAt.getTime(),
      }));
    } catch (error) {
      console.error('Failed to get all graphs:', error);
      return this.currentGraph ? [this.currentGraph] : [];
    }
  }
}
