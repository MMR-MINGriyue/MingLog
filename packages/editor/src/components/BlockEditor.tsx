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
  placeholder?: string;
  autoFocus?: boolean;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  block,
  onUpdate,
  onEnter,
  onBackspace,
  placeholder = 'Type something...',
  autoFocus = false,
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
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onEnter?.();
          return true;
        }
        
        if (event.key === 'Backspace' && editor?.isEmpty) {
          event.preventDefault();
          onBackspace?.();
          return true;
        }
        
        return false;
      },
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
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
    
    const { from, to } = editor.state.selection;
    editor.chain().focus().insertContent('[[]]').run();
    // Move cursor between brackets
    editor.commands.setTextSelection(to + 2);
  }, [editor]);

  const handleBlockReference = useCallback(() => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    editor.chain().focus().insertContent('(())').run();
    // Move cursor between brackets
    editor.commands.setTextSelection(to + 2);
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative">
      <EditorContent editor={editor} />
      
      {/* Floating toolbar for quick actions */}
      <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex space-x-1">
          <button
            onClick={handlePageReference}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Add page reference"
          >
            [[]]
          </button>
          <button
            onClick={handleBlockReference}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Add block reference"
          >
            (())
          </button>
        </div>
      </div>
    </div>
  );
};
