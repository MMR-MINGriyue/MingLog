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

    // Process nodes
    if (rawData.notes) {
      rawData.notes.forEach((note: any) => {
        const node: GraphNode = {
          id: note.id,
          label: note.title || note.name,
          type: 'note',
          size: this.calculateNodeSize(note),
          metadata: {
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            tags: note.tags || [],
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
            noteCount: tag.noteCount || 0,
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

    // Generate tag-note links
    rawData.notes?.forEach((note: any) => {
      note.tags?.forEach((tagId: string) => {
        const tagNodeId = `tag-${tagId}`;
        if (nodeMap.has(tagNodeId)) {
          links.push({
            id: `${note.id}-${tagNodeId}`,
            source: note.id,
            target: tagNodeId,
            type: 'tag',
            weight: 0.5,
          });
        }
      });
    });

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
   * Calculate node size based on content or connections
   */
  private static calculateNodeSize(node: any): number {
    const baseSize = 5;
    const contentLength = node.content?.length || 0;
    const connectionCount = node.connections || 0;
    
    // Size based on content length and connections
    const contentFactor = Math.min(contentLength / 1000, 3);
    const connectionFactor = Math.min(connectionCount / 10, 2);
    
    return baseSize + contentFactor + connectionFactor;
  }

  /**
   * Calculate tag size based on usage
   */
  private static calculateTagSize(tag: any): number {
    const baseSize = 4;
    const noteCount = tag.noteCount || 0;
    const usageFactor = Math.min(noteCount / 5, 3);
    
    return baseSize + usageFactor;
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
