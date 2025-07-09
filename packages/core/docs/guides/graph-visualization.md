# 图谱可视化使用指南

## 概述

MingLog 的图谱可视化功能提供了直观的方式来查看和分析知识网络中的链接关系。通过交互式图谱，您可以：

- 可视化页面和块之间的连接关系
- 发现知识结构中的模式和集群
- 快速导航到相关内容
- 分析信息的重要性和影响力

## 快速开始

### 基本使用

```typescript
import { LinkGraphComponent } from '@minglog/core';

// 准备图谱数据
const graphData = {
  nodes: [
    { id: 'page1', type: 'page', title: '机器学习基础' },
    { id: 'page2', type: 'page', title: '深度学习' },
    { id: 'page3', type: 'page', title: '神经网络' }
  ],
  edges: [
    { id: 'edge1', source: 'page1', target: 'page2', type: 'page-reference' },
    { id: 'edge2', source: 'page2', target: 'page3', type: 'page-reference' }
  ]
};

// 渲染图谱
function KnowledgeGraph() {
  return (
    <LinkGraphComponent
      data={graphData}
      width={800}
      height={600}
      layout="force"
      enableDrag={true}
      enableZoom={true}
    />
  );
}
```

### 完整示例

```typescript
import React, { useState, useEffect } from 'react';
import { 
  LinkGraphComponent, 
  GraphControlPanel,
  LinkGraphContainer 
} from '@minglog/core';

function AdvancedKnowledgeGraph() {
  const [graphData, setGraphData] = useState(null);
  const [layout, setLayout] = useState('force');
  const [filters, setFilters] = useState({
    nodeTypes: ['page', 'block'],
    edgeTypes: ['page-reference', 'block-reference'],
    minConnections: 0
  });

  useEffect(() => {
    // 加载图谱数据
    loadGraphData().then(setGraphData);
  }, []);

  const handleNodeClick = (node) => {
    console.log('点击节点:', node);
    // 导航到对应页面或显示详情
  };

  const handleExport = (format) => {
    console.log('导出格式:', format);
    // 执行导出操作
  };

  if (!graphData) {
    return <div>加载中...</div>;
  }

  return (
    <LinkGraphContainer
      data={graphData}
      layout={layout}
      filters={filters}
      onLayoutChange={setLayout}
      onFiltersChange={setFilters}
      onNodeClick={handleNodeClick}
      onExport={handleExport}
    />
  );
}
```

## 布局算法

### 1. 力导向布局 (Force-Directed)

**特点：**
- 节点之间通过物理力相互作用
- 自动形成自然的聚类
- 适合展示复杂的网络结构

**适用场景：**
- 探索性分析
- 发现隐藏的关联
- 大型知识网络

**配置选项：**
```typescript
const forceConfig = {
  layout: 'force',
  forceStrength: -300,
  linkDistance: 100,
  centerForce: 0.1
};
```

### 2. 层次布局 (Hierarchical)

**特点：**
- 按层级结构排列节点
- 清晰的上下级关系
- 适合展示有明确层次的内容

**适用场景：**
- 知识体系结构
- 分类目录
- 概念层次

**配置选项：**
```typescript
const hierarchyConfig = {
  layout: 'hierarchy',
  direction: 'top-to-bottom', // 'left-to-right', 'bottom-to-top', 'right-to-left'
  levelSeparation: 100,
  nodeSeparation: 50
};
```

### 3. 圆形布局 (Circular)

**特点：**
- 节点沿圆形排列
- 结构清晰，易于理解
- 适合中小型网络

**适用场景：**
- 概念关系图
- 小型知识集群
- 演示和展示

**配置选项：**
```typescript
const circularConfig = {
  layout: 'circular',
  radius: 200,
  startAngle: 0,
  endAngle: 2 * Math.PI
};
```

### 4. 网格布局 (Grid)

**特点：**
- 节点按网格排列
- 整齐有序
- 便于比较和查找

**适用场景：**
- 内容目录
- 标签云
- 规整的展示需求

**配置选项：**
```typescript
const gridConfig = {
  layout: 'grid',
  columns: 5,
  rowSpacing: 100,
  columnSpacing: 100
};
```

## 交互功能

### 节点交互

```typescript
// 节点点击事件
const handleNodeClick = (node) => {
  // 导航到页面
  if (node.type === 'page') {
    navigateToPage(node.id);
  }
  // 显示块内容
  else if (node.type === 'block') {
    showBlockContent(node.id);
  }
};

// 节点悬停事件
const handleNodeHover = (node) => {
  if (node) {
    // 显示预览信息
    showNodePreview(node);
  } else {
    // 隐藏预览
    hideNodePreview();
  }
};

// 节点双击事件
const handleNodeDoubleClick = (node) => {
  // 聚焦到该节点
  focusOnNode(node.id);
};
```

### 边交互

```typescript
// 边点击事件
const handleEdgeClick = (edge) => {
  // 显示链接详情
  showLinkDetails(edge);
};

// 边悬停事件
const handleEdgeHover = (edge) => {
  // 高亮相关节点
  highlightConnectedNodes(edge.source, edge.target);
};
```

### 画布交互

```typescript
// 缩放控制
const zoomConfig = {
  enableZoom: true,
  minZoom: 0.1,
  maxZoom: 5,
  zoomStep: 0.1
};

// 拖拽控制
const dragConfig = {
  enableDrag: true,
  enableNodeDrag: true,
  enablePanDrag: true
};
```

## 过滤和搜索

### 节点过滤

```typescript
const nodeFilters = {
  // 按类型过滤
  nodeTypes: ['page', 'block', 'tag'],
  
  // 按连接数过滤
  minConnections: 2,
  maxConnections: 10,
  
  // 按创建时间过滤
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31')
  },
  
  // 按标签过滤
  tags: ['重要', '核心概念'],
  
  // 自定义过滤函数
  customFilter: (node) => {
    return node.title.includes('机器学习');
  }
};
```

### 边过滤

```typescript
const edgeFilters = {
  // 按类型过滤
  edgeTypes: ['page-reference', 'block-reference'],
  
  // 按权重过滤
  minWeight: 0.5,
  
  // 隐藏自环
  hideSelfLoops: true
};
```

### 搜索功能

```typescript
// 节点搜索
const searchNodes = (query) => {
  const matchedNodes = graphData.nodes.filter(node =>
    node.title.toLowerCase().includes(query.toLowerCase())
  );
  
  // 高亮匹配的节点
  highlightNodes(matchedNodes.map(n => n.id));
};

// 路径搜索
const findPath = (sourceId, targetId) => {
  const path = findShortestPath(graphData, sourceId, targetId);
  if (path) {
    highlightPath(path);
  }
};
```

## 样式自定义

### 节点样式

```typescript
const nodeStyle = {
  // 基础样式
  size: 8,
  strokeWidth: 2,
  
  // 颜色配置
  colors: {
    page: '#0066cc',
    block: '#28a745',
    tag: '#ffc107',
    selected: '#dc3545',
    hovered: '#17a2b8'
  },
  
  // 标签样式
  label: {
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
    color: '#333',
    offset: 15
  }
};
```

### 边样式

```typescript
const edgeStyle = {
  // 基础样式
  width: 2,
  opacity: 0.6,
  
  // 颜色配置
  colors: {
    'page-reference': '#6c757d',
    'block-reference': '#28a745',
    selected: '#dc3545'
  },
  
  // 箭头样式
  arrow: {
    size: 6,
    type: 'triangle' // 'triangle', 'circle', 'square'
  }
};
```

### 动画配置

```typescript
const animationConfig = {
  // 布局动画
  layoutTransition: {
    duration: 1000,
    easing: 'ease-in-out'
  },
  
  // 节点动画
  nodeTransition: {
    duration: 300,
    easing: 'ease'
  },
  
  // 悬停动画
  hoverAnimation: {
    scale: 1.2,
    duration: 200
  }
};
```

## 性能优化

### 大型图谱优化

```typescript
// 节点数量阈值
const LARGE_GRAPH_THRESHOLD = 1000;

// 性能优化配置
const performanceConfig = {
  // 启用节点聚合
  enableClustering: graphData.nodes.length > LARGE_GRAPH_THRESHOLD,
  
  // 限制可见节点数
  maxVisibleNodes: 500,
  
  // 启用级别细节 (LOD)
  enableLOD: true,
  
  // 禁用动画（大图谱时）
  disableAnimations: graphData.nodes.length > 2000
};
```

### 渲染优化

```typescript
// 使用 Web Worker 进行布局计算
const useWebWorker = graphData.nodes.length > 500;

// 分批渲染
const batchSize = 100;
const renderInBatches = (nodes) => {
  for (let i = 0; i < nodes.length; i += batchSize) {
    const batch = nodes.slice(i, i + batchSize);
    setTimeout(() => renderBatch(batch), i / batchSize * 16);
  }
};
```

## 导出功能

### 图片导出

```typescript
// PNG 导出
const exportPNG = async (width = 1920, height = 1080) => {
  const canvas = await graphComponent.toCanvas(width, height);
  const link = document.createElement('a');
  link.download = 'knowledge-graph.png';
  link.href = canvas.toDataURL();
  link.click();
};

// SVG 导出
const exportSVG = () => {
  const svgData = graphComponent.toSVG();
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.download = 'knowledge-graph.svg';
  link.href = url;
  link.click();
};
```

### 数据导出

```typescript
// JSON 导出
const exportJSON = () => {
  const data = {
    nodes: graphData.nodes,
    edges: graphData.edges,
    metadata: {
      exportDate: new Date().toISOString(),
      nodeCount: graphData.nodes.length,
      edgeCount: graphData.edges.length
    }
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  
  const link = document.createElement('a');
  link.download = 'knowledge-graph.json';
  link.href = URL.createObjectURL(blob);
  link.click();
};
```

## 最佳实践

### 1. 数据准备

- **清理数据**: 移除无效或重复的节点和边
- **标准化**: 确保节点ID的唯一性
- **优化结构**: 合并相似的节点，简化复杂的关系

### 2. 布局选择

- **小型网络** (< 50 节点): 使用圆形或网格布局
- **中型网络** (50-500 节点): 使用力导向布局
- **大型网络** (> 500 节点): 使用层次布局或启用聚类

### 3. 交互设计

- **渐进式披露**: 初始显示核心节点，按需展开
- **上下文菜单**: 提供节点和边的快捷操作
- **面包屑导航**: 在复杂图谱中提供导航路径

### 4. 性能考虑

- **懒加载**: 按需加载图谱数据
- **虚拟化**: 只渲染可见区域的节点
- **缓存**: 缓存布局计算结果

## 故障排除

### 常见问题

**Q: 图谱加载缓慢**
A: 检查数据量大小，考虑启用聚类或限制可见节点数

**Q: 节点重叠严重**
A: 调整力导向布局的参数，增加节点间距

**Q: 交互响应慢**
A: 禁用动画，减少事件监听器的复杂度

**Q: 导出图片模糊**
A: 增加导出分辨率，使用高DPI设置

### 调试技巧

```typescript
// 启用调试模式
const debugConfig = {
  showFPS: true,
  showNodeIds: true,
  logPerformance: true,
  highlightBounds: true
};

// 性能监控
const monitor = new PerformanceMonitor();
monitor.start();

// 在图谱组件中使用
<LinkGraphComponent
  {...props}
  debug={debugConfig}
  onPerformanceUpdate={(stats) => monitor.record(stats)}
/>
```

## 扩展开发

### 自定义布局算法

```typescript
class CustomLayout {
  constructor(options) {
    this.options = options;
  }
  
  calculate(nodes, edges) {
    // 实现自定义布局算法
    return {
      nodes: nodes.map(node => ({
        ...node,
        x: calculateX(node),
        y: calculateY(node)
      }))
    };
  }
}

// 注册自定义布局
registerLayout('custom', CustomLayout);
```

### 自定义渲染器

```typescript
class CustomNodeRenderer {
  render(node, context) {
    // 自定义节点渲染逻辑
    const element = document.createElement('div');
    element.className = 'custom-node';
    element.textContent = node.title;
    return element;
  }
}

// 注册自定义渲染器
registerRenderer('node', 'custom', CustomNodeRenderer);
```
