/**
 * MingLog 无障碍访问提供者
 * 提供键盘导航、屏幕阅读器支持和其他无障碍功能
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface AccessibilitySettings {
  /** 启用键盘导航 */
  keyboardNavigation: boolean;
  /** 启用屏幕阅读器支持 */
  screenReader: boolean;
  /** 启用高对比度模式 */
  highContrast: boolean;
  /** 启用减少动画 */
  reduceMotion: boolean;
  /** 字体大小缩放 */
  fontScale: number;
  /** 启用焦点指示器 */
  focusIndicator: boolean;
  /** 启用跳转链接 */
  skipLinks: boolean;
  /** 启用实时区域公告 */
  liveRegions: boolean;
}

export interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  focusElement: (selector: string) => void;
  isKeyboardUser: boolean;
  currentFocus: string | null;
}

const defaultSettings: AccessibilitySettings = {
  keyboardNavigation: true,
  screenReader: true,
  highContrast: false,
  reduceMotion: false,
  fontScale: 1,
  focusIndicator: true,
  skipLinks: true,
  liveRegions: true
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useLocalStorage('minglog-accessibility-settings', defaultSettings);
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  const [currentFocus, setCurrentFocus] = useState<string | null>(null);

  // 更新设置
  const updateSettings = useCallback((updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, [setSettings]);

  // 屏幕阅读器公告
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.liveRegions) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // 清理
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [settings.liveRegions]);

  // 聚焦元素
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      setCurrentFocus(selector);
    }
  }, []);

  // 检测键盘使用
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // 应用无障碍设置
  useEffect(() => {
    const root = document.documentElement;

    // 高对比度模式
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // 减少动画
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // 字体缩放
    root.style.setProperty('--font-scale', settings.fontScale.toString());

    // 焦点指示器
    if (settings.focusIndicator) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }

    // 键盘导航
    if (settings.keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }
  }, [settings]);

  // 键盘导航处理
  useEffect(() => {
    if (!settings.keyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape 键处理
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (activeModal) {
          const closeButton = activeModal.querySelector('[data-close]') as HTMLElement;
          if (closeButton) {
            closeButton.click();
          }
        }
      }

      // F6 键在主要区域间导航
      if (e.key === 'F6') {
        e.preventDefault();
        const landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="complementary"], [role="banner"]');
        const currentIndex = Array.from(landmarks).findIndex(el => el.contains(document.activeElement));
        const nextIndex = (currentIndex + 1) % landmarks.length;
        const nextLandmark = landmarks[nextIndex] as HTMLElement;
        
        if (nextLandmark) {
          const focusableElement = nextLandmark.querySelector('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])') as HTMLElement;
          if (focusableElement) {
            focusableElement.focus();
          } else {
            nextLandmark.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [settings.keyboardNavigation]);

  // 焦点跟踪
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target) {
        setCurrentFocus(target.tagName.toLowerCase() + (target.id ? `#${target.id}` : ''));
      }
    };

    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, []);

  const contextValue: AccessibilityContextType = {
    settings,
    updateSettings,
    announceToScreenReader,
    focusElement,
    isKeyboardUser,
    currentFocus
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {/* 跳转链接 */}
      {settings.skipLinks && <SkipLinks />}
      
      {/* 实时区域 */}
      {settings.liveRegions && <LiveRegions />}
      
      {/* 主要内容 */}
      {children}
    </AccessibilityContext.Provider>
  );
};

// 跳转链接组件
const SkipLinks: React.FC = () => {
  const skipLinks = [
    { href: '#main-content', label: '跳转到主要内容' },
    { href: '#navigation', label: '跳转到导航' },
    { href: '#search', label: '跳转到搜索' }
  ];

  return (
    <div className="skip-links">
      {skipLinks.map(link => (
        <a
          key={link.href}
          href={link.href}
          className="skip-link"
          style={{
            position: 'absolute',
            top: '-40px',
            left: '6px',
            background: '#000',
            color: '#fff',
            padding: '8px',
            textDecoration: 'none',
            borderRadius: '4px',
            zIndex: 10000,
            transition: 'top 0.3s'
          }}
          onFocus={(e) => {
            e.currentTarget.style.top = '6px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.top = '-40px';
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

// 实时区域组件
const LiveRegions: React.FC = () => {
  return (
    <>
      {/* 礼貌的实时区域 */}
      <div
        id="polite-live-region"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* 断言的实时区域 */}
      <div
        id="assertive-live-region"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
};

// 无障碍工具栏组件
export const AccessibilityToolbar: React.FC = () => {
  const { settings, updateSettings } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="accessibility-toolbar">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="accessibility-panel"
        className="accessibility-toggle"
        title="无障碍设置"
      >
        ♿
      </button>

      {isOpen && (
        <div
          id="accessibility-panel"
          className="accessibility-panel"
          role="dialog"
          aria-labelledby="accessibility-title"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '16px',
            minWidth: '250px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000
          }}
        >
          <h3 id="accessibility-title" style={{ margin: '0 0 16px 0' }}>
            无障碍设置
          </h3>

          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => updateSettings({ highContrast: e.target.checked })}
              />
              高对比度模式
            </label>
          </div>

          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.reduceMotion}
                onChange={(e) => updateSettings({ reduceMotion: e.target.checked })}
              />
              减少动画
            </label>
          </div>

          <div className="setting-group">
            <label>
              字体大小: {Math.round(settings.fontScale * 100)}%
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.1"
                value={settings.fontScale}
                onChange={(e) => updateSettings({ fontScale: parseFloat(e.target.value) })}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </label>
          </div>

          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.focusIndicator}
                onChange={(e) => updateSettings({ focusIndicator: e.target.checked })}
              />
              显示焦点指示器
            </label>
          </div>

          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.keyboardNavigation}
                onChange={(e) => updateSettings({ keyboardNavigation: e.target.checked })}
              />
              键盘导航
            </label>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            关闭
          </button>
        </div>
      )}
    </div>
  );
};

// 焦点陷阱钩子
export function useFocusTrap(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const focusableElements = document.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // 初始焦点
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);
}

// 屏幕阅读器专用文本钩子
export function useScreenReaderText(text: string) {
  const { settings } = useAccessibility();
  
  return settings.screenReader ? (
    <span className="sr-only">{text}</span>
  ) : null;
}

export default AccessibilityProvider;
