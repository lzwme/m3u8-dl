// ==UserScript==
// @name         [M3U8-DL]媒体链接抓取器
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  自动抓取网页中的多种媒体链接（m3u8、mp4、mkv、avi、mov、音频等），支持可配置的媒体类型，支持跳转到 m3u8-dl webui 下载
// @author       lzw
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @require      https://s4.zstatic.net/ajax/libs/sweetalert2/11.16.1/sweetalert2.min.js
// @require      https://cdn.tailwindcss.com/3.4.17
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // 配置存储键名
    const STORAGE_KEY_WEBUI_URL = 'm3u8_capture_webui_url';
    const STORAGE_KEY_EXCLUDE_URLS = 'm3u8_capture_exclude_urls';
    const STORAGE_KEY_PANEL_POS = 'm3u8_capture_panel_pos';
    const STORAGE_KEY_PANEL_VISIBLE = 'm3u8_capture_panel_visible';
    const STORAGE_KEY_MEDIA_EXT_LIST = 'm3u8_capture_media_ext_list';

    // 默认媒体扩展名列表
    const DEFAULT_MEDIA_EXT_LIST = ['m3u8', 'mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'm3u', 'm4a', 'aac', 'flac', 'ape', 'mp3', 'wav', 'ogg', 'wma'];

    // 获取媒体扩展名列表
    function getMediaExtList() {
        const saved = GM_getValue(STORAGE_KEY_MEDIA_EXT_LIST, null);
        if (saved && Array.isArray(saved) && saved.length > 0) {
            return saved;
        }
        return DEFAULT_MEDIA_EXT_LIST;
    }

    // 设置媒体扩展名列表
    function setMediaExtList(extList) {
        if (Array.isArray(extList) && extList.length > 0) {
            // 清理和验证扩展名
            const cleaned = extList
                .map(ext => ext.trim().toLowerCase())
                .filter(ext => ext && /^[a-z0-9]+$/i.test(ext));
            GM_setValue(STORAGE_KEY_MEDIA_EXT_LIST, cleaned);
            return cleaned;
        }
        return null;
    }

    // 获取媒体扩展名正则表达式
    function getMediaExtReg() {
        const extList = getMediaExtList();
        return new RegExp(`\\.(${extList.join('|')})(\\?|$|#)`, 'i');
    }

    // 获取 webui 地址
    function getWebuiUrl() {
        return GM_getValue(STORAGE_KEY_WEBUI_URL, 'http://localhost:6600');
    }

    // 获取排除网址规则列表
    function getExcludeUrls() {
        return GM_getValue(STORAGE_KEY_EXCLUDE_URLS, '');
    }

    // 设置排除网址规则列表
    function setExcludeUrls(urls) {
        GM_setValue(STORAGE_KEY_EXCLUDE_URLS, urls);
    }

    // 检查当前 URL 是否应该被排除
    function shouldExcludeUrl(url) {
        const currentUrl = url || window.location.href;

        // 检查是否是 WEBUI_URL
        if (currentUrl.startsWith(getWebuiUrl())) return true;

        // 检查是否匹配排除规则列表
        const excludeUrls = getExcludeUrls();
        if (!excludeUrls || !excludeUrls.trim()) return false;

        const rules = excludeUrls.split('\n').map(rule => rule.trim()).filter(rule => rule);
        for (const rule of rules) {
            try {
                if (currentUrl.includes(rule)) return true;

                // 支持正则表达式（以 / 开头和结尾）
                if (rule.startsWith('/') && rule.endsWith('/')) {
                    const regex = new RegExp(rule.slice(1, -1));
                    if (regex.test(currentUrl)) {
                        return true;
                    }
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
                navigator.clipboard.writeText(text)
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

    /** 存储抓取的媒体链接 */
    const mediaLinks = new Map();

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
        if (!url || typeof url !== 'string') return false;
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
    function getFileType(url) {
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

    /** 添加媒体链接 */
    function addMediaLink(url, title = '') {
        // 检查是否应该排除
        if (!url || shouldExcludeUrl(url)) return;

        const normalizedUrl = normalizeUrl(url);

        // 检查是否已存在
        if (mediaLinks.has(normalizedUrl)) {
            return;
        }

        // 生成标题：按优先级提取
        if (!title) {
            // 优先级1: 从 h1、h2、h1.title、h2.title 提取
            const elTitleList = ['h1.title', 'h2.title', 'h1', 'h2'];
            for (const el of elTitleList) {
                const element = document.querySelector(el);
                if (element && element.textContent) {
                    title = element.textContent.trim();
                    break;
                }
            }

            // 优先级2: 从页面 title 提取
            if (!title) {
                title = (document.title || '').split(/[-|_]/)[0].trim();
            }
        }

        mediaLinks.set(normalizedUrl, {
            url: url,
            title: title,
            type: getFileType(url),
            pageUrl: window.location.href,
            timestamp: Date.now()
        });

        // 更新 UI
        updateUI();
    }

    // 拦截 XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...args) {
        if (isMediaUrl(url)) {
            this.addEventListener('load', function () {
                if (this.status >= 200 && this.status < 300) {
                    addMediaLink(url);
                }
            });
        }
        return originalOpen.apply(this, [method, url, ...args]);
    };

    // 拦截 fetch
    const originalFetch = window.fetch;
    window.fetch = function (input, ...args) {
        const url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
        if (isMediaUrl(url)) {
            return originalFetch.apply(this, [input, ...args]).then(response => {
                if (response.ok) {
                    addMediaLink(url);
                }
                return response;
            });
        }
        return originalFetch.apply(this, [input, ...args]);
    };

    // 监听网络请求（通过 Performance API）
    function observeNetworkRequests() {
        if (typeof PerformanceObserver === 'undefined') return;

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name && isMediaUrl(entry.name)) {
                    addMediaLink(entry.name);
                }
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

    // UI 相关变量
    let panelElement = null;
    let toggleButton = null;
    let isPanelVisible = GM_getValue(STORAGE_KEY_PANEL_VISIBLE, true);
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    /** 创建圆形切换按钮（隐藏时显示） */
    function createToggleButton() {
        if (toggleButton) return;

        toggleButton = document.createElement('div');
        toggleButton.id = 'm3u8-capture-toggle-btn';
        toggleButton.innerHTML = '🎬';
        toggleButton.className = `fixed bottom-10 right-5 w-[50px] h-[50px] bg-blue-500 rounded-full flex items-center justify-center cursor-pointer z-[999998] shadow-lg text-2xl transition-all duration-200 hover:scale-110 hover:shadow-xl select-none ${isPanelVisible ? 'hidden' : 'flex'}`;

        toggleButton.addEventListener('click', () => {
            showPanel();
        });

        document.body.appendChild(toggleButton);
    }

    /** 显示面板 */
    function showPanel() {
        if (!panelElement) {
            createUI();
        }
        isPanelVisible = true;
        GM_setValue(STORAGE_KEY_PANEL_VISIBLE, true);
        if (panelElement) {
            panelElement.style.display = 'flex';
        }
        if (toggleButton) {
            toggleButton.classList.add('hidden');
        }
    }

    /** 隐藏面板 */
    function hidePanel() {
        isPanelVisible = false;
        GM_setValue(STORAGE_KEY_PANEL_VISIBLE, false);
        if (panelElement) {
            panelElement.style.display = 'none';
        }
        if (toggleButton) {
            toggleButton.classList.remove('hidden');
        }
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
        }).then((result) => {
            if (result.isConfirmed) {
                mediaLinks.clear();
                updateUI();
            }
        });
    }

    /** 创建主 UI 面板 */
    function createUI() {
        if (panelElement) return;

        const panel = document.createElement('div');
        panel.id = 'm3u8-capture-panel';

        // 恢复保存的位置
        const savedPos = GM_getValue(STORAGE_KEY_PANEL_POS, null);
        const defaultStyle = savedPos ? {
            left: savedPos.x + 'px',
            top: savedPos.y + 'px',
            right: 'auto'
        } : {
            right: '20px',
            top: '20px'
        };

        // 应用 Tailwind 类，同时保留动态位置样式
        panel.className = 'fixed w-[420px] max-w-[90vw] max-h-[85vh] bg-white border-2 border-blue-500 rounded-xl shadow-2xl z-[1059] font-sans flex flex-col';
        panel.style.cssText = `
            ${defaultStyle.left ? `left: ${defaultStyle.left};` : ''}
            ${defaultStyle.top ? `top: ${defaultStyle.top};` : ''}
            ${defaultStyle.right ? `right: ${defaultStyle.right};` : ''}
            display: ${isPanelVisible ? 'flex' : 'none'};
        `;

        panel.innerHTML = `
            <div id="m3u8-capture-header" class="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-3.5 rounded-t-lg flex justify-between items-center cursor-move select-none">
                <div class="font-semibold text-[15px] flex items-center gap-2">
                    <span>🎬</span>
                    <span>媒体链接抓取器</span>
                    <span id="m3u8-capture-count" class="bg-white bg-opacity-25 px-2 py-0.5 rounded-xl text-xs font-medium">0</span>
                </div>
                <div class="flex gap-1.5">
                    <button id="m3u8-capture-settings" class="bg-white bg-opacity-20 border-none text-white px-2.5 py-1.5 rounded-md cursor-pointer text-xs transition-colors duration-200 hover:bg-opacity-30" title="设置">⚙️</button>
                    <button id="m3u8-capture-toggle" class="bg-white bg-opacity-20 border-none text-white px-2.5 py-1.5 rounded-md cursor-pointer text-xs transition-colors duration-200 hover:bg-opacity-30" title="隐藏">−</button>
                    <button id="m3u8-capture-clear" class="bg-white bg-opacity-20 border-none text-white px-2.5 py-1.5 rounded-md cursor-pointer text-xs transition-colors duration-200 hover:bg-opacity-30" title="清空">🗑️</button>
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

        document.body.appendChild(panel);
        panelElement = panel;

        // 拖拽功能
        const header = document.getElementById('m3u8-capture-header');
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = panel.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            panel.style.cursor = 'move';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging && panelElement) {
                e.preventDefault();
                const x = e.clientX - dragOffset.x;
                const y = e.clientY - dragOffset.y;

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
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                if (panelElement) {
                    panelElement.style.cursor = 'default';
                }
            }
        });

        // 按钮事件
        document.getElementById('m3u8-capture-toggle').addEventListener('click', () => {
            hidePanel();
        });

        document.getElementById('m3u8-capture-clear').addEventListener('click', () => {
            clearList();
        });

        document.getElementById('m3u8-capture-settings').addEventListener('click', () => {
            showSettings();
        });
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
            }
        }).then((result) => {
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
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: '保存失败',
                        text: '媒体扩展名列表格式错误',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            }
        });
    }

    function updateUI() {
        if (!panelElement) {
            if (document.body) {
                createUI();
            } else {
                return;
            }
        }

        const list = document.getElementById('m3u8-capture-list');
        const empty = document.getElementById('m3u8-capture-empty');
        const count = document.getElementById('m3u8-capture-count');

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
            itemDiv.className = 'border border-gray-200 rounded-lg p-3 bg-white transition-all duration-200 shadow-sm hover:bg-gray-50 hover:shadow-md';

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
                if (opened && !opened.closed) {
                    return true;
                }
            } catch (e) {
                console.log('[M3U8 Capture] window.open failed:', e);
            }

            // 方法2: 如果在 iframe 中，尝试在父窗口打开
            if (isInIframe) {
                try {
                    const opened = window.top.open(targetUrl, '_blank');
                    if (opened && !opened.closed) {
                        return true;
                    }
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
                    confirmButtonText: '确定'
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
                        confirmButtonText: '确定'
                    });
                });

            return false;
        }

        // 绑定下载按钮事件
        document.querySelectorAll('.m3u8-capture-download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = decodeURIComponent(btn.getAttribute('data-url'));
                const title = decodeURIComponent(btn.getAttribute('data-title'));
                const downloadUrl = `${getWebuiUrl()}/#/page/download?action=new&url=${encodeURIComponent(url + (title ? `|${title}` : ''))}`;
                safeOpenUrl(downloadUrl);
            });
        });

        // 绑定复制按钮事件
        document.querySelectorAll('.m3u8-capture-copy-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const url = btn.getAttribute('data-url');
                const originalText = btn.textContent;
                const originalClassName = btn.className;

                try {
                    await copyToClipboard(url);
                    // 复制成功，更新按钮状态
                    btn.textContent = '已复制';
                    btn.className = 'm3u8-capture-copy-btn bg-green-500 text-white border-none px-3.5 py-2 rounded-md cursor-pointer text-xs transition-all duration-200';
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.className = originalClassName;
                    }, 2000);
                } catch (err) {
                    // 复制失败，提示用户
                    Swal.fire({
                        icon: 'error',
                        title: '复制失败',
                        text: '请手动复制链接',
                        html: `<code style="word-break: break-all; background: #f3f4f6; padding: 8px; border-radius: 4px; display: block; font-size: 12px;">${url}</code>`,
                        confirmButtonText: '确定'
                    });
                }
            });
        });
    }

    function loadCSS(url) {
        document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" type="text/css" href="${url}">`);
    }

    /** 初始化 */
    function init() {
        // 检查当前页面是否应该被排除
        if (shouldExcludeUrl()) return;

        // 监听网络请求
        observeNetworkRequests();

        /** 等待 DOM 加载完成后创建 UI */
        function initUI() {
            // 再次检查（可能在 DOM 加载期间 URL 变化了）
            if (shouldExcludeUrl()) return;

            if (document.body) {
                // loadCSS('https://s4.zstatic.net/ajax/libs/tailwindcss/2.2.19/tailwind.min.css');
                loadCSS('https://s4.zstatic.net/ajax/libs/sweetalert2/11.16.1/sweetalert2.min.css');
                createUI();
                if (!isPanelVisible) createToggleButton();

                scanPageForMedias();
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initUI);
        } else {
            // 延迟一下确保 body 存在
            setTimeout(initUI, 100);
        }

        // 监听页面变化（SPA 应用）
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                // 检查新 URL 是否应该被排除
                if (shouldExcludeUrl()) {
                    // 隐藏面板
                    if (panelElement) hidePanel();
                    return;
                }
                setTimeout(() => scanPageForMedias(), 1000);
            }
        }).observe(document, { subtree: true, childList: true });

        // 定期扫描页面（捕获动态加载的内容）
        setInterval(() => {
            if (document.body && !shouldExcludeUrl()) scanPageForMedias();
        }, 5000);
    }

    init();
})();
