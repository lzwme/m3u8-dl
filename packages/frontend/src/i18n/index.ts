import { createI18n } from 'vue-i18n';
import en from './locales/en';
import zh from './locales/zh';

const locales = { zh, en };

function detectBrowserLanguage(): string {
  if (typeof window === 'undefined') return 'en';

  const savedLang = localStorage.getItem('language');
  if (savedLang && savedLang in locales) return savedLang;

  // 检测浏览器语言
  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en';
  const langCode = browserLang.toLowerCase().split('-')[0];
  if (langCode in locales) return langCode;

  return 'en';
}

const i18n = createI18n({
  legacy: false,
  locale: detectBrowserLanguage(),
  fallbackLocale: 'en',
  messages: locales,
});

export default i18n;
