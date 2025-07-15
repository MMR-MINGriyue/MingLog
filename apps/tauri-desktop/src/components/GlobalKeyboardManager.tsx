/**
 * 全局键盘管理器组件
 * 整合全局快捷键和键盘导航功能
 */

import React, { useEffect, useCallback, useState } from 'react';
import { globalShortcutManager } from '../services/GlobalShortcutManager';
import { keyboardNavigationManager } from '../services/KeyboardNavigationManager';

/**
 * 全局键盘管理器属性
 */
export interface GlobalKeyboardManagerProps {
  /** 子组件 */
  children: React.ReactNode;
  /** 是否启用全局快捷键 */
  enableShortcuts?: boolean;
  /** 是否启用键盘导航 */
  enableNavigation?: boolean;
  /** 是否显示快捷键帮助 */
  showShortcutHelp?: boolean;
  /** 快捷键帮助触发键 */
  helpTriggerKey?: string;
}

/**
 * 快捷键帮助对话框
 */
const ShortcutHelpDialog: React.FC<{
  visible: boolean;
  onClose: () => void;
}> = ({ visible, onClose }) => {
  const [shortcuts, setShortcuts] = useState<{ [category: string]: any[] }>({});

  useEffect(() => {
    if (visible) {
      const help = globalShortcutManager.getShortcutHelp();
      setShortcuts(help);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              键盘快捷键
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {Object.entries(shortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 capitalize">
                {getCategoryDisplayName(category)}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut) => (
                  <div 
                    key={shortcut.id}
                    className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500">
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            按 <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">F1</kbd> 或 
            <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded ml-1">?</kbd> 随时查看此帮助
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 全局键盘管理器组件
 */
export const GlobalKeyboardManager: React.FC<GlobalKeyboardManagerProps> = ({
  children,
  enableShortcuts = true,
  enableNavigation = true,
  showShortcutHelp = true,
  helpTriggerKey = 'F1'
}) => {
  const [helpVisible, setHelpVisible] = useState(false);

  // 初始化快捷键处理
  useEffect(() => {
    if (!enableShortcuts) return;

    // 全局搜索
    const handleGlobalSearch = () => {
      const event = new CustomEvent('global-search-open');
      document.dispatchEvent(event);
    };

    // 模态框关闭
    const handleModalClose = (data: any) => {
      const { modal } = data;
      if (modal) {
        const closeButton = modal.querySelector('[data-close], .close-button, [aria-label*="close" i]');
        if (closeButton) {
          (closeButton as HTMLElement).click();
        } else {
          // 触发自定义关闭事件
          const closeEvent = new CustomEvent('modal-close', { detail: { modal } });
          modal.dispatchEvent(closeEvent);
        }
      }
    };

    // 可关闭元素关闭
    const handleCloseableClose = (data: any) => {
      const { element } = data;
      if (element) {
        const closeButton = element.querySelector('[data-close]');
        if (closeButton) {
          (closeButton as HTMLElement).click();
        } else {
          element.style.display = 'none';
        }
      }
    };

    // 快速保存
    const handleQuickSave = () => {
      const event = new CustomEvent('quick-save');
      document.dispatchEvent(event);
    };

    // 撤销/重做
    const handleUndo = () => {
      const event = new CustomEvent('undo');
      document.dispatchEvent(event);
    };

    const handleRedo = () => {
      const event = new CustomEvent('redo');
      document.dispatchEvent(event);
    };

    // 新建文档
    const handleNewDocument = () => {
      const event = new CustomEvent('new-document');
      document.dispatchEvent(event);
    };

    // 打开文档
    const handleOpenDocument = () => {
      const event = new CustomEvent('open-document');
      document.dispatchEvent(event);
    };

    // 页面内查找
    const handleFindInPage = () => {
      const event = new CustomEvent('find-in-page');
      document.dispatchEvent(event);
    };

    // 帮助
    const handleHelpOpen = () => {
      if (showShortcutHelp) {
        setHelpVisible(true);
      }
    };

    // 设置
    const handleSettingsOpen = () => {
      const event = new CustomEvent('settings-open');
      document.dispatchEvent(event);
    };

    // 绑定事件监听器
    globalShortcutManager.on('global-search-open', handleGlobalSearch);
    globalShortcutManager.on('modal-close', handleModalClose);
    globalShortcutManager.on('closeable-close', handleCloseableClose);
    globalShortcutManager.on('quick-save', handleQuickSave);
    globalShortcutManager.on('undo', handleUndo);
    globalShortcutManager.on('redo', handleRedo);
    globalShortcutManager.on('new-document', handleNewDocument);
    globalShortcutManager.on('open-document', handleOpenDocument);
    globalShortcutManager.on('find-in-page', handleFindInPage);
    globalShortcutManager.on('help-open', handleHelpOpen);
    globalShortcutManager.on('settings-open', handleSettingsOpen);

    return () => {
      globalShortcutManager.off('global-search-open', handleGlobalSearch);
      globalShortcutManager.off('modal-close', handleModalClose);
      globalShortcutManager.off('closeable-close', handleCloseableClose);
      globalShortcutManager.off('quick-save', handleQuickSave);
      globalShortcutManager.off('undo', handleUndo);
      globalShortcutManager.off('redo', handleRedo);
      globalShortcutManager.off('new-document', handleNewDocument);
      globalShortcutManager.off('open-document', handleOpenDocument);
      globalShortcutManager.off('find-in-page', handleFindInPage);
      globalShortcutManager.off('help-open', handleHelpOpen);
      globalShortcutManager.off('settings-open', handleSettingsOpen);
    };
  }, [enableShortcuts, showShortcutHelp]);

  // 初始化键盘导航
  useEffect(() => {
    if (!enableNavigation) return;

    // 监听导航事件
    const handleElementActivated = (data: any) => {
      const { element, action } = data;
      
      if (action) {
        // 处理自定义动作
        const event = new CustomEvent(`nav-action-${action}`, { detail: { element } });
        document.dispatchEvent(event);
      }
    };

    keyboardNavigationManager.on('element-activated', handleElementActivated);

    return () => {
      keyboardNavigationManager.off('element-activated', handleElementActivated);
    };
  }, [enableNavigation]);

  // 处理帮助快捷键
  useEffect(() => {
    if (!showShortcutHelp) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === helpTriggerKey || (event.shiftKey && event.key === '?')) {
        event.preventDefault();
        setHelpVisible(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [helpTriggerKey, showShortcutHelp]);

  // 处理自定义事件
  useEffect(() => {
    // 全局搜索事件
    const handleGlobalSearchOpen = () => {
      // 查找搜索组件并打开
      const searchTrigger = document.querySelector('[data-search-trigger]') as HTMLElement;
      if (searchTrigger) {
        searchTrigger.click();
      } else {
        // 触发搜索状态更新
        const searchEvent = new CustomEvent('toggle-search', { detail: { open: true } });
        document.dispatchEvent(searchEvent);
      }
    };

    // 快速保存事件
    const handleQuickSave = () => {
      // 查找保存按钮并点击
      const saveButton = document.querySelector('[data-save-trigger]') as HTMLElement;
      if (saveButton) {
        saveButton.click();
      } else {
        // 触发保存事件
        console.log('执行快速保存');
      }
    };

    // 撤销事件
    const handleUndo = () => {
      const undoButton = document.querySelector('[data-undo-trigger]') as HTMLElement;
      if (undoButton) {
        undoButton.click();
      } else {
        document.execCommand('undo');
      }
    };

    // 重做事件
    const handleRedo = () => {
      const redoButton = document.querySelector('[data-redo-trigger]') as HTMLElement;
      if (redoButton) {
        redoButton.click();
      } else {
        document.execCommand('redo');
      }
    };

    // 页面内查找事件
    const handleFindInPage = () => {
      const findButton = document.querySelector('[data-find-trigger]') as HTMLElement;
      if (findButton) {
        findButton.click();
      } else {
        // 显示浏览器的查找功能
        if (navigator.userAgent.includes('Tauri')) {
          // Tauri应用中的查找
          console.log('打开Tauri查找功能');
        }
      }
    };

    document.addEventListener('global-search-open', handleGlobalSearchOpen);
    document.addEventListener('quick-save', handleQuickSave);
    document.addEventListener('undo', handleUndo);
    document.addEventListener('redo', handleRedo);
    document.addEventListener('find-in-page', handleFindInPage);

    return () => {
      document.removeEventListener('global-search-open', handleGlobalSearchOpen);
      document.removeEventListener('quick-save', handleQuickSave);
      document.removeEventListener('undo', handleUndo);
      document.removeEventListener('redo', handleRedo);
      document.removeEventListener('find-in-page', handleFindInPage);
    };
  }, []);

  return (
    <>
      {children}
      
      {/* 快捷键帮助对话框 */}
      <ShortcutHelpDialog
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
      />
      
      {/* 键盘导航样式 */}
      <style jsx global>{`
        .keyboard-focus {
          outline: 2px solid #007AFF !important;
          outline-offset: 2px !important;
          border-radius: 4px;
        }
        
        .keyboard-focus:focus {
          outline: 2px solid #007AFF !important;
          outline-offset: 2px !important;
        }
        
        [data-navigable] {
          position: relative;
        }
        
        [data-navigable]:focus {
          outline: 2px solid #007AFF;
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
};

/**
 * 获取分类显示名称
 */
function getCategoryDisplayName(category: string): string {
  const categoryNames: { [key: string]: string } = {
    global: '全局操作',
    navigation: '导航',
    editing: '编辑',
    search: '搜索',
    modal: '弹窗'
  };
  
  return categoryNames[category] || category;
}

/**
 * 格式化快捷键显示
 */
function formatShortcut(shortcut: any): string {
  const parts: string[] = [];
  
  if (shortcut.modifiers.ctrl) parts.push('Ctrl');
  if (shortcut.modifiers.shift) parts.push('Shift');
  if (shortcut.modifiers.alt) parts.push('Alt');
  if (shortcut.modifiers.meta) parts.push('Cmd');
  
  parts.push(shortcut.key);
  
  return parts.join(' + ');
}

export default GlobalKeyboardManager;
