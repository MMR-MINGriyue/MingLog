/**
 * 测试工具函数
 * Test Utility Functions
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { LocaleProvider } from '../components/LocaleProvider';
import { ThemeProvider } from '../components/ThemeProvider';

// 创建包含所有Provider的测试包装器
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <LocaleProvider>
        {children}
      </LocaleProvider>
    </ThemeProvider>
  );
};

// 自定义render函数，自动包含Provider
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// 重新导出所有testing-library的工具
export * from '@testing-library/react';
export { customRender as render };

// 常用的测试数据
export const mockGraph = {
  id: 'test-graph-1',
  name: '测试图谱',
  path: 'test-graph',
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now() - 3600000,
};

export const mockPage = {
  id: 'test-page-1',
  name: '测试页面',
  title: '测试页面标题',
  tags: ['测试', '页面'],
  isJournal: false,
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now() - 3600000,
  graphId: 'test-graph-1',
};

export const mockBlock = {
  id: 'test-block-1',
  content: '这是一个测试块',
  pageId: 'test-page-1',
  order: 0,
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now() - 3600000,
};

export const mockGraphData = {
  nodes: [
    {
      id: 'page-1',
      label: '页面1',
      type: 'page' as const,
      size: 10,
    },
    {
      id: 'page-2',
      label: '页面2',
      type: 'page' as const,
      size: 10,
    },
    {
      id: 'tag-1',
      label: '标签1',
      type: 'tag' as const,
      size: 8,
    },
  ],
  links: [
    {
      id: 'link-1',
      source: 'page-1',
      target: 'page-2',
      type: 'reference' as const,
    },
    {
      id: 'link-2',
      source: 'page-1',
      target: 'tag-1',
      type: 'tag' as const,
    },
  ],
};

// 模拟异步操作
export const mockAsyncOperation = (delay = 100) => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

// 模拟错误
export const mockError = new Error('测试错误');

// 模拟文件
export const mockFile = new File(['test content'], 'test.txt', {
  type: 'text/plain',
});

// 模拟事件
export const mockEvent = (type: string, data: any = {}) => {
  return new CustomEvent(type, { detail: data });
};

// 等待元素出现的辅助函数
export const waitForElement = async (selector: string, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
};

// 模拟拖拽事件
export const mockDragEvent = (type: string, dataTransfer?: any) => {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'dataTransfer', {
    value: dataTransfer || {
      getData: vi.fn(),
      setData: vi.fn(),
      clearData: vi.fn(),
      setDragImage: vi.fn(),
    },
  });
  return event;
};

// 模拟键盘事件
export const mockKeyboardEvent = (key: string, options: any = {}) => {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    ...options,
  });
};

// 模拟鼠标事件
export const mockMouseEvent = (type: string, options: any = {}) => {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    ...options,
  });
};
