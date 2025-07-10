/**
 * 块元素渲染组件
 */

import React from 'react'
import { RenderElementProps } from 'slate-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Type,
  Hash,
  List,
  Quote,
  Code,
  Minus,
  Image as ImageIcon,
  Video,
  Music,
  File,
  Table,
  AlertCircle,
  ChevronRight,
  Columns,
  Globe,
  Calculator,
  GitBranch,
  CheckSquare,
  GripVertical
} from 'lucide-react'

import { CustomElement, BlockType } from '../types'

interface BlockElementProps extends RenderElementProps {
  element: CustomElement
  onBlockUpdate?: (block: CustomElement) => void
  onBlockDelete?: (blockId: string) => void
}

export const BlockElement: React.FC<BlockElementProps> = ({
  element,
  attributes,
  children,
  onBlockUpdate,
  onBlockDelete
}) => {
  const {
    attributes: sortableAttributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: element.id,
    data: {
      type: 'block',
      element
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  // 获取块类型图标
  const getBlockIcon = (type: BlockType) => {
    switch (type) {
      case 'paragraph':
        return <Type className="w-4 h-4" />
      case 'heading-1':
      case 'heading-2':
      case 'heading-3':
      case 'heading-4':
      case 'heading-5':
      case 'heading-6':
        return <Hash className="w-4 h-4" />
      case 'bulleted-list':
      case 'numbered-list':
        return <List className="w-4 h-4" />
      case 'todo-list':
        return <CheckSquare className="w-4 h-4" />
      case 'quote':
        return <Quote className="w-4 h-4" />
      case 'code':
        return <Code className="w-4 h-4" />
      case 'divider':
        return <Minus className="w-4 h-4" />
      case 'image':
        return <ImageIcon className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      case 'audio':
        return <Music className="w-4 h-4" />
      case 'file':
        return <File className="w-4 h-4" />
      case 'table':
        return <Table className="w-4 h-4" />
      case 'callout':
        return <AlertCircle className="w-4 h-4" />
      case 'toggle':
        return <ChevronRight className="w-4 h-4" />
      case 'columns':
        return <Columns className="w-4 h-4" />
      case 'embed':
        return <Globe className="w-4 h-4" />
      case 'math':
        return <Calculator className="w-4 h-4" />
      case 'mermaid':
        return <GitBranch className="w-4 h-4" />
      default:
        return <Type className="w-4 h-4" />
    }
  }

  // 渲染不同类型的块
  const renderBlockContent = () => {
    switch (element.type) {
      case 'paragraph':
        return (
          <p 
            className={`text-base leading-relaxed ${
              (element as any).align ? `text-${(element as any).align}` : ''
            }`}
            {...attributes}
          >
            {children}
          </p>
        )

      case 'heading-1':
        return (
          <h1 
            className={`text-3xl font-bold mb-4 ${
              (element as any).align ? `text-${(element as any).align}` : ''
            }`}
            {...attributes}
          >
            {children}
          </h1>
        )

      case 'heading-2':
        return (
          <h2 
            className={`text-2xl font-semibold mb-3 ${
              (element as any).align ? `text-${(element as any).align}` : ''
            }`}
            {...attributes}
          >
            {children}
          </h2>
        )

      case 'heading-3':
        return (
          <h3 
            className={`text-xl font-medium mb-2 ${
              (element as any).align ? `text-${(element as any).align}` : ''
            }`}
            {...attributes}
          >
            {children}
          </h3>
        )

      case 'bulleted-list':
        return (
          <ul className="list-disc list-inside space-y-1" {...attributes}>
            <li>{children}</li>
          </ul>
        )

      case 'numbered-list':
        return (
          <ol className="list-decimal list-inside space-y-1" {...attributes}>
            <li>{children}</li>
          </ol>
        )

      case 'todo-list':
        return (
          <div className="flex items-start space-x-2" {...attributes}>
            <input
              type="checkbox"
              checked={(element as any).checked || false}
              onChange={(e) => {
                // TODO: 实现待办状态切换
                console.log('Todo checked:', e.target.checked)
              }}
              className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">{children}</div>
          </div>
        )

      case 'quote':
        return (
          <blockquote 
            className="border-l-4 border-gray-300 pl-4 py-2 italic text-gray-700 bg-gray-50 rounded-r"
            {...attributes}
          >
            {children}
            {(element as any).author && (
              <cite className="block text-sm text-gray-500 mt-2">
                — {(element as any).author}
              </cite>
            )}
          </blockquote>
        )

      case 'code':
        return (
          <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
            {(element as any).language && (
              <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300">
                {(element as any).language}
              </div>
            )}
            <pre 
              className="p-4 overflow-x-auto text-sm font-mono"
              {...attributes}
            >
              <code>{children}</code>
            </pre>
          </div>
        )

      case 'divider':
        return (
          <div className="my-6" {...attributes}>
            <hr className="border-gray-300" />
            {children}
          </div>
        )

      case 'image':
        return (
          <div className="my-4" {...attributes}>
            <img
              src={(element as any).url}
              alt={(element as any).alt || ''}
              className="max-w-full h-auto rounded-lg shadow-sm"
              style={{
                width: (element as any).width ? `${(element as any).width}px` : 'auto',
                height: (element as any).height ? `${(element as any).height}px` : 'auto'
              }}
            />
            {(element as any).caption && (
              <p className="text-sm text-gray-500 text-center mt-2">
                {(element as any).caption}
              </p>
            )}
            {children}
          </div>
        )

      case 'video':
        return (
          <div className="my-4" {...attributes}>
            <video
              src={(element as any).url}
              poster={(element as any).poster}
              controls={(element as any).controls !== false}
              autoPlay={(element as any).autoplay || false}
              className="max-w-full h-auto rounded-lg shadow-sm"
              style={{
                width: (element as any).width ? `${(element as any).width}px` : 'auto',
                height: (element as any).height ? `${(element as any).height}px` : 'auto'
              }}
            />
            {(element as any).caption && (
              <p className="text-sm text-gray-500 text-center mt-2">
                {(element as any).caption}
              </p>
            )}
            {children}
          </div>
        )

      case 'audio':
        return (
          <div className="my-4" {...attributes}>
            <audio
              src={(element as any).url}
              controls={(element as any).controls !== false}
              autoPlay={(element as any).autoplay || false}
              className="w-full"
            />
            {(element as any).caption && (
              <p className="text-sm text-gray-500 text-center mt-2">
                {(element as any).caption}
              </p>
            )}
            {children}
          </div>
        )

      case 'file':
        return (
          <div className="my-4 p-4 border border-gray-200 rounded-lg" {...attributes}>
            <div className="flex items-center space-x-3">
              <File className="w-8 h-8 text-gray-400" />
              <div className="flex-1">
                <a
                  href={(element as any).url}
                  download={(element as any).filename}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {(element as any).filename}
                </a>
                {(element as any).size && (
                  <p className="text-sm text-gray-500">
                    {Math.round((element as any).size / 1024)} KB
                  </p>
                )}
              </div>
            </div>
            {children}
          </div>
        )

      case 'table':
        return (
          <div className="overflow-x-auto my-4" {...attributes}>
            <table className="min-w-full border border-gray-300 rounded-lg">
              <tbody>
                {children}
              </tbody>
            </table>
          </div>
        )

      case 'callout':
        return (
          <div 
            className={`p-4 rounded-lg border-l-4 my-4 ${
              (element as any).color === 'warning' 
                ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                : (element as any).color === 'error'
                ? 'bg-red-50 border-red-400 text-red-800'
                : (element as any).color === 'success'
                ? 'bg-green-50 border-green-400 text-green-800'
                : 'bg-blue-50 border-blue-400 text-blue-800'
            }`}
            {...attributes}
          >
            <div className="flex items-start space-x-3">
              {(element as any).icon && (
                <span className="text-lg">{(element as any).icon}</span>
              )}
              <div className="flex-1">{children}</div>
            </div>
          </div>
        )

      case 'toggle':
        return (
          <details
            className="my-2"
            open={(element as any).isOpen}
            {...attributes}
          >
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900 flex items-center space-x-2">
              <ChevronRight className="w-4 h-4 transition-transform" />
              <span>{(element as any).title}</span>
            </summary>
            <div className="mt-2 ml-6 pl-4 border-l-2 border-gray-200">
              {children}
            </div>
          </details>
        )

      case 'columns':
        return (
          <div
            className="my-4 grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${(element as any).columnCount || 2}, 1fr)`,
              gap: `${(element as any).columnGap || 16}px`
            }}
            {...attributes}
          >
            {children}
          </div>
        )

      case 'embed':
        return (
          <div className="my-4" {...attributes}>
            <iframe
              src={(element as any).url}
              width={(element as any).width || '100%'}
              height={(element as any).height || '400px'}
              className="w-full border border-gray-200 rounded-lg"
              allowFullScreen
            />
            {children}
          </div>
        )

      case 'math':
        return (
          <div className="my-4" {...attributes}>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <code className="text-sm font-mono">
                {(element as any).formula}
              </code>
            </div>
            {children}
          </div>
        )

      case 'mermaid':
        return (
          <div className="my-4" {...attributes}>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {(element as any).chart}
              </pre>
            </div>
            {children}
          </div>
        )

      default:
        return (
          <div {...attributes}>
            {children}
          </div>
        )
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
      {...sortableAttributes}
    >
      {/* 拖拽手柄 */}
      <div 
        className="absolute left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        style={{ marginLeft: '-24px' }}
        {...listeners}
      >
        <div className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* 块类型指示器 */}
      <div 
        className="absolute left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ marginLeft: '-48px' }}
      >
        <div className="flex items-center justify-center w-6 h-6 text-gray-400">
          {getBlockIcon(element.type)}
        </div>
      </div>

      {/* 块内容 */}
      <div className="relative">
        {renderBlockContent()}
      </div>
    </div>
  )
}

export default BlockElement
