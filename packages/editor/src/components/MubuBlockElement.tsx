/**
 * 幕布风格块元素组件
 * 实现层级缩进、折叠展开、视觉指示等幕布特色功能
 */

import React, { useCallback, useMemo } from 'react'
import { RenderElementProps, useSelected, useFocused } from 'slate-react'
import { CustomElement, MubuEditorConfig } from '../types'

/**
 * 幕布块元素属性
 */
export interface MubuBlockElementProps extends RenderElementProps {
  element: CustomElement
  config: MubuEditorConfig
  onToggleCollapse?: (blockId: string) => void
  onBlockFocus?: (blockId: string) => void
}

/**
 * 幕布块元素组件
 */
export const MubuBlockElement: React.FC<MubuBlockElementProps> = ({
  attributes,
  children,
  element,
  config,
  onToggleCollapse,
  onBlockFocus
}) => {
  const selected = useSelected()
  const focused = useFocused()
  
  // 计算缩进样式
  const indentStyle = useMemo(() => {
    const level = element.level || 0
    const indentSize = config.indentSize || 20
    
    return {
      paddingLeft: `${level * indentSize}px`,
      position: 'relative' as const
    }
  }, [element.level, config.indentSize])

  // 计算块样式类名
  const blockClassName = useMemo(() => {
    const classes = ['mubu-block']
    
    if (selected && focused) {
      classes.push('mubu-block--focused')
    }
    
    if (element.isCollapsed) {
      classes.push('mubu-block--collapsed')
    }
    
    if (element.metadata?.hasChildren) {
      classes.push('mubu-block--has-children')
    }
    
    if (config.highlightCurrentBlock && (selected || focused)) {
      classes.push('mubu-block--highlighted')
    }
    
    return classes.join(' ')
  }, [selected, focused, element.isCollapsed, element.metadata?.hasChildren, config.highlightCurrentBlock])

  // 处理折叠切换
  const handleToggleCollapse = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (element.id && onToggleCollapse) {
      onToggleCollapse(element.id)
    }
  }, [element.id, onToggleCollapse])

  // 处理块聚焦
  const handleBlockFocus = useCallback(() => {
    if (element.id && onBlockFocus) {
      onBlockFocus(element.id)
    }
  }, [element.id, onBlockFocus])

  // 渲染缩进指示线
  const renderIndentGuides = () => {
    if (!config.showIndentGuides || !element.level) {
      return null
    }

    const guides = []
    const level = element.level || 0
    const indentSize = config.indentSize || 20

    for (let i = 0; i < level; i++) {
      guides.push(
        <div
          key={i}
          className="mubu-indent-guide"
          style={{
            position: 'absolute',
            left: `${i * indentSize + indentSize / 2}px`,
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: 'var(--mubu-indent-guide-color, #e5e7eb)',
            opacity: 0.5
          }}
        />
      )
    }

    return <>{guides}</>
  }

  // 渲染折叠图标
  const renderCollapseIcon = () => {
    if (!config.showCollapseIcons || !element.metadata?.hasChildren) {
      return null
    }

    return (
      <button
        className="mubu-collapse-icon"
        onClick={handleToggleCollapse}
        style={{
          position: 'absolute',
          left: `${((element.level || 0) * (config.indentSize || 20)) - 16}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '12px',
          height: '12px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: 'var(--mubu-collapse-icon-color, #6b7280)'
        }}
        aria-label={element.isCollapsed ? '展开' : '折叠'}
      >
        {element.isCollapsed ? '▶' : '▼'}
      </button>
    )
  }

  // 渲染块内容
  const renderBlockContent = () => {
    switch (element.type) {
      case 'heading-1':
        return <h1 className="mubu-heading mubu-heading-1">{children}</h1>
      case 'heading-2':
        return <h2 className="mubu-heading mubu-heading-2">{children}</h2>
      case 'heading-3':
        return <h3 className="mubu-heading mubu-heading-3">{children}</h3>
      case 'heading-4':
        return <h4 className="mubu-heading mubu-heading-4">{children}</h4>
      case 'heading-5':
        return <h5 className="mubu-heading mubu-heading-5">{children}</h5>
      case 'heading-6':
        return <h6 className="mubu-heading mubu-heading-6">{children}</h6>
      case 'bulleted-list':
        return (
          <div className="mubu-list-item mubu-bulleted-list">
            <span className="mubu-bullet">•</span>
            <div className="mubu-list-content">{children}</div>
          </div>
        )
      case 'numbered-list':
        return (
          <div className="mubu-list-item mubu-numbered-list">
            <span className="mubu-number">{element.metadata?.siblingIndex || 1}.</span>
            <div className="mubu-list-content">{children}</div>
          </div>
        )
      case 'todo-list':
        return (
          <div className="mubu-list-item mubu-todo-list">
            <input
              type="checkbox"
              className="mubu-checkbox"
              checked={element.metadata?.customData?.checked || false}
              onChange={() => {
                // 处理复选框状态变化
              }}
            />
            <div className="mubu-list-content">{children}</div>
          </div>
        )
      case 'quote':
        return (
          <blockquote className="mubu-quote">
            <div className="mubu-quote-content">{children}</div>
          </blockquote>
        )
      case 'code':
        return (
          <pre className="mubu-code-block">
            <code>{children}</code>
          </pre>
        )
      default:
        return <div className="mubu-paragraph">{children}</div>
    }
  }

  return (
    <div
      {...attributes}
      className={blockClassName}
      style={indentStyle}
      onFocus={handleBlockFocus}
      data-block-id={element.id}
      data-block-level={element.level || 0}
      data-block-type={element.type}
    >
      {/* 缩进指示线 */}
      {renderIndentGuides()}
      
      {/* 折叠图标 */}
      {renderCollapseIcon()}
      
      {/* 块内容 */}
      <div className="mubu-block-content">
        {renderBlockContent()}
      </div>
      
      {/* 子块容器（如果未折叠） */}
      {element.metadata?.hasChildren && !element.isCollapsed && (
        <div className="mubu-children-container">
          {/* 子块将由Slate自动渲染 */}
        </div>
      )}
    </div>
  )
}

/**
 * 默认样式（可以通过CSS变量自定义）
 */
export const MubuBlockStyles = `
  .mubu-block {
    position: relative;
    margin: 2px 0;
    min-height: 1.5em;
    line-height: 1.5;
    transition: background-color 0.15s ease;
  }

  .mubu-block--focused {
    background-color: var(--mubu-focus-bg, rgba(59, 130, 246, 0.1));
    border-radius: 4px;
  }

  .mubu-block--highlighted {
    background-color: var(--mubu-highlight-bg, rgba(59, 130, 246, 0.05));
    border-radius: 4px;
  }

  .mubu-block--collapsed .mubu-children-container {
    display: none;
  }

  .mubu-block-content {
    position: relative;
    z-index: 1;
  }

  .mubu-heading {
    margin: 0;
    font-weight: 600;
  }

  .mubu-heading-1 { font-size: 2em; }
  .mubu-heading-2 { font-size: 1.5em; }
  .mubu-heading-3 { font-size: 1.25em; }
  .mubu-heading-4 { font-size: 1.125em; }
  .mubu-heading-5 { font-size: 1em; }
  .mubu-heading-6 { font-size: 0.875em; }

  .mubu-list-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .mubu-bullet,
  .mubu-number {
    flex-shrink: 0;
    color: var(--mubu-bullet-color, #6b7280);
    font-weight: 500;
    margin-top: 2px;
  }

  .mubu-checkbox {
    margin-top: 2px;
    cursor: pointer;
  }

  .mubu-list-content {
    flex: 1;
    min-width: 0;
  }

  .mubu-quote {
    margin: 0;
    padding-left: 16px;
    border-left: 3px solid var(--mubu-quote-border, #e5e7eb);
    color: var(--mubu-quote-color, #6b7280);
    font-style: italic;
  }

  .mubu-code-block {
    margin: 0;
    padding: 12px;
    background-color: var(--mubu-code-bg, #f3f4f6);
    border-radius: 6px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 0.875em;
    overflow-x: auto;
  }

  .mubu-paragraph {
    margin: 0;
  }

  .mubu-collapse-icon:hover {
    background-color: var(--mubu-collapse-hover-bg, rgba(0, 0, 0, 0.1));
    border-radius: 2px;
  }

  .mubu-indent-guide {
    pointer-events: none;
  }

  /* 暗色主题支持 */
  @media (prefers-color-scheme: dark) {
    .mubu-block--focused {
      background-color: var(--mubu-focus-bg-dark, rgba(59, 130, 246, 0.2));
    }

    .mubu-block--highlighted {
      background-color: var(--mubu-highlight-bg-dark, rgba(59, 130, 246, 0.1));
    }

    .mubu-code-block {
      background-color: var(--mubu-code-bg-dark, #374151);
    }
  }
`
