import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../services/database.js';

const router = Router();

// Validation schemas
const createPageSchema = z.object({
  name: z.string().min(1).max(255),
  title: z.string().optional(),
  graphId: z.string(),
  tags: z.array(z.string()).optional(),
  isJournal: z.boolean().optional(),
  journalDate: z.string().optional(),
  properties: z.record(z.any()).optional()
});

const updatePageSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isJournal: z.boolean().optional(),
  journalDate: z.string().optional(),
  properties: z.record(z.any()).optional()
});

// GET /api/pages - Get all pages with optional filtering
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { graphId, isJournal, tag, limit = '50', offset = '0' } = req.query;
    
    const where: any = {};
    
    if (graphId) {
      where.graphId = graphId as string;
    }
    
    if (isJournal !== undefined) {
      where.isJournal = isJournal === 'true';
    }
    
    if (tag) {
      where.tags = {
        has: tag as string
      };
    }
    
    const pages = await prisma.page.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        _count: {
          select: { blocks: true }
        }
      }
    });
    
    const total = await prisma.page.count({ where });
    
    res.json({
      success: true,
      data: pages,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + pages.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/pages/:id - Get page by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { includeBlocks = 'false' } = req.query;
    
    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        blocks: includeBlocks === 'true' ? {
          orderBy: { order: 'asc' }
        } : false,
        _count: {
          select: { blocks: true }
        }
      }
    });
    
    if (!page) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Page not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: page
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/pages - Create new page
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createPageSchema.parse(req.body);
    
    const page = await prisma.page.create({
      data: {
        ...validatedData,
        title: validatedData.title || validatedData.name,
        tags: JSON.stringify(validatedData.tags || []),
        properties: JSON.stringify(validatedData.properties || {}),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    res.status(201).json({
      success: true,
      data: page
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }
    next(error);
  }
});

// PUT /api/pages/:id - Update page
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updatePageSchema.parse(req.body);
    
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date()
    };

    // Serialize arrays and objects for SQLite
    if (validatedData.tags) {
      updateData.tags = JSON.stringify(validatedData.tags);
    }
    if (validatedData.properties) {
      updateData.properties = JSON.stringify(validatedData.properties);
    }

    const page = await prisma.page.update({
      where: { id },
      data: updateData
    });
    
    res.json({
      success: true,
      data: page
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }
    next(error);
  }
});

// DELETE /api/pages/:id - Delete page
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Delete page and all its blocks (cascade)
    await prisma.page.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Page deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/pages/journal/today - Create or get today's journal page
router.post('/journal/today', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { graphId } = req.body;
    
    if (!graphId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'graphId is required'
        }
      });
    }
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const journalName = today;
    const journalTitle = `Journal - ${today}`;
    
    // Try to find existing journal page
    let page = await prisma.page.findFirst({
      where: {
        graphId,
        isJournal: true,
        journalDate: today
      }
    });
    
    // Create if doesn't exist
    if (!page) {
      page = await prisma.page.create({
        data: {
          name: journalName,
          title: journalTitle,
          graphId,
          isJournal: true,
          journalDate: today,
          tags: JSON.stringify([]),
          properties: JSON.stringify({}),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    res.json({
      success: true,
      data: page
    });
  } catch (error) {
    next(error);
  }
});

export { router as pageRoutes };
