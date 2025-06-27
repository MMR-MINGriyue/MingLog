/**
 * 本地化 Hook
 * Localization Hook
 */

import { createContext, useContext, useState, useEffect } from 'react';
import zhCN from '../locales/zh-CN';

export type SupportedLocale = 'zh-CN' | 'en-US';

export interface LocaleContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date, format?: string) => string;
  formatTime: (date: Date, format?: string) => string;
  formatDateTime: (date: Date, format?: string) => string;
  formatRelativeTime: (date: Date) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatFileSize: (bytes: number) => string;
  formatDuration: (seconds: number) => string;
}

const STORAGE_KEY = 'minglog-locale';

// 默认英文翻译（简化版）
const enUS = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    open: 'Open',
    settings: 'Settings',
    help: 'Help',
    about: 'About',
  },
  editor: {
    placeholder: 'Start writing...',
    title: 'Title',
    subtitle: 'Subtitle',
    paragraph: 'Paragraph',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    strikethrough: 'Strikethrough',
    code: 'Code',
    link: 'Link',
    wordCount: 'Word Count',
    lastSaved: 'Last Saved',
    saveSuccess: 'Saved Successfully',
    saveError: 'Save Failed',
  },
  pages: {
    title: 'Pages',
    allPages: 'All Pages',
    createPage: 'Create Page',
    newPage: 'New Page',
    untitledPage: 'Untitled Page',
    deletePage: 'Delete Page',
    pageNotFound: 'Page Not Found',
  },
  search: {
    title: 'Search',
    placeholder: 'Search pages, blocks or content...',
    searchResults: 'Search Results',
    noResults: 'No results found',
  },
  theme: {
    title: 'Theme',
    lightTheme: 'Light Theme',
    darkTheme: 'Dark Theme',
    systemTheme: 'System Theme',
  },
  errors: {
    networkError: 'Network Error',
    serverError: 'Server Error',
    notFound: 'Not Found',
    unknownError: 'Unknown Error',
  },
  time: {
    now: 'Now',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    justNow: 'Just now',
    ago: 'ago',
    later: 'later',
  },
} as const;

const locales = {
  'zh-CN': zhCN,
  'en-US': enUS,
} as const;

export const LocaleContext = createContext<LocaleContextType | null>(null);

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};

export const useLocaleSettings = () => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    if (typeof window === 'undefined') return 'zh-CN';
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'zh-CN' || saved === 'en-US')) {
      return saved as SupportedLocale;
    }
    
    // 检测浏览器语言
    const browserLang = navigator.language;
    if (browserLang.startsWith('zh')) {
      return 'zh-CN';
    }
    return 'en-US';
  });

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  };

  // 翻译函数
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = locales[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // 如果找不到翻译，尝试英文
        if (locale !== 'en-US') {
          let fallback: any = locales['en-US'];
          for (const fk of keys) {
            if (fallback && typeof fallback === 'object' && fk in fallback) {
              fallback = fallback[fk];
            } else {
              fallback = key; // 最后回退到 key 本身
              break;
            }
          }
          value = fallback;
        } else {
          value = key;
        }
        break;
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    // 参数替换
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    return value;
  };

  // 日期格式化
  const formatDate = (date: Date, format?: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    if (format === 'short') {
      options.month = 'short';
    } else if (format === 'numeric') {
      options.month = 'numeric';
    }
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  };

  // 时间格式化
  const formatTime = (date: Date, format?: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric',
    };
    
    if (format === 'full') {
      options.second = 'numeric';
    }
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  };

  // 日期时间格式化
  const formatDateTime = (date: Date, format?: string): string => {
    const dateStr = formatDate(date, format);
    const timeStr = formatTime(date, format);
    return `${dateStr} ${timeStr}`;
  };

  // 相对时间格式化
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) {
      return t('time.justNow');
    } else if (diffMinutes < 60) {
      return `${diffMinutes} ${t('time.minutes')} ${t('time.ago')}`;
    } else if (diffHours < 24) {
      return `${diffHours} ${t('time.hours')} ${t('time.ago')}`;
    } else if (diffDays === 1) {
      return t('time.yesterday');
    } else if (diffDays < 7) {
      return `${diffDays} ${t('time.days')} ${t('time.ago')}`;
    } else {
      return formatDate(date, 'short');
    }
  };

  // 数字格式化
  const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(locale, options).format(num);
  };

  // 文件大小格式化
  const formatFileSize = (bytes: number): string => {
    const units = ['bytes', 'kb', 'mb', 'gb', 'tb'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    const formattedSize = unitIndex === 0 ? size.toString() : size.toFixed(1);
    const unit = t(`units.${units[unitIndex]}`);
    
    return `${formattedSize} ${unit}`;
  };

  // 持续时间格式化
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  return {
    locale,
    setLocale,
    t,
    formatDate,
    formatTime,
    formatDateTime,
    formatRelativeTime,
    formatNumber,
    formatFileSize,
    formatDuration,
  };
};

// 语言选择器组件的辅助函数
export const getAvailableLocales = () => [
  { code: 'zh-CN', name: '中文', nativeName: '中文' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
] as const;

// 检测系统语言
export const detectSystemLocale = (): SupportedLocale => {
  if (typeof navigator === 'undefined') return 'zh-CN';
  
  const lang = navigator.language || navigator.languages?.[0];
  if (lang?.startsWith('zh')) {
    return 'zh-CN';
  }
  return 'en-US';
};

// 获取语言方向（为未来的 RTL 支持做准备）
export const getLocaleDirection = (locale: SupportedLocale): 'ltr' | 'rtl' => {
  // 目前支持的语言都是 LTR
  return 'ltr';
};

// 获取语言的数字格式
export const getLocaleNumberFormat = (locale: SupportedLocale) => {
  return {
    decimal: locale === 'zh-CN' ? '.' : '.',
    thousands: locale === 'zh-CN' ? ',' : ',',
    currency: locale === 'zh-CN' ? '¥' : '$',
  };
};

export default useLocale;
