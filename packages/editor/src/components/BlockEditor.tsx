import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
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
  placeholder?: string;
  autoFocus?: boolean;
  level?: number; // Indentation level for visual styling
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
  placeholder = 'Type something...',
  autoFocus = false,
  level = 0,
}) => {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
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

  return (
    <div
      className="relative group"
      style={{ paddingLeft: `${level * 24}px` }}
    >
      {/* Level indicator line */}
      {level > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-px bg-gray-200"
          style={{ left: `${(level - 1) * 24 + 12}px` }}
        />
      )}

      {/* Bullet point for non-root blocks */}
      {level > 0 && (
        <div
          className="absolute w-2 h-2 bg-gray-400 rounded-full"
          style={{
            left: `${(level - 1) * 24 + 8}px`,
            top: '0.75rem'
          }}
        />
      )}

      <div className="relative">
        <EditorContent editor={editor} />

        {/* Floating toolbar for quick actions */}
        <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={handlePageReference}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Add page reference"
            >
              [[]]
            </button>
            <button
              type="button"
              onClick={handleBlockReference}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
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
