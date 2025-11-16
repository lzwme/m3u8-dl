<template>
  <div class="bg-white rounded-lg shadow">
    <div class="p-4">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold">{{ $t('completedList.title') }}</h2>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">{{ $t('completedList.total', { count: completedTasks.length }) }}</span>
        </div>
      </div>
    </div>

    <!-- 排序控制 -->
    <div class="px-2 sm:px-4 pb-2 border-b">
      <div class="flex flex-wrap items-center gap-2 sm:gap-4">
        <div class="flex items-center space-x-2 flex-shrink-0">
          <label class="text-sm text-gray-600 hidden sm:inline">{{ $t('completedList.sortBy') }}</label>
          <select
            v-model="sortField"
            @change="handleSortChange"
            class="px-2 sm:px-3 py-1 text-sm border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="startTime">{{ $t('completedList.sortStartTime') }}</option>
            <option value="endTime">{{ $t('completedList.sortEndTime') }}</option>
            <option value="name">{{ $t('completedList.sortName') }}</option>
            <option value="size">{{ $t('completedList.sortSize') }}</option>
            <option value="saveDir">{{ $t('completedList.sortSaveDir') }}</option>
          </select>
        </div>
        <div class="flex items-center space-x-2 flex-shrink-0">
          <button
            @click="toggleSortOrder"
            class="px-2 sm:px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center"
            :title="sortOrder === 'asc' ? $t('completedList.ascending') : $t('completedList.descending')"
          >
            <i class="fas" :class="sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down'"></i>
            <span class="ml-1 hidden sm:inline">{{ sortOrder === 'asc' ? $t('completedList.ascending') : $t('completedList.descending') }}</span>
          </button>
        </div>
        <div class="flex-1 hidden sm:block"></div>
        <div class="flex items-center space-x-2 flex-shrink-0">
          <button
            @click="toggleFavoriteFilter"
            class="px-2 sm:px-3 py-1 text-sm rounded-lg flex items-center transition-colors"
            :class="showFavoritesOnly ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 hover:bg-gray-200'"
            :title="$t('completedList.showFavorites')"
          >
            <i :class="showFavoritesOnly ? 'fas fa-star' : 'far fa-star'"></i>
            <span class="ml-1 hidden sm:inline">{{ $t('completedList.favorites') }}</span>
          </button>
        </div>
        <div class="flex items-center space-x-2 flex-1 min-w-0 sm:flex-initial sm:min-w-[200px]">
          <input
            type="text"
            v-model="searchInput"
            class="flex-1 px-2 sm:px-3 py-1 text-sm border rounded-lg focus:ring-blue-500 focus:border-blue-500 min-w-0"
            :placeholder="$t('completedList.searchPlaceholder')"
            @input="handleSearch"
          />
          <i class="fas fa-search text-gray-400 flex-shrink-0"></i>
        </div>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div
      v-if="selectedTasks.length > 0"
      class="px-4 py-3 bg-blue-50 border-t flex items-center justify-between"
    >
      <div class="flex items-center space-x-2">
        <button
          @click="handleBatchDelete"
          class="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded"
        >
          <i class="fas fa-trash mr-1"></i>{{ $t('completedList.deleteSelected') }}
        </button>
      </div>
      <span class="text-sm text-gray-700">{{ $t('completedList.selected', { count: selectedTasks.length }) }}</span>
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
              {{ $t('completedList.action') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ $t('completedList.taskName') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ $t('completedList.fileSize') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ $t('completedList.startTime') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {{ $t('completedList.endTime') }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="task in paginatedTasks"
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
                  v-if="task.localVideo"
                  @click="localPlay(task)"
                  class="text-green-600 hover:text-green-800"
                  :title="$t('completedList.play')"
                >
                  <i class="fas fa-play-circle"></i>
                </button>
                <button
                  @click="toggleTaskFavorite(task.url)"
                  class="transition-colors"
                  :class="isTaskFavorite(task.url) ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-yellow-500'"
                  :title="isTaskFavorite(task.url) ? $t('completedList.removeFavorite') : $t('completedList.addFavorite')"
                >
                  <i :class="isTaskFavorite(task.url) ? 'fas fa-star' : 'far fa-star'"></i>
                </button>
                <button
                  @click="showTaskDetail(task)"
                  class="text-blue-600 hover:text-blue-800"
                  :title="$t('completedList.viewDetail')"
                >
                  <i class="fas fa-info-circle"></i>
                </button>
                <button
                  v-if="task.status === 'done' && !task.errmsg"
                  @click="showRenameDialog(task)"
                  class="text-purple-600 hover:text-purple-800"
                  :title="$t('completedList.rename')"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  @click="deleteTask(task.url)"
                  class="text-red-600 hover:text-red-800"
                  :title="$t('completedList.delete')"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate max-w-[calc(35vw)]" :title="task.showName">
                    {{ task.showName }}
                  </p>
                  <p class="text-xs text-gray-500 truncate max-w-[calc(35vw)]" :title="task.url">
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
          <tr v-if="paginatedTasks.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-500">
              <div class="flex flex-col items-center">
                <i class="fas fa-inbox text-4xl mb-2 text-gray-300"></i>
                <p>{{ $t('completedList.noCompletedTasks') }}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页控件 -->
    <div
      v-if="sortedTasks.length > 0"
      class="px-4 py-3 border-t bg-gray-50 flex items-center justify-between flex-wrap gap-2"
    >
      <div class="flex items-center space-x-2">
        <label class="text-sm text-gray-600">{{ $t('completedList.pageSize') }}</label>
        <select
          v-model.number="pageSize"
          @change="handlePageSizeChange"
          class="px-2 py-1 text-sm border rounded-lg focus:ring-blue-500 focus:border-blue-500"
        >
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span class="text-sm text-gray-600">{{ $t('completedList.itemsPerPage') }}</span>
      </div>

      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-600">
          {{ $t('completedList.pageInfo', { current: currentPage, total: totalPages }) }}
        </span>
        <div class="flex items-center space-x-1">
          <button
            @click="goToFirstPage"
            :disabled="currentPage === 1"
            class="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            :title="$t('completedList.firstPage')"
          >
            <i class="fas fa-angle-double-left"></i>
          </button>
          <button
            @click="goToPreviousPage"
            :disabled="currentPage === 1"
            class="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            :title="$t('completedList.previousPage')"
          >
            <i class="fas fa-angle-left"></i>
          </button>
          <div class="flex items-center space-x-1">
            <input
              type="number"
              v-model="goToPageInput"
              @keyup.enter="handleGoToPageInput"
              :min="1"
              :max="totalPages"
              class="w-16 px-2 py-1 text-sm border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center"
              :placeholder="String(currentPage)"
            />
            <button
              @click="handleGoToPageInput"
              class="px-2 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              {{ $t('completedList.goToPage') }}
            </button>
          </div>
          <button
            @click="goToNextPage"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            :title="$t('completedList.nextPage')"
          >
            <i class="fas fa-angle-right"></i>
          </button>
          <button
            @click="goToLastPage"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            :title="$t('completedList.lastPage')"
          >
            <i class="fas fa-angle-double-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 重命名对话框 -->
    <RenameDialog
      ref="renameDialogRef"
      :visible="showRenameModal"
      :task="renameTask"
      @close="closeRenameDialog"
      @success="handleRenameSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTasksStore } from '@/stores/tasks';
// import { useConfigStore } from '@/stores/config';
import { formatSize } from '@/utils/format';
import { useFavoritesStore } from '@/stores/favorites';
import RenameDialog from './RenameDialog.vue';
import type { DownloadTask } from '@/types/task';

const tasksStore = useTasksStore();
const favoritesStore = useFavoritesStore();
// const configStore = useConfigStore();

const sortField = ref<'startTime' | 'endTime' | 'name' | 'size' | 'saveDir'>('endTime');
const sortOrder = ref<'asc' | 'desc'>('desc');
const searchInput = ref('');
const showFavoritesOnly = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const goToPageInput = ref('');

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

// 搜索和收藏过滤
const filteredTasks = computed(() => {
  let tasks = completedTasks.value;

  // 收藏过滤
  if (showFavoritesOnly.value) {
    tasks = tasks.filter(task => favoritesStore.isFavorite(task.url));
  }

  // 搜索过滤
  if (searchInput.value.trim()) {
    const query = searchInput.value.toLowerCase();
    tasks = tasks.filter(task => {
      const name = (task.showName || task.filename || task.url || '').toLowerCase();
      const url = (task.url || '').toLowerCase();
      // 支持按任务名称或URL地址搜索
      return name.includes(query) || url.includes(query);
    });
  }

  return tasks;
});

// 排序后的任务列表（所有数据）
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

// 总页数
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(sortedTasks.value.length / pageSize.value));
});

// 当前页显示的任务列表
const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return sortedTasks.value.slice(start, end);
});

const selectedTasks = ref<string[]>([]);

const isAllSelected = computed(
  () => paginatedTasks.value.length > 0 && selectedTasks.value.length === paginatedTasks.value.length &&
    paginatedTasks.value.every(task => selectedTasks.value.includes(task.url))
);

const isIndeterminate = computed(
  () => {
    const pageSelectedCount = paginatedTasks.value.filter(task => selectedTasks.value.includes(task.url)).length;
    return pageSelectedCount > 0 && pageSelectedCount < paginatedTasks.value.length;
  }
);

function handleSortChange() {
  // 排序字段改变时，重置到第一页
  currentPage.value = 1;
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  // 排序顺序改变时，重置到第一页
  currentPage.value = 1;
}

function handleSearch() {
  // 搜索已通过 computed 自动处理，重置到第一页
  currentPage.value = 1;
}

function toggleFavoriteFilter() {
  showFavoritesOnly.value = !showFavoritesOnly.value;
  currentPage.value = 1;
}

function isTaskFavorite(url: string): boolean {
  return favoritesStore.isFavorite(url);
}

function toggleTaskFavorite(url: string) {
  favoritesStore.toggleFavorite(url);
}

function toggleSelectAll() {
  const pageTaskUrls = paginatedTasks.value.map(task => task.url);
  const allPageSelected = pageTaskUrls.every(url => selectedTasks.value.includes(url));

  if (allPageSelected) {
    // 取消选择当前页的所有任务
    selectedTasks.value = selectedTasks.value.filter(url => !pageTaskUrls.includes(url));
  } else {
    // 选择当前页的所有任务（保留已选择的其他任务）
    pageTaskUrls.forEach(url => {
      if (!selectedTasks.value.includes(url)) {
        selectedTasks.value.push(url);
      }
    });
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
  // Use locale from i18n
  const { locale } = useI18n();
  const dateLocale = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US';
  return date.toLocaleString(dateLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// 为了类型安全，使用 computed 来访问
// const config = computed(() => configStore.config);

const emit = defineEmits<{
  (e: 'show-detail', task: DownloadTask): void;
  (e: 'local-play', data: { task: DownloadTask; url: string }): void;
  (e: 'delete', urls: string[]): void;
}>();

const showRenameModal = ref(false);
const renameTask = ref<DownloadTask | null>(null);
const renameDialogRef = ref<InstanceType<typeof RenameDialog> | null>(null);

function showRenameDialog(task: DownloadTask) {
  renameTask.value = task;
  showRenameModal.value = true;
}

function closeRenameDialog() {
  showRenameModal.value = false;
  renameTask.value = null;
}

function handleRenameSuccess() {
  // 重命名成功，关闭对话框
  closeRenameDialog();
}

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

// 分页相关方法
function goToPage(page: number) {
  const targetPage = Math.max(1, Math.min(page, totalPages.value));
  currentPage.value = targetPage;
  goToPageInput.value = '';
}

function goToFirstPage() {
  currentPage.value = 1;
}

function goToLastPage() {
  currentPage.value = totalPages.value;
}

function goToPreviousPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function goToNextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function handlePageSizeChange() {
  // 每页数量改变时，重新计算当前页
  const maxPage = totalPages.value;
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage;
  }
}

function handleGoToPageInput() {
  const page = parseInt(goToPageInput.value);
  if (!isNaN(page) && page > 0) {
    goToPage(page);
  }
}

// 监听搜索、排序和收藏过滤变化，重置到第一页
watch([searchInput, sortField, sortOrder, showFavoritesOnly], () => {
  currentPage.value = 1;
});

// 暴露方法供父组件调用
defineExpose({
  closeRenameDialog,
});
</script>
