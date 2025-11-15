import { createI18n } from 'vue-i18n';
import en from './locales/en';
import zhCN from './locales/zh-CN';

export const locales = { 'zh-CN': zhCN, en };

export function detectBrowserLanguage(): string {
  if (typeof window === 'undefined') return 'en';

  const savedLang = localStorage.getItem('language');
  if (savedLang) {
    // 支持向后兼容：将旧的 'zh' 映射到 'zh-CN'
    if (savedLang === 'zh') {
      localStorage.setItem('language', 'zh-CN');
      return 'zh-CN';
    }
    if (savedLang in locales) return savedLang;
  }

  // 检测浏览器语言
  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en';
  const langCode = browserLang.toLowerCase();
  // 支持 zh-CN, zh-TW 等变体映射到 zh-CN
  if (langCode.startsWith('zh')) return 'zh-CN';
  const baseLangCode = langCode.split('-')[0];
  if (baseLangCode in locales) return baseLangCode;

  return 'en';
}

export const i18n = createI18n({
  legacy: false,
  locale: detectBrowserLanguage(),
  fallbackLocale: 'en',
  messages: locales,
});
