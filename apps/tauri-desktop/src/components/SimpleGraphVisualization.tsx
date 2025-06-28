import React, { useRef, useEffect } from 'react';

interface GraphNode {
  id: string;
  label: string;
  type: 'note' | 'tag' | 'folder' | 'link';
  x?: number;
  y?: number;
  connections?: number;
  metadata?: Record<string, any>;
}

interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: 'reference' | 'tag' | 'hierarchy' | 'similarity';
  weight?: number;
  label?: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface SimpleGraphVisualizationProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  className?: string;
}

export const SimpleGraphVisualization: React.FC<SimpleGraphVisualizationProps> = ({
  data,
  onNodeClick,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = svgRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    // 清除之前的内容
    svg.innerHTML = '';
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());

    // 简单的力导向布局算法
    const nodes = data.nodes.map((node, index) => ({
      ...node,
      x: node.x || Math.random() * width,
      y: node.y || Math.random() * height,
      vx: 0,
      vy: 0,
    }));

    const links = data.links.map(link => ({
      ...link,
      source: nodes.find(n => n.id === link.source),
      target: nodes.find(n => n.id === link.target),
    })).filter(link => link.source && link.target);

    // 创建SVG元素
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(g);

    // 绘制链接
    links.forEach(link => {
      if (!link.source || !link.target) return;
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', '#999');
      line.setAttribute('stroke-opacity', '0.6');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('x1', link.source.x!.toString());
      line.setAttribute('y1', link.source.y!.toString());
      line.setAttribute('x2', link.target.x!.toString());
      line.setAttribute('y2', link.target.y!.toString());
      g.appendChild(line);
    });

    // 绘制节点
    nodes.forEach(node => {
      const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      nodeGroup.setAttribute('transform', `translate(${node.x},${node.y})`);
      nodeGroup.style.cursor = 'pointer';

      // 节点圆圈
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '8');
      circle.setAttribute('fill', getNodeColor(node.type));
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      
      // 节点标签
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('dx', '12');
      text.setAttribute('dy', '4');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-family', 'Arial, sans-serif');
      text.setAttribute('fill', '#333');
      text.textContent = node.label;

      nodeGroup.appendChild(circle);
      nodeGroup.appendChild(text);

      // 点击事件
      nodeGroup.addEventListener('click', () => {
        onNodeClick?.(node);
      });

      // 悬停效果
      nodeGroup.addEventListener('mouseenter', () => {
        circle.setAttribute('r', '10');
        circle.setAttribute('stroke-width', '3');
      });

      nodeGroup.addEventListener('mouseleave', () => {
        circle.setAttribute('r', '8');
        circle.setAttribute('stroke-width', '2');
      });

      g.appendChild(nodeGroup);
    });

    // 简单的力模拟
    const simulation = () => {
      for (let i = 0; i < 100; i++) {
        // 应用链接力
        links.forEach(link => {
          if (!link.source || !link.target) return;
          
          const dx = link.target.x! - link.source.x!;
          const dy = link.target.y! - link.source.y!;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const targetDistance = 100;
          
          if (distance > 0) {
            const force = (distance - targetDistance) * 0.1;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            link.source.vx += fx;
            link.source.vy += fy;
            link.target.vx -= fx;
            link.target.vy -= fy;
          }
        });

        // 应用排斥力
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const nodeA = nodes[i];
            const nodeB = nodes[j];
            const dx = nodeB.x! - nodeA.x!;
            const dy = nodeB.y! - nodeA.y!;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0 && distance < 50) {
              const force = 50 / (distance * distance);
              const fx = (dx / distance) * force;
              const fy = (dy / distance) * force;
              
              nodeA.vx -= fx;
              nodeA.vy -= fy;
              nodeB.vx += fx;
              nodeB.vy += fy;
            }
          }
        }

        // 更新位置
        nodes.forEach(node => {
          node.vx *= 0.9; // 阻尼
          node.vy *= 0.9;
          node.x! += node.vx;
          node.y! += node.vy;
          
          // 边界约束
          node.x! = Math.max(20, Math.min(width - 20, node.x!));
          node.y! = Math.max(20, Math.min(height - 20, node.y!));
        });
      }

      // 更新SVG元素位置
      const lines = g.querySelectorAll('line');
      const nodeGroups = g.querySelectorAll('g');

      links.forEach((link, index) => {
        if (!link.source || !link.target) return;
        const line = lines[index];
        if (line) {
          line.setAttribute('x1', link.source.x!.toString());
          line.setAttribute('y1', link.source.y!.toString());
          line.setAttribute('x2', link.target.x!.toString());
          line.setAttribute('y2', link.target.y!.toString());
        }
      });

      nodes.forEach((node, index) => {
        const group = nodeGroups[index];
        if (group) {
          group.setAttribute('transform', `translate(${node.x},${node.y})`);
        }
      });
    };

    simulation();

  }, [data, onNodeClick]);

  const getNodeColor = (type: string): string => {
    switch (type) {
      case 'note': return '#3b82f6';
      case 'tag': return '#10b981';
      case 'folder': return '#f59e0b';
      case 'link': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <svg
        ref={svgRef}
        className="w-full h-full border border-gray-200 rounded-lg bg-white"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};
