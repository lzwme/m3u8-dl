<template>
  <Layout @new-download="showNewDownloadDialog">
    <div class="p-1 md:p-2">
      <TaskList
        @new-download="showNewDownloadDialog"
        @pause="handlePause"
        @resume="handleResume"
        @delete="handleDelete"
        @clear-queue="handleClearQueue"
        @show-detail="showTaskDetail"
        @local-play="handleLocalPlay"
      />
      <TaskDetailModal :visible="showDetailModal" :task="selectedTask" @close="showDetailModal = false" />
      <DeleteConfirmDialog
        :visible="showDeleteDialog"
        :count="deleteUrls.length"
        @close="showDeleteDialog = false"
        @confirm="handleDeleteConfirm"
      />
      <ConfirmDialog
        :visible="showPlayConfirmDialog"
        :title="$t('confirm.play')"
        @close="showPlayConfirmDialog = false"
        @confirm="handlePlayConfirm"
      >
        <template #default>
          <p v-if="playErrorText" class="text-red-600 font-medium mb-2 whitespace-pre-line">{{ playErrorText }}</p>
          <p class="text-gray-600 whitespace-pre-line">{{ playConfirmMessage }}</p>
        </template>
      </ConfirmDialog>
      <VideoPlayer
        :visible="showVideoPlayer"
        :initial-url="playUrl"
        :initial-task="playTask"
        @close="showVideoPlayer = false"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import Layout from '@/components/Layout.vue';
import TaskList from '@/components/TaskList.vue';
import TaskDetailModal from '@/components/TaskDetailModal.vue';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import VideoPlayer from '@/components/VideoPlayer.vue';
import { useTasksStore } from '@/stores/tasks';
import { useConfigStore } from '@/stores/config';
import { useWebSocket } from '@/composables/useWebSocket';
import { pauseDownload, resumeDownload, deleteDownload, clearQueue, fetchTasks } from '@/utils/request';
import { toast } from '@/utils/toast';
import type { DownloadTask } from '@/types/task';

const { t } = useI18n();

const tasksStore = useTasksStore();
const configStore = useConfigStore();

// 注入全局显示下载对话框的方法
const showGlobalNewDownload = inject<(data?: { url?: string; title?: string }) => void>('showGlobalNewDownload');
const showDetailModal = ref(false);
const showDeleteDialog = ref(false);
const showPlayConfirmDialog = ref(false);
const showVideoPlayer = ref(false);
const selectedTask = ref<DownloadTask | null>(null);
const deleteUrls = ref<string[]>([]);
const pendingPlayData = ref<{ task: DownloadTask; url: string } | null>(null);
const playConfirmMessage = ref('');
const playErrorText = ref('');
const playUrl = ref('');
const playTask = ref<DownloadTask | null>(null);

onMounted(async () => {
  // WebSocket 连接已在 App.vue 中初始化，这里只需要确保连接存在
  const { connect } = useWebSocket(configStore.token || '');
  // 如果连接未建立，尝试连接（通常已经在 App.vue 中连接了）
  connect();

  // 作为备用，只在 store 中没有任务时才主动获取一次任务列表
  // 如果 store 中已有任务，说明 WebSocket 已经同步了数据，不需要重新获取
  const currentTaskCount = Object.keys(tasksStore.tasks).length;
  if (currentTaskCount === 0) {
    try {
      console.log('[Download] store 中没有任务，开始获取任务列表...');
      const tasks = await fetchTasks();
      console.log('[Download] 获取到的任务数据:', tasks);
      // 只有当获取到的任务数据不为空时才更新 store
      if (tasks && typeof tasks === 'object' && Object.keys(tasks).length > 0) {
        tasksStore.setTasks(tasks);
        console.log('[Download] 任务数据已设置到 store，任务数量:', Object.keys(tasks).length);
      } else {
        console.log('[Download] 获取到的任务数据为空，保留现有数据');
      }
    } catch (error) {
      console.error('[Download] 获取任务列表失败:', error);
    }
  } else {
    console.log(`[Download] store 中已有 ${currentTaskCount} 个任务，跳过获取`);
  }

  initElectronEvents();
});

function showNewDownloadDialog() {
  // 使用全局的下载对话框
  if (showGlobalNewDownload) {
    showGlobalNewDownload();
  }
}


async function handlePause(urls: string[] | 'all') {
  const urlList = urls === 'all' ? ['all'] : urls;
  const result = await pauseDownload(urlList, urls === 'all');
  if (!result.code) {
    toast({ text: result.message || t('toast.pauseSuccess'), type: 'success' });
    if (Array.isArray(urls) && urls === tasksStore.selectedTasks) {
      tasksStore.clearSelection();
    }
  }
}

async function handleResume(urls: string[] | 'all') {
  const urlList = urls === 'all' ? ['all'] : urls;
  const result = await resumeDownload(urlList, urls === 'all');
  if (!result.code) {
    toast({ text: result.message || t('toast.resumeSuccess'), type: 'success' });
    if (Array.isArray(urls) && urls === tasksStore.selectedTasks) {
      tasksStore.clearSelection();
    }
  }
}

function handleDelete(urls: string[]) {
  if (!urls.length) return;
  deleteUrls.value = urls;
  showDeleteDialog.value = true;
}

async function handleDeleteConfirm(options: { deleteCache: boolean; deleteVideo: boolean }) {
  const result = await deleteDownload(deleteUrls.value, options.deleteCache, options.deleteVideo);
  if (!result.code) {
    toast({ text: result.message || t('toast.deleteSuccess'), type: 'success' });
    tasksStore.deleteTasks(deleteUrls.value);
    if (deleteUrls.value === tasksStore.selectedTasks) {
      tasksStore.clearSelection();
    }
  }
  deleteUrls.value = [];
}

async function handleClearQueue() {
  const result = await clearQueue();
  if (!result.code) {
    toast({ text: result.message || t('toast.clearQueueSuccess'), type: 'success' });
  } else {
    toast({ text: result.message || t('toast.clearQueueFailed'), type: 'error' });
  }
}

function showTaskDetail(task: DownloadTask) {
  selectedTask.value = task;
  showDetailModal.value = true;
}

function handleLocalPlay(data: { task: DownloadTask; url: string }) {
  const { task, url } = data;

  // 如果任务状态为异常，显示确认对话框
  if (task.status === 'error') {
    playErrorText.value = task.errmsg ? t('confirm.playError', { error: task.errmsg }) : '';
    playConfirmMessage.value = t('confirm.playConfirmMessage');
    pendingPlayData.value = { task, url };
    showPlayConfirmDialog.value = true;
    return;
  }

  // 正常状态直接播放
  doPlay(url, task);
}

function handlePlayConfirm() {
  if (pendingPlayData.value) {
    doPlay(pendingPlayData.value.url, pendingPlayData.value.task);
    pendingPlayData.value = null;
  }
}

function doPlay(url: string, task?: DownloadTask | null) {
  playUrl.value = url;
  playTask.value = task || null;
  showVideoPlayer.value = true;
}

function initElectronEvents() {
  if (window.electron) {
    const ipc = window.electron.ipc;
    ipc.on('message', (ev: any) => {
      if (typeof ev.data === 'string') {
        toast({ text: ev.data, type: 'info' });
      } else {
        console.log(ev.data);
      }
    });

    ipc.on('downloadProgress', (data: any) => {
      console.log('downloadProgress', data);
    });
  }
}
</script>
