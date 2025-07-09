// Production environment configuration for MingLog

export interface ProductionConfig {
  // Application settings
  app: {
    name: string
    version: string
    buildNumber: string
    environment: 'production'
    debug: boolean
  }

  // Performance settings
  performance: {
    enableMonitoring: boolean
    monitoringInterval: number
    maxHistoryEntries: number
    enableVirtualization: boolean
    lazyLoadComponents: boolean
    enableMemoryOptimization: boolean
  }

  // Error tracking settings
  errorTracking: {
    enabled: boolean
    maxErrors: number
    maxPerformanceMetrics: number
    sendToExternalService: boolean
    logLevel: 'error' | 'warn' | 'info' | 'debug'
  }

  // Cache settings
  cache: {
    enabled: boolean
    maxSize: number
    maxMemoryMB: number
    ttl: number // Time to live in milliseconds
    enablePersistence: boolean
  }

  // Search settings
  search: {
    maxResults: number
    debounceDelay: number
    enableVirtualization: boolean
    cacheResults: boolean
    maxContentLength: number
    maxExcerptLength: number
  }

  // UI settings
  ui: {
    enableAnimations: boolean
    enableTransitions: boolean
    enableDarkMode: boolean
    enableAccessibility: boolean
    enableKeyboardShortcuts: boolean
    enableTooltips: boolean
  }

  // Security settings
  security: {
    enableCSP: boolean
    enableSRI: boolean
    enableHTTPS: boolean
    enableSecureHeaders: boolean
  }

  // Analytics settings
  analytics: {
    enabled: boolean
    trackPageViews: boolean
    trackUserInteractions: boolean
    trackPerformance: boolean
    trackErrors: boolean
  }
}

export const productionConfig: ProductionConfig = {
  app: {
    name: 'MingLog',
    version: process.env.REACT_APP_VERSION || '1.0.0',
    buildNumber: process.env.REACT_APP_BUILD_NUMBER || 'unknown',
    environment: 'production',
    debug: false
  },

  performance: {
    enableMonitoring: true,
    monitoringInterval: 5000, // 5 seconds in production
    maxHistoryEntries: 20,
    enableVirtualization: true,
    lazyLoadComponents: true,
    enableMemoryOptimization: true
  },

  errorTracking: {
    enabled: true,
    maxErrors: 100,
    maxPerformanceMetrics: 200,
    sendToExternalService: true,
    logLevel: 'error'
  },

  cache: {
    enabled: true,
    maxSize: 100,
    maxMemoryMB: 10,
    ttl: 300000, // 5 minutes
    enablePersistence: true
  },

  search: {
    maxResults: 100,
    debounceDelay: 300,
    enableVirtualization: true,
    cacheResults: true,
    maxContentLength: 500,
    maxExcerptLength: 200
  },

  ui: {
    enableAnimations: true,
    enableTransitions: true,
    enableDarkMode: true,
    enableAccessibility: true,
    enableKeyboardShortcuts: true,
    enableTooltips: true
  },

  security: {
    enableCSP: true,
    enableSRI: true,
    enableHTTPS: true,
    enableSecureHeaders: true
  },

  analytics: {
    enabled: true,
    trackPageViews: true,
    trackUserInteractions: false, // Privacy-focused
    trackPerformance: true,
    trackErrors: true
  }
}

// Development configuration (for comparison)
export const developmentConfig: ProductionConfig = {
  ...productionConfig,
  app: {
    ...productionConfig.app,
    environment: 'production', // Keep as production for type safety
    debug: true
  },
  performance: {
    ...productionConfig.performance,
    monitoringInterval: 2000, // More frequent in development
    enableMonitoring: true
  },
  errorTracking: {
    ...productionConfig.errorTracking,
    logLevel: 'debug',
    sendToExternalService: false
  },
  analytics: {
    ...productionConfig.analytics,
    enabled: false // Disable analytics in development
  }
}

// Get configuration based on environment
export const getConfig = (): ProductionConfig => {
  const env = process.env.NODE_ENV
  
  switch (env) {
    case 'production':
      return productionConfig
    case 'development':
      return developmentConfig
    default:
      return developmentConfig
  }
}

// Configuration validation
export const validateConfig = (config: ProductionConfig): boolean => {
  try {
    // Validate required fields
    if (!config.app.name || !config.app.version) {
      console.error('Invalid config: Missing app name or version')
      return false
    }

    // Validate performance settings
    if (config.performance.monitoringInterval < 1000) {
      console.warn('Performance monitoring interval is very low, may impact performance')
    }

    // Validate cache settings
    if (config.cache.maxMemoryMB > 50) {
      console.warn('Cache memory limit is very high, may impact performance')
    }

    // Validate search settings
    if (config.search.maxResults > 1000) {
      console.warn('Search max results is very high, may impact performance')
    }

    return true
  } catch (error) {
    console.error('Config validation failed:', error)
    return false
  }
}

// Feature flags based on configuration
export const createFeatureFlags = (config: ProductionConfig) => ({
  // Performance features
  isPerformanceMonitoringEnabled: config.performance.enableMonitoring,
  isVirtualizationEnabled: config.performance.enableVirtualization,
  isLazyLoadingEnabled: config.performance.lazyLoadComponents,
  isMemoryOptimizationEnabled: config.performance.enableMemoryOptimization,

  // UI features
  areAnimationsEnabled: config.ui.enableAnimations,
  areTransitionsEnabled: config.ui.enableTransitions,
  isDarkModeEnabled: config.ui.enableDarkMode,
  isAccessibilityEnabled: config.ui.enableAccessibility,
  areKeyboardShortcutsEnabled: config.ui.enableKeyboardShortcuts,
  areTooltipsEnabled: config.ui.enableTooltips,

  // Search features
  isSearchCacheEnabled: config.search.cacheResults,
  isSearchVirtualizationEnabled: config.search.enableVirtualization,

  // Error tracking features
  isErrorTrackingEnabled: config.errorTracking.enabled,
  shouldSendErrorsToExternalService: config.errorTracking.sendToExternalService,

  // Analytics features
  isAnalyticsEnabled: config.analytics.enabled,
  shouldTrackPageViews: config.analytics.trackPageViews,
  shouldTrackUserInteractions: config.analytics.trackUserInteractions,
  shouldTrackPerformance: config.analytics.trackPerformance,
  shouldTrackErrors: config.analytics.trackErrors,

  // Security features
  isCSPEnabled: config.security.enableCSP,
  isSRIEnabled: config.security.enableSRI,
  isHTTPSEnabled: config.security.enableHTTPS,
  areSecureHeadersEnabled: config.security.enableSecureHeaders
})

// Export current configuration and feature flags
export const currentConfig = getConfig()
export const featureFlags = createFeatureFlags(currentConfig)

// Validate configuration on import
if (!validateConfig(currentConfig)) {
  console.error('Invalid configuration detected, using fallback settings')
}

// Configuration change listener (for runtime updates)
export const createConfigListener = () => {
  const listeners: ((config: ProductionConfig) => void)[] = []

  const addListener = (listener: (config: ProductionConfig) => void) => {
    listeners.push(listener)
  }

  const removeListener = (listener: (config: ProductionConfig) => void) => {
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  const notifyListeners = (config: ProductionConfig) => {
    listeners.forEach(listener => {
      try {
        listener(config)
      } catch (error) {
        console.error('Config listener failed:', error)
      }
    })
  }

  return { addListener, removeListener, notifyListeners }
}

export const configListener = createConfigListener()

export default currentConfig
