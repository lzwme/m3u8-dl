<template>
  <div v-if="isElectron" class="web-browser-container border border-gray-300 rounded-lg p-4 mb-4 bg-white">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold text-gray-800">
        <i class="fas fa-globe mr-2"></i>网页浏览提取下载地址
      </h3>
      <div class="flex gap-2">
        <button
          v-if="browserVisible"
          @click="hideBrowser"
          class="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        >
          <i class="fas fa-eye-slash mr-1"></i>隐藏浏览器
        </button>
        <button
          v-else-if="currentUrl"
          @click="showBrowser"
          class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          <i class="fas fa-eye mr-1"></i>显示浏览器
        </button>
        <button
          v-if="loading"
          @click="stopLoading"
          class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          <i class="fas fa-stop mr-1"></i>停止
        </button>
      </div>
    </div>

    <div class="flex gap-2 mb-3">
      <input
        v-model="url"
        type="text"
        placeholder="输入网页地址，将自动提取页面中的 m3u8 和 mp4 视频链接"
        class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        :disabled="loading"
        @keyup.enter="loadUrl"
      />
      <button
        @click="loadUrl"
        :disabled="loading || !url.trim()"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? '加载中...' : '加载' }}
      </button>
    </div>

    <!-- 导航控制 -->
    <div v-if="currentUrl" class="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
      <div class="flex items-center gap-2 mb-2">
        <button
          @click="goBack"
          :disabled="!canGoBack"
          class="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="后退"
        >
          <i class="fas fa-arrow-left"></i>
        </button>
        <button
          @click="goForward"
          :disabled="!canGoForward"
          class="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="前进"
        >
          <i class="fas fa-arrow-right"></i>
        </button>
        <button
          @click="reload"
          class="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
          title="刷新"
        >
          <i class="fas fa-sync-alt"></i>
        </button>
        <div class="flex-1 text-xs text-gray-600 truncate ml-2" :title="currentUrl">
          <i class="fas fa-link mr-1"></i>{{ currentUrl }}
        </div>
      </div>
      <div v-if="pageTitle" class="text-xs text-gray-500">
        <i class="fas fa-file-alt mr-1"></i>{{ pageTitle }}
      </div>
    </div>

    <div v-if="error" class="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
      <i class="fas fa-exclamation-circle mr-2"></i>{{ error }}
    </div>

    <div v-if="m3u8List.length > 0" class="mt-4">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-3">
          <h4 class="text-sm font-semibold text-gray-700">
            找到 {{ m3u8List.length }} 个视频链接
          </h4>
          <label class="flex items-center gap-1 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              :checked="allSelected"
              @change="toggleSelectAll"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>全选</span>
          </label>
          <span v-if="selectedCount > 0" class="text-sm text-blue-600 font-medium">
            已选择 {{ selectedCount }} 个
          </span>
        </div>
        <div class="flex gap-2">
          <button
            v-if="selectedCount > 0"
            @click="batchDownload"
            class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            批量下载 ({{ selectedCount }})
          </button>
          <button
            @click="clearList"
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            清空列表
          </button>
        </div>
      </div>
      <div class="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
        <div
          v-for="(item, index) in m3u8List"
          :key="index"
          class="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          :class="{ 'bg-blue-50': isSelected(index) }"
        >
          <div class="flex items-start gap-3">
            <input
              type="checkbox"
              :checked="isSelected(index)"
              @change="toggleSelect(index)"
              @click.stop
              class="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div class="flex-1 min-w-0 cursor-pointer" @click="selectM3u8(item)">
              <div class="flex items-center gap-2 mb-1">
                <div class="text-sm font-medium text-gray-800 truncate" :title="item.title">
                  {{ item.title || `视频 ${index + 1}` }}
                </div>
                <span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded" :title="getFileType(item.url)">
                  {{ getFileType(item.url).toUpperCase() }}
                </span>
              </div>
              <div class="text-xs text-gray-500 truncate" :title="item.url">
                {{ item.url }}
              </div>
              <div v-if="item.pageUrl && item.pageUrl !== currentUrl" class="text-xs text-gray-400 mt-1 truncate" :title="item.pageUrl">
                来源: {{ item.pageUrl }}
              </div>
            </div>
            <button
              @click.stop="selectM3u8(item)"
              class="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm whitespace-nowrap"
            >
              下载
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading && url" class="text-sm text-gray-500 text-center py-4">
      暂无提取到的视频链接，请等待页面加载完成或尝试其他网页
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { toast } from '@/utils/toast';

defineProps<{
  visible?: boolean;
}>();

const emit = defineEmits<{
  (e: 'batch-download', data: Array<{ url: string; title: string }>): void;
}>();

const isElectron = computed(() => typeof window !== 'undefined' && !!window.electron);
const url = ref('');
const loading = ref(false);
const error = ref('');
const pageTitle = ref('');
const currentUrl = ref('');
const browserVisible = ref(false);
const canGoBack = ref(false);
const canGoForward = ref(false);
const m3u8List = ref<Array<{ url: string; title: string; pageUrl?: string }>>([]);
const selectedIndices = ref<Set<number>>(new Set());

function loadUrl() {
  const targetUrl = url.value.trim();
  if (!targetUrl) {
    toast({ text: '请输入网页地址', type: 'error' });
    return;
  }

  if (!/^https?:\/\//.test(targetUrl)) {
    toast({ text: '请输入正确的网页地址（以 http:// 或 https:// 开头）', type: 'error' });
    return;
  }

  if (!isElectron.value) {
    toast({ text: '此功能仅在 Electron 客户端中可用', type: 'error' });
    return;
  }

  loading.value = true;
  error.value = '';
  pageTitle.value = '';
  // 注意：不清空 m3u8List，保留之前收集的链接
  currentUrl.value = targetUrl;
  browserVisible.value = true;

  window.electron?.ipc.send('web-browser:load', targetUrl);
}

function stopLoading() {
  if (isElectron.value) {
    window.electron?.ipc.send('web-browser:stop');
  }
  loading.value = false;
}

function clearList() {
  m3u8List.value = [];
  selectedIndices.value.clear();
}

function selectM3u8(item: { url: string; title: string }) {
  // 统一使用 batch-download 事件，即使是单个视频也作为数组传递
  emit('batch-download', [{
    url: item.url,
    title: item.title || '未命名视频',
  }]);
}

function isSelected(index: number): boolean {
  return selectedIndices.value.has(index);
}

function toggleSelect(index: number) {
  if (selectedIndices.value.has(index)) {
    selectedIndices.value.delete(index);
  } else {
    selectedIndices.value.add(index);
  }
}

function toggleSelectAll(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) {
    // 全选
    selectedIndices.value = new Set(m3u8List.value.map((_, index) => index));
  } else {
    // 取消全选
    selectedIndices.value.clear();
  }
}

const allSelected = computed(() => {
  return m3u8List.value.length > 0 && selectedIndices.value.size === m3u8List.value.length;
});

const selectedCount = computed(() => {
  return selectedIndices.value.size;
});

function batchDownload() {
  if (selectedIndices.value.size === 0) {
    toast({ text: '请至少选择一个视频链接', type: 'error' });
    return;
  }

  const selectedItems = Array.from(selectedIndices.value)
    .map(index => m3u8List.value[index])
    .map(item => ({
      url: item.url,
      title: item.title || '未命名视频',
    }));

  emit('batch-download', selectedItems);
  // 下载后清空选择
  selectedIndices.value.clear();
}

// 获取文件类型
function getFileType(url: string): string {
  if (/\.m3u8(\?|$|#)/i.test(url)) {
    return 'm3u8';
  } else if (/\.mp4(\?|$|#)/i.test(url)) {
    return 'mp4';
  }
  return 'video';
}

// 规范化 URL 用于去重比较（去除查询参数中的时间戳等动态参数）
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // 保留基础路径，去除查询参数（因为很多查询参数是动态的，如时间戳、token等）
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch {
    // 如果 URL 解析失败，返回原 URL
    return url;
  }
}

function handleM3u8Found(data: { url: string; title: string; pageUrl?: string }) {
  // 规范化 URL 进行比较，实现去重
  const normalizedUrl = normalizeUrl(data.url);
  const exists = m3u8List.value.some(item => {
    const itemNormalized = normalizeUrl(item.url);
    return itemNormalized === normalizedUrl;
  });

  if (!exists) {
    m3u8List.value.push({
      url: data.url,
      title: data.title || pageTitle.value || '未命名视频',
      pageUrl: data.pageUrl || currentUrl.value,
    });
    toast({ text: `发现新的视频链接: ${data.title || '未命名视频'}`, type: 'success' });
  }
  // 注意：新添加的链接不会自动选中，需要用户手动选择
}

function handlePageTitle(title: string) {
  pageTitle.value = title;
  // 更新已存在的 m3u8 项的标题（如果标题为空）
  m3u8List.value.forEach(item => {
    if (!item.title || item.title === '未命名视频') {
      item.title = title || '未命名视频';
    }
  });
}

function handleUrlChanged(url: string) {
  currentUrl.value = url;
}

function handleNavigation(data: { url: string }) {
  currentUrl.value = data.url;
}

function handleBrowserClosed() {
  browserVisible.value = false;
  currentUrl.value = '';
  pageTitle.value = '';
  canGoBack.value = false;
  canGoForward.value = false;
}

function handleNavigationState(data: { canGoBack: boolean; canGoForward: boolean }) {
  canGoBack.value = data.canGoBack;
  canGoForward.value = data.canGoForward;
}

function showBrowser() {
  if (isElectron.value) {
    window.electron?.ipc.send('web-browser:show');
    browserVisible.value = true;
  }
}

function hideBrowser() {
  if (isElectron.value) {
    window.electron?.ipc.send('web-browser:hide');
    browserVisible.value = false;
  }
}

function goBack() {
  if (isElectron.value) {
    window.electron?.ipc.send('web-browser:go-back');
  }
}

function goForward() {
  if (isElectron.value) {
    window.electron?.ipc.send('web-browser:go-forward');
  }
}

function reload() {
  if (isElectron.value) {
    window.electron?.ipc.send('web-browser:reload');
  }
}

function handleLoading(data: { loading: boolean }) {
  loading.value = data.loading;
  if (!data.loading) {
    // 加载完成
    if (m3u8List.value.length === 0) {
      toast({ text: '页面加载完成，但未发现视频链接', type: 'info' });
    } else {
      toast({ text: `页面加载完成，共发现 ${m3u8List.value.length} 个视频链接`, type: 'success' });
    }
  }
}

function handleError(data: { code: number; description: string }) {
  error.value = `加载失败: ${data.description || `错误代码 ${data.code}`}`;
  loading.value = false;
  toast({ text: error.value, type: 'error' });
}

onMounted(() => {
  if (isElectron.value && window.electron) {
    const ipc = window.electron.ipc;
    ipc.on('web-browser:m3u8-found', handleM3u8Found);
    ipc.on('web-browser:page-title', handlePageTitle);
    ipc.on('web-browser:loading', handleLoading);
    ipc.on('web-browser:error', handleError);
    ipc.on('web-browser:url-changed', handleUrlChanged);
    ipc.on('web-browser:navigation', handleNavigation);
    ipc.on('web-browser:closed', handleBrowserClosed);
    ipc.on('web-browser:navigation-state', handleNavigationState);
  }
});

onUnmounted(() => {
  if (isElectron.value && window.electron) {
    const ipc = window.electron.ipc;
    ipc.removeAllListeners('web-browser:m3u8-found');
    ipc.removeAllListeners('web-browser:page-title');
    ipc.removeAllListeners('web-browser:loading');
    ipc.removeAllListeners('web-browser:error');
    ipc.removeAllListeners('web-browser:url-changed');
    ipc.removeAllListeners('web-browser:navigation');
    ipc.removeAllListeners('web-browser:closed');
    ipc.removeAllListeners('web-browser:navigation-state');
  }
});
</script>

<style scoped>
.web-browser-container {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
