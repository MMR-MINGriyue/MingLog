import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: '首页', href: '/', icon: HomeIcon },
  { name: '所有页面', href: '/pages', icon: DocumentTextIcon },
  { name: '日记', href: '/journals', icon: CalendarIcon },
  { name: '搜索', href: '/search', icon: MagnifyingGlassIcon },
  { name: '🧪 测试', href: '/test', icon: CogIcon },
  { name: '图谱', href: '/graph', icon: ChartBarIcon },
  { name: '设置', href: '/settings', icon: CogIcon },
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
            最近页面
          </h3>
          <div className="mt-2 space-y-1">
            {/* TODO: Implement recent pages */}
            <div className="px-3 py-2 text-sm text-gray-500">
              暂无最近页面
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
