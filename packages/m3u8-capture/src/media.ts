import { getMediaExtList } from './storage';
import { getMediaExtReg } from './utils';
// import type { MediaLink, LinkData } from './types';

/** 判断是否为媒体链接 */
export function isMediaUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
  const lowerUrl = url.toLowerCase();

  // 使用配置的扩展名列表进行匹配
  const mediaReg = getMediaExtReg();
  if (mediaReg.test(lowerUrl)) return true;

  // 特殊处理：m3u8 可能在 URL 路径中（不一定是文件扩展名）
  if (lowerUrl.includes('.m3u8')) return true;

  return false;
}

/** 获取文件类型 */
export function getFileType(url: string): string {
  if (!url || typeof url !== 'string') return 'media';

  const lowerUrl = url.toLowerCase();
  const extList = getMediaExtList();

  // 尝试从 URL 中提取扩展名
  for (const ext of extList) {
    const regex = new RegExp(`\\.${ext}(\\?|$|#)`, 'i');
    if (regex.test(lowerUrl)) return ext;
  }

  // 特殊处理 m3u8（可能在路径中）
  if (/m3u8/i.test(lowerUrl)) return 'm3u8';

  return 'media';
}

/** 获取媒体标题 */
export function getMediaTitle(doc: Document = document): string {
  let title = '';

  // 优先级1: 从 h1、h2、h1.title、h2.title 提取
  const elTitleList = ['h1.title', 'h2.title', 'h1', 'h2'];
  for (const el of elTitleList) {
    const element = doc.querySelector(el);
    if (element?.textContent) {
      title = element.textContent.trim();
      break;
    }
  }

  // 优先级2: 从页面 title 提取
  if (!title) {
    title = (doc.title || '').split(/[-|_]/)[0].trim();
  }

  // 优先级3: 如果是在 iframe 中，尝试从 top 窗口获取 title
  if (!title && window.top !== window.self) {
    try {
      title = getMediaTitle(window.top?.document);
    } catch (_e) {
      // ignore
    }
  }
  return title;
}

/** 从 URL 参数中提取媒体链接（每个 URL 至多包含一个媒体链接） */
export function extractMediaUrlFromParams(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    const urlObj = new URL(url);

    // 遍历所有查询参数，找到第一个媒体链接即返回
    for (const [_key, value] of urlObj.searchParams.entries()) {
      if (!value) continue;
      const decodedValue = decodeURIComponent(value);
      if (isMediaUrl(decodedValue)) return decodedValue;
    }
  } catch {
    // ignore
  }

  return null;
}
