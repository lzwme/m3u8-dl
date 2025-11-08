<template>
  <Layout @new-download="showNewDownloadDialog">
    <div class="p-1 md:p-2">
      <WebBrowser @select-m3u8="handleSelectM3u8" />
      <TaskList
        @new-download="showNewDownloadDialog"
        @pause="handlePause"
        @resume="handleResume"
        @delete="handleDelete"
        @clear-queue="handleClearQueue"
        @show-detail="showTaskDetail"
        @local-play="handleLocalPlay"
      />
      <NewDownloadDialog
        :visible="showDialog"
        :initial-data="dialogInitialData"
        @close="handleCloseDialog"
        @submit="handleStartDownload"
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
        title="确认播放"
        @close="showPlayConfirmDialog = false"
        @confirm="handlePlayConfirm"
      >
        <template #default>
          <p v-if="playErrorText" class="text-red-600 font-medium mb-2 whitespace-pre-line">{{ playErrorText }}</p>
          <p class="text-gray-600 whitespace-pre-line">{{ playConfirmMessage }}</p>
        </template>
      </ConfirmDialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Layout from '@/components/Layout.vue';
import TaskList from '@/components/TaskList.vue';
import NewDownloadDialog from '@/components/NewDownloadDialog.vue';
import TaskDetailModal from '@/components/TaskDetailModal.vue';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import WebBrowser from '@/components/WebBrowser.vue';
import { useTasksStore } from '@/stores/tasks';
import { useConfigStore } from '@/stores/config';
import { useWebSocket } from '@/composables/useWebSocket';
import { pauseDownload, resumeDownload, deleteDownload, startDownload, clearQueue, fetchTasks } from '@/utils/request';
import { toast } from '@/utils/toast';
import type { DownloadTask } from '@/types/task';

const tasksStore = useTasksStore();
const configStore = useConfigStore();

const showDialog = ref(false);
const showDetailModal = ref(false);
const showDeleteDialog = ref(false);
const showPlayConfirmDialog = ref(false);
const selectedTask = ref<DownloadTask | null>(null);
const deleteUrls = ref<string[]>([]);
const pendingPlayData = ref<{ task: DownloadTask; url: string } | null>(null);
const playConfirmMessage = ref('');
const playErrorText = ref('');
const dialogInitialData = ref<{ url?: string; title?: string } | undefined>(undefined);

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
  dialogInitialData.value = undefined;
  showDialog.value = true;
}

function handleCloseDialog() {
  showDialog.value = false;
  dialogInitialData.value = undefined;
}

async function handleStartDownload(list: any[]) {
  try {
    list.forEach((item) => {
      if (!/\.html?$/.test(item.url)) {
        tasksStore.updateTask(item.url, {
          status: 'resume',
          progress: 0,
          speed: 0,
          remainingTime: 0,
          size: 0,
        });
      }
    });
    const result = await startDownload(list);
    if (!result.code) {
      toast({ text: result.message || '批量下载已开始', type: 'success' });
    } else {
      toast({ text: result.message || '下载失败', type: 'error' });
    }
  } catch (error) {
    console.error('批量下载失败:', error);
    toast({ text: `下载失败: ${error instanceof Error ? error.message : '未知错误'}`, type: 'error' });
  }
}

async function handlePause(urls: string[] | 'all') {
  const urlList = urls === 'all' ? ['all'] : urls;
  const result = await pauseDownload(urlList, urls === 'all');
  if (!result.code) {
    toast({ text: result.message || '已暂停下载', type: 'success' });
    if (Array.isArray(urls) && urls === tasksStore.selectedTasks) {
      tasksStore.clearSelection();
    }
  }
}

async function handleResume(urls: string[] | 'all') {
  const urlList = urls === 'all' ? ['all'] : urls;
  const result = await resumeDownload(urlList, urls === 'all');
  if (!result.code) {
    toast({ text: result.message || '已恢复下载', type: 'success' });
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
    toast({ text: result.message || '已删除选中的下载', type: 'success' });
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
    toast({ text: result.message || '已清空下载队列', type: 'success' });
  } else {
    toast({ text: result.message || '清空队列失败', type: 'error' });
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
    playErrorText.value = task.errmsg ? `错误信息：${task.errmsg}` : '';
    playConfirmMessage.value = '该任务状态为异常，可能无法正常播放。\n\n确定要继续播放吗？';
    pendingPlayData.value = { task, url };
    showPlayConfirmDialog.value = true;
    return;
  }

  // 正常状态直接播放
  doPlay(url);
}

function handlePlayConfirm() {
  if (pendingPlayData.value) {
    doPlay(pendingPlayData.value.url);
    pendingPlayData.value = null;
  }
}

function doPlay(url: string) {
  const playUrl = `./play.html?url=${encodeURIComponent(url)}`;
  window.open(playUrl, '_blank', 'width=1000,height=600');
}

function handleSelectM3u8(data: { url: string; title: string }) {
  dialogInitialData.value = {
    url: data.url,
    title: data.title,
  };
  showDialog.value = true;
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
