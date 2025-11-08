<template>
  <div class="bg-white rounded-lg shadow">
    <div class="p-4">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold">已完成任务</h2>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">共 {{ completedTasks.length }} 项</span>
        </div>
      </div>
    </div>

    <!-- 排序控制 -->
    <div class="px-4 pb-2 border-b">
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <label class="text-sm text-gray-600">排序方式：</label>
          <select
            v-model="sortField"
            @change="handleSortChange"
            class="px-3 py-1 text-sm border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="startTime">开始时间</option>
            <option value="endTime">结束时间</option>
            <option value="name">名称</option>
            <option value="size">大小</option>
            <option value="saveDir">保存位置</option>
          </select>
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="toggleSortOrder"
            class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center"
            :title="sortOrder === 'asc' ? '升序' : '降序'"
          >
            <i class="fas" :class="sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down'"></i>
            <span class="ml-1">{{ sortOrder === 'asc' ? '升序' : '降序' }}</span>
          </button>
        </div>
        <div class="flex-1"></div>
        <div class="flex items-center space-x-2">
          <input
            type="text"
            v-model="searchInput"
            class="px-3 py-1 text-sm border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="搜索任务名称或URL地址"
            @input="handleSearch"
          />
          <i class="fas fa-search text-gray-400"></i>
        </div>
      </div>
    </div>

    <!-- 表格头部 -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleSelectAll"
                class="form-checkbox h-4 w-4 text-blue-500 rounded focus:ring-blue-500"
              />
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              任务名称
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              文件大小
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              开始时间
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              结束时间
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="task in sortedTasks"
            :key="task.url"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-4 py-3 whitespace-nowrap">
              <input
                type="checkbox"
                :checked="selectedTasks.includes(task.url)"
                @change="toggleTaskSelection(task.url)"
                class="form-checkbox h-4 w-4 text-blue-500 rounded focus:ring-blue-500"
              />
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm">
              <div class="flex items-center space-x-2">
                <button
                  @click="showTaskDetail(task)"
                  class="text-blue-600 hover:text-blue-800"
                  title="查看详情"
                >
                  <i class="fas fa-info-circle"></i>
                </button>
                <button
                  v-if="config?.showLocalPlay && task.localVideo"
                  @click="localPlay(task)"
                  class="text-green-600 hover:text-green-800"
                  title="播放"
                >
                  <i class="fas fa-play-circle"></i>
                </button>
                <button
                  @click="deleteTask(task.url)"
                  class="text-red-600 hover:text-red-800"
                  title="删除"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate" :title="task.showName">
                    {{ task.showName }}
                  </p>
                  <p class="text-xs text-gray-500 truncate" :title="task.url">
                    {{ task.url }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
              {{ formatSize(task.downloadedSize || task.size || 0) }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
              {{ formatDateTime(task.startTime) }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
              {{ formatDateTime(task.endTime) }}
            </td>
          </tr>
          <tr v-if="sortedTasks.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-500">
              <div class="flex flex-col items-center">
                <i class="fas fa-inbox text-4xl mb-2 text-gray-300"></i>
                <p>暂无已完成的任务</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 批量操作栏 -->
    <div
      v-if="selectedTasks.length > 0"
      class="px-4 py-3 bg-blue-50 border-t flex items-center justify-between"
    >
      <span class="text-sm text-gray-700">已选择 {{ selectedTasks.length }} 项</span>
      <div class="flex items-center space-x-2">
        <button
          @click="handleBatchDelete"
          class="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded"
        >
          <i class="fas fa-trash mr-1"></i>删除选中
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTasksStore } from '@/stores/tasks';
import { useConfigStore } from '@/stores/config';
import { formatSize } from '@/utils/format';
import type { DownloadTask } from '@/types/task';

const tasksStore = useTasksStore();
const configStore = useConfigStore();

const sortField = ref<'startTime' | 'endTime' | 'name' | 'size' | 'saveDir'>('endTime');
const sortOrder = ref<'asc' | 'desc'>('desc');
const searchInput = ref('');

// 获取已完成的任务（progress === 100 或 status === 'done'）
const completedTasks = computed(() => {
  const allTasks = Object.values(tasksStore.tasks);
  const completed = allTasks.filter(
    task => (task.status === 'done' || (task.progress !== undefined && task.progress >= 100))
  );
  // 设置 showName，与 tasks store 中的逻辑保持一致
  completed.forEach(task => {
    task.showName = task.filename || task.dlOptions?.filename || task.localVideo || task.url;
  });
  return completed;
});

// 搜索过滤
const filteredTasks = computed(() => {
  if (!searchInput.value.trim()) {
    return completedTasks.value;
  }
  const query = searchInput.value.toLowerCase();
  return completedTasks.value.filter(task => {
    const name = (task.showName || task.filename || task.url || '').toLowerCase();
    const url = (task.url || '').toLowerCase();
    // 支持按任务名称或URL地址搜索
    return name.includes(query) || url.includes(query);
  });
});

// 排序后的任务列表
const sortedTasks = computed(() => {
  const tasks = [...filteredTasks.value];

  tasks.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField.value) {
      case 'startTime':
        aValue = a.startTime || 0;
        bValue = b.startTime || 0;
        break;
      case 'endTime':
        aValue = a.endTime || 0;
        bValue = b.endTime || 0;
        break;
      case 'name':
        aValue = (a.showName || a.filename || a.url || '').toLowerCase();
        bValue = (b.showName || b.filename || b.url || '').toLowerCase();
        break;
      case 'size':
        aValue = a.downloadedSize || a.size || 0;
        bValue = b.downloadedSize || b.size || 0;
        break;
      case 'saveDir':
        aValue = (a.dlOptions?.saveDir || a.options?.saveDir || '').toLowerCase();
        bValue = (b.dlOptions?.saveDir || b.options?.saveDir || '').toLowerCase();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortOrder.value === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder.value === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return tasks;
});

const selectedTasks = ref<string[]>([]);

const isAllSelected = computed(
  () => sortedTasks.value.length > 0 && selectedTasks.value.length === sortedTasks.value.length
);

const isIndeterminate = computed(
  () => selectedTasks.value.length > 0 && selectedTasks.value.length < sortedTasks.value.length
);

function handleSortChange() {
  // 排序字段改变时，可以重置排序顺序或保持当前顺序
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
}

function handleSearch() {
  // 搜索已通过 computed 自动处理
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedTasks.value = [];
  } else {
    selectedTasks.value = sortedTasks.value.map(task => task.url);
  }
}

function toggleTaskSelection(url: string) {
  const index = selectedTasks.value.indexOf(url);
  if (index === -1) {
    selectedTasks.value.push(url);
  } else {
    selectedTasks.value.splice(index, 1);
  }
}

function formatDateTime(timestamp?: number): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// 在模板中使用 configStore.config.showLocalPlay，Pinia 会自动解包 ref
// 为了类型安全，使用 computed 来访问
const config = computed(() => configStore.config);

const emit = defineEmits<{
  (e: 'show-detail', task: DownloadTask): void;
  (e: 'local-play', data: { task: DownloadTask; url: string }): void;
  (e: 'delete', urls: string[]): void;
}>();

function showTaskDetail(task: DownloadTask) {
  emit('show-detail', task);
}

function localPlay(task: DownloadTask) {
  const url =
    location.origin +
    `/localplay/${encodeURIComponent(task.localVideo || '') || task.localM3u8}`;
  emit('local-play', { task, url });
}

function deleteTask(url: string) {
  emit('delete', [url]);
}

function handleBatchDelete() {
  if (selectedTasks.value.length > 0) {
    emit('delete', selectedTasks.value);
    selectedTasks.value = [];
  }
}
</script>
