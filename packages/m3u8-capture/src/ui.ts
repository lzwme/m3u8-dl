/// <reference path="./global.d.ts" />

import { STORAGE_KEY_WEBUI_URL } from './config';
import {
  getExcludeUrls,
  getMediaExtList,
  getPanelPosition,
  getPanelVisible,
  getWebuiUrl,
  setExcludeUrls,
  setMediaExtList,
  setPanelPosition,
  setPanelVisible,
} from './storage';
import { initSwalCSS, loadSwal } from './swal';
import type { DragOffset, EventCoordinates, MediaLink } from './types';
import { addCssOrScript, copyToClipboard, getEventCoordinates } from './utils';

// 检查是否在 iframe 中且可以访问 window.top
export const isInIframeMode = window.top && window.top !== window.self;

// UI 相关变量
let shadowHost: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let panelElement: HTMLElement | null = null;
let toggleButton: HTMLElement | null = null;
let toggleButtonBadge: HTMLElement | null = null;
let isPanelVisible = getPanelVisible();
let isDragging = false;
const dragOffset: DragOffset = { x: 0, y: 0 };
let isToggleButtonDragging = false;
const toggleButtonDragOffset: DragOffset = { x: 0, y: 0 };
let toggleButtonClickStartPos: EventCoordinates = { x: 0, y: 0 };
let toggleButtonHasMoved = false;
let toggleButtonAnimationFrame: number | null = null;
const toggleButtonCurrentPos: EventCoordinates = { x: 0, y: 0 };

// 存储媒体链接的 Map（从 main.ts 导入）
let mediaLinks: Map<string, MediaLink>;

export function setMediaLinksMap(map: Map<string, MediaLink>): void {
  mediaLinks = map;
}

/** 创建 Shadow DOM 容器（样式隔离） */
function createShadowHost(): ShadowRoot | null {
  if (shadowHost) return shadowRoot;

  // 创建宿主元素
  shadowHost = document.createElement('div');
  shadowHost.id = 'm3u8-capture-shadow-host';
  // 使用覆盖整个视口的容器，但 pointer-events: none，让子元素可以接收事件
  shadowHost.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999;';
  document.body.appendChild(shadowHost);

  // 创建 Shadow DOM
  shadowRoot = shadowHost.attachShadow({ mode: 'open' });
  addCssOrScript('TailwindCSS', shadowRoot as unknown as HTMLElement, 'css');

  const swalContainer = document.createElement('div');
  swalContainer.id = 'm3u8-capture-swal-container';
  shadowRoot.appendChild(swalContainer);

  // 添加基础样式重置（确保 Shadow DOM 内的样式不影响外部）
  const style = document.createElement('style');
  style.textContent = [
    ':host { all: initial; font-family: system-ui, -apple-system, sans-serif; }',
    '* { box-sizing: border-box; }',
    '.hidden { display: none !important; }',
    `#${swalContainer.id},`,
    `#${swalContainer.id} * { pointer-events: auto !important; }`,
  ].join('\n');
  shadowRoot.appendChild(style);

  loadSwal().then(() => {
    initSwalCSS(shadowRoot!, swalContainer);
  });

  return shadowRoot;
}

/** 创建圆形切换按钮（隐藏时显示） */
export function createToggleButton(): void {
  if (toggleButton || isInIframeMode) return;

  const root = createShadowHost();
  if (!root) return;

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
  const handleDragStart = (e: Event) => {
    if (!toggleButton) return;
    isToggleButtonDragging = true;
    toggleButtonHasMoved = false;
    const coords = getEventCoordinates(e as MouseEvent | TouchEvent);
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
      toggleButton.style.left = `${rect.left}px`;
      toggleButton.style.top = `${rect.top}px`;
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
  toggleButton.addEventListener('click', () => {
    if (!toggleButtonHasMoved) showPanel();
  });
  // 触摸结束事件（移动端点击处理）
  toggleButton.addEventListener(
    'touchend',
    (e: Event) => {
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
export function updateToggleButtonBadge(): void {
  if (!toggleButtonBadge || isInIframeMode || !mediaLinks) return;

  const count = mediaLinks.size;
  if (count > 0) {
    toggleButtonBadge.textContent = count > 99 ? '99+' : count.toString();
    toggleButtonBadge.classList.remove('hidden');
  } else {
    toggleButtonBadge.classList.add('hidden');
  }
}

/** 显示面板 */
export function showPanel(): void {
  if (isInIframeMode || !createUI()) return;

  isPanelVisible = true;
  setPanelVisible(true);
  if (panelElement) panelElement.style.display = 'flex';
  if (toggleButton) toggleButton.classList.add('hidden');
}

/** 隐藏面板 */
export function hidePanel(): void {
  if (isInIframeMode) return;
  isPanelVisible = false;
  setPanelVisible(false);
  if (panelElement) panelElement.style.display = 'none';

  if (toggleButton) toggleButton.classList.remove('hidden');
  else createToggleButton();
  updateToggleButtonBadge();
}

/** 清空列表 */
export function clearList(): void {
  const swal = window.Swal;
  if (!swal) return;

  swal
    .fire({
      title: '确认清空',
      text: '确定要清空所有媒体链接吗？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      confirmButtonColor: '#3b82f6',
    })
    .then((result: { isConfirmed: boolean }) => {
      if (result.isConfirmed && mediaLinks) {
        mediaLinks.clear();
        updateUI();
      }
    });
}

/** 创建主 UI 面板 */
function createUI(): HTMLElement | null {
  if (!document.body || isInIframeMode) return null;
  if (panelElement) return panelElement;

  const root = createShadowHost();
  if (!root) return null;

  const panel = document.createElement('div');
  panel.id = 'm3u8-capture-panel';

  // 恢复保存的位置
  const savedPos = getPanelPosition();
  const defaultStyle: { left?: string; top?: string; right?: string } =
    savedPos && window.innerWidth > 768
      ? {
          left: `${Math.max(0, Math.min(savedPos.x, window.innerWidth - 450))}px`,
          top: `${Math.max(0, Math.min(savedPos.y, window.innerHeight - 350))}px`,
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
  if (!header) return panelElement;

  // 统一的拖动开始处理（支持鼠标和触摸）
  const handlePanelDragStart = (e: Event) => {
    // 检查点击目标是否是按钮，如果是按钮就不处理拖动
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return; // 不阻止按钮的点击事件
    }

    isDragging = true;
    const coords = getEventCoordinates(e as MouseEvent | TouchEvent);
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
  const handleMove = (e: MouseEvent | TouchEvent) => {
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

      panel.style.left = `${finalX}px`;
      panel.style.top = `${finalY}px`;
      panel.style.right = 'auto';

      // 保存位置
      setPanelPosition({ x: finalX, y: finalY });
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
      const moveDistance = Math.sqrt((coords.x - toggleButtonClickStartPos.x) ** 2 + (coords.y - toggleButtonClickStartPos.y) ** 2);
      if (moveDistance > 5) toggleButtonHasMoved = true;
    }
  };

  // 全局释放事件（同时处理面板和按钮拖动，支持鼠标和触摸）
  const handleEnd = (e: MouseEvent | TouchEvent) => {
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
  const handleButtonClick = (callback: () => void) => {
    return (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      callback();
    };
  };

  // 隐藏按钮
  const toggleBtn = panel.querySelector('#m3u8-capture-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener(
      'click',
      handleButtonClick(() => hidePanel())
    );
    toggleBtn.addEventListener(
      'touchend',
      handleButtonClick(() => hidePanel()),
      { passive: false }
    );
  }

  // 清空按钮
  const clearBtn = panel.querySelector('#m3u8-capture-clear');
  if (clearBtn) {
    clearBtn.addEventListener(
      'click',
      handleButtonClick(() => clearList())
    );
    clearBtn.addEventListener(
      'touchend',
      handleButtonClick(() => clearList()),
      { passive: false }
    );
  }

  // 设置按钮
  const settingsBtn = panel.querySelector('#m3u8-capture-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener(
      'click',
      handleButtonClick(() => showSettings())
    );
    settingsBtn.addEventListener(
      'touchend',
      handleButtonClick(() => showSettings()),
      { passive: false }
    );
  }

  // 如果 panel 初始状态是隐藏的，确保 toggleButton 被创建
  if (!isPanelVisible && !toggleButton) createToggleButton();

  return panelElement;
}

export function showSettings(): void {
  const swal = window.Swal;
  if (!swal) return;

  const excludeUrls = getExcludeUrls();
  const mediaExtList = getMediaExtList();

  swal
    .fire({
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
                      placeholder="例如：&#10;localhost:6600&#10;/example.com/&#10;127.0.0.1">${excludeUrls}</textarea>
                  <p class="text-xs text-gray-500 mt-1">匹配的网址将不展示面板且不抓取媒体链接</p>
              </div>
          `,
      showCancelButton: true,
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      confirmButtonColor: '#3b82f6',
      width: '600px',
      preConfirm: () => {
        const urlInput = document.getElementById('swal-webui-url') as HTMLInputElement;
        const excludeInput = document.getElementById('swal-exclude-urls') as HTMLTextAreaElement;
        const mediaExtInput = document.getElementById('swal-media-ext-list') as HTMLTextAreaElement;
        const url = urlInput ? urlInput.value.trim() : '';
        const excludeUrls = excludeInput ? excludeInput.value.trim() : '';
        const mediaExtText = mediaExtInput ? mediaExtInput.value.trim() : '';

        const swal = window.Swal;
        if (!url) {
          swal?.showValidationMessage('WebUI 地址不能为空');
          return false;
        }

        // 解析媒体扩展名列表
        const mediaExtList = mediaExtText
          .split(/[,\n\s]+/)
          .map(ext => ext.trim())
          .filter(ext => ext);

        if (mediaExtList.length === 0) {
          swal?.showValidationMessage('媒体扩展名列表不能为空');
          return false;
        }

        return { url, excludeUrls, mediaExtList };
      },
    })
    .then(result => {
      if (result.isConfirmed && result.value) {
        const value = result.value as { url: string; excludeUrls: string; mediaExtList: string[] };
        GM_setValue(STORAGE_KEY_WEBUI_URL, value.url);
        setExcludeUrls(value.excludeUrls);
        const savedExtList = setMediaExtList(value.mediaExtList);

        const swal = window.Swal;
        if (savedExtList && swal) {
          swal.fire({
            icon: 'success',
            title: '设置已保存',
            html: `已保存 ${savedExtList.length} 个媒体扩展名类型`,
            timer: 2000,
            showConfirmButton: false,
          });
        } else if (swal) {
          swal.fire({
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

/** 安全打开链接（处理 iframe 沙箱环境） */
function safeOpenUrl(targetUrl: string): boolean {
  const isInIframe = window.top && window.top !== window;

  // 方法1: 尝试在当前窗口打开
  try {
    const opened = window.open(targetUrl, '_blank');
    if (opened && !opened.closed) return true;
  } catch (e) {
    console.log('[M3U8 Capture] window.open failed:', e);
  }

  // 方法2: 如果在 iframe 中，尝试在父窗口打开
  if (isInIframe && window.top) {
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
    const swal = window.Swal;
    if (!swal) return;
    swal.fire({
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
      const swal = window.Swal;
      if (!swal) return;
      swal.fire({
        icon: 'warning',
        title: '无法复制链接',
        html: `由于 iframe 限制，请手动复制并打开：<br><br><code style="word-break: break-all; background: #f3f4f6; padding: 8px; border-radius: 4px; display: block; font-size: 12px;">${targetUrl}</code>`,
        confirmButtonText: '确定',
      });
    });

  return false;
}

export function updateUI(): void {
  if (isInIframeMode || !mediaLinks) return;

  if (!createUI()) return;
  updateToggleButtonBadge();

  const list = panelElement?.querySelector('#m3u8-capture-list');
  const empty = panelElement?.querySelector('#m3u8-capture-empty');
  const count = panelElement?.querySelector('#m3u8-capture-count');

  if (!list || !empty || !count) return;

  count.textContent = mediaLinks.size.toString();

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

  linksArray.forEach(item => {
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

  // 绑定下载按钮事件
  panelElement?.querySelectorAll('.m3u8-capture-download-btn').forEach(btn => {
    btn.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const url = decodeURIComponent((btn as HTMLElement).getAttribute('data-url') || '');
      const title = decodeURIComponent((btn as HTMLElement).getAttribute('data-title') || '');
      const downloadUrl = `${getWebuiUrl()}/page/download?from=capture&action=new&url=${encodeURIComponent(url + (title ? `|${title}` : ''))}`;
      safeOpenUrl(downloadUrl);
    });
  });

  // 绑定复制按钮事件
  panelElement?.querySelectorAll('.m3u8-capture-copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e: Event) => {
      e.stopPropagation();
      const url = (btn as HTMLElement).getAttribute('data-url') || '';
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
      } catch (_err) {
        const swal = window.Swal;
        if (!swal) return;
        swal.fire({
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
