import { GraphData, GraphNode, GraphLink, GraphFilter } from '../types';

/**
 * Graph data processing utilities
 */
export class GraphDataProcessor {
  /**
   * Process raw data into graph format
   */
  static processData(rawData: any): GraphData {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    // Process page nodes
    if (rawData.pages) {
      rawData.pages.forEach((page: any) => {
        const node: GraphNode = {
          id: page.id,
          label: page.title || page.name,
          type: 'note', // Keep as 'note' for compatibility with existing themes
          size: this.calculatePageSize(page),
          metadata: {
            name: page.name,
            title: page.title,
            isJournal: page.is_journal,
            createdAt: page.created_at,
            updatedAt: page.updated_at,
            tags: this.parseTags(page.tags),
            blockCount: rawData.blocks ? rawData.blocks.filter((b: any) => b.page_id === page.id).length : 0,
          },
        };
        nodes.push(node);
        nodeMap.set(node.id, node);
      });
    }

    // Process block nodes (optional - can be enabled for detailed view)
    if (rawData.blocks && rawData.includeBlocks) {
      rawData.blocks.forEach((block: any) => {
        const node: GraphNode = {
          id: `block-${block.id}`,
          label: this.extractBlockTitle(block.content),
          type: 'link', // Use 'link' type for blocks to differentiate from pages
          size: this.calculateBlockSize(block),
          metadata: {
            content: block.content,
            pageId: block.page_id,
            parentId: block.parent_id,
            createdAt: block.created_at,
            updatedAt: block.updated_at,
            refs: this.parseRefs(block.refs),
            order: block.order,
          },
        };
        nodes.push(node);
        nodeMap.set(node.id, node);
      });
    }

    // Process tags as nodes
    if (rawData.tags) {
      rawData.tags.forEach((tag: any) => {
        const node: GraphNode = {
          id: `tag-${tag.id}`,
          label: tag.name,
          type: 'tag',
          size: this.calculateTagSize(tag),
          metadata: {
            description: tag.description,
            color: tag.color,
            pageCount: this.countPagesWithTag(rawData.pages || [], tag.name),
          },
        };
        nodes.push(node);
        nodeMap.set(node.id, node);
      });
    }

    // Process links
    if (rawData.links) {
      rawData.links.forEach((link: any) => {
        if (nodeMap.has(link.source) && nodeMap.has(link.target)) {
          const graphLink: GraphLink = {
            id: `${link.source}-${link.target}`,
            source: link.source,
            target: link.target,
            type: link.type || 'reference',
            weight: link.weight || 1,
            metadata: link.metadata || {},
          };
          links.push(graphLink);
        }
      });
    }

    // Generate tag-page links
    rawData.pages?.forEach((page: any) => {
      const pageTags = this.parseTags(page.tags);
      pageTags.forEach((tagName: string) => {
        // Find tag node by name
        const tagNode = nodes.find(n => n.type === 'tag' && n.label === tagName);
        if (tagNode) {
          links.push({
            id: `${page.id}-${tagNode.id}`,
            source: page.id,
            target: tagNode.id,
            type: 'tag',
            weight: 0.5,
          });
        }
      });
    });

    // Generate block-page hierarchy links
    if (rawData.blocks && rawData.includeBlocks) {
      rawData.blocks.forEach((block: any) => {
        const blockNodeId = `block-${block.id}`;
        if (nodeMap.has(blockNodeId) && nodeMap.has(block.page_id)) {
          links.push({
            id: `${blockNodeId}-${block.page_id}`,
            source: blockNodeId,
            target: block.page_id,
            type: 'hierarchy',
            weight: 0.8,
          });
        }

        // Generate parent-child block links
        if (block.parent_id) {
          const parentBlockNodeId = `block-${block.parent_id}`;
          if (nodeMap.has(parentBlockNodeId)) {
            links.push({
              id: `${parentBlockNodeId}-${blockNodeId}`,
              source: parentBlockNodeId,
              target: blockNodeId,
              type: 'hierarchy',
              weight: 0.7,
            });
          }
        }
      });
    }

    // Generate reference links from block refs
    if (rawData.blocks) {
      rawData.blocks.forEach((block: any) => {
        const refs = this.parseRefs(block.refs);
        refs.forEach((ref: string) => {
          // Try to find referenced page
          const referencedPage = rawData.pages?.find((p: any) =>
            p.name.toLowerCase() === ref.toLowerCase() ||
            p.title?.toLowerCase() === ref.toLowerCase()
          );

          if (referencedPage) {
            const sourceId = rawData.includeBlocks ? `block-${block.id}` : block.page_id;
            if (nodeMap.has(sourceId) && nodeMap.has(referencedPage.id)) {
              links.push({
                id: `${sourceId}-${referencedPage.id}`,
                source: sourceId,
                target: referencedPage.id,
                type: 'reference',
                weight: 1.0,
              });
            }
          }
        });
      });
    }

    // Calculate node connections
    this.calculateConnections(nodes, links);

    return { nodes, links };
  }

  /**
   * Filter graph data based on criteria
   */
  static filterData(data: GraphData, filter: GraphFilter): GraphData {
    let filteredNodes = [...data.nodes];
    let filteredLinks = [...data.links];

    // Filter by node types
    if (filter.nodeTypes && filter.nodeTypes.length > 0) {
      filteredNodes = filteredNodes.filter(node => 
        filter.nodeTypes!.includes(node.type)
      );
    }

    // Filter by link types
    if (filter.linkTypes && filter.linkTypes.length > 0) {
      filteredLinks = filteredLinks.filter(link => 
        filter.linkTypes!.includes(link.type)
      );
    }

    // Filter by connection count
    if (filter.minConnections !== undefined || filter.maxConnections !== undefined) {
      filteredNodes = filteredNodes.filter(node => {
        const connections = node.connections || 0;
        if (filter.minConnections !== undefined && connections < filter.minConnections) {
          return false;
        }
        if (filter.maxConnections !== undefined && connections > filter.maxConnections) {
          return false;
        }
        return true;
      });
    }

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter(node =>
        node.label.toLowerCase().includes(query) ||
        (node.metadata?.content && node.metadata.content.toLowerCase().includes(query))
      );
    }

    // Filter links to only include those between remaining nodes
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    filteredLinks = filteredLinks.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }

  /**
   * Calculate tag size based on usage
   */
  private static calculateTagSize(tag: any): number {
    const baseSize = 4;
    const pageCount = tag.pageCount || 0;
    const usageFactor = Math.min(pageCount / 5, 3);

    return baseSize + usageFactor;
  }

  /**
   * Calculate page size based on content and blocks
   */
  private static calculatePageSize(page: any): number {
    const baseSize = 6;
    const blockCount = page.blockCount || 0;
    const isJournal = page.is_journal ? 1 : 0;

    // Size based on block count and type
    const blockFactor = Math.min(blockCount / 10, 4);
    const journalFactor = isJournal * 0.5;

    return baseSize + blockFactor + journalFactor;
  }

  /**
   * Calculate block size based on content
   */
  private static calculateBlockSize(block: any): number {
    const baseSize = 3;
    const contentLength = block.content?.length || 0;
    const hasParent = block.parent_id ? 0.5 : 0;

    // Size based on content length
    const contentFactor = Math.min(contentLength / 500, 2);

    return baseSize + contentFactor + hasParent;
  }

  /**
   * Parse tags from JSON string
   */
  private static parseTags(tagsJson: string): string[] {
    try {
      return JSON.parse(tagsJson || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Parse refs from JSON string
   */
  private static parseRefs(refsJson: string): string[] {
    try {
      return JSON.parse(refsJson || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Extract title from block content
   */
  private static extractBlockTitle(content: string): string {
    // Remove HTML tags and get first line or first 30 characters
    const text = content.replace(/<[^>]*>/g, '').trim();
    const firstLine = text.split('\n')[0];
    return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine || 'Block';
  }

  /**
   * Count pages that have a specific tag
   */
  private static countPagesWithTag(pages: any[], tagName: string): number {
    return pages.filter(page => {
      const tags = this.parseTags(page.tags);
      return tags.includes(tagName);
    }).length;
  }

  /**
   * Calculate connection count for each node
   */
  private static calculateConnections(nodes: GraphNode[], links: GraphLink[]): void {
    const connectionCount = new Map<string, number>();
    
    // Initialize counts
    nodes.forEach(node => {
      connectionCount.set(node.id, 0);
    });
    
    // Count connections
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      connectionCount.set(sourceId, (connectionCount.get(sourceId) || 0) + 1);
      connectionCount.set(targetId, (connectionCount.get(targetId) || 0) + 1);
    });
    
    // Update node objects
    nodes.forEach(node => {
      node.connections = connectionCount.get(node.id) || 0;
    });
  }

  /**
   * Generate similarity links based on content
   */
  static generateSimilarityLinks(nodes: GraphNode[], threshold: number = 0.3): GraphLink[] {
    const links: GraphLink[] = [];
    const noteNodes = nodes.filter(node => node.type === 'note');
    
    for (let i = 0; i < noteNodes.length; i++) {
      for (let j = i + 1; j < noteNodes.length; j++) {
        const similarity = this.calculateSimilarity(noteNodes[i], noteNodes[j]);
        if (similarity >= threshold) {
          links.push({
            id: `similarity-${noteNodes[i].id}-${noteNodes[j].id}`,
            source: noteNodes[i].id,
            target: noteNodes[j].id,
            type: 'similarity',
            weight: similarity,
            metadata: { similarity },
          });
        }
      }
    }
    
    return links;
  }

  /**
   * Calculate similarity between two nodes
   */
  private static calculateSimilarity(node1: GraphNode, node2: GraphNode): number {
    // Simple similarity based on shared tags and content keywords
    const tags1 = new Set(node1.metadata?.tags || []);
    const tags2 = new Set(node2.metadata?.tags || []);
    
    const sharedTags = new Set([...tags1].filter(tag => tags2.has(tag)));
    const totalTags = new Set([...tags1, ...tags2]);
    
    const tagSimilarity = totalTags.size > 0 ? sharedTags.size / totalTags.size : 0;
    
    // Content similarity (simplified)
    const content1 = (node1.metadata?.content || '').toLowerCase();
    const content2 = (node2.metadata?.content || '').toLowerCase();
    
    const words1 = new Set(content1.split(/\s+/).filter((word: string) => word.length > 3));
    const words2 = new Set(content2.split(/\s+/).filter((word: string) => word.length > 3));
    
    const sharedWords = new Set([...words1].filter(word => words2.has(word)));
    const totalWords = new Set([...words1, ...words2]);
    
    const contentSimilarity = totalWords.size > 0 ? sharedWords.size / totalWords.size : 0;
    
    // Weighted combination
    return tagSimilarity * 0.6 + contentSimilarity * 0.4;
  }
}
