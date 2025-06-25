import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { prisma } from '../services/database.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || 
        file.mimetype === 'text/markdown' || 
        file.mimetype === 'text/plain' ||
        file.originalname.endsWith('.md') ||
        file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON and Markdown files are allowed'));
    }
  }
});

// Validation schemas
const importOptionsSchema = z.object({
  graphId: z.string(),
  mergeStrategy: z.enum(['replace', 'merge', 'skip']).optional().default('merge'),
  createNewGraph: z.boolean().optional().default(false),
  newGraphName: z.string().optional(),
});

// POST /api/import - Import data from file
router.post('/', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded'
        }
      });
    }

    const options = importOptionsSchema.parse(req.body);
    const fileContent = req.file.buffer.toString('utf-8');
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();

    let importData: any;
    
    if (fileExtension === 'json' || req.file.mimetype === 'application/json') {
      try {
        importData = JSON.parse(fileContent);
      } catch (error) {
        return res.status(400).json({
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON format'
          }
        });
      }
    } else if (fileExtension === 'md' || req.file.mimetype === 'text/markdown') {
      importData = parseMarkdownToData(fileContent);
    } else {
      return res.status(400).json({
        error: {
          code: 'UNSUPPORTED_FORMAT',
          message: 'Unsupported file format. Only JSON and Markdown are supported.'
        }
      });
    }

    const result = await importData(importData, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid import options',
          details: error.errors
        }
      });
    } else {
      next(error);
    }
  }
});

// POST /api/import/json - Import JSON data directly
router.post('/json', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options = importOptionsSchema.parse(req.body.options || {});
    const importData = req.body.data;

    if (!importData) {
      return res.status(400).json({
        error: {
          code: 'NO_DATA',
          message: 'No import data provided'
        }
      });
    }

    const result = await importDataToGraph(importData, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid import options',
          details: error.errors
        }
      });
    } else {
      next(error);
    }
  }
});

// Import data to graph
async function importDataToGraph(data: any, options: any) {
  const { graphId, mergeStrategy, createNewGraph, newGraphName } = options;

  let targetGraphId = graphId;

  // Create new graph if requested
  if (createNewGraph) {
    const newGraph = await prisma.graph.create({
      data: {
        id: `graph-${Date.now()}`,
        name: newGraphName || `Imported Graph ${new Date().toLocaleDateString()}`,
        description: `Imported from ${data.graph?.name || 'external source'} on ${new Date().toISOString()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    targetGraphId = newGraph.id;
  }

  // Verify target graph exists
  const targetGraph = await prisma.graph.findUnique({
    where: { id: targetGraphId }
  });

  if (!targetGraph) {
    throw new Error('Target graph not found');
  }

  const importStats = {
    pagesImported: 0,
    blocksImported: 0,
    pagesSkipped: 0,
    blocksSkipped: 0,
    errors: [] as string[]
  };

  // Import pages
  if (data.pages && Array.isArray(data.pages)) {
    for (const pageData of data.pages) {
      try {
        await importPage(pageData, targetGraphId, mergeStrategy, importStats);
      } catch (error) {
        importStats.errors.push(`Failed to import page "${pageData.name}": ${error.message}`);
      }
    }
  }

  // Import standalone blocks
  if (data.blocks && Array.isArray(data.blocks)) {
    for (const blockData of data.blocks) {
      try {
        await importBlock(blockData, targetGraphId, mergeStrategy, importStats);
      } catch (error) {
        importStats.errors.push(`Failed to import block "${blockData.id}": ${error.message}`);
      }
    }
  }

  return {
    graphId: targetGraphId,
    ...importStats
  };
}

// Import a single page
async function importPage(pageData: any, graphId: string, mergeStrategy: string, stats: any) {
  const existingPage = await prisma.page.findFirst({
    where: {
      graphId,
      name: pageData.name
    }
  });

  if (existingPage && mergeStrategy === 'skip') {
    stats.pagesSkipped++;
    return;
  }

  const pageToCreate = {
    id: pageData.id || `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: pageData.name,
    title: pageData.title || pageData.name,
    graphId,
    isJournal: pageData.isJournal || false,
    tags: JSON.stringify(pageData.tags || []),
    properties: JSON.stringify(pageData.properties || {}),
    createdAt: pageData.createdAt ? new Date(pageData.createdAt) : new Date(),
    updatedAt: pageData.updatedAt ? new Date(pageData.updatedAt) : new Date()
  };

  let page;
  if (existingPage && mergeStrategy === 'replace') {
    // Delete existing page and its blocks
    await prisma.block.deleteMany({
      where: { pageId: existingPage.id }
    });
    await prisma.page.delete({
      where: { id: existingPage.id }
    });
  }

  if (!existingPage || mergeStrategy === 'replace') {
    page = await prisma.page.create({
      data: pageToCreate
    });
    stats.pagesImported++;
  } else {
    page = existingPage;
  }

  // Import blocks for this page
  if (pageData.blocks && Array.isArray(pageData.blocks)) {
    for (const blockData of pageData.blocks) {
      try {
        await importBlock({
          ...blockData,
          pageId: page.id
        }, graphId, mergeStrategy, stats);
      } catch (error) {
        stats.errors.push(`Failed to import block in page "${pageData.name}": ${error.message}`);
      }
    }
  }
}

// Import a single block
async function importBlock(blockData: any, graphId: string, mergeStrategy: string, stats: any) {
  const existingBlock = await prisma.block.findFirst({
    where: {
      id: blockData.id,
      graphId
    }
  });

  if (existingBlock && mergeStrategy === 'skip') {
    stats.blocksSkipped++;
    return;
  }

  const blockToCreate = {
    id: blockData.id || `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content: blockData.content || '',
    pageId: blockData.pageId,
    graphId,
    parentId: blockData.parentId || null,
    order: blockData.order || 1,
    collapsed: blockData.collapsed || false,
    properties: JSON.stringify(blockData.properties || {}),
    createdAt: blockData.createdAt ? new Date(blockData.createdAt) : new Date(),
    updatedAt: blockData.updatedAt ? new Date(blockData.updatedAt) : new Date()
  };

  if (existingBlock && mergeStrategy === 'replace') {
    await prisma.block.update({
      where: { id: existingBlock.id },
      data: blockToCreate
    });
  } else if (!existingBlock) {
    await prisma.block.create({
      data: blockToCreate
    });
    stats.blocksImported++;
  }
}

// Parse Markdown to data structure
function parseMarkdownToData(markdown: string) {
  const lines = markdown.split('\n');
  const data: any = {
    version: '1.0',
    pages: []
  };

  let currentPage: any = null;
  let currentBlocks: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Page title (## Title)
    if (line.startsWith('## ')) {
      // Save previous page
      if (currentPage) {
        currentPage.blocks = currentBlocks;
        data.pages.push(currentPage);
      }

      // Start new page
      const title = line.substring(3).trim();
      currentPage = {
        id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: title,
        title: title,
        isJournal: false,
        tags: [],
        properties: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      currentBlocks = [];
    }
    // Block content (- Content or  - Content for indented)
    else if (line.match(/^(\s*)-\s+(.+)$/)) {
      const match = line.match(/^(\s*)-\s+(.+)$/);
      if (match && currentPage) {
        const indent = match[1].length;
        const content = match[2];
        
        currentBlocks.push({
          id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: content,
          order: currentBlocks.length + 1,
          parentId: null, // TODO: Handle parent-child relationships based on indent
          collapsed: false,
          properties: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
  }

  // Save last page
  if (currentPage) {
    currentPage.blocks = currentBlocks;
    data.pages.push(currentPage);
  }

  return data;
}

export { router as importRoutes };
