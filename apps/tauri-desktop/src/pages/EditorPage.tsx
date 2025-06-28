import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/tauri';
import { Save, ArrowLeft, Trash2, FileText, Edit3 } from 'lucide-react';
import { SimpleBlockEditor } from '../components/SimpleBlockEditor';

interface Page {
  id: string;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
}

interface Block {
  id: string;
  content: string;
  type: 'paragraph' | 'heading' | 'list' | 'quote';
  level: number;
}

export const EditorPage: React.FC = () => {
  const { pageId } = useParams<{ pageId?: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editorMode, setEditorMode] = useState<'simple' | 'rich'>('rich');
  const [blocks, setBlocks] = useState<any[]>([]);

  const isNewPage = !pageId;

  useEffect(() => {
    if (pageId) {
      loadPage();
    }
  }, [pageId]);

  // Convert content string to blocks
  const contentToBlocks = (content: string): Block[] => {
    if (!content.trim()) return [];

    const paragraphs = content.split('\n\n').filter(p => p.trim());
    return paragraphs.map((paragraph, index) => ({
      id: `block-${index}`,
      content: paragraph.trim(),
      type: 'paragraph',
      level: 0
    }));
  };

  // Update blocks when content changes (for mode switching)
  useEffect(() => {
    if (editorMode === 'rich' && content && blocks.length === 0) {
      setBlocks(contentToBlocks(content));
    }
  }, [editorMode, content, blocks.length]);

  const loadPage = async () => {
    if (!pageId) return;

    try {
      setIsLoading(true);
      const pageData = await invoke('get_page_by_id', { id: pageId }) as string;
      const page = JSON.parse(pageData) as Page;
      setTitle(page.title);
      setContent(page.content);

      // Convert content to blocks for rich editor
      if (page.content) {
        setBlocks(contentToBlocks(page.content));
      }
    } catch (error) {
      console.error('Failed to load page:', error);
      // If page not found, redirect to home
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const savePage = async () => {
    try {
      setIsSaving(true);

      if (isNewPage) {
        // Create new page
        const newPageData = await invoke('create_page', {
          title: title || 'Untitled',
          content
        }) as string;
        const newPage = JSON.parse(newPageData) as Page;

        // Navigate to the new page
        navigate(`/editor/${newPage.id}`, { replace: true });
      } else {
        // Update existing page
        await invoke('update_page', {
          id: pageId,
          title: title || 'Untitled',
          content
        });
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save page:', error);
      alert('Failed to save page. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePage = async () => {
    if (!pageId) return;

    const confirmed = confirm('Are you sure you want to delete this page? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await invoke('delete_page', { id: pageId });
      navigate('/');
    } catch (error) {
      console.error('Failed to delete page:', error);
      alert('Failed to delete page. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      savePage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Home"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>

            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isNewPage ? 'New Page' : 'Edit Page'}
              </h1>
              {lastSaved && (
                <p className="text-sm text-gray-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Editor Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setEditorMode('simple')}
                className={`inline-flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                  editorMode === 'simple'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Simple Editor"
              >
                <FileText size={14} />
                <span>Simple</span>
              </button>
              <button
                onClick={() => setEditorMode('rich')}
                className={`inline-flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                  editorMode === 'rich'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Rich Editor"
              >
                <Edit3 size={14} />
                <span>Rich</span>
              </button>
            </div>

            {!isNewPage && (
              <button
                onClick={deletePage}
                className="inline-flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Page"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            )}

            <button
              onClick={savePage}
              disabled={isSaving}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 h-full flex flex-col">
          {/* Title input */}
          <div className="p-6 border-b border-gray-200">
            <input
              type="text"
              placeholder="Page title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none resize-none"
            />
          </div>

          {/* Content editor */}
          <div className="flex-1 p-6">
            {editorMode === 'simple' ? (
              <textarea
                placeholder="Start writing..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full text-gray-700 placeholder-gray-400 border-none outline-none resize-none font-mono text-sm leading-relaxed"
              />
            ) : (
              <div className="h-full">
                <SimpleBlockEditor
                  blocks={blocks}
                  onChange={(newBlocks) => {
                    setBlocks(newBlocks);
                    // Convert blocks to content string for saving
                    const contentString = newBlocks
                      .map(block => block.content)
                      .join('\n\n');
                    setContent(contentString);
                  }}
                  placeholder="Start writing with rich text..."
                  className="h-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-6 py-2 bg-gray-100 border-t border-gray-200 text-xs text-gray-600">
        <div className="max-w-4xl mx-auto flex justify-between">
          <span>
            {content.length} characters, {content.split(/\s+/).filter(word => word.length > 0).length} words
          </span>
          <span>
            Press Ctrl+S to save
          </span>
        </div>
      </div>
    </div>
  );
};
