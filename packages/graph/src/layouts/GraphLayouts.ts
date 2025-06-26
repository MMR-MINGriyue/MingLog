import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink } from '../types';

/**
 * Graph layout algorithms
 */
export class GraphLayouts {
  /**
   * Apply force-directed layout
   */
  static forceDirected(
    data: GraphData,
    width: number,
    height: number,
    options: any = {}
  ): d3.Simulation<GraphNode, GraphLink> {
    const {
      linkDistance = 100,
      linkStrength = 0.5,
      chargeStrength = -300,
      centerForce = 0.1,
      collisionRadius = 12,
    } = options;

    return d3.forceSimulation<GraphNode>(data.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(data.links)
        .id(d => d.id)
        .distance(linkDistance)
        .strength(linkStrength)
      )
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(centerForce))
      .force('collision', d3.forceCollide().radius(collisionRadius));
  }

  /**
   * Apply hierarchical layout
   */
  static hierarchical(
    data: GraphData,
    width: number,
    height: number,
    options: any = {}
  ): GraphData {
    const {
      direction = 'top-to-bottom', // 'top-to-bottom', 'left-to-right'
      // levelSeparation = 100,
      nodeSeparation = 50,
    } = options;

    // Build hierarchy from graph data
    const hierarchy = this.buildHierarchy(data);
    
    if (!hierarchy) {
      return data; // Return original data if no hierarchy can be built
    }

    // Create tree layout
    const treeLayout = d3.tree<any>()
      .size(direction === 'top-to-bottom' ? [width, height] : [height, width])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) * nodeSeparation / 100);

    // Apply layout
    const root = treeLayout(hierarchy);

    // Update node positions
    const updatedNodes = data.nodes.map(node => {
      const treeNode = this.findNodeInTree(root, node.id);
      if (treeNode) {
        return {
          ...node,
          x: direction === 'top-to-bottom' ? treeNode.x : treeNode.y,
          y: direction === 'top-to-bottom' ? treeNode.y : treeNode.x,
          fx: direction === 'top-to-bottom' ? treeNode.x : treeNode.y,
          fy: direction === 'top-to-bottom' ? treeNode.y : treeNode.x,
        };
      }
      return node;
    });

    return { ...data, nodes: updatedNodes };
  }

  /**
   * Apply circular layout
   */
  static circular(
    data: GraphData,
    width: number,
    height: number,
    options: any = {}
  ): GraphData {
    const {
      radius = Math.min(width, height) / 2 - 50,
      startAngle = 0,
      endAngle = 2 * Math.PI,
    } = options;

    const centerX = width / 2;
    const centerY = height / 2;
    const angleStep = (endAngle - startAngle) / data.nodes.length;

    const updatedNodes = data.nodes.map((node, index) => {
      const angle = startAngle + index * angleStep;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        fx: centerX + radius * Math.cos(angle),
        fy: centerY + radius * Math.sin(angle),
      };
    });

    return { ...data, nodes: updatedNodes };
  }

  /**
   * Apply grid layout
   */
  static grid(
    data: GraphData,
    width: number,
    height: number,
    options: any = {}
  ): GraphData {
    const {
      columns = Math.ceil(Math.sqrt(data.nodes.length)),
      padding = 50,
    } = options;

    const rows = Math.ceil(data.nodes.length / columns);
    const cellWidth = (width - padding * 2) / columns;
    const cellHeight = (height - padding * 2) / rows;

    const updatedNodes = data.nodes.map((node, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      return {
        ...node,
        x: padding + col * cellWidth + cellWidth / 2,
        y: padding + row * cellHeight + cellHeight / 2,
        fx: padding + col * cellWidth + cellWidth / 2,
        fy: padding + row * cellHeight + cellHeight / 2,
      };
    });

    return { ...data, nodes: updatedNodes };
  }

  /**
   * Apply radial layout (nodes arranged in concentric circles)
   */
  static radial(
    data: GraphData,
    width: number,
    height: number,
    options: any = {}
  ): GraphData {
    const {
      maxRadius = Math.min(width, height) / 2 - 50,
      minRadius = 50,
      levels = 3,
    } = options;

    const centerX = width / 2;
    const centerY = height / 2;

    // Group nodes by connection count (or other criteria)
    const nodesByLevel = this.groupNodesByLevel(data.nodes, levels);
    const radiusStep = (maxRadius - minRadius) / (levels - 1);

    const updatedNodes: GraphNode[] = [];

    nodesByLevel.forEach((levelNodes, levelIndex) => {
      const radius = levelIndex === 0 ? 0 : minRadius + levelIndex * radiusStep;
      const angleStep = levelNodes.length > 1 ? (2 * Math.PI) / levelNodes.length : 0;

      levelNodes.forEach((node, nodeIndex) => {
        if (levelIndex === 0) {
          // Center node
          updatedNodes.push({
            ...node,
            x: centerX,
            y: centerY,
            fx: centerX,
            fy: centerY,
          });
        } else {
          const angle = nodeIndex * angleStep;
          updatedNodes.push({
            ...node,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            fx: centerX + radius * Math.cos(angle),
            fy: centerY + radius * Math.sin(angle),
          });
        }
      });
    });

    return { ...data, nodes: updatedNodes };
  }

  /**
   * Build hierarchy from graph data
   */
  private static buildHierarchy(data: GraphData): d3.HierarchyNode<any> | null {
    // Find root nodes (nodes with no incoming hierarchy links)
    const incomingLinks = new Set<string>();
    data.links.forEach(link => {
      if (link.type === 'hierarchy') {
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        incomingLinks.add(targetId);
      }
    });

    const rootNodes = data.nodes.filter(node => !incomingLinks.has(node.id));
    
    if (rootNodes.length === 0) {
      return null; // No clear hierarchy
    }

    // Use the first root node or create a virtual root
    const root = rootNodes.length === 1 ? rootNodes[0] : {
      id: 'virtual-root',
      label: 'Root',
      type: 'folder' as const,
      children: rootNodes,
    };

    // Build tree structure
    const buildTree = (node: any): any => {
      const children = data.links
        .filter(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
          return sourceId === node.id && link.type === 'hierarchy';
        })
        .map(link => {
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;
          return data.nodes.find(n => n.id === targetId);
        })
        .filter(Boolean)
        .map(buildTree);

      return {
        ...node,
        children: children.length > 0 ? children : undefined,
      };
    };

    return d3.hierarchy(buildTree(root));
  }

  /**
   * Find node in tree by ID
   */
  private static findNodeInTree(root: d3.HierarchyPointNode<any>, nodeId: string): d3.HierarchyPointNode<any> | null {
    if (root.data.id === nodeId) {
      return root;
    }

    if (root.children) {
      for (const child of root.children) {
        const found = this.findNodeInTree(child, nodeId);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Group nodes by level based on connection count
   */
  private static groupNodesByLevel(nodes: GraphNode[], levels: number): GraphNode[][] {
    // Sort nodes by connection count
    const sortedNodes = [...nodes].sort((a, b) => (b.connections || 0) - (a.connections || 0));
    
    const result: GraphNode[][] = Array.from({ length: levels }, () => []);
    const nodesPerLevel = Math.ceil(nodes.length / levels);

    sortedNodes.forEach((node, index) => {
      const level = Math.min(Math.floor(index / nodesPerLevel), levels - 1);
      result[level].push(node);
    });

    return result;
  }
}
