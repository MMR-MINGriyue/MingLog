# 🎨 MingLog macOS风格设计系统规范

**制定日期**: 2025-01-15  
**适用版本**: v1.0.0+  
**设计目标**: 创建与macOS系统一致的用户界面体验

## 🎯 设计理念

### 核心原则
- **系统一致性**: 与macOS原生应用保持视觉和交互一致性
- **优雅简洁**: 减少视觉噪音，突出内容本身
- **响应式设计**: 适配不同屏幕尺寸和分辨率
- **无障碍友好**: 符合WCAG 2.1 AA标准

### 设计语言特征
- **深度层次**: 通过阴影和模糊效果创建空间感
- **流畅动画**: 60fps的自然过渡动画
- **精确对齐**: 像素级精确的布局对齐
- **内容优先**: 界面服务于内容，而非干扰内容

## 🔤 字体系统

### 主字体族
```css
/* SF Pro 字体栈 */
--font-family-system: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;

/* 中文字体优化 */
--font-family-chinese: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;

/* 等宽字体 */
--font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
```

### 字体大小规范
```css
/* 字体大小系统 */
--font-size-xs: 11px;    /* 辅助信息 */
--font-size-sm: 12px;    /* 标签、说明 */
--font-size-base: 13px;  /* 正文内容 */
--font-size-md: 14px;    /* 按钮、输入框 */
--font-size-lg: 16px;    /* 小标题 */
--font-size-xl: 20px;    /* 标题 */
--font-size-2xl: 24px;   /* 大标题 */
--font-size-3xl: 32px;   /* 页面标题 */

/* 行高系统 */
--line-height-tight: 1.2;
--line-height-normal: 1.4;
--line-height-relaxed: 1.6;
```

### 字重系统
```css
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

## 🎨 色彩系统

### 系统色彩
```css
/* macOS 系统色彩 */
--color-system-blue: #007AFF;
--color-system-green: #34C759;
--color-system-indigo: #5856D6;
--color-system-orange: #FF9500;
--color-system-pink: #FF2D92;
--color-system-purple: #AF52DE;
--color-system-red: #FF3B30;
--color-system-teal: #5AC8FA;
--color-system-yellow: #FFCC00;

/* 强调色 */
--color-accent: var(--color-system-blue);
--color-accent-hover: #0056CC;
--color-accent-active: #004499;
```

### 中性色彩
```css
/* 浅色主题 */
--color-gray-50: #FAFAFA;
--color-gray-100: #F5F5F7;
--color-gray-200: #E5E5EA;
--color-gray-300: #D1D1D6;
--color-gray-400: #C7C7CC;
--color-gray-500: #AEAEB2;
--color-gray-600: #8E8E93;
--color-gray-700: #636366;
--color-gray-800: #48484A;
--color-gray-900: #1C1C1E;

/* 暗色主题 */
--color-dark-gray-50: #1C1C1E;
--color-dark-gray-100: #2C2C2E;
--color-dark-gray-200: #3A3A3C;
--color-dark-gray-300: #48484A;
--color-dark-gray-400: #636366;
--color-dark-gray-500: #8E8E93;
--color-dark-gray-600: #AEAEB2;
--color-dark-gray-700: #C7C7CC;
--color-dark-gray-800: #D1D1D6;
--color-dark-gray-900: #F2F2F7;
```

### 语义色彩
```css
/* 成功状态 */
--color-success: var(--color-system-green);
--color-success-bg: rgba(52, 199, 89, 0.1);
--color-success-border: rgba(52, 199, 89, 0.3);

/* 警告状态 */
--color-warning: var(--color-system-orange);
--color-warning-bg: rgba(255, 149, 0, 0.1);
--color-warning-border: rgba(255, 149, 0, 0.3);

/* 错误状态 */
--color-error: var(--color-system-red);
--color-error-bg: rgba(255, 59, 48, 0.1);
--color-error-border: rgba(255, 59, 48, 0.3);

/* 信息状态 */
--color-info: var(--color-system-blue);
--color-info-bg: rgba(0, 122, 255, 0.1);
--color-info-border: rgba(0, 122, 255, 0.3);
```

## 📐 间距系统

### 间距规范
```css
/* 间距系统 (基于4px网格) */
--spacing-0: 0px;
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-10: 40px;
--spacing-12: 48px;
--spacing-16: 64px;
--spacing-20: 80px;
--spacing-24: 96px;
```

### 组件间距
```css
/* 组件内部间距 */
--padding-xs: var(--spacing-1);
--padding-sm: var(--spacing-2);
--padding-md: var(--spacing-3);
--padding-lg: var(--spacing-4);
--padding-xl: var(--spacing-6);

/* 组件外部间距 */
--margin-xs: var(--spacing-2);
--margin-sm: var(--spacing-3);
--margin-md: var(--spacing-4);
--margin-lg: var(--spacing-6);
--margin-xl: var(--spacing-8);
```

## 🔘 圆角系统

### 圆角规范
```css
/* 圆角系统 */
--border-radius-none: 0px;
--border-radius-sm: 4px;    /* 小组件 */
--border-radius-md: 6px;    /* 按钮、输入框 */
--border-radius-lg: 8px;    /* 卡片 */
--border-radius-xl: 12px;   /* 面板 */
--border-radius-2xl: 16px;  /* 模态框 */
--border-radius-3xl: 24px;  /* 大型容器 */
--border-radius-full: 50%;  /* 圆形 */
```

### 组件圆角应用
```css
/* 按钮圆角 */
.button {
  border-radius: var(--border-radius-md);
}

/* 输入框圆角 */
.input {
  border-radius: var(--border-radius-md);
}

/* 卡片圆角 */
.card {
  border-radius: var(--border-radius-lg);
}

/* 模态框圆角 */
.modal {
  border-radius: var(--border-radius-2xl);
}
```

## ✨ 阴影系统

### 阴影规范
```css
/* 阴影系统 */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);

/* 内阴影 */
--shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);

/* 暗色主题阴影 */
--shadow-dark-sm: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
--shadow-dark-md: 0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
--shadow-dark-lg: 0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.2);
```

## 🌫️ 毛玻璃效果

### 毛玻璃规范
```css
/* 毛玻璃效果 */
.glass-effect {
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 暗色主题毛玻璃 */
.glass-effect-dark {
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  background-color: rgba(28, 28, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 侧边栏毛玻璃 */
.sidebar-glass {
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  background-color: rgba(245, 245, 247, 0.9);
}

/* 模态框毛玻璃 */
.modal-glass {
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  background-color: rgba(255, 255, 255, 0.85);
}
```

## 🎬 动画系统

### 缓动函数
```css
/* macOS 缓动函数 */
--ease-in-out-quart: cubic-bezier(0.77, 0, 0.175, 1);
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
--ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-in-out-circ: cubic-bezier(0.85, 0, 0.15, 1);

/* 标准缓动 */
--ease-standard: var(--ease-in-out-quart);
--ease-decelerate: var(--ease-out-expo);
--ease-accelerate: cubic-bezier(0.4, 0, 1, 1);
```

### 动画时长
```css
/* 动画时长 */
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
--duration-slower: 500ms;

/* 组件动画时长 */
--duration-tooltip: var(--duration-fast);
--duration-button: var(--duration-fast);
--duration-modal: var(--duration-normal);
--duration-page: var(--duration-slow);
```

### 常用动画
```css
/* 淡入淡出 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* 滑入滑出 */
@keyframes slideInUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* 缩放动画 */
@keyframes scaleIn {
  from { 
    opacity: 0;
    transform: scale(0.9);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

/* 弹性动画 */
@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
```

## 📱 响应式设计

### 断点系统
```css
/* 响应式断点 */
--breakpoint-sm: 640px;   /* 小屏幕 */
--breakpoint-md: 768px;   /* 平板 */
--breakpoint-lg: 1024px;  /* 桌面 */
--breakpoint-xl: 1280px;  /* 大桌面 */
--breakpoint-2xl: 1536px; /* 超大屏 */
```

### 媒体查询
```css
/* 媒体查询混合器 */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }

/* 高分辨率屏幕 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  /* Retina 显示屏优化 */
}

/* 暗色主题 */
@media (prefers-color-scheme: dark) {
  /* 系统暗色主题适配 */
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  /* 无障碍动画减少 */
}
```

## 🎛️ 组件规范

### 按钮组件
```css
.button {
  /* 基础样式 */
  font-family: var(--font-family-system);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-2) var(--spacing-4);
  transition: all var(--duration-fast) var(--ease-standard);
  
  /* 主要按钮 */
  &.primary {
    background-color: var(--color-accent);
    color: white;
    box-shadow: var(--shadow-sm);
    
    &:hover {
      background-color: var(--color-accent-hover);
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }
    
    &:active {
      background-color: var(--color-accent-active);
      box-shadow: var(--shadow-xs);
      transform: translateY(0);
    }
  }
  
  /* 次要按钮 */
  &.secondary {
    background-color: var(--color-gray-100);
    color: var(--color-gray-900);
    border: 1px solid var(--color-gray-300);
    
    &:hover {
      background-color: var(--color-gray-200);
      border-color: var(--color-gray-400);
    }
  }
}
```

### 输入框组件
```css
.input {
  font-family: var(--font-family-system);
  font-size: var(--font-size-base);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--color-gray-300);
  background-color: white;
  transition: all var(--duration-fast) var(--ease-standard);
  
  &:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
  }
  
  &::placeholder {
    color: var(--color-gray-500);
  }
}
```

## 🌙 暗色主题适配

### 主题切换
```css
/* 主题变量 */
:root {
  --bg-primary: var(--color-gray-50);
  --bg-secondary: white;
  --text-primary: var(--color-gray-900);
  --text-secondary: var(--color-gray-600);
}

[data-theme="dark"] {
  --bg-primary: var(--color-dark-gray-50);
  --bg-secondary: var(--color-dark-gray-100);
  --text-primary: var(--color-dark-gray-900);
  --text-secondary: var(--color-dark-gray-600);
}
```

### 中文字体优化
```css
/* 中文字体在暗色主题下的优化 */
[data-theme="dark"] {
  font-family: var(--font-family-chinese);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

## 📏 实施指南

### 1. CSS变量系统
- 使用CSS自定义属性定义所有设计令牌
- 支持主题切换和动态更新
- 确保向后兼容性

### 2. 组件库集成
- 更新现有UI组件以符合macOS设计规范
- 创建新的macOS特有组件
- 确保组件的可复用性和一致性

### 3. 性能优化
- 使用CSS-in-JS或CSS模块避免样式冲突
- 优化动画性能，确保60fps
- 实现懒加载和代码分割

### 4. 测试验证
- 跨浏览器兼容性测试
- 不同分辨率和DPI测试
- 无障碍功能测试
- 性能基准测试

---

**设计规范版本**: v1.0  
**最后更新**: 2025-01-15  
**下一步**: 实施组件库更新和主题系统集成
