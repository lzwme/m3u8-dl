import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { DownloadTask, QueueStatus, TaskStatus } from '@/types/task';

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Record<string, DownloadTask>>({});
  const selectedTasks = ref<string[]>([]);
  const queueStatus = ref<QueueStatus>({
    queueLength: 0,
    activeDownloads: [],
    maxConcurrent: 5,
  });
  const searchQuery = ref('');
  const statusFilter = ref<TaskStatus | ''>('');

  const filteredTasks = computed(() => {
    const taskValues = Object.values(tasks.value);
    console.log(
      '[TasksStore] filteredTasks computed, tasks.value keys:',
      Object.keys(tasks.value).length,
      'taskValues length:',
      taskValues.length
    );
    let taskList = taskValues;

    // 过滤掉已完成的任务（已完成的任务只在已完成页面显示）
    taskList = taskList.filter(task => {
      const isCompleted = task.status === 'done' || (task.progress !== undefined && task.progress >= 100);
      return !isCompleted;
    });

    // 搜索过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      taskList = taskList.filter(task => {
        const filename = (task.localVideo || task.filename || task.dlOptions?.filename || task.url).toLowerCase();
        return filename.includes(query) || task.url.toLowerCase().includes(query);
      });
    }

    // 状态过滤
    if (statusFilter.value) {
      taskList = taskList.filter(task => task.status === statusFilter.value);
    }

    // 排序：resume > pending > pause > error > done
    const statusOrder: Record<TaskStatus, number> = {
      resume: 0,
      pending: 1,
      pause: 2,
      error: 3,
      done: 4,
    };
    taskList.sort((a, b) => {
      const orderDiff = statusOrder[a.status] - statusOrder[b.status];
      if (orderDiff !== 0) return orderDiff;
      if (a.status === 'done') {
        return (b.filename || '').localeCompare(a.filename || '');
      }
      return (a.startTime || 0) - (b.startTime || 0);
    });

    // 更新 queueStatus（不直接修改 queueStatus，而是创建新对象）
    const newQueueStatus: QueueStatus = {
      queueLength: 0,
      activeDownloads: [],
      maxConcurrent: queueStatus.value.maxConcurrent,
    };
    taskList.forEach(task => {
      task.showName = task.filename || task.dlOptions?.filename || task.localVideo || task.url;
      if (task.status === 'pending') {
        newQueueStatus.queueLength++;
      } else if (task.status === 'resume') {
        newQueueStatus.activeDownloads.push(task.url);
      }
    });
    // 只在值发生变化时更新，避免不必要的响应式触发
    if (
      newQueueStatus.queueLength !== queueStatus.value.queueLength ||
      newQueueStatus.activeDownloads.length !== queueStatus.value.activeDownloads.length
    ) {
      queueStatus.value = newQueueStatus;
    }

    return taskList;
  });

  function setTasks(newTasks: Record<string, DownloadTask>) {
    console.log('[TasksStore] setTasks 被调用，任务数量:', Object.keys(newTasks || {}).length);
    if (newTasks && typeof newTasks === 'object') {
      tasks.value = newTasks;
      console.log('[TasksStore] 任务已更新，当前任务数量:', Object.keys(tasks.value).length);
    } else {
      console.warn('[TasksStore] setTasks 收到无效数据:', newTasks);
    }
  }

  function updateTask(url: string, updates: Partial<DownloadTask>) {
    if (tasks.value[url]) {
      tasks.value[url] = { ...tasks.value[url], ...updates };
    }
  }

  function updateTasks(updates: Array<{ url: string; data: Partial<DownloadTask> }>) {
    updates.forEach(({ url, data }) => {
      if (tasks.value[url]) {
        tasks.value[url] = { ...tasks.value[url], ...data };
      }
    });
  }

  function deleteTasks(urls: string[]) {
    urls.forEach(url => {
      delete tasks.value[url];
    });
  }

  function toggleTaskSelection(url: string) {
    const index = selectedTasks.value.indexOf(url);
    if (index === -1) {
      selectedTasks.value.push(url);
    } else {
      selectedTasks.value.splice(index, 1);
    }
  }

  function toggleSelectAll() {
    const isSelectedAll = selectedTasks.value.length === filteredTasks.value.length;
    selectedTasks.value = isSelectedAll ? [] : filteredTasks.value.map(task => task.url);
  }

  function clearSelection() {
    selectedTasks.value = [];
  }

  function clearFilters() {
    searchQuery.value = '';
    statusFilter.value = '';
  }

  return {
    tasks,
    selectedTasks,
    queueStatus,
    searchQuery,
    statusFilter,
    filteredTasks,
    setTasks,
    updateTask,
    updateTasks,
    deleteTasks,
    toggleTaskSelection,
    toggleSelectAll,
    clearSelection,
    clearFilters,
  };
});
