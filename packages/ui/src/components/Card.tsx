import React from 'react';
import { clsx } from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  shadow = 'sm',
  border = true,
  hover = false,
  onClick,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={clsx(
        'bg-white rounded-lg',
        paddingClasses[padding],
        shadowClasses[shadow],
        border && 'border border-gray-200',
        hover && 'transition-shadow hover:shadow-md',
        onClick && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
    >
      {children}
    </Component>
  );
};

// Card composition components
export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={clsx('border-b border-gray-200 pb-4 mb-4', className)}>
    {children}
  </div>
);

export const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}> = ({ children, className, as: Component = 'h3' }) => (
  <Component className={clsx('text-lg font-semibold text-gray-900', className)}>
    {children}
  </Component>
);

export const CardDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <p className={clsx('text-sm text-gray-600 mt-1', className)}>
    {children}
  </p>
);

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={clsx('text-gray-700', className)}>
    {children}
  </div>
);

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={clsx('border-t border-gray-200 pt-4 mt-4', className)}>
    {children}
  </div>
);

// Specialized card variants
export const StatsCard: React.FC<{
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, value, change, icon, className }) => (
  <Card className={className} padding="lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className={clsx(
            'text-sm font-medium',
            change.type === 'increase' && 'text-green-600',
            change.type === 'decrease' && 'text-red-600',
            change.type === 'neutral' && 'text-gray-600'
          )}>
            {change.type === 'increase' && '↗ '}
            {change.type === 'decrease' && '↘ '}
            {change.value}
          </p>
        )}
      </div>
      {icon && (
        <div className="text-gray-400">
          {icon}
        </div>
      )}
    </div>
  </Card>
);

export const ActionCard: React.FC<{
  title: string;
  description?: string;
  action: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, description, action, icon, className }) => (
  <Card className={className} padding="lg">
    <div className="flex items-start space-x-4">
      {icon && (
        <div className="flex-shrink-0 text-blue-600">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
        <button
          onClick={action.onClick}
          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          {action.label} →
        </button>
      </div>
    </div>
  </Card>
);
