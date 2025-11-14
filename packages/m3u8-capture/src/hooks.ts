import { addMediaLink } from './main';
import { isMediaUrl } from './media';
import { getMediaExtList } from './storage';

/** 初始化拦截器 */
export function initHooks(): void {
  // 拦截 XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ) {
    if (isMediaUrl(url.toString())) {
      this.addEventListener('load', function () {
        if (this.status >= 200 && this.status < 300) {
          addMediaLink(url.toString());
        }
      });
    }
    return originalOpen.call(this, method, url, async ?? true, username, password);
  };

  // 拦截 fetch
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input && typeof input === 'object' && 'url' in input ? input.url : '';
    if (isMediaUrl(url)) {
      return originalFetch.call(this, input, init).then((response: Response) => {
        if (response.ok) {
          addMediaLink(url);
        }
        return response;
      });
    }
    return originalFetch.call(this, input, init);
  };
}

/** 监听网络请求（通过 Performance API） */
export function observeNetworkRequests(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (entry.name && isMediaUrl(entry.name)) {
        addMediaLink(entry.name);
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['resource'] });
  } catch (_e) {
    console.log('[M3U8 Capture] PerformanceObserver not supported');
  }
}

/** 扫描页面中的媒体元素和链接 */
export function scanPageForMedias(): void {
  // 扫描 video 标签的 src
  document.querySelectorAll('video').forEach(video => {
    if (video.src && isMediaUrl(video.src)) {
      addMediaLink(video.src, video.getAttribute('title') || '');
    }
    // 扫描 source 标签
    video.querySelectorAll('source').forEach(source => {
      if (source.src && isMediaUrl(source.src)) {
        addMediaLink(source.src, video.getAttribute('title') || '');
      }
    });
  });

  // 扫描所有链接
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (href && isMediaUrl(href)) {
      try {
        const absoluteUrl = new URL(href, window.location.href).href;
        addMediaLink(absoluteUrl, link.textContent?.trim() || '');
      } catch (_e) {
        // 忽略无效 URL
      }
    }
  });

  // 扫描所有可能的媒体 URL（通过正则）
  if (document.body) {
    const pageText = document.body.innerText || '';
    const extList = getMediaExtList();
    const extPattern = extList.join('|');
    const urlRegex = new RegExp(`https?:\\/\\/[^\\s"'<>]+\\.(${extPattern})(\\?[^\\s"'<>]*)?`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = urlRegex.exec(pageText)) !== null) {
      addMediaLink(match[0]);
    }
  }
}
