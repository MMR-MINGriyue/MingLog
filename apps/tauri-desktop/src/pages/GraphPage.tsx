import React from 'react';

export const GraphPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Graph</h1>
        <p className="text-gray-600 mt-1">
          Visualize connections between your notes and ideas
        </p>
      </div>
      
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
          <p className="text-gray-600 text-center">
            Graph visualization component will be integrated here.
            <br />
            This will use the @minglog/graph package.
          </p>
        </div>
      </div>
    </div>
  );
};
