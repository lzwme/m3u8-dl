import { initHooks, observeNetworkRequests, scanPageForMedias } from './hooks';
import { extractMediaUrlFromParams, getFileType, getMediaTitle } from './media';
import type { LinkData, MediaLink } from './types';
import { hidePanel, isInIframeMode, setMediaLinksMap, updateUI } from './ui';
import { normalizeUrl, shouldExcludePageUrl } from './utils';

/** 存储抓取的媒体链接 */
const mediaLinks = new Map<string, MediaLink>();

// 将 mediaLinks 传递给 UI 模块
setMediaLinksMap(mediaLinks);

/** 添加媒体链接 */
export function addMediaLink(url: string, title = ''): void {
  url = extractMediaUrlFromParams(url) || url;
  if (!url) return;

  // 如果在 iframe 模式，发送给 top 窗口
  if (isInIframeMode) {
    try {
      const linkData: LinkData = {
        url: url,
        title: title || getMediaTitle(),
        type: getFileType(url),
        pageUrl: window.location.href,
        timestamp: Date.now(),
      };
      window.top?.postMessage(
        {
          type: 'm3u8-capture-link',
          data: linkData,
        },
        '*'
      );
    } catch (e) {
      console.warn('[M3U8 Capture] Failed to send link to top window:', e);
    }
    return;
  }

  const normalizedUrl = normalizeUrl(url);

  // 检查是否已存在
  const item = mediaLinks.get(normalizedUrl);
  if (item?.title) return;

  mediaLinks.set(normalizedUrl, {
    url: url,
    title: title || getMediaTitle(),
    type: getFileType(url),
    pageUrl: window.location.href,
    timestamp: Date.now(),
  });

  // 更新 UI（会根据 STORAGE_KEY_PANEL_VISIBLE 决定显示 panel 还是 toggleButton）
  updateUI();
}

/** 初始化 */
function init(): void {
  // 检查当前页面是否应该被排除
  if (shouldExcludePageUrl()) return;

  // 在非 iframe 模式下，监听来自子 iframe 的链接消息
  if (!isInIframeMode) {
    window.addEventListener('message', event => {
      if (event.data?.type === 'm3u8-capture-link' && event.data.data) {
        const linkData: LinkData = event.data.data;
        addMediaLink(linkData.url, linkData.title);
      }
    });
  }

  initHooks();
  observeNetworkRequests();

  /** 等待 DOM 加载完成后创建 UI */
  const initUI = () => {
    // 再次检查（可能在 DOM 加载期间 URL 变化了）
    if (shouldExcludePageUrl()) return;

    // 如果在 iframe 模式，不创建任何 UI
    if (isInIframeMode) return scanPageForMedias();

    if (document.body) {
      scanPageForMedias();
      // 如果有链接，updateUI 会触发 showPanel，进而创建 UI
      if (mediaLinks.size > 0) updateUI();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    setTimeout(initUI, 100);
  }

  // 监听页面变化（SPA 应用）
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;

      if (shouldExcludePageUrl()) {
        hidePanel();
        return;
      }
      setTimeout(() => scanPageForMedias(), 1000);
    }
  }).observe(document, { subtree: true, childList: true });

  // 定期扫描页面（捕获动态加载的内容）
  setInterval(() => {
    if (document.body && !shouldExcludePageUrl()) scanPageForMedias();
  }, 5000);
}

init();
