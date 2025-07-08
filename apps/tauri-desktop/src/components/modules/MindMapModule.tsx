import React, { useState, useCallback } from 'react';

interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  children: string[];
  parent?: string;
  color: string;
}

interface MindMapModuleProps {
  className?: string;
}

const MindMapModule: React.FC<MindMapModuleProps> = ({ className = '' }) => {
  const [nodes, setNodes] = useState<MindMapNode[]>([
    {
      id: 'root',
      text: 'Central Idea',
      x: 400,
      y: 300,
      children: [],
      color: '#3B82F6',
    },
  ]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const addNode = useCallback((parentId: string) => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const newNode: MindMapNode = {
      id: `node-${Date.now()}`,
      text: 'New Idea',
      x: parent.x + (Math.random() - 0.5) * 200,
      y: parent.y + (Math.random() - 0.5) * 200,
      children: [],
      parent: parentId,
      color: '#10B981',
    };

    setNodes(prev => [
      ...prev,
      newNode,
    ]);

    // Update parent's children
    setNodes(prev => prev.map(node =>
      node.id === parentId
        ? { ...node, children: [...node.children, newNode.id] }
        : node
    ));
  }, [nodes]);

  const updateNode = useCallback((id: string, updates: Partial<MindMapNode>) => {
    setNodes(prev => prev.map(node =>
      node.id === id ? { ...node, ...updates } : node
    ));
  }, []);

  const deleteNode = useCallback((id: string) => {
    if (id === 'root') return; // Can't delete root

    const nodeToDelete = nodes.find(n => n.id === id);
    if (!nodeToDelete) return;

    // Remove from parent's children
    if (nodeToDelete.parent) {
      setNodes(prev => prev.map(node =>
        node.id === nodeToDelete.parent
          ? { ...node, children: node.children.filter(childId => childId !== id) }
          : node
      ));
    }

    // Delete the node and all its descendants
    const getAllDescendants = (nodeId: string): string[] => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return [];
      
      let descendants = [nodeId];
      node.children.forEach(childId => {
        descendants = [...descendants, ...getAllDescendants(childId)];
      });
      return descendants;
    };

    const toDelete = getAllDescendants(id);
    setNodes(prev => prev.filter(node => !toDelete.includes(node.id)));
  }, [nodes]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
  }, []);

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    setIsEditing(nodeId);
  }, []);

  const renderConnections = () => {
    return nodes.map(node => 
      node.children.map(childId => {
        const child = nodes.find(n => n.id === childId);
        if (!child) return null;

        return (
          <line
            key={`${node.id}-${childId}`}
            x1={node.x}
            y1={node.y}
            x2={child.x}
            y2={child.y}
            stroke="#6B7280"
            strokeWidth="2"
          />
        );
      })
    ).flat().filter(Boolean);
  };

  return (
    <div className={`flex h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Toolbar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Mind Map Tools</h3>
        
        {selectedNode && (
          <div className="space-y-3">
            <button
              onClick={() => addNode(selectedNode)}
              className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
            >
              Add Child Node
            </button>
            
            {selectedNode !== 'root' && (
              <button
                onClick={() => deleteNode(selectedNode)}
                className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
              >
                Delete Node
              </button>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Node Color
              </label>
              <input
                type="color"
                value={nodes.find(n => n.id === selectedNode)?.color || '#3B82F6'}
                onChange={(e) => updateNode(selectedNode, { color: e.target.value })}
                className="w-full h-8 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>
        )}

        {!selectedNode && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click on a node to select it and see options
          </p>
        )}
      </div>

      {/* Mind Map Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <svg className="w-full h-full">
          {/* Render connections */}
          {renderConnections()}
          
          {/* Render nodes */}
          {nodes.map(node => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="30"
                fill={node.color}
                stroke={selectedNode === node.id ? '#1F2937' : 'transparent'}
                strokeWidth="3"
                className="cursor-pointer"
                onClick={() => handleNodeClick(node.id)}
                onDoubleClick={() => handleNodeDoubleClick(node.id)}
              />
              
              {isEditing === node.id ? (
                <foreignObject x={node.x - 50} y={node.y - 10} width="100" height="20">
                  <input
                    type="text"
                    value={node.text}
                    onChange={(e) => updateNode(node.id, { text: e.target.value })}
                    onBlur={() => setIsEditing(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditing(null);
                    }}
                    className="w-full text-xs text-center bg-white border rounded px-1"
                    autoFocus
                  />
                </foreignObject>
              ) : (
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-white font-medium pointer-events-none"
                >
                  {node.text.length > 10 ? `${node.text.slice(0, 10)}...` : node.text}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            • Click to select a node<br/>
            • Double-click to edit text<br/>
            • Use toolbar to add/delete nodes
          </p>
        </div>
      </div>
    </div>
  );
};

export default MindMapModule;
