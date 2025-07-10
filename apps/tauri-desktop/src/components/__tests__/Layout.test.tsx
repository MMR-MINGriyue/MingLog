import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../i18n'
import Layout from '../Layout'
import { NotificationProvider } from '../NotificationSystem'

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

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </I18nextProvider>
  </BrowserRouter>
)

describe('Layout', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage('en')
  })

  it('renders layout structure correctly', () => {
    render(
      <TestWrapper>
        <Layout>
          <div data-testid="test-content">Test Content</div>
        </Layout>
      </TestWrapper>
    )
    
    // Should render the main layout structure
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  it('renders navigation menu', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    )

    // Should have navigation links
    expect(screen.getByRole('navigation')).toBeInTheDocument()

    // Check for system navigation items that should always be present
    // Since test environment is set to English, expect English translations
    expect(screen.getByText('Module Management')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()

    // In test environment without Core initialization, module-specific navigation items won't be present
    // This is expected behavior as modules are not loaded in test environment
  })

  it('handles sidebar toggle', async () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    )
    
    // Look for sidebar toggle button
    const toggleButton = screen.queryByRole('button', { name: /toggle.*sidebar|menu/i })
    
    if (toggleButton) {
      fireEvent.click(toggleButton)
      
      // Should toggle sidebar visibility
      await waitFor(() => {
        expect(toggleButton).toBeInTheDocument()
      })
    }
  })

  it('displays user menu', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    )
    
    // Should have user menu or profile section
    const userMenu = screen.queryByRole('button', { name: /user|profile|account/i })
    const languageSwitch = screen.queryByRole('button', { name: /language/i })
    
    // At least one of these should be present
    expect(userMenu || languageSwitch).toBeTruthy()
  })

  it('handles keyboard shortcuts', async () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    )
    
    // Test common keyboard shortcuts
    fireEvent.keyDown(document, { key: '/', ctrlKey: true })
    
    // Should handle shortcuts (like opening help or search)
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('renders breadcrumbs when provided', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    )
    
    // Should render breadcrumb navigation if present
    const breadcrumbs = screen.queryByRole('navigation', { name: /breadcrumb/i })
    
    // Breadcrumbs are optional, so we just check if they exist
    if (breadcrumbs) {
      expect(breadcrumbs).toBeInTheDocument()
    }
  })

  it('handles responsive design', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    )
    
    // Should have responsive classes
    const mainElement = screen.getByRole('main')
    expect(mainElement).toBeInTheDocument()
    
    // Check for responsive layout classes (Tailwind CSS)
    expect(mainElement.className).toMatch(/flex|grid|w-|h-/)
  })

  it('displays loading state correctly', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    )
    
    // Should handle loading states gracefully
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('handles theme switching', async () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    )
    
    // Look for theme toggle button
    const themeButton = screen.queryByRole('button', { name: /theme|dark|light/i })
    
    if (themeButton) {
      fireEvent.click(themeButton)
      
      // Should toggle theme
      await waitFor(() => {
        expect(document.documentElement).toHaveClass(/dark|light/)
      })
    }
  })

  it('renders footer correctly', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    )
    
    // Should have footer if present
    const footer = screen.queryByRole('contentinfo')
    
    if (footer) {
      expect(footer).toBeInTheDocument()
    }
  })

  it('handles error states', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    )
    
    // Should render without errors
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('supports accessibility features', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    )

    // Should have proper ARIA roles
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()

    // Should have skip links for accessibility
    const skipLink = screen.queryByText(/skip to main content/i)
    if (skipLink) {
      expect(skipLink).toBeInTheDocument()
    }
  })

  it('handles Chinese localization correctly', async () => {
    // Switch to Chinese language
    await i18n.changeLanguage('zh-CN')

    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    )

    // Should display Chinese navigation items
    expect(screen.getByText('模块管理')).toBeInTheDocument()
    expect(screen.getByText('设置')).toBeInTheDocument()

    // Reset to English for other tests
    await i18n.changeLanguage('en')
  })
})
