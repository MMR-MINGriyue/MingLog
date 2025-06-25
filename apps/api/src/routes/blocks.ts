import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../services/database.js';

const router = Router();

// Validation schemas
const createBlockSchema = z.object({
  content: z.string(),
  pageId: z.string(),
  graphId: z.string(),
  parentId: z.string().optional(),
  order: z.number().optional(),
  properties: z.record(z.any()).optional()
});

const updateBlockSchema = z.object({
  content: z.string().optional(),
  order: z.number().optional(),
  collapsed: z.boolean().optional(),
  properties: z.record(z.any()).optional()
});

const moveBlockSchema = z.object({
  parentId: z.string().optional(),
  order: z.number(),
  pageId: z.string().optional()
});

// GET /api/blocks - Get blocks with filtering
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pageId, graphId, parentId, limit = '100', offset = '0' } = req.query;
    
    const where: any = {};
    
    if (pageId) {
      where.pageId = pageId as string;
    }
    
    if (graphId) {
      where.graphId = graphId as string;
    }
    
    if (parentId) {
      where.parentId = parentId as string;
    } else if (parentId === 'null') {
      where.parentId = null;
    }
    
    const blocks = await prisma.block.findMany({
      where,
      orderBy: { order: 'asc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        children: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { children: true }
        }
      }
    });
    
    const total = await prisma.block.count({ where });
    
    res.json({
      success: true,
      data: blocks,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + blocks.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/blocks/:id - Get block by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { includeChildren = 'false' } = req.query;
    
    const block = await prisma.block.findUnique({
      where: { id },
      include: {
        children: includeChildren === 'true' ? {
          orderBy: { order: 'asc' }
        } : false,
        parent: true,
        page: true,
        _count: {
          select: { children: true }
        }
      }
    });
    
    if (!block) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Block not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: block
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/blocks - Create new block
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createBlockSchema.parse(req.body);
    
    // Get the next order number if not provided
    let order = validatedData.order;
    if (order === undefined) {
      const lastBlock = await prisma.block.findFirst({
        where: {
          pageId: validatedData.pageId,
          parentId: validatedData.parentId || null
        },
        orderBy: { order: 'desc' }
      });
      order = (lastBlock?.order || 0) + 1;
    }
    
    const block = await prisma.block.create({
      data: {
        ...validatedData,
        order,
        properties: JSON.stringify(validatedData.properties || {}),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: { children: true }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: block
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

// PUT /api/blocks/:id - Update block
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateBlockSchema.parse(req.body);
    
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date()
    };

    // Serialize properties for SQLite
    if (validatedData.properties) {
      updateData.properties = JSON.stringify(validatedData.properties);
    }

    const block = await prisma.block.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { children: true }
        }
      }
    });
    
    res.json({
      success: true,
      data: block
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

// DELETE /api/blocks/:id - Delete block
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Delete block and all its children (cascade)
    await prisma.block.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Block deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/blocks/:id/move - Move block to new position
router.post('/:id/move', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = moveBlockSchema.parse(req.body);
    
    const block = await prisma.block.update({
      where: { id },
      data: {
        parentId: validatedData.parentId || null,
        order: validatedData.order,
        pageId: validatedData.pageId,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: { children: true }
        }
      }
    });
    
    res.json({
      success: true,
      data: block
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

// POST /api/blocks/:id/toggle-collapse - Toggle block collapse state
router.post('/:id/toggle-collapse', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Get current block
    const currentBlock = await prisma.block.findUnique({
      where: { id },
      select: { collapsed: true }
    });
    
    if (!currentBlock) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Block not found'
        }
      });
    }
    
    // Toggle collapse state
    const block = await prisma.block.update({
      where: { id },
      data: {
        collapsed: !currentBlock.collapsed,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: { children: true }
        }
      }
    });
    
    res.json({
      success: true,
      data: block
    });
  } catch (error) {
    next(error);
  }
});

export { router as blockRoutes };
