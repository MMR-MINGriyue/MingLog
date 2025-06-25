import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

// Create a singleton Prisma client
let prisma: PrismaClient;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prisma;
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}

// Database utilities
export class DatabaseService {
  private prismaClient: PrismaClient;

  constructor() {
    this.prismaClient = getPrismaClient();
  }

  async initialize(): Promise<void> {
    try {
      await this.prismaClient.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    await this.prismaClient.$disconnect();
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      await this.prismaClient.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  // Transaction helper
  async transaction<T>(fn: (prisma: any) => Promise<T>): Promise<T> {
    return this.prismaClient.$transaction(fn);
  }

  get client(): PrismaClient {
    return this.prismaClient;
  }
}

// Repository base class
export abstract class BaseRepository<T> {
  protected client: PrismaClient;

  constructor() {
    this.client = getPrismaClient();
  }

  abstract create(data: any): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract update(id: string, data: any): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract findMany(where?: any): Promise<T[]>;
}

// Page Repository
export class PageRepository extends BaseRepository<any> {
  async create(data: {
    id: string;
    name: string;
    title?: string;
    properties?: any;
    tags?: string;
    isJournal?: boolean;
    journalDate?: string;
    graphId: string;
  }) {
    return this.client.page.create({
      data: {
        ...data,
        tags: data.tags || '',
        properties: data.properties || {},
      },
    });
  }

  async findById(id: string) {
    return this.client.page.findUnique({
      where: { id },
      include: {
        blocks: true,
        linksTo: true,
        linksFrom: true,
      },
    });
  }

  async findByName(graphId: string, name: string) {
    return this.client.page.findUnique({
      where: {
        graphId_name: {
          graphId,
          name,
        },
      },
      include: {
        blocks: true,
      },
    });
  }

  async update(id: string, data: any) {
    return this.client.page.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.client.page.delete({
      where: { id },
    });
  }

  async findMany(where?: any) {
    return this.client.page.findMany({
      where,
      include: {
        blocks: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async searchByName(graphId: string, query: string) {
    return this.client.page.findMany({
      where: {
        graphId,
        OR: [
          { name: { contains: query } },
          { title: { contains: query } },
        ],
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}

// Block Repository
export class BlockRepository extends BaseRepository<any> {
  async create(data: {
    id: string;
    content: string;
    parentId?: string;
    properties?: any;
    refs?: string;
    pageId: string;
    graphId: string;
  }) {
    return this.client.block.create({
      data: {
        ...data,
        refs: data.refs || '',
        properties: data.properties || {},
      },
    });
  }

  async findById(id: string) {
    return this.client.block.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
        page: true,
      },
    });
  }

  async update(id: string, data: any) {
    return this.client.block.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.client.block.delete({
      where: { id },
    });
  }

  async findMany(where?: any) {
    return this.client.block.findMany({
      where,
      include: {
        children: true,
        parent: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findByPage(pageId: string) {
    return this.client.block.findMany({
      where: { pageId },
      include: {
        children: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
