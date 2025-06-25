import React from 'react';
import { Button, Input } from '@minglog/ui';
import { useLogseqStore } from '../stores/logseq-store';
import { 
  Bars3Icon, 
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export const TopBar: React.FC = () => {
  const {
    sidebarOpen,
    setSidebarOpen,
    searchQuery,
    setSearchQuery,
    setSearchOpen,
    createPage,
  } = useLogseqStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(true);
    }
  };

  const handleQuickAdd = async () => {
    const pageName = prompt('Enter page name:');
    if (pageName) {
      await createPage(pageName);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Bars3Icon className="h-5 w-5" />
          </Button>
          
          <h1 className="text-xl font-semibold text-gray-900">
            MingLog
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Search pages and blocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
              className="w-64"
            />
          </form>

          {/* Quick add */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleQuickAdd}
            leftIcon={<PlusIcon className="h-4 w-4" />}
          >
            New Page
          </Button>
        </div>
      </div>
    </header>
  );
};
