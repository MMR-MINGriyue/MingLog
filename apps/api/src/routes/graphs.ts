import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../services/database.js';

const router = Router();

// Validation schemas
const createGraphSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  settings: z.record(z.any()).optional()
});

const updateGraphSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  settings: z.record(z.any()).optional()
});

// GET /api/graphs - Get all graphs
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const graphs = await prisma.graph.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      data: graphs
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/graphs/:id - Get graph by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const graph = await prisma.graph.findUnique({
      where: { id }
    });
    
    if (!graph) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Graph not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: graph
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/graphs - Create new graph
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createGraphSchema.parse(req.body);
    
    const graph = await prisma.graph.create({
      data: {
        ...validatedData,
        settings: validatedData.settings || {}
      }
    });
    
    res.status(201).json({
      success: true,
      data: graph
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

// PUT /api/graphs/:id - Update graph
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateGraphSchema.parse(req.body);
    
    const graph = await prisma.graph.update({
      where: { id },
      data: validatedData
    });
    
    res.json({
      success: true,
      data: graph
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

// DELETE /api/graphs/:id - Delete graph
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    await prisma.graph.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Graph deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/graphs/:id/stats - Get graph statistics
router.get('/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if graph exists
    const graph = await prisma.graph.findUnique({
      where: { id }
    });
    
    if (!graph) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Graph not found'
        }
      });
    }
    
    // Get statistics
    const [pageCount, blockCount] = await Promise.all([
      prisma.page.count({ where: { graphId: id } }),
      prisma.block.count({ where: { graphId: id } })
    ]);
    
    res.json({
      success: true,
      data: {
        graphId: id,
        pageCount,
        blockCount,
        totalItems: pageCount + blockCount
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as graphRoutes };
