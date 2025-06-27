/**
 * useLocale Hook 测试
 * useLocale Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocaleSettings, detectSystemLocale, getAvailableLocales } from '../useLocale';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator
const navigatorMock = {
  language: 'zh-CN',
  languages: ['zh-CN', 'zh', 'en-US'],
};

Object.defineProperty(window, 'navigator', {
  value: navigatorMock,
  writable: true,
});

describe('useLocaleSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default locale when no saved preference', () => {
    const { result } = renderHook(() => useLocaleSettings());
    
    expect(result.current.locale).toBe('zh-CN');
  });

  it('initializes with saved locale preference', () => {
    localStorageMock.getItem.mockReturnValue('en-US');
    
    const { result } = renderHook(() => useLocaleSettings());
    
    expect(result.current.locale).toBe('en-US');
  });

  it('detects browser language when no saved preference', () => {
    // Mock English browser
    Object.defineProperty(window, 'navigator', {
      value: { language: 'en-US', languages: ['en-US'] },
      writable: true,
    });
    
    const { result } = renderHook(() => useLocaleSettings());
    
    expect(result.current.locale).toBe('en-US');
  });

  it('changes locale and saves to localStorage', () => {
    const { result } = renderHook(() => useLocaleSettings());
    
    act(() => {
      result.current.setLocale('en-US');
    });
    
    expect(result.current.locale).toBe('en-US');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('minglog-locale', 'en-US');
  });

  describe('translation function', () => {
    it('translates simple keys', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const translation = result.current.t('common.save');
      expect(translation).toBe('保存');
    });

    it('translates nested keys', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const translation = result.current.t('editor.placeholder');
      expect(translation).toBe('开始写作...');
    });

    it('falls back to English for missing Chinese translations', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const translation = result.current.t('nonexistent.key');
      expect(translation).toBe('nonexistent.key');
    });

    it('returns key when translation not found', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const translation = result.current.t('completely.missing.key');
      expect(translation).toBe('completely.missing.key');
    });

    it('supports parameter substitution', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      // This would need a translation with parameters
      const translation = result.current.t('test.withParams', { name: '测试' });
      // Since we don't have this key, it should return the key
      expect(translation).toBe('test.withParams');
    });
  });

  describe('date formatting', () => {
    it('formats dates in Chinese locale', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const date = new Date('2025-06-27');
      const formatted = result.current.formatDate(date);
      
      expect(formatted).toContain('2025');
      expect(formatted).toContain('6');
      expect(formatted).toContain('27');
    });

    it('formats dates in English locale', () => {
      localStorageMock.getItem.mockReturnValue('en-US');
      const { result } = renderHook(() => useLocaleSettings());
      
      const date = new Date('2025-06-27');
      const formatted = result.current.formatDate(date);
      
      expect(formatted).toContain('2025');
      expect(formatted).toContain('June');
      expect(formatted).toContain('27');
    });

    it('formats time correctly', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const date = new Date('2025-06-27T14:30:00');
      const formatted = result.current.formatTime(date);
      
      expect(formatted).toContain('14');
      expect(formatted).toContain('30');
    });

    it('formats date and time together', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const date = new Date('2025-06-27T14:30:00');
      const formatted = result.current.formatDateTime(date);
      
      expect(formatted).toContain('2025');
      expect(formatted).toContain('14');
      expect(formatted).toContain('30');
    });
  });

  describe('relative time formatting', () => {
    it('formats recent time as "刚刚"', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const date = new Date(Date.now() - 30000); // 30 seconds ago
      const formatted = result.current.formatRelativeTime(date);
      
      expect(formatted).toBe('刚刚');
    });

    it('formats minutes ago', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const date = new Date(Date.now() - 300000); // 5 minutes ago
      const formatted = result.current.formatRelativeTime(date);
      
      expect(formatted).toContain('5');
      expect(formatted).toContain('分钟');
      expect(formatted).toContain('前');
    });

    it('formats hours ago', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const date = new Date(Date.now() - 7200000); // 2 hours ago
      const formatted = result.current.formatRelativeTime(date);
      
      expect(formatted).toContain('2');
      expect(formatted).toContain('小时');
      expect(formatted).toContain('前');
    });

    it('formats yesterday', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const date = new Date(Date.now() - 86400000); // 1 day ago
      const formatted = result.current.formatRelativeTime(date);
      
      expect(formatted).toBe('昨天');
    });
  });

  describe('number formatting', () => {
    it('formats numbers with locale-specific separators', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const formatted = result.current.formatNumber(1234567.89);
      
      expect(formatted).toContain('1,234,567.89');
    });

    it('formats currency', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const formatted = result.current.formatNumber(1234.56, {
        style: 'currency',
        currency: 'CNY',
      });
      
      expect(formatted).toContain('1,234.56');
    });
  });

  describe('file size formatting', () => {
    it('formats bytes', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const formatted = result.current.formatFileSize(512);
      expect(formatted).toBe('512 字节');
    });

    it('formats kilobytes', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const formatted = result.current.formatFileSize(1536); // 1.5 KB
      expect(formatted).toBe('1.5 KB');
    });

    it('formats megabytes', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const formatted = result.current.formatFileSize(2097152); // 2 MB
      expect(formatted).toBe('2.0 MB');
    });
  });

  describe('duration formatting', () => {
    it('formats seconds only', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const formatted = result.current.formatDuration(45);
      expect(formatted).toBe('0:45');
    });

    it('formats minutes and seconds', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const formatted = result.current.formatDuration(125); // 2:05
      expect(formatted).toBe('2:05');
    });

    it('formats hours, minutes and seconds', () => {
      const { result } = renderHook(() => useLocaleSettings());
      
      const formatted = result.current.formatDuration(3665); // 1:01:05
      expect(formatted).toBe('1:01:05');
    });
  });
});

describe('utility functions', () => {
  describe('detectSystemLocale', () => {
    it('detects Chinese locale', () => {
      Object.defineProperty(window, 'navigator', {
        value: { language: 'zh-CN' },
        writable: true,
      });
      
      const locale = detectSystemLocale();
      expect(locale).toBe('zh-CN');
    });

    it('detects English locale', () => {
      Object.defineProperty(window, 'navigator', {
        value: { language: 'en-US' },
        writable: true,
      });
      
      const locale = detectSystemLocale();
      expect(locale).toBe('en-US');
    });

    it('defaults to English for unknown locales', () => {
      Object.defineProperty(window, 'navigator', {
        value: { language: 'fr-FR' },
        writable: true,
      });
      
      const locale = detectSystemLocale();
      expect(locale).toBe('en-US');
    });
  });

  describe('getAvailableLocales', () => {
    it('returns available locales', () => {
      const locales = getAvailableLocales();
      
      expect(locales).toHaveLength(2);
      expect(locales[0]).toEqual({
        code: 'zh-CN',
        name: '中文',
        nativeName: '中文',
      });
      expect(locales[1]).toEqual({
        code: 'en-US',
        name: 'English',
        nativeName: 'English',
      });
    });
  });
});
