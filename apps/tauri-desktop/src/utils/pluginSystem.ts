/**
 * Plugin System - Extensible architecture for MingLog Desktop
 * 
 * This module provides the foundation for a plugin system that allows
 * third-party developers to extend MingLog's functionality.
 */

import { Note, Tag } from './tauri'

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  homepage?: string
  repository?: string
  license: string
  keywords: string[]
  engines: {
    minglog: string
  }
  main: string
  permissions: PluginPermission[]
  dependencies?: Record<string, string>
}

export type PluginPermission = 
  | 'read:notes'
  | 'write:notes'
  | 'read:tags'
  | 'write:tags'
  | 'read:settings'
  | 'write:settings'
  | 'ui:sidebar'
  | 'ui:toolbar'
  | 'ui:menu'
  | 'ui:modal'
  | 'network:http'
  | 'filesystem:read'
  | 'filesystem:write'
  | 'notifications'

export interface PluginAPI {
  // Core data access
  notes: {
    getAll(): Promise<Note[]>
    getById(id: string): Promise<Note | null>
    create(note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note>
    update(id: string, updates: Partial<Note>): Promise<Note>
    delete(id: string): Promise<void>
    search(query: string): Promise<Note[]>
  }
  
  tags: {
    getAll(): Promise<Tag[]>
    getById(id: string): Promise<Tag | null>
    create(tag: Omit<Tag, 'id' | 'created_at'>): Promise<Tag>
    update(id: string, updates: Partial<Tag>): Promise<Tag>
    delete(id: string): Promise<void>
  }

  settings: {
    get(key: string): Promise<string | null>
    set(key: string, value: string): Promise<void>
    delete(key: string): Promise<void>
    getAll(): Promise<Record<string, string>>
  }

  // UI extensions
  ui: {
    addSidebarItem(item: SidebarItem): void
    removeSidebarItem(id: string): void
    addToolbarButton(button: ToolbarButton): void
    removeToolbarButton(id: string): void
    addMenuItem(menu: MenuItem): void
    removeMenuItem(id: string): void
    showModal(modal: ModalConfig): Promise<any>
    showNotification(notification: NotificationConfig): void
  }

  // Utilities
  utils: {
    generateId(): string
    formatDate(date: Date): string
    parseMarkdown(content: string): string
    renderMarkdown(content: string): string
    exportData(format: 'json' | 'markdown' | 'html'): Promise<string>
    importData(data: string, format: 'json' | 'markdown'): Promise<void>
  }

  // Events
  events: {
    on(event: PluginEvent, handler: PluginEventHandler): void
    off(event: PluginEvent, handler: PluginEventHandler): void
    emit(event: string, data?: any): void
  }
}

export interface SidebarItem {
  id: string
  label: string
  icon?: string
  onClick: () => void
  order?: number
}

export interface ToolbarButton {
  id: string
  label: string
  icon?: string
  onClick: () => void
  order?: number
  tooltip?: string
}

export interface MenuItem {
  id: string
  label: string
  submenu?: MenuItem[]
  onClick?: () => void
  separator?: boolean
  order?: number
}

export interface ModalConfig {
  title: string
  content: React.ReactNode | string
  width?: number
  height?: number
  buttons?: ModalButton[]
}

export interface ModalButton {
  label: string
  variant: 'primary' | 'secondary' | 'danger'
  onClick: () => void | Promise<void>
}

export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export type PluginEvent = 
  | 'note:created'
  | 'note:updated'
  | 'note:deleted'
  | 'tag:created'
  | 'tag:updated'
  | 'tag:deleted'
  | 'app:ready'
  | 'app:shutdown'
  | 'search:performed'
  | 'settings:changed'

export type PluginEventHandler = (data: any) => void

export interface Plugin {
  manifest: PluginManifest
  activate(api: PluginAPI): Promise<void> | void
  deactivate(): Promise<void> | void
}

export interface PluginContext {
  plugin: Plugin
  api: PluginAPI
  isActive: boolean
  error?: string
}

class PluginManager {
  private plugins: Map<string, PluginContext> = new Map()
  private api: PluginAPI
  private eventHandlers: Map<string, PluginEventHandler[]> = new Map()

  constructor() {
    this.api = this.createPluginAPI()
  }

  private createPluginAPI(): PluginAPI {
    return {
      notes: {
        getAll: async () => {
          // Implementation would call actual note service
          return []
        },
        getById: async (id: string) => {
          // Implementation would call actual note service
          return null
        },
        create: async (note) => {
          // Implementation would call actual note service
          throw new Error('Not implemented')
        },
        update: async (id, updates) => {
          // Implementation would call actual note service
          throw new Error('Not implemented')
        },
        delete: async (id) => {
          // Implementation would call actual note service
          throw new Error('Not implemented')
        },
        search: async (query) => {
          // Implementation would call actual search service
          return []
        }
      },
      tags: {
        getAll: async () => [],
        getById: async (id) => null,
        create: async (tag) => { throw new Error('Not implemented') },
        update: async (id, updates) => { throw new Error('Not implemented') },
        delete: async (id) => { throw new Error('Not implemented') }
      },
      settings: {
        get: async (key) => null,
        set: async (key, value) => {},
        delete: async (key) => {},
        getAll: async () => ({})
      },
      ui: {
        addSidebarItem: (item) => {
          console.log('Adding sidebar item:', item)
        },
        removeSidebarItem: (id) => {
          console.log('Removing sidebar item:', id)
        },
        addToolbarButton: (button) => {
          console.log('Adding toolbar button:', button)
        },
        removeToolbarButton: (id) => {
          console.log('Removing toolbar button:', id)
        },
        addMenuItem: (menu) => {
          console.log('Adding menu item:', menu)
        },
        removeMenuItem: (id) => {
          console.log('Removing menu item:', id)
        },
        showModal: async (modal) => {
          console.log('Showing modal:', modal)
          return null
        },
        showNotification: (notification) => {
          console.log('Showing notification:', notification)
        }
      },
      utils: {
        generateId: () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        formatDate: (date) => date.toLocaleDateString(),
        parseMarkdown: (content) => content,
        renderMarkdown: (content) => content,
        exportData: async (format) => '',
        importData: async (data, format) => {}
      },
      events: {
        on: (event, handler) => {
          if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, [])
          }
          this.eventHandlers.get(event)!.push(handler)
        },
        off: (event, handler) => {
          const handlers = this.eventHandlers.get(event)
          if (handlers) {
            const index = handlers.indexOf(handler)
            if (index > -1) {
              handlers.splice(index, 1)
            }
          }
        },
        emit: (event, data) => {
          const handlers = this.eventHandlers.get(event)
          if (handlers) {
            handlers.forEach(handler => handler(data))
          }
        }
      }
    }
  }

  async loadPlugin(plugin: Plugin): Promise<boolean> {
    try {
      // Validate plugin manifest
      if (!this.validateManifest(plugin.manifest)) {
        throw new Error('Invalid plugin manifest')
      }

      // Check if plugin already exists
      if (this.plugins.has(plugin.manifest.id)) {
        throw new Error('Plugin already loaded')
      }

      // Create plugin context
      const context: PluginContext = {
        plugin,
        api: this.api,
        isActive: false
      }

      // Add to plugins map
      this.plugins.set(plugin.manifest.id, context)

      // Activate plugin
      await this.activatePlugin(plugin.manifest.id)

      return true
    } catch (error) {
      console.error('Failed to load plugin:', error)
      return false
    }
  }

  async activatePlugin(pluginId: string): Promise<boolean> {
    const context = this.plugins.get(pluginId)
    if (!context) {
      return false
    }

    try {
      await context.plugin.activate(this.api)
      context.isActive = true
      context.error = undefined
      
      // Emit activation event
      this.api.events.emit('plugin:activated', { pluginId })
      
      return true
    } catch (error) {
      context.error = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Failed to activate plugin ${pluginId}:`, error)
      return false
    }
  }

  async deactivatePlugin(pluginId: string): Promise<boolean> {
    const context = this.plugins.get(pluginId)
    if (!context || !context.isActive) {
      return false
    }

    try {
      await context.plugin.deactivate()
      context.isActive = false
      context.error = undefined
      
      // Emit deactivation event
      this.api.events.emit('plugin:deactivated', { pluginId })
      
      return true
    } catch (error) {
      context.error = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Failed to deactivate plugin ${pluginId}:`, error)
      return false
    }
  }

  unloadPlugin(pluginId: string): boolean {
    const context = this.plugins.get(pluginId)
    if (!context) {
      return false
    }

    // Deactivate if active
    if (context.isActive) {
      this.deactivatePlugin(pluginId)
    }

    // Remove from plugins map
    this.plugins.delete(pluginId)
    
    return true
  }

  getLoadedPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(context => context.plugin.manifest)
  }

  getPluginContext(pluginId: string): PluginContext | undefined {
    return this.plugins.get(pluginId)
  }

  private validateManifest(manifest: PluginManifest): boolean {
    const required = ['id', 'name', 'version', 'description', 'author', 'license', 'main']
    return required.every(field => manifest[field as keyof PluginManifest])
  }

  // Event system
  emitEvent(event: PluginEvent, data?: any) {
    this.api.events.emit(event, data)
  }
}

// Singleton instance
let pluginManagerInstance: PluginManager | null = null

export const getPluginManager = (): PluginManager => {
  if (!pluginManagerInstance) {
    pluginManagerInstance = new PluginManager()
  }
  return pluginManagerInstance
}

export default PluginManager
