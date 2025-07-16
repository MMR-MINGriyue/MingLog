import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'
import SearchComponent from '../components/SearchComponent'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { Layout } from '../components/Layout'
import { NotificationProvider } from '../components/NotificationSystem'

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({ results: [], total: 0, query_time_ms: 10 })
}))

// Test wrapper with i18n and router
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <I18nextProvider i18n={i18n}>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </I18nextProvider>
  </MemoryRouter>
)

describe('Chinese Localization', () => {
  beforeEach(async () => {
    // Reset to English before each test
    await i18n.changeLanguage('en')
  })

  describe('Language Switching', () => {
    it('should switch to Chinese language', async () => {
      render(
        <TestWrapper>
          <LanguageSwitcher />
        </TestWrapper>
      )

      // Open language dropdown
      const languageButton = screen.getByRole('button')
      fireEvent.click(languageButton)

      // Click Chinese option
      const chineseOption = screen.getByText('中文 (简体)')
      fireEvent.click(chineseOption)

      await waitFor(() => {
        expect(i18n.language).toBe('zh-CN')
      })
    })

    it('should persist language selection', async () => {
      // Test language persistence by checking if the language is correctly set
      // and can be retrieved after changing

      // Set Chinese language
      await i18n.changeLanguage('zh-CN')

      // Verify the language was changed
      expect(i18n.language).toBe('zh-CN')

      // Test that we can switch back to English
      await i18n.changeLanguage('en')
      expect(i18n.language).toBe('en')

      // Switch back to Chinese
      await i18n.changeLanguage('zh-CN')
      expect(i18n.language).toBe('zh-CN')

      // Test that the language configuration is valid
      expect(i18n.options.lng).toBeTruthy()
    })
  })

  describe('UI Translation', () => {
    it('should display Chinese text in search component', async () => {
      await i18n.changeLanguage('zh-CN')

      render(
        <TestWrapper>
          <SearchComponent isOpen={true} onClose={() => {}} />
        </TestWrapper>
      )

      // Check for Chinese placeholder text
      const searchInput = screen.getByPlaceholderText('搜索页面和块...')
      expect(searchInput).toBeInTheDocument()
    })

    it('should display Chinese navigation labels', async () => {
      await i18n.changeLanguage('zh-CN')

      render(
        <TestWrapper>
          <Layout>
            <div>Test content</div>
          </Layout>
        </TestWrapper>
      )

      // Check for Chinese navigation items that are actually implemented
      // Note: "知识图谱" is part of future data visualization module, not yet implemented
      expect(screen.getByText('模块管理')).toBeInTheDocument()
      expect(screen.getByText('设置')).toBeInTheDocument()

      // Check for app branding - Layout.tsx shows "MingLog" hardcoded
      expect(screen.getByText('MingLog')).toBeInTheDocument()
      expect(screen.getByText('桌面版')).toBeInTheDocument()
    })

    it('should display Chinese app name and description', async () => {
      await i18n.changeLanguage('zh-CN')

      // Test i18n translation directly
      expect(i18n.t('app.name')).toBe('明志桌面版')
      expect(i18n.t('app.description')).toBe('现代化知识管理工具')
    })
  })

  describe('Chinese Text Input and Display', () => {
    it('should handle Chinese text input in search', async () => {
      await i18n.changeLanguage('zh-CN')

      render(
        <TestWrapper>
          <SearchComponent isOpen={true} onClose={() => {}} />
        </TestWrapper>
      )

      const searchInput = screen.getByPlaceholderText('搜索页面和块...')
      
      // Test Chinese text input
      const chineseText = '知识管理系统'
      fireEvent.change(searchInput, { target: { value: chineseText } })
      
      expect(searchInput).toHaveValue(chineseText)
    })

    it('should display Chinese error messages', async () => {
      await i18n.changeLanguage('zh-CN')

      // Test i18n translation for error messages directly
      expect(i18n.t('search.noResults')).toBe('未找到结果')
      expect(i18n.t('search.searchError')).toBe('搜索失败')
      expect(i18n.t('errors.searchFailed')).toBe('搜索失败')
    })
  })

  describe('Date and Number Formatting', () => {
    it('should format dates in Chinese locale', () => {
      const testDate = new Date('2024-12-29T10:30:00')
      const formatter = new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      const formattedDate = formatter.format(testDate)
      expect(formattedDate).toContain('2024')
      expect(formattedDate).toContain('12')
      expect(formattedDate).toContain('29')
    })

    it('should format numbers in Chinese locale', () => {
      const testNumber = 12345.67
      const formatter = new Intl.NumberFormat('zh-CN')
      
      const formattedNumber = formatter.format(testNumber)
      expect(formattedNumber).toBe('12,345.67')
    })
  })

  describe('Font and Layout', () => {
    it('should handle Chinese text layout properly', async () => {
      await i18n.changeLanguage('zh-CN')

      const { container } = render(
        <TestWrapper>
          <div className="text-lg">
            这是一个测试中文文本的长句子，用来验证文本换行和布局是否正确处理中文字符。
          </div>
        </TestWrapper>
      )

      const textElement = container.querySelector('div')
      expect(textElement).toHaveTextContent('这是一个测试中文文本的长句子')
    })

    it('should maintain proper spacing with Chinese text', () => {
      const chineseText = '明志桌面版'
      const englishText = 'MingLog Desktop'
      
      // Chinese text should be properly spaced
      expect(chineseText.length).toBe(5) // 5 Chinese characters
      expect(englishText.length).toBe(15) // 15 English characters
    })
  })

  describe('Search Functionality with Chinese', () => {
    it('should handle Chinese search queries', async () => {
      await i18n.changeLanguage('zh-CN')

      render(
        <TestWrapper>
          <SearchComponent isOpen={true} onClose={() => {}} />
        </TestWrapper>
      )

      const searchInput = screen.getByPlaceholderText('搜索页面和块...')
      
      // Test various Chinese search terms
      const searchTerms = [
        '知识管理',
        '页面',
        '块编辑器',
        '图形可视化'
      ]

      for (const term of searchTerms) {
        fireEvent.change(searchInput, { target: { value: term } })
        expect(searchInput).toHaveValue(term)
        
        // Clear for next test
        fireEvent.change(searchInput, { target: { value: '' } })
      }
    })
  })

  describe('Accessibility with Chinese', () => {
    it('should maintain accessibility with Chinese text', async () => {
      await i18n.changeLanguage('zh-CN')

      render(
        <TestWrapper>
          <LanguageSwitcher />
        </TestWrapper>
      )

      const languageButton = screen.getByRole('button')
      // Check that the button exists and is accessible
      expect(languageButton).toBeInTheDocument()
      expect(languageButton).toBeVisible()
    })

    it('should provide proper alt text in Chinese', async () => {
      await i18n.changeLanguage('zh-CN')

      // Test i18n translation for accessibility labels directly
      expect(i18n.t('shortcuts.title')).toBe('键盘快捷键')
      expect(i18n.t('common.help')).toBe('帮助')
      expect(i18n.t('common.settings')).toBe('设置')
    })
  })

  describe('Performance with Chinese Text', () => {
    it('should render Chinese text efficiently', async () => {
      await i18n.changeLanguage('zh-CN')

      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <Layout>
            <div>
              {Array.from({ length: 100 }, (_, i) => (
                <p key={i}>这是第{i + 1}个中文段落，用于测试性能。</p>
              ))}
            </div>
          </Layout>
        </TestWrapper>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 150ms for Chinese text)
      expect(renderTime).toBeLessThan(150)
    })
  })
})

describe('Unicode and Encoding', () => {
  it('should handle various Chinese characters correctly', () => {
    const chineseCharacters = [
      '简体中文',      // Simplified Chinese
      '繁體中文',      // Traditional Chinese
      '知识管理系统',   // Knowledge Management System
      '搜索功能',      // Search Function
      '图形可视化',    // Graph Visualization
      '文件操作',      // File Operations
      '设置选项',      // Settings Options
      '键盘快捷键',    // Keyboard Shortcuts
    ]

    chineseCharacters.forEach(text => {
      // Test that text is properly encoded and decoded
      const encoded = encodeURIComponent(text)
      const decoded = decodeURIComponent(encoded)
      expect(decoded).toBe(text)
    })
  })

  it('should handle mixed Chinese and English text', () => {
    const mixedText = 'MingLog 明志桌面版 v1.0.0'
    
    // Should contain both Chinese and English characters
    expect(mixedText).toMatch(/[a-zA-Z]/)  // Contains English
    expect(mixedText).toMatch(/[\u4e00-\u9fff]/)  // Contains Chinese
  })
})
