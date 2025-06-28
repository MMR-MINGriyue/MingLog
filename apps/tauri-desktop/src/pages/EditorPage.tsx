import React from 'react';
import { useParams } from 'react-router-dom';

export const EditorPage: React.FC = () => {
  const { pageId } = useParams<{ pageId?: string }>();

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          {pageId ? 'Edit Page' : 'New Page'}
        </h1>
        {pageId && (
          <p className="text-gray-600 mt-1">Page ID: {pageId}</p>
        )}
      </div>
      
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
          <p className="text-gray-600 text-center">
            Editor component will be integrated here.
            <br />
            This will use the @minglog/editor package.
          </p>
        </div>
      </div>
    </div>
  );
};
