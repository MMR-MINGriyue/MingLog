import React, { useState, useCallback } from 'react';
import { Plus, Search, Edit3, Trash2, Tag, Calendar } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

interface NotesModuleProps {
  className?: string;
}

const NotesModule: React.FC<NotesModuleProps> = ({ className = '' }) => {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 'demo-1',
      title: '欢迎使用 MingLog',
      content: '这是您的第一个笔记。您可以在这里记录想法、制定计划或保存重要信息。\n\n## 功能特点\n- 📝 富文本编辑\n- 🏷️ 标签管理\n- 🔍 快速搜索\n- 💾 自动保存\n\n开始您的笔记之旅吧！',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['欢迎', '指南']
    }
  ]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(notes[0] || null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const createNote = useCallback(() => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'New Note',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNote(newNote);
    setIsCreating(true);
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, ...updates, updatedAt: new Date() }
        : note
    ));
    if (selectedNote?.id === id) {
      setSelectedNote(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }
  }, [selectedNote]);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  }, [selectedNote]);

  // 过滤笔记
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={`flex h-full macos-content ${className}`}>
      {/* macOS风格笔记列表 */}
      <div className="w-1/3 flex flex-col macos-vibrancy-sidebar">
        {/* 搜索和新建按钮 */}
        <div className="p-4 border-b border-gray-200">
          <div className="space-y-3">
            <button
              type="button"
              onClick={createNote}
              className="w-full macos-button macos-button-primary flex items-center justify-center space-x-2 py-3"
            >
              <Plus className="w-4 h-4" />
              <span>新建笔记</span>
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索笔记..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 macos-input text-sm"
              />
            </div>
          </div>
        </div>

        {/* 笔记列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Edit3 className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">
                {searchQuery ? '未找到匹配的笔记' : '还没有笔记'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery ? '尝试其他搜索词' : '创建您的第一个笔记开始记录'}
              </p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedNote?.id === note.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <h3 className="font-medium text-gray-900 truncate mb-1">
                  {note.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {note.content || '无内容'}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {note.updatedAt.toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  {note.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Tag className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {note.tags.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* macOS风格笔记编辑器 */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* 编辑器头部 */}
            <div className="p-6 border-b border-gray-200">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 mb-3"
                placeholder="笔记标题..."
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>最后更新: {selectedNote.updatedAt.toLocaleString('zh-CN')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Edit3 className="w-4 h-4" />
                    <span>{selectedNote.content.length} 字符</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteNote(selectedNote.id)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>删除</span>
                </button>
              </div>
            </div>

            {/* 编辑器内容 */}
            <div className="flex-1 p-6">
              <textarea
                value={selectedNote.content}
                onChange={(e) => updateNote(selectedNote.id, { content: e.target.value })}
                className="w-full h-full resize-none bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 leading-relaxed text-base"
                placeholder="开始记录您的想法..."
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Edit3 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">选择一个笔记开始编辑</h3>
              <p className="text-gray-500 mb-6">从左侧列表中选择笔记，或创建一个新笔记</p>
              <button
                type="button"
                onClick={createNote}
                className="macos-button macos-button-primary flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>创建新笔记</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { NotesModule };
