import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { StarterKit } from '@tiptap/starter-kit';
import { BidirectionalLinkSimple } from './extensions/BidirectionalLinkSimple';

/**
 * TipTap编辑器测试组件
 * 用于验证Schema配置是否正确
 */
const TipTapTest: React.FC = () => {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      StarterKit.configure({
        document: false, // 禁用StarterKit的document，使用我们自己的
        paragraph: false, // 禁用StarterKit的paragraph，使用我们自己的
        text: false, // 禁用StarterKit的text，使用我们自己的
      }),
      BidirectionalLinkSimple.configure({
        onLinkClick: (linkText: string, linkType: 'page' | 'block') => {
          console.log(`链接点击: ${linkType} - ${linkText}`)
          alert(`点击了${linkType === 'page' ? '页面' : '块'}链接: ${linkText}`)
        },
        onLinkCreate: async (linkText: string, linkType: 'page' | 'block') => {
          console.log(`验证链接: ${linkType} - ${linkText}`)
          // 模拟链接验证，实际应该查询数据库
          return Math.random() > 0.3 // 70%的链接存在
        },
        getPageSuggestions: async (query: string) => {
          console.log(`获取页面建议: ${query}`)
          // 模拟页面建议
          return ['示例页面1', '示例页面2', '测试页面'].filter(page =>
            page.toLowerCase().includes(query.toLowerCase())
          )
        },
      }),
    ],
    content: '<p>TipTap编辑器双向链接测试！</p><p>试试输入 [[示例页面]] 或 ((块ID123)) 来创建链接。</p><p>你也可以使用 Ctrl+K 快捷键插入链接。</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4 border border-gray-300 rounded-md',
      },
    },
  });

  if (!editor) {
    return <div className="p-4 text-gray-500">编辑器加载中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">TipTap编辑器Schema测试</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">编辑器状态</h2>
        <div className="text-sm text-gray-600">
          <p>编辑器已初始化: {editor ? '✅ 是' : '❌ 否'}</p>
          <p>Schema有效: {editor?.schema ? '✅ 是' : '❌ 否'}</p>
          <p>文档节点: {editor?.schema.topNodeType?.name || '❌ 未找到'}</p>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">编辑器内容</h2>
        <EditorContent editor={editor} />
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">工具栏</h2>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            粗体
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            斜体
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('paragraph') ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            段落
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            标题1
          </button>
          <button
            type="button"
            onClick={() => {
              const pageName = prompt('输入页面名称:')
              if (pageName) {
                editor.chain().focus().insertPageLink(pageName).run()
              }
            }}
            className="px-3 py-1 rounded bg-green-200 hover:bg-green-300 text-green-800"
          >
            插入页面链接
          </button>
          <button
            type="button"
            onClick={() => {
              const blockId = prompt('输入块ID:')
              if (blockId) {
                editor.chain().focus().insertBlockReference(blockId).run()
              }
            }}
            className="px-3 py-1 rounded bg-purple-200 hover:bg-purple-300 text-purple-800"
          >
            插入块引用
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">调试信息</h2>
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
          {JSON.stringify({
            hasEditor: !!editor,
            hasSchema: !!editor?.schema,
            topNodeType: editor?.schema?.topNodeType?.name,
            nodeTypes: editor?.schema ? Object.keys(editor.schema.nodes) : [],
            markTypes: editor?.schema ? Object.keys(editor.schema.marks) : [],
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TipTapTest;
