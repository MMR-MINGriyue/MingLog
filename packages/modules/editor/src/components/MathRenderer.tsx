/**
 * 数学公式渲染组件
 * 提供KaTeX数学公式渲染功能
 */

import React, { useMemo, useCallback, useState } from 'react';

/**
 * 数学公式渲染组件属性
 */
export interface MathRendererProps {
  /** 数学公式内容 */
  formula: string;
  /** 是否为行内公式 */
  inline?: boolean;
  /** 是否可编辑 */
  editable?: boolean;
  /** 是否只读 */
  readOnly?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 公式编辑完成回调 */
  onEdit?: (formula: string) => void;
  /** 错误处理回调 */
  onError?: (error: Error) => void;
}

/**
 * 数学公式渲染组件实现
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  formula,
  inline = false,
  editable = false,
  readOnly = false,
  className = '',
  style,
  onEdit,
  onError
}) => {
  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editingFormula, setEditingFormula] = useState(formula);
  const [renderError, setRenderError] = useState<string | null>(null);

  // 渲染数学公式
  const renderedMath = useMemo(() => {
    try {
      // 临时实现：使用简单的HTML渲染
      // TODO: 集成KaTeX后替换为真正的数学渲染
      const processedFormula = processFormula(formula);
      setRenderError(null);
      return processedFormula;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '公式渲染失败';
      setRenderError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      return formula; // 回退到原始公式
    }
  }, [formula, onError]);

  // 处理编辑开始
  const handleEditStart = useCallback(() => {
    if (!editable || readOnly) return;
    setIsEditing(true);
    setEditingFormula(formula);
  }, [editable, readOnly, formula]);

  // 处理编辑保存
  const handleEditSave = useCallback(() => {
    setIsEditing(false);
    if (editingFormula !== formula) {
      onEdit?.(editingFormula);
    }
  }, [editingFormula, formula, onEdit]);

  // 处理编辑取消
  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    setEditingFormula(formula);
  }, [formula]);

  // 处理键盘事件
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleEditSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleEditCancel();
    }
  }, [handleEditSave, handleEditCancel]);

  // 组件样式
  const containerClassName = `math-renderer ${inline ? 'math-inline' : 'math-block'} ${className}`;
  const containerStyle: React.CSSProperties = {
    ...style,
    cursor: editable && !readOnly ? 'pointer' : 'default',
    position: 'relative'
  };

  // 如果正在编辑，显示编辑器
  if (isEditing) {
    return (
      <div className={containerClassName} style={containerStyle}>
        <div className="math-editor">
          <textarea
            value={editingFormula}
            onChange={(e) => setEditingFormula(e.target.value)}
            onKeyDown={handleKeyDown}
            className="math-editor-input"
            placeholder="输入数学公式..."
            autoFocus
            rows={inline ? 1 : 3}
            style={{
              width: '100%',
              minWidth: '200px',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
          <div className="math-editor-actions" style={{ marginTop: '8px' }}>
            <button
              onClick={handleEditSave}
              className="math-editor-save"
              style={{
                padding: '4px 8px',
                marginRight: '8px',
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              保存
            </button>
            <button
              onClick={handleEditCancel}
              className="math-editor-cancel"
              style={{
                padding: '4px 8px',
                backgroundColor: '#f0f0f0',
                color: '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
          </div>
          <div className="math-editor-preview" style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>预览:</div>
            <div 
              className={`math-preview ${inline ? 'math-inline' : 'math-block'}`}
              dangerouslySetInnerHTML={{ __html: processFormula(editingFormula) }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 显示渲染后的公式
  return (
    <div 
      className={containerClassName} 
      style={containerStyle}
      onClick={handleEditStart}
      title={editable && !readOnly ? '点击编辑公式' : undefined}
    >
      {renderError ? (
        <div className="math-error" style={{ 
          color: '#ff3b30', 
          backgroundColor: '#fff2f2', 
          padding: '4px 8px', 
          borderRadius: '4px',
          border: '1px solid #ffcdd2'
        }}>
          <span style={{ fontSize: '12px' }}>公式错误: {renderError}</span>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', marginTop: '2px' }}>
            {formula}
          </div>
        </div>
      ) : (
        <div 
          className="math-content"
          dangerouslySetInnerHTML={{ __html: renderedMath }}
          style={{
            display: inline ? 'inline' : 'block',
            padding: inline ? '2px 4px' : '8px 12px',
            backgroundColor: inline ? 'transparent' : '#f8f9fa',
            border: inline ? 'none' : '1px solid #e9ecef',
            borderRadius: inline ? '0' : '4px',
            textAlign: inline ? 'inherit' : 'center'
          }}
        />
      )}
      
      {editable && !readOnly && (
        <div 
          className="math-edit-hint"
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '16px',
            height: '16px',
            backgroundColor: '#007AFF',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'white',
            opacity: 0,
            transition: 'opacity 0.2s',
            pointerEvents: 'none'
          }}
        >
          ✎
        </div>
      )}
    </div>
  );
};

/**
 * 处理数学公式，转换为可渲染的HTML
 * 临时实现，后续将替换为KaTeX渲染
 */
function processFormula(formula: string): string {
  if (!formula.trim()) {
    return '<span style="color: #999; font-style: italic;">空公式</span>';
  }

  // 简单的数学符号替换
  let processed = formula
    // 希腊字母
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\epsilon/g, 'ε')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\pi/g, 'π')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\phi/g, 'φ')
    .replace(/\\omega/g, 'ω')
    
    // 数学符号
    .replace(/\\infty/g, '∞')
    .replace(/\\sum/g, '∑')
    .replace(/\\prod/g, '∏')
    .replace(/\\int/g, '∫')
    .replace(/\\partial/g, '∂')
    .replace(/\\nabla/g, '∇')
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\neq/g, '≠')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\approx/g, '≈')
    .replace(/\\equiv/g, '≡')
    
    // 上下标处理 (简化版)
    .replace(/\^{([^}]+)}/g, '<sup>$1</sup>')
    .replace(/\^(\w)/g, '<sup>$1</sup>')
    .replace(/_{([^}]+)}/g, '<sub>$1</sub>')
    .replace(/_(\w)/g, '<sub>$1</sub>')
    
    // 分数处理 (简化版)
    .replace(/\\frac{([^}]+)}{([^}]+)}/g, '<span style="display: inline-block; text-align: center;"><span style="display: block; border-bottom: 1px solid; padding-bottom: 2px;">$1</span><span style="display: block; padding-top: 2px;">$2</span></span>')
    
    // 根号处理
    .replace(/\\sqrt{([^}]+)}/g, '√($1)')
    .replace(/\\sqrt/g, '√');

  return `<span style="font-family: 'Times New Roman', serif; font-size: 1.1em;">${processed}</span>`;
}

/**
 * 常用数学公式模板
 */
export const MATH_TEMPLATES = {
  // 基础模板
  quadratic: 'ax^2 + bx + c = 0',
  pythagorean: 'a^2 + b^2 = c^2',
  einstein: 'E = mc^2',
  
  // 微积分
  derivative: '\\frac{d}{dx}f(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}',
  integral: '\\int_a^b f(x) dx',
  
  // 统计
  normal: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}(\\frac{x-\\mu}{\\sigma})^2}',
  
  // 线性代数
  matrix: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
  
  // 几何
  circle: 'x^2 + y^2 = r^2',
  ellipse: '\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1'
};

export default MathRenderer;
