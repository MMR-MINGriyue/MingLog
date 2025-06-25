import React from 'react';
import { clsx } from 'clsx';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'w-8 h-8',
      title: 'text-lg',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'w-12 h-12',
      title: 'text-xl',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      icon: 'w-16 h-16',
      title: 'text-2xl',
      description: 'text-lg',
    },
  };

  const styles = sizeClasses[size];

  return (
    <div className={clsx(
      'text-center',
      styles.container,
      className
    )}>
      {icon && (
        <div className={clsx(
          'mx-auto text-gray-400 mb-4',
          styles.icon
        )}>
          {icon}
        </div>
      )}
      
      <h3 className={clsx(
        'font-medium text-gray-900 mb-2',
        styles.title
      )}>
        {title}
      </h3>
      
      {description && (
        <p className={clsx(
          'text-gray-500 mb-6 max-w-sm mx-auto',
          styles.description
        )}>
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className={clsx(
            'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors',
            action.variant === 'secondary' 
              ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
              : 'text-white bg-blue-600 hover:bg-blue-700'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Predefined empty states for common scenarios
export const EmptyPages: React.FC<{ onCreatePage: () => void }> = ({ onCreatePage }) => {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      title="还没有页面"
      description="创建您的第一个页面来开始记录想法和知识。"
      action={{
        label: "创建页面",
        onClick: onCreatePage,
      }}
    />
  );
};

export const EmptyBlocks: React.FC<{ onCreateBlock: () => void }> = ({ onCreateBlock }) => {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      }
      title="页面是空的"
      description="添加第一个块来开始编写内容。"
      action={{
        label: "添加块",
        onClick: onCreateBlock,
      }}
      size="sm"
    />
  );
};

export const EmptySearch: React.FC<{ query?: string }> = ({ query }) => {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="没有找到结果"
      description={query ? `没有找到包含"${query}"的内容。` : "尝试使用不同的关键词搜索。"}
      size="sm"
    />
  );
};

export const EmptyJournals: React.FC<{ onCreateJournal: () => void }> = ({ onCreateJournal }) => {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h6m-6 0l-1 1v8a2 2 0 002 2h4a2 2 0 002-2V8l-1-1" />
        </svg>
      }
      title="还没有日记"
      description="开始记录您的日常想法和经历。"
      action={{
        label: "创建今日日记",
        onClick: onCreateJournal,
      }}
    />
  );
};

export const EmptyGraph: React.FC<{ onCreateGraph: () => void }> = ({ onCreateGraph }) => {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      }
      title="还没有知识图谱"
      description="创建您的第一个知识图谱来组织信息。"
      action={{
        label: "创建图谱",
        onClick: onCreateGraph,
      }}
    />
  );
};

// Generic loading state that can be used while data is being fetched
export const LoadingState: React.FC<{ message?: string }> = ({ 
  message = "正在加载..." 
}) => {
  return (
    <EmptyState
      icon={
        <div className="animate-spin">
          <svg fill="none" viewBox="0 0 24 24" className="w-full h-full">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </div>
      }
      title={message}
      size="sm"
    />
  );
};
