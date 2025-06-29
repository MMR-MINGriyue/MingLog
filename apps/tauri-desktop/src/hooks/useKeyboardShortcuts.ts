import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
  global?: boolean // Whether the shortcut works globally or only when focused
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return
    }

    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey
      const altMatches = !!shortcut.altKey === event.altKey
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey
      const metaMatches = !!shortcut.metaKey === event.metaKey

      if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
        event.preventDefault()
        event.stopPropagation()
        shortcut.action()
        break
      }
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

// Global shortcuts hook for the entire application
export const useGlobalShortcuts = () => {
  const navigate = useNavigate()

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrlKey: true,
      action: () => navigate('/editor/new'),
      description: 'Create new note',
      global: true
    },
    {
      key: 'f',
      ctrlKey: true,
      action: () => navigate('/search'),
      description: 'Search notes',
      global: true
    },
    {
      key: 'h',
      ctrlKey: true,
      action: () => navigate('/'),
      description: 'Go to home',
      global: true
    },
    {
      key: 'g',
      ctrlKey: true,
      action: () => navigate('/graph'),
      description: 'Open knowledge graph',
      global: true
    },
    {
      key: ',',
      ctrlKey: true,
      action: () => navigate('/settings'),
      description: 'Open settings',
      global: true
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modals or overlays
        const event = new CustomEvent('close-modals')
        document.dispatchEvent(event)
      },
      description: 'Close modals/overlays',
      global: true
    }
  ]

  useKeyboardShortcuts({ shortcuts, enabled: true })

  return shortcuts
}

// Editor-specific shortcuts
export const useEditorShortcuts = (callbacks: {
  onSave?: () => void
  onBold?: () => void
  onItalic?: () => void
  onUnderline?: () => void
  onCode?: () => void
  onLink?: () => void
}) => {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 's',
      ctrlKey: true,
      action: () => callbacks.onSave?.(),
      description: 'Save note'
    },
    {
      key: 'b',
      ctrlKey: true,
      action: () => callbacks.onBold?.(),
      description: 'Bold text'
    },
    {
      key: 'i',
      ctrlKey: true,
      action: () => callbacks.onItalic?.(),
      description: 'Italic text'
    },
    {
      key: 'u',
      ctrlKey: true,
      action: () => callbacks.onUnderline?.(),
      description: 'Underline text'
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => callbacks.onLink?.(),
      description: 'Insert link'
    },
    {
      key: '`',
      ctrlKey: true,
      action: () => callbacks.onCode?.(),
      description: 'Code block'
    }
  ]

  useKeyboardShortcuts({ shortcuts })

  return shortcuts
}

// Search-specific shortcuts
export const useSearchShortcuts = (callbacks: {
  onFocus?: () => void
  onClear?: () => void
  onToggleFilters?: () => void
}) => {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      action: () => callbacks.onFocus?.(),
      description: 'Focus search input'
    },
    {
      key: 'Escape',
      action: () => callbacks.onClear?.(),
      description: 'Clear search'
    },
    {
      key: 'f',
      altKey: true,
      action: () => callbacks.onToggleFilters?.(),
      description: 'Toggle filters'
    }
  ]

  useKeyboardShortcuts({ shortcuts })

  return shortcuts
}

// Utility function to format shortcut display
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = []
  
  if (shortcut.ctrlKey) parts.push('Ctrl')
  if (shortcut.altKey) parts.push('Alt')
  if (shortcut.shiftKey) parts.push('Shift')
  if (shortcut.metaKey) parts.push('Cmd')
  
  parts.push(shortcut.key.toUpperCase())
  
  return parts.join(' + ')
}

// Component to display keyboard shortcuts help
export const getShortcutHelp = (shortcuts: KeyboardShortcut[]) => {
  return shortcuts.map(shortcut => ({
    keys: formatShortcut(shortcut),
    description: shortcut.description
  }))
}
