import React, { useState } from 'react'
import { X, Keyboard, Search, Edit3, Home, Settings, Network } from 'lucide-react'
import { formatShortcut, getShortcutHelp } from '../hooks/useKeyboardShortcuts'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('global')

  if (!isOpen) return null

  const shortcutCategories = {
    global: {
      name: 'Global Shortcuts',
      icon: <Keyboard className="w-5 h-5" />,
      shortcuts: [
        { keys: 'Ctrl + N', description: 'Create new note' },
        { keys: 'Ctrl + F', description: 'Search notes' },
        { keys: 'Ctrl + H', description: 'Go to home' },
        { keys: 'Ctrl + G', description: 'Open knowledge graph' },
        { keys: 'Ctrl + ,', description: 'Open settings' },
        { keys: 'Escape', description: 'Close modals/overlays' },
        { keys: 'F1', description: 'Show this help' }
      ]
    },
    editor: {
      name: 'Editor Shortcuts',
      icon: <Edit3 className="w-5 h-5" />,
      shortcuts: [
        { keys: 'Ctrl + S', description: 'Save note' },
        { keys: 'Ctrl + B', description: 'Bold text' },
        { keys: 'Ctrl + I', description: 'Italic text' },
        { keys: 'Ctrl + U', description: 'Underline text' },
        { keys: 'Ctrl + K', description: 'Insert link' },
        { keys: 'Ctrl + `', description: 'Code block' },
        { keys: 'Ctrl + Z', description: 'Undo' },
        { keys: 'Ctrl + Y', description: 'Redo' }
      ]
    },
    search: {
      name: 'Search Shortcuts',
      icon: <Search className="w-5 h-5" />,
      shortcuts: [
        { keys: '/', description: 'Focus search input' },
        { keys: 'Escape', description: 'Clear search' },
        { keys: 'Alt + F', description: 'Toggle filters' },
        { keys: 'Enter', description: 'Perform search' },
        { keys: '↑ ↓', description: 'Navigate results' },
        { keys: 'Enter', description: 'Open selected result' }
      ]
    },
    navigation: {
      name: 'Navigation',
      icon: <Home className="w-5 h-5" />,
      shortcuts: [
        { keys: 'Alt + 1', description: 'Go to Home' },
        { keys: 'Alt + 2', description: 'Go to Editor' },
        { keys: 'Alt + 3', description: 'Go to Search' },
        { keys: 'Alt + 4', description: 'Go to Graph' },
        { keys: 'Alt + 5', description: 'Go to Settings' },
        { keys: 'Ctrl + Tab', description: 'Next tab' },
        { keys: 'Ctrl + Shift + Tab', description: 'Previous tab' }
      ]
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Keyboard className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[60vh]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {Object.entries(shortcutCategories).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeCategory === key
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {category.icon}
                  <span className="font-medium">{category.name}</span>
                </button>
              ))}
            </nav>

            {/* Tips */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">💡 Tips</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Press F1 anytime to open this help</li>
                <li>• Most shortcuts work globally</li>
                <li>• Use Escape to close dialogs</li>
                <li>• Shortcuts are case-insensitive</li>
              </ul>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                {shortcutCategories[activeCategory as keyof typeof shortcutCategories].icon}
                <h3 className="text-lg font-semibold text-gray-900">
                  {shortcutCategories[activeCategory as keyof typeof shortcutCategories].name}
                </h3>
              </div>
              
              <div className="grid gap-3">
                {shortcutCategories[activeCategory as keyof typeof shortcutCategories].shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-gray-700">{shortcut.description}</span>
                    <div className="flex items-center space-x-1">
                      {shortcut.keys.split(' + ').map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && <span className="text-gray-400 mx-1">+</span>}
                          <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono text-gray-700 shadow-sm">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform-specific notes */}
            <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Platform Notes</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>Windows/Linux:</strong> Use Ctrl for most shortcuts</p>
                <p><strong>macOS:</strong> Use Cmd (⌘) instead of Ctrl for most shortcuts</p>
                <p><strong>Function Keys:</strong> You may need to press Fn + F1 on some keyboards</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">Escape</kbd> or click outside to close
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                // In a real app, this would open external documentation
                console.log('Opening documentation...')
              }}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View Full Documentation
            </button>
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcutsHelp
