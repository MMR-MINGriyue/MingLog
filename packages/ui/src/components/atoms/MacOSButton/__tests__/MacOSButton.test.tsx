/**
 * macOS按钮组件测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MacOSButton } from '../MacOSButton';

describe('MacOSButton', () => {
  // 基础渲染测试
  describe('基础渲染', () => {
    it('应该正确渲染按钮文本', () => {
      render(<MacOSButton>点击我</MacOSButton>);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('点击我')).toBeInTheDocument();
    });

    it('应该应用默认样式', () => {
      render(<MacOSButton>按钮</MacOSButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('macos-button');
    });

    it('应该支持自定义类名', () => {
      render(<MacOSButton className="custom-button">按钮</MacOSButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('macos-button');
      expect(button).toHaveClass('custom-button');
    });
  });

  // 变体测试
  describe('按钮变体', () => {
    it('应该渲染主要按钮', () => {
      render(<MacOSButton variant="primary">主要按钮</MacOSButton>);
      
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      expect(styles.background).toContain('var(--macos-system-blue)');
    });

    it('应该渲染次要按钮', () => {
      render(<MacOSButton variant="secondary">次要按钮</MacOSButton>);
      
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      expect(styles.background).toContain('var(--macos-fill-quaternary)');
    });

    it('应该渲染危险按钮', () => {
      render(<MacOSButton variant="destructive">危险按钮</MacOSButton>);
      
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      expect(styles.background).toContain('var(--macos-system-red)');
    });

    it('应该渲染幽灵按钮', () => {
      render(<MacOSButton variant="ghost">幽灵按钮</MacOSButton>);

      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      expect(styles.background).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    });

    it('应该渲染链接按钮', () => {
      render(<MacOSButton variant="link">链接按钮</MacOSButton>);

      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      expect(styles.background).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
      expect(styles.color).toContain('var(--macos-text-link)');
    });
  });

  // 尺寸测试
  describe('按钮尺寸', () => {
    it('应该渲染小尺寸按钮', () => {
      render(<MacOSButton size="small">小按钮</MacOSButton>);
      
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      expect(styles.minHeight).toBe('28px');
    });

    it('应该渲染中等尺寸按钮', () => {
      render(<MacOSButton size="medium">中等按钮</MacOSButton>);
      
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      expect(styles.minHeight).toBe('32px');
    });

    it('应该渲染大尺寸按钮', () => {
      render(<MacOSButton size="large">大按钮</MacOSButton>);
      
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      expect(styles.minHeight).toBe('44px');
    });
  });

  // 状态测试
  describe('按钮状态', () => {
    it('应该处理禁用状态', () => {
      const handleClick = vi.fn();
      render(
        <MacOSButton disabled onClick={handleClick}>
          禁用按钮
        </MacOSButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('应该显示加载状态', () => {
      render(<MacOSButton loading>加载中</MacOSButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      // 检查是否有加载指示器
      const spinner = button.querySelector('div[style*="animation"]');
      expect(spinner).toBeInTheDocument();
    });

    it('应该在加载时阻止点击', () => {
      const handleClick = vi.fn();
      render(
        <MacOSButton loading onClick={handleClick}>
          加载按钮
        </MacOSButton>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // 图标测试
  describe('按钮图标', () => {
    it('应该显示左侧图标', () => {
      const leftIcon = <span data-testid="left-icon">←</span>;
      render(
        <MacOSButton leftIcon={leftIcon}>
          带图标按钮
        </MacOSButton>
      );
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByText('带图标按钮')).toBeInTheDocument();
    });

    it('应该显示右侧图标', () => {
      const rightIcon = <span data-testid="right-icon">→</span>;
      render(
        <MacOSButton rightIcon={rightIcon}>
          带图标按钮
        </MacOSButton>
      );
      
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText('带图标按钮')).toBeInTheDocument();
    });

    it('应该在加载时隐藏图标', () => {
      const leftIcon = <span data-testid="left-icon">←</span>;
      render(
        <MacOSButton loading leftIcon={leftIcon}>
          加载按钮
        </MacOSButton>
      );
      
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    });
  });

  // 交互测试
  describe('按钮交互', () => {
    it('应该处理点击事件', () => {
      const handleClick = vi.fn();
      render(<MacOSButton onClick={handleClick}>点击按钮</MacOSButton>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('应该处理悬停事件', () => {
      const handleMouseEnter = vi.fn();
      const handleMouseLeave = vi.fn();
      
      render(
        <MacOSButton 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          悬停按钮
        </MacOSButton>
      );
      
      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
      
      fireEvent.mouseLeave(button);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('应该处理焦点事件', () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();
      
      render(
        <MacOSButton 
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          焦点按钮
        </MacOSButton>
      );
      
      const button = screen.getByRole('button');
      
      fireEvent.focus(button);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      fireEvent.blur(button);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  // 样式测试
  describe('按钮样式', () => {
    it('应该支持圆形按钮', () => {
      render(<MacOSButton rounded>○</MacOSButton>);
      
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      expect(styles.borderRadius).toBe('50%');
    });

    it('应该支持全宽按钮', () => {
      render(<MacOSButton fullWidth>全宽按钮</MacOSButton>);
      
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      expect(styles.width).toBe('100%');
      expect(styles.display).toBe('flex');
    });

    it('应该支持自定义样式', () => {
      const customStyle = { backgroundColor: 'red' };
      render(<MacOSButton style={customStyle}>自定义按钮</MacOSButton>);

      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      expect(styles.backgroundColor).toMatch(/rgb\(255, 0, 0\)|red/);
    });
  });

  // 可访问性测试
  describe('可访问性', () => {
    it('应该支持键盘导航', () => {
      const handleClick = vi.fn();
      render(<MacOSButton onClick={handleClick}>键盘按钮</MacOSButton>);

      const button = screen.getByRole('button');

      // 模拟Tab键聚焦
      button.focus();
      expect(document.activeElement).toBe(button);

      // 模拟Enter键点击
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyUp(button, { key: 'Enter' });
    });

    it('应该有正确的ARIA属性', () => {
      render(
        <MacOSButton 
          disabled 
          aria-label="自定义标签"
          aria-describedby="description"
        >
          ARIA按钮
        </MacOSButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', '自定义标签');
      expect(button).toHaveAttribute('aria-describedby', 'description');
      expect(button).toHaveAttribute('disabled');
    });
  });

  // 性能测试
  describe('性能测试', () => {
    it('应该快速渲染', () => {
      const startTime = performance.now();
      
      render(<MacOSButton>性能测试</MacOSButton>);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 渲染时间应该小于10ms
      expect(renderTime).toBeLessThan(10);
    });

    it('应该快速响应点击', async () => {
      const handleClick = vi.fn();
      render(<MacOSButton onClick={handleClick}>响应测试</MacOSButton>);
      
      const button = screen.getByRole('button');
      const startTime = performance.now();
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(handleClick).toHaveBeenCalled();
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // 响应时间应该小于50ms
      expect(responseTime).toBeLessThan(50);
    });
  });
});
