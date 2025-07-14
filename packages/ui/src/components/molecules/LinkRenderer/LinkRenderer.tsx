/**
 * 链接渲染器组件
 * 
 * 功能：
 * - 解析文本中的双向链接语法
 * - 将链接转换为可点击的BiDirectionalLink组件
 * - 保持文本的其他部分不变
 * - 支持自定义链接处理逻辑
 */

import React, { useMemo } from 'react'
import { BiDirectionalLink, BiDirectionalLinkProps } from '../BiDirectionalLink'

export interface LinkRendererProps {
  /** 要渲染的文本内容 */
  content: string
  /** 链接点击处理函数 */
  onLinkClick?: (pageName: string) => void
  /** 链接预览处理函数 */
  onLinkPreview?: (pageName: string) => Promise<string | null>
  /** 检查链接是否存在的函数 */
  checkLinkExists?: (pageName: string) => boolean
  /** 自定义链接组件属性 */
  linkProps?: Partial<BiDirectionalLinkProps>
  /** 自定义样式类名 */
  className?: string
  /** 是否保留换行符 */
  preserveLineBreaks?: boolean
}

export interface ParsedSegment {
  type: 'text' | 'link'
  content: string
  pageName?: string
  displayText?: string
  startIndex: number
  endIndex: number
}

export const LinkRenderer: React.FC<LinkRendererProps> = ({
  content,
  onLinkClick,
  onLinkPreview,
  checkLinkExists,
  linkProps = {},
  className,
  preserveLineBreaks = true
}) => {
  // 解析文本中的链接
  const parsedSegments = useMemo(() => {
    const segments: ParsedSegment[] = []
    const linkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = linkRegex.exec(content)) !== null) {
      const [fullMatch, pageName, displayText] = match
      const startIndex = match.index
      const endIndex = startIndex + fullMatch.length

      // 添加链接前的文本
      if (startIndex > lastIndex) {
        segments.push({
          type: 'text',
          content: content.slice(lastIndex, startIndex),
          startIndex: lastIndex,
          endIndex: startIndex
        })
      }

      // 添加链接
      segments.push({
        type: 'link',
        content: fullMatch,
        pageName: pageName.trim(),
        displayText: displayText?.trim(),
        startIndex,
        endIndex
      })

      lastIndex = endIndex
    }

    // 添加最后的文本
    if (lastIndex < content.length) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex),
        startIndex: lastIndex,
        endIndex: content.length
      })
    }

    return segments
  }, [content])

  // 渲染文本段落
  const renderTextSegment = (segment: ParsedSegment, index: number) => {
    let text = segment.content

    // 处理换行符
    if (preserveLineBreaks && text.includes('\n')) {
      return (
        <span key={index}>
          {text.split('\n').map((line, lineIndex, lines) => (
            <React.Fragment key={lineIndex}>
              {line}
              {lineIndex < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </span>
      )
    }

    return <span key={index}>{text}</span>
  }

  // 渲染链接段落
  const renderLinkSegment = (segment: ParsedSegment, index: number) => {
    if (!segment.pageName) return null

    const exists = checkLinkExists ? checkLinkExists(segment.pageName) : true
    const variant = segment.displayText ? 'alias' : 'default'

    return (
      <BiDirectionalLink
        key={index}
        pageName={segment.pageName}
        displayText={segment.displayText}
        exists={exists}
        variant={exists ? variant : 'broken'}
        onClick={onLinkClick}
        onPreview={onLinkPreview}
        {...linkProps}
      />
    )
  }

  // 渲染所有段落
  const renderedContent = parsedSegments.map((segment, index) => {
    if (segment.type === 'text') {
      return renderTextSegment(segment, index)
    } else if (segment.type === 'link') {
      return renderLinkSegment(segment, index)
    }
    return null
  })

  return (
    <span className={className}>
      {renderedContent}
    </span>
  )
}

// 工具函数：提取文本中的所有链接
export const extractLinks = (content: string): Array<{
  pageName: string
  displayText?: string
  fullMatch: string
  startIndex: number
  endIndex: number
}> => {
  const links: Array<{
    pageName: string
    displayText?: string
    fullMatch: string
    startIndex: number
    endIndex: number
  }> = []
  
  const linkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(content)) !== null) {
    const [fullMatch, pageName, displayText] = match
    links.push({
      pageName: pageName.trim(),
      displayText: displayText?.trim(),
      fullMatch,
      startIndex: match.index,
      endIndex: match.index + fullMatch.length
    })
  }

  return links
}

// 工具函数：检查文本是否包含链接
export const hasLinks = (content: string): boolean => {
  const linkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/
  return linkRegex.test(content)
}

// 工具函数：获取链接统计
export const getLinkStats = (content: string) => {
  const links = extractLinks(content)
  const uniquePages = new Set(links.map(link => link.pageName))
  
  return {
    totalLinks: links.length,
    uniquePages: uniquePages.size,
    aliasLinks: links.filter(link => link.displayText).length,
    directLinks: links.filter(link => !link.displayText).length
  }
}

export default LinkRenderer
