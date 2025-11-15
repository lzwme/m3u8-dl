import {
  DEFAULT_MEDIA_EXT_LIST,
  STORAGE_KEY_AUTO_START,
  STORAGE_KEY_EXCLUDE_URLS,
  STORAGE_KEY_MEDIA_EXT_LIST,
  STORAGE_KEY_PANEL_POS,
  STORAGE_KEY_PANEL_VISIBLE,
  STORAGE_KEY_WEBUI_URL,
} from './config';
import type { PanelPosition } from './types';

/** 获取 webui 地址 */
export function getWebuiUrl(): string {
  return GM_getValue(STORAGE_KEY_WEBUI_URL, 'http://localhost:6600').replace(/\/$/, '');
}

/** 获取排除网址规则列表 */
export function getExcludeUrls(): string {
  return GM_getValue(STORAGE_KEY_EXCLUDE_URLS, '');
}

/** 设置排除网址规则列表 */
export function setExcludeUrls(urls: string): void {
  GM_setValue(STORAGE_KEY_EXCLUDE_URLS, urls);
}

/** 获取媒体扩展名列表 */
export function getMediaExtList(): string[] {
  const saved = GM_getValue(STORAGE_KEY_MEDIA_EXT_LIST, [] as string[]);
  if (saved && Array.isArray(saved) && saved.length > 0) {
    return saved;
  }
  return [...DEFAULT_MEDIA_EXT_LIST];
}

/** 设置媒体扩展名列表 */
export function setMediaExtList(extList: string[]): string[] | null {
  if (Array.isArray(extList) && extList.length > 0) {
    // 清理和验证扩展名
    const cleaned = extList.map(ext => ext.trim().toLowerCase()).filter(ext => ext && /^[a-z0-9]+$/i.test(ext));
    GM_setValue(STORAGE_KEY_MEDIA_EXT_LIST, cleaned);
    return cleaned;
  }
  return null;
}

/** 获取面板位置 */
export function getPanelPosition(): PanelPosition | null {
  return GM_getValue(STORAGE_KEY_PANEL_POS, null);
}

/** 设置面板位置 */
export function setPanelPosition(pos: PanelPosition): void {
  GM_setValue(STORAGE_KEY_PANEL_POS, pos);
}

/** 获取面板可见性 */
export function getPanelVisible(): boolean {
  return GM_getValue(STORAGE_KEY_PANEL_VISIBLE, false);
}

/** 设置面板可见性 */
export function setPanelVisible(visible: boolean): void {
  GM_setValue(STORAGE_KEY_PANEL_VISIBLE, visible);
}

/** 获取是否自动下载 */
export function getAutoStart(): boolean {
  return GM_getValue(STORAGE_KEY_AUTO_START, false);
}

/** 设置是否自动下载 */
export function setAutoStart(autoStart: boolean): void {
  GM_setValue(STORAGE_KEY_AUTO_START, autoStart);
}
