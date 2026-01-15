import { addMediaLink, isMediaUrl } from './media';
import { getMediaExtList } from './storage';

/** 过滤不必要的 headers */
function filterHeaders(headers: Record<string, string> | Headers): Record<string, string> {
  const headerObj: Record<string, string> = {};

  // 将 Headers 对象转换为普通对象
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      headerObj[key.toLowerCase()] = value;
    });
  } else {
    Object.keys(headers).forEach(key => {
      headerObj[key.toLowerCase()] = headers[key];
    });
  }

  // 需要排除的 header key（小写）
  const excludeKeys = [
    'accept',
    'accept-encoding',
    'accept-language',
    'connection',
    'content-length',
    'upgrade-insecure-requests',
    // 'user-agent',
  ];

  // 过滤掉不需要的 headers
  Object.keys(headerObj).forEach(key => {
    // 排除 sec-* 开头的所有 headers
    if (excludeKeys.includes(key) || key.startsWith('sec-') || headerObj[key] == null) {
      delete headerObj[key];
    }
  });

  return headerObj;
}

/** 初始化拦截器 */
export function initHooks(): void {
  // 拦截 XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  const xhrHeadersMap = new WeakMap<XMLHttpRequest, Record<string, string>>();

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ) {
    if (isMediaUrl(url.toString())) {
      // 重置 headers 存储
      xhrHeadersMap.set(this, {});

      this.addEventListener('load', function () {
        if (this.status >= 200 && this.status < 300) {
          const headers = xhrHeadersMap.get(this) || {};
          const filteredHeaders = filterHeaders(headers);
          addMediaLink(url.toString(), '', filteredHeaders);
        }
      });
    }
    return originalOpen.call(this, method, url, async ?? true, username, password);
  };

  // 拦截 setRequestHeader 以捕获 headers
  XMLHttpRequest.prototype.setRequestHeader = function (name: string, value: string) {
    const headers = xhrHeadersMap.get(this) || {};
    headers[name] = value;
    xhrHeadersMap.set(this, headers);
    return originalSetRequestHeader.call(this, name, value);
  };

  // 拦截 fetch
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input && typeof input === 'object' && 'url' in input ? input.url : '';
    if (isMediaUrl(url)) {
      // 获取 headers
      let headers: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            headers[key] = value;
          });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => {
            headers[key] = value;
          });
        } else {
          headers = init.headers as Record<string, string>;
        }
      }
      // 如果是 Request 对象，也尝试获取 headers
      if (input instanceof Request) {
        input.headers.forEach((value, key) => {
          headers[key] = value;
        });
      }

      return originalFetch.call(this, input, init).then((response: Response) => {
        if (response.ok) {
          addMediaLink(url, '', filterHeaders(headers));
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
        // Performance API 无法获取请求 headers，所以传递空字符串
        addMediaLink(entry.name);
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['resource'] });
  } catch (_e) {
    console.warn('[M3U8 Capture] PerformanceObserver not supported');
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
        addMediaLink(absoluteUrl, link.textContent);
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
