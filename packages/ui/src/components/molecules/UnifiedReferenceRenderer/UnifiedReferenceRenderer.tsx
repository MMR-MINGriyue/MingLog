/**
 * 统一引用渲染器组件
 * 
 * 功能：
 * - 同时解析和渲染双向链接和块引用
 * - 统一的引用体验和交互
 * - 支持混合内容的智能解析
 * - 提供统一的配置接口
 */

import React, { useMemo } from 'react'
import { BiDirectionalLink, BiDirectionalLinkProps } from '../BiDirectionalLink'
import { BlockReference, BlockReferenceProps } from '../BlockReference'

// 临时使用本地解析器实现，实际项目中应该从相应模块导入
const BiDirectionalLinkParser = {
  parse: (text: string) => {
    const links: any[] = []
    const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, pageName, displayText] = match
      links.push({
        fullMatch,
        pageName: pageName.trim(),
        displayText: displayText?.trim(),
        startIndex: match.index,
        endIndex: match.index + fullMatch.length,
        type: 'link'
      })
    }

    return {
      originalText: text,
      links,
      processedText: text,
      hasLinks: links.length > 0
    }
  }
}

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
  }
}

export interface UnifiedReferenceRendererProps {
  /** 要渲染的文本内容 */
  content: string
  
  // 双向链接相关配置
  /** 链接点击处理函数 */
  onLinkClick?: (pageName: string) => void
  /** 链接预览处理函数 */
  onLinkPreview?: (pageName: string) => Promise<string | null>
  /** 检查链接是否存在的函数 */
  checkLinkExists?: (pageName: string) => boolean
  /** 自定义链接组件属性 */
  linkProps?: Partial<BiDirectionalLinkProps>
  
  // 块引用相关配置
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
  
  // 通用配置
  /** 自定义样式类名 */
  className?: string
  /** 是否保留换行符 */
  preserveLineBreaks?: boolean
}

export interface ParsedReference {
  type: 'text' | 'link' | 'block'
  content: string
  startIndex: number
  endIndex: number
  // 链接特有属性
  pageName?: string
  displayText?: string
  // 块引用特有属性
  blockId?: string
}

export const UnifiedReferenceRenderer: React.FC<UnifiedReferenceRendererProps> = ({
  content,
  onLinkClick,
  onLinkPreview,
  checkLinkExists,
  linkProps = {},
  onBlockClick,
  onBlockPreview,
  checkBlockExists,
  getBlockContent,
  getBlockType,
  blockProps = {},
  className,
  preserveLineBreaks = true
}) => {
  // 解析文本中的所有引用
  const parsedReferences = useMemo(() => {
    const references: ParsedReference[] = []
    
    if (!content) {
      return references
    }

    // 解析双向链接和块引用
    const linkResult = BiDirectionalLinkParser.parse(content)
    const blockResult = BlockReferenceParser.parse(content)

    // 合并所有引用并按位置排序
    const allReferences = [
      ...linkResult.links.map((link: any) => ({
        type: 'link' as const,
        content: link.fullMatch,
        startIndex: link.startIndex,
        endIndex: link.endIndex,
        pageName: link.pageName,
        displayText: link.displayText
      })),
      ...blockResult.blockReferences.map((block: any) => ({
        type: 'block' as const,
        content: block.fullMatch,
        startIndex: block.startIndex,
        endIndex: block.endIndex,
        blockId: block.blockId
      }))
    ].sort((a, b) => a.startIndex - b.startIndex)

    let lastIndex = 0

    // 处理每个引用
    for (const ref of allReferences) {
      // 添加引用前的文本
      if (ref.startIndex > lastIndex) {
        const textContent = content.substring(lastIndex, ref.startIndex)
        if (textContent) {
          references.push({
            type: 'text',
            content: textContent,
            startIndex: lastIndex,
            endIndex: ref.startIndex
          })
        }
      }

      // 添加引用
      references.push(ref)
      lastIndex = ref.endIndex
    }

    // 添加最后的文本
    if (lastIndex < content.length) {
      const textContent = content.substring(lastIndex)
      if (textContent) {
        references.push({
          type: 'text',
          content: textContent,
          startIndex: lastIndex,
          endIndex: content.length
        })
      }
    }

    // 如果没有引用，返回整个文本作为一个段落
    if (references.length === 0) {
      references.push({
        type: 'text',
        content,
        startIndex: 0,
        endIndex: content.length
      })
    }

    return references
  }, [content])

  // 渲染文本段落
  const renderTextSegment = (reference: ParsedReference, index: number) => {
    if (!reference.content) return null

    if (preserveLineBreaks) {
      // 处理换行符
      const lines = reference.content.split('\n')
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

    return <React.Fragment key={index}>{reference.content}</React.Fragment>
  }

  // 渲染双向链接段落
  const renderLinkSegment = (reference: ParsedReference, index: number) => {
    if (!reference.pageName) return null

    const exists = checkLinkExists ? checkLinkExists(reference.pageName) : true
    const variant = reference.displayText ? 'alias' : 'default'

    return (
      <BiDirectionalLink
        key={index}
        pageName={reference.pageName}
        displayText={reference.displayText}
        exists={exists}
        variant={exists ? variant : 'broken'}
        onClick={onLinkClick}
        onPreview={onLinkPreview}
        {...linkProps}
      />
    )
  }

  // 渲染块引用段落
  const renderBlockSegment = (reference: ParsedReference, index: number) => {
    if (!reference.blockId) return null

    const exists = checkBlockExists ? checkBlockExists(reference.blockId) : true
    const blockContent = getBlockContent ? getBlockContent(reference.blockId) : null
    const blockType = getBlockType ? getBlockType(reference.blockId) : 'paragraph'

    return (
      <BlockReference
        key={index}
        blockId={reference.blockId}
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
  const renderedContent = parsedReferences.map((reference, index) => {
    switch (reference.type) {
      case 'text':
        return renderTextSegment(reference, index)
      case 'link':
        return renderLinkSegment(reference, index)
      case 'block':
        return renderBlockSegment(reference, index)
      default:
        return null
    }
  })

  return (
    <span className={className}>
      {renderedContent}
    </span>
  )
}

// 工具函数：提取文本中的所有引用
export const extractAllReferences = (content: string) => {
  const linkResult = BiDirectionalLinkParser.parse(content)
  const blockResult = BlockReferenceParser.parse(content)

  return {
    links: linkResult.links.map((link: any) => link.pageName),
    blocks: blockResult.blockReferences.map((block: any) => block.blockId),
    hasReferences: linkResult.hasLinks || blockResult.hasBlockReferences
  }
}

// 工具函数：检查文本是否包含任何引用
export const hasAnyReferences = (content: string): boolean => {
  const { hasReferences } = extractAllReferences(content)
  return hasReferences
}

// 工具函数：获取引用统计信息
export const getReferenceStats = (content: string) => {
  const { links, blocks } = extractAllReferences(content)
  
  return {
    totalReferences: links.length + blocks.length,
    linkCount: links.length,
    blockCount: blocks.length,
    uniqueLinks: [...new Set(links)].length,
    uniqueBlocks: [...new Set(blocks)].length
  }
}

export default UnifiedReferenceRenderer
