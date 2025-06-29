import React, { useState } from 'react'
import {
  Upload,
  Download,
  FileText,
  FolderOpen,
  Save,
  Archive,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { 
  importMarkdownFile, 
  exportPageToMarkdown, 
  bulkExportPages, 
  createBackup,
  withErrorHandling,
  ImportResult,
  ExportResult
} from '../utils/tauri'
import { useNotifications } from './NotificationSystem'

interface FileOperationsProps {
  isOpen: boolean
  onClose: () => void
  selectedPageIds?: string[]
}

const FileOperations: React.FC<FileOperationsProps> = ({ 
  isOpen, 
  onClose, 
  selectedPageIds = [] 
}) => {
  const { success, error } = useNotifications()
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'backup'>('import')
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastResult, setLastResult] = useState<ImportResult | ExportResult | null>(null)

  const handleImportMarkdown = async () => {
    setIsProcessing(true)

    try {
      // For testing, use a hardcoded file path
      // In production, this would use the file dialog
      const testFilePath = "C:\\temp\\test.md"

      const result = await withErrorHandling(
        () => importMarkdownFile(testFilePath, 'default'),
        `Failed to import test file`
      )

      if (result) {
        setLastResult(result)

        if (result.errors.length === 0) {
          success(`Successfully imported ${result.pages_imported} pages`)
        } else {
          error(`Imported ${result.pages_imported} pages with ${result.errors.length} errors`)
        }
      }
    } catch (err) {
      error('Failed to import files - this is a test version')
    }

    setIsProcessing(false)
  }

  const handleExportPages = async () => {
    setIsProcessing(true)

    try {
      // For testing, use a hardcoded output directory
      const testOutputDir = "C:\\temp\\export"

      // Create some test page IDs if none selected
      const pageIds = selectedPageIds.length > 0 ? selectedPageIds : ['test-page-1', 'test-page-2']

      const result = await withErrorHandling(
        () => bulkExportPages(pageIds, testOutputDir),
        'Failed to export pages'
      )

      if (result) {
        setLastResult(result)
        success(`Exported ${result.files_exported} pages to ${result.export_path}`)
      }
    } catch (err) {
      error('Failed to export pages - this is a test version')
    }

    setIsProcessing(false)
  }

  const handleCreateBackup = async () => {
    setIsProcessing(true)

    try {
      // For testing, use a hardcoded backup path
      const testBackupPath = `C:\\temp\\minglog-backup-${new Date().toISOString().split('T')[0]}.json`

      const result = await withErrorHandling(
        () => createBackup(testBackupPath),
        'Failed to create backup'
      )

      if (result) {
        success(`Backup created successfully at ${result}`)
      }
    } catch (err) {
      error('Failed to create backup - this is a test version')
    }

    setIsProcessing(false)
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              File Operations
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'import'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Import
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'export'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Export
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'backup'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Archive className="w-4 h-4 inline mr-2" />
              Backup
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Import Markdown Files
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Import Markdown files (.md) into your knowledge base. Files with frontmatter will preserve metadata.
                </p>
                
                <button
                  onClick={handleImportMarkdown}
                  disabled={isProcessing}
                  className="btn-primary flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span>Select Markdown Files</span>
                </button>
              </div>

              {lastResult && 'pages_imported' in lastResult && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Import Results
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Pages imported: {lastResult.pages_imported}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Blocks created: {lastResult.blocks_imported}</span>
                    </div>
                    {lastResult.errors.length > 0 && (
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                        <div>
                          <span>Errors: {lastResult.errors.length}</span>
                          <ul className="mt-1 ml-4 text-xs text-gray-600 dark:text-gray-400">
                            {lastResult.errors.slice(0, 3).map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                            {lastResult.errors.length > 3 && (
                              <li>• ... and {lastResult.errors.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Export Pages
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Export selected pages as Markdown files with frontmatter metadata.
                </p>
                
                <div className="mb-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedPageIds.length} page{selectedPageIds.length !== 1 ? 's' : ''} selected
                  </span>
                </div>

                <button
                  onClick={handleExportPages}
                  disabled={isProcessing || selectedPageIds.length === 0}
                  className="btn-primary flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FolderOpen className="w-4 h-4" />
                  )}
                  <span>Select Export Directory</span>
                </button>
              </div>

              {lastResult && 'files_exported' in lastResult && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Export Results
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Files exported: {lastResult.files_exported}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Total size: {formatFileSize(lastResult.total_size)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="w-4 h-4 text-blue-500" />
                      <span>Location: {lastResult.export_path}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Create Backup
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create a complete backup of your knowledge base in JSON format. This includes all pages, blocks, and metadata.
                </p>
                
                <button
                  onClick={handleCreateBackup}
                  disabled={isProcessing}
                  className="btn-primary flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Create Backup</span>
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Backup Information
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• Includes all pages, blocks, and tags</li>
                  <li>• Preserves all metadata and relationships</li>
                  <li>• Can be used to restore or migrate data</li>
                  <li>• Human-readable JSON format</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileOperations
