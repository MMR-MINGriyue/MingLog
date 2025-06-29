import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation resources
import enTranslations from './locales/en.json'
import zhTranslations from './locales/zh-CN.json'

const resources = {
  en: {
    translation: enTranslations
  },
  'zh-CN': {
    translation: zhTranslations
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'minglog-language',
    },
    
    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation'],
    
    // React specific options
    react: {
      useSuspense: false,
    },
  })

export default i18n
