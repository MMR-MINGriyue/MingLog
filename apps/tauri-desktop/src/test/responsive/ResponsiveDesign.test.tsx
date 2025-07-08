import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
// import React from 'react' // Unused
import SearchComponent from '../../components/SearchComponent'
import PerformanceMonitor from '../../components/PerformanceMonitor'
import * as tauriUtils from '../../utils/tauri'

// Mock the tauri utilities
vi.mock('../../utils/tauri', () => ({
  searchBlocks: vi.fn(),
  withErrorHandling: vi.fn((fn) => fn()),
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

// Mock notification system
vi.mock('../../components/NotificationSystem', () => ({
  useNotifications: () => ({
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  }),
}))

describe('Responsive Design Tests', () => {
  const mockSearchBlocks = vi.mocked(tauriUtils.searchBlocks)
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchBlocks.mockResolvedValue({
      results: [],
      total: 0,
      query: 'test',
    })
  })

  describe('SearchComponent Responsive Design', () => {
    it('should have mobile-friendly spacing and sizing', () => {
      render(
        <SearchComponent
          isOpen={true}
          onClose={vi.fn()}
          initialQuery=""
        />
      )

      // Check for mobile-responsive classes
      const dialogOverlay = screen.getByRole('dialog').parentElement as HTMLElement
      expect(dialogOverlay).toHaveClass('pt-4', 'sm:pt-20') // Mobile vs desktop top padding

      const container = screen.getByRole('dialog') as HTMLElement
      expect(container).toHaveClass('mx-2', 'sm:mx-4') // Mobile vs desktop margins
      expect(container).toHaveClass('max-h-[90vh]', 'sm:max-h-[70vh]') // Mobile vs desktop height
    })

    it('should have responsive input and button sizing', () => {
      render(
        <SearchComponent
          isOpen={true}
          onClose={vi.fn()}
          initialQuery=""
        />
      )

      const searchInput = screen.getByRole('combobox')
      expect(searchInput).toHaveClass('text-base', 'sm:text-lg') // Responsive text size
      expect(searchInput).toHaveClass('px-1', 'sm:px-2') // Responsive padding

      const closeButton = screen.getByLabelText(/close search/i)
      expect(closeButton).toHaveClass('p-1.5', 'sm:p-2') // Responsive padding
    })

    it('should have responsive checkbox sizing', () => {
      render(
        <SearchComponent
          isOpen={true}
          onClose={vi.fn()}
          initialQuery=""
        />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveClass('w-3', 'h-3', 'sm:w-4', 'sm:h-4') // Responsive checkbox size
      })
    })
  })

  describe('PerformanceMonitor Responsive Design', () => {
    it('should have mobile-friendly layout', () => {
      render(
        <PerformanceMonitor
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('mx-2', 'sm:mx-4') // Mobile vs desktop margins
      expect(dialog).toHaveClass('max-h-[90vh]', 'sm:max-h-[80vh]') // Mobile vs desktop height
    })

    it('should have responsive header layout', () => {
      render(
        <PerformanceMonitor
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      // Check for responsive header layout
      const performanceMonitor = screen.getByTestId('performance-monitor')
      const header = performanceMonitor.querySelector('div') as HTMLElement // First div is the header
      expect(header).toHaveClass('flex-col', 'sm:flex-row') // Stack on mobile, row on desktop
      expect(header).toHaveClass('space-y-3', 'sm:space-y-0') // Vertical spacing on mobile
    })

    it('should have responsive button layout', () => {
      render(
        <PerformanceMonitor
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      const startButton = screen.getByLabelText(/performance monitoring/i)
      expect(startButton).toHaveClass('flex-1', 'sm:flex-none') // Full width on mobile
      expect(startButton).toHaveClass('text-xs', 'sm:text-sm') // Smaller text on mobile
      expect(startButton).toHaveClass('px-3', 'sm:px-4') // Less padding on mobile

      // Check for close button existence
      const closeButton = screen.getByLabelText(/close performance monitor/i)
      expect(closeButton).toBeInTheDocument()
    })

    it('should hide keyboard shortcuts on small screens', () => {
      render(
        <PerformanceMonitor
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      // Keyboard shortcuts should be hidden on mobile/tablet
      const kbdElements = screen.getAllByText('Esc')
      const shortcutsContainer = kbdElements[0]?.parentElement?.parentElement
      expect(shortcutsContainer).toHaveClass('hidden', 'lg:block') // Hidden until large screens
    })
  })

  describe('Dark Theme Support', () => {
    it('should have dark theme classes in SearchComponent', () => {
      render(
        <SearchComponent
          isOpen={true}
          onClose={vi.fn()}
          initialQuery=""
        />
      )

      const container = screen.getByRole('dialog') as HTMLElement
      expect(container).toHaveClass('dark:bg-gray-800') // Dark background

      const closeButton = screen.getByLabelText(/close search/i)
      expect(closeButton).toHaveClass('dark:text-gray-500', 'dark:hover:text-gray-300') // Dark theme colors
      expect(closeButton).toHaveClass('dark:hover:bg-gray-700') // Dark hover state
    })

    it('should have dark theme classes in PerformanceMonitor', () => {
      render(
        <PerformanceMonitor
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      const container = screen.getByRole('dialog') as HTMLElement
      expect(container).toHaveClass('dark:bg-gray-800') // Dark background

      const title = screen.getByText('Performance Monitor')
      expect(title).toHaveClass('dark:text-gray-100') // Dark theme text

      const footer = screen.getByText(/updates every/i).closest('div')?.parentElement
      expect(footer).toHaveClass('dark:bg-gray-800', 'dark:border-gray-700') // Dark theme footer
    })
  })

  describe('Accessibility in Responsive Design', () => {
    it('should maintain accessibility attributes across screen sizes', () => {
      render(
        <SearchComponent
          isOpen={true}
          onClose={vi.fn()}
          initialQuery=""
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'search-title')
      expect(dialog).toHaveAttribute('aria-describedby', 'search-description')

      const searchInput = screen.getByRole('combobox')
      expect(searchInput).toHaveAttribute('aria-controls', 'search-results-listbox')
      expect(searchInput).toHaveAttribute('aria-autocomplete', 'list')
    })

    it('should have proper focus management on mobile', () => {
      render(
        <PerformanceMonitor
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('tabIndex', '-1') // Focusable container

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none', 'focus:ring-2') // Focus indicators
      })
    })
  })
})
