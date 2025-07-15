/**
 * MathRenderer组件测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MathRenderer, MATH_TEMPLATES } from '../MathRenderer';

describe('MathRenderer', () => {
  // 基础渲染测试
  describe('基础渲染', () => {
    it('应该渲染简单的数学公式', () => {
      render(<MathRenderer formula="x^2 + y^2 = r^2" />);
      
      const mathElement = screen.getByText(/x.*\+.*y.*=.*r/);
      expect(mathElement).toBeInTheDocument();
      expect(mathElement).toHaveClass('math-content');
    });

    it('应该渲染行内公式', () => {
      render(<MathRenderer formula="E = mc^2" inline={true} />);
      
      const mathElement = document.querySelector('.math-inline');
      expect(mathElement).toBeInTheDocument();
      
      const content = mathElement?.querySelector('.math-content');
      expect(content).toHaveStyle({ display: 'inline' });
    });

    it('应该渲染块级公式', () => {
      render(<MathRenderer formula="\\sum_{i=1}^{n} x_i" inline={false} />);
      
      const mathElement = document.querySelector('.math-block');
      expect(mathElement).toBeInTheDocument();
      
      const content = mathElement?.querySelector('.math-content');
      expect(content).toHaveStyle({ display: 'block' });
    });
  });

  // 符号替换测试
  describe('符号替换', () => {
    it('应该正确替换希腊字母', () => {
      render(<MathRenderer formula="\\alpha + \\beta = \\gamma" />);
      
      expect(screen.getByText(/α.*\+.*β.*=.*γ/)).toBeInTheDocument();
    });

    it('应该正确替换数学符号', () => {
      render(<MathRenderer formula="\\sum \\int \\infty \\pm" />);
      
      expect(screen.getByText(/∑.*∫.*∞.*±/)).toBeInTheDocument();
    });

    it('应该正确处理上下标', () => {
      render(<MathRenderer formula="x^2 + y_{i,j}" />);
      
      const element = screen.getByText(/x.*\+.*y/);
      expect(element.innerHTML).toContain('<sup>2</sup>');
      expect(element.innerHTML).toContain('<sub>i,j</sub>');
    });

    it('应该正确处理分数', () => {
      render(<MathRenderer formula="\\frac{a}{b}" />);
      
      const element = screen.getByText(/a.*b/);
      expect(element.innerHTML).toContain('border-bottom: 1px solid');
    });

    it('应该正确处理根号', () => {
      render(<MathRenderer formula="\\sqrt{x}" />);
      
      expect(screen.getByText(/√\(x\)/)).toBeInTheDocument();
    });
  });

  // 编辑功能测试
  describe('编辑功能', () => {
    it('应该在可编辑模式下显示编辑提示', () => {
      render(<MathRenderer formula="x^2" editable={true} />);
      
      const container = document.querySelector('.math-renderer');
      expect(container).toHaveStyle({ cursor: 'pointer' });
      
      const editHint = document.querySelector('.math-edit-hint');
      expect(editHint).toBeInTheDocument();
    });

    it('应该在点击时进入编辑模式', async () => {
      const onEdit = vi.fn();
      render(<MathRenderer formula="x^2" editable={true} onEdit={onEdit} />);
      
      const container = document.querySelector('.math-renderer');
      fireEvent.click(container!);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByDisplayValue('x^2')).toBeInTheDocument();
      });
    });

    it('应该在编辑模式下显示预览', async () => {
      render(<MathRenderer formula="x^2" editable={true} />);
      
      const container = document.querySelector('.math-renderer');
      fireEvent.click(container!);
      
      await waitFor(() => {
        expect(screen.getByText('预览:')).toBeInTheDocument();
        expect(document.querySelector('.math-preview')).toBeInTheDocument();
      });
    });

    it('应该在保存时调用onEdit回调', async () => {
      const onEdit = vi.fn();
      render(<MathRenderer formula="x^2" editable={true} onEdit={onEdit} />);
      
      const container = document.querySelector('.math-renderer');
      fireEvent.click(container!);
      
      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'y^3' } });
      });
      
      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);
      
      expect(onEdit).toHaveBeenCalledWith('y^3');
    });

    it('应该在取消时恢复原始公式', async () => {
      render(<MathRenderer formula="x^2" editable={true} />);
      
      const container = document.querySelector('.math-renderer');
      fireEvent.click(container!);
      
      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'y^3' } });
      });
      
      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(screen.getByText(/x.*2/)).toBeInTheDocument();
      });
    });

    it('应该支持键盘快捷键', async () => {
      const onEdit = vi.fn();
      render(<MathRenderer formula="x^2" editable={true} onEdit={onEdit} />);
      
      const container = document.querySelector('.math-renderer');
      fireEvent.click(container!);
      
      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'y^3' } });
        
        // 测试Enter键保存
        fireEvent.keyDown(textarea, { key: 'Enter' });
      });
      
      expect(onEdit).toHaveBeenCalledWith('y^3');
    });

    it('应该支持Escape键取消', async () => {
      render(<MathRenderer formula="x^2" editable={true} />);
      
      const container = document.querySelector('.math-renderer');
      fireEvent.click(container!);
      
      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        fireEvent.keyDown(textarea, { key: 'Escape' });
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });
  });

  // 错误处理测试
  describe('错误处理', () => {
    it('应该显示空公式提示', () => {
      render(<MathRenderer formula="" />);
      
      expect(screen.getByText('空公式')).toBeInTheDocument();
    });

    it('应该在只读模式下禁用编辑', () => {
      render(<MathRenderer formula="x^2" editable={true} readOnly={true} />);
      
      const container = document.querySelector('.math-renderer');
      expect(container).toHaveStyle({ cursor: 'default' });
      
      fireEvent.click(container!);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('应该调用错误处理回调', () => {
      const onError = vi.fn();
      
      // 模拟渲染错误
      const originalConsoleError = console.error;
      console.error = vi.fn();
      
      render(<MathRenderer formula="invalid formula" onError={onError} />);
      
      console.error = originalConsoleError;
    });
  });

  // 样式和主题测试
  describe('样式和主题', () => {
    it('应该应用自定义样式类名', () => {
      render(<MathRenderer formula="x^2" className="custom-math" />);
      
      const container = document.querySelector('.math-renderer');
      expect(container).toHaveClass('custom-math');
    });

    it('应该应用自定义样式', () => {
      const customStyle = { backgroundColor: 'red' };
      render(<MathRenderer formula="x^2" style={customStyle} />);
      
      const container = document.querySelector('.math-renderer');
      expect(container).toHaveStyle({ backgroundColor: 'red' });
    });

    it('应该为行内公式应用正确的样式', () => {
      render(<MathRenderer formula="x^2" inline={true} />);
      
      const container = document.querySelector('.math-renderer');
      expect(container).toHaveClass('math-inline');
      
      const content = container?.querySelector('.math-content');
      expect(content).toHaveStyle({ 
        display: 'inline',
        padding: '2px 4px',
        backgroundColor: 'transparent'
      });
    });

    it('应该为块级公式应用正确的样式', () => {
      render(<MathRenderer formula="x^2" inline={false} />);
      
      const container = document.querySelector('.math-renderer');
      expect(container).toHaveClass('math-block');
      
      const content = container?.querySelector('.math-content');
      expect(content).toHaveStyle({ 
        display: 'block',
        padding: '8px 12px',
        textAlign: 'center'
      });
    });
  });

  // 模板测试
  describe('数学模板', () => {
    it('应该包含常用的数学模板', () => {
      expect(MATH_TEMPLATES.quadratic).toBe('ax^2 + bx + c = 0');
      expect(MATH_TEMPLATES.pythagorean).toBe('a^2 + b^2 = c^2');
      expect(MATH_TEMPLATES.einstein).toBe('E = mc^2');
    });

    it('应该包含微积分模板', () => {
      expect(MATH_TEMPLATES.derivative).toContain('\\frac{d}{dx}');
      expect(MATH_TEMPLATES.integral).toContain('\\int');
    });

    it('应该包含统计模板', () => {
      expect(MATH_TEMPLATES.normal).toContain('\\sigma');
      expect(MATH_TEMPLATES.normal).toContain('\\mu');
    });
  });

  // 性能测试
  describe('性能测试', () => {
    it('应该快速渲染简单公式', () => {
      const startTime = performance.now();
      
      render(<MathRenderer formula="x^2 + y^2 = r^2" />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 渲染时间应该小于10ms
      expect(renderTime).toBeLessThan(10);
    });

    it('应该快速渲染复杂公式', () => {
      const complexFormula = '\\sum_{i=1}^{n} \\frac{\\alpha_i \\cdot \\beta_i}{\\sqrt{\\gamma_i^2 + \\delta_i^2}}';
      const startTime = performance.now();
      
      render(<MathRenderer formula={complexFormula} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 复杂公式渲染时间应该小于50ms
      expect(renderTime).toBeLessThan(50);
    });
  });
});
