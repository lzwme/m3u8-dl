<template>
  <Layout>
    <div class="p-1 md:p-2">
      <CompletedList
        @show-detail="showTaskDetail"
        @local-play="handleLocalPlay"
        @delete="handleDelete"
        @redownload="handleRedownload"
      />
      <TaskDetailModal
        :visible="showDetailModal"
        :task="selectedTask"
        @close="showDetailModal = false"
      />
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
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Layout from '@/components/Layout.vue';
import CompletedList from '@/components/CompletedList.vue';
import TaskDetailModal from '@/components/TaskDetailModal.vue';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import VideoPlayer from '@/components/VideoPlayer.vue';
import { useTasksStore } from '@/stores/tasks';
import { deleteDownload, resumeDownload } from '@/utils/request';
import { toast } from '@/utils/toast';
import type { DownloadTask } from '@/types/task';

const { t } = useI18n();

const tasksStore = useTasksStore();

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

function showTaskDetail(task: DownloadTask) {
  selectedTask.value = task;
  showDetailModal.value = true;
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
  }
  deleteUrls.value = [];
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

async function handleRedownload(tasks: DownloadTask[]) {
  if (!tasks.length) return;

  // 构建下载列表，使用任务的原始选项
  const resumeUrls = tasks.map(task => task.url);

  try {
    // 更新任务状态为 resume
    tasks.forEach(task => {
      tasksStore.updateTask(task.url, {
        status: 'resume',
        progress: 0,
        speed: 0,
        remainingTime: 0,
        errmsg: undefined,
      });
    });

    // 提交下载请求
    const result = await resumeDownload(resumeUrls);
    if (!result.code) {
      toast({
        text: result.message || t('toast.downloadStarted'),
        type: 'success'
      });
    } else {
      toast({
        text: result.message || t('toast.downloadFailed'),
        type: 'error'
      });
    }
  } catch (error) {
    console.error('重新下载失败:', error);
    toast({
      text: `${t('toast.downloadFailed')}: ${error instanceof Error ? error.message : t('error.unknownError')}`,
      type: 'error'
    });
  }
}

</script>
