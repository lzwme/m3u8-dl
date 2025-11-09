/**
 * Shared i18n utility for backend (CLI, SDK, Server)
 */

import type { AnyObject } from '@lzwme/fe-utils';

type Locale = 'zh' | 'en';

export const LANG_CODES = new Set(['zh', 'en']);
let globalLang: Locale | null = null;

/**
 * Detect language from OS or environment
 */
export function detectLanguage(): Locale {
  // Check environment variable first
  const envLang = process.env.M3U8DL_LANG || process.env.LANG;
  if (envLang) {
    const langCode = envLang.toLowerCase().split('-')[0].split('_')[0];
    if (LANG_CODES.has(langCode)) {
      return langCode as Locale;
    }
  }

  // Try to detect from OS locale
  try {
    const osLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    const langCode = osLocale.toLowerCase().split('-')[0];
    if (LANG_CODES.has(langCode as Locale)) {
      return langCode as Locale;
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
  if (lang && LANG_CODES.has(lang)) {
    return lang as Locale;
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
  const translations = require(`../i18n/locales/${targetLang}.js`);

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
