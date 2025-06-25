import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../services/database.js';

const router = Router();

// Validation schemas
const exportSchema = z.object({
  graphId: z.string(),
  format: z.enum(['json', 'markdown']),
  includeBlocks: z.boolean().optional().default(true),
  includeMetadata: z.boolean().optional().default(true),
  pageIds: z.array(z.string()).optional(), // Export specific pages only
});

// GET /api/export/:graphId - Export entire graph
router.get('/:graphId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { graphId } = req.params;
    const { format = 'json', includeBlocks = 'true', includeMetadata = 'true' } = req.query;

    const exportData = await exportGraph(
      graphId,
      format as string,
      includeBlocks === 'true',
      includeMetadata === 'true'
    );

    const filename = `minglog-export-${graphId}-${new Date().toISOString().split('T')[0]}.${format}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/markdown');
    
    if (format === 'json') {
      res.json(exportData);
    } else {
      res.send(exportData);
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/export - Export with custom options
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = exportSchema.parse(req.body);
    const { graphId, format, includeBlocks, includeMetadata, pageIds } = validatedData;

    const exportData = await exportGraph(
      graphId,
      format,
      includeBlocks,
      includeMetadata,
      pageIds
    );

    const filename = `minglog-export-${graphId}-${new Date().toISOString().split('T')[0]}.${format}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/markdown');
    
    if (format === 'json') {
      res.json(exportData);
    } else {
      res.send(exportData);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid export parameters',
          details: error.errors
        }
      });
    } else {
      next(error);
    }
  }
});

// Export graph data
async function exportGraph(
  graphId: string,
  format: string,
  includeBlocks: boolean = true,
  includeMetadata: boolean = true,
  pageIds?: string[]
): Promise<any> {
  // Get graph info
  const graph = await prisma.graph.findUnique({
    where: { id: graphId }
  });

  if (!graph) {
    throw new Error('Graph not found');
  }

  // Build page filter
  const pageFilter: any = { graphId };
  if (pageIds && pageIds.length > 0) {
    pageFilter.id = { in: pageIds };
  }

  // Get pages
  const pages = await prisma.page.findMany({
    where: pageFilter,
    orderBy: { createdAt: 'asc' },
    include: includeBlocks ? {
      blocks: {
        orderBy: { order: 'asc' }
      }
    } : undefined
  });

  // Get all blocks if needed but not included in pages
  let allBlocks: any[] = [];
  if (includeBlocks && !pages.some(p => p.blocks)) {
    allBlocks = await prisma.block.findMany({
      where: {
        graphId,
        ...(pageIds && pageIds.length > 0 ? { pageId: { in: pageIds } } : {})
      },
      orderBy: [{ pageId: 'asc' }, { order: 'asc' }]
    });
  }

  if (format === 'json') {
    return exportToJSON(graph, pages, allBlocks, includeMetadata);
  } else {
    return exportToMarkdown(graph, pages, allBlocks, includeMetadata);
  }
}

// Export to JSON format
function exportToJSON(graph: any, pages: any[], blocks: any[], includeMetadata: boolean) {
  const exportData: any = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    graph: {
      id: graph.id,
      name: graph.name,
      description: graph.description
    },
    pages: pages.map(page => {
      const pageData: any = {
        id: page.id,
        name: page.name,
        title: page.title,
        isJournal: page.isJournal,
        tags: page.tags ? JSON.parse(page.tags) : [],
        properties: page.properties ? JSON.parse(page.properties) : {},
      };

      if (includeMetadata) {
        pageData.createdAt = page.createdAt;
        pageData.updatedAt = page.updatedAt;
      }

      if (page.blocks) {
        pageData.blocks = page.blocks.map((block: any) => {
          const blockData: any = {
            id: block.id,
            content: block.content,
            order: block.order,
            parentId: block.parentId,
            collapsed: block.collapsed,
            properties: block.properties ? JSON.parse(block.properties) : {},
          };

          if (includeMetadata) {
            blockData.createdAt = block.createdAt;
            blockData.updatedAt = block.updatedAt;
          }

          return blockData;
        });
      }

      return pageData;
    })
  };

  // Add standalone blocks if any
  if (blocks.length > 0) {
    exportData.blocks = blocks.map(block => {
      const blockData: any = {
        id: block.id,
        pageId: block.pageId,
        content: block.content,
        order: block.order,
        parentId: block.parentId,
        collapsed: block.collapsed,
        properties: block.properties ? JSON.parse(block.properties) : {},
      };

      if (includeMetadata) {
        blockData.createdAt = block.createdAt;
        blockData.updatedAt = block.updatedAt;
      }

      return blockData;
    });
  }

  return exportData;
}

// Export to Markdown format
function exportToMarkdown(graph: any, pages: any[], blocks: any[], includeMetadata: boolean) {
  let markdown = `# ${graph.name}\n\n`;
  
  if (graph.description) {
    markdown += `${graph.description}\n\n`;
  }

  if (includeMetadata) {
    markdown += `---\n`;
    markdown += `Graph ID: ${graph.id}\n`;
    markdown += `Exported: ${new Date().toISOString()}\n`;
    markdown += `Pages: ${pages.length}\n`;
    markdown += `---\n\n`;
  }

  // Group blocks by page if they're not already included
  const blocksByPage = new Map();
  if (blocks.length > 0) {
    blocks.forEach(block => {
      if (!blocksByPage.has(block.pageId)) {
        blocksByPage.set(block.pageId, []);
      }
      blocksByPage.get(block.pageId).push(block);
    });
  }

  pages.forEach(page => {
    markdown += `## ${page.title || page.name}\n\n`;

    if (includeMetadata) {
      markdown += `*Created: ${new Date(page.createdAt).toLocaleDateString()}*\n`;
      if (page.isJournal) {
        markdown += `*Type: Journal*\n`;
      }
      if (page.tags) {
        const tags = JSON.parse(page.tags);
        if (tags.length > 0) {
          markdown += `*Tags: ${tags.join(', ')}*\n`;
        }
      }
      markdown += `\n`;
    }

    // Add blocks
    const pageBlocks = page.blocks || blocksByPage.get(page.id) || [];
    pageBlocks.forEach((block: any) => {
      const indent = '  '.repeat(getBlockDepth(block, pageBlocks));
      markdown += `${indent}- ${block.content}\n`;
    });

    markdown += `\n`;
  });

  return markdown;
}

// Calculate block depth for indentation
function getBlockDepth(block: any, allBlocks: any[]): number {
  let depth = 0;
  let currentBlock = block;

  while (currentBlock.parentId) {
    const parent = allBlocks.find(b => b.id === currentBlock.parentId);
    if (!parent) break;
    depth++;
    currentBlock = parent;
  }

  return depth;
}

export { router as exportRoutes };
