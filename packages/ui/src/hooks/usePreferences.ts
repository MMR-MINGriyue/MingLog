/**
 * Preferences Hook
 * React hook for managing user preferences
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserPreferences,
  PreferenceCategory,
  PreferenceChangeEvent,
  AppPreferences,
  EditorPreferences,
  SearchPreferences,
  ExportPreferences,
  PrivacyPreferences,
} from '../types/preferences';
import { UserThemePreferences } from '../theme/types';
import { LayoutConfig } from '../types/layout';
import { FontSizeConfig } from './useFontSize';
import { preferenceStorage } from '../services/PreferenceStorage';

// Hook options
export interface UsePreferencesOptions {
  autoSave?: boolean;
  debounceMs?: number;
  onError?: (error: Error) => void;
}

// Hook return type
export interface UsePreferencesReturn {
  // Preferences state
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: Error | null;
  
  // Category getters
  app: AppPreferences | null;
  theme: UserThemePreferences | null;
  layout: LayoutConfig | null;
  fontSize: FontSizeConfig | null;
  editor: EditorPreferences | null;
  search: SearchPreferences | null;
  export: ExportPreferences | null;
  privacy: PrivacyPreferences | null;
  
  // Update functions
  updateApp: (updates: Partial<AppPreferences>) => Promise<void>;
  updateTheme: (updates: Partial<UserThemePreferences>) => Promise<void>;
  updateLayout: (updates: Partial<LayoutConfig>) => Promise<void>;
  updateFontSize: (updates: Partial<FontSizeConfig>) => Promise<void>;
  updateEditor: (updates: Partial<EditorPreferences>) => Promise<void>;
  updateSearch: (updates: Partial<SearchPreferences>) => Promise<void>;
  updateExport: (updates: Partial<ExportPreferences>) => Promise<void>;
  updatePrivacy: (updates: Partial<PrivacyPreferences>) => Promise<void>;
  
  // Utility functions
  resetCategory: (category: PreferenceCategory) => Promise<void>;
  resetAll: () => Promise<void>;
  exportPreferences: () => Promise<string>;
  importPreferences: (json: string) => Promise<void>;
  
  // Change listeners
  addChangeListener: (category: PreferenceCategory | 'all', listener: (event: PreferenceChangeEvent) => void) => void;
  removeChangeListener: (category: PreferenceCategory | 'all', listener: (event: PreferenceChangeEvent) => void) => void;
}

export const usePreferences = (options: UsePreferencesOptions = {}): UsePreferencesReturn => {
  const {
    autoSave = true,
    debounceMs = 300,
    onError,
  } = options;

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const mounted = useRef(true);

  // Load initial preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const prefs = await preferenceStorage.getAllPreferences();
        if (mounted.current) {
          setPreferences(prefs);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load preferences');
        if (mounted.current) {
          setError(error);
          onError?.(error);
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    loadPreferences();

    return () => {
      mounted.current = false;
    };
  }, [onError]);

  // Debounced update function
  const debouncedUpdate = useCallback(
    async <T>(category: PreferenceCategory, updates: Partial<T>) => {
      const key = category;
      
      // Clear existing timer
      const existingTimer = debounceTimers.current.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        try {
          await preferenceStorage.updatePreference(category, updates);
          
          // Reload preferences to get the updated state
          const updatedPrefs = await preferenceStorage.getAllPreferences();
          if (mounted.current) {
            setPreferences(updatedPrefs);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(`Failed to update ${category} preferences`);
          if (mounted.current) {
            setError(error);
            onError?.(error);
          }
        }
        
        debounceTimers.current.delete(key);
      }, debounceMs);

      debounceTimers.current.set(key, timer);
    },
    [debounceMs, onError]
  );

  // Update functions for each category
  const updateApp = useCallback(async (updates: Partial<AppPreferences>) => {
    if (autoSave) {
      await debouncedUpdate('app', updates);
    } else {
      // Update local state immediately
      setPreferences(prev => prev ? {
        ...prev,
        app: { ...prev.app, ...updates }
      } : null);
    }
  }, [autoSave, debouncedUpdate]);

  const updateTheme = useCallback(async (updates: Partial<UserThemePreferences>) => {
    if (autoSave) {
      await debouncedUpdate('theme', updates);
    } else {
      setPreferences(prev => prev ? {
        ...prev,
        theme: { ...prev.theme, ...updates }
      } : null);
    }
  }, [autoSave, debouncedUpdate]);

  const updateLayout = useCallback(async (updates: Partial<LayoutConfig>) => {
    if (autoSave) {
      await debouncedUpdate('layout', updates);
    } else {
      setPreferences(prev => prev ? {
        ...prev,
        layout: { ...prev.layout, ...updates }
      } : null);
    }
  }, [autoSave, debouncedUpdate]);

  const updateFontSize = useCallback(async (updates: Partial<FontSizeConfig>) => {
    if (autoSave) {
      await debouncedUpdate('fontSize', updates);
    } else {
      setPreferences(prev => prev ? {
        ...prev,
        fontSize: { ...prev.fontSize, ...updates }
      } : null);
    }
  }, [autoSave, debouncedUpdate]);

  const updateEditor = useCallback(async (updates: Partial<EditorPreferences>) => {
    if (autoSave) {
      await debouncedUpdate('editor', updates);
    } else {
      setPreferences(prev => prev ? {
        ...prev,
        editor: { ...prev.editor, ...updates }
      } : null);
    }
  }, [autoSave, debouncedUpdate]);

  const updateSearch = useCallback(async (updates: Partial<SearchPreferences>) => {
    if (autoSave) {
      await debouncedUpdate('search', updates);
    } else {
      setPreferences(prev => prev ? {
        ...prev,
        search: { ...prev.search, ...updates }
      } : null);
    }
  }, [autoSave, debouncedUpdate]);

  const updateExport = useCallback(async (updates: Partial<ExportPreferences>) => {
    if (autoSave) {
      await debouncedUpdate('export', updates);
    } else {
      setPreferences(prev => prev ? {
        ...prev,
        export: { ...prev.export, ...updates }
      } : null);
    }
  }, [autoSave, debouncedUpdate]);

  const updatePrivacy = useCallback(async (updates: Partial<PrivacyPreferences>) => {
    if (autoSave) {
      await debouncedUpdate('privacy', updates);
    } else {
      setPreferences(prev => prev ? {
        ...prev,
        privacy: { ...prev.privacy, ...updates }
      } : null);
    }
  }, [autoSave, debouncedUpdate]);

  // Reset functions
  const resetCategory = useCallback(async (category: PreferenceCategory) => {
    try {
      await preferenceStorage.resetPreferences([category]);
      const updatedPrefs = await preferenceStorage.getAllPreferences();
      if (mounted.current) {
        setPreferences(updatedPrefs);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Failed to reset ${category} preferences`);
      setError(error);
      onError?.(error);
    }
  }, [onError]);

  const resetAll = useCallback(async () => {
    try {
      await preferenceStorage.resetPreferences();
      const updatedPrefs = await preferenceStorage.getAllPreferences();
      if (mounted.current) {
        setPreferences(updatedPrefs);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to reset all preferences');
      setError(error);
      onError?.(error);
    }
  }, [onError]);

  // Import/Export functions
  const exportPreferences = useCallback(async (): Promise<string> => {
    try {
      return await preferenceStorage.exportPreferences();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to export preferences');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  const importPreferences = useCallback(async (json: string) => {
    try {
      await preferenceStorage.importPreferences(json);
      const updatedPrefs = await preferenceStorage.getAllPreferences();
      if (mounted.current) {
        setPreferences(updatedPrefs);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to import preferences');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [onError]);

  // Change listeners
  const addChangeListener = useCallback(
    (category: PreferenceCategory | 'all', listener: (event: PreferenceChangeEvent) => void) => {
      preferenceStorage.addChangeListener(category, listener);
    },
    []
  );

  const removeChangeListener = useCallback(
    (category: PreferenceCategory | 'all', listener: (event: PreferenceChangeEvent) => void) => {
      preferenceStorage.removeChangeListener(category, listener);
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all debounce timers
      debounceTimers.current.forEach(timer => clearTimeout(timer));
      debounceTimers.current.clear();
    };
  }, []);

  return {
    // State
    preferences,
    isLoading,
    error,
    
    // Category getters
    app: preferences?.app || null,
    theme: preferences?.theme || null,
    layout: preferences?.layout || null,
    fontSize: preferences?.fontSize || null,
    editor: preferences?.editor || null,
    search: preferences?.search || null,
    export: preferences?.export || null,
    privacy: preferences?.privacy || null,
    
    // Update functions
    updateApp,
    updateTheme,
    updateLayout,
    updateFontSize,
    updateEditor,
    updateSearch,
    updateExport,
    updatePrivacy,
    
    // Utility functions
    resetCategory,
    resetAll,
    exportPreferences,
    importPreferences,
    
    // Change listeners
    addChangeListener,
    removeChangeListener,
  };
};
