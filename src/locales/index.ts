// src/locales/index.js
import enUS from './en-US';
import zhCN from './zh-CN';
import jaJP from './ja-JP';

import { createI18n } from 'vue-i18n';
import { useLocalStorage } from '@/stores/useLocalStorage';

const messages = {
  'en-US': enUS,
  'zh-CN': zhCN,
  'ja-JP': jaJP
}

const i18n = createI18n({
  legacy: false,  // 禁用 Legacy API
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  messages,
});

useLocalStorage.get("uploadFunctionSettings").then((result) => {
  if (result) {
    i18n.global.locale.value= result.i18n || 'zh-CN';
  }
});
export default i18n;
