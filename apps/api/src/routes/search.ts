import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../services/database.js';

const router = Router();

// Validation schemas
const searchSchema = z.object({
  query: z.string().min(1),
  graphId: z.string().optional(),
  type: z.enum(['all', 'pages', 'blocks']).optional(),
  limit: z.number().min(1).max(100).optional()
});

// POST /api/search - Search pages and blocks
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = searchSchema.parse(req.body);
    const { query, graphId, type = 'all', limit = 20 } = validatedData;
    
    const results: any = {
      query,
      pages: [],
      blocks: [],
      total: 0
    };
    
    // Build where clause for graph filtering
    const graphFilter = graphId ? { graphId } : {};
    
    // Search pages
    if (type === 'all' || type === 'pages') {
      const pages = await prisma.page.findMany({
        where: {
          ...graphFilter,
          OR: [
            { name: { contains: query } },
            { title: { contains: query } },
            { tags: { contains: query } }
          ]
        },
        take: type === 'pages' ? limit : Math.ceil(limit / 2),
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { blocks: true }
          }
        }
      });
      
      results.pages = pages.map(page => ({
        ...page,
        type: 'page',
        relevance: calculatePageRelevance(page, query)
      }));
    }
    
    // Search blocks
    if (type === 'all' || type === 'blocks') {
      const blocks = await prisma.block.findMany({
        where: {
          ...graphFilter,
          content: { contains: query }
        },
        take: type === 'blocks' ? limit : Math.ceil(limit / 2),
        orderBy: { updatedAt: 'desc' },
        include: {
          page: {
            select: { id: true, name: true, title: true }
          },
          parent: {
            select: { id: true, content: true }
          }
        }
      });
      
      results.blocks = blocks.map(block => ({
        ...block,
        type: 'block',
        relevance: calculateBlockRelevance(block, query)
      }));
    }
    
    // Calculate total and sort by relevance
    results.total = results.pages.length + results.blocks.length;
    
    // Combine and sort all results by relevance
    const allResults = [...results.pages, ...results.blocks]
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        query,
        total: results.total,
        results: allResults,
        pages: results.pages,
        blocks: results.blocks
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid search parameters',
          details: error.errors
        }
      });
    }
    next(error);
  }
});

// GET /api/search/suggestions - Get search suggestions
router.get('/suggestions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q: query, graphId, limit = '10' } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query parameter "q" is required'
        }
      });
    }
    
    const graphFilter = graphId ? { graphId: graphId as string } : {};
    const limitNum = parseInt(limit as string);
    
    // Get page name suggestions
    const pageNames = await prisma.page.findMany({
      where: {
        ...graphFilter,
        name: { contains: query, mode: 'insensitive' }
      },
      select: { name: true, title: true },
      take: Math.ceil(limitNum / 2),
      orderBy: { updatedAt: 'desc' }
    });
    
    // Get unique tags that match
    const pages = await prisma.page.findMany({
      where: {
        ...graphFilter,
        tags: { has: query }
      },
      select: { tags: true },
      take: 50
    });
    
    const matchingTags = Array.from(
      new Set(
        pages.flatMap(page => 
          page.tags.filter(tag => 
            tag.toLowerCase().includes(query.toLowerCase())
          )
        )
      )
    ).slice(0, Math.floor(limitNum / 2));
    
    const suggestions = [
      ...pageNames.map(page => ({
        type: 'page',
        value: page.name,
        label: page.title || page.name
      })),
      ...matchingTags.map(tag => ({
        type: 'tag',
        value: tag,
        label: `#${tag}`
      }))
    ].slice(0, limitNum);
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/search/stats - Get search statistics
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { graphId } = req.query;
    
    const graphFilter = graphId ? { graphId: graphId as string } : {};
    
    const [pageCount, blockCount, tagCount] = await Promise.all([
      prisma.page.count({ where: graphFilter }),
      prisma.block.count({ where: graphFilter }),
      prisma.page.findMany({
        where: graphFilter,
        select: { tags: true }
      }).then(pages => 
        new Set(pages.flatMap(page => page.tags)).size
      )
    ]);
    
    res.json({
      success: true,
      data: {
        pages: pageCount,
        blocks: blockCount,
        tags: tagCount,
        total: pageCount + blockCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions for relevance calculation
function calculatePageRelevance(page: any, query: string): number {
  let score = 0;
  const lowerQuery = query.toLowerCase();
  
  // Exact name match gets highest score
  if (page.name.toLowerCase() === lowerQuery) {
    score += 100;
  } else if (page.name.toLowerCase().includes(lowerQuery)) {
    score += 50;
  }
  
  // Title match
  if (page.title?.toLowerCase().includes(lowerQuery)) {
    score += 30;
  }
  
  // Tag match
  if (page.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery))) {
    score += 20;
  }
  
  return score;
}

function calculateBlockRelevance(block: any, query: string): number {
  let score = 0;
  const lowerQuery = query.toLowerCase();
  const content = block.content.toLowerCase();
  
  // Exact content match
  if (content === lowerQuery) {
    score += 100;
  } else {
    // Count occurrences
    const occurrences = (content.match(new RegExp(lowerQuery, 'g')) || []).length;
    score += occurrences * 10;
    
    // Bonus for matches at the beginning
    if (content.startsWith(lowerQuery)) {
      score += 20;
    }
  }
  
  return score;
}

export { router as searchRoutes };
