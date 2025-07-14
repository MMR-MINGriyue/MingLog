/**
 * 块引用渲染器组件
 * 
 * 功能：
 * - 解析文本中的块引用语法
 * - 将块引用转换为可点击的BlockReference组件
 * - 保持文本的其他部分不变
 * - 支持自定义块引用处理逻辑
 */

import React, { useMemo } from 'react'
import BlockReference, { BlockReferenceProps } from '../BlockReference/BlockReference'
// 注意：这里需要从notes模块导入BlockReferenceParser
// 在实际使用中，需要确保正确的导入路径
// import BlockReferenceParser, { BlockMatch } from '@minglog/notes/parsers/BlockReferenceParser'

// 临时使用本地实现，实际项目中应该从notes模块导入
const BlockReferenceParser = {
  parse: (text: string) => {
    const blockReferences: any[] = []
    const regex = /\(\(([^)]+)\)\)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, blockId] = match
      blockReferences.push({
        fullMatch,
        blockId: blockId.trim(),
        startIndex: match.index,
        endIndex: match.index + fullMatch.length,
        type: 'block'
      })
    }

    return {
      originalText: text,
      blockReferences,
      processedText: text,
      hasBlockReferences: blockReferences.length > 0
    }
  },

  extractBlockIds: (text: string): string[] => {
    const parseResult = BlockReferenceParser.parse(text)
    const blockIds = parseResult.blockReferences.map((ref: any) => ref.blockId)
    return [...new Set(blockIds)]
  },

  hasBlockReferences: (text: string): boolean => {
    return /\(\([^)]+\)\)/.test(text)
  },

  getBlockReferenceStats: (text: string) => {
    const parseResult = BlockReferenceParser.parse(text)
    const uniqueBlockIds = new Set(parseResult.blockReferences.map((ref: any) => ref.blockId))

    return {
      totalReferences: parseResult.blockReferences.length,
      uniqueBlocks: uniqueBlockIds.size,
      hasReferences: parseResult.hasBlockReferences,
      blockIds: Array.from(uniqueBlockIds)
    }
  },

  isValidBlockId: (blockId: string): boolean => {
    if (!blockId || typeof blockId !== 'string') return false
    const trimmed = blockId.trim()
    return trimmed.length > 0 && trimmed.length <= 64 && /^[a-zA-Z0-9_-]+$/.test(trimmed)
  },

  createBlockReference: (blockId: string): string => {
    if (!BlockReferenceParser.isValidBlockId(blockId)) {
      throw new Error(`Invalid block ID: ${blockId}`)
    }
    return `((${blockId.trim()}))`
  }
}

export interface BlockReferenceRendererProps {
  /** 要渲染的文本内容 */
  content: string
  /** 块引用点击处理函数 */
  onBlockClick?: (blockId: string) => void
  /** 块引用预览处理函数 */
  onBlockPreview?: (blockId: string) => Promise<string | null>
  /** 检查块是否存在的函数 */
  checkBlockExists?: (blockId: string) => boolean
  /** 获取块内容的函数 */
  getBlockContent?: (blockId: string) => string | null
  /** 获取块类型的函数 */
  getBlockType?: (blockId: string) => 'paragraph' | 'heading' | 'list' | 'code' | 'quote'
  /** 自定义块引用组件属性 */
  blockProps?: Partial<BlockReferenceProps>
  /** 自定义样式类名 */
  className?: string
  /** 是否保留换行符 */
  preserveLineBreaks?: boolean
}

export interface ParsedBlockSegment {
  type: 'text' | 'block'
  content: string
  blockId?: string
  startIndex: number
  endIndex: number
}

export const BlockReferenceRenderer: React.FC<BlockReferenceRendererProps> = ({
  content,
  onBlockClick,
  onBlockPreview,
  checkBlockExists,
  getBlockContent,
  getBlockType,
  blockProps = {},
  className,
  preserveLineBreaks = true
}) => {
  // 解析文本中的块引用
  const parsedSegments = useMemo(() => {
    const segments: ParsedBlockSegment[] = []
    
    if (!content) {
      return segments
    }

    // 使用BlockReferenceParser解析块引用
    const parseResult = BlockReferenceParser.parse(content)
    const blockReferences = parseResult.blockReferences

    let lastIndex = 0

    // 处理每个块引用
    for (const blockRef of blockReferences) {
      // 添加块引用前的文本
      if (blockRef.startIndex > lastIndex) {
        const textContent = content.substring(lastIndex, blockRef.startIndex)
        if (textContent) {
          segments.push({
            type: 'text',
            content: textContent,
            startIndex: lastIndex,
            endIndex: blockRef.startIndex
          })
        }
      }

      // 添加块引用
      segments.push({
        type: 'block',
        content: blockRef.fullMatch,
        blockId: blockRef.blockId,
        startIndex: blockRef.startIndex,
        endIndex: blockRef.endIndex
      })

      lastIndex = blockRef.endIndex
    }

    // 添加最后的文本
    if (lastIndex < content.length) {
      const textContent = content.substring(lastIndex)
      if (textContent) {
        segments.push({
          type: 'text',
          content: textContent,
          startIndex: lastIndex,
          endIndex: content.length
        })
      }
    }

    // 如果没有块引用，返回整个文本作为一个段落
    if (segments.length === 0) {
      segments.push({
        type: 'text',
        content,
        startIndex: 0,
        endIndex: content.length
      })
    }

    return segments
  }, [content])

  // 渲染文本段落
  const renderTextSegment = (segment: ParsedBlockSegment, index: number) => {
    if (!segment.content) return null

    if (preserveLineBreaks) {
      // 处理换行符
      const lines = segment.content.split('\n')
      return (
        <React.Fragment key={index}>
          {lines.map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
              {line}
              {lineIndex < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </React.Fragment>
      )
    }

    return <React.Fragment key={index}>{segment.content}</React.Fragment>
  }

  // 渲染块引用段落
  const renderBlockSegment = (segment: ParsedBlockSegment, index: number) => {
    if (!segment.blockId) return null

    const exists = checkBlockExists ? checkBlockExists(segment.blockId) : true
    const blockContent = getBlockContent ? getBlockContent(segment.blockId) : null
    const blockType = getBlockType ? getBlockType(segment.blockId) : 'paragraph'

    return (
      <BlockReference
        key={index}
        blockId={segment.blockId}
        exists={exists}
        variant={exists ? 'default' : 'broken'}
        blockType={blockType}
        blockContent={blockContent || undefined}
        onClick={onBlockClick}
        onPreview={onBlockPreview}
        {...blockProps}
      />
    )
  }

  // 渲染所有段落
  const renderedContent = parsedSegments.map((segment, index) => {
    if (segment.type === 'text') {
      return renderTextSegment(segment, index)
    } else if (segment.type === 'block') {
      return renderBlockSegment(segment, index)
    }
    return null
  })

  return (
    <span className={className}>
      {renderedContent}
    </span>
  )
}

// 工具函数：提取文本中的所有块引用
export const extractBlockReferences = (content: string): string[] => {
  return BlockReferenceParser.extractBlockIds(content)
}

// 工具函数：检查文本是否包含块引用
export const hasBlockReferences = (content: string): boolean => {
  return BlockReferenceParser.hasBlockReferences(content)
}

// 工具函数：获取块引用统计信息
export const getBlockReferenceStats = (content: string) => {
  return BlockReferenceParser.getBlockReferenceStats(content)
}

// 工具函数：替换文本中的块引用
export const replaceBlockReferences = (
  content: string,
  replacer: (blockId: string, fullMatch: string) => string
): string => {
  const parseResult = BlockReferenceParser.parse(content)
  let result = content
  let offset = 0

  for (const blockRef of parseResult.blockReferences) {
    const replacement = replacer(blockRef.blockId, blockRef.fullMatch)
    const start = blockRef.startIndex + offset
    const end = blockRef.endIndex + offset
    
    result = result.substring(0, start) + replacement + result.substring(end)
    offset += replacement.length - blockRef.fullMatch.length
  }

  return result
}

// 工具函数：验证块引用语法
export const validateBlockReference = (blockId: string): boolean => {
  return BlockReferenceParser.isValidBlockId(blockId)
}

// 工具函数：创建块引用语法
export const createBlockReference = (blockId: string): string => {
  return BlockReferenceParser.createBlockReference(blockId)
}

export default BlockReferenceRenderer
