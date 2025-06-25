import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'All Pages', href: '/pages', icon: DocumentTextIcon },
  { name: 'Journals', href: '/journals', icon: CalendarIcon },
  { name: 'Graph', href: '/graph', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export const Sidebar: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon
                className="mr-3 h-5 w-5 flex-shrink-0"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Recent pages */}
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Recent Pages
          </h3>
          <div className="mt-2 space-y-1">
            {/* TODO: Implement recent pages */}
            <div className="px-3 py-2 text-sm text-gray-500">
              No recent pages
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          MingLog v0.1.0
        </div>
      </div>
    </div>
  );
};
