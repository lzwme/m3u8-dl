// ==UserScript==
// @name         [M3U8-DL]媒体链接抓取器
// @namespace    https://github.com/lzwme/m3u8-dl
// @homepage     https://m3u8-player.lzw.me/download.html
// @supportURL   https://github.com/lzwme/m3u8-dl/issues
// @icon         https://gh-proxy.org/raw.githubusercontent.com/lzwme/m3u8-dl/refs/heads/main/packages/frontend/public/logo.png
// @version      1.0.0
// @description  自动抓取网页中的多种媒体链接（m3u8、mp4、mkv、avi、mov、音频等），支持可配置的媒体类型，支持跳转到 m3u8-dl webui 下载
// @author       lzw
// @updateURL    https://gh-proxy.org/raw.githubusercontent.com/lzwme/m3u8-dl/refs/heads/main/client/m3u8-capture.user.js
// @downloadURL  https://raw.githubusercontent.com/lzwme/m3u8-dl/refs/heads/main/client/m3u8-capture.user.js
// @match        *://*/*
// @grant        GM_addElement
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @resource     SwalJS   https://s4.zstatic.net/ajax/libs/sweetalert2/11.16.1/sweetalert2.min.js
// @resource     SwalCSS  https://s4.zstatic.net/ajax/libs/sweetalert2/11.16.1/sweetalert2.css
// @resource     TailwindCSS  https://s4.zstatic.net/ajax/libs/tailwindcss/2.2.19/tailwind.min.css
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // 配置存储键名
  const STORAGE_KEY_WEBUI_URL = 'm3u8_capture_webui_url';
  const STORAGE_KEY_EXCLUDE_URLS = 'm3u8_capture_exclude_urls';
  const STORAGE_KEY_PANEL_POS = 'm3u8_capture_panel_pos';
  const STORAGE_KEY_PANEL_VISIBLE = 'm3u8_capture_panel_visible';
  const STORAGE_KEY_MEDIA_EXT_LIST = 'm3u8_capture_media_ext_list';

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

  /** 存储抓取的媒体链接 */
  const mediaLinks = new Map();

  /** 使用 GM_addElement 创建 style 或 script 元素，避免 CSP 拦截 */
  function addCssOrScript(key, parentEl = document.head, type = 'css') {
    // 如果 key 长度小于 50，则认为是资源文本，否则认为是字符串
    const textContent = key.length < 50 ? GM_getResourceText(key) : key;
    return GM_addElement(parentEl, type === 'css' ? 'style' : 'script', {
      type: type === 'css' ? 'text/css' : 'text/javascript',
      textContent: textContent,
    });
  }

  /** SweetAlert2 Shadow DOM 支持 */
  async function loadSwal() {
    let swalTarget = document.body;
    unsafeWindow.SetSwalTarget = globalThis.SetSwalTarget = newTarget => (swalTarget = newTarget);
    unsafeWindow.GetSwalTarget = globalThis.GetSwalTarget = () => swalTarget;

    try {
      // 读取并魔改 SweetAlert2 JS
      const SwalJS = GM_getResourceText('SwalJS').replaceAll('document.body', 'GetSwalTarget()'); // 重定义容器

      // 注意：需要在 document 存在时才能添加元素
      const addScript = () => {
        return addCssOrScript(SwalJS, document.head || document.documentElement, 'script')
          .then(() => {
            unsafeWindow.Swal = window.Swal = window.Swal || window.Sweetalert2 || unsafeWindow.Sweetalert2;
          })
          .catch(err => {
            console.error('[M3U8 Capture] Failed to add SweetAlert2 script:', err);
          });
      };

      // 如果 document 已存在，直接添加；否则等待 DOMContentLoaded
      if (document.head || document.documentElement) {
        await addScript();
      } else {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addScript);
        else setTimeout(addScript, 50);
      }
    } catch (e) {
      console.error('[M3U8 Capture] Failed to load SweetAlert2:', e);
    }
  }

  /** 获取媒体扩展名列表 */
  function getMediaExtList() {
    const saved = GM_getValue(STORAGE_KEY_MEDIA_EXT_LIST, null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    return DEFAULT_MEDIA_EXT_LIST;
  }

  /** 设置媒体扩展名列表 */
  function setMediaExtList(extList) {
    if (Array.isArray(extList) && extList.length > 0) {
      // 清理和验证扩展名
      const cleaned = extList.map(ext => ext.trim().toLowerCase()).filter(ext => ext && /^[a-z0-9]+$/i.test(ext));
      GM_setValue(STORAGE_KEY_MEDIA_EXT_LIST, cleaned);
      return cleaned;
    }
    return null;
  }

  /** 获取媒体扩展名正则表达式 */
  function getMediaExtReg() {
    const extList = getMediaExtList();
    return new RegExp(`\\.(${extList.join('|')})(\\?|$|#)`, 'i');
  }

  /** 获取 webui 地址 */
  function getWebuiUrl() {
    return GM_getValue(STORAGE_KEY_WEBUI_URL, 'http://localhost:6600').replace(/\/$/, '');
  }

  /** 获取排除网址规则列表 */
  function getExcludeUrls() {
    return GM_getValue(STORAGE_KEY_EXCLUDE_URLS, '');
  }

  /** 设置排除网址规则列表 */
  function setExcludeUrls(urls) {
    GM_setValue(STORAGE_KEY_EXCLUDE_URLS, urls);
  }

  /** 检查当前 URL 是否应该被排除 */
  function shouldExcludePageUrl(url) {
    const currentUrl = url || window.location.href;

    // 检查是否是 WEBUI_URL
    if (currentUrl.startsWith(getWebuiUrl())) return true;

    // 检查是否匹配排除规则列表
    const excludeUrls = getExcludeUrls();
    if (!excludeUrls || !excludeUrls.trim()) return false;

    const rules = excludeUrls
      .split('\n')
      .map(rule => rule.trim())
      .filter(rule => rule);
    for (const rule of rules) {
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

  function copyToClipboard(text) {
    return new Promise((resolve, reject) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
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
  function fallbackCopy(text) {
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
  function normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // 保留基础路径，去除查询参数中的时间戳等动态参数
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch {
      return url;
    }
  }

  /** 判断是否为媒体链接 */
  function isMediaUrl(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
    const lowerUrl = url.toLowerCase();

    // 使用配置的扩展名列表进行匹配
    const mediaReg = getMediaExtReg();
    if (mediaReg.test(lowerUrl)) return true;

    // 特殊处理：m3u8 可能在 URL 路径中（不一定是文件扩展名）
    if (lowerUrl.includes('.m3u8')) return true;

    return false;
  }

  // 获取文件类型
  function getFileType(url) {
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

  function getMediaTitle(doc = document) {
    let title = '';

    // 优先级1: 从 h1、h2、h1.title、h2.title 提取
    const elTitleList = ['h1.title', 'h2.title', 'h1', 'h2'];
    for (const el of elTitleList) {
      const element = doc.querySelector(el);
      if (element && element.textContent) {
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
        title = getTitle(window.top.document);
      } catch (_e) {
        // ignore
      }
    }
    return title;
  }

  /** 从 URL 参数中提取媒体链接（每个 URL 至多包含一个媒体链接） */
  function extractMediaUrlFromParams(url) {
    if (!url || typeof url !== 'string') return null;

    try {
      const urlObj = new URL(url);

      // 遍历所有查询参数，找到第一个媒体链接即返回
      for (const [key, value] of urlObj.searchParams.entries()) {
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

  /** 添加媒体链接 */
  function addMediaLink(url, title = '') {
    url = extractMediaUrlFromParams(url) || url;
    if (!url) return;

    // 如果在 iframe 模式，发送给 top 窗口
    if (isInIframeMode) {
      try {
        const linkData = {
          url: url,
          title: title || getMediaTitle(),
          type: getFileType(url),
          pageUrl: window.location.href,
          timestamp: Date.now(),
        };
        window.top.postMessage(
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
    if (item && item.title) return;

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

  function initHooks() {
    // 拦截 XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...args) {
      if (isMediaUrl(url)) {
        this.addEventListener('load', function () {
          if (this.status >= 200 && this.status < 300) addMediaLink(url);
        });
      }
      return originalOpen.apply(this, [method, url, ...args]);
    };

    // 拦截 fetch
    const originalFetch = window.fetch;
    window.fetch = function (input, ...args) {
      const url = typeof input === 'string' ? input : input && input.url ? input.url : '';
      if (isMediaUrl(url)) {
        return originalFetch.apply(this, [input, ...args]).then(response => {
          if (response.ok) addMediaLink(url);
          return response;
        });
      }
      return originalFetch.apply(this, [input, ...args]);
    };
  }

  /** 监听网络请求（通过 Performance API） */
  function observeNetworkRequests() {
    if (typeof PerformanceObserver === 'undefined') return;

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.name && isMediaUrl(entry.name)) addMediaLink(entry.name);
      }
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.log('[M3U8 Capture] PerformanceObserver not supported');
    }
  }

  /** 扫描页面中的媒体元素和链接 */
  function scanPageForMedias() {
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
          addMediaLink(absoluteUrl, link.textContent.trim() || '');
        } catch (e) {
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
      let match;
      while ((match = urlRegex.exec(pageText)) !== null) {
        addMediaLink(match[0]);
      }
    }
  }

  // 检查是否在 iframe 中且可以访问 window.top
  let isInIframeMode = window.top && window.top !== window.self;

  // UI 相关变量
  let shadowHost = null;
  let shadowRoot = null;
  let panelElement = null;
  let toggleButton = null;
  let toggleButtonBadge = null;
  let isPanelVisible = GM_getValue(STORAGE_KEY_PANEL_VISIBLE, false);
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let isToggleButtonDragging = false;
  let toggleButtonDragOffset = { x: 0, y: 0 };
  let toggleButtonClickStartPos = { x: 0, y: 0 };
  let toggleButtonHasMoved = false;
  let toggleButtonAnimationFrame = null;
  let toggleButtonCurrentPos = { x: 0, y: 0 };

  /** 创建 Shadow DOM 容器（样式隔离） */
  function createShadowHost() {
    if (shadowHost) return shadowRoot;

    // 创建宿主元素
    shadowHost = document.createElement('div');
    shadowHost.id = 'm3u8-capture-shadow-host';
    // 使用覆盖整个视口的容器，但 pointer-events: none，让子元素可以接收事件
    shadowHost.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999;';
    document.body.appendChild(shadowHost);

    // 创建 Shadow DOM
    shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    addCssOrScript('TailwindCSS', shadowRoot, 'css');

    const swalContainer = document.createElement('div');
    swalContainer.id = 'm3u8-capture-swal-container';
    shadowRoot.appendChild(swalContainer);

    // 添加基础样式重置（确保 Shadow DOM 内的样式不影响外部）
    const style = document.createElement('style');
    style.textContent = [
      `:host { all: initial; font-family: system-ui, -apple-system, sans-serif; }`,
      `* { box-sizing: border-box; }`,
      `.hidden { display: none !important; }`,
      // `/* 确保 SweetAlert2 相关元素可以接收焦点事件 */`,
      `#${swalContainer.id},`,
      `#${swalContainer.id} * { pointer-events: auto !important; }`,
    ].join('\n');
    shadowRoot.appendChild(style);
    // addCssOrScript(style.textContent, shadowRoot, 'css');

    loadSwal(`#${shadowHost.id}`).then(() => {
      addCssOrScript(
        GM_getResourceText('SwalCSS')
          .replace(/:root *{/, `#${swalContainer.id} {`)
          .replace(/body/g, ''),
        shadowRoot,
        'css'
      );

      setTimeout(() => {
        if (typeof SetSwalTarget === 'function' && typeof Swal !== 'undefined') {
          SetSwalTarget(swalContainer);
          Swal = Swal.mixin({ target: swalContainer });
        }
      }, 500);
    });

    return shadowRoot;
  }

  /** 获取事件坐标（支持鼠标和触摸事件） */
  function getEventCoordinates(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  /** 创建圆形切换按钮（隐藏时显示） */
  function createToggleButton() {
    if (toggleButton || isInIframeMode) return;

    const root = createShadowHost();

    toggleButton = document.createElement('div');
    toggleButton.id = 'm3u8-capture-toggle-btn';
    toggleButton.style.cssText =
      'position: fixed; bottom: 40px; right: 20px; width: 50px; height: 50px; pointer-events: auto; z-index: 999998; will-change: transform;';
    toggleButton.className = `fixed bottom-10 right-5 w-[50px] h-[50px] bg-blue-500 rounded-full flex items-center justify-center cursor-move shadow-lg text-2xl transition-all duration-200 hover:scale-110 hover:shadow-xl select-none touch-none ${isPanelVisible ? 'hidden' : 'flex'}`;

    // 添加图标
    const icon = document.createElement('span');
    icon.textContent = '🎬';
    toggleButton.appendChild(icon);

    // 创建数量徽章
    toggleButtonBadge = document.createElement('span');
    toggleButtonBadge.id = 'm3u8-capture-toggle-badge';
    toggleButtonBadge.style.cssText =
      'position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px; background: #ef4444; color: white; border-radius: 9px; font-size: 11px; font-weight: bold; display: flex; align-items: center; justify-content: center; padding: 0 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); line-height: 1;';
    toggleButtonBadge.textContent = '0';
    toggleButtonBadge.classList.add('hidden');
    toggleButton.appendChild(toggleButtonBadge);

    // 统一的拖动开始处理（支持鼠标和触摸）
    const handleDragStart = e => {
      isToggleButtonDragging = true;
      toggleButtonHasMoved = false;
      const coords = getEventCoordinates(e);
      toggleButtonClickStartPos = { x: coords.x, y: coords.y };
      const rect = toggleButton.getBoundingClientRect();
      toggleButtonDragOffset.x = coords.x - rect.left;
      toggleButtonDragOffset.y = coords.y - rect.top;

      // 保存当前实际位置（考虑可能存在的 transform）
      toggleButtonCurrentPos.x = rect.left;
      toggleButtonCurrentPos.y = rect.top;

      // 清除之前的 transform，使用 left/top 作为基准
      const computedStyle = window.getComputedStyle(toggleButton);
      if (computedStyle.transform && computedStyle.transform !== 'none') {
        toggleButton.style.transform = 'none';
        toggleButton.style.left = rect.left + 'px';
        toggleButton.style.top = rect.top + 'px';
        toggleButton.style.right = 'auto';
        toggleButton.style.bottom = 'auto';
      }

      toggleButton.style.cursor = 'move';
      toggleButton.style.transition = 'none'; // 拖动时禁用过渡动画
      e.preventDefault();
      e.stopPropagation();
    };

    // 鼠标事件
    toggleButton.addEventListener('mousedown', handleDragStart);
    // 触摸事件
    toggleButton.addEventListener('touchstart', handleDragStart, { passive: false });
    // 点击事件（桌面端）
    toggleButton.addEventListener('click', e => {
      if (!toggleButtonHasMoved) showPanel();
    });
    // 触摸结束事件（移动端点击处理）
    toggleButton.addEventListener(
      'touchend',
      e => {
        // 如果移动距离很小，认为是点击
        if (isToggleButtonDragging && !toggleButtonHasMoved) {
          e.preventDefault();
          e.stopPropagation();
          showPanel();
        }
      },
      { passive: false }
    );

    root.appendChild(toggleButton);

    // 初始化徽章数量
    updateToggleButtonBadge();
  }

  /** 更新切换按钮的数量徽章 */
  function updateToggleButtonBadge() {
    if (!toggleButtonBadge || isInIframeMode) return;

    const count = mediaLinks.size;
    if (count > 0) {
      toggleButtonBadge.textContent = count > 99 ? '99+' : count.toString();
      toggleButtonBadge.classList.remove('hidden');
    } else {
      toggleButtonBadge.classList.add('hidden');
    }
  }

  /** 显示面板 */
  function showPanel() {
    if (isInIframeMode || !createUI()) return;

    isPanelVisible = true;
    GM_setValue(STORAGE_KEY_PANEL_VISIBLE, true);
    if (panelElement) panelElement.style.display = 'flex';
    if (toggleButton) toggleButton.classList.add('hidden');
  }

  /** 隐藏面板 */
  function hidePanel() {
    if (isInIframeMode) return;
    isPanelVisible = false;
    GM_setValue(STORAGE_KEY_PANEL_VISIBLE, false);
    if (panelElement) panelElement.style.display = 'none';

    if (toggleButton) toggleButton.classList.remove('hidden');
    else createToggleButton();
    updateToggleButtonBadge();
  }

  /** 清空列表 */
  function clearList() {
    Swal.fire({
      title: '确认清空',
      text: '确定要清空所有媒体链接吗？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      confirmButtonColor: '#3b82f6',
    }).then(result => {
      if (result.isConfirmed) {
        mediaLinks.clear();
        updateUI();
      }
    });
  }

  /** 创建主 UI 面板 */
  function createUI() {
    if (!document.body || isInIframeMode) return;
    if (panelElement) return panelElement;

    const root = createShadowHost();
    const panel = document.createElement('div');
    panel.id = 'm3u8-capture-panel';

    // 恢复保存的位置
    const savedPos = GM_getValue(STORAGE_KEY_PANEL_POS, null);
    const defaultStyle =
      savedPos && window.innerWidth > 768
        ? {
            left: Math.max(0, Math.min(savedPos.x, window.innerWidth - 450)) + 'px',
            top: Math.max(0, Math.min(savedPos.y, window.innerHeight - 350)) + 'px',
            right: 'auto',
          }
        : {
            right: '20px',
            top: '20px',
          };

    // 应用 Tailwind 类，同时保留动态位置样式
    panel.className =
      'fixed w-[420px] max-w-[90vw] max-h-[85vh] bg-white border-2 border-blue-500 rounded-xl shadow-2xl font-sans flex flex-col';
    panel.style.cssText = `
          position: fixed;
          width: 420px;
          max-width: 90vw;
          max-height: 85vh;
          pointer-events: auto;
          z-index: 1059;
          ${defaultStyle.left ? `left: ${defaultStyle.left};` : ''}
          ${defaultStyle.top ? `top: ${defaultStyle.top};` : ''}
          ${defaultStyle.right ? `right: ${defaultStyle.right};` : ''}
          display: ${isPanelVisible ? 'flex' : 'none'};
      `;

    panel.innerHTML = `
          <div id="m3u8-capture-header" class="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-3.5 rounded-t-lg flex justify-between items-center cursor-move select-none touch-none">
              <div class="font-semibold text-[15px] flex items-center gap-2">
                  <span>🎬</span>
                  <span>媒体链接抓取器</span>
                  <span id="m3u8-capture-count" class="bg-white bg-opacity-25 px-2 py-0.5 rounded-xl text-xs font-medium">0</span>
              </div>
              <div class="flex gap-1.5">
                  <button id="m3u8-capture-settings" class="bg-white bg-opacity-20 border-none text-white px-2.5 py-1.5 rounded-md cursor-pointer text-xs transition-colors duration-200 hover:bg-opacity-30 active:bg-opacity-40 touch-manipulation" title="设置">⚙️</button>
                  <button id="m3u8-capture-toggle" class="bg-white bg-opacity-20 border-none text-white px-2.5 py-1.5 rounded-md cursor-pointer text-xs transition-colors duration-200 hover:bg-opacity-30 active:bg-opacity-40 touch-manipulation" title="隐藏">−</button>
                  <button id="m3u8-capture-clear" class="bg-white bg-opacity-20 border-none text-white px-2.5 py-1.5 rounded-md cursor-pointer text-xs transition-colors duration-200 hover:bg-opacity-30 active:bg-opacity-40 touch-manipulation" title="清空">🗑️</button>
              </div>
          </div>
          <div id="m3u8-capture-content" class="p-3 overflow-y-auto flex-1 bg-gray-50">
              <div id="m3u8-capture-list" class="flex flex-col gap-2.5"></div>
              <div id="m3u8-capture-empty" class="text-center text-gray-400 py-10 px-5 hidden">
                  <div class="text-5xl mb-3">📹</div>
                  <div class="text-sm">暂无媒体链接</div>
                  <div class="text-xs text-gray-300 mt-2">浏览网页时会自动抓取</div>
              </div>
          </div>
      `;

    root.appendChild(panel);
    panelElement = panel;

    // 拖拽功能
    const header = panel.querySelector('#m3u8-capture-header');
    // 统一的拖动开始处理（支持鼠标和触摸）
    const handlePanelDragStart = e => {
      // 检查点击目标是否是按钮，如果是按钮就不处理拖动
      const target = e.target;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        return; // 不阻止按钮的点击事件
      }

      isDragging = true;
      const coords = getEventCoordinates(e);
      const rect = panel.getBoundingClientRect();
      dragOffset.x = coords.x - rect.left;
      dragOffset.y = coords.y - rect.top;
      panel.style.cursor = 'move';
      e.preventDefault();
      e.stopPropagation();
    };
    header.addEventListener('mousedown', handlePanelDragStart);
    header.addEventListener('touchstart', handlePanelDragStart, { passive: false });

    // 全局移动事件（同时处理面板和按钮拖动，支持鼠标和触摸）
    const handleMove = e => {
      const coords = getEventCoordinates(e);

      // 处理面板拖动
      if (isDragging && panelElement) {
        e.preventDefault();
        const x = coords.x - dragOffset.x;
        const y = coords.y - dragOffset.y;

        // 限制在视口内
        const maxX = window.innerWidth - panel.offsetWidth;
        const maxY = window.innerHeight - panel.offsetHeight;
        const finalX = Math.max(0, Math.min(x, maxX));
        const finalY = Math.max(0, Math.min(y, maxY));

        panel.style.left = finalX + 'px';
        panel.style.top = finalY + 'px';
        panel.style.right = 'auto';

        // 保存位置
        GM_setValue(STORAGE_KEY_PANEL_POS, { x: finalX, y: finalY });
      }

      // 处理按钮拖动
      if (isToggleButtonDragging && toggleButton) {
        e.preventDefault();
        const x = coords.x - toggleButtonDragOffset.x;
        const y = coords.y - toggleButtonDragOffset.y;

        // 限制在视口内
        const maxX = window.innerWidth - toggleButton.offsetWidth;
        const maxY = window.innerHeight - toggleButton.offsetHeight;
        const finalX = Math.max(0, Math.min(x, maxX));
        const finalY = Math.max(0, Math.min(y, maxY));

        // 更新目标位置
        toggleButtonCurrentPos.x = finalX;
        toggleButtonCurrentPos.y = finalY;

        // 使用 requestAnimationFrame 优化性能
        if (!toggleButtonAnimationFrame) {
          toggleButtonAnimationFrame = requestAnimationFrame(() => {
            if (toggleButton && isToggleButtonDragging) {
              // 使用 transform 而不是 left/top，性能更好
              toggleButton.style.transform = `translate(${toggleButtonCurrentPos.x}px, ${toggleButtonCurrentPos.y}px)`;
              toggleButton.style.left = '0';
              toggleButton.style.top = '0';
              toggleButton.style.right = 'auto';
              toggleButton.style.bottom = 'auto';
            }
            toggleButtonAnimationFrame = null;
          });
        }

        // 检查是否移动了足够距离（用于区分点击和拖动）
        const moveDistance = Math.sqrt(
          Math.pow(coords.x - toggleButtonClickStartPos.x, 2) + Math.pow(coords.y - toggleButtonClickStartPos.y, 2)
        );
        if (moveDistance > 5) toggleButtonHasMoved = true;
      }
    };

    // 全局释放事件（同时处理面板和按钮拖动，支持鼠标和触摸）
    const handleEnd = e => {
      if (isDragging) {
        isDragging = false;
        if (panelElement) panelElement.style.cursor = 'default';
        e.preventDefault();
      }
      if (isToggleButtonDragging) {
        // 注意：点击逻辑已在 toggleButton 的 touchend 事件中处理
        // 这里只处理拖动结束
        isToggleButtonDragging = false;

        // 取消未完成的动画帧
        if (toggleButtonAnimationFrame) {
          cancelAnimationFrame(toggleButtonAnimationFrame);
          toggleButtonAnimationFrame = null;
        }

        if (toggleButton) {
          toggleButton.style.cursor = 'move';
          // 恢复过渡动画
          toggleButton.style.transition = '';

          // 如果确实拖动过，保存最终位置
          if (toggleButtonHasMoved) {
            // 确保最终位置已应用
            toggleButton.style.transform = `translate(${toggleButtonCurrentPos.x}px, ${toggleButtonCurrentPos.y}px)`;
            toggleButton.style.left = '0';
            toggleButton.style.top = '0';
            toggleButton.style.right = 'auto';
            toggleButton.style.bottom = 'auto';
          }
        }

        // 只在确实拖动过时才 preventDefault
        if (toggleButtonHasMoved) e.preventDefault();
      }
    };

    // 鼠标事件
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    // 触摸事件
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd, { passive: false });
    document.addEventListener('touchcancel', handleEnd, { passive: false });

    // 按钮事件处理函数（支持点击和触摸）
    const handleButtonClick = callback => {
      return e => {
        e.preventDefault();
        e.stopPropagation();
        callback();
      };
    };

    // 隐藏按钮
    const toggleBtn = panel.querySelector('#m3u8-capture-toggle');
    toggleBtn.addEventListener(
      'click',
      handleButtonClick(() => hidePanel())
    );
    toggleBtn.addEventListener(
      'touchend',
      handleButtonClick(() => hidePanel()),
      { passive: false }
    );

    // 清空按钮
    const clearBtn = panel.querySelector('#m3u8-capture-clear');
    clearBtn.addEventListener(
      'click',
      handleButtonClick(() => clearList())
    );
    clearBtn.addEventListener(
      'touchend',
      handleButtonClick(() => clearList()),
      { passive: false }
    );

    // 设置按钮
    const settingsBtn = panel.querySelector('#m3u8-capture-settings');
    settingsBtn.addEventListener(
      'click',
      handleButtonClick(() => showSettings())
    );
    settingsBtn.addEventListener(
      'touchend',
      handleButtonClick(() => showSettings()),
      { passive: false }
    );

    // 如果 panel 初始状态是隐藏的，确保 toggleButton 被创建
    if (!isPanelVisible && !toggleButton) createToggleButton();

    return panelElement;
  }

  function showSettings() {
    const excludeUrls = getExcludeUrls();
    const mediaExtList = getMediaExtList();

    Swal.fire({
      title: '设置',
      html: `
              <div class="text-left">
                  <label class="block text-sm font-medium text-gray-700 mb-1">WebUI 地址</label>
                  <input id="swal-webui-url" type="text" value="${getWebuiUrl()}"
                      class="w-full p-2.5 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="http://localhost:6600">
                  <label class="block text-sm font-medium text-gray-700 mb-1">媒体扩展名（每行一个，用逗号或换行分隔）</label>
                  <textarea id="swal-media-ext-list" rows="3"
                      class="w-full p-2.5 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例如：m3u8, mp4, mkv, avi, mov, wmv, flv, webm, m4v, ts, m3u, m4a, aac, flac, ape, mp3, wav, ogg, wma">${mediaExtList.join(', ')}</textarea>
                  <p class="text-xs text-gray-500 mb-4">支持的媒体文件扩展名，将用于识别和抓取媒体链接</p>
                  <label class="block text-sm font-medium text-gray-700 mb-1">排除网址规则（每行一个，支持正则表达式，以 / 开头和结尾）</label>
                  <textarea id="swal-exclude-urls" rows="6"
                      class="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例如：&#10;localhost:6600&#10;/example\.com/&#10;127.0.0.1">${excludeUrls}</textarea>
                  <p class="text-xs text-gray-500 mt-1">匹配的网址将不展示面板且不抓取媒体链接</p>
              </div>
          `,
      showCancelButton: true,
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      confirmButtonColor: '#3b82f6',
      width: '600px',
      preConfirm: () => {
        const urlInput = document.getElementById('swal-webui-url');
        const excludeInput = document.getElementById('swal-exclude-urls');
        const mediaExtInput = document.getElementById('swal-media-ext-list');
        const url = urlInput ? urlInput.value.trim() : '';
        const excludeUrls = excludeInput ? excludeInput.value.trim() : '';
        const mediaExtText = mediaExtInput ? mediaExtInput.value.trim() : '';

        if (!url) {
          Swal.showValidationMessage('WebUI 地址不能为空');
          return false;
        }

        // 解析媒体扩展名列表
        const mediaExtList = mediaExtText
          .split(/[,\n\s]+/)
          .map(ext => ext.trim())
          .filter(ext => ext);

        if (mediaExtList.length === 0) {
          Swal.showValidationMessage('媒体扩展名列表不能为空');
          return false;
        }

        return { url, excludeUrls, mediaExtList };
      },
    }).then(result => {
      if (result.isConfirmed && result.value) {
        GM_setValue(STORAGE_KEY_WEBUI_URL, result.value.url);
        setExcludeUrls(result.value.excludeUrls);
        const savedExtList = setMediaExtList(result.value.mediaExtList);

        if (savedExtList) {
          Swal.fire({
            icon: 'success',
            title: '设置已保存',
            html: `已保存 ${savedExtList.length} 个媒体扩展名类型`,
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: '保存失败',
            text: '媒体扩展名列表格式错误',
            timer: 2000,
            showConfirmButton: false,
          });
        }
      }
    });
  }

  function updateUI() {
    if (isInIframeMode) return;

    if (!createUI()) return;
    updateToggleButtonBadge();

    const list = panelElement.querySelector('#m3u8-capture-list');
    const empty = panelElement.querySelector('#m3u8-capture-empty');
    const count = panelElement.querySelector('#m3u8-capture-count');

    if (!list || !empty || !count) return;

    count.textContent = mediaLinks.size;

    if (mediaLinks.size === 0) {
      list.classList.add('hidden');
      empty.classList.remove('hidden');
      return;
    }

    list.classList.remove('hidden');
    empty.classList.add('hidden');

    // 清空列表
    list.innerHTML = '';

    // 按时间倒序显示
    const linksArray = Array.from(mediaLinks.values()).sort((a, b) => b.timestamp - a.timestamp);

    linksArray.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className =
        'border border-gray-200 rounded-lg p-3 bg-white transition-all duration-200 shadow-sm hover:bg-gray-50 hover:shadow-md';

      const title = item.title || '';
      const type = item.type.toUpperCase();

      // 根据类型设置徽章颜色
      let typeBadgeClass = 'bg-gray-500';
      if (type === 'M3U8' || type === 'M3U') {
        typeBadgeClass = 'bg-blue-500';
      } else if (['MP4', 'MKV', 'AVI', 'MOV', 'WMV', 'FLV', 'WEBM', 'M4V', 'TS'].includes(type)) {
        typeBadgeClass = 'bg-green-500';
      } else if (['MP3', 'M4A', 'AAC', 'FLAC', 'APE', 'WAV', 'OGG', 'WMA'].includes(type)) {
        typeBadgeClass = 'bg-purple-500';
      }

      itemDiv.innerHTML = `
              <div class="flex justify-between items-start gap-2 mb-2">
                  <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5 mb-1.5">
                          <span class="font-semibold text-[13px] text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap" title="${title}">${title || '未命名媒体'}</span>
                          <span class="${typeBadgeClass} text-white px-2 py-0.5 rounded-xl text-[10px] font-bold">${type}</span>
                      </div>
                      <div class="text-[11px] text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap leading-snug max-w-[320px]" title="${item.url}">${item.url}</div>
                  </div>
              </div>
              <div class="flex gap-2">
                  <button class="m3u8-capture-download-btn flex-1 bg-blue-500 text-white border-none px-3.5 py-2 rounded-md cursor-pointer text-xs font-medium transition-all duration-200 hover:bg-blue-600 hover:-translate-y-0.5" data-url="${encodeURIComponent(item.url)}" data-title="${encodeURIComponent(title)}">
                      跳转下载
                  </button>
                  <button class="m3u8-capture-copy-btn bg-gray-500 text-white border-none px-3.5 py-2 rounded-md cursor-pointer text-xs transition-all duration-200 hover:bg-gray-600" data-url="${item.url}">
                      复制
                  </button>
              </div>
          `;

      list.appendChild(itemDiv);
    });

    /** 安全打开链接（处理 iframe 沙箱环境） */
    function safeOpenUrl(targetUrl) {
      const isInIframe = window.top && window.top !== window;

      // 方法1: 尝试在当前窗口打开
      try {
        const opened = window.open(targetUrl, '_blank');
        if (opened && !opened.closed) return true;
      } catch (e) {
        console.log('[M3U8 Capture] window.open failed:', e);
      }

      // 方法2: 如果在 iframe 中，尝试在父窗口打开
      if (isInIframe) {
        try {
          const opened = window.top.open(targetUrl, '_blank');
          if (opened && !opened.closed) return true;
        } catch (e) {
          console.log('[M3U8 Capture] window.top.open failed:', e);
        }

        // 方法3: 尝试在父窗口导航（如果无法打开新窗口）
        try {
          window.top.location.href = targetUrl;
          return true;
        } catch (e) {
          console.log('[M3U8 Capture] window.top.location.href failed:', e);
        }
      }

      // 方法4: 如果都失败，复制链接并提示用户
      const showFallback = () => {
        Swal.fire({
          icon: 'info',
          title: '链接已复制',
          html: `由于 iframe 限制，链接已复制到剪贴板<br><br><code style="word-break: break-all; background: #f3f4f6; padding: 8px; border-radius: 4px; display: block; font-size: 12px;">${targetUrl}</code><br><br>请手动打开`,
          timer: 4000,
          showConfirmButton: true,
          confirmButtonText: '确定',
        });
      };

      // 尝试复制到剪贴板
      copyToClipboard(targetUrl)
        .then(() => showFallback())
        .catch(() => {
          // 复制失败，显示链接让用户手动复制
          Swal.fire({
            icon: 'warning',
            title: '无法复制链接',
            html: `由于 iframe 限制，请手动复制并打开：<br><br><code style="word-break: break-all; background: #f3f4f6; padding: 8px; border-radius: 4px; display: block; font-size: 12px;">${targetUrl}</code>`,
            confirmButtonText: '确定',
          });
        });

      return false;
    }

    // 绑定下载按钮事件
    panelElement.querySelectorAll('.m3u8-capture-download-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const url = decodeURIComponent(btn.getAttribute('data-url'));
        const title = decodeURIComponent(btn.getAttribute('data-title'));
        const downloadUrl = `${getWebuiUrl()}/page/download?from=capture&action=new&url=${encodeURIComponent(url + (title ? `|${title}` : ''))}`;
        safeOpenUrl(downloadUrl);
      });
    });

    // 绑定复制按钮事件
    panelElement.querySelectorAll('.m3u8-capture-copy-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const url = btn.getAttribute('data-url');
        const originalText = btn.textContent;
        const originalClassName = btn.className;

        try {
          await copyToClipboard(url);
          btn.textContent = '已复制';
          btn.className =
            'm3u8-capture-copy-btn bg-green-500 text-white border-none px-3.5 py-2 rounded-md cursor-pointer text-xs transition-all duration-200';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.className = originalClassName;
          }, 2000);
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: '复制失败',
            text: '请手动复制链接',
            html: `<code style="word-break: break-all; background: #f3f4f6; padding: 8px; border-radius: 4px; display: block; font-size: 12px;">${url}</code>`,
            confirmButtonText: '确定',
          });
        }
      });
    });
  }

  /** 初始化 */
  function init() {
    // 检查当前页面是否应该被排除
    if (shouldExcludePageUrl()) return;

    // 在非 iframe 模式下，监听来自子 iframe 的链接消息
    if (!isInIframeMode) {
      window.addEventListener('message', event => {
        if (event.data?.type === 'm3u8-capture-link' && event.data.data) {
          const linkData = event.data.data;
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
          if (panelElement) hidePanel();
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
})();
