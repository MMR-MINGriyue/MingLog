/**
 * MingLog 链接组件类型定义
 */

import React from 'react';
import { PageLink, BlockLink, BacklinkInfo, LinkSuggestion, BrokenLink } from '../../types/links';

// 页面链接组件属性
export interface PageLinkComponentProps {
  link: PageLink;
  exists?: boolean;
  showTooltip?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (pageName: string, link: PageLink) => void;
  onHover?: (pageName: string, link: PageLink) => void;
  onContextMenu?: (event: React.MouseEvent, pageName: string, link: PageLink) => void;
  disabled?: boolean;
  previewContent?: string;
}

// 块引用组件属性
export interface BlockReferenceComponentProps {
  link: BlockLink;
  exists?: boolean;
  blockContent?: string;
  blockTitle?: string;
  showPreview?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (blockId: string, link: BlockLink) => void;
  onHover?: (blockId: string, link: BlockLink) => void;
  onContextMenu?: (event: React.MouseEvent, blockId: string, link: BlockLink) => void;
  disabled?: boolean;
  displayMode?: 'inline' | 'block' | 'card';
}

// 损坏链接组件属性
export interface BrokenLinkComponentProps {
  brokenLink: BrokenLink;
  className?: string;
  style?: React.CSSProperties;
  onFix?: (brokenLink: BrokenLink, fixedText: string) => void;
  onRemove?: (brokenLink: BrokenLink) => void;
  onIgnore?: (brokenLink: BrokenLink) => void;
  showFixSuggestions?: boolean;
  editable?: boolean;
}

// 链接提示组件属性
export interface LinkTooltipProps {
  position: { x: number; y: number };
  pageName: string;
  exists: boolean;
  previewContent?: string;
  alias?: string;
  onClose: () => void;
  maxWidth?: number;
  maxHeight?: number;
}

// 块预览提示组件属性
export interface BlockPreviewTooltipProps {
  position: { x: number; y: number };
  blockId: string;
  blockContent?: string;
  blockTitle?: string;
  onClose: () => void;
  maxWidth?: number;
  maxHeight?: number;
}

// 反向链接面板属性
export interface BacklinksPanelProps {
  targetId: string;
  targetType?: 'page' | 'block';
  isOpen: boolean;
  onClose: () => void;
  backlinks?: BacklinkInfo[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onLinkClick?: (backlink: BacklinkInfo) => void;
  position?: 'right' | 'left' | 'bottom';
  width?: number;
  height?: number;
  resizable?: boolean;
}

// 反向链接列表属性
export interface BacklinksListProps {
  groupedBacklinks: Record<string, BacklinkInfo[]>;
  onLinkClick?: (backlink: BacklinkInfo) => void;
  showGroupHeaders?: boolean;
  showContext?: boolean;
  maxContextLength?: number;
}

// 链接自动补全属性
export interface LinkAutoCompleteProps {
  query: string;
  linkType: 'page' | 'block';
  position: { x: number; y: number };
  visible: boolean;
  suggestions?: LinkSuggestion[];
  loading?: boolean;
  onSelect: (suggestion: LinkSuggestion) => void;
  onClose: () => void;
  onQueryChange?: (query: string) => void;
  maxItems?: number;
  maxWidth?: number;
  maxHeight?: number;
  showCreateOption?: boolean;
  showHistory?: boolean;
  history?: LinkSuggestion[];
}

// 链接工具栏属性
export interface LinkToolbarProps {
  visible: boolean;
  position?: { x: number; y: number };
  currentLink?: any; // LinkElement from Slate
  onClose: () => void;
  onValidateLink?: (target: string, type: 'page' | 'block') => Promise<boolean>;
  onSearchPages?: (query: string) => Promise<Array<{ id: string; title: string; preview?: string }>>;
  onSearchBlocks?: (query: string) => Promise<Array<{ id: string; title: string; content?: string }>>;
}
