import React from 'react';
import { clsx } from 'clsx';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  text,
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  const spinner = (
    <div className={clsx('animate-spin', sizeClasses[size], colorClasses[color], className)}>
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-4">
          {spinner}
          {text && (
            <p className="text-gray-600 text-sm font-medium">{text}</p>
          )}
        </div>
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex items-center space-x-3">
        {spinner}
        <span className="text-gray-600 text-sm font-medium">{text}</span>
      </div>
    );
  }

  return spinner;
};

// Skeleton loader component for content placeholders
export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  rounded = false,
  lines = 1,
}) => {
  if (lines > 1) {
    return (
      <div className={clsx('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={clsx(
              'animate-pulse bg-gray-200',
              rounded ? 'rounded-full' : 'rounded',
              index === lines - 1 && 'w-3/4' // Last line is shorter
            )}
            style={{
              width: index === lines - 1 ? '75%' : width,
              height: height || '1rem',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200',
        rounded ? 'rounded-full' : 'rounded',
        className
      )}
      style={{ width, height }}
    />
  );
};

// Page skeleton for loading states
export const PageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <Skeleton width="60%" height="2rem" />
        <Skeleton width="40%" height="1rem" />
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton lines={3} />
          </div>
        ))}
      </div>
    </div>
  );
};

// List skeleton for loading lists
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
          <Skeleton width="3rem" height="3rem" rounded />
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" height="1rem" />
            <Skeleton width="50%" height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  );
};
