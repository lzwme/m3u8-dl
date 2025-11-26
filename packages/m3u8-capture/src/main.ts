import { initHooks, observeNetworkRequests, scanPageForMedias } from './hooks';
import { addMediaLink, mediaLinks } from './media';
import type { LinkData } from './types';
import { hidePanel, updateUI } from './ui';
import { isInIframeMode, shouldExcludePageUrl } from './utils';

/** 初始化 */
function init(): void {
  // 检查当前页面是否应该被排除
  if (shouldExcludePageUrl()) return;

  // 在非 iframe 模式下，监听来自子 iframe 的链接消息
  if (!isInIframeMode) {
    window.addEventListener('message', event => {
      if (event.data?.type === 'm3u8-capture-link' && event.data.data) {
        const linkData: LinkData = event.data.data;
        addMediaLink(linkData.url, linkData.title, linkData.headers);
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
