import React, { useState } from 'react'
import { Search, Filter, Calendar, Tag, FileText } from 'lucide-react'

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Search</h2>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                showFilters ? 'text-primary-600 bg-primary-100' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <select className="w-full input">
                    <option>Any time</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 3 months</option>
                    <option>Last year</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by tags..."
                    className="w-full input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <select className="w-full input">
                    <option>All content</option>
                    <option>Text only</option>
                    <option>With images</option>
                    <option>With code</option>
                    <option>With links</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {searchQuery ? (
            <div>
              <div className="mb-4 text-sm text-gray-600">
                Searching for "{searchQuery}"...
              </div>
              
              {/* No Results Placeholder */}
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or filters
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Search Tips */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Search Tips</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Basic Search</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Type keywords to find matching notes</li>
                        <li>• Use quotes for exact phrases: "machine learning"</li>
                        <li>• Search is case-insensitive</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Advanced Search</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Use filters to narrow results</li>
                        <li>• Search by tags: #productivity</li>
                        <li>• Filter by date ranges</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Searches */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Searches</h3>
                </div>
                <div className="card-body">
                  <div className="text-center py-8">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600 text-sm">
                      Your recent searches will appear here
                    </p>
                  </div>
                </div>
              </div>

              {/* Popular Tags */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Popular Tags</h3>
                </div>
                <div className="card-body">
                  <div className="text-center py-8">
                    <Tag className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600 text-sm">
                      Start tagging your notes to see popular tags here
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchPage
