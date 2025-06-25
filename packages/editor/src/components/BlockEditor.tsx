import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Code from '@tiptap/extension-code';
import Strike from '@tiptap/extension-strike';
import Underline from '@tiptap/extension-underline';
import type { Block } from '@minglog/core';

interface BlockEditorProps {
  block: Block;
  onUpdate: (content: string) => void;
  onEnter?: () => void;
  onBackspace?: () => void;
  onTab?: () => void; // Indent block
  onShiftTab?: () => void; // Outdent block
  onArrowUp?: () => void; // Focus previous block
  onArrowDown?: () => void; // Focus next block
  onDelete?: () => void; // Delete current block
  onDuplicate?: () => void; // Duplicate current block
  onMoveUp?: () => void; // Move block up
  onMoveDown?: () => void; // Move block down
  placeholder?: string;
  autoFocus?: boolean;
  level?: number; // Indentation level for visual styling
  showToolbar?: boolean; // Show formatting toolbar
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  block,
  onUpdate,
  onEnter,
  onBackspace,
  onTab,
  onShiftTab,
  onArrowUp,
  onArrowDown,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  placeholder = 'Type something...',
  autoFocus = false,
  level = 0,
  showToolbar = false,
}) => {
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false);
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Code.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono',
        },
      }),
      Strike,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: block.content,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      onUpdate(content);
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        // Enter: Create new block at same level
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onEnter?.();
          return true;
        }

        // Tab: Indent block (make it a child of previous block)
        if (event.key === 'Tab' && !event.shiftKey) {
          event.preventDefault();
          onTab?.();
          return true;
        }

        // Shift+Tab: Outdent block (move up one level)
        if (event.key === 'Tab' && event.shiftKey) {
          event.preventDefault();
          onShiftTab?.();
          return true;
        }

        // Backspace: Delete empty block or merge with previous
        if (event.key === 'Backspace' && editor?.isEmpty) {
          event.preventDefault();
          onBackspace?.();
          return true;
        }

        // Delete: Delete current block
        if (event.key === 'Delete' && event.ctrlKey) {
          event.preventDefault();
          onDelete?.();
          return true;
        }

        // Arrow Up: Focus previous block
        if (event.key === 'ArrowUp' && event.ctrlKey) {
          event.preventDefault();
          onArrowUp?.();
          return true;
        }

        // Arrow Down: Focus next block
        if (event.key === 'ArrowDown' && event.ctrlKey) {
          event.preventDefault();
          onArrowDown?.();
          return true;
        }

        // Ctrl+D: Duplicate block
        if (event.key === 'd' && event.ctrlKey) {
          event.preventDefault();
          onDuplicate?.();
          return true;
        }

        // Ctrl+Shift+Up: Move block up
        if (event.key === 'ArrowUp' && event.ctrlKey && event.shiftKey) {
          event.preventDefault();
          onMoveUp?.();
          return true;
        }

        // Ctrl+Shift+Down: Move block down
        if (event.key === 'ArrowDown' && event.ctrlKey && event.shiftKey) {
          event.preventDefault();
          onMoveDown?.();
          return true;
        }

        // Ctrl+/: Toggle formatting toolbar
        if (event.key === '/' && event.ctrlKey) {
          event.preventDefault();
          setShowFormattingToolbar(prev => !prev);
          return true;
        }

        // Ctrl+B: Bold
        if (event.key === 'b' && event.ctrlKey) {
          event.preventDefault();
          editor?.chain().focus().toggleBold().run();
          return true;
        }

        // Ctrl+I: Italic
        if (event.key === 'i' && event.ctrlKey) {
          event.preventDefault();
          editor?.chain().focus().toggleItalic().run();
          return true;
        }

        // Ctrl+U: Underline
        if (event.key === 'u' && event.ctrlKey) {
          event.preventDefault();
          editor?.chain().focus().toggleUnderline().run();
          return true;
        }

        // Ctrl+Shift+S: Strike
        if (event.key === 's' && event.ctrlKey && event.shiftKey) {
          event.preventDefault();
          editor?.chain().focus().toggleStrike().run();
          return true;
        }

        // Ctrl+E: Code
        if (event.key === 'e' && event.ctrlKey) {
          event.preventDefault();
          editor?.chain().focus().toggleCode().run();
          return true;
        }

        return false;
      },
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[1.5rem]',
      },
    },
  });

  useEffect(() => {
    if (editor && autoFocus) {
      editor.commands.focus();
    }
  }, [editor, autoFocus]);

  useEffect(() => {
    if (editor && editor.getHTML() !== block.content) {
      editor.commands.setContent(block.content);
    }
  }, [editor, block.content]);

  const handlePageReference = useCallback(() => {
    if (!editor) return;
    
    const { to } = editor.state.selection;
    editor.chain().focus().insertContent('[[]]').run();
    // Move cursor between brackets
    editor.commands.setTextSelection(to + 2);
  }, [editor]);

  const handleBlockReference = useCallback(() => {
    if (!editor) return;
    
    const { to } = editor.state.selection;
    editor.chain().focus().insertContent('(())').run();
    // Move cursor between brackets
    editor.commands.setTextSelection(to + 2);
  }, [editor]);

  if (!editor) {
    return null;
  }

  const FormattingToolbar = () => {
    if (!editor || (!showToolbar && !showFormattingToolbar)) return null;

    return (
      <div className="absolute top-0 left-0 transform -translate-y-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex space-x-1 z-10">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded text-sm font-bold ${
            editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded text-sm italic ${
            editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1 rounded text-sm underline ${
            editor.isActive('underline') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Underline (Ctrl+U)"
        >
          U
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1 rounded text-sm line-through ${
            editor.isActive('strike') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Strike (Ctrl+Shift+S)"
        >
          S
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1 rounded text-sm font-mono ${
            editor.isActive('code') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Code (Ctrl+E)"
        >
          &lt;/&gt;
        </button>
        <div className="border-l border-gray-200 mx-1" />
        <button
          onClick={handlePageReference}
          className="p-1 rounded text-xs text-gray-600 hover:bg-gray-100"
          title="Page reference"
        >
          [[]]
        </button>
        <button
          onClick={handleBlockReference}
          className="p-1 rounded text-xs text-gray-600 hover:bg-gray-100"
          title="Block reference"
        >
          (())
        </button>
      </div>
    );
  };

  return (
    <div className="relative group">
      <div className="relative">
        <EditorContent editor={editor} />

        {/* Formatting toolbar */}
        <FormattingToolbar />

        {/* Floating toolbar for quick actions */}
        <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => setShowFormattingToolbar(prev => !prev)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded text-xs"
              title="Toggle formatting toolbar (Ctrl+/)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handlePageReference}
              className="p-1 text-gray-400 hover:text-gray-600 rounded text-xs"
              title="Add page reference"
            >
              [[]]
            </button>
            <button
              type="button"
              onClick={handleBlockReference}
              className="p-1 text-gray-400 hover:text-gray-600 rounded text-xs"
              title="Add block reference"
            >
              (())
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
