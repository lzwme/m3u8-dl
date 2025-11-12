/**
 * Shared i18n utility for backend (CLI, SDK, Server)
 */

import type { AnyObject } from '@lzwme/fe-utils';

type Locale = 'zh-CN' | 'en';

export const LANG_CODES = new Set(['zh-CN', 'en']);
let globalLang: Locale | null = null;

/**
 * Detect language from OS or environment
 */
export function detectLanguage(): Locale {
  // Check environment variable first
  const envLang = process.env.M3U8DL_LANG || process.env.LANG;
  if (envLang) {
    const langCode = envLang.toLowerCase();
    // 支持 zh-CN, zh-TW, zh 等变体映射到 zh-CN
    if (langCode.startsWith('zh')) {
      return 'zh-CN';
    }
    const baseLangCode = langCode.split('-')[0].split('_')[0];
    if (LANG_CODES.has(baseLangCode as Locale)) {
      return baseLangCode as Locale;
    }
  }

  // Try to detect from OS locale
  try {
    const osLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    const langCode = osLocale.toLowerCase();
    // 支持 zh-CN, zh-TW 等变体映射到 zh-CN
    if (langCode.startsWith('zh')) {
      return 'zh-CN';
    }
    const baseLangCode = langCode.split('-')[0];
    if (LANG_CODES.has(baseLangCode as Locale)) {
      return baseLangCode as Locale;
    }
  } catch {
    // Ignore errors
  }

  // Fallback to English
  return 'en';
}

/**
 * Set global language context
 */
export function setLanguage(lang: Locale | null): void {
  globalLang = lang;
}

/**
 * Get global language context
 */
export function getLanguage(): Locale | null {
  return globalLang;
}

/**
 * Get language from various sources
 */
export function getLang(lang?: string): Locale {
  if (lang) {
    const normalizedLang = lang.toLowerCase();
    // 支持向后兼容：将 zh 映射到 zh-CN
    if (normalizedLang === 'zh' || normalizedLang.startsWith('zh')) {
      return 'zh-CN';
    }
    if (LANG_CODES.has(normalizedLang as Locale)) {
      return normalizedLang as Locale;
    }
  }
  if (globalLang) {
    return globalLang;
  }
  return detectLanguage();
}

/**
 * Translation function
 */
export function t(key: string, lang?: string, params?: AnyObject): string {
  const targetLang = getLang(lang);
  // 将 zh-CN 映射到文件名 zh-CN.ts
  const langFile = targetLang === 'zh-CN' ? 'zh-CN' : targetLang;
  const translations = require(`../i18n/locales/${langFile}.js`);

  // Navigate through nested keys (e.g., 'cli.command.download.description')
  const keys = key.split('.');
  let value: unknown = translations.default || translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k as keyof typeof value];
    } else {
      // Key not found, return the key itself
      return key;
    }
  }

  // If value is a string, replace params if provided
  if (typeof value === 'string' && params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? String(params[paramKey]) : match;
    });
  }

  return typeof value === 'string' ? value : key;
}
