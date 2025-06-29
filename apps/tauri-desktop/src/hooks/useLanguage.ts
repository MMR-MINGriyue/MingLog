import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'

export type SupportedLanguage = 'en' | 'zh-CN'

export interface LanguageInfo {
  code: SupportedLanguage
  name: string
  nativeName: string
}

export const supportedLanguages: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English'
  },
  {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '中文 (简体)'
  }
]

export const useLanguage = () => {
  const { i18n, t } = useTranslation()

  const currentLanguage = i18n.language as SupportedLanguage
  
  const changeLanguage = useCallback(async (language: SupportedLanguage) => {
    try {
      await i18n.changeLanguage(language)
      // Save to localStorage for persistence
      localStorage.setItem('minglog-language', language)
    } catch (error) {
      console.error('Failed to change language:', error)
    }
  }, [i18n])

  const getCurrentLanguageInfo = useCallback(() => {
    return supportedLanguages.find(lang => lang.code === currentLanguage) || supportedLanguages[0]
  }, [currentLanguage])

  const isRTL = useCallback(() => {
    // Add RTL language codes here if needed in the future
    const rtlLanguages: SupportedLanguage[] = []
    return rtlLanguages.includes(currentLanguage)
  }, [currentLanguage])

  const formatDate = useCallback((date: Date) => {
    const locale = currentLanguage === 'zh-CN' ? 'zh-CN' : 'en-US'
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }, [currentLanguage])

  const formatNumber = useCallback((number: number) => {
    const locale = currentLanguage === 'zh-CN' ? 'zh-CN' : 'en-US'
    return new Intl.NumberFormat(locale).format(number)
  }, [currentLanguage])

  return {
    currentLanguage,
    changeLanguage,
    getCurrentLanguageInfo,
    supportedLanguages,
    isRTL,
    formatDate,
    formatNumber,
    t
  }
}
