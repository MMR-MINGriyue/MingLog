import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

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

// 简单的语言检测逻辑
const detectLanguage = (): string => {
  // 检查localStorage中保存的语言设置
  const savedLanguage = localStorage.getItem('minglog-language')
  if (savedLanguage && resources[savedLanguage as keyof typeof resources]) {
    return savedLanguage
  }

  // 检查浏览器语言
  const browserLanguage = navigator.language
  if (browserLanguage.startsWith('zh')) {
    return 'zh-CN'
  }

  // 默认使用中文
  return 'zh-CN'
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(), // 使用我们的检测函数
    fallbackLng: 'zh-CN', // 默认使用中文
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React already does escaping
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
