/**
 * User Preferences Types
 * Defines the structure for user preference settings
 */

import { ThemeMode, UserThemePreferences } from '../theme/types';
import { LayoutConfig } from './layout';
import { FontSizeConfig } from '../hooks/useFontSize';

// Application preferences
export interface AppPreferences {
  // General settings
  language: string;
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
  confirmBeforeClose: boolean;
  showWelcomeScreen: boolean;
  checkForUpdates: boolean;
  
  // Window settings
  windowState: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    isMaximized: boolean;
    isFullscreen: boolean;
  };
  
  // Recent files
  recentFiles: string[];
  maxRecentFiles: number;
  
  // Backup settings
  enableBackup: boolean;
  backupInterval: number; // in hours
  maxBackupFiles: number;
}

// Editor preferences
export interface EditorPreferences {
  // Basic settings
  wordWrap: boolean;
  showLineNumbers: boolean;
  showMinimap: boolean;
  renderWhitespace: boolean;
  highlightCurrentLine: boolean;
  
  // Indentation
  tabSize: number;
  insertSpaces: boolean;
  autoIndent: boolean;
  
  // Behavior
  autoCloseBrackets: boolean;
  autoCloseQuotes: boolean;
  autoSurround: boolean;
  enableSnippets: boolean;
  
  // Markdown specific
  livePreview: boolean;
  previewMode: 'side' | 'bottom' | 'tab';
  mathSupport: boolean;
  mermaidSupport: boolean;
  
  // Spell check
  spellCheck: boolean;
  spellCheckLanguage: string;
}

// Search preferences
export interface SearchPreferences {
  // Search behavior
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  searchInFilenames: boolean;
  
  // Search scope
  includeArchived: boolean;
  searchDepth: number;
  
  // Search history
  saveSearchHistory: boolean;
  maxSearchHistory: number;
  recentSearches: string[];
}

// Export preferences
export interface ExportPreferences {
  // Default formats
  defaultFormat: 'markdown' | 'html' | 'pdf' | 'docx';
  
  // PDF settings
  pdfPageSize: 'A4' | 'Letter' | 'Legal';
  pdfMargins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  includeTableOfContents: boolean;
  
  // HTML settings
  htmlTheme: string;
  includeCSS: boolean;
  
  // Export location
  defaultExportPath: string;
  askForLocation: boolean;
}

// Privacy preferences
export interface PrivacyPreferences {
  // Analytics
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  
  // Data collection
  collectUsageStats: boolean;
  shareErrorReports: boolean;
  
  // Security
  enableEncryption: boolean;
  lockAfterInactivity: boolean;
  inactivityTimeout: number; // in minutes
}

// Complete user preferences
export interface UserPreferences {
  // Core preferences
  app: AppPreferences;
  theme: UserThemePreferences;
  layout: LayoutConfig;
  fontSize: FontSizeConfig;
  editor: EditorPreferences;
  search: SearchPreferences;
  export: ExportPreferences;
  privacy: PrivacyPreferences;
  
  // Metadata
  version: string;
  lastModified: string;
  deviceId: string;
}

// Preference categories for organization
export type PreferenceCategory = 
  | 'app' 
  | 'theme' 
  | 'layout' 
  | 'fontSize' 
  | 'editor' 
  | 'search' 
  | 'export' 
  | 'privacy';

// Preference change event
export interface PreferenceChangeEvent {
  category: PreferenceCategory;
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
}

// Preference validation result
export interface PreferenceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Default preferences
export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  language: 'zh-CN',
  autoSave: true,
  autoSaveInterval: 30,
  confirmBeforeClose: true,
  showWelcomeScreen: true,
  checkForUpdates: true,
  
  windowState: {
    width: 1200,
    height: 800,
    isMaximized: false,
    isFullscreen: false,
  },
  
  recentFiles: [],
  maxRecentFiles: 10,
  
  enableBackup: true,
  backupInterval: 24,
  maxBackupFiles: 5,
};

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  wordWrap: true,
  showLineNumbers: true,
  showMinimap: false,
  renderWhitespace: false,
  highlightCurrentLine: true,
  
  tabSize: 2,
  insertSpaces: true,
  autoIndent: true,
  
  autoCloseBrackets: true,
  autoCloseQuotes: true,
  autoSurround: true,
  enableSnippets: true,
  
  livePreview: true,
  previewMode: 'side',
  mathSupport: true,
  mermaidSupport: true,
  
  spellCheck: false,
  spellCheckLanguage: 'en-US',
};

export const DEFAULT_SEARCH_PREFERENCES: SearchPreferences = {
  caseSensitive: false,
  wholeWord: false,
  useRegex: false,
  searchInFilenames: true,
  
  includeArchived: false,
  searchDepth: 10,
  
  saveSearchHistory: true,
  maxSearchHistory: 20,
  recentSearches: [],
};

export const DEFAULT_EXPORT_PREFERENCES: ExportPreferences = {
  defaultFormat: 'markdown',
  
  pdfPageSize: 'A4',
  pdfMargins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  includeTableOfContents: true,
  
  htmlTheme: 'default',
  includeCSS: true,
  
  defaultExportPath: '',
  askForLocation: true,
};

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  enableAnalytics: false,
  enableCrashReporting: true,
  
  collectUsageStats: false,
  shareErrorReports: true,
  
  enableEncryption: false,
  lockAfterInactivity: false,
  inactivityTimeout: 15,
};

// Preference storage keys
export const PREFERENCE_KEYS = {
  APP: 'minglog-app-preferences',
  THEME: 'minglog-theme-preferences',
  LAYOUT: 'minglog-layout-preferences',
  FONT_SIZE: 'minglog-font-size-preferences',
  EDITOR: 'minglog-editor-preferences',
  SEARCH: 'minglog-search-preferences',
  EXPORT: 'minglog-export-preferences',
  PRIVACY: 'minglog-privacy-preferences',
  COMPLETE: 'minglog-user-preferences',
} as const;

// Preference validation schemas
export const preferenceValidators = {
  app: (prefs: Partial<AppPreferences>): PreferenceValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (prefs.autoSaveInterval && (prefs.autoSaveInterval < 5 || prefs.autoSaveInterval > 300)) {
      errors.push('自动保存间隔必须在5-300秒之间');
    }
    
    if (prefs.maxRecentFiles && (prefs.maxRecentFiles < 1 || prefs.maxRecentFiles > 50)) {
      errors.push('最近文件数量必须在1-50之间');
    }
    
    if (prefs.windowState) {
      if (prefs.windowState.width < 400 || prefs.windowState.height < 300) {
        errors.push('窗口尺寸过小');
      }
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  },
  
  editor: (prefs: Partial<EditorPreferences>): PreferenceValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (prefs.tabSize && (prefs.tabSize < 1 || prefs.tabSize > 8)) {
      errors.push('Tab大小必须在1-8之间');
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  },
  
  search: (prefs: Partial<SearchPreferences>): PreferenceValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (prefs.maxSearchHistory && (prefs.maxSearchHistory < 1 || prefs.maxSearchHistory > 100)) {
      errors.push('搜索历史数量必须在1-100之间');
    }
    
    if (prefs.searchDepth && (prefs.searchDepth < 1 || prefs.searchDepth > 50)) {
      errors.push('搜索深度必须在1-50之间');
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  },
  
  privacy: (prefs: Partial<PrivacyPreferences>): PreferenceValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (prefs.inactivityTimeout && (prefs.inactivityTimeout < 1 || prefs.inactivityTimeout > 120)) {
      errors.push('非活动超时必须在1-120分钟之间');
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  },
};
