<template>
  <div v-if="visible" class="fixed inset-0 bg-black z-100 flex flex-col" @keydown.esc="handleClose" tabindex="0">
    <!-- 顶部控制栏 -->
    <div class="flex items-center justify-between bg-gray-900 text-white px-4 py-2 flex-shrink-0">
      <div class="flex items-center gap-4 flex-1 min-w-0">
        <button @click="handleClose"
          class="text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
          :title="$t('common.close')">
          <i class="fas fa-times"></i>
        </button>
        <h2 class="text-sm md:text-base font-semibold truncate flex-1">
          {{ currentTask?.filename || currentTask?.showName || '视频播放' }}
        </h2>
      </div>
      <div class="flex items-center gap-2">
        <button v-if="videoList.length > 1" @click="togglePlaylist"
          class="text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
          :title="showPlaylist ? '隐藏列表' : '显示列表'">
          <i class="fas" :class="showPlaylist ? 'fa-list-ul' : 'fa-list'"></i>
        </button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- 视频播放区域 -->
      <div class="flex-1 relative">
        <iframe ref="playerIframe" :src="iframeSrc" class="w-full h-full border-0" allowfullscreen></iframe>
      </div>

      <!-- 遮罩层 - 仅小屏幕显示 -->
      <div v-if="videoList.length > 1"
        :class="{ 'playlist-overlay-visible': showPlaylist }"
        class="playlist-overlay md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        @click="togglePlaylist">
      </div>

      <!-- 视频列表侧边栏 -->
      <div v-if="videoList.length > 1"
        :class="{ 'playlist-sidebar-visible': showPlaylist }"
        ref="playlistSidebar"
        class="playlist-sidebar w-80 bg-gray-900 text-white overflow-y-auto flex-shrink-0 border-l border-gray-700">
          <div class="p-4">
            <!-- 标题栏 -->
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-300">播放列表 ({{ videoList.length }})</h3>
              <!-- 关闭按钮 - 仅小屏幕显示 -->
              <button @click="togglePlaylist"
                class="md:hidden text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
                :title="$t('common.close')">
                <i class="fas fa-times"></i>
              </button>
            </div>

            <div class="space-y-2">
              <div v-for="task in videoList" :key="task.url"
                :data-task-url="task.url"
                :class="[
                'p-3 rounded-lg transition-colors relative',
                currentTask?.url === task.url
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
              ]">
                <div class="flex items-start justify-between cursor-pointer gap-2" @click="switchVideo(task)">
                  <div class="flex-1 min-w-0 flex flex-col gap-1">
                    <div class="flex items-center">
                      <div class="font-medium text-sm truncate flex-1">
                        {{ task.filename || task.showName || task.url }}
                      </div>
                      <button @click.stop="toggleTaskFavorite(task.url)"
                        class="flex transition-colors p-1 flex-shrink-0 rounded-lg hover:bg-yellow-500/20"
                        :class="isTaskFavorite(task.url) ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-yellow-400'"
                        :title="isTaskFavorite(task.url) ? $t('completedList.removeFavorite') : $t('completedList.addFavorite')">
                        <i class="text-xs" :class="isTaskFavorite(task.url) ? 'fas fa-star' : 'far fa-star'"></i>
                      </button>
                      <button v-if="task.status === 'done' && !task.errmsg" @click.stop="showRenameDialog(task)"
                        class="flex text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg transition-colors p-1 flex-shrink-0"
                        :title="$t('completedList.rename')">
                        <i class="fas fa-edit text-xs"></i>
                      </button>
                    </div>
                    <div class="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                      <span v-if="task.status" class="px-1.5 py-0.5 rounded text-xs"
                        :class="getStatusClass(task.status)">
                        {{ getStatusText(task.status) }}
                      </span>
                      <span>{{ task.progress || 0 }}%</span>
                      <span v-if="task.downloadedSize || task.size" class="text-gray-400">
                        {{ formatSize(task.downloadedSize || task.size || 0) }}
                      </span>
                    </div>
                  </div>
                  <i v-if="currentTask?.url === task.url"
                    class="fas fa-play text-blue-300 flex-shrink-0 absolute right-2 bottom-2"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
    <!-- 重命名对话框 -->
    <RenameDialog :visible="showRenameModal" :task="renameTask" @close="closeRenameDialog"
      @success="handleRenameSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTasksStore } from '@/stores/tasks';
import { formatSize } from '@/utils/format';
import { useFavoritesStore } from '@/stores/favorites';
import RenameDialog from './RenameDialog.vue';
import type { DownloadTask } from '@/types/task';

const { t } = useI18n();
const tasksStore = useTasksStore();
const favoritesStore = useFavoritesStore();

const props = defineProps<{
  visible: boolean;
  initialUrl: string;
  initialTask?: DownloadTask | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const playerIframe = ref<HTMLIFrameElement | null>(null);
const playlistSidebar = ref<HTMLElement | null>(null);
const showPlaylist = ref(true);
const currentTask = ref<DownloadTask | null>(null);
const currentUrl = ref<string>('');
const showRenameModal = ref(false);
const renameTask = ref<DownloadTask | null>(null);

// 计算 iframe 的 src
const iframeSrc = computed(() => {
  if (!currentUrl.value) return '';
  return `/play.html?url=${encodeURIComponent(currentUrl.value)}`;
});

// 获取视频列表：相同保存目录且进度>20%
const videoList = computed(() => {
  if (!currentTask.value) return [];

  const currentSaveDir = currentTask.value.dlOptions?.saveDir || currentTask.value.options?.saveDir;
  if (!currentSaveDir) {
    // 如果没有保存目录，只返回当前任务
    return [currentTask.value];
  }

  const allTasks = Object.values(tasksStore.tasks);
  const filtered = allTasks.filter(task => {
    // 必须有本地文件路径
    if (!task.localVideo && !task.localM3u8) return false;

    // 进度必须大于20%
    const progress = task.progress || 0;
    if (progress < 20) return false;

    // 保存目录必须相同
    const taskSaveDir = task.dlOptions?.saveDir || task.options?.saveDir;
    return taskSaveDir === currentSaveDir;
  });

  // 确保当前任务在列表中（即使不满足其他条件）
  const currentInList = filtered.some(t => t.url === currentTask.value?.url);
  if (!currentInList && currentTask.value) {
    filtered.push(currentTask.value);
  }

  // 按文件名排序
  return filtered.sort((a, b) => {
    const nameA = (a.filename || a.showName || '').toLowerCase();
    const nameB = (b.filename || b.showName || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
});

// 初始化当前任务和URL
watch(
  () => [props.visible, props.initialUrl, props.initialTask],
  ([visible, url, task]) => {
    if (visible) {
      currentUrl.value = url as string;
      currentTask.value = (task as unknown as DownloadTask) || null;

      // 如果没有传入 task，尝试从 store 中查找
      if (!currentTask.value && url) {
        const allTasks = Object.values(tasksStore.tasks);
        currentTask.value = allTasks.find(t => {
          const localPath = t.localVideo || t.localM3u8;
          if (!localPath) return false;
          const taskUrl = `${location.origin}/localplay/${localPath}`;
          return taskUrl === url;
        }) || null;
      }

      // 初始化后滚动到当前项
      scrollToCurrentItem(350);
    }
  },
  { immediate: true }
);

// 监听播放列表显示状态，显示时滚动到当前项
watch(showPlaylist, (newVal) => {
  // 等待 Transition 动画完成后再滚动（约 300ms）
  if (newVal) scrollToCurrentItem(350);
});

// 滚动到当前播放项
async function scrollToCurrentItem(delay = 0) {
  if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
  if (!currentTask.value || !playlistSidebar.value || videoList.value.length < 5) return;

  nextTick(() => {
    const currentItem = playlistSidebar.value?.querySelector(
      `[data-task-url="${currentTask.value?.url}"]`
    ) as HTMLElement;

    if (currentItem) {
      currentItem.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  });
}

// 切换视频
function switchVideo(task: DownloadTask) {
  if (task.url === currentTask.value?.url) return;

  const localPath = task.localVideo || task.localM3u8;
  if (!localPath) {
    console.error('[VideoPlayer] switchVideo: task 缺少本地文件路径', task);
    return;
  }

  const url = `${location.origin}/localplay/${localPath}`;
  // if (!currentUrl.value) currentUrl.value = url;
  currentTask.value = task;

  // 通过 postMessage 通知 iframe 切换视频
  if (playerIframe.value?.contentWindow) {
    playerIframe.value.contentWindow.postMessage(
      {
        url: url,
        playType: url.includes('dplayer') ? 'dplayer' : 'artplayer',
      },
      '*'
    );
  } else {
    currentUrl.value = url;
  }

  scrollToCurrentItem();
}

// 监听来自 iframe 的消息（用于处理播放完毕等事件）
function handleIframeMessage(event: MessageEvent) {
  // 验证消息来源（可选，根据实际需求）
  // if (event.origin !== location.origin) return;

  const data = event.data;
  if (!data || typeof data !== 'object') return;

  // 处理播放完毕事件，自动播放下一集
  if (data.action === 'next' || data.action === 'previous') {
    const currentIndex = videoList.value.findIndex(t => t.url === currentTask.value?.url);
    if (currentIndex === -1) return;

    if (data.action === 'next') {
      const nextIndex = currentIndex + 1;
      if (nextIndex < videoList.value.length) {
        switchVideo(videoList.value[nextIndex]);
      }
    } else if (data.action === 'previous') {
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        switchVideo(videoList.value[prevIndex]);
      }
    }
  }
}

// 切换播放列表显示
function togglePlaylist() {
  showPlaylist.value = !showPlaylist.value;
}

// 关闭播放器
function handleClose() {
  emit('close');
}

// 重命名相关函数
function showRenameDialog(task: DownloadTask) {
  if (task.status === 'done' && !task.errmsg) {
    renameTask.value = task;
    showRenameModal.value = true;
  }
}

function closeRenameDialog() {
  showRenameModal.value = false;
  renameTask.value = null;
}

function handleRenameSuccess() {
  // 重命名成功，关闭对话框
  closeRenameDialog();
}

// 收藏相关函数
function isTaskFavorite(url: string): boolean {
  return favoritesStore.isFavorite(url);
}

function toggleTaskFavorite(url: string) {
  favoritesStore.toggleFavorite(url);
}

// 状态文本和样式
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    resume: t('download.status.resume'),
    pending: t('download.status.pending'),
    pause: t('download.status.pause'),
    error: t('download.status.error'),
    done: t('download.status.done'),
  };
  return statusMap[status] || status;
}

function getStatusClass(status: string): string {
  const classMap: Record<string, string> = {
    resume: 'bg-green-500/20 text-green-300',
    pending: 'bg-yellow-500/20 text-yellow-300',
    pause: 'bg-gray-500/20 text-gray-300',
    error: 'bg-red-500/20 text-red-300',
    done: 'bg-blue-500/20 text-blue-300',
  };
  return classMap[status] || 'bg-gray-500/20 text-gray-300';
}

// 监听消息
onMounted(() => {
  window.addEventListener('message', handleIframeMessage);
});

onUnmounted(() => {
  window.removeEventListener('message', handleIframeMessage);
});
</script>

<style scoped>
/* 确保全屏显示 */
.fixed.inset-0 {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* 遮罩层动画 */
.playlist-overlay {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              visibility 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.playlist-overlay.playlist-overlay-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

/* 侧边栏基础样式和动画 */
.playlist-sidebar {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              border-left-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity, width;
}

/* 大屏幕时的侧边栏动画 */
@media (min-width: 768px) {
  .playlist-sidebar {
    opacity: 0;
    width: 0;
    min-width: 0;
    margin-right: 0;
    border-left-color: transparent;
    overflow: hidden;
  }

  .playlist-sidebar.playlist-sidebar-visible {
    opacity: 1;
    width: 20rem; /* w-80 */
    min-width: 20rem;
    margin-right: 0;
    border-left-color: rgb(55 65 81); /* border-gray-700 */
  }
}

/* 小屏幕时的侧边栏动画 */
@media (max-width: 767px) {
  .playlist-sidebar {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
    border-left: none;
    width: 85vw;
    max-width: 320px;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
    opacity: 0;
    transform: translateX(100%);
    visibility: hidden;
    pointer-events: none;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                visibility 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .playlist-sidebar.playlist-sidebar-visible {
    opacity: 1;
    transform: translateX(0);
    visibility: visible;
    pointer-events: auto;
  }
}
</style>
