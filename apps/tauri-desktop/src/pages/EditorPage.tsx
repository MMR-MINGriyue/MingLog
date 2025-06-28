import React from 'react'
import { Save, FileText, Settings } from 'lucide-react'

const EditorPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      {/* Editor Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Editor</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              <span>Untitled Note</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="btn-ghost">
              <Settings className="w-4 h-4" />
            </button>
            <button className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 bg-white">
        <div className="h-full max-w-4xl mx-auto p-6">
          <div className="h-full border border-gray-200 rounded-lg p-6">
            <div className="text-center py-20">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Rich Text Editor
              </h3>
              <p className="text-gray-600 mb-6">
                The editor component will be integrated here from @minglog/editor package
              </p>
              <div className="space-y-4 text-left max-w-md mx-auto">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Features to include:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Rich text formatting</li>
                    <li>• Code blocks with syntax highlighting</li>
                    <li>• Tables and lists</li>
                    <li>• Image and file attachments</li>
                    <li>• Auto-save functionality</li>
                    <li>• Tag management</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditorPage
