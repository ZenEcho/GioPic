import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'
import browser from 'webextension-polyfill'

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: 'zh-CN', // Default initial locale
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

// Async load locale from storage.local (shared across extension and content scripts)
browser.storage.local.get('giopic-locale').then(res => {
  const lang = res['giopic-locale']
  if (lang && (lang === 'zh-CN' || lang === 'en-US')) {
    i18n.global.locale.value = lang as 'zh-CN' | 'en-US'
  }
})

export default i18n
