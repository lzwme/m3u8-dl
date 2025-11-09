<template>
  <div class="bg-white rounded-lg shadow">
    <div class="p-4">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold">{{ $t('taskList.title') }}</h2>
        <div class="flex space-x-2">
          <button
            @click="$emit('new-download')"
            class="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            <i class="fas fa-plus mr-1"></i>{{ $t('taskList.new') }}
          </button>
          <button
            v-if="selectedTasks.length > 0"
            @click="$emit('pause', selectedTasks)"
            class="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            <i class="fas fa-pause mr-1"></i>{{ $t('taskList.pauseSelected') }}
          </button>
          <button
            v-if="selectedTasks.length > 0"
            @click="$emit('resume', selectedTasks)"
            class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            <i class="fas fa-play mr-1"></i>{{ $t('taskList.resumeSelected') }}
          </button>
          <button
            v-if="selectedTasks.length > 0"
            @click="$emit('delete', selectedTasks)"
            class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            <i class="fas fa-trash mr-1"></i>{{ $t('taskList.deleteSelected') }}
          </button>
          <button
            v-if="selectedTasks.length === 0"
            @click="$emit('pause', 'all')"
            class="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            <i class="fas fa-pause mr-1"></i>{{ $t('taskList.pauseAll') }}
          </button>
          <button
            v-if="selectedTasks.length === 0"
            @click="$emit('resume', 'all')"
            class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            <i class="fas fa-play mr-1"></i>{{ $t('taskList.resumeAll') }}
          </button>
          <button
            v-if="selectedTasks.length === 0"
            @click="$emit('clear-queue')"
            class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            <i class="fas fa-trash mr-1"></i>{{ $t('taskList.clearQueue') }}
          </button>
        </div>
      </div>
      <div class="mt-4 flex items-center space-x-4">
        <div class="flex-1">
          <div class="relative">
            <input
              type="text"
              v-model="searchInput"
              class="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              :placeholder="$t('taskList.searchPlaceholder')"
              :aria-label="$t('taskList.searchLabel')"
            />
            <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <select
            :value="statusFilter"
            @change="updateStatusFilter"
            class="px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            :title="$t('taskList.filterByStatus')"
            :aria-label="$t('taskList.filterByStatus')"
          >
            <option value="">{{ $t('taskList.all') }}</option>
            <option value="resume">{{ $t('taskList.status.resume') }}</option>
            <option value="pending">{{ $t('taskList.status.pending') }}</option>
            <option value="pause">{{ $t('taskList.status.pause') }}</option>
            <option value="error">{{ $t('taskList.status.error') }}</option>
            <!-- <option value="done">已完成</option> -->
          </select>
          <button
            @click="clearFilters"
            class="px-3 py-2 text-gray-600 hover:text-gray-800"
            :title="$t('taskList.clearFilters')"
            :aria-label="$t('taskList.clearFilters')"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="text-sm text-gray-600 border-b bg-gray-50">
      <div class="flex items-center space-x-4 px-4 py-2">
        <div class="flex items-center">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate="isIndeterminate"
            @change="toggleSelectAll"
            class="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-500 mr-2"
            :title="$t('taskList.selectAll')"
          />
          <span class="text-gray-700 text-sm">{{ $t('taskList.selectAll') }}</span>
          <span class="ml-4 text-gray-400 text-xs">
            {{ $t('taskList.selected') }} {{ selectedTasks.length }} / {{ filteredTasks.length }}
          </span>
        </div>
        <div class="flex items-center">
          <i class="fas fa-tasks text-blue-600 mr-1"></i>
          <span>{{ $t('taskList.total') }}: {{ filteredTasks.length }}</span>
        </div>
        <div class="flex items-center">
          <i class="fas fa-clock text-yellow-500 mr-1"></i>
          <span>{{ $t('taskList.pending') }}: {{ queueStatus.queueLength }}</span>
        </div>
        <div class="flex items-center">
          <i class="fas fa-download text-green-500 mr-1"></i>
          <span>{{ $t('taskList.downloading') }}: {{ queueStatus.activeDownloads.length }}</span>
        </div>
      </div>
    </div>

    <div class="divide-y overflow-auto max-h-[calc(100vh-200px)]">
      <!-- 调试信息 -->
      <div v-if="false" class="p-4 text-xs text-gray-500">
        调试: filteredTasks.length = {{ filteredTasks.length }},
        tasksStore.tasks keys = {{ Object.keys(tasksStore.tasks || {}).length }}
      </div>
      <TaskItem
        v-for="task in filteredTasks"
        :key="task.url"
        :task="task"
        :is-selected="selectedTasks.includes(task.url)"
        @toggle-select="toggleTaskSelection(task.url)"
        @show-detail="showTaskDetail(task)"
        @preview="preview(task.url)"
        @local-play="localPlay(task)"
        @pause="pauseTask(task.url)"
        @resume="resumeTask(task.url)"
        @delete="deleteTask(task.url)"
      />
      <EmptyState v-if="filteredTasks.length === 0" @new-download="$emit('new-download')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTasksStore } from '@/stores/tasks';
import TaskItem from './TaskItem.vue';
import EmptyState from './EmptyState.vue';
import type { DownloadTask } from '@/types/task';
import { toast } from '@/utils/toast';

const { t } = useI18n();

const tasksStore = useTasksStore();

const filteredTasks = computed(() => {
  const tasks = tasksStore.filteredTasks;
  console.log('[TaskList] filteredTasks computed, 数量:', tasks.length);
  return tasks;
});
const selectedTasks = computed(() => tasksStore.selectedTasks);
const queueStatus = computed(() => tasksStore.queueStatus);
const statusFilter = computed(() => tasksStore.statusFilter);

const searchInput = ref(tasksStore.searchQuery);

// 使用 watch 监听 searchInput 的变化，并防抖更新 store
let searchTimeout: number | null = null;
watch(searchInput, (value) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = window.setTimeout(() => {
    tasksStore.searchQuery = value;
  }, 300);
});

const isAllSelected = computed(
  () =>
    filteredTasks.value.length > 0 &&
    selectedTasks.value.length === filteredTasks.value.length
);
const isIndeterminate = computed(
  () =>
    selectedTasks.value.length > 0 &&
    selectedTasks.value.length < filteredTasks.value.length
);

function updateStatusFilter(e: Event) {
  const target = e.target as HTMLSelectElement;
  tasksStore.statusFilter = target.value as any;
}

function clearFilters() {
  tasksStore.clearFilters();
}

function toggleSelectAll() {
  tasksStore.toggleSelectAll();
}

function toggleTaskSelection(url: string) {
  tasksStore.toggleTaskSelection(url);
}

const emit = defineEmits<{
  (e: 'new-download'): void;
  (e: 'pause', urls: string[] | 'all'): void;
  (e: 'resume', urls: string[] | 'all'): void;
  (e: 'delete', urls: string[]): void;
  (e: 'clear-queue'): void;
  (e: 'show-detail', task: DownloadTask): void;
  (e: 'local-play', data: { task: DownloadTask; url: string }): void;
}>();

function pauseTask(url: string) {
  emit('pause', [url]);
}

function resumeTask(url: string) {
  emit('resume', [url]);
}

function deleteTask(url: string) {
  emit('delete', [url]);
}

function showTaskDetail(task: DownloadTask) {
  emit('show-detail', task);
}

function preview(url: string) {
  window.open(`https://lzw.me/x/m3u8-player/?url=${encodeURIComponent(url)}`);
}

function localPlay(task: DownloadTask) {

  const localPath = task.localVideo || task.localM3u8;
  if (!localPath) {
    console.error('[TaskList] localPlay: task 缺少本地文件路径', task);
    toast({ text: t('error.noLocalFile'), type: 'error' });
    return;
  }

  const url =
    location.origin +
    `/localplay/${localPath}`;
  emit('local-play', { task, url });
}
</script>
