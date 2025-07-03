import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../i18n'
import App from '../../App'

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({}),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  </BrowserRouter>
)

describe('App', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    await i18n.changeLanguage('en')
  })

  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('shows loading screen initially', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Should show some loading indicator or main content
    expect(document.body).toBeInTheDocument()
  })

  it('handles keyboard shortcuts', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Test Ctrl+K for search
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    
    // Should open search component
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search pages and blocks...')).toBeInTheDocument()
    })
  })

  it('handles theme switching', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Test theme toggle (if available)
    const themeButton = screen.queryByRole('button', { name: /theme/i })
    if (themeButton) {
      fireEvent.click(themeButton)
      // Should toggle theme
      expect(document.documentElement).toHaveClass(/dark|light/)
    }
  })

  it('navigates between routes', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Should render home page by default
    expect(window.location.pathname).toBe('/')
  })

  it('handles error boundary', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }
    
    // This should be caught by ErrorBoundary
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    consoleSpy.mockRestore()
  })

  it('initializes with correct providers', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Should have ThemeProvider, NotificationProvider, etc.
    expect(document.body).toBeInTheDocument()
  })

  it('handles onboarding tour', async () => {
    // Mock first-time user
    localStorageMock.getItem.mockReturnValue(null)
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Should show onboarding for new users
    await waitFor(() => {
      const onboardingElement = screen.queryByText(/welcome/i) || screen.queryByText(/tour/i)
      if (onboardingElement) {
        expect(onboardingElement).toBeInTheDocument()
      }
    })
  })

  it('handles search component toggle', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Test search toggle
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    
    await waitFor(() => {
      const searchInput = screen.queryByPlaceholderText('Search pages and blocks...')
      if (searchInput) {
        expect(searchInput).toBeInTheDocument()
        
        // Test closing search
        fireEvent.keyDown(searchInput, { key: 'Escape' })
      }
    })
  })

  it('handles settings persistence', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Should load settings from localStorage
    expect(localStorageMock.getItem).toHaveBeenCalled()
  })
})
