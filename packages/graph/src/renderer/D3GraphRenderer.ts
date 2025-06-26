import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink, GraphConfig, GraphEvents, GraphTheme } from '../types';

/**
 * D3.js-based graph renderer
 */
export class D3GraphRenderer {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private container: d3.Selection<SVGGElement, unknown, null, undefined>;
  private simulation: d3.Simulation<GraphNode, GraphLink>;
  private config: GraphConfig;
  private events: GraphEvents;
  private theme: GraphTheme;
  // private data: GraphData;

  constructor(
    element: HTMLElement,
    config: GraphConfig,
    events: GraphEvents = {},
    theme: GraphTheme
  ) {
    this.config = config;
    this.events = events;
    this.theme = theme;
    // this.data = { nodes: [], links: [] };

    // Create SVG
    this.svg = d3.select(element)
      .append('svg')
      .attr('width', config.width)
      .attr('height', config.height)
      .style('background-color', theme.background);

    // Create container for zoom/pan
    this.container = this.svg.append('g');

    // Setup zoom behavior
    if (config.enableZoom) {
      this.setupZoom();
    }

    // Initialize simulation
    this.simulation = d3.forceSimulation<GraphNode>()
      .force('link', d3.forceLink<GraphNode, GraphLink>()
        .id(d => d.id)
        .distance(config.linkDistance)
        .strength(config.linkStrength)
      )
      .force('charge', d3.forceManyBody().strength(config.chargeStrength))
      .force('center', d3.forceCenter(config.width / 2, config.height / 2).strength(config.centerForce))
      .force('collision', d3.forceCollide().radius(config.collisionRadius));

    // Setup background click
    this.svg.on('click', (event) => {
      if (event.target === this.svg.node()) {
        this.events.onBackgroundClick?.(event);
      }
    });
  }

  /**
   * Render graph data
   */
  render(data: GraphData): void {
    // this.data = data;

    // Clear existing elements
    this.container.selectAll('*').remove();

    // Create links
    const linkSelection = this.container
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', d => this.getLinkColor(d))
      .attr('stroke-width', d => Math.sqrt(d.weight || 1) * 2)
      .attr('stroke-opacity', 0.6)
      .on('click', (event, d) => {
        event.stopPropagation();
        this.events.onLinkClick?.(d, event);
      })
      .on('mouseover', (event, d) => {
        this.events.onLinkHover?.(d, event);
      })
      .on('mouseout', (event) => {
        this.events.onLinkHover?.(null, event);
      });

    // Create nodes
    const nodeSelection = this.container
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('r', d => d.size || this.config.nodeRadius)
      .attr('fill', d => this.getNodeColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('click', (event, d) => {
        event.stopPropagation();
        this.events.onNodeClick?.(d, event);
      })
      .on('mouseover', (event, d) => {
        this.events.onNodeHover?.(d, event);
      })
      .on('mouseout', (event) => {
        this.events.onNodeHover?.(null, event);
      });

    // Add drag behavior
    if (this.config.enableDrag) {
      nodeSelection.call(this.createDragBehavior());
    }

    // Create labels
    if (this.config.showLabels) {
      const labelSelection = this.container
        .append('g')
        .attr('class', 'labels')
        .selectAll('text')
        .data(data.nodes)
        .enter()
        .append('text')
        .text(d => d.label)
        .attr('font-size', '12px')
        .attr('font-family', 'Arial, sans-serif')
        .attr('fill', this.theme.textColor)
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .style('pointer-events', 'none');

      // Position labels
      this.simulation.on('tick', () => {
        linkSelection
          .attr('x1', d => (d.source as GraphNode).x!)
          .attr('y1', d => (d.source as GraphNode).y!)
          .attr('x2', d => (d.target as GraphNode).x!)
          .attr('y2', d => (d.target as GraphNode).y!);

        nodeSelection
          .attr('cx', d => d.x!)
          .attr('cy', d => d.y!);

        labelSelection
          .attr('x', d => d.x!)
          .attr('y', d => d.y! + (d.size || this.config.nodeRadius) + 15);
      });
    } else {
      // Position without labels
      this.simulation.on('tick', () => {
        linkSelection
          .attr('x1', d => (d.source as GraphNode).x!)
          .attr('y1', d => (d.source as GraphNode).y!)
          .attr('x2', d => (d.target as GraphNode).x!)
          .attr('y2', d => (d.target as GraphNode).y!);

        nodeSelection
          .attr('cx', d => d.x!)
          .attr('cy', d => d.y!);
      });
    }

    // Update simulation
    this.simulation.nodes(data.nodes);
    (this.simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>)?.links(data.links);
    this.simulation.alpha(1).restart();
  }

  /**
   * Update graph configuration
   */
  updateConfig(config: Partial<GraphConfig>): void {
    this.config = { ...this.config, ...config };

    // Update SVG size
    if (config.width || config.height) {
      this.svg
        .attr('width', this.config.width)
        .attr('height', this.config.height);

      // Update center force
      this.simulation.force('center', 
        d3.forceCenter(this.config.width / 2, this.config.height / 2)
          .strength(this.config.centerForce)
      );
    }

    // Update forces
    if (config.linkDistance !== undefined || config.linkStrength !== undefined) {
      (this.simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>)
        ?.distance(this.config.linkDistance)
        .strength(this.config.linkStrength);
    }

    if (config.chargeStrength !== undefined) {
      (this.simulation.force('charge') as d3.ForceManyBody<GraphNode>)
        ?.strength(this.config.chargeStrength);
    }

    if (config.collisionRadius !== undefined) {
      (this.simulation.force('collision') as d3.ForceCollide<GraphNode>)
        ?.radius(this.config.collisionRadius);
    }

    // Restart simulation
    this.simulation.alpha(0.3).restart();
  }

  /**
   * Highlight nodes and links
   */
  highlight(nodeIds: string[], linkIds: string[] = []): void {
    // Reset all highlights
    this.container.selectAll('circle')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 1);

    this.container.selectAll('line')
      .attr('opacity', 0.6);

    // Highlight selected nodes
    this.container.selectAll('circle')
      .filter((d: any) => nodeIds.includes(d.id))
      .attr('stroke', this.theme.nodeColors.selected)
      .attr('stroke-width', 4);

    // Highlight selected links
    this.container.selectAll('line')
      .filter((d: any) => linkIds.includes(d.id))
      .attr('stroke', this.theme.linkColors.selected)
      .attr('opacity', 1);

    // Dim non-selected elements if any are selected
    if (nodeIds.length > 0 || linkIds.length > 0) {
      this.container.selectAll('circle')
        .filter((d: any) => !nodeIds.includes(d.id))
        .attr('opacity', 0.3);

      this.container.selectAll('line')
        .filter((d: any) => !linkIds.includes(d.id))
        .attr('opacity', 0.1);
    }
  }

  /**
   * Get node color based on type and theme
   */
  private getNodeColor(node: GraphNode): string {
    return node.color || this.theme.nodeColors[node.type] || this.theme.nodeColors.note;
  }

  /**
   * Get link color based on type and theme
   */
  private getLinkColor(link: GraphLink): string {
    return link.color || this.theme.linkColors[link.type] || this.theme.linkColors.reference;
  }

  /**
   * Setup zoom behavior
   */
  private setupZoom(): void {
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        this.container.attr('transform', event.transform);
        this.events.onZoom?.(event.transform);
      });

    this.svg.call(zoom);
  }

  /**
   * Create drag behavior for nodes
   */
  private createDragBehavior() {
    return d3.drag<SVGCircleElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }

  /**
   * Destroy renderer and cleanup
   */
  destroy(): void {
    this.simulation.stop();
    this.svg.remove();
  }
}
