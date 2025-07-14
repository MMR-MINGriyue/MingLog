import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';






import ErrorBoundary from './ErrorBoundary';
import { useZustandStore } from './store';

const App: React.FC = () => {
  const { pages, currentPage } = useZustandStore();

  const editor = useEditor({
    extensions: [StarterKit],
    content: currentPage?.content || '# 新页面\n\n开始编辑你的内容...',
    onUpdate: ({ editor }) => {
      if (currentPage) {
        useZustandStore.setState({
          pages: pages.map(page =>
            page.id === currentPage.id ? { ...page, content: editor.getHTML() } : page
          )
        });
      }
    }
  });

  React.useEffect(() => {
    return () => {}
  }, [currentPage, pages, editor]);

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b p-4 bg-white shadow-sm">
        <h1 className="text-xl font-semibold">MingLog 知识管理</h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r bg-white p-4 overflow-y-auto">
          <h2 className="font-medium mb-2">页面列表</h2>
          <div className="space-y-1">
            {pages.map(page => (
              <div key={page.id} onClick={() => useZustandStore.setState({ currentPage: page })} className="p-2 rounded hover:bg-gray-100 cursor-pointer">
                {page.title}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {editor && (
            <ErrorBoundary fallback={<div style={{ color: 'red', fontSize: '24px', padding: '20px' }}>编辑器加载失败，请刷新页面重试</div>}>
              <EditorContent editor={editor} className="min-h-full bg-white p-6 rounded shadow-sm" />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;