/**
 * Preference Storage Service
 * Handles persistence of user preferences across different storage backends
 */

import {
  UserPreferences,
  PreferenceCategory,
  PreferenceChangeEvent,
  PreferenceValidationResult,
  PREFERENCE_KEYS,
  preferenceValidators,
  DEFAULT_APP_PREFERENCES,
  DEFAULT_EDITOR_PREFERENCES,
  DEFAULT_SEARCH_PREFERENCES,
  DEFAULT_EXPORT_PREFERENCES,
  DEFAULT_PRIVACY_PREFERENCES,
} from '../types/preferences';
import { DEFAULT_LAYOUT_CONFIG } from '../types/layout';
import { FONT_SIZE_PRESETS } from '../hooks/useFontSize';

// Storage backend interface
export interface StorageBackend {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

// LocalStorage backend
export class LocalStorageBackend implements StorageBackend {
  async get(key: string): Promise<any> {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn(`Failed to get ${key} from localStorage:`, error);
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set ${key} in localStorage:`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      // Only clear MingLog-related keys
      const keys = Object.keys(localStorage);
      const minglogKeys = keys.filter(key => key.startsWith('minglog-'));
      minglogKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(key) !== null;
  }
}

// Electron Store backend (for desktop app)
export class ElectronStoreBackend implements StorageBackend {
  private store: any;

  constructor() {
    // This will be initialized when running in Electron
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      this.store = (window as any).electronAPI.store;
    }
  }

  async get(key: string): Promise<any> {
    if (!this.store) return null;
    try {
      return await this.store.get(key);
    } catch (error) {
      console.warn(`Failed to get ${key} from Electron store:`, error);
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    if (!this.store) throw new Error('Electron store not available');
    try {
      await this.store.set(key, value);
    } catch (error) {
      console.error(`Failed to set ${key} in Electron store:`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    if (!this.store) return;
    try {
      await this.store.delete(key);
    } catch (error) {
      console.warn(`Failed to remove ${key} from Electron store:`, error);
    }
  }

  async clear(): Promise<void> {
    if (!this.store) return;
    try {
      await this.store.clear();
    } catch (error) {
      console.error('Failed to clear Electron store:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.store) return false;
    try {
      return await this.store.has(key);
    } catch (error) {
      return false;
    }
  }
}

// Preference storage service
export class PreferenceStorage {
  private backend: StorageBackend;
  private listeners: Map<string, ((event: PreferenceChangeEvent) => void)[]> = new Map();
  private cache: Map<string, any> = new Map();

  constructor(backend?: StorageBackend) {
    // Auto-detect backend
    if (backend) {
      this.backend = backend;
    } else if (typeof window !== 'undefined' && (window as any).electronAPI) {
      this.backend = new ElectronStoreBackend();
    } else {
      this.backend = new LocalStorageBackend();
    }
  }

  // Get preference by category
  async getPreference<T>(category: PreferenceCategory): Promise<T | null> {
    const key = this.getCategoryKey(category);
    
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const value = await this.backend.get(key);
      if (value) {
        this.cache.set(key, value);
        return value;
      }
      
      // Return default if not found
      const defaultValue = this.getDefaultPreference(category);
      this.cache.set(key, defaultValue);
      return defaultValue;
    } catch (error) {
      console.error(`Failed to get ${category} preferences:`, error);
      return this.getDefaultPreference(category);
    }
  }

  // Set preference by category
  async setPreference<T>(
    category: PreferenceCategory, 
    value: T, 
    validate: boolean = true
  ): Promise<void> {
    if (validate) {
      const validation = this.validatePreference(category, value);
      if (!validation.isValid) {
        throw new Error(`Invalid ${category} preferences: ${validation.errors.join(', ')}`);
      }
    }

    const key = this.getCategoryKey(category);
    const oldValue = this.cache.get(key);

    try {
      await this.backend.set(key, value);
      this.cache.set(key, value);

      // Emit change event
      this.emitChange({
        category,
        key,
        oldValue,
        newValue: value,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Failed to set ${category} preferences:`, error);
      throw error;
    }
  }

  // Update specific preference field
  async updatePreference<T>(
    category: PreferenceCategory,
    updates: Partial<T>
  ): Promise<void> {
    const current = await this.getPreference<T>(category);
    const updated = { ...current, ...updates };
    await this.setPreference(category, updated);
  }

  // Get complete user preferences
  async getAllPreferences(): Promise<UserPreferences> {
    const [app, theme, layout, fontSize, editor, search, exportPrefs, privacy] = await Promise.all([
      this.getPreference('app'),
      this.getPreference('theme'),
      this.getPreference('layout'),
      this.getPreference('fontSize'),
      this.getPreference('editor'),
      this.getPreference('search'),
      this.getPreference('export'),
      this.getPreference('privacy'),
    ]);

    return {
      app: app || DEFAULT_APP_PREFERENCES,
      theme: theme || { mode: 'system', fontSize: 14 },
      layout: layout || DEFAULT_LAYOUT_CONFIG,
      fontSize: fontSize || FONT_SIZE_PRESETS[1].config,
      editor: editor || DEFAULT_EDITOR_PREFERENCES,
      search: search || DEFAULT_SEARCH_PREFERENCES,
      export: exportPrefs || DEFAULT_EXPORT_PREFERENCES,
      privacy: privacy || DEFAULT_PRIVACY_PREFERENCES,
      version: '1.0.0',
      lastModified: new Date().toISOString(),
      deviceId: this.getDeviceId(),
    };
  }

  // Set complete user preferences
  async setAllPreferences(preferences: UserPreferences): Promise<void> {
    const categories: PreferenceCategory[] = [
      'app', 'theme', 'layout', 'fontSize', 
      'editor', 'search', 'export', 'privacy'
    ];

    await Promise.all(
      categories.map(category => 
        this.setPreference(category, preferences[category], false)
      )
    );
  }

  // Export preferences to JSON
  async exportPreferences(): Promise<string> {
    const preferences = await this.getAllPreferences();
    return JSON.stringify(preferences, null, 2);
  }

  // Import preferences from JSON
  async importPreferences(json: string): Promise<void> {
    try {
      const preferences = JSON.parse(json) as UserPreferences;
      
      // Validate each category
      const categories: PreferenceCategory[] = [
        'app', 'theme', 'layout', 'fontSize', 
        'editor', 'search', 'export', 'privacy'
      ];

      for (const category of categories) {
        if (preferences[category]) {
          const validation = this.validatePreference(category, preferences[category]);
          if (!validation.isValid) {
            throw new Error(`Invalid ${category} preferences: ${validation.errors.join(', ')}`);
          }
        }
      }

      await this.setAllPreferences(preferences);
    } catch (error) {
      console.error('Failed to import preferences:', error);
      throw new Error('Invalid preferences format');
    }
  }

  // Reset preferences to defaults
  async resetPreferences(categories?: PreferenceCategory[]): Promise<void> {
    const categoriesToReset = categories || [
      'app', 'theme', 'layout', 'fontSize', 
      'editor', 'search', 'export', 'privacy'
    ];

    await Promise.all(
      categoriesToReset.map(category => {
        const defaultValue = this.getDefaultPreference(category);
        return this.setPreference(category, defaultValue, false);
      })
    );
  }

  // Clear all preferences
  async clearPreferences(): Promise<void> {
    try {
      await this.backend.clear();
      this.cache.clear();
    } catch (error) {
      console.error('Failed to clear preferences:', error);
      throw error;
    }
  }

  // Add change listener
  addChangeListener(
    category: PreferenceCategory | 'all',
    listener: (event: PreferenceChangeEvent) => void
  ): void {
    const key = category;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(listener);
  }

  // Remove change listener
  removeChangeListener(
    category: PreferenceCategory | 'all',
    listener: (event: PreferenceChangeEvent) => void
  ): void {
    const key = category;
    const listeners = this.listeners.get(key);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Private methods
  private getCategoryKey(category: PreferenceCategory): string {
    const keyMap: Record<PreferenceCategory, string> = {
      app: PREFERENCE_KEYS.APP,
      theme: PREFERENCE_KEYS.THEME,
      layout: PREFERENCE_KEYS.LAYOUT,
      fontSize: PREFERENCE_KEYS.FONT_SIZE,
      editor: PREFERENCE_KEYS.EDITOR,
      search: PREFERENCE_KEYS.SEARCH,
      export: PREFERENCE_KEYS.EXPORT,
      privacy: PREFERENCE_KEYS.PRIVACY,
    };
    return keyMap[category];
  }

  private getDefaultPreference(category: PreferenceCategory): any {
    const defaults = {
      app: DEFAULT_APP_PREFERENCES,
      theme: { mode: 'system' as const, fontSize: 14 },
      layout: DEFAULT_LAYOUT_CONFIG,
      fontSize: FONT_SIZE_PRESETS[1].config,
      editor: DEFAULT_EDITOR_PREFERENCES,
      search: DEFAULT_SEARCH_PREFERENCES,
      export: DEFAULT_EXPORT_PREFERENCES,
      privacy: DEFAULT_PRIVACY_PREFERENCES,
    };
    return defaults[category];
  }

  private validatePreference(category: PreferenceCategory, value: any): PreferenceValidationResult {
    const validator = preferenceValidators[category as keyof typeof preferenceValidators];
    if (validator) {
      return validator(value);
    }
    return { isValid: true, errors: [], warnings: [] };
  }

  private emitChange(event: PreferenceChangeEvent): void {
    // Emit to category-specific listeners
    const categoryListeners = this.listeners.get(event.category);
    if (categoryListeners) {
      categoryListeners.forEach(listener => listener(event));
    }

    // Emit to global listeners
    const globalListeners = this.listeners.get('all');
    if (globalListeners) {
      globalListeners.forEach(listener => listener(event));
    }
  }

  private getDeviceId(): string {
    // Generate or retrieve device ID
    const stored = localStorage.getItem('minglog-device-id');
    if (stored) return stored;

    const deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('minglog-device-id', deviceId);
    return deviceId;
  }
}

// Create storage instance based on environment
export const createPreferenceStorage = (backend?: StorageBackend): PreferenceStorage => {
  return new PreferenceStorage(backend);
};

// Singleton instance
export const preferenceStorage = new PreferenceStorage();
