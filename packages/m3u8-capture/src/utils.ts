import { DEFAULT_EXCLUDE_URLS } from './config';
import { getExcludeUrls, getMediaExtList, getWebuiUrl } from './storage';
import type { EventCoordinates } from './types';

/** 使用 GM_addElement 创建 style 或 script 元素，避免 CSP 拦截 */
export function addCssOrScript(key: string, parentEl: HTMLElement = document.head, type: 'css' | 'script' = 'css'): Promise<HTMLElement> {
  // 如果 key 长度小于 50，则认为是资源文本，否则认为是字符串
  const textContent = key.length < 50 ? GM_getResourceText(key) : key;
  return Promise.resolve(
    GM_addElement(parentEl, type === 'css' ? 'style' : 'script', {
      type: type === 'css' ? 'text/css' : 'text/javascript',
      textContent: textContent,
    }) as HTMLElement
  );
}

/** 获取媒体扩展名正则表达式 */
export function getMediaExtReg(): RegExp {
  const extList = getMediaExtList();
  return new RegExp(`\\.(${extList.join('|')})(\\?|$|#)`, 'i');
}

/** 检查当前 URL 是否应该被排除 */
export function shouldExcludePageUrl(url?: string): boolean {
  const currentUrl = url || window.location.href;

  // 检查是否是 WEBUI_URL
  if (currentUrl.startsWith(getWebuiUrl())) return true;

  const excludeRules: string[] = [...DEFAULT_EXCLUDE_URLS];
  // 检查是否匹配排除规则列表
  const excludeUrls = getExcludeUrls();
  if (excludeUrls.trim()) {
    excludeRules.push(...excludeUrls.split('\n').map(rule => rule.trim()).filter(rule => rule));
  }

  for (const rule of excludeRules) {
    try {
      if (currentUrl.includes(rule)) return true;

      // 支持正则表达式（以 / 开头和结尾）
      if (rule.startsWith('/') && rule.endsWith('/')) {
        const regex = new RegExp(rule.slice(1, -1));
        if (regex.test(currentUrl)) return true;
      }
    } catch (e) {
      // 正则表达式错误，忽略
      console.warn('[M3U8 Capture] 排除规则格式错误:', rule, e);
    }
  }

  return false;
}

/** 复制到剪贴板 */
export function copyToClipboard(text: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => resolve(true))
        .catch(() => {
          fallbackCopy(text) ? resolve(true) : reject(new Error('复制失败'));
        });
    } else {
      fallbackCopy(text) ? resolve(true) : reject(new Error('复制失败'));
    }
  });
}

/** 降级复制方案（使用 document.execCommand） */
function fallbackCopy(text: string): boolean {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length); // 兼容移动端
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (e) {
    console.error('[M3U8 Capture] fallbackCopy failed:', e);
    return false;
  }
}

/** 用于去重的 URL 规范化函数 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // 保留基础路径，去除查询参数中的时间戳等动态参数
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch {
    return url;
  }
}

/** 获取事件坐标（支持鼠标和触摸事件） */
export function getEventCoordinates(e: MouseEvent | TouchEvent): EventCoordinates {
  if ('touches' in e && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  if ('changedTouches' in e && e.changedTouches.length > 0) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  }
  return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
}
