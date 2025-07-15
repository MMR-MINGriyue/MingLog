/**
 * 数学公式编辑器组件
 * 提供可视化的数学公式编辑界面
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MathRenderer, MATH_TEMPLATES } from './MathRenderer';

/**
 * 数学公式编辑器属性
 */
export interface MathEditorProps {
  /** 初始公式 */
  initialFormula?: string;
  /** 是否为行内公式 */
  inline?: boolean;
  /** 是否显示模板选择器 */
  showTemplates?: boolean;
  /** 是否显示预览 */
  showPreview?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 保存回调 */
  onSave: (formula: string, inline: boolean) => void;
  /** 取消回调 */
  onCancel: () => void;
  /** 公式变化回调 */
  onChange?: (formula: string) => void;
}

/**
 * 数学符号分类
 */
const SYMBOL_CATEGORIES = {
  basic: {
    name: '基础符号',
    symbols: [
      { symbol: '+', latex: '+', name: '加号' },
      { symbol: '-', latex: '-', name: '减号' },
      { symbol: '×', latex: '\\times', name: '乘号' },
      { symbol: '÷', latex: '\\div', name: '除号' },
      { symbol: '=', latex: '=', name: '等号' },
      { symbol: '≠', latex: '\\neq', name: '不等号' },
      { symbol: '≤', latex: '\\leq', name: '小于等于' },
      { symbol: '≥', latex: '\\geq', name: '大于等于' },
      { symbol: '±', latex: '\\pm', name: '正负号' },
      { symbol: '∞', latex: '\\infty', name: '无穷大' }
    ]
  },
  greek: {
    name: '希腊字母',
    symbols: [
      { symbol: 'α', latex: '\\alpha', name: 'alpha' },
      { symbol: 'β', latex: '\\beta', name: 'beta' },
      { symbol: 'γ', latex: '\\gamma', name: 'gamma' },
      { symbol: 'δ', latex: '\\delta', name: 'delta' },
      { symbol: 'ε', latex: '\\epsilon', name: 'epsilon' },
      { symbol: 'θ', latex: '\\theta', name: 'theta' },
      { symbol: 'λ', latex: '\\lambda', name: 'lambda' },
      { symbol: 'μ', latex: '\\mu', name: 'mu' },
      { symbol: 'π', latex: '\\pi', name: 'pi' },
      { symbol: 'σ', latex: '\\sigma', name: 'sigma' },
      { symbol: 'φ', latex: '\\phi', name: 'phi' },
      { symbol: 'ω', latex: '\\omega', name: 'omega' }
    ]
  },
  calculus: {
    name: '微积分',
    symbols: [
      { symbol: '∑', latex: '\\sum', name: '求和' },
      { symbol: '∏', latex: '\\prod', name: '连乘' },
      { symbol: '∫', latex: '\\int', name: '积分' },
      { symbol: '∂', latex: '\\partial', name: '偏导数' },
      { symbol: '∇', latex: '\\nabla', name: '梯度' },
      { symbol: '∆', latex: '\\Delta', name: 'Delta' },
      { symbol: '→', latex: '\\to', name: '趋向' },
      { symbol: '∞', latex: '\\infty', name: '无穷' }
    ]
  },
  functions: {
    name: '函数',
    symbols: [
      { symbol: 'x²', latex: 'x^2', name: '平方' },
      { symbol: 'x³', latex: 'x^3', name: '立方' },
      { symbol: '√x', latex: '\\sqrt{x}', name: '平方根' },
      { symbol: 'a/b', latex: '\\frac{a}{b}', name: '分数' },
      { symbol: 'log', latex: '\\log', name: '对数' },
      { symbol: 'ln', latex: '\\ln', name: '自然对数' },
      { symbol: 'sin', latex: '\\sin', name: '正弦' },
      { symbol: 'cos', latex: '\\cos', name: '余弦' },
      { symbol: 'tan', latex: '\\tan', name: '正切' },
      { symbol: 'lim', latex: '\\lim', name: '极限' }
    ]
  }
};

/**
 * 数学公式编辑器实现
 */
export const MathEditor: React.FC<MathEditorProps> = ({
  initialFormula = '',
  inline = false,
  showTemplates = true,
  showPreview = true,
  className = '',
  onSave,
  onCancel,
  onChange
}) => {
  // 状态管理
  const [formula, setFormula] = useState(initialFormula);
  const [isInline, setIsInline] = useState(inline);
  const [activeCategory, setActiveCategory] = useState<keyof typeof SYMBOL_CATEGORIES>('basic');
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // 引用
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 更新公式
  const updateFormula = useCallback((newFormula: string) => {
    setFormula(newFormula);
    onChange?.(newFormula);
  }, [onChange]);

  // 插入符号
  const insertSymbol = useCallback((latex: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newFormula = formula.substring(0, start) + latex + formula.substring(end);
    
    updateFormula(newFormula);
    
    // 设置光标位置
    setTimeout(() => {
      const newPosition = start + latex.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  }, [formula, updateFormula]);

  // 插入模板
  const insertTemplate = useCallback((template: string) => {
    updateFormula(template);
    textareaRef.current?.focus();
  }, [updateFormula]);

  // 处理键盘快捷键
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          onSave(formula, isInline);
          break;
        case 's':
          event.preventDefault();
          onSave(formula, isInline);
          break;
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  }, [formula, isInline, onSave, onCancel]);

  // 处理光标位置变化
  const handleSelectionChange = useCallback(() => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  }, []);

  // 组件样式
  const containerStyle: React.CSSProperties = {
    width: '600px',
    maxWidth: '90vw',
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  };

  return (
    <div className={`math-editor-dialog ${className}`} style={containerStyle}>
      {/* 头部 */}
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            数学公式编辑器
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={isInline}
                onChange={(e) => setIsInline(e.target.checked)}
                style={{ marginRight: '4px' }}
              />
              行内公式
            </label>
          </div>
        </div>
        
        {/* 公式输入区 */}
        <div style={{ marginBottom: '12px' }}>
          <textarea
            ref={textareaRef}
            value={formula}
            onChange={(e) => updateFormula(e.target.value)}
            onKeyDown={handleKeyDown}
            onSelect={handleSelectionChange}
            placeholder="输入LaTeX数学公式..."
            style={{
              width: '100%',
              height: '80px',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'Monaco, Consolas, monospace',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            取消
          </button>
          <button
            onClick={() => onSave(formula, isInline)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            插入公式
          </button>
        </div>
      </div>

      {/* 主体内容 */}
      <div style={{ display: 'flex', height: '400px' }}>
        {/* 符号面板 */}
        <div style={{ 
          width: '200px', 
          borderRight: '1px solid #e0e0e0',
          backgroundColor: '#fafafa'
        }}>
          {/* 分类标签 */}
          <div style={{ borderBottom: '1px solid #e0e0e0' }}>
            {Object.entries(SYMBOL_CATEGORIES).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key as keyof typeof SYMBOL_CATEGORIES)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: activeCategory === key ? '#007AFF' : 'transparent',
                  color: activeCategory === key ? 'white' : '#333',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
          
          {/* 符号列表 */}
          <div style={{ 
            padding: '8px', 
            height: 'calc(100% - 120px)', 
            overflowY: 'auto' 
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '4px' 
            }}>
              {SYMBOL_CATEGORIES[activeCategory].symbols.map((symbol, index) => (
                <button
                  key={index}
                  onClick={() => insertSymbol(symbol.latex)}
                  title={symbol.name}
                  style={{
                    padding: '8px 4px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    textAlign: 'center',
                    minHeight: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {symbol.symbol}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧面板 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* 模板选择器 */}
          {showTemplates && (
            <div style={{ 
              padding: '12px', 
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                常用模板
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {Object.entries(MATH_TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => insertTemplate(template)}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 预览区域 */}
          {showPreview && (
            <div style={{ 
              flex: 1, 
              padding: '16px',
              backgroundColor: 'white'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>
                预览效果
              </div>
              <div style={{ 
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                padding: '16px',
                minHeight: '100px',
                backgroundColor: '#fafafa'
              }}>
                {formula ? (
                  <MathRenderer 
                    formula={formula} 
                    inline={isInline}
                    readOnly={true}
                  />
                ) : (
                  <div style={{ 
                    color: '#999', 
                    fontStyle: 'italic',
                    textAlign: 'center',
                    paddingTop: '20px'
                  }}>
                    在上方输入公式以查看预览
                  </div>
                )}
              </div>
              
              {/* 帮助信息 */}
              <div style={{ 
                marginTop: '12px', 
                fontSize: '12px', 
                color: '#666',
                lineHeight: '1.4'
              }}>
                <div><strong>快捷键:</strong></div>
                <div>• Ctrl+Enter 或 Ctrl+S: 保存公式</div>
                <div>• Esc: 取消编辑</div>
                <div><strong>语法示例:</strong></div>
                <div>• 上标: x^2, x^{n+1}</div>
                <div>• 下标: x_1, x_{i,j}</div>
                <div>• 分数: \frac{a}{b}</div>
                <div>• 根号: \sqrt{x}, \sqrt[n]{x}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MathEditor;
