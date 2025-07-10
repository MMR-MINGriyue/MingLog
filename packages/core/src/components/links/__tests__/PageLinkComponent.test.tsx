/**
 * PageLinkComponent 单元测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PageLinkComponent } from '../PageLinkComponent';
import { PageLink } from '../../../types/links';

describe('PageLinkComponent', () => {
  const mockPageLink: PageLink = {
    type: 'page-reference',
    pageName: '测试页面',
    displayText: '测试页面',
    position: 0,
    length: 8,
    context: '这是一个测试页面的上下文'
  };

  const mockPageLinkWithAlias: PageLink = {
    type: 'page-reference',
    pageName: '测试页面',
    displayText: '显示文本',
    alias: '显示文本',
    position: 0,
    length: 12,
    context: '这是一个带别名的测试页面'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('should render page link correctly', () => {
      render(<PageLinkComponent link={mockPageLink} />);
      
      const linkElement = screen.getByTestId('page-link');
      expect(linkElement).toBeInTheDocument();
      expect(linkElement).toHaveTextContent('测试页面');
      expect(linkElement).toHaveAttribute('data-page-name', '测试页面');
    });

    it('should render page link with alias', () => {
      render(<PageLinkComponent link={mockPageLinkWithAlias} />);
      
      const linkElement = screen.getByTestId('page-link');
      expect(linkElement).toHaveTextContent('显示文本');
      expect(linkElement).toHaveAttribute('data-page-name', '测试页面');
    });

    it('should apply correct CSS classes for existing page', () => {
      render(<PageLinkComponent link={mockPageLink} exists={true} />);
      
      const linkElement = screen.getByTestId('page-link');
      expect(linkElement).toHaveClass('page-link--exists');
      expect(linkElement).not.toHaveClass('page-link--broken');
    });

    it('should apply correct CSS classes for broken page', () => {
      render(<PageLinkComponent link={mockPageLink} exists={false} />);
      
      const linkElement = screen.getByTestId('page-link');
      expect(linkElement).toHaveClass('page-link--broken');
      expect(linkElement).not.toHaveClass('page-link--exists');
    });

    it('should apply disabled state correctly', () => {
      render(<PageLinkComponent link={mockPageLink} disabled={true} />);
      
      const linkElement = screen.getByTestId('page-link');
      expect(linkElement).toHaveClass('page-link--disabled');
      expect(linkElement).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('交互功能', () => {
    it('should handle click events', () => {
      const handleClick = vi.fn();
      render(<PageLinkComponent link={mockPageLink} onClick={handleClick} />);
      
      const linkElement = screen.getByTestId('page-link');
      fireEvent.click(linkElement);
      
      expect(handleClick).toHaveBeenCalledWith('测试页面', mockPageLink);
    });

    it('should not handle click when disabled', () => {
      const handleClick = vi.fn();
      render(<PageLinkComponent link={mockPageLink} onClick={handleClick} disabled={true} />);
      
      const linkElement = screen.getByTestId('page-link');
      fireEvent.click(linkElement);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle keyboard navigation', () => {
      const handleClick = vi.fn();
      render(<PageLinkComponent link={mockPageLink} onClick={handleClick} />);
      
      const linkElement = screen.getByTestId('page-link');
      
      // Test Enter key
      fireEvent.keyDown(linkElement, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledWith('测试页面', mockPageLink);
      
      // Test Space key
      fireEvent.keyDown(linkElement, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should handle context menu events', () => {
      const handleContextMenu = vi.fn();
      render(<PageLinkComponent link={mockPageLink} onContextMenu={handleContextMenu} />);
      
      const linkElement = screen.getByTestId('page-link');
      fireEvent.contextMenu(linkElement);
      
      expect(handleContextMenu).toHaveBeenCalled();
    });
  });

  describe('悬停提示', () => {
    it('should show tooltip on hover when enabled', async () => {
      render(
        <PageLinkComponent 
          link={mockPageLink} 
          showTooltip={true}
          previewContent="这是预览内容"
        />
      );
      
      const linkElement = screen.getByTestId('page-link');
      fireEvent.mouseEnter(linkElement);
      
      // 等待延时显示
      await waitFor(() => {
        expect(screen.getByTestId('link-tooltip')).toBeInTheDocument();
      }, { timeout: 600 });
    });

    it('should not show tooltip when disabled', async () => {
      render(
        <PageLinkComponent 
          link={mockPageLink} 
          showTooltip={false}
        />
      );
      
      const linkElement = screen.getByTestId('page-link');
      fireEvent.mouseEnter(linkElement);
      
      // 等待一段时间确保提示不会显示
      await new Promise(resolve => setTimeout(resolve, 600));
      expect(screen.queryByTestId('link-tooltip')).not.toBeInTheDocument();
    });

    it('should hide tooltip on mouse leave', async () => {
      render(
        <PageLinkComponent 
          link={mockPageLink} 
          showTooltip={true}
        />
      );
      
      const linkElement = screen.getByTestId('page-link');
      fireEvent.mouseEnter(linkElement);
      
      await waitFor(() => {
        expect(screen.getByTestId('link-tooltip')).toBeInTheDocument();
      }, { timeout: 600 });
      
      fireEvent.mouseLeave(linkElement);
      
      await waitFor(() => {
        expect(screen.queryByTestId('link-tooltip')).not.toBeInTheDocument();
      });
    });
  });

  describe('可访问性', () => {
    it('should have correct ARIA attributes', () => {
      render(<PageLinkComponent link={mockPageLink} exists={true} />);
      
      const linkElement = screen.getByTestId('page-link');
      expect(linkElement).toHaveAttribute('role', 'link');
      expect(linkElement).toHaveAttribute('aria-label');
      expect(linkElement).toHaveAttribute('tabIndex', '0');
    });

    it('should have correct title attribute', () => {
      render(<PageLinkComponent link={mockPageLink} exists={true} />);
      
      const linkElement = screen.getByTestId('page-link');
      expect(linkElement).toHaveAttribute('title', '跳转到页面: 测试页面');
    });

    it('should have correct title for broken link', () => {
      render(<PageLinkComponent link={mockPageLink} exists={false} />);
      
      const linkElement = screen.getByTestId('page-link');
      expect(linkElement).toHaveAttribute('title', '创建新页面: 测试页面');
    });
  });

  describe('自定义样式', () => {
    it('should apply custom className', () => {
      render(<PageLinkComponent link={mockPageLink} className="custom-class" />);
      
      const linkElement = screen.getByTestId('page-link');
      expect(linkElement).toHaveClass('custom-class');
    });

    it('should apply custom styles', () => {
      const customStyle = { color: 'red', fontSize: '16px' };
      render(<PageLinkComponent link={mockPageLink} style={customStyle} />);
      
      const linkElement = screen.getByTestId('page-link');
      expect(linkElement).toHaveStyle('color: rgb(255, 0, 0)');
      expect(linkElement).toHaveStyle('font-size: 16px');
    });
  });

  describe('边界情况', () => {
    it('should handle empty display text', () => {
      const linkWithEmptyText: PageLink = {
        ...mockPageLink,
        displayText: ''
      };
      
      render(<PageLinkComponent link={linkWithEmptyText} />);
      
      const linkElement = screen.getByTestId('page-link');
      expect(linkElement).toHaveTextContent('');
    });

    it('should handle very long page names', () => {
      const longPageName = 'A'.repeat(100);
      const linkWithLongName: PageLink = {
        ...mockPageLink,
        pageName: longPageName,
        displayText: longPageName
      };
      
      render(<PageLinkComponent link={linkWithLongName} />);
      
      const linkElement = screen.getByTestId('page-link');
      expect(linkElement).toHaveTextContent(longPageName);
      expect(linkElement).toHaveAttribute('data-page-name', longPageName);
    });

    it('should handle special characters in page names', () => {
      const specialPageName = '测试页面 & <script>alert("xss")</script>';
      const linkWithSpecialChars: PageLink = {
        ...mockPageLink,
        pageName: specialPageName,
        displayText: specialPageName
      };
      
      render(<PageLinkComponent link={linkWithSpecialChars} />);
      
      const linkElement = screen.getByTestId('page-link');
      expect(linkElement).toHaveTextContent(specialPageName);
    });
  });
});
