/** 默认媒体扩展名列表 */
const DEFAULT_MEDIA_EXT_LIST = [
  'm3u8',
  'mp4',
  'mkv',
  'avi',
  'mov',
  'wmv',
  'flv',
  'webm',
  'm4v',
  'm3u',
  'm4a',
  'aac',
  'flac',
  'ape',
  'mp3',
  'wav',
  'ogg',
  'wma',
];

/** 获取媒体扩展名列表 */
export function getMediaExtList(): string[] {
  return DEFAULT_MEDIA_EXT_LIST;
}

/** 获取媒体扩展名正则表达式 */
export function getMediaExtReg() {
  const extList = getMediaExtList();
  return new RegExp(`\\.(${extList.join('|')})(\\?|$|#)`, 'i');
}

/** 用于去重的 URL 规范化函数 */
export function normalizeUrl(url: string) {
  try {
    const urlObj = new URL(url);
    // 保留基础路径，去除查询参数中的时间戳等动态参数
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch {
    return url;
  }
}

/** 判断是否为媒体链接 */
export function isMediaUrl(url: string) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
  const lowerUrl = url.toLowerCase();

  // 使用配置的扩展名列表进行匹配
  const mediaReg = getMediaExtReg();
  if (mediaReg.test(lowerUrl)) {
    return true;
  }

  // 特殊处理：m3u8 可能在 URL 路径中（不一定是文件扩展名）
  if (lowerUrl.includes('.m3u8')) {
    return true;
  }

  return false;
}

// 获取文件类型
export function getFileType(url: string) {
  if (!url || typeof url !== 'string') return 'media';

  const lowerUrl = url.toLowerCase();
  const extList = getMediaExtList();

  // 尝试从 URL 中提取扩展名
  for (const ext of extList) {
    const regex = new RegExp(`\\.${ext}(\\?|$|#)`, 'i');
    if (regex.test(lowerUrl)) {
      return ext;
    }
  }

  // 特殊处理 m3u8（可能在路径中）
  if (/m3u8/i.test(lowerUrl)) {
    return 'm3u8';
  }

  return 'media';
}

/** 从 URL 参数中提取媒体链接（每个 URL 至多包含一个媒体链接） */
export function extractMediaUrlFromParams(url: string) {
  if (!url || typeof url !== 'string') return null;

  try {
    const urlObj = new URL(url);

    // 遍历所有查询参数，找到第一个媒体链接即返回
    for (const [_key, value] of urlObj.searchParams.entries()) {
      if (!value) continue;
      const decodedValue = decodeURIComponent(value);
      if (isMediaUrl(decodedValue)) return decodedValue;
      // if (isMediaUrl(decodedValue)) decodeURIComponent(url.split(`${key}=`)[1]);
    }
  } catch {
    // ignore
  }

  return null;
}
